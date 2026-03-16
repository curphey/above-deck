import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { SummaryBar } from '../SummaryBar';
import { theme } from '@above-deck/shared/theme/theme';

function renderWithMantine(ui: React.ReactElement) {
  return render(<MantineProvider theme={theme}>{ui}</MantineProvider>);
}

describe('SummaryBar', () => {
  it('displays all four stats with correct values', () => {
    renderWithMantine(
      <SummaryBar drainWh={1234.5} chargeWh={2345.6} netBalance={1111.1} daysAutonomy={5.25} />
    );
    expect(screen.getByText('1235 Wh')).toBeDefined();
    expect(screen.getByText('2346 Wh')).toBeDefined();
    expect(screen.getByText('+1111 Wh')).toBeDefined();
    expect(screen.getByText('5.3 days')).toBeDefined();

    expect(screen.getByText('Drain')).toBeDefined();
    expect(screen.getByText('Charge')).toBeDefined();
    expect(screen.getByText('Balance')).toBeDefined();
    expect(screen.getByText('Autonomy')).toBeDefined();
  });

  it('shows green (data-positive=true) for positive balance', () => {
    renderWithMantine(
      <SummaryBar drainWh={100} chargeWh={200} netBalance={100} daysAutonomy={3} />
    );
    const balanceValue = screen.getByText('+100 Wh');
    expect(balanceValue.dataset.positive).toBe('true');
  });

  it('shows red (data-positive=false) for negative balance', () => {
    renderWithMantine(
      <SummaryBar drainWh={200} chargeWh={100} netBalance={-100} daysAutonomy={1} />
    );
    const balanceValue = screen.getByText('-100 Wh');
    expect(balanceValue.dataset.positive).toBe('false');
  });

  it('shows correct autonomy levels: good (>=3), warning (>=1), danger (<1)', () => {
    const { unmount: u1 } = renderWithMantine(
      <SummaryBar drainWh={100} chargeWh={200} netBalance={100} daysAutonomy={3} />
    );
    expect(screen.getByText('3.0 days').dataset.autonomy).toBe('good');
    u1();

    const { unmount: u2 } = renderWithMantine(
      <SummaryBar drainWh={100} chargeWh={200} netBalance={100} daysAutonomy={1.5} />
    );
    expect(screen.getByText('1.5 days').dataset.autonomy).toBe('warning');
    u2();

    const { unmount: u3 } = renderWithMantine(
      <SummaryBar drainWh={100} chargeWh={200} netBalance={100} daysAutonomy={0.5} />
    );
    expect(screen.getByText('0.5 days').dataset.autonomy).toBe('danger');
    u3();

    renderWithMantine(
      <SummaryBar drainWh={100} chargeWh={200} netBalance={100} daysAutonomy={Infinity} />
    );
    expect(screen.getByText('∞')).toBeDefined();
    expect(screen.getByText('∞').dataset.autonomy).toBe('good');
  });
});
