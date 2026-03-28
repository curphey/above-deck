# Above Deck — Product Vision & Design

**Date:** 2026-03-26
**Status:** Draft v2
**License:** GPL — foundation-owned, community-driven

---

## 0. Background

This project started with buying a boat. When I began looking at the software available to sailors — for charts, passage planning, weather, boat management, energy systems — I found a fragmented landscape of mediocre apps. You need one app for charts, another for weather, another for tides, another for boat management, and none of them talk to each other. The commercial options charge $80-500/year and still don't cover everything. The open-source alternatives (OpenCPN, SignalK) are capable but dated — 2010-era UIs, complex setup, desktop-only, no mobile, no AI, no social.

I'm a senior engineer. I've built open-source communities before. I think I can do significantly better than what exists, and I want a side project that's completely separate from my day job — something I'm personally passionate about that solves a real problem I have as a sailor.

Above Deck is that project. It's not a startup, not a business, not a career move. It's a passion project to build the software I wish existed for my own boat, and to give it away to the sailing community for free.

---

## 1. Vision

Above Deck is an open-source end-to-end platform for sailing boats — the infrastructure, the operating system, and the applications.

It provides a complete ecosystem that connects to a boat's instruments, sensors, and systems through off-the-shelf hardware gateways, runs an on-board OS that unifies all boat data, hosts cloud infrastructure for services that need it, and delivers a suite of sailing applications and AI agents that monitor, alert, and assist.

The architecture is hub and spoke:

**The Hub (Platform Infrastructure)** — central cloud services. Authentication and identity, OTA updates, weather/tide data proxy, RAG databases (cruising almanac, manufacturer data, pilot books, regulations), user and boat profile storage, community data, hosted apps. The hub serves browser users directly and syncs with on-board spokes when they connect.

**The Spokes (On-Board OS)** — each boat runs its own instance of the OS on dedicated hardware (Mac Mini or similar). Hardware abstraction, unified data model, monitoring services, alert engine, communications, security, plugin system. Works 100% offline. Syncs with the hub when internet is available — pulling down RAG updates, almanac changes, weather data, and pushing up logbook entries, community contributions, position reports.

**Apps** — chartplotter, passage planner, energy planner, VHF radio simulator, anchor watch, instrument dashboard, logbook, engine monitor, AI agents, and more. Each app runs inside a composable MFD shell (inspired by Raymarine Axiom 2). Apps include reusable components — notably the AI crew (five specialist agents with both visual dashboards and chat interfaces, plus the Watchman orchestrator that manages agent lifecycle and inter-agent routing). Apps run on the hub (browser access), on the spoke (on-board), or both.

**Community Site** — the public-facing web presence. Marketing, blog, knowledge base, community forums and chat. Consumes the hub for auth and data but is otherwise a separate concern.

### Use what you need

The platform is a complete suite but you don't have to use all of it.

**Hosted online** — many tools work directly from a browser with no hardware and no install. Weather, tides, passage planning, energy planner, cruising almanac, VHF simulator, social features. Create a free account to save configurations, build passage plans, sync collections, share routes, and access community features. Tools are usable without an account, but an account unlocks persistence and personalisation.

**On the boat** — run the full platform on dedicated hardware, connected to instruments via gateways. This gives you everything: live chartplotter with real position, instrument displays, radar overlay, boat management, engine monitoring, tank levels, digital switching, anchor watch, safety systems, AI agents watching your systems 24/7, remote monitoring. Plus all the tools that are available online also run locally for offline use at sea.

The tools that are available online also integrate with the on-board platform when it's there — the passage planner factors in your actual battery capacity, the energy planner knows your real solar setup, the Navigator agent has your boat's instrument data. But they never require it. You start wherever is useful and go deeper when you're ready.

---

## 2. Principles

### Always free, always open source (GPL)

No paid tiers. No premium features. No ads. No data selling. This is a foundation-owned project, not a company. If infrastructure costs grow, fund through donations or usage-based models, never paywalls. The sailing software market charges $80-500/year for tools that should be free.

### Solo builder, by design

Built by one person — a senior engineer who understands how to build open-source communities that last. Building solo with AI (Claude as a development partner) is a deliberate choice. No committee decisions, no compromise on quality, no feature bloat from stakeholder pressure. One person with clear vision ships better software than a team with conflicting priorities.

The project welcomes community input — feature requests, bug reports, feedback, and discussion. An SDK will be available for developers who want to build on the platform. The codebase is open and forkable. But pull requests won't be accepted during active development — this keeps the architecture coherent and the pace fast. Contributors can fork and track, and as the platform matures, contribution paths will open up.

### AI-first

AI is the platform's identity, not a feature bolted on later. Every design decision asks "how do the agents use this?" Features are tools that agents wield. The chat interface is as important as the visual UI. The AI crew knows your boat, your route, your systems, and your preferences. They collaborate like a real crew — Navigator asks Engineer about fuel range, Pilot tells Navigator about port approach hazards.

### Social-first

Sailing is social. The platform connects sailors to each other as a core design principle. Friend tracking via AIS, shared routes, anchorage reviews, rally fleet coordination, crew matching. Every tool is better when connected to a community of sailors sharing knowledge and experiences.

### Built for sailors, not engineers

Navigation and charting tools assume sailing competence — the user understands nautical concepts, can read a chart, and knows what a tidal gate is. These tools respect the user's intelligence and don't over-simplify.

