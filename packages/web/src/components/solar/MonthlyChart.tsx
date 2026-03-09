import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { PvgisMonthlyData } from '@/lib/solar/types';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

interface MonthlyChartProps {
  monthlyData: PvgisMonthlyData[];
  panelWatts: number;
  dailyConsumptionWh: number;
}

export function MonthlyChart({
  monthlyData,
  panelWatts,
  dailyConsumptionWh,
}: MonthlyChartProps) {
  const data = monthlyData.map((m) => ({
    month: MONTH_LABELS[m.month - 1] ?? `M${m.month}`,
    generation: Math.round(m.optimalIrradiance * panelWatts),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4a" strokeOpacity={0.3} />
        <XAxis dataKey="month" tick={{ fill: '#8b8b9e', fontSize: 12 }} />
        <YAxis tick={{ fill: '#8b8b9e', fontSize: 12 }} />
        <Tooltip
          formatter={(value: number) => `${value} Wh`}
          contentStyle={{ background: '#16213e', border: 'none', borderRadius: 8 }}
          itemStyle={{ color: '#e0e0e0' }}
        />
        <Bar dataKey="generation" fill="#4ade80" radius={[4, 4, 0, 0]} />
        <ReferenceLine
          y={dailyConsumptionWh}
          stroke="#f87171"
          strokeDasharray="6 3"
          label={{
            value: 'Daily consumption',
            fill: '#f87171',
            fontSize: 11,
            position: 'right',
          }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
