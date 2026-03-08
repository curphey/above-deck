# Above Deck — Vision & Execution Plan

**Date**: 2026-03-08
**Status**: Draft — awaiting approval
**Author**: Mark Curphey + Claude

---

## Mission

Build the definitive free, open-source sailing platform — the "Komoot for Sailing." Combine multi-day passage planning, weather-aware routing, community-verified POIs, crew collaboration, vessel management, resource planning, and social features into one beautiful, offline-capable PWA that nobody has to pay for.

## Goals

1. **Unify the fragmented sailing app experience** — Replace the 3-5 apps sailors currently juggle with a single platform
2. **Be free forever** — No paywalls, tiers, ads, or data monetization. Gift to the sailing community.
3. **Offline-first for bluewater** — Work at sea without connectivity, sync when back online
4. **Beautiful and accessible** — Modern UX with progressive disclosure: simple for most, powerful for those who want it
5. **Community-driven** — Open source, community-contributed data, transparent development
6. **Global from day one** — Not region-locked. Works everywhere sailors go.

---

## Who It's For

**Primary:** Coastal cruisers and bluewater/offshore sailors (monohull and catamaran)
**Not for:** Powerboats, charter tourists, racing

These sailors:
- Plan multi-day or multi-week passages
- Need weather windows, tidal gates, and safe overnight stops
- Sail with crew who need to see and contribute to plans
- Use chartplotters (Garmin, Raymarine, B&G) and need GPX export
- Often lose connectivity for days or weeks at sea
- Value community knowledge about anchorages, harbours, and hazards
- Currently cobble together 3-5 apps to plan a single passage

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

**No competitor occupies the top-right quadrant** — strong navigation AND strong community AND AI-assisted AND free.

### What competitors do well and where they fall short

| Competitor | Strength | Gap |
|-----------|----------|-----|
| Savvy Navvy | Smart routing + tides | Expensive ($80-150/yr); no social; no multi-day |
| PredictWind | Best weather data; AI polars | Steep learning curve; $249-499/yr; no POI data |
| Orca | Beautiful UI; auto-rerouting | Unsafe (ignores tidal gates); needs internet |
| Navily | 35K locations; 350K reviews | Not navigation; European-focused |
| SeaPeople | Social-first; 58K users | Deliberately not navigation; poor Android |
| OpenCPN | Powerful; free; open source | 2010 UI; desktop-first; no social |
| 45 Degrees | Beautiful itinerary UX | Charter-focused; Croatia only; no weather/tides |
| Keeano | 40K Med POIs; ML recommendations | Mediterranean only; <10K users |

---

## Principles

### Technical
- **PWA-first** — Single codebase for web, iPad, all mobile. Installable. No app store dependencies.
- **Offline-first** — Core features work without connectivity. Sync on reconnect.
- **Google Sign-In only** — Simple auth, no password management.
- **Timezone-aware** — Times shown in local timezone of the relevant location.
- **i18n-ready** — English only for now, but don't hardcode strings.

### Design
- **Beautiful & simple** — Inspired by Spotify, Google Maps, Lemonade, Headspace.
- **Progressive disclosure** — Simple by default, powerful on demand. Never overwhelm.
- **Template-driven onboarding** — Minimize data entry. Select your boat model, confirm specs, done.
- **Mantine + Tabler Icons** — Clean, accessible, dark mode, responsive React components.

### Community
- **Free forever** — No monetization, ever. Fund via donations/sponsorship if needed.
- **Open source** — Full codebase public. Community contributions welcome.
- **Transparent development** — Built in public with blog, vlog, changelog, and community forum.

### Project
- **Solo developer** (very senior) — Ships when ready, quality over speed.
- **Influencer awareness** — Partner with sailing YouTubers (SV Delos, etc.) for reach.

---

## Complete Feature Set

### Feature Group 1: Route Planning & Navigation

**1.1 Route Planning on Maps**
- Plot passages with waypoints on a marine-aware map (Mapbox GL JS + OpenSeaMap overlay)
- Multi-leg voyage planning: split passages into daily legs with overnight stops
- Auto-suggest stopping points based on distance, daylight, and POI database
- Calculate distance, bearing, and ETA per leg
- Colour-coded route lines per day
- Vessel profiles (monohull vs catamaran, draft, speed)

