# VaultLock

**Zero-knowledge, offline-first encrypted password manager** — built with a TypeScript + Express backend and an Electron + React desktop client, both using AES-256-GCM encryption with Argon2id key derivation.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-47848F?logo=electron&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![better-sqlite3](https://img.shields.io/badge/better--sqlite3-003B57?logo=sqlite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?logo=tailwindcss&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-443E38?logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?logo=jsonwebtokens&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-2E67D9?logo=zod&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![Argon2](https://img.shields.io/badge/Argon2-872B7E?logo=argo&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?logo=axios&logoColor=white)
![Lucide](https://img.shields.io/badge/Lucide-F56565?logo=lucide&logoColor=white)
![Helmet](https://img.shields.io/badge/Helmet-DC2626?logo=helmet&logoColor=white)

## Releases

[![Releases](https://img.shields.io/badge/Releases-GitHub-blue?logo=github)](https://github.com/linuxbeste/Encryped_Password_Manager/releases)

## Architecture

```
vaultlock/
├── backend/          REST API (Node.js, Express, SQLite, JWT + TOTP auth)
├── client/           Desktop app (Electron, React 18, Vite, Tailwind CSS, Zustand)
├── docs/             Documentation
│   └── backend/      API reference, security model, deployment guide
├── website/          Landing page (React 19, Vite, Tailwind CSS 4)
├── docker-compose.yml         Production deployment
├── docker-compose.dev.yml     Development with hot reload
└── .github/          CI/CD workflows
```

## Quick Start

### Backend

```bash
cd backend
cp .env.example .env
pnpm install
pnpm dev                    # ts-node-dev on http://localhost:3000

# or with Docker:
docker compose -f docker-compose.dev.yml up --build
```

### Client (Desktop)

```bash
cd client
pnpm install
pnpm dev:server             # Web-only dev on http://localhost:5173
pnpm dev                    # Full Electron app
```

### Website (Landing Page)

```bash
cd website
pnpm install
pnpm dev                    # Vite dev server on http://localhost:5173
```

## Backend

| Stack | |
|---|---|
| Runtime | Node.js 22, TypeScript 5.4+ |
| Framework | Express 4.19 |
| Database | SQLite via better-sqlite3 (WAL mode) |
| Auth | JWT (access + refresh tokens), Argon2id password hashing, TOTP 2FA |
| Encryption | AES-256-GCM (client-side via Web Crypto API) |
| Security | Helmet, CORS, CSRF (double-submit cookie), in-memory rate limiting |
| Validation | Zod 3.23 |

### API Routes

| Prefix | Endpoints |
|---|---|
| `POST /api/auth/register` | Create account |
| `POST /api/auth/login` | Authenticate |
| `POST /api/auth/refresh` | Rotate tokens |
| `GET /api/vault` | Full vault export |
| `GET/POST /api/entries` | List / create entries |
| `GET/PUT/DELETE /api/entries/:id` | Read / update / soft-delete entry |
| `POST /api/entries/:id/favorite` | Toggle favorite |
| `PATCH /api/entries/move` | Move entries to folder |
| `POST /api/entries/bulk-delete` | Bulk soft-delete |
| `GET/POST /api/folders` | List / create folders |
| `PUT/DELETE /api/folders/:id` | Rename / delete folder |
| `PATCH /api/folders/reorder` | Reorder folders |
| `GET/PUT /api/settings` | User settings |
| `GET /api/audit` | Audit log (paginated) |
| `GET /api/health` | Health check |

### Key Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `JWT_SECRET` | — | Secret for signing tokens |
| `JWT_EXPIRES_IN` | `15m` | Access token TTL |
| `REFRESH_TOKEN_EXPIRES_IN_MS` | `604800000` | Refresh token TTL (7 days) |
| `DB_PATH` | `./data/vaultlock.db` | SQLite file path |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed client origin |
| `ARGON2_MEMORY` | `65536` | Argon2 memory cost (KB) |
| `ARGON2_ITERATIONS` | `3` | Argon2 time cost |
| `TOTP_ENABLED` | `true` | Enable 2FA setup |

Full list in `backend/.env.example`.

## Client

| Stack | |
|---|---|
| UI | React 18.3, TypeScript 5.4+ |
| Bundler | Vite 5.3 |
| Desktop | Electron 30.1 (electron-builder 24.13) |
| Styling | Tailwind CSS 3.4, Lucide React icons |
| State | Zustand 4.5 (persisted to localStorage) |
| HTTP | Axios 1.7 with JWT auto-refresh interceptor |
| Crypto | Web Crypto API (PBKDF2 + AES-256-GCM) |
| Password strength | zxcvbn 4.4 |

### Scripts

| Command | Description |
|---|---|
| `pnpm dev:server` | Vite dev server on `:5173` |
| `pnpm dev` | Full Electron app with dev build |
| `pnpm start` | Production Electron app |
| `pnpm build:mac` | Package macOS (dmg + zip) |
| `pnpm build:win` | Package Windows (NSIS) |
| `pnpm build:linux` | Package Linux (AppImage + deb) |
| `pnpm typecheck` | TypeScript type checking |

### Desktop Features

- System tray with lock/unlock
- Auto-lock on idle / sleep
- Clipboard auto-clear timer
- Power monitor integration
- Auto-updater (GitHub releases)
- Global search (Ctrl+K / Cmd+K)
- Biometric unlock (macOS Touch ID / Windows Hello)

## Security

VaultLock uses a **zero-knowledge architecture**:

- Your master password never leaves the client
- AES-256-GCM encryption keys are derived client-side via PBKDF2
- The server stores only Argon2id-hashed master password hashes and encrypted ciphertext
- JWT access tokens (15 min) + refresh tokens (7 days, SHA-256 hashed, rotated on use)
- CSRF protection via double-submit cookie pattern
- Rate limiting per endpoint
- Audit logging of all sensitive operations

See [docs/backend/SECURITY.md](docs/backend/SECURITY.md) for the full security model.

## Deployment

### Production (Docker)

```bash
cp backend/.env.example .env
# Edit .env with strong secrets
docker compose up -d --build
```

The server listens on port **3443** with health checks. Terminate TLS at the reverse proxy (Caddy, Nginx, Traefik).

### Building the Desktop App

```bash
cd client
# macOS
pnpm build:mac

# Windows (cross-compile on macOS/Linux requires Wine)
pnpm build:win

# Linux
pnpm build:linux
```

Artifacts go to `client/release/`.

## Commiting

!IMPORTANT: Never commit secrets or keys. The `.env` file and `recovery-key.txt` are gitignored.
