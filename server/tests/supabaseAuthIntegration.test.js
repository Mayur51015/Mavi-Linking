const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const express = require('express');

// Models
const User = require('../src/models/User');
const Institution = require('../src/models/Institution');
const Department = require('../src/models/Department');

// Middlewares and Routes
const { protect } = require('../src/middleware/auth');
const { requireRole, requireAdmin } = require('../src/middleware/rbacMiddleware');
const authRoutes = require('../src/routes/authRoutes');

// Services
const supabaseAuthService = require('../src/services/supabaseAuthService');

describe('EduTalentX — Supabase Auth Integration & Migration Test Suite', () => {
  let app;
  let testInstitution;
  let testDepartment;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);

    // Protected dummy routes to test RBAC with Supabase
    app.get('/api/test/student-only', protect, requireRole('user'), (req, res) => {
      res.json({ success: true, message: 'Student access granted', user: req.user });
    });

    app.get('/api/test/admin-only', protect, requireAdmin, (req, res) => {
      res.json({ success: true, message: 'Admin access granted', user: req.user });
    });

    // Create test Institution and Department
    testInstitution = await Institution.create({
      name: 'Supabase Engineering College',
      code: 'SEC',
      institutionCode: 'SEC-2026',
      shortName: 'SEC',
      domain: 'sec.edu',
      status: 'active',
    });

    testDepartment = await Department.create({
      name: 'Computer Science & Engineering',
      code: 'CSE',
      departmentCode: 'CSE-SEC',
      institutionId: testInstitution._id,
      status: 'active',
    });
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $regex: /@supabase-test\.com$/ } });
    if (testInstitution) await Institution.deleteOne({ _id: testInstitution._id });
    if (testDepartment) await Department.deleteOne({ _id: testDepartment._id });
  });

  describe('1. Token Detection and Verification in protect Middleware', () => {
    test('rejects request with 401 when Authorization header is missing', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/No token provided/i);
    });

    test('rejects request with 401 when token is malformed', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer not-a-valid-token');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INVALID_TOKEN');
    });

    test('rejects expired Supabase token with 401 TOKEN_EXPIRED', async () => {
      // Mock an expired Supabase token candidate
      const expiredToken = jwt.sign(
        { aud: 'authenticated', iss: 'https://bbotbrntretsjdwaekqd.supabase.co/auth/v1', sub: 'expired-user-id' },
        'dummy-secret',
        { expiresIn: -10 }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('TOKEN_EXPIRED');
    });
  });

  describe('2. Supabase Auth Safe Profile Provisioning & Zero-Trust Verification', () => {
    const mockSupabaseUid = 'supa-user-uuid-12345';
    const mockEmail = 'newstudent@supabase-test.com';

    let verifySpy;

    beforeEach(() => {
      verifySpy = jest.spyOn(supabaseAuthService, 'verifySupabaseToken').mockImplementation(async (token) => {
        try {
          const decoded = jwt.decode(token);
          if (decoded && decoded.sub) {
            return {
              valid: true,
              user: {
                id: decoded.sub,
                email: mockEmail,
                email_confirmed_at: new Date().toISOString(),
                user_metadata: { name: 'Verified Supabase Student' },
              },
            };
          }
        } catch (_) {}
        return { valid: false, error: 'Invalid token' };
      });
    });

    afterEach(() => {
      verifySpy.mockRestore();
    });

    test('auto-provisions new student profile in MongoDB on first valid Supabase access', async () => {
      // Create candidate token
      const token = jwt.sign(
        { aud: 'authenticated', iss: 'https://bbotbrntretsjdwaekqd.supabase.co/auth/v1', sub: mockSupabaseUid },
        'dummy-secret',
        { expiresIn: 3600 }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(mockEmail);
      expect(res.body.data.user.supabaseUid).toBe(mockSupabaseUid);
      expect(res.body.data.user.role).toBe('user'); // zero-trust default
      expect(res.body.data.user.emailVerified).toBe(true);
      expect(res.body.data.user.etxId).toMatch(/^ETX-/);

      // Verify record in MongoDB
      const dbUser = await User.findOne({ supabaseUid: mockSupabaseUid });
      expect(dbUser).toBeTruthy();
      expect(dbUser.email).toBe(mockEmail);
    });

    test('subsequent requests by verified Supabase user resolve the existing profile without duplicating', async () => {
      const token = jwt.sign(
        { aud: 'authenticated', iss: 'https://bbotbrntretsjdwaekqd.supabase.co/auth/v1', sub: mockSupabaseUid },
        'dummy-secret',
        { expiresIn: 3600 }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.supabaseUid).toBe(mockSupabaseUid);

      // Ensure no duplicate records were created
      const count = await User.countDocuments({ supabaseUid: mockSupabaseUid });
      expect(count).toBe(1);
    });
  });

  describe('3. Zero-Trust Rule: Prevent Automatic Access Grant When Email Matches Existing Account', () => {
    const existingLegacyEmail = 'existing_legacy@supabase-test.com';
    const attackerSupabaseUid = 'attacker-supa-uid-999';

    beforeAll(async () => {
      // Create existing user with local password hash and NO supabaseUid
      await User.create({
        name: 'Existing Legacy User',
        email: existingLegacyEmail,
        password: 'Password123!',
        role: 'user',
        roles: ['user'],
        accountStatus: 'ACTIVE',
        emailVerified: true,
      });
    });

    test('blocks access with 403 ACCOUNT_LINKING_REQUIRED when email matches existing account without supabaseUid', async () => {
      const spy = jest.spyOn(supabaseAuthService, 'verifySupabaseToken').mockImplementation(async () => ({
        valid: true,
        user: {
          id: attackerSupabaseUid,
          email: existingLegacyEmail,
          email_confirmed_at: new Date().toISOString(),
          user_metadata: { name: 'Attempted Link' },
        },
      }));

      const token = jwt.sign(
        { aud: 'authenticated', iss: 'https://bbotbrntretsjdwaekqd.supabase.co/auth/v1', sub: attackerSupabaseUid },
        'dummy-secret',
        { expiresIn: 3600 }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('ACCOUNT_LINKING_REQUIRED');
      expect(res.body.message).toMatch(/link your Supabase account/i);

      spy.mockRestore();
    });

    test('successfully links account when existing user provides correct password via /supabase/link-account', async () => {
      const validSupaUid = 'legit-linked-supa-uid-777';
      const spy = jest.spyOn(supabaseAuthService, 'verifySupabaseToken').mockImplementation(async () => ({
        valid: true,
        user: {
          id: validSupaUid,
          email: existingLegacyEmail,
          email_confirmed_at: new Date().toISOString(),
          user_metadata: { name: 'Existing Legacy User' },
        },
      }));

      const token = jwt.sign(
        { aud: 'authenticated', iss: 'https://bbotbrntretsjdwaekqd.supabase.co/auth/v1', sub: validSupaUid },
        'dummy-secret',
        { expiresIn: 3600 }
      );

      // Attempt link with wrong password
      const wrongRes = await request(app)
        .post('/api/auth/supabase/link-account')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'WrongPassword!' });

      expect(wrongRes.status).toBe(401);
      expect(wrongRes.body.code).toBe('INVALID_CREDENTIALS');

      // Attempt link with correct password
      const correctRes = await request(app)
        .post('/api/auth/supabase/link-account')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'Password123!' });

      expect(correctRes.status).toBe(200);
      expect(correctRes.body.success).toBe(true);
      expect(correctRes.body.data.user.supabaseUid).toBe(validSupaUid);

      // Verify in DB that account is linked and password hash preserved
      const updatedUser = await User.findOne({ email: existingLegacyEmail }).select('+password');
      expect(updatedUser.supabaseUid).toBe(validSupaUid);
      expect(updatedUser.password).toBeTruthy(); // password hash is preserved

      spy.mockRestore();
    });
  });

  describe('4. Profile Synchronization & Institutional Onboarding (syncSupabaseProfile)', () => {
    const onboardingSupabaseUid = 'onboard-supa-uid-555';
    const onboardingEmail = 'student_onboard@supabase-test.com';

    let spy;

    beforeEach(() => {
      spy = jest.spyOn(supabaseAuthService, 'verifySupabaseToken').mockImplementation(async () => ({
        valid: true,
        user: {
          id: onboardingSupabaseUid,
          email: onboardingEmail,
          email_confirmed_at: new Date().toISOString(),
          user_metadata: { name: 'Rahul Sharma' },
        },
      }));
    });

    afterEach(() => {
      spy.mockRestore();
    });

    test('rejects invalid institution code with 404', async () => {
      const token = jwt.sign(
        { aud: 'authenticated', iss: 'https://bbotbrntretsjdwaekqd.supabase.co/auth/v1', sub: onboardingSupabaseUid },
        'dummy-secret',
        { expiresIn: 3600 }
      );

      const res = await request(app)
        .post('/api/auth/supabase/sync-profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Rahul Sharma',
          institutionCode: 'INVALID-CODE-999',
          prn: 'PRN-999111',
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('INSTITUTION_CODE_INVALID');
    });

    test('successfully provisions student profile with institution, department, and PRN', async () => {
      const token = jwt.sign(
        { aud: 'authenticated', iss: 'https://bbotbrntretsjdwaekqd.supabase.co/auth/v1', sub: onboardingSupabaseUid },
        'dummy-secret',
        { expiresIn: 3600 }
      );

      const res = await request(app)
        .post('/api/auth/supabase/sync-profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Rahul Sharma',
          institutionCode: 'SEC-2026',
          departmentId: testDepartment._id.toString(),
          prn: 'PRN-SEC-101',
          degree: 'B.Tech',
          graduationYear: '2026',
          preferredDomain: 'Software Development',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe('Rahul Sharma');
      expect(res.body.data.user.institutionId.toString()).toBe(testInstitution._id.toString());
      expect(res.body.data.user.departmentId.toString()).toBe(testDepartment._id.toString());
      expect(res.body.data.user.prn).toBe('PRN-SEC-101');
      expect(res.body.data.user.role).toBe('user');
      expect(res.body.data.user.accountStatus).toBe('PENDING_ADMIN_APPROVAL');
    });

    test('rejects duplicate PRN for another student in the same institution', async () => {
      const secondSupabaseUid = 'onboard-supa-uid-666';
      spy.mockRestore();
      const spy2 = jest.spyOn(supabaseAuthService, 'verifySupabaseToken').mockImplementation(async () => ({
        valid: true,
        user: {
          id: secondSupabaseUid,
          email: 'duplicate_prn@supabase-test.com',
          email_confirmed_at: new Date().toISOString(),
          user_metadata: { name: 'Another Student' },
        },
      }));

      const token = jwt.sign(
        { aud: 'authenticated', iss: 'https://bbotbrntretsjdwaekqd.supabase.co/auth/v1', sub: secondSupabaseUid },
        'dummy-secret',
        { expiresIn: 3600 }
      );

      const res = await request(app)
        .post('/api/auth/supabase/sync-profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Another Student',
          institutionCode: 'SEC-2026',
          departmentId: testDepartment._id.toString(),
          prn: 'PRN-SEC-101', // Already used by Rahul Sharma
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('PRN_ALREADY_REGISTERED');

      spy2.mockRestore();
    });
  });

  describe('5. RBAC & Route Protection with Supabase Authentication', () => {
    let studentUser;
    let adminUser;

    beforeAll(async () => {
      studentUser = await User.create({
        name: 'Student User',
        email: 'rbac_student@supabase-test.com',
        supabaseUid: 'rbac-student-uid',
        authProvider: 'supabase',
        role: 'user',
        roles: ['user'],
        accountStatus: 'ACTIVE',
        emailVerified: true,
      });

      adminUser = await User.create({
        name: 'Admin User',
        email: 'rbac_admin@supabase-test.com',
        supabaseUid: 'rbac-admin-uid',
        authProvider: 'supabase',
        role: 'super_admin',
        roles: ['super_admin'],
        accountStatus: 'ACTIVE',
        emailVerified: true,
      });
    });

    test('permits student access to student-only route when authenticated via Supabase', async () => {
      const spy = jest.spyOn(supabaseAuthService, 'verifySupabaseToken').mockImplementation(async () => ({
        valid: true,
        user: { id: studentUser.supabaseUid, email: studentUser.email, email_confirmed_at: new Date().toISOString() },
      }));

      const token = jwt.sign(
        { aud: 'authenticated', iss: 'https://bbotbrntretsjdwaekqd.supabase.co/auth/v1', sub: studentUser.supabaseUid },
        'dummy-secret',
        { expiresIn: 3600 }
      );

      const res = await request(app)
        .get('/api/test/student-only')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      spy.mockRestore();
    });

    test('denies student access to admin-only route with 403 Forbidden', async () => {
      const spy = jest.spyOn(supabaseAuthService, 'verifySupabaseToken').mockImplementation(async () => ({
        valid: true,
        user: { id: studentUser.supabaseUid, email: studentUser.email, email_confirmed_at: new Date().toISOString() },
      }));

      const token = jwt.sign(
        { aud: 'authenticated', iss: 'https://bbotbrntretsjdwaekqd.supabase.co/auth/v1', sub: studentUser.supabaseUid },
        'dummy-secret',
        { expiresIn: 3600 }
      );

      const res = await request(app)
        .get('/api/test/admin-only')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);

      spy.mockRestore();
    });

    test('permits admin access to admin-only route when authenticated via Supabase', async () => {
      const spy = jest.spyOn(supabaseAuthService, 'verifySupabaseToken').mockImplementation(async () => ({
        valid: true,
        user: { id: adminUser.supabaseUid, email: adminUser.email, email_confirmed_at: new Date().toISOString() },
      }));

      const token = jwt.sign(
        { aud: 'authenticated', iss: 'https://bbotbrntretsjdwaekqd.supabase.co/auth/v1', sub: adminUser.supabaseUid },
        'dummy-secret',
        { expiresIn: 3600 }
      );

      const res = await request(app)
        .get('/api/test/admin-only')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      spy.mockRestore();
    });
  });

  describe('6. Legacy JWT Backward Compatibility Unchanged', () => {
    let legacyUser;

    beforeAll(async () => {
      legacyUser = await User.create({
        name: 'Legacy User',
        email: 'pure_legacy@supabase-test.com',
        password: 'Password123!',
        role: 'user',
        roles: ['user'],
        accountStatus: 'ACTIVE',
        emailVerified: true,
      });
    });

    test('successfully authenticates legacy signed JWT on protected routes without disruption', async () => {
      const legacyToken = legacyUser.generateAuthToken();

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${legacyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(legacyUser.email);
    });
  });
});
