# Above Deck — Launch Strategy & Product Design

**Date:** 2026-03-28
**Status:** Draft
**Type:** Strategic design spec
**Timeline:** Launch summer 2026 (3 months)

---

## 1. Strategy

Above Deck launches as a free, open-source sailing platform with two entry points: a spectacular AI passage planner (the hook) and a practical everyday toolkit (the retention). The AI crew of six agents is the platform's identity. Distribution is through build-in-public content and personalised demos to sailing creators. No paid marketing, no premium tiers.

### Core Insight

You don't launch a platform. You launch characters. People don't fall in love with "open-source boat OS." They fall in love with an AI Navigator that understands cyclone seasons, a Pilot who knows what customs documents you need in Barbados, an Engineer who checks whether your solar setup can handle a 14-day crossing. The crew IS the product.

### Two Entry Points

**Entry Point 1 — The Dream** (aspirational sailors planning big voyages):
- AI Navigator circumnavigation planner
- Multi-year route planning with seasonal timing, cyclone avoidance, trade wind routing
- Shareable voyage plans with interactive map
- "I'm planning a 3-year trip" → meets the crew

**Entry Point 2 — The Practical** (active sailors, sailing now):
- Boat profile with equipment registry
- Passage planning for weekend trips — weather, tides, entry requirements
- Country entry/exit procedures — documents, customs, fees, insurance
- Cruising almanac — anchorages, harbours, facilities, community reviews
- Energy planner — solar/battery sizing and passage energy forecasting

Both entry points lead to the same place: the AI crew and the platform. The dreamer meets Navigator planning a circumnavigation. The practical sailor meets Pilot asking "what do I need to enter Portugal?" Both discover the crew is useful, and stay.

---

## 2. The AI Crew — Progressive Introduction

Five specialist agents plus the Watchman orchestrator, introduced organically as they have something useful to say. The Watchman coordinates the crew and manages agent lifecycle — it's infrastructure, not a character sailors chat with directly. When we say "the AI crew," we mean the five specialists. Watchman is the invisible sixth that makes them work together.

### How Agents Surface

During a passage planning conversation with Navigator:

- **Engineer** appears when resources come up: energy requirements, fuel range, battery capacity for the crossing
- **Bosun** appears when provisioning comes up: water, food, spare parts for the passage duration
- **Pilot** appears when arriving at a destination: entry procedures, customs, port fees, anchorage recommendations
- **Radio Operator** appears around communications: safety nets, VHF channels, SSB frequencies for the sailing area
- **Watchman** (orchestrator) is the persistent presence — notices when agents should hand off, coordinates the crew

### The Key Principle

Agents introduce themselves when they have something useful to say, not when the UI shows a tab. It's organic, like a real crew. You're talking to Navigator and Engineer just shows up with relevant information. That's the moment people realise this isn't a route planner — it's a crew.

### Technical Model

The Watchman monitors the conversation context and activates agents based on semantic triggers. Each agent has:
- System prompt with personality, role, expertise
- Domain-specific tools (weather API, chart lookup, AIS query, customs DB)
- RAG sources (cruising almanac, pilot books, equipment data, regulations)
- The ability to address the user directly within the conversation

---

## 3. The Community Site — First Impression

The site is the front door. If it doesn't stop someone in their tracks, nothing else matters.

### Design Principles

- Blueprint aesthetic — dark navy, fine lines, Space Mono headings, technical precision
- Built by a sailor, not a SaaS marketing team
- The site IS the product — tools accessible immediately, no signup wall
- Direct, knowledgeable tone — zero bullshit, no corporate language
- No hero images of sunsets, no "Start your free trial"

### What Makes It "Wow"

- Live interactive demo on the landing page — the Navigator planning a route in real-time, or the chartplotter rendering actual chart data. Not a screenshot. The actual tool, running.
- The AI crew introduced as characters, not features. Meet the Navigator. Here's what she knows. Ask her something.
- Tools accessible immediately — click "Plan a passage" and you're talking to Navigator. No signup wall.
- Community contributions visible — recent anchorage reviews, route shares, almanac updates. Shows the platform is alive.
- Build-in-public blog front and centre — development journal, decisions, transparency as a feature.

### Site Structure

```
/                    → Landing page with live tool demos + crew intro
/tools/navigator     → AI passage planner (the hook)
/tools/chart         → Chartplotter
/tools/solar         → Energy planner
/tools/vhf           → VHF simulator
/knowledge           → Knowledge base (how-to guides)
/almanac             → Cruising almanac (ports, anchorages, procedures)
/community           → Forums, discussions
/blog                → Build-in-public development journal
/boat                → Boat profile (account required)
```

### Account Model

