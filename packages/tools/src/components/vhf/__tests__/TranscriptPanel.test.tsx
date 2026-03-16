import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TranscriptPanel } from '../TranscriptPanel';
import { useVHFStore } from '@/stores/vhf';

describe('TranscriptPanel', () => {
  beforeEach(() => {
    useVHFStore.setState(useVHFStore.getInitialState());
  });

  it('renders empty state', () => {
    render(<TranscriptPanel />);
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('renders transcript entries', () => {
    useVHFStore.setState({
      transcript: [
        { id: '1', type: 'tx', station: 'You', message: 'Radio check', channel: 16, timestamp: new Date() },
        { id: '2', type: 'rx', station: 'Falmouth CG', message: 'Loud and clear', channel: 16, timestamp: new Date() },
      ],
    });
    render(<TranscriptPanel />);
    expect(screen.getByText('Radio check')).toBeDefined();
    expect(screen.getByText('Loud and clear')).toBeDefined();
  });
});
