import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '../../../../../lib/supabase-server';
import { isAdmin } from '../../../../../lib/admin';

export const prerender = false;

export const POST: APIRoute = async ({ params, request, cookies }) => {
  const supabase = createSupabaseServerClient(cookies);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.id)) {
    return new Response('Forbidden', { status: 403 });
  }

  const { action } = await request.json() as { action: 'hide' | 'delete' };
  if (!['hide', 'delete'].includes(action)) {
    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const adminClient = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Fetch the report to determine content type and ID
  const { data: report, error: fetchError } = await adminClient
    .from('reports')
    .select('content_type, content_id')
    .eq('id', params.id)
    .single();

  if (fetchError || !report) {
    return new Response(JSON.stringify({ error: 'Report not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const table = report.content_type === 'discussion' ? 'discussions' : 'replies';

  if (action === 'hide') {
    const { error } = await adminClient
      .from(table)
      .update({ is_hidden: true })
      .eq('id', report.content_id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } else {
    const { error } = await adminClient
      .from(table)
      .delete()
      .eq('id', report.content_id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Mark report as actioned
  const { error: updateError } = await adminClient
    .from('reports')
    .update({ status: 'actioned', resolved_at: new Date().toISOString() })
    .eq('id', params.id);

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
