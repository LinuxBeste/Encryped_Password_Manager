import { useState } from 'react';
import { useSettingsStore } from '@/store/settings.store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { testConnection } from '@/services/api.service';
import { syncService } from '@/services/sync.service';
import { Badge } from '@/components/ui/Badge';

// Sync settings: server URL, test connection, interval, conflict resolution, status
export function SyncTab() {
  const { settings, updateSync } = useSettingsStore();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const syncStatus = syncService.getStatus();

  // Tests connection to the configured sync server
  const handleTest = async () => {
    setTesting(true);
    setTestResult(await testConnection(settings.sync.serverUrl));
    setTesting(false);
  };

  return (
    <div className="max-w-lg space-y-5">
      <h2 className="text-heading font-semibold text-text-primary">Sync Settings</h2>

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            label="Server URL"
            value={settings.sync.serverUrl}
            onChange={(e) => { updateSync({ serverUrl: e.target.value }); setTestResult(null); }}
            placeholder="http://localhost:3000/api"
          />
        </div>
        <Button variant="secondary" size="md" onClick={handleTest} loading={testing}>
          Test
        </Button>
      </div>
      {testResult === true && <p className="text-body text-accent-green">Connection successful</p>}
      {testResult === false && <p className="text-body text-accent-red">Connection failed</p>}

      <Select
        label="Sync interval"
        value={String(settings.sync.syncInterval)}
        onChange={(e) => updateSync({ syncInterval: Number(e.target.value) })}
        options={[
          { value: '0', label: 'Manual only' },
          { value: '300000', label: 'Every 5 minutes' },
          { value: '900000', label: 'Every 15 minutes' },
          { value: '1800000', label: 'Every 30 minutes' },
          { value: '3600000', label: 'Every hour' },
        ]}
      />

      <Select
        label="Conflict resolution"
        value={settings.sync.conflictResolution}
        onChange={(e) => updateSync({ conflictResolution: e.target.value as any })}
        options={[
          { value: 'server-wins', label: 'Server wins' },
          { value: 'client-wins', label: 'Client wins' },
          { value: 'ask', label: 'Ask me' },
        ]}
      />

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-caption text-text-muted uppercase tracking-wide font-medium">Last sync</span>
          <Button variant="secondary" size="sm" onClick={() => syncService.syncVault('')}>
            Sync Now
          </Button>
        </div>
        <p className="text-body text-text-muted">
          {syncStatus.lastSync ? new Date(syncStatus.lastSync).toLocaleString() : 'Never'}
        </p>
        <Badge variant={syncStatus.status === 'error' ? 'danger' : syncStatus.status === 'syncing' ? 'warning' : 'success'}>
          {syncStatus.status}
        </Badge>
      </div>

      {syncStatus.events.length > 0 && (
        <div>
          <label className="text-caption text-text-muted uppercase tracking-wide font-medium mb-2 block">Sync Log</label>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {syncStatus.events.map((e, i) => (
              <div key={i} className="flex items-center gap-2 text-caption text-text-muted">
                <span className="text-text-faint">{new Date(e.timestamp).toLocaleTimeString()}</span>
                <span>{e.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
