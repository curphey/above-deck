import { Button, Avatar, Menu } from '@mantine/core';
import { IconBrandGoogle, IconLogout } from '@tabler/icons-react';

interface AuthButtonProps {
  user: { name: string; avatar: string } | null;
}

export function AuthButton({ user }: AuthButtonProps) {
  if (user) {
    return (
      <Menu shadow="md" width={200}>
        <Menu.Target>
          <Avatar src={user.avatar} alt={user.name} radius="xl" size="sm" style={{ cursor: 'pointer' }} />
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>{user.name}</Menu.Label>
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

  return (
    <form action="/api/auth/signin" method="post">
      <input type="hidden" name="provider" value="google" />
      <Button type="submit" variant="subtle" leftSection={<IconBrandGoogle size={16} />} size="sm">
        Sign in
      </Button>
    </form>
  );
}
