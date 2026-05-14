import { useState } from 'react';
import { useSettingsStore } from '@/store/settings.store';
import { useVaultStore } from '@/store/vault.store';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Slider } from '@/components/ui/Slider';
import { Modal } from '@/components/ui/Modal';
import { exportEncryptedBackup, convertToCsv } from '@/services/backup.service';

export function BackupTab() {
  const { settings, updateBackup } = useSettingsStore();
  const { vaultName: name, entries, folders } = useVaultStore();
  const [showCsvWarning, setShowCsvWarning] = useState(false);

  const handleExportEncrypted = async () => {
    const json = await exportEncryptedBackup(name, entries, folders);
    if (window.electronAPI) {
      await window.electronAPI.backup.export(json, `vaultlock-backup-${Date.now()}.json`);
    }
  };

  const handleExportCsv = async () => {
    const csv = convertToCsv(entries);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vaultlock-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowCsvWarning(false);
  };

  return (
    <div className="max-w-lg space-y-5">
      <h2 className="text-heading font-semibold text-text-primary">Backup & Export</h2>

      <div className="space-y-3">
        <label className="text-caption text-text-muted uppercase tracking-wide font-medium block">Export Encrypted Backup</label>
        <p className="text-body text-text-muted">Download your entire vault as an encrypted JSON file.</p>
        <Button variant="primary" size="md" onClick={handleExportEncrypted}>
          Export Encrypted Backup
        </Button>
      </div>

      <div className="border-t border-border pt-4 space-y-3">
        <label className="text-caption text-text-muted uppercase tracking-wide font-medium block">Export Plaintext CSV</label>
        <p className="text-body text-accent-red">Warning: CSV exports contain plaintext passwords!</p>
        <Button variant="danger" size="md" onClick={() => setShowCsvWarning(true)}>
          Export CSV
        </Button>
      </div>

      <div className="border-t border-border pt-4 space-y-3">
        <label className="text-caption text-text-muted uppercase tracking-wide font-medium block">Import</label>
        <div className="flex gap-2">
          <Button variant="secondary" size="md">
            Import VaultLock Backup
          </Button>
          <Button variant="secondary" size="md">
            Import CSV
          </Button>
        </div>
      </div>

      <div className="border-t border-border pt-4 space-y-3">
        <Select
          label="Automatic backup"
          value={settings.backup.autoBackup}
          onChange={(e) => updateBackup({ autoBackup: e.target.value as any })}
          options={[
            { value: 'never', label: 'Never' },
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
          ]}
        />

        <Slider label="Keep last N backups" value={settings.backup.keepLastN} onChange={(v) => updateBackup({ keepLastN: v })} min={3} max={30} />
      </div>

      <Modal open={showCsvWarning} onClose={() => setShowCsvWarning(false)} title="Export Plaintext CSV?" size="sm">
        <div className="space-y-4">
          <p className="text-body text-accent-red">CSV files contain passwords in plaintext. Anyone with access to this file can read all your passwords.</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="md" onClick={() => setShowCsvWarning(false)}>Cancel</Button>
            <Button variant="danger" size="md" onClick={handleExportCsv}>I Understand, Export</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
