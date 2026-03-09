import { Affix, Button, Group, Paper, Text } from '@mantine/core';
import { IconDeviceFloppy, IconLogin, IconShare } from '@tabler/icons-react';
import { useCallback, useState } from 'react';

interface SaveBarProps {
  isAuthenticated: boolean;
}

export function SaveBar({ isAuthenticated }: SaveBarProps) {
  const [saved, setSaved] = useState(false);

  const handleSave = useCallback(() => {
    // Zustand persist middleware already saves to localStorage automatically.
    // This button provides visual confirmation to the user.
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  return (
    <Affix position={{ bottom: 0, left: 0, right: 0 }}>
      <Paper
        p="sm"
        withBorder
        style={{
          borderLeft: 'none',
          borderRight: 'none',
          borderBottom: 'none',
          borderRadius: 0,
        }}
      >
        <Group justify="center" gap="md">
          <Button
            leftSection={<IconDeviceFloppy size={16} />}
            variant={saved ? 'filled' : 'light'}
            color={saved ? 'green' : 'ocean'}
            onClick={handleSave}
            data-testid="save-button"
          >
            {saved ? 'Saved' : 'Save to browser'}
          </Button>

          {isAuthenticated ? (
            <Button
              leftSection={<IconShare size={16} />}
              variant="subtle"
              color="ocean"
              data-testid="share-button"
            >
              Share link
            </Button>
          ) : (
            <Button
              leftSection={<IconLogin size={16} />}
              variant="subtle"
              color="dimmed"
              component="a"
              href="/api/auth/signin"
              data-testid="signin-button"
            >
              Sign in to save across devices
            </Button>
          )}
        </Group>
      </Paper>
    </Affix>
  );
}
