# Energy Planner Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure the Energy Planner around a storage/drainage mental model: equipment drains, charging fills, storage buffers. Replace cruising style with days of self-sufficiency, add boat-seeded equipment lists, add solar panel configuration.

**Architecture:** Zustand store gets new fields (solarPanelWatts, panelType, origin on appliances). Five new section components replace the current scattered layout. Calculation engine gets a new `calculateDailyCharging()` function that computes solar + alternator input. Existing pure functions (engine.ts, sizing.ts) are extended, not replaced.

**Tech Stack:** React 19, Mantine v7, Zustand 5, TanStack Query 5, Recharts 2, Vitest, Supabase

**Working directory:** `/Users/curphey/Documents/GitHub/above-deck/.worktrees/feature-launch`

**Note:** All component paths relative to `packages/web/src/`. All commands run from worktree root.

---

## Task 1: Update Types and Store

**Files:**
- Modify: `packages/web/src/lib/solar/types.ts`
- Modify: `packages/web/src/stores/solar.ts`
- Modify: `packages/web/src/stores/__tests__/solar.test.ts`

### Step 1: Write failing tests for new store fields

Add tests to `packages/web/src/stores/__tests__/solar.test.ts`:

```typescript
it('should set solarPanelWatts', () => {
  useSolarStore.getState().setSolarPanelWatts(400);
  expect(useSolarStore.getState().solarPanelWatts).toBe(400);
});

it('should set panelType', () => {
  useSolarStore.getState().setPanelType('semi-flexible');
  expect(useSolarStore.getState().panelType).toBe('semi-flexible');
});

it('should not have cruisingStyle', () => {
  const state = useSolarStore.getState();
  expect('cruisingStyle' in state).toBe(false);
});

it('should set appliance origin field', () => {
  const appliance = {
    id: '1', name: 'Test', category: 'navigation',
    wattsTypical: 10, wattsMin: 5, wattsMax: 15,
    hoursPerDayAnchor: 1, hoursPerDayPassage: 1,
    dutyCycle: 1, usageType: 'always-on' as const,
    crewScaling: false, enabled: true, origin: 'stock' as const,
  };
  useSolarStore.getState().setAppliances([appliance]);
  expect(useSolarStore.getState().appliances[0].origin).toBe('stock');
});

it('should remove appliance by id', () => {
  const a1 = {
    id: '1', name: 'A', category: 'navigation',
    wattsTypical: 10, wattsMin: 5, wattsMax: 15,
    hoursPerDayAnchor: 1, hoursPerDayPassage: 1,
    dutyCycle: 1, usageType: 'always-on' as const,
    crewScaling: false, enabled: true, origin: 'catalog' as const,
  };
  const a2 = { ...a1, id: '2', name: 'B', origin: 'stock' as const };
  useSolarStore.getState().setAppliances([a1, a2]);
  useSolarStore.getState().removeAppliance('1');
  expect(useSolarStore.getState().appliances).toHaveLength(1);
  expect(useSolarStore.getState().appliances[0].id).toBe('2');
});

it('should update appliance watts', () => {
  const appliance = {
    id: '1', name: 'Test', category: 'navigation',
    wattsTypical: 10, wattsMin: 5, wattsMax: 15,
    hoursPerDayAnchor: 1, hoursPerDayPassage: 1,
    dutyCycle: 1, usageType: 'always-on' as const,
    crewScaling: false, enabled: true, origin: 'stock' as const,
  };
  useSolarStore.getState().setAppliances([appliance]);
  useSolarStore.getState().updateApplianceWatts('1', 25);
  expect(useSolarStore.getState().appliances[0].wattsTypical).toBe(25);
});
```

### Step 2: Run tests to verify they fail

```bash
pnpm --filter @above-deck/web test -- --run stores/__tests__/solar.test.ts
```

Expected: FAIL — `solarPanelWatts`, `panelType`, `removeAppliance`, `updateApplianceWatts` don't exist, `cruisingStyle` still exists.

### Step 3: Update types

In `packages/web/src/lib/solar/types.ts`, add `origin` to `Appliance`:

```typescript
export interface Appliance {
  id: string;
  name: string;
  category: string;
  wattsTypical: number;
  wattsMin: number;
  wattsMax: number;
  hoursPerDayAnchor: number;
  hoursPerDayPassage: number;
  dutyCycle: number;
  usageType: 'always-on' | 'scheduled' | 'intermittent';
  crewScaling: boolean;
  enabled: boolean;
  origin: 'stock' | 'catalog' | 'custom';
}

export type PanelType = 'rigid' | 'semi-flexible' | 'flexible';
```

Remove `JourneyMode` type (no longer used).

### Step 4: Update store

In `packages/web/src/stores/solar.ts`:

- **Remove:** `journeyMode`, `setJourneyMode`, `cruisingStyle`, `setCruisingStyle` and all references
- **Add:** `solarPanelWatts: number` (default 0), `setSolarPanelWatts`
- **Add:** `panelType: PanelType` (default 'rigid'), `setPanelType`
- **Add:** `removeAppliance(id: string)` — filters appliance out of array
- **Add:** `updateApplianceWatts(id: string, watts: number)` — updates wattsTypical for given appliance
- **Update:** `partialize` — remove `journeyMode`, `cruisingStyle`, add `solarPanelWatts`, `panelType`
- **Update:** `initialState` — remove `journeyMode`, `cruisingStyle`, add `solarPanelWatts: 0`, `panelType: 'rigid'`

### Step 5: Run tests to verify they pass

```bash
pnpm --filter @above-deck/web test -- --run stores/__tests__/solar.test.ts
```

Expected: All tests PASS. Remove any tests for `journeyMode` or `cruisingStyle`.

### Step 6: Commit

