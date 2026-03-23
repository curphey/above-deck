import type { VHFResponse, TransmitRequest, CreateSessionRequest, Session, Scenario } from './types';

export class VHFApiClient {
  constructor(private baseUrl: string) {}

  async transmit(req: TransmitRequest, apiKey?: string): Promise<VHFResponse> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['X-API-Key'] = apiKey;

    const res = await fetch(`${this.baseUrl}/api/vhf/transmit`, {
      method: 'POST',
      headers,
      body: JSON.stringify(req),
    });

    if (!res.ok) throw new Error(`Transmit failed: ${res.status}`);
    return res.json();
  }

  async createSession(req: CreateSessionRequest, apiKey?: string): Promise<Session> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['X-API-Key'] = apiKey;

    const res = await fetch(`${this.baseUrl}/api/vhf/sessions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(req),
    });

    if (!res.ok) throw new Error(`Create session failed: ${res.status}`);
    return res.json();
  }

  async getScenarios(): Promise<Scenario[]> {
    const res = await fetch(`${this.baseUrl}/api/vhf/scenarios`);
    if (!res.ok) throw new Error(`Get scenarios failed: ${res.status}`);
    return res.json();
  }

  async getRegions(): Promise<Array<{ id: string; name: string }>> {
    const res = await fetch(`${this.baseUrl}/api/vhf/regions`);
    if (!res.ok) throw new Error(`Get regions failed: ${res.status}`);
    return res.json();
  }

  async getRegionAgents(regionId: string): Promise<Array<{ name: string; type: string }>> {
    const res = await fetch(`${this.baseUrl}/api/vhf/regions/${encodeURIComponent(regionId)}/agents`);
    if (!res.ok) throw new Error(`Get region agents failed: ${res.status}`);
    return res.json();
  }
}
