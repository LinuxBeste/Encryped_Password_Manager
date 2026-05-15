import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { authenticator } from 'otplib';
import { getDb } from '../db/db';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { hashPassword, verifyPassword } from './crypto.service';
import { User, JwtPayload, ApiResponse, RefreshToken } from '../types';

// Register a new user with email and master password
export async function registerUser(
  email: string,
  masterPassword: string,
): Promise<ApiResponse<{ userId: string }>> {
  const db = getDb();

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return { success: false, error: 'Email already registered' };
  }

  const argon2Hash = await hashPassword(masterPassword);
  const userId = uuidv4();
  const now = Date.now();

  db.prepare('INSERT INTO users (id, email, argon2_hash, created_at) VALUES (?, ?, ?, ?)').run(
    userId,
    email,
    argon2Hash,
    now,
  );

  const vaultId = uuidv4();
  const emptyBuf = Buffer.alloc(0);
  db.prepare(
    'INSERT INTO vaults (id, user_id, name, encrypted_blob, iv, auth_tag, version, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)',
  ).run(vaultId, userId, 'default', emptyBuf, emptyBuf, emptyBuf, now);

  logger.info(`User registered: ${email}`);
  return { success: true, data: { userId } };
}

// Authenticate user with email and master password
export async function loginUser(
  email: string,
  masterPassword: string,
): Promise<
  ApiResponse<{
    userId: string;
    email: string;
    token?: string;
    refreshToken?: string;
    totpRequired?: boolean;
  }>
> {
  const db = getDb();

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
  if (!user) {
    return { success: false, error: 'Invalid email or password' };
  }

  const valid = await verifyPassword(user.argon2_hash, masterPassword);
  if (!valid) {
    return { success: false, error: 'Invalid email or password' };
  }

  if (user.totp_secret) {
    return {
      success: true,
      data: { userId: user.id, email: user.email, totpRequired: true },
    };
  }

  const token = generateJwt(user);
  const refreshToken = storeRefreshToken(user.id);

  db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(Date.now(), user.id);

  logger.info(`User logged in: ${email}`);
  return { success: true, data: { userId: user.id, email: user.email, token, refreshToken } };
}

// Verify TOTP code and complete login
export function verifyTotpAndLogin(
  userId: string,
  totpCode: string,
): ApiResponse<{ token: string; refreshToken: string; totpRequired?: boolean }> {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User | undefined;

  if (!user || !user.totp_secret) {
    return { success: false, error: 'TOTP not configured' };
  }

  const isValid = authenticator.check(totpCode, user.totp_secret);
  if (!isValid) {
    return { success: false, error: 'Invalid TOTP code' };
  }

  const token = generateJwt(user);
  const refreshToken = storeRefreshToken(user.id);

  db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(Date.now(), userId);

  return { success: true, data: { token, refreshToken } };
}

// Issue new access token using a valid refresh token
export function refreshAccessToken(
  refreshTokenStr: string,
): ApiResponse<{ token: string; refreshToken: string }> {
  const db = getDb();
  const hash = crypto.createHash('sha256').update(refreshTokenStr).digest('hex');

  const row = db
    .prepare('SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked = 0 AND expires_at > ?')
    .get(hash, Date.now()) as RefreshToken | undefined;

  if (!row) {
    return { success: false, error: 'Invalid or expired refresh token' };
  }

  db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE id = ?').run(row.id);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(row.user_id) as User | undefined;
  if (!user) {
    return { success: false, error: 'User not found' };
  }

  const token = generateJwt(user);
  const newRefreshTokenStr = storeRefreshToken(user.id);

  return { success: true, data: { token, refreshToken: newRefreshTokenStr } };
}

// Revoke a refresh token to log out
export function logoutUser(refreshTokenStr: string): ApiResponse {
  const db = getDb();
  const hash = crypto.createHash('sha256').update(refreshTokenStr).digest('hex');

  db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?').run(hash);

  return { success: true };
}

// Delete user account and all associated data
export async function deleteAccount(userId: string, masterPassword: string): Promise<ApiResponse> {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User | undefined;

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  const valid = await verifyPassword(user.argon2_hash, masterPassword);
  if (!valid) {
    return { success: false, error: 'Invalid password' };
  }

  db.transaction(() => {
    db.prepare('DELETE FROM entries WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM folders WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM vaults WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM audit_log WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM settings WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  })();

  logger.info(`Account deleted: ${user.email}`);
  return { success: true };
}

// Sign a JWT access token for the user
function generateJwt(user: User): string {
  const payload: JwtPayload = { userId: user.id, email: user.email };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as SignOptions);
}

// Generate and persist a new refresh token
function storeRefreshToken(userId: string): string {
  const db = getDb();
  const tokenStr = uuidv4() + '-' + uuidv4();
  const hash = crypto.createHash('sha256').update(tokenStr).digest('hex');
  const id = uuidv4();
  const now = Date.now();

  db.prepare(
    'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, revoked, created_at) VALUES (?, ?, ?, ?, 0, ?)',
  ).run(id, userId, hash, now + config.refreshTokenExpiresInMs, now);

  return tokenStr;
}
