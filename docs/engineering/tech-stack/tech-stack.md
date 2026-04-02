# Tech Stack Specification

**Date:** 2026-03-31
**Status:** Draft v1
**Companion to:** engineering-standards.md, above-deck-technical-architecture.md

---

## Overview

This document specifies every technology in the Above Deck stack. For each choice, it covers what the technology is, why it was chosen over alternatives, version pinning strategy, and license compatibility with the project's GPL license.

Above Deck is 100% free and open source, GPL-licensed, and foundation-owned.

### Version Pinning Strategy (Global)

- **Go:** Pin to latest stable minor (e.g., `go 1.22`). Update on each minor release after CI passes.
- **Node.js / pnpm:** Pin to LTS major (e.g., Node 20). Lock file (`pnpm-lock.yaml`) checked in.
- **Frontend packages:** Pin exact versions in `package.json`. Dependabot PRs for updates, merged after CI passes.
- **Go modules:** `go.sum` checked in. `go mod tidy` in CI. Dependabot for updates.
- **Docker base images:** Pin to specific digest or minor version tag (e.g., `golang:1.22-bookworm`), never `latest`.
- **Supabase:** Track stable releases. Local dev uses Supabase CLI pinned to specific version.

---

## 1. Spoke (On-Boat OS) — Go Backend

### Go

| | |
|---|---|
| **What** | Statically compiled systems language from Google |
| **Version** | 1.22+ (latest stable) |
| **License** | BSD 3-Clause — GPL compatible |

**Why Go over alternatives:**

- **vs Rust:** Go compiles faster, has a gentler learning curve for a solo builder, and the standard library covers HTTP, JSON, crypto, and testing without external crates. Rust's borrow checker and compile times slow iteration. Go's concurrency model (goroutines + channels) maps naturally to streaming instrument data. Rust is better for embedded systems with tight memory constraints, but the spoke runs on hardware with 4-16GB RAM — Go's garbage collector is fine.
- **vs Python:** Python requires a runtime, has poor concurrency (GIL), and produces large Docker images. Go compiles to a single binary with zero runtime dependencies. Python's dynamic typing is a liability for a safety-adjacent system parsing binary protocols.
- **vs Node.js:** The project explicitly avoids Node.js dependencies on the backend. Node's single-threaded event loop is unsuitable for concurrent protocol parsing. Go cross-compiles to ARM64 natively; Node requires platform-specific native modules. SignalK is Node-based and its operational fragility on boat hardware (SD card failures, version conflicts) is a cautionary tale.

**What Go provides in this project:**

- Single binary deployment (no runtime, no interpreter, no dependency hell)
- `embed.FS` for bundling static frontend assets into the binary
- Native cross-compilation to ARM64 (spoke hardware) and AMD64 (hub)
- Goroutines for concurrent protocol adapter streams (NMEA, Victron, AIS, MQTT — all running simultaneously)
- Strong standard library: `net/http`, `encoding/json`, `crypto`, `testing`, `database/sql`
- Build tags (`//go:build hub` / `//go:build spoke`) for hub vs spoke feature selection from the same codebase

---

### SQLite

| | |
|---|---|
| **What** | Embedded relational database — runs in-process, no server |
| **Version** | 3.45+ (via `modernc.org/sqlite` or `mattn/go-sqlite3`) |
| **License** | Public Domain — GPL compatible |

**Why SQLite over alternatives:**

- **vs Embedded PostgreSQL:** No embedded PostgreSQL exists in Go. Running a full PostgreSQL server on a boat adds operational complexity (separate process, memory overhead, crash recovery). SQLite is a single file, survives power cycles, runs in-process with zero configuration.
- **vs Redis:** Redis is an in-memory cache, not a relational database. Boat data needs durable storage that survives reboots. Redis requires a separate server process. SQLite provides relational queries, transactions, and persistence in a single file.
- **vs DuckDB:** DuckDB excels at analytics but lacks the ecosystem of extensions (sqlite-vec, SpatiaLite) needed for vector search and geospatial queries. SQLite's read/write pattern matches the spoke workload better than DuckDB's columnar analytics focus.

**What SQLite provides in this project:**

- Relational data: boat profile, equipment registry, routes, almanac (synced from hub)
- Time-series storage: instrument data with configurable retention
- Sync queue: offline changes queued for upload to hub
- Configuration storage: adapter settings, alert thresholds, user preferences
- Single file backup: copy the `.db` file for full backup

**Go driver:** `modernc.org/sqlite` (pure Go, no CGO required for basic use) or `mattn/go-sqlite3` (CGO, required for SpatiaLite extension loading). Decision depends on whether SpatiaLite is loaded as an extension or queries are handled in Go code.

---

### sqlite-vec

| | |
|---|---|
| **What** | SQLite extension for vector similarity search |
| **Version** | Latest stable |
| **License** | MIT — GPL compatible |

**Why sqlite-vec:**

- Enables vector similarity search within the same SQLite database — no separate vector DB process
- Powers offline RAG for AI agents when the spoke has no internet connectivity
- Lightweight: adds vector operations to SQLite without a separate service
- Compatible with embeddings generated by Ollama (nomic-embed-text) on the spoke

**What it provides:**

- k-NN and ANN vector search on locally stored embeddings
- RAG context retrieval for cruising almanac, pilot books, manufacturer manuals, regulations
- Regional knowledge subsets synced from hub for offline use

---

### SpatiaLite

| | |
|---|---|
| **What** | SQLite extension for geospatial queries (the SQLite equivalent of PostGIS) |
| **Version** | 5.1+ |
| **License** | MPL 1.1 / GPL 2+ / LGPL 2.1+ (tri-licensed) — GPL compatible |

**Why SpatiaLite:**

- Adds proper geospatial operations (point-in-polygon, distance calculations, spatial indexing) to SQLite
- Required for offline route planning, anchorage proximity search, geofencing alerts
- Alternative: implement Haversine distance in Go code for simple queries and skip SpatiaLite. Evaluate during implementation whether the extension's complexity is justified vs simple lat/lng math in Go.

