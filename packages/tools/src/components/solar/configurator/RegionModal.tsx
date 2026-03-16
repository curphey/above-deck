import { Modal, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import { useSolarStore } from '@/stores/solar';
import { HEADING_FONT } from '@/theme/fonts';
import { CURATED_REGIONS } from '@/lib/solar/regions';

export interface RegionModalProps {
  opened: boolean;
  onClose: () => void;
}

export function RegionModal({ opened, onClose }: RegionModalProps) {
  const setLocation = useSolarStore((s) => s.setLocation);
  const setDeratingFactor = useSolarStore((s) => s.setDeratingFactor);
  const currentRegion = useSolarStore((s) => s.regionName);

  const handleSelect = (name: string, lat: number, lon: number, deratingFactor: number) => {
    setLocation(lat, lon, name);
    setDeratingFactor(deratingFactor);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={700} ff={HEADING_FONT}>
          Select Cruising Region
        </Text>
      }
      size="lg"
    >
      <div data-testid="region-modal">
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
          {CURATED_REGIONS.map((region) => {
            const isActive = region.name === currentRegion;
            return (
              <Paper
                key={region.name}
                withBorder
                p="sm"
                style={{
                  cursor: 'pointer',
                  borderColor: isActive ? '#60a5fa' : undefined,
                  borderWidth: isActive ? 2 : undefined,
                }}
                onClick={() => handleSelect(region.name, region.lat, region.lon, region.deratingFactor)}
              >
                <Stack gap={4}>
                  <Text size="sm" fw={600}>
                    {region.name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {region.psh} peak sun hours
                  </Text>
                </Stack>
              </Paper>
            );
          })}
        </SimpleGrid>
      </div>
    </Modal>
  );
}
