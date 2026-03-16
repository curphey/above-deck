import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSolarStore } from '@/stores/solar';
import { QuickStartWizard } from '../QuickStartWizard';

vi.mock('../../BoatSelector', () => ({
  BoatSelector: () => <div data-testid="boat-selector">BoatSelector</div>,
}));

function wrap(ui: React.ReactElement) {
  return render(<MantineProvider>{ui}</MantineProvider>);
}

describe('QuickStartWizard', () => {
  beforeEach(() => {
    useSolarStore.setState({ ...useSolarStore.getInitialState() });
  });

  it('renders with data-testid', () => {
    wrap(<QuickStartWizard onComplete={vi.fn()} />);
    expect(screen.getByTestId('quick-start-wizard')).toBeDefined();
  });

  it('shows 4 progress dots', () => {
    wrap(<QuickStartWizard onComplete={vi.fn()} />);
    const dots = screen.getAllByTestId('progress-dot');
    expect(dots.length).toBe(4);
  });

  it('renders step 1 (boat) by default', () => {
    wrap(<QuickStartWizard onComplete={vi.fn()} />);
    expect(screen.getByTestId('step-boat')).toBeDefined();
  });

  it('advances to step 2 (region) when step 1 completes', () => {
    wrap(<QuickStartWizard onComplete={vi.fn()} />);
    // Skip boat step
    fireEvent.click(screen.getByText(/skip/i));
    expect(screen.getByTestId('step-region')).toBeDefined();
  });

  it('advances through all steps to completion', () => {
    const onComplete = vi.fn();
    wrap(<QuickStartWizard onComplete={onComplete} />);

    // Step 1: Skip boat
    fireEvent.click(screen.getByText(/skip/i));

    // Step 2: Click a region
    fireEvent.click(screen.getByText('Caribbean'));

    // Step 3: Click a cruising style
    fireEvent.click(screen.getByText('Coastal'));

    // Step 4: Click Start Planning
    fireEvent.click(screen.getByText(/start planning/i));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(useSolarStore.getState().wizardComplete).toBe(true);
  });

  it('first progress dot is active on initial render', () => {
    wrap(<QuickStartWizard onComplete={vi.fn()} />);
    const dots = screen.getAllByTestId('progress-dot');
    // Active dot should have the ocean blue background
    expect(dots[0].style.backgroundColor).toBe('rgb(96, 165, 250)');
  });
});
