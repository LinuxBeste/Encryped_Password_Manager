import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearch } from '../useSearch';
import type { VaultEntry } from '@/types';

const createEntry = (overrides: Partial<VaultEntry> = {}): VaultEntry => ({
  id: '1',
  vaultId: 'v1',
  folderId: null,
  type: 'password',
  title: 'Test Entry',
  username: 'testuser',
  password: 'secret',
  url: 'https://example.com',
  notes: 'some notes',
  totpSecret: null,
  tags: ['important'],
  customFields: [],
  favorite: false,
  createdAt: 1000,
  updatedAt: 1000,
  deletedAt: null,
  origin: 'server',
  ...overrides,
});

const entries = [
  createEntry({ id: '1', title: 'Gmail', username: 'user1', url: 'https://gmail.com', tags: ['google'] }),
  createEntry({ id: '2', title: 'GitHub', username: 'dev', url: 'https://github.com', tags: ['dev'] }),
  createEntry({ id: '3', title: 'Bank Account', username: 'finance', notes: 'chase bank', tags: ['finance', 'important'] }),
  createEntry({ id: '4', title: 'Netflix', username: 'stream', url: 'https://netflix.com', tags: ['entertainment'] }),
];

describe('useSearch', () => {
  it('returns empty results for empty query', () => {
    const { result } = renderHook(() => useSearch(entries));
    expect(result.current.results).toEqual([]);
  });

  it('filters entries by title', () => {
    const { result } = renderHook(() => useSearch(entries));
    act(() => result.current.setQuery('gmail'));
    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].id).toBe('1');
  });

  it('filters entries by username', () => {
    const { result } = renderHook(() => useSearch(entries));
    act(() => result.current.setQuery('finance'));
    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].id).toBe('3');
  });

  it('filters entries by URL', () => {
    const { result } = renderHook(() => useSearch(entries));
    act(() => result.current.setQuery('github'));
    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].id).toBe('2');
  });

  it('filters entries by notes', () => {
    const { result } = renderHook(() => useSearch(entries));
    act(() => result.current.setQuery('chase'));
    expect(result.current.results).toHaveLength(1);
  });

  it('filters entries by tags', () => {
    const { result } = renderHook(() => useSearch(entries));
    act(() => result.current.setQuery('google'));
    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].id).toBe('1');
  });

  it('performs case-insensitive search', () => {
    const { result } = renderHook(() => useSearch(entries));
    act(() => result.current.setQuery('GMAIL'));
    expect(result.current.results).toHaveLength(1);
  });

  it('returns multiple matches', () => {
    const { result } = renderHook(() => useSearch(entries));
    act(() => result.current.setQuery('e'));
    expect(result.current.results.length).toBeGreaterThan(1);
  });

  describe('navigation', () => {
    it('navigates down through results', () => {
      const { result } = renderHook(() => useSearch(entries));
      act(() => result.current.setQuery('e'));
      act(() => result.current.navigate('down'));
      expect(result.current.selectedIndex).toBe(1);
      act(() => result.current.navigate('down'));
      expect(result.current.selectedIndex).toBe(2);
    });

    it('navigates up through results', () => {
      const { result } = renderHook(() => useSearch(entries));
      act(() => result.current.setQuery('e'));
      act(() => result.current.navigate('down'));
      act(() => result.current.navigate('down'));
      act(() => result.current.navigate('up'));
      expect(result.current.selectedIndex).toBe(1);
    });

    it('clamps to first result index', () => {
      const { result } = renderHook(() => useSearch(entries));
      act(() => result.current.setQuery('e'));
      act(() => result.current.navigate('up'));
      expect(result.current.selectedIndex).toBe(0);
    });

    it('clamps to last result index', () => {
      const { result } = renderHook(() => useSearch(entries));
      act(() => result.current.setQuery('e'));
      const count = result.current.results.length;
      for (let i = 0; i < count + 5; i++) {
        act(() => result.current.navigate('down'));
      }
      expect(result.current.selectedIndex).toBe(count - 1);
    });
  });

  describe('reset', () => {
    it('clears query and resets index', () => {
      const { result } = renderHook(() => useSearch(entries));
      act(() => result.current.setQuery('test'));
      act(() => result.current.navigate('down'));
      act(() => result.current.reset());
      expect(result.current.query).toBe('');
      expect(result.current.selectedIndex).toBe(0);
    });
  });
});
