const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const User = require('../src/models/User');
const Company = require('../src/models/Company');
const PlacementDrive = require('../src/models/PlacementDrive');
const teacherRoutes = require('../src/routes/teacherRoutes');
const recruiterRoutes = require('../src/routes/recruiterRoutes');

describe('Teacher Placement Drives, RBAC, and Authentication Test Suite', () => {
  let app;
  let teacherUser;
  let recruiterUser;
  let studentUser;
  let teacherToken;
  let recruiterToken;
  let studentToken;
  let testCompany;

  const generateToken = (user) => {
    return jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'ci-test-secret-key-mavi-linking-2026',
      { expiresIn: '1h' }
    );
  };

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/teacher', teacherRoutes);
    app.use('/api/recruiter', recruiterRoutes);

    const ts = Date.now();

    // 1. Create Teacher
    teacherUser = await User.create({
      name: 'Teacher Prof',
      email: `prof_${ts}@college.edu`,
      password: 'Password123!',
      role: 'teacher',
      emailVerified: true,
      accountStatus: 'ACTIVE',
      university: {
        college: 'Engineering College',
        department: 'Computer Science',
      },
    });
    teacherToken = generateToken(teacherUser);

    // 2. Create Recruiter & Company
    recruiterUser = await User.create({
      name: 'Recruiter Bob',
      email: `bob_${ts}@company.com`,
      password: 'Password123!',
      role: 'recruiter',
      emailVerified: true,
      accountStatus: 'ACTIVE',
      companyName: 'Tech Innovators Inc',
    });
    recruiterToken = generateToken(recruiterUser);

    testCompany = await Company.create({
      recruiterId: recruiterUser._id,
      name: 'Tech Innovators Inc',
      industry: 'Software',
      location: 'Bangalore, India',
      website: 'https://techinnovators.com',
    });

    // 3. Create Student
    studentUser = await User.create({
      name: 'Student Alice',
      email: `alice_${ts}@college.edu`,
      password: 'Password123!',
      role: 'user',
      emailVerified: true,
      accountStatus: 'ACTIVE',
      university: {
        college: 'Engineering College',
        department: 'Computer Science',
        batch: '2026',
      },
    });
    studentToken = generateToken(studentUser);
  });

  afterAll(async () => {
    await PlacementDrive.deleteMany({ createdBy: teacherUser._id });
    await Company.deleteMany({ recruiterId: recruiterUser._id });
    await User.deleteMany({
      _id: { $in: [teacherUser._id, recruiterUser._id, studentUser._id] },
    });
  });

  describe('1. RBAC on /api/recruiter/company (Phase 5 & 6)', () => {
    it('returns 401 when called unauthenticated', async () => {
      const res = await request(app).get('/api/recruiter/company');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 403 when called by a teacher (Teacher should not access recruiter private endpoints)', async () => {
      const res = await request(app)
        .get('/api/recruiter/company')
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('returns 200 when called by authorized recruiter', async () => {
      const res = await request(app)
        .get('/api/recruiter/company')
        .set('Authorization', `Bearer ${recruiterToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Tech Innovators Inc');
    });
  });

  describe('2. Shared Teacher Endpoint /api/teacher/companies', () => {
    it('returns 401 when called unauthenticated', async () => {
      const res = await request(app).get('/api/teacher/companies');
      expect(res.status).toBe(401);
    });

    it('returns 403 when called by a regular student', async () => {
      const res = await request(app)
        .get('/api/teacher/companies')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    it('returns 200 and lists partner companies for teachers', async () => {
      const res = await request(app)
        .get('/api/teacher/companies')
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      const found = res.body.data.find(c => c._id.toString() === testCompany._id.toString());
      expect(found).toBeDefined();
      expect(found.name).toBe('Tech Innovators Inc');
    });
  });

  describe('3. Validation on POST /api/teacher/drives (Phase 7, 8, 9, 10)', () => {
    it('fails with 400 and clear message when title is missing', async () => {
      const res = await request(app)
        .post('/api/teacher/drives')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: '',
          companyId: testCompany._id,
          date: '2026-10-15',
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/title is required/i);
    });

    it('fails with 400 and clear message when companyId is "mock" or invalid ObjectId', async () => {
      const res = await request(app)
        .post('/api/teacher/drives')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Campus Drive 2026',
          companyId: 'mock',
          date: '2026-10-15',
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/valid company/i);
    });

    it('fails with 400 and clear message when companyId does not exist in DB', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post('/api/teacher/drives')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Campus Drive 2026',
          companyId: nonExistentId,
          date: '2026-10-15',
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/does not exist/i);
    });

    it('fails with 400 when date is invalid', async () => {
      const res = await request(app)
        .post('/api/teacher/drives')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Campus Drive 2026',
          companyId: testCompany._id,
          date: 'invalid-date-format',
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/valid drive date/i);
    });

    it('succeeds with 201 when valid payload is provided and normalizes departments', async () => {
      const res = await request(app)
        .post('/api/teacher/drives')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Campus Drive 2026 - Tech Innovators',
          companyId: testCompany._id,
          description: 'Hiring software development engineers',
          eligibility: {
            minScore: 650,
            departments: ['Computer Science', 'Information Technology'],
          },
          date: '2026-11-20',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Campus Drive 2026 - Tech Innovators');
      expect(res.body.data.eligibility.minScore).toBe(650);
      expect(res.body.data.eligibility.departments).toContain('Computer Science');
      expect(res.body.data.eligibility.department).toContain('Computer Science');
      expect(res.body.data.companyId.name).toBe('Tech Innovators Inc');
    });

    it('lists created placement drives with populated company on GET /api/teacher/drives', async () => {
      const res = await request(app)
        .get('/api/teacher/drives')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      const drive = res.body.data.find(d => d.title === 'Campus Drive 2026 - Tech Innovators');
      expect(drive).toBeDefined();
      expect(drive.companyId.name).toBe('Tech Innovators Inc');
    });
  });
});
