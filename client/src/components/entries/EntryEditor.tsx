import { useState, useEffect } from 'react';
import { Save, X, Wand2 } from 'lucide-react';
import type { VaultEntry, EntryType } from '@/types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { PasswordField } from '../ui/PasswordField';
import { Select } from '../ui/Select';
import { PasswordGenerator } from './PasswordGenerator';
import { scorePassword } from '@/utils/password';

interface EntryEditorProps {
  entry?: VaultEntry | null;
  folders: { id: string; name: string }[];
  defaultFolderId?: string | null;
  onSave: (data: Partial<VaultEntry>) => void;
  onCancel: () => void;
}

// Fields and labels shown per entry type
const TYPE_FIELDS: Record<EntryType, {
  showPassword: boolean;
  showUsername: boolean;
  showUrl: boolean;
  showNotes: boolean;
  usernameLabel: string;
  urlLabel: string;
  passwordLabel: string;
  notesLabel: string;
}> = {
  password:     { showPassword: true,  showUsername: true,  showUrl: true,  showNotes: true,  usernameLabel: 'Username',            urlLabel: 'URL',                     passwordLabel: 'Password',     notesLabel: 'Notes' },
  note:         { showPassword: false, showUsername: false, showUrl: false, showNotes: true,  usernameLabel: 'Username',            urlLabel: 'URL',                     passwordLabel: 'Password',     notesLabel: 'Notes' },
  'credit-card':{ showPassword: true,  showUsername: true,  showUrl: true,  showNotes: true,  usernameLabel: 'Card Number',         urlLabel: 'Expiry',                  passwordLabel: 'PIN',          notesLabel: 'CVV / Notes' },
  identity:     { showPassword: false, showUsername: true,  showUrl: true,  showNotes: true,  usernameLabel: 'Full Name',           urlLabel: 'Email / Website',         passwordLabel: 'Password',     notesLabel: 'Notes' },
  'ssh-key':    { showPassword: true,  showUsername: true,  showUrl: true,  showNotes: true,  usernameLabel: 'Key Name / Username', urlLabel: 'Host / URL',              passwordLabel: 'Passphrase',   notesLabel: 'Private Key' },
};

// Create/edit form for a vault entry
export function EntryEditor({ entry, folders, defaultFolderId, onSave, onCancel }: EntryEditorProps) {
  const [title, setTitle] = useState(entry?.title || '');
  const [type, setType] = useState<EntryType>(entry?.type || 'password');
  const [username, setUsername] = useState(entry?.username || '');
  const [password, setPassword] = useState(entry?.password || '');
  const [url, setUrl] = useState(entry?.url || '');
  const [notes, setNotes] = useState(entry?.notes || '');
  const [folderId, setFolderId] = useState(entry?.folderId || defaultFolderId || '');
  const [showGenerator, setShowGenerator] = useState(false);

  const fields = TYPE_FIELDS[type];
  const passwordScore = password ? scorePassword(password).score : 0;

  // Collect form data and call onSave
  const handleSave = () => {
    onSave({
      title,
      type,
      username,
      password,
      url,
      notes,
      folderId: folderId || null,
      tags: entry?.tags || [],
      customFields: entry?.customFields || [],
      favorite: entry?.favorite || false,
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Editor header with save/cancel */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-heading font-semibold text-text-primary">
          {entry ? 'Edit Entry' : 'New Entry'}
        </h1>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={!title}>
            <Save className="w-4 h-4" />
            Save
          </Button>
        </div>
      </div>

      {/* Form fields */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Entry title" />

        {/* Entry type selector */}
        <Select
          label="Type"
          value={type}
          onChange={(e) => setType(e.target.value as EntryType)}
          options={[
            { value: 'password', label: 'Password' },
            { value: 'note', label: 'Secure Note' },
            { value: 'credit-card', label: 'Credit Card' },
            { value: 'identity', label: 'Identity' },
            { value: 'ssh-key', label: 'SSH Key' },
          ]}
        />

        {/* Password field with generator button */}
        {fields.showPassword && (
          <div>
            <label className="text-caption text-text-muted uppercase tracking-wide font-medium mb-1.5 block">{fields.passwordLabel}</label>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <PasswordField
                  value={password}
                  onChange={setPassword}
                  showStrength
                  strengthScore={passwordScore}
                />
              </div>
              <Button variant="secondary" size="md" onClick={() => setShowGenerator(true)}>
                <Wand2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {fields.showUsername && (
          <Input label={fields.usernameLabel} value={username} onChange={(e) => setUsername(e.target.value)} placeholder={type === 'credit-card' ? '•••• •••• •••• ••••' : 'username@example.com'} />
        )}
        {fields.showUrl && (
          <Input label={fields.urlLabel} value={url} onChange={(e) => setUrl(e.target.value)} placeholder={type === 'credit-card' ? 'MM/YY' : 'https://example.com'} />
        )}

        {/* Notes textarea */}
        {fields.showNotes && (
          <div>
            <label className="text-caption text-text-muted uppercase tracking-wide font-medium mb-1.5 block">{fields.notesLabel}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 rounded-md border border-border bg-panel text-text-primary text-body focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent resize-none"
              placeholder="Add notes..."
            />
          </div>
        )}

        {/* Folder selector */}
        {folders.length > 0 && (
          <Select
            label="Folder"
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            options={[
              { value: '', label: 'No folder' },
              ...folders.map((f) => ({ value: f.id, label: f.name })),
            ]}
          />
        )}
      </div>

      {/* Password generator modal */}
      {showGenerator && (
        <PasswordGenerator
          onSelect={(password) => { setPassword(password); setShowGenerator(false); }}
          onClose={() => setShowGenerator(false)}
        />
      )}
    </div>
  );
}
