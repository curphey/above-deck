---
title: "Boat Electrical System Components: What They Do and How They Connect"
summary: "A complete guide to every component in a cruising boat's electrical system — batteries, inverters, chargers, MPPT controllers, alternators, BMS, bus bars, shunts, switches, and how they all connect together."
---

## How a Boat's Electrical System Works

A cruising boat's electrical system is a self-contained power grid. Energy comes in from several sources — solar panels, the engine alternator, and shore power — gets stored in a battery bank, and flows out to every light, pump, instrument, and appliance on board.

Understanding each component in this system, what it does, and how it connects to everything else is the foundation of electrical planning. This article walks through every major component in the order that energy flows: from generation, through storage, to distribution and consumption.

## Energy Sources

### 1. Solar Panels

A solar panel is an array of photovoltaic (PV) cells that convert sunlight into DC electricity.

**What it does:** When photons from sunlight hit the silicon cells, they knock electrons loose, creating a flow of direct current. Each cell produces roughly 0.5V, and cells are wired in series within the panel to produce a usable output voltage — typically 18-22V for a "12V" panel or 36-44V for a higher-voltage panel.

**Where it sits in the system:** Solar panels connect to an MPPT (or PWM) charge controller via positive and negative cables. They do not connect directly to the battery bank. The charge controller manages the conversion from panel voltage to battery charging voltage.

**Panel types:**

| Type | Efficiency | Weight | Lifespan | Best for |
|------|-----------|--------|----------|----------|
| Rigid (monocrystalline) | 20-23% | Heavy (framed aluminium) | 25+ years | Arch or hardtop mounting |
| Semi-flexible | 18-22% | Moderate | 5-10 years | Bimini or curved surfaces |
| Flexible (thin-film/CIGS) | 12-18% | Light | 3-5 years | Temporary or weight-sensitive installs |

Rigid monocrystalline panels are the most efficient and durable. Semi-flexible panels are popular on biminis because they can conform to a slight curve, but they degrade faster due to heat buildup (no airflow underneath). Flexible panels are the cheapest and lightest but have the shortest lifespan and lowest output.

**Key specs when buying:**

| Spec | What it means |
|------|--------------|
| Wattage (Wp) | Peak power output under ideal lab conditions (STC: 1000 W/m², 25°C cell temperature). Real-world output is 55-80% of this. |
| Voc (open circuit voltage) | Maximum voltage the panel produces with no load. Used to calculate maximum input voltage to the charge controller. |
| Vmp (voltage at max power) | Operating voltage at peak power. This is what the MPPT controller optimises around. |
| Isc (short circuit current) | Maximum current the panel can produce. Used for fuse sizing. |
| Imp (current at max power) | Operating current at peak power. |

**Wiring configurations:** Panels can be wired in series (positive of one to negative of the next) to increase voltage, or in parallel (all positives together, all negatives together) to increase current. Series wiring is more common because higher voltage means lower current in the cables and less voltage drop over long runs. The choice depends on the MPPT controller's input voltage range and maximum current rating.

**Common products:** SunPower, Victron, Canadian Solar, Renogy, JA Solar. For marine use, panels with bypass diodes are important — they allow current to flow around a shaded cell rather than losing output from the entire string.

For detailed sizing guidance, see [Sizing Your Solar System](/knowledge/solar-sizing-guide).

### 2. MPPT Solar Charge Controller

An MPPT (Maximum Power Point Tracking) charge controller is the device that sits between the solar panels and the battery bank, converting the panel's output to the correct battery charging voltage while extracting the maximum possible power.

**What it does:** Solar panels produce variable voltage and current depending on sunlight intensity, temperature, and shading. The "maximum power point" is the specific voltage-current combination where the panel delivers the most watts. An MPPT controller continuously adjusts its input resistance to find this point, then converts the higher panel voltage down to the battery's charging voltage using a DC-DC buck converter. This conversion is highly efficient (95-99%) and recovers energy that would otherwise be lost.

For example: a panel producing 40V at 5A (200W) connected to a 12V battery bank. The MPPT controller converts this to approximately 14.4V at 13.5A — still close to 200W, but at the voltage the battery needs for charging. Without MPPT, a PWM controller would clamp the panel down to battery voltage (14V), wasting the excess voltage entirely.

**Where it sits in the system:** Solar panels connect to the MPPT input terminals. Battery bank connects to the MPPT output terminals. The controller also connects to the system monitor (Cerbo GX) via VE.Direct cable for data logging and remote monitoring.

**Key specs when buying:**

