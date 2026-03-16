import { useState } from 'react';
import {
  Avatar,
  Badge,
  Card,
  Container,
  Group,
  Loader,
  Center,
  Paper,
  Stack,
  Text,
  Title,
  Anchor,
} from '@mantine/core';
import { IconSailboat, IconMapPin, IconMessage } from '@tabler/icons-react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { MantineProvider } from '../MantineProvider';
import { createSupabaseClient } from '@/lib/supabase';
import { HEADING_FONT } from '@/theme/fonts';
import { timeAgo } from '../community/timeAgo';

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  boat_name: string | null;
  boat_type: string | null;
  boat_length_ft: number | null;
  home_port: string | null;
  cruising_area: string | null;
}

interface Discussion {
  id: string;
  title: string;
  category: string;
  reply_count: number;
  created_at: string;
}

const BOAT_TYPE_LABELS: Record<string, string> = {
  mono: 'Monohull',
  cat: 'Catamaran',
  tri: 'Trimaran',
};

function ProfileInner({ userId }: { userId: string }) {
  // Fetch profile
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['public-profile', userId],
    queryFn: async () => {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, bio, boat_name, boat_type, boat_length_ft, home_port, cruising_area')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data as Profile;
    },
  });

  // Fetch recent discussions by this user
  const { data: discussions } = useQuery({
    queryKey: ['user-discussions', userId],
    enabled: !!profile,
    queryFn: async () => {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('discussions')
        .select('id, title, category, reply_count, created_at')
        .eq('author_id', userId)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as Discussion[];
    },
  });

  if (loadingProfile) {
    return (
      <Container size="sm" py="xl">
        <Center>
          <Loader size="md" />
        </Center>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container size="sm" py="xl">
        <Center>
          <Text c="dimmed">Profile not found.</Text>
        </Center>
      </Container>
    );
  }

  const displayName = profile.display_name ?? 'Sailor';
  const boatInfo = [
    profile.boat_name,
    profile.boat_type ? BOAT_TYPE_LABELS[profile.boat_type] ?? profile.boat_type : null,
    profile.boat_length_ft ? `${profile.boat_length_ft} ft` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Card withBorder padding="lg" style={{ borderColor: 'var(--mantine-color-dark-4)' }}>
          <Stack gap="md">
            <Group gap="md">
              <Avatar
                src={profile.avatar_url}
                alt={displayName}
                radius="xl"
                size="xl"
              />
              <Stack gap={4}>
                <Title order={2} ff={HEADING_FONT}>
                  {displayName}
                </Title>
                {profile.home_port && (
                  <Group gap={4}>
                    <IconMapPin size={14} style={{ color: '#8b8b9e' }} />
                    <Text size="sm" c="dimmed">
                      {profile.home_port}
                    </Text>
                  </Group>
                )}
              </Stack>
            </Group>

            {profile.bio && (
              <Text style={{ color: '#e0e0e0' }}>{profile.bio}</Text>
            )}

            {boatInfo && (
              <Group gap="xs">
                <IconSailboat size={16} style={{ color: '#8b8b9e' }} />
                <Text size="sm" c="dimmed">
                  {boatInfo}
                </Text>
              </Group>
            )}

            {profile.cruising_area && (
              <Badge variant="light" color="blue" size="sm">
                {profile.cruising_area}
              </Badge>
            )}
          </Stack>
        </Card>

        {/* Recent discussions */}
        {discussions && discussions.length > 0 && (
          <Stack gap="sm">
            <Title order={3} ff={HEADING_FONT} size="h4">
              Recent Discussions
            </Title>
            {discussions.map((d) => (
              <Paper
                key={d.id}
                component="a"
                href={`/community/${d.id}`}
                p="sm"
                withBorder
                style={{
                  display: 'block',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  borderColor: 'var(--mantine-color-dark-4)',
                }}
              >
                <Group justify="space-between" wrap="nowrap">
                  <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                    <Text size="sm" fw={500} truncate="end" style={{ color: '#e0e0e0' }}>
                      {d.title}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {timeAgo(d.created_at)}
                    </Text>
                  </Stack>
                  <Group gap={4} style={{ flexShrink: 0 }}>
                    <IconMessage size={14} style={{ color: '#8b8b9e' }} />
                    <Text size="xs" c="dimmed">
                      {d.reply_count}
                    </Text>
                  </Group>
                </Group>
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}

export function PublicProfile({ userId }: { userId: string }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <ProfileInner userId={userId} />
      </QueryClientProvider>
    </MantineProvider>
  );
}
