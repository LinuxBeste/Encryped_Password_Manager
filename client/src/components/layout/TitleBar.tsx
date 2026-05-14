interface TitleBarProps {
  title?: string;
}

export function TitleBar({ title = 'VaultLock' }: TitleBarProps) {
  const isMac = navigator.userAgent.includes('Mac');

  if (!isMac) return null;

  return (
    <div className="h-10 flex items-center px-4 bg-app select-none shrink-0" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
      <span className="text-caption text-text-muted font-medium ml-8">{title}</span>
    </div>
  );
}