| Spec | What it means | How to choose |
|------|--------------|---------------|
| Max input voltage (Voc) | Maximum panel voltage the controller can accept. Exceeding this damages the unit. | Must exceed the combined Voc of your panels in series, accounting for cold temperatures (voltage rises when panels are cold). |
| Max charge current | Maximum current the controller will output to the battery. | Must match or exceed the maximum current your panels can produce at battery voltage. |
| Battery voltage | 12V, 24V, or 48V (most auto-detect). | Must match your battery bank voltage. |
| Max PV power | Maximum wattage the controller can handle. | Must exceed your total panel wattage. |

**Victron SmartSolar naming convention:** The model number tells you the specs. MPPT 100/30 means 100V max input, 30A max charge current. MPPT 150/35 means 150V max input, 35A max charge current.

| Array size | Recommended controller |
|-----------|----------------------|
| Under 150W | SmartSolar 75/15 |
| 150-400W | SmartSolar 100/30 |
| 400-600W | SmartSolar 100/50 or 150/35 |
| 600-1000W | SmartSolar 150/45 or 150/60 |
| 1000W+ | SmartSolar 250/70 or 250/100 |

**Monitoring data available from the MPPT controller:** daily yield (kWh), panel voltage, panel current, battery voltage, charge current, charge state (bulk/absorption/float), error codes.

**Common products:** Victron SmartSolar is the marine standard. Other options include Renogy Rover, EPEver, and Genasun. Victron dominates marine installations because of ecosystem integration — the SmartSolar connects to the Cerbo GX and appears in the VRM cloud portal alongside all other Victron devices.

### 3. PWM Solar Charge Controller

A PWM (Pulse Width Modulation) charge controller is a simpler, cheaper alternative to MPPT that directly connects the panel to the battery by rapidly switching the connection on and off to regulate voltage.

**What it does:** A PWM controller pulls the panel voltage down to battery voltage by essentially short-circuiting the panel through the battery. It does not convert excess voltage to additional current the way MPPT does. This means a significant amount of potential power is wasted — typically 10-30% less harvest compared with an MPPT controller, depending on conditions.

**Where it sits in the system:** Same position as an MPPT controller — between panels and battery bank.

**When to use PWM:** PWM controllers cost £20-50 compared with £100-400 for MPPT. They make sense only for very small systems (under 100W) where the cost of the controller matters relative to the total system cost. For any cruising boat with a serious solar installation, MPPT is worth the investment.

**Not recommended for cruising boats.** The efficiency loss over a season of cruising adds up to hundreds of watt-hours per day that you could be capturing. The MPPT controller pays for itself quickly through increased harvest.

## Energy Storage

### 4. Battery Bank

The battery bank stores all the electrical energy on the boat. It is the heart of the system — every source charges it, every load draws from it.

**What it does:** Batteries store energy chemically and release it as direct current. On a cruising boat, the battery bank provides power for everything from navigation instruments to the refrigerator compressor. When charging sources (solar, alternator, shore power) produce more than the loads consume, the excess goes into the battery. When loads exceed charging, the battery makes up the difference.

**Where it sits in the system:** The battery bank connects to the positive and negative bus bars, which distribute power to all loads and accept current from all charging sources. The battery is the central node of the electrical system.

**Key specs when buying:**

| Spec | What it means |
|------|--------------|
| Capacity (Ah) | Total energy storage in amp-hours. A 200Ah battery at 12V stores 2,400Wh. |
| Voltage | 12V or 24V for house banks. Must match all connected equipment. |
| Chemistry | LiFePO4 (lithium iron phosphate) is the current standard for cruising. See below. |
| Cycle life | Number of charge/discharge cycles before capacity drops to 80%. LiFePO4: 3,000-5,000. AGM: 500-800. |
| Max charge rate | Maximum current the battery can accept. LiFePO4 typically accepts 0.5C-1C (100-200A for a 200Ah battery). |
| Max discharge rate | Maximum continuous current the battery can deliver. |

**Battery chemistry comparison:**

| Chemistry | Usable DoD | Weight (per 100Ah usable) | Cycle life | Cost per usable Ah |
|-----------|-----------|--------------------------|------------|-------------------|
| Flooded lead-acid | 50% | ~30 kg | 300-500 | Low |
| AGM | 50% | ~30 kg | 500-800 | Medium |
| LiFePO4 | 80-90% | ~12 kg | 3,000-5,000 | Medium-high (but lowest per cycle) |

**Typical cruising catamaran sizing:**

| System voltage | Typical capacity | Usable (at 80% DoD) |
|---------------|-----------------|---------------------|
| 12V | 400-800Ah | 320-640Ah |
| 24V | 200-400Ah | 160-320Ah |

For detailed information on lithium battery chemistries and products, see [Lithium Battery Technologies](/knowledge/lithium-battery-technologies). For guidance on choosing between 12V and 24V, see [12V vs 24V Systems](/knowledge/12v-vs-24v-systems).

