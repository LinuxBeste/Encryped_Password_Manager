import { useState } from 'react';
import { useSettingsStore } from '@/store/settings.store';
import { Select } from '@/components/ui/Select';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

// Security settings: auto-lock, clipboard timeout, biometrics, password change
export function SecurityTab() {
  const { settings, updateSecurity } = useSettingsStore();
  const [showChangePassword, setShowChangePassword] = useState(false);

  return (
    <div className="max-w-lg space-y-5">
      <h2 className="text-heading font-semibold text-text-primary">Security Settings</h2>

      <Select
        label="Auto-lock timeout"
        value={String(settings.security.autoLockTimeout)}
        onChange={(e) => updateSecurity({ autoLockTimeout: Number(e.target.value) })}
        options={[
          { value: '0', label: 'Never' },
          { value: '60000', label: '1 minute' },
          { value: '300000', label: '5 minutes' },
          { value: '900000', label: '15 minutes' },
          { value: '1800000', label: '30 minutes' },
          { value: '3600000', label: '1 hour' },
        ]}
      />

      <Toggle checked={settings.security.autoLockOnSleep} onChange={(v) => updateSecurity({ autoLockOnSleep: v })} label="Auto-lock on system sleep" />

      <Select
        label="Clipboard clear timeout"
        value={String(settings.security.clipboardClearTimeout)}
        onChange={(e) => updateSecurity({ clipboardClearTimeout: Number(e.target.value) })}
        options={[
          { value: '15000', label: '15 seconds' },
          { value: '30000', label: '30 seconds' },
          { value: '60000', label: '1 minute' },
          { value: '0', label: 'Never' },
        ]}
      />

      <Toggle checked={settings.security.biometricUnlock} onChange={(v) => updateSecurity({ biometricUnlock: v })} label="Biometric unlock" />

      <Select
        label="Failed attempts before lockout"
        value={String(settings.security.failedAttemptsBeforeLockout)}
        onChange={(e) => updateSecurity({ failedAttemptsBeforeLockout: Number(e.target.value) })}
        options={[
          { value: '3', label: '3 attempts' },
          { value: '5', label: '5 attempts' },
          { value: '10', label: '10 attempts' },
        ]}
      />

      <div className="pt-2">
        <Button variant="secondary" onClick={() => setShowChangePassword(true)}>
          Change Master Password
        </Button>
      </div>

      <Modal open={showChangePassword} onClose={() => setShowChangePassword(false)} title="Change Master Password" size="sm">
        <div className="space-y-4">
          <Input label="Current master password" type="password" />
          <Input label="New master password" type="password" />
          <Input label="Confirm new master password" type="password" />
          <Button variant="primary" className="w-full">Change Password</Button>
        </div>
      </Modal>
    </div>
  );
}
