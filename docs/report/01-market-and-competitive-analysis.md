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
| **Navigation / Chartplotters** | Savvy Navvy, Navionics, Orca, iSailor, SEAiq, TZ iBoat | $15-3,000/yr | All boaters |
| **Weather Routing** | PredictWind, FastSeas, SailGrib, Squid Sailing | Free-$499/yr | Offshore / passage sailors |
| **Community / Social** | Navily, SeaPeople, Argo, ActiveCaptain (Garmin) | Free-$20/yr | Cruisers, charter sailors |
| **Open-Source Platforms** | OpenCPN, OpenPlotter, BBN OS, SignalK, d3kOS | Free | Tech-forward sailors, DIY community |

### Key Trends

1. **Subscription fatigue.** Navionics increased prices 233% since Garmin's acquisition (from ~$15/yr to $50-100/yr). Komoot's shift to subscriptions provoked articles titled "Komoot confirms we don't want any new customers." Users are actively seeking alternatives.

2. **iPad as chartplotter.** 20-25% of cruisers use an iPad as their primary chartplotter, and 50-60% use one for planning/backup. The $400-800 iPad running Navionics or Orca is increasingly replacing $2,000-4,000 marine MFDs.

3. **Starlink has changed everything.** 40-50% of active cruisers now have Starlink. It has largely replaced SSB radio for weather, email, and social connection. This ubiquitous connectivity enables cloud-native marine apps in ways that were impossible even three years ago.

4. **Open-source marine ecosystem is growing.** Signal K (the JSON-based marine data standard), OpenPlotter, and BBN OS prove there is a significant DIY community willing to build their own systems. Hundreds of boats run OpenPlotter. The community is technically competent but underserved by polished software.

5. **AI entering the space.** PredictWind has AI-powered 5D polars and GMDSS text parsing. Ditch Navigation uses AIS data to learn real boating patterns. d3kOS has offline voice control. But genuine AI integration remains mostly vapourware -- the opportunity to do it properly is wide open.

6. **Weather apps converging with route planning.** Windy.app has launched sailing routes (beta). PredictWind added basic charts. The boundaries between weather, navigation, and planning are blurring.

---

## 3. Commercial Competitors

### Full Competitor Overview

| App | Best For | Price/yr | Chart Quality | Weather Routing | UI/UX | Offline | Social/Community |
|-----|----------|----------|--------------|----------------|-------|---------|-----------------|
| **Savvy Navvy** | Casual boaters | $80-189 | Good | Basic (Elite) | Great | Partial | None |
| **PredictWind** | Offshore routing | $29-499 | Basic | Excellent | OK | Partial | None |
| **Orca** | Modern sailing | Free-EUR 148 | Good | Good | Best | Yes | None |
| **Navionics** | Charts/depth data | $40-100 | Excellent | No | Dated | Yes | ActiveCaptain |
| **Navily** | Anchorage reviews | Free-EUR 20 | Weak | No | Good | Premium | Best-in-class |
| **FastSeas** | Budget routing | Free/donations | N/A | Good | Clean | No | None |
| **SailGrib** | Offline routing | EUR 46 | Good | Yes | Dated | Yes | None |
| **TZ iBoat** | Power users | $20-3,000 | Excellent | Good | Complex | Yes | None |
| **iSailor** | Chart accuracy | Varies | Excellent | No | Clean | Yes | None |
| **SEAiq** | Professionals | $10-250 | BYO charts | No | Functional | Yes | None |
| **Ditch Navigation** | AI routing (power) | Freemium | Good | No | Good | Yes | None |
| **Keeano** | Med trip planning | Free | Basic | No | Good | No | Small |
| **SeaPeople** | Social/logging | Free/Premium | None | No | Good | No | Strong |
| **Wavve** | Waze for boats | Free | Good | No | Good | Partial | Moderate |
| **SailTies** | Crew collaboration | Unknown | Basic | No | Basic | No | Moderate |

### Top 5 Narrative

#### Savvy Navvy -- "Google Maps for Boats"

Savvy Navvy is the most visible sailing-specific app, with 3+ million downloads and a 4.7/5 App Store rating. Founded by ex-Google employees, it nailed the "make sailing navigation simple" message. Its killer features are Smart Routing (factoring wind, tides, depth, and boat specs), Course To Steer (auto-adjusting heading for currents), and the Departure Scheduler (visual comparison of departure windows every 30 minutes).

But the cracks are significant. Android is described by users as "simply does not work" -- planning functions fail, offline downloads die between 40-80%, and GPS tracking shows straight lines. Experienced sailors criticise route accuracy, particularly in tidal waters ("can route you metres away from a hazard on a lee shore"). Chart detail is "massively lacking compared to Navionics." Tidal data has been reported as "at least 2 hours wrong" on the Thames. And the pricing structure aggressively gates basic features: tidal heights require Explore ($145/yr), tidal streams require Elite ($150/yr), and offline charts have no Essential tier access at all.

