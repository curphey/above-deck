import { Grid, SegmentedControl, Stack, Text, Title } from '@mantine/core';
import { useSolarStore } from '@/stores/solar';
import type { SolarRecommendation } from '@/lib/solar/types';

const HEADING_FONT = "'Space Mono', monospace";

interface StorageSectionProps {
  recommendation: SolarRecommendation;
}

export function StorageSection({ recommendation }: StorageSectionProps) {
  const batteryChemistry = useSolarStore((s) => s.batteryChemistry);
  const setBatteryChemistry = useSolarStore((s) => s.setBatteryChemistry);
  const systemVoltage = useSolarStore((s) => s.systemVoltage);
  const setSystemVoltage = useSolarStore((s) => s.setSystemVoltage);
  const daysAutonomy = useSolarStore((s) => s.daysAutonomy);

  return (
    <Stack gap="md">
      <Title order={3} ff={HEADING_FONT}>Storage</Title>
      <Grid>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Text size="sm" mb={4}>Battery chemistry</Text>
          <SegmentedControl fullWidth value={batteryChemistry}
            onChange={(val) => setBatteryChemistry(val as 'agm' | 'lifepo4')}
            data={[
              { label: 'AGM', value: 'agm' },
              { label: 'LiFePO4', value: 'lifepo4' },
            ]} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Text size="sm" mb={4}>System voltage</Text>
          <SegmentedControl fullWidth value={String(systemVoltage)}
            onChange={(val) => setSystemVoltage(Number(val) as 12 | 24 | 48)}
            data={[
              { label: '12V', value: '12' },
              { label: '24V', value: '24' },
              { label: '48V', value: '48' },
            ]} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Text size="sm" c="dimmed">Days of autonomy</Text>
          <Text size="lg" fw={700}>{daysAutonomy}</Text>
          <Text size="xs" c="dimmed">Set in "Your boat" above</Text>
        </Grid.Col>
      </Grid>
      <Grid>
        <Grid.Col span={{ base: 6, sm: 4 }}>
          <Text size="sm" c="dimmed">Recommended bank</Text>
          <Text size="lg" fw={700}>{recommendation.batteryAh.recommended} Ah</Text>
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 4 }}>
          <Text size="sm" c="dimmed">Minimum bank</Text>
          <Text size="lg">{recommendation.batteryAh.minimum} Ah</Text>
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 4 }}>
          <Text size="sm" c="dimmed">Comfortable bank</Text>
          <Text size="lg">{recommendation.batteryAh.comfortable} Ah</Text>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
