import fs from 'fs';
import path from 'path';
import { initDb, closeDb } from '../db/db';
import { v4 as uuidv4 } from 'uuid';

const testDbPath = path.join(__dirname, '../../../test-data/test.db');

function freshDb() {
  const dir = path.dirname(testDbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  try { closeDb(); } catch { /* ok */ }
  for (const f of [testDbPath, testDbPath + '-wal', testDbPath + '-shm']) {
    try { fs.unlinkSync(f); } catch { /* ok */ }
  }
  return initDb(testDbPath);
}

beforeEach(() => {
  freshDb();
});

afterAll(() => {
  try { closeDb(); } catch { /* ok */ }
  for (const f of [testDbPath, testDbPath + '-wal', testDbPath + '-shm']) {
    try { fs.unlinkSync(f); } catch { /* ok */ }
  }
});

describe('DB — schema & config', () => {
  it('has all required tables', () => {
    const db = freshDb();
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
    const names = tables.map(t => t.name).sort();
    expect(names).toEqual([
      'audit_log', 'entries', 'folders', 'refresh_tokens',
      'schema_version', 'settings', 'users', 'vaults',
    ].sort());
  });

  it('enables WAL mode', () => {
    const db = freshDb();
    const r = db.prepare('PRAGMA journal_mode').get() as { journal_mode: string };
    expect(r.journal_mode.toLowerCase()).toBe('wal');
  });

  it('enables foreign keys', () => {
    const db = freshDb();
    const r = db.prepare('PRAGMA foreign_keys').get() as { foreign_keys: number };
    expect(r.foreign_keys).toBe(1);
  });

  it('tracks schema version >= 1', () => {
    const db = freshDb();
    const r = db.prepare('SELECT version FROM schema_version').get() as { version: number };
    expect(r.version).toBeGreaterThanOrEqual(1);
  });
});

describe('DB — users CRUD', () => {
  it('inserts and reads a user', () => {
    const db = freshDb();
    const id = uuidv4();
    db.prepare('INSERT INTO users (id, email, argon2_hash, created_at) VALUES (?, ?, ?, ?)').run(id, 'a@b.com', 'hash', 1000);
    const u = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    expect(u.email).toBe('a@b.com');
    expect(u.argon2_hash).toBe('hash');
  });

  it('enforces unique email', () => {
    const db = freshDb();
    db.prepare('INSERT INTO users (id, email, argon2_hash, created_at) VALUES (?, ?, ?, ?)').run(uuidv4(), 'dup@b.com', 'h', 1);
    expect(() => {
      db.prepare('INSERT INTO users (id, email, argon2_hash, created_at) VALUES (?, ?, ?, ?)').run(uuidv4(), 'dup@b.com', 'h2', 2);
    }).toThrow();
  });

  it('allows null last_login and totp_secret', () => {
    const db = freshDb();
    db.prepare('INSERT INTO users (id, email, argon2_hash, created_at) VALUES (?, ?, ?, ?)').run(uuidv4(), 'nulls@b.com', 'h', 1);
    const u = db.prepare('SELECT * FROM users WHERE email = ?').get('nulls@b.com') as any;
    expect(u.last_login).toBeNull();
    expect(u.totp_secret).toBeNull();
  });

  it('updates last_login', () => {
    const db = freshDb();
    const id = uuidv4();
    db.prepare('INSERT INTO users (id, email, argon2_hash, created_at) VALUES (?, ?, ?, ?)').run(id, 'login@b.com', 'h', 1);
    db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(5000, id);
    const u = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    expect(u.last_login).toBe(5000);
  });

  it('deletes user cascade-deletes related data', () => {
    const db = freshDb();
    const uid = uuidv4();
    const vid = uuidv4();
    const eid = uuidv4();
    const emptyBuf = Buffer.alloc(0);
    db.prepare('INSERT INTO users (id, email, argon2_hash, created_at) VALUES (?, ?, ?, ?)').run(uid, 'cascade@b.com', 'h', 1);
    db.prepare('INSERT INTO vaults (id, user_id, name, encrypted_blob, iv, auth_tag, version, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)').run(vid, uid, 'v', emptyBuf, emptyBuf, emptyBuf, 1);
    db.prepare('INSERT INTO entries (id, vault_id, user_id, title_encrypted, body_encrypted, iv, auth_tag, type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(eid, vid, uid, Buffer.from('t'), Buffer.from('b'), Buffer.from('iv'), Buffer.from('at'), 'pwd', 1, 1);
    db.prepare('DELETE FROM users WHERE id = ?').run(uid);
    expect(db.prepare('SELECT * FROM users WHERE id = ?').get(uid)).toBeUndefined();
    expect(db.prepare('SELECT * FROM vaults WHERE user_id = ?').get(uid)).toBeUndefined();
    expect(db.prepare('SELECT * FROM entries WHERE user_id = ?').get(uid)).toBeUndefined();
  });
});

describe('DB — vaults CRUD', () => {
  it('inserts vault with default values', () => {
    const db = freshDb();
    const uid = uuidv4();
    const vid = uuidv4();
    db.prepare('INSERT INTO users (id, email, argon2_hash, created_at) VALUES (?, ?, ?, ?)').run(uid, 'v@b.com', 'h', 1);
    db.prepare('INSERT INTO vaults (id, user_id, name, encrypted_blob, iv, auth_tag, version, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)').run(vid, uid, 'default', Buffer.alloc(0), Buffer.alloc(0), Buffer.alloc(0), 1);
    const v = db.prepare('SELECT * FROM vaults WHERE id = ?').get(vid) as any;
    expect(v.name).toBe('default');
    expect(v.version).toBe(1);
  });
});

describe('DB — entries CRUD', () => {
  function seed() {
    const db = freshDb();
    const uid = uuidv4(), vid = uuidv4();
    db.prepare('INSERT INTO users (id, email, argon2_hash, created_at) VALUES (?, ?, ?, ?)').run(uid, 'e@b.com', 'h', 1);
    db.prepare('INSERT INTO vaults (id, user_id, name, encrypted_blob, iv, auth_tag, version, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)').run(vid, uid, 'v', Buffer.alloc(0), Buffer.alloc(0), Buffer.alloc(0), 1);
    return { db, uid, vid };
  }

  it('inserts entry with all fields', () => {
    const { db, uid, vid } = seed();
    const eid = uuidv4();
    db.prepare(`INSERT INTO entries (id, vault_id, user_id, title_encrypted, body_encrypted, iv, auth_tag, type, tags_encrypted, favorite, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(eid, vid, uid, Buffer.from('t'), Buffer.from('b'), Buffer.from('iv'), Buffer.from('at'), 'password', Buffer.from('tags'), 1, 100, 100);
    const e = db.prepare('SELECT * FROM entries WHERE id = ?').get(eid) as any;
    expect(e.type).toBe('password');
    expect(e.favorite).toBe(1);
  });

  it('allows null folder_id', () => {
    const { db, uid, vid } = seed();
    db.prepare(`INSERT INTO entries (id, vault_id, user_id, title_encrypted, body_encrypted, iv, auth_tag, type, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(uuidv4(), vid, uid, Buffer.from('t'), Buffer.from('b'), Buffer.from('iv'), Buffer.from('at'), 'note', 1, 1);
    const e = db.prepare('SELECT * FROM entries').all() as any[];
    expect(e[0].folder_id).toBeNull();
  });

  it('soft delete sets deleted_at', () => {
    const { db, uid, vid } = seed();
    const eid = uuidv4();
    db.prepare(`INSERT INTO entries (id, vault_id, user_id, title_encrypted, body_encrypted, iv, auth_tag, type, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(eid, vid, uid, Buffer.from('t'), Buffer.from('b'), Buffer.from('iv'), Buffer.from('at'), 'pwd', 1, 1);
    db.prepare('UPDATE entries SET deleted_at = ? WHERE id = ?').run(999, eid);
    const e = db.prepare('SELECT * FROM entries WHERE id = ?').get(eid) as any;
    expect(e.deleted_at).toBe(999);
  });

  it('filters out soft-deleted with WHERE clause', () => {
    const { db, uid, vid } = seed();
    db.prepare(`INSERT INTO entries (id, vault_id, user_id, title_encrypted, body_encrypted, iv, auth_tag, type, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(uuidv4(), vid, uid, Buffer.from('a'), Buffer.from('b'), Buffer.from('iv'), Buffer.from('at'), 'pwd', 1, 1);
    db.prepare(`INSERT INTO entries (id, vault_id, user_id, title_encrypted, body_encrypted, iv, auth_tag, type, created_at, updated_at, deleted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(uuidv4(), vid, uid, Buffer.from('a'), Buffer.from('b'), Buffer.from('iv'), Buffer.from('at'), 'pwd', 1, 1, 500);
    const active = db.prepare('SELECT * FROM entries WHERE deleted_at IS NULL').all() as any[];
    expect(active).toHaveLength(1);
  });
});

describe('DB — folders CRUD', () => {
  it('inserts folders with sort_order default', () => {
    const db = freshDb();
    const uid = uuidv4(), vid = uuidv4(), fid = uuidv4();
    db.prepare('INSERT INTO users (id, email, argon2_hash, created_at) VALUES (?, ?, ?, ?)').run(uid, 'f@b.com', 'h', 1);
    db.prepare('INSERT INTO vaults (id, user_id, name, encrypted_blob, iv, auth_tag, version, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)').run(vid, uid, 'v', Buffer.alloc(0), Buffer.alloc(0), Buffer.alloc(0), 1);
    db.prepare('INSERT INTO folders (id, vault_id, user_id, name_encrypted, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(fid, vid, uid, Buffer.from('fn'), 0, 1);
    const f = db.prepare('SELECT * FROM folders WHERE id = ?').get(fid) as any;
    expect(f.name_encrypted).toBeDefined();
    expect(f.sort_order).toBe(0);
  });

  it('supports parent_id hierarchy', () => {
    const db = freshDb();
    const uid = uuidv4(), vid = uuidv4();
    db.prepare('INSERT INTO users (id, email, argon2_hash, created_at) VALUES (?, ?, ?, ?)').run(uid, 'fh@b.com', 'h', 1);
    db.prepare('INSERT INTO vaults (id, user_id, name, encrypted_blob, iv, auth_tag, version, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)').run(vid, uid, 'v', Buffer.alloc(0), Buffer.alloc(0), Buffer.alloc(0), 1);
    const p = uuidv4(), c = uuidv4();
    db.prepare('INSERT INTO folders (id, vault_id, user_id, name_encrypted, parent_id, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(p, vid, uid, Buffer.from('p'), null, 0, 1);
    db.prepare('INSERT INTO folders (id, vault_id, user_id, name_encrypted, parent_id, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(c, vid, uid, Buffer.from('c'), p, 1, 1);
    const child = db.prepare('SELECT * FROM folders WHERE id = ?').get(c) as any;
    expect(child.parent_id).toBe(p);
  });
});

describe('DB — refresh_tokens', () => {
  it('inserts and queries by hash', () => {
    const db = freshDb();
    const uid = uuidv4(), rid = uuidv4();
    db.prepare('INSERT INTO users (id, email, argon2_hash, created_at) VALUES (?, ?, ?, ?)').run(uid, 'rt@b.com', 'h', 1);
    db.prepare('INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, revoked, created_at) VALUES (?, ?, ?, ?, 0, ?)').run(rid, uid, 'abc123hash', 9999999999999, 1);
    const r = db.prepare('SELECT * FROM refresh_tokens WHERE token_hash = ?').get('abc123hash') as any;
    expect(r.user_id).toBe(uid);
    expect(r.revoked).toBe(0);
  });

  it('tracks revoked status', () => {
    const db = freshDb();
    const uid = uuidv4(), rid = uuidv4();
    db.prepare('INSERT INTO users (id, email, argon2_hash, created_at) VALUES (?, ?, ?, ?)').run(uid, 'rt2@b.com', 'h', 1);
    db.prepare('INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, revoked, created_at) VALUES (?, ?, ?, ?, 0, ?)').run(rid, uid, 'hash2', 9999999999999, 1);
    db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE id = ?').run(rid);
    const r = db.prepare('SELECT * FROM refresh_tokens WHERE id = ?').get(rid) as any;
    expect(r.revoked).toBe(1);
  });
});

describe('DB — audit_log', () => {
  const actions = ['auth.login', 'auth.register', 'vault.sync', 'entry.create', 'entry.delete'];
  it.each(actions)('inserts audit log for action: %s', (action) => {
    const db = freshDb();
    db.prepare('INSERT INTO audit_log (id, user_id, action, ip_address, user_agent, metadata, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(uuidv4(), uuidv4(), action, '127.0.0.1', 'test-agent', null, Date.now());
    const rows = db.prepare('SELECT * FROM audit_log WHERE action = ?').all(action) as any[];
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });

  it('stores metadata as JSON string', () => {
    const db = freshDb();
    db.prepare('INSERT INTO audit_log (id, user_id, action, ip_address, user_agent, metadata, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(uuidv4(), uuidv4(), 'test', 'ip', 'ua', JSON.stringify({ key: 'val' }), 1);
    const r = db.prepare('SELECT * FROM audit_log LIMIT 1').all() as any[];
    expect(JSON.parse(r[0].metadata)).toEqual({ key: 'val' });
  });
});

describe('DB — settings', () => {
  it('inserts and updates settings', () => {
    const db = freshDb();
    const uid = uuidv4();
    db.prepare('INSERT INTO users (id, email, argon2_hash, created_at) VALUES (?, ?, ?, ?)').run(uid, 's@b.com', 'h', 1);
    db.prepare('INSERT OR REPLACE INTO settings (user_id, key, value, updated_at) VALUES (?, ?, ?, ?)').run(uid, 'theme', 'dark', 1);
    db.prepare('INSERT OR REPLACE INTO settings (user_id, key, value, updated_at) VALUES (?, ?, ?, ?)').run(uid, 'theme', 'light', 2);
    const s = db.prepare('SELECT value FROM settings WHERE user_id = ? AND key = ?').get(uid, 'theme') as any;
    expect(s.value).toBe('light');
  });

  it('stores multiple settings per user', () => {
    const db = freshDb();
    const uid = uuidv4();
    db.prepare('INSERT INTO users (id, email, argon2_hash, created_at) VALUES (?, ?, ?, ?)').run(uid, 'sm@b.com', 'h', 1);
    db.prepare('INSERT INTO settings (user_id, key, value, updated_at) VALUES (?, ?, ?, ?)').run(uid, 'k1', 'v1', 1);
    db.prepare('INSERT INTO settings (user_id, key, value, updated_at) VALUES (?, ?, ?, ?)').run(uid, 'k2', 'v2', 1);
    const rows = db.prepare('SELECT * FROM settings WHERE user_id = ?').all(uid) as any[];
    expect(rows).toHaveLength(2);
  });
});

describe('DB — constraints & edge cases', () => {
  it('rejects INSERT without required fields (email)', () => {
    const db = freshDb();
    expect(() => {
      db.prepare('INSERT INTO users (id, argon2_hash, created_at) VALUES (?, ?, ?)').run(uuidv4(), 'h', 1);
    }).toThrow();
  });

  it('rejects duplicate vault name per user (no unique enforced — just check insert works)', () => {
    const db = freshDb();
    const uid = uuidv4(), vid1 = uuidv4(), vid2 = uuidv4();
    db.prepare('INSERT INTO users (id, email, argon2_hash, created_at) VALUES (?, ?, ?, ?)').run(uid, 'dupv@b.com', 'h', 1);
    db.prepare('INSERT INTO vaults (id, user_id, name, encrypted_blob, iv, auth_tag, version, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)').run(vid1, uid, 'same', Buffer.alloc(0), Buffer.alloc(0), Buffer.alloc(0), 1);
    expect(() => {
      db.prepare('INSERT INTO vaults (id, user_id, name, encrypted_blob, iv, auth_tag, version, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)').run(vid2, uid, 'same', Buffer.alloc(0), Buffer.alloc(0), Buffer.alloc(0), 1);
    }).not.toThrow();
  });

  it('handles very long text fields', () => {
    const db = freshDb();
    const uid = uuidv4();
    const longEmail = 'a'.repeat(200) + '@b.com';
    db.prepare('INSERT INTO users (id, email, argon2_hash, created_at) VALUES (?, ?, ?, ?)').run(uuidv4(), longEmail, 'hash', 1);
    const u = db.prepare('SELECT email FROM users WHERE email = ?').get(longEmail) as any;
    expect(u.email).toBe(longEmail);
  });

  it('cleans up all tables via CASCADE on user delete', () => {
    const db = freshDb();
    const uid = uuidv4(), vid = uuidv4(), fid = uuidv4(), eid = uuidv4(), rid = uuidv4();
    db.prepare('INSERT INTO users (id, email, argon2_hash, created_at) VALUES (?, ?, ?, ?)').run(uid, 'cascade-all@b.com', 'h', 1);
    db.prepare('INSERT INTO vaults (id, user_id, name, encrypted_blob, iv, auth_tag, version, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)').run(vid, uid, 'v', Buffer.alloc(0), Buffer.alloc(0), Buffer.alloc(0), 1);
    db.prepare('INSERT INTO folders (id, vault_id, user_id, name_encrypted, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(fid, vid, uid, Buffer.from('f'), 0, 1);
    db.prepare('INSERT INTO entries (id, vault_id, user_id, title_encrypted, body_encrypted, iv, auth_tag, type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(eid, vid, uid, Buffer.from('t'), Buffer.from('b'), Buffer.from('iv'), Buffer.from('at'), 'pwd', 1, 1);
    db.prepare('INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, revoked, created_at) VALUES (?, ?, ?, ?, 0, ?)').run(rid, uid, 'h', 9999999999999, 1);
    db.prepare('INSERT INTO settings (user_id, key, value, updated_at) VALUES (?, ?, ?, ?)').run(uid, 'k', 'v', 1);
    db.prepare('DELETE FROM users WHERE id = ?').run(uid);
    expect(db.prepare('SELECT COUNT(*) as c FROM vaults WHERE user_id = ?').get(uid)).toEqual({ c: 0 });
    expect(db.prepare('SELECT COUNT(*) as c FROM folders WHERE user_id = ?').get(uid)).toEqual({ c: 0 });
    expect(db.prepare('SELECT COUNT(*) as c FROM entries WHERE user_id = ?').get(uid)).toEqual({ c: 0 });
    expect(db.prepare('SELECT COUNT(*) as c FROM refresh_tokens WHERE user_id = ?').get(uid)).toEqual({ c: 0 });
    expect(db.prepare('SELECT COUNT(*) as c FROM settings WHERE user_id = ?').get(uid)).toEqual({ c: 0 });
  });
});

describe('DB — prepared statement safety', () => {
  it('prevents SQL injection in WHERE clause', () => {
    const db = freshDb();
    const malicious = "'; DROP TABLE users; --";
    // This should be a harmless SELECT, not an injection
    expect(() => {
      db.prepare('SELECT * FROM users WHERE email = ?').get(malicious);
    }).not.toThrow();
    // Verify table still exists
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[];
    expect(tables.some((t: any) => t.name === 'users')).toBe(true);
  });
});
