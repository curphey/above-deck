import { describe, it, expect } from 'vitest';
import { calculateDailyCharging } from '../charging';

describe('calculateDailyCharging', () => {
  it('should calculate solar input from panels + region + derating', () => {
    const result = calculateDailyCharging({
      solarPanelWatts: 400, panelType: 'rigid', peakSunHours: 5,
      deratingFactor: 0.75, alternatorAmps: 80, motoringHoursPerDay: 1.5,
      systemVoltage: 12, shorepower: 'no',
    });
    // 400 * 5 * 0.75 * 1.0 = 1500 Wh solar
    expect(result.solarWhPerDay).toBe(1500);
  });

  it('should apply panel type derating', () => {
    const rigid = calculateDailyCharging({
      solarPanelWatts: 400, panelType: 'rigid', peakSunHours: 5,
      deratingFactor: 0.75, alternatorAmps: 0, motoringHoursPerDay: 0,
      systemVoltage: 12, shorepower: 'no',
    });
    const flexible = calculateDailyCharging({
      solarPanelWatts: 400, panelType: 'flexible', peakSunHours: 5,
      deratingFactor: 0.75, alternatorAmps: 0, motoringHoursPerDay: 0,
      systemVoltage: 12, shorepower: 'no',
    });
    expect(flexible.solarWhPerDay).toBeLessThan(rigid.solarWhPerDay);
  });

  it('should calculate alternator input', () => {
    const result = calculateDailyCharging({
      solarPanelWatts: 0, panelType: 'rigid', peakSunHours: 5,
      deratingFactor: 0.75, alternatorAmps: 80, motoringHoursPerDay: 2,
      systemVoltage: 12, shorepower: 'no',
    });
    // 80A * 2h * 0.7 efficiency * 12V = 1344 Wh
    expect(result.alternatorWhPerDay).toBe(1344);
  });

  it('should sum total daily charging', () => {
    const result = calculateDailyCharging({
      solarPanelWatts: 400, panelType: 'rigid', peakSunHours: 5,
      deratingFactor: 0.75, alternatorAmps: 80, motoringHoursPerDay: 1.5,
      systemVoltage: 12, shorepower: 'no',
    });
    expect(result.totalWhPerDay).toBe(result.solarWhPerDay + result.alternatorWhPerDay);
  });

  it('should return zero solar when no panels', () => {
    const result = calculateDailyCharging({
      solarPanelWatts: 0, panelType: 'rigid', peakSunHours: 5,
      deratingFactor: 0.75, alternatorAmps: 0, motoringHoursPerDay: 0,
      systemVoltage: 12, shorepower: 'no',
    });
    expect(result.totalWhPerDay).toBe(0);
  });
});
