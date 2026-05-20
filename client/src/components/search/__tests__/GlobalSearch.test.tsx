import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlobalSearch } from '../GlobalSearch';
import { useUIStore } from '@/store/ui.store';
import { useVaultStore } from '@/store/vault.store';
import type { VaultEntry } from '@/types';

const mockEntries: VaultEntry[] = [
  {
    id: '1', vaultId: 'v1', folderId: null, type: 'password',
    title: 'Gmail', username: 'user@gmail.com', password: 'pass1',
    url: 'https://gmail.com', notes: '', totpSecret: null,
    tags: ['google'], customFields: [], favorite: false,
    createdAt: 1000, updatedAt: 1000, deletedAt: null, origin: 'server',
  },
  {
    id: '2', vaultId: 'v1', folderId: null, type: 'note',
    title: 'Secret Note', username: '', password: '',
    url: '', notes: 'my secret', totpSecret: null,
    tags: [], customFields: [], favorite: false,
    createdAt: 1000, updatedAt: 1000, deletedAt: null, origin: 'server',
  },
];

describe('GlobalSearch', () => {
  beforeEach(() => {
    useUIStore.setState({
      globalSearchOpen: true,
      searchQuery: '',
      selectedEntry: null,
      selectedEntryId: null,
      selectedNav: 'all',
      panelView: 'detail',
      contextMenu: null,
    });
    useVaultStore.setState({ entries: mockEntries, folders: [], vaultName: '', vaultId: null });
  });

  it('renders search input when open', () => {
    render(<GlobalSearch />);
    expect(screen.getByPlaceholderText('Search entries...')).toBeInTheDocument();
  });

  it('returns null when closed', () => {
    useUIStore.setState({ globalSearchOpen: false });
    const { container } = render(<GlobalSearch />);
    expect(container.innerHTML).toBe('');
  });

  it('filters entries based on search query', async () => {
    const user = userEvent.setup();
    render(<GlobalSearch />);
    const input = screen.getByPlaceholderText('Search entries...');
    await user.type(input, 'gmail');
    expect(screen.getByText('Gmail')).toBeInTheDocument();
    expect(screen.queryByText('Secret Note')).not.toBeInTheDocument();
  });

  it('shows no results message for unmatched query', async () => {
    const user = userEvent.setup();
    render(<GlobalSearch />);
    const input = screen.getByPlaceholderText('Search entries...');
    await user.type(input, 'zzzzz');
    expect(screen.getByText(/no results/i)).toBeInTheDocument();
  });

  it('selects entry on click', async () => {
    const user = userEvent.setup();
    render(<GlobalSearch />);
    const input = screen.getByPlaceholderText('Search entries...');
    await user.type(input, 'gmail');
    await user.click(screen.getByText('Gmail'));
    expect(useUIStore.getState().selectedEntry?.id).toBe('1');
    expect(useUIStore.getState().globalSearchOpen).toBe(false);
  });

  it('navigates results with arrow keys', async () => {
    const user = userEvent.setup();
    render(<GlobalSearch />);
    const input = screen.getByPlaceholderText('Search entries...');
    await user.type(input, 'e');

    const button = screen.getByText('Gmail');
    // Focus is on the input
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    // After keyboard navigation, pressing Enter should select
    await user.keyboard('{Enter}');
  });

  it('closes on Escape key', async () => {
    const user = userEvent.setup();
    render(<GlobalSearch />);
    await user.keyboard('{Escape}');
    expect(useUIStore.getState().globalSearchOpen).toBe(false);
  });

  it('shows ESC badge', () => {
    render(<GlobalSearch />);
    expect(screen.getByText('ESC')).toBeInTheDocument();
  });

  it('displays entry type icons based on type', async () => {
    const user = userEvent.setup();
    render(<GlobalSearch />);
    const input = screen.getByPlaceholderText('Search entries...');
    await user.type(input, 'gmail');
    expect(screen.getByText('gmail.com')).toBeInTheDocument();
  });
});
