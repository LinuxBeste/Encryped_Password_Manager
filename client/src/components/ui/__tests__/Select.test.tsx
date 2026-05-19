import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from '../Select';

const options = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
  { value: 'c', label: 'Option C' },
];

describe('Select', () => {
  it('renders all options', () => {
    render(<Select options={options} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    options.forEach((opt) => {
      expect(screen.getByText(opt.label)).toBeInTheDocument();
    });
  });

  it('renders label when provided', () => {
    render(<Select label="Category" options={options} />);
    expect(screen.getByText('Category')).toBeInTheDocument();
  });

  it('forwards value changes', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Select options={options} onChange={onChange} />);
    await user.selectOptions(screen.getByRole('combobox'), 'b');
    expect(onChange).toHaveBeenCalled();
  });

  it('uses custom id over auto-generated', () => {
    render(<Select label="Category" id="custom-id" options={options} />);
    expect(screen.getByLabelText('Category')).toHaveAttribute('id', 'custom-id');
  });

  it('can be disabled', () => {
    render(<Select options={options} disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('applies custom className', () => {
    render(<Select options={options} className="custom-class" />);
    expect(screen.getByRole('combobox')).toHaveClass('custom-class');
  });
});
