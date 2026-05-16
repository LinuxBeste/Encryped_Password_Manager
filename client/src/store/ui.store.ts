import { create } from 'zustand';
import type { VaultEntry } from '@/types';

type PanelView = 'detail' | 'editor' | 'settings';

interface UIState {
  selectedNav: string;
  selectedEntryId: string | null;
  selectedEntry: VaultEntry | null;
  selectedFolderId: string | null;
  panelView: PanelView;
  searchQuery: string;
  globalSearchOpen: boolean;
  contextMenu: { x: number; y: number; entry: VaultEntry } | null;
  folderContextMenu: { x: number; y: number; folderId: string } | null;
  setSelectedNav: (id: string) => void;
  selectEntry: (entry: VaultEntry | null) => void;
  setSelectedFolder: (id: string | null) => void;
  setPanelView: (view: PanelView) => void;
  setSearchQuery: (query: string) => void;
  setGlobalSearchOpen: (open: boolean) => void;
  setContextMenu: (menu: { x: number; y: number; entry: VaultEntry } | null) => void;
  setFolderContextMenu: (menu: { x: number; y: number; folderId: string } | null) => void;
}

// UI state store for navigation, panel view, search, and context menu
export const useUIStore = create<UIState>((set) => ({
  selectedNav: 'all',
  selectedEntryId: null,
  selectedEntry: null,
  selectedFolderId: null,
  panelView: 'detail',
  searchQuery: '',
  globalSearchOpen: false,
  contextMenu: null,
  folderContextMenu: null,

  // Set nav category and deselect entry
  setSelectedNav: (id) => set({ selectedNav: id, selectedEntry: null, selectedEntryId: null }),
  // Select an entry and switch to detail view
  selectEntry: (entry) =>
    set({
      selectedEntry: entry,
      selectedEntryId: entry?.id || null,
      panelView: 'detail',
    }),
  setSelectedFolder: (id) => set({ selectedFolderId: id }),
  setPanelView: (view) => set({ panelView: view }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setGlobalSearchOpen: (open) => set({ globalSearchOpen: open }),
  setContextMenu: (menu) => set({ contextMenu: menu }),
  setFolderContextMenu: (menu) => set({ folderContextMenu: menu }),
}));
