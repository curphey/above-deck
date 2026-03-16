import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function createSupabaseClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          flowType: 'pkce',
        },
      }
    );
  }
  return _client;
}
