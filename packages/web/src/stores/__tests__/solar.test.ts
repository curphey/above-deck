import { describe, it, expect, beforeEach } from 'vitest';
import { useSolarStore } from '../solar';

describe('useSolarStore', () => {
  beforeEach(() => {
    useSolarStore.setState(useSolarStore.getInitialState());
  });

  it('has default crew size of 2', () => {
    expect(useSolarStore.getState().crewSize).toBe(2);
  });

  it('has default system voltage of 12', () => {
    expect(useSolarStore.getState().systemVoltage).toBe(12);
  });

  it('has default battery chemistry of lifepo4', () => {
    expect(useSolarStore.getState().batteryChemistry).toBe('lifepo4');
  });

  it('sets crew size', () => {
    useSolarStore.getState().setCrewSize(4);
    expect(useSolarStore.getState().crewSize).toBe(4);
  });

  it('toggles an appliance on/off', () => {
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

  it('updates appliance hours', () => {
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
    useSolarStore.getState().updateApplianceHours('test-1', 'anchor', 10);
    expect(useSolarStore.getState().appliances[0].hoursPerDayAnchor).toBe(10);
  });

  it('sets boat model ID', () => {
    useSolarStore.getState().setBoatModelId('some-uuid');
    expect(useSolarStore.getState().boatModelId).toBe('some-uuid');
  });

  it('sets location', () => {
    useSolarStore.getState().setLocation(36.0, 14.5, 'Mediterranean');
    expect(useSolarStore.getState().latitude).toBe(36.0);
    expect(useSolarStore.getState().longitude).toBe(14.5);
    expect(useSolarStore.getState().regionName).toBe('Mediterranean');
  });

  it('has default Mediterranean location', () => {
    const state = useSolarStore.getState();
    expect(state.latitude).toBe(36.0);
    expect(state.longitude).toBe(14.5);
    expect(state.regionName).toBe('Mediterranean');
  });

  it('tracks view mode (anchor/passage)', () => {
    useSolarStore.getState().setViewMode('passage');
    expect(useSolarStore.getState().viewMode).toBe('passage');
  });

  it('sets battery chemistry', () => {
    useSolarStore.getState().setBatteryChemistry('agm');
    expect(useSolarStore.getState().batteryChemistry).toBe('agm');
  });

  it('sets system voltage', () => {
    useSolarStore.getState().setSystemVoltage(24);
    expect(useSolarStore.getState().systemVoltage).toBe(24);
  });

  it('sets days of autonomy', () => {
    useSolarStore.getState().setDaysAutonomy(5);
    expect(useSolarStore.getState().daysAutonomy).toBe(5);
  });

  it('sets alternator amps', () => {
    useSolarStore.getState().setAlternatorAmps(100);
    expect(useSolarStore.getState().alternatorAmps).toBe(100);
  });

  it('sets motoring hours per day', () => {
    useSolarStore.getState().setMotoringHoursPerDay(3);
    expect(useSolarStore.getState().motoringHoursPerDay).toBe(3);
  });

  it('defaults journeyType to plan', () => {
    expect(useSolarStore.getState().journeyType).toBe('plan');
  });

  it('sets journeyType to check', () => {
    useSolarStore.getState().setJourneyType('check');
    expect(useSolarStore.getState().journeyType).toBe('check');
  });

  it('defaults shorePowerHoursPerDay to 0', () => {
    expect(useSolarStore.getState().shorePowerHoursPerDay).toBe(0);
  });

  it('sets shorePowerHoursPerDay to 2.5', () => {
    useSolarStore.getState().setShorePowerHoursPerDay(2.5);
    expect(useSolarStore.getState().shorePowerHoursPerDay).toBe(2.5);
  });

  it('defaults shoreChargerAmps to 30', () => {
    expect(useSolarStore.getState().shoreChargerAmps).toBe(30);
  });

  it('sets shoreChargerAmps', () => {
    useSolarStore.getState().setShoreChargerAmps(50);
    expect(useSolarStore.getState().shoreChargerAmps).toBe(50);
  });

  it('defaults batteryBankAh to 0', () => {
    expect(useSolarStore.getState().batteryBankAh).toBe(0);
  });

  it('sets batteryBankAh to 400', () => {
    useSolarStore.getState().setBatteryBankAh(400);
    expect(useSolarStore.getState().batteryBankAh).toBe(400);
  });

  it('should not have shorepower field', () => {
    const state = useSolarStore.getState();
    expect('shorepower' in state).toBe(false);
  });

  it('sets derating factor', () => {
    useSolarStore.getState().setDeratingFactor(0.6);
    expect(useSolarStore.getState().deratingFactor).toBe(0.6);
  });

  it('should set solarPanelWatts', () => {
    useSolarStore.getState().setSolarPanelWatts(400);
    expect(useSolarStore.getState().solarPanelWatts).toBe(400);
  });

  it('should set panelType', () => {
    useSolarStore.getState().setPanelType('semi-flexible');
    expect(useSolarStore.getState().panelType).toBe('semi-flexible');
  });

  it('should not have cruisingStyle', () => {
    const state = useSolarStore.getState();
    expect('cruisingStyle' in state).toBe(false);
  });

  it('should set appliance origin field', () => {
    const appliance = {
      id: '1', name: 'Test', category: 'navigation',
      wattsTypical: 10, wattsMin: 5, wattsMax: 15,
      hoursPerDayAnchor: 1, hoursPerDayPassage: 1,
      dutyCycle: 1, usageType: 'always-on' as const,
      crewScaling: false, enabled: true, origin: 'stock' as const,
    };
    useSolarStore.getState().setAppliances([appliance]);
    expect(useSolarStore.getState().appliances[0].origin).toBe('stock');
  });

  it('should remove appliance by id', () => {
    const a1 = {
      id: '1', name: 'A', category: 'navigation',
      wattsTypical: 10, wattsMin: 5, wattsMax: 15,
      hoursPerDayAnchor: 1, hoursPerDayPassage: 1,
      dutyCycle: 1, usageType: 'always-on' as const,
      crewScaling: false, enabled: true, origin: 'catalog' as const,
    };
    const a2 = { ...a1, id: '2', name: 'B', origin: 'stock' as const };
    useSolarStore.getState().setAppliances([a1, a2]);
    useSolarStore.getState().removeAppliance('1');
    expect(useSolarStore.getState().appliances).toHaveLength(1);
    expect(useSolarStore.getState().appliances[0].id).toBe('2');
  });

  it('should update appliance watts', () => {
    const appliance = {
      id: '1', name: 'Test', category: 'navigation',
      wattsTypical: 10, wattsMin: 5, wattsMax: 15,
      hoursPerDayAnchor: 1, hoursPerDayPassage: 1,
      dutyCycle: 1, usageType: 'always-on' as const,
      crewScaling: false, enabled: true, origin: 'stock' as const,
    };
    useSolarStore.getState().setAppliances([appliance]);
    useSolarStore.getState().updateApplianceWatts('1', 25);
    expect(useSolarStore.getState().appliances[0].wattsTypical).toBe(25);
  });
});