```bash
git add packages/web/src/lib/solar/types.ts packages/web/src/stores/solar.ts packages/web/src/stores/__tests__/solar.test.ts
git commit -m "feat: update store and types for energy planner redesign

Remove cruisingStyle and journeyMode. Add solarPanelWatts, panelType,
origin field on appliances, removeAppliance and updateApplianceWatts actions."
```

---

## Task 2: Update Seed Data — Default Appliance IDs

**Files:**
- Modify: `supabase/seed.sql`

### Step 1: Update boat_model_templates INSERT to include default_appliance_ids

The `default_appliance_ids` column exists in the schema but seed data doesn't populate it. We need to reference UUIDs from the `power_consumers` INSERT. Since power_consumers uses `gen_random_uuid()`, we need to use named UUIDs or subqueries.

**Approach:** Use a separate UPDATE statement after both INSERTs, using subqueries to look up appliance IDs by name. Define a "standard sailboat" set and a "catamaran" set.

Add after existing INSERT statements in `supabase/seed.sql`:

```sql
-- Standard monohull default appliances
UPDATE boat_model_templates SET default_appliance_ids = ARRAY(
  SELECT id FROM power_consumers WHERE name IN (
    'Chartplotter 7"', 'VHF Radio', 'AIS Transponder',
    'Autopilot', 'Masthead Tricolour', 'Cabin LED Lights',
    'Cockpit LED Lights', 'Anchor Light', 'Navigation Instruments',
    'Fridge (Top-Loading)', 'Manual Bilge Pump',
    'USB Charging (Phones/Tablets)', 'Cabin Fan'
  )
) WHERE boat_type = 'monohull';

-- Catamaran default appliances (larger, more equipment)
UPDATE boat_model_templates SET default_appliance_ids = ARRAY(
  SELECT id FROM power_consumers WHERE name IN (
    'Chartplotter 10"', 'VHF Radio', 'AIS Transponder',
    'Autopilot', 'Masthead Tricolour', 'Cabin LED Lights',
    'Cockpit LED Lights', 'Anchor Light', 'Navigation Instruments',
    'Fridge (Top-Loading)', 'Freezer', 'Manual Bilge Pump',
    'USB Charging (Phones/Tablets)', 'Cabin Fan',
    'Radar', 'Windlass'
  )
) WHERE boat_type = 'catamaran';
```

### Step 2: Reset and re-seed local Supabase

```bash
supabase db reset
```

Expected: Clean reset with seed data applied, boats now have default_appliance_ids populated.

### Step 3: Verify in Supabase Studio or psql

```bash
supabase db query "SELECT make, model, array_length(default_appliance_ids, 1) as appliance_count FROM boat_model_templates LIMIT 5;"
```

Expected: Lagoon models show ~16 appliances, Beneteau/Jeanneau show ~13.

### Step 4: Commit

```bash
git add supabase/seed.sql
git commit -m "feat: seed default appliance IDs for boat templates

Monohulls get 13 standard appliances, catamarans get 16 including
radar, freezer, and windlass."
```

---

## Task 3: New Hook — useBoatAppliances

**Files:**
- Create: `packages/web/src/hooks/use-boat-appliances.ts`
- Create: `packages/web/src/hooks/__tests__/use-boat-appliances.test.ts`

### Step 1: Write failing test

Create `packages/web/src/hooks/__tests__/use-boat-appliances.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// We test the pure transform function, not the React hook
import { transformToStockAppliances } from '../use-boat-appliances';

describe('transformToStockAppliances', () => {
  it('should mark all appliances with origin stock', () => {
    const raw = [
      { id: '1', name: 'Fridge', category: 'refrigeration', watts_typical: 60,
        watts_min: 40, watts_max: 80, hours_per_day_anchor: 24,
        hours_per_day_passage: 24, duty_cycle: 0.4, usage_type: 'always-on',
        crew_scaling: false, sort_order: 1 },
    ];
    const result = transformToStockAppliances(raw);
    expect(result[0].origin).toBe('stock');
    expect(result[0].enabled).toBe(true);
  });

  it('should map snake_case DB fields to camelCase', () => {
    const raw = [
      { id: '1', name: 'VHF', category: 'communication', watts_typical: 25,
        watts_min: 5, watts_max: 25, hours_per_day_anchor: 1,
        hours_per_day_passage: 8, duty_cycle: 1, usage_type: 'scheduled',
        crew_scaling: false, sort_order: 2 },
    ];
    const result = transformToStockAppliances(raw);
    expect(result[0].wattsTypical).toBe(25);
    expect(result[0].hoursPerDayAnchor).toBe(1);
    expect(result[0].hoursPerDayPassage).toBe(8);
  });

  it('should return empty array for null input', () => {
    expect(transformToStockAppliances(null)).toEqual([]);
  });
});
```

### Step 2: Run test to verify it fails

```bash
pnpm --filter @above-deck/web test -- --run hooks/__tests__/use-boat-appliances.test.ts
```

Expected: FAIL — module not found.

### Step 3: Implement hook

Create `packages/web/src/hooks/use-boat-appliances.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { createSupabaseClient } from '@/lib/supabase';
import type { Appliance } from '@/lib/solar/types';

// Pure transform — exported for testing
export function transformToStockAppliances(rows: any[] | null): Appliance[] {
  if (!rows) return [];
  return rows.map((row): Appliance => ({
    id: row.id,
    name: row.name,
    category: row.category,
    wattsTypical: Number(row.watts_typical),
    wattsMin: Number(row.watts_min ?? row.watts_typical * 0.6),
    wattsMax: Number(row.watts_max ?? row.watts_typical * 1.5),
    hoursPerDayAnchor: Number(row.hours_per_day_anchor),
    hoursPerDayPassage: Number(row.hours_per_day_passage),
    dutyCycle: Number(row.duty_cycle ?? 1.0),
    usageType: row.usage_type,
    crewScaling: row.crew_scaling ?? false,
    enabled: true,
    origin: 'stock',
  }));
}

export function useBoatAppliances(boatModelId: string | null) {
  const supabase = createSupabaseClient();

  return useQuery({
    queryKey: ['boat-appliances', boatModelId],
    queryFn: async () => {
      // First get the boat template to find default_appliance_ids
      const { data: boat, error: boatError } = await supabase
        .from('boat_model_templates')
        .select('default_appliance_ids')
        .eq('id', boatModelId!)
        .single();
      if (boatError) throw boatError;

      const ids = boat.default_appliance_ids;
      if (!ids || ids.length === 0) return [];

      // Fetch matching appliances
      const { data, error } = await supabase
        .from('power_consumers')
        .select('*')
        .in('id', ids)
        .order('sort_order');
      if (error) throw error;

      return transformToStockAppliances(data);
    },
    enabled: !!boatModelId,
    staleTime: 1000 * 60 * 60,
  });
}
```

