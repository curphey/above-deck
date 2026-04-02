---
title: "12V vs 24V: Choosing Your Boat's Electrical System"
summary: "A detailed comparison of 12V and 24V electrical systems for cruising boats — wiring, equipment compatibility, efficiency, cost, and when 24V makes sense."
---

## The Fundamental Trade-off

Every electrical system on a boat comes down to one equation: **P = V × I** (power equals voltage times current). A 3000W inverter on a 12V system draws 250 amps. The same inverter on a 24V system draws 125 amps. The power is identical. The current is halved.

Current is what determines wire size, connector size, fuse ratings, and heat generation. Higher current requires thicker cables to avoid excessive voltage drop and heat. This is why the 12V vs 24V decision matters — it is fundamentally about how much copper you need to move the energy from your batteries to your loads.

## Why 12V Is the Standard

The 12V standard in marine electrical systems is inherited from the automotive industry. Cars, trucks, and motorcycles all run 12V systems, which means the global supply chain for 12V components is enormous. This has several practical consequences:

- **Equipment availability.** The vast majority of marine electronics (VHF radios, chartplotters, AIS transponders, depth sounders) are designed for 12V input. Many accept a range of 10-30V DC, but 12V is the baseline.
- **Parts availability worldwide.** In a remote anchorage or a developing-country port, you can find 12V relays, fuses, switches, and wire at any automotive shop. 24V parts require a truck or industrial supplier.
- **Simplicity.** A single 12V battery is a complete system. No series wiring, no balancing between battery pairs, no voltage conversion for accessories.
- **Crew familiarity.** Most sailors have some experience with 12V systems from cars and prior boats. 24V introduces unfamiliar territory.

For boats under 40 feet with moderate electrical loads (LED lighting, a refrigerator, instruments, an autopilot, and a modest inverter), 12V is entirely adequate and there is no practical reason to change.

## Why 24V Exists

As boats get larger and electrical demands increase, 12V systems hit physical limits. The problems are all current-related:

- **Cable size becomes impractical.** A 250A circuit (3000W at 12V) requires 70mm² cable — about the diameter of your thumb. Routing this through bulkheads, behind panels, and around corners on a boat is difficult and expensive.
- **Voltage drop over distance.** Long cable runs to a bow thruster, anchor windlass, or mast-mounted equipment suffer significant voltage drop at high currents. On a 50-foot catamaran, the cable run from batteries to bow thruster can be 15 metres each way.
- **Terminal and fuse ratings.** 250A+ connections require large, expensive terminal lugs and fuse holders rated for those currents. The physical hardware gets bulky.
- **Heat generation.** High current through any resistance generates heat (P = I²R). At 250A, even small resistance in a terminal or connection produces measurable heat.

24V solves all of these problems by halving the current for the same power delivery.

## The Wiring Argument

This is the single most compelling reason to choose 24V on a larger boat. The numbers are concrete.

### Cable sizing for a 3000W inverter

| Parameter | 12V System | 24V System |
|-----------|-----------|-----------|
| Current draw | 250A | 125A |
| Recommended cable size | 70mm² | 35mm² |
| Cable weight per metre (copper) | ~0.6 kg/m | ~0.3 kg/m |
| Typical cable cost per metre | £12-18 | £6-10 |
| Terminal lug size | M10-M12 bolt | M8 bolt |
| Fuse rating required | 300A ANL | 150A ANL |

For a typical installation with 2-3 metres of cable between battery bank and inverter (positive and negative runs), the 12V system needs roughly 6 metres of 70mm² cable. The 24V system needs 6 metres of 35mm² cable. That is a saving of roughly 1.8 kg of copper and £50-80 in cable cost — just for the inverter circuit alone.

### Voltage drop over distance

Voltage drop matters because equipment performance degrades when supply voltage falls. A 12V device operating at 11V may malfunction or shut down. The standard maximum acceptable voltage drop is 3% for critical circuits and 10% for non-critical circuits.

Example: a 1000W anchor windlass with a 15-metre cable run (each way, so 30 metres total conductor length):

| Parameter | 12V System | 24V System |
|-----------|-----------|-----------|
| Current draw | 83A | 42A |
| Voltage drop with 16mm² cable | 3.1V (26%) | 1.6V (6.5%) |
| Voltage drop with 25mm² cable | 2.0V (17%) | 1.0V (4.2%) |
| Voltage drop with 35mm² cable | 1.4V (12%) | 0.7V (3.0%) |
| Cable size needed for <3% drop | 70mm² | 25mm² |

