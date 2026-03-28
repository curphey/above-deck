# Cruising Sailor Hardware & Electronics Landscape

**Date:** 2026-03-20
**Purpose:** Understand what hardware and electronics typical cruising sailors already have installed, to inform Above Deck integration planning.
**Audience:** Above Deck development team

---

## 1. Typical Instrument Setup by Boat Type

### Coastal Cruiser (35-45ft Monohull)

The bread-and-butter cruising sailboat. Often a 10-20 year old production boat (Beneteau, Jeanneau, Catalina, Bavaria) being refit by its second or third owner.

| Category | Typical Equipment | Common Brands | Notes |
|----------|------------------|---------------|-------|
| Chartplotter | Single 7-9" MFD at helm | Raymarine, Garmin, B&G | Often 5-10 years old |
| Depth/Speed | Thru-hull transducer + paddlewheel | Airmar, B&G Triton | NMEA 0183 or 2000 |
| Wind | Masthead anemometer + display | B&G, Raymarine i70 | Often the oldest instrument aboard |
| GPS | Built into chartplotter or separate puck | Garmin, various | Multi-constellation (GPS/GLONASS) now standard |
| Compass | Fluxgate heading sensor | B&G Precision-9, Raymarine | Required for autopilot integration |
| Autopilot | Wheel or below-deck linear drive | Raymarine EV-100/200, B&G | Single most important electronic after GPS |
| VHF | Fixed-mount DSC + 1-2 handhelds | Standard Horizon, ICOM | Universal. DSC requires MMSI registration |
| AIS | Class B transponder or receive-only | em-trak, Vesper, Digital Yacht | Growing adoption; some integrated into VHF |
| Radar | Small dome (18" or 24") | Raymarine Quantum, Garmin | ~50% of coastal cruisers have radar |

**Typical age of electronics:** 5-15 years. Many coastal cruisers are running a patchwork of gear from different generations and brands, connected via NMEA 0183 serial cables. Upgrading one component often means rewiring.

### Bluewater Cruiser (40-55ft)

Boats being prepared for ocean crossings or extended liveaboard cruising. Owners invest heavily in reliability and redundancy.

| Category | Additional/Upgraded Equipment | Notes |
|----------|------------------------------|-------|
| Chartplotter | Dual MFDs (helm + nav station), 9-12" displays | Redundancy is paramount |
| Radar | 4kW open array or high-end dome | Longer range for offshore weather detection |
| AIS | Class B+ transponder (5W, faster update rate) | Considered essential for ocean crossings |
| SSB/HF Radio | ICOM M802 (only model still in production, ~$3,400) | For weather fax, email via Winlink, cruiser nets |
| Satellite Comms | Starlink + Iridium GO! backup | Starlink primary, Iridium for emergency/redundancy |
| Autopilot | Heavy-duty hydraulic or below-deck drive | B&G, Simrad, Raymarine Evolution |
| Watermaker | 12V or engine-driven | Spectra, Rainman, Village Marine |
| Liferaft/EPIRB/PLBs | Required safety gear | ACR, Ocean Signal |
| Laptop at nav station | Running Expedition, OpenCPN, or TimeZero | Backup navigation and weather routing |

**ARC 2024 fleet comms data:** Among the 259-boat Atlantic Rally for Cruisers fleet, there were 267 satcom sets (190 Iridium, 71 Inmarsat, 6 other) compared with only 69 SSB radios. This demonstrates the rapid shift away from SSB toward satellite communications.

### Cruising Catamaran (40-50ft, e.g. Lagoon, Fountaine Pajot, Nautitech)

Production catamarans are typically delivered with more modern and complete electronics packages than equivalent monohulls, partly because they are newer designs and partly because of higher price points.

| Category | Typical Equipment | Notes |
|----------|------------------|-------|
| Chartplotter | Dual MFDs (helm station + nav desk), 9-12" | B&G or Garmin most common from factory |
| Instruments | Full NMEA 2000 backbone from build | Wind, depth, speed, heading integrated |
| Autopilot | Dual-station capable, linear or hydraulic | B&G or Raymarine Evolution |
| Solar | 600W-1200W panels on bimini/hardtop | Factory or owner-installed |
| Electrical | Often 12V house, some 24V on 45ft+ | Higher electrical loads than monohulls |
| Networking | More likely to have boat WiFi router | Larger interior, crew expectations |

**Charter-to-private conversion:** Many cruising cats (especially Lagoons) enter private ownership from charter fleets at 5-8 years old. These boats have basic charter-spec electronics that new owners immediately upgrade — a large addressable market for integration tools.

