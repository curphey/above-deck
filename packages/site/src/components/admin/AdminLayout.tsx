import { useState } from 'react';
import { AppShell, NavLink, Title, Stack } from '@mantine/core';
import {
  IconDashboard,
  IconFlag,
  IconUsers,
  IconMessages,
  IconArticle,
} from '@tabler/icons-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '../MantineProvider';
import { HEADING_FONT } from '@/theme/fonts';

const NAV_ITEMS = [
  { label: 'Overview', href: '/admin', icon: IconDashboard },
  { label: 'Reports', href: '/admin/reports', icon: IconFlag },
  { label: 'Users', href: '/admin/users', icon: IconUsers },
  { label: 'Discussions', href: '/admin/discussions', icon: IconMessages },
  { label: 'Blog', href: '/admin/blog', icon: IconArticle },
];

function AdminShell({ children }: { children: React.ReactNode }) {
  const currentPath = window.location.pathname;

  return (
    <AppShell navbar={{ width: 220, breakpoint: 'sm' }} padding="md">
      <AppShell.Navbar p="md">
        <Title order={4} ff={HEADING_FONT} mb="lg">
          Admin
        </Title>
        <Stack gap={4}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              component="a"
              href={item.href}
              label={item.label}
              leftSection={<item.icon size={16} />}
              active={
                currentPath === item.href ||
                (item.href !== '/admin' && currentPath.startsWith(item.href))
              }
            />
          ))}
        </Stack>
      </AppShell.Navbar>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <AdminShell>{children}</AdminShell>
      </QueryClientProvider>
    </MantineProvider>
  );
}