Boat management is different. A non-technical partner should be able to check tank levels, log a maintenance task, or review the energy dashboard without training. Boat management is the "anyone can use it" tier — simple, intuitive, zero learning curve.

Under the hood and in power mode, the engineering is designed to be admired by technical people — clean architecture, modern stack, well-documented APIs, an SDK worth building on. But that's the iceberg below the waterline.

### Design matters

UX is first-class. Sailors deserve software with the same care and craft as the best consumer apps. Information-dense but never cluttered. Progressive disclosure — simple surfaces that reveal depth on interaction.

### Modern technology

Built with current best-in-class tools and frameworks, not legacy technology from 2005. The sailing software market is full of outdated desktop apps that have been incrementally patched for decades. Above Deck starts fresh with a modern stack — cloud-native, AI-integrated, mobile-first.

### Unified platform

One platform, not five apps. Sailors currently cobble together separate tools for charts, weather, tides, boat management, and communication. Above Deck integrates everything — tools share data, agents reason across all of it, and the user experience is seamless.

---

## 3. Architecture

- **Offline first-class** — every tool works without connectivity. The on-board deployment is the primary product. Cloud sync when available, never required.
- **Hardware-agnostic, gateway-first** — the OS does not speak NMEA directly. Dedicated marine gateways handle electrical/protocol complexity and expose clean TCP/UDP data streams. Works with any gateway vendor. SignalK supported as an adapter, not a dependency. Runs anywhere Docker runs on the server side, PWA on the front end.
- **Hosting-agnostic** — cloud-native platform infrastructure with simple deployments to any provider. No vendor lock-in.
- **Own data model** — full control over the schema, optimised for our tools and AI queries. SignalK compatibility as an adapter for interoperability.
- **Plugin architecture** — open plugin system for MFD screens, protocol adapters, data model extensions, and AI capabilities. MCP server exposes the entire platform data model to external AI systems and third-party tools.
- **Single-binary backend** — no runtime dependencies, excellent concurrency for real-time instrument data, minimal operational overhead.
- **Social authentication** — sign in with Google (Apple Sign In added post-launch). No passwords to manage.
- **Multi-surface** — same platform accessible from dedicated MFD display, laptop, tablet, phone. Different form factors, same platform.
- **Performance and reliability** — modern architecture throughout, built for real-time instrument data and 24/7 unattended operation on the boat.
- **SDK** — public SDK for developers to build apps, plugins, and integrations on the platform.

---

## 3.1 Engineering Style

- Quality over speed
- Test-driven development
- Simple over clever
- Secure by default
- Minimal dependencies
- Observable — when something breaks at sea, you need to know what and why

---

## 4. Who It's For

Coastal cruisers and bluewater sailors on monohulls and catamarans. People planning circumnavigations, multi-year ocean exploration, retirement voyages — not just weekend day trips.

This also includes aspirational sailors 6-18 months before departure — people researching obsessively, planning circumnavigations or multi-year trips, buying equipment, and preparing. They're the "dream" entry point: they use the online tools (passage planner, energy sizer, cruising almanac) long before they leave the dock.

These sailors:

- Plan multi-day passages across oceans and coastlines
- Plan circumnavigations and multi-year ocean exploration voyages
- Need weather windows, tidal gates, seasonal timing, and safe overnight stops
- Lose internet for days or weeks at sea
- Value community knowledge about anchorages, harbours, and hazards
- Currently cobble together 3-5 different apps
- Many have Victron electrical systems, NMEA instruments, AIS transponders
- Want modern software that respects their intelligence

Not for powerboats, charter tourists, or racing.

---

## 5. The Landscape

The marine software market breaks into four categories. Full analysis with product-by-product detail is in `docs/research/competitive/competitive-landscape.md`.

### Commercial Navigation & Weather

Savvy Navvy, PredictWind, Navionics (Garmin), Orca, FastSeas, Windy. Each does one thing well — routing, weather, or charts — at $80-500/year. None offer boat management, AI agents, offline-first operation, or instrument integration. No single product covers navigation + weather + passage planning + boat systems.

### Community & Social

Navily, SeaPeople, Noforeignland, 45 Degrees, Keeano. Strong on POIs, reviews, and social tracking. None offer navigation, charting, or boat management. The social and the tools live in separate worlds.

### Open Source

OpenCPN (chartplotter, 2010 UI, desktop-only), SignalK (data standard, Node.js, fragile on Pi), OpenPlotter (Pi integration, DIY), YachtOS (emerging boat OS). Capable but dated tools. None offer a modern, unified, AI-first platform.

### Unified Boat OS

Zora by iNav4U — unified boat OS for yachts 40ft+, hardware + software, shipping April 2026, ~$650. Closest to Above Deck's vision but hardware-locked and not open source.

### Hardware MFDs

Raymarine (Axiom 2 — our UX inspiration), Garmin (OneHelm), Simrad/B&G (Navico), Furuno (NavNet). Beautiful hardware at $2-5K per display, each a walled garden locked to one vendor's ecosystem. Above Deck builds the platform layer that makes the hardware irrelevant.

### Hardware Gateways & Sensors

Off-the-shelf gateways from Digital Yacht, Yacht Devices, Actisense, Hat Labs, and others bridge NMEA 2000, Victron, BLE sensors, and SDR receivers to TCP/UDP. Prices range from ~$30 (RTL-SDR) to ~$350 (full NMEA router). The OS is designed to work with any of them. Full gateway inventory and integration notes in `docs/research/hardware/hardware-connectivity-technologies.md` and `docs/research/hardware/sailor-hardware-landscape.md`.

