import { useQuery } from '@tanstack/react-query';
import { createSupabaseClient } from '@/lib/supabase';

export function useBoatTemplates(search: string) {
  const supabase = createSupabaseClient();
  return useQuery({
    queryKey: ['boat-templates', search],
    queryFn: async () => {
      let query = supabase
        .from('boat_model_templates')
        .select('*')
        .order('make');
      if (search.length >= 2) {
        query = query.or(`make.ilike.%${search}%,model.ilike.%${search}%`);
      }
      const { data, error } = await query.limit(20);
      if (error) throw error;
      return data;
    },
    enabled: search.length >= 2,
  });
}
