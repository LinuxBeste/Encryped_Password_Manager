import { initDb, closeDb, getDb } from '../../db/db';
import { getVault, exportVault } from '../vault.service';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const testDbPath = path.join(__dirname, '../../../test-data/vault-test.db');

// Seeds test data: one user, one vault, two entries
function seed() {
  const db = getDb();
  const uid = uuidv4(), vid = uuidv4();
  db.prepare('INSERT INTO users (id, email, argon2_hash, created_at) VALUES (?, ?, ?, ?)').run(uid, 'vault-test@test.com', 'hash', 1);
  const emptyBuf = Buffer.alloc(0);
  db.prepare('INSERT INTO vaults (id, user_id, name, encrypted_blob, iv, auth_tag, version, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)').run(vid, uid, 'default', emptyBuf, emptyBuf, emptyBuf, 1);
  db.prepare('INSERT INTO entries (id, vault_id, user_id, title_encrypted, body_encrypted, iv, auth_tag, type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(uuidv4(), vid, uid, Buffer.from('t1'), Buffer.from('b1'), Buffer.from('iv'), Buffer.from('at'), 'password', 1, 1);
  db.prepare('INSERT INTO entries (id, vault_id, user_id, title_encrypted, body_encrypted, iv, auth_tag, type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(uuidv4(), vid, uid, Buffer.from('t2'), Buffer.from('b2'), Buffer.from('iv'), Buffer.from('at'), 'note', 1, 1);
  return { uid, vid };
}

// Sets up a fresh test database before each test
beforeEach(() => {
  const dir = path.dirname(testDbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  try { closeDb(); } catch { /* ok */ }
  for (const f of [testDbPath, testDbPath + '-wal', testDbPath + '-shm']) {
    try { fs.unlinkSync(f); } catch { /* ok */ }
  }
  initDb(testDbPath);
});

// Cleans up test database files after all tests
afterAll(() => {
  try { closeDb(); } catch { /* ok */ }
  for (const f of [testDbPath, testDbPath + '-wal', testDbPath + '-shm']) {
    try { fs.unlinkSync(f); } catch { /* ok */ }
  }
});

describe('VaultService — getVault', () => {
  it('returns vault and entries for user', () => {
    const { uid } = seed();
    const result = getVault(uid);
    expect(result.success).toBe(true);
    expect(result.data!.vault).toBeDefined();
    expect(result.data!.entries).toHaveLength(2);
  });

  it('returns null vault for user with no vault', () => {
    const result = getVault(uuidv4());
    expect(result.data!.vault).toBeNull();
    expect(result.data!.entries).toEqual([]);
  });

  it('excludes soft-deleted entries', () => {
    const { uid } = seed();
    const db = getDb();
    const entry = db.prepare('SELECT id FROM entries WHERE user_id = ? LIMIT 1').get(uid) as any;
    db.prepare('UPDATE entries SET deleted_at = ? WHERE id = ?').run(Date.now(), entry.id);
    const result = getVault(uid);
    expect(result.data!.entries).toHaveLength(1);
  });

  it('returns metadata fields for entries (no encrypted bodies)', () => {
    const { uid } = seed();
    const result = getVault(uid);
    for (const e of result.data!.entries) {
      expect(e.title_encrypted).toBeDefined();
      expect(e.type).toBeDefined();
      expect(e.favorite).toBeDefined();
      expect(e.created_at).toBeDefined();
    }
  });

  it('handles user with many entries', () => {
    const db = getDb();
    const { uid, vid } = seed();
    for (let i = 0; i < 25; i++) {
      db.prepare('INSERT INTO entries (id, vault_id, user_id, title_encrypted, body_encrypted, iv, auth_tag, type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(uuidv4(), vid, uid, Buffer.from('t'), Buffer.from('b'), Buffer.from('iv'), Buffer.from('at'), 'password', 1, 1);
    }
    const result = getVault(uid);
    expect(result.data!.entries).toHaveLength(27);
  });
});

describe('VaultService — export', () => {
  it('exports vault, entries, and folders', () => {
    const { uid, vid } = seed();
    const db = getDb();
    db.prepare('INSERT INTO folders (id, vault_id, user_id, name_encrypted, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(uuidv4(), vid, uid, Buffer.from('f'), 0, 1);
    const result = exportVault(uid);
    expect(result.success).toBe(true);
    const d = result.data as any;
    expect(d.vault).toBeDefined();
    expect(d.entries).toHaveLength(2);
    expect(d.folders).toHaveLength(1);
    expect(d.exportedAt).toBeGreaterThan(0);
  });

  it('returns empty export for new user with no data', () => {
    const db = getDb();
    const uid = uuidv4();
    db.prepare('INSERT INTO users (id, email, argon2_hash, created_at) VALUES (?, ?, ?, ?)').run(uid, 'empty@test.com', 'hash', 1);
    const result = exportVault(uid);
    const d = result.data as any;
    expect(d.vault).toBeUndefined();
    expect(d.entries).toEqual([]);
  });

  it('excludes soft-deleted entries from export', () => {
    const { uid } = seed();
    const db = getDb();
    const entry = db.prepare('SELECT id FROM entries WHERE user_id = ? LIMIT 1').get(uid) as any;
    db.prepare('UPDATE entries SET deleted_at = ? WHERE id = ?').run(Date.now(), entry.id);
    const result = exportVault(uid);
    expect((result.data as any).entries).toHaveLength(1);
  });

  it('includes complete entry data (not just metadata)', () => {
    const { uid } = seed();
    const result = exportVault(uid);
    for (const e of (result.data as any).entries) {
      expect(e.body_encrypted).toBeDefined();
      expect(e.iv).toBeDefined();
      expect(e.auth_tag).toBeDefined();
    }
  });
});
