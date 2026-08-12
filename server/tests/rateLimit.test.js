const express = require('express');
const request = require('supertest');
const { authLimiter, loginLimiter } = require('../src/middleware/authLimiter');
const apiLimiter = require('../src/middleware/apiLimiter');

function buildApp(middleware, status = 200) {
  const app = express();
  app.use(middleware);
  app.get('/test', (req, res) => res.status(status).json({ success: status < 400 }));
  return app;
}

describe('loginLimiter', () => {
  it('allows requests under the limit', async () => {
    const app = buildApp(loginLimiter);
    const res = await request(app).get('/test');
    expect(res.status).toBe(200);
  });

  it('blocks requests once the limit is exceeded and returns 429 with a generic message', async () => {
    // loginLimiter sets skipSuccessfulRequests, so only failed attempts count
    // towards the limit — the route has to answer 401 for this to exercise it.
    const app = buildApp(loginLimiter, 401);
    for (let i = 0; i < 5; i++) {
      await request(app).get('/test');
    }
    const res = await request(app).get('/test');
    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/too many login attempts/i);
    // Should not leak whether an account/email exists
    expect(res.body.message).not.toMatch(/email|user|password/i);
  });
});

describe('authLimiter', () => {
  it('allows requests under the limit', async () => {
    const app = buildApp(authLimiter);
    const res = await request(app).get('/test');
    expect(res.status).toBe(200);
  });

  it('blocks requests once the limit is exceeded', async () => {
    const app = buildApp(authLimiter);
    for (let i = 0; i < 10; i++) {
      await request(app).get('/test');
    }
    const res = await request(app).get('/test');
    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
  });
});

describe('global apiLimiter', () => {
  it('continues to allow normal API traffic', async () => {
    const app = buildApp(apiLimiter);
    const res = await request(app).get('/test');
    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty('ratelimit-limit');
  });
});