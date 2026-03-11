import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '../../../../lib/supabase-server';
import { isAdmin } from '../../../../lib/admin';

export const prerender = false;

function getAdminClient() {
  return createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function verifyAdmin(cookies: Parameters<APIRoute>[0]['cookies']) {
  const supabase = createSupabaseServerClient(cookies);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.id)) return null;
  return user;
}

export const GET: APIRoute = async ({ params, cookies }) => {
  const user = await verifyAdmin(cookies);
  if (!user) return new Response('Forbidden', { status: 403 });

  const adminClient = getAdminClient();
  const { data, error } = await adminClient
    .from('blog_posts')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !data) {
    return new Response(JSON.stringify({ error: 'Post not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ params, cookies, request }) => {
  const user = await verifyAdmin(cookies);
  if (!user) return new Response('Forbidden', { status: 403 });

  const adminClient = getAdminClient();
  const body = await request.json();

  // If publishing for the first time, set published_at
  const updates: Record<string, unknown> = { ...body, updated_at: new Date().toISOString() };
  if (body.published && !body.published_at) {
    updates.published_at = new Date().toISOString();
  }

  const { data, error } = await adminClient
    .from('blog_posts')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const user = await verifyAdmin(cookies);
  if (!user) return new Response('Forbidden', { status: 403 });

  const adminClient = getAdminClient();
  const { error } = await adminClient
    .from('blog_posts')
    .delete()
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
