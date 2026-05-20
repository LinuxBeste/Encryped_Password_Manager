import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Plus, QrCode, Trash2, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { TOTPDisplay } from '@/components/entries/TOTPDisplay';
import { useVaultStore } from '@/store/vault.store';
import { EmptyState } from '@/components/ui/EmptyState';
import { getApi, getTotpStatus, setupTotp, verifyTotp, disableTotp } from '@/services/api.service';

export function TOTPTab() {
  const entries = useVaultStore((s) => s.entries);
  const totpEntries = entries.filter((e) => e.totpSecret);

  const [totpEnabled, setTotpEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showSetup, setShowSetup] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [step, setStep] = useState<'secret' | 'verify'>('secret');
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [otpauth, setOtpauth] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const api = getApi();
      const res = await getTotpStatus(api);
      if (res.success && res.data) {
        setTotpEnabled(res.data.enabled);
      }
    } catch {
      setError('Could not connect to server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleSetup = async () => {
    setSetupLoading(true);
    setError('');
    try {
      const api = getApi();
      const res = await setupTotp(api);
      if (res.success && res.data) {
        setSecret(res.data.secret);
        setQrCode(res.data.qrCode);
        setOtpauth(res.data.otpauth);
        setStep('verify');
      } else {
        setError(res.error || 'Failed to set up TOTP');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to set up TOTP');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleVerify = async () => {
    setVerifyLoading(true);
    setError('');
    try {
      const api = getApi();
      const res = await verifyTotp(api, code);
      if (res.success && res.data?.verified) {
        setTotpEnabled(true);
        setShowSetup(false);
        setStep('secret');
        setCode('');
        setSecret('');
        setQrCode('');
        setOtpauth('');
      } else {
        setError(res.error || 'Invalid code');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleDisable = async () => {
    try {
      const api = getApi();
      await disableTotp(api);
      setTotpEnabled(false);
    } catch {
      // silently fail
    }
  };

  const openSetup = () => {
    setShowSetup(true);
    setStep('secret');
    setCode('');
    setError('');
    setSecret('');
    setQrCode('');
    setOtpauth('');
    handleSetup();
  };

  return (
    <div className="max-w-lg space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-heading font-semibold text-text-primary">TOTP / Two-Factor</h2>
        {!loading && (
          totpEnabled ? (
            <Button variant="danger" size="sm" onClick={handleDisable}>
              <Trash2 className="w-4 h-4" />
              Remove TOTP
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={openSetup}>
              <Plus className="w-4 h-4" />
              Add TOTP
            </Button>
          )
        )}
      </div>

      {!loading && totpEnabled && (
        <div className="bg-surface border border-border rounded-lg p-4 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-accent-green shrink-0" />
          <p className="text-body text-text-primary">TOTP two-factor authentication is enabled.</p>
        </div>
      )}

      <Modal open={showSetup} onClose={() => setShowSetup(false)} title="Set up TOTP" size="sm">
        <div className="space-y-4">
          {setupLoading && step === 'secret' ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
            </div>
          ) : step === 'verify' && qrCode ? (
            <>
              <p className="text-body text-text-muted">
                Scan this QR code with your authenticator app, then enter the 6-digit code below.
              </p>
              <div className="flex justify-center">
                <img src={qrCode} alt="TOTP QR code" className="w-40 h-40" />
              </div>
              <div className="text-center">
                <p className="text-caption text-text-muted">Or enter this key manually:</p>
                <p className="text-body font-mono font-medium text-text-primary mt-1 select-all">{secret}</p>
              </div>
              <Input
                label="Verification code"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                error={error}
              />
              <Button
                variant="primary"
                className="w-full"
                onClick={handleVerify}
                loading={verifyLoading}
                disabled={code.length !== 6}
              >
                <Check className="w-4 h-4" />
                Verify & Enable
              </Button>
            </>
          ) : error && !qrCode ? (
            <div className="text-center py-4">
              <p className="text-body text-accent-red">{error}</p>
              <Button variant="secondary" className="mt-4" onClick={handleSetup}>
                Retry
              </Button>
            </div>
          ) : null}
        </div>
      </Modal>

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
