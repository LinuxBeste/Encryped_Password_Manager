// A single password vault entry
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

// Supported entry type categories
export type EntryType =
  | 'password'
  | 'note'
  | 'credit-card'
  | 'identity'
  | 'ssh-key';

// A custom field within a vault entry
export interface CustomField {
  id: string;
  label: string;
  value: string;
  hidden: boolean;
}

// A folder/group for organizing entries
export interface VaultFolder {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  entryCount: number;
}

// Full vault data from the server
export interface VaultData {
  id: string;
  name: string;
  entries: VaultEntry[];
  folders: VaultFolder[];
}

// Authenticated user account
export interface User {
  id: string;
  email: string;
  encryptedVaultKey: string;
  createdAt: number;
}

// Authentication and lock screen state
export interface AuthState {
  isAuthenticated: boolean;
  isLocked: boolean;
  isFirstRun: boolean;
  user: User | null;
  sessionToken: string | null;
  refreshToken: string | null;
}

// UI appearance and behavior preferences
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

// Available accent color options
export type AccentColor = 'blue' | 'purple' | 'green' | 'teal' | 'amber' | 'red';

// Security-related settings
export interface SecuritySettings {
  autoLockTimeout: number;
  autoLockOnSleep: boolean;
  clipboardClearTimeout: number;
  biometricUnlock: boolean;
  failedAttemptsBeforeLockout: number;
}

// Password generator configuration
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

// Server sync configuration
export interface SyncSettings {
  serverUrl: string;
  syncInterval: number;
  conflictResolution: 'server-wins' | 'client-wins' | 'ask';
}

// Backup schedule and location settings
export interface BackupSettings {
  autoBackup: 'never' | 'daily' | 'weekly' | 'monthly';
  backupLocation: string;
  keepLastN: number;
}

// All settings grouped by category
export interface Settings {
  ui: UISettings;
  security: SecuritySettings;
  generator: GeneratorSettings;
  sync: SyncSettings;
  backup: BackupSettings;
}

// Current sync status and event history
export interface SyncStatus {
  lastSync: number | null;
  status: 'idle' | 'syncing' | 'success' | 'error';
  error: string | null;
  events: SyncEvent[];
}

// A single sync event log entry
export interface SyncEvent {
  timestamp: number;
  type: 'sync-start' | 'sync-success' | 'sync-error' | 'conflict';
  message: string;
}

// Generic API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Password strength evaluation result
export interface PasswordScore {
  score: number;
  label: string;
  color: string;
  crackTime: string;
}

// A generated password with its strength score
export interface GeneratedPassword {
  password: string;
  score: PasswordScore;
}

// A TOTP one-time code with remaining validity
export interface TOTPCode {
  code: string;
  period: number;
  remaining: number;
}

// Electron IPC API exposed on window object
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
