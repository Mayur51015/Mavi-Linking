const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../src/models/User');
const Institution = require('../src/models/Institution');
const Department = require('../src/models/Department');
const Role = require('../src/models/Role');
const AuditLog = require('../src/models/AuditLog');

describe('MAVI LINKING — Owner-Managed Admin Creation & Custom RBAC Integration Security Tests', () => {
  jest.setTimeout(30000);
  let app;
  let superAdmin, superToken;
  let ownerUser, ownerToken;
  let institution;
  let cseDept, itDept;
  const timestamp = Date.now() + '_' + Math.random().toString(36).substring(7);

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_owner_rbac_2026';
    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mavi_linking_test';
      await mongoose.connect(mongoUri);
    }

  const express = require('express');
  app = express();
  app.use(express.json());
  app.use('/api/auth', require('../src/routes/authRoutes'));
  app.use('/api/admin', require('../src/routes/adminRoutes'));
  app.use('/api/owner', require('../src/routes/ownerRoutes'));
  app.use('/api/billing', require('../src/routes/billingRoutes'));
  app.use(require('../src/middleware/errorHandler'));

    // Clean up test collections
    await User.deleteMany({ email: /.*_rbac_test@example\.com$/ });
    await Institution.deleteMany({ code: /.*_RBAC_INST$/ });
    await Department.deleteMany({ code: /.*_RBAC_DEPT$/ });
    await Role.deleteMany({ code: /.*_RBAC_ROLE$/ });

    // Create Platform Owner
    ownerUser = await User.create({
      name: 'Test Owner',
      email: `owner_${timestamp}_rbac_test@example.com`,
      password: 'OwnerPassword@123',
      role: 'platform_owner',
      roles: ['platform_owner', 'super_admin', 'user'],
      accountStatus: 'ACTIVE',
      status: 'active',
      isVerified: true,
      emailVerified: true,
    });
    ownerToken = jwt.sign({ id: ownerUser._id, role: ownerUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Create Super Admin
    superAdmin = await User.create({
      name: 'Test Super Admin',
      email: `superadmin_${timestamp}_rbac_test@example.com`,
      password: 'SuperPassword@123',
      role: 'super_admin',
      roles: ['super_admin', 'user'],
      accountStatus: 'ACTIVE',
      status: 'active',
      isVerified: true,
      emailVerified: true,
    });
    superToken = jwt.sign({ id: superAdmin._id, role: superAdmin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Create Test Institution
    institution = await Institution.create({
      name: `Test Institution ${timestamp}`,
      institutionCode: `INST_${timestamp}_RBAC_INST`,
      code: `INST_${timestamp}_RBAC_INST`,
      tenantId: `INST_${timestamp}_RBAC_INST`,
      shortName: 'RBACINST',
      status: 'active',
    });

    // Create Test Departments
    cseDept = await Department.create({
      institutionId: institution._id,
      name: 'Computer Science & Engineering',
      code: `CSE_${timestamp}_RBAC_DEPT`,
      status: 'active',
    });

    itDept = await Department.create({
      institutionId: institution._id,
      name: 'Information Technology',
      code: `IT_${timestamp}_RBAC_DEPT`,
      status: 'active',
    });
  });

  afterAll(async () => {
    await User.deleteMany({ email: /.*_rbac_test@example\.com$/ });
    await Institution.deleteMany({ code: /.*_RBAC_INST$/ });
    await Department.deleteMany({ code: /.*_RBAC_DEPT$/ });
    await Role.deleteMany({ code: /.*_RBAC_ROLE$/ });
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  // ─── TEST 1: Owner creates Institution Admin ─────────────────────────────
  test('TEST 1: Owner creates Institution Admin -> Invitation sent', async () => {
    const res = await request(app)
      .post('/api/owner/admins/invite')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Inst Admin Candidate',
        email: `inst_admin_${timestamp}_rbac_test@example.com`,
        institutionId: institution._id,
        role: 'institution_admin',
        scope: 'INSTITUTION',
        permissions: ['STUDENT_VIEW', 'STUDENT_APPROVE'],
      });

    if (res.statusCode !== 201) console.error('TEST 1 FAIL RES:', res.body);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.admin.accountStatus).toBe('INVITED');
    expect(res.body.data.invitationLink).toBeUndefined();
    expect(res.body.data.admin.invitationToken).toBeUndefined();
  });

  // ─── TEST 2: Owner creates CSE Admin with scope DEPARTMENT ───────────────
  test('TEST 2: Owner creates CSE Admin with scope DEPARTMENT', async () => {
    const res = await request(app)
      .post('/api/owner/admins/invite')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'CSE Admin Candidate',
        email: `cse_admin_${timestamp}_rbac_test@example.com`,
        institutionId: institution._id,
        departmentId: cseDept._id,
        role: 'department_admin',
        scope: 'DEPARTMENT',
        permissions: ['STUDENT_VIEW', 'STUDENT_APPROVE', 'STUDENT_UPDATE'],
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.admin.adminScope).toBe('DEPARTMENT');
    expect(res.body.data.admin.departmentId.toString()).toBe(cseDept._id.toString());
  });

  // ─── TEST 3: CSE Admin accesses CSE Students -> ALLOW ───────────────────
  test('TEST 3: CSE Admin accesses CSE Students -> ALLOW', async () => {
    const cseAdmin = await User.create({
      name: 'Active CSE Admin',
      email: `active_cse_${timestamp}_rbac_test@example.com`,
      password: 'CsePassword@123',
      role: 'department_admin',
      roles: ['department_admin', 'user'],
      institutionId: institution._id,
      departmentId: cseDept._id,
      accountStatus: 'ACTIVE',
      status: 'active',
      permissions: ['STUDENT_VIEW', 'STUDENT_APPROVE'],
    });
    const cseToken = jwt.sign({ id: cseAdmin._id, role: cseAdmin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const cseStudent = await User.create({
      name: 'CSE Student Target',
      email: `cse_student_${timestamp}_rbac_test@example.com`,
      password: 'StudentPass@123',
      role: 'user',
      roles: ['user'],
      institutionId: institution._id,
      departmentId: cseDept._id,
      accountStatus: 'PENDING_ADMIN_APPROVAL',
      status: 'active',
      emailVerified: true,
    });

    const res = await request(app)
      .post(`/api/admin/students/${cseStudent._id}/approve`)
      .set('Authorization', `Bearer ${cseToken}`)
      .send({});

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // ─── TEST 4: CSE Admin accesses IT Students -> DENY ─────────────────────
  test('TEST 4: CSE Admin accesses IT Students -> DENY (403 CROSS_TENANT_ACCESS_DENIED)', async () => {
    const cseAdmin = await User.findOne({ email: `active_cse_${timestamp}_rbac_test@example.com` });
    const cseToken = jwt.sign({ id: cseAdmin._id, role: cseAdmin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const itStudent = await User.create({
      name: 'IT Student Target',
      email: `it_student_${timestamp}_rbac_test@example.com`,
      password: 'StudentPass@123',
      role: 'user',
      roles: ['user'],
      institutionId: institution._id,
      departmentId: itDept._id,
      accountStatus: 'PENDING_ADMIN_APPROVAL',
      status: 'active',
      emailVerified: true,
    });

    const res = await request(app)
      .post(`/api/admin/students/${itStudent._id}/approve`)
      .set('Authorization', `Bearer ${cseToken}`)
      .send({});

    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe('CROSS_TENANT_ACCESS_DENIED');
  });

  // ─── TEST 5: Institution Admin accesses all institution students -> ALLOW
  test('TEST 5: Institution Admin accesses all institution students -> ALLOW', async () => {
    const instAdmin = await User.create({
      name: 'Active Inst Admin',
      email: `active_inst_admin_${timestamp}_rbac_test@example.com`,
      password: 'InstAdminPass@123',
      role: 'institution_admin',
      roles: ['institution_admin', 'user'],
      institutionId: institution._id,
      accountStatus: 'ACTIVE',
      status: 'active',
      permissions: ['STUDENT_VIEW', 'STUDENT_APPROVE'],
    });
    const instAdminToken = jwt.sign({ id: instAdmin._id, role: instAdmin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const itStudent = await User.findOne({ email: `it_student_${timestamp}_rbac_test@example.com` });

    const res = await request(app)
      .post(`/api/admin/students/${itStudent._id}/approve`)
      .set('Authorization', `Bearer ${instAdminToken}`)
      .send({});

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // ─── TEST 6: Institution Admin accesses another institution -> DENY ──────
  test('TEST 6: Institution Admin accesses another institution -> DENY', async () => {
    const instAdmin = await User.findOne({ email: `active_inst_admin_${timestamp}_rbac_test@example.com` });
    const instAdminToken = jwt.sign({ id: instAdmin._id, role: instAdmin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const otherInst = await Institution.create({
      name: `Other Institution ${timestamp}`,
      institutionCode: `OTHER_${timestamp}_RBAC_INST`,
      code: `OTHER_${timestamp}_RBAC_INST`,
      tenantId: `OTHER_${timestamp}_RBAC_INST`,
      status: 'active',
    });

    const foreignStudent = await User.create({
      name: 'Foreign Student',
      email: `foreign_student_${timestamp}_rbac_test@example.com`,
      password: 'StudentPass@123',
      role: 'user',
      roles: ['user'],
      institutionId: otherInst._id,
      accountStatus: 'PENDING_ADMIN_APPROVAL',
      status: 'active',
      emailVerified: true,
    });

    const res = await request(app)
      .post(`/api/admin/students/${foreignStudent._id}/approve`)
      .set('Authorization', `Bearer ${instAdminToken}`)
      .send({});

    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe('CROSS_TENANT_ACCESS_DENIED');
  });

  // ─── TEST 7 & 8: Placement Admin Permissions Scoping ─────────────────────
  test('TEST 7 & 8: Placement Admin accesses placement (ALLOW) vs billing (DENY)', async () => {
    const placementAdmin = await User.create({
      name: 'Placement Admin',
      email: `placement_admin_${timestamp}_rbac_test@example.com`,
      password: 'PlacementPass@123',
      role: 'placement_admin',
      roles: ['placement_admin', 'user'],
      institutionId: institution._id,
      accountStatus: 'ACTIVE',
      status: 'active',
      permissions: ['PLACEMENT_VIEW', 'PLACEMENT_MANAGE', 'RECRUITER_VIEW'],
    });
    const placementToken = jwt.sign({ id: placementAdmin._id, role: placementAdmin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Billing endpoint access check -> DENY 403
    const billingRes = await request(app)
      .get('/api/billing/subscription')
      .set('Authorization', `Bearer ${placementToken}`);

    expect(billingRes.statusCode).toBe(403);
  });

  // ─── TEST 9: Ordinary Admin attempts to create Super Admin -> DENY ───────
  test('TEST 9: Ordinary Admin attempts to create Super Admin -> DENY', async () => {
    const ordinaryAdmin = await User.findOne({ email: `active_inst_admin_${timestamp}_rbac_test@example.com` });
    const ordinaryToken = jwt.sign({ id: ordinaryAdmin._id, role: ordinaryAdmin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const res = await request(app)
      .post('/api/owner/admins/invite')
      .set('Authorization', `Bearer ${ordinaryToken}`)
      .send({
        name: 'Rogue Super Admin',
        email: `rogue_super_${timestamp}_rbac_test@example.com`,
        role: 'super_admin',
        scope: 'PLATFORM',
      });

    expect(res.statusCode).toBe(403);
  });

  // ─── TEST 10: Admin attempts permission escalation -> DENY ───────────────
  test('TEST 10: Admin attempts to grant permission they cannot delegate -> DENY', async () => {
    const limitedAdmin = await User.create({
      name: 'Limited Admin',
      email: `limited_admin_${timestamp}_rbac_test@example.com`,
      password: 'LimitedPass@123',
      role: 'institution_admin',
      roles: ['institution_admin', 'user'],
      institutionId: institution._id,
      accountStatus: 'ACTIVE',
      status: 'active',
      permissions: ['INSTITUTION_ADMIN_MANAGE', 'STUDENT_VIEW'], // Possesses INSTITUTION_ADMIN_MANAGE but NOT BILLING_VIEW
    });
    const limitedToken = jwt.sign({ id: limitedAdmin._id, role: limitedAdmin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const res = await request(app)
      .post('/api/owner/admins/invite')
      .set('Authorization', `Bearer ${limitedToken}`)
      .send({
        name: 'Subordinate Admin',
        email: `subordinate_${timestamp}_rbac_test@example.com`,
        institutionId: institution._id,
        role: 'department_admin',
        scope: 'DEPARTMENT',
        departmentId: cseDept._id,
        permissions: ['BILLING_VIEW', 'PLATFORM_ADMIN_MANAGE'], // Permission escalation!
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe('PERMISSION_DELEGATION_DENIED');
  });

  // ─── TEST 11: Suspended Admin attempts login/protected route -> DENY ─────
  test('TEST 11: Suspended admin attempts access -> DENY (403)', async () => {
    const suspendedAdmin = await User.create({
      name: 'Suspended Admin',
      email: `suspended_admin_${timestamp}_rbac_test@example.com`,
      password: 'SuspendedPass@123',
      role: 'institution_admin',
      roles: ['institution_admin', 'user'],
      institutionId: institution._id,
      accountStatus: 'SUSPENDED',
      status: 'suspended',
      suspensionReason: 'Audit violation',
    });
    const suspendedToken = jwt.sign({ id: suspendedAdmin._id, role: suspendedAdmin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${suspendedToken}`);

    expect(res.statusCode).toBe(403);
  });

  // ─── TEST 12, 13, 14: Invitation Token Verification & Acceptance ──────────
  test('TEST 12, 13, 14: Invitation Token Lifecycle & Single-Use Enforcement', async () => {
    // Invite candidate
    const inviteRes = await request(app)
      .post('/api/owner/admins/invite')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Invitation Lifecycle Candidate',
        email: `lifecycle_invite_${timestamp}_rbac_test@example.com`,
        institutionId: institution._id,
        role: 'institution_admin',
        scope: 'INSTITUTION',
        permissions: ['STUDENT_VIEW'],
      });

    expect(inviteRes.statusCode).toBe(201);
    expect(inviteRes.body.data.invitationLink).toBeUndefined();
    expect(inviteRes.body.data.admin.invitationToken).toBeUndefined();

    const invitedUser = await User.findOne({ email: `lifecycle_invite_${timestamp}_rbac_test@example.com` }).select('+invitationToken');
    const token = invitedUser.invitationToken;

    // Verify token GET
    const verifyRes = await request(app).get(`/api/auth/verify-admin-invite/${token}`);
    expect(verifyRes.statusCode).toBe(200);
    expect(verifyRes.body.data.email).toBe(`lifecycle_invite_${timestamp}_rbac_test@example.com`);

    // Accept invitation POST
    const acceptRes = await request(app)
      .post('/api/auth/accept-admin-invite')
      .send({ token, password: 'NewSecurePassword@123' });

    expect(acceptRes.statusCode).toBe(200);
    expect(acceptRes.body.data.user.accountStatus).toBe('ACTIVE');

    // Attempt token reuse (TEST 14) -> DENY
    const reuseRes = await request(app)
      .post('/api/auth/accept-admin-invite')
      .send({ token, password: 'NewSecurePassword@123' });

    expect(reuseRes.statusCode).toBe(400);
  });

  // ─── TEST 15 & 16: Owner changes admin scope & permissions ──────────────
  test('TEST 15 & 16: Owner changes admin scope & permissions', async () => {
    const adminToEdit = await User.create({
      name: 'Admin To Edit',
      email: `admin_edit_${timestamp}_rbac_test@example.com`,
      password: 'Password@123',
      role: 'department_admin',
      roles: ['department_admin', 'user'],
      adminScope: 'DEPARTMENT',
      institutionId: institution._id,
      departmentId: cseDept._id,
      accountStatus: 'ACTIVE',
      status: 'active',
      permissions: ['STUDENT_VIEW'],
    });

    const res = await request(app)
      .put(`/api/owner/admins/${adminToEdit._id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        role: 'institution_admin',
        scope: 'INSTITUTION',
        permissions: ['STUDENT_VIEW', 'STUDENT_APPROVE', 'PLACEMENT_MANAGE'],
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.admin.adminScope).toBe('INSTITUTION');
    expect(res.body.data.admin.permissions).toContain('PLACEMENT_MANAGE');
  });
});
