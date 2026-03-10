# Energy Planner Configurator — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the Energy Planner as a guided configurator with Quick Start Wizard, interactive card grid, live wiring schematic, and results dashboard.

**Architecture:** Astro page renders a single `client:only="react"` island. QuickStartWizard gates first visit, then ConfiguratorSplit shows equipment grid + live schematic side-by-side. Results dashboard below the fold. All state in Zustand v4 store with localStorage + URL sharing.

**Tech Stack:** React 19, Mantine v7, Zustand 5, Recharts 2, lz-string (URL compression), @dnd-kit (drag-and-drop), Mapbox GL JS (region picker), jsPDF (export)

**Design doc:** `docs/plans/2026-03-10-energy-planner-configurator-design.md`

**Lessons to remember:**
- Run tests from `packages/web/`, not monorepo root
- Use `useSolarStore((s) => s.field)` selector pattern, never `getState()` in render
- Crew scaling: `Math.max(crewSize, 1) / 2` everywhere
- Constants from `equipment-calc.ts` only — never redeclare
- `client:only="react"` islands need their own MantineProvider
- Dark mode default (`defaultColorScheme="dark"`)
- `HEADING_FONT` from `@/theme/fonts`

---

## Phase 1: Foundation — Store, Types, Data

### Task 1: Install new dependencies

**Files:**
- Modify: `packages/web/package.json`

**Step 1: Install packages**

Run from `packages/web/`:
```bash
pnpm add lz-string @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Note: Mapbox GL and jsPDF are deferred to later phases (lazy-loaded, not needed yet).

**Step 2: Install type definitions**

```bash
pnpm add -D @types/lz-string
```

**Step 3: Verify install**

```bash
pnpm ls lz-string @dnd-kit/core @dnd-kit/sortable
```

**Step 4: Commit**

```bash
git add packages/web/package.json packages/web/pnpm-lock.yaml
git commit -m "feat: add lz-string and dnd-kit dependencies for configurator"
```

---

### Task 2: Extend types for configurator

**Files:**
- Modify: `packages/web/src/lib/solar/types.ts`
- Test: `packages/web/src/lib/solar/__tests__/types.test.ts`

**Step 1: Write failing test**

Add to `types.test.ts`:

```typescript
import type {
  CruisingStyle,
  WizardConfig,
  CuratedRegion,
  PreviousMetrics,
} from '../types';

