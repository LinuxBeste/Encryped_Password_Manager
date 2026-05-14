import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settings.store';

// Hook to load settings on mount and apply theme/accent to document root
export function useSettings() {
  const store = useSettingsStore();

  // Load persisted settings if not yet loaded
  useEffect(() => {
    if (!store.loaded) {
      store.loadSettings();
    }
  }, [store.loaded, store.loadSettings]);

  // Apply theme class (dark/light) to document element
  useEffect(() => {
    if (store.loaded) {
      const { theme } = store.settings.ui;
      if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    }
  }, [store.loaded, store.settings.ui.theme]);

  // Apply accent color CSS custom property
  useEffect(() => {
    if (store.loaded) {
      const root = document.documentElement;
      const colors: Record<string, string> = {
        blue: '#388bfd',
        purple: '#bc8cff',
        green: '#3fb950',
        teal: '#56d4dd',
        amber: '#d29922',
        red: '#f85149',
      };
      root.style.setProperty('--accent', colors[store.settings.ui.accentColor] || colors.blue);
      root.style.setProperty('--accent-hover', colors[store.settings.ui.accentColor] || '#1f6feb');
    }
  }, [store.loaded, store.settings.ui.accentColor]);

  return store;
}
