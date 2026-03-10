# Equipment Catalog Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace hard-coded equipment templates with a Supabase-backed catalog of ~150 real marine products plus generic defaults, with locked specs for catalog items and editable specs for custom items.

**Architecture:** New `equipment_catalog` table in Supabase replaces both `power_consumers` and `product_specs`. A `useEquipmentCatalog()` TanStack Query hook loads the catalog. The `AddEquipmentModal` is rewritten to query this hook instead of using hard-coded templates. Equipment origin types are extended to distinguish catalog (locked) from custom (editable) items.

**Tech Stack:** Supabase (PostgreSQL), TanStack Query, Mantine v7, Vitest

---

### Task 1: Create the `equipment_catalog` migration

**Files:**
- Create: `supabase/migrations/002_equipment_catalog.sql`

**Step 1: Write the migration**

```sql
-- 002_equipment_catalog.sql
-- Unified equipment catalog: real branded products + generic defaults

CREATE TABLE equipment_catalog (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT NOT NULL CHECK (type IN ('drain', 'charge', 'store')),
  category    TEXT NOT NULL,
  make        TEXT,
  model       TEXT,
  year        INTEGER,
  latest      BOOLEAN DEFAULT true,
  name        TEXT NOT NULL,
  specs       JSONB NOT NULL DEFAULT '{}',
  source_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Index for the most common query pattern
CREATE INDEX idx_equipment_catalog_type_latest ON equipment_catalog (type, latest);
CREATE INDEX idx_equipment_catalog_category ON equipment_catalog (category);

-- Public read access
ALTER TABLE equipment_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read equipment_catalog" ON equipment_catalog FOR SELECT USING (true);
```

**Step 2: Verify the migration file exists**

Run: `cat supabase/migrations/002_equipment_catalog.sql`
Expected: The SQL above is printed.

**Step 3: Commit**

```bash
git add supabase/migrations/002_equipment_catalog.sql
git commit -m "feat: add equipment_catalog migration"
```

---

### Task 2: Research and seed real marine equipment

This is the largest task. Research real product specs from manufacturer websites and create a comprehensive seed file. **All specs must come from real manufacturer datasheets.** Use the `source_url` column to record provenance.

**Files:**
- Create: `supabase/seed_equipment_catalog.sql`

**IMPORTANT research guidelines:**
- Use web search to find official manufacturer spec sheets
- Record the `source_url` for every product
- Use realistic power consumption figures from datasheets
- For `hoursPerDayAnchor` and `hoursPerDayPassage`, use sensible defaults based on the equipment type
- Set `latest: true` for current models, `latest: false` for discontinued but still common
- Generic items have `make: NULL, model: NULL, year: NULL`

**Step 1: Research and write the seed file**

The seed file should insert rows into `equipment_catalog`. Here's the format for each type:

**Drain format:**
```sql
INSERT INTO equipment_catalog (type, category, make, model, year, latest, name, specs, source_url) VALUES
('drain', 'watermaker', 'Schenker', 'Zen 30', 2024, true, 'Schenker Zen 30',
 '{"wattsTypical": 96, "wattsMin": 80, "wattsMax": 120, "hoursPerDayAnchor": 2, "hoursPerDayPassage": 2, "dutyCycle": 1, "crewScaling": false, "powerType": "dc"}',
 'https://www.schenkerwatermakers.com/zen-30');
```

**Charge format:**
```sql
INSERT INTO equipment_catalog (type, category, make, model, year, latest, name, specs, source_url) VALUES
('charge', 'solar', 'Victron', 'BlueSolar 305W', 2024, true, 'Victron BlueSolar 305W',
 '{"sourceType": "solar", "panelWatts": 305, "panelType": "rigid"}',
 'https://www.victronenergy.com/solar-panels');
```

**Store format:**
```sql
INSERT INTO equipment_catalog (type, category, make, model, year, latest, name, specs, source_url) VALUES
('store', 'lifepo4', 'Victron', 'Smart LiFePO4 200Ah', 2024, true, 'Victron Smart LiFePO4 200Ah',
 '{"chemistry": "lifepo4", "capacityAh": 200}',
 'https://www.victronenergy.com/batteries');
```

