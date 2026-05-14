import { useCallback, useEffect, useState } from 'react';

interface TitleBarProps {
  title?: string;
}

export function TitleBar({ title = 'VaultLock' }: TitleBarProps) {
  const [maximized, setMaximized] = useState(false);

  const isMac = navigator.userAgent.includes('Mac');

  const handleMinimize = useCallback(() => window.electronAPI.window.minimize(), []);
  const handleMaximize = useCallback(async () => {
    await window.electronAPI.window.maximize();
    setMaximized((prev) => !prev);
  }, []);
  const handleClose = useCallback(() => window.electronAPI.window.close(), []);

  useEffect(() => {
    const unsubscribe = window.electronAPI.vault.onFocus(() => {
      setMaximized(false);
    });
    return unsubscribe;
  }, []);

  if (isMac) {
    return (
      <div className="h-10 flex items-center px-4 bg-app select-none" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <span className="text-caption text-text-muted font-medium ml-8">{title}</span>
      </div>
    );
  }

  return (
    <div
      className="h-10 flex items-center justify-between bg-app select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <span className="text-caption text-text-muted font-medium px-4">{title}</span>
      <div className="flex" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={handleMinimize}
          className="w-11 h-10 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-hover transition-colors duration-150"
        >
          <svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="5.5" width="10" height="1" fill="currentColor" /></svg>
        </button>
        <button
          onClick={handleMaximize}
          className="w-11 h-10 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-hover transition-colors duration-150"
        >
          {maximized ? (
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect x="1" y="1" width="10" height="10" rx="1" fill="none" stroke="currentColor" strokeWidth="1" />
              <rect x="4" y="4" width="7" height="7" rx="1" fill="var(--bg-app)" stroke="currentColor" strokeWidth="1" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect x="1" y="1" width="10" height="10" rx="1" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>
          )}
        </button>
        <button
          onClick={handleClose}
          className="w-11 h-10 flex items-center justify-center text-text-muted hover:text-white hover:bg-accent-red transition-colors duration-150"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