**1.2 Weather Integration**
- Wind, waves, swell, and SST along the route (Open-Meteo Marine API)
- Animated weather overlay (wind-layer library)
- Hour-by-hour weather timeline per leg
- Weather window identification ("best departure in next 7 days")
- Historical weather patterns for seasonal planning

**1.3 Tides & Currents**
- Tidal predictions at waypoints/harbours (Neaps offline + NOAA/ADMIRALTY APIs)
- Tidal height graphs
- Current flow data
- Tidal gate warnings ("this passage requires slack water")

**1.4 Day-by-Day Itinerary View**
- Timeline view with stops, times, type tags, notes
- "Today at a Glance" dashboard
- Total trip distance displayed prominently
- Booking/status tracking per stop

**1.5 Chartplotter Export/Import**
- GPX export with proper waypoint naming, notes, metadata
- Compatible with Garmin, Raymarine, B&G, Simrad, Furuno
- Import GPX from other tools

**1.6 AI Sailing Agent**
- Embedded AI assistant (Claude API) understanding boat, crew, preferences
- Natural language passage planning ("Plan me 7 days from Split to Dubrovnik")
- Weather-aware suggestions
- POI recommendations from community ratings
- Passage difficulty assessment
- Provisioning estimates
- Route modification via conversation

### Feature Group 2: Points of Interest

**2.1 POI Database**
- 10 categories: harbours, marinas, anchorages, fuel, provisioning, restaurants, bars, services, water, chandlery
- Filter chips on map (colour-coded toggles)
- Per-location: depth, seabed type, shelter rating, facilities, approach notes
- Local knowledge notes ("Good for North sector winds")
- Pre-populated from OSM (ODbL), NOAA (public domain), Global Fishing Watch (CC-BY-SA)

**2.2 Community Contributions**
- Photos, reviews, tips, hazard warnings
- "Must have visited" verification (Komoot model)
- Auto-curation: poorly-rated locations deprioritized
- Community can submit new POIs

### Feature Group 3: Vessel Management

**3.1 Boat Model Templates**
- Select boat model (e.g. "Lagoon 43") → full factory equipment pre-populated
- Known options/upgrades presented as choices
- Custom modifications addable
- Any template value overridable
- Seeded with top 30 production boats, community-growable

**3.2 Equipment Registry**
- Equipment organized by system: Propulsion, Electrical, Water, Safety, Navigation, Rigging, Plumbing
- **Simple view (Level A)**: Card grid with name, make/model, health badge (green/amber/red)
- **Power view (Level B)**: Service history, parts lists, serial numbers, service intervals, next service due
- Equipment spec templates (popular engines, watermakers, panels) auto-populate details
- Service alerts: "Engine oil change due in 47 hours"
- Adding equipment via wizard with make/model search and template auto-fill

**3.3 Equipment Types with Special Fields**
- Engine: fuel type, consumption rate, hour meter, oil capacity, service intervals
- Solar panel: wattage, quantity, type (mono/poly/flexible)
- Battery: chemistry (AGM/LiFePO4/lead-acid), capacity (Ah), voltage
- Watermaker: output rate (L/hr), power draw (watts)
- Generator: fuel consumption, output (watts)

### Feature Group 4: Energy & Resource Planning

**4.1 System Sizer ("What do I need?")**
- Input power consumers with daily usage (common items with default wattages)
- Input sailing profile (anchor vs. sailing vs. marina split)
- Input cruising region and season
- Output: recommended battery bank + solar panel wattage with autonomy buffer
- Daily energy balance chart with plain-language explanation
- Works standalone — no account required, great for SEO

**4.2 Generation Calculator ("What will I produce?")**
- Input panel wattage + battery capacity (manual or from equipment registry)
- Input location and time of year
- Output: daily solar generation, hours to full charge, demand coverage
- Green/amber/red indicator

**4.3 Passage Energy Forecast**
- Integrated with route planning
- Solar generation per day based on latitude, date, cloud cover forecast
- Power consumption per day (sailing vs. anchor profiles)
- Net energy balance with state-of-charge warnings
- **Simple view**: Daily summary with colour indicator
- **Power view**: Hour-by-hour breakdown, state-of-charge graph, "what if" toggles

**4.4 Fuel Planning**
- Estimate motoring vs. sailing per leg from wind forecast + simple thresholds
  - "Motor below X knots true wind" (default: 8)
  - "Can't sail closer than Y degrees" (default: 45°)
