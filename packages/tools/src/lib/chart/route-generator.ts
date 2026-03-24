/**
 * Generates a circumnavigation route plan using Claude API.
 * Sends cruising season data as context and gets back structured waypoints.
 */

import { CRUISING_ZONES, TRANSIT_WINDOWS, MONTH_NAMES } from './cruising-seasons';
import type { RoutePlan, RouteWaypoint, TripDuration, Direction } from '@/stores/route-planner';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

interface GenerateRouteInput {
  apiKey: string;
  departureName: string;
  departureLat: number;
  departureLon: number;
  departureMonth: number;
  departureYear: number;
  tripDuration: TripDuration;
  direction: Direction;
  boatSpeed: number;
  preferences: string;
  signal?: AbortSignal;
}

export async function generateRoute(input: GenerateRouteInput): Promise<RoutePlan> {
  const seasonContext = buildSeasonContext();
  const systemPrompt = buildSystemPrompt();
  const userMessage = buildUserMessage(input);

  const resp = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': input.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt + '\n\n' + seasonContext,
      messages: [{ role: 'user', content: userMessage }],
    }),
    signal: input.signal,
  });

  if (!resp.ok) {
    const err = await resp.text().catch(() => '');
    throw new Error(`Claude API error ${resp.status}: ${err.slice(0, 200)}`);
  }

  const data = await resp.json();
  const text = data.content?.[0]?.text;
  if (!text) throw new Error('Empty response from Claude');

  return parseRouteResponse(text, input);
}

function buildSystemPrompt(): string {
  return `You are a circumnavigation route planning expert. You help sailors plan multi-year voyages around the world.

Your job: given a departure point, date, trip duration, and direction, produce a detailed route plan with waypoints, timing, and seasonal safety notes.

CRITICAL RULES:
- NEVER route through a cyclone/hurricane zone during its danger season
- Every waypoint must be in a SAFE zone for its arrival month
- Transit windows must align with the well-known seasonal gates
- Be realistic about passage times based on boat speed
- Include popular cruising stops that sailors actually visit
- Account for time needed in each location (provisioning, repairs, tourism)

Respond with ONLY valid JSON matching this schema:
{
  "summary": "Brief 2-3 sentence overview of the route",
  "waypoints": [
    {
      "name": "Location name",
      "lat": 36.14,
      "lon": -5.35,
      "arriveMonth": 9,
      "arriveYear": 1,
      "departMonth": 10,
      "stayWeeks": 4,
      "notes": "Why this stop, what to do, seasonal context",
      "seasonStatus": "safe"
    }
  ]
}

arriveYear is relative (1 = first year, 2 = second year, etc.)
seasonStatus must be "safe", "caution", or "danger" based on cyclone/weather data.`;
}

function buildSeasonContext(): string {
  const zones = CRUISING_ZONES.map(z =>
    `- ${z.name}: ${z.hazard} risk months [${z.dangerMonths.map(m => MONTH_NAMES[m-1]).join(',')}], safe months [${z.safeMonths.map(m => MONTH_NAMES[m-1]).join(',')}]. ${z.notes}`
  ).join('\n');

  const transits = TRANSIT_WINDOWS.map(t =>
    `- ${t.name}: best months [${t.bestMonths.map(m => MONTH_NAMES[m-1]).join(',')}]. ${t.notes}`
  ).join('\n');

  return `## CRUISING SEASON DATA

### Cyclone/Hurricane Zones
${zones}

### Transit Windows
${transits}`;
}

function buildUserMessage(input: GenerateRouteInput): string {
  const dir = input.direction === 'westabout' ? 'westward (trade wind route)' : 'eastward';
  return `Plan a ${input.tripDuration}-year circumnavigation:

- Departure: ${input.departureName} (${input.departureLat.toFixed(2)}°, ${input.departureLon.toFixed(2)}°)
- Depart: ${MONTH_NAMES[input.departureMonth - 1]} ${input.departureYear}
- Direction: ${dir}
- Boat speed: ${input.boatSpeed} knots average on passage
- Duration: ${input.tripDuration} years (return to departure port)
${input.preferences ? `- Preferences: ${input.preferences}` : ''}

Generate 20-35 waypoints covering the complete circumnavigation. Include major stops and key transit points. Return ONLY the JSON.`;
}

function parseRouteResponse(text: string, input: GenerateRouteInput): RoutePlan {
  // Strip markdown fences if present
  let json = text.trim();
  if (json.startsWith('```')) {
    json = json.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const parsed = JSON.parse(json);

  const waypoints: RouteWaypoint[] = (parsed.waypoints || []).map((wp: any) => ({
    name: wp.name || 'Unknown',
    lat: Number(wp.lat) || 0,
    lon: Number(wp.lon) || 0,
    arriveMonth: Number(wp.arriveMonth) || 1,
    arriveYear: Number(wp.arriveYear) || 1,
    departMonth: Number(wp.departMonth) || wp.arriveMonth || 1,
    stayWeeks: Number(wp.stayWeeks) || 2,
    notes: wp.notes || '',
    seasonStatus: wp.seasonStatus || 'safe',
  }));

  return {
    waypoints,
    totalYears: input.tripDuration,
    generatedAt: new Date().toISOString(),
    summary: parsed.summary || `${input.tripDuration}-year ${input.direction} circumnavigation from ${input.departureName}`,
  };
}
