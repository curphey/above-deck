import { describe, it, expect, beforeEach } from 'vitest';
import { useSolarStore } from '../solar';

describe('useSolarStore', () => {
  beforeEach(() => {
    useSolarStore.setState(useSolarStore.getInitialState());
  });

  it('has default journey mode of new-system', () => {
    expect(useSolarStore.getState().journeyMode).toBe('new-system');
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

  it('sets journey mode', () => {
    useSolarStore.getState().setJourneyMode('check-existing');
    expect(useSolarStore.getState().journeyMode).toBe('check-existing');
  });

  it('sets crew size', () => {
    useSolarStore.getState().setCrewSize(4);
    expect(useSolarStore.getState().crewSize).toBe(4);
  });

  it('sets cruising style', () => {
    useSolarStore.getState().setCruisingStyle('offshore');
    expect(useSolarStore.getState().cruisingStyle).toBe('offshore');
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

  it('sets shorepower', () => {
    useSolarStore.getState().setShorepower('sometimes');
    expect(useSolarStore.getState().shorepower).toBe('sometimes');
  });

  it('sets derating factor', () => {
    useSolarStore.getState().setDeratingFactor(0.6);
    expect(useSolarStore.getState().deratingFactor).toBe(0.6);
  });
});
