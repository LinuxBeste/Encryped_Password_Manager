import { getDb } from '../db/db';
import { Vault, ApiResponse } from '../types';

// Get the user's vault and non-deleted entry summaries
export function getVault(userId: string): ApiResponse<{ vault: Vault | null; entries: any[] }> {
  const db = getDb();
  const vault = db.prepare('SELECT * FROM vaults WHERE user_id = ?').get(userId) as
    | Vault
    | undefined;
  const entries = db
    .prepare(
      `SELECT id, vault_id, folder_id, title_encrypted, type, tags_encrypted, favorite, created_at, updated_at
       FROM entries WHERE user_id = ? AND deleted_at IS NULL`,
    )
    .all(userId);

  return { success: true, data: { vault: vault || null, entries } };
}

// Export all user data including vault, entries, and folders
export function exportVault(userId: string): ApiResponse {
  const db = getDb();
  const vault = db.prepare('SELECT * FROM vaults WHERE user_id = ?').get(userId);
  const entries = db
    .prepare('SELECT * FROM entries WHERE user_id = ? AND deleted_at IS NULL')
    .all(userId);
  const folders = db.prepare('SELECT * FROM folders WHERE user_id = ?').all(userId);

  return {
    success: true,
    data: {
      exportedAt: Date.now(),
      vault,
      entries,
      folders,
    },
  };
}