- Fuel burn = motoring hours × consumption rate
- Generator fuel added if applicable
- Total fuel needed vs. tank capacity
- Refueling stop suggestions
- **Future**: Polar diagram upload for precise estimates

**4.5 Water Planning**
- Daily crew consumption: crew × daily rate (default 3L/person)
- Watermaker production: output rate × planned daily runtime
- Watermaker runtime constrained by available power
- Tank capacity vs. consumption vs. production
- Days of autonomy calculation
- Water stop flagging

**4.6 Passage Resource Summary**
- Unified view combining fuel + water + energy + engine hours
- **Simple view**: Summary card with checkmarks/warnings per resource
- **Power view**: Day-by-day table, tank level graphs, what-if scenarios
- Engine hours cross-referenced with service schedule
- Warning if service due during or after passage

### Feature Group 5: Social & Community

**5.1 User Profiles**
- Basic info: name, photo, location, bio
- Sailing experience: years, miles logged, roles (skipper/crew/navigator)
- Certifications: RYA, ICC, ASA, STCW, VHF license, first aid, etc.
- Voyage logs: linked to routes planned/logged in-app
- Boats: current and past, linked to equipment registry
- **Privacy model (granular per section)**:
  - Private (default) — only you
  - Group — shared with specific groups
  - Public — visible to community

**5.2 Groups (First-Class Concept)**
- A boat's crew (tied to a vessel)
- A yacht club or sailing association
- A rally fleet (e.g. ARC participants)
- Friends who sail together
- Groups have shared routes, logs, chat, and member directory

**5.3 Communication**
- **Community chat**: Group-level discussions (yacht club, rally fleet, harbour chat)
- **Person to person**: Direct messages between sailors
- **Boat to boat**: Vessel-level comms tied to boat profile (persists across crew changes)

**5.4 VHF / AIS Integration**
- Vessel profiles store MMSI number and VHF call sign
- AIS overlay shows nearby vessels (AISStream.io)
- Tap vessel on AIS → see Above Deck profile (if user) → message them
- Bridges VHF (short range, voice, public) with digital messaging (private, persistent, global)

**5.5 Crewing**
- Profiles with verified experience + certifications enable trust
- Logged passages serve as verifiable experience records
- Crew-wanted / crew-available matching based on qualifications and availability

**5.6 Crew Collaboration on Passages**
- Captain creates voyage plans
- Invite crew via email/link
- Crew see route, waypoints, ETAs, POI info, weather
- Crew comment on waypoints, suggest changes, flag concerns
- Captain approves/rejects suggestions
- Role-based access: captain (edit), crew (view + comment)

### Feature Group 6: Builder's Hub

**6.1 Blog & Vlog**
- Development journal: plans, progress, decisions, behind-the-scenes
- MDX-powered content within Astro
- YouTube video embeds for tutorials and vlogs
- RSS feed

**6.2 Weekly Newsletter**
- Email newsletter subscribers can sign up for
- Weekly digest: new blog posts, research highlights, feature updates, community activity
- Drives re-engagement and keeps the community informed between visits

**6.3 Community Forum**
- Chat-style forum: questions, tips, feature discussions
- Threaded discussions organized by topic
- Builder responds directly — transparent, accessible development

**6.4 Changelog**
- In-app update feed — what's new without checking GitHub
- Tied to releases
- "What's new" badge/notification for returning users

### Feature Group 7: Knowledge & Learning

**7.1 Knowledge Base**
- Curated how-to guides for common sailing tasks
- Topics: "How to install solar panels", "How to size your battery bank", "How to plan an Atlantic crossing", "How to pick an anchor", "How to read weather GRIBs"
- Written by the builder and community contributors
- Searchable, categorized, linked from relevant app features
- MDX-powered for rich content (diagrams, embedded calculators, videos)

**7.2 Research Board** (inspired by Project Kamp)
- Community-driven explorations and investigations
- Card-based, filterable list with status tracking (draft / in-progress / complete)
- Topics: "Best watermaker for a 40ft cat", "Starlink vs Iridium for offshore", "DIY lithium battery conversion", "Cheapest AIS transponders compared"
- Anyone can start a research thread, community contributes findings
- Voting/usefulness system to surface best content
- Links to equipment registry templates when research covers specific products
- Encourages innovative, open-ended investigation — not just "how to" but "what's the best way?"

