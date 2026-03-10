import { useQuery } from '@tanstack/react-query';
import { createSupabaseClient } from '@/lib/supabase';
import type { Appliance, EquipmentInstance } from '@/lib/solar/types';

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

export function transformToEquipmentInstances(
  appliances: any[],
  boatData: {
    alternator_amps?: number;
    battery_capacity_ah?: number;
    battery_type?: string;
    system_voltage?: number;
  },
): EquipmentInstance[] {
  const items: EquipmentInstance[] = [];

  for (const row of appliances) {
    items.push({
      id: `drain-${row.appliance_id || row.id}-stock`,
      catalogId: row.appliance_id || row.id,
      name: row.name,
      type: 'drain',
      enabled: true,
      origin: 'stock',
      notes: '',
      category: row.category || 'uncategorized',
      wattsTypical: row.watts_typical || 0,
      wattsMin: row.watts_min || 0,
      wattsMax: row.watts_max || 0,
      hoursPerDayAnchor: row.hours_per_day_anchor ?? row.hours_per_day ?? 0,
      hoursPerDayPassage: row.hours_per_day_passage ?? row.hours_per_day ?? 0,
      dutyCycle: row.duty_cycle ?? 1,
      crewScaling: row.crew_scaling ?? false,
      powerType: 'dc',
    });
  }

  if (boatData.alternator_amps) {
    items.push({
      id: 'charge-alternator-stock',
      catalogId: null,
      name: 'Engine Alternator',
      type: 'charge',
      enabled: true,
      origin: 'stock',
      notes: '',
      sourceType: 'alternator',
      alternatorAmps: boatData.alternator_amps,
      motoringHoursPerDay: 1.5,
    });
  }

  if (boatData.battery_capacity_ah) {
    items.push({
      id: 'store-battery-stock',
      catalogId: null,
      name: 'Battery Bank',
      type: 'store',
      enabled: true,
      origin: 'stock',
      notes: '',
      chemistry: (boatData.battery_type === 'lifepo4' ? 'lifepo4' : 'agm') as
        | 'agm'
        | 'lifepo4',
      capacityAh: boatData.battery_capacity_ah,
    });
  }

  return items;
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
