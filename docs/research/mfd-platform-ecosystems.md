# MFD Platform Ecosystems: Walled Gardens and the Open-Source Opportunity

**Date:** 2026-03-24
**Purpose:** Competitive intelligence on how Garmin, Raymarine, Simrad/B&G, and Furuno are building walled-garden platforms around their hardware, and where an open-source alternative can compete.

---

## Table of Contents

1. [Garmin OneHelm](#1-garmin-onehelm)
2. [Raymarine LightHouse 4](#2-raymarine-lighthouse-4)
3. [Simrad / B&G / Lowrance (Navico)](#3-simrad--bg--lowrance-navico)
4. [Furuno](#4-furuno)
5. [The Platform Lock-In Problem](#5-the-platform-lock-in-problem)
6. [The Open-Source Opportunity](#6-the-open-source-opportunity)
7. [Market Size and User Segments](#7-market-size-and-user-segments)

---

## 1. Garmin OneHelm

### What Is OneHelm?

OneHelm is Garmin's integrated helm platform, launched in 2018. It allows boaters to control third-party onboard systems from a single Garmin MFD. It is the most extensive first-party integration platform in marine electronics.

### Technical Architecture

- **HTML5 app model.** Third-party manufacturers run a web server on their hardware (e.g., a Seakeeper control module). This serves an HTML5 interface to a browser embedded in the Garmin MFD's operating system.
- **Network discovery.** Uses multicast DNS and UPnP for automatic app discovery on the Garmin Marine Network (Ethernet/WiFi).
- **Transparent to the user.** Boaters see what appears to be a native screen; they are unaware of the underlying browser.
- **Hardware requirement.** Currently functions only on Garmin's higher-end MFDs (GPSMAP 8400/8600/9000 series and newer) that have the embedded browser capability.

### Third-Party App Partners

Over 30 partners as of 2025, including:

| Category | Partners |
|----------|----------|
| Stabilization | Seakeeper, Smartgyro |
| Lighting | Lumishore, Shadow-Caster, Lumitec |
| Digital switching | CZone, OctoPlex, EmpirBus, Boning |
| Audio | Fusion (Garmin-owned) |
| Climate | Webasto (BlueCool Connect) |
| Engines | Honda Marine, Mercury |
| Safety | SEA.AI (AI obstacle detection), Digital Yacht (NET Protect) |
| Water systems | HP Watermakers |
| Fishing | Lindgren-Pitman |
| Vessel monitoring | Hefring Marine |

### Developer Story

- **No public SDK.** Garmin does not publish OneHelm developer documentation and does not respond to requests from independent developers.
- **Invitation-only.** Integration requires a business relationship with Garmin's marine division. The HTML5 platform is technically straightforward (it is literally a web page served over the local network), but Garmin controls which apps appear in the OneHelm interface.
- **Reverse-engineered.** Community developers have gotten custom apps to appear on Garmin MFDs by configuring mDNS and UPnP correctly. This proves the technical barrier is low -- the barrier is commercial/political.
- **Chrome DevTools.** Developers can mock up UIs using specific screen aspect ratios in Chrome, since the MFD browser is Chromium-based.

### Hardware Pricing (2025)

| Model | Size | Price |
|-------|------|-------|
| GPSMAP x3 series | 9" | ~$1,500 |
| GPSMAP x3 series | 12" | ~$2,500 |
| GPSMAP 15x3 | 15" ultrawide | $4,500 |
| GPSMAP 16x3 | 16" | $4,800-$5,000 |
| GPSMAP 9000xsv | 10"/13"/17" | $3,200+ |

### ActiveCaptain Community

- **166,000+ independent reviews** of marinas, anchorages, hazards, POIs, boat ramps, bridges, and dams.
- **Quickdraw Contours** -- crowdsourced 1-foot HD bathymetric maps. Users upload sonar data; everyone downloads the aggregated result.
- **Data sync** between the ActiveCaptain mobile app and Garmin chartplotters (routes, waypoints, community data).
- **Fuel prices** updated by marinas and community members.
- ActiveCaptain is arguably Garmin's strongest moat -- it is a network-effect community asset that competitors cannot easily replicate.

### Garmin Connect / Wearable Integration

- **Quatix smartwatch series** (Quatix 7, Quatix 8 Pro) -- purpose-built marine smartwatches that connect to Garmin chartplotters.
- Autopilot control from the wrist, trolling motor control, boat data on the watch face.
- **Quatix 8 Pro** adds inReach satellite messaging (two-way text, SOS).
- Activity data syncs to Garmin Connect Cloud.
- This watch-to-boat integration is unique in the industry -- no competitor offers anything close.

---

## 2. Raymarine LightHouse 4

### Platform Overview

LightHouse is Raymarine's MFD operating system, now at version 4 (with 4.9 released January 2025). It runs on all Axiom-family hardware. Free software updates for existing hardware.

### LightHouse Apps

39 apps available as of 2025, spanning these categories:

| Category | Examples |
|----------|----------|
| Lighting | Lumishore, Shadow-Caster |
| Stabilization | Seakeeper, CMC Marine |
| Audio & Entertainment | Fusion, Spotify, Netflix, YouTube |
| Weather | Windy, PredictWind, Theyr, Buoyweather |
| Propulsion | BlueNav (electric) |
| Power/Energy | Victron Energy (batteries, inverters, chargers, solar) |
| Digital switching | CZone, EmpirBus |
| Water systems | HP Watermakers |
| Safety | MOB alert systems |
| Sonar | Various fish-finding integrations |
| Renewable energy | Solar monitoring |

Apps are launchable from the LightHouse home screen and viewable in split-screen configurations alongside charts and instruments.

### YachtSense: Boat Management Platform

Raymarine's most ambitious platform play. YachtSense is a digital control system for the entire vessel's electrical systems:

- **Digital switching** -- replaces traditional circuit breakers with smart modules (high-power, low-power, reverse, signal modules).
- **Categories of control:** Lighting, pumps, hydraulics, HVAC, generators -- all from the MFD touchscreen.
- **Three layers of redundancy** -- if network fails, system falls back to minimal operating mode via Master Module keypad and LCD.
- **Remote monitoring** via YachtSense Link mobile router -- check your boat from anywhere.
- **Scalable** -- modular architecture, add channels as needed.

YachtSense represents Raymarine's bet that the MFD becomes the boat's central nervous system, not just a navigation display.

### Notable LightHouse 4.9 Features (January 2025)

- **Anchor Watch** -- records anchor position, calculates swing circle and drag circle, alerts on dragging.
- Enhanced app integration with split-screen support.
- Performance improvements across the Axiom family.

### Hardware Pricing (2025)

| Model | Size | Approx. Price |
|-------|------|---------------|
| Axiom+ | 7" | $650 |
| Axiom+ | 9" | $950 |
| Axiom+ | 12" | $2,500 |
| Axiom 2 Pro RVM | 9" | $3,355 |
| Axiom 2 Pro RVM | 12" | ~$4,500 |
| Axiom 2 Pro RVM | 16" | ~$7,000 |
| Axiom 2 XL | 16"/19"/22"/24" | $8,000-$15,000+ |

### Limitations

- YachtSense adoption requires significant investment and professional installation -- it is a boat-build or major-refit product, not a retrofit for most owners.
- Entertainment apps (Netflix, Spotify) are gimmicky -- nobody is watching Netflix on their chartplotter.
- Remote monitoring requires the YachtSense Link hardware ($1,000+).
- Software updates have historically broken compatibility with older hardware (A-series to LightHouse III was a notorious example -- devices went from store shelf to unsupported in under 2 years).

---

## 3. Simrad / B&G / Lowrance (Navico)

### Ecosystem Structure

Navico was acquired by Brunswick Corporation in 2021 for $1.05 billion. Brunswick now owns three MFD brands under the Navico Group:

| Brand | Target Market |
|-------|--------------|
| **Simrad** | Power boats, fishing |
| **B&G** | Sailing (cruising and racing) |
| **Lowrance** | Freshwater fishing, budget |

All three share underlying hardware platforms but differentiate through software features and branding.

### B&G: The Sailing-Specific Platform

B&G is the only major MFD brand built specifically for sailing. Key sailing features:

**SailSteer** -- An integrated display showing wind data, heading, waypoint, laylines, and tidal data all on one intuitive polar-style screen. Shows TWA targets, wind shift patterns, and optimal sailing angles. This is genuinely useful technology that no other vendor offers.

**StartLine** -- Race start technology derived from America's Cup. Ping both ends of the start line, and the display shows:
- Which end has bias
- Distance and time to the line
- Optimal approach angle

**Laylines** -- Not just simple geometric laylines, but calculations that account for:
- Tidal effects
- Wind shifts
- Current conditions
- Target boat speed (polar data)

**ForwardScan** -- Forward-looking sonar that builds a real-time profile of the bottom ahead of the boat. Sends/receives up to 10x faster than other forward-looking systems. Critical for shallow-water sailing.

### B&G Zeus S and Zeus SR (Current Hardware)

- Available in 7", 9", and 12" sizes.
- SolarMAX IPS touchscreen (viewable with polarized sunglasses).
- C-MAP DISCOVER X and REVEAL X charts.
- Full NMEA 2000 and Ethernet networking.
- B&G mobile app for off-water planning and data review.

### Cross-Brand Compatibility

- Simrad and B&G hardware is fully cross-compatible on NMEA 2000 -- you can mix instruments freely.
- Software features differ: B&G adds sailing-specific tools; Simrad adds fishing-specific tools.
- **C-MAP lock-in** -- newer B&G Zeus plotters are limited to C-MAP charts only. No Navionics support. This is a significant lock-in since Brunswick owns C-MAP.

### Open vs. Closed

Navico talks about openness (NMEA 2000 support, Ethernet networking) but:
- Uses SimNet (Simrad) and proprietary connectors rather than standard NMEA 2000 connectors.
- C-MAP chart exclusivity on newer hardware.
- No third-party app platform equivalent to OneHelm or LightHouse Apps.
- Limited to Navico's own software for display features.

---

## 4. Furuno

### NavNet TZtouch3 Platform

Furuno's current-generation MFD platform. Available in 9", 12", 16", and 19" sizes. Built around TimeZero technology.

### The Commercial Marine Heritage

Furuno occupies a unique position in the market:

- **Trusted by commercial vessels** -- ships, tugs, Coast Guard, ferries, and commercial fishing fleets overwhelmingly choose Furuno.
- **Legendary reliability** -- products known to last 20-30 years. Exceptional after-purchase support for both current and legacy products.
- **Best radar in the business** -- Furuno's radar technology (DRS series, NXT solid-state) is considered the industry benchmark.
- **1kW TruEcho CHIRP** fish finder built into MFDs.

### TimeZero Software Ecosystem

Furuno has a unique partnership with TimeZero (formerly Nobeltec/MaxSea):

- **TZ Navigator** -- recreational navigation software for PC (Windows 10/11). Route planning, weather routing, chart management.
- **TZ Professional** -- commercial-grade navigation software.
- **TZ iBoat** -- iOS app for planning and review.
- **TZ Cloud** -- cloud sync of routes, waypoints, and tracks between TZtouch3 hardware, PC software, and mobile app.
- **AI routing** -- newer TZtouch models (TZT22X, TZT24X) include AI-based route optimization.

TimeZero is exclusive to Furuno for MFD integration. Cross-platform (sort of) -- runs on Windows PCs and iOS, but not Mac or Android natively.

### Pricing

Furuno does not publish retail prices. Typically sold through dealers. Estimated street prices:

| Model | Size | Estimated Price |
|-------|------|----------------|
| TZT9F | 9" | $2,500-$3,000 |
| TZT12F | 12" | $3,500-$4,500 |
| TZT16F | 16" | $5,000-$6,500 |
| TZT19F | 19" | $7,000-$9,000 |

### Strengths and Weaknesses

**Strengths:**
- Unmatched reliability and build quality.
- Best radar and sounder technology.
- Strong cloud sync via TZ ecosystem.
- Trusted by professional mariners.

**Weaknesses:**
- Historically poor UI/UX (improved in TZtouch3 but still not as intuitive as Garmin).
- TimeZero is Windows-only for desktop.
- No third-party app platform.
- No wearable integration.
- No digital switching / boat management story.
- Smallest partner ecosystem of the four major brands.

---

## 5. The Platform Lock-In Problem

### How Each Vendor Locks You In

| Lock-In Vector | Garmin | Raymarine | Navico (B&G/Simrad) | Furuno |
|---------------|--------|-----------|---------------------|--------|
| **Proprietary charts** | Navionics (owned) + BlueChart | Navionics + LH Charts | C-MAP (owned, exclusive on newer hardware) | TimeZero (exclusive partnership) |
| **Proprietary connectors** | Garmin Marine Network | SeaTalk NG | SimNet | Furuno CAN Bus |
| **Display ecosystem** | Only Garmin MFDs show OneHelm | Only Axiom shows LH Apps | Only Navico MFDs get SailSteer etc. | Only Furuno shows TZ interface |
| **App platform** | OneHelm (closed) | LightHouse Apps (semi-open) | None | None |
| **Mobile app** | ActiveCaptain | Raymarine App | B&G App / C-MAP | TZ iBoat |
| **Wearable** | Quatix (exclusive) | None | None | None |
| **Cloud data** | ActiveCaptain Community | YachtSense Link | C-MAP Cloud | TZ Cloud |

### NMEA 2000: The Illusion of Openness

NMEA 2000 is marketed as a plug-and-play open standard, but:

- **The spec itself is paywalled.** NMEA claims copyright and does not publicly disclose how to interpret message field values. You can see which messages exist and which fields they contain, but not how to decode them.
- **Proprietary connectors.** Simrad (SimNet), Raymarine (SeaTalk NG), and others use NMEA 2000-compatible protocols but non-standard physical connectors. Adapters exist but add cost and failure points.
- **Proprietary extensions.** Each vendor adds proprietary PGNs (Parameter Group Numbers) for their own features. An autopilot from one vendor may not fully integrate with an MFD from another.
- **The bus is open, the experience is not.** You can connect a Garmin wind sensor to a B&G display and get basic wind data. But you will not get SailSteer, laylines, or any of the value-added features. The data layer is (mostly) interoperable; the application layer is completely proprietary.

### The Cost of a Full MFD Setup

For a typical 40-foot cruising sailboat in 2025:

| Component | Budget Range | Premium Range |
|-----------|-------------|---------------|
| MFD (12") | $2,500 | $5,000+ |
| Radar (dome/open array) | $1,500 | $4,000+ |
| Autopilot (below-deck + drive) | $2,000 | $5,000+ |
| Instruments (wind, depth, speed) | $800 | $2,000+ |
| AIS transceiver | $500 | $1,200 |
| VHF radio | $300 | $800 |
| Charts (annual subscription) | $100 | $300 |
| Installation labor | $2,000 | $5,000+ |
| **Total** | **$9,700** | **$23,300+** |

And this locks you into one vendor's ecosystem. Switching brands means replacing displays and potentially instruments, even if the underlying bus is NMEA 2000.

### What Happens When a Vendor Discontinues a Product

This is a real and recurring problem:

- **Raymarine A-series** -- went from store shelf to unsupported obsolescence in under 2 years when LightHouse III dropped support.
- **Garmin "grey" to "black" transition** -- all GPSMAP 4000/5000/6000/7000 series broke compatibility when the 741/841/8000/7600 series launched. New networking protocol, new display protocol, nothing worked together.
- **Software update orphaning** -- MFDs that stop receiving updates cannot display new chart formats, integrate new sensors, or get security patches.
- **Furuno is the exception** -- known for supporting products for 20-30 years, but at the cost of slower innovation.

The average lifecycle of a marine MFD before it becomes functionally obsolete is approximately **5-7 years**. For hardware that costs $3,000-$15,000 per display, installed on boats that last 30+ years, this is a terrible deal for the consumer.

---

## 6. The Open-Source Opportunity

### What Signal K Solves

Signal K is the open-source marine data platform. It solves the data layer:

- **Protocol translation** -- converts NMEA 0183, NMEA 2000, and proprietary protocols into a single JSON-based data model.
- **REST/WebSocket API** -- any web browser, phone, or application can read boat data over HTTP.
- **Plugin ecosystem** -- 200+ plugins for data logging, instrument displays, cloud sync, etc.
- **Runs on a Raspberry Pi** -- $50 of hardware replaces thousands of dollars of proprietary gateways.
- **MCP Server (2025)** -- Signal K now has an MCP server, allowing AI assistants to query real-time boat data conversationally. Users report shifting from "checking dashboards" to "asking how the boat is doing."

### What Signal K Does NOT Solve

- **UI/UX** -- KIP (the Signal K Instrument Panel) is functional but basic. No chartplotter, no radar overlay, no sophisticated data visualization. The gap between KIP and a Garmin MFD interface is vast.
- **Passage planning** -- no route optimization, no weather routing, no tidal calculations.
- **Social/community** -- no equivalent to ActiveCaptain. No crowdsourced data, no marina reviews, no shared anchorages.
- **Boat management** -- no digital switching, no bilge pump monitoring, no electrical system dashboards (beyond raw data).
- **Mobile experience** -- no polished mobile app for pre-trip planning, remote monitoring, or crew coordination.
- **Reliability story** -- Signal K on a Raspberry Pi is not marine-grade. No watchdog, no redundancy, no sunlight-readable display, no waterproofing.

### Why OpenCPN Hasn't Won

OpenCPN is the most established open-source chartplotter. It has not achieved mainstream adoption because:

1. **No Navionics/C-MAP support** -- cannot display the most popular chart formats. Limited to government-issued charts (ENC, RNC) and some community charts.
2. **Display problem** -- requires a separate waterproof, sunlight-readable screen at the helm. No turnkey hardware solution.
3. **Dated UI** -- looks like a 2005 desktop application. Not competitive with modern MFD interfaces.
4. **System reliability** -- runs on a general-purpose computer. Users must manage power, cooling, backup, and weather protection themselves.
5. **No ecosystem** -- limited integration with instruments, radar, AIS. Plugin system exists but is basic.
6. **No mobile story** -- no companion app, no cloud sync, no remote monitoring.

### What an Open Platform Needs to Compete

The gap is not in data (Signal K solves that) or charts (free government charts exist). The gap is in:

1. **UX quality** -- must match or exceed Garmin/Raymarine in visual quality, responsiveness, and intuitiveness. This is the primary barrier. Sailors will not adopt ugly or confusing software regardless of ideology.

2. **Reliability** -- must be rock-solid. A chartplotter crash at sea is a safety issue, not an inconvenience.

3. **Ecosystem breadth** -- must integrate sensors, instruments, autopilots, radar. Not just display data, but actively control systems.

4. **Community/social layer** -- the ActiveCaptain-equivalent: crowdsourced anchorages, marina reviews, hazard reports, fleet tracking. This is where network effects create moats that hardware vendors cannot easily build.

5. **AI integration** -- hardware vendors' DNA is hardware engineering and embedded systems. They are structurally incapable of building AI features at the pace of software-native companies. The Signal K MCP server is a promising start, but the opportunity is much larger: AI passage planning, predictive maintenance, weather routing, natural-language boat queries.

6. **Multi-surface experience** -- the same data and tools available on:
   - A helm-mounted display (marine-grade)
   - A tablet at the nav station
   - A phone in the cockpit
   - A laptop for pre-trip planning
   - A watch for quick glances
   - A web browser for remote monitoring

   No hardware vendor does this well. Garmin comes closest with Quatix + ActiveCaptain + MFD, but it is clunky and limited.

7. **No planned obsolescence** -- software that keeps working and improving regardless of which display you bought 10 years ago. This is the strongest argument against the current vendor model.

### Why Hardware Vendors Cannot Build AI/Social Features

- **Engineering culture** -- marine electronics companies are hardware companies. Their engineering teams optimize for RF performance, waterproofing, and sunlight-readable displays. They do not have ML engineers, data scientists, or community product managers.
- **Release cycles** -- hardware companies ship products every 2-3 years. Software features evolve at the pace of hardware refreshes. AI capabilities are advancing monthly.
- **Data silos** -- each vendor's community data (ActiveCaptain, C-MAP Community, etc.) is locked to their platform. No vendor will open this data to competitors.
- **Business model conflict** -- hardware vendors need you to buy new hardware. Software that makes old hardware better undermines their revenue model.
- **Regulatory conservatism** -- marine electronics are safety-critical. Vendors are (correctly) conservative about AI features on navigation-critical systems. But this conservatism also extends to non-safety features like planning, logging, and community tools where innovation could be much faster.

---

## 7. Market Size and User Segments

### Global Fleet Size

| Region | Recreational Boats | Source |
|--------|-------------------|--------|
| United States | ~16 million (11.8M registered) | USCG / NMMA |
| Europe | ~5.6 million | European Boating Industry |
| Rest of world | ~8-11 million | Various estimates |
| **Global total** | **~30-33 million** | Industry estimates |

### Market Value

The recreational boating market is valued at approximately $40-53 billion (2025), depending on the market definition used. Marine electronics is a subset -- Garmin's marine segment alone reached $1.07 billion in revenue in 2024 (17% YoY growth). Navico (pre-acquisition) had ~$470 million in annual revenue.

The total marine electronics market is estimated at $3-5 billion annually.

### User Segments

| Segment | Size (est.) | MFD Penetration | Software Needs | Served By Current Platforms? |
|---------|-------------|-----------------|----------------|------------------------------|
| **Weekend sailors** | Large (millions) | Low -- most use phone apps | Weather, marina info, basic nav | Partially (Navionics app, Windy) |
| **Coastal cruisers** | Medium | Medium -- many have basic MFDs | Passage planning, weather, anchorages, maintenance | Partially (MFDs + phone apps) |
| **Liveaboards** | Small (~100K globally) | Medium-High | Everything: power management, provisioning, maintenance, community, comms | **Poorly served** |
| **Ocean cruisers** | Small (~50K actively cruising) | High | Offshore weather routing, satellite comms, crew management, safety | **Poorly served** |
| **Racers** | Small but vocal | High -- B&G dominates | Performance data, polars, start timing, crew coordination | B&G is good; everything else is DIY |
| **Charter/delivery** | Medium | Uses whatever is on the boat | Familiarity across platforms, briefing tools, flotilla coordination | Poorly served |

### Most Underserved Segments

**Liveaboards and ocean cruisers** are the most underserved by current platforms:

1. **Power management** is critical (solar, battery, shore power, generator) but MFD integration requires Victron hardware + Raymarine/Garmin display. No vendor-neutral solution exists with good UX.

2. **Community and local knowledge** is fragmented across Facebook groups, Noforeignland, ActiveCaptain (Garmin-only), cruiser forums, and word of mouth. No unified, open, crowd-sourced platform exists.

3. **Passage planning** requires stitching together PredictWind (weather), Navionics (charts), tide apps, current atlases, and personal experience. No integrated solution exists.

4. **Maintenance tracking** is done in spreadsheets, notebooks, or basic apps like SeaLogs. Nothing integrates with the actual boat systems.

5. **Offshore communications** -- satellite messaging (Garmin inReach, Iridium GO) is expensive and siloed. No integration with boat systems or crew coordination tools.

6. **These users are technically savvy, cost-conscious, and community-oriented.** They are the most likely early adopters of an open-source alternative. They have time to tinker (they live on their boats), strong opinions about vendor lock-in (they have been burned), and a culture of sharing knowledge.

---

## Key Takeaways for Above Deck

1. **The data layer is solved** -- Signal K handles protocol translation and data access. Do not rebuild this.

2. **The UI/UX layer is wide open** -- no open-source project has built a marine interface that matches commercial quality. This is the primary opportunity.

3. **Community/social is the moat** -- ActiveCaptain proves that crowdsourced data creates lock-in. An open-source community platform with better data, no vendor lock-in, and AI-powered insights could be the wedge.

4. **AI is the asymmetric advantage** -- hardware vendors cannot build AI features. An open platform can integrate LLMs for passage planning, maintenance prediction, weather interpretation, and conversational boat monitoring faster than any hardware company.

5. **Target liveaboards and ocean cruisers first** -- they are underserved, technically capable, community-oriented, and will evangelize a product that works.

6. **Do not try to replace the MFD hardware** -- that is a hardware problem (sunlight-readable, waterproof, marine-grade). Instead, be the software layer that works on any display, any tablet, any phone, alongside existing MFDs.

7. **Embrace Signal K as the data backbone, then build everything above it** -- planning, monitoring, community, AI, and cross-device experiences. Be the application layer that Signal K lacks.
