import { useEffect, useMemo, useState } from 'react';
import { Container, Divider, Grid, Stack, Title } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useApplianceCatalog } from '@/hooks/use-appliance-catalog';
import { useSolarCalculation } from '@/hooks/use-solar-calculation';
import { useSolarStore } from '@/stores/solar';

import { JourneySelector } from './JourneySelector';
import { QuickStart } from './QuickStart';
import { ResultsBanner } from './ResultsBanner';
import { ApplianceGrid } from './ApplianceGrid';
import { RegionPicker, REGIONS } from './RegionPicker';
import { SystemPreferences } from './SystemPreferences';
import { RecommendationTiers } from './RecommendationTiers';
import { ConsumptionDonut } from './ConsumptionDonut';
import { SaveBar } from './SaveBar';

const HEADING_FONT = "'Space Mono', monospace";

function EnergyPlannerInner() {
  const appliances = useSolarStore((s) => s.appliances);
  const setAppliances = useSolarStore((s) => s.setAppliances);
  const viewMode = useSolarStore((s) => s.viewMode);
  const regionName = useSolarStore((s) => s.regionName);
  const batteryChemistry = useSolarStore((s) => s.batteryChemistry);

  // Load appliance catalog from Supabase and seed store if empty
  const { data: catalogAppliances } = useApplianceCatalog();

  useEffect(() => {
    if (catalogAppliances && catalogAppliances.length > 0 && appliances.length === 0) {
      setAppliances(catalogAppliances);
    }
  }, [catalogAppliances, appliances.length, setAppliances]);

  // Determine peak sun hours from selected region
  const peakSunHours = useMemo(() => {
    const region = REGIONS.find((r) => r.label === regionName);
    return region?.psh ?? 4.5;
  }, [regionName]);

  const { consumption, recommendation } = useSolarCalculation(peakSunHours);

  const dailyWh =
    viewMode === 'anchor'
      ? consumption.totalWhPerDayAnchor
      : consumption.totalWhPerDayPassage;

  return (
    <>
      <Container size="lg" py="xl" pb={80}>
        <Stack gap="xl">
          {/* Journey Selection */}
          <Title order={2} ff={HEADING_FONT}>
            Energy Planner
          </Title>
          <JourneySelector />

          <Divider />

          {/* Quick Start */}
          <Title order={3} ff={HEADING_FONT}>
            Your boat
          </Title>
          <QuickStart />

          <Divider />

          {/* Results Banner */}
          <ResultsBanner
            consumption={consumption}
            recommendation={recommendation}
            viewMode={viewMode}
            regionName={regionName}
          />

          <Divider />

          {/* Customize: Appliances + Region */}
          <Title order={3} ff={HEADING_FONT}>
            Customize
          </Title>
          <ApplianceGrid />
          <RegionPicker />

          <Divider />

          {/* System Preferences */}
          <Title order={3} ff={HEADING_FONT}>
            System preferences
          </Title>
          <SystemPreferences />

          <Divider />

          {/* Analysis: Donut + Recommendation Tiers */}
          <Title order={3} ff={HEADING_FONT}>
            Analysis
          </Title>
          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <ConsumptionDonut
                breakdown={consumption.breakdownByCategory}
                viewMode={viewMode}
                totalWh={dailyWh}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <RecommendationTiers
                recommendation={recommendation}
                batteryChemistry={batteryChemistry}
              />
            </Grid.Col>
          </Grid>
        </Stack>
      </Container>

      <SaveBar isAuthenticated={false} />
    </>
  );
}

export function EnergyPlanner() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <EnergyPlannerInner />
    </QueryClientProvider>
  );
}