### What's Missing

No existing tool — commercial, open source, or hardware — provides:

1. **A platform OS** — unified authentication, shared data model, cross-tool data sharing, plugin architecture, and AI runtime as foundational services that all apps consume
2. An AI crew that reasons across all boat data and proactively assists
3. Modern UX with the quality of Raymarine Axiom but running on any screen
4. Offline-first operation with seamless cloud sync
5. Free and open source with no vendor lock-in
6. Community-driven data (routes, anchorages, hazards) integrated into every tool

Every existing product is either a single-purpose app or a hardware-locked ecosystem. Nobody has built the operating system layer — the shared infrastructure of auth, data model, AI agents, offline sync, and plugin architecture that connects everything. Above Deck builds that layer.

---

## 6. Feature Inventory

### Tier 1 — Core Navigation

#### 6.1 Charts & Navigation

- Chartplotter with open-source vector chart rendering
- NOAA ENC (S-57) chart data for US waters (free)
- OpenSeaMap overlay for global coverage
- Hazard overlays — rocks, wrecks, shallow water, restricted areas
- AIS vessel tracking — live positions from on-board receiver or remote AIS data feed
- AIS vessel details — tap for MMSI, name, course, speed, CPA/TCPA
- Chart layers — bathymetry, shipping lanes, traffic separation schemes, marine protected areas
- Depth contours and soundings
- Crowdsourced bathymetry — users contribute sonar data, collectively improve depth maps
- Satellite imagery overlay for anchorages, reefs, approaches
- Radar overlay — render radar data on chart
- Forward-looking depth display from transducer data
- GPS position, heading, speed, course display
- Course to steer (CTS) — computed heading accounting for tidal set/drift and leeway
- Cross-track error monitoring — distance off planned track
- Bearing and distance tools
- Track recording and playback
- Chart bookmarks and user annotations
- Augmented reality overlay — camera feed with AIS targets and chart features
- GPX import/export (compatible with all major chartplotters)
- Autopilot status display and control integration

#### 6.2 Route Planning

- Autorouting — automatic route calculation considering depth, hazards, weather, tides
- Route creation with waypoints on chart
- Multi-leg voyage planning — split passages into daily legs with overnight stops
- Auto-suggest stopping points based on distance, daylight, and POI database
- Bolt holes / ports of refuge identified along route for contingency
- Distance, bearing, and ETA calculations per leg
- Colour-coded route lines per day/leg
- Day-by-day itinerary view with timeline
- Pre-departure checklist — automated and customisable
- Weather routing with boat polars (isochrone method)
- Route library — curated shareable routes (community contributed)
- Planned vs actual route comparison
- Passage difficulty rating — multi-factor system

#### 6.3 Departure & Timing

- Weather window identification — best departure in next 7 days
- Tidal gate calculation — when you can pass through tidal channels
- Departure timing tool — optimal leave time considering weather, tides, daylight
- Seasonal timing awareness — cruising seasons, cyclone seasons, monsoons, trade winds

#### 6.4 Passage Resources

- Passage energy forecast — solar generation and power consumption per day along route
- Fuel planning — motoring vs sailing estimates from wind forecast, fuel burn calculation, refuelling stop suggestions
- Water planning — crew consumption, watermaker production, tank capacity vs demand
- Provisioning calculator — water, food, fuel for passage duration
- Watch schedule generator — crew rotation planning
- Passage resource summary — unified fuel + water + energy + engine hours view
- Engine hours cross-referenced with service schedule (warning if service due during passage)

#### 6.5 Circumnavigation Planning

- Multi-year route planning (3, 4, 5+ year itineraries)
- Seasonal timing gates — be in the right ocean basin at the right time
- Cyclone season avoidance
- Trade wind and monsoon routing
- Cruising season data per region
- Year-by-year breakdown with key waypoints and timing constraints

#### 6.6 Weather

- Wind, waves, swell, visibility, sea surface temperature along route
- Animated wind overlay on chart
- Hour-by-hour weather timeline per leg
- GRIB file viewer and overlay
- Multi-model weather comparison — GFS, ECMWF (now open CC-BY-4.0), ICON side-by-side
- Barometric pressure trend and history
- Lightning / thunderstorm risk display (CAPE values)
- Tropical cyclone / storm tracking — storm cones, wind radius overlays
- Weather fax reception and display (via SDR)
- NAVTEX message reception and display (via SDR)
- Satellite communicator integration — Iridium GO, Garmin inReach, Zoleo for offshore GRIB downloads
- SSB/HF weather net schedule — frequencies and times for sailing area
- Historical weather patterns for seasonal planning
- Weather alerts — conditions diverge from forecast

#### 6.7 Tides & Currents

- Tidal predictions at waypoints and harbours
- Tidal height graphs
- Current flow data and direction
- Tidal gate warnings
- Tidal stream atlas overlay on chart
- Harmonic prediction (client-side)
- Tidal data services (US waters initially, expanding globally)

#### 6.8 Cruising Administration

