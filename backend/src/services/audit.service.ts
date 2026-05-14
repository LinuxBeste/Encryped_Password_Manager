import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/db';
import { AuditLog } from '../types';

// Record an audit event in the database
export function logAuditEvent(
  userId: string,
  action: string,
  ipAddress: string,
  userAgent: string,
  metadata?: Record<string, unknown>,
): void {
  const db = getDb();
  const id = uuidv4();
  const now = Date.now();

  db.prepare(
    'INSERT INTO audit_log (id, user_id, action, ip_address, user_agent, metadata, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(id, userId, action, ipAddress, userAgent, metadata ? JSON.stringify(metadata) : null, now);
}

// Get paginated audit logs for a user
export function getAuditLogs(
  userId: string,
  page: number = 1,
  limit: number = 50,
): { items: AuditLog[]; total: number; page: number; limit: number } {
  const db = getDb();
  const offset = (page - 1) * limit;

  const countRow = db
    .prepare('SELECT COUNT(*) as total FROM audit_log WHERE user_id = ?')
    .get(userId) as { total: number };

  const items = db
    .prepare('SELECT * FROM audit_log WHERE user_id = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?')
    .all(userId, Math.min(limit, 1000), offset) as AuditLog[];

  return {
    items: items.map((item) => ({
      ...item,
      metadata: item.metadata ? JSON.parse(item.metadata) : null,
    })) as any,
    total: countRow.total,
    page,
    limit: Math.min(limit, 1000),
  };
}
