import { Text } from '@mantine/core';
import { HEADING_FONT } from '@above-deck/shared/theme/fonts';

interface DashboardHeaderProps {
  netBalance: number;
  panelWatts: number;
  regionName: string;
  viewMode: 'anchor' | 'passage';
}

export function DashboardHeader({
  netBalance,
  panelWatts,
  regionName,
  viewMode,
}: DashboardHeaderProps) {
  const isSurplus = netBalance >= 0;
  const balanceColor = isSurplus ? '#4ade80' : '#f87171';
  const absBalance = Math.abs(netBalance);
  const sign = isSurplus ? '+' : '-';

  return (
    <div data-testid="dashboard-header">
      {isSurplus ? (
        <Text size="lg" ff={HEADING_FONT}>
          Your {panelWatts}W system generates a{' '}
          <span style={{ color: balanceColor, fontWeight: 700 }}>
            {sign}{absBalance} Wh/day surplus
          </span>{' '}
          at {viewMode} in {regionName}
        </Text>
      ) : (
        <Text size="lg" ff={HEADING_FONT}>
          <span style={{ color: balanceColor, fontWeight: 700 }}>Warning:</span>{' '}
          your system runs a{' '}
          <span style={{ color: balanceColor, fontWeight: 700 }}>
            {sign}{absBalance} Wh/day deficit
          </span>{' '}
          at {viewMode} in {regionName}
        </Text>
      )}
    </div>
  );
}
