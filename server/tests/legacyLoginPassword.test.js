const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../src/models/User');

jest.setTimeout(30000);

describe('Legacy password compatibility for login', () => {
  let app;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mavi_linking_test';
      await mongoose.connect(mongoUri);
    }

    app = express();
    app.use(express.json());
    app.use('/api/auth', require('../src/routes/authRoutes'));
    app.use(require('../src/middleware/errorHandler'));
  });

  afterEach(async () => {
    await User.deleteMany({ email: /legacy_login_.*@example\.com$/ });
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  test('login succeeds for users whose stored password is still plain text and rehashes it', async () => {
    const email = `legacy_login_${Date.now()}@example.com`;
    const password = 'LegacyPassword@123';

    const user = await User.create({
      name: 'Legacy Login User',
      email,
      password,
      role: 'user',
      roles: ['user'],
      accountStatus: 'ACTIVE',
      status: 'active',
      emailVerified: true,
    });

    await User.collection.updateOne(
      { _id: user._id },
      { $set: { password } }
    );

    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: email, password });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(email);

    const refreshedUser = await User.findById(user._id).select('+password');
    expect(refreshedUser.password).not.toBe(password);
    expect(refreshedUser.password).not.toHaveLength(0);
  });

  test('login resolves generated MAVI admin IDs through the standard login endpoint', async () => {
    const email = `legacy_login_admin_${Date.now()}@example.com`;
    const password = 'AdminPassword@123';

    await User.create({
      name: 'Admin ID Login User',
      email,
      password,
      role: 'super_admin',
      roles: ['super_admin', 'admin'],
      adminId: 'MAVI-ADM-99',
      adminLoginId: 'MAVI-ADM-99',
      accountStatus: 'ACTIVE',
      status: 'active',
      emailVerified: true,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'MAVI-ADM-99', password });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('super_admin');
  });

  test('login resolves a MAVI student ID to its stored ETX ID', async () => {
    const email = `legacy_login_mavi_${Date.now()}@example.com`;
    const password = 'StudentPassword@123';
    const maviId = `MAVI-${Date.now().toString().slice(-8)}`;

    await User.create({
      name: 'MAVI ID Login User',
      email,
      password,
      role: 'user',
      roles: ['user'],
      maviId,
      accountStatus: 'ACTIVE',
      status: 'active',
      emailVerified: true,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: maviId, password });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.maviId).toBe(maviId);
  });
});