### 5. Battery Monitor / Shunt

A battery monitor shunt is a precision current-sensing resistor installed on the negative battery cable that measures all current flowing in and out of the battery bank.

**What it does:** The shunt measures current by detecting the tiny voltage drop across a known resistance as current flows through it. From this measurement, the monitor calculates state of charge (SOC), power (watts), consumed amp-hours, and time-to-go at the current draw rate. It is the fuel gauge for your battery bank.

Without a battery monitor, you are guessing how much energy is left. Battery voltage alone is an unreliable indicator — LiFePO4 voltage stays nearly flat between 20% and 90% SOC, making voltage-based estimation useless.

**Where it sits in the system:** The shunt is installed on the negative cable between the battery bank and the negative bus bar. All negative cables must pass through the shunt so it can measure the total current. The shunt connects to a display head (BMV-712) or communicates via Bluetooth (SmartShunt) and/or VE.Direct cable to the Cerbo GX.

**Key specs when buying:**

| Spec | What it means |
|------|--------------|
| Shunt rating | Maximum current the shunt can measure (typically 500A). |
| Resolution | Measurement accuracy, typically 0.01A. |
| Connectivity | Bluetooth (for phone monitoring), VE.Direct (for Cerbo GX integration), or both. |

**Data provided:**

| Measurement | What it tells you |
|------------|------------------|
| State of charge (%) | How full the battery bank is — the primary number you check daily. |
| Current (A) | Net current: positive means charging, negative means discharging. |
| Power (W) | Real-time power flow (voltage x current). |
| Consumed Ah | How many amp-hours have been drawn since the last full charge. |
| Time-to-go | Estimated time until the battery reaches a set minimum SOC at the current discharge rate. |
| Battery voltage | Measured at the shunt terminals. |
| Battery temperature | Via optional temperature sensor attached to the battery. |

**Common products:** Victron SmartShunt (500A, Bluetooth + VE.Direct, ~£70) is the most common. The Victron BMV-712 adds a physical display panel. Both connect to the Cerbo GX for system-wide monitoring and VRM cloud logging.

### 6. BMS (Battery Management System)

A BMS is the electronic brain that protects a lithium battery bank by monitoring individual cell voltages, controlling charge and discharge, and managing cell balancing and temperature protection.

**What it does:** Every lithium battery requires a BMS. LiFePO4 cells have a safe operating voltage range of approximately 2.5V to 3.65V per cell. If any cell in a series string exceeds these limits, the BMS disconnects the battery to prevent damage. The BMS also:

- **Monitors individual cell voltages** — detects if any single cell is drifting out of balance with the others.
- **Balances cells** — redistributes energy between cells to keep them matched. Passive balancing bleeds excess energy as heat. Active balancing transfers energy from higher cells to lower cells (more efficient).
- **Enforces temperature limits** — prevents charging below 0°C (which permanently damages LiFePO4 cells by causing lithium plating) and prevents operation above safe temperature limits.
- **Communicates with charging sources** — a BMS that can signal MPPT controllers, inverter/chargers, and alternator regulators to stop charging is significantly more valuable than one that can only disconnect the battery. A hard disconnect under load can cause voltage spikes that damage alternators and other equipment.

**Where it sits in the system:** The BMS connects to the battery cells (monitoring wires to each cell junction) and to the main positive and negative cables (via contactors or MOSFETs that can disconnect the battery). It communicates with the Cerbo GX via VE.Can (CAN bus) or via the battery's Bluetooth interface.

**Internal vs external BMS:**

| Type | Used in | Pros | Cons |
|------|---------|------|------|
| Internal (built-in) | Drop-in batteries (BattleBorn, Epoch, RELiON) | Simple installation, self-contained | Limited communication (usually Bluetooth only), protects by hard disconnect |
| External | Custom builds (prismatic cells) | Full CAN bus communication, active balancing, configurable parameters | More complex installation, requires electrical knowledge |

**Common products:**

| Product | Type | Communication | Balancing | Price |
|---------|------|--------------|-----------|-------|
| Victron Lynx Smart BMS | External | VE.Can (full Victron integration) | Passive | £300-400 |
| REC Active BMS | External | CAN bus (Victron compatible) | Active (2A) | £300-400 |
| JBD / Daly Smart BMS | External | Bluetooth | Passive | £50-150 |
| Batrium | External | WiFi, CAN bus | Active | £400-600 |
| Built-in (various drop-in brands) | Internal | Bluetooth (most) | Passive | Included in battery price |

For detailed information on BMS options and lithium battery management, see [Lithium Battery Technologies](/knowledge/lithium-battery-technologies).

## Power Conversion

