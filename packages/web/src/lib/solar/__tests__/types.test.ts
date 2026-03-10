import { describe, it, expect } from 'vitest';
import type {
  DrainEquipment,
  ChargeEquipment,
  StoreEquipment,
  EquipmentInstance,
  CruisingStyle,
  BoatType,
  WizardConfig,
  CuratedRegion,
  PreviousMetrics,
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

describe('Configurator types (v4)', () => {
  describe('CruisingStyle', () => {
    it('should accept valid cruising styles', () => {
      const styles: CruisingStyle[] = ['weekend', 'coastal', 'offshore'];
      expect(styles).toHaveLength(3);
    });
  });

  describe('BoatType', () => {
    it('should accept valid boat types', () => {
      const types: BoatType[] = ['mono', 'cat', 'tri'];
      expect(types).toHaveLength(3);
    });
  });

  describe('WizardConfig', () => {
    it('should create a valid wizard config object', () => {
      const config: WizardConfig = {
        boatName: 'Sea Breeze',
        templateId: 'tmpl-coastal-40',
        boatType: 'mono',
        boatLengthFt: 40,
        systemVoltage: 12,
        regionName: 'Caribbean',
        latitude: 15.0,
        longitude: -61.0,
        peakSunHours: 5.5,
        deratingFactor: 0.75,
        cruisingStyle: 'coastal',
        crewSize: 2,
      };

      expect(config.boatName).toBe('Sea Breeze');
      expect(config.boatType).toBe('mono');
      expect(config.systemVoltage).toBe(12);
      expect(config.cruisingStyle).toBe('coastal');
    });

    it('should allow null templateId', () => {
      const config: WizardConfig = {
        boatName: 'Custom Build',
        templateId: null,
        boatType: 'cat',
        boatLengthFt: 45,
        systemVoltage: 24,
        regionName: 'Mediterranean',
        latitude: 36.0,
        longitude: 14.5,
        peakSunHours: 4.5,
        deratingFactor: 0.75,
        cruisingStyle: 'offshore',
        crewSize: 4,
      };

      expect(config.templateId).toBeNull();
      expect(config.boatType).toBe('cat');
    });
  });

  describe('CuratedRegion', () => {
    it('should create a valid curated region object', () => {
      const region: CuratedRegion = {
        name: 'Caribbean',
        lat: 15.0,
        lon: -61.0,
        psh: 5.5,
        deratingFactor: 0.75,
        thumbnailUrl: '',
      };

      expect(region.name).toBe('Caribbean');
      expect(region.psh).toBe(5.5);
      expect(region.deratingFactor).toBe(0.75);
    });
  });

  describe('PreviousMetrics', () => {
    it('should create a valid previous metrics object', () => {
      const metrics: PreviousMetrics = {
        drainWhPerDay: 3500,
        chargeWhPerDay: 4000,
        netBalance: 500,
        daysAutonomy: 2.5,
      };

      expect(metrics.drainWhPerDay).toBe(3500);
      expect(metrics.netBalance).toBe(500);
      expect(metrics.daysAutonomy).toBe(2.5);
    });
  });
});
