import { Card, SimpleGrid, Text, Stack, Anchor } from '@mantine/core';
import type { ConsumptionResult, SolarRecommendation } from '@/lib/solar/types';
import type { ViewMode } from '@/stores/solar';

interface ResultsBannerProps {
  consumption: ConsumptionResult;
  recommendation: SolarRecommendation;
  viewMode: ViewMode;
  regionName: string;
}

function getBalanceStatus(balance: number, dailyWh: number) {
  if (dailyWh === 0) return { color: 'gray', label: 'No loads' };
  const pct = Math.round((balance / dailyWh) * 100);
  if (pct >= 10) return { color: 'green', label: `+${pct}% surplus` };
  if (pct >= 0) return { color: 'yellow', label: `+${pct}% surplus` };
  return { color: 'red', label: 'Deficit' };
}

export function ResultsBanner({
  consumption,
  recommendation,
  viewMode,
  regionName,
}: ResultsBannerProps) {
  const dailyWh =
    viewMode === 'anchor'
      ? consumption.totalWhPerDayAnchor
      : consumption.totalWhPerDayPassage;

  const balance = getBalanceStatus(recommendation.dailyBalance, dailyWh);

  return (
    <Stack gap="sm">
      <SimpleGrid cols={{ base: 2, sm: 4 }}>
        <Card padding="md" data-testid="stat-consumption">
          <Text size="xs" c="dimmed" tt="uppercase">
            Daily consumption
          </Text>
          <Text size="xl" fw={700}>
            {Math.round(dailyWh)} Wh/day
          </Text>
        </Card>

        <Card padding="md" data-testid="stat-solar">
          <Text size="xs" c="dimmed" tt="uppercase">
            Solar needed
          </Text>
          <Text size="xl" fw={700}>
            {recommendation.panelWatts.recommended} W
          </Text>
        </Card>

        <Card padding="md" data-testid="stat-battery">
          <Text size="xs" c="dimmed" tt="uppercase">
            Battery bank
          </Text>
          <Text size="xl" fw={700}>
            {recommendation.batteryAh.recommended} Ah
          </Text>
        </Card>

        <Card padding="md" data-testid="stat-balance">
          <Text size="xs" c="dimmed" tt="uppercase">
            Daily balance
          </Text>
          <Text size="xl" fw={700} c={balance.color}>
            {balance.label}
          </Text>
        </Card>
      </SimpleGrid>

      <Text size="xs" c="dimmed" ta="center">
        Based on typical {regionName} sunshine.{' '}
        <Anchor href="#region-picker" size="xs">
          Adjust for your cruising area
        </Anchor>
      </Text>
    </Stack>
  );
}
