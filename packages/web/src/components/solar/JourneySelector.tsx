import { Card, SimpleGrid, Text, ThemeIcon, Group, Stack } from '@mantine/core';
import { IconSunElectricity, IconCircleCheck, IconArrowUp } from '@tabler/icons-react';
import { useSolarStore } from '@/stores/solar';
import type { JourneyMode } from '@/lib/solar/types';

const journeyOptions: {
  mode: JourneyMode;
  icon: typeof IconSunElectricity;
  title: string;
  description: string;
}[] = [
  {
    mode: 'new-system',
    icon: IconSunElectricity,
    title: 'Plan a new system',
    description: 'Design a complete solar and battery setup from scratch.',
  },
  {
    mode: 'check-existing',
    icon: IconCircleCheck,
    title: 'Check my existing setup',
    description: 'Evaluate whether your current system meets your needs.',
  },
  {
    mode: 'add-upgrade',
    icon: IconArrowUp,
    title: 'Add or upgrade',
    description: 'Expand or improve your current solar and battery system.',
  },
];

export function JourneySelector() {
  const journeyMode = useSolarStore((s) => s.journeyMode);
  const setJourneyMode = useSolarStore((s) => s.setJourneyMode);

  return (
    <SimpleGrid cols={{ base: 1, sm: 3 }}>
      {journeyOptions.map(({ mode, icon: Icon, title, description }) => (
        <Card
          key={mode}
          padding="lg"
          withBorder
          style={{
            cursor: 'pointer',
            borderColor: journeyMode === mode ? 'var(--mantine-color-ocean-6)' : undefined,
            borderWidth: journeyMode === mode ? 2 : undefined,
          }}
          role="button"
          tabIndex={0}
          onClick={() => setJourneyMode(mode)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setJourneyMode(mode); } }}
          aria-pressed={journeyMode === mode}
          data-testid={`journey-${mode}`}
        >
          <Stack gap="sm">
            <Group>
              <ThemeIcon size="lg" variant="light" color="ocean">
                <Icon size={20} />
              </ThemeIcon>
              <Text fw={600}>{title}</Text>
            </Group>
            <Text size="sm" c="dimmed">
              {description}
            </Text>
          </Stack>
        </Card>
      ))}
    </SimpleGrid>
  );
}
