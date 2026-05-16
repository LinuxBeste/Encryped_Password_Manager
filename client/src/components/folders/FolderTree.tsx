import { useState } from 'react';
import { Folder, FolderOpen, MoreHorizontal, Plus, Check, X, Pencil, Trash2 } from 'lucide-react';
import { useVaultStore } from '@/store/vault.store';
import { useVault } from '@/hooks/useVault';
import { ContextMenu } from '../ui/ContextMenu';

interface FolderTreeProps {
  selectedFolderId?: string | null;
  onSelectFolder?: (id: string | null) => void;
}

export function FolderTree({ selectedFolderId, onSelectFolder }: FolderTreeProps) {
  const folders = useVaultStore((s) => s.folders);
  const entries = useVaultStore((s) => s.entries);
  const { createFolder, renameFolder, deleteFolder } = useVault();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; folderId: string } | null>(null);

  const rootFolders = folders.filter((f) => !f.parentId);
  const sorted = [...rootFolders].sort((a, b) => a.sortOrder - b.sortOrder);

  const getChildCount = (folderId: string) =>
    entries.filter((e) => e.folderId === folderId).length;

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    await createFolder(name);
    setNewName('');
    setAdding(false);
  };

  const handleCancel = () => {
    setNewName('');
    setAdding(false);
  };

  const handleRenameStart = (folderId: string, currentName: string) => {
    setRenamingId(folderId);
    setRenameName(currentName);
    setContextMenu(null);
  };

  const handleRenameSubmit = async (folderId: string) => {
    const name = renameName.trim();
    if (!name) return;
    await renameFolder(folderId, name);
    setRenamingId(null);
    setRenameName('');
  };

  const handleRenameCancel = () => {
    setRenamingId(null);
    setRenameName('');
  };

  const handleDelete = async (folderId: string) => {
    setContextMenu(null);
    await deleteFolder(folderId);
  };

  const handleContextMenu = (e: React.MouseEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, folderId });
  };

  return (
    <div className="space-y-0.5 px-2" onContextMenu={(e) => e.preventDefault()}>
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
          {renamingId === folder.id ? (
            <div className="flex items-center gap-1 h-8 px-2">
              <input
                autoFocus
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit(folder.id);
                  if (e.key === 'Escape') handleRenameCancel();
                }}
                onBlur={() => handleRenameSubmit(folder.id)}
                placeholder="Folder name"
                className="flex-1 h-7 px-2 rounded text-caption bg-surface border border-border text-text-primary placeholder:text-text-faint focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button onClick={() => handleRenameSubmit(folder.id)} className="p-0.5 text-accent hover:text-accent/80 transition-colors">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleRenameCancel} className="p-0.5 text-text-muted hover:text-text-primary transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onSelectFolder?.(folder.id)}
              onContextMenu={(e) => handleContextMenu(e, folder.id)}
              className={`w-full group flex items-center gap-2 h-8 px-2 rounded-md text-body transition-colors duration-150 ${
                selectedFolderId === folder.id
                  ? 'bg-surface text-text-primary'
                  : 'text-text-muted hover:text-text-primary hover:bg-hover'
              }`}
            >
              <Folder className="w-4 h-4 shrink-0 text-accent-amber" />
              <span className="flex-1 text-left truncate">{folder.name}</span>
              <span className="text-caption text-text-faint">{getChildCount(folder.id)}</span>
              <button
                onClick={(e) => { e.stopPropagation(); handleContextMenu(e, folder.id); }}
                className="p-0.5 rounded text-text-faint hover:text-text-muted hover:bg-hover opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </button>
          )}
        </div>
      ))}

      {adding ? (
        <div className="flex items-center gap-1 h-8 px-2">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') handleCancel(); }}
            placeholder="Folder name"
            className="flex-1 h-7 px-2 rounded text-caption bg-surface border border-border text-text-primary placeholder:text-text-faint focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <button onClick={handleAdd} className="p-0.5 text-accent hover:text-accent/80 transition-colors">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleCancel} className="p-0.5 text-text-muted hover:text-text-primary transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center gap-2 h-8 px-2 rounded-md text-body text-text-faint hover:text-text-primary hover:bg-hover transition-colors duration-150"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add folder</span>
        </button>
      )}

      {contextMenu && (
        <ContextMenu
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu(null)}
          items={[
            {
              id: 'rename',
              label: 'Rename',
              icon: Pencil,
              onClick: () => {
                const folder = folders.find((f) => f.id === contextMenu.folderId);
                if (folder) handleRenameStart(folder.id, folder.name);
              },
            },
            {
              id: 'delete',
              label: 'Delete',
              icon: Trash2,
              danger: true,
              onClick: () => handleDelete(contextMenu.folderId),
            },
          ]}
        />
      )}
    </div>
  );
}