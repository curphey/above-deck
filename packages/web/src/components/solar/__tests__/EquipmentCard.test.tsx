import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { describe, it, expect, vi } from 'vitest';
import { EquipmentCard } from '../EquipmentCard';
import type {
  DrainEquipment,
  ChargeEquipment,
  StoreEquipment,
} from '@/lib/solar/types';

function wrap(ui: React.ReactElement) {
  return render(<MantineProvider>{ui}</MantineProvider>);
}

const baseDrain: DrainEquipment = {
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

const baseChargeSolar: ChargeEquipment = {
  id: 'c1',
  catalogId: null,
  name: 'Solar Panel',
  type: 'charge',
  enabled: true,
  origin: 'added',
  notes: '',
  sourceType: 'solar',
  panelWatts: 200,
};

const baseChargeAlternator: ChargeEquipment = {
  id: 'c2',
  catalogId: null,
  name: 'Engine Alternator',
  type: 'charge',
  enabled: true,
  origin: 'stock',
  notes: '',
  sourceType: 'alternator',
  alternatorAmps: 80,
};

const baseChargeShore: ChargeEquipment = {
  id: 'c3',
  catalogId: null,
  name: 'Shore Charger',
  type: 'charge',
  enabled: true,
  origin: 'stock',
  notes: '',
  sourceType: 'shore',
  shoreChargerAmps: 30,
  shoreHoursPerDay: 4,
};

const baseStore: StoreEquipment = {
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

describe('EquipmentCard', () => {
  it('renders drain card with name and summary', () => {
    wrap(
      <EquipmentCard
        item={baseDrain}
        whPerDay={475}
        onClick={vi.fn()}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText('Fridge')).toBeDefined();
    expect(screen.getByText('60W · 475 Wh/day')).toBeDefined();
  });

  it('renders charge card with source info', () => {
    wrap(
      <EquipmentCard
        item={baseChargeSolar}
        whPerDay={800}
        onClick={vi.fn()}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText('Solar Panel')).toBeDefined();
    expect(screen.getByText('200W · 800 Wh/day')).toBeDefined();
  });

  it('renders store card with capacity', () => {
    wrap(
      <EquipmentCard
        item={baseStore}
        whPerDay={0}
        onClick={vi.fn()}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText('House Bank')).toBeDefined();
    expect(screen.getByText('LiFePO4 · 200Ah')).toBeDefined();
  });

  it('calls onClick when card clicked', () => {
    const onClick = vi.fn();
    wrap(
      <EquipmentCard
        item={baseDrain}
        whPerDay={475}
        onClick={onClick}
        onToggle={vi.fn()}
      />,
    );
    const card = document.querySelector('[data-equipment-card]')!;
    fireEvent.click(card);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('calls onToggle when switch clicked (not onClick)', () => {
    const onClick = vi.fn();
    const onToggle = vi.fn();
    wrap(
      <EquipmentCard
        item={baseDrain}
        whPerDay={475}
        onClick={onClick}
        onToggle={onToggle}
      />,
    );
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('shows Stock badge for stock items', () => {
    wrap(
      <EquipmentCard
        item={baseDrain}
        whPerDay={475}
        onClick={vi.fn()}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText('Stock')).toBeDefined();
  });

  it('shows Added badge for added items', () => {
    wrap(
      <EquipmentCard
        item={baseChargeSolar}
        whPerDay={800}
        onClick={vi.fn()}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText('Added')).toBeDefined();
  });

  it('dims disabled items (check opacity style)', () => {
    const disabled = { ...baseDrain, enabled: false };
    wrap(
      <EquipmentCard
        item={disabled}
        whPerDay={475}
        onClick={vi.fn()}
        onToggle={vi.fn()}
      />,
    );
    const card = document.querySelector('[data-equipment-card]') as HTMLElement;
    expect(card.style.opacity).toBe('0.5');
  });

  it('shows AC badge for AC drain items', () => {
    const acDrain: DrainEquipment = { ...baseDrain, powerType: 'ac' };
    wrap(
      <EquipmentCard
        item={acDrain}
        whPerDay={475}
        onClick={vi.fn()}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText('AC')).toBeDefined();
  });
});
