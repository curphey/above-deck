import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '../../../../../lib/supabase-server';
import { isAdmin } from '../../../../../lib/admin';

export const prerender = false;

export const POST: APIRoute = async ({ params, cookies, request }) => {
  const supabase = createSupabaseServerClient(cookies, request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.id)) {
    return new Response('Forbidden', { status: 403 });
  }

  const adminClient = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Fetch current ban status
  const { data: profile, error: fetchError } = await adminClient
    .from('profiles')
    .select('is_banned')
    .eq('id', params.id)
    .single();

  if (fetchError || !profile) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { error } = await adminClient
    .from('profiles')
    .update({ is_banned: !profile.is_banned })
    .eq('id', params.id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true, is_banned: !profile.is_banned }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
