import { autoUpdater } from 'electron-updater';
import { BrowserWindow } from 'electron';

// Configures auto-updater events to forward progress to the renderer
export function setupAutoUpdater(mainWindow: BrowserWindow) {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    mainWindow.webContents.send('update:checking');
  });

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update:available', info);
  });

  autoUpdater.on('update-not-available', () => {
    mainWindow.webContents.send('update:not-available');
  });

  autoUpdater.on('error', (err) => {
    mainWindow.webContents.send('update:error', err.message);
  });

  autoUpdater.on('download-progress', (progress) => {
    mainWindow.webContents.send('update:progress', progress);
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update:downloaded');
  });

  autoUpdater.checkForUpdates().catch(() => {
    // silent fail in dev
  });
}

// Starts downloading an available update
export function downloadUpdate() {
  autoUpdater.downloadUpdate();
}

// Installs the downloaded update and restarts the app
export function installUpdate() {
  autoUpdater.quitAndInstall();
}
