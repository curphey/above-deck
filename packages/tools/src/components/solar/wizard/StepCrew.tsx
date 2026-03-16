import { useState } from 'react';
import { Button, NumberInput, Stack, Text, Title } from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';
import { HEADING_FONT } from '@/theme/fonts';
import { useSolarStore } from '@/stores/solar';

interface StepCrewProps {
  onComplete: () => void;
}

export function StepCrew({ onComplete }: StepCrewProps) {
  const [crewSize, setCrewSize] = useState(2);
  const setStoreCrewSize = useSolarStore((s) => s.setCrewSize);

  const handleComplete = () => {
    setStoreCrewSize(crewSize);
    onComplete();
  };

  return (
    <Stack data-testid="step-crew" gap="lg" align="center" maw={400} mx="auto">
      <IconUsers size={48} color="#60a5fa" stroke={1.5} />
      <Title order={2} ff={HEADING_FONT} ta="center">
        Crew Size
      </Title>
      <Text c="dimmed" ta="center">
        How many people are typically aboard?
      </Text>

      <NumberInput
        value={crewSize}
        onChange={(v) => setCrewSize(typeof v === 'number' ? v : 2)}
        min={1}
        max={12}
        step={1}
        size="lg"
        w={120}
        styles={{ input: { textAlign: 'center' } }}
      />

      <Text size="sm" c="dimmed" ta="center">
        Crew size adjusts water pump, device charging, and galley usage
      </Text>

      <Button size="lg" variant="filled" onClick={handleComplete}>
        Start Planning
      </Button>
    </Stack>
  );
}
