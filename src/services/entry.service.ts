import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/db';
import { Entry, ApiResponse, SyncRequest, SyncResponse } from '../types';

export function getEntries(userId: string): Entry[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, vault_id, folder_id, user_id, title_encrypted, body_encrypted, iv, auth_tag,
              type, tags_encrypted, favorite, created_at, updated_at
       FROM entries
       WHERE user_id = ? AND deleted_at IS NULL
       ORDER BY created_at DESC`,
    )
    .all(userId) as Entry[];
}

export function getEntryById(entryId: string, userId: string): Entry | undefined {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM entries WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
    )
    .get(entryId, userId) as Entry | undefined;
}

export function createEntry(
  data: Omit<Entry, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>,
): Entry {
  const db = getDb();
  const id = uuidv4();
  const now = Date.now();

  db.prepare(
    `INSERT INTO entries (id, vault_id, folder_id, user_id, title_encrypted, body_encrypted,
      iv, auth_tag, type, tags_encrypted, favorite, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    data.vault_id,
    data.folder_id || null,
    data.user_id,
    data.title_encrypted,
    data.body_encrypted,
    data.iv,
    data.auth_tag,
    data.type || 'password',
    data.tags_encrypted || null,
    data.favorite ? 1 : 0,
    now,
    now,
  );

  return getEntryById(id, data.user_id)!;
}

export function updateEntry(
  entryId: string,
  userId: string,
  data: Partial<Omit<Entry, 'id' | 'user_id' | 'created_at' | 'deleted_at'>>,
): ApiResponse<Entry> {
  const db = getDb();
  const existing = getEntryById(entryId, userId);
  if (!existing) {
    return { success: false, error: 'Entry not found' };
  }

  const now = Date.now();
  const fields: string[] = ['updated_at = ?'];
  const values: unknown[] = [now];

  if (data.title_encrypted !== undefined) {
    fields.push('title_encrypted = ?');
    values.push(data.title_encrypted);
  }
  if (data.body_encrypted !== undefined) {
    fields.push('body_encrypted = ?');
    values.push(data.body_encrypted);
  }
  if (data.iv !== undefined) {
    fields.push('iv = ?');
    values.push(data.iv);
  }
  if (data.auth_tag !== undefined) {
    fields.push('auth_tag = ?');
    values.push(data.auth_tag);
  }
  if (data.type !== undefined) {
    fields.push('type = ?');
    values.push(data.type);
  }
  if (data.tags_encrypted !== undefined) {
    fields.push('tags_encrypted = ?');
    values.push(data.tags_encrypted);
  }
  if (data.favorite !== undefined) {
    fields.push('favorite = ?');
    values.push(data.favorite ? 1 : 0);
  }
  if (data.folder_id !== undefined) {
    fields.push('folder_id = ?');
    values.push(data.folder_id);
  }

  values.push(entryId, userId);
  db.prepare(
    `UPDATE entries SET ${fields.join(', ')} WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
  ).run(...values);

  return { success: true, data: getEntryById(entryId, userId)! };
}

export function deleteEntry(entryId: string, userId: string): ApiResponse {
  const db = getDb();
  const existing = getEntryById(entryId, userId);
  if (!existing) {
    return { success: false, error: 'Entry not found' };
  }

  db.prepare('UPDATE entries SET deleted_at = ? WHERE id = ? AND user_id = ?').run(
    Date.now(),
    entryId,
    userId,
  );

  return { success: true };
}

export function bulkDeleteEntries(ids: string[], userId: string): ApiResponse {
  const db = getDb();
  const now = Date.now();

  db.transaction(() => {
    for (const id of ids) {
      db.prepare('UPDATE entries SET deleted_at = ? WHERE id = ? AND user_id = ?').run(
        now,
        id,
        userId,
      );
    }
  })();

  return { success: true };
}

export function toggleFavorite(entryId: string, userId: string): ApiResponse<Entry> {
  const db = getDb();
  const existing = getEntryById(entryId, userId);
  if (!existing) {
    return { success: false, error: 'Entry not found' };
  }

  const newVal = existing.favorite ? 0 : 1;
  db.prepare('UPDATE entries SET favorite = ?, updated_at = ? WHERE id = ? AND user_id = ?').run(
    newVal,
    Date.now(),
    entryId,
    userId,
  );

  return { success: true, data: getEntryById(entryId, userId)! };
}

export function moveEntry(
  entryId: string,
  userId: string,
  folderId: string | null,
): ApiResponse<Entry> {
  const db = getDb();
  const existing = getEntryById(entryId, userId);
  if (!existing) {
    return { success: false, error: 'Entry not found' };
  }

  db.prepare(
    'UPDATE entries SET folder_id = ?, updated_at = ? WHERE id = ? AND user_id = ?',
  ).run(folderId, Date.now(), entryId, userId);

  return { success: true, data: getEntryById(entryId, userId)! };
}

export function syncEntries(
  userId: string,
  request: SyncRequest,
): ApiResponse<SyncResponse> {
  const db = getDb();
  const syncAt = Date.now();

  const entries = db
    .prepare(
      `SELECT * FROM entries WHERE user_id = ? AND updated_at > ?
       ORDER BY updated_at ASC`,
    )
    .all(userId, request.lastSyncAt) as Entry[];

  const folders = db
    .prepare(
      'SELECT * FROM folders WHERE user_id = ? AND created_at > ? ORDER BY sort_order ASC',
    )
    .all(userId, request.lastSyncAt) as any[];

  return {
    success: true,
    data: {
      entries,
      folders,
      syncAt,
    },
  };
}
