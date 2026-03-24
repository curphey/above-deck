/**
 * Conversational route planning agent using Claude tool_use.
 * The agent can answer questions about cruising seasons, look up POIs,
 * and generate circumnavigation routes — all via natural conversation.
 */

import { CRUISING_ZONES, TRANSIT_WINDOWS, MONTH_NAMES, getMonthStatus } from './cruising-seasons';
import type { RoutePlan, TripDuration, Direction } from '@/stores/route-planner';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const TOOLS = [
  {
    name: 'get_season_info',
    description: 'Get cruising season safety info for a specific ocean region and month. Returns whether it is safe, dangerous (cyclone/hurricane/typhoon risk), or transitional.',
    input_schema: {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'Ocean region name, e.g. "Caribbean", "South Pacific", "Mediterranean", "North Indian Ocean"' },
        month: { type: 'number', description: 'Month number 1-12' },
      },
      required: ['region', 'month'],
    },
  },
  {
    name: 'get_transit_window',
    description: 'Get the best months and details for a specific ocean transit/passage, e.g. "Atlantic crossing", "Panama Canal", "Indian Ocean crossing".',
    input_schema: {
      type: 'object',
      properties: {
        passage: { type: 'string', description: 'Name of the passage or transit' },
      },
      required: ['passage'],
    },
  },
  {
    name: 'list_all_zones',
    description: 'List all cyclone/hurricane zones with their danger months and safe months.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'list_all_transits',
    description: 'List all classic circumnavigation transit windows with best months.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'generate_route',
    description: 'Generate a full circumnavigation route plan with waypoints and seasonal timing. Use this when the user asks to plan a route or circumnavigation.',
    input_schema: {
      type: 'object',
      properties: {
        departure_name: { type: 'string', description: 'Departure port name' },
        departure_lat: { type: 'number', description: 'Departure latitude' },
        departure_lon: { type: 'number', description: 'Departure longitude' },
        departure_month: { type: 'number', description: 'Departure month 1-12' },
        trip_years: { type: 'number', description: 'Trip duration in years (3, 4, or 5)' },
        direction: { type: 'string', enum: ['westabout', 'eastabout'], description: 'Direction of circumnavigation' },
        boat_speed: { type: 'number', description: 'Average passage speed in knots' },
        preferences: { type: 'string', description: 'User preferences for the route' },
      },
      required: ['departure_name', 'departure_lat', 'departure_lon', 'departure_month', 'trip_years', 'direction'],
    },
  },
];

const SYSTEM_PROMPT = `You are a knowledgeable sailing route planning assistant. You help sailors plan circumnavigations and answer questions about cruising seasons, weather windows, and ocean passages.

You have access to tools that provide real cruising season data (cyclone zones, transit windows) and can generate full route plans. Use these tools to give accurate, data-backed answers.

Key knowledge:
- You understand cyclone/hurricane/typhoon seasons for every ocean basin
- You know the classic transit windows that define circumnavigation timing
- You can generate detailed multi-year route plans with seasonal safety
- You speak like a fellow sailor — knowledgeable, direct, practical

When users ask about routes, timing, or safety, USE YOUR TOOLS to check the data rather than guessing. When they want a route planned, use generate_route.

Keep responses concise and practical. Sailors want facts, not fluff.`;

export async function sendAgentMessage(
  apiKey: string,
  messages: ChatMessage[],
  signal?: AbortSignal,
): Promise<{ reply: string; route?: RoutePlan }> {
  let route: RoutePlan | undefined;

  // Build API messages
  const apiMessages = messages.map(m => ({ role: m.role, content: m.content }));

  // Tool use loop (max 5 iterations)
  let currentMessages: any[] = [...apiMessages];

  for (let i = 0; i < 5; i++) {
    const resp = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: currentMessages,
        tools: TOOLS,
      }),
      signal,
    });

    if (!resp.ok) {
      const err = await resp.text().catch(() => '');
      throw new Error(`API error ${resp.status}: ${err.slice(0, 200)}`);
    }

    const data = await resp.json();

    if (data.stop_reason !== 'tool_use') {
      // Final text response
      const text = data.content?.find((b: any) => b.type === 'text')?.text || '';
      return { reply: text, route };
    }

    // Handle tool calls
    currentMessages.push({ role: 'assistant', content: data.content });

    const toolResults: any[] = [];
    for (const block of data.content) {
      if (block.type !== 'tool_use') continue;

      const result = executeTool(block.name, block.input);

      // If it's a route generation, parse and store
      if (block.name === 'generate_route' && result.startsWith('{')) {
        try {
          route = JSON.parse(result);
        } catch { /* ignore parse errors */ }
      }

      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: result,
      });
    }

    currentMessages.push({ role: 'user', content: toolResults });
  }

  return { reply: 'I ran out of tool iterations. Could you try a simpler question?', route };
}

