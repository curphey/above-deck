import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VHFApiClient } from '../api-client';

describe('VHFApiClient', () => {
  const client = new VHFApiClient('http://localhost:8080');

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('throws if no API key on transmit', async () => {
    await expect(
      client.transmit({ message: 'hello', session_id: '123' }, '')
    ).rejects.toThrow('API key required');
  });

  it('creates session with correct payload', async () => {
    const mockResponse = { id: 'test-id', region: 'uk-south', vessel_name: 'SV Artemis', vessel_type: 'sailing-yacht', messages: [] };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockResponse), { status: 200 })
    );

    const session = await client.createSession({
      region: 'uk-south',
      vessel_name: 'SV Artemis',
      vessel_type: 'sailing-yacht',
    }, 'test-api-key');

    expect(session.id).toBe('test-id');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/vhf/sessions',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
