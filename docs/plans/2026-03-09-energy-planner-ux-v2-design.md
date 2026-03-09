# Energy Planner UX Redesign v2 — Design

## Mental Model

Three levers, one live dashboard:

| Lever | Role | Components |
|-------|------|-----------|
| **Equipment** | Drains the tank | Appliance cards with sliders, crew multiplier |
| **Charging** | Fills the tank | Solar panels, alternator, shore power |
| **Storage** | The buffer | Battery bank (chemistry, voltage, capacity) |

Change any input → all outputs update instantly. No "calculate" button.

## Journey Selector

Three journey cards at the top of the page:

| Journey | Who | Days self-sufficient | Battery bank |
|---------|-----|---------------------|-------------|
| **Plan a new system** | New to solar, sizing from scratch | **Input** (goal) — user sets target days | **Output** — tool sizes the bank |
| **Check my existing setup** | Has a boat, exploring what-ifs | **Output** — tool shows how many days | **Input** — user enters their bank |
| **Add or upgrade** | Wants to see impact of changes | Same as "Check existing" but highlights **before/after deltas** when any value changes |

All three land on the same three-lever dashboard. The journey determines:
- Which fields start as inputs vs outputs (storage section)
- Whether delta badges appear (add/upgrade journey)

User can adjust anything regardless of journey.

## Page Structure

### 1. Journey Selector

Three cards in a row, wireframe style. Selecting one configures the dashboard below.

- **Plan a new system** — "Full sizing from scratch — boat, loads, location, complete recommendation"
- **Check my existing setup** — "Enter what you have — see if your solar and batteries are enough"
- **Add or upgrade** — "Adding a watermaker? Switching to lithium? See what changes"

### 2. Your Boat

Minimal — just the boat picker autocomplete. Selecting a boat pre-fills:
- Stock equipment (loaded into Equipment section)
- Factory alternator amps
- Factory battery bank (loaded into Storage section in "existing" mode)
- System voltage

No crew, no days self-sufficient here. Those belong with their respective levers.

### 3. Equipment — Drain

Section header shows live total: "Equipment — 1,467 Wh/day"

**Controls at top:**
- **Crew size** — stepper (1-12). Scaling factor for crew-dependent appliances (water pump, device charging, electric toilet). Displayed here because it's a drain multiplier.
- **Anchor / Passage toggle** — switches which hours/day values show for each appliance card
- **Category filter chips** — All, Navigation, Communication, Refrigeration, Lighting, Water Systems, Comfort/Galley, Charging, Sailing/Safety

**Appliance cards** in a responsive grid (4 columns desktop, 2 tablet, 1 mobile):
- Name + on/off toggle
- Stock/Added badge (stock items can be disabled but not removed)
- Wattage: "15W typical (7–20W)"
- Slider for hours/day (0–24h)
- Crew-scaled items show "× N crew" and have a visual indicator (blue left border)

**"+ Add equipment"** card opens catalog picker modal.

### 4. Charging — Fill

Section header shows live total: "Charging — 1,800 Wh/day"

**Solar:**
- Panel wattage total (NumberInput, e.g. 400W)
- Panel type: Rigid / Semi-flexible / Flexible (affects derating factor)
- Cruising region picker (sets peak sun hours)
- Calculated: "Estimated solar: 1,440 Wh/day"

**Alternator:**
- Alternator amps (pre-filled from boat)
- Motoring hours/day (NumberInput)

**Shore power:**
- Hours:mins per day (e.g. "2:30" = 2.5 hours plugged in daily)
- Charger amps (pre-filled or editable)

### 5. Storage — Buffer

Behaviour depends on journey:

**Planning mode** (Plan a new system):
- Battery chemistry: AGM / LiFePO4 (segmented control)
- System voltage: 12V / 24V / 48V (segmented control)
- Target days self-sufficient: NumberInput (1–14, default 3)
- **Output:** Recommended bank size (Ah), calculated from: `daily drain × target days / usable DoD`
- Shows min / recommended / comfortable tiers

