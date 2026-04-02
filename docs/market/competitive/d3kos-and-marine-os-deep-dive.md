# Marine Software Ecosystem — Deep Competitive Research

**Date:** 2026-03-20
**Status:** Final v2
**Purpose:** Competitive intelligence for Above Deck — comprehensive analysis of open-source projects, commercial platforms, market dynamics, and strategic recommendations. Ideas and patterns only — no code will be taken (GPL boundary respected).

---

## Executive Summary

The marine software ecosystem splits into three layers: **closed commercial platforms** (Garmin, Raymarine, Navico/B&G, Furuno) that dominate helm hardware with 95%+ market share but frustrate users with lock-in and subscription creep; **open-source projects** (SignalK, OpenCPN, OpenPlotter, PyPilot) that provide powerful building blocks but deliver a fragmented, technically demanding experience; and **mobile-first apps** (Savvy Navvy, Orca, PredictWind, Navionics) that are winning the secondary-screen battle but lack hardware integration and community features.

**d3kOS** is the most ambitious attempt to build a unified, AI-powered marine platform on a Raspberry Pi. It is well-engineered for its domain but architecturally locked to single-boat/single-user hardware deployment with no mobile story, no modern frontend, and significant security gaps.

**The opportunity for Above Deck** is clear: a modern, design-first, AI-native platform that provides the unified experience the ecosystem lacks — running on any hardware (Docker), working offline-first, treating mobile as first-class, and owning its data model while maintaining SignalK interoperability. The building blocks exist (MapLibre, Open-Meteo, SignalK protocol, NOAA charts); the missing piece is a cohesive product with modern UX.

**Key findings:**
1. No single product combines charting + monitoring + logbook + community + AI. Users need 3-5 apps.
2. The logbook gap is confirmed across every source — no viable open-source marine logbook exists.
3. B&G's sailing features (SailSteer, laylines, polars) set the commercial standard — no open-source equivalent exists.
4. Subscription fatigue is the #1 user frustration. An integrated open-source offering has a clear value proposition.
5. Starlink adoption is transforming connectivity assumptions — apps can now assume periodic broadband even offshore.
6. Tablet-as-chartplotter is the growth vector (30-40% of active boaters). MFD hardware is a mature, locked-down market.

---

## Part 1: d3kOS Deep Dive

### What It Is

d3kOS ("d3k Operating System" / "Helm-OS") is a Raspberry Pi 4B-based marine electronics platform targeting non-technical boaters (ages 45-70). It integrates NMEA2000 engine monitoring, IP camera surveillance (1-20 cameras), offline voice assistant, AI navigation analysis, and a Flask-based web dashboard — all distributed as a pre-built SD card image.

**Version:** v0.9.2 (active), built by a single operator (Captain Don Moskaluk, MV Serenity) using Claude + Ollama for development.

### Tech Stack Assessment

| Layer | d3kOS Choice | Above Deck Choice | Assessment |
|-------|-------------|-------------------|------------|
| Backend | Flask (Python 3) | Go | Flask is adequate for Pi constraints but Go is superior for concurrency, binary distribution, and performance |
| Frontend | Vanilla JS + Jinja2 | Astro 5 + React 19 | d3kOS has no framework, no build pipeline, no component system. Above Deck is generations ahead |
| Marine Data | SignalK (consumed) | Own data model + SignalK adapter | d3kOS depends on SignalK entirely. Above Deck owns its schema — stronger long-term position |
| Database | SQLite | Supabase (PostgreSQL + PostGIS) | SQLite is fine for single-device. Supabase enables multi-device, cloud sync, geospatial |
| AI | Gemini 2.5 Flash + Ollama | MCP server (AI-native) | d3kOS bolts AI onto specific features. Above Deck designs for AI to reason across everything |
| Voice | Vosk + PocketSphinx + Piper | Not planned yet | d3kOS's offline voice pipeline is genuinely strong for helm use |
| CV | YOLOv8n (ONNX Runtime) | Not planned | Fish/obstacle detection is domain-specific to d3kOS's powerboat audience |
| Maps | AvNav (embedded iframe) | MapLibre GL JS | Above Deck owns the rendering stack — critical for UX control |
| Charts | AvNav tile serving | NOAA ENC (S-57) + OpenSeaMap | Both use open data. Above Deck's direct S-57 parsing gives more control |
| Deployment | Pre-built SD card image | Docker | Docker runs on any hardware. SD images lock you to Pi |
| Auth | None | Supabase Auth (Google OAuth) | d3kOS has zero authentication on any endpoint |
| Testing | Bash scripts + pytest | Vitest + Playwright (TDD) | Above Deck's testing discipline is significantly stronger |
| CI/CD | None | GitHub Actions | d3kOS has no automated pipeline |
| Type Safety | None | TypeScript + Go | d3kOS has no static typing anywhere |

### Architecture Analysis

**Service topology:** 22+ independent microservices on a single Pi 4, each a separate Python/Flask process with its own port (3000-8111). No Docker, no service mesh, no orchestration. Services communicate via HTTP REST and WebSocket (Signal K).

| Port | Service | Protocol |
|------|---------|----------|
| 3000 | Flask dashboard | HTTP |
| 3001 | Gemini AI proxy | HTTP |
| 3002 | AI Bridge (route/port/anchor/voyage) | HTTP + SSE |
| 8080 | AvNav charts | HTTP |
| 8084 | Camera stream manager | HTTP |
| 8086 | Fish detector (YOLOv8) | HTTP |
| 8087 | Keyboard API | HTTP |
| 8089 | AI API (legacy) | HTTP |
| 8091 | License/tier API | HTTP |
| 8094 | Export manager | HTTP |
| 8095 | System management | HTTP |
| 8097 | Upload API | HTTP |
| 8098 | Timezone API | HTTP |
| 8099 | Signal K | HTTP + WS |
| 8100 | Backup API | HTTP |
| 8101 | Language API (i18n) | HTTP |
| 8103 | Community API | HTTP |
| 8107 | Preferences API | HTTP |
| 8111 | Remote access API | HTTP |

**Strengths:**
- Clean separation of concerns — each service has one job
- Safety-critical code is well-designed (anchor watch: 3-poll debounce, pre-recorded TTS fires before AI)
- Camera slot/hardware architecture is genuinely clever
- Frame buffer pattern prevents RTSP decoder explosion

**Weaknesses:**
- 22+ processes competing for Pi 4 resources (8GB RAM shared)
- No health aggregation — each service has its own health check pattern
- Broad `except Exception` in 36 locations — errors caught but not differentiated
- No rate limiting, no auth, no input validation on any endpoint
- Pre-built image distribution makes updates nearly impossible (no OTA mechanism)
- Single-user/single-boat assumption baked into every layer

### Code Quality — File-Level Assessment

| File | Lines | Grade | Notes |
|------|-------|-------|-------|
| `ai_bridge/features/anchor_watch.py` | 319 | A | Safety-critical done right. 3-poll debounce, pre-recorded TTS, daemon threads |
| `ai_bridge/utils/geo.py` | 72 | A+ | Pure functions, well-tested haversine/bearing math |
| `ai_bridge/ai_bridge.py` | 333 | A- | Solid SSE implementation, thread-safe subscriber management |
| `gemini_proxy.py` | 206 | A- | Clean fallback chain: Gemini -> Ollama -> error. Privacy-first (no query caching) |
| `dashboard/app.py` | 374 | B+ | Well-structured Flask app. Missing: input validation, auth, HTML escaping |
| `ai_bridge/utils/tts.py` | 210 | B | Multiple TTS engines (Piper, espeak-ng). Lacks specific error context |
| `helm.js` | 150+ | B- | Web Speech API polyfill detection is solid. Global state, inline event handlers |
| `cameras.js` | 140 | B | Efficient frame polling with interval cleanup. Tight DOM coupling |
| `nav.js` | 150+ | C+ | Mixes clock, ticker, nav, keyboard shortcuts, split pane — too many concerns |

