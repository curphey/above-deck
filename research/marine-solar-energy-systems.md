# Marine Solar Energy Systems for Sailing Yachts

## Comprehensive Research Document

**Date:** 2026-03-09

---

## Table of Contents

1. [Victron Energy's Marine Solar Approach](#1-victron-energys-marine-solar-approach)
2. [How Marine Solar Systems Work](#2-how-marine-solar-systems-work)
3. [Solar Sizing for Boats](#3-solar-sizing-for-boats)
4. [Common Electrical Knowledge for Sailors](#4-common-electrical-knowledge-for-sailors)
5. [Existing Solar Calculators and Tools](#5-existing-solar-calculators-and-tools)
6. [Educational Content Opportunities](#6-educational-content-opportunities)
7. [Solar Irradiance Data Sources](#7-solar-irradiance-data-sources)

---

## 1. Victron Energy's Marine Solar Approach

### Overview

Victron Energy is the dominant brand in marine power systems, particularly for cruising sailboats. Their marine page positions solar as part of a **hybrid energy ecosystem** combining shore power, engine alternators, solar generation, and battery storage. Their marketing tagline for solar sailing is "the sound of silence" -- maintaining onboard comfort without generator noise.

### Product Lines for Marine Solar

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
- **MultiPlus**: The heart of the system -- charges batteries from shore power AND inverts battery power to AC
- Features PowerControl (prevents shore power overload) and PowerAssist (uses battery as buffer during peak demand)
- MultiPlus 12/500 recommended for normal sailing yacht use

**Battery Monitors**
- BMV-712 Smart (standalone)
- Lynx Smart BMS (for lithium systems)

**Other Components**
- BatteryProtect for discharge protection
- Cerbo GX for system monitoring/display
- VRM Portal for remote monitoring

### System Configurations (from Victron's sailing yacht examples)

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

### Victron's Key Recommendation

Victron **strongly recommends 24V systems for new boats**, stating that higher voltage is simply a better choice for meeting the power demands of a modern sailing yacht. This reduces current (and thus wire gauge requirements) for the same power delivery.

### Educational Resources

- **MPPT Calculator** (mppt.victronenergy.com): Online tool with PV module database, temperature compensation, multi-language support. Recommends specific MPPT models.
- **Marine System Booklet**: Downloadable PDF with configuration examples and wiring diagrams
- **Wiring Unlimited Manual**: Comprehensive installation guide
- **VictronConnect App**: Configuration and monitoring via Bluetooth
- **Victron Community Forum**: Active user support

### How Victron Explains Solar to Sailors

Victron focuses on practical outcomes rather than deep electrical theory:
- Solar extends autonomy without engine noise
- Solar is "free" energy after initial investment
- Their tools (MPPT calculator, system examples) guide product selection rather than teaching electrical engineering
- They emphasize the complete system approach: solar is one input alongside shore power and alternator

---

## 2. How Marine Solar Systems Work

### System Architecture

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

### Component Details

#### 1. Solar Panels

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

#### 2. Charge Controllers

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

#### 3. Battery Bank

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

#### 4. Inverter/Charger (Combi)

Dual-purpose device:
- **Inverter mode**: Converts 12/24/48V DC to 120/230V AC for household appliances
- **Charger mode**: Converts shore power AC to DC for battery charging
- **Transfer switch**: Automatically switches between shore power and inverter

Key specs: continuous power rating (watts), surge rating, charging current (amps).

#### 5. Shore Power Charger

If not using an inverter/charger combo, a standalone charger converts marina AC power to DC battery charging. Multi-stage charging profiles (bulk, absorption, float) protect battery health.

#### 6. Battery Monitor

Essential for knowing state of charge. Measures:
- Voltage
- Current (via shunt)
- Consumed amp-hours
- State of charge (%)
- Time remaining
- Historical data (deepest discharge, cycles)

Victron BMV-712 Smart or SmartShunt are the most popular in the cruising community.

### Typical Cruising Sailboat Configurations

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

---

## 3. Solar Sizing for Boats

### The Fundamental Sizing Equation

```
Required Solar (watts) = Daily Consumption (Wh) / (Peak Sun Hours x System Efficiency)
```

Where:
- **Daily Consumption** = sum of all loads (watts x hours per day)
- **Peak Sun Hours** = hours of equivalent 1,000 W/m2 irradiance (varies by location/season)
- **System Efficiency** = typically 0.65-0.80 (accounts for MPPT losses, wiring, temperature, angle, partial shading)

### Step-by-Step Sizing Process

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

**Key insight**: East Coast USA receives roughly equivalent summer irradiance from Florida to Maine -- it's the winter months that differ dramatically.

#### Step 3: Apply Derating Factors

Real-world output on a boat is significantly less than rated panel output:

| Factor | Typical Loss | Notes |
|--------|-------------|-------|
| Temperature | 10-15% | Panels lose ~0.4%/C above 25C; can reach 60-70C on deck |
| Panel angle (horizontal) | 5-15% | Flat-mounted panels lose ~7% in Florida, more at higher latitudes |
| Shading (boom, rigging, sails) | 10-30% | Biggest variable; hard shading can kill entire string |
| Wiring losses | 2-5% | Depends on wire gauge and run length |
| MPPT conversion | 2-5% | Modern MPPTs are 96-98% efficient |
| Soiling/salt spray | 2-5% | Requires regular cleaning |
| **Combined system efficiency** | **0.55-0.75** | Use 0.65 as conservative default |

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

### Panel Configuration Considerations

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

## 4. Common Electrical Knowledge for Sailors

### Fundamental Units

| Unit | Symbol | What It Measures | Water Analogy |
|------|--------|-----------------|---------------|
| Volt | V | Electrical pressure | Water pressure |
| Amp | A | Current flow rate | Flow rate (gallons/min) |
| Watt | W | Power (rate of energy use) | Work being done |
| Amp-hour | Ah | Charge stored/consumed | Gallons in tank |
| Watt-hour | Wh | Energy stored/consumed | Total work capacity |

### Key Formulas

```
Watts = Volts x Amps
Amps = Watts / Volts
Watt-hours = Watts x Hours
Amp-hours = Amps x Hours
Watt-hours = Amp-hours x Voltage
```

**Critical insight**: Amp-hours are voltage-dependent. A 100Ah battery at 12V stores 1,200Wh. A 100Ah battery at 24V stores 2,400Wh -- **twice the energy**. Always compare batteries in watt-hours for apples-to-apples.

### Converting AC to DC Load

For AC devices running through an inverter:
- **1 Amp AC (120V) = ~10 Amps DC (12V)**
- Add 10-15% for inverter inefficiency
- Formula: DC Amps = (AC Watts / DC Voltage) x 1.1

Example: 600W microwave on 12V system = (600/12) x 1.1 = 55A DC draw

### Series vs. Parallel Wiring

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

### System Voltage: 12V vs. 24V vs. 48V

| Feature | 12V | 24V | 48V |
|---------|-----|-----|-----|
| Common on | Boats < 40ft | Boats 40-60ft, new builds | Large yachts, electric drives |
| Wire gauge needed | Heaviest (most current) | Half the current of 12V | Quarter the current of 12V |
| Equipment availability | Most common | Good selection | Limited marine options |
| Voltage drop concerns | Worst (high current = more drop) | Better | Best |
| Battery count | Fewest cells | 2x cells in series | 4x cells in series |

**Why 24V is increasingly recommended**: A 2,000W load draws 167A at 12V but only 83A at 24V. The 12V system needs wire twice as thick (and twice as expensive/heavy) to carry that current without excessive voltage drop.

**Victron's position**: 24V strongly recommended for all new sailing yachts.

### Battery Chemistry Deep Dive

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
- Cannot charge below 0C (32F) -- critical for cold-weather sailing
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

## 5. Existing Solar Calculators and Tools

### Victron MPPT Calculator

**URL**: https://mppt.victronenergy.com/

**What it does:**
- Helps select the right Victron MPPT charge controller for a given panel array
- Contains a database of PV modules (searchable)
- Temperature compensation for cold/hot conditions
- Shows alternative MPPT models that could also work
- Available in 13 languages, responsive design
- Remembers last session

**Inputs:**
- Solar panel model (from database) or manual specs (Voc, Isc, Vmp, Imp, Pmax)
- Number of panels, series/parallel configuration
- Battery voltage (12V, 24V, 48V)
- Location temperature extremes (for voltage compensation)

**Outputs:**
- Recommended MPPT model(s)
- Array voltage range (temperature-compensated)
- Maximum charging current
- Warnings for safety limits

**Strengths:** Excellent for MPPT selection, real panel database, temperature compensation
**Weaknesses:** Only solves "which MPPT?" -- doesn't help with the bigger question of "how much solar do I need?" No energy audit, no location-based sun hour data, no battery sizing.

### BatteryStuff Solar Calculator

**URL**: https://www.batterystuff.com/kb/tools/solar-calculator.html

**What it does:**
- End-to-end sizing from loads to panel count

**Inputs:**
- DC watt demand of each device
- Operating hours per day
- System voltage (12V, 24V, 36V, 48V)
- Desired backup days
- Battery Ah rating
- Depth of discharge (default 50%)
- Direct sunlight hours
- Weather multiplier (default 1.55)
- Panel wattage

**Outputs:**
- Total daily Wh consumed
- Required Ah capacity
- Number of batteries needed (parallel/series)
- Number of solar panels needed

**Strengths:** Simple, covers the full system, educational
**Weaknesses:** Originally designed for 12V, inaccuracies at other voltages. Requires user to know sun hours (no location lookup). Weather multiplier is crude. No MPPT vs PWM guidance. "For educational purposes only" disclaimer. DC-only input (must manually convert AC loads).

### Explorist.life Calculators

**URL**: https://explorist.life/category/blog/calculators/

**Available tools:**
- Solar Charge Controller Calculator (inputs: Voc, Isc, panel wattage, battery voltage, temperature; outputs: recommended controller, array voltage, safety warnings)
- Wire Sizing Calculator (amps, voltage, allowable voltage drop, circuit length)
- Various component-specific calculators

**Strengths:** Well-designed UI, good educational content alongside tools, covers mobile/marine/off-grid, recommends specific Victron products
**Weaknesses:** Focuses on individual components rather than whole-system design. More RV/van-oriented than marine-specific. No location-based solar data.

### Custom Marine Products Calculator

**URL**: https://www.custommarineproducts.com/marine-solar-panel-sizing-calculator-tool.html

**What it does:**
- Marine-specific solar panel sizing
- Includes variable voltage systems

**Strengths:** Marine-focused, includes voltage considerations, paired with detailed educational guides
**Weaknesses:** Limited documentation on methodology

### AllSolarCalculators.com Boat Calculator

**URL**: https://www.allsolarcalculators.com/calculators/specialized/boat

**What it does:**
- Dedicated boat/yacht/sailboat solar system design
- Estimates energy production

**Strengths:** Marine-specific
**Weaknesses:** Limited detail available on methodology

### Other Notable Tools

- **Best Marine Gear Calculator** (bestmarinegear.shop): Calculates wattage and panel count from daily consumption and peak sun hours
- **eMarine Systems Sizing Guide** (emarineinc.com): Step-by-step sizing worksheet
- **The Boat Galley Guide** (theboatgalley.com): Educational content on power needs calculation
- **Coastal Climate Control Solar Planning Guide**: Detailed 10-factor analysis of marine solar performance
- **Android App "Boat Solar Panel Calculator"**: Mobile app for solar sizing and battery analysis (discussed on Cruisers Forum)

### What Existing Tools Do Well

1. **Component selection** (especially Victron's MPPT calculator)
2. **Basic load calculation** (most offer some version of an energy audit)
3. **Educational content** alongside the tools

### What Existing Tools Do Poorly

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

---

## 6. Educational Content Opportunities

### What Would Be Most Valuable for Cruising Sailors

Based on the gaps identified in existing resources, a knowledge base should cover:

#### Tier 1: Essential Foundations (Most Requested)

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

#### Tier 2: System Design (Planning Phase)

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

#### Tier 3: Advanced Topics (Upgrade Phase)

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

### Content Format Recommendations

- **Interactive calculators** over static articles (sailors want answers, not just education)
- **Before/after case studies** from real boats with real consumption data
- **Decision trees** ("Do you have X? Then you need Y")
- **Visual system diagrams** that can be customized to their boat
- **Location-specific data** automatically pulled from irradiance databases
- **Comparison tables** with real pricing

---

## 7. Solar Irradiance Data Sources

### PVGIS (Photovoltaic Geographical Information System)

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

### NASA POWER (Prediction of Worldwide Energy Resources)

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

### Global Solar Atlas

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

### NREL Solar Resource Data

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

### SolarGIS

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

### Forecast.Solar

**Provider**: Open-source project
**URL**: https://forecast.solar/
**Cost**: Free tier available

**Features:**
- Combines PVGIS historical data with weather forecasts
- Provides solar production forecasts
- REST API

**Strengths:** Forward-looking (forecast, not just historical), free tier
**Weaknesses:** Designed for fixed installations, not moving boats

### Data.GISS (NASA Goddard)

**URL**: https://data.giss.nasa.gov/modelE/ar5plots/srlocat.html
**Cost**: Free

**Features:**
- Insolation data at specified locations
- Based on atmospheric models

### Recommendation for a Marine Solar Calculator

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

**Implementation approach:**
1. User enters cruising locations (or selects from popular routes)
2. Query PVGIS `MRcalc` for monthly horizontal irradiance at each location
3. Apply marine-specific derating factors (horizontal mounting, temperature, shading estimate)
4. Show month-by-month solar production vs. consumption
5. Highlight deficit months where supplemental charging is needed
6. Size the system for user's chosen design month/location

---

## Summary of Key Findings

1. **The market gap is clear**: No existing tool combines energy audit + location-aware solar data + battery chemistry comparison + route-based seasonal analysis. Each tool solves one piece of the puzzle.

2. **PVGIS is the ideal data source**: Free API, global coverage, monthly data, JSON output. Perfect for feeding a marine solar calculator.

3. **Victron dominates the ecosystem**: Any educational content or calculator should speak "Victron" as that's what most cruisers install. But should remain brand-agnostic in core calculations.

4. **The biggest pain points for sailors** are: (a) not knowing how much power they actually use, (b) not understanding how location/season affects solar output, and (c) not being able to compare battery chemistry trade-offs with real numbers.

5. **Solar sizing is inherently a multi-location problem for sailors**: Unlike a house, a boat moves. A calculator that can show "your system works great in the Caribbean but you'll have a 40% deficit in the UK in December" would be uniquely valuable.

6. **The 2026 consensus on sizing**: 1W of solar per 1Ah of battery capacity. Weekenders: 100-200W. Coastal cruisers: 300-600W. Bluewater: 800-1200W. But this is crude without location and consumption data.

7. **LiFePO4 is becoming the default recommendation** for serious cruisers, but AGM still has a place for budget-conscious or cold-weather sailors.

---

## Sources

- [Victron Energy - Sailing Yacht](https://www.victronenergy.com/markets/marine/sailing-yacht)
- [Victron Energy - Solar Charge Controllers](https://www.victronenergy.com/solar-charge-controllers)
- [Victron MPPT Calculator](https://mppt.victronenergy.com/)
- [Victron Marine System Booklet (PDF)](https://www.victronenergy.com/upload/documents/Booklet-Marine-Systems-EN.pdf)
- [Victron - Solar Panels: The Quiet Sailing Solution](https://www.victronenergy.com/blog/2017/08/14/solar-panels-the-quiet-sailing-solution/)
- [Coastal Climate Control - Marine Solar Planning Guide](https://www.coastalclimatecontrol.com/blog/marine-solar-panel-planning-guide)
- [Custom Marine Products - Select and Size Solar System](https://www.custommarineproducts.com/select-and-size-solar-system.html)
- [Custom Marine Products - Solar Panel Sizing Calculator](https://www.custommarineproducts.com/marine-solar-panel-sizing-calculator-tool.html)
- [Custom Marine Products - Rigid Marine Solar Panels](https://www.custommarineproducts.com/rigid-marine-solar-panels.html)
- [BatteryStuff Solar Calculator](https://www.batterystuff.com/kb/tools/solar-calculator.html)
- [Explorist.life - Solar Charge Controller Calculator](https://explorist.life/solar-charge-controller-calculator/)
- [Explorist.life - Calculators](https://explorist.life/category/blog/calculators/)
- [AllSolarCalculators - Boat Solar Calculator](https://www.allsolarcalculators.com/calculators/specialized/boat)
- [Battle Born Batteries - Lead Acid vs Lithium for Sailboats](https://battlebornbatteries.com/lead-acid-vs-lithium-batteries-for-sailboats-other-marine-vessels/)
- [Battle Born Batteries - Watt Hours to Amp Hours](https://battlebornbatteries.com/watt-hours-to-amp-hours/)
- [ACE Battery - LiFePO4 vs AGM Marine Batteries](https://www.acebattery.com/blogs/lifepo4-vs-agm-marine-batteries-which-powers-your-boat-best)
- [MANLY Battery - AGM vs LiFePO4 Sailboat Upgrade](https://manlybattery.com/agm-vs-lifepo4-sailboat-electrical-upgrade/)
- [West Marine - Sizing Your House Battery Bank](https://www.westmarine.com/WestAdvisor/Sizing-Your-House-Battery-Bank)
- [The Boat Galley - How Much Solar Power Do You Need?](https://theboatgalley.com/how-much-solar-power-do-you-need/)
- [Practical Sailor - Estimating Solar Panel Size for Boats](https://www.practical-sailor.com/blog/estimating-solar-panel-size-for-boats)
- [PVGIS - EU Joint Research Centre](https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/getting-started-pvgis/pvgis-user-manual_en)
- [PVGIS API Documentation](https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/getting-started-pvgis/api-non-interactive-service_en)
- [NASA POWER](https://power.larc.nasa.gov/)
- [Global Solar Atlas](https://globalsolaratlas.info/)
- [NREL Solar Resource Data API](https://developer.nrel.gov/docs/solar/solar-resource-v1/)
- [Forecast.Solar](https://forecast.solar/)
- [8M Solar - Peak Sun Hours by Region](https://8msolar.com/what-is-a-peak-sun-hour-psh/)
- [Seabits - Installing Victron LiFePO4 System](https://seabits.com/installing-and-using-a-victron-lifepo4-energy-system/)
- [Marine Heating UK - Boat Solar Panels 2026 Guide](https://marineheating.co.uk/boat-solar-panels/)
- [MANLY Battery - Sailboat Solar Power Guide](https://manlybattery.com/sailboat-solar-power-guide-panels-mppt-and-the-right-battery-bank/)
