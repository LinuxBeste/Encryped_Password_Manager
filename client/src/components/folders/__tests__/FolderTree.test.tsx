import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FolderTree } from '../FolderTree';
import { useVaultStore } from '@/store/vault.store';
import { useSettingsStore } from '@/store/settings.store';
import type { VaultFolder } from '@/types';

const mockCreateFolder = vi.fn();
const mockRenameFolder = vi.fn();
const mockDeleteFolder = vi.fn();

vi.mock('@/hooks/useVault', () => ({
  useVault: () => ({
    createFolder: mockCreateFolder,
    renameFolder: mockRenameFolder,
    deleteFolder: mockDeleteFolder,
  }),
}));

const baseFolder = (overrides: Partial<VaultFolder> = {}): VaultFolder => ({
  id: 'f1',
  name: 'Work',
  parentId: null,
  sortOrder: 0,
  entryCount: 0,
  ...overrides,
});

describe('FolderTree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useVaultStore.setState({ entries: [], folders: [], vaultName: '', vaultId: null });
    useSettingsStore.setState({
      settings: {
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
        },
        security: { autoLockTimeout: 300000, autoLockOnSleep: true, clipboardClearTimeout: 30000, biometricUnlock: false, failedAttemptsBeforeLockout: 5 },
        generator: { defaultLength: 20, useUppercase: true, useLowercase: true, useNumbers: true, useSymbols: true, excludeAmbiguous: true, useWords: false, wordSeparator: '-', capitalizeWords: true, includeNumber: true, wordCount: 4 },
        sync: { serverUrl: '', syncInterval: 300000, conflictResolution: 'server-wins' },
        backup: { autoBackup: 'never', backupLocation: '', keepLastN: 5 },
      },
      loaded: true,
    });
  });

  it('renders "All entries" button', () => {
    render(<FolderTree />);
    expect(screen.getByText('All entries')).toBeInTheDocument();
  });

  it('renders folder names', () => {
    useVaultStore.setState({ folders: [baseFolder()] });
    render(<FolderTree />);
    expect(screen.getByText('Work')).toBeInTheDocument();
  });

  it('shows entry count for each folder', () => {
    useVaultStore.setState({
      folders: [baseFolder()],
      entries: [{ id: 'e1', vaultId: 'v1', folderId: 'f1', type: 'password', title: 'Test', username: '', password: '', url: '', notes: '', totpSecret: null, tags: [], customFields: [], favorite: false, createdAt: 0, updatedAt: 0, deletedAt: null }],
    });
    render(<FolderTree />);
    const counts = screen.getAllByText('1');
    expect(counts).toHaveLength(2);
  });

  it('calls onSelectFolder with null when "All entries" is clicked', async () => {
    const onSelectFolder = vi.fn();
    const user = userEvent.setup();
    render(<FolderTree onSelectFolder={onSelectFolder} />);
    await user.click(screen.getByText('All entries'));
    expect(onSelectFolder).toHaveBeenCalledWith(null);
  });

  it('calls onSelectFolder with folder id when folder is clicked', async () => {
    const onSelectFolder = vi.fn();
    useVaultStore.setState({ folders: [baseFolder()] });
    const user = userEvent.setup();
    render(<FolderTree onSelectFolder={onSelectFolder} />);
    await user.click(screen.getByText('Work'));
    expect(onSelectFolder).toHaveBeenCalledWith('f1');
  });

  it('shows add folder input when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<FolderTree />);
    await user.click(screen.getByText('Add folder'));
    expect(screen.getByPlaceholderText('Folder name')).toBeInTheDocument();
  });

  it('creates a folder when submitted', async () => {
    mockCreateFolder.mockResolvedValue(undefined);
    useVaultStore.setState({ vaultId: 'v1' });
    const user = userEvent.setup();
    render(<FolderTree />);
    await user.click(screen.getByText('Add folder'));
    const input = screen.getByPlaceholderText('Folder name');
    await user.type(input, 'New Folder');
    await user.keyboard('{Enter}');
    expect(mockCreateFolder).toHaveBeenCalledWith('New Folder');
  });

  it('cancels folder creation on Escape', async () => {
    const user = userEvent.setup();
    render(<FolderTree />);
    await user.click(screen.getByText('Add folder'));
    const input = screen.getByPlaceholderText('Folder name');
    await user.type(input, 'New Folder');
    await user.keyboard('{Escape}');
    expect(screen.queryByPlaceholderText('Folder name')).not.toBeInTheDocument();
  });

  it('highlights selected folder', () => {
    useVaultStore.setState({ folders: [baseFolder()] });
    render(<FolderTree selectedFolderId="f1" />);
    const folderBtn = screen.getByText('Work').closest('button');
    expect(folderBtn).toHaveClass('bg-surface');
  });

  it('renders context menu on right-click', async () => {
    useVaultStore.setState({ folders: [baseFolder()] });
    const user = userEvent.setup();
    render(<FolderTree />);
    const folderBtn = screen.getByText('Work').closest('button')!;
    await user.pointer({ target: folderBtn, keys: '[MouseRight]' });
    expect(screen.getByText('Rename')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });
});
