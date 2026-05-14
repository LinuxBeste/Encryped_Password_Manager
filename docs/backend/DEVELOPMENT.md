# Backend Development Guide

## Setup

```bash
cd backend
cp .env.example .env
pnpm install
pnpm dev              # http://localhost:3000
```

## Project Map

```
src/
├── index.ts               App bootstrap: middleware stack, route mounting, server start
├── types.ts               Shared types (User, Entry, Folder, etc.)
├── db/
│   ├── db.ts              Singleton DB connection, migration runner, WAL mode
│   └── schema.ts          CREATE TABLE statements + versioned migrations
├── api/
│   ├── middleware/
│   │   ├── auth.middleware.ts       JWT from cookie or Bearer header
│   │   ├── csrf.middleware.ts       Double-submit cookie validation
│   │   ├── error.middleware.ts      createError() + errorHandler()
│   │   ├── rateLimit.middleware.ts  In-memory sliding window limiter
│   │   └── validate.middleware.ts   Zod schema wrapper
│   └── routes/
│       ├── auth.routes.ts           Register, login, refresh, TOTP
│       ├── vault.routes.ts          Vault export, delta sync
│       ├── entries.routes.ts        CRUD, bulk, favorite, move
│       ├── folders.routes.ts        CRUD, reorder
│       └── settings.routes.ts       Key-value settings
├── services/
│   ├── auth.service.ts     Argon2id hashing, token generation/rotation
│   ├── vault.service.ts    Vault assembly + export
│   ├── entry.service.ts    Entry CRUD + delta sync queries
│   ├── audit.service.ts    Audit log writer + paginated reader
│   └── crypto.service.ts   Argon2id hash/verify wrappers
└── utils/
    ├── config.ts           Env var parsing with defaults
    └── logger.ts           Winston logger setup
```

## Testing

### Running Tests

```bash
pnpm test                      # All tests
pnpm test -- --watch            # Watch mode
pnpm test -- --coverage         # With coverage report
pnpm test -- --testNamePattern "entries"  # Run specific describe blocks
```

### Test Structure

Tests live in `__tests__/` directories alongside their source:

```
src/
├── services/
│   ├── auth.service.ts
│   └── __tests__/
│       └── auth.service.test.ts
├── api/
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   └── __tests__/
│   │       └── auth.middleware.test.ts
│   └── routes/
│       └── __tests__/
│           └── audit.service.test.ts   # (named after what it tests)
```

### Test Patterns

**describe/it naming** — Em-dash separator:
```ts
describe('AuthService — register', () => {
  it('should create a user with hashed password', () => { ... });
  it.each([
    ['weak', '123'],
    ['short', 'ab'],
  ])('should reject %s password', (_, pw) => { ... });
});
```

**DB tests** — use `freshDb()` helper:
```ts
import { freshDb } from '../../test-data/helpers';

beforeEach(() => {
  db = freshDb();  // creates temp DB, runs schema, returns Database instance
});
```

**Middleware tests** — use `mockReqRes()` factory:
```ts
const { req, res, next } = mockReqRes({
  headers: { 'x-csrf-token': 'abc' },
  cookies: { 'csrf-token': 'abc' },
});
```

`mockReqRes()` returns:
- `req` — partial `Request` with your overrides merged
- `res` — mocked with `status()` and `json()` capturing to `_status` / `_body`
- `next` — `jest.fn()`

**Auth middleware tests** use `mockReqRes({ userId: 'uuid' })` to simulate an authenticated request.

### Coverage Goals

| Area | Target |
|---|---|
| Services | > 90% |
| Middleware | > 90% |
| Routes | > 80% (integration-level) |
| DB layer | > 80% |

## Code Conventions

### Style (enforced by ESLint + Prettier)

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

### Import Order

1. Third-party packages (alphabetical)
2. Relative project imports

```ts
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { getDb } from '../db/db';
import { config } from '../utils/config';
import type { User } from '../types';
```

### Naming

| Construct | Convention | Example |
|---|---|---|
| Files | kebab-case | `auth.service.ts` |
| Classes/Interfaces | PascalCase | `AppError` |
| Functions | camelCase | `createEntry()` |
| Routes file exports | camelCase + Router | `export { router as entriesRouter }` |
| Environment variables | UPPER_SNAKE_CASE | `JWT_SECRET` |
| SQL columns | snake_case | `title_encrypted` |