On a 12V system, achieving acceptable voltage drop for a windlass at the bow of a 50-foot catamaran requires 70mm² cable — expensive, heavy, and difficult to route. On 24V, 25mm² cable achieves the same performance.

This pattern repeats for every high-draw circuit with a long cable run: bow thruster, electric windlass, mast-top instruments, davit crane, and watermaker.

## Equipment Compatibility

This is where 24V becomes more complicated. The marine equipment ecosystem is primarily designed for 12V.

### Equipment available in both 12V and 24V

| Equipment | 12V Options | 24V Options | Notes |
|-----------|------------|------------|-------|
| Inverter/chargers | Wide range | Wide range | Victron MultiPlus, Mastervolt Mass Combi, Victron Quattro all available in both |
| MPPT solar controllers | Wide range | Wide range | Victron SmartSolar, Renogy Rover available in both |
| Battery monitors | Wide range | Wide range | Victron SmartShunt, Victron BMV-712 work with both |
| LED lighting | Most are 10-30V DC | Same products | Wide-input LED drivers handle both voltages |
| Watermakers | Available | Available | Spectra, Rainman offer 24V models |
| Anchor windlass | Available | Available | Lewmar, Maxwell, Quick offer 24V models |
| Bow thruster | Available | Available | Side-Power, Vetus offer 24V models |
| Autopilot drives | Available | Available | Raymarine, B&G, Garmin all offer 24V drives |
| Refrigeration compressors | Available | Available | Danfoss/Secop BD series available in both |
| Battery chargers (shore) | Wide range | Wide range | Victron Skylla, Mastervolt ChargeMaster in both |

### Equipment that is primarily 12V

| Equipment | Why | Workaround on a 24V boat |
|-----------|-----|--------------------------|
| VHF radios | Almost all marine VHFs are 12V (ICOM, Standard Horizon, Raymarine) | 24V-to-12V DC-DC converter |
| Some chartplotters | Older or smaller models may be 12V only | Check specs — many modern MFDs accept 10-35V DC input |
| Car/truck accessories | USB chargers, fans, phone mounts from automotive suppliers | 24V-to-12V step-down converter or buy marine-spec |
| Handheld device chargers | Most cigarette-lighter chargers assume 12V | Use wide-input USB chargers rated for 24V |
| Some stereo head units | Consumer marine stereos often 12V only | Fusion, JL Audio marine units often accept 10-30V |

### The NMEA 2000 bus

NMEA 2000 operates at 12V regardless of the boat's house electrical system. The bus has its own power supply specification: 9-16V DC on the backbone. If your boat runs 24V, you need a dedicated 24V-to-12V DC-DC converter to power the NMEA 2000 backbone. This is a small converter (typically 3-5A capacity is sufficient), but it is an additional component and potential failure point.

All NMEA 2000 instruments (wind sensors, depth transducers, heading sensors, GPS receivers, AIS transponders) draw their power from the 12V bus, so they work identically on a 12V or 24V boat — the conversion just happens at the backbone power supply rather than per-device.

### Victron ecosystem

Victron Energy has comprehensive 24V product ranges. If you are building a Victron-based electrical system (which is common on cruising boats), 24V is fully supported:

- **MultiPlus / MultiPlus-II** — inverter/charger, available in 24V/3000VA, 24V/5000VA
- **SmartSolar MPPT** — solar charge controllers, 24V models (e.g., 100/30, 150/35, 250/70)
- **SmartShunt** — battery monitor, voltage-independent (works with any system voltage)
- **Cerbo GX** — system monitor, powered from any voltage 8-70V DC
- **Lynx Smart BMS** — battery management system, available in 24V
- **Orion-Tr Smart** — DC-DC converters for 24V-to-12V conversion

This means a Victron-based 24V system is essentially plug-and-play with the same configuration tools and VRM cloud monitoring as a 12V system.

## Battery Configuration

### 12V LiFePO4

A 12V lithium iron phosphate battery uses 4 cells in series (4S), each with a nominal voltage of 3.2V:

- Nominal voltage: 4 × 3.2V = **12.8V**
- Fully charged: 4 × 3.65V = **14.6V**
- Low cutoff: 4 × 2.5V = **10.0V** (BMS will disconnect before this)
- Standard capacities: 100Ah, 200Ah, 300Ah per battery
- BMS: built into each battery (drop-in replacements) or external for DIY builds

