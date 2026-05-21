import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContextMenu } from '../ContextMenu';

const mockItems = [
  { id: 'copy', label: 'Copy', onClick: vi.fn() },
  { id: 'sep1', separator: true, label: '', onClick: vi.fn() },
  { id: 'delete', label: 'Delete', danger: true, onClick: vi.fn() },
];

describe('ContextMenu', () => {
  it('renders all menu items', () => {
    render(<ContextMenu items={mockItems} position={{ x: 100, y: 100 }} onClose={vi.fn()} />);
    expect(screen.getByText('Copy')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('renders separator between items', () => {
    const { container } = render(
      <ContextMenu items={mockItems} position={{ x: 100, y: 100 }} onClose={vi.fn()} />
    );
    const separators = container.querySelectorAll('.h-px');
    expect(separators.length).toBeGreaterThanOrEqual(1);
  });

  it('calls onClick and onClose when item is clicked', async () => {
    const onClose = vi.fn();
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <ContextMenu
        items={[{ id: 'test', label: 'Test Item', onClick }]}
        position={{ x: 100, y: 100 }}
        onClose={onClose}
      />
    );
    await user.click(screen.getByText('Test Item'));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape key', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <ContextMenu items={mockItems} position={{ x: 100, y: 100 }} onClose={onClose} />
    );
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on outside click', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <ContextMenu items={mockItems} position={{ x: 100, y: 100 }} onClose={onClose} />
    );
    await user.click(document.body);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders danger items with red text', () => {
    render(<ContextMenu items={mockItems} position={{ x: 100, y: 100 }} onClose={vi.fn()} />);
    const deleteBtn = screen.getByText('Delete').closest('button');
    expect(deleteBtn).toHaveClass('text-accent-red');
  });

  it('renders shortcut text when provided', () => {
    render(
      <ContextMenu
        items={[{ id: 'copy', label: 'Copy', shortcut: 'Ctrl+C', onClick: vi.fn() }]}
        position={{ x: 100, y: 100 }}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Ctrl+C')).toBeInTheDocument();
  });
});