### Error Handling

Use the `createError` factory for all expected failures:

```ts
import { createError } from '../middleware/error.middleware';

// In a route handler:
if (!entry) throw createError(404, 'Entry not found');
if (req.userId !== entry.user_id) throw createError(403, 'Forbidden');
```

Do NOT throw raw `Error` for operational failures — they'll be masked as 500.

### Route Handler Pattern

```ts
router.get(
  '/',
  authenticate,        // JWT check (sets req.userId)
  rateLimitDefault,    // rate limiter
  (req: AuthRequest, res: Response) => {
    try {
      const data = getEntries(req.userId!);
      res.json({ success: true, data });
    } catch (err) {
      next(err);       // caught by errorHandler
    }
  },
);
```

For simpler handlers without async, the `try/catch` is optional — the error middleware catches sync throws.

### Auth Middleware

- `authenticate` middleware extracts JWT from `Authorization: Bearer <token>` header or `x-session-token` cookie.
- Sets `req.userId` (string UUID).
- Returns 401 if missing or expired.

### Validation (Zod)

Schemas are defined per-route file and validate request body:

```ts
const createEntrySchema = z.object({
  vault_id: z.string().uuid(),
  title_encrypted: z.instanceof(Buffer),
  // ...
});

router.post('/', validate(createEntrySchema), handler);
```

Validation errors return 400 with the first Zod issue message.

## Database

### Schema Migrations

Run automatically on startup. To add a migration:

1. Increment `SCHEMA_VERSION` in `src/db/schema.ts`
2. Append a new SQL string to the `MIGRATIONS` array
3. Restart the server

```ts
const SCHEMA_VERSION = 2;

const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS schema_version ...`,
  `CREATE TABLE users ...`,              // v1
  `ALTER TABLE entries ADD COLUMN ...`,  // v2
];
```

The migration runner in `db.ts`:
1. Creates `schema_version` table if missing
2. Reads current version
3. Runs each migration in sequence
4. Updates the version on success
5. Wraps all migrations in a transaction

### DB Instance

Always use `getDb()` — returns a singleton better-sqlite3 instance:

```ts
import { getDb } from '../db/db';

const db = getDb();
const rows = db.prepare('SELECT * FROM entries WHERE user_id = ?').all(userId);
```

The DB is synchronous (better-sqlite3). No async/await needed for queries.

### WAL Mode

The database operates in **WAL mode** for concurrent read performance:
```sql
PRAGMA journal_mode = WAL;
PRAGMA busy_timeout = 5000;
PRAGMA foreign_keys = ON;
```

## Common Tasks

### Adding a New Route

1. Create `src/api/routes/<name>.routes.ts`
2. Define Zod schemas for validation
3. Export `router` as `<name>Router`
4. Mount in `src/index.ts`: `app.use('/api/<name>', <name>Router);`

### Adding a New Middleware

1. Create `src/api/middleware/<name>.middleware.ts`
2. Export the middleware function
3. Apply in route files or at the app level in `src/index.ts`

### Adding a DB Migration

1. Update `SCHEMA_VERSION` in `src/db/schema.ts`
2. Add SQL to `MIGRATIONS` array
3. Test by restarting — the migration runs automatically

### Debugging

```bash
# Watch mode with debugger
pnpm dev

# Or with node --inspect
node --inspect -r ts-node/register src/index.ts
```

Logging uses Winston. Log level is controlled by `NODE_ENV`:
- Development: console transport with colors
- Production: JSON transport to stdout

## Architecture Decisions

### Why SQLite?

- Zero configuration — no external database server needed
- Perfect for single-user/small-team deployments
- WAL mode provides good concurrent read performance
- better-sqlite3 is synchronous — simpler code, no async overhead

### Why In-Memory Rate Limiting?

- No Redis dependency for deployments with a single instance
- State resets on restart (acceptable for development and small deployments)
- Can be swapped for Redis in the future if scaling horizontally

### Why Zod?

- TypeScript-first schema validation with automatic type inference
- Composable schemas for nested validation
- Clear, customizable error messages

### Why Soft Deletes?

Entries use `deleted_at` timestamp instead of hard delete:
- Enables "undo" functionality in the future
- Audit trail preservation
- Sync-friendly (clients can detect deletions via delta sync)