**7.3 In-App Help**
- Contextual help: tooltips, guided tours for new features
- Help content embedded, not external wiki links
- Onboarding that teaches by doing
- Links to relevant knowledge base articles and research

**7.4 Video Tutorials**
- YouTube video tutorials for key workflows
- Embedded in relevant help contexts and knowledge base articles

### Feature Group 8: Live Passage Experience

> *Above Deck isn't just for planning — it's your companion while underway.*

**8.1 Live Tracking & Beacon**
- GPS tracking of your passage in real-time
- Live position beacon shareable with family/friends via web link (no account needed)
- "Share my trip" link — recipients see your boat moving on a map with ETA to destination
- Configurable update interval (battery-conscious: every 5/15/30 min)
- Position history trail visible to followers
- Works offline — caches positions and syncs when connectivity returns

**8.2 Fleet Coordination (Rally/Group Sailing)**
- Live positions of all boats in a group on one map
- See your rally fleet spread out across the ocean in real-time
- Group WhatsApp integration — create/link WhatsApp groups for fleet comms
- In-app group chat as backup when WhatsApp unavailable (offshore)
- "Buddy boat" pairing — two boats tracking each other closely
- Distance/bearing to other group members

**8.3 Voyage Logging**
- Auto-logbook entries (position, weather, speed, heading at intervals)
- Manual log entries (sail changes, events, notes)
- Photos pinned to route locations with GPS
- Compare planned vs. actual route overlay
- Passage statistics and sailing CV

**8.4 Live Weather & Conditions**
- Updated weather along remaining route as new forecasts arrive
- "Conditions now" dashboard — current wind, waves, barometric trend
- Alerts when conditions diverge significantly from forecast
- Weather routing recalculation suggestions ("winds have shifted — consider altering course")

**8.5 Resource Tracking Underway**
- Fuel remaining estimate based on engine hours logged
- Water remaining estimate based on consumption tracking
- Battery state of charge (manual input or SignalK integration)
- "Will I make it?" projections updated with actual conditions

**8.6 Safety Features**
- MOB (Man Overboard) button — marks GPS position, alerts crew/group, starts timer
- Emergency contacts notification — one-tap alert to designated contacts with position
- Check-in schedule — set regular check-in times, alert if missed
- Passage plan filed with shore contact — auto-shared with emergency info

### Feature Group 9: Admin & Operations

> *The tools you need to run the platform, moderate content, manage users, and understand usage.*

**9.1 Admin Dashboard**
- User management: view, search, suspend, delete accounts
- Role management: assign moderators, community contributors, beta testers
- User activity overview and flagged accounts
- System health: API usage, database size, active connections

**9.2 Content Moderation**
- Review queue for community-submitted POIs, reviews, photos, research posts
- Flagged content from user reports
- Moderation actions: approve, reject, edit, hide, warn user
- Auto-moderation rules (spam detection, profanity filter)
- Moderation log for accountability

**9.3 CMS (Content Management)**
- Create and edit blog posts, knowledge base articles, changelog entries
- MDX editor with preview (or integration with external MDX authoring)
- Draft/publish/schedule workflow
- Media library for images and video embeds
- Template management for boat models and equipment specs (add/edit/review community submissions)

**9.4 Analytics**
- Usage tracking: active users, sessions, feature adoption, retention
- Content analytics: most-read articles, popular research threads, POI views
- Tool analytics: calculator usage, routes planned, passages tracked
- Community health: new signups, forum activity, contributions, churn
- Privacy-respecting: no third-party trackers, self-hosted analytics (Plausible or Umami)
- Dashboard with key metrics and trends

**9.5 Newsletter Management**
- Subscriber management and list health
- Compose and schedule weekly digest
- Open/click tracking (privacy-respecting)
- Automated content curation from recent posts/activity

### Feature Group 10: Advanced Features (Future)

**10.1 Community Content**
- Community-shared voyages and itineraries (Komoot Collections)
- "Where sailors actually go" heatmap from logged tracks
- Passage difficulty rating system
- Passage composition breakdown (open water / coastal / channel / harbour approach)

**10.2 Advanced Planning**
- Weather routing with boat polars (isochrone method)
- Passage notes (auto-generated waypoint guidance)
- Provisioning planner
- Watch schedule generator

**10.3 Hazard Data**
- Orca interaction zones (Iberian Peninsula)
- Shark incident heat maps
- Piracy advisory zones
- Marine protected areas (WDPA API)
- Shipping lanes / Traffic Separation Schemes
- Depth warnings based on vessel draft

