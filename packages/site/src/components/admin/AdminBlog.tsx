import { useState } from 'react';
import { Title, Button, Text, Badge, Group, ActionIcon, Tooltip, Modal } from '@mantine/core';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { DataTable } from 'mantine-datatable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from './AdminLayout';
import { BlogEditor, type BlogPost } from './BlogEditor';
import { HEADING_FONT } from '@above-deck/shared/theme/fonts';

type View = { mode: 'list' } | { mode: 'create' } | { mode: 'edit'; post: BlogPost };

function useBlogPosts() {
  return useQuery({
    queryKey: ['admin', 'blog'],
    queryFn: async () => {
      const res = await fetch('/api/admin/blog');
      if (!res.ok) throw new Error('Failed to fetch posts');
      return (await res.json()) as BlogPost[];
    },
  });
}

function BlogContent() {
  const [view, setView] = useState<View>({ mode: 'list' });
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);
  const queryClient = useQueryClient();
  const { data: posts, isLoading } = useBlogPosts();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog'] });
      setDeleteTarget(null);
    },
  });

  const handleSave = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'blog'] });
    setView({ mode: 'list' });
  };

  if (view.mode === 'create') {
    return (
      <BlogEditor
        onSave={handleSave}
        onCancel={() => setView({ mode: 'list' })}
      />
    );
  }

  if (view.mode === 'edit') {
    return (
      <BlogEditor
        post={view.post}
        onSave={handleSave}
        onCancel={() => setView({ mode: 'list' })}
      />
    );
  }

  return (
    <>
      <Group justify="space-between" mb="lg">
        <Title order={2} ff={HEADING_FONT}>
          Blog Posts
        </Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setView({ mode: 'create' })}
        >
          New Post
        </Button>
      </Group>

      <DataTable
        minHeight={200}
        fetching={isLoading}
        records={posts ?? []}
        columns={[
          {
            accessor: 'title',
            title: 'Title',
            render: (record) => (
              <Text size="sm" lineClamp={1}>
                {record.title}
              </Text>
            ),
          },
          {
            accessor: 'category',
            title: 'Category',
            render: (record) => (
              <Badge variant="light" size="sm">
                {record.category}
              </Badge>
            ),
          },
          {
            accessor: 'published',
            title: 'Status',
            render: (record) =>
              record.published ? (
                <Badge color="green" variant="light" size="sm">
                  Published
                </Badge>
              ) : (
                <Badge color="gray" variant="light" size="sm">
                  Draft
                </Badge>
              ),
          },
          {
            accessor: 'published_at',
            title: 'Published',
            render: (record) => (
              <Text size="sm">
                {record.published_at
                  ? new Date(record.published_at).toLocaleDateString()
                  : '—'}
              </Text>
            ),
          },
          {
            accessor: 'actions',
            title: 'Actions',
            render: (record) => (
              <Group gap={4} wrap="nowrap">
                <Tooltip label="Edit">
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    onClick={() => setView({ mode: 'edit', post: record })}
                  >
                    <IconEdit size={14} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Delete">
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="red"
                    onClick={() => setDeleteTarget(record)}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            ),
          },
        ]}
        noRecordsText="No blog posts found"
      />

      <Modal
        opened={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Post"
        centered
      >
        <Text size="sm" mb="lg">
          Are you sure you want to delete &ldquo;{deleteTarget?.title}&rdquo;? This action cannot be
          undone.
        </Text>
        <Group justify="flex-end">
          <Button variant="subtle" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            loading={deleteMutation.isPending}
          >
            Delete
          </Button>
        </Group>
      </Modal>
    </>
  );
}

export function AdminBlog() {
  return (
    <AdminLayout>
      <BlogContent />
    </AdminLayout>
  );
}
