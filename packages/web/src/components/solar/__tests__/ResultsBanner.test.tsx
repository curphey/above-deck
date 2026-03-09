import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { ResultsBanner } from '../ResultsBanner';
import { theme } from '@/theme/theme';
import type { ConsumptionResult, SolarRecommendation } from '@/lib/solar/types';

function renderWithMantine(ui: React.ReactElement) {
  return render(<MantineProvider theme={theme}>{ui}</MantineProvider>);
}

const mockConsumption: ConsumptionResult = {
  totalWhPerDayAnchor: 2400,
  totalWhPerDayPassage: 3000,
  totalAhPerDayAnchor: 200,
  totalAhPerDayPassage: 250,
  breakdownByCategory: {
    refrigeration: { anchor: 800, passage: 800 },
    navigation: { anchor: 200, passage: 600 },
  },
};

const mockRecommendation: SolarRecommendation = {
  panelWatts: { minimum: 300, recommended: 450, comfortable: 600 },
  batteryAh: { minimum: 200, recommended: 400, comfortable: 600 },
  batteryCount: 2,
  mpptAmps: 30,
  mpptMaxVoltage: 100,
  inverterWatts: 2000,
  alternatorDailyAh: 50,
  needsSmartRegulator: true,
  batteryMonitor: true,
  wireGauge: '4',
  dailyGenerationWh: 3000,
  dailyBalance: 600,
};

describe('ResultsBanner', () => {
  it('shows consumption value for anchor mode', () => {
    renderWithMantine(
      <ResultsBanner
        consumption={mockConsumption}
        recommendation={mockRecommendation}
        viewMode="anchor"
        regionName="Mediterranean"
      />
    );
    expect(screen.getByTestId('stat-consumption').textContent).toContain('2400');
  });

  it('shows consumption value for passage mode', () => {
    renderWithMantine(
      <ResultsBanner
        consumption={mockConsumption}
        recommendation={mockRecommendation}
        viewMode="passage"
        regionName="Mediterranean"
      />
    );
    expect(screen.getByTestId('stat-consumption').textContent).toContain('3000');
  });

  it('shows recommended solar wattage', () => {
    renderWithMantine(
      <ResultsBanner
        consumption={mockConsumption}
        recommendation={mockRecommendation}
        viewMode="anchor"
        regionName="Mediterranean"
      />
    );
    expect(screen.getByTestId('stat-solar').textContent).toContain('450');
  });

  it('shows recommended battery Ah', () => {
    renderWithMantine(
      <ResultsBanner
        consumption={mockConsumption}
        recommendation={mockRecommendation}
        viewMode="anchor"
        regionName="Mediterranean"
      />
    );
    expect(screen.getByTestId('stat-battery').textContent).toContain('400');
  });

  it('shows green surplus status when balance is positive', () => {
    renderWithMantine(
      <ResultsBanner
        consumption={mockConsumption}
        recommendation={mockRecommendation}
        viewMode="anchor"
        regionName="Mediterranean"
      />
    );
    const balanceCard = screen.getByTestId('stat-balance');
    expect(balanceCard.textContent).toContain('surplus');
  });

  it('shows deficit when balance is negative', () => {
    const deficitRec = { ...mockRecommendation, dailyGenerationWh: 1500, dailyBalance: -900 };
    renderWithMantine(
      <ResultsBanner
        consumption={mockConsumption}
        recommendation={deficitRec}
        viewMode="anchor"
        regionName="Mediterranean"
      />
    );
    expect(screen.getByTestId('stat-balance').textContent).toContain('Deficit');
  });

  it('includes region name in note', () => {
    renderWithMantine(
      <ResultsBanner
        consumption={mockConsumption}
        recommendation={mockRecommendation}
        viewMode="anchor"
        regionName="Caribbean"
      />
    );
    expect(screen.getByText(/Caribbean/)).toBeDefined();
  });
});
