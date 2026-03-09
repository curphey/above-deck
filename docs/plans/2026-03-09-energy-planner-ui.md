# Energy Planner UI — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Energy Planner React UI at `/tools/solar` — the full interactive calculator from the approved wireframe, wired to the existing solar calculation engine.

**Architecture:** React island in Astro page. Zustand store manages all calculator state with `persist` middleware (localStorage). React Query fetches boat templates, appliance catalog, and product specs from Supabase. Calculation engine runs client-side on every state change (debounced). Charts via Recharts. Mapbox for location picker (later — placeholder for now). All inside existing MantineProvider + Shell.

**Tech Stack:** React 19, Mantine v7, Zustand 5, TanStack React Query 5, Recharts 2, Sustand `persist`, Vitest + Testing Library, existing `@/lib/solar/*` engine

**Wireframe reference:** `wireframes/html/energy-planner-lofi.html`

**Existing code to build on:**
- `packages/web/src/lib/solar/types.ts` — `Appliance`, `SystemConfig`, `ConsumptionResult`, `SolarRecommendation`, `JourneyMode`
- `packages/web/src/lib/solar/engine.ts` — `calculateConsumption(appliances, crewSize, systemVoltage)`
- `packages/web/src/lib/solar/sizing.ts` — `calculateRecommendation(SizingInput)`
- `packages/web/src/lib/solar/pvgis.ts` — `fetchMonthlyIrradiance`, `peakSunHours`, `annualAveragePeakSunHours`
- `packages/web/src/components/AppShellWrapper.tsx` — wraps MantineProvider + Shell
- `packages/web/src/theme/theme.ts` — Mantine theme (ocean primary, Space Mono headings, Inter body)
- `packages/web/src/theme/colors.ts` — `COLORS` constant (brand palette)
- `packages/web/src/lib/supabase.ts` — `createSupabaseClient()` for browser-side queries

**Test command:** `cd packages/web && npx vitest run`

**Path alias:** `@/` resolves to `packages/web/src/`

---

## Task 1: Zustand Store — Calculator State

The store is the foundation. Every UI component reads from and writes to it. Build and test this first before any components.

**Files:**
- Create: `packages/web/src/stores/solar.ts`
- Create: `packages/web/src/stores/__tests__/solar.test.ts`

**Step 1: Write the failing tests**

```typescript
// packages/web/src/stores/__tests__/solar.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useSolarStore } from '../solar';

// Zustand stores can be tested by calling getState() / setState() directly
// No React rendering needed for store logic tests.

describe('useSolarStore', () => {
  beforeEach(() => {
    // Reset store to initial state between tests
    useSolarStore.setState(useSolarStore.getInitialState());
  });

  it('has default journey mode of new-system', () => {
    expect(useSolarStore.getState().journeyMode).toBe('new-system');
  });

  it('has default crew size of 2', () => {
    expect(useSolarStore.getState().crewSize).toBe(2);
  });

  it('has default system voltage of 12', () => {
    expect(useSolarStore.getState().systemVoltage).toBe(12);
  });

  it('has default battery chemistry of lifepo4', () => {
    expect(useSolarStore.getState().batteryChemistry).toBe('lifepo4');
  });

  it('sets journey mode', () => {
    useSolarStore.getState().setJourneyMode('check-existing');
    expect(useSolarStore.getState().journeyMode).toBe('check-existing');
  });

  it('sets crew size', () => {
    useSolarStore.getState().setCrewSize(4);
    expect(useSolarStore.getState().crewSize).toBe(4);
  });

  it('sets cruising style', () => {
    useSolarStore.getState().setCruisingStyle('offshore');
    expect(useSolarStore.getState().cruisingStyle).toBe('offshore');
  });

  it('toggles an appliance on/off', () => {
    const appliance = {
      id: 'test-1',
      name: 'Test',
      category: 'navigation',
      wattsTypical: 25,
      wattsMin: 15,
      wattsMax: 40,
      hoursPerDayAnchor: 4,
      hoursPerDayPassage: 8,
      dutyCycle: 1.0,
      usageType: 'intermittent' as const,
      crewScaling: false,
      enabled: true,
    };
    useSolarStore.getState().setAppliances([appliance]);
    useSolarStore.getState().toggleAppliance('test-1');
    expect(useSolarStore.getState().appliances[0].enabled).toBe(false);
  });

  it('updates appliance hours', () => {
    const appliance = {
      id: 'test-1',
      name: 'Test',
      category: 'navigation',
      wattsTypical: 25,
      wattsMin: 15,
      wattsMax: 40,
      hoursPerDayAnchor: 4,
      hoursPerDayPassage: 8,
      dutyCycle: 1.0,
      usageType: 'intermittent' as const,
      crewScaling: false,
      enabled: true,
    };
    useSolarStore.getState().setAppliances([appliance]);
    useSolarStore.getState().updateApplianceHours('test-1', 'anchor', 10);
    expect(useSolarStore.getState().appliances[0].hoursPerDayAnchor).toBe(10);
  });

  it('sets boat model ID', () => {
    useSolarStore.getState().setBoatModelId('some-uuid');
    expect(useSolarStore.getState().boatModelId).toBe('some-uuid');
  });

  it('sets location', () => {
    useSolarStore.getState().setLocation(36.0, 14.5, 'Mediterranean');
    expect(useSolarStore.getState().latitude).toBe(36.0);
    expect(useSolarStore.getState().longitude).toBe(14.5);
    expect(useSolarStore.getState().regionName).toBe('Mediterranean');
  });

  it('has default Mediterranean location', () => {
    const state = useSolarStore.getState();
    expect(state.latitude).toBe(36.0);
    expect(state.longitude).toBe(14.5);
    expect(state.regionName).toBe('Mediterranean');
  });

  it('tracks view mode (anchor/passage)', () => {
    useSolarStore.getState().setViewMode('passage');
    expect(useSolarStore.getState().viewMode).toBe('passage');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd packages/web && npx vitest run src/stores/__tests__/solar.test.ts`
Expected: FAIL — module `../solar` not found

**Step 3: Implement the store**

