import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useVault } from '../useVault';
import { useVaultStore } from '@/store/vault.store';
import { useAuthStore } from '@/store/auth.store';
import type { VaultEntry, VaultFolder } from '@/types';

const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

vi.mock('@/services/api.service', () => ({
  getApi: () => mockApi,
}));

const mockEntry = (overrides: Partial<VaultEntry> = {}): VaultEntry => ({
  id: 'e1',
  vaultId: 'v1',
  folderId: null,
  type: 'password',
  title: 'Test Entry',
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

describe('useVault', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useVaultStore.setState({ entries: [], folders: [], vaultName: '', vaultId: null });
    useAuthStore.setState({ user: { id: 'u1', email: 'test@test.com', encryptedVaultKey: '', createdAt: 0 } });
  });

  describe('loadVault', () => {
    it('fetches vault data and populates store', async () => {
      const vaultData = { id: 'v1', name: 'MyVault', entries: [mockEntry()], folders: [mockFolder()] };
      mockApi.get.mockResolvedValue({ data: { success: true, data: vaultData } });

      const { result } = renderHook(() => useVault());
      await result.current.loadVault();

      const state = useVaultStore.getState();
      expect(state.vaultId).toBe('v1');
      expect(state.vaultName).toBe('MyVault');
      expect(state.entries).toHaveLength(1);
      expect(state.folders).toHaveLength(1);
    });

    it('does nothing when user is null', async () => {
      useAuthStore.setState({ user: null });
      const { result } = renderHook(() => useVault());
      await result.current.loadVault();
      expect(mockApi.get).not.toHaveBeenCalled();
    });
  });

  describe('createEntry', () => {
    it('creates entry via API and adds to store', async () => {
      const newEntry = mockEntry({ id: 'e2', title: 'New Entry' });
      mockApi.post.mockResolvedValue({ data: { success: true, data: newEntry } });

      const { result } = renderHook(() => useVault());
      const entry = await result.current.createEntry({ title: 'New Entry' });

      expect(entry).toBeDefined();
      expect(entry!.id).toBe('e2');
      expect(useVaultStore.getState().entries).toHaveLength(1);
    });

    it('falls back to local creation on API failure', async () => {
      mockApi.post.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useVault());
      useVaultStore.setState({ vaultId: 'v1' });
      const entry = await result.current.createEntry({ title: 'Local Entry' });

      expect(entry).toBeDefined();
      expect(entry!.title).toBe('Local Entry');
      expect(useVaultStore.getState().entries).toHaveLength(1);
    });
  });

  describe('editEntry', () => {
    it('updates entry locally and syncs to API', async () => {
      useVaultStore.setState({ entries: [mockEntry()] });

      const { result } = renderHook(() => useVault());
      await result.current.editEntry('e1', { title: 'Updated' });

      expect(useVaultStore.getState().entries[0].title).toBe('Updated');
      expect(mockApi.put).toHaveBeenCalledWith('/entries/e1', { title: 'Updated' });
    });
  });

  describe('deleteEntry', () => {
    it('removes entry locally and syncs to API', async () => {
      useVaultStore.setState({ entries: [mockEntry()] });

      const { result } = renderHook(() => useVault());
      await result.current.deleteEntry('e1');

      expect(useVaultStore.getState().entries).toHaveLength(0);
      expect(mockApi.delete).toHaveBeenCalledWith('/entries/e1');
    });
  });

  describe('favoriteEntry', () => {
    it('toggles favorite locally and syncs to API', async () => {
      useVaultStore.setState({ entries: [mockEntry({ favorite: false })] });
      mockApi.post.mockResolvedValue({ data: { success: true } });

      const { result } = renderHook(() => useVault());
      await result.current.favoriteEntry('e1');

      expect(useVaultStore.getState().entries[0].favorite).toBe(true);
      expect(mockApi.post).toHaveBeenCalledWith('/entries/e1/favorite');
    });

    it('reverts favorite on API failure', async () => {
      useVaultStore.setState({ entries: [mockEntry({ favorite: false })] });
      mockApi.post.mockRejectedValue(new Error('fail'));

      const { result } = renderHook(() => useVault());
      await result.current.favoriteEntry('e1');

      expect(useVaultStore.getState().entries[0].favorite).toBe(false);
    });
  });

  describe('createFolder', () => {
    it('creates folder via API and adds to store', async () => {
      mockApi.post.mockResolvedValue({ data: { success: true, data: { id: 'f2', sort_order: 0, parent_id: null } } });

      const { result } = renderHook(() => useVault());
      useVaultStore.setState({ vaultId: 'v1' });
      const folder = await result.current.createFolder('New Folder');

      expect(folder).toBeDefined();
      expect(folder!.name).toBe('New Folder');
      expect(useVaultStore.getState().folders).toHaveLength(1);
    });

    it('falls back to local creation on API failure', async () => {
      mockApi.post.mockRejectedValue(new Error('fail'));

      const { result } = renderHook(() => useVault());
      useVaultStore.setState({ vaultId: 'v1' });
      const folder = await result.current.createFolder('Local Folder');

      expect(folder).toBeDefined();
      expect(folder!.name).toBe('Local Folder');
      expect(useVaultStore.getState().folders).toHaveLength(1);
    });
  });

  describe('renameFolder', () => {
    it('renames folder locally and syncs to API', async () => {
      useVaultStore.setState({ folders: [mockFolder()] });

      const { result } = renderHook(() => useVault());
      await result.current.renameFolder('f1', 'Renamed');

      expect(useVaultStore.getState().folders[0].name).toBe('Renamed');
      expect(mockApi.put).toHaveBeenCalledWith('/folders/f1', { name_encrypted: expect.any(String) });
    });
  });

  describe('deleteFolder', () => {
    it('removes folder locally and syncs to API', async () => {
      useVaultStore.setState({ folders: [mockFolder()] });

      const { result } = renderHook(() => useVault());
      await result.current.deleteFolder('f1');

      expect(useVaultStore.getState().folders).toHaveLength(0);
      expect(mockApi.delete).toHaveBeenCalledWith('/folders/f1');
    });
  });

  describe('clearVault', () => {
    it('clears vault state', () => {
      useVaultStore.setState({ entries: [mockEntry()], folders: [mockFolder()], vaultName: 'MyVault', vaultId: 'v1' });

      const { result } = renderHook(() => useVault());
      result.current.clearVault();

      const state = useVaultStore.getState();
      expect(state.entries).toEqual([]);
      expect(state.folders).toEqual([]);
      expect(state.vaultName).toBe('');
      expect(state.vaultId).toBeNull();
    });
  });
});
