import { InputHTMLAttributes, forwardRef } from 'react';

// Reusable text input with label, hint, and error state
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-caption text-text-muted font-medium uppercase tracking-wide">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            h-9 px-3 rounded-md border bg-panel text-text-primary text-body
            transition-all duration-150
            placeholder:text-text-faint
            focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-accent-red ring-1 ring-accent-red' : 'border-border'}
            ${className}
          `}
          {...props}
        />
        {error && <span className="text-caption text-accent-red">{error}</span>}
        {hint && !error && <span className="text-caption text-text-faint">{hint}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
