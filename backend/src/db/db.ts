import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { migrations, SCHEMA_VERSION } from './schema';

// Database instance handle
let db: Database.Database;

// Returns the initialized database instance
export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

// Initialize SQLite database, apply migrations
export function initDb(dbPath?: string): Database.Database {
  const resolvedPath = dbPath || config.dbPath;

  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(resolvedPath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');

  runMigrations(db);

  logger.info(`Database initialized at ${resolvedPath}`);
  return db;
}

// Apply pending migrations in order
function runMigrations(database: Database.Database): void {
  const currentVersion = getCurrentVersion(database);

  for (let v = currentVersion + 1; v <= SCHEMA_VERSION; v++) {
    const statements = migrations[v];
    if (!statements) {
      logger.warn(`No migration found for version ${v}`);
      continue;
    }

    logger.info(`Running migration v${v}...`);
    database.transaction(() => {
      for (const stmt of statements) {
        try {
          database.exec(stmt);
        } catch (e) {
          logger.warn(`Migration v${v} statement skipped: ${(e as Error).message}`);
        }
      }
      database
        .prepare('INSERT OR REPLACE INTO schema_version (version, applied_at) VALUES (?, ?)')
        .run(v, Date.now());
    })();
    logger.info(`Migration v${v} applied.`);
  }
}

// Get current schema version from the database
function getCurrentVersion(database: Database.Database): number {
  try {
    const row = database
      .prepare('SELECT version FROM schema_version ORDER BY version DESC LIMIT 1')
      .get() as { version: number } | undefined;
    return row ? row.version : 0;
  } catch {
    return 0;
  }
}

// Close the database connection
export function closeDb(): void {
  if (db) {
    db.close();
  }
}