- Tools usable without account — try everything first
- Account (free, Google OAuth at launch; Apple Sign In added later) unlocks: save configurations, save passage plans, save boat profile, sync to spoke, community contributions
- No paid tiers. No premium features. If infrastructure costs grow, fund through donations or usage-based models, never paywalls.

---

## 4. The RAG Knowledge Base — Highest Leverage Investment

One data layer powers everything. It's what makes the agents smart, not just chatty.

### Sources (seeded from open data)

| Data | Source | License |
|------|--------|---------|
| Cruising seasons by region | Research docs + editorial | Original |
| Cyclone basins and timing | NOAA/NHC | Public domain |
| Trade wind and monsoon patterns | Pilot charts, climatology | Public domain |
| Country entry/exit procedures | Open sources, community | ODbL |
| Port basics | OpenStreetMap, NGA World Port Index | ODbL / Public domain |
| Anchorages | Global Fishing Watch, OSM | CC-BY / ODbL |
| Insurance requirements by country | Research + community | ODbL |
| Equipment specs and maintenance | Manufacturer data, community | ODbL |
| Weather patterns | ECMWF, GFS, Open-Meteo | CC-BY-4.0 / Public domain |
| Tidal data | NOAA CO-OPS, TICON-4 | Public domain / CC-BY-4.0 |

### How It's Consumed

- **Navigator** — seasonal routing, passage timing, stop suggestions
- **Pilot** — country procedures, customs, port details, anchorage recommendations
- **Engineer** — equipment knowledge, energy calculations, maintenance schedules
- **Bosun** — provisioning data, water/fuel estimates
- **Radio Operator** — VHF channels, safety nets, frequencies by region
- **Cruising almanac** — browseable without AI, searchable, community-updatable
- **Passage planner** — stop suggestions, facility matching

### Technical Implementation

- Hub: PostgreSQL + pgvector on Supabase
- Spoke: SQLite + sqlite-vec (offline)
- Embeddings: Voyage AI on hub, Ollama + nomic-embed-text on spoke
- Ingestion: documents chunked, embedded, stored with metadata (region, type, source)

---

## 5. The Boat Profile — Retention Loop

Once someone saves their boat, every agent gets smarter. That's the retention mechanism.

### What's Stored

- MMSI, vessel name, dimensions, draft, displacement, rig type, hull type
- Equipment registry (engines, solar panels, batteries, watermaker, etc.)
- Systems configuration (tank sizes, battery bank capacity, solar wattage)
- Documents (registration, insurance — stored locally, not uploaded)

### How It's Used

- **Navigator** knows draft (for depth constraints), speed (for ETAs), fuel capacity (for range)
- **Engineer** knows battery bank, solar setup, alternator — gives accurate energy forecasts
- **Bosun** knows tank sizes — calculates water/fuel for passage duration
- **Pilot** knows flag state — surfaces relevant regulations

### Progressive Disclosure

You don't fill in a form. You start using tools, and they ask for what they need. Navigator says "What's your typical cruising speed?" — your answer gets saved to the boat profile. Engineer says "How many watts of solar do you have?" — saved. The profile builds itself through conversation.

---

## 6. Distribution Strategy

### Build in Public

- Dev blog on the site — "Building an AI crew for sailors" series
- Short demo videos (screen recordings) for Reddit, Cruisers Forum, Noforeignland
- GitHub activity visible — open source credibility
- Transparency about decisions, trade-offs, progress, failures

### Creator Outreach

Target: 5-10 sailing YouTubers who are planning or on long voyages.

The move: use the Navigator to plan THEIR route. Send them a link to their own personalised plan with a note:

> "I built a free AI passage planning tool for sailors. I used it to plan your next season — here's what it came up with: [link]. The AI crew (Navigator, Engineer, Bosun) reasons about weather windows, cyclone seasons, provisioning, and energy. Would love your feedback."

Not a pitch. A gift. The best ones will try it, share it, maybe make content about it.

### Viral Loop

Every route the Navigator creates has a shareable URL. When someone shares "here's my circumnavigation plan," the viewer sees the tool, tries it, creates their own plan, shares it. The product markets itself if the output is good enough to share.

### Community Seeding

- Post route plans in relevant sailing forums with genuine context
- Contribute to existing communities (Noforeignland, Cruisers Forum) before promoting
- The cruising almanac generates SEO traffic — every port page is a landing page

### No Paid Marketing

No ads, no sponsored content, no paid influencers. The project is free and open source. Its credibility depends on being genuine. Word of mouth from sailors who actually use it.

---

## 7. LLM Cost Model

The platform is free but Claude API calls are not. At launch scale (hundreds of users doing multi-turn passage planning with tool_use and RAG), monthly LLM costs need management.

**Approach:**
- Rate limit per user (e.g., 50 conversations/month for free accounts)
- Cache common queries — seasonal routing for popular regions, standard country entry procedures
- Use shorter context where possible — not every agent turn needs full RAG context
- Monitor costs weekly; if they spike, add a queue for peak times
- Long-term: if costs become significant, accept donations via Open Collective or similar. Never restrict features behind payment.