**Note:** SpatiaLite requires CGO and `mattn/go-sqlite3`. If the pure-Go SQLite driver is preferred, geospatial queries can be handled in Go application code with the `golang.org/x/geo` package instead.

---

### Docker

| | |
|---|---|
| **What** | Container runtime for packaging and deploying the spoke |
| **Version** | 24+ (Docker Engine) |
| **License** | Apache 2.0 — GPL compatible |

**Why Docker:**

- `docker run abovedeck/spoke` — one command starts everything
- Multi-arch images (ARM64 + AMD64) from a single build pipeline
- Consistent environment across all supported hardware (Mac Mini M4, Intel N100, HALPI2)
- Automatic restart on failure (restart policy)
- Clean upgrade path: pull new image, stop old container, start new
- Rollback: previous image retained locally

**Multi-arch build:**

- `docker buildx` with `linux/arm64` and `linux/amd64` platforms
- GitHub Actions builds both architectures on every release
- Single manifest tag covers both architectures — `docker pull` gets the right one

**On macOS (Mac Mini M4):**

- Docker runs via a lightweight Linux VM
- OrbStack recommended over Docker Desktop (~400MB vs ~2GB RAM overhead)
- OrbStack is proprietary but free for personal use; Docker Desktop is also an option

---

### SocketCAN / go-socketcan

| | |
|---|---|
| **What** | Linux kernel CAN bus interface and Go bindings |
| **Version** | Kernel 5.x+ (SocketCAN), latest go-socketcan |
| **License** | GPL 2.0 (kernel) / MIT (go bindings) — GPL compatible |

**Why SocketCAN:**

- Linux-native CAN bus access — no proprietary drivers
- Direct NMEA 2000 communication via USB CAN adapters (iKonvert, YDWG-02)
- Required for bidirectional NMEA 2000 (autopilot control, digital switching) when those features are opted in
- `go-socketcan` provides Go bindings for SocketCAN's raw frame interface

**Limitation:** Only available on Linux. macOS spoke (Mac Mini M4) uses USB serial gateways instead of raw CAN access.

---

### Serial Port Libraries

| | |
|---|---|
| **What** | Go libraries for USB serial communication |
| **Package** | `go.bug.st/serial` or `github.com/tarm/serial` |
| **License** | BSD 3-Clause — GPL compatible |

**Why serial port access:**

- **VE.Direct protocol:** Victron solar controllers, battery monitors, and inverters communicate via serial at 19200 baud. Direct serial reading is the simplest, most reliable integration path.
- **NMEA 0183:** Many marine instruments still output NMEA 0183 over RS-422 serial (via USB adapter). Backup path when WiFi gateways are unavailable.
- **iKonvert:** Digital Yacht's USB NMEA 2000 gateway uses a USB serial interface.

---

### MQTT Client

| | |
|---|---|
| **What** | MQTT protocol client for pub/sub messaging |
| **Package** | `github.com/eclipse/paho.mqtt.golang` |
| **License** | Eclipse Public License 2.0 — GPL compatible |

**Why MQTT:**

- **Victron Cerbo GX:** Victron's GX devices expose all system data over MQTT on the local network (port 1883, no auth required). This is the richest data source for Victron systems — battery state, solar yield, inverter load, generator status.
- **ESP32 DIY sensors:** Makers building custom boat sensors (bilge level, fridge temperature, LPG detector) commonly use ESP32 + MQTT. Supporting MQTT means these sensors work without custom adapter code.
- **Bidirectional:** MQTT supports both subscribing to data and publishing commands (e.g., remotely switching a Victron inverter on/off via Cerbo GX).

---

### WebSocket Server

| | |
|---|---|
| **What** | Real-time bidirectional communication between Go backend and browser frontend |
| **Package** | `github.com/gorilla/websocket` or `nhooyr.io/websocket` |
| **License** | BSD 3-Clause / MIT — GPL compatible |

**Why WebSocket:**

- Real-time instrument data streaming to the frontend (position, wind, depth, battery — updating multiple times per second)
- Agent chat messages streamed as they generate
- Alert notifications pushed immediately
- Lower overhead than HTTP polling for high-frequency data
- `nhooyr.io/websocket` is the more modern option with better context cancellation support; `gorilla/websocket` is more battle-tested but the maintainer archived it (now community-maintained).

---

### Embedded Frontend (Go embed.FS)

| | |
|---|---|
| **What** | Go 1.16+ feature to embed static files into the compiled binary |
| **Version** | Built into Go standard library |
| **License** | BSD 3-Clause (part of Go) — GPL compatible |

**Why embed.FS:**

- The spoke serves its own frontend — no separate web server (nginx, caddy) needed
- Single binary contains everything: API server, protocol adapters, monitoring, AND the complete frontend
- Eliminates deployment complexity: one Docker image, one process, one thing to manage on the boat
- Frontend is built by Astro (static export), then embedded into the Go binary at compile time

---

### Litestream

| | |
|---|---|
| **What** | Streaming SQLite replication to S3-compatible storage |
| **Version** | 0.3.x |
| **License** | Apache 2.0 — GPL compatible |

**Why Litestream:**

- Continuous backup of the spoke's SQLite database to cloud storage (S3, R2, MinIO, or local USB)
- Disaster recovery layer independent of the hub sync mechanism
- If the spoke's storage fails, the full database can be restored from the latest replica
- Near-zero performance impact — replicates WAL frames asynchronously
- Not a replacement for hub sync (which is selective and bidirectional) — Litestream is a full byte-level backup

---

### Air

| | |
|---|---|
| **What** | Live reload for Go applications during development |
| **Version** | Latest |
| **License** | GPL 3.0 — GPL compatible |

**Why Air:**

- Hot reloads the Go binary on file changes during development
- Faster iteration than manual `go build && ./binary` cycles
- Configured via `.air.toml` in the repo root
- Development only — not included in production Docker images

---

### Ollama + nomic-embed-text

| | |
|---|---|
| **What** | Local LLM runtime (Ollama) running a text embedding model (nomic-embed-text) |
| **Version** | Ollama latest; nomic-embed-text v1.5 |
| **License** | MIT (Ollama) / Apache 2.0 (nomic-embed-text model) — GPL compatible |

