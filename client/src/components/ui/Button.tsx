import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

// Reusable button component props
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

// Visual styles per variant
const variantStyles: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:brightness-110',
  secondary: 'bg-surface border border-border text-text-primary hover:bg-hover',
  ghost: 'text-text-muted hover:text-text-primary hover:bg-hover',
  danger: 'bg-accent-red text-white hover:brightness-110',
};

// Height and padding per size
const sizeStyles: Record<Size, string> = {
  sm: 'h-8 px-3 text-caption',
  md: 'h-9 px-4 text-ui',
  lg: 'h-10 px-6 text-ui font-medium',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, children, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center gap-2 rounded-md
          transition-all duration-150
          focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-app
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantStyles[variant]} ${sizeStyles[size]} ${className}
        `}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
