import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordField } from '../PasswordField';

Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

describe('PasswordField', () => {
  it('renders password value', () => {
    render(<PasswordField value="mysecret" />);
    const input = screen.getByDisplayValue('mysecret');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'password');
  });

  it('toggles visibility when eye button is clicked', async () => {
    const user = userEvent.setup();
    render(<PasswordField value="mysecret" />);
    const toggleBtn = screen.getAllByRole('button')[0];
    await user.click(toggleBtn);
    expect(screen.getByDisplayValue('mysecret')).toHaveAttribute('type', 'text');
    await user.click(toggleBtn);
    expect(screen.getByDisplayValue('mysecret')).toHaveAttribute('type', 'password');
  });

  it('calls onChange when value changes', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<PasswordField value="" onChange={onChange} />);
    const input = screen.getByDisplayValue('');
    await user.type(input, 'a');
    expect(onChange).toHaveBeenCalled();
  });

  it('renders strength meter when showStrength is true', () => {
    render(<PasswordField value="test" showStrength strengthScore={2} />);
    expect(screen.getByText('Fair')).toBeInTheDocument();
  });

  it('does not render strength meter by default', () => {
    render(<PasswordField value="test" />);
    expect(screen.queryByText('Weak')).not.toBeInTheDocument();
  });

  it('sets input as readonly when readonly prop is true', () => {
    render(<PasswordField value="secret" readonly />);
    expect(screen.getByDisplayValue('secret')).toHaveAttribute('readonly');
  });
});
