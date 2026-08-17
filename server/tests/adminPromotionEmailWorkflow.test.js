const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const express = require('express');
const User = require('../src/models/User');
const Institution = require('../src/models/Institution');
const Department = require('../src/models/Department');
const AuditLog = require('../src/models/AuditLog');

jest.setTimeout(30000);

describe('MAVI LINKING — Fix Promoted Admin Invitation Email Workflow Integration Tests', () => {
  let app;
  let ownerUser, ownerToken;
  let superAdmin, superToken;
  let institutionAdmin, instAdminToken;
  let foreignInstAdmin, foreignInstAdminToken;
  let institutionA, institutionB;
  let cseDeptA, eceDeptB;
  const timestamp = Date.now() + '_' + Math.random().toString(36).substring(7);

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_admin_invite_2026';
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
    await User.deleteMany({ email: /.*_invite_test@example\.com$/ });
    await Institution.deleteMany({ institutionCode: /.*_INV_INST$/ });
    await Institution.deleteMany({ institutionCode: 'INST-HQ-01' });
    await Department.deleteMany({ code: /.*_INV_DEPT$/ });

    // Create Institutions
    institutionA = await Institution.create({
      name: `Institution A ${timestamp}`,
      institutionCode: `A_${timestamp.slice(0, 4)}_INV_INST`.toUpperCase(),
      tenantId: `INST-A-${timestamp.slice(0, 4)}`,
      status: 'active',
    });

    institutionB = await Institution.create({
      name: `Institution B ${timestamp}`,
      institutionCode: `B_${timestamp.slice(0, 4)}_INV_INST`.toUpperCase(),
      tenantId: `INST-B-${timestamp.slice(0, 4)}`,
      status: 'active',
    });

    // Create Departments
    cseDeptA = await Department.create({
      name: 'Computer Science and Engineering',
      code: `CSE_${timestamp.slice(0, 4)}_INV_DEPT`,
      institutionId: institutionA._id,
    });

    eceDeptB = await Department.create({
      name: 'Electronics Engineering',
      code: `ECE_${timestamp.slice(0, 4)}_INV_DEPT`,
      institutionId: institutionB._id,
    });

    // Create Platform Owner
    ownerUser = await User.create({
      name: 'Platform Owner User',
      email: `owner_${timestamp}_invite_test@example.com`,
      password: 'OwnerPassword@123',
      role: 'platform_owner',
      roles: ['platform_owner', 'super_admin', 'user'],
      accountStatus: 'ACTIVE',
      status: 'active',
      emailVerified: true,
    });
    ownerToken = jwt.sign({ id: ownerUser._id, role: ownerUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Create Super Admin
    superAdmin = await User.create({
      name: 'Super Admin User',
      email: `superadmin_${timestamp}_invite_test@example.com`,
      password: 'SuperPassword@123',
      role: 'super_admin',
      roles: ['super_admin', 'admin', 'user'],
      accountStatus: 'ACTIVE',
      status: 'active',
      emailVerified: true,
    });
    superToken = jwt.sign({ id: superAdmin._id, role: superAdmin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Create Institution Admin for Institution A
    institutionAdmin = await User.create({
      name: 'Inst Admin A User',
      email: `inst_admin_a_${timestamp}_invite_test@example.com`,
      password: 'AdminPassword@123',
      role: 'institution_admin',
      roles: ['institution_admin', 'admin', 'user'],
      institutionId: institutionA._id,
      tenantId: institutionA.tenantId,
      accountStatus: 'ACTIVE',
      status: 'active',
      emailVerified: true,
      permissions: ['DEPARTMENT_ADMIN_APPOINT', 'DEPARTMENT_ADMIN_VIEW', 'STUDENTS_VIEW'],
    });
    instAdminToken = jwt.sign(
      { id: institutionAdmin._id, role: institutionAdmin.role, institutionId: institutionA._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create Institution Admin for Institution B
    foreignInstAdmin = await User.create({
      name: 'Inst Admin B User',
      email: `inst_admin_b_${timestamp}_invite_test@example.com`,
      password: 'AdminPassword@123',
      role: 'institution_admin',
      roles: ['institution_admin', 'admin', 'user'],
      institutionId: institutionB._id,
      tenantId: institutionB.tenantId,
      accountStatus: 'ACTIVE',
      status: 'active',
      emailVerified: true,
      permissions: ['DEPARTMENT_ADMIN_APPOINT', 'DEPARTMENT_ADMIN_VIEW'],
    });
    foreignInstAdminToken = jwt.sign(
      { id: foreignInstAdmin._id, role: foreignInstAdmin.role, institutionId: institutionB._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await User.deleteMany({ email: /.*_invite_test@example\.com$/ });
    await Institution.deleteMany({ code: /.*_INV_INST$/ });
    await Department.deleteMany({ code: /.*_INV_DEPT$/ });
    await AuditLog.deleteMany({ 'details.email': /.*_invite_test@example\.com$/ });
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  // ─── TEST 1: Owner Promotes User to Institution Admin ──────────────────────
  test('TEST 1: Owner promotes user to Institution Admin -> Generates token, dispatches email & records audit log', async () => {
    const candidateEmail = `inst_candidate_${timestamp}_invite_test@example.com`;
    const res = await request(app)
      .post('/api/owner/admins/invite')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Promoted Institution Admin',
        email: candidateEmail,
        institutionId: institutionA._id,
        role: 'institution_admin',
        scope: 'INSTITUTION',
        permissions: ['STUDENTS_VIEW', 'STUDENT_APPROVE'],
        designation: 'Vice Principal & Admin',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.emailSent).toBe(true);
    expect(res.body.data.admin.accountStatus).toBe('INVITED');
    expect(res.body.data.invitationLink).toBeUndefined();
    expect(res.body.data.admin.invitationToken).toBeUndefined();

    // Verify User record in DB
    const dbUser = await User.findOne({ email: candidateEmail }).select('+invitationToken +invitationExpires');
    expect(dbUser).not.toBeNull();
    expect(dbUser.invitationToken).toBeDefined();
    expect(dbUser.invitationExpires).toBeDefined();
    expect(dbUser.isInvitedAdmin).toBe(true);
  });

  // ─── TEST 2: Super Admin Invites Administrator ─────────────────────────────
  test('TEST 2: Super Admin invites new Institution Admin -> Dispatches email & generates invitation link', async () => {
    const candidateEmail = `super_candidate_${timestamp}_invite_test@example.com`;
    const res = await request(app)
      .post('/api/super-admin/admins')
      .set('Authorization', `Bearer ${superToken}`)
      .send({
        name: 'Super Admin Nominated Admin',
        email: candidateEmail,
        institutionId: institutionA._id,
        role: 'institution_admin',
        designation: 'Registrar',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.emailSent).toBe(true);
    expect(res.body.data.invitationLink).toBeUndefined();
    expect(res.body.data.user.invitationToken).toBeUndefined();

    const dbUser = await User.findOne({ email: candidateEmail }).select('+invitationToken');
    expect(dbUser.accountStatus).toBe('INVITED');
    expect(dbUser.invitationToken).toBeDefined();
  });

  // ─── TEST 3: Super Admin Assigns Existing User as Institution Admin ────────
  test('TEST 3: Super Admin assigns existing user as Institution Admin -> Generates invitation & dispatches email', async () => {
    const existingStudentEmail = `student_to_admin_${timestamp}_invite_test@example.com`;
    const studentUser = await User.create({
      name: 'Student Candidate For Admin',
      email: existingStudentEmail,
      password: 'Password123!',
      role: 'user',
      roles: ['user'],
      institutionId: institutionA._id,
      accountStatus: 'ACTIVE',
      status: 'active',
      emailVerified: true,
    });

    const res = await request(app)
      .post(`/api/admin/institutions/${institutionA._id}/assign-admin`)
      .set('Authorization', `Bearer ${superToken}`)
      .send({ userId: studentUser._id });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.emailSent).toBe(true);
    expect(res.body.data.invitationLink).toBeUndefined();
    expect(res.body.data.user.invitationToken).toBeUndefined();

    const updatedUser = await User.findById(studentUser._id).select('+invitationToken');
    expect(updatedUser.role).toBe('institution_admin');
    expect(updatedUser.accountStatus).toBe('INVITED');
    expect(updatedUser.invitationToken).toBeDefined();
  });

  // ─── TEST 4: Institution Admin Appoints Department Admin ───────────────────
  test('TEST 4: Institution Admin A appoints Department Admin for CSE -> Generates token & sends email', async () => {
    const deptCandidateEmail = `dept_admin_cand_${timestamp}_invite_test@example.com`;
    const res = await request(app)
      .post(`/api/admin/departments/${cseDeptA._id}/admins`)
      .set('Authorization', `Bearer ${instAdminToken}`)
      .send({
        name: 'CSE Department Head',
        email: deptCandidateEmail,
        departmentId: cseDeptA._id,
        employeeId: `EMP-${timestamp.slice(0, 6)}`,
        designation: 'Head of Department',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.emailSent).toBe(true);
    expect(res.body.data.invitationLink).toBeUndefined();

    const dbDeptAdmin = await User.findOne({ email: deptCandidateEmail }).select('+invitationToken');
    expect(dbDeptAdmin.role).toBe('department_admin');
    expect(dbDeptAdmin.accountStatus).toBe('INVITED');
    expect(dbDeptAdmin.invitationToken).toBeDefined();
  });

  // ─── TEST 5: Cross-Institution Protection ──────────────────────────────────
  test('TEST 5: Institution Admin A cannot appoint Department Admin in Institution B (403)', async () => {
    const res = await request(app)
      .post(`/api/admin/departments/${eceDeptB._id}/admins`)
      .set('Authorization', `Bearer ${instAdminToken}`)
      .send({
        name: 'Unauthorized ECE Dept Admin',
        email: `unauthorized_${timestamp}_invite_test@example.com`,
        departmentId: eceDeptB._id,
      });

    expect(res.statusCode).toBe(403);
  });

  // ─── TEST 6: Resend Invitation with Rate Limiting ───────────────────────────
  test('TEST 6: Owner resends invitation -> Generates new token & enforces rate limiting', async () => {
    const resendEmail = `resend_target_${timestamp}_invite_test@example.com`;
    const targetAdmin = await User.create({
      name: 'Resend Target Admin',
      email: resendEmail,
      role: 'institution_admin',
      roles: ['institution_admin', 'user'],
      institutionId: institutionA._id,
      accountStatus: 'INVITED',
      status: 'active',
      invitationToken: 'old_expired_token_12345',
      invitationExpires: new Date(Date.now() - 3600000), // Expired 1 hr ago
      invitedAt: new Date(Date.now() - 120000), // Invited 2 min ago (outside 60s cooldown)
    });

    const res = await request(app)
      .post(`/api/owner/admins/${targetAdmin._id}/resend-invite`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.emailSent).toBe(true);
    expect(res.body.data.invitationLink).toBeUndefined();

    const updated = await User.findById(targetAdmin._id).select('+invitationToken +invitationExpires');
    expect(updated.invitationToken).not.toBe('old_expired_token_12345');
    expect(new Date(updated.invitationExpires).getTime()).toBeGreaterThan(Date.now());

    // Immediate second resend should trigger 429 Rate Limit
    const rateLimitedRes = await request(app)
      .post(`/api/owner/admins/${targetAdmin._id}/resend-invite`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(rateLimitedRes.statusCode).toBe(429);
    expect(rateLimitedRes.body.code).toBe('RATE_LIMITED');
  });

  // ─── TEST 7: Accept Invitation Lifecycle ───────────────────────────────────
  test('TEST 7: Promoted Administrator accepts invitation -> Sets permanent password & activates account', async () => {
    const inviteToken = 'test_valid_invitation_token_' + timestamp;
    const adminUser = await User.create({
      name: 'Accepting Admin User',
      email: `accept_admin_${timestamp}_invite_test@example.com`,
      password: 'TemporaryPassword123!',
      role: 'institution_admin',
      roles: ['institution_admin', 'user'],
      institutionId: institutionA._id,
      adminId: `ADM-TEST-${timestamp.slice(0, 4)}`,
      designation: 'Dean of Academics',
      accountStatus: 'INVITED',
      status: 'active',
      isInvitedAdmin: true,
      mustChangePassword: true,
      invitationToken: inviteToken,
      invitationExpires: new Date(Date.now() + 48 * 3600 * 1000),
    });

    // 1. Verify invitation token endpoint
    const verifyRes = await request(app).get(`/api/auth/verify-admin-invite/${inviteToken}`);
    expect(verifyRes.statusCode).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.data.name).toBe('Accepting Admin User');
    expect(verifyRes.body.data.email).toBe(`accept_admin_${timestamp}_invite_test@example.com`);

    // 2. Accept invitation & set permanent password
    const acceptRes = await request(app)
      .post('/api/auth/accept-admin-invite')
      .send({
        token: inviteToken,
        password: 'NewPermanentAdminPass@123',
      });

    expect(acceptRes.statusCode).toBe(200);
    expect(acceptRes.body.success).toBe(true);
    expect(acceptRes.body.data.token).toBeDefined();

    // Verify user in DB is now ACTIVE and token is cleared
    const activatedAdmin = await User.findById(adminUser._id).select('+invitationToken +password');
    expect(activatedAdmin.accountStatus).toBe('ACTIVE');
    expect(activatedAdmin.isInvitedAdmin).toBe(false);
    expect(activatedAdmin.invitationToken).toBeNull();
    expect(activatedAdmin.mustChangePassword).toBe(false);

    // 3. Attempting to reuse the accepted token should be rejected (Single-use test)
    const reuseRes = await request(app)
      .post('/api/auth/accept-admin-invite')
      .send({
        token: inviteToken,
        password: 'AnotherPassword@123',
      });

    expect(reuseRes.statusCode).toBe(400);
  });
});