### Step 4: Run test to verify it passes

```bash
pnpm --filter @above-deck/web test -- --run hooks/__tests__/use-boat-appliances.test.ts
```

Expected: PASS

### Step 5: Commit

```bash
git add packages/web/src/hooks/use-boat-appliances.ts packages/web/src/hooks/__tests__/use-boat-appliances.test.ts
git commit -m "feat: add useBoatAppliances hook

Fetches default appliances for a boat template, marks them as stock origin."
```

---

## Task 4: Update Calculation Engine — Daily Charging

**Files:**
- Create: `packages/web/src/lib/solar/charging.ts`
- Create: `packages/web/src/lib/solar/__tests__/charging.test.ts`
- Modify: `packages/web/src/hooks/use-solar-calculation.ts`

### Step 1: Write failing tests for charging calculation

Create `packages/web/src/lib/solar/__tests__/charging.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { calculateDailyCharging } from '../charging';

describe('calculateDailyCharging', () => {
  it('should calculate solar input from panels + region + derating', () => {
    const result = calculateDailyCharging({
      solarPanelWatts: 400,
      panelType: 'rigid',
      peakSunHours: 5,
      deratingFactor: 0.75,
      alternatorAmps: 80,
      motoringHoursPerDay: 1.5,
      systemVoltage: 12,
      shorepower: 'no',
    });
    // 400 * 5 * 0.75 = 1500 Wh solar
    expect(result.solarWhPerDay).toBe(1500);
  });

  it('should apply panel type derating', () => {
    const rigid = calculateDailyCharging({
      solarPanelWatts: 400, panelType: 'rigid', peakSunHours: 5,
      deratingFactor: 0.75, alternatorAmps: 0, motoringHoursPerDay: 0,
      systemVoltage: 12, shorepower: 'no',
    });
    const flexible = calculateDailyCharging({
      solarPanelWatts: 400, panelType: 'flexible', peakSunHours: 5,
      deratingFactor: 0.75, alternatorAmps: 0, motoringHoursPerDay: 0,
      systemVoltage: 12, shorepower: 'no',
    });
    // Flexible panels have additional ~15% loss
    expect(flexible.solarWhPerDay).toBeLessThan(rigid.solarWhPerDay);
  });

  it('should calculate alternator input', () => {
    const result = calculateDailyCharging({
      solarPanelWatts: 0, panelType: 'rigid', peakSunHours: 5,
      deratingFactor: 0.75, alternatorAmps: 80, motoringHoursPerDay: 2,
      systemVoltage: 12, shorepower: 'no',
    });
    // 80A * 2h * 0.7 efficiency * 12V = 1344 Wh
    expect(result.alternatorWhPerDay).toBe(1344);
  });

  it('should sum total daily charging', () => {
    const result = calculateDailyCharging({
      solarPanelWatts: 400, panelType: 'rigid', peakSunHours: 5,
      deratingFactor: 0.75, alternatorAmps: 80, motoringHoursPerDay: 1.5,
      systemVoltage: 12, shorepower: 'no',
    });
    expect(result.totalWhPerDay).toBe(result.solarWhPerDay + result.alternatorWhPerDay);
  });

  it('should return zero solar when no panels', () => {
    const result = calculateDailyCharging({
      solarPanelWatts: 0, panelType: 'rigid', peakSunHours: 5,
      deratingFactor: 0.75, alternatorAmps: 0, motoringHoursPerDay: 0,
      systemVoltage: 12, shorepower: 'no',
    });
    expect(result.totalWhPerDay).toBe(0);
  });
});
```

### Step 2: Run test to verify it fails

```bash
pnpm --filter @above-deck/web test -- --run lib/solar/__tests__/charging.test.ts
```

Expected: FAIL — module not found.

### Step 3: Implement charging calculation

Create `packages/web/src/lib/solar/charging.ts`:

```typescript
import type { PanelType } from './types';

const ALTERNATOR_EFFICIENCY = 0.7;

// Additional derating for panel mounting type
const PANEL_TYPE_FACTOR: Record<PanelType, number> = {
  rigid: 1.0,        // Optimal: tilted, ventilated
  'semi-flexible': 0.9, // Slight loss: flush-mounted, less ventilation
  flexible: 0.85,     // More loss: no air gap, heat buildup
};

export interface ChargingInput {
  solarPanelWatts: number;
  panelType: PanelType;
  peakSunHours: number;
  deratingFactor: number;
  alternatorAmps: number;
  motoringHoursPerDay: number;
  systemVoltage: number;
  shorepower: 'no' | 'sometimes' | 'often';
}

export interface ChargingResult {
  solarWhPerDay: number;
  alternatorWhPerDay: number;
  totalWhPerDay: number;
}

export function calculateDailyCharging(input: ChargingInput): ChargingResult {
  const panelFactor = PANEL_TYPE_FACTOR[input.panelType];
  const solarWhPerDay = Math.round(
    input.solarPanelWatts * input.peakSunHours * input.deratingFactor * panelFactor
  );

  const alternatorWhPerDay = Math.round(
    input.alternatorAmps * input.motoringHoursPerDay * ALTERNATOR_EFFICIENCY * input.systemVoltage
  );

  return {
    solarWhPerDay,
    alternatorWhPerDay,
    totalWhPerDay: solarWhPerDay + alternatorWhPerDay,
  };
}
```

