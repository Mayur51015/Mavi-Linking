const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');

const User = require('../src/models/User');
const Institution = require('../src/models/Institution');
const Department = require('../src/models/Department');
const AuditLog = require('../src/models/AuditLog');
const ownerRoutes = require('../src/routes/ownerRoutes');
const adminRoutes = require('../src/routes/adminRoutes');
const authRoutes = require('../src/routes/authRoutes');

let app;
let ownerToken;
let ownerUser;
let targetSuperAdminUser;
let targetSuperAdminToken;
let secondSuperAdminUser;
let institutionA;
let departmentA;
let institutionB;
let departmentB;
let existingStudentUser;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_convert_2026';
  if (mongoose.connection.readyState === 0) {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mavi_linking_test';
    await mongoose.connect(mongoUri);
  }

  app = express();
  app.use(express.json());
  app.use('/api/owner', ownerRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/auth', authRoutes);

  // Setup Institutions & Departments
  const suffix = Date.now() + '_' + Math.floor(Math.random() * 1000);
  institutionA = await Institution.create({
    name: 'MAVI Demo Tech College ' + suffix,
    tenantId: 'MAVI-TEN-A-' + suffix,
    institutionCode: 'MAVI-CODE-A-' + suffix,
    code: 'MDTC',
    officialDomain: `mdtca_${suffix}.edu`,
    status: 'active',
  });

  departmentA = await Department.create({
    institutionId: institutionA._id,
    name: 'Computer Engineering',
    code: 'CSE',
    status: 'active',
  });

  institutionB = await Institution.create({
    name: 'MAVI City University ' + suffix,
    tenantId: 'MAVI-TEN-B-' + suffix,
    institutionCode: 'MAVI-CODE-B-' + suffix,
    code: 'MCU',
    officialDomain: `mcub_${suffix}.edu`,
    status: 'active',
  });

  departmentB = await Department.create({
    institutionId: institutionB._id,
    name: 'Mechanical Engineering',
    code: 'MECH',
    status: 'active',
  });

  // Create Platform Owner / Primary Super Admin (Actor)
  ownerUser = await User.create({
    name: 'Platform Owner',
    email: `owner_${suffix}@mavilinking.com`,
    role: 'platform_owner',
    roles: ['platform_owner', 'super_admin', 'user'],
    adminId: 'MAVI-OWNER-001',
    maviId: 'MAVI-OWNER-' + suffix,
    status: 'active',
    accountStatus: 'ACTIVE',
    emailVerified: true,
  });
  ownerToken = ownerUser.generateAuthToken();

  // Create Target Super Admin to be converted (e.g., mavi118@gmail.com)
  targetSuperAdminUser = await User.create({
    name: 'Mavi Admin',
    email: `mavi_convert_${suffix}@gmail.com`,
    role: 'super_admin',
    roles: ['super_admin', 'user'],
    maviId: 'MAVI-B60E' + Math.floor(1000 + Math.random() * 9000),
    adminId: 'MAVI-ADM-99',
    adminScope: 'PLATFORM',
    permissions: ['PLATFORM_ADMIN_MANAGE', 'USER_ADMIN_MANAGE'],
    status: 'active',
    accountStatus: 'ACTIVE',
    emailVerified: true,
  });
  targetSuperAdminToken = targetSuperAdminUser.generateAuthToken();

  // Create Second Super Admin (to satisfy super admin count > 1 rule)
  secondSuperAdminUser = await User.create({
    name: 'Backup Super Admin',
    email: `backup.admin_${suffix}@mavilinking.com`,
    role: 'super_admin',
    roles: ['super_admin', 'user'],
    maviId: 'MAVI-BACKUP-' + Math.floor(1000 + Math.random() * 9000),
    adminId: 'MAVI-ADM-100',
    adminScope: 'PLATFORM',
    status: 'active',
    accountStatus: 'ACTIVE',
    emailVerified: true,
  });

  // Create Existing Student with PRN PRN-EXISTING-100
  existingStudentUser = await User.create({
    name: 'Existing Student',
    email: `existing.student_${suffix}@demo.com`,
    role: 'user',
    roles: ['user', 'student'],
    maviId: 'MAVI-STU-' + Math.floor(1000 + Math.random() * 9000),
    institutionId: institutionA._id,
    departmentId: departmentA._id,
    prn: `PRN-EXISTING-${suffix}`,
    institutionalIdentifier: { identifierType: 'PRN', identifierValue: `PRN-EXISTING-${suffix}` },
    status: 'active',
    accountStatus: 'ACTIVE',
    emailVerified: true,
  });
});

