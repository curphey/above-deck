import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '../../../../lib/supabase-server';
import { isAdmin } from '../../../../lib/admin';

export const prerender = false;

export const POST: APIRoute = async ({ cookies, request }) => {
  const supabase = createSupabaseServerClient(cookies, request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.id)) {
    return new Response('Forbidden', { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return new Response(JSON.stringify({ error: 'No file provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const adminClient = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Generate a unique filename with timestamp prefix
  const ext = file.name.split('.').pop() ?? 'jpg';
  const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const { error } = await adminClient.storage
    .from('blog-images')
    .upload(filename, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: urlData } = adminClient.storage
    .from('blog-images')
    .getPublicUrl(filename);

  return new Response(JSON.stringify({ url: urlData.publicUrl }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
