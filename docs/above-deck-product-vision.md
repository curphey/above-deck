# Above Deck - Product Vision & Plan

**Date:** 2026-03-08
**Status:** Draft for review (v2)

---

## The Opportunity

There is no "Komoot for Sailing." The sailing app market is fragmented across navigation (Savvy Navvy, Orca), weather routing (PredictWind), community (Navily, SeaPeople, Noforeignland), crew collaboration (SailTies), itinerary building (45 Degrees, Keeano), and open-source charting (OpenCPN). No single tool combines multi-day passage planning, weather-aware routing, community-verified POIs, crew collaboration, and an AI assistant.

Above Deck fills this gap as a free, open-source sailing route planner for coastal cruisers and bluewater passage makers, with an embedded AI agent to help plan passages intelligently.

---

## Who It's For

**Primary:** Coastal cruisers and bluewater/offshore sailors (monohull and catamaran)
**Not for:** Powerboats, charter tourists, racing

These sailors:
- Plan multi-day or multi-week passages across oceans and coastlines
- Need weather windows, tidal gates, and safe overnight stops
- Sail with crew who need to see and contribute to the plan
- Use chartplotters (Garmin, Raymarine, B&G) and need GPX export
- Often lose internet connectivity for days or weeks at sea
- Value community knowledge about anchorages, harbours, and hazards
- Currently cobble together 3-5 different apps to plan a single passage

---

## What Competitors Do Well (and Where They Fall Short)

### Savvy Navvy - "Google Maps for Boats"
**Strength:** Smart routing that factors weather, tides, and boat specs into one optimized route. Departure scheduler comparing 30-minute windows is genuinely unique.
**Weakness:** Chart detail lacking vs Navionics. Routing can be dangerously close to hazards. Tidal data inaccurate in places. Android is significantly worse than iOS. Expensive ($80-150/yr) with aggressive tier-gating. No social features. No multi-day planning.

### PredictWind - "The Weather Oracle"
**Strength:** Best-in-class weather data (11 models including proprietary AI). AI Polars that learn your specific boat. Works offshore via Iridium/Starlink. Professional-grade.
**Weakness:** Steep learning curve. Two separate apps. Expensive ($249-499/yr). No social features. No harbour/anchorage data. Not a planning tool - it's a weather tool.

### Orca - "The Modern Chartplotter"
**Strength:** Beautiful modern UI. Auto-rerouting when conditions change (unique). 96% of routes work without manual waypoints. Cross-platform including Apple Watch. Free app tier.
**Weakness:** Unaware of major tidal gates ("frankly makes it unsafe"). Sail routing needs internet. No GRIB support. No satellite comms. No social or planning features.

### Navily - "The Cruising Guide"
**Strength:** 35,000+ locations, 350,000+ reviews. Best community-driven anchorage database. Marina booking in 700+ European marinas. Cheap (EUR 19.99/yr).
**Weakness:** Not a navigation app. Primarily European. Markup on marina bookings. Requires internet for most features.

### SeaPeople - "Strava for Boats"
**Strength:** Social-first with innovative "Hails" feature (modernized VHF). Live trip sharing. 58K users in 18 months. Backed by Sailing La Vagabonde + former Shopify CTO.
**Weakness:** Deliberately not a navigation or planning app. Android quality poor.

### OpenCPN - "The Linux of Marine Nav"
**Strength:** Fully open source. 40+ plugins. Weather routing plugin is capable. Runs on Raspberry Pi. No subscription required. Beloved by technical cruisers.
**Weakness:** UI from 2010. Mobile is a clunky desktop port. Steep learning curve. No social features. Desktop-first.

