import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerClient } from './lib/supabase-server';
import { isAdmin } from './lib/admin';

export const onRequest = defineMiddleware(async ({ url, cookies, redirect, locals }, next) => {
  // Only gate /admin routes
  if (!url.pathname.startsWith('/admin')) {
    return next();
  }

  const supabase = createSupabaseServerClient(cookies);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.id)) {
    return redirect('/');
  }

  // Make user available to admin pages
  locals.user = user;
  return next();
});
