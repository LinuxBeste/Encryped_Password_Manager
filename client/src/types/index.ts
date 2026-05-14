export interface VaultEntry {
  id: string;
  vaultId: string;
  folderId: string | null;
  type: EntryType;
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  totpSecret: string | null;
  tags: string[];
  customFields: CustomField[];
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

export type EntryType =
  | 'password'
  | 'note'
  | 'credit-card'
  | 'identity'
  | 'ssh-key';

export interface CustomField {
  id: string;
  label: string;
  value: string;
  hidden: boolean;
}

export interface VaultFolder {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  entryCount: number;
}

export interface VaultData {
  id: string;
  name: string;
  entries: VaultEntry[];
  folders: VaultFolder[];
}

export interface User {
  id: string;
  email: string;
  encryptedVaultKey: string;
  createdAt: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLocked: boolean;
  isFirstRun: boolean;
  user: User | null;
  sessionToken: string | null;
  refreshToken: string | null;
}

export interface UISettings {
  theme: 'system' | 'dark' | 'light';
  accentColor: AccentColor;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  showFavicons: boolean;
  animateTransitions: boolean;
  language: string;
  defaultEntryType: EntryType;
  showEntryCountInSidebar: boolean;
  confirmBeforeDelete: boolean;
  minimizeToTray: boolean;
}

export type AccentColor = 'blue' | 'purple' | 'green' | 'teal' | 'amber' | 'red';

export interface SecuritySettings {
  autoLockTimeout: number;
  autoLockOnSleep: boolean;
  clipboardClearTimeout: number;
  biometricUnlock: boolean;
  failedAttemptsBeforeLockout: number;
}

export interface GeneratorSettings {
  defaultLength: number;
  useUppercase: boolean;
  useLowercase: boolean;
  useNumbers: boolean;
  useSymbols: boolean;
  excludeAmbiguous: boolean;
  useWords: boolean;
  wordSeparator: string;
  capitalizeWords: boolean;
  includeNumber: boolean;
  wordCount: number;
}

export interface SyncSettings {
  serverUrl: string;
  syncInterval: number;
  conflictResolution: 'server-wins' | 'client-wins' | 'ask';
}

export interface BackupSettings {
  autoBackup: 'never' | 'daily' | 'weekly' | 'monthly';
  backupLocation: string;
  keepLastN: number;
}

export interface Settings {
  ui: UISettings;
  security: SecuritySettings;
  generator: GeneratorSettings;
  sync: SyncSettings;
  backup: BackupSettings;
}

export interface SyncStatus {
  lastSync: number | null;
  status: 'idle' | 'syncing' | 'success' | 'error';
  error: string | null;
  events: SyncEvent[];
}

export interface SyncEvent {
  timestamp: number;
  type: 'sync-start' | 'sync-success' | 'sync-error' | 'conflict';
  message: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PasswordScore {
  score: number;
  label: string;
  color: string;
  crackTime: string;
}

export interface GeneratedPassword {
  password: string;
  score: PasswordScore;
}

export interface TOTPCode {
  code: string;
  period: number;
  remaining: number;
}

declare global {
  interface Window {
    electronAPI: {
      clipboard: {
        write: (text: string) => Promise<boolean>;
        clear: () => Promise<void>;
      };
      settings: {
        get: () => Promise<Record<string, unknown>>;
        set: (settings: Record<string, unknown>) => Promise<boolean>;
      };
      window: {
        minimize: () => Promise<void>;
        maximize: () => Promise<void>;
        close: () => Promise<void>;
      };
      app: {
        version: () => Promise<string>;
      };
      vault: {
        lock: () => Promise<boolean>;
        unlocked: () => Promise<boolean>;
        onLock: (callback: () => void) => () => void;
        onFocus: (callback: () => void) => () => void;
      };
      backup: {
        export: (content: string, defaultName: string) => Promise<boolean>;
        import: () => Promise<string | null>;
      };
    };
  }
}
