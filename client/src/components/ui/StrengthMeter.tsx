// Segmented password strength indicator with labels per level
interface StrengthMeterProps {
  score: number;
}

const segments = [
  { label: 'Very Weak', color: 'var(--accent-red)', upTo: 1 },
  { label: 'Weak', color: 'var(--accent-amber)', upTo: 2 },
  { label: 'Fair', color: '#e3b341', upTo: 3 },
  { label: 'Strong', color: 'var(--accent-green)', upTo: 4 },
];

export function StrengthMeter({ score }: StrengthMeterProps) {
  const current = segments[score] || segments[0];

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1 h-1.5">
        {segments.map((seg, i) => (
          <div
            key={i}
            className="flex-1 rounded-full transition-all duration-300"
            style={{
              backgroundColor: i < score ? seg.color : 'var(--bg-surface)',
            }}
          />
        ))}
      </div>
      {score > 0 && (
        <span className="text-caption" style={{ color: current.color }}>
          {current.label}
        </span>
      )}
    </div>
  );
}