- Country entry/exit procedures — required documents, check-in process, customs, immigration, health
- Port clearance tracking — checked in, checked out, timestamps, officials dealt with
- Visa requirements by nationality and destination
- Cruising permit requirements per country/region
- Document checklist per country — boat registration, insurance certificates, crew list, passports, zarpe/despacho
- Fees and charges — customs fees, cruising taxes, marine park fees by country
- Flag state requirements — what your boat's flag state demands
- Animal quarantine rules (for boats with pets)
- Firearms declaration requirements by country
- Medication/prescription rules by country
- Insurance requirements per country/region — mandatory coverage types, minimum limits, accepted providers
- Insurance certificate tracking — policy details, expiry dates, renewal reminders, proof-of-insurance documents
- Agent/handler recommendations per port
- Community-contributed updates — regulations change frequently, sailors report current reality
- Integration with passage planner — surface entry requirements for destination country

#### 6.9 Cruising Almanac

The digital equivalent of Imray pilot books, Reeds Almanac, and Noonsite — a comprehensive, searchable, community-maintained reference that powers the entire platform.

**Content:**

- Harbours and marinas — approach notes, VHF channels, berth availability, facilities, fuel, water, shore power, WiFi
- Anchorages — position, depth, holding, seabed type, shelter from wind directions, swell exposure, landing points
- Moorings — visitor moorings, mooring buoys, costs, booking info
- Points of interest — chandleries, provisioning, restaurants, bars, laundry, medical, transport links
- Port plans and approach diagrams
- Tidal information per location
- Local regulations — speed limits, no-anchor zones, discharge restrictions
- Seasonal notes — best time to visit, crowding, weather patterns
- Community reviews, ratings, and photos per location
- Verified visit requirement — you must have been there to review
- Search and filter — by location, facilities, shelter, depth, distance from route
- Data seeded from open sources (OpenStreetMap, NOAA, Global Fishing Watch anchorages)

**Community-curated on the site:**

- Sailors add, update, and review locations via the community site
- Moderation and quality controls — community voting, flagging, verified visits
- Structured data with rich metadata — not just freeform text
- Anyone can contribute, no account needed to browse

**Platform data layer:**

The almanac isn't just a standalone reference — it's a shared data layer that powers other apps and agents:

- **RAG for AI agents** — the Pilot agent queries the almanac when recommending anchorages, the Navigator uses it for stop suggestions, the Bosun checks provisioning availability at ports
- **Synced to on-board OS** — downloaded by region for offline access at sea. Updated when connectivity is available.
- **Chartplotter integration** — POIs displayed on chart, tap for full almanac detail
- **Passage planner integration** — suggested stops pulled from almanac, facilities matched to crew needs
- **Cruising administration integration** — almanac entries link to country entry requirements, customs procedures
- **Maritime intelligence integration** — recent hazard reports and incidents surfaced alongside almanac entries
- **Equipment/manufacturer RAG** — almanac data about chandleries and service providers cross-references with boat equipment for relevant spare parts and service availability

#### 6.10 Maritime Intelligence

- Live event feed — orca interactions, piracy incidents, SAR operations, port closures, navigational warnings
- Historical event database — searchable, filterable by type, date range, region
- Chart overlay — toggle event types on/off on the chartplotter
- Heatmaps — density visualisation of incidents over time (piracy hotspots, orca interaction zones)
- NAVAREA warnings and notices to mariners
- Community-reported hazards — floating debris, uncharted obstacles, dragging moorings
- Alerts — notify when approaching an area with recent incidents
- Sources — official maritime safety reports, community contributions, NAVTEX, coast guard notices
- Integration with passage planner — flag risks along planned route

### Tier 2 — Boat Systems

#### 6.11 Boat Management

- Boat profile keyed to MMSI
- Vessel specs — dimensions, draft, displacement, rig type, hull type
- Boat model templates — select model, factory equipment pre-populated, community-growable
- Equipment registry organised by system (propulsion, electrical, water, safety, navigation, rigging, plumbing)
- Equipment detail — make, model, serial number, install date, service intervals, parts lists
- Equipment spec templates — popular engines, watermakers, panels auto-populate details
- Service tracking with alerts ("engine oil change due in 47 hours")
- Service history log per equipment item
- Maintenance scheduling — recurring tasks, one-off tasks, seasonal tasks
- Predictive maintenance insights
- Boat plan view — interactive SVG with system zones (power, fluids, drive, climate, bilges)
- Document storage — manuals, certificates, insurance, registration
- Inventory management — spares, consumables, safety equipment with expiry tracking

**Engine subsystem:**

- RPM, oil pressure, coolant temperature, exhaust temperature
- Fuel consumption rate and total
- Engine hours tracking
- Transmission status
- Electric engine support (current, battery capacity)
- Engine presets for common manufacturers
- Multi-engine support

**Tank subsystem:**

- Fuel, fresh water, black/grey water, LPG
- Visual tank level display
- Consumption rate and time remaining
- Refill alerts and history

**Watermaker subsystem:**

- Output rate, runtime, production totals
- Power draw monitoring
- Filter/membrane service tracking

#### 6.12 Energy & Power

- System sizer — input consumers and usage, output recommended battery bank + solar wattage
- Generation calculator — solar generation based on panel specs, location, time of year
- Daily energy balance chart
- Victron integration — battery SOC, solar yield, consumption
- Battery monitoring — voltage, current, state of charge, time remaining, charge cycles
- Solar monitoring — panel output, daily yield, efficiency
- Shore power status
- Alternator and charger monitoring
- Inverter load and status
- Per-circuit monitoring via digital switching systems
- Historical graphs — daily, weekly, monthly energy trends

#### 6.13 Digital Switching & Home Automation

The boat is a home. Treat it like one.

