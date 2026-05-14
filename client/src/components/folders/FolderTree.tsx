import { useState } from 'react';
import { Folder, FolderOpen, MoreHorizontal, Plus } from 'lucide-react';
import { useVaultStore } from '@/store/vault.store';

interface FolderTreeProps {
  selectedFolderId?: string | null;
  onSelectFolder?: (id: string | null) => void;
}

export function FolderTree({ selectedFolderId, onSelectFolder }: FolderTreeProps) {
  const folders = useVaultStore((s) => s.folders);
  const entries = useVaultStore((s) => s.entries);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const rootFolders = folders.filter((f) => !f.parentId);
  const sorted = [...rootFolders].sort((a, b) => a.sortOrder - b.sortOrder);

  const getChildCount = (folderId: string) =>
    entries.filter((e) => e.folderId === folderId).length;

  return (
    <div className="space-y-0.5 px-2">
      <button
        onClick={() => onSelectFolder?.(null)}
        className={`w-full flex items-center gap-2 h-8 px-2 rounded-md text-body transition-colors duration-150 ${
          !selectedFolderId ? 'bg-surface text-text-primary' : 'text-text-muted hover:text-text-primary hover:bg-hover'
        }`}
      >
        <FolderOpen className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left">All entries</span>
        <span className="text-caption text-text-faint">{entries.length}</span>
      </button>

      {sorted.map((folder) => (
        <div key={folder.id}>
          <button
            onClick={() => onSelectFolder?.(folder.id)}
            className={`w-full flex items-center gap-2 h-8 px-2 rounded-md text-body transition-colors duration-150 ${
              selectedFolderId === folder.id
                ? 'bg-surface text-text-primary'
                : 'text-text-muted hover:text-text-primary hover:bg-hover'
            }`}
          >
            <Folder className="w-4 h-4 shrink-0 text-accent-amber" />
            <span className="flex-1 text-left truncate">{folder.name}</span>
            <span className="text-caption text-text-faint">{getChildCount(folder.id)}</span>
          </button>
        </div>
      ))}

      <button className="w-full flex items-center gap-2 h-8 px-2 rounded-md text-body text-text-faint hover:text-text-primary hover:bg-hover transition-colors duration-150">
        <Plus className="w-3.5 h-3.5" />
        <span>Add folder</span>
      </button>
    </div>
  );
}
