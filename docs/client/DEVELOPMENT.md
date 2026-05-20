# Client Development Guide

## Setup

```bash
cd client
pnpm install

# Web-only dev (fastest iteration)
pnpm dev:server              # http://localhost:5173

# Full Electron app
pnpm dev                     # tsc (electron) + vite build + electron .
```

## Project Map

```
src/
├── main.tsx                  React entry point (React.StrictMode → <App />)
├── App.tsx                   Root component: routing between Setup/Unlock/Main/Settings
├── types/index.ts            All TypeScript interfaces (VaultEntry, VaultFolder, Settings, etc.)
├── components/
│   ├── entries/              EntryCard, EntryDetail, EntryEditor, PasswordGenerator, TOTPDisplay
│   ├── folders/              FolderTree, FolderContextMenu
│   ├── layout/               Sidebar, EntryList, DetailPanel, TitleBar
│   ├── search/               GlobalSearch, SearchResult
│   ├── settings/             SettingsPage + 9 tabs
│   │   └── tabs/             General, Security, Appearance, Generator, Sync, Backup, TOTP, Shortcuts, DangerZone
│   ├── ui/                   Primitives (Button, Input, Modal, Select, Toggle, Tooltip, etc.)
│   └── vault/                SetupWizard, UnlockScreen, LockOverlay
├── hooks/                    useVault, useSettings, useAutoLock, useClipboard, useCrypto, useSearch, etc.
├── services/                 api.service, crypto.service, sync.service, backup.service
├── store/                    Zustand stores (auth, vault, ui, settings)
└── utils/                    format.ts, password.ts
electron/
├── main.ts                   BrowserWindow, tray, IPC handlers
├── preload.ts                Context bridge (clipboard, settings, window, vault, backup APIs)
├── tray.ts                   System tray icon + menu
├── updater.ts                GitHub releases auto-updater
└── tsconfig.electron.json    Separate TS config (CommonJS for Electron main process)
```

## App States

`App.tsx` renders one of four views depending on auth state:

| State | Condition | Component |
|---|---|---|
| First run | `isFirstRun && !isAuthenticated` | `SetupWizard` |
| Locked | `!isAuthenticated \|\| isLocked` | `UnlockScreen` |
| Settings | `showSettings === true` | `SettingsPage` |
| Main vault | default | 3-panel layout |

### Main Vault Layout

```
┌─────────────────┬──────────────────┬──────────────────────────────┐
│   Sidebar (w-60)│  EntryList (w-300)│  DetailPanel / EntryEditor   │
│                 │                  │                              │
│  VaultLock logo │  [Search...] [+] │  Entry details or editor     │
│                 │                  │  with password generator     │
│  All Items      │  All Favorites   │                              │
│  Favorites      │  Weak Reused Old │  — or —                      │
│  Passwords      │                  │                              │
│  ...            │  A-Z ▾           │  Empty state (key icon)      │
│                 │                  │                              │
│  ▾ Folders      │  card            │                              │
│     Add folder  │  card            │                              │
│                 │                  │                              │
│  Settings  Lock  │  12 entries      │                              │
└─────────────────┴──────────────────┴──────────────────────────────┘
```

## State Management

Four Zustand stores:

| Store | File | Persisted | Key | Data |
|---|---|---|---|---|
| Auth | `auth.store.ts` | Yes | `vaultlock-auth` | user, tokens, locked/firstRun state |
| Vault | `vault.store.ts` | Yes | `vaultlock-vault` | entries[], folders[], vaultId |
| UI | `ui.store.ts` | No | — | selectedNav, selectedEntry, panelView, searchQuery, contextMenu |
| Settings | `settings.store.ts` | Yes | `vaultlock-settings` | Full Settings object |

### State Flow

```
User clicks → Component handler → Zustand store action → React re-render
                                      ↕
                              api.service.ts → Backend
```

### When to Add State to Store vs Local

| Store | Use for |
|---|---|
| Zustand (persisted) | Data that must survive refresh (entries, auth, settings) |
| Zustand (not persisted) | UI state shared across components (selected entry, panel view) |
| React useState | Component-local UI state (dropdown open, form input values) |

## Components

### UI Primitives (`src/components/ui/`)

Reusable components with consistent styling:

