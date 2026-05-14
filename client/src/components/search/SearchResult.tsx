import { Search } from 'lucide-react';

interface SearchResultProps {
  query: string;
  resultCount: number;
}

// Header bar showing the number of results for the current search query
export function SearchResult({ query, resultCount }: SearchResultProps) {
  if (!query) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
      <Search className="w-3.5 h-3.5 text-text-muted" />
      <span className="text-caption text-text-muted">
        {resultCount} result{resultCount !== 1 ? 's' : ''} for "<span className="text-text-primary">{query}</span>"
      </span>
    </div>
  );
}