### Step 4: Run test to verify it passes

```bash
pnpm --filter @above-deck/web test -- --run lib/solar/__tests__/charging.test.ts
```

Expected: PASS

### Step 5: Update useSolarCalculation hook

Modify `packages/web/src/hooks/use-solar-calculation.ts` to also import and return charging results:

- Import `calculateDailyCharging` from `@/lib/solar/charging`
- Add `solarPanelWatts` and `panelType` to `ComputeInput`
- Read `solarPanelWatts`, `panelType`, `shorepower` from store
- Add `charging: ChargingResult` to `ComputeResult`
- Call `calculateDailyCharging()` inside `computeResults()`

### Step 6: Update use-solar-calculation test

Modify `packages/web/src/hooks/__tests__/use-solar-calculation.test.ts` to include `solarPanelWatts`, `panelType`, `shorepower` in test inputs and verify `charging` is returned.

### Step 7: Run all tests

```bash
pnpm --filter @above-deck/web test -- --run
```

Expected: All PASS.

### Step 8: Commit

```bash
git add packages/web/src/lib/solar/charging.ts packages/web/src/lib/solar/__tests__/charging.test.ts packages/web/src/hooks/use-solar-calculation.ts packages/web/src/hooks/__tests__/use-solar-calculation.test.ts
git commit -m "feat: add daily charging calculation

New calculateDailyCharging() computes solar + alternator input.
Panel type affects derating (rigid > semi-flexible > flexible).
Integrated into useSolarCalculation hook."
```

---

## Task 5: YourBoat Section Component

**Files:**
- Create: `packages/web/src/components/solar/YourBoatSection.tsx`
- Modify: `packages/web/src/components/solar/BoatSelector.tsx` (minor — add onBoatSelect callback)

### Step 1: Create YourBoatSection

This replaces QuickStart. Three-column layout: Boat model, Crew size, Days self-sufficient.

```typescript
import { Grid, NumberInput, Text } from '@mantine/core';
import { useSolarStore } from '@/stores/solar';
import { useBoatAppliances } from '@/hooks/use-boat-appliances';
import { BoatSelector } from './BoatSelector';
import { useEffect } from 'react';

const HEADING_FONT = "'Space Mono', monospace";

export function YourBoatSection() {
  const crewSize = useSolarStore((s) => s.crewSize);
  const setCrewSize = useSolarStore((s) => s.setCrewSize);
  const daysAutonomy = useSolarStore((s) => s.daysAutonomy);
  const setDaysAutonomy = useSolarStore((s) => s.setDaysAutonomy);
  const boatModelId = useSolarStore((s) => s.boatModelId);
  const setAppliances = useSolarStore((s) => s.setAppliances);

  const { data: boatAppliances } = useBoatAppliances(boatModelId);

  // When boat is selected and appliances load, seed the store
  useEffect(() => {
    if (boatAppliances && boatAppliances.length > 0) {
      setAppliances(boatAppliances);
    }
  }, [boatAppliances, setAppliances]);

  return (
    <Grid>
      <Grid.Col span={{ base: 12, sm: 5 }}>
        <BoatSelector />
      </Grid.Col>
      <Grid.Col span={{ base: 6, sm: 3 }}>
        <NumberInput
          label="Crew size"
          value={crewSize}
          onChange={(val) => setCrewSize(Number(val) || 2)}
          min={1} max={12}
          styles={{ label: { fontFamily: HEADING_FONT } }}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 6, sm: 4 }}>
        <NumberInput
          label="Days self-sufficient"
          value={daysAutonomy}
          onChange={(val) => setDaysAutonomy(Number(val) || 3)}
          min={1} max={14}
          styles={{ label: { fontFamily: HEADING_FONT } }}
        />
        <Text size="xs" c="dimmed" mt={4}>
          Weekend: 2–3 · Coastal: 5–7 · Offshore: 10+
        </Text>
      </Grid.Col>
    </Grid>
  );
}
```

### Step 2: Verify it renders

This is a UI component — verify visually after wiring into EnergyPlanner (Task 9). No unit test needed for layout.

### Step 3: Commit

```bash
git add packages/web/src/components/solar/YourBoatSection.tsx
git commit -m "feat: add YourBoatSection component

Replaces QuickStart with boat model, crew size, and days self-sufficient inputs."
```

---

## Task 6: EquipmentSection Component

**Files:**
- Create: `packages/web/src/components/solar/EquipmentSection.tsx`
- Create: `packages/web/src/components/solar/EquipmentRow.tsx`
- Create: `packages/web/src/components/solar/AddEquipmentModal.tsx`

### Step 1: Create EquipmentRow

Individual row in the equipment table. Shows name, origin badge, watts (editable), hours/day (editable), duty cycle, daily Wh (calculated), enable/disable, remove.

