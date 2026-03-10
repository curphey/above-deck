import { Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { HEADING_FONT } from '@/theme/fonts';
import { useSolarStore } from '@/stores/solar';
import { CURATED_REGIONS } from '@/lib/solar/regions';

interface StepRegionProps {
  onNext: () => void;
}

export function StepRegion({ onNext }: StepRegionProps) {
  const setLocation = useSolarStore((s) => s.setLocation);
  const setDeratingFactor = useSolarStore((s) => s.setDeratingFactor);

  const handleSelect = (region: (typeof CURATED_REGIONS)[number]) => {
    setLocation(region.lat, region.lon, region.name);
    setDeratingFactor(region.deratingFactor);
    onNext();
  };

  return (
    <Stack data-testid="step-region" gap="lg" align="center">
      <Title order={2} ff={HEADING_FONT} ta="center">
        Cruising Region
      </Title>
      <Text c="dimmed" ta="center">
        Where do you sail? This determines solar irradiance.
      </Text>

      <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} w="100%">
        {CURATED_REGIONS.map((region) => (
          <Paper
            key={region.name}
            withBorder
            p="sm"
            style={{ cursor: 'pointer' }}
            onClick={() => handleSelect(region)}
          >
            <Text fw={600} size="sm">
              {region.name}
            </Text>
            <Text size="xs" c="dimmed">
              {region.psh} PSH
            </Text>
            <Text size="xs" c="dimmed">
              Derate: {Math.round(region.deratingFactor * 100)}%
            </Text>
          </Paper>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
