import { useSettingsStore } from '@/store/settings.store';
import { Select } from '@/components/ui/Select';
import { Toggle } from '@/components/ui/Toggle';

// Available accent color options
const accentColors = [
  { value: 'blue', label: 'Blue', color: '#388bfd' },
  { value: 'purple', label: 'Purple', color: '#bc8cff' },
  { value: 'green', label: 'Green', color: '#3fb950' },
  { value: 'teal', label: 'Teal', color: '#56d4dd' },
  { value: 'amber', label: 'Amber', color: '#d29922' },
  { value: 'red', label: 'Red', color: '#f85149' },
];

// Appearance settings: theme, accent color, font size, display toggles
export function AppearanceTab() {
  const { settings, updateUI } = useSettingsStore();

  return (
    <div className="max-w-lg space-y-5">
      <h2 className="text-heading font-semibold text-text-primary">Appearance</h2>

      <Select
        label="Theme"
        value={settings.ui.theme}
        onChange={(e) => updateUI({ theme: e.target.value as any })}
        options={[
          { value: 'system', label: 'System' },
          { value: 'dark', label: 'Dark' },
          { value: 'light', label: 'Light' },
        ]}
      />

      <div>
        <label className="text-caption text-text-muted uppercase tracking-wide font-medium mb-1.5 block">Accent Color</label>
        <div className="flex gap-3">
          {accentColors.map((c) => (
            <button
              key={c.value}
              onClick={() => updateUI({ accentColor: c.value as any })}
              className={`w-8 h-8 rounded-full transition-all duration-150 ${
                settings.ui.accentColor === c.value ? 'ring-2 ring-offset-2 ring-offset-app ring-accent scale-110' : ''
              }`}
              style={{ backgroundColor: c.color }}
              title={c.label}
            />
          ))}
        </div>
      </div>

      <Select
        label="Font size"
        value={settings.ui.fontSize}
        onChange={(e) => updateUI({ fontSize: e.target.value as any })}
        options={[
          { value: 'small', label: 'Small' },
          { value: 'medium', label: 'Medium' },
          { value: 'large', label: 'Large' },
        ]}
      />

      <Toggle checked={settings.ui.compactMode} onChange={(v) => updateUI({ compactMode: v })} label="Compact mode" />
      <Toggle checked={settings.ui.showFavicons} onChange={(v) => updateUI({ showFavicons: v })} label="Show favicons" />
      <Toggle checked={settings.ui.animateTransitions} onChange={(v) => updateUI({ animateTransitions: v })} label="Animate transitions" />
    </div>
  );
}
