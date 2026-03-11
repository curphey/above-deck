import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MantineProvider } from '@mantine/core';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  createSupabaseClient: () => ({
    from: () => ({
      insert: () => Promise.resolve({ error: null }),
    }),
  }),
}));

describe('FlagModal', () => {
  it('renders reason options', async () => {
    const { FlagModal } = await import('../FlagModal');
    render(
      <MantineProvider>
        <FlagModal
          opened
          contentType="discussion"
          contentId="abc-123"
          reporterId="user-1"
          onClose={vi.fn()}
        />
      </MantineProvider>
    );
    expect(screen.getByText('Spam')).toBeInTheDocument();
    expect(screen.getByText('Harassment')).toBeInTheDocument();
    expect(screen.getByText('Off-topic')).toBeInTheDocument();
    expect(screen.getByText('Misinformation')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('disables submit until reason selected', async () => {
    const { FlagModal } = await import('../FlagModal');
    render(
      <MantineProvider>
        <FlagModal
          opened
          contentType="discussion"
          contentId="abc-123"
          reporterId="user-1"
          onClose={vi.fn()}
        />
      </MantineProvider>
    );
    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
  });
});
