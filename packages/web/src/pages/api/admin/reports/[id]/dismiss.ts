import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '../../../../../lib/supabase-server';
import { isAdmin } from '../../../../../lib/admin';

export const prerender = false;

export const POST: APIRoute = async ({ params, cookies }) => {
  const supabase = createSupabaseServerClient(cookies);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.id)) {
    return new Response('Forbidden', { status: 403 });
  }

  const adminClient = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { error } = await adminClient
    .from('reports')
    .update({ status: 'dismissed', resolved_at: new Date().toISOString() })
    .eq('id', params.id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