```typescript
// packages/web/src/stores/solar.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Appliance, JourneyMode } from '@/lib/solar/types';

export type CruisingStyle = 'weekend' | 'coastal' | 'offshore';
export type ViewMode = 'anchor' | 'passage';

interface SolarState {
  // Journey
  journeyMode: JourneyMode;
  setJourneyMode: (mode: JourneyMode) => void;

  // Quick Start
  boatModelId: string | null;
  setBoatModelId: (id: string | null) => void;
  crewSize: number;
  setCrewSize: (size: number) => void;
  cruisingStyle: CruisingStyle;
  setCruisingStyle: (style: CruisingStyle) => void;

  // Appliances
  appliances: Appliance[];
  setAppliances: (appliances: Appliance[]) => void;
  toggleAppliance: (id: string) => void;
  updateApplianceHours: (id: string, mode: 'anchor' | 'passage', hours: number) => void;

  // View mode
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Location
  latitude: number;
  longitude: number;
  regionName: string;
  setLocation: (lat: number, lon: number, name: string) => void;

  // System preferences
  batteryChemistry: 'agm' | 'lifepo4';
  setBatteryChemistry: (chem: 'agm' | 'lifepo4') => void;
  systemVoltage: 12 | 24 | 48;
  setSystemVoltage: (v: 12 | 24 | 48) => void;
  daysAutonomy: number;
  setDaysAutonomy: (days: number) => void;
  alternatorAmps: number;
  setAlternatorAmps: (amps: number) => void;
  motoringHoursPerDay: number;
  setMotoringHoursPerDay: (hours: number) => void;
  shorepower: 'no' | 'sometimes' | 'often';
  setShorepower: (val: 'no' | 'sometimes' | 'often') => void;
  deratingFactor: number;
  setDeratingFactor: (factor: number) => void;
}

const initialState = {
  journeyMode: 'new-system' as JourneyMode,
  boatModelId: null as string | null,
  crewSize: 2,
  cruisingStyle: 'coastal' as CruisingStyle,
  appliances: [] as Appliance[],
  viewMode: 'anchor' as ViewMode,
  latitude: 36.0,
  longitude: 14.5,
  regionName: 'Mediterranean',
  batteryChemistry: 'lifepo4' as const,
  systemVoltage: 12 as const,
  daysAutonomy: 3,
  alternatorAmps: 75,
  motoringHoursPerDay: 1.5,
  shorepower: 'no' as const,
  deratingFactor: 0.75,
};

export const useSolarStore = create<SolarState>()(
  persist(
    (set) => ({
      ...initialState,

      setJourneyMode: (mode) => set({ journeyMode: mode }),
      setBoatModelId: (id) => set({ boatModelId: id }),
      setCrewSize: (size) => set({ crewSize: size }),
      setCruisingStyle: (style) => set({ cruisingStyle: style }),

      setAppliances: (appliances) => set({ appliances }),
      toggleAppliance: (id) =>
        set((state) => ({
          appliances: state.appliances.map((a) =>
            a.id === id ? { ...a, enabled: !a.enabled } : a
          ),
        })),
      updateApplianceHours: (id, mode, hours) =>
        set((state) => ({
          appliances: state.appliances.map((a) =>
            a.id === id
              ? mode === 'anchor'
                ? { ...a, hoursPerDayAnchor: hours }
                : { ...a, hoursPerDayPassage: hours }
              : a
          ),
        })),

      setViewMode: (mode) => set({ viewMode: mode }),

      setLocation: (lat, lon, name) =>
        set({ latitude: lat, longitude: lon, regionName: name }),

      setBatteryChemistry: (chem) => set({ batteryChemistry: chem }),
      setSystemVoltage: (v) => set({ systemVoltage: v }),
      setDaysAutonomy: (days) => set({ daysAutonomy: days }),
      setAlternatorAmps: (amps) => set({ alternatorAmps: amps }),
      setMotoringHoursPerDay: (hours) => set({ motoringHoursPerDay: hours }),
      setShorepower: (val) => set({ shorepower: val }),
      setDeratingFactor: (factor) => set({ deratingFactor: factor }),
    }),
    {
      name: 'above-deck-solar',
      // Only persist data fields, not functions
      partialize: (state) => ({
        journeyMode: state.journeyMode,
        boatModelId: state.boatModelId,
        crewSize: state.crewSize,
        cruisingStyle: state.cruisingStyle,
        appliances: state.appliances,
        viewMode: state.viewMode,
        latitude: state.latitude,
        longitude: state.longitude,
        regionName: state.regionName,
        batteryChemistry: state.batteryChemistry,
        systemVoltage: state.systemVoltage,
        daysAutonomy: state.daysAutonomy,
        alternatorAmps: state.alternatorAmps,
        motoringHoursPerDay: state.motoringHoursPerDay,
        shorepower: state.shorepower,
        deratingFactor: state.deratingFactor,
      }),
    }
  )
);

// Expose getInitialState for test resets
useSolarStore.getInitialState = () => ({
  ...initialState,
  setJourneyMode: useSolarStore.getState().setJourneyMode,
  setBoatModelId: useSolarStore.getState().setBoatModelId,
  setCrewSize: useSolarStore.getState().setCrewSize,
  setCruisingStyle: useSolarStore.getState().setCruisingStyle,
  setAppliances: useSolarStore.getState().setAppliances,
  toggleAppliance: useSolarStore.getState().toggleAppliance,
  updateApplianceHours: useSolarStore.getState().updateApplianceHours,
  setViewMode: useSolarStore.getState().setViewMode,
  setLocation: useSolarStore.getState().setLocation,
  setBatteryChemistry: useSolarStore.getState().setBatteryChemistry,
  setSystemVoltage: useSolarStore.getState().setSystemVoltage,
  setDaysAutonomy: useSolarStore.getState().setDaysAutonomy,
  setAlternatorAmps: useSolarStore.getState().setAlternatorAmps,
  setMotoringHoursPerDay: useSolarStore.getState().setMotoringHoursPerDay,
  setShorepower: useSolarStore.getState().setShorepower,
  setDeratingFactor: useSolarStore.getState().setDeratingFactor,
});
```

**Step 4: Run tests to verify they pass**

Run: `cd packages/web && npx vitest run src/stores/__tests__/solar.test.ts`
Expected: PASS (12 tests)

**Step 5: Commit**

```bash
git add packages/web/src/stores/solar.ts packages/web/src/stores/__tests__/solar.test.ts
git commit -m "feat: add Zustand solar store with persist middleware and full test coverage"
```

---

## Task 2: Supabase Query Hooks

React Query hooks to fetch boat templates, appliance catalog, and product specs from Supabase. These are used by multiple components.

**Files:**
- Create: `packages/web/src/hooks/use-boat-templates.ts`
- Create: `packages/web/src/hooks/use-appliance-catalog.ts`
- Create: `packages/web/src/hooks/use-product-specs.ts`
- Create: `packages/web/src/hooks/use-solar-calculation.ts`
- Create: `packages/web/src/hooks/__tests__/use-solar-calculation.test.ts`

**Step 1: Write the failing test for the calculation hook**

```typescript
// packages/web/src/hooks/__tests__/use-solar-calculation.test.ts
import { describe, it, expect } from 'vitest';
import { computeResults } from '../use-solar-calculation';
import type { Appliance } from '@/lib/solar/types';

// Test the pure computation function, not the hook itself (hooks need React context)

const fridge: Appliance = {
  id: 'fridge',
  name: 'Fridge',
  category: 'refrigeration',
  wattsTypical: 60,
  wattsMin: 40,
  wattsMax: 80,
  hoursPerDayAnchor: 24,
  hoursPerDayPassage: 24,
  dutyCycle: 0.4,
  usageType: 'always-on',
  crewScaling: false,
  enabled: true,
};

describe('computeResults', () => {
  it('returns consumption and recommendation', () => {
    const result = computeResults({
      appliances: [fridge],
      crewSize: 2,
      systemVoltage: 12,
      batteryChemistry: 'lifepo4',
      daysAutonomy: 3,
      deratingFactor: 0.75,
      peakSunHours: 4.5,
      alternatorAmps: 75,
      motoringHoursPerDay: 1.5,
    });

    expect(result.consumption.totalWhPerDayAnchor).toBeCloseTo(576); // 60 * 24 * 0.4
    expect(result.recommendation.panelWatts.recommended).toBeGreaterThan(0);
    expect(result.recommendation.batteryAh.recommended).toBeGreaterThan(0);
  });

  it('returns zero consumption with no enabled appliances', () => {
    const disabled = { ...fridge, enabled: false };
    const result = computeResults({
      appliances: [disabled],
      crewSize: 2,
      systemVoltage: 12,
      batteryChemistry: 'lifepo4',
      daysAutonomy: 3,
      deratingFactor: 0.75,
      peakSunHours: 4.5,
      alternatorAmps: 75,
      motoringHoursPerDay: 1.5,
    });

    expect(result.consumption.totalWhPerDayAnchor).toBe(0);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd packages/web && npx vitest run src/hooks/__tests__/use-solar-calculation.test.ts`
Expected: FAIL — module not found

**Step 3: Implement the hooks**

```typescript
// packages/web/src/hooks/use-boat-templates.ts
import { useQuery } from '@tanstack/react-query';
import { createSupabaseClient } from '@/lib/supabase';

export function useBoatTemplates(search: string) {
  const supabase = createSupabaseClient();
  return useQuery({
    queryKey: ['boat-templates', search],
    queryFn: async () => {
      let query = supabase
        .from('boat_model_templates')
        .select('*')
        .order('make');

      if (search.length >= 2) {
        query = query.or(`make.ilike.%${search}%,model.ilike.%${search}%`);
      }

      const { data, error } = await query.limit(20);
      if (error) throw error;
      return data;
    },
    enabled: search.length >= 2,
  });
}
```

```typescript
// packages/web/src/hooks/use-appliance-catalog.ts
import { useQuery } from '@tanstack/react-query';
import { createSupabaseClient } from '@/lib/supabase';
import type { Appliance } from '@/lib/solar/types';

export function useApplianceCatalog() {
  const supabase = createSupabaseClient();
  return useQuery({
    queryKey: ['appliance-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('power_consumers')
        .select('*')
        .order('sort_order');
      if (error) throw error;

      // Map DB rows to Appliance type
      return data.map((row: any): Appliance => ({
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
      }));
    },
    staleTime: 1000 * 60 * 60, // 1 hour — catalog rarely changes
  });
}
```

```typescript
// packages/web/src/hooks/use-product-specs.ts
import { useQuery } from '@tanstack/react-query';
import { createSupabaseClient } from '@/lib/supabase';

export function useProductSpecs(componentType?: string) {
  const supabase = createSupabaseClient();
  return useQuery({
    queryKey: ['product-specs', componentType],
    queryFn: async () => {
      let query = supabase.from('product_specs').select('*');
      if (componentType) {
        query = query.eq('component_type', componentType);
      }
      const { data, error } = await query.order('make');
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 60,
  });
}
```

