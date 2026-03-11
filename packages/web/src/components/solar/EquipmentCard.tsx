import { Badge, Group, Paper, Switch, Text } from '@mantine/core';
import type {
  EquipmentInstance,
  DrainEquipment,
  ChargeEquipment,
  StoreEquipment,
} from '@/lib/solar/types';

export interface EquipmentCardProps {
  item: EquipmentInstance;
  whPerDay: number;
  onClick: () => void;
  onToggle: () => void;
}

function getSummary(item: EquipmentInstance, whPerDay: number): string {
  switch (item.type) {
    case 'drain':
      return `${item.wattsTypical}W · ${whPerDay} Wh/day`;
    case 'charge':
      return getChargeSummary(item, whPerDay);
    case 'store':
      return getStoreSummary(item);
  }
}

function getChargeSummary(item: ChargeEquipment, whPerDay: number): string {
  switch (item.sourceType) {
    case 'solar':
      return `${item.panelWatts}W · ${whPerDay} Wh/day`;
    case 'alternator':
      return `${item.alternatorAmps}A · ${whPerDay} Wh/day`;
    case 'shore':
      return `${item.shoreChargerAmps}A · ${item.shoreHoursPerDay}h · ${whPerDay} Wh/day`;
  }
}

function getStoreSummary(item: StoreEquipment): string {
  const chemistry = item.chemistry === 'lifepo4' ? 'LiFePO4' : 'AGM';
  return `${chemistry} · ${item.capacityAh}Ah`;
}

export function EquipmentCard({
  item,
  whPerDay,
  onClick,
  onToggle,
}: EquipmentCardProps) {
  return (
    <Paper
      data-equipment-card
      withBorder
      p="sm"
      style={{
        cursor: 'pointer',
        opacity: item.enabled ? undefined : 0.5,
      }}
      onClick={onClick}
    >
      <Group justify="space-between" wrap="nowrap" mb={4}>
        <Group gap="xs" wrap="nowrap">
          <Text fw={600} size="sm">
            {item.name}
          </Text>
          <Badge
            size="xs"
            color={item.origin === 'stock' ? 'gray' : 'blue'}
            variant="light"
          >
            {item.origin === 'stock' ? 'Stock' : 'Added'}
          </Badge>
          {item.type === 'drain' && item.powerType === 'ac' && (
            <Badge size="xs" color="orange" variant="outline">
              AC
            </Badge>
          )}
        </Group>
        <Switch
          checked={item.enabled}
          onChange={() => onToggle()}
          onClick={(e) => e.stopPropagation()}
          size="xs"
        />
      </Group>
      <Text size="xs" c="dimmed">
        {getSummary(item, whPerDay)}
      </Text>
    </Paper>
  );
}
