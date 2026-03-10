import { describe, it, expect, beforeEach } from 'vitest';
import { useSolarStore, initialState } from '../solar';
import type { DrainEquipment, ChargeEquipment, StoreEquipment, EquipmentInstance } from '@/lib/solar/types';

const makeDrain = (overrides = {}): DrainEquipment => ({
  id: 'drain-1',
  catalogId: null,
  name: 'Test Drain',
  type: 'drain',
  enabled: true,
  origin: 'added',
  notes: '',
  category: 'lighting',
  wattsTypical: 10,
  wattsMin: 5,
  wattsMax: 15,
  hoursPerDayAnchor: 8,
  hoursPerDayPassage: 4,
  dutyCycle: 1,
  crewScaling: false,
  powerType: 'dc',
  ...overrides,
});

const makeCharge = (overrides = {}): ChargeEquipment => ({
  id: 'charge-1',
  catalogId: null,
  name: 'Test Charge',
  type: 'charge',
  enabled: true,
  origin: 'added',
  notes: '',
  sourceType: 'solar',
  panelWatts: 200,
  ...overrides,
});

const makeStore = (overrides = {}): StoreEquipment => ({
  id: 'store-1',
  catalogId: null,
  name: 'Test Store',
  type: 'store',
  enabled: true,
  origin: 'added',
  notes: '',
  chemistry: 'lifepo4',
  capacityAh: 200,
  ...overrides,
});

