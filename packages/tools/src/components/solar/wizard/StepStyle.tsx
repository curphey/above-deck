import { Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconAnchor, IconCompass, IconWorld } from '@tabler/icons-react';
import { HEADING_FONT } from '@/theme/fonts';
import { useSolarStore } from '@/stores/solar';
import { getProfileAdjustments } from '@/lib/solar/cruising-profiles';
import type { CruisingStyle } from '@/lib/solar/types';

interface StepStyleProps {
  onNext: (style: CruisingStyle) => void;
}

const STYLES: {
  key: CruisingStyle;
  label: string;
  icon: typeof IconAnchor;
  description: string;
}[] = [
  {
    key: 'weekend',
    label: 'Weekend',
    icon: IconAnchor,
    description: 'Marina-based, shore power available, short trips',
  },
  {
    key: 'coastal',
    label: 'Coastal',
    icon: IconCompass,
    description: 'Week-long trips, some marinas, mostly anchored',
  },
  {
    key: 'offshore',
    label: 'Offshore',
    icon: IconWorld,
    description: 'Extended passages, fully self-sufficient',
  },
];

export function StepStyle({ onNext }: StepStyleProps) {
  const setCruisingStyle = useSolarStore((s) => s.setCruisingStyle);
  const setDaysAutonomy = useSolarStore((s) => s.setDaysAutonomy);

  const handleSelect = (style: CruisingStyle) => {
    const profile = getProfileAdjustments(style);
    setCruisingStyle(style);
    setDaysAutonomy(profile.autonomyDays);
    onNext(style);
  };

  return (
    <Stack data-testid="step-style" gap="lg" align="center">
      <Title order={2} ff={HEADING_FONT} ta="center">
        Cruising Style
      </Title>
      <Text c="dimmed" ta="center">
        How do you use your boat? This shapes your energy profile.
      </Text>

      <SimpleGrid cols={{ base: 1, sm: 3 }} w="100%">
        {STYLES.map(({ key, label, icon: Icon, description }) => (
          <Paper
            key={key}
            withBorder
            p="xl"
            style={{ cursor: 'pointer', textAlign: 'center' }}
            onClick={() => handleSelect(key)}
          >
            <Stack align="center" gap="sm">
              <Icon size={40} color="#60a5fa" stroke={1.5} />
              <Text fw={700} size="lg">
                {label}
              </Text>
              <Text size="sm" c="dimmed">
                {description}
              </Text>
            </Stack>
          </Paper>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
