# Weather Routing, ECMWF, Radar, Autopilot & Data Sources Deep Dive

**Date:** 2026-03-27

Research into backend data sources and protocols for the Above Deck Go server: weather routing algorithms, ECMWF open data, radar integration, autopilot control, tidal data, and AIS sources.

---

## 1. ECMWF Open Data

### What Changed (October 1, 2025)

ECMWF made its **entire Real-time Catalogue open** under CC-BY-4.0. The key distinction:

| Tier | Resolution | Latency | Cost | Access |
|------|-----------|---------|------|--------|
| **Free & Open Subset** (now) | 0.25° (~25 km) | Real-time | Free (no data cost, no delivery cost) | Direct download, AWS, Azure, GCP |
| **Full Catalogue** (now) | 0.1° (~9 km) IFS HRES | Real-time | CC-BY-4.0, no data cost; **delivery charges may apply** for high-volume | Dissemination service agreement |
| **Free 9 km** (2026, planned) | 0.1° (~9 km) | 2-hour delay | Free | Direct download + cloud mirrors |

### Free Subset Details

- **Format:** GRIB2 (CCSDS compression since Feb 2026); tropical cyclone tracks in BUFR
- **Update frequency:** 4 daily cycles (00, 06, 12, 18 UTC)
- **Parameters:** Wind (10m, 100m), temperature, pressure, precipitation, waves, cloud cover, radiation, soil moisture/temperature, sea ice, ocean data
- **Retention:** Rolling ~2-3 day archive
- **Rate limit:** 500 simultaneous connections to portal
- **Cloud mirrors:** AWS (`s3://ecmwf-forecasts`), Azure, GCP -- no portal rate limits

### Access Methods

1. **Direct HTTP:** `https://data.ecmwf.int/forecasts/` -- browse and download GRIB2 files
2. **Python client:** `ecmwf-opendata` package (MARS-style request interface)
3. **Cloud buckets:** AWS/Azure/GCP replicas for reliability
4. **Open-Meteo proxy:** Serves ECMWF IFS at native 9 km resolution via JSON REST API (CC-BY-4.0); 10,000 calls/day free tier

### Resolution Clarification

- **0.25° (25 km):** The free & open subset resolution available now via direct download
- **0.4°:** This was the *old* open data resolution before the October 2025 change
- **0.1° (9 km):** Full IFS HRES; available now via dissemination agreement, free with 2h delay coming in 2026
- **Open-Meteo serves 9 km** by pulling from the full catalogue under CC-BY-4.0

### What Above Deck Needs

**Consume, don't build.** Two options:

1. **Open-Meteo API** (simplest): JSON REST, no GRIB parsing needed, 9 km resolution, generous free tier. Best for MVP.
2. **Direct ECMWF GRIB2 download** (more control): Download from cloud mirrors, parse with Go GRIB2 library. Better for offline/caching and weather routing pre-computation.

**Go GRIB2 libraries available:**
- `nilsmagnus/grib` -- most active, pure Go GRIB2 parser
- `amsokol/go-grib2` -- wraps wgrib2 C code, thread-safe
- `sdifrance/go-grib2` -- maintained fork of amsokol

---

## 2. Weather Routing (Isochrone Algorithm)

### Algorithm Overview

The isochrone method (Hagiwara, 1989) works by:

1. From the start point, fan out candidate headings at time T=0
2. For each heading, compute boat speed from polar diagram + forecast wind at that position/time
3. Project forward by time step (typically 1-6 hours)
4. The envelope of all reached points = isochrone at T+dt
5. Prune points that are "behind" other points (wake pruning, ~35°)
6. Repeat from each point on the isochrone
7. When an isochrone reaches the destination, trace back the optimal path

**Required inputs:**
- Boat polar diagram (speed vs. true wind angle and true wind speed)
- Wind field forecast (gridded, time-varying)
- Land/bathymetry mask (to avoid routing through land)
- Optional: wave data, current data, comfort constraints

### Open Source Implementations