- Lighting control — cabin, navigation, anchor, courtesy, underwater
- Lighting scenes — "movie night", "night passage", "at anchor", "docked"
- HVAC — air conditioning and heating, target/actual temperature, mode, fan speed, schedules
- Pump control — bilge, freshwater, washdown
- Windlass control
- Thruster control
- Per-circuit state (on/off/dimming), current draw, fault detection
- Entertainment — audio zones, volume, source selection
- Appliance control — watermaker, fridge/freezer, washing machine, water heater
- Integration with CZone, EmpirBus, Mastervolt digital switching on NMEA 2000
- Matter/Thread protocol support for off-the-shelf smart home devices
- DIY path — ESP32 relay boards with current sensors
- Automation rules — scheduled on/off, trigger-based (e.g. bilge pump on water detection, lights off at sunrise, HVAC pre-cool before arrival)
- Geofence triggers — actions on departure/arrival (e.g. switch to anchor profile when hook is down)
- Voice control via AI agents — "Engineer, turn off the watermaker"
- Remote control via app — switch lights, check HVAC, start watermaker from anywhere

#### 6.14 Instrument Dashboard

- Configurable gauge displays — analog, digital, bar, tape
- Wind — true and apparent, direction and speed
- Depth with shallow water alarm
- Speed — through water and over ground
- Heading — magnetic and true
- Course over ground
- Log — trip and total distance
- Environmental — air temp, water temp, humidity, barometric pressure
- Heel and trim (attitude data)
- Refrigerator / freezer temperature
- Customisable layouts — choose which instruments, arrange freely
- Visual battery and tank overview

#### 6.15 Cameras & Visual Monitoring

- IP camera integration — engine room, cockpit, anchor, mast, stern
- Live camera feeds as MFD app tiles (single or multi-camera grid)
- Camera feeds in split view alongside charts, instruments, or anchor watch
- Motion detection alerts — engine room activity, cockpit intrusion
- Time-lapse recording — anchor watch overnight, passage highlights
- Night vision / infrared camera support
- Snapshot capture with GPS and timestamp metadata
- Camera feeds available via remote monitoring (view from anywhere)
- Foundation for AR overlay — camera feed with AIS targets, chart features, and navigation data composited on screen

### Tier 3 — Underway Experience

#### 6.16 Anchor Watch

- GPS drag alarm with configurable radius
- Auto-calculated optimal radius from depth and scope
- Anchor position marker with swing circle on chart
- Depth monitoring
- Wind and current awareness
- Alerts — local alarm, push notification, SMS via mobile network
- Anchor position history
- Drag distance and direction tracking
- Night mode display

#### 6.17 Safety & Emergency

- MOB (Man Overboard) — marks GPS position, alerts crew/group, starts timer
- Emergency contacts — one-tap alert with position
- Check-in schedule — regular check-in times, alert if missed
- Passage plan filed with shore contact
- CO detection alerts from sensor on NMEA 2000
- Bilge monitoring — pump activity, current draw, run duration/frequency, dry-running detection, high water alert
- Fire/smoke detection integration
- Pre-departure safety checklist

#### 6.18 Network Security

**Security scanner (on-demand audit):**

- One-tap security audit of the boat's entire network — like a Nessus scan for boats
- WiFi security — open networks, weak passwords, rogue access points, WPS enabled
- NMEA 2000 audit — enumerate all devices, check against certified product database, flag unknown devices
- CAN bus access — identify unprotected entry points, gateways with no authentication
- Victron/IoT — default passwords, exposed management interfaces, unencrypted protocols
- Bluetooth — discoverable devices, unsecured pairing
- Report card — simple red/amber/green rating with plain-language recommendations
- Shareable PDF report

**Continuous monitoring (always-on):**

- NMEA 2000 device fingerprinting, anomaly detection, rogue device alerts
- Deep packet inspection on every PGN
- Baseline learning and anomaly scoring
- CAN bus replay detection — sequence analysis, timing anomaly detection
- GPS spoofing detection — cross-reference position against multiple sources
- Network topology mapping — visual graph of all devices and data flows
- Firmware version tracking
- Audit logging — full forensic detail
- Alerting — push notifications on security events

#### 6.19 Logbook

- Digital ship's log — auto-populated from instruments at configurable intervals
- Manual log entries — sail changes, events, notes, crew observations
- Photos pinned to route locations with GPS
- Weather conditions recorded at each entry
- Passage statistics — distance, average speed, max speed, sailing ratio
- Passage composition breakdown — open water vs coastal vs channel vs harbour approach
- Legal-grade log format
- Export to PDF
- Sailing CV — cumulative miles, passages, roles

#### 6.20 Remote Monitoring

- Cloud access to all boat data when internet available
- Position, course, speed, depth — real-time from anywhere
- All instrument data accessible remotely
- Historical data analysis and trends
- Configurable alerts with push notifications
- Grant access to family, friends, technicians
- Offline buffering on boat, auto-uploads when reconnected

### Tier 4 — Community & Social

#### 6.21 Profiles & Groups

- User profiles — name, photo, location, bio, sailing experience, certifications
- Privacy controls — granular per section (private/group/public)
- Boat profiles linked to users
- Groups — boat crew, yacht clubs, rally fleets, friends
- Verified visit requirement for POI reviews

#### 6.22 Social & Sharing

