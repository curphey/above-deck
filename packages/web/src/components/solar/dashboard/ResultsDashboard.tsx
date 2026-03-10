import { useMemo } from 'react';
import { SimpleGrid, Stack } from '@mantine/core';
import { useSolarStore } from '@/stores/solar';
import {
  calculateDrainFromEquipment,
  calculateChargeFromEquipment,
  calculateStorageFromEquipment,
} from '@/lib/solar/equipment-calc';
import type {
  DrainEquipment,
  ChargeEquipment,
  StoreEquipment,
} from '@/lib/solar/types';
import { REGIONS } from '../RegionPicker';
import { DashboardHeader } from './DashboardHeader';
import { EnergyFlowChart } from './EnergyFlowChart';
import { MonthlyGenerationChart } from './MonthlyGenerationChart';
import { ConsumptionDonut } from '../ConsumptionDonut';
import { RecommendationTiers } from '../RecommendationTiers';
import { useSolarCalculation } from '@/hooks/use-solar-calculation';

const MONTHLY_FACTORS = [0.6, 0.7, 0.85, 1.0, 1.1, 1.15, 1.15, 1.1, 1.0, 0.85, 0.7, 0.6];

export function ResultsDashboard() {
  // Store state (selector pattern)
  const equipment = useSolarStore((s) => s.equipment);
  const viewMode = useSolarStore((s) => s.viewMode);
  const crewSize = useSolarStore((s) => s.crewSize);
  const systemVoltage = useSolarStore((s) => s.systemVoltage);
  const acCircuitVoltage = useSolarStore((s) => s.acCircuitVoltage);
  const regionName = useSolarStore((s) => s.regionName);
  const deratingFactor = useSolarStore((s) => s.deratingFactor);
  const batteryChemistry = useSolarStore((s) => s.batteryChemistry);
  const monthlyIrradiance = useSolarStore((s) => s.monthlyIrradiance);

  // Derive peak sun hours from region
  const peakSunHours = useMemo(() => {
    const region = REGIONS.find((r) => r.label === regionName);
    return region?.psh ?? 4.5;
  }, [regionName]);

  // Filter equipment by type
  const drains = useMemo(
    () => equipment.filter((e): e is DrainEquipment => e.type === 'drain'),
    [equipment],
  );
  const charges = useMemo(
    () => equipment.filter((e): e is ChargeEquipment => e.type === 'charge'),
    [equipment],
  );
  const stores = useMemo(
    () => equipment.filter((e): e is StoreEquipment => e.type === 'store'),
    [equipment],
  );

  // Calculate drain/charge/storage
  const drainResult = useMemo(
    () => calculateDrainFromEquipment(drains, viewMode, crewSize),
    [drains, viewMode, crewSize],
  );
  const chargeResult = useMemo(
    () =>
      calculateChargeFromEquipment(charges, {
        peakSunHours,
        deratingFactor,
        systemVoltage,
        acCircuitVoltage,
      }),
    [charges, peakSunHours, deratingFactor, systemVoltage, acCircuitVoltage],
  );
  const storageResult = useMemo(
    () => calculateStorageFromEquipment(stores, systemVoltage, drainResult.totalWhPerDay),
    [stores, systemVoltage, drainResult.totalWhPerDay],
  );

  const netBalance = chargeResult.totalWhPerDay - drainResult.totalWhPerDay;

  // Total panel watts from charge equipment
  const totalPanelWatts = useMemo(
    () =>
      charges
        .filter((c) => c.enabled && c.sourceType === 'solar')
        .reduce((sum, c) => sum + (c.panelWatts ?? 0), 0),
    [charges],
  );

  // Monthly generation estimate
  const monthlyGeneration = useMemo(() => {
    if (monthlyIrradiance.length === 12) {
      // Use real irradiance data if available
      // Scale relative to average to get monthly factors
      const avgIrr =
        monthlyIrradiance.reduce((s, m) => s + m.optimalIrradiance, 0) / 12;
      if (avgIrr > 0) {
        return monthlyIrradiance.map(
          (m) => chargeResult.solarWhPerDay * (m.optimalIrradiance / avgIrr),
        );
      }
    }
    // Fallback: use static monthly factors
    return MONTHLY_FACTORS.map((f) => chargeResult.solarWhPerDay * f);
  }, [monthlyIrradiance, chargeResult.solarWhPerDay]);

  // Battery capacity in Wh for energy flow chart
  const batteryCapacityWh = storageResult.totalUsableWh || 2400;

  // Legacy hook for ConsumptionDonut and RecommendationTiers
  const { consumption, recommendation } = useSolarCalculation(peakSunHours);

  return (
    <div data-testid="results-dashboard">
      <Stack gap="lg">
        <DashboardHeader
          netBalance={netBalance}
          panelWatts={totalPanelWatts}
          regionName={regionName}
          viewMode={viewMode}
        />

        <SimpleGrid cols={{ base: 1, md: 2 }}>
          <EnergyFlowChart
            drainWhPerDay={drainResult.totalWhPerDay}
            chargeWhPerDay={chargeResult.solarWhPerDay}
            peakSunHours={peakSunHours}
            categories={drainResult.breakdownByCategory}
            batteryCapacityWh={batteryCapacityWh}
          />

          <MonthlyGenerationChart
            monthlyGeneration={monthlyGeneration}
            dailyConsumption={drainResult.totalWhPerDay}
          />

          <ConsumptionDonut
            breakdown={consumption.breakdownByCategory}
            viewMode={viewMode}
            totalWh={
              viewMode === 'anchor'
                ? consumption.totalWhPerDayAnchor
                : consumption.totalWhPerDayPassage
            }
          />

          <RecommendationTiers
            recommendation={recommendation}
            batteryChemistry={batteryChemistry}
          />
        </SimpleGrid>
      </Stack>
    </div>
  );
}
