import { useMemo, useState } from 'react';
import { Container, Stack } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '../MantineProvider';

import { useSolarCalculation } from '@/hooks/use-solar-calculation';
import { useSolarStore } from '@/stores/solar';
import { REGIONS } from './RegionPicker';

import { JourneySelector } from './JourneySelector';
import { YourBoatSection } from './YourBoatSection';
import { EquipmentSection } from './EquipmentSection';
import { ChargingSection } from './ChargingSection';
import { StorageSection } from './StorageSection';
import { BalanceSection } from './BalanceSection';
import { SaveBar } from './SaveBar';

function EnergyPlannerInner() {
  const regionName = useSolarStore((s) => s.regionName);
  const viewMode = useSolarStore((s) => s.viewMode);

  const peakSunHours = useMemo(() => {
    const region = REGIONS.find((r) => r.label === regionName);
    return region?.psh ?? 4.5;
  }, [regionName]);

  const { consumption, recommendation, charging } = useSolarCalculation(peakSunHours);

  const dailyDrainWh = viewMode === 'anchor'
    ? consumption.totalWhPerDayAnchor
    : consumption.totalWhPerDayPassage;

  return (
    <>
      <Container size="lg" py="xl" pb={80}>
        <Stack gap="xl">
          {/* 1. Journey */}
          <JourneySelector />

          {/* 2. Your Boat */}
          <YourBoatSection />

          {/* 3. Equipment (drains) */}
          <EquipmentSection />

          {/* 4. Charging (fills) */}
          <ChargingSection charging={charging} />

          {/* 5. Storage (buffer) */}
          <StorageSection recommendation={recommendation} dailyDrainWh={dailyDrainWh} />

          {/* 6. Balance */}
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
