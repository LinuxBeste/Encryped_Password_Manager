import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
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
});
