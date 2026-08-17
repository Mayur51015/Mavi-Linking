const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const express = require('express');
const User = require('../src/models/User');
const Institution = require('../src/models/Institution');
const Department = require('../src/models/Department');
const InstitutionMembership = require('../src/models/InstitutionMembership');
const DNA = require('../src/models/DNA');
const AuditLog = require('../src/models/AuditLog');

jest.setTimeout(40000);

describe('MAVI LINKING — User Lifecycle Management (Suspend, Deactivate, Permanent Delete) Integration Tests', () => {
  let app;
  let ownerUser, ownerToken;
  let superAdmin1, superAdmin1Token;
  let superAdmin2, superAdmin2Token;
  let instAdminA, instAdminAToken;
  let instAdminB, instAdminBToken;
  let deptAdminA, deptAdminAToken;
  let studentA, studentAToken;
  let studentB;
  let institutionA, institutionB;
  let departmentA1, departmentA2;

  const timestamp = Date.now() + '_' + Math.random().toString(36).substring(7);

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_lifecycle_2026';
    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mavi_linking_test';
      await mongoose.connect(mongoUri);
    }

    app = express();
    app.use(express.json());
    app.use('/api/auth', require('../src/routes/authRoutes'));
    app.use('/api/admin', require('../src/routes/adminRoutes'));
    app.use('/api/super-admin', require('../src/routes/superAdminRoutes'));
    app.use('/api/owner', require('../src/routes/ownerRoutes'));
    app.use('/api', require('../src/routes/publicRoutes'));
    app.use(require('../src/middleware/errorHandler'));

    // Clean up test collections
    await User.deleteMany({ email: /.*_lifecycle_test@example\.com$/ });
    await Institution.deleteMany({ institutionCode: /.*_LC_INST$/ });
    await Department.deleteMany({ code: /.*_LC_DEPT$/ });
    await AuditLog.deleteMany({ 'details.targetEmail': /.*_lifecycle_test@example\.com$/ });

    // 1. Create Institutions
    institutionA = await Institution.create({
      name: `Institution Alpha ${timestamp}`,
      institutionCode: `A_${timestamp.slice(0, 4)}_LC_INST`.toUpperCase(),
      tenantId: `INST-ALPHA-${timestamp.slice(0, 4)}`,
      status: 'active',
    });

    institutionB = await Institution.create({
      name: `Institution Beta ${timestamp}`,
      institutionCode: `B_${timestamp.slice(0, 4)}_LC_INST`.toUpperCase(),
      tenantId: `INST-BETA-${timestamp.slice(0, 4)}`,
      status: 'active',
    });

    // 2. Create Departments in Institution A
    departmentA1 = await Department.create({
      name: `Computer Science ${timestamp}`,
      code: `CS_${timestamp.slice(0, 4)}_LC_DEPT`.toUpperCase(),
      institutionId: institutionA._id,
      status: 'active',
    });

    departmentA2 = await Department.create({
      name: `Mechanical Engineering ${timestamp}`,
      code: `ME_${timestamp.slice(0, 4)}_LC_DEPT`.toUpperCase(),
      institutionId: institutionA._id,
      status: 'active',
    });

    // 3. Create Users
    // Platform Owner
    ownerUser = await User.create({
      name: 'Platform Owner',
      email: `owner_${timestamp}_lifecycle_test@example.com`,
      password: 'Password123!',
      role: 'platform_owner',
      roles: ['platform_owner', 'super_admin', 'user'],
      accountStatus: 'ACTIVE',
      status: 'active',
      emailVerified: true,
    });
    ownerToken = ownerUser.generateAuthToken();

    // Super Admin 1
    superAdmin1 = await User.create({
      name: 'Super Admin One',
      email: `super1_${timestamp}_lifecycle_test@example.com`,
      password: 'Password123!',
      role: 'super_admin',
      roles: ['super_admin', 'user'],
      accountStatus: 'ACTIVE',
      status: 'active',
      emailVerified: true,
    });
    superAdmin1Token = superAdmin1.generateAuthToken();

    // Super Admin 2 (for multi-super admin tests)
    superAdmin2 = await User.create({
      name: 'Super Admin Two',
      email: `super2_${timestamp}_lifecycle_test@example.com`,
      password: 'Password123!',
      role: 'super_admin',
      roles: ['super_admin', 'user'],
      accountStatus: 'ACTIVE',
      status: 'active',
      emailVerified: true,
    });
    superAdmin2Token = superAdmin2.generateAuthToken();

    // Institution Admin for Institution A
    instAdminA = await User.create({
      name: 'Admin Inst A',
      email: `admin_a_${timestamp}_lifecycle_test@example.com`,
      password: 'Password123!',
      role: 'institution_admin',
      roles: ['institution_admin', 'user'],
      institutionId: institutionA._id,
      accountStatus: 'ACTIVE',
      status: 'active',
      emailVerified: true,
    });
    instAdminAToken = instAdminA.generateAuthToken();

    // Institution Admin for Institution B
    instAdminB = await User.create({
      name: 'Admin Inst B',
      email: `admin_b_${timestamp}_lifecycle_test@example.com`,
      password: 'Password123!',
      role: 'institution_admin',
      roles: ['institution_admin', 'user'],
      institutionId: institutionB._id,
      accountStatus: 'ACTIVE',
      status: 'active',
      emailVerified: true,
    });
    instAdminBToken = instAdminB.generateAuthToken();

    // Department Admin for Department A1 (in Institution A)
    deptAdminA = await User.create({
      name: 'Dept Admin CS',
      email: `dept_a_${timestamp}_lifecycle_test@example.com`,
      password: 'Password123!',
      role: 'department_admin',
      roles: ['department_admin', 'user'],
      institutionId: institutionA._id,
      departmentId: departmentA1._id,
      accountStatus: 'ACTIVE',
      status: 'active',
      emailVerified: true,
    });
    deptAdminAToken = deptAdminA.generateAuthToken();

    // Student A (belongs to Institution A & Department A1)
    studentA = await User.create({
      name: 'Student Alice',
      email: `student_a_${timestamp}_lifecycle_test@example.com`,
      password: 'Password123!',
      role: 'user',
      roles: ['user'],
      institutionId: institutionA._id,
      departmentId: departmentA1._id,
      accountStatus: 'ACTIVE',
      status: 'active',
      emailVerified: true,
    });
    studentAToken = studentA.generateAuthToken();

    // Student B (belongs to Institution B)
    studentB = await User.create({
      name: 'Student Bob',
      email: `student_b_${timestamp}_lifecycle_test@example.com`,
      password: 'Password123!',
      role: 'user',
      roles: ['user'],
      institutionId: institutionB._id,
      accountStatus: 'ACTIVE',
      status: 'active',
      emailVerified: true,
    });
  });

  afterAll(async () => {
    await User.deleteMany({ email: /.*_lifecycle_test@example\.com$/ });
    await Institution.deleteMany({ institutionCode: /.*_LC_INST$/ });
    await Department.deleteMany({ code: /.*_LC_DEPT$/ });
    await AuditLog.deleteMany({ 'details.targetEmail': /.*_lifecycle_test@example\.com$/ });
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  // ─── 1. SUSPEND LIFECYCLE TESTS ─────────────────────────────────────────────
  describe('Operation 1: SUSPEND User Account', () => {
    it('should reject suspension without a required reason', async () => {
      const res = await request(app)
        .post(`/api/admin/users/${studentA._id}/suspend`)
        .set('Authorization', `Bearer ${instAdminAToken}`)
        .send({ reason: '' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/reason is required/i);
    });

    it('should successfully suspend a user with reason and optional expiration date', async () => {
      const suspendedUntil = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(); // 7 days in future

      const res = await request(app)
        .post(`/api/admin/users/${studentA._id}/suspend`)
        .set('Authorization', `Bearer ${instAdminAToken}`)
        .send({
          reason: 'Academic integrity investigation',
          suspendedUntil,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accountStatus).toBe('SUSPENDED');
      expect(res.body.data.status).toBe('suspended');
      expect(res.body.data.suspensionReason).toBe('Academic integrity investigation');
      expect(new Date(res.body.data.suspendedUntil).toISOString()).toBe(suspendedUntil);

      // Verify AuditLog
      const log = await AuditLog.findOne({
        targetUserId: studentA._id,
        action: 'USER_SUSPENDED',
      });
      expect(log).toBeTruthy();
      expect(log.reason).toBe('Academic integrity investigation');
    });

    it('should block suspended user from accessing protected endpoints (ACCOUNT_SUSPENDED / 403 or 401)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${studentAToken}`);

      // Token version check revokes old JWT (401) or suspension check blocks with 403
      expect([401, 403]).toContain(res.statusCode);
      if (res.statusCode === 403) {
        expect(res.body.code).toBe('ACCOUNT_SUSPENDED');
      }
    });

    it('should block suspended user from logging in with valid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: studentA.email,
          password: 'Password123!',
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.code).toBe('ACCOUNT_SUSPENDED');
      expect(res.body.data.accountStatus).toBe('SUSPENDED');
      expect(res.body.data.reason).toBe('Academic integrity investigation');
    });

    it('should auto-reactivate account when suspendedUntil date has passed', async () => {
      // Set suspension date to 1 hour in the past
      await User.findByIdAndUpdate(studentA._id, {
        accountStatus: 'SUSPENDED',
        status: 'suspended',
        suspendedUntil: new Date(Date.now() - 3600 * 1000), // 1 hour ago
      });

      // Attempt login
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: studentA.email,
          password: 'Password123!',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.accountStatus).toBe('ACTIVE');

      // Verify DB record restored to ACTIVE
      const updatedUser = await User.findById(studentA._id);
      expect(updatedUser.accountStatus).toBe('ACTIVE');
      expect(updatedUser.status).toBe('active');
      expect(updatedUser.suspendedUntil).toBeNull();
    });
  });

  // ─── 2. DEACTIVATE LIFECYCLE TESTS ──────────────────────────────────────────
  describe('Operation 2: DEACTIVATE User Account', () => {
    it('should successfully deactivate a user account indefinitely', async () => {
      const res = await request(app)
        .post(`/api/admin/users/${studentA._id}/deactivate`)
        .set('Authorization', `Bearer ${instAdminAToken}`)
        .send({ reason: 'Student left university' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accountStatus).toBe('DEACTIVATED');
      expect(res.body.data.deactivationReason).toBe('Student left university');
      expect(res.body.data.suspendedUntil).toBeNull();

      // Verify AuditLog
      const log = await AuditLog.findOne({
        targetUserId: studentA._id,
        action: 'USER_DEACTIVATED',
      });
      expect(log).toBeTruthy();
      expect(log.reason).toBe('Student left university');
    });

    it('should block deactivated user from logging in (ACCOUNT_DEACTIVATED / 403)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: studentA.email,
          password: 'Password123!',
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.code).toBe('ACCOUNT_DEACTIVATED');
      expect(res.body.data.accountStatus).toBe('DEACTIVATED');
    });

    it('should successfully reactivate a deactivated user account', async () => {
      const res = await request(app)
        .post(`/api/admin/users/${studentA._id}/reactivate`)
        .set('Authorization', `Bearer ${instAdminAToken}`)
        .send({});

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accountStatus).toBe('ACTIVE');
      expect(res.body.data.status).toBe('active');
      expect(res.body.data.deactivationReason).toBe('');

      // Verify user can log in again
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: studentA.email,
          password: 'Password123!',
        });

      expect(loginRes.statusCode).toBe(200);
      expect(loginRes.body.success).toBe(true);
    });
  });

  // ─── 3. PERMANENT DELETE & RE-REGISTRATION TESTS ─────────────────────────────
  describe('Operation 3: DELETE PERMANENTLY & Re-registration Cycle', () => {
    let deletedUserEmail, oldMaviId, oldUserId;

    it('should permanently delete user and eligible dependent records while preserving audit logs', async () => {
      deletedUserEmail = `target_delete_${timestamp}_lifecycle_test@example.com`;

      // Create a user to delete
      const targetUser = await User.create({
        name: 'Target Deletion User',
        email: deletedUserEmail,
        password: 'Password123!',
        role: 'user',
        institutionId: institutionA._id,
        accountStatus: 'ACTIVE',
        status: 'active',
        emailVerified: true,
      });

      oldUserId = targetUser._id;
      oldMaviId = targetUser.maviId;

      // Attach dependent records
      await InstitutionMembership.create({
        userId: targetUser._id,
        institutionId: institutionA._id,
        role: 'student',
        status: 'active',
      });

      await DNA.create({
        userId: targetUser._id,
        skills: [{ name: 'JavaScript', category: 'Language', proficiency: 'Advanced' }],
      });

      // Call Permanent Delete Endpoint
      const res = await request(app)
        .delete(`/api/admin/users/${targetUser._id}/permanent`)
        .set('Authorization', `Bearer ${instAdminAToken}`)
        .send({
          confirmationText: 'DELETE',
          reason: 'User GDPR deletion request',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify User document is completely removed from DB
      const checkUser = await User.findById(oldUserId);
      expect(checkUser).toBeNull();

      // Verify dependent records are cascade deleted
      const checkMembership = await InstitutionMembership.findOne({ userId: oldUserId });
      expect(checkMembership).toBeNull();

      const checkDNA = await DNA.findOne({ userId: oldUserId });
      expect(checkDNA).toBeNull();

      // Verify Audit Log is preserved for legal/compliance tracking
      const checkAudit = await AuditLog.findOne({
        action: 'USER_PERMANENTLY_DELETED',
        'details.deletedUserEmail': deletedUserEmail,
      });
      expect(checkAudit).toBeTruthy();
      expect(checkAudit.details.deletedUserMaviId).toBe(oldMaviId);
    });

    it('should allow fresh re-registration with the exact same email, generating a brand-new MAVI ID and clean permissions', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Target Re-registered User',
          email: deletedUserEmail,
          password: 'NewPassword123!',
          institutionId: institutionA._id,
          role: 'user',
        });

      expect([200, 201]).toContain(res.statusCode);
      expect(res.body.success).toBe(true);

      // Fetch the newly registered user
      const freshUser = await User.findOne({ email: deletedUserEmail });
      expect(freshUser).toBeTruthy();
      expect(freshUser._id.toString()).not.toBe(oldUserId.toString());
      expect(freshUser.maviId).not.toBe(oldMaviId); // Brand-new unique MAVI ID
      expect(freshUser.role).toBe('user'); // Default student role
      expect(freshUser.permissions.length).toBe(0); // Zero inherited administrative permissions
    });
  });

  // ─── 4. SCOPING & RBAC TESTS ────────────────────────────────────────────────
  describe('Security Scoping & Cross-Tenant Protections', () => {
    it('should block Institution Admin A from suspending a user in Institution B (CROSS_INSTITUTION_ACCESS_DENIED)', async () => {
      const res = await request(app)
        .post(`/api/admin/users/${studentB._id}/suspend`)
        .set('Authorization', `Bearer ${instAdminAToken}`)
        .send({ reason: 'Malicious attempt' });

      expect(res.statusCode).toBe(403);
      expect(res.body.code).toBe('CROSS_INSTITUTION_ACCESS_DENIED');
    });

    it('should block Institution Admin A from permanently deleting a user in Institution B', async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${studentB._id}/permanent`)
        .set('Authorization', `Bearer ${instAdminAToken}`)
        .send({ confirmationText: 'DELETE' });

      expect(res.statusCode).toBe(403);
      expect(res.body.code).toBe('CROSS_INSTITUTION_ACCESS_DENIED');
    });

    it('should block Department Admin from managing a user in a different department (CROSS_DEPARTMENT_ACCESS_DENIED)', async () => {
      // Create user in Department A2
      const studentA2 = await User.create({
        name: 'Student ME',
        email: `student_me_${timestamp}_lifecycle_test@example.com`,
        password: 'Password123!',
        role: 'user',
        institutionId: institutionA._id,
        departmentId: departmentA2._id,
        accountStatus: 'ACTIVE',
        status: 'active',
      });

      // deptAdminA belongs to Department A1
      const res = await request(app)
        .post(`/api/admin/users/${studentA2._id}/suspend`)
        .set('Authorization', `Bearer ${deptAdminAToken}`)
        .send({ reason: 'Unauthorized department action' });

      expect(res.statusCode).toBe(403);
      expect(res.body.code).toBe('CROSS_DEPARTMENT_ACCESS_DENIED');
    });

    it('should block normal student from calling admin lifecycle endpoints', async () => {
      const freshStudent = await User.findById(studentA._id);
      const freshToken = freshStudent.generateAuthToken();

      const res = await request(app)
        .post(`/api/admin/users/${studentB._id}/suspend`)
        .set('Authorization', `Bearer ${freshToken}`)
        .send({ reason: 'Student trying to suspend' });

      expect(res.statusCode).toBe(403);
    });
  });

  // ─── 5. SAFETY PROTECTIONS (OWNER & LAST SUPER ADMIN) ────────────────────────
  describe('Safety Guardrails & Super Admin Protection', () => {
    it('should block any administrator from suspending or deleting the platform Owner account', async () => {
      const res = await request(app)
        .post(`/api/admin/users/${ownerUser._id}/suspend`)
        .set('Authorization', `Bearer ${superAdmin1Token}`)
        .send({ reason: 'Cannot suspend owner' });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/owner/i);
    });

    it('should prevent self-suspension or self-deletion', async () => {
      const res = await request(app)
        .post(`/api/admin/users/${instAdminA._id}/suspend`)
        .set('Authorization', `Bearer ${instAdminAToken}`)
        .send({ reason: 'Self suspend' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/own account/i);
    });

    it('should block suspending/deleting the only remaining active Super Admin (LAST_SUPER_ADMIN_PROTECTION)', async () => {
      // Find all other active super admins in DB and deactivate them temporarily
      const otherSuperAdmins = await User.find({
        role: 'super_admin',
        _id: { $ne: superAdmin1._id },
        accountStatus: { $nin: ['SUSPENDED', 'DEACTIVATED', 'DISABLED', 'REJECTED', 'DELETED'] },
        status: { $ne: 'suspended' },
      });

      for (const u of otherSuperAdmins) {
        await User.findByIdAndUpdate(u._id, { accountStatus: 'DEACTIVATED', status: 'suspended' });
      }

      const res = await request(app)
        .post(`/api/admin/users/${superAdmin1._id}/suspend`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ reason: 'Attempt to suspend last super admin' });

      expect(res.statusCode).toBe(403);
      expect(res.body.code).toBe('LAST_SUPER_ADMIN_PROTECTION');

      // Restore other super admins
      for (const u of otherSuperAdmins) {
        await User.findByIdAndUpdate(u._id, { accountStatus: 'ACTIVE', status: 'active' });
      }
    });
  });
});
