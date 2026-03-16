import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { SaveBar } from '../SaveBar';
import { theme } from '@above-deck/shared/theme/theme';

function renderWithMantine(ui: React.ReactElement) {
  return render(<MantineProvider theme={theme}>{ui}</MantineProvider>);
}

describe('SaveBar', () => {
  it('shows save button', () => {
    renderWithMantine(<SaveBar isAuthenticated={false} />);
    expect(screen.getByTestId('save-button')).toBeDefined();
    expect(screen.getByText('Save to browser')).toBeDefined();
  });

  it('shows sign-in link when not authenticated', () => {
    renderWithMantine(<SaveBar isAuthenticated={false} />);
    expect(screen.getByTestId('signin-button')).toBeDefined();
    expect(screen.getByText('Sign in to save across devices')).toBeDefined();
  });

  it('sign-in link points to auth endpoint', () => {
    renderWithMantine(<SaveBar isAuthenticated={false} />);
    const link = screen.getByTestId('signin-button');
    expect(link.getAttribute('href')).toBe('/api/auth/signin');
  });

  it('shows share button when authenticated', () => {
    renderWithMantine(<SaveBar isAuthenticated={true} />);
    expect(screen.getByTestId('share-button')).toBeDefined();
    expect(screen.getByText('Share link')).toBeDefined();
  });

  it('does not show sign-in when authenticated', () => {
    renderWithMantine(<SaveBar isAuthenticated={true} />);
    expect(screen.queryByTestId('signin-button')).toBeNull();
  });

  it('shows "Saved" feedback after clicking save', () => {
    renderWithMantine(<SaveBar isAuthenticated={false} />);
    const btn = screen.getByTestId('save-button');
    fireEvent.click(btn);
    expect(screen.getByText('Saved')).toBeDefined();
  });
});