### Budget vs. Well-Equipped Comparison

| Component | Budget Cruiser (~$3-5K total) | Well-Equipped (~$15-25K total) |
|-----------|-------------------------------|-------------------------------|
| Chartplotter | iPad with Navionics ($500) | Dual 12" MFDs ($4,000-8,000) |
| Radar | None | 4kW dome or open array ($2,000-4,000) |
| Autopilot | Raymarine EV-100 wheel ($1,500) | Below-deck hydraulic ($3,000-5,000) |
| AIS | Receive-only ($200) | Class B+ transponder ($600-1,200) |
| Instruments | Basic depth + handheld GPS | Full N2K backbone with displays |
| VHF | Single fixed mount ($200) | DSC VHF + AIS + 2 handhelds ($500-800) |
| Communications | Cell phone only | Starlink + Iridium GO! ($2,000+) |
| Radar | None | Dome or open-array ($2,000-4,000) |

---

## 2. NMEA Network Prevalence

### Protocol Adoption

| Protocol | Status | Typical Boats |
|----------|--------|---------------|
| NMEA 0183 | Still extremely common | Any boat with gear older than ~2010. Serial, point-to-point. Still the only output on many GPS units, VHF radios, and AIS units |
| NMEA 2000 | Standard on all new equipment | Boats built/refit since ~2012. CAN bus backbone, plug-and-play, multi-device |
| Mixed 0183 + N2K | Most common real-world scenario | Majority of cruising boats. Requires gateway/bridge devices |
| SignalK | Growing among tech-savvy sailors | Bridges 0183, N2K, and WiFi. Raspberry Pi-based |
| Seatalk (legacy) | Declining | Older Raymarine-only boats. Seatalk NG is N2K compatible |
| OneNet (Ethernet) | Emerging, not yet widely deployed | NMEA's next-gen standard, IP-based. Few products shipping |

**Key insight for Above Deck:** The majority of cruising boats have a mix of NMEA 0183 and NMEA 2000 devices. Any integration strategy must handle both protocols. SignalK is the best bridge technology — it normalises all data into a single JSON-based format accessible over WiFi.

### Common NMEA Data Sources

| Instrument | Data Provided | Protocol Typical |
|------------|--------------|------------------|
| GPS | Position, SOG, COG, time | 0183 or N2K |
| Depth sounder | Depth below transducer/keel | 0183 or N2K |
| Wind sensor | Apparent/true wind speed + angle | N2K (modern) or 0183 |
| Speed (paddlewheel) | Boat speed through water | 0183 or N2K |
| Heading sensor | Magnetic/true heading | N2K preferred |
| AIS | Vessel traffic, own-ship position | 0183 (most common output) |
| Autopilot | Heading, rudder angle, mode | N2K or proprietary |

### Brand Market Positions

| Brand | Parent Company | Market Position | Strengths |
|-------|---------------|-----------------|-----------|
| **Garmin** | Garmin Ltd. | Market leader by volume | Ecosystem breadth, price/performance, consumer-friendly UI |
| **Raymarine** | FLIR / Teledyne | Strong #2, dominant in UK/EU | Autopilots (Evolution series), retrofit market |
| **B&G** | Navico (Faria) | Sailing specialist | Sailing-specific features, racing heritage, wind integration |
| **Simrad** | Navico (Faria) | Power/motor boat focus, some sailing | Shares platform with B&G (both Navico) |
| **Furuno** | Furuno Electric | Commercial/professional | Radar excellence, reliability, premium pricing |

B&G, Simrad, and Lowrance are all Navico brands (now owned by Faria Education Group / Brunswick). They share underlying hardware platforms but target different markets. B&G + Simrad together hold approximately 43% of the marine electronic navigation market.

---

## 3. Electrical Systems

### Victron Energy — The De Facto Cruiser Standard

Victron has achieved a dominant position among cruising sailors for power management. Their combination of product quality, open data protocols, and community support makes them the closest thing to a standard in marine electrical systems.

**Why Victron dominates among cruisers:**
- Open protocols: VE.Direct, VE.Bus, and Modbus TCP for data access
- Cerbo GX provides a central hub with MQTT, SignalK integration, and web dashboard
- VRM (Victron Remote Management) cloud portal for remote monitoring
- Active community and extensive documentation
- Passively cooled, marine-grade hardware (no fans to corrode)
- Broad product line covering everything from solar to inverters to battery management

**Typical Victron setup on a cruising sailboat:**

