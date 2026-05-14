import { initDb, closeDb, getDb } from '../../db/db';
import {
  getEntries,
  getEntryById,
  createEntry,
  updateEntry,
  deleteEntry,
  bulkDeleteEntries,
  toggleFavorite,
  moveEntry,
  syncEntries,
} from '../entry.service';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const testDbPath = path.join(__dirname, '../../../test-data/entry-test.db');

function seedUserAndVault() {
  const db = getDb();
  const uid = uuidv4(), vid = uuidv4();
  db.prepare('INSERT INTO users (id, email, argon2_hash, created_at) VALUES (?, ?, ?, ?)').run(uid, 'entry-test@test.com', 'hash', 1);
  const emptyBuf = Buffer.alloc(0);
  db.prepare('INSERT INTO vaults (id, user_id, name, encrypted_blob, iv, auth_tag, version, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)').run(vid, uid, 'default', emptyBuf, emptyBuf, emptyBuf, 1);
  return { uid, vid };
}

function makeEntry(overrides: Record<string, any> = {}) {
  return {
    vault_id: overrides.vid,
    user_id: overrides.uid,
    folder_id: overrides.folder_id ?? null,
    title_encrypted: Buffer.from('title-' + (overrides.idx || '0')),
    body_encrypted: Buffer.from('body-' + (overrides.idx || '0')),
    iv: Buffer.from('iv-' + (overrides.idx || '0')),
    auth_tag: Buffer.from('at-' + (overrides.idx || '0')),
    type: overrides.type || 'password',
    tags_encrypted: overrides.tags ? Buffer.from(overrides.tags) : null,
    favorite: overrides.fav || 0,
  };
}

