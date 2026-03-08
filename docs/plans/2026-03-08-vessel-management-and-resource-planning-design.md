# Vessel Management & Resource Planning — Design Document

**Date**: 2026-03-08
**Status**: Approved
**Phase**: Phase 2 (parallel development, independent of routing MVP)

## Overview

Three modular features that help sailors manage their boat's equipment and plan resource needs for passages:

1. **Equipment Registry** — Catalog of vessel equipment with service tracking
2. **Energy Planner** — Solar sizing, battery modeling, and generation forecasting
3. **Passage Resource Planner** — Fuel, water, and power projections for planned routes

### Design Principles

- **Progressive disclosure**: Collect and compute at full detail, present a simple view by default, let power users opt into depth
- **Modular**: Each module works independently but gets smarter when connected
- **Template-driven**: Boat models and equipment specs auto-populate from curated databases, reducing manual data entry to near zero
- **Standalone value**: Equipment registry and energy calculators are useful without the routing features, serving as acquisition/marketing tools

---

## Module 1: Equipment Registry

### Boat Model Templates

Users onboard by selecting their boat model (e.g. "Lagoon 43"), which pre-populates the entire equipment registry with factory specs.

**Hierarchy:**

1. **Boat model template** — Full factory equipment list with specs
2. **Known options/upgrades** — e.g. "Engine: Yanmar 4JH45 (standard) or 4JH57 (upgrade)" — user selects which they have
3. **Custom modifications** — User adds equipment not in the template
4. **Override any value** — User adjusts any spec to match their actual setup

**Onboarding flow:**

1. Search/select boat model (or "custom/other")
2. App shows standard equipment list
3. "Does this match your boat?" — user confirms or taps items to change
4. Done — full equipment registry populated

**Template database** seeded with top 30 production boats (Lagoon, Beneteau, Jeanneau, Bavaria, Fountaine Pajot, etc.). Community can submit new models over time.

### Data Model

Equipment items are organized by system: Propulsion, Electrical, Water, Safety, Navigation, Rigging, Plumbing, Other.

**Core fields (always shown — Level A):**

- Name, system category, make/model
- Install date
- Status badge: healthy (green) / attention (amber) / overdue (red)
- Key spec (wattage for panels, L/hr consumption for engines, etc.)

**Detail fields (power view — Level B):**

- Serial number
- Service interval (hours or calendar-based)
- Last service date/hours, next service due
- Parts list (name, part number, supplier)
- Service history timeline
- Notes

**Equipment types with special fields:**

| Type | Special Fields |
|------|---------------|
| Engine | Fuel type, consumption rate (L/hr at cruise RPM), hour meter reading, oil capacity |
| Solar panel | Wattage, quantity, type (mono/poly/flexible) |
| Battery | Chemistry (AGM/LiFePO4/lead-acid), capacity (Ah), voltage, quantity |
| Watermaker | Output rate (L/hr), power draw (watts) |
| Generator | Fuel consumption, output (watts) |

### Equipment Spec Templates

Beyond boat-level templates, individual equipment models have their own spec templates:

- **Engines**: Fuel consumption at cruise RPM, oil capacity, standard service intervals (oil/impeller/belts/zincs), common parts with part numbers
- **Watermakers**: Output rate, power draw, membrane replacement interval
- **Solar panels**: Wattage, dimensions, type
- **Batteries**: Chemistry, capacity, voltage

Seeded with popular marine equipment models. Community can contribute specs for unlisted models. Users can override any template value.

### UX

**Simple view (default):** Card-based grid grouped by system. Each card shows name, make/model, and health badge. Tap to see details.

**Power view (opt-in toggle):** Expands to show service history timeline, parts inventory, upcoming service alerts, full specs.

**Service alerts:** Notification-style list on vessel dashboard — "Engine oil change due in 47 hours" or "Impeller replacement overdue by 2 months." Visible without digging.

**Adding equipment:** Wizard-style — pick system → pick equipment type (or "other") → search for make/model (auto-populates from template) → confirm/adjust. Power-user fields shown but optional and collapsed by default.

---

## Module 2: Energy Planner

### Mode 1 — System Sizer ("What do I need?")

For sailors planning to add or upgrade solar/battery systems on their boat.

**Inputs:**

- Power consumers with daily usage — pick from common items (fridge, autopilot, instruments, chart plotter, lights, watermaker, laptops, phones, VHF, AIS, radar), each with a default wattage (overridable), specify hours/day
- Sailing profile — typical split of days at anchor vs. sailing vs. marina per week
- Cruising region and season (drives solar irradiance estimate)

**Outputs:**

- Total daily Wh demand
- Recommended minimum battery bank (Ah) and solar panel wattage, with cloudy-day buffer
- Daily energy balance chart — generation vs. consumption
- Plain-language explanation ("3 days autonomy at anchor requires X Ah")

### Mode 2 — Generation Calculator ("What will I produce?")

For sailors with existing solar/battery setups.

**Inputs:**

- Solar panel wattage and battery capacity (auto-populated from equipment registry if available, or manual entry)
- Location and time of year (or current location)

**Outputs:**

- Estimated daily solar generation (Wh)
- Hours to full charge
- Whether system covers daily demand
- Simple green/amber/red indicator

### Mode 3 — Passage Energy Forecast

Integrated with route planning (requires a planned passage).

**Inputs (auto-populated):**

