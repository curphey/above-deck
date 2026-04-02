import { useState } from 'react';
import { Title, TextInput, Avatar, Group, Text, Button, Badge } from '@mantine/core';
import { IconSearch, IconBan, IconCheck } from '@tabler/icons-react';
import { DataTable } from 'mantine-datatable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createSupabaseClient } from '@/lib/supabase';
import { AdminLayout } from './AdminLayout';
import { HEADING_FONT } from '@above-deck/shared/theme/fonts';

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  is_banned: boolean;
}

function useUsers(search: string) {
  return useQuery({
    queryKey: ['admin', 'users', search],
    queryFn: async () => {
      const supabase = createSupabaseClient();
      let query = supabase
        .from('profiles')
        .select('id, display_name, avatar_url, created_at, is_banned')
        .order('created_at', { ascending: false })
        .limit(100);

      if (search.trim()) {
        // Escape special PostgREST characters per lessons.md
        const escaped = search.replace(/[%_,]/g, (c) => `\\${c}`);
        query = query.ilike('display_name', `%${escaped}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });
}

function UsersContent() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useUsers(search);

  const banMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/users/${id}/ban`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to toggle ban');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  return (
    <>
      <Title order={2} ff={HEADING_FONT} mb="lg">
        Users
      </Title>

      <TextInput
        placeholder="Search by display name..."
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        mb="md"
        maw={400}
      />

      <DataTable
        minHeight={200}
        fetching={isLoading}
        records={users ?? []}
        columns={[
          {
            accessor: 'avatar_url',
            title: '',
            width: 50,
            render: (record) => (
              <Avatar src={record.avatar_url} size="sm" radius="xl" />
            ),
          },
          {
            accessor: 'display_name',
            title: 'Name',
            render: (record) => (
              <Text size="sm">{record.display_name ?? 'Unnamed'}</Text>
            ),
          },
          {
            accessor: 'created_at',
            title: 'Joined',
            render: (record) => (
              <Text size="sm">{new Date(record.created_at).toLocaleDateString()}</Text>
            ),
          },
          {
            accessor: 'is_banned',
            title: 'Status',
            render: (record) =>
              record.is_banned ? (
                <Badge color="red" variant="light" size="sm">Banned</Badge>
              ) : (
                <Badge color="green" variant="light" size="sm">Active</Badge>
              ),
          },
          {
            accessor: 'actions',
            title: 'Actions',
            render: (record) => (
              <Button
                size="compact-xs"
                variant="subtle"
                color={record.is_banned ? 'green' : 'red'}
                leftSection={record.is_banned ? <IconCheck size={14} /> : <IconBan size={14} />}
                onClick={() => banMutation.mutate(record.id)}
                loading={banMutation.isPending}
              >
                {record.is_banned ? 'Unban' : 'Ban'}
              </Button>
            ),
          },
        ]}
        noRecordsText="No users found"
      />
    </>
  );
}

export function AdminUsers() {
  return (
    <AdminLayout>
      <UsersContent />
    </AdminLayout>
  );
}
