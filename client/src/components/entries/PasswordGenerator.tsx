import { RefreshCw, Copy, Check, CheckCircle } from 'lucide-react';
import { usePasswordGenerator } from '@/hooks/usePasswordGenerator';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Slider } from '../ui/Slider';
import { Toggle } from '../ui/Toggle';
import { StrengthMeter } from '../ui/StrengthMeter';
import { useState } from 'react';

interface PasswordGeneratorProps {
  onSelect: (password: string) => void;
  onClose: () => void;
}

export function PasswordGenerator({ onSelect, onClose }: PasswordGeneratorProps) {
  const { options, current, history, generate, updateOption } = usePasswordGenerator();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!current) return;
    try {
      if (window.electronAPI) {
        await window.electronAPI.clipboard.write(current.password);
      } else {
        await navigator.clipboard.writeText(current.password);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <Modal open title="Password Generator" onClose={onClose} size="md">
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="h-10 px-3 rounded-md border border-border bg-surface text-text-primary font-mono text-heading flex items-center truncate">
              {current?.password || 'Generate a password'}
            </div>
          </div>
          <Button variant="secondary" size="md" onClick={generate}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="secondary" size="md" onClick={handleCopy} disabled={!current}>
            {copied ? <Check className="w-4 h-4 text-accent-green" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>

        {current && (
          <StrengthMeter score={current.score.score} />
        )}

        <div className="space-y-3">
          <Slider
            label="Length"
            value={options.length}
            onChange={(v) => updateOption('length', v)}
            min={8}
            max={128}
          />

          <div className="space-y-2">
            <Toggle checked={options.useUppercase} onChange={(v) => updateOption('uppercase', v)} label="Uppercase (A–Z)" />
            <Toggle checked={options.useLowercase} onChange={(v) => updateOption('lowercase', v)} label="Lowercase (a–z)" />
            <Toggle checked={options.useNumbers} onChange={(v) => updateOption('numbers', v)} label="Numbers (0–9)" />
            <Toggle checked={options.useSymbols} onChange={(v) => updateOption('symbols', v)} label="Symbols (!@#$%...)" />
            <Toggle checked={options.excludeAmbiguous} onChange={(v) => updateOption('excludeAmbiguous', v)} label="Exclude ambiguous (0O1lI5S2Z)" />
          </div>

          <div className="border-t border-border pt-3">
            <Toggle checked={options.useWords} onChange={(v) => updateOption('useWords', v)} label="Word-based passphrase" />
            {options.useWords && (
              <div className="mt-3 space-y-3 pl-4 border-l-2 border-border">
                <Slider label="Word count" value={options.wordCount} onChange={(v) => updateOption('wordCount', v)} min={2} max={8} />
                <Toggle checked={options.capitalizeWords} onChange={(v) => updateOption('capitalizeWords', v)} label="Capitalize words" />
                <Toggle checked={options.includeNumber} onChange={(v) => updateOption('includeNumber', v)} label="Include number" />
              </div>
            )}
          </div>
        </div>

        {history.length > 0 && (
          <div className="border-t border-border pt-3">
            <label className="text-caption text-text-muted uppercase tracking-wide font-medium mb-2 block">History (last 10)</label>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => onSelect(h.password)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-caption font-mono text-text-muted hover:bg-hover hover:text-text-primary transition-colors duration-150"
                >
                  <span className="flex-1 truncate">{h.password}</span>
                  <CheckCircle className="w-3 h-3 shrink-0 text-accent-green" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="ghost" size="md" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" onClick={() => current && onSelect(current.password)} disabled={!current}>
            Use This Password
          </Button>
        </div>
      </div>
    </Modal>
  );
}