### 45 Degrees Sailing - "The Charter Concierge"
**Strength:** Beautiful itinerary UX built on Base44. Day-by-day timeline with stops, times, and notes. POI database with 277 Croatian locations across 10 categories (anchorage, bar, cafe, fuel dock, mooring field, POI, port/marina, provisioning, restaurant, services). Colour-coded daily route lines on map. Local knowledge notes ("Easy refuelling alongside. Good for North sector winds"). Reservation tracking. Client dashboard with "Today at a Glance."
**Weakness:** Charter-focused (packages, dietary requirements, reservations). Region-locked to Croatia. No weather or tides. No route optimization. No offline. No GPX export. No community contributions. All data manually entered by 45D staff. Built on Base44 (no-code) with Leaflet.

### Keeano - "The Mediterranean Discovery Tool"
**Strength:** 40K+ Mediterranean POIs. ML-powered recommendations based on boat type, weather, time, and AIS data. "Coast View" feature with 800K aerial coastline photos from helicopter surveys. MarineTraffic AIS integration. Collaborative trip planner with crew roles. GPX export. Claims to reduce planning from 15 hours to 1 minute.
**Weakness:** Mediterranean only. Very small user base (under 10K social followers). Blog SSL expired (maintenance concerns). Pre-seed funded ($326K) with no visible follow-on. iOS 5.0/5 but only 3 ratings. Android users complain about UI pivot.

### Noforeignland - "The Cruiser's Wiki"
**Strength:** Free crowd-sourced cruising community. Anchorage reviews, clearance formalities, GPS tracking. Created by liveaboard cruisers for liveaboard cruisers. Strong community trust.
**Weakness:** Dated UI. No route planning. No weather integration. Wiki-style, not app-style.

### SailTies - "The Crew Logbook"
**Strength:** Only app focused on crew collaboration. Shared logbooks. Sailing CV with verified voyage data. Crew matching.
**Weakness:** Basic navigation. Small user base. Not a standalone planning solution.

---

## Where Everyone Falls Short

| Gap | Description | Who's Closest |
|-----|-------------|---------------|
| Multi-day itinerary planning | Nobody plans a week-long cruise with daily legs, weather windows across days, and overnight stop quality | 45 Degrees (charter only), Keeano (Med only), Komoot (cycling) |
| Community-verified POIs | No "you must have been there" verification like Komoot Highlights | Navily (reviews but no visit verification), Noforeignland |
| Crew collaboration on plans | Nobody lets a skipper build a plan that crew can see, comment on, and contribute to | Keeano (basic), SailTies (view only), RideWithGPS clubs (cycling) |
| Passage difficulty ratings | No multi-factor difficulty system (distance + sea state + exposure + tides + nav complexity) | None |
| "Where sailors actually go" | No heatmap of actual sailing tracks like RideWithGPS has for cycling | Ditch (AIS patterns, powerboat focus) |
| Logbook-to-route integration | No app captures the voyage and connects it back to the plan for sharing/review | SeaPeople (logging) + SailTies (CV) separately |
| Cross-plotter universality | Every brand has its own app. No brand-agnostic planner with clean GPX export | All export GPX but none focus on it |
| Modern UX + open source | OpenCPN is open source but has 2010 UX. Orca has great UX but is proprietary | Neither |
| Offline-first for bluewater | Most apps need internet for weather routing. Offshore sailors need offline everything | OpenCPN (desktop), PredictWind (via satellite) |
| AI-assisted planning | No AI agent that understands your boat, crew, weather patterns, and preferences to help plan | NautiPlan GPT (chat only), Keeano (ML recommendations) |

---

## Above Deck: What We Build

### Core Concept
A free, open-source passage planner that combines Komoot's multi-day planning, 45 Degrees' itinerary UX, and sailing-specific intelligence — with an embedded AI agent. Plan multi-day voyages, see weather and tides along the route, find verified anchorages and harbours, share plans with crew, and export to any chartplotter.

### Core Features (MVP)

**1. Route Planning on Maps**
- Plot passages with waypoints on a marine-aware map (Mapbox + OpenSeaMap overlay)
- Multi-leg voyage planning: split a long passage into daily legs with overnight stops
- Auto-suggest stopping points based on distance, daylight, and POI database
- Calculate distance, bearing, and estimated time per leg
- Colour-coded route lines per day (like 45 Degrees)
- Support for vessel profiles (monohull vs catamaran, draft, speed)

