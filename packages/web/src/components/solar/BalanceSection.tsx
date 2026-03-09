import { Card, Grid, Stack, Text, Title } from '@mantine/core';
import type { ConsumptionResult, SolarRecommendation } from '@/lib/solar/types';
import type { ChargingResult } from '@/lib/solar/charging';
import { ConsumptionDonut } from './ConsumptionDonut';
import { RecommendationTiers } from './RecommendationTiers';
import { useSolarStore } from '@/stores/solar';

const HEADING_FONT = "'Space Mono', monospace";

interface BalanceSectionProps {
  consumption: ConsumptionResult;
  charging: ChargingResult;
  recommendation: SolarRecommendation;
}

export function BalanceSection({ consumption, charging, recommendation }: BalanceSectionProps) {
  const viewMode = useSolarStore((s) => s.viewMode);
  const batteryChemistry = useSolarStore((s) => s.batteryChemistry);

  const dailyDraw = viewMode === 'anchor'
    ? consumption.totalWhPerDayAnchor
    : consumption.totalWhPerDayPassage;
  const dailyIn = charging.totalWhPerDay;
  const netBalance = dailyIn - dailyDraw;
  const balanceColor = netBalance >= 0 ? 'green' : 'red';

  return (
    <Stack gap="md">
      <Title order={3} ff={HEADING_FONT}>Balance</Title>

      <Grid>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <Card padding="md" withBorder>
            <Text size="xs" c="dimmed" tt="uppercase">Daily charging</Text>
            <Text size="xl" fw={700}>{dailyIn} Wh</Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <Card padding="md" withBorder>
            <Text size="xs" c="dimmed" tt="uppercase">Daily draw</Text>
            <Text size="xl" fw={700}>{Math.round(dailyDraw)} Wh</Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <Card padding="md" withBorder>
            <Text size="xs" c="dimmed" tt="uppercase">Net balance</Text>
            <Text size="xl" fw={700} c={balanceColor}>
              {netBalance >= 0 ? '+' : ''}{Math.round(netBalance)} Wh
            </Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <Card padding="md" withBorder>
            <Text size="xs" c="dimmed" tt="uppercase">Status</Text>
            <Text size="xl" fw={700} c={balanceColor}>
              {dailyDraw === 0 ? 'No loads' : netBalance >= 0 ? 'Surplus' : 'Deficit'}
            </Text>
          </Card>
        </Grid.Col>
      </Grid>

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <ConsumptionDonut
            breakdown={consumption.breakdownByCategory}
            viewMode={viewMode}
            totalWh={dailyDraw}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <RecommendationTiers
            recommendation={recommendation}
            batteryChemistry={batteryChemistry}
          />
        </Grid.Col>
      </Grid>

      {charging.solarWhPerDay === 0 && dailyDraw > 0 && (
        <Card padding="md" withBorder bg="ocean.9">
          <Text size="sm">
            You need approximately{' '}
            <Text span fw={700}>{recommendation.panelWatts.recommended}W</Text>
            {' '}of solar panels to meet your daily draw with headroom.
          </Text>
        </Card>
      )}
    </Stack>
  );
}
