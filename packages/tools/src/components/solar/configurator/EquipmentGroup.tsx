import { useState, useEffect } from 'react';
import {
  Badge,
  Group,
  Paper,
  SimpleGrid,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { EquipmentCard } from '../EquipmentCard';
import { HEADING_FONT } from '@/theme/fonts';
import type { EquipmentInstance } from '@/lib/solar/types';

export interface EquipmentGroupProps {
  title: string;
  items: EquipmentInstance[];
  whPerDayMap: Map<string, number>;
  previousTotal: number | null;
  onCardClick: (id: string) => void;
  onToggle: (id: string) => void;
  onAddClick: () => void;
}

export function EquipmentGroup({
  title,
  items,
  whPerDayMap,
  previousTotal,
  onCardClick,
  onToggle,
  onAddClick,
}: EquipmentGroupProps) {
  const total = items.reduce((sum, item) => sum + (whPerDayMap.get(item.id) ?? 0), 0);
  const delta = previousTotal !== null ? total - previousTotal : null;

  const [showDelta, setShowDelta] = useState(delta !== null && delta !== 0);

  useEffect(() => {
    if (delta === null || delta === 0) {
      setShowDelta(false);
      return;
    }
    setShowDelta(true);
    const timer = setTimeout(() => setShowDelta(false), 3000);
    return () => clearTimeout(timer);
  }, [delta]);

  // Determine if this is a "good" or "bad" delta based on section type
  const isDrainSection = title.toUpperCase().includes('DRAIN');
  const isGoodDelta = isDrainSection
    ? (delta ?? 0) < 0 // For drain: decrease = good
    : (delta ?? 0) > 0; // For charge: increase = good

  return (
    <div data-testid="equipment-group">
      <Group gap="sm" mb="sm">
        <Text size="sm" fw={700} ff={HEADING_FONT} tt="uppercase">
          {title}
        </Text>
        <Text size="sm" c="dimmed">
          {total.toLocaleString()} Wh/day
        </Text>
        {showDelta && delta !== null && delta !== 0 && (
          <Badge
            size="sm"
            variant="light"
            color={isGoodDelta ? '#4ade80' : '#f87171'}
          >
            {delta > 0 ? '+' : ''}{delta}
            {delta > 0 ? ' \u2191' : ' \u2193'}
          </Badge>
        )}
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
        {items.map((item) => (
          <EquipmentCard
            key={item.id}
            item={item}
            whPerDay={whPerDayMap.get(item.id) ?? 0}
            onClick={() => onCardClick(item.id)}
            onToggle={() => onToggle(item.id)}
          />
        ))}

        <Paper
          withBorder
          p="sm"
          style={{
            cursor: 'pointer',
            borderStyle: 'dashed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 60,
          }}
        >
          <UnstyledButton onClick={onAddClick}>
            <Group gap={4}>
              <IconPlus size={16} />
              <Text size="sm">Add equipment</Text>
            </Group>
          </UnstyledButton>
        </Paper>
      </SimpleGrid>
    </div>
  );
}
