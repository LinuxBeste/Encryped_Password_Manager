import { ReactNode } from 'react';

// Colored badge/tag for status indicators
interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const variants = {
  default: 'bg-surface text-text-muted border-border',
  success: 'bg-accent-green/10 text-accent-green border-accent-green/20',
  warning: 'bg-accent-amber/10 text-accent-amber border-accent-amber/20',
  danger: 'bg-accent-red/10 text-accent-red border-accent-red/20',
  info: 'bg-accent/10 text-accent border-accent/20',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-caption font-medium border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