```typescript
import { ActionIcon, Badge, Group, NumberInput, Switch, Table, Text } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import type { Appliance } from '@/lib/solar/types';
import type { ViewMode } from '@/stores/solar';

interface EquipmentRowProps {
  appliance: Appliance;
  viewMode: ViewMode;
  crewSize: number;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdateWatts: (id: string, watts: number) => void;
  onUpdateHours: (id: string, mode: 'anchor' | 'passage', hours: number) => void;
}

export function EquipmentRow({
  appliance, viewMode, crewSize, onToggle, onRemove, onUpdateWatts, onUpdateHours,
}: EquipmentRowProps) {
  const hours = viewMode === 'anchor' ? appliance.hoursPerDayAnchor : appliance.hoursPerDayPassage;
  const crewMultiplier = appliance.crewScaling ? crewSize / 2 : 1;
  const dailyWh = Math.round(appliance.wattsTypical * hours * appliance.dutyCycle * crewMultiplier);

  return (
    <Table.Tr opacity={appliance.enabled ? 1 : 0.5}>
      <Table.Td>
        <Group gap="xs">
          <Text size="sm">{appliance.name}</Text>
          <Badge size="xs" variant="light"
            color={appliance.origin === 'stock' ? 'ocean' : 'gray'}>
            {appliance.origin === 'stock' ? 'Stock' : 'Added'}
          </Badge>
        </Group>
      </Table.Td>
      <Table.Td>
        <NumberInput size="xs" w={80} value={appliance.wattsTypical}
          onChange={(val) => onUpdateWatts(appliance.id, Number(val) || 0)}
          min={0} max={5000} suffix="W" />
      </Table.Td>
      <Table.Td>
        <NumberInput size="xs" w={80} value={hours}
          onChange={(val) => onUpdateHours(appliance.id, viewMode, Number(val) || 0)}
          min={0} max={24} step={0.5} decimalScale={1} suffix="h" />
      </Table.Td>
      <Table.Td>
        <Text size="sm">{appliance.dutyCycle}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm" fw={600}>{dailyWh} Wh</Text>
      </Table.Td>
      <Table.Td>
        <Switch size="xs" checked={appliance.enabled}
          onChange={() => onToggle(appliance.id)} />
      </Table.Td>
      <Table.Td>
        {appliance.origin !== 'stock' && (
          <ActionIcon size="sm" variant="subtle" color="red"
            onClick={() => onRemove(appliance.id)}>
            <IconTrash size={14} />
          </ActionIcon>
        )}
      </Table.Td>
    </Table.Tr>
  );
}
```

### Step 2: Create AddEquipmentModal

Modal with searchable list of all appliances from the catalog. User picks items to add.

```typescript
import { useState } from 'react';
import { Button, Checkbox, Group, Modal, Stack, Text, TextInput } from '@mantine/core';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useApplianceCatalog } from '@/hooks/use-appliance-catalog';
import type { Appliance } from '@/lib/solar/types';

interface AddEquipmentModalProps {
  existingIds: string[];
  onAdd: (appliances: Appliance[]) => void;
}

export function AddEquipmentModal({ existingIds, onAdd }: AddEquipmentModalProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const { data: catalog } = useApplianceCatalog();

  const filtered = (catalog ?? []).filter(
    (a) =>
      !existingIds.includes(a.id) &&
      a.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    const toAdd = filtered
      .filter((a) => selected.includes(a.id))
      .map((a) => ({ ...a, origin: 'catalog' as const }));
    onAdd(toAdd);
    setSelected([]);
    setSearch('');
    close();
  };

  return (
    <>
      <Button variant="light" leftSection={<IconPlus size={16} />} onClick={open}>
        Add equipment
      </Button>
      <Modal opened={opened} onClose={close} title="Add equipment" size="lg">
        <Stack>
          <TextInput placeholder="Search appliances..."
            leftSection={<IconSearch size={16} />}
            value={search} onChange={(e) => setSearch(e.currentTarget.value)} />
          <Stack gap="xs" mah={400} style={{ overflowY: 'auto' }}>
            {filtered.map((a) => (
              <Checkbox key={a.id} label={`${a.name} (${a.wattsTypical}W — ${a.category})`}
                checked={selected.includes(a.id)}
                onChange={(e) => {
                  setSelected(e.currentTarget.checked
                    ? [...selected, a.id]
                    : selected.filter((id) => id !== a.id));
                }} />
            ))}
          </Stack>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={close}>Cancel</Button>
            <Button onClick={handleAdd} disabled={selected.length === 0}>
              Add {selected.length} item{selected.length !== 1 ? 's' : ''}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
```

### Step 3: Create EquipmentSection

Wraps the table with category filters, anchor/passage toggle, section header with total Wh.

```typescript
import { useMemo, useState } from 'react';
import { Group, SegmentedControl, Stack, Table, Text, Title, Chip } from '@mantine/core';
import { useSolarStore, type ViewMode } from '@/stores/solar';
import { EquipmentRow } from './EquipmentRow';
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
  const toggleAppliance = useSolarStore((s) => s.toggleAppliance);
  const removeAppliance = useSolarStore((s) => s.removeAppliance);
  const updateApplianceWatts = useSolarStore((s) => s.updateApplianceWatts);
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
      <Group justify="space-between">
        <Title order={3} ff={HEADING_FONT}>
          Equipment — {Math.round(totalWh)} Wh/day
        </Title>
        <SegmentedControl size="xs" value={viewMode}
          onChange={(val) => setViewMode(val as ViewMode)}
          data={[
            { label: 'At anchor', value: 'anchor' },
            { label: 'On passage', value: 'passage' },
          ]} />
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
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Appliance</Table.Th>
              <Table.Th>Watts</Table.Th>
              <Table.Th>Hours/day</Table.Th>
              <Table.Th>Duty</Table.Th>
              <Table.Th>Daily</Table.Th>
              <Table.Th>On</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filtered.map((a) => (
              <EquipmentRow key={a.id} appliance={a} viewMode={viewMode}
                crewSize={crewSize} onToggle={toggleAppliance}
                onRemove={removeAppliance} onUpdateWatts={updateApplianceWatts}
                onUpdateHours={updateApplianceHours} />
            ))}
          </Table.Tbody>
        </Table>
      )}

      <AddEquipmentModal
        existingIds={appliances.map((a) => a.id)}
        onAdd={handleAddEquipment}
      />
    </Stack>
  );
}
```

### Step 4: Commit

