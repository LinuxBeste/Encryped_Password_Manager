import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from '../ProgressBar';

describe('ProgressBar', () => {
  it('renders with given value', () => {
    const { container } = render(<ProgressBar value={50} />);
    const fill = container.querySelector('.h-full');
    expect(fill).toBeInTheDocument();
    expect(fill).toHaveStyle({ width: '50%' });
  });

  it('clamps to 0% minimum', () => {
    const { container } = render(<ProgressBar value={-10} />);
    const fill = container.querySelector('.h-full');
    expect(fill).toHaveStyle({ width: '0%' });
  });

  it('clamps to 100% maximum', () => {
    const { container } = render(<ProgressBar value={150} />);
    const fill = container.querySelector('.h-full');
    expect(fill).toHaveStyle({ width: '100%' });
  });

  it('uses custom max value', () => {
    const { container } = render(<ProgressBar value={5} max={10} />);
    const fill = container.querySelector('.h-full');
    expect(fill).toHaveStyle({ width: '50%' });
  });

  it('applies custom className', () => {
    const { container } = render(<ProgressBar value={50} className="my-class" />);
    const outer = container.querySelector('.h-1\\.5');
    expect(outer).toHaveClass('my-class');
  });
});
