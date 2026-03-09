import { Card, Select } from '@mantine/core';
import { useSolarStore } from '@/stores/solar';

interface Region {
  label: string;
  lat: number;
  lon: number;
  psh: number;
}

export const REGIONS: Region[] = [
  { label: 'Caribbean', lat: 15.0, lon: -61.0, psh: 5.5 },
  { label: 'Mediterranean', lat: 36.0, lon: 14.5, psh: 4.5 },
  { label: 'Northern Europe', lat: 52.0, lon: 1.0, psh: 2.8 },
  { label: 'SE Asia', lat: 8.0, lon: 104.0, psh: 4.8 },
  { label: 'South Pacific', lat: -17.0, lon: -149.0, psh: 5.2 },
  { label: 'East Coast US', lat: 28.0, lon: -80.0, psh: 4.5 },
  { label: 'West Coast US', lat: 34.0, lon: -118.0, psh: 5.0 },
  { label: 'Indian Ocean', lat: -4.0, lon: 55.0, psh: 5.3 },
  { label: 'Red Sea', lat: 22.0, lon: 38.0, psh: 6.0 },
];

const selectData = REGIONS.map((r) => ({
  value: r.label,
  label: `${r.label} (${r.psh} psh)`,
}));

export function RegionPicker() {
  const regionName = useSolarStore((s) => s.regionName);
  const setLocation = useSolarStore((s) => s.setLocation);

  const handleChange = (value: string | null) => {
    if (!value) return;
    const region = REGIONS.find((r) => r.label === value);
    if (region) {
      setLocation(region.lat, region.lon, region.label);
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
