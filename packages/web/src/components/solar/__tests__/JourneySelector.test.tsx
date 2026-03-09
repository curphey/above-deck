import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { JourneySelector } from '../JourneySelector';
import { useSolarStore } from '@/stores/solar';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

beforeEach(() => useSolarStore.setState({ journeyType: 'plan' }));

describe('JourneySelector', () => {
  it('renders three journey options', () => {
    render(<JourneySelector />, { wrapper });
    expect(screen.getByText('Plan a new system')).toBeDefined();
    expect(screen.getByText('Check my existing setup')).toBeDefined();
    expect(screen.getByText('Add or upgrade')).toBeDefined();
  });

  it('highlights the selected journey', () => {
    render(<JourneySelector />, { wrapper });
    const planCard = screen.getByText('Plan a new system').closest('[data-journey]');
    expect(planCard?.getAttribute('data-selected')).toBe('true');
  });

  it('updates store when journey is selected', () => {
    render(<JourneySelector />, { wrapper });
    fireEvent.click(screen.getByText('Check my existing setup'));
    expect(useSolarStore.getState().journeyType).toBe('check');
  });
});
