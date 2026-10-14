const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../src/models/User');
const { protect } = require('../src/middleware/auth');
const { requireRole } = require('../src/middleware/roleMiddleware');
const authRoutes = require('../src/routes/authRoutes');
const errorHandler = require('../src/middleware/errorHandler');

let app;
const JWT_SECRET = process.env.JWT_SECRET || 'ci-test-secret-key-mavi-linking-2026';

beforeAll(async () => {
  app = express();
  app.use(express.json());

  // Mount actual auth routes
  app.use('/api/auth', authRoutes);

  // Mount protected mock endpoints with different RBAC requirements
  app.get('/api/test/student-only', protect, requireRole('user'), (req, res) => {
    res.json({ success: true, message: 'Welcome student', user: req.user });
  });

  app.get('/api/test/teacher-only', protect, requireRole('teacher'), (req, res) => {
    res.json({ success: true, message: 'Welcome teacher', user: req.user });
  });

  app.get('/api/test/admin-only', protect, requireRole('admin'), (req, res) => {
    res.json({ success: true, message: 'Welcome admin', user: req.user });
  });

  app.use(errorHandler);
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Security, RBAC, and Data Protection Suite', () => {
  describe('1. Unauthorized Access & Token Integrity', () => {
    it('rejects unauthenticated requests to protected endpoints with 401', async () => {
      const res = await request(app).get('/api/test/student-only');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/access denied|no token/i);
    });

    it('rejects malformed bearer tokens with 401', async () => {
      const res = await request(app)
        .get('/api/test/student-only')
        .set('Authorization', 'Bearer totally.invalid.malformed-jwt');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects tokens signed with forged or invalid secrets with 401', async () => {
      const forgedToken = jwt.sign(
        { id: new mongoose.Types.ObjectId().toString(), role: 'admin' },
        'forged_attacker_secret_key'
      );

      const res = await request(app)
        .get('/api/test/admin-only')
        .set('Authorization', `Bearer ${forgedToken}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects expired JWT tokens with 401', async () => {
      const expiredToken = jwt.sign(
        { id: new mongoose.Types.ObjectId().toString(), role: 'user' },
        JWT_SECRET,
        { expiresIn: -10 }
      );

      const res = await request(app)
        .get('/api/test/student-only')
        .set('Authorization', `Bearer ${expiredToken}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Role-Based Access Control (RBAC) & Privilege Escalation', () => {
    let studentUser, studentToken;
    let teacherUser, teacherToken;
    let adminUser, adminToken;

    beforeEach(async () => {
      studentUser = await User.create({
        name: 'Alice Student',
        email: 'alice@student.edu',
        password: 'Password123!',
        role: 'user',
        roles: ['user'],
        roleStatus: 'active',
        emailVerified: true,
      });
      studentToken = jwt.sign({ id: studentUser._id, role: 'user' }, JWT_SECRET, { expiresIn: '1h' });

      teacherUser = await User.create({
        name: 'Prof Bob',
        email: 'bob@faculty.edu',
        password: 'Password123!',
        role: 'teacher',
        roles: ['teacher'],
        roleStatus: 'active',
        emailVerified: true,
      });
      teacherToken = jwt.sign({ id: teacherUser._id, role: 'teacher' }, JWT_SECRET, { expiresIn: '1h' });

      adminUser = await User.create({
        name: 'Carol Admin',
        email: 'carol@admin.edu',
        password: 'Password123!',
        role: 'admin',
        roles: ['admin'],
        roleStatus: 'active',
        emailVerified: true,
      });
      adminToken = jwt.sign({ id: adminUser._id, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
    });

    it('allows student to access student-only resource', async () => {
      const res = await request(app)
        .get('/api/test/student-only')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('prevents student privilege escalation to teacher-only resource with 403', async () => {
      const res = await request(app)
        .get('/api/test/teacher-only')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/access denied|authorized role/i);
    });

    it('prevents student privilege escalation to admin-only resource with 403', async () => {
      const res = await request(app)
        .get('/api/test/admin-only')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/access denied|authorized role/i);
    });

    it('prevents teacher privilege escalation to admin-only resource with 403', async () => {
      const res = await request(app)
        .get('/api/test/admin-only')
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('allows admin to access admin-only endpoints', async () => {
      const res = await request(app)
        .get('/api/test/admin-only')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('blocks access for pending role status on privileged endpoints', async () => {
      const pendingTeacher = await User.create({
        name: 'Dave Pending',
        email: 'dave@faculty.edu',
        password: 'Password123!',
        role: 'teacher',
        roles: ['teacher'],
        roleStatus: 'pending',
        emailVerified: true,
      });
      const pendingToken = jwt.sign({ id: pendingTeacher._id, role: 'teacher' }, JWT_SECRET, { expiresIn: '1h' });

      const res = await request(app)
        .get('/api/test/teacher-only')
        .set('Authorization', `Bearer ${pendingToken}`);
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/pending.*approval/i);
    });
  });

  describe('3. Protection of Private & Sensitive User Data', () => {
    it('never exposes password hashes or salt in User toJSON serialization', async () => {
      const user = await User.create({
        name: 'Eve Secret',
        email: 'eve@example.com',
        password: 'SensitivePassword999!',
        role: 'user',
        emailVerified: true,
      });

      const serialized = user.toJSON();
      expect(serialized.password).toBeUndefined();
      expect(serialized.salt).toBeUndefined();
      expect(serialized.email).toBe('eve@example.com');
    });

    it('sanitizes user profile data on /api/auth/me response', async () => {
      const user = await User.create({
        name: 'Frank User',
        email: 'frank@example.com',
        password: 'SuperSecretPassword123!',
        role: 'user',
        emailVerified: true,
      });

      const token = jwt.sign({ id: user._id, role: 'user' }, JWT_SECRET, { expiresIn: '1h' });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.data.user.salt).toBeUndefined();
      expect(res.body.data.user.refreshTokens).toBeUndefined();
      expect(res.body.data.user.email).toBe('frank@example.com');
    });
  });

  describe('4. Input Validation & Injection Resistance', () => {
    it('safely rejects NoSQL query injection object payloads without auth bypass', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: { $gt: '' },
          password: { $gt: '' },
        });

      // Must be safely rejected without leaking tokens or granting authentication
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.token).toBeUndefined();
    });

    it('strictly rejects invalid email formats during registration with 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Invalid Email User',
          email: 'not-an-email-address',
          password: 'Password123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      const emailErr = res.body.errors.find((e) => e.field === 'email' || e.path === 'email');
      expect(emailErr).toBeDefined();
    });
  });
});