describe('Configurator types', () => {
  it('CruisingStyle is a valid union', () => {
    const style: CruisingStyle = 'coastal';
    expect(['weekend', 'coastal', 'offshore']).toContain(style);
  });

  it('WizardConfig has required fields', () => {
    const config: WizardConfig = {
      boatName: 'Test',
      templateId: null,
      boatType: 'mono',
      boatLengthFt: 40,
      systemVoltage: 12,
      regionName: 'Mediterranean',
      latitude: 36.0,
      longitude: 14.5,
      peakSunHours: 4.5,
      deratingFactor: 0.75,
      cruisingStyle: 'coastal',
      crewSize: 2,
    };
    expect(config.cruisingStyle).toBe('coastal');
  });

  it('CuratedRegion has required fields', () => {
    const region: CuratedRegion = {
      name: 'Mediterranean',
      lat: 36.0,
      lon: 14.5,
      psh: 4.5,
      deratingFactor: 0.75,
      thumbnailUrl: '',
    };
    expect(region.psh).toBe(4.5);
  });

  it('PreviousMetrics has required fields', () => {
    const metrics: PreviousMetrics = {
      drainWhPerDay: 1000,
      chargeWhPerDay: 1200,
      netBalance: 200,
      daysAutonomy: 2.5,
    };
    expect(metrics.netBalance).toBe(200);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd packages/web && npx vitest run src/lib/solar/__tests__/types.test.ts
```
Expected: FAIL — types not exported yet.

**Step 3: Add types to types.ts**

Append to `packages/web/src/lib/solar/types.ts`:

```typescript
// --- Configurator types (v4) ---

export type CruisingStyle = 'weekend' | 'coastal' | 'offshore';
export type BoatType = 'mono' | 'cat' | 'tri';

export interface WizardConfig {
  boatName: string;
  templateId: string | null;
  boatType: BoatType;
  boatLengthFt: number;
  systemVoltage: 12 | 24 | 48;
  regionName: string;
  latitude: number;
  longitude: number;
  peakSunHours: number;
  deratingFactor: number;
  cruisingStyle: CruisingStyle;
  crewSize: number;
}

export interface CuratedRegion {
  name: string;
  lat: number;
  lon: number;
  psh: number;
  deratingFactor: number;
  thumbnailUrl: string;
}

export interface PreviousMetrics {
  drainWhPerDay: number;
  chargeWhPerDay: number;
  netBalance: number;
  daysAutonomy: number;
}
```

**Step 4: Run test to verify it passes**

```bash
cd packages/web && npx vitest run src/lib/solar/__tests__/types.test.ts
```
Expected: PASS

**Step 5: Commit**

```bash
git add packages/web/src/lib/solar/types.ts packages/web/src/lib/solar/__tests__/types.test.ts
git commit -m "feat: add configurator types (CruisingStyle, WizardConfig, CuratedRegion, PreviousMetrics)"
```

---

### Task 3: Expand curated regions data

**Files:**
- Create: `packages/web/src/lib/solar/regions.ts`
- Test: `packages/web/src/lib/solar/__tests__/regions.test.ts`

**Step 1: Write failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { CURATED_REGIONS, findRegionByName } from '../regions';

describe('CURATED_REGIONS', () => {
  it('has 20 regions', () => {
    expect(CURATED_REGIONS).toHaveLength(20);
  });

  it('each region has required fields', () => {
    for (const region of CURATED_REGIONS) {
      expect(region.name).toBeTruthy();
      expect(region.lat).toBeGreaterThanOrEqual(-90);
      expect(region.lat).toBeLessThanOrEqual(90);
      expect(region.lon).toBeGreaterThanOrEqual(-180);
      expect(region.lon).toBeLessThanOrEqual(180);
      expect(region.psh).toBeGreaterThan(0);
      expect(region.deratingFactor).toBeGreaterThan(0);
      expect(region.deratingFactor).toBeLessThanOrEqual(1);
    }
  });

  it('includes Mediterranean', () => {
    const med = CURATED_REGIONS.find((r) => r.name === 'Mediterranean');
    expect(med).toBeDefined();
    expect(med!.psh).toBe(4.5);
  });
});

describe('findRegionByName', () => {
  it('returns region for exact match', () => {
    const region = findRegionByName('Caribbean');
    expect(region).toBeDefined();
    expect(region!.psh).toBe(5.5);
  });

  it('returns undefined for unknown region', () => {
    expect(findRegionByName('Narnia')).toBeUndefined();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd packages/web && npx vitest run src/lib/solar/__tests__/regions.test.ts
```

**Step 3: Create regions.ts**

```typescript
import type { CuratedRegion } from './types';

export const CURATED_REGIONS: CuratedRegion[] = [
  { name: 'Mediterranean', lat: 36.0, lon: 14.5, psh: 4.5, deratingFactor: 0.75, thumbnailUrl: '' },
  { name: 'Caribbean', lat: 15.0, lon: -61.0, psh: 5.5, deratingFactor: 0.75, thumbnailUrl: '' },
  { name: 'SE Asia', lat: 8.0, lon: 104.0, psh: 4.8, deratingFactor: 0.70, thumbnailUrl: '' },
  { name: 'South Pacific', lat: -17.0, lon: -149.0, psh: 5.0, deratingFactor: 0.75, thumbnailUrl: '' },
  { name: 'Northern Europe', lat: 52.0, lon: 1.0, psh: 2.8, deratingFactor: 0.70, thumbnailUrl: '' },
  { name: 'Canary Islands', lat: 28.1, lon: -15.4, psh: 5.2, deratingFactor: 0.80, thumbnailUrl: '' },
  { name: 'US East Coast', lat: 28.0, lon: -80.0, psh: 4.0, deratingFactor: 0.72, thumbnailUrl: '' },
  { name: 'US West Coast', lat: 34.0, lon: -118.0, psh: 4.5, deratingFactor: 0.75, thumbnailUrl: '' },
  { name: 'Australia', lat: -33.8, lon: 151.2, psh: 5.0, deratingFactor: 0.78, thumbnailUrl: '' },
  { name: 'Red Sea', lat: 22.0, lon: 38.0, psh: 5.8, deratingFactor: 0.72, thumbnailUrl: '' },
  { name: 'Indian Ocean', lat: -4.0, lon: 55.0, psh: 5.0, deratingFactor: 0.73, thumbnailUrl: '' },
  { name: 'Baltic Sea', lat: 56.0, lon: 18.0, psh: 2.5, deratingFactor: 0.68, thumbnailUrl: '' },
  { name: 'UK / Channel', lat: 50.0, lon: -1.0, psh: 2.6, deratingFactor: 0.68, thumbnailUrl: '' },
  { name: 'Japan / Korea', lat: 34.0, lon: 135.0, psh: 3.8, deratingFactor: 0.72, thumbnailUrl: '' },
  { name: 'New Zealand', lat: -41.0, lon: 174.0, psh: 4.2, deratingFactor: 0.75, thumbnailUrl: '' },
  { name: 'Brazil', lat: -22.9, lon: -43.1, psh: 4.8, deratingFactor: 0.73, thumbnailUrl: '' },
  { name: 'West Africa', lat: 14.7, lon: -17.4, psh: 5.0, deratingFactor: 0.70, thumbnailUrl: '' },
  { name: 'Patagonia', lat: -42.0, lon: -65.0, psh: 3.5, deratingFactor: 0.70, thumbnailUrl: '' },
  { name: 'Alaska / PNW', lat: 57.0, lon: -135.0, psh: 2.8, deratingFactor: 0.68, thumbnailUrl: '' },
  { name: 'Persian Gulf', lat: 25.0, lon: 55.0, psh: 5.5, deratingFactor: 0.70, thumbnailUrl: '' },
];

export function findRegionByName(name: string): CuratedRegion | undefined {
  return CURATED_REGIONS.find((r) => r.name === name);
}
```

**Step 4: Run tests**

```bash
cd packages/web && npx vitest run src/lib/solar/__tests__/regions.test.ts
```

**Step 5: Commit**

```bash
git add packages/web/src/lib/solar/regions.ts packages/web/src/lib/solar/__tests__/regions.test.ts
git commit -m "feat: add 20 curated regions with PSH and derating factors"
```

---

### Task 4: Extend Zustand store to v4

**Files:**
- Modify: `packages/web/src/stores/solar.ts`
- Modify: `packages/web/src/stores/__tests__/solar.test.ts`

**Step 1: Write failing tests**

Add to `solar.test.ts`:

```typescript
import type { CruisingStyle, PreviousMetrics, PvgisMonthlyData } from '@/lib/solar/types';

describe('v4 configurator fields', () => {
  it('has default wizardComplete of false', () => {
    expect(useSolarStore.getState().wizardComplete).toBe(false);
  });

  it('has default cruisingStyle of coastal', () => {
    expect(useSolarStore.getState().cruisingStyle).toBe('coastal');
  });

  it('has default boatType of mono', () => {
    expect(useSolarStore.getState().boatType).toBe('mono');
  });

  it('has default boatLengthFt of 40', () => {
    expect(useSolarStore.getState().boatLengthFt).toBe(40);
  });

  it('has default monthlyIrradiance of empty array', () => {
    expect(useSolarStore.getState().monthlyIrradiance).toEqual([]);
  });

  it('has default previousMetrics of null', () => {
    expect(useSolarStore.getState().previousMetrics).toBeNull();
  });
});

describe('setWizardComplete', () => {
  it('sets wizardComplete to true', () => {
    useSolarStore.getState().setWizardComplete();
    expect(useSolarStore.getState().wizardComplete).toBe(true);
  });
});

describe('setCruisingStyle', () => {
  it('sets cruisingStyle', () => {
    useSolarStore.getState().setCruisingStyle('offshore');
    expect(useSolarStore.getState().cruisingStyle).toBe('offshore');
  });
});

describe('setBoatType', () => {
  it('sets boatType', () => {
    useSolarStore.getState().setBoatType('cat');
    expect(useSolarStore.getState().boatType).toBe('cat');
  });
});

describe('setBoatLengthFt', () => {
  it('sets boatLengthFt', () => {
    useSolarStore.getState().setBoatLengthFt(45);
    expect(useSolarStore.getState().boatLengthFt).toBe(45);
  });
});

describe('setMonthlyIrradiance', () => {
  it('sets monthly irradiance data', () => {
    const data: PvgisMonthlyData[] = [
      { month: 1, horizontalIrradiance: 2.5, optimalIrradiance: 3.0, temperature: 10 },
    ];
    useSolarStore.getState().setMonthlyIrradiance(data);
    expect(useSolarStore.getState().monthlyIrradiance).toHaveLength(1);
  });
});

describe('snapshotMetrics', () => {
  it('captures current metrics', () => {
    useSolarStore.getState().snapshotMetrics(100, 150, 50, 2.5);
    const metrics = useSolarStore.getState().previousMetrics;
    expect(metrics).toEqual({
      drainWhPerDay: 100,
      chargeWhPerDay: 150,
      netBalance: 50,
      daysAutonomy: 2.5,
    });
  });
});

describe('resetToTemplate', () => {
  it('clears equipment and resets wizard fields to defaults', () => {
    useSolarStore.getState().addEquipment(makeDrain());
    useSolarStore.getState().setCruisingStyle('offshore');
    useSolarStore.getState().resetToTemplate();

    const state = useSolarStore.getState();
    expect(state.equipment).toEqual([]);
    expect(state.cruisingStyle).toBe('coastal');
    expect(state.wizardComplete).toBe(false);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd packages/web && npx vitest run src/stores/__tests__/solar.test.ts
```

**Step 3: Add new fields and actions to store**

Add to `SolarState` interface:

```typescript
// --- Configurator fields (v4) ---
wizardComplete: boolean;
cruisingStyle: CruisingStyle;
boatType: BoatType;
boatLengthFt: number;
monthlyIrradiance: PvgisMonthlyData[];
previousMetrics: PreviousMetrics | null;

// --- Configurator actions (v4) ---
setWizardComplete: () => void;
setCruisingStyle: (style: CruisingStyle) => void;
setBoatType: (type: BoatType) => void;
setBoatLengthFt: (ft: number) => void;
setMonthlyIrradiance: (data: PvgisMonthlyData[]) => void;
snapshotMetrics: (drain: number, charge: number, balance: number, autonomy: number) => void;
resetToTemplate: () => void;
```

Add to `initialState`:

```typescript
wizardComplete: false,
cruisingStyle: 'coastal' as CruisingStyle,
boatType: 'mono' as BoatType,
boatLengthFt: 40,
monthlyIrradiance: [] as PvgisMonthlyData[],
previousMetrics: null as PreviousMetrics | null,
```

Add actions in `create()`:

```typescript
setWizardComplete: () => set({ wizardComplete: true }),
setCruisingStyle: (style) => set({ cruisingStyle: style }),
setBoatType: (type) => set({ boatType: type }),
setBoatLengthFt: (ft) => set({ boatLengthFt: ft }),
setMonthlyIrradiance: (data) => set({ monthlyIrradiance: data }),
snapshotMetrics: (drain, charge, balance, autonomy) =>
  set({
    previousMetrics: {
      drainWhPerDay: drain,
      chargeWhPerDay: charge,
      netBalance: balance,
      daysAutonomy: autonomy,
    },
  }),
resetToTemplate: () =>
  set({
    equipment: [],
    cruisingStyle: 'coastal',
    boatType: 'mono',
    boatLengthFt: 40,
    wizardComplete: false,
    previousMetrics: null,
  }),
```

Update `version` to `4` and extend `migrate`:

```typescript
version: 4,
migrate: (persisted: unknown, version: number) => {
  const state = persisted as Record<string, unknown>;
  if (version < 3) {
    if (!state.equipment) state.equipment = [];
    if (!state.boatName) state.boatName = '';
    if (!state.templateId) state.templateId = null;
    if (!state.acCircuitVoltage) state.acCircuitVoltage = 220;
  }
  if (version < 4) {
    if (state.wizardComplete === undefined) state.wizardComplete = false;
    if (!state.cruisingStyle) state.cruisingStyle = 'coastal';
    if (!state.boatType) state.boatType = 'mono';
    if (!state.boatLengthFt) state.boatLengthFt = 40;
    if (!state.monthlyIrradiance) state.monthlyIrradiance = [];
    if (state.previousMetrics === undefined) state.previousMetrics = null;
  }
  return state;
},
```

Add new fields to `partialize`.

**Step 4: Run tests**

```bash
cd packages/web && npx vitest run src/stores/__tests__/solar.test.ts
```

**Step 5: Run all tests to check for regressions**

```bash
cd packages/web && npx vitest run
```

**Step 6: Commit**

```bash
git add packages/web/src/stores/solar.ts packages/web/src/stores/__tests__/solar.test.ts
git commit -m "feat: extend store to v4 with wizard, cruising style, and metrics snapshot"
```

---

### Task 5: URL state encoding/decoding utility

**Files:**
- Create: `packages/web/src/lib/solar/url-state.ts`
- Test: `packages/web/src/lib/solar/__tests__/url-state.test.ts`

**Step 1: Write failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { encodeConfig, decodeConfig } from '../url-state';

describe('URL state encoding', () => {
  const config = {
    boatName: 'Bavaria 40',
    systemVoltage: 12,
    regionName: 'Mediterranean',
    crewSize: 2,
    cruisingStyle: 'offshore' as const,
    equipment: [],
  };

  it('encodes config to a string', () => {
    const encoded = encodeConfig(config);
    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(0);
  });

  it('decodes back to same config', () => {
    const encoded = encodeConfig(config);
    const decoded = decodeConfig(encoded);
    expect(decoded).toEqual(config);
  });

  it('returns null for invalid input', () => {
    expect(decodeConfig('not-valid-base64!!')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(decodeConfig('')).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd packages/web && npx vitest run src/lib/solar/__tests__/url-state.test.ts
```

**Step 3: Implement url-state.ts**

```typescript
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

export function encodeConfig(config: Record<string, unknown>): string {
  const json = JSON.stringify(config);
  return compressToEncodedURIComponent(json);
}

export function decodeConfig(encoded: string): Record<string, unknown> | null {
  if (!encoded) return null;
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    return JSON.parse(json);
  } catch {
    return null;
  }
}
```

**Step 4: Run tests**

```bash
cd packages/web && npx vitest run src/lib/solar/__tests__/url-state.test.ts
```

**Step 5: Commit**

```bash
git add packages/web/src/lib/solar/url-state.ts packages/web/src/lib/solar/__tests__/url-state.test.ts
git commit -m "feat: add lz-string URL state encode/decode for config sharing"
```

---

### Task 6: Cruising style equipment profiles

**Files:**
- Create: `packages/web/src/lib/solar/cruising-profiles.ts`
- Test: `packages/web/src/lib/solar/__tests__/cruising-profiles.test.ts`

This defines which equipment items are enabled and their hours/day defaults for each cruising style (weekend, coastal, offshore). Used by the wizard to pre-populate equipment.

**Step 1: Write failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { getProfileAdjustments } from '../cruising-profiles';

describe('getProfileAdjustments', () => {
  it('weekend has low hours and shore charging enabled', () => {
    const adj = getProfileAdjustments('weekend');
    expect(adj.autonomyDays).toBe(1);
    expect(adj.shoreCharging).toBe(true);
  });

  it('coastal has medium hours and 2-day autonomy', () => {
    const adj = getProfileAdjustments('coastal');
    expect(adj.autonomyDays).toBe(2);
  });

  it('offshore has max hours and 3-day autonomy', () => {
    const adj = getProfileAdjustments('offshore');
    expect(adj.autonomyDays).toBe(3);
    expect(adj.shoreCharging).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

**Step 3: Implement cruising-profiles.ts**

```typescript
import type { CruisingStyle } from './types';

export interface ProfileAdjustments {
  autonomyDays: number;
  shoreCharging: boolean;
  hoursMultiplier: number; // scales drain equipment hours
  description: string;
}

const PROFILES: Record<CruisingStyle, ProfileAdjustments> = {
  weekend: {
    autonomyDays: 1,
    shoreCharging: true,
    hoursMultiplier: 0.6,
    description: 'Marina-based, shore power available, short trips',
  },
  coastal: {
    autonomyDays: 2,
    shoreCharging: false,
    hoursMultiplier: 1.0,
    description: 'Week-long trips, some marinas, mostly anchored',
  },
  offshore: {
    autonomyDays: 3,
    shoreCharging: false,
    hoursMultiplier: 1.3,
    description: 'Extended passages, fully self-sufficient',
  },
};

export function getProfileAdjustments(style: CruisingStyle): ProfileAdjustments {
  return PROFILES[style];
}
```

**Step 4: Run tests, commit**

```bash
git add packages/web/src/lib/solar/cruising-profiles.ts packages/web/src/lib/solar/__tests__/cruising-profiles.test.ts
git commit -m "feat: add cruising style profiles (weekend/coastal/offshore)"
```

---

## Phase 2: Quick Start Wizard

### Task 7: StepBoat component

**Files:**
- Create: `packages/web/src/components/solar/wizard/StepBoat.tsx`
- Test: `packages/web/src/components/solar/wizard/__tests__/StepBoat.test.tsx`

Boat selection step with autocomplete search against `boat_model_templates`, manual entry fallback, and skip option. Uses existing `BoatSelector` component internally.

**Step 1: Write failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StepBoat } from '../StepBoat';

// Mock BoatSelector since it calls Supabase
vi.mock('../../BoatSelector', () => ({
  BoatSelector: () => <div data-testid="boat-selector">BoatSelector</div>,
}));

describe('StepBoat', () => {
  const onNext = vi.fn();

  it('renders boat selector and manual entry toggle', () => {
    render(<StepBoat onNext={onNext} />);
    expect(screen.getByTestId('boat-selector')).toBeInTheDocument();
    expect(screen.getByText(/don.*t see my boat/i)).toBeInTheDocument();
  });

  it('shows manual fields when toggle clicked', () => {
    render(<StepBoat onNext={onNext} />);
    fireEvent.click(screen.getByText(/don.*t see my boat/i));
    expect(screen.getByLabelText(/length/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
  });

  it('has a skip button that calls onNext', () => {
    render(<StepBoat onNext={onNext} />);
    fireEvent.click(screen.getByText(/skip/i));
    expect(onNext).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

**Step 3: Implement StepBoat**

The component should:
- Show `BoatSelector` autocomplete by default
- "I don't see my boat" link toggles manual fields: length (NumberInput), type (SegmentedControl: mono/cat/tri), voltage (SegmentedControl: 12/24/48)
- Skip button uses generic 40ft mono defaults
- Next/Continue button writes to store via `setBoat()`, `setBoatType()`, `setBoatLengthFt()`
- Full-bleed card on dark background, large touch targets
- Boat silhouette icon adapts to type selection (use Tabler icons: IconSailboat, IconSailboat2)

**Step 4: Run tests, commit**

```bash
git commit -m "feat: add StepBoat wizard component with template search and manual entry"
```

---

### Task 8: StepRegion component

**Files:**
- Create: `packages/web/src/components/solar/wizard/StepRegion.tsx`
- Test: `packages/web/src/components/solar/wizard/__tests__/StepRegion.test.tsx`

Grid of ~20 curated region cards. Each card shows region name and PSH. "Pick exact location" link is a placeholder for Mapbox (Phase 6).

**Step 1: Write failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StepRegion } from '../StepRegion';

describe('StepRegion', () => {
  const onNext = vi.fn();

  it('renders all 20 curated regions', () => {
    render(<StepRegion onNext={onNext} />);
    expect(screen.getByText('Mediterranean')).toBeInTheDocument();
    expect(screen.getByText('Caribbean')).toBeInTheDocument();
    expect(screen.getByText('Persian Gulf')).toBeInTheDocument();
  });

  it('clicking a region calls onNext', () => {
    render(<StepRegion onNext={onNext} />);
    fireEvent.click(screen.getByText('Caribbean'));
    expect(onNext).toHaveBeenCalled();
  });

  it('shows PSH for each region', () => {
    render(<StepRegion onNext={onNext} />);
    expect(screen.getByText(/5\.5 psh/i)).toBeInTheDocument();
  });
});
```

**Step 2-5: Implement, test, commit**

```bash
git commit -m "feat: add StepRegion wizard with 20 curated region cards"
```

---

### Task 9: StepStyle component

**Files:**
- Create: `packages/web/src/components/solar/wizard/StepStyle.tsx`
- Test: `packages/web/src/components/solar/wizard/__tests__/StepStyle.test.tsx`

Three large cards: Weekend, Coastal, Offshore. One click selects and advances.

**Step 1: Write failing test**

```typescript
describe('StepStyle', () => {
  const onNext = vi.fn();

  it('renders three style cards', () => {
    render(<StepStyle onNext={onNext} />);
    expect(screen.getByText('Weekend')).toBeInTheDocument();
    expect(screen.getByText('Coastal')).toBeInTheDocument();
    expect(screen.getByText('Offshore')).toBeInTheDocument();
  });

  it('clicking a style calls onNext with style value', () => {
    render(<StepStyle onNext={onNext} />);
    fireEvent.click(screen.getByText('Offshore'));
    expect(onNext).toHaveBeenCalledWith('offshore');
  });
});
```

**Step 2-5: Implement, test, commit**

```bash
git commit -m "feat: add StepStyle wizard with weekend/coastal/offshore cards"
```

---

### Task 10: StepCrew component

**Files:**
- Create: `packages/web/src/components/solar/wizard/StepCrew.tsx`
- Test: `packages/web/src/components/solar/wizard/__tests__/StepCrew.test.tsx`

Number stepper (1-12) with explanatory text. "Start Planning" button finishes wizard.

**Step 1-5: Test → Implement → Commit**

```bash
git commit -m "feat: add StepCrew wizard with number stepper"
```

---

### Task 11: QuickStartWizard container

**Files:**
- Create: `packages/web/src/components/solar/wizard/QuickStartWizard.tsx`
- Test: `packages/web/src/components/solar/wizard/__tests__/QuickStartWizard.test.tsx`

Manages 4-step flow with progress dots. Handles transitions, writes to store, calls `setWizardComplete()` on finish.

**Step 1: Write failing test**

```typescript
describe('QuickStartWizard', () => {
  it('renders step 1 (boat) by default', () => {
    render(<QuickStartWizard onComplete={vi.fn()} />);
    expect(screen.getByTestId('step-boat')).toBeInTheDocument();
  });

  it('shows 4 progress dots', () => {
    render(<QuickStartWizard onComplete={vi.fn()} />);
    const dots = screen.getAllByTestId('progress-dot');
    expect(dots).toHaveLength(4);
  });
});
```

**Step 2-5: Implement, test, commit**

The component manages current step as local state. Each step's `onNext` callback advances to next step. On final step completion, calls `onComplete` prop. Animated slide transitions via CSS transform.

```bash
git commit -m "feat: add QuickStartWizard with 4-step flow and progress dots"
```

---

## Phase 3: Configurator Core

### Task 12: BoatBar component

**Files:**
- Create: `packages/web/src/components/solar/configurator/BoatBar.tsx`
- Test: `packages/web/src/components/solar/configurator/__tests__/BoatBar.test.tsx`

Sticky top bar showing config summary, anchor/passage toggle, edit and share buttons.

**Step 1: Write failing test**

```typescript
describe('BoatBar', () => {
  it('shows boat name and region', () => {
    // Pre-populate store
    useSolarStore.getState().setBoatName('Bavaria 40');
    render(<BoatBar onEdit={vi.fn()} onShare={vi.fn()} />);
    expect(screen.getByText(/Bavaria 40/)).toBeInTheDocument();
  });

  it('has anchor/passage toggle', () => {
    render(<BoatBar onEdit={vi.fn()} onShare={vi.fn()} />);
    expect(screen.getByText('Anchor')).toBeInTheDocument();
    expect(screen.getByText('Passage')).toBeInTheDocument();
  });

  it('calls onEdit when edit clicked', () => {
    const onEdit = vi.fn();
    render(<BoatBar onEdit={onEdit} onShare={vi.fn()} />);
    fireEvent.click(screen.getByLabelText(/edit/i));
    expect(onEdit).toHaveBeenCalled();
  });
});
```

**Step 2-5: Implement, test, commit**

Layout:
```
Bavaria 40 · 2 crew · Mediterranean · Offshore · 12V · ⚓ Anchor / ⛵ Passage   [Edit] [Share]
```

Uses `SegmentedControl` for anchor/passage. Sticky top. Mobile: collapses to boat name + toggle.

```bash
git commit -m "feat: add BoatBar with config summary and anchor/passage toggle"
```

---

### Task 13: Redesigned EquipmentGroup with delta badges

**Files:**
- Create: `packages/web/src/components/solar/configurator/EquipmentGroup.tsx`
- Test: `packages/web/src/components/solar/configurator/__tests__/EquipmentGroup.test.tsx`

Enhanced version of the existing EquipmentGroup with:
- Section header: `DRAIN — 1,467 Wh/day (+120 ↑)` with delta badge
- 3-column grid of EquipmentCards
- "+ Add equipment" dashed card
- Delta badge fades after 3 seconds

**Step 1: Write failing test**

```typescript
describe('EquipmentGroup', () => {
  it('shows section title with total Wh/day', () => {
    const items = [makeDrain({ id: 'd1', enabled: true })];
    const whMap = new Map([['d1', 80]]);
    render(
      <EquipmentGroup
        title="Drain"
        items={items}
        whPerDayMap={whMap}
        previousTotal={null}
        onCardClick={vi.fn()}
        onToggle={vi.fn()}
        onAddClick={vi.fn()}
      />
    );
    expect(screen.getByText(/DRAIN/)).toBeInTheDocument();
    expect(screen.getByText(/80 Wh\/day/)).toBeInTheDocument();
  });

  it('shows delta badge when previousTotal provided', () => {
    const items = [makeDrain({ id: 'd1', enabled: true })];
    const whMap = new Map([['d1', 200]]);
    render(
      <EquipmentGroup
        title="Drain"
        items={items}
        whPerDayMap={whMap}
        previousTotal={80}
        onCardClick={vi.fn()}
        onToggle={vi.fn()}
        onAddClick={vi.fn()}
      />
    );
    expect(screen.getByText(/\+120/)).toBeInTheDocument();
  });
});
```

**Step 2-5: Implement, test, commit**

```bash
git commit -m "feat: add EquipmentGroup with delta badge display"
```

---

### Task 14: AddEquipmentModal (category-based discovery)

**Files:**
- Create: `packages/web/src/components/solar/configurator/AddEquipmentModal.tsx`
- Test: `packages/web/src/components/solar/configurator/__tests__/AddEquipmentModal.test.tsx`

Replaces the existing `AddEquipmentDrawer`. Modal (not drawer) with:
- Category cards at top: Navigation, Refrigeration, Lighting, Water Systems, Comfort/Galley, Communication, Sailing/Safety
- Click category → shows items with name, typical wattage, one-tap add
- Search bar for filtering

**Step 1-5: Test → Implement → Commit**

```bash
git commit -m "feat: add AddEquipmentModal with category-based discovery"
```

---

### Task 15: ConfiguratorLayout (grid + schematic placeholder)

**Files:**
- Create: `packages/web/src/components/solar/configurator/ConfiguratorLayout.tsx`
- Test: `packages/web/src/components/solar/configurator/__tests__/ConfiguratorLayout.test.tsx`

Two-column split: EquipmentGrid (left, ~55%) + Schematic placeholder (right, ~45%, sticky). The schematic is a placeholder Panel with "Schematic coming soon" — real implementation in Phase 4.

**Step 1: Write failing test**

```typescript
describe('ConfiguratorLayout', () => {
  it('renders equipment grid with drain/charge/store groups', () => {
    render(<ConfiguratorLayout />);
    expect(screen.getByText(/DRAIN/)).toBeInTheDocument();
    expect(screen.getByText(/CHARGE/)).toBeInTheDocument();
    expect(screen.getByText(/STORE/)).toBeInTheDocument();
  });

  it('renders schematic placeholder', () => {
    render(<ConfiguratorLayout />);
    expect(screen.getByTestId('schematic-panel')).toBeInTheDocument();
  });
});
```

**Step 2-5: Implement, test, commit**

```bash
git commit -m "feat: add ConfiguratorLayout with equipment grid and schematic placeholder"
```

---

## Phase 4: Live Interactive Schematic

### Task 16: Schematic data model

**Files:**
- Create: `packages/web/src/lib/solar/schematic.ts`
- Test: `packages/web/src/lib/solar/__tests__/schematic.test.ts`

Pure function that takes equipment array and returns a schematic graph: nodes (components) and edges (wires) with flow values.

**Step 1: Write failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { buildSchematicGraph } from '../schematic';
import type { EquipmentInstance } from '../types';

describe('buildSchematicGraph', () => {
  it('returns empty graph for no equipment', () => {
    const graph = buildSchematicGraph([], 'anchor', 2, 4.5, 0.75, 12);
    expect(graph.nodes).toHaveLength(0);
    expect(graph.edges).toHaveLength(0);
  });

  it('creates solar → battery → load path', () => {
    const eq: EquipmentInstance[] = [
      // one solar panel, one battery, one drain
    ];
    const graph = buildSchematicGraph(eq, 'anchor', 2, 4.5, 0.75, 12);
    expect(graph.nodes.length).toBeGreaterThanOrEqual(3);
    expect(graph.edges.some((e) => e.type === 'charge')).toBe(true);
    expect(graph.edges.some((e) => e.type === 'drain')).toBe(true);
  });
});
```

**Step 2-5: Implement, test, commit**

Node types: `solar-panel`, `mppt`, `battery-bank`, `dc-load`, `ac-load`, `inverter`, `alternator`, `regulator`, `shore-charger`. Edges have `watts` and `type` (charge/drain/storage).

```bash
git commit -m "feat: add schematic graph builder from equipment array"
```

---

### Task 17: SchematicCanvas SVG component

**Files:**
- Create: `packages/web/src/components/solar/configurator/SchematicCanvas.tsx`
- Test: `packages/web/src/components/solar/configurator/__tests__/SchematicCanvas.test.tsx`

Renders the schematic graph as SVG with:
- Blueprint aesthetic (dark background, fine lines)
- Component boxes sized by capacity
- Color coding: green=charging, coral=consumption, blue=storage
- Animated dashed lines with moving dots (CSS animation)
- Click handler for components
- Hover tooltips

**Step 1: Write failing test**

```typescript
describe('SchematicCanvas', () => {
  it('renders SVG element', () => {
    const graph = { nodes: [], edges: [] };
    const { container } = render(
      <SchematicCanvas graph={graph} selectedId={null} onNodeClick={vi.fn()} />
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders nodes for each component', () => {
    const graph = {
      nodes: [
        { id: 'solar-1', type: 'solar-panel', label: '200W Solar', watts: 200, x: 0, y: 0 },
        { id: 'batt-1', type: 'battery-bank', label: '200Ah LiFePO4', watts: 0, x: 200, y: 0 },
      ],
      edges: [],
    };
    render(<SchematicCanvas graph={graph} selectedId={null} onNodeClick={vi.fn()} />);
    expect(screen.getByText('200W Solar')).toBeInTheDocument();
    expect(screen.getByText('200Ah LiFePO4')).toBeInTheDocument();
  });
});
```

**Step 2-5: Implement, test, commit**

Blueprint styling:
- Background: `var(--mantine-color-body)` or `#1a1a2e`
- Lines: `stroke-width: 1.5`, `stroke-dasharray: 6 4` for flow lines
- Flow animation: CSS `@keyframes dash { to { stroke-dashoffset: -20 } }` with `animation: dash 1s linear infinite`
- Component boxes: `rx="8"`, `fill: #16213e`, `stroke: #2d2d4a`
- Selected highlight: `stroke: #60a5fa`, `filter: drop-shadow(0 0 6px #60a5fa)`

```bash
git commit -m "feat: add SchematicCanvas SVG with blueprint aesthetic and flow animation"
```

---

### Task 18: Wire SchematicCanvas into ConfiguratorLayout

**Files:**
- Modify: `packages/web/src/components/solar/configurator/ConfiguratorLayout.tsx`

Replace schematic placeholder with real `SchematicCanvas`. Wire up:
- Grid ↔ Schematic bidirectional selection
- Click schematic node → highlight card + scroll into view
- Click card → highlight schematic node (yellow glow)
- Toggle equipment → grey out in both views

**Step 1-5: Test interactions, implement, commit**

```bash
git commit -m "feat: wire SchematicCanvas into ConfiguratorLayout with bidirectional selection"
```

---

## Phase 5: Results Dashboard

### Task 19: DashboardHeader (dynamic summary)

**Files:**
- Create: `packages/web/src/components/solar/dashboard/DashboardHeader.tsx`
- Test: `packages/web/src/components/solar/dashboard/__tests__/DashboardHeader.test.tsx`

Dynamic summary line:
- Surplus: "Your 400W system generates a +333 Wh/day surplus..." (green)
- Deficit: "Warning: your system runs a -120 Wh/day deficit..." (coral)

**Step 1-5: Test → Implement → Commit**

```bash
git commit -m "feat: add DashboardHeader with dynamic surplus/deficit summary"
```

---

### Task 20: EnergyFlowChart (24-hour visualization)

**Files:**
- Create: `packages/web/src/components/solar/dashboard/EnergyFlowChart.tsx`
- Test: `packages/web/src/components/solar/dashboard/__tests__/EnergyFlowChart.test.tsx`

The hero visualization. Recharts AreaChart:
- X-axis: 0:00 → 24:00
- Green bell curve for solar generation
- Stacked consumption areas by category
- White dashed SOC overlay
- Green/coral surplus/deficit shading

**Step 1: Write failing test**

```typescript
describe('EnergyFlowChart', () => {
  it('renders without crashing', () => {
    render(
      <EnergyFlowChart
        drainWhPerDay={1000}
        chargeWhPerDay={1200}
        peakSunHours={4.5}
        categories={{ navigation: 200, refrigeration: 400, lighting: 400 }}
        batteryCapacityWh={2400}
      />
    );
    expect(screen.getByTestId('energy-flow-chart')).toBeInTheDocument();
  });
});
```

**Step 2-5: Implement, test, commit**

Uses `generateHourlyData()` helper that creates 24 data points:
- Solar: bell curve peaking at solar noon, width = sunHours
- Consumption: always-on flat + daytime peak + evening peak
- SOC: running integral of (generation - consumption)

```bash
git commit -m "feat: add 24-hour EnergyFlowChart with solar/consumption/SOC curves"
```

---

### Task 21: MonthlyGenerationChart

**Files:**
- Create: `packages/web/src/components/solar/dashboard/MonthlyGenerationChart.tsx`
- Test: `packages/web/src/components/solar/dashboard/__tests__/MonthlyGenerationChart.test.tsx`

Recharts BarChart: 12 bars for monthly solar generation, horizontal line for daily consumption.

**Step 1-5: Test → Implement → Commit**

```bash
git commit -m "feat: add MonthlyGenerationChart with surplus/deficit bar coloring"
```

---

### Task 22: Enhanced ConsumptionDonut

**Files:**
- Modify: `packages/web/src/components/solar/ConsumptionDonut.tsx`

Enhance existing donut:
- Click segment → filters equipment grid to that category
- Center shows total Wh/day
- Legend below with category Wh/day and percentage
- Theme-aware tooltip colors

**Step 1-5: Test → Implement → Commit**

```bash
git commit -m "feat: enhance ConsumptionDonut with click-to-filter and centered total"
```

---

### Task 23: RecommendationTiers (3-column layout)

**Files:**
- Modify: `packages/web/src/components/solar/RecommendationTiers.tsx`

Redesign to 3 columns: Minimum / Recommended / Comfortable. Each shows solar watts, MPPT, battery, inverter, wiring, weight, cost range. "Recommended" column highlighted with ocean accent border.

**Step 1-5: Test → Implement → Commit**

```bash
git commit -m "feat: redesign RecommendationTiers as 3-column comparison"
```

---

### Task 24: ResultsDashboard container

**Files:**
- Create: `packages/web/src/components/solar/dashboard/ResultsDashboard.tsx`
- Test: `packages/web/src/components/solar/dashboard/__tests__/ResultsDashboard.test.tsx`

2×2 grid layout containing all 4 panels. Stacks vertically on mobile.

**Step 1-5: Test → Implement → Commit**

```bash
git commit -m "feat: add ResultsDashboard 2x2 grid container"
```

---

## Phase 6: Region Picker & Sharing

### Task 25: RegionGrid modal

**Files:**
- Create: `packages/web/src/components/solar/configurator/RegionModal.tsx`
- Test: `packages/web/src/components/solar/configurator/__tests__/RegionModal.test.tsx`

Modal with 20 region cards (4-col desktop, 2-col mobile). Each card: region name, PSH, derating factor. Placeholder image area for future Mapbox static thumbnails.

**Step 1-5: Test → Implement → Commit**

```bash
git commit -m "feat: add RegionModal with 20 curated region cards"
```

---

### Task 26: Mapbox interactive map (lazy loaded)

**Files:**
- Create: `packages/web/src/components/solar/configurator/MapboxPicker.tsx`

**Step 1: Install Mapbox GL**

```bash
cd packages/web && pnpm add mapbox-gl
pnpm add -D @types/mapbox-gl
```

**Step 2: Implement lazy-loaded Mapbox component**

Uses `React.lazy()` + `Suspense`. Dark map style. Click to drop pin → reverse geocode. Reads `import.meta.env.PUBLIC_MAPBOX_TOKEN`. Connected to "Pick exact location" link in RegionModal.

Note: PVGIS integration already exists in `lib/solar/pvgis.ts`. Wire the pin drop to fetch monthly irradiance.

**Step 3: Test, commit**

```bash
git commit -m "feat: add lazy-loaded MapboxPicker with dark theme and pin drop"
```

---

### Task 27: ShareModal

**Files:**
- Create: `packages/web/src/components/solar/configurator/ShareModal.tsx`
- Test: `packages/web/src/components/solar/configurator/__tests__/ShareModal.test.tsx`

Modal with:
- Copy Link (uses `encodeConfig` from url-state.ts, copies to clipboard, toast)
- Save to Account (placeholder — shows sign in prompt if not authed)
- Export as PDF (placeholder — Phase 8)
- Export as Text (generates plain text summary)

**Step 1: Write failing test**

```typescript
describe('ShareModal', () => {
  it('renders copy link button', () => {
    render(<ShareModal opened onClose={vi.fn()} />);
    expect(screen.getByText(/copy link/i)).toBeInTheDocument();
  });

  it('renders export options', () => {
    render(<ShareModal opened onClose={vi.fn()} />);
    expect(screen.getByText(/export as text/i)).toBeInTheDocument();
  });
});
```

**Step 2-5: Implement, test, commit**

```bash
git commit -m "feat: add ShareModal with URL sharing and text export"
```

---

## Phase 7: Mobile & Deltas

### Task 28: Mobile bottom sheet

**Files:**
- Create: `packages/web/src/components/solar/configurator/BottomSheet.tsx`
- Test: `packages/web/src/components/solar/configurator/__tests__/BottomSheet.test.tsx`

Swipeable bottom sheet with three states:
- Collapsed: one-line summary "+333 Wh surplus · 2.7 days autonomy"
- Half-open: interactive schematic
- Full-open: all 4 results dashboard panels

Uses CSS transforms and touch event handlers. Only renders on mobile (below 768px breakpoint).

**Step 1-5: Test → Implement → Commit**

```bash
git commit -m "feat: add mobile BottomSheet with collapsed/half/full states"
```

---

### Task 29: Delta calculation hook

**Files:**
- Create: `packages/web/src/hooks/use-delta.ts`
- Test: `packages/web/src/hooks/__tests__/use-delta.test.ts`

Custom hook that:
1. Subscribes to store metrics
2. On value change, calculates delta from `previousMetrics`
3. Returns delta values and a `visible` flag that auto-clears after 3 seconds
4. Color logic: drain increase = coral, charge increase = green, etc.

**Step 1: Write failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { calculateDelta, getDeltaColor } from '../use-delta';

describe('calculateDelta', () => {
  it('returns positive delta when current > previous', () => {
    expect(calculateDelta(200, 100)).toBe(100);
  });

  it('returns negative delta when current < previous', () => {
    expect(calculateDelta(50, 100)).toBe(-50);
  });

  it('returns 0 when no previous', () => {
    expect(calculateDelta(100, null)).toBe(0);
  });
});

describe('getDeltaColor', () => {
  it('drain increase is coral (bad)', () => {
    expect(getDeltaColor('drain', 100)).toBe('coral');
  });

  it('drain decrease is green (good)', () => {
    expect(getDeltaColor('drain', -50)).toBe('green');
  });

  it('charge increase is green (good)', () => {
    expect(getDeltaColor('charge', 100)).toBe('green');
  });

  it('charge decrease is coral (bad)', () => {
    expect(getDeltaColor('charge', -50)).toBe('coral');
  });
});
```

**Step 2-5: Implement, test, commit**

```bash
git commit -m "feat: add delta calculation hook with color logic"
```

---

## Phase 8: Integration

### Task 30: Wire everything into EnergyPlanner root

**Files:**
- Modify: `packages/web/src/components/solar/EnergyPlanner.tsx`

Replace the entire `EnergyPlannerInner` with the new flow:
1. If `!wizardComplete` → render `QuickStartWizard`
2. Else → render `BoatBar` + `ConfiguratorLayout` + `ResultsDashboard`
3. Portal modals: `EquipmentDrawer`, `AddEquipmentModal`, `ShareModal`, `RegionModal`
4. Keep `EnergyPlannerErrorBoundary` wrapper
5. Keep `MantineProvider` + `QueryClientProvider` wrapping

**Step 1: Write integration test**

```typescript
describe('EnergyPlanner integration', () => {
  it('shows wizard when wizardComplete is false', () => {
    useSolarStore.setState({ wizardComplete: false });
    render(<EnergyPlanner />);
    expect(screen.getByTestId('quick-start-wizard')).toBeInTheDocument();
  });

  it('shows configurator when wizardComplete is true', () => {
    useSolarStore.setState({ wizardComplete: true });
    render(<EnergyPlanner />);
    expect(screen.getByTestId('boat-bar')).toBeInTheDocument();
    expect(screen.getByTestId('configurator-layout')).toBeInTheDocument();
  });
});
```

**Step 2-5: Implement, test, commit**

```bash
git commit -m "feat: wire QuickStartWizard + Configurator into EnergyPlanner root"
```

---

### Task 31: URL state loading on page init

**Files:**
- Modify: `packages/web/src/components/solar/EnergyPlanner.tsx`

On mount, check for `?c=` URL parameter. If present, decode with `decodeConfig()` and hydrate store. Skip wizard if URL config is present.

**Step 1-5: Test → Implement → Commit**

```bash
git commit -m "feat: load configuration from URL parameter on page init"
```

---

### Task 32: Return visit banner

**Files:**
- Create: `packages/web/src/components/solar/configurator/ReturnBanner.tsx`

If localStorage has a saved config and `wizardComplete` is true, show a banner:
"Welcome back — pick up where you left off?" with [Continue] and [Start Fresh] buttons.

**Step 1-5: Test → Implement → Commit**

```bash
git commit -m "feat: add return visit banner for localStorage persistence"
```

---

### Task 33: Clean up deprecated code

**Files:**
- Modify: `packages/web/src/components/solar/RegionPicker.tsx` — update to use `CURATED_REGIONS` from `lib/solar/regions.ts`
- Delete: `packages/web/src/components/solar/SummaryBar.tsx` (already removed from main flow)
- Modify: `packages/web/src/lib/solar/index.ts` — add new module exports (regions, url-state, cruising-profiles, schematic)

**Step 1-5: Update imports, run all tests, commit**

```bash
cd packages/web && npx vitest run
git commit -m "chore: clean up deprecated code and update barrel exports"
```

---

### Task 34: Full test pass and PR

**Step 1: Run all unit tests**

```bash
cd packages/web && npx vitest run
```

**Step 2: Run type check**

```bash
cd packages/web && npx tsc --noEmit
```

**Step 3: Run build**

```bash
cd packages/web && pnpm build
```

**Step 4: Fix any failures**

**Step 5: Commit any fixes**

**Step 6: Create PR**

```bash
gh pr create --title "feat: Energy Planner Configurator redesign" --body "..."
```

---

## Dependency Graph

```
Phase 1 (Tasks 1-6): Foundation
  └─→ Phase 2 (Tasks 7-11): Quick Start Wizard
  └─→ Phase 3 (Tasks 12-15): Configurator Core
       └─→ Phase 4 (Tasks 16-18): Live Schematic
       └─→ Phase 5 (Tasks 19-24): Results Dashboard
  └─→ Phase 6 (Tasks 25-27): Region Picker & Sharing
  └─→ Phase 7 (Tasks 28-29): Mobile & Deltas
       └─→ Phase 8 (Tasks 30-34): Integration
```

Phases 2-7 can be worked in parallel after Phase 1 completes. Phase 8 depends on all prior phases.
