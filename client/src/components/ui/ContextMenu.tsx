import { useEffect, useRef, useCallback, useState } from 'react';
import { LucideIcon } from 'lucide-react';

// Single item in the context menu
interface MenuItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  danger?: boolean;
  shortcut?: string;
  separator?: boolean;
  onClick: () => void;
}

interface ContextMenuProps {
  items: MenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
}

// Right-click context menu with repositioning, Escape dismiss, outside-click close
export function ContextMenu({ items, position, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState(position);

  // Repositions menu to stay within viewport bounds
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width - 8;
    const maxY = window.innerHeight - rect.height - 8;

    setAdjustedPos({
      x: Math.min(position.x, maxX),
      y: Math.min(position.y, maxY),
    });
  }, [position]);

  // Closes menu on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Closes menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[180px] bg-panel border border-border rounded-lg shadow-xl py-1 animate-fade-in"
      style={{ left: adjustedPos.x, top: adjustedPos.y }}
    >
      {items.map((item) => (
        item.separator ? (
          <div key={item.id} className="h-px bg-border my-1" />
        ) : (
          <button
            key={item.id}
            onClick={() => { item.onClick(); onClose(); }}
            className={`
              w-full flex items-center gap-2.5 h-8 px-3 text-body
              transition-colors duration-150
              hover:bg-hover
              ${item.danger ? 'text-accent-red' : 'text-text-primary'}
            `}
          >
            {item.icon && <item.icon className="w-4 h-4 shrink-0" />}
            <span className="flex-1 text-left">{item.label}</span>
            {item.shortcut && <span className="text-caption text-text-faint">{item.shortcut}</span>}
          </button>
        )
      ))}
    </div>
  );
}
