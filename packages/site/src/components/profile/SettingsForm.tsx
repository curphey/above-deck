import { useState } from 'react';
import {
  Avatar,
  Button,
  Container,
  Group,
  Loader,
  Center,
  NumberInput,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { QueryClient, QueryClientProvider, useQuery, useMutation } from '@tanstack/react-query';
import { MantineProvider } from '../MantineProvider';
import { createSupabaseClient } from '@/lib/supabase';
import { HEADING_FONT } from '@/theme/fonts';

interface ProfileData {
  bio: string | null;
  boat_name: string | null;
  boat_type: string | null;
  boat_length_ft: number | null;
  home_port: string | null;
  cruising_area: string | null;
}

const BOAT_TYPES = [
  { value: 'mono', label: 'Monohull' },
  { value: 'cat', label: 'Catamaran' },
  { value: 'tri', label: 'Trimaran' },
];

function SettingsInner() {
  const [bio, setBio] = useState('');
  const [boatName, setBoatName] = useState('');
  const [boatType, setBoatType] = useState<string | null>(null);
  const [boatLength, setBoatLength] = useState<number | string>('');
  const [homePort, setHomePort] = useState('');
  const [cruisingArea, setCruisingArea] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch auth user
  const { data: user } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
    staleTime: 60_000,
  });

  // Fetch profile and populate form fields
  const { isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('bio, boat_name, boat_type, boat_length_ft, home_port, cruising_area')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      setBio(data.bio ?? '');
      setBoatName(data.boat_name ?? '');
      setBoatType(data.boat_type ?? null);
      setBoatLength(data.boat_length_ft ?? '');
      setHomePort(data.home_port ?? '');
      setCruisingArea(data.cruising_area ?? '');
      return data as ProfileData;
    },
    refetchOnWindowFocus: false,
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const supabase = createSupabaseClient();
      const { error } = await supabase
        .from('profiles')
        .update({
          bio: bio || null,
          boat_name: boatName || null,
          boat_type: boatType || null,
          boat_length_ft: typeof boatLength === 'number' ? boatLength : null,
          home_port: homePort || null,
          cruising_area: cruisingArea || null,
        })
        .eq('id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'Profile saved.' });
    },
    onError: (error: Error) => {
      setFeedback({ type: 'error', message: error.message });
    },
  });

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? '';
  const avatarUrl = user?.user_metadata?.avatar_url ?? '';

  if (!user && !isLoading) {
    return (
      <Container size="sm" py="xl">
        <Center>
          <Text c="dimmed">Sign in to manage your profile settings.</Text>
        </Center>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container size="sm" py="xl">
        <Center>
          <Loader size="md" />
        </Center>
      </Container>
    );
  }

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Title order={1} ff={HEADING_FONT}>
          Settings
        </Title>

        <Group gap="md">
          <Avatar src={avatarUrl} alt={displayName} radius="xl" size="lg" />
          <Stack gap={4}>
            <Text size="sm" c="dimmed">
              Synced from Google
            </Text>
          </Stack>
        </Group>

        <TextInput
          label="Display Name"
          value={displayName}
          readOnly
          styles={{
            input: { opacity: 0.7, cursor: 'not-allowed' },
          }}
        />

        <Textarea
          label="Bio"
          placeholder="Tell the community about yourself..."
          minRows={3}
          value={bio}
          onChange={(e) => setBio(e.currentTarget.value)}
        />

        <TextInput
          label="Boat Name"
          placeholder="e.g. Serenity"
          value={boatName}
          onChange={(e) => setBoatName(e.currentTarget.value)}
        />

        <Select
          label="Boat Type"
          placeholder="Select boat type"
          data={BOAT_TYPES}
          value={boatType}
          onChange={setBoatType}
          clearable
        />

        <NumberInput
          label="Boat Length (ft)"
          placeholder="e.g. 38"
          min={10}
          max={200}
          value={boatLength}
          onChange={setBoatLength}
        />

        <TextInput
          label="Home Port"
          placeholder="e.g. Grenada"
          value={homePort}
          onChange={(e) => setHomePort(e.currentTarget.value)}
        />

        <TextInput
          label="Cruising Area"
          placeholder="e.g. Caribbean"
          value={cruisingArea}
          onChange={(e) => setCruisingArea(e.currentTarget.value)}
        />

        <Group justify="flex-start">
          <Button
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
          >
            Save Profile
          </Button>
        </Group>

        {feedback && (
          <Text
            size="sm"
            c={feedback.type === 'success' ? 'green' : 'red'}
          >
            {feedback.message}
          </Text>
        )}
      </Stack>
    </Container>
  );
}

export function SettingsForm() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <SettingsInner />
      </QueryClientProvider>
    </MantineProvider>
  );
}
