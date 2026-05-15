import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnlockScreen } from '../UnlockScreen';

describe('UnlockScreen', () => {
  it('renders title and branding', () => {
    render(<UnlockScreen onUnlock={vi.fn()} onSetup={vi.fn()} />);
    expect(screen.getByText('VaultLock')).toBeInTheDocument();
    expect(screen.getByText('Enter your master password to unlock')).toBeInTheDocument();
  });

  it('calls onUnlock when form is submitted', async () => {
    const onUnlock = vi.fn().mockResolvedValue(true);
    const user = userEvent.setup();
    render(<UnlockScreen onUnlock={onUnlock} onSetup={vi.fn()} />);

    const input = screen.getByPlaceholderText('Master password');
    await user.type(input, 'mypassword');
    await user.click(screen.getByRole('button', { name: /unlock/i }));
    expect(onUnlock).toHaveBeenCalledWith('mypassword');
  });

  it('shows error message when unlock fails', async () => {
    const onUnlock = vi.fn().mockResolvedValue(false);
    const user = userEvent.setup();
    render(<UnlockScreen onUnlock={onUnlock} onSetup={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('Master password'), 'wrong');
    await user.click(screen.getByRole('button', { name: /unlock/i }));
    expect(await screen.findByText('Incorrect master password')).toBeInTheDocument();
  });

  it('shows lockout message when attempts exceed max', () => {
    render(<UnlockScreen onUnlock={vi.fn()} onSetup={vi.fn()} failedAttempts={5} maxAttempts={5} />);
    expect(screen.getByText(/too many failed attempts/i)).toBeInTheDocument();
  });

  it('disables input and button when locked out', () => {
    render(<UnlockScreen onUnlock={vi.fn()} onSetup={vi.fn()} failedAttempts={5} maxAttempts={5} />);
    expect(screen.getByPlaceholderText('Master password')).toBeDisabled();
    expect(screen.getByRole('button', { name: /unlock/i })).toBeDisabled();
  });

  it('shows biometric button when available', () => {
    render(<UnlockScreen onUnlock={vi.fn()} onSetup={vi.fn()} biometricAvailable />);
    expect(screen.getByText('Use Biometrics')).toBeInTheDocument();
  });

  it('shows failed attempts counter', () => {
    render(<UnlockScreen onUnlock={vi.fn()} onSetup={vi.fn()} failedAttempts={3} maxAttempts={5} />);
    expect(screen.getByText('3 of 5 failed attempts')).toBeInTheDocument();
  });

  it('calls onSetup when setup link is clicked', async () => {
    const onSetup = vi.fn();
    const user = userEvent.setup();
    render(<UnlockScreen onUnlock={vi.fn()} onSetup={onSetup} />);
    await user.click(screen.getByText('Set up your vault'));
    expect(onSetup).toHaveBeenCalledTimes(1);
  });

  it('triggers unlock on Enter key', async () => {
    const onUnlock = vi.fn().mockResolvedValue(true);
    const user = userEvent.setup();
    render(<UnlockScreen onUnlock={onUnlock} onSetup={vi.fn()} />);

    const input = screen.getByPlaceholderText('Master password');
    await user.type(input, 'mypassword');
    await user.keyboard('{Enter}');
    expect(onUnlock).toHaveBeenCalledWith('mypassword');
  });
});
