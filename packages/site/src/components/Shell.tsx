import { AppShell, Group, Text, ActionIcon, Anchor } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { useMantineColorScheme } from '@mantine/core';
import { AuthButton } from './AuthButton';

const NAV_LINKS = [
  { label: 'Tools', href: '/tools/solar' },
  { label: 'Knowledge', href: '/knowledge' },
  { label: 'Blog', href: '/blog' },
  { label: 'Community', href: '/community' },
] as const;

export function Shell({ children }: { children: React.ReactNode }) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Text fw={700} size="lg" ff="'Space Mono', monospace">
            Above Deck
          </Text>
          <Group gap="lg">
            {NAV_LINKS.map((link) => (
              <Anchor key={link.href} href={link.href} c="dimmed" underline="never">
                {link.label}
              </Anchor>
            ))}
            <ActionIcon
              variant="subtle"
              onClick={toggleColorScheme}
              aria-label="Toggle colour scheme"
            >
              {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
            </ActionIcon>
            <AuthButton />
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
