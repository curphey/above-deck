import { Autocomplete } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useState } from 'react';
import { useBoatTemplates } from '@/hooks/use-boat-templates';
import { useSolarStore } from '@/stores/solar';

export function BoatSelector() {
  const [search, setSearch] = useState('');
  const [debounced] = useDebouncedValue(search, 300);
  const { data: templates } = useBoatTemplates(debounced);
  const setBoatModelId = useSolarStore((s) => s.setBoatModelId);
  const setCrewSize = useSolarStore((s) => s.setCrewSize);
  const setAlternatorAmps = useSolarStore((s) => s.setAlternatorAmps);
  const setSystemVoltage = useSolarStore((s) => s.setSystemVoltage);

  const options = (templates ?? []).map((t: any) => ({
    value: `${t.make} ${t.model}`,
    ...t,
  }));

  return (
    <Autocomplete
      label="Boat model"
      placeholder="Search by make or model..."
      value={search}
      onChange={setSearch}
      data={options.map((o: any) => o.value)}
      onOptionSubmit={(value) => {
        const match = options.find((o: any) => o.value === value);
        if (match) {
          setBoatModelId(match.id);
          if (match.default_crew) setCrewSize(match.default_crew);
          if (match.alternator_amps) setAlternatorAmps(match.alternator_amps);
          if (match.system_voltage) setSystemVoltage(match.system_voltage);
        }
      }}
    />
  );
}
