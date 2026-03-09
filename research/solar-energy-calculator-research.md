# Solar/Energy Calculator Research for Sailors

**Date:** 2026-03-09
**Purpose:** UX and implementation details for building standalone solar/energy calculators for cruising sailors

---

## 1. Existing Marine Solar Calculators — Analysis

### 1.1 Victron Energy MPPT Calculator
**URL:** https://www.victronenergy.com/mppt-calculator

**Inputs:**
- PV panel configuration (series/parallel)
- Panel Voc (open circuit voltage), Isc (short circuit current), wattage
- Battery bank voltage (12V/24V/48V)
- Location (for temperature compensation)

**Outputs:**
- Recommended MPPT charge controller model
- Array voltage and current calculations
- Compatibility warnings

**UX Assessment:**
- Loads dynamically via JavaScript (SPA-style)
- Available in 13 languages
- Responsive/mobile-friendly design
- Tooltips for guidance
- **Strength:** Focused on one thing (controller sizing) and does it well
- **Weakness:** Not a full system sizer — only helps with controller selection after you already know your panel configuration. Assumes significant user knowledge (Voc, Isc, temperature coefficients)
- **Weakness:** No appliance/load calculation built in

### 1.2 Explorist.life Solar Charge Controller Calculator
**URL:** https://explorist.life/solar-charge-controller-calculator/

**Inputs:**
- Panel Voc, Isc, wattage, max series fuse rating
- Battery bank voltage (12V, 24V, 48V)
- Panels in series / panels in parallel
- Advanced "Exact Mode": temperature coefficient of Voc, ambient temperature

**Outputs:**
- Total solar array wattage
- Temperature-compensated array voltage
- Controller output amperage
- Array short circuit amperage
- Recommended charge controller with specs

**UX Assessment:**
- Two modes: "Easy Mode" and "Exact Mode" — excellent progressive disclosure pattern
- Visual panel configuration diagrams showing series/parallel arrangements (1s1p through 9s2p)
- Clear separation between input and results sections
- Conditional warning messages (insufficient voltage, exceeding controller limits, etc.)
- **Strength:** Visual wiring diagrams make abstract concepts tangible
- **Strength:** Easy/Exact mode split accommodates beginners and experts
- **Weakness:** Calculator was marked "Offline/in progress" at one point — reliability concern
- **Weakness:** Heavy jargon (Voc, Isc) without inline definitions
- **Weakness:** No load calculation — controller-sizing only

### 1.3 BatteryStuff Solar Calculator
**URL:** https://www.batterystuff.com/kb/tools/solar-calculator.html

**Inputs (31 data points across 3 sections):**

*Power Consumption:*
- Estimated watt demand (DC watts only)
- Hours per day equipment runs
- System voltage

*Battery Bank:*
- Days of backup power required
- Depth of discharge (default 0.5)
- Battery amp rating at 20-hour rate

*Solar Panel Array:*
- Direct sun hours per day
- Worst-weather multiplier (default 1.55)
- Panel wattage

**Outputs (28 computed results):**
- Total watts per hour, watt-hours daily, corrected watt-hours
- Amp-hours needed, required amp backup
- Batteries in parallel/series, total battery count
- Adjusted sun hours, amps from panels, peak amperage
- Panels needed in parallel/series, total panel count

**UX Assessment:**
- Table-based layout — functional but dated
- Conservative sizing (rounds up for safety)
- Automatic worst-weather adjustments
- **Strength:** Comprehensive end-to-end calculation (loads → batteries → panels)
- **Strength:** Built-in safety margins
- **Weakness:** Requires manual AC-to-DC conversion — no inverter loads
- **Weakness:** No appliance presets — user must know their DC watt draw
- **Weakness:** Steep learning curve; "educational purposes only" disclaimer
- **Weakness:** No visual output — just numbers in a table

### 1.4 Renogy Super Solar Calculator
**URL:** https://super-solar-calculator.renogy-dchome.com/

**Inputs:**
- Drag-and-drop appliance selection from preset database
- Per-appliance customization: watts, amps, volts, hours/day, duty cycle
- System voltage (12V, 48V, 110V)
- Location (zip code for solar irradiance)
- Months of off-grid use

**Outputs:**
- Total daily watt-hours consumption
- Recommended solar panels (specific Renogy products)
- Recommended batteries
- Recommended charge controller
- Warnings when consumption exceeds generation
- Saveable configurations (with account)

