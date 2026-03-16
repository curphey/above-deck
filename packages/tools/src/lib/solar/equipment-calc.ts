import type { DrainEquipment, ChargeEquipment, StoreEquipment, PanelType } from './types';

// --- Constants ---

export const INVERTER_EFFICIENCY = 0.85;
export const ALTERNATOR_EFFICIENCY = 0.7;
export const DOD: Record<string, number> = { agm: 0.5, lifepo4: 0.8 };
export const PANEL_FACTOR: Record<PanelType, number> = {
  rigid: 1.0,
  'semi-flexible': 0.9,
  flexible: 0.85,
};

// --- Result types ---

export interface DrainResult {
  totalWhPerDay: number;
  breakdownByCategory: Record<string, number>;
}

export interface ChargeContext {
  peakSunHours: number;
  deratingFactor: number;
  systemVoltage: number;
  acCircuitVoltage: number;
}

export interface ChargeResult {
  totalWhPerDay: number;
  solarWhPerDay: number;
  alternatorWhPerDay: number;
  shoreWhPerDay: number;
}

export interface StorageResult {
  totalCapacityAh: number;
  totalUsableWh: number;
  daysAutonomy: number;
}

// --- Functions ---

export function calculateDrainFromEquipment(
  items: DrainEquipment[],
  viewMode: 'anchor' | 'passage',
  crewSize: number,
): DrainResult {
  const breakdownByCategory: Record<string, number> = {};
  let totalWhPerDay = 0;

  for (const item of items) {
    if (!item.enabled) continue;

    const hours = viewMode === 'anchor' ? item.hoursPerDayAnchor : item.hoursPerDayPassage;
    const crewMultiplier = item.crewScaling ? crewSize / 2 : 1;
    const inverterFactor = item.powerType === 'ac' ? 1 / INVERTER_EFFICIENCY : 1;
    const wh = Math.round(item.wattsTypical * hours * item.dutyCycle * crewMultiplier * inverterFactor);

    totalWhPerDay += wh;
    breakdownByCategory[item.category] = (breakdownByCategory[item.category] ?? 0) + wh;
  }

  return { totalWhPerDay, breakdownByCategory };
}

export function calculateChargeFromEquipment(
  items: ChargeEquipment[],
  ctx: ChargeContext,
): ChargeResult {
  let solarWhPerDay = 0;
  let alternatorWhPerDay = 0;
  let shoreWhPerDay = 0;

  for (const item of items) {
    if (!item.enabled) continue;

    switch (item.sourceType) {
      case 'solar': {
        const panelFactor = PANEL_FACTOR[item.panelType ?? 'rigid'];
        solarWhPerDay += Math.round(
          (item.panelWatts ?? 0) * ctx.peakSunHours * ctx.deratingFactor * panelFactor,
        );
        break;
      }
      case 'alternator': {
        alternatorWhPerDay += Math.round(
          (item.alternatorAmps ?? 0) * ctx.systemVoltage * (item.motoringHoursPerDay ?? 0) * ALTERNATOR_EFFICIENCY,
        );
        break;
      }
      case 'shore': {
        shoreWhPerDay += Math.round(
          (item.shoreChargerAmps ?? 0) * ctx.systemVoltage * (item.shoreHoursPerDay ?? 0),
        );
        break;
      }
    }
  }

  return {
    totalWhPerDay: solarWhPerDay + alternatorWhPerDay + shoreWhPerDay,
    solarWhPerDay,
    alternatorWhPerDay,
    shoreWhPerDay,
  };
}

export function calculateStorageFromEquipment(
  items: StoreEquipment[],
  systemVoltage: number,
  dailyDrainWh?: number,
): StorageResult {
  let totalCapacityAh = 0;
  let totalUsableWh = 0;

  for (const item of items) {
    if (!item.enabled) continue;

    totalCapacityAh += item.capacityAh;
    totalUsableWh += item.capacityAh * systemVoltage * (DOD[item.chemistry] ?? 0.5);
  }

  const daysAutonomy =
    dailyDrainWh === undefined
      ? 0
      : dailyDrainWh === 0
        ? Infinity
        : totalUsableWh / dailyDrainWh;

  return { totalCapacityAh, totalUsableWh, daysAutonomy };
}
