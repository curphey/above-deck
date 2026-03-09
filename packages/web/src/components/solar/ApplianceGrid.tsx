import { SegmentedControl, Chip, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { useMemo, useState } from 'react';
import { useSolarStore } from '@/stores/solar';
import type { ViewMode } from '@/stores/solar';
import { ApplianceCard } from './ApplianceCard';

const CATEGORIES = [
  'All',
  'refrigeration',
  'navigation',
  'communication',
  'lighting',
  'water-systems',
  'comfort-galley',
  'charging',
  'sailing-safety',
];

export function ApplianceGrid() {
  const appliances = useSolarStore((s) => s.appliances);
  const viewMode = useSolarStore((s) => s.viewMode);
  const setViewMode = useSolarStore((s) => s.setViewMode);
  const crewSize = useSolarStore((s) => s.crewSize);
  const toggleAppliance = useSolarStore((s) => s.toggleAppliance);
  const updateApplianceHours = useSolarStore((s) => s.updateApplianceHours);
  const [category, setCategory] = useState('All');

  const filtered = useMemo(
    () =>
      category === 'All'
        ? appliances
        : appliances.filter((a) => a.category === category),
    [appliances, category]
  );

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text fw={600}>Appliances</Text>
        <SegmentedControl
          value={viewMode}
          onChange={(val) => setViewMode(val as ViewMode)}
          data={[
            { value: 'anchor', label: 'At anchor' },
            { value: 'passage', label: 'On passage' },
          ]}
          size="xs"
        />
      </Group>

      <Group gap="xs">
        {CATEGORIES.map((cat) => (
          <Chip
            key={cat}
            checked={category === cat}
            onChange={() => setCategory(cat)}
            size="xs"
            variant="outline"
          >
            {cat === 'All' ? 'All' : cat.replace('-', ' ')}
          </Chip>
        ))}
      </Group>

      <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>
        {filtered.map((appliance) => (
          <ApplianceCard
            key={appliance.id}
            appliance={appliance}
            viewMode={viewMode}
            crewSize={crewSize}
            onToggle={toggleAppliance}
            onHoursChange={updateApplianceHours}
          />
        ))}
      </SimpleGrid>
    </Stack>
  );
}
