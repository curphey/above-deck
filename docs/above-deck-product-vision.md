# Above Deck — Product Vision

**Date:** 2026-03-15
**Status:** Draft v3
**License:** GPL — community-driven, personally funded

---

## What Above Deck Is

Above Deck is an open-source sailing platform with three layers:

### 1. Open Boat Management Platform

A unified data model for all boat systems — instruments, power, tanks, engines — with direct hardware integration. Runs as a Docker container on any hardware (Raspberry Pi, NUC, old laptop, NAS). Connects to NMEA 0183/2000, Victron VE.Direct/MQTT/Modbus, CAN bus, AIS, and wireless sensors. Works 100% offline.

This is the foundation. It makes every tool smarter by providing real data from the boat's actual systems.

### 2. Sailing Tools

Chartplotter, passage planner, weather routing, anchor watch, tidal planning, instrument dashboard, logbook. The things you use while actually sailing. These are the core product — practical tools that solve real problems for cruising sailors.

### 3. Learning & Practice Tools

VHF radio simulator, exam prep, reference guides. Useful standalone tools that bring people to the platform.

**Build order:** 3 → 2 → 1. Start with learning tools (already built: VHF simulator, solar planner), then sailing tools (chartplotter next), then the platform layer. But architect for the platform from the start.

---

## Architecture

### Two Deployments

**Community Site (web)** — The public face. Identity and auth hub (Supabase, Google OAuth). Blog, knowledge base, community discussions, user profiles. Lightweight tools (solar planner, VHF trainer) available for casual use without installation. Syncs community data (anchorage reviews, hazard reports, shared routes) to local deployments when connected.

**Platform (Docker)** — The product. Runs locally on the boat or at home. Go server connects to hardware, serves the MFD interface, runs the AI. Works 100% offline at sea. When internet is available, syncs with the community site for identity, community data, and cloud backup.

### Data Model

Above Deck defines its own data model — not SignalK. Full control over the schema, optimised for our tools and AI queries. A SignalK compatibility adapter is available as an optional plugin for interoperability with existing SignalK hardware and clients.

The data model covers:
- **Navigation** — position, heading, speed, course, depth, wind
- **Electrical** — batteries, solar, chargers, inverters, alternators
- **Propulsion** — engines, transmissions, fuel
- **Tanks** — fuel, water, holding, LPG
- **Environment** — temperature, humidity, pressure, sea state
- **Steering** — rudder, autopilot
- **Notifications** — alarms, alerts, thresholds

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

### Plugin Architecture

Others plugin to our software, not the other way around. Plugins can:
- Add new MFD screens (tools)
- Add new protocol adapters (hardware support)
- Extend the data model (new paths/sensors)
- Add new AI capabilities (MCP tools)

### AI Integration

An MCP server exposes the entire data model — instruments, charts, weather, boat config, community data — to AI. This enables cross-system queries no existing tool can answer:

- "Based on my current fuel level and the route to Scilly, do I need to motor?"
- "Given my solar setup and battery state, will I be able to run the watermaker before sunset?"
- "What's the best departure time considering tides, weather, and my need to charge batteries?"

AI is built into the platform from day one, not bolted on.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Backend | Go | Single binary, no runtime dependencies, excellent concurrency for instrument data |
| Frontend | Astro 5 (SSR) + React 19 islands | Fast static pages + rich interactive tools |
| Mapping | MapLibre GL JS | Open source (BSD), self-hostable, no vendor lock-in |
| Charts | NOAA ENC (S-57) + OpenSeaMap | Free, open data |
| Database | Supabase (PostgreSQL + PostGIS) | Auth, real-time, geospatial queries |
| Auth | Supabase Auth (Google OAuth, PKCE) | Community site identity hub |
| State | Zustand 5 (persisted) | Client-side state for tools |
| Styling | Blueprint aesthetic, MFD device frame | Dark mode default, technical drawing precision |
| Weather | Open-Meteo Marine API | Free, global, no API key required |
| AIS (remote) | aisstream.io WebSocket | Free tier for browser-only use |
| Deployment | Docker | Runs on any hardware |
| Testing | Vitest (unit), Playwright (e2e) | TDD workflow |
| Monorepo | pnpm workspaces | `packages/web/`, `packages/api/` |

---

## What Differentiates Above Deck

### 1. Integrated Ecosystem
Tools that work independently but are dramatically better together. The chartplotter knows your battery level. The passage planner factors in your solar capacity. The AI reasons across everything. Like Apple's ecosystem — seamless, coherent, greater than the sum of parts.

### 2. Design-First
Blueprint aesthetic, MFD device frame, obsessive attention to UX. Every tool renders inside a unified marine display with TopBar (voltage, power, GPS, time) and NavBar. Sailors deserve beautiful software — not wxWidgets from 2005.

### 3. Open Source (GPL)
Community-owned. No vendor lock-in, no subscription traps, no paywalled tides. Transparent development. Community-driven roadmap.

