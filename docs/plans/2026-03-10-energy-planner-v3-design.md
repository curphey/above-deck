# Energy Planner v3 — Drawer-Based Design

## Mental Model

A **boat** is the top-level object. A boat contains a collection of **equipment instances**, each categorized as drain, charge, or store. Users load a template boat (pre-filled equipment) or start blank and build up. All results update live as equipment is added, removed, or configured.

No journey selector. No modes. One view that shows everything: what you have, what it costs, what it generates, and what you'd need.

## Page Layout

Three zones, top to bottom:

| Zone | Content | Behaviour |
|------|---------|-----------|
| **Boat bar** | Boat picker + sticky summary stats | Sticks to top on scroll |
| **Equipment grid** | Compact cards grouped by type (Drain, Charge, Store). Click opens drawer. | Scrollable middle |
| **Results dashboard** | Balance cards, donut, recommendations | Bottom of page |

### Boat Bar

**Boat picker** is the entry point. Select a template → equipment grid pre-fills with stock items. Start blank → empty grid with "+ Add" buttons.

**Boat-level settings** (shown inline or in a boat config drawer):
- System voltage: 12V / 24V / 48V (DC)
- AC circuit voltage: 110V / 220V
- Crew size (drain multiplier)

**Sticky summary bar** shows 4 numbers that update live:
- Daily Drain (Wh)
- Daily Charge (Wh)
- Net Balance (+/- Wh) — green if surplus, red if deficit
- Days Autonomy — green (3+) / amber (1-3) / red (<1)

### Equipment Grid

Cards grouped under section headers: **Drain**, **Charge**, **Store**. Each header shows the group total (e.g. "Drain — 1,467 Wh/day").

**Drain card:**
```
┌─────────────────────────┐
│ ○ Cabin Fridge      [on] │
│ 45W · 24h/day · 540 Wh  │
└─────────────────────────┘
```

**Charge card:**
```
┌─────────────────────────┐
│ ○ Solar Panels     [on] │
│ 400W · 4.5 PSH · 1,440 Wh │
└─────────────────────────┘
```

**Store card:**
```
┌─────────────────────────┐
│ ○ Battery Bank     [on] │
│ LiFePO4 · 200Ah · 12V   │
└─────────────────────────┘
```

Card details:
- Name + on/off toggle (right side)
- One-line summary: key stat + daily Wh contribution
- Stock items show subtle "Stock" badge; user-added show "Added"
- Crew-scaled items show small crew icon
- Disabled items dim to ~50% opacity
- AC items show a small "AC" badge
- Click anywhere → opens drawer

**"+ Add equipment"** button at the end of each group (dashed-border card). Opens drawer with catalog picker pre-filtered to that category.

Users can add duplicates (e.g. two fridges) — each is a separate instance with its own config.

### Equipment Drawer

Right-side drawer (`position="right"`). Opens on card click. All changes apply live — no save button.

**Header:** Item name + category badge (Drain/Charge/Store) + close button

**Common fields (all types):**
- Name (editable for custom items, read-only for catalog)
- On/off toggle
- Notes (optional, user reference)

**Drain-specific fields:**
- Wattage: "45W typical (30–60W)" with NumberInput for override
- Hours/day: Slider (0–24h) with anchor/passage segmented control
- Duty cycle: percentage
- Crew scaling: toggle + multiplier display ("× 4 crew")
- Power type: DC / AC badge (AC items note inverter efficiency loss)
- **Live calc:** "This item uses **540 Wh/day** at anchor"