**2. Weather Integration**
- Wind, waves, swell, and sea surface temperature along the route (Open-Meteo Marine API)
- Visual weather overlay on the map (animated wind particles using wind-layer library)
- Weather timeline showing conditions hour-by-hour along each leg
- Weather window identification: "best departure time in the next 7 days"
- Historical weather patterns for seasonal planning (ERA5-Ocean data back to 1940)

**3. Tides & Currents**
- Tidal predictions at waypoints and harbours (Neaps tide-database for offline, NOAA/ADMIRALTY APIs)
- Tidal height graphs at ports
- Current flow data where available
- Tidal gate warnings ("this passage requires slack water")

**4. Points of Interest Database**
- Harbours, marinas, anchorages, fuel stations, provisioning, restaurants, bars, services (10 categories like 45 Degrees)
- Toggle filter chips for POI categories on the map (45 Degrees pattern)
- Per-location detail: depth, seabed type, shelter rating, facilities, approach notes
- Local knowledge notes per location ("Good for North sector winds, challenging in strong south winds")
- Community contributions: photos, reviews, tips, hazard warnings
- "Must have visited" verification (Komoot model): only log a review if you've tracked a passage there
- Auto-curation: poorly-rated locations deprioritised
- Pre-populated from OpenStreetMap (ODbL), NOAA (public domain), Global Fishing Watch (CC-BY-SA)

**5. Day-by-Day Itinerary View**
- Timeline view showing each day's stops with times, type tags, and notes (like 45 Degrees mobile view)
- "Today at a Glance" dashboard: departure, destination, distance, ETA
- Total trip distance prominently displayed
- Booking/status tracking per stop

**6. Chartplotter Export**
- GPX export with proper waypoint naming, notes, and route metadata
- Designed to work with Garmin, Raymarine, B&G, Simrad, Furuno
- Import GPX from other tools

**7. Crew Collaboration**
- Captain creates voyage plans
- Invite crew members (email/link)
- Crew see route, waypoints, ETAs, POI info, weather
- Crew can comment on waypoints, suggest changes, flag concerns
- Captain approves or rejects crew suggestions
- Role-based access: captain (edit), crew (view + comment)

**8. AI Sailing Agent**
- Embedded AI assistant that understands your boat profile, crew experience, and preferences
- "Plan me a 7-day cruise from Split to Dubrovnik for a 40ft catamaran with 4 crew"
- Weather-aware suggestions: "Based on the forecast, I'd recommend departing Wednesday and stopping in Hvar on Day 2 to avoid Thursday's 30kt Bora"
- POI recommendations based on route, preferences, and community ratings
- Passage difficulty assessment and alternative route suggestions
- Provisioning estimates based on crew size and passage duration
- Natural language interaction for route modifications

### Future Features (Post-MVP)

