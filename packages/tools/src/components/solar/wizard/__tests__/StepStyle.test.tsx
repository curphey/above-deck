import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSolarStore } from '@/stores/solar';
import { StepStyle } from '../StepStyle';

function wrap(ui: React.ReactElement) {
  return render(<MantineProvider>{ui}</MantineProvider>);
}

describe('StepStyle', () => {
  beforeEach(() => {
    useSolarStore.setState({ ...useSolarStore.getInitialState() });
  });

  it('renders with data-testid', () => {
    wrap(<StepStyle onNext={vi.fn()} />);
    expect(screen.getByTestId('step-style')).toBeDefined();
  });

  it('renders 3 cruising style cards', () => {
    wrap(<StepStyle onNext={vi.fn()} />);
    expect(screen.getByText('Weekend')).toBeDefined();
    expect(screen.getByText('Coastal')).toBeDefined();
    expect(screen.getByText('Offshore')).toBeDefined();
  });

  it('renders description text for each style', () => {
    wrap(<StepStyle onNext={vi.fn()} />);
    expect(screen.getByText(/marina-based/i)).toBeDefined();
    expect(screen.getByText(/week-long trips/i)).toBeDefined();
    expect(screen.getByText(/extended passages/i)).toBeDefined();
  });

  it('clicking Weekend calls onNext with "weekend" and updates store', () => {
    const onNext = vi.fn();
    wrap(<StepStyle onNext={onNext} />);
    fireEvent.click(screen.getByText('Weekend'));
    expect(onNext).toHaveBeenCalledWith('weekend');
    const state = useSolarStore.getState();
    expect(state.cruisingStyle).toBe('weekend');
    expect(state.daysAutonomy).toBe(1);
  });

  it('clicking Offshore calls onNext with "offshore" and updates store', () => {
    const onNext = vi.fn();
    wrap(<StepStyle onNext={onNext} />);
    fireEvent.click(screen.getByText('Offshore'));
    expect(onNext).toHaveBeenCalledWith('offshore');
    const state = useSolarStore.getState();
    expect(state.cruisingStyle).toBe('offshore');
    expect(state.daysAutonomy).toBe(3);
  });
});
