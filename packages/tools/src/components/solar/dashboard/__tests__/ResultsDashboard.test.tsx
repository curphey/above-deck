import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { ResultsDashboard } from '../ResultsDashboard';
import { useSolarStore } from '@/stores/solar';
import { theme } from '@above-deck/shared/theme/theme';
import type { DrainEquipment, ChargeEquipment, StoreEquipment } from '@/lib/solar/types';

function renderWithMantine(ui: React.ReactElement) {
  return render(<MantineProvider theme={theme}>{ui}</MantineProvider>);
}

const testDrain: DrainEquipment = {
  id: 'fridge-1',
  catalogId: null,
  name: 'Fridge',
  type: 'drain',
  enabled: true,
  origin: 'stock',
  notes: '',
  category: 'refrigeration',
  wattsTypical: 60,
  wattsMin: 40,
  wattsMax: 80,
  hoursPerDayAnchor: 24,
  hoursPerDayPassage: 24,
  dutyCycle: 0.3,
  crewScaling: false,
  powerType: 'dc',
};

const testCharge: ChargeEquipment = {
  id: 'solar-1',
  catalogId: null,
  name: 'Solar Panel',
  type: 'charge',
  enabled: true,
  origin: 'stock',
  notes: '',
  sourceType: 'solar',
  panelWatts: 400,
  panelType: 'rigid',
};

const testStore: StoreEquipment = {
  id: 'battery-1',
  catalogId: null,
  name: 'House Bank',
  type: 'store',
  enabled: true,
  origin: 'stock',
  notes: '',
  chemistry: 'lifepo4',
  capacityAh: 200,
};

describe('ResultsDashboard', () => {
  beforeEach(() => {
    useSolarStore.setState({
      equipment: [testDrain, testCharge, testStore],
      viewMode: 'anchor',
      crewSize: 2,
      systemVoltage: 12,
      acCircuitVoltage: 220,
      regionName: 'Mediterranean',
      deratingFactor: 0.75,
      batteryChemistry: 'lifepo4',
      monthlyIrradiance: [],
    });
  });

  it('renders the dashboard with all 4 panels', () => {
    renderWithMantine(<ResultsDashboard />);

    expect(screen.getByTestId('results-dashboard')).toBeDefined();
    expect(screen.getByTestId('dashboard-header')).toBeDefined();
    expect(screen.getByTestId('energy-flow-chart')).toBeDefined();
    expect(screen.getByTestId('monthly-chart')).toBeDefined();
  });

  it('renders the dashboard header with correct surplus/deficit', () => {
    renderWithMantine(<ResultsDashboard />);

    const header = screen.getByTestId('dashboard-header');
    // With 400W panel at 4.5 PSH * 0.75 derating = 1350 Wh charge
    // vs 60W * 24h * 0.3 duty = 432 Wh drain
    // Net should be positive
    expect(header.textContent).toContain('surplus');
  });
});
