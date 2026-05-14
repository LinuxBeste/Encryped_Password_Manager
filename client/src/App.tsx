import { useState, useCallback, useEffect } from 'react';
import { TitleBar } from './components/layout/TitleBar';
import { Sidebar } from './components/layout/Sidebar';
import { EntryList } from './components/layout/EntryList';
import { DetailPanel } from './components/layout/DetailPanel';
import { UnlockScreen } from './components/vault/UnlockScreen';
import { SetupWizard } from './components/vault/SetupWizard';
import { LockOverlay } from './components/vault/LockOverlay';
import { GlobalSearch } from './components/search/GlobalSearch';
import { SettingsPage } from './components/settings/SettingsPage';
import { ContextMenu } from './components/ui/ContextMenu';
import { useAuthStore } from './store/auth.store';
import { useUIStore } from './store/ui.store';
import { useVaultStore } from './store/vault.store';
import { useVault } from './hooks/useVault';
import { useAutoLock } from './hooks/useAutoLock';
import { useSettings } from './hooks/useSettings';
import { initApi, setTokens } from './services/api.service';
import { KeyRound } from 'lucide-react';
import type { VaultEntry } from './types';

export default function App() {
  const { isAuthenticated, isLocked, isFirstRun, login, logout, lock, unlock } = useAuthStore();
  const { selectedNav, selectedEntry, panelView, searchQuery, contextMenu, setSelectedNav, selectEntry, setPanelView, setSearchQuery, setContextMenu } = useUIStore();
  const { entries, folders } = useVaultStore();
  const { loadVault, favoriteEntry, deleteEntry } = useVault();
  const settings = useSettings();

  const [showSettings, setShowSettings] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useSettings();

  const handleUnlock = useCallback(async (password: string) => {
    if (password === 'test') {
      unlock();
      const url = 'http://localhost:3000/api';
      initApi(url);
      setTokens('test-token', 'test-refresh');
      return true;
    }
    return false;
  }, [unlock]);

  const handleLock = useCallback(() => {
    lock();
  }, [lock]);

  const handleSetupComplete = useCallback((serverUrl: string, email: string, _password: string) => {
    initApi(serverUrl);
    login({ id: '1', email, encryptedVaultKey: '', createdAt: Date.now() }, 'token', 'refresh');
  }, [login]);

  useAutoLock({
    timeout: 5 * 60 * 1000,
    onLock: handleLock,
    enabled: isAuthenticated && !isLocked,
  });

  useEffect(() => {
    if (isAuthenticated && !isLocked && !isFirstRun) {
      loadVault();
    }
  }, [isAuthenticated, isLocked, isFirstRun, loadVault]);

  const handleEntryContextMenu = useCallback((e: React.MouseEvent, entry: VaultEntry) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, entry });
  }, [setContextMenu]);

  const handleCopyPassword = useCallback(async () => {
    if (selectedEntry?.password && window.electronAPI) {
      await window.electronAPI.clipboard.write(selectedEntry.password);
    }
  }, [selectedEntry]);

  const handleCopyUsername = useCallback(async () => {
    if (selectedEntry?.username && window.electronAPI) {
      await window.electronAPI.clipboard.write(selectedEntry.username);
    }
  }, [selectedEntry]);

  if (isFirstRun && !isAuthenticated) {
    return (
      <>
        <SetupWizard onComplete={handleSetupComplete} />
        <GlobalSearch />
      </>
    );
  }

  if (!isAuthenticated || isLocked) {
    return (
      <>
        <UnlockScreen onUnlock={handleUnlock} onSetup={() => {}} />
        <GlobalSearch />
      </>
    );
  }

  if (showSettings) {
    return (
      <div className="h-full flex flex-col bg-app">
        <TitleBar />
        <div className="flex-1 overflow-hidden">
          <SettingsPage onClose={() => setShowSettings(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-app">
      <TitleBar />

      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar
          selectedNav={selectedNav}
          onSelectNav={setSelectedNav}
          onLock={handleLock}
          onSettings={() => setShowSettings(true)}
          syncStatus="synced"
        />

        <EntryList
          entries={entries}
          selectedId={selectedEntry?.id || null}
          onSelect={selectEntry}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onContextMenu={handleEntryContextMenu}
        />

        <div className="flex-1 bg-panel">
          {selectedEntry ? (
            panelView === 'editor' ? (
              <div>Editor placeholder</div>
            ) : (
              <DetailPanel
                entry={selectedEntry}
                onEdit={() => setPanelView('editor')}
                onDelete={() => { deleteEntry(selectedEntry.id); selectEntry(null); }}
              />
            )
          ) : (
            <div className="flex items-center justify-center h-full text-text-muted">
              <div className="text-center">
                <KeyRound className="w-12 h-12 mx-auto mb-3 text-text-faint" />
                <p className="text-body">Select an entry to view details</p>
              </div>
            </div>
          )}
        </div>

        {isLocked && <LockOverlay onUnlock={() => unlock()} />}
      </div>

      <GlobalSearch />

      {contextMenu && (
        <ContextMenu
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu(null)}
          items={[
            { id: 'copy-password', label: 'Copy Password', icon: KeyRound, shortcut: '⌘C', onClick: handleCopyPassword },
            { id: 'copy-username', label: 'Copy Username', shortcut: '⌘B', onClick: handleCopyUsername },
            { id: 'sep1', separator: true, label: '', onClick: () => {} },
            { id: 'favorite', label: 'Toggle Favorite', onClick: () => favoriteEntry(contextMenu.entry.id) },
            { id: 'delete', label: 'Delete', danger: true, onClick: () => deleteEntry(contextMenu.entry.id) },
          ]}
        />
      )}
    </div>
  );
}
