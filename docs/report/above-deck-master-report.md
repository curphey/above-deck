---
title: "Above Deck — Comprehensive Research & Vision Report"
subtitle: "Market Analysis, Technology Architecture, Hardware & IoT, Product Vision"
date: "March 2026"
---

# Above Deck — Comprehensive Research & Vision Report

**Date:** March 2026
**Status:** Research Complete — Ready for Design Phase
**Author:** Above Deck Project

---

## About This Report

This document compiles all research conducted for the Above Deck open-source marine platform. It covers market analysis, competitive positioning, technology architecture, hardware and connectivity, IoT integration, and the product vision.

Above Deck aims to be an open-source sailing platform with three layers: an open boat management platform with direct hardware integration, practical sailing tools (chartplotter, passage planner, anchor watch), and learning/utility tools (VHF simulator, solar planner). Tools work standalone from any browser but become dramatically more capable when connected to a Go-based server on the boat.

---

## Table of Contents

### Part 1: Market & Competitive Analysis
- Market Overview
- Commercial Competitors (Savvy Navvy, PredictWind, Orca, Navily, Navionics, and 10+ others)
- Open-Source Competitors (OpenPlotter, BBN OS, d3kOS, SignalK, OpenCPN)
- Competitive Positioning Matrix
- Market Gaps
- Target User Profile & Hardware Landscape
- Features to Steal/Adapt
- Pricing Landscape

### Part 2: Technology & Architecture
- Tech Stack Rationale (Go, Astro/React, Supabase)
- Go Marine Ecosystem (NMEA, CAN bus, Victron, BLE libraries)
- Mapping & Nautical Charts (MapLibre, S-57, PMTiles, offline)
- PWA & Mobile Strategy (offline, iOS limitations, Web APIs)
- Deployment Architecture (Docker, hardware, cloud sync, redundancy)
- Data Sources & APIs (weather, tides, AIS, charts)
- Weather Routing Algorithms
- Community Platform Patterns
- Key Technical Risks

### Part 3: Hardware, Connectivity & IoT
- Marine Protocol Landscape (NMEA 0183/2000, SignalK)
- Hardware Platform Options (Raspberry Pi, ESP32, industrial PCs)
- Matter Protocol & IoT (device types, Go implementation, Thread mesh)
- SignalK Integration Strategy
- MFD Platform Integrations (Garmin, Raymarine, Navico, Furuno)
- Digital Switching (CZone, EmpirBus UI Builder)
- LoRa/Meshtastic Long-Range Communication
- Victron Integration & Bridge Opportunity
- Web Browser Hardware APIs
- Recommended Hardware Architecture

### Part 4: Product Vision & Design
- Three-Layer Architecture
- Current State & Built Tools
- Planned Tool Suite
- Above Deck Data Model
- AI Integration (MCP Server)
- Plugin Architecture
- Visual Design System (Blueprint Aesthetic)
- Solar/Energy Tools
- Differentiators
- Community Strategy
- Build Sequence

---

\newpage

# Part 1: Market and Competitive Analysis

**Date:** 2026-03-20
**Sources:** competitive-landscape.md, savvy-navvy-deep-dive.md, predictwind-orca-navily-opencpn-analysis.md, keeano-deep-dive.md, sailor-hardware-landscape.md

---

## 1. Executive Summary

The marine navigation and sailing app market is fragmented, expensive, and ripe for disruption. Commercial tools are increasingly locked down and aggressively monetised, while open-source alternatives remain trapped in 2005-era desktop paradigms. No single product combines community-shared itineraries, modern UX, multi-day trip planning, weather-aware scheduling, crew collaboration, and open data. The market splits cleanly into three silos: navigation apps have no social features, social apps have no navigation, and weather tools are expensive and complex. Users currently need 3-4 apps to cover what should be one workflow. The clearest opportunity is a "Komoot for Sailing" -- a web-native, open-source platform combining community knowledge, modern design, passage planning, and Signal K integration, targeting the charter and coastal cruiser market.

---

## 2. Market Overview

### Market Segmentation

The marine software market divides into four distinct categories, each with its own players and economics:

| Segment | Key Players | Price Range | Core User |
|---------|------------|-------------|-----------|
| **Navigation / Chartplotters** | Savvy Navvy, Navionics, Orca, iSailor, SEAiq, TZ iBoat | USD 15-3,000/yr | All boaters |
| **Weather Routing** | PredictWind, FastSeas, SailGrib, Squid Sailing | Free-USD 499/yr | Offshore / passage sailors |
| **Community / Social** | Navily, SeaPeople, Argo, ActiveCaptain (Garmin) | Free-USD 20/yr | Cruisers, charter sailors |
| **Open-Source Platforms** | OpenCPN, OpenPlotter, BBN OS, SignalK, d3kOS | Free | Tech-forward sailors, DIY community |

### Key Trends

1. **Subscription fatigue.** Navionics increased prices 233% since Garmin's acquisition (from ~USD 15/yr to USD 50-100/yr). Komoot's shift to subscriptions provoked articles titled "Komoot confirms we don't want any new customers." Users are actively seeking alternatives.

2. **iPad as chartplotter.** 20-25% of cruisers use an iPad as their primary chartplotter, and 50-60% use one for planning/backup. The USD 400-800 iPad running Navionics or Orca is increasingly replacing USD 2,000-4,000 marine MFDs.

3. **Starlink has changed everything.** 40-50% of active cruisers now have Starlink. It has largely replaced SSB radio for weather, email, and social connection. This ubiquitous connectivity enables cloud-native marine apps in ways that were impossible even three years ago.

4. **Open-source marine ecosystem is growing.** Signal K (the JSON-based marine data standard), OpenPlotter, and BBN OS prove there is a significant DIY community willing to build their own systems. Hundreds of boats run OpenPlotter. The community is technically competent but underserved by polished software.

5. **AI entering the space.** PredictWind has AI-powered 5D polars and GMDSS text parsing. Ditch Navigation uses AIS data to learn real boating patterns. d3kOS has offline voice control. But genuine AI integration remains mostly vapourware -- the opportunity to do it properly is wide open.

6. **Weather apps converging with route planning.** Windy.app has launched sailing routes (beta). PredictWind added basic charts. The boundaries between weather, navigation, and planning are blurring.

---

## 3. Commercial Competitors

### Full Competitor Overview

| App | Best For | Price/yr | Chart Quality | Weather Routing | UI/UX | Offline | Social/Community |
|-----|----------|----------|--------------|----------------|-------|---------|-----------------|
| **Savvy Navvy** | Casual boaters | USD 80-189 | Good | Basic (Elite) | Great | Partial | None |
| **PredictWind** | Offshore routing | USD 29-499 | Basic | Excellent | OK | Partial | None |
| **Orca** | Modern sailing | Free-EUR 148 | Good | Good | Best | Yes | None |
| **Navionics** | Charts/depth data | USD 40-100 | Excellent | No | Dated | Yes | ActiveCaptain |
| **Navily** | Anchorage reviews | Free-EUR 20 | Weak | No | Good | Premium | Best-in-class |
| **FastSeas** | Budget routing | Free/donations | N/A | Good | Clean | No | None |
| **SailGrib** | Offline routing | EUR 46 | Good | Yes | Dated | Yes | None |
| **TZ iBoat** | Power users | USD 20-3,000 | Excellent | Good | Complex | Yes | None |
| **iSailor** | Chart accuracy | Varies | Excellent | No | Clean | Yes | None |
| **SEAiq** | Professionals | USD 10-250 | BYO charts | No | Functional | Yes | None |
| **Ditch Navigation** | AI routing (power) | Freemium | Good | No | Good | Yes | None |
| **Keeano** | Med trip planning | Free | Basic | No | Good | No | Small |
| **SeaPeople** | Social/logging | Free/Premium | None | No | Good | No | Strong |
| **Wavve** | Waze for boats | Free | Good | No | Good | Partial | Moderate |
| **SailTies** | Crew collaboration | Unknown | Basic | No | Basic | No | Moderate |

### Top 5 Narrative

#### Savvy Navvy -- "Google Maps for Boats"

Savvy Navvy is the most visible sailing-specific app, with 3+ million downloads and a 4.7/5 App Store rating. Founded by ex-Google employees, it nailed the "make sailing navigation simple" message. Its killer features are Smart Routing (factoring wind, tides, depth, and boat specs), Course To Steer (auto-adjusting heading for currents), and the Departure Scheduler (visual comparison of departure windows every 30 minutes).

But the cracks are significant. Android is described by users as "simply does not work" -- planning functions fail, offline downloads die between 40-80%, and GPS tracking shows straight lines. Experienced sailors criticise route accuracy, particularly in tidal waters ("can route you metres away from a hazard on a lee shore"). Chart detail is "massively lacking compared to Navionics." Tidal data has been reported as "at least 2 hours wrong" on the Thames. And the pricing structure aggressively gates basic features: tidal heights require Explore (USD 145/yr), tidal streams require Elite (USD 150/yr), and offline charts have no Essential tier access at all.

The core tension: Savvy Navvy's simplification that makes it accessible to beginners actively concerns experienced sailors who need chart detail and routing precision. At 3-10x the price of Navionics, it needs to justify the premium.

**Pricing tiers (US):**

| Tier | Annual Price | Key Gated Features |
|------|-------------|-------------------|
| Free | USD 0 | 36hr weather, basic routing |
| Essential | USD 79.99/yr | Smart routing, 4-day weather, AIS (3nm only) |
| Explore | USD 144.99/yr | Offline charts, GPX export, departure scheduler, 14-day weather |
| Elite | USD 149.99/yr | Tidal streams, ECMWF weather, NMEA Connect, anchor alarm, unlimited AIS |

**Strategic direction:** Savvy Navvy is pivoting toward OEM/B2B partnerships (Avikus, CPAC Systems, Actisense, RAD Propulsion). Their "Savvy Integrated" product embeds the app into boat helm displays. They are positioning as "integrated navigation OS" rather than just an app, with heavy US market focus.

#### PredictWind -- Weather Routing Leader

PredictWind owns the offshore weather routing space. It is the tool favoured by ocean racers and serious passage sailors. Its genuine differentiator is running up to six weather models simultaneously (ECMWF, AIFS, ICON, UKMO, GFS + proprietary PWAi/PWG/PWE), with the Professional tier adding AI-powered 5D polars that account for wind, wave height, swell periods, size, and boat speed. It is the only private company generating 1km resolution forecasts (using CSIRO CCAM technology).

PredictWind also has the strongest offshore story: compressed GRIB downloads over Iridium GO!, AI-parsed GMDSS text alerts, over-the-horizon satellite AIS, and a DataHub hardware device (USD 349-699) that combines GPS, WiFi, NMEA, satellite, AIS, and autopilot routing.

The weaknesses are predictable: it is not a full chartplotter (just weather routing with basic chart overlay), the interface has a steep learning curve, useful tiers cost USD 249-499/yr, and there are no social or community features whatsoever.

**Pricing:**

| Tier | Annual | Key Capability |
|------|--------|---------------|
| Free | USD 0 | 11 forecast models, basic AIS |
| Basic | USD 29/yr | Lightning, 1km wind, rain radar, alerts |
| Standard | USD 249/yr | Weather routing, departure planning, tidal currents, satellite AIS |
| Professional | USD 499/yr | Ocean currents in routing, AI Polars, 3D hull modeling |

#### Orca -- The Modern Chartplotter

Orca, based in Hamburg, has the best-looking chartplotter UI on the market. Its design sets the standard that all competitors should aspire to -- crisp vector maps, smooth zoom/pan, proper chart symbology, and a superb night mode. It also has the most unique technical feature: automatic rerouting that continuously monitors weather changes and route deviations, recalculating in real time. No other primary navigation system does this natively.

Orca runs a freemium model with the app itself free. Plus (EUR 49/yr) adds offline charts and sail routing. Smart Navigation (EUR 149/yr) adds auto-rerouting, AIS with vessel images, and collision avoidance. They also sell dedicated marine hardware: the Orca Core (EUR ~499) for NMEA 2000 integration and the Display 2 (EUR ~899) as a purpose-built marine screen.

Auto-routing handles 96% of saved routes and the 3D chart view is best-in-class. But tidal stream handling is a serious weakness -- Orca is reportedly unaware of major tidal gates ("frankly makes it unsafe" in tidal waters). Sail routing requires internet (no offline weather-aware routing). There are no social or community features, no harbour/anchorage reviews, and no GRIB file support.

#### Navily -- Community Anchorage Guide

Navily is the community data success story, with 1M+ users, 35,000+ marinas/anchorages, and 350,000+ community photos and reviews. Its data is European-focused and community-driven: users submit photos, reviews, depth info, seabed conditions, and wind protection ratings. It includes marina booking in 700+ European marinas, in-app chat, real-time warnings, and an emergency SOS broadcast feature.

At EUR 19.99/yr for Premium, it is the most affordable paid option. But Navily is a cruising guide, not a chartplotter. There is no weather routing, no real navigation capability, and coverage is patchy outside the Mediterranean and Northern Europe. Marina booking prices carry a markup versus direct contact, and its no-refund cancellation policy frustrates users.

Navily proves there is massive demand for community-curated anchorage data. Its weakness is that this data exists in isolation from actual navigation tools.

#### Navionics (Garmin) -- The Incumbent

Navionics has the best underlying chart data in the business (SonarChart HD with 0.5m contour detail), the largest user base, and the brand name everyone knows. ActiveCaptain provides community marina reviews and hazard reports. Garmin chartplotter sync is seamless.

But Garmin's acquisition has poisoned the well. Prices jumped from ~USD 15/yr to USD 40-100/yr (a 233-300% increase). Users report paid downloaded maps being turned off without warning -- "genuinely dangerous." The popular Sonar view was removed. ActiveCaptain, originally an independent community database with 166,000+ reviews, has been locked into Garmin's ecosystem. Forum sentiment: "ActiveCaptain USED TO BE great. Now it's Garmin's play-thing / cash cow. And it's crap."

The data lock-in is Navionics' real moat. An open-source alternative where community data belongs to the community would have massive pull.

---

## 4. Open-Source Competitors

### OpenCPN -- The Main Open-Source Chartplotter

**GitHub:** 1,360 stars, 581 forks, 302 open issues, active development since 2009.
**License:** GPL | **Language:** C/C++ with wxWidgets

OpenCPN is a full-featured chartplotter that thousands of sailors actually use as their primary navigation tool. It supports S-57 vector and BSB raster charts, has built-in AIS decoding, and runs on Windows, macOS, Linux, and Android. Its 45+ plugin ecosystem includes weather routing (isochrone method with boat polars), dashboard instruments, radar, satellite imagery, and celestial navigation.

