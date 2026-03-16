import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BoatBar } from '../BoatBar';
import { useSolarStore } from '@/stores/solar';

function wrap(ui: React.ReactElement) {
  return render(<MantineProvider>{ui}</MantineProvider>);
}

describe('BoatBar', () => {
  beforeEach(() => {
    useSolarStore.setState({
      boatName: 'Bavaria 40',
      crewSize: 2,
      regionName: 'Mediterranean',
      cruisingStyle: 'offshore',
      systemVoltage: 12,
      viewMode: 'anchor',
    });
  });

  it('renders boat name', () => {
    wrap(<BoatBar onEdit={vi.fn()} onShare={vi.fn()} />);
    expect(screen.getByText(/Bavaria 40/)).toBeDefined();
  });

  it('renders crew size', () => {
    wrap(<BoatBar onEdit={vi.fn()} onShare={vi.fn()} />);
    expect(screen.getByText(/2 crew/)).toBeDefined();
  });

  it('renders region name', () => {
    wrap(<BoatBar onEdit={vi.fn()} onShare={vi.fn()} />);
    expect(screen.getByText(/Mediterranean/)).toBeDefined();
  });

  it('has anchor/passage segmented control', () => {
    wrap(<BoatBar onEdit={vi.fn()} onShare={vi.fn()} />);
    expect(screen.getByText('Anchor')).toBeDefined();
    expect(screen.getByText('Passage')).toBeDefined();
  });

  it('calls onEdit when edit button clicked', () => {
    const onEdit = vi.fn();
    wrap(<BoatBar onEdit={onEdit} onShare={vi.fn()} />);
    const editBtn = screen.getByLabelText('Edit configuration');
    fireEvent.click(editBtn);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onShare when share button clicked', () => {
    const onShare = vi.fn();
    wrap(<BoatBar onEdit={vi.fn()} onShare={onShare} />);
    const shareBtn = screen.getByLabelText('Share configuration');
    fireEvent.click(shareBtn);
    expect(onShare).toHaveBeenCalledTimes(1);
  });

  it('has data-testid="boat-bar"', () => {
    wrap(<BoatBar onEdit={vi.fn()} onShare={vi.fn()} />);
    expect(screen.getByTestId('boat-bar')).toBeDefined();
  });
});
