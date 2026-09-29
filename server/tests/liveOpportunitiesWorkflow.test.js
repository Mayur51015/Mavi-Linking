const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const User = require('../src/models/User');
const Job = require('../src/models/Job');
const Company = require('../src/models/Company');
const RecruitmentPipeline = require('../src/models/RecruitmentPipeline');
const jobRoutes = require('../src/routes/jobRoutes');
const placementRoutes = require('../src/routes/placementRoutes');

describe('Live Career Opportunities & Application System - Full Integration Test Suite', () => {
  let app;
  let recruiterA;
  let recruiterB;
  let student1;
  let student2;
  let recruiterAToken;
  let recruiterBToken;
  let student1Token;
  let student2Token;
  let companyA;
  let companyB;

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
    app.use('/api/jobs', jobRoutes);
    app.use('/api/opportunities', jobRoutes);
    app.use('/api/placement', placementRoutes);
    app.use('/api/applications', placementRoutes);

    // Create Test Users
    recruiterA = await User.create({
      name: 'Recruiter Alpha',
      email: `recruiterA_${Date.now()}@techcorp.com`,
      password: 'Password123!',
      role: 'recruiter',
      companyName: 'Alpha Tech Solutions',
      accountStatus: 'ACTIVE',
      emailVerified: true,
    });

    recruiterB = await User.create({
      name: 'Recruiter Beta',
      email: `recruiterB_${Date.now()}@innovate.com`,
      password: 'Password123!',
      role: 'recruiter',
      companyName: 'Beta Innovations',
      accountStatus: 'ACTIVE',
      emailVerified: true,
    });

    student1 = await User.create({
      name: 'Student One',
      email: `student1_${Date.now()}@university.edu`,
      password: 'Password123!',
      role: 'user',
      accountStatus: 'ACTIVE',
      emailVerified: true,
      skillsList: [{ name: 'React', level: 'Advanced', verified: true }, { name: 'Node.js', level: 'Intermediate', verified: true }],
    });

    student2 = await User.create({
      name: 'Student Two',
      email: `student2_${Date.now()}@university.edu`,
      password: 'Password123!',
      role: 'user',
      accountStatus: 'ACTIVE',
      emailVerified: true,
      skillsList: [{ name: 'Python', level: 'Advanced', verified: true }],
    });

    companyA = await Company.create({
      recruiterId: recruiterA._id,
      name: 'Alpha Tech Solutions',
      location: 'Pune / Remote',
      industry: 'Software',
    });

    companyB = await Company.create({
      recruiterId: recruiterB._id,
      name: 'Beta Innovations',
      location: 'Bangalore',
      industry: 'AI & Data',
    });

    recruiterAToken = generateToken(recruiterA);
    recruiterBToken = generateToken(recruiterB);
    student1Token = generateToken(student1);
    student2Token = generateToken(student2);
  });

  afterAll(async () => {
    await Job.deleteMany({});
    await RecruitmentPipeline.deleteMany({});
    await Company.deleteMany({});
    await User.deleteMany({ _id: { $in: [recruiterA._id, recruiterB._id, student1._id, student2._id] } });
  });

  let activeJobId;
  let expiredJobId;
  let closedJobId;

  // 1 & 8. Recruiter can create opportunity
  test('1 & 8: Recruiter can create a new opportunity stored in MongoDB', async () => {
    const res = await request(app)
      .post('/api/opportunities')
      .set('Authorization', `Bearer ${recruiterAToken}`)
      .send({
        title: 'Full Stack Developer Intern',
        description: 'Build web applications using React and Node.js.',
        type: 'Internship',
        workMode: 'Remote',
        location: 'Pune / Remote',
        skills: ['React', 'Node.js', 'MongoDB'],
        department: ['CSE', 'IT'],
        experience: 'Fresher',
        package: '6 LPA',
        stipend: '₹20,000/month',
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'open',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Full Stack Developer Intern');
    expect(res.body.data.type).toBe('Internship');
    expect(res.body.data.workMode).toBe('Remote');
    expect(res.body.data.status).toBe('open');
    activeJobId = res.body.data._id;

    // Verify persisted in MongoDB
    const savedJob = await Job.findById(activeJobId);
    expect(savedJob).not.toBeNull();
    expect(savedJob.recruiterId.toString()).toBe(recruiterA._id.toString());
  });

  // 2. Fetch active and only published opportunities (no closed / expired)
  test('2: Student fetches live opportunities - only published and non-expired are returned', async () => {
    // Create an expired opportunity
    const expiredRes = await Job.create({
      recruiterId: recruiterA._id,
      companyId: companyA._id,
      title: 'Expired Legacy Role',
      description: 'Role whose deadline has passed',
      type: 'Full-time',
      status: 'open',
      deadline: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
    });
    expiredJobId = expiredRes._id;

    // Create a closed opportunity
    const closedRes = await Job.create({
      recruiterId: recruiterA._id,
      companyId: companyA._id,
      title: 'Closed Inactive Role',
      description: 'Closed role not accepting applications',
      type: 'Full-time',
      status: 'closed',
    });
    closedJobId = closedRes._id;

    // Student requests active opportunities via /api/opportunities
    const res = await request(app)
      .get('/api/opportunities')
      .set('Authorization', `Bearer ${student1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const returnedIds = res.body.data.map((j) => j._id.toString());
    expect(returnedIds).toContain(activeJobId.toString());
    expect(returnedIds).not.toContain(expiredJobId.toString());
    expect(returnedIds).not.toContain(closedJobId.toString());

    // Check match scoring calculation for Student 1 (has React, Node.js)
    const activeJobData = res.body.data.find((j) => j._id.toString() === activeJobId.toString());
    expect(activeJobData.matchScore).toBeGreaterThan(0);
    expect(activeJobData.hasApplied).toBe(false);
  });

  // 3. Expired opportunity cannot accept applications
  test('3: Expired opportunity rejects application with validation error', async () => {
    const res = await request(app)
      .post(`/api/jobs/${expiredJobId}/apply`)
      .set('Authorization', `Bearer ${student1Token}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/deadline has passed/i);
  });

  // 4. Student can apply
  test('4: Student can apply to an active opportunity and create a RecruitmentPipeline document', async () => {
    const res = await request(app)
      .post(`/api/jobs/${activeJobId}/apply`)
      .set('Authorization', `Bearer ${student1Token}`);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Applied');
    expect(res.body.data.jobId.toString()).toBe(activeJobId.toString());
    expect(res.body.data.studentId.toString()).toBe(student1._id.toString());
    expect(res.body.data.recruiterId.toString()).toBe(recruiterA._id.toString());

    // Verify stored in MongoDB
    const pipelineDoc = await RecruitmentPipeline.findById(res.body.data._id);
    expect(pipelineDoc).not.toBeNull();
    expect(pipelineDoc.status).toBe('Applied');

    // Verify Student availability status synced
    const updatedStudent = await User.findById(student1._id);
    expect(updatedStudent.placementStatus).toBe('Under Review');
  });

  // 5. Student cannot apply twice (duplicate prevention on backend)
  test('5: Student cannot apply twice to the same opportunity (Backend Duplicate Prevention)', async () => {
    const res = await request(app)
      .post(`/api/jobs/${activeJobId}/apply`)
      .set('Authorization', `Bearer ${student1Token}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already applied/i);
  });

  // 6. Student can view own applications in Recent Applications
  test('6: Student can view their own applications with live status', async () => {
    const res = await request(app)
      .get('/api/applications/my')
      .set('Authorization', `Bearer ${student1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    const appItem = res.body.data.find(
      (a) => a.jobId?._id?.toString() === activeJobId.toString() || a.role === 'Full Stack Developer Intern'
    );
    expect(appItem).toBeDefined();
    expect(appItem.status).toBe('Applied');
    expect(appItem.companyName).toBe('Alpha Tech Solutions');
  });

  // 7. Student cannot view another student's applications
  test('7: Student cannot view another student applications (tenant isolation)', async () => {
    const res = await request(app)
      .get('/api/applications/my')
      .set('Authorization', `Bearer ${student2Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Student 2 has not applied yet, must be empty
    expect(res.body.data.length).toBe(0);
  });

  // 9. Recruiter can view applications for own opportunity
  test('9: Recruiter can view applications submitted for their opportunity', async () => {
    const res = await request(app)
      .get('/api/placement/pipeline')
      .set('Authorization', `Bearer ${recruiterAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const candidateApp = res.body.data.find(
      (c) => c.studentId?._id?.toString() === student1._id.toString()
    );
    expect(candidateApp).toBeDefined();
    expect(candidateApp.status).toBe('Applied');
    expect(candidateApp.studentId.name).toBe('Student One');
  });

  // 10. Recruiter B cannot modify Recruiter A's opportunity
  test('10: Recruiter B cannot update or delete Recruiter A opportunity', async () => {
    const res = await request(app)
      .put(`/api/jobs/${activeJobId}`)
      .set('Authorization', `Bearer ${recruiterBToken}`)
      .send({ title: 'Hijacked Job Title' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);

    const deleteRes = await request(app)
      .delete(`/api/jobs/${activeJobId}`)
      .set('Authorization', `Bearer ${recruiterBToken}`);

    expect(deleteRes.status).toBe(403);
  });

  // 11. Recruiter updates application status to Shortlisted
  let student1PipelineId;
  test('11: Recruiter updates application status from Applied to Shortlisted', async () => {
    const pipeline = await RecruitmentPipeline.findOne({
      studentId: student1._id,
      recruiterId: recruiterA._id,
    });
    expect(pipeline).not.toBeNull();
    student1PipelineId = pipeline._id;

    const res = await request(app)
      .put(`/api/placement/pipeline/${student1PipelineId}/status`)
      .set('Authorization', `Bearer ${recruiterAToken}`)
      .send({ status: 'Shortlisted', note: 'Great React & Node.js portfolio projects.' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Shortlisted');

    // Verify in MongoDB
    const updatedPipeline = await RecruitmentPipeline.findById(student1PipelineId);
    expect(updatedPipeline.status).toBe('Shortlisted');
    expect(updatedPipeline.timeline[updatedPipeline.timeline.length - 1].status).toBe('Shortlisted');
  });

  // 12. Student sees updated application status live
  test('12: Student queries applications and sees updated status = Shortlisted', async () => {
    const res = await request(app)
      .get('/api/applications/my')
      .set('Authorization', `Bearer ${student1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const appItem = res.body.data.find((a) => a._id.toString() === student1PipelineId.toString());
    expect(appItem).toBeDefined();
    expect(appItem.status).toBe('Shortlisted');
  });
});
