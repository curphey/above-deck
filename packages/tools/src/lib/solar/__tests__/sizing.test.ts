import { describe, it, expect } from 'vitest';
import { calculateRecommendation } from '../sizing';

describe('calculateRecommendation', () => {
  it('recommends solar panels based on consumption and sun hours', () => {
    const result = calculateRecommendation({
      dailyConsumptionWh: 1500,
      peakSunHours: 5.5,
      deratingFactor: 0.75,
      batteryChemistry: 'lifepo4',
      systemVoltage: 12,
      daysAutonomy: 2,
      alternatorAmps: 80,
      motoringHoursPerDay: 2,
      hasAcLoads: true,
      maxAcLoadWatts: 1000,
    });

    // 1500 / (5.5 * 0.75) = 364W minimum
    expect(result.panelWatts.minimum).toBeCloseTo(364, -1);
    expect(result.panelWatts.recommended).toBeGreaterThan(result.panelWatts.minimum);
    expect(result.panelWatts.comfortable).toBeGreaterThan(result.panelWatts.recommended);
  });

  it('sizes battery bank for LiFePO4 at 80% DoD', () => {
    const result = calculateRecommendation({
      dailyConsumptionWh: 1200,
      peakSunHours: 5,
      deratingFactor: 0.75,
      batteryChemistry: 'lifepo4',
      systemVoltage: 12,
      daysAutonomy: 2,
      alternatorAmps: 80,
      motoringHoursPerDay: 2,
      hasAcLoads: false,
      maxAcLoadWatts: 0,
    });

    // 1200Wh/day / 12V = 100Ah/day. 2 days at 80% DoD = 100 * 2 / 0.8 = 250Ah
    expect(result.batteryAh.minimum).toBeCloseTo(250, -1);
  });

  it('sizes battery bank for AGM at 50% DoD', () => {
    const result = calculateRecommendation({
      dailyConsumptionWh: 1200,
      peakSunHours: 5,
      deratingFactor: 0.75,
      batteryChemistry: 'agm',
      systemVoltage: 12,
      daysAutonomy: 2,
      alternatorAmps: 80,
      motoringHoursPerDay: 2,
      hasAcLoads: false,
      maxAcLoadWatts: 0,
    });

    // 100Ah/day * 2 days / 0.5 DoD = 400Ah
    expect(result.batteryAh.minimum).toBeCloseTo(400, -1);
  });

  it('recommends smart regulator for LiFePO4', () => {
    const result = calculateRecommendation({
      dailyConsumptionWh: 1200,
      peakSunHours: 5,
      deratingFactor: 0.75,
      batteryChemistry: 'lifepo4',
      systemVoltage: 12,
      daysAutonomy: 2,
      alternatorAmps: 80,
      motoringHoursPerDay: 2,
      hasAcLoads: false,
      maxAcLoadWatts: 0,
    });

    expect(result.needsSmartRegulator).toBe(true);
  });

  it('includes inverter recommendation when AC loads exist', () => {
    const result = calculateRecommendation({
      dailyConsumptionWh: 1200,
      peakSunHours: 5,
      deratingFactor: 0.75,
      batteryChemistry: 'lifepo4',
      systemVoltage: 12,
      daysAutonomy: 2,
      alternatorAmps: 80,
      motoringHoursPerDay: 2,
      hasAcLoads: true,
      maxAcLoadWatts: 1000,
    });

    expect(result.inverterWatts).toBeGreaterThanOrEqual(1000);
  });

  it('calculates alternator daily contribution', () => {
    const result = calculateRecommendation({
      dailyConsumptionWh: 1200,
      peakSunHours: 5,
      deratingFactor: 0.75,
      batteryChemistry: 'lifepo4',
      systemVoltage: 12,
      daysAutonomy: 2,
      alternatorAmps: 80,
      motoringHoursPerDay: 2,
      hasAcLoads: false,
      maxAcLoadWatts: 0,
    });

    // 80A * 2h * 0.7 efficiency = 112 Ah
    expect(result.alternatorDailyAh).toBeCloseTo(112, -1);
  });
});
