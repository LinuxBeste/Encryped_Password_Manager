import { Tray, Menu, nativeImage, app } from 'electron';
import path from 'path';
import fs from 'fs';

let tray: Tray | null = null;
let lockState = false;

// Creates system tray icon with dynamic lock/unlock context menu
export function createTrayIcon(getLocked: () => boolean, onLock: () => void) {
  const iconPath = path.join(__dirname, '../../assets/tray-icon.png');
  let icon: Electron.NativeImage;
  if (fs.existsSync(iconPath)) {
    icon = nativeImage.createFromPath(iconPath);
  } else {
    icon = nativeImage.createEmpty();
  }

  if (process.platform === 'darwin') {
    icon = icon.resize({ width: 16, height: 16 });
  }

  tray = new Tray(icon);
  tray.setToolTip('VaultLock');
  updateMenu(getLocked, onLock);

  tray.on('click', () => {
    const { BrowserWindow } = require('electron');
    const wins = BrowserWindow.getAllWindows();
    if (wins.length > 0) {
      wins[0].show();
      wins[0].focus();
    }
  });

  return tray;
}

// Rebuilds tray context menu with current lock state
export function updateMenu(getLocked: () => boolean, onLock: () => void) {
  const locked = getLocked();
  const menu = Menu.buildFromTemplate([
    { label: 'Open VaultLock', click: () => {
      const { BrowserWindow } = require('electron');
      const wins = BrowserWindow.getAllWindows();
      if (wins.length > 0) { wins[0].show(); wins[0].focus(); }
    }},
    { type: 'separator' },
    {
      label: locked ? 'Locked' : 'Lock Now',
      enabled: !locked,
      click: onLock,
    },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]);
  tray?.setContextMenu(menu);
}

// Destroys the tray icon
export function destroyTray() {
  if (tray) { tray.destroy(); tray = null; }
}
