# Energy Planner v3 — Drawer-Based Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor the Energy Planner from a long scrolling form to a boat-centric layout with compact equipment cards and a right-side configuration drawer, with AC/DC voltage support.

**Architecture:** Replace flat Zustand store fields with a unified `equipment: EquipmentInstance[]` array on a boat object. Replace section-based layout (EquipmentSection, ChargingSection, StorageSection) with grouped equipment cards that open a right-side drawer for configuration. Sticky summary bar keeps results visible. Calculation engine updated to handle equipment instances and AC inverter efficiency.

**Tech Stack:** React 19, Mantine v7 (Drawer, Paper, SimpleGrid, Switch, Slider, NumberInput, SegmentedControl), Zustand 5, Vitest, TanStack Query 5

**Design doc:** `docs/plans/2026-03-10-energy-planner-v3-design.md`

**Existing codebase reference:**
- Store: `packages/web/src/stores/solar.ts` (20 state fields, 20 actions, persist middleware)
- Types: `packages/web/src/lib/solar/types.ts` (Appliance, SystemConfig, ConsumptionResult, SolarRecommendation)
- Engine: `packages/web/src/lib/solar/engine.ts` (calculateConsumption)
- Charging: `packages/web/src/lib/solar/charging.ts` (calculateDailyCharging)
- Sizing: `packages/web/src/lib/solar/sizing.ts` (calculateRecommendation)
- Hook: `packages/web/src/hooks/use-solar-calculation.ts` (computeResults + useSolarCalculation)
- Components: `packages/web/src/components/solar/` (14 files)
- Tests: 108 tests across 10 files

---

### Task 1: New Type Definitions — EquipmentInstance Union

**Files:**
- Modify: `packages/web/src/lib/solar/types.ts`
- Test: `packages/web/src/lib/solar/__tests__/types.test.ts`

**Context:** The current `Appliance` type is drain-only. We need a discriminated union (`DrainEquipment | ChargeEquipment | StoreEquipment`) where `type` is the discriminant. The old `Appliance` interface stays temporarily for backward compatibility — we'll remove it in the cleanup task.

**Step 1: Write the failing tests**

Create `packages/web/src/lib/solar/__tests__/types.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type {
  DrainEquipment,
  ChargeEquipment,
  StoreEquipment,
  EquipmentInstance,
} from '../types';

describe('EquipmentInstance types', () => {
  it('creates a valid DrainEquipment', () => {
    const drain: DrainEquipment = {
      id: 'drain-1',
      catalogId: 'fridge-01',
      name: 'Cabin Fridge',
      type: 'drain',
      enabled: true,
      origin: 'stock',
      notes: '',
      category: 'refrigeration',
      wattsTypical: 45,
      wattsMin: 30,
      wattsMax: 60,
      hoursPerDayAnchor: 24,
      hoursPerDayPassage: 24,
      dutyCycle: 0.5,
      crewScaling: false,
      powerType: 'dc',
    };
    expect(drain.type).toBe('drain');
    expect(drain.powerType).toBe('dc');
  });

  it('creates a valid ChargeEquipment for solar', () => {
    const solar: ChargeEquipment = {
      id: 'charge-1',
      catalogId: null,
      name: 'Solar Panels',
      type: 'charge',
      enabled: true,
      origin: 'added',
      notes: '',
      sourceType: 'solar',
      panelWatts: 400,
      panelType: 'rigid',
      regionName: 'Mediterranean',
    };
    expect(solar.type).toBe('charge');
    expect(solar.sourceType).toBe('solar');
  });

  it('creates a valid ChargeEquipment for alternator', () => {
    const alt: ChargeEquipment = {
      id: 'charge-2',
      catalogId: null,
      name: 'Engine Alternator',
      type: 'charge',
      enabled: true,
      origin: 'stock',
      notes: '',
      sourceType: 'alternator',
      alternatorAmps: 75,
      motoringHoursPerDay: 1.5,
    };
    expect(alt.sourceType).toBe('alternator');
  });

  it('creates a valid ChargeEquipment for shore power', () => {
    const shore: ChargeEquipment = {
      id: 'charge-3',
      catalogId: null,
      name: 'Shore Power',
      type: 'charge',
      enabled: true,
      origin: 'added',
      notes: '',
      sourceType: 'shore',
      shoreHoursPerDay: 2.5,
      shoreChargerAmps: 30,
    };
    expect(shore.sourceType).toBe('shore');
  });

  it('creates a valid StoreEquipment', () => {
    const battery: StoreEquipment = {
      id: 'store-1',
      catalogId: null,
      name: 'Battery Bank',
      type: 'store',
      enabled: true,
      origin: 'stock',
      notes: '',
      chemistry: 'lifepo4',
      capacityAh: 200,
    };
    expect(battery.type).toBe('store');
    expect(battery.chemistry).toBe('lifepo4');
  });

  it('narrows EquipmentInstance by type discriminant', () => {
    const items: EquipmentInstance[] = [
      {
        id: 'drain-1', catalogId: null, name: 'LED Light', type: 'drain',
        enabled: true, origin: 'stock', notes: '',
        category: 'lighting', wattsTypical: 5, wattsMin: 3, wattsMax: 8,
        hoursPerDayAnchor: 6, hoursPerDayPassage: 2, dutyCycle: 1,
        crewScaling: false, powerType: 'dc',
      },
      {
        id: 'charge-1', catalogId: null, name: 'Solar', type: 'charge',
        enabled: true, origin: 'added', notes: '',
        sourceType: 'solar', panelWatts: 200, panelType: 'rigid', regionName: 'Caribbean',
      },
    ];

    const drains = items.filter((i): i is DrainEquipment => i.type === 'drain');
    expect(drains).toHaveLength(1);
    expect(drains[0].wattsTypical).toBe(5);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd packages/web && npx vitest run src/lib/solar/__tests__/types.test.ts`
Expected: FAIL — types not exported yet

**Step 3: Add the types**

Add to `packages/web/src/lib/solar/types.ts` (keep existing types, add below them):

```typescript
// --- Equipment Instance types (v3) ---

interface EquipmentBase {
  id: string;
  catalogId: string | null;
  name: string;
  type: 'drain' | 'charge' | 'store';
  enabled: boolean;
  origin: 'stock' | 'added';
  notes: string;
}

export interface DrainEquipment extends EquipmentBase {
  type: 'drain';
  category: string;
  wattsTypical: number;
  wattsMin: number;
  wattsMax: number;
  hoursPerDayAnchor: number;
  hoursPerDayPassage: number;
  dutyCycle: number;
  crewScaling: boolean;
  powerType: 'dc' | 'ac';
}

export interface ChargeEquipment extends EquipmentBase {
  type: 'charge';
  sourceType: 'solar' | 'alternator' | 'shore';
  panelWatts?: number;
  panelType?: PanelType;
  regionName?: string;
  alternatorAmps?: number;
  motoringHoursPerDay?: number;
  shoreHoursPerDay?: number;
  shoreChargerAmps?: number;
}

export interface StoreEquipment extends EquipmentBase {
  type: 'store';
  chemistry: 'agm' | 'lifepo4';
  capacityAh: number;
}

export type EquipmentInstance = DrainEquipment | ChargeEquipment | StoreEquipment;
```

**Step 4: Run tests to verify they pass**

Run: `cd packages/web && npx vitest run src/lib/solar/__tests__/types.test.ts`
Expected: PASS (6 tests)

**Step 5: Run full test suite**

Run: `cd packages/web && npx vitest run`
Expected: ALL PASS (existing tests unaffected — we only added types)

**Step 6: Commit**

```bash
git add packages/web/src/lib/solar/types.ts packages/web/src/lib/solar/__tests__/types.test.ts
git commit -m "feat: add EquipmentInstance discriminated union types"
```

---

### Task 2: Rewrite Zustand Store — Boat + Equipment Array

**Files:**
- Modify: `packages/web/src/stores/solar.ts`
- Modify: `packages/web/src/stores/__tests__/solar.test.ts`

**Context:** The current store has 20 flat fields for solar panels, alternator, shore power, battery chemistry, etc. We're replacing this with a `boat` model: boat-level settings + `equipment: EquipmentInstance[]` array. The store still uses Zustand persist middleware with `name: 'above-deck-solar'`.

Important: We need to keep the old fields temporarily with `@deprecated` comments so existing components don't break. We'll remove them in the cleanup task after all components are migrated.

**Step 1: Write the failing tests**

Replace the contents of `packages/web/src/stores/__tests__/solar.test.ts` with:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useSolarStore } from '../solar';
import type { DrainEquipment, ChargeEquipment, StoreEquipment } from '@/lib/solar/types';

const makeDrain = (overrides: Partial<DrainEquipment> = {}): DrainEquipment => ({
  id: 'drain-1',
  catalogId: null,
  name: 'Test Drain',
  type: 'drain',
  enabled: true,
  origin: 'added',
  notes: '',
  category: 'lighting',
  wattsTypical: 10,
  wattsMin: 5,
  wattsMax: 15,
  hoursPerDayAnchor: 8,
  hoursPerDayPassage: 4,
  dutyCycle: 1,
  crewScaling: false,
  powerType: 'dc',
  ...overrides,
});

const makeCharge = (overrides: Partial<ChargeEquipment> = {}): ChargeEquipment => ({
  id: 'charge-1',
  catalogId: null,
  name: 'Solar Panels',
  type: 'charge',
  enabled: true,
  origin: 'added',
  notes: '',
  sourceType: 'solar',
  panelWatts: 400,
  panelType: 'rigid',
  regionName: 'Mediterranean',
  ...overrides,
});

const makeStore = (overrides: Partial<StoreEquipment> = {}): StoreEquipment => ({
  id: 'store-1',
  catalogId: null,
  name: 'Battery Bank',
  type: 'store',
  enabled: true,
  origin: 'stock',
  notes: '',
  chemistry: 'lifepo4',
  capacityAh: 200,
  ...overrides,
});