| Component | Props | Description |
|---|---|---|
| `Button` | `variant: 'primary' \| 'secondary' \| 'ghost'`, `size: 'sm' \| 'md' \| 'lg'`, `loading`, `disabled` | Styled button with loading spinner |
| `Input` | `label`, `error`, `type`, standard input props | Labeled input with error state |
| `PasswordField` | `value`, `onChange`, `showStrength`, `strengthScore` | Password input with toggle visibility + strength meter |
| `Select` | `label`, `options: {value, label}[]` | Styled select dropdown |
| `Modal` | `open`, `onClose`, `title`, `children` | Dialog overlay |
| `Toggle` | `checked`, `onChange`, `label` | Switch toggle |
| `Tooltip` | `content`, `children` | Hover tooltip |
| `ContextMenu` | `position`, `items[]`, `onClose` | Right-click menu |
| `EmptyState` | `icon`, `title`, `message`, `action?` | Empty state placeholder |
| `Spinner` | — | Loading spinner |

Always use these instead of raw HTML elements for consistency.

### Entry Components

| Component | Role |
|---|---|
| `EntryCard` | List item in EntryList — shows icon, title, username, date |
| `EntryDetail` | Full detail view of an entry — shows all fields with copy buttons |
| `EntryEditor` | Create/edit form — title, type, username, password (with generator), URL, notes, folder |
| `PasswordGenerator` | Modal with password generation options |
| `TOTPDisplay` | TOTP code display with countdown |

### Adding a New Component

1. Create file in the appropriate subdirectory
2. Import types from `@/types`
3. Import UI primitives from `@/components/ui/`
4. Use Tailwind utility classes for styling
5. Export as named function
6. Follow existing naming conventions

```tsx
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { VaultEntry } from '@/types';

interface MyComponentProps {
  entry: VaultEntry;
  onAction: () => void;
}

export function MyComponent({ entry, onAction }: MyComponentProps) {
  return (
    <div className="flex items-center gap-2 p-3">
      <Button variant="primary" size="sm" onClick={onAction}>
        <Plus className="w-4 h-4" />
        Action
      </Button>
    </div>
  );
}
```

## Styling

### Tailwind + CSS Variables

All colors are CSS custom properties defined in `index.html`. The Tailwind config maps them:

```css
/* index.html */
:root {
  --bg-app: #0f0f0f;
  --bg-panel: #161616;
  --bg-surface: #1e1e1e;
  --accent: #4f8cff;
  /* ... */
}
```

```ts
// tailwind.config.ts
colors: {
  app: 'var(--bg-app)',
  panel: 'var(--bg-panel)',
  accent: 'var(--accent)',
}
```

Usage: `className="bg-panel text-text-primary"`

### Dark Mode

Controlled by `class` strategy — add `dark` class to `<html>` to switch theme. The theme toggle sets both localStorage and the DOM class.

### Font Scale

| Token | Size | Line Height | Usage |
|---|---|---|---|
| `caption` | 11px | 14px | Labels, counts, timestamps |
| `body` | 13px | 18px | Default text |
| `ui` | 14px | 20px | Nav items, buttons |
| `heading` | 16px | 22px | Section headers |
| `display` | 20px | 28px | Page titles |

### Icons

Use Lucide React: `import { KeyRound, Plus, Search } from 'lucide-react'`. Icons are always `w-4 h-4` unless specified otherwise.

## Client-Side Encryption

Encryption uses the Web Crypto API. Flow:

```
User enters master password
  → PBKDF2(password + email, salt, 600000 iterations)
  → AES-256-GCM key (CryptoKey object, never serialized)
  → encrypt(plaintext, key) → { ciphertext, iv, salt } (all base64)
  → decrypt({ ciphertext, iv, salt }, password, email) → plaintext
```

Key functions in `src/services/crypto.service.ts`:

| Function | Returns | Notes |
|---|---|---|
| `generateSalt()` | `Uint8Array` (32 bytes) | Random salt |
| `deriveKey(password, email, salt?)` | `{ key: CryptoKey, salt }` | PBKDF2-SHA256 |
| `encrypt(plaintext, key, salt)` | `EncryptedData` | AES-256-GCM |
| `encryptData(data, password, email)` | `EncryptedData` | Convenience: salt + derive + encrypt |
| `decrypt(data, password, email)` | `string` | Re-derives key, decrypts |

