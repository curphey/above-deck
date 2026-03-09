import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Text, Stack } from '@mantine/core';

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

interface ConsumptionDonutProps {
  breakdown: Record<string, { anchor: number; passage: number }>;
  viewMode: 'anchor' | 'passage';
  totalWh: number;
}

export function ConsumptionDonut({
  breakdown,
  viewMode,
  totalWh,
}: ConsumptionDonutProps) {
  const data = Object.entries(breakdown)
    .map(([category, values]) => ({
      name: category.replace('-', ' '),
      value: Math.round(viewMode === 'anchor' ? values.anchor : values.passage),
      color: CATEGORY_COLORS[category] ?? '#888',
    }))
    .filter((d) => d.value > 0);

  return (
    <Stack align="center" gap="xs">
      <div style={{ position: 'relative', width: 240, height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => `${value} Wh`}
              contentStyle={{ background: '#16213e', border: 'none', borderRadius: 8 }}
              itemStyle={{ color: '#e0e0e0' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <Text size="xl" fw={700}>
            {Math.round(totalWh)}
          </Text>
          <Text size="xs" c="dimmed">
            Wh/day
          </Text>
        </div>
      </div>
    </Stack>
  );
}