```typescript
// packages/web/src/hooks/use-solar-calculation.ts
import { useMemo } from 'react';
import { useSolarStore } from '@/stores/solar';
import { calculateConsumption } from '@/lib/solar/engine';
import { calculateRecommendation } from '@/lib/solar/sizing';
import type { Appliance, ConsumptionResult, SolarRecommendation } from '@/lib/solar/types';

interface ComputeInput {
  appliances: Appliance[];
  crewSize: number;
  systemVoltage: number;
  batteryChemistry: 'agm' | 'lifepo4';
  daysAutonomy: number;
  deratingFactor: number;
  peakSunHours: number;
  alternatorAmps: number;
  motoringHoursPerDay: number;
}

interface ComputeResult {
  consumption: ConsumptionResult;
  recommendation: SolarRecommendation;
}

// Pure function — exported for testing without React context
export function computeResults(input: ComputeInput): ComputeResult {
  const consumption = calculateConsumption(
    input.appliances,
    input.crewSize,
    input.systemVoltage
  );

  const dailyWh = Math.max(consumption.totalWhPerDayAnchor, 1); // avoid division by zero
  const hasAcLoads = input.appliances.some(
    (a) => a.enabled && a.category === 'comfort-galley' && a.wattsTypical > 200
  );
  const maxAcLoadWatts = input.appliances
    .filter((a) => a.enabled && a.category === 'comfort-galley' && a.wattsTypical > 200)
    .reduce((max, a) => Math.max(max, a.wattsTypical), 0);

  const recommendation = calculateRecommendation({
    dailyConsumptionWh: dailyWh,
    peakSunHours: input.peakSunHours,
    deratingFactor: input.deratingFactor,
    batteryChemistry: input.batteryChemistry,
    systemVoltage: input.systemVoltage,
    daysAutonomy: input.daysAutonomy,
    alternatorAmps: input.alternatorAmps,
    motoringHoursPerDay: input.motoringHoursPerDay,
    hasAcLoads,
    maxAcLoadWatts,
  });

  return { consumption, recommendation };
}

// React hook — reads from Zustand store, returns memoized results
export function useSolarCalculation(peakSunHours: number) {
  const {
    appliances, crewSize, systemVoltage, batteryChemistry,
    daysAutonomy, deratingFactor, alternatorAmps, motoringHoursPerDay,
  } = useSolarStore();

  return useMemo(
    () =>
      computeResults({
        appliances, crewSize, systemVoltage, batteryChemistry,
        daysAutonomy, deratingFactor, peakSunHours,
        alternatorAmps, motoringHoursPerDay,
      }),
    [
      appliances, crewSize, systemVoltage, batteryChemistry,
      daysAutonomy, deratingFactor, peakSunHours,
      alternatorAmps, motoringHoursPerDay,
    ]
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `cd packages/web && npx vitest run src/hooks/__tests__/use-solar-calculation.test.ts`
Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add packages/web/src/hooks/
git commit -m "feat: add React Query hooks for Supabase data and solar calculation hook"
```

---

## Task 3: Journey Selector Component

Wireframe section 1. Three cards for entry point selection.

**Files:**
- Create: `packages/web/src/components/solar/JourneySelector.tsx`
- Create: `packages/web/src/components/solar/__tests__/JourneySelector.test.tsx`

**Step 1: Write the failing test**

```tsx
// packages/web/src/components/solar/__tests__/JourneySelector.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { JourneySelector } from '../JourneySelector';
import { useSolarStore } from '@/stores/solar';

function renderWithMantine(ui: React.ReactElement) {
  return render(<MantineProvider>{ui}</MantineProvider>);
}

describe('JourneySelector', () => {
  beforeEach(() => {
    useSolarStore.setState(useSolarStore.getInitialState());
  });

  it('renders three journey cards', () => {
    renderWithMantine(<JourneySelector />);
    expect(screen.getByText('Plan a new system')).toBeDefined();
    expect(screen.getByText('Check my existing setup')).toBeDefined();
    expect(screen.getByText('Add or upgrade')).toBeDefined();
  });

  it('highlights the selected journey', () => {
    renderWithMantine(<JourneySelector />);
    const card = screen.getByText('Check my existing setup').closest('[data-journey]');
    fireEvent.click(card!);
    expect(useSolarStore.getState().journeyMode).toBe('check-existing');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd packages/web && npx vitest run src/components/solar/__tests__/JourneySelector.test.tsx`
Expected: FAIL — module not found

**Step 3: Implement the component**

```tsx
// packages/web/src/components/solar/JourneySelector.tsx
import { SimpleGrid, Card, Text, Stack, ThemeIcon } from '@mantine/core';
import { IconSunElectricity, IconCircleCheck, IconArrowUp } from '@tabler/icons-react';
import { useSolarStore } from '@/stores/solar';
import type { JourneyMode } from '@/lib/solar/types';

const JOURNEYS: { mode: JourneyMode; title: string; description: string; icon: typeof IconSunElectricity }[] = [
  {
    mode: 'new-system',
    title: 'Plan a new system',
    description: 'Full sizing from scratch — boat, loads, location, complete recommendation',
    icon: IconSunElectricity,
  },
  {
    mode: 'check-existing',
    title: 'Check my existing setup',
    description: "Enter what you have — see if your solar and batteries are enough",
    icon: IconCircleCheck,
  },
  {
    mode: 'add-upgrade',
    title: 'Add or upgrade',
    description: 'Adding a watermaker? Switching to lithium? See what changes',
    icon: IconArrowUp,
  },
];

export function JourneySelector() {
  const journeyMode = useSolarStore((s) => s.journeyMode);
  const setJourneyMode = useSolarStore((s) => s.setJourneyMode);

  return (
    <SimpleGrid cols={{ base: 1, sm: 3 }}>
      {JOURNEYS.map(({ mode, title, description, icon: Icon }) => (
        <Card
          key={mode}
          data-journey={mode}
          withBorder
          padding="lg"
          style={{
            cursor: 'pointer',
            borderColor: journeyMode === mode ? 'var(--mantine-color-ocean-6)' : undefined,
            borderWidth: journeyMode === mode ? 2 : 1,
          }}
          onClick={() => setJourneyMode(mode)}
        >
          <Stack align="center" gap="sm">
            <ThemeIcon size="xl" variant="light" radius="xl">
              <Icon size={24} />
            </ThemeIcon>
            <Text fw={600} ta="center">{title}</Text>
            <Text size="sm" c="dimmed" ta="center">{description}</Text>
          </Stack>
        </Card>
      ))}
    </SimpleGrid>
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `cd packages/web && npx vitest run src/components/solar/__tests__/JourneySelector.test.tsx`
Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add packages/web/src/components/solar/JourneySelector.tsx packages/web/src/components/solar/__tests__/JourneySelector.test.tsx
git commit -m "feat: add JourneySelector component with three entry point cards"
```

---

## Task 4: Quick Start — Boat Selector & Crew/Style Inputs

Wireframe section 2. Boat search, crew stepper, cruising style toggle.

**Files:**
- Create: `packages/web/src/components/solar/QuickStart.tsx`
- Create: `packages/web/src/components/solar/BoatSelector.tsx`
- Create: `packages/web/src/components/solar/__tests__/QuickStart.test.tsx`

**Step 1: Write the failing test**

```tsx
// packages/web/src/components/solar/__tests__/QuickStart.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QuickStart } from '../QuickStart';
import { useSolarStore } from '@/stores/solar';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function renderWrapped(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MantineProvider>{ui}</MantineProvider>
    </QueryClientProvider>
  );
}

describe('QuickStart', () => {
  beforeEach(() => {
    useSolarStore.setState(useSolarStore.getInitialState());
  });

  it('renders boat search, crew stepper, and cruising style', () => {
    renderWrapped(<QuickStart />);
    expect(screen.getByPlaceholderText(/search.*boat/i)).toBeDefined();
    expect(screen.getByText('2')).toBeDefined(); // default crew
    expect(screen.getByText('Coastal')).toBeDefined();
  });

  it('increments crew size', () => {
    renderWrapped(<QuickStart />);
    fireEvent.click(screen.getByLabelText('Increase crew'));
    expect(useSolarStore.getState().crewSize).toBe(3);
  });

  it('selects cruising style', () => {
    renderWrapped(<QuickStart />);
    fireEvent.click(screen.getByText('Offshore'));
    expect(useSolarStore.getState().cruisingStyle).toBe('offshore');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd packages/web && npx vitest run src/components/solar/__tests__/QuickStart.test.tsx`
Expected: FAIL — module not found