**Why Ollama for local embeddings:**

- Generates vector embeddings on the spoke without internet connectivity
- Powers offline RAG: user asks the AI agent a question, the spoke embeds the query locally, searches sqlite-vec, and assembles context
- nomic-embed-text is small enough to run on spoke hardware (Mac Mini M4, Intel N100) with acceptable latency
- Full agent reasoning still requires connectivity to Claude API — local embeddings enable context retrieval only, not LLM inference

**Resource impact:**

- nomic-embed-text: ~275MB model file, ~500MB RAM during inference
- Embedding generation: ~100ms per query on Apple Silicon, ~200ms on Intel N100
- Runs on-demand (not constantly loaded) to minimize resource usage

---

## 2. Hub (Cloud) — Supabase + Go

### Supabase

| | |
|---|---|
| **What** | Open-source Firebase alternative built on PostgreSQL |
| **Version** | Track stable releases |
| **License** | Apache 2.0 — GPL compatible |

**Why Supabase over alternatives:**

- **vs Firebase:** Firebase is proprietary (Google), uses a document database (Firestore), and creates deep vendor lock-in. Supabase is open source, uses PostgreSQL (relational + extensions), and can be self-hosted. Firebase's pricing is unpredictable at scale. Supabase's data model is SQL — familiar, powerful, and portable.
- **vs Raw PostgreSQL:** Supabase provides auth, real-time subscriptions, storage, and Row Level Security out of the box. Building these from scratch on raw PostgreSQL would take months of solo development time. Supabase's client libraries handle JWT management, real-time WebSocket connections, and file uploads. The underlying PostgreSQL is fully accessible — Supabase is an accelerator, not an abstraction that hides the database.
- **vs PocketBase:** PocketBase is a single Go binary with embedded SQLite — similar to our spoke architecture. But for the hub, we need PostgreSQL's extensions (PostGIS, pgvector, TimescaleDB), proper multi-user concurrency, and managed infrastructure. PocketBase is excellent for small projects but lacks the extension ecosystem.

**What Supabase provides:**

- PostgreSQL database with full SQL access
- Authentication (OAuth, JWT, PKCE)
- Row Level Security (RLS) policies
- Real-time subscriptions via WebSocket
- S3-compatible object storage
- Auto-generated REST API (PostgREST)
- Dashboard for database management
- Local development via Supabase CLI
- Self-hostable (docker-compose) — no vendor lock-in

---

### PostgreSQL Extensions

#### PostGIS

| | |
|---|---|
| **What** | Geospatial extension for PostgreSQL |
| **Version** | 3.4+ |
| **License** | GPL 2.0+ — GPL compatible |

**Why PostGIS:**

- Industry-standard geospatial queries: point-in-polygon, distance calculations, spatial indexing, geometry operations
- Required for: POI locations, route geometries, anchorage positions, geofencing, proximity search, marina/mooring databases
- Available as a Supabase extension — no separate installation

#### pgvector

| | |
|---|---|
| **What** | Vector similarity search extension for PostgreSQL |
| **Version** | 0.7+ |
| **License** | PostgreSQL License (permissive) — GPL compatible |

**Why pgvector:**

- Vector similarity search within PostgreSQL — no separate vector database
- Powers hub-side RAG: cruising almanac, pilot books, manufacturer manuals, regulations, community knowledge
- Stores embeddings alongside the source documents in the same database
- Available as a Supabase extension
- Alternatives (Qdrant, Weaviate, Pinecone) are separate services that add operational complexity. pgvector keeps everything in one database until scale demands otherwise.

#### TimescaleDB

| | |
|---|---|
| **What** | Time-series extension for PostgreSQL |
| **Version** | 2.x (Community Edition) |
| **License** | Apache 2.0 (Community Edition) — GPL compatible |

**Why TimescaleDB:**

- Efficient storage and querying of time-series instrument data uploaded from spokes
- Automatic partitioning (hypertables), compression, and retention policies
- SQL-native — queries look like normal PostgreSQL, no separate query language
- Add when needed — not required at launch. Standard PostgreSQL tables with timestamp indexes are sufficient for initial volumes.

**Note:** Only the Community Edition (Apache 2.0) is used. The proprietary features in TimescaleDB's "License" edition are not needed and would not be GPL-compatible.

---

### Supabase Auth

| | |
|---|---|
| **What** | Authentication service built on GoTrue |
| **Version** | Tracks Supabase releases |
| **License** | MIT (GoTrue) — GPL compatible |

**Configuration:**

- **Google OAuth** at launch (PKCE flow for SPAs)
- **Apple Sign In** added post-launch
- No email/password auth — social login only simplifies security surface
- JWT tokens with short expiry + refresh tokens
- JWTs verified by both hub (Supabase validates) and spoke (cached public key for offline validation)
- API keys for third-party access — tied to user accounts, rate-limited, revocable

---

### Supabase Realtime

| | |
|---|---|
| **What** | Real-time data streaming via PostgreSQL's logical replication |
| **Version** | Tracks Supabase releases |
| **License** | Apache 2.0 — GPL compatible |

**What it provides:**

- Live position sharing between boats (opt-in, granular privacy controls)
- Real-time messaging and fleet coordination
- Database change notifications pushed to connected clients
- Presence tracking (who's online, who's nearby)

---

### Supabase Storage

| | |
|---|---|
| **What** | S3-compatible object storage with RLS policies |
| **Version** | Tracks Supabase releases |
| **License** | Apache 2.0 — GPL compatible |

**What's stored:**

- Chart tile packages (PMTiles format)
- GRIB weather data files
- Document uploads (manuals, certificates, registration papers)
- User-uploaded images (anchorage photos, equipment photos)
- RAG source documents (pilot books, almanac PDFs)

---

### Go API Server (Hub Mode)

| | |
|---|---|
| **What** | The same Go binary as the spoke, running with hub build tags |
| **Build tags** | `//go:build hub` |

**Hub-mode services:**

- REST API server (proxies to Supabase for auth/data, adds business logic)
- Sync engine (hub side — receives spoke uploads, sends updates)
- RAG pipeline (embedding generation, vector search, context assembly)
- Weather/data proxy (caches external APIs, manages API keys, transforms data)
- Firmware tracker (monitors manufacturer firmware releases)
- MCP server (exposes data model to external AI systems)

