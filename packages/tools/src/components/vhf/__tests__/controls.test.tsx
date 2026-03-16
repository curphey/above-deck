import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PTTButton } from '../PTTButton';
import { ChannelDial } from '../ChannelDial';
import { useVHFStore } from '@/stores/vhf';

describe('PTTButton', () => {
  beforeEach(() => {
    useVHFStore.setState(useVHFStore.getInitialState());
  });

  it('renders with idle state', () => {
    render(<PTTButton onTransmit={() => {}} />);
    expect(screen.getByRole('button')).toBeDefined();
  });

  it('shows TX state on mouseDown', () => {
    render(<PTTButton onTransmit={() => {}} />);
    fireEvent.mouseDown(screen.getByRole('button'));
    expect(useVHFStore.getState().radioState).toBe('tx');
  });

  it('returns to idle on mouseUp', () => {
    render(<PTTButton onTransmit={() => {}} />);
    const btn = screen.getByRole('button');
    fireEvent.mouseDown(btn);
    fireEvent.mouseUp(btn);
    expect(useVHFStore.getState().radioState).toBe('idle');
  });
});

describe('ChannelDial', () => {
  beforeEach(() => {
    useVHFStore.setState(useVHFStore.getInitialState());
  });

  it('increments channel', () => {
    render(<ChannelDial />);
    const upBtn = screen.getByLabelText('Channel up');
    fireEvent.click(upBtn);
    expect(useVHFStore.getState().channel).toBe(17);
  });

  it('decrements channel', () => {
    render(<ChannelDial />);
    const downBtn = screen.getByLabelText('Channel down');
    fireEvent.click(downBtn);
    expect(useVHFStore.getState().channel).toBe(15);
  });
});
