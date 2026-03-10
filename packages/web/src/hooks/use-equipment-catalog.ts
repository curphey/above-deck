import { useQuery } from '@tanstack/react-query';
import { createSupabaseClient } from '@/lib/supabase';
import type { DrainEquipment, ChargeEquipment, StoreEquipment, EquipmentInstance } from '@/lib/solar/types';

export interface CatalogRow {
  id: string;
  type: 'drain' | 'charge' | 'store';
  category: string;
  make: string | null;
  model: string | null;
  year: number | null;
  latest: boolean;
  name: string;
  specs: Record<string, unknown>;
}

export function catalogRowToEquipment(row: CatalogRow): EquipmentInstance {
  const base = {
    id: crypto.randomUUID(),
    catalogId: row.id,
    name: row.name,
    enabled: true,
    origin: 'catalog' as const,
    notes: '',
  };

  switch (row.type) {
    case 'drain':
      return {
        ...base,
        type: 'drain',
        category: row.category,
        wattsTypical: (row.specs.wattsTypical as number) ?? 0,
        wattsMin: (row.specs.wattsMin as number) ?? 0,
        wattsMax: (row.specs.wattsMax as number) ?? 0,
        hoursPerDayAnchor: (row.specs.hoursPerDayAnchor as number) ?? 0,
        hoursPerDayPassage: (row.specs.hoursPerDayPassage as number) ?? 0,
        dutyCycle: (row.specs.dutyCycle as number) ?? 1,
        crewScaling: (row.specs.crewScaling as boolean) ?? false,
        powerType: (row.specs.powerType as 'dc' | 'ac') ?? 'dc',
      } satisfies DrainEquipment;
    case 'charge':
      return {
        ...base,
        type: 'charge',
        sourceType: (row.specs.sourceType as 'solar' | 'alternator' | 'shore') ?? 'solar',
        panelWatts: row.specs.panelWatts as number | undefined,
        panelType: row.specs.panelType as 'rigid' | 'semi-flexible' | 'flexible' | undefined,
        alternatorAmps: row.specs.alternatorAmps as number | undefined,
        motoringHoursPerDay: row.specs.motoringHoursPerDay as number | undefined,
        shoreChargerAmps: row.specs.shoreChargerAmps as number | undefined,
        shoreHoursPerDay: row.specs.shoreHoursPerDay as number | undefined,
      } satisfies ChargeEquipment;
    case 'store':
      return {
        ...base,
        type: 'store',
        chemistry: (row.specs.chemistry as 'agm' | 'lifepo4') ?? 'agm',
        capacityAh: (row.specs.capacityAh as number) ?? 0,
      } satisfies StoreEquipment;
  }
}

export function useEquipmentCatalog(type: 'drain' | 'charge' | 'store', showOldModels = false) {
  const supabase = createSupabaseClient();

  return useQuery({
    queryKey: ['equipment-catalog', type, showOldModels],
    queryFn: async () => {
      let query = supabase
        .from('equipment_catalog')
        .select('*')
        .eq('type', type)
        .order('category')
        .order('name');

      if (!showOldModels) {
        query = query.eq('latest', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as CatalogRow[];
    },
    staleTime: Infinity,
  });
}
