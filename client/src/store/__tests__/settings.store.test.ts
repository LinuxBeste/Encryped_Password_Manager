import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSettingsStore } from '../settings.store';
import type { Settings } from '@/types';

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
    autoLockTimeout: 300000,
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
    syncInterval: 300000,
    conflictResolution: 'server-wins',
  },
  backup: {
    autoBackup: 'weekly',
    backupLocation: '',
    keepLastN: 10,
  },
};

describe('settings.store', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      settings: { ...defaultSettings },
      loaded: false,
    });
  });

  describe('updateUI', () => {
    it('updates UI settings', () => {
      useSettingsStore.getState().updateUI({ theme: 'light', compactMode: true });
      const { ui } = useSettingsStore.getState().settings;
      expect(ui.theme).toBe('light');
      expect(ui.compactMode).toBe(true);
      expect(ui.accentColor).toBe('blue');
    });
  });

  describe('updateSecurity', () => {
    it('updates security settings', () => {
      useSettingsStore.getState().updateSecurity({ autoLockTimeout: 60000, biometricUnlock: true });
      const { security } = useSettingsStore.getState().settings;
      expect(security.autoLockTimeout).toBe(60000);
      expect(security.biometricUnlock).toBe(true);
    });
  });

  describe('updateGenerator', () => {
    it('updates generator settings', () => {
      useSettingsStore.getState().updateGenerator({ defaultLength: 30, useSymbols: false });
      const { generator } = useSettingsStore.getState().settings;
      expect(generator.defaultLength).toBe(30);
      expect(generator.useSymbols).toBe(false);
    });
  });

  describe('updateSync', () => {
    it('updates sync settings', () => {
      useSettingsStore.getState().updateSync({ serverUrl: 'https://example.com/api', syncInterval: 60000 });
      const { sync } = useSettingsStore.getState().settings;
      expect(sync.serverUrl).toBe('https://example.com/api');
      expect(sync.syncInterval).toBe(60000);
    });
  });

  describe('updateBackup', () => {
    it('updates backup settings', () => {
      useSettingsStore.getState().updateBackup({ autoBackup: 'daily', keepLastN: 5 });
      const { backup } = useSettingsStore.getState().settings;
      expect(backup.autoBackup).toBe('daily');
      expect(backup.keepLastN).toBe(5);
    });
  });

  describe('resetSettings', () => {
    it('resets to defaults', () => {
      useSettingsStore.getState().updateUI({ theme: 'light' });
      useSettingsStore.getState().resetSettings();
      expect(useSettingsStore.getState().settings).toEqual(defaultSettings);
    });
  });

  describe('loadSettings', () => {
    it('sets loaded to true when electronAPI is not available', async () => {
      await useSettingsStore.getState().loadSettings();
      expect(useSettingsStore.getState().loaded).toBe(true);
    });

    it('loads settings from electronAPI when available', async () => {
      const storedSettings = { ui: { theme: 'light' } };
      (window as any).electronAPI = {
        settings: {
          get: vi.fn().mockResolvedValue(storedSettings),
        },
      };

      await useSettingsStore.getState().loadSettings();
      expect(useSettingsStore.getState().settings.ui.theme).toBe('light');
      expect(useSettingsStore.getState().loaded).toBe(true);

      delete (window as any).electronAPI;
    });
  });

  describe('saveSettings', () => {
    it('saves settings via electronAPI when available', async () => {
      const mockSet = vi.fn().mockResolvedValue(true);
      (window as any).electronAPI = {
        settings: {
          set: mockSet,
        },
      };

      useSettingsStore.getState().updateUI({ theme: 'light' });
      expect(mockSet).toHaveBeenCalled();

      delete (window as any).electronAPI;
    });

    it('does not throw when electronAPI is unavailable', async () => {
      await expect(useSettingsStore.getState().saveSettings()).resolves.not.toThrow();
    });
  });
});
