import { describe, it, expect } from 'vitest';
import { transformToStockAppliances } from '../use-boat-appliances';

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
