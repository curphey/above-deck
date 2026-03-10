import { describe, it, expect } from 'vitest';
import type {
  DrainEquipment,
  ChargeEquipment,
  StoreEquipment,
  EquipmentInstance,
} from '../types';

describe('EquipmentInstance types', () => {
  describe('DrainEquipment', () => {
    it('should create a valid drain equipment object', () => {
      const drain: DrainEquipment = {
        id: 'drain-1',
        catalogId: 'cat-nav-lights',
        name: 'Navigation Lights',
        type: 'drain',
        enabled: true,
        origin: 'stock',
        notes: '',
        category: 'navigation',
        wattsTypical: 25,
        wattsMin: 20,
        wattsMax: 30,
        hoursPerDayAnchor: 12,
        hoursPerDayPassage: 24,
        dutyCycle: 1.0,
        crewScaling: false,
        powerType: 'dc',
      };

      expect(drain.type).toBe('drain');
      expect(drain.wattsTypical).toBe(25);
      expect(drain.powerType).toBe('dc');
    });
  });

  describe('ChargeEquipment', () => {
    it('should create a valid solar charge equipment', () => {
      const solar: ChargeEquipment = {
        id: 'charge-solar-1',
        catalogId: null,
        name: 'Arch Solar Panels',
        type: 'charge',
        enabled: true,
        origin: 'added',
        notes: 'Mounted on arch',
        sourceType: 'solar',
        panelWatts: 400,
        panelType: 'rigid',
        regionName: 'Caribbean',
      };

      expect(solar.type).toBe('charge');
      expect(solar.sourceType).toBe('solar');
      expect(solar.panelWatts).toBe(400);
    });

    it('should create a valid alternator charge equipment', () => {
      const alternator: ChargeEquipment = {
        id: 'charge-alt-1',
        catalogId: null,
        name: 'Engine Alternator',
        type: 'charge',
        enabled: true,
        origin: 'stock',
        notes: '',
        sourceType: 'alternator',
        alternatorAmps: 80,
        motoringHoursPerDay: 2,
      };

      expect(alternator.type).toBe('charge');
      expect(alternator.sourceType).toBe('alternator');
      expect(alternator.alternatorAmps).toBe(80);
    });

    it('should create a valid shore charge equipment', () => {
      const shore: ChargeEquipment = {
        id: 'charge-shore-1',
        catalogId: null,
        name: 'Shore Power',
        type: 'charge',
        enabled: false,
        origin: 'stock',
        notes: 'Marina only',
        sourceType: 'shore',
        shoreHoursPerDay: 8,
        shoreChargerAmps: 30,
      };

      expect(shore.type).toBe('charge');
      expect(shore.sourceType).toBe('shore');
      expect(shore.shoreChargerAmps).toBe(30);
    });
  });

  describe('StoreEquipment', () => {
    it('should create a valid store equipment object', () => {
      const battery: StoreEquipment = {
        id: 'store-1',
        catalogId: 'cat-lifepo4-200',
        name: 'House Bank',
        type: 'store',
        enabled: true,
        origin: 'added',
        notes: '4x 200Ah in parallel',
        chemistry: 'lifepo4',
        capacityAh: 800,
      };

      expect(battery.type).toBe('store');
      expect(battery.chemistry).toBe('lifepo4');
      expect(battery.capacityAh).toBe(800);
    });
  });

  describe('EquipmentInstance discriminated union', () => {
    it('should narrow by type using filter', () => {
      const equipment: EquipmentInstance[] = [
        {
          id: 'drain-1',
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
          dutyCycle: 0.4,
          crewScaling: false,
          powerType: 'dc',
        },
        {
          id: 'charge-1',
          catalogId: null,
          name: 'Solar',
          type: 'charge',
          enabled: true,
          origin: 'added',
          notes: '',
          sourceType: 'solar',
          panelWatts: 200,
          panelType: 'semi-flexible',
        },
        {
          id: 'store-1',
          catalogId: null,
          name: 'Battery',
          type: 'store',
          enabled: true,
          origin: 'added',
          notes: '',
          chemistry: 'agm',
          capacityAh: 400,
        },
      ];

      const drains = equipment.filter(
        (e): e is DrainEquipment => e.type === 'drain'
      );
      expect(drains).toHaveLength(1);
      expect(drains[0].wattsTypical).toBe(60);

      const charges = equipment.filter(
        (e): e is ChargeEquipment => e.type === 'charge'
      );
      expect(charges).toHaveLength(1);
      expect(charges[0].panelWatts).toBe(200);

      const stores = equipment.filter(
        (e): e is StoreEquipment => e.type === 'store'
      );
      expect(stores).toHaveLength(1);
      expect(stores[0].capacityAh).toBe(400);
    });
  });
});