- Strava for sailing — track and share passages, days at sea, miles logged, activity feed, season summaries
- Route library — curated shareable routes, user ratings and reviews, fork routes
- Community POIs — anchorage reviews, marina ratings, hazard reports, local knowledge
- Heatmap of sailing tracks — "where sailors actually go"
- Friend tracking — see where friends are via AIS, opt-in position sharing
- Live beacon sharing — web link for family/friends, no account needed
- Fleet coordination — live positions of all boats in a group on one map
- Buddy boat pairing — two boats tracking each other
- Share to social media — post passages, logs, photos to Instagram, Facebook, YouTube
- Live streaming integration — stream cockpit/sailing footage
- Shareable passage reports — generated summaries with route, stats, photos for posting

#### 6.23 Messaging

- Direct messaging — person to person
- Boat to boat messaging — tied to vessel profile
- Group chat — yacht club, rally fleet, harbour/anchorage
- Location-based hails — VHF-style digital hails visible on map, expiring

### Tier 5 — Intelligence & Learning

#### 6.24 AI Agents

Five specialist agents, each an OS-level service with both a visual dashboard and a chat interface, plus the Watchman orchestrator which manages agent lifecycle and inter-agent routing (not a user-facing chat agent):

**Watchman (Orchestrator)** — 24-hour watch. Coordinates other agents. Monitors all data streams, triages alerts, escalates to specialists. The agent you talk to when you don't know which agent to ask. Routes questions to the right specialist.

**Navigator** — route planning, weather analysis, tidal gates, departure timing, circumnavigation planning. Data access: charts, weather, tides, cruising seasons.

**Engineer** — boat systems, power management, engine monitoring, maintenance scheduling, fault diagnosis. Data access: NMEA 2000 sensors, Victron, engine data, service records.

**Radio Operator** — VHF procedures, DSC, AIS interpretation, vessel identification. Data access: AIS feed, VHF channels, MMSI database. Already built as VHF simulator.

**Bosun** — provisioning, checklists, watch schedules, anchor watch, inventory management. Data access: crew data, inventory, GPS/anchor position, stores.

**Pilot** — local knowledge, port info, customs procedures, marina recommendations, approach notes. Data access: POI database, community reviews, port databases, cruising guides, insurance requirements.

Agents collaborate — Navigator asks Engineer about fuel range, Pilot tells Navigator about port approach hazards. Each agent has:

- Specialised knowledge (RAG) — pilot books, local waters, weather, regulations, manufacturer data
- Unique personality and communication style
- Domain-specific tools — AIS lookup, weather API, tidal data, berth availability
- Continuous monitoring of relevant data streams
- Proactive alerting — they watch and warn, not just respond

#### 6.25 Learning & Training

- VHF radio simulator with regional scenarios and instructor feedback (built)
- Solar/energy planner — equipment sizing and consumption modelling (built)
- Knowledge base — curated how-to guides
- Research board — community-driven investigations
- In-app contextual help system — tooltips, guided tours
- COLREGs and navigation exam prep (future)

### Tier 6 — Platform Operations

#### 6.26 MFD Shell

- Composable app grid home screen with live thumbnail previews
- Split views — any two apps side by side with adjustable ratio
- Persistent status bar — position, time, connectivity, alarms across all apps
- Night mode / red light mode (global)
- Responsive — 7" to 27" displays

#### 6.27 Admin & Platform

- User management — view, search, suspend, delete accounts
- Role management — moderators, community contributors
- Content moderation — review queue, spam detection, automated and manual
- Analytics — usage, content performance, community health (privacy-respecting, self-hosted)
- OTA update system — version management, rollback
- System health monitoring
- NMEA 2000 network diagnostics — device listing, PGN analysis, health reports

#### 6.28 Plugin Architecture

- Add new MFD screens (apps)
- Add new protocol adapters (hardware support)
- Extend the data model (new sensor types, new paths)
- Add new AI capabilities (agent tools, RAG sources)
- MCP server — exposes the entire platform data model to external AI systems and third-party tools
- Third-party developers can build and distribute plugins

---

## 7. OS Platform Services

The OS layer provides services that apps consume. Apps never talk to hardware directly — they talk to the OS.

### Data Model

Above Deck defines its own unified data model covering:

- **Navigation** — position, heading, speed, course, depth, wind
- **Electrical** — batteries, solar, chargers, inverters, alternators
- **Loads** — per-circuit state (on/off/dimming), current draw, fault detection. Covers lighting (cabin, navigation, anchor, courtesy, underwater), refrigeration, watermaker, windlass, thrusters, pumps, entertainment
- **HVAC** — air conditioning and heating: target/actual temperature, mode (cooling/heating/auto/off), fan speed
- **Propulsion** — engines, transmissions, fuel
- **Tanks** — fuel, water, holding, LPG
- **Environment** — temperature, humidity, pressure, sea state (cabin and exterior)
- **Steering** — rudder, autopilot
- **Notifications** — alarms, alerts, thresholds

### Hardware Abstraction

The OS consumes data from hardware gateways over TCP/UDP. Protocol adapters translate gateway-specific formats into the unified data model. Supports NMEA 0183, NMEA 2000, Victron, AIS, BLE sensors, SignalK, radar, SDR, and more. Detail in the technical architecture document.

### Monitoring Service

Watches all data streams continuously. Evaluates configurable threshold rules and triggers alerts. Examples:

- Battery voltage drops below 12.0V
- Bilge pump activates more than 3 times per hour
- Depth below configured minimum
- Engine coolant temperature exceeds limit
- Wind speed exceeds threshold
- Anchor drag detected
- CO levels detected
- Circuit fault on digital switching

