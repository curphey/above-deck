import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  createSupabaseClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      onAuthStateChange: vi
        .fn()
        .mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  }),
}));

import { MantineProvider as TestProvider } from '@mantine/core';

function wrap(ui: React.ReactElement) {
  return render(<TestProvider>{ui}</TestProvider>);
}

describe('AuthButton', () => {
  beforeEach(() => {
    vi.resetModules();
    Object.defineProperty(window, 'location', {
      value: { pathname: '/community', search: '', origin: 'http://localhost' },
      writable: true,
      configurable: true,
    });
  });

  it('renders sign in link with redirectTo when not authenticated', async () => {
    const { AuthButton } = await import('../AuthButton');
    wrap(<AuthButton />);
    const signInLink = await screen.findByText('Sign In');
    expect(signInLink.closest('a')).toHaveAttribute(
      'href',
      expect.stringContaining('redirectTo'),
    );
  });

  it('includes current pathname in redirectTo param', async () => {
    const { AuthButton } = await import('../AuthButton');
    wrap(<AuthButton />);
    const signInLink = await screen.findByText('Sign In');
    const href = signInLink.closest('a')?.getAttribute('href') ?? '';
    expect(href).toContain(encodeURIComponent('/community'));
  });
});