beforeEach(async () => {
  // Reset targetSuperAdminUser role before each test
  await User.updateOne(
    { _id: targetSuperAdminUser._id },
    {
      $set: {
        role: 'super_admin',
        roles: ['super_admin', 'user'],
        adminScope: 'PLATFORM',
        permissions: ['PLATFORM_ADMIN_MANAGE', 'USER_ADMIN_MANAGE'],
      },
    }
  );
  await User.updateOne(
    { _id: secondSuperAdminUser._id },
    {
      $set: {
        role: 'super_admin',
        roles: ['super_admin', 'user'],
      },
    }
  );
  await User.updateOne(
    { _id: ownerUser._id },
    {
      $set: {
        role: 'platform_owner',
        roles: ['platform_owner', 'super_admin', 'user'],
      },
    }
  );
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

describe('MAVI LINKING — Convert Super Admin to Student Integration Tests', () => {

  test('TEST 8 & 9: Unauthorized roles (Department Admin / Institution Admin) cannot convert Super Admin to Student', async () => {
    const instAdminUser = await User.create({
      name: 'Inst Admin',
      email: `inst.admin_${Date.now()}@demo.com`,
      role: 'institution_admin',
      roles: ['institution_admin', 'user'],
      institutionId: institutionA._id,
      adminScope: 'INSTITUTION',
      status: 'active',
      accountStatus: 'ACTIVE',
      emailVerified: true,
    });
    const instAdminToken = instAdminUser.generateAuthToken();

    const res = await request(app)
      .post(`/api/owner/admins/${targetSuperAdminUser._id}/convert-to-student`)
      .set('Authorization', `Bearer ${instAdminToken}`)
      .send({
        institutionId: institutionA._id,
        departmentId: departmentA._id,
        prn: 'PRN-TEST-101',
      });

    expect(res.status).toBe(403);
  });

  test('TEST 10: Conversion blocked if only 1 Super Admin remains on platform (LAST_SUPER_ADMIN_PROTECTION)', async () => {
    // Temporarily demote all other super admins except targetSuperAdminUser
    await User.updateMany(
      { _id: { $ne: targetSuperAdminUser._id }, role: { $in: ['super_admin', 'platform_owner', 'owner'] } },
      { $set: { role: 'user', roles: ['user'] } }
    );

    const res = await request(app)
      .post(`/api/owner/admins/${targetSuperAdminUser._id}/convert-to-student`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        institutionId: institutionA._id,
        departmentId: departmentA._id,
        prn: 'PRN-TEST-999',
      });

    // Restore owner and second super admin
    await User.updateOne({ _id: ownerUser._id }, { role: 'platform_owner', roles: ['platform_owner', 'super_admin', 'user'] });
    await User.updateOne({ _id: secondSuperAdminUser._id }, { role: 'super_admin', roles: ['super_admin', 'user'] });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('LAST_SUPER_ADMIN_PROTECTION');
  });

  test('TEST 13: Rejects conversion with invalid department', async () => {
    const fakeDeptId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post(`/api/owner/admins/${targetSuperAdminUser._id}/convert-to-student`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        institutionId: institutionA._id,
        departmentId: fakeDeptId,
        prn: 'PRN-TEST-102',
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_DEPARTMENT');
  });

  test('TEST 14: Rejects conversion when department does NOT belong to selected institution', async () => {
    // departmentB belongs to institutionB, but institutionA is passed
    const res = await request(app)
      .post(`/api/owner/admins/${targetSuperAdminUser._id}/convert-to-student`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        institutionId: institutionA._id,
        departmentId: departmentB._id, // Mismatch!
        prn: 'PRN-TEST-103',
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('DEPARTMENT_INSTITUTION_MISMATCH');
  });

  test('TEST 12: Rejects conversion with duplicate PRN', async () => {
    const res = await request(app)
      .post(`/api/owner/admins/${targetSuperAdminUser._id}/convert-to-student`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        institutionId: institutionA._id,
        departmentId: departmentA._id,
        prn: existingStudentUser.prn, // Already assigned to existingStudentUser
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('DUPLICATE_PRN');
  });

  test('TEST 1 & 2: Authorized Owner converts Super Admin to Student -> SUCCESS & Retains MAVI ID', async () => {
    const originalMaviId = targetSuperAdminUser.maviId;

    const res = await request(app)
      .post(`/api/owner/admins/${targetSuperAdminUser._id}/convert-to-student`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        institutionId: institutionA._id,
        departmentId: departmentA._id,
        prn: 'PRN-STU-CONVERTED-001-' + Date.now(),
        reason: 'Converted platform test account to student role',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('user');
    expect(res.body.data.roles).toContain('student');

    // Verify in database
    const updatedUser = await User.findById(targetSuperAdminUser._id);
    expect(updatedUser.maviId).toBe(originalMaviId); // TEST 2: MAVI ID UNCHANGED!
    expect(updatedUser.role).toBe('user');
    expect(updatedUser.roles).toEqual(['user', 'student']);
    expect(updatedUser.permissions).toEqual([]);
    expect(updatedUser.adminScope).toBe('');
    expect(updatedUser.institutionId.toString()).toBe(institutionA._id.toString());
    expect(updatedUser.departmentId.toString()).toBe(departmentA._id.toString());
    expect(updatedUser.accountStatus).toBe('ACTIVE');

    // Audit Log verification (TEST 15)
    const log = await AuditLog.findOne({ targetUserId: targetSuperAdminUser._id, action: 'USER_ROLE_CHANGED' });
    expect(log).not.toBeNull();
    expect(log.previousRole).toBe('super_admin');
    expect(log.newRole).toBe('student');
  });

  test('TEST 3 & 4: Converted account is denied Super Admin dashboard and Super Admin APIs (403 Forbidden)', async () => {
    // Perform conversion first
    await request(app)
      .post(`/api/owner/admins/${targetSuperAdminUser._id}/convert-to-student`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        institutionId: institutionA._id,
        departmentId: departmentA._id,
        prn: 'PRN-STU-ISOLATED-' + Date.now(),
      });

    const convertedUser = await User.findById(targetSuperAdminUser._id);
    const newStudentToken = convertedUser.generateAuthToken();

    // Attempt Super Admin / Owner route
    const ownerApiRes = await request(app)
      .get('/api/owner/overview')
      .set('Authorization', `Bearer ${newStudentToken}`);

    expect(ownerApiRes.status).toBe(403);
  });

  test('TEST 11: Old Super Admin session token is denied access after conversion', async () => {
    // Perform conversion first
    await request(app)
      .post(`/api/owner/admins/${targetSuperAdminUser._id}/convert-to-student`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        institutionId: institutionA._id,
        departmentId: departmentA._id,
        prn: 'PRN-STU-SESSION-' + Date.now(),
      });

    // Attempt Super Admin route using targetSuperAdminToken (created BEFORE conversion)
    const oldSessionRes = await request(app)
      .get('/api/owner/overview')
      .set('Authorization', `Bearer ${targetSuperAdminToken}`);

    expect([401, 403]).toContain(oldSessionRes.status);
  });

  test('TEST 6 & 7: Converted account disappears from Admin list & appears in Student list', async () => {
    // Perform conversion first
    await request(app)
      .post(`/api/owner/admins/${targetSuperAdminUser._id}/convert-to-student`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        institutionId: institutionA._id,
        departmentId: departmentA._id,
        prn: 'PRN-STU-LIST-' + Date.now(),
      });

    const adminListRes = await request(app)
      .get('/api/owner/admins')
      .set('Authorization', `Bearer ${ownerToken}`);

    const adminIds = adminListRes.body.data.admins.map((a) => a._id.toString());
    expect(adminIds).not.toContain(targetSuperAdminUser._id.toString());

    const userListRes = await request(app)
      .get('/api/owner/users?role=student')
      .set('Authorization', `Bearer ${ownerToken}`);

    const userIds = userListRes.body.data.users.map((u) => u._id.toString());
    expect(userIds).toContain(targetSuperAdminUser._id.toString());
  });
});
