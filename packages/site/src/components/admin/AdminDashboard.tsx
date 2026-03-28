import { SimpleGrid, Paper, Text, Title, Anchor, Loader, Center } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { createSupabaseClient } from '@/lib/supabase';
import { AdminLayout } from './AdminLayout';
import { HEADING_FONT } from '@above-deck/shared/theme/fonts';

interface StatCardProps {
  label: string;
  count: number | undefined;
  loading: boolean;
  href: string;
}

function StatCard({ label, count, loading, href }: StatCardProps) {
  return (
    <Paper p="lg" radius="sm" withBorder>
      <Text size="sm" c="dimmed" tt="uppercase" fw={500}>
        {label}
      </Text>
      {loading ? (
        <Center mt="md">
          <Loader size="sm" />
        </Center>
      ) : (
        <Title order={2} ff={HEADING_FONT} mt="xs">
          {count ?? 0}
        </Title>
      )}
      <Anchor href={href} size="sm" mt="sm" display="block">
        View all
      </Anchor>
    </Paper>
  );
}

function useCount(table: string) {
  return useQuery({
    queryKey: ['admin', 'count', table],
    queryFn: async () => {
      const supabase = createSupabaseClient();
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });
}

function usePendingReportsCount() {
  return useQuery({
    queryKey: ['admin', 'count', 'reports', 'pending'],
    queryFn: async () => {
      const supabase = createSupabaseClient();
      const { count, error } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) throw error;
      return count ?? 0;
    },
  });
}

function DashboardContent() {
  const users = useCount('profiles');
  const discussions = useCount('discussions');
  const replies = useCount('replies');
  const reports = usePendingReportsCount();

  return (
    <>
      <Title order={2} ff={HEADING_FONT} mb="lg">
        Dashboard
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <StatCard
          label="Total Users"
          count={users.data}
          loading={users.isLoading}
          href="/admin/users"
        />
        <StatCard
          label="Discussions"
          count={discussions.data}
          loading={discussions.isLoading}
          href="/admin/discussions"
        />
        <StatCard
          label="Replies"
          count={replies.data}
          loading={replies.isLoading}
          href="/admin/discussions"
        />
        <StatCard
          label="Pending Reports"
          count={reports.data}
          loading={reports.isLoading}
          href="/admin/reports"
        />
      </SimpleGrid>
    </>
  );
}

export function AdminDashboard() {
  return (
    <AdminLayout>
      <DashboardContent />
    </AdminLayout>
  );
}
