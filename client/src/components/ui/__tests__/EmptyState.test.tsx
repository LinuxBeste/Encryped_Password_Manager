import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState } from '../EmptyState';
import { KeyRound } from 'lucide-react';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState icon={KeyRound} title="No entries found" />);
    expect(screen.getByText('No entries found')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<EmptyState icon={KeyRound} title="Empty" subtitle="Add your first entry" />);
    expect(screen.getByText('Add your first entry')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    render(<EmptyState icon={KeyRound} title="Empty" action={{ label: 'Add Entry', onClick: vi.fn() }} />);
    expect(screen.getByRole('button', { name: /add entry/i })).toBeInTheDocument();
  });

  it('calls action onClick when button is clicked', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<EmptyState icon={KeyRound} title="Empty" action={{ label: 'Add', onClick }} />);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders children when provided', () => {
    render(<EmptyState icon={KeyRound} title="Empty"><p>Extra content</p></EmptyState>);
    expect(screen.getByText('Extra content')).toBeInTheDocument();
  });
});
