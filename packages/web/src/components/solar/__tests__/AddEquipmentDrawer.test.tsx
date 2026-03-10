import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { describe, it, expect, vi } from 'vitest';
import { AddEquipmentDrawer } from '../AddEquipmentDrawer';
import type { Appliance } from '@/lib/solar/types';

function wrap(ui: React.ReactElement) {
  return render(<MantineProvider>{ui}</MantineProvider>);
}

const catalog: Appliance[] = [
  {
    id: 'a1',
    name: 'Chartplotter',
    category: 'navigation',
    wattsTypical: 25,
    wattsMin: 15,
    wattsMax: 40,
    hoursPerDayAnchor: 2,
    hoursPerDayPassage: 12,
    dutyCycle: 1,
    usageType: 'scheduled',
    crewScaling: false,
    enabled: true,
    origin: 'catalog',
  },
  {
    id: 'a2',
    name: 'Refrigerator',
    category: 'galley',
    wattsTypical: 60,
    wattsMin: 40,
    wattsMax: 80,
    hoursPerDayAnchor: 24,
    hoursPerDayPassage: 24,
    dutyCycle: 0.33,
    usageType: 'always-on',
    crewScaling: false,
    enabled: true,
    origin: 'catalog',
  },
  {
    id: 'a3',
    name: 'Autopilot',
    category: 'navigation',
    wattsTypical: 50,
    wattsMin: 20,
    wattsMax: 100,
    hoursPerDayAnchor: 0,
    hoursPerDayPassage: 24,
    dutyCycle: 0.5,
    usageType: 'scheduled',
    crewScaling: false,
    enabled: true,
    origin: 'catalog',
  },
];

const defaultProps = {
  opened: true,
  onClose: vi.fn(),
  onAdd: vi.fn(),
  catalog,
  filterType: 'drain' as const,
};

describe('AddEquipmentDrawer', () => {
  it('renders catalog items when filterType is drain', () => {
    wrap(<AddEquipmentDrawer {...defaultProps} />);
    expect(screen.getByText('Chartplotter')).toBeDefined();
    expect(screen.getByText('Refrigerator')).toBeDefined();
    expect(screen.getByText('Autopilot')).toBeDefined();
  });

  it('filters items by search text', () => {
    wrap(<AddEquipmentDrawer {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search equipment...');
    fireEvent.change(input, { target: { value: 'chart' } });
    expect(screen.getByText('Chartplotter')).toBeDefined();
    expect(screen.queryByText('Refrigerator')).toBeNull();
    expect(screen.queryByText('Autopilot')).toBeNull();
  });

  it('calls onAdd when an item is clicked with correct name', () => {
    const onAdd = vi.fn();
    wrap(<AddEquipmentDrawer {...defaultProps} onAdd={onAdd} />);
    fireEvent.click(screen.getByText('Chartplotter'));
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd.mock.calls[0][0].name).toBe('Chartplotter');
  });

  it('shows charge sources when filterType is charge', () => {
    wrap(<AddEquipmentDrawer {...defaultProps} filterType="charge" />);
    expect(screen.getByText('Solar Panels')).toBeDefined();
    expect(screen.getByText('Engine Alternator')).toBeDefined();
    expect(screen.getByText('Shore Power')).toBeDefined();
  });

  it('shows battery option when filterType is store', () => {
    wrap(<AddEquipmentDrawer {...defaultProps} filterType="store" />);
    expect(screen.getByText('Battery Bank')).toBeDefined();
  });
});
