# Above Deck — Technical Architecture

**Date:** 2026-03-26
**Status:** Draft v1
**Companion to:** above-deck-product-vision-v2.md

---

## 1. Overview

This document covers the technical architecture for the Above Deck platform. It describes decisions and rationale — not implementation detail. It is the companion to the product vision document and should be read alongside it.

The architecture follows a hub-and-spoke model:

- **Hub** — cloud infrastructure. Hosts the platform services, serves browser users, stores community data, provides RAG databases, proxies external APIs.
- **Spokes** — on-boat instances. Each boat runs its own OS on dedicated hardware. Works 100% offline. Syncs with the hub when connectivity is available.
- **Apps** — run on the hub (browser), the spoke (on-boat), or both.

### Do no harm

The top-level requirement is that the spoke must be able to run alongside any existing marine electronics and do no harm. The spoke defaults to **observe-only mode** — it reads data from NMEA 2000 gateways, AIS receivers, and Victron devices but does not write to any bus or modify any existing system. A boat with a working Raymarine or Garmin setup can install Above Deck with zero risk to existing instruments.

Write access (autopilot control, digital switching, CAN bus commands) is an explicit opt-in, per-device, after the user has verified safe operation. The system is designed to coexist, not replace — both can run in parallel indefinitely.

---

## 2. Data Stores

### Decision: PostgreSQL backbone on hub, SQLite on spoke

**Hub (PostgreSQL via Supabase):**

- **Relational data** — users, boats, equipment, groups, routes, almanac entries, moderation queues
- **Geospatial** — PostGIS extension. POI locations, route geometries, anchorage positions, geofencing
- **Vector search** — pgvector extension. RAG embeddings for almanac, pilot books, manufacturer data, regulations
- **Time-series** — TimescaleDB extension (add when needed). Historical instrument data uploaded from spokes, weather data, analytics
- **Auth** — Supabase Auth. Google, Apple, social providers. JWT tokens.
- **Real-time** — Supabase Realtime. Live position sharing, messaging, fleet coordination.
- **Storage** — Supabase Storage (S3-compatible). Charts, images, documents, GRIB files, PDFs.

One database, multiple extensions. Fewer moving parts for a solo builder. Supabase provides auth, real-time, and storage out of the box.

**Spoke (SQLite):**

- **Relational data** — local copy of boat profile, equipment, routes, almanac (synced from hub)
- **Vector search** — sqlite-vec extension. Local RAG for AI agents when offline
- **Time-series** — instrument data stored locally, uploaded to hub when connected
- **Geospatial** — SpatiaLite extension or simple lat/lng queries
- **Storage** — local filesystem for cached charts, GRIB files, documents

SQLite is embedded in the Go binary — no separate database server, no operational overhead, survives power cycles, runs on any hardware.

**Scale-out path (noted, not planned):**

If scale demands it in future:
- Dedicated vector DB (Qdrant, Weaviate) for RAG at scale
- Dedicated time-series DB (InfluxDB, TimescaleDB standalone) for high-volume instrument data
- Dedicated object storage (R2, S3) for large files
- Read replicas for hub PostgreSQL

This is a solo-builder project. One database is correct until proven otherwise.

---

## 3. Backend Services

### Decision: Go monolith, not microservices

A single Go binary that embeds the frontend static assets and provides all backend services. No microservices, no service mesh, no message broker — until scale demands it.

**Why Go:**
- Single binary, no runtime dependencies
- Excellent concurrency (goroutines for instrument data streams)
- Strong standard library (HTTP server, JSON, crypto, testing)
- Cross-compiles to ARM64 (spoke hardware) and AMD64 (hub)
- Embeds static frontend via `embed.FS`

**Services within the binary:**

