import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EntryCard } from '../EntryCard';
import type { VaultEntry } from '@/types';

const baseEntry: VaultEntry = {
  id: 'e1',
  vaultId: 'v1',
  folderId: null,
  type: 'password',
  title: 'Gmail',
  username: 'user@gmail.com',
  password: 'secret123',
  url: 'https://gmail.com',
  notes: '',
  totpSecret: null,
  tags: [],
  customFields: [],
  favorite: false,
  createdAt: 1000,
  updatedAt: Date.now(),
  deletedAt: null,
  origin: 'server',
};

describe('EntryCard', () => {
  it('renders entry title and username', () => {
    render(<EntryCard entry={baseEntry} selected={false} onClick={vi.fn()} onContextMenu={vi.fn()} />);
    expect(screen.getByText('Gmail')).toBeInTheDocument();
    expect(screen.getByText('user@gmail.com')).toBeInTheDocument();
  });

  it('shows domain extracted from URL when no username', () => {
    const entry = { ...baseEntry, username: '' };
    render(<EntryCard entry={entry} selected={false} onClick={vi.fn()} onContextMenu={vi.fn()} />);
    expect(screen.getByText('gmail.com')).toBeInTheDocument();
  });

  it('shows username when no URL is present', () => {
    const entry = { ...baseEntry, url: '' };
    render(<EntryCard entry={entry} selected={false} onClick={vi.fn()} onContextMenu={vi.fn()} />);
    expect(screen.getByText('user@gmail.com')).toBeInTheDocument();
  });

  it('shows dash when no username or URL', () => {
    const entry = { ...baseEntry, url: '', username: '' };
    render(<EntryCard entry={entry} selected={false} onClick={vi.fn()} onContextMenu={vi.fn()} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows favorite star when entry is favorited', () => {
    const entry = { ...baseEntry, favorite: true };
    render(<EntryCard entry={entry} selected={false} onClick={vi.fn()} onContextMenu={vi.fn()} />);
    expect(screen.getByText('★')).toBeInTheDocument();
  });

  it('shows old indicator when entry has not been updated in 90 days', () => {
    const entry = { ...baseEntry, updatedAt: Date.now() - 100 * 24 * 60 * 60 * 1000 };
    render(<EntryCard entry={entry} selected={false} onClick={vi.fn()} onContextMenu={vi.fn()} />);
    expect(screen.getByText('old')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<EntryCard entry={baseEntry} selected={false} onClick={onClick} onContextMenu={vi.fn()} />);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('calls onContextMenu on right-click', async () => {
    const onContextMenu = vi.fn();
    const user = userEvent.setup();
    render(<EntryCard entry={baseEntry} selected={false} onClick={vi.fn()} onContextMenu={onContextMenu} />);
    await user.pointer({ target: screen.getByRole('button'), keys: '[MouseRight]' });
    expect(onContextMenu).toHaveBeenCalledTimes(1);
  });

  it('applies selected styles when selected', () => {
    render(<EntryCard entry={baseEntry} selected={true} onClick={vi.fn()} onContextMenu={vi.fn()} />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('bg-surface');
  });
});
