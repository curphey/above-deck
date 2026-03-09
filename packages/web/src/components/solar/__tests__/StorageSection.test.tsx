import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { StorageSection } from '../StorageSection';
import { useSolarStore } from '@/stores/solar';
import type { SolarRecommendation } from '@/lib/solar/types';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

const mockRecommendation: SolarRecommendation = {
  panelWatts: { minimum: 200, recommended: 300, comfortable: 400 },
  batteryAh: { minimum: 200, recommended: 300, comfortable: 400 },
  batteryCount: 2,
  mpptAmps: 30,
  mpptMaxVoltage: 150,
  inverterWatts: 2000,
  alternatorDailyAh: 40,
  needsSmartRegulator: false,
  batteryMonitor: true,
  wireGauge: '4 AWG',
  dailyGenerationWh: 1200,
  dailyBalance: 200,
};

beforeEach(() => {
  useSolarStore.setState({
    journeyType: 'plan',
    batteryChemistry: 'lifepo4',
    systemVoltage: 12,
    daysAutonomy: 3,
    batteryBankAh: 0,
  });
});

describe('StorageSection', () => {
  describe('shared controls', () => {
    it('renders section heading "5. Storage"', () => {
      render(
        <StorageSection recommendation={mockRecommendation} dailyDrainWh={600} />,
        { wrapper },
      );
      expect(screen.getByText('5. Storage')).toBeDefined();
    });

    it('renders battery chemistry selector', () => {
      render(
        <StorageSection recommendation={mockRecommendation} dailyDrainWh={600} />,
        { wrapper },
      );
      expect(screen.getByText('AGM')).toBeDefined();
      expect(screen.getByText('LiFePO4')).toBeDefined();
    });

    it('renders system voltage selector', () => {
      render(
        <StorageSection recommendation={mockRecommendation} dailyDrainWh={600} />,
        { wrapper },
      );
      expect(screen.getByText('12V')).toBeDefined();
      expect(screen.getByText('24V')).toBeDefined();
      expect(screen.getByText('48V')).toBeDefined();
    });
  });

  describe('planning mode (journeyType === plan)', () => {
    beforeEach(() => {
      useSolarStore.setState({ journeyType: 'plan' });
    });

    it('shows days of autonomy input', () => {
      render(
        <StorageSection recommendation={mockRecommendation} dailyDrainWh={600} />,
        { wrapper },
      );
      expect(screen.getByLabelText('Target days self-sufficient')).toBeDefined();
    });

    it('shows recommended battery bank sizes', () => {
      render(
        <StorageSection recommendation={mockRecommendation} dailyDrainWh={600} />,
        { wrapper },
      );
      expect(screen.getByText('300 Ah')).toBeDefined(); // recommended
      expect(screen.getByText('200 Ah')).toBeDefined(); // minimum
      expect(screen.getByText('400 Ah')).toBeDefined(); // comfortable
    });

    it('does not show battery bank capacity input', () => {
      render(
        <StorageSection recommendation={mockRecommendation} dailyDrainWh={600} />,
        { wrapper },
      );
      expect(screen.queryByLabelText('Battery bank capacity (Ah)')).toBeNull();
    });
  });

  describe('existing mode (journeyType === check)', () => {
    beforeEach(() => {
      useSolarStore.setState({ journeyType: 'check' });
    });

    it('shows battery bank capacity input', () => {
      render(
        <StorageSection recommendation={mockRecommendation} dailyDrainWh={600} />,
        { wrapper },
      );
      expect(screen.getByLabelText('Battery bank capacity (Ah)')).toBeDefined();
    });

    it('does not show days of autonomy input', () => {
      render(
        <StorageSection recommendation={mockRecommendation} dailyDrainWh={600} />,
        { wrapper },
      );
      expect(screen.queryByLabelText('Target days self-sufficient')).toBeNull();
    });

    it('calculates and displays days of autonomy for LiFePO4', () => {
      // 400 Ah * 12V * 0.8 / 600 Wh = 6.4 days
      useSolarStore.setState({
        batteryBankAh: 400,
        batteryChemistry: 'lifepo4',
        systemVoltage: 12,
      });
      render(
        <StorageSection recommendation={mockRecommendation} dailyDrainWh={600} />,
        { wrapper },
      );
      expect(screen.getByText('6.4 days')).toBeDefined();
    });

    it('calculates and displays days of autonomy for AGM', () => {
      // 400 Ah * 12V * 0.5 / 600 Wh = 4.0 days
      useSolarStore.setState({
        batteryBankAh: 400,
        batteryChemistry: 'agm',
        systemVoltage: 12,
      });
      render(
        <StorageSection recommendation={mockRecommendation} dailyDrainWh={600} />,
        { wrapper },
      );
      expect(screen.getByText('4.0 days')).toBeDefined();
    });

    it('shows green color for 3+ days autonomy', () => {
      useSolarStore.setState({ batteryBankAh: 400, batteryChemistry: 'lifepo4', systemVoltage: 12 });
      const { container } = render(
        <StorageSection recommendation={mockRecommendation} dailyDrainWh={600} />,
        { wrapper },
      );
      const badge = container.querySelector('[data-autonomy-status]');
      expect(badge?.getAttribute('data-autonomy-status')).toBe('good');
    });

    it('shows amber color for 1-3 days autonomy', () => {
      // 100 Ah * 12V * 0.8 / 600 = 1.6 days
      useSolarStore.setState({ batteryBankAh: 100, batteryChemistry: 'lifepo4', systemVoltage: 12 });
      const { container } = render(
        <StorageSection recommendation={mockRecommendation} dailyDrainWh={600} />,
        { wrapper },
      );
      const badge = container.querySelector('[data-autonomy-status]');
      expect(badge?.getAttribute('data-autonomy-status')).toBe('warning');
    });

    it('shows red color for < 1 day autonomy', () => {
      // 30 Ah * 12V * 0.8 / 600 = 0.48 days
      useSolarStore.setState({ batteryBankAh: 30, batteryChemistry: 'lifepo4', systemVoltage: 12 });
      const { container } = render(
        <StorageSection recommendation={mockRecommendation} dailyDrainWh={600} />,
        { wrapper },
      );
      const badge = container.querySelector('[data-autonomy-status]');
      expect(badge?.getAttribute('data-autonomy-status')).toBe('critical');
    });

    it('handles zero dailyDrainWh gracefully', () => {
      useSolarStore.setState({ batteryBankAh: 400 });
      render(
        <StorageSection recommendation={mockRecommendation} dailyDrainWh={0} />,
        { wrapper },
      );
      // Should not crash, show something reasonable
      expect(screen.getByText(/days/i)).toBeDefined();
    });
  });

  describe('existing mode (journeyType === upgrade)', () => {
    it('behaves same as check mode', () => {
      useSolarStore.setState({ journeyType: 'upgrade' });
      render(
        <StorageSection recommendation={mockRecommendation} dailyDrainWh={600} />,
        { wrapper },
      );
      expect(screen.getByLabelText('Battery bank capacity (Ah)')).toBeDefined();
      expect(screen.queryByLabelText('Target days self-sufficient')).toBeNull();
    });
  });
});
