import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../Modal';

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(<Modal open={false} onClose={vi.fn()}><p>Content</p></Modal>);
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('renders content when open', () => {
    render(<Modal open={true} onClose={vi.fn()}><p>Content</p></Modal>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<Modal open={true} onClose={vi.fn()} title="My Title"><p>Content</p></Modal>);
    expect(screen.getByText('My Title')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Modal open={true} onClose={onClose}><p>Content</p></Modal>);
    await user.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on Escape key', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Modal open={true} onClose={onClose}><p>Content</p></Modal>);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking backdrop', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Modal open={true} onClose={onClose}><p>Content</p></Modal>);
    const backdrop = screen.getByRole('dialog').parentElement!;
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close on backdrop click when closeOnBackdrop is false', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Modal open={true} onClose={onClose} closeOnBackdrop={false}><p>Content</p></Modal>);
    const backdrop = screen.getByRole('dialog').parentElement!;
    await user.click(backdrop);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('hides close button when showCloseButton is false', () => {
    render(<Modal open={true} onClose={vi.fn()} showCloseButton={false}><p>Content</p></Modal>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('sets aria-modal and role attributes', () => {
    render(<Modal open={true} onClose={vi.fn()} title="Test"><p>Content</p></Modal>);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Test');
  });

  it('applies size classes correctly', () => {
    const { rerender } = render(<Modal open={true} onClose={vi.fn()} size="sm"><p>Content</p></Modal>);
    expect(screen.getByRole('dialog')).toHaveClass('max-w-[360px]');

    rerender(<Modal open={true} onClose={vi.fn()} size="lg"><p>Content</p></Modal>);
    expect(screen.getByRole('dialog')).toHaveClass('max-w-[640px]');
  });
});
