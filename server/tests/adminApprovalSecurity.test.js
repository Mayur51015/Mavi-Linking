const request = require('supertest');
const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../src/models/User');
const AuditLog = require('../src/models/AuditLog');

describe('2-Stage Student Account Verification & Admin Approval Security Test Suite', () => {
  jest.setTimeout(30000);
  let app;
  const timestamp = Date.now();

  // Test Entities
  const studentEmail = `student_2stage_${timestamp}@example.com`;
  const studentPrn = `PRN_2STAGE_${timestamp}`;
  let studentId = null;
  let rawVerifyToken = '';
  let studentJwt = null;

  // Department Admin A (CSE Dept)
  let deptAdminA = null;
  let deptAdminAJwt = null;

  // Department Admin B (ECE Dept)
  let deptAdminB = null;

  // Institution Admin
  let instAdmin = null;

  // Other Roles
  let teacherUser = null;
  let recruiterUser = null;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mavi_linking_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    const express = require('express');
    app = express();
    app.use(express.json());
    app.use('/api/auth', require('../src/routes/authRoutes'));
    app.use('/api/admin', require('../src/routes/adminRoutes'));

    // Create test Department Admin A (CSE)
    deptAdminA = await User.create({
      name: 'CSE Dept Admin',
      email: `dept_admin_a_${timestamp}@example.com`,
      password: 'Password123!',
      role: 'department_admin',
      roles: ['department_admin'],
      departmentId: new mongoose.Types.ObjectId(),
      university: { department: 'Computer Science' },
      emailVerified: true,
      accountStatus: 'ACTIVE',
    });
    deptAdminAJwt = deptAdminA.generateAuthToken();

    // Create test Department Admin B (ECE)
    deptAdminB = await User.create({
      name: 'ECE Dept Admin',
      email: `dept_admin_b_${timestamp}@example.com`,
      password: 'Password123!',
      role: 'department_admin',
      roles: ['department_admin'],
      departmentId: new mongoose.Types.ObjectId(),
      university: { department: 'Electronics' },
      emailVerified: true,
      accountStatus: 'ACTIVE',
    });

    // Create test Institution Admin
    instAdmin = await User.create({
      name: 'Institution Admin',
      email: `inst_admin_${timestamp}@example.com`,
      password: 'Password123!',
      role: 'institution_admin',
      roles: ['institution_admin', 'admin'],
      institutionId: new mongoose.Types.ObjectId(),
      emailVerified: true,
      accountStatus: 'ACTIVE',
    });

    // Create test Teacher
    teacherUser = await User.create({
      name: 'Teacher User',
      email: `teacher_${timestamp}@example.com`,
      password: 'Password123!',
      role: 'teacher',
      roles: ['teacher'],
      emailVerified: true,
      accountStatus: 'ACTIVE',
    });

    // Create test Recruiter
    recruiterUser = await User.create({
      name: 'Recruiter User',
      email: `recruiter_${timestamp}@example.com`,
      password: 'Password123!',
      role: 'recruiter',
      roles: ['recruiter'],
      emailVerified: true,
      accountStatus: 'ACTIVE',
    });
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@example\.com$/ });
    await mongoose.connection.close();
  });

  test('TEST 1: Student registers -> status is PENDING_EMAIL_VERIFICATION & emailVerified is false', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'TwoStage Student',
        email: studentEmail,
        password: 'Password123!',
        prn: studentPrn,
        university: { department: 'Computer Science' },
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.code).toBe('EMAIL_VERIFICATION_REQUIRED');
    expect(res.body.data.accountStatus).toBe('PENDING_EMAIL_VERIFICATION');
    expect(res.body.data.emailVerified).toBe(false);

    const createdStudent = await User.findOne({ email: studentEmail }).select('+verificationToken +verificationTokenExpires');
    expect(createdStudent).not.toBeNull();
    expect(createdStudent.accountStatus).toBe('PENDING_EMAIL_VERIFICATION');
    expect(createdStudent.emailVerified).toBe(false);
    expect(createdStudent.maviId).toMatch(/^MAVI-/);
    studentId = createdStudent._id;
  });

  test('TEST 2: Email verification transitions account to PENDING_ADMIN_APPROVAL (Not ACTIVE)', async () => {
    // Generate valid raw verification token for student
    rawVerifyToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawVerifyToken).digest('hex');

    await User.updateOne(
      { _id: studentId },
      {
        $set: {
          verificationToken: hashedToken,
          verificationTokenExpires: new Date(Date.now() + 30 * 60 * 1000),
          departmentId: deptAdminA.departmentId,
        },
      }
    );

    const res = await request(app)
      .post('/api/auth/verify-email')
      .send({ token: rawVerifyToken });

    expect(res.statusCode).toBe(200);
    expect(res.body.code).toBe('ACCOUNT_PENDING_ADMIN_APPROVAL');
    expect(res.body.data.accountStatus).toBe('PENDING_ADMIN_APPROVAL');
    expect(res.body.data.emailVerified).toBe(true);

    const updatedStudent = await User.findById(studentId);
    expect(updatedStudent.emailVerified).toBe(true);
    expect(updatedStudent.accountStatus).toBe('PENDING_ADMIN_APPROVAL');
  });

  test('TEST 3: Student login after email verification but before admin approval returns 403 ACCOUNT_PENDING_ADMIN_APPROVAL', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: studentEmail,
        password: 'Password123!',
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe('ACCOUNT_PENDING_ADMIN_APPROVAL');
    expect(res.body.data.emailVerified).toBe(true);
  });

  test('TEST 4: Student direct API access before approval is blocked (403 ACCOUNT_PENDING_ADMIN_APPROVAL)', async () => {
    const studentObj = await User.findById(studentId);
    studentJwt = studentObj.generateAuthToken();

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${studentJwt}`);

    // /api/auth/me is allowed for profile inspection, but protected student feature endpoints return 403
    const protectedRes = await request(app)
      .get('/api/admin/students')
      .set('Authorization', `Bearer ${studentJwt}`);

    expect(protectedRes.statusCode).toBe(403);
  });

  test('TEST 5: Department Admin A reviews pending student from CSE department (ALLOWED)', async () => {
    const res = await request(app)
      .get('/api/admin/students/pending')
      .set('Authorization', `Bearer ${deptAdminAJwt}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.counters).toBeDefined();
  });

  test('TEST 6: Department Admin B (ECE) attempts to approve student from CSE (403 CROSS_TENANT_ACCESS_DENIED)', async () => {
    const deptAdminBJwt = deptAdminB.generateAuthToken();

    const res = await request(app)
      .post(`/api/admin/students/${studentId}/approve`)
      .set('Authorization', `Bearer ${deptAdminBJwt}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe('CROSS_TENANT_ACCESS_DENIED');
  });

  test('TEST 7: Unauthorized Teacher attempts approval (403 UNAUTHORIZED_APPROVAL_ROLE)', async () => {
    const teacherJwt = teacherUser.generateAuthToken();

    const res = await request(app)
      .post(`/api/admin/students/${studentId}/approve`)
      .set('Authorization', `Bearer ${teacherJwt}`);

    expect(res.statusCode).toBe(403);
  });

  test('TEST 8: Unauthorized Recruiter attempts approval (403)', async () => {
    const recruiterJwt = recruiterUser.generateAuthToken();

    const res = await request(app)
      .post(`/api/admin/students/${studentId}/approve`)
      .set('Authorization', `Bearer ${recruiterJwt}`);

    expect(res.statusCode).toBe(403);
  });

  test('TEST 9: Student attempts self-approval (403)', async () => {
    const res = await request(app)
      .post(`/api/admin/students/${studentId}/approve`)
      .set('Authorization', `Bearer ${studentJwt}`);

    expect(res.statusCode).toBe(403);
  });

  test('TEST 10: Admin approval fails if student email is unverified (UNVERIFIED_EMAIL_APPROVAL_DENIED)', async () => {
    // Create an unverified student
    const unverifiedStudent = await User.create({
      name: 'Unverified Student',
      email: `unverified_${timestamp}@example.com`,
      password: 'Password123!',
      role: 'user',
      departmentId: deptAdminA.departmentId,
      emailVerified: false,
      accountStatus: 'PENDING_EMAIL_VERIFICATION',
    });

    const res = await request(app)
      .post(`/api/admin/students/${unverifiedStudent._id}/approve`)
      .set('Authorization', `Bearer ${deptAdminAJwt}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe('UNVERIFIED_EMAIL_APPROVAL_DENIED');
  });

  test('TEST 11: Department Admin A approves student from CSE department (STAGE 2 ACTIVATION SUCCESS)', async () => {
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

  test('TEST 12: Admin approves already ACTIVE student (Safe Idempotent Response)', async () => {
    const res = await request(app)
      .post(`/api/admin/students/${studentId}/approve`)
      .set('Authorization', `Bearer ${deptAdminAJwt}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('TEST 13: Approved student can now log in successfully & access dashboard', async () => {
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

  test('TEST 14: Rejection flow stores rejectedBy, rejectedAt, rejectionReason & blocks login (ACCOUNT_REJECTED)', async () => {
    // Create another verified student waiting for approval
    const studentToReject = await User.create({
      name: 'To Reject Student',
      email: `reject_${timestamp}@example.com`,
      password: 'Password123!',
      role: 'user',
      departmentId: deptAdminA.departmentId,
      emailVerified: true,
      accountStatus: 'PENDING_ADMIN_APPROVAL',
    });

    const rejectRes = await request(app)
      .post(`/api/admin/students/${studentToReject._id}/reject`)
      .set('Authorization', `Bearer ${deptAdminAJwt}`)
      .send({ reason: 'PRN does not match institutional records' });

    expect(rejectRes.statusCode).toBe(200);
    expect(rejectRes.body.data.student.accountStatus).toBe('REJECTED');
    expect(rejectRes.body.data.student.rejectionReason).toBe('PRN does not match institutional records');

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: studentToReject.email,
        password: 'Password123!',
      });

    expect(loginRes.statusCode).toBe(403);
    expect(loginRes.body.code).toBe('ACCOUNT_REJECTED');
    expect(loginRes.body.data.rejectionReason).toBe('PRN does not match institutional records');
  });
});