**Hosting:** Docker container on any platform — Fly.io, Railway, Render, AWS ECS, GCP Cloud Run, Hetzner VPS, or self-hosted. Hosting-agnostic by design.

---

## 3. Frontend — Astro + React

### Astro 5

| | |
|---|---|
| **What** | Web framework with SSR + static hybrid rendering and islands architecture |
| **Version** | 5.x |
| **License** | MIT — GPL compatible |

**Why Astro over alternatives:**

- **vs Next.js:** Astro's islands architecture hydrates only interactive components — the rest is zero-JS HTML. Next.js hydrates entire pages. For a content-heavy site (blog, knowledge base, almanac) with interactive tools (chartplotter, instrument dashboard), Astro's selective hydration is ideal. Next.js also ties you to Vercel's ecosystem and React Server Components add complexity. Astro is framework-agnostic — React islands today, could add Svelte or Solid islands later without rewriting.
- **vs SvelteKit:** SvelteKit is excellent but requires rewriting all UI code in Svelte. The React ecosystem has more component libraries (Ant Design), more map libraries (react-map-gl), and more charting libraries (Recharts). For a solo builder, leveraging the larger React ecosystem is more productive. Astro + React islands gets the best of both: Astro's static performance and React's component ecosystem.
- **vs Remix:** Remix is React-only and focused on server-rendered apps. Astro handles the content site (static) and the interactive tools (SSR + islands) in one framework.

**What Astro provides:**

- Static pages for content (blog, knowledge base) — fast, SEO-friendly, cacheable
- SSR for dynamic pages (user dashboard, boat management) via `@astrojs/node`
- Islands architecture — React components hydrate independently
- Built on Vite — fast HMR in development
- Content Collections for structured content (MDX blog posts, knowledge articles)
- File-based routing
- Integration ecosystem (`@astrojs/react`, `@astrojs/sitemap`, `@vite-pwa/astro`)

---

### React 19

| | |
|---|---|
| **What** | UI component library for building interactive interfaces |
| **Version** | 19.x |
| **License** | MIT — GPL compatible |

**Why React over alternatives:**

- **vs Solid:** Solid has better performance benchmarks but a much smaller ecosystem. No equivalent to Ant Design, fewer map libraries, fewer charting options. For a solo builder, ecosystem size matters more than microsecond rendering differences.
- **vs Vue:** Vue is excellent but splitting the ecosystem (Vue + Nuxt vs React + Astro) adds cognitive overhead. React's hooks model maps well to Zustand and TanStack Query. The MFD shell, chartplotter, and instrument dashboard are complex interactive applications — React's mature tooling (devtools, profiler, Testing Library) helps debug them.
- **vs Preact:** Preact is API-compatible with React but some Ant Design components rely on React-specific internals. The 40KB size difference is negligible for a PWA that's cached after first load.

**React in this project:**

- Functional components only (no class components)
- Hooks for state and effects
- Strict TypeScript mode — no `any`
- Islands within Astro pages — only interactive sections hydrate

---

### Ant Design 5 (antd)

| | |
|---|---|
| **What** | Ant Design: comprehensive React UI library with 60+ components, built-in dark mode, i18n, and accessibility. Tailwind CSS: utility-first CSS framework for custom layout and spacing. |
| **Version** | antd 5.x, Tailwind CSS 4.x |
| **License** | Both MIT — GPL compatible |

**Why Ant Design 5 + Tailwind CSS:**

- **Ant Design 5** is the most popular React component library by npm downloads. It provides 60+ production-ready components (Tables, Forms, DatePickers, Tree views, Transfer lists, Modals, Tooltips, Tabs, and more) — all needed for boat management, passage planning, and equipment registries. Built-in dark mode via `ConfigProvider` theme customization, built-in i18n support (important for an international sailing community), and excellent TypeScript support.
- **Tailwind CSS** is used alongside Ant Design for custom layout and utility classes. antd handles components, Tailwind handles spacing, layout, and custom styling. Utility-first approach eliminates CSS naming debates, produces consistent spacing/sizing, and purges unused styles at build time for minimal bundle size.
- **Why over shadcn/ui:** More complete out of the box — tables, forms, date pickers, tree views, transfer lists are all included and production-ready, rather than requiring individual component installation and customization. Built-in i18n support. Built-in theme system via `ConfigProvider`. No manual component copying or CLI tooling needed.
- **Why over Mantine:** Broader adoption (most popular React component library by npm downloads), better documentation, stronger enterprise track record, and more comprehensive component set.
- **vs Chakra UI:** Chakra v3 was a complete rewrite with breaking changes. Ant Design 5 is stable and more widely adopted.

**What Ant Design 5 + Tailwind CSS provides:**

- 60+ accessible React components (Modal, Tabs, Accordion, DatePicker, Table, Form, Tree, Transfer, Tooltip, Notification, etc.)
- Built-in dark mode via `ConfigProvider` theme customization — token-based theming maps to the blueprint aesthetic
- Built-in i18n support (40+ locales) — critical for international sailing community
- Excellent TypeScript support with full type definitions
- React Hook Form compatible for custom form management
- Ant Design Icons (@ant-design/icons) — consistent icon set
- Tailwind responsive utilities (`sm:`, `md:`, `lg:`, `xl:`) for layout
- Accessibility built in (ARIA attributes, keyboard navigation, focus management)

---

### Zustand 5

| | |
|---|---|
| **What** | Minimal client-side state management for React |
| **Version** | 5.x |
| **License** | MIT — GPL compatible |

**Why Zustand over alternatives:**

- **vs Jotai:** Jotai's atomic model is elegant for fine-grained reactivity but adds complexity for shared state (boat configuration, user preferences, MFD layout). Zustand's single-store model with slices is simpler to reason about and debug.
- **vs Redux / Redux Toolkit:** Redux requires actions, reducers, selectors, middleware — significant boilerplate for the value it provides. Zustand achieves the same with plain functions and direct state mutation (via Immer internally). Redux's devtools advantage is offset by Zustand's own devtools middleware.
- **vs React Context:** Context causes re-renders in all consumers when any value changes. Zustand's selector-based subscriptions only re-render components that use the specific state that changed. Critical for the MFD shell where multiple instruments render simultaneously.

