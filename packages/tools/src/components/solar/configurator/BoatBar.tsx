import {
  ActionIcon,
  Group,
  Paper,
  SegmentedControl,
  Text,
} from '@mantine/core';
import { IconSettings, IconShare } from '@tabler/icons-react';
import { useSolarStore } from '@/stores/solar';
import { HEADING_FONT } from '@/theme/fonts';
import type { ViewMode } from '@/stores/solar';

export interface BoatBarProps {
  onEdit: () => void;
  onShare: () => void;
}

const CRUISING_LABELS: Record<string, string> = {
  weekend: 'Weekend',
  coastal: 'Coastal',
  offshore: 'Offshore',
};

export function BoatBar({ onEdit, onShare }: BoatBarProps) {
  const boatName = useSolarStore((s) => s.boatName);
  const crewSize = useSolarStore((s) => s.crewSize);
  const regionName = useSolarStore((s) => s.regionName);
  const cruisingStyle = useSolarStore((s) => s.cruisingStyle);
  const systemVoltage = useSolarStore((s) => s.systemVoltage);
  const viewMode = useSolarStore((s) => s.viewMode);
  const setViewMode = useSolarStore((s) => s.setViewMode);

  const summary = [
    boatName || 'Unnamed Boat',
    `${crewSize} crew`,
    regionName,
    CRUISING_LABELS[cruisingStyle] ?? cruisingStyle,
    `${systemVoltage}V`,
  ]
    .filter(Boolean)
    .join(' \u00B7 ');

  return (
    <Paper
      data-testid="boat-bar"
      withBorder
      p="xs"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'var(--mantine-color-body)',
      }}
    >
      <Group justify="space-between" wrap="nowrap" gap="sm">
        <Text size="sm" ff={HEADING_FONT} truncate>
          {summary}
        </Text>

        <Group gap="xs" wrap="nowrap">
          <SegmentedControl
            size="xs"
            value={viewMode}
            onChange={(val) => setViewMode(val as ViewMode)}
            data={[
              { value: 'anchor', label: 'Anchor' },
              { value: 'passage', label: 'Passage' },
            ]}
          />

          <ActionIcon
            variant="subtle"
            aria-label="Edit configuration"
            onClick={onEdit}
          >
            <IconSettings size={18} />
          </ActionIcon>

          <ActionIcon
            variant="subtle"
            aria-label="Share configuration"
            onClick={onShare}
          >
            <IconShare size={18} />
          </ActionIcon>
        </Group>
      </Group>
    </Paper>
  );
}