| Component | Product | Approx. Cost | Function |
|-----------|---------|-------------|----------|
| Solar charge controller | SmartSolar MPPT 100/30 or 150/35 | $150-300 | Manages solar panel charging |
| Battery monitor | SmartShunt 500A | $100-150 | Tracks state of charge, current, voltage |
| Inverter/charger | MultiPlus 12/3000/120 or 24/3000/70 | $1,200-2,000 | AC power from batteries, shore power charging |
| System hub | Cerbo GX | $350-450 | Central monitoring, VRM cloud, MQTT, SignalK |
| Display (optional) | GX Touch 50 or 70 | $250-400 | Touchscreen for Cerbo GX |
| DC-DC charger | Orion-Tr Smart 12/12-30 | $150-200 | Alternator-to-battery charging |
| Battery protect | Smart BatteryProtect 12/24V-65A | $50 | Low-voltage disconnect |

**Data access points (critical for Above Deck):**
- Cerbo GX exposes data via MQTT over WiFi
- VE.Direct serial protocol on charge controllers and shunts
- VRM cloud API for remote access
- SignalK plugin available for Cerbo GX
- Modbus TCP for industrial-grade integration

### Alternative Brands

| Brand | Position | Typical User | Notes |
|-------|----------|-------------|-------|
| **Renogy** | Budget alternative | Weekend sailors, budget builds | Lower build quality, less marine-specific. Plastic housings, fan-cooled. 96-97% vs Victron's 98% efficiency |
| **Mastervolt** | Premium alternative | Dutch/European boats, superyachts | Owned by same parent as Victron (Victron Group). CZone integration. Higher cost |
| **Blue Sea Systems** | Electrical distribution | All boats | DC panels, fuses, busbars. Complementary to Victron, not a competitor |
| **Wakespeed** | Alternator regulation | High-output charging | Pairs with Victron for engine-based charging |
| **Genasun** | Niche MPPT | Small solar installations | Very efficient, limited product line |

### Voltage Systems

| System | Prevalence | Typical Boats | Notes |
|--------|-----------|---------------|-------|
| **12V** | ~80% of cruisers | Monohulls under 45ft, most production boats | Most marine accessories are 12V. Simpler, more product options |
| **24V** | ~15-18% of cruisers | Catamarans 45ft+, bluewater boats, larger monohulls | Half the current for same power = smaller wiring. Growing with lithium adoption |
| **48V** | ~2% (growing) | New builds, hybrid systems | Highest efficiency, but limited 48V marine product ecosystem |

**Key trend:** 24V adoption is increasing as lithium batteries make voltage conversion simpler and as cruisers install higher electrical loads (Starlink, watermakers, induction cooktops). Victron's product line fully supports 12V, 24V, and 48V systems.

### Battery Chemistry Adoption (2025 estimates)

| Chemistry | Estimated Adoption | Trend | Typical Use |
|-----------|-------------------|-------|-------------|
| **AGM (lead-acid)** | ~50-55% of cruisers | Declining but still dominant | Still the default on most production boats. Affordable, no BMS required |
| **Lithium (LiFePO4)** | ~25-30% of cruisers | Growing rapidly | Dominant on new builds and refits. Higher upfront cost, but 3-4x cycle life |
| **Flooded lead-acid** | ~10-15% | Declining | Budget boats, traditional setups |
| **Gel** | ~5% | Stable/declining | Some European boats |

**Mixed chemistry is common:** AGM for engine start bank, lithium for house bank. This is a practical compromise — lithium provides deep-cycle performance where it matters, AGM handles the simpler engine-start role at lower cost.

**Lithium adoption drivers:** Victron's BMS ecosystem, 50% weight savings, 80% usable capacity (vs 50% for lead-acid), dropping prices (~$400-600/100Ah vs $200-300 for AGM equivalent).

---

## 4. Communication Equipment

### Adoption Rates by Equipment Type

| Equipment | Adoption Among Cruisers | Cost Range | Notes |
|-----------|------------------------|------------|-------|
| **VHF Radio (fixed DSC)** | ~99% | $150-400 | Effectively universal, legally required in most jurisdictions |
| **VHF Handheld** | ~90% | $80-300 | 1-2 handhelds as backup, dinghy use |
| **AIS (any type)** | ~60-70% | $200-1,200 | Class B transponder most common, growing regulatory push |
| **Starlink** | ~40-50% of active cruisers | $300-600 hardware + $50-250/mo | Adoption exploded 2023-2025. Now majority on rally/cruiser fleets |
| **Iridium (GO! or satphone)** | ~30-40% of bluewater | $800-1,400 + $50-150/mo | Emergency backup, weather data offshore |
| **SSB/HF Radio** | ~15-20% of bluewater | $3,400+ installed | Declining rapidly. Only ICOM M802 still in production |
| **InReach / PLB** | ~40-50% | $300-500 + $15-50/mo | Personal tracking, SOS. Garmin InReach dominant |
| **Cellular hotspot** | ~70% | varies | Primary comms in coastal/marina range |

