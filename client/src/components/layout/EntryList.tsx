import { useState, useMemo } from 'react';
import { Search, ArrowUpDown, Filter } from 'lucide-react';
import { EntryCard } from '../entries/EntryCard';
import type { VaultEntry } from '@/types';

type FilterType = 'all' | 'favorites' | 'weak' | 'reused' | 'old';
type SortType = 'az' | 'za' | 'newest' | 'oldest' | 'modified';

interface EntryListProps {
  entries: VaultEntry[];
  selectedId: string | null;
  onSelect: (entry: VaultEntry) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onContextMenu: (e: React.MouseEvent, entry: VaultEntry) => void;
}

export function EntryList({ entries, selectedId, onSelect, searchQuery, onSearchChange, onContextMenu }: EntryListProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('az');

  const filtered = useMemo(() => {
    let result = [...entries];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.username.toLowerCase().includes(q) ||
          e.url.toLowerCase().includes(q) ||
          e.notes.toLowerCase().includes(q)
      );
    }

    switch (activeFilter) {
      case 'favorites':
        result = result.filter((e) => e.favorite);
        break;
      case 'weak':
        result = result.filter((e) => e.type === 'password');
        break;
      case 'reused':
        result = result.filter((e) => e.type === 'password');
        break;
      case 'old': {
        const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
        result = result.filter((e) => e.updatedAt < cutoff);
        break;
      }
    }

    switch (sort) {
      case 'az':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'za':
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'newest':
        result.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'oldest':
        result.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case 'modified':
        result.sort((a, b) => b.updatedAt - a.updatedAt);
        break;
    }

    return result;
  }, [entries, searchQuery, activeFilter, sort]);

  return (
    <div className="w-[300px] border-r border-border bg-panel flex flex-col">
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search entries..."
            className="w-full h-8 pl-8 pr-3 rounded-md border border-border bg-surface text-text-primary text-body placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div className="flex items-center gap-1.5 mt-2.5">
          {(['all', 'favorites', 'weak', 'reused', 'old'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-2 h-6 rounded text-caption font-medium transition-colors duration-150 ${
                activeFilter === f
                  ? 'bg-accent text-white'
                  : 'bg-surface text-text-muted hover:text-text-primary hover:bg-hover'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-caption text-text-muted">{filtered.length} entries</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
            className="text-caption bg-transparent border-none text-text-muted hover:text-text-primary focus:outline-none cursor-pointer"
          >
            <option value="az">A–Z</option>
            <option value="za">Z–A</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="modified">Modified</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <Search className="w-8 h-8 text-text-faint mb-2" />
            <p className="text-body text-text-muted">No entries found</p>
          </div>
        ) : (
          filtered.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              selected={selectedId === entry.id}
              onClick={() => onSelect(entry)}
              onContextMenu={(e) => onContextMenu(e, entry)}
            />
          ))
        )}
      </div>
    </div>
  );
}