**What Zustand provides:**

- Client-side state: MFD layout, instrument configuration, user preferences, night mode toggle
- Persistence middleware: state persisted to localStorage or IndexedDB, survives page refresh
- Devtools middleware: inspect state in browser devtools
- Minimal API surface: `create()`, `useStore()`, selectors

---

### TanStack Query 5

| | |
|---|---|
| **What** | Server state management — data fetching, caching, synchronization |
| **Version** | 5.x |
| **License** | MIT — GPL compatible |

**Why TanStack Query over alternatives:**

- **vs SWR:** TanStack Query has a richer feature set: query invalidation, optimistic updates, infinite queries, mutation lifecycle hooks, devtools. SWR is simpler but lacks the mutation management needed for offline-first patterns (queue mutations when offline, replay on reconnect).
- **vs plain fetch:** Manual data fetching requires implementing caching, deduplication, background refetching, retry logic, and loading/error states from scratch. TanStack Query provides all of this with declarative configuration.

**What TanStack Query provides:**

- Server state caching with configurable stale times
- Background refetching (keep instrument data fresh)
- Offline support: queries return cached data when offline, mutations queue for replay
- Optimistic updates for responsive UI
- Query invalidation after mutations
- Devtools for inspecting cache state

---

### MapLibre GL JS

| | |
|---|---|
| **What** | Open-source vector map rendering library (WebGL-based) |
| **Version** | 4.x |
| **License** | BSD 3-Clause — GPL compatible |

**Why MapLibre over alternatives:**

- **vs Mapbox GL JS:** Mapbox GL JS v2+ has a proprietary license — requires a Mapbox access token and compliance with their terms of service. MapLibre is the open-source fork of Mapbox GL JS v1, maintained by a foundation. No vendor lock-in, no API key requirements for the rendering library itself.
- **vs Leaflet:** Leaflet is raster-based (image tiles) — no vector rendering, no smooth zooming, no 3D terrain, no dynamic styling. MapLibre renders vector tiles client-side with WebGL, enabling smooth pan/zoom, rotation, dynamic label placement, and custom layer styling. For a chartplotter, vector rendering is essential.
- **vs OpenLayers:** OpenLayers has a larger API surface and steeper learning curve. MapLibre's style specification (compatible with Mapbox Style Spec) is simpler and has better ecosystem tooling. OpenLayers is more capable for GIS applications but more complex for web map rendering.

**What MapLibre provides:**

