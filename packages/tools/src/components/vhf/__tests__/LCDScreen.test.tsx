import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LCDScreen } from '../LCDScreen';
import { useVHFStore } from '@/stores/vhf';

beforeEach(() => useVHFStore.setState({ channel: 16, squelch: 3, power: '25W', radioState: 'idle', lcdScreen: 'vhf' }));

describe('LCDScreen', () => {
  it('renders VHF screen by default showing channel 16', () => {
    render(<LCDScreen />);
    expect(screen.getByText('16')).toBeInTheDocument();
    expect(screen.getByText('156.800 MHz')).toBeInTheDocument();
  });

  it('renders AIS screen when lcdScreen is ais', () => {
    useVHFStore.setState({ lcdScreen: 'ais' });
    render(<LCDScreen />);
    expect(screen.getByText(/AIS TARGETS/)).toBeInTheDocument();
  });

  it('renders DSC screen when lcdScreen is dsc', () => {
    useVHFStore.setState({ lcdScreen: 'dsc' });
    render(<LCDScreen />);
    expect(screen.getByText(/DSC/)).toBeInTheDocument();
  });

  it('shows STBY status when idle', () => {
    render(<LCDScreen />);
    expect(screen.getByText('STBY')).toBeInTheDocument();
  });

  it('shows TX status when transmitting', () => {
    useVHFStore.setState({ radioState: 'tx' });
    render(<LCDScreen />);
    expect(screen.getByText('TX')).toBeInTheDocument();
  });
});
