import { describe, it, expect } from 'vitest';
import { calculateDailyCharging } from '../charging';

describe('calculateDailyCharging', () => {
  it('should calculate solar input from panels + region + derating', () => {
    const result = calculateDailyCharging({
      solarPanelWatts: 400, panelType: 'rigid', peakSunHours: 5,
      deratingFactor: 0.75, alternatorAmps: 80, motoringHoursPerDay: 1.5,
      systemVoltage: 12, shorePowerHoursPerDay: 0, shoreChargerAmps: 30,
    });
    // 400 * 5 * 0.75 * 1.0 = 1500 Wh solar
    expect(result.solarWhPerDay).toBe(1500);
  });

  it('should apply panel type derating', () => {
    const rigid = calculateDailyCharging({
      solarPanelWatts: 400, panelType: 'rigid', peakSunHours: 5,
      deratingFactor: 0.75, alternatorAmps: 0, motoringHoursPerDay: 0,
      systemVoltage: 12, shorePowerHoursPerDay: 0, shoreChargerAmps: 30,
    });
    const flexible = calculateDailyCharging({
      solarPanelWatts: 400, panelType: 'flexible', peakSunHours: 5,
      deratingFactor: 0.75, alternatorAmps: 0, motoringHoursPerDay: 0,
      systemVoltage: 12, shorePowerHoursPerDay: 0, shoreChargerAmps: 30,
    });
    expect(flexible.solarWhPerDay).toBeLessThan(rigid.solarWhPerDay);
  });

  it('should calculate alternator input', () => {
    const result = calculateDailyCharging({
      solarPanelWatts: 0, panelType: 'rigid', peakSunHours: 5,
      deratingFactor: 0.75, alternatorAmps: 80, motoringHoursPerDay: 2,
      systemVoltage: 12, shorePowerHoursPerDay: 0, shoreChargerAmps: 30,
    });
    // 80A * 2h * 0.7 efficiency * 12V = 1344 Wh
    expect(result.alternatorWhPerDay).toBe(1344);
  });

  it('should sum total daily charging', () => {
    const result = calculateDailyCharging({
      solarPanelWatts: 400, panelType: 'rigid', peakSunHours: 5,
      deratingFactor: 0.75, alternatorAmps: 80, motoringHoursPerDay: 1.5,
      systemVoltage: 12, shorePowerHoursPerDay: 0, shoreChargerAmps: 30,
    });
    expect(result.totalWhPerDay).toBe(result.solarWhPerDay + result.alternatorWhPerDay);
  });

  it('should return zero solar when no panels', () => {
    const result = calculateDailyCharging({
      solarPanelWatts: 0, panelType: 'rigid', peakSunHours: 5,
      deratingFactor: 0.75, alternatorAmps: 0, motoringHoursPerDay: 0,
      systemVoltage: 12, shorePowerHoursPerDay: 0, shoreChargerAmps: 30,
    });
    expect(result.totalWhPerDay).toBe(0);
  });

  it('should calculate shore power Wh from hours and charger amps', () => {
    const result = calculateDailyCharging({
      solarPanelWatts: 0, panelType: 'rigid', peakSunHours: 5,
      deratingFactor: 0.75, alternatorAmps: 0, motoringHoursPerDay: 0,
      systemVoltage: 12, shorePowerHoursPerDay: 2.5, shoreChargerAmps: 30,
    });
    // 30A * 12V * 2.5h = 900 Wh
    expect(result.shoreWhPerDay).toBe(900);
    expect(result.totalWhPerDay).toBe(900);
  });

  it('should return zero shore power when hours is zero', () => {
    const result = calculateDailyCharging({
      solarPanelWatts: 0, panelType: 'rigid', peakSunHours: 5,
      deratingFactor: 0.75, alternatorAmps: 0, motoringHoursPerDay: 0,
      systemVoltage: 12, shorePowerHoursPerDay: 0, shoreChargerAmps: 30,
    });
    expect(result.shoreWhPerDay).toBe(0);
  });
});
