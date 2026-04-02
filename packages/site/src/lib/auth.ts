import { createSupabaseServerClient } from './supabase-server';
import type { AstroCookies } from 'astro';

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: 'user' | 'admin';
}

export async function getUser(cookies: AstroCookies, request: Request): Promise<User | null> {
  const supabase = createSupabaseServerClient(cookies, request);
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) return null;

  // Get profile with role
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url, role')
    .eq('id', authUser.id)
    .single();

  return {
    id: authUser.id,
    email: authUser.email || '',
    displayName: profile?.display_name || authUser.user_metadata?.full_name || null,
    avatarUrl: profile?.avatar_url || authUser.user_metadata?.avatar_url || null,
    role: (profile?.role as 'user' | 'admin') || 'user',
  };
}

export async function isAdmin(cookies: AstroCookies, request: Request): Promise<boolean> {
  const user = await getUser(cookies, request);
  return user?.role === 'admin';
}

export async function requireAdmin(cookies: AstroCookies, request: Request): Promise<User> {
  const user = await getUser(cookies, request);
  if (!user || user.role !== 'admin') {
    throw new Error('Unauthorized: admin access required');
  }
  return user;
}