```bash
git add packages/web/src/components/solar/EquipmentSection.tsx packages/web/src/components/solar/EquipmentRow.tsx packages/web/src/components/solar/AddEquipmentModal.tsx
git commit -m "feat: add EquipmentSection with editable appliance table

Shows stock/added badges, inline watts/hours editing, category filters,
anchor/passage toggle, and add-equipment modal."
```

---

## Task 7: ChargingSection Component

**Files:**
- Create: `packages/web/src/components/solar/ChargingSection.tsx`

### Step 1: Create ChargingSection

Solar panel config + alternator + shore power. Reuses RegionPicker.

```typescript
import { Grid, NumberInput, SegmentedControl, Stack, Text, Title } from '@mantine/core';
import { useSolarStore } from '@/stores/solar';
import { RegionPicker } from './RegionPicker';
import type { PanelType } from '@/lib/solar/types';
import type { ChargingResult } from '@/lib/solar/charging';

const HEADING_FONT = "'Space Mono', monospace";

interface ChargingSectionProps {
  charging: ChargingResult;
}

export function ChargingSection({ charging }: ChargingSectionProps) {
  const solarPanelWatts = useSolarStore((s) => s.solarPanelWatts);
  const setSolarPanelWatts = useSolarStore((s) => s.setSolarPanelWatts);
  const panelType = useSolarStore((s) => s.panelType);
  const setPanelType = useSolarStore((s) => s.setPanelType);
  const alternatorAmps = useSolarStore((s) => s.alternatorAmps);
  const setAlternatorAmps = useSolarStore((s) => s.setAlternatorAmps);
  const motoringHoursPerDay = useSolarStore((s) => s.motoringHoursPerDay);
  const setMotoringHoursPerDay = useSolarStore((s) => s.setMotoringHoursPerDay);
  const shorepower = useSolarStore((s) => s.shorepower);
  const setShorepower = useSolarStore((s) => s.setShorepower);

  return (
    <Stack gap="md">
      <Title order={3} ff={HEADING_FONT}>
        Charging — {charging.totalWhPerDay} Wh/day
      </Title>

      {/* Solar */}
      <Text fw={600} size="sm">Solar</Text>
      <Grid>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <NumberInput label="Panel wattage (total)" value={solarPanelWatts}
            onChange={(val) => setSolarPanelWatts(Number(val) || 0)}
            min={0} max={3000} step={50} suffix="W" />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Text size="sm" mb={4}>Panel type</Text>
          <SegmentedControl fullWidth value={panelType}
            onChange={(val) => setPanelType(val as PanelType)}
            data={[
              { label: 'Rigid', value: 'rigid' },
              { label: 'Semi-flex', value: 'semi-flexible' },
              { label: 'Flexible', value: 'flexible' },
            ]} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <RegionPicker />
        </Grid.Col>
      </Grid>
      <Text size="xs" c="dimmed">
        Estimated solar: {charging.solarWhPerDay} Wh/day
      </Text>

      {/* Alternator */}
      <Text fw={600} size="sm" mt="md">Alternator</Text>
      <Grid>
        <Grid.Col span={{ base: 6, sm: 4 }}>
          <NumberInput label="Alternator amps" value={alternatorAmps}
            onChange={(val) => setAlternatorAmps(Number(val) || 0)}
            min={0} max={300} />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 4 }}>
          <NumberInput label="Motoring hours/day" value={motoringHoursPerDay}
            onChange={(val) => setMotoringHoursPerDay(Number(val) || 0)}
            min={0} max={24} step={0.5} decimalScale={1} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Text size="sm" mb={4}>Shore power</Text>
          <SegmentedControl fullWidth value={shorepower}
            onChange={(val) => setShorepower(val as 'no' | 'sometimes' | 'often')}
            data={[
              { label: 'No', value: 'no' },
              { label: 'Sometimes', value: 'sometimes' },
              { label: 'Often', value: 'often' },
            ]} />
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
```

### Step 2: Commit

```bash
git add packages/web/src/components/solar/ChargingSection.tsx
git commit -m "feat: add ChargingSection component

Solar panel config (wattage, type, region), alternator, and shore power.
Shows calculated daily charging total in section header."
```

---

## Task 8: StorageSection and BalanceSection Components

**Files:**
- Create: `packages/web/src/components/solar/StorageSection.tsx`
- Create: `packages/web/src/components/solar/BalanceSection.tsx`

### Step 1: Create StorageSection

Battery chemistry, voltage, recommended bank size (calculated).

```typescript
import { Grid, NumberInput, SegmentedControl, Stack, Text, Title } from '@mantine/core';
import { useSolarStore } from '@/stores/solar';
import type { SolarRecommendation } from '@/lib/solar/types';

const HEADING_FONT = "'Space Mono', monospace";

interface StorageSectionProps {
  recommendation: SolarRecommendation;
}

export function StorageSection({ recommendation }: StorageSectionProps) {
  const batteryChemistry = useSolarStore((s) => s.batteryChemistry);
  const setBatteryChemistry = useSolarStore((s) => s.setBatteryChemistry);
  const systemVoltage = useSolarStore((s) => s.systemVoltage);
  const setSystemVoltage = useSolarStore((s) => s.setSystemVoltage);
  const daysAutonomy = useSolarStore((s) => s.daysAutonomy);

  return (
    <Stack gap="md">
      <Title order={3} ff={HEADING_FONT}>Storage</Title>
      <Grid>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Text size="sm" mb={4}>Battery chemistry</Text>
          <SegmentedControl fullWidth value={batteryChemistry}
            onChange={(val) => setBatteryChemistry(val as 'agm' | 'lifepo4')}
            data={[
              { label: 'AGM', value: 'agm' },
              { label: 'LiFePO4', value: 'lifepo4' },
            ]} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Text size="sm" mb={4}>System voltage</Text>
          <SegmentedControl fullWidth value={String(systemVoltage)}
            onChange={(val) => setSystemVoltage(Number(val) as 12 | 24 | 48)}
            data={[
              { label: '12V', value: '12' },
              { label: '24V', value: '24' },
              { label: '48V', value: '48' },
            ]} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Text size="sm" c="dimmed">Days of autonomy</Text>
          <Text size="lg" fw={700}>{daysAutonomy}</Text>
          <Text size="xs" c="dimmed">Set in "Your boat" above</Text>
        </Grid.Col>
      </Grid>
      <Grid>
        <Grid.Col span={{ base: 6, sm: 4 }}>
          <Text size="sm" c="dimmed">Recommended bank</Text>
          <Text size="lg" fw={700}>{recommendation.batteryAh.recommended} Ah</Text>
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 4 }}>
          <Text size="sm" c="dimmed">Minimum bank</Text>
          <Text size="lg">{recommendation.batteryAh.minimum} Ah</Text>
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 4 }}>
          <Text size="sm" c="dimmed">Comfortable bank</Text>
          <Text size="lg">{recommendation.batteryAh.comfortable} Ah</Text>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
```

