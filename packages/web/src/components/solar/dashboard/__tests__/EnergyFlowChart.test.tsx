import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { EnergyFlowChart } from '../EnergyFlowChart';
import { generateHourlyData } from '../EnergyFlowChart';
import { theme } from '@/theme/theme';

function renderWithMantine(ui: React.ReactElement) {
  return render(<MantineProvider theme={theme}>{ui}</MantineProvider>);
}

describe('generateHourlyData', () => {
  it('generates 24 data points', () => {
    const data = generateHourlyData({
      chargeWhPerDay: 1200,
      peakSunHours: 5,
      categories: { refrigeration: 400, navigation: 200 },
      batteryCapacityWh: 2400,
    });
    expect(data).toHaveLength(24);
  });

  it('total solar generation approximately equals chargeWhPerDay', () => {
    const data = generateHourlyData({
      chargeWhPerDay: 1200,
      peakSunHours: 5,
      categories: { refrigeration: 400, navigation: 200 },
      batteryCapacityWh: 2400,
    });
    const totalSolar = data.reduce((sum, d) => sum + d.solar, 0);
    // Allow 5% tolerance due to discrete approximation
    expect(totalSolar).toBeGreaterThan(1200 * 0.95);
    expect(totalSolar).toBeLessThan(1200 * 1.05);
  });

  it('SOC starts at 80% and stays clamped between 0 and 100', () => {
    const data = generateHourlyData({
      chargeWhPerDay: 500,
      peakSunHours: 4,
      categories: { refrigeration: 1200 },
      batteryCapacityWh: 2400,
    });
    expect(data[0].soc).toBe(80);
    for (const point of data) {
      expect(point.soc).toBeGreaterThanOrEqual(0);
      expect(point.soc).toBeLessThanOrEqual(100);
    }
  });
});

describe('EnergyFlowChart', () => {
  it('renders without crashing and has data-testid', () => {
    renderWithMantine(
      <EnergyFlowChart
        drainWhPerDay={600}
        chargeWhPerDay={1200}
        peakSunHours={5}
        categories={{ refrigeration: 400, navigation: 200 }}
        batteryCapacityWh={2400}
      />,
    );

    expect(screen.getByTestId('energy-flow-chart')).toBeDefined();
  });
});