**10.4 SignalK Integration**
- Live boat instrument data (instruments, tank levels, engine hours)
- Auto-update engine hours in equipment registry
- Feed real data into resource tracking underway
- Open protocol, aligns with open-source values

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Astro (hybrid SSG/SSR) + React islands | Static content pages (blog, docs) + rich React for app |
| UI Framework | Mantine + Tabler Icons | Clean, accessible, dark mode, progressive disclosure components |
| Map | Mapbox GL JS + OpenSeaMap overlay | Full-featured, mobile, 50K loads/mo free, offline tile packs |
| Wind | wind-layer (sakitam-fdd) | Animated wind particles, Mapbox compatible |
| Backend API | Go | Fast, simple, excellent for geospatial |
| Database | Supabase (PostgreSQL + PostGIS) | Free tier, auth, real-time, PostGIS |
| Auth | Google Sign-In via Supabase Auth | Single provider, simple |
| Real-time | Supabase Realtime | Chat, live updates, collaboration |
| Hosting | Netlify (frontend) + Supabase (backend/db) | Free tiers |
| CI/CD | GitHub Actions | Free for open source |
| Weather | Open-Meteo Marine API | Free, global, 16-day forecast |
| Tides | Neaps (offline) + NOAA / ADMIRALTY APIs | Offline-capable, global |
| POIs | OSM Overpass + community DB | Free, global, ODbL |
| AIS | AISStream.io WebSocket | Free real-time global AIS |
| AI | Claude API | Passage planning assistant |
| Content | MDX in Astro | Blog, changelog, help pages |

---

## Data Sources & Licensing

**Can use (pre-populate DB):**
- OpenStreetMap / OpenSeaMap — ODbL; free caching/redistribution with attribution
- NOAA (charts, tides, weather) — Public domain (CC0)
- Global Fishing Watch anchorages — 160K locations; CC-BY-SA 4.0

**Supplementary (online only):**
- NOAA CO-OPS (US tides) — Free API
- ADMIRALTY Discovery (UK tides) — Free, no caching
- AISStream.io — Free real-time AIS
- WDPA (protected areas) — Free, 260K+ zones

**Cannot use:**
- Navily — Proprietary
- Noonsite — Copyright, no API
- ADMIRALTY paid tiers — Crown copyright

---

## Execution Order

### Phase 0: Technical Foundation
> *Set up the project infrastructure. Nothing visible to users yet.*

- **0.1** Project scaffolding: Astro + React + Mantine + Tabler Icons
- **0.2** PWA setup: service worker, manifest, installable
- **0.3** Supabase setup: project, database, Google Auth
- **0.4** CI/CD: GitHub Actions → Netlify deploy
- **0.5** Design system: colour palette, typography, component tokens in Mantine theme
- **0.6** Analytics setup: self-hosted privacy-respecting analytics (Plausible or Umami)
- **0.7** Admin foundation: protected admin routes, role-based access

### Phase 1: Content Platform & Community
> *Launch the site. Start building audience and community before any app features exist. This IS the first product.*

- **1.1** Landing page: mission statement, feature preview, vision, email signup
- **1.2** Builder's blog (MDX): development journal, plans, decisions, behind-the-scenes
- **1.3** Vlog integration: YouTube embeds for build vlogs and tutorials
- **1.4** Changelog page: in-app update feed, "what's new" notifications
- **1.5** RSS feed for blog + changelog
- **1.6** Weekly newsletter: email signup, weekly digest of posts/updates/community activity
- **1.7** Community forum: threaded discussions, topic categories, user posting
- **1.8** Knowledge base: curated how-to guides (MDX), searchable, categorized
- **1.9** Research board: community-driven investigations, card-based with status (draft/in-progress/complete), voting, filtering
- **1.10** Video tutorial framework: embedded YouTube in knowledge base articles
- **1.11** CMS: admin interface for creating/editing blog posts, knowledge base articles, changelog entries
- **1.12** Newsletter management: subscriber signup, compose/schedule weekly digest
- **1.13** Content moderation: review queue for community forum posts and research submissions

### Phase 2: Standalone Tools
> *Ship useful tools that work without the full platform. SEO acquisition + early user value.*

