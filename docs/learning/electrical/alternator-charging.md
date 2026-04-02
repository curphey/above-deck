---
title: "Alternator Charging: OEM vs Aftermarket High-Output"
summary: "How marine alternators work, why OEM alternators underperform for lithium batteries, and the case for aftermarket high-output alternators from Balmar, Electrodyne, and Wakespeed."
---

## How Marine Alternators Work

An alternator is a generator bolted to your engine, driven by a belt off the crankshaft pulley. Inside, a rotating electromagnet (the rotor) spins inside a set of stationary copper windings (the stator). This produces alternating current, which a built-in rectifier bridge converts to direct current for charging batteries.

Three factors determine how much current an alternator produces:

1. **RPM** — faster rotation means more output. Most alternators reach rated output at 5,000-6,000 alternator RPM, which corresponds to roughly 3,000 engine RPM depending on pulley ratio. At cruising RPM (2,000-2,500 on a typical marine diesel), output drops to 60-70% of the rated figure.

2. **Field current** — the voltage regulator controls current flowing to the rotor's electromagnet. More field current means a stronger magnetic field and more output. The regulator adjusts field current to maintain a target voltage at the battery terminals.

3. **Temperature** — as the alternator heats up, resistance increases in the windings and output drops. An alternator rated at 100A might produce 100A when cold but only 70-80A after an hour of continuous operation. Manufacturer ratings are typically given as "hot rated" (continuous at operating temperature), but some quote "cold" or "peak" numbers that are misleading.

## Why OEM Alternators Fall Short

Factory alternators on marine diesels are designed to charge starter batteries, not house banks. They were specified decades ago when a boat's electrical load was a VHF radio and a cabin light.

### Typical OEM output

| Engine manufacturer | Common alternator | Rated output | Actual output at cruising RPM |
|---|---|---|---|
| Yanmar 3YM30 | Hitachi-type | 80A | 50-55A |
| Yanmar 4JH | Hitachi-type | 80A | 50-60A |
| Volvo Penta D2-40 | Valeo-type | 75A | 45-55A |
| Volvo Penta D2-75 | Valeo-type | 115A | 70-80A |
| Perkins M92B | Prestolite | 70A | 40-50A |
| Beta Marine 43 | Iskra-type | 75A | 45-55A |

These numbers assume a healthy alternator with good belt tension. Worn belts, corroded connections, or a tired rectifier bridge make things worse.

### The voltage problem

OEM alternators use a simple internal voltage regulator that targets 14.0-14.2V. This is acceptable for lead-acid float charging but has two problems:

- **Too low for lithium.** LiFePO4 batteries charge most efficiently at 14.4-14.6V (for a 12V system). At 14.0V, the battery accepts charge but at a reduced rate, extending charge time significantly.
- **No charge profile.** A proper charge cycle has stages — bulk (maximum current until voltage target), absorption (hold voltage, current tapers), and float (reduced voltage for maintenance). An OEM regulator just aims for one voltage and stays there.

There is no temperature compensation, no current limiting, and no communication with a battery management system. The regulator has no idea what kind of battery it is charging.

## The Lithium Charging Problem

LiFePO4 batteries have fundamentally different charging characteristics from lead-acid, and this creates a specific problem for alternators.

**High acceptance rate.** A lead-acid battery naturally limits charge current as it fills — internal resistance rises and the battery "pushes back." A 400Ah lead-acid bank might accept 100A when empty but only 20A when 80% full. LiFePO4 batteries do not push back. A 400Ah LiFePO4 bank will happily accept 400A (1C rate) from 10% to 95% state of charge. The charge current stays high until the BMS or charger cuts it.

**Flat voltage curve.** Lead-acid battery voltage rises gradually as it charges, giving the alternator's regulator a signal to reduce output. LiFePO4 voltage stays nearly flat at 13.2-13.4V through most of the charge cycle, then rises sharply near full. The alternator sees low voltage and keeps pushing maximum current for extended periods.

