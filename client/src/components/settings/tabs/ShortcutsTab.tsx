import { Keyboard } from 'lucide-react';

const shortcutGroups = [
  {
    label: 'General',
    shortcuts: [
      { keys: '⌘K', description: 'Global search' },
      { keys: '⌘N', description: 'New entry' },
      { keys: '⌘L', description: 'Lock vault' },
    ],
  },
  {
    label: 'Navigation',
    shortcuts: [
      { keys: '⌘F', description: 'Focus search in list' },
      { keys: '⌘↑', description: 'Previous entry' },
      { keys: '⌘↓', description: 'Next entry' },
    ],
  },
  {
    label: 'Entry Actions',
    shortcuts: [
      { keys: '⌘C', description: 'Copy password of selected entry' },
      { keys: '⌘B', description: 'Copy username of selected entry' },
      { keys: '⌘⇧C', description: 'Copy TOTP code' },
    ],
  },
];

export function ShortcutsTab() {
  return (
    <div className="max-w-lg space-y-5">
      <h2 className="text-heading font-semibold text-text-primary">Keyboard Shortcuts</h2>

      {shortcutGroups.map((group) => (
        <div key={group.label}>
          <label className="text-caption text-text-muted uppercase tracking-wide font-medium mb-2 block">{group.label}</label>
          <div className="space-y-1">
            {group.shortcuts.map((s) => (
              <div key={s.keys} className="flex items-center justify-between py-1.5 px-3 bg-surface rounded-md border border-border">
                <span className="text-body text-text-primary">{s.description}</span>
                <kbd className="px-2 py-0.5 rounded bg-panel border border-border text-caption font-mono text-text-muted">
                  {s.keys}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
