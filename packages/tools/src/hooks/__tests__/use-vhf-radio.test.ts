import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useVHFRadio } from '../use-vhf-radio';
import { useVHFStore } from '@/stores/vhf';

vi.mock('@/lib/vhf/api-client', () => ({
  VHFApiClient: vi.fn().mockImplementation(() => ({
    createSession: vi.fn().mockResolvedValue({ id: 'session-1', region: 'uk-south', vessel_name: 'SV Artemis', vessel_type: 'sailing-yacht', messages: [] }),
    transmit: vi.fn().mockResolvedValue({
      response: { station: 'Coastguard', message: 'Loud and clear', channel: 16 },
      feedback: { correct: [], errors: [], protocol_note: '' },
    }),
  })),
}));

describe('useVHFRadio', () => {
  beforeEach(() => {
    useVHFStore.setState({ ...useVHFStore.getInitialState(), apiKey: 'test-key' });
  });

  it('returns expected interface', () => {
    const { result } = renderHook(() => useVHFRadio());
    expect(result.current.startTransmit).toBeDefined();
    expect(result.current.stopTransmit).toBeDefined();
    expect(result.current.createSession).toBeDefined();
    expect(typeof result.current.isReady).toBe('boolean');
  });

  it('isReady is false when no API key', () => {
    useVHFStore.setState({ apiKey: '' });
    const { result } = renderHook(() => useVHFRadio());
    expect(result.current.isReady).toBe(false);
  });
});
