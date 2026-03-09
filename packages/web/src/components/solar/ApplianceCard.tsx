import { Card, Group, Text, Switch, Slider, Stack } from '@mantine/core';
import type { Appliance } from '@/lib/solar/types';
import type { ViewMode } from '@/stores/solar';

interface ApplianceCardProps {
  appliance: Appliance;
  viewMode: ViewMode;
  crewSize: number;
  onToggle: (id: string) => void;
  onHoursChange: (id: string, mode: 'anchor' | 'passage', hours: number) => void;
}

export function ApplianceCard({
  appliance,
  viewMode,
  crewSize,
  onToggle,
  onHoursChange,
}: ApplianceCardProps) {
  const hours =
    viewMode === 'anchor'
      ? appliance.hoursPerDayAnchor
      : appliance.hoursPerDayPassage;

  return (
    <Card
      padding="sm"
      withBorder
      style={{
        opacity: appliance.enabled ? 1 : 0.5,
        borderLeft: appliance.crewScaling
          ? '3px solid var(--mantine-color-ocean-6)'
          : undefined,
      }}
      data-testid={`appliance-${appliance.id}`}
    >
      <Stack gap="xs">
        <Group justify="space-between">
          <Text fw={500} size="sm">
            {appliance.name}
          </Text>
          <Switch
            checked={appliance.enabled}
            onChange={() => onToggle(appliance.id)}
            size="sm"
            aria-label={`Toggle ${appliance.name}`}
          />
        </Group>

        <Group gap="xs">
          <Text size="xs" c="dimmed">
            {appliance.wattsTypical}W
          </Text>
          {appliance.crewScaling && (
            <Text size="xs" c="ocean" data-testid="crew-indicator">
              &times; {crewSize} crew
            </Text>
          )}
        </Group>

        <Slider
          value={hours}
          onChange={(val) => onHoursChange(appliance.id, viewMode, val)}
          min={0}
          max={24}
          step={0.5}
          label={(val) => `${val}h`}
          disabled={!appliance.enabled}
          size="sm"
        />
      </Stack>
    </Card>
  );
}