### Alert Engine

Multi-channel alerting:

- Visual alerts in MFD shell (persistent status bar, popup)
- Audible alarm on boat
- Push notification to phone
- SMS via mobile network (when available)
- Email notification
- Alert to designated emergency contacts
- Escalation rules — if not acknowledged within X minutes, escalate

### Communications Service

Handles messaging between users, boats, groups, and agents. Bridges on-board comms with cloud-based messaging when connectivity is available.

### Security Service

NMEA 2000 network monitoring, device fingerprinting, anomaly detection, audit logging. Watches all traffic flowing through the hardware abstraction layer. See section 6.18 for detailed features.

### AI Agent Runtime

Hosts the six specialist agents. Provides:

- Agent lifecycle management (start, stop, restart)
- Data stream subscriptions — agents subscribe to relevant data paths
- Tool registry — agents can invoke tools (weather API, chart lookup, AIS query)
- RAG pipeline — agents query specialised knowledge bases
- Inter-agent communication — agents can consult each other
- Chat interface routing — user messages routed to appropriate agent

### Plugin System

Third-party extensions register with the OS:

- **Screen plugins** — new MFD apps
- **Adapter plugins** — new hardware protocol support
- **Data model plugins** — new sensor types and data paths
- **AI plugins** — new agent tools and RAG sources
- **MCP server** — exposes the entire data model to external AI systems

### SignalK Integration

Above Deck is not built on SignalK but fully supports it as a compatibility layer:

- **Inbound** — consume data from existing SignalK servers (via iKommunicate or SignalK on Raspberry Pi). For boats that already have a SignalK installation, Above Deck can read from it without replacing it.
- **Outbound** — expose Above Deck's data model as a SignalK-compatible endpoint. Existing SignalK apps and dashboards can connect to Above Deck as if it were a SignalK server.
- **Plugin ecosystem** — SignalK has a large plugin library. Where useful, Above Deck can consume data from SignalK plugins without reimplementing them.
- **Migration path** — for sailors moving from SignalK to Above Deck, both can run side-by-side during transition. No rip-and-replace required.

---

## 8. Hardware Integration

### Recommended Gateway Setup

The OS is designed to work with off-the-shelf marine hardware gateways. A typical installation:

**Minimum (NMEA 2000 boat):**
- Digital Yacht iKonvert USB (£186) — NMEA 2000 to USB, open protocol
- RTL-SDR v4 (~$30) — AIS reception if no AIS transponder

**Recommended (full integration):**
- Digital Yacht NavLink2 (£240) — NMEA 2000 to WiFi (wireless access from any device)
- Digital Yacht veLink (£210) — bridges Victron battery/solar ecosystem to NMEA 2000
- Digital Yacht NAVLink Blue (£240) — BLE sensor hub (temperature, tanks, wind sensors)
- RTL-SDR v4 (~$30) — AIS, weather fax, NAVTEX reception

**Development (no boat):**
- Digital Yacht iKreate (£240) — NMEA 2000 data simulator

### SDR Integration

A single RTL-SDR dongle (~$30) with appropriate software provides:

| Capability | Software | Output |
|------------|----------|--------|
| AIS vessel tracking | AIS-catcher (open source, C++) | NMEA sentences via UDP/TCP |
| Weather fax | fldigi | HF weather chart images |
| NAVTEX | YanD / Frisnit decoder | Text: weather, nav warnings, maritime safety |
| DSC decode | YADD GMDSS decoder | Digital selective calling messages |

### DIY / ESP32 Path

For sensors and controls not available via commercial gateways:

- ESP32 + CAN transceiver — NMEA 2000 gateway for ~$25
- ESP32 relay boards — digital switching and automation
- ESP32 + current sensors — per-circuit power monitoring
- Hat Labs Sailor Hat ESP32 — marine-grade dev board (~$60)
- BLE sensors (RuuviTag ~$40) — temperature, humidity, pressure anywhere on the boat
- Mopeka tank sensors — ultrasonic tank level via BLE

### Victron Integration

Victron equipment (on 80%+ of cruising boats with solar) integrates via multiple paths:

- **veLink gateway** — bridges Victron BLE devices to NMEA 2000 (SmartShunt, SmartSolar MPPT, Blue Smart chargers, Orion DC-DC)
- **Cerbo GX** — Victron's own hub, exposes all data via MQTT and Modbus TCP
- **VRM cloud API** — remote access to Victron data from anywhere (no hardware on boat needed for monitoring)
- **VE.Direct** — serial connection for direct device access

---

## 9. Community Site

The community site is the public-facing web presence, separate from the boat OS and platform infrastructure.

### Content

- Marketing and landing pages
- Blog — development journal, plans, decisions, behind-the-scenes
- Knowledge base — curated how-to guides for sailing tasks
- Research board — community-driven investigations and comparisons
- Changelog — what's new, tied to releases

### Community

- Forums — threaded discussions by topic
- Community chat
- User-contributed content — POI reviews, route sharing, equipment reviews, research threads

### Integration

- Consumes platform infrastructure for authentication and user data
- Does not host boat data, instrument data, or AI services
- Community-contributed data (POIs, routes, hazard reports) syncs to boat OS when connected

---

## 10. What Differentiates Above Deck

### vs NjordLINK+ (Digital Yacht)

