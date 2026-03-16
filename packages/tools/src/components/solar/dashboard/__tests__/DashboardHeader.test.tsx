import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { DashboardHeader } from '../DashboardHeader';
import { theme } from '@/theme/theme';

function renderWithMantine(ui: React.ReactElement) {
  return render(<MantineProvider theme={theme}>{ui}</MantineProvider>);
}

describe('DashboardHeader', () => {
  it('shows surplus text when netBalance is positive', () => {
    renderWithMantine(
      <DashboardHeader
        netBalance={250}
        panelWatts={400}
        regionName="Mediterranean"
        viewMode="anchor"
      />,
    );

    const header = screen.getByTestId('dashboard-header');
    expect(header).toBeDefined();
    expect(header.textContent).toContain('+250 Wh/day surplus');
    expect(header.textContent).toContain('400W');
    expect(header.textContent).toContain('anchor');
    expect(header.textContent).toContain('Mediterranean');
  });

  it('shows deficit warning when netBalance is negative', () => {
    renderWithMantine(
      <DashboardHeader
        netBalance={-120}
        panelWatts={200}
        regionName="Caribbean"
        viewMode="passage"
      />,
    );

    const header = screen.getByTestId('dashboard-header');
    expect(header).toBeDefined();
    expect(header.textContent).toContain('Warning:');
    expect(header.textContent).toContain('-120 Wh/day deficit');
    expect(header.textContent).toContain('passage');
    expect(header.textContent).toContain('Caribbean');
  });

  it('shows surplus for zero balance', () => {
    renderWithMantine(
      <DashboardHeader
        netBalance={0}
        panelWatts={300}
        regionName="Pacific NW"
        viewMode="anchor"
      />,
    );

    const header = screen.getByTestId('dashboard-header');
    expect(header.textContent).toContain('+0 Wh/day surplus');
  });
});
