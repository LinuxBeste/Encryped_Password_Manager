import { LucideIcon } from 'lucide-react';
import { Button } from './Button';
import { ReactNode } from 'react';

// Empty state placeholder with icon, text, and optional action button
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void };
  children?: ReactNode;
}

export function EmptyState({ icon: Icon, title, subtitle, action, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <Icon className="w-12 h-12 text-text-faint mb-4" />
      <h2 className="text-heading font-semibold text-text-primary mb-1">{title}</h2>
      {subtitle && <p className="text-body text-text-muted max-w-sm">{subtitle}</p>}
      {action && (
        <Button variant="primary" size="md" className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
      {children}
    </div>
  );
}
