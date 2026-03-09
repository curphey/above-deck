import { useQuery } from '@tanstack/react-query';
import { createSupabaseClient } from '@/lib/supabase';

export function useProductSpecs(componentType?: string) {
  const supabase = createSupabaseClient();
  return useQuery({
    queryKey: ['product-specs', componentType],
    queryFn: async () => {
      let query = supabase.from('product_specs').select('*');
      if (componentType) {
        query = query.eq('component_type', componentType);
      }
      const { data, error } = await query.order('make');
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 60,
  });
}
