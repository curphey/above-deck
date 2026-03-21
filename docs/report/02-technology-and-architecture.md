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
| **Raspberry Pi 5** | ~2.7W | $80-120 | Good with enclosure + HAT | Default recommendation |
| **HALPI2 (CM5)** | ~3-4W | $300+ | Excellent — waterproof, NMEA built-in | Turnkey marine deployment |
| **Intel N100 Mini PC** | ~3.5-6W | $100-200 | Good — fanless models available | More compute headroom, USB NMEA adapters |
| **Fanless Industrial PC** | ~10-25W | $400-1500 | Excellent — DNV certified, wide temp/voltage | Commercial vessels, bluewater |
| **Synology NAS** | ~15-20W | $300-400 | Fair — not marine-rated | Already on the boat, extra container |

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

FastSeas is a proprietary, closed-source web-based routing tool. No public API, no published algorithm. It uses NOAA GFS + OSCAR currents, integrates with Windy.com, and supports satellite communicators (Garmin inReach, Zoleo) via email responder. Free tier: 5 routing requests/month. Premium: $5/month.

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
