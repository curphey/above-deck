import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSolarStore } from '@/stores/solar';
import { StepBoat } from '../StepBoat';

vi.mock('../../BoatSelector', () => ({
  BoatSelector: () => <div data-testid="boat-selector">BoatSelector</div>,
}));

function wrap(ui: React.ReactElement) {
  return render(<MantineProvider>{ui}</MantineProvider>);
}

describe('StepBoat', () => {
  beforeEach(() => {
    useSolarStore.setState({ ...useSolarStore.getInitialState() });
  });

  it('renders with data-testid', () => {
    wrap(<StepBoat onNext={vi.fn()} />);
    expect(screen.getByTestId('step-boat')).toBeDefined();
  });

  it('renders BoatSelector', () => {
    wrap(<StepBoat onNext={vi.fn()} />);
    expect(screen.getByTestId('boat-selector')).toBeDefined();
  });

  it('shows manual entry fields when toggle is clicked', () => {
    wrap(<StepBoat onNext={vi.fn()} />);
    const toggle = screen.getByText(/don.t see my boat/i);
    fireEvent.click(toggle);
    expect(screen.getByLabelText(/boat name/i)).toBeDefined();
    expect(screen.getByLabelText(/length/i)).toBeDefined();
  });

  it('skip button calls onNext with defaults', () => {
    const onNext = vi.fn();
    wrap(<StepBoat onNext={onNext} />);
    const skip = screen.getByText(/skip/i);
    fireEvent.click(skip);
    expect(onNext).toHaveBeenCalledTimes(1);
    // Should set defaults: 40ft mono 12V
    const state = useSolarStore.getState();
    expect(state.boatLengthFt).toBe(40);
    expect(state.boatType).toBe('mono');
    expect(state.systemVoltage).toBe(12);
  });

  it('continue button calls onNext after manual entry', () => {
    const onNext = vi.fn();
    wrap(<StepBoat onNext={onNext} />);
    // Toggle manual entry
    fireEvent.click(screen.getByText(/don.t see my boat/i));
    // Fill in boat name
    const nameInput = screen.getByLabelText(/boat name/i);
    fireEvent.change(nameInput, { target: { value: 'Test Boat' } });
    // Click continue
    const continueBtn = screen.getByText(/continue/i);
    fireEvent.click(continueBtn);
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(useSolarStore.getState().boatName).toBe('Test Boat');
  });
});
