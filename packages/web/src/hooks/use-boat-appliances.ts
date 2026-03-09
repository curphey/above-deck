import { useQuery } from '@tanstack/react-query';
import { createSupabaseClient } from '@/lib/supabase';
import type { Appliance } from '@/lib/solar/types';

export function transformToStockAppliances(rows: any[] | null): Appliance[] {
  if (!rows) return [];
  return rows.map((row): Appliance => ({
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
    origin: 'stock',
  }));
}

export function useBoatAppliances(boatModelId: string | null) {
  const supabase = createSupabaseClient();

  return useQuery({
    queryKey: ['boat-appliances', boatModelId],
    queryFn: async () => {
      const { data: boat, error: boatError } = await supabase
        .from('boat_model_templates')
        .select('default_appliance_ids')
        .eq('id', boatModelId!)
        .single();
      if (boatError) throw boatError;

      const ids = boat.default_appliance_ids;
      if (!ids || ids.length === 0) return [];

      const { data, error } = await supabase
        .from('power_consumers')
        .select('*')
        .in('id', ids)
        .order('sort_order');
      if (error) throw error;

      return transformToStockAppliances(data);
    },
    enabled: !!boatModelId,
    staleTime: 1000 * 60 * 60,
  });
}
