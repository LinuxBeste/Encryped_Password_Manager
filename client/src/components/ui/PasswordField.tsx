import { useState } from 'react';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
import { StrengthMeter } from './StrengthMeter';

interface PasswordFieldProps {
  value: string;
  onChange?: (value: string) => void;
  readonly?: boolean;
  showStrength?: boolean;
  strengthScore?: number;
  onCopy?: () => void;
}

export function PasswordField({ value, onChange, readonly, showStrength, strengthScore = 0, onCopy }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1">
        <div className="relative flex-1">
          <input
            type={visible ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            readOnly={readonly}
            className="h-9 w-full px-3 pr-20 rounded-md border border-border bg-panel text-text-primary font-mono text-body focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            <button
              onClick={() => setVisible(!visible)}
              className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-hover transition-colors duration-150"
              tabIndex={-1}
            >
              {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-hover transition-colors duration-150"
              tabIndex={-1}
            >
              {copied ? <Check className="w-4 h-4 text-accent-green" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
      {showStrength && <StrengthMeter score={strengthScore} />}
    </div>
  );
}
