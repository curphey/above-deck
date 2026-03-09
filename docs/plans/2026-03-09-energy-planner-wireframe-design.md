# Energy Planner Wireframe Design

**Date**: 2026-03-09
**Status**: Approved
**Wireframe**: `wireframes/html/energy-planner-lofi.html`

## Overview

Low-fidelity structural wireframe for the Energy Planner at `/tools/solar`. Single-page adaptive layout with 8 sections. Grey boxes, placeholder text, layout and flow only.

## Sections

### 1. Journey Selector
Three cards: "Plan a new system" / "Check my existing setup" / "Add or upgrade". Selecting one pre-configures visible sections below. All share same calculation engine. User can switch at any time.

### 2. Quick Start (30 seconds)
Three inputs only:
- **Boat model** — autocomplete from `boat_model_templates`. Pre-fills factory specs, default appliances, crew. "Custom / I don't know" triggers length + type picker.
- **Crew size** — stepper, pre-filled from boat model. Affects crew-scaled appliances.
- **Cruising style** — Weekend / Coastal / Offshore toggle. Pre-selects appliance profile.

No location input at this stage. Default solar irradiance uses Mediterranean average (~4.5 PSH).

### 3. Instant Results Banner
Four headline stats: daily consumption (Wh), solar needed (W), battery bank (Ah), daily balance (%). Green/amber/red status dots. Note links to map picker in Customize: "Based on typical Mediterranean sunshine. Adjust for your cruising area."

Results update in real-time — no "Calculate" button.

### 4. Customize (opt-in)

**Appliance Grid:**
- Anchor/Passage mode toggle at top
- Category filter tabs (All, Navigation, Comms, Refrigeration, etc.)
- Card per appliance: name, on/off toggle, wattage display, hours/day slider
- Crew-scaled appliances marked with blue left border
- "+ Add appliance" card for custom entries

**Cruising Region (Mapbox map):**
- Pre-highlighted clickable cruising zones (Caribbean, Med, Northern Europe, SE Asia, etc.)
- Click zone → instant selection with pre-computed PVGIS averages
- "Or drop a pin for exact location" → lat/lon → PVGIS API lookup
- Moved here from Quick Start to reduce initial complexity

**System Preferences:**
- Battery chemistry: AGM / LiFePO4 toggle
- System voltage: 12V / 24V / 48V toggle
- Days of autonomy: stepper (default 3, range 1-7)
- Engine alternator: amps @ voltage (pre-filled from boat model)
- Motoring hours/day: stepper (pre-filled from cruising style)
- Shore power access: No / Sometimes / Often

### 5. Detailed Results — 3 Tiers
Three columns: Minimum / Recommended (highlighted) / Comfortable. Each lists:
- Solar panels (watts)
- MPPT controller (amps / voltage)
- Battery bank (Ah, chemistry)
- Inverter (watts)
- Alternator contribution (Ah/day)
- Battery monitor
- Main wiring (AWG)

Recommended tier shows 2-3 product examples from `product_specs`. "Don't see your product? Request it" link.

### 6. Charts (2x2 grid)
- **24h Energy Flow** — solar bell curve (green) vs consumption stacked by category (red). Toggleable anchor/passage.
- **Monthly Generation** — 12 bars from PVGIS, consumption line overlaid. Deficit months highlighted red.
- **Consumption Breakdown** — donut chart by category, total Wh in centre.
- **Multi-Location Compare** — side-by-side bars for 2-3 selected locations. Only shown when multiple locations picked.

All Recharts. Real-time updates.

### 7. System Schematic
Auto-generated SVG wiring diagram adapting to config:
- Solar → MPPT → batteries → distribution → loads
- Alternator → smart regulator (if LiFePO4) → batteries
- Shore power → inverter/charger → batteries
- Fuse/breaker locations, wire gauges labelled
- LiFePO4 → shows BMS. No AC loads → inverter hidden. 24V → series batteries.

Exportable as PDF. Blueprint drawing style.

### 8. What If? Panel
Clickable scenario buttons showing before/after delta:
- Add more solar, switch chemistry, add watermaker, change location, add washer/dryer

### Save Bar (sticky bottom)
- "Save to browser" — always available (localStorage)
- "Sign in to save across devices" — unauthenticated state
- "Save as..." / "Share link" — authenticated state

## Key Design Decisions

1. **Quick Start has 3 inputs, not 4** — location moved to Customize to keep the 30-second flow fast
2. **Map-based region picker** — Mapbox with clickable cruising zones, more intuitive for sailors than a dropdown
3. **Single page, adaptive** — all sections on one page, not separate routes. Journey selector pre-configures what's shown.
4. **Real-time results** — no Calculate button, everything updates live with debounce
5. **3-tier recommendations** — minimum/recommended/comfortable gives context without overwhelming