**Existing mode** (Check existing / Add or upgrade):
- Battery chemistry: AGM / LiFePO4
- System voltage: 12V / 24V / 48V
- Bank capacity: NumberInput (Ah) — pre-filled from boat or user-entered
- **Output:** Days of autonomy, calculated from: `bank usable capacity / daily drain`
- Status indicator: green (3+ days) / amber (1-3 days) / red (< 1 day)

### 6. Balance — Live Summary

**Summary cards** (4 across):
- Daily charging (Wh)
- Daily draw (Wh)
- Net balance (+/- Wh) — green if surplus, red if deficit
- Status — Surplus / Deficit / Balanced

**Consumption donut** by category.

**Recommendation tiers** (min / recommended / comfortable) — solar panels, MPPT, battery bank, inverter, wiring gauge.

**Delta badges** (Add/upgrade journey only): When a value changes, show "+200W solar → +720 Wh/day generation" style annotations.

## Visual Style

Match the wireframe aesthetic — clean, technical, draughtsman-like:

- Background: light grey (`#f0f0f0`)
- Sections: white cards with subtle `#ccc` borders, `border-radius: 4px`
- Section headers: numbered, uppercase, `letter-spacing: 1px`, grey text, bottom border
- Appliance cards: clean borders, toggle + slider, no heavy shadows
- Typography: Space Mono for headings, Inter for body (per brand guidelines)
- Generous whitespace between sections
- Dark mode: same structure, colours from brand palette (deep navy background, midnight blue surfaces)
- No decorative elements — every visual element serves a function

## Calculation Engine

```
DRAIN = Σ(appliance.watts × hours/day × duty_cycle × crew_multiplier)
        for each enabled appliance

FILL  = solar_wh + alternator_wh + shore_wh
  solar_wh      = panel_watts × peak_sun_hours × derating_factor
  alternator_wh = alternator_amps × system_voltage × motoring_hours × 0.7
  shore_wh      = charger_amps × system_voltage × shore_hours_per_day

BUFFER:
  usable_capacity = bank_ah × system_voltage × DoD_factor
    DoD_factor: AGM = 0.5, LiFePO4 = 0.8

  Planning mode:  bank_ah = (daily_drain × target_days) / (system_voltage × DoD_factor)
  Existing mode:  days_autonomy = usable_capacity / daily_drain

NET BALANCE = FILL - DRAIN
```

## Data Model Changes from v1

- **Add:** `journeyType: 'plan' | 'check' | 'upgrade'` to store
- **Move:** `crewSize` conceptually belongs with equipment (drain multiplier)
- **Replace:** `shorepower: 'no' | 'sometimes' | 'often'` → `shorePowerHoursPerDay: number` + `shoreChargerAmps: number`
- **Add:** `targetDaysAutonomy: number` (planning mode input)
- **Add:** `batteryBankAh: number` (existing mode input)
- **Appliance cards** need slider state (hours/day per appliance, already stored)

## Components

### Reuse (with visual restyling)
- BoatSelector (autocomplete)
- RegionPicker (moves to Charging)
- ConsumptionDonut (moves to Balance)
- RecommendationTiers (moves to Balance)
- SaveBar (sticky bottom)

### New
- **JourneySelector** — three selectable cards
- **ApplianceCard** — replaces EquipmentRow; card with toggle, wattage display, hours slider
- **ApplianceGrid** — responsive grid of ApplianceCards with category filters
- **HoursSlider** — slider component for 0–24h with current value display
- **DeltaBadge** — shows before/after change annotation (upgrade journey)
- **ShorePowerInput** — hours:mins time input

### Restyle
- All section containers: white cards on grey background, numbered headers
- EquipmentSection: grid of cards instead of table
- ChargingSection: shore power becomes time input
- StorageSection: dual-mode (planning vs existing)
- BalanceSection: add delta badges for upgrade journey

## What's Deferred

- Mapbox visual region picker (use existing dropdown for now)
- System schematic / wiring diagram
- 24-hour energy flow chart
- Monthly generation chart
- Multi-location comparison
- "What if?" panel (partially addressed by Add/upgrade journey + delta badges)
- Share link functionality