**Charge-specific fields (vary by source type):**
- **Solar:** Panel wattage, panel type (rigid/semi-flex/flexible), region picker (sets PSH)
- **Alternator:** Amps, motoring hours/day
- **Shore power:** Hours/day, charger amps (uses boat's AC voltage for calculation)
- **Live calc:** "This source provides **1,440 Wh/day**"

**Store-specific fields:**
- Chemistry: AGM / LiFePO4
- Capacity (Ah)
- Uses boat's system voltage for calculations
- **Live calc:** "Usable capacity: **1,920 Wh** (80% DoD) · **2.1 days autonomy**"

**Footer:** "Duplicate" button + "Remove" button (stock items show "Disable" instead)

### Results Dashboard

**Anchor / Passage toggle** at top — switches all hours/day values and recalculates.

**Summary cards** (4 across):
- Daily Charge (Wh)
- Daily Drain (Wh)
- Net Balance (+/- Wh) — green/red
- Days Autonomy — green (3+) / amber (1-3) / red (<1)

**Consumption donut** — breakdown by category.

**Recommendation tiers** — min / recommended / comfortable for: solar panels, battery bank, MPPT, inverter, wiring gauge. Always visible — shows both what you have and what you'd need.

## Data Model

### Boat (top-level)

```typescript
interface Boat {
  id: string;
  templateId: string | null;     // null for custom boats
  name: string;
  systemVoltage: 12 | 24 | 48;
  acCircuitVoltage: 110 | 220;
  crewSize: number;
  equipment: EquipmentInstance[];
}
```

### Equipment Instance

```typescript
interface EquipmentBase {
  id: string;                     // unique per instance
  catalogId: string | null;       // null for custom items
  name: string;
  type: 'drain' | 'charge' | 'store';
  enabled: boolean;
  origin: 'stock' | 'added';
  notes: string;
}

interface DrainEquipment extends EquipmentBase {
  type: 'drain';
  category: string;               // Navigation, Refrigeration, etc.
  wattsTypical: number;
  wattsMin: number;
  wattsMax: number;
  hoursPerDayAnchor: number;
  hoursPerDayPassage: number;
  dutyCycle: number;
  crewScaling: boolean;
  powerType: 'dc' | 'ac';
}

interface ChargeEquipment extends EquipmentBase {
  type: 'charge';
  sourceType: 'solar' | 'alternator' | 'shore';
  // Solar
  panelWatts?: number;
  panelType?: 'rigid' | 'semi-flexible' | 'flexible';
  regionName?: string;
  // Alternator
  alternatorAmps?: number;
  motoringHoursPerDay?: number;
  // Shore
  shoreHoursPerDay?: number;
  shoreChargerAmps?: number;
}

interface StoreEquipment extends EquipmentBase {
  type: 'store';
  chemistry: 'agm' | 'lifepo4';
  capacityAh: number;
}

type EquipmentInstance = DrainEquipment | ChargeEquipment | StoreEquipment;
```

### Zustand Store Shape

```typescript
interface SolarStore {
  // Boat
  boatName: string;
  templateId: string | null;
  systemVoltage: 12 | 24 | 48;
  acCircuitVoltage: 110 | 220;
  crewSize: number;
  viewMode: 'anchor' | 'passage';

  // Equipment
  equipment: EquipmentInstance[];

  // Actions
  setBoat: (templateId: string, name: string, equipment: EquipmentInstance[], voltage: number, acVoltage: number) => void;
  setSystemVoltage: (v: 12 | 24 | 48) => void;
  setAcCircuitVoltage: (v: 110 | 220) => void;
  setCrewSize: (n: number) => void;
  setViewMode: (m: 'anchor' | 'passage') => void;
  addEquipment: (item: EquipmentInstance) => void;
  updateEquipment: (id: string, updates: Partial<EquipmentInstance>) => void;
  removeEquipment: (id: string) => void;
  toggleEquipment: (id: string) => void;
  duplicateEquipment: (id: string) => void;
}
```

## Calculation Engine

```
DRAIN = Σ(item.wattsTypical × hours/day × dutyCycle × crewMultiplier × inverterFactor)
        for each enabled drain item
        inverterFactor = item.powerType === 'ac' ? (1 / 0.85) : 1

CHARGE = Σ(sourceWh)
  solar_wh      = panelWatts × peakSunHours × deratingFactor
  alternator_wh = alternatorAmps × systemVoltage × motoringHours × 0.7
  shore_wh      = shoreChargerAmps × acCircuitVoltage × shoreHoursPerDay × chargerEfficiency

STORE:
  usable_capacity = Σ(bank.capacityAh × systemVoltage × dodFactor)
    dodFactor: AGM = 0.5, LiFePO4 = 0.8
  days_autonomy = usable_capacity / daily_drain

NET BALANCE = CHARGE - DRAIN
```

## Components

### New
- **EquipmentCard** — compact card for grid (replaces ApplianceCard)
- **EquipmentDrawer** — right-side drawer with per-item config
- **DrainFields** / **ChargeFields** / **StoreFields** — field sets inside drawer
- **SummaryBar** — sticky bar with 4 live stats
- **AddEquipmentDrawer** — catalog picker in drawer format

### Reuse (restyle)
- **BoatSelector** — autocomplete picker (moves to boat bar)
- **ConsumptionDonut** — breakdown chart
- **RecommendationTiers** — sizing tiers
- **RegionPicker** — moves inside charge drawer for solar items

### Remove
- **JourneySelector** — no longer needed
- **ApplianceCard** — replaced by EquipmentCard
- **HoursSlider** — slider moves inside drawer
- **EquipmentSection** — replaced by equipment grid in main layout
- **ChargingSection** — charging items are now equipment cards
- **StorageSection** — storage items are now equipment cards

## Visual Style

Same wireframe aesthetic as v2 design:
- Light grey background (`#f0f0f0`), white cards with `#ccc` borders
- Space Mono headings, Inter body
- Numbered uppercase section headers with letter-spacing
- Generous whitespace
- Dark mode: deep navy background, midnight blue surfaces

## What's Deferred

- Drag-and-drop dashboard widget layout
- Mapbox visual region picker
- System schematic / wiring diagram
- 24-hour energy flow chart
- Share link functionality
- Multi-location comparison
