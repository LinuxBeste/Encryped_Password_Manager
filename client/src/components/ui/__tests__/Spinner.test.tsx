import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Spinner } from '../Spinner';

describe('Spinner', () => {
  it('renders a spinner', () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('applies custom size', () => {
    const { container } = render(<Spinner size={32} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('style', expect.stringContaining('32'));
  });

  it('applies custom className', () => {
    const { container } = render(<Spinner className="my-class" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('my-class');
  });

  it('uses default size of 16', () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('style', expect.stringContaining('16'));
  });
});
