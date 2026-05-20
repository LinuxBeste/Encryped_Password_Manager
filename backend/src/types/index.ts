// Database row shape for a user account
export interface User {
  id: string;
  email: string;
  argon2_hash: string;
  created_at: number;
  last_login: number | null;
  totp_secret: string | null;
  email_2fa_enabled: number;
}

// Database row shape for an encrypted vault
export interface Vault {
  id: string;
  user_id: string;
  name: string;
  encrypted_blob: Buffer;
  iv: Buffer;
  auth_tag: Buffer;
  version: number;
  updated_at: number;
}

// Database row shape for a folder
export interface Folder {
  id: string;
  vault_id: string;
  user_id: string;
  name_encrypted: Buffer;
  parent_id: string | null;
  sort_order: number;
  created_at: number;
}

// Database row shape for a password entry
export interface Entry {
  id: string;
  vault_id: string;
  folder_id: string | null;
  user_id: string;
  title_encrypted: Buffer;
  body_encrypted: Buffer;
  iv: Buffer;
  auth_tag: Buffer;
  type: string;
  tags_encrypted: Buffer | null;
  favorite: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

// Database row shape for a refresh token
export interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: number;
  revoked: number;
  created_at: number;
}

// Database row shape for an audit log entry
export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  ip_address: string;
  user_agent: string;
  metadata: string | null;
  timestamp: number;
}

// Database row shape for a user setting
export interface Setting {
  user_id: string;
  key: string;
  value: string;
  updated_at: number;
}

// Generic API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Decoded JWT token payload
export interface JwtPayload {
  userId: string;
  email: string;
}

// Sync request body
export interface SyncRequest {
  lastSyncAt: number;
  deletedIds: string[];
}

// Sync response body
export interface SyncResponse {
  entries: Entry[];
  folders: Folder[];
  syncAt: number;
}

// Database row shape for an email 2FA verification code
export interface Email2faCode {
  id: string;
  user_id: string;
  code_hash: string;
  expires_at: number;
  used: number;
  created_at: number;
}

// Paginated result wrapper
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
