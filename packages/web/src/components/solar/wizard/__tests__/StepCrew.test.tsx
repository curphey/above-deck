import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSolarStore } from '@/stores/solar';
import { StepCrew } from '../StepCrew';

function wrap(ui: React.ReactElement) {
  return render(<MantineProvider>{ui}</MantineProvider>);
}

describe('StepCrew', () => {
  beforeEach(() => {
    useSolarStore.setState({ ...useSolarStore.getInitialState() });
  });

  it('renders with data-testid', () => {
    wrap(<StepCrew onComplete={vi.fn()} />);
    expect(screen.getByTestId('step-crew')).toBeDefined();
  });

  it('renders crew size input with default of 2', () => {
    wrap(<StepCrew onComplete={vi.fn()} />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDefined();
    expect((input as HTMLInputElement).value).toBe('2');
  });

  it('renders explanatory text', () => {
    wrap(<StepCrew onComplete={vi.fn()} />);
    expect(screen.getByText(/crew size adjusts/i)).toBeDefined();
  });

  it('renders Start Planning button', () => {
    wrap(<StepCrew onComplete={vi.fn()} />);
    expect(screen.getByText(/start planning/i)).toBeDefined();
  });

  it('Start Planning calls onComplete and updates store', () => {
    const onComplete = vi.fn();
    wrap(<StepCrew onComplete={onComplete} />);
    fireEvent.click(screen.getByText(/start planning/i));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(useSolarStore.getState().crewSize).toBe(2);
  });
});