**Step 3: Implement BoatSelector**

```tsx
// packages/web/src/components/solar/BoatSelector.tsx
import { useState } from 'react';
import { Autocomplete, Loader } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useBoatTemplates } from '@/hooks/use-boat-templates';
import { useSolarStore } from '@/stores/solar';

export function BoatSelector() {
  const [search, setSearch] = useState('');
  const [debounced] = useDebouncedValue(search, 300);
  const { data: templates, isLoading } = useBoatTemplates(debounced);

  const setBoatModelId = useSolarStore((s) => s.setBoatModelId);
  const setCrewSize = useSolarStore((s) => s.setCrewSize);
  const setAlternatorAmps = useSolarStore((s) => s.setAlternatorAmps);
  const setSystemVoltage = useSolarStore((s) => s.setSystemVoltage);

  const options = (templates ?? []).map((t: any) => ({
    value: `${t.make} ${t.model}${t.year_range ? ` (${t.year_range})` : ''}`,
    id: t.id,
    template: t,
  }));

  return (
    <Autocomplete
      label="Your boat"
      placeholder="Search... e.g. Lagoon 43"
      data={options.map((o: any) => o.value)}
      value={search}
      onChange={setSearch}
      onOptionSubmit={(val) => {
        const selected = options.find((o: any) => o.value === val);
        if (selected) {
          setBoatModelId(selected.id);
          if (selected.template.default_crew) setCrewSize(selected.template.default_crew);
          if (selected.template.engine_alternator_amps) setAlternatorAmps(selected.template.engine_alternator_amps);
          if (selected.template.system_voltage) setSystemVoltage(selected.template.system_voltage);
        }
      }}
      rightSection={isLoading ? <Loader size="xs" /> : null}
    />
  );
}
```

**Step 4: Implement QuickStart**

```tsx
// packages/web/src/components/solar/QuickStart.tsx
import { Grid, NumberInput, SegmentedControl, Stack, Text } from '@mantine/core';
import { BoatSelector } from './BoatSelector';
import { useSolarStore } from '@/stores/solar';
import type { CruisingStyle } from '@/stores/solar';

export function QuickStart() {
  const crewSize = useSolarStore((s) => s.crewSize);
  const setCrewSize = useSolarStore((s) => s.setCrewSize);
  const cruisingStyle = useSolarStore((s) => s.cruisingStyle);
  const setCruisingStyle = useSolarStore((s) => s.setCruisingStyle);

  return (
    <Grid align="end">
      <Grid.Col span={{ base: 12, sm: 5 }}>
        <BoatSelector />
      </Grid.Col>
      <Grid.Col span={{ base: 6, sm: 3 }}>
        <NumberInput
          label="Crew"
          value={crewSize}
          onChange={(val) => setCrewSize(Number(val) || 2)}
          min={1}
          max={12}
          stepHoldDelay={500}
          stepHoldInterval={100}
          aria-label="Crew size"
          styles={{ input: { textAlign: 'center' } }}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 6, sm: 4 }}>
        <Stack gap={4}>
          <Text size="sm" fw={500}>Cruising style</Text>
          <SegmentedControl
            value={cruisingStyle}
            onChange={(val) => setCruisingStyle(val as CruisingStyle)}
            data={[
              { label: 'Weekend', value: 'weekend' },
              { label: 'Coastal', value: 'coastal' },
              { label: 'Offshore', value: 'offshore' },
            ]}
          />
        </Stack>
      </Grid.Col>
    </Grid>
  );
}
```

**Step 5: Run tests to verify they pass**

Run: `cd packages/web && npx vitest run src/components/solar/__tests__/QuickStart.test.tsx`
Expected: PASS (3 tests)

**Step 6: Commit**

```bash
git add packages/web/src/components/solar/QuickStart.tsx packages/web/src/components/solar/BoatSelector.tsx packages/web/src/components/solar/__tests__/QuickStart.test.tsx
git commit -m "feat: add QuickStart with boat selector, crew stepper, and cruising style toggle"
```

---

## Task 5: Instant Results Banner

Wireframe section 3. Four headline stats with status indicator.

**Files:**
- Create: `packages/web/src/components/solar/ResultsBanner.tsx`
- Create: `packages/web/src/components/solar/__tests__/ResultsBanner.test.tsx`

**Step 1: Write the failing test**

```tsx
// packages/web/src/components/solar/__tests__/ResultsBanner.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { ResultsBanner } from '../ResultsBanner';
import type { ConsumptionResult, SolarRecommendation } from '@/lib/solar/types';

const mockConsumption: ConsumptionResult = {
  totalWhPerDayAnchor: 2340,
  totalWhPerDayPassage: 3100,
  totalAhPerDayAnchor: 195,
  totalAhPerDayPassage: 258,
  breakdownByCategory: {},
};

const mockRecommendation: SolarRecommendation = {
  panelWatts: { minimum: 360, recommended: 480, comfortable: 600 },
  batteryAh: { minimum: 300, recommended: 400, comfortable: 600 },
  batteryCount: 4,
  mpptAmps: 50,
  mpptMaxVoltage: 100,
  inverterWatts: 2000,
  alternatorDailyAh: 45,
  needsSmartRegulator: true,
  batteryMonitor: true,
  wireGauge: '2 AWG',
  dailyGenerationWh: 2700,
  dailyBalance: 360,
};

function renderWithMantine(ui: React.ReactElement) {
  return render(<MantineProvider>{ui}</MantineProvider>);
}

describe('ResultsBanner', () => {
  it('displays consumption, solar, battery, and balance values', () => {
    renderWithMantine(
      <ResultsBanner
        consumption={mockConsumption}
        recommendation={mockRecommendation}
        viewMode="anchor"
        regionName="Mediterranean"
      />
    );
    expect(screen.getByText('2,340')).toBeDefined();
    expect(screen.getByText('480')).toBeDefined();
    expect(screen.getByText('400')).toBeDefined();
  });

  it('shows green indicator when daily balance is positive', () => {
    const { container } = renderWithMantine(
      <ResultsBanner
        consumption={mockConsumption}
        recommendation={mockRecommendation}
        viewMode="anchor"
        regionName="Mediterranean"
      />
    );
    expect(container.querySelector('[data-status="surplus"]')).not.toBeNull();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd packages/web && npx vitest run src/components/solar/__tests__/ResultsBanner.test.tsx`
Expected: FAIL — module not found

**Step 3: Implement ResultsBanner**

```tsx
// packages/web/src/components/solar/ResultsBanner.tsx
import { SimpleGrid, Card, Text, Stack, Anchor } from '@mantine/core';
import type { ConsumptionResult, SolarRecommendation } from '@/lib/solar/types';
import type { ViewMode } from '@/stores/solar';

interface Props {
  consumption: ConsumptionResult;
  recommendation: SolarRecommendation;
  viewMode: ViewMode;
  regionName: string;
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-GB', { maximumFractionDigits: 0 });
}

function getStatus(balance: number): { label: string; color: string; status: string } {
  if (balance > 0) return { label: `+${Math.round((balance / (balance + 1)) * 100)}% surplus`, color: 'green', status: 'surplus' };
  if (balance > -100) return { label: 'Marginal', color: 'yellow', status: 'marginal' };
  return { label: 'Deficit', color: 'red', status: 'deficit' };
}

export function ResultsBanner({ consumption, recommendation, viewMode, regionName }: Props) {
  const dailyWh = viewMode === 'anchor'
    ? consumption.totalWhPerDayAnchor
    : consumption.totalWhPerDayPassage;
  const status = getStatus(recommendation.dailyBalance);

  return (
    <Stack gap="sm">
      <SimpleGrid cols={{ base: 2, sm: 4 }}>
        <Card withBorder padding="md">
          <Stack align="center" gap={4}>
            <Text size="xl" fw={700}>{formatNumber(dailyWh)}</Text>
            <Text size="xs" c="dimmed">Wh/day</Text>
            <Text size="xs" c="dimmed" tt="uppercase">Daily consumption</Text>
          </Stack>
        </Card>
        <Card withBorder padding="md">
          <Stack align="center" gap={4}>
            <Text size="xl" fw={700}>{formatNumber(recommendation.panelWatts.recommended)}</Text>
            <Text size="xs" c="dimmed">watts</Text>
            <Text size="xs" c="dimmed" tt="uppercase">Solar needed</Text>
          </Stack>
        </Card>
        <Card withBorder padding="md">
          <Stack align="center" gap={4}>
            <Text size="xl" fw={700}>{formatNumber(recommendation.batteryAh.recommended)}</Text>
            <Text size="xs" c="dimmed">Ah</Text>
            <Text size="xs" c="dimmed" tt="uppercase">Battery bank</Text>
          </Stack>
        </Card>
        <Card withBorder padding="md" data-status={status.status}>
          <Stack align="center" gap={4}>
            <Text size="xl" fw={700} c={status.color}>{status.label}</Text>
            <Text size="xs" c="dimmed" tt="uppercase">Daily balance</Text>
          </Stack>
        </Card>
      </SimpleGrid>
      <Text ta="center" size="sm" c="dimmed">
        Based on typical {regionName} sunshine.{' '}
        <Anchor href="#region-picker" size="sm">Adjust for your cruising area</Anchor>
      </Text>
    </Stack>
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `cd packages/web && npx vitest run src/components/solar/__tests__/ResultsBanner.test.tsx`
Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add packages/web/src/components/solar/ResultsBanner.tsx packages/web/src/components/solar/__tests__/ResultsBanner.test.tsx
git commit -m "feat: add ResultsBanner with headline stats and status indicator"
```