The encryption key is **never stored or transmitted** — only the salt is saved alongside the ciphertext so the key can be re-derived.

## Electron

### Main Process (`electron/main.ts`)

Creates a `BrowserWindow` (1200×800, min 900×600) with:
- `titleBarStyle: 'hidden'` on macOS (frameless with traffic lights)
- Native frame on Linux/Windows
- System tray with lock/unlock and quit
- Power monitor auto-lock on suspend
- IPC handlers for clipboard, settings, window control, vault lock

### Preload (`electron/preload.ts`)

Exposes a secure API via `contextBridge`:

```ts
window.electronAPI = {
  clipboard: { write, clear },
  settings: { get, set },
  window: { minimize, maximize, close },
  vault: { lock, unlocked, onLock, onFocus },
  backup: { export, import },
};
```

### Adding an IPC Handler

1. Add handler in `electron/main.ts`: `ipcMain.handle('channel', handler)`
2. Add method to preload in `electron/preload.ts`
3. Add type to `window.electronAPI` in `src/types/index.ts`
4. Call from renderer: `window.electronAPI.<method>()`

### Window Controls

The title bar has custom minimize/maximize/close buttons on all platforms. On macOS (`darwin`), the native traffic lights are shown alongside.

## Vite Config

| Setting | Value | Reason |
|---|---|---|
| `base` | `'./'` | Relative paths for Electron `file://` |
| `resolve.alias` | `@` → `src/` | Clean imports |
| `build.outDir` | `dist` | Default |
| `server.port` | `5173` | Dev server |

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | `tsc` (electron TS) → `vite build` (dev mode) → `electron .` |
| `pnpm dev:server` | `vite` dev server only |
| `pnpm start` | `tsc` (electron TS) → `vite build` (prod) → `electron .` |
| `pnpm build` | `tsc --noEmit` (typecheck) → `vite build` → `tsc` (electron) |
| `pnpm lint` | `eslint src/ electron/ --ext .ts,.tsx` |
| `pnpm typecheck` | `tsc --noEmit` (app + electron) |
| `pnpm build:mac` | `electron-builder --mac --config electron-builder.config.ts` (dmg + zip) |
| `pnpm build:win` | `electron-builder --win --config electron-builder.config.ts` (NSIS) |
| `pnpm build:linux` | `electron-builder --linux --config electron-builder.config.ts` (AppImage + deb + pacman) |

## Common Tasks

### Add a New Page/View

1. Create component in `src/components/<area>/`
2. Add state in `src/store/ui.store.ts` if needed
3. Add route in `App.tsx` (early return before main layout)
4. Wire up navigation from Sidebar or other components

### Add a New API Call

1. Add function in `src/hooks/useVault.ts` (or create a new hook)
2. Use `getApi()` to make the request
3. Update the relevant Zustand store on success
4. Call the hook from your component

### Add a New Setting

1. Add field to `Settings` interface in `src/types/index.ts`
2. Add default in `src/store/settings.store.ts`
3. Add UI control in the appropriate tab under `src/components/settings/tabs/`
4. The `useSettings` hook auto-syncs to the backend

### Debugging

```bash
# Web dev with React DevTools
pnpm dev:server

# Electron dev with DevTools (auto-opens)
pnpm dev

# Inspect Electron main process
pnpm dev --inspect=9229
```

## Architecture Decisions

### Why Zustand over Redux?

- Minimal boilerplate — no actions, reducers, or dispatch
- Built-in `persist` middleware for localStorage
- TypeScript-first with no extra type annotations
- Small bundle size (~1KB)

### Why Vite over Webpack?

- Near-instant HMR (ES modules, no bundling in dev)
- Faster production builds (esbuild minification)
- Simpler configuration
- Native TypeScript support (esbuild transpilation)

### Why Tailwind over CSS-in-JS?

- Consistent design system via config
- No runtime overhead
- Small bundle (purged unused classes in production)
- Easy theming via CSS variables

### Why No Test Framework Yet?

The client is in active development and tests will be added once the core UI stabilizes. When adding tests, use Vitest (Vite-native, same config as build) with React Testing Library.
