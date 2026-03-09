import type { APIRoute } from 'astro';
import { createSupabaseClient } from '../../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  const supabase = createSupabaseClient();
  const formData = await request.formData();
  const provider = formData.get('provider')?.toString();

  if (provider !== 'google') {
    return new Response('Only Google sign-in is supported', { status: 400 });
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${new URL(request.url).origin}/api/auth/callback`,
    },
  });

  if (error) {
    console.error('Sign-in error:', error);
    return new Response('Authentication failed', { status: 500 });
  }

  return redirect(data.url);
};
