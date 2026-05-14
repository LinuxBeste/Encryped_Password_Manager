import { useSettingsStore } from '@/store/settings.store';
import { Slider } from '@/components/ui/Slider';
import { Toggle } from '@/components/ui/Toggle';
import { Select } from '@/components/ui/Select';

// Password generator settings: length, character sets, and passphrase options
export function GeneratorTab() {
  const { settings, updateGenerator } = useSettingsStore();

  return (
    <div className="max-w-lg space-y-5">
      <h2 className="text-heading font-semibold text-text-primary">Password Generator</h2>

      <Slider label="Default length" value={settings.generator.defaultLength} onChange={(v) => updateGenerator({ defaultLength: v })} min={8} max={128} />

      <div className="space-y-2">
        <Toggle checked={settings.generator.useUppercase} onChange={(v) => updateGenerator({ useUppercase: v })} label="Uppercase (A–Z)" />
        <Toggle checked={settings.generator.useLowercase} onChange={(v) => updateGenerator({ useLowercase: v })} label="Lowercase (a–z)" />
        <Toggle checked={settings.generator.useNumbers} onChange={(v) => updateGenerator({ useNumbers: v })} label="Numbers (0–9)" />
        <Toggle checked={settings.generator.useSymbols} onChange={(v) => updateGenerator({ useSymbols: v })} label="Symbols (!@#$%...)" />
        <Toggle checked={settings.generator.excludeAmbiguous} onChange={(v) => updateGenerator({ excludeAmbiguous: v })} label="Exclude ambiguous characters" />
      </div>

      <div className="border-t border-border pt-3">
        <Toggle checked={settings.generator.useWords} onChange={(v) => updateGenerator({ useWords: v })} label="Word-based passphrases" />

        {settings.generator.useWords && (
          <div className="mt-3 space-y-3 pl-4 border-l-2 border-border">
            <Slider label="Word count" value={settings.generator.wordCount} onChange={(v) => updateGenerator({ wordCount: v })} min={2} max={8} />

            <Select
              label="Separator"
              value={settings.generator.wordSeparator}
              onChange={(e) => updateGenerator({ wordSeparator: e.target.value })}
              options={[
                { value: '-', label: 'Hyphen (-)' },
                { value: '_', label: 'Underscore (_)' },
                { value: ' ', label: 'Space' },
                { value: '.', label: 'Period (.)' },
              ]}
            />

            <Toggle checked={settings.generator.capitalizeWords} onChange={(v) => updateGenerator({ capitalizeWords: v })} label="Capitalize words" />
            <Toggle checked={settings.generator.includeNumber} onChange={(v) => updateGenerator({ includeNumber: v })} label="Include number" />
          </div>
        )}
      </div>
    </div>
  );
}
