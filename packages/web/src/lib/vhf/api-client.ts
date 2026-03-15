import type { VHFResponse, TransmitRequest, CreateSessionRequest, Session, Scenario } from './types';

export class VHFApiClient {
  constructor(private baseUrl: string) {}

  async transmit(req: TransmitRequest, apiKey: string): Promise<VHFResponse> {
    if (!apiKey) throw new Error('API key required');

    const res = await fetch(`${this.baseUrl}/api/vhf/transmit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      body: JSON.stringify(req),
    });

    if (!res.ok) throw new Error(`Transmit failed: ${res.status}`);
    return res.json();
  }

  async createSession(req: CreateSessionRequest, apiKey: string): Promise<Session> {
    if (!apiKey) throw new Error('API key required');

    const res = await fetch(`${this.baseUrl}/api/vhf/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
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
}
