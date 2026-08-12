const express = require('express');
const request = require('supertest');

jest.mock('../src/models/User');
jest.mock('../src/models/Activity', () => ({ create: jest.fn().mockResolvedValue({}) }));
jest.mock('../src/models/ActivityLog', () => ({ create: jest.fn().mockResolvedValue({}) }));
jest.mock('../src/config/socket', () => ({ getIO: () => null }));

const User = require('../src/models/User');
const { register } = require('../src/controllers/authController');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.post('/register', register);
  app.use((err, req, res, _next) => res.status(500).json({ success: false, message: err.message }));
  return app;
}

const ORIGINAL_ENV = process.env.NODE_ENV;

beforeEach(() => {
  User.findOne.mockResolvedValue(null);
  User.create.mockImplementation(async (data) => ({
    ...data,
    _id: 'new-user-id',
    generateAuthToken: () => 'signed.jwt.token',
    toJSON() {
      // Mirrors the real model: credentials are stripped on serialization.
      const { password, refreshToken, verificationToken, ...rest } = this;
      return rest;
    },
  }));
});

afterEach(() => {
  process.env.NODE_ENV = ORIGINAL_ENV;
  jest.clearAllMocks();
});

const validBody = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  password: 'Passw0rd',
};

describe('POST /register — token exposure', () => {
  it('does not return the verification token in production', async () => {
    process.env.NODE_ENV = 'production';

    const res = await request(buildApp()).post('/register').send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.data.verificationToken).toBeUndefined();
  });

  it('returns the verification token outside production so the flow stays testable', async () => {
    process.env.NODE_ENV = 'development';

    const res = await request(buildApp()).post('/register').send(validBody);

    expect(res.body.data.verificationToken).toMatch(/^[0-9a-f]{64}$/);
  });

  it('still returns the access and refresh tokens the client needs', async () => {
    process.env.NODE_ENV = 'production';

    const res = await request(buildApp()).post('/register').send(validBody);

    expect(res.body.data.token).toBe('signed.jwt.token');
    expect(res.body.data.refreshToken).toEqual(expect.any(String));
    expect(res.body.data.user).toBeDefined();
  });

  it('does not leak the verification token anywhere else in the production payload', async () => {
    process.env.NODE_ENV = 'production';

    const res = await request(buildApp()).post('/register').send(validBody);

    const created = User.create.mock.calls[0][0];
    expect(created.verificationToken).toMatch(/^[0-9a-f]{64}$/);
    // The value is persisted, but must not appear in the response at all.
    expect(JSON.stringify(res.body)).not.toContain(created.verificationToken);
  });
});