- **2.1** Solar system sizer (standalone calculator, no auth required)
- **2.2** Generation calculator (standalone, no auth required)
- **2.3** Power consumer database (common appliances with default wattages)
- **2.4** Boat model template database (seed top 30 boats)
- **2.5** Equipment registry (requires auth)
- **2.6** Equipment spec templates (seed popular engines, watermakers, panels)
- **2.7** Service tracking with alerts

### Phase 3: Core Navigation
> *The heart of the platform — plan a passage on a map.*

- **3.1** Map with marine overlay (Mapbox + OpenSeaMap)
- **3.2** Route plotting with waypoints
- **3.3** Multi-leg voyage planning with daily splits
- **3.4** Distance, bearing, ETA calculations
- **3.5** Vessel profiles (boat type, draft, speed)
- **3.6** Day-by-day itinerary view
- **3.7** GPX export/import

### Phase 4: Weather & Tides
> *Make routes weather-aware and tide-safe.*

- **4.1** Weather data integration (Open-Meteo Marine API)
- **4.2** Weather overlay on map (animated wind)
- **4.3** Weather timeline per leg
- **4.4** Weather window identification
- **4.5** Tidal predictions at waypoints (Neaps + APIs)
- **4.6** Tidal height graphs
- **4.7** Tidal gate warnings

### Phase 5: Points of Interest
> *Where to stop, fuel up, eat, anchor.*

- **5.1** POI database seeded from OSM + NOAA + GFW
- **5.2** Map filter chips by category
- **5.3** POI detail pages (depth, shelter, facilities, approach notes)
- **5.4** Auto-suggest stops along routes
- **5.5** Community contributions (reviews, photos, tips)
- **5.6** Visit verification

### Phase 6: Passage Resources
> *Connect vessel data + weather to answer "do I have enough?"*

- **6.1** Fuel planning (motoring estimates from wind thresholds)
- **6.2** Water planning (crew consumption + watermaker)
- **6.3** Passage energy forecast (solar generation along route)
- **6.4** Unified passage resource summary
- **6.5** Engine hours + service integration
- **6.6** What-if scenarios

### Phase 7: User Profiles & Auth
> *Identity, experience, and privacy.*

- **7.1** User profiles (basic info, bio, photo)
- **7.2** Sailing experience and certifications
- **7.3** Privacy controls (private/group/public per section)
- **7.4** Boats linked to profiles and equipment registry
- **7.5** Voyage logs linked to profiles

### Phase 8: Social & Collaboration
> *Connect sailors to each other.*

- **8.1** Crew collaboration on passages (invite, comment, suggest)
- **8.2** Groups (boat crew, yacht clubs, rally fleets, friends)
- **8.3** Group chat
- **8.4** Direct messaging (person to person)
- **8.5** Boat-to-boat messaging
- **8.6** AIS overlay with profile linking
- **8.7** Crewing (crew-wanted/available matching)

### Phase 9: Admin & Moderation Expansion
> *Scale the operational tools as community grows.*

- **9.1** User management dashboard (search, view, suspend, delete)
- **9.2** Role management (moderators, community contributors, beta testers)
- **9.3** POI moderation queue (review community-submitted locations, photos, reviews)
- **9.4** Equipment template moderation (review community-submitted boat models and specs)
- **9.5** Auto-moderation rules (spam, profanity, flagging)
- **9.6** Moderation log and audit trail
- **9.7** Analytics dashboard: usage metrics, content performance, community health

### Phase 10: Live Passage Experience
> *From planning tool to underway companion.*

- **9.1** GPS tracking and position logging
- **9.2** Live beacon sharing (web link for family/friends, no account needed)
- **9.3** Voyage logging (auto-logbook entries, manual notes, photos)
- **9.4** Planned vs. actual route overlay
- **9.5** Fleet/group live positions on shared map
- **9.6** WhatsApp group integration for fleet comms
- **9.7** Buddy boat pairing
- **9.8** Live resource tracking (fuel, water, battery remaining)
- **9.9** Safety features (MOB button, emergency alerts, check-in schedule)

### Phase 11: AI Agent
> *The intelligent assistant.*

- **11.1** Claude API integration
- **11.2** Boat/crew/preference context passing
- **11.3** Natural language passage planning
- **11.4** Weather-aware suggestions
- **11.5** POI recommendations
- **11.6** Conversational route modification

### Phase 12: Advanced Features
> *Polish and extend.*

