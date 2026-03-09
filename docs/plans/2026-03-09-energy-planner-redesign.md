# Energy Planner Redesign — Storage & Drainage Model

## Mental Model

The electrical system is a tank: **charging** fills it, **equipment** drains it, **storage** is the buffer. The page is organised around this taxonomy.

## Page Structure

```
1. YOUR BOAT        — seeds everything below
2. EQUIPMENT        — what drains the tank
3. CHARGING         — what fills the tank
4. STORAGE          — the buffer
5. BALANCE          — daily in vs out, recommendations
```

## Section 1: Your Boat

- **Boat model** — autocomplete search (existing BoatSelector). On selection: loads default appliances from `default_appliance_ids`, sets crewSize, alternatorAmps, systemVoltage.
- **Crew size** — NumberInput (1–12, default 2)
- **Days self-sufficient** — NumberInput (1–14, default 3). Hint text: "Weekend: 2–3 · Coastal: 5–7 · Offshore: 10+". Maps to existing `daysAutonomy` store field.
- **Removes**: `cruisingStyle` (weekend/coastal/offshore) — replaced by days self-sufficient.
- **Removes**: `JourneySelector` (plan new / check existing / upgrade) — deferred to future.

## Section 2: Equipment (drains)

Populated from boat's `default_appliance_ids` on boat selection. Fully editable.

**Table grouped by category**, each row:
- Appliance name
- Source badge: `Stock` (from boat template) or `Added` (user-added)
- Watts (editable)
- Hours/day (editable, switches with anchor/passage toggle)
- Duty cycle
- Daily Wh (calculated)
- Enable/disable toggle
- Remove button (added items only; stock items can be disabled but not removed)

**Controls:**
- Anchor/passage toggle — switches hours/day column values
- Category filter chips (navigation, refrigeration, etc.)
- "Add equipment" button — opens catalog picker (existing power_consumers)
- Section header shows total: "Equipment — 2,400 Wh/day"

## Section 3: Charging (fills)

**Solar:**
- Panel wattage total (NumberInput, e.g., 400W)
- Panel type: Rigid / Semi-flexible / Flexible (affects derating factor)
- Cruising region picker (existing — sets peak sun hours)
- Calculated daily solar input: `panel_watts x peak_sun_hours x derating_factor`

**Alternator:**
- Alternator amps (NumberInput)
- Motoring hours/day (NumberInput)
- Smart regulator toggle

**Shore power:**
- No / Sometimes / Often (existing segmented control)

Section header shows total: "Charging — 1,800 Wh/day"

## Section 4: Storage (buffer)

- Battery chemistry: AGM / LiFePO4 (segmented control)
- System voltage: 12V / 24V / 48V (segmented control)
- Days of autonomy (read-only, mirrors Section 1 value for context)
- Recommended bank size (calculated, read-only)

## Section 5: Balance

- **Summary cards**: Daily charging in, Daily equipment draw, Net balance, Days autonomy at current sizing
- **Consumption donut** by category (existing component)
- **Recommendation tiers**: Minimum / Recommended / Comfortable (existing component)
- For users without panels configured: "You need ~400W to break even in the Mediterranean"

## Data Model Changes

### Appliance type
Add `origin: 'stock' | 'catalog' | 'custom'` to track provenance.

### Solar store
- **Remove**: `cruisingStyle`
- **Add**: `solarPanelWatts` (number, default 0), `panelType` ('rigid' | 'semi-flexible' | 'flexible', default 'rigid')
- `daysAutonomy` becomes primary input in Your Boat section (already exists, default 3)

### New hook
- `useBoatAppliances(boatModelId)` — fetches appliances matching `default_appliance_ids` from power_consumers

## Components Reused
- BoatSelector (as-is)
- RegionPicker (moves to Charging)
- ConsumptionDonut (moves to Balance)
- RecommendationTiers (moves to Balance)
- useSolarCalculation hook (minor updates for new inputs)

## Components Removed
- JourneySelector
- QuickStart (replaced by Your Boat section)
- ResultsBanner (replaced by per-section headers + Balance section)

## Components New
- EquipmentTable — editable appliance list with stock/added badges
- AddEquipmentModal — catalog picker for adding appliances
- ChargingSection — solar, alternator, shore power inputs
- StorageSection — battery config + calculated sizing
- BalanceSection — summary cards + donut + tiers
- YourBoatSection — model, crew, days self-sufficient
