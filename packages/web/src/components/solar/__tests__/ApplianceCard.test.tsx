import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { ApplianceCard } from '../ApplianceCard';
import type { Appliance } from '@/lib/solar/types';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

const mockAppliance: Appliance = {
  id: '1',
  name: 'Chartplotter',
  category: 'navigation',
  wattsTypical: 15,
  wattsMin: 7,
  wattsMax: 20,
  hoursPerDayAnchor: 2,
  hoursPerDayPassage: 16,
  dutyCycle: 1.0,
  usageType: 'scheduled',
  crewScaling: false,
  enabled: true,
  origin: 'stock',
};

describe('ApplianceCard', () => {
  it('renders appliance name and wattage', () => {
    render(
      <ApplianceCard
        appliance={mockAppliance}
        viewMode="anchor"
        crewSize={2}
        onToggle={vi.fn()}
        onUpdateHours={vi.fn()}
        onRemove={vi.fn()}
      />,
      { wrapper },
    );
    expect(screen.getByText('Chartplotter')).toBeDefined();
    expect(screen.getByText(/15W typical/)).toBeDefined();
  });

  it('shows stock badge for stock appliances', () => {
    render(
      <ApplianceCard
        appliance={mockAppliance}
        viewMode="anchor"
        crewSize={2}
        onToggle={vi.fn()}
        onUpdateHours={vi.fn()}
        onRemove={vi.fn()}
      />,
      { wrapper },
    );
    expect(screen.getByText('Stock')).toBeDefined();
  });

  it('shows hours per day text', () => {
    render(
      <ApplianceCard
        appliance={mockAppliance}
        viewMode="anchor"
        crewSize={2}
        onToggle={vi.fn()}
        onUpdateHours={vi.fn()}
        onRemove={vi.fn()}
      />,
      { wrapper },
    );
    expect(screen.getByText('2h/day')).toBeDefined();
  });

  it('calls onToggle when switch is clicked', () => {
    const onToggle = vi.fn();
    render(
      <ApplianceCard
        appliance={mockAppliance}
        viewMode="anchor"
        crewSize={2}
        onToggle={onToggle}
        onUpdateHours={vi.fn()}
        onRemove={vi.fn()}
      />,
      { wrapper },
    );
    const switchInput = screen.getByLabelText(/toggle chartplotter/i);
    fireEvent.click(switchInput);
    expect(onToggle).toHaveBeenCalledWith('1');
  });

  it('shows crew multiplier for crew-scaling appliances', () => {
    const crewAppliance = { ...mockAppliance, crewScaling: true };
    render(
      <ApplianceCard
        appliance={crewAppliance}
        viewMode="anchor"
        crewSize={4}
        onToggle={vi.fn()}
        onUpdateHours={vi.fn()}
        onRemove={vi.fn()}
      />,
      { wrapper },
    );
    expect(screen.getByText(/× 4 crew/)).toBeDefined();
  });

  it('calculates daily Wh correctly', () => {
    render(
      <ApplianceCard
        appliance={mockAppliance}
        viewMode="anchor"
        crewSize={2}
        onToggle={vi.fn()}
        onUpdateHours={vi.fn()}
        onRemove={vi.fn()}
      />,
      { wrapper },
    );
    // 15W × 2h × 1.0 dutyCycle × 1 (no crew scaling) = 30 Wh
    expect(screen.getByText('30 Wh/day')).toBeDefined();
  });

  it('calculates daily Wh with crew scaling', () => {
    const crewAppliance = { ...mockAppliance, crewScaling: true };
    render(
      <ApplianceCard
        appliance={crewAppliance}
        viewMode="anchor"
        crewSize={4}
        onToggle={vi.fn()}
        onUpdateHours={vi.fn()}
        onRemove={vi.fn()}
      />,
      { wrapper },
    );
    // 15W × 2h × 1.0 × (4/2) = 60 Wh
    expect(screen.getByText('60 Wh/day')).toBeDefined();
  });

  it('applies disabled styling when appliance is off', () => {
    const disabled = { ...mockAppliance, enabled: false };
    render(
      <ApplianceCard
        appliance={disabled}
        viewMode="anchor"
        crewSize={2}
        onToggle={vi.fn()}
        onUpdateHours={vi.fn()}
        onRemove={vi.fn()}
      />,
      { wrapper },
    );
    const paper = screen.getByTestId('appliance-card-1');
    expect(paper.style.opacity).toBe('0.5');
  });

  it('shows blue left border for crew-scaling appliances', () => {
    const crewAppliance = { ...mockAppliance, crewScaling: true };
    render(
      <ApplianceCard
        appliance={crewAppliance}
        viewMode="anchor"
        crewSize={4}
        onToggle={vi.fn()}
        onUpdateHours={vi.fn()}
        onRemove={vi.fn()}
      />,
      { wrapper },
    );
    const paper = screen.getByTestId('appliance-card-1');
    expect(paper.style.borderLeft).toBe('3px solid var(--mantine-color-blue-5)');
  });

  it('shows Added badge for catalog appliances', () => {
    const catalogAppliance = { ...mockAppliance, origin: 'catalog' as const };
    render(
      <ApplianceCard
        appliance={catalogAppliance}
        viewMode="anchor"
        crewSize={2}
        onToggle={vi.fn()}
        onUpdateHours={vi.fn()}
        onRemove={vi.fn()}
      />,
      { wrapper },
    );
    expect(screen.getByText('Added')).toBeDefined();
  });

  it('uses passage hours when viewMode is passage', () => {
    render(
      <ApplianceCard
        appliance={mockAppliance}
        viewMode="passage"
        crewSize={2}
        onToggle={vi.fn()}
        onUpdateHours={vi.fn()}
        onRemove={vi.fn()}
      />,
      { wrapper },
    );
    expect(screen.getByText('16h/day')).toBeDefined();
    // 15W × 16h × 1.0 = 240 Wh
    expect(screen.getByText('240 Wh/day')).toBeDefined();
  });
});
