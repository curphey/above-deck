import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FistMic } from '../FistMic';
import { useVHFStore } from '@/stores/vhf';

describe('FistMic', () => {
  beforeEach(() => {
    useVHFStore.setState(useVHFStore.getInitialState());
  });

  it('renders PTT button', () => {
    render(<FistMic onTransmit={() => {}} />);
    expect(screen.getByLabelText('Push to talk')).toBeInTheDocument();
  });

  it('shows TX state on mouse down', () => {
    render(<FistMic onTransmit={() => {}} />);
    fireEvent.mouseDown(screen.getByLabelText('Push to talk'));
    expect(screen.getByText('TX')).toBeInTheDocument();
  });

  it('calls onTransmit on mouse up', () => {
    const onTransmit = vi.fn();
    render(<FistMic onTransmit={onTransmit} />);
    const btn = screen.getByLabelText('Push to talk');
    fireEvent.mouseDown(btn);
    fireEvent.mouseUp(btn);
    expect(onTransmit).toHaveBeenCalled();
  });
});