beforeEach(() => {
  const dir = path.dirname(testDbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  try { closeDb(); } catch { /* ok */ }
  for (const f of [testDbPath, testDbPath + '-wal', testDbPath + '-shm']) {
    try { fs.unlinkSync(f); } catch { /* ok */ }
  }
  initDb(testDbPath);
});

afterAll(() => {
  try { closeDb(); } catch { /* ok */ }
  for (const f of [testDbPath, testDbPath + '-wal', testDbPath + '-shm']) {
    try { fs.unlinkSync(f); } catch { /* ok */ }
  }
});

describe('EntryService — create', () => {
  it('creates a basic entry', () => {
    const { uid, vid } = seedUserAndVault();
    const entry = createEntry(makeEntry({ uid, vid }));
    expect(entry.id).toBeDefined();
    expect(entry.title_encrypted).toBeDefined();
    expect(entry.type).toBe('password');
    expect(entry.favorite).toBe(0);
  });

  it('creates entry with all optional fields', () => {
    const { uid, vid } = seedUserAndVault();
    const entry = createEntry(makeEntry({ uid, vid, type: 'note', tags: '["tag1"]', fav: 1 }));
    expect(entry.type).toBe('note');
    expect(entry.favorite).toBe(1);
  });

  it('creates entry with folder_id', () => {
    const { uid, vid } = seedUserAndVault();
    const db = getDb();
    const fid = uuidv4();
    db.prepare('INSERT INTO folders (id, vault_id, user_id, name_encrypted, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(fid, vid, uid, Buffer.from('folder'), 0, 1);
    const entry = createEntry(makeEntry({ uid, vid, folder_id: fid }));
    expect(entry.folder_id).toBe(fid);
  });

  it('sets timestamps on creation', () => {
    const { uid, vid } = seedUserAndVault();
    const before = Date.now();
    const entry = createEntry(makeEntry({ uid, vid }));
    const after = Date.now();
    expect(entry.created_at).toBeGreaterThanOrEqual(before);
    expect(entry.created_at).toBeLessThanOrEqual(after);
    expect(entry.updated_at).toBe(entry.created_at);
  });

  const types = ['password', 'note', 'credit-card', 'identity', 'bank-account', 'document', 'api-key', 'database', 'email', 'wifi'];
  it.each(types)('creates entry of type: %s', (type) => {
    const { uid, vid } = seedUserAndVault();
    const entry = createEntry(makeEntry({ uid, vid, type }));
    expect(entry.type).toBe(type);
  });
});

describe('EntryService — read', () => {
  it('returns empty array when no entries', () => {
    const { uid, vid } = seedUserAndVault();
    const entries = getEntries(uid);
    expect(entries).toEqual([]);
  });

  it('lists all entries for a user', () => {
    const { uid, vid } = seedUserAndVault();
    createEntry(makeEntry({ uid, vid, idx: '1' }));
    createEntry(makeEntry({ uid, vid, idx: '2' }));
    const entries = getEntries(uid);
    expect(entries).toHaveLength(2);
  });

  it('does not return other users entries', () => {
    const { uid, vid } = seedUserAndVault();
    createEntry(makeEntry({ uid, vid }));
    const otherUid = uuidv4();
    const entries = getEntries(otherUid);
    expect(entries).toEqual([]);
  });

  it('gets single entry by id', () => {
    const { uid, vid } = seedUserAndVault();
    const created = createEntry(makeEntry({ uid, vid }));
    const found = getEntryById(created.id, uid);
    expect(found).toBeDefined();
    expect(found!.id).toBe(created.id);
  });

  it('returns undefined for non-existent entry', () => {
    const { uid } = seedUserAndVault();
    const found = getEntryById(uuidv4(), uid);
    expect(found).toBeUndefined();
  });

  it('does not return soft-deleted entries', () => {
    const { uid, vid } = seedUserAndVault();
    const entry = createEntry(makeEntry({ uid, vid }));
    deleteEntry(entry.id, uid);
    const entries = getEntries(uid);
    expect(entries).toHaveLength(0);
  });
});

describe('EntryService — update', () => {
  it('updates entry fields', () => {
    const { uid, vid } = seedUserAndVault();
    const entry = createEntry(makeEntry({ uid, vid }));
    const result = updateEntry(entry.id, uid, {
      title_encrypted: Buffer.from('new-title'),
      body_encrypted: Buffer.from('new-body'),
    });
    expect(result.success).toBe(true);
    expect(result.data!.title_encrypted).toBeDefined();
  });

  it('updates updated_at timestamp', () => {
    const { uid, vid } = seedUserAndVault();
    const entry = createEntry(makeEntry({ uid, vid }));
    const before = entry.updated_at;
    const result = updateEntry(entry.id, uid, { type: 'note' });
    expect(result.data!.updated_at).toBeGreaterThanOrEqual(before);
  });

  it('returns error for non-existent entry', () => {
    const { uid } = seedUserAndVault();
    const result = updateEntry(uuidv4(), uid, { type: 'note' });
    expect(result.success).toBe(false);
  });
});

describe('EntryService — delete', () => {
  it('soft deletes an entry', () => {
    const { uid, vid } = seedUserAndVault();
    const entry = createEntry(makeEntry({ uid, vid }));
    const result = deleteEntry(entry.id, uid);
    expect(result.success).toBe(true);
    expect(getEntryById(entry.id, uid)).toBeUndefined();
  });

  it('returns error for non-existent entry', () => {
    const { uid } = seedUserAndVault();
    const result = deleteEntry(uuidv4(), uid);
    expect(result.success).toBe(false);
  });

  it('prevents double-delete', () => {
    const { uid, vid } = seedUserAndVault();
    const entry = createEntry(makeEntry({ uid, vid }));
    deleteEntry(entry.id, uid);
    const result = deleteEntry(entry.id, uid);
    expect(result.success).toBe(false);
  });
});

describe('EntryService — bulk delete', () => {
  it('deletes multiple entries at once', () => {
    const { uid, vid } = seedUserAndVault();
    const e1 = createEntry(makeEntry({ uid, vid }));
    const e2 = createEntry(makeEntry({ uid, vid }));
    const result = bulkDeleteEntries([e1.id, e2.id], uid);
    expect(result.success).toBe(true);
    expect(getEntries(uid)).toHaveLength(0);
  });

  it('succeeds with empty array', () => {
    const { uid } = seedUserAndVault();
    const result = bulkDeleteEntries([], uid);
    expect(result.success).toBe(true);
  });

  it('ignores non-existent IDs', () => {
    const { uid } = seedUserAndVault();
    const result = bulkDeleteEntries([uuidv4()], uid);
    expect(result.success).toBe(true);
  });
});

describe('EntryService — favorite', () => {
  it('toggles favorite from 0 to 1', () => {
    const { uid, vid } = seedUserAndVault();
    const entry = createEntry(makeEntry({ uid, vid, fav: 0 }));
    const result = toggleFavorite(entry.id, uid);
    expect(result.success).toBe(true);
    expect(result.data!.favorite).toBe(1);
  });

  it('toggles favorite from 1 to 0', () => {
    const { uid, vid } = seedUserAndVault();
    const entry = createEntry(makeEntry({ uid, vid, fav: 1 }));
    const result = toggleFavorite(entry.id, uid);
    expect(result.data!.favorite).toBe(0);
  });

  it('returns error for non-existent entry', () => {
    const { uid } = seedUserAndVault();
    const result = toggleFavorite(uuidv4(), uid);
    expect(result.success).toBe(false);
  });
});

describe('EntryService — move', () => {
  it('moves entry to a folder', () => {
    const { uid, vid } = seedUserAndVault();
    const db = getDb();
    const fid = uuidv4();
    db.prepare('INSERT INTO folders (id, vault_id, user_id, name_encrypted, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(fid, vid, uid, Buffer.from('f'), 0, 1);
    const entry = createEntry(makeEntry({ uid, vid }));
    const result = moveEntry(entry.id, uid, fid);
    expect(result.success).toBe(true);
    expect(result.data!.folder_id).toBe(fid);
  });

  it('moves entry to root (null folder)', () => {
    const { uid, vid } = seedUserAndVault();
    const entry = createEntry(makeEntry({ uid, vid }));
    moveEntry(entry.id, uid, null);
    const updated = getEntryById(entry.id, uid);
    expect(updated!.folder_id).toBeNull();
  });

  it('returns error for non-existent entry', () => {
    const { uid } = seedUserAndVault();
    const result = moveEntry(uuidv4(), uid, null);
    expect(result.success).toBe(false);
  });
});

describe('EntryService — sync', () => {
  it('returns entries modified after lastSyncAt', () => {
    const { uid, vid } = seedUserAndVault();
    createEntry(makeEntry({ uid, vid }));
    const result = syncEntries(uid, { lastSyncAt: 0, deletedIds: [] });
    expect(result.success).toBe(true);
    expect(result.data!.entries).toHaveLength(1);
    expect(result.data!.syncAt).toBeGreaterThan(0);
  });

  it('returns empty list when no new entries', () => {
    const { uid, vid } = seedUserAndVault();
    createEntry(makeEntry({ uid, vid }));
    const future = Date.now() + 100000;
    const result = syncEntries(uid, { lastSyncAt: future, deletedIds: [] });
    expect(result.data!.entries).toHaveLength(0);
  });

  it('includes folders in sync response', () => {
    const { uid, vid } = seedUserAndVault();
    const db = getDb();
    db.prepare('INSERT INTO folders (id, vault_id, user_id, name_encrypted, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(uuidv4(), vid, uid, Buffer.from('f'), 0, 1);
    const result = syncEntries(uid, { lastSyncAt: 0, deletedIds: [] });
    expect(result.data!.folders).toHaveLength(1);
  });

  it('returns empty sync data for non-existent user', () => {
    const result = syncEntries(uuidv4(), { lastSyncAt: 0, deletedIds: [] });
    expect(result.data!.entries).toHaveLength(0);
  });
});

describe('EntryService — edge cases', () => {
  it('handles entries with different vault_ids', () => {
    const { uid, vid } = seedUserAndVault();
    const vid2 = uuidv4();
    const db = getDb();
    const emptyBuf = Buffer.alloc(0);
    db.prepare('INSERT INTO vaults (id, user_id, name, encrypted_blob, iv, auth_tag, version, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)').run(vid2, uid, 'v2', emptyBuf, emptyBuf, emptyBuf, 1);
    createEntry(makeEntry({ uid, vid }));
    createEntry(makeEntry({ uid, vid: vid2 }));
    expect(getEntries(uid)).toHaveLength(2);
  });

  it('handles large number of entries', () => {
    const { uid, vid } = seedUserAndVault();
    for (let i = 0; i < 50; i++) {
      createEntry(makeEntry({ uid, vid, idx: String(i) }));
    }
    expect(getEntries(uid)).toHaveLength(50);
  });

  it('returns entries sorted by created_at DESC', () => {
    const { uid, vid } = seedUserAndVault();
    const times: number[] = [];
    for (let i = 0; i < 5; i++) {
      const e = createEntry(makeEntry({ uid, vid, idx: String(i) }));
      times.push(e.created_at);
    }
    const entries = getEntries(uid);
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i - 1].created_at).toBeGreaterThanOrEqual(entries[i].created_at);
    }
  });
});
