import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSolarStore } from '@/stores/solar';
import { CURATED_REGIONS } from '@/lib/solar/regions';
import { StepRegion } from '../StepRegion';

function wrap(ui: React.ReactElement) {
  return render(<MantineProvider>{ui}</MantineProvider>);
}

describe('StepRegion', () => {
  beforeEach(() => {
    useSolarStore.setState({ ...useSolarStore.getInitialState() });
  });

  it('renders with data-testid', () => {
    wrap(<StepRegion onNext={vi.fn()} />);
    expect(screen.getByTestId('step-region')).toBeDefined();
  });

  it('renders all 20 curated regions', () => {
    wrap(<StepRegion onNext={vi.fn()} />);
    for (const region of CURATED_REGIONS) {
      expect(screen.getByText(region.name)).toBeDefined();
    }
  });

  it('clicking a region card calls onNext and updates store', () => {
    const onNext = vi.fn();
    wrap(<StepRegion onNext={onNext} />);
    const card = screen.getByText('Caribbean');
    fireEvent.click(card);
    expect(onNext).toHaveBeenCalledTimes(1);
    const state = useSolarStore.getState();
    expect(state.regionName).toBe('Caribbean');
    expect(state.latitude).toBe(15.0);
    expect(state.longitude).toBe(-61.0);
    expect(state.deratingFactor).toBe(0.75);
  });

  it('displays PSH for each region', () => {
    wrap(<StepRegion onNext={vi.fn()} />);
    // Multiple regions can share PSH values, so use getAllByText
    const pshElements = screen.getAllByText(/PSH/);
    expect(pshElements.length).toBe(CURATED_REGIONS.length);
  });
});
