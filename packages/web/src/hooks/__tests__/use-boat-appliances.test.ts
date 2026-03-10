import { describe, it, expect } from 'vitest';
import { transformToStockAppliances, transformToEquipmentInstances } from '../use-boat-appliances';

describe('transformToStockAppliances', () => {
  it('should mark all appliances with origin stock', () => {
    const raw = [
      { id: '1', name: 'Fridge', category: 'refrigeration', watts_typical: 60,
        watts_min: 40, watts_max: 80, hours_per_day_anchor: 24,
        hours_per_day_passage: 24, duty_cycle: 0.4, usage_type: 'always-on',
        crew_scaling: false, sort_order: 1 },
    ];
    const result = transformToStockAppliances(raw);
    expect(result[0].origin).toBe('stock');
    expect(result[0].enabled).toBe(true);
  });

  it('should map snake_case DB fields to camelCase', () => {
    const raw = [
      { id: '1', name: 'VHF', category: 'communication', watts_typical: 25,
        watts_min: 5, watts_max: 25, hours_per_day_anchor: 1,
        hours_per_day_passage: 8, duty_cycle: 1, usage_type: 'scheduled',
        crew_scaling: false, sort_order: 2 },
    ];
    const result = transformToStockAppliances(raw);
    expect(result[0].wattsTypical).toBe(25);
    expect(result[0].hoursPerDayAnchor).toBe(1);
    expect(result[0].hoursPerDayPassage).toBe(8);
  });

  it('should return empty array for null input', () => {
    expect(transformToStockAppliances(null)).toEqual([]);
  });
});

describe('transformToEquipmentInstances', () => {
  const sampleRow = {
    id: 'abc-123',
    name: 'Fridge',
    category: 'refrigeration',
    watts_typical: 60,
    watts_min: 40,
    watts_max: 80,
    hours_per_day_anchor: 24,
    hours_per_day_passage: 24,
    duty_cycle: 0.4,
    crew_scaling: false,
  };

  it('should convert appliance rows to DrainEquipment instances', () => {
    const result = transformToEquipmentInstances([sampleRow], {});
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'drain-abc-123-stock',
      catalogId: 'abc-123',
      name: 'Fridge',
      type: 'drain',
      enabled: true,
      origin: 'stock',
      category: 'refrigeration',
      wattsTypical: 60,
      wattsMin: 40,
      wattsMax: 80,
      hoursPerDayAnchor: 24,
      hoursPerDayPassage: 24,
      dutyCycle: 0.4,
      crewScaling: false,
      powerType: 'dc',
    });
  });

  it('should add alternator ChargeEquipment when alternator_amps is set', () => {
    const result = transformToEquipmentInstances([], { alternator_amps: 80 });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'charge-alternator-stock',
      type: 'charge',
      sourceType: 'alternator',
      alternatorAmps: 80,
      motoringHoursPerDay: 1.5,
    });
  });

  it('should add battery StoreEquipment when battery_capacity_ah is set', () => {
    const result = transformToEquipmentInstances([], {
      battery_capacity_ah: 400,
      battery_type: 'lifepo4',
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'store-battery-stock',
      type: 'store',
      chemistry: 'lifepo4',
      capacityAh: 400,
    });
  });

  it('should default battery chemistry to agm for unknown types', () => {
    const result = transformToEquipmentInstances([], {
      battery_capacity_ah: 200,
      battery_type: 'lead-acid',
    });
    expect(result[0]).toMatchObject({ chemistry: 'agm' });
  });

  it('should combine drains, charge, and store equipment', () => {
    const result = transformToEquipmentInstances([sampleRow], {
      alternator_amps: 80,
      battery_capacity_ah: 400,
      battery_type: 'agm',
    });
    expect(result).toHaveLength(3);
    expect(result.map((e) => e.type)).toEqual(['drain', 'charge', 'store']);
  });

  it('should return empty array when given no appliances and no boat data', () => {
    expect(transformToEquipmentInstances([], {})).toEqual([]);
  });

  it('should use appliance_id over id when present', () => {
    const row = { ...sampleRow, appliance_id: 'custom-id' };
    const result = transformToEquipmentInstances([row], {});
    expect(result[0].id).toBe('drain-custom-id-stock');
    expect(result[0].catalogId).toBe('custom-id');
  });
});