### 7. Inverter

An inverter converts DC electricity from the battery bank into AC electricity (household power) for running AC appliances.

**What it does:** The inverter takes 12V or 24V DC from the battery bank and produces 110V/60Hz (North America) or 230V/50Hz (Europe/rest of world) AC output. This powers appliances that cannot run on DC: microwave ovens, hair dryers, laptop chargers, coffee makers, power tools, and AC-powered watermakers.

The output waveform matters. A **pure sine wave** inverter produces a clean AC waveform identical to shore power. A **modified sine wave** inverter produces a stepped approximation that is cheaper but can damage sensitive electronics (battery chargers, motor controllers, audio equipment) and causes motors to run hotter and less efficiently. Pure sine wave is essential for any cruising installation.

**Where it sits in the system:** The inverter connects to the battery bank (or bus bars) via heavy DC cables on the input side. Its AC output connects to the AC distribution panel, powering the boat's AC circuits. A standalone inverter provides AC power from the battery only — it does not charge batteries from shore power.

**Key specs when buying:**

| Spec | What it means |
|------|--------------|
| Continuous wattage | Maximum sustained power output. A 2000W inverter can run 2000W of AC loads continuously. |
| Peak/surge wattage | Short-term peak output (typically 2x continuous) for motor startup surges. |
| Output voltage | 110V/60Hz or 230V/50Hz — must match your appliances. |
| Waveform | Pure sine wave (required for marine use). |
| DC input voltage | 12V or 24V — must match your battery bank. |
| No-load power draw | Power consumed when the inverter is on but no AC load is running. Typically 10-25W. |

**Sizing guide:**

| Size | Suits | Example loads |
|------|-------|--------------|
| 800-1200W | Basic AC needs | Laptop charger, phone charger, small tools |
| 1500-2000W | Moderate AC | Above + microwave, coffee maker (not simultaneously) |
| 2500-3000W | Full AC galley | Above + hair dryer, toaster, multiple appliances |
| 3000W+ | Heavy AC loads | Above + air conditioning, watermaker, electric cooking |

**Common products:** Victron Phoenix is the inverter-only product line. Available in 12V and 24V, from 250W to 5000W. For most cruising boats, an inverter/charger combination unit (see below) is a better choice.

### 8. Inverter/Charger (Combi)

An inverter/charger combines three functions in one unit: a DC-to-AC inverter, an AC-to-DC battery charger, and an automatic transfer switch.

**What it does:** This is the most versatile power conversion device on a cruising boat. It operates in two modes:

- **Inverting (off the grid):** Converts DC battery power to AC for running appliances, identical to a standalone inverter.
- **Charging (on shore power or generator):** When AC power is connected at the shore power inlet, the transfer switch automatically routes incoming AC to the boat's AC circuits and simultaneously charges the battery bank. The charger provides multi-stage charging: bulk (maximum current until the battery reaches ~80%), absorption (holds voltage while current tapers), and float (low-level maintenance charge).

The automatic transfer switch detects shore power and seamlessly switches between inverting and pass-through modes. When shore power is connected, AC loads run from shore and the charger fills the batteries. When shore power is disconnected, the transfer switch flips to inverter mode within milliseconds — often fast enough that connected devices do not notice.

**PowerAssist (Victron MultiPlus feature):** When shore power is available but limited (a common situation at Mediterranean marinas with 6A or 10A supply), PowerAssist supplements the shore supply with battery power. If your AC loads exceed the shore power capacity, the MultiPlus draws the difference from the battery bank. This allows you to run a 2000W microwave on a 1500W shore power connection.

**Where it sits in the system:** DC side connects to the battery bank via heavy cables (same as a standalone inverter). AC input connects to the shore power inlet (via the galvanic isolator). AC output connects to the AC distribution panel. Also connects to the Cerbo GX via VE.Bus for monitoring and configuration.

**Key specs when buying:**

| Spec | What it means |
|------|--------------|
| Inverter watts | Continuous AC output from battery. |
| Charger amps | DC charge current when connected to shore power. |
| Transfer switch rating | Maximum AC pass-through current (must exceed your shore power supply). |
| DC voltage | 12V or 24V input. |
| AC voltage | 120V or 230V output. |

**Common products:**

| Product | Inverter | Charger | Transfer switch | Price |
|---------|---------|---------|----------------|-------|
| Victron MultiPlus 12/3000/120 | 3000VA | 120A | 50A | £1,200-1,500 |
| Victron MultiPlus-II 24/3000/70 | 3000VA | 70A | 50A | £1,300-1,600 |
| Victron MultiPlus-II 48/5000/70 | 5000VA | 70A | 50A | £1,800-2,200 |
| Victron Quattro 24/5000/120 | 5000VA | 120A | 2 x AC inputs | £2,000-2,500 |