### Security Assessment

| Area | Rating | Detail |
|------|--------|--------|
| Authentication | F | No auth on any endpoint. Anyone on boat WiFi has full control |
| Input Validation | D | `.strip()` only on form inputs. No length checks, HTML escaping, or charset validation |
| API Key Management | B+ | .env files, .gitignore covers secrets, pre-commit hook blocks key patterns |
| Rate Limiting | F | None. Any client can spam Gemini API |
| CORS | C | No explicit headers (relies on localhost-only assumption) |
| XSS | D | Vessel name renders without escaping in Jinja2 templates |

### Business Model

| Tier | Price | Features |
|------|-------|----------|
| T0 | Free | Pi dashboard only, no mobile |
| T1 | Free | + 1 paired phone (read-only) |
| T2 | $9.99/mo | + multi-phone, 3 free "Fix My Pi" diagnostics/month |
| T3 | TBD | Fleet management |

---

## Part 2: Open-Source Marine Projects — Deep Dives

### 2.1 SignalK Server

| Metric | Value |
|--------|-------|
| Stars | 381 |
| Contributors | 62 |
| Last push | 2026-03-20 |
| Open issues | 251 |
| Version | v2.23.0 (2026-03-12) |
| Release cadence | Monthly |
| License | Apache-2.0 |
| Tech stack | TypeScript, Node.js, Express, Primus WebSocket, Bacon.js, LevelDB |

**What it is:** The universal marine data exchange standard and server. Ingests NMEA 0183/2000 data, normalises to a hierarchical JSON model, exposes via REST + WebSocket. The gravitational center of the open-source marine ecosystem — everything else connects to it.

#### Architecture

SignalK is a monorepo (npm workspaces) with 7 packages:

- `packages/server-api` — TypeScript interfaces for the plugin contract, data model types, server API surface
- `packages/streams` — Data input pipeline (NMEA 0183, NMEA 2000, GPSD, SeaTalk, CAN bus)
- `packages/server-admin-ui` — React admin interface (Vite-based)
- Core server (`src/`) — Express HTTP + Primus WebSocket

**Data flow:** The provider system uses a **piped streams pattern**. Each data source is a chain of `Duplex` stream elements. The provider config is declarative JSON — you specify pipe element types and the framework wires them:

```
Serial Port -> Liner (line splitter) -> NMEA0183-SignalK parser -> Server
```

**Reactive layer:** Uses Bacon.js 1.0 functional reactive streams internally. Every SignalK path gets its own `Bacon.Bus`. Plugins subscribe to paths via `app.streambundle.getBus('navigation.position')`.

**Delta chain:** Incoming data passes through a delta chain where registered handlers can intercept, modify, or drop deltas before they hit the data model. The `deltacache` maintains the full merged state.

#### Data Model

Hierarchical JSON tree rooted at contexts like `vessels.urn:mrn:signalk:uuid:...`.

- **Delta** — contains `context` and `updates[]`
- **Update** — has `timestamp`, `$source`, and `values: PathValue[]` or `meta: Meta[]`
- **PathValue** — `{path, value}` where paths use dot-notation: `navigation.position`, `environment.wind.speedApparent`, `electrical.batteries.1.voltage`

Sources tracked per-path enable multi-source priority resolution. Position is always `{latitude, longitude, altitude?}`.

#### Plugin System

Technically excellent. Plugins are npm packages with keyword `signalk-node-server-plugin`:

```typescript
module.exports = (app: ServerAPI): Plugin => ({
  id: 'my-plugin',
  name: 'My Plugin',
  start(config, restart) { /* ... */ },
  stop() { /* ... */ },
  schema: { /* JSON Schema for auto-generated config UI */ },
  registerWithRouter(router) { /* Express routes at /plugins/<id> */ }
})
```

**410+ server plugins** and 108 web apps on npm. Plugins can register as ResourceProvider, AutopilotProvider, WeatherProvider, RadarProvider, or HistoryProvider.

**WASM plugins** — newer extension point supporting AssemblyScript and Rust compiled to WASI P1. Plugins run sandboxed — architecturally significant.

**MCP server** — recently added for AI integration. Exposes the entire data model to LLMs. Validates Above Deck's "AI from day one" strategy.

#### Security

Well-architected pluggable security with strategy pattern:
- **TokenSecurity** — JWT-based with session cookies (`httpOnly: true`, `sameSite: 'strict'`, `secure: true`)
- **OIDC integration** — full OpenID Connect SSO with PKCE, state encryption, provider discovery
- **ACL enforcement** on paths

#### API Surface

- **REST:** `/signalk/v1/api/` and `/signalk/v2/api/` — sub-APIs for course, resources, autopilot, weather, radar, history, notifications (each with OpenAPI specs)
- **WebSocket:** Primus-based. Clients send subscription messages with path/period/policy, receive delta updates
- **Plugin routes:** Each plugin gets `/plugins/<id>/` namespace

#### Strengths
- De facto standard — everything connects to it
- 410+ plugins, 108 web apps
- Clean REST/WebSocket API accessible to web developers
- Security model is properly designed (JWT, OIDC, ACLs)
- MCP server for AI integration
- Runs on Pi, desktop, or server

#### Weaknesses
- 251 open issues — maintenance burden may outpace contributors
- Node.js dependency chain fragile on resource-constrained Pi
- Complex spec with steep learning curve for new developers
- No built-in UI beyond admin panel — depends on third-party apps
- Bacon.js 1.0 is an old reactive library (no longer maintained upstream)

#### Above Deck Relevance
Above Deck correctly positions its own data model as primary with a SignalK compatibility adapter. This avoids dependency while maintaining interoperability. The MCP server announcement validates the "AI from day one" strategy. Study the delta/subscription model for real-time data streaming patterns.

---

### 2.2 OpenCPN

| Metric | Value |
|--------|-------|
| Stars | 1,364 |
| Contributors | 96 |
| Last push | 2026-03-20 |
| Open issues | 301 |
| Version | v5.12.4 stable, v5.14 Beta2 |
| License | GPL-2.0 |
| Tech stack | C/C++, wxWidgets, CMake, OpenGL |

**What it is:** The gold standard open-source chartplotter. 15+ years of development. Supports every chart format (BSB raster, S57/S63 vector, MBTiles, o-charts), AIS decoding, GPS input, waypoint/route management, and autopilot integration. Cross-platform desktop (Windows, macOS, Linux, Android).

#### Architecture

wxWidgets-based desktop application with a recent `gui/` / `model/` separation:

- `gui/` — UI layer (wxWidgets dialogs, canvas, AIS display)
- `model/` — Data model, business logic, plugin loader, NMEA handling, config
- `include/ocpn_plugin.h` — **7,380-line monolithic plugin header** defining a C++ inheritance chain of 14 versioned classes

#### Plugin API

```
opencpn_plugin -> opencpn_plugin_16 -> ... -> opencpn_plugin_119
```

Each version adds new virtual methods. Plugins override `Init()` which returns a **capability bitfield**:
- `WANTS_NMEA_SENTENCES` — raw NMEA 0183 feed
- `WANTS_AIS_SENTENCES` — decoded AIS data
- `WANTS_OVERLAY_CALLBACK` — custom rendering
- `INSTALLS_PLUGIN_CHART` — custom chart formats
- `WANTS_MOUSE_EVENTS`, `WANTS_KEYBOARD_EVENTS`

Plugins are compiled C++ shared libraries (`.so`/`.dll`). 40+ third-party plugins available via a managed catalog.

#### Why Modernization is Hard

