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

// Persisted store for vault entries, folders, and metadata
export const useVaultStore = create<VaultState>()(
  persist(
    (set) => ({
      entries: [],
      folders: [],
      vaultName: '',
      vaultId: null,

      // Replace entire vault state
      setVault: (id, name, entries, folders) =>
        set({ vaultId: id, vaultName: name, entries, folders }),

      // Append a new entry
      addEntry: (entry) =>
        set((state) => ({ entries: [...state.entries, entry] })),

      // Merge partial updates into an existing entry
      updateEntry: (id, updates) =>
        set((state) => ({
          entries: state.entries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),

      // Remove entry by id
      removeEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        })),

      // Toggle favorite flag on an entry
      toggleFavorite: (id) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === id ? { ...e, favorite: !e.favorite } : e
          ),
        })),

      // Append a new folder
      addFolder: (folder) =>
        set((state) => ({ folders: [...state.folders, folder] })),

      // Merge partial updates into an existing folder
      updateFolder: (id, updates) =>
        set((state) => ({
          folders: state.folders.map((f) => (f.id === id ? { ...f, ...updates } : f)),
        })),

      // Remove folder by id
      removeFolder: (id) =>
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== id),
        })),

      // Reorder folders and update sortOrder
      reorderFolders: (folderIds) =>
        set((state) => ({
          folders: folderIds
            .map((id, idx) => {
              const folder = state.folders.find((f) => f.id === id);
              return folder ? { ...folder, sortOrder: idx } : null;
            })
            .filter(Boolean) as VaultFolder[],
        })),

      // Reset vault to empty initial state
      clearVault: () => set({ entries: [], folders: [], vaultName: '', vaultId: null }),
    }),
    { name: 'vaultlock-vault' },
  ),
);
