const request = require('supertest');
const mongoose = require('mongoose');
const crypto = require('crypto');
const express = require('express');
const User = require('../src/models/User');
const EmailChangeChallenge = require('../src/models/EmailChangeChallenge');
const Institution = require('../src/models/Institution');
const { getSecurityTokenExpiryMinutes, getSecurityTokenExpiresAt, isTokenExpired } = require('../src/config/securityTokenConfig');

jest.setTimeout(30000);

describe('MAVI LINKING — 10-Minute Security Token Expiration & Purpose Isolation Suite', () => {
  let app;
  const timestamp = Date.now() + '_' + Math.random().toString(36).substring(7);

  beforeAll(async () => {
    delete process.env.ADMIN_INVITATION_EXPIRY_HOURS;
    process.env.SECURITY_TOKEN_EXPIRY_MINUTES = '10';

    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mavi_linking_test';
      await mongoose.connect(mongoUri);
    }

    app = express();
    app.use(express.json());
    app.use('/api/auth', require('../src/routes/authRoutes'));
    app.use(require('../src/middleware/errorHandler'));

    await User.deleteMany({ email: /.*_token_sec_test@example\.com$/ });
    await EmailChangeChallenge.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({ email: /.*_token_sec_test@example\.com$/ });
    await EmailChangeChallenge.deleteMany({});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  // ─── TEST 1: Config returns 10 minutes default ──────────────────────────────
  test('TEST 1: Security config authoritatively returns 10 minutes expiry', () => {
    expect(getSecurityTokenExpiryMinutes()).toBe(10);
    const expiresAt = getSecurityTokenExpiresAt();
    const diffMs = expiresAt.getTime() - Date.now();
    expect(Math.abs(diffMs - 10 * 60 * 1000)).toBeLessThan(1000);
    expect(isTokenExpired(new Date(Date.now() - 1000))).toBe(true);
    expect(isTokenExpired(new Date(Date.now() + 50000))).toBe(false);
  });

  // ─── TEST 2: Student Registration -> Exactly 10-Minute Verification Expiration
  test('TEST 2: Student registration -> Verification token expires in 10 minutes', async () => {
    const studentEmail = `student_${timestamp}_token_sec_test@example.com`;
    const beforeTime = Date.now();

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Sec Student',
        email: studentEmail,
        password: 'Password123!',
        prn: `PRN_${Date.now()}`,
        role: 'user',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);

    const user = await User.findOne({ email: studentEmail }).select('+verificationToken +verificationTokenExpires');
    expect(user).toBeDefined();
    expect(user.verificationTokenExpires).toBeDefined();

    const expiryTime = new Date(user.verificationTokenExpires).getTime();
    const expectedExpiry = beforeTime + 10 * 60 * 1000;
    expect(Math.abs(expiryTime - expectedExpiry)).toBeLessThan(3000);
  });

  // ─── TEST 3: Expired Verification Link (11 minutes old) is Rejected ────────
  test('TEST 3: Expired verification link is rejected by backend (VERIFICATION_TOKEN_EXPIRED)', async () => {
    const studentEmail = `expired_student_${timestamp}_token_sec_test@example.com`;
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    await User.create({
      name: 'Expired Student',
      email: studentEmail,
      password: 'Password123!',
      role: 'user',
      accountStatus: 'PENDING_VERIFICATION',
      verificationToken: hashedToken,
      verificationTokenExpires: new Date(Date.now() - 60 * 1000), // Expired 1 minute ago (11 mins old)
    });

    const res = await request(app)
      .post('/api/auth/verify-email')
      .send({ token: rawToken });

    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe('VERIFICATION_TOKEN_EXPIRED');
  });

  // ─── TEST 4: Admin Invitation Token Expiration & Validation ────────────────
  test('TEST 4: Admin invitation validation enforces 10-minute expiry & returns validityMinutes: 10', async () => {
    const adminEmail = `admin_${timestamp}_token_sec_test@example.com`;
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const createdAdmin = await User.create({
      name: 'Sec Admin',
      email: adminEmail,
      role: 'institution_admin',
      accountStatus: 'INVITED',
      status: 'active',
      invitationToken: hashedToken,
      invitationExpires: getSecurityTokenExpiresAt(),
    });

    // Validate invite
    const verifyRes = await request(app).get(`/api/auth/verify-admin-invite/${rawToken}`);
    expect(verifyRes.statusCode).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.data.validityMinutes).toBe(10);

    // Set to expired
    await User.updateOne({ _id: createdAdmin._id }, { $set: { invitationExpires: new Date(Date.now() - 1000) } });

    const expiredRes = await request(app).get(`/api/auth/verify-admin-invite/${rawToken}`);
    expect(expiredRes.statusCode).toBe(400);
    expect(expiredRes.body.code).toBe('INVITATION_EXPIRED');
  });

  // ─── TEST 5: Password Reset Token & OTP Expire in 10 Minutes ───────────────
  test('TEST 5: Forgot password generates reset token & OTP valid for 10 minutes', async () => {
    const userEmail = `pwd_reset_${timestamp}_token_sec_test@example.com`;
    await User.create({
      name: 'Password User',
      email: userEmail,
      password: 'OldPassword123!',
      role: 'user',
      accountStatus: 'ACTIVE',
      emailVerified: true,
    });

    const beforeForgot = Date.now();
    const forgotRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: userEmail });

    expect(forgotRes.statusCode).toBe(200);

    const user = await User.findOne({ email: userEmail }).select('+resetPasswordToken +resetPasswordOtp +resetPasswordExpires');
    expect(user.resetPasswordToken).toBeDefined();
    expect(user.resetPasswordOtp).toBeDefined();
    expect(user.resetPasswordExpires).toBeDefined();

    const expiryTime = new Date(user.resetPasswordExpires).getTime();
    const expectedExpiry = beforeForgot + 10 * 60 * 1000;
    expect(Math.abs(expiryTime - expectedExpiry)).toBeLessThan(3000);
  });

  // ─── TEST 6: Single-Use & Atomicity: Token Cannot be Reused ───────────────
  test('TEST 6: Token single-use enforcement: Token cannot be replayed after successful use', async () => {
    const userEmail = `single_use_${timestamp}_token_sec_test@example.com`;
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const createdUser = await User.create({
      name: 'Single Use User',
      email: userEmail,
      password: 'InitialPassword123!',
      role: 'institution_admin',
      accountStatus: 'INVITED',
      status: 'active',
      invitationToken: hashedToken,
      invitationExpires: getSecurityTokenExpiresAt(),
    });

    // 1st consumption: Succeeds
    const firstRes = await request(app)
      .post('/api/auth/accept-admin-invite')
      .send({
        token: rawToken,
        password: 'NewSecurePassword@2026',
        confirmPassword: 'NewSecurePassword@2026',
      });

    expect(firstRes.statusCode).toBe(200);
    expect(firstRes.body.success).toBe(true);

    const checkUser = await User.findById(createdUser._id).select('+invitationToken +invitationExpires');
    expect(checkUser.invitationToken).toBeNull();
    expect(checkUser.invitationExpires).toBeNull();
    expect(checkUser.accountStatus).toBe('ACTIVE');

    // 2nd consumption attempt: Fails with INVITATION_INVALID or already used
    const secondRes = await request(app)
      .post('/api/auth/accept-admin-invite')
      .send({
        token: rawToken,
        password: 'AnotherPassword@2026',
        confirmPassword: 'AnotherPassword@2026',
      });

    expect(secondRes.statusCode).toBe(400);
    expect(secondRes.body.code).toBe('INVITATION_INVALID');
  });

  // ─── TEST 7: Token Purpose Isolation ──────────────────────────────────────
  test('TEST 7: Purpose isolation: Verification token cannot accept admin invite or reset password', async () => {
    const userEmail = `purpose_iso_${timestamp}_token_sec_test@example.com`;
    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto.createHash('sha256').update(rawVerificationToken).digest('hex');

    await User.create({
      name: 'Purpose Isolation User',
      email: userEmail,
      password: 'Password123!',
      role: 'user',
      accountStatus: 'PENDING_VERIFICATION',
      verificationToken: hashedVerificationToken,
      verificationTokenExpires: getSecurityTokenExpiresAt(),
      verificationTokenPurpose: 'ACCOUNT_EMAIL_VERIFICATION',
    });

    // Try using student verification token on admin accept invite
    const adminRes = await request(app)
      .post('/api/auth/accept-admin-invite')
      .send({
        token: rawVerificationToken,
        password: 'NewAdminPassword@2026',
        confirmPassword: 'NewAdminPassword@2026',
      });

    expect(adminRes.statusCode).toBe(400);
    expect(adminRes.body.code).toBe('INVITATION_INVALID');

    // Try using student verification token on password reset
    const pwdRes = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: rawVerificationToken,
        password: 'NewPassword@2026',
      });

    expect(pwdRes.statusCode).toBe(400);
  });
});
