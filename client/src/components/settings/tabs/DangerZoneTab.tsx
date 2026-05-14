import { useState, useCallback } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Key } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

// Dangerous actions: recovery key export, settings reset, account deletion
export function DangerZoneTab() {
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [deleteText, setDeleteText] = useState('');

  // Starts a 3-second countdown before a destructive action can proceed
  const startCountdown = useCallback((action: string) => {
    setConfirmAction(action);
    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleExportRecovery = () => {
    startCountdown('recovery');
  };

  const handleResetSettings = () => {
    startCountdown('reset');
  };

  const handleDeleteAccount = () => {
    startCountdown('delete');
  };

  return (
    <div className="max-w-lg space-y-5">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-accent-red" />
        <h2 className="text-heading font-semibold text-text-primary">Danger Zone</h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-surface border border-border rounded-lg">
          <div>
            <p className="text-body font-medium text-text-primary">Export recovery key</p>
            <p className="text-caption text-text-muted">View your 24-word recovery phrase</p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleExportRecovery}>
            <Key className="w-4 h-4" />
            Export
          </Button>
        </div>

        <div className="flex items-center justify-between p-3 bg-surface border border-border rounded-lg">
          <div>
            <p className="text-body font-medium text-text-primary">Reset all settings</p>
            <p className="text-caption text-text-muted">Restore all settings to factory defaults</p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleResetSettings}>
            <RefreshCw className="w-4 h-4" />
            Reset
          </Button>
        </div>

        <div className="flex items-center justify-between p-3 bg-surface border border-accent-red/20 rounded-lg">
          <div>
            <p className="text-body font-medium text-text-primary">Delete account</p>
            <p className="text-caption text-text-muted">Permanently delete your vault and all data</p>
          </div>
          <Button variant="danger" size="sm" onClick={handleDeleteAccount}>
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      <Modal
        open={confirmAction === 'delete'}
        onClose={() => { setConfirmAction(null); setDeleteText(''); }}
        title="Delete Account"
        size="sm"
        closeOnBackdrop={false}
      >
        <div className="space-y-4">
          <p className="text-body text-text-muted">Type <span className="font-mono text-accent-red">DELETE MY ACCOUNT</span> to confirm.</p>
          <Input
            value={deleteText}
            onChange={(e) => setDeleteText(e.target.value)}
            placeholder="DELETE MY ACCOUNT"
          />
          <Button
            variant="danger"
            className="w-full"
            disabled={deleteText !== 'DELETE MY ACCOUNT' || countdown > 0}
          >
            {countdown > 0 ? `Wait ${countdown}s...` : 'Permanently Delete Account'}
          </Button>
        </div>
      </Modal>

      <Modal
        open={confirmAction === 'reset'}
        onClose={() => setConfirmAction(null)}
        title="Reset Settings"
        size="sm"
        closeOnBackdrop={false}
      >
        <div className="space-y-4">
          <p className="text-body text-text-muted">This will restore all settings to factory defaults. Your vault data will not be affected.</p>
          <Button variant="danger" className="w-full" disabled={countdown > 0}>
            {countdown > 0 ? `Wait ${countdown}s...` : 'Reset All Settings'}
          </Button>
        </div>
      </Modal>

      <Modal
        open={confirmAction === 'recovery'}
        onClose={() => setConfirmAction(null)}
        title="Recovery Key"
        size="sm"
        closeOnBackdrop={false}
      >
        <div className="space-y-4">
          <p className="text-body text-text-muted">Your recovery key is displayed during setup. This action is a placeholder for re-displaying it.</p>
          <Button variant="secondary" className="w-full" disabled={countdown > 0}>
            {countdown > 0 ? `Wait ${countdown}s...` : 'Show Recovery Key'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