| Service | Responsibility |
|---------|---------------|
| **API server** | REST API for all client interactions. Auth middleware, rate limiting, CORS. |
| **Protocol adapters** | NMEA 0183, NMEA 2000, Victron, AIS, BLE, MQTT, SignalK. Parse gateway TCP/UDP streams into the unified data model. Spoke only. |
| **Data model** | Unified representation of all boat systems. In-memory state + SQLite persistence. |
| **Monitoring service** | Watches data streams, evaluates threshold rules, triggers alerts. Spoke only. |
| **Alert engine** | Multi-channel alerting — local, push, SMS, email. Escalation rules. |
| **AI agent runtime** | Hosts the six specialist agents. Manages lifecycle, data subscriptions, tool registry, inter-agent communication. |
| **RAG pipeline** | Embedding generation, vector search, context assembly for AI agents. |
| **Sync engine** | Hub-spoke data synchronisation. Conflict resolution, offline queue, incremental sync. |
| **Security scanner** | NMEA 2000 network audit, WiFi scan, device fingerprinting. Spoke only. |
| **Plugin host** | Loads and manages third-party plugins (screens, adapters, data model extensions, AI tools). |
| **MCP server** | Exposes the data model to external AI systems via Model Context Protocol. |
| **WebSocket server** | Real-time data to frontend — instrument updates, agent messages, alerts. |

**API design:**

- REST for CRUD operations
- WebSocket for real-time data (instruments, alerts, agent chat)
- MCP for external AI integration
- Auth via JWT (Supabase Auth on hub, local auth on spoke)
- API keys for third-party access (rate limited, tied to user accounts to prevent scraping)
- Versioned API (v1, v2) for backwards compatibility

**Hub vs Spoke:**

The same Go binary runs on both hub and spoke. Feature flags or build tags control which services are active:

- **Hub mode** — API server, sync engine (hub side), RAG pipeline, auth (Supabase), real-time (Supabase), weather proxy, MCP server
- **Spoke mode** — API server, protocol adapters, monitoring, alerts, sync engine (spoke side), AI agents, RAG pipeline (local), security scanner, plugin host, WebSocket server, MCP server

---

## 4. Frontend

### Decision: Astro 5 + React 19 islands + Mantine v7

**Why this stack:**

- **Astro** — SSR and static rendering. Fast page loads, good SEO for community site. Hybrid — some pages static (blog, KB), some server-rendered (app).
- **React islands** — rich interactive components (chartplotter, instrument dashboard, MFD shell) as React islands within Astro pages. Only hydrate what needs to be interactive.
- **Mantine** — component library with dark mode, accessibility, progressive disclosure built in. Tabler Icons.
- **PWA** — `@vite-pwa/astro` with Workbox. Installable, offline-capable service worker. Caches app shell, charts, route data.

**MFD Shell:**

The composable MFD interface is a React application:
- App grid home screen with live thumbnail previews
- Split view engine — any two apps side by side, adjustable ratio
- Persistent status bar — position, time, connectivity, alarms
- Global night mode / red light mode
- Responsive — 7" to 27" displays
- Keyboard and touch input

**State management:**

- **Zustand 5** — client-side state, persisted to localStorage/IndexedDB
- **TanStack Query 5** — server state, caching, background refetching

**Maps:**

- **MapLibre GL JS** — open source vector map rendering, self-hostable, no vendor lock-in
- NOAA ENC (S-57) chart data
- OpenSeaMap overlay
- Custom layers (AIS, weather, tides, POIs, hazards, routes)

**Charts/graphs:**

- **Recharts 2** — instrument gauges, energy graphs, time-series visualisation

**Monorepo structure:**

```
packages/
  site/       — community web presence (blog, KB, forums, admin, marketing)
  tools/      — all sailing applications (chartplotter, passage planner, weather, tides, energy planner, boat management, VHF sim, MFD shell). Run on hub (browser) and spoke (offline). Bidirectional sync.
  shared/     — shared theme, colours, fonts, types
  api/        — Go API server (hub and spoke)
```

---

## 5. AI / Agent Stack

