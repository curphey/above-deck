import { Card, Select } from '@mantine/core';
import { useSolarStore } from '@/stores/solar';
import { CURATED_REGIONS } from '@/lib/solar/regions';

const selectData = CURATED_REGIONS.map((r) => ({
  value: r.name,
  label: `${r.name} (${r.psh} psh)`,
}));

export function RegionPicker() {
  const regionName = useSolarStore((s) => s.regionName);
  const setLocation = useSolarStore((s) => s.setLocation);

  const handleChange = (value: string | null) => {
    if (!value) return;
    const region = CURATED_REGIONS.find((r) => r.name === value);
    if (region) {
      setLocation(region.lat, region.lon, region.name);
    }
  };

  return (
    <Card id="region-picker" padding="md" withBorder>
      <Select
        label="Cruising region"
        description="Sets peak sun hours for solar calculations"
        data={selectData}
        value={regionName}
        onChange={handleChange}
        allowDeselect={false}
      />
    </Card>
  );
}
