import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase-server';

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies, request }) => {
  const slug = url.searchParams.get('slug');
  if (!slug) {
    return new Response(JSON.stringify({ error: 'Missing slug' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createSupabaseServerClient(cookies, request);
  const { data, error } = await supabase
    .from('kb_comments')
    .select('*, profiles(display_name, avatar_url)')
    .eq('article_slug', slug)
    .order('created_at', { ascending: true });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ cookies, request }) => {
  const supabase = createSupabaseServerClient(cookies, request);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await request.json();
  const { article_slug, content, parent_id, anchor_text, anchor_start_offset, anchor_section } = body;

  if (!article_slug || !content) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data, error } = await supabase
    .from('kb_comments')
    .insert({
      article_slug,
      user_id: user.id,
      content,
      parent_id: parent_id || null,
      anchor_text: anchor_text || null,
      anchor_start_offset: anchor_start_offset ?? null,
      anchor_section: anchor_section || null,
    })
    .select('*, profiles(display_name, avatar_url)')
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PATCH: APIRoute = async ({ url, cookies, request }) => {
  const supabase = createSupabaseServerClient(cookies, request);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await request.json();
  const { id, resolved } = body;

  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing comment id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const update: Record<string, unknown> = {};
  if (typeof resolved === 'boolean') {
    update.resolved = resolved;
    update.resolved_by = resolved ? user.id : null;
  }

  const { data, error } = await supabase
    .from('kb_comments')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
};