**Continuous full-load operation.** Because lithium does not push back, the alternator runs at full rated output for the entire charge cycle. OEM alternators are not designed for this. They expect the load to taper as lead-acid batteries fill. Running a 75A alternator at 75A continuously for two hours will overheat the unit, cook the rectifier diodes, and melt the internal insulation. Premature alternator failure on boats with lithium batteries and OEM alternators is common.

**The solutions:**

- A high-output alternator designed for continuous duty at full rated output
- An external voltage regulator that manages charge profiles, temperature limits, and current ramping
- A DC-DC charger between the alternator and the house bank that limits current and provides a proper charge profile
- Or a combination of these

## Aftermarket High-Output Alternators

### Balmar (USA)

Balmar is the most widely used aftermarket marine alternator brand in the recreational market. Based in Washington state, they have been making marine alternators since the 1980s.

**6-Series (large frame):**
- Output: 150A to 210A at 12V, 100A to 120A at 24V
- Designed for continuous duty at full rated output
- Dual internal fans for cooling
- Dual rectifier bridge — six additional diodes provide redundancy
- K6 serpentine belt pulley (standard) or dual V-belt
- Mounting kits available for Yanmar, Volvo Penta, Perkins, Westerbeke, Universal, and others
- Requires large-frame mounting bracket
- Price: $1,000-1,500 for the alternator

**AT-Series (small frame):**
- Output: 100A to 120A at 12V
- Fits in the same physical space as most OEM alternators (small case)
- Single rectifier bridge
- Single V-belt or serpentine
- Easier retrofit — often uses the existing engine mounting bracket
- Price: $800-1,200 for the alternator

Balmar alternators pair with Balmar's own external regulators:

- **MC-614** — programmable multi-stage regulator with temperature sensing. Supports lead-acid, AGM, gel, and LiFePO4 charge profiles. Belt load manager reduces field current at low RPM to prevent belt slip. Price: $350-450.
- **ARS-5** — advanced regulator with similar features to the MC-614 plus configurable via Bluetooth app. Price: $400-500.

Website: balmar.net

### Electrodyne (USA)

Electrodyne builds custom-wound alternators for specific engine mounting configurations. Less common in the recreational market but well established in commercial and military marine applications.

- Output: up to 250A+ at 12V
- Each alternator is built to match a specific engine's mounting geometry, belt type, and pulley alignment
- Heavy-duty construction with oversized bearings and high-temperature insulation
- Continuous duty rated — designed to run at full output indefinitely
- Price: $1,200-2,000+ depending on configuration
- Longer lead times than Balmar (custom manufacturing)

Electrodyne alternators are often specified by professional marine electricians for boats with very high electrical loads — large catamarans, charter boats, liveaboards running watermakers and air conditioning.

### Wakespeed (USA)

Wakespeed does not make alternators. They make the WS500, which is arguably the most advanced external alternator regulator available for marine use.

**WS500 regulator:**
- Works with any alternator — OEM or aftermarket
- Replaces the alternator's internal regulator
- Fully programmable charge profiles for LiFePO4, LTO, lead-acid, AGM, gel
- CAN bus communication — integrates with Victron Cerbo GX, REC BMS, and other CAN-enabled devices
- Temperature monitoring with sensors for alternator case, battery, and engine room
- Current shunt input for measuring actual alternator output
- Configurable current limiting — protects the alternator from overheating by ramping down field current before thermal limits are reached
- Over-temperature protection — automatically reduces output if alternator or battery temperature exceeds set points
- BMS integration — receives charge/disconnect commands from lithium BMS via CAN bus
- Configurable via USB or Bluetooth
- Price: $400-500

The WS500 is often the best first upgrade for a boat with lithium batteries. Before spending $1,500 on a new alternator, a $500 regulator on the existing OEM alternator provides proper charge profiles, temperature protection, and BMS communication. A 75A OEM alternator with a WS500 may not produce more current, but it will charge more efficiently and safely.

