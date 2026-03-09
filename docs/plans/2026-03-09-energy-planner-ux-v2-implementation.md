# Energy Planner UX v2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the Energy Planner with journey selector, slider-based appliance cards, dual-mode storage (planning vs existing), and clean wireframe aesthetic.

**Architecture:** Modify Zustand store to add journey type, shore power hours, and battery bank capacity fields. Replace table-based EquipmentSection with card grid + sliders. Add JourneySelector component. Restyle all sections to match wireframe aesthetic (white cards on grey, numbered headers). Keep all existing calculation pure functions.

**Tech Stack:** React 19, Mantine v7, Zustand 5, Recharts 2, Vitest, TanStack Query 5

**Design doc:** `docs/plans/2026-03-09-energy-planner-ux-v2-design.md`

---

### Task 1: Update Store — Journey Type + Shore Power Hours + Battery Bank Ah

**Files:**
- Modify: `packages/web/src/stores/solar.ts`
- Modify: `packages/web/src/stores/__tests__/solar.test.ts`

**Context:** The store currently has `shorepower: 'no' | 'sometimes' | 'often'`. We need to replace it with `shorePowerHoursPerDay: number` and `shoreChargerAmps: number`. Also add `journeyType` and `batteryBankAh` for dual-mode storage.

**Step 1: Write the failing tests**

Add these test cases to `packages/web/src/stores/__tests__/solar.test.ts`:

```typescript
it('has journeyType field defaulting to plan', () => {
  expect(useSolarStore.getState().journeyType).toBe('plan');
});

it('sets journeyType', () => {
  const { setJourneyType } = useSolarStore.getState();
  setJourneyType('check');
  expect(useSolarStore.getState().journeyType).toBe('check');
});

it('has shorePowerHoursPerDay field defaulting to 0', () => {
  expect(useSolarStore.getState().shorePowerHoursPerDay).toBe(0);
});

it('sets shorePowerHoursPerDay', () => {
  const { setShorePowerHoursPerDay } = useSolarStore.getState();
  setShorePowerHoursPerDay(2.5);
  expect(useSolarStore.getState().shorePowerHoursPerDay).toBe(2.5);
});

it('has shoreChargerAmps field defaulting to 30', () => {
  expect(useSolarStore.getState().shoreChargerAmps).toBe(30);
});

it('has batteryBankAh field defaulting to 0', () => {
  expect(useSolarStore.getState().batteryBankAh).toBe(0);
});

it('sets batteryBankAh', () => {
  const { setBatteryBankAh } = useSolarStore.getState();
  setBatteryBankAh(400);
  expect(useSolarStore.getState().batteryBankAh).toBe(400);
});
```

**Step 2: Run tests to verify they fail**

Run: `cd packages/web && npx vitest run src/stores/__tests__/solar.test.ts`
Expected: FAIL — properties don't exist

**Step 3: Implement store changes**

In `packages/web/src/stores/solar.ts`:

1. Add to `SolarState` interface:
```typescript
journeyType: 'plan' | 'check' | 'upgrade';
setJourneyType: (type: 'plan' | 'check' | 'upgrade') => void;
shorePowerHoursPerDay: number;
setShorePowerHoursPerDay: (hours: number) => void;
shoreChargerAmps: number;
setShoreChargerAmps: (amps: number) => void;
batteryBankAh: number;
setBatteryBankAh: (ah: number) => void;
```

2. Remove from interface and `initialState`:
```typescript
// REMOVE these:
shorepower: 'no' | 'sometimes' | 'often';
setShorepower: (val: 'no' | 'sometimes' | 'often') => void;
```

3. Add to `initialState`:
```typescript
journeyType: 'plan' as const,
shorePowerHoursPerDay: 0,
shoreChargerAmps: 30,
batteryBankAh: 0,
```

4. Add setters in the `create` function:
```typescript
setJourneyType: (type) => set({ journeyType: type }),
setShorePowerHoursPerDay: (hours) => set({ shorePowerHoursPerDay: hours }),
setShoreChargerAmps: (amps) => set({ shoreChargerAmps: amps }),
setBatteryBankAh: (ah) => set({ batteryBankAh: ah }),
```

5. Remove: `setShorepower` setter

6. Update `partialize` to include new fields and remove `shorepower`:
```typescript
partialize: (state) => ({
  ...existingFields,
  journeyType: state.journeyType,
  shorePowerHoursPerDay: state.shorePowerHoursPerDay,
  shoreChargerAmps: state.shoreChargerAmps,
  batteryBankAh: state.batteryBankAh,
  // remove: shorepower
}),
```

