import { useState } from 'react';
import {
  Container,
  Title,
  Tabs,
  Paper,
  Group,
  Text,
  Badge,
  Button,
  TextInput,
  Stack,
  Loader,
  Center,
  Modal,
  Textarea,
  Select,
} from '@mantine/core';
import { IconPlus, IconSearch, IconPin, IconMessage } from '@tabler/icons-react';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MantineProvider } from '../MantineProvider';
import { createSupabaseClient } from '@/lib/supabase';
import { timeAgo } from './timeAgo';
import { CATEGORIES, categoryLabel, categoryColor } from './categories';

// --- Discussion list item ---

interface Discussion {
  id: string;
  title: string;
  body: string;
  category: string;
  reply_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  author_id: string;
}

function DiscussionRow({ discussion }: { discussion: Discussion }) {
  return (
    <Paper
      component="a"
      href={`/community/${discussion.id}`}
      p="md"
      withBorder
      style={{
        display: 'block',
        textDecoration: 'none',
        cursor: 'pointer',
        borderColor: 'var(--mantine-color-dark-4)',
      }}
    >
      <Group justify="space-between" wrap="nowrap">
        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs">
            {discussion.is_pinned && (
              <IconPin size={14} style={{ color: '#60a5fa', flexShrink: 0 }} />
            )}
            <Text fw={500} truncate="end" style={{ color: '#e0e0e0' }}>
              {discussion.title}
            </Text>
          </Group>
          <Group gap="xs">
            <Badge
              size="xs"
              variant="light"
              color={categoryColor(discussion.category)}
            >
              {categoryLabel(discussion.category)}
            </Badge>
            <Text size="xs" c="dimmed">
              {timeAgo(discussion.created_at)}
            </Text>
          </Group>
        </Stack>
        <Group gap={4} style={{ flexShrink: 0 }}>
          <IconMessage size={14} style={{ color: '#8b8b9e' }} />
          <Text size="xs" c="dimmed">
            {discussion.reply_count}
          </Text>
        </Group>
      </Group>
    </Paper>
  );
}

// --- New discussion modal ---

function NewDiscussionModal({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<string>('general');

  const createMutation = useMutation({
    mutationFn: async () => {
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('discussions').insert({
        title,
        body,
        category,
        author_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
      setTitle('');
      setBody('');
      setCategory('general');
      onClose();
    },
  });

  const categoryOptions = CATEGORIES.map((c) => ({
    value: c,
    label: categoryLabel(c),
  }));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="New Discussion"
      size="lg"
      styles={{
        title: { fontFamily: "'Space Mono', monospace", fontWeight: 700 },
      }}
    >
      <Stack gap="md">
        <TextInput
          label="Title"
          placeholder="What's on your mind?"
          value={title}
          onChange={(e) => setTitle(e.currentTarget.value)}
          required
        />
        <Select
          label="Category"
          data={categoryOptions}
          value={category}
          onChange={(v) => setCategory(v ?? 'general')}
        />
        <Textarea
          label="Body"
          placeholder="Share your thoughts, questions, or experiences..."
          minRows={6}
          value={body}
          onChange={(e) => setBody(e.currentTarget.value)}
          required
        />
        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            loading={createMutation.isPending}
            disabled={!title.trim() || !body.trim()}
          >
            Post Discussion
          </Button>
        </Group>
        {createMutation.isError && (
          <Text size="sm" c="red">
            {(createMutation.error as Error).message}
          </Text>
        )}
      </Stack>
    </Modal>
  );
}

// --- Main inner component ---

function CommunityInner() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);

  // Check auth state
  const {} = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      return user;
    },
    staleTime: 60_000,
  });

  // Fetch discussions
  const { data: discussions, isLoading } = useQuery({
    queryKey: ['discussions', activeTab],
    queryFn: async () => {
      const supabase = createSupabaseClient();
      let query = supabase
        .from('discussions')
        .select('*')
        .eq('is_hidden', false)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });

      if (activeTab !== 'all') {
        query = query.eq('category', activeTab);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Discussion[];
    },
  });

  const filtered = (discussions ?? []).filter((d) =>
    search ? d.title.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Title order={1} ff="'Space Mono', monospace">
            Community
          </Title>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setModalOpen(true)}
            disabled={!user}
            title={!user ? 'Sign in to start a discussion' : undefined}
          >
            New Discussion
          </Button>
        </Group>

        <TextInput
          placeholder="Search discussions..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />

        <Tabs value={activeTab} onChange={(v) => setActiveTab(v ?? 'all')}>
          <Tabs.List style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
            <Tabs.Tab value="all">All</Tabs.Tab>
            {CATEGORIES.map((cat) => (
              <Tabs.Tab key={cat} value={cat}>
                {categoryLabel(cat)}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>

        {isLoading ? (
          <Center py="xl">
            <Loader size="md" />
          </Center>
        ) : filtered.length === 0 ? (
          <Center py="xl">
            <Text c="dimmed">
              {search ? 'No discussions match your search.' : 'No discussions yet. Start one!'}
            </Text>
          </Center>
        ) : (
          <Stack gap="xs">
            {filtered.map((d) => (
              <DiscussionRow key={d.id} discussion={d} />
            ))}
          </Stack>
        )}
      </Stack>

      <NewDiscussionModal opened={modalOpen} onClose={() => setModalOpen(false)} />
    </Container>
  );
}

// --- Public export with providers ---

export function CommunityPage() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <CommunityInner />
      </QueryClientProvider>
    </MantineProvider>
  );
}
