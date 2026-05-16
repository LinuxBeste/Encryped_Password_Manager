import { useCallback } from 'react';
import { useVaultStore } from '@/store/vault.store';
import { useAuthStore } from '@/store/auth.store';
import { getApi } from '@/services/api.service';
import type { VaultEntry, VaultFolder } from '@/types';

// Hook providing vault CRUD operations with API sync and local fallback
export function useVault() {
  const { entries, folders, vaultName, vaultId, setVault, addEntry, updateEntry, removeEntry, toggleFavorite, clearVault } = useVaultStore();
  const user = useAuthStore((s) => s.user);

  // Fetch vault data from API and populate store
  const loadVault = useCallback(async () => {
    if (!user) return;
    try {
      const api = getApi();
      const response = await api.get('/vault');
      if (response.data.success && response.data.data) {
        const { id, name, entries: rawEntries, folders: rawFolders } = response.data.data;
        setVault(id, name, rawEntries || [], rawFolders || []);
      }
    } catch { /* error handled by interceptor */ }
  }, [user, setVault]);

  // Create entry via API, fall back to local creation on failure
  const createEntry = useCallback(async (entry: Partial<VaultEntry>) => {
    try {
      const api = getApi();
      const response = await api.post('/entries', entry);
      if (response.data.success && response.data.data) {
        addEntry(response.data.data);
        return response.data.data;
      }
    } catch { /* fall through to local add */ }
    const localEntry: VaultEntry = {
      id: crypto.randomUUID(),
      vaultId: vaultId || '',
      folderId: entry.folderId || null,
      type: entry.type || 'password',
      title: entry.title || '',
      username: entry.username || '',
      password: entry.password || '',
      url: entry.url || '',
      notes: entry.notes || '',
      totpSecret: entry.totpSecret || null,
      tags: entry.tags || [],
      customFields: entry.customFields || [],
      favorite: entry.favorite || false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
    };
    addEntry(localEntry);
    return localEntry;
  }, [addEntry, vaultId]);

  // Update entry locally then sync to API
  const editEntry = useCallback(async (id: string, updates: Partial<VaultEntry>) => {
    updateEntry(id, updates);
    try {
      const api = getApi();
      await api.put(`/entries/${id}`, updates);
    } catch { /* ignore */ }
  }, [updateEntry]);

  // Delete entry locally then sync to API
  const deleteEntry = useCallback(async (id: string) => {
    removeEntry(id);
    try {
      const api = getApi();
      await api.delete(`/entries/${id}`);
    } catch { /* ignore */ }
  }, [removeEntry]);

  // Toggle favorite locally, then sync to API
  const favoriteEntry = useCallback(async (id: string) => {
    toggleFavorite(id);
    try {
      const api = getApi();
      await api.post(`/entries/${id}/favorite`);
    } catch {
      toggleFavorite(id);
    }
  }, [toggleFavorite]);

  // Create folder via API with local fallback
  const createFolder = useCallback(async (name: string) => {
    try {
      const api = getApi();
      const response = await api.post('/folders', {
        vault_id: vaultId,
        name_encrypted: btoa(name),
        sort_order: folders.length,
      });
      if (response.data.success && response.data.data) {
        const folder: VaultFolder = {
          id: response.data.data.id,
          name,
          parentId: response.data.data.parent_id || null,
          sortOrder: response.data.data.sort_order || 0,
          entryCount: 0,
        };
        useVaultStore.getState().addFolder(folder);
        return folder;
      }
    } catch {
      const id = crypto.randomUUID();
      const folder: VaultFolder = {
        id,
        name,
        parentId: null,
        sortOrder: folders.length,
        entryCount: 0,
      };
      useVaultStore.getState().addFolder(folder);
      return folder;
    }
    return null;
  }, [vaultId, folders.length]);

  // Rename folder locally then sync to API
  const renameFolder = useCallback(async (id: string, name: string) => {
    useVaultStore.getState().updateFolder(id, { name });
    try {
      const api = getApi();
      await api.put(`/folders/${id}`, { name_encrypted: btoa(name) });
    } catch { /* ignore */ }
  }, []);

  // Delete folder locally then sync to API
  const deleteFolder = useCallback(async (id: string) => {
    useVaultStore.getState().removeFolder(id);
    try {
      const api = getApi();
      await api.delete(`/folders/${id}`);
    } catch { /* ignore */ }
  }, []);

  return { entries, folders, vaultName, vaultId, loadVault, createEntry, editEntry, deleteEntry, favoriteEntry, createFolder, renameFolder, deleteFolder, clearVault };
}
