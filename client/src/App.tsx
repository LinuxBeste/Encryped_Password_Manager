import { useState, useCallback, useEffect, useMemo } from 'react';
import { TitleBar } from './components/layout/TitleBar';
import { Sidebar } from './components/layout/Sidebar';
import { EntryList } from './components/layout/EntryList';
import { DetailPanel } from './components/layout/DetailPanel';
import { EntryEditor } from './components/entries/EntryEditor';
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
import { initApi, setTokens, login as apiLogin } from './services/api.service';
import { KeyRound } from 'lucide-react';
import type { VaultEntry } from './types';

// Root application component, manages auth, navigation, and entry CRUD
export default function App() {
  const { isAuthenticated, isLocked, isFirstRun, login, logout, lock, unlock } = useAuthStore();
  const { selectedNav, selectedEntry, panelView, searchQuery, contextMenu, setSelectedNav, selectEntry, setPanelView, setSearchQuery, setContextMenu } = useUIStore();
  const { entries, folders } = useVaultStore();
  const { loadVault, createEntry, editEntry, favoriteEntry, deleteEntry } = useVault();
  const settings = useSettings();

  const [showSettings, setShowSettings] = useState(false);

  useSettings();

  // Unlock by authenticating with the server
  const handleUnlock = useCallback(async (password: string) => {
    const user = useAuthStore.getState().user;
    if (!user?.email) return false;
    try {
      const url = 'http://localhost:3000/api';
      const result = await apiLogin(url, user.email, password);
      if (result.success && result.data) {
        unlock();
        initApi(url);
        setTokens(result.data.token, result.data.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [unlock]);

  // Switch to editor view for adding a new entry
  const handleAddEntry = useCallback(() => {
    selectEntry(null);
    setPanelView('editor');
  }, [selectEntry, setPanelView]);

  // Save a new entry and show its detail view
  const handleSaveEntry = useCallback(async (data: Partial<VaultEntry>) => {
    const saved = await createEntry(data);
    if (saved) {
      selectEntry(saved);
      setPanelView('detail');
    }
  }, [createEntry, selectEntry, setPanelView]);

  // Cancel editing, return to detail or empty state
  const handleCancelEdit = useCallback(() => {
    if (selectedEntry) {
      setPanelView('detail');
    } else {
      selectEntry(null);
    }
  }, [selectedEntry, selectEntry, setPanelView]);

  // Lock the vault
  const handleLock = useCallback(() => {
    lock();
  }, [lock]);

  // Complete first-run setup and login
  const handleSetupComplete = useCallback((serverUrl: string, email: string, _password: string) => {
    initApi(serverUrl);
    login({ id: '1', email, encryptedVaultKey: '', createdAt: Date.now() }, 'token', 'refresh');
  }, [login]);

  // Auto-lock after 5min of inactivity
  useAutoLock({
    timeout: 5 * 60 * 1000,
    onLock: handleLock,
    enabled: isAuthenticated && !isLocked,
  });

  // Load vault data once authenticated and unlocked
  useEffect(() => {
    if (isAuthenticated && !isLocked && !isFirstRun) {
      loadVault();
    }
  }, [isAuthenticated, isLocked, isFirstRun, loadVault]);

  // Filter entries based on the selected navigation category
  const filteredEntries = useMemo(() => {
    switch (selectedNav) {
      case 'favorites':
        return entries.filter((e) => e.favorite);
      case 'passwords':
        return entries.filter((e) => e.type === 'password');
      case 'notes':
        return entries.filter((e) => e.type === 'note');
      case 'credit-cards':
        return entries.filter((e) => e.type === 'credit-card');
      case 'identities':
        return entries.filter((e) => e.type === 'identity');
      case 'ssh-keys':
        return entries.filter((e) => e.type === 'ssh-key');
      default:
        return entries;
    }
  }, [selectedNav, entries]);

  // Show context menu on right-click
  const handleEntryContextMenu = useCallback((e: React.MouseEvent, entry: VaultEntry) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, entry });
  }, [setContextMenu]);

  // Copy entry password to system clipboard
  const handleCopyPassword = useCallback(async () => {
    if (selectedEntry?.password && window.electronAPI) {
      await window.electronAPI.clipboard.write(selectedEntry.password);
    }
  }, [selectedEntry]);

  // Copy entry username to system clipboard
  const handleCopyUsername = useCallback(async () => {
    if (selectedEntry?.username && window.electronAPI) {
      await window.electronAPI.clipboard.write(selectedEntry.username);
    }
  }, [selectedEntry]);

  // Show setup wizard for first run
  if (isFirstRun && !isAuthenticated) {
    return (
      <>
        <SetupWizard onComplete={handleSetupComplete} />
        <GlobalSearch />
      </>
    );
  }

  // Show unlock screen if not authenticated or vault is locked
  if (!isAuthenticated || isLocked) {
    return (
      <>
        <UnlockScreen onUnlock={handleUnlock} onSetup={() => useAuthStore.getState().setFirstRun(true)} />
        <GlobalSearch />
      </>
    );
  }

  // Show settings page
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

  // Main vault layout: sidebar, entry list, and detail/editor panel
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
          entries={filteredEntries}
          selectedId={selectedEntry?.id || null}
          onSelect={selectEntry}
          onAdd={handleAddEntry}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onContextMenu={handleEntryContextMenu}
        />

        <div className="flex-1 bg-panel">
          {panelView === 'editor' ? (
            <EntryEditor
              key={selectedEntry?.id || 'new'}
              entry={selectedEntry}
              folders={folders}
              onSave={handleSaveEntry}
              onCancel={handleCancelEdit}
            />
          ) : selectedEntry ? (
            <DetailPanel
              entry={selectedEntry}
              onEdit={() => setPanelView('editor')}
              onDelete={() => { deleteEntry(selectedEntry.id); selectEntry(null); }}
            />
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
