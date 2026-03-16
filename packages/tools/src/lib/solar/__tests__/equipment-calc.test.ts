import { describe, it, expect } from 'vitest';
import {
  calculateDrainFromEquipment,
  calculateChargeFromEquipment,
  calculateStorageFromEquipment,
} from '../equipment-calc';
import type { DrainEquipment, ChargeEquipment, StoreEquipment } from '../types';

// --- Helpers to build test fixtures ---

function makeDrain(overrides: Partial<DrainEquipment> = {}): DrainEquipment {
  return {
    id: '1',
    catalogId: null,
    name: 'Test drain',
    type: 'drain',
    enabled: true,
    origin: 'stock',
    notes: '',
    category: 'lighting',
    wattsTypical: 20,
    wattsMin: 10,
    wattsMax: 30,
    hoursPerDayAnchor: 8,
    hoursPerDayPassage: 4,
    dutyCycle: 1.0,
    crewScaling: false,
    powerType: 'dc',
    ...overrides,
  };
}

function makeCharge(overrides: Partial<ChargeEquipment> = {}): ChargeEquipment {
  return {
    id: '1',
    catalogId: null,
    name: 'Test charge',
    type: 'charge',
    enabled: true,
    origin: 'stock',
    notes: '',
    sourceType: 'solar',
    panelWatts: 200,
    panelType: 'rigid',
    ...overrides,
  };
}

function makeStore(overrides: Partial<StoreEquipment> = {}): StoreEquipment {
  return {
    id: '1',
    catalogId: null,
    name: 'Test bank',
    type: 'store',
    enabled: true,
    origin: 'stock',
    notes: '',
    chemistry: 'lifepo4',
    capacityAh: 200,
    ...overrides,
  };
}

// --- Drain tests ---

describe('calculateDrainFromEquipment', () => {
  it('calculates DC drain correctly at anchor', () => {
    const item = makeDrain({ wattsTypical: 20, hoursPerDayAnchor: 8, dutyCycle: 1.0 });
    const result = calculateDrainFromEquipment([item], 'anchor', 2);
    // 20W × 8h × 1.0 × 1 (no crew scaling) × 1 (DC) = 160 Wh
    expect(result.totalWhPerDay).toBe(160);
  });

  it('uses passage hours when viewMode is passage', () => {
    const item = makeDrain({
      wattsTypical: 42,
      hoursPerDayAnchor: 0,
      hoursPerDayPassage: 20,
      dutyCycle: 1.0,
    });
    const result = calculateDrainFromEquipment([item], 'passage', 2);
    // 42W × 20h × 1.0 = 840 Wh
    expect(result.totalWhPerDay).toBe(840);
  });

  it('applies crew scaling relative to crew of 2', () => {
    const item = makeDrain({
      wattsTypical: 48,
      hoursPerDayAnchor: 1,
      dutyCycle: 1.0,
      crewScaling: true,
    });
    const result = calculateDrainFromEquipment([item], 'anchor', 4);
    // 48W × 1h × 1.0 × (4/2) × 1 = 96 Wh
    expect(result.totalWhPerDay).toBe(96);
  });

  it('applies inverter efficiency penalty for AC loads', () => {
    const item = makeDrain({
      wattsTypical: 100,
      hoursPerDayAnchor: 1,
      dutyCycle: 1.0,
      powerType: 'ac',
    });
    const result = calculateDrainFromEquipment([item], 'anchor', 2);
    // 100W × 1h × 1.0 × 1 × (1/0.85) = 117.647... → rounded = 118
    expect(result.totalWhPerDay).toBe(118);
  });

  it('skips disabled items', () => {
    const item = makeDrain({ enabled: false, wattsTypical: 100, hoursPerDayAnchor: 10 });
    const result = calculateDrainFromEquipment([item], 'anchor', 2);
    expect(result.totalWhPerDay).toBe(0);
  });

  it('groups breakdown by category', () => {
    const items = [
      makeDrain({ id: '1', category: 'lighting', wattsTypical: 10, hoursPerDayAnchor: 5, dutyCycle: 1 }),
      makeDrain({ id: '2', category: 'lighting', wattsTypical: 10, hoursPerDayAnchor: 5, dutyCycle: 1 }),
      makeDrain({ id: '3', category: 'navigation', wattsTypical: 20, hoursPerDayAnchor: 10, dutyCycle: 1 }),
    ];
    const result = calculateDrainFromEquipment(items, 'anchor', 2);
    expect(result.breakdownByCategory['lighting']).toBe(100); // 50 + 50
    expect(result.breakdownByCategory['navigation']).toBe(200);
    expect(result.totalWhPerDay).toBe(300);
  });
});

// --- Charge tests ---

const defaultChargeCtx = {
  peakSunHours: 5,
  deratingFactor: 0.75,
  systemVoltage: 12,
  acCircuitVoltage: 230,
};

