process.env.JWT_SECRET = process.env.JWT_SECRET || 'default_mavi_secret_key_2026';

const request = require('supertest');
const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../src/models/User');
const Institution = require('../src/models/Institution');
const Department = require('../src/models/Department');
const AuditLog = require('../src/models/AuditLog');

describe('Institution Code Based Student Onboarding Security Test Suite', () => {
  jest.setTimeout(30000);
  let app;
  const timestamp = Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  // Test Institutions
  let instA = null;
  let instB = null;
  let inactiveInst = null;

  // Test Departments
  let deptCSE_A = null;
  let deptECE_A = null;
  let deptCSE_B = null;

  // Test Admins
  let deptAdminA = null;
  let deptAdminAJwt = null;
  let deptAdminB = null;
  let deptAdminBJwt = null;
  let instAdminA = null;
  let instAdminAJwt = null;

  // Test Student
  const studentEmail = `student_code_${timestamp}@example.com`;
  const studentPrn = `PRN_CODE_${timestamp}`;
  let studentId = null;
  let rawVerifyToken = '';
  let studentJwt = null;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'default_mavi_secret_key_2026';
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mavi_linking_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    const express = require('express');
    app = express();
    app.use(express.json());
    app.use('/api', require('../src/routes/publicRoutes'));
    app.use('/api/auth', require('../src/routes/authRoutes'));
    app.use('/api/admin', require('../src/routes/adminRoutes'));

    // 1. Create Active Institution A
    instA = await Institution.create({
      name: 'Zeal College of Engineering and Research',
      institutionCode: `ZCER-PUNE-${timestamp}`,
      tenantId: `INST-ZCER-${timestamp}`,
      shortName: 'ZCER',
      city: 'Pune',
      status: 'active',
    });

    // 2. Create Active Institution B
    instB = await Institution.create({
      name: 'COEP Technological University',
      institutionCode: `COEP-PUNE-${timestamp}`,
      tenantId: `INST-COEP-${timestamp}`,
      shortName: 'COEP',
      city: 'Pune',
      status: 'active',
    });

    // 3. Create Inactive/Suspended Institution
    inactiveInst = await Institution.create({
      name: 'Suspended College of Tech',
      institutionCode: `SUSP-PUNE-${timestamp}`,
      tenantId: `INST-SUSP-${timestamp}`,
      shortName: 'SUSP',
      status: 'suspended',
    });

    // 4. Create Departments for Institution A
    deptCSE_A = await Department.create({
      institutionId: instA._id,
      name: 'Computer Engineering',
      code: 'CSE',
      status: 'active',
    });

    deptECE_A = await Department.create({
      institutionId: instA._id,
      name: 'Electronics & Telecommunication',
      code: 'ECE',
      status: 'active',
    });

    // 5. Create Department for Institution B
    deptCSE_B = await Department.create({
      institutionId: instB._id,
      name: 'Computer Engineering B',
      code: 'CSE-B',
      status: 'active',
    });

    // 6. Create Department Admin for CSE (Inst A)
    deptAdminA = await User.create({
      name: 'CSE Dept Admin',
      email: `cse_admin_${timestamp}@example.com`,
      password: 'Password123!',
      role: 'department_admin',
      roles: ['department_admin'],
      institutionId: instA._id,
      departmentId: deptCSE_A._id,
      university: { name: instA.name, department: deptCSE_A.name },
      emailVerified: true,
      accountStatus: 'ACTIVE',
    });
    deptAdminAJwt = deptAdminA.generateAuthToken();

    // 7. Create Department Admin for ECE (Inst A)
    deptAdminB = await User.create({
      name: 'ECE Dept Admin',
      email: `ece_admin_${timestamp}@example.com`,
      password: 'Password123!',
      role: 'department_admin',
      roles: ['department_admin'],
      institutionId: instA._id,
      departmentId: deptECE_A._id,
      university: { name: instA.name, department: deptECE_A.name },
      emailVerified: true,
      accountStatus: 'ACTIVE',
    });
    deptAdminBJwt = deptAdminB.generateAuthToken();

    // 8. Create Institution Admin for Inst A
    instAdminA = await User.create({
      name: 'Inst A Admin',
      email: `inst_a_admin_${timestamp}@example.com`,
      password: 'Password123!',
      role: 'institution_admin',
      roles: ['institution_admin', 'admin'],
      institutionId: instA._id,
      emailVerified: true,
      accountStatus: 'ACTIVE',
    });
    instAdminAJwt = instAdminA.generateAuthToken();
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@example\.com$/ });
    const deptIds = [deptCSE_A?._id, deptECE_A?._id, deptCSE_B?._id].filter(Boolean);
    const instIds = [instA?._id, instB?._id, inactiveInst?._id].filter(Boolean);
    if (deptIds.length > 0) await Department.deleteMany({ _id: { $in: deptIds } });
    if (instIds.length > 0) await Institution.deleteMany({ _id: { $in: instIds } });
    await mongoose.connection.close();
  });

  test('TEST 1: Valid Institution Code lookup identifies institution and returns safe public metadata', async () => {
    const res = await request(app)
      .get(`/api/public/institutions/by-code/${instA.institutionCode}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.institution.name).toBe(instA.name);
    expect(res.body.institution.code).toBe(instA.institutionCode);
  });

  test('TEST 2: Invalid Institution Code returns 404 INSTITUTION_CODE_INVALID', async () => {
    const res = await request(app)
      .get('/api/public/institutions/by-code/INVALID-CODE-9999');

    expect(res.statusCode).toBe(404);
    expect(res.body.code).toBe('INSTITUTION_CODE_INVALID');
  });

  test('TEST 3: Inactive/Suspended Institution Code returns 400 INSTITUTION_INACTIVE', async () => {
    const res = await request(app)
      .get(`/api/public/institutions/by-code/${inactiveInst.institutionCode}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe('INSTITUTION_INACTIVE');
  });

  test('TEST 4: Public Department fetching returns active departments belonging strictly to institution', async () => {
    const res = await request(app)
      .get(`/api/public/institutions/${instA._id}/departments`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.departments.length).toBe(2);

    const deptNames = res.body.departments.map((d) => d.name);
    expect(deptNames).toContain('Computer Engineering');
    expect(deptNames).toContain('Electronics & Telecommunication');
    expect(deptNames).not.toContain('Computer Engineering B');
  });

  test('TEST 5: PRN validation accepts valid PRN for institution and department', async () => {
    const res = await request(app)
      .post('/api/auth/validate-prn')
      .send({
        institutionId: instA._id.toString(),
        departmentId: deptCSE_A._id.toString(),
        prn: studentPrn,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('TEST 6: PRN validation fails if department belongs to another institution (DEPARTMENT_INSTITUTION_MISMATCH)', async () => {
    const res = await request(app)
      .post('/api/auth/validate-prn')
      .send({
        institutionId: instA._id.toString(),
        departmentId: deptCSE_B._id.toString(), // Dept from Inst B
        prn: studentPrn,
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe('DEPARTMENT_INSTITUTION_MISMATCH');
  });

  test('TEST 7: Registration with valid Institution Code creates student account with role=user & status=PENDING_EMAIL_VERIFICATION', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'InstCode Student',
        email: studentEmail,
        password: 'Password123!',
        institutionCode: instA.institutionCode,
        departmentId: deptCSE_A._id.toString(),
        prn: studentPrn,
        role: 'user',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.code).toBe('EMAIL_VERIFICATION_REQUIRED');
    expect(res.body.data.accountStatus).toBe('PENDING_EMAIL_VERIFICATION');

    const studentObj = await User.findOne({ email: studentEmail });
    expect(studentObj).not.toBeNull();
    expect(studentObj.role).toBe('user'); // Role forced to 'user'
    expect(studentObj.institutionId.toString()).toBe(instA._id.toString());
    expect(studentObj.departmentId.toString()).toBe(deptCSE_A._id.toString());
    expect(studentObj.prn).toBe(studentPrn);
    expect(studentObj.maviId).toMatch(/^MAVI-/);

    studentId = studentObj._id;
  });

  test('TEST 8: Duplicate PRN registration attempt is rejected (PRN_ALREADY_REGISTERED)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Duplicate PRN Student',
        email: `dup_prn_${timestamp}@example.com`,
        password: 'Password123!',
        institutionCode: instA.institutionCode,
        departmentId: deptCSE_A._id.toString(),
        prn: studentPrn, // Same PRN
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.code).toBe('PRN_ALREADY_REGISTERED');
  });

  test('TEST 9: Email verification transitions student to PENDING_ADMIN_APPROVAL (Not ACTIVE)', async () => {
    rawVerifyToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawVerifyToken).digest('hex');

    await User.updateOne(
      { _id: studentId },
      {
        $set: {
          verificationToken: hashedToken,
          verificationTokenExpires: new Date(Date.now() + 30 * 60 * 1000),
        },
      }
    );

    const res = await request(app)
      .post('/api/auth/verify-email')
      .send({ token: rawVerifyToken });

    expect(res.statusCode).toBe(200);
    expect(res.body.code).toBe('ACCOUNT_PENDING_ADMIN_APPROVAL');
    expect(res.body.data.emailVerified).toBe(true);

    const updatedStudent = await User.findById(studentId);
    expect(updatedStudent.accountStatus).toBe('PENDING_ADMIN_APPROVAL');
  });

  test('TEST 10: Student login before admin approval returns 403 ACCOUNT_PENDING_ADMIN_APPROVAL', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: studentEmail,
        password: 'Password123!',
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe('ACCOUNT_PENDING_ADMIN_APPROVAL');
  });

  test('TEST 11: ECE Department Admin B attempts to approve CSE student (403 CROSS_TENANT_ACCESS_DENIED)', async () => {
    const res = await request(app)
      .post(`/api/admin/students/${studentId}/approve`)
      .set('Authorization', `Bearer ${deptAdminBJwt}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe('CROSS_TENANT_ACCESS_DENIED');
  });

  test('TEST 12: CSE Department Admin A approves CSE student (STAGE 2 ACTIVATION SUCCESS)', async () => {
    const res = await request(app)
      .post(`/api/admin/students/${studentId}/approve`)
      .set('Authorization', `Bearer ${deptAdminAJwt}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.student.accountStatus).toBe('ACTIVE');

    const activeStudent = await User.findById(studentId);
    expect(activeStudent.accountStatus).toBe('ACTIVE');
    expect(activeStudent.approvedBy.toString()).toBe(deptAdminA._id.toString());
  });

  test('TEST 13: Active student can now log in & access dashboard successfully', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: studentEmail,
        password: 'Password123!',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });
});