describe('useSolarStore', () => {
  beforeEach(() => {
    useSolarStore.setState(useSolarStore.getInitialState());
  });

  // --- Default values ---
  describe('defaults', () => {
    it('has default boatName of empty string', () => {
      expect(useSolarStore.getState().boatName).toBe('');
    });

    it('has default templateId of null', () => {
      expect(useSolarStore.getState().templateId).toBeNull();
    });

    it('has default systemVoltage of 12', () => {
      expect(useSolarStore.getState().systemVoltage).toBe(12);
    });

    it('has default acCircuitVoltage of 220', () => {
      expect(useSolarStore.getState().acCircuitVoltage).toBe(220);
    });

    it('has default crewSize of 2', () => {
      expect(useSolarStore.getState().crewSize).toBe(2);
    });

    it('has default viewMode of anchor', () => {
      expect(useSolarStore.getState().viewMode).toBe('anchor');
    });

    it('has default regionName of Mediterranean', () => {
      expect(useSolarStore.getState().regionName).toBe('Mediterranean');
    });

    it('has default empty equipment array', () => {
      expect(useSolarStore.getState().equipment).toEqual([]);
    });
  });

  // --- New field setters ---
  describe('setAcCircuitVoltage', () => {
    it('sets acCircuitVoltage to 110', () => {
      useSolarStore.getState().setAcCircuitVoltage(110);
      expect(useSolarStore.getState().acCircuitVoltage).toBe(110);
    });

    it('sets acCircuitVoltage to 220', () => {
      useSolarStore.getState().setAcCircuitVoltage(110);
      useSolarStore.getState().setAcCircuitVoltage(220);
      expect(useSolarStore.getState().acCircuitVoltage).toBe(220);
    });
  });

  // --- setBoat ---
  describe('setBoat', () => {
    it('sets boatName, templateId, equipment, systemVoltage, and acCircuitVoltage', () => {
      const eq: EquipmentInstance[] = [makeDrain(), makeCharge()];
      useSolarStore.getState().setBoat('tmpl-1', 'My Boat', eq, 24, 110);

      const state = useSolarStore.getState();
      expect(state.templateId).toBe('tmpl-1');
      expect(state.boatName).toBe('My Boat');
      expect(state.equipment).toHaveLength(2);
      expect(state.systemVoltage).toBe(24);
      expect(state.acCircuitVoltage).toBe(110);
    });

    it('replaces existing equipment', () => {
      useSolarStore.getState().addEquipment(makeDrain({ id: 'old-1' }));
      expect(useSolarStore.getState().equipment).toHaveLength(1);

      useSolarStore.getState().setBoat('tmpl-2', 'New Boat', [makeCharge()], 12, 220);
      const state = useSolarStore.getState();
      expect(state.equipment).toHaveLength(1);
      expect(state.equipment[0].id).toBe('charge-1');
    });
  });

  describe('setBoatName', () => {
    it('updates boat name independently', () => {
      useSolarStore.getState().setBoatName('Windchaser');
      expect(useSolarStore.getState().boatName).toBe('Windchaser');
    });
  });

  // --- Equipment CRUD ---
  describe('addEquipment', () => {
    it('appends an item to equipment array', () => {
      useSolarStore.getState().addEquipment(makeDrain());
      expect(useSolarStore.getState().equipment).toHaveLength(1);
      expect(useSolarStore.getState().equipment[0].name).toBe('Test Drain');
    });

    it('appends multiple items', () => {
      useSolarStore.getState().addEquipment(makeDrain({ id: 'd1' }));
      useSolarStore.getState().addEquipment(makeCharge({ id: 'c1' }));
      useSolarStore.getState().addEquipment(makeStore({ id: 's1' }));
      expect(useSolarStore.getState().equipment).toHaveLength(3);
    });
  });

  describe('removeEquipment', () => {
    it('removes item by id', () => {
      useSolarStore.getState().addEquipment(makeDrain({ id: 'd1' }));
      useSolarStore.getState().addEquipment(makeDrain({ id: 'd2' }));
      useSolarStore.getState().removeEquipment('d1');

      const eq = useSolarStore.getState().equipment;
      expect(eq).toHaveLength(1);
      expect(eq[0].id).toBe('d2');
    });

    it('does nothing if id not found', () => {
      useSolarStore.getState().addEquipment(makeDrain());
      useSolarStore.getState().removeEquipment('nonexistent');
      expect(useSolarStore.getState().equipment).toHaveLength(1);
    });
  });

  describe('toggleEquipment', () => {
    it('toggles enabled from true to false', () => {
      useSolarStore.getState().addEquipment(makeDrain({ id: 'd1', enabled: true }));
      useSolarStore.getState().toggleEquipment('d1');
      expect(useSolarStore.getState().equipment[0].enabled).toBe(false);
    });

    it('toggles enabled from false to true', () => {
      useSolarStore.getState().addEquipment(makeDrain({ id: 'd1', enabled: false }));
      useSolarStore.getState().toggleEquipment('d1');
      expect(useSolarStore.getState().equipment[0].enabled).toBe(true);
    });

    it('only toggles the matching item', () => {
      useSolarStore.getState().addEquipment(makeDrain({ id: 'd1', enabled: true }));
      useSolarStore.getState().addEquipment(makeDrain({ id: 'd2', enabled: true }));
      useSolarStore.getState().toggleEquipment('d1');
      expect(useSolarStore.getState().equipment[0].enabled).toBe(false);
      expect(useSolarStore.getState().equipment[1].enabled).toBe(true);
    });
  });

  describe('updateEquipment', () => {
    it('merges updates into matching item', () => {
      useSolarStore.getState().addEquipment(makeDrain({ id: 'd1' }));
      useSolarStore.getState().updateEquipment('d1', { name: 'Updated Drain', wattsTypical: 50 } as Partial<DrainEquipment>);

      const item = useSolarStore.getState().equipment[0] as DrainEquipment;
      expect(item.name).toBe('Updated Drain');
      expect(item.wattsTypical).toBe(50);
      // Other fields unchanged
      expect(item.wattsMin).toBe(5);
    });

    it('does not affect other items', () => {
      useSolarStore.getState().addEquipment(makeDrain({ id: 'd1' }));
      useSolarStore.getState().addEquipment(makeDrain({ id: 'd2', name: 'Second' }));
      useSolarStore.getState().updateEquipment('d1', { name: 'Changed' });
      expect(useSolarStore.getState().equipment[1].name).toBe('Second');
    });
  });

  describe('duplicateEquipment', () => {
    it('copies item with new id and origin=added', () => {
      const original = makeDrain({ id: 'orig-1', origin: 'stock', name: 'Nav Light' });
      useSolarStore.getState().addEquipment(original);
      useSolarStore.getState().duplicateEquipment('orig-1');

      const eq = useSolarStore.getState().equipment;
      expect(eq).toHaveLength(2);
      // Original unchanged
      expect(eq[0].id).toBe('orig-1');
      expect(eq[0].origin).toBe('stock');
      // Copy has new id and origin=added
      expect(eq[1].id).toMatch(/^orig-1-/);
      expect(eq[1].origin).toBe('added');
      expect(eq[1].name).toBe('Nav Light');
    });

    it('does nothing if id not found', () => {
      useSolarStore.getState().addEquipment(makeDrain());
      useSolarStore.getState().duplicateEquipment('nonexistent');
      expect(useSolarStore.getState().equipment).toHaveLength(1);
    });
  });

  describe('setEquipment', () => {
    it('replaces entire equipment array', () => {
      useSolarStore.getState().addEquipment(makeDrain({ id: 'old' }));
      const newItems: EquipmentInstance[] = [
        makeCharge({ id: 'new-1' }),
        makeStore({ id: 'new-2' }),
      ];
      useSolarStore.getState().setEquipment(newItems);

      const eq = useSolarStore.getState().equipment;
      expect(eq).toHaveLength(2);
      expect(eq[0].id).toBe('new-1');
      expect(eq[1].id).toBe('new-2');
    });

    it('can set to empty array', () => {
      useSolarStore.getState().addEquipment(makeDrain());
      useSolarStore.getState().setEquipment([]);
      expect(useSolarStore.getState().equipment).toEqual([]);
    });
  });

  // --- v4 fields ---
  describe('v4 fields', () => {
    it('has default wizardComplete of false', () => {
      expect(useSolarStore.getState().wizardComplete).toBe(false);
    });

    it('has default cruisingStyle of coastal', () => {
      expect(useSolarStore.getState().cruisingStyle).toBe('coastal');
    });

    it('has default boatType of mono', () => {
      expect(useSolarStore.getState().boatType).toBe('mono');
    });

    it('has default boatLengthFt of 40', () => {
      expect(useSolarStore.getState().boatLengthFt).toBe(40);
    });

    it('has default monthlyIrradiance of empty array', () => {
      expect(useSolarStore.getState().monthlyIrradiance).toEqual([]);
    });

    it('has default previousMetrics of null', () => {
      expect(useSolarStore.getState().previousMetrics).toBeNull();
    });

    it('setWizardComplete sets to true', () => {
      useSolarStore.getState().setWizardComplete();
      expect(useSolarStore.getState().wizardComplete).toBe(true);
    });

    it('setCruisingStyle sets to offshore', () => {
      useSolarStore.getState().setCruisingStyle('offshore');
      expect(useSolarStore.getState().cruisingStyle).toBe('offshore');
    });

    it('setBoatType sets to cat', () => {
      useSolarStore.getState().setBoatType('cat');
      expect(useSolarStore.getState().boatType).toBe('cat');
    });

    it('setBoatLengthFt sets to 45', () => {
      useSolarStore.getState().setBoatLengthFt(45);
      expect(useSolarStore.getState().boatLengthFt).toBe(45);
    });

    it('setMonthlyIrradiance sets data', () => {
      const data = [
        { month: 1, horizontalIrradiance: 3.5, optimalIrradiance: 4.2, temperature: 12 },
        { month: 2, horizontalIrradiance: 4.1, optimalIrradiance: 4.8, temperature: 14 },
      ];
      useSolarStore.getState().setMonthlyIrradiance(data);
      expect(useSolarStore.getState().monthlyIrradiance).toEqual(data);
    });

    it('snapshotMetrics creates correct PreviousMetrics object', () => {
      useSolarStore.getState().snapshotMetrics(100, 150, 50, 2.5);
      expect(useSolarStore.getState().previousMetrics).toEqual({
        drainWhPerDay: 100,
        chargeWhPerDay: 150,
        netBalance: 50,
        daysAutonomy: 2.5,
      });
    });

    it('resetToTemplate clears equipment, resets cruisingStyle, sets wizardComplete false', () => {
      // Set up some state first
      useSolarStore.getState().addEquipment(makeDrain({ id: 'd1' }));
      useSolarStore.getState().setCruisingStyle('offshore');
      useSolarStore.getState().setWizardComplete();
      useSolarStore.getState().setBoatType('cat');
      useSolarStore.getState().setBoatLengthFt(55);
      useSolarStore.getState().setMonthlyIrradiance([
        { month: 1, horizontalIrradiance: 3.5, optimalIrradiance: 4.2, temperature: 12 },
      ]);
      useSolarStore.getState().snapshotMetrics(100, 150, 50, 2.5);

      useSolarStore.getState().resetToTemplate();

      const state = useSolarStore.getState();
      expect(state.equipment).toEqual([]);
      expect(state.cruisingStyle).toBe('coastal');
      expect(state.wizardComplete).toBe(false);
      expect(state.boatType).toBe('mono');
      expect(state.boatLengthFt).toBe(40);
      expect(state.monthlyIrradiance).toEqual([]);
      expect(state.previousMetrics).toBeNull();
    });
  });

  // --- Legacy actions still work ---
  describe('legacy actions', () => {
    it('toggleAppliance still works', () => {
      const appliance = {
        id: 'test-1',
        name: 'Test',
        category: 'navigation',
        wattsTypical: 25,
        wattsMin: 15,
        wattsMax: 40,
        hoursPerDayAnchor: 4,
        hoursPerDayPassage: 8,
        dutyCycle: 1.0,
        usageType: 'intermittent' as const,
        crewScaling: false,
        enabled: true,
        origin: 'stock' as const,
      };
      useSolarStore.getState().setAppliances([appliance]);
      useSolarStore.getState().toggleAppliance('test-1');
      expect(useSolarStore.getState().appliances[0].enabled).toBe(false);
    });

    it('setBoatModelId still works', () => {
      useSolarStore.getState().setBoatModelId('some-uuid');
      expect(useSolarStore.getState().boatModelId).toBe('some-uuid');
    });

    it('setLocation still works', () => {
      useSolarStore.getState().setLocation(40.0, -3.7, 'Spain');
      const state = useSolarStore.getState();
      expect(state.latitude).toBe(40.0);
      expect(state.longitude).toBe(-3.7);
      expect(state.regionName).toBe('Spain');
    });
  });
});
