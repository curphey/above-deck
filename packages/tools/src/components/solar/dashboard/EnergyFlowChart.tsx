import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from 'recharts';
import { Text } from '@mantine/core';
import { HEADING_FONT } from '@above-deck/shared/theme/fonts';

// Category color mapping
const CATEGORY_COLORS: Record<string, string> = {
  refrigeration: '#4ade80',
  navigation: '#60a5fa',
  communication: '#a78bfa',
  lighting: '#fbbf24',
  'water-systems': '#38bdf8',
  'comfort-galley': '#f87171',
  charging: '#fb923c',
  'sailing-safety': '#e879f9',
};

// Consumption schedule: which categories run at which hours
type Schedule = 'always' | 'daytime' | 'evening';

const CATEGORY_SCHEDULE: Record<string, Schedule> = {
  refrigeration: 'always',
  'water-systems': 'always',
  navigation: 'daytime',
  communication: 'daytime',
  'sailing-safety': 'daytime',
  lighting: 'evening',
  'comfort-galley': 'evening',
  charging: 'daytime',
};

function getScheduleHours(schedule: Schedule): [number, number] {
  switch (schedule) {
    case 'always':
      return [0, 24];
    case 'daytime':
      return [8, 18];
    case 'evening':
      return [17, 23];
  }
}

export interface HourlyDataPoint {
  hour: number;
  solar: number;
  totalConsumption: number;
  soc: number;
  [category: string]: number;
}

interface GenerateParams {
  chargeWhPerDay: number;
  peakSunHours: number;
  categories: Record<string, number>;
  batteryCapacityWh: number;
}

export function generateHourlyData(params: GenerateParams): HourlyDataPoint[] {
  const { chargeWhPerDay, peakSunHours, categories, batteryCapacityWh } = params;

  // Solar generation: Gaussian bell curve centered at noon
  const sigma = Math.max(peakSunHours, 1) / 2.355; // FWHM = peakSunHours
  const rawSolar: number[] = [];
  let solarSum = 0;

  for (let h = 0; h < 24; h++) {
    const x = h - 12; // center at noon
    const val = Math.exp((-x * x) / (2 * sigma * sigma));
    rawSolar.push(val);
    solarSum += val;
  }

  // Scale so total = chargeWhPerDay
  const solarScale = solarSum > 0 ? chargeWhPerDay / solarSum : 0;

  // Build category hourly values
  const categoryHourly: Record<string, number[]> = {};
  for (const [cat, whPerDay] of Object.entries(categories)) {
    const schedule = CATEGORY_SCHEDULE[cat] ?? 'always';
    const [start, end] = getScheduleHours(schedule);
    const activeHours = end - start;
    const whPerHour = activeHours > 0 ? whPerDay / activeHours : 0;

    categoryHourly[cat] = Array.from({ length: 24 }, (_, h) =>
      h >= start && h < end ? whPerHour : 0,
    );
  }

  // Build data points
  const data: HourlyDataPoint[] = [];
  let soc = 80; // Start at 80%

  for (let h = 0; h < 24; h++) {
    const solar = Math.round(rawSolar[h] * solarScale * 10) / 10;

    const point: HourlyDataPoint = {
      hour: h,
      solar,
      totalConsumption: 0,
      soc: 0,
    };

    let totalCons = 0;
    for (const [cat, hourly] of Object.entries(categoryHourly)) {
      const val = Math.round(hourly[h] * 10) / 10;
      point[cat] = val;
      totalCons += val;
    }
    point.totalConsumption = Math.round(totalCons * 10) / 10;

    // Record SOC at start of this hour
    point.soc = Math.round(soc * 10) / 10;

    // Update SOC for next hour
    const netWh = solar - totalCons;
    if (batteryCapacityWh > 0) {
      soc = soc + (netWh / batteryCapacityWh) * 100;
    }
    soc = Math.max(0, Math.min(100, soc));

    data.push(point);
  }

  return data;
}

interface EnergyFlowChartProps {
  drainWhPerDay: number;
  chargeWhPerDay: number;
  peakSunHours: number;
  categories: Record<string, number>;
  batteryCapacityWh: number;
}

function formatHour(hour: number): string {
  return `${hour}:00`;
}

export function EnergyFlowChart({
  chargeWhPerDay,
  peakSunHours,
  categories,
  batteryCapacityWh,
}: EnergyFlowChartProps) {
  const data = generateHourlyData({
    chargeWhPerDay,
    peakSunHours,
    categories,
    batteryCapacityWh,
  });

  const categoryNames = Object.keys(categories);

  return (
    <div data-testid="energy-flow-chart">
      <Text size="xs" c="dimmed" tt="uppercase" ff={HEADING_FONT} mb="xs">
        24-hour energy flow
      </Text>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#2d2d4a"
            strokeOpacity={0.5}
          />
          <XAxis
            dataKey="hour"
            tickFormatter={formatHour}
            stroke="#8b8b9e"
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            yAxisId="wh"
            stroke="#8b8b9e"
            fontSize={11}
            tickLine={false}
            label={{
              value: 'Wh',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#8b8b9e', fontSize: 11 },
            }}
          />
          <YAxis
            yAxisId="soc"
            orientation="right"
            domain={[0, 100]}
            stroke="#8b8b9e"
            fontSize={11}
            tickLine={false}
            label={{
              value: 'SOC %',
              angle: 90,
              position: 'insideRight',
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
            labelFormatter={(hour: number) => `${hour}:00`}
          />

          {/* Solar generation area */}
          <Area
            yAxisId="wh"
            type="monotone"
            dataKey="solar"
            stroke="#4ade80"
            fill="#4ade80"
            fillOpacity={0.3}
            name="Solar"
          />

          {/* Consumption stacked areas */}
          {categoryNames.map((cat) => (
            <Area
              key={cat}
              yAxisId="wh"
              type="monotone"
              dataKey={cat}
              stackId="consumption"
              stroke={CATEGORY_COLORS[cat] ?? '#888'}
              fill={CATEGORY_COLORS[cat] ?? '#888'}
              fillOpacity={0.4}
              name={cat.replaceAll('-', ' ')}
            />
          ))}

          {/* SOC line */}
          <Line
            yAxisId="soc"
            type="monotone"
            dataKey="soc"
            stroke="#ffffff"
            strokeDasharray="5 3"
            dot={false}
            name="Battery SOC %"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