### 4. Modern Architecture
Go + React + Docker. Not a desktop app ported to mobile. Not a monolithic C++ binary. Clean, modern, deployable anywhere. Single Docker image runs the entire platform.

### 5. AI-Native
Intelligence built into the platform from day one. MCP server bridges AI to every data source. Not a chatbot bolted onto a map — a platform where AI understands your boat, your route, and your systems.

---

## What Exists Today

| Tool | Status | Layer |
|------|--------|-------|
| VHF Radio Simulator | Built (feature branch) | Learning & Practice |
| Solar/Energy Planner | Built | Learning & Practice |
| MFD Device Frame | Built | Platform UI |
| Go API Server | Built (VHF backend) | Platform |
| Community Site | Built (blog, KB, discussions) | Community |
| Chartplotter | Researched | Sailing Tools |
| Boat Management | Vision defined | Platform |

---

## Tool Suite (Planned)

### Sailing Tools (Layer 2)
- **Chartplotter** — MapLibre + NOAA/OpenSeaMap charts, hazard overlay, AIS
- **Passage Planner** — multi-day route planning, weather windows, tidal gates, crew watch schedules
- **Weather Dashboard** — GRIB viewer, wind/wave forecasts, barometric trend
- **Anchor Watch** — GPS drag alarm, depth monitoring
- **Instrument Dashboard** — depth, wind, speed, heading displays (live from boat data)
- **Logbook** — digital ship's log, auto-populated from instruments, legal-grade

### Learning & Practice Tools (Layer 3)
- **VHF Radio Simulator** — AI-powered radio practice for RYA/ASA exam prep (built)
- **Solar/Energy Planner** — equipment sizing, consumption modelling (built)
- **Maintenance Log** — engine hours, oil changes, rig checks, through-hull inspections
- **Provisioning Calculator** — water/food/fuel planning for passages

### Platform (Layer 1)
- **Data Model** — unified representation of all boat systems
- **Protocol Adapters** — NMEA 0183, NMEA 2000, Victron, MQTT, AIS
- **MCP Server** — AI bridge to all data
- **Plugin System** — screens, adapters, data model extensions
- **SignalK Adapter** — optional compatibility layer

---

## Community Integration

**Decision: TBD** — to be decided before building community features.

Options under consideration:
- Tightly integrated: anchorage reviews on the chartplotter, hazard reports on the map, discussions attached to locations
- Loosely coupled: community site provides data via API, platform consumes it
- Hybrid: some features integrated (reviews, hazards), some separate (blog, KB, discussions)

The community site serves as the identity hub regardless. The question is how deeply community data integrates into the sailing tools.

---

## Target Users

**Primary:** Coastal cruisers and bluewater sailors (monohull and catamaran)
**Not for:** Powerboats, charter tourists, racing

These sailors:
- Plan multi-day passages across oceans and coastlines
- Need weather windows, tidal gates, and safe overnight stops
- Often lose internet for days or weeks at sea
- Value community knowledge about anchorages, harbours, and hazards
- Currently cobble together 3-5 different apps
- Many have Victron electrical systems, NMEA instruments, AIS transponders
- Want beautiful, modern software that respects their intelligence

---

## Principles

1. **Offline is first-class** — every tool must work without internet. The Docker deployment is the primary product, not an afterthought.
2. **Tools work alone** — anyone can use the chartplotter from a phone without installing anything. No forced sign-up, no paywall.
3. **Together is better** — connect tools to the platform and they get smarter. Real battery data improves the energy planner. Live position improves the chartplotter. AI reasons across everything.
4. **Own the data model** — our schema, our API, our identity. SignalK compatibility as an adapter, not a dependency.
5. **No Node on the backend** — Go for all server components. Single binary, no runtime dependencies.
6. **Plugin to us** — others extend our platform, we don't depend on theirs. Open plugin architecture for screens, adapters, and data model extensions.
7. **Design matters** — blueprint aesthetic, MFD device frame, obsessive UX. Sailors deserve better than what exists.
8. **AI from day one** — not bolted on later. The platform is designed for AI to reason across all boat data.
9. **GPL, community-driven** — no commercial agenda. Built by sailors for sailors.

---

## Research

Detailed research supporting this vision:

- `research/navigation-chartplotter-research.md` — Comprehensive landscape survey: commercial tools, open source, chart data, mapping tech, passage planning, community features, AI, environmental data, marine communications standards, hardware connectivity
- `research/market-research.md` — Competitive landscape
- `research/savvy-navvy-deep-dive.md` — Savvy Navvy analysis
- `research/predictwind-orca-navily-opencpn-analysis.md` — Major competitor deep dives
- `research/deep-dive-competitor-analysis.md` — SeaPeople, Komoot, RideWithGPS, FastSeas
- `research/marine-data-apis.md` — Free marine data APIs
- `research/fastseas-and-weather-routing-research.md` — Weather routing algorithms
