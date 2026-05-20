import 'express-async-errors';
import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { initDb, closeDb } from '../db/db';
import { errorHandler } from '../api/middleware/error.middleware';
import { csrfProtection } from '../api/middleware/csrf.middleware';
import { authenticate, AuthRequest } from '../api/middleware/auth.middleware';
import { rateLimitDefault } from '../api/middleware/rateLimit.middleware';
import { authRouter } from '../api/routes/auth.routes';
import { vaultRouter } from '../api/routes/vault.routes';
import { entriesRouter } from '../api/routes/entries.routes';
import { foldersRouter } from '../api/routes/folders.routes';
import { settingsRouter } from '../api/routes/settings.routes';
import { getAuditLogs } from '../services/audit.service';
import { getRateLimitBuckets } from '../api/middleware/rateLimit.middleware';

const testDbPath = path.join(__dirname, '../../../test-data/api-integration-test.db');

const email = 'integ@test.com';
const password = 'StrongP@ss1';
let accessToken: string;
let refreshToken: string;
let vaultId: string;
let entryId: string;
let folderId: string;

function createApp() {
  const app = express();
  app.use(cookieParser());
  app.use(express.json({ limit: '5mb' }));
  app.use(csrfProtection);
  app.get('/api/health', (_req, res) => { res.json({ success: true, data: { status: 'ok' } }); });
  app.use('/api/auth', authRouter);
  app.use('/api/vault', vaultRouter);
  app.use('/api/entries', entriesRouter);
  app.use('/api/folders', foldersRouter);
  app.use('/api/settings', settingsRouter);
  app.get('/api/audit', authenticate, rateLimitDefault, (req: AuthRequest, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 1000);
    const result = getAuditLogs(req.userId!, page, limit);
    res.json({ success: true, data: result });
  });
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

function authCsrf(csrf: { token: string; cookie: string }) {
  return {
    'Cookie': csrf.cookie,
    'x-csrf-token': csrf.token,
    'Authorization': `Bearer ${accessToken}`,
  };
}

const b64 = (s: string) => Buffer.from(s).toString('base64');

beforeAll(async () => {
  freshDb();
  getRateLimitBuckets().clear();
  const app = createApp();
  const csrf = await getCsrf(app);
  await request(app)
    .post('/api/auth/register')
    .set('Cookie', csrf.cookie)
    .set('x-csrf-token', csrf.token)
    .send({ email, masterPassword: password });
  const loginRes = await request(app)
    .post('/api/auth/login')
    .set('Cookie', csrf.cookie!)
    .set('x-csrf-token', csrf.token)
    .send({ email, masterPassword: password });
  accessToken = loginRes.body.data.token;
  refreshToken = loginRes.body.data.refreshToken;
  const vaultRes = await request(app)
    .get('/api/vault')
    .set(authCsrf(csrf!));
  vaultId = vaultRes.body.data?.vault?.id;
});

beforeEach(() => {
  getRateLimitBuckets().clear();
});

afterAll(() => {
  try { closeDb(); } catch { /* ok */ }
  for (const f of [testDbPath, testDbPath + '-wal', testDbPath + '-shm']) {
    try { fs.unlinkSync(f); } catch { /* ok */ }
  }
});

describe('GET /api/vault', () => {
  it('returns vault and entries for authenticated user', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .get('/api/vault')
      .set(authCsrf(csrf));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });
});

describe('POST /api/vault/sync', () => {
  it('syncs with valid timestamp', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .post('/api/vault/sync')
      .set(authCsrf(csrf))
      .send({ lastSyncAt: 0, deletedIds: [] });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('rejects missing lastSyncAt', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .post('/api/vault/sync')
      .set(authCsrf(csrf))
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/vault/export', () => {
  it('exports all vault data', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .get('/api/vault/export')
      .set(authCsrf(csrf));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.exportedAt).toBeDefined();
  });
});