**Step 4: Run tests to verify they pass**

Run: `cd packages/web && npx vitest run src/stores/__tests__/solar.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/web/src/stores/solar.ts packages/web/src/stores/__tests__/solar.test.ts
git commit -m "feat: add journey type, shore power hours, battery bank Ah to store"
```

---

### Task 2: Update Charging Calculation — Shore Power Wh

**Files:**
- Modify: `packages/web/src/lib/solar/charging.ts`
- Modify: `packages/web/src/lib/solar/__tests__/charging.test.ts`

**Context:** `calculateDailyCharging` currently accepts `shorepower: 'no' | 'sometimes' | 'often'` but doesn't actually use it for calculation. Replace with `shorePowerHoursPerDay` and `shoreChargerAmps` to compute real shore power Wh.

**Step 1: Write the failing test**

Add to `packages/web/src/lib/solar/__tests__/charging.test.ts`:

```typescript
it('calculates shore power Wh from hours and charger amps', () => {
  const result = calculateDailyCharging({
    solarPanelWatts: 0,
    panelType: 'rigid',
    peakSunHours: 0,
    deratingFactor: 0.75,
    alternatorAmps: 0,
    motoringHoursPerDay: 0,
    systemVoltage: 12,
    shorePowerHoursPerDay: 2.5,
    shoreChargerAmps: 30,
  });
  // 30A × 12V × 2.5h = 900 Wh
  expect(result.shoreWhPerDay).toBe(900);
  expect(result.totalWhPerDay).toBe(900);
});

it('returns zero shore power when hours is zero', () => {
  const result = calculateDailyCharging({
    solarPanelWatts: 400,
    panelType: 'rigid',
    peakSunHours: 4.5,
    deratingFactor: 0.75,
    alternatorAmps: 0,
    motoringHoursPerDay: 0,
    systemVoltage: 12,
    shorePowerHoursPerDay: 0,
    shoreChargerAmps: 30,
  });
  expect(result.shoreWhPerDay).toBe(0);
});
```

**Step 2: Run tests to verify they fail**

Run: `cd packages/web && npx vitest run src/lib/solar/__tests__/charging.test.ts`
Expected: FAIL — `shoreWhPerDay` not in result, `shorePowerHoursPerDay` not in input type

**Step 3: Implement**

In `packages/web/src/lib/solar/charging.ts`:

1. Update `ChargingInput`:
```typescript
export interface ChargingInput {
  solarPanelWatts: number;
  panelType: PanelType;
  peakSunHours: number;
  deratingFactor: number;
  alternatorAmps: number;
  motoringHoursPerDay: number;
  systemVoltage: number;
  shorePowerHoursPerDay: number;
  shoreChargerAmps: number;
}
```

2. Update `ChargingResult`:
```typescript
export interface ChargingResult {
  solarWhPerDay: number;
  alternatorWhPerDay: number;
  shoreWhPerDay: number;
  totalWhPerDay: number;
}
```

3. Update `calculateDailyCharging`:
```typescript
export function calculateDailyCharging(input: ChargingInput): ChargingResult {
  const panelFactor = PANEL_TYPE_FACTOR[input.panelType];
  const solarWhPerDay = Math.round(
    input.solarPanelWatts * input.peakSunHours * input.deratingFactor * panelFactor
  );
  const alternatorWhPerDay = Math.round(
    input.alternatorAmps * input.motoringHoursPerDay * ALTERNATOR_EFFICIENCY * input.systemVoltage
  );
  const shoreWhPerDay = Math.round(
    input.shoreChargerAmps * input.systemVoltage * input.shorePowerHoursPerDay
  );
  return {
    solarWhPerDay,
    alternatorWhPerDay,
    shoreWhPerDay,
    totalWhPerDay: solarWhPerDay + alternatorWhPerDay + shoreWhPerDay,
  };
}
```

**Step 4: Fix any existing tests that break**

The existing tests pass `shorepower: 'no'` — update them to pass `shorePowerHoursPerDay: 0, shoreChargerAmps: 30` instead. Remove the old `shorepower` field from all test inputs.

**Step 5: Run all tests**

