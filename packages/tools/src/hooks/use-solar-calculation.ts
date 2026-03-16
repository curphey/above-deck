import { useMemo } from 'react';
import { useSolarStore } from '@/stores/solar';
import { calculateConsumption } from '@/lib/solar/engine';
import { calculateRecommendation } from '@/lib/solar/sizing';
import { calculateDailyCharging } from '@/lib/solar/charging';
import type { Appliance, ConsumptionResult, SolarRecommendation, PanelType } from '@/lib/solar/types';
import type { ChargingResult } from '@/lib/solar/charging';

interface ComputeInput {
  appliances: Appliance[];
  crewSize: number;
  systemVoltage: number;
  batteryChemistry: 'agm' | 'lifepo4';
  daysAutonomy: number;
  deratingFactor: number;
  peakSunHours: number;
  alternatorAmps: number;
  motoringHoursPerDay: number;
  solarPanelWatts: number;
  panelType: PanelType;
  shorePowerHoursPerDay: number;
  shoreChargerAmps: number;
}

interface ComputeResult {
  consumption: ConsumptionResult;
  recommendation: SolarRecommendation;
  charging: ChargingResult;
}

// Pure function — exported for testing without React context
export function computeResults(input: ComputeInput): ComputeResult {
  const consumption = calculateConsumption(
    input.appliances,
    input.crewSize,
    input.systemVoltage
  );

  const dailyWh = Math.max(consumption.totalWhPerDayAnchor, 1);
  const hasAcLoads = input.appliances.some(
    (a) => a.enabled && a.category === 'comfort-galley' && a.wattsTypical > 200
  );
  const maxAcLoadWatts = input.appliances
    .filter((a) => a.enabled && a.category === 'comfort-galley' && a.wattsTypical > 200)
    .reduce((max, a) => Math.max(max, a.wattsTypical), 0);

  const recommendation = calculateRecommendation({
    dailyConsumptionWh: dailyWh,
    peakSunHours: input.peakSunHours,
    deratingFactor: input.deratingFactor,
    batteryChemistry: input.batteryChemistry,
    systemVoltage: input.systemVoltage,
    daysAutonomy: input.daysAutonomy,
    alternatorAmps: input.alternatorAmps,
    motoringHoursPerDay: input.motoringHoursPerDay,
    hasAcLoads,
    maxAcLoadWatts,
  });

  const charging = calculateDailyCharging({
    solarPanelWatts: input.solarPanelWatts,
    panelType: input.panelType,
    peakSunHours: input.peakSunHours,
    deratingFactor: input.deratingFactor,
    alternatorAmps: input.alternatorAmps,
    motoringHoursPerDay: input.motoringHoursPerDay,
    systemVoltage: input.systemVoltage,
    shorePowerHoursPerDay: input.shorePowerHoursPerDay,
    shoreChargerAmps: input.shoreChargerAmps,
  });

  return { consumption, recommendation, charging };
}

// React hook — reads from Zustand store, returns memoized results
export function useSolarCalculation(peakSunHours: number) {
  const {
    appliances, crewSize, systemVoltage, batteryChemistry,
    daysAutonomy, deratingFactor, alternatorAmps, motoringHoursPerDay,
    solarPanelWatts, panelType, shorePowerHoursPerDay, shoreChargerAmps,
  } = useSolarStore();

  return useMemo(
    () =>
      computeResults({
        appliances, crewSize, systemVoltage, batteryChemistry,
        daysAutonomy, deratingFactor, peakSunHours,
        alternatorAmps, motoringHoursPerDay,
        solarPanelWatts, panelType, shorePowerHoursPerDay, shoreChargerAmps,
      }),
    [
      appliances, crewSize, systemVoltage, batteryChemistry,
      daysAutonomy, deratingFactor, peakSunHours,
      alternatorAmps, motoringHoursPerDay,
      solarPanelWatts, panelType, shorePowerHoursPerDay, shoreChargerAmps,
    ]
  );
}
