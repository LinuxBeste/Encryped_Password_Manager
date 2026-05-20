import { useState, useCallback, useMemo } from 'react';
import { Shield, Server, Mail, Key, Check, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { PasswordField } from '../ui/PasswordField';
import { testConnection, register } from '@/services/api.service';
import { scorePassword } from '@/utils/password';

interface SetupWizardProps {
  onComplete: (serverUrl: string, email: string, password: string) => void;
}

// Sample recovery seed words for initial setup
const RECOVERY_WORDS = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
  'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
  'acoustic', 'acquire', 'across', 'action', 'actor', 'actress', 'actual', 'adapt',
  'add', 'adjust', 'admit', 'adult', 'advance', 'advice', 'aerobic', 'affair',
];

const STEPS = ['Welcome', 'Server', 'Account', 'Recovery', 'Done'];

// Multi-step first-time setup wizard for vault configuration
export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(0);
  const [serverUrl, setServerUrl] = useState('http://localhost:3000/api');
  const [testing, setTesting] = useState(false);
  const [connectionOk, setConnectionOk] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmedRecovery, setConfirmedRecovery] = useState(false);

  const passwordScore = password ? scorePassword(password).score : 0;
  const recoveryPhrase = useMemo(() => {
    const words = [...RECOVERY_WORDS];
    const indices = new Uint32Array(words.length);
    crypto.getRandomValues(indices);
    for (let i = words.length - 1; i > 0; i--) {
      const j = indices[i] % (i + 1);
      [words[i], words[j]] = [words[j], words[i]];
    }
    return words.slice(0, 12).join(' ');
  }, []);

  // Test server connection and update status
  const handleTestConnection = useCallback(async () => {
    setTesting(true);
    const ok = await testConnection(serverUrl);
    setConnectionOk(ok);
    setTesting(false);
  }, [serverUrl]);

  // Determine if current step allows proceeding
  const canNext = () => {
    switch (step) {
      case 0: return true;
      case 1: return connectionOk === true && serverUrl.length > 0;
      case 2: return email.length > 0 && password.length >= 8 && password === confirmPassword;
      case 3: return confirmedRecovery;
      default: return true;
    }
  };

  // Advance or complete the wizard
  const handleNext = () => {
    if (step === STEPS.length - 1) {
      onComplete(serverUrl, email, password);
      return;
    }
    setStep((p) => Math.min(p + 1, STEPS.length - 1));
  };

  return (
    <div className="flex items-center justify-center h-full bg-app">
      <div className="w-full max-w-lg px-8">
        {/* Step indicator dots */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${i <= step ? 'bg-accent' : 'bg-surface'}`} />
            ))}
          </div>
        </div>

        <div className="bg-panel border border-border rounded-lg p-6">
          {/* Welcome step */}
          {step === 0 && (
            <div className="text-center space-y-4">
              <Shield className="w-12 h-12 text-accent mx-auto" />
              <h1 className="text-heading font-bold text-text-primary">Welcome to VaultLock</h1>
              <div className="space-y-2 text-left">
                {['Military-grade AES-256-GCM encryption', 'Zero-knowledge architecture', 'Cross-device sync'].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-body text-text-muted">
                    <Check className="w-4 h-4 text-accent-green shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Server connection step */}
          {step === 1 && (
            <div className="space-y-4">
              <Server className="w-10 h-10 text-accent" />
              <h2 className="text-heading font-semibold text-text-primary">Server Configuration</h2>
              <Input
                label="Server URL"
                value={serverUrl}
                onChange={(e) => { setServerUrl(e.target.value); setConnectionOk(null); }}
                placeholder="http://localhost:3000/api"
              />
              <Button variant="secondary" size="md" onClick={handleTestConnection} loading={testing}>
                Test Connection
              </Button>
              {connectionOk === true && <p className="text-body text-accent-green">Connection successful!</p>}
              {connectionOk === false && <p className="text-body text-accent-red">Connection failed</p>}
            </div>
          )}

          {/* Account creation step */}
          {step === 2 && (
            <div className="space-y-4">
              <Mail className="w-10 h-10 text-accent" />
              <h2 className="text-heading font-semibold text-text-primary">Create Account</h2>
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              <div>
                <label className="text-caption text-text-muted uppercase tracking-wide font-medium mb-1.5 block">Master Password</label>
                <PasswordField value={password} onChange={setPassword} showStrength strengthScore={passwordScore} />
              </div>
              <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : undefined}
              />
            </div>
          )}

          {/* Recovery phrase step */}
          {step === 3 && (
            <div className="space-y-4">
              <Key className="w-10 h-10 text-accent-amber" />
              <h2 className="text-heading font-semibold text-text-primary">Recovery Key</h2>
              <p className="text-body text-text-muted">Write down these words. They are your only recovery method if you lose your master password.</p>
              <div className="bg-surface border border-border rounded-md p-4 font-mono text-body text-text-primary leading-relaxed select-all">
                {recoveryPhrase}
              </div>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmedRecovery}
                  onChange={(e) => setConfirmedRecovery(e.target.checked)}
                  className="mt-0.5 accent-accent"
                />
                <span className="text-body text-text-muted">I have saved my recovery key in a secure location</span>
              </label>
            </div>
          )}

          {/* Completion step */}
          {step === 4 && (
            <div className="text-center space-y-4">
              <Check className="w-12 h-12 text-accent-green mx-auto" />
              <h2 className="text-heading font-semibold text-text-primary">You're all set!</h2>
              <p className="text-body text-text-muted">Your vault is ready. Use Cmd+K to search, Cmd+N to add entries.</p>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="ghost"
            size="md"
            onClick={() => setStep((p) => Math.max(p - 1, 0))}
            disabled={step === 0}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button variant="primary" size="md" onClick={handleNext} disabled={!canNext()}>
            {step === STEPS.length - 1 ? 'Finish' : 'Next'}
            {step < STEPS.length - 1 && <ArrowRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
