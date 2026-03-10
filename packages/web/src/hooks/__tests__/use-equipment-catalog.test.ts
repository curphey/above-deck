import { describe, it, expect } from 'vitest';
import { catalogRowToEquipment } from '../use-equipment-catalog';

describe('catalogRowToEquipment', () => {
  it('converts a drain catalog row to DrainEquipment', () => {
    const row = {
      id: 'cat-123',
      type: 'drain' as const,
      category: 'watermaker',
      make: 'Schenker',
      model: 'Zen 30',
      year: 2024,
      latest: true,
      name: 'Schenker Zen 30',
      specs: {
        wattsTypical: 96,
        wattsMin: 80,
        wattsMax: 120,
        hoursPerDayAnchor: 2,
        hoursPerDayPassage: 2,
        dutyCycle: 1,
        crewScaling: false,
        powerType: 'dc',
      },
    };

    const result = catalogRowToEquipment(row);

    expect(result.id).toBeTruthy();
    expect(result.catalogId).toBe('cat-123');
    expect(result.name).toBe('Schenker Zen 30');
    expect(result.type).toBe('drain');
    expect(result.origin).toBe('catalog');
    expect(result.enabled).toBe(true);
    if (result.type === 'drain') {
      expect(result.wattsTypical).toBe(96);
      expect(result.powerType).toBe('dc');
      expect(result.category).toBe('watermaker');
    }
  });

  it('converts a charge catalog row to ChargeEquipment', () => {
    const row = {
      id: 'cat-456',
      type: 'charge' as const,
      category: 'solar',
      make: 'Victron',
      model: 'BlueSolar 305W',
      year: 2024,
      latest: true,
      name: 'Victron BlueSolar 305W',
      specs: {
        sourceType: 'solar',
        panelWatts: 305,
        panelType: 'rigid',
      },
    };

    const result = catalogRowToEquipment(row);

    expect(result.catalogId).toBe('cat-456');
    expect(result.origin).toBe('catalog');
    expect(result.type).toBe('charge');
    if (result.type === 'charge') {
      expect(result.sourceType).toBe('solar');
      expect(result.panelWatts).toBe(305);
    }
  });

  it('converts a store catalog row to StoreEquipment', () => {
    const row = {
      id: 'cat-789',
      type: 'store' as const,
      category: 'lifepo4',
      make: 'Battle Born',
      model: '100Ah 12V',
      year: 2024,
      latest: true,
      name: 'Battle Born 100Ah',
      specs: {
        chemistry: 'lifepo4',
        capacityAh: 100,
      },
    };

    const result = catalogRowToEquipment(row);

    expect(result.catalogId).toBe('cat-789');
    expect(result.origin).toBe('catalog');
    expect(result.type).toBe('store');
    if (result.type === 'store') {
      expect(result.chemistry).toBe('lifepo4');
      expect(result.capacityAh).toBe(100);
    }
  });
});