Run: `cd packages/web && npx vitest run src/lib/solar/__tests__/charging.test.ts`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add packages/web/src/lib/solar/charging.ts packages/web/src/lib/solar/__tests__/charging.test.ts
git commit -m "feat: add shore power Wh calculation from hours + charger amps"
```

---

### Task 3: Update useSolarCalculation Hook — Wire New Store Fields

**Files:**
- Modify: `packages/web/src/hooks/use-solar-calculation.ts`
- Modify: `packages/web/src/hooks/__tests__/use-solar-calculation.test.ts`

**Context:** The hook reads from the store and calls the pure calculation functions. It needs to pass the new `shorePowerHoursPerDay` and `shoreChargerAmps` fields to `calculateDailyCharging` instead of the old `shorepower` field.

**Step 1: Update the `computeResults` pure function**

Read the current `use-solar-calculation.ts` to understand the function signature. Change the `shorepower` parameter to `shorePowerHoursPerDay` and `shoreChargerAmps`. Update the `ChargingInput` object passed to `calculateDailyCharging`.

**Step 2: Update the hook to read new store fields**

Replace:
```typescript
const shorepower = useSolarStore((s) => s.shorepower);
```
With:
```typescript
const shorePowerHoursPerDay = useSolarStore((s) => s.shorePowerHoursPerDay);
const shoreChargerAmps = useSolarStore((s) => s.shoreChargerAmps);
```

**Step 3: Update tests**

In `packages/web/src/hooks/__tests__/use-solar-calculation.test.ts`, update any `computeResults` call to pass the new fields instead of `shorepower`.

**Step 4: Run tests**

Run: `cd packages/web && npx vitest run src/hooks/__tests__/use-solar-calculation.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/web/src/hooks/use-solar-calculation.ts packages/web/src/hooks/__tests__/use-solar-calculation.test.ts
git commit -m "feat: wire shore power hours through calculation hook"
```

---

### Task 4: Update ChargingSection — Shore Power Time Input

**Files:**
- Modify: `packages/web/src/components/solar/ChargingSection.tsx`

**Context:** Replace the shore power SegmentedControl (`No/Sometimes/Often`) with a NumberInput for hours per day and a NumberInput for charger amps.

**Step 1: Update ChargingSection**

Replace the shore power SegmentedControl block (lines ~70-79) with:

```tsx
<Grid.Col span={{ base: 6, sm: 4 }}>
  <NumberInput label="Shore power hours/day" value={shorePowerHoursPerDay}
    onChange={(val) => setShorePowerHoursPerDay(Number(val) || 0)}
    min={0} max={24} step={0.5} decimalScale={1} />
</Grid.Col>
<Grid.Col span={{ base: 6, sm: 4 }}>
  <NumberInput label="Shore charger amps" value={shoreChargerAmps}
    onChange={(val) => setShoreChargerAmps(Number(val) || 0)}
    min={0} max={100} />
</Grid.Col>
```

Update the store selectors at the top to read `shorePowerHoursPerDay`, `setShorePowerHoursPerDay`, `shoreChargerAmps`, `setShoreChargerAmps` instead of `shorepower`/`setShorepower`.

Also update the `ChargingResult` usage — the `charging` prop now has `shoreWhPerDay`. Display it:
```tsx
<Text size="xs" c="dimmed">
  Estimated solar: {charging.solarWhPerDay} Wh/day
  {charging.shoreWhPerDay > 0 && ` · Shore: ${charging.shoreWhPerDay} Wh/day`}
</Text>
```

**Step 2: Run the full test suite to ensure no type errors**

Run: `cd packages/web && npx vitest run`
Expected: ALL PASS (no tests directly test ChargingSection, but type errors would break compilation)

**Step 3: Commit**

```bash
git add packages/web/src/components/solar/ChargingSection.tsx
git commit -m "feat: replace shore power toggle with hours/amps inputs"
```

---

### Task 5: JourneySelector Component

**Files:**
- Create: `packages/web/src/components/solar/JourneySelector.tsx`
- Create: `packages/web/src/components/solar/__tests__/JourneySelector.test.tsx`

**Context:** Three selectable cards: "Plan a new system", "Check my existing setup", "Add or upgrade". Selection updates `journeyType` in the store.

**Step 1: Write the failing tests**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { JourneySelector } from '../JourneySelector';
import { useSolarStore } from '@/stores/solar';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

beforeEach(() => useSolarStore.setState({ journeyType: 'plan' }));

describe('JourneySelector', () => {
  it('renders three journey options', () => {
    render(<JourneySelector />, { wrapper });
    expect(screen.getByText('Plan a new system')).toBeDefined();
    expect(screen.getByText('Check my existing setup')).toBeDefined();
    expect(screen.getByText('Add or upgrade')).toBeDefined();
  });

  it('highlights the selected journey', () => {
    render(<JourneySelector />, { wrapper });
    const planCard = screen.getByText('Plan a new system').closest('[data-journey]');
    expect(planCard?.getAttribute('data-selected')).toBe('true');
  });

  it('updates store when journey is selected', () => {
    render(<JourneySelector />, { wrapper });
    fireEvent.click(screen.getByText('Check my existing setup'));
    expect(useSolarStore.getState().journeyType).toBe('check');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd packages/web && npx vitest run src/components/solar/__tests__/JourneySelector.test.tsx`
