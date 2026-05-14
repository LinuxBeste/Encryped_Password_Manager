import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { VaultEntry, VaultFolder } from '@/types';

interface VaultState {
  entries: VaultEntry[];
  folders: VaultFolder[];
  vaultName: string;
  vaultId: string | null;
  setVault: (id: string, name: string, entries: VaultEntry[], folders: VaultFolder[]) => void;
  addEntry: (entry: VaultEntry) => void;
  updateEntry: (id: string, updates: Partial<VaultEntry>) => void;
  removeEntry: (id: string) => void;
  toggleFavorite: (id: string) => void;
  addFolder: (folder: VaultFolder) => void;
  updateFolder: (id: string, updates: Partial<VaultFolder>) => void;
  removeFolder: (id: string) => void;
  reorderFolders: (folderIds: string[]) => void;
  clearVault: () => void;
}

export const useVaultStore = create<VaultState>()(
  persist(
    (set) => ({
      entries: [],
      folders: [],
      vaultName: '',
      vaultId: null,

      setVault: (id, name, entries, folders) =>
        set({ vaultId: id, vaultName: name, entries, folders }),

      addEntry: (entry) =>
        set((state) => ({ entries: [...state.entries, entry] })),

      updateEntry: (id, updates) =>
        set((state) => ({
          entries: state.entries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),

      removeEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        })),

      toggleFavorite: (id) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === id ? { ...e, favorite: !e.favorite } : e
          ),
        })),

      addFolder: (folder) =>
        set((state) => ({ folders: [...state.folders, folder] })),

      updateFolder: (id, updates) =>
        set((state) => ({
          folders: state.folders.map((f) => (f.id === id ? { ...f, ...updates } : f)),
        })),

      removeFolder: (id) =>
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== id),
        })),

      reorderFolders: (folderIds) =>
        set((state) => ({
          folders: folderIds
            .map((id, idx) => {
              const folder = state.folders.find((f) => f.id === id);
              return folder ? { ...folder, sortOrder: idx } : null;
            })
            .filter(Boolean) as VaultFolder[],
        })),

      clearVault: () => set({ entries: [], folders: [], vaultName: '', vaultId: null }),
    }),
    { name: 'vaultlock-vault' },
  ),
);
