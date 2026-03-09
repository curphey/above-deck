import { Grid, Paper, Stack, Text, Title } from '@mantine/core';
import { useSolarStore } from '@/stores/solar';

type JourneyType = 'plan' | 'check' | 'upgrade';

interface JourneyOption {
  type: JourneyType;
  title: string;
  description: string;
}

const journeys: JourneyOption[] = [
  {
    type: 'plan',
    title: 'Plan a new system',
    description: 'Full sizing from scratch — boat, loads, location, complete recommendation',
  },
  {
    type: 'check',
    title: 'Check my existing setup',
    description: 'Enter what you have — see if your solar and batteries are enough',
  },
  {
    type: 'upgrade',
    title: 'Add or upgrade',
    description: 'Adding a watermaker? Switching to lithium? See what changes',
  },
];

export function JourneySelector() {
  const journeyType = useSolarStore((s) => s.journeyType);
  const setJourneyType = useSolarStore((s) => s.setJourneyType);

  return (
    <Stack gap="md">
      <Title
        order={3}
        ff="'Space Mono', monospace"
        tt="uppercase"
        c="dimmed"
        fz="sm"
        style={{
          letterSpacing: '1px',
          borderBottom: '1px solid var(--mantine-color-default-border)',
          paddingBottom: 8,
        }}
      >
        1. What brings you here?
      </Title>

      <Grid>
        {journeys.map((journey) => {
          const selected = journeyType === journey.type;
          return (
            <Grid.Col key={journey.type} span={{ base: 12, sm: 4 }}>
              <Paper
                p="md"
                withBorder
                data-journey={journey.type}
                data-selected={selected ? 'true' : 'false'}
                onClick={() => setJourneyType(journey.type)}
                style={{
                  cursor: 'pointer',
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected
                    ? 'var(--mantine-color-blue-6)'
                    : undefined,
                }}
              >
                <Stack gap="xs">
                  <Text fw={600}>{journey.title}</Text>
                  <Text fz="sm" c="dimmed">
                    {journey.description}
                  </Text>
                </Stack>
              </Paper>
            </Grid.Col>
          );
        })}
      </Grid>
    </Stack>
  );
}