The core tension: Savvy Navvy's simplification that makes it accessible to beginners actively concerns experienced sailors who need chart detail and routing precision. At 3-10x the price of Navionics, it needs to justify the premium.

**Pricing tiers (US):**

| Tier | Annual Price | Key Gated Features |
|------|-------------|-------------------|
| Free | $0 | 36hr weather, basic routing |
| Essential | $79.99/yr | Smart routing, 4-day weather, AIS (3nm only) |
| Explore | $144.99/yr | Offline charts, GPX export, departure scheduler, 14-day weather |
| Elite | $149.99/yr | Tidal streams, ECMWF weather, NMEA Connect, anchor alarm, unlimited AIS |

**Strategic direction:** Savvy Navvy is pivoting toward OEM/B2B partnerships (Avikus, CPAC Systems, Actisense, RAD Propulsion). Their "Savvy Integrated" product embeds the app into boat helm displays. They are positioning as "integrated navigation OS" rather than just an app, with heavy US market focus.

#### PredictWind -- Weather Routing Leader

PredictWind owns the offshore weather routing space. It is the tool favoured by ocean racers and serious passage sailors. Its genuine differentiator is running up to six weather models simultaneously (ECMWF, AIFS, ICON, UKMO, GFS + proprietary PWAi/PWG/PWE), with the Professional tier adding AI-powered 5D polars that account for wind, wave height, swell periods, size, and boat speed. It is the only private company generating 1km resolution forecasts (using CSIRO CCAM technology).

PredictWind also has the strongest offshore story: compressed GRIB downloads over Iridium GO!, AI-parsed GMDSS text alerts, over-the-horizon satellite AIS, and a DataHub hardware device ($349-699) that combines GPS, WiFi, NMEA, satellite, AIS, and autopilot routing.

The weaknesses are predictable: it is not a full chartplotter (just weather routing with basic chart overlay), the interface has a steep learning curve, useful tiers cost $249-499/yr, and there are no social or community features whatsoever.

**Pricing:**

| Tier | Annual | Key Capability |
|------|--------|---------------|
| Free | $0 | 11 forecast models, basic AIS |
| Basic | $29/yr | Lightning, 1km wind, rain radar, alerts |
| Standard | $249/yr | Weather routing, departure planning, tidal currents, satellite AIS |
| Professional | $499/yr | Ocean currents in routing, AI Polars, 3D hull modeling |

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

But Garmin's acquisition has poisoned the well. Prices jumped from ~$15/yr to $40-100/yr (a 233-300% increase). Users report paid downloaded maps being turned off without warning -- "genuinely dangerous." The popular Sonar view was removed. ActiveCaptain, originally an independent community database with 166,000+ reviews, has been locked into Garmin's ecosystem. Forum sentiment: "ActiveCaptain USED TO BE great. Now it's Garmin's play-thing / cash cow. And it's crap."

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

OpenPlotter is a complete Linux distribution that turns a Raspberry Pi into a marine electronics hub. It bundles Signal K Server, OpenCPN, AvNav (web-based charts), pypilot (open-source autopilot), Node-RED (visual automation), and support for NMEA 0183, NMEA 2000, and Seatalk via the MacArthur HAT (~$80).

It is the most complete open-source marine platform and has proven itself on hundreds of boats. A ~$125 Raspberry Pi setup replaces $2,000-5,000 of commercial electronics.

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
| Price/yr | $80-189 | $29-499 | Free-EUR 148 | Free-EUR 20 | Free | Free |

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
The market has bifurcated into free (limited) and expensive ($80-150/yr). An open-source platform with a strong free tier and reasonable optional premium is the structural disruption opportunity.

### Gap 10: Modern UX + Open-Source Web Chartplotter
No good open-source web-based chartplotter exists. OpenCPN is desktop C++. AvNav is web-accessible but basic. Nothing has the UI quality of Orca with the openness of OpenCPN.

### Additional Strategic Gaps
- **ActiveCaptain-style community data is locked in Garmin's ecosystem.** The community is unhappy. An open alternative with community-owned data would have immediate appeal.
- **Weather routing is either expensive (PredictWind $249/yr) or basic (FastSeas/GFS only).** A free, multi-model weather routing tool would be genuinely disruptive.
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
| Navigation (MFD/plotter) | $500 (iPad) | $1,500-3,000 | $5,000-10,000 |
| Autopilot | $1,500 | $2,500-3,500 | $4,000-7,000 |
| Radar | $0 | $1,500-2,500 | $3,000-5,000 |
| AIS | $200 (rx only) | $400-800 | $800-1,200 |
| Instruments | $500 | $1,000-2,000 | $2,000-4,000 |
| Communications | $300 | $500-1,000 | $1,500-3,000 |
| Electrical (Victron/solar) | $1,000 | $2,500-4,000 | $5,000-10,000 |
| **TOTAL** | **$4,300** | **$10,500-17,600** | **$23,400-47,000** |

**Where they invest:** autopilot (directly affects quality of life), safety equipment, batteries/charging (Victron dominates), Starlink.
**Where they save:** chartplotter (iPad is "good enough"), instruments (older gear works), installation labour (strong DIY culture).

