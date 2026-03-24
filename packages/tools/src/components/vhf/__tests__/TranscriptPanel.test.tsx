import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('renders audio replay bar on each entry', () => {
    useVHFStore.setState({
      transcript: [{ id: '1', station: 'SV Artemis', message: 'Test', channel: 16, type: 'tx', timestamp: new Date() }],
    });
    render(<TranscriptPanel />);
    expect(screen.getByLabelText('Play audio')).toBeInTheDocument();
  });

  it('renders inline feedback annotation when present', () => {
    useVHFStore.setState({
      transcript: [{
        id: '1', station: 'SV Artemis', message: 'Test', channel: 16, type: 'tx', timestamp: new Date(),
        feedback: { type: 'correct', message: 'Good procedure' },
      }],
    });
    render(<TranscriptPanel />);
    expect(screen.getByText('Good procedure')).toBeInTheDocument();
  });

  it('renders Clear and Export buttons', () => {
    render(<TranscriptPanel />);
    expect(screen.getByText('Clear')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('export creates a blob download when transcript has entries', () => {
    useVHFStore.setState({
      transcript: [
        { id: '1', type: 'tx', station: 'SV Artemis', message: 'Radio check', channel: 16, timestamp: new Date('2026-03-24T10:00:00Z') },
        { id: '2', type: 'rx', station: 'Falmouth CG', message: 'Loud and clear', channel: 16, timestamp: new Date('2026-03-24T10:00:05Z') },
      ],
    });

    const createObjectURL = vi.fn(() => 'blob:test');
    const revokeObjectURL = vi.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;

    render(<TranscriptPanel />);
    fireEvent.click(screen.getByText('Export'));

    expect(createObjectURL).toHaveBeenCalledOnce();
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('text/plain');
    expect(revokeObjectURL).toHaveBeenCalledOnce();

    vi.restoreAllMocks();
  });
});