describe('calculateChargeFromEquipment', () => {
  it('calculates solar charge from panel watts, sun hours, and derating', () => {
    const item = makeCharge({ sourceType: 'solar', panelWatts: 400, panelType: 'rigid' });
    const result = calculateChargeFromEquipment([item], defaultChargeCtx);
    // 400 × 5 × 0.75 × 1.0 = 1500 Wh
    expect(result.solarWhPerDay).toBe(1500);
    expect(result.totalWhPerDay).toBe(1500);
  });

  it('applies panel type derating factor', () => {
    const item = makeCharge({ sourceType: 'solar', panelWatts: 400, panelType: 'flexible' });
    const result = calculateChargeFromEquipment([item], defaultChargeCtx);
    // 400 × 5 × 0.75 × 0.85 = 1275 Wh
    expect(result.solarWhPerDay).toBe(1275);
  });

  it('calculates alternator charge', () => {
    const item = makeCharge({
      sourceType: 'alternator',
      alternatorAmps: 80,
      motoringHoursPerDay: 2,
    });
    const result = calculateChargeFromEquipment([item], defaultChargeCtx);
    // 80A × 12V × 2h × 0.7 = 1344 Wh
    expect(result.alternatorWhPerDay).toBe(1344);
    expect(result.totalWhPerDay).toBe(1344);
  });

  it('calculates shore power using system (DC) voltage, not AC voltage', () => {
    const item = makeCharge({
      sourceType: 'shore',
      shoreChargerAmps: 30,
      shoreHoursPerDay: 4,
    });
    const result = calculateChargeFromEquipment([item], defaultChargeCtx);
    // 30A × 12V × 4h = 1440 Wh (uses systemVoltage, not acCircuitVoltage)
    expect(result.shoreWhPerDay).toBe(1440);
    expect(result.totalWhPerDay).toBe(1440);
  });

  it('sums all charge sources together', () => {
    const items = [
      makeCharge({ id: '1', sourceType: 'solar', panelWatts: 400, panelType: 'rigid' }),
      makeCharge({ id: '2', sourceType: 'alternator', alternatorAmps: 80, motoringHoursPerDay: 2 }),
      makeCharge({ id: '3', sourceType: 'shore', shoreChargerAmps: 30, shoreHoursPerDay: 4 }),
    ];
    const result = calculateChargeFromEquipment(items, defaultChargeCtx);
    // solar: 1500 + alternator: 1344 + shore: 1440 = 4284
    expect(result.totalWhPerDay).toBe(4284);
  });

  it('skips disabled items', () => {
    const item = makeCharge({ enabled: false, panelWatts: 400 });
    const result = calculateChargeFromEquipment([item], defaultChargeCtx);
    expect(result.totalWhPerDay).toBe(0);
  });
});

// --- Storage tests ---

describe('calculateStorageFromEquipment', () => {
  it('calculates LiFePO4 usable capacity with 80% DOD', () => {
    const item = makeStore({ chemistry: 'lifepo4', capacityAh: 200 });
    const result = calculateStorageFromEquipment([item], 12);
    // 200Ah × 12V × 0.8 = 1920 Wh
    expect(result.totalUsableWh).toBe(1920);
    expect(result.totalCapacityAh).toBe(200);
  });

  it('calculates AGM usable capacity with 50% DOD', () => {
    const item = makeStore({ chemistry: 'agm', capacityAh: 200 });
    const result = calculateStorageFromEquipment([item], 12);
    // 200Ah × 12V × 0.5 = 1200 Wh
    expect(result.totalUsableWh).toBe(1200);
    expect(result.totalCapacityAh).toBe(200);
  });

  it('sums multiple battery banks', () => {
    const items = [
      makeStore({ id: '1', chemistry: 'lifepo4', capacityAh: 200 }),
      makeStore({ id: '2', chemistry: 'lifepo4', capacityAh: 100 }),
    ];
    const result = calculateStorageFromEquipment(items, 12);
    // (200 × 12 × 0.8) + (100 × 12 × 0.8) = 1920 + 960 = 2880
    expect(result.totalUsableWh).toBe(2880);
    expect(result.totalCapacityAh).toBe(300);
  });

  it('calculates days of autonomy from daily drain', () => {
    const item = makeStore({ chemistry: 'lifepo4', capacityAh: 200 });
    const result = calculateStorageFromEquipment([item], 12, 960);
    // 1920 / 960 = 2 days
    expect(result.daysAutonomy).toBe(2);
  });

  it('returns Infinity when daily drain is zero', () => {
    const item = makeStore({ chemistry: 'lifepo4', capacityAh: 200 });
    const result = calculateStorageFromEquipment([item], 12, 0);
    expect(result.daysAutonomy).toBe(Infinity);
  });

  it('skips disabled items', () => {
    const item = makeStore({ enabled: false, capacityAh: 200 });
    const result = calculateStorageFromEquipment([item], 12);
    expect(result.totalUsableWh).toBe(0);
    expect(result.totalCapacityAh).toBe(0);
  });
});