**UX Assessment:**
- **Strength:** Drag-and-drop appliance selection is intuitive and engaging
- **Strength:** Pre-loaded appliance database with sensible defaults
- **Strength:** Location-based solar generation estimates
- **Strength:** Direct product recommendations with purchase links
- **Strength:** Saveable/shareable configurations
- **Weakness:** Tied to Renogy product catalog — not brand-agnostic
- **Weakness:** RV/van-focused, not marine-specific
- **Weakness:** Loads via JavaScript — content not accessible without JS

### 1.5 Custom Marine Products Solar Panel Sizing Tool
**URL:** https://www.custommarineproducts.com/marine-solar-panel-sizing-calculator-tool.html

**Inputs:**
- Electrical device watts and hours of expected use
- Inverter loss factor
- Battery inefficiency factor
- Variable voltage support

**Outputs:**
- Total amp-hours needed per week
- Recommended panel configuration

**UX Assessment:**
- Marine-specific (rare among calculators)
- Companion PDF worksheet for detailed calculations
- Google Sheets version available
- **Strength:** One of the few truly marine-focused tools
- **Weakness:** Relies on external PDF/spreadsheet — not a self-contained web tool
- **Weakness:** Basic interface

### 1.6 eMarine Systems Sizing Guide
**URL:** https://www.emarineinc.com/Sizing-Your-Marine-Solar-System

**Inputs:**
- Insolation data (from winter/yearly maps)
- Daily load in watt-hours (from load calculation worksheet)
- Module specifications (rated amperage x battery charging voltage)
- Days of storage needed
- Depth of discharge (50-80%)
- Lowest weekly average temperature
- Battery watt-hour capacity

**Outputs:**
- Number of solar modules (winter and yearly average)
- Battery bank size (quantity and configuration)
- System voltage recommendations

**Example Loads Listed:**
| Appliance | Wattage |
|-----------|---------|
| Coffee maker | 800W |
| Microwave | 1000W |
| Ceiling fan | 10W |
| 20" Television | 75W |
| 60W light (x3) | 60W each |
| Refrigerator/Freezer | 60W |

**UX Assessment:**
- Educational guide format with embedded calculations
- **Strength:** Marine-specific context and terminology
- **Strength:** Separate winter vs. yearly calculations (important for cruisers)
- **Weakness:** Static guide, not interactive calculator
- **Weakness:** Appliance list is generic (not sailing-specific)

### 1.7 Key Gaps Across All Existing Tools

| Gap | Impact |
|-----|--------|
| No sailing-specific appliance database | Sailors must research their own device draws |
| No rigging shading calculation | Major factor ignored |
| No anchor vs. passage mode distinction | Loads differ dramatically |
| No location-aware solar irradiance | Most use static "sun hours" input |
| No visual energy balance | Hard to understand surplus/deficit |
| No mobile-first design | Most are desktop-oriented table layouts |
| No dark mode | Sailors often plan at night |
| Brand-locked recommendations | Renogy only recommends Renogy products |

---

## 2. Solar System Sizer UX — "What Do I Need?"

### 2.1 Collecting Power Consumer Data

**Recommended Approach: Pre-loaded appliance catalog with smart defaults**

Best pattern (inspired by Renogy but improved):
1. Present categorized appliance cards (not a dropdown)
2. Each card shows: icon, name, typical wattage, and a toggle to add
3. Tap to add → appears in "My Boat" list with editable defaults
4. Allow custom appliance entry for anything not in the catalog

**Progressive disclosure:**
- Level 1: "Quick estimate" — pick boat size (25-30ft / 30-40ft / 40-50ft / 50ft+) and cruising style (weekender / coastal / offshore). Pre-populate typical loads.
- Level 2: "Customize" — adjust individual appliances, hours, quantities
- Level 3: "Expert" — enter exact amp draws, duty cycles, seasonal variations

**Mode-based loads (sailing-specific):**
- **At anchor** — fridge, lights, entertainment, fans, charging
- **Day sailing** — add instruments, autopilot, VHF
- **Passage making** — add radar, AIS, SSB, watermaker, running lights 24/7
- Let users specify % of time in each mode

### 2.2 Shopping List Output

**Recommended format:**
```
┌─────────────────────────────────────┐
│  YOUR DAILY ENERGY BUDGET           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Consumption: 185 Ah/day (2,220 Wh) │
│  Generation:  210 Ah/day (2,520 Wh) │
│  Balance:     +25 Ah surplus ✓      │
└─────────────────────────────────────┘

RECOMMENDED SYSTEM:
┌──────────────────┬──────────────────┐
│ Solar Panels     │ Battery Bank     │
│ 3x 100W rigid    │ 2x 100Ah LiFePO4│
│ 300W total       │ 200Ah total      │
│                  │ 100Ah usable     │
├──────────────────┼──────────────────┤
│ Charge Controller│ Inverter         │
│ 30A MPPT         │ 2000W pure sine  │
│ (e.g. Victron    │ (if AC loads)    │
│  SmartSolar)     │                  │
└──────────────────┴──────────────────┘
```

