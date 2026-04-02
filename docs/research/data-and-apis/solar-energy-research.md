# Solar Energy Research — Comprehensive Reference

**Date:** 2026-03-20
**Status:** Consolidated from marine-solar-energy-systems.md and solar-energy-calculator-research.md
**Scope:** Victron ecosystem, system architecture, sizing fundamentals, existing tools analysis, UX strategy, appliance database, irradiance APIs, implementation plan

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Foundations](#2-foundations)
3. [Sizing Fundamentals](#3-sizing-fundamentals)
4. [Existing Solutions](#4-existing-solutions)
5. [Design & UX Strategy](#5-design--ux-strategy)
6. [Appliance Power Database](#6-appliance-power-database)
7. [Irradiance Data Sources](#7-irradiance-data-sources)
8. [Implementation](#8-implementation)
9. [Educational Content Opportunities](#9-educational-content-opportunities)
10. [Sources](#10-sources)

---

## 1. Executive Summary

This document consolidates all research on marine solar energy systems for cruising sailboats. It covers the technical foundations (Victron products, system architecture, electrical basics, battery chemistry), the sizing process (equations, peak sun hours, derating factors), a comparative analysis of every existing marine solar calculator, a complete UX and design strategy for building two connected tools, a comprehensive appliance power database with passage and anchor mode data for ~50 devices, all available solar irradiance APIs with endpoint details, and a phased implementation plan.

**Key findings:**

1. **The market gap is clear**: No existing tool combines energy audit + location-aware solar data + battery chemistry comparison + route-based seasonal analysis. Each tool solves one piece of the puzzle.
2. **PVGIS is the ideal data source**: Free API, global coverage, monthly data, JSON output. No API key needed for basic use.
3. **Victron dominates the ecosystem**: Any educational content or calculator should speak "Victron" as that's what most cruisers install. But core calculations should remain brand-agnostic.
4. **The biggest pain points for sailors** are: (a) not knowing how much power they actually use, (b) not understanding how location/season affects solar output, and (c) not being able to compare battery chemistry trade-offs with real numbers.
5. **Solar sizing is inherently a multi-location problem for sailors**: Unlike a house, a boat moves. A calculator that can show "your system works great in the Caribbean but you'll have a 40% deficit in the UK in December" would be uniquely valuable.
6. **The 2026 consensus on sizing**: 1W of solar per 1Ah of battery capacity. Weekenders: 100-200W. Coastal cruisers: 300-600W. Bluewater: 800-1200W. But this is crude without location and consumption data.
7. **LiFePO4 is becoming the default recommendation** for serious cruisers, but AGM still has a place for budget-conscious or cold-weather sailors.

---

## 2. Foundations

### 2.1 Victron Energy's Marine Solar Approach

Victron Energy is the dominant brand in marine power systems, particularly for cruising sailboats. Their marine page positions solar as part of a **hybrid energy ecosystem** combining shore power, engine alternators, solar generation, and battery storage. Their marketing tagline for solar sailing is "the sound of silence" — maintaining onboard comfort without generator noise.

Victron focuses on practical outcomes rather than deep electrical theory:
- Solar extends autonomy without engine noise
- Solar is "free" energy after initial investment
- Their tools (MPPT calculator, system examples) guide product selection rather than teaching electrical engineering
- They emphasize the complete system approach: solar is one input alongside shore power and alternator

#### Product Lines for Marine Solar

**Solar Charge Controllers (MPPT)**
- **SmartSolar MPPT**: Built-in Bluetooth, VE.Direct connectivity, optional VE.Can for daisy-chaining. 98% efficient. The flagship line.
- **BlueSolar MPPT**: Same performance, requires optional Bluetooth dongle. Lower cost.
- **BlueSolar PWM**: Economy option for small systems where panel voltage closely matches battery voltage.

**Naming convention**: First number = max PV open circuit voltage, second = max charge current.
- Example: MPPT 75/15 = 75V max PV voltage, 15A max charge current
- Available ranges: 75V-450V PV voltage, 5A-200A charge current
- Battery voltages supported: 12V, 24V, 36V, 48V

**Recommended MPPT selection for sailing yachts:**
- Solar panels < 150W: MPPT 75/10
- Solar panels 150-220W: MPPT 75/15
- Larger arrays: Scale up accordingly

**Inverter/Chargers**
- **MultiPlus**: The heart of the system — charges batteries from shore power AND inverts battery power to AC
- Features PowerControl (prevents shore power overload) and PowerAssist (uses battery as buffer during peak demand)
- MultiPlus 12/500 recommended for normal sailing yacht use

**Battery Monitors**
- BMV-712 Smart (standalone)
- Lynx Smart BMS (for lithium systems)

**Other Components**
- BatteryProtect for discharge protection
- Cerbo GX for system monitoring/display
- VRM Portal for remote monitoring

#### System Configurations (from Victron's sailing yacht examples)

**Normal Use (1.2 kWh/day)**
- Solar: 160W panel + MPPT 75/15
- Battery: 200Ah lead-acid or equivalent lithium
- Inverter: MultiPlus 12/500
- Monitor: BMV-712 Smart

**Heavier Use (2.4 kWh/day)**
- Solar: 200W+ panels + larger MPPT
- Battery: 400Ah lead-acid or equivalent lithium
- Inverter: Larger MultiPlus
- Monitor: BMV-712 Smart or Lynx Smart BMS

#### Victron's Key Recommendation

Victron **strongly recommends 24V systems for new boats**, stating that higher voltage is simply a better choice for meeting the power demands of a modern sailing yacht. This reduces current (and thus wire gauge requirements) for the same power delivery.

#### Educational Resources

- **MPPT Calculator** (mppt.victronenergy.com): Online tool with PV module database, temperature compensation, multi-language support. Recommends specific MPPT models.
- **Marine System Booklet**: Downloadable PDF with configuration examples and wiring diagrams
- **Wiring Unlimited Manual**: Comprehensive installation guide
- **VictronConnect App**: Configuration and monitoring via Bluetooth
- **Victron Community Forum**: Active user support

### 2.2 System Architecture

A marine solar system has these core components connected in a specific chain:

```
Solar Panels
    |
    v
Charge Controller (MPPT/PWM)
    |
    v
Battery Bank (House Batteries)  <-- Also charged by: Alternator, Shore Power Charger
    |
    v
Distribution Panel / Fuse Box
    |          |
    v          v
DC Loads    Inverter --> AC Loads
```

#### Solar Panels

**Types available for marine use:**

| Type | Efficiency | Pros | Cons |
|------|-----------|------|------|
| Rigid monocrystalline | 18-25.4% | Highest output, longest life, best value per watt | Heavy, need mounting structure (arch/pole) |
| Flexible monocrystalline | 16-22.5% | Conform to curves, walkable, light | Shorter lifespan, can overheat without airflow |
| Semi-rigid (walkable) | 17-21% | Aluminum backing, ETFE surface, walkable | Compromise between rigid and flexible |
| Thin-film/amorphous | 8-12% | Most shade-tolerant (50%+ output in partial shade) | Very low efficiency, need large area |

**Premium cells:** SunPower Maxeon back-contact cells achieve up to 25.4% efficiency.

**Key marine considerations:**
- Panels are rated under Standard Test Conditions (STC): 1,000 W/m2 irradiance, 25C cell temperature, AM 1.5 air quality
- Real-world marine output is typically 60-80% of rated power due to temperature, angle, and shading
- Individual silicon cells produce 0.6-0.7V each
- A typical 36-cell panel produces ~20V at room temperature
- A standard 5" monocrystalline cell generates about 5.5A in good sunlight

**Mounting options:**
- Arch/davit mount (most common for sailboats)
- Bimini top (flexible panels)
- Pole mount (adjustable angle)
- Deck mount (walkable panels)
- Adhesive/snap/magnetic mounting for flexible panels (max 30-degree bend radius)

#### Charge Controllers

**PWM (Pulse Width Modulation)**
- Simpler, cheaper
- Essentially connects panel directly to battery, pulsing current
- Panel voltage must closely match battery voltage
- Wastes excess panel voltage as heat
- Best for: small systems, budget installations

**MPPT (Maximum Power Point Tracking)**
- Sophisticated DC-DC converter
- Continuously finds the optimal voltage/current combination from the panel
- Can deliver **30%+ more power than PWM** under real conditions
- Can produce more amps to battery than panels generate (by converting excess voltage to current)
- Essential for: any serious cruising installation

**Why MPPT is critical for boats:**
- Panels rarely operate at ideal conditions on a moving boat
- MPPT extracts maximum power even with suboptimal angle, partial cloud cover
- Temperature compensation adjusts for hot panels
- Higher-voltage panel strings (series wiring) reduce current and allow thinner wires on long runs

#### Battery Bank

The battery bank stores energy for use when solar isn't producing (night, cloudy days, high-draw situations).

**Battery chemistry comparison:**

| Feature | Flooded Lead-Acid | AGM | LiFePO4 |
|---------|------------------|-----|---------|
| Cost (per kWh usable) | Lowest upfront | Medium | Highest upfront, lowest lifecycle |
| Usable Depth of Discharge | 50% | 50% | 80-90% |
| Cycle Life | 200-500 | 300-500 | 2,000-5,000 |
| Weight | Heaviest | Heavy | 30-60% lighter |
| Maintenance | Requires watering | Maintenance-free | Maintenance-free |
| Charging Profile | Tolerant | Needs regulated charging | Needs BMS, specific charge profile |
| Self-Discharge | 5-15%/month | 3-5%/month | 1-3%/month |
| Lifespan | 2-4 years | 3-5 years | 10-20 years |
| Temperature Sensitivity | Moderate | Moderate | Cannot charge below 0C |

**Practical equivalence:**
- 400Ah AGM bank (200Ah usable at 50% DoD) = 240-300Ah LiFePO4 bank (200-240Ah usable at 80-90% DoD)
- The LiFePO4 bank weighs 30-60% less and lasts 5-10x longer

**Sizing rule of thumb:** Battery bank should store 2-3 days of consumption without charging.

#### Inverter/Charger (Combi)

Dual-purpose device:
- **Inverter mode**: Converts 12/24/48V DC to 120/230V AC for household appliances
- **Charger mode**: Converts shore power AC to DC for battery charging
- **Transfer switch**: Automatically switches between shore power and inverter

Key specs: continuous power rating (watts), surge rating, charging current (amps).

#### Shore Power Charger

If not using an inverter/charger combo, a standalone charger converts marina AC power to DC battery charging. Multi-stage charging profiles (bulk, absorption, float) protect battery health.

#### Battery Monitor

Essential for knowing state of charge. Measures:
- Voltage
- Current (via shunt)
- Consumed amp-hours
- State of charge (%)
- Time remaining
- Historical data (deepest discharge, cycles)

Victron BMV-712 Smart or SmartShunt are the most popular in the cruising community.

### 2.3 Typical Cruising Sailboat Configurations

**Weekend/Coastal Cruiser (30-35ft)**
- 100-200W solar
- MPPT 75/10 or 75/15
- 200Ah AGM or 100Ah LiFePO4
- Small inverter (300-500W) or none
- Daily consumption: 40-80Ah (12V)

**Coastal Cruiser with Comforts (35-45ft)**
- 300-600W solar
- MPPT 100/30 or 100/50
- 400Ah AGM or 200-300Ah LiFePO4
- Inverter/charger 1000-2000W
- Daily consumption: 100-200Ah (12V)

**Bluewater Cruiser (40-55ft)**
- 800-1200W solar
- Multiple MPPTs or large single unit
- 600-800Ah AGM or 400-600Ah LiFePO4 (often 24V or 48V)
- Inverter/charger 2000-3000W
- Daily consumption: 200-400Ah (12V equivalent)

### 2.4 Common Electrical Knowledge for Sailors

#### Fundamental Units

| Unit | Symbol | What It Measures | Water Analogy |
|------|--------|-----------------|---------------|
| Volt | V | Electrical pressure | Water pressure |
| Amp | A | Current flow rate | Flow rate (gallons/min) |
| Watt | W | Power (rate of energy use) | Work being done |
| Amp-hour | Ah | Charge stored/consumed | Gallons in tank |
| Watt-hour | Wh | Energy stored/consumed | Total work capacity |

#### Key Formulas

```
Watts = Volts x Amps
Amps = Watts / Volts
Watt-hours = Watts x Hours
Amp-hours = Amps x Hours
Watt-hours = Amp-hours x Voltage
```

**Critical insight**: Amp-hours are voltage-dependent. A 100Ah battery at 12V stores 1,200Wh. A 100Ah battery at 24V stores 2,400Wh — **twice the energy**. Always compare batteries in watt-hours for apples-to-apples.

#### Converting AC to DC Load

For AC devices running through an inverter:
- **1 Amp AC (120V) = ~10 Amps DC (12V)**
- Add 10-15% for inverter inefficiency
- Formula: DC Amps = (AC Watts / DC Voltage) x 1.1

Example: 600W microwave on 12V system = (600/12) x 1.1 = 55A DC draw

#### Series vs. Parallel Wiring

**Series (daisy-chain positive to negative):**
- Voltage adds up, current stays the same
- Two 12V/100Ah batteries in series = 24V/100Ah (2,400Wh)
- Two 20V/5A panels in series = 40V/5A (200W)
- If one panel is shaded, entire string output drops

**Parallel (all positives together, all negatives together):**
- Current adds up, voltage stays the same
- Two 12V/100Ah batteries in parallel = 12V/200Ah (2,400Wh)
- Two 20V/5A panels in parallel = 20V/10A (200W)
- Shaded panel doesn't affect others (much)

**Best practice for boats**: Use one MPPT controller per panel (or per pair) to minimize shading losses. Multiple smaller panels outperform fewer large panels on boats where shading from rigging, boom, and sails is inevitable.

#### System Voltage: 12V vs. 24V vs. 48V

| Feature | 12V | 24V | 48V |
|---------|-----|-----|-----|
| Common on | Boats < 40ft | Boats 40-60ft, new builds | Large yachts, electric drives |
| Wire gauge needed | Heaviest (most current) | Half the current of 12V | Quarter the current of 12V |
| Equipment availability | Most common | Good selection | Limited marine options |
| Voltage drop concerns | Worst (high current = more drop) | Better | Best |
| Battery count | Fewest cells | 2x cells in series | 4x cells in series |

**Why 24V is increasingly recommended**: A 2,000W load draws 167A at 12V but only 83A at 24V. The 12V system needs wire twice as thick (and twice as expensive/heavy) to carry that current without excessive voltage drop.

### 2.5 Battery Chemistry Deep Dive

#### Flooded Lead-Acid
- Cheapest upfront, widely available
- Must be upright, vented, and checked/watered regularly
- Voltage sag under load makes state-of-charge monitoring harder
- 50% DoD limit for reasonable cycle life (200-500 cycles to 50%)
- Heavy: ~60-70 lbs per 100Ah at 12V

#### AGM (Absorbed Glass Mat)
- Sealed, maintenance-free, can be mounted in any orientation
- Better cycle life than flooded (300-500 cycles to 50% DoD)
- Faster recharge acceptance than flooded
- More sensitive to overcharging (no way to add water)
- Heavy: ~60-65 lbs per 100Ah at 12V
- Cost: ~1.5-2x flooded

#### LiFePO4 (Lithium Iron Phosphate)
- 80-90% usable DoD for 2,000-5,000 cycles
- Flat voltage curve means steady power output until nearly empty
- Very fast charge acceptance (can absorb full solar output)
- Requires BMS (Battery Management System) for cell balancing and protection
- Cannot charge below 0C (32F) — critical for cold-weather sailing
- Light: ~25-30 lbs per 100Ah at 12V
- Cost: ~3-4x AGM upfront, but lowest cost per cycle over lifetime
- Compatible with Victron systems via Lynx Smart BMS or third-party BMS

#### Depth of Discharge and Cycle Life

This is the most misunderstood concept in marine electrical:

- **DoD** = percentage of capacity used before recharging
- Deeper discharges = fewer total cycles
- Lead-acid at 50% DoD: ~500 cycles. At 80% DoD: ~200 cycles.
- LiFePO4 at 80% DoD: ~3,000-5,000 cycles. At 50% DoD: ~7,000+ cycles.
- **Practical meaning**: If you cycle daily, lead-acid lasts ~1.5 years at 50% DoD. LiFePO4 lasts 8-14 years at 80% DoD.

#### C-Rate

C-rate describes charge/discharge rate relative to battery capacity:
- 1C = charge/discharge at full capacity rate (100Ah battery at 100A = 1 hour)
- 0.1C = charge/discharge at 1/10 capacity (100Ah battery at 10A = 10 hours)
- Lead-acid should be charged at 0.1-0.2C for longevity
- LiFePO4 can handle 0.5-1C charge rates
- **Solar relevance**: A 400W panel produces ~33A at 12V. For a 200Ah lead-acid bank, that's 0.16C (fine). For a 100Ah LiFePO4 bank, that's 0.33C (also fine).

---

## 3. Sizing Fundamentals

### 3.1 The Fundamental Sizing Equation

```
Required Solar (watts) = Daily Consumption (Wh) / (Peak Sun Hours x System Efficiency)
```

Where:
- **Daily Consumption** = sum of all loads (watts x hours per day)
- **Peak Sun Hours** = hours of equivalent 1,000 W/m2 irradiance (varies by location/season)
- **System Efficiency** = typically 0.65-0.80 (accounts for MPPT losses, wiring, temperature, angle, partial shading)

### 3.2 Step-by-Step Sizing Process

#### Step 1: Energy Audit

Create a detailed consumption worksheet:

| Device | Watts | Hours/Day | Wh/Day |
|--------|-------|-----------|--------|
| LED anchor light | 3W | 12h | 36 |
| LED cabin lights | 20W | 5h | 100 |
| Refrigerator | 50W | 12h (duty cycle) | 600 |
| Autopilot | 40W | 8h | 320 |
| Instruments/GPS | 15W | 12h | 180 |
| VHF radio (standby) | 2W | 24h | 48 |
| Laptop charging | 60W | 3h | 180 |
| Water pump | 60W | 0.5h | 30 |
| **Total** | | | **1,494 Wh** |

Convert to amp-hours: 1,494 Wh / 12V = 124.5 Ah/day

**Common consumption ranges for cruising sailboats:**
- Minimal (no fridge, LED only): 30-50 Ah/day (12V)
- Moderate (fridge, basic electronics): 80-120 Ah/day
- Comfortable (fridge, laptop, watermaker intermittent): 150-250 Ah/day
- High-tech (watermaker, AC, washing machine): 300-500 Ah/day

#### Step 2: Determine Peak Sun Hours

Peak Sun Hours (PSH) represent hours of equivalent 1,000 W/m2 irradiance. This normalizes varying sun intensity throughout the day.

**Typical PSH for popular cruising areas:**

| Location | Latitude | Summer PSH | Winter PSH | Annual Avg |
|----------|----------|------------|------------|------------|
| Caribbean | 12-18N | 5.5-6.5 | 5.0-6.0 | 5.5 |
| South Florida | 25N | 5.5-6.5 | 4.0-4.5 | 5.2 |
| Mediterranean (south) | 35-38N | 6.5-7.5 | 2.5-3.5 | 5.0 |
| Mediterranean (north) | 40-45N | 6.0-7.0 | 1.5-2.5 | 4.0 |
| Chesapeake Bay | 37-39N | 5.0-5.5 | 2.5-3.0 | 4.0 |
| Pacific NW / UK | 48-55N | 4.5-5.5 | 1.0-1.5 | 3.0 |
| Tropics (equatorial) | 0-10 | 5.0-6.0 | 5.0-6.0 | 5.5 |

**Seasonal variation**: Solar radiation can fall to 25-50% below yearly average in winter and 25-50% above in summer. This is the single biggest factor in sizing.

**Key insight**: East Coast USA receives roughly equivalent summer irradiance from Florida to Maine — it's the winter months that differ dramatically.

#### Step 3: Apply Derating Factors

Real-world output on a boat is significantly less than rated panel output:

| Factor | Typical Loss | Range | Notes |
|--------|-------------|-------|-------|
| Temperature | 10-15% | 5-25% | Panels lose ~0.4%/C above 25C; can reach 60-70C on deck |
| Panel angle (horizontal) | 5-15% | 0-25% | Flat-mounted panels lose ~7% in Florida, worse at higher latitudes |
| Shading (boom, rigging, sails) | 10-30% | 0-60% | Biggest variable; hard shading can kill entire string |
| Wiring/connection losses | 2-5% | 1-5% | Depends on wire gauge and run length |
| MPPT conversion | 2-5% | 0-10% | Modern MPPTs are 96-98% efficient; PWM much worse |
| Soiling/salt spray | 2-5% | 1-10% | Requires regular cleaning; salt spray is persistent |
| Module mismatch | 1-2% | 0-5% | Different panel orientations/shading patterns |
| Panel degradation | 0-10% | 0-20% | ~0.5%/year for quality panels |
| Motion/heeling | 3-8% | 0-15% | Passage making in rough seas |
| **Combined system efficiency** | **0.55-0.80** | | Use 0.65 as conservative default; 0.75 as typical |

**Composite derating guidance:**
- Best case (arch-mounted, tropics, no shading): 80%
- Typical (bimini-mounted, some rigging shade): 70-75%
- Worst case (deck-mounted, heavy rigging, higher latitudes): 55-65%

#### Sailing-Specific Derating Factors

| Factor | Impact | How to Handle |
|--------|--------|---------------|
| Panel angle (horizontal on boats) | -7% at 25N lat, worse at higher latitudes | Apply latitude-based angle loss factor |
| Rigging shading | Single shroud shadow can cut output 60% | Ask about mounting location; apply 10-30% shading derating |
| Sail shading (at anchor) | Boom/mainsail can shade panels | Note: at anchor, boom can be rigged out. Apply 5-15% |
| Salt spray / dirt | Gradual buildup reduces output | Apply 2-5% soiling factor |
| Temperature | High cell temps reduce voltage ~3V | Apply temperature coefficient based on location climate |
| Motion / heeling | Reduces effective angle to sun | Apply 5-10% motion derating |
| Partial shading cascade | Conventional panels lose disproportionate output | Recommend MPPT per panel or panels with bypass diodes |

#### Step 4: Calculate Required Panel Wattage

**Example**: 1,500 Wh/day consumption, Caribbean (5.5 PSH), 0.65 efficiency:

```
Required watts = 1,500 / (5.5 x 0.65) = 1,500 / 3.575 = 420W
```

**Same boat in winter Mediterranean (2.5 PSH)**:

```
Required watts = 1,500 / (2.5 x 0.65) = 1,500 / 1.625 = 923W
```

This illustrates why many cruisers size for their worst-case cruising ground, or accept needing supplemental charging (engine, generator) in winter at higher latitudes.

#### Step 5: Size the Battery Bank

**Lead-acid/AGM rule**: Battery bank (Ah) >= Daily consumption (Ah) x 2 x Days of autonomy
- The "x 2" accounts for 50% DoD limit
- Example: 125Ah/day x 2 x 2 days = 500Ah bank

**LiFePO4 rule**: Battery bank (Ah) >= Daily consumption (Ah) x 1.25 x Days of autonomy
- The "x 1.25" accounts for 80% DoD
- Example: 125Ah/day x 1.25 x 2 days = 312Ah bank

**General rule of thumb**: 1W of solar per 1Ah of battery capacity works well for 3-season cruising.

**Sweet spot for standard 440Ah battery bank**: 400-500W solar array.

#### Step 6: Select Charge Controller

Match MPPT to:
- Maximum PV open circuit voltage (Voc) of the array
- Maximum charging current needed
- Battery bank voltage

Use Victron's MPPT calculator or Explorist.life's calculator for precise matching.

### 3.3 Panel Configuration Considerations

**Series wiring** (higher voltage, same current):
- Reduces wire gauge requirements for long runs
- Entire string affected by worst-performing panel
- Shading on one panel reduces output of entire string

**Parallel wiring** (same voltage, higher current):
- Each panel operates independently
- Shaded panel doesn't affect others
- Requires heavier wire gauge

**Best practice for boats**: Use one MPPT controller per panel (or per pair) to minimize shading losses. Multiple smaller panels outperform fewer large panels on boats where shading from rigging, boom, and sails is inevitable.

---

## 4. Existing Solutions

### 4.1 Victron Energy MPPT Calculator

**URL:** https://www.victronenergy.com/mppt-calculator (also https://mppt.victronenergy.com/)

**Inputs:**
- PV panel model (from searchable database) or manual specs (Voc, Isc, Vmp, Imp, Pmax)
- PV panel configuration (series/parallel)
- Number of panels
- Battery bank voltage (12V/24V/48V)
- Location temperature extremes (for voltage compensation)

**Outputs:**
- Recommended MPPT charge controller model(s)
- Array voltage range (temperature-compensated)
- Maximum charging current
- Compatibility warnings / safety limits
- Alternative MPPT models that could also work

**UX Assessment:**
- Loads dynamically via JavaScript (SPA-style)
- Available in 13 languages
- Responsive/mobile-friendly design
- Tooltips for guidance
- Remembers last session
- **Strength:** Focused on one thing (controller sizing) and does it well. Real panel database. Temperature compensation.
- **Weakness:** Only solves "which MPPT?" — doesn't help with "how much solar do I need?" No energy audit, no location-based sun hour data, no battery sizing. Assumes significant user knowledge (Voc, Isc, temperature coefficients). No appliance/load calculation built in.

### 4.2 Explorist.life Solar Charge Controller Calculator

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
- **Strength:** Visual wiring diagrams make abstract concepts tangible. Easy/Exact mode split accommodates beginners and experts. Recommends specific Victron products. Good educational content alongside tools.
- **Weakness:** Calculator was marked "Offline/in progress" at one point — reliability concern. Heavy jargon (Voc, Isc) without inline definitions. No load calculation — controller-sizing only. More RV/van-oriented than marine-specific. No location-based solar data.

### 4.3 BatteryStuff Solar Calculator

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
- **Strength:** Comprehensive end-to-end calculation (loads → batteries → panels). Built-in safety margins. Educational.
- **Weakness:** Requires manual AC-to-DC conversion — no inverter loads. No appliance presets — user must know their DC watt draw. Steep learning curve; "educational purposes only" disclaimer. No visual output — just numbers in a table. Originally designed for 12V, inaccuracies at other voltages. Requires user to know sun hours (no location lookup). Weather multiplier is crude. No MPPT vs PWM guidance. DC-only input.

### 4.4 Renogy Super Solar Calculator

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
- **Strength:** Drag-and-drop appliance selection is intuitive and engaging. Pre-loaded appliance database with sensible defaults. Location-based solar generation estimates. Direct product recommendations with purchase links. Saveable/shareable configurations.
- **Weakness:** Tied to Renogy product catalog — not brand-agnostic. RV/van-focused, not marine-specific. Loads via JavaScript — content not accessible without JS.

### 4.5 Custom Marine Products Solar Panel Sizing Tool

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
- **Strength:** One of the few truly marine-focused tools. Includes voltage considerations. Paired with detailed educational guides.
- **Weakness:** Relies on external PDF/spreadsheet — not a self-contained web tool. Basic interface. Limited documentation on methodology.

### 4.6 eMarine Systems Sizing Guide

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
- **Strength:** Marine-specific context and terminology. Separate winter vs. yearly calculations (important for cruisers).
- **Weakness:** Static guide, not interactive calculator. Appliance list is generic (not sailing-specific).

### 4.7 Other Notable Tools

- **AllSolarCalculators.com Boat Calculator** (allsolarcalculators.com/calculators/specialized/boat): Dedicated boat/yacht/sailboat solar system design. Marine-specific but limited methodology detail.
- **Best Marine Gear Calculator** (bestmarinegear.shop): Calculates wattage and panel count from daily consumption and peak sun hours
- **The Boat Galley Guide** (theboatgalley.com): Educational content on power needs calculation
- **Coastal Climate Control Solar Planning Guide**: Detailed 10-factor analysis of marine solar performance
- **Android App "Boat Solar Panel Calculator"**: Mobile app for solar sizing and battery analysis (discussed on Cruisers Forum)

### 4.8 Summary: What Existing Tools Do Well

1. **Component selection** (especially Victron's MPPT calculator)
2. **Basic load calculation** (most offer some version of an energy audit)
3. **Educational content** alongside the tools

### 4.9 Summary: What Existing Tools Do Poorly

1. **No location-aware solar data**: Almost none automatically look up sun hours for a given location. Users must know or research this themselves.
2. **No route-based analysis**: Sailors move between locations. No tool asks "what's your cruising itinerary?" and sizes for the worst month/location.
3. **No seasonal modeling**: Most use a single "sun hours" number rather than showing month-by-month production vs. consumption.
4. **No battery chemistry comparison**: Tools assume one battery type rather than showing "here's what you need with AGM vs. LiFePO4."
5. **No shading estimation**: The biggest real-world variable is ignored or left as a manual percentage.
6. **No visualization**: Results are numbers in a table, not visual system diagrams.
7. **No "what if" scenarios**: Can't easily compare "what if I add 200W more?" or "what if I switch to 24V?"
8. **Not mobile-friendly**: Several tools are desktop-only or have poor mobile UX.
9. **No integration with real equipment databases**: Most require manual entry of panel specs.
10. **No cost estimation**: Don't help with budgeting the installation.

### 4.10 Key Gaps Across All Existing Tools

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

## 5. Design & UX Strategy

### 5.1 Two-Tool Architecture

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

### 5.2 Collecting Power Consumer Data

**Recommended Approach: Pre-loaded appliance catalog with smart defaults**

Best pattern (inspired by Renogy but improved):
1. Present categorized appliance cards (not a dropdown)
2. Each card shows: icon, name, typical wattage, and a toggle to add
3. Tap to add — appears in "My Boat" list with editable defaults
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

### 5.3 Shopping List Output

**Recommended format:**
```
+-------------------------------------+
|  YOUR DAILY ENERGY BUDGET           |
|  ================================== |
|  Consumption: 185 Ah/day (2,220 Wh) |
|  Generation:  210 Ah/day (2,520 Wh) |
|  Balance:     +25 Ah surplus        |
+-------------------------------------+

RECOMMENDED SYSTEM:
+------------------+------------------+
| Solar Panels     | Battery Bank     |
| 3x 100W rigid    | 2x 100Ah LiFePO4|
| 300W total       | 200Ah total      |
|                  | 100Ah usable     |
+------------------+------------------+
| Charge Controller| Inverter         |
| 30A MPPT         | 2000W pure sine  |
| (e.g. Victron    | (if AC loads)    |
|  SmartSolar)     |                  |
+------------------+------------------+
```

**Key principles:**
- Show the "why" — explain each recommendation in plain language
- Size options: "Minimum viable" / "Recommended" / "Comfortable margin"
- Cost estimate range (budget / mid-range / premium)
- Link to generic product types, not specific brands
- Exportable as PDF for sharing with marine electricians

### 5.4 Generation Calculator Inputs

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

### 5.5 Generation Calculator Outputs

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

### 5.6 Daily Energy Balance Visualization

**Primary visualization: 24-hour energy flow chart**
```
Generation (green fill, bell curve)
    /‾‾‾‾‾‾‾‾‾‾‾‾\
   /                \
--/------------------\-----------
  ████████████████████████████   <-- Baseload (fridge, always-on)
  ▓▓▓▓▓▓▓▓          ▓▓▓▓▓▓▓▓   <-- Active use (daytime vs evening)

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

**Alternative/complement: Simple bar chart**
- Side-by-side bars for each category: generation vs. consumption
- Clear surplus/deficit indicator
- Color-coded: green (surplus), yellow (tight), red (deficit)

### 5.7 Assumptions vs. User Inputs

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

### 5.8 Interactive Controls

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

### 5.9 Real-Time Results Updating

**Pattern: Live calculation with debounced updates**
- Results panel stays visible (sticky on desktop, collapsible on mobile)
- All outputs update within 100ms of input change
- No "Calculate" button — results are always current
- Subtle animation on value changes (count-up/down)
- Color transitions: green → yellow → red as system approaches limits

### 5.10 Mobile-First Considerations

- **Card-based layout** for appliance selection (swipeable)
- **Bottom sheet** for results (pull up to see details)
- **Thumb-zone navigation** — primary actions in lower 40% of screen
- **Progressive disclosure** — don't show all 30+ appliances at once
- **Offline capability** — cache irradiance data for common locations
- **Minimum 16px body text**, 14px for secondary
- **Touch targets** minimum 44x44px

### 5.11 Dark Mode

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

### 5.12 Design Inspiration Sources

- **Renogy Super Solar Calculator** — best appliance selection UX (drag and drop)
- **Explorist.life** — best progressive disclosure (Easy/Exact modes)
- **NYT Buy vs Rent Calculator** — gold standard for interactive financial calculators with sliders
- **Tesla Powerwall Calculator** — clean, product-focused output
- **BatteryStuff** — most comprehensive calculation engine (but worst UX)
- **Behance "Solar Calculator UI Design"** — visual design patterns for the category

---

## 6. Appliance Power Database

### 6.1 Complete Appliance Database

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

### 6.2 Typical Daily Consumption Profiles

| Cruising Style | Daily Ah @12V | Daily Wh | Key Consumers |
|----------------|--------------|----------|---------------|
| Minimal (weekend sailor) | 30-60 | 360-720 | Lights, instruments, phone charging |
| Moderate (coastal cruiser) | 80-150 | 960-1,800 | + fridge, VHF, laptop, fans |
| Comfort cruiser | 150-250 | 1,800-3,000 | + watermaker, autopilot, entertainment |
| High-tech liveaboard | 250-400 | 3,000-4,800 | + Starlink, larger fridge, inverter loads |
| Passage making | 200-350 | 2,400-4,200 | + radar, AIS, autopilot 24/7, running lights |

### 6.3 "Always On" vs Intermittent Classification

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

## 7. Irradiance Data Sources

### 7.1 PVGIS (Photovoltaic Geographical Information System) — Primary Recommended Source

**Provider**: European Commission Joint Research Centre
**URL**: https://re.jrc.ec.europa.eu/pvgis/
**Cost**: Free

**API Details:**
- Base URL: `https://re.jrc.ec.europa.eu/api/v5_3/`
- Method: GET only
- Rate limit: 30 calls/second per IP
- Output formats: CSV, JSON, PDF

**Key Endpoints:**

| Endpoint | Tool Name | Purpose |
|----------|-----------|---------|
| Monthly radiation | `MRcalc` | Monthly average irradiance for a location |
| Hourly radiation | `seriescalc` | Full hourly time series |
| Daily radiation | `DRcalc` | Daily profiles |
| PV performance | `PVcalc` | Grid-connected PV output estimate |
| Off-grid | `SHScalc` | Off-grid system with battery modeling |
| TMY | `tmy` | Typical Meteorological Year |

**Monthly Radiation Example Query:**
```
https://re.jrc.ec.europa.eu/api/v5_3/MRcalc?lat=25.76&lon=-80.19&horirrad=1&optrad=1&outputformat=json
```

**Parameters for monthly radiation:**
- `lat`, `lon`: Location (decimal degrees)
- `horirrad=1`: Horizontal plane irradiation
- `optrad=1`: Optimal angle plane irradiation
- `selectrad=1`: Specific angle irradiation
- `angle`: Inclination angle (degrees)
- `mr_dni=1`: Direct normal irradiation
- `d2g=1`: Diffuse-to-global ratio
- `avtemp=1`: Monthly temperature averages
- `outputformat`: csv, basic, json

**Data Sources:**
- PVGIS-SARAH3: Europe, Central Asia, Africa, South America (satellite, ~5km resolution)
- PVGIS-ERA5: Global coverage (reanalysis, ~25km resolution)
- PVGIS-NSRDB: Americas (2005-2015 historical)
- Temporal coverage: 2005-2023

**Strengths for marine use:** Global coverage, free API, monthly/hourly data, JSON output, well-documented
**Weaknesses:** Rate limited, European-centric documentation, no marine-specific adjustments (horizontal panel angle, boat motion), resolution may miss coastal microclimate variations

### 7.2 NREL PVWatts V8 API — Secondary / US-Specific

**Provider**: National Renewable Energy Laboratory (US)
**URL**: https://developer.nrel.gov/docs/solar/pvwatts/v8/
**Cost**: Free with API key (DEMO_KEY available)
**Rate limit**: 1,000 requests/hour

US coverage primary, international via TMY data. Uses 2020 TMY data from National Solar Radiation Database (NSRDB).

**Required inputs:**
- `system_capacity` (kW)
- `module_type` (0=Standard, 1=Premium, 2=Thin film)
- `losses` (%)
- `array_type` (0-4)
- `tilt` (degrees)
- `azimuth` (degrees)
- `lat`/`lon`

**Optional inputs:**
- `dc_ac_ratio` (default 1.2)
- `inverter_efficiency` (default 96%)
- `timeframe` (monthly or hourly)

**Outputs:** Monthly/annual AC output (kWh), plane-of-array irradiance, capacity factor, hourly data

**Strengths:** High-quality US data, well-documented API
**Weaknesses:** US-centric, requires registration

### 7.3 NASA POWER (Prediction of Worldwide Energy Resources)

**Provider**: NASA Langley Research Center
**URL**: https://power.larc.nasa.gov/
**Cost**: Free

**Access methods:**
- Data Access Viewer (DAV): Web UI for subsetting/visualization
- REST API: Programmatic access
- GIS Services: ArcGIS integration

**Key features:**
- 300+ solar and meteorological parameters
- Global coverage
- Based on satellite observations and atmospheric models
- Parameters include: all-sky surface shortwave downward irradiance, clear-sky irradiance, temperature, wind, humidity

**API endpoint:**
```
https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=ALLSKY_SFC_SW_DWN&community=RE&longitude=-80.19&latitude=25.76&start=2001&end=2020&format=JSON
```

**Strengths:** Extremely comprehensive parameter catalog, long historical record, NASA credibility
**Weaknesses:** More complex API, oriented toward researchers rather than consumer tools

### 7.4 Global Solar Atlas

**Provider**: World Bank / Solargis
**URL**: https://globalsolaratlas.info/
**Cost**: Free for basic data

**Features:**
- Interactive map with solar resource data globally
- Click-to-query any location
- GHI, DNI, DIF, temperature data
- PV power potential estimates

**Strengths:** Excellent visualization, easy to use, good for quick lookups
**Weaknesses:** No documented public API for programmatic access

### 7.5 NREL Solar Resource Data API

**Provider**: National Renewable Energy Laboratory (US)
**URL**: https://developer.nrel.gov/docs/solar/
**Cost**: Free with API key

**Features:**
- US-focused but also covers some international locations
- Solar resource data by location
- Integration with NSRDB (National Solar Radiation Database)

**API key required**: Yes (free registration)

**Strengths:** High-quality US data, well-documented API
**Weaknesses:** US-centric, requires registration

### 7.6 SolarGIS

**Provider**: Solargis (commercial)
**URL**: https://solargis.com/
**Cost**: Commercial (paid API), some free data via Global Solar Atlas

**Features:**
- Highest resolution commercial solar data
- 15-minute to hourly temporal resolution
- 250m spatial resolution in some regions
- Bankable data for project financing

**Strengths:** Highest quality, best resolution
**Weaknesses:** Expensive, overkill for consumer marine applications

### 7.7 Forecast.Solar

**Provider**: Open-source project
**URL**: https://forecast.solar/
**Cost**: Free tier available

**Features:**
- Combines PVGIS historical data with weather forecasts
- Provides solar production forecasts
- REST API

**Strengths:** Forward-looking (forecast, not just historical), free tier
**Weaknesses:** Designed for fixed installations, not moving boats

### 7.8 Data.GISS (NASA Goddard)

**URL**: https://data.giss.nasa.gov/modelE/ar5plots/srlocat.html
**Cost**: Free

**Features:**
- Insolation data at specified locations
- Based on atmospheric models

### 7.9 Recommended Data Strategy for Above Deck

**Primary data source**: PVGIS API (v5.3) via `MRcalc` endpoint
- Free, no API key needed
- Global coverage
- Monthly resolution is ideal for seasonal planning
- JSON output for easy integration
- Well-documented, stable API

**Secondary/validation source**: NASA POWER
- Cross-reference PVGIS data
- Access additional meteorological parameters (wind, temperature) useful for derating calculations

**For US-specific high-resolution data**: NREL Solar Resource API

**Fallback**: NREL PVWatts as fallback for US locations (better US-specific data)

**Implementation approach:**
1. User enters cruising locations (or selects from popular routes)
2. Query PVGIS `MRcalc` for monthly horizontal irradiance at each location
3. Apply marine-specific derating factors (horizontal mounting, temperature, shading estimate)
4. Show month-by-month solar production vs. consumption
5. Highlight deficit months where supplemental charging is needed
6. Size the system for user's chosen design month/location

**Caching strategy:** Cache results aggressively — irradiance data doesn't change frequently. Allow manual sun-hours override for areas with poor data coverage.

---

## 8. Implementation

### 8.1 Technical Architecture

- **Frontend:** React islands within Astro (consistent with project stack), real-time calculation (no server round-trips for basic math)
- **Solar data:** PVGIS API for irradiance, with caching layer
- **Appliance database:** Static JSON with ~50 pre-loaded marine appliances
- **State management:** URL-encoded state for shareable calculator links
- **Charts:** Recharts (lightweight, good mobile performance, already in project stack)
- **Offline:** Service worker to cache app shell and irradiance data for visited locations

### 8.2 MVP Phases

**Phase 1 (MVP):**
- Pre-loaded marine appliance catalog (30+ devices with defaults)
- Anchor vs passage mode toggle
- Location-based solar irradiance (PVGIS)
- Daily energy balance visualization
- Component sizing recommendations (panels, batteries, controller)
- Mobile-responsive, dark mode

**Phase 2:**
- Monthly/seasonal generation estimates
- Shareable/saveable configurations
- PDF export of results
- Cost estimate ranges
- Wire sizing calculator add-on

**Phase 3:**
- Real-world panel database (specific products with specs)
- Integration with vessel profile (if user has a boat in the system)
- Community-contributed consumption profiles ("boats like yours use X")
- Route-based solar planning (estimate generation along a passage route)

---

## 9. Educational Content Opportunities

### 9.1 Tier 1: Essential Foundations (Most Requested)

1. **"Watts, Amps, and Volts Explained for Sailors"**
   - Water analogy that actually sticks
   - Why watt-hours matter more than amp-hours
   - Converting between units with boat-specific examples

2. **"How to Do an Energy Audit on Your Boat"**
   - Device-by-device worksheet with typical consumption data pre-filled
   - How to measure actual consumption (vs. nameplate ratings)
   - Common surprises (fridge duty cycles, phantom loads, anchor light overnight)

3. **"Solar Panel Types: What Works on Boats"**
   - Rigid vs. flexible vs. semi-rigid with real longevity data
   - Why shade tolerance matters more on boats than houses
   - Mounting options with photos/diagrams for different boat types

4. **"Battery Chemistry for Sailors: AGM vs. LiFePO4"**
   - Side-by-side comparison with real cost-per-year calculations
   - When AGM still makes sense (budget, cold climates, simple systems)
   - LiFePO4 transition guide (what else needs to change in your system)

### 9.2 Tier 2: System Design (Planning Phase)

5. **"Sizing Solar for Your Cruising Ground"**
   - Location-specific sun hour data for popular cruising areas
   - Month-by-month production charts
   - "Size for your worst month" vs. "accept supplemental charging" trade-offs

6. **"12V vs. 24V: Which System Voltage?"**
   - Wire gauge comparison table
   - Equipment availability at each voltage
   - When to convert (and when it's not worth it)

7. **"Series vs. Parallel: Wiring Your Solar Array"**
   - When to use each (hint: parallel is usually better on boats)
   - Shading impact diagrams
   - One controller per panel vs. strings

8. **"Choosing a Charge Controller: MPPT vs. PWM"**
   - Real-world performance comparison (not just manufacturer claims)
   - When PWM is "good enough"
   - How to match MPPT to your array

### 9.3 Tier 3: Advanced Topics (Upgrade Phase)

9. **"Complete System Wiring Diagrams"**
   - Typical configurations for 30ft, 40ft, 50ft sailboats
   - Component connection order and fusing
   - Wire sizing for common runs

10. **"Monitoring Your System: What the Numbers Mean"**
    - Reading a battery monitor
    - State of charge vs. voltage
    - Diagnosing common problems from monitoring data

11. **"Shore Power, Alternator, and Solar: Making Them Work Together"**
    - Charging priority and conflict resolution
    - Alternator regulators for lithium systems
    - Managing shore power vs. solar charging

12. **"Upgrading from Lead-Acid to Lithium: A Step-by-Step Guide"**
    - What components need to change
    - BMS selection and integration
    - Alternator protection
    - Cost-benefit analysis with real numbers

### 9.4 Content Format Recommendations

- **Interactive calculators** over static articles (sailors want answers, not just education)
- **Before/after case studies** from real boats with real consumption data
- **Decision trees** ("Do you have X? Then you need Y")
- **Visual system diagrams** that can be customized to their boat
- **Location-specific data** automatically pulled from irradiance databases
- **Comparison tables** with real pricing

---

## 10. Sources

### Marine Solar Systems & Victron
- [Victron Energy - Sailing Yacht](https://www.victronenergy.com/markets/marine/sailing-yacht)
- [Victron Energy - Solar Charge Controllers](https://www.victronenergy.com/solar-charge-controllers)
- [Victron MPPT Calculator](https://mppt.victronenergy.com/)
- [Victron Marine System Booklet (PDF)](https://www.victronenergy.com/upload/documents/Booklet-Marine-Systems-EN.pdf)
- [Victron - Solar Panels: The Quiet Sailing Solution](https://www.victronenergy.com/blog/2017/08/14/solar-panels-the-quiet-sailing-solution/)

### Calculators & Tools
- [Explorist.life - Solar Charge Controller Calculator](https://explorist.life/solar-charge-controller-calculator/)
- [Explorist.life - Calculators](https://explorist.life/category/blog/calculators/)
- [BatteryStuff Solar Calculator](https://www.batterystuff.com/kb/tools/solar-calculator.html)
- [Renogy Super Solar Calculator](https://super-solar-calculator.renogy-dchome.com/)
- [Custom Marine Products - Solar Panel Sizing Calculator](https://www.custommarineproducts.com/marine-solar-panel-sizing-calculator-tool.html)
- [Custom Marine Products - Select and Size Solar System](https://www.custommarineproducts.com/select-and-size-solar-system.html)
- [Custom Marine Products - Rigid Marine Solar Panels](https://www.custommarineproducts.com/rigid-marine-solar-panels.html)
- [eMarine Systems Sizing Guide](https://www.emarineinc.com/Sizing-Your-Marine-Solar-System)
- [AllSolarCalculators - Boat Solar Calculator](https://www.allsolarcalculators.com/calculators/specialized/boat)

### Battery & Electrical
- [Battle Born Batteries - Lead Acid vs Lithium for Sailboats](https://battlebornbatteries.com/lead-acid-vs-lithium-batteries-for-sailboats-other-marine-vessels/)
- [Battle Born Batteries - Watt Hours to Amp Hours](https://battlebornbatteries.com/watt-hours-to-amp-hours/)
- [ACE Battery - LiFePO4 vs AGM Marine Batteries](https://www.acebattery.com/blogs/lifepo4-vs-agm-marine-batteries-which-powers-your-boat-best)
- [MANLY Battery - AGM vs LiFePO4 Sailboat Upgrade](https://manlybattery.com/agm-vs-lifepo4-sailboat-electrical-upgrade/)
- [West Marine - Sizing Your House Battery Bank](https://www.westmarine.com/WestAdvisor/Sizing-Your-House-Battery-Bank)

### Solar Planning & Education
- [Coastal Climate Control - Marine Solar Planning Guide](https://www.coastalclimatecontrol.com/blog/marine-solar-panel-planning-guide)
- [The Boat Galley - How Much Solar Power Do You Need?](https://theboatgalley.com/how-much-solar-power-do-you-need/)
- [Practical Sailor - Estimating Solar Panel Size for Boats](https://www.practical-sailor.com/blog/estimating-solar-panel-size-for-boats)
- [Open Waters Solar - Shading Effects](https://openwaterssolar.com/blogs/posts/the-effects-of-shading-on-marine-solar-panels)
- [Commuter Cruiser - Amp Usage](http://commutercruiser.com/how-to-calculate-amp-usage-aboard-a-boat/)
- [When Sailing - Electrical Needs](https://www.whensailing.com/blog/electrical-needs-cruising-sailboat-power-consumption)
- [Bluwater Cruising - Battery Power](https://currents.bluewatercruising.org/article/how-much-battery-power-is-enough/)
- [Morgan's Cloud - Cruising Electrical System Design](https://www.morganscloud.com/2019/01/09/cruising-boat-house-electrical-system-design-part-1-loads-and-conservation/)
- [Gerbers UnderWay - Energy Budget Guide](https://gerbersunderway.com/simple-guide-for-calculating-your-sailboats-energy-budget/)
- [Renogy - How to Use Solar Calculator](https://www.renogy.com/blog/solar-calculator-how-to/)

### Irradiance Data
- [PVGIS - EU Joint Research Centre](https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis_en)
- [PVGIS API Documentation](https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/getting-started-pvgis/api-non-interactive-service_en)
- [PVGIS User Manual](https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/getting-started-pvgis/pvgis-user-manual_en)
- [NREL PVWatts V8 API](https://developer.nrel.gov/docs/solar/pvwatts/v8/)
- [NREL Solar Resource Data API](https://developer.nrel.gov/docs/solar/solar-resource-v1/)
- [NASA POWER](https://power.larc.nasa.gov/)
- [Global Solar Atlas](https://globalsolaratlas.info/)
- [Forecast.Solar](https://forecast.solar/)

### UX & Design
- [Smashing Magazine - Slider UX](https://www.smashingmagazine.com/2017/07/designing-perfect-slider/)
- [Eleken - Slider UI Examples](https://www.eleken.co/blog-posts/slider-ui)
- [NN/g - Slider Design](https://www.nngroup.com/articles/gui-slider-controls/)
