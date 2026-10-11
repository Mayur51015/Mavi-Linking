const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const express = require('express');

// Models
const User = require('../src/models/User');
const Institution = require('../src/models/Institution');
const Department = require('../src/models/Department');
const RecruitmentNotification = require('../src/models/RecruitmentNotification');

// Services & Utils
const sendEmailModule = require('../src/utils/sendEmail');
const { getAdminInvitationExpiresAt } = require('../src/config/invitationConfig');

jest.mock('../src/utils/sendEmail', () => {
  const original = jest.requireActual('../src/utils/sendEmail');
  return {
    ...original,
    sendEmail: jest.fn().mockResolvedValue({
      success: true,
      messageId: 'mock-msg-id-12345',
      provider: 'mock-test',
    }),
    sendAdminInvitationEmail: jest.fn().mockResolvedValue({
      success: true,
      messageId: 'mock-admin-msg-id-12345',
      provider: 'mock-test',
    }),
  };
});

describe('Render Connectivity & Invitation Resend Fixes Integration Suite', () => {
  let app;
  let instAdminA, instAdminAToken;
  let instAdminB, instAdminBToken;
  let regularUser, regularUserToken;
  let institutionA, institutionB;
  let departmentA;
  const testRunId = Date.now() + '_' + Math.random().toString(36).substring(7);

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_render_fixes_test_2026';
    process.env.SECURITY_TOKEN_EXPIRY_MINUTES = '10';

    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mavi_linking_test';
      await mongoose.connect(mongoUri);
    }

    app = express();
    app.use(express.json());

    // Health Check routes (mirrored from server.js)
    const healthHandler = (req, res, forceDisconnected = false) => {
      const isDbConnected = !forceDisconnected && mongoose.connection.readyState === 1;
      res.status(isDbConnected ? 200 : 503).json({
        success: isDbConnected,
        status: isDbConnected ? 'ok' : 'degraded',
        message: isDbConnected ? 'EduTalentX API is running' : 'EduTalentX API is degraded: database disconnected',
        database: isDbConnected ? 'connected' : 'disconnected',
        environment: process.env.NODE_ENV || 'production',
        timestamp: new Date().toISOString(),
      });
    };
    app.get('/health', (req, res) => healthHandler(req, res, false));
    app.get('/api/health', (req, res) => healthHandler(req, res, false));
    app.get('/health/simulated-disconnected', (req, res) => healthHandler(req, res, true));

    // Mount API Routes
    app.use('/api/auth', require('../src/routes/authRoutes'));
    app.use('/api/admin', require('../src/routes/adminRoutes'));
    app.use('/api/notifications', require('../src/routes/notificationRoutes'));
    app.use(require('../src/middleware/errorHandler'));

    // Create test institutions
    const randHex = crypto.randomBytes(4).toString('hex');
    institutionA = await Institution.create({
      name: `Fixes Inst A ${randHex}`,
      institutionCode: `A_${randHex}_FIXES`.toUpperCase(),
      tenantId: `INST-A-${randHex}`,
      status: 'active',
    });

    institutionB = await Institution.create({
      name: `Fixes Inst B ${randHex}`,
      institutionCode: `B_${randHex}_FIXES`.toUpperCase(),
      tenantId: `INST-B-${randHex}`,
      status: 'active',
    });

    departmentA = await Department.create({
      name: 'Computer Science',
      code: `CS_${randHex}`,
      institutionId: institutionA._id,
    });

    // Create Institution Admin A
    instAdminA = await User.create({
      name: 'Admin A',
      email: `admin_a_${testRunId}@test.edu`,
      password: 'Password@123',
      role: 'institution_admin',
      roles: ['institution_admin', 'user'],
      institutionId: institutionA._id,
      accountStatus: 'ACTIVE',
      status: 'active',
      emailVerified: true,
    });
    instAdminAToken = jwt.sign({ id: instAdminA._id, role: instAdminA.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Create Institution Admin B
    instAdminB = await User.create({
      name: 'Admin B',
      email: `admin_b_${testRunId}@test.edu`,
      password: 'Password@123',
      role: 'institution_admin',
      roles: ['institution_admin', 'user'],
      institutionId: institutionB._id,
      accountStatus: 'ACTIVE',
      status: 'active',
      emailVerified: true,
    });
    instAdminBToken = jwt.sign({ id: instAdminB._id, role: instAdminB.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Create Regular User
    regularUser = await User.create({
      name: 'Regular Student',
      email: `student_${testRunId}@test.edu`,
      password: 'Password@123',
      role: 'user',
      roles: ['user'],
      institutionId: institutionA._id,
      accountStatus: 'ACTIVE',
      status: 'active',
      emailVerified: true,
    });
    regularUserToken = jwt.sign({ id: regularUser._id, role: regularUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  afterAll(async () => {
    await User.deleteMany({ email: new RegExp(testRunId) });
    await Institution.deleteMany({ _id: { $in: [institutionA._id, institutionB._id] } });
    await Department.deleteMany({ _id: departmentA._id });
    await RecruitmentNotification.deleteMany({ recipientId: regularUser._id });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Phase 1: Health Check & Backend Connectivity
  // ──────────────────────────────────────────────────────────────────────────
  describe('Phase 1: Backend Health Check & Database Status', () => {
    test('returns 200 with database: connected when MongoDB is active, without leaking credentials', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('ok');
      expect(res.body.database).toBe('connected');
      expect(res.body.environment).toBeDefined();

      // Ensure no sensitive connection URI or credentials are leaked
      const resStr = JSON.stringify(res.body);
      expect(resStr).not.toContain('mongodb://');
      expect(resStr).not.toContain('mongodb+srv://');
      expect(resStr).not.toContain('password');
    });

    test('returns 503 with database: disconnected when database connection is degraded', async () => {
      const res = await request(app).get('/health/simulated-disconnected');
      expect(res.statusCode).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.status).toBe('degraded');
      expect(res.body.database).toBe('disconnected');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Phase 1: Notification Unread Count Route
  // ──────────────────────────────────────────────────────────────────────────
  describe('Phase 1: Notification Unread Count Handling', () => {
    test('returns 200 with count: 0 for user with zero unread notifications', async () => {
      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${regularUserToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.count).toBe(0);
    });

    test('returns accurate count when user has unread notifications', async () => {
      // Create 3 unread notifications
      await RecruitmentNotification.create([
        { recipientId: regularUser._id, type: 'system_announcement', title: 'N1', message: 'M1', isRead: false },
        { recipientId: regularUser._id, type: 'system_announcement', title: 'N2', message: 'M2', isRead: false },
        { recipientId: regularUser._id, type: 'system_announcement', title: 'N3', message: 'M3', isRead: false },
        { recipientId: regularUser._id, type: 'system_announcement', title: 'N4', message: 'M4', isRead: true },
      ]);

      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${regularUserToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.count).toBe(3);
    });

    test('returns 401 when request is unauthenticated', async () => {
      const res = await request(app).get('/api/notifications/unread-count');
      expect(res.statusCode).toBe(401);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Phase 2 & 3: Department Admin Resend Invite Endpoint & Rate Limiting
  // ──────────────────────────────────────────────────────────────────────────
  describe('Phase 2 & 3: POST /api/admin/department-admins/:id/resend-invite', () => {
    let deptAdminTarget;

    beforeEach(async () => {
      deptAdminTarget = await User.create({
        name: 'Dept Admin Target',
        email: `dept_target_${Date.now()}_${Math.random().toString(36).substring(7)}@test.edu`,
        role: 'department_admin',
        roles: ['department_admin', 'user'],
        institutionId: institutionA._id,
        departmentId: departmentA._id,
        accountStatus: 'INVITED',
        status: 'active',
        invitationToken: 'dummy-hashed-token',
        invitationExpires: getAdminInvitationExpiresAt(),
        invitedAt: new Date(Date.now() - 120000), // 2 minutes ago (past cooldown)
      });
    });

    afterEach(async () => {
      if (deptAdminTarget) {
        await User.deleteOne({ _id: deptAdminTarget._id });
      }
    });

    test('1st request succeeds (200), immediate 2nd request returns 429 with Retry-After header', async () => {
      // First Resend: Should Succeed
      const res1 = await request(app)
        .post(`/api/admin/department-admins/${deptAdminTarget._id}/resend-invite`)
        .set('Authorization', `Bearer ${instAdminAToken}`);

      expect(res1.statusCode).toBe(200);
      expect(res1.body.success).toBe(true);
      expect(sendEmailModule.sendAdminInvitationEmail).toHaveBeenCalled();

      // Immediate Second Resend: Should return 429 with Retry-After header
      const res2 = await request(app)
        .post(`/api/admin/department-admins/${deptAdminTarget._id}/resend-invite`)
        .set('Authorization', `Bearer ${instAdminAToken}`);

      expect(res2.statusCode).toBe(429);
      expect(res2.body.code).toBe('RATE_LIMITED');
      expect(res2.headers['retry-after']).toBeDefined();
      expect(Number(res2.headers['retry-after'])).toBeGreaterThanOrEqual(1);
      expect(res2.body.data?.retryAfter).toBeDefined();
    });

    test('denies unauthorized access for regular user (403)', async () => {
      const res = await request(app)
        .post(`/api/admin/department-admins/${deptAdminTarget._id}/resend-invite`)
        .set('Authorization', `Bearer ${regularUserToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Phase 2, 3 & 4: User Resend Invitation Endpoint, Rate Limiting & Multi-Tenant Scoping
  // ──────────────────────────────────────────────────────────────────────────
  describe('Phase 2, 3 & 4: POST /api/admin/users/:id/resend-invitation', () => {
    let studentTargetA, studentTargetB;

    beforeEach(async () => {
      studentTargetA = await User.create({
        name: 'Student Target A',
        email: `student_target_a_${Date.now()}@test.edu`,
        role: 'user',
        roles: ['user'],
        institutionId: institutionA._id,
        accountStatus: 'INVITED',
        status: 'active',
        invitationToken: 'dummy-hashed-token-a',
        invitationExpires: getAdminInvitationExpiresAt(),
        invitedAt: new Date(Date.now() - 120000), // 2 mins ago
      });

      studentTargetB = await User.create({
        name: 'Student Target B',
        email: `student_target_b_${Date.now()}@test.edu`,
        role: 'user',
        roles: ['user'],
        institutionId: institutionB._id,
        accountStatus: 'INVITED',
        status: 'active',
        invitationToken: 'dummy-hashed-token-b',
        invitationExpires: getAdminInvitationExpiresAt(),
        invitedAt: new Date(Date.now() - 120000),
      });
    });

    afterEach(async () => {
      await User.deleteMany({ _id: { $in: [studentTargetA._id, studentTargetB._id] } });
    });

    test('1st request succeeds (200), immediate 2nd request returns 429 with Retry-After header', async () => {
      const res1 = await request(app)
        .post(`/api/admin/users/${studentTargetA._id}/resend-invitation`)
        .set('Authorization', `Bearer ${instAdminAToken}`);

      expect(res1.statusCode).toBe(200);
      expect(res1.body.success).toBe(true);
      expect(sendEmailModule.sendEmail).toHaveBeenCalled();

      // Immediate 2nd resend
      const res2 = await request(app)
        .post(`/api/admin/users/${studentTargetA._id}/resend-invitation`)
        .set('Authorization', `Bearer ${instAdminAToken}`);

      expect(res2.statusCode).toBe(429);
      expect(res2.body.code).toBe('RATE_LIMITED');
      expect(res2.headers['retry-after']).toBeDefined();
      expect(res2.body.data?.retryAfter).toBeDefined();
    });

    test('cross-institution access denial: Admin A cannot resend invitation for User in Institution B (403)', async () => {
      const res = await request(app)
        .post(`/api/admin/users/${studentTargetB._id}/resend-invitation`)
        .set('Authorization', `Bearer ${instAdminAToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Forbidden|another institution|Access denied/i);
    });

    test('atomic concurrent resend protection: concurrent requests resolve safely without duplicate tokens', async () => {
      sendEmailModule.sendEmail.mockClear();

      // Fire 2 concurrent requests
      const [call1, call2] = await Promise.all([
        request(app)
          .post(`/api/admin/users/${studentTargetA._id}/resend-invitation`)
          .set('Authorization', `Bearer ${instAdminAToken}`),
        request(app)
          .post(`/api/admin/users/${studentTargetA._id}/resend-invitation`)
          .set('Authorization', `Bearer ${instAdminAToken}`),
      ]);

      const statuses = [call1.statusCode, call2.statusCode].sort();
      // Exactly one succeeds with 200, one fails with 429
      expect(statuses).toEqual([200, 429]);
      // Email service was invoked exactly once
      expect(sendEmailModule.sendEmail).toHaveBeenCalledTimes(1);
    });

    test('invitation email is sent to target user email and NOT to Owner', async () => {
      await request(app)
        .post(`/api/admin/users/${studentTargetA._id}/resend-invitation`)
        .set('Authorization', `Bearer ${instAdminAToken}`);

      expect(sendEmailModule.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: studentTargetA.email,
        })
      );
    });

    test('accurately reports email provider failure without false success', async () => {
      // Create fresh user past cooldown
      const targetUser = await User.create({
        name: 'Provider Fail Target',
        email: `prov_fail_${Date.now()}@test.edu`,
        role: 'user',
        roles: ['user'],
        institutionId: institutionA._id,
        accountStatus: 'INVITED',
        status: 'active',
        invitedAt: new Date(Date.now() - 120000),
      });

      // Mock email failure
      sendEmailModule.sendEmail.mockRejectedValueOnce(new Error('SMTP connection timeout to upstream mail provider'));

      const res = await request(app)
        .post(`/api/admin/users/${targetUser._id}/resend-invitation`)
        .set('Authorization', `Bearer ${instAdminAToken}`);

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);

      await User.deleteOne({ _id: targetUser._id });
    });
  });
});