1. **7,380-line monolithic header** — entire API surface in one file with deep wxWidgets coupling
2. **14 inheritance levels** — fragile API versioning via class hierarchy
3. **wxWidgets dependency** — plugin API exposes `wxBitmap`, `wxString`, `wxDialog`, `wxDC`, `wxGLCanvas` directly
4. **Build complexity** — CMake with platform-specific GL handling, Android NDK support, multiple packaging systems
5. **Chart rendering** — custom quilt system compositing multiple charts at different scales, both DC and OpenGL paths

#### Strengths
- Most mature open-source chartplotter (15+ years)
- Supports virtually every chart format
- Largest contributor base in the ecosystem (96)
- Cross-platform (Windows, Mac, Linux, Pi)
- Massive plugin ecosystem (radar, weather routing, pypilot, celestial nav)

#### Weaknesses
- Desktop-only — no mobile, no web. Looks like 2010
- C++ codebase intimidating for new contributors
- Touch/tablet usability is poor
- 301 open issues, some longstanding
- No cloud sync, no multi-device, no collaboration
- Flatpak distribution causes plugin compatibility friction

#### Above Deck Relevance
OpenCPN proves demand for open-source charting but also proves that C++ desktop apps cannot serve the modern sailor. Above Deck's MapLibre + web approach directly addresses this gap. Never compete on chart format breadth — focus on UX and mobile. Study the weather routing plugin for isochrone algorithm patterns.

---

### 2.3 Freeboard-SK

| Metric | Value |
|--------|-------|
| Stars | 54 |
| Contributors | 11 |
| Last push | 2026-03-14 |
| Open issues | 19 |
| License | Apache-2.0 |
| Tech stack | TypeScript, Angular, OpenLayers |

**What it is:** The most complete web-based chartplotter in the SignalK ecosystem. Displays charts, instruments, AIS targets, routes, and waypoints in a browser connected to a SignalK server.

#### Architecture

Standard Angular application with a **facade pattern**:
- `AppFacade` — singleton managing all state, SignalK connection, feature flags, UI config (uses Angular signals)
- Module-per-feature: `modules/map/`, `modules/alarms/`, `modules/autopilot/`, `modules/course/`, `modules/gpx/`
- SignalK client via `signalk-client-angular` npm package

**Map rendering:** OpenLayers with extensive layering — raster charts, S57 vector, WMS/WMTS, MapStyleJSON, PMTiles, TileJSON. AIS vessels rendered as styled OL features with popover components. Rich interaction modes (measure, draw, modify, DragBox selection).

**SignalK consumption:** `SKStreamFacade` wraps WebSocket subscriptions. `SKResourceService` handles REST calls. Feature flags query server capabilities.

#### Performance Concern

AIS targets held in a JavaScript `Map<string, SKVessel>`, each becoming an OL Feature. No spatial indexing or LOD culling — performance degrades in busy waterways with hundreds of targets.

#### Strengths
- Responsive — works on tablets and phones
- Active development
- AIS overlay, instrument panels, route planning in one app
- Multiple chart source support

#### Weaknesses
- 11 contributors — small team
- Limited chart format support vs OpenCPN
- No offline charts beyond cached tiles
- Basic instrument dashboard
- Performance issues with many AIS targets
- Angular framework choice limits ecosystem (React/Vue are more widely contributed to)

#### Above Deck Relevance
Freeboard validates web-based charting works but its Angular + OpenLayers stack and tiny team limit it. Above Deck's React + MapLibre stack with a larger design vision can surpass it. Study its SignalK subscription patterns and AIS rendering approach.

---

### 2.4 AvNav

| Metric | Value |
|--------|-------|
| Stars | 102 |
| Contributors | 10 |
| Last push | 2026-03-20 |
| Open issues | 83 |
| License | MIT |
| Tech stack | Python backend, JavaScript frontend, Java (Android) |

**What it is:** Navigation server + web chartplotter for Raspberry Pi and Android. NMEA multiplexer, chart tile server, and browser-based navigation display. Originally German-focused.

#### Architecture

Python backend with a **worker pattern**:
- `avnav_server.py` — main entry point, config parsing, worker orchestration
- `avnav_worker.py` — base class for threaded workers with typed parameter system (`WorkerParameter`: STRING, NUMBER, FLOAT, BOOLEAN, SELECT, FILTER)
- `avnav_store.py` — central in-memory data store with thread-safe access
- Workers in `server/handler/`: serial NMEA reader (auto-bauding: 921600 down to 4800), route/waypoint management, chart tile serving, NMEA multiplexer, Bluetooth handler, direct I2C sensor handlers

**Data store:** Flat key-value model (`gps.lat`, `gps.lon`, `ais.entities.*`) — simpler than SignalK's hierarchical model. Priority-based source resolution, timestamp-based expiry.

**Chart handling:** Supports GEMF, MBTiles, directory-based tile hierarchies, and a conversion pipeline for BSB/KAP, NV charts, Navipack, OZF.

**Plugin system:** Plugins implement `AVNApi` — log/error, key read/write, custom HTTP handlers, chart converter registration, NMEA sentence injection. Plugins can be JavaScript widgets (user-apps), Python handlers, or chart converters. Config via XML.

#### Strengths
- Excellent web chartplotter UI — arguably better than Freeboard for navigation
- Android app (rare in this space)
- Multi-device display support out of the box
- MIT license (most permissive)
- Active development

#### Weaknesses
- German-centric docs/community
- 10 contributors
- No formal release management since 2017 (distributes via Debian packages)
- No S57 vector chart support
- Small international community

#### Above Deck Relevance
AvNav is the closest existing web-based navigation tool served from local hardware. Study its multi-device display approach and NMEA multiplexer design. Its lack of S57 support and small community are weaknesses Above Deck can exploit.

---

### 2.5 Victron Venus OS

| Metric | Value |
|--------|-------|
| Stars | 733 |
| Contributors | 8 |
| Last push | 2026-03-16 |
| Version | v3.70 (2026-02-25) |
| License | Mixed (open + proprietary) |
| Tech stack | Yocto/OpenEmbedded, Python, QML (Qt6), C, D-Bus |

**What it is:** The OS running on Victron Energy's GX product range (Cerbo GX, Ekrano GX). Monitors and controls batteries, solar chargers, inverters, generators, and tank sensors. The "Large" variant bundles SignalK and Node-RED.

#### Architecture

Custom Linux distribution built with BitBake/Yocto. Runtime centers on **D-Bus** as the system message bus.

**D-Bus model:** Every device driver registers as a service under `com.victronenergy.*`:
- `com.victronenergy.battery.ttyUSB0`
- `com.victronenergy.solarcharger.ttyUSB1`

Each service publishes a tree of D-Bus object paths (`/Dc/0/Voltage`, `/Dc/0/Current`, `/Soc`). Values accessed via `com.victronenergy.BusItem` interface.

**Driver model:** New devices added by creating a D-Bus service that connects to hardware, registers with appropriate service name, publishes values at standardized paths, and accepts write commands. Drivers are typically Python scripts using `velib_python`. Udev rules trigger driver startup on hardware connect.

**MQTT bridge:** `dbus-mqtt` translates between D-Bus and MQTT bidirectionally:
- Publishes: `N/<portal_id>/<service>/<path>`
- Accepts writes: `W/<portal_id>/<service>/<path>`
- TTL-based subscription expiry (60s)

**SignalK integration ("Large" image):** Venus OS Large adds Node.js, SignalK server, and Node-RED. A custom SignalK plugin bridges D-Bus services to SignalK paths. MQTT as alternative transport.

#### Strengths
- Most professionally developed project (backed by Victron Energy)
- 733 stars — highest in the ecosystem
- Rock-solid reliability (runs on production marine systems globally)
- Excellent D-Bus architecture — clean separation of concerns
- MQTT + Modbus TCP integration — best-in-class for third parties
- VRM cloud monitoring is **free** (no subscription)
- Regular release cadence
- Node-RED built in for user automation

