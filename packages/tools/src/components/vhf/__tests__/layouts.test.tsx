import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PanelRadio } from '../PanelRadio';
import { HandheldRadio } from '../HandheldRadio';
import { useVHFStore } from '@/stores/vhf';

describe('PanelRadio', () => {
  beforeEach(() => {
    useVHFStore.setState(useVHFStore.getInitialState());
  });

  it('renders without crashing', () => {
    render(<PanelRadio />);
    // Multiple elements show the channel number (RadioScreen + ChannelDial)
    expect(screen.getAllByText('16')[0]).toBeDefined();
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
