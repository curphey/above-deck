import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { MonthlyGenerationChart } from '../MonthlyGenerationChart';
import { theme } from '@/theme/theme';

function renderWithMantine(ui: React.ReactElement) {
  return render(<MantineProvider theme={theme}>{ui}</MantineProvider>);
}

describe('MonthlyGenerationChart', () => {
  const monthlyGeneration = [
    720, 840, 1020, 1200, 1320, 1380, 1380, 1320, 1200, 1020, 840, 720,
  ];

  it('renders without crashing and has data-testid', () => {
    renderWithMantine(
      <MonthlyGenerationChart
        monthlyGeneration={monthlyGeneration}
        dailyConsumption={1000}
      />,
    );

    expect(screen.getByTestId('monthly-chart')).toBeDefined();
  });

  it('renders the chart title', () => {
    renderWithMantine(
      <MonthlyGenerationChart
        monthlyGeneration={monthlyGeneration}
        dailyConsumption={1000}
      />,
    );

    expect(screen.getByText('Monthly generation')).toBeDefined();
  });
});