**Generic format (no make/model):**
```sql
INSERT INTO equipment_catalog (type, category, make, model, year, latest, name, specs, source_url) VALUES
('drain', 'lighting', NULL, NULL, NULL, true, 'LED Cabin Lights (generic)',
 '{"wattsTypical": 12, "wattsMin": 6, "wattsMax": 18, "hoursPerDayAnchor": 6, "hoursPerDayPassage": 4, "dutyCycle": 1, "crewScaling": false, "powerType": "dc"}',
 NULL);
```

**Categories to cover:**

Drains:
- `watermaker` — Schenker (Zen 30, Zen 50, Zen 100, Smart), Spectra (Ventura 150/200, Newport 400), Katadyn (PowerSurvivor 40E, 80E), Rainman (Compact, Petrol), Village Marine (LTM-500/800) + 1 generic
- `genset` — Fischer Panda (iSeries 5000i, 8000i, 15000i), Paguro (2000, 4000, 6000, 9000), WhisperPower (Piccolo 5, 8), Onan/Cummins (QD 3.5, 5.0, 7.5) + 1 generic
- `refrigeration` — Isotherm (Cruise 65, 130, 200), Vitrifrigo (DP2600, C115), Engel (MR040, MT45), Frigoboat (Keel Cooler), Dometic (CoolMatic CRX-50, CRX-110) + 1 generic
- `autopilot` — Raymarine (EV-100, EV-200, EV-400), B&G (NAC-2, NAC-3), Garmin (Reactor 40, GHP 20), Simrad (NAC-2, NAC-3) + 1 generic
- `chartplotter` — Raymarine (Axiom2 7", 9", 12"), Garmin (GPSMAP 723, 923, 1243), B&G (Vulcan 7, 9, 12), Simrad (NSX 7, 9, 12), Furuno (NavNet TZT12F, TZT16F) + 1 generic
- `radar` — Raymarine (Quantum 2), Garmin (GMR Fantom 18x, 24x), Furuno (NXT series), Simrad (HALO20+, HALO24) + 1 generic
- `windlass` — Lewmar (V1, V2, V3, VX2), Quick (Aleph, Hector), Maxwell (RC6, RC8, HRC10), Lofrans (Tigres, Kobra) + 1 generic
- `ais` — Vesper (Cortex M1, Cortex H1), Raymarine (AIS700), em-trak (B360, B100), Digital Yacht (AIT5000) + 1 generic
- `lighting` — Hella Marine (NaviLED Pro, Apelo A1), Lopolight (Series 301, 200), Aqua Signal (Series 34) + 2 generic (cabin, nav)
- `water-systems` — Jabsco (Par-Max 3.0, Par-Max 4.0), Whale (Gulper 320), Raritan (DERA), Shurflo (4048) + 2 generic (pump, toilet)
- `comfort` — generic fan, generic microwave, generic coffee maker, generic heater
- `communication` — Icom (IC-M510, IC-M605), Standard Horizon (GX6000), Starlink (Maritime), Iridium GO! exec + 2 generic (VHF, SSB)
- `sailing` — generic windlass, generic bilge pump, generic wind instruments, generic bow thruster

Charge sources:
- `solar` — Victron (BlueSolar 175W, 215W, 305W), Renogy (100W, 200W, 320W Mono), SunPower (170W Flex, 110W Flex), Rich Solar (200W, 400W), BougeRV (200W Flex, 100W) + 3 generic (100W, 200W, 300W)
- `alternator` — Balmar (AT-SF-200, XT-250), Mastervolt (Alpha 12/130, Alpha 24/75), Electromaax (80A, 120A, 175A) + 3 generic (50A, 80A, 120A)
- `shore` — Victron (Blue Smart IP22 30A, Centaur 50A), Mastervolt (ChargeMaster 25A, 50A), Sterling (Pro Charge Ultra 30A, 60A), ProMariner (ProNautic P 30A, 60A) + 2 generic (15A, 30A)

Storage:
- `lifepo4` — Victron (Smart 100Ah, 200Ah, 330Ah), Battle Born (100Ah, 270Ah), Relion (RB100, RB300), Lithionics (12V 320Ah), SOK (100Ah, 206Ah), Epoch (100Ah, 300Ah) + 2 generic (100Ah, 200Ah)
- `agm` — Lifeline (GPL-27T, GPL-4DL, GPL-8DL), Rolls/Surrette (S-460, S-530), Trojan (T-105, 8D), Firefly (Group 31) + 2 generic (100Ah, 200Ah)

**Step 2: Verify the file is valid SQL**

Run: `wc -l supabase/seed_equipment_catalog.sql`
Expected: Approximately 150-200 lines

**Step 3: Commit**

```bash
git add supabase/seed_equipment_catalog.sql
git commit -m "feat: seed equipment catalog with ~150 real marine products"
```

---

### Task 3: Extend the origin type and add `useEquipmentCatalog` hook

**Files:**
- Modify: `packages/web/src/lib/solar/types.ts:72` — extend `origin` union type
- Create: `packages/web/src/hooks/use-equipment-catalog.ts`
- Create: `packages/web/src/hooks/__tests__/use-equipment-catalog.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/web/src/hooks/__tests__/use-equipment-catalog.test.ts
import { describe, it, expect } from 'vitest';
import { catalogRowToEquipment } from '../use-equipment-catalog';
import type { EquipmentInstance } from '@/lib/solar/types';

describe('catalogRowToEquipment', () => {
  it('converts a drain catalog row to DrainEquipment', () => {
    const row = {
      id: 'cat-123',
      type: 'drain',
      category: 'watermaker',
      make: 'Schenker',
      model: 'Zen 30',
      year: 2024,
      latest: true,
      name: 'Schenker Zen 30',
      specs: {
        wattsTypical: 96,
        wattsMin: 80,
        wattsMax: 120,
        hoursPerDayAnchor: 2,
        hoursPerDayPassage: 2,
        dutyCycle: 1,
        crewScaling: false,
        powerType: 'dc',
      },
    };

    const result = catalogRowToEquipment(row);

    expect(result.id).toBeTruthy(); // generated UUID
    expect(result.catalogId).toBe('cat-123');
    expect(result.name).toBe('Schenker Zen 30');
    expect(result.type).toBe('drain');
    expect(result.origin).toBe('catalog');
    expect(result.enabled).toBe(true);
    if (result.type === 'drain') {
      expect(result.wattsTypical).toBe(96);
      expect(result.powerType).toBe('dc');
      expect(result.category).toBe('watermaker');
    }
  });

  it('converts a charge catalog row to ChargeEquipment', () => {
    const row = {
      id: 'cat-456',
      type: 'charge',
      category: 'solar',
      make: 'Victron',
      model: 'BlueSolar 305W',
      year: 2024,
      latest: true,
      name: 'Victron BlueSolar 305W',
      specs: {
        sourceType: 'solar',
        panelWatts: 305,
        panelType: 'rigid',
      },
    };

    const result = catalogRowToEquipment(row);

    expect(result.catalogId).toBe('cat-456');
    expect(result.origin).toBe('catalog');
    expect(result.type).toBe('charge');
    if (result.type === 'charge') {
      expect(result.sourceType).toBe('solar');
      expect(result.panelWatts).toBe(305);
    }
  });

  it('converts a store catalog row to StoreEquipment', () => {
    const row = {
      id: 'cat-789',
      type: 'store',
      category: 'lifepo4',
      make: 'Battle Born',
      model: '100Ah 12V',
      year: 2024,
      latest: true,
      name: 'Battle Born 100Ah',
      specs: {
        chemistry: 'lifepo4',
        capacityAh: 100,
      },
    };

    const result = catalogRowToEquipment(row);

    expect(result.catalogId).toBe('cat-789');
    expect(result.origin).toBe('catalog');
    expect(result.type).toBe('store');
    if (result.type === 'store') {
      expect(result.chemistry).toBe('lifepo4');
      expect(result.capacityAh).toBe(100);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/hooks/__tests__/use-equipment-catalog.test.ts --reporter=verbose`
Expected: FAIL — module not found

**Step 3: Update the origin type**

In `packages/web/src/lib/solar/types.ts`, change line 72:
```typescript
// Before:
  origin: 'stock' | 'added';
// After:
  origin: 'stock' | 'added' | 'catalog' | 'custom';
```

**Step 4: Write the hook**

```typescript
// packages/web/src/hooks/use-equipment-catalog.ts
import { useQuery } from '@tanstack/react-query';
import { createSupabaseClient } from '@/lib/supabase';
import type { EquipmentInstance, DrainEquipment, ChargeEquipment, StoreEquipment } from '@/lib/solar/types';

export interface CatalogRow {
  id: string;
  type: 'drain' | 'charge' | 'store';
  category: string;
  make: string | null;
  model: string | null;
  year: number | null;
  latest: boolean;
  name: string;
  specs: Record<string, unknown>;
}

export function catalogRowToEquipment(row: CatalogRow): EquipmentInstance {
  const base = {
    id: crypto.randomUUID(),
    catalogId: row.id,
    name: row.name,
    enabled: true,
    origin: 'catalog' as const,
    notes: '',
  };

  switch (row.type) {
    case 'drain':
      return {
        ...base,
        type: 'drain',
        category: row.category,
        wattsTypical: (row.specs.wattsTypical as number) ?? 0,
        wattsMin: (row.specs.wattsMin as number) ?? 0,
        wattsMax: (row.specs.wattsMax as number) ?? 0,
        hoursPerDayAnchor: (row.specs.hoursPerDayAnchor as number) ?? 0,
        hoursPerDayPassage: (row.specs.hoursPerDayPassage as number) ?? 0,
        dutyCycle: (row.specs.dutyCycle as number) ?? 1,
        crewScaling: (row.specs.crewScaling as boolean) ?? false,
        powerType: (row.specs.powerType as 'dc' | 'ac') ?? 'dc',
      } satisfies DrainEquipment;
    case 'charge':
      return {
        ...base,
        type: 'charge',
        sourceType: (row.specs.sourceType as 'solar' | 'alternator' | 'shore') ?? 'solar',
        panelWatts: row.specs.panelWatts as number | undefined,
        panelType: row.specs.panelType as 'rigid' | 'semi-flexible' | 'flexible' | undefined,
        alternatorAmps: row.specs.alternatorAmps as number | undefined,
        motoringHoursPerDay: row.specs.motoringHoursPerDay as number | undefined,
        shoreChargerAmps: row.specs.shoreChargerAmps as number | undefined,
        shoreHoursPerDay: row.specs.shoreHoursPerDay as number | undefined,
      } satisfies ChargeEquipment;
    case 'store':
      return {
        ...base,
        type: 'store',
        chemistry: (row.specs.chemistry as 'agm' | 'lifepo4') ?? 'agm',
        capacityAh: (row.specs.capacityAh as number) ?? 0,
      } satisfies StoreEquipment;
  }
}

export function useEquipmentCatalog(type: 'drain' | 'charge' | 'store', showOldModels = false) {
  const supabase = createSupabaseClient();

  return useQuery({
    queryKey: ['equipment-catalog', type, showOldModels],
    queryFn: async () => {
      let query = supabase
        .from('equipment_catalog')
        .select('*')
        .eq('type', type)
        .order('category')
        .order('name');

      if (!showOldModels) {
        query = query.eq('latest', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as CatalogRow[];
    },
    staleTime: Infinity,
  });
}
```

**Step 5: Run test to verify it passes**

Run: `pnpm vitest run src/hooks/__tests__/use-equipment-catalog.test.ts --reporter=verbose`
Expected: PASS — 3 tests

**Step 6: Commit**

```bash
git add packages/web/src/lib/solar/types.ts packages/web/src/hooks/use-equipment-catalog.ts packages/web/src/hooks/__tests__/use-equipment-catalog.test.ts
git commit -m "feat: add useEquipmentCatalog hook and extend origin types"
```

---

### Task 4: Rewrite AddEquipmentModal to use catalog

**Files:**
- Modify: `packages/web/src/components/solar/configurator/AddEquipmentModal.tsx`
- Modify: `packages/web/src/components/solar/configurator/__tests__/AddEquipmentModal.test.tsx`

**Step 1: Rewrite the test file**

The modal now loads from a hook. In tests, we'll mock the hook. Replace the test file:

```typescript
// packages/web/src/components/solar/configurator/__tests__/AddEquipmentModal.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddEquipmentModal } from '../AddEquipmentModal';
import type { CatalogRow } from '@/hooks/use-equipment-catalog';

// Mock the hook
const mockCatalogData: CatalogRow[] = [
  {
    id: 'cat-1',
    type: 'drain',
    category: 'navigation',
    make: 'Raymarine',
    model: 'Axiom2 9"',
    year: 2024,
    latest: true,
    name: 'Raymarine Axiom2 9"',
    specs: { wattsTypical: 20, wattsMin: 15, wattsMax: 35, hoursPerDayAnchor: 2, hoursPerDayPassage: 16, dutyCycle: 1, crewScaling: false, powerType: 'dc' },
  },
  {
    id: 'cat-2',
    type: 'drain',
    category: 'watermaker',
    make: 'Schenker',
    model: 'Zen 30',
    year: 2024,
    latest: true,
    name: 'Schenker Zen 30',
    specs: { wattsTypical: 96, wattsMin: 80, wattsMax: 120, hoursPerDayAnchor: 2, hoursPerDayPassage: 2, dutyCycle: 1, crewScaling: false, powerType: 'dc' },
  },
];

vi.mock('@/hooks/use-equipment-catalog', () => ({
  useEquipmentCatalog: () => ({ data: mockCatalogData, isLoading: false }),
  catalogRowToEquipment: (await import('@/hooks/use-equipment-catalog')).catalogRowToEquipment,
}));

function wrap(ui: React.ReactElement) {
  return render(<MantineProvider>{ui}</MantineProvider>);
}

describe('AddEquipmentModal', () => {
  it('has data-testid="add-equipment-modal"', () => {
    wrap(
      <AddEquipmentModal opened={true} onClose={vi.fn()} onAdd={vi.fn()} filterType="drain" />,
    );
    expect(screen.getByTestId('add-equipment-modal')).toBeDefined();
  });

  it('has a search bar', () => {
    wrap(
      <AddEquipmentModal opened={true} onClose={vi.fn()} onAdd={vi.fn()} filterType="drain" />,
    );
    expect(screen.getByPlaceholderText(/search/i)).toBeDefined();
  });

  it('renders catalog items grouped by category', () => {
    wrap(
      <AddEquipmentModal opened={true} onClose={vi.fn()} onAdd={vi.fn()} filterType="drain" />,
    );
    expect(screen.getByText('Raymarine Axiom2 9"')).toBeDefined();
  });

  it('calls onAdd with catalog equipment when Add clicked', () => {
    const onAdd = vi.fn();
    wrap(
      <AddEquipmentModal opened={true} onClose={vi.fn()} onAdd={onAdd} filterType="drain" />,
    );
    const addButtons = screen.getAllByRole('button', { name: /Add$/i });
    fireEvent.click(addButtons[0]);
    expect(onAdd).toHaveBeenCalledTimes(1);
    const item = onAdd.mock.calls[0][0];
    expect(item.catalogId).toBeTruthy();
    expect(item.origin).toBe('catalog');
  });

  it('filters items by search text', () => {
    wrap(
      <AddEquipmentModal opened={true} onClose={vi.fn()} onAdd={vi.fn()} filterType="drain" />,
    );
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'schenker' } });
    expect(screen.getByText('Schenker Zen 30')).toBeDefined();
  });
});
```

**Note:** The mock pattern for `catalogRowToEquipment` may need adjusting — you might need to import the real function separately or inline the mock. The key point is that the hook returns mock data while the converter is the real function.

**Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/components/solar/configurator/__tests__/AddEquipmentModal.test.tsx --reporter=verbose`
Expected: FAIL — component still uses hard-coded templates

**Step 3: Rewrite AddEquipmentModal**

The modal needs to:
1. Call `useEquipmentCatalog(filterType)` to get catalog data
2. Group items by `category` for tabs
3. Search across `name`, `make`, `model`
4. Use `catalogRowToEquipment()` to create the equipment instance
5. Show loading state while catalog loads
6. Include a "Show older models" checkbox
7. Include an "Add custom" button that creates a blank editable item

Key structure:
- Remove all hard-coded `DRAIN_CATEGORIES`, `CHARGE_CATEGORIES`, `STORE_TEMPLATES`
- Remove `DrainTemplate`, `ChargeTemplate`, `StoreTemplate` interfaces
- Remove `createDrainItem`, `createChargeItem`, `createStoreItem` functions
- Import `useEquipmentCatalog` and `catalogRowToEquipment`
- Single `CatalogPanel` component replaces `DrainPanel`, `ChargePanel`, `StorePanel`

The `CatalogPanel` component:
- Groups `data` by `category`
- Category names become tab labels (capitalize, replace hyphens)
- Each item shows: name, make badge (if branded), key spec detail
- "Add" button calls `catalogRowToEquipment(row)` then `onAdd()`

**Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/components/solar/configurator/__tests__/AddEquipmentModal.test.tsx --reporter=verbose`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/web/src/components/solar/configurator/AddEquipmentModal.tsx packages/web/src/components/solar/configurator/__tests__/AddEquipmentModal.test.tsx
git commit -m "feat: rewrite AddEquipmentModal to use Supabase equipment catalog"
```

---

### Task 5: Make equipment drawer read-only for catalog items

**Files:**
- Modify: `packages/web/src/components/solar/EquipmentDrawer.tsx`

**Step 1: Read the current EquipmentDrawer code**

Read: `packages/web/src/components/solar/EquipmentDrawer.tsx`

Understand which fields are editable (NumberInput, TextInput components).

**Step 2: Add read-only mode based on origin**

When `item.origin === 'catalog'`:
- Replace editable inputs with read-only `Text` displays
- Show a subtle note: "Specs from manufacturer catalog"
- The toggle (enable/disable) should still work
- The "Duplicate" button should still work
- The "Remove" button should still work

When `item.origin === 'custom'` or `item.origin === 'added'`:
- Keep all fields editable as they are now

Implementation approach:
- Add a `const isLocked = item?.origin === 'catalog';` check
- For each input field, conditionally render either the input or a read-only display
- Or: set `readOnly` prop on Mantine inputs (cleaner, keeps layout)

**Step 3: Run all tests**

Run: `pnpm vitest run --reporter=verbose`
Expected: All tests pass

**Step 4: Commit**

```bash
git add packages/web/src/components/solar/EquipmentDrawer.tsx
git commit -m "feat: lock specs for catalog equipment in drawer"
```

---

### Task 6: Reset Supabase and verify end-to-end

**Step 1: Add seed reference to config**

Check `supabase/config.toml` — if the seed file only references `seed.sql`, update it to also run `seed_equipment_catalog.sql`. Alternatively, append an `\i seed_equipment_catalog.sql` at the end of `seed.sql`.

The simplest approach: add to the end of `supabase/seed.sql`:
```sql
-- Load equipment catalog
\i seed_equipment_catalog.sql
```

**Step 2: Reset the local database**

Run: `supabase db reset` (from monorepo root)
Expected: Database recreated, migrations applied, seed data loaded including equipment catalog.

**Step 3: Verify data is loaded**

Run: `supabase db query "SELECT type, count(*) FROM equipment_catalog GROUP BY type ORDER BY type"`
Expected output showing approximately:
```
 type   | count
--------+-------
 charge |    25
 drain  |   100
 store  |    25
```

**Step 4: Start the dev server and verify**

Run: `pnpm dev` (from packages/web)
1. Navigate to `/tools/solar`
2. Complete the wizard
3. Click "+ Add equipment" on any group
4. Verify the modal shows real branded products loaded from Supabase
5. Search for "Schenker" — verify watermakers appear
6. Add a product — verify it appears in the configurator with locked specs
7. Click the product — verify the drawer shows read-only specs

**Step 5: Run full test suite**

Run: `pnpm vitest run`
Expected: All tests pass

**Step 6: Commit any final fixes**

```bash
git add -A
git commit -m "feat: integrate equipment catalog end-to-end"
```

---

## Summary

| Task | Description | Key files |
|------|-------------|-----------|
| 1 | Migration for `equipment_catalog` table | `supabase/migrations/002_equipment_catalog.sql` |
| 2 | Research & seed ~150 real products | `supabase/seed_equipment_catalog.sql` |
| 3 | `useEquipmentCatalog` hook + type changes | `packages/web/src/hooks/use-equipment-catalog.ts`, types.ts |
| 4 | Rewrite AddEquipmentModal | `packages/web/src/components/solar/configurator/AddEquipmentModal.tsx` |
| 5 | Read-only drawer for catalog items | `packages/web/src/components/solar/EquipmentDrawer.tsx` |
| 6 | Reset DB, verify end-to-end | seed.sql, manual verification |