### Decision: Claude API + custom agent framework in Go

**Why not an off-the-shelf agent framework:**

- Most agent frameworks are Python/TypeScript — we're in Go
- Our agent model is domain-specific (6 agents, marine context, real-time data streams)
- We need tight integration with the data model and monitoring services
- Simpler to build exactly what we need than adapt a general framework

**Architecture:**

```
User / Chat Interface
        │
   Watchman (Orchestrator)
        │
   ┌────┼────┬────┬────┐
   │    │    │    │    │
  Nav  Eng  Radio Bosun Pilot
   │    │    │    │    │
   └────┴────┴────┴────┘
        │
   Tool Registry ─── Weather API, Chart Lookup, AIS Query,
        │              Tide Data, Equipment DB, Almanac, etc.
        │
   RAG Pipeline ─── pgvector (hub) / sqlite-vec (spoke)
        │
   Data Model ──── Live instrument data, boat config, routes
```

**Agent runtime:**

Each agent is a Go struct with:
- System prompt (personality, role, expertise)
- Data subscriptions (which data paths it monitors)
- Tool definitions (what it can invoke)
- RAG sources (which knowledge bases it queries)
- Alert rules (when to proactively notify)

The runtime manages:
- Agent lifecycle (start, stop, health check)
- Message routing (user → Watchman → specialist)
- Tool execution (sandboxed, audited)
- RAG query pipeline (embed query → vector search → context assembly)
- Inter-agent communication (Navigator asks Engineer a question)
- Conversation history and context management

**LLM integration:**

- Claude API for all agent reasoning
- Structured tool_use for agent actions
- Streaming responses for chat interface
- Hub proxies LLM calls when spoke is online
- Spoke can cache common queries / use smaller models for simple tasks when offline (future)

**RAG pipeline:**

- **Ingestion** — documents chunked, embedded (voyage model TBD), stored in pgvector (hub) / sqlite-vec (spoke)
- **Sources** — cruising almanac, pilot books, manufacturer manuals, regulations, cruising admin data, weather patterns, community knowledge
- **Query** — agent formulates query, embedded, nearest neighbours retrieved, assembled as context for LLM call
- **Sync** — hub maintains the canonical RAG database. Spoke pulls relevant subsets by region/topic for offline use.

**MCP server:**

Exposes the entire data model to external AI systems:
- Instrument data (position, wind, depth, battery, etc.)
- Boat configuration (equipment, specs)
- Route and passage data
- Almanac and POI data
- Weather and tide data
- Agent status and alerts

Third-party AI tools can query Above Deck data without building custom integrations.

---

## 6. Hub Infrastructure

### Decision: Hosting-agnostic, Docker-based, Supabase for managed services

**Hub components:**

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Go API server | Docker container | API, sync, RAG, MCP, weather proxy |
| PostgreSQL | Supabase (managed) | Relational, geospatial, vector, auth, real-time |
| Object storage | Supabase Storage | Charts, images, documents, GRIB files |
| Frontend | Static deploy (Netlify/Vercel/Cloudflare Pages) | Community site + hosted apps |
| Analytics | Umami (self-hosted) | Privacy-respecting usage analytics |
| Monitoring | Uptime Kuma or similar | Health checks, uptime monitoring |

**Hosting-agnostic:**

The Go API server runs in any Docker environment:
- Fly.io, Railway, Render (PaaS)
- AWS ECS, GCP Cloud Run, Azure Container Apps (cloud)
- Hetzner, DigitalOcean (VPS with Docker)
- Self-hosted (docker-compose on any server)

Supabase can be self-hosted if needed (docker-compose). No vendor lock-in.

**Auth:**

- Supabase Auth — Google, Apple, social providers
- JWT tokens — verified by both hub and spoke
- API keys — for third-party access, tied to user accounts, rate limited
- Spoke auth — JWT validated locally when offline (cached public key)