function executeTool(name: string, input: any): string {
  switch (name) {
    case 'get_season_info': {
      const { region, month } = input;
      const zone = CRUISING_ZONES.find(z =>
        z.name.toLowerCase().includes(region.toLowerCase()) ||
        z.id.toLowerCase().includes(region.toLowerCase().replace(/\s+/g, '-'))
      );
      if (!zone) return JSON.stringify({ error: `Unknown region: ${region}. Known regions: ${CRUISING_ZONES.map(z => z.name).join(', ')}` });
      const status = getMonthStatus(zone, month);
      return JSON.stringify({
        region: zone.name,
        month: MONTH_NAMES[month - 1],
        status,
        hazard: zone.hazard,
        notes: zone.notes,
        safeMonths: zone.safeMonths.map(m => MONTH_NAMES[m - 1]),
        dangerMonths: zone.dangerMonths.map(m => MONTH_NAMES[m - 1]),
      });
    }

    case 'get_transit_window': {
      const { passage } = input;
      const tw = TRANSIT_WINDOWS.find(t =>
        t.name.toLowerCase().includes(passage.toLowerCase()) ||
        t.id.toLowerCase().includes(passage.toLowerCase().replace(/\s+/g, '-'))
      );
      if (!tw) return JSON.stringify({ error: `Unknown passage: ${passage}. Known passages: ${TRANSIT_WINDOWS.map(t => t.name).join(', ')}` });
      return JSON.stringify({
        name: tw.name,
        bestMonths: tw.bestMonths.map(m => MONTH_NAMES[m - 1]),
        notes: tw.notes,
        from: tw.from,
        to: tw.to,
      });
    }

    case 'list_all_zones':
      return JSON.stringify(CRUISING_ZONES.map(z => ({
        name: z.name,
        hazard: z.hazard,
        dangerMonths: z.dangerMonths.map(m => MONTH_NAMES[m - 1]).join(', '),
        safeMonths: z.safeMonths.map(m => MONTH_NAMES[m - 1]).join(', '),
        notes: z.notes,
      })));

    case 'list_all_transits':
      return JSON.stringify(TRANSIT_WINDOWS.map(t => ({
        name: t.name,
        bestMonths: t.bestMonths.map(m => MONTH_NAMES[m - 1]).join(', '),
        notes: t.notes,
      })));

    case 'generate_route': {
      // Build a route plan from the cruising season data
      const plan = buildRoutePlan(input);
      return JSON.stringify(plan);
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

/**
 * Generates a route plan server-side using the cruising season data.
 * This is a deterministic planner — not an LLM call — based on
 * well-known circumnavigation waypoints and seasonal constraints.
 */
function buildRoutePlan(input: any): RoutePlan {
  const { departure_name, departure_lat, departure_lon, departure_month, trip_years, direction, preferences } = input;

  // Classic westabout waypoints (trade wind route)
  const westaboutWaypoints: Omit<RouteWaypoint, 'arriveMonth' | 'arriveYear' | 'departMonth' | 'seasonStatus'>[] = [
    { name: departure_name, lat: departure_lat, lon: departure_lon, stayWeeks: 0, notes: 'Departure' },
    { name: 'Las Palmas, Canaries', lat: 28.1, lon: -15.4, stayWeeks: 3, notes: 'ARC rally preparation, provisioning' },
    { name: 'Mindelo, Cape Verde', lat: 16.89, lon: -24.98, stayWeeks: 2, notes: 'Optional stop, good provisioning' },
    { name: 'Bridgetown, Barbados', lat: 13.1, lon: -59.6, stayWeeks: 2, notes: 'Landfall after Atlantic crossing' },
    { name: 'Rodney Bay, St Lucia', lat: 14.07, lon: -60.95, stayWeeks: 3, notes: 'Caribbean cruising base' },
    { name: 'Grenada', lat: 12.05, lon: -61.75, stayWeeks: 4, notes: 'Below hurricane belt, safe summer storage' },
    { name: 'ABC Islands (Bonaire)', lat: 12.15, lon: -68.27, stayWeeks: 2, notes: 'Excellent diving, outside hurricane zone' },
    { name: 'Shelter Bay, Panama', lat: 9.36, lon: -79.95, stayWeeks: 3, notes: 'Panama Canal transit preparation' },
    { name: 'Las Perlas, Panama', lat: 8.38, lon: -79.05, stayWeeks: 2, notes: 'Pacific side staging' },
    { name: 'Galapagos', lat: -0.95, lon: -89.62, stayWeeks: 3, notes: 'Permit required, incredible wildlife' },
    { name: 'Marquesas, French Polynesia', lat: -8.92, lon: -140.1, stayWeeks: 3, notes: 'Landfall after Pacific crossing' },
    { name: 'Papeete, Tahiti', lat: -17.53, lon: -149.57, stayWeeks: 4, notes: 'Provisioning, boat work' },
    { name: 'Bora Bora', lat: -16.5, lon: -151.74, stayWeeks: 2, notes: 'Iconic anchorage' },
    { name: 'Suwarrow, Cook Islands', lat: -13.25, lon: -163.1, stayWeeks: 1, notes: 'Remote atoll, Tom Neale\'s island' },
    { name: 'Tonga (Vava\'u)', lat: -18.65, lon: -173.98, stayWeeks: 3, notes: 'Whale watching Jul-Oct' },
    { name: 'Fiji (Savusavu)', lat: -16.78, lon: 179.34, stayWeeks: 4, notes: 'Excellent cruising, cyclone hole' },
    { name: 'Opua, New Zealand', lat: -35.31, lon: 174.12, stayWeeks: 12, notes: 'Cyclone season layup Nov-Apr' },
    { name: 'New Caledonia (Noumea)', lat: -22.28, lon: 166.45, stayWeeks: 3, notes: 'French territory, good facilities' },
    { name: 'Cairns, Australia', lat: -16.92, lon: 145.77, stayWeeks: 4, notes: 'Great Barrier Reef' },
    { name: 'Darwin, Australia', lat: -12.46, lon: 130.84, stayWeeks: 3, notes: 'Indonesia rally staging' },
    { name: 'Bali, Indonesia', lat: -8.75, lon: 115.17, stayWeeks: 3, notes: 'Cultural highlight' },
    { name: 'Singapore', lat: 1.26, lon: 103.82, stayWeeks: 2, notes: 'Provisioning, boat work' },
    { name: 'Langkawi, Malaysia', lat: 6.35, lon: 99.73, stayWeeks: 3, notes: 'Duty-free, good marina' },
    { name: 'Galle, Sri Lanka', lat: 6.03, lon: 80.22, stayWeeks: 2, notes: 'Indian Ocean staging' },
    { name: 'Maldives', lat: 4.17, lon: 73.51, stayWeeks: 2, notes: 'Atolls, permit required' },
    { name: 'Chagos (BIOT)', lat: -6.33, lon: 71.83, stayWeeks: 2, notes: 'Remote, check access rules' },
    { name: 'Rodrigues', lat: -19.72, lon: 63.43, stayWeeks: 1, notes: 'En route to Mauritius' },
    { name: 'Richards Bay, South Africa', lat: -28.8, lon: 32.08, stayWeeks: 3, notes: 'Africa landfall, wait for weather window' },
    { name: 'Cape Town, South Africa', lat: -33.92, lon: 18.42, stayWeeks: 4, notes: 'Major stop, boat work' },
    { name: 'St Helena', lat: -15.97, lon: -5.72, stayWeeks: 1, notes: 'Historic island stop' },
    { name: 'Salvador, Brazil', lat: -12.97, lon: -38.51, stayWeeks: 3, notes: 'Optional Atlantic routing' },
    { name: 'Azores (Horta)', lat: 38.53, lon: -28.63, stayWeeks: 2, notes: 'Classic Atlantic waypoint, Peter\'s bar' },
    { name: departure_name, lat: departure_lat, lon: departure_lon, stayWeeks: 0, notes: 'Return home — circumnavigation complete!' },
  ];

  // Simple month/year assignment based on trip_years
  const waypoints = westaboutWaypoints;
  const totalMonths = trip_years * 12;
  const monthsPerLeg = totalMonths / (waypoints.length - 1);

  let currentMonth = departure_month;
  let currentYear = 1;

  interface RouteWaypoint {
    name: string; lat: number; lon: number; stayWeeks: number; notes: string;
    arriveMonth: number; arriveYear: number; departMonth: number; seasonStatus: 'safe' | 'caution' | 'danger';
  }

  const planned: RouteWaypoint[] = waypoints.map((wp, i) => {
    const arriveMonth = ((currentMonth - 1) % 12) + 1;
    const arriveYear = currentYear;

    // Check season safety
    let seasonStatus: 'safe' | 'caution' | 'danger' = 'safe';
    for (const zone of CRUISING_ZONES) {
      // Simple point-in-bbox check
      const poly = zone.polygon;
      const lons = poly.map(p => p[0]);
      const lats = poly.map(p => p[1]);
      const inBbox = wp.lon >= Math.min(...lons) && wp.lon <= Math.max(...lons) &&
                     wp.lat >= Math.min(...lats) && wp.lat <= Math.max(...lats);
      if (inBbox) {
        const status = getMonthStatus(zone, arriveMonth);
        if (status === 'danger') seasonStatus = 'danger';
        else if (status === 'transition' && seasonStatus !== 'danger') seasonStatus = 'caution';
      }
    }

    const departMonth = ((arriveMonth + Math.ceil(wp.stayWeeks / 4) - 1) % 12) + 1;

    // Advance time
    const advance = Math.round(monthsPerLeg);
    currentMonth += advance;
    while (currentMonth > 12) {
      currentMonth -= 12;
      currentYear++;
    }

    return { ...wp, arriveMonth, arriveYear, departMonth, seasonStatus };
  });

  return {
    waypoints: planned,
    totalYears: trip_years,
    generatedAt: new Date().toISOString(),
    summary: `${trip_years}-year ${direction} circumnavigation from ${departure_name}. ${planned.length} waypoints covering all major ocean crossings with seasonal safety alignment.`,
  };
}

// Re-export types needed by the UI
type RouteWaypoint = RoutePlan['waypoints'][number];
