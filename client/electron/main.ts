import { app, BrowserWindow, ipcMain, powerMonitor, clipboard, nativeImage, Tray, Menu, safeStorage } from 'electron';
import path from 'path';
import fs from 'fs';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isLocked = false;

const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined;
const VAULT_STORE_PATH = path.join(app.getPath('userData'), 'vaultlock-store.json');

// Reads persisted settings from disk
function getSettings(): Record<string, unknown> {
  try {
    if (fs.existsSync(VAULT_STORE_PATH)) {
      return JSON.parse(fs.readFileSync(VAULT_STORE_PATH, 'utf-8'));
    }
  } catch { /* ignore */ }
  return {};
}

// Writes settings to disk
function saveSettings(settings: Record<string, unknown>) {
  try {
    fs.writeFileSync(VAULT_STORE_PATH, JSON.stringify(settings, null, 2));
  } catch { /* ignore */ }
}

// Creates the main application window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: true,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#0d1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));

  mainWindow.on('closed', () => { mainWindow = null; });

  // Notifies renderer when window receives focus
  mainWindow.on('focus', () => {
    if (mainWindow) {
      mainWindow.webContents.send('window:focus');
    }
  });
}

// Creates the system tray icon with context menu
function createTray() {
  try {
    const iconSize = process.platform === 'darwin' ? 16 : 24;
    const iconPath = path.join(__dirname, '../assets/tray-icon.png');
    let icon: Electron.NativeImage;
    if (fs.existsSync(iconPath)) {
      icon = nativeImage.createFromPath(iconPath);
    } else {
      icon = nativeImage.createEmpty();
    }
    if (process.platform === 'darwin') {
      icon = icon.resize({ width: iconSize, height: iconSize });
    }
    tray = new Tray(icon);
    tray.setToolTip('VaultLock');

    // Rebuilds tray menu reflecting current lock state
    const updateMenu = () => {
      const contextMenu = Menu.buildFromTemplate([
        {
          label: 'Open VaultLock',
          click: () => {
            if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
          },
        },
        { type: 'separator' },
        {
          label: isLocked ? 'Locked' : 'Lock Now',
          enabled: !isLocked,
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('vault:lock');
              isLocked = true;
              updateMenu();
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Quit',
          click: () => { app.quit(); },
        },
      ]);
      tray?.setContextMenu(contextMenu);
    };
    updateMenu();

    tray.on('click', () => {
      if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
    });
  } catch { /* tray not critical */ }
}

// Registers all IPC handlers for renderer communication
function registerIpcHandlers() {
  ipcMain.handle('clipboard:write', (_event, text: string) => {
    clipboard.writeText(text);
    return true;
  });

  ipcMain.handle('clipboard:clear', () => {
    clipboard.clear();
    return true;
  });

  ipcMain.handle('settings:get', () => {
    return getSettings();
  });

  ipcMain.handle('settings:set', (_event, settings: Record<string, unknown>) => {
    saveSettings(settings);
    return true;
  });

  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.handle('window:close', () => {
    mainWindow?.close();
  });

  ipcMain.handle('app:version', () => {
    return app.getVersion();
  });

  ipcMain.handle('vault:lock', () => {
    isLocked = true;
    mainWindow?.webContents.send('vault:lock');
    return true;
  });

  ipcMain.handle('vault:unlocked', () => {
    isLocked = false;
    if (tray) {
      tray.setContextMenu(Menu.buildFromTemplate([
        { label: 'Open VaultLock', click: () => mainWindow?.show() },
        { type: 'separator' },
        { label: 'Lock Now', click: () => { mainWindow?.webContents.send('vault:lock'); isLocked = true; } },
        { type: 'separator' },
        { label: 'Quit', click: () => app.quit() },
      ]));
    }
    return true;
  });

  // Opens save dialog and writes backup file to disk
  ipcMain.handle('backup:export', async (_event, content: string, defaultName: string) => {
    const { dialog } = require('electron');
    const result = await dialog.showSaveDialog(mainWindow!, {
      defaultPath: defaultName,
      filters: [{ name: 'VaultLock Backup', extensions: ['json'] }],
    });
    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, content, 'utf-8');
      return true;
    }
    return false;
  });

  // Opens open dialog and reads backup file from disk
  ipcMain.handle('backup:import', async () => {
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog(mainWindow!, {
      filters: [{ name: 'VaultLock Backup', extensions: ['json'] }],
      properties: ['openFile'],
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return fs.readFileSync(result.filePaths[0], 'utf-8');
    }
    return null;
  });
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();
  createTray();

  // Locks vault when system suspends
  powerMonitor.on('suspend', () => {
    if (mainWindow) {
      mainWindow.webContents.send('vault:lock');
      isLocked = true;
    }
  });

  // Locks vault when screen is locked
  powerMonitor.on('lock-screen', () => {
    if (mainWindow) {
      mainWindow.webContents.send('vault:lock');
      isLocked = true;
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
