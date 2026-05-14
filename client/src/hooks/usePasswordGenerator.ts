import { useState, useCallback } from 'react';
import { generatePassword, generatePassphrase } from '@/utils/password';
import type { GeneratedPassword } from '@/types';

interface GeneratorOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
  useWords: boolean;
  wordCount: number;
  wordSeparator: string;
  capitalizeWords: boolean;
  includeNumber: boolean;
}

// Hook for generating passwords/passphrases with configurable options and history
export function usePasswordGenerator(defaultOptions?: Partial<GeneratorOptions>) {
  const [options, setOptions] = useState<GeneratorOptions>({
    length: 20,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: true,
    useWords: false,
    wordCount: 4,
    wordSeparator: '-',
    capitalizeWords: true,
    includeNumber: true,
    ...defaultOptions,
  });

  const [current, setCurrent] = useState<GeneratedPassword | null>(null);
  const [history, setHistory] = useState<GeneratedPassword[]>([]);

  // Generate a password or passphrase based on current options
  const generate = useCallback(() => {
    let result: GeneratedPassword;
    if (options.useWords) {
      result = generatePassphrase({
        wordCount: options.wordCount,
        separator: options.wordSeparator,
        capitalize: options.capitalizeWords,
        includeNumber: options.includeNumber,
      });
    } else {
      result = generatePassword(options.length, {
        uppercase: options.uppercase,
        lowercase: options.lowercase,
        numbers: options.numbers,
        symbols: options.symbols,
        excludeAmbiguous: options.excludeAmbiguous,
      });
    }
    setCurrent(result);
    setHistory((prev) => [result, ...prev].slice(0, 10));
    return result;
  }, [options]);

  // Update a single generator option
  const updateOption = useCallback(<K extends keyof GeneratorOptions>(
    key: K,
    value: GeneratorOptions[K]
  ) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  }, []);

  return { options, current, history, generate, updateOption, setOptions };
}