### Victron Energy (Netherlands)

Victron does not make alternators, but their products address the same charging problem from a different angle.

**Orion-Tr Smart DC-DC charger:**
- Sits between the alternator output and the house battery bank
- Provides a proper multi-stage charge profile regardless of what the alternator is doing
- Current limiting protects the alternator from overload
- Available in 12/12 and 24/12 configurations
- Output: 18A or 30A per unit. Multiple units can be paralleled for higher current.
- Bluetooth monitoring and configuration
- Integrates with Victron VRM monitoring
- Price: $150-250 per unit

The DC-DC charger approach has a trade-off: each unit only passes 18-30A to the house bank, so reaching 100A+ requires paralleling multiple units, which adds cost and complexity. It works well for boats that want to keep the OEM alternator and add a controlled path to a lithium house bank without replacing the regulator.

## External Voltage Regulators

The alternator's internal regulator is a simple voltage-sensing circuit. It reads battery voltage, compares it to a fixed set point (typically 14.0-14.2V), and adjusts field current to hold that voltage. It knows nothing about battery chemistry, temperature, state of charge, or desired charge profile.

An external regulator replaces this internal circuit and adds intelligence:

| Feature | Internal regulator | External regulator (WS500/MC-614) |
|---|---|---|
| Voltage set point | Fixed (14.0-14.2V) | Programmable (13.0-15.0V+) |
| Charge stages | None (single voltage) | Bulk, absorption, float, equalize |
| Battery chemistry | Lead-acid assumed | LiFePO4, AGM, gel, lead-acid |
| Temperature compensation | None | Alternator + battery sensors |
| Current limiting | None | Configurable maximum output |
| BMS communication | None | CAN bus (WS500) |
| Belt load management | None | Reduces field at low RPM |
| Monitoring data | None | RPM, field %, current, temperature |

**Key products:**

| Regulator | CAN bus | BMS integration | Bluetooth | Price |
|---|---|---|---|---|
| Wakespeed WS500 | Yes | Yes (CAN) | Yes | $400-500 |
| Balmar MC-614 | No | No | No | $350-450 |
| Balmar ARS-5 | No | No | Yes | $400-500 |
| Sterling Power PDAR | No | Limited | No | $250-350 |

The WS500 stands apart because of its CAN bus capability. It can communicate directly with a Victron Cerbo GX, appearing as a monitored charging source in the Victron ecosystem. It can also receive charge disconnect commands from a lithium BMS, ensuring the alternator stops charging when cells are full or too cold.

## Installation Considerations

### Belt sizing

The belt transfers engine power to the alternator. Higher output means more load on the belt.

| Belt type | Maximum practical alternator output | Notes |
|---|---|---|
| Single V-belt | 80-100A | Stock on most marine diesels |
| Dual V-belt | 120-160A | Requires dual-groove pulley on engine and alternator |
| K6 serpentine | 200A+ | Wider contact area, better grip, less slip |

A single V-belt slipping under load is the most common problem with alternator upgrades. If you install a 150A alternator on a single V-belt, the belt will slip, overheat, and fail. Matching belt type to alternator output is not optional.

### Mounting

Aftermarket alternators must match the engine's mounting geometry — bolt pattern, pivot point, and adjustment slot. Balmar and Electrodyne offer engine-specific mounting kits for most common marine diesels (Yanmar 3JH/4JH, Volvo D1/D2, Perkins, Universal, Beta). Verify compatibility before purchasing. An alternator that does not fit your engine bracket is useless.

### Wiring

High-output alternators require appropriately sized cable from the alternator to the battery bank. Undersized wire causes voltage drop, heat, and wasted energy.

