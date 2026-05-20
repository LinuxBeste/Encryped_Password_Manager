import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../ui.store';
import type { VaultEntry } from '@/types';

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

describe('ui.store', () => {
  beforeEach(() => {
    useUIStore.setState({
      selectedNav: 'all',
      selectedEntryId: null,
      selectedEntry: null,
      panelView: 'detail',
      searchQuery: '',
      globalSearchOpen: false,
      contextMenu: null,
    });
  });

  describe('setSelectedNav', () => {
    it('updates nav category and deselects entry', () => {
      useUIStore.getState().selectEntry(mockEntry());
      useUIStore.getState().setSelectedNav('favorites');

      const state = useUIStore.getState();
      expect(state.selectedNav).toBe('favorites');
      expect(state.selectedEntry).toBeNull();
      expect(state.selectedEntryId).toBeNull();
    });
  });

  describe('selectEntry', () => {
    it('selects an entry and switches to detail view', () => {
      const entry = mockEntry();
      useUIStore.getState().selectEntry(entry);

      const state = useUIStore.getState();
      expect(state.selectedEntry).toEqual(entry);
      expect(state.selectedEntryId).toBe('e1');
      expect(state.panelView).toBe('detail');
    });

    it('deselects when called with null', () => {
      useUIStore.getState().selectEntry(mockEntry());
      useUIStore.getState().selectEntry(null);

      expect(useUIStore.getState().selectedEntry).toBeNull();
      expect(useUIStore.getState().selectedEntryId).toBeNull();
    });
  });

  describe('setPanelView', () => {
    it('updates panel view', () => {
      useUIStore.getState().setPanelView('editor');
      expect(useUIStore.getState().panelView).toBe('editor');

      useUIStore.getState().setPanelView('settings');
      expect(useUIStore.getState().panelView).toBe('settings');
    });
  });

  describe('searchQuery', () => {
    it('updates search query', () => {
      useUIStore.getState().setSearchQuery('test query');
      expect(useUIStore.getState().searchQuery).toBe('test query');
    });
  });

  describe('globalSearchOpen', () => {
    it('toggles global search', () => {
      useUIStore.getState().setGlobalSearchOpen(true);
      expect(useUIStore.getState().globalSearchOpen).toBe(true);

      useUIStore.getState().setGlobalSearchOpen(false);
      expect(useUIStore.getState().globalSearchOpen).toBe(false);
    });
  });

  describe('contextMenu', () => {
    it('sets and clears context menu', () => {
      const menu = { x: 100, y: 200, entry: mockEntry() };
      useUIStore.getState().setContextMenu(menu);
      expect(useUIStore.getState().contextMenu).toEqual(menu);

      useUIStore.getState().setContextMenu(null);
      expect(useUIStore.getState().contextMenu).toBeNull();
    });
  });
});
