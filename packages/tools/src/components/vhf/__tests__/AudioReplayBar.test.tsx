import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AudioReplayBar } from '../AudioReplayBar';

describe('AudioReplayBar', () => {
  it('renders play button and duration', () => {
    render(<AudioReplayBar duration={4} type="tx" onPlay={() => {}} />);
    expect(screen.getByLabelText('Play audio')).toBeInTheDocument();
    expect(screen.getByText('0:04')).toBeInTheDocument();
  });

  it('calls onPlay when play button clicked', () => {
    const onPlay = vi.fn();
    render(<AudioReplayBar duration={4} type="tx" onPlay={onPlay} />);
    fireEvent.click(screen.getByLabelText('Play audio'));
    expect(onPlay).toHaveBeenCalled();
  });

  it('renders waveform bars', () => {
    const { container } = render(<AudioReplayBar duration={4} type="tx" onPlay={() => {}} />);
    const bars = container.querySelectorAll('[data-testid="wave-bar"]');
    expect(bars.length).toBeGreaterThan(0);
  });
});