**Key principles:**
- Show the "why" — explain each recommendation in plain language
- Size options: "Minimum viable" / "Recommended" / "Comfortable margin"
- Cost estimate range (budget / mid-range / premium)
- Link to generic product types, not specific brands
- Exportable as PDF for sharing with marine electricians

### 2.3 Daily Energy Balance Visualization

**Best approach: Stacked area chart showing 24-hour cycle**

- X-axis: hours (0-24)
- Y-axis: watts
- Green area: solar generation curve (bell curve peaking at solar noon)
- Red/orange stacked areas: consumption by category
- Shaded overlap: energy being used directly from solar
- Battery state-of-charge line overlaid

This shows users intuitively when they're generating vs. consuming, and when the battery is charging vs. discharging.

**Alternative/complement: Simple bar chart**
- Side-by-side bars for each category: generation vs. consumption
- Clear surplus/deficit indicator
- Color-coded: green (surplus), yellow (tight), red (deficit)

### 2.4 Assumptions vs. User Inputs

**Should assume (with option to override):**
- Battery depth of discharge: 80% for LiFePO4, 50% for AGM/gel
- System voltage: 12V (most common on boats under 50ft)
- Inverter efficiency: 85-90%
- Solar derating factor: 75% of rated output (marine conditions)
- Wire losses: 3%
- Days of autonomy: 2-3 days
- Panel mounting: horizontal (flat on deck/bimini/arch)

**Must ask the user:**
- Cruising location (for solar irradiance)
- Time of year (seasonal variation)
- What appliances they use and rough hours/day
- Battery chemistry preference (LiFePO4 vs AGM)
- Whether they have other charging sources (alternator, wind, shore power)

### 2.5 Sailing-Specific Factors

| Factor | Impact | How to Handle |
|--------|--------|---------------|
| Panel angle (horizontal on boats) | -7% at 25°N lat, worse at higher latitudes | Apply latitude-based angle loss factor |
| Rigging shading | Single shroud shadow can cut output 60% | Ask about mounting location; apply 10-30% shading derating |
| Sail shading (at anchor) | Boom/mainsail can shade panels | Note: at anchor, boom can be rigged out. Apply 5-15% |
| Salt spray / dirt | Gradual buildup reduces output | Apply 2-5% soiling factor |
| Temperature | High cell temps reduce voltage ~3V | Apply temperature coefficient based on location climate |
| Motion / heeling | Reduces effective angle to sun | Apply 5-10% motion derating |
| Partial shading cascade | Conventional panels lose disproportionate output | Recommend MPPT per panel or panels with bypass diodes |

**Recommended composite derating: 70-80% of nameplate rating for marine installations**
- Best case (arch-mounted, tropics, no shading): 80%
- Typical (bimini-mounted, some rigging shade): 70-75%
- Worst case (deck-mounted, heavy rigging, higher latitudes): 55-65%

---

## 3. Solar Generation Calculator UX — "What Will I Produce?"

### 3.1 Input Design

**Required inputs:**
- Panel specifications: total wattage, panel type (mono/poly/thin-film)
- Number and configuration of panels
- Mounting type: fixed horizontal / tilted / arch / bimini / deck
- Location: map pin or lat/lon or port name
- Time of year: specific month or annual average

**Optional inputs:**
- Shading situation (none / light rigging / heavy rigging / partial sail)
- Panel age (degradation factor)
- Charge controller type (MPPT vs PWM)

### 3.2 Output Displays

**Hourly generation curve:**
- Bell-curve chart showing expected output through the day
- Peak output clearly labeled
- Total daily Wh prominently displayed
- Overlay with consumption if available from the sizer tool

**Monthly comparison chart:**
- 12-bar chart showing expected monthly generation
- Highlights seasonal variation (critical for planning passages)
- Shows "best month" and "worst month" prominently

**Annual summary:**
- Total annual kWh production
- Average daily production by season
- Capacity factor percentage

### 3.3 Solar Irradiance Data Sources