- Vector tile rendering (PMTiles, MBTiles, or tile server)
- Custom layers: AIS vessel positions, weather overlays, tidal streams, route lines, POI markers, hazard areas
- Smooth pan/zoom/rotate with WebGL
- Style specification for theming (dark mode chartplotter aesthetic)
- React integration via `react-map-gl` (Uber's React wrapper, works with MapLibre)
- Offline: vector tiles cached locally (spoke) or via service worker (PWA)

**Chart data sources:**

- NOAA ENC (S-57) converted to vector tiles
- OpenSeaMap overlay
- Self-hosted tile server on spoke for offline chart access (PMTiles format)

---

### Recharts 2

| | |
|---|---|
| **What** | React charting library built on D3 |
| **Version** | 2.x |
| **License** | MIT — GPL compatible |

**Why Recharts over alternatives:**

- **vs D3 directly:** D3 is powerful but low-level — building a responsive, interactive chart from D3 primitives takes 10x the code of a Recharts component. Recharts provides declarative React components (`<LineChart>`, `<AreaChart>`, `<BarChart>`) that compose naturally with the rest of the UI.
- **vs Chart.js:** Chart.js uses Canvas rendering (raster), not SVG. SVG-based charts (Recharts) are easier to style with CSS, integrate with React's component model, and support accessibility (screen readers can parse SVG). Chart.js requires a wrapper library for React integration.
- **vs Nivo:** Nivo is also built on D3 and produces beautiful charts, but has a larger bundle size and more opinionated styling. Recharts is more customizable for the blueprint aesthetic.

**What Recharts provides:**

- Instrument gauges (battery voltage, solar yield, tank levels)
- Time-series graphs (energy production/consumption, wind speed history, depth trends)
- Bar charts (daily solar yield, fuel consumption)
- Area charts (tide predictions)
- Responsive by default — renders correctly on 7" to 27" displays

---

### Ant Design Icons (@ant-design/icons)

| | |
|---|---|
| **What** | Official icon set for Ant Design |
| **Version** | Latest (`@ant-design/icons`) |
| **License** | MIT — GPL compatible |

**Why Ant Design Icons:**

- Ant Design's default icon set — zero configuration needed, consistent with the component library
- 700+ icons in outlined, filled, and two-tone styles
- Outlined style matches the blueprint/draughtsman aesthetic with clean line weights
- Tree-shakeable — only import icons actually used
- Consistent with the Ant Design component library used throughout the project

---

## 4. PWA

### @vite-pwa/astro + Workbox

| | |
|---|---|
| **What** | PWA plugin for Astro (built on Vite) with Workbox service worker generation |
| **Version** | Latest stable (`@vite-pwa/astro`), Workbox 7.x |
| **License** | MIT (@vite-pwa) / MIT (Workbox) — GPL compatible |

**Why PWA:**

The PWA is the single frontend for BOTH the hub and the spoke. When connected to the hub (cloud), the browser loads the PWA from the CDN. When connected to the spoke (on-boat), the browser loads the same PWA served by the Go binary's `embed.FS`. Same code, same UI, different backend.

**PWA capabilities:**

- **Installable:** Add to home screen on mobile/tablet. Runs full-screen without browser chrome. Essential for helm-mounted tablets.
- **Offline caching:** Service worker caches the app shell, so the UI loads even without network. On the spoke, this is belt-and-suspenders — the Go binary serves the frontend directly, but the service worker provides instant loading on subsequent visits.
- **Push notifications:** Alert delivery via web push (supported on Android, iOS 16.4+, desktop). Used for anchor drag alerts, weather warnings, MOB alarm.
- **Background sync:** Queue API calls when offline, replay when online. (Limited on iOS — see limitations below.)

**Cache strategies:**

| Content | Strategy | Rationale |
|---------|----------|-----------|
| App shell (HTML, JS, CSS) | Cache-first | Immutable after build. Versioned via content hash. |
| Chart tiles (by region) | Cache-first | Large, rarely change. Pre-cached for downloaded regions. |
| API responses (instruments, boat data) | Stale-while-revalidate | Show cached data immediately, fetch fresh in background. |
| Real-time data (WebSocket) | Network-only | Live instrument data must be current. Falls back to last-known in UI. |
| GRIB weather files | Cache-first with expiry | Weather files are valid for their forecast window, then stale. |
| Route and passage data | Stale-while-revalidate | User-created data. Show cached, sync in background. |
| Static content (blog, KB) | Stale-while-revalidate | Content changes infrequently. Show cached, update in background. |

**What's pre-cached by region:**

When a user downloads a cruising region for offline use:
- Chart tiles (PMTiles package for the region)
- Tide prediction data (harmonic constants for regional stations)
- RAG embeddings (almanac, pilot book content for the region)
- POI data (anchorages, marinas, hazards in the region)
- Weather station metadata

**App manifest configuration:**

```json
{
  "name": "Above Deck",
  "short_name": "Above Deck",
  "display": "standalone",
  "orientation": "any",
  "theme_color": "#1a1a2e",
  "background_color": "#1a1a2e",
  "categories": ["navigation", "weather", "utilities"]
}
```

**Limitations:**

- **iOS background sync:** iOS terminates service workers aggressively. Background sync is unreliable. Mitigation: sync happens when the app is in the foreground.
- **iOS push notifications:** Supported since iOS 16.4, but requires the PWA to be added to home screen. Cannot prompt for permission from Safari — user must install first.
- **Storage quotas:** Browsers limit service worker cache storage (typically 50-100MB per origin, up to 60% of disk on Chrome). Chart tiles for large regions may exceed this — the spoke's local filesystem is the primary offline storage, not the PWA cache.
- **No native hardware access:** PWA cannot access USB serial ports, CAN bus, or Bluetooth directly. The spoke's Go binary handles all hardware access; the PWA communicates with it via HTTP/WebSocket.

---

## 5. AI / LLM

### Claude API (Anthropic)

| | |
|---|---|
| **What** | Large language model API for agent reasoning |
| **Version** | Claude 4 (latest available model) |
| **License** | Commercial API — consumed as a service, not bundled. Project code using the API is GPL. |

**Why Claude over alternatives:**

- **vs GPT-4 (OpenAI):** Claude's structured `tool_use` API is cleaner than OpenAI's function calling. Claude handles long context windows better (important for RAG with large document chunks). Anthropic's safety focus aligns with a project where AI agents can eventually influence safety-critical systems (autopilot, alerts). The project founder's relationship with Anthropic's tooling (Claude Code as the development environment) makes Claude the natural fit.
- **vs Gemini (Google):** Gemini's tool_use support is less mature. Google's track record of deprecating products creates risk for a long-term open-source project.
- **vs Llama / open-weight models:** Running a 70B+ parameter model on spoke hardware is not feasible with current consumer hardware. A Mac Mini M4 with 16GB can run 7B models (Ollama + Llama 3), but the quality gap vs Claude for complex reasoning (passage planning, weather interpretation, equipment diagnostics) is significant. Open models are considered for the future as hardware improves and models shrink. Ollama is already used for embeddings (see section 1).

**How Claude is used:**

- **Agent reasoning:** The five specialist agents (Navigator, Engineer, Radio Operator, Bosun, Pilot) and the Watchman orchestrator use Claude for all reasoning tasks
- **Structured tool_use:** Agents call tools (weather lookup, chart query, AIS search, equipment database, tide prediction) via Claude's structured output — no prompt engineering for JSON extraction
- **Streaming responses:** Chat interface streams agent responses token-by-token for responsive UX
- **Context assembly:** RAG pipeline assembles context (relevant documents, instrument data, boat configuration), then calls Claude with the assembled context

**Offline behavior:**

When the spoke has no internet, Claude API is unavailable. The system degrades gracefully:
- RAG queries still work (local embeddings via Ollama + sqlite-vec search)
- Agent chat queues questions for when connectivity returns
- Monitoring and alerting continue (rule-based, no LLM needed)
- Pre-computed responses for common queries (cached from previous interactions) may be served

---

### Model Context Protocol (MCP)

| | |
|---|---|
| **What** | Open protocol for exposing data and tools to external AI systems |
| **Version** | Latest specification |
| **License** | MIT — GPL compatible |

**Why MCP:**

- Allows external AI tools (Claude Desktop, other MCP clients) to query Above Deck's data model without custom integration
- Exposes: instrument data, boat configuration, routes, weather, tides, alerts, equipment registry
- Bidirectional: external AI can both read data and invoke tools (with appropriate auth)
- Open standard — not tied to any single AI provider

---

### RAG Pipeline

| | |
|---|---|
| **What** | Retrieval-Augmented Generation — embed documents, search by similarity, assemble context for LLM calls |

**Components:**

| Component | Hub | Spoke |
|-----------|-----|-------|
| Vector store | pgvector (PostgreSQL) | sqlite-vec (SQLite) |
| Embedding model | API-based (Claude/OpenAI embeddings) | Ollama + nomic-embed-text (local) |
| Document chunking | Go code (recursive text splitter) | Same Go code |
| Context assembly | Go code (retrieve chunks, rank, truncate to context window) | Same Go code |

**RAG sources:**

- Cruising almanac and pilot books
- Manufacturer manuals and documentation
- Maritime regulations and safety guidelines
- Community-contributed knowledge (reviews, tips, anchorage notes)
- Weather pattern documentation
- Equipment specifications and compatibility data

---

## 6. Testing

### Vitest

| | |
|---|---|
| **What** | Fast unit testing framework for JavaScript/TypeScript, built on Vite |
| **Version** | 2.x |
| **License** | MIT — GPL compatible |

**Why Vitest over Jest:**

- Native Vite integration — uses the same config, plugins, and transform pipeline as the Astro build. No separate Babel/webpack configuration.
- Significantly faster than Jest for TypeScript projects (no separate compilation step)
- Compatible with Jest's API — same `describe`, `it`, `expect` syntax, minimal migration friction
- Built-in TypeScript support without `ts-jest`
- Watch mode uses Vite's HMR for near-instant re-runs

---

### Playwright

| | |
|---|---|
| **What** | End-to-end browser testing framework |
| **Version** | Latest stable |
| **License** | Apache 2.0 — GPL compatible |

**Why Playwright over Cypress:**

- Multi-browser testing (Chromium, Firefox, WebKit) in a single test run — Cypress only supports Chromium-based browsers natively
- True multi-tab and multi-origin support — important for testing OAuth flows (Google sign-in redirects to Google, then back)
- Faster execution — Playwright runs tests in parallel by default, Cypress runs sequentially
- Better network interception and mocking APIs
- Mobile emulation for testing helm-tablet layouts (7" to 13" screens)
- No paid dashboard required — Cypress gates useful features (parallelization, analytics) behind a paid plan

---

### Go testing package

| | |
|---|---|
| **What** | Go's built-in testing framework |
| **Version** | Built into Go standard library |
| **License** | BSD 3-Clause (part of Go) — GPL compatible |

**Why no external test framework (testify, gomega, ginkgo):**

- Go's standard `testing` package is sufficient — `t.Run()` for subtests, `t.Parallel()` for concurrent tests, `t.Helper()` for clean stack traces
- Table-driven tests are the idiomatic Go pattern — no BDD framework needed
- Adding testify's assertions (`assert.Equal`, `require.NoError`) is a reasonable convenience but not required — standard `if got != want` comparisons are clear
- External test frameworks add dependencies and non-standard patterns that make the codebase less approachable
- `go test ./...` runs everything — no custom test runner configuration

**Test types:**

| Type | Scope | Example |
|------|-------|---------|
| Unit | Single function | Parse a NMEA 0183 sentence, validate a PGN decode |
| Integration | Adapter + database | Protocol adapter writes to real SQLite, query results |
| Protocol | Binary data parsing | Replay recorded CAN frames, verify decoded values |
| Simulator | Full spoke system | NMEA simulator generates traffic, verify end-to-end data flow |

---

### Testing Library

| | |
|---|---|
| **What** | React component testing utilities — test components as users interact with them |
| **Package** | `@testing-library/react` |
| **Version** | 16.x |
| **License** | MIT — GPL compatible |

**What it provides:**

- Render React components in a test environment (jsdom)
- Query elements by accessible role, label, text — not by CSS class or test ID
- Fire events (click, type, select) that match user behavior
- Used with Vitest as the test runner

---

## 7. Build and Tooling

### pnpm

| | |
|---|---|
| **What** | Fast, disk-efficient package manager for Node.js |
| **Version** | 9.x |
| **License** | MIT — GPL compatible |

**Why pnpm over alternatives:**

- **vs npm:** pnpm uses a content-addressable store — packages are stored once on disk and hard-linked into `node_modules`. With three packages in the monorepo sharing many dependencies (React, Tailwind CSS, TypeScript), pnpm saves significant disk space and install time. npm's flat `node_modules` also allows phantom dependencies (importing packages not listed in your `package.json`); pnpm's strict `node_modules` structure prevents this.
- **vs Yarn:** Yarn Berry's Plug'n'Play (PnP) mode breaks compatibility with many tools. Yarn Classic is effectively unmaintained. pnpm's workspace support is mature and well-documented. Performance is comparable to Yarn Berry without the compatibility issues.

**Workspace structure:**

```
packages/
  site/       — @above-deck/site
  tools/      — @above-deck/tools
  shared/     — @above-deck/shared
  api/        — Go (not managed by pnpm)
```

Shared packages consumed via workspace protocol: `"@above-deck/shared": "workspace:*"`

---

### Vite

| | |
|---|---|
| **What** | Frontend build tool and dev server |
| **Version** | 6.x (bundled with Astro 5) |
| **License** | MIT — GPL compatible |

**Why Vite:**

- Astro 5 is built on Vite — no separate configuration needed
- Fast HMR in development (sub-100ms updates)
- Rollup-based production builds with tree-shaking and code splitting
- Plugin ecosystem shared with Astro (`@vite-pwa/astro`)

---

### Docker + Docker Compose

| | |
|---|---|
| **What** | Container runtime and multi-container orchestration |
| **Version** | Docker 24+, Compose v2 |
| **License** | Apache 2.0 — GPL compatible |

**What Docker provides:**

- **Production (spoke):** Single container runs the entire spoke — `docker run abovedeck/spoke`
- **Production (hub):** Go API server in a container, deployed to any Docker host
- **Development:** `docker compose up` starts Go API (hot reload via Air), NMEA simulator, and local Supabase
- **Multi-arch builds:** `docker buildx` produces ARM64 + AMD64 images from the same Dockerfile
- **CI:** GitHub Actions builds and tests in Docker containers

---

### GitHub Actions

| | |
|---|---|
| **What** | CI/CD platform integrated with GitHub |
| **Version** | N/A (managed service) |
| **License** | Proprietary (GitHub) — used as a service, not bundled. Free for public repos. |

**Pipeline (on every push):**

- Go: `golangci-lint` + `go test` + cross-compile check (ARM64 + AMD64)
- Frontend: ESLint + TypeScript typecheck + Vitest + Astro build
- Playwright e2e (on PR only)

**Pipeline (on merge to main):**

- All of the above
- Build multi-arch Docker image, push to GitHub Container Registry
- Build static frontend, deploy to CDN
- Deploy Supabase migrations

**Pipeline (on release tag):**

- Production Docker image with version tag
- GitHub Release with changelog
- Spoke update metadata published

---

### golangci-lint

| | |
|---|---|
| **What** | Go linting aggregator — runs multiple linters in a single pass |
| **Version** | Latest stable |
| **License** | GPL 3.0 — GPL compatible |

**What it checks:**

- `gofmt` formatting
- `govet` correctness
- `errcheck` (unchecked errors)
- `staticcheck` (static analysis)
- `gosec` (security issues)
- Additional linters configured per project needs

---

### ESLint + Prettier

| | |
|---|---|
| **What** | JavaScript/TypeScript linter (ESLint) + code formatter (Prettier) |
| **Version** | ESLint 9.x, Prettier 3.x |
| **License** | MIT (both) — GPL compatible |

**Configuration:**

- ESLint: TypeScript strict mode, React hooks rules, import ordering
- Prettier: consistent formatting (semicolons, quotes, trailing commas, print width)
- Run in CI — no unformatted code merges to main
- Editor integration for format-on-save

---

## 8. Fonts (Google Fonts CDN Only)

All fonts loaded via Google Fonts CDN. No self-hosted or commercial fonts.

### Space Mono

| | |
|---|---|
| **What** | Monospace font with character — draughtsman/blueprint aesthetic |
| **Usage** | Headings, navigation labels, section titles |
| **License** | OFL 1.1 (SIL Open Font License) — GPL compatible |
| **Weights** | 400 (Regular), 700 (Bold) |

**Why Space Mono:** Monospace fonts evoke technical drawing and schematics. Space Mono has personality without being gimmicky — it reads as "engineered" rather than "coded." Paired with Inter body text, it creates a clear visual hierarchy between headings and content.

---

### Inter

| | |
|---|---|
| **What** | Sans-serif font optimized for screen readability |
| **Usage** | Body text, labels, form inputs, navigation items |
| **License** | OFL 1.1 (SIL Open Font License) — GPL compatible |
| **Weights** | 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold) |

