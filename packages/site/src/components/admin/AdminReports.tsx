import { useState } from 'react';
import { Title, SegmentedControl, Group, Button, Text, Badge } from '@mantine/core';
import { IconEyeOff, IconTrash, IconX } from '@tabler/icons-react';
import { DataTable } from 'mantine-datatable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createSupabaseClient } from '@/lib/supabase';
import { AdminLayout } from './AdminLayout';
import { HEADING_FONT } from '@above-deck/shared/theme/fonts';

type ReportStatus = 'pending' | 'actioned' | 'dismissed';

interface Report {
  id: string;
  content_type: string;
  reason: string;
  status: ReportStatus;
  created_at: string;
  reporter: { display_name: string } | null;
}

function useReports(status: ReportStatus) {
  return useQuery({
    queryKey: ['admin', 'reports', status],
    queryFn: async () => {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('reports')
        .select('id, content_type, reason, status, created_at, reporter:profiles!reports_reporter_id_fkey(display_name)')
        .eq('status', status)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Report[];
    },
  });
}

function ReportsContent() {
  const [status, setStatus] = useState<ReportStatus>('pending');
  const queryClient = useQueryClient();
  const { data: reports, isLoading } = useReports(status);

  const dismissMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/reports/${id}/dismiss`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to dismiss');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] }),
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'hide' | 'delete' }) => {
      const res = await fetch(`/api/admin/reports/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error('Failed to perform action');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] }),
  });

  const isMutating = dismissMutation.isPending || actionMutation.isPending;

  return (
    <>
      <Title order={2} ff={HEADING_FONT} mb="lg">
        Reports
      </Title>

      <SegmentedControl
        value={status}
        onChange={(val) => setStatus(val as ReportStatus)}
        data={[
          { label: 'Pending', value: 'pending' },
          { label: 'Actioned', value: 'actioned' },
          { label: 'Dismissed', value: 'dismissed' },
        ]}
        mb="md"
      />

      <DataTable
        minHeight={200}
        fetching={isLoading}
        records={reports ?? []}
        columns={[
          {
            accessor: 'content_type',
            title: 'Type',
            render: (record) => (
              <Badge variant="light" size="sm">
                {record.content_type}
              </Badge>
            ),
          },
          { accessor: 'reason', title: 'Reason' },
          {
            accessor: 'reporter',
            title: 'Reporter',
            render: (record) => (
              <Text size="sm">{record.reporter?.display_name ?? 'Unknown'}</Text>
            ),
          },
          {
            accessor: 'created_at',
            title: 'Reported',
            render: (record) => (
              <Text size="sm">{new Date(record.created_at).toLocaleDateString()}</Text>
            ),
          },
          ...(status === 'pending'
            ? [
                {
                  accessor: 'actions' as const,
                  title: 'Actions',
                  render: (record: Report) => (
                    <Group gap="xs" wrap="nowrap">
                      <Button
                        size="compact-xs"
                        variant="subtle"
                        color="gray"
                        leftSection={<IconX size={14} />}
                        onClick={() => dismissMutation.mutate(record.id)}
                        loading={isMutating}
                      >
                        Dismiss
                      </Button>
                      <Button
                        size="compact-xs"
                        variant="subtle"
                        color="yellow"
                        leftSection={<IconEyeOff size={14} />}
                        onClick={() => actionMutation.mutate({ id: record.id, action: 'hide' })}
                        loading={isMutating}
                      >
                        Hide
                      </Button>
                      <Button
                        size="compact-xs"
                        variant="subtle"
                        color="red"
                        leftSection={<IconTrash size={14} />}
                        onClick={() => actionMutation.mutate({ id: record.id, action: 'delete' })}
                        loading={isMutating}
                      >
                        Delete
                      </Button>
                    </Group>
                  ),
                },
              ]
            : []),
        ]}
        noRecordsText="No reports found"
      />
    </>
  );
}

export function AdminReports() {
  return (
    <AdminLayout>
      <ReportsContent />
    </AdminLayout>
  );
}
