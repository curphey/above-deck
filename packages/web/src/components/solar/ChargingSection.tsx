import { Grid, NumberInput, SegmentedControl, Stack, Text, Title } from '@mantine/core';
import { useSolarStore } from '@/stores/solar';
import { RegionPicker } from './RegionPicker';
import type { PanelType } from '@/lib/solar/types';
import type { ChargingResult } from '@/lib/solar/charging';

const HEADING_FONT = "'Space Mono', monospace";

interface ChargingSectionProps {
  charging: ChargingResult;
}

export function ChargingSection({ charging }: ChargingSectionProps) {
  const solarPanelWatts = useSolarStore((s) => s.solarPanelWatts);
  const setSolarPanelWatts = useSolarStore((s) => s.setSolarPanelWatts);
  const panelType = useSolarStore((s) => s.panelType);
  const setPanelType = useSolarStore((s) => s.setPanelType);
  const alternatorAmps = useSolarStore((s) => s.alternatorAmps);
  const setAlternatorAmps = useSolarStore((s) => s.setAlternatorAmps);
  const motoringHoursPerDay = useSolarStore((s) => s.motoringHoursPerDay);
  const setMotoringHoursPerDay = useSolarStore((s) => s.setMotoringHoursPerDay);
  const shorepower = useSolarStore((s) => s.shorepower);
  const setShorepower = useSolarStore((s) => s.setShorepower);

  return (
    <Stack gap="md">
      <Title order={3} ff={HEADING_FONT}>
        Charging — {charging.totalWhPerDay} Wh/day
      </Title>

      {/* Solar */}
      <Text fw={600} size="sm">Solar</Text>
      <Grid>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <NumberInput label="Panel wattage (total)" value={solarPanelWatts}
            onChange={(val) => setSolarPanelWatts(Number(val) || 0)}
            min={0} max={3000} step={50} suffix="W" />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Text size="sm" mb={4}>Panel type</Text>
          <SegmentedControl fullWidth value={panelType}
            onChange={(val) => setPanelType(val as PanelType)}
            data={[
              { label: 'Rigid', value: 'rigid' },
              { label: 'Semi-flex', value: 'semi-flexible' },
              { label: 'Flexible', value: 'flexible' },
            ]} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <RegionPicker />
        </Grid.Col>
      </Grid>
      <Text size="xs" c="dimmed">
        Estimated solar: {charging.solarWhPerDay} Wh/day
      </Text>

      {/* Alternator */}
      <Text fw={600} size="sm" mt="md">Alternator</Text>
      <Grid>
        <Grid.Col span={{ base: 6, sm: 4 }}>
          <NumberInput label="Alternator amps" value={alternatorAmps}
            onChange={(val) => setAlternatorAmps(Number(val) || 0)}
            min={0} max={300} />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 4 }}>
          <NumberInput label="Motoring hours/day" value={motoringHoursPerDay}
            onChange={(val) => setMotoringHoursPerDay(Number(val) || 0)}
            min={0} max={24} step={0.5} decimalScale={1} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Text size="sm" mb={4}>Shore power</Text>
          <SegmentedControl fullWidth value={shorepower}
            onChange={(val) => setShorepower(val as 'no' | 'sometimes' | 'often')}
            data={[
              { label: 'No', value: 'no' },
              { label: 'Sometimes', value: 'sometimes' },
              { label: 'Often', value: 'often' },
            ]} />
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
