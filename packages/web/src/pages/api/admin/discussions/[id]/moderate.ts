import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '../../../../../lib/supabase-server';
import { isAdmin } from '../../../../../lib/admin';

export const prerender = false;

type ModAction = 'pin' | 'unpin' | 'lock' | 'unlock' | 'hide' | 'unhide' | 'delete';

const VALID_ACTIONS: ModAction[] = ['pin', 'unpin', 'lock', 'unlock', 'hide', 'unhide', 'delete'];

export const POST: APIRoute = async ({ params, request, cookies }) => {
  const supabase = createSupabaseServerClient(cookies, request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.id)) {
    return new Response('Forbidden', { status: 403 });
  }

  const { action } = await request.json() as { action: ModAction };
  if (!VALID_ACTIONS.includes(action)) {
    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const adminClient = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (action === 'delete') {
    const { error } = await adminClient
      .from('discussions')
      .delete()
      .eq('id', params.id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } else {
    const updateMap: Record<string, Record<string, boolean>> = {
      pin: { is_pinned: true },
      unpin: { is_pinned: false },
      lock: { is_locked: true },
      unlock: { is_locked: false },
      hide: { is_hidden: true },
      unhide: { is_hidden: false },
    };

    const { error } = await adminClient
      .from('discussions')
      .update(updateMap[action])
      .eq('id', params.id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
