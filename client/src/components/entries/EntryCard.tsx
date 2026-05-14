import { KeyRound, FileText, CreditCard, User, Terminal } from 'lucide-react';
import type { VaultEntry, EntryType } from '@/types';
import { extractDomain, formatDate } from '@/utils/format';

// Icon mapping per entry type
const typeIcons: Record<EntryType, typeof KeyRound> = {
  'password': KeyRound,
  'note': FileText,
  'credit-card': CreditCard,
  'identity': User,
  'ssh-key': Terminal,
};

// Left border color per entry type
const typeColors: Record<EntryType, string> = {
  'password': 'border-l-accent',
  'note': 'border-l-accent-green',
  'credit-card': 'border-l-accent-amber',
  'identity': 'border-l-accent-purple',
  'ssh-key': 'border-l-accent-amber',
};

interface EntryCardProps {
  entry: VaultEntry;
  selected: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

// Compact entry card shown in the entry list sidebar
export function EntryCard({ entry, selected, onClick, onContextMenu }: EntryCardProps) {
  const Icon = typeIcons[entry.type] || KeyRound;
  const domain = entry.url ? extractDomain(entry.url) : null;
  const isOld = entry.updatedAt < Date.now() - 90 * 24 * 60 * 60 * 1000;

  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`
        w-full flex items-start gap-3 px-4 py-2.5 text-left border-l-[3px] transition-all duration-150
        ${selected
          ? 'bg-surface border-l-accent'
          : `${typeColors[entry.type]} hover:bg-hover`
        }
      `}
    >
      {/* Type icon */}
      <div className={`p-1.5 rounded-md ${selected ? 'bg-accent/10' : 'bg-surface'}`}>
        <Icon className={`w-4 h-4 ${selected ? 'text-accent' : 'text-text-muted'}`} />
      </div>
      {/* Title, username, and date */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-body font-medium text-text-primary truncate">{entry.title}</span>
          {entry.favorite && <span className="text-accent-amber text-caption">★</span>}
          {isOld && <span className="text-caption text-text-faint">old</span>}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-caption text-text-muted truncate">
            {entry.username || domain || '—'}
          </span>
        </div>
        <span className="text-caption text-text-faint">{formatDate(entry.updatedAt)}</span>
      </div>
    </button>
  );
}
