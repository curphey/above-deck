import { Badge, Card, Group, List, SimpleGrid, Stack, Text } from '@mantine/core';
import type { SolarRecommendation } from '@/lib/solar/types';

interface RecommendationTiersProps {
  recommendation: SolarRecommendation;
  batteryChemistry: 'agm' | 'lifepo4';
}

type TierKey = 'minimum' | 'recommended' | 'comfortable';

const tiers: { key: TierKey; label: string }[] = [
  { key: 'minimum', label: 'Minimum' },
  { key: 'recommended', label: 'Recommended' },
  { key: 'comfortable', label: 'Comfortable' },
];

export function RecommendationTiers({
  recommendation,
  batteryChemistry,
}: RecommendationTiersProps) {
  const chemLabel = batteryChemistry === 'lifepo4' ? 'LiFePO4' : 'AGM';

  return (
    <SimpleGrid cols={{ base: 1, sm: 3 }}>
      {tiers.map(({ key, label }) => {
        const isRecommended = key === 'recommended';
        return (
          <Card
            key={key}
            padding="lg"
            withBorder
            style={
              isRecommended
                ? {
                    borderColor: 'var(--mantine-color-ocean-6)',
                    borderWidth: 2,
                  }
                : undefined
            }
            data-testid={`tier-${key}`}
          >
            <Stack gap="sm">
              <Group gap="xs">
                <Text fw={700} size="lg">
                  {label}
                </Text>
                {isRecommended && (
                  <Badge color="ocean" variant="light" size="sm">
                    Best value
                  </Badge>
                )}
              </Group>

              <List spacing="xs" size="sm">
                <List.Item>
                  Solar Panels: {recommendation.panelWatts[key]}W
                </List.Item>
                <List.Item>
                  MPPT Controller: {recommendation.mpptAmps}A / {recommendation.mpptMaxVoltage}V
                </List.Item>
                <List.Item>
                  Battery Bank: {recommendation.batteryAh[key]}Ah {chemLabel}
                </List.Item>
                {recommendation.inverterWatts !== null && (
                  <List.Item>
                    Inverter: {recommendation.inverterWatts}W
                  </List.Item>
                )}
                <List.Item>
                  Alternator: +{recommendation.alternatorDailyAh}Ah/day
                </List.Item>
                <List.Item>Battery Monitor: Shunt-based</List.Item>
                <List.Item>
                  Main Wiring: {recommendation.wireGauge} AWG
                </List.Item>
              </List>

              {batteryChemistry === 'lifepo4' && (
                <Text size="xs" c="dimmed" fs="italic">
                  Smart regulator recommended
                </Text>
              )}
            </Stack>
          </Card>
        );
      })}
    </SimpleGrid>
  );
}