**Recommended: PVGIS API (EU Joint Research Centre)**
- Free, no cost to users
- Worldwide coverage (except polar regions)
- Hourly radiation data available
- Multiple databases: SARAH, CMSAF, NSRDB (via NREL), ERA5
- API endpoint: `https://re.jrc.ec.europa.eu/api/`
- Inputs: latitude, longitude, PV technology, peak power, losses, mounting
- Outputs: monthly/hourly irradiance, PV energy output, optimal angle
- No rate limiting mentioned (but reasonable use expected)

**Alternative: NREL PVWatts V8 API**
- Free with API key (DEMO_KEY available)
- Rate limit: 1,000 requests/hour
- US coverage primary, international via TMY data
- Uses 2020 TMY data from National Solar Radiation Database (NSRDB)
- Required inputs: system_capacity (kW), module_type (0=Standard, 1=Premium, 2=Thin film), losses (%), array_type (0-4), tilt (degrees), azimuth (degrees), lat/lon
- Optional: dc_ac_ratio (default 1.2), inverter efficiency (default 96%), timeframe (monthly or hourly)
- Outputs: monthly/annual AC output (kWh), plane-of-array irradiance, capacity factor, hourly data

**Recommendation for Above Deck:**
- Use PVGIS as primary (worldwide coverage, free, no API key needed for basic use)
- Use NREL PVWatts as fallback for US locations (better US-specific data)
- Cache results aggressively — irradiance data doesn't change frequently
- Allow manual sun-hours override for areas with poor data coverage

### 3.4 Real-World Derating Factors

Apply these cumulative derating factors to nameplate panel rating:

| Factor | Typical Loss | Range | Notes |
|--------|-------------|-------|-------|
| Temperature | 8-15% | 5-25% | Worse in tropics; ~0.4%/°C above 25°C for crystalline |
| Soiling (salt/dirt) | 3-5% | 1-10% | Depends on maintenance; salt spray is persistent |
| Panel angle (horizontal) | 5-15% | 0-25% | 7% loss in S. Florida; worse at higher latitudes |
| Rigging shading | 10-30% | 0-60% | Highly variable; single shroud shadow = up to 60% loss |
| Wiring/connection losses | 2-3% | 1-5% | Longer runs = more loss |
| Controller efficiency | 2-5% | 0-10% | MPPT ~97-98% efficient; PWM much worse |
| Module mismatch | 1-2% | 0-5% | Different panel orientations/shading patterns |
| Panel degradation | 0-10% | 0-20% | ~0.5%/year for quality panels |
| Motion/heeling | 3-8% | 0-15% | Passage making in rough seas |

**Composite derating factor: 0.55-0.80 (55-80% of nameplate)**
- Use 0.75 as default for "typical marine installation"
- Use 0.65 for "conservative estimate"
- Use 0.80 for "optimistic / well-mounted arch installation"

---

## 4. Power Consumer Database — Cruising Sailboat

### 4.1 Complete Appliance Database

