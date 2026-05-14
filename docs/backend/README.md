# VaultLock Backend

Secure REST API with zero-knowledge architecture — stores only Argon2id password hashes and AES-256-GCM encrypted blobs.

## Tech Stack

| Category | Choice |
|---|---|
| Runtime | Node.js 22 + TypeScript 5.4+ |
| Framework | Express 4.19 |
| Database | SQLite via better-sqlite3 11 (WAL mode, foreign keys) |
| Auth | JWT (HS256, 15 min access / 7 day refresh), Argon2id KDF, TOTP 2FA |
| Validation | Zod 3.23 |
| Logging | Winston 3.13 (console, JSON file in production) |
| Security | Helmet 7.1, CORS 2.8, CSRF double-submit cookie, rate limiting |
| Container | Docker multi-stage (node:22-alpine), Docker Compose |

## Project Structure

```
src/
├── index.ts                        Express app setup + server start
├── types.ts                        Shared TypeScript interfaces
├── db/
│   ├── db.ts                       Singleton DB init, migration runner, WAL pragmas
│   └── schema.ts                   SQL schema + versioned migrations
├── api/
│   ├── middleware/
│   │   ├── auth.middleware.ts       JWT verification (cookie or Bearer header)
│   │   ├── csrf.middleware.ts       Double-submit cookie CSRF protection
│   │   ├── rateLimit.middleware.ts  In-memory per-endpoint rate limiting
│   │   ├── error.middleware.ts      Centralized error handler
│   │   └── validate.middleware.ts   Zod schema validation (body/query/params)
│   └── routes/
│       ├── auth.routes.ts           Register, login, refresh, logout, delete, TOTP
│       ├── vault.routes.ts          Vault export, delta sync
│       ├── entries.routes.ts        CRUD, bulk-delete, favorite, move
│       ├── folders.routes.ts        CRUD, reorder (with entry counts)
│       └── settings.routes.ts       User settings key-value store
└── services/
    ├── auth.service.ts              Argon2id hash/verify, token generation
    ├── vault.service.ts             Vault retrieval + export
    ├── entry.service.ts             Entry CRUD, delta sync
    ├── audit.service.ts             Audit event logging + paginated queries
    └── crypto.service.ts            Argon2id wrapper
```

## Database Schema

Tables: `users`, `vaults`, `folders`, `entries`, `refresh_tokens`, `audit_log`, `settings`, `schema_version`

### Key Relationships

```
users (id) ── vaults (user_id)
users (id) ── refresh_tokens (user_id)
vaults (id) ── folders (vault_id)
vaults (id) ── entries (vault_id)
folders (id) ── entries (folder_id, nullable)
```

### entries

| Column | Type | Notes |
|---|---|---|
| id | TEXT (UUID) | Primary key |
| vault_id | TEXT (UUID) | FK → vaults |
| folder_id | TEXT (UUID) | FK → folders, nullable |
| user_id | TEXT (UUID) | FK → users |
| title_encrypted | BLOB | AES-256-GCM ciphertext |
| body_encrypted | BLOB | AES-256-GCM ciphertext (username + password + url + notes) |
| iv | BLOB | 12 bytes random IV |
| auth_tag | BLOB | 16 bytes GCM auth tag |
| type | TEXT | password, note, credit-card, identity, ssh-key |
| tags_encrypted | TEXT | Optional JSON of encrypted tags |
| favorite | INTEGER | 0 or 1 |
| created_at | INTEGER | Unix ms |
| updated_at | INTEGER | Unix ms |
| deleted_at | INTEGER | Nullable, soft-delete |

## Middleware Pipeline

```
Request
  → Helmet (security headers)
  → CORS
  → Cookie parser
  → Rate limiter (per-route)
  → Authenticate (JWT, optional for public routes)
  → CSRF validation (state-changing methods)
  → Zod validation (body/query/params)
  → Route handler
  → Response
  → Error handler (catch-all)
```

## Response Format

All endpoints return:
```json
{
  "success": true,
  "data": { ... },
  "error": "message if failed"
}
```

Error responses include an `error` field. The error middleware distinguishes operational errors (expected, e.g. validation) from programmer errors (500).

## API Endpoints

### Authentication
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | No | Create account (email + master password) |
| POST | /api/auth/login | No | Login, returns JWT + refresh token |
| POST | /api/auth/refresh | No | Rotate refresh token (body: refreshToken) |
| POST | /api/auth/logout | Yes | Revoke refresh token |
| DELETE | /api/auth/account | Yes | Delete account + all vault data |
| POST | /api/auth/totp/setup | Yes | Generate TOTP secret + QR code |
| POST | /api/auth/totp/verify | Yes | Enable TOTP with verification code |
| DELETE | /api/auth/totp | Yes | Disable TOTP |

### Vault
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/vault | Yes | Full vault (entries + folders + metadata) |
| POST | /api/vault/sync | Yes | Delta sync (client sends last sync timestamp) |
| GET | /api/vault/export | Yes | Full encrypted backup |

### Entries
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/entries | Yes | List entries (supports ?folder_id filter) |
| POST | /api/entries | Yes | Create encrypted entry |
| GET | /api/entries/:id | Yes | Get single encrypted entry |
| PUT | /api/entries/:id | Yes | Update encrypted entry |
| DELETE | /api/entries/:id | Yes | Soft-delete (sets deleted_at) |
| POST | /api/entries/bulk-delete | Yes | Soft-delete multiple entries |
| POST | /api/entries/:id/favorite | Yes | Toggle favorite |
| PATCH | /api/entries/move | Yes | Move entries to folder |