describe('POST /api/entries', () => {
  it('creates an entry and returns it', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .post('/api/entries')
      .set(authCsrf(csrf))
      .send({
        vault_id: vaultId,
        title_encrypted: b64('title'),
        body_encrypted: b64('body'),
        iv: b64('iv12345678901234'),
        auth_tag: b64('tag1234567890123'),
        type: 'password',
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    entryId = res.body.data.id;
    vaultId = res.body.data.vault_id;
  });

  it('rejects missing required fields', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .post('/api/entries')
      .set(authCsrf(csrf))
      .send({ type: 'password' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/entries', () => {
  it('lists all entries for user', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .get('/api/entries')
      .set(authCsrf(csrf));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /api/entries/:id', () => {
  it('returns a single entry by id', async () => {
    if (!entryId) return;
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .get(`/api/entries/${entryId}`)
      .set(authCsrf(csrf));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(entryId);
  });

  it('returns 404 for non-existent entry', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .get('/api/entries/00000000-0000-0000-0000-000000000099')
      .set(authCsrf(csrf));
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/entries/:id', () => {
  it('updates an entry', async () => {
    if (!entryId) return;
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .put(`/api/entries/${entryId}`)
      .set(authCsrf(csrf))
      .send({
        title_encrypted: b64('updated-title'),
        body_encrypted: b64('updated-body'),
        iv: b64('iv12345678901234'),
        auth_tag: b64('tag1234567890123'),
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('PATCH /api/entries/:id/favorite', () => {
  it('toggles favorite on an entry', async () => {
    if (!entryId) return;
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .patch(`/api/entries/${entryId}/favorite`)
      .set(authCsrf(csrf));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('POST /api/folders', () => {
  it('creates a folder', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .post('/api/folders')
      .set(authCsrf(csrf))
      .send({
        vault_id: vaultId,
        name_encrypted: b64('Work'),
        sort_order: 0,
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    folderId = res.body.data.id;
  });

  it('rejects missing vault_id', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .post('/api/folders')
      .set(authCsrf(csrf))
      .send({ name_encrypted: b64('Bad') });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/folders', () => {
  it('lists folders with entry counts', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .get('/api/folders')
      .set(authCsrf(csrf));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('PUT /api/folders/:id', () => {
  it('renames a folder', async () => {
    if (!folderId) return;
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .put(`/api/folders/${folderId}`)
      .set(authCsrf(csrf))
      .send({ name_encrypted: b64('Personal') });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 for non-existent folder', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .put('/api/folders/00000000-0000-0000-0000-000000000099')
      .set(authCsrf(csrf))
      .send({ name_encrypted: b64('Nope') });
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/folders/reorder', () => {
  it('reorders folders', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .patch('/api/folders/reorder')
      .set(authCsrf(csrf))
      .send({ folders: [] });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/settings', () => {
  it('returns settings map', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .get('/api/settings')
      .set(authCsrf(csrf));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data).toBe('object');
  });
});

describe('PUT /api/settings', () => {
  it('upserts settings', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .put('/api/settings')
      .set(authCsrf(csrf))
      .send({ theme: 'dark', lang: 'en' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/audit', () => {
  it('returns audit log for user', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .get('/api/audit')
      .set(authCsrf(csrf));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(typeof res.body.data.total).toBe('number');
  });

  it('supports pagination', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .get('/api/audit?page=1&limit=10')
      .set(authCsrf(csrf));
    expect(res.status).toBe(200);
    expect(res.body.data.page).toBe(1);
    expect(res.body.data.limit).toBe(10);
  });
});

describe('DELETE /api/entries/:id', () => {
  it('soft-deletes an entry', async () => {
    if (!entryId) return;
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .delete(`/api/entries/${entryId}`)
      .set(authCsrf(csrf));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('DELETE /api/folders/:id', () => {
  it('deletes a folder and unlinks entries', async () => {
    if (!folderId) return;
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .delete(`/api/folders/${folderId}`)
      .set(authCsrf(csrf));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('Auth — authenticated route protection', () => {
  it('rejects requests without auth token', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .get('/api/vault')
      .set('Cookie', csrf.cookie)
      .set('x-csrf-token', csrf.token);
    expect(res.status).toBe(401);
  });

  it('rejects requests with invalid auth token', async () => {
    const app = createApp();
    const csrf = await getCsrf(app);
    const res = await request(app)
      .get('/api/vault')
      .set('Cookie', csrf.cookie)
      .set('x-csrf-token', csrf.token)
      .set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
  });
});
