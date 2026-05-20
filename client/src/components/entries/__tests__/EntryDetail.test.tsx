import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EntryDetail } from '../EntryDetail';
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
  notes: 'My notes',
  totpSecret: null,
  tags: ['google', 'email'],
  customFields: [{ id: 'cf1', label: 'Custom Field', value: 'custom value', hidden: false }],
  favorite: false,
  createdAt: 1000,
  updatedAt: 2000,
  deletedAt: null,
  origin: 'server',
};

Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

describe('EntryDetail', () => {
  it('renders entry title', () => {
    render(<EntryDetail entry={baseEntry} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Gmail')).toBeInTheDocument();
  });

  it('renders edit and delete buttons', () => {
    render(<EntryDetail entry={baseEntry} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Edit')).toBeInTheDocument();
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('calls onEdit when edit button is clicked', async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    render(<EntryDetail entry={baseEntry} onEdit={onEdit} onDelete={vi.fn()} />);
    await user.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when delete button is clicked', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(<EntryDetail entry={baseEntry} onEdit={vi.fn()} onDelete={onDelete} />);
    await user.click(screen.getAllByRole('button')[1]);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('renders URL field', () => {
    render(<EntryDetail entry={baseEntry} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('https://gmail.com')).toBeInTheDocument();
  });

  it('renders username field', () => {
    render(<EntryDetail entry={baseEntry} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('user@gmail.com')).toBeInTheDocument();
  });

  it('renders password field for password type entries', () => {
    render(<EntryDetail entry={baseEntry} onEdit={vi.fn()} onDelete={vi.fn()} />);
    const passwordInput = screen.getByDisplayValue('secret123');
    expect(passwordInput).toBeInTheDocument();
  });

  it('renders notes section', () => {
    render(<EntryDetail entry={baseEntry} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('My notes')).toBeInTheDocument();
  });

  it('renders tags', () => {
    render(<EntryDetail entry={baseEntry} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('google')).toBeInTheDocument();
    expect(screen.getByText('email')).toBeInTheDocument();
  });

  it('renders custom fields', () => {
    render(<EntryDetail entry={baseEntry} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Custom Field')).toBeInTheDocument();
    expect(screen.getByText('custom value')).toBeInTheDocument();
  });

  it('renders timestamps', () => {
    render(<EntryDetail entry={baseEntry} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText(/created:/i)).toBeInTheDocument();
    expect(screen.getByText(/updated:/i)).toBeInTheDocument();
  });

  it('does not render password field for non-password types', () => {
    const entry = { ...baseEntry, type: 'note' as const };
    render(<EntryDetail entry={entry} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.queryByDisplayValue('secret123')).not.toBeInTheDocument();
  });

  it('renders credit card preview for credit-card type', () => {
    const cardEntry: VaultEntry = {
      ...baseEntry,
      type: 'credit-card',
      username: '4111111111111111',
      url: '12/25',
      notes: '123',
    };
    render(<EntryDetail entry={cardEntry} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getAllByText('4111111111111111')).toHaveLength(2);
    const expiryTexts = screen.getAllByText('12/25');
    expect(expiryTexts.length).toBeGreaterThanOrEqual(1);
    const cvvTexts = screen.getAllByText('123');
    expect(cvvTexts.length).toBeGreaterThanOrEqual(1);
  });
});
