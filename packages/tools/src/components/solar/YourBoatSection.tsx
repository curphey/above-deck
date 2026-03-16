import { useEffect } from 'react';
import { Stack, Title } from '@mantine/core';
import { useSolarStore } from '@/stores/solar';
import { useBoatAppliances } from '@/hooks/use-boat-appliances';
import { BoatSelector } from './BoatSelector';

export function YourBoatSection() {
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
    <Stack>
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
        2. Your boat
      </Title>
      <BoatSelector />
    </Stack>
  );
}
