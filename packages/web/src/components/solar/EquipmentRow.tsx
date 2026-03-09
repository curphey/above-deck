import { ActionIcon, Badge, Group, NumberInput, Switch, Table, Text } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import type { Appliance } from '@/lib/solar/types';
import type { ViewMode } from '@/stores/solar';

interface EquipmentRowProps {
  appliance: Appliance;
  viewMode: ViewMode;
  crewSize: number;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdateWatts: (id: string, watts: number) => void;
  onUpdateHours: (id: string, mode: 'anchor' | 'passage', hours: number) => void;
}

export function EquipmentRow({
  appliance, viewMode, crewSize, onToggle, onRemove, onUpdateWatts, onUpdateHours,
}: EquipmentRowProps) {
  const hours = viewMode === 'anchor' ? appliance.hoursPerDayAnchor : appliance.hoursPerDayPassage;
  const crewMultiplier = appliance.crewScaling ? crewSize / 2 : 1;
  const dailyWh = Math.round(appliance.wattsTypical * hours * appliance.dutyCycle * crewMultiplier);

  return (
    <Table.Tr opacity={appliance.enabled ? 1 : 0.5}>
      <Table.Td>
        <Group gap="xs">
          <Text size="sm">{appliance.name}</Text>
          <Badge size="xs" variant="light"
            color={appliance.origin === 'stock' ? 'ocean' : 'gray'}>
            {appliance.origin === 'stock' ? 'Stock' : 'Added'}
          </Badge>
        </Group>
      </Table.Td>
      <Table.Td>
        <NumberInput size="xs" w={80} value={appliance.wattsTypical}
          onChange={(val) => onUpdateWatts(appliance.id, Number(val) || 0)}
          min={0} max={5000} suffix="W" />
      </Table.Td>
      <Table.Td>
        <NumberInput size="xs" w={80} value={hours}
          onChange={(val) => onUpdateHours(appliance.id, viewMode, Number(val) || 0)}
          min={0} max={24} step={0.5} decimalScale={1} suffix="h" />
      </Table.Td>
      <Table.Td>
        <Text size="sm">{appliance.dutyCycle}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm" fw={600}>{dailyWh} Wh</Text>
      </Table.Td>
      <Table.Td>
        <Switch size="xs" checked={appliance.enabled}
          onChange={() => onToggle(appliance.id)} />
      </Table.Td>
      <Table.Td>
        {appliance.origin !== 'stock' && (
          <ActionIcon size="sm" variant="subtle" color="red"
            onClick={() => onRemove(appliance.id)}>
            <IconTrash size={14} />
          </ActionIcon>
        )}
      </Table.Td>
    </Table.Tr>
  );
}