---

## Task 6: Appliance Grid & Cards

Wireframe section 4 (top half). Category tabs, anchor/passage toggle, appliance cards with toggle and slider.

**Files:**
- Create: `packages/web/src/components/solar/ApplianceGrid.tsx`
- Create: `packages/web/src/components/solar/ApplianceCard.tsx`
- Create: `packages/web/src/components/solar/__tests__/ApplianceCard.test.tsx`

**Step 1: Write the failing test**

```tsx
// packages/web/src/components/solar/__tests__/ApplianceCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { ApplianceCard } from '../ApplianceCard';
import type { Appliance } from '@/lib/solar/types';

const fridge: Appliance = {
  id: 'fridge-1',
  name: 'Fridge (large)',
  category: 'refrigeration',
  wattsTypical: 60,
  wattsMin: 40,
  wattsMax: 80,
  hoursPerDayAnchor: 24,
  hoursPerDayPassage: 24,
  dutyCycle: 0.4,
  usageType: 'always-on',
  crewScaling: false,
  enabled: true,
};

function renderWithMantine(ui: React.ReactElement) {
  return render(<MantineProvider>{ui}</MantineProvider>);
}

describe('ApplianceCard', () => {
  it('shows appliance name and wattage', () => {
    renderWithMantine(
      <ApplianceCard
        appliance={fridge}
        viewMode="anchor"
        crewSize={2}
        onToggle={vi.fn()}
        onHoursChange={vi.fn()}
      />
    );
    expect(screen.getByText('Fridge (large)')).toBeDefined();
    expect(screen.getByText(/60W/)).toBeDefined();
  });

  it('calls onToggle when switch is clicked', () => {
    const onToggle = vi.fn();
    renderWithMantine(
      <ApplianceCard
        appliance={fridge}
        viewMode="anchor"
        crewSize={2}
        onToggle={onToggle}
        onHoursChange={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('switch'));
    expect(onToggle).toHaveBeenCalledWith('fridge-1');
  });

  it('shows crew scaling indicator for crew-scaled appliances', () => {
    const crewScaled = { ...fridge, crewScaling: true, name: 'Device Charging' };
    renderWithMantine(
      <ApplianceCard
        appliance={crewScaled}
        viewMode="anchor"
        crewSize={4}
        onToggle={vi.fn()}
        onHoursChange={vi.fn()}
      />
    );
    expect(screen.getByText(/× 4 crew/)).toBeDefined();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd packages/web && npx vitest run src/components/solar/__tests__/ApplianceCard.test.tsx`
Expected: FAIL — module not found

**Step 3: Implement ApplianceCard**

```tsx
// packages/web/src/components/solar/ApplianceCard.tsx
import { Card, Group, Text, Switch, Slider, Stack } from '@mantine/core';
import type { Appliance } from '@/lib/solar/types';
import type { ViewMode } from '@/stores/solar';

interface Props {
  appliance: Appliance;
  viewMode: ViewMode;
  crewSize: number;
  onToggle: (id: string) => void;
  onHoursChange: (id: string, mode: 'anchor' | 'passage', hours: number) => void;
}

export function ApplianceCard({ appliance, viewMode, crewSize, onToggle, onHoursChange }: Props) {
  const hours = viewMode === 'anchor' ? appliance.hoursPerDayAnchor : appliance.hoursPerDayPassage;

  return (
    <Card
      withBorder
      padding="sm"
      opacity={appliance.enabled ? 1 : 0.5}
      style={appliance.crewScaling ? { borderLeft: '3px solid var(--mantine-color-blue-5)' } : undefined}
    >
      <Stack gap="xs">
        <Group justify="space-between">
          <Text size="sm" fw={600}>{appliance.name}</Text>
          <Switch
            checked={appliance.enabled}
            onChange={() => onToggle(appliance.id)}
            size="sm"
            aria-label={`Toggle ${appliance.name}`}
          />
        </Group>
        <Text size="xs" c="dimmed">
          {appliance.wattsTypical}W typical ({appliance.wattsMin}–{appliance.wattsMax}W)
          {appliance.crewScaling && ` × ${crewSize} crew`}
        </Text>
        <Slider
          value={hours}
          onChange={(val) => onHoursChange(appliance.id, viewMode, val)}
          min={0}
          max={24}
          step={0.5}
          disabled={!appliance.enabled}
          label={(val) => `${val}h/day`}
          size="sm"
        />
        <Group justify="space-between">
          <Text size="xs" c="dimmed">0h</Text>
          <Text size="xs" fw={500}>{hours}h/day</Text>
          <Text size="xs" c="dimmed">24h</Text>
        </Group>
      </Stack>
    </Card>
  );
}
```

**Step 4: Implement ApplianceGrid**

```tsx
// packages/web/src/components/solar/ApplianceGrid.tsx
import { useState } from 'react';
import { SimpleGrid, SegmentedControl, Group, Chip, Stack } from '@mantine/core';
import { ApplianceCard } from './ApplianceCard';
import { useSolarStore } from '@/stores/solar';

const CATEGORIES = [
  'all', 'navigation', 'communication', 'refrigeration', 'lighting',
  'water-systems', 'comfort-galley', 'charging', 'sailing-safety',
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All',
  navigation: 'Navigation',
  communication: 'Communication',
  refrigeration: 'Refrigeration',
  lighting: 'Lighting',
  'water-systems': 'Water Systems',
  'comfort-galley': 'Comfort / Galley',
  charging: 'Charging',
  'sailing-safety': 'Sailing / Safety',
};

export function ApplianceGrid() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const appliances = useSolarStore((s) => s.appliances);
  const viewMode = useSolarStore((s) => s.viewMode);
  const setViewMode = useSolarStore((s) => s.setViewMode);
  const crewSize = useSolarStore((s) => s.crewSize);
  const toggleAppliance = useSolarStore((s) => s.toggleAppliance);
  const updateApplianceHours = useSolarStore((s) => s.updateApplianceHours);

  const filtered = selectedCategory === 'all'
    ? appliances
    : appliances.filter((a) => a.category === selectedCategory);

  return (
    <Stack gap="md">
      <SegmentedControl
        value={viewMode}
        onChange={(val) => setViewMode(val as 'anchor' | 'passage')}
        data={[
          { label: 'At Anchor', value: 'anchor' },
          { label: 'On Passage', value: 'passage' },
        ]}
      />

      <Group gap="xs">
        {CATEGORIES.map((cat) => (
          <Chip
            key={cat}
            checked={selectedCategory === cat}
            onChange={() => setSelectedCategory(cat)}
            size="xs"
          >
            {CATEGORY_LABELS[cat]}
          </Chip>
        ))}
      </Group>

      <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 4 }}>
        {filtered.map((appliance) => (
          <ApplianceCard
            key={appliance.id}
            appliance={appliance}
            viewMode={viewMode}
            crewSize={crewSize}
            onToggle={toggleAppliance}
            onHoursChange={updateApplianceHours}
          />
        ))}
      </SimpleGrid>
    </Stack>
  );
}
```

**Step 5: Run tests to verify they pass**

Run: `cd packages/web && npx vitest run src/components/solar/__tests__/ApplianceCard.test.tsx`
Expected: PASS (3 tests)

**Step 6: Commit**

```bash
git add packages/web/src/components/solar/ApplianceCard.tsx packages/web/src/components/solar/ApplianceGrid.tsx packages/web/src/components/solar/__tests__/ApplianceCard.test.tsx
git commit -m "feat: add ApplianceGrid with category filtering and ApplianceCard with toggle/slider"
```

