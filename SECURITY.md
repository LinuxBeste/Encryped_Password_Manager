# Security Model

VaultLock uses a **zero-knowledge architecture**. The server can never access plaintext passwords or encryption keys.

## Encryption Flow

```
Client                    Server
  |                         |
  |-- master password ----->|  (argon2id hash stored)
  |                         |
  |-- encrypted blob ------>|  (AES-256-GCM, key never sent)
  |                         |
  |<-- encrypted blob ------|  (server returns stored ciphertext)
```

## Key Hierarchy

1. **Master Password** — Known only to the user. Never stored or transmitted.
2. **Argon2id Key** — Derived from master password. Used only for authentication (hash stored server-side).
3. **Vault Encryption Key** — Client-side AES-256-GCM key. **Never sent to the server.**

## What the Server Stores

- **Argon2id hash** of master password (authentication only)
- **Encrypted vault blobs** (AES-256-GCM ciphertext + IV + auth tag)
- **Metadata**: folder names (optionally encrypted), entry titles (optionally encrypted), UUIDs, timestamps

## What the Server NEVER Stores

- Plaintext master password
- Vault encryption key
- Plaintext entry data
- Session tokens in plaintext (refresh tokens are SHA-256 hashed)

## Cryptographic Parameters

| Parameter | Value |
|-----------|-------|
| KDF | Argon2id |
| Argon2 memory | 64 MB |
| Argon2 iterations | 3 |
| Argon2 parallelism | 4 |
| Encryption | AES-256-GCM |
| IV size | 12 bytes (random) |
| Auth tag size | 16 bytes |
| JWT signing | HS256 |
| Refresh token hash | SHA-256 |

## Session Security

- Access tokens expire after **15 minutes**
- Refresh tokens expire after **7 days**
- Refresh tokens are stored as SHA-256 hashes
- Token rotation on every refresh
- httpOnly cookies prevent XSS token theft
- CSRF double-submit cookie pattern