#### Weaknesses
- Designed for Victron hardware — not general-purpose
- Yocto build system is extremely complex to modify
- 181 open issues; only 8 contributors (most development internal to Victron)
- D-Bus dependency makes it Linux-only
- Not a navigation tool — purely power/energy management

#### Above Deck Relevance
Victron integration (VE.Direct, MQTT, Modbus TCP) should be a priority. Many target sailors already have Victron systems. The D-Bus + MQTT architecture is worth studying for Above Deck's protocol adapter design. Victron proves open-source doesn't destroy commercial viability.

---

### 2.6 PyPilot

| Metric | Value |
|--------|-------|
| Stars | 267 |
| Contributors | 14 |
| Last push | 2026-03-11 |
| Open issues | 61 |
| License | Unspecified (treated as GPL) |
| Tech stack | Python, C (IMU/motor control) |

**What it is:** Fully open-source autopilot for sailboats. Pi + IMU + motor driver. Compass, GPS, wind, and route-following modes. The only viable open-source sailboat autopilot.

#### Architecture

The `Autopilot` class is the central controller:
1. Creates `pypilotServer` (TCP/UDP value server), `BoatIMU`, `Sensors`, `Servo`
2. Runs as **real-time process** (`sudo chrt -pf 1` for FIFO scheduling)
3. Child processes: IMU reader, auto-calibration, NMEA, GPSD, GPS filter, SignalK bridge, server
4. **Modes:** compass, gps, nav, wind, true wind — each resolves heading differently

**Pilot algorithms** (`pilots/`): basic (PID-style), absolute, rate, simple, wind, vmg, gps, plus experimental: learning, autotune, fuzzy, intellect.

**IMU sensor fusion:** `BoatIMU` wraps RTIMU library. Auto-detects hardware (MPU9250 typically). 100Hz sample rate. SLERP fusion with power=0.01 for stability.

**Servo control:** Communicates with Arduino-based motor controllers via serial. 20+ fault flags (OVERTEMP, OVERCURRENT, PORT/STARBOARD PIN faults, BAD_VOLTAGE, MIN/MAX_RUDDER). Hardware watchdog.

**Safety mechanisms:**
- Hardware watchdog (`/dev/watchdog0`)
- Signal handler terminates all child processes on any signal
- Servo fault bitfield triggers disengage
- Mode fallback: if GPS unavailable in gps mode, falls back to compass
- Real-time FIFO scheduling prevents control loop starvation

**SignalK integration:** Bidirectional via lookup table mapping SignalK paths to pypilot values. Zeroconf auto-discovery. WebSocket subscription. Token auth.

#### Strengths
- Only viable open-source sailboat autopilot — no competitor
- Commercially available as assembled hardware
- Full control over algorithms
- Active development, community via OpenMarine forum