---

## Task 7: System Preferences Panel

Wireframe section 4 (bottom half). Battery chemistry, voltage, autonomy, alternator, motoring hours, shore power.

**Files:**
- Create: `packages/web/src/components/solar/SystemPreferences.tsx`
- Create: `packages/web/src/components/solar/__tests__/SystemPreferences.test.tsx`

**Step 1: Write the failing test**

```tsx
// packages/web/src/components/solar/__tests__/SystemPreferences.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { SystemPreferences } from '../SystemPreferences';
import { useSolarStore } from '@/stores/solar';

function renderWithMantine(ui: React.ReactElement) {
  return render(<MantineProvider>{ui}</MantineProvider>);
}

describe('SystemPreferences', () => {
  beforeEach(() => {
    useSolarStore.setState(useSolarStore.getInitialState());
  });

  it('renders battery chemistry toggle with LiFePO4 selected by default', () => {
    renderWithMantine(<SystemPreferences />);
    expect(screen.getByText('LiFePO4')).toBeDefined();
  });

  it('renders system voltage with 12V selected by default', () => {
    renderWithMantine(<SystemPreferences />);
    expect(screen.getByText('12V')).toBeDefined();
  });

  it('renders days of autonomy with default 3', () => {
    renderWithMantine(<SystemPreferences />);
    expect(screen.getByDisplayValue('3')).toBeDefined();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd packages/web && npx vitest run src/components/solar/__tests__/SystemPreferences.test.tsx`
Expected: FAIL — module not found

**Step 3: Implement SystemPreferences**

```tsx
// packages/web/src/components/solar/SystemPreferences.tsx
import { Grid, SegmentedControl, NumberInput, Stack, Text } from '@mantine/core';
import { useSolarStore } from '@/stores/solar';

export function SystemPreferences() {
  const batteryChemistry = useSolarStore((s) => s.batteryChemistry);
  const setBatteryChemistry = useSolarStore((s) => s.setBatteryChemistry);
  const systemVoltage = useSolarStore((s) => s.systemVoltage);
  const setSystemVoltage = useSolarStore((s) => s.setSystemVoltage);
  const daysAutonomy = useSolarStore((s) => s.daysAutonomy);
  const setDaysAutonomy = useSolarStore((s) => s.setDaysAutonomy);
  const alternatorAmps = useSolarStore((s) => s.alternatorAmps);
  const setAlternatorAmps = useSolarStore((s) => s.setAlternatorAmps);
  const motoringHoursPerDay = useSolarStore((s) => s.motoringHoursPerDay);
  const setMotoringHoursPerDay = useSolarStore((s) => s.setMotoringHoursPerDay);
  const shorepower = useSolarStore((s) => s.shorepower);
  const setShorepower = useSolarStore((s) => s.setShorepower);

  return (
    <Stack gap="lg">
      <Grid>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Stack gap={4}>
            <Text size="sm" fw={500}>Battery Chemistry</Text>
            <SegmentedControl
              value={batteryChemistry}
              onChange={(val) => setBatteryChemistry(val as 'agm' | 'lifepo4')}
              data={[
                { label: 'AGM', value: 'agm' },
                { label: 'LiFePO4', value: 'lifepo4' },
              ]}
            />
          </Stack>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Stack gap={4}>
            <Text size="sm" fw={500}>System Voltage</Text>
            <SegmentedControl
              value={String(systemVoltage)}
              onChange={(val) => setSystemVoltage(Number(val) as 12 | 24 | 48)}
              data={[
                { label: '12V', value: '12' },
                { label: '24V', value: '24' },
                { label: '48V', value: '48' },
              ]}
            />
          </Stack>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <NumberInput
            label="Days of Autonomy"
            value={daysAutonomy}
            onChange={(val) => setDaysAutonomy(Number(val) || 3)}
            min={1}
            max={7}
            styles={{ input: { textAlign: 'center' } }}
          />
        </Grid.Col>
      </Grid>

      <Grid>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <NumberInput
            label="Engine Alternator (amps)"
            value={alternatorAmps}
            onChange={(val) => setAlternatorAmps(Number(val) || 0)}
            min={0}
            max={300}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <NumberInput
            label="Motoring Hours / Day"
            value={motoringHoursPerDay}
            onChange={(val) => setMotoringHoursPerDay(Number(val) || 0)}
            min={0}
            max={24}
            step={0.5}
            decimalScale={1}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Stack gap={4}>
            <Text size="sm" fw={500}>Shore Power Access</Text>
            <SegmentedControl
              value={shorepower}
              onChange={(val) => setShorepower(val as 'no' | 'sometimes' | 'often')}
              data={[
                { label: 'No', value: 'no' },
                { label: 'Sometimes', value: 'sometimes' },
                { label: 'Often', value: 'often' },
              ]}
            />
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `cd packages/web && npx vitest run src/components/solar/__tests__/SystemPreferences.test.tsx`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add packages/web/src/components/solar/SystemPreferences.tsx packages/web/src/components/solar/__tests__/SystemPreferences.test.tsx
git commit -m "feat: add SystemPreferences with battery, voltage, autonomy, and alternator controls"
```

---

## Task 8: Three-Tier Recommendation Display

Wireframe section 5. Minimum / Recommended / Comfortable columns with component specs.

**Files:**
- Create: `packages/web/src/components/solar/RecommendationTiers.tsx`
- Create: `packages/web/src/components/solar/__tests__/RecommendationTiers.test.tsx`

**Step 1: Write the failing test**

```tsx
// packages/web/src/components/solar/__tests__/RecommendationTiers.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { RecommendationTiers } from '../RecommendationTiers';
import type { SolarRecommendation } from '@/lib/solar/types';

const mockRec: SolarRecommendation = {
  panelWatts: { minimum: 360, recommended: 480, comfortable: 600 },
  batteryAh: { minimum: 300, recommended: 400, comfortable: 600 },
  batteryCount: 4,
  mpptAmps: 50,
  mpptMaxVoltage: 100,
  inverterWatts: 2000,
  alternatorDailyAh: 45,
  needsSmartRegulator: true,
  batteryMonitor: true,
  wireGauge: '2 AWG',
  dailyGenerationWh: 2700,
  dailyBalance: 360,
};

function renderWithMantine(ui: React.ReactElement) {
  return render(<MantineProvider>{ui}</MantineProvider>);
}

describe('RecommendationTiers', () => {
  it('renders three tier columns', () => {
    renderWithMantine(
      <RecommendationTiers recommendation={mockRec} batteryChemistry="lifepo4" />
    );
    expect(screen.getByText('Minimum')).toBeDefined();
    expect(screen.getByText('Recommended')).toBeDefined();
    expect(screen.getByText('Comfortable')).toBeDefined();
  });

  it('displays solar panel wattage for each tier', () => {
    renderWithMantine(
      <RecommendationTiers recommendation={mockRec} batteryChemistry="lifepo4" />
    );
    expect(screen.getByText('360W')).toBeDefined();
    expect(screen.getByText('480W')).toBeDefined();
    expect(screen.getByText('600W')).toBeDefined();
  });

  it('shows smart regulator note for LiFePO4', () => {
    renderWithMantine(
      <RecommendationTiers recommendation={mockRec} batteryChemistry="lifepo4" />
    );
    expect(screen.getByText(/smart regulator/i)).toBeDefined();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd packages/web && npx vitest run src/components/solar/__tests__/RecommendationTiers.test.tsx`
Expected: FAIL — module not found

**Step 3: Implement RecommendationTiers**

