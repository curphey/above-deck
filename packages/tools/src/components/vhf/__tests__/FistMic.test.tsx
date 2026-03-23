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
    render(<FistMic onPressStart={() => {}} onPressEnd={() => {}} />);
    expect(screen.getByLabelText('Push to talk')).toBeInTheDocument();
  });

  it('calls onPressStart on mouse down', () => {
    const onPressStart = vi.fn();
    render(<FistMic onPressStart={onPressStart} onPressEnd={() => {}} />);
    fireEvent.mouseDown(screen.getByLabelText('Push to talk'));
    expect(onPressStart).toHaveBeenCalled();
  });

  it('calls onPressEnd on mouse up', () => {
    const onPressEnd = vi.fn();
    render(<FistMic onPressStart={() => {}} onPressEnd={onPressEnd} />);
    const btn = screen.getByLabelText('Push to talk');
    fireEvent.mouseDown(btn);
    fireEvent.mouseUp(btn);
    expect(onPressEnd).toHaveBeenCalled();
  });
});
