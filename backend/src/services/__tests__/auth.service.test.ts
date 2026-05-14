import { initDb, closeDb, getDb } from '../../db/db';
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  deleteAccount,
} from '../auth.service';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const testDbPath = path.join(__dirname, '../../../test-data/auth-test.db');

function setupDb() {
  const dir = path.dirname(testDbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  try { closeDb(); } catch { /* ok */ }
  for (const f of [testDbPath, testDbPath + '-wal', testDbPath + '-shm']) {
    try { fs.unlinkSync(f); } catch { /* ok */ }
  }
  return initDb(testDbPath);
}

beforeEach(() => {
  setupDb();
});

afterAll(() => {
  try { closeDb(); } catch { /* ok */ }
  for (const f of [testDbPath, testDbPath + '-wal', testDbPath + '-shm']) {
    try { fs.unlinkSync(f); } catch { /* ok */ }
  }
});

const testEmail = 'test@vaultlock.com';
const testPw = 'StrongMasterP@ss1';

describe('AuthService — register', () => {
  it('registers a new user successfully', async () => {
    const result = await registerUser(testEmail, testPw);
    expect(result.success).toBe(true);
    expect(result.data!.userId).toBeDefined();
  });

  it('creates a default vault on registration', async () => {
    const result = await registerUser('vault-test@vaultlock.com', testPw);
    const db = getDb();
    const vaults = db.prepare('SELECT * FROM vaults WHERE user_id = ?').all(result.data!.userId);
    expect(vaults).toHaveLength(1);
  });

  it('rejects duplicate email', async () => {
    await registerUser(testEmail, testPw);
    const result = await registerUser(testEmail, testPw);
    expect(result.success).toBe(false);
    expect(result.error).toContain('already registered');
  });

  it('creates user even with empty email (validation at route level)', async () => {
    const result = await registerUser('', testPw);
    // Service just stores data; Zod validation happens at route level
    expect(result.success).toBe(true);
  });

  it('creates user with short password (validation at route level)', async () => {
    const result = await registerUser('short@pw.com', '1234567');
    expect(result.success).toBe(true);
  });

  const validEmails = ['a@b.co', 'user+tag@domain.com', 'test@sub.domain.com', 'x@y.z'];
  it.each(validEmails)('accepts valid email format: %s', async (email) => {
    const result = await registerUser(email, testPw);
    expect(result.success).toBe(true);
  });

  const invalidEmails = ['notanemail', '@no.com', 'no@', '', 'spaces @test.com'];
  it.each(invalidEmails)('registers any email (validation at route level): %s', async (email) => {
    const result = await registerUser(email, testPw);
    expect(result.success).toBe(true);
  });
});

describe('AuthService — login', () => {
  beforeEach(async () => {
    await registerUser(testEmail, testPw);
  });

  it('logs in with correct credentials', async () => {
    const result = await loginUser(testEmail, testPw);
    expect(result.success).toBe(true);
    expect(result.data!.token).toBeDefined();
    expect(result.data!.refreshToken).toBeDefined();
    expect(result.data!.userId).toBeDefined();
  });

  it('rejects wrong password', async () => {
    const result = await loginUser(testEmail, 'WrongPassword123!');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid');
  });

  it('rejects non-existent email', async () => {
    const result = await loginUser('nonexistent@test.com', testPw);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid');
  });

  it('updates last_login on success', async () => {
    const db = getDb();
    const before = db.prepare('SELECT last_login FROM users WHERE email = ?').get(testEmail) as any;
    expect(before.last_login).toBeNull();
    await loginUser(testEmail, testPw);
    const after = db.prepare('SELECT last_login FROM users WHERE email = ?').get(testEmail) as any;
    expect(after.last_login).toBeGreaterThan(0);
  });

  it('returns JWT containing userId and email', async () => {
    const result = await loginUser(testEmail, testPw);
    const decoded = JSON.parse(Buffer.from(result.data!.token.split('.')[1], 'base64').toString());
    expect(decoded.userId).toBeDefined();
    expect(decoded.email).toBe(testEmail);
  });

  it('returns different refresh tokens on each login', async () => {
    const r1 = await loginUser(testEmail, testPw);
    const r2 = await loginUser(testEmail, testPw);
    expect(r1.data!.refreshToken).not.toBe(r2.data!.refreshToken);
  });
});

describe('AuthService — refresh token', () => {
  let refreshToken: string;

  beforeEach(async () => {
    await registerUser(testEmail, testPw);
    const login = await loginUser(testEmail, testPw);
    refreshToken = login.data!.refreshToken;
  });

  it('returns new access token with valid refresh token', () => {
    const result = refreshAccessToken(refreshToken);
    expect(result.success).toBe(true);
    expect(result.data!.token).toBeDefined();
  });

  it('rotates the refresh token', () => {
    const r1 = refreshAccessToken(refreshToken);
    expect(r1.data!.refreshToken).toBeDefined();
    expect(r1.data!.refreshToken).not.toBe(refreshToken);
  });

  it('rejects revoked refresh token', () => {
    refreshAccessToken(refreshToken);
    const result = refreshAccessToken(refreshToken);
    expect(result.success).toBe(false);
  });

  it('rejects garbage refresh token', () => {
    const result = refreshAccessToken('this-is-not-a-valid-token');
    expect(result.success).toBe(false);
  });

  it('rejects empty refresh token', () => {
    const result = refreshAccessToken('');
    expect(result.success).toBe(false);
  });

  it('rejects expired-style token (never existed)', () => {
    const result = refreshAccessToken(uuidv4() + '-' + uuidv4() + '-bogus');
    expect(result.success).toBe(false);
  });
});

describe('AuthService — logout', () => {
  let refreshToken: string;

  beforeEach(async () => {
    await registerUser(testEmail, testPw);
    const login = await loginUser(testEmail, testPw);
    refreshToken = login.data!.refreshToken;
  });

  it('revokes the refresh token on logout', () => {
    const result = logoutUser(refreshToken);
    expect(result.success).toBe(true);
    const refreshResult = refreshAccessToken(refreshToken);
    expect(refreshResult.success).toBe(false);
  });

  it('succeeds even with unknown token', () => {
    const result = logoutUser('nonexistent-token');
    expect(result.success).toBe(true);
  });
});

describe('AuthService — account deletion', () => {
  let userId: string;

  beforeEach(async () => {
    const reg = await registerUser(testEmail, testPw);
    userId = reg.data!.userId;
  });

  it('deletes account with correct password', async () => {
    const result = await deleteAccount(userId, testPw);
    expect(result.success).toBe(true);
    const db = getDb();
    expect(db.prepare('SELECT * FROM users WHERE id = ?').get(userId)).toBeUndefined();
  });

  it('rejects deletion with wrong password', async () => {
    const result = await deleteAccount(userId, 'WrongPassword123!');
    expect(result.success).toBe(false);
    const db = getDb();
    expect(db.prepare('SELECT * FROM users WHERE id = ?').get(userId)).toBeDefined();
  });

  it('rejects deletion for non-existent user', async () => {
    const result = await deleteAccount(uuidv4(), testPw);
    expect(result.success).toBe(false);
  });

  it('removes all related data on deletion', async () => {
    const db = getDb();
    db.prepare('INSERT INTO audit_log (id, user_id, action, ip_address, user_agent, metadata, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(uuidv4(), userId, 'test', '', '', null, 1);
    await deleteAccount(userId, testPw);
    expect(db.prepare('SELECT COUNT(*) as c FROM audit_log WHERE user_id = ?').get(userId)).toEqual({ c: 0 });
  });
});

describe('AuthService — edge cases', () => {
  it('handles concurrent registration attempts', async () => {
    const results = await Promise.allSettled([
      registerUser('concurrent@test.com', testPw),
      registerUser('concurrent@test.com', testPw),
    ]);
    const successes = results.filter(
      r => r.status === 'fulfilled' && r.value.success,
    ).length;
    expect(successes).toBe(1);
  });

  it('handles password with unicode characters', async () => {
    const pw = '🔑密码パスワード123!';
    const reg = await registerUser('unicode@test.com', pw);
    expect(reg.success).toBe(true);
    const login = await loginUser('unicode@test.com', pw);
    expect(login.success).toBe(true);
  });

  it('handles very long email addresses', async () => {
    const longEmail = 'a'.repeat(64) + '@' + 'b'.repeat(60) + '.com';
    const reg = await registerUser(longEmail, testPw);
    expect(reg.success).toBe(true);
    if (reg.data?.userId) {
      const del = await deleteAccount(reg.data.userId, testPw);
      expect(del.success).toBe(true);
    }
  });

  it('handles maximum length password', async () => {
    const longPw = 'x'.repeat(256);
    const reg = await registerUser('longpw@test.com', longPw);
    expect(reg.success).toBe(true);
    const login = await loginUser('longpw@test.com', longPw);
    expect(login.success).toBe(true);
  });
});

describe('AuthService — TOTP via db direct', () => {
  it('stores and reads totp_secret', async () => {
    const reg = await registerUser('totp-test@test.com', testPw);
    const db = getDb();
    const secret = crypto.randomBytes(20).toString('base64');
    db.prepare('UPDATE users SET totp_secret = ? WHERE id = ?').run(secret, reg.data!.userId);
    const user = db.prepare('SELECT totp_secret FROM users WHERE id = ?').get(reg.data!.userId) as any;
    expect(user.totp_secret).toBe(secret);
  });

  it('can clear totp_secret', async () => {
    const reg = await registerUser('totp-clear@test.com', testPw);
    const db = getDb();
    db.prepare('UPDATE users SET totp_secret = ? WHERE id = ?').run('somescret', reg.data!.userId);
    db.prepare('UPDATE users SET totp_secret = NULL WHERE id = ?').run(reg.data!.userId);
    const user = db.prepare('SELECT totp_secret FROM users WHERE id = ?').get(reg.data!.userId) as any;
    expect(user.totp_secret).toBeNull();
  });
});

describe('AuthService — JWT token validation', () => {
  it('generates a valid JWT that can be decoded', async () => {
    await registerUser('jwt-test@test.com', testPw);
    const login = await loginUser('jwt-test@test.com', testPw);
    const parts = login.data!.token.split('.');
    expect(parts).toHaveLength(3);
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    expect(payload.email).toBe('jwt-test@test.com');
  });

  it('JWT expires_in matches config (15m = 900s)', () => {
    const { config } = require('../../utils/config');
    expect(config.jwtExpiresIn).toBe('15m');
  });
});