| Project | Language | License | Stars | Quality | Notes |
|---------|----------|---------|-------|---------|-------|
| [OpenCPN weather_routing_pi](https://github.com/seandepagnier/weather_routing_pi) | C++ | GPL-2.0 | ~200 | **Production** | Most mature. Full isochrone with GRIB input, polar support, land avoidance. Tightly coupled to OpenCPN. |
| [libweatherrouting](https://github.com/dakk/libweatherrouting) | Python | **GPL-3.0** | 37 | Good | Clean library API. Isochrone-based. 4 releases. Used by QGIS plugin and GWeatherRouting app. |
| [peterm790/weather_routing](https://github.com/peterm790/weather_routing) | Python | **MIT** | 9 | Experimental | Small but well-documented. Uses GFS via zarr. Includes Volvo 70 polar. Good reference implementation. |
| [VISIR-2](https://gmd.copernicus.org/articles/17/4355/2024/) | Python | Academic | N/A | Research | Published in Geoscientific Model Development. Graph-based (not isochrone). Academic quality. |

### Go Implementations

**None found.** No Go-based weather routing or isochrone library exists. This is something Above Deck would need to build.

### Minimum Viable Implementation

A Go weather routing engine needs:

1. **Polar data parser** -- CSV/JSON format for boat performance tables
2. **Wind field interpolator** -- Read GRIB2 grid, bilinear interpolate at arbitrary lat/lon/time
3. **Isochrone expansion** -- Fan out headings (e.g., 5° increments), compute VMG, project positions
4. **Pruning** -- Remove dominated points (wake pruning)
5. **Land mask** -- GEBCO or Natural Earth coastline check (point-in-polygon)
6. **Path traceback** -- Once destination reached, reconstruct optimal route

**Estimated complexity:** ~2,000-3,000 lines of Go for a basic implementation. The algorithm itself is straightforward; the engineering is in the data pipeline (GRIB2 parsing, interpolation, coastline avoidance).

**Reference algorithm** from `peterm790/weather_routing` (MIT) can be ported to Go.

---

## 3. Radar Data Protocols

### The Hard Truth

Marine radar is the **most locked-down** data type in the marine electronics stack. Every vendor uses proprietary protocols.

### Vendor Status

| Vendor | Radar Models | Protocol | Open Source Access | SDK |
|--------|-------------|----------|-------------------|-----|
| **Navico** (Simrad/B&G/Lowrance) | BR24, 3G, 4G, Halo 20/24/4/6/8 | Proprietary multicast UDP | **Yes** -- reverse-engineered in `radar_pi` (2,668 commits, 99 stars) | No |
| **Raymarine** | Quantum (wired), Quantum 2, Cyclone, Cyclone Pro | Proprietary UDP unicast | **Partial** -- `radar_pi` supports Quantum Q24C/Q24D; Quantum WiFi-only NOT supported | **Yes** -- paid SDK (USB key A80631 required). Provides spoke/scan data. C++ API. Windows + Linux. |
| **Garmin** | HD, xHD | Proprietary | **Partial** -- `radar_pi` supports HD/xHD only | No |
| **Garmin** | xHD2, Fantom | Proprietary | **No** -- NOT reverse-engineered | No |

### Radar Data Format

Radar data is structured as **spokes** (radial scan lines):
- `SpokesPerScan` -- number of directional beams per full rotation (varies by radar)
- `SamplesPerSpoke` -- range samples per beam (determines max range resolution)
- Each sample is a byte (0-255 intensity)
- Spoke angle is relative to vessel heading; bearing is enriched with true heading if available

### SignalK Radar Integration

[signalk-radar](https://github.com/wdantuma/signalk-radar) (MIT, **written in Go**) is an early-stage radar server companion to SignalK:
- Go radar server + SignalK plugin
- Exposes radar data via JSON REST API and **protobuf WebSocket**
- 8 stars, 68 commits -- early/experimental
- Architecture: Radar hardware -> Go server -> protobuf WS -> SignalK plugin -> Freeboard-SK

### OpenCPN radar_pi

The [radar_pi](https://github.com/opencpn-radar-pi/radar_pi) plugin (GPL-2.0) is the most complete open-source radar implementation:
- C/C++ (70.6% C, 26.4% C++)
- 2,668 commits, 99 stars
- Supports Navico (all models), Raymarine Quantum, Garmin HD/xHD
- Built on years of reverse engineering starting from 2012

### What Above Deck Needs

**Phase 1 (MVP):** Skip radar entirely. It requires physical hardware for testing and vendor-specific protocol work.

**Phase 2 (if pursuing):**
- The `signalk-radar` Go server is the closest starting point (MIT license, Go)
- For Navico Halo: protocol is well-documented in `radar_pi` source code (but GPL-2.0, cannot directly copy)
- For Raymarine: purchase SDK (USB key + license agreement) for wired Quantum/Cyclone
- For Garmin modern: no path without vendor cooperation

**Key insight:** Radar is a **display problem** more than a data problem. The hard part is rendering spoke data as a real-time polar image overlay on a chart. The `signalk-radar` protobuf WebSocket approach is architecturally sound.

---

## 4. Autopilot Control Protocols

### NMEA 2000 Autopilot PGNs

| PGN | Name | Direction | Purpose |
|-----|------|-----------|---------|
| 127237 | Heading/Track Control | TX to autopilot | Set heading, track mode, rudder limit |
| 126208 | NMEA Command Group Function | TX to autopilot | Generic command wrapper for configuring devices |
| 129283 | Cross Track Error | RX from GPS/plotter | XTE for track-following mode |
| 129284 | Navigation Data | RX from GPS/plotter | Bearing/distance to waypoint |
| 65379 | Raymarine proprietary | TX to autopilot | Raymarine-specific engage/disengage, heading adjust |

### Vendor-Specific Reality

**Raymarine:** Uses standard PGNs *plus* proprietary SeaTalk NG messages. The `signalk-autopilot` plugin supports Raymarine via both NMEA 2000 and SeaTalk 1 (with translation hardware).

**Simrad (Navico):** NAC-3 autopilot supported by `signalk-autopilot` but limited to increment/decrement heading commands only.

**Garmin:** Uses standard NMEA 2000 PGNs but autopilot control integration with open-source tools is minimal.

### SignalK Autopilot API

The [signalk-autopilot](https://github.com/SignalK/signalk-autopilot) plugin provides a REST/WebSocket API:

```
PUT /signalk/v1/api/vessels/self/steering/autopilot/state       -> auto/wind/route/standby
PUT /signalk/v1/api/vessels/self/steering/autopilot/target/headingMagnetic -> degrees (0-360)
PUT /signalk/v1/api/vessels/self/steering/autopilot/target/windAngleApparent -> radians
PUT /signalk/v1/api/vessels/self/steering/autopilot/actions/adjustHeading -> +/- degrees
PUT /signalk/v1/api/vessels/self/steering/autopilot/actions/tack -> port/starboard
PUT /signalk/v1/api/vessels/self/steering/autopilot/actions/advanceWaypoint
```

Supported autopilots: Raymarine NMEA 2000, Raymarine SeaTalk 1 (via Digital Yacht ST-NMEA-USB, Shipmodul Miniplex 3, or Gadgetpool converter), Simrad NAC-3 (limited).

### Hardware Gateways for Sending Commands

| Gateway | Protocol | Autopilot TX | Notes |
|---------|----------|-------------|-------|
| **Digital Yacht iKonvert** | USB serial, simple text protocol | **Yes** (since v2.47, 2020) | DIP switch autopilot modes. Bidirectional NMEA 2000. Published protocol. |
| **Digital Yacht NavLink2** | WiFi, same protocol as iKonvert | **Yes** | Wireless NMEA 2000 gateway |
| **Actisense NGW-1** | USB serial | Read-only typically | Primarily a listener |
| **Yacht Devices YDWG-02** | WiFi/USB | **Yes** | Raymarine autopilot support added |

The iKonvert/NavLink2 protocol is published and simple (serial text), making it the best path for Go integration.

### Safety Model

**There is no standardized safety model for open-source autopilot control.** The relevant standards are:

- **IEC 62065:** Track control systems -- operational requirements, performance, testing. Covers heading hold, track following, alarms, and manual override. Required for SOLAS vessels.
- **IMO Performance Standards:** Require alarms for off-course deviation, manual override capability at all times.
- **COLREGS:** Any autopilot system must allow immediate manual override for collision avoidance.

**For Above Deck, the safety requirements are:**

1. **Never remove manual override** -- physical helm must always work
2. **Watchdog timer** -- if software stops sending commands, autopilot reverts to standby
3. **Course deviation alarm** -- alert if actual heading diverges from commanded
4. **Rate limiting** -- prevent software bugs from commanding rapid heading changes
5. **Authentication** -- autopilot commands must be authenticated (not from random network clients)
6. **Explicit user confirmation** -- never auto-engage autopilot; require deliberate human action

### What Above Deck Needs

**Phase 1:** Read-only autopilot status via SignalK (heading, mode, rudder angle). No sending commands.

**Phase 2:** Send commands via SignalK autopilot API (the Go server proxies to SignalK, which handles the vendor-specific translation).

**Phase 3 (advanced):** Direct NMEA 2000 via iKonvert -- Go server sends PGN 127237 directly. Requires implementing the iKonvert serial protocol and NMEA 2000 PGN encoding.

---

## 5. Tidal Data

### US Waters: NOAA CO-OPS

**Still the best free option for US waters.** No changes needed from existing research.

- **API:** `https://api.tidesandcurrents.noaa.gov/api/prod/`
- **Cost:** Free, no API key
- **Coverage:** ~3,000 stations across US coasts, Great Lakes, territories
- **Data:** Real-time water levels, tide predictions, currents, harmonic constituents
- **Formats:** JSON, XML, CSV
- **Harmonics:** Full constituent data available for download

### Global Coverage

| Source | Coverage | License | Format | Notes |
|--------|----------|---------|--------|-------|
| **TICON-4** (SHOM) | 4,383 tide gauges globally | **CC-BY-4.0** | Harmonic constituents (50 per station) | Free download. Based on GESLA-4 records. |
| **FES2022** (AVISO+/CNES) | Global ocean, 1/30° grid | **Free** (registration required) | NetCDF, harmonic constituents | Global tidal atlas. Complements TICON-4 for areas without tide gauges. |
| **Neaps tide-database** | ~7,600 stations | Open source | SQLite/JSON harmonics | Already in our Tier 1 stack. Community-maintained. |
| **NOAA CO-OPS** | US waters only | Free/public domain | JSON/XML API | Real-time + predictions. |
| **ADMIRALTY** (UKHO) | UK + some global | Free tier (10k req/mo) | JSON API | Already in our Tier 2 stack. |
| **TideCheck API** | Global (uses TICON-4 + FES2022) | Free tier (50 req/day) | JSON API | Convenience layer over TICON-4/FES2022. |

### What Above Deck Needs

**Already well-covered** by the existing data-source architecture (Neaps for offline, NOAA CO-OPS for US real-time). For global coverage:

1. **Offline:** Bundle TICON-4 harmonics (CC-BY-4.0) into the Go server for local tide prediction. This gives 4,383 stations with no API dependency.
2. **Enhanced global:** Download FES2022 grid data for interpolated predictions anywhere on the ocean (requires ~2 GB of NetCDF files, but provides predictions at arbitrary coordinates).

---

## 6. AIS Data Sources

### aisstream.io

- **Cost:** Free (beta)
- **Protocol:** WebSocket (`wss://stream.aisstream.io/v0/stream`)
- **Auth:** API key (free, via GitHub login)
- **Coverage:** Global terrestrial AIS network (check coverage map; gaps in remote ocean areas)
- **Rate limits:** Throttled at API key/user level; ~300 messages/sec if subscribed to entire world
- **Data:** Position reports, voyage data, binary messages, SAR aircraft
- **Terms:** Beta, **no SLA, no uptime guarantee**
- **Client libraries:** Go, Python, JavaScript, Java examples provided
- **Risk:** Beta service could change terms, add pricing, or shut down

### Alternatives

| Source | Type | Cost | Notes |
|--------|------|------|-------|
| **aisstream.io** | WebSocket streaming | Free (beta) | Best free option. No SLA. Go example available. |
| **MarineTraffic** | REST API | Enterprise only (removed credit system Jan 2025) | Contact sales. Acquired by Kpler. Expensive. |
| **VesselFinder** | REST API | Credit-based, from €330/10k credits | Transparent pricing but not free. |
| **Data Docked** | REST API | From €80/month | Developer-focused. Satellite + terrestrial AIS. |
| **AIS-catcher** (local SDR) | RTL-SDR receiver | Hardware cost only (~$30 dongle) | **Best for self-hosted.** GPL-3.0. Outputs NMEA via UDP/TCP. Supports RTL-SDR, Airspy, HackRF. No cloud dependency. ~10-20 NM range. |
| **OpenSky Network** | REST/WebSocket | Free for research | Aircraft focus, some AIS. Academic terms. |

### What Above Deck Needs

**Dual approach:**

1. **Cloud AIS (aisstream.io):** For the web/cloud deployment. Free, WebSocket, Go client exists. Accept the beta risk; the architecture should make the AIS source pluggable.
2. **Local AIS (AIS-catcher + SDR):** For the self-hosted/boat deployment. The Go server receives NMEA sentences via UDP from AIS-catcher running on the same Raspberry Pi. Zero cloud dependency. This is the correct architecture for offshore use.

The Go server should abstract AIS behind an interface: `AISProvider` with implementations for WebSocket (aisstream), UDP NMEA (local SDR), and potentially SignalK (which can aggregate both).

---

## Summary: Build vs. Consume

| Capability | Build or Consume | Approach |
|-----------|-----------------|----------|
| Weather data | **Consume** | Open-Meteo API (MVP) or direct ECMWF GRIB2 download (advanced) |
| GRIB2 parsing | **Consume** | `nilsmagnus/grib` Go library |
| Weather routing | **Build** | Go isochrone engine; port algorithm from `peterm790/weather_routing` (MIT) |
| Polar data | **Build** | Parser for CSV/POL polar files (simple format) |
| Radar display | **Defer** | Skip for MVP; `signalk-radar` (Go, MIT) as starting point later |
| Autopilot read | **Consume** | SignalK WebSocket subscription |
| Autopilot write | **Build** (Phase 2) | Via SignalK autopilot API, then direct iKonvert serial |
| Tides (US) | **Consume** | NOAA CO-OPS API |
| Tides (global) | **Build** | Bundle TICON-4 harmonics, compute locally in Go |
| AIS (cloud) | **Consume** | aisstream.io WebSocket |
| AIS (local) | **Consume** | AIS-catcher SDR -> UDP NMEA -> Go server |

### Priority Order for Go Server

1. **AIS ingestion** (WebSocket + UDP NMEA) -- already partially built
2. **Weather data pipeline** (Open-Meteo API -> cache -> serve to clients)
3. **Tidal predictions** (TICON-4 harmonics bundled, compute locally)
4. **Weather routing engine** (isochrone algorithm, biggest engineering effort)
5. **Autopilot integration** (read-only via SignalK first)
6. **Radar** (future, requires hardware)

---

## Sources

- [ECMWF Open Data](https://www.ecmwf.int/en/forecasts/datasets/open-data)
- [ECMWF Full Catalogue Announcement](https://www.ecmwf.int/en/about/media-centre/news/2025/ecmwf-makes-its-entire-real-time-catalogue-open-all)
- [ECMWF Open Data Python Client](https://github.com/ecmwf/ecmwf-opendata)
- [Open-Meteo ECMWF API](https://open-meteo.com/en/docs/ecmwf-api)
- [OpenCPN Weather Routing Plugin](https://github.com/seandepagnier/weather_routing_pi)
- [libweatherrouting](https://github.com/dakk/libweatherrouting)
- [peterm790/weather_routing](https://github.com/peterm790/weather_routing)
- [VISIR-2 Paper](https://gmd.copernicus.org/articles/17/4355/2024/)
- [radar_pi (OpenCPN Radar Plugin)](https://github.com/opencpn-radar-pi/radar_pi)
- [signalk-radar (Go)](https://github.com/wdantuma/signalk-radar)
- [Raymarine SDK](https://www.raymarine.com/en-us/support/sdk)
- [SignalK Autopilot Plugin](https://github.com/SignalK/signalk-autopilot)
- [Digital Yacht iKonvert](https://github.com/digitalyacht/iKonvert)
- [Yacht Devices Autopilot Control](https://www.yachtd.com/products/autopilot.html)
- [NOAA CO-OPS API](https://api.tidesandcurrents.noaa.gov/api/prod/)
- [TICON-4 (GESLA)](https://gesla787883612.wordpress.com/ticon/)
- [FES2022 (AVISO)](https://www.aviso.altimetry.fr/en/data/products/auxiliary-products/global-tide-fes.html)
- [Neaps Tide Database](https://github.com/neaps/tide-database)
- [aisstream.io](https://aisstream.io/)
- [aisstream.io Documentation](https://aisstream.io/documentation)
- [AIS-catcher](https://github.com/jvde-github/AIS-catcher)
- [AIS API Providers Compared (Data Docked)](https://datadocked.com/ais-api-providers)
- [nilsmagnus/grib (Go GRIB2)](https://github.com/nilsmagnus/grib)
- [Go NMEA 2000 PGN Reference](https://canboat.github.io/canboat/canboat.html)
- [IEC 62065 / Autopilot Safety](https://www.mavyn.com/blog/understanding-pgn-127237-in-nmea-2000-networks)
