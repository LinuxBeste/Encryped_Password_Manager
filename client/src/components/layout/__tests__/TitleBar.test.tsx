import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TitleBar } from '../TitleBar';

describe('TitleBar', () => {
  it('renders on macOS with default title', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      configurable: true,
    });
    render(<TitleBar />);
    expect(screen.getByText('VaultLock')).toBeInTheDocument();
  });

  it('returns null on non-macOS platforms', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      configurable: true,
    });
    const { container } = render(<TitleBar />);
    expect(container.innerHTML).toBe('');
  });

  it('renders custom title', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      configurable: true,
    });
    render(<TitleBar title="Custom Title" />);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });
});
