import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { ApplianceCard } from '../ApplianceCard';
import { theme } from '@/theme/theme';
import type { Appliance } from '@/lib/solar/types';

function renderWithMantine(ui: React.ReactElement) {
  return render(<MantineProvider theme={theme}>{ui}</MantineProvider>);
}

const baseAppliance: Appliance = {
  id: 'fridge-1',
  name: 'Refrigerator',
  category: 'refrigeration',
  wattsTypical: 60,
  wattsMin: 40,
  wattsMax: 80,
  hoursPerDayAnchor: 24,
  hoursPerDayPassage: 24,
  dutyCycle: 0.4,
  usageType: 'always-on',
  crewScaling: false,
  enabled: true,
};

describe('ApplianceCard', () => {
  it('renders appliance name and wattage', () => {
    renderWithMantine(
      <ApplianceCard
        appliance={baseAppliance}
        viewMode="anchor"
        crewSize={2}
        onToggle={vi.fn()}
        onHoursChange={vi.fn()}
      />
    );
    expect(screen.getByText('Refrigerator')).toBeDefined();
    expect(screen.getByText('60W')).toBeDefined();
  });

  it('calls onToggle when switch is clicked', () => {
    const onToggle = vi.fn();
    renderWithMantine(
      <ApplianceCard
        appliance={baseAppliance}
        viewMode="anchor"
        crewSize={2}
        onToggle={onToggle}
        onHoursChange={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('switch'));
    expect(onToggle).toHaveBeenCalledWith('fridge-1');
  });

  it('shows crew scaling indicator for crew-scaled appliances', () => {
    const crewAppliance = { ...baseAppliance, crewScaling: true };
    renderWithMantine(
      <ApplianceCard
        appliance={crewAppliance}
        viewMode="anchor"
        crewSize={4}
        onToggle={vi.fn()}
        onHoursChange={vi.fn()}
      />
    );
    expect(screen.getByTestId('crew-indicator')).toBeDefined();
    expect(screen.getByTestId('crew-indicator').textContent).toContain('4');
  });

  it('does not show crew indicator for non-scaling appliances', () => {
    renderWithMantine(
      <ApplianceCard
        appliance={baseAppliance}
        viewMode="anchor"
        crewSize={2}
        onToggle={vi.fn()}
        onHoursChange={vi.fn()}
      />
    );
    expect(screen.queryByTestId('crew-indicator')).toBeNull();
  });

  it('applies reduced opacity when disabled', () => {
    const disabled = { ...baseAppliance, enabled: false };
    renderWithMantine(
      <ApplianceCard
        appliance={disabled}
        viewMode="anchor"
        crewSize={2}
        onToggle={vi.fn()}
        onHoursChange={vi.fn()}
      />
    );
    const card = screen.getByTestId('appliance-fridge-1');
    expect(card.style.opacity).toBe('0.5');
  });
});