The Victron Quattro adds a second AC input, allowing automatic switching between two shore power sources or between shore power and a generator.

### 9. Shore Power Charger (Standalone)

A standalone shore power charger converts AC shore power (or generator power) to DC for charging the battery bank, without any inverter capability.

**What it does:** When the boat is plugged in at a marina, the charger converts 110V/230V AC to the correct DC voltage and current to charge the battery bank. It provides multi-stage charging — bulk, absorption, and float — with programmable profiles for different battery chemistries (lead-acid, AGM, LiFePO4).

A standalone charger is used when the boat does not have an inverter/charger combination unit, or when additional charging capacity is needed. Some boats use a MultiPlus for the main house bank and a separate charger for the starter battery or a secondary bank.

**Where it sits in the system:** AC input connects to the AC distribution panel (fed from shore power). DC output connects to the battery bank via the bus bars. Some chargers have multiple isolated outputs for charging separate battery banks independently (house bank, starter battery, bow thruster battery).

**Key specs when buying:**

| Spec | What it means |
|------|--------------|
| Charge current (A) | Maximum DC output current. |
| Number of outputs | How many independent battery banks the charger can handle. |
| Charging profile | Must be configurable for your battery chemistry — especially LiFePO4, which requires a different voltage profile than lead-acid. |
| Power factor correction | Better chargers have active PFC, drawing power more efficiently from shore power. |

**Common products:** Victron Skylla-i (high-power, 3 outputs), Victron Blue Smart IP22 (compact, single output, Bluetooth), Mastervolt ChargeMaster Plus, Sterling Power Pro Charge Ultra.

### 10. Alternator

An alternator is an engine-driven generator that charges the battery bank whenever the engine is running.

**What it does:** A rotating electromagnet inside the alternator (driven by a belt from the engine crankshaft) induces alternating current in the stator windings. An internal rectifier bridge converts this to DC. A voltage regulator controls the alternator's output to maintain a target charging voltage.

Stock marine alternators are typically 50-80A and are designed to charge starter batteries, not large house banks. They underperform with lithium batteries because LiFePO4's flat voltage curve and high charge acceptance rate cause the alternator to run at full output continuously — leading to overheating and premature failure.

**Where it sits in the system:** The alternator connects to the battery bank via heavy positive cable (with an ANL fuse) and a ground cable. On boats with lithium batteries, a DC-DC charger is often placed between the alternator and the house bank to limit current and provide a proper charge profile.

**Key upgrades for lithium boats:**
- **External voltage regulator** (Wakespeed WS500) — replaces the internal regulator with programmable charge profiles, temperature protection, current limiting, and BMS communication via CAN bus.
- **High-output alternator** (Balmar 6-Series, Electrodyne) — 120-200A continuous duty, designed for sustained full-load operation.
- **DC-DC charger** (Victron Orion-Tr Smart) — an alternative to replacing the alternator. Limits current and provides a proper charge profile without engine modifications.

For a detailed treatment of alternator options, upgrades, and integration, see [Alternator Charging](/knowledge/alternator-charging).

### 11. DC-DC Charger

A DC-DC charger converts one DC voltage to another while providing a controlled charge profile.

**What it does:** DC-DC chargers serve two primary roles on cruising boats:

**Role 1: Alternator to lithium house bank.** Sits between the alternator output and the lithium battery bank. Provides multi-stage charging (bulk, absorption, float), current limiting to protect the alternator, and BMS communication to stop charging on command. This is the simplest upgrade path for boats with lithium batteries and stock alternators — no engine modifications required.

**Role 2: 24V house bank to 12V sub-system.** On 24V boats, many devices still require 12V power — VHF radios, NMEA 2000 backbone, some chartplotters. A DC-DC converter steps 24V down to 12V to feed these loads, often also maintaining a small 12V starter battery.

**Where it sits in the system:** For alternator-to-lithium use, it sits between the alternator output and the house bank bus bar. For voltage conversion, it sits between the 24V bus bar and the 12V distribution panel or starter battery.

**Key specs when buying:**

| Spec | What it means |
|------|--------------|
| Input voltage range | Must match the source (alternator output or house bank voltage). |
| Output voltage | Must match the target battery or load voltage. |
| Max output current | Determines charging speed. Multiple units can be paralleled for higher current. |
| Isolation | Isolated models provide galvanic separation between input and output — preferred for safety. |

**Common products:**

| Product | Input | Output | Max current | Price |
|---------|-------|--------|------------|-------|
| Victron Orion-Tr Smart 12/12-30 | 12V | 12V | 30A | £150-200 |
| Victron Orion-Tr Smart 24/12-20 | 24V | 12V | 20A | £120-160 |
| Victron Orion-Tr Smart 24/12-30 | 24V | 12V | 30A | £150-200 |
| Sterling Power BB1260 | 12V | 12V | 60A | £250-350 |