Multiple 12V batteries connect in parallel to increase capacity. A 400Ah bank is two 200Ah batteries in parallel — straightforward wiring and the BMS in each battery handles cell balancing independently.

### 24V LiFePO4

A 24V lithium iron phosphate battery uses 8 cells in series (8S):

- Nominal voltage: 8 × 3.2V = **25.6V**
- Fully charged: 8 × 3.65V = **29.2V**
- Low cutoff: 8 × 2.5V = **20.0V** (BMS will disconnect before this)
- Standard capacities: 100Ah, 200Ah per battery
- BMS: must handle 8-cell series balancing, or two 12V batteries in series with inter-battery communication

There are two common approaches to building a 24V bank:

**Option 1: Purpose-built 24V batteries.** A single unit with 8 cells in series and an integrated BMS. Examples include Victron Smart LiFePO4 24V/200Ah and Battle Born 24V batteries. Simpler installation, but fewer product choices and higher per-unit cost.

**Option 2: Two 12V batteries in series.** Connect two 12V LiFePO4 batteries in series to create 24V. This works but introduces a complication: the two batteries must be matched (same capacity, same age, same manufacturer) and their BMS units must communicate to prevent imbalance. Some manufacturers (Victron, Lithionics) support series communication between their batteries. Others do not, and series-connecting batteries from different manufacturers or with independent BMS units can cause problems — if one battery's BMS trips, the other continues to push current through a broken circuit.

### Mixed voltage systems

Many 24V boats maintain a separate 12V battery for engine starting (since most marine diesel starters are 12V). This requires a DC-DC converter or battery-to-battery charger between the two systems. The Victron Orion-Tr Smart 24/12-30 is a common choice — it converts 24V house power to charge the 12V starter battery at up to 30A.

Some boats go further and run a small 12V sub-system for equipment that is only available in 12V (VHF radios, certain electronics), powered by a DC-DC converter from the 24V house bank. This adds complexity but avoids the need to find 24V replacements for every component.

## Charging Sources

### Shore power chargers

Available in both voltages from all major manufacturers. There is no meaningful disadvantage to either voltage here.

| Charger | 12V Model | 24V Model |
|---------|----------|----------|
| Victron Skylla-i | 12V/70A | 24V/35A (same output power) |
| Victron MultiPlus-II (charger mode) | 12V/50A | 24V/30A |
| Mastervolt ChargeMaster Plus | 12V/75A | 24V/40A |
| Sterling Pro Charge Ultra | 12V/60A | 24V/30A |

Note that 24V chargers have lower amp ratings because they are pushing the same wattage at double the voltage (P = V × I again).

### Solar MPPT controllers

24V systems have a slight advantage with solar charging. A 24V MPPT controller can accept higher panel voltages and operate more efficiently with panels wired in series. This means you can sometimes use thinner cables from the panels to the controller and experience less loss in long cable runs across a bimini or hardtop.

Victron SmartSolar MPPT controllers auto-detect 12V or 24V battery banks. The same unit works with either system.

### Alternator charging

This is where 24V boats face a practical limitation. Most marine diesel engines come with 12V alternators as standard equipment. Options for 24V alternator charging:

- **24V aftermarket alternators.** Available from Balmar and Electrodyne, but the selection is narrower and prices are higher. A Balmar XT-170 24V alternator is roughly $800-1,200.
- **DC-DC converter from 12V alternator.** Keep the stock 12V alternator and use a DC-DC charger (like the Sterling BB1260 or Victron Orion-Tr Smart) to step up to 24V. This works but adds conversion losses (typically 5-10%) and limits charge rate.
- **Dual-output alternators.** Some alternators can be wound for dual voltage output, but these are specialist items.

For boats that rely heavily on alternator charging (passage-making under engine), the 24V alternator situation is worth investigating early in the planning process. It is solvable, but it is not as simple as walking into a chandlery and buying an off-the-shelf replacement.

## The Catamaran Question

Production catamarans present a specific set of considerations:

### Factory configurations

