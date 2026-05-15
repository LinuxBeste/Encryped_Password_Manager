import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePasswordGenerator } from '../usePasswordGenerator';

describe('usePasswordGenerator', () => {
  it('starts with default options', () => {
    const { result } = renderHook(() => usePasswordGenerator());
    expect(result.current.options.length).toBe(20);
    expect(result.current.options.uppercase).toBe(true);
    expect(result.current.options.lowercase).toBe(true);
    expect(result.current.options.numbers).toBe(true);
    expect(result.current.options.symbols).toBe(true);
    expect(result.current.current).toBeNull();
    expect(result.current.history).toEqual([]);
  });

  it('merges custom default options', () => {
    const { result } = renderHook(() => usePasswordGenerator({ length: 32, useWords: true }));
    expect(result.current.options.length).toBe(32);
    expect(result.current.options.useWords).toBe(true);
  });

  it('generates a password', () => {
    const { result } = renderHook(() => usePasswordGenerator());
    let generated;
    act(() => {
      generated = result.current.generate();
    });
    expect(generated).toBeDefined();
    expect(generated!.password).toBeDefined();
    expect(generated!.score).toBeDefined();
    expect(result.current.current).toEqual(generated);
    expect(result.current.history).toHaveLength(1);
  });

  it('generates a passphrase when useWords is true', () => {
    const { result } = renderHook(() => usePasswordGenerator({ useWords: true }));
    let generated;
    act(() => {
      generated = result.current.generate();
    });
    expect(generated!.password.split('-').length).toBeGreaterThanOrEqual(4);
  });

  it('maintains a history of up to 10 passwords', () => {
    const { result } = renderHook(() => usePasswordGenerator());
    for (let i = 0; i < 15; i++) {
      act(() => {
        result.current.generate();
      });
    }
    expect(result.current.history.length).toBeLessThanOrEqual(10);
  });

  it('updates individual options', () => {
    const { result } = renderHook(() => usePasswordGenerator());
    act(() => {
      result.current.updateOption('length', 40);
    });
    expect(result.current.options.length).toBe(40);

    act(() => {
      result.current.updateOption('symbols', false);
    });
    expect(result.current.options.symbols).toBe(false);
  });

  it('replaces all options with setOptions', () => {
    const { result } = renderHook(() => usePasswordGenerator());
    act(() => {
      result.current.setOptions({
        length: 8,
        uppercase: false,
        lowercase: true,
        numbers: true,
        symbols: false,
        excludeAmbiguous: false,
        useWords: false,
        wordCount: 3,
        wordSeparator: '_',
        capitalizeWords: false,
        includeNumber: false,
      });
    });
    expect(result.current.options.length).toBe(8);
    expect(result.current.options.uppercase).toBe(false);
  });
});
