import { useMemo, useState } from 'react';
import { Container, Divider, Stack, Title } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '../MantineProvider';

import { useSolarCalculation } from '@/hooks/use-solar-calculation';
import { useSolarStore } from '@/stores/solar';
import { REGIONS } from './RegionPicker';

import { YourBoatSection } from './YourBoatSection';
import { EquipmentSection } from './EquipmentSection';
import { ChargingSection } from './ChargingSection';
import { StorageSection } from './StorageSection';
import { BalanceSection } from './BalanceSection';
import { SaveBar } from './SaveBar';

const HEADING_FONT = "'Space Mono', monospace";

function EnergyPlannerInner() {
  const regionName = useSolarStore((s) => s.regionName);

  const peakSunHours = useMemo(() => {
    const region = REGIONS.find((r) => r.label === regionName);
    return region?.psh ?? 4.5;
  }, [regionName]);

  const { consumption, recommendation, charging } = useSolarCalculation(peakSunHours);

  return (
    <>
      <Container size="lg" py="xl" pb={80}>
        <Stack gap="xl">
          <Title order={2} ff={HEADING_FONT}>Energy Planner</Title>

          {/* 1. Your Boat */}
          <YourBoatSection />

          <Divider />

          {/* 2. Equipment (drains) */}
          <EquipmentSection />

          <Divider />

          {/* 3. Charging (fills) */}
          <ChargingSection charging={charging} />

          <Divider />

          {/* 4. Storage (buffer) */}
          <StorageSection recommendation={recommendation} dailyDrainWh={consumption.totalWhPerDayAnchor} />

          <Divider />

          {/* 5. Balance */}
          <BalanceSection
            consumption={consumption}
            charging={charging}
            recommendation={recommendation}
          />
        </Stack>
      </Container>

      <SaveBar isAuthenticated={false} />
    </>
  );
}

export function EnergyPlanner() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <EnergyPlannerInner />
      </QueryClientProvider>
    </MantineProvider>
  );
}
