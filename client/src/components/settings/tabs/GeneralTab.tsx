import { useSettingsStore } from '@/store/settings.store';
import { Select } from '@/components/ui/Select';
import { Toggle } from '@/components/ui/Toggle';

// General settings: language, default entry type, and UI toggles
export function GeneralTab() {
  const { settings, updateUI } = useSettingsStore();

  return (
    <div className="max-w-lg space-y-5">
      <h2 className="text-heading font-semibold text-text-primary">General Settings</h2>

      <Select
        label="Language"
        value={settings.ui.language}
        onChange={(e) => updateUI({ language: e.target.value })}
        options={[
          { value: 'en', label: 'English' },
          { value: 'de', label: 'Deutsch' },
          { value: 'fr', label: 'Français' },
          { value: 'es', label: 'Español' },
          { value: 'ja', label: '日本語' },
        ]}
      />

      <Select
        label="Default entry type"
        value={settings.ui.defaultEntryType}
        onChange={(e) => updateUI({ defaultEntryType: e.target.value as any })}
        options={[
          { value: 'password', label: 'Password' },
          { value: 'note', label: 'Secure Note' },
          { value: 'credit-card', label: 'Credit Card' },
          { value: 'identity', label: 'Identity' },
          { value: 'ssh-key', label: 'SSH Key' },
        ]}
      />

      <Toggle checked={settings.ui.showEntryCountInSidebar} onChange={(v) => updateUI({ showEntryCountInSidebar: v })} label="Show entry count in sidebar" />
      <Toggle checked={settings.ui.confirmBeforeDelete} onChange={(v) => updateUI({ confirmBeforeDelete: v })} label="Confirm before deleting" />
      <Toggle checked={settings.ui.minimizeToTray} onChange={(v) => updateUI({ minimizeToTray: v })} label="Minimize to tray on close" />
    </div>
  );
}
