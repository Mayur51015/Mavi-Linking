const request = require('supertest');
const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../src/models/User');
const AuditLog = require('../src/models/AuditLog');

describe('Student Account Activation & Security Tests', () => {
  let app;
  const testEmail = `student_${Date.now()}@example.com`;
  const testPrn = `PRN_${Date.now()}`;
  let rawToken = '';
  let studentUserId = null;

  beforeAll(async () => {
    // Setup in-memory / test MongoDB connection if not already connected
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mavi_linking_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
    const express = require('express');
    app = express();
    app.use(express.json());
    app.use('/api/auth', require('../src/routes/authRoutes'));
  });

  afterAll(async () => {
    if (studentUserId) {
      await User.deleteOne({ _id: studentUserId });
      await User.deleteMany({ email: /@example\.com$/ });
    }
    await mongoose.connection.close();
  });

  test('TEST 1: Student registers with PENDING_VERIFICATION state', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Student',
        email: testEmail,
        password: 'Password123!',
        prn: testPrn,
        role: 'user',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.code).toBe('EMAIL_VERIFICATION_REQUIRED');
    expect(res.body.data.accountStatus).toBe('PENDING_VERIFICATION');
    expect(res.body.data.emailVerified).toBe(false);

    const createdUser = await User.findOne({ email: testEmail }).select('+verificationToken +verificationTokenExpires');
    expect(createdUser).not.toBeNull();
    expect(createdUser.accountStatus).toBe('PENDING_VERIFICATION');
    expect(createdUser.emailVerified).toBe(false);
    expect(createdUser.maviId).toMatch(/^MAVI-/);
    studentUserId = createdUser._id;
  });

  test('TEST 2: Duplicate email registration is blocked (EMAIL_ALREADY_REGISTERED)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Duplicate Student',
        email: testEmail,
        password: 'Password123!',
        prn: `PRN_DIFF_${Date.now()}`,
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.code).toBe('EMAIL_ALREADY_REGISTERED');
  });

  test('TEST 3: Duplicate PRN registration is blocked (PRN_ALREADY_REGISTERED)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Different Email Student',
        email: `another_${Date.now()}@example.com`,
        password: 'Password123!',
        prn: testPrn,
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.code).toBe('PRN_ALREADY_REGISTERED');
  });

  test('TEST 4: Unverified student login is blocked with EMAIL_VERIFICATION_REQUIRED', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: testEmail,
        password: 'Password123!',
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('EMAIL_VERIFICATION_REQUIRED');
  });

  test('TEST 5: Resend verification email functions & generates new token', async () => {
    // Reset verificationTokenExpires to 28 mins ago so rate limiter allows resend
    await User.updateOne(
      { _id: studentUserId },
      { $set: { verificationTokenExpires: new Date(Date.now() + 28 * 60 * 1000) } }
    );

    const res = await request(app)
      .post('/api/auth/resend-verification')
      .send({ email: testEmail });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('TEST 6: Resend verification is rate-limited on immediate retry', async () => {
    const res = await request(app)
      .post('/api/auth/resend-verification')
      .send({ email: testEmail });

    expect(res.statusCode).toBe(429);
    expect(res.body.code).toBe('RESEND_RATE_LIMITED');
  });

  test('TEST 7: Verification token validates and transitions account to ACTIVE', async () => {
    // Generate a fresh raw token and hash it for verification
    rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    await User.updateOne(
      { _id: studentUserId },
      {
        $set: {
          verificationToken: hashedToken,
          verificationTokenExpires: new Date(Date.now() + 30 * 60 * 1000),
        },
      }
    );

    const res = await request(app)
      .post('/api/auth/verify-email')
      .send({ token: rawToken });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accountStatus).toBe('ACTIVE');
    expect(res.body.data.emailVerified).toBe(true);

    const activeUser = await User.findById(studentUserId);
    expect(activeUser.accountStatus).toBe('ACTIVE');
    expect(activeUser.emailVerified).toBe(true);
  });

  test('TEST 8: Token single-use enforcement (Reusing same token is rejected)', async () => {
    const res = await request(app)
      .post('/api/auth/verify-email')
      .send({ token: rawToken });

    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe('VERIFICATION_TOKEN_ALREADY_USED');
  });

  test('TEST 9: Verified student can now log in successfully', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: testEmail,
        password: 'Password123!',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });
});
