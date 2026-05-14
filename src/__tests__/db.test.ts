import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { initDb, getDb, closeDb } from '../db/db';

describe('Database initialization and schema', () => {
  const testDbPath = path.join(__dirname, '../../test-data/test.db');

  beforeEach(() => {
    const dir = path.dirname(testDbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  afterEach(() => {
    try {
      closeDb();
    } catch {
      // ignore
    }
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    const walPath = testDbPath + '-wal';
    const shmPath = testDbPath + '-shm';
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
  });

  it('should initialize database with all tables', () => {
    const db = initDb(testDbPath);
    expect(db).toBeDefined();

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as { name: string }[];

    const tableNames = tables.map((t) => t.name);
    expect(tableNames).toContain('schema_version');
    expect(tableNames).toContain('users');
    expect(tableNames).toContain('vaults');
    expect(tableNames).toContain('folders');
    expect(tableNames).toContain('entries');
    expect(tableNames).toContain('refresh_tokens');
    expect(tableNames).toContain('audit_log');
    expect(tableNames).toContain('settings');
  });

  it('should enable WAL mode', () => {
    const db = initDb(testDbPath);
    const row = db.prepare('PRAGMA journal_mode').get() as { journal_mode: string };
    expect(row.journal_mode).toBe('wal');
  });

  it('should have foreign keys enabled', () => {
    const db = initDb(testDbPath);
    const row = db.prepare('PRAGMA foreign_keys').get() as { foreign_keys: number };
    expect(row.foreign_keys).toBe(1);
  });

  it('should track schema version', () => {
    const db = initDb(testDbPath);
    const row = db
      .prepare('SELECT version FROM schema_version ORDER BY version DESC LIMIT 1')
      .get() as { version: number };
    expect(row.version).toBeGreaterThanOrEqual(1);
  });
});