**Why Inter:** Designed specifically for computer screens with excellent legibility at small sizes. Critical for instrument displays where data density is high and text must be readable at a glance — including on vibrating helm-mounted displays in daylight. Inter's variable font support allows fine-tuning weight for different UI contexts.

---

### Fira Code

| | |
|---|---|
| **What** | Monospace font with programming ligatures |
| **Usage** | Code blocks, technical specifications, calculations, instrument readouts, data tables |
| **License** | OFL 1.1 (SIL Open Font License) — GPL compatible |
| **Weights** | 400 (Regular), 500 (Medium) |

**Why Fira Code:** Distinct from Space Mono (headings) — Fira Code is used for data and technical content. Ligatures improve readability of code examples in documentation and knowledge base articles. The monospace alignment is essential for data tables (tide predictions, passage plans, equipment specs) where columns must align precisely.

---

## 9. Analytics and Monitoring

### Umami

| | |
|---|---|
| **What** | Self-hosted, privacy-respecting web analytics |
| **Version** | Latest stable |
| **License** | MIT — GPL compatible |

**Why Umami:**

- Privacy-respecting: no cookies, no personal data collection, no fingerprinting
- GDPR-compliant by design — no consent banner needed
- Self-hosted: data stays on project infrastructure, not sent to third parties
- Lightweight: single script tag, ~1KB, no impact on page performance
- Tracks: page views, referrers, devices, countries — enough to understand usage patterns without invasive tracking
- Replaces Google Analytics, Plausible, Fathom, or any tracker that sends data to third parties

