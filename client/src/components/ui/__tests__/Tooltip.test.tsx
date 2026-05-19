import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tooltip } from '../Tooltip';

describe('Tooltip', () => {
  it('renders children', () => {
    render(<Tooltip content="Tooltip text"><button>Hover me</button></Tooltip>);
    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('shows tooltip content on hover', async () => {
    const user = userEvent.setup();
    render(<Tooltip content="Tooltip text"><button>Hover me</button></Tooltip>);
    await user.hover(screen.getByText('Hover me'));
    expect(screen.getByText('Tooltip text')).toBeInTheDocument();
  });

  it('hides tooltip content on leave', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Tooltip content="Tooltip text"><button>Hover me</button></Tooltip>);
    await user.hover(screen.getByText('Hover me'));
    expect(screen.getByText('Tooltip text')).toBeInTheDocument();
    await user.unhover(screen.getByText('Hover me'));
    act(() => { vi.advanceTimersByTime(200); });
    expect(screen.queryByText('Tooltip text')).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