### What They Want

Synthesised from Cruisers Forum, Sailing Anarchy, Panbo, and sailing YouTube:

1. **One screen that shows everything** -- battery state, weather, navigation, engine data, without switching between 4 apps and devices
2. **Phone/tablet as primary interface** -- "Why do I need a $3,000 marine display when my iPad is better?"
3. **Cross-brand integration** -- "I have Garmin charts, Raymarine autopilot, B&G wind, and Victron power. Nothing talks to everything."
4. **Open data access** -- "It's my data from my sensors on my boat. Let me access it."
5. **Better weather routing** -- accessible, accurate, without expensive subscriptions
6. **Remote monitoring** -- check batteries, bilge, anchor alarm from shore
7. **Low power consumption** -- every watt matters off-grid

### Victron: The De Facto Cruiser Electrical Standard

Victron Energy has achieved a dominant position for power management among cruising sailors, with open protocols (VE.Direct, VE.Bus, Modbus TCP), a central hub (Cerbo GX with MQTT, Signal K, and web dashboard), and a cloud portal (VRM). A typical cruising sailboat has $1,500-3,000 of Victron hardware. This is the single highest-value integration target for Above Deck -- power monitoring and solar planning validation from the hardware most cruisers already own.

### Networking Tiers

| Tier | Description | Prevalence |
|------|------------|------------|
| Basic | Phone hotspot, no onboard WiFi, basic NMEA 0183 | Most coastal cruisers |
| Connected | Starlink/cellular router, MFD WiFi, iPad for charts | Active cruisers |
| Integrated | Marine router (Peplink), Signal K on Raspberry Pi, all instruments on WiFi | Tech-forward cruisers |

### Open-Source Cost Advantage

| Solution | Replaces | Savings | Adoption |
|----------|----------|---------|----------|
| OpenCPN | TimeZero, Navionics (desktop) | $200-500/yr | Medium-high |
| Signal K | Proprietary instrument bridges | $200-500 | Growing |
| OpenPlotter | Integrated nav system | $1,000-3,000 | Niche but enthusiastic |
| pypilot | Commercial autopilot | $1,000-3,000 | Small but dedicated |

A complete Raspberry Pi + Signal K + OpenCPN setup costs ~$150-300 in hardware, replacing $2,000-5,000 in commercial equivalents. The trade-off is setup time and technical skill -- exactly the gap Above Deck aims to close.

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
| Savvy Navvy | No (credit card req.) | $80/yr | $145/yr | $189/yr |
| PredictWind | Yes (useless) | $29/yr | $249/yr | $499/yr |
| Navionics | No | $40/yr (USA) | $50/yr (US+CA) | $100/yr (worldwide) |
| Orca | Yes (app free) | EUR 49/yr | EUR 149/yr | EUR 148/yr (combined) |
| Komoot | Yes (1 region) | EUR 59/yr | -- | -- |
| RideWithGPS | Yes | $60/yr | $80/yr | Club (unlisted) |
| FastSeas | Yes (5 req/month) | Donations | -- | -- |
| SailGrib | No | EUR 46/yr | -- | -- |
| SeaPeople | Yes | PLUS (unlisted) | PATRON (unlisted) | -- |
| Navily | Yes | EUR 19.99/yr | -- | -- |
| SEAiq | 7-day trial | $10 (USA) | $20 (Open) | $250 (Pilot) |
| TimeZero | No | $20/yr (mobile) | $500-800 | $3,000 (Professional) |
| OpenCPN | Fully free | -- | -- | -- |

### Pricing Observations

1. **Free tier is essential for adoption.** Savvy Navvy requiring a credit card to trial drives away potential users. Orca's free app with paid add-ons is a better model.

2. **$60-80/yr is the sweet spot** for a mid-tier subscription. Below that is commodity; above that triggers subscription fatigue.

3. **Aggressive tier-gating destroys trust.** Savvy Navvy locking tides behind premium, and Navionics' 233% price increase since acquisition, are the most common complaints across all forums.

4. **Nickel-and-dime models frustrate.** iSailor's per-chart, per-feature purchasing quickly exceeds subscription alternatives.

5. **The market has bifurcated** into free-but-limited and expensive ($80-150/yr). A well-executed open-source platform with a strong free tier is structurally disruptive.

### Above Deck's Open-Source Advantage

Above Deck's free/open-source positioning is not just a pricing strategy -- it is a structural competitive advantage in a market where:

- Garmin is alienating Navionics users with price hikes and data lock-in
- Komoot proved that paywalling previously-free features triggers community revolt
- The DIY sailing community values openness and is technically literate enough to verify claims
- Community data (anchorage reviews, hazard reports) has massive value that increases with openness, not restriction
- ActiveCaptain's journey from beloved open community to "Garmin's cash cow" is a cautionary tale that resonates deeply with sailors

The "replace $5K of marine electronics with open-source software" argument already drives adoption of OpenPlotter and BBN OS. Above Deck needs to make that argument while delivering a dramatically better user experience.

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