**Community & Social**
- Community-shared voyages and itineraries (like Komoot Collections)
- "Where sailors actually go" heatmap from logged tracks
- Passage difficulty rating system (distance + sea state + exposure + tides + nav complexity)
- Passage composition breakdown (open water % + coastal % + channel % + harbour approach %)
- Aerial/drone photography per location (like Keeano's Coast View)

**Voyage Logging**
- Track actual passage with GPS
- Auto-logbook entries (position, weather, speed at intervals)
- Photos pinned to route locations
- Compare planned vs actual route
- Passage statistics and personal sailing CV (like SailTies)

**Advanced Planning**
- Weather routing with boat polars (isochrone method, clean-room Go implementation from MIT-licensed references)
- Passage notes (auto-generated waypoint-by-waypoint guidance with custom annotations, like RideWithGPS cue sheets)
- Provisioning planner (days at sea x crew = supplies needed)
- Watch schedule generator

**Hazard Data**
- Orca interaction zones (Iberian Peninsula)
- Shark incident heat maps
- Piracy advisory zones
- Marine protected areas (WDPA API)
- Shipping lanes / Traffic Separation Schemes
- Depth warnings based on vessel draft

**Comms & Sharing**
- Share voyage progress with family/friends via web link (no account needed)
- WhatsApp group integration for crew communication
- PDF passage plan export for crew briefing

**Integration**
- API and webhooks from day one (crew notifications, third-party tools)
- AIS vessel tracking overlay (AISStream.io)
- Signal K integration for live boat instrument data

---

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Map library | Mapbox GL JS | Experience with it, 50K free loads/month, good mobile support |
| Frontend | Astro hybrid + React islands | Fast static pages + rich map interaction |
| Backend | Go | Performance, simplicity, good for geospatial |
| Database | Supabase (PostgreSQL + PostGIS) | Free tier, built-in auth, real-time, PostGIS |
| Hosting | Netlify | Free tier, good DX |
| Mobile strategy | PWA | Faster to build, easier for OSS contributors, installable |
| Offline | Download support | Users can cache maps, POIs, and weather snapshots for offline use |
| POI seeding | Pre-populate from OSM + NOAA + GFW | All under compatible open licenses (ODbL, CC0, CC-BY-SA) |
| Weather routing | Clean-room Go implementation | Based on MIT-licensed isochrone algorithm (peterm790/weather_routing), Apache-2.0 polars (hrosailing), MIT boat data (orc-data) |
| Pricing | Free, open source | No monetisation. Community-driven. |

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Astro (hybrid SSG/SSR) + React islands | Fast static pages for shared routes/docs, rich React for map interaction |
| Map | Mapbox GL JS | Full-featured, mobile support, 50K loads/mo free, offline tile packs via SDK |
| Marine overlay | OpenSeaMap tiles + custom GeoJSON layers | Free seamark data |
| Wind visualisation | wind-layer (sakitam-fdd/wind-layer) | 686 stars, TypeScript, Mapbox GL compatible, windy.com-style particles |
| Backend API | Go | Fast, simple, good for geospatial processing |
| Database | Supabase (PostgreSQL + PostGIS) | Free tier, built-in auth, real-time subscriptions, PostGIS for geospatial |
| Auth | Supabase Auth | Email, social login, role-based access |
| Hosting | Netlify (frontend) + Supabase (backend/db) | Free tiers, good DX |
| CI/CD | GitHub Actions | Free for open source |
| Weather | Open-Meteo Marine API | Free, global, 16-day forecast, 10K calls/day |
| Tides | Neaps tide-database (offline harmonics, 7,600 stations) + NOAA/ADMIRALTY APIs | Offline-capable, global |
| POIs | OpenStreetMap Overpass API + community database | Free, global coverage |
| Charts (US) | NOAA WMTS | Free official charts |
| AIS | AISStream.io WebSocket | Free real-time global AIS |
| Hazards | WDPA API + static GeoJSON + community data | Free, comprehensive |
| AI Agent | Claude API (to be designed) | Passage planning assistant |
| Route editing UX | Inspired by gpx.studio (920 stars, MIT) | Best-in-class web route editor patterns |
| Trip data model | Inspired by postgsail (PostGIS schema) | Automatic trip/moorage/anchorage logging |

---

## Open Source Building Blocks

Key GitHub projects we can learn from or integrate:

| Project | Stars | License | Relevance |
|---------|-------|---------|-----------|
| sakitam-fdd/wind-layer | 686 | MIT | Wind particle overlay for Mapbox/MapLibre |
| openwatersio/neaps | 25 | MIT | TypeScript tide prediction engine |
| jieter/orc-data | 96 | MIT | ORC boat polar data for thousands of boats |
| gpxstudio/gpx.studio | 920 | MIT | Web route editor UX patterns |
| SignalK/freeboard-sk | 54 | Apache-2.0 | Web chart plotter with routes, weather layers |
| xbgmsharp/postgsail | 42 | Apache-2.0 | PostGIS schema for trip/moorage logging |
| cambecc/earth | 6,512 | MIT | Weather globe visualisation (GRIB rendering) |
| cambecc/grib2json | 385 | MIT | GRIB to JSON converter |
| peterm790/weather_routing | - | MIT | Python isochrone algorithm (port to Go) |
| hrosailing/hrosailing | - | Apache-2.0 | Polar diagram processing |
| dakk/gweatherrouting | 73 | GPL-3.0 | Weather routing reference (study only, GPL) |

---

## What Makes Above Deck Different

1. **Free and open source** — No paywalls, no tier-gating, no subscriptions. Community-driven.
2. **Multi-day first** — Built for planning week-long coastal cruises and ocean crossings, not just A-to-B routes.
3. **AI-assisted planning** — Embedded AI agent that understands your boat, crew, weather, and preferences.
4. **Community-verified POIs** — Komoot's "must have been there" model applied to anchorages and harbours.
5. **Crew collaboration built in** — Captain plans, crew contributes. Not an afterthought.
6. **Offline-capable** — PWA with downloadable maps, POIs, and weather snapshots for bluewater sailors.
7. **Modern UX** — OpenCPN's power with Orca's beauty. 45 Degrees' itinerary patterns. No 2010 interfaces.
8. **Brand-agnostic** — Clean GPX export to any chartplotter. Not locked to one ecosystem.
9. **Sailing-only** — No powerboat compromises. Optimised for wind, tides, and sail.
10. **Global from day one** — Not region-locked like Keeano (Med) or 45 Degrees (Croatia).

---

## Competitive Positioning

```
                    Navigation Sophistication
                           HIGH
                            |
              PredictWind   |   Above Deck (target)
              Orca          |
              Savvy Navvy   |
                            |
     LOW ───────────────────┼─────────────────── HIGH
     Community/Social       |           Community/Social
                            |
              OpenCPN       |   Navily
              SailGrib      |   SeaPeople
              45 Degrees    |   Keeano
                            |   Noforeignland
                           LOW
                    Navigation Sophistication
```

Above Deck aims for the top-right quadrant: strong navigation AND strong community AND AI-assisted. Nobody is there today.

---

## UX Patterns to Adopt

From 45 Degrees Sailing:
- POI category filter chips (colour-coded toggles)
- Day-by-day itinerary timeline with stops, times, type tags, and notes
- Colour-coded daily route lines on map
- "Today at a Glance" dashboard
- Local knowledge notes per location
- Total trip distance prominently displayed

From Komoot:
- Multi-day stage planner with auto-split
- Community Highlights with "must have visited" verification
- Auto-curation (bad content disappears)
- Multi-factor difficulty rating
- Route characteristics breakdown
- Progressive disclosure UX

From RideWithGPS:
- Cue sheets → passage notes with auto-generated waypoint guidance
- Club route library → crew passage plan library
- Heatmaps → "where sailors actually go"
- API + webhooks from day one

From Keeano:
- ML-powered POI recommendations based on boat type and conditions
- Aerial/drone photography per location
- "Reduce planning from 15 hours to 1 minute" aspiration

---

## Research Documents

Detailed research supporting this plan is in `research/`:
- `market-research.md` — Full competitive landscape
- `savvy-navvy-deep-dive.md` — Detailed Savvy Navvy analysis
- `predictwind-orca-navily-opencpn-analysis.md` — PredictWind, Orca, Navily, OpenCPN deep dives
- `deep-dive-competitor-analysis.md` — SeaPeople, Komoot, RideWithGPS, FastSeas, and other apps
- `keeano-deep-dive.md` — Keeano analysis
- `apps-and-github-projects.md` — Additional apps and GitHub open-source projects
- `marine-data-apis.md` — All available free marine data APIs with endpoints and rate limits
- `fastseas-and-weather-routing-research.md` — FastSeas analysis and weather routing algorithms
- `data-source-licenses.md` — License analysis for all data sources