```tsx
// packages/web/src/components/solar/RecommendationTiers.tsx
import { SimpleGrid, Card, Stack, Text, Divider, Badge } from '@mantine/core';
import type { SolarRecommendation } from '@/lib/solar/types';

interface Props {
  recommendation: SolarRecommendation;
  batteryChemistry: 'agm' | 'lifepo4';
}

type Tier = 'minimum' | 'recommended' | 'comfortable';

function TierColumn({ tier, rec, batteryChemistry, highlighted }: {
  tier: Tier;
  rec: SolarRecommendation;
  batteryChemistry: string;
  highlighted: boolean;
}) {
  const chemLabel = batteryChemistry === 'lifepo4' ? 'LiFePO4' : 'AGM';

  return (
    <Card
      withBorder
      padding="md"
      style={highlighted ? { borderColor: 'var(--mantine-color-ocean-6)', borderWidth: 2 } : undefined}
    >
      <Stack gap="xs">
        <Text fw={700} ta="center" tt="uppercase" size="sm">
          {tier}
          {highlighted && <Badge ml="xs" size="xs" variant="filled">Best value</Badge>}
        </Text>
        <Divider />
        <Row label="Solar Panels" value={`${rec.panelWatts[tier]}W`} />
        <Row label="MPPT Controller" value={`${rec.mpptAmps}A / ${rec.mpptMaxVoltage}V`} />
        <Row label="Battery Bank" value={`${rec.batteryAh[tier]}Ah ${chemLabel}`} />
        {rec.inverterWatts && <Row label="Inverter" value={`${rec.inverterWatts}W`} />}
        <Row label="Alternator" value={`+${rec.alternatorDailyAh}Ah/day`} />
        <Row label="Battery Monitor" value="Shunt-based" />
        <Row label="Main Wiring" value={rec.wireGauge} />
        {rec.needsSmartRegulator && (
          <Text size="xs" c="blue" fs="italic">Smart regulator recommended for LiFePO4</Text>
        )}
      </Stack>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
      <Text size="sm" c="dimmed">{label}</Text>
      <Text size="sm" fw={600}>{value}</Text>
    </div>
  );
}

export function RecommendationTiers({ recommendation, batteryChemistry }: Props) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 3 }}>
      <TierColumn tier="minimum" rec={recommendation} batteryChemistry={batteryChemistry} highlighted={false} />
      <TierColumn tier="recommended" rec={recommendation} batteryChemistry={batteryChemistry} highlighted={true} />
      <TierColumn tier="comfortable" rec={recommendation} batteryChemistry={batteryChemistry} highlighted={false} />
    </SimpleGrid>
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `cd packages/web && npx vitest run src/components/solar/__tests__/RecommendationTiers.test.tsx`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add packages/web/src/components/solar/RecommendationTiers.tsx packages/web/src/components/solar/__tests__/RecommendationTiers.test.tsx
git commit -m "feat: add RecommendationTiers with minimum/recommended/comfortable columns"
```

---

## Task 9: Charts — Consumption Donut & Monthly Generation

Wireframe section 6. Start with the two simplest charts. Energy flow and multi-location come later.

**Files:**
- Create: `packages/web/src/components/solar/ConsumptionDonut.tsx`
- Create: `packages/web/src/components/solar/MonthlyChart.tsx`
- Create: `packages/web/src/components/solar/__tests__/ConsumptionDonut.test.tsx`

**Step 1: Write the failing test**

```tsx
// packages/web/src/components/solar/__tests__/ConsumptionDonut.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConsumptionDonut } from '../ConsumptionDonut';

describe('ConsumptionDonut', () => {
  it('renders total Wh in the centre', () => {
    const breakdown: Record<string, { anchor: number; passage: number }> = {
      refrigeration: { anchor: 576, passage: 576 },
      navigation: { anchor: 100, passage: 400 },
    };
    render(<ConsumptionDonut breakdown={breakdown} viewMode="anchor" />);
    expect(screen.getByText('676')).toBeDefined();
    expect(screen.getByText('Wh/day')).toBeDefined();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd packages/web && npx vitest run src/components/solar/__tests__/ConsumptionDonut.test.tsx`
Expected: FAIL — module not found

**Step 3: Implement ConsumptionDonut**

```tsx
// packages/web/src/components/solar/ConsumptionDonut.tsx
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Stack, Text } from '@mantine/core';
import type { ViewMode } from '@/stores/solar';

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

interface Props {
  breakdown: Record<string, { anchor: number; passage: number }>;
  viewMode: ViewMode;
}

export function ConsumptionDonut({ breakdown, viewMode }: Props) {
  const data = Object.entries(breakdown)
    .map(([category, vals]) => ({
      name: category,
      value: Math.round(viewMode === 'anchor' ? vals.anchor : vals.passage),
    }))
    .filter((d) => d.value > 0);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Stack align="center" gap={0} style={{ position: 'relative' }}>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] ?? '#888'} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
        <Text size="xl" fw={700}>{total.toLocaleString('en-GB')}</Text>
        <Text size="xs" c="dimmed">Wh/day</Text>
      </div>
    </Stack>
  );
}
```

**Step 4: Implement MonthlyChart**

```tsx
// packages/web/src/components/solar/MonthlyChart.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip } from 'recharts';
import type { PvgisMonthlyData } from '@/lib/solar/types';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface Props {
  monthlyData: PvgisMonthlyData[];
  panelWatts: number;
  deratingFactor: number;
  dailyConsumptionWh: number;
}

export function MonthlyChart({ monthlyData, panelWatts, deratingFactor, dailyConsumptionWh }: Props) {
  const data = monthlyData.map((m) => {
    const generationWh = Math.round(panelWatts * m.horizontalIrradiance * deratingFactor);
    return {
      month: MONTH_LABELS[m.month - 1],
      generation: generationWh,
      surplus: generationWh >= dailyConsumptionWh,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis dataKey="month" tick={{ fill: '#8b8b9e', fontSize: 12 }} />
        <YAxis tick={{ fill: '#8b8b9e', fontSize: 12 }} />
        <Tooltip />
        <ReferenceLine
          y={dailyConsumptionWh}
          stroke="#f87171"
          strokeDasharray="5 5"
          label={{ value: 'Consumption', fill: '#f87171', fontSize: 11 }}
        />
        <Bar dataKey="generation" fill="#4ade80" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

**Step 5: Run tests to verify they pass**

Run: `cd packages/web && npx vitest run src/components/solar/__tests__/ConsumptionDonut.test.tsx`
Expected: PASS (1 test)

**Step 6: Commit**

```bash
git add packages/web/src/components/solar/ConsumptionDonut.tsx packages/web/src/components/solar/MonthlyChart.tsx packages/web/src/components/solar/__tests__/ConsumptionDonut.test.tsx
git commit -m "feat: add ConsumptionDonut and MonthlyChart with Recharts"
```

---

## Task 10: EnergyPlanner Container & Astro Page

Wire everything together. The main container component that orchestrates all sections, plus the Astro page at `/tools/solar`.

**Files:**
- Create: `packages/web/src/components/solar/EnergyPlanner.tsx`
- Create: `packages/web/src/pages/tools/solar.astro`

**Step 1: Implement EnergyPlanner container**

```tsx
// packages/web/src/components/solar/EnergyPlanner.tsx
import { useEffect } from 'react';
import { Stack, Title, Divider, Text } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSolarStore } from '@/stores/solar';
import { useSolarCalculation } from '@/hooks/use-solar-calculation';
import { useApplianceCatalog } from '@/hooks/use-appliance-catalog';
import { JourneySelector } from './JourneySelector';
import { QuickStart } from './QuickStart';
import { ResultsBanner } from './ResultsBanner';
import { ApplianceGrid } from './ApplianceGrid';
import { SystemPreferences } from './SystemPreferences';
import { RecommendationTiers } from './RecommendationTiers';
import { ConsumptionDonut } from './ConsumptionDonut';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 60, retry: 1 },
  },
});

function EnergyPlannerInner() {
  const { data: catalog } = useApplianceCatalog();
  const appliances = useSolarStore((s) => s.appliances);
  const setAppliances = useSolarStore((s) => s.setAppliances);
  const viewMode = useSolarStore((s) => s.viewMode);
  const regionName = useSolarStore((s) => s.regionName);
  const batteryChemistry = useSolarStore((s) => s.batteryChemistry);

  // Load appliance catalog into store on first fetch (only if store is empty)
  useEffect(() => {
    if (catalog && appliances.length === 0) {
      setAppliances(catalog);
    }
  }, [catalog, appliances.length, setAppliances]);

  // Default peak sun hours for Mediterranean
  const peakSunHours = 4.5;
  const { consumption, recommendation } = useSolarCalculation(peakSunHours);

  return (
    <Stack gap="xl" py="lg">
      <div>
        <Title order={1} size="h2" ff="'Space Mono', monospace">Energy Planner</Title>
        <Text c="dimmed" size="sm">Size your solar, batteries, and charging system</Text>
      </div>

      <JourneySelector />

      <Divider />

      <div>
        <Title order={2} size="h4" mb="sm">Quick Start</Title>
        <QuickStart />
      </div>

      <ResultsBanner
        consumption={consumption}
        recommendation={recommendation}
        viewMode={viewMode}
        regionName={regionName}
      />

      <Divider />

      <div>
        <Title order={2} size="h4" mb="sm">Customize</Title>
        <ApplianceGrid />
      </div>

      <SystemPreferences />

      <Divider />

      <div>
        <Title order={2} size="h4" mb="sm">System Recommendation</Title>
        <RecommendationTiers recommendation={recommendation} batteryChemistry={batteryChemistry} />
      </div>

      <Divider />

      <div>
        <Title order={2} size="h4" mb="sm">Consumption Breakdown</Title>
        <ConsumptionDonut breakdown={consumption.breakdownByCategory} viewMode={viewMode} />
      </div>
    </Stack>
  );
}

