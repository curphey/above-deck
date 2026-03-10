import { Autocomplete } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useState } from 'react';
import { useBoatTemplates } from '@/hooks/use-boat-templates';
import { transformToEquipmentInstances } from '@/hooks/use-boat-appliances';
import { createSupabaseClient } from '@/lib/supabase';
import { useSolarStore } from '@/stores/solar';

export function BoatSelector() {
  const [search, setSearch] = useState('');
  const [debounced] = useDebouncedValue(search, 300);
  const { data: templates } = useBoatTemplates(debounced);
  const setBoatModelId = useSolarStore((s) => s.setBoatModelId);
  const setCrewSize = useSolarStore((s) => s.setCrewSize);
  const setAlternatorAmps = useSolarStore((s) => s.setAlternatorAmps);
  const setSystemVoltage = useSolarStore((s) => s.setSystemVoltage);
  const setBoat = useSolarStore((s) => s.setBoat);

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
          // Legacy store updates (kept for backward compatibility)
          setBoatModelId(match.id);
          if (match.default_crew) setCrewSize(match.default_crew);
          if (match.alternator_amps) setAlternatorAmps(match.alternator_amps);
          if (match.system_voltage) setSystemVoltage(match.system_voltage);

          // Fetch appliance rows and wire to equipment array
          const ids = match.default_appliance_ids;
          if (ids && ids.length > 0) {
            const supabase = createSupabaseClient();
            supabase
              .from('power_consumers')
              .select('*')
              .in('id', ids)
              .order('sort_order')
              .then(({ data: rows }) => {
                const equipment = transformToEquipmentInstances(rows ?? [], {
                  alternator_amps: match.alternator_amps,
                  battery_capacity_ah: match.battery_capacity_ah,
                  battery_type: match.battery_type,
                  system_voltage: match.system_voltage,
                });
                const voltage = ([12, 24, 48].includes(match.system_voltage)
                  ? match.system_voltage
                  : 12) as 12 | 24 | 48;
                setBoat(
                  match.id,
                  `${match.make} ${match.model}`,
                  equipment,
                  voltage,
                  220,
                );
              });
          } else {
            // No appliances, still set boat with charge/store equipment
            const equipment = transformToEquipmentInstances([], {
              alternator_amps: match.alternator_amps,
              battery_capacity_ah: match.battery_capacity_ah,
              battery_type: match.battery_type,
              system_voltage: match.system_voltage,
            });
            const voltage = ([12, 24, 48].includes(match.system_voltage)
              ? match.system_voltage
              : 12) as 12 | 24 | 48;
            setBoat(
              match.id,
              `${match.make} ${match.model}`,
              equipment,
              voltage,
              220,
            );
          }
        }
      }}
    />
  );
}
