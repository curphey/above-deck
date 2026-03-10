import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { describe, it, expect, vi } from 'vitest';
import { EquipmentDrawer } from '../EquipmentDrawer';
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
  name: 'Navigation Lights',
  type: 'drain',
  enabled: true,
  origin: 'stock',
  notes: '',
  category: 'navigation',
  wattsTypical: 45,
  wattsMin: 20,
  wattsMax: 60,
  hoursPerDayAnchor: 24,
  hoursPerDayPassage: 24,
  dutyCycle: 0.5,
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
  panelType: 'rigid',
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

const defaultProps = {
  opened: true,
  onClose: vi.fn(),
  onUpdate: vi.fn(),
  onDuplicate: vi.fn(),
  onRemove: vi.fn(),
  viewMode: 'anchor' as const,
  crewSize: 2,
  systemVoltage: 12,
  acCircuitVoltage: 220,
  peakSunHours: 5.0,
  deratingFactor: 0.75,
};

describe('EquipmentDrawer', () => {
  it('renders drain fields (wattage, hours/day, duty cycle labels)', () => {
    wrap(<EquipmentDrawer {...defaultProps} item={baseDrain} />);
    expect(screen.getByText(/wattage/i)).toBeDefined();
    expect(screen.getByText(/hours\/day/i)).toBeDefined();
    expect(screen.getByText(/duty cycle/i)).toBeDefined();
  });

  it('renders solar charge fields (panel wattage, panel type labels)', () => {
    wrap(<EquipmentDrawer {...defaultProps} item={baseChargeSolar} />);
    expect(screen.getByText(/panel wattage/i)).toBeDefined();
    expect(screen.getByText(/panel type/i)).toBeDefined();
  });

  it('renders store fields (chemistry, capacity labels)', () => {
    wrap(<EquipmentDrawer {...defaultProps} item={baseStore} />);
    expect(screen.getByText(/chemistry/i)).toBeDefined();
    expect(screen.getByText(/Capacity \(Ah\)/i)).toBeDefined();
  });

  it('shows Duplicate button', () => {
    wrap(<EquipmentDrawer {...defaultProps} item={baseDrain} />);
    expect(screen.getByRole('button', { name: /duplicate/i })).toBeDefined();
  });

  it('shows "Disable" for stock items, "Remove" for added items', () => {
    const { unmount } = wrap(
      <EquipmentDrawer {...defaultProps} item={baseDrain} />,
    );
    expect(screen.getByRole('button', { name: /disable/i })).toBeDefined();
    unmount();

    wrap(
      <EquipmentDrawer {...defaultProps} item={baseChargeSolar} />,
    );
    expect(screen.getByRole('button', { name: /remove/i })).toBeDefined();
  });

  it('calls onDuplicate when clicked', () => {
    const onDuplicate = vi.fn();
    wrap(
      <EquipmentDrawer
        {...defaultProps}
        item={baseDrain}
        onDuplicate={onDuplicate}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /duplicate/i }));
    expect(onDuplicate).toHaveBeenCalledTimes(1);
  });

  it('calls onRemove when clicked', () => {
    const onRemove = vi.fn();
    wrap(
      <EquipmentDrawer
        {...defaultProps}
        item={baseDrain}
        onRemove={onRemove}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /disable/i }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('shows live Wh calculation for drain items (45W × 24h × 0.5 = 540 Wh/day)', () => {
    wrap(<EquipmentDrawer {...defaultProps} item={baseDrain} />);
    expect(screen.getByText(/540 Wh\/day/)).toBeDefined();
  });
});
