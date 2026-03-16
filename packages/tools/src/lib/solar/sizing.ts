import type { SolarRecommendation } from './types';

interface SizingInput {
  dailyConsumptionWh: number;
  peakSunHours: number;
  deratingFactor: number;
  batteryChemistry: 'agm' | 'lifepo4';
  systemVoltage: number;
  daysAutonomy: number;
  alternatorAmps: number;
  motoringHoursPerDay: number;
  hasAcLoads: boolean;
  maxAcLoadWatts: number;
}

const DOD = { agm: 0.5, lifepo4: 0.8 } as const;
const ALTERNATOR_EFFICIENCY = 0.7;

export function calculateRecommendation(input: SizingInput): SolarRecommendation {
  const {
    dailyConsumptionWh, peakSunHours, deratingFactor,
    batteryChemistry, systemVoltage, daysAutonomy,
    alternatorAmps, motoringHoursPerDay, hasAcLoads, maxAcLoadWatts,
  } = input;

  const effectiveSunHours = peakSunHours * deratingFactor;
  const minPanelWatts = dailyConsumptionWh / effectiveSunHours;

  const dailyAh = dailyConsumptionWh / systemVoltage;
  const dod = DOD[batteryChemistry];
  const minBatteryAh = (dailyAh * daysAutonomy) / dod;

  const mpptAmps = Math.ceil((minPanelWatts * 1.25) / systemVoltage);

  const alternatorDailyAh = alternatorAmps * motoringHoursPerDay * ALTERNATOR_EFFICIENCY;

  const inverterSizes = [500, 1000, 1500, 2000, 3000];
  const inverterWatts = hasAcLoads
    ? inverterSizes.find(s => s >= maxAcLoadWatts) ?? maxAcLoadWatts
    : null;

  const maxCurrent = (minPanelWatts * 1.25) / systemVoltage;
  const wireGauge = maxCurrent > 60 ? '2 AWG' : maxCurrent > 40 ? '4 AWG' :
    maxCurrent > 25 ? '6 AWG' : maxCurrent > 15 ? '8 AWG' : '10 AWG';

  const dailyGenerationWh = minPanelWatts * effectiveSunHours;

  return {
    panelWatts: {
      minimum: Math.round(minPanelWatts),
      recommended: Math.round(minPanelWatts * 1.25),
      comfortable: Math.round(minPanelWatts * 1.5),
    },
    batteryAh: {
      minimum: Math.round(minBatteryAh),
      recommended: Math.round(minBatteryAh * 1.25),
      comfortable: Math.round(minBatteryAh * 1.5),
    },
    batteryCount: Math.ceil(minBatteryAh / 100),
    mpptAmps,
    mpptMaxVoltage: 100,
    inverterWatts,
    alternatorDailyAh: Math.round(alternatorDailyAh),
    needsSmartRegulator: batteryChemistry === 'lifepo4',
    batteryMonitor: true,
    wireGauge,
    dailyGenerationWh: Math.round(dailyGenerationWh),
    dailyBalance: Math.round(dailyGenerationWh - dailyConsumptionWh),
  };
}
