import { Badge, Group, Paper, Slider, Switch, Text } from '@mantine/core';
import type { Appliance } from '@/lib/solar/types';
import type { ViewMode } from '@/stores/solar';

export interface ApplianceCardProps {
  appliance: Appliance;
  viewMode: ViewMode;
  crewSize: number;
  onToggle: (id: string) => void;
  onUpdateHours: (id: string, mode: ViewMode, hours: number) => void;
  onRemove: (id: string) => void;
}

export function ApplianceCard({
  appliance,
  viewMode,
  crewSize,
  onToggle,
  onUpdateHours,
}: ApplianceCardProps) {
  const hours =
    viewMode === 'anchor'
      ? appliance.hoursPerDayAnchor
      : appliance.hoursPerDayPassage;

  const crewMultiplier = appliance.crewScaling ? crewSize / 2 : 1;

  const dailyWh = Math.round(
    appliance.wattsTypical * hours * appliance.dutyCycle * crewMultiplier,
  );

  const isStock = appliance.origin === 'stock';

  return (
    <Paper
      withBorder
      p="md"
      data-testid={`appliance-card-${appliance.id}`}
      style={{
        opacity: appliance.enabled ? 1 : 0.5,
        ...(appliance.crewScaling
          ? { borderLeft: '3px solid var(--mantine-color-blue-5)' }
          : {}),
      }}
    >
      {/* Header row */}
      <Group justify="space-between" mb="xs">
        <Group gap="xs">
          <Text fw={500}>{appliance.name}</Text>
          <Badge variant="light" color={isStock ? 'gray' : 'blue'}>
            {isStock ? 'Stock' : 'Added'}
          </Badge>
        </Group>
        <Switch
          checked={appliance.enabled}
          onChange={() => onToggle(appliance.id)}
          aria-label={`Toggle ${appliance.name}`}
        />
      </Group>

      {/* Wattage text */}
      <Text size="sm" c="dimmed" mb="xs">
        {appliance.wattsTypical}W typical ({appliance.wattsMin}–
        {appliance.wattsMax}W)
        {appliance.crewScaling && ` × ${crewSize} crew`}
      </Text>

      {/* Slider */}
      <Slider
        size="sm"
        min={0}
        max={24}
        step={0.5}
        value={hours}
        onChange={(value) => onUpdateHours(appliance.id, viewMode, value)}
        label={(value) => `${value}h`}
        disabled={!appliance.enabled}
        mb="xs"
      />

      {/* Footer row */}
      <Group justify="space-between">
        <Text size="sm">{hours}h/day</Text>
        <Text size="sm" fw={500}>
          {dailyWh} Wh/day
        </Text>
      </Group>
    </Paper>
  );
}