- Solar capacity + battery bank from equipment registry
- Route latitude, date, duration from passage plan
- Cloud cover from weather forecast
- Consumer profile from energy planner

**Outputs:**

- Solar generation estimate per day based on latitude, date, cloud cover
- Power consumption estimate per day (sailing day vs. anchor night profiles)
- Net energy balance per day
- Warning if battery state of charge projected to drop below threshold

**UX:**

- **Simple view:** Daily summary — "Day 3: Solar +1,200Wh, Usage -1,800Wh, Net -600Wh" with colour indicator
- **Power view:** Hour-by-hour breakdown, state-of-charge graph across the passage, "what if" toggles (e.g. "what if I run the watermaker 2 hrs instead of 4?")

---

## Module 3: Passage Resource Planner

Integrates equipment specs + weather forecasts to answer: "Do I have enough fuel, water, and power for this passage?"

### Inputs (mostly auto-populated)

| Source | Data |
|--------|------|
| Equipment Registry | Engine fuel consumption, tank capacity, watermaker output/power draw, solar capacity, battery bank, generator specs |
| Route Plan | Distance, duration, waypoints, departure date |
| Weather Forecast | Wind speed/direction along route, cloud cover, sea state |
| User Profile | Crew size, daily water consumption per person (default ~3L, adjustable) |

### Fuel Calculation

- Estimate motoring vs. sailing per leg based on wind forecast and user's simple thresholds:
  - "I motor below X knots true wind" (default: 8 knots)
  - "I can't sail closer than Y degrees to wind" (default: 45°)
- Fuel burn = motoring hours × consumption rate at cruise RPM
- Add generator runtime if applicable
- Compare total fuel needed vs. tank capacity
- Flag if refueling needed; suggest fuel stops along route
- **Future**: Polar diagram upload for more precise motoring estimates

### Water Calculation

- Daily crew consumption: crew count × daily rate per person
- Watermaker production: output rate × planned runtime per day
- Watermaker runtime constrained by available power (links to energy planner)
- Show: tank capacity, daily consumption, daily production, days of autonomy
- Flag if water tanks need filling en route

### Energy Balance

- Pulls from Energy Planner Mode 3 (passage forecast)
- Adds engine alternator charging during motoring hours (additional power source)
- Shows whether watermaker usage is sustainable given solar + alternator input

### Engine Hours & Service Integration

- Calculates estimated engine hours for the passage
- Cross-references with equipment registry service schedule
- Warns if service will be due during or shortly after the passage ("Estimated 18 hrs motoring — next service due at 24 engine hours ⚠️")

### UX

**Simple view — Passage summary card:**

- Fuel: "42L needed, 200L tank capacity ✓"
- Water: "Need 60L, tank 300L + watermaker produces 80L/day ✓"
- Power: "Solar covers daily demand ✓"
- Engine hours: "Estimated 18 hrs motoring — next service at 24 hrs ⚠️"

**Power view:**

- Day-by-day breakdown table
- Fuel and water tank level graphs across the passage
- What-if scenarios ("what if winds are 5 knots lighter than forecast?")

---

## Architecture

### Module Integration

```
┌─────────────────────┐
│   Boat Model        │  ← "Lagoon 43" template
│   Template DB       │     pre-populates ↓
└────────┬────────────┘
         ▼
┌─────────────────────┐
│  Equipment Registry │  ← Source of truth for vessel specs
│  (Module 1)         │     Feeds specs to ↓ ↓
└────┬───────────┬────┘
     ▼           ▼
┌──────────┐ ┌──────────────────┐
│  Energy  │ │ Passage Resource │ ← Also receives weather
│  Planner │ │ Planner          │   forecast + route data
│ (Mod 2)  │ │ (Module 3)       │
└──────────┘ └──────────────────┘
```

### Standalone Capability

- **Equipment Registry** works without route planning — useful from day one for any boat owner
- **Energy Planner Modes 1 & 2** work standalone — punch in numbers or pull from registry. System sizer needs no account.
- **Passage Resource Planner** requires a route + equipment data — most integrated piece

### Template Databases (community-growable)

- **Boat models**: Factory specs, standard equipment, known options/upgrades. Seeded with top 30 production boats. Community submissions.
- **Equipment specs**: Make/model → specs, service intervals, common parts. Seeded with popular engines, panels, watermakers. Community contributions.
- **Power consumers**: Common appliances with default wattage. User overrides allowed.

### Progressive Disclosure in the Data Model

Every field has a visibility concept:

- **Core fields** (Level A — always shown): Name, type, status, key spec
- **Detail fields** (Level B — power view): Service history, parts lists, serial numbers, full specs
- Both levels are always stored and computed against — only the UI presentation changes

---

## Phasing

This feature cluster is **Phase 2**, developable in parallel with the routing/map MVP because Modules 1 and 2 have zero dependency on routing.

**Suggested build order:**

1. Equipment Registry with boat model templates (standalone value, sets up the data foundation)
2. Energy Planner Modes 1 & 2 (standalone calculators, great for marketing/SEO)
3. Passage Resource Planner (integrates with routing once available)
4. Energy Planner Mode 3 (passage energy forecast, requires routing + weather)

**Future enhancements (not in scope):**

- Polar diagram upload for precise motoring estimates
- Full service history with receipts/invoices/warranty tracking
- Integration with marine parts suppliers for ordering
- Community-rated equipment reliability data
