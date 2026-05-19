import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LockOverlay } from '../LockOverlay';

describe('LockOverlay', () => {
  it('renders locked message and unlock button', () => {
    render(<LockOverlay onUnlock={vi.fn()} />);
    expect(screen.getByText('Vault is locked')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /unlock/i })).toBeInTheDocument();
  });

  it('calls onUnlock when unlock button is clicked', async () => {
    const onUnlock = vi.fn();
    const user = userEvent.setup();
    render(<LockOverlay onUnlock={onUnlock} />);
    await user.click(screen.getByRole('button'));
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });
});
