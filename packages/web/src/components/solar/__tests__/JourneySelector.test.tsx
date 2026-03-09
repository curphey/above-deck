import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { JourneySelector } from '../JourneySelector';
import { useSolarStore } from '@/stores/solar';
import { theme } from '@/theme/theme';

function renderWithMantine(ui: React.ReactElement) {
  return render(<MantineProvider theme={theme}>{ui}</MantineProvider>);
}

describe('JourneySelector', () => {
  beforeEach(() => {
    useSolarStore.setState({ journeyMode: 'new-system' });
  });

  it('renders three journey cards', () => {
    renderWithMantine(<JourneySelector />);
    expect(screen.getByTestId('journey-new-system')).toBeDefined();
    expect(screen.getByTestId('journey-check-existing')).toBeDefined();
    expect(screen.getByTestId('journey-add-upgrade')).toBeDefined();
  });

  it('displays correct titles', () => {
    renderWithMantine(<JourneySelector />);
    expect(screen.getByText('Plan a new system')).toBeDefined();
    expect(screen.getByText('Check my existing setup')).toBeDefined();
    expect(screen.getByText('Add or upgrade')).toBeDefined();
  });

  it('clicking a card sets the journey mode', () => {
    renderWithMantine(<JourneySelector />);
    fireEvent.click(screen.getByTestId('journey-check-existing'));
    expect(useSolarStore.getState().journeyMode).toBe('check-existing');
  });

  it('clicking add-upgrade card sets the journey mode', () => {
    renderWithMantine(<JourneySelector />);
    fireEvent.click(screen.getByTestId('journey-add-upgrade'));
    expect(useSolarStore.getState().journeyMode).toBe('add-upgrade');
  });
});