**Weather/data proxy:**

The hub proxies external data APIs to:
- Add caching (reduce external API calls)
- Handle API key management (users don't need their own keys)
- Aggregate multiple sources
- Transform data into Above Deck format
- Provide a single endpoint for spoke sync

Proxied services: weather (Open-Meteo, ECMWF), tides (NOAA CO-OPS), AIS (aisstream.io), chart data.

**CDN / Edge:**

- Static frontend assets via CDN (Cloudflare, Netlify Edge)
- Chart tiles cached at edge
- API responses not cached (dynamic, per-user)

---

## 7. Spoke (On-Boat) Deployment

### Decision: Single Docker container, Mac Mini or similar hardware

**The spoke is a single Docker container** containing:
- Go binary (API server, protocol adapters, monitoring, agents, sync, security)
- Embedded frontend (static assets served by Go)
- SQLite database (relational, vector, time-series)
- Local filesystem (cached charts, GRIB files, documents)

`docker run abovedeck/spoke` — one command, everything starts.

**Hardware:**

Primary recommendation: Mac Mini or equivalent (Intel N100 mini PC, HALPI2).
- Low power (3-15W idle)
- Fanless options available
- Runs Docker natively
- Connected to display(s) via HDMI
- Connected to gateways via USB/WiFi/Ethernet

**Networking on the boat:**

```
NMEA 2000 backbone
    │
    ├── NavLink2 (WiFi gateway) ──── TCP/UDP ──── Spoke
    ├── iKonvert (USB gateway) ──── USB ──── Spoke
    ├── veLink (Victron BLE→N2K) ──── via NavLink2 ──── Spoke
    ├── NAVLink Blue (BLE sensors→N2K) ──── via NavLink2 ──── Spoke
    │
RTL-SDR dongle ──── USB ──── Spoke (AIS, weatherfax, NAVTEX)
    │
IP cameras ──── Ethernet/WiFi ──── Spoke
    │
4G/5G router ──── Ethernet ──── Spoke ──── Internet ──── Hub
```

**Startup and operation:**

- Auto-starts on boot (Docker restart policy)
- Health checks — self-monitoring, restart on failure
- Watchdog — hardware watchdog timer (if supported)
- Graceful degradation — if hub unreachable, everything works locally
- Log rotation — bounded disk usage
- Automatic updates — pull new Docker image from hub when online (user-initiated, not forced)

**Resource constraints:**

| Resource | Budget |
|----------|--------|
| RAM | ~512MB-1GB for Go binary + SQLite + embedded frontend |
| Disk | ~2-10GB for SQLite + cached charts + GRIB files |
| CPU | Minimal idle. Spikes during RAG queries, chart rendering, protocol parsing |
| Network | Local only (boat LAN). Internet optional for sync. |

---

## 8. Sync Architecture

### Decision: Hub is canonical for community data, spoke is canonical for boat data

**Principle:** The boat is the source of truth for its own data. The hub is the source of truth for community data.

**What syncs:**

| Direction | Data | Frequency |
|-----------|------|-----------|
| Hub → Spoke | Almanac updates, RAG database (regional subset), weather forecasts, tide data, chart updates, route library, user profile changes | On connect, then periodic |
| Spoke → Hub | Logbook entries, track data, position reports, community contributions (reviews, photos), boat profile changes, instrument history (opt-in) | On connect, queued offline |
| Bidirectional | Routes (user-created), equipment registry, saved settings | On connect, conflict resolution |

**Offline queue:**

When the spoke has no internet:
- Changes are queued in SQLite (sync_queue table)
- Each change is timestamped and tagged with type
- On reconnect, queue is drained in order
- Hub acknowledges each item, spoke removes from queue

**Conflict resolution:**

- **Last-write-wins** for simple fields (boat name, user bio)
- **Merge** for additive data (logbook entries, track points — both sides keep their additions)
- **Hub-wins** for community data (almanac entries, moderation decisions)
- **Spoke-wins** for instrument data (boat knows its own state)
- **Flag for manual resolution** for anything ambiguous (rare)

**Bandwidth awareness:**

- Spoke knows when it's on satellite (low bandwidth) vs 4G vs marina WiFi
- Sync priorities: alerts and position first, then queued changes, then bulk data (charts, RAG updates) last
- Delta sync — only changed records, not full database dumps
- Compression — gzip on all sync payloads

---

## 9. Security

### Auth and access control

- Social auth (Google, Apple) via Supabase Auth
- JWT tokens with short expiry, refresh tokens
- Role-based access — user, moderator, admin
- Boat-level access — owner, crew (read/write), guest (read-only)
- API keys for third-party access — tied to user accounts, rate limited, revocable
- Spoke local auth — JWT validated offline with cached public key. Local admin PIN for on-boat access without internet.

### API protection

- All API endpoints require authentication (no anonymous write access)
- Rate limiting per user / per API key
- Request signing for spoke-to-hub sync (prevent replay)
- CORS restricted to known origins
- Input validation at all boundaries

### Anti-scraping

Community data (almanac, POIs, routes, reviews) is the product of community effort. API access requires authenticated user accounts to prevent commercial companies bulk-scraping the data. Rate limits, request patterns, and abuse detection protect against automated extraction.

### On-boat security

- NMEA 2000 network security scanner (see vision doc 6.18)
- WiFi audit — open networks, weak passwords, rogue APs
- CAN bus access audit — unprotected entry points
- Device fingerprinting and anomaly detection
- Audit logging
- All spoke-to-hub communication over TLS
- SQLite database encrypted at rest (SQLCipher or similar)

### Data privacy

- User data belongs to the user
- Position sharing is opt-in, granular (friends, group, public, off)
- Instrument data upload is opt-in
- No third-party analytics trackers
- Self-hosted analytics (Umami)
- GDPR-aware — data export, deletion on request

---

## 10. Protocol Adapters (Spoke)

The spoke's hardware abstraction layer consists of protocol adapters that translate gateway-specific data into the unified data model.

### Adapter interface

Each adapter implements a common Go interface:

- Connect to data source (TCP, UDP, USB serial, WebSocket)
- Parse incoming messages
- Map to unified data model paths
- Emit events on data change
- Handle bidirectional communication where supported (autopilot, digital switching)
- Health check and reconnection logic

### Supported adapters

| Adapter | Source | Transport | Bidirectional |
|---------|--------|-----------|---------------|
| NMEA 0183 | WiFi gateways (WLN30), serial | TCP/UDP, serial | Yes (autopilot) |
| NMEA 2000 | iKonvert USB, NavLink2, YDWG-02 | USB serial, TCP/UDP | Yes (switching, autopilot) |
| Victron VE.Direct | Direct serial | Serial 19200 baud | Read-only |
| Victron MQTT | Cerbo GX | MQTT TCP 1883 | Read-only |
| AIS | NMEA 0183 sentences or AIS-catcher | TCP/UDP | Read-only |
| BLE Sensors | NAVLink Blue → N2K → adapter | Via NMEA 2000 adapter | Read-only |
| SDR | AIS-catcher, fldigi, YanD | UDP | Read-only |
| SignalK | iKommunicate, SignalK server | HTTP/WebSocket | Read (write via SignalK PUT) |
| IP Camera | RTSP/ONVIF | TCP | Read-only |
| MQTT (DIY) | ESP32 sensors | MQTT TCP 1883 | Bidirectional |

### Auto-discovery

The spoke attempts to auto-discover data sources on the local network:
- mDNS/Bonjour for SignalK servers
- UDP broadcast scan for NMEA WiFi gateways
- USB device enumeration for iKonvert, VE.Direct, SDR
- Manual configuration available for everything

---

## 11. Data Model

### Decision: Above Deck defines its own schema, not SignalK's

The unified data model is a hierarchical key-value structure representing all boat systems. It is the single source of truth for all instrument and system data on the spoke.

### Top-level paths

```
navigation/
  position/          — lat, lng, altitude
  heading/           — magnetic, true
  course/            — over ground
  speed/             — through water, over ground
  depth/             — below transducer, below keel, below surface
  wind/              — apparent, true (angle, speed)
  attitude/          — heel, trim, yaw
  autopilot/         — mode, target heading, rudder angle

electrical/
  batteries/         — voltage, current, soc, capacity, temp, cycles (per bank)
  solar/             — panel output, daily yield, efficiency (per array)
  chargers/          — state, output, mode (per charger)
  inverters/         — load, state, frequency (per inverter)
  alternators/       — output, temp (per alternator)
  shore/             — connected, voltage, current
  loads/             — per-circuit state, current draw, fault (via digital switching)

propulsion/
  engines/           — rpm, oil pressure, coolant temp, exhaust temp, fuel rate, hours (per engine)
  transmissions/     — gear, oil temp, oil pressure
  fuel/              — consumption rate, total consumed

tanks/
  fuel/              — level, capacity, consumption rate (per tank)
  freshwater/        — level, capacity, consumption rate
  blackwater/        — level, capacity
  greywater/         — level, capacity
  lpg/               — level, capacity

environment/
  inside/            — temperature, humidity, pressure (per zone)
  outside/           — temperature, humidity, pressure, sea temp
  refrigeration/     — temperature (per unit)

steering/
  rudder/            — angle (per rudder)
  autopilot/         — linked to navigation/autopilot

hvac/
  zones/             — target temp, actual temp, mode, fan speed (per zone)

switching/
  circuits/          — state, current, fault, type (per circuit)
  scenes/            — active scene, available scenes

notifications/
  alerts/            — active alerts, history
  alarms/            — active alarms, acknowledged, escalated

ais/
  vessels/           — nearby vessels (MMSI, name, position, course, speed, CPA, TCPA)

cameras/
  feeds/             — URL, name, status (per camera)
```

### Data model characteristics

- **Hierarchical** — paths like `electrical/batteries/house/voltage`
- **Typed** — every path has a defined type (float64, string, bool, enum, timestamp)
- **Timestamped** — every value has a last-updated timestamp
- **Observable** — subscribers notified on change (pub/sub within the Go process)
- **Persistent** — current state persisted to SQLite, survives restart
- **Historical** — time-series storage for trends and graphs (configurable retention)
- **SignalK mappable** — bidirectional mapping to/from SignalK paths for compatibility

---

## 12. SignalK Compatibility

### Decision: Adapter, not dependency

Above Deck is not built on SignalK but provides full compatibility:

**Inbound adapter:**
- Connects to existing SignalK servers via WebSocket
- Maps SignalK paths to Above Deck data model paths
- One of many protocol adapters, not a privileged position

**Outbound adapter:**
- Exposes Above Deck data as SignalK-compatible REST and WebSocket endpoints
- Existing SignalK apps (WilhelmSK, Instrument Panel, etc.) can connect
- Above Deck appears as a SignalK server to external clients

**Why not build on SignalK:**
- SignalK is Node.js — conflicts with our Go-only backend principle
- SignalK's data model is designed for interoperability, ours for our tools and AI
- SignalK on Raspberry Pi is fragile (SD card failures, Node.js version issues)
- We want a single binary, not a Node.js runtime + plugins

---

## 13. Testing Strategy

- **Unit tests** — Vitest (frontend), Go testing package (backend). Run on every change.
- **Integration tests** — Go tests against real SQLite database. Protocol adapter tests against recorded NMEA data.
- **End-to-end tests** — Playwright. Browser-based testing of full user flows.
- **NMEA simulator** — iKreate hardware or software simulator for protocol adapter testing without a boat.
- **CI/CD** — GitHub Actions. Lint, test, build, deploy on every push.
- **Test-driven development** — tests written first, implementation follows.

---

## 14. Deployment Pipeline

### Hub

```
Push to main
    │
    ├── GitHub Actions: lint + test + build
    │
    ├── Build Docker image (Go API)
    │
    ├── Build static frontend (Astro)
    │
    ├── Deploy API → Fly.io (or equivalent)
    │
    ├── Deploy frontend → Netlify (or equivalent)
    │
    └── Deploy Supabase migrations
```

### Spoke

```
Release tag
    │
    ├── Build multi-arch Docker image (ARM64 + AMD64)
    │
    ├── Push to container registry
    │
    ├── Spoke checks for update (user-initiated)
    │
    ├── Pull new image
    │
    ├── Stop old container, start new
    │
    └── Run migrations on local SQLite
```

### Development

```
docker-compose up
    │
    ├── Go API (hot reload via air)
    │
    ├── Astro frontend (dev server with HMR)
    │
    ├── Supabase local (via supabase CLI)
    │
    └── NMEA simulator (optional)
```

One command: `docker compose up` — full local development environment.

---

## 15. Tech Stack Summary

| Layer | Technology | Why |
|-------|-----------|-----|
| Backend | Go | Single binary, concurrency, cross-compile, no runtime deps |
| Database (hub) | PostgreSQL via Supabase | Relational + PostGIS + pgvector + TimescaleDB. Auth, real-time, storage included |
| Database (spoke) | SQLite + sqlite-vec + SpatiaLite | Embedded, zero-config, survives power cycles, single file |
| Frontend framework | Astro 5 | SSR + static hybrid, fast, good SEO |
| UI components | React 19 + Mantine v7 | Rich islands, dark mode, accessibility, progressive disclosure |
| State (client) | Zustand 5 | Simple, persisted, minimal boilerplate |
| Server state | TanStack Query 5 | Caching, background refetch, offline support |
| Maps | MapLibre GL JS | Open source, self-hostable, no vendor lock-in |
| Charts/graphs | Recharts 2 | React-native charting, instrument gauges |
| PWA | @vite-pwa/astro + Workbox | Installable, offline service worker |
| AI | Claude API | Agent reasoning, tool_use, streaming |
| Vector search | pgvector (hub), sqlite-vec (spoke) | RAG embeddings for AI agents |
| Icons | Tabler Icons | Consistent, Mantine default |
| Testing | Vitest + Playwright + Go testing | Unit, integration, e2e |
| CI/CD | GitHub Actions | Lint, test, build, deploy |
| Hosting (API) | Fly.io (or any Docker host) | Simple, scales, hosting-agnostic |
| Hosting (frontend) | Netlify (or Vercel/Cloudflare Pages) | CDN, edge, simple deploys |
| Analytics | Umami (self-hosted) | Privacy-respecting |
| Monorepo | pnpm workspaces | site/ (community), tools/ (all sailing apps — hub + spoke), shared/, api/ |

---

## 16. Open Questions (for future resolution)

- **LLM for offline agents** — when spoke has no internet, should agents use a smaller local model (e.g. Ollama + Llama) for basic queries? Or just queue questions for when connectivity returns?
- **Chart tile serving** — self-hosted tile server on spoke for offline charts, or pre-download tile packages per region?
- **Multi-display** — how does the MFD shell handle multiple simultaneous displays (helm + nav station)? Shared state with independent views?
- **Voice interface** — "Engineer, turn off the watermaker" — speech recognition on-device or cloud?
- **Matter/Thread** — when to add smart home protocol support? What devices are actually useful on boats?
- **Radar data** — Navico/Furuno/Raymarine all use different protocols. How much reverse engineering is needed?
- **NMEA 2000 certification** — do we need to certify as an NMEA 2000 product, or is read-only via gateways sufficient?