### Step 2: Create BalanceSection

Summary cards + donut + recommendation tiers.

```typescript
import { Card, Grid, Group, Stack, Text, Title } from '@mantine/core';
import type { ConsumptionResult, SolarRecommendation } from '@/lib/solar/types';
import type { ChargingResult } from '@/lib/solar/charging';
import type { ViewMode } from '@/stores/solar';
import { ConsumptionDonut } from './ConsumptionDonut';
import { RecommendationTiers } from './RecommendationTiers';
import { useSolarStore } from '@/stores/solar';

const HEADING_FONT = "'Space Mono', monospace";

interface BalanceSectionProps {
  consumption: ConsumptionResult;
  charging: ChargingResult;
  recommendation: SolarRecommendation;
}

export function BalanceSection({ consumption, charging, recommendation }: BalanceSectionProps) {
  const viewMode = useSolarStore((s) => s.viewMode);
  const batteryChemistry = useSolarStore((s) => s.batteryChemistry);

  const dailyDraw = viewMode === 'anchor'
    ? consumption.totalWhPerDayAnchor
    : consumption.totalWhPerDayPassage;
  const dailyIn = charging.totalWhPerDay;
  const netBalance = dailyIn - dailyDraw;
  const balanceColor = netBalance >= 0 ? 'green' : 'red';

  return (
    <Stack gap="md">
      <Title order={3} ff={HEADING_FONT}>Balance</Title>

      {/* Summary cards */}
      <Grid>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <Card padding="md" withBorder>
            <Text size="xs" c="dimmed" tt="uppercase">Daily charging</Text>
            <Text size="xl" fw={700}>{dailyIn} Wh</Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <Card padding="md" withBorder>
            <Text size="xs" c="dimmed" tt="uppercase">Daily draw</Text>
            <Text size="xl" fw={700}>{Math.round(dailyDraw)} Wh</Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <Card padding="md" withBorder>
            <Text size="xs" c="dimmed" tt="uppercase">Net balance</Text>
            <Text size="xl" fw={700} c={balanceColor}>
              {netBalance >= 0 ? '+' : ''}{netBalance} Wh
            </Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <Card padding="md" withBorder>
            <Text size="xs" c="dimmed" tt="uppercase">Status</Text>
            <Text size="xl" fw={700} c={balanceColor}>
              {dailyDraw === 0 ? 'No loads' : netBalance >= 0 ? 'Surplus' : 'Deficit'}
            </Text>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Donut + Tiers */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <ConsumptionDonut
            breakdown={consumption.breakdownByCategory}
            viewMode={viewMode}
            totalWh={dailyDraw}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <RecommendationTiers
            recommendation={recommendation}
            batteryChemistry={batteryChemistry}
          />
        </Grid.Col>
      </Grid>

      {/* Suggestion for users without panels */}
      {charging.solarWhPerDay === 0 && dailyDraw > 0 && (
        <Card padding="md" withBorder bg="ocean.9">
          <Text size="sm">
            You need approximately{' '}
            <Text span fw={700}>{recommendation.panelWatts.recommended}W</Text>
            {' '}of solar panels to meet your daily draw with headroom.
          </Text>
        </Card>
      )}
    </Stack>
  );
}
```

### Step 3: Commit

```bash
git add packages/web/src/components/solar/StorageSection.tsx packages/web/src/components/solar/BalanceSection.tsx
git commit -m "feat: add StorageSection and BalanceSection components

StorageSection: battery chemistry, voltage, bank sizing.
BalanceSection: summary cards, consumption donut, recommendation tiers,
and solar suggestion for users without panels configured."
```

---

## Task 9: Rewire EnergyPlanner

**Files:**
- Modify: `packages/web/src/components/solar/EnergyPlanner.tsx`

### Step 1: Replace EnergyPlannerInner with new section layout

Replace the contents of `EnergyPlannerInner` to use the five new sections:

```typescript
import { useMemo, useState } from 'react';
import { Container, Divider, Stack, Title } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '../MantineProvider';

import { useSolarCalculation } from '@/hooks/use-solar-calculation';
import { useSolarStore } from '@/stores/solar';
import { REGIONS } from './RegionPicker';

import { YourBoatSection } from './YourBoatSection';
import { EquipmentSection } from './EquipmentSection';
import { ChargingSection } from './ChargingSection';
import { StorageSection } from './StorageSection';
import { BalanceSection } from './BalanceSection';
import { SaveBar } from './SaveBar';

const HEADING_FONT = "'Space Mono', monospace";

function EnergyPlannerInner() {
  const regionName = useSolarStore((s) => s.regionName);

  const peakSunHours = useMemo(() => {
    const region = REGIONS.find((r) => r.label === regionName);
    return region?.psh ?? 4.5;
  }, [regionName]);

  const { consumption, recommendation, charging } = useSolarCalculation(peakSunHours);

  return (
    <>
      <Container size="lg" py="xl" pb={80}>
        <Stack gap="xl">
          <Title order={2} ff={HEADING_FONT}>Energy Planner</Title>

          {/* 1. Your Boat */}
          <YourBoatSection />

          <Divider />

          {/* 2. Equipment (drains) */}
          <EquipmentSection />

          <Divider />

          {/* 3. Charging (fills) */}
          <ChargingSection charging={charging} />

          <Divider />

          {/* 4. Storage (buffer) */}
          <StorageSection recommendation={recommendation} />

          <Divider />

          {/* 5. Balance */}
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

### Step 2: Run dev server and verify visually

```bash
pnpm --filter @above-deck/web dev
```

Navigate to `http://localhost:4322/tools/solar`. Verify all five sections render.

