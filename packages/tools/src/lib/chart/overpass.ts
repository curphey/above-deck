/**
 * Queries OpenStreetMap Overpass API for nautical points of interest.
 * Returns marinas, anchorages, fuel stations, boatyards, and slipways
 * within a given bounding box.
 */

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

export interface NauticalPOI {
  id: number;
  lat: number;
  lon: number;
  name: string;
  type: POIType;
  tags: Record<string, string>;
}

export type POIType = 'marina' | 'anchorage' | 'fuel' | 'boatyard' | 'slipway' | 'harbour';

/**
 * Fetch nautical POIs within the given bounding box.
 * Uses Overpass QL to query for relevant OSM features.
 */
export async function fetchNauticalPOIs(
  south: number, west: number, north: number, east: number,
  signal?: AbortSignal,
): Promise<NauticalPOI[]> {
  // Overpass QL: query marinas, harbours, anchorages, fuel, boatyards, slipways
  const bbox = `${south},${west},${north},${east}`;
  const query = `
[out:json][timeout:10];
(
  node["leisure"="marina"](${bbox});
  node["seamark:type"="harbour"](${bbox});
  node["seamark:type"="anchorage"](${bbox});
  node["amenity"="fuel"]["boat"="yes"](${bbox});
  node["amenity"="fuel"]["seamark:type"](${bbox});
  node["leisure"="slipway"](${bbox});
  node["waterway"="boatyard"](${bbox});
  way["leisure"="marina"](${bbox});
  way["seamark:type"="harbour"](${bbox});
);
out center body;
`.trim();

  const resp = await fetch(OVERPASS_URL, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    signal,
  });

  if (!resp.ok) {
    throw new Error(`Overpass API error: ${resp.status}`);
  }

  const data = await resp.json();
  return parseOverpassResponse(data);
}

function parseOverpassResponse(data: any): NauticalPOI[] {
  if (!data.elements) return [];

  const seen = new Set<string>();

  return data.elements
    .map((el: any) => {
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      if (!lat || !lon) return null;

      const tags = el.tags || {};
      const name = tags.name || tags['seamark:name'] || classifyType(tags);
      const type = classifyType(tags);

      // Deduplicate by name+approximate position
      const key = `${name}-${lat.toFixed(3)}-${lon.toFixed(3)}`;
      if (seen.has(key)) return null;
      seen.add(key);

      return { id: el.id, lat, lon, name, type, tags };
    })
    .filter(Boolean) as NauticalPOI[];
}

function classifyType(tags: Record<string, string>): POIType {
  if (tags.leisure === 'marina') return 'marina';
  if (tags.leisure === 'slipway') return 'slipway';
  if (tags.waterway === 'boatyard') return 'boatyard';
  if (tags['seamark:type'] === 'anchorage') return 'anchorage';
  if (tags['seamark:type'] === 'harbour') return 'harbour';
  if (tags.amenity === 'fuel') return 'fuel';
  return 'harbour';
}
