import { useEffect, useRef, useCallback } from 'react';
import { Search, KeyRound, FileText, CreditCard, User, Terminal, ArrowUpDown } from 'lucide-react';
import { useSearch } from '@/hooks/useSearch';
import { useVaultStore } from '@/store/vault.store';
import { useUIStore } from '@/store/ui.store';
import { extractDomain } from '@/utils/format';

// Icon mapping per entry type for search results
const typeIcons = {
  'password': KeyRound,
  'note': FileText,
  'credit-card': CreditCard,
  'identity': User,
  'ssh-key': Terminal,
};

// Cmd+K global search modal with keyboard navigation
export function GlobalSearch() {
  const entries = useVaultStore((s) => s.entries);
  const folders = useVaultStore((s) => s.folders);
  const { query, setQuery, results, selectedIndex, setSelectedIndex, navigate, reset } = useSearch(entries);
  const { globalSearchOpen, setGlobalSearchOpen, selectEntry } = useUIStore();
  const inputRef = useRef<HTMLInputElement>(null);

  // Toggle search with Cmd+K / Ctrl+K, close with Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(!globalSearchOpen);
      }
      if (e.key === 'Escape' && globalSearchOpen) {
        setGlobalSearchOpen(false);
      }
    },
    [globalSearchOpen, setGlobalSearchOpen]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Auto-focus input when opened, reset state when closed
  useEffect(() => {
    if (globalSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (!globalSearchOpen) {
      reset();
    }
  }, [globalSearchOpen, reset]);

  // Arrow key navigation and Enter to select from results
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); navigate('down'); }
    if (e.key === 'ArrowUp') { e.preventDefault(); navigate('up'); }
    if (e.key === 'Enter' && results[selectedIndex]) {
      selectEntry(results[selectedIndex]);
      setGlobalSearchOpen(false);
    }
    if (e.key === 'Escape') {
      setGlobalSearchOpen(false);
    }
  };

  if (!globalSearchOpen) return null;

  return (
    // Backdrop click to close
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) setGlobalSearchOpen(false); }}
    >
      <div className="w-full max-w-xl bg-panel border border-border rounded-lg shadow-2xl overflow-hidden animate-fade-in">
        {/* Search input with ESC badge */}
        <div className="flex items-center px-4 border-b border-border">
          <Search className="w-4 h-4 text-text-muted shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search entries..."
            className="flex-1 h-11 px-3 bg-transparent text-text-primary text-body placeholder:text-text-faint focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border text-caption text-text-faint">ESC</kbd>
        </div>

        {/* Search results list */}
        {results.length > 0 && (
          <div className="max-h-80 overflow-y-auto py-1">
            {results.map((entry, i) => {
              const Icon = typeIcons[entry.type] || KeyRound;
              const folder = folders.find((f) => f.id === entry.folderId);
              const domain = entry.url ? extractDomain(entry.url) : null;

              return (
                <button
                  key={entry.id}
                  onClick={() => { selectEntry(entry); setGlobalSearchOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150 ${
                    i === selectedIndex ? 'bg-surface' : 'hover:bg-hover'
                  }`}
                >
                  <div className="p-1 rounded bg-surface">
                    <Icon className="w-4 h-4 text-text-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-body font-medium text-text-primary">{entry.title}</span>
                    <span className="text-caption text-text-muted ml-2">{domain || entry.username}</span>
                  </div>
                  {folder && <span className="text-caption text-text-faint">{folder.name}</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* No results state */}
        {query && results.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-body text-text-muted">No results for "{query}"</p>
          </div>
        )}

        {/* Empty search state */}
        {!query && (
          <div className="py-6 text-center">
            <p className="text-caption text-text-faint">Type to search across all entries</p>
          </div>
        )}
      </div>
    </div>
  );
}