### Starlink Impact

Starlink has fundamentally changed cruising communications since 2023. Key facts:

- **Starlink Roam** is the most popular plan among cruisers ($50/mo for 50GB, $165/mo for "priority" mobile)
- Coverage now extends across the Atlantic, most of the Mediterranean, Caribbean, and Pacific
- Mid-ocean Atlantic coverage was confirmed by ARC 2024 fleet
- **Power consumption** is the biggest issue: all dishes require AC power (40-100W continuous). Many sailors hack DC-DC conversion to avoid running an inverter
- **Starlink Mini** (2025) is particularly popular on sailboats — smaller, lighter, lower power draw (~30-40W)
- Has largely replaced SSB for weather, email, and social connection
- Iridium remains essential as backup — Starlink has no SOS/emergency function

### SSB Radio — Declining but Not Dead

SSB radios are declining but retain a loyal following for:
- Cruiser nets (Pacific Puddle Jump, Caribbean nets)
- GRIB weather data via Winlink/SailMail when no internet
- No subscription cost after hardware purchase
- Works everywhere, no satellite dependency

The ICOM M802 at ~$3,400 plus installation costs of $1,000-2,000 (antenna tuner, ground plane, backstay antenna) makes SSB a significant investment that fewer cruisers are making.

---

## 5. Tablets and Displays

### iPad as Chartplotter

The iPad is the single most common "non-marine" electronic device used for navigation aboard cruising sailboats. Its adoption as a primary or backup chartplotter is widespread.

| Use Case | Estimated Adoption | Notes |
|----------|-------------------|-------|
| iPad as **primary** chartplotter | ~20-25% of cruisers | Budget boats, smaller boats, tech-forward sailors |
| iPad as **backup/planning** tool | ~50-60% of cruisers | Nav station planning, passage prep, weather |
| Android tablet for navigation | ~10-15% | Less common due to fewer quality nav apps |
| Laptop at nav station | ~60-70% of bluewater | Weather routing, email, passage planning |
| Phone as backup nav | ~80%+ | Navionics/iSailor on phone as emergency backup |

**Popular iPad navigation apps:**
- **Navionics** (Garmin) — Most popular, excellent charts, ~$15/year
- **iSailor** — Good worldwide charts, popular in Europe
- **iNavX** — Long-standing, supports NMEA data over WiFi
- **Orca** — Modern, SignalK integration, growing following
- **TZ iBoat** (Furuno/MaxSea) — Premium, professional-grade
- **OpenCPN** (laptop) — Free, open-source, extensive plugin ecosystem

**iPad advantages:** Low cost ($400-800), familiar interface, excellent apps, easy chart updates, good screen quality.

**iPad limitations:** Not waterproof (requires case/mount), poor sunlight readability, heat issues in direct sun, no native NMEA connectivity (requires WiFi bridge), not designed for permanent helm mounting.

### Waterproof Displays

