import { ContextMenu } from '../ui/ContextMenu';
import { FolderPlus, Pencil, Trash2 } from 'lucide-react';

interface FolderContextMenuProps {
  position: { x: number; y: number };
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
  onAddSubfolder: () => void;
}

export function FolderContextMenu({ position, onClose, onRename, onDelete, onAddSubfolder }: FolderContextMenuProps) {
  return (
    <ContextMenu
      position={position}
      onClose={onClose}
      items={[
        { id: 'rename', label: 'Rename', icon: Pencil, onClick: onRename },
        { id: 'add-sub', label: 'Add Subfolder', icon: FolderPlus, onClick: onAddSubfolder },
        { id: 'sep', separator: true, label: '', onClick: () => {} },
        { id: 'delete', label: 'Delete', icon: Trash2, danger: true, onClick: onDelete },
      ]}
    />
  );
}
