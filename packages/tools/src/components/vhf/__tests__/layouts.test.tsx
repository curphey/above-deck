import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PanelRadio } from '../PanelRadio';
import { HandheldRadio } from '../HandheldRadio';
import { useVHFStore } from '@/stores/vhf';

describe('PanelRadio', () => {
  beforeEach(() => {
    useVHFStore.setState(useVHFStore.getInitialState());
  });

  it('renders LCD screen showing channel 16', () => {
    render(<PanelRadio onTransmit={() => {}} />);
    expect(screen.getByText('16')).toBeInTheDocument();
  });

  it('renders radio control buttons', () => {
    render(<PanelRadio onTransmit={() => {}} />);
    expect(screen.getByLabelText('Go to channel 16')).toBeInTheDocument();
    expect(screen.getByLabelText('AIS targets')).toBeInTheDocument();
    expect(screen.getByLabelText('DSC')).toBeInTheDocument();
    expect(screen.getByLabelText('Distress')).toBeInTheDocument();
  });

  it('toggles AIS screen when AIS button clicked', () => {
    render(<PanelRadio onTransmit={() => {}} />);
    fireEvent.click(screen.getByLabelText('AIS targets'));
    expect(screen.getByText(/AIS TARGETS/)).toBeInTheDocument();
  });
});

describe('HandheldRadio', () => {
  beforeEach(() => {
    useVHFStore.setState(useVHFStore.getInitialState());
  });

  it('renders without crashing', () => {
    render(<HandheldRadio transcriptPanel={<div>transcript</div>} />);
    // Multiple elements show the channel number (RadioScreen + ChannelDial)
    expect(screen.getAllByText('16')[0]).toBeDefined();
  });
});