| Alternator output | Minimum cable size (run under 3m) | Minimum cable size (run 3-6m) |
|---|---|---|
| 75A | 16mm² | 25mm² |
| 120A | 25mm² | 35mm² |
| 150A | 35mm² | 50mm² |
| 200A | 50mm² | 70mm² |

Use marine-grade tinned copper cable. Crimp terminals with a hydraulic crimper, not pliers. Heat-shrink over every connection.

### Fusing

Install an ANL fuse on the positive cable between the alternator and the battery bank, as close to the battery as practical. Size the fuse at 120-150% of the alternator's maximum rated output.

| Alternator output | Recommended ANL fuse |
|---|---|
| 75A | 100A |
| 120A | 150A |
| 150A | 200A |
| 200A | 250A |

### Temperature sensors

Critical for lithium battery installations:

- **Alternator case sensor** — attached to the alternator body with a hose clamp or thermal adhesive. The external regulator uses this to reduce output before the alternator overheats. Most external regulators include this sensor.
- **Battery temperature sensor** — attached to the battery case. LiFePO4 batteries should not be charged below 0°C (some BMS units enforce this, but a regulator-side sensor adds a second layer of protection).

### BMS integration

A lithium battery management system must be able to signal the alternator regulator to stop charging under fault conditions — cells reaching maximum voltage, battery temperature too low, or cell imbalance detected. Without this communication path, the alternator will keep pushing current into a battery that the BMS has disconnected, potentially damaging the alternator or causing a voltage spike.

The Wakespeed WS500 handles BMS integration via CAN bus. It can receive charge enable/disable signals from REC, Victron, and other CAN-enabled BMS units. For BMS units without CAN bus output, a relay-based disconnect is the fallback — the BMS opens a relay that cuts the alternator field circuit.

## The Catamaran Advantage

Twin-engine catamarans have two alternators, which changes the charging calculus.

Two stock 75A alternators provide a theoretical 150A, though actual output while motoring at cruising RPM is closer to 90-110A combined. This is already more charging capacity than most monohulls, but it is still well short of what a large lithium bank can absorb.

A practical upgrade strategy for a catamaran:

1. **Start with Wakespeed WS500 regulators on both stock alternators.** Cost: ~$1,000 for both. This gets proper charge profiles, temperature protection, and BMS communication without replacing any hardware. Total output stays at 90-110A but it is better-managed current.

2. **Upgrade one engine to a high-output Balmar.** Keep the other engine's stock alternator as a backup. A Balmar 6-Series 165A on the port engine plus the stock 75A on starboard gives a combined 200-240A at cruising RPM. If the Balmar fails, you still have a working alternator on the other engine.

3. **If loads demand it, upgrade both.** Two Balmar 6-Series 165A alternators provide 280-330A combined — enough to fast-charge a 600Ah LiFePO4 bank from 20% to 90% in about 90 minutes of motoring.

| Configuration | Estimated output at cruising RPM | Cost (parts only) |
|---|---|---|
| Two stock alternators (75A each) | 90-110A | $0 (factory) |
| Two stock + two WS500 regulators | 90-110A (better managed) | ~$1,000 |
| One Balmar 165A + one stock 75A, both with WS500 | 200-240A | ~$2,500 |
| Two Balmar 165A + two WS500 | 280-330A | ~$4,000 |

## Cost-Benefit Analysis

The financial case for alternator upgrades depends on how much you motor and whether the alternative is running a generator.

### Upgrade costs

| Upgrade path | Parts cost | Installed cost (estimate) |
|---|---|---|
| Wakespeed WS500 on stock alternator | $400-500 | $600-800 |
| Balmar AT-Series 120A + MC-614 regulator | $1,200-1,700 | $1,800-2,500 |
| Balmar 6-Series 165A + WS500 | $1,500-2,000 | $2,200-3,000 |
| Balmar 6-Series 200A + WS500 + serpentine conversion | $2,000-2,500 | $3,000-4,000 |

### Generator displacement

