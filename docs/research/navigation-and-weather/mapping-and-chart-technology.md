# Mapping and Nautical Chart Technology

**Date:** 2026-03-20
**Purpose:** Technical research for Above Deck's chartplotter — covering MapLibre GL JS, nautical chart data sources, S-57/ENC-to-vector-tile pipelines, tile serving, offline charts, marine overlays, and the open-source chart project landscape.

---

## Table of Contents

1. [MapLibre GL JS Deep Dive](#maplibre-gl-js-deep-dive)
2. [Nautical Chart Data Sources](#nautical-chart-data-sources)
3. [S-57/ENC to Vector Tiles Pipeline](#s-57enc-to-vector-tiles-pipeline)
4. [Tile Serving](#tile-serving)
5. [Offline Charts](#offline-charts)
6. [Marine-Specific Overlays](#marine-specific-overlays)
7. [Existing Open-Source Chart Projects](#existing-open-source-chart-projects)
8. [Recommended Architecture for Above Deck](#recommended-architecture-for-above-deck)
9. [Sources](#sources)

---

## MapLibre GL JS Deep Dive

### Current Version and Status

MapLibre GL JS is at **v5.21.0** (released 20 March 2025). It is a TypeScript library that uses WebGL to render interactive maps from vector tiles in a browser. It is the community-maintained, BSD-3-Clause-licensed fork of Mapbox GL JS — no vendor lock-in, no API keys required.

Major v5.x milestones:

| Version | Date | Highlights |
|---------|------|------------|
| v5.0.0 | 2024 | Major release, globe projection, WebGL2 default |
| v5.20.0 | March 2025 | Etag support for tile reloading, raster resampling |
| v5.21.0 | 20 March 2025 | ES2020 compat, referrer policy, memory leak fixes |

### Vector Tile Rendering Pipeline

MapLibre's rendering pipeline:

1. **Tile fetch** — Requests MVT (Mapbox Vector Tile / Protobuf) tiles from a source URL, PMTiles archive, or custom protocol.
2. **Decode** — Worker threads parse PBF into geometry + attributes per layer.
3. **Bucket creation** — Geometry is tessellated, text is shaped, and data is packed into typed arrays for the GPU.
4. **Upload** — Vertex/index buffers are pushed to the GPU.
5. **Render** — Per-frame draw calls: fill, line, symbol, circle, heatmap, raster, hillshade, and custom layers. All composited via WebGL framebuffers.

The pipeline is GPU-accelerated, which means smooth 60fps pan/zoom even with hundreds of layers — critical for dense nautical charts.

### MapLibre Tile Format (MLT)

As of October 2025 the MapLibre Tile (MLT) specification is stable. MLT is a next-generation columnar tile format offering:

- Up to **6x better compression** on large tiles vs MVT.
- Column-oriented layout designed for efficient GPU processing.
- Supported in both MapLibre GL JS and MapLibre Native via `encoding: "mlt"` on sources.

MLT is worth monitoring but MVT remains the pragmatic choice today — all existing tooling (Tippecanoe, Martin, PMTiles) produces MVT.

### Custom Layer Support

MapLibre exposes a `CustomLayerInterface` that gives direct access to the WebGL context. Custom layers:

- Implement `onAdd(map, gl)`, `render(gl, matrix)`, and optionally `prerender`.
- Can use `renderingMode: "3d"` to share the depth buffer with other layers (useful for 3D buoy markers).
- Can be interleaved with standard style layers (placed at any position in the layer stack).

This is the hook for marine-specific rendering: AIS vessels, weather particles, custom buoy symbols, animated tide arrows.

### Offline Tile Loading

MapLibre supports offline via several mechanisms:

| Mechanism | How it works | Best for |
|-----------|-------------|----------|
| `addProtocol("pmtiles", ...)` | PMTiles JS library intercepts tile requests, reads from a single `.pmtiles` file via range requests | Local file or CDN |
| Service Worker interception | SW caches the `.pmtiles` file and serves byte ranges from cache | PWA offline |
| Custom protocol + OPFS | `addProtocol` reads tiles from Origin Private File System | Browser-based storage |
| Local HTTP server | Martin / nginx serves tiles from filesystem | Boat server (Go backend) |

The PMTiles + `addProtocol` approach is the simplest: a single file, no tile server, no database. For the Go backend on the boat, Martin or direct file serving is the way to go.

### Mobile / Touch Performance

- WebGL rendering is hardware-accelerated on modern iOS Safari and Android Chrome.
- MapLibre supports touch gestures natively: pinch zoom, two-finger rotate/pitch, momentum scrolling.
- Performance on iPad (A-series / M-series chips) is excellent — 60fps with complex styles.
- On older Android tablets, reducing the number of symbol layers and disabling label collision detection helps.
- Globe projection adds overhead; for a chartplotter Mercator is both traditional and faster.

### Comparison with Leaflet and OpenLayers

| Feature | MapLibre GL JS | Leaflet | OpenLayers |
|---------|---------------|---------|------------|
| Rendering | WebGL (GPU) | DOM / Canvas (CPU) | Canvas + WebGL opt-in |
| Tile format | Vector (MVT) primary | Raster primary | Both |
| Style spec | MapLibre Style JSON | CSS / per-layer | OL style objects |
| 3D / Globe | Yes (built-in) | No | Limited |
| Custom WebGL layers | Yes | No | Limited |
| Bundle size | ~220 KB gzipped | ~40 KB gzipped | ~150 KB gzipped |
| Offline PMTiles | Native via addProtocol | Plugin needed | Plugin needed |
| Touch perf | Excellent | Good | Good |
| Large dataset perf | Excellent (50k+ features) | Degrades >10k | Good to 50k |
| Ecosystem plugins | 82 plugins, growing 71% since 2023 | 400+ plugins, mature | ~100 plugins |
| License | BSD-3-Clause | BSD-2-Clause | BSD-2-Clause |

**Verdict:** MapLibre is the clear choice for a chartplotter. GPU-accelerated vector rendering is essential for smooth interaction with dense nautical chart data. Leaflet is too limited for this use case. OpenLayers is capable (Freeboard-SK uses it) but MapLibre's WebGL pipeline, custom layer API, and PMTiles integration give it a decisive edge.

### Plugin Ecosystem

Key plugins relevant to marine charting:

| Plugin | Purpose |
|--------|---------|
| `pmtiles` | Load tiles from single-file PMTiles archives |
| `deck.gl` (MapboxOverlay) | Advanced WebGL visualizations — millions of points, particle systems |
| `maplibre-contour` | Render contour lines from raster DEM tiles |
| `maplibre-three-plugin` | Bridge to Three.js for 3D rendering on maps |
| `maplibre-gl-compare` | Side-by-side map comparison (chart vs satellite) |
| `maplibre-gl-geocoder` | Search / geocoding |
| `@watergis/maplibre-gl-export` | Export map as image / PDF |

---

## Nautical Chart Data Sources

### Free National Hydrographic Data

| Country | Agency | Format | Coverage | Cost | Update Freq |
|---------|--------|--------|----------|------|-------------|
| USA | NOAA Office of Coast Survey | S-57 ENC | US coastal waters, Great Lakes, territories | Free | Weekly |
| New Zealand | LINZ (Toitū Te Whenua) | S-57 ENC | NZ waters, some Pacific islands | Free | Regular |
| Germany | BSH (Bundesamt für Seeschifffahrt) | S-57 ENC | German waters, North/Baltic Sea | Free (via freenauticalchart.net) | Weekly |
| France | SHOM | S-57 ENC (limited free) | French waters | Partially free via data.shom.fr | Varies |
| Brazil | DHN | S-57 ENC | Brazilian waters | Free | Varies |
| Global (community) | OpenSeaMap | OSM-based overlay | Worldwide (variable quality) | Free | Continuous |

### NOAA ENC (S-57) — Primary Source for US Waters

- **Download:** https://charts.noaa.gov/ENCs/ENCs.shtml (individual cells) or bulk via NOAA Chart Downloader.
- **MBTiles (raster):** https://distribution.charts.noaa.gov/ncds/index.html — pre-rendered raster tiles by region, updated weekly.
- **ENC Direct to GIS:** https://nauticalcharts.noaa.gov/data/gis-data-and-services.html — Shapefile/GeoJSON exports.
- **Count:** ~1,200 individual ENC cells covering all US waters.
- **Estimated total size:** S-57 source files for all US waters are approximately 2-3 GB. Converted to vector tiles (MBTiles) the size depends on zoom levels — expect 5-15 GB for full coverage at z0-z18.

### OpenSeaMap

OpenSeaMap provides community-contributed seamark data as an overlay — buoys, lights, harbours, depth data — sourced from OpenStreetMap. Available as:

- Pre-rendered raster tiles at `tiles.openseamap.org/seamark/{z}/{x}/{y}.png`
- Raw data via OSM Overpass API
- Useful as a supplement but not a primary chart source. Quality varies by region (excellent in Europe, patchy elsewhere).

### S-57 vs S-101 (IHO Standard Transition)

| Aspect | S-57 (Current) | S-101 (Next Generation) |
|--------|----------------|------------------------|
| Standard family | IHO S-57 Ed 3.1 | IHO S-100 framework |
| Data model | Feature/attribute tables | ISO 8211 + GML |
| Symbology | S-52 Presentation Library | S-52 extended + portrayal catalogue |
| Grid/coverage support | Limited | Built-in (bathymetric surfaces, gridded data) |
| Metadata | Basic | Rich ISO 19115 metadata |
| Status | Production standard worldwide | Trial datasets 2025-2026 |

**Transition Timeline:**

| Date | Milestone |
|------|-----------|
| January 2026 | S-100 ECDIS optionally available; NOAA begins dual S-57/S-101 production |
| 2026-2028 | Trial period — hydrographic offices produce both formats |
| January 2029 | S-100 ECDIS mandatory for newly installed systems on new ships |
| 2029-2036 | "Dual fuel" period — both S-57 and S-101 supported |
| ~2036 | Target for full S-57 withdrawal (no firm date) |

**Implication for Above Deck:** Build the pipeline around S-57 now. S-101 support can be added later — GDAL already has experimental S-101 drivers and the data model is a superset. There is no urgency; S-57 will be available for at least another decade.

### Chart Datum, Projections, Coordinate Systems

- **Horizontal datum:** WGS 84 (EPSG:4326) is the standard for all modern ENCs. MapLibre uses EPSG:3857 (Web Mercator) for display — standard web map projection.
- **Vertical datum:** Chart Datum (CD) varies by region — typically Lowest Astronomical Tide (LAT) in most countries, Mean Lower Low Water (MLLW) in the US. Depth values in ENCs are relative to this datum.
- **Projection for vector tiles:** Web Mercator (EPSG:3857). S-57 source data is in WGS 84 geographic coordinates — GDAL reprojects during conversion.
- **Important:** Depth soundings and contours use chart datum, not WGS 84 vertical. The tile pipeline must preserve depth values as attributes, not try to transform them vertically.

---

## S-57/ENC to Vector Tiles Pipeline

### Overview

The pipeline converts S-57 binary ENC files into vector tiles (MVT format in MBTiles or PMTiles archives) that MapLibre can render. The general flow:

```
S-57 (.000 files)
    → GDAL/OGR (read S-57, extract layers/attributes)
    → GeoJSON (intermediate format)
    → Tippecanoe (tile generation, simplification, attribute filtering)
    → MBTiles (SQLite tile archive)
    → PMTiles (optional: convert for serverless serving)
```

### Step 1: GDAL/OGR for S-57 Reading

GDAL's S-57 driver (`ogr2ogr`) reads ENC files and converts them to GeoJSON, Shapefile, GeoPackage, or other formats.

Key OGR options for S-57:

| Option | Purpose |
|--------|---------|
| `RETURN_PRIMITIVES=ON` | Return low-level geometry primitives |
| `RETURN_LINKAGES=ON` | Include feature-to-spatial linkages |
| `SPLIT_MULTIPOINT=ON` | Split multipoint soundings into individual points |
| `ADD_SOUNDG_DEPTH=ON` | Add depth as Z coordinate on sounding points |
| `LNAM_REFS=ON` | Include feature relationship references |

Example command:

```bash
ogr2ogr -f GeoJSON output.geojson input.000 \
  -oo RETURN_PRIMITIVES=ON \
  -oo SPLIT_MULTIPOINT=ON \
  -oo ADD_SOUNDG_DEPTH=ON \
  DEPARE   # specific layer name, or omit for all
```

S-57 contains ~100+ object classes (layers). Key ones for chart display:

| Layer | Content |
|-------|---------|
| `DEPARE` | Depth areas (contour polygons) |
| `SOUNDG` | Individual depth soundings (points) |
| `DEPCNT` | Depth contour lines |
| `LNDARE` | Land areas |
| `BOYCAR`, `BOYLAT`, `BOYISD`, `BOYSAW`, `BOYSPP` | Buoy types (cardinal, lateral, isolated danger, safe water, special purpose) |
| `LIGHTS` | Light characteristics |
| `BCNSPP`, `BCNLAT`, `BCNCAR` | Beacon types |
| `OBSTRN` | Obstructions (rocks, wrecks, stumps) |
| `WRECKS` | Wrecks |
| `UWTROC` | Underwater rocks |
| `RESARE` | Restricted areas |
| `ACHARE` | Anchorage areas |
| `TSSLPT`, `TSSRON` | Traffic separation schemes |
| `COALNE` | Coastline |
| `SLCONS` | Shoreline construction (piers, seawalls) |

### Step 2: Tippecanoe for Tile Generation

Tippecanoe (maintained by Felt, formerly Mapbox) generates vector tiles from GeoJSON with intelligent simplification.

```bash
tippecanoe -o charts.mbtiles \
  --minimum-zoom=0 \
  --maximum-zoom=16 \
  --no-tile-size-limit \
  --force \
  --layer=depth_areas depth_areas.geojson \
  --layer=soundings soundings.geojson \
  --layer=buoys buoys.geojson \
  --layer=lights lights.geojson \
  # ... additional layers
```

Key Tippecanoe strategies for nautical data:

| Strategy | Flag | Why |
|----------|------|-----|
| Preserve all points at high zoom | `--no-feature-limit` | Every sounding matters at harbour scale |
| Drop features at low zoom | `-z0 -Z16` per layer | Overview charts need fewer soundings |
| Keep all attributes | `--no-tile-stats` | S-57 attributes needed for symbology |
| No simplification on depth contours | `--no-simplification-of-shared-nodes` | Contour topology must be preserved |
| Separate layers | `--named-layer` | Enables per-layer styling in MapLibre |

### Step 3: Convert to PMTiles (Optional)

```bash
pmtiles convert charts.mbtiles charts.pmtiles
```

The `pmtiles` CLI converts MBTiles to PMTiles — a single file that can be served from any static file host or stored locally.

### Existing S-57 Pipeline Tools

| Tool | Language | Status | Notes |
|------|----------|--------|-------|
| **s57-tiler** | Go | Active | Creates vector tiles from S-57 for Freeboard-SK. Requires Go 1.20, GDAL 3.6.2. Configurable zoom levels (default z14). Docker support. |
| **s57tiler** | Rust | Archived (proof of concept) | GeoJSON + metadata from S-57, feeds into Tippecanoe. Serves via tileserver-gl, styles via Maputnik. Development moved to openenc.com. |
| **s57-vector-tile-server** | Python | Experimental | Direct PBF tile serving from S-57 via GDAL. |
| **BAUV-Maps** | Mixed | Active | S-57 and BSB compatible map server for web viewers. |

**s57-tiler (Go)** is the most relevant for Above Deck — it is written in Go (aligns with the backend stack), is actively maintained, produces vector tiles compatible with web map clients, and has Docker support for the pipeline.

### Marine Symbology: S-52 Standard

S-52 is the IHO standard for portraying ENC data on electronic displays. It defines:

- **Colour tables:** Day, dusk, and night palettes (critical for a sailor-first product).
- **Symbol library:** ~500 point symbols for buoys, lights, beacons, hazards.
- **Line styles:** Depth contours, traffic lanes, restricted area boundaries.
- **Area fills:** Depth zone shading, land tints, built-up areas.
- **Conditional symbology:** Display rules based on attribute values (e.g., a light symbol changes based on its characteristics).

Implementing S-52 in MapLibre requires:

1. **Sprite sheet:** Export S-52 symbols as a sprite atlas (PNG + JSON index) — MapLibre's standard icon mechanism.
2. **Style rules:** Translate S-52 conditional symbology into MapLibre style expressions (`match`, `case`, `interpolate`).
3. **Colour tables:** Define three MapLibre styles (day/dusk/night) switching the palette via `map.setStyle()` or runtime style changes.
4. **Text placement:** S-52 defines specific text placement rules for soundings, light characteristics, and names.

No off-the-shelf MapLibre S-52 style exists. Building one is substantial work (~200-300 style rules) but well-defined by the specification. The Freeboard-SK project and s57-tiler have partial implementations that can serve as references.

### What BBN OS and OpenPlotter Use

Both BBN OS (Bareboat Necessities) and OpenPlotter use **OpenCPN** as their chart rendering engine:

- OpenCPN is a C++ desktop application that natively reads S-57 and renders with its own S-52 implementation.
- It runs on Raspberry Pi (4.5W power consumption with BBN OS).
- **Not web-based** — it uses wxWidgets for rendering, not a browser.
- Freeboard-SK (also bundled in both) provides the web-based alternative, using OpenLayers + vector tiles from s57-tiler.
- SignalK server acts as the data broker; chart display is handled by either OpenCPN (native) or Freeboard-SK (web).

**Implication:** Above Deck's MapLibre-based chartplotter replaces both OpenCPN and Freeboard-SK with a modern, GPU-accelerated web renderer. The s57-tiler pipeline (Go) produces the tiles; MapLibre + custom S-52 styles renders them.

---

## Tile Serving

### Self-Hosted Tile Server Options

| Server | Language | Formats | Notes |
|--------|----------|---------|-------|
| **Martin** | Rust | PostGIS, MBTiles, PMTiles | Official MapLibre tile server. Blazing fast, low memory. Serves PMTiles and MBTiles directly. |
| **TileServer GL** | Node.js | MBTiles | Serves vector and raster tiles. Includes built-in style rendering for raster fallback. Uses Node.js (conflict with project's no-Node-backend rule). |
| **PMTiles (direct)** | N/A | PMTiles | No server needed — serve the file from any HTTP server supporting range requests. Nginx, Caddy, Go `http.FileServer` all work. |
| **Protomaps** | TypeScript/Go | PMTiles | Open-source hosting toolkit. Includes a CDN-optimized serverless function for cloud hosting. |
| **pg_tileserv** | Go | PostGIS | Lightweight tile server for PostGIS. Good if charts are loaded into PostgreSQL. |

### PMTiles: The Key Format

PMTiles is a single-file archive for map tiles. Key properties:

- **No server needed.** Any HTTP server with range request support works.
- **Efficient access.** Hilbert-curve tile ordering + run-length encoded directories. A single metadata request (~100 KB) loads the directory; subsequent tile fetches are single HTTP range requests.
- **Compression.** Typically 70%+ smaller than equivalent directory-of-files approach.
- **Cloud-native.** Works directly from S3, GCS, R2 — no Lambda/Cloud Function needed.
- **Browser-native.** The `pmtiles` JS library integrates with MapLibre via `addProtocol`.

### MBTiles Format

MBTiles is an SQLite database containing tiles in a `tiles` table keyed by `(zoom, column, row)`. It is:

- The standard output of Tippecanoe.
- Supported by Martin, TileServer GL, and most tile tooling.
- Convertible to PMTiles via `pmtiles convert`.
- Good for intermediate storage and local development.

### Serving Tiles from the Go Backend

For the Above Deck Go backend, two approaches:

**Option A: Direct PMTiles serving (recommended for boat)**

```go
// Serve PMTiles file directly — Go's http.ServeContent handles range requests
http.HandleFunc("/charts/", func(w http.ResponseWriter, r *http.Request) {
    http.ServeFile(w, r, "/data/charts/region.pmtiles")
})
```

The `pmtiles` JS library in the browser handles parsing the directory and requesting specific byte ranges. The Go server just needs to support HTTP Range requests (which `http.ServeFile` does natively).

**Option B: Martin as a sidecar**

Run Martin alongside the Go server for more advanced tile serving (on-the-fly PostGIS queries, style serving, font glyph serving). Martin is a single binary with minimal resource usage (~10 MB RAM).

### CDN for Cloud, Local for Boat

| Environment | Serving Strategy |
|-------------|-----------------|
| Cloud (website demo) | PMTiles on Cloudflare R2 / S3 + `pmtiles` JS library |
| Boat (local network) | PMTiles file on Go server filesystem, served via `http.ServeFile` |
| Hybrid | Try local first, fall back to CDN if online |

---

## Offline Charts

### Pre-downloading Chart Regions

The offline workflow:

1. **User selects a region** in the UI (bounding box on map, or named region like "Chesapeake Bay").
2. **Server generates/serves a PMTiles file** for that region (pre-built or extracted from a larger archive).
3. **Browser downloads the file** into persistent storage (OPFS, IndexedDB, or filesystem on native).
4. **MapLibre loads from local storage** via `addProtocol` — no network needed.

### Storage Options in the Browser

| Storage | Capacity | Persistence | API | Notes |
|---------|----------|-------------|-----|-------|
| **OPFS** (Origin Private File System) | Up to device quota (often GB) | Persistent | File System Access API | Best for large files. Fast random access. Not available in all contexts (no Safari workers until recent versions). |
| **IndexedDB** | Varies (often 1-2 GB) | Persistent | IDB API | Mature, widely supported. Slower for large binary blobs. |
| **Cache API** (Service Worker) | Varies | Semi-persistent | Cache API | Good for caching individual tile responses. Browser may evict under storage pressure. |
| **Filesystem** (Electron/Tauri) | Unlimited | Persistent | Node fs / Tauri fs | Best option for desktop/native apps. |

For a PWA on an iPad, OPFS is the best bet for storing multi-hundred-MB PMTiles files with fast random access.

### Storage Requirements (Estimates)

These are rough estimates for vector tiles (much smaller than raster) at useful zoom levels (z0-z16):

| Region | Approx PMTiles Size (Vector) | Notes |
|--------|------------------------------|-------|
| Single harbour (e.g., San Francisco Bay) | 5-20 MB | z10-z16, all detail |
| US East Coast (Maine to Florida) | 200-500 MB | z0-z16, all ENC cells |
| All US waters | 1-3 GB | z0-z16, all ~1,200 ENC cells |
| Caribbean | 100-300 MB | Fewer cells, less coastal detail |
| Mediterranean (community data) | 200-600 MB | Via OpenSeaMap + national sources |
| Single ocean passage area | 10-50 MB | Sparse data at ocean scales |

For comparison, NOAA's pre-rendered raster MBTiles are significantly larger (10-50 GB for all US waters) because raster tiles store pixels rather than vector geometry.

### Update Mechanism

| Strategy | How | Tradeoff |
|----------|-----|----------|
| **Full re-download** | Download new PMTiles for the region | Simple. Works for small regions. Wasteful for large areas. |
| **Delta updates** | Diff old and new MBTiles, send only changed tiles | Complex to implement. PMTiles doesn't natively support deltas. |
| **Versioned files** | Name files with date/version, download new version when available | Simple. Old version stays usable until new one is ready. |
| **Tile-level cache invalidation** | Service worker checks ETags per tile | Works for online-first with offline fallback. Not true offline. |

**Recommendation:** Versioned full re-downloads per region. NOAA updates ENCs weekly; a weekly PMTiles rebuild per region is feasible. The vector tile sizes are small enough that full re-download is practical even on marina Wi-Fi.

### Chart Region Selection UX

The UX for selecting offline regions should:

- Show a map with available chart coverage polygons.
- Let the user draw a bounding box or select named regions (e.g., "Puget Sound", "Chesapeake Bay", "BVI").
- Display estimated download size before confirming.
- Show download progress and storage usage.
- Allow managing (updating, deleting) downloaded regions.
- Indicate the freshness of downloaded charts (last update date, whether newer data is available).

---

## Marine-Specific Overlays

All overlays should be MapLibre layers — either standard style layers (for static/vector data) or custom WebGL layers (for animated/real-time data).

### AIS Vessel Positions (Real-Time Layer)

- **Data source:** AISStream.io WebSocket API (free), or local AIS receiver via SignalK.
- **Implementation:** WebSocket connection delivers vessel position updates as JSON. Update a GeoJSON source on MapLibre in real-time.
- **Display:** Vessel icons with heading indicator, COG/SOG labels, vessel name. Colour-code by vessel type (cargo, tanker, sailing, fishing).
- **Performance:** For hundreds of vessels, use a GeoJSON source with `cluster: true` at low zoom. For thousands, switch to a deck.gl ScatterplotLayer.
- **Reference:** The BridgeView AIS project on GitHub demonstrates MapLibre + WebSocket AIS tracking with react-map-gl.

### Weather Overlays

| Overlay | Data Source | Rendering Approach |
|---------|------------|-------------------|
| Wind barbs | Open-Meteo Marine API, GFS GRIB data | Custom symbol layer with rotated wind barb sprites |
| Wind particles | GFS/ECMWF U/V wind grids | Custom WebGL layer (particle animation), similar to earth.nullschool.net |
| Wave height | Open-Meteo Marine API | Colour-coded raster overlay or contour lines |
| Pressure isobars | GFS data | Line layer with labels |
| Precipitation | Open-Meteo | Semi-transparent raster overlay |

The `weather-maps` project on GitHub demonstrates MapLibre custom WebGL layers for weather particle visualization, based on the webgl-wind technique.

WeatherLayers.com provides a commercial deck.gl-based weather visualization library compatible with MapLibre — useful reference for the rendering approach even if not used directly.

### Tide and Current Arrows

- **Data:** NOAA CO-OPS API (US tides, free), Neaps tide-database (global harmonics, offline).
- **Rendering:** Animated arrow symbols at tide station locations. Arrow direction = current direction, arrow length/colour = current speed. Update on a timer (every few minutes).
- **Implementation:** GeoJSON point source with `icon-rotate` bound to current direction attribute.

### Depth Contours and Shading

This is core chart data, not an overlay — rendered from the S-57 vector tiles:

- **Depth areas (DEPARE):** Filled polygons with graduated colour — darker blue for deeper water, lighter for shoals. Use MapLibre `fill` layer with `interpolate` expression on depth attribute.
- **Depth contours (DEPCNT):** Line layer with depth labels. Style with S-52 line weights.
- **Soundings (SOUNDG):** Symbol layer showing individual depth values. Display only at high zoom (z12+).
- **Night mode:** Switch to S-52 night colour table — dark background, minimal contrast, red-shifted palette to preserve night vision.

### Anchorage Areas and Marine Protected Areas

- **Source:** S-57 `ACHARE` (anchorage) and `RESARE` (restricted) layers, supplemented by OpenSeaMap.
- **Rendering:** Semi-transparent fill + dashed boundary line. Anchor icon for anchorage areas. Hatched pattern for restricted areas.

### Hazards

| Hazard Type | S-57 Layer | Symbol |
|-------------|-----------|--------|
| Rocks (submerged) | `UWTROC` | Cross/asterisk with depth |
| Rocks (awash) | `UWTROC` | Cross with underline |
| Wrecks | `WRECKS` | Standard wreck symbol (varies by depth) |
| Obstructions | `OBSTRN` | Obstruction symbol |
| Shoals | `DEPARE` (shallow) | Highlighted depth area |

### Navigation Aids

| Aid Type | S-57 Layers | Display |
|----------|------------|---------|
| Lateral buoys | `BOYLAT` | Red/green buoy symbols (IALA A or B) |
| Cardinal buoys | `BOYCAR` | Yellow/black cardinal symbols with topmark |
| Lights | `LIGHTS` | Light symbol with characteristic (Fl, Oc, Q, etc.) and sector arcs |
| Beacons | `BCNLAT`, `BCNCAR`, `BCNSPP` | Beacon symbols with topmark |
| Racons | Via `LIGHTS` attributes | Racon symbol with morse code ID |

Light sectors (the coloured arcs showing visible range and bearing) are one of the more complex rendering challenges — they require arc geometry generated from the light's attributes (sector start/end bearings, nominal range).

---

## Existing Open-Source Chart Projects

### OpenCPN

- **URL:** https://www.opencpn.org/
- **Language:** C++ (wxWidgets)
- **Chart support:** S-57/S-63 (vector), BSB/KAP (raster), MBTiles (raster)
- **S-52 implementation:** Yes, full S-52 presentation library
- **Relevance:** Reference implementation for S-52 symbology. Not web-based, cannot be reused directly, but the rendering logic and symbol definitions are valuable references.

### Freeboard-SK (SignalK)

- **URL:** https://github.com/SignalK/freeboard-sk
- **Language:** TypeScript (Angular + OpenLayers)
- **Chart support:** XYZ image tiles, MVT/PBF vector tiles, S-57 (via s57-tiler conversion), WMS, WMTS, PMTiles
- **Features:** Route/waypoint management, AIS display, anchor watch, autopilot integration, GPX import
- **Relevance:** The closest existing project to what Above Deck is building. Uses OpenLayers rather than MapLibre. Its chart rendering is functional but basic — no full S-52 symbology. The s57-tiler pipeline it uses is directly reusable.

### AvNav

- **URL:** https://www.wellenvogel.net/software/avnav/
- **Language:** Python (server) + JavaScript (browser UI)
- **Chart support:** MBTiles, GEMF, online tiles
- **Features:** Runs in Chromium browser, good touchscreen support, waypoint navigation
- **Relevance:** Demonstrates browser-based chart plotting on low-power hardware. Uses raster tiles, not vector — limited zoom flexibility.

### OpenSeaMap

- **URL:** https://map.openseamap.org/
- **Technology:** OpenLayers + OSM base tiles + seamark overlay tiles
- **Data:** Community-contributed via OpenStreetMap seamark tagging
- **Relevance:** Useful overlay data source. The seamark tile layer can be added to MapLibre as a raster source. Data quality is best in European waters.

### s57-tiler (Go)

- **URL:** https://github.com/wdantuma/s57-tiler
- **Language:** Go (97.8%)
- **Purpose:** Convert S-57 ENC files to vector tiles for Freeboard-SK
- **Relevance:** Directly usable in Above Deck's pipeline. Written in Go, actively maintained. Produces MVT vector tiles from S-57. Can be integrated into the Go backend or run as a build step.

### s57tiler (Rust) — Archived

- **URL:** https://github.com/manimaul/s57tiler
- **Language:** Rust
- **Purpose:** S-57 to GeoJSON to Tippecanoe to MBTiles pipeline
- **Status:** Proof of concept, development moved to openenc.com (closed source)
- **Relevance:** Good reference for the GDAL → GeoJSON → Tippecanoe pipeline design, even though the project itself is archived.

### BridgeView AIS

- **URL:** https://github.com/tmcknight/bridgeview-ais
- **Language:** TypeScript (React + MapLibre via react-map-gl)
- **Purpose:** Real-time AIS vessel tracking on a MapLibre map
- **Relevance:** Direct reference for implementing the AIS overlay layer in Above Deck. Uses WebSocket for real-time updates and MapLibre for rendering.

### Bareboat Necessities OS / OpenPlotter

- **BBN OS:** https://github.com/bareboat-necessities/lysmarine_gen
- **OpenPlotter:** https://openmarine.net/openplotter
- Both are Raspberry Pi Linux distributions bundling OpenCPN, SignalK, Freeboard-SK, PyPilot.
- **Relevance:** Target deployment platforms for Above Deck's Go backend. The web-based chartplotter (MapLibre) would replace Freeboard-SK in these distributions.

---

## Recommended Architecture for Above Deck

Based on this research, the recommended architecture for Above Deck's chartplotter:

### Chart Pipeline (Build Time)

```
NOAA S-57 ENC files (.000)
    ↓
s57-tiler (Go) or GDAL + Tippecanoe
    ↓
MBTiles (vector tiles with S-57 layer names and attributes)
    ↓
pmtiles convert
    ↓
PMTiles files (one per region)
    ↓
Upload to CDN (cloud) + bundle for local serving (boat)
```

### Runtime Stack

```
┌─────────────────────────────────────────────┐
│  Browser (iPad / Desktop)                    │
│  ┌─────────────────────────────────────────┐ │
│  │  MapLibre GL JS v5                      │ │
│  │  ├─ PMTiles protocol (addProtocol)      │ │
│  │  ├─ S-52 style (day/dusk/night)         │ │
│  │  ├─ AIS layer (GeoJSON, WebSocket)      │ │
│  │  ├─ Weather layer (deck.gl or custom)   │ │
│  │  └─ Tide/current layer                  │ │
│  └─────────────────────────────────────────┘ │
│  Service Worker (offline PMTiles cache)      │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
   Local (boat)          Cloud (CDN)
   Go backend            Cloudflare R2
   serves PMTiles        serves PMTiles
   + SignalK bridge      + tile API
   + AIS WebSocket       + weather API
```

### Priority Order

1. **MapLibre + PMTiles + NOAA raster MBTiles** — quickest path to a working chartplotter. Use NOAA's pre-rendered raster MBTiles as the base layer. Add OpenSeaMap as an overlay. This can ship fast.
2. **S-57 vector tile pipeline** — convert NOAA ENCs to vector tiles via s57-tiler. Build the S-52 MapLibre style. This gives proper symbology, night mode, and queryable features.
3. **Offline PWA** — implement Service Worker + OPFS for storing PMTiles locally. Region download/management UI.
4. **Real-time overlays** — AIS via WebSocket, weather via Open-Meteo, tides via NOAA CO-OPS.
5. **International charts** — add LINZ, BSH, and other national sources to the pipeline.

---

## Sources

- [MapLibre GL JS GitHub](https://github.com/maplibre/maplibre-gl-js)
- [MapLibre GL JS Documentation](https://maplibre.org/maplibre-gl-js/docs/)
- [MapLibre Tile (MLT) Release Announcement](https://maplibre.org/news/2026-01-23-mlt-release/)
- [MapLibre Plugins Directory](https://maplibre.org/maplibre-gl-js/docs/plugins/)
- [State of the MapLibre Plugin Ecosystem 2025 — Geoman](https://geoman.io/blog/the-state-of-the-maplibre-plugin-ecosystem)
- [MapLibre vs Leaflet vs OpenLayers — Geoapify](https://www.geoapify.com/map-libraries-comparison-leaflet-vs-maplibre-gl-vs-openlayers-trends-and-statistics/)
- [MapLibre vs Leaflet — Jawg Blog](https://blog.jawg.io/maplibre-gl-vs-leaflet-choosing-the-right-tool-for-your-interactive-map/)
- [Vector Data Rendering Performance Analysis — MDPI](https://www.mdpi.com/2220-9964/14/9/336)
- [NOAA ENC — Electronic Navigational Charts](https://nauticalcharts.noaa.gov/charts/noaa-enc.html)
- [NOAA ENC Direct to GIS](https://nauticalcharts.noaa.gov/data/gis-data-and-services.html)
- [NOAA MBTiles Download](https://distribution.charts.noaa.gov/ncds/index.html)
- [GDAL S-57 Driver Documentation](https://gdal.org/en/stable/drivers/vector/s57.html)
- [IHO S-52 Specification](https://iho.int/uploads/user/pubs/standards/s-52/S-52%20Edition%206.1.1%20-%20June%202015.pdf)
- [S-57 to S-101 Transition — UKHO Admiralty](https://www.admiralty.co.uk/news/s-100-timelines-explained)
- [S-101 Next Generation ENCs — Admiralty](https://www.admiralty.co.uk/news/s-101-next-generation-electronic-navigational-charts-encs)
- [NOAA S-57 to S-101 Transition Plan (PDF)](https://iho.int/uploads/user/Inter-Regional%20Coordination/WEND-WG/WENDWG14/WENDWG14_2024_05.1Ac_EN_NOAA%20US%20Transition%20Plan%20S-101%2021%20November%202023.pdf)
- [From S-57 to S-100 — GeoGarage Blog](https://blog.geogarage.com/2026/01/from-s57-to-s-100-charting-smarter.html)
- [PMTiles Concepts — Protomaps Docs](https://docs.protomaps.com/pmtiles/)
- [PMTiles for MapLibre — Protomaps Docs](https://docs.protomaps.com/pmtiles/maplibre)
- [PMTiles GitHub](https://github.com/protomaps/PMTiles)
- [Martin Tile Server](https://github.com/maplibre/martin)
- [Martin Architecture Documentation](https://maplibre.org/martin/architecture/)
- [s57-tiler (Go) — GitHub](https://github.com/wdantuma/s57-tiler)
- [s57tiler (Rust) — GitHub](https://github.com/manimaul/s57tiler)
- [s57-vector-tile-server — GitHub](https://github.com/alukach/s57-vector-tile-server)
- [Freeboard-SK — GitHub](https://github.com/SignalK/freeboard-sk)
- [OpenCPN Official Site](https://www.opencpn.org/)
- [OpenSeaMap](https://map.openseamap.org/)
- [Bareboat Necessities OS](https://bareboat-necessities.github.io/my-bareboat/)
- [OpenPlotter — OpenMarine](https://openmarine.net/openplotter)
- [BridgeView AIS — GitHub](https://github.com/tmcknight/bridgeview-ais)
- [AISStream.io](https://aisstream.io/)
- [LINZ Hydrographic Data](https://www.linz.govt.nz/products-services/data/types-linz-data/hydrographic-data)
- [BSH Free Nautical Charts — freenauticalchart.net](https://www.boote-magazin.de/en/equipment/technology/navigation-free-bsh-nautical-charts-online-or-as-a-web-app/)
- [Tippecanoe — GitHub](https://github.com/mapbox/tippecanoe)
- [Build Your Own Static Vector Tile Pipeline — Geovation](https://geovation.github.io/build-your-own-static-vector-tile-pipeline)
- [deck.gl MapLibre Integration](https://deck.gl/docs/developer-guide/base-maps/using-with-maplibre)
- [WeatherLayers](https://weatherlayers.com/)
- [weather-maps (MapLibre WebGL weather) — GitHub](https://github.com/fbrosda/weather-maps)
- [Offline Maps with Protomaps in MapLibre](https://blog.wxm.be/2024/01/14/offline-map-with-protomaps-maplibre.html)
- [Web-based Nautical Charts from Open Hydrospatial Data — Cambridge](https://www.cambridge.org/core/journals/journal-of-navigation/article/webbased-nautical-charts-automated-compilation-from-open-hydrospatial-data/5F51ADFABE32658238CE4B85342E1CD2)
- [Esri Nautical Chart Symbols — GitHub](https://github.com/Esri/nautical-chart-symbols)
- [Mapping Libraries Practical Comparison — GISCarta](https://giscarta.com/blog/mapping-libraries-a-practical-comparison)
