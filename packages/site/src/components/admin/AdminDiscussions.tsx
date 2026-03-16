import { Title, Group, Button, Text, Badge, ActionIcon, Tooltip } from '@mantine/core';
import {
  IconPin,
  IconPinnedOff,
  IconLock,
  IconLockOpen,
  IconEye,
  IconEyeOff,
  IconTrash,
} from '@tabler/icons-react';
import { DataTable } from 'mantine-datatable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createSupabaseClient } from '@/lib/supabase';
import { AdminLayout } from './AdminLayout';
import { HEADING_FONT } from '@/theme/fonts';

type ModAction = 'pin' | 'unpin' | 'lock' | 'unlock' | 'hide' | 'unhide' | 'delete';

interface Discussion {
  id: string;
  title: string;
  category: string;
  reply_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  is_hidden: boolean;
  author: { display_name: string } | null;
}

function useDiscussions() {
  return useQuery({
    queryKey: ['admin', 'discussions'],
    queryFn: async () => {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('discussions')
        .select('id, title, category, reply_count, is_pinned, is_locked, is_hidden, author:profiles!discussions_author_id_fkey(display_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Discussion[];
    },
  });
}

function DiscussionsContent() {
  const queryClient = useQueryClient();
  const { data: discussions, isLoading } = useDiscussions();

  const moderateMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: ModAction }) => {
      const res = await fetch(`/api/admin/discussions/${id}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error('Failed to moderate');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'discussions'] }),
  });

  const isMutating = moderateMutation.isPending;

  return (
    <>
      <Title order={2} ff={HEADING_FONT} mb="lg">
        Discussions
      </Title>

      <DataTable
        minHeight={200}
        fetching={isLoading}
        records={discussions ?? []}
        columns={[
          {
            accessor: 'title',
            title: 'Title',
            render: (record) => (
              <Text size="sm" lineClamp={1}>{record.title}</Text>
            ),
          },
          {
            accessor: 'category',
            title: 'Category',
            render: (record) => (
              <Badge variant="light" size="sm">{record.category}</Badge>
            ),
          },
          {
            accessor: 'author',
            title: 'Author',
            render: (record) => (
              <Text size="sm">{record.author?.display_name ?? 'Unknown'}</Text>
            ),
          },
          {
            accessor: 'reply_count',
            title: 'Replies',
            textAlign: 'center' as const,
          },
          {
            accessor: 'flags',
            title: 'Flags',
            render: (record) => (
              <Group gap={4} wrap="nowrap">
                {record.is_pinned && <Badge size="xs" color="blue" variant="light">Pinned</Badge>}
                {record.is_locked && <Badge size="xs" color="yellow" variant="light">Locked</Badge>}
                {record.is_hidden && <Badge size="xs" color="red" variant="light">Hidden</Badge>}
              </Group>
            ),
          },
          {
            accessor: 'actions',
            title: 'Actions',
            render: (record) => (
              <Group gap={4} wrap="nowrap">
                <Tooltip label={record.is_pinned ? 'Unpin' : 'Pin'}>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="blue"
                    onClick={() => moderateMutation.mutate({
                      id: record.id,
                      action: record.is_pinned ? 'unpin' : 'pin',
                    })}
                    loading={isMutating}
                  >
                    {record.is_pinned ? <IconPinnedOff size={14} /> : <IconPin size={14} />}
                  </ActionIcon>
                </Tooltip>
                <Tooltip label={record.is_locked ? 'Unlock' : 'Lock'}>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="yellow"
                    onClick={() => moderateMutation.mutate({
                      id: record.id,
                      action: record.is_locked ? 'unlock' : 'lock',
                    })}
                    loading={isMutating}
                  >
                    {record.is_locked ? <IconLockOpen size={14} /> : <IconLock size={14} />}
                  </ActionIcon>
                </Tooltip>
                <Tooltip label={record.is_hidden ? 'Unhide' : 'Hide'}>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="orange"
                    onClick={() => moderateMutation.mutate({
                      id: record.id,
                      action: record.is_hidden ? 'unhide' : 'hide',
                    })}
                    loading={isMutating}
                  >
                    {record.is_hidden ? <IconEye size={14} /> : <IconEyeOff size={14} />}
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Delete">
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="red"
                    onClick={() => moderateMutation.mutate({ id: record.id, action: 'delete' })}
                    loading={isMutating}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            ),
          },
        ]}
        noRecordsText="No discussions found"
      />
    </>
  );
}

export function AdminDiscussions() {
  return (
    <AdminLayout>
      <DiscussionsContent />
    </AdminLayout>
  );
}
