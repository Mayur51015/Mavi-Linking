const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const User = require('../src/models/User');
require('../src/models/Company');
require('../src/models/Job');
const RecruitmentPipeline = require('../src/models/RecruitmentPipeline');
const authRoutes = require('../src/routes/authRoutes');
const placementRoutes = require('../src/routes/placementRoutes');

describe('Student placement pipelines authorization', () => {
  let app;
  let student;
  let otherStudent;
  let emptyStudent;
  let recruiter;
  let teacher;
  let pendingStudent;
  let legacyStudent;
  let ownPipeline;

  const tokenFor = (user) => jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'ci-test-secret-key-mavi-linking-2026',
    { expiresIn: '1h' }
  );

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use('/api/placement', placementRoutes);

    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    [student, otherStudent, emptyStudent, recruiter, teacher, pendingStudent, legacyStudent] = await User.create([
      { name: 'Pipeline Student', email: `pipeline_student_${suffix}@example.com`, password: 'Password123!', role: 'user', emailVerified: true, accountStatus: 'ACTIVE' },
      { name: 'Other Pipeline Student', email: `pipeline_other_${suffix}@example.com`, password: 'Password123!', role: 'user', emailVerified: true, accountStatus: 'ACTIVE' },
      { name: 'Empty Pipeline Student', email: `pipeline_empty_${suffix}@example.com`, password: 'Password123!', role: 'user', emailVerified: true, accountStatus: 'ACTIVE' },
      { name: 'Pipeline Recruiter', email: `pipeline_recruiter_${suffix}@example.com`, password: 'Password123!', role: 'recruiter', emailVerified: true, accountStatus: 'ACTIVE' },
      { name: 'Pipeline Teacher', email: `pipeline_teacher_${suffix}@example.com`, password: 'Password123!', role: 'teacher', emailVerified: true, accountStatus: 'ACTIVE' },
      { name: 'Pending Pipeline Student', email: `pipeline_pending_${suffix}@example.com`, password: 'Password123!', role: 'user', emailVerified: true, accountStatus: 'PENDING_ADMIN_APPROVAL' },
      { name: 'Legacy Pipeline Student', email: `pipeline_legacy_${suffix}@example.com`, password: 'Password123!', role: 'user', emailVerified: true, accountStatus: 'ACTIVE' },
    ]);

    await User.collection.updateOne(
      { _id: legacyStudent._id },
      { $set: { role: 'student', roles: ['student'] } }
    );

    ownPipeline = await RecruitmentPipeline.create({
      studentId: student._id,
      recruiterId: recruiter._id,
      companyName: 'Example Company',
      role: 'Software Engineer',
    });
    await RecruitmentPipeline.create({
      studentId: otherStudent._id,
      recruiterId: recruiter._id,
      companyName: 'Other Company',
      role: 'Analyst',
    });
  });

  afterAll(async () => {
    if (student && otherStudent && emptyStudent && recruiter && teacher && pendingStudent && legacyStudent) {
      const userIds = [student._id, otherStudent._id, emptyStudent._id, recruiter._id, teacher._id, pendingStudent._id, legacyStudent._id];
      await RecruitmentPipeline.deleteMany({ studentId: { $in: userIds } });
      await User.deleteMany({ _id: { $in: userIds } });
    }
    if (mongoose.connection.readyState !== 0) await mongoose.connection.close();
  });

  test('approved student receives only their own pipelines and an empty result when they have none', async () => {
    const ownRes = await request(app)
      .get('/api/placement/student/pipelines')
      .set('Authorization', `Bearer ${tokenFor(student)}`)
      .query({ studentId: otherStudent._id.toString() });

    expect(ownRes.status).toBe(200);
    expect(ownRes.body.data).toHaveLength(1);
    expect(ownRes.body.data[0]._id).toBe(ownPipeline._id.toString());
    expect(ownRes.body.data.some((pipeline) => pipeline.studentId === otherStudent._id.toString())).toBe(false);

    const emptyRes = await request(app)
      .get('/api/placement/student/pipelines')
      .set('Authorization', `Bearer ${tokenFor(emptyStudent)}`);
    expect(emptyRes.status).toBe(200);
    expect(emptyRes.body.data).toEqual([]);
  });

  test('unauthenticated, invalid-token, recruiter, and teacher requests remain denied', async () => {
    expect((await request(app).get('/api/placement/student/pipelines')).status).toBe(401);

    const invalidTokenRes = await request(app)
      .get('/api/placement/student/pipelines')
      .set('Authorization', 'Bearer invalid-token');
    expect(invalidTokenRes.status).toBe(401);

    const expiredToken = jwt.sign(
      { id: student._id, role: student.role },
      process.env.JWT_SECRET || 'ci-test-secret-key-mavi-linking-2026',
      { expiresIn: -1 }
    );
    const expiredTokenRes = await request(app)
      .get('/api/placement/student/pipelines')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(expiredTokenRes.status).toBe(401);

    const recruiterRes = await request(app)
      .get('/api/placement/student/pipelines')
      .set('Authorization', `Bearer ${tokenFor(recruiter)}`);
    expect(recruiterRes.status).toBe(403);

    const teacherRes = await request(app)
      .get('/api/placement/student/pipelines')
      .set('Authorization', `Bearer ${tokenFor(teacher)}`);
    expect(teacherRes.status).toBe(403);
  });

  test('pending student receives the intentional approval restriction', async () => {
    const response = await request(app)
      .get('/api/placement/student/pipelines')
      .set('Authorization', `Bearer ${tokenFor(pendingStudent)}`);

    expect(response.status).toBe(403);
    expect(response.body.code).toBe('ACCOUNT_PENDING_VERIFICATION');
  });

  test('legacy student primary role is normalized to the canonical user role before RBAC', async () => {
    const token = tokenFor(legacyStudent);
    const meResponse = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.data.user.role).toBe('user');
    expect(meResponse.body.data.user.roles).toEqual(['student', 'user']);
    expect(meResponse.body.data.user.accountStatus).toBe('ACTIVE');
    expect(meResponse.body.data.user.emailVerified).toBe(true);

    const response = await request(app)
      .get('/api/placement/student/pipelines')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);

    const migratedStudent = await User.findById(legacyStudent._id);
    expect(migratedStudent.role).toBe('user');
    expect(migratedStudent.roles).toEqual(['student', 'user']);
  });
});