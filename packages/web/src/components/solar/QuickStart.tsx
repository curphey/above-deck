import { Grid, NumberInput, SegmentedControl, Text, Stack } from '@mantine/core';
import { useSolarStore } from '@/stores/solar';
import type { CruisingStyle } from '@/stores/solar';
import { BoatSelector } from './BoatSelector';

const styleOptions: { value: CruisingStyle; label: string }[] = [
  { value: 'weekend', label: 'Weekend' },
  { value: 'coastal', label: 'Coastal' },
  { value: 'offshore', label: 'Offshore' },
];

export function QuickStart() {
  const crewSize = useSolarStore((s) => s.crewSize);
  const setCrewSize = useSolarStore((s) => s.setCrewSize);
  const cruisingStyle = useSolarStore((s) => s.cruisingStyle);
  const setCruisingStyle = useSolarStore((s) => s.setCruisingStyle);

  return (
    <Grid>
      <Grid.Col span={{ base: 12, sm: 5 }}>
        <BoatSelector />
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 3 }}>
        <NumberInput
          label="Crew size"
          value={crewSize}
          onChange={(val) => setCrewSize(Number(val) || 1)}
          min={1}
          max={12}
          stepHoldDelay={500}
          stepHoldInterval={100}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 4 }}>
        <Stack gap={4}>
          <Text size="sm" fw={500}>
            Cruising style
          </Text>
          <SegmentedControl
            value={cruisingStyle}
            onChange={(val) => setCruisingStyle(val as CruisingStyle)}
            data={styleOptions}
            fullWidth
          />
        </Stack>
      </Grid.Col>
    </Grid>
  );
}
