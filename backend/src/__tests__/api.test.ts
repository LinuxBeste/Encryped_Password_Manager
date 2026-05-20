import 'express-async-errors';
import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { initDb, closeDb, getDb } from '../db/db';
import { errorHandler } from '../api/middleware/error.middleware';
import { csrfProtection } from '../api/middleware/csrf.middleware';
import { authRouter } from '../api/routes/auth.routes';
import { email2faRouter } from '../api/routes/email2fa.routes';
import crypto from 'crypto';
import { getRateLimitBuckets } from '../api/middleware/rateLimit.middleware';

const testDbPath = path.join(__dirname, '../../../test-data/api-test.db');

function createApp() {
  const app = express();
  app.use(cookieParser());
  app.use(express.json({ limit: '5mb' }));
  app.use(csrfProtection);

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok' } });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/auth', email2faRouter);
  app.use(errorHandler);
  return app;
}

function freshDb() {
  const dir = path.dirname(testDbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  try { closeDb(); } catch { /* ok */ }
  for (const f of [testDbPath, testDbPath + '-wal', testDbPath + '-shm']) {
    try { fs.unlinkSync(f); } catch { /* ok */ }
  }
  return initDb(testDbPath);
}

async function getCsrf(app: Express) {
  const res = await request(app).get('/api/health');
  const raw = res.headers['set-cookie'];
  const cookies = Array.isArray(raw) ? raw : [raw];
  const csrf = cookies.find((c: string) => c.startsWith('csrf-token=')) || '';
  return {
    token: csrf.split(';')[0].split('=')[1],
    cookie: csrf.split(';')[0],
  };
}

beforeEach(() => {
  freshDb();
  getRateLimitBuckets().clear();
});

afterAll(() => {
  try { closeDb(); } catch { /* ok */ }
  for (const f of [testDbPath, testDbPath + '-wal', testDbPath + '-shm']) {
    try { fs.unlinkSync(f); } catch { /* ok */ }
  }
});

describe('GET /api/health', () => {
  it('returns ok status', async () => {
    const app = createApp();
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
  });
});

describe('POST /api/auth/register', () => {
  const email = 'register-test@test.com';
  const password = 'StrongP@ss1';

  it('creates a new user and returns userId', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .post('/api/auth/register')
      .set('Cookie', csrf.cookie)
      .set('x-csrf-token', csrf.token)
      .send({ email, masterPassword: password });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.userId).toBeDefined();
    expect(typeof res.body.data.userId).toBe('string');
  });

  it('rejects duplicate email with 409', async () => {
    const app = createApp();
    const csrf1 = await getCsrf(app);
    await request(app)
      .post('/api/auth/register')
      .set('Cookie', csrf1.cookie)
      .set('x-csrf-token', csrf1.token)
      .send({ email, masterPassword: password });

    const csrf2 = await getCsrf(app);
    const res = await request(app)
      .post('/api/auth/register')
      .set('Cookie', csrf2.cookie)
      .set('x-csrf-token', csrf2.token)
      .send({ email, masterPassword: password });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/email/i);
  });

  it('rejects missing email with 400', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .post('/api/auth/register')
      .set('Cookie', csrf.cookie)
      .set('x-csrf-token', csrf.token)
      .send({ masterPassword: password });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects short password with 400', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .post('/api/auth/register')
      .set('Cookie', csrf.cookie)
      .set('x-csrf-token', csrf.token)
      .send({ email, masterPassword: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects invalid email with 400', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .post('/api/auth/register')
      .set('Cookie', csrf.cookie)
      .set('x-csrf-token', csrf.token)
      .send({ email: 'not-an-email', masterPassword: password });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/auth/login', () => {
  const email = 'login-test@test.com';
  const password = 'StrongP@ss1';

  async function registerUser(app: Express) {
    const csrf = await getCsrf(app);
    await request(app)
      .post('/api/auth/register')
      .set('Cookie', csrf.cookie)
      .set('x-csrf-token', csrf.token)
      .send({ email, masterPassword: password });
  }

  it('succeeds with valid credentials', async () => {
    const app = createApp();
    await registerUser(app);

    const csrf = await getCsrf(app);
    const res = await request(app)
      .post('/api/auth/login')
      .set('Cookie', csrf.cookie)
      .set('x-csrf-token', csrf.token)
      .send({ email, masterPassword: password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.userId).toBeDefined();
  });

  it('fails with wrong password (401)', async () => {
    const app = createApp();
    await registerUser(app);

    const csrf = await getCsrf(app);
    const res = await request(app)
      .post('/api/auth/login')
      .set('Cookie', csrf.cookie)
      .set('x-csrf-token', csrf.token)
      .send({ email, masterPassword: 'WrongP@ss1' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('fails for non-existent email (401)', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .post('/api/auth/login')
      .set('Cookie', csrf.cookie)
      .set('x-csrf-token', csrf.token)
      .send({ email: 'nonexistent@test.com', masterPassword: password });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects missing fields with 400', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .post('/api/auth/login')
      .set('Cookie', csrf.cookie)
      .set('x-csrf-token', csrf.token)
      .send({ email });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/auth/refresh', () => {
  const email = 'refresh-test@test.com';
  const password = 'StrongP@ss1';
  let refreshToken: string;

  beforeEach(async () => {
    const app = createApp();
    const csrf1 = await getCsrf(app);
    await request(app)
      .post('/api/auth/register')
      .set('Cookie', csrf1.cookie)
      .set('x-csrf-token', csrf1.token)
      .send({ email, masterPassword: password });

    const csrf2 = await getCsrf(app);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .set('Cookie', csrf2.cookie)
      .set('x-csrf-token', csrf2.token)
      .send({ email, masterPassword: password });

    refreshToken = loginRes.body.data.refreshToken;
  });

  it('returns a new access token with valid refresh token', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', csrf.cookie)
      .set('x-csrf-token', csrf.token)
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  it('rejects invalid refresh token', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', csrf.cookie)
      .set('x-csrf-token', csrf.token)
      .send({ refreshToken: 'invalid-token' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/auth/logout', () => {
  const email = 'logout-test@test.com';
  const password = 'StrongP@ss1';
  let refreshToken: string;

  beforeEach(async () => {
    const app = createApp();
    const csrf1 = await getCsrf(app);
    await request(app)
      .post('/api/auth/register')
      .set('Cookie', csrf1.cookie)
      .set('x-csrf-token', csrf1.token)
      .send({ email, masterPassword: password });

    const csrf2 = await getCsrf(app);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .set('Cookie', csrf2.cookie)
      .set('x-csrf-token', csrf2.token)
      .send({ email, masterPassword: password });

    refreshToken = loginRes.body.data.refreshToken;
  });

  it('revokes the refresh token', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', csrf.cookie)
      .set('x-csrf-token', csrf.token)
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const csrf2 = await getCsrf(app);
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', csrf2.cookie)
      .set('x-csrf-token', csrf2.token)
      .send({ refreshToken });

    expect(refreshRes.body.success).toBe(false);
  });
});

describe('POST /api/auth/email-2fa/send', () => {
  const email = 'email2fa-send@test.com';
  const password = 'StrongP@ss1';
  let userId: string;

  beforeEach(async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const reg = await request(app)
      .post('/api/auth/register')
      .set('Cookie', csrf.cookie)
      .set('x-csrf-token', csrf.token)
      .send({ email, masterPassword: password });
    userId = reg.body.data.userId;

    const db = getDb();
    db.prepare('UPDATE users SET email_2fa_enabled = 1 WHERE id = ?').run(userId);
  });

  it('sends a code and returns success', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .post('/api/auth/email-2fa/send')
      .set('Cookie', csrf.cookie)
      .set('x-csrf-token', csrf.token)
      .send({ userId });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toMatch(/sent/i);
  });

  it('rejects non-existent userId', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .post('/api/auth/email-2fa/send')
      .set('Cookie', csrf.cookie)
      .set('x-csrf-token', csrf.token)
      .send({ userId: 'nonexistent' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('rejects missing userId', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .post('/api/auth/email-2fa/send')
      .set('Cookie', csrf.cookie)
      .set('x-csrf-token', csrf.token)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects request for user without email 2FA enabled', async () => {
    const app = createApp();
    const db = getDb();
    db.prepare('UPDATE users SET email_2fa_enabled = 0 WHERE id = ?').run(userId);

    const csrf = await getCsrf(app);
    const res = await request(app)
      .post('/api/auth/email-2fa/send')
      .set('Cookie', csrf.cookie)
      .set('x-csrf-token', csrf.token)
      .send({ userId });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not enabled/i);
  });
});

describe('POST /api/auth/email-2fa/verify', () => {
  const email = 'email2fa-verify@test.com';
  const password = 'StrongP@ss1';
  let userId: string;

  beforeEach(() => {
    const db = getDb();
    const reg = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as any;
    if (!reg) {
      // register via service directly to avoid CSRF per-test
      const { registerUser } = require('../services/auth.service');
      return registerUser(email, password).then((r: any) => {
        userId = r.data!.userId;
        db.prepare('UPDATE users SET email_2fa_enabled = 1 WHERE id = ?').run(userId);
      });
    }
    userId = reg.id;
    db.prepare('UPDATE users SET email_2fa_enabled = 1 WHERE id = ?').run(userId);
  });

  it('verifies a valid code and returns JWT', async () => {
    const db = getDb();
    const codeValue = '123456';
    const codeHash = crypto.createHash('sha256').update(codeValue).digest('hex');
    const { v4: uuidv4 } = require('uuid');
    const now = Date.now();
    db.prepare(
      'INSERT INTO email_2fa_codes (id, user_id, code_hash, expires_at, used, created_at) VALUES (?, ?, ?, ?, 0, ?)',
    ).run(uuidv4(), userId, codeHash, now + 300_000, now);

    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .post('/api/auth/email-2fa/verify')
      .set('Cookie', csrf.cookie)
      .set('x-csrf-token', csrf.token)
      .send({ userId, code: codeValue });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it('rejects wrong code', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .post('/api/auth/email-2fa/verify')
      .set('Cookie', csrf.cookie)
      .set('x-csrf-token', csrf.token)
      .send({ userId, code: '000000' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/invalid|expired/i);
  });

  it('rejects expired code', async () => {
    const db = getDb();
    const codeValue = '654321';
    const codeHash = crypto.createHash('sha256').update(codeValue).digest('hex');
    const { v4: uuidv4 } = require('uuid');
    const now = Date.now();
    db.prepare(
      'INSERT INTO email_2fa_codes (id, user_id, code_hash, expires_at, used, created_at) VALUES (?, ?, ?, ?, 0, ?)',
    ).run(uuidv4(), userId, codeHash, now - 1, now);

    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .post('/api/auth/email-2fa/verify')
      .set('Cookie', csrf.cookie)
      .set('x-csrf-token', csrf.token)
      .send({ userId, code: codeValue });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/invalid|expired/i);
  });

  it('rejects already-used code', async () => {
    const db = getDb();
    const codeValue = '111111';
    const codeHash = crypto.createHash('sha256').update(codeValue).digest('hex');
    const { v4: uuidv4 } = require('uuid');
    const now = Date.now();
    const id = uuidv4();
    db.prepare(
      'INSERT INTO email_2fa_codes (id, user_id, code_hash, expires_at, used, created_at) VALUES (?, ?, ?, ?, 1, ?)',
    ).run(id, userId, codeHash, now + 300_000, now);

    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .post('/api/auth/email-2fa/verify')
      .set('Cookie', csrf.cookie)
      .set('x-csrf-token', csrf.token)
      .send({ userId, code: codeValue });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/invalid|expired/i);
  });
});

describe('POST /api/auth/email-2fa/enable', () => {
  const email = 'email2fa-enable@test.com';
  const password = 'StrongP@ss1';
  let userId: string;
  let jwtCookie: string;

  beforeEach(async () => {
    const app = createApp();
    const csrf1 = await getCsrf(app);
    await request(app)
      .post('/api/auth/register')
      .set('Cookie', csrf1.cookie)
      .set('x-csrf-token', csrf1.token)
      .send({ email, masterPassword: password });

    const csrf2 = await getCsrf(app);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .set('Cookie', csrf2.cookie)
      .set('x-csrf-token', csrf2.token)
      .send({ email, masterPassword: password });

    userId = loginRes.body.data.userId;
    const tokenCookie = loginRes.headers['set-cookie'] as unknown as string[];
    const cookies = Array.isArray(tokenCookie) ? tokenCookie : [tokenCookie];
    jwtCookie = cookies.find((c: string) => c.startsWith('token='))?.split(';')[0] || '';
  });

  it('enables email 2FA with valid code', async () => {
    const db = getDb();
    const codeValue = '999999';
    const codeHash = crypto.createHash('sha256').update(codeValue).digest('hex');
    const { v4: uuidv4 } = require('uuid');
    const now = Date.now();
    db.prepare(
      'INSERT INTO email_2fa_codes (id, user_id, code_hash, expires_at, used, created_at) VALUES (?, ?, ?, ?, 0, ?)',
    ).run(uuidv4(), userId, codeHash, now + 300_000, now);

    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .post('/api/auth/email-2fa/enable')
      .set('Cookie', [csrf.cookie, jwtCookie].join('; '))
      .set('x-csrf-token', csrf.token)
      .send({ code: codeValue });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const user = db.prepare('SELECT email_2fa_enabled FROM users WHERE id = ?').get(userId) as any;
    expect(user.email_2fa_enabled).toBe(1);
  });

  it('rejects enable with wrong code', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .post('/api/auth/email-2fa/enable')
      .set('Cookie', [csrf.cookie, jwtCookie].join('; '))
      .set('x-csrf-token', csrf.token)
      .send({ code: '000000' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/invalid|expired/i);
  });

  it('rejects enable without auth', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .post('/api/auth/email-2fa/enable')
      .set('Cookie', csrf.cookie)
      .set('x-csrf-token', csrf.token)
      .send({ code: '123456' });

    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/auth/email-2fa', () => {
  const email = 'email2fa-delete@test.com';
  const password = 'StrongP@ss1';
  let userId: string;
  let jwtCookie: string;

  beforeEach(async () => {
    const app = createApp();
    const csrf1 = await getCsrf(app);
    await request(app)
      .post('/api/auth/register')
      .set('Cookie', csrf1.cookie)
      .set('x-csrf-token', csrf1.token)
      .send({ email, masterPassword: password });

    const csrf2 = await getCsrf(app);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .set('Cookie', csrf2.cookie)
      .set('x-csrf-token', csrf2.token)
      .send({ email, masterPassword: password });

    userId = loginRes.body.data.userId;
    const tokenCookie = loginRes.headers['set-cookie'] as unknown as string[];
    const cookies = Array.isArray(tokenCookie) ? tokenCookie : [tokenCookie];
    jwtCookie = cookies.find((c: string) => c.startsWith('token='))?.split(';')[0] || '';

    const db = getDb();
    db.prepare('UPDATE users SET email_2fa_enabled = 1 WHERE id = ?').run(userId);
  });

  it('disables email 2FA', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .delete('/api/auth/email-2fa')
      .set('Cookie', [csrf.cookie, jwtCookie].join('; '))
      .set('x-csrf-token', csrf.token);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const db = getDb();
    const user = db.prepare('SELECT email_2fa_enabled FROM users WHERE id = ?').get(userId) as any;
    expect(user.email_2fa_enabled).toBe(0);
  });

  it('rejects disable without auth', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .delete('/api/auth/email-2fa')
      .set('Cookie', csrf.cookie)
      .set('x-csrf-token', csrf.token);

    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/email-2fa/send-enable', () => {
  const email = 'email2fa-sendenable@test.com';
  const password = 'StrongP@ss1';
  let userId: string;
  let jwtCookie: string;

  beforeEach(async () => {
    const app = createApp();
    const csrf1 = await getCsrf(app);
    await request(app)
      .post('/api/auth/register')
      .set('Cookie', csrf1.cookie)
      .set('x-csrf-token', csrf1.token)
      .send({ email, masterPassword: password });

    const csrf2 = await getCsrf(app);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .set('Cookie', csrf2.cookie)
      .set('x-csrf-token', csrf2.token)
      .send({ email, masterPassword: password });

    userId = loginRes.body.data.userId;
    const tokenCookie = loginRes.headers['set-cookie'] as unknown as string[];
    const cookies = Array.isArray(tokenCookie) ? tokenCookie : [tokenCookie];
    jwtCookie = cookies.find((c: string) => c.startsWith('token='))?.split(';')[0] || '';
  });

  it('sends a verification code for enabling', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .get('/api/auth/email-2fa/send-enable')
      .set('Cookie', [csrf.cookie, jwtCookie].join('; '))
      .set('x-csrf-token', csrf.token);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toMatch(/sent/i);
  });

  it('rejects without auth', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .get('/api/auth/email-2fa/send-enable')
      .set('Cookie', csrf.cookie)
      .set('x-csrf-token', csrf.token);

    expect(res.status).toBe(401);
  });
});

describe('CSRF protection', () => {
  it('blocks mutating requests without CSRF token', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@test.com', masterPassword: 'StrongP@ss1' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/csrf/i);
  });

  it('blocks mutating requests with mismatched CSRF token', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .post('/api/auth/register')
      .set('Cookie', csrf.cookie)
      .set('x-csrf-token', 'wrong-token')
      .send({ email: 'test@test.com', masterPassword: 'StrongP@ss1' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/csrf/i);
  });
});
