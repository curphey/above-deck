import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { RegionPicker, REGIONS } from '../RegionPicker';
import { theme } from '@/theme/theme';
import { useSolarStore, initialState } from '@/stores/solar';

function renderWithMantine(ui: React.ReactElement) {
  return render(<MantineProvider theme={theme}>{ui}</MantineProvider>);
}

describe('RegionPicker', () => {
  beforeEach(() => {
    useSolarStore.setState(initialState);
  });

  it('renders the select input', () => {
    renderWithMantine(<RegionPicker />);
    expect(screen.getByText('Cruising region')).toBeDefined();
  });

  it('has the correct id for anchor linking', () => {
    const { container } = renderWithMantine(<RegionPicker />);
    expect(container.querySelector('#region-picker')).toBeTruthy();
  });

  it('exports REGIONS array with 9 regions', () => {
    expect(REGIONS).toHaveLength(9);
  });

  it('each region has lat, lon, and psh properties', () => {
    for (const region of REGIONS) {
      expect(region).toHaveProperty('lat');
      expect(region).toHaveProperty('lon');
      expect(region).toHaveProperty('psh');
      expect(region).toHaveProperty('label');
    }
  });

  it('updates store when a region is selected', () => {
    renderWithMantine(<RegionPicker />);
    // Open the dropdown by clicking the input
    const input = screen.getByRole('textbox');
    fireEvent.click(input);

    // Find and click Caribbean option
    const option = screen.getByText('Caribbean (5.5 psh)');
    fireEvent.click(option);

    const state = useSolarStore.getState();
    expect(state.regionName).toBe('Caribbean');
    expect(state.latitude).toBe(15.0);
    expect(state.longitude).toBe(-61.0);
  });
});
