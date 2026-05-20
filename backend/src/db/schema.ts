// Latest schema version number
export const SCHEMA_VERSION = 3;

// Schema migrations keyed by version number
export const migrations: Record<number, string[]> = {
  1: [
    `CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      applied_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      argon2_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_login INTEGER,
      totp_secret TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS vaults (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL DEFAULT 'default',
      encrypted_blob BLOB NOT NULL DEFAULT x'',
      iv BLOB NOT NULL DEFAULT x'',
      auth_tag BLOB NOT NULL DEFAULT x'',
      version INTEGER NOT NULL DEFAULT 1,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      vault_id TEXT NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name_encrypted BLOB NOT NULL,
      parent_id TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY,
      vault_id TEXT NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
      folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title_encrypted BLOB NOT NULL,
      body_encrypted BLOB NOT NULL,
      iv BLOB NOT NULL,
      auth_tag BLOB NOT NULL,
      type TEXT NOT NULL DEFAULT 'password',
      tags_encrypted BLOB,
      favorite INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      revoked INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      ip_address TEXT NOT NULL DEFAULT '',
      user_agent TEXT NOT NULL DEFAULT '',
      metadata TEXT,
      timestamp INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS settings (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      key TEXT NOT NULL,
      value TEXT NOT NULL DEFAULT '',
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, key)
    )`,
    `CREATE INDEX IF NOT EXISTS idx_entries_user_id ON entries(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_entries_vault_id ON entries(vault_id)`,
    `CREATE INDEX IF NOT EXISTS idx_entries_folder_id ON entries(folder_id)`,
    `CREATE INDEX IF NOT EXISTS idx_entries_deleted_at ON entries(deleted_at)`,
    `CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_folders_vault_id ON folders(vault_id)`,
    `CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash)`,
    `CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp)`,
    `CREATE INDEX IF NOT EXISTS idx_vaults_user_id ON vaults(user_id)`,
  ],
  2: [
    `ALTER TABLE folders ADD COLUMN updated_at INTEGER`,
  ],
  3: [
    `ALTER TABLE users ADD COLUMN email_2fa_enabled INTEGER NOT NULL DEFAULT 0`,
    `CREATE TABLE IF NOT EXISTS email_2fa_codes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code_hash TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_email_2fa_codes_user_id ON email_2fa_codes(user_id)`,
  ],
};