### Step 3: Run all tests

```bash
pnpm --filter @above-deck/web test -- --run
```

Expected: All PASS.

### Step 4: Commit

```bash
git add packages/web/src/components/solar/EnergyPlanner.tsx
git commit -m "feat: rewire EnergyPlanner with storage/drainage layout

Five sections: Your Boat, Equipment, Charging, Storage, Balance.
Removes JourneySelector, QuickStart, ResultsBanner from main flow."
```

---

## Task 10: Cleanup — Remove Unused Components

**Files:**
- Delete: `packages/web/src/components/solar/JourneySelector.tsx`
- Delete: `packages/web/src/components/solar/QuickStart.tsx`
- Delete: `packages/web/src/components/solar/ResultsBanner.tsx`
- Delete: `packages/web/src/components/solar/ApplianceGrid.tsx`
- Delete: `packages/web/src/components/solar/ApplianceCard.tsx`
- Delete: `packages/web/src/components/solar/SystemPreferences.tsx`
- Delete: `packages/web/src/components/solar/MonthlyChart.tsx`

### Step 1: Verify no imports reference these files

```bash
grep -r "JourneySelector\|QuickStart\|ResultsBanner\|ApplianceGrid\|ApplianceCard\|SystemPreferences\|MonthlyChart" packages/web/src/ --include="*.tsx" --include="*.ts" -l
```

Expected: Only the files themselves and possibly old test files. If EnergyPlanner.tsx still imports them, that's a bug from Task 9.

### Step 2: Delete the files

```bash
rm packages/web/src/components/solar/JourneySelector.tsx
rm packages/web/src/components/solar/QuickStart.tsx
rm packages/web/src/components/solar/ResultsBanner.tsx
rm packages/web/src/components/solar/ApplianceGrid.tsx
rm packages/web/src/components/solar/ApplianceCard.tsx
rm packages/web/src/components/solar/SystemPreferences.tsx
rm packages/web/src/components/solar/MonthlyChart.tsx
```

### Step 3: Run all tests to ensure nothing breaks

```bash
pnpm --filter @above-deck/web test -- --run
```

Expected: All PASS.

### Step 4: Commit

```bash
git add -u packages/web/src/components/solar/
git commit -m "chore: remove replaced components

JourneySelector, QuickStart, ResultsBanner, ApplianceGrid,
ApplianceCard, SystemPreferences, MonthlyChart replaced by
new section-based layout."
```

---

## Task 11: Update useApplianceCatalog Origin Field

**Files:**
- Modify: `packages/web/src/hooks/use-appliance-catalog.ts`

### Step 1: Update the transform to include origin

The existing hook maps DB rows to `Appliance` objects but doesn't set `origin`. Add `origin: 'catalog'` to the mapping.

In `use-appliance-catalog.ts`, line 27 (after `enabled: true`), add:
```typescript
origin: 'catalog',
```

### Step 2: Run tests

```bash
pnpm --filter @above-deck/web test -- --run
```

### Step 3: Commit

```bash
git add packages/web/src/hooks/use-appliance-catalog.ts
git commit -m "fix: set origin field on catalog appliances"
```

---

## Task 12: Visual Verification and Polish

### Step 1: Start dev server and Supabase

```bash
supabase start
pnpm --filter @above-deck/web dev
```

### Step 2: Walk through the full flow

1. Navigate to `/tools/solar`
2. Search for "Lagoon 42" in boat selector
3. Verify: equipment table populates with stock items, section header shows total Wh
4. Toggle anchor/passage — hours/day values should switch
5. Click "Add equipment" — modal shows catalog items not already in list
6. Add an item — verify it appears with "Added" badge
7. Disable a stock item — verify it goes translucent, total updates
8. Set solar panel wattage to 400W, select region
9. Verify Charging section header updates
10. Check Balance section: summary cards, donut, tiers

### Step 3: Fix any visual issues found during walkthrough

### Step 4: Run full test suite

```bash
pnpm --filter @above-deck/web test -- --run
```

### Step 5: Final commit if any polish needed

```bash
git add -A
git commit -m "fix: visual polish for energy planner redesign"
```

---

## Dependency Order

```
Task 1 (types + store) ─┬─> Task 3 (useBoatAppliances hook)
                         ├─> Task 4 (charging calculation)
                         ├─> Task 11 (catalog origin field)
                         │
Task 2 (seed data) ──────┘
                         │
Task 3 ──────────────────┼─> Task 5 (YourBoatSection)
Task 4 ──────────────────┼─> Task 7 (ChargingSection)
                         ├─> Task 6 (EquipmentSection)
                         ├─> Task 8 (StorageSection + BalanceSection)
                         │
Tasks 5-8 ───────────────┼─> Task 9 (rewire EnergyPlanner)
                         │
Task 9 ──────────────────┼─> Task 10 (cleanup)
                         └─> Task 12 (visual verification)
```

Tasks 2, 3, 4, 11 can run in parallel after Task 1.
Tasks 5, 6, 7, 8 can run in parallel after their dependencies.
