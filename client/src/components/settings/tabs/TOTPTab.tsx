import { useState } from 'react';
import { ShieldCheck, Plus, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TOTPDisplay } from '@/components/entries/TOTPDisplay';
import { useVaultStore } from '@/store/vault.store';
import { EmptyState } from '@/components/ui/EmptyState';

export function TOTPTab() {
  const entries = useVaultStore((s) => s.entries);
  const totpEntries = entries.filter((e) => e.totpSecret);

  return (
    <div className="max-w-lg space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-heading font-semibold text-text-primary">TOTP / Two-Factor</h2>
        <Button variant="primary" size="sm">
          <Plus className="w-4 h-4" />
          Add TOTP
        </Button>
      </div>

      {totpEntries.length === 0 ? (
        <EmptyState
          icon={QrCode}
          title="No TOTP entries"
          subtitle="Add two-factor authentication to any password entry by scanning a QR code or entering a secret key."
        />
      ) : (
        <div className="space-y-4">
          {totpEntries.map((entry) => (
            <div key={entry.id} className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-body font-medium text-text-primary">{entry.title}</p>
                  <p className="text-caption text-text-muted">{entry.username}</p>
                </div>
                <ShieldCheck className="w-5 h-5 text-accent-green" />
              </div>
              {entry.totpSecret && <TOTPDisplay secret={entry.totpSecret} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
