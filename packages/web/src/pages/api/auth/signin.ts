import type { APIRoute } from 'astro';
import { createSupabaseClient } from '../../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ request, redirect }) => {
  const supabase = createSupabaseClient();
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get('redirectTo') || '/';

  const callbackUrl = new URL('/api/auth/callback', url.origin);
  callbackUrl.searchParams.set('redirectTo', redirectTo);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl.toString(),
    },
  });

  if (error) {
    console.error('Sign-in error:', error);
    return new Response('Authentication failed', { status: 500 });
  }

  return redirect(data.url);
};
