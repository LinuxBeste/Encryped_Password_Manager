import { useEffect, useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { generateTOTP, formatTOTPCode } from '@/utils/otp';

interface TOTPDisplayProps {
  secret: string;
  period?: number;
}

export function TOTPDisplay({ secret, period = 30 }: TOTPDisplayProps) {
  const [code, setCode] = useState('');
  const [remaining, setRemaining] = useState(period);
  const [copied, setCopied] = useState(false);

  const updateCode = useCallback(async () => {
    try {
      const result = await generateTOTP(secret, period);
      setCode(result.code);
      setRemaining(result.remaining);
    } catch {
      setCode('••••••');
      setRemaining(0);
    }
  }, [secret, period]);

  useEffect(() => {
    updateCode();
    const timer = setInterval(updateCode, 1000);
    return () => clearInterval(timer);
  }, [updateCode]);

  const handleCopy = async () => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.clipboard.write(code);
      } else {
        await navigator.clipboard.writeText(code);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - remaining / period);

  const ringColor = remaining > 10 ? 'var(--accent-green)' : remaining > 5 ? 'var(--accent-amber)' : 'var(--accent-red)';

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={radius} fill="none" stroke="var(--bg-surface)" strokeWidth="4" />
          <circle
            cx="40" cy="40" r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-heading font-mono font-semibold text-text-primary">{formatTOTPCode(code)}</span>
        </div>
      </div>
      <button
        onClick={handleCopy}
        className="p-2 rounded-md text-text-muted hover:text-text-primary hover:bg-hover transition-colors duration-150"
      >
        {copied ? <Check className="w-5 h-5 text-accent-green" /> : <Copy className="w-5 h-5" />}
      </button>
    </div>
  );
}
