const express = require('express');
const cors = require('cors');
const request = require('supertest');

describe('CORS Configuration Tests', () => {
  let app;
  const vercelOrigin = 'https://mavi-linking-mq7d-hcv3uvrk7-mayur-khandares-projects.vercel.app';
  const stableVercelOrigin = 'https://mavi-linking-mq7d.vercel.app';
  const localOrigin = 'http://localhost:5173';
  const evilOrigin = 'https://malicious-site.com';

  beforeAll(() => {
    app = express();
    
    const defaultAllowedOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://mavi-linking-mq7d.vercel.app',
      'https://mavi-linking-mq7d-hcv3uvrk7-mayur-khandares-projects.vercel.app',
    ];

    const envAllowedOrigins = [
      process.env.CLIENT_URL,
      process.env.FRONTEND_URL,
      process.env.CORS_ORIGINS,
    ]
      .filter(Boolean)
      .flatMap((val) => val.split(','))
      .map((o) => o.trim())
      .filter(Boolean);

    const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowedOrigins])];

    const isOriginAllowed = (origin) => {
      if (!origin) return true;
      const cleanOrigin = origin.replace(/\/+$/, '');
      if (allowedOrigins.some((o) => o.replace(/\/+$/, '') === cleanOrigin)) return true;
      if (/^https:\/\/mavi-linking(-[a-z0-9-]+)?-mayur-khandares-projects\.vercel\.app$/i.test(cleanOrigin)) return true;
      if (/^https:\/\/mavi-linking(-[a-z0-9-]+)?\.vercel\.app$/i.test(cleanOrigin)) return true;
      return false;
    };

    const corsOptions = {
      origin: function (origin, callback) {
        if (isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers',
      ],
      exposedHeaders: ['Content-Range', 'X-Content-Range', 'Authorization'],
      maxAge: 86400,
      optionsSuccessStatus: 204,
    };

    app.use(cors(corsOptions));
    app.options('*', cors(corsOptions));

    app.post('/api/auth/login', (req, res) => res.json({ success: true, message: 'Logged in' }));
    app.get('/api/billing/plans', (req, res) => res.json({ success: true, plans: [] }));
  });

  test('OPTIONS preflight with production Vercel origin returns 204 & CORS headers', async () => {
    const res = await request(app)
      .options('/api/auth/login')
      .set('Origin', vercelOrigin)
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type, Authorization');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe(vercelOrigin);
    expect(res.headers['access-control-allow-credentials']).toBe('true');
    expect(res.headers['access-control-allow-methods']).toContain('POST');
  });

  test('GET /api/billing/plans with production Vercel origin returns 200 & CORS headers', async () => {
    const res = await request(app)
      .get('/api/billing/plans')
      .set('Origin', vercelOrigin);

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe(vercelOrigin);
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  test('POST /api/auth/login with production Vercel origin returns 200 & CORS headers', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Origin', vercelOrigin);

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe(vercelOrigin);
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  test('GET /api/billing/plans with stable Vercel domain returns 200 & CORS headers', async () => {
    const res = await request(app)
      .get('/api/billing/plans')
      .set('Origin', stableVercelOrigin);

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe(stableVercelOrigin);
  });

  test('GET /api/billing/plans with localhost returns 200 & CORS headers', async () => {
    const res = await request(app)
      .get('/api/billing/plans')
      .set('Origin', localOrigin);

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe(localOrigin);
  });

  test('GET /api/billing/plans with unauthorized origin does NOT set Access-Control-Allow-Origin', async () => {
    const res = await request(app)
      .get('/api/billing/plans')
      .set('Origin', evilOrigin);

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
