import { useMemo } from 'react';
import { useSolarStore } from '@/stores/solar';
import { calculateConsumption } from '@/lib/solar/engine';
import { calculateRecommendation } from '@/lib/solar/sizing';
import type { Appliance, ConsumptionResult, SolarRecommendation } from '@/lib/solar/types';

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
}

interface ComputeResult {
  consumption: ConsumptionResult;
  recommendation: SolarRecommendation;
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

  return { consumption, recommendation };
}

// React hook — reads from Zustand store, returns memoized results
export function useSolarCalculation(peakSunHours: number) {
  const {
    appliances, crewSize, systemVoltage, batteryChemistry,
    daysAutonomy, deratingFactor, alternatorAmps, motoringHoursPerDay,
  } = useSolarStore();

  return useMemo(
    () =>
      computeResults({
        appliances, crewSize, systemVoltage, batteryChemistry,
        daysAutonomy, deratingFactor, peakSunHours,
        alternatorAmps, motoringHoursPerDay,
      }),
    [
      appliances, crewSize, systemVoltage, batteryChemistry,
      daysAutonomy, deratingFactor, peakSunHours,
      alternatorAmps, motoringHoursPerDay,
    ]
  );
}
