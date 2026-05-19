import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StrengthMeter } from '../StrengthMeter';

describe('StrengthMeter', () => {
  it('renders 4 segments', () => {
    const { container } = render(<StrengthMeter score={0} />);
    const segments = container.querySelectorAll('.flex-1');
    expect(segments).toHaveLength(4);
  });

  it('shows no label for score 0', () => {
    render(<StrengthMeter score={0} />);
    expect(screen.queryByText(/very weak|weak|fair|strong/i)).not.toBeInTheDocument();
  });

  it('shows "Weak" for score 1', () => {
    render(<StrengthMeter score={1} />);
    expect(screen.getByText('Weak')).toBeInTheDocument();
  });

  it('shows "Fair" for score 2', () => {
    render(<StrengthMeter score={2} />);
    expect(screen.getByText('Fair')).toBeInTheDocument();
  });

  it('shows "Strong" for score 3', () => {
    render(<StrengthMeter score={3} />);
    expect(screen.getByText('Strong')).toBeInTheDocument();
  });

  it('falls back to "Very Weak" for out-of-range score 4', () => {
    render(<StrengthMeter score={4} />);
    expect(screen.getByText('Very Weak')).toBeInTheDocument();
  });

  it('falls back to "Very Weak" for out-of-range score 5', () => {
    render(<StrengthMeter score={5} />);
    expect(screen.getByText('Very Weak')).toBeInTheDocument();
  });
});
