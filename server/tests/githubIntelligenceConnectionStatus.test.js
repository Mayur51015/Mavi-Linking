const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const User = require('../src/models/User');
const ExternalIdentity = require('../src/models/ExternalIdentity');
const platformRoutes = require('../src/routes/platformRoutes');

describe('GitHub Intelligence Connection Status & Integrity Backend Tests', () => {
  let app;
  let userNeverLinked;
  let userUnverifiedString;
  let userValidLinked;
  let userRevoked;

  let tokenNeverLinked;
  let tokenUnverifiedString;
  let tokenValidLinked;
  let tokenRevoked;

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
    app.use('/api/platforms', platformRoutes);

    // 1. User who has never linked GitHub
    userNeverLinked = await User.create({
      name: 'Unlinked Student',
      email: `unlinked_${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'user',
      accountStatus: 'ACTIVE',
      emailVerified: true,
      platforms: {
        github: { username: '', linkedAt: null },
      },
      githubUsername: '',
    });

    // 2. User who has only an unverified string username without authorized integration
    userUnverifiedString = await User.create({
      name: 'Unverified Username Student',
      email: `unverified_${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'user',
      accountStatus: 'ACTIVE',
      emailVerified: true,
      githubUsername: 'mayur51015', // Legacy string from manual input
      platforms: {
        github: { username: 'mayur51015', linkedAt: null }, // Notice linkedAt is NULL
      },
    });

    // 3. User with valid authorized and verified integration
    userValidLinked = await User.create({
      name: 'Valid Connected Student',
      email: `valid_linked_${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'user',
      accountStatus: 'ACTIVE',
      emailVerified: true,
      platforms: {
        github: { username: 'validengineer', linkedAt: new Date() },
      },
      platformData: {
        github: {
          profile: { username: 'validengineer', publicRepos: 12 },
          repositories: [{ name: 'repo-1', language: 'JavaScript' }],
          languages: { totalDistinct: 1, distribution: { JavaScript: { count: 1, percentage: 100 } } },
          commits: { available: true, recentCount30Days: 45 },
          sync: { status: 'complete', completedAt: new Date() },
        },
      },
    });

    await ExternalIdentity.create({
      userId: userValidLinked._id,
      platform: 'github',
      externalUsername: 'validengineer',
      externalUserId: '987654321',
      platformAccountId: 'github:987654321',
      verificationStatus: 'verified',
      verifiedAt: new Date(),
      lastSuccessfulSync: new Date(),
    });

    // 4. User whose authorization was revoked
    userRevoked = await User.create({
      name: 'Revoked Access Student',
      email: `revoked_${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'user',
      accountStatus: 'ACTIVE',
      emailVerified: true,
      platforms: {
        github: { username: 'revokeduser', linkedAt: new Date() },
      },
    });

    await ExternalIdentity.create({
      userId: userRevoked._id,
      platform: 'github',
      externalUsername: 'revokeduser',
      externalUserId: '11223344',
      platformAccountId: 'github:11223344',
      verificationStatus: 'revoked',
      verifiedAt: new Date(),
    });

    tokenNeverLinked = generateToken(userNeverLinked);
    tokenUnverifiedString = generateToken(userUnverifiedString);
    tokenValidLinked = generateToken(userValidLinked);
    tokenRevoked = generateToken(userRevoked);
  });

  afterAll(async () => {
    await User.deleteMany({
      _id: { $in: [userNeverLinked._id, userUnverifiedString._id, userValidLinked._id, userRevoked._id] },
    });
    await ExternalIdentity.deleteMany({
      userId: { $in: [userNeverLinked._id, userUnverifiedString._id, userValidLinked._id, userRevoked._id] },
    });
  });

  test('1. User who has never linked GitHub returns linked: false, connectionState: not_connected, totalScore: null', async () => {
    const res = await request(app)
      .get('/api/platforms/github/intelligence')
      .set('Authorization', `Bearer ${tokenNeverLinked}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.linked).toBe(false);
    expect(res.body.data.connectionState).toBe('not_connected');
    expect(res.body.data.username).toBeNull();
    expect(res.body.data.totalScore).toBeNull();
  });

  test('2. A GitHub username alone without authorized integration must NOT establish a connected account', async () => {
    const res = await request(app)
      .get('/api/platforms/github/intelligence')
      .set('Authorization', `Bearer ${tokenUnverifiedString}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.linked).toBe(false);
    expect(res.body.data.connectionState).toBe('not_connected');
    expect(res.body.data.username).toBeNull();
    expect(res.body.data.totalScore).toBeNull();
  });

  test('3. Valid verified GitHub integration returns linked: true, connectionState: connected, real stats', async () => {
    const res = await request(app)
      .get('/api/platforms/github/intelligence')
      .set('Authorization', `Bearer ${tokenValidLinked}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.linked).toBe(true);
    expect(res.body.data.connectionState).toBe('connected');
    expect(res.body.data.username).toBe('validengineer');
    expect(res.body.data.intelligence).not.toBeNull();
    expect(typeof res.body.data.totalScore).toBe('number');
  });

  test('4. Revoked authorization returns linked: false, connectionState: revoked, reconnect required', async () => {
    const res = await request(app)
      .get('/api/platforms/github/intelligence')
      .set('Authorization', `Bearer ${tokenRevoked}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.linked).toBe(false);
    expect(res.body.data.connectionState).toBe('revoked');
    expect(res.body.data.username).toBeNull();
  });

  test('5. Scoping: Unlinked user lookup does NOT bleed data from another connected user', async () => {
    const res = await request(app)
      .get('/api/platforms/github/intelligence')
      .set('Authorization', `Bearer ${tokenNeverLinked}`);

    expect(res.body.data.linked).toBe(false);
    expect(res.body.data.username).toBeNull();
    expect(res.body.data.intelligence).toBeNull();
  });

  test('6. Unlinking a platform account clears username, linkedAt, and returns not_connected', async () => {
    const unlinkRes = await request(app)
      .delete('/api/platforms/github')
      .set('Authorization', `Bearer ${tokenValidLinked}`);

    expect(unlinkRes.status).toBe(200);

    const checkRes = await request(app)
      .get('/api/platforms/github/intelligence')
      .set('Authorization', `Bearer ${tokenValidLinked}`);

    expect(checkRes.status).toBe(200);
    expect(checkRes.body.data.linked).toBe(false);
    expect(checkRes.body.data.connectionState).toBe('not_connected');
    expect(checkRes.body.data.username).toBeNull();
  });
});
