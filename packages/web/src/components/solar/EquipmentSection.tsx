import { useMemo, useState } from 'react';
import { Chip, Group, SegmentedControl, Stack, Table, Text, Title } from '@mantine/core';
import { useSolarStore, type ViewMode } from '@/stores/solar';
import { EquipmentRow } from './EquipmentRow';
import { AddEquipmentModal } from './AddEquipmentModal';
import type { Appliance } from '@/lib/solar/types';

const HEADING_FONT = "'Space Mono', monospace";

const CATEGORIES = [
  'All', 'navigation', 'communication', 'refrigeration', 'lighting',
  'water-systems', 'comfort-galley', 'charging', 'sailing-safety',
];

export function EquipmentSection() {
  const appliances = useSolarStore((s) => s.appliances);
  const setAppliances = useSolarStore((s) => s.setAppliances);
  const viewMode = useSolarStore((s) => s.viewMode);
  const setViewMode = useSolarStore((s) => s.setViewMode);
  const crewSize = useSolarStore((s) => s.crewSize);
  const toggleAppliance = useSolarStore((s) => s.toggleAppliance);
  const removeAppliance = useSolarStore((s) => s.removeAppliance);
  const updateApplianceWatts = useSolarStore((s) => s.updateApplianceWatts);
  const updateApplianceHours = useSolarStore((s) => s.updateApplianceHours);

  const [categoryFilter, setCategoryFilter] = useState('All');

  const filtered = categoryFilter === 'All'
    ? appliances
    : appliances.filter((a) => a.category === categoryFilter);

  const totalWh = useMemo(() => {
    return appliances
      .filter((a) => a.enabled)
      .reduce((sum, a) => {
        const hours = viewMode === 'anchor' ? a.hoursPerDayAnchor : a.hoursPerDayPassage;
        const crew = a.crewScaling ? crewSize / 2 : 1;
        return sum + a.wattsTypical * hours * a.dutyCycle * crew;
      }, 0);
  }, [appliances, viewMode, crewSize]);

  const handleAddEquipment = (newAppliances: Appliance[]) => {
    setAppliances([...appliances, ...newAppliances]);
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3} ff={HEADING_FONT}>
          Equipment — {Math.round(totalWh)} Wh/day
        </Title>
        <SegmentedControl size="xs" value={viewMode}
          onChange={(val) => setViewMode(val as ViewMode)}
          data={[
            { label: 'At anchor', value: 'anchor' },
            { label: 'On passage', value: 'passage' },
          ]} />
      </Group>

      <Group gap="xs">
        {CATEGORIES.map((cat) => (
          <Chip key={cat} checked={categoryFilter === cat}
            onChange={() => setCategoryFilter(cat)} size="xs">
            {cat === 'All' ? 'All' : cat.replace('-', ' ')}
          </Chip>
        ))}
      </Group>

      {appliances.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          Select a boat above to load its standard equipment, or add items manually.
        </Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Appliance</Table.Th>
              <Table.Th>Watts</Table.Th>
              <Table.Th>Hours/day</Table.Th>
              <Table.Th>Duty</Table.Th>
              <Table.Th>Daily</Table.Th>
              <Table.Th>On</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filtered.map((a) => (
              <EquipmentRow key={a.id} appliance={a} viewMode={viewMode}
                crewSize={crewSize} onToggle={toggleAppliance}
                onRemove={removeAppliance} onUpdateWatts={updateApplianceWatts}
                onUpdateHours={updateApplianceHours} />
            ))}
          </Table.Tbody>
        </Table>
      )}

      <AddEquipmentModal
        existingIds={appliances.map((a) => a.id)}
        onAdd={handleAddEquipment}
      />
    </Stack>
  );
}
