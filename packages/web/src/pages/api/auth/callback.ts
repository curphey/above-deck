import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase-server';

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies, request, redirect }) => {
  const code = url.searchParams.get('code');
  if (!code) {
    return redirect('/?error=no_code');
  }

  const supabase = createSupabaseServerClient(cookies, request);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('Auth callback error:', error);
    return redirect('/?error=auth_failed');
  }

  const rawRedirect = url.searchParams.get('redirectTo') || '/';
  // Prevent open redirect — only allow relative paths
  const redirectTo = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/';
  return redirect(redirectTo);
};