- **12.1** Community-shared voyages
- **12.2** Heatmap of sailing tracks
- **12.3** Hazard data overlays
- **12.4** Weather routing with polars
- **12.5** SignalK integration
- **12.6** Passage difficulty ratings
- **12.7** In-app contextual help system
- **12.8** Live weather recalculation underway

---

## Phase Dependencies

```
Phase 0 (Foundation — includes analytics + admin foundation)
  │
  ├── Phase 1 (Content Platform + CMS + Newsletter) ──── first to ship
  │     └── grows continuously alongside all other phases
  │
  ├── Phase 2 (Standalone Tools) ──── no dependencies on navigation
  │
  ├── Phase 7 (Profiles) ──────────── needs auth from Phase 0
  │
  ├── Phase 3 (Navigation)
  │     ├── Phase 4 (Weather & Tides)
  │     │     └── Phase 6 (Resources) ← also needs Phase 2 (equipment)
  │     ├── Phase 5 (POIs)
  │     │     └── also needs Phase 7 (Profiles) for community contributions
  │     ├── Phase 8 (Social) ← needs Phase 7 (Profiles)
  │     └── Phase 10 (Live Passage) ← needs Phase 3 + Phase 8
  │           └── Phase 11 (AI Agent) ← benefits from all prior phases
  │
  └── Phase 9 (Admin Expansion) ← grows as community grows, after Phase 7 + Phase 8

Phase 12 (Advanced) ← builds on everything
```

**Key insights:**
- Phase 0 includes analytics and admin foundation from day one — you're measuring from the start
- Phase 1 (content platform) ships first with built-in CMS and newsletter — it IS the first product
- Phases 0, 1, 2, and 7 can be built in parallel
- Phase 2 (standalone tools) ships early for SEO/marketing with no navigation dependency
- Phase 1 content (knowledge base, research board) naturally feeds into Phase 2 (equipment templates informed by research)
- The research board creates a flywheel: community research → knowledge base articles → equipment templates → better tools
- Phase 9 (admin expansion) scales with the community — basic moderation is in Phase 1, full admin comes when user base grows
- Phase 10 (live passage) transforms Above Deck from a planning tool into an underway companion

---

## What Makes Above Deck Different

1. **Free and open source** — No paywalls, no tiers, no subscriptions. Community gift.
2. **Multi-day first** — Built for week-long cruises and ocean crossings, not just A→B.
3. **AI-assisted planning** — Embedded AI that understands boat, crew, weather, preferences.
4. **Resource planning** — Fuel, water, power, engine hours projected for every passage.
5. **Vessel management** — Equipment registry with boat model templates and service tracking.
6. **Community-verified POIs** — "Must have visited" verification for anchorages and harbours.
7. **Crew collaboration** — Captain plans, crew contributes. Not an afterthought.
8. **Social with AIS** — See nearby boats, check profiles, message them. VHF bridge.
9. **Offline-capable** — PWA with cached maps, routes, POIs for bluewater.
10. **Beautiful UX** — Progressive disclosure. Simple for most, powerful for those who want it.
11. **Brand-agnostic** — GPX export to any chartplotter. Not locked to one ecosystem.
12. **Built in public** — Blog, vlog, forum, changelog. Transparent development.

---

## Research Documents

Detailed research supporting this plan lives in `research/`:

| Document | Contents |
|----------|----------|
| `market-research.md` | Full competitive landscape (14 apps) |
| `savvy-navvy-deep-dive.md` | Savvy Navvy feature/pricing analysis |
| `predictwind-orca-navily-opencpn-analysis.md` | PredictWind, Orca, Navily, OpenCPN |
| `deep-dive-competitor-analysis.md` | SeaPeople, Komoot, RideWithGPS, FastSeas |
| `keeano-deep-dive.md` | Keeano analysis |
| `apps-and-github-projects.md` | 25+ apps, 30+ GitHub projects |
| `marine-data-apis.md` | Free marine data APIs with endpoints |
| `fastseas-and-weather-routing-research.md` | Weather routing algorithms |
| `data-source-licenses.md` | Licensing matrix for all data sources |

## Supporting Design Documents

| Document | Contents |
|----------|----------|
| `docs/plans/2026-03-08-project-principles.md` | Technical, design, and community principles |
| `docs/plans/2026-03-08-vessel-management-and-resource-planning-design.md` | Detailed design for equipment registry, energy planner, passage resources |
