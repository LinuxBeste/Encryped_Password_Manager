import { useState, useCallback } from 'react';
import { Shield, Unlock, Fingerprint, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface UnlockScreenProps {
  onUnlock: (password: string) => Promise<boolean>;
  onSetup: () => void;
  biometricAvailable?: boolean;
  failedAttempts?: number;
  maxAttempts?: number;
}

// Full-screen vault unlock with password, biometrics, and lockout handling
export function UnlockScreen({ onUnlock, onSetup, biometricAvailable, failedAttempts = 0, maxAttempts = 5 }: UnlockScreenProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lockedOut = failedAttempts >= maxAttempts;

  // Attempt to unlock vault with entered password
  const handleUnlock = useCallback(async () => {
    if (!password || lockedOut) return;
    setLoading(true);
    setError(null);
    try {
      const ok = await onUnlock(password);
      if (!ok) {
        setError('Incorrect master password');
      }
    } catch {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  }, [password, lockedOut, onUnlock]);

  // Trigger unlock on Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleUnlock();
  };

  return (
    <div className="flex items-center justify-center h-full bg-app relative overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-radial from-accent/5 to-transparent animate-pulse-glow" />

      <div className="relative z-10 w-full max-w-sm px-6">
        {/* App branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-display font-bold text-text-primary">VaultLock</h1>
          <p className="text-body text-text-muted mt-1">Enter your master password to unlock</p>
        </div>

        <div className="space-y-4">
          {/* Lockout warning */}
          {lockedOut && (
            <div className="flex items-start gap-2.5 p-3 rounded-md bg-accent-red/10 border border-accent-red/20">
              <AlertCircle className="w-4 h-4 text-accent-red shrink-0 mt-0.5" />
              <p className="text-body text-accent-red">Too many failed attempts. Please wait before trying again.</p>
            </div>
          )}

          {/* Password input */}
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Master password"
            error={error || undefined}
            autoFocus
            disabled={lockedOut}
          />

          {/* Unlock button */}
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleUnlock}
            loading={loading}
            disabled={!password || lockedOut}
          >
            <Unlock className="w-4 h-4" />
            Unlock
          </Button>

          {/* Biometric unlock option */}
          {biometricAvailable && (
            <Button variant="secondary" size="lg" className="w-full">
              <Fingerprint className="w-4 h-4" />
              Use Biometrics
            </Button>
          )}

          {/* Failed attempts counter */}
          {failedAttempts > 0 && !lockedOut && (
            <p className="text-center text-caption text-accent-amber">
              {failedAttempts} of {maxAttempts} failed attempts
            </p>
          )}

          {/* First-time setup link */}
          <div className="text-center pt-4">
            <p className="text-caption text-text-muted">First time using VaultLock?</p>
            <button
              onClick={onSetup}
              className="text-body text-accent hover:text-accent-hover transition-colors duration-150 mt-1"
            >
              Set up your vault
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