Expected: FAIL — module not found

**Step 3: Implement JourneySelector**

Create `packages/web/src/components/solar/JourneySelector.tsx`:

```tsx
import { Grid, Paper, Stack, Text, Title } from '@mantine/core';
import { useSolarStore } from '@/stores/solar';

const HEADING_FONT = "'Space Mono', monospace";

type JourneyType = 'plan' | 'check' | 'upgrade';

const JOURNEYS: { type: JourneyType; title: string; description: string }[] = [
  {
    type: 'plan',
    title: 'Plan a new system',
    description: 'Full sizing from scratch — boat, loads, location, complete recommendation',
  },
  {
    type: 'check',
    title: 'Check my existing setup',
    description: 'Enter what you have — see if your solar and batteries are enough',
  },
  {
    type: 'upgrade',
    title: 'Add or upgrade',
    description: 'Adding a watermaker? Switching to lithium? See what changes',
  },
];

export function JourneySelector() {
  const journeyType = useSolarStore((s) => s.journeyType);
  const setJourneyType = useSolarStore((s) => s.setJourneyType);

  return (
    <Stack gap="md">
      <Title order={3} ff={HEADING_FONT} tt="uppercase" c="dimmed" fz="sm" style={{ letterSpacing: '1px', borderBottom: '1px solid var(--mantine-color-default-border)', paddingBottom: 8 }}>
        1. What brings you here?
      </Title>
      <Grid>
        {JOURNEYS.map((j) => (
          <Grid.Col key={j.type} span={{ base: 12, sm: 4 }}>
            <Paper
              data-journey={j.type}
              data-selected={journeyType === j.type ? 'true' : 'false'}
              p="xl"
              withBorder
              style={{
                cursor: 'pointer',
                borderWidth: journeyType === j.type ? 2 : 1,
                borderColor: journeyType === j.type ? 'var(--mantine-color-dark-9)' : undefined,
                textAlign: 'center',
                minHeight: 140,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
              onClick={() => setJourneyType(j.type)}
            >
              <Text fw={600} mb="xs">{j.title}</Text>
              <Text size="sm" c="dimmed">{j.description}</Text>
            </Paper>
          </Grid.Col>
        ))}
      </Grid>
    </Stack>
  );
}
```

**Step 4: Run tests**

Run: `cd packages/web && npx vitest run src/components/solar/__tests__/JourneySelector.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/web/src/components/solar/JourneySelector.tsx packages/web/src/components/solar/__tests__/JourneySelector.test.tsx
git commit -m "feat: add JourneySelector component with three journey cards"
```

---

### Task 6: ApplianceCard + HoursSlider Components

**Files:**
- Create: `packages/web/src/components/solar/ApplianceCard.tsx`
- Create: `packages/web/src/components/solar/__tests__/ApplianceCard.test.tsx`

**Context:** Replace the table-based `EquipmentRow` with a card containing: name + toggle, wattage display, hours/day slider, stock/added badge. This is the biggest visual change.

**Step 1: Write the failing tests**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { ApplianceCard } from '../ApplianceCard';
import type { Appliance } from '@/lib/solar/types';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

const mockAppliance: Appliance = {
  id: '1', name: 'Chartplotter', category: 'navigation',
  wattsTypical: 15, wattsMin: 7, wattsMax: 20,
  hoursPerDayAnchor: 2, hoursPerDayPassage: 16,
  dutyCycle: 1.0, usageType: 'scheduled', crewScaling: false,
  enabled: true, origin: 'stock',
};