| Boat | Size | Standard Voltage | Notes |
|------|------|-----------------|-------|
| Lagoon 40 | 40ft | 12V | Optional upgrade to 24V on some recent models |
| Lagoon 46 | 46ft | 12V | 24V available as factory option |
| Lagoon 55 | 55ft | 24V | Standard from factory |
| Fountaine Pajot Isla 40 | 40ft | 12V | Standard |
| Fountaine Pajot Elba 45 | 45ft | 12V | 24V optional |
| Fountaine Pajot Aura 51 | 51ft | 24V | Standard from factory |
| Nautitech 40 Open | 40ft | 12V | Standard |
| Nautitech 46 Open | 46ft | 12V/24V | Depends on specification |
| Catana/Bali 4.8 | 48ft | 12V | Standard |
| Excess 15 | 49ft | 24V | Standard from factory |

The pattern is clear: most production catamarans under 45 feet ship with 12V systems. Above 50 feet, 24V is increasingly the default. The 45-50 foot range is where it varies by manufacturer and specification.

### Retrofitting voltage

Converting an existing 12V boat to 24V is technically possible but practically expensive. Every component in the system must change or be verified compatible: batteries, chargers, inverters, solar controllers, DC distribution panels, fuses, and any hardwired 12V equipment. On a catamaran with two hulls and extensive wiring, this can easily cost more than the original electrical installation.

The realistic advice: if buying a new or semi-custom catamaran and you plan to install high-draw equipment (air conditioning, watermaker, electric cooking, large inverter), specify 24V at the factory. If buying used, work with the voltage you have unless you are doing a complete electrical refit anyway.

## Cost Comparison

The total cost of a 12V vs 24V system depends on the boat and the loads. Here is a rough comparison for a 45-foot catamaran with a 400Ah lithium bank, 3000W inverter, 800W solar, watermaker, and anchor windlass.

| Component | 12V System (approx.) | 24V System (approx.) |
|-----------|---------------------|---------------------|
| Battery bank (400Ah LiFePO4) | £3,200-4,000 (2×200Ah 12V parallel) | £3,600-4,500 (2×200Ah 12V in series or 1×24V unit) |
| Inverter/charger (3000W) | £1,200-1,800 | £1,300-1,900 |
| MPPT solar controller | £250-400 | £250-400 |
| Battery monitor | £150-200 | £150-200 |
| Heavy cable (inverter, windlass, thruster) | £400-700 | £200-400 |
| DC-DC converter (24V-to-12V for NMEA 2000, VHF, etc.) | Not needed | £80-150 |
| 24V alternator or DC-DC step-up | Not needed | £400-1,200 |
| Fuses and breakers | £150-250 | £100-180 |
| **Approximate total (electrical core)** | **£5,350-7,350** | **£6,080-8,930** |

The 24V system costs roughly 10-20% more in component prices, but saves on cable costs. For a large boat with many long cable runs, the cable savings can partially or fully offset the premium on components. The larger the boat, the more the wiring savings matter.

## Decision Framework

### Go 12V if:

- Boat is under 40 feet
- Modest power consumption (under 2000W inverter, no air conditioning or electric cooking)
- You want the widest possible equipment choice
- Buying a used boat with existing 12V system
- Cruising areas where replacement parts may be hard to find
- Budget is tight and simplicity is valued

### Go 24V if:

- Boat is over 45 feet, especially a catamaran
- Heavy electrical loads planned (3000W+ inverter, air conditioning, watermaker, electric cooking)
- Long cable runs (bow thruster, windlass on a large boat)
- Building new or specifying a semi-custom build where you can choose from the start
- Committed to a Victron or similar ecosystem with full 24V support
- Comfortable with slightly more complex system architecture

### Either works if:

- Boat is 40-45 feet with moderate electrical needs
- No air conditioning or electric cooking
- Inverter in the 2000-3000W range
- Personal preference and familiarity can guide the decision

## 48V: The Future?

It is worth noting that 48V systems are emerging in the marine world, driven by electric propulsion and very high power demands. Torqeedo, Oceanvolt, and other electric drive manufacturers use 48V. Some large custom yachts run 48V house banks. However, 48V marine equipment for typical cruising loads (inverters, chargers, windlasses) is still limited, and the standard for cruising boats in the foreseeable future remains 12V or 24V.

## Further Reading

- [Understanding 12V Electrical Systems](/knowledge/understanding-12v-systems) — the fundamentals of DC power on a boat
- [Sizing Your Solar System](/knowledge/solar-sizing-guide) — how to calculate panel wattage and battery capacity