describe('Solar Store v3', () => {
  beforeEach(() => {
    useSolarStore.setState(useSolarStore.getInitialState());
  });

  describe('boat-level settings', () => {
    it('has default boatName empty string', () => {
      expect(useSolarStore.getState().boatName).toBe('');
    });

    it('has default systemVoltage 12', () => {
      expect(useSolarStore.getState().systemVoltage).toBe(12);
    });

    it('has default acCircuitVoltage 220', () => {
      expect(useSolarStore.getState().acCircuitVoltage).toBe(220);
    });

    it('has default crewSize 2', () => {
      expect(useSolarStore.getState().crewSize).toBe(2);
    });

    it('has default viewMode anchor', () => {
      expect(useSolarStore.getState().viewMode).toBe('anchor');
    });

    it('has default regionName Mediterranean', () => {
      expect(useSolarStore.getState().regionName).toBe('Mediterranean');
    });

    it('sets systemVoltage', () => {
      useSolarStore.getState().setSystemVoltage(24);
      expect(useSolarStore.getState().systemVoltage).toBe(24);
    });

    it('sets acCircuitVoltage', () => {
      useSolarStore.getState().setAcCircuitVoltage(110);
      expect(useSolarStore.getState().acCircuitVoltage).toBe(110);
    });

    it('sets crewSize', () => {
      useSolarStore.getState().setCrewSize(4);
      expect(useSolarStore.getState().crewSize).toBe(4);
    });

    it('sets viewMode', () => {
      useSolarStore.getState().setViewMode('passage');
      expect(useSolarStore.getState().viewMode).toBe('passage');
    });
  });

  describe('equipment array', () => {
    it('starts with empty equipment array', () => {
      expect(useSolarStore.getState().equipment).toEqual([]);
    });

    it('adds equipment', () => {
      const drain = makeDrain();
      useSolarStore.getState().addEquipment(drain);
      expect(useSolarStore.getState().equipment).toHaveLength(1);
      expect(useSolarStore.getState().equipment[0]).toEqual(drain);
    });

    it('adds multiple equipment items', () => {
      useSolarStore.getState().addEquipment(makeDrain());
      useSolarStore.getState().addEquipment(makeCharge());
      useSolarStore.getState().addEquipment(makeStore());
      expect(useSolarStore.getState().equipment).toHaveLength(3);
    });

    it('removes equipment by id', () => {
      useSolarStore.getState().addEquipment(makeDrain({ id: 'a' }));
      useSolarStore.getState().addEquipment(makeDrain({ id: 'b' }));
      useSolarStore.getState().removeEquipment('a');
      expect(useSolarStore.getState().equipment).toHaveLength(1);
      expect(useSolarStore.getState().equipment[0].id).toBe('b');
    });

    it('toggles equipment enabled state', () => {
      useSolarStore.getState().addEquipment(makeDrain({ id: 'x', enabled: true }));
      useSolarStore.getState().toggleEquipment('x');
      expect(useSolarStore.getState().equipment[0].enabled).toBe(false);
      useSolarStore.getState().toggleEquipment('x');
      expect(useSolarStore.getState().equipment[0].enabled).toBe(true);
    });

    it('updates equipment fields', () => {
      useSolarStore.getState().addEquipment(makeDrain({ id: 'u' }));
      useSolarStore.getState().updateEquipment('u', { name: 'Updated', wattsTypical: 99 });
      const item = useSolarStore.getState().equipment[0] as DrainEquipment;
      expect(item.name).toBe('Updated');
      expect(item.wattsTypical).toBe(99);
    });

    it('duplicates equipment with new id', () => {
      useSolarStore.getState().addEquipment(makeDrain({ id: 'orig', name: 'Fridge' }));
      useSolarStore.getState().duplicateEquipment('orig');
      const eq = useSolarStore.getState().equipment;
      expect(eq).toHaveLength(2);
      expect(eq[1].id).not.toBe('orig');
      expect(eq[1].name).toBe('Fridge');
      expect(eq[1].origin).toBe('added');
    });
  });

  describe('setBoat', () => {
    it('sets boat name and equipment from template', () => {
      const items = [makeDrain({ id: 'd1', origin: 'stock' }), makeStore({ id: 's1', origin: 'stock' })];
      useSolarStore.getState().setBoat('tmpl-1', 'Bavaria 46', items, 12, 220);
      const state = useSolarStore.getState();
      expect(state.boatName).toBe('Bavaria 46');
      expect(state.templateId).toBe('tmpl-1');
      expect(state.equipment).toHaveLength(2);
      expect(state.systemVoltage).toBe(12);
      expect(state.acCircuitVoltage).toBe(220);
    });

    it('replaces existing equipment on setBoat', () => {
      useSolarStore.getState().addEquipment(makeDrain({ id: 'old' }));
      useSolarStore.getState().setBoat('tmpl-2', 'Jeanneau 54', [makeCharge({ id: 'new' })], 24, 110);
      expect(useSolarStore.getState().equipment).toHaveLength(1);
      expect(useSolarStore.getState().equipment[0].id).toBe('new');
    });
  });

  describe('setEquipment (bulk)', () => {
    it('replaces entire equipment array', () => {
      useSolarStore.getState().addEquipment(makeDrain({ id: 'a' }));
      useSolarStore.getState().setEquipment([makeCharge({ id: 'b' })]);
      expect(useSolarStore.getState().equipment).toHaveLength(1);
      expect(useSolarStore.getState().equipment[0].id).toBe('b');
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd packages/web && npx vitest run src/stores/__tests__/solar.test.ts`
Expected: FAIL — new fields/actions don't exist yet

**Step 3: Rewrite the store**

Replace `packages/web/src/stores/solar.ts` with:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EquipmentInstance, PanelType, DrainEquipment, ChargeEquipment, StoreEquipment } from '@/lib/solar/types';

type ViewMode = 'anchor' | 'passage';

interface SolarState {
  // Boat-level
  boatName: string;
  templateId: string | null;
  boatModelId: string | null;
  systemVoltage: 12 | 24 | 48;
  acCircuitVoltage: 110 | 220;
  crewSize: number;
  viewMode: ViewMode;
  regionName: string;
  latitude: number;
  longitude: number;
  daysAutonomy: number;
  deratingFactor: number;

  // Equipment
  equipment: EquipmentInstance[];

  // --- Legacy fields (kept for migration, will be removed) ---
  /** @deprecated Use equipment array instead */
  appliances: import('@/lib/solar/types').Appliance[];
  /** @deprecated Use equipment array instead */
  solarPanelWatts: number;
  /** @deprecated Use equipment array instead */
  panelType: PanelType;
  /** @deprecated Use equipment array instead */
  alternatorAmps: number;
  /** @deprecated Use equipment array instead */
  motoringHoursPerDay: number;
  /** @deprecated Use equipment array instead */
  batteryChemistry: 'agm' | 'lifepo4';
  /** @deprecated Use equipment array instead */
  shorePowerHoursPerDay: number;
  /** @deprecated Use equipment array instead */
  shoreChargerAmps: number;
  /** @deprecated Use equipment array instead */
  batteryBankAh: number;
  /** @deprecated Removed in v3 */
  journeyType: 'plan' | 'check' | 'upgrade';
}

interface SolarActions {
  // Boat-level
  setBoat: (templateId: string, name: string, equipment: EquipmentInstance[], voltage: number, acVoltage: number) => void;
  setBoatModelId: (id: string | null) => void;
  setSystemVoltage: (v: 12 | 24 | 48) => void;
  setAcCircuitVoltage: (v: 110 | 220) => void;
  setCrewSize: (size: number) => void;
  setViewMode: (mode: ViewMode) => void;
  setLocation: (lat: number, lon: number, name: string) => void;
  setDaysAutonomy: (days: number) => void;
  setDeratingFactor: (factor: number) => void;

  // Equipment
  addEquipment: (item: EquipmentInstance) => void;
  updateEquipment: (id: string, updates: Partial<EquipmentInstance>) => void;
  removeEquipment: (id: string) => void;
  toggleEquipment: (id: string) => void;
  duplicateEquipment: (id: string) => void;
  setEquipment: (items: EquipmentInstance[]) => void;

  // --- Legacy actions (kept for migration) ---
  setAppliances: (appliances: import('@/lib/solar/types').Appliance[]) => void;
  toggleAppliance: (id: string) => void;
  updateApplianceHours: (id: string, mode: 'anchor' | 'passage', hours: number) => void;
  removeAppliance: (id: string) => void;
  updateApplianceWatts: (id: string, watts: number) => void;
  setSolarPanelWatts: (watts: number) => void;
  setPanelType: (type: PanelType) => void;
  setAlternatorAmps: (amps: number) => void;
  setMotoringHoursPerDay: (hours: number) => void;
  setBatteryChemistry: (chem: 'agm' | 'lifepo4') => void;
  setShorePowerHoursPerDay: (hours: number) => void;
  setShoreChargerAmps: (amps: number) => void;
  setBatteryBankAh: (ah: number) => void;
  setJourneyType: (type: 'plan' | 'check' | 'upgrade') => void;
}

export const initialState: SolarState = {
  boatName: '',
  templateId: null,
  boatModelId: null,
  systemVoltage: 12,
  acCircuitVoltage: 220,
  crewSize: 2,
  viewMode: 'anchor' as ViewMode,
  regionName: 'Mediterranean',
  latitude: 36.0,
  longitude: 14.5,
  daysAutonomy: 3,
  deratingFactor: 0.75,
  equipment: [],
  // Legacy
  appliances: [],
  solarPanelWatts: 0,
  panelType: 'rigid' as PanelType,
  alternatorAmps: 75,
  motoringHoursPerDay: 1.5,
  batteryChemistry: 'lifepo4',
  shorePowerHoursPerDay: 0,
  shoreChargerAmps: 30,
  batteryBankAh: 0,
  journeyType: 'plan',
};

export const useSolarStore = create<SolarState & SolarActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Boat-level
      setBoat: (templateId, name, equipment, voltage, acVoltage) =>
        set({ templateId, boatName: name, equipment, systemVoltage: voltage as 12 | 24 | 48, acCircuitVoltage: acVoltage as 110 | 220 }),
      setBoatModelId: (id) => set({ boatModelId: id }),
      setSystemVoltage: (v) => set({ systemVoltage: v }),
      setAcCircuitVoltage: (v) => set({ acCircuitVoltage: v }),
      setCrewSize: (size) => set({ crewSize: size }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setLocation: (lat, lon, name) => set({ latitude: lat, longitude: lon, regionName: name }),
      setDaysAutonomy: (days) => set({ daysAutonomy: days }),
      setDeratingFactor: (factor) => set({ deratingFactor: factor }),

      // Equipment
      addEquipment: (item) => set((s) => ({ equipment: [...s.equipment, item] })),
      updateEquipment: (id, updates) =>
        set((s) => ({
          equipment: s.equipment.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),
      removeEquipment: (id) =>
        set((s) => ({ equipment: s.equipment.filter((e) => e.id !== id) })),
      toggleEquipment: (id) =>
        set((s) => ({
          equipment: s.equipment.map((e) =>
            e.id === id ? { ...e, enabled: !e.enabled } : e
          ),
        })),
      duplicateEquipment: (id) => {
        const item = get().equipment.find((e) => e.id === id);
        if (!item) return;
        const dup = { ...item, id: `${item.id}-${Date.now()}`, origin: 'added' as const };
        set((s) => ({ equipment: [...s.equipment, dup] }));
      },
      setEquipment: (items) => set({ equipment: items }),

      // Legacy actions
      setAppliances: (appliances) => set({ appliances }),
      toggleAppliance: (id) =>
        set((s) => ({
          appliances: s.appliances.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)),
        })),
      updateApplianceHours: (id, mode, hours) =>
        set((s) => ({
          appliances: s.appliances.map((a) =>
            a.id === id
              ? { ...a, [mode === 'anchor' ? 'hoursPerDayAnchor' : 'hoursPerDayPassage']: hours }
              : a
          ),
        })),
      removeAppliance: (id) =>
        set((s) => ({ appliances: s.appliances.filter((a) => a.id !== id) })),
      updateApplianceWatts: (id, watts) =>
        set((s) => ({
          appliances: s.appliances.map((a) => (a.id === id ? { ...a, wattsTypical: watts } : a)),
        })),
      setSolarPanelWatts: (watts) => set({ solarPanelWatts: watts }),
      setPanelType: (type) => set({ panelType: type }),
      setAlternatorAmps: (amps) => set({ alternatorAmps: amps }),
      setMotoringHoursPerDay: (hours) => set({ motoringHoursPerDay: hours }),
      setBatteryChemistry: (chem) => set({ batteryChemistry: chem }),
      setShorePowerHoursPerDay: (hours) => set({ shorePowerHoursPerDay: hours }),
      setShoreChargerAmps: (amps) => set({ shoreChargerAmps: amps }),
      setBatteryBankAh: (ah) => set({ batteryBankAh: ah }),
      setJourneyType: (type) => set({ journeyType: type }),
    }),
    {
      name: 'above-deck-solar',
      partialize: (state) => ({
        boatName: state.boatName,
        templateId: state.templateId,
        boatModelId: state.boatModelId,
        systemVoltage: state.systemVoltage,
        acCircuitVoltage: state.acCircuitVoltage,
        crewSize: state.crewSize,
        viewMode: state.viewMode,
        regionName: state.regionName,
        latitude: state.latitude,
        longitude: state.longitude,
        daysAutonomy: state.daysAutonomy,
        deratingFactor: state.deratingFactor,
        equipment: state.equipment,
        // Legacy
        appliances: state.appliances,
        solarPanelWatts: state.solarPanelWatts,
        panelType: state.panelType,
        alternatorAmps: state.alternatorAmps,
        motoringHoursPerDay: state.motoringHoursPerDay,
        batteryChemistry: state.batteryChemistry,
        shorePowerHoursPerDay: state.shorePowerHoursPerDay,
        shoreChargerAmps: state.shoreChargerAmps,
        batteryBankAh: state.batteryBankAh,
        journeyType: state.journeyType,
      }),
    }
  )
);
```

**Step 4: Run tests to verify they pass**

Run: `cd packages/web && npx vitest run src/stores/__tests__/solar.test.ts`
Expected: PASS (22 tests)

**Step 5: Run full test suite**

Run: `cd packages/web && npx vitest run`
Expected: ALL PASS — legacy fields and actions preserved

**Step 6: Commit**

```bash
git add packages/web/src/stores/solar.ts packages/web/src/stores/__tests__/solar.test.ts
git commit -m "feat: add equipment array and boat-level settings to store"
```

---

### Task 3: Update Calculation Engine — Equipment-Based + AC Efficiency

**Files:**
- Create: `packages/web/src/lib/solar/equipment-calc.ts`
- Create: `packages/web/src/lib/solar/__tests__/equipment-calc.test.ts`

**Context:** New calculation functions that work with `EquipmentInstance[]` instead of the old flat fields. These compute drain, charge, and store totals from the equipment array. AC items get a 0.85 inverter efficiency penalty. Shore power uses `acCircuitVoltage`. The old engine.ts/charging.ts/sizing.ts stay for backward compatibility.

**Step 1: Write the failing tests**

Create `packages/web/src/lib/solar/__tests__/equipment-calc.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  calculateDrainFromEquipment,
  calculateChargeFromEquipment,
  calculateStorageFromEquipment,
} from '../equipment-calc';
import type { DrainEquipment, ChargeEquipment, StoreEquipment } from '../types';

describe('calculateDrainFromEquipment', () => {
  const makeDrain = (overrides: Partial<DrainEquipment> = {}): DrainEquipment => ({
    id: 'd1', catalogId: null, name: 'Test', type: 'drain', enabled: true,
    origin: 'stock', notes: '', category: 'lighting',
    wattsTypical: 10, wattsMin: 5, wattsMax: 15,
    hoursPerDayAnchor: 8, hoursPerDayPassage: 4, dutyCycle: 1,
    crewScaling: false, powerType: 'dc',
    ...overrides,
  });

  it('calculates Wh/day for a DC drain item at anchor', () => {
    const result = calculateDrainFromEquipment([makeDrain()], 'anchor', 2);
    expect(result.totalWhPerDay).toBe(80); // 10W × 8h × 1.0 duty × 1.0 crew
  });

  it('calculates Wh/day at passage', () => {
    const result = calculateDrainFromEquipment([makeDrain()], 'passage', 2);
    expect(result.totalWhPerDay).toBe(40); // 10W × 4h × 1.0 duty
  });

  it('applies crew scaling', () => {
    const item = makeDrain({ crewScaling: true, wattsTypical: 10, hoursPerDayAnchor: 10, dutyCycle: 1 });
    const result = calculateDrainFromEquipment([item], 'anchor', 4);
    // crewMultiplier = 4 / 2 = 2
    expect(result.totalWhPerDay).toBe(200); // 10 × 10 × 1.0 × 2.0
  });

  it('applies inverter efficiency for AC items', () => {
    const item = makeDrain({ powerType: 'ac', wattsTypical: 100, hoursPerDayAnchor: 1, dutyCycle: 1 });
    const result = calculateDrainFromEquipment([item], 'anchor', 2);
    // 100W × 1h × 1.0 × 1.0 / 0.85 ≈ 117.65 → round to 118
    expect(result.totalWhPerDay).toBe(118);
  });

  it('skips disabled items', () => {
    const item = makeDrain({ enabled: false });
    const result = calculateDrainFromEquipment([item], 'anchor', 2);
    expect(result.totalWhPerDay).toBe(0);
  });

  it('provides breakdown by category', () => {
    const items = [
      makeDrain({ id: 'a', category: 'lighting', wattsTypical: 10, hoursPerDayAnchor: 5, dutyCycle: 1 }),
      makeDrain({ id: 'b', category: 'refrigeration', wattsTypical: 45, hoursPerDayAnchor: 24, dutyCycle: 0.5 }),
    ];
    const result = calculateDrainFromEquipment(items, 'anchor', 2);
    expect(result.breakdownByCategory['lighting']).toBe(50);
    expect(result.breakdownByCategory['refrigeration']).toBe(540);
    expect(result.totalWhPerDay).toBe(590);
  });
});

describe('calculateChargeFromEquipment', () => {
  it('calculates solar charging', () => {
    const solar: ChargeEquipment = {
      id: 'c1', catalogId: null, name: 'Solar', type: 'charge',
      enabled: true, origin: 'added', notes: '',
      sourceType: 'solar', panelWatts: 400, panelType: 'rigid', regionName: 'Med',
    };
    const result = calculateChargeFromEquipment([solar], {
      peakSunHours: 5, deratingFactor: 0.75, systemVoltage: 12, acCircuitVoltage: 220,
    });
    // 400 × 5 × 0.75 × 1.0 (rigid) = 1500
    expect(result.totalWhPerDay).toBe(1500);
    expect(result.solarWhPerDay).toBe(1500);
  });

  it('applies panel type derating', () => {
    const solar: ChargeEquipment = {
      id: 'c1', catalogId: null, name: 'Solar', type: 'charge',
      enabled: true, origin: 'added', notes: '',
      sourceType: 'solar', panelWatts: 400, panelType: 'flexible', regionName: 'Med',
    };
    const result = calculateChargeFromEquipment([solar], {
      peakSunHours: 5, deratingFactor: 0.75, systemVoltage: 12, acCircuitVoltage: 220,
    });
    // 400 × 5 × 0.75 × 0.85 = 1275
    expect(result.totalWhPerDay).toBe(1275);
  });

  it('calculates alternator charging', () => {
    const alt: ChargeEquipment = {
      id: 'c2', catalogId: null, name: 'Alternator', type: 'charge',
      enabled: true, origin: 'stock', notes: '',
      sourceType: 'alternator', alternatorAmps: 75, motoringHoursPerDay: 1.5,
    };
    const result = calculateChargeFromEquipment([alt], {
      peakSunHours: 5, deratingFactor: 0.75, systemVoltage: 12, acCircuitVoltage: 220,
    });
    // 75 × 12 × 1.5 × 0.7 = 945
    expect(result.alternatorWhPerDay).toBe(945);
  });

  it('calculates shore power charging using AC voltage', () => {
    const shore: ChargeEquipment = {
      id: 'c3', catalogId: null, name: 'Shore', type: 'charge',
      enabled: true, origin: 'added', notes: '',
      sourceType: 'shore', shoreHoursPerDay: 2, shoreChargerAmps: 30,
    };
    const result = calculateChargeFromEquipment([shore], {
      peakSunHours: 5, deratingFactor: 0.75, systemVoltage: 12, acCircuitVoltage: 220,
    });
    // Shore power: chargerAmps × systemVoltage × hours (charger outputs DC)
    // 30A × 12V × 2h = 720 Wh
    expect(result.shoreWhPerDay).toBe(720);
  });

  it('sums all charge sources', () => {
    const items: ChargeEquipment[] = [
      {
        id: 'c1', catalogId: null, name: 'Solar', type: 'charge',
        enabled: true, origin: 'added', notes: '',
        sourceType: 'solar', panelWatts: 200, panelType: 'rigid', regionName: 'Med',
      },
      {
        id: 'c2', catalogId: null, name: 'Alt', type: 'charge',
        enabled: true, origin: 'stock', notes: '',
        sourceType: 'alternator', alternatorAmps: 75, motoringHoursPerDay: 1,
      },
    ];
    const result = calculateChargeFromEquipment(items, {
      peakSunHours: 5, deratingFactor: 0.75, systemVoltage: 12, acCircuitVoltage: 220,
    });
    // Solar: 200 × 5 × 0.75 × 1.0 = 750
    // Alt: 75 × 12 × 1 × 0.7 = 630
    expect(result.totalWhPerDay).toBe(1380);
  });

  it('skips disabled charge items', () => {
    const solar: ChargeEquipment = {
      id: 'c1', catalogId: null, name: 'Solar', type: 'charge',
      enabled: false, origin: 'added', notes: '',
      sourceType: 'solar', panelWatts: 400, panelType: 'rigid', regionName: 'Med',
    };
    const result = calculateChargeFromEquipment([solar], {
      peakSunHours: 5, deratingFactor: 0.75, systemVoltage: 12, acCircuitVoltage: 220,
    });
    expect(result.totalWhPerDay).toBe(0);
  });
});

describe('calculateStorageFromEquipment', () => {
  it('calculates usable capacity for LiFePO4', () => {
    const battery: StoreEquipment = {
      id: 's1', catalogId: null, name: 'Battery', type: 'store',
      enabled: true, origin: 'stock', notes: '',
      chemistry: 'lifepo4', capacityAh: 200,
    };
    const result = calculateStorageFromEquipment([battery], 12);
    // 200Ah × 12V × 0.8 DoD = 1920 Wh
    expect(result.totalUsableWh).toBe(1920);
    expect(result.totalCapacityAh).toBe(200);
  });

  it('calculates usable capacity for AGM', () => {
    const battery: StoreEquipment = {
      id: 's1', catalogId: null, name: 'Battery', type: 'store',
      enabled: true, origin: 'stock', notes: '',
      chemistry: 'agm', capacityAh: 400,
    };
    const result = calculateStorageFromEquipment([battery], 12);
    // 400Ah × 12V × 0.5 DoD = 2400 Wh
    expect(result.totalUsableWh).toBe(2400);
    expect(result.totalCapacityAh).toBe(400);
  });

  it('sums multiple battery banks', () => {
    const banks: StoreEquipment[] = [
      { id: 's1', catalogId: null, name: 'Bank 1', type: 'store', enabled: true, origin: 'stock', notes: '', chemistry: 'lifepo4', capacityAh: 100 },
      { id: 's2', catalogId: null, name: 'Bank 2', type: 'store', enabled: true, origin: 'added', notes: '', chemistry: 'lifepo4', capacityAh: 100 },
    ];
    const result = calculateStorageFromEquipment(banks, 12);
    // (100 + 100) × 12 × 0.8 = 1920
    expect(result.totalUsableWh).toBe(1920);
    expect(result.totalCapacityAh).toBe(200);
  });

  it('calculates days of autonomy', () => {
    const battery: StoreEquipment = {
      id: 's1', catalogId: null, name: 'Battery', type: 'store',
      enabled: true, origin: 'stock', notes: '',
      chemistry: 'lifepo4', capacityAh: 200,
    };
    const result = calculateStorageFromEquipment([battery], 12, 500);
    // 1920 Wh / 500 Wh/day = 3.84 days
    expect(result.daysAutonomy).toBeCloseTo(3.84, 1);
  });

  it('handles zero drain gracefully', () => {
    const battery: StoreEquipment = {
      id: 's1', catalogId: null, name: 'Battery', type: 'store',
      enabled: true, origin: 'stock', notes: '',
      chemistry: 'lifepo4', capacityAh: 200,
    };
    const result = calculateStorageFromEquipment([battery], 12, 0);
    expect(result.daysAutonomy).toBe(Infinity);
  });

  it('skips disabled banks', () => {
    const battery: StoreEquipment = {
      id: 's1', catalogId: null, name: 'Battery', type: 'store',
      enabled: false, origin: 'stock', notes: '',
      chemistry: 'lifepo4', capacityAh: 200,
    };
    const result = calculateStorageFromEquipment([battery], 12);
    expect(result.totalUsableWh).toBe(0);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd packages/web && npx vitest run src/lib/solar/__tests__/equipment-calc.test.ts`
Expected: FAIL — module doesn't exist yet

**Step 3: Implement the calculation functions**

Create `packages/web/src/lib/solar/equipment-calc.ts`:

```typescript
import type { DrainEquipment, ChargeEquipment, StoreEquipment, PanelType } from './types';

const INVERTER_EFFICIENCY = 0.85;
const ALTERNATOR_EFFICIENCY = 0.7;
const DOD: Record<string, number> = { agm: 0.5, lifepo4: 0.8 };
const PANEL_FACTOR: Record<PanelType, number> = { rigid: 1.0, 'semi-flexible': 0.9, flexible: 0.85 };

export interface DrainResult {
  totalWhPerDay: number;
  breakdownByCategory: Record<string, number>;
}

export function calculateDrainFromEquipment(
  items: DrainEquipment[],
  viewMode: 'anchor' | 'passage',
  crewSize: number,
): DrainResult {
  const breakdown: Record<string, number> = {};
  let total = 0;

  for (const item of items) {
    if (!item.enabled) continue;
    const hours = viewMode === 'anchor' ? item.hoursPerDayAnchor : item.hoursPerDayPassage;
    const crewMultiplier = item.crewScaling ? crewSize / 2 : 1;
    const inverterFactor = item.powerType === 'ac' ? 1 / INVERTER_EFFICIENCY : 1;
    const wh = Math.round(item.wattsTypical * hours * item.dutyCycle * crewMultiplier * inverterFactor);
    breakdown[item.category] = (breakdown[item.category] ?? 0) + wh;
    total += wh;
  }

  return { totalWhPerDay: total, breakdownByCategory: breakdown };
}

export interface ChargeResult {
  totalWhPerDay: number;
  solarWhPerDay: number;
  alternatorWhPerDay: number;
  shoreWhPerDay: number;
}

interface ChargeContext {
  peakSunHours: number;
  deratingFactor: number;
  systemVoltage: number;
  acCircuitVoltage: number;
}

export function calculateChargeFromEquipment(
  items: ChargeEquipment[],
  ctx: ChargeContext,
): ChargeResult {
  let solarWhPerDay = 0;
  let alternatorWhPerDay = 0;
  let shoreWhPerDay = 0;

  for (const item of items) {
    if (!item.enabled) continue;

    switch (item.sourceType) {
      case 'solar': {
        const panelFactor = PANEL_FACTOR[item.panelType ?? 'rigid'];
        solarWhPerDay += Math.round(
          (item.panelWatts ?? 0) * ctx.peakSunHours * ctx.deratingFactor * panelFactor
        );
        break;
      }
      case 'alternator': {
        alternatorWhPerDay += Math.round(
          (item.alternatorAmps ?? 0) * ctx.systemVoltage * (item.motoringHoursPerDay ?? 0) * ALTERNATOR_EFFICIENCY
        );
        break;
      }
      case 'shore': {
        shoreWhPerDay += Math.round(
          (item.shoreChargerAmps ?? 0) * ctx.systemVoltage * (item.shoreHoursPerDay ?? 0)
        );
        break;
      }
    }
  }

  return {
    totalWhPerDay: solarWhPerDay + alternatorWhPerDay + shoreWhPerDay,
    solarWhPerDay,
    alternatorWhPerDay,
    shoreWhPerDay,
  };
}

export interface StorageResult {
  totalCapacityAh: number;
  totalUsableWh: number;
  daysAutonomy: number;
}

export function calculateStorageFromEquipment(
  items: StoreEquipment[],
  systemVoltage: number,
  dailyDrainWh: number = 0,
): StorageResult {
  let totalCapacityAh = 0;
  let totalUsableWh = 0;

  for (const item of items) {
    if (!item.enabled) continue;
    const dod = DOD[item.chemistry] ?? 0.5;
    totalCapacityAh += item.capacityAh;
    totalUsableWh += item.capacityAh * systemVoltage * dod;
  }

  const daysAutonomy = dailyDrainWh > 0 ? totalUsableWh / dailyDrainWh : Infinity;

  return { totalCapacityAh, totalUsableWh, daysAutonomy };
}
```

**Step 4: Run tests to verify they pass**

Run: `cd packages/web && npx vitest run src/lib/solar/__tests__/equipment-calc.test.ts`
Expected: PASS (17 tests)

**Step 5: Run full test suite**

Run: `cd packages/web && npx vitest run`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add packages/web/src/lib/solar/equipment-calc.ts packages/web/src/lib/solar/__tests__/equipment-calc.test.ts
git commit -m "feat: add equipment-based calculation functions with AC efficiency"
```

---

### Task 4: EquipmentCard Component — Compact Grid Card

**Files:**
- Create: `packages/web/src/components/solar/EquipmentCard.tsx`
- Create: `packages/web/src/components/solar/__tests__/EquipmentCard.test.tsx`

**Context:** A compact card displayed in the equipment grid. Shows name, key stat, toggle, and type-specific summary line. Click opens the drawer (parent handles via `onClick`). Different appearance for drain/charge/store.

**Step 1: Write the failing tests**

Create `packages/web/src/components/solar/__tests__/EquipmentCard.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { EquipmentCard } from '../EquipmentCard';
import type { DrainEquipment, ChargeEquipment, StoreEquipment } from '@/lib/solar/types';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

const drain: DrainEquipment = {
  id: 'd1', catalogId: null, name: 'Cabin Fridge', type: 'drain',
  enabled: true, origin: 'stock', notes: '',
  category: 'refrigeration', wattsTypical: 45, wattsMin: 30, wattsMax: 60,
  hoursPerDayAnchor: 24, hoursPerDayPassage: 24, dutyCycle: 0.5,
  crewScaling: false, powerType: 'dc',
};

const solar: ChargeEquipment = {
  id: 'c1', catalogId: null, name: 'Solar Panels', type: 'charge',
  enabled: true, origin: 'added', notes: '',
  sourceType: 'solar', panelWatts: 400, panelType: 'rigid', regionName: 'Mediterranean',
};

const battery: StoreEquipment = {
  id: 's1', catalogId: null, name: 'Battery Bank', type: 'store',
  enabled: true, origin: 'stock', notes: '',
  chemistry: 'lifepo4', capacityAh: 200,
};

describe('EquipmentCard', () => {
  it('renders drain card with name and summary', () => {
    render(<EquipmentCard item={drain} whPerDay={540} onClick={vi.fn()} onToggle={vi.fn()} />, { wrapper });
    expect(screen.getByText('Cabin Fridge')).toBeTruthy();
    expect(screen.getByText(/45W/)).toBeTruthy();
    expect(screen.getByText(/540 Wh/)).toBeTruthy();
  });

  it('renders charge card with source info', () => {
    render(<EquipmentCard item={solar} whPerDay={1500} onClick={vi.fn()} onToggle={vi.fn()} />, { wrapper });
    expect(screen.getByText('Solar Panels')).toBeTruthy();
    expect(screen.getByText(/400W/)).toBeTruthy();
  });

  it('renders store card with capacity', () => {
    render(<EquipmentCard item={battery} whPerDay={0} onClick={vi.fn()} onToggle={vi.fn()} />, { wrapper });
    expect(screen.getByText('Battery Bank')).toBeTruthy();
    expect(screen.getByText(/200Ah/)).toBeTruthy();
    expect(screen.getByText(/LiFePO4/i)).toBeTruthy();
  });

  it('calls onClick when card is clicked', () => {
    const onClick = vi.fn();
    render(<EquipmentCard item={drain} whPerDay={540} onClick={onClick} onToggle={vi.fn()} />, { wrapper });
    fireEvent.click(screen.getByText('Cabin Fridge'));
    expect(onClick).toHaveBeenCalled();
  });

  it('calls onToggle when switch is clicked', () => {
    const onToggle = vi.fn();
    render(<EquipmentCard item={drain} whPerDay={540} onClick={vi.fn()} onToggle={onToggle} />, { wrapper });
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);
    expect(onToggle).toHaveBeenCalled();
  });

  it('shows Stock badge for stock items', () => {
    render(<EquipmentCard item={drain} whPerDay={540} onClick={vi.fn()} onToggle={vi.fn()} />, { wrapper });
    expect(screen.getByText('Stock')).toBeTruthy();
  });

  it('shows Added badge for added items', () => {
    render(<EquipmentCard item={solar} whPerDay={1500} onClick={vi.fn()} onToggle={vi.fn()} />, { wrapper });
    expect(screen.getByText('Added')).toBeTruthy();
  });

  it('dims disabled items', () => {
    const disabled = { ...drain, enabled: false };
    const { container } = render(
      <EquipmentCard item={disabled} whPerDay={0} onClick={vi.fn()} onToggle={vi.fn()} />,
      { wrapper }
    );
    const card = container.querySelector('[data-equipment-card]');
    expect(card?.getAttribute('style')).toContain('opacity');
  });

  it('shows AC badge for AC items', () => {
    const acDrain = { ...drain, powerType: 'ac' as const };
    render(<EquipmentCard item={acDrain} whPerDay={540} onClick={vi.fn()} onToggle={vi.fn()} />, { wrapper });
    expect(screen.getByText('AC')).toBeTruthy();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd packages/web && npx vitest run src/components/solar/__tests__/EquipmentCard.test.tsx`
Expected: FAIL

**Step 3: Implement EquipmentCard**

Create `packages/web/src/components/solar/EquipmentCard.tsx`:

```tsx
import { Badge, Group, Paper, Switch, Text } from '@mantine/core';
import type { EquipmentInstance, DrainEquipment, ChargeEquipment, StoreEquipment } from '@/lib/solar/types';

interface EquipmentCardProps {
  item: EquipmentInstance;
  whPerDay: number;
  onClick: () => void;
  onToggle: () => void;
}

function drainSummary(item: DrainEquipment, whPerDay: number): string {
  return `${item.wattsTypical}W · ${whPerDay} Wh/day`;
}

function chargeSummary(item: ChargeEquipment, whPerDay: number): string {
  switch (item.sourceType) {
    case 'solar':
      return `${item.panelWatts ?? 0}W · ${whPerDay} Wh/day`;
    case 'alternator':
      return `${item.alternatorAmps ?? 0}A · ${whPerDay} Wh/day`;
    case 'shore':
      return `${item.shoreChargerAmps ?? 0}A · ${item.shoreHoursPerDay ?? 0}h · ${whPerDay} Wh/day`;
  }
}

function storeSummary(item: StoreEquipment): string {
  return `${item.chemistry === 'lifepo4' ? 'LiFePO4' : 'AGM'} · ${item.capacityAh}Ah`;
}

export function EquipmentCard({ item, whPerDay, onClick, onToggle }: EquipmentCardProps) {
  const summary = item.type === 'drain'
    ? drainSummary(item, whPerDay)
    : item.type === 'charge'
      ? chargeSummary(item, whPerDay)
      : storeSummary(item);

  return (
    <Paper
      data-equipment-card
      withBorder
      p="sm"
      style={{
        cursor: 'pointer',
        opacity: item.enabled ? 1 : 0.5,
      }}
      onClick={onClick}
    >
      <Group justify="space-between" mb={4}>
        <Group gap="xs">
          <Text size="sm" fw={600}>{item.name}</Text>
          <Badge size="xs" variant="light" color={item.origin === 'stock' ? 'gray' : 'blue'}>
            {item.origin === 'stock' ? 'Stock' : 'Added'}
          </Badge>
          {item.type === 'drain' && item.powerType === 'ac' && (
            <Badge size="xs" variant="outline" color="orange">AC</Badge>
          )}
        </Group>
        <Switch
          size="xs"
          checked={item.enabled}
          onChange={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        />
      </Group>
      <Text size="xs" c="dimmed">{summary}</Text>
    </Paper>
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `cd packages/web && npx vitest run src/components/solar/__tests__/EquipmentCard.test.tsx`
Expected: PASS (9 tests)

**Step 5: Commit**

```bash
git add packages/web/src/components/solar/EquipmentCard.tsx packages/web/src/components/solar/__tests__/EquipmentCard.test.tsx
git commit -m "feat: add EquipmentCard compact grid component"
```

---

### Task 5: EquipmentDrawer Component — Per-Item Configuration

**Files:**
- Create: `packages/web/src/components/solar/EquipmentDrawer.tsx`
- Create: `packages/web/src/components/solar/__tests__/EquipmentDrawer.test.tsx`

**Context:** Right-side Mantine Drawer that shows full configuration for a single equipment instance. Different field sets for drain/charge/store. Shows a live Wh/day calculation at the bottom. Has "Duplicate" and "Remove" buttons in footer.

**Step 1: Write the failing tests**

Create `packages/web/src/components/solar/__tests__/EquipmentDrawer.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { EquipmentDrawer } from '../EquipmentDrawer';
import type { DrainEquipment, ChargeEquipment, StoreEquipment } from '@/lib/solar/types';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

const drain: DrainEquipment = {
  id: 'd1', catalogId: 'fridge-01', name: 'Cabin Fridge', type: 'drain',
  enabled: true, origin: 'stock', notes: '',
  category: 'refrigeration', wattsTypical: 45, wattsMin: 30, wattsMax: 60,
  hoursPerDayAnchor: 24, hoursPerDayPassage: 24, dutyCycle: 0.5,
  crewScaling: false, powerType: 'dc',
};

const solar: ChargeEquipment = {
  id: 'c1', catalogId: null, name: 'Solar Panels', type: 'charge',
  enabled: true, origin: 'added', notes: '',
  sourceType: 'solar', panelWatts: 400, panelType: 'rigid', regionName: 'Mediterranean',
};

const battery: StoreEquipment = {
  id: 's1', catalogId: null, name: 'Battery Bank', type: 'store',
  enabled: true, origin: 'stock', notes: '',
  chemistry: 'lifepo4', capacityAh: 200,
};

describe('EquipmentDrawer', () => {
  const defaultProps = {
    opened: true,
    onClose: vi.fn(),
    onUpdate: vi.fn(),
    onDuplicate: vi.fn(),
    onRemove: vi.fn(),
    viewMode: 'anchor' as const,
    crewSize: 2,
    systemVoltage: 12 as const,
    acCircuitVoltage: 220 as const,
    peakSunHours: 4.5,
    deratingFactor: 0.75,
  };

  it('renders drain fields when item is drain type', () => {
    render(<EquipmentDrawer {...defaultProps} item={drain} />, { wrapper });
    expect(screen.getByText('Cabin Fridge')).toBeTruthy();
    expect(screen.getByText(/Wattage/i)).toBeTruthy();
    expect(screen.getByText(/Hours\/day/i)).toBeTruthy();
    expect(screen.getByText(/Duty cycle/i)).toBeTruthy();
  });

  it('renders solar fields when item is solar charge', () => {
    render(<EquipmentDrawer {...defaultProps} item={solar} />, { wrapper });
    expect(screen.getByText('Solar Panels')).toBeTruthy();
    expect(screen.getByText(/Panel wattage/i)).toBeTruthy();
    expect(screen.getByText(/Panel type/i)).toBeTruthy();
  });

  it('renders store fields when item is store type', () => {
    render(<EquipmentDrawer {...defaultProps} item={battery} />, { wrapper });
    expect(screen.getByText('Battery Bank')).toBeTruthy();
    expect(screen.getByText(/Chemistry/i)).toBeTruthy();
    expect(screen.getByText(/Capacity/i)).toBeTruthy();
  });

  it('shows Duplicate button', () => {
    render(<EquipmentDrawer {...defaultProps} item={drain} />, { wrapper });
    expect(screen.getByText('Duplicate')).toBeTruthy();
  });

  it('shows Disable for stock items, Remove for added items', () => {
    const { rerender } = render(<EquipmentDrawer {...defaultProps} item={drain} />, { wrapper });
    expect(screen.getByText('Disable')).toBeTruthy();

    rerender(
      <MantineProvider>
        <EquipmentDrawer {...defaultProps} item={solar} />
      </MantineProvider>
    );
    expect(screen.getByText('Remove')).toBeTruthy();
  });

  it('calls onDuplicate when Duplicate is clicked', () => {
    const onDuplicate = vi.fn();
    render(<EquipmentDrawer {...defaultProps} item={drain} onDuplicate={onDuplicate} />, { wrapper });
    fireEvent.click(screen.getByText('Duplicate'));
    expect(onDuplicate).toHaveBeenCalled();
  });

  it('calls onRemove when Remove is clicked', () => {
    const onRemove = vi.fn();
    render(<EquipmentDrawer {...defaultProps} item={solar} onRemove={onRemove} />, { wrapper });
    fireEvent.click(screen.getByText('Remove'));
    expect(onRemove).toHaveBeenCalled();
  });

  it('shows live Wh calculation for drain items', () => {
    render(<EquipmentDrawer {...defaultProps} item={drain} />, { wrapper });
    // 45W × 24h × 0.5 duty = 540 Wh/day
    expect(screen.getByText(/540 Wh\/day/)).toBeTruthy();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd packages/web && npx vitest run src/components/solar/__tests__/EquipmentDrawer.test.tsx`
Expected: FAIL

**Step 3: Implement EquipmentDrawer**

Create `packages/web/src/components/solar/EquipmentDrawer.tsx`:

```tsx
import { Badge, Button, Drawer, Group, NumberInput, SegmentedControl, Slider, Stack, Switch, Text, Textarea, Title } from '@mantine/core';
import type { EquipmentInstance, DrainEquipment, ChargeEquipment, StoreEquipment, PanelType } from '@/lib/solar/types';
import { RegionPicker } from './RegionPicker';

const HEADING_FONT = "'Space Mono', monospace";
const INVERTER_EFFICIENCY = 0.85;
const PANEL_FACTOR: Record<PanelType, number> = { rigid: 1.0, 'semi-flexible': 0.9, flexible: 0.85 };
const ALTERNATOR_EFFICIENCY = 0.7;
const DOD: Record<string, number> = { agm: 0.5, lifepo4: 0.8 };

interface EquipmentDrawerProps {
  opened: boolean;
  onClose: () => void;
  item: EquipmentInstance | null;
  onUpdate: (id: string, updates: Partial<EquipmentInstance>) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  viewMode: 'anchor' | 'passage';
  crewSize: number;
  systemVoltage: number;
  acCircuitVoltage: number;
  peakSunHours: number;
  deratingFactor: number;
}

function DrainFields({ item, onUpdate, viewMode, crewSize }: {
  item: DrainEquipment;
  onUpdate: (updates: Partial<DrainEquipment>) => void;
  viewMode: 'anchor' | 'passage';
  crewSize: number;
}) {
  const hoursKey = viewMode === 'anchor' ? 'hoursPerDayAnchor' : 'hoursPerDayPassage';
  const hours = viewMode === 'anchor' ? item.hoursPerDayAnchor : item.hoursPerDayPassage;
  const crewMultiplier = item.crewScaling ? crewSize / 2 : 1;
  const inverterFactor = item.powerType === 'ac' ? 1 / INVERTER_EFFICIENCY : 1;
  const whPerDay = Math.round(item.wattsTypical * hours * item.dutyCycle * crewMultiplier * inverterFactor);

  return (
    <Stack gap="md">
      <NumberInput
        label={`Wattage (${item.wattsMin}–${item.wattsMax}W)`}
        value={item.wattsTypical}
        onChange={(val) => onUpdate({ wattsTypical: Number(val) || 0 })}
        min={0} max={5000} suffix="W"
      />

      <div>
        <Text size="sm" fw={500} mb={4}>Hours/day ({viewMode})</Text>
        <Slider
          value={hours}
          onChange={(val) => onUpdate({ [hoursKey]: val })}
          min={0} max={24} step={0.5}
          marks={[{ value: 0, label: '0' }, { value: 12, label: '12' }, { value: 24, label: '24' }]}
        />
        <Text size="xs" c="dimmed" mt={4}>{hours}h/day</Text>
      </div>

      <NumberInput
        label="Duty cycle"
        value={item.dutyCycle}
        onChange={(val) => onUpdate({ dutyCycle: Number(val) || 0 })}
        min={0} max={1} step={0.05} decimalScale={2}
      />

      <Group>
        <Switch
          label="Crew scaling"
          checked={item.crewScaling}
          onChange={(e) => onUpdate({ crewScaling: e.currentTarget.checked })}
        />
        {item.crewScaling && <Text size="xs" c="dimmed">× {crewSize} crew</Text>}
      </Group>

      {item.powerType === 'ac' && (
        <Text size="xs" c="orange">AC item — includes {Math.round((1 / INVERTER_EFFICIENCY - 1) * 100)}% inverter loss</Text>
      )}

      <Text size="sm" fw={600}>This item uses {whPerDay} Wh/day at {viewMode}</Text>
    </Stack>
  );
}

function ChargeFields({ item, onUpdate, systemVoltage, acCircuitVoltage, peakSunHours, deratingFactor }: {
  item: ChargeEquipment;
  onUpdate: (updates: Partial<ChargeEquipment>) => void;
  systemVoltage: number;
  acCircuitVoltage: number;
  peakSunHours: number;
  deratingFactor: number;
}) {
  let whPerDay = 0;

  if (item.sourceType === 'solar') {
    const pf = PANEL_FACTOR[item.panelType ?? 'rigid'];
    whPerDay = Math.round((item.panelWatts ?? 0) * peakSunHours * deratingFactor * pf);
  } else if (item.sourceType === 'alternator') {
    whPerDay = Math.round((item.alternatorAmps ?? 0) * systemVoltage * (item.motoringHoursPerDay ?? 0) * ALTERNATOR_EFFICIENCY);
  } else if (item.sourceType === 'shore') {
    whPerDay = Math.round((item.shoreChargerAmps ?? 0) * systemVoltage * (item.shoreHoursPerDay ?? 0));
  }

  return (
    <Stack gap="md">
      {item.sourceType === 'solar' && (
        <>
          <NumberInput
            label="Panel wattage"
            value={item.panelWatts ?? 0}
            onChange={(val) => onUpdate({ panelWatts: Number(val) || 0 })}
            min={0} max={3000} step={50} suffix="W"
          />
          <div>
            <Text size="sm" fw={500} mb={4}>Panel type</Text>
            <SegmentedControl
              fullWidth
              value={item.panelType ?? 'rigid'}
              onChange={(val) => onUpdate({ panelType: val as PanelType })}
              data={[
                { label: 'Rigid', value: 'rigid' },
                { label: 'Semi-flex', value: 'semi-flexible' },
                { label: 'Flexible', value: 'flexible' },
              ]}
            />
          </div>
          <RegionPicker />
        </>
      )}

      {item.sourceType === 'alternator' && (
        <>
          <NumberInput
            label="Alternator amps"
            value={item.alternatorAmps ?? 0}
            onChange={(val) => onUpdate({ alternatorAmps: Number(val) || 0 })}
            min={0} max={300}
          />
          <NumberInput
            label="Motoring hours/day"
            value={item.motoringHoursPerDay ?? 0}
            onChange={(val) => onUpdate({ motoringHoursPerDay: Number(val) || 0 })}
            min={0} max={24} step={0.5} decimalScale={1}
          />
        </>
      )}

      {item.sourceType === 'shore' && (
        <>
          <NumberInput
            label="Shore power hours/day"
            value={item.shoreHoursPerDay ?? 0}
            onChange={(val) => onUpdate({ shoreHoursPerDay: Number(val) || 0 })}
            min={0} max={24} step={0.5} decimalScale={1}
          />
          <NumberInput
            label="Shore charger amps"
            value={item.shoreChargerAmps ?? 0}
            onChange={(val) => onUpdate({ shoreChargerAmps: Number(val) || 0 })}
            min={0} max={100}
          />
        </>
      )}

      <Text size="sm" fw={600}>This source provides {whPerDay} Wh/day</Text>
    </Stack>
  );
}

function StoreFields({ item, onUpdate, systemVoltage, dailyDrainWh }: {
  item: StoreEquipment;
  onUpdate: (updates: Partial<StoreEquipment>) => void;
  systemVoltage: number;
  dailyDrainWh?: number;
}) {
  const dod = DOD[item.chemistry] ?? 0.5;
  const usableWh = item.capacityAh * systemVoltage * dod;
  const days = dailyDrainWh && dailyDrainWh > 0 ? usableWh / dailyDrainWh : 0;

  return (
    <Stack gap="md">
      <div>
        <Text size="sm" fw={500} mb={4}>Chemistry</Text>
        <SegmentedControl
          fullWidth
          value={item.chemistry}
          onChange={(val) => onUpdate({ chemistry: val as 'agm' | 'lifepo4' })}
          data={[
            { label: 'AGM', value: 'agm' },
            { label: 'LiFePO4', value: 'lifepo4' },
          ]}
        />
      </div>

      <NumberInput
        label="Capacity (Ah)"
        value={item.capacityAh}
        onChange={(val) => onUpdate({ capacityAh: Number(val) || 0 })}
        min={0} max={2000} step={10} suffix="Ah"
      />

      <Text size="sm" fw={600}>
        Usable capacity: {Math.round(usableWh)} Wh ({Math.round(dod * 100)}% DoD)
        {days > 0 && ` · ${days.toFixed(1)} days autonomy`}
      </Text>
    </Stack>
  );
}

export function EquipmentDrawer({
  opened, onClose, item, onUpdate, onDuplicate, onRemove,
  viewMode, crewSize, systemVoltage, acCircuitVoltage, peakSunHours, deratingFactor,
}: EquipmentDrawerProps) {
  if (!item) return null;

  const handleUpdate = (updates: Partial<EquipmentInstance>) => {
    onUpdate(item.id, updates);
  };

  return (
    <Drawer opened={opened} onClose={onClose} position="right" size="md" title={
      <Group gap="xs">
        <Title order={4} ff={HEADING_FONT}>{item.name}</Title>
        <Badge size="sm" variant="light">
          {item.type === 'drain' ? 'Drain' : item.type === 'charge' ? 'Charge' : 'Store'}
        </Badge>
      </Group>
    }>
      <Stack gap="lg" justify="space-between" style={{ minHeight: 'calc(100vh - 120px)' }}>
        <Stack gap="md">
          <Switch
            label="Enabled"
            checked={item.enabled}
            onChange={(e) => handleUpdate({ enabled: e.currentTarget.checked })}
          />

          {item.type === 'drain' && (
            <DrainFields item={item} onUpdate={handleUpdate} viewMode={viewMode} crewSize={crewSize} />
          )}

          {item.type === 'charge' && (
            <ChargeFields
              item={item} onUpdate={handleUpdate}
              systemVoltage={systemVoltage} acCircuitVoltage={acCircuitVoltage}
              peakSunHours={peakSunHours} deratingFactor={deratingFactor}
            />
          )}

          {item.type === 'store' && (
            <StoreFields item={item} onUpdate={handleUpdate} systemVoltage={systemVoltage} />
          )}

          <Textarea
            label="Notes"
            value={item.notes}
            onChange={(e) => handleUpdate({ notes: e.currentTarget.value })}
            placeholder="Your notes about this item..."
            autosize
            minRows={2}
          />
        </Stack>

        <Group justify="space-between">
          <Button variant="light" onClick={onDuplicate}>Duplicate</Button>
          <Button variant="light" color="red" onClick={onRemove}>
            {item.origin === 'stock' ? 'Disable' : 'Remove'}
          </Button>
        </Group>
      </Stack>
    </Drawer>
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `cd packages/web && npx vitest run src/components/solar/__tests__/EquipmentDrawer.test.tsx`
Expected: PASS (8 tests)

**Step 5: Commit**

```bash
git add packages/web/src/components/solar/EquipmentDrawer.tsx packages/web/src/components/solar/__tests__/EquipmentDrawer.test.tsx
git commit -m "feat: add EquipmentDrawer with per-item configuration"
```

---

### Task 6: SummaryBar Component — Sticky Live Stats

**Files:**
- Create: `packages/web/src/components/solar/SummaryBar.tsx`
- Create: `packages/web/src/components/solar/__tests__/SummaryBar.test.tsx`

**Context:** A sticky bar below the boat picker that shows 4 live stats: Daily Drain, Daily Charge, Net Balance, Days Autonomy. Updates reactively from equipment calculations.

**Step 1: Write the failing tests**

Create `packages/web/src/components/solar/__tests__/SummaryBar.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { SummaryBar } from '../SummaryBar';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe('SummaryBar', () => {
  it('displays all four stats', () => {
    render(
      <SummaryBar drainWh={500} chargeWh={800} netBalance={300} daysAutonomy={3.5} />,
      { wrapper }
    );
    expect(screen.getByText(/500 Wh/)).toBeTruthy();
    expect(screen.getByText(/800 Wh/)).toBeTruthy();
    expect(screen.getByText(/\+300 Wh/)).toBeTruthy();
    expect(screen.getByText(/3\.5 days/)).toBeTruthy();
  });

  it('shows green for positive balance', () => {
    render(
      <SummaryBar drainWh={500} chargeWh={800} netBalance={300} daysAutonomy={3.5} />,
      { wrapper }
    );
    const balance = screen.getByText(/\+300 Wh/);
    expect(balance.getAttribute('data-positive')).toBe('true');
  });

  it('shows red for negative balance', () => {
    render(
      <SummaryBar drainWh={800} chargeWh={500} netBalance={-300} daysAutonomy={1.5} />,
      { wrapper }
    );
    const balance = screen.getByText(/-300 Wh/);
    expect(balance.getAttribute('data-positive')).toBe('false');
  });

  it('shows green/amber/red for autonomy levels', () => {
    const { rerender } = render(
      <SummaryBar drainWh={100} chargeWh={100} netBalance={0} daysAutonomy={5} />,
      { wrapper }
    );
    expect(screen.getByText(/5\.0 days/).getAttribute('data-autonomy')).toBe('good');

    rerender(
      <MantineProvider>
        <SummaryBar drainWh={100} chargeWh={100} netBalance={0} daysAutonomy={2} />
      </MantineProvider>
    );
    expect(screen.getByText(/2\.0 days/).getAttribute('data-autonomy')).toBe('warning');

    rerender(
      <MantineProvider>
        <SummaryBar drainWh={100} chargeWh={100} netBalance={0} daysAutonomy={0.5} />
      </MantineProvider>
    );
    expect(screen.getByText(/0\.5 days/).getAttribute('data-autonomy')).toBe('danger');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd packages/web && npx vitest run src/components/solar/__tests__/SummaryBar.test.tsx`
Expected: FAIL

**Step 3: Implement SummaryBar**

Create `packages/web/src/components/solar/SummaryBar.tsx`:

```tsx
import { Group, Paper, Text } from '@mantine/core';

const HEADING_FONT = "'Space Mono', monospace";

interface SummaryBarProps {
  drainWh: number;
  chargeWh: number;
  netBalance: number;
  daysAutonomy: number;
}

function autonomyLevel(days: number): 'good' | 'warning' | 'danger' {
  if (days >= 3) return 'good';
  if (days >= 1) return 'warning';
  return 'danger';
}

const AUTONOMY_COLOR = { good: 'green', warning: 'yellow', danger: 'red' } as const;

export function SummaryBar({ drainWh, chargeWh, netBalance, daysAutonomy }: SummaryBarProps) {
  const isPositive = netBalance >= 0;
  const level = autonomyLevel(daysAutonomy);

  return (
    <Paper withBorder p="xs" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      <Group justify="space-around" gap="xs">
        <div style={{ textAlign: 'center' }}>
          <Text size="xs" c="dimmed" tt="uppercase" ff={HEADING_FONT}>Drain</Text>
          <Text size="sm" fw={700}>{Math.round(drainWh)} Wh</Text>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Text size="xs" c="dimmed" tt="uppercase" ff={HEADING_FONT}>Charge</Text>
          <Text size="sm" fw={700}>{Math.round(chargeWh)} Wh</Text>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Text size="xs" c="dimmed" tt="uppercase" ff={HEADING_FONT}>Balance</Text>
          <Text
            size="sm"
            fw={700}
            c={isPositive ? 'green' : 'red'}
            data-positive={String(isPositive)}
          >
            {isPositive ? '+' : ''}{Math.round(netBalance)} Wh
          </Text>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Text size="xs" c="dimmed" tt="uppercase" ff={HEADING_FONT}>Autonomy</Text>
          <Text
            size="sm"
            fw={700}
            c={AUTONOMY_COLOR[level]}
            data-autonomy={level}
          >
            {daysAutonomy === Infinity ? '∞' : daysAutonomy.toFixed(1)} days
          </Text>
        </div>
      </Group>
    </Paper>
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `cd packages/web && npx vitest run src/components/solar/__tests__/SummaryBar.test.tsx`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add packages/web/src/components/solar/SummaryBar.tsx packages/web/src/components/solar/__tests__/SummaryBar.test.tsx
git commit -m "feat: add SummaryBar sticky stats component"
```

---

### Task 7: AddEquipmentDrawer Component — Catalog Picker

**Files:**
- Create: `packages/web/src/components/solar/AddEquipmentDrawer.tsx`
- Create: `packages/web/src/components/solar/__tests__/AddEquipmentDrawer.test.tsx`

**Context:** A drawer that opens when the user clicks "+ Add equipment" in a group. Shows a searchable list of catalog items pre-filtered to the relevant type (drain/charge/store). Selecting an item adds it to the equipment array and keeps the drawer open on that item's config.

**Step 1: Write the failing tests**

Create `packages/web/src/components/solar/__tests__/AddEquipmentDrawer.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { AddEquipmentDrawer } from '../AddEquipmentDrawer';
import type { Appliance } from '@/lib/solar/types';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

const catalog: Appliance[] = [
  {
    id: 'fridge-01', name: 'Cabin Fridge', category: 'refrigeration',
    wattsTypical: 45, wattsMin: 30, wattsMax: 60,
    hoursPerDayAnchor: 24, hoursPerDayPassage: 24, dutyCycle: 0.5,
    usageType: 'always-on', crewScaling: false, enabled: true, origin: 'catalog',
  },
  {
    id: 'led-01', name: 'LED Cabin Lights', category: 'lighting',
    wattsTypical: 5, wattsMin: 3, wattsMax: 8,
    hoursPerDayAnchor: 6, hoursPerDayPassage: 2, dutyCycle: 1,
    usageType: 'scheduled', crewScaling: false, enabled: true, origin: 'catalog',
  },
];

describe('AddEquipmentDrawer', () => {
  const defaultProps = {
    opened: true,
    onClose: vi.fn(),
    onAdd: vi.fn(),
    catalog,
    filterType: 'drain' as const,
  };

  it('renders catalog items', () => {
    render(<AddEquipmentDrawer {...defaultProps} />, { wrapper });
    expect(screen.getByText('Cabin Fridge')).toBeTruthy();
    expect(screen.getByText('LED Cabin Lights')).toBeTruthy();
  });

  it('filters items by search text', () => {
    render(<AddEquipmentDrawer {...defaultProps} />, { wrapper });
    const search = screen.getByPlaceholderText(/search/i);
    fireEvent.change(search, { target: { value: 'fridge' } });
    expect(screen.getByText('Cabin Fridge')).toBeTruthy();
    expect(screen.queryByText('LED Cabin Lights')).toBeNull();
  });

  it('calls onAdd when an item is clicked', () => {
    const onAdd = vi.fn();
    render(<AddEquipmentDrawer {...defaultProps} onAdd={onAdd} />, { wrapper });
    fireEvent.click(screen.getByText('Cabin Fridge'));
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ name: 'Cabin Fridge' }));
  });

  it('shows charge sources when filterType is charge', () => {
    render(
      <AddEquipmentDrawer {...defaultProps} filterType="charge" />,
      { wrapper }
    );
    expect(screen.getByText('Solar Panels')).toBeTruthy();
    expect(screen.getByText('Engine Alternator')).toBeTruthy();
    expect(screen.getByText('Shore Power')).toBeTruthy();
  });

  it('shows battery option when filterType is store', () => {
    render(
      <AddEquipmentDrawer {...defaultProps} filterType="store" />,
      { wrapper }
    );
    expect(screen.getByText('Battery Bank')).toBeTruthy();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd packages/web && npx vitest run src/components/solar/__tests__/AddEquipmentDrawer.test.tsx`
Expected: FAIL

**Step 3: Implement AddEquipmentDrawer**

Create `packages/web/src/components/solar/AddEquipmentDrawer.tsx`:

```tsx
import { useState } from 'react';
import { Drawer, Paper, Stack, Text, TextInput, Title } from '@mantine/core';
import type { Appliance, ChargeEquipment, StoreEquipment, DrainEquipment, EquipmentInstance } from '@/lib/solar/types';

const HEADING_FONT = "'Space Mono', monospace";

interface AddEquipmentDrawerProps {
  opened: boolean;
  onClose: () => void;
  onAdd: (item: EquipmentInstance) => void;
  catalog: Appliance[];
  filterType: 'drain' | 'charge' | 'store';
}

const CHARGE_TEMPLATES: ChargeEquipment[] = [
  {
    id: '', catalogId: null, name: 'Solar Panels', type: 'charge',
    enabled: true, origin: 'added', notes: '',
    sourceType: 'solar', panelWatts: 200, panelType: 'rigid', regionName: 'Mediterranean',
  },
  {
    id: '', catalogId: null, name: 'Engine Alternator', type: 'charge',
    enabled: true, origin: 'added', notes: '',
    sourceType: 'alternator', alternatorAmps: 75, motoringHoursPerDay: 1.5,
  },
  {
    id: '', catalogId: null, name: 'Shore Power', type: 'charge',
    enabled: true, origin: 'added', notes: '',
    sourceType: 'shore', shoreHoursPerDay: 2, shoreChargerAmps: 30,
  },
];

const STORE_TEMPLATE: StoreEquipment = {
  id: '', catalogId: null, name: 'Battery Bank', type: 'store',
  enabled: true, origin: 'added', notes: '',
  chemistry: 'lifepo4', capacityAh: 200,
};

function catalogToDrain(item: Appliance): DrainEquipment {
  return {
    id: `drain-${item.id}-${Date.now()}`,
    catalogId: item.id,
    name: item.name,
    type: 'drain',
    enabled: true,
    origin: 'added',
    notes: '',
    category: item.category,
    wattsTypical: item.wattsTypical,
    wattsMin: item.wattsMin,
    wattsMax: item.wattsMax,
    hoursPerDayAnchor: item.hoursPerDayAnchor,
    hoursPerDayPassage: item.hoursPerDayPassage,
    dutyCycle: item.dutyCycle,
    crewScaling: item.crewScaling,
    powerType: 'dc',
  };
}

export function AddEquipmentDrawer({ opened, onClose, onAdd, catalog, filterType }: AddEquipmentDrawerProps) {
  const [search, setSearch] = useState('');

  const handleAddDrain = (item: Appliance) => {
    onAdd(catalogToDrain(item));
  };

  const handleAddCharge = (template: ChargeEquipment) => {
    onAdd({ ...template, id: `charge-${template.sourceType}-${Date.now()}` });
  };

  const handleAddStore = () => {
    onAdd({ ...STORE_TEMPLATE, id: `store-${Date.now()}` });
  };

  const filtered = catalog.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Drawer opened={opened} onClose={onClose} position="right" size="md" title={
      <Title order={4} ff={HEADING_FONT}>Add Equipment</Title>
    }>
      <Stack gap="md">
        {filterType === 'drain' && (
          <>
            <TextInput
              placeholder="Search equipment..."
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
            />
            {filtered.map((item) => (
              <Paper
                key={item.id}
                withBorder
                p="sm"
                style={{ cursor: 'pointer' }}
                onClick={() => handleAddDrain(item)}
              >
                <Text size="sm" fw={600}>{item.name}</Text>
                <Text size="xs" c="dimmed">{item.wattsTypical}W · {item.category}</Text>
              </Paper>
            ))}
          </>
        )}

        {filterType === 'charge' && (
          <>
            {CHARGE_TEMPLATES.map((t) => (
              <Paper
                key={t.sourceType}
                withBorder
                p="sm"
                style={{ cursor: 'pointer' }}
                onClick={() => handleAddCharge(t)}
              >
                <Text size="sm" fw={600}>{t.name}</Text>
                <Text size="xs" c="dimmed">
                  {t.sourceType === 'solar' ? `${t.panelWatts}W panels` :
                   t.sourceType === 'alternator' ? `${t.alternatorAmps}A` :
                   `${t.shoreChargerAmps}A charger`}
                </Text>
              </Paper>
            ))}
          </>
        )}

        {filterType === 'store' && (
          <Paper
            withBorder
            p="sm"
            style={{ cursor: 'pointer' }}
            onClick={handleAddStore}
          >
            <Text size="sm" fw={600}>Battery Bank</Text>
            <Text size="xs" c="dimmed">LiFePO4 · 200Ah default</Text>
          </Paper>
        )}
      </Stack>
    </Drawer>
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `cd packages/web && npx vitest run src/components/solar/__tests__/AddEquipmentDrawer.test.tsx`
Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add packages/web/src/components/solar/AddEquipmentDrawer.tsx packages/web/src/components/solar/__tests__/AddEquipmentDrawer.test.tsx
git commit -m "feat: add AddEquipmentDrawer catalog picker"
```

---

### Task 8: Rewrite EnergyPlanner — Boat + Grid + Drawer + Results Layout

**Files:**
- Modify: `packages/web/src/components/solar/EnergyPlanner.tsx`

**Context:** This is the big wiring task. Replace the current section-based layout with the new 3-zone layout: boat bar (with SummaryBar), equipment grid (grouped by type with EquipmentCards), and results dashboard (BalanceSection). The drawer opens when a card is clicked.

**Step 1: Rewrite EnergyPlanner.tsx**

```tsx
import { useMemo, useState } from 'react';
import { Container, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '../MantineProvider';

import { useSolarStore } from '@/stores/solar';
import { REGIONS } from './RegionPicker';
import {
  calculateDrainFromEquipment,
  calculateChargeFromEquipment,
  calculateStorageFromEquipment,
} from '@/lib/solar/equipment-calc';
import type { EquipmentInstance, DrainEquipment, ChargeEquipment, StoreEquipment } from '@/lib/solar/types';

import { BoatSelector } from './BoatSelector';
import { SummaryBar } from './SummaryBar';
import { EquipmentCard } from './EquipmentCard';
import { EquipmentDrawer } from './EquipmentDrawer';
import { AddEquipmentDrawer } from './AddEquipmentDrawer';
import { ConsumptionDonut } from './ConsumptionDonut';
import { RecommendationTiers } from './RecommendationTiers';
import { SaveBar } from './SaveBar';

import { useSolarCalculation } from '@/hooks/use-solar-calculation';

const HEADING_FONT = "'Space Mono', monospace";

function EquipmentGroup({
  title,
  items,
  whPerDayMap,
  onCardClick,
  onToggle,
  onAddClick,
}: {
  title: string;
  items: EquipmentInstance[];
  whPerDayMap: Map<string, number>;
  onCardClick: (id: string) => void;
  onToggle: (id: string) => void;
  onAddClick: () => void;
}) {
  const totalWh = items.reduce((sum, item) => sum + (whPerDayMap.get(item.id) ?? 0), 0);

  return (
    <Stack gap="sm">
      <Title order={4} ff={HEADING_FONT} tt="uppercase" c="dimmed" fz="sm"
        style={{ letterSpacing: '1px', borderBottom: '1px solid var(--mantine-color-default-border)', paddingBottom: 8 }}>
        {title}{totalWh > 0 ? ` — ${Math.round(totalWh)} Wh/day` : ''}
      </Title>
      <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, lg: 4 }}>
        {items.map((item) => (
          <EquipmentCard
            key={item.id}
            item={item}
            whPerDay={whPerDayMap.get(item.id) ?? 0}
            onClick={() => onCardClick(item.id)}
            onToggle={() => onToggle(item.id)}
          />
        ))}
        <Paper
          withBorder
          p="sm"
          style={{ cursor: 'pointer', borderStyle: 'dashed', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 60 }}
          onClick={onAddClick}
        >
          <Text size="sm" c="dimmed">+ Add equipment</Text>
        </Paper>
      </SimpleGrid>
    </Stack>
  );
}

function EnergyPlannerInner() {
  const equipment = useSolarStore((s) => s.equipment);
  const viewMode = useSolarStore((s) => s.viewMode);
  const crewSize = useSolarStore((s) => s.crewSize);
  const systemVoltage = useSolarStore((s) => s.systemVoltage);
  const acCircuitVoltage = useSolarStore((s) => s.acCircuitVoltage);
  const regionName = useSolarStore((s) => s.regionName);
  const deratingFactor = useSolarStore((s) => s.deratingFactor);
  const daysAutonomy = useSolarStore((s) => s.daysAutonomy);
  const batteryChemistry = useSolarStore((s) => s.batteryChemistry);
  const toggleEquipment = useSolarStore((s) => s.toggleEquipment);
  const updateEquipment = useSolarStore((s) => s.updateEquipment);
  const duplicateEquipment = useSolarStore((s) => s.duplicateEquipment);
  const removeEquipment = useSolarStore((s) => s.removeEquipment);
  const addEquipment = useSolarStore((s) => s.addEquipment);
  const setViewMode = useSolarStore((s) => s.setViewMode);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addType, setAddType] = useState<'drain' | 'charge' | 'store' | null>(null);

  const peakSunHours = useMemo(() => {
    const region = REGIONS.find((r) => r.label === regionName);
    return region?.psh ?? 4.5;
  }, [regionName]);

  // Group equipment by type
  const drains = equipment.filter((e): e is DrainEquipment => e.type === 'drain');
  const charges = equipment.filter((e): e is ChargeEquipment => e.type === 'charge');
  const stores = equipment.filter((e): e is StoreEquipment => e.type === 'store');

  // Calculate results
  const drainResult = useMemo(
    () => calculateDrainFromEquipment(drains, viewMode, crewSize),
    [drains, viewMode, crewSize]
  );
  const chargeResult = useMemo(
    () => calculateChargeFromEquipment(charges, { peakSunHours, deratingFactor, systemVoltage, acCircuitVoltage }),
    [charges, peakSunHours, deratingFactor, systemVoltage, acCircuitVoltage]
  );
  const storageResult = useMemo(
    () => calculateStorageFromEquipment(stores, systemVoltage, drainResult.totalWhPerDay),
    [stores, systemVoltage, drainResult.totalWhPerDay]
  );

  // Build per-item Wh/day map for cards
  const whPerDayMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of drains) {
      if (!item.enabled) { map.set(item.id, 0); continue; }
      const hours = viewMode === 'anchor' ? item.hoursPerDayAnchor : item.hoursPerDayPassage;
      const crew = item.crewScaling ? crewSize / 2 : 1;
      const inv = item.powerType === 'ac' ? 1 / 0.85 : 1;
      map.set(item.id, Math.round(item.wattsTypical * hours * item.dutyCycle * crew * inv));
    }
    // Charge items — simplified per-item calc
    for (const item of charges) {
      if (!item.enabled) { map.set(item.id, 0); continue; }
      if (item.sourceType === 'solar') {
        const pf = { rigid: 1.0, 'semi-flexible': 0.9, flexible: 0.85 }[item.panelType ?? 'rigid'];
        map.set(item.id, Math.round((item.panelWatts ?? 0) * peakSunHours * deratingFactor * pf));
      } else if (item.sourceType === 'alternator') {
        map.set(item.id, Math.round((item.alternatorAmps ?? 0) * systemVoltage * (item.motoringHoursPerDay ?? 0) * 0.7));
      } else if (item.sourceType === 'shore') {
        map.set(item.id, Math.round((item.shoreChargerAmps ?? 0) * systemVoltage * (item.shoreHoursPerDay ?? 0)));
      }
    }
    return map;
  }, [drains, charges, viewMode, crewSize, peakSunHours, deratingFactor, systemVoltage]);

  const netBalance = chargeResult.totalWhPerDay - drainResult.totalWhPerDay;
  const selectedItem = equipment.find((e) => e.id === selectedId) ?? null;

  // Legacy hook for recommendation tiers (reuse existing)
  const { recommendation, consumption } = useSolarCalculation(peakSunHours);

  return (
    <>
      <Container size="lg" py="xl" pb={80}>
        <Stack gap="xl">
          {/* Boat Bar */}
          <Stack gap="sm">
            <Title order={2} ff={HEADING_FONT}>Energy Planner</Title>
            <BoatSelector />
          </Stack>

          <SummaryBar
            drainWh={drainResult.totalWhPerDay}
            chargeWh={chargeResult.totalWhPerDay}
            netBalance={netBalance}
            daysAutonomy={storageResult.daysAutonomy === Infinity ? 0 : storageResult.daysAutonomy}
          />

          {/* Equipment Grid */}
          <EquipmentGroup
            title="Drain"
            items={drains}
            whPerDayMap={whPerDayMap}
            onCardClick={setSelectedId}
            onToggle={toggleEquipment}
            onAddClick={() => setAddType('drain')}
          />

          <EquipmentGroup
            title="Charge"
            items={charges}
            whPerDayMap={whPerDayMap}
            onCardClick={setSelectedId}
            onToggle={toggleEquipment}
            onAddClick={() => setAddType('charge')}
          />

          <EquipmentGroup
            title="Store"
            items={stores}
            whPerDayMap={whPerDayMap}
            onCardClick={setSelectedId}
            onToggle={toggleEquipment}
            onAddClick={() => setAddType('store')}
          />

          {/* Results Dashboard */}
          <Stack gap="md">
            <Group justify="space-between" align="center">
              <Title order={3} ff={HEADING_FONT} tt="uppercase" c="dimmed" fz="sm"
                style={{ letterSpacing: '1px', borderBottom: '1px solid var(--mantine-color-default-border)', paddingBottom: 8, flex: 1 }}>
                Results
              </Title>
            </Group>

            <ConsumptionDonut
              breakdown={consumption.breakdownByCategory}
              viewMode={viewMode}
              totalWh={drainResult.totalWhPerDay}
            />

            <RecommendationTiers
              recommendation={recommendation}
              batteryChemistry={batteryChemistry}
            />
          </Stack>
        </Stack>
      </Container>

      {/* Drawers */}
      <EquipmentDrawer
        opened={selectedId !== null}
        onClose={() => setSelectedId(null)}
        item={selectedItem}
        onUpdate={updateEquipment}
        onDuplicate={() => {
          if (selectedId) {
            duplicateEquipment(selectedId);
            setSelectedId(null);
          }
        }}
        onRemove={() => {
          if (selectedId) {
            if (selectedItem?.origin === 'stock') {
              toggleEquipment(selectedId);
            } else {
              removeEquipment(selectedId);
            }
            setSelectedId(null);
          }
        }}
        viewMode={viewMode}
        crewSize={crewSize}
        systemVoltage={systemVoltage}
        acCircuitVoltage={acCircuitVoltage}
        peakSunHours={peakSunHours}
        deratingFactor={deratingFactor}
      />

      <AddEquipmentDrawer
        opened={addType !== null}
        onClose={() => setAddType(null)}
        onAdd={(item) => {
          addEquipment(item);
          setAddType(null);
          setSelectedId(item.id);
        }}
        catalog={[]}
        filterType={addType ?? 'drain'}
      />

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
git commit -m "feat: rewrite EnergyPlanner with boat-centric drawer layout"
```

---

### Task 9: Wire Boat Template → Equipment Array

**Files:**
- Modify: `packages/web/src/hooks/use-boat-appliances.ts`
- Modify: `packages/web/src/components/solar/BoatSelector.tsx`

**Context:** When a user selects a boat template, we need to convert the Supabase appliance data into `EquipmentInstance[]` items (drains + a stock alternator + a stock battery bank) and call `setBoat()` on the store. This bridges the existing boat template data with the new equipment model.

**Step 1: Add a conversion function to use-boat-appliances.ts**

Read the current `use-boat-appliances.ts` to understand the existing `transformToStockAppliances` function, then add a `transformToEquipmentInstances` function that returns `EquipmentInstance[]` including:
- All appliances as `DrainEquipment` (origin: 'stock')
- One `ChargeEquipment` for the alternator (from boat's alternator amps)
- One `StoreEquipment` for the battery bank (from boat's battery capacity and chemistry)

**Step 2: Update BoatSelector to call `setBoat()` with the converted equipment**

When a boat is selected, call `setBoat(templateId, boatName, equipmentInstances, systemVoltage, acCircuitVoltage)` instead of the old `setAppliances()`.

**Step 3: Run full test suite**

Run: `cd packages/web && npx vitest run`
Expected: ALL PASS

**Step 4: Commit**

```bash
git add packages/web/src/hooks/use-boat-appliances.ts packages/web/src/components/solar/BoatSelector.tsx
git commit -m "feat: wire boat template selection to equipment array"
```

---

### Task 10: Add Anchor/Passage Toggle + Crew Size to Boat Bar

**Files:**
- Modify: `packages/web/src/components/solar/EnergyPlanner.tsx`

**Context:** The anchor/passage toggle and crew size input need to be accessible from the main layout (not buried in a drawer). Add them to the boat bar area, between the boat picker and the summary bar.

**Step 1: Add controls**

In `EnergyPlanner.tsx`, between `<BoatSelector />` and `<SummaryBar />`, add:

```tsx
<Group>
  <SegmentedControl
    value={viewMode}
    onChange={(val) => setViewMode(val as 'anchor' | 'passage')}
    data={[
      { label: 'At Anchor', value: 'anchor' },
      { label: 'On Passage', value: 'passage' },
    ]}
  />
  <NumberInput
    label="Crew"
    value={crewSize}
    onChange={(val) => setCrewSize(Number(val) || 2)}
    min={1} max={12} style={{ width: 80 }}
  />
  <SegmentedControl
    value={String(systemVoltage)}
    onChange={(val) => setSystemVoltage(Number(val) as 12 | 24 | 48)}
    data={[
      { label: '12V', value: '12' },
      { label: '24V', value: '24' },
      { label: '48V', value: '48' },
    ]}
  />
  <SegmentedControl
    value={String(acCircuitVoltage)}
    onChange={(val) => setAcCircuitVoltage(Number(val) as 110 | 220)}
    data={[
      { label: '110V AC', value: '110' },
      { label: '220V AC', value: '220' },
    ]}
  />
</Group>
```

**Step 2: Run full test suite**

Run: `cd packages/web && npx vitest run`
Expected: ALL PASS

**Step 3: Commit**

```bash
git add packages/web/src/components/solar/EnergyPlanner.tsx
git commit -m "feat: add anchor/passage toggle, crew size, and voltage controls to boat bar"
```

---

### Task 11: Clean Up — Remove Old Components + Legacy Store Fields

**Files:**
- Delete: `packages/web/src/components/solar/JourneySelector.tsx`
- Delete: `packages/web/src/components/solar/ApplianceCard.tsx`
- Delete: `packages/web/src/components/solar/EquipmentSection.tsx`
- Delete: `packages/web/src/components/solar/ChargingSection.tsx`
- Delete: `packages/web/src/components/solar/StorageSection.tsx`
- Delete: `packages/web/src/components/solar/AddEquipmentModal.tsx`
- Delete: `packages/web/src/components/solar/__tests__/JourneySelector.test.tsx`
- Delete: `packages/web/src/components/solar/__tests__/ApplianceCard.test.tsx`
- Delete: `packages/web/src/components/solar/__tests__/StorageSection.test.tsx`
- Verify: no remaining imports of deleted components

**Context:** These components are replaced by EquipmentCard, EquipmentDrawer, AddEquipmentDrawer, and SummaryBar. The legacy store fields should also be removed once all component references are gone.

**Step 1: Verify no imports remain**

Run: `grep -r "JourneySelector\|ApplianceCard\|EquipmentSection\|ChargingSection\|StorageSection\|AddEquipmentModal" packages/web/src/ --include="*.tsx" --include="*.ts" -l`

Only the files themselves and their tests should appear. If EnergyPlanner.tsx still imports any, that's a bug — fix it first.

**Step 2: Delete the files**

```bash
rm packages/web/src/components/solar/JourneySelector.tsx
rm packages/web/src/components/solar/ApplianceCard.tsx
rm packages/web/src/components/solar/EquipmentSection.tsx
rm packages/web/src/components/solar/ChargingSection.tsx
rm packages/web/src/components/solar/StorageSection.tsx
rm packages/web/src/components/solar/AddEquipmentModal.tsx
rm packages/web/src/components/solar/__tests__/JourneySelector.test.tsx
rm packages/web/src/components/solar/__tests__/ApplianceCard.test.tsx
rm packages/web/src/components/solar/__tests__/StorageSection.test.tsx
```

**Step 3: Remove legacy fields from store**

Edit `packages/web/src/stores/solar.ts`:
- Remove all `@deprecated` fields from `SolarState`
- Remove all legacy actions from `SolarActions`
- Remove legacy fields from `initialState`
- Remove legacy fields from `partialize`
- Update `stores/__tests__/solar.test.ts` to remove any tests referencing legacy fields

**Step 4: Run full test suite**

Run: `cd packages/web && npx vitest run`
Expected: ALL PASS (test count will drop since we removed old test files)

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove replaced components and legacy store fields"
```

---

### Task 12: Update Existing Tests for New Architecture

**Files:**
- Modify: `packages/web/src/hooks/__tests__/use-solar-calculation.test.ts`
- Modify: `packages/web/src/lib/solar/__tests__/engine.test.ts`

**Context:** The existing engine and hook tests reference the old `Appliance` type. Update them to use the new `DrainEquipment` type where needed, or keep them if the old functions are still used. At minimum, ensure all tests pass with the current types.

**Step 1: Run full test suite and fix any failures**

Run: `cd packages/web && npx vitest run`
Fix any type errors or import failures caused by the cleanup in Task 11.

**Step 2: Commit**

```bash
git add -A
git commit -m "test: update existing tests for v3 architecture"
```

---

### Task 13: Visual Verification

**Files:** None (manual verification)

**Step 1: Start the dev server**

```bash
cd packages/web && npm run dev
```

**Step 2: Open `/tools/solar` and verify:**

- [ ] Boat picker loads at top
- [ ] Selecting a boat populates equipment cards in Drain/Charge/Store groups
- [ ] SummaryBar shows live stats and sticks to top on scroll
- [ ] Clicking an equipment card opens the right-side drawer
- [ ] Drawer shows correct fields for drain/charge/store items
- [ ] Changing values in drawer updates the card and summary bar live
- [ ] Duplicate button creates a copy
- [ ] Remove button removes added items, Disable button disables stock items
- [ ] "+ Add equipment" opens catalog picker drawer
- [ ] Anchor/Passage toggle switches values
- [ ] Crew size, system voltage, AC voltage controls work
- [ ] Results section shows consumption donut and recommendation tiers
- [ ] No console errors

**Step 3: Take screenshots**

Save to `tmp/screenshots/` for review.
