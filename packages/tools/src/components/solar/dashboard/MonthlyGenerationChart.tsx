import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { Text } from '@mantine/core';
import { HEADING_FONT } from '@above-deck/shared/theme/fonts';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const MONTH_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface MonthlyGenerationChartProps {
  monthlyGeneration: number[];
  dailyConsumption: number;
}

interface MonthlyDataPoint {
  month: string;
  monthFull: string;
  generation: number;
  consumption: number;
}

export function MonthlyGenerationChart({
  monthlyGeneration,
  dailyConsumption,
}: MonthlyGenerationChartProps) {
  const data: MonthlyDataPoint[] = monthlyGeneration.map((gen, i) => ({
    month: MONTH_LABELS[i],
    monthFull: MONTH_FULL[i],
    generation: Math.round(gen),
    consumption: Math.round(dailyConsumption),
  }));

  return (
    <div data-testid="monthly-chart">
      <Text size="xs" c="dimmed" tt="uppercase" ff={HEADING_FONT} mb="xs">
        Monthly generation
      </Text>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#2d2d4a"
            strokeOpacity={0.5}
          />
          <XAxis
            dataKey="month"
            stroke="#8b8b9e"
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            stroke="#8b8b9e"
            fontSize={11}
            tickLine={false}
            label={{
              value: 'Wh/day',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#8b8b9e', fontSize: 11 },
            }}
          />
          <Tooltip
            contentStyle={{
              background: '#16213e',
              border: '1px solid #2d2d4a',
              borderRadius: 8,
              fontSize: 12,
            }}
            itemStyle={{ color: '#e0e0e0' }}
            formatter={(value: number, _name: string, props: { payload: MonthlyDataPoint }) => {
              const { generation, consumption, monthFull } = props.payload;
              const diff = generation - consumption;
              const label = diff >= 0 ? `+${diff} Wh surplus` : `${diff} Wh deficit`;
              return [
                `${monthFull}: ${generation.toLocaleString()} Wh generation vs ${consumption.toLocaleString()} Wh consumption = ${label}`,
                '',
              ];
            }}
            labelFormatter={() => ''}
          />
          <ReferenceLine
            y={dailyConsumption}
            stroke="#ffffff"
            strokeDasharray="5 3"
            label={{
              value: 'Daily consumption',
              position: 'right',
              fill: '#8b8b9e',
              fontSize: 11,
            }}
          />
          <Bar dataKey="generation" name="Generation" radius={[2, 2, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.generation >= dailyConsumption ? '#4ade80' : '#f87171'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
