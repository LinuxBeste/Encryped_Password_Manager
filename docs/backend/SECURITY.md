# Security Model

VaultLock uses a **zero-knowledge architecture**. The server can never access plaintext passwords or encryption keys.

## Encryption Flow

```
Client                    Server
  |                         |
  |-- master password ----->|  (argon2id hash stored for auth)
  |                         |
  |  PBKDF2(master, salt)   |
  |     → AES-256-GCM key   |  (client-only, never transmitted)
  |                         |
  |-- encrypted blob ------>|  (ciphertext + iv + authTag)
  |                         |
  |<-- encrypted blob ------|  (server returns stored ciphertext)
  |                         |
  |  AES-256-GCM.decrypt()  |
  |     → plaintext         |
```

## Key Hierarchy

1. **Master Password** — Known only to the user. Never stored or transmitted.
2. **Argon2id Key** — Derived from master password via Argon2id KDF. Used for server authentication (only the hash is stored).
3. **Vault Encryption Key** — Derived client-side via PBKDF2 from the master password + random salt. Used for AES-256-GCM encrypt/decrypt. **Never sent to the server.**

## What the Server Stores

- **Argon2id hash** of master password (authentication only)
- **Encrypted vault blobs** (AES-256-GCM ciphertext + IV + auth tag)
- **Metadata**: folder names (optionally encrypted), entry titles (optionally encrypted), UUIDs, timestamps, entry type
- **Refresh tokens** as SHA-256 hashes
- **Audit logs** (events, IPs, timestamps)
- **User settings** (UI preferences, sync config — not secrets)

## What the Server NEVER Stores

- Plaintext master password
- Vault encryption key
- Plaintext entry data (passwords, usernames, notes, URLs)
- Session tokens in plaintext (refresh tokens are always SHA-256 hashed)
- TOTP secrets in plaintext (only encrypted verification secret)

## Cryptographic Parameters

| Parameter | Value |
|-----------|-------|
| KDF (server auth) | Argon2id |
| Argon2 memory | 64 MB (65536 KiB) |
| Argon2 iterations | 3 |
| Argon2 parallelism | 4 |
| Encryption (vault data) | AES-256-GCM |
| IV size | 12 bytes (random, per encryption) |
| Auth tag size | 16 bytes |
| Key derivation (vault) | PBKDF2 (client-side) |
| JWT signing algorithm | HS256 |
| Refresh token hash | SHA-256 |

### Why These Parameters

- **Argon2id** — OWASP-recommended password hashing, resistant to GPU and side-channel attacks.
- **64 MB memory** — makes brute-force costly on consumer hardware while feasible on server during login.
- **AES-256-GCM** — authenticated encryption (confidentiality + integrity) with a 256-bit key.
- **12-byte random IV** per encryption ensures the same plaintext never produces the same ciphertext.
- **HS256** — HMAC-SHA256 for JWT signing, sufficient when using strong random secrets of adequate length.

## Session Security

### Token Lifecycle

```
Login → Access Token (15 min) + Refresh Token (7 days)
  │
  ├─ Every request: Access Token in Authorization header or httpOnly cookie
  │
  └─ On 401: Client calls /auth/refresh with Refresh Token
       → Old refresh token is revoked (SHA-256 hash compared)
       → New access + refresh tokens issued (rotation)
```

### Token Storage

| Token | Client storage | Server storage |
|---|---|---|
| Access token | Memory (Zustand) | Not stored |
| Refresh token | Memory (Zustand) | SHA-256 hash in DB |

### Protections

- **Access tokens** expire after 15 minutes, limiting the window of a stolen token.
- **Refresh tokens** expire after 7 days and are rotated on every use (old token is invalidated).
- **Refresh tokens** are stored as SHA-256 hashes — if the DB is compromised, tokens cannot be recovered.
- **httpOnly cookies** prevent XSS token theft (when using cookie transport).
- **CSRF double-submit cookie** pattern protects state-changing requests.

## CSRF Protection

The backend uses a **double-submit cookie** pattern:

1. A GET request sets a random CSRF cookie (signed, httpOnly: false, sameSite: strict).
2. State-changing requests (POST, PUT, DELETE, PATCH) must include the CSRF value in a custom header (`x-csrf-token`).
3. The server compares the cookie value against the header value.
4. An attacker's site cannot read the cookie (sameSite) or set custom headers (CORS).

## Rate Limiting

In-memory rate limiting using a sliding window per IP + route prefix:

| Scope | Limit | Window | Burst |
|---|---|---|---|
| Auth endpoints | 5 requests | 15 minutes | Strict |
| Vault endpoints | 30 requests | 1 minute | Moderate |
| All other endpoints | 100 requests | 1 minute | Generous |

Rate limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`) are set on every response. Exceeding the limit returns `429 Too Many Requests`.

## Audit Logging

All security-relevant events are logged to the `audit_log` table:

| Category | Events |
|---|---|
| Authentication | `auth.login`, `auth.register`, `auth.logout`, `auth.refresh` |
| Account | `account.delete` |
| Entries | `entry.create`, `entry.update`, `entry.delete` |
| Folders | `folder.create`, `folder.rename`, `folder.delete`, `folder.reorder` |
| Settings | `settings.update` |
| Export | `vault.export` |

Each audit event records: user ID, event type, IP address, user agent, and an optional metadata JSON blob.

## Threat Model

| Threat | Mitigation |
|---|---|
| **Database breach** | Plaintext data never stored. Only Argon2id hashes + encrypted blobs. |
| **XSS** | httpOnly cookies for auth tokens. CSP headers. Input validation. |
| **CSRF** | Double-submit cookie pattern. SameSite cookies. CORS origin check. |
| **Brute force login** | Argon2id (slow hashing). Rate limiting (5/15min). Account lockout after N failures. |
| **Token theft** | Short-lived access tokens (15 min). Refresh token rotation. SHA-256 hashed in DB. |
| **Man-in-the-middle** | TLS required at reverse proxy. HSTS headers. |
| **Side-channel** | Argon2id (constant-time comparison). Timing-safe JWT verification. |
| **Session fixation** | New session on every login/refresh. Old tokens revoked. |

## Security Headers (Helmet)

| Header | Value |
|---|---|
| `Content-Security-Policy` | Restricts script/style sources |
| `Strict-Transport-Security` | max-age=31536000; includeSubDomains |
| `X-Content-Type-Options` | nosniff |
| `X-Frame-Options` | DENY |
| `Referrer-Policy` | no-referrer |
| `X-DNS-Prefetch-Control` | off |
