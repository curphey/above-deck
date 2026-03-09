import { useEffect } from 'react';
import { Grid, NumberInput, Text } from '@mantine/core';
import { useSolarStore } from '@/stores/solar';
import { useBoatAppliances } from '@/hooks/use-boat-appliances';
import { BoatSelector } from './BoatSelector';

const HEADING_FONT = "'Space Mono', monospace";

export function YourBoatSection() {
  const crewSize = useSolarStore((s) => s.crewSize);
  const setCrewSize = useSolarStore((s) => s.setCrewSize);
  const daysAutonomy = useSolarStore((s) => s.daysAutonomy);
  const setDaysAutonomy = useSolarStore((s) => s.setDaysAutonomy);
  const boatModelId = useSolarStore((s) => s.boatModelId);
  const setAppliances = useSolarStore((s) => s.setAppliances);

  const { data: boatAppliances } = useBoatAppliances(boatModelId);

  // When boat is selected and appliances load, seed the store
  useEffect(() => {
    if (boatAppliances && boatAppliances.length > 0) {
      setAppliances(boatAppliances);
    }
  }, [boatAppliances, setAppliances]);

  return (
    <Grid>
      <Grid.Col span={{ base: 12, sm: 5 }}>
        <BoatSelector />
      </Grid.Col>
      <Grid.Col span={{ base: 6, sm: 3 }}>
        <NumberInput
          label="Crew size"
          value={crewSize}
          onChange={(val) => setCrewSize(Number(val) || 2)}
          min={1}
          max={12}
          styles={{ label: { fontFamily: HEADING_FONT } }}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 6, sm: 4 }}>
        <NumberInput
          label="Days self-sufficient"
          value={daysAutonomy}
          onChange={(val) => setDaysAutonomy(Number(val) || 3)}
          min={1}
          max={14}
          styles={{ label: { fontFamily: HEADING_FONT } }}
        />
        <Text size="xs" c="dimmed" mt={4}>
          Weekend: 2–3 · Coastal: 5–7 · Offshore: 10+
        </Text>
      </Grid.Col>
    </Grid>
  );
}
