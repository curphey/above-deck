import { useState } from 'react';
import {
  Container,
  Title,
  Paper,
  Group,
  Text,
  Badge,
  Button,
  Stack,
  Loader,
  Center,
  Textarea,
  Anchor,
  Divider,
} from '@mantine/core';
import { IconArrowLeft, IconSend, IconFlag } from '@tabler/icons-react';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MantineProvider } from '../MantineProvider';
import { createSupabaseClient } from '@/lib/supabase';
import { timeAgo } from './timeAgo';
import { categoryLabel, categoryColor } from './categories';
import { FlagModal } from './FlagModal';

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

interface Reply {
  id: string;
  discussion_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

// --- Reply card ---

function ReplyCard({ reply, userId }: { reply: Reply; userId?: string }) {
  const [flagOpen, setFlagOpen] = useState(false);

  return (
    <Paper p="md" withBorder style={{ borderColor: 'var(--mantine-color-dark-4)' }}>
      <Stack gap="xs">
        <Group justify="space-between">
          <Text size="xs" c="dimmed">
            {timeAgo(reply.created_at)}
          </Text>
          {userId && (
            <IconFlag
              size={14}
              style={{ color: '#8b8b9e', cursor: 'pointer' }}
              onClick={() => setFlagOpen(true)}
            />
          )}
        </Group>
        <Text size="sm" style={{ whiteSpace: 'pre-wrap', color: '#e0e0e0' }}>
          {reply.body}
        </Text>
      </Stack>
      {userId && (
        <FlagModal
          opened={flagOpen}
          contentType="reply"
          contentId={reply.id}
          reporterId={userId}
          onClose={() => setFlagOpen(false)}
        />
      )}
    </Paper>
  );
}

// --- Reply form ---

function ReplyForm({ discussionId, disabled }: { discussionId: string; disabled: boolean }) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');

  const replyMutation = useMutation({
    mutationFn: async () => {
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('replies').insert({
        discussion_id: discussionId,
        author_id: user.id,
        body,
      });
      if (error) throw error;
      // updated_at is bumped automatically by the update_reply_count trigger
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['replies', discussionId] });
      queryClient.invalidateQueries({ queryKey: ['discussion', discussionId] });
      setBody('');
    },
  });

  return (
    <Stack gap="sm">
      <Textarea
        placeholder={disabled ? 'Sign in to reply' : 'Write a reply...'}
        minRows={3}
        value={body}
        onChange={(e) => setBody(e.currentTarget.value)}
        disabled={disabled}
      />
      <Group justify="flex-end">
        <Button
          leftSection={<IconSend size={14} />}
          onClick={() => replyMutation.mutate()}
          loading={replyMutation.isPending}
          disabled={disabled || !body.trim()}
        >
          Reply
        </Button>
      </Group>
      {replyMutation.isError && (
        <Text size="sm" c="red">
          {(replyMutation.error as Error).message}
        </Text>
      )}
    </Stack>
  );
}

// --- Thread inner ---

function ThreadInner({ id }: { id: string }) {
  const [flagDiscussionOpen, setFlagDiscussionOpen] = useState(false);

  // Auth check
  const { data: user } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
    staleTime: 60_000,
  });

  // Fetch discussion
  const { data: discussion, isLoading: loadingDiscussion } = useQuery({
    queryKey: ['discussion', id],
    queryFn: async () => {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('discussions')
        .select('*')
        .eq('id', id)
        .eq('is_hidden', false)
        .single();
      if (error) throw error;
      return data as Discussion;
    },
  });

  // Fetch replies
  const { data: replies, isLoading: loadingReplies } = useQuery({
    queryKey: ['replies', id],
    queryFn: async () => {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('replies')
        .select('*')
        .eq('discussion_id', id)
        .eq('is_hidden', false)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Reply[];
    },
    enabled: !!discussion,
  });

  if (loadingDiscussion) {
    return (
      <Center py="xl">
        <Loader size="md" />
      </Center>
    );
  }

  if (!discussion) {
    return (
      <Container size="md" py="xl">
        <Stack gap="md">
          <Anchor href="/community" c="#60a5fa" underline="hover">
            <Group gap={4}>
              <IconArrowLeft size={14} />
              <Text size="sm">Back to Community</Text>
            </Group>
          </Anchor>
          <Text c="dimmed">Discussion not found.</Text>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Anchor href="/community" c="#60a5fa" underline="hover">
          <Group gap={4}>
            <IconArrowLeft size={14} />
            <Text size="sm">Back to Community</Text>
          </Group>
        </Anchor>

        {/* Discussion header */}
        <Paper p="lg" withBorder style={{ borderColor: 'var(--mantine-color-dark-4)' }}>
          <Stack gap="md">
            <Group justify="space-between">
              <Group gap="xs">
                <Badge
                  size="sm"
                  variant="light"
                  color={categoryColor(discussion.category)}
                >
                  {categoryLabel(discussion.category)}
                </Badge>
                <Text size="xs" c="dimmed">
                  {timeAgo(discussion.created_at)}
                </Text>
              </Group>
              {user && (
                <IconFlag
                  size={16}
                  style={{ color: '#8b8b9e', cursor: 'pointer' }}
                  onClick={() => setFlagDiscussionOpen(true)}
                />
              )}
            </Group>
            <Title order={2} ff="'Space Mono', monospace">
              {discussion.title}
            </Title>
            <Text style={{ whiteSpace: 'pre-wrap', color: '#e0e0e0' }}>
              {discussion.body}
            </Text>
          </Stack>
        </Paper>
        {user && (
          <FlagModal
            opened={flagDiscussionOpen}
            contentType="discussion"
            contentId={discussion.id}
            reporterId={user.id}
            onClose={() => setFlagDiscussionOpen(false)}
          />
        )}

        {/* Replies */}
        <Divider
          label={`${replies?.length ?? 0} ${(replies?.length ?? 0) === 1 ? 'reply' : 'replies'}`}
          labelPosition="left"
        />

        {loadingReplies ? (
          <Center py="md">
            <Loader size="sm" />
          </Center>
        ) : (replies ?? []).length === 0 ? (
          <Text c="dimmed" size="sm">
            No replies yet. Be the first to respond.
          </Text>
        ) : (
          <Stack gap="xs">
            {(replies ?? []).map((r) => (
              <ReplyCard key={r.id} reply={r} userId={user?.id} />
            ))}
          </Stack>
        )}

        {/* Reply form */}
        <Divider />
        <ReplyForm discussionId={id} disabled={!user} />
      </Stack>
    </Container>
  );
}

// --- Public export ---

export function DiscussionThread({ id }: { id: string }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <ThreadInner id={id} />
      </QueryClientProvider>
    </MantineProvider>
  );
}