---

### Uptime Kuma

| | |
|---|---|
| **What** | Self-hosted uptime monitoring and status page |
| **Version** | Latest stable |
| **License** | MIT — GPL compatible |

**What it monitors:**

- Hub API server health (HTTP health check endpoint)
- Supabase availability
- Frontend CDN availability
- External API availability (weather, tides, AIS)
- Status page for community visibility

**Alternative:** Any health check tool works — Uptime Kuma is recommended for its simplicity and self-hosted nature. Could also use a simple Go health check endpoint with alerting via Pushover or similar.

---

### Prometheus Metrics (Spoke)

| | |
|---|---|
| **What** | Metrics exposition in Prometheus format from the spoke's Go binary |
| **Package** | `github.com/prometheus/client_golang` |
| **Version** | Latest stable |
| **License** | Apache 2.0 — GPL compatible |

**What's exposed:**

- Protocol adapter connection status (connected, disconnected, error rate per adapter)
- Data rates (messages per second per adapter)
- Error rates and types
- Memory and CPU usage
- SQLite query latency
- WebSocket connection count
- Sync queue depth

**Access:** Metrics endpoint is accessible only from the local network (Settings > Diagnostics). Not exposed to the internet. Can be scraped by a local Prometheus instance if the user wants historical metrics, but this is optional — the built-in diagnostics page renders the current state directly.

---

## License Compatibility Summary

All technologies in this stack are compatible with the project's GPL license:

| License | Technologies | Compatible |
|---------|-------------|------------|
| **Public Domain** | SQLite | Yes |
| **MIT** | React, Tailwind CSS, Ant Design (antd), @ant-design/icons, Zustand, TanStack Query, Recharts, Vitest, Testing Library, Workbox, @vite-pwa, pnpm, Vite, ESLint, Prettier, Supabase Auth (GoTrue), Umami, Uptime Kuma, Ollama, sqlite-vec, MapLibre, MCP | Yes |
| **BSD 3-Clause** | Go, Go embed.FS, Go testing, serial libraries, gorilla/websocket | Yes |
| **Apache 2.0** | Docker, Supabase, Supabase Realtime, Supabase Storage, TimescaleDB Community, Playwright, Prometheus client, Litestream, nomic-embed-text | Yes |
| **OFL 1.1** | Space Mono, Inter, Fira Code | Yes |
| **GPL 2.0+** | PostGIS, SocketCAN (kernel), Air | Yes |
| **GPL 3.0** | golangci-lint | Yes |
| **MPL/GPL/LGPL** | SpatiaLite (tri-licensed) | Yes |
| **PostgreSQL License** | pgvector | Yes (permissive) |
| **EPL 2.0** | Paho MQTT | Yes (GPL compatible per FSF) |
| **Commercial API** | Claude API (Anthropic), GitHub Actions | Consumed as services, not bundled |

No technology in this stack has a license that conflicts with GPL distribution.
