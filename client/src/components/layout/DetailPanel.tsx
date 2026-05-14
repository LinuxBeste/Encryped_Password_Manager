import type { VaultEntry } from '@/types';
import { EntryDetail } from '../entries/EntryDetail';

interface DetailPanelProps {
  entry: VaultEntry;
  onEdit: () => void;
  onDelete: () => void;
}

export function DetailPanel({ entry, onEdit, onDelete }: DetailPanelProps) {
  return (
    <div className="h-full bg-panel">
      <EntryDetail entry={entry} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}
