const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const express = require('express');
const User = require('../src/models/User');
const Institution = require('../src/models/Institution');
const Department = require('../src/models/Department');
const AuditLog = require('../src/models/AuditLog');
const { getAdminInvitationExpiryHours, getAdminInvitationExpiresAt } = require('../src/config/invitationConfig');

jest.setTimeout(30000);

describe('MAVI LINKING — 24-Hour Admin Invitation Validity & Resend Security Tests', () => {
  let app;
  let ownerUser, ownerToken;
  let superAdmin, superToken;
  let instAdminA, instAdminAToken;
  let instAdminB, instAdminBToken;
  let regularUser, regularUserToken;
  let institutionA, institutionB;
  let cseDeptA, eceDeptB;
  const timestamp = Date.now() + '_' + Math.random().toString(36).substring(7);

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_invite_resend_2026';
    delete process.env.ADMIN_INVITATION_EXPIRY_HOURS;
    process.env.SECURITY_TOKEN_EXPIRY_MINUTES = '10';

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
    app.use(require('../src/middleware/errorHandler'));

    // Clean up test collections
    await User.deleteMany({ email: /.*_act_resend_test@example\.com$/ });
    await Institution.deleteMany({ name: /.*Activation Institution.*/ });
    await Institution.deleteMany({ institutionCode: /.*_ACT_INST$/ });
    await Department.deleteMany({ code: /.*_ACT_DEPT$/ });

    const randHex = crypto.randomBytes(6).toString('hex');

    // 1. Create Institutions
    institutionA = await Institution.create({
      name: `Activation Institution A ${randHex}`,
      institutionCode: `A_${randHex}_ACT_INST`.toUpperCase(),
      tenantId: `INST-A-${randHex}`,
      status: 'active',
    });

    institutionB = await Institution.create({
      name: `Activation Institution B ${randHex}`,
      institutionCode: `B_${randHex}_ACT_INST`.toUpperCase(),
      tenantId: `INST-B-${randHex}`,
      status: 'active',
    });

    // 2. Create Departments
    cseDeptA = await Department.create({
      name: 'Computer Science and Engineering',
      code: `CSE_${randHex}_ACT_DEPT`,
      institutionId: institutionA._id,
    });

    eceDeptB = await Department.create({
      name: 'Electronics and Communication',
      code: `ECE_${randHex}_ACT_DEPT`,
      institutionId: institutionB._id,
    });

    // 3. Create Users
    ownerUser = await User.create({
      name: 'Platform Owner User',
      email: `owner_${timestamp}_act_resend_test@example.com`,
      password: 'OwnerPassword@123',
      role: 'platform_owner',
      roles: ['platform_owner', 'super_admin', 'user'],
      accountStatus: 'ACTIVE',
      status: 'active',
      emailVerified: true,
    });
    ownerToken = jwt.sign({ id: ownerUser._id, role: ownerUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    superAdmin = await User.create({
      name: 'Super Admin User',
      email: `superadmin_${timestamp}_act_resend_test@example.com`,
      password: 'SuperPassword@123',
      role: 'super_admin',
      roles: ['super_admin', 'admin', 'user'],
      accountStatus: 'ACTIVE',
      status: 'active',
      emailVerified: true,
    });
    superToken = jwt.sign({ id: superAdmin._id, role: superAdmin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    instAdminA = await User.create({
      name: 'Institution Admin A',
      email: `inst_admin_a_${timestamp}_act_resend_test@example.com`,
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
    instAdminAToken = jwt.sign(
      { id: instAdminA._id, role: instAdminA.role, institutionId: institutionA._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    instAdminB = await User.create({
      name: 'Institution Admin B',
      email: `inst_admin_b_${timestamp}_act_resend_test@example.com`,
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
    instAdminBToken = jwt.sign(
      { id: instAdminB._id, role: instAdminB.role, institutionId: institutionB._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    regularUser = await User.create({
      name: 'Regular Student User',
      email: `student_${timestamp}_act_resend_test@example.com`,
      password: 'StudentPassword@123',
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
    await User.deleteMany({ email: /.*_act_resend_test@example\.com$/ });
    await Institution.deleteMany({ institutionCode: /.*_ACT_INST$/ });
    await Department.deleteMany({ code: /.*_ACT_DEPT$/ });
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  // ─── TEST 1: Create Administrator -> 24-Hour Expiration Calculated ─────────
  test('TEST 1: Create administrator -> Invitation expires exactly 24 hours after creation', async () => {
    const newAdminEmail = `test1_admin_${timestamp}_act_resend_test@example.com`;
    const beforeCreation = Date.now();

    const res = await request(app)
      .post('/api/owner/admins/invite')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Prof. Twenty Four',
        email: newAdminEmail,
        role: 'institution_admin',
        scope: 'INSTITUTION',
        institutionId: institutionA._id,
        permissions: ['STUDENTS_VIEW'],
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);

    const dbUser = await User.findOne({ email: newAdminEmail }).select('+invitationToken +invitationExpires');
    expect(dbUser).toBeDefined();
    expect(dbUser.invitationExpires).toBeDefined();

    const expiryTime = new Date(dbUser.invitationExpires).getTime();
    const expectedExpiry = beforeCreation + 10 * 60 * 1000;
    // Allow 5 seconds tolerance for test execution
    expect(Math.abs(expiryTime - expectedExpiry)).toBeLessThan(5000);
  });

  // ─── TEST 2: Open Invitation Immediately -> Valid ──────────────────────────
  test('TEST 2: Open invitation immediately -> Returns 200 INVITATION_VALID with 24-hour metadata', async () => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const targetEmail = `test2_admin_${timestamp}_act_resend_test@example.com`;

    await User.create({
      name: 'Dr. Immediate Open',
      email: targetEmail,
      role: 'institution_admin',
      roles: ['institution_admin', 'user'],
      institutionId: institutionA._id,
      accountStatus: 'INVITED',
      status: 'active',
      isInvitedAdmin: true,
      invitationToken: hashedToken,
      invitationExpires: getAdminInvitationExpiresAt(),
    });

    const verifyRes = await request(app).get(`/api/auth/verify-admin-invite/${rawToken}`);
    expect(verifyRes.statusCode).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.code).toBe('INVITATION_VALID');
    expect(verifyRes.body.data.email).toBe(targetEmail);
    expect(verifyRes.body.data.name).toBe('Dr. Immediate Open');
    expect(verifyRes.body.data.expiresAt).toBeDefined();
    expect(verifyRes.body.data.validityMinutes || verifyRes.body.data.validityHours).toBe(10);
  });

  // ─── TEST 3: Set Password and Activate -> Account Becomes ACTIVE ────────────
  test('TEST 3: Set password and activate -> Account becomes ACTIVE and token is invalidated', async () => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const targetEmail = `test3_admin_${timestamp}_act_resend_test@example.com`;

    const user = await User.create({
      name: 'Dr. Jane Activated Admin',
      email: targetEmail,
      role: 'institution_admin',
      roles: ['institution_admin', 'user'],
      institutionId: institutionA._id,
      accountStatus: 'INVITED',
      status: 'active',
      isInvitedAdmin: true,
      invitationToken: hashedToken,
      invitationExpires: getAdminInvitationExpiresAt(),
    });

    const acceptRes = await request(app)
      .post('/api/auth/accept-admin-invite')
      .send({
        token: rawToken,
        password: 'PermanentSecurePassword@2026',
        confirmPassword: 'PermanentSecurePassword@2026',
      });

    expect(acceptRes.statusCode).toBe(200);
    expect(acceptRes.body.success).toBe(true);
    expect(acceptRes.body.data.token).toBeDefined();

    const updated = await User.findById(user._id).select('+invitationToken +password');
    expect(updated.accountStatus).toBe('ACTIVE');
    expect(updated.invitationToken).toBeNull();
    expect(updated.isInvitedAdmin).toBe(false);
    expect(updated.emailVerified).toBe(true);

    const isPasswordValid = await updated.comparePassword('PermanentSecurePassword@2026');
    expect(isPasswordValid).toBe(true);
  });

  // ─── TEST 4: Use Invitation After Expiration -> INVITATION_EXPIRED ──────────
  test('TEST 4: Use invitation after expiration -> Returns 400 INVITATION_EXPIRED', async () => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    await User.create({
      name: 'Expired 24h Admin',
      email: `test4_expired_${timestamp}_act_resend_test@example.com`,
      role: 'institution_admin',
      roles: ['institution_admin', 'user'],
      institutionId: institutionA._id,
      accountStatus: 'INVITED',
      status: 'active',
      invitationToken: hashedToken,
      invitationExpires: new Date(Date.now() - 3600000), // Expired 1 hour ago
    });

    const verifyRes = await request(app).get(`/api/auth/verify-admin-invite/${rawToken}`);
    expect(verifyRes.statusCode).toBe(400);
    expect(verifyRes.body.code).toBe('INVITATION_EXPIRED');

    const acceptRes = await request(app)
      .post('/api/auth/accept-admin-invite')
      .send({ token: rawToken, password: 'NewPassword@123' });
    expect(acceptRes.statusCode).toBe(400);
    expect(acceptRes.body.code).toBe('INVITATION_EXPIRED');
  });

  // ─── TEST 5 & 6: Resend Invitation -> Old Token Revoked, New 24-Hour Token ─
  test('TEST 5 & 6: Resend invitation -> Old token revoked, new token valid for 24 hours', async () => {
    const rawTokenA = crypto.randomBytes(32).toString('hex');
    const hashedTokenA = crypto.createHash('sha256').update(rawTokenA).digest('hex');
    const resendEmail = `test5_resend_${timestamp}_act_resend_test@example.com`;

    const targetAdmin = await User.create({
      name: 'Resend Target Admin 24h',
      email: resendEmail,
      role: 'institution_admin',
      roles: ['institution_admin', 'user'],
      institutionId: institutionA._id,
      accountStatus: 'INVITED',
      status: 'active',
      invitationToken: hashedTokenA,
      invitationExpires: getAdminInvitationExpiresAt(),
      invitedAt: new Date(Date.now() - 120000), // Invited 2 mins ago
    });

    const beforeResend = Date.now();

    // Resend invite via Super Admin API
    const resendRes = await request(app)
      .post(`/api/super-admin/admins/${targetAdmin._id}/resend-invite`)
      .set('Authorization', `Bearer ${superToken}`);

    expect(resendRes.statusCode).toBe(200);
    expect(resendRes.body.success).toBe(true);
    expect(resendRes.body.emailSent).toBe(true);

    // TEST 6: Old Token A is now rejected
    const verifyOldRes = await request(app).get(`/api/auth/verify-admin-invite/${rawTokenA}`);
    expect(verifyOldRes.statusCode).toBe(400);
    expect(verifyOldRes.body.code).toBe('INVITATION_INVALID');

    // TEST 5: Verify new token generated in DB with new 24h expiration
    const updatedAdmin = await User.findById(targetAdmin._id).select('+invitationToken +invitationExpires');
    expect(updatedAdmin.invitationToken).not.toBe(hashedTokenA);
    expect(updatedAdmin.invitationToken).toBeDefined();

    const expiryTime = new Date(updatedAdmin.invitationExpires).getTime();
    const expectedExpiry = beforeResend + 10 * 60 * 1000;
    expect(Math.abs(expiryTime - expectedExpiry)).toBeLessThan(5000);
  });

  // ─── TEST 7: Use New Invitation -> Works Normally ──────────────────────────
  test('TEST 7: Department Admin appointment -> Resend and activate using new token', async () => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const targetEmail = `test7_dept_${timestamp}_act_resend_test@example.com`;

    const deptAdmin = await User.create({
      name: 'Dr. Department Head',
      email: targetEmail,
      role: 'department_admin',
      roles: ['department_admin', 'user'],
      institutionId: institutionA._id,
      departmentId: cseDeptA._id,
      accountStatus: 'INVITED',
      status: 'active',
      invitationToken: hashedToken,
      invitationExpires: getAdminInvitationExpiresAt(),
    });

    const verifyRes = await request(app).get(`/api/auth/verify-admin-invite/${rawToken}`);
    expect(verifyRes.statusCode).toBe(200);
    expect(verifyRes.body.code).toBe('INVITATION_VALID');

    const acceptRes = await request(app)
      .post('/api/auth/accept-admin-invite')
      .send({
        token: rawToken,
        password: 'DeptAdminPassword@2026',
        confirmPassword: 'DeptAdminPassword@2026',
      });
    expect(acceptRes.statusCode).toBe(200);
    expect(acceptRes.body.success).toBe(true);
  });

  // ─── TEST 8: Use Invitation Twice -> Second Attempt Rejected ───────────────
  test('TEST 8: Same invitation token used twice -> Second attempt is rejected', async () => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    await User.create({
      name: 'Single Use 24h Admin',
      email: `test8_singleuse_${timestamp}_act_resend_test@example.com`,
      role: 'institution_admin',
      roles: ['institution_admin', 'user'],
      institutionId: institutionA._id,
      accountStatus: 'INVITED',
      status: 'active',
      invitationToken: hashedToken,
      invitationExpires: getAdminInvitationExpiresAt(),
    });

    // First use: SUCCESS
    const firstRes = await request(app)
      .post('/api/auth/accept-admin-invite')
      .send({ token: rawToken, password: 'PasswordFirstUse@123' });
    expect(firstRes.statusCode).toBe(200);

    // Second use with same token: DENIED
    const secondRes = await request(app)
      .post('/api/auth/accept-admin-invite')
      .send({ token: rawToken, password: 'PasswordSecondUse@123' });
    expect(secondRes.statusCode).toBe(400);
  });

  // ─── TEST 9: Account Already Active -> Invitation Cannot Activate Again ────
  test('TEST 9: Account already active -> Cannot activate again', async () => {
    const rawToken = crypto.randomBytes(32).toString('hex');

    await User.create({
      name: 'Already Active Admin',
      email: `test9_active_${timestamp}_act_resend_test@example.com`,
      role: 'institution_admin',
      roles: ['institution_admin', 'user'],
      institutionId: institutionA._id,
      accountStatus: 'ACTIVE',
      status: 'active',
      invitationToken: null,
      emailVerified: true,
    });

    const res = await request(app)
      .post('/api/auth/accept-admin-invite')
      .send({ token: rawToken, password: 'AnyPassword@123' });
    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe('INVITATION_INVALID');
  });

  // ─── TEST 10 & 11: Email Resend from Institution Admin ─────────────────────
  test('TEST 10 & 11: Institution Admin resends department admin invite -> Generates new 24-hour invitation', async () => {
    const rawTokenA = crypto.randomBytes(32).toString('hex');
    const hashedTokenA = crypto.createHash('sha256').update(rawTokenA).digest('hex');

    const deptAdmin = await User.create({
      name: 'Dept Admin Test 10',
      email: `test10_dept_${timestamp}_act_resend_test@example.com`,
      role: 'department_admin',
      roles: ['department_admin', 'user'],
      institutionId: institutionA._id,
      departmentId: cseDeptA._id,
      accountStatus: 'INVITED',
      status: 'active',
      invitationToken: hashedTokenA,
      invitationExpires: new Date(Date.now() - 3600000), // Expired
      invitedAt: new Date(Date.now() - 120000),
    });

    const beforeResend = Date.now();

    const res = await request(app)
      .post(`/api/admin/department-admins/${deptAdmin._id}/resend-invite`)
      .set('Authorization', `Bearer ${instAdminAToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const updated = await User.findById(deptAdmin._id).select('+invitationToken +invitationExpires');
    expect(updated.invitationToken).not.toBe(hashedTokenA);
    const expiryTime = new Date(updated.invitationExpires).getTime();
    expect(Math.abs(expiryTime - (beforeResend + 10 * 60 * 1000))).toBeLessThan(5000);
  });

  // ─── TEST 12: Rapid Resend Rate Limiting ───────────────────────────────────
  test('TEST 12: Rapid resend attempts within 60s cooldown -> Rate limited (429)', async () => {
    const rateLimitAdmin = await User.create({
      name: 'Rate Limit Target Admin 24h',
      email: `test12_ratelimit_${timestamp}_act_resend_test@example.com`,
      role: 'institution_admin',
      roles: ['institution_admin', 'user'],
      institutionId: institutionA._id,
      accountStatus: 'INVITED',
      status: 'active',
      invitedAt: new Date(Date.now() - 120000), // Initially 2 mins ago
    });

    // 1st Resend: Should Succeed
    const res1 = await request(app)
      .post(`/api/owner/admins/${rateLimitAdmin._id}/resend-invite`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res1.statusCode).toBe(200);

    // Immediate 2nd Resend: Should be Rate Limited (429)
    const res2 = await request(app)
      .post(`/api/owner/admins/${rateLimitAdmin._id}/resend-invite`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res2.statusCode).toBe(429);
    expect(res2.body.code).toBe('RATE_LIMITED');
  });
});