**Graceful degradation:** If Claude API is unavailable or rate-limited, show: "Navigator is busy — try again in a moment." Tools that don't need AI (chartplotter, energy calculator, VHF sim) continue working.

---

## 8. Data Seeding Effort

The RAG knowledge base requires upfront data engineering before agents can be smart:

| Data set | Source | Effort | When |
|----------|--------|--------|------|
| Cruising seasons (global regions) | Editorial + climatology data | 2-3 days | Month 1 |
| Cyclone basins and timing | NOAA/NHC public data | 1 day | Month 1 |
| Trade wind / monsoon patterns | Pilot chart climatology | 1-2 days | Month 1 |
| Country entry procedures (top 30 destinations) | Open sources, sailing forums, editorial | 1 week | Month 1-2 |
| Port basics (top 500 ports) | NGA World Port Index + OSM | 2-3 days | Month 2 |
| Anchorages (global) | Global Fishing Watch + OSM | 1-2 days | Month 2 |
| Equipment specs | Manufacturer public data | Ongoing | Month 2-3 |

This is front-loaded — the first 30 country procedures and cruising season data must be ready before Navigator can give useful advice.

---

## 9. Build Sequence (3 Months)

### Month 1: April — Foundation + Navigator

- Go API: Claude integration, agent orchestration (Watchman + 6 agents), tool_use loop
- RAG pipeline: pgvector on Supabase, cruising season data, country procedures, port data
- Navigator agent: conversational passage planning, circumnavigation routing, seasonal timing
- Agent crew handoffs: Engineer, Bosun, Pilot, Radio Op surface contextually
- Interactive route map: MapLibre with route visualisation, shareable URLs
- Community site: landing page with live tool demos, blog, knowledge base
- VHF simulator and energy planner already built — polish, integrate into site, use as proof of capability
- Start build-in-public content
- Data seeding: cruising seasons, cyclone basins, top 30 country entry procedures

### Month 2: May — Platform + Tools

- Chartplotter: S-57 NOAA charts on MapLibre via PMTiles pipeline
- Boat management: profile, equipment registry, maintenance tracking
- Energy planner: connected to Engineer agent, passage energy forecasting
- Weather integration: Open-Meteo, GRIB overlay, wind visualisation
- Tides: NOAA CO-OPS integration, tidal predictions at waypoints
- Cruising almanac: browseable, searchable, community-updatable
- Hub-spoke sync foundation
- Docker spoke image (alpha)
- Account system: Google OAuth, save/sync

### Month 3: June — Polish + Launch

- MFD shell: app grid, split views, status bar
- Full agent integration across all tools
- Spoke deployment: Docker on N100/HALPI2, gateway support (iKonvert, NavLink2)
- Passage planner: weather routing, departure timing, resource estimates
- Community features: forums, discussions, almanac contributions
- Creator outreach: personalised route demos to 5-10 sailing YouTubers
- Public launch

---

## 10. Success Metrics

### Leading Indicators (first 30 days)

- Shareable route links getting clicked (viral loop)
- Sailors saving boat profiles (commitment)
- Return visits (retention)
- Organic posts on sailing forums mentioning it

### Lagging Indicators (by end of summer)

- At least 1 sailing creator makes content about it (unpaid)
- Community contributions to the almanac
- Someone installs the spoke Docker image on a boat
- GitHub stars/forks (developer interest)

### Not Measured

- User count (vanity at this stage)
- Revenue (none, by design)
- App store ratings (no app store)

---

## 11. Explicitly Post-Launch

These are important but not launch-critical. They ship after the platform is live and the first users are providing feedback:

- **Social features** — friend tracking via AIS, shared routes, fleet coordination, crew matching. The vision's "social-first" principle is real, but the launch leads with tools, not social.
- **Apple Sign In** — required for iOS App Store but not for web launch. Add when PWA distribution to iOS becomes a priority.
- **Messaging** — direct, boat-to-boat, group chat. Needs a user base first.
- **Likes/reputation** — community quality signals. Needs content volume first.
- **Advanced weather routing** — isochrone algorithm with boat polars. Navigator gives seasonal/pattern advice at launch; full computational routing comes later.
- **Radar overlay** — vendor protocols are locked down. Deferred indefinitely.

---

## 12. What Differentiates This Launch

Every competitor in this space launches with "here's our app, it does charts/weather/routing, pay us $99/year."

Above Deck launches with: "Meet the Navigator. Tell her where you want to sail. She'll plan the trip, call in the Engineer to check your energy, the Bosun to plan provisions, the Pilot to handle customs. They're your crew. They're free. Forever."

That's not a product launch. That's a story. Stories spread.