The critical weakness is architectural: a monolithic C++ / wxWidgets codebase that looks and feels like a 2005 desktop application. The touch interface is poor, there is no web version, no mobile-first experience, and plugin quality varies wildly. A GitHub issue (#2354) explicitly calls out the monolithic design -- NMEA multiplexing, chart canvas, control interface, and plugin updates are all one process.

OpenCPN proves that an open-source sailing tool can build a devoted community. Its weakness (dated UX, desktop-first, hard to configure) is exactly the opportunity for Above Deck.

### OpenPlotter -- Raspberry Pi Marine Platform

**Creator:** Sailoog | **License:** CC BY-SA 4.0 (content), GPL (code) | **Platform:** Raspberry Pi 4/5

OpenPlotter is a complete Linux distribution that turns a Raspberry Pi into a marine electronics hub. It bundles Signal K Server, OpenCPN, AvNav (web-based charts), pypilot (open-source autopilot), Node-RED (visual automation), and support for NMEA 0183, NMEA 2000, and Seatalk via the MacArthur HAT (~USD 80).

It is the most complete open-source marine platform and has proven itself on hundreds of boats. A ~USD 125 Raspberry Pi setup replaces USD 2,000-5,000 of commercial electronics.

The weaknesses are real: a "Frankenstein UX" that stitches together OpenCPN (wxWidgets), AvNav (web), Node-RED (web), and Signal K dashboard (web) with no coherent design language. Node.js everywhere is memory-hungry on a Pi. Assembly is required -- significant technical expertise needed. Bus factor of ~1 (Sailoog).

### BBN OS -- The Most Feature-Complete Marine OS

**GitHub:** 311 stars, 73 forks, 4,242 commits | **Creator:** mgrouch | **License:** GPLv3

BBN OS is the most ambitious open-source marine platform, explicitly born from "experiences of using OpenPlotter to improve user experience." It bundles 60+ applications: navigation (OpenCPN, AvNav, TukTuk), autopilot (pypilot), weather (XyGrib, GRIB routing), radio (NavTex, WeatherFax, WinLink, SDR), cameras (MotionEye), data analytics (InfluxDB + Grafana), IoT (Home Assistant, MQTT, EspHome), and even media (Mopidy, AirPlay, Spotify). It supports vessel modes ("Dock Away" / "Under Way" / "Anchor Aboard") that configure the whole system.

Its Grafana dashboards are genuinely impressive -- proving that sailors want historical data visualisation (battery trends over a passage, solar production patterns). Home Assistant integration validates IoT-on-boats.

But BBN OS remains "Linux on a boat with 60 apps installed." Each app has its own UI paradigm. It is not mobile-first. The bus factor is 1 (mgrouch). There is no AI integration, no community platform, and no standalone tools -- everything requires the full stack.

### Signal K -- The Open Marine Data Standard

**GitHub:** 381 stars, 187 forks | **License:** Apache 2.0

Signal K is arguably the most important project in the open marine technology space. It is a JSON-based data format and server that bridges NMEA 0183, NMEA 2000, Seatalk, and other protocols into a single web-friendly data model. Every piece of boat data gets a standardised path (e.g., `environment.wind.speedApparent`, `electrical.batteries.{id}.voltage`).

It provides REST API and WebSocket streams, has 270+ plugins, and in 2025-2026 gained MCP Server integration -- enabling natural language queries against boat data ("What's the battery voltage?").

Signal K is the natural integration hub for Above Deck. It already handles NMEA 0183, NMEA 2000, Victron, and dozens of other data sources. Above Deck should consume Signal K's API rather than implementing individual protocol parsers.

### d3kOS -- AI-Powered Helm System

**GitHub:** 2 stars, 403 commits | **Creator:** SkipperDon | **Platform:** Raspberry Pi 4B

The most conceptually ambitious project: an AI-powered, voice-first helm control system. Uses Vosk for offline speech-to-text (wake word "Helm") and Piper for text-to-speech responses. Claims >95% accuracy for real-time engine health anomaly detection. Built on Signal K + Node-RED Dashboard 2.0 + OpenCPN.

Extremely early (pre-release, 2 GitHub stars), single developer, no community. But it validates two things: offline voice AI is feasible on marine hardware, and AI anomaly detection on boat systems is a compelling use case.

### Open-Source Competitor Summary

| Platform | UX Quality | Mobile-First | AI | Standalone Tools | Community Platform | Setup Difficulty |
|----------|-----------|-------------|-----|-----------------|-------------------|-----------------|
| **OpenPlotter** | Poor (Frankenstein) | No | No | No | No | High |
| **BBN OS** | Fair (Grafana helps) | No | No | No | No | High |
| **OpenCPN** | Poor (wxWidgets) | No | No | N/A | No | Medium |
| **d3kOS** | Fair (Node-RED) | No | Yes (voice) | No | No | High |
| **Above Deck** (target) | High (designed, unified) | Yes (PWA) | Yes (MCP) | Yes | Yes | Low (Docker) |

---

## 5. Competitive Positioning Matrix

The competitive landscape reveals a clear structural gap. No single product occupies the **top-right quadrant** where both community/social features AND navigation/planning sophistication are strong:

```
                    Strong Community / Social
                              ^
                              |
              Navily          |
              SeaPeople       |         (NOBODY)
              Argo            |
                              |         <-- Above Deck target
                              |
   ---------------------------+----------------------------->
                              |                    Strong Navigation
              SailTies        |         Savvy Navvy
              (good concept,  |         PredictWind
               limited        |         Orca
               execution)     |         SailGrib
                              |         TimeZero
                              |         Navionics
                              |
```

- **Top-left (Strong community, weak navigation):** Navily, SeaPeople, Argo
- **Bottom-right (Strong navigation, weak community):** Savvy Navvy, PredictWind, Orca, SailGrib, TimeZero, Navionics
- **Bottom-left (Weak in both):** SailTies
- **Top-right (Strong in both):** Nobody

**Above Deck's target position is the top-right quadrant** -- combining community-shared knowledge with capable navigation and planning tools, all open-source.

### Feature Comparison Matrix

| Feature | Savvy Navvy | PredictWind | Orca | Navily | OpenCPN | Above Deck (target) |
|---------|------------|------------|------|--------|---------|-------------------|
| Navigation / Charts | Strong | Basic | Strong | Weak | Strong | Strong |
| Weather Routing | Yes (Elite) | Best-in-class | Good | No | Plugin | Yes |
| Social / Community | None | None | None | Best-in-class | None | Yes |
| Itinerary Planning | No | No | No | Basic (Premium) | No | Yes |
| Crew Collaboration | No | No | No | No | No | Yes |
| Offline | Partial | Partial | Yes | Premium | Yes | Yes |
| Signal K Integration | No | No | No | No | Plugin | Native |
| Open Source | No | No | No | No | Yes (GPL) | Yes |
| Price/yr | USD 80-189 | USD 29-499 | Free-EUR 148 | Free-EUR 20 | Free | Free |

---

## 6. Market Gaps

Research identified 10+ distinct gaps in the current market:

### Gap 1: No "Komoot for Sailing" Exists
No app combines beautiful route planning, community-shared itineraries, photo storytelling, and offline navigation in a sailing context. The Komoot model -- multi-day stage planning + community Highlights + difficulty ratings -- has never been applied to sailing.

### Gap 2: Multi-Day Itinerary Planning is Underserved
Most apps focus on single-passage routing (A to B). Planning a week-long cruise with multiple stops, considering weather windows across days, provisioning stops, and overnight anchorage quality is done manually or via expensive human services.

### Gap 3: Social + Navigation is Structurally Split
Navigation apps have no meaningful social features. Social apps have limited or no navigation. This is the top-right quadrant gap described above.

### Gap 4: Crew Collaboration is Almost Non-Existent
Only SailTies attempts collaborative itinerary viewing. Nobody lets a skipper plan a route and share it with crew members who can see ETAs, waypoint notes, provisioning lists, and watch schedules. The RideWithGPS club model (crew members get premium features on shared plans) has not been applied to sailing.

### Gap 5: Charter Sailor Market is Ignored by Tech
Charter sailors (the largest segment of recreational sailing) rely on paper guides, word-of-mouth, and Google Maps. They need curated itineraries by region and duration, difficulty ratings, local knowledge, and day-by-day weather-aware scheduling.

### Gap 6: Logbook + Route Integration
No app seamlessly captures the journey (logbook) and connects it back to the planned route for post-trip review or sharing. Cycling apps (Strava, Komoot) do this brilliantly; sailing has nothing equivalent.

### Gap 7: Cross-Plotter Universality
Every chartplotter brand has its own app ecosystem. A brand-agnostic planning tool that exports cleanly to any plotter via GPX would serve the large segment of sailors who plan on tablets but navigate on hardware.

### Gap 8: AI-Driven Passage Intelligence
Nobody combines historical weather patterns, community anchorage reports, vessel-specific performance data, and real-time weather into a single "When should I leave, which route should I take, and where should I stop?" recommendation engine.

### Gap 9: Affordable / Open-Source Pricing
The market has bifurcated into free (limited) and expensive (USD 80-150/yr). An open-source platform with a strong free tier and reasonable optional premium is the structural disruption opportunity.

### Gap 10: Modern UX + Open-Source Web Chartplotter
No good open-source web-based chartplotter exists. OpenCPN is desktop C++. AvNav is web-accessible but basic. Nothing has the UI quality of Orca with the openness of OpenCPN.

### Additional Strategic Gaps
- **ActiveCaptain-style community data is locked in Garmin's ecosystem.** The community is unhappy. An open alternative with community-owned data would have immediate appeal.
- **Weather routing is either expensive (PredictWind USD 249/yr) or basic (FastSeas/GFS only).** A free, multi-model weather routing tool would be genuinely disruptive.
- **Community-verified anchorage data is fragmented** across ActiveCaptain, Noonsite, Navily, and SeaPeople, and none use Komoot's "you must have been there" verification model.

---

## 7. Target User Profile

### What Boats Have

The typical target user sails a 35-50ft production boat (Beneteau, Jeanneau, Lagoon) that is 5-20 years old with a patchwork of electronics from different generations.

**Coastal Cruiser (35-45ft monohull) -- typical setup:**

| Category | Equipment | Notes |
|----------|----------|-------|
| Chartplotter | Single 7-9" MFD (often 5-10 years old) | Raymarine, Garmin, or B&G |
| Instruments | Masthead wind, thru-hull depth/speed | Mix of NMEA 0183 and 2000 |
| Autopilot | Wheel or below-deck drive | Raymarine EV-100/200 or B&G |
| VHF | Fixed DSC + 1-2 handhelds | Effectively universal |
| AIS | Class B transponder or receive-only | 60-70% adoption |
| Radar | Small dome (18-24") | ~50% of coastal cruisers |
| Communications | Starlink (40-50%), cell hotspot (70%) | Starlink adoption exploded 2023-2025 |

**Key insight:** The majority of cruising boats have a mix of NMEA 0183 and NMEA 2000 devices. Signal K is the best bridge technology -- it normalises all data into a single JSON-based format accessible over WiFi.

**Catamarans** (increasingly common target) are typically delivered with more complete electronics: dual MFDs, full NMEA 2000 backbone, 600-1200W solar, and better networking. Many enter private ownership from charter fleets at 5-8 years with basic electronics that new owners immediately upgrade.

### What They Spend

| Category | Budget Cruiser | Mid-Range | Well-Equipped |
|----------|---------------|-----------|---------------|
| Navigation (MFD/plotter) | USD 500 (iPad) | USD 1,500-3,000 | USD 5,000-10,000 |
| Autopilot | USD 1,500 | USD 2,500-3,500 | USD 4,000-7,000 |
| Radar | USD 0 | USD 1,500-2,500 | USD 3,000-5,000 |
| AIS | USD 200 (rx only) | USD 400-800 | USD 800-1,200 |
| Instruments | USD 500 | USD 1,000-2,000 | USD 2,000-4,000 |
| Communications | USD 300 | USD 500-1,000 | USD 1,500-3,000 |
| Electrical (Victron/solar) | USD 1,000 | USD 2,500-4,000 | USD 5,000-10,000 |
| **TOTAL** | **USD 4,300** | **USD 10,500-17,600** | **USD 23,400-47,000** |

**Where they invest:** autopilot (directly affects quality of life), safety equipment, batteries/charging (Victron dominates), Starlink.
**Where they save:** chartplotter (iPad is "good enough"), instruments (older gear works), installation labour (strong DIY culture).

### What They Want

Synthesised from Cruisers Forum, Sailing Anarchy, Panbo, and sailing YouTube:

1. **One screen that shows everything** -- battery state, weather, navigation, engine data, without switching between 4 apps and devices
2. **Phone/tablet as primary interface** -- "Why do I need a USD 3,000 marine display when my iPad is better?"
3. **Cross-brand integration** -- "I have Garmin charts, Raymarine autopilot, B&G wind, and Victron power. Nothing talks to everything."
4. **Open data access** -- "It's my data from my sensors on my boat. Let me access it."
5. **Better weather routing** -- accessible, accurate, without expensive subscriptions
6. **Remote monitoring** -- check batteries, bilge, anchor alarm from shore
7. **Low power consumption** -- every watt matters off-grid

### Victron: The De Facto Cruiser Electrical Standard

Victron Energy has achieved a dominant position for power management among cruising sailors, with open protocols (VE.Direct, VE.Bus, Modbus TCP), a central hub (Cerbo GX with MQTT, Signal K, and web dashboard), and a cloud portal (VRM). A typical cruising sailboat has USD 1,500-3,000 of Victron hardware. This is the single highest-value integration target for Above Deck -- power monitoring and solar planning validation from the hardware most cruisers already own.

### Networking Tiers

| Tier | Description | Prevalence |
|------|------------|------------|
| Basic | Phone hotspot, no onboard WiFi, basic NMEA 0183 | Most coastal cruisers |
| Connected | Starlink/cellular router, MFD WiFi, iPad for charts | Active cruisers |
| Integrated | Marine router (Peplink), Signal K on Raspberry Pi, all instruments on WiFi | Tech-forward cruisers |

### Open-Source Cost Advantage

| Solution | Replaces | Savings | Adoption |
|----------|----------|---------|----------|
| OpenCPN | TimeZero, Navionics (desktop) | USD 200-500/yr | Medium-high |
| Signal K | Proprietary instrument bridges | USD 200-500 | Growing |
| OpenPlotter | Integrated nav system | USD 1,000-3,000 | Niche but enthusiastic |
| pypilot | Commercial autopilot | USD 1,000-3,000 | Small but dedicated |

A complete Raspberry Pi + Signal K + OpenCPN setup costs ~USD 150-300 in hardware, replacing USD 2,000-5,000 in commercial equivalents. The trade-off is setup time and technical skill -- exactly the gap Above Deck aims to close.

---

## 8. Features to Steal/Adapt

Patterns identified from cycling apps (Komoot, RideWithGPS) and marine competitors that translate directly to Above Deck:

### From Komoot (Cycling)

| Feature | Sailing Translation |
|---------|-------------------|
| Multi-day stage planner | Multi-day passage planner with daily legs and overnight stop suggestions |
| Highlights (community POIs) | Community-verified anchorages, hazards, marina reviews |
| "Must have visited" requirement | Only users who logged a passage through an anchorage can review it |
| Difficulty rating system | Passage difficulty: distance + sea state + exposure + tides + navigation complexity |
| Route characteristics breakdown | Passage composition: open water % + coastal % + channel % + harbour approach % |
| Map-centric / progressive disclosure UX | Minimal UI clutter, task-oriented, rich route preview |
| Collections | Curated groups of routes around a theme/area (e.g., "Ionian Islands 7-day", "Croatian coast highlights") |

### From RideWithGPS (Cycling)

| Feature | Sailing Translation |
|---------|-------------------|
| Cue sheets | Passage notes with auto-generated waypoint guidance + custom annotations |
| Heatmaps (where cyclists ride) | "Where sailors actually go" overlay |
| Club route library | Crew passage plan library with shared access |
| Club members get premium on club routes | Crew members get full nav on skipper's shared plans |
| Split Route tool | Split long passage into daily legs |
| Multiple routes open | Compare passage options side by side |
| Trace tool | Convert a recorded passage to a shareable route |
| API + Webhooks | Developer API from day one; webhooks for crew notifications |
| PDF export | Crew briefing sheets for passage planning |

### From Marine Competitors

| Source | Feature | Adaptation |
|--------|---------|-----------|
| SeaPeople | Hails (VHF-style social discovery) | "Who's in the anchorage" feature |
| SeaPeople | Live trip sharing to non-users | Share passage progress with family via web link |
| FastSeas | Satellite communicator support | Passage updates via Iridium InReach for offshore |
| Orca | Real-time route recalculation | Dynamic re-routing as conditions change |
| Orca | Night light display | Dark mode optimised for night sailing |
| Ditch Navigation | AIS pattern learning | "Where boats actually go" intelligence |
| Wavve | Draft-aware trip sharing | Filter shared routes by vessel draft |
| Navily | Marina booking integration | In-app marina reservation |
| SEAiq | Load your own charts | Support arbitrary chart formats (S-57, S-63, BSB) |
| Keeano | Coast View (aerial photos) | Aerial/satellite imagery for anchorage preview |
| Keeano | ML-powered suitability scores | Per-destination scoring based on vessel profile and weather |

---

## 9. Pricing Landscape

### What Competitors Charge

| Product | Free Tier | Entry | Mid | Premium |
|---------|-----------|-------|-----|---------|
| Savvy Navvy | No (credit card req.) | USD 80/yr | USD 145/yr | USD 189/yr |
| PredictWind | Yes (useless) | USD 29/yr | USD 249/yr | USD 499/yr |
| Navionics | No | USD 40/yr (USA) | USD 50/yr (US+CA) | USD 100/yr (worldwide) |
| Orca | Yes (app free) | EUR 49/yr | EUR 149/yr | EUR 148/yr (combined) |
| Komoot | Yes (1 region) | EUR 59/yr | -- | -- |
| RideWithGPS | Yes | USD 60/yr | USD 80/yr | Club (unlisted) |
| FastSeas | Yes (5 req/month) | Donations | -- | -- |
| SailGrib | No | EUR 46/yr | -- | -- |
| SeaPeople | Yes | PLUS (unlisted) | PATRON (unlisted) | -- |
| Navily | Yes | EUR 19.99/yr | -- | -- |
| SEAiq | 7-day trial | USD 10 (USA) | USD 20 (Open) | USD 250 (Pilot) |
| TimeZero | No | USD 20/yr (mobile) | USD 500-800 | USD 3,000 (Professional) |
| OpenCPN | Fully free | -- | -- | -- |

### Pricing Observations

1. **Free tier is essential for adoption.** Savvy Navvy requiring a credit card to trial drives away potential users. Orca's free app with paid add-ons is a better model.

2. **USD 60-80/yr is the sweet spot** for a mid-tier subscription. Below that is commodity; above that triggers subscription fatigue.

3. **Aggressive tier-gating destroys trust.** Savvy Navvy locking tides behind premium, and Navionics' 233% price increase since acquisition, are the most common complaints across all forums.

4. **Nickel-and-dime models frustrate.** iSailor's per-chart, per-feature purchasing quickly exceeds subscription alternatives.

5. **The market has bifurcated** into free-but-limited and expensive (USD 80-150/yr). A well-executed open-source platform with a strong free tier is structurally disruptive.

### Above Deck's Open-Source Advantage

Above Deck's free/open-source positioning is not just a pricing strategy -- it is a structural competitive advantage in a market where:

- Garmin is alienating Navionics users with price hikes and data lock-in
- Komoot proved that paywalling previously-free features triggers community revolt
- The DIY sailing community values openness and is technically literate enough to verify claims
- Community data (anchorage reviews, hazard reports) has massive value that increases with openness, not restriction
- ActiveCaptain's journey from beloved open community to "Garmin's cash cow" is a cautionary tale that resonates deeply with sailors

The "replace USD 5K of marine electronics with open-source software" argument already drives adoption of OpenPlotter and BBN OS. Above Deck needs to make that argument while delivering a dramatically better user experience.

### What Would Make Sailors Switch

Based on forum analysis across all tools:

1. **"It just works" on both iOS and Android** -- Savvy Navvy's Android problems and Navionics' forced migrations have burned users
2. **Free or very cheap** -- price increases are the #1 complaint across all paid tools
3. **Tides and currents included at every tier** -- gating these is widely criticised
4. **Community data that stays open** -- ActiveCaptain's Garmin acquisition left a bad taste
5. **Offline capability** -- non-negotiable for sailors
6. **Beautiful, modern UI** -- Orca has shown this matters
7. **Signal K integration** -- the DIY community is significant and underserved
8. **Honest, no-dark-patterns approach** -- sailors are a sceptical, technically literate audience
# Part 2: Technology and Architecture

**Date:** 2026-03-20
**Status:** Compiled from research

---

## 1. Executive Summary

Above Deck's technical architecture is built around a single Go binary that bridges every marine protocol (NMEA 0183/2000, Victron VE.Direct/MQTT/BLE, Matter/IoT) to a WebSocket-connected browser UI, with an Astro/React frontend embedded directly in the binary. The Go ecosystem provides mature, pure-Go libraries for every protocol layer needed, enabling single-binary cross-compilation to ARM64 (Raspberry Pi) without Node.js dependencies. MapLibre GL JS renders nautical charts from S-57-derived vector tiles stored as PMTiles archives, supporting full offline operation via PWA with OPFS storage. The boat is always the source of truth for its own data; cloud sync via Supabase is opportunistic, never a dependency. The primary technical risks are iOS Safari's restrictive Web APIs (mitigated by the Go server as a hardware bridge and Capacitor as an App Store escape hatch), the substantial effort required to implement S-52 nautical symbology in MapLibre, and the absence of a production-ready Go SignalK server — a gap Above Deck is uniquely positioned to fill.

---

## 2. Tech Stack Rationale

### Why Go for the Backend

Go was chosen for the marine server for several reinforcing reasons:

- **Single-binary deployment.** `GOOS=linux GOARCH=arm64 go build` produces one static file. Copy it to a Raspberry Pi and run it. No runtime, no package manager, no `node_modules`.
- **Memory efficiency.** A Go server uses 20-50 MB of RAM — 3-10x less than the Node.js-based SignalK server (100-300 MB). This matters on a Pi running alongside InfluxDB and Grafana.
- **Pure-Go libraries.** The critical marine libraries (NMEA parsing, CAN bus, MQTT, Modbus, WebSocket, serial) are all pure Go with zero CGo dependencies, enabling clean cross-compilation.
- **Embedded frontend.** Go 1.16+ `embed.FS` bundles the built Astro static site into the binary. One file serves both API and UI.
- **No Node.js on the boat.** The project explicitly avoids Node.js backend dependencies. Go replaces the entire SignalK Node.js stack.

### Why Astro + React for the Frontend

- **Astro 5** with SSR via `@astrojs/node` for the community site; static build for the tools embedded in the Go binary.
- **React 19 islands** provide interactivity where needed (chartplotter, instrument panels) without shipping JavaScript for static content.
- **Mantine v7** component library with Tabler Icons for consistent, minimal UI.
- **PWA via `@vite-pwa/astro`** with Workbox for offline capability on tablets at the helm.

### Why Supabase for the Cloud

- PostgreSQL + PostGIS for geographic queries on routes and waypoints.
- Google OAuth (PKCE flow) — no passwords to manage.
- Realtime subscriptions for community features.
- The boat's Go server talks to Supabase via standard REST/PostgREST during sync windows. No Supabase SDK needed on the server.

---

## 3. Go Marine Ecosystem

### Library Stack

The Go ecosystem covers every protocol layer Above Deck needs. The recommended core dependencies:

| Layer | Library | Stars | License | Key Strength |
|-------|---------|-------|---------|--------------|
| **NMEA 0183 parsing** | adrianmo/go-nmea | 258 | MIT | 100+ sentence types, custom parser registration, pure Go |
| **AIS decode/encode** | BertoldVdb/go-ais | 68 | MIT | Full ITU-R M.1371-5, bidirectional encode/decode |
| **CAN bus (SocketCAN)** | einride/can-go | 229 | MIT | Production-grade, DBC code-gen, 31 releases |
| **NMEA 2000 PGNs** | boatkit-io/n2k | 8 | — | Code-gen from canboat.json, strongly typed Go structs |
| **Serial ports** | go.bug.st/serial | — | — | USB port enumeration, no CGo on Linux, used by Arduino CLI |
| **MQTT client** | eclipse-paho/paho.mqtt.golang | 3,100 | — | De facto standard, 5,000+ importers |
| **Modbus TCP** | goburrow/modbus | 1,000 | — | TCP + RTU, production-proven |
| **WebSocket** | coder/websocket | 5,000 | — | Context-native, concurrent-write safe, zero dependencies |
| **mDNS/DNS-SD** | grandcat/zeroconf (enbility fork) | ~800 | — | Full DNS-SD for Matter + service advertisement |
| **BLE** | tinygo-org/bluetooth | 953 | — | Cross-platform GATT client, desktop + microcontroller |
| **HTTP server** | net/http (stdlib) | — | — | Production-grade, HTTP/2, no framework needed |
| **Static files** | embed (stdlib) | — | — | Single binary with frontend |

### Build-vs-Buy Decisions

| Component | Decision | Rationale |
|-----------|----------|-----------|
| VE.Direct parser | **Build** | Existing Go libs are proof-of-concept. Protocol is simple ASCII key=value (~100 lines for text mode) |
| Victron BLE parser | **Build** | No Go implementation exists. Reference Python/C++ implementations available. Would be the first Go implementation |
| NMEA sentence generator | **Build** | ~200-300 lines on top of go-nmea structs for autopilot commands |
| Matter controller | **Build** | gomat as reference. Pure Go, ~3-5k lines for discover/commission/read/subscribe |
| NMEA 0183 parser | **Use** go-nmea | Mature, comprehensive, community standard |
| AIS codec | **Use** go-ais | Complete ITU-R M.1371-5, MIT licensed |
| CAN bus access | **Use** einride/can-go | Production-grade, actively maintained |
| MQTT client | **Use** paho.mqtt.golang | De facto standard |

### The SignalK Gap

No actively maintained Go-based SignalK server exists. The only attempt — Argo (timmathews/argo) — has been dormant since 2021. The SignalK reference server is Node.js. Above Deck's Go server fills this gap as the first actively maintained Go-native marine data server. It does not need to implement the full SignalK spec — it can expose a SignalK-compatible REST/WebSocket API for interoperability while using its own internal data model.

### Victron Integration Paths

Victron devices expose data through multiple protocols, all accessible from Go:

| Protocol | Transport | Go Library | Use Case |
|----------|-----------|-----------|----------|
| VE.Direct | Serial (19200 baud) | Custom (build) | Direct connection to MPPT, BMV, inverters |
| MQTT | TCP | paho.mqtt.golang | Read from Cerbo GX / Venus OS |
| Modbus TCP | TCP port 502 | goburrow/modbus | Industrial integration with GX devices |
| BLE | Bluetooth advertising | tinygo-org/bluetooth + custom parser | Passive read, no connection required |
| NMEA 2000 | CAN bus | einride/can-go + n2k | When Victron is on the N2K bus |

### Architecture: Single Binary Marine Server

```
┌─────────────────────────────────────────────────────────┐
│                    Single Go Binary                      │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Embedded Astro Frontend               │   │
│  │           (embed.FS → net/http.FileServer)        │   │
│  └──────────────────────┬───────────────────────────┘   │
│                          │                               │
│  ┌──────────────────────┴───────────────────────────┐   │
│  │          REST API + WebSocket Server               │   │
│  │     (net/http + coder/websocket)                   │   │
│  └──────────────────────┬───────────────────────────┘   │
│                          │                               │
│  ┌──────────────────────┴───────────────────────────┐   │
│  │            Unified Data Model + Channels           │   │
│  └───┬──────┬──────┬──────┬──────┬──────┬───────────┘   │
│      │      │      │      │      │      │                │
│  ┌───┴──┐┌──┴──┐┌──┴──┐┌──┴──┐┌──┴──┐┌──┴──────┐      │
│  │NMEA  ││NMEA ││Victr││MQTT ││BLE  ││ Matter  │      │
│  │0183  ││2000 ││on   ││     ││     ││ Ctrl    │      │
│  └───┬──┘└──┬──┘└──┬──┘└──┬──┘└──┬──┘└──┬──────┘      │
│      │      │      │      │      │      │                │
│  serial  can-go  serial  paho  tinygo  gomat-           │
│                                  blue-   style           │
│                                  tooth                   │
└──────────────────────────────────────────────────────────┘
         │         │         │                │
    ┌────┴───┐ ┌───┴────┐ ┌──┴───┐     ┌─────┴─────┐
    │GPS,AIS │ │PICAN-M │ │Victron│     │Thread mesh│
    │RS-422  │ │CAN bus │ │MPPT   │     │sensors    │
    └────────┘ └────────┘ └──────┘     └───────────┘
```

Deployment: `scp above-deck-server pi@boat:~/` then `./above-deck-server`. One binary, all protocols, embedded frontend.

---

## 4. Mapping & Nautical Charts

### MapLibre GL JS as the Chart Renderer

MapLibre GL JS v5 is the clear choice for the chartplotter. It is the BSD-3-Clause-licensed community fork of Mapbox GL JS — no vendor lock-in, no API keys required. Its WebGL-accelerated vector rendering pipeline delivers smooth 60fps pan/zoom even with hundreds of chart layers, which is essential for dense nautical data.

**MapLibre vs alternatives:**

| Feature | MapLibre GL JS | Leaflet | OpenLayers |
|---------|---------------|---------|------------|
| Rendering | WebGL (GPU) | DOM / Canvas (CPU) | Canvas + WebGL opt-in |
| Tile format | Vector (MVT) primary | Raster primary | Both |
| Custom WebGL layers | Yes | No | Limited |
| Offline PMTiles | Native via addProtocol | Plugin needed | Plugin needed |
| Large dataset perf | Excellent (50k+ features) | Degrades >10k | Good to 50k |
| Bundle size | ~220 KB gzipped | ~40 KB gzipped | ~150 KB gzipped |

Freeboard-SK (the existing SignalK web chartplotter) uses OpenLayers. Above Deck's MapLibre-based chartplotter replaces it with a modern, GPU-accelerated renderer that supports custom WebGL layers for AIS vessels, weather particles, and animated tide arrows.

### The S-57 to Vector Tile Pipeline

The pipeline converts S-57 binary ENC files into vector tiles that MapLibre can render:

```
NOAA S-57 ENC files (.000)
    → s57-tiler (Go) or GDAL + Tippecanoe
    → MBTiles (vector tiles with S-57 layer names and attributes)
    → pmtiles convert
    → PMTiles files (one per region)
    → Upload to CDN (cloud) + bundle for local serving (boat)
```

**s57-tiler** (Go, actively maintained) is the most relevant pipeline tool — it aligns with the backend stack and produces vector tiles compatible with web map clients. Key S-57 layers for chart display:

| Layer | Content |
|-------|---------|
| `DEPARE` | Depth areas (contour polygons) |
| `SOUNDG` | Individual depth soundings (points) |
| `DEPCNT` | Depth contour lines |
| `LNDARE` | Land areas |
| `BOYCAR`, `BOYLAT` | Buoy types (cardinal, lateral) |
| `LIGHTS` | Light characteristics |
| `OBSTRN`, `WRECKS`, `UWTROC` | Hazards |
| `ACHARE`, `RESARE` | Anchorage and restricted areas |
| `TSSLPT`, `TSSRON` | Traffic separation schemes |

### S-52 Symbology

S-52 is the IHO standard for portraying ENC data on electronic displays. It defines colour tables (day/dusk/night), ~500 point symbols, line styles, area fills, and conditional display rules. Implementing S-52 in MapLibre requires:

1. **Sprite sheet** — Export S-52 symbols as a sprite atlas (PNG + JSON index).
2. **Style rules** — Translate S-52 conditional symbology into MapLibre style expressions (~200-300 rules).
3. **Three colour palettes** — Day, dusk, and night modes switched via `map.setStyle()`.
4. **Text placement** — Specific rules for soundings, light characteristics, and names.

No off-the-shelf MapLibre S-52 style exists. Building one is substantial work but well-defined by the specification. Freeboard-SK and s57-tiler have partial implementations as references.

### S-57 to S-101 Transition

| Date | Milestone |
|------|-----------|
| January 2026 | S-100 ECDIS optionally available; NOAA begins dual production |
| 2026-2028 | Trial period — both formats produced |
| January 2029 | S-100 ECDIS mandatory for new installations on new ships |
| ~2036 | Target for full S-57 withdrawal |

**Implication:** Build around S-57 now. S-101 support can be added later — GDAL already has experimental drivers. S-57 will be available for at least another decade.

### PMTiles: The Key Offline Format

PMTiles is a single-file archive for map tiles with no server required — any HTTP server with range request support works. Key properties:

- Hilbert-curve tile ordering + run-length encoded directories for efficient access.
- Typically 70%+ smaller than directory-of-files approach.
- Browser-native via `addProtocol` in MapLibre.
- Cloud-native — works directly from S3, R2 with no Lambda needed.

**Storage estimates for vector tiles:**

| Region | Approx PMTiles Size |
|--------|---------------------|
| Single harbour (e.g., San Francisco Bay) | 5-20 MB |
| US East Coast (Maine to Florida) | 200-500 MB |
| All US waters (~1,200 ENC cells) | 1-3 GB |
| Caribbean | 100-300 MB |
| Mediterranean (community data) | 200-600 MB |

Vector tiles are dramatically smaller than raster — a typical cruising season's worth of charts fits comfortably within browser storage quotas.

### Tile Serving Strategy

| Environment | Strategy |
|-------------|---------|
| Cloud (website) | PMTiles on Cloudflare R2 / S3 + `pmtiles` JS library |
| Boat (local network) | PMTiles on Go server filesystem, served via `http.ServeFile` (handles range requests natively) |
| Hybrid | Try local first, fall back to CDN if online |

### Marine Overlays

| Overlay | Data Source | Rendering |
|---------|-----------|-----------|
| AIS vessels | AISStream.io WebSocket or local receiver via Go server | GeoJSON source with real-time WebSocket updates, colour-coded by vessel type |
| Weather (wind, waves) | Open-Meteo Marine API, GFS GRIB data | Custom WebGL layer for wind particles; symbol layer for wind barbs |
| Tide/current arrows | NOAA CO-OPS, Neaps offline harmonics | Animated arrow symbols, direction/speed from attributes |
| Depth contours | S-57 vector tiles (DEPARE, DEPCNT, SOUNDG) | Fill, line, and symbol layers with S-52 styling |

### Nautical Chart Data Sources (Free)

| Country | Agency | Format | Coverage | Cost |
|---------|--------|--------|----------|------|
| USA | NOAA | S-57 ENC | US coastal waters, Great Lakes | Free (public domain) |
| New Zealand | LINZ | S-57 ENC | NZ waters, Pacific islands | Free |
| Germany | BSH | S-57 ENC | German waters, North/Baltic Sea | Free |
| France | SHOM | S-57 ENC (limited) | French waters | Partially free |
| Global | OpenSeaMap | OSM-based overlay | Worldwide (variable quality) | Free |

---

## 5. PWA & Mobile Strategy

### The iPad Problem

The iPad is the primary MFD display target, and Safari is the most restrictive platform. The Go server on a Raspberry Pi is the architectural linchpin that makes cross-platform PWA viable — by bridging all hardware protocols to WebSocket, every client gets the same data regardless of browser API limitations.

```
[NMEA 0183] ──USB──→ [Raspberry Pi]
[NMEA 2000] ──CAN──→ [  Go Server ] ──WebSocket──→ [PWA on iPad]
[Victron]   ──USB──→ [            ]                 [PWA on Android]
[BLE Sensors]──BLE──→ [            ]                 [PWA on Desktop]
```

### Platform Capability Matrix

| API | Chrome (Desktop/Android) | Safari (iOS/iPadOS) | Impact |
|-----|:-:|:-:|------|
| **Web Serial** | 89+ | No | Cannot connect directly to NMEA USB — Go server bridges |
| **Web Bluetooth** | 56+ | No | Cannot read Victron BLE — Go server or ESP32 bridges |
| **Screen Wake Lock** | 84+ | 16.4+ (18.4 for PWA) | Works on all major browsers now |
| **Screen Orientation Lock** | 38+ | No | CSS media query fallback on iOS |
| **Geolocation** | Yes | Yes | Works everywhere |
| **Service Workers** | Yes | Yes | Full offline support |
| **OPFS** | 86+ | 15.2+ | Supported for chart storage |
| **Push Notifications** | Yes | 16.4+ (PWA only) | Must be added to home screen first on iOS |
| **Periodic Background Sync** | 80+ | No | Weather must be fetched eagerly on iOS |
| **Persistent Storage** | Yes | 17+ (needs notification permission) | iOS couples this to notification permission |

### Storage Strategy

| API | Best For | Performance |
|-----|----------|-------------|
| **OPFS** | Large chart tile archives (PMTiles) | 3-4x faster than IndexedDB |
| **IndexedDB** | Structured navigation data (waypoints, routes) | Good |
| **Cache API** | Service worker HTTP caching | Good |

**Storage budgets:**

| Platform | Available | Recommended Chart Budget |
|----------|-----------|------------------------|
| Chrome desktop | 6-60 GB | Up to 5 GB |
| Chrome Android | 2-20 GB | Up to 2 GB |
| Safari iOS/iPadOS | 500 MB - several GB | Up to 1 GB (with persistent storage) |

### iOS Safari Mitigations

- **Storage eviction (7-day non-use):** Request persistent storage (requires notification permission). Capacitor wrapper eliminates this entirely.
- **No Web Serial/Bluetooth:** Go server on Raspberry Pi bridges all hardware to WebSocket.
- **No orientation lock:** Design responsive MFD frame; most iPad helm mounts are landscape.
- **No background sync:** Fetch weather/tides eagerly on app open.

### Caching Strategy by Data Type

| Data Type | Strategy | Rationale |
|-----------|----------|-----------|
| App shell (HTML, CSS, JS) | Cache-first, update in background | Must work offline immediately |
| Chart tiles (vector/raster) | Cache-first with manual pre-cache | Large, rarely change, critical offline |
| Instrument data (NMEA, Victron) | Network-only (WebSocket) | Real-time, no caching value |
| Community content | Network-first, cache fallback | Fresh preferred, stale acceptable |
| User data (routes, waypoints) | IndexedDB with background sync | Must persist offline, sync when connected |
| Weather/tide data | Stale-while-revalidate | Time-sensitive but short offline trips OK |

### App Store Distribution Paths

| Channel | Platform | Effort | Notes |
|---------|----------|--------|-------|
| **PWA (home screen)** | All | Low | Primary distribution method |
| **TWA (Trusted Web Activity)** | Google Play | Medium | Full Chrome API access, Play Store listing |
| **Capacitor wrapper** | iOS App Store | High | Only path to iOS App Store; enables native BLE, serial, storage |
| **PWABuilder** | Microsoft Store | Low-Medium | Desktop distribution |

**Recommended strategy:** PWA-first for zero-friction distribution, TWA for Android Play Store, Capacitor wrapper for iOS App Store (unlocks native Bluetooth for Victron BLE on iPad, eliminates storage eviction, enables App Store discoverability).

---

## 6. Deployment Architecture

### Core Principle

The boat is the source of truth for its own data. The cloud is a convenience layer for sync, community, and backup — never a dependency.

### Hardware Options

| Hardware | Idle Power | Cost | Marine Suitability | Best For |
|----------|-----------|------|-------------------|----------|
| **Raspberry Pi 5** | ~2.7W | USD 80-120 | Good with enclosure + HAT | Default recommendation |
| **HALPI2 (CM5)** | ~3-4W | USD 300+ | Excellent — waterproof, NMEA built-in | Turnkey marine deployment |
| **Intel N100 Mini PC** | ~3.5-6W | USD 100-200 | Good — fanless models available | More compute headroom, USB NMEA adapters |
| **Fanless Industrial PC** | ~10-25W | USD 400-1500 | Excellent — DNV certified, wide temp/voltage | Commercial vessels, bluewater |
| **Synology NAS** | ~15-20W | USD 300-400 | Fair — not marine-rated | Already on the boat, extra container |

**HALPI2** (Hat Labs) is the gold standard for marine CM5 deployments: waterproof aluminium enclosure, integrated NMEA 2000 (CAN) and NMEA 0183 (RS-485), NVMe SSD, ships with HaLOS (container-first OS) pre-installed with Signal K.

### Docker Deployment: Single Container (Default)

The Go binary embeds the built frontend using `embed.FS`. Multi-stage Docker build:

```
Stage 1: Node — build Astro static site
Stage 2: Go — build Go binary
Stage 3: scratch/alpine — copy binary + static assets
```

**Resulting image:** 15-30 MB (scratch) or 25-50 MB (alpine). Multi-arch builds for `linux/arm64` and `linux/amd64` via `docker buildx` + GitHub Actions.

**Key constraint:** Use `modernc.org/sqlite` (pure Go) instead of `mattn/go-sqlite3` to avoid CGo and enable clean cross-compilation.

### Docker Compose: Multi-Service Stack

For boats wanting observability alongside Above Deck:

| Service | RAM (typical) | CPU (idle) |
|---------|--------------|------------|
| Above Deck (Go) | 20-50 MB | <1% |
| SignalK | 100-200 MB | 1-3% |
| InfluxDB | 200-500 MB | 1-5% |
| Grafana | 50-100 MB | <1% |
| **Total** | **370-850 MB** | **3-10%** |

A Pi 5 with 8 GB has plenty of headroom.

### Update Mechanisms

| Method | Requires Internet | Best For |
|--------|------------------|----------|
| **OTA via Above Deck UI** | Yes | Recommended default — user-initiated |
| **Watchtower** | Yes (polls registry) | Marina/Starlink boats with regular connectivity |
| **Manual docker pull** | Yes | Occasional connectivity |
| **USB sideload** | No | Extended offshore passages |

Docker images signed with cosign (Sigstore) via GitHub OIDC. Boat verifies signature before applying updates.

### Cloud Sync Architecture

**What syncs vs. what stays local:**

| Data | Syncs to Cloud | Rationale |
|------|---------------|-----------|
| Settings, routes, waypoints | Yes (bidirectional) | Roam between devices, plan on laptop |
| Passage logs, maintenance | Yes (boat → cloud) | Backup + community sharing |
| Community contributions | Yes (bidirectional) | KB articles, forum posts |
| Real-time instrument data | **No** | Too high volume, no cloud value |
| NMEA sentence stream | **No** | Real-time telemetry stays local |
| Time-series (InfluxDB) | **No** | Volume too large; export summaries |
| Cached charts/tiles | **No** | Large, copyrighted, already available in cloud |

**Sync strategy:** Last-write-wins with conflict detection. CRDTs are mathematically elegant but overkill for Above Deck's sync patterns (settings, routes, logs — not collaborative real-time editing). Every synced record carries `updated_at` (UTC) and `device_id`. Conflicts flagged for user resolution.

**Bandwidth-aware sync:**

| Connection | Sync Behaviour |
|------------|---------------|
| Starlink / marina WiFi | Full sync — all pending changes, community data |
| Cellular | Essential only — settings, routes, critical updates |
| Iridium | Emergency only — position reports, critical alerts |
| None | Queue locally. No retry loops (waste battery) |

### Redundancy

For most boats, a cold spare (pre-imaged SD card in a dry bag) provides 90% of the resilience at 10% of the complexity. The Go binary + SQLite database is small enough to fit on a USB stick.

### Database Strategy by Tier

| Tier | Database | Rationale |
|------|----------|-----------|
| **Boat (local)** | SQLite (WAL mode) | Zero config, single file, trivial backup, survives power loss |
| **Marina (multi-boat)** | PostgreSQL | Multi-tenant, concurrent writes, RLS for isolation |
| **Cloud (community)** | Supabase PostgreSQL + PostGIS | Managed, scalable, geographic queries, built-in auth |

The Go server abstracts the database behind an interface — same codebase runs against SQLite or PostgreSQL with a build flag or environment variable.

### Security

| Context | Approach |
|---------|----------|
| **Boat local network** | HTTP on `abovedeck.local` via mDNS. Network is physically isolated; HTTPS overhead not justified |
| **PWA Service Workers** | Require secure context. Options: access via `localhost`, self-signed cert, or Chrome insecure-origins flag |
| **Boat auth** | None or optional PIN (single owner, trusted network) |
| **Cloud auth** | Google OAuth (PKCE flow) via Supabase |
| **Boat-to-cloud sync** | Long-lived API key, encrypted at rest, transmitted over HTTPS |
| **Data at rest** | Encrypt sensitive fields (API keys, tokens) at application level. Full-disk encryption is overkill for instrument data |

---

## 7. Data Sources & APIs

### Recommended Data Architecture

**Tier 1 — Core (all free):**

| Need | Source | Cost | License |
|------|--------|------|---------|
| Basemap | MapLibre GL JS (unlimited) | Free | BSD-3-Clause |
| Seamark overlay | OpenSeaMap tiles | Free | ODbL / CC-BY-SA |
| Weather | Open-Meteo Marine API | Free (10k calls/day) | — |
| Tides (offline) | Neaps tide-database (7,600 stations) | Free | MIT / CC BY 4.0 |
| Harbours/marinas | OpenStreetMap Overpass API | Free | ODbL |
| Charts (US) | NOAA WMTS/WMS + S-57 ENC | Free | Public domain (CC0) |
| Protected areas | WDPA API | Free | — |

**Tier 2 — Supplementary:**

| Need | Source | Cost |
|------|--------|------|
| Tides (US real-time) | NOAA CO-OPS API | Free |
| Tides (UK) | ADMIRALTY Discovery API | Free (10k req/mo) |
| AIS | AISStream.io WebSocket | Free |
| Anchorage patterns | Global Fishing Watch (~160k locations) | Free (CC-BY-SA 4.0) |

### Open-Meteo Marine API (Primary Weather)

- **Endpoint:** `https://marine-api.open-meteo.com/v1/marine`
- **Auth:** No API key required (non-commercial)
- **Rate limits:** 600/min, 5,000/hour, 10,000/day
- **Forecast range:** Up to 16 days
- **Resolution:** 5 km (Europe), 9 km (global ECMWF WAM)
- **Variables:** Wave height/direction/period, swell components, ocean currents, SST, sea level height
- **Models:** MeteoFrance MFWAM, ECMWF WAM, GFS Wave, ERA5-Ocean (historical back to 1940)

### Neaps Tide Database (Critical for Offline)

~7,600+ stations globally (3,400 NOAA + 4,200 TICON-4/GESLA-4) with harmonic constituents. Feed constants to a tide prediction library to calculate tides locally for any date/time. No API calls at runtime. Works completely offline.

### Data Source Licensing Summary

| Source | License | Cache/Store | Redistribute | Pre-populate DB |
|--------|---------|-------------|--------------|-----------------|
| OpenStreetMap / OpenSeaMap | ODbL + CC-BY-SA | YES | YES (share-alike) | YES |
| NOAA (charts, tides, weather) | Public Domain (CC0) | YES | YES | YES |
| Global Fishing Watch | CC-BY-SA 4.0 | YES | YES (share-alike) | LIKELY YES* |
| Mapbox | Proprietary | SDK only | NO | NO |
| Navily | Proprietary | NO | NO | NO |
| Noonsite | Copyright (WCC Ltd) | NO | NO | NO |
| ADMIRALTY (UKHO) | Crown Copyright | NO (free tier) | NO | NO |

*Global Fishing Watch: non-commercial API restriction needs confirmation for free open-source apps.

### Other National Hydrographic Offices with Free Data

- **LINZ (New Zealand):** NZ, Antarctica, SW Pacific
- **SHOM (France):** Some free data via data.shom.fr
- **Finnish HO:** Open data, community-converted to Mapbox vector tiles

---

## 8. Weather Routing

### Algorithm Landscape

The isochrone method (Hagiwara, 1989) is the dominant algorithm for sailing weather routing. From a departure point, it projects boat positions along multiple headings using polar diagram performance, adds ocean current vectors, and iterates forward in time steps until an isochrone reaches the destination.

### Open-Source Implementations

| Project | Language | License | Algorithm | Recommended? |
|---------|----------|---------|-----------|-------------|
| **peterm790/weather_routing** | Python | **MIT** | Isochrone with wake-limiting pruning | **Yes — study first** |
| **libweatherrouting** | Python | GPL-3.0 | LinearBestIsoRouter | Study only (GPL) |
| **OpenCPN weather_routing_pi** | C++ | GPL-3.0 | Classical isochrone | Reference (GPL) |
| **hrosailing** | Python | **Apache 2.0** | Polar processing + isochrone | **Yes — polar library** |
| **Bitsailor** | Common Lisp + JS | GPL-3.0 | Isochrone with position filtering | Study only (GPL) |
| **VISIR-2** | Python | Academic | Currents + waves + wind | Reference |

### Recommended Approach

1. **Start from MIT-licensed peterm790/weather_routing** as the algorithmic foundation — clean Python, well-documented, wake-limiting pruning for efficiency.
2. **Use hrosailing (Apache 2.0)** for polar diagram processing — published in Applied Sciences journal.
3. **Use orc-data (MIT)** for boat polar database — ORC certificate data 2019-2025, JSON format.
4. **Consume NOAA GFS/OSCAR data directly** — public domain, 0.25-degree resolution, updated 4x daily.
5. **Build a clean-room Go implementation** — no GPL code in the core routing engine to preserve license flexibility.

### Boat Polar Data Resources

| Source | License | Data |
|--------|---------|------|
| orc-data (GitHub) | MIT | ORC certificates 2019-2025, JSON, TWS/TWA grid |
| hrosailing | Apache 2.0 | Polar processing library, multiple format support |
| Seapilot polar database | Free download | Large collection of .pol files by boat type |

### FastSeas (Competitive Reference)

FastSeas is a proprietary, closed-source web-based routing tool. No public API, no published algorithm. It uses NOAA GFS + OSCAR currents, integrates with Windy.com, and supports satellite communicators (Garmin inReach, Zoleo) via email responder. Free tier: 5 routing requests/month. Premium: USD 5/month.

**Key takeaway:** The isochrone algorithm is a well-published mathematical method (1989), not patentable. Above Deck can build its own implementation from academic papers and MIT-licensed references without any FastSeas code or data.

---

## 9. Community Platform Patterns

### Authentication

Supabase handles OAuth natively for both GitHub and Google — the implementation is identical, just swap the provider string. PKCE flow required for SSR with Astro.

| Factor | GitHub | Google |
|--------|--------|--------|
| Audience | Developers, technical users | Everyone |
| Email reliability | May need `user:email` scope | Always provides email |
| Trust signal | Strong for dev community | Universal |

**Recommendation:** Support both. GitHub signals developer-friendly community; Google ensures non-technical sailors can sign up.

### Forum Strategy

| Phase | Platform | Rationale |
|-------|----------|-----------|
| Launch | GitHub Discussions + WhatsApp Community | Zero cost, zero infrastructure, meets users where they are |
| Growth (100+ active) | Evaluate custom Supabase discussions or Discourse | Full brand control or proven community software |

WhatsApp dominates sailing communities because it is global and works on low-bandwidth connections. Use a **WhatsApp Community** (not Channel, not standalone Group) for broadcast announcements plus organized sub-groups.

**Community success factors:** Seed with content before inviting members (empty forums die). First-week engagement drives retention (40% higher with good onboarding). Recognition systems (badges, milestones) increase retention by up to 30%.

### Knowledge Base

Astro MDX content collections provide the foundation:

- **Categories:** Electrical, navigation, seamanship, maintenance, communication
- **Difficulty levels:** Beginner, intermediate, advanced (modeled on Victron's training tiers)
- **Search:** Pagefind — client-side, zero-server, full-text search at ~1-3% of site size
- **RAG-ready structure:** Use H2 headers as chunk boundaries, keep sections self-contained, include `summary` and `keyTopics` in frontmatter for future AI retrieval. Clean markdown improves RAG accuracy by up to 35%.

### Blog Platform

Astro content collections with MDX. YouTube embeds via `astro-embed` (lazy-loaded, no iframe until interaction). RSS via `@astrojs/rss`. Newsletter via Buttondown (markdown-native, free for <100 subscribers).

### Build Order

```
Content (blog, knowledge base)
  → attracts visitors via SEO
    → converts to email subscribers and WhatsApp members
      → builds community engagement
        → creates demand for the product
```

| Phase | Goal | Key Metric | Target |
|-------|------|-----------|--------|
| 0: Foundation (Week 1-2) | Landing page + email signup | Email signups | 100 |
| 1: Content (Week 3-6) | 2-3 articles/week, SEO | Monthly visitors | 1,000 |
| 2: Community (Week 7-10) | Auth, profiles, WhatsApp | Registered users | 50 |
| 3: Knowledge Base (Week 11-16) | Categories, search, paths | KB articles | 50+ |
| 4: Advanced (Week 17+) | Built-in discussions, AI | Weekly active members | 25+ |

---

## 10. Key Technical Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **iOS Safari restrictions** — no Web Serial, no Web Bluetooth, aggressive storage eviction | High | Go server bridges all hardware to WebSocket; Capacitor wrapper for App Store eliminates storage eviction; request persistent storage via notification permission |
| **S-52 symbology implementation** — ~200-300 style rules, no off-the-shelf MapLibre style exists | High | Well-defined by IHO specification; partial implementations exist in Freeboard-SK and s57-tiler as references; ship with NOAA raster MBTiles first for quick win |
| **No Go SignalK server** — Above Deck fills a gap nobody else has successfully filled | Medium | Do not need full SignalK spec; expose compatible REST/WebSocket API for interoperability while using own internal data model |
| **CGo for BLE** — tinygo-org/bluetooth requires CGo on all desktop platforms, complicates cross-compilation | Medium | BLE is optional (Go server bridges BLE data anyway); build on target Pi or use Docker ARM64 cross-compilation container |
| **Apple further restricts PWAs** | Medium | Capacitor wrapper as escape hatch; EU DMA enforcement trending toward openness; Apple reversed PWA removal after backlash |
| **SQLite vs PostGIS for local geographic queries** | Low | SQLite handles waypoint/route storage; if geographic queries needed locally, evaluate spatialite or embedded Postgres |
| **Service Worker HTTPS requirement on local network** | Medium | `abovedeck.local` is not a secure context; options: self-signed cert + CA install, Chrome insecure-origins flag, or access via `localhost` on same device |
| **Weather routing algorithm correctness** | Medium | Build from MIT-licensed reference (peterm790/weather_routing); validate against academic papers; isochrone method is well-understood (1989+) |
| **NOAA as single chart source** — only covers US waters for free | Medium | Pipeline architecture is chart-source-agnostic; add LINZ, BSH, SHOM as they become available; OpenSeaMap provides global supplement |
| **Connectivity-dependent sync** — boats have wildly varying bandwidth | Low | Sync is bandwidth-aware (full/essential/emergency/none); boat operates independently without sync; queue changes locally with no retry loops |
# Part 3: Hardware, Connectivity, and IoT

**Above Deck Research Report — March 2026**

---

## 1. Executive Summary

The marine hardware landscape is a patchwork of decades-old serial protocols (NMEA 0183), modern CAN bus networks (NMEA 2000), proprietary vendor ecosystems, and an emerging open-source layer centred on SignalK and Raspberry Pi. Above Deck's opportunity sits at the intersection of all of these: a Go-based server running on a Raspberry Pi with direct NMEA access, consumer IoT sensors via the Matter protocol, long-range shore monitoring through LoRa/Meshtastic, and a PWA interface that renders on any browser — from a USD 400 iPad to a USD 4,000 Garmin MFD. The hardware problem is largely solved by the open-source community; what is missing is the software layer that unifies it all with modern UX, AI integration, and zero vendor lock-in.

---

## 2. Marine Protocol Landscape

### The Four Protocols Every Boat Speaks

Marine electronics communicate through a layered stack of protocols, each serving a different era and purpose. Understanding how they relate is essential to Above Deck's integration strategy.

**NMEA 0183** is the oldest and most ubiquitous. Introduced in 1983, it uses RS-422 serial at 4800 baud (or 38400 for high-speed AIS). It is point-to-point — one talker, one or more listeners per wire. Every GPS, VHF radio, AIS transponder, and depth sounder built in the last 40 years speaks NMEA 0183. It remains the only output on many instruments still in service. The majority of cruising boats have NMEA 0183 devices aboard, and any integration strategy must handle it.

**NMEA 2000** is the modern standard, adopted on all new marine equipment since roughly 2012. Built on CAN bus (SAE J1939, IEC 61162-3) at 250 kbit/s, it provides a true multi-device network — plug-and-play, self-addressing, with data organised into Parameter Group Numbers (PGNs). Wind, depth, speed, heading, GPS, engine data, and tank levels all travel on a single backbone cable with drop connections. NMEA 2000 is the non-negotiable backbone that every MFD manufacturer uses.

**SeaTalk** is Raymarine's legacy proprietary protocol, found on older Autohelm and early Raymarine equipment. SeaTalk NG (the current variant) is electrically compatible with NMEA 2000 and uses the same CAN bus — it is effectively NMEA 2000 with a different connector. Legacy SeaTalk (SeaTalk1) is a single-wire protocol that requires a dedicated bridge or gateway to reach modern systems. The MacArthur HAT for Raspberry Pi includes SeaTalk1 support specifically for this legacy base.

**SignalK** is the open-source bridge layer that normalises all of the above into a single JSON-based data model accessible over HTTP and WebSocket. It runs on a Raspberry Pi (or any Linux/Node.js host), ingests NMEA 0183, NMEA 2000, SeaTalk, Victron data, and dozens of other sources, and presents them through a unified REST/WebSocket API. Nearly every open-source marine project speaks SignalK — it is the lingua franca of the DIY marine community.

### Protocol Adoption on Real Boats

| Protocol | Status | Typical Boats |
|----------|--------|---------------|
| NMEA 0183 | Extremely common | Any boat with gear older than ~2010. Still the only output on many GPS units, VHF radios, and AIS units |
| NMEA 2000 | Standard on all new equipment | Boats built or refit since ~2012. CAN bus backbone, plug-and-play |
| Mixed 0183 + N2K | Most common real-world scenario | Majority of cruising boats. Requires gateway/bridge devices |
| SignalK | Growing among tech-savvy sailors | Bridges 0183, N2K, and WiFi. Raspberry Pi-based |
| SeaTalk (legacy) | Declining | Older Raymarine-only boats. SeaTalk NG is N2K compatible |
| OneNet (Ethernet) | Emerging, not yet widely deployed | NMEA's next-gen IP-based standard. Few products shipping |

The key insight: the majority of cruising boats have a mix of NMEA 0183 and NMEA 2000 devices. Above Deck's Go server must handle both protocols, either directly (via CAN bus and serial) or through SignalK as an intermediary.

### How the Protocols Relate

```
┌────────────────────────────────────────────────────────────────┐
│                    Above Deck Data Model                       │
│         (Unified JSON — navigation, electrical, environment)   │
└──────────┬──────────────┬──────────────┬──────────────┬───────┘
           │              │              │              │
    ┌──────┴──────┐ ┌─────┴─────┐ ┌─────┴─────┐ ┌─────┴─────┐
    │  SignalK    │ │  NMEA     │ │  Victron  │ │  Matter   │
    │  Adapter   │ │  Direct   │ │  Adapter  │ │Controller │
    └──────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
           │             │             │              │
    ┌──────┴──────┐ ┌────┴─────┐ ┌────┴─────┐ ┌─────┴─────┐
    │  NMEA 0183 │ │ NMEA 2000│ │ VE.Direct│ │  Thread   │
    │  NMEA 2000 │ │ (CAN bus)│ │ MQTT     │ │  WiFi     │
    │  SeaTalk   │ │          │ │ Modbus   │ │  Sensors  │
    │  + others  │ │          │ │          │ │           │
    └────────────┘ └──────────┘ └──────────┘ └───────────┘
```

---

## 3. Hardware Platform Options

### Raspberry Pi — The Reference Platform

The Raspberry Pi is the de facto standard for open-source marine computers. Above Deck's Go server runs on a Pi with direct NMEA 0183/2000 access via marine-specific HATs (Hardware Attached on Top), eliminating the need for middleware.

| Product | Price | Features | Notes |
|---------|-------|----------|-------|
| **PICAN-M HAT** | ~USD 99 | NMEA 0183 (RS-422) + NMEA 2000 (CAN bus via MCP2515) + Qwiic I2C + 3A PSU from 12V | The standard. Powers Pi directly from boat 12V |
| **MacArthur HAT** (OpenMarine) | ~USD 80 | NMEA 0183 + NMEA 2000 + SeaTalk1 + SignalK | Multi-protocol. Sold by Wegmatt |
| **HALPI2** | ~USD 300+ | Raspberry Pi CM5 in waterproof aluminium enclosure. HDMI, NMEA 2000, NMEA 0183, Ethernet, 2x USB 3.0, external WiFi/BT antenna | Ruggedised, production-ready. Reviewed by Hackaday (Sept 2025) |

The Pi provides WiFi for the local network, USB for Victron VE.Direct connections, and GPIO/I2C for additional sensors. With a PICAN-M HAT, SocketCAN (the Linux kernel CAN interface) gives direct NMEA 2000 access — no middleware needed.

**Recommended reference hardware:** Raspberry Pi 5 + PICAN-M HAT in a waterproof enclosure. The HALPI2 is the premium turnkey option.

### ESP32 — The Swiss Army Knife

ESP32 boards serve as the bridge between marine protocols and WiFi/IP networks. At USD 5-15 per board, with built-in CAN bus (for NMEA 2000), WiFi, BLE, and Thread (ESP32-C6/H2), they fill multiple roles in the architecture.

| Project | What It Does | Notes |
|---------|-------------|-------|
| **esp32-nmea2000** (wellenvogel) | NMEA 2000 to WiFi gateway. Reads CAN bus, serves NMEA 0183 over TCP | Active, well-documented. Runs on M5 Atom CAN (~USD 15) |
| **NMEA2000WifiGateway** (AK-Homberger) | NMEA 2000 WiFi gateway with voltage/temp alarms | Popular reference implementation |
| **SensESP** (HatLabs) | ESP32 sensor framework for SignalK. Turns any sensor into a SignalK data source over WiFi | Very active. Supports temp, pressure, flow, tank level sensors |
| **Smart2000 ESP** | Wireless NMEA 2000 bridge — keeps CAN bus physically separate from the Pi | Solves the wiring problem on larger boats |

The ESP32 serves Above Deck in four capacities:

1. **NMEA 2000 WiFi gateway** — sits on the CAN bus, streams data to the Go server over WiFi. No need for the Pi to be physically near the instruments.
2. **DIY sensor nodes** — temperature, tank level, bilge float. Currently planned via MQTT; could migrate to Matter (ESP32-C6 supports Thread/Matter).
3. **Thread border router** — ESP32-C6/H2 bridges the Thread mesh to WiFi for Matter sensors.
4. **Wireless NMEA bridge** — for boats where running a cable from instruments to the Pi is impractical.

The ESP32-C6 is particularly significant: it does WiFi, BLE, Thread, and Matter all in one chip (~USD 5). A single ESP32-C6 on the boat could serve as both NMEA WiFi gateway (with CAN transceiver) and Thread border router.

### Industrial PCs and Ruggedised Options

For production deployments beyond the Pi, the ecosystem includes:

- **HALPI2** — CM5-based ruggedised Pi in waterproof aluminium. HDMI out, all marine connectors, external antenna. The turnkey option.
- **Industrial SBCs** — Boards like the Advantech UNO series or Axiomtek embedded PCs run Linux with CAN bus support. Overkill for most boats, relevant for commercial/charter deployments.
- **NUC-class PCs** — Intel NUC or similar small-form-factor PCs. More processing power than a Pi, but no marine HATs available — would need USB-CAN adapters.

For Above Deck's target audience (cruising sailors doing DIY integration), the Raspberry Pi remains the clear recommendation. The software is the same regardless of hardware — Docker containers run identically on a Pi, a NUC, or a cloud server.

---

## 4. Matter Protocol and IoT

### What Matter Is

Matter is an open-source, IP-based IoT interoperability standard backed by Apple, Google, and Amazon. It covers the "smart home" layer of boat systems — lighting, climate, environmental sensors, energy management, security — that marine protocols (NMEA 0183/2000) do not reach.

Devices communicate locally over IPv6, with no cloud required. Two transport layers are supported:

- **WiFi/Ethernet** — for powered devices (plugs, controllers, cameras)
- **Thread** — a low-power 802.15.4 mesh network for battery-operated sensors. Thread is self-healing, so sensors spread around the vessel relay for each other

Every Matter device exposes standardised "clusters" — a temperature sensor exposes a Temperature Measurement cluster, a smart plug exposes On/Off + Electrical Measurement. A controller reads these clusters identically regardless of manufacturer.

As of March 2026, there are 750+ Matter-certified products on the market.

### Version History (Marine-Relevant Features)

| Version | Date | Relevant Additions |
|---------|------|-------------------|
| 1.0 | Oct 2022 | Lighting, plugs, switches, sensors (motion, door, temperature), thermostats |
| 1.2 | Oct 2023 | Air quality sensors (CO2, VOC, CO), smoke/CO alarms |
| 1.3 | May 2024 | Water and energy management devices |
| 1.4 | Nov 2024 | **Solar panels, batteries**, home routers, water heaters |
| 1.5 | Nov 2025 | **Cameras**, soil moisture sensors, **Device Energy Management cluster**, advanced power metering |

### What Matter Enables on a Boat

The Above Deck vision originally specified "MQTT + ESP32 DIY sensors" for temperature, bilge, and tanks. Matter replaces that with standardised, off-the-shelf hardware:

| Boat Need | Matter Device Type | Notes |
|-----------|-------------------|-------|
| Cabin/engine room temperature | Temperature Sensor | Off-the-shelf, ~USD 15-25 |
| Humidity (mould prevention) | Humidity Sensor | Eve Room, Aqara, etc. |
| Hatch open/closed | Contact Sensor | Standard door/window sensors |
| Bilge high-water alarm | Contact Sensor | Wet = closed trigger |
| Cabin/courtesy lighting | Dimmable Light / Smart Plug | Massive device selection |
| Navigation light switching | On/Off Relay | Matter smart switches |
| Fridge/freezer monitoring | Temperature Sensor | Placed inside fridge |
| LPG/gas detection | Air Quality Sensor (v1.2+) | CO/gas detectors |
| Motion detection (security at dock) | Occupancy Sensor | Standard motion sensors |
| Solar production | Solar device type (v1.4+) | Emerging support |
| Battery state | Battery device type (v1.4+) | Emerging support |
| Power consumption per circuit | Electrical Measurement cluster | Smart plugs with power metering |

The win: sailors walk into any electronics store, buy a Matter sensor, and it works with Above Deck. No flashing ESP32 firmware, no configuring MQTT topics, no custom protocol bridges.

### Go Implementation Strategy

A pure Go Matter controller is feasible and aligns with project principles (no Node.js, single binary, own the protocol). The existing `gomat` library (github.com/tom-code/gomat) demonstrates feasibility — pure Go, no C/C++ dependencies, 135 commits achieving commissioning, PASE, CASE, certificates, discovery, and read/subscribe.

```
┌──────────────────────────────┐     ┌────────────────────────────────┐
│  Above Deck Go Matter        │     │  connectedhomeip virtual       │
│  Controller (pure Go)        │────▶│  devices (test targets only)   │
│                              │     │                                │
│  Compiles into single binary │     │  e.g. chip-lighting-app        │
│  No C/C++ deps               │     │       chip-all-clusters-app    │
└──────────────────────────────┘     └────────────────────────────────┘
        ▲                                        │
        │          Matter protocol (IP)          │
        └────────────────────────────────────────┘
```

**Protocol layers required:**

| Layer | What It Does | Complexity | Go Feasibility |
|-------|-------------|------------|----------------|
| mDNS/DNS-SD discovery | Find Matter devices on the network | Low | Excellent libraries (`hashicorp/mdns`, `grandcat/zeroconf`) |
| SPAKE2+ (PASE) | Password-based session establishment | Medium | ~500 lines. Standard crypto |
| SIGMA (CASE) | Certificate-based operational sessions | Medium-High | Go `crypto` stdlib handles all primitives |
| TLV encoding | Matter's binary wire format | Low | ~300 lines |
| Message framing | Packet structure, AES-128-CCM encryption | Medium | Go `crypto/cipher` |
| Interaction Model | Read/Write/Subscribe/Invoke commands | Medium | Core controller logic |
| Certificate management | NOC, RCAC, fabric identity | Medium | Go `crypto/x509` handles natively |
| Cluster definitions | Data models per device type | Low (but wide) | Code-gen from spec |

A minimal Matter controller (discover, commission, read, subscribe, command) is approximately 3,000-5,000 lines of Go. What can be skipped initially: Thread radio stack (the ESP32 border router handles it), BLE transport, and full cluster coverage (start with 5-6 boat-relevant clusters).

### Thread Mesh on a Boat

Thread uses IEEE 802.15.4 at 2.4 GHz in a self-healing mesh topology. It is well-suited to boats:

| Factor | Impact | Notes |
|--------|--------|-------|
| **Fibreglass hull** | Good | Low attenuation — ideal for catamarans and most cruising boats |
| **Aluminium/steel hull** | Challenging | Signal blocked by metal compartments. Needs mesh routing through hatches |
| **Mesh self-healing** | Very positive | Powered Thread devices (lights, plugs) act as routers, relaying for battery sensors |
| **Range** | ~10-15m indoor | Sufficient for most boats. A 50ft cat might need 3-4 mesh nodes |
| **Power** | Excellent | Thread end devices sleep aggressively. Temp sensor on coin cell lasts 1-2 years |

A Thread Border Router is required to bridge the Thread mesh to the boat's WiFi network. The ESP32-C6 or ESP32-H2 can serve this role (~USD 5), either standalone or built into Above Deck's recommended hardware.

---

## 5. SignalK

### What It Is

SignalK is an open-source marine data exchange standard that provides a unified JSON-based data model for vessel information, served over HTTP and WebSocket. It runs as a Node.js server (typically on a Raspberry Pi), ingesting data from NMEA 0183, NMEA 2000, SeaTalk, Victron, and dozens of other sources.

### Data Model

SignalK defines 12 top-level vessel domains:

1. **navigation** — position, heading, speed, course, depth, wind, GNSS, anchor
2. **electrical** — batteries, inverters, chargers, alternators, solar, AC buses
3. **environment** — outside/inside temp, humidity, water temp, depth, wind, current, tide
4. **propulsion** — engines, transmissions, fuel, temperature, oil
5. **tanks** — freshwater, wastewater, fuel, LPG, ballast, baitwell
6. **steering** — rudder angle, autopilot state/mode/target
7. **communication** — radio, telephone, email
8. **design** — displacement, draft, beam, air height, rigging type
9. **sails** — inventory, area (total/active)
10. **sensors** — generic sensor state and data
11. **performance** — VMG, polar speed, tack angle
12. **notifications** — alarms, alerts, thresholds

All values use SI units. The schema is JSON-based with predictable paths (e.g., `vessels.self.navigation.position`, `vessels.self.electrical.batteries.house`).

### Overlap with Above Deck

| Domain | NMEA 0183/2000 | SignalK | Matter | Above Deck Plan |
|--------|---------------|---------|--------|----------------|
| Navigation (GPS, heading, depth) | Yes | Yes | No | NMEA direct |
| Wind/weather instruments | Yes | Yes | No | NMEA direct |
| Engine/propulsion | Yes | Yes | No | NMEA direct |
| Tanks (fuel, water) | Yes | Yes | No | NMEA direct |
| **Electrical (batteries, solar)** | Partial (N2K) | Yes | **Yes (v1.4+)** | Victron + Matter |
| **Lighting** | No | Yes (CZone) | **Yes** | Matter |
| **Climate/HVAC** | No | Limited | **Yes** | Matter |
| **Environmental sensors** | No | Yes | **Yes** | Matter |
| **Security (motion, cameras)** | No | No | **Yes (v1.5)** | Matter |

The key distinction: SignalK is a marine data model + server (Node.js). It defines the schema and provides the runtime. Above Deck owns its own data model and Go server — SignalK is an optional compatibility adapter. Matter is a device interoperability protocol — it defines how devices communicate, not a vessel data model. They do not compete. NMEA owns navigation/propulsion. Matter owns the smart-home layer. The overlap in electrical/environmental is where Above Deck draws from both.

### Adapter Strategy

Above Deck relates to SignalK in two ways:

1. **Inbound adapter** — consume SignalK's REST/WebSocket API as a data source. For sailors who already have a SignalK server, Above Deck reads from it rather than duplicating protocol parsing.
2. **Outbound compatibility** — expose Above Deck's data model in SignalK-compatible format so that existing SignalK clients and plugins can consume it.

SignalK is the natural integration hub for the existing open-source marine ecosystem. The `signalk-meshtastic` plugin, SensESP sensor framework, pypilot autopilot, and OpenPlotter distribution all speak SignalK. Above Deck's SignalK adapter is not optional — it is how you interoperate with this ecosystem.

---

## 6. MFD Platform Integrations

### The Walled Garden Problem

Every major MFD manufacturer controls their app ecosystem through partnerships or signing requirements. There is no "app store" where independent developers can freely publish marine tools. Above Deck's open-source, web-based approach fills this gap.

### Platform Architecture Comparison

| Platform | App Model | OS Foundation | Third-Party Dev | App Distribution |
|---|---|---|---|---|
| **Garmin** | HTML5 (OneHelm) | Proprietary | Partnership only | Pre-installed by partner |
| **Raymarine** | HTML5 + Android APK + Native SDK | Android (LightHouse) | Partnership + APK signing | Raymarine website download |
| **Navico** | Naviop middleware + CZone | Proprietary | Partnership only | Pre-installed |
| **Furuno** | HTML5 + config-file updates | Proprietary | Partnership only | Service menu config file |

### Garmin OneHelm

OneHelm is Garmin's integrated helm solution, launched in 2018. It uses a specialised web server running on the third-party device and a browser embedded in the Garmin MFD. The third-party manufacturer hosts an HTML5 interface that renders directly on the Garmin display. This is transparent to the user — they see what appears to be a native screen.

OneHelm partners include CZone, EmpirBus, Seakeeper, Lumishore, OctoPlex, and 10+ other brands. Connection is via Garmin Marine Network (Ethernet). Garmin does not offer a public SDK or app store — all integrations are partnership-based.

### Raymarine LightHouse

Raymarine is the most open platform, offering three integration paths:

1. **Native SDK integrations** — tightest integration, most development work
2. **HTML5 integrations** — similar to OneHelm, third party hosts a web server
3. **Android APK apps** — unique to Raymarine. Because Axiom MFDs run Android internally, third-party Android apps can be signed by Raymarine and installed directly

Raymarine's YachtSense ecosystem adds remote monitoring via 4G (YachtSense Link, USD 19.99/month) and digital switching (YachtSense Digital Control). Notably, Hefring Marine's IMAS (2026) is the first AI assistant on an MFD — running on LightHouse OS.

### Navico (Simrad / B&G / Lowrance)

Three brands sharing a core platform, with Naviop middleware handling 50+ communication protocols. CZone is the primary digital switching platform — captive within the Brunswick corporate family (Brunswick owns both Navico and Mastervolt/CZone). The platform is the most closed to independent developers.

### Furuno

Traditional approach with select HTML5 partnerships. Notable architectural advantage: new third-party apps can be added via configuration file from the service menu without requiring a firmware update.

### The Pattern That Matters

HTML5 is the universal integration layer. Garmin, Raymarine, and Furuno all use it for third-party app rendering. Above Deck's web-based tools (Astro/React) are already architecturally aligned — a tool running in an MFD's embedded browser is the same architecture as a tool running in a tablet browser.

### Digital Switching — CZone and EmpirBus

Digital switching replaces traditional circuit breaker panels with networked modules distributed throughout the vessel. All major systems use NMEA 2000 (CAN bus) as the network backbone.

| System | Owner | MFD Compatibility | Key Strength |
|---|---|---|---|
| **CZone** | Mastervolt / Brunswick | Garmin, Simrad, B&G, Lowrance, Raymarine, Furuno | Widest MFD compatibility; industry standard |
| **EmpirBus NXT** | EmpirBus (acquired by Garmin) | Raymarine (primary), Garmin | Deep Raymarine integration; web-based UI builder |
| **Naviop** | Navico / Brunswick | Simrad, B&G, Lowrance | 50+ protocol gateway; middleware approach |
| **OctoPlex** | Carling Technologies | Garmin (OneHelm) | AC/DC load control; redundant architecture |
| **YachtSense** | Raymarine | Raymarine only | Raymarine's own end-to-end solution |

CZone is the closest thing to a universal standard — it works with every major MFD brand. If Above Deck ever interfaces with digital switching, CZone/NMEA 2000 compatibility is the priority.

---

## 7. EmpirBus UI Builder — The Pattern for Custom Marine Dashboards

### How It Works

The EmpirBus Graphics Editor (`graphics.empirbus.com`) is a web-based UI builder that lets installers and boat builders design custom digital switching screens. These screens deploy to the EmpirBus WDU (Web Display Unit), which serves them as HTML5 to any compatible device.

**Architecture:**
- Web-based editor generates an HTML5 graphics package
- Package is uploaded to the WDU (a web server appliance)
- WDU serves the custom UI to MFDs, tablets, or any HTML5 browser
- WDU connects to EmpirBus NXT DCM modules via NMEA 2000 CAN bus
- Each DCM provides 16 configurable bi-directional I/O channels

**Editor capabilities:**
- Drag-and-drop canvas for placing interactive elements
- Supports PNG, JPG, SVG images
- Widget types: pulse buttons, momentary switches, rotary switches, dimmer controls, signal value displays
- 7 button states each (Off, On, Pressed, Error 1, Error 2, Error 1&2, Service unavailable) with custom images
- Live data binding to NMEA 2000 PGNs for real-time battery status, tank levels, circuit state
- Analog gauges: battery voltage, fluid levels, temperature
- Component reuse via cloud storage

**Vessel modes:** programmable configurations (Dock Away, Under Way, Anchor Aboard, etc.) that automatically set lighting, pump, and power states. Supports complex logic — toilet flushing sequences, wiper control with variable delays, pump timers, thermostat functions.

### The Above Deck Opportunity

EmpirBus solved the "custom boat dashboard" problem with three elements:

1. A web-based visual editor that non-developers can use
2. HTML5 output that runs on any screen
3. Live data binding to NMEA 2000

Above Deck could build a similar dashboard builder — a drag-and-drop tool where sailors design their own MFD screens, binding widgets to data from the Above Deck data model (which aggregates NMEA, Victron, Matter, and sensor data). The differences:

- **Open source** — not locked to EmpirBus hardware
- **Any data source** — NMEA, Victron, Matter, Meshtastic, not just EmpirBus DCMs
- **Any display** — runs on any browser, not just MFDs with HTML5 support
- **Community-shared** — sailors share dashboard layouts with each other

The key distinction from CZone: CZone's UI is per-platform (different for each MFD brand, rendered with Qt). EmpirBus's UI is HTML5 (runs on any browser). Above Deck aligns with the EmpirBus/HTML5 approach.

---

## 8. LoRa / Meshtastic — Long-Range Communication

### The Problem It Solves

Matter, Thread, and WiFi are all short-range technologies (10-50m). For a sailor at anchor who goes ashore to a restaurant, none of them reach. LoRa (Long Range) radio reaches 1-8+ kilometres — it is the technology that keeps you connected to your boat from shore without cellular or WiFi.

### How It Works

Meshtastic is an open-source mesh network built on LoRa radio. Devices form a self-healing mesh where messages hop between nodes. No infrastructure required — no cell towers, no internet, no subscriptions.

### Marine Use Cases

| Use Case | How It Works | Range |
|----------|-------------|-------|
| **Anchor drag alarm** | Boat node transmits GPS position. Shore node alerts if position drifts beyond threshold | 1-8+ km |
| **Bilge alarm** | SignalK alert transmitted to crew Meshtastic devices | 1-8+ km |
| **MOB beacon** | Crew wearable devices detected. Alert if signal lost | Line of sight |
| **Boat-to-boat messaging** | Text messages between vessels in an anchorage | 1-8+ km, further with mesh |
| **Shore monitoring** | Wind speed, temperature, battery voltage, position history from shore | 1-8+ km |
| **Marina mesh** | Multiple boats create a mesh network across an anchorage or marina | Extends range via hopping |

### Hardware

- **Boat node:** Heltec V3.2 (~USD 20-30), powered from 12V, connected to the boat's WiFi
- **Crew node:** SenseCAP T1000-e (~USD 40), waterproof, GPS-enabled, wearable
- **Solar buoy nodes:** DIY solar-powered Meshtastic relays for permanent anchorage coverage

### Existing Integration

The `signalk-meshtastic` plugin already exists, transmitting vessel telemetry (position, wind, temp, battery) over Meshtastic, sending SignalK alerts (bilge, anchor drag, MOB) to crew devices, and showing position history for anchor swing pattern analysis.

### Above Deck Fit

This is a strong candidate for a Go protocol adapter. Integration paths:
- Serial connection to a Meshtastic device on the boat
- The Meshtastic HTTP/BLE API
- A dedicated Go Meshtastic library (the protocol is well-documented)

Key scenarios: anchor watch alerts to crew ashore, boat monitoring (battery, bilge, cabin temp) without returning to the boat, fleet communication during cruising rallies, and emergency backup when all other communication fails.

---

## 9. Victron Integration

### The De Facto Standard

Victron Energy has achieved a dominant position among cruising sailors for power management. Their combination of product quality, open data protocols, and active community makes them the closest thing to a standard in marine electrical systems.

**Typical Victron setup on a cruising sailboat:**

| Component | Product | Approx. Cost | Function |
|-----------|---------|-------------|----------|
| Solar charge controller | SmartSolar MPPT 100/30 or 150/35 | USD 150-300 | Manages solar panel charging |
| Battery monitor | SmartShunt 500A | USD 100-150 | Tracks state of charge, current, voltage |
| Inverter/charger | MultiPlus 12/3000/120 | USD 1,200-2,000 | AC power from batteries, shore power charging |
| System hub | Cerbo GX | USD 350-450 | Central monitoring, VRM cloud, MQTT, SignalK |
| Display (optional) | GX Touch 50 or 70 | USD 250-400 | Touchscreen for Cerbo GX |
| DC-DC charger | Orion-Tr Smart 12/12-30 | USD 150-200 | Alternator-to-battery charging |

### Victron Protocols

| Protocol | Transport | Usage |
|----------|-----------|-------|
| VE.Direct | Serial 19200 baud | Direct device connection (charge controllers, shunts) |
| MQTT | TCP via Cerbo GX / Venus OS | Primary integration path |
| Modbus TCP | TCP 502 | Industrial integration |
| BLE | Bluetooth | VictronConnect app, SmartSolar/SmartShunt direct |
| NMEA 2000 | CAN bus | Marine instruments |

### No Matter Support — The Bridge Opportunity

Victron does not support Matter. There is no announcement or community discussion suggesting it is planned. This creates a bridge opportunity for Above Deck.

The Go server already reads Victron via MQTT/VE.Direct/Modbus (as planned). It could expose Victron data as Matter devices:

- Battery state of charge → Matter Battery cluster
- Solar production → Matter Solar device type
- Inverter state → Matter On/Off + Electrical Measurement

This means sailors could monitor Victron systems from Apple Home or Google Home while docked — something nobody else offers. Above Deck becomes the missing bridge between marine electrical systems and the consumer IoT world.

### Data Model Mapping

| Matter Cluster | Above Deck Data Path | Source |
|---------------|---------------------|--------|
| Temperature Measurement | `environment.cabin.temperature` | Matter sensor |
| Relative Humidity | `environment.cabin.humidity` | Matter sensor |
| On/Off (contact sensor) | `environment.bilge.aft.flood` | Matter contact sensor |
| Electrical Measurement | `electrical.solar.production` | Matter solar device / Victron bridge |
| Power Source (battery) | `electrical.batteries.house.stateOfCharge` | Matter battery / Victron bridge |

---

## 10. Web Browser Hardware APIs

### The Zero-Install Path

Modern browser APIs can talk directly to hardware — potentially eliminating the need for the Go server in simple setups. This is Above Deck's most extreme expression of "tools work alone."

### Available APIs

| API | What It Does | Browser Support | Marine Use |
|-----|-------------|-----------------|------------|
| **Web Serial** | Read/write serial ports from JavaScript | Chrome, Edge (not Firefox/Safari) | NMEA 0183 via USB-serial adapter |
| **Web Bluetooth** | Connect to BLE GATT devices from the browser | Chrome, Edge (partial Safari) | Victron BLE, Ruuvi sensors, BLE wind instruments |
| **Web USB** | Direct USB device access | Chrome, Edge (not Firefox/Safari) | USB instruments, CAN adapters |

### Web Serial + NMEA 0183

A sailor with a phone or tablet running the Above Deck PWA, a USB OTG cable, and a USB-to-RS422 adapter (~USD 15) could read NMEA 0183 data directly in the browser. No server needed. The PWA parses NMEA sentences in JavaScript and displays instrument data.

```
┌──────────────┐    USB OTG    ┌──────────────┐    RS-422    ┌──────────────┐
│  iPad/Phone  │──────────────▶│  USB-RS422   │────────────▶│ NMEA 0183    │
│  PWA Browser │◀──────────────│  Adapter     │◀────────────│ Instruments  │
│  Web Serial  │               │  (~USD 15)      │             │              │
└──────────────┘               └──────────────┘             └──────────────┘
```

### Web Bluetooth + Victron BLE

Victron's SmartSolar, SmartShunt, and similar devices broadcast data over BLE. Web Bluetooth could read battery state, solar production, and charge state directly in the browser — without a server.

### Limitations

- **No Firefox or Safari support** for Web Serial/USB — no iOS Safari. iPads need a Chromium-based browser
- **No CAN bus** (NMEA 2000) via web APIs — CAN requires kernel-level SocketCAN, needs the Go server
- **Permission model** — user must grant access each time
- **No background processing** — browser must be in foreground to maintain connection

### Progressive Enhancement Strategy

Web APIs are an enhancement, not a replacement for the Go server:

- **Standalone mode:** Sailor with a phone and a USB adapter gets basic NMEA 0183 instruments. No Pi, no server, no Docker. Zero hardware investment beyond a USD 15 adapter.
- **Enhanced mode:** Go server handles NMEA 2000, Victron, Matter, Meshtastic, persistent logging, AI. The PWA gets data from the server instead.
- **Hybrid:** Web Bluetooth reads nearby Victron devices directly. The server handles everything else.

This dramatically lowers the barrier to entry. A sailor can try Above Deck with zero infrastructure — just open the PWA and plug in a USB cable.

---

## 11. Recommended Hardware Architecture

### The Full Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    Display Layer                             │
│                                                             │
│  ┌──────────┐    ┌──────────┐   ┌────────┐  ┌───────────┐ │
│  │ Helm iPad│    │ Nav iPad │   │ Phone  │  │ MFD HTML5 │ │
│  │ (PWA)    │    │ (PWA)    │   │ (PWA)  │  │ (Browser) │ │
│  └────┬─────┘    └────┬─────┘   └───┬────┘  └─────┬─────┘ │
│       │               │             │              │        │
│       └───────────┬───┘─────────────┘──────────────┘        │
│                   │  WiFi                                   │
│          ┌────────┴──────────────┐                          │
│          │ Raspberry Pi 5        │                          │
│          │ + PICAN-M HAT         │                          │
│          │ Above Deck Go Server  │                          │
│          │ (Docker)              │                          │
│          │                       │                          │
│          │ Adapters:             │                          │
│          │  - NMEA 0183/2000     │                          │
│          │  - Victron            │                          │
│          │  - Matter Controller  │                          │
│          │  - Meshtastic         │                          │
│          │  - SignalK            │                          │
│          │                       │                          │
│          │ Services:             │                          │
│          │  - MCP Server (AI)    │                          │
│          │  - Matter Bridge      │                          │
│          │  - Data logging       │                          │
│          └──────┬───┬───┬───┬───┘                          │
│                 │   │   │   │                               │
│    ┌────────────┘   │   │   └────────────┐                 │
│    │                │   │                │                  │
│    ▼                ▼   ▼                ▼                  │
│ ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌───────────────┐ │
│ │NMEA 2000 │ │ Victron  │ │ Thread    │ │ Meshtastic    │ │
│ │Bus       │ │ Cerbo GX │ │ Mesh      │ │ Node          │ │
│ │(CAN bus) │ │ (MQTT)   │ │ (Matter   │ │ (LoRa)        │ │
│ │          │ │          │ │  sensors) │ │               │ │
│ │GPS, wind,│ │Solar,    │ │Temp,      │ │Anchor alarm,  │ │
│ │depth,    │ │battery,  │ │humidity,  │ │shore monitor, │ │
│ │heading,  │ │inverter  │ │contact,   │ │boat-to-boat   │ │
│ │AIS       │ │          │ │lighting   │ │               │ │
│ └──────────┘ └──────────┘ └───────────┘ └───────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Optional: ESP32-C6 NMEA WiFi Gateway                  │ │
│  │ (For boats where Pi can't be near instruments)         │ │
│  │ Doubles as Thread Border Router                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Optional: Starlink / Cellular                          │ │
│  │ (Bandwidth-aware sync, remote access, weather data)    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Recommended Reference Hardware Kit

| Component | Product | Approx. Cost | Role |
|-----------|---------|-------------|------|
| Server | Raspberry Pi 5 (4GB) | USD 60 | Runs Above Deck Go server in Docker |
| Marine HAT | PICAN-M | USD 99 | NMEA 0183 + NMEA 2000 + 12V power |
| Enclosure | Waterproof ABS project box | USD 20-30 | Protection |
| NMEA WiFi bridge (optional) | ESP32-C6 + CAN transceiver | USD 15 | Wireless NMEA for remote instruments |
| Thread border router (optional) | ESP32-C6 | USD 5 | Matter sensor mesh |
| Shore monitor (optional) | Heltec V3.2 Meshtastic | USD 25 | Anchor alarm, boat monitoring from shore |
| Crew wearable (optional) | SenseCAP T1000-e | USD 40 | MOB, personal alerts |
| **Core total** | | **~USD 180-190** | |
| **Full kit total** | | **~USD 265** | |

### Deployment Tiers

**Tier 0 — Zero Install:**
Phone/tablet + Above Deck PWA + USB OTG cable + RS422 adapter (USD 15). Web Serial reads NMEA 0183 directly. No server, no Pi, no Docker.

**Tier 1 — Standalone Server:**
Raspberry Pi 5 + PICAN-M HAT (~USD 160). Direct NMEA 0183/2000 access. WiFi serves the PWA to all tablets on the boat. Victron integration via USB (VE.Direct) or WiFi (Cerbo MQTT).

**Tier 2 — Full Platform:**
Tier 1 + Matter sensors (off-the-shelf) + Meshtastic shore monitoring + ESP32 wireless bridges. Multiple iPads showing different MFD screens at helm, nav station, and salon.

**Tier 3 — Premium Turnkey:**
HALPI2 ruggedised unit (~USD 300+) replaces the Pi + HAT + enclosure. Everything else the same.

### Technology Priority Matrix

| Technology | Priority | When | Why |
|-----------|----------|------|-----|
| **iPad PWA deployment** | Now | Already possible | Tools already render in MFD frame |
| **Web Serial (NMEA 0183)** | High | With chartplotter | Zero-install instrument data |
| **Web Bluetooth (Victron)** | High | With energy tools | Read solar/battery directly in browser |
| **Raspberry Pi + PICAN-M** | High | With platform layer | The recommended deployment hardware |
| **ESP32 NMEA gateway** | High | With platform layer | Wireless NMEA bridge. Proven, cheap |
| **Matter/Thread** | Medium | With boat management | Consumer sensors for cabin/bilge/lighting |
| **Meshtastic/LoRa** | Medium | With anchor watch | Anchor alarm from shore. Killer feature for cruisers |
| **Starlink integration** | Low | With passage planner | Bandwidth-aware sync, Starlink status adapter |
| **ESP32-C6 Thread BR** | Low | After Matter controller | Thread border router for Matter sensor mesh |

---

## Sources

### Marine Protocols and Hardware
- [PICAN-M HAT — Copperhill Tech](https://copperhilltech.com/pican-m-nmea-0183-nmea-2000-hat-for-raspberry-pi/)
- [MacArthur HAT — Wegmatt](https://shop.wegmatt.com/products/openmarine-macarthur-hat)
- [HALPI2 Ruggedised Pi — Hackaday](https://hackaday.com/2025/09/20/a-ruggedized-raspberry-pi-for-sailors/)
- [NMEA 2000 Powered Raspberry Pi — Seabits](https://seabits.com/nmea-2000-powered-raspberry-pi/)
- [ESP32 NMEA 2000 Gateway — open-boat-projects](https://open-boat-projects.org/en/nmea2000-and-esp32/)
- [esp32-nmea2000 — GitHub](https://github.com/wellenvogel/esp32-nmea2000)
- [SensESP — HatLabs](https://signalk.org/SensESP/)
- [NMEA 2000 Explained — CSS Electronics](https://www.csselectronics.com/pages/nmea-2000-n2k-intro-tutorial)

### Matter and IoT
- [Matter Protocol — CSA-IOT](https://csa-iot.org/all-solutions/matter/)
- [Matter 2026 Status Review](https://matter-smarthome.de/en/development/the-matter-standard-in-2026-a-status-review/)
- [Matter Specification Documents](https://handbook.buildwithmatter.com/specification/)
- [gomat — Go Matter Library](https://github.com/tom-code/gomat)
- [connectedhomeip — Official Matter SDK](https://github.com/project-chip/connectedhomeip)
- [ESP Thread Border Router](https://openthread.io/guides/border-router/espressif-esp32)
- [Arduino Matter Discovery Bundle](https://blog.arduino.cc/2026/02/25/the-new-arduino-matter-discovery-bundle-is-everything-you-need-to-learn-experiment-and-build-with-matter/)

### MFD Platforms
- [Panbo: Garmin OneHelm HTML5](https://panbo.com/garmin-onehelm-html5-1-lumishore-seakeeper-and-shadow-caster/)
- [Panbo: Digital Switching across platforms](https://panbo.com/digital-switching-raymarine-empirbus-simrad-naviops-offshore-octoplex-garmin-and-czone/)
- [Raymarine: LightHouse Apps](https://www.raymarine.com/en-us/our-products/digital-boating/lighthouse-apps)
- [Raymarine: YachtSense Ecosystem](https://www.raymarine.com/en-us/our-products/digital-boating/yachtsense-ecosystem)
- [EmpirBus Graphics Editor — Quickstart Guide](https://manuals.plus/m/b284e88d91c7a77f03e13de58bd572a6ed09f8482c2ae3b53570ddc3aa9d993b.pdf)

### LoRa and Meshtastic
- [SignalK + Meshtastic Integration](https://signalk.org/2025/signalk-meshtastic/)
- [signalk-meshtastic Plugin — GitHub](https://github.com/meri-imperiumi/signalk-meshtastic)
- [Off-Grid Boat Communications — NoForeignLand](https://blog.noforeignland.com/off-grid-boat-communications-with-meshtastic/)
- [LoRa Boat Monitor — open-boat-projects](https://open-boat-projects.org/en/lora-bootsmonitor/)

### Victron
- [Victron Data Communication (PDF)](https://www.victronenergy.com/upload/documents/Technical-Information-Data-communication-with-Victron-Energy-products_EN.pdf)
- [Victron BLE — Home Assistant](https://www.home-assistant.io/integrations/victron_ble/)
- [Victron Energy — Sailing Yacht Solutions](https://www.victronenergy.com/markets/marine/sailing-yacht)

### SignalK and Open Source Marine
- [Signal K Overview](https://signalk.org/overview/)
- [Signal K Data Model](https://signalk.org/specification/1.7.0/doc/data_model.html)
- [OpenPlotter — OpenMarine](https://openmarine.net/openplotter)
- [Bareboat Necessities OS](https://bareboat-necessities.github.io/my-bareboat/)
- [open-boat-projects.org](https://open-boat-projects.org/en/)

### Web APIs
- [Web Serial API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API)
- [Web Serial Guide — Chrome Developers](https://developer.chrome.com/docs/capabilities/serial)
- [NMEA 0183 JavaScript Parser](https://github.com/101100/nmea-simple)

### Sailor Hardware Landscape
- [Cruising Sailboat Electronics Setup with Signal K — Henri Bergius](https://bergie.iki.fi/blog/signalk-boat-iot/)
- [Budgeting for Electronics — Cruising World](https://www.cruisingworld.com/budgeting-for-electronics/)
- [Chartplotter vs iPad — Improve Sailing](https://improvesailing.com/navigation/chartplotter/tablet)
- [Autopilot Buyer's Guide — Attainable Adventure Cruising](https://www.morganscloud.com/2023/03/26/autopilot-buyers-guide/)
# Part 4: Product Vision, Design, and Strategy

**Date:** 2026-03-20
**Status:** Compiled from product vision, design research, solar energy research, apps/GitHub survey, and marine OS deep dive

---

## 1. Executive Summary

Above Deck is an open-source sailing platform structured in three layers — an open boat management platform, practical sailing tools, and learning/utility tools — designed to replace the fragmented 3-5 app experience that cruising sailors currently endure. The research confirms a clear market gap: no single product combines charting, monitoring, logbook, community, and AI. The open-source marine ecosystem (SignalK, OpenCPN, OpenPlotter, BBN OS) provides powerful building blocks but delivers a Frankenstein experience with no cohesive design language. Commercial platforms (Garmin, Raymarine, B&G) dominate hardware but frustrate users with lock-in and subscription creep. Above Deck's differentiation is architectural: a modern Go + React + Docker stack, a blueprint aesthetic designed for night-time cockpit use, an AI-native data model with MCP integration, and a build strategy that starts with standalone learning tools to attract users before delivering the full platform.

---

## 2. Product Vision

### The Three-Layer Architecture

Above Deck is structured as three concentric layers, each independently useful but dramatically better together:

**Layer 1 — Open Boat Management Platform.** A unified data model for all boat systems — instruments, power, tanks, engines — with direct hardware integration. Runs as a Docker container on any hardware (Raspberry Pi, NUC, old laptop, NAS). Connects to NMEA 0183/2000, Victron VE.Direct/MQTT/Modbus, CAN bus, AIS, and wireless sensors. Works 100% offline. This is the foundation that makes every tool smarter by providing real data from the boat's actual systems.

**Layer 2 — Sailing Tools.** Chartplotter, passage planner, weather routing, anchor watch, tidal planning, instrument dashboard, logbook. The things you use while actually sailing. These are the core product — practical tools that solve real problems for cruising sailors.

**Layer 3 — Learning & Utility Tools.** VHF radio simulator, solar/energy planner, exam prep, reference guides. Useful standalone tools that bring people to the platform and demonstrate design quality.

### Build Order: 3 -> 2 -> 1

The build order is deliberately inverted. Start with Layer 3 (learning and utility tools, already built: VHF simulator, solar planner), then Layer 2 (sailing tools, chartplotter next), then Layer 1 (the platform layer). But architect for the platform from the start. This approach delivers immediate value, attracts users early, and builds design credibility before tackling the hardest engineering problems.

### Core Principles

1. **Offline is first-class** — every tool must work without internet. The Docker deployment is the primary product, not an afterthought.
2. **Tools work alone** — anyone can use the chartplotter from a phone without installing anything. No forced sign-up, no paywall.
3. **Together is better** — connect tools to the platform and they get smarter. Real battery data improves the energy planner. Live position improves the chartplotter. AI reasons across everything.
4. **Own the data model** — our schema, our API, our identity. SignalK compatibility as an adapter, not a dependency.
5. **No Node on the backend** — Go for all server components. Single binary, no runtime dependencies.
6. **Plugin to us** — others extend our platform, we don't depend on theirs.
7. **Design matters** — blueprint aesthetic, MFD device frame, obsessive UX. Sailors deserve better than what exists.
8. **AI from day one** — not bolted on later. The platform is designed for AI to reason across all boat data.
9. **GPL, community-driven** — no commercial agenda. Built by sailors for sailors.

### Two Deployments

**Community Site (web)** — The public face. Identity and auth hub (Supabase, Google OAuth). Blog, knowledge base, community discussions, user profiles. Lightweight tools (solar planner, VHF trainer) available for casual use without installation. Exposes an API so content and community data can be consumed and integrated by the local platform and third parties.

**Platform (Docker)** — The product. Runs locally on the boat or at home. Go server connects to hardware, serves the MFD interface, runs the AI. Works 100% offline at sea. When internet is available, syncs with the community site for identity, community data, and cloud backup.

### Target Users

**Primary:** Coastal cruisers and bluewater sailors (monohull and catamaran). These sailors plan multi-day passages, need weather windows and tidal gates, often lose internet for days or weeks at sea, value community knowledge, currently cobble together 3-5 different apps, and many have Victron electrical systems with NMEA instruments and AIS transponders. Not for powerboats, charter tourists, or racing.

---

## 3. What Exists Today

| Tool | Status | Layer |
|------|--------|-------|
| VHF Radio Simulator | Built (feature branch) | Learning & Utility |
| Solar/Energy Planner | Built | Learning & Utility |
| MFD Device Frame | Built | Platform UI |
| Go API Server | Built (VHF backend) | Platform |
| Community Site | Built (blog, KB, discussions) | Community |
| Chartplotter | Researched | Sailing Tools |
| Boat Management | Vision defined | Platform |

The MFD device frame establishes the unified UI paradigm: every tool renders inside a marine display with TopBar (voltage, power, GPS, time) and NavBar. This ensures a consistent, immersive experience across all tools — like looking at a real marine multi-function display.

---

## 4. Tool Suite

### Sailing Tools (Layer 2)

| Tool | Description |
|------|-------------|
| **Chartplotter** | MapLibre GL JS + NOAA ENC (S-57) / OpenSeaMap charts, hazard overlay, AIS vessel tracking. Open-source alternative to Navionics and OpenCPN with modern web UX. |
| **Passage Planner** | Multi-day route planning with weather windows, tidal gates, crew watch schedules. Accounts for sailing angles (no other open-source tool does this). |
| **Weather Dashboard** | GRIB viewer, wind/wave forecasts, barometric trend. Uses Open-Meteo Marine API (free, global, no API key). |
| **Anchor Watch** | GPS drag alarm with depth monitoring. Safety-critical design: pre-recorded alerts bypass AI, 3-poll debounce prevents false alarms, alert escalation with ACK requirement. |
| **Instrument Dashboard** | Depth, wind, speed, heading displays — live from boat data via protocol adapters. |
| **Logbook** | Digital ship's log, auto-populated from instruments, legal-grade. The biggest confirmed gap across every source reviewed — no viable open-source marine logbook exists. |
| **Radar Overlay** | Render Navico/Furuno/Raymarine radar data on the chartplotter. Navico over Ethernet is most accessible; working open-source reference code exists. |
| **Sonar** | Future, pending open protocol access. Depth/temperature via NMEA 2000 transducers available now; full waterfall imagery requires vendor-specific reverse engineering. |

### Learning & Utility Tools (Layer 3)

| Tool | Description |
|------|-------------|
| **VHF Radio Simulator** | AI-powered radio practice for RYA/ASA exam prep. Built. |
| **Solar/Energy Planner** | Equipment sizing, consumption modelling, location-aware solar data. Built. |
| **Maintenance Log** | Engine hours, oil changes, rig checks, through-hull inspections. |
| **Provisioning Calculator** | Water/food/fuel planning for passages. |

### Platform (Layer 1)

| Component | Description |
|-----------|-------------|
| **Data Model** | Unified representation of all boat systems (navigation, electrical, loads, HVAC, propulsion, tanks, environment, steering, notifications). |
| **Protocol Adapters** | NMEA 0183, NMEA 2000, Victron VE.Direct/MQTT/Modbus, AIS, MQTT sensors, BLE, radar (Navico/Furuno/Raymarine). |
| **MCP Server** | AI bridge to all data — instruments, charts, weather, boat config, community data. |
| **Plugin System** | Screens, adapters, data model extensions, AI capabilities. |
| **SignalK Adapter** | Optional compatibility layer for interoperability with existing SignalK hardware and clients. |

---

## 5. Data Model

Above Deck defines its own data model — not SignalK. Full control over the schema, optimised for the tool suite and AI queries. A SignalK compatibility adapter is available as an optional plugin for interoperability.

The data model covers eight domains:

| Domain | Coverage |
|--------|----------|
| **Navigation** | Position, heading, speed, course, depth, wind |
| **Electrical** | Batteries, solar, chargers, inverters, alternators |
| **Loads** | Per-circuit state (on/off/dimming), current draw, fault detection. Covers lighting (cabin, navigation, anchor, courtesy, underwater), refrigeration, watermaker, windlass, thrusters, pumps, entertainment |
| **HVAC** | Air conditioning and heating: target/actual temperature, mode (cooling/heating/auto/off), fan speed |
| **Propulsion** | Engines, transmissions, fuel |
| **Tanks** | Fuel, water, holding, LPG |
| **Environment** | Temperature, humidity, pressure, sea state (cabin and exterior) |
| **Steering** | Rudder, autopilot |
| **Notifications** | Alarms, alerts, thresholds |

This integrates with CZone/Mastervolt digital switching (NMEA 2000 PGNs) for per-circuit monitoring and control on equipped boats. For boats without digital switching, ESP32 relay boards with current sensors provide a DIY path.

### Hardware Integration

Direct protocol support (no middleware dependencies):

| Protocol | Transport | Coverage |
|----------|-----------|----------|
| NMEA 0183 | Serial RS-422, 4800/38400 baud | GPS, depth, wind, heading, AIS — most marine instruments |
| NMEA 2000 | CAN bus (SocketCAN) | Modern instruments, engines, tanks, batteries |
| Victron VE.Direct | Serial 19200 baud | Solar controllers, battery monitors, inverters |
| Victron MQTT | TCP 1883 | All Victron devices via Cerbo GX / Venus OS |
| Victron Modbus TCP | TCP 502 | All Victron devices via Cerbo GX |
| AIS | NMEA 0183 (AIVDM/AIVDO) | Vessel tracking, Class A/B transponders |
| MQTT sensors | TCP 1883 | ESP32/DIY sensors, temperature, bilge, tanks |
| Bluetooth Low Energy | BLE GATT | Wireless sensors (Ruuvi tags, B&G wind, DIY ESP32) |
| Radar (Navico) | Ethernet | B&G/Simrad/Lowrance Halo and Broadband radar domes |
| Radar (Furuno) | Ethernet | DRS series radar scanners |
| Radar (Raymarine) | WiFi | Quantum series wireless radar |

---

## 6. AI Integration

An MCP server exposes the entire data model — instruments, charts, weather, boat config, community data — to AI. This enables cross-system queries no existing tool can answer:

- "Based on my current fuel level and the route to Scilly, do I need to motor?"
- "Given my solar setup and battery state, will I be able to run the watermaker before sunset?"
- "What's the best departure time considering tides, weather, and my need to charge batteries?"

### What Makes This Different

AI is built into the platform from day one, not bolted on. The research confirms this strategy:

- **SignalK recently added an MCP server** for AI integration, validating the approach.
- **d3kOS bolts AI onto specific features** (route analysis, port briefing, fuel prediction) using Gemini 2.5 Flash + Ollama. Above Deck designs for AI to reason across everything.
- **SeaLegs AI** is a new entrant offering AI-powered marine weather via developer API — interesting for integration.
- **Savvy Navvy, Orca, and PredictWind** all compete on AI routing, making it table stakes for new entrants.

The difference is architectural. d3kOS sends pre-formatted context to an LLM. Above Deck exposes structured data via MCP, letting any AI model reason directly over real boat state.

### AI Proactive Monitoring

Background analysers on intervals (pattern from d3kOS, improved):
- Route analysis and ETA refinement
- Port briefing triggered at 2nm approach
- Fuel/battery prediction based on consumption trends
- Weather change alerts
- Results pushed via SSE to the dashboard

---

## 7. Plugin Architecture

Others plugin to Above Deck's software, not the other way around. Plugins can:

- **Add new MFD screens (tools)** — third parties build custom displays
- **Add new protocol adapters (hardware support)** — connect new devices
- **Extend the data model (new paths/sensors)** — add data types not in the core schema
- **Add new AI capabilities (MCP tools)** — expose new data sources to AI

The plugin contract follows the SignalK pattern (studied but not copied): `start(config)`, `stop()`, JSON Schema for auto-generated config UI, clear lifecycle, typed interfaces. Implemented in Go, not Node.js.

### Design Patterns Informing the Architecture

| Pattern | Source | Application |
|---------|--------|-------------|
| Reactive dataflow graph | SensESP | Producer -> Transform -> Consumer for protocol adapters. Typed, composable, testable. |
| D-Bus-style service architecture | Victron Venus OS | Each protocol adapter as an independent service publishing to a shared bus. Above Deck uses MQTT or internal Go channels. |
| Plugin registration with auto-config | SignalK | JSON Schema generates config UI. Clear start/stop lifecycle. |
| Camera slot/hardware separation | d3kOS | Decouple logical positions from physical hardware. Positions are permanent, hardware is swappable. |

---

## 8. Visual Design System

### Blueprint Aesthetic

The design language is minimalist and draughtsman-like — think architectural blueprints, technical drawing precision. Clean lines, generous whitespace, no visual clutter. The UI should feel like a well-drawn schematic, not a SaaS marketing page. Dark mode is the default because sailors plan at night.

Research across 20+ premium platforms (Linear, Tailwind CSS, Raycast, Strava, Astro, Are.na, Monocle, Dribbble, Vercel, Arc) identified five impactful techniques:

### Colour Palette

| Role | Colour | Hex | Usage |
|------|--------|-----|-------|
| Background (dark) | Deep Navy | `#1a1a2e` | Primary background, dark mode default |
| Surface | Midnight Blue | `#16213e` | Cards, panels, elevated surfaces |
| Background (light) | Off-White | `#f5f5f0` | Light mode background (warm, not sterile) |
| Primary Text (dark) | Pale Grey | `#e0e0e0` | Body text on dark backgrounds |
| Primary Text (light) | Charcoal | `#2d2d3a` | Body text on light backgrounds |
| Secondary Text | Slate | `#8b8b9e` | Labels, captions, metadata |
| Accent — Positive | Sea Green | `#4ade80` | Solar generation, surplus, healthy status |
| Accent — Warning | Coral | `#f87171` | Consumption, deficit, attention needed |
| Accent — Neutral | Ocean Blue | `#60a5fa` | Links, interactive elements, focus states |
| Grid/Lines | Blueprint Grey | `#2d2d4a` | Chart gridlines, borders, dividers at low opacity |

### Typography (Google Fonts Only)

| Role | Font | Character |
|------|------|-----------|
| Headings | **Space Mono** | Monospace with character, draughtsman feel |
| Body | **Inter** | Clean, highly legible, excellent at small sizes |
| Code/specs | **Fira Code** | Monospace for technical data, specs, calculations |

### The Five Core Visual Techniques

**1. The Blueprint Grid — Ambient Background Texture.** A subtle repeating-linear-gradient grid pattern on the background that evokes nautical charts, architectural drawings, and instrument panels. Transforms a dark background from "empty" to "intentional." Directly inspired by Tailwind CSS's grid pattern technique with `bg-fixed`.

```css
body {
  background-color: #1a1a2e;
  background-image: repeating-linear-gradient(
    0deg,
    rgba(45, 45, 74, 0.15) 0,
    rgba(45, 45, 74, 0.15) 1px,
    transparent 0,
    transparent 40px
  ),
  repeating-linear-gradient(
    90deg,
    rgba(45, 45, 74, 0.15) 0,
    rgba(45, 45, 74, 0.15) 1px,
    transparent 0,
    transparent 40px
  );
  background-attachment: fixed;
}
```

**2. Opacity-Layered Text Hierarchy — The Cockpit Effect.** Instead of different colours for text hierarchy, use a single light colour (`#e0e0e0`) at different opacities. Primary text at 100%, secondary at 60%, tertiary at 35%. Creates depth like illuminated instrument readouts in a dark cockpit. Preserves dark adaptation better than high-contrast colour shifts. Directly from Linear's dark-mode approach.

```css
:root {
  --text-primary: rgba(224, 224, 224, 1);
  --text-secondary: rgba(224, 224, 224, 0.6);
  --text-tertiary: rgba(224, 224, 224, 0.35);
  --text-accent: rgba(74, 222, 128, 0.9);
}
```

**3. Hero Data Visualization — The Living Dashboard.** Instead of stock hero images, the hero section displays real community data as beautiful visualization. Live wind conditions, aggregated fleet positions on a stylized chart, or a real-time activity feed rendered as data sculpture. Strava proved that activity data can be more emotionally engaging than photos. iNaturalist proved that user-contributed scientific observations create intellectual depth.

**4. Community Content as Editorial Gallery — Not a Feed.** User-generated content displayed in a curated editorial layout rather than a chronological feed. Strict visual constraints on user content (enforced aspect ratios, consistent card dimensions, controlled typography) create gallery-quality presentation from any input. Cards use subtle inset rings and barely perceptible hover states.

```css
.community-card {
  background: #16213e;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  transition: border-color 200ms ease;
}
.community-card:hover {
  border-color: rgba(255, 255, 255, 0.12);
}
```

**5. Micro-Interaction Polish — The Things You Feel But Cannot Name.** Dark-mode flash prevention (inline script before CSS loads), barely perceptible card hover states, staggered entrance animations, full-viewport-width hairline dividers, accessible focus states, smooth scroll with reduced-motion respect, and optimised text rendering. The difference between "good" and "wow" is almost entirely in what you do NOT see.

### The Emotional Formula

The platforms that create a genuine "wow" moment share three qualities:

1. **Specificity of world** — they look like they could ONLY be for their specific community. The sailing hub should look like it could only exist for people who go to sea.
2. **Data as beauty** — wind roses, passage tracks, fleet positions, tidal curves rendered as beautiful, living visualizations on a dark chart-like background.
3. **Invisible quality** — no layout shifts, no font flashes, no janky scroll, no abrupt transitions. Every interaction responds smoothly. The dark mode is dark from the first pixel.

### Design Principles

- Dark mode is the default — sailors plan at night
- Blueprint aesthetic: fine lines, precise spacing, technical clarity
- No decorative elements — every visual element serves a function
- Progressive disclosure: simple surfaces that reveal depth on interaction
- Generous whitespace — let content breathe
- Card-based layouts with subtle borders, not heavy shadows
- Charts and schematics use the accent palette on dark backgrounds — like a backlit drafting table

### Summary: Platform Design Inspirations

| Platform | Standout Technique | Application |
|----------|-------------------|-------------|
| Linear | Opacity-based text hierarchy on dark backgrounds | Cockpit/instrument aesthetic |
| Tailwind CSS | Blueprint grid background pattern | Nautical chart feel |
| Raycast | WebGL hero with interactive 3D elements | Interactive wind/weather viz |
| Strava | Activity data as emotionally engaging hero content | Sailing logs, route maps |
| Astro | Semi-transparent gradient glows on dark backgrounds | Backlit drafting table feel |
| Are.na | Theme system with blend modes + mask gradients | Day watch / night watch themes |
| Monocle | Two-typeface editorial system (serif + sans) | Space Mono + Inter achieves similar |
| Dribbble | Enforced aspect ratios make UGC look curated | Standardize boat/passage photos |
| Vercel | Pre-hydration dark mode flash prevention | Essential for dark-first design |
| Arc | Warm accent colours against cool dark backgrounds | Sea Green/Coral against Deep Navy |
| Behance | Disciplined spacing token system | Consistent visual rhythm |
| Supabase | Animated logo/trust marquee | Scrolling community stats or fleet activity |

---

## 9. Solar/Energy Tools

### Current State

The solar/energy planner is built and operational. It represents the equipment-first approach: start with what the sailor has or needs, not a questionnaire.

### Research Insights

**The market gap is clear.** No existing tool combines energy audit + location-aware solar data + battery chemistry comparison + route-based seasonal analysis. Each tool solves one piece:

| Existing Tool | What It Does Well | What It Misses |
|---------------|-------------------|----------------|
| Victron MPPT Calculator | Controller sizing with real panel database | No energy audit, no location-based data |
| Explorist.life | Progressive disclosure (Easy/Exact modes) | RV-focused, no location data, no load calculation |
| BatteryStuff | Most comprehensive end-to-end calculation | Worst UX, no visual output, DC-only |
| Renogy Super Solar | Drag-and-drop appliance selection | Brand-locked, RV-focused |
| Custom Marine Products | Marine-specific | Relies on external PDF/spreadsheet |

### Key Gaps Across All Existing Tools

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

### What Above Deck's Solar Tools Deliver

**Two connected tools:**

1. **Solar System Sizer ("What do I need?")** — User selects appliances from categorized catalog, system calculates daily energy budget, user selects location on map, system fetches solar irradiance data (PVGIS API), system recommends panel wattage + battery bank + charge controller. Visual energy balance shows 24-hour generation vs. consumption. Three size options: minimum / recommended / comfortable.

2. **Solar Generation Calculator ("What will I produce?")** — User enters existing panel specs, selects mounting type and shading conditions, picks location on map, system fetches irradiance and applies derating factors, shows hourly/daily/monthly generation estimates.

### UX Strategy

**Equipment-first, not questionnaire-first.** Present categorized appliance cards (not dropdowns). Each card shows icon, name, typical wattage, and a toggle to add. Tap to add — appears in "My Boat" list with editable defaults.

**Progressive disclosure:**
- Level 1 "Quick estimate" — pick boat size and cruising style, pre-populate typical loads
- Level 2 "Customize" — adjust individual appliances, hours, quantities
- Level 3 "Expert" — enter exact amp draws, duty cycles, seasonal variations

**Mode-based loads (sailing-specific):**
- At anchor — fridge, lights, entertainment, fans, charging
- Day sailing — add instruments, autopilot, VHF
- Passage making — add radar, AIS, SSB, watermaker, running lights 24/7

**Real-time results** — no "Calculate" button. Results update within 100ms of input change. Colour transitions: green to yellow to red as system approaches limits.

### Data Strategy

**Primary source: PVGIS API (v5.3)** — Free, no API key needed, global coverage, monthly resolution, JSON output. Secondary: NASA POWER for cross-referencing. Fallback: NREL PVWatts for US-specific high-resolution data.

### Appliance Database

A comprehensive marine-specific appliance database covers ~50 devices across seven categories (navigation electronics, communication, refrigeration, lighting, water systems, comfort/galley, charging/electronics, sailing/mechanical, safety), each with typical wattage, amps at 12V, and separate hours/day for passage and anchor modes. This database is the core differentiator — no other calculator has sailing-specific data at this granularity.

**Typical daily consumption profiles:**

| Cruising Style | Daily Ah @12V | Daily Wh |
|----------------|--------------|----------|
| Minimal (weekend sailor) | 30-60 | 360-720 |
| Moderate (coastal cruiser) | 80-150 | 960-1,800 |
| Comfort cruiser | 150-250 | 1,800-3,000 |
| High-tech liveaboard | 250-400 | 3,000-4,800 |
| Passage making | 200-350 | 2,400-4,200 |

### The Unique Value Proposition

Solar sizing is inherently a multi-location problem for sailors. Unlike a house, a boat moves. A calculator that shows "your system works great in the Caribbean but you'll have a 40% deficit in the UK in December" is uniquely valuable and does not exist anywhere else.

---

## 10. What Differentiates Above Deck

### 1. Integrated Ecosystem

Tools that work independently but are dramatically better together. The chartplotter knows your battery level. The passage planner factors in your solar capacity. The AI reasons across everything. Like Apple's ecosystem — seamless, coherent, greater than the sum of parts.

### 2. Design-First

Blueprint aesthetic, MFD device frame, obsessive attention to UX. Every tool renders inside a unified marine display. Sailors deserve beautiful software — not wxWidgets from 2005 (OpenCPN), not vanilla JS with global state (d3kOS), not Frankenstein integrations of 15 tools (BBN OS/OpenPlotter).

### 3. Open Source (GPL)

Community-owned. No vendor lock-in, no subscription traps, no paywalled tides. Transparent development. Community-driven roadmap. Victron proves open-source does not destroy commercial viability — it builds loyalty.

### 4. Modern Architecture

Go + React + Docker. Not a desktop app ported to mobile. Not a monolithic C++ binary. Not 22+ Python processes competing for Pi resources. Clean, modern, deployable anywhere. Single Docker image runs the entire platform.

| Layer | Above Deck | d3kOS | OpenCPN | SignalK |
|-------|-----------|-------|---------|--------|
| Backend | Go | Flask (Python) | C/C++ | TypeScript/Node.js |
| Frontend | Astro 5 + React 19 | Vanilla JS + Jinja2 | wxWidgets | None (admin only) |
| Deployment | Docker | SD card image | Desktop installer | npm |
| Testing | Vitest + Playwright (TDD) | Bash scripts | Manual | Some unit tests |
| Type Safety | TypeScript + Go | None | C++ (partial) | TypeScript |
| Auth | Supabase Auth | None | None | JWT + OIDC |

### 5. AI-Native

Intelligence built into the platform from day one. MCP server bridges AI to every data source. Not a chatbot bolted onto a map — a platform where AI understands your boat, your route, and your systems.

---

## 11. Community Strategy

### Content-First Approach

The community site serves as the identity hub and the front door. Blog, knowledge base, community discussions, user profiles. Lightweight tools (solar planner, VHF trainer) available for casual use without installation.

### Community Data Integration (Decision TBD)

Options under consideration before building community features:

- **Tightly integrated** — anchorage reviews on the chartplotter, hazard reports on the map, discussions attached to locations
- **Loosely coupled** — community site provides data via API, platform consumes it
- **Hybrid** — some features integrated (reviews, hazards), some separate (blog, KB, discussions)

### Content as Editorial Gallery

Community content presented in a curated editorial layout rather than a chronological feed. Enforced aspect ratios on imagery, consistent card dimensions, controlled typography. Think magazine spreads, not social media timelines. Inspired by Dribbble, Behance, Letterboxd, and Monocle.

### Distribution Channels

Research confirms these channels matter most for reaching cruising sailors:

| Channel | Effectiveness |
|---------|--------------|
| Word of mouth / dock talk | Very High |
| YouTube (SV Delos, La Vagabonde) | High |
| App Store organic search | High |
| Boat shows (Annapolis, METS, Southampton) | Medium-High |
| Sailing media (Practical Sailor, Yachting Monthly) | Medium |
| Facebook sailing groups | Medium |
| Sailing schools (RYA, ASA) | Medium |
| Reddit (r/sailing 250K+) | Medium |

---

## 12. Open-Source Ecosystem

### Must-Study Projects

These open-source projects represent the most relevant building blocks and reference implementations worth monitoring:

#### Tier 1: Major Projects

| Project | Stars | Language | Relevance |
|---------|-------|----------|-----------|
| OpenCPN/OpenCPN | 1,356 | C | Gold standard open-source chartplotter. Weather routing plugin implements isochrone algorithms. Plugin architecture worth studying. |
| cambecc/earth | 6,512 | JavaScript | Beautiful global weather visualization using GRIB data on WebGL globe. Industry-standard wind particle animation. |
| gpxstudio/gpx.studio | 920 | SvelteKit | Full-featured online GPX editor. Excellent reference for web-based route editor UX. |
| sakitam-fdd/wind-layer | 686 | TypeScript | Drop-in wind visualization for MapLibre GL. Could be used directly for weather overlays. |
| SignalK/signalk-server | 381 | TypeScript | Universal marine data exchange. De facto standard. 410+ plugins. Recently added MCP server for AI. |
| bareboat-necessities/lysmarine_gen | 311 | Shell | Free boat computer OS integrating SignalK + OpenCPN + PyPilot + Freeboard. Reference for the assembled open-source marine ecosystem. |
| pypilot/pypilot | 266 | Python | Only viable open-source sailboat autopilot. SignalK integration. Integrate, don't compete. |

#### Tier 2: Directly Relevant

| Project | Stars | Language | Relevance |
|---------|-------|----------|-----------|
| jieter/orc-data | 96 | Svelte | Boat polar/VPP data in web format. Data source for boat polars. |
| OpenSeaMap/online_chart | 77 | PHP | OpenSeaMap tile integration reference. Tile URL: `tiles.openseamap.org/seamark/{z}/{x}/{y}.png`. |
| dakk/gweatherrouting | 73 | Python | Open-source sailing routing with isochrone algorithm. Study for TS port. |
| SignalK/freeboard-sk | 54 | TypeScript | Full web chart plotter in TypeScript/Angular. Route/waypoint management UI reference. |
| xbgmsharp/postgsail | 42 | PLpgSQL | Automatic trip logging with PostGIS. Database schema reference for sailing trips, moorages, anchorages. |
| dakk/libweatherrouting | 37 | Python | Pure Python weather routing library. Core isochrone algorithm to study and port. |
| openwatersio/neaps | 25 | TypeScript | Tide prediction engine using harmonic constituents. MIT. Directly integrable. |

#### Tier 3: Utility Libraries

| Project | Stars | Language | Relevance |
|---------|-------|----------|-----------|
| cambecc/grib2json | 385 | Java | GRIB2 to JSON conversion for weather data pipeline. |
| blaylockbk/Herbie | 710 | Python | Download NWP datasets (GFS, HRRR, IFS). Backend weather acquisition. |
| ryan-lang/tides | 4 | Go | Tide prediction using harmonic constituents in Go. |
| 101100/nmea-simple | 31 | TypeScript | TypeScript NMEA 0183 parser. |

### Must-Know Apps

| App | Why It Matters |
|-----|----------------|
| **Noforeignland** | Free crowd-sourced cruising community with anchorage/marina reviews, clearance info, GPS tracker. Direct competitor for community features. |
| **SeaLegs AI** | AI-powered marine weather with developer API. New entrant worth monitoring. |
| **Deckee** | 1M+ users with community-driven hazard/safety data. Proves community data scales. |
| **Wavve Boating** | Growing nav app customizing charts to vessel draft and water levels. |
| **SailRouting.com** | Quick web-based weather routing using Copernicus data. No app install needed. |

### External APIs & Services

| Service | Use Case |
|---------|----------|
| AISStream (aisstream.io) | Free WebSocket API for global AIS data streaming |
| SeaLegs AI API | AI-powered marine weather forecasts |
| OpenSeaMap tiles | Free seamark overlay tiles |
| Open-Meteo Marine API | Free, global weather, no API key |
| PVGIS API | Free solar irradiance data, global coverage |

---

## 13. Build Sequence

### Phase 1: Learning & Utility Tools (Current)

**Status: In progress.** VHF simulator and solar planner are built. Community site operational with blog, knowledge base, and discussions.

**Rationale:** These tools bring people to the platform, demonstrate design quality, and validate the tech stack without requiring hardware integration.

### Phase 2: Chartplotter (Next)

The chartplotter is the flagship sailing tool. MapLibre GL JS + NOAA ENC (S-57) + OpenSeaMap charts. AIS overlay, hazard layer, waypoint/route management.

**Rationale:** This is the most used tool category (every sailor needs charts) and the most visible demonstration of Above Deck's design-first philosophy vs. the dated UX of OpenCPN and the fragmented web options.

**Key technology decisions:**
- MapLibre GL JS (open source, BSD, self-hostable, no vendor lock-in)
- NOAA ENC charts (free, S-57 format)
- OpenSeaMap seamark overlay (free tiles)
- AIS via aisstream.io WebSocket (browser) or NMEA/SignalK (on-boat)

### Phase 3: Core Sailing Tools

**Logbook** comes first (confirmed biggest gap across all sources), followed by anchor watch, instrument dashboard, and passage planner.

**Rationale:** The logbook has no viable open-source competitor. It auto-populates from instruments when connected to the platform, serves as the first tool that demonstrates Layer 1 + Layer 2 integration, and satisfies a legal requirement for many sailors.

### Phase 4: Platform Layer

Go server with protocol adapters (Victron MQTT is the priority integration — many target sailors already have Victron). Docker deployment. MCP server for AI. Plugin system.

**Rationale:** The platform layer is the hardest engineering but benefits from all preceding work. By this point, the UI is proven, the tools are valuable standalone, and the community is established. Adding hardware integration makes everything dramatically better.

### Phase 5: Advanced Features

Weather routing (isochrone algorithm, reference: libweatherrouting), radar overlay, sailing-specific features (polars, laylines, VMG — the open-source B&G SailSteer equivalent), and deeper community integration.

### Technology Stack Summary

| Layer | Technology | Why |
|-------|-----------|-----|
| Backend | Go | Single binary, no runtime dependencies, excellent concurrency |
| Frontend | Astro 5 (SSR) + React 19 islands | Fast static pages + rich interactive tools |
| Mapping | MapLibre GL JS | Open source (BSD), self-hostable |
| Charts | NOAA ENC (S-57) + OpenSeaMap | Free, open data |
| Database | Supabase (PostgreSQL + PostGIS) | Auth, real-time, geospatial queries |
| Auth | Supabase Auth (Google OAuth, PKCE) | Community site identity hub |
| State | Zustand 5 (persisted) | Client-side state for tools |
| Weather | Open-Meteo Marine API | Free, global, no API key |
| AIS (remote) | aisstream.io WebSocket | Free tier for browser use |
| Deployment | Docker | Runs on any hardware |
| Testing | Vitest (unit), Playwright (e2e) | TDD workflow |
| Monorepo | pnpm workspaces | `packages/site/`, `packages/tools/`, `packages/shared/`, `packages/api/` |

### Competitive Position at Maturity

| Capability | Garmin | Raymarine | B&G | Savvy Navvy | Orca | OpenCPN | SignalK | d3kOS | **Above Deck** |
|-----------|--------|-----------|-----|-------------|------|---------|--------|-------|--------------|
| Charting | A | A | A | B+ | A | A | -- | C | **B+ (building)** |
| Mobile | B | C | C | A | A | F | -- | F | **A (planned)** |
| Offline | A | A | A | B | B+ | A | A | A | **A** |
| AI/Smart routing | C | C | C | A | A | C | C | B+ | **A (planned)** |
| Sailing features | C | B | A+ | B | B | B | -- | -- | **B+ (planned)** |
| Engine/power monitoring | A | A | A | -- | -- | -- | B+ | A | **A (planned)** |
| Community | A | -- | -- | -- | -- | -- | -- | -- | **B (building)** |
| Logbook | C | C | C | -- | -- | -- | D | C | **A (planned)** |
| Open source | F | F | F | F | F | A | A | -- | **A** |
| Modern UX | B | A | B+ | A | A+ | D | C | C+ | **A (target)** |
| Price | USD USD USD USD  | USD USD USD USD  | USD USD USD USD  | USD USD  | USD USD  | Free | Free | Free-USD  | **Free** |

---

# Appendix A: CAN Bus Technology

# CAN Bus Technology: From Automotive Origins to Marine, IoT, and Beyond

**Date:** 2026-03-20
**Status:** Research complete
**Related:** [Go Marine Ecosystem](./go-marine-ecosystem.md) | [Hardware Connectivity Technologies](./hardware-connectivity-technologies.md) | [Sailor Hardware Landscape](./sailor-hardware-landscape.md)

---

## Executive Summary

Controller Area Network (CAN bus) is the dominant embedded communications protocol across automotive, marine, industrial, agricultural, and aerospace domains. Originally developed by Bosch in 1983 for in-vehicle wiring reduction, CAN bus now connects billions of devices worldwide. For Above Deck, CAN bus is the foundational physical layer beneath NMEA 2000 — but mastering CAN bus opens doors far beyond marine. The same Go code that reads NMEA 2000 PGNs from a sailboat's instrument bus can read J1939 engine data, Victron battery telemetry, solar inverter status, and RV tank levels. A Go-native CAN bus library is infrastructure that makes Above Deck relevant to boats, campervans, off-grid cabins, and any 12V/24V system.

---

## 1. CAN Bus Fundamentals

### 1.1 History

| Year | Milestone |
|------|-----------|
| 1983 | Robert Bosch GmbH begins development. Engineers Siegfried Dais and Uwe Kiencke lead the project to address growing automotive wiring complexity |
| 1985 | Bosch files initial CAN patent |
| 1986 | CAN introduced at the SAE (Society of Automotive Engineers) congress in Detroit |
| 1987 | Intel (82526) and Philips (82C200) release the first CAN controller chips |
| 1991 | Mercedes-Benz W140 (S-Class) becomes the first production car with CAN bus |
| 1993 | CAN standardised as ISO 11898 |
| 2000 | NMEA 2000 standard published, bringing CAN bus to marine |
| 2003 | All vehicles sold in the US required to implement OBD-II over CAN (mandated by 2008) |
| 2012 | Bosch introduces CAN FD (Flexible Data-Rate) for higher bandwidth |
| 2015 | CAN FD standardised as ISO 11898-1:2015 |
| 2024 | CAN XL specification progressing — up to 2048-byte payloads at 20 Mbit/s |

### 1.2 Physical Layer

CAN bus uses a differential two-wire serial bus (CAN_H and CAN_L) in a **twisted pair** configuration. The bus operates in two states:

- **Dominant (logical 0):** CAN_H driven high (~3.5V), CAN_L driven low (~1.5V). Differential voltage ~2V.
- **Recessive (logical 1):** Both wires at ~2.5V. Differential voltage ~0V.

This dominant/recessive scheme is fundamental to CAN's arbitration mechanism — a dominant bit always overwrites a recessive bit on the bus.

**Termination:** The bus must be terminated at both physical ends with 120-ohm resistors between CAN_H and CAN_L. Without proper termination, signal reflections cause bit errors. A correctly terminated bus measures ~60 ohms between CAN_H and CAN_L (two 120-ohm resistors in parallel).

**Topology:** CAN uses a linear bus topology (backbone with drop cables). Star topologies are possible with specialised hubs but are not standard. Maximum bus length depends on bit rate — at 1 Mbit/s the bus is limited to ~25m; at 250 kbit/s (NMEA 2000 speed) it reaches ~250m.

### 1.3 Protocol Variants

| Specification | ID Bits | Max Data (bytes) | Max Bit Rate | Frame Overhead | Standard |
|---------------|---------|-------------------|--------------|----------------|----------|
| CAN 2.0A (Standard) | 11 | 8 | 1 Mbit/s | ~47 bits | ISO 11898-1 |
| CAN 2.0B (Extended) | 29 | 8 | 1 Mbit/s | ~67 bits | ISO 11898-1 |
| CAN FD | 11 or 29 | 64 | 8 Mbit/s (data phase) | Variable | ISO 11898-1:2015 |
| CAN XL | 11 or 29 | 2048 | 20 Mbit/s | Variable | In development |

**CAN 2.0A** uses an 11-bit identifier, allowing 2,048 unique message IDs. Sufficient for simple systems.

**CAN 2.0B** extends the identifier to 29 bits (18 additional bits), allowing over 500 million unique message IDs. NMEA 2000 and J1939 both use CAN 2.0B because they need the extended address space to encode priority, PGN, source address, and destination into the 29-bit ID.

**CAN FD** is backward-compatible at the arbitration level but switches to a higher bit rate during the data phase. The data payload jumps from 8 bytes to up to 64 bytes. This is particularly important for firmware-over-the-air updates and high-bandwidth sensor data. CAN FD nodes and classical CAN nodes cannot coexist on the same bus segment without a gateway.

### 1.4 How Arbitration Works

CAN uses **Carrier Sense Multiple Access with Collision Detection and Arbitration on Message Priority (CSMA/CD+AMP)**. It is non-destructive — no data is ever lost during arbitration.

1. Any node can begin transmitting when the bus is idle.
2. If two or more nodes start transmitting simultaneously, they perform bit-by-bit arbitration during the ID field.
3. Each transmitting node reads back the bus state after sending each bit. Because dominant (0) overwrites recessive (1), a node sending a recessive bit will read back a dominant bit if another node is sending dominant.
4. The node that detects a mismatch (sent recessive, read dominant) immediately stops transmitting and switches to listening mode.
5. The node with the **lowest numeric ID** wins arbitration because it has more dominant (0) bits in the high-order positions.
6. The winning node continues transmitting without interruption — zero bus time is wasted on collisions.

This means **lower ID = higher priority**. In NMEA 2000, critical navigation data (e.g., rudder position, rate of turn) is assigned low PGN numbers so it wins arbitration over less time-sensitive data (e.g., environmental temperature).

### 1.5 Frame Types

| Frame Type | Purpose |
|------------|---------|
| **Data Frame** | Carries 0-8 bytes of data (0-64 in CAN FD) |
| **Remote Frame** | Requests data from another node (rarely used in practice) |
| **Error Frame** | Signals a detected error; forces bus-wide retransmission |
| **Overload Frame** | Requests a delay between frames (rarely used) |

A standard CAN data frame structure:

```
SOF | Arbitration Field (ID + RTR) | Control | Data (0-8 bytes) | CRC | ACK | EOF
 1       12 or 32 bits               6 bits    0-64 bits          16    2     7
```

### 1.6 Error Handling

CAN has five error detection mechanisms built into the protocol:

1. **Bit monitoring** — transmitter reads back each bit
2. **Bit stuffing** — after 5 consecutive identical bits, a stuff bit of opposite polarity is inserted
3. **CRC check** — 15-bit CRC on every frame
4. **Frame check** — fixed-form bits verified
5. **ACK check** — at least one receiver must acknowledge

Nodes track error counters. A node that accumulates too many errors transitions from Error Active to Error Passive to Bus Off, effectively disconnecting itself — a faulty node cannot permanently disrupt the bus.

---

## 2. Who Uses CAN Bus

### 2.1 Automotive

CAN bus was born in cars, and cars remain the largest market. A modern vehicle typically has **3-5 separate CAN buses**:

| Bus | Typical Speed | Connects |
|-----|---------------|----------|
| Powertrain CAN | 500 kbit/s | Engine ECU, transmission, ABS, traction control |
| Body CAN | 125-250 kbit/s | Lighting, windows, locks, mirrors, climate |
| Infotainment CAN | 500 kbit/s | Head unit, speakers, Bluetooth module, cameras |
| ADAS CAN | 500 kbit/s - 2 Mbit/s (CAN FD) | Radar, lidar, parking sensors, lane-keep assist |
| Diagnostic CAN | 500 kbit/s | OBD-II port (legally required in US since 2008, EU since 2001) |

**OBD-II** (On-Board Diagnostics II) is the standardised diagnostic interface that mechanics and DIY enthusiasts use to read fault codes. It runs on CAN bus (ISO 15765-4) and is accessible via the 16-pin OBD-II connector under the dashboard. Affordable OBD-II Bluetooth adapters (ELM327-based, ~USD 15-30) allow any smartphone to read engine data.

**Scale:** Over 1 billion CAN-enabled nodes are produced annually for automotive alone.

### 2.2 Marine

Marine is the domain most relevant to Above Deck. CAN bus appears in three primary roles on boats:

**NMEA 2000 (Instrument Bus):** The standard marine instrument network. Carries navigation data (GPS, depth, wind, heading, AIS), environmental data (temperature, humidity, barometric pressure), and system data (battery voltage, tank levels). Runs at 250 kbit/s on CAN 2.0B. Uses proprietary DeviceNet Micro-C connectors.

**SAE J1939 (Engine Bus):** Marine diesel engines (Cummins, Caterpillar, Volvo Penta, Yanmar) use J1939 — the same protocol used in trucks and heavy equipment. J1939 runs on CAN 2.0B at 250 kbit/s and defines PGNs for RPM, oil pressure, coolant temperature, fuel rate, exhaust temperature, and more. Maretron's J2K100 gateway bridges J1939 engine data to NMEA 2000.

**Digital Switching (CZone, Empirbus):** CAN-based systems that replace traditional circuit breaker panels with programmable digital switches. CZone (by Mastervolt/BEP) uses CAN bus to control lighting, pumps, windlasses, and other loads. Each output module sits near the loads it controls, reducing wiring runs. Configuration is done via a PC tool or MFD integration.

**Victron Energy (VE.Can):** Victron uses CAN bus for communication between its energy products — inverters, solar charge controllers, battery monitors, and BMS. VE.Can is physically CAN bus and can be bridged to NMEA 2000 for display on chart plotters. The Cerbo GX acts as a central hub, aggregating data from VE.Can, VE.Direct (serial), and VE.Bus devices.

**Typical catamaran CAN bus layout:**

```
Engine Bus (J1939)          Instrument Bus (NMEA 2000)          Switching Bus (CZone)
├── Port engine             ├── Chartplotter                    ├── Lighting zones
├── Stbd engine             ├── GPS                             ├── Pump controls
├── Genset                  ├── Depth transducer                ├── Windlass
└── J2K100 gateway ───────► ├── Wind instrument                 ├── Anchor light
                            ├── AIS transponder                 └── Horn relay
                            ├── Autopilot
Energy Bus (VE.Can)         ├── Heading sensor
├── Victron inverter        └── CZone bridge ◄──────────────────┘
├── MPPT solar chargers
├── Battery monitor
├── BMS
└── Cerbo GX ──────────────►
```

A well-equipped bluewater catamaran may have **3-4 physically separate CAN buses** bridged through gateways.

### 2.3 Industrial (CANopen / DeviceNet)

CAN bus is pervasive in factory automation, with two dominant higher-layer protocols:

**CANopen** (CiA 301): The European standard for industrial CAN. Used in ~90% of industrial CAN applications involving motion control. Defines device profiles for motors, I/O modules, encoders, and PLCs. Common in robotics, CNC machines, and medical equipment.

**DeviceNet**: The American counterpart, developed by Allen-Bradley (Rockwell Automation). Widely used in automotive manufacturing plants, semiconductor fabs, and chemical processing. DeviceNet runs at 125, 250, or 500 kbit/s.

### 2.4 Agricultural (ISOBUS)

**ISOBUS (ISO 11783)** standardises CAN bus communication between tractors and implements (seeders, sprayers, harvesters). A farmer can connect any ISOBUS-compatible implement to any ISOBUS-compatible tractor and have full control and monitoring from the cab display.

ISOBUS is built on J1939 and adds:
- Virtual terminal (universal display protocol)
- Task controller (prescription maps for variable-rate application)
- Auxiliary control (joysticks, buttons)
- File server (data logging)

Major manufacturers: John Deere, CLAAS, CNH Industrial, AGCO. ISOBUS is to agriculture what NMEA 2000 is to marine.

### 2.5 Aerospace (ARINC 825)

**ARINC 825** adapts CAN bus for airborne use. Developed by an AEEC working group including Airbus, Boeing, GE Aerospace, and Rockwell Collins, it adds higher-layer functions for aviation-specific requirements:

- Logical Communication Channels (LCC) for structured data exchange
- One-to-many (OTM) and peer-to-peer (PTP) communication modes
- Enhanced fault tolerance for extreme temperatures, vibration, and EMI
- Ultra-precise synchronisation for flight-critical systems

Applications include flight-state sensors, engine control systems (fuel pumps, actuators), navigation systems, and in-flight data acquisition. ARINC 825 coexists with ARINC 429 (the legacy unidirectional avionics bus) on modern aircraft.

### 2.6 Medical Equipment

CAN bus (primarily via CANopen) is the fieldbus of choice for major medical OEMs including GE Healthcare, Philips Medical, and Siemens Healthineers. Applications include:

- Operating room equipment (lights, tables, cameras)
- Imaging systems (CT scanners, X-ray, ultrasound)
- Patient monitoring networks
- Laboratory automation (sample handlers, analysers)

The medical market values CAN's deterministic timing, fault tolerance, and proven reliability from decades of automotive deployment.

### 2.7 EV, Solar, and Battery Management

CAN bus is the dominant communication interface for Battery Management Systems (BMS):

- **EV battery packs:** Cell voltage, temperature, state-of-charge, and state-of-health data flow over CAN from the BMS to the vehicle controller. Tesla, BMW, Nissan, and virtually every EV manufacturer uses CAN for BMS communication.
- **Solar inverters:** Hybrid inverters from Victron, SMA, Fronius, and GoodWe use CAN bus to communicate with lithium battery BMS systems. The BMS sends charge/discharge voltage and current limits; the inverter adjusts accordingly.
- **EV chargers:** CAN bus (via the Combined Charging System / CCS standard) handles communication between the vehicle and DC fast charger during charging sessions.
- **DIY battery builds:** LiFePO4 battery packs from EVE, CATL, and others expose CAN bus interfaces. Solar monitoring tools like SolarAssistant can read BMS data over CAN.

### 2.8 RV and Campervan

RV and campervan electrical systems are architecturally similar to marine systems — 12V DC power, lithium batteries, solar charging, and a need for monitoring. CAN bus appears in:

- **Victron VE.Can** for energy system monitoring (identical to marine installations)
- **Chassis CAN** for reading vehicle engine data (speed, RPM, fuel level) via the OBD-II port
- **CZone/Mastervolt** for digital switching (shared with marine product lines)
- **Custom automation** using ESP32 or Raspberry Pi to read/write CAN frames for lighting, tanks, heating, and ventilation

The overlap between marine and RV is substantial. Above Deck's CAN bus infrastructure is directly applicable to van life and off-grid builds.

---

## 3. CAN Bus Higher-Layer Protocol Comparison

All of these protocols share CAN bus as their physical/data-link layer but define different application-layer semantics:

| Protocol | Base | Speed | ID Format | Max Data | Domain | Standard |
|----------|------|-------|-----------|----------|--------|----------|
| NMEA 2000 | CAN 2.0B | 250 kbit/s | 29-bit (PGN-encoded) | 8 bytes (fast-packet to 223) | Marine | IEC 61162-3 |
| SAE J1939 | CAN 2.0B | 250 kbit/s | 29-bit (PGN-encoded) | 8 bytes (transport to 1785) | Trucks, engines, marine engines | SAE J1939 |
| CANopen | CAN 2.0A/B | Up to 1 Mbit/s | 11-bit (COB-ID) | 8 bytes | Industrial automation | CiA 301 |
| DeviceNet | CAN 2.0A | 125/250/500 kbit/s | 11-bit | 8 bytes | Factory automation | IEC 62026-3 |
| ISOBUS | CAN 2.0B (J1939) | 250 kbit/s | 29-bit (PGN-encoded) | 8 bytes (transport to 1785) | Agriculture | ISO 11783 |
| ARINC 825 | CAN 2.0B | Up to 1 Mbit/s | 29-bit | 8 bytes | Aerospace | ARINC 825 |
| OBD-II (ISO 15765) | CAN 2.0A/B | 250/500 kbit/s | 11 or 29-bit | 8 bytes | Automotive diagnostics | ISO 15765-4 |

The key insight: **CAN bus is a shared physical layer**. Code that can read and write raw CAN frames can interact with any of these protocols given the right application-layer decoder.

---

## 4. NMEA 2000 on CAN Bus (Marine Deep Dive)

### 4.1 Protocol Architecture

NMEA 2000 is built on top of SAE J1939, which is itself built on CAN 2.0B:

```
┌─────────────────────────────────┐
│  NMEA 2000 Application Layer    │  PGN definitions for marine data
├─────────────────────────────────┤
│  SAE J1939 Transport/Network    │  Multi-packet transport, address claiming
├─────────────────────────────────┤
│  CAN 2.0B Data Link Layer       │  29-bit IDs, 8-byte frames, arbitration
├─────────────────────────────────┤
│  CAN Physical Layer             │  Twisted pair, 250 kbit/s, DeviceNet connectors
└─────────────────────────────────┘
```

### 4.2 The 29-Bit Identifier Structure

NMEA 2000 encodes metadata into the CAN extended identifier:

```
Bits 28-26: Priority (0-7, lower = higher priority)
Bits 25-8:  PGN (Parameter Group Number) — identifies the message type
Bits 7-0:   Source Address (0-253, unique per device on the bus)
```

The PGN itself contains:
- **Reserved bit** (1 bit)
- **Data Page** (1 bit)
- **PDU Format** (8 bits) — determines if the message is broadcast or addressed
- **PDU Specific** (8 bits) — destination address (if addressed) or group extension (if broadcast)

### 4.3 Key PGNs

| PGN | Name | Update Rate | Data |
|-----|------|-------------|------|
| 127250 | Vessel Heading | 100ms | Heading, deviation, variation, reference |
| 128259 | Speed (Water) | 1s | Speed through water, ground referenced |
| 128267 | Water Depth | 1s | Depth below transducer, offset |
| 129025 | Position (Rapid) | 100ms | Latitude, longitude |
| 129026 | COG & SOG (Rapid) | 250ms | Course over ground, speed over ground |
| 130306 | Wind Data | 100ms | Wind speed, angle, reference (apparent/true) |
| 127488 | Engine Parameters (Rapid) | 100ms | RPM, boost pressure, tilt |
| 127489 | Engine Parameters (Dynamic) | 500ms | Oil pressure, temperature, fuel rate |
| 127508 | Battery Status | 1s | Voltage, current, temperature, SoC |
| 130312 | Temperature | 2s | Various temperature types and values |
| 127505 | Fluid Level | 2.5s | Tank type, level, capacity |
| 129038 | AIS Class A Position | Variable | MMSI, position, COG, SOG, heading |

NMEA 2000 defines over 200 standard PGNs. Manufacturers can also register proprietary PGNs for device-specific data.

### 4.4 Fast-Packet Protocol

Standard CAN frames carry only 8 bytes. Many NMEA 2000 messages exceed this limit (e.g., AIS data, product information, route waypoints). The **Fast-Packet** protocol splits large messages across multiple CAN frames:

- First frame: sequence counter (3 bits) + frame counter (5 bits) + total byte count + first 6 data bytes
- Subsequent frames: sequence counter + frame counter + 7 data bytes
- Maximum payload: 223 bytes across up to 32 frames

### 4.5 Marine CAN Bus Products

| Manufacturer | Product | Function | Approx. Price |
|-------------|---------|----------|---------------|
| Maretron | USB100 | NMEA 2000 to USB gateway | USD 300 |
| Maretron | J2K100 | J1939 engine to NMEA 2000 gateway | USD 500 |
| Actisense | NGT-1 | NMEA 2000 to USB/serial gateway | USD 250 |
| Actisense | W2K-1 | NMEA 2000 to WiFi gateway | USD 350 |
| Actisense | NGW-1 | NMEA 0183 to NMEA 2000 converter | USD 200 |
| CZone | COI | CZone Output Interface (6-channel digital switch) | USD 400 |
| CZone | MOI | CZone Meter Output Interface | USD 500 |
| Victron | Cerbo GX | Central monitoring hub with VE.Can | USD 350 |
| Victron | VE.Can to NMEA 2000 cable | Protocol bridge cable | USD 25 |
| Yacht Devices | YDNU-02 | NMEA 2000 to USB gateway | USD 110 |
| Digital Yacht | NavLink2 | NMEA 2000 to WiFi/USB gateway | USD 200 |

---

## 5. CAN Bus Hardware for Makers and DIY

### 5.1 CAN Controllers and Transceivers

A CAN interface requires two components:

1. **CAN Controller** — handles the protocol (framing, arbitration, error detection, bit timing). Either a standalone chip (MCP2515) or built into the microcontroller (ESP32, STM32).
2. **CAN Transceiver** — converts the controller's logic-level TX/RX signals to/from the differential CAN_H/CAN_L bus signals. Always needed as a separate chip.

| Component | Type | Interface | Voltage | Price | Notes |
|-----------|------|-----------|---------|-------|-------|
| MCP2515 | Standalone CAN controller | SPI | 5V (needs level shifter for 3.3V MCUs) | USD 1-2 | Most common DIY CAN controller. 1 Mbit/s max |
| MCP2551 | CAN transceiver | - | 5V | USD 1 | Classic high-speed transceiver. 1 Mbit/s |
| MCP2562 | CAN transceiver | - | 3.3V/5V | USD 1-2 | 3.3V logic compatible. Recommended for RPi/ESP32 |
| SN65HVD230 | CAN transceiver | - | 3.3V | USD 1 | Popular with ESP32 TWAI. 1 Mbit/s |
| TJA1050 | CAN transceiver | - | 5V | USD 0.50 | Common on cheap MCP2515 modules |
| TJA1051 | CAN transceiver (FD) | - | 3.3V/5V | USD 1-2 | CAN FD capable. 5 Mbit/s |

### 5.2 Microcontroller Platforms

| Platform | Built-in CAN | Additional Hardware | Software | Approx. Cost | Best For |
|----------|-------------|---------------------|----------|-------------|----------|
| **ESP32** (original/S3) | Yes (TWAI controller) | SN65HVD230 transceiver (~USD 1) | ESP-IDF TWAI driver, Arduino CAN library | USD 5-10 | Compact, wireless, low-power nodes |
| **Raspberry Pi 4/5** | No | CAN HAT (MCP2515-based) | SocketCAN (kernel driver) | USD 50-80 + USD 15-30 HAT | Full Linux, Go server, heavy processing |
| **Raspberry Pi Pico** | No | MCP2515 via SPI | MicroPython/C SDK | USD 4 + USD 5 module | Ultra-low-cost CAN node |
| **Arduino Uno/Mega** | No | MCP2515 CAN shield | arduino-CAN library | USD 10-25 + USD 5-15 shield | Prototyping, education |
| **STM32 (F4/H7)** | Yes (bxCAN/FDCAN) | CAN transceiver only | STM32 HAL, CAN FD support | USD 10-20 + USD 1 transceiver | Production embedded, CAN FD |
| **Teensy 4.x** | Yes (3x CAN, 1x CAN FD) | CAN transceiver only | FlexCAN_T4 library | USD 25-30 + USD 1 transceiver | Multi-bus monitoring, high performance |

### 5.3 Raspberry Pi CAN HATs

| HAT | Controller | Transceiver | CAN FD | Isolated | Channels | Price |
|-----|-----------|-------------|--------|----------|----------|-------|
| PiCAN-M (Copperhill) | MCP2515 | MCP2551 | No | No | 1 | USD 40-50 |
| PiCAN3 (SK Pang) | MCP2515 | MCP2551 | No | No | 1 | USD 35-45 |
| Waveshare 2-CH CAN HAT | 2x MCP2515 | 2x SN65HVD230 | No | Yes | 2 | USD 20-25 |
| Waveshare 2-CH CAN FD HAT | 2x MCP2518FD | 2x SN65HVD230 | Yes | Yes | 2 | USD 30-35 |
| Seeed Studio 2-CH CAN | MCP2515 | MCP2551 | No | No | 2 | USD 25 |
| InnoMaker USB-CAN Module | GS_USB firmware | SN65HVD230 | No | Optional | 1-2 | USD 20-40 |

For Above Deck's Raspberry Pi deployment target, the **Waveshare 2-CH CAN FD HAT** is the best option — two isolated channels (one for NMEA 2000, one for engine/Victron bus), CAN FD ready, SocketCAN compatible, under USD 35.

### 5.4 USB-CAN Adapters

| Adapter | Firmware/Protocol | CAN FD | OS Support | Open Source | Price |
|---------|-------------------|--------|------------|-------------|-------|
| **CANable 2.0** | candleLight (gs_usb) or slcan | Yes | Linux (SocketCAN), Mac, Win | Yes (hardware + firmware) | USD 35-40 |
| **PEAK PCAN-USB** | PEAK proprietary | No | Linux, Mac, Win | No | USD 250-300 |
| **PEAK PCAN-USB FD** | PEAK proprietary | Yes | Linux, Mac, Win | No | USD 400-500 |
| **USBtin** | slcan | No | Linux, Mac, Win | Yes | USD 30-40 |
| **Kvaser Leaf Light v2** | Kvaser proprietary | No | Linux, Win | No | USD 200 |
| **InnoMaker USB2CAN** | gs_usb | No | Linux (SocketCAN) | No | USD 20-30 |

For DIY/maker use, the **CANable 2.0** is the clear winner: open-source hardware and firmware, CAN FD support, native SocketCAN via candleLight firmware, USB-C, onboard termination, ~USD 35.

For professional marine work, the **Actisense NGT-1** or **Yacht Devices YDNU-02** are preferred because they handle NMEA 2000 protocol specifics (address claiming, fast-packet reassembly) in firmware.

---

## 6. Linux SocketCAN

### 6.1 Architecture

SocketCAN is the official Linux kernel subsystem for CAN bus. It treats CAN interfaces as network devices (like `eth0` or `wlan0`), making CAN frames accessible through the standard Berkeley socket API. This is a fundamentally different approach from Windows/Mac, where CAN adapters expose proprietary character device or USB APIs.

```
┌──────────────────────────────────────────┐
│  User Space (candump, cansend, Go app)   │
├──────────────────────────────────────────┤
│  Socket API (AF_CAN, SOCK_RAW)           │
├──────────────────────────────────────────┤
│  SocketCAN Core (can.ko, can-raw.ko)     │
├──────────────────────────────────────────┤
│  CAN Network Driver (mcp251x, gs_usb)   │
├──────────────────────────────────────────┤
│  Hardware (SPI, USB, built-in peripheral)│
└──────────────────────────────────────────┘
```

### 6.2 Setup

```bash
# Load kernel modules (usually automatic)
sudo modprobe can
sudo modprobe can-raw
sudo modprobe mcp251x   # For MCP2515-based HATs

# Configure the CAN interface
sudo ip link set can0 type can bitrate 250000   # 250 kbit/s for NMEA 2000
sudo ip link set can0 up

# Verify
ip -details link show can0

# For CAN FD:
sudo ip link set can0 type can bitrate 500000 dbitrate 2000000 fd on
```

### 6.3 can-utils Command-Line Tools

Install with `sudo apt-get install can-utils`. The essential tools:

| Tool | Purpose | Example |
|------|---------|---------|
| `candump` | Display received CAN frames | `candump can0` |
| `cansend` | Send a single CAN frame | `cansend can0 123#DEADBEEF` |
| `cangen` | Generate random CAN traffic | `cangen can0 -g 10 -I 42A -L 8` |
| `canplayer` | Replay logged CAN traffic | `canplayer -I logfile.log` |
| `cansniffer` | Show changing CAN data (delta view) | `cansniffer can0` |
| `candump -l` | Log CAN traffic to file | `candump -l can0` |
| `isotpsend` | Send ISO-TP (multi-frame) messages | `isotpsend -s 7E0 -d 7E8 can0` |
| `isotprecv` | Receive ISO-TP messages | `isotprecv -s 7E8 -d 7E0 can0` |

**Filtering:** candump supports hardware-level filters to reduce CPU load:

```bash
# Only show frames with ID 0x1F801 (NMEA 2000 PGN 127489 engine params from source 1)
candump can0,1F80100:1FFFF00

# Filter format: can_id:can_mask
# The mask specifies which bits of the ID must match
```

### 6.4 Virtual CAN for Development

SocketCAN supports virtual CAN interfaces for development without hardware:

```bash
sudo modprobe vcan
sudo ip link add dev vcan0 type vcan
sudo ip link set vcan0 up

# In terminal 1: listen
candump vcan0

# In terminal 2: send test frames
cansend vcan0 123#DEADBEEF
cangen vcan0 -g 100 -I 42A -L 8 -D r
```

This is invaluable for developing and testing CAN bus code without physical hardware.

---

## 7. CAN Bus + Go

### 7.1 Library Landscape

| Library | Focus | SocketCAN | CAN FD | DBC Code-Gen | Stars | Maintained |
|---------|-------|-----------|--------|---------------|-------|------------|
| [einride/can-go](https://github.com/einride/can-go) | Full CAN SDK | Yes | Yes | Yes | 229 | Active (Feb 2026) |
| [brutella/can](https://github.com/brutella/can) | Simple SocketCAN | Yes | No | No | ~80 | 2023 |
| [linklayer/go-socketcan](https://github.com/linklayer/go-socketcan) | SocketCAN bindings | Yes | No | No | ~30 | 2022 |
| [go-daq/canbus](https://github.com/go-daq/canbus) | Scientific CAN | Yes | No | No | ~30 | 2022 |
| [notnil/canbus](https://github.com/notnil/canbus) | Idiomatic CAN | Yes | No | No (CANopen sub-pkg) | ~15 | Sep 2025 |
| [angelodlfrtr/go-can](https://github.com/angelodlfrtr/go-can) | Multi-transport | Yes + serial | No | No | ~20 | 2022 |

### 7.2 einride/can-go Deep Dive

The clear choice for Above Deck. Production-grade, actively maintained, pure Go (99.4%).

**Reading CAN frames via SocketCAN:**

```go
package main

import (
    "fmt"
    "net"
    "go.einride.tech/can/pkg/socketcan"
)

func main() {
    conn, _ := socketcan.DialContext(context.Background(), "can", "can0")
    defer conn.Close()

    recv := socketcan.NewReceiver(conn)
    for recv.Receive() {
        frame := recv.Frame()
        fmt.Printf("ID: 0x%X Data: %X\n", frame.ID, frame.Data[:frame.Length])
    }
}
```

**DBC code generation:** The `cantool` CLI generates Go structs and marshal/unmarshal methods from `.dbc` files (the industry-standard CAN database format). This means you define your message layout once in a DBC file and get type-safe Go code:

```bash
go run go.einride.tech/can/cmd/cantool generate go mydb.dbc ./gen/
```

**Key capabilities:**
- SocketCAN and UDP multicast transports
- CAN FD support
- CAN frame receiver/transmitter patterns
- Signal-level encoding/decoding from DBC definitions
- 31 releases, v0.17.0 as of Feb 2026

### 7.3 NMEA 2000 from Go

Two approaches for reading NMEA 2000 data in Go:

**Approach 1: Raw CAN frames + CANboat PGN database**
1. Open a SocketCAN connection with einride/can-go
2. Read raw CAN frames (29-bit extended IDs)
3. Extract priority, PGN, source address from the 29-bit ID
4. Look up the PGN in the CANboat database (JSON format: `canboat.json`)
5. Decode the data bytes according to field definitions (bit offsets, scaling factors, units)

**Approach 2: Use a dedicated NMEA 2000 Go library**

| Library | Approach | PGN Coverage |
|---------|----------|-------------|
| [boatkit-io/n2k](https://github.com/boatkit-io/n2k) | Code-generated from canboat.json. Strongly typed Go structs per PGN | Broad (all canboat PGNs) |
| [aldas/go-nmea-client](https://github.com/aldas/go-nmea-client) | Reads from SocketCAN or Actisense USB adapters. Fast-packet assembly built in | Common navigation + engine PGNs |

**Recommended stack for Above Deck:**

```
einride/can-go          → SocketCAN frame I/O + CAN FD support
boatkit-io/n2k          → NMEA 2000 PGN encoding/decoding (code-gen from canboat)
canboat/canboat (JSON)  → PGN database for custom/proprietary PGN lookup
```

### 7.4 CANboat Integration

[CANboat](https://github.com/canboat/canboat) is the open-source Rosetta Stone for NMEA 2000. It provides:

- **canboat.json / canboat.xml**: Machine-readable PGN definitions including field names, bit offsets, resolution, units, and enumeration values. Covers 200+ standard PGNs plus proprietary PGNs from Navico, Garmin, Raymarine, Airmar, and Furuno.
- **analyzer**: C program that decodes raw NMEA 2000 frames to human-readable output
- **actisense-serial**: Reader for Actisense NGT-1 gateway serial protocol
- **canboatjs**: TypeScript/Node.js library (used by SignalK)

For a Go server, the JSON database is the critical asset. It can be embedded at compile time and used for runtime PGN lookup and decoding, eliminating any dependency on the C analyzer or Node.js.

---

## 8. Why CAN Bus Matters for Above Deck

### 8.1 Beyond Marine

CAN bus mastery positions Above Deck for expansion beyond boats:

| Domain | CAN Protocol | Shared Infrastructure |
|--------|-------------|----------------------|
| Marine instruments | NMEA 2000 | CAN frame I/O, PGN decoding, SocketCAN |
| Marine engines | J1939 | Same PGN structure as NMEA 2000 (shared heritage) |
| Victron energy | VE.Can | Same CAN physical layer, Victron-specific PGNs |
| RV/Campervan | VE.Can + OBD-II + CZone | Identical to marine energy + automotive diagnostics |
| Off-grid solar | CAN BMS | BMS PGNs for battery state, inverter control |
| Van life | All of the above | 12V/24V systems are architecturally identical to boats |

A Go CAN bus library that handles raw frame I/O, protocol decoding, and SocketCAN integration is foundational infrastructure. The application-layer decoders (NMEA 2000, J1939, Victron, BMS) are thin layers on top.

### 8.2 Bypassing Node.js

The dominant open-source marine data server today is SignalK, which is built on Node.js and uses canboatjs for NMEA 2000 parsing. Above Deck's Go backend can access CAN bus directly via SocketCAN — no Node.js runtime, no canboatjs, no intermediary processes.

**SignalK path (current open-source standard):**
```
CAN HAT → SocketCAN → actisense-serial (C) → canboatjs (Node.js) → SignalK (Node.js) → WebSocket → UI
```

**Above Deck path (Go-native):**
```
CAN HAT → SocketCAN → einride/can-go (Go) → PGN decoder (Go) → WebSocket → UI
```

Fewer moving parts, single binary deployment, lower memory footprint on Raspberry Pi, and no Node.js dependency.

### 8.3 CAN FD: Future-Proofing

NMEA 2000 currently runs at 250 kbit/s with 8-byte frames. As marine electronics evolve (high-resolution radar data, camera feeds, detailed BMS telemetry), the 250 kbit/s limit will become a bottleneck. CAN FD (up to 8 Mbit/s, 64-byte frames) is the likely upgrade path.

By building on einride/can-go (which supports CAN FD) and choosing CAN FD-capable hardware (Waveshare CAN FD HAT, CANable 2.0), Above Deck is ready for next-generation marine buses without architectural changes.

### 8.4 Hardware Recommendation for Development

**Minimum viable CAN bus development kit for Above Deck:**

| Item | Purpose | Price |
|------|---------|-------|
| Raspberry Pi 4/5 | Go server runtime | USD 50-80 |
| Waveshare 2-CH CAN FD HAT | Dual CAN bus interface (NMEA 2000 + engine/Victron) | USD 30-35 |
| CANable 2.0 | USB-CAN for laptop development and debugging | USD 35-40 |
| 120-ohm resistors (x4) | Bus termination | USD 1 |
| Micro-C NMEA 2000 cable + T-connector | Connect to boat's instrument bus | USD 30-50 |
| **Total** | | **~USD 150-200** |

For software development without hardware, SocketCAN's `vcan` virtual interface allows full end-to-end testing with simulated CAN traffic.

---

## 9. Glossary

| Term | Definition |
|------|-----------|
| **Arbitration** | The process by which CAN nodes compete for bus access without collisions |
| **BMS** | Battery Management System — monitors cell voltages, temperatures, and balances cells |
| **CAN FD** | CAN with Flexible Data-Rate — 64-byte payloads at up to 8 Mbit/s |
| **CAN_H / CAN_L** | The two differential signal wires of a CAN bus |
| **COB-ID** | Communication Object Identifier — CANopen term for CAN frame ID |
| **DBC** | Database CAN — industry-standard file format for describing CAN message layouts |
| **Dominant** | Logical 0 on CAN bus; overwrites recessive during arbitration |
| **Drop cable** | Short cable connecting a device to the CAN backbone |
| **ECU** | Electronic Control Unit — a CAN-connected computer module |
| **Fast-Packet** | NMEA 2000 protocol for sending messages larger than 8 bytes across multiple frames |
| **Gateway** | Device that bridges between two CAN buses or between CAN and another protocol |
| **J1939** | SAE standard for CAN bus in heavy vehicles and marine engines |
| **PGN** | Parameter Group Number — identifies the type of message in NMEA 2000 / J1939 |
| **Recessive** | Logical 1 on CAN bus; can be overwritten by dominant |
| **SocketCAN** | Linux kernel subsystem that exposes CAN interfaces as network devices |
| **Transceiver** | Chip that converts logic-level signals to/from differential CAN bus signals |
| **TWAI** | Two-Wire Automotive Interface — ESP32's name for its built-in CAN controller |
| **vcan** | Virtual CAN interface in Linux for testing without hardware |

---

## Sources

- [CAN bus - Wikipedia](https://en.wikipedia.org/wiki/CAN_bus)
- [The Controller Area Network CAN — Bosch](https://www.bosch.com/stories/the-controller-area-network/)
- [CAN Bus Unplugged: Origins, Growth, and Future — Copperhill Technologies](https://copperhilltech.com/blog/can-bus-unplugged-a-deep-dive-into-its-origins-growth-and-future/)
- [History of CAN Technology — CAN in Automation (CiA)](https://www.can-cia.org/can-knowledge/history-of-can-technology)
- [CAN FD vs CAN 2.0 — Grid Connect](https://www.gridconnect.com/blogs/news/can-fd-the-next-big-fast-thing)
- [Understanding CAN FD vs CAN — NI](https://www.ni.com/en/shop/seamlessly-connect-to-third-party-devices-and-supervisory-system/understanding-can-with-flexible-data-rate--can-fd-.html)
- [CAN FD - Wikipedia](https://en.wikipedia.org/wiki/CAN_FD)
- [NMEA 2000 - Wikipedia](https://en.wikipedia.org/wiki/NMEA_2000)
- [Exploring the NMEA 2000 Protocol — Embien](https://www.embien.com/automotive-insights/exploring-the-nmea-2000-protocol)
- [NMEA 2000 and CAN Bus — CANboat DeepWiki](https://deepwiki.com/canboat/canboat/3.1-nmea-2000-and-can-bus)
- [Understanding PGNs: NMEA 2000 and J1939 — Actisense](https://actisense.com/news/understanding-pgns-nmea-2000-and-j1939/)
- [NMEA 2000 PGNs Deciphered — Endige Boating](https://endige.com/2050/nmea-2000-pgns-deciphered/)
- [CAN Bus Arbitration — Copperhill Technologies](https://copperhilltech.com/blog/controller-area-network-can-bus-bus-arbitration/)
- [Controller Area Network Overview — NI](https://www.ni.com/en/shop/seamlessly-connect-to-third-party-devices-and-supervisory-system/controller-area-network--can--overview.html)
- [CAN Bus Applications — Copperhill Technologies](https://copperhilltech.com/blog/can-bus-tutorial-typical-can-bus-applications/)
- [CANopen Explained — CSS Electronics](https://www.csselectronics.com/pages/canopen-tutorial-simple-intro)
- [ISO 11783 (ISOBUS) - Wikipedia](https://en.wikipedia.org/wiki/ISO_11783)
- [ARINC 825 Standard Explained — Sital Technology](https://sitaltech.com/arinc-825-standard-explained-breaking-down-the-basics/)
- [ARINC 825 — arinc-825.com](https://www.arinc-825.com/)
- [einride/can-go — GitHub](https://github.com/einride/can-go)
- [aldas/go-nmea-client — GitHub](https://github.com/aldas/go-nmea-client)
- [boatkit-io/n2k — Go Packages](https://pkg.go.dev/github.com/boatkit-io/n2k)
- [canboat/canboat — GitHub](https://github.com/canboat/canboat)
- [linux-can/can-utils — GitHub](https://github.com/linux-can/can-utils)
- [CANable — Open-Source USB to CAN Adapter](https://canable.io/)
- [candleLight Firmware — GitHub](https://github.com/candle-usb/candleLight_fw)
- [Raspberry Pi CAN Bus: SocketCAN Setup — AutoPi](https://www.autopi.io/blog/raspberry-pi-can-bus-explained/)
- [Adding CAN to the Raspberry Pi — Beyond Logic](https://www.beyondlogic.org/adding-can-controller-area-network-to-the-raspberry-pi/)
- [How to Use SocketCAN in Linux — mbedded.ninja](https://blog.mbedded.ninja/programming/operating-systems/linux/how-to-use-socketcan-with-the-command-line-in-linux/)
- [CAN Bus BMS Communication Specification — EVWest](https://www.evwest.com/support/CAN%20Bus%20Communication%20Spec.pdf)
- [CAN Bus Setup with SolarAssistant](https://solar-assistant.io/help/battery/canbus)
- [Victron VE.Can to CAN-bus BMS Cables](https://www.victronenergy.com/live/battery_compatibility:can-bus_bms-cable)
- [Digital Switching: Controlling Your Yacht — Yachting Monthly](https://www.yachtingmonthly.com/gear/digital-switching-controlling-your-yacht-from-your-phone-90929)
- [NMEA 2000 DBC File — CSS Electronics](https://www.csselectronics.com/products/nmea-2000-dbc-file-pgn-database)
- [CAN Bus Explained (2025) — AutoPi](https://www.autopi.io/blog/can-bus-explained/)

---

# Appendix B: Smart Home & PWA Integration

# Smart Home Ecosystems & PWA Integration Research

**Date:** 2026-03-20
**Status:** Research complete
**Related:** [Matter Protocol & IoT Integration](./matter-protocol-iot-integration.md), [PWA & Mobile Capabilities](./pwa-and-mobile-capabilities.md), [d3kOS Deep Dive](./d3kos-and-marine-os-deep-dive.md)

---

## Executive Summary

Smart home ecosystems (Apple HomeKit, Google Home, Amazon Alexa, Samsung SmartThings, Home Assistant) provide the consumer interface that sailors already use at home. When docked, sailors want to check bilge status, cabin temperature, and battery levels from their phone's native smart home app — without opening Above Deck. The question is how a PWA-based marine platform can bridge to these ecosystems.

The short answer: PWAs cannot directly interact with smart home ecosystems. The browser sandbox prevents it entirely. The path forward is the Above Deck Go server acting as a Matter bridge — exposing boat systems as Matter devices that appear natively in HomeKit, Google Home, and Alexa simultaneously. One implementation, all ecosystems.

This document maps the landscape, explains the protocols, identifies what works and what does not from a PWA, and recommends a concrete architecture for Above Deck.

---

## Part 1: Smart Home Ecosystem Overview

### Apple HomeKit / Home App

**Architecture:** Local-first, privacy-centric. HomeKit uses the HomeKit Accessory Protocol (HAP) for direct device communication over the local network. No cloud dependency for basic control — Apple devices send commands directly to accessories via HAP. iCloud syncs configuration between user devices but does not act as a controlling hub.

**Protocols:**
- **HAP over IP** — HTTP/TCP on the local network, discovered via Bonjour (mDNS/DNS-SD). End-to-end encrypted with mutual authentication and perfect forward secrecy.
- **HAP over BLE** — Bluetooth Low Energy transport for battery-powered devices.
- **Matter** — Supported since iOS 16.1 (2022). Matter devices appear as native HomeKit accessories in the Home app.

**Hub requirement:** A HomePod, Apple TV, or iPad (as home hub) is required for remote access, automations, and Matter Thread border router functionality. Without a hub, control is local-only from devices on the same network.

**Data model:** Hierarchical — Accessories contain Services, Services contain Characteristics. A temperature sensor accessory exposes a Temperature Sensor service with a Current Temperature characteristic. Strictly typed, Apple-defined categories.

**Security:** Device pairing uses SRP (Secure Remote Password) protocol with an 8-digit setup code. Session keys use Curve25519, Ed25519, and ChaCha20-Poly1305. All communication is encrypted. No cloud keys — pairing material stays on the local network.

| Aspect | Detail |
|--------|--------|
| Protocol | HAP (proprietary), Matter (open) |
| Transport | IP (WiFi/Ethernet), BLE, Thread (via Matter) |
| Cloud dependency | None for local control; iCloud for sync |
| Hub | HomePod, Apple TV, or iPad |
| Matter support | Yes, since iOS 16.1 |
| Thread border router | HomePod Mini, HomePod 2nd gen, Apple TV 4K |
| Developer access | MFi programme (HAP), or Matter (open) |

### Google Home

**Architecture:** Historically cloud-first — device commands routed through Google's cloud even for local devices. This changed significantly with Matter and the Home APIs (2024-2026), which enable local control paths.

**Integration models:**
- **Cloud-to-cloud** — Traditional model. Device manufacturer runs a cloud service, Google Home connects to it. High latency, internet-dependent.
- **Local Home SDK** — JavaScript app runs on Google Nest hub, controls devices locally. Deprecated in favour of Matter.
- **Matter** — Native local control. Nearly every Google Nest speaker, hub, and WiFi system supports Matter devices for local connectivity. No cloud fulfillment app needed.
- **Home APIs** — New developer APIs (public beta, 2025-2026) providing unified access to 750M+ connected devices. Android SDK available; iOS SDK coming. Enables automation creation, device control, and structure management.

**Local control performance:** Home APIs with Matter achieve up to 3x faster device control compared to cloud-to-cloud, with low-latency local communication through Nest hubs.

| Aspect | Detail |
|--------|--------|
| Protocol | Cloud-to-cloud, Local Home SDK (deprecated), Matter |
| Transport | WiFi, Thread (via Nest hubs) |
| Cloud dependency | Required for cloud-to-cloud; optional with Matter |
| Hub | Nest speakers, Nest Hub, Nest WiFi |
| Matter support | Yes, native since 2022 |
| Thread border router | Nest Hub 2nd gen, Nest WiFi Pro |
| Developer access | Home APIs (Android/iOS SDK), Matter |

### Amazon Alexa

**Architecture:** Cloud-first for skills; local-first for Matter. Traditional Alexa smart home integration requires building an Alexa Smart Home Skill backed by an AWS Lambda function. Matter devices bypass this entirely — they connect directly to Alexa without a separate hub or skill.

**Integration models:**
- **Smart Home Skills** — Cloud-based. Device state changes go through AWS Lambda. Internet required.
- **Matter** — Direct local connection. Matter-compatible Echo devices support Matter 1.5 SDK, enabling control of Matter over WiFi and Thread devices.
- **Alexa Connect Kit (ACK)** — Amazon's SDK for device manufacturers. Now supports Matter with ESP32-C6. Includes Frustration Free Setup (automatic WiFi/Alexa pairing out of box).

**Device support:** Lighting, smart plugs, sensors, door locks, thermostats, fans, air purifiers, air quality sensors, smoke/CO alarms, dishwashers, robotic vacuums, and more via Matter.

| Aspect | Detail |
|--------|--------|
| Protocol | Alexa Smart Home Skill API, Matter |
| Transport | WiFi, Thread (via Echo devices) |
| Cloud dependency | Required for skills; optional with Matter |
| Hub | Echo speakers/displays with Matter support |
| Matter support | Yes, Matter 1.5 SDK |
| Thread border router | Echo 4th gen, Echo Show, newer Echo devices |
| Developer access | Alexa Skills Kit, ACK SDK for Matter |

### Samsung SmartThings

**Architecture:** Hub-based with aggressive Matter adoption. SmartThings was the first platform to support Matter 1.5 (including cameras). Samsung's "Hub Everywhere" strategy embeds SmartThings hubs into TVs, refrigerators, and other Samsung appliances — over 200 device models.

**Hub options:**
- SmartThings Station Pro — Thread Border Router, Zigbee 3.0, WiFi 6E, Bluetooth 5.3, Matter controller
- SmartThings Hub v3 / Aeotec Smart Home Hub
- Samsung TVs and appliances with integrated hubs

**Protocols:** Zigbee, Z-Wave, Matter, Thread, WiFi, BLE. The broadest protocol support of any consumer platform.

| Aspect | Detail |
|--------|--------|
| Protocol | Zigbee, Z-Wave, Matter, WiFi, BLE |
| Matter support | Yes, first platform with Matter 1.5 |
| Thread border router | SmartThings Station Pro, integrated hubs |
| Developer access | SmartThings API, Matter |

### Home Assistant

**Architecture:** Open source, local-first, massive integration library. Runs on any hardware (Raspberry Pi, NUC, VM, Docker). Over 2,700 integrations covering nearly every smart home protocol and device.

**Smart home bridging:**
- **HomeKit Bridge integration** — Exposes Home Assistant entities to Apple HomeKit. Non-HomeKit devices become controllable via Apple Home and Siri.
- **Google Assistant integration** — Exposes entities to Google Home via cloud relay (Nabu Casa) or manual setup.
- **Alexa Smart Home Skill** — Exposes entities to Alexa via cloud relay.
- **Matter controller** — Home Assistant acts as a Matter controller, commissioning and controlling Matter devices.
- **Matter bridge** — Via Matterbridge add-on or Home Assistant Matter Hub, exposes HA entities as Matter devices to any Matter controller (HomeKit, Google Home, Alexa).

**MQTT:** Native MQTT integration. This is the primary bridge protocol for DIY and marine systems. SignalK-to-MQTT bridges already exist and are used by the BBN OS community.

**Marine relevance:** Home Assistant is already used by liveaboards and technically-inclined sailors to monitor boat systems. BBN OS (Bareboat Necessities) integrates SignalK with Home Assistant via MQTT, proving the marine-to-smart-home bridge pattern works.

| Aspect | Detail |
|--------|--------|
| Architecture | Open source, local-first |
| Protocols | 2,700+ integrations (MQTT, Zigbee, Z-Wave, BLE, Matter, etc.) |
| Matter support | Controller + bridge (via add-ons) |
| HomeKit bridge | Yes, native integration |
| Google/Alexa bridge | Yes, via Nabu Casa or manual |
| Marine integration | SignalK via MQTT (proven by BBN OS) |

---

## Part 2: HomeKit Deep Dive

### HomeKit Accessory Protocol (HAP)

HAP is Apple's proprietary protocol for smart home device communication. It defines how devices are discovered, paired, and controlled.

**Discovery:** Accessories advertise via Bonjour (mDNS/DNS-SD) on the local network. The Home app discovers them automatically when on the same WiFi network.

**Pairing:** Uses SRP (Secure Remote Password) with the 8-digit setup code printed on the device or shown on-screen. After initial pairing, long-term keys (Ed25519) are exchanged. Subsequent sessions use these keys — no cloud involved.

**Communication:** HTTP over TCP, encrypted with ChaCha20-Poly1305 per session. Every request/response is authenticated and encrypted. Sessions have perfect forward secrecy.

**Data model:**
```
Accessory (e.g., "Cabin Temperature Sensor")
  └── Service (e.g., Temperature Sensor)
        ├── Characteristic: Current Temperature (read)
        ├── Characteristic: Name (read)
        └── Characteristic: Status Active (read)
  └── Service (e.g., Accessory Information)
        ├── Characteristic: Manufacturer
        ├── Characteristic: Model
        ├── Characteristic: Serial Number
        └── Characteristic: Firmware Revision
```

### HomeKit over IP vs HomeKit over BLE

| Aspect | HAP over IP | HAP over BLE |
|--------|------------|--------------|
| Transport | WiFi/Ethernet (TCP) | Bluetooth Low Energy |
| Range | Network-wide | ~10m |
| Power | Requires mains/USB power (typically) | Battery-friendly |
| Latency | Low (~50-200ms) | Higher (~200-500ms) |
| Throughput | High | Low |
| Use case | Lights, plugs, cameras, bridges | Door sensors, motion sensors, buttons |
| Boat relevance | Primary — devices on boat WiFi | Secondary — battery sensors in bilge/lazarette |

### HomeKit Bridges

A HomeKit bridge is a special accessory type that exposes multiple non-HomeKit devices to the Home app as if they were native HomeKit accessories. The bridge handles protocol translation.

**How it works:** The bridge announces itself as a single HAP accessory with the "bridge" category. It presents child accessories (up to 150) that appear individually in the Home app. The Home app pairs with the bridge once; all child accessories are accessible through that pairing.

**Key implementations:**

| Bridge | Technology | What It Exposes |
|--------|-----------|----------------|
| Homebridge | Node.js (HAP-NodeJS) | 2,000+ plugins — any non-HomeKit device |
| Home Assistant HomeKit Bridge | Python | Any Home Assistant entity |
| Philips Hue Bridge | Firmware | Hue/Zigbee lights as HomeKit accessories |
| Aqara Hub | Firmware | Zigbee sensors as HomeKit accessories |
| IKEA Dirigera | Firmware | IKEA smart home as HomeKit accessories |

### HomeKit + Matter

Since iOS 16.1, Matter devices appear as native accessories in the Home app. From the user's perspective, there is no difference between a HAP device and a Matter device — both show up in the Home app with full control, automations, and Siri support.

**Implication for Above Deck:** If the Go server exposes boat systems as Matter devices, they will appear in HomeKit without implementing HAP at all. Matter is the recommended path — it gets HomeKit support for free alongside Google Home and Alexa.

### Can a Web App / PWA Interact with HomeKit?

**No.** There is no web API, REST endpoint, or browser mechanism to interact with HomeKit. The HAP protocol is not accessible from a browser or PWA. HomeKit is strictly a native Apple framework (available in Swift/Objective-C via the HomeKit framework on iOS/macOS/tvOS/watchOS).

A PWA cannot:
- Discover HomeKit accessories
- Pair with HomeKit accessories
- Read device state from HomeKit
- Send commands to HomeKit devices
- Create HomeKit automations

The only way a web-based application can influence HomeKit is indirectly — by controlling a server that acts as a HomeKit bridge.

### HAP-NodeJS and Homebridge

**HAP-NodeJS** is the open-source Node.js implementation of the HomeKit Accessory Protocol. It implements the full HAP stack — mDNS advertisement, SRP pairing, encrypted sessions, accessory/service/characteristic model. Any Node.js process using HAP-NodeJS can appear as a HomeKit accessory in the Home app.

**Homebridge** is built on HAP-NodeJS. It runs as a Node.js server on the local network and acts as a bridge, exposing non-HomeKit devices to the Home app through a plugin system. Over 2,000 community plugins exist.

**Relevance to Above Deck:** Homebridge proves the bridge pattern works. A server on the boat network can make any data source appear in HomeKit. However, Homebridge is Node.js — which conflicts with Above Deck's Go-only backend principle.

### HAP in Go — brutella/hap

A pure Go implementation of HAP exists: **[brutella/hap](https://github.com/brutella/hap)** (Apache 2.0 license). It provides:

- Full HAP over IP implementation
- mDNS/DNS-SD service advertisement
- SRP pairing and encrypted sessions
- All HomeKit services and characteristics
- Bridge accessory support

This means Above Deck's Go server could directly expose boat systems to HomeKit via HAP — no Node.js, no Homebridge. However, this only covers Apple HomeKit. Matter is the better investment because it covers all ecosystems with one implementation.

| Approach | Language | Covers HomeKit | Covers Google Home | Covers Alexa | Effort |
|----------|---------|:-:|:-:|:-:|--------|
| brutella/hap | Go | Yes | No | No | Medium |
| Matter bridge | Go | Yes (via Matter) | Yes | Yes | Medium-High |
| Homebridge plugin | Node.js | Yes | No | No | Low |
| Home Assistant bridge | Python | Yes (via HA) | Yes (via HA) | Yes (via HA) | Low (but adds dependency) |

---

## Part 3: Matter as the Universal Bridge

### One Implementation, All Ecosystems

Matter's defining feature for Above Deck is multi-admin. A single Matter device (or bridge) can be commissioned to up to five controllers simultaneously. This means:

```
Above Deck Go Server
  └── Matter Bridge
        ├── Commissioned to: Apple Home (via HomePod)
        ├── Commissioned to: Google Home (via Nest Hub)
        ├── Commissioned to: Amazon Alexa (via Echo)
        ├── Commissioned to: Home Assistant
        └── Commissioned to: SmartThings
```

All five controllers see the same boat devices. One implementation in Go, five ecosystems served.

### Multi-Admin: How It Works

1. Above Deck's Go server starts a Matter bridge on the local network
2. First controller (e.g., Apple Home) commissions the bridge using the QR code / setup code
3. From the first controller's app, the user shares the bridge to additional controllers
4. Each subsequent controller gets a temporary setup code — no re-scanning needed
5. All controllers can read state and send commands independently
6. The Matter standard guarantees at least five concurrent fabric memberships

### What Above Deck Could Expose as Matter Devices

| Boat System | Matter Device Type | Matter Cluster | Data Source |
|-------------|-------------------|----------------|-------------|
| Cabin temperature | Temperature Sensor | Temperature Measurement | Matter sensor / NMEA |
| Engine room temperature | Temperature Sensor | Temperature Measurement | Matter sensor |
| Cabin humidity | Humidity Sensor | Relative Humidity | Matter sensor |
| Bilge water alarm | Contact Sensor | Boolean State | Contact sensor in bilge |
| Battery state of charge | Power Source | Power Source (battery) | Victron via MQTT/VE.Direct |
| Solar production | Solar Panel (v1.4+) | Electrical Energy Measurement | Victron via MQTT |
| Shore power status | Smart Plug | On/Off + Electrical Measurement | Victron / sensor |
| Cabin lighting | Dimmable Light | On/Off + Level Control | Matter smart switches |
| Navigation lights | On/Off Switch | On/Off | Relay / Matter switch |
| Anchor light | On/Off Switch | On/Off | Relay / Matter switch |
| Fridge/freezer temperature | Temperature Sensor | Temperature Measurement | Matter sensor in fridge |
| LPG gas detection | Air Quality Sensor | CO Concentration (v1.2+) | Matter gas detector |
| Motion (dock security) | Occupancy Sensor | Occupancy Sensing | Matter motion sensor |

### The Bridge Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Smart Home Ecosystems                      │
│                                                              │
│  ┌─────────┐  ┌─────────────┐  ┌───────┐  ┌──────────────┐ │
│  │ HomeKit │  │ Google Home  │  │ Alexa │  │ SmartThings  │ │
│  │(HomePod)│  │ (Nest Hub)   │  │(Echo) │  │   (Hub)      │ │
│  └────┬────┘  └──────┬──────┘  └───┬───┘  └──────┬───────┘ │
│       │              │             │              │          │
│       └──────────────┴─────┬───────┴──────────────┘          │
│                            │                                 │
│                     Matter Protocol                          │
│                      (local WiFi)                            │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────┐
│              Above Deck Go Server                            │
│                            │                                 │
│  ┌─────────────────────────┴───────────────────────────────┐ │
│  │              Matter Bridge Module                        │ │
│  │  Exposes boat data as Matter device clusters             │ │
│  └─────────────────────────┬───────────────────────────────┘ │
│                            │                                 │
│  ┌─────────────────────────┴───────────────────────────────┐ │
│  │           Unified Above Deck Data Model                  │ │
│  └──┬──────────┬──────────┬──────────┬─────────────────────┘ │
│     │          │          │          │                        │
│  ┌──┴───┐  ┌──┴────┐  ┌──┴───┐  ┌──┴──────────┐            │
│  │ NMEA │  │Victron│  │ MQTT │  │ Matter       │            │
│  │0183/ │  │VE.Dir │  │Sensor│  │ Controller   │            │
│  │ 2000 │  │/Modbus│  │ s    │  │ (inbound)    │            │
│  └──┬───┘  └──┬────┘  └──┬───┘  └──┬──────────┘            │
│     │         │          │         │                         │
└─────┼─────────┼──────────┼─────────┼─────────────────────────┘
      │         │          │         │
  [NMEA bus] [Victron]  [ESP32]  [Thread mesh]
  GPS, wind   Cerbo GX   DIY     Off-the-shelf
  depth, AIS  solar,bat  sensors  Matter sensors

┌──────────────────────────────────────────────────────────────┐
│                    PWA (browser)                              │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │           WebSocket connection to Go Server             │  │
│  │  (reads same data, sends commands, full MFD interface)  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**Two directions of Matter:**
1. **Inbound (Controller)** — Above Deck discovers and reads off-the-shelf Matter sensors (temperature, contact, humidity). Data flows into the unified model alongside NMEA and Victron.
2. **Outbound (Bridge)** — Above Deck exposes NMEA/Victron/sensor data as Matter devices. HomeKit, Google Home, and Alexa can read boat status and control boat systems.

---

## Part 4: PWA Limitations with Smart Home

### What a PWA Cannot Do

| Capability | PWA Support | Why |
|-----------|:-:|---------|
| Discover HomeKit accessories | No | HAP is a native Apple framework, not a web API |
| Control HomeKit devices | No | No browser access to HomeKit |
| Discover Google Home devices | No | Google Home APIs are native Android/iOS SDKs |
| Control Alexa devices | No | Alexa APIs are cloud-based with OAuth, not browser-accessible |
| Discover Matter devices on local network | No | Matter commissioning requires mDNS, PASE crypto, certificate management |
| Commission Matter devices | No | Requires native platform APIs (Thread, BLE for commissioning) |
| Access Siri or Google Assistant | No | Voice assistants are native-only |
| Run smart home automations | No | Automation engines run on hubs, not in browsers |

### Why the Browser Sandbox Prevents Integration

1. **No raw network access** — HAP and Matter use mDNS discovery and custom TCP connections. Browsers cannot perform mDNS queries or open arbitrary TCP sockets.
2. **No BLE commissioning** — Matter device commissioning often uses BLE. iOS Safari does not support Web Bluetooth at all. Chrome supports Web Bluetooth but not the specific GATT profiles needed for Matter.
3. **No cryptographic pairing** — HAP's SRP pairing and Matter's SPAKE2+ (PASE) require protocol-level crypto exchanges that browsers cannot participate in.
4. **No persistent background process** — Smart home bridges must run continuously to respond to ecosystem queries. Service Workers cannot maintain persistent TCP connections or run indefinitely.
5. **No platform API access** — HomeKit (iOS), Google Home SDK (Android), and Alexa SDK are native-only frameworks.

### Workarounds That Do Work

#### 1. Above Deck Server as Matter Bridge (Primary Strategy)

```
PWA ←→ WebSocket ←→ Above Deck Go Server ←→ Matter Bridge ←→ HomeKit/Google/Alexa
```

The PWA controls boat systems through the Go server over WebSocket. The Go server independently runs a Matter bridge that exposes the same data to smart home ecosystems. The PWA does not need to interact with smart home protocols — the server handles both interfaces.

**Advantages:**
- PWA stays thin — no native dependencies
- Works on all browsers and platforms
- Matter bridge runs 24/7 on the server regardless of whether the PWA is open
- One codebase, two access paths (PWA + smart home apps)

#### 2. Native App Wrapper via Capacitor (Secondary Strategy)

A Capacitor wrapper around the PWA could access native HomeKit APIs on iOS:

- **HomeKit framework** — Full accessory discovery, control, and automation via Swift
- **Siri Shortcuts** — Register custom voice commands ("Hey Siri, check the bilge")
- **Background processing** — Maintain connections without browser limitations
- **Push notifications** — Reliable alerts for boat alarms

However, this requires building and maintaining a custom Capacitor plugin that wraps Apple's HomeKit framework. It also only covers Apple — not Google Home or Alexa. This is a lower priority than the Matter bridge approach.

#### 3. Google Home REST API (Cloud-Based)

Google provides a HomeGraph REST API for cloud-to-cloud integrations. A web app could theoretically call this API with proper OAuth authentication. However, this requires:
- Registering as a Google Smart Home Action
- Cloud infrastructure for the fulfillment endpoint
- Internet connectivity (useless offshore)
- Complex OAuth flow

Not recommended for Above Deck. Matter local control is superior.

#### 4. Home Assistant as Middleware

If a sailor already runs Home Assistant, the Above Deck Go server can push data to HA via MQTT. Home Assistant then bridges to HomeKit/Google/Alexa through its existing integrations. This is a zero-cost integration for Above Deck — just publish MQTT topics in the right format.

---

## Part 5: What CAN Work from a PWA

Despite the smart home limitations, PWAs retain useful capabilities for the Above Deck use case.

### Web Bluetooth (Limited)

| Platform | Support | Limitations |
|----------|---------|-------------|
| Chrome (Android) | Yes | Cannot scan for all devices; user must select from picker |
| Chrome (Desktop) | Yes | Same picker limitation |
| Safari (iOS/iPadOS) | No | Not supported at all |
| Firefox | No | Not supported |

**Use case:** On Android, the PWA could directly read BLE sensors (Victron, temperature) without the Go server. Not viable on iOS — the primary tablet platform.

### WebSocket to Local Server

The primary data path. Works on all platforms, all browsers.

```
PWA ←→ WebSocket ←→ Go Server (local network)
```

- Real-time instrument data (NMEA, Victron, Matter sensors)
- Command relay (turn on lights, acknowledge alarms)
- Full bidirectional communication
- Works offline (local network, no internet needed)

### Push Notifications

| Platform | Support | Requirement |
|----------|---------|-------------|
| Chrome (Android) | Yes | Service Worker + VAPID keys |
| Safari (iOS 16.4+) | Yes | PWA must be installed (added to home screen) |
| Chrome (Desktop) | Yes | Service Worker |

**Use case:** Alert when boat alarm triggers (bilge pump, anchor drag, battery low). The Go server sends a push notification via web push protocol. Works even when the PWA is not actively open (on Android; limited on iOS).

### Service Worker Background Processing

Limited but useful:

- **Cache management** — Pre-cache chart tiles, weather data
- **Push event handling** — Receive and display alarm notifications
- **Background Sync (Android only)** — Queue commands while offline, send when reconnected

Cannot maintain persistent WebSocket connections or run Matter protocol in the background.

---

## Part 6: Homebridge / HAP-NodeJS Pattern Analysis

### How Homebridge Works

```
┌─────────────────────────────────────────────────────┐
│                 Apple Home App                        │
│           (discovers via mDNS/Bonjour)               │
└───────────────────────┬─────────────────────────────┘
                        │ HAP (encrypted HTTP/TCP)
┌───────────────────────┴─────────────────────────────┐
│              Homebridge (Node.js server)              │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │          HAP-NodeJS Core Library                │  │
│  │  - mDNS/DNS-SD advertisement                   │  │
│  │  - SRP pairing                                 │  │
│  │  - Encrypted session management                │  │
│  │  - Accessory/Service/Characteristic model      │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐              │
│  │Plugin A │  │Plugin B │  │Plugin C │  ...          │
│  │(Ring)   │  │(Nest)   │  │(MQTT)   │              │
│  └────┬────┘  └────┬────┘  └────┬────┘              │
│       │            │            │                    │
└───────┼────────────┼────────────┼────────────────────┘
        │            │            │
    [Ring API]   [Nest API]   [MQTT broker]
```

1. Homebridge starts and loads plugins
2. Each plugin registers accessories with services and characteristics
3. HAP-NodeJS advertises the bridge on the local network via mDNS
4. User pairs with the bridge in the Home app using the setup code
5. Home app discovers all child accessories through the bridge
6. When the user reads state or sends commands, HAP-NodeJS routes to the appropriate plugin
7. Plugins translate between HomeKit and the actual device API

### Could Above Deck's Go Server Replace Homebridge?

Yes, using **brutella/hap** (Go HAP implementation):

```go
// Conceptual: exposing cabin temperature to HomeKit
bridge := accessory.NewBridge(accessory.Info{Name: "Above Deck"})

cabinTemp := accessory.NewTemperatureSensor(accessory.Info{
    Name: "Cabin Temperature",
})
cabinTemp.TempSensor.CurrentTemperature.SetValue(22.5)

server, _ := hap.NewServer(hap.NewFsStore("./db"), bridge.A, cabinTemp.A)
server.ListenAndServe(ctx)
```

This would make cabin temperature appear in Apple Home. But it only covers HomeKit — not Google Home or Alexa. The same effort invested in a Matter bridge covers all three.

### Recommendation: Matter Over HAP

| Factor | HAP (brutella/hap) | Matter |
|--------|-------------------|--------|
| Ecosystem coverage | Apple HomeKit only | HomeKit + Google Home + Alexa + SmartThings + HA |
| Go library maturity | Mature (brutella/hap) | Early (gomat, custom implementation) |
| Implementation effort | Lower | Higher |
| Standards body | Apple proprietary (MFi for commercial) | Open standard (CSA) |
| Future-proofing | Apple may deprecate HAP in favour of Matter | Industry standard, growing |
| Commercial licensing | MFi required for commercial HAP devices | No licensing required |

**Verdict:** Matter is the right investment. HAP via brutella/hap is a viable fallback if Matter implementation takes too long, but it should not be the primary strategy.

---

## Part 7: Home Assistant Integration

### Home Assistant as an Alternative Hub

Many sailors already run Home Assistant (often on the same Raspberry Pi as SignalK). For these users, Above Deck should integrate with HA rather than replace it.

### Integration Architecture: MQTT Bridge

```
Above Deck Go Server
    │
    ├── MQTT publish: above-deck/cabin/temperature → 22.5
    ├── MQTT publish: above-deck/bilge/aft/status → "dry"
    ├── MQTT publish: above-deck/battery/house/soc → 78
    ├── MQTT publish: above-deck/solar/production → 450
    │
    └── MQTT subscribe: above-deck/lighting/cabin/set → on/off
                         above-deck/lighting/nav/set → on/off

Home Assistant
    │
    ├── MQTT integration (auto-discovers Above Deck topics)
    ├── Exposes to HomeKit (via HomeKit Bridge integration)
    ├── Exposes to Google Home (via Nabu Casa / manual)
    ├── Exposes to Alexa (via Nabu Casa / manual)
    └── Exposes as Matter devices (via Matterbridge add-on)
```

**MQTT auto-discovery:** Home Assistant supports MQTT auto-discovery. If Above Deck publishes device configuration in the correct format on `homeassistant/sensor/...` topics, HA will automatically create entities for all boat systems — zero manual configuration for the sailor.

### BBN OS Precedent

BBN OS (Bareboat Necessities) already bridges SignalK to Home Assistant via MQTT:

1. SignalK reads NMEA 0183/2000 data from the boat network
2. signalk-mqtt-bridge plugin publishes SignalK paths as MQTT topics
3. Mosquitto MQTT broker runs locally
4. Home Assistant subscribes to MQTT topics
5. Home Assistant exposes boat data to HomeKit/Google/Alexa

This proves the pattern works. Above Deck improves on it by:
- Publishing MQTT directly from the Go server (no SignalK dependency)
- Using MQTT auto-discovery format (zero config in HA)
- Exposing a richer data set (Matter sensors + NMEA + Victron in one stream)

### Matterbridge

**Matterbridge** is a Node.js-based Matter bridge plugin manager. It can expose Home Assistant entities, Zigbee2MQTT devices, Shelly devices, and more as Matter accessories. Runs on devices with as little as 512MB RAM.

If Above Deck publishes via MQTT, Matterbridge can pick up those topics and expose them as Matter devices — without Above Deck implementing Matter itself. This is a lower-effort alternative:

```
Above Deck Go Server → MQTT → Matterbridge → Matter → HomeKit/Google/Alexa
```

The downside: adds a Node.js dependency (Matterbridge). The upside: works today, proven, and buys time to build the native Go Matter bridge.

---

## Part 8: Voice Control Opportunities

### Voice Assistants via Smart Home Ecosystems

If Above Deck exposes boat systems as Matter devices, voice control comes for free:

| Voice Assistant | Trigger | Example | Requires |
|----------------|---------|---------|----------|
| Siri | "Hey Siri, ..." | "Hey Siri, what's the cabin temperature?" | HomePod or iPhone on boat WiFi |
| Google Assistant | "Hey Google, ..." | "Hey Google, turn off the cabin lights" | Nest speaker/hub on boat WiFi |
| Alexa | "Alexa, ..." | "Alexa, what's the battery level?" | Echo device on boat WiFi |

**Requirements:** A smart home hub device on the boat's local network, and internet connectivity for cloud-based voice processing (Siri, Google, Alexa all require internet for speech recognition).

### Offline Voice: The d3kOS Approach

d3kOS implements a fully offline voice pipeline:

```
Microphone (16kHz)
    → PocketSphinx (wake word "Helm") — <500ms
    → Vosk (speech-to-text) — <1s
    → Phi-2 via llama.cpp (AI reasoning) — <1s
    → Piper (text-to-speech) — <500ms
    → Speaker output
```

**Total latency:** ~2-3 seconds from wake word to spoken response. All processing on a Raspberry Pi 4, no internet required.

### Which Approach is Better for Boats?

| Factor | Cloud Voice (Siri/Google/Alexa) | Offline Voice (Vosk/Piper) |
|--------|:-------------------------------:|:--------------------------:|
| Internet required | Yes | No |
| Works offshore | No | Yes |
| Works at dock (with WiFi) | Yes | Yes |
| Setup complexity | Low (consumer hardware) | High (Raspberry Pi + configuration) |
| Voice recognition quality | Excellent | Good (improving, language-dependent) |
| Ecosystem integration | Native (controls all smart home) | Custom (Above Deck commands only) |
| Hardware cost | USD 50-150 (smart speaker) | USD 10-30 (USB microphone + speaker) |
| Maintenance | Zero (cloud-managed) | Self-managed (model updates) |
| Privacy | Voice sent to cloud | Fully local |

**Recommendation for Above Deck:**

- **Priority 1 (docked):** Matter bridge enables Siri/Google/Alexa voice for free. Most sailors have a smart speaker. Zero development effort for voice — it comes with the smart home integration.
- **Priority 2 (offshore):** Investigate offline voice as a future feature. The d3kOS pattern (Vosk + Piper) is proven on Pi hardware. This would be a Go service wrapping Vosk's C library or using its gRPC/WebSocket API.
- **Do not build both simultaneously.** Matter bridge first. Offline voice is a separate, later project.

---

## Part 9: Recommendations for Above Deck

### Priority 1: Matter Bridge in Go Server

**What:** The Go server exposes boat systems (NMEA, Victron, Matter sensors) as a Matter bridge device on the local network.

**Why:** One implementation gives access to HomeKit, Google Home, Alexa, SmartThings, and Home Assistant simultaneously. Multi-admin means a single bridge can be paired with all ecosystems at once.

**Implementation path:**
1. Use `gomat` (github.com/tom-code/gomat) as reference for Matter protocol in Go
2. Implement bridge device type with relevant clusters (Temperature, Humidity, Contact Sensor, On/Off, Power Source, Electrical Measurement)
3. Test against `connectedhomeip` virtual devices in CI
4. Commission to Apple Home, Google Home, and Alexa for end-to-end validation

**Estimated scope:** 3,000-5,000 lines of Go (see [Matter Protocol research](./matter-protocol-iot-integration.md) for detailed breakdown).

### Priority 2: MQTT for Home Assistant Integration

**What:** Publish boat data as MQTT topics with Home Assistant auto-discovery format.

**Why:** Cheap, proven, works today. Many sailors already run Home Assistant. MQTT auto-discovery means zero configuration in HA. Through HA's existing bridges, boat data reaches HomeKit/Google/Alexa even before the native Matter bridge is built.

**Implementation effort:** Low. Add MQTT publish to existing adapters. Format messages per HA MQTT discovery spec.

**Timeline advantage:** Can ship immediately while Matter bridge is in development. Sailors with Home Assistant get smart home integration from day one.

### Priority 3: HAP via brutella/hap (Fallback)

**What:** If Matter implementation timeline is too long, use brutella/hap to expose boat systems directly to HomeKit.

**Why:** Mature Go library, well-documented, Apache 2.0 license. Gets HomeKit working quickly.

**Limitation:** Only covers Apple HomeKit. Would need separate integrations for Google Home and Alexa.

**When to trigger:** If Matter bridge is more than 6 months away from shipping and users are requesting HomeKit integration.

### PWA Strategy: Unchanged

The PWA remains the primary user interface. Smart home integration happens entirely through the Go server. The PWA does not need to interact with HomeKit, Google Home, or Alexa — it connects to the same Go server that the Matter bridge connects to.

```
User at the helm:     PWA → WebSocket → Go Server → Instruments
User on the couch:    Apple Home → Matter → Go Server → Instruments
User asks Siri:       Siri → HomeKit → Matter → Go Server → Instruments
User abroad:          Apple Home (remote) → iCloud → HomePod → Matter → Go Server
```

All paths lead to the same Go server and the same data model. The PWA and smart home ecosystems are parallel access methods, not competing approaches.

### Implementation Roadmap

| Phase | Deliverable | Effort | Prerequisite |
|-------|------------|--------|-------------|
| 1 | MQTT publish with HA auto-discovery | 1-2 weeks | MQTT adapter in Go server |
| 2 | Matter controller (inbound — read sensors) | 4-6 weeks | Go Matter protocol implementation |
| 3 | Matter bridge (outbound — expose to ecosystems) | 4-6 weeks | Phase 2 controller working |
| 4 | Multi-admin commissioning (all ecosystems) | 2-3 weeks | Phase 3 bridge working |
| 5 | HAP fallback via brutella/hap (if needed) | 2-3 weeks | Only if Phase 3 is delayed |
| 6 | Offline voice (Vosk + Piper) | 6-8 weeks | Independent of other phases |

### Summary Decision Matrix

| Integration | Covers | Effort | Internet | Recommendation |
|-------------|--------|--------|----------|---------------|
| Matter bridge (Go) | HomeKit + Google + Alexa + SmartThings + HA | High | No (local) | Primary strategy |
| MQTT → Home Assistant | HomeKit + Google + Alexa (via HA bridges) | Low | No (local) | Ship first, bridge to Matter |
| HAP via brutella/hap | HomeKit only | Medium | No (local) | Fallback if Matter is delayed |
| Google Home REST API | Google Home only | Medium | Yes (cloud) | Not recommended |
| Alexa Smart Home Skill | Alexa only | Medium | Yes (cloud) | Not recommended |
| Capacitor + HomeKit | HomeKit only (iOS native) | High | No | Not recommended (native lock-in) |
| Matterbridge (Node.js) | All via Matter | Low | No (local) | Alternative if avoiding Go Matter |

---

## Sources

### Apple HomeKit / HAP
- [HomeKit Communication Security — Apple Support](https://support.apple.com/guide/security/communication-security-sec3a881ccb1/web)
- [Complete HomeKit Guide — LinkdHome](https://linkdhome.com/articles/complete-homekit-guide)
- [brutella/hap — Go HAP Implementation](https://github.com/brutella/hap)
- [HAP-NodeJS — Homebridge Wiki](https://github.com/homebridge/HAP-NodeJS/wiki/HomeKit-Terminology)
- [HAP-NodeJS GitHub](https://github.com/homebridge/HAP-NodeJS)
- [Homebridge — Add Any Device to HomeKit](https://www.addtohomekit.com/blog/homebridge/)
- [HomeKit API — Apple Developer](https://developer.apple.com/documentation/homekit)

### Google Home
- [Google Home APIs — Developer Documentation](https://developers.home.google.com/apis)
- [Build the Future of Home with Google Home APIs — Google Blog](https://developers.googleblog.com/en/build-the-future-of-home-with-google-home-apis/)
- [Home APIs: Enabling All Developers — Google Blog](https://developers.googleblog.com/en/home-apis-enabling-all-developers-to-build-for-the-home/)
- [Matter on Google Home — Developer Documentation](https://developers.home.google.com/matter)
- [HomeGraph REST API — Google](https://developers.home.google.com/reference/home-graph/rest)
- [Google Home 2026 Setup Guide — OnOff.gr](https://www.onoff.gr/blog/en/smart-home/google-home-2026-complete-setup-guide/)

### Amazon Alexa
- [Connect Your Device to Alexa with Matter — Alexa Developer](https://developer.amazon.com/en-US/docs/alexa/smarthome/matter-support.html)
- [Build Matter with Alexa — Amazon Developer](https://developer.amazon.com/en-US/alexa/matter)
- [Alexa Smart Home Development Options](https://developer.amazon.com/en-US/docs/alexa/smarthome/development-options.html)
- [Amazon Enhanced Device Development with ESP32-C6](https://developer.amazon.com/en-US/blogs/alexa/device-makers/2026/03/enhanced-device-development-capabilities)

### Samsung SmartThings
- [SmartThings x Matter Integration — SmartThings Support](https://support.smartthings.com/hc/en-us/articles/11219700390804-SmartThings-x-Matter-Integration)
- [Connect Matter Devices with SmartThings](https://partners.smartthings.com/matter)
- [SmartThings First to Support Matter 1.5 — matter-smarthome.de](https://matter-smarthome.de/en/products/smartthings-is-the-first-platform-to-support-matter-1-5/)

### Home Assistant
- [Home Assistant Matter Integration](https://www.home-assistant.io/integrations/matter/)
- [Home Assistant HomeKit Bridge Integration](https://www.home-assistant.io/integrations/homekit/)
- [Home Assistant Alexa Smart Home](https://www.home-assistant.io/integrations/alexa.smart_home/)
- [Expose HA Devices via Matter Hub — SmartHomeScene](https://smarthomescene.com/guides/exposing-home-assistant-entities-as-matter-devices/)
- [Home Assistant Matter Hub — GitHub](https://github.com/t0bst4r/home-assistant-matter-hub)

### Matter Protocol
- [Matter Multi-Admin — CSA-IOT](https://csa-iot.org/newsroom/matter-multi-admin/)
- [Matter Multi-Admin Guide — Matter Alpha](https://www.matteralpha.com/how-to/matter-multi-admin-share-devices-across-ecosystems)
- [Multi-Admin Sharing — Silicon Labs](https://docs.silabs.com/matter/latest/matter-ecosystems/multicontroller-ecosystem)
- [What is a Matter Controller — matter-smarthome.de](https://matter-smarthome.de/en/know-how/what-is-a-matter-controller/)

### Matterbridge
- [Matterbridge — Matter Plugin Manager](https://matterbridge.io/)
- [Matterbridge GitHub](https://github.com/Luligu/matterbridge)
- [4 Reasons Matterbridge is the Best HA Add-on — XDA](https://www.xda-developers.com/matterbridge-best-home-assistant-add-on/)

### Marine / BBN OS
- [BBN Marine OS — Bareboat Necessities](https://bareboat-necessities.wixsite.com/my-bareboat)
- [Bridging SignalK and Home Assistant via MQTT — HA Community](https://community.home-assistant.io/t/bridging-signalk-server-nmea-and-home-assistant-using-signalk-mqtt-bridge-and-mosquitto-mqtt/642640)
- [NMEA 0183 to Home Assistant — Smart Boat Innovations](https://smartboatinnovations.com/nmea-0183-home-assistant-wifi-signal-k-serial/)
- [d3kOS GitHub](https://github.com/SkipperDon/d3kOS)

### PWA Limitations
- [PWA iOS Limitations and Safari Support 2026 — MagicBell](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [PWAs on iOS 2025 — Medium](https://ravi6997.medium.com/pwas-on-ios-in-2025-why-your-web-app-might-beat-native-0b1c35acf845)
- [Web Bluetooth Browser Support — BeaconZone](https://www.beaconzone.co.uk/blog/browser-support-for-web-bluetooth/)
- [Capacitor Documentation](https://capacitorjs.com/docs/ios)

### Voice / Offline
- [Vosk Offline Speech Recognition API](https://alphacephei.com/vosk/)
- [Piper TTS Offline on Raspberry Pi — rmauro.dev](https://rmauro.dev/how-to-run-piper-tts-on-your-raspberry-pi-offline-voice-zero-internet-needed/)
- [Faster Local Voice AI — GitHub](https://github.com/m15-ai/Faster-Local-Voice-AI)