Many cruisers run a generator (Honda EU2200i or similar) to supplement charging. Generator fuel consumption is roughly 0.5-1.0 litres per hour. At current diesel or petrol prices, that is $1.50-4.00 per hour depending on location.

If a high-output alternator replaces 2-3 hours of daily generator runtime:

- Fuel savings: $3-12 per day
- Over a 200-day cruising season: $600-2,400 per year
- A $2,500 alternator upgrade pays for itself in 1-2 seasons

Beyond fuel savings, eliminating generator runtime reduces noise, vibration, maintenance, and the need to carry a generator at all — freeing up locker space and reducing weight.

### Charging time comparison

Charging a 400Ah LiFePO4 bank from 30% to 90% (240Ah to replace):

| Charging source | Output (12V) | Time to charge 240Ah |
|---|---|---|
| Stock 75A alternator (actual 50A) | 50A | 4.8 hours |
| Stock 75A + WS500 (actual 55A, better profile) | 55A | 4.4 hours |
| Balmar AT-Series 120A (actual 90A) | 90A | 2.7 hours |
| Balmar 6-Series 165A (actual 130A) | 130A | 1.8 hours |
| Balmar 6-Series 200A (actual 160A) | 160A | 1.5 hours |
| Two Balmar 165A on catamaran (actual 260A) | 260A | 0.9 hours |

These figures assume bulk charging at near-constant current. Actual charge times are slightly longer because current tapers during the absorption phase.

## Monitoring and Integration

### Alternator data on the network

The Wakespeed WS500 exposes alternator operating data on the CAN bus:

- Alternator RPM (calculated from engine RPM and pulley ratio)
- Field duty cycle (percentage of maximum field current being applied)
- Output current (measured via external shunt)
- Alternator temperature (from case sensor)
- Battery voltage and temperature
- Charge state (bulk, absorption, float, or fault)

This data is available to any CAN bus device on the network.

### Victron integration

The WS500 appears as a charging source on the Victron Cerbo GX when connected via CAN bus (using a standard RJ45 to CAN bus adapter). Alternator output shows up alongside solar, shore power, and other sources in the Victron VRM portal and on the GX Touch display.

### Above Deck integration

Above Deck can read alternator data through two paths:

- **NMEA 2000** — if the WS500's CAN bus output is bridged to the boat's NMEA 2000 network, alternator data appears as standard PGNs that the Above Deck spoke can read.
- **Victron MQTT** — if the boat runs a Victron Cerbo GX, alternator data from the WS500 is available via the Cerbo's MQTT broker, which Above Deck already reads for solar and battery data.

Alternator output is a key input for the energy planner. Knowing how many amps the alternator produces at a given engine RPM allows the system to answer practical questions: how long do I need to motor to reach 80% state of charge? Is it worth running the engine for an hour, or should I wait for tomorrow's sun?

## Summary of Recommendations

**If you have lead-acid batteries and a stock alternator:** no immediate action needed. The OEM setup was designed for this combination.

**If you are switching to lithium with a stock alternator:** install a Wakespeed WS500 external regulator as a minimum. This gives you proper charge profiles, temperature protection, and BMS communication for roughly $500. This is the single most cost-effective upgrade.

**If you have lithium and want faster charging:** upgrade to a Balmar AT-Series (100-120A) if your engine accepts a small-frame alternator, or a Balmar 6-Series (150-200A) with a serpentine belt conversion for maximum output. Pair with a WS500 or Balmar MC-614 regulator.

**If you have a catamaran:** start with WS500 regulators on both stock alternators. Upgrade one engine to a Balmar if you need more output. Keep the other stock alternator as redundancy.

**If you want minimal complexity:** use Victron Orion-Tr Smart DC-DC chargers between the stock alternator and the house bank. Less total throughput than an alternator upgrade, but no engine modifications required and the charge profile is handled entirely by the Victron unit.
