const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../src/models/User');

jest.setTimeout(30000);

describe('Backend Auth API Endpoints (Supertest Integration)', () => {
  let app;
  const testEmail = `apitest_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', require('../src/routes/authRoutes'));
    app.use(require('../src/middleware/errorHandler'));
  });

  afterAll(async () => {
    await User.deleteMany({ email: /apitest_.*@example\.com$/ });
  });

  describe('POST /api/auth/register - Validation & Registration', () => {
    it('rejects registration when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
      expect(Array.isArray(res.body.errors)).toBe(true);
    });

    it('rejects registration with weak password (missing uppercase or number)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Candidate',
          email: 'weakpass@example.com',
          password: 'password', // weak
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      const messages = res.body.errors.map((e) => e.message || e.msg);
      expect(messages.some((m) => /uppercase.*lowercase.*number/i.test(m))).toBe(true);
    });

    it('successfully registers a new user with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'API Test User',
          email: testEmail,
          password: testPassword,
          role: 'user',
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(testEmail.toLowerCase());
      // Sensitive field must never be exposed
      expect(res.body.data.user.password).toBeUndefined();

      // Verify in DB
      const dbUser = await User.findOne({ email: testEmail.toLowerCase() });
      expect(dbUser).not.toBeNull();
      expect(dbUser.password).not.toBe(testPassword); // hashed
    });

    it('rejects duplicate registration with 400 or 409', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate User',
          email: testEmail,
          password: testPassword,
        });

      expect([400, 409]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login - Authentication & Credentials', () => {
    it('rejects login with missing password or identifier', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects login with incorrect password with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword@999',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid.*credentials|invalid.*password/i);
    });

    it('blocks login for unverified student accounts with 403 EMAIL_VERIFICATION_REQUIRED', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('EMAIL_VERIFICATION_REQUIRED');
    });

    it('successfully authenticates verified user and returns JWT token', async () => {
      // Mark student email as verified in database
      await User.updateOne({ email: testEmail.toLowerCase() }, { $set: { emailVerified: true } });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(typeof res.body.data.token).toBe('string');
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(testEmail.toLowerCase());
      expect(res.body.data.user.password).toBeUndefined();
    });
  });

  describe('GET /api/auth/me - Protected Authorization & Token Verification', () => {
    it('blocks unauthenticated access without Authorization header with 401', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('blocks access with malformed or tampered token with 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.jwt.token.string');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('allows access with valid Bearer token and returns sanitized user profile', async () => {
      const user = await User.findOne({ email: testEmail.toLowerCase() });
      const token = user.generateAuthToken();

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user._id.toString()).toBe(user._id.toString());
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.data.user.refreshToken).toBeUndefined();
    });
  });

  describe('POST /api/auth/google - Deprecation Policy', () => {
    it('returns 410 Gone for deprecated Google login endpoint', async () => {
      const res = await request(app)
        .post('/api/auth/google')
        .send({});

      expect(res.status).toBe(410);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/google authentication has been removed/i);
    });
  });
});