describe('ApplianceCard', () => {
  it('renders appliance name and wattage', () => {
    render(<ApplianceCard appliance={mockAppliance} viewMode="anchor" crewSize={2}
      onToggle={vi.fn()} onUpdateHours={vi.fn()} onRemove={vi.fn()} />, { wrapper });
    expect(screen.getByText('Chartplotter')).toBeDefined();
    expect(screen.getByText(/15W typical/)).toBeDefined();
  });

  it('shows stock badge for stock appliances', () => {
    render(<ApplianceCard appliance={mockAppliance} viewMode="anchor" crewSize={2}
      onToggle={vi.fn()} onUpdateHours={vi.fn()} onRemove={vi.fn()} />, { wrapper });
    expect(screen.getByText('Stock')).toBeDefined();
  });

  it('renders slider with current hours value', () => {
    render(<ApplianceCard appliance={mockAppliance} viewMode="anchor" crewSize={2}
      onToggle={vi.fn()} onUpdateHours={vi.fn()} onRemove={vi.fn()} />, { wrapper });
    expect(screen.getByText('2h/day')).toBeDefined();
  });

  it('calls onToggle when switch is clicked', () => {
    const onToggle = vi.fn();
    render(<ApplianceCard appliance={mockAppliance} viewMode="anchor" crewSize={2}
      onToggle={onToggle} onUpdateHours={vi.fn()} onRemove={vi.fn()} />, { wrapper });
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledWith('1');
  });

  it('shows crew multiplier for crew-scaling appliances', () => {
    const crewAppliance = { ...mockAppliance, crewScaling: true };
    render(<ApplianceCard appliance={crewAppliance} viewMode="anchor" crewSize={4}
      onToggle={vi.fn()} onUpdateHours={vi.fn()} onRemove={vi.fn()} />, { wrapper });
    expect(screen.getByText(/× 4 crew/)).toBeDefined();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd packages/web && npx vitest run src/components/solar/__tests__/ApplianceCard.test.tsx`
Expected: FAIL

**Step 3: Implement ApplianceCard**

Create `packages/web/src/components/solar/ApplianceCard.tsx`:

```tsx
import { Badge, Group, Paper, Slider, Stack, Switch, Text } from '@mantine/core';
import type { Appliance } from '@/lib/solar/types';
import type { ViewMode } from '@/stores/solar';

interface ApplianceCardProps {
  appliance: Appliance;
  viewMode: ViewMode;
  crewSize: number;
  onToggle: (id: string) => void;
  onUpdateHours: (id: string, mode: ViewMode, hours: number) => void;
  onRemove: (id: string) => void;
}

export function ApplianceCard({ appliance, viewMode, crewSize, onToggle, onUpdateHours, onRemove }: ApplianceCardProps) {
  const hours = viewMode === 'anchor' ? appliance.hoursPerDayAnchor : appliance.hoursPerDayPassage;
  const crewMultiplier = appliance.crewScaling ? crewSize / 2 : 1;
  const dailyWh = Math.round(appliance.wattsTypical * hours * appliance.dutyCycle * crewMultiplier);

  return (
    <Paper
      p="md"
      withBorder
      style={{
        opacity: appliance.enabled ? 1 : 0.5,
        borderLeft: appliance.crewScaling ? '3px solid var(--mantine-color-blue-5)' : undefined,
      }}
    >
      <Stack gap="xs">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Text fw={600} size="sm">{appliance.name}</Text>
            <Badge size="xs" variant="light" color={appliance.origin === 'stock' ? 'gray' : 'blue'}>
              {appliance.origin === 'stock' ? 'Stock' : 'Added'}
            </Badge>
          </Group>
          <Switch
            checked={appliance.enabled}
            onChange={() => onToggle(appliance.id)}
            size="sm"
          />
        </Group>

        <Text size="xs" c="dimmed">
          {appliance.wattsTypical}W typical ({appliance.wattsMin}–{appliance.wattsMax}W)
          {appliance.crewScaling && ` × ${crewSize} crew`}
        </Text>

        <Slider
          value={hours}
          onChange={(val) => onUpdateHours(appliance.id, viewMode, val)}
          min={0}
          max={24}
          step={0.5}
          disabled={!appliance.enabled}
          label={(val) => `${val}h`}
          size="sm"
        />

        <Group justify="space-between">
          <Text size="xs" c="dimmed">{hours}h/day</Text>
          <Text size="xs" fw={600}>{dailyWh} Wh/day</Text>
        </Group>
      </Stack>
    </Paper>
  );
}
```

**Step 4: Run tests**

Run: `cd packages/web && npx vitest run src/components/solar/__tests__/ApplianceCard.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/web/src/components/solar/ApplianceCard.tsx packages/web/src/components/solar/__tests__/ApplianceCard.test.tsx
git commit -m "feat: add ApplianceCard with slider and toggle"
```

---

### Task 7: Rewrite EquipmentSection — Card Grid + Crew Multiplier

**Files:**
- Modify: `packages/web/src/components/solar/EquipmentSection.tsx`

**Context:** Replace the Table-based layout with a responsive grid of ApplianceCards. Move crew size control INTO this section (it's a drain multiplier). Remove all Table/Thead/Tbody imports. Add NumberInput for crew size at the top.

**Step 1: Rewrite EquipmentSection**

```tsx
import { useMemo, useState } from 'react';
import { Chip, Grid, Group, NumberInput, SegmentedControl, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useSolarStore, type ViewMode } from '@/stores/solar';
import { ApplianceCard } from './ApplianceCard';
import { AddEquipmentModal } from './AddEquipmentModal';
import type { Appliance } from '@/lib/solar/types';

const HEADING_FONT = "'Space Mono', monospace";

const CATEGORIES = [
  'All', 'navigation', 'communication', 'refrigeration', 'lighting',
  'water-systems', 'comfort-galley', 'charging', 'sailing-safety',
];

export function EquipmentSection() {
  const appliances = useSolarStore((s) => s.appliances);
  const setAppliances = useSolarStore((s) => s.setAppliances);
  const viewMode = useSolarStore((s) => s.viewMode);
  const setViewMode = useSolarStore((s) => s.setViewMode);
  const crewSize = useSolarStore((s) => s.crewSize);
  const setCrewSize = useSolarStore((s) => s.setCrewSize);
  const toggleAppliance = useSolarStore((s) => s.toggleAppliance);
  const removeAppliance = useSolarStore((s) => s.removeAppliance);
  const updateApplianceHours = useSolarStore((s) => s.updateApplianceHours);

  const [categoryFilter, setCategoryFilter] = useState('All');

  const filtered = categoryFilter === 'All'
    ? appliances
    : appliances.filter((a) => a.category === categoryFilter);

  const totalWh = useMemo(() => {
    return appliances
      .filter((a) => a.enabled)
      .reduce((sum, a) => {
        const hours = viewMode === 'anchor' ? a.hoursPerDayAnchor : a.hoursPerDayPassage;
        const crew = a.crewScaling ? crewSize / 2 : 1;
        return sum + a.wattsTypical * hours * a.dutyCycle * crew;
      }, 0);
  }, [appliances, viewMode, crewSize]);

  const handleAddEquipment = (newAppliances: Appliance[]) => {
    setAppliances([...appliances, ...newAppliances]);
  };

  return (
    <Stack gap="md">
      <Title order={3} ff={HEADING_FONT} tt="uppercase" c="dimmed" fz="sm" style={{ letterSpacing: '1px', borderBottom: '1px solid var(--mantine-color-default-border)', paddingBottom: 8 }}>
        3. Equipment — {Math.round(totalWh)} Wh/day
      </Title>

      <Group justify="space-between" align="end">
        <Group gap="md">
          <NumberInput label="Crew" value={crewSize}
            onChange={(val) => setCrewSize(Number(val) || 2)}
            min={1} max={12} w={80} size="sm" />
          <SegmentedControl size="xs" value={viewMode}
            onChange={(val) => setViewMode(val as ViewMode)}
            data={[
              { label: 'At anchor', value: 'anchor' },
              { label: 'On passage', value: 'passage' },
            ]} />
        </Group>
      </Group>

      <Group gap="xs">
        {CATEGORIES.map((cat) => (
          <Chip key={cat} checked={categoryFilter === cat}
            onChange={() => setCategoryFilter(cat)} size="xs">
            {cat === 'All' ? 'All' : cat.replace('-', ' ')}
          </Chip>
        ))}
      </Group>

      {appliances.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          Select a boat above to load its standard equipment, or add items manually.
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, lg: 4 }} spacing="md">
          {filtered.map((a) => (
            <ApplianceCard
              key={a.id}
              appliance={a}
              viewMode={viewMode}
              crewSize={crewSize}
              onToggle={toggleAppliance}
              onUpdateHours={updateApplianceHours}
              onRemove={removeAppliance}
            />
          ))}
        </SimpleGrid>
      )}

      <AddEquipmentModal
        existingIds={appliances.map((a) => a.id)}
        onAdd={handleAddEquipment}
      />
    </Stack>
  );
}
```

**Step 2: Run full test suite**

Run: `cd packages/web && npx vitest run`
Expected: ALL PASS

**Step 3: Commit**

```bash
git add packages/web/src/components/solar/EquipmentSection.tsx
git commit -m "feat: rewrite EquipmentSection with card grid and crew multiplier"
```

---

### Task 8: Update YourBoatSection — Remove Crew, Simplify

**Files:**
- Modify: `packages/web/src/components/solar/YourBoatSection.tsx`

**Context:** Crew size has moved to EquipmentSection. Days self-sufficient has moved to StorageSection. YourBoatSection should only have the boat picker now.

**Step 1: Read current YourBoatSection.tsx and simplify**

Remove the `crewSize` NumberInput and the `daysAutonomy` NumberInput. Keep only the BoatSelector and the section header.

The section header should use the wireframe style:
```tsx
<Title order={3} ff={HEADING_FONT} tt="uppercase" c="dimmed" fz="sm" style={{ letterSpacing: '1px', borderBottom: '1px solid var(--mantine-color-default-border)', paddingBottom: 8 }}>
  2. Your boat
</Title>
```

**Step 2: Run full test suite**

Run: `cd packages/web && npx vitest run`
Expected: ALL PASS

**Step 3: Commit**

```bash
git add packages/web/src/components/solar/YourBoatSection.tsx
git commit -m "feat: simplify YourBoatSection to boat picker only"
```

---

### Task 9: Update StorageSection — Dual Mode (Planning vs Existing)

**Files:**
- Modify: `packages/web/src/components/solar/StorageSection.tsx`

**Context:** In "plan" journey: user sets target days self-sufficient → tool calculates recommended bank size. In "check"/"upgrade" journey: user enters their bank capacity → tool shows days of autonomy.

**Step 1: Implement dual-mode StorageSection**

Read `journeyType` from store. Conditionally render:

**Planning mode** (`journeyType === 'plan'`):
- Battery chemistry selector
- System voltage selector
- Target days self-sufficient: NumberInput (1-14, default 3) — reads/writes `daysAutonomy`
- Output: Recommended bank size from `recommendation.batteryAh`

**Existing mode** (`journeyType === 'check' || journeyType === 'upgrade'`):
- Battery chemistry selector
- System voltage selector
- Battery bank capacity: NumberInput (Ah) — reads/writes `batteryBankAh`
- Output: Days of autonomy = `(bankAh × systemVoltage × dodFactor) / dailyDrainWh`

The `dailyDrainWh` is needed as a prop from the parent. Add it to `StorageSectionProps`:
```typescript
interface StorageSectionProps {
  recommendation: SolarRecommendation;
  dailyDrainWh: number;
}
```

The days autonomy calculation:
```typescript
const dodFactor = batteryChemistry === 'lifepo4' ? 0.8 : 0.5;
const usableWh = batteryBankAh * systemVoltage * dodFactor;
const daysAutonomy = dailyDrainWh > 0 ? usableWh / dailyDrainWh : 0;
```

Apply the wireframe header style with number "5. Storage".

**Step 2: Run full test suite**

Run: `cd packages/web && npx vitest run`
Expected: ALL PASS

**Step 3: Commit**

```bash
git add packages/web/src/components/solar/StorageSection.tsx
git commit -m "feat: dual-mode StorageSection (planning vs existing)"
```

---

### Task 10: Update EnergyPlanner — Wire JourneySelector + Section Numbers

**Files:**
- Modify: `packages/web/src/components/solar/EnergyPlanner.tsx`

**Context:** Add JourneySelector as section 1. Update section numbering. Pass `dailyDrainWh` to StorageSection. Apply wireframe wrapper styling (light grey background, white card sections).

**Step 1: Update EnergyPlanner**

```tsx
import { useMemo, useState } from 'react';
import { Container, Paper, Stack, Title } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '../MantineProvider';

import { useSolarCalculation } from '@/hooks/use-solar-calculation';
import { useSolarStore } from '@/stores/solar';
import { REGIONS } from './RegionPicker';

import { JourneySelector } from './JourneySelector';
import { YourBoatSection } from './YourBoatSection';
import { EquipmentSection } from './EquipmentSection';
import { ChargingSection } from './ChargingSection';
import { StorageSection } from './StorageSection';
import { BalanceSection } from './BalanceSection';
import { SaveBar } from './SaveBar';

function EnergyPlannerInner() {
  const regionName = useSolarStore((s) => s.regionName);
  const viewMode = useSolarStore((s) => s.viewMode);

  const peakSunHours = useMemo(() => {
    const region = REGIONS.find((r) => r.label === regionName);
    return region?.psh ?? 4.5;
  }, [regionName]);

  const { consumption, recommendation, charging } = useSolarCalculation(peakSunHours);

  const dailyDrainWh = viewMode === 'anchor'
    ? consumption.totalWhPerDayAnchor
    : consumption.totalWhPerDayPassage;

  return (
    <>
      <Container size="lg" py="xl" pb={80}>
        <Stack gap="xl">
          {/* 1. Journey */}
          <JourneySelector />

          {/* 2. Your Boat */}
          <YourBoatSection />

          {/* 3. Equipment (drains) */}
          <EquipmentSection />

          {/* 4. Charging (fills) */}
          <ChargingSection charging={charging} />

          {/* 5. Storage (buffer) */}
          <StorageSection recommendation={recommendation} dailyDrainWh={dailyDrainWh} />

          {/* 6. Balance */}
          <BalanceSection
            consumption={consumption}
            charging={charging}
            recommendation={recommendation}
          />
        </Stack>
      </Container>

      <SaveBar isAuthenticated={false} />
    </>
  );
}

export function EnergyPlanner() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <EnergyPlannerInner />
      </QueryClientProvider>
    </MantineProvider>
  );
}
```

**Step 2: Run full test suite**

Run: `cd packages/web && npx vitest run`
Expected: ALL PASS

**Step 3: Commit**

```bash
git add packages/web/src/components/solar/EnergyPlanner.tsx
git commit -m "feat: wire JourneySelector into EnergyPlanner, pass dailyDrainWh"
```

---

### Task 11: Wireframe Styling — Section Headers + Layout

**Files:**
- Modify: `packages/web/src/components/solar/ChargingSection.tsx` (header style)
- Modify: `packages/web/src/components/solar/BalanceSection.tsx` (header style)

**Context:** Apply consistent wireframe-style numbered section headers to Charging (4.) and Balance (6.) sections. The headers should be:
- Uppercase text transform
- Small font size, `letter-spacing: 1px`
- Dimmed grey color
- Bottom border separator

Also update the BalanceSection header to "6. Balance" style.

**Step 1: Update section headers**

In `ChargingSection.tsx`, replace the Title with:
```tsx
<Title order={3} ff={HEADING_FONT} tt="uppercase" c="dimmed" fz="sm" style={{ letterSpacing: '1px', borderBottom: '1px solid var(--mantine-color-default-border)', paddingBottom: 8 }}>
  4. Charging — {charging.totalWhPerDay} Wh/day
