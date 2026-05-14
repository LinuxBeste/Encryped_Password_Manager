import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: number;
  className?: string;
}

export function Spinner({ size = 16, className = '' }: SpinnerProps) {
  return <Loader2 className={`animate-spin text-accent ${className}`} style={{ width: size, height: size }} />;
}
