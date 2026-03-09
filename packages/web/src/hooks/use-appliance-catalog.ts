import { useQuery } from '@tanstack/react-query';
import { createSupabaseClient } from '@/lib/supabase';
import type { Appliance } from '@/lib/solar/types';

export function useApplianceCatalog() {
  const supabase = createSupabaseClient();
  return useQuery({
    queryKey: ['appliance-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('power_consumers')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data.map((row: any): Appliance => ({
        id: row.id,
        name: row.name,
        category: row.category,
        wattsTypical: Number(row.watts_typical),
        wattsMin: Number(row.watts_min ?? row.watts_typical * 0.6),
        wattsMax: Number(row.watts_max ?? row.watts_typical * 1.5),
        hoursPerDayAnchor: Number(row.hours_per_day_anchor),
        hoursPerDayPassage: Number(row.hours_per_day_passage),
        dutyCycle: Number(row.duty_cycle ?? 1.0),
        usageType: row.usage_type,
        crewScaling: row.crew_scaling ?? false,
        enabled: true,
      }));
    },
    staleTime: 1000 * 60 * 60,
  });
}
