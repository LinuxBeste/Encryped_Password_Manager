import { useCallback } from 'react';
import { useVaultStore } from '@/store/vault.store';
import { useAuthStore } from '@/store/auth.store';
import { getApi } from '@/services/api.service';
import type { VaultEntry } from '@/types';

export function useVault() {
  const { entries, folders, vaultName, vaultId, setVault, addEntry, updateEntry, removeEntry, toggleFavorite, clearVault } = useVaultStore();
  const user = useAuthStore((s) => s.user);

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

  const createEntry = useCallback(async (entry: Partial<VaultEntry>) => {
    try {
      const api = getApi();
      const response = await api.post('/entries', entry);
      if (response.data.success && response.data.data) {
        addEntry(response.data.data);
        return response.data.data;
      }
    } catch { /* ignore */ }
    return null;
  }, [addEntry]);

  const editEntry = useCallback(async (id: string, updates: Partial<VaultEntry>) => {
    try {
      const api = getApi();
      const response = await api.put(`/entries/${id}`, updates);
      if (response.data.success) {
        updateEntry(id, updates);
      }
    } catch { /* ignore */ }
  }, [updateEntry]);

  const deleteEntry = useCallback(async (id: string) => {
    try {
      const api = getApi();
      const response = await api.delete(`/entries/${id}`);
      if (response.data.success) {
        removeEntry(id);
      }
    } catch { /* ignore */ }
  }, [removeEntry]);

  const favoriteEntry = useCallback(async (id: string) => {
    toggleFavorite(id);
    try {
      const api = getApi();
      await api.post(`/entries/${id}/favorite`);
    } catch {
      toggleFavorite(id);
    }
  }, [toggleFavorite]);

  return { entries, folders, vaultName, vaultId, loadVault, createEntry, editEntry, deleteEntry, favoriteEntry, clearVault };
}
