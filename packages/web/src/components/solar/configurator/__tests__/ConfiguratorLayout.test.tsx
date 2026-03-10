import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { ConfiguratorLayout } from '../ConfiguratorLayout';
import { useSolarStore } from '@/stores/solar';
import type { DrainEquipment, ChargeEquipment, StoreEquipment } from '@/lib/solar/types';

function wrap(ui: React.ReactElement) {
  return render(<MantineProvider>{ui}</MantineProvider>);
}

const fridge: DrainEquipment = {
  id: 'd1',
  catalogId: null,
  name: 'Fridge',
  type: 'drain',
  enabled: true,
  origin: 'stock',
  notes: '',
  category: 'galley',
  wattsTypical: 60,
  wattsMin: 40,
  wattsMax: 80,
  hoursPerDayAnchor: 24,
  hoursPerDayPassage: 24,
  dutyCycle: 0.33,
  crewScaling: false,
  powerType: 'dc',
};

const solarPanel: ChargeEquipment = {
  id: 'c1',
  catalogId: null,
  name: 'Solar Panel',
  type: 'charge',
  enabled: true,
  origin: 'added',
  notes: '',
  sourceType: 'solar',
  panelWatts: 200,
  panelType: 'rigid',
};

const houseBank: StoreEquipment = {
  id: 's1',
  catalogId: null,
  name: 'House Bank',
  type: 'store',
  enabled: true,
  origin: 'stock',
  notes: '',
  chemistry: 'lifepo4',
  capacityAh: 200,
};

describe('ConfiguratorLayout', () => {
  beforeEach(() => {
    useSolarStore.setState({
      boatName: 'Bavaria 40',
      crewSize: 2,
      regionName: 'Mediterranean',
      cruisingStyle: 'offshore',
      systemVoltage: 12,
      viewMode: 'anchor',
      deratingFactor: 0.75,
      equipment: [fridge, solarPanel, houseBank],
      previousMetrics: null,
    });
  });

  it('has data-testid="configurator-layout"', () => {
    wrap(<ConfiguratorLayout />);
    expect(screen.getByTestId('configurator-layout')).toBeDefined();
  });

  it('renders 3 equipment groups', () => {
    wrap(<ConfiguratorLayout />);
    const groups = screen.getAllByTestId('equipment-group');
    expect(groups.length).toBe(3);
  });

  it('renders schematic placeholder panel', () => {
    wrap(<ConfiguratorLayout />);
    expect(screen.getByTestId('schematic-panel')).toBeDefined();
    expect(screen.getByText(/System Schematic/i)).toBeDefined();
  });

  it('shows equipment items in correct groups', () => {
    wrap(<ConfiguratorLayout />);
    expect(screen.getByText('Fridge')).toBeDefined();
    expect(screen.getByText('Solar Panel')).toBeDefined();
    expect(screen.getByText('House Bank')).toBeDefined();
  });
});
