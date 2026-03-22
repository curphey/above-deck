import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VHFApiClient } from '../api-client';

describe('VHFApiClient', () => {
  const client = new VHFApiClient('http://localhost:8080');

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends request without API key header when key is empty', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ response: { message: 'ok', station: 'CG', channel: 16 } }), { status: 200 })
    );
    await client.transmit({ message: 'hello', session_id: '123' }, '');
    const callHeaders = (fetch as any).mock.calls[0][1].headers;
    expect(callHeaders['X-API-Key']).toBeUndefined();
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
