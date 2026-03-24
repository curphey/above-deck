import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendAgentMessage } from '../route-agent';

describe('route-agent', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends messages with tools to Claude API', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        content: [{ type: 'text', text: 'The Caribbean is dangerous in August due to hurricane season.' }],
        stop_reason: 'end_turn',
      }),
    }) as any;

    const result = await sendAgentMessage('test-key', [
      { role: 'user', content: 'Is the Caribbean safe in August?' },
    ]);

    expect(result.reply).toContain('Caribbean');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'x-api-key': 'test-key' }),
      }),
    );

    // Verify tools were sent
    const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
    expect(body.tools).toBeDefined();
    expect(body.tools.length).toBe(5);
    expect(body.tools.map((t: any) => t.name)).toContain('get_season_info');
    expect(body.tools.map((t: any) => t.name)).toContain('generate_route');
  });

  it('handles tool_use loop — executes get_season_info', async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            content: [{
              type: 'tool_use', id: 'toolu_01', name: 'get_season_info',
              input: { region: 'North Atlantic', month: 8 },
            }],
            stop_reason: 'tool_use',
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          content: [{ type: 'text', text: 'August is hurricane season in the Caribbean — dangerous.' }],
          stop_reason: 'end_turn',
        }),
      });
    }) as any;

    const result = await sendAgentMessage('test-key', [
      { role: 'user', content: 'Is the Caribbean safe in August?' },
    ]);

    expect(callCount).toBe(2);
    expect(result.reply).toContain('hurricane');

    // Verify tool result was sent back
    const secondCall = JSON.parse((global.fetch as any).mock.calls[1][1].body);
    const toolResultMsg = secondCall.messages.find((m: any) =>
      Array.isArray(m.content) && m.content.some((c: any) => c.type === 'tool_result')
    );
    expect(toolResultMsg).toBeDefined();
    const toolResult = JSON.parse(toolResultMsg.content[0].content);
    expect(toolResult.status).toBe('danger');
    expect(toolResult.hazard).toBe('hurricane');
  });

  it('handles list_all_zones tool', async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            content: [{ type: 'tool_use', id: 'toolu_02', name: 'list_all_zones', input: {} }],
            stop_reason: 'tool_use',
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          content: [{ type: 'text', text: 'Here are all the zones...' }],
          stop_reason: 'end_turn',
        }),
      });
    }) as any;

    const result = await sendAgentMessage('test-key', [{ role: 'user', content: 'List all zones' }]);
    expect(result.reply).toContain('zones');

    const secondCall = JSON.parse((global.fetch as any).mock.calls[1][1].body);
    const toolResultMsg = secondCall.messages.find((m: any) =>
      Array.isArray(m.content) && m.content.some((c: any) => c.type === 'tool_result')
    );
    const zones = JSON.parse(toolResultMsg.content[0].content);
    expect(zones.length).toBe(7);
  });

  it('generates route and returns it', async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            content: [{
              type: 'tool_use', id: 'toolu_03', name: 'generate_route',
              input: {
                departure_name: 'Gibraltar', departure_lat: 36.14, departure_lon: -5.35,
                departure_month: 9, trip_years: 3, direction: 'westabout',
              },
            }],
            stop_reason: 'tool_use',
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          content: [{ type: 'text', text: 'Here is your 3-year route from Gibraltar.' }],
          stop_reason: 'end_turn',
        }),
      });
    }) as any;

    const result = await sendAgentMessage('test-key', [
      { role: 'user', content: 'Plan a 3-year westabout from Gibraltar starting September' },
    ]);

    expect(result.reply).toContain('Gibraltar');
    expect(result.route).toBeDefined();
    expect(result.route!.waypoints.length).toBeGreaterThan(10);
    expect(result.route!.totalYears).toBe(3);
    expect(result.route!.waypoints[0].name).toBe('Gibraltar');
  });

  it('throws on API error', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401, text: () => Promise.resolve('Unauthorized') }) as any;
    await expect(sendAgentMessage('bad-key', [{ role: 'user', content: 'hi' }])).rejects.toThrow('API error 401');
  });
});
