import { describe, it, expect } from 'vitest';
import {
  CRUISING_ZONES, TRANSIT_WINDOWS, MONTH_NAMES,
  isMonthSafe, isMonthDangerous, getMonthStatus,
} from '../cruising-seasons';

describe('cruising-seasons', () => {
  it('has 7 cruising zones', () => {
    expect(CRUISING_ZONES).toHaveLength(7);
  });

  it('has 8 transit windows', () => {
    expect(TRANSIT_WINDOWS).toHaveLength(8);
  });

  it('each zone has valid month arrays', () => {
    for (const zone of CRUISING_ZONES) {
      expect(zone.safeMonths.length).toBeGreaterThan(0);
      expect(zone.dangerMonths.length).toBeGreaterThan(0);
      for (const m of [...zone.safeMonths, ...zone.dangerMonths]) {
        expect(m).toBeGreaterThanOrEqual(1);
        expect(m).toBeLessThanOrEqual(12);
      }
    }
  });

  it('no month is both safe and dangerous in the same zone', () => {
    for (const zone of CRUISING_ZONES) {
      const overlap = zone.safeMonths.filter(m => zone.dangerMonths.includes(m));
      expect(overlap).toEqual([]);
    }
  });

  it('each zone has a closed polygon', () => {
    for (const zone of CRUISING_ZONES) {
      const first = zone.polygon[0];
      const last = zone.polygon[zone.polygon.length - 1];
      expect(first[0]).toBe(last[0]);
      expect(first[1]).toBe(last[1]);
    }
  });

  it('Caribbean is safe Dec-May, dangerous Jun-Nov', () => {
    const atlantic = CRUISING_ZONES.find(z => z.id === 'north-atlantic-hurricane')!;
    expect(isMonthSafe(atlantic, 12)).toBe(true);
    expect(isMonthSafe(atlantic, 1)).toBe(true);
    expect(isMonthDangerous(atlantic, 8)).toBe(true);
    expect(isMonthDangerous(atlantic, 9)).toBe(true);
  });

  it('South Pacific cyclone zone safe May-Oct', () => {
    const sp = CRUISING_ZONES.find(z => z.id === 'south-pacific-cyclone')!;
    expect(isMonthSafe(sp, 7)).toBe(true);
    expect(isMonthDangerous(sp, 1)).toBe(true);
  });

  it('getMonthStatus returns correct values', () => {
    const atlantic = CRUISING_ZONES.find(z => z.id === 'north-atlantic-hurricane')!;
    expect(getMonthStatus(atlantic, 1)).toBe('safe');
    expect(getMonthStatus(atlantic, 8)).toBe('danger');
  });

  it('transit windows have valid coordinates', () => {
    for (const tw of TRANSIT_WINDOWS) {
      expect(tw.from).toHaveLength(2);
      expect(tw.to).toHaveLength(2);
      expect(tw.bestMonths.length).toBeGreaterThan(0);
    }
  });

  it('ARC crossing is Nov-Feb', () => {
    const arc = TRANSIT_WINDOWS.find(t => t.id === 'atlantic-crossing-east-west')!;
    expect(arc.bestMonths).toEqual([11, 12, 1, 2]);
  });

  it('MONTH_NAMES has 12 entries', () => {
    expect(MONTH_NAMES).toHaveLength(12);
    expect(MONTH_NAMES[0]).toBe('Jan');
    expect(MONTH_NAMES[11]).toBe('Dec');
  });
});
