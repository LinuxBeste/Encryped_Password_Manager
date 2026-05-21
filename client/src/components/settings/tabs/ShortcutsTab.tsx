import { Keyboard } from 'lucide-react';

// Keyboard shortcut definitions grouped by category
const shortcutGroups = [
  {
    label: 'General',
    shortcuts: [
      { keys: 'Ctrl+K', description: 'Global search' },
      { keys: 'Ctrl+N', description: 'New entry' },
      { keys: 'Ctrl+L', description: 'Lock vault' },
    ],
  },
  {
    label: 'Navigation',
    shortcuts: [
      { keys: 'Ctrl+F', description: 'Focus search in list' },
      { keys: 'Ctrl+↑', description: 'Previous entry' },
      { keys: 'Ctrl+↓', description: 'Next entry' },
    ],
  },
  {
    label: 'Entry Actions',
    shortcuts: [
      { keys: 'Ctrl+C', description: 'Copy password of selected entry' },
      { keys: 'Ctrl+B', description: 'Copy username of selected entry' },
      { keys: 'Ctrl+⇧C', description: 'Copy TOTP code' },
    ],
  },
];

// Displays all available keyboard shortcuts grouped by category
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