</Title>
```

In `BalanceSection.tsx`, replace the Title with:
```tsx
<Title order={3} ff={HEADING_FONT} tt="uppercase" c="dimmed" fz="sm" style={{ letterSpacing: '1px', borderBottom: '1px solid var(--mantine-color-default-border)', paddingBottom: 8 }}>
  6. Balance
</Title>
```

**Step 2: Run full test suite**

Run: `cd packages/web && npx vitest run`
Expected: ALL PASS

**Step 3: Commit**

```bash
git add packages/web/src/components/solar/ChargingSection.tsx packages/web/src/components/solar/BalanceSection.tsx
git commit -m "style: apply wireframe-style numbered section headers"
```

---

### Task 12: Clean Up — Remove EquipmentRow + Old Imports

**Files:**
- Delete: `packages/web/src/components/solar/EquipmentRow.tsx`
- Verify no remaining imports of `EquipmentRow`

**Context:** EquipmentRow was the table-row component replaced by ApplianceCard. It's no longer imported anywhere after Task 7.

**Step 1: Verify no imports**

Run: `grep -r "EquipmentRow" packages/web/src/` — should return nothing (only the file itself).

**Step 2: Delete the file**

```bash
rm packages/web/src/components/solar/EquipmentRow.tsx
```

**Step 3: Run full test suite**

Run: `cd packages/web && npx vitest run`
Expected: ALL PASS (61+ tests)

**Step 4: Commit**

```bash
git add -A packages/web/src/components/solar/EquipmentRow.tsx
git commit -m "chore: remove EquipmentRow replaced by ApplianceCard"
```

---

### Task 13: Visual Verification

**Files:** None (manual verification)

**Step 1: Start the dev server**

```bash
cd packages/web && npm run dev
```

**Step 2: Open `/tools/solar` in a browser and verify:**

- [ ] Journey selector shows 3 cards, clicking one highlights it
- [ ] Selecting a boat loads stock appliance cards with sliders
- [ ] Crew size input is in the Equipment section
- [ ] Sliders adjust hours/day for each appliance
- [ ] Toggle enables/disables appliance cards
- [ ] Category chips filter the card grid
- [ ] Anchor/Passage toggle switches slider values
- [ ] Shore power shows hours/day + charger amps inputs
- [ ] Storage section shows dual mode based on journey:
  - Plan: target days → recommended bank
  - Check/Upgrade: bank capacity → days autonomy
- [ ] Balance section shows live totals, donut chart, tiers
- [ ] Section headers are numbered, uppercase, wireframe style

**Step 3: Take screenshots to `tmp/screenshots/` for review**
