export interface User {
  id: string;
  email: string;
  argon2_hash: string;
  created_at: number;
  last_login: number | null;
  totp_secret: string | null;
}

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

export interface Folder {
  id: string;
  vault_id: string;
  user_id: string;
  name_encrypted: Buffer;
  parent_id: string | null;
  sort_order: number;
  created_at: number;
}

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

export interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: number;
  revoked: number;
  created_at: number;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  ip_address: string;
  user_agent: string;
  metadata: string | null;
  timestamp: number;
}

export interface Setting {
  user_id: string;
  key: string;
  value: string;
  updated_at: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface SyncRequest {
  lastSyncAt: number;
  deletedIds: string[];
}

export interface SyncResponse {
  entries: Entry[];
  folders: Folder[];
  syncAt: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
