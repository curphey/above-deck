import { useState, useEffect } from 'react';

export function calculateDelta(current: number, previous: number | null): number {
  if (previous === null) return 0;
  return current - previous;
}

export type DeltaSection = 'drain' | 'charge' | 'balance' | 'autonomy';

export function getDeltaColor(section: DeltaSection, delta: number): 'green' | 'coral' | 'grey' {
  if (delta === 0) return 'grey';

  switch (section) {
    case 'drain':
      // Drain increase = bad (coral), decrease = good (green)
      return delta > 0 ? 'coral' : 'green';
    case 'charge':
      // Charge increase = good (green), decrease = bad (coral)
      return delta > 0 ? 'green' : 'coral';
    case 'balance':
      // Toward surplus = green, toward deficit = coral
      return delta > 0 ? 'green' : 'coral';
    case 'autonomy':
      // More days = green, fewer = coral
      return delta > 0 ? 'green' : 'coral';
  }
}

export function formatDelta(delta: number): string {
  if (delta === 0) return '';
  const sign = delta > 0 ? '+' : '';
  const arrow = delta > 0 ? '\u2191' : '\u2193';
  return `${sign}${Math.round(delta)} ${arrow}`;
}

export function useDeltaVisibility(deps: unknown[]): boolean {
  const [visible, setVisible] = useState(false);
  const serialized = JSON.stringify(deps);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, [serialized]);

  return visible;
}
