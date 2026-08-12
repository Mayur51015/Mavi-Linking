const express = require('express');
const request = require('supertest');

// The controller only needs the User model and the audit log for these two
// routes; everything else it pulls in is stubbed so the suite stays a unit test
// and doesn't require a running MongoDB.
jest.mock('../src/models/User');
jest.mock('../src/models/Activity', () => ({ create: jest.fn().mockResolvedValue({}) }));
jest.mock('../src/models/ActivityLog', () => ({ create: jest.fn().mockResolvedValue({}) }));
jest.mock('../src/config/socket', () => ({ getIO: () => null }));

const User = require('../src/models/User');
const ActivityLog = require('../src/models/ActivityLog');
const { hashToken } = require('../src/utils/tokenUtils');
const { forgotPassword, resetPassword } = require('../src/controllers/authController');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.post('/forgot-password', forgotPassword);
  app.post('/reset-password', resetPassword);
  // Mirrors the real global error handler closely enough for assertions.
  app.use((err, req, res, _next) => res.status(500).json({ success: false, message: err.message }));
  return app;
}

function fakeUser(overrides = {}) {
  return {
    _id: 'user-id-1',
    email: 'victim@example.com',
    password: 'OldPassw0rd',
    resetPasswordToken: null,
    resetPasswordExpires: null,
    refreshToken: 'existing-refresh-token',
    passwordChangedAt: null,
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
}

const ORIGINAL_ENV = process.env.NODE_ENV;

afterEach(() => {
  process.env.NODE_ENV = ORIGINAL_ENV;
  jest.clearAllMocks();
});

describe('POST /forgot-password', () => {
  it('returns 200 with a generic message when the account does not exist', async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(buildApp())
      .post('/forgot-password')
      .send({ email: 'nobody@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/if an account exists/i);
  });

  it('returns an identical status and message for an existing account', async () => {
    User.findOne.mockResolvedValue(null);
    const missing = await request(buildApp()).post('/forgot-password').send({ email: 'nobody@example.com' });

    User.findOne.mockResolvedValue(fakeUser());
    const existing = await request(buildApp()).post('/forgot-password').send({ email: 'victim@example.com' });

    // The whole point: an attacker can't tell these two apart.
    expect(existing.status).toBe(missing.status);
    expect(existing.body.message).toBe(missing.body.message);
  });

  it('rejects a request with no email', async () => {
    const res = await request(buildApp()).post('/forgot-password').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('stores the hash of the token, never the token itself', async () => {
    process.env.NODE_ENV = 'development';
    const user = fakeUser();
    User.findOne.mockResolvedValue(user);

    const res = await request(buildApp()).post('/forgot-password').send({ email: user.email });

    const rawToken = res.body.data.resetToken;
    expect(rawToken).toBeTruthy();
    expect(user.resetPasswordToken).toBe(hashToken(rawToken));
    expect(user.resetPasswordToken).not.toBe(rawToken);
    expect(user.save).toHaveBeenCalled();
  });

  it('sets an expiry roughly one hour out', async () => {
    const user = fakeUser();
    User.findOne.mockResolvedValue(user);

    await request(buildApp()).post('/forgot-password').send({ email: user.email });

    const delta = user.resetPasswordExpires - Date.now();
    expect(delta).toBeGreaterThan(55 * 60 * 1000);
    expect(delta).toBeLessThanOrEqual(60 * 60 * 1000);
  });

  it('does NOT return the reset token when NODE_ENV is production', async () => {
    process.env.NODE_ENV = 'production';
    User.findOne.mockResolvedValue(fakeUser());

    const res = await request(buildApp()).post('/forgot-password').send({ email: 'victim@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toMatch(/[0-9a-f]{64}/);
  });

  it('returns the reset token outside production so the flow stays testable', async () => {
    process.env.NODE_ENV = 'development';
    User.findOne.mockResolvedValue(fakeUser());

    const res = await request(buildApp()).post('/forgot-password').send({ email: 'victim@example.com' });

    expect(res.body.data.resetToken).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('POST /reset-password', () => {
  it('looks the user up by the hashed token, not the raw one', async () => {
    const user = fakeUser();
    User.findOne.mockResolvedValue(user);

    await request(buildApp())
      .post('/reset-password')
      .send({ token: 'raw-token-abc', password: 'NewPassw0rd' });

    const filter = User.findOne.mock.calls[0][0];
    expect(filter.resetPasswordToken).toBe(hashToken('raw-token-abc'));
    expect(filter.resetPasswordToken).not.toBe('raw-token-abc');
    expect(filter.resetPasswordExpires).toHaveProperty('$gt');
  });

  it('rejects an unknown or expired token', async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(buildApp())
      .post('/reset-password')
      .send({ token: 'bogus', password: 'NewPassw0rd' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid or expired/i);
  });

  it('requires both a token and a password', async () => {
    const noPassword = await request(buildApp()).post('/reset-password').send({ token: 'abc' });
    const noToken = await request(buildApp()).post('/reset-password').send({ password: 'NewPassw0rd' });

    expect(noPassword.status).toBe(400);
    expect(noToken.status).toBe(400);
  });

  it('clears the reset token so it cannot be replayed', async () => {
    const user = fakeUser();
    User.findOne.mockResolvedValue(user);

    await request(buildApp()).post('/reset-password').send({ token: 'abc', password: 'NewPassw0rd' });

    expect(user.resetPasswordToken).toBeNull();
    expect(user.resetPasswordExpires).toBeNull();
  });

  it('revokes the refresh token so an existing session cannot survive the reset', async () => {
    const user = fakeUser({ refreshToken: 'attacker-held-token' });
    User.findOne.mockResolvedValue(user);

    await request(buildApp()).post('/reset-password').send({ token: 'abc', password: 'NewPassw0rd' });

    expect(user.refreshToken).toBeNull();
  });

  it('stamps passwordChangedAt so previously issued JWTs are rejected', async () => {
    const user = fakeUser();
    const before = Date.now();
    User.findOne.mockResolvedValue(user);

    await request(buildApp()).post('/reset-password').send({ token: 'abc', password: 'NewPassw0rd' });

    expect(user.passwordChangedAt).toBeInstanceOf(Date);
    expect(user.passwordChangedAt.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('assigns the new password and persists in a single save', async () => {
    const user = fakeUser();
    User.findOne.mockResolvedValue(user);

    const res = await request(buildApp())
      .post('/reset-password')
      .send({ token: 'abc', password: 'NewPassw0rd' });

    expect(user.password).toBe('NewPassw0rd');
    expect(user.save).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });

  it('writes an audit log entry noting the session revocation', async () => {
    User.findOne.mockResolvedValue(fakeUser());

    await request(buildApp()).post('/reset-password').send({ token: 'abc', password: 'NewPassw0rd' });

    expect(ActivityLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'Reset Password',
        details: expect.stringMatching(/revoked/i),
      })
    );
  });
});
