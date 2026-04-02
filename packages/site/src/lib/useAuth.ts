import { useState, useEffect } from 'react';
import { createSupabaseClient } from './supabase';

interface AuthState {
  user: { id: string; email: string; name: string; avatar: string; role: string } | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    const supabase = createSupabaseClient();

    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (!authUser) {
        setState({ user: null, loading: false });
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, role')
        .eq('id', authUser.id)
        .single();

      setState({
        user: {
          id: authUser.id,
          email: authUser.email || '',
          name: profile?.display_name || authUser.user_metadata?.full_name || '',
          avatar: profile?.avatar_url || authUser.user_metadata?.avatar_url || '',
          role: profile?.role || 'user',
        },
        loading: false,
      });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setState({ user: null, loading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return state;
}
