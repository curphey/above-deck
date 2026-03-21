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
| Price | $$$$ | $$$$ | $$$$ | $$ | $$ | Free | Free | Free-$ | **Free** |
