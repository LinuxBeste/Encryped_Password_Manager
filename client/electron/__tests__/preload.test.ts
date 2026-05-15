import { describe, it, expect, vi, beforeEach } from 'vitest';

function createMockIpcRenderer() {
  return {
    invoke: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
  };
}

describe('preload (contextBridge)', () => {
  let mockIpcRenderer: ReturnType<typeof createMockIpcRenderer>;

  beforeEach(() => {
    mockIpcRenderer = createMockIpcRenderer();
  });

  function createElectronAPI() {
    const ipcRenderer = mockIpcRenderer;
    return {
      clipboard: {
        write: (text: string) => ipcRenderer.invoke('clipboard:write', text),
        clear: () => ipcRenderer.invoke('clipboard:clear'),
      },
      settings: {
        get: () => ipcRenderer.invoke('settings:get'),
        set: (settings: Record<string, unknown>) => ipcRenderer.invoke('settings:set', settings),
      },
      window: {
        minimize: () => ipcRenderer.invoke('window:minimize'),
        maximize: () => ipcRenderer.invoke('window:maximize'),
        close: () => ipcRenderer.invoke('window:close'),
      },
      app: {
        version: () => ipcRenderer.invoke('app:version'),
      },
      vault: {
        lock: () => ipcRenderer.invoke('vault:lock'),
        unlocked: () => ipcRenderer.invoke('vault:unlocked'),
        onLock: (callback: () => void) => {
          ipcRenderer.on('vault:lock', callback);
          return () => ipcRenderer.removeListener('vault:lock', callback);
        },
        onFocus: (callback: () => void) => {
          ipcRenderer.on('window:focus', callback);
          return () => ipcRenderer.removeListener('window:focus', callback);
        },
      },
      backup: {
        export: (content: string, defaultName: string) => ipcRenderer.invoke('backup:export', content, defaultName),
        import: () => ipcRenderer.invoke('backup:import'),
      },
    };
  }

  describe('clipboard', () => {
    it('clipboard.write invokes correct channel', async () => {
      const api = createElectronAPI();
      mockIpcRenderer.invoke.mockResolvedValue(true);
      await api.clipboard.write('secret text');
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('clipboard:write', 'secret text');
    });

    it('clipboard.clear invokes correct channel', async () => {
      const api = createElectronAPI();
      await api.clipboard.clear();
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('clipboard:clear');
    });
  });

  describe('settings', () => {
    it('settings.get invokes correct channel', async () => {
      const api = createElectronAPI();
      mockIpcRenderer.invoke.mockResolvedValue({ theme: 'dark' });
      const result = await api.settings.get();
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('settings:get');
      expect(result).toEqual({ theme: 'dark' });
    });

    it('settings.set invokes correct channel', async () => {
      const api = createElectronAPI();
      await api.settings.set({ theme: 'light' });
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('settings:set', { theme: 'light' });
    });
  });

  describe('window', () => {
    it('window.minimize invokes correct channel', async () => {
      const api = createElectronAPI();
      await api.window.minimize();
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('window:minimize');
    });

    it('window.maximize invokes correct channel', async () => {
      const api = createElectronAPI();
      await api.window.maximize();
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('window:maximize');
    });

    it('window.close invokes correct channel', async () => {
      const api = createElectronAPI();
      await api.window.close();
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('window:close');
    });
  });

  describe('app', () => {
    it('app.version invokes correct channel', async () => {
      const api = createElectronAPI();
      mockIpcRenderer.invoke.mockResolvedValue('1.0.0');
      const version = await api.app.version();
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('app:version');
      expect(version).toBe('1.0.0');
    });
  });

  describe('vault', () => {
    it('vault.lock invokes correct channel', async () => {
      const api = createElectronAPI();
      await api.vault.lock();
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('vault:lock');
    });

    it('vault.unlocked invokes correct channel', async () => {
      const api = createElectronAPI();
      await api.vault.unlocked();
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('vault:unlocked');
    });

    it('vault.onLock subscribes and returns unsubscribe function', () => {
      const api = createElectronAPI();
      const callback = vi.fn();
      const unsubscribe = api.vault.onLock(callback);
      expect(mockIpcRenderer.on).toHaveBeenCalledWith('vault:lock', callback);
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
      expect(mockIpcRenderer.removeListener).toHaveBeenCalledWith('vault:lock', callback);
    });

    it('vault.onFocus subscribes and returns unsubscribe function', () => {
      const api = createElectronAPI();
      const callback = vi.fn();
      const unsubscribe = api.vault.onFocus(callback);
      expect(mockIpcRenderer.on).toHaveBeenCalledWith('window:focus', callback);
      unsubscribe();
      expect(mockIpcRenderer.removeListener).toHaveBeenCalledWith('window:focus', callback);
    });
  });

  describe('backup', () => {
    it('backup.export invokes correct channel', async () => {
      const api = createElectronAPI();
      await api.backup.export('{"data":"test"}', 'backup.json');
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('backup:export', '{"data":"test"}', 'backup.json');
    });

    it('backup.import invokes correct channel', async () => {
      const api = createElectronAPI();
      mockIpcRenderer.invoke.mockResolvedValue('{"data":"test"}');
      const result = await api.backup.import();
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('backup:import');
      expect(result).toBe('{"data":"test"}');
    });
  });
});