Some sailors install dedicated waterproof tablets or MFDs:
- **Raymarine Axiom** series (7-16") — Purpose-built marine MFD
- **Garmin GPSMap** series — Fully waterproof chartplotter
- **B&G Vulcan/Zeus** — Sailing-optimised MFD
- Aftermarket waterproof iPad mounts (RAM, Scanstrut) — popular compromise

### The Nav Station Setup

On bluewater boats, the nav station typically has:
- Laptop (MacBook or Windows) running OpenCPN, Expedition, or PredictWind
- iPad for backup/quick reference
- Dedicated VHF radio
- Breaker panel access
- Sometimes a second MFD repeater

---

## 6. Autopilot

### Market Overview

The autopilot is arguably the most critical electronic system for cruising sailors — it steers the boat for 80-90% of a passage.

| Brand | Popular Models | Strengths | Typical Boat Size |
|-------|---------------|-----------|-------------------|
| **Raymarine** | Evolution EV-100 (wheel), EV-200/400 (below-deck) | Most popular wheel pilot for smaller boats. Affordable entry point. Good DIY installation | 28-50ft |
| **B&G** | NAC-2/NAC-3 autopilot computers + drive units | Sailing-specific algorithms, wind vane steering modes, racing heritage | 35-60ft |
| **Simrad** | NAC-2/NAC-3 (shared platform with B&G) | Same hardware as B&G, different interface/branding | 35-55ft |
| **Garmin** | GHP Reactor ($1,100-4,100) | Growing market share, good ecosystem integration | 25-50ft |
| **NKE** | Gyropilot | Premium, French racing/cruising market | 35-70ft |

### Autopilot Types

| Type | Cost Range | Typical Use |
|------|-----------|-------------|
| Wheel pilot (attached to wheel) | $1,200-2,500 | Coastal cruisers, smaller boats. Easy DIY install |
| Below-deck linear drive | $2,500-5,000 | Mid-range cruisers. More powerful, hidden installation |
| Hydraulic drive | $3,500-7,000+ | Large boats, heavy displacement. Requires hydraulic system |

### pypilot — Open Source Autopilot

[pypilot](https://pypilot.org/) is an open-source autopilot system written in Python, running on Raspberry Pi.

- Supports tiller and wheel steering on boats up to ~40ft
- Extremely low power consumption (~1.2Ah over 3 hours vs 6+ Ah/hr for commercial autopilots)
- Integrates with SignalK, NMEA 0183, and OpenCPN
- Available as DIY build or pre-assembled units
- Active community, part of the OpenMarine ecosystem
- Adoption is niche but growing among technically skilled sailors

**Integration relevance:** pypilot is a natural fit for the Above Deck / SignalK ecosystem. Its low power consumption and open protocols make it attractive for budget-conscious cruisers.

---

## 7. WiFi / Networking on Boats

### Boat Network Architectures

Most cruising boats have evolved from "no network" to increasingly sophisticated setups:

**Tier 1 — Basic (most coastal cruisers):**
- Phone hotspot for internet
- No onboard WiFi network
- Instruments not networked or basic NMEA 0183

**Tier 2 — Connected (active cruisers):**
- Starlink or cellular router
- Basic onboard WiFi (from Starlink router or travel router)
- MFD has WiFi for app connectivity
- iPad connects to MFD for chart data

**Tier 3 — Integrated (tech-forward cruisers):**
- Dedicated marine router (Peplink, GL.iNet)
- Multiple WAN sources (Starlink + cellular + marina WiFi)
- SignalK server on Raspberry Pi
- All instruments bridged to WiFi via NMEA-to-WiFi gateway
- Victron Cerbo GX on same network

### Popular Networking Hardware

| Device | Approx. Cost | Use Case | Notes |
|--------|-------------|----------|-------|
| **Peplink BR1 Mini/Pro** | $400-900 | Multi-WAN router, cellular + Starlink + WiFi | Gold standard for cruiser networking. Failover between sources. Robust |
| **GL.iNet travel routers** | $30-80 | Budget WiFi repeater / VPN router | GL-AXT1800 popular. USB-C powered. Good for marina WiFi bridging |
| **Ubiquiti** | $100-300 | Mesh WiFi for larger boats | UniFi or AmpliFi for cabin coverage |
| **Starlink router** | Included with dish | Basic WiFi from Starlink | Often sufficient as sole router for smaller boats |
| **WiFi booster/repeater** | $150-400 | Extend marina WiFi range | Wave WiFi, Glomex, Digital Yacht |
| **NMEA-to-WiFi gateway** | $100-300 | Bridge instruments to WiFi | Yacht Devices, Digital Yacht, Actisense |

### Starlink on Boats — Practical Considerations

- **Starlink Standard / Mini:** Most cruisers use residential or Roam plans
- **Mounting:** Bimini/arch mount most common. Needs clear sky view
- **Power:** 40-100W continuous (Standard), 30-40W (Mini). Significant on a 12V system
- **DC conversion:** Popular DIY hack — bypass the AC adapter with a 12V/48V DC-DC converter to avoid running an inverter
- **Obstructions:** Mast, rigging, and sails cause intermittent dropouts. Catamarans have better clear-sky mounting options

---

## 8. What Sailors Actually Want — Forum & Community Insights

### Common Complaints About Marine Electronics

Based on analysis of Cruisers Forum, Sailing Anarchy, Panbo, and sailing YouTube channels:

1. **Vendor lock-in and incompatibility** — "Marine manufacturers refuse to share video data with each other." Replacing one brand's chartplotter with another means replacing the entire radar system. This is the #1 pain point.

2. **Proprietary protocols** — Each manufacturer has proprietary data streams alongside NMEA 2000. Garmin's OneHelm, Raymarine's LightHouse, B&G's ecosystem features only work within-brand.

3. **Obsolescence and software abandonment** — Manufacturers stop updating 5-year-old MFDs. A $3,000 chartplotter becomes a dead-end product with no new chart support.

4. **Cost of replacement** — Marine electronics carry a 3-5x premium over equivalent consumer electronics. A 12" marine display costs $2,000-4,000; a 12" iPad costs $800.

5. **Installation complexity and installer scarcity** — Qualified marine electronics installers are rare and expensive ($100-150/hr). Many cruisers are forced into DIY whether they want to be or not.

6. **Poor WiFi integration** — Instruments don't easily expose data over WiFi. Getting NMEA data onto a tablet requires additional gateway hardware.

7. **Power consumption** — Electronics draw significant power. Radar, MFDs, Starlink, and autopilot can easily consume 15-25A continuous on a 12V system.

### Popular DIY Projects Among Cruisers

| Project | Popularity | Complexity | Relevance to Above Deck |
|---------|-----------|------------|------------------------|
| Raspberry Pi + SignalK server | High among tech sailors | Medium | Core integration platform |
| Victron system monitoring/optimisation | Very high | Low-Medium | Direct integration opportunity |
| AIS setup (transponder + display) | High | Low | Data source for vessel tracking |
| Autopilot install/upgrade | High | Medium-High | Integration target |
| Starlink installation + DC conversion | Very high (2024-2025) | Medium | Enables connectivity for Above Deck |
| Solar panel installation + MPPT | Very high | Medium | Victron data integration |
| OpenPlotter / OpenCPN setup | Medium | Medium | Aligned open-source ecosystem |
| Tank level monitoring (DIY sensors) | Medium | Medium | Data for onboard monitoring |
| WiFi network build (Peplink/GL.iNet) | Growing | Medium | Infrastructure Above Deck runs on |
| pypilot build | Niche | High | Open-source autopilot integration |

### What Cruisers Say They Want

Synthesised from forum discussions and community feedback:

- **One screen that shows everything** — battery state, weather, navigation, engine data, without switching between 4 different apps and devices
- **Phone/tablet as primary interface** — "Why do I need a $3,000 marine display when my iPad is better?"
- **Cross-brand integration** — "I have Garmin charts, Raymarine autopilot, B&G wind, and Victron power. Nothing talks to everything."
- **Affordable radar integration** — Radar remains the most expensive and most proprietary component
- **Better weather routing** — Accessible, accurate weather routing without expensive subscriptions
- **Remote monitoring** — Check on the boat from shore (batteries, bilge, anchor alarm)
- **Open data access** — "It's my data from my sensors on my boat. Let me access it."
- **Low power consumption** — Every watt matters when you're off-grid

---

## 9. Budget Analysis

### What Cruisers Spend on Electronics

| Category | Budget Cruiser | Mid-Range | Well-Equipped | Notes |
|----------|---------------|-----------|---------------|-------|
| **Navigation (MFD/plotter)** | $500 (iPad) | $1,500-3,000 | $5,000-10,000 | Single biggest variable |
| **Autopilot** | $1,500 | $2,500-3,500 | $4,000-7,000 | Most critical system |
| **Radar** | $0 | $1,500-2,500 | $3,000-5,000 | Often skipped on budget boats |
| **AIS** | $200 (rx only) | $400-800 | $800-1,200 | Increasingly regulated |
| **VHF + handhelds** | $250 | $400-600 | $600-800 | Little variation |
| **Instruments (wind/depth/speed)** | $500 | $1,000-2,000 | $2,000-4,000 | Depends on existing gear |
| **Communications (Starlink/sat)** | $300 | $500-1,000 | $1,500-3,000 | Starlink hardware + Iridium |
| **Electrical (Victron/solar)** | $1,000 | $2,500-4,000 | $5,000-10,000 | Solar + batteries + management |
| **Networking** | $50 | $200-500 | $500-1,000 | Router + NMEA gateway |
| **Installation labour** | $0 (DIY) | $1,000-2,000 | $3,000-6,000 | $100-150/hr |
| **TOTAL** | **$4,300** | **$10,500-17,600** | **$23,400-47,000** | Excluding installation |

### Where They Spend vs. Where They Save

**Where cruisers invest (high willingness to pay):**
- Autopilot — directly affects quality of life at sea
- Safety equipment (AIS, EPIRB, liferaft)
- Batteries and charging (Victron)
- Starlink — transformed the cruising experience

**Where cruisers try to save:**
- Chartplotter — iPad is "good enough" for many
- Instruments — older gear still works
- Radar — deferred until bluewater plans firm up
- Installation labour — strong DIY culture

### Open-Source as Cost Saving

| Open-Source Solution | Replaces | Savings | Adoption |
|---------------------|----------|---------|----------|
| **OpenCPN** | TimeZero, Navionics (desktop) | $200-500/yr | Medium-high among cruisers |
| **SignalK** | Proprietary instrument bridges | $200-500 | Growing, especially with Victron users |
| **OpenPlotter** | Integrated nav system | $1,000-3,000 | Niche but enthusiastic |
| **pypilot** | Commercial autopilot | $1,000-3,000 | Small but dedicated community |
| **KBox / Yacht Devices DIY** | NMEA gateways | $100-300 | Small |

**Total Raspberry Pi + SignalK + OpenCPN setup:** ~$150-300 in hardware, replacing $2,000-5,000 in commercial equivalents. The trade-off is setup time and technical skill.

---

## 10. Integration Opportunities for Above Deck

### Highest-Value Integration Targets

Based on prevalence and data accessibility:

| Data Source | Prevalence | Protocol/Access | Integration Value |
|-------------|-----------|-----------------|-------------------|
| **Victron (via Cerbo GX)** | Very high among target users | MQTT, Modbus TCP, VE.Direct, VRM API | **Critical** — power monitoring, solar planning validation |
| **NMEA 2000 backbone** | High (most boats built since 2012) | Via SignalK server or WiFi gateway | **High** — wind, depth, speed, heading, GPS |
| **NMEA 0183 instruments** | Very high (legacy gear) | Via SignalK server or USB adapter | **High** — backwards compatibility essential |
| **AIS data** | Medium-high | Via NMEA 0183/2000 or web APIs | **Medium** — vessel tracking, anchoring context |
| **Starlink / network status** | Growing rapidly | Via router API or network probing | **Medium** — connectivity status display |
| **Autopilot status** | High | Via NMEA 2000 | **Medium** — passage monitoring |

### Recommended Integration Architecture

```
[NMEA 0183 instruments] ──┐
[NMEA 2000 backbone] ─────┤
[Victron VE.Direct] ──────┼──▶ [SignalK Server] ──▶ [Above Deck]
[Victron Cerbo GX MQTT] ──┤         (Raspberry Pi       (Web app on
[AIS transponder] ─────────┘          or Go server)        iPad/tablet)
```

SignalK is the natural integration hub. It already handles NMEA 0183, NMEA 2000, Victron, and dozens of other data sources. Above Deck should consume SignalK's REST/WebSocket API rather than implementing individual protocol parsers.

---

## Sources

- [Modern Boat Electronics and the Latest Marine Instruments — Sailboat Cruising](https://www.sailboat-cruising.com/boat-electronics.html)
- [Budgeting for Electronics — Cruising World](https://www.cruisingworld.com/budgeting-for-electronics/)
- [Planning a Sailboat Electronics Upgrade — Cruising World](https://www.cruisingworld.com/story/gear/planning-sailboat-electronics-upgrade/)
- [Cruising Sailboat Electronics Setup with Signal K — Henri Bergius](https://bergie.iki.fi/blog/signalk-boat-iot/)
- [Your Guide to Sailing Electronics — Orca](https://getorca.com/blog/guide_sailing_electronics/)
- [NMEA 2000 Explained — CSS Electronics](https://www.csselectronics.com/pages/nmea-2000-n2k-intro-tutorial)
- [NMEA 0183 and NMEA 2000 Guide — Ocean Science Technology](https://www.oceansciencetechnology.com/resources/nmea-2000-nmea-0183-guide/)
- [Understand NMEA 0183, NMEA 2000 & OneNet — Digital Yacht](https://digitalyachtamerica.com/understand-nmea/)
- [Benefits of NMEA 2000 over 0183 — Cruisers Forum](https://www.cruisersforum.com/forums/f13/benefits-of-nmea-2000-over-0183-views-please-204203.html)
- [Victron Energy — Sailing Yacht Solutions](https://www.victronenergy.com/markets/marine/sailing-yacht)
- [Lithium Batteries Buyer's Guide — Attainable Adventure Cruising](https://www.morganscloud.com/2024/01/29/lithium-batteries-buyers-guide-part-1-bms-requirements/)
- [How We Built a Reliable Sailboat Electrical System — Tranquility Mare](https://tranquilitymare.com/en/sailboat-electrical-system/)
- [AGM vs Lithium: Best Deep Cycle Marine Battery 2025 — MANLY Battery](https://manlybattery.com/agm-vs-lithium-best-deep-cycle-marine-battery/)
- [Starlink for Boats Reviewed in 2025 — Boat Sail Mag](https://www.boatsailmag.com/boating/starlink-for-boats-internet-off-grid/)
- [Starlink at Sea: How Satellite Internet is Transforming Cruising — Sailoscope](https://www.sailoscope.com/post/satellite-internet-starlink-for-sailors)
- [Starlink at Sea — All Change for Cruisers — Yachting World](https://www.yachtingworld.com/all-latest-posts/starlink-at-sea-all-change-for-cruisers-145597)
- [Starlink: Affordable Internet for Boats — Catamaran Gurus](https://catamaranguru.com/starlink-internet-boats/)
- [Starlink on Sailboats — Yamana Sailing Life](https://www.yamana.ch/en/2025/04/04/starlink-on-sailboats-the-revolution-of-connectivity-at-sea/)
- [Chartplotter vs iPad — Improve Sailing](https://improvesailing.com/navigation/chartplotter/tablet)
- [Navigating by Tablet — SAIL Magazine](https://sailmagazine.com/cruising/navigating-by-tablet/)
- [Are Tablets the Future of Marine Navigation? — Passagemaker](https://passagemaker.com/design-restoration-and-refit/electronics-trawler-news/are-we-seeing-a-tablet-takeover/)
- [Navionics iPad vs Chartplotter — Sweet Ruca](https://sweetruca.com/navionics-ipad-vs-chartplotter-bg-raymarine-garmin-which-is-best-for-sailboats/)
- [iPad Navigation Apps Tested — Yachting World](https://www.yachtingworld.com/all-latest-posts/ipad-navigation-apps-tested-61366)
- [Autopilot Buyer's Guide — Attainable Adventure Cruising](https://www.morganscloud.com/2023/03/26/autopilot-buyers-guide/)
- [pyPilot — Open Boat Projects](https://open-boat-projects.org/en/pypilot/)
- [pypilot: the Open Source Emergency Autopilot — Boat News](https://www.boatnews.com/story/40676/pypilot-the-open-source-emergency-autopilot-that-saved-our-trip)
- [Signal K: The Open-Source Wave — Sailing Religion](https://sailingreligion.com/blogs/news/signal-k-the-open-source-wave-making-boats-smarter-freer-and-fierce)
- [OpenPlotter — OpenMarine](https://openmarine.net/openplotter)
- [Peplink Sailboat Network Setup — Peplink Community Forum](https://forum.peplink.com/t/help-picking-out-hardware-for-a-sailboat-starlink-mobile-data-wifi-wan-possible-onboard-mesh-needed/44858)
- [Internet Connected Boat WiFi — Sustainable Sailing](https://sustainablesailing.net/2025/04/21/internet-connected-boat-wifi-working/)
- [Victron vs Renogy MPPT — Blue Marine](https://bluemarine.com/blogs/news/victron-vs-renogy-which-mppt-charge-controller-is-right-for-you)
- [Marine Electronics Integration 101 — PropTalk](https://www.proptalk.com/marine-electronics-integration-101)
- [Top Marine Electronics Brands in 2025 — Boating Ads EU](https://boatingads.eu/top-marine-electronics-brands-in-2025-a-european-market-overview/)
- [Marine Electronics Market Size — Grand View Research](https://www.grandviewresearch.com/industry-analysis/marine-electronics-market-report)
- [Is an SSB Marine Radio Worth Having? — Sailboat Cruising](https://www.sailboat-cruising.com/SSB-marine-radio.html)
- [SSB/HF Radio Applications in Modern Sailing — Pacific Cup](https://pacificcup.org/kb/ssbhf-radio-applications-modern-sailing-vessels)
- [Atlantic Gear Survey: Long-Range Communications — Yachting World](https://www.yachtingworld.com/gear-reviews/atlantic-gear-survey-long-range-communications-sea-83429)
- [Comparing Class B AIS Transceivers — Practical Sailor](https://www.practical-sailor.com/marine-electronics/comparing-class-b-ais-transceivers/)
- [How to Get the Latest Boat Electronics on a Budget — Yachting Monthly](https://www.yachtingmonthly.com/gear/how-to-get-the-latest-boat-electronics-on-a-budget-78055)