#### Navigation Electronics
| Device | Typical Watts | Amps @12V | Usage Pattern | Hours/Day (Passage) | Hours/Day (Anchor) | Daily Ah (Passage) | Daily Ah (Anchor) |
|--------|--------------|-----------|---------------|--------------------|--------------------|-------------------|-------------------|
| Chartplotter (7") | 15-25W | 1.2-2.1A | On when sailing | 16 | 2 | 20-34 | 2.4-4.2 |
| Chartplotter (9-12") | 25-40W | 2.1-3.3A | On when sailing | 16 | 2 | 34-53 | 4.2-6.6 |
| Autopilot (tiller, standby) | 0.7W | 0.06A | Always on passage | 24 | 0 | 1.4 | 0 |
| Autopilot (tiller, engaged) | 10-24W | 0.8-2.0A | Engaged on passage | 20 | 0 | 16-40 | 0 |
| Autopilot (wheel, engaged) | 24-60W | 2.0-5.0A | Engaged on passage | 20 | 0 | 40-100 | 0 |
| Radar (on) | 20-45W | 1.7-3.8A | Intermittent | 8 | 0 | 14-30 | 0 |
| AIS transponder | 2-5W | 0.2-0.4A | Always on | 24 | 24 | 4.8-9.6 | 4.8-9.6 |
| AIS receiver only | 1-2W | 0.08-0.17A | Always on | 24 | 24 | 2-4 | 2-4 |
| Depth/speed/wind instruments | 2-5W | 0.17-0.4A | On when sailing | 16 | 0 | 2.7-6.4 | 0 |
| GPS (standalone) | 1-3W | 0.08-0.25A | Always on passage | 24 | 0 | 2-6 | 0 |

#### Communication
| Device | Typical Watts | Amps @12V | Usage Pattern | Hours/Day (Passage) | Hours/Day (Anchor) | Daily Ah (Passage) | Daily Ah (Anchor) |
|--------|--------------|-----------|---------------|--------------------|--------------------|-------------------|-------------------|
| VHF radio (receive) | 3-6W | 0.25-0.5A | On when sailing | 16 | 8 | 4-8 | 2-4 |
| VHF radio (transmit) | 25-72W | 2-6A | Intermittent | 0.25 | 0.1 | 0.5-1.5 | 0.2-0.6 |
| SSB/HF radio (receive) | 24-36W | 2-3A | Scheduled | 2 | 1 | 4-6 | 2-3 |
| SSB/HF radio (transmit) | 120-360W | 10-30A | Intermittent | 0.17 | 0.1 | 1.7-5 | 1-3 |
| Satellite phone (Iridium) | 5-15W | 0.4-1.25A | Intermittent | 0.5 | 0.25 | 0.2-0.6 | 0.1-0.3 |
| Starlink | 50-100W | 4.2-8.3A | Continuous when on | 8 | 12 | 34-67 | 50-100 |
| WiFi booster/antenna | 5-12W | 0.4-1.0A | When in range | 2 | 8 | 0.8-2 | 3.2-8 |

#### Refrigeration
| Device | Typical Watts | Amps @12V | Usage Pattern | Hours/Day (Passage) | Hours/Day (Anchor) | Daily Ah (Passage) | Daily Ah (Anchor) |
|--------|--------------|-----------|---------------|--------------------|--------------------|-------------------|-------------------|
| Small fridge (top-loading, efficient) | 30-45W | 2.5-3.8A | Cycles 30-50% | 8-12 running | 10-14 running | 20-45 | 25-53 |
| Large fridge (front-opening) | 50-80W | 4.2-6.7A | Cycles 40-60% | 10-14 running | 12-16 running | 42-94 | 50-107 |
| Freezer (dedicated) | 40-70W | 3.3-5.8A | Cycles 30-50% | 8-12 running | 10-14 running | 26-70 | 33-81 |
| Fridge/freezer combo (efficient, e.g., Isotherm) | 35-55W | 2.9-4.6A | Cycles 30-40% | 7-10 running | 8-12 running | 20-46 | 23-55 |
| Older/inefficient fridge (e.g., Nova Kool older) | 60-100W | 5-8.3A | Cycles 40-60% | 10-14 running | 12-16 running | 50-116 | 60-133 |

#### Lighting
| Device | Typical Watts | Amps @12V | Usage Pattern | Hours/Day (Passage) | Hours/Day (Anchor) | Daily Ah (Passage) | Daily Ah (Anchor) |
|--------|--------------|-----------|---------------|--------------------|--------------------|-------------------|-------------------|
| LED cabin light (single) | 1-3W | 0.08-0.25A | Intermittent | 4 | 6 | 0.3-1 | 0.5-1.5 |
| LED cabin lights (all, ~6) | 6-18W | 0.5-1.5A | Evening | 4 | 6 | 2-6 | 3-9 |
| LED anchor light | 2-3W | 0.17-0.25A | Dusk to dawn | 0 | 10-12 | 0 | 1.7-3 |
| LED navigation lights (tricolor) | 6-15W | 0.5-1.25A | Dusk to dawn | 10-12 | 0 | 5-15 | 0 |
| LED steaming light | 3-6W | 0.25-0.5A | When motoring at night | 4 | 0 | 1-2 | 0 |
| Cockpit/deck light | 3-10W | 0.25-0.8A | Intermittent | 1 | 2 | 0.25-0.8 | 0.5-1.6 |
| Reading light | 1-3W | 0.08-0.25A | Intermittent | 2 | 3 | 0.16-0.5 | 0.24-0.75 |

#### Water Systems
| Device | Typical Watts | Amps @12V | Usage Pattern | Hours/Day (Passage) | Hours/Day (Anchor) | Daily Ah (Passage) | Daily Ah (Anchor) |
|--------|--------------|-----------|---------------|--------------------|--------------------|-------------------|-------------------|
| Freshwater pump (pressure) | 36-60W | 3-5A | Intermittent | 0.25 | 0.5 | 0.75-2.5 | 1.5-2.5 |
| Watermaker (small, 12V) | 60-180W | 5-15A | Scheduled | 2 | 3-4 | 10-30 | 15-60 |
| Watermaker (large, e.g., Spectra) | 180-360W | 15-30A | Scheduled | 2 | 3-4 | 30-60 | 45-120 |
| Saltwater washdown pump | 36-60W | 3-5A | Intermittent | 0.1 | 0.1 | 0.3-0.5 | 0.3-0.5 |
| Bilge pump (auto) | 24-60W | 2-5A | Auto/intermittent | 0.1 | 0.1 | 0.2-0.5 | 0.2-0.5 |
| Hot water heater (12V element) | 200-400W | 17-33A | Intermittent | 0.5 | 1 | 8.5-16.5 | 17-33 |
| Toilet (electric) | 15-30W | 1.25-2.5A | Intermittent | 0.1 | 0.15 | 0.13-0.25 | 0.19-0.38 |

#### Comfort / Galley
| Device | Typical Watts | Amps @12V | Usage Pattern | Hours/Day (Passage) | Hours/Day (Anchor) | Daily Ah (Passage) | Daily Ah (Anchor) |
|--------|--------------|-----------|---------------|--------------------|--------------------|-------------------|-------------------|
| Cabin fan (small, 12V) | 6-18W | 0.5-1.5A | In tropics | 8 | 12 | 4-12 | 6-18 |
| Cabin fans (x3 in tropics) | 18-54W | 1.5-4.5A | In tropics | 8 | 12 | 12-36 | 18-54 |
| Microwave (via inverter) | 800-1200W | 67-100A | Intermittent | 0.1 | 0.15 | 6.7-10 | 10-15 |
| Coffee maker (via inverter) | 600-1000W | 50-83A | Morning | 0.15 | 0.15 | 7.5-12.5 | 7.5-12.5 |
| Electric kettle (via inverter) | 1000-1500W | 83-125A | Intermittent | 0.1 | 0.1 | 8.3-12.5 | 8.3-12.5 |
| Stereo/music system | 12-48W | 1-4A | Intermittent | 2 | 4 | 2-8 | 4-16 |
| TV/display (small, 12V) | 20-50W | 1.7-4.2A | Evening | 0 | 2-3 | 0 | 3.4-12.6 |

#### Charging / Electronics
| Device | Typical Watts | Amps @12V | Usage Pattern | Hours/Day (Passage) | Hours/Day (Anchor) | Daily Ah (Passage) | Daily Ah (Anchor) |
|--------|--------------|-----------|---------------|--------------------|--------------------|-------------------|-------------------|
| Laptop charging | 45-65W | 3.75-5.4A | Intermittent | 2 | 3 | 7.5-10.8 | 11.3-16.2 |
| Phone/tablet charging (x2) | 10-20W | 0.8-1.7A | Daily | 3 | 4 | 2.4-5.1 | 3.2-6.8 |
| Camera/drone charging | 15-30W | 1.25-2.5A | Intermittent | 0.5 | 1 | 0.6-1.25 | 1.25-2.5 |
| Inverter (standby draw) | 10-30W | 0.8-2.5A | Always when on | 24 | 24 | 19.2-60 | 19.2-60 |

#### Sailing / Mechanical
| Device | Typical Watts | Amps @12V | Usage Pattern | Hours/Day (Passage) | Hours/Day (Anchor) | Daily Ah (Passage) | Daily Ah (Anchor) |
|--------|--------------|-----------|---------------|--------------------|--------------------|-------------------|-------------------|
| Electric windlass | 600-1500W | 50-125A | Intermittent | 0 | 0.05 | 0 | 2.5-6.25 |
| Bow thruster | 1200-3000W | 100-250A | Intermittent | 0 | 0.02 | 0 | 2-5 |
| Electric winch | 500-1200W | 42-100A | Intermittent | 0.05 | 0 | 2.1-5 | 0 |

#### Safety
| Device | Typical Watts | Amps @12V | Usage Pattern | Hours/Day (Passage) | Hours/Day (Anchor) | Daily Ah (Passage) | Daily Ah (Anchor) |
|--------|--------------|-----------|---------------|--------------------|--------------------|-------------------|-------------------|
| Smoke/CO detector | 0.5-1W | 0.04-0.08A | Always on | 24 | 24 | 1-2 | 1-2 |
| Bilge alarm | 0.1-0.5W | 0.01-0.04A | Always on | 24 | 24 | 0.24-1 | 0.24-1 |

### 4.2 Typical Daily Consumption Profiles

| Cruising Style | Daily Ah @12V | Daily Wh | Key Consumers |
|----------------|--------------|----------|---------------|
| Minimal (weekend sailor) | 30-60 | 360-720 | Lights, instruments, phone charging |
| Moderate (coastal cruiser) | 80-150 | 960-1,800 | + fridge, VHF, laptop, fans |
| Comfort cruiser | 150-250 | 1,800-3,000 | + watermaker, autopilot, entertainment |
| High-tech liveaboard | 250-400 | 3,000-4,800 | + Starlink, larger fridge, inverter loads |
| Passage making | 200-350 | 2,400-4,200 | + radar, AIS, autopilot 24/7, running lights |

### 4.3 "Always On" vs Intermittent Classification

**Always On (24/7):**
- AIS transponder
- Bilge alarm / smoke detector
- Refrigerator/freezer (cycling)
- Inverter standby (if left on)
- Anchor light (at night at anchor)
- Navigation lights (at night on passage)

**Scheduled / Regular:**
- Watermaker (1-4 hours/day)
- Autopilot (while on passage)
- Laptop/device charging
- Water pump

**Intermittent / On-Demand:**
- VHF transmit
- Windlass
- Bow thruster
- Microwave/kettle
- Bilge pump
- Toilet pump

---

## 5. Visual Design & UX Recommendations

### 5.1 Interactive Sliders vs Form Inputs

**Recommendation: Hybrid approach**

| Input Type | Best For | Implementation |
|-----------|---------|----------------|
| Sliders | Hours of use, number of panels, battery capacity — continuous values where relative positioning matters | Range input with real-time value bubble above thumb |
| Toggles | On/off appliances, anchor vs passage mode | Switch component |
| Number steppers | Quantity of devices, exact wattage | +/- buttons with editable number field |
| Dropdowns | Battery chemistry, charge controller type, boat size | Select component |
| Map picker | Location selection | Interactive map with click-to-place pin |

**Slider best practices for mobile:**
- Minimum 44px touch target for thumb
- Value displayed above slider (not below — finger obscures it)
- Haptic feedback on snap points
- Clear min/max labels
- Allow tap-on-value to type exact number

### 5.2 Real-Time Results Updating

**Pattern: Live calculation with debounced updates**
- Results panel stays visible (sticky on desktop, collapsible on mobile)
- All outputs update within 100ms of input change
- No "Calculate" button — results are always current
- Subtle animation on value changes (count-up/down)
- Color transitions: green → yellow → red as system approaches limits

### 5.3 Visual Energy Balance

**Primary visualization: 24-hour energy flow chart**
```
Generation (green fill, bell curve)
    ╱‾‾‾‾‾‾‾‾‾‾‾‾╲
   ╱                ╲
──╱──────────────────╲──────────
  ████████████████████████████   ← Baseload (fridge, always-on)
  ▓▓▓▓▓▓▓▓          ▓▓▓▓▓▓▓▓   ← Active use (daytime vs evening)

6am    noon     6pm    midnight
```

**Secondary: Donut chart for consumption breakdown**
- Segments by category (refrigeration, navigation, comfort, etc.)
- Center shows total daily Wh
- Tap segment for detail

**Tertiary: Monthly bar comparison**
- 12 bars showing generation capacity
- Horizontal line showing consumption
- Clear visual of which months have surplus vs deficit

### 5.4 Mobile-First Considerations

- **Card-based layout** for appliance selection (swipeable)
- **Bottom sheet** for results (pull up to see details)
- **Thumb-zone navigation** — primary actions in lower 40% of screen
- **Progressive disclosure** — don't show all 30+ appliances at once
- **Offline capability** — cache irradiance data for common locations
- **Minimum 16px body text**, 14px for secondary
- **Touch targets** minimum 44x44px

### 5.5 Dark Mode

Dark mode is particularly important for sailors who often plan at night or use devices in low-light cockpit conditions.

**Dark mode calculator palette:**
- Background: #1a1a2e or #0f0f1a (deep navy, not pure black)
- Cards/surfaces: #16213e or #1a1a3e
- Primary text: #e0e0e0
- Secondary text: #8b8b9e
- Accent (generation): #4ade80 (green)
- Accent (consumption): #f87171 (coral red)
- Accent (neutral): #60a5fa (blue)
- Chart backgrounds: transparent or subtle grid lines at 10% opacity
- Slider tracks: #2d2d4a
- Slider thumbs: bright accent color for visibility

### 5.6 Design Inspiration Sources

- **Renogy Super Solar Calculator** — best appliance selection UX (drag and drop)
- **Explorist.life** — best progressive disclosure (Easy/Exact modes)
- **NYT Buy vs Rent Calculator** — gold standard for interactive financial calculators with sliders
- **Tesla Powerwall Calculator** — clean, product-focused output
- **BatteryStuff** — most comprehensive calculation engine (but worst UX)
- **Behance "Solar Calculator UI Design"** — visual design patterns for the category

---

## 6. Recommended Implementation Approach

### 6.1 Build Two Connected Tools

**Tool 1: Solar System Sizer ("What do I need?")**
1. User selects cruising style or picks appliances from categorized catalog
2. System calculates daily energy budget (Ah and Wh)
3. User selects location on map
4. System fetches solar irradiance data (PVGIS API)
5. System recommends: panel wattage, battery bank size, charge controller, optional inverter
6. Visual energy balance shows 24-hour generation vs consumption
7. Shopping list output with size options (minimum / recommended / comfortable)

**Tool 2: Solar Generation Calculator ("What will I produce?")**
1. User enters existing panel specs (wattage, type, quantity)
2. User selects mounting type and shading conditions
3. User picks location on map
4. System fetches irradiance data and applies derating factors
5. Shows hourly/daily/monthly generation estimates
6. Compares against consumption if linked to Tool 1

### 6.2 Technical Architecture

- **Frontend:** React/Next.js with real-time calculation (no server round-trips for basic math)
- **Solar data:** PVGIS API for irradiance, with caching layer (Redis or edge cache)
- **Appliance database:** Static JSON with ~50 pre-loaded marine appliances
- **State management:** URL-encoded state for shareable calculator links
- **Charts:** Chart.js or Recharts (lightweight, good mobile performance)
- **Offline:** Service worker to cache app shell and irradiance data for visited locations

### 6.3 MVP Feature Set

Phase 1 (MVP):
- Pre-loaded marine appliance catalog (30+ devices with defaults)
- Anchor vs passage mode toggle
- Location-based solar irradiance (PVGIS)
- Daily energy balance visualization
- Component sizing recommendations (panels, batteries, controller)
- Mobile-responsive, dark mode

Phase 2:
- Monthly/seasonal generation estimates
- Shareable/saveable configurations
- PDF export of results
- Cost estimate ranges
- Wire sizing calculator add-on

Phase 3:
- Real-world panel database (specific products with specs)
- Integration with vessel profile (if user has a boat in the system)
- Community-contributed consumption profiles ("boats like yours use X")
- Route-based solar planning (estimate generation along a passage route)

---

## Sources

- [Victron MPPT Calculator](https://www.victronenergy.com/mppt-calculator)
- [Explorist.life Charge Controller Calculator](https://explorist.life/solar-charge-controller-calculator/)
- [BatteryStuff Solar Calculator](https://www.batterystuff.com/kb/tools/solar-calculator.html)
- [Renogy Super Solar Calculator](https://super-solar-calculator.renogy-dchome.com/)
- [Custom Marine Products Sizing Tool](https://www.custommarineproducts.com/marine-solar-panel-sizing-calculator-tool.html)
- [eMarine Systems Sizing Guide](https://www.emarineinc.com/Sizing-Your-Marine-Solar-System)
- [Commuter Cruiser Amp Usage](http://commutercruiser.com/how-to-calculate-amp-usage-aboard-a-boat/)
- [When Sailing — Electrical Needs](https://www.whensailing.com/blog/electrical-needs-cruising-sailboat-power-consumption)
- [Bluwater Cruising — Battery Power](https://currents.bluewatercruising.org/article/how-much-battery-power-is-enough/)
- [Coastal Climate Control — Marine Solar Planning](https://www.coastalclimatecontrol.com/blog/marine-solar-panel-planning-guide)
- [Open Waters Solar — Shading Effects](https://openwaterssolar.com/blogs/posts/the-effects-of-shading-on-marine-solar-panels)
- [PVGIS — EU Joint Research Centre](https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis_en)
- [NREL PVWatts V8 API](https://developer.nrel.gov/docs/solar/pvwatts/v8/)
- [Smashing Magazine — Slider UX](https://www.smashingmagazine.com/2017/07/designing-perfect-slider/)
- [Eleken — Slider UI Examples](https://www.eleken.co/blog-posts/slider-ui)
- [NN/g — Slider Design](https://www.nngroup.com/articles/gui-slider-controls/)
- [Renogy — How to Use Solar Calculator](https://www.renogy.com/blog/solar-calculator-how-to/)
- [Morgan's Cloud — Cruising Electrical System Design](https://www.morganscloud.com/2019/01/09/cruising-boat-house-electrical-system-design-part-1-loads-and-conservation/)
- [Gerbers UnderWay — Energy Budget Guide](https://gerbersunderway.com/simple-guide-for-calculating-your-sailboats-energy-budget/)
