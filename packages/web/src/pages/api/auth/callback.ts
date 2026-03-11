import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase-server';

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get('code');
  if (!code) {
    return redirect('/?error=no_code');
  }

  const supabase = createSupabaseServerClient(cookies);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('Auth callback error:', error);
    return redirect('/?error=auth_failed');
  }

  const redirectTo = url.searchParams.get('redirectTo') || '/';
  return redirect(redirectTo);
};