### Folders
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/folders | Yes | List folders sorted by sort_order (includes entry_count) |
| POST | /api/folders | Yes | Create folder |
| PUT | /api/folders/:id | Yes | Rename folder |
| DELETE | /api/folders/:id | Yes | Delete folder (entries moved to root) |
| PATCH | /api/folders/reorder | Yes | Batch update sort_order |

### Settings & Audit
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/settings | Yes | Get all user settings (JSON key-value) |
| PUT | /api/settings | Yes | Batch upsert settings |
| GET | /api/audit | Yes | Paginated audit log (?page=&limit= defaults 50) |

### Health
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/health | No | Server health (DB connectivity check) |

## Environment Variables

| Variable | Default | Required | Description |
|---|---|---|---|
| `PORT` | `3000` | No | Server listen port |
| `JWT_SECRET` | — | **Yes** | HMAC-SHA256 secret for access tokens |
| `JWT_EXPIRES_IN` | `15m` | No | Access token TTL (ms or vercel/ms format) |
| `REFRESH_TOKEN_EXPIRES_IN_MS` | `604800000` | No | Refresh token TTL (7 days) |
| `CORS_ORIGIN` | `http://localhost:5173` | No | Allowed CORS origin |
| `DB_PATH` | `./data/vaultlock.db` | No | SQLite file location |
| `ARGON2_MEMORY` | `65536` | No | Memory cost in KiB (64 MB) |
| `ARGON2_ITERATIONS` | `3` | No | Time cost |
| `ARGON2_PARALLELISM` | `4` | No | Thread count |
| `RATE_LIMIT_AUTH` | `5` | No | Max auth requests per window |
| `RATE_LIMIT_AUTH_WINDOW` | `900000` | No | Auth rate window (ms, 15 min) |
| `RATE_LIMIT_VAULT` | `30` | No | Max vault requests per window |
| `RATE_LIMIT_VAULT_WINDOW` | `60000` | No | Vault rate window (ms, 1 min) |
| `RATE_LIMIT_DEFAULT` | `100` | No | Default max requests per window |
| `RATE_LIMIT_DEFAULT_WINDOW` | `60000` | No | Default rate window (ms, 1 min) |
| `TOTP_ENABLED` | `true` | No | Enable TOTP 2FA endpoints |
| `CSRF_SECRET` | — | No | Secret for CSRF cookie signing |

## Development

```bash
cp .env.example .env
pnpm install
pnpm dev              # ts-node-dev with hot reload on :3000
pnpm lint             # ESLint
pnpm typecheck        # tsc --noEmit
pnpm test             # Jest
```

### Database Migrations

Migrations run automatically on server start. The schema version is stored in the `schema_version` table. Each migration is a SQL string in `src/db/schema.ts` keyed by version number. To add a migration:

1. Increment `SCHEMA_VERSION` in `src/db/schema.ts`
2. Append the new SQL to the `MIGRATIONS` array
3. Restart the server — the migration runs automatically

## Docker

### Production

```bash
docker compose up -d --build
```
- Port 3443 (internal, map to 443 at reverse proxy)
- Named volume `vaultlock-data` for SQLite persistence
- Healthcheck: `GET /api/health` every 30s
- Runs as non-root `vaultlock` user
- Set `JWT_SECRET` and `CSRF_SECRET` via environment or `.env`

### Development (hot reload)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```
- Port 3000
- Source mounted as read-only volume
- tsconfig.json mounted for live config changes
- ts-node-dev restarts on file changes

### TLS

Terminate TLS at the reverse proxy (Caddy, Nginx, Traefik). For local testing:

```bash
mkdir -p data/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout data/certs/key.pem -out data/certs/cert.pem \
  -subj "/CN=localhost"
```

## Testing

```bash
pnpm test                  # All tests
pnpm test -- --watch       # Watch mode
pnpm test -- --coverage    # With coverage
```

Tests use Jest with `ts-jest`. The test database is isolated at a configurable path.

## Audit Logging

All sensitive operations (login, entry create/update/delete, folder operations, settings changes) are logged to the `audit_log` table:

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "event": "entry.create",
  "ip": "127.0.0.1",
  "user_agent": "Mozilla/...",
  "metadata": { "entryId": "uuid" },
  "created_at": 1715000000000
}
```

Events: `auth.login`, `auth.register`, `auth.logout`, `entry.create`, `entry.update`, `entry.delete`, `folder.create`, `folder.rename`, `folder.delete`, `folder.reorder`, `settings.update`, `vault.export`, `account.delete`.

## Error Handling

Errors are handled by `src/api/middleware/error.middleware.ts`:

| Error type | HTTP code | Response |
|---|---|---|
| Zod validation error | 400 | Details of first validation failure |
| Authentication failure | 401 | "Authentication required" |
| CSRF token missing | 403 | "CSRF token validation failed" |
| Rate limit exceeded | 429 | "Too many requests" |
| Not found | 404 | "Resource not found" |
| Operational error (custom) | varies | message from `AppError` class |
| Unexpected error | 500 | "Internal server error" (logged) |

Custom operational errors use the `AppError` class with explicit HTTP status codes. Unexpected errors (programmer mistakes) are logged to Winston and return a generic 500.

## Security

See [SECURITY.md](SECURITY.md) for the full security model, including encryption flow, key hierarchy, cryptographic parameters, and session security.
