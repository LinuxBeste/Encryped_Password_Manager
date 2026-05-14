import { useState } from 'react';
import { Globe, Copy, Edit3, Trash2, ExternalLink, Eye, EyeOff, Check, CreditCard } from 'lucide-react';
import type { VaultEntry } from '@/types';
import { PasswordField } from '../ui/PasswordField';
import { TOTPDisplay } from './TOTPDisplay';
import { Button } from '../ui/Button';
import { extractDomain, formatDateFull } from '@/utils/format';
import { scorePassword } from '@/utils/password';
import { Badge } from '../ui/Badge';

interface EntryDetailProps {
  entry: VaultEntry;
  onEdit: () => void;
  onDelete: () => void;
}

export function EntryDetail({ entry, onEdit, onDelete }: EntryDetailProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const domain = entry.url ? extractDomain(entry.url) : null;

  const handleCopy = async (label: string, value: string) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.clipboard.write(value);
      } else {
        await navigator.clipboard.writeText(value);
      }
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 2000);
    } catch { /* ignore */ }
  };

  const passwordScore = entry.password ? scorePassword(entry.password).score : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-heading font-semibold text-text-primary">{entry.title}</h1>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit3 className="w-4 h-4" />
            Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-accent-red hover:text-accent-red">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
        {entry.url && (
          <div>
            <label className="text-caption text-text-muted uppercase tracking-wide font-medium mb-1 block">URL</label>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-text-muted shrink-0" />
              <span className="text-body text-accent truncate">{entry.url}</span>
              <button
                onClick={() => handleCopy('url', entry.url)}
                className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-hover"
              >
                {copiedField === 'url' ? <Check className="w-3.5 h-3.5 text-accent-green" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              {domain && (
                <a href={entry.url} target="_blank" rel="noopener noreferrer" className="p-1 rounded text-text-muted hover:text-accent hover:bg-hover">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        )}

        {entry.username && (
          <div>
            <label className="text-caption text-text-muted uppercase tracking-wide font-medium mb-1 block">Username</label>
            <div className="flex items-center gap-2">
              <span className="text-body text-text-primary font-mono">{entry.username}</span>
              <button
                onClick={() => handleCopy('username', entry.username)}
                className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-hover"
              >
                {copiedField === 'username' ? <Check className="w-3.5 h-3.5 text-accent-green" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}

        {entry.type === 'password' && entry.password && (
          <div>
            <label className="text-caption text-text-muted uppercase tracking-wide font-medium mb-1 block">Password</label>
            <PasswordField value={entry.password} readonly showStrength strengthScore={passwordScore} />
          </div>
        )}

        {entry.totpSecret && (
          <div>
            <label className="text-caption text-text-muted uppercase tracking-wide font-medium mb-1 block">Two-Factor Code</label>
            <TOTPDisplay secret={entry.totpSecret} />
          </div>
        )}

        {entry.type === 'credit-card' && (
          <CardPreview entry={entry} />
        )}

        {entry.notes && (
          <div>
            <label className="text-caption text-text-muted uppercase tracking-wide font-medium mb-1 block">Notes</label>
            <div className="text-body text-text-primary whitespace-pre-wrap bg-surface rounded-md p-3 border border-border">
              {entry.notes}
            </div>
          </div>
        )}

        {entry.tags && entry.tags.length > 0 && (
          <div>
            <label className="text-caption text-text-muted uppercase tracking-wide font-medium mb-1 block">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {entry.tags.map((tag) => (
                <Badge key={tag} variant="default">{tag}</Badge>
              ))}
            </div>
          </div>
        )}

        {entry.customFields && entry.customFields.length > 0 && (
          <div>
            <label className="text-caption text-text-muted uppercase tracking-wide font-medium mb-1 block">Custom Fields</label>
            <div className="space-y-2">
              {entry.customFields.map((field) => (
                <CustomFieldRow key={field.id} label={field.label} value={field.value} hidden={field.hidden} />
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 pt-2 text-caption text-text-faint border-t border-border">
          <span>Created: {formatDateFull(entry.createdAt)}</span>
          <span>Updated: {formatDateFull(entry.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}

function CardPreview({ entry }: { entry: VaultEntry }) {
  const cardNumber = entry.username || '•••• •••• •••• ••••';
  const expiry = entry.url || '••/••';
  const cvv = entry.notes?.slice(0, 3) || '•••';

  return (
    <div className="bg-gradient-to-br from-accent/20 to-accent-purple/20 rounded-lg p-4 border border-border">
      <div className="flex items-center justify-between mb-6">
        <CreditCard className="w-8 h-8 text-text-muted" />
        <span className="text-caption text-text-muted">VaultLock</span>
      </div>
      <p className="text-heading font-mono tracking-wider text-text-primary mb-4">{cardNumber}</p>
      <div className="flex items-center gap-6">
        <div>
          <p className="text-caption text-text-muted">Expiry</p>
          <p className="text-body font-mono text-text-primary">{expiry}</p>
        </div>
        <div>
          <p className="text-caption text-text-muted">CVV</p>
          <p className="text-body font-mono text-text-primary">{cvv}</p>
        </div>
      </div>
    </div>
  );
}

function CustomFieldRow({ label, value, hidden }: { label: string; value: string; hidden: boolean }) {
  const [show, setShow] = useState(!hidden);

  return (
    <div className="flex items-center justify-between py-1.5 px-3 bg-surface rounded-md border border-border">
      <div>
        <p className="text-caption text-text-muted">{label}</p>
        <p className="text-body text-text-primary font-mono">{show ? value : '••••••••'}</p>
      </div>
      {hidden && (
        <button onClick={() => setShow(!show)} className="p-1 rounded text-text-muted hover:text-text-primary">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}

