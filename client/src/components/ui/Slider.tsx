import { useCallback } from 'react';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
}

export function Slider({ value, onChange, min, max, step = 1, label }: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value));
    },
    [onChange]
  );

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-caption text-text-muted font-medium uppercase tracking-wide">{label}</span>
          <span className="text-body text-text-primary font-mono">{value}</span>
        </div>
      )}
      <div className="relative h-2">
        <div className="absolute inset-0 rounded-full bg-surface" />
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-accent transition-all duration-150"
          style={{ width: `${percentage}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}
