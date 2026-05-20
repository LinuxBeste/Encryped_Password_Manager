import { describe, it, expect, beforeEach } from 'vitest';
import { useVaultStore } from '../vault.store';
import type { VaultEntry, VaultFolder } from '@/types';

const mockEntry = (overrides: Partial<VaultEntry> = {}): VaultEntry => ({
  id: 'e1',
  vaultId: 'v1',
  folderId: null,
  type: 'password',
  title: 'Test',
  username: 'user',
  password: 'pass',
  url: '',
  notes: '',
  totpSecret: null,
  tags: [],
  customFields: [],
  favorite: false,
  createdAt: 1000,
  updatedAt: 1000,
  deletedAt: null,
  origin: 'server',
  ...overrides,
});

const mockFolder = (overrides: Partial<VaultFolder> = {}): VaultFolder => ({
  id: 'f1',
  name: 'Folder 1',
  parentId: null,
  sortOrder: 0,
  entryCount: 0,
  ...overrides,
});

describe('vault.store', () => {
  beforeEach(() => {
    useVaultStore.setState({ entries: [], folders: [], vaultName: '', vaultId: null });
  });

  describe('setVault', () => {
    it('replaces entire vault state', () => {
      const entries = [mockEntry()];
      const folders = [mockFolder()];
      useVaultStore.getState().setVault('v1', 'MyVault', entries, folders);

      const state = useVaultStore.getState();
      expect(state.vaultId).toBe('v1');
      expect(state.vaultName).toBe('MyVault');
      expect(state.entries).toEqual(entries);
      expect(state.folders).toEqual(folders);
    });
  });

  describe('addEntry', () => {
    it('appends an entry', () => {
      const entry = mockEntry();
      useVaultStore.getState().addEntry(entry);
      expect(useVaultStore.getState().entries).toHaveLength(1);
      expect(useVaultStore.getState().entries[0].id).toBe('e1');
    });
  });

  describe('updateEntry', () => {
    it('merges partial updates into an entry', () => {
      useVaultStore.getState().addEntry(mockEntry());
      useVaultStore.getState().updateEntry('e1', { title: 'Updated', username: 'newuser' });

      const entry = useVaultStore.getState().entries[0];
      expect(entry.title).toBe('Updated');
      expect(entry.username).toBe('newuser');
      expect(entry.password).toBe('pass');
    });
  });

  describe('removeEntry', () => {
    it('removes entry by id', () => {
      useVaultStore.getState().addEntry(mockEntry());
      useVaultStore.getState().removeEntry('e1');
      expect(useVaultStore.getState().entries).toHaveLength(0);
    });
  });

  describe('toggleFavorite', () => {
    it('toggles favorite flag', () => {
      useVaultStore.getState().addEntry(mockEntry({ favorite: false }));
      useVaultStore.getState().toggleFavorite('e1');
      expect(useVaultStore.getState().entries[0].favorite).toBe(true);
      useVaultStore.getState().toggleFavorite('e1');
      expect(useVaultStore.getState().entries[0].favorite).toBe(false);
    });
  });

  describe('addFolder', () => {
    it('appends a folder', () => {
      useVaultStore.getState().addFolder(mockFolder());
      expect(useVaultStore.getState().folders).toHaveLength(1);
    });
  });

  describe('updateFolder', () => {
    it('merges partial updates into a folder', () => {
      useVaultStore.getState().addFolder(mockFolder());
      useVaultStore.getState().updateFolder('f1', { name: 'Updated Folder' });
      expect(useVaultStore.getState().folders[0].name).toBe('Updated Folder');
    });
  });

  describe('removeFolder', () => {
    it('removes folder by id', () => {
      useVaultStore.getState().addFolder(mockFolder());
      useVaultStore.getState().removeFolder('f1');
      expect(useVaultStore.getState().folders).toHaveLength(0);
    });
  });

  describe('reorderFolders', () => {
    it('reorders folders and updates sortOrder', () => {
      const f1 = mockFolder({ id: 'f1', name: 'A', sortOrder: 0 });
      const f2 = mockFolder({ id: 'f2', name: 'B', sortOrder: 1 });
      const f3 = mockFolder({ id: 'f3', name: 'C', sortOrder: 2 });
      useVaultStore.getState().addFolder(f1);
      useVaultStore.getState().addFolder(f2);
      useVaultStore.getState().addFolder(f3);

      useVaultStore.getState().reorderFolders(['f3', 'f1', 'f2']);
      const folders = useVaultStore.getState().folders;
      expect(folders[0].id).toBe('f3');
      expect(folders[0].sortOrder).toBe(0);
      expect(folders[1].id).toBe('f1');
      expect(folders[1].sortOrder).toBe(1);
      expect(folders[2].id).toBe('f2');
      expect(folders[2].sortOrder).toBe(2);
    });

    it('preserves existing folders not in reorder list', () => {
      const f1 = mockFolder({ id: 'f1', name: 'A' });
      const f2 = mockFolder({ id: 'f2', name: 'B' });
      useVaultStore.getState().addFolder(f1);
      useVaultStore.getState().addFolder(f2);

      useVaultStore.getState().reorderFolders(['f2']);
      expect(useVaultStore.getState().folders).toHaveLength(1);
    });
  });

  describe('clearVault', () => {
    it('resets to initial state', () => {
      useVaultStore.getState().addEntry(mockEntry());
      useVaultStore.getState().addFolder(mockFolder());
      useVaultStore.getState().setVault('v1', 'MyVault', [], []);
      useVaultStore.getState().clearVault();

      const state = useVaultStore.getState();
      expect(state.entries).toEqual([]);
      expect(state.folders).toEqual([]);
      expect(state.vaultName).toBe('');
      expect(state.vaultId).toBeNull();
    });
  });
});
