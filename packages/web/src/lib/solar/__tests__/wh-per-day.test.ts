import { describe, it, expect } from 'vitest';
import { buildWhPerDayMap } from '../wh-per-day';
import type { DrainEquipment, ChargeEquipment, StoreEquipment } from '../types';

const drain: DrainEquipment = {
  id: 'd1',
  catalogId: null,
  name: 'Fridge',
  type: 'drain',
  enabled: true,
  origin: 'stock',
  notes: '',
  category: 'galley',
  wattsTypical: 60,
  wattsMin: 40,
  wattsMax: 80,
  hoursPerDayAnchor: 24,
  hoursPerDayPassage: 24,
  dutyCycle: 0.33,
  crewScaling: false,
  powerType: 'dc',
};

const solar: ChargeEquipment = {
  id: 'c1',
  catalogId: null,
  name: 'Solar Panel',
  type: 'charge',
  enabled: true,
  origin: 'added',
  notes: '',
  sourceType: 'solar',
  panelWatts: 200,
  panelType: 'rigid',
};

const alternator: ChargeEquipment = {
  id: 'c2',
  catalogId: null,
  name: 'Engine Alternator',
  type: 'charge',
  enabled: true,
  origin: 'stock',
  notes: '',
  sourceType: 'alternator',
  alternatorAmps: 80,
  motoringHoursPerDay: 1.5,
};

const shore: ChargeEquipment = {
  id: 'c3',
  catalogId: null,
  name: 'Shore Charger',
  type: 'charge',
  enabled: true,
  origin: 'stock',
  notes: '',
  sourceType: 'shore',
  shoreChargerAmps: 30,
  shoreHoursPerDay: 4,
};

const store: StoreEquipment = {
  id: 's1',
  catalogId: null,
  name: 'House Bank',
  type: 'store',
  enabled: true,
  origin: 'stock',
  notes: '',
  chemistry: 'lifepo4',
  capacityAh: 200,
};

describe('buildWhPerDayMap', () => {
  it('calculates drain Wh/day correctly for anchor mode', () => {
    const map = buildWhPerDayMap([drain], 'anchor', 2, 5, 0.75, 12);
    // 60W * 24h * 0.33 duty = 475.2 → 475
    expect(map.get('d1')).toBe(475);
  });

  it('returns 0 for disabled items', () => {
    const disabled = { ...drain, enabled: false };
    const map = buildWhPerDayMap([disabled], 'anchor', 2, 5, 0.75, 12);
    expect(map.get('d1')).toBe(0);
  });

  it('calculates solar charge Wh/day', () => {
    const map = buildWhPerDayMap([solar], 'anchor', 2, 5, 0.75, 12);
    // 200W * 5h * 0.75 * 1.0 (rigid) = 750
    expect(map.get('c1')).toBe(750);
  });

  it('calculates alternator charge Wh/day', () => {
    const map = buildWhPerDayMap([alternator], 'anchor', 2, 5, 0.75, 12);
    // 80A * 12V * 1.5h * 0.7 = 1008
    expect(map.get('c2')).toBe(1008);
  });

  it('calculates shore charge Wh/day', () => {
    const map = buildWhPerDayMap([shore], 'anchor', 2, 5, 0.75, 12);
    // 30A * 12V * 4h = 1440
    expect(map.get('c3')).toBe(1440);
  });

  it('returns 0 for store items', () => {
    const map = buildWhPerDayMap([store], 'anchor', 2, 5, 0.75, 12);
    expect(map.get('s1')).toBe(0);
  });

  it('handles mixed equipment list', () => {
    const map = buildWhPerDayMap(
      [drain, solar, alternator, shore, store],
      'anchor', 2, 5, 0.75, 12,
    );
    expect(map.size).toBe(5);
    expect(map.get('d1')).toBe(475);
    expect(map.get('c1')).toBe(750);
    expect(map.get('s1')).toBe(0);
  });

  it('applies crew scaling when crewScaling is true', () => {
    const crewScaled = { ...drain, crewScaling: true };
    const map = buildWhPerDayMap([crewScaled], 'anchor', 4, 5, 0.75, 12);
    // 60 * 24 * 0.33 * (4/2) = 950.4 → 950
    expect(map.get('d1')).toBe(950);
  });
});
