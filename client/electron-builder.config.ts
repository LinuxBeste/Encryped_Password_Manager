import { Configuration } from 'electron-builder';

const config: Configuration = {
  appId: 'com.vaultlock.app',
  productName: 'VaultLock',
  copyright: 'Copyright 2026 VaultLock',
  directories: {
    output: 'release',
    buildResources: 'build',
  },
  files: [
    'dist/**/*',
    'dist-electron/**/*',
  ],
  extraResources: [
    { from: 'assets/', to: 'assets/', filter: ['**/*'] },
  ],
  mac: {
    category: 'public.app-category.utilities',
    target: ['dmg', 'zip'],
    artifactName: 'VaultLock-${version}-mac-${arch}.${ext}',
    hardenedRuntime: true,
    entitlements: 'build/entitlements.mac.plist',
    entitlementsInherit: 'build/entitlements.mac.plist',
  },
  dmg: {
    sign: false,
  },
  win: {
    target: ['nsis'],
    artifactName: 'VaultLock-${version}-win-${arch}.${ext}',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
  },
  linux: {
    target: ['AppImage', 'deb', 'pacman'],
    artifactName: 'VaultLock-${version}-linux-${arch}.${ext}',
    category: 'Utility',
  },
  publish: {
    provider: 'github',
    owner: 'vaultlock',
    repo: 'vaultlock-desktop',
  },
};

export default config;
