import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RadioScreen } from '../RadioScreen';
import { useVHFStore } from '@/stores/vhf';

describe('RadioScreen', () => {
  beforeEach(() => {
    useVHFStore.setState(useVHFStore.getInitialState());
  });

  it('renders channel number', () => {
    render(<RadioScreen />);
    expect(screen.getByText('16')).toBeDefined();
  });

  it('renders power level', () => {
    render(<RadioScreen />);
    expect(screen.getByText('25W')).toBeDefined();
  });

  it('shows TX indicator when transmitting', () => {
    useVHFStore.setState({ radioState: 'tx' });
    render(<RadioScreen />);
    expect(screen.getByText('TX')).toBeDefined();
  });
});