#### Weaknesses
- Hardware assembly non-trivial
- Sparse documentation
- Single maintainer (Sean D'Epagnier)
- No formal safety certification
- Only one formal release (v0.9)

#### Above Deck Relevance
Integrate with pypilot (read status, display heading/mode) rather than compete. The autopilot domain requires hardware expertise outside Above Deck's scope. Study the mode fallback pattern for graceful degradation.

---

### 2.7 Bareboat Necessities (BBN OS)

| Metric | Value |
|--------|-------|
| Stars | 311 |
| Last push | 2026-02-04 |
| License | GPL-3.0 |
| Tech stack | Shell scripts, chroot-based image builder |

**What it is:** A "batteries-included" Pi marine OS image bundling SignalK, OpenCPN, AvNav, PyPilot, Grafana, InfluxDB, Mosquitto, Home Assistant, and more. More comprehensive than OpenPlotter.

#### Build Process

Chroot-based image customization pipeline:
1. Download official Raspberry Pi OS Lite image
2. Mount, expand, bind-mount dev/sys/proc
3. Chroot and run numbered install scripts (`install-scripts/0-repositories/`, `2-baseSystem/`, `4-server/`)
4. Shrink with PiShrink, output final `.img`

**What it adds beyond OpenPlotter:** RTL-AIS (software AIS via RTL-SDR), MotionEye (cameras), Mopidy (music), satellite modem, CUPS (printing), Samba, Raspotify, smart home, offline Wikipedia (Kiwix), tide predictions, ADS-B aircraft tracking.

BBN is an entertainment + communication + navigation distribution. OpenPlotter focuses more narrowly on marine instrumentation.

#### Above Deck Relevance
BBN validates the "unified experience" need but proves that gluing existing tools produces a Frankenstein UI with no consistent design language. Above Deck's single-codebase approach is the right response.

---

### 2.8 OpenPlotter

| Metric | Value |
|--------|-------|
| Stars | 90 (settings repo) |
| Maintainer | Sailoog (single developer) |
| Last push | 2025-03-08 (settings), 2026-01-22 (dashboards) |
| License | GPL-3.0 |
| Tech stack | Python, Raspberry Pi OS |

**What it is:** A Linux distribution bundling OpenCPN, SignalK, pypilot, Node-RED, Grafana, and InfluxDB into a pre-configured Pi system. The original "glue layer" for the marine open-source ecosystem.

#### Strengths
- Lowest barrier to entry for a full marine computer on Pi
- Curated integration — components pre-configured to work together
- Active docs at openplotter.readthedocs.io

#### Weaknesses
- Creates nothing new — just configures existing tools
- Development pace slowing (core settings repo last pushed March 2025)
- Single maintainer (bus factor = 1)
- UI is functional but unpolished
- No mobile companion

#### Above Deck Relevance
OpenPlotter proves sailors want a unified system. It also proves that configuration-layer projects cannot deliver a cohesive UX. Above Deck should learn from what OpenPlotter bundles (the feature set sailors need) but build it as a single product.

---

### 2.9 SensESP

| Metric | Value |
|--------|-------|
| Stars | 190 |
| License | Apache-2.0 |
| Tech stack | C++, ESP32, PlatformIO |

**What it is:** Universal SignalK sensor framework for ESP32. Build custom marine sensors that feed data to SignalK. The hardware innovation layer of the ecosystem.

#### Architecture

**Reactive dataflow graph** on ESP32 using ReactESP event loop:

- **`ValueProducer<T>`** — emits typed values
- **`Transform<IN, OUT>`** — consumes one type, produces another
- **`Sensor<T>`** — represents a physical sensor

Transforms connected via `->` operator:

```cpp
auto* sensor = new AnalogInput();
sensor->connect_to(new Linear(0.0, 1.0, ""))
      ->connect_to(new SKOutputFloat("electrical.batteries.house.voltage"));
```

**Rich transform library:** linear, voltage math, moving average, median, change filter, hysteresis, throttle, debounce, air density, dew point, heat index, lambda transforms.

**SignalK connection:** WebSocket client with mDNS auto-discovery, JWT token auth, SSL/TLS with TOFU certificate pinning, delta queue batching.

**Web configuration:** Built-in HTTP server with JSON Schema-driven config UI. OTA update support.

#### Above Deck Relevance
SensESP represents the DIY hardware ecosystem Above Deck should support via SignalK adapter and MQTT. The dataflow graph pattern is worth studying for Above Deck's own protocol adapter architecture. ESP32 + SensESP is the recommended path for DIY sensor integration.

---

### 2.10 Bridge Hardware (Commercial)

**iKommunicate (Digital Yacht):** ~$300. NMEA 0183/2000 -> SignalK gateway. Ethernet output. The "official" bridge between legacy instruments and SignalK. Won NMEA "Best New Product."

**Yacht Devices YDWG-02:** ~$200. NMEA 2000 WiFi gateway. Most popular gateway globally. Python 3 scripting. Compatible with all NMEA 2000 networks (Raymarine SeaTalkNG, Simrad SimNet, Furuno CAN, Garmin).

**Above Deck relevance:** These are the bridge hardware that makes open-source marine software practical. Document as recommended hardware. Don't try to replace them.

---

### 2.11 Marine Logbook — The Biggest Gap

There is **no well-maintained, feature-complete, open-source marine logbook**. The best option is `signalk-logbook` with 16 GitHub stars. No modern UX, no multi-device sync, no offline support, no maintenance tracking, no crew management.

This gap is confirmed across every source reviewed. Above Deck's logbook feature directly addresses this.

---

## Part 3: Commercial Marine Platforms — Full Competitive Analysis

### 3.1 Garmin Marine

**Market position:** Dominant. Estimated 50%+ of consumer marine GPS/chartplotter market in North America. Largest marine electronics company by consumer install base.

**Target:** All segments — powerboat, fishing, sailing, some commercial.

#### Product Lines

- **GPSMAP series** (7x2/9x2/12x2/16x2): Flagship MFDs, 7"-16" touchscreen, proprietary RTOS
- **ECHOMAP series** (Ultra/UHD2): Mid-range combo units (chartplotter + sonar), 5"-10", fishing-focused
- **Garmin Navionics+ charts**: Annual subscriptions or perpetual with updates. Replaced legacy BlueChart after Navionics acquisition (2017)
- **LiveScope/Panoptix**: Forward-scanning live sonar — created an entirely new fishing category. Nothing else compares in freshwater fishing

#### Software Ecosystem

- **OneHelm**: Integration platform letting third-party marine electronics (Fusion audio, Power-Pole, Mercury VesselView) be controlled from the Garmin MFD. B2B program, not open.
- **ActiveCaptain**: Community + app. ~500K+ contributors, 250K+ POIs. Syncs waypoints/routes/community data between app and MFD via WiFi.
- **SailAssist**: Sailing features on compatible units — laylines, tacking/jibing. Basic compared to B&G.
- **Connect IQ SDK**: Developer SDK for Garmin wearables (quatix watch) only. No public SDK for MFDs.

#### Pricing

| Product | Price |
|---------|-------|
| GPSMAP 923xsv (9") | ~$2,500 |
| GPSMAP 1223xsv (12") | ~$3,500 |
| GPSMAP 1623 (16") | ~$5,000+ |
| ECHOMAP UHD2 7" combo | ~$800-1,200 |
| Garmin Navionics+ chart card | ~$150/yr |
| LiveScope Plus system | ~$2,500-3,000 |

#### Lock-in Mechanisms
- Proprietary chart format (.gmap) — can't use Garmin charts on other brands
- ActiveCaptain community data only accessible via Garmin products — no API
- LiveScope ecosystem is Garmin-exclusive
- OneHelm integrations incentivize Garmin-centric helms
- GPX export for routes/waypoints, but no community data export

#### User Frustrations
- ActiveCaptain WiFi sync unreliable — "I have to try 5 times to get it to connect"
- Chart subscription model frustrates longtime users who had perpetual licenses
- No HDMI output on many models
- Radar integration requires Garmin radar only
- Customer service inconsistent

#### Unique Differentiators
- **LiveScope/Panoptix** live forward-scanning sonar (dominates freshwater fishing)
- **ActiveCaptain community scale** (largest crowdsourced marina/anchorage database)
- **Navionics acquisition** (arguably best chart data globally)
- **Vertical integration** — makes charts, MFDs, sonar, radar, autopilot, VHF, AIS, trolling motors

---

### 3.2 Raymarine (Teledyne)

**Market position:** Estimated 15-20% consumer marine. Strong in European sailing. Owned by Teledyne (via FLIR acquisition).

**Target:** Recreational powerboat, sailing, sportfishing.

#### Product Lines

- **Axiom 2 Pro series**: Flagship MFDs, 9"-16", run **LightHouse 4 OS** (Linux-based). Widely regarded as the best MFD UI in the industry.
- **Element series**: Lower-cost, different OS (Element OS). Fishing-focused.
- **ClearCruise AR**: Augmented reality overlay on camera feed — identifies AIS targets, nav aids, hazards in live video. Genuinely innovative.
- **DockSense**: Assisted docking (Brunswick partnership). Camera/sensor array for object detection during docking. OEM only.

#### Software & Integration

- **LightHouse 4**: Linux-based. Smooth animations, logical menus. Best UI/UX in marine MFDs.
- **Raymarine+ app**: Mobile companion. Mediocre reviews (~3 stars). Connectivity issues.
- **RealVision 3D**: Sonar creating 3D underwater views. Impressive visually but questioned vs LiveScope for fishing.
- **FLIR thermal camera**: Native integration (same parent company). Genuine advantage for night navigation.
- **Orca integration**: Orca can receive AIS/instrument data from Raymarine via WiFi NMEA streaming.

#### Pricing

| Product | Price |
|---------|-------|
| Axiom 2 Pro 9" | ~$2,500-3,000 |
| Axiom 2 Pro 12" | ~$3,500-4,000 |
| Axiom 2 Pro 16" | ~$5,500+ |
| ClearCruise AR camera | ~$500-800 |

#### User Frustrations
- App connectivity unreliable
- Software updates occasionally break features
- Customer support declined post-FLIR acquisition
- Chart licensing/activation confusing

#### Unique Differentiators
- **ClearCruise AR** (augmented reality navigation)
- **FLIR thermal camera** native integration
- **DockSense** assisted docking
- **LightHouse OS quality** — consistently praised as best MFD UI

---

### 3.3 Navico — Simrad / B&G / Lowrance (Brunswick)

**Market position:** Estimated 25-30% combined. Three brands serving different segments. Acquired by Brunswick 2021.

#### Brand Split

| Brand | Target | Key Product |
|-------|--------|-------------|
| **Simrad** | Sportfishing, cruising, commercial | NSX, NSO evo3S |
| **B&G** | Sailing-specific (the only major brand dedicated to sailing) | Zeus, Vulcan, H5000 |
| **Lowrance** | Freshwater/bass fishing (more affordable) | HDS, ActiveTarget |
| **C-MAP** | Chart data (used across all brands and licensable to third parties) | Discover, Reveal, Genesis |

#### B&G — Sailing Features (Deep Dive)

**This is where B&G is commercially unmatched. No open-source equivalent exists.**

- **SailSteer**: Comprehensive tactical display — laylines, wind data, heading, current set/drift, polar performance, all in one screen
- **Laylines**: Real-time calculation factoring current, tide, leeway
- **Wind strategies**: TWA/TWS/AWS, optimal VMG targets, wind shift detection
- **Sailing autoroute**: Route planning accounting for sailing angles (no other brand)
- **WTP (Wind Target Performance)**: Target boat speed for current conditions based on polars
- **Race features**: Start line bias, time-to-line, race timer + GPS
- **H5000 system**: Professional racing instruments ($5,000-15,000+). Hercules software for polar development. Used by professional racing teams.

#### C-MAP

- **More open licensing than Navionics** — third-party developers can license C-MAP
- **Genesis**: Crowd-sourced custom mapping (users upload sonar data)
- **Embark app**: Mobile chart/planning. Mediocre reviews (~3-3.5 stars)
- Chart tiers: Discover (basic), Reveal (premium with high-res bathymetry, satellite, 3D)

#### Cross-Platform

All brands run Linux-based variants of Navico's OS. Common sonar/radar signal processing. GoFree WiFi ecosystem for data sharing.

#### Pricing

| Product | Price |
|---------|-------|
| B&G Zeus S 9" | ~$2,000-2,500 |
| B&G Vulcan 9" | ~$1,200-1,500 |
| B&G H5000 system | ~$5,000-15,000+ |
| Simrad NSX 9" | ~$1,500-2,000 |
| Lowrance HDS PRO 9" | ~$1,200-1,600 |
| Lowrance ActiveTarget 2 | ~$2,000-2,500 |
| C-MAP Reveal chart card | ~$200-350/region |

#### User Frustrations
- Software updates across brands can be buggy — #1 complaint
- GoFree connectivity unreliable
- Brand confusion (three brands, overlapping products)
- ActiveTarget always compared unfavorably to LiveScope

#### Unique Differentiators
- **B&G SailSteer and sailing features** — nothing else comes close for dedicated sailors
- **Simrad ForwardScan** — forward-looking collision avoidance sonar
- **Halo radar** — excellent pulse compression technology
- **C-MAP licensing available to third parties** — more open chart ecosystem
- **B&G H5000** — professional-grade racing instruments

#### Above Deck Relevance
B&G's sailing features set the commercial benchmark. An open-source SailSteer equivalent (polars, laylines, VMG, wind strategy) would attract tech-savvy sailors. The math is well-understood; the UX execution is what matters. This is a potential differentiator for Above Deck.

---

### 3.4 Furuno

**Market position:** Dominant in commercial shipping worldwide. Estimated 5-10% recreational (strong in Europe, Japan). Japanese company.

**Target:** Commercial marine (primary), premium recreational (secondary).

#### Product Lines

- **NavNet TZtouch3**: Recreational/premium MFD, 9"-16", runs TimeZero software
- **TZ Professional**: PC-based navigation (professional grade). Commercial shipping, superyachts.
- **DRS Radar series**: NXT solid-state and open-array magnetron. **Furuno radar is the gold standard in the industry.**
- **SC satellite compasses**: GPS heading sensors. Industry standard.
- **FAR commercial radar**: ARPA-capable for SOLAS vessels

#### Pricing

| Product | Price |
|---------|-------|
| NavNet TZtouch3 12" | ~$3,500-4,500 |
| NavNet TZtouch3 16" | ~$5,500-7,000 |
| TZ Professional (PC) | ~$1,500-3,000+ |
| DRS NXT solid-state radar | ~$2,000-3,000 |
| SC-33 satellite compass | ~$2,500-3,000 |

#### Strengths
- **Best radar in the industry** — commercial shipping runs on Furuno radar
- Extreme reliability (designed for 24/7 commercial operation)
- Multi-chart support on TZtouch3
- Commercial certifications (SOLAS, class approvals)

#### Weaknesses
- UI feels dated vs Raymarine/Garmin
- Small recreational market share in North America
- No live/forward-scanning sonar
- Limited smartphone integration
- Premium pricing without consumer-friendly marketing

#### Above Deck Relevance
Furuno's commercial dominance is outside Above Deck's market. But TZtouch3's multi-chart support and TimeZero's routing algorithms are worth studying. Furuno's NMEA 2000 compliance is excellent — their devices are among the most standards-compliant data sources.

---

### 3.5 Navionics (Garmin subsidiary)

**Market position:** The most popular marine navigation app worldwide. 5M+ Google Play downloads. Acquired by Garmin 2017.

#### Key Features

- **SonarChart**: Crowd-sourced bathymetric maps. Users with compatible sonar contribute depth data automatically. One of the most impressive crowd-sourced projects in marine.
- **Community Edits**: Users submit corrections/additions (hazards, marina info, depth corrections). Moderated and integrated into daily chart updates.
- **Dock-to-Dock Autorouting**: Route calculation accounting for depth, hazards, nav aids, vessel constraints. Very popular.
- **Daily chart updates**: Updated daily based on SonarChart + Community Edits (with subscription)

#### How Community Editing Works
1. Users navigate to a location in-app
2. Submit edit (mark hazard, correct depth, add dock, report change)
3. Edits uploaded to Navionics servers
4. Staff/algorithms moderate
5. Approved edits integrated into next chart update
6. Others see edits as toggleable layer
7. SonarChart contributions are automatic — sonar logs uploaded in background

#### Pricing
- Free tier: basic charts, limited features
- Subscription: ~$15-25/yr (includes SonarChart, Community Edits, daily updates, autorouting)
- Chart cards for MFDs: ~$100-200/region

#### Above Deck Relevance
Navionics' community editing model is the gold standard for crowdsourced marine data. Above Deck should study this but not attempt to compete on chart data scale. Instead, focus on community knowledge (anchorages, local conditions, hazards) that Navionics doesn't cover well. Use official government ENC charts (free/cheap) rather than competing with Navionics' chart data.

---

### 3.6 Vesper Marine / Cortex

**Market position:** Small but genuinely innovative. New Zealand company.

**What it is:** The Cortex M1 is an all-in-one hub combining VHF radio, AIS transponder, vessel monitoring (bilge, battery, shore power, GPS), WiFi/LTE connectivity, and anchor watch — in one box. One of the most innovative products in marine electronics in recent years.

#### Key Innovation
Replaces 4-5 separate devices with one box. The app lets you monitor your boat remotely via cellular — get alerts if bilge pump activates, battery drops, boat drags anchor, shore power disconnects. You can operate VHF radio from your phone (WiFi range).

#### Pricing
| Product | Price |
|---------|-------|
| Cortex M1 hub | ~$2,000-2,500 |
| Cortex Handset H1 | ~$500 |
| Monitoring sensors | ~$100-200 each |
| Cellular monitoring subscription | ~$100-200/yr |

#### Strengths
- Genuinely innovative product — solves real monitoring + consolidation problems
- Modern app-first approach
- Remote monitoring via cellular is a killer feature
- NMEA 2000 gateway built in
- Strong safety/monitoring focus

#### Weaknesses
- Small company — support/longevity risk
- Subscription required for remote monitoring
- Cloud dependency for remote features
- No chartplotting — complementary to MFDs
- Early firmware was buggy

#### Above Deck Relevance
Cortex proves strong demand for remote monitoring and device consolidation. An open-source version (vessel monitoring + alerts + NMEA gateway) on Pi with LTE hat would be compelling — and Above Deck's Docker platform layer is the right foundation for this. The monitoring/alerting use case is probably the easiest high-value feature to build on the platform.

---

### 3.7 Victron Energy

**Market position:** Dominant in marine power management. Dutch company. The model for how to be commercially successful while being open-source.

#### Products
- **Battery monitors:** SmartShunt (~$75-100)
- **Solar charge controllers:** SmartSolar MPPT (~$200+)
- **Inverter/chargers:** MultiPlus (~$1,200-1,500)
- **GX devices:** Cerbo GX (~$300-350), GX Touch displays, Ekrano GX
- **VRM Portal:** Cloud monitoring — **free, no subscription**
- **VictronConnect app:** Bluetooth config/monitoring — excellent (4.5+ stars)
- **Venus OS:** Open-source (GPL) on GitHub

#### Integration — Best in Marine Electronics

| Protocol | Purpose |
|----------|---------|
| MQTT | Full system data. Topics documented. Primary integration path |
| Modbus TCP | Full register map published. Commercial integrators use this |
| D-Bus | For applications running locally on GX device |
| VRM API | REST API for cloud data. Documented |
| NMEA 2000 | GX devices as gateway — battery/solar data onto boat's NMEA network |
| VE.Direct | Proprietary serial for BMVs, MPPTs, inverters |
| VE.Bus | Proprietary serial for inverter/chargers |
| Node-RED | Official nodes for Venus OS automation |

#### Lock-in Assessment
**Least locked-in major marine electronics ecosystem.** MQTT, Modbus, open-source OS, documented APIs. Victron actively encourages integration. Hardware premium (20-50% above Chinese alternatives) is the business model, not software lock-in.

#### User Frustrations
- Price — #1 complaint. "Why is a SmartShunt $100 when Chinese equivalents are $30?"
- VE.Bus protocol complexity for DIY installers
- GX Touch displays small and low-res for the price

#### Above Deck Relevance
**Priority integration target.** Many cruising sailors already have Victron. MQTT is the integration path — Above Deck's Go API server should have a Victron MQTT adapter from early in the platform layer. Display battery, solar, inverter data on the dashboard. Victron proves open-source doesn't destroy commercial viability — it builds loyalty.

---

## Part 4: Full Competitive Analysis

### 4.1 Market Landscape

#### Market Size
- **Global marine electronics:** ~$6.2-6.5B (2024)
- **Recreational boating software:** ~$800M-1.2B (2024)
- **Mobile marine app revenue:** ~$150-250M/yr
- **Marine app growth:** ~10-15% annually (outpacing hardware)
- **Registered recreational boats globally:** ~25-30M (ICOMIA)

#### Market Share — Hardware

| Brand | Share (est.) | Segment |
|-------|-------------|---------|
| Garmin | 50%+ (consumer NA) | All segments |
| Navico (Simrad/B&G/Lowrance) | 25-30% | All segments |
| Raymarine | 15-20% | Power/sailing |
| Furuno | 5-10% recreational, dominant commercial | Commercial/premium |

#### Market Share — Apps

| App | Active Users (est.) | Revenue Model |
|-----|-------------------|---------------|
| Navionics | 2-3M | $15-25/yr subscription |
| ActiveCaptain | 500-800K | Free (Garmin hardware required) |
| Aqua Map | 200-400K | $15-50/yr |
| Savvy Navvy | 200-350K | $50-85/yr |
| PredictWind | 150-250K | $25-250/yr |
| Orca | 50-100K | $70-100/yr |
| OpenCPN | 50-100K | Free (open source) |

#### Pricing Comparison — Navigation Apps

| App | Free | Basic Paid | Premium | Charts |
|-----|------|-----------|---------|--------|
| Navionics | Limited | $15/yr | $25/yr | Included |
| Savvy Navvy | 7-day trial | $50/yr | $85/yr (offshore) | Included |
| Orca | Basic charts | $70/yr (Pro) | $100/yr (Pro+) | Included |
| PredictWind | Basic weather | $25/yr | $250/yr (Pro+) | Separate |
| Aqua Map | Basic | $15/yr | $35/yr | Regional packs extra |
| OpenCPN | Full | — | — | Free NOAA; o-charts ~$20-50/region |
| **Above Deck** | **Full (open source)** | — | — | **Free NOAA/OpenSeaMap** |

### 4.2 Competitive Positioning Matrix

| Capability | Garmin | Raymarine | B&G | Savvy Navvy | Orca | OpenCPN | SignalK | d3kOS | **Above Deck** |
|-----------|--------|-----------|-----|-------------|------|---------|--------|-------|--------------|
| Charting | A | A | A | B+ | A | A | — | C (AvNav) | **B+ (building)** |
| Mobile | B | C | C | A | A | F | — | F | **A (planned)** |
| Offline | A | A | A | B | B+ | A | A | A | **A** |
| AI/Smart routing | C | C | C | A | A | C | C | B+ | **A (planned)** |
| Sailing features | C | B | A+ | B | B | B | — | — | **B+ (planned)** |
| Engine/power monitoring | A | A | A | — | — | — | B+ | A | **A (planned)** |
| Camera integration | — | B | — | — | — | — | — | A | **B (planned)** |
| Community | A (ActiveCaptain) | — | — | — | — | — | — | — | **B (building)** |
| Logbook | C | C | C | — | — | — | D | C | **A (planned)** |
| Voice control | — | — | — | — | — | — | — | B+ | **B (planned)** |
| Open source | F | F | F | F | F | A | A | — | **A** |
| Modern UX | B | A | B+ | A | A+ | D | C | C+ | **A (target)** |
| Price | $$$$ | $$$$ | $$$$ | $$ | $$ | Free | Free | Free-$ | **Free** |

### 4.3 User Frustrations (Cross-Platform)

Aggregated from app store reviews, Cruisers Forum, Reddit r/sailing, and marine community forums:

| Rank | Frustration | Who It Affects | Above Deck Opportunity |
|------|------------|----------------|----------------------|
| 1 | **Subscription fatigue** — paying for 2-3 apps + chart subscriptions | Everyone | Integrated free platform |
| 2 | **No offline charts that actually work** | Cruisers, offshore | Docker + local chart storage |
| 3 | **App connectivity problems** — every brand has WiFi sync issues | MFD owners | SignalK/MQTT reliability |
| 4 | **No good logbook** | All sailors | Build it — biggest gap |
| 5 | **Closed ecosystems** — can't export/share data | MFD owners | Open data model, GPX/SignalK |
| 6 | **Fragmented experience** — 3-5 apps for one workflow | Everyone | Unified platform |
| 7 | **No sailing-specific features in apps** — only B&G does sailing well | Sailors | SailSteer equivalent |
| 8 | **Poor mobile experience** from hardware makers | Tablet users | Mobile-first design |
| 9 | **No remote boat monitoring** without expensive hardware | Boat owners | Pi platform with LTE |
| 10 | **Dated UX in open-source tools** | Tech-savvy sailors | Blueprint aesthetic, MFD frame |

### 4.4 Technology Trends

| Trend | Impact | Above Deck Position |
|-------|--------|-------------------|
| **Starlink adoption** (20-50K recreational boats by end 2024, growing 3-5x/yr) | Transforms offline assumption. Periodic broadband now possible offshore | Cloud sync, community data, AI queries become viable at sea |
| **Tablet-as-chartplotter** (30-40% of active boaters) | Tablets are the growth vector; MFD market is mature | Web-first, responsive design, PWA |
| **AI routing** (Savvy Navvy, Orca, PredictWind competing) | Table stakes for new entrants | MCP server, AI-native data model |
| **AIS-B adoption** (8-12% recreational, growing 15%/yr) | More AIS targets to display, more data for routing | AIS integration from day one |
| **ESP32 DIY sensors** (NMEA 2000 library, SensESP) | Growing maker community wants to connect custom sensors | SignalK adapter supports this automatically |
| **WiFi standard on new boats** (Beneteau, Jeanneau, HanseYachts) | NMEA data increasingly available via WiFi | NMEA WiFi adapter in protocol layer |

### 4.5 Open-Source Ecosystem Health

| Project | Stars | Bus Factor | Activity | Risk |
|---------|-------|-----------|----------|------|
| Victron Venus OS | 733 | Company | Active (monthly) | Low — corporate backing |
| SignalK Server | 381 | 3-4 core | Active (weekly) | Medium — volunteer-driven but healthy |
| OpenCPN | 1,364 | 5-6 core | Active (weekly) | Medium — aging codebase, modernization difficult |
| BBN OS | 311 | 1-2 | Moderate (monthly) | High — depends on upstream projects |
| PyPilot | 267 | 1 | Active (weekly) | High — single maintainer |
| SensESP | 190 | 2-3 | Active | Medium |
| AvNav | 102 | 1 | Active (daily) | High — single maintainer |
| OpenPlotter | 90 | 1 | Slowing | High — single maintainer |
| Freeboard-SK | 54 | 1-2 | Active | High — small team |
| KBox | 51 | 0 | Abandoned | Dead |

### 4.6 Distribution Channels

| Channel | Effectiveness | Notes |
|---------|--------------|-------|
| Word of mouth / dock talk | Very High | Sailors trust peer recommendations above all |
| YouTube (SV Delos, La Vagabonde) | High | Huge influence on gear/app choices |
| App Store organic search | High | "boat navigation" and "marine GPS" are key terms |
| Boat shows (Annapolis, METS, Southampton) | Medium-High | Key for visibility and partnerships |
| Sailing media (Practical Sailor, Yachting Monthly) | Medium | Reviews carry weight |
| Facebook sailing groups | Medium | Surprisingly active for recommendations |
| Sailing schools (RYA, ASA) | Medium | Captive audience of new sailors |
| Reddit (r/sailing 250K+, r/boating 150K+) | Medium | Growing influence |
| Marine dealers/installers | Low-Medium | More relevant for hardware |

### 4.7 Data Formats That Matter

| Format | What | Status |
|--------|------|--------|
| NMEA 2000 (IEC 61162-3) | Boat data bus | Open standard (PGN database paywalled by NMEA org) |
| NMEA 0183 | Legacy serial data | Open, well-documented |
| SignalK | Open boat data format | Open source, JSON, community-driven |
| S-57/S-63 | Official chart format | IHO standard, used by hydrographic offices |
| GPX | Waypoints/routes | Open XML standard |
| GRIB/GRIB2 | Weather data | WMO standard, open |
| Garmin .gmap | Garmin charts | Proprietary, closed |
| C-MAP formats | C-MAP charts | Proprietary (licensable) |

---

## Part 5: What Above Deck Should Build

### 5.1 Strategic Principles

1. **Own the data model.** d3kOS depends on SignalK. OpenPlotter depends on SignalK. Above Deck's own schema with a SignalK adapter is the right call — full control over data structure, AI queries, and evolution.

2. **Docker, not images.** d3kOS's SD card image is great for non-technical users but terrible for updates. Docker runs on Pi, NUC, laptop, NAS — and updates with `docker pull`.

3. **Mobile from day one.** Every competitor's biggest gap. PWA with service worker for offline.

4. **One cohesive UI.** OpenPlotter = Frankenstein. d3kOS = vanilla JS with global state. Above Deck's blueprint aesthetic with Astro + React + Tailwind CSS + Ant Design 5 is the right approach.

5. **TDD discipline.** d3kOS has zero frontend tests and no CI/CD. Above Deck's Vitest + Playwright is a massive quality advantage.

6. **Security from the start.** d3kOS has no auth, no input validation, no rate limiting. Above Deck has Supabase Auth from day one.

7. **Compete on sailing features.** B&G owns this commercially. No open-source equivalent. Polars, laylines, VMG, wind strategy — the math is well-understood. The UX execution is what matters.

8. **Build the logbook first** (after chartplotter). Confirmed biggest gap across all sources.

### 5.2 Patterns to Replicate (Ideas Only, Not Code)

#### 1. Camera Slot/Hardware Separation (from d3kOS)
Decouple logical positions from physical hardware. Positions are permanent, hardware is swappable. Implement in Go with PostgreSQL, not JSON files.

#### 2. Anchor Watch Safety-First Design (from d3kOS)
Safety-critical alerts bypass AI. Pre-recorded audio fires on detection. 3-poll debounce prevents false alarms. Alert escalation with ACK requirement. No AI in the critical path.

#### 3. Signal K Data Caching with TTL (from d3kOS)
Cache instrument data with short TTL (1-5 seconds). Configurable per data type. Navigation: 1s. Energy: 5s. Environmental: 30s.

#### 4. AI Proactive Monitoring via SSE (from d3kOS)
Background analysers on intervals. Route analysis, port briefing (2nm trigger), fuel prediction, weather change alerts. Results pushed via SSE to dashboard.

#### 5. Reactive Dataflow Graph (from SensESP)
Producer -> Transform -> Consumer pattern for protocol adapters. Typed, composable, testable.

#### 6. D-Bus-Style Service Architecture (from Victron Venus OS)
Each protocol adapter as an independent service publishing to a shared bus. Victron uses D-Bus; Above Deck should use MQTT or internal Go channels.

#### 7. Plugin Registration Pattern (from SignalK)
Plugin contract with `start(config)`, `stop()`, JSON Schema for auto-generated config UI. Clear lifecycle, typed interfaces.

#### 8. Pilot Mode Fallback (from PyPilot)
Graceful degradation: if preferred data source unavailable, fall back to next best. GPS -> compass, wind -> compass. Apply to Above Deck's instrument displays.

#### 9. SailSteer Equivalent (from B&G — commercial, implement independently)
Integrated tactical display: laylines (with current/tide/leeway), wind data (TWA/TWS/AWS), polar performance (target vs actual VMG), heading, COG/SOG. The math is published in sailing performance literature. UX is the differentiator.

#### 10. Community Editing Model (from Navionics — study, don't replicate at scale)
User-submitted corrections moderated and integrated. For Above Deck: focus on anchorage reviews, local knowledge, hazard reports — not chart data corrections (use official ENCs).

### 5.3 Features NOT to Replicate

| Feature | Why Not |
|---------|---------|
| Fish detection (d3kOS) | Powerboat/fishing-specific. Above Deck targets sailing |
| LiveScope/sonar (Garmin) | Requires custom hardware. Deep commercial moat |
| Radar signal processing (Furuno) | Decades of IP. Hardware-dependent |
| Chart data collection (Navionics) | Millions of contributors. Can't compete on scale |
| VHF radio integration (Cortex) | Regulatory barriers (radio certification) |
| Autopilot algorithms (PyPilot) | Hardware expertise outside scope. Integrate, don't compete |
| SOLAS commercial certification (Furuno) | Regulatory barrier. Not target market |
| Pre-built SD images (d3kOS, OpenPlotter) | Docker is the distribution model |

### 5.4 Priority Build Order

**Immediate (already building):**
- Chartplotter (MapLibre + NOAA ENC) — addresses #1 gap (no modern web chartplotter)
- MFD device frame — unified UI that eliminates Frankenstein problem

**Next (informed by this research):**
- **Logbook** — confirmed biggest gap. No open-source competitor. Auto-populate from instruments, manual entry standalone.
- **Anchor watch** — safety-first pattern, 3-poll debounce, immediate alert
- **Instrument dashboard** — SignalK adapter for real-time boat data

**Then (platform layer):**
- **Go API server with protocol adapters** — NMEA 0183 first, NMEA 2000 second, Victron MQTT third
- **Own data model** — the foundation everything queries
- **MCP server for AI** — cross-system reasoning
- **Docker image** — single `docker-compose up`

**Later (when platform proven):**
- Sailing tactical features (SailSteer equivalent, polars, laylines)
- Camera integration (slot/hardware pattern, frame buffer)
- Passage planner with weather routing
- Vessel monitoring + alerts (Cortex competitor)
- Offline voice commands
- Radar overlay (Navico Ethernet first)

---

## Part 6: Licensing & IP Boundaries

**d3kOS** does not specify a license on GitHub. The CLAUDE.md references it as a commercial product with tiered pricing. Assume proprietary. **No code from d3kOS will be used.**

**Above Deck is GPL-licensed.** Compatibility rules:

| Project | License | Compatible? |
|---------|---------|-------------|
| SignalK Server | Apache-2.0 | Yes |
| OpenCPN | GPL-2.0 | Yes (with care for version compat) |
| Freeboard-SK | Apache-2.0 | Yes |
| AvNav | MIT | Yes |
| SensESP | Apache-2.0 | Yes |
| PyPilot | Unspecified | No — unclear |
| Victron Venus OS | Mixed | No — proprietary components |
| BBN OS | GPL-3.0 | Yes |
| d3kOS | Assumed proprietary | No |
| Commercial (Garmin, Raymarine, B&G, Furuno) | Proprietary | No |

**For protocol implementations** (NMEA 0183, NMEA 2000, Victron VE.Direct): documented standards/protocols. Clean-room implementation in Go is fine.

This document records **ideas, architectural patterns, and competitive positioning only**. All implementation will be original, written in Above Deck's Go + TypeScript + React stack.
