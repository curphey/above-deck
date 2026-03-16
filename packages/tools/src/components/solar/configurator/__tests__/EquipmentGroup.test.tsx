import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { describe, it, expect, vi } from 'vitest';
import { EquipmentGroup } from '../EquipmentGroup';
import type { DrainEquipment } from '@/lib/solar/types';

function wrap(ui: React.ReactElement) {
  return render(<MantineProvider>{ui}</MantineProvider>);
}

const drain1: DrainEquipment = {
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

const drain2: DrainEquipment = {
  id: 'd2',
  catalogId: null,
  name: 'Chartplotter',
  type: 'drain',
  enabled: true,
  origin: 'stock',
  notes: '',
  category: 'navigation',
  wattsTypical: 25,
  wattsMin: 10,
  wattsMax: 40,
  hoursPerDayAnchor: 8,
  hoursPerDayPassage: 16,
  dutyCycle: 1,
  crewScaling: false,
  powerType: 'dc',
};

describe('EquipmentGroup', () => {
  it('renders title in uppercase', () => {
    const whMap = new Map([['d1', 475]]);
    wrap(
      <EquipmentGroup
        title="DRAIN"
        items={[drain1]}
        whPerDayMap={whMap}
        previousTotal={null}
        onCardClick={vi.fn()}
        onToggle={vi.fn()}
        onAddClick={vi.fn()}
      />,
    );
    expect(screen.getByText(/DRAIN/)).toBeDefined();
  });

  it('shows total Wh/day from whPerDayMap', () => {
    const whMap = new Map([
      ['d1', 475],
      ['d2', 200],
    ]);
    wrap(
      <EquipmentGroup
        title="DRAIN"
        items={[drain1, drain2]}
        whPerDayMap={whMap}
        previousTotal={null}
        onCardClick={vi.fn()}
        onToggle={vi.fn()}
        onAddClick={vi.fn()}
      />,
    );
    expect(screen.getByText(/675 Wh\/day/)).toBeDefined();
  });

  it('shows delta badge when previousTotal is provided', () => {
    const whMap = new Map([['d1', 475]]);
    wrap(
      <EquipmentGroup
        title="DRAIN"
        items={[drain1]}
        whPerDayMap={whMap}
        previousTotal={355}
        onCardClick={vi.fn()}
        onToggle={vi.fn()}
        onAddClick={vi.fn()}
      />,
    );
    // 475 - 355 = +120
    expect(screen.getByText(/\+120/)).toBeDefined();
  });

  it('does not show delta when previousTotal is null', () => {
    const whMap = new Map([['d1', 475]]);
    wrap(
      <EquipmentGroup
        title="DRAIN"
        items={[drain1]}
        whPerDayMap={whMap}
        previousTotal={null}
        onCardClick={vi.fn()}
        onToggle={vi.fn()}
        onAddClick={vi.fn()}
      />,
    );
    expect(screen.queryByText(/\+\d/)).toBeNull();
  });

  it('renders equipment cards for each item', () => {
    const whMap = new Map([
      ['d1', 475],
      ['d2', 200],
    ]);
    wrap(
      <EquipmentGroup
        title="DRAIN"
        items={[drain1, drain2]}
        whPerDayMap={whMap}
        previousTotal={null}
        onCardClick={vi.fn()}
        onToggle={vi.fn()}
        onAddClick={vi.fn()}
      />,
    );
    expect(screen.getByText('Fridge')).toBeDefined();
    expect(screen.getByText('Chartplotter')).toBeDefined();
  });

  it('renders add button', () => {
    const whMap = new Map([['d1', 475]]);
    const onAddClick = vi.fn();
    wrap(
      <EquipmentGroup
        title="DRAIN"
        items={[drain1]}
        whPerDayMap={whMap}
        previousTotal={null}
        onCardClick={vi.fn()}
        onToggle={vi.fn()}
        onAddClick={onAddClick}
      />,
    );
    const addBtn = screen.getByText(/Add equipment/i);
    expect(addBtn).toBeDefined();
    fireEvent.click(addBtn);
    expect(onAddClick).toHaveBeenCalledTimes(1);
  });

  it('has data-testid="equipment-group"', () => {
    const whMap = new Map([['d1', 475]]);
    wrap(
      <EquipmentGroup
        title="DRAIN"
        items={[drain1]}
        whPerDayMap={whMap}
        previousTotal={null}
        onCardClick={vi.fn()}
        onToggle={vi.fn()}
        onAddClick={vi.fn()}
      />,
    );
    expect(screen.getByTestId('equipment-group')).toBeDefined();
  });
});
