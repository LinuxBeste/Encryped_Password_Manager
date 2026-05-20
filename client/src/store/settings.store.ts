import { create } from 'zustand';
import type { Settings, UISettings, SecuritySettings, GeneratorSettings, SyncSettings, BackupSettings } from '@/types';

const defaultSettings: Settings = {
  ui: {
    theme: 'dark',
    accentColor: 'blue',
    fontSize: 'medium',
    compactMode: false,
    showFavicons: true,
    animateTransitions: true,
    language: 'en',
    defaultEntryType: 'password',
    showEntryCountInSidebar: true,
    confirmBeforeDelete: true,
    minimizeToTray: true,
    showSource: 'all',
  },
  security: {
    autoLockTimeout: 5 * 60 * 1000,
    autoLockOnSleep: true,
    clipboardClearTimeout: 30000,
    biometricUnlock: false,
    failedAttemptsBeforeLockout: 5,
    localPasswordCheck: true,
  },
  generator: {
    defaultLength: 20,
    useUppercase: true,
    useLowercase: true,
    useNumbers: true,
    useSymbols: true,
    excludeAmbiguous: true,
    useWords: false,
    wordSeparator: '-',
    capitalizeWords: true,
    includeNumber: true,
    wordCount: 4,
  },
  sync: {
    serverUrl: 'http://localhost:3000/api',
    syncInterval: 5 * 60 * 1000,
    conflictResolution: 'server-wins',
  },
  backup: {
    autoBackup: 'weekly',
    backupLocation: '',
    keepLastN: 10,
  },
};

interface SettingsState {
  settings: Settings;
  loaded: boolean;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
  updateUI: (updates: Partial<UISettings>) => void;
  updateSecurity: (updates: Partial<SecuritySettings>) => void;
  updateGenerator: (updates: Partial<GeneratorSettings>) => void;
  updateSync: (updates: Partial<SyncSettings>) => void;
  updateBackup: (updates: Partial<BackupSettings>) => void;
  resetSettings: () => void;
}

// Settings store with persistence via electronAPI and per-category updaters
export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,
  loaded: false,

  // Load persisted settings from electron store
  loadSettings: async () => {
    try {
      if (window.electronAPI) {
        const stored = await window.electronAPI.settings.get();
        if (stored && Object.keys(stored).length > 0) {
          set({ settings: { ...defaultSettings, ...stored } as Settings, loaded: true });
          return;
        }
      }
      set({ loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  // Persist current settings to electron store
  saveSettings: async () => {
    const { settings } = get();
    try {
      if (window.electronAPI) {
        await window.electronAPI.settings.set(settings as unknown as Record<string, unknown>);
      }
    } catch { /* ignore */ }
  },

  updateUI: (updates) => {
    set((state) => ({ settings: { ...state.settings, ui: { ...state.settings.ui, ...updates } } }));
    get().saveSettings();
  },

  updateSecurity: (updates) => {
    set((state) => ({ settings: { ...state.settings, security: { ...state.settings.security, ...updates } } }));
    get().saveSettings();
  },

  updateGenerator: (updates) => {
    set((state) => ({ settings: { ...state.settings, generator: { ...state.settings.generator, ...updates } } }));
    get().saveSettings();
  },

  updateSync: (updates) => {
    set((state) => ({ settings: { ...state.settings, sync: { ...state.settings.sync, ...updates } } }));
    get().saveSettings();
  },

  updateBackup: (updates) => {
    set((state) => ({ settings: { ...state.settings, backup: { ...state.settings.backup, ...updates } } }));
    get().saveSettings();
  },

  resetSettings: () => {
    set({ settings: defaultSettings });
    get().saveSettings();
  },
}));
