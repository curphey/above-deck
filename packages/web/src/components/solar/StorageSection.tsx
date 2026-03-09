import { Grid, NumberInput, SegmentedControl, Stack, Text, Title } from '@mantine/core';
import { useSolarStore } from '@/stores/solar';
import type { SolarRecommendation } from '@/lib/solar/types';

const HEADING_FONT = "'Space Mono', monospace";

const DOD_FACTOR: Record<'agm' | 'lifepo4', number> = {
  agm: 0.5,
  lifepo4: 0.8,
};

interface StorageSectionProps {
  recommendation: SolarRecommendation;
  dailyDrainWh: number;
}

function autonomyStatus(days: number): 'good' | 'warning' | 'critical' {
  if (days >= 3) return 'good';
  if (days >= 1) return 'warning';
  return 'critical';
}

function autonomyColor(status: 'good' | 'warning' | 'critical'): string {
  if (status === 'good') return '#4ade80';
  if (status === 'warning') return '#f87171';
  return '#f87171';
}

export function StorageSection({ recommendation, dailyDrainWh }: StorageSectionProps) {
  const batteryChemistry = useSolarStore((s) => s.batteryChemistry);
  const setBatteryChemistry = useSolarStore((s) => s.setBatteryChemistry);
  const systemVoltage = useSolarStore((s) => s.systemVoltage);
  const setSystemVoltage = useSolarStore((s) => s.setSystemVoltage);
  const journeyType = useSolarStore((s) => s.journeyType);
  const daysAutonomy = useSolarStore((s) => s.daysAutonomy);
  const setDaysAutonomy = useSolarStore((s) => s.setDaysAutonomy);
  const batteryBankAh = useSolarStore((s) => s.batteryBankAh);
  const setBatteryBankAh = useSolarStore((s) => s.setBatteryBankAh);

  const isPlanMode = journeyType === 'plan';

  // Calculate days of autonomy for existing mode
  const calculatedDays =
    dailyDrainWh > 0
      ? (batteryBankAh * systemVoltage * DOD_FACTOR[batteryChemistry]) / dailyDrainWh
      : Infinity;

  const displayDays = Number.isFinite(calculatedDays)
    ? calculatedDays.toFixed(1)
    : '\u221E';

  const status = Number.isFinite(calculatedDays)
    ? autonomyStatus(calculatedDays)
    : 'good';

  return (
    <Stack gap="md">
      <Title
        order={3}
        ff={HEADING_FONT}
        tt="uppercase"
        c="dimmed"
        fz="sm"
        style={{
          letterSpacing: '1px',
          borderBottom: '1px solid var(--mantine-color-default-border)',
          paddingBottom: 8,
        }}
      >
        5. Storage
      </Title>

      <Grid>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Text size="sm" mb={4}>Battery chemistry</Text>
          <SegmentedControl
            fullWidth
            value={batteryChemistry}
            onChange={(val) => setBatteryChemistry(val as 'agm' | 'lifepo4')}
            data={[
              { label: 'AGM', value: 'agm' },
              { label: 'LiFePO4', value: 'lifepo4' },
            ]}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Text size="sm" mb={4}>System voltage</Text>
          <SegmentedControl
            fullWidth
            value={String(systemVoltage)}
            onChange={(val) => setSystemVoltage(Number(val) as 12 | 24 | 48)}
            data={[
              { label: '12V', value: '12' },
              { label: '24V', value: '24' },
              { label: '48V', value: '48' },
            ]}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          {isPlanMode ? (
            <NumberInput
              label="Target days self-sufficient"
              value={daysAutonomy}
              onChange={(val) => setDaysAutonomy(typeof val === 'number' ? val : 3)}
              min={1}
              max={14}
              step={1}
            />
          ) : (
            <NumberInput
              label="Battery bank capacity (Ah)"
              value={batteryBankAh || ''}
              onChange={(val) => setBatteryBankAh(typeof val === 'number' ? val : 0)}
              min={0}
              step={50}
              placeholder="e.g. 400"
            />
          )}
        </Grid.Col>
      </Grid>

      {isPlanMode ? (
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
      ) : (
        <Grid>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Text size="sm" c="dimmed">Estimated autonomy</Text>
            <Text
              size="lg"
              fw={700}
              c={autonomyColor(status)}
              data-autonomy-status={status}
            >
              {displayDays} days
            </Text>
          </Grid.Col>
        </Grid>
      )}
    </Stack>
  );
}
