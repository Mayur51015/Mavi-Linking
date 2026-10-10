const request = require('supertest');
const mongoose = require('mongoose');
const crypto = require('crypto');
const express = require('express');
const User = require('../src/models/User');
const EmailChangeChallenge = require('../src/models/EmailChangeChallenge');
const {
  OTP_EXPIRY_MINUTES,
  getOtpExpiryMinutes,
  getOtpExpiresAt,
  isOtpExpired,
} = require('../src/config/otpConfig');

jest.setTimeout(45000);

describe('EduTalentX — Universal 10-Minute OTP Expiration Suite for All User Roles', () => {
  let app;
  const runId = Date.now() + '_' + Math.random().toString(36).substring(7);

  beforeAll(async () => {
    process.env.SECURITY_TOKEN_EXPIRY_MINUTES = '10';

    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mavi_linking_test';
      await mongoose.connect(mongoUri);
    }

    app = express();
    app.use(express.json());
    app.use('/api/auth', require('../src/routes/authRoutes'));
    app.use(require('../src/middleware/errorHandler'));

    await User.deleteMany({ email: new RegExp(`.*_${runId}_otp_test@example\\.com$`) });
    await EmailChangeChallenge.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({ email: new RegExp(`.*_${runId}_otp_test@example\\.com$`) });
    await EmailChangeChallenge.deleteMany({});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  // ─── 1. CENTRALIZED CONFIGURATION CHECKS ──────────────────────────────────
  describe('1. Centralized OTP Configuration', () => {
    test('authoritatively enforces OTP_EXPIRY_MINUTES = 10', () => {
      expect(OTP_EXPIRY_MINUTES).toBe(10);
      expect(getOtpExpiryMinutes()).toBe(10);
    });

    test('calculates expiresAt = generatedAt + 10 minutes', () => {
      const fixedTime = new Date('2026-10-10T12:00:00.000Z');
      const expiresAt = getOtpExpiresAt(fixedTime);
      expect(expiresAt.getTime() - fixedTime.getTime()).toBe(10 * 60 * 1000);
    });

    test('isOtpExpired rejects strictly at or after expiration timestamp (serverTime >= expiresAt)', () => {
      const expiry = new Date('2026-10-10T12:10:00.000Z');

      // 1 ms before expiry -> Still valid
      expect(isOtpExpired(expiry, new Date('2026-10-10T12:09:59.999Z'))).toBe(false);

      // Exactly at expiry timestamp -> Expired
      expect(isOtpExpired(expiry, new Date('2026-10-10T12:10:00.000Z'))).toBe(true);

      // 1 ms after expiry -> Expired
      expect(isOtpExpired(expiry, new Date('2026-10-10T12:10:00.001Z'))).toBe(true);

      // Null or invalid expiry -> Expired
      expect(isOtpExpired(null)).toBe(true);
      expect(isOtpExpired(undefined)).toBe(true);
      expect(isOtpExpired('invalid-date')).toBe(true);
    });
  });

  // ─── 2. BOUNDARY VALIDATION & OTP LIFECYCLE ──────────────────────────────
  describe('2. Boundary Testing & Security Critical Lifecycle', () => {
    const studentEmail = `student_${runId}_otp_test@example.com`;
    const rawOtp = '739104';
    const hashedOtp = crypto.createHash('sha256').update(rawOtp).digest('hex');

    beforeEach(async () => {
      await User.deleteMany({ email: studentEmail });
    });

    test('OTP accepted before expiry (e.g., at 9 minutes 59 seconds)', async () => {
      await User.create({
        name: 'Valid Student',
        email: studentEmail,
        password: 'Password123!',
        role: 'user',
        accountStatus: 'ACTIVE',
        emailVerified: true,
        resetPasswordOtp: hashedOtp,
        resetPasswordExpires: new Date(Date.now() + 60 * 1000), // 1 minute left
      });

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: studentEmail,
          otp: rawOtp,
          password: 'NewValidPassword123!',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Check OTP consumed immediately
      const updated = await User.findOne({ email: studentEmail }).select('+resetPasswordOtp +resetPasswordExpires');
      expect(updated.resetPasswordOtp).toBeNull();
      expect(updated.resetPasswordExpires).toBeNull();
    });

    test('OTP rejected after expiry (e.g., at 10 minutes 1 second)', async () => {
      await User.create({
        name: 'Expired Student',
        email: studentEmail,
        password: 'Password123!',
        role: 'user',
        accountStatus: 'ACTIVE',
        emailVerified: true,
        resetPasswordOtp: hashedOtp,
        resetPasswordExpires: new Date(Date.now() - 1000), // Expired 1 second ago
      });

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: studentEmail,
          otp: rawOtp,
          password: 'NewExpiredPassword123!',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe('OTP_EXPIRED');
    });

    test('OTP rejected exactly at the expiration timestamp (edge case: Date.now() === expiresAt)', async () => {
      const exactNow = Date.now();
      await User.create({
        name: 'Exact Boundary Student',
        email: studentEmail,
        password: 'Password123!',
        role: 'user',
        accountStatus: 'ACTIVE',
        emailVerified: true,
        resetPasswordOtp: hashedOtp,
        resetPasswordExpires: new Date(exactNow), // Expires right at exactNow
      });

      // Real clock will be >= exactNow
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: studentEmail,
          otp: rawOtp,
          password: 'NewBoundaryPassword123!',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe('OTP_EXPIRED');
    });

    test('Incorrect OTP is rejected with OTP_INVALID', async () => {
      await User.create({
        name: 'Mismatch Student',
        email: studentEmail,
        password: 'Password123!',
        role: 'user',
        accountStatus: 'ACTIVE',
        emailVerified: true,
        resetPasswordOtp: hashedOtp,
        resetPasswordExpires: new Date(Date.now() + 500000),
      });

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: studentEmail,
          otp: '000000', // Incorrect OTP
          password: 'NewPassword123!',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe('OTP_INVALID');
    });

    test('OTP reuse prevention: Consumed OTP cannot be re-used', async () => {
      await User.create({
        name: 'Reuse Student',
        email: studentEmail,
        password: 'Password123!',
        role: 'user',
        accountStatus: 'ACTIVE',
        emailVerified: true,
        resetPasswordOtp: hashedOtp,
        resetPasswordExpires: new Date(Date.now() + 500000),
      });

      // 1st attempt: Valid -> Succeeds
      const firstRes = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: studentEmail,
          otp: rawOtp,
          password: 'NewSecurePassword123!',
        });
      expect(firstRes.statusCode).toBe(200);

      // 2nd attempt with exact same OTP -> Rejected as consumed/not found
      const secondRes = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: studentEmail,
          otp: rawOtp,
          password: 'AnotherPassword123!',
        });

      expect(secondRes.statusCode).toBe(400);
      expect(secondRes.body.code).toBe('OTP_NOT_FOUND');
    });
  });

  // ─── 3. RESEND INVALIDATION & FRESH 10-MINUTE WINDOW ─────────────────────
  describe('3. OTP Resend Invalidation & Fresh Expiration Window', () => {
    test('Resending OTP invalidates previous code and issues a brand-new 10-minute window', async () => {
      const userEmail = `resend_${runId}_otp_test@example.com`;
      await User.create({
        name: 'Resend User',
        email: userEmail,
        password: 'Password123!',
        role: 'teacher',
        accountStatus: 'ACTIVE',
        emailVerified: true,
      });

      // 1. Initial OTP generation
      const beforeFirst = Date.now();
      const firstRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: userEmail });
      expect(firstRes.statusCode).toBe(200);

      const userAfterFirst = await User.findOne({ email: userEmail }).select('+resetPasswordOtp +resetPasswordExpires');
      const firstHashedOtp = userAfterFirst.resetPasswordOtp;
      expect(firstHashedOtp).toBeDefined();

      const firstExpiry = userAfterFirst.resetPasswordExpires.getTime();
      expect(Math.abs(firstExpiry - (beforeFirst + 10 * 60 * 1000))).toBeLessThan(3000);

      // 2. Issue fresh OTP (Resend)
      const beforeSecond = Date.now();
      const secondRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: userEmail });
      expect(secondRes.statusCode).toBe(200);

      const userAfterSecond = await User.findOne({ email: userEmail }).select('+resetPasswordOtp +resetPasswordExpires');
      const secondHashedOtp = userAfterSecond.resetPasswordOtp;
      expect(secondHashedOtp).toBeDefined();

      // Older code hash has been completely replaced
      expect(secondHashedOtp).not.toBe(firstHashedOtp);

      // Fresh 10-minute expiration window calculated from second issuance
      const secondExpiry = userAfterSecond.resetPasswordExpires.getTime();
      expect(Math.abs(secondExpiry - (beforeSecond + 10 * 60 * 1000))).toBeLessThan(3000);
    });
  });

  // ─── 4. ROLE-AGNOSTIC EXPIRATION CHECKS (ALL ROLES) ───────────────────────
  describe('4. Universal 10-Minute Expiration Enforced Across All User Roles', () => {
    const rolesToTest = [
      { role: 'user', title: 'Student' },
      { role: 'teacher', title: 'Faculty Teacher' },
      { role: 'recruiter', title: 'Corporate Recruiter' },
      { role: 'institution_admin', title: 'Institution Admin' },
      { role: 'department_admin', title: 'Department Admin' },
      { role: 'super_admin', title: 'Super Admin' },
      { role: 'owner', title: 'Platform Owner' },
    ];

    rolesToTest.forEach(({ role, title }) => {
      test(`Generates exactly 10-minute OTP for role: ${title} (${role})`, async () => {
        const email = `${role}_${runId}_otp_test@example.com`;
        await User.create({
          name: `Test ${title}`,
          email,
          password: 'Password123!',
          role,
          accountStatus: 'ACTIVE',
          emailVerified: true,
        });

        const beforeTime = Date.now();
        const res = await request(app)
          .post('/api/auth/forgot-password')
          .send({ email });

        expect(res.statusCode).toBe(200);

        const user = await User.findOne({ email }).select('+resetPasswordOtp +resetPasswordExpires');
        expect(user.resetPasswordOtp).toBeDefined();
        expect(user.resetPasswordExpires).toBeDefined();

        const diff = user.resetPasswordExpires.getTime() - beforeTime;
        // Exactly 10 minutes (600,000 ms) within execution variance tolerance
        expect(Math.abs(diff - 10 * 60 * 1000)).toBeLessThan(3000);
      });
    });
  });

  // ─── 5. EMAIL CHANGE CHALLENGE OTP FLOW ──────────────────────────────────
  describe('5. Email Change Challenge OTP (10-Minute Enforcement & Resend)', () => {
    let authUser;
    let authToken;

    beforeAll(async () => {
      const email = `email_change_user_${runId}_otp_test@example.com`;
      authUser = await User.create({
        name: 'Email Change Tester',
        email,
        password: 'Password123!',
        role: 'user',
        accountStatus: 'ACTIVE',
        emailVerified: true,
      });
      authToken = authUser.generateAuthToken();
    });

    test('Initial email change request sets OTP expiresAt = now + 10 minutes', async () => {
      const newEmail = `new_${runId}_otp_test@example.com`;
      const beforeReq = Date.now();

      const res = await request(app)
        .post('/api/auth/email-change/request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          newEmail,
          currentPassword: 'Password123!',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const challenge = await EmailChangeChallenge.findOne({ userId: authUser._id, status: 'PENDING' });
      expect(challenge).toBeDefined();
      expect(challenge.expiresAt).toBeDefined();

      const diff = challenge.expiresAt.getTime() - beforeReq;
      expect(Math.abs(diff - 10 * 60 * 1000)).toBeLessThan(3000);
    });

    test('Resent email change OTP strictly resets to 10 minutes (not 15 minutes)', async () => {
      const challenge = await EmailChangeChallenge.findOne({ userId: authUser._id, status: 'PENDING' });
      expect(challenge).toBeDefined();

      // Clear cooldown artificially for testing resend
      challenge.lastResendAt = new Date(Date.now() - 65000);
      await challenge.save();

      const beforeResend = Date.now();
      const res = await request(app)
        .post('/api/auth/email-change/resend')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          newEmail: challenge.newEmail,
        });

      expect(res.statusCode).toBe(200);

      const updated = await EmailChangeChallenge.findById(challenge._id);
      expect(updated.resendCount).toBe(1);

      const diff = updated.expiresAt.getTime() - beforeResend;
      // Strictly 10 minutes (600,000 ms), NOT the legacy 15 minutes (900,000 ms)
      expect(Math.abs(diff - 10 * 60 * 1000)).toBeLessThan(3000);
      expect(diff).toBeLessThan(11 * 60 * 1000);
    });

    test('Expired email change OTP is rejected with code OTP_EXPIRED', async () => {
      const challenge = await EmailChangeChallenge.findOne({ userId: authUser._id, status: 'PENDING' });
      expect(challenge).toBeDefined();

      // Artificially expire the challenge (1 second in past)
      challenge.expiresAt = new Date(Date.now() - 1000);
      await challenge.save();

      const res = await request(app)
        .post('/api/auth/email-change/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          otp: '123456',
          newEmail: challenge.newEmail,
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe('OTP_EXPIRED');

      const updated = await EmailChangeChallenge.findById(challenge._id);
      expect(updated.status).toBe('EXPIRED');
    });
  });
});
