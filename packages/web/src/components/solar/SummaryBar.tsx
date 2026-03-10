import { Group, Paper, Text } from '@mantine/core';

const HEADING_FONT = "'Space Mono', monospace";

export interface SummaryBarProps {
  drainWh: number;
  chargeWh: number;
  netBalance: number;
  daysAutonomy: number;
}

function getAutonomyLevel(days: number): 'good' | 'warning' | 'danger' {
  if (days >= 3) return 'good';
  if (days >= 1) return 'warning';
  return 'danger';
}

function getAutonomyColor(level: 'good' | 'warning' | 'danger'): string {
  if (level === 'good') return 'green';
  if (level === 'warning') return 'yellow';
  return 'red';
}

export function SummaryBar({ drainWh, chargeWh, netBalance, daysAutonomy }: SummaryBarProps) {
  const isPositive = netBalance >= 0;
  const balanceSign = isPositive ? '+' : '';
  const autonomyLevel = getAutonomyLevel(daysAutonomy);
  const autonomyColor = getAutonomyColor(autonomyLevel);
  const autonomyDisplay = daysAutonomy === Infinity ? '∞' : `${daysAutonomy.toFixed(1)} days`;

  return (
    <Paper withBorder p="xs" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      <Group justify="space-around">
        <div>
          <Text size="xs" c="dimmed" tt="uppercase" ff={HEADING_FONT}>
            Drain
          </Text>
          <Text size="sm" fw={700}>
            {Math.round(drainWh)} Wh
          </Text>
        </div>

        <div>
          <Text size="xs" c="dimmed" tt="uppercase" ff={HEADING_FONT}>
            Charge
          </Text>
          <Text size="sm" fw={700}>
            {Math.round(chargeWh)} Wh
          </Text>
        </div>

        <div>
          <Text size="xs" c="dimmed" tt="uppercase" ff={HEADING_FONT}>
            Balance
          </Text>
          <Text
            size="sm"
            fw={700}
            c={isPositive ? 'green' : 'red'}
            data-positive={isPositive ? 'true' : 'false'}
          >
            {balanceSign}{Math.round(netBalance)} Wh
          </Text>
        </div>

        <div>
          <Text size="xs" c="dimmed" tt="uppercase" ff={HEADING_FONT}>
            Autonomy
          </Text>
          <Text size="sm" fw={700} c={autonomyColor} data-autonomy={autonomyLevel}>
            {autonomyDisplay}
          </Text>
        </div>
      </Group>
    </Paper>
  );
}
