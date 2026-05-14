# VaultLock Backend

Offline encrypted password manager backend with zero-knowledge architecture.

## Security Model

- **Zero-knowledge**: The server never stores plaintext passwords or encryption keys.
- **Argon2id KDF**: Master password is hashed with Argon2id (memory=64MB, iter=3, parallel=4) before storage.
- **AES-256-GCM**: All vault data is encrypted client-side. The server only stores encrypted blobs.
- **JWT sessions**: Short-lived access tokens (15 min) + refresh tokens (7 days) in httpOnly cookies.
- **CSRF protection**: Double-submit cookie pattern.
- **Rate limiting**: Per-endpoint rate limiting (auth: 5/15min, vault: 30/min, general: 100/min).
- **Helmet.js**: Security headers including HSTS, CSP, X-Frame-Options, X-Content-Type-Options.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Run development server (hot reload)
npm run dev
```

## API Endpoints

### Authentication
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Login, returns JWT + refresh token |
| POST | /api/auth/refresh | Rotate refresh token |
| POST | /api/auth/logout | Revoke refresh token |
| DELETE | /api/auth/account | Delete account + all data |
| POST | /api/auth/totp/setup | Generate TOTP secret |
| POST | /api/auth/totp/verify | Enable TOTP |
| DELETE | /api/auth/totp | Disable TOTP |

### Vault
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/vault | Get all encrypted entries + metadata |
| POST | /api/vault/sync | Delta sync |
| GET | /api/vault/export | Encrypted full backup |

### Entries
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/entries | List entry metadata |
| POST | /api/entries | Create encrypted entry |
| GET | /api/entries/:id | Get single encrypted entry |
| PUT | /api/entries/:id | Update encrypted entry |
| DELETE | /api/entries/:id | Soft-delete entry |
| POST | /api/entries/bulk-delete | Delete multiple entries |
| PATCH | /api/entries/:id/favorite | Toggle favorite |
| POST | /api/entries/:id/move | Move to folder |

### Folders
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/folders | List folders (with entry counts) |
| POST | /api/folders | Create folder |
| PUT | /api/folders/:id | Rename folder |
| DELETE | /api/folders/:id | Delete folder |
| PATCH | /api/folders/reorder | Reorder folders |

### Settings & Audit
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/settings | Get user settings |
| PUT | /api/settings | Batch update settings |
| GET | /api/audit | Paginated audit log |

### Health
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Server health check |

## Response Format

All endpoints return:
```json
{
  "success": true,
  "data": { ... },
  "error": "message if failed"
}
```

## Docker

### Production
```bash
docker compose up -d --build
```

### Development (hot reload)
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

## TLS

For local development, generate a self-signed cert:
```bash
mkdir -p data/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout data/certs/key.pem -out data/certs/cert.pem \
  -subj "/CN=localhost"
```

For production, mount your real certs to `/data/certs/` and terminate TLS at the Docker level.

## Tech Stack

- **Runtime**: Node.js 20 + TypeScript
- **Framework**: Express.js
- **Database**: SQLite (better-sqlite3, WAL mode)
- **KDF**: Argon2id
- **Encryption**: AES-256-GCM (client-side)
- **Auth**: JWT + Refresh Tokens
- **Validation**: Zod
- **Logging**: Winston
- **Container**: Docker + Docker Compose
