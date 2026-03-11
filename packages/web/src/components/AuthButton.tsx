import { useEffect, useState } from 'react';
import { Anchor, Avatar, Menu } from '@mantine/core';
import { IconLogout } from '@tabler/icons-react';
import { createSupabaseClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null;

  if (user) {
    const name =
      user.user_metadata?.full_name ?? user.email ?? 'User';
    const avatar = user.user_metadata?.avatar_url ?? '';

    return (
      <Menu shadow="md" width={200}>
        <Menu.Target>
          <Avatar
            src={avatar}
            alt={name}
            radius="xl"
            size="sm"
            style={{ cursor: 'pointer' }}
          />
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>{name}</Menu.Label>
          <Menu.Item
            leftSection={<IconLogout size={14} />}
            component="form"
            action="/api/auth/signout"
            method="post"
          >
            Sign out
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    );
  }

  const redirectTo = encodeURIComponent(window.location.pathname);

  return (
    <Anchor
      href={`/api/auth/signin?redirectTo=${redirectTo}`}
      c="dimmed"
      underline="never"
      size="sm"
    >
      Sign In
    </Anchor>
  );
}
