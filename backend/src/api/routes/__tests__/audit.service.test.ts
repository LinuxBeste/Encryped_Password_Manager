import { logAuditEvent, getAuditLogs } from '../../../services/audit.service';
import { initDb, closeDb, getDb } from '../../../db/db';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const testDbPath = path.join(__dirname, '../../../test-data/audit-test.db');

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

describe('AuditService — logAuditEvent', () => {
  it('logs an audit event', () => {
    const db = getDb();
    logAuditEvent(uuidv4(), 'test.action', '1.2.3.4', 'test-agent', { key: 'val' });
    const count = db.prepare('SELECT COUNT(*) as c FROM audit_log').get() as any;
    expect(count.c).toBe(1);
  });

  it('logs without metadata', () => {
    logAuditEvent(uuidv4(), 'no.meta', '0.0.0.0', 'agent');
    const db = getDb();
    const row = db.prepare('SELECT * FROM audit_log LIMIT 1').get() as any;
    expect(row.metadata).toBeNull();
  });

  it('logs with IP and user agent', () => {
    logAuditEvent(uuidv4(), 'test', '192.168.1.1', 'Mozilla/5.0');
    const db = getDb();
    const row = db.prepare('SELECT * FROM audit_log LIMIT 1').get() as any;
    expect(row.ip_address).toBe('192.168.1.1');
    expect(row.user_agent).toBe('Mozilla/5.0');
  });

  const actions = ['auth.login', 'auth.register', 'vault.sync', 'entry.create', 'account.delete'];
  it.each(actions)('logs action: %s', (action) => {
    logAuditEvent(uuidv4(), action, '', '');
    const db = getDb();
    const row = db.prepare('SELECT action FROM audit_log WHERE action = ?').get(action) as any;
    expect(row.action).toBe(action);
  });
});

describe('AuditService — getAuditLogs', () => {
  it('returns paginated results', () => {
    const userId = uuidv4();
    for (let i = 0; i < 5; i++) {
      logAuditEvent(userId, `action.${i}`, '', '');
    }
    const result = getAuditLogs(userId, 1, 3);
    expect(result.items).toHaveLength(3);
    expect(result.total).toBe(5);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(3);
  });

  it('returns second page', () => {
    const userId = uuidv4();
    for (let i = 0; i < 5; i++) {
      logAuditEvent(userId, `action.${i}`, '', '');
    }
    const result = getAuditLogs(userId, 2, 3);
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(5);
  });

  it('returns empty for user with no logs', () => {
    const result = getAuditLogs(uuidv4());
    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('orders by timestamp descending', () => {
    const userId = uuidv4();
    for (let i = 0; i < 3; i++) {
      logAuditEvent(userId, `action.${i}`, '', '');
    }
    const result = getAuditLogs(userId);
    expect(result.items.length).toBe(3);
    for (let i = 1; i < result.items.length; i++) {
      expect(result.items[i - 1].timestamp).toBeGreaterThanOrEqual(result.items[i].timestamp);
    }
  });

  it('caps limit at 1000', () => {
    const result = getAuditLogs(uuidv4(), 1, 5000);
    expect(result.limit).toBe(1000);
  });

  it('parses metadata JSON on output', () => {
    const userId = uuidv4();
    logAuditEvent(userId, 'test', '', '', { foo: 'bar', num: 42 });
    const result = getAuditLogs(userId);
    expect(result.items[0].metadata).toEqual({ foo: 'bar', num: 42 });
  });
});
