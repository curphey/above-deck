import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddEquipmentModal } from '../AddEquipmentModal';
import type { CatalogRow } from '@/hooks/use-equipment-catalog';

const mockDrainData: CatalogRow[] = [
  {
    id: 'cat-1',
    type: 'drain',
    category: 'navigation',
    make: 'Raymarine',
    model: 'Axiom2 9"',
    year: 2024,
    latest: true,
    name: 'Raymarine Axiom2 9"',
    specs: {
      wattsTypical: 20,
      wattsMin: 15,
      wattsMax: 35,
      hoursPerDayAnchor: 2,
      hoursPerDayPassage: 16,
      dutyCycle: 1,
      crewScaling: false,
      powerType: 'dc',
    },
  },
  {
    id: 'cat-2',
    type: 'drain',
    category: 'watermaker',
    make: 'Schenker',
    model: 'Zen 30',
    year: 2024,
    latest: true,
    name: 'Schenker Zen 30',
    specs: {
      wattsTypical: 96,
      wattsMin: 80,
      wattsMax: 120,
      hoursPerDayAnchor: 2,
      hoursPerDayPassage: 2,
      dutyCycle: 1,
      crewScaling: false,
      powerType: 'dc',
    },
  },
  {
    id: 'cat-3',
    type: 'drain',
    category: 'navigation',
    make: null,
    model: null,
    year: null,
    latest: true,
    name: 'Chartplotter (generic)',
    specs: {
      wattsTypical: 25,
      wattsMin: 15,
      wattsMax: 40,
      hoursPerDayAnchor: 2,
      hoursPerDayPassage: 12,
      dutyCycle: 1,
      crewScaling: false,
      powerType: 'dc',
    },
  },
];

const mockChargeData: CatalogRow[] = [
  {
    id: 'cat-10',
    type: 'charge',
    category: 'solar',
    make: 'Victron',
    model: 'BlueSolar 305W',
    year: 2024,
    latest: true,
    name: 'Victron BlueSolar 305W',
    specs: { sourceType: 'solar', panelWatts: 305, panelType: 'rigid' },
  },
  {
    id: 'cat-11',
    type: 'charge',
    category: 'alternator',
    make: 'Balmar',
    model: 'AT-SF-200',
    year: 2024,
    latest: true,
    name: 'Balmar AT-SF-200',
    specs: { sourceType: 'alternator', alternatorAmps: 200, motoringHoursPerDay: 1.5 },
  },
];

const mockStoreData: CatalogRow[] = [
  {
    id: 'cat-20',
    type: 'store',
    category: 'lifepo4',
    make: 'Battle Born',
    model: 'BB10012',
    year: 2024,
    latest: true,
    name: 'Battle Born 100Ah',
    specs: { chemistry: 'lifepo4', capacityAh: 100 },
  },
  {
    id: 'cat-21',
    type: 'store',
    category: 'agm',
    make: 'Lifeline',
    model: 'GPL-27T',
    year: 2024,
    latest: true,
    name: 'Lifeline GPL-27T',
    specs: { chemistry: 'agm', capacityAh: 105 },
  },
];

// Mock useEquipmentCatalog to return test data based on type arg
vi.mock('@/hooks/use-equipment-catalog', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/use-equipment-catalog')>(
    '@/hooks/use-equipment-catalog',
  );
  return {
    ...actual,
    useEquipmentCatalog: (type: string) => {
      const map: Record<string, CatalogRow[]> = {
        drain: mockDrainData,
        charge: mockChargeData,
        store: mockStoreData,
      };
      return { data: map[type] ?? [], isLoading: false };
    },
  };
});

function wrap(ui: React.ReactElement) {
  return render(<MantineProvider>{ui}</MantineProvider>);
}

describe('AddEquipmentModal', () => {
  it('has data-testid="add-equipment-modal"', () => {
    wrap(
      <AddEquipmentModal opened={true} onClose={vi.fn()} onAdd={vi.fn()} filterType="drain" />,
    );
    expect(screen.getByTestId('add-equipment-modal')).toBeDefined();
  });

  it('has a search bar', () => {
    wrap(
      <AddEquipmentModal opened={true} onClose={vi.fn()} onAdd={vi.fn()} filterType="drain" />,
    );
    expect(screen.getByPlaceholderText(/search/i)).toBeDefined();
  });

  it('renders catalog items from the hook', () => {
    wrap(
      <AddEquipmentModal opened={true} onClose={vi.fn()} onAdd={vi.fn()} filterType="drain" />,
    );
    expect(screen.getByText('Raymarine Axiom2 9"')).toBeDefined();
    expect(screen.getByText('Schenker Zen 30')).toBeDefined();
  });

  it('shows category tabs derived from catalog data', () => {
    wrap(
      <AddEquipmentModal opened={true} onClose={vi.fn()} onAdd={vi.fn()} filterType="drain" />,
    );
    // Categories from mock data: navigation, watermaker
    expect(screen.getByText('Navigation')).toBeDefined();
    expect(screen.getByText('Watermaker')).toBeDefined();
  });

  it('calls onAdd with catalog equipment when Add clicked', () => {
    const onAdd = vi.fn();
    wrap(
      <AddEquipmentModal opened={true} onClose={vi.fn()} onAdd={onAdd} filterType="drain" />,
    );
    const addButtons = screen.getAllByRole('button', { name: /Add$/i });
    fireEvent.click(addButtons[0]);
    expect(onAdd).toHaveBeenCalledTimes(1);
    const item = onAdd.mock.calls[0][0];
    expect(item.catalogId).toBeTruthy();
    expect(item.origin).toBe('catalog');
  });

  it('filters items by search text', () => {
    wrap(
      <AddEquipmentModal opened={true} onClose={vi.fn()} onAdd={vi.fn()} filterType="drain" />,
    );
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'schenker' } });
    expect(screen.getByText('Schenker Zen 30')).toBeDefined();
    // Other items should be filtered out
    expect(screen.queryByText('Raymarine Axiom2 9"')).toBeNull();
  });

  it('shows generic badge for items without a make', () => {
    wrap(
      <AddEquipmentModal opened={true} onClose={vi.fn()} onAdd={vi.fn()} filterType="drain" />,
    );
    expect(screen.getByText('Generic')).toBeDefined();
  });

  it('renders charge catalog items', () => {
    wrap(
      <AddEquipmentModal opened={true} onClose={vi.fn()} onAdd={vi.fn()} filterType="charge" />,
    );
    expect(screen.getByText('Victron BlueSolar 305W')).toBeDefined();
    expect(screen.getByText('Balmar AT-SF-200')).toBeDefined();
  });

  it('renders store catalog items', () => {
    wrap(
      <AddEquipmentModal opened={true} onClose={vi.fn()} onAdd={vi.fn()} filterType="store" />,
    );
    expect(screen.getByText('Battle Born 100Ah')).toBeDefined();
    expect(screen.getByText('Lifeline GPL-27T')).toBeDefined();
  });

  it('has an Add Custom button', () => {
    wrap(
      <AddEquipmentModal opened={true} onClose={vi.fn()} onAdd={vi.fn()} filterType="drain" />,
    );
    expect(screen.getByRole('button', { name: /custom/i })).toBeDefined();
  });

  it('Add Custom creates item with origin "custom"', () => {
    const onAdd = vi.fn();
    wrap(
      <AddEquipmentModal opened={true} onClose={vi.fn()} onAdd={onAdd} filterType="drain" />,
    );
    fireEvent.click(screen.getByRole('button', { name: /custom/i }));
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd.mock.calls[0][0].origin).toBe('custom');
  });
});
