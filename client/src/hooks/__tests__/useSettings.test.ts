import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSettings } from '../useSettings';
import { useSettingsStore } from '@/store/settings.store';

describe('useSettings', () => {
  beforeEach(() => {
    useSettingsStore.setState({ loaded: false });
    document.documentElement.classList.remove('dark', 'light');
  });

  it('loads settings when not loaded yet', () => {
    const loadSettings = vi.spyOn(useSettingsStore.getState(), 'loadSettings');
    renderHook(() => useSettings());
    expect(loadSettings).toHaveBeenCalled();
  });

  it('does not load settings if already loaded', () => {
    useSettingsStore.setState({ loaded: true });
    const loadSettings = vi.spyOn(useSettingsStore.getState(), 'loadSettings');
    renderHook(() => useSettings());
    expect(loadSettings).not.toHaveBeenCalled();
  });

  it('applies dark theme class', () => {
    useSettingsStore.setState({
      loaded: true,
      settings: {
        ...useSettingsStore.getState().settings,
        ui: { ...useSettingsStore.getState().settings.ui, theme: 'dark' },
      },
    });
    renderHook(() => useSettings());
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('applies light theme class', () => {
    useSettingsStore.setState({
      loaded: true,
      settings: {
        ...useSettingsStore.getState().settings,
        ui: { ...useSettingsStore.getState().settings.ui, theme: 'light' },
      },
    });
    renderHook(() => useSettings());
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('applies accent color CSS variable', () => {
    useSettingsStore.setState({
      loaded: true,
      settings: {
        ...useSettingsStore.getState().settings,
        ui: { ...useSettingsStore.getState().settings.ui, accentColor: 'purple' },
      },
    });
    renderHook(() => useSettings());
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--accent')).toBe('#bc8cff');
  });
});
