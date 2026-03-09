import { Grid, NumberInput, SegmentedControl, Stack, Text } from '@mantine/core';
import { useSolarStore } from '@/stores/solar';

export function SystemPreferences() {
  const batteryChemistry = useSolarStore((s) => s.batteryChemistry);
  const setBatteryChemistry = useSolarStore((s) => s.setBatteryChemistry);
  const systemVoltage = useSolarStore((s) => s.systemVoltage);
  const setSystemVoltage = useSolarStore((s) => s.setSystemVoltage);
  const daysAutonomy = useSolarStore((s) => s.daysAutonomy);
  const setDaysAutonomy = useSolarStore((s) => s.setDaysAutonomy);
  const alternatorAmps = useSolarStore((s) => s.alternatorAmps);
  const setAlternatorAmps = useSolarStore((s) => s.setAlternatorAmps);
  const motoringHoursPerDay = useSolarStore((s) => s.motoringHoursPerDay);
  const setMotoringHoursPerDay = useSolarStore((s) => s.setMotoringHoursPerDay);
  const shorepower = useSolarStore((s) => s.shorepower);
  const setShorepower = useSolarStore((s) => s.setShorepower);

  return (
    <Stack gap="md">
      <Grid>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Stack gap={4}>
            <Text size="sm" fw={500}>
              Battery chemistry
            </Text>
            <SegmentedControl
              value={batteryChemistry}
              onChange={(val) => setBatteryChemistry(val as 'agm' | 'lifepo4')}
              data={[
                { value: 'agm', label: 'AGM' },
                { value: 'lifepo4', label: 'LiFePO4' },
              ]}
              fullWidth
            />
          </Stack>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Stack gap={4}>
            <Text size="sm" fw={500}>
              System voltage
            </Text>
            <SegmentedControl
              value={String(systemVoltage)}
              onChange={(val) => setSystemVoltage(Number(val) as 12 | 24 | 48)}
              data={[
                { value: '12', label: '12V' },
                { value: '24', label: '24V' },
                { value: '48', label: '48V' },
              ]}
              fullWidth
            />
          </Stack>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <NumberInput
            label="Days of autonomy"
            value={daysAutonomy}
            onChange={(val) => setDaysAutonomy(Number(val) || 1)}
            min={1}
            max={7}
          />
        </Grid.Col>
      </Grid>

      <Grid>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <NumberInput
            label="Alternator amps"
            value={alternatorAmps}
            onChange={(val) => setAlternatorAmps(Number(val) || 0)}
            min={0}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <NumberInput
            label="Motoring hours/day"
            value={motoringHoursPerDay}
            onChange={(val) => setMotoringHoursPerDay(Number(val) || 0)}
            min={0}
            step={0.5}
            decimalScale={1}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Stack gap={4}>
            <Text size="sm" fw={500}>
              Shore power
            </Text>
            <SegmentedControl
              value={shorepower}
              onChange={(val) => setShorepower(val as 'no' | 'sometimes' | 'often')}
              data={[
                { value: 'no', label: 'No' },
                { value: 'sometimes', label: 'Sometimes' },
                { value: 'often', label: 'Often' },
              ]}
              fullWidth
            />
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