## Power Distribution

### 12. Bus Bars

A bus bar is a solid copper bar that acts as a central distribution point for electrical connections.

**What it does:** Bus bars are the junctions where all power sources and loads meet. Instead of connecting every wire directly to the battery terminals (which would create a tangled mess of connections), all positive wires connect to the positive bus bar, and all negative wires connect to the negative bus bar. The bus bar provides a clean, organised connection point with multiple bolt holes for ring terminals.

**Where it sits in the system:** The positive bus bar sits between the battery bank positive terminal and all positive cables (to chargers, inverter, distribution panel, solar controller, etc.). The negative bus bar sits between the battery bank negative terminal (via the shunt) and all negative cables.

**Key specs when buying:**

| Spec | What it means |
|------|--------------|
| Current rating | Maximum total current the bus bar can handle. Must exceed the sum of all connected circuits. |
| Number of studs | How many cables can be connected. Common sizes: 4, 6, 10, or 12 studs. |
| Stud size | M6, M8, or M10 — determines the size of ring terminals you need. |

**Common products:** Victron Lynx Distributor combines a bus bar with four DC fuse holders (Mega fuse, up to 500A each), providing both distribution and circuit protection in one unit. Victron Lynx Power In is a simpler bus bar without fuse holders. Blue Sea Systems and BEP also make standalone bus bars in various sizes.

### 13. Fuses and Circuit Breakers

Fuses and circuit breakers are overcurrent protection devices that interrupt the circuit if current exceeds a safe level, protecting the wiring from overheating and potential fire.

**What it does:** Every electrical circuit on a boat must have overcurrent protection sized to the wire gauge, not the load. If a short circuit occurs or a wire is damaged, the fuse blows (or the breaker trips) before the wire overheats. Without this protection, a short circuit on a 200A battery bank can melt wire insulation and start a fire.

**Where it sits in the system:** A fuse or breaker is installed on the positive cable of every circuit, as close to the power source (bus bar or battery) as practical. High-current circuits (inverter, windlass, thruster) use large ANL fuses at the bus bar. Low-current circuits (lights, instruments, pumps) use blade fuses or breakers in a distribution panel.

**Types of fuses and breakers:**

| Type | Current range | Used for |
|------|-------------|----------|
| ANL fuse | 40-500A | High-current circuits: inverter, windlass, alternator, shore power charger |
| Mega fuse | 100-500A | Same as ANL but used in Victron Lynx Distributor |
| MIDI fuse | 30-200A | Medium-current circuits |
| ATC/ATO blade fuse | 1-40A | Low-current circuits: lights, instruments, pumps |
| Thermal circuit breaker | 1-50A | Resettable alternative to blade fuses, used in distribution panels |
| Hydraulic-magnetic breaker | 5-50A | AC circuits, more precise and unaffected by ambient temperature |

**Sizing rule:** The fuse protects the wire, not the device. A 10A light on 14 AWG wire (rated for 25A) gets a 20A fuse — protecting the wire from overload while allowing normal operation.

### 14. Battery Switch / Disconnect

A battery switch isolates the battery bank from the entire electrical system.

**What it does:** Turning the battery switch to "off" disconnects the battery from all loads and charging sources. This is used for maintenance (working on electrical circuits safely), emergency shutdown (electrical fire or flooding), and preventing parasitic drain (small standby loads slowly draining the battery when the boat is unoccupied).

**Where it sits in the system:** Installed on the main positive cable between the battery bank and the positive bus bar. Some installations have the switch on the negative side instead. On boats with separate house and starter batteries, there may be multiple switches — one for each bank.

**Types:**

| Type | How it works | Common use |
|------|-------------|-----------|
| Manual rotary switch | Physical switch with Off/1/2/Both positions | Traditional battery selector (house, starter, both, off) |
| Continuous-duty relay | Electronically controlled contactor | Controlled by BMS or ignition switch |
| Victron Battery Protect | Electronic disconnect with programmable low-voltage cutoff | Protects battery from over-discharge, cuts loads at set voltage |
| BMS contactor | Built into the BMS | Lithium batteries disconnect automatically on fault conditions |

**Common products:** Blue Sea Systems m-Series battery switches, BEP battery switches, Victron Battery Protect (65A, 100A, 220A models).

### 15. Distribution Panel

A distribution panel organises individual electrical circuits with labeled breakers, providing a central control point for all the boat's circuits.