export function EnergyPlanner() {
  return (
    <QueryClientProvider client={queryClient}>
      <EnergyPlannerInner />
    </QueryClientProvider>
  );
}
```

**Step 2: Create the Astro page**

```astro
---
// packages/web/src/pages/tools/solar.astro
import BaseLayout from '../../layouts/BaseLayout.astro';
import { AppShellWrapper } from '../../components/AppShellWrapper';
import { EnergyPlanner } from '../../components/solar/EnergyPlanner';

export const prerender = false;
---
<BaseLayout title="Energy Planner — Above Deck">
  <AppShellWrapper client:load>
    <EnergyPlanner client:load />
  </AppShellWrapper>
</BaseLayout>
```

**Step 3: Verify it runs**

Run: `cd packages/web && pnpm dev`
Navigate to: http://localhost:4322/tools/solar
Expected: Page loads with all sections visible. Journey cards clickable. Quick Start shows boat search, crew stepper, style toggle. Results banner shows calculated values. Appliance grid shows cards (once Supabase is running with seed data). Recommendation tiers show three columns. Donut chart renders.

**Step 4: Commit**

```bash
git add packages/web/src/components/solar/EnergyPlanner.tsx packages/web/src/pages/tools/solar.astro
git commit -m "feat: add EnergyPlanner container and /tools/solar Astro page"
```

---

## Task 11: Location Region Picker (Placeholder)

Wireframe section 4 map area. For now, a dropdown of popular cruising regions. Mapbox integration comes later.

**Files:**
- Create: `packages/web/src/components/solar/RegionPicker.tsx`
- Modify: `packages/web/src/components/solar/EnergyPlanner.tsx` — add RegionPicker to Customize section

**Step 1: Implement RegionPicker**

```tsx
// packages/web/src/components/solar/RegionPicker.tsx
import { Select, Card, Text, Stack } from '@mantine/core';
import { IconMapPin } from '@tabler/icons-react';
import { useSolarStore } from '@/stores/solar';

const REGIONS = [
  { label: 'Caribbean', value: 'caribbean', lat: 15.0, lon: -61.0, psh: 5.5 },
  { label: 'Mediterranean', value: 'mediterranean', lat: 36.0, lon: 14.5, psh: 4.5 },
  { label: 'Northern Europe', value: 'northern-europe', lat: 52.0, lon: 1.0, psh: 2.8 },
  { label: 'SE Asia', value: 'se-asia', lat: 8.0, lon: 104.0, psh: 4.8 },
  { label: 'South Pacific', value: 'south-pacific', lat: -17.0, lon: -149.0, psh: 5.2 },
  { label: 'East Coast US', value: 'east-coast-us', lat: 28.0, lon: -80.0, psh: 4.5 },
  { label: 'West Coast US', value: 'west-coast-us', lat: 34.0, lon: -118.0, psh: 5.0 },
  { label: 'Indian Ocean', value: 'indian-ocean', lat: -4.0, lon: 55.0, psh: 5.3 },
  { label: 'Red Sea', value: 'red-sea', lat: 22.0, lon: 38.0, psh: 6.0 },
] as const;

export function RegionPicker() {
  const regionName = useSolarStore((s) => s.regionName);
  const setLocation = useSolarStore((s) => s.setLocation);

  const current = REGIONS.find((r) => r.label === regionName);

  return (
    <Card withBorder padding="md" id="region-picker">
      <Stack gap="sm">
        <Text size="sm" fw={600}>Cruising Region</Text>
        <Select
          leftSection={<IconMapPin size={16} />}
          placeholder="Select cruising region"
          data={REGIONS.map((r) => r.label)}
          value={regionName}
          onChange={(val) => {
            const region = REGIONS.find((r) => r.label === val);
            if (region) setLocation(region.lat, region.lon, region.label);
          }}
        />
        {current && (
          <Text size="xs" c="dimmed">
            Average {current.psh} peak sun hours/day. Mapbox visual picker coming soon.
          </Text>
        )}
      </Stack>
    </Card>
  );
}

export { REGIONS };
```

**Step 2: Wire into EnergyPlanner**

Add `<RegionPicker />` after `<ApplianceGrid />` in EnergyPlanner.tsx.

**Step 3: Verify it runs**

Run: Navigate to http://localhost:4322/tools/solar
Expected: Region dropdown appears in Customize section. Selecting a region updates the results.

**Step 4: Commit**

```bash
git add packages/web/src/components/solar/RegionPicker.tsx packages/web/src/components/solar/EnergyPlanner.tsx
git commit -m "feat: add RegionPicker dropdown for cruising regions (Mapbox placeholder)"
```

---

## Task 12: Save Bar — localStorage Persistence

Wireframe section 8. Sticky bottom bar with save/auth buttons. localStorage already handled by Zustand persist — this task adds the visible UI.

**Files:**
- Create: `packages/web/src/components/solar/SaveBar.tsx`
- Modify: `packages/web/src/components/solar/EnergyPlanner.tsx` — add SaveBar

**Step 1: Implement SaveBar**

```tsx
// packages/web/src/components/solar/SaveBar.tsx
import { Group, Button, Text, Paper } from '@mantine/core';
import { IconDeviceFloppy, IconBrandGoogle, IconShare } from '@tabler/icons-react';

interface Props {
  isAuthenticated: boolean;
}

export function SaveBar({ isAuthenticated }: Props) {
  return (
    <Paper
      shadow="md"
      p="sm"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        borderTop: '1px solid var(--mantine-color-default-border)',
      }}
    >
      <Group justify="center" gap="md">
        <Button
          variant="filled"
          leftSection={<IconDeviceFloppy size={16} />}
          size="sm"
        >
          Save to browser
        </Button>

        {!isAuthenticated ? (
          <Button
            variant="default"
            leftSection={<IconBrandGoogle size={16} />}
            size="sm"
            component="a"
            href="/api/auth/signin"
          >
            Sign in to save across devices
          </Button>
        ) : (
          <Button
            variant="default"
            leftSection={<IconShare size={16} />}
            size="sm"
          >
            Share link
          </Button>
        )}
      </Group>
    </Paper>
  );
}
```

**Step 2: Add to EnergyPlanner (outside the main Stack, at the bottom)**

**Step 3: Verify it runs**

Navigate to http://localhost:4322/tools/solar
Expected: Sticky save bar at bottom. "Save to browser" always visible. "Sign in" when not authenticated.

**Step 4: Commit**

```bash
git add packages/web/src/components/solar/SaveBar.tsx packages/web/src/components/solar/EnergyPlanner.tsx
git commit -m "feat: add SaveBar with localStorage save and auth prompt"
```

---

## Summary

| Task | Component | Tests |
|------|-----------|-------|
| 1 | Zustand Store | 12 |
| 2 | Query Hooks + Calculation Hook | 2 |
| 3 | JourneySelector | 2 |
| 4 | QuickStart + BoatSelector | 3 |
| 5 | ResultsBanner | 2 |
| 6 | ApplianceGrid + ApplianceCard | 3 |
| 7 | SystemPreferences | 3 |
| 8 | RecommendationTiers | 3 |
| 9 | ConsumptionDonut + MonthlyChart | 1 |
| 10 | EnergyPlanner Container + Page | manual |
| 11 | RegionPicker (Mapbox placeholder) | manual |
| 12 | SaveBar | manual |

**Total: 12 tasks, ~31 tests, 12 commits**

After completing these tasks, the Energy Planner will be a fully functional single-page calculator with:
- Three journey entry points
- Boat selector with autocomplete from Supabase
- Real-time calculation as inputs change
- Appliance grid with toggle/slider per item
- System preferences (chemistry, voltage, autonomy)
- Region selection (dropdown now, Mapbox later)
- Three-tier recommendation display
- Consumption donut and monthly generation charts
- Persistent state via localStorage
- Save bar with auth prompt

**Not included in this plan (future tasks):**
- Mapbox visual map integration (replaces RegionPicker dropdown)
- 24h Energy Flow chart (Recharts AreaChart)
- Multi-location comparison chart
- SVG System Schematic generator
- What If? panel
- Supabase saved configurations (auth-gated)
- Product examples in recommendation tiers (React Query from product_specs)
