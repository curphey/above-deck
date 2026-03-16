import type { Appliance, ConsumptionResult } from './types';

export function calculateConsumption(
  appliances: Appliance[],
  crewSize: number,
  systemVoltage: number
): ConsumptionResult {
  const breakdownByCategory: Record<string, { anchor: number; passage: number }> = {};
  let totalWhAnchor = 0;
  let totalWhPassage = 0;

  for (const app of appliances) {
    if (!app.enabled) continue;

    const crewMultiplier = app.crewScaling ? crewSize / 2 : 1;

    const whAnchor = app.wattsTypical * app.hoursPerDayAnchor * app.dutyCycle * crewMultiplier;
    const whPassage = app.wattsTypical * app.hoursPerDayPassage * app.dutyCycle * crewMultiplier;

    totalWhAnchor += whAnchor;
    totalWhPassage += whPassage;

    if (!breakdownByCategory[app.category]) {
      breakdownByCategory[app.category] = { anchor: 0, passage: 0 };
    }
    breakdownByCategory[app.category].anchor += whAnchor;
    breakdownByCategory[app.category].passage += whPassage;
  }

  return {
    totalWhPerDayAnchor: totalWhAnchor,
    totalWhPerDayPassage: totalWhPassage,
    totalAhPerDayAnchor: totalWhAnchor / systemVoltage,
    totalAhPerDayPassage: totalWhPassage / systemVoltage,
    breakdownByCategory,
  };
}
