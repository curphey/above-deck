import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { MantineProvider } from '@mantine/core';

vi.mock('@/lib/supabase', () => ({
  createSupabaseClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'user-1',
            user_metadata: {
              full_name: 'Test User',
              avatar_url: 'https://example.com/avatar.jpg',
            },
          },
        },
      }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () =>
            Promise.resolve({
              data: {
                bio: 'Sailor',
                boat_name: 'Serenity',
                boat_type: 'mono',
                boat_length_ft: 38,
                home_port: 'Grenada',
                cruising_area: 'Caribbean',
              },
              error: null,
            }),
        }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
  }),
}));

describe('SettingsForm', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('renders profile fields', async () => {
    const { SettingsForm } = await import('../SettingsForm');
    render(
      <MantineProvider>
        <SettingsForm />
      </MantineProvider>,
    );
    expect(await screen.findByLabelText('Bio')).toBeInTheDocument();
    expect(screen.getByLabelText('Boat Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Home Port')).toBeInTheDocument();
  });

  it('shows display name as read-only', async () => {
    const { SettingsForm } = await import('../SettingsForm');
    render(
      <MantineProvider>
        <SettingsForm />
      </MantineProvider>,
    );
    const nameField = await screen.findByLabelText('Display Name');
    expect(nameField).toHaveAttribute('readOnly');
  });

  it('renders boat type select', async () => {
    const { SettingsForm } = await import('../SettingsForm');
    render(
      <MantineProvider>
        <SettingsForm />
      </MantineProvider>,
    );
    await screen.findByLabelText('Bio');
    // Mantine Select renders both an input and a listbox with the label;
    // target the input specifically.
    const boatTypeInput = screen.getByRole('textbox', { name: 'Boat Type' });
    expect(boatTypeInput).toBeInTheDocument();
  });

  it('renders cruising area field', async () => {
    const { SettingsForm } = await import('../SettingsForm');
    render(
      <MantineProvider>
        <SettingsForm />
      </MantineProvider>,
    );
    expect(await screen.findByLabelText('Cruising Area')).toBeInTheDocument();
  });

  it('renders save button', async () => {
    const { SettingsForm } = await import('../SettingsForm');
    render(
      <MantineProvider>
        <SettingsForm />
      </MantineProvider>,
    );
    await screen.findByLabelText('Bio');
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });
});
