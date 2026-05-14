import { useState, useMemo, useCallback } from 'react';
import type { VaultEntry } from '@/types';

export function useSearch(entries: VaultEntry[]) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.username.toLowerCase().includes(q) ||
        e.url.toLowerCase().includes(q) ||
        e.notes.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [entries, query]);

  const navigate = useCallback(
    (direction: 'up' | 'down') => {
      setSelectedIndex((prev) => {
        if (direction === 'down') return Math.min(prev + 1, Math.max(0, results.length - 1));
        return Math.max(prev - 1, 0);
      });
    },
    [results.length]
  );

  const reset = useCallback(() => {
    setQuery('');
    setSelectedIndex(0);
  }, []);

  return { query, setQuery, results, selectedIndex, setSelectedIndex, navigate, reset };
}