**What it does:** The distribution panel is the fuse box of the boat. Each breaker on the panel protects and controls one circuit — navigation lights, cabin lights, water pump, refrigerator, instruments, VHF radio, and so on. Turning a breaker off cuts power to that specific circuit. If a fault occurs on one circuit, only that breaker trips — the rest of the boat stays powered.

**Where it sits in the system:** The DC distribution panel connects to the positive bus bar on its input side. Each breaker output feeds one DC circuit (positive wire to the load, negative wire returns to the negative bus bar). Most boats have a separate AC distribution panel for 110V/230V circuits, fed from the inverter/charger AC output.

**DC panel vs AC panel:**

| Panel | Voltage | Circuits | Fed by |
|-------|---------|----------|--------|
| DC distribution panel | 12V or 24V | Navigation lights, cabin lights, water pump, bilge pump, instruments, VHF, refrigerator, autopilot, USB chargers | Positive bus bar (from battery bank) |
| AC distribution panel | 110V or 230V | AC outlets, watermaker, air conditioning, microwave, washing machine, water heater | Inverter/charger AC output or shore power pass-through |

**Common products:** Blue Sea Systems, BEP Marine, Paneltronics. Panels come in standard configurations (6, 8, 12, or 16 circuits) or custom layouts for new builds.

## Shore Power System

### 16. Shore Power Inlet

A shore power inlet is the weatherproof socket mounted on the boat's hull or deck where the marina power cable connects.

**What it does:** Provides the physical connection between the marina's AC supply and the boat's AC electrical system. The inlet accepts a standardised shore power cord and routes AC power to the boat's inverter/charger or AC distribution panel.

**Where it sits in the system:** The inlet mounts on the exterior of the boat (typically on the hull side or in the cockpit). From the inlet, cable runs to the galvanic isolator (or isolation transformer), then to the inverter/charger AC input and/or directly to the AC distribution panel.

**Standards:** Marinco/Hubbell connectors are the standard. 30A/125V (NEMA L5-30) is typical for boats in North America. 16A/230V or 32A/230V (CEE form) is standard in Europe. The connector must be rated for the shore power supply and have a weatherproof cover when not in use.

### 17. Galvanic Isolator

A galvanic isolator prevents stray electrical current flowing through the shore power ground wire from corroding the boat's underwater metals.

**What it does:** When a boat is connected to shore power, the safety ground wire connects the boat's electrical system to the marina's ground, which is also connected to every other boat on the dock. If another boat has a wiring fault, small DC currents can flow through the water from one boat's underwater metals (propellers, shafts, through-hulls, rudder stocks) to another's, accelerating galvanic corrosion. The galvanic isolator uses pairs of diodes to block these small DC currents while still allowing the safety ground to function for AC fault protection.

**Where it sits in the system:** Installed in the ground wire between the shore power inlet and the boat's AC grounding bus, as close to the inlet as practical.

**Alternative — isolation transformer:** An isolation transformer provides complete galvanic isolation between shore power and the boat's electrical system. It blocks all current flow through the ground wire by magnetically coupling the AC power through transformer windings with no direct electrical connection. More expensive and heavier than a galvanic isolator, but provides superior protection. Victron's isolation transformer range covers 2000VA to 7000VA. An isolation transformer is the preferred solution for boats spending extended time on shore power.

**Common products:** ProMariner ProSafe, Victron Galvanic Isolator, Dairyland (industrial). Victron also makes isolation transformers (3600W, 7000W).

## Monitoring and Control

### 18. Digital Switching Module

A digital switching module replaces traditional mechanical toggle switches with electronically controlled relays or solid-state outputs, enabling remote control and monitoring of every circuit on the boat.

**What it does:** Each output channel on the module is a relay (or MOSFET) that can be switched on or off via a digital command over NMEA 2000 or a proprietary network. This means lights, pumps, and equipment can be controlled from an MFD touchscreen, a smartphone app, or automation rules — in addition to physical switch panels. Each channel can also measure the current flowing through it, providing per-circuit power monitoring.

**Where it sits in the system:** Digital switching modules connect between the DC (or AC) distribution bus and the individual loads. They communicate with MFDs and control panels via NMEA 2000 or the manufacturer's proprietary network. Physical switch panels still exist as a backup input, but the digital module is the actual switch.

**Capabilities enabled by digital switching:**

- Control lights and pumps from any MFD or phone on the network.
- Automation: turn on the anchor light at sunset, activate the bilge pump when the float switch triggers, dim cockpit lights at night.
- Per-circuit current monitoring: see exactly how much power each circuit is drawing.
- Scene presets: "night sailing" dims all interior lights and turns on red instrument backlighting.

