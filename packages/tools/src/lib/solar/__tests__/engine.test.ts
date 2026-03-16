import { describe, it, expect } from 'vitest';
import { calculateConsumption } from '../engine';
import type { Appliance } from '../types';

const mockFridge: Appliance = {
  id: '1', name: 'Small fridge', category: 'refrigeration',
  wattsTypical: 37, wattsMin: 30, wattsMax: 45,
  hoursPerDayAnchor: 24, hoursPerDayPassage: 24,
  dutyCycle: 0.4, usageType: 'always-on', crewScaling: false, enabled: true,
};

const mockAutopilot: Appliance = {
  id: '2', name: 'Autopilot', category: 'navigation',
  wattsTypical: 42, wattsMin: 24, wattsMax: 60,
  hoursPerDayAnchor: 0, hoursPerDayPassage: 20,
  dutyCycle: 1.0, usageType: 'scheduled', crewScaling: false, enabled: true,
};

const mockWaterPump: Appliance = {
  id: '3', name: 'Water pump', category: 'water-systems',
  wattsTypical: 48, wattsMin: 36, wattsMax: 60,
  hoursPerDayAnchor: 0.5, hoursPerDayPassage: 0.25,
  dutyCycle: 1.0, usageType: 'intermittent', crewScaling: true, enabled: true,
};

describe('calculateConsumption', () => {
  it('calculates fridge consumption with duty cycle', () => {
    const result = calculateConsumption([mockFridge], 2, 12);
    // 37W * 24h * 0.4 duty = 355.2 Wh
    expect(result.totalWhPerDayAnchor).toBeCloseTo(355.2, 0);
    expect(result.totalWhPerDayPassage).toBeCloseTo(355.2, 0);
  });

  it('calculates passage-only loads correctly', () => {
    const result = calculateConsumption([mockAutopilot], 2, 12);
    expect(result.totalWhPerDayAnchor).toBe(0);
    // 42W * 20h * 1.0 = 840 Wh
    expect(result.totalWhPerDayPassage).toBeCloseTo(840, 0);
  });

  it('scales crew-dependent loads', () => {
    const result2 = calculateConsumption([mockWaterPump], 2, 12);
    const result4 = calculateConsumption([mockWaterPump], 4, 12);
    expect(result4.totalWhPerDayAnchor).toBeGreaterThan(result2.totalWhPerDayAnchor);
  });

  it('converts Wh to Ah correctly', () => {
    const result = calculateConsumption([mockFridge], 2, 12);
    expect(result.totalAhPerDayAnchor).toBeCloseTo(355.2 / 12, 0);
  });

  it('groups consumption by category', () => {
    const result = calculateConsumption([mockFridge, mockAutopilot], 2, 12);
    expect(result.breakdownByCategory['refrigeration']).toBeDefined();
    expect(result.breakdownByCategory['navigation']).toBeDefined();
  });

  it('ignores disabled appliances', () => {
    const disabled = { ...mockFridge, enabled: false };
    const result = calculateConsumption([disabled], 2, 12);
    expect(result.totalWhPerDayAnchor).toBe(0);
  });
});
