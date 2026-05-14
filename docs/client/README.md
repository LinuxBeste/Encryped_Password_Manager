# VaultLock Client

Desktop password manager app built with **Electron + React 18 + TypeScript**.

## Tech Stack

| Category | Choice |
|---|---|
| UI | React 18.3, TypeScript 5.4+ |
| Bundler | Vite 5.3 (`@vitejs/plugin-react`) |
| Desktop | Electron 30.1, electron-builder 24.13 |
| Styling | Tailwind CSS 3.4, PostCSS, Lucide React icons |
| State | Zustand 4.5 with `persist` middleware (localStorage) |
| HTTP | Axios 1.7 with JWT auto-refresh interceptor |
| Client crypto | Web Crypto API (PBKDF2 + AES-256-GCM) |
| Password strength | zxcvbn 4.4 |
| TOTP | @otplib/core 12.0.1, @otplib/plugin-crypto 12.0.1 |
| Fonts | Geist (Google Fonts) |

## Project Structure

```
src/
├── App.tsx                    Root component with four view states
├── main.tsx                   React entry point
├── components/
│   ├── entries/               EntryCard, EntryDetail, EntryEditor, PasswordGenerator, TOTPDisplay
│   ├── folders/               FolderTree, FolderContextMenu
│   ├── layout/                Sidebar, EntryList, DetailPanel, TitleBar
│   ├── search/                GlobalSearch, SearchResult
│   ├── settings/              SettingsPage + tabs (General, Security, Appearance, etc.)
│   ├── ui/                    Reusable primitives (Button, Input, Modal, Select, Toggle, etc.)
│   └── vault/                 SetupWizard, UnlockScreen, LockOverlay
├── hooks/                     useVault, useSettings, useAutoLock, useClipboard, useCrypto, etc.
├── services/                  api.service, crypto.service, sync.service, backup.service
├── store/                     Zustand stores (auth, vault, ui, settings)
├── types/                     All TypeScript interfaces
└── utils/                     Password scoring, formatting helpers
electron/
├── main.ts                    Electron main process (window, tray, IPC, updater)
├── preload.ts                 Context bridge for renderer
├── tray.ts                    System tray management
├── updater.ts                 Auto-updater (GitHub releases)
└── tsconfig.electron.json     Separate TS config for Electron
```

## App States

The root `<App />` component renders one of four views:

1. **Setup Wizard** — First-run registration flow (server URL, account creation, recovery key)
2. **Unlock Screen** — Master password prompt for returning users
3. **Settings** — Full settings page (General, Security, Appearance, Generator, Sync, Backup, TOTP, Danger Zone)
4. **Main Vault** — Three-panel layout:

```
┌─────────────┬──────────────┬──────────────────────────────┐
│   Sidebar   │  Entry List  │      Detail / Editor         │
│             │              │                              │
│  All Items  │  [search]    │  Entry details or editor     │
│  Favorites  │  [+ add]     │  form with password gen      │
│  Passwords  │              │                              │
│  Notes      │  [filters]   │  ─ or ─                      │
│  ...        │              │                              │
│             │  card 1      │  Empty state with key icon   │
│  Folders    │  card 2      │                              │
│  └─ Add     │  card 3      │                              │
│             │              │                              │
│  Settings   │  12 entries  │                              │
│  Lock       │              │                              │
└─────────────┴──────────────┴──────────────────────────────┘
```

## State Management

Four Zustand stores, all using `zustand/middleware/persist` for localStorage survival:

| Store | Key | Data |
|---|---|---|
| `auth.store.ts` | `vaultlock-auth` | Auth state, user, tokens |
| `vault.store.ts` | `vaultlock-vault` | Entries, folders, vault metadata |
| `ui.store.ts` | (not persisted) | Selected nav, entry, panel view, search |
| `settings.store.ts` | `vaultlock-settings` | Full settings object |

## Scripts

| Command | Description |
|---|---|
| `pnpm dev:server` | Vite dev server on `http://localhost:5173` |
| `pnpm dev` | Compile Electron TS + Vite build + launch Electron |
| `pnpm start` | Production build + launch Electron |
| `pnpm build` | `tsc` + `vite build` (output to `dist/`) |
| `pnpm typecheck` | Run `tsc --noEmit` |
| `pnpm lint` | ESLint on `src/` |
| `pnpm build:mac` | Package macOS (dmg + zip) |
| `pnpm build:win` | Package Windows (NSIS) |
| `pnpm build:linux` | Package Linux (AppImage + deb) |

## Desktop Features (Electron)

- **System tray** with lock/unlock and context menu
- **Auto-lock** on system idle / sleep (configurable timeout)
- **Clipboard auto-clear** after configurable delay
- **Global search** via Ctrl+K / Cmd+K
- **Biometric unlock** (macOS Touch ID / Windows Hello)
- **Auto-updater** — checks GitHub releases for updates
- **Power monitor** — locks vault on system suspend
- **Custom title bar** — frameless on macOS, native frame on Linux/Windows

## Development

```bash
cd client
pnpm install

# Web-only (faster iteration)
pnpm dev:server

# Full Electron
pnpm dev
```

### Adding a New Component

1. Create the component file in the appropriate `src/components/` subdirectory
2. Follow existing patterns: functional component, named export, Tailwind classes
3. Import Lucide icons from `lucide-react`
4. Use UI primitives from `src/components/ui/` for consistency

### State Flow

```
User action → Component → Zustand action → Store update → Re-render
                         ↕ (if API call)
                    api.service.ts → Backend
```

## Production Build

```bash
# Build and package for current platform
pnpm start

# Package for distribution
pnpm build:mac
pnpm build:win
pnpm build:linux
```

Artifacts are output to `release/`. macOS builds are signed and notarized if `APPLE_ID` and `APPLE_APP_SPECIFIC_PASSWORD` env vars are set.

## Client-Side Encryption

Encryption happens entirely in the renderer process using the Web Crypto API:

1. **Key derivation**: `PBKDF2(passphrase, salt, iterations) → AES-256-GCM key`
2. **Encryption**: `AES-256-GCM.encrypt(plaintext, key) → ciphertext + iv + authTag`
3. **Decryption**: `AES-256-GCM.decrypt(ciphertext, key, iv, authTag) → plaintext`

The vault encryption key is **never sent to the server** — only encrypted blobs are transmitted.

See `src/services/crypto.service.ts` and `src/hooks/useCrypto.ts`.