**Common products:** CZone (by BEP) is the most established marine digital switching system. EmpirBus NXT is another option. Both integrate with major MFD brands (Garmin, Raymarine, B&G/Simrad). Pricing is significant — a full CZone installation with multiple modules and touch panels can cost £3,000-8,000.

### 19. Cerbo GX / System Monitor

The Victron Cerbo GX is the central monitoring hub for the Victron ecosystem, aggregating data from all connected Victron devices and providing system-wide visibility and control.

**What it does:** The Cerbo GX runs Venus OS (Linux-based) and connects to every Victron device on the boat:

- MPPT solar controllers via VE.Direct
- MultiPlus/Quattro inverter/chargers via VE.Bus
- SmartShunt/BMV battery monitors via VE.Direct
- Lynx Smart BMS and compatible third-party BMS via VE.Can
- Third-party alternator regulators (Wakespeed WS500) via CAN bus

It aggregates this data into a single system view showing: battery SOC, solar input, AC loads, DC loads, shore power status, inverter status, and charging state. This data is displayed on a local touchscreen (GX Touch) and uploaded to the Victron VRM cloud portal for remote monitoring from anywhere.

**Where it sits in the system:** The Cerbo GX mounts near the battery bank and electrical panel, within cable reach of all Victron devices. It connects to the boat's WiFi network (or its own hotspot) for local access and to the internet via WiFi or Ethernet for VRM cloud access.

**Key features:**

| Feature | What it does |
|---------|-------------|
| System overview | Single screen showing all energy flows: sources, storage, loads. |
| VRM cloud monitoring | Access system data remotely from any browser or the VRM app. |
| Data logging | Records all system parameters for historical analysis. |
| Relay outputs | Two programmable relays for automation (e.g., start generator when SOC drops below 30%). |
| MQTT broker | Publishes all data on the local network for third-party software integration. |
| Modbus TCP | Industrial protocol access to all data points. |
| NMEA 2000 gateway | Publishes battery and solar data to the NMEA 2000 network for MFDs. |

**Common products:** Victron Cerbo GX (~£250) with optional GX Touch 50 or GX Touch 70 display (~£150-200). The Cerbo GX replaces older models (Color Control GX, Venus GX).

## System Diagram

How all the components connect:

```
Shore Power → Inlet → Galvanic Isolator → AC Panel → MultiPlus (inverter/charger)
                                                         ↕
Solar Panels → MPPT Controller → Bus Bar (+) ← → Battery Bank ← → Bus Bar (-)
                                    ↑                  ↑                ↑
                              Alternator          BMS (monitoring)    Shunt (SmartShunt)
                              (via DC-DC)              ↑                ↑
                                                  Cerbo GX ← ← ← ← ←
                                    ↓
                              DC Distribution Panel → Lights, Pumps, Instruments, Fridge...
                                    ↓
                              AC Distribution Panel → Outlets, Watermaker, AC, Microwave...
```

**Reading the diagram:**

- **Energy flows from left to right and top to bottom.** Solar panels and shore power are sources on the left. Loads are on the right.
- **The battery bank is the central node.** Every source charges it, every load draws from it.
- **Bus bars are the distribution hubs.** The positive bus bar connects all positive wires. The negative bus bar (with the shunt installed on it) connects all negative wires.
- **The Cerbo GX monitors everything** but does not carry power. It collects data from the MPPT, MultiPlus, SmartShunt, and BMS via communication cables and provides the system overview.
- **The MultiPlus bridges DC and AC.** It sits between the battery bank (DC side) and the AC distribution panel (AC side), converting power in both directions.

## How This Connects to the Planning Tools

These components are what the solar planning tool and future electrical planning tools model:

- **The solar planner** sizes three of these components: solar panels, MPPT charge controller, and battery bank. It calculates how much solar wattage is needed to replace daily consumption, what controller handles that array, and how much battery capacity provides adequate autonomy. See [Sizing Your Solar System](/knowledge/solar-sizing-guide).

- **A future electrical planner** would model the full system: shore power charging capacity, alternator output during motoring, AC and DC load profiles, generator runtime, inverter sizing, and cable sizing. The goal is to help you design a complete electrical system for a new build or refit — selecting every component in this article and verifying they work together.

## Further Reading

- [Understanding 12V Electrical Systems](/knowledge/understanding-12v-systems) — the fundamentals of DC power on a boat
- [12V vs 24V Systems](/knowledge/12v-vs-24v-systems) — choosing your system voltage
- [Alternator Charging](/knowledge/alternator-charging) — OEM vs aftermarket alternators and external regulators
- [Lithium Battery Technologies](/knowledge/lithium-battery-technologies) — LiFePO4, NMC, LTO, and emerging chemistries
- [Sizing Your Solar System](/knowledge/solar-sizing-guide) — calculating panel wattage and battery capacity
