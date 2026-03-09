import { describe, it, expect } from 'vitest';
import { computeResults } from '../use-solar-calculation';
import type { Appliance } from '@/lib/solar/types';

const fridge: Appliance = {
  id: 'fridge',
  name: 'Fridge',
  category: 'refrigeration',
  wattsTypical: 60,
  wattsMin: 40,
  wattsMax: 80,
  hoursPerDayAnchor: 24,
  hoursPerDayPassage: 24,
  dutyCycle: 0.4,
  usageType: 'always-on',
  crewScaling: false,
  enabled: true,
};

describe('computeResults', () => {
  it('returns consumption and recommendation', () => {
    const result = computeResults({
      appliances: [fridge],
      crewSize: 2,
      systemVoltage: 12,
      batteryChemistry: 'lifepo4',
      daysAutonomy: 3,
      deratingFactor: 0.75,
      peakSunHours: 4.5,
      alternatorAmps: 75,
      motoringHoursPerDay: 1.5,
    });
    expect(result.consumption.totalWhPerDayAnchor).toBeCloseTo(576);
    expect(result.recommendation.panelWatts.recommended).toBeGreaterThan(0);
    expect(result.recommendation.batteryAh.recommended).toBeGreaterThan(0);
  });

  it('returns zero consumption with no enabled appliances', () => {
    const disabled = { ...fridge, enabled: false };
    const result = computeResults({
      appliances: [disabled],
      crewSize: 2,
      systemVoltage: 12,
      batteryChemistry: 'lifepo4',
      daysAutonomy: 3,
      deratingFactor: 0.75,
      peakSunHours: 4.5,
      alternatorAmps: 75,
      motoringHoursPerDay: 1.5,
    });
    expect(result.consumption.totalWhPerDayAnchor).toBe(0);
  });
});
