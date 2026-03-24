import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchNauticalPOIs, type NauticalPOI } from '../overpass';

const mockOverpassResponse = {
  elements: [
    {
      type: 'node', id: 1001, lat: 50.15, lon: -5.07,
      tags: { name: 'Falmouth Marina', leisure: 'marina', 'vhf_channel': '80' },
    },
    {
      type: 'node', id: 1002, lat: 50.14, lon: -5.06,
      tags: { name: 'Visitors Anchorage', 'seamark:type': 'anchorage' },
    },
    {
      type: 'node', id: 1003, lat: 50.16, lon: -5.05,
      tags: { amenity: 'fuel', boat: 'yes', name: 'Harbour Fuel Dock' },
    },
    {
      type: 'way', id: 2001,
      center: { lat: 50.17, lon: -5.08 },
      tags: { name: 'Penryn Boatyard', waterway: 'boatyard' },
    },
    // Duplicate of Falmouth Marina (should be deduped)
    {
      type: 'node', id: 1004, lat: 50.1501, lon: -5.0701,
      tags: { name: 'Falmouth Marina', leisure: 'marina' },
    },
    // Node with no lat/lon (should be filtered)
    {
      type: 'relation', id: 3001, tags: { name: 'Something' },
    },
  ],
};

describe('fetchNauticalPOIs', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('parses overpass response into NauticalPOI array', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockOverpassResponse),
    }) as any;

    const pois = await fetchNauticalPOIs(50, -5.1, 50.2, -5.0);

    expect(pois).toHaveLength(4); // 5 valid - 1 duplicate = 4
    expect(pois[0].name).toBe('Falmouth Marina');
    expect(pois[0].type).toBe('marina');
    expect(pois[1].type).toBe('anchorage');
    expect(pois[2].type).toBe('fuel');
    expect(pois[3].type).toBe('boatyard');
  });

  it('classifies POI types correctly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockOverpassResponse),
    }) as any;

    const pois = await fetchNauticalPOIs(50, -5.1, 50.2, -5.0);
    const types = pois.map(p => p.type);
    expect(types).toContain('marina');
    expect(types).toContain('anchorage');
    expect(types).toContain('fuel');
    expect(types).toContain('boatyard');
  });

  it('deduplicates by name and approximate position', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockOverpassResponse),
    }) as any;

    const pois = await fetchNauticalPOIs(50, -5.1, 50.2, -5.0);
    const marinas = pois.filter(p => p.name === 'Falmouth Marina');
    expect(marinas).toHaveLength(1);
  });

  it('handles way elements with center coordinates', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockOverpassResponse),
    }) as any;

    const pois = await fetchNauticalPOIs(50, -5.1, 50.2, -5.0);
    const boatyard = pois.find(p => p.name === 'Penryn Boatyard');
    expect(boatyard).toBeDefined();
    expect(boatyard!.lat).toBe(50.17);
  });

  it('throws on API error', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 429 }) as any;
    await expect(fetchNauticalPOIs(50, -5, 51, -4)).rejects.toThrow('Overpass API error: 429');
  });

  it('returns empty array for empty response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ elements: [] }),
    }) as any;

    const pois = await fetchNauticalPOIs(50, -5, 51, -4);
    expect(pois).toEqual([]);
  });

  it('passes abort signal to fetch', async () => {
    const controller = new AbortController();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ elements: [] }),
    }) as any;

    await fetchNauticalPOIs(50, -5, 51, -4, controller.signal);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: controller.signal }),
    );
  });
});