NjordLINK+ is the closest commercial comparison — cloud monitoring, anchor watch, remote access. But it's a walled garden. All data flows through Digital Yacht's Njord cloud. Above Deck provides the same capabilities locally on the boat, optionally synced to your own cloud, fully open source. And Above Deck adds navigation, passage planning, social, AI agents — things NjordLINK+ doesn't touch.

### vs SignalK

SignalK is a data standard and Node.js server. Above Deck is a complete platform. SignalK requires a Raspberry Pi, technical setup, and plugins to do anything useful. Above Deck runs as a Docker container on a Mac Mini with a polished UI. We support SignalK as a compatibility adapter, but we're not built on it.

### vs OpenCPN

OpenCPN is a capable chartplotter with a 2010 UI, desktop-only, no mobile, no cloud, no AI, no social, no boat management. Above Deck is a modern platform that includes a chartplotter alongside everything else.

### vs Savvy Navvy / PredictWind / Orca

Commercial apps that each do one thing well (routing, weather, charts) but cost $80-500/year, don't talk to your boat's instruments, have no boat management, no social beyond basic sharing, and no AI beyond simple suggestions. Above Deck integrates everything, connects to real boat data, has AI agents that reason across all of it, and is free.

### vs Raymarine Axiom / Garmin OneHelm

Beautiful hardware MFDs that cost $2-5K, are locked to one screen, one vendor's ecosystem, and can't do AI or social. Above Deck delivers the same UX quality in software that runs on any screen, any device, with AI and social built in.

### The combination no one else has

1. **Unified** — navigation + boat management + energy + safety + social + AI in one platform
2. **AI crew** — six specialist agents that know your boat and collaborate
3. **Modern UX** — Axiom-quality interface running on any screen
4. **Offline-first** — works at sea without internet
5. **Open source** — free, no vendor lock-in, foundation-owned
6. **Connected** — instruments, sensors, gateways, community data all integrated
7. **Social** — Strava for sailing, community POIs, fleet coordination, messaging
8. **Secure** — NMEA 2000 network security built into the platform

---

## Appendix A: Research Documents

Detailed research supporting this vision is available in the project repository:

### Competitive & Market
- `docs/research/competitive/competitive-landscape.md` — 25+ competitors, market gaps, positioning
- `docs/research/competitive/savvy-navvy-deep-dive.md` — Savvy Navvy analysis
- `docs/research/competitive/predictwind-orca-navily-opencpn-analysis.md` — PredictWind, Orca, Navily, OpenCPN
- `docs/research/competitive/keeano-deep-dive.md` — Keeano analysis
- `docs/research/competitive/apps-and-github-projects.md` — 25+ apps, 30+ GitHub projects

### Technical & Data
- `docs/research/data-and-apis/marine-data-apis.md` — 40+ free marine data endpoints
- `docs/research/data-and-apis/data-source-licenses.md` — Licensing matrix
- `docs/research/navigation-and-weather/fastseas-and-weather-routing-research.md` — Weather routing algorithms
- `docs/research/navigation-and-weather/marine-weather-deep-dive.md` — Weather data sources and patterns
- `docs/research/navigation-and-weather/tides-and-currents.md` — Tidal prediction methods and data
- `docs/research/navigation-and-weather/passage-planning-workflows.md` — APEM framework and planning patterns
- `docs/research/platform-and-architecture/deployment-architecture.md` — Deployment patterns

### Hardware & Connectivity
- `docs/research/hardware/sailor-hardware-landscape.md` — Hardware survey
- `docs/research/hardware/hardware-connectivity-technologies.md` — RPi, ESP32, LoRa, BLE
- `docs/research/hardware/marine-mfd-platforms-and-integrations.md` — MFD vendor platforms
- `docs/research/hardware/can-bus-technology.md` — CAN bus and NMEA 2000
- `docs/research/hardware/mfd-platform-ecosystems.md` — MFD ecosystem comparison
- `docs/research/hardware/raymarine-axiom2-deep-dive.md` — Axiom 2 UX patterns
- `docs/research/platform-and-architecture/carplay-marine-analogy.md` — Multi-surface architecture patterns

### Domain-Specific
- `docs/research/navigation-and-weather/mapping-and-chart-technology.md` — Chart rendering and data
- `docs/research/data-and-apis/solar-energy-research.md` — Solar system fundamentals
- `docs/research/domain/boat-systems-monitoring.md` — Boat systems and monitoring
- `docs/research/ux-and-design/community-platform-patterns.md` — Community platform patterns
- `docs/research/ux-and-design/visual-design-patterns.md` — Design patterns and inspiration
- `docs/research/data-and-apis/vessel-registration-systems.md` — MMSI and vessel identity
- `docs/research/ux-and-design/chartplotter-ui-patterns.md` — Chartplotter UI research
- `docs/research/hardware/smart-home-and-pwa-integration.md` — Smart home and PWA patterns
- `docs/research/competitive/d3kos-and-marine-os-deep-dive.md` — Marine OS platforms

---

## Appendix B: Related Documents

**Technical Architecture** — a separate document covering implementation decisions: data stores (vector DB for RAG, relational DB for structured data, time-series for instruments), backend services, frontend stack, AI/agent framework, deployment topology, offline/sync architecture, hardware abstraction interfaces, and security. API authentication tied to user accounts — the platform is free but APIs require auth to prevent commercial companies scraping community-curated data (almanac, POIs, routes, reviews). See companion document: above-deck-technical-architecture.md
