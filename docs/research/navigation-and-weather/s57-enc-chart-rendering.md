# S-57 ENC Chart Rendering in MapLibre GL JS

Research date: 2026-03-27

## Executive Summary

Rendering S-57 nautical charts in MapLibre GL JS is technically feasible but requires building a multi-stage pipeline. No production-ready, end-to-end open-source solution exists today. The pipeline is: **S-57 files → GDAL/ogr2ogr → GeoJSON → Tippecanoe → PMTiles/MBTiles → MapLibre GL JS + custom S-52 style JSON**. The hardest unsolved problem is S-52 symbology — no one has published a complete MapLibre style sheet for nautical charts.

---

## 1. S-57 to Vector Tile Pipeline

### The Pipeline (proven, viable)

```
S-57 (.000 files)
    → GDAL/ogr2ogr (extract layers as GeoJSON)
    → Tippecanoe (convert GeoJSON → MVT/PMTiles)
    → MapLibre GL JS (render with custom style JSON)
```

### GDAL S-57 Driver

- **Status**: Built-in, read-only support. Mature and stable.
- **How it works**: S-57 files produce layers by geometry type (Point, Line, Area) plus metadata layers (DSID, Meta). Each S-57 object class maps to OGR features with attributes.
- **Key command**: `ogr2ogr -f GeoJSON output-Area.json input.000 Area -lco RFC7946=YES -skipfailures`
- **Gotcha**: Each geometry type must be exported separately (GeoJSON limitation). You need multiple passes per .000 file.
- **Dependencies**: Requires `s57objectclasses.csv` and `s57attributes.csv` at runtime (ships with GDAL).
- **S-63 support**: None. Only unencrypted S-57.

### Tippecanoe → PMTiles

- Tippecanoe v2.17+ supports direct PMTiles output.
- PMTiles is ideal for Above Deck — single file, works from static storage (S3/CDN), no tile server needed.
- Pipeline: `ogr2ogr` → GeoJSON → `tippecanoe --output=charts.pmtiles`

### Existing Tools

| Project | Language | Status | Notes |
|---------|----------|--------|-------|
| [s57-tiler](https://github.com/wdantuma/s57-tiler) | Go | Early (16 commits, 9 stars) | Built for SignalK/freeboard-sk. Uses GDAL. Docker available. No S-63, no S-52. |
| [s57tiler](https://github.com/manimaul/s57tiler) | Rust | Proof of concept (abandoned) | GDAL → GeoJSON → Tippecanoe → MBTiles → tileserver-gl. Has basic Maputnik styling. Developer moved to closed-source openenc.com. |
| [BAUV-Maps](https://github.com/kaaninan/BAUV-Maps) | Node.js | Early (22 commits) | TileServer-GL based. Handles sprites for symbols. |
| [SMAC-M](https://github.com/LarsSchy/SMAC-M) | Python | Most complete S-52 attempt | S-57 → shapefiles → MapServer WMS. Implements simplified S-52 symbology. Not vector tiles, but the symbology mapping logic is reusable reference. |

### Assessment

**The data conversion pipeline is solved.** GDAL reads S-57 reliably. Tippecanoe produces PMTiles. The gap is not in the plumbing — it's in the symbology layer (see section 2).

**Recommended approach for Above Deck**: Write a Go CLI tool that:
1. Reads S-57 .000 files via GDAL C bindings (or shells out to ogr2ogr)
2. Produces GeoJSON with S-57 object class and attribute metadata preserved
3. Pipes to Tippecanoe for PMTiles output
4. Runs as a batch job against NOAA ENC downloads

---

## 2. S-52 Symbology in MapLibre

### The Problem

S-52 (IHO Presentation Library) defines how every S-57 object class should be rendered: colors, symbols, line styles, fill patterns, text placement, and conditional symbology rules. There are approximately 200-300 distinct rendering rules.

**No one has published a complete S-52 MapLibre/Mapbox style JSON.**

### What S-52 Defines

- **Color palettes**: Day, Dusk, Night modes with named color tokens (e.g., DEPVS=131:184:224 for shallow water, LANDA=211:187:121 for land)
- **Point symbols**: ~150 SVG symbols for buoys, lights, wrecks, anchorages, etc.
- **Line patterns**: Dashed lines for depth contours, traffic separation schemes, cables
- **Area fills**: Pattern fills for restricted areas, depth zones, land types
- **Conditional symbology (CS)**: Complex rules like "if depth < X, show in red" or light sector rendering
- **Text placement**: Sounding depths, feature names, light characteristics

### Reference Implementations

| Source | Format | Usefulness |
|--------|--------|------------|
| [OpenCPN s52plib](https://github.com/OpenCPN/OpenCPN/tree/master/libs/s52plib) | C++ / chartsymbols.xml | Most complete open-source S-52 implementation. XML-based symbol definitions + C++ conditional symbology. Can be parsed to generate MapLibre style rules. |
| [SMAC-M](https://github.com/LarsSchy/SMAC-M) | Python / MapServer mapfiles | Simplified S-52 → MapServer style mapping. Good reference for which object classes need which styling. |
| [s57tiler Maputnik styles](https://github.com/manimaul/s57tiler) | Mapbox GL style JSON | Basic proof-of-concept styling for a handful of feature types. Not S-52 compliant. |
| [Esri nautical-chart-symbols](https://github.com/Esri/nautical-chart-symbols) | ArcGIS symbology config | INT1 chart symbols for ArcGIS Maritime. Proprietary format but documents the symbol mappings. |
| [IHO S-52 Presentation Library Ed 4.0](https://iho.int/uploads/user/pubs/standards/s-52/) | PDF specification | The authoritative source. Defines every rule. |

### Implementation Strategy for Above Deck

The realistic approach is **progressive S-52 implementation**:

**Phase 1 — Functional chart (weeks)**:
- Depth areas (DEPARE) colored by depth zone using S-52 color tokens
- Land areas (LNDARE) in land color
- Coastline (COALNE) as solid lines
- Depth contours (DEPCNT) as dashed lines
- Soundings (SOUNDG) as text labels
- Basic navigation aids (BOYSPP, BCNSPP) as circle markers

**Phase 2 — Navigational features (months)**:
- Buoy and beacon symbols (SVG sprites)
- Light sectors and characteristics
- Traffic separation schemes
- Restricted/prohibited areas
- Cables and pipelines

**Phase 3 — Full compliance (significant effort)**:
- Conditional symbology (CS rules)
- Day/Dusk/Night color palettes
- Complete symbol library (~150 symbols)
- Text placement rules
- All S-52 display categories (Base, Standard, Other)

### Technical Implementation

MapLibre style JSON can handle this through:
- **fill-color expressions**: Data-driven styling based on `DRVAL1`/`DRVAL2` attributes for depth zones
- **sprite sheets**: SVG symbols compiled into a sprite atlas for point features
- **line-dasharray**: For depth contours and other patterned lines
- **symbol-placement**: For text labels along lines
- **filter expressions**: For conditional rendering based on S-57 attributes

Example depth zone styling:
```json
{
  "id": "depth-areas",
  "type": "fill",
  "source": "enc",
  "source-layer": "DEPARE",
  "paint": {
    "fill-color": [
      "step", ["get", "DRVAL1"],
      "#9bcfff",
      0, "#c0dfff",
      5, "#d4e9ff",
      10, "#e6f1ff",
      20, "#f0f6ff",
      50, "#f8faff"
    ]
  }
}
```

---

## 3. S-63 Encrypted Charts

### How S-63 Works

- **Encryption**: Blowfish cipher in ECB mode with 40-bit keys
- **Licensing**: Each software installation gets a Hardware ID (HW_ID, 5-char hex string). Data servers encrypt cell keys with the HW_ID and package them as "cell permits" with expiration dates.
- **Decryption flow**: Cell permit → extract cell key using HW_ID → decrypt S-57 data with Blowfish
- **Integrity**: CRC32 checksums + SHA-1 hashing

### Open Source Options

| Project | Language | Status |
|---------|----------|--------|
| [s63lib](https://github.com/pavelpasha/s63lib) | C/C++ | 20 stars, last active 2021. Functional but unmaintained. Not production-ready. |
| OpenCPN S-63 plugin | C++ | Delegates to external o-charts.org service for the commercial/licensing parts. |

### Legal/Practical Considerations

- **The cryptography is simple** (Blowfish, CRC32) and can be implemented in Go trivially.
- **The hard part is licensing**: You must be an IHO-registered OEM to receive manufacturer keys and participate in the cell permit ecosystem. This is a business relationship, not a technical problem.
- **For Above Deck**: S-63 is needed for non-US waters (UK ADMIRALTY, PRIMAR, IC-ENC charts). This is a Phase 2+ concern. NOAA US charts are free and unencrypted.
- **Recommendation**: Defer S-63 until the project has traction. When ready, register with IHO as an OEM and implement the decryption in Go (the crypto is straightforward).

---

## 4. S-101 (Next Generation)

### Status

- **S-101** is the successor to S-57, part of the S-100 framework.
- **Encoding**: Still uses ISO 8211 at the low level (like S-57) but with a new data model, new feature catalogue, and new portrayal catalogue.
- **GDAL support**: **None.** No S-101 driver exists in GDAL as of March 2026. The GDAL community has discussed it since 2018 but no one has built it.
- **IMO timeline**: S-100 ECDIS legal for use from January 1, 2026. Mandatory for new systems by January 1, 2029. Full S-57 replacement estimated ~10 years (mid-2030s).
- **NOAA timeline**: Dual S-57/S-101 production starting 2026. S-57 will continue to be produced for the foreseeable future.

### Implications for Above Deck

- **S-57 is safe to build on** for at least 5-8 more years.
- S-101 adoption will be slow — the maritime industry moves conservatively.
- When S-101 support is needed, GDAL will likely have a driver by then (or the project can contribute one).
- The vector tile pipeline architecture is format-agnostic — swapping the input parser from S-57 to S-101 won't require rearchitecting.

---

## 5. Existing Open-Source Projects

### Most Relevant to Above Deck

**[SignalK freeboard-sk](https://github.com/SignalK/freeboard-sk) + [s57-tiler](https://github.com/wdantuma/s57-tiler)**
- Closest to what Above Deck needs. OpenLayers-based chartplotter that renders S-57 vector tiles.
- s57-tiler is Go-based, aligns with Above Deck's Go backend preference.
- Supports MVT/PBF and PMTiles.
- No S-52 symbology — basic styling only.
- **Viability**: Good starting point for the data pipeline. Style layer needs to be built from scratch.

**[OpenSeaMap-vector](https://github.com/k-yle/OpenSeaMap-vector)**
- Uses MapLibre + PMTiles. TypeScript. Early prototype.
- Data source is OpenStreetMap `seamark:*` tags, NOT S-57 official charts.
- Client-side SVG rendering for navigation marks via `navmark-renderer`.
- **Viability**: Good reference for MapLibre integration patterns and SVG symbol rendering approach. Wrong data source for our needs.

**[SMAC-M](https://github.com/LarsSchy/SMAC-M)**
- Most complete open-source S-52 symbology mapping (simplified).
- Python + GDAL + MapServer. Not vector tiles.
- **Viability**: Excellent reference for building S-52 style rules. The Python logic for mapping S-57 object classes to rendering rules can inform our MapLibre style JSON.

**[OpenCPN](https://github.com/OpenCPN/OpenCPN)**
- Gold standard for open-source S-52 rendering. Desktop C++ application.
- `libs/s52plib/` contains the full presentation library implementation.
- `chartsymbols.xml` defines all symbols in parseable XML.
- **Viability**: Not directly usable in a web context, but the symbology definitions and conditional rules are the most complete open-source reference available.

---

## 6. NOAA ENC Data Access

### Download Sources

- **Primary**: https://charts.noaa.gov/ENCs/ENCs.shtml
- **Bulk downloads**: Available by region, state, Coast Guard district, or complete set
- **Programmatic**: XML product catalog enables automated downloads
- **REST API**: `https://gis.charttools.noaa.gov/arcgis/rest/services/MCS/ENCOnline/MapServer/exts/MaritimeChartService`
- **GIS Portal**: https://encdirect.noaa.gov/ (ENC Direct to GIS — non-navigational use)

### Download Sizes

| Package | Size |
|---------|------|
| All US ENCs | ~752 MB |
| Ten days of updates | ~33 MB |
| One week of updates | ~24 MB |
| Daily update | ~7 MB |

### Update Frequency

- **Daily** (Monday-Friday) as of recent changes. Previously weekly.
- Includes Notice to Mariners corrections, new survey data, and critical changes.

### Coverage

- Complete US coastal waters, harbors, approaches, and inland waterways
- Organized by navigational purpose (Overview, General, Coastal, Approach, Harbour, Berthing)
- Free and unencrypted (S-57 format, no S-63)

### Recommended Approach for Above Deck

1. **Initial**: Download full US ENC set (~752 MB), process once to PMTiles
2. **Updates**: Daily differential downloads (~7 MB), reprocess affected cells
3. **Storage**: Host PMTiles on S3/CDN (static file, no tile server needed)
4. **Go tool**: Automate download + conversion pipeline as a Go CLI

---

## 7. Recommended Architecture for Above Deck

```
┌─────────────────────────────────────────────────────┐
│                   Build Pipeline (Go CLI)             │
│                                                       │
│  NOAA ENC (.000)                                     │
│       │                                               │
│       ▼                                               │
│  GDAL ogr2ogr  ──→  GeoJSON (per layer/object class)│
│       │                                               │
│       ▼                                               │
│  Tippecanoe   ──→  PMTiles (single file)             │
│       │                                               │
│       ▼                                               │
│  S3 / CDN (static hosting)                           │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│              Browser (MapLibre GL JS)                │
│                                                       │
│  PMTiles source  ──→  Vector tiles                   │
│       │                                               │
│       ▼                                               │
│  S-52 Style JSON  ──→  Rendered chart                │
│       │                                               │
│       ▼                                               │
│  SVG Sprite Sheet  ──→  Navigation symbols           │
│       │                                               │
│       ▼                                               │
│  Day/Dusk/Night themes                               │
└─────────────────────────────────────────────────────┘
```

### Key Technical Decisions

1. **PMTiles over MBTiles**: No tile server needed. Single file on CDN. MapLibre has a PMTiles protocol plugin.
2. **Go for the pipeline**: Aligns with project stack. GDAL has Go bindings via `github.com/lukeroth/gdal`. Alternatively, shell out to `ogr2ogr` and `tippecanoe` CLI tools.
3. **Progressive S-52**: Start with depth zones + coastline + soundings. Add symbols incrementally.
4. **Day/Night palettes**: Maps directly to Above Deck's dark-mode-first design. S-52 Night palette uses similar deep navy backgrounds.

### Effort Estimate

| Component | Effort | Risk |
|-----------|--------|------|
| S-57 → PMTiles pipeline (Go CLI) | 1-2 weeks | Low — proven tools |
| Basic chart rendering (depth zones, coastline, land) | 1 week | Low |
| Navigation symbol sprite sheet (~50 common symbols) | 2-3 weeks | Medium — manual SVG work |
| Conditional symbology (light sectors, complex rules) | 4-8 weeks | High — S-52 spec is dense |
| S-63 decryption (non-US charts) | 2-3 weeks coding, unknown for IHO OEM registration | Medium-High |
| Full S-52 compliance | 3-6 months | High — diminishing returns |

### What to Build vs. What to Borrow

- **Build**: Go pipeline tool, S-52 MapLibre style JSON, SVG sprite sheet
- **Borrow**: GDAL (S-57 parsing), Tippecanoe (tile generation), PMTiles (format), OpenCPN's chartsymbols.xml (symbol definitions)
- **Defer**: S-63, S-101, full S-52 compliance

---

## Sources

- [s57-tiler (Go, SignalK)](https://github.com/wdantuma/s57-tiler)
- [s57tiler (Rust, proof of concept)](https://github.com/manimaul/s57tiler)
- [BAUV-Maps](https://github.com/kaaninan/BAUV-Maps)
- [SMAC-M (S-52 symbology reference)](https://github.com/LarsSchy/SMAC-M)
- [OpenCPN S-52 Presentation Library](https://github.com/OpenCPN/OpenCPN/tree/master/libs/s52plib)
- [OpenSeaMap-vector (MapLibre + PMTiles)](https://github.com/k-yle/OpenSeaMap-vector)
- [SignalK freeboard-sk](https://github.com/SignalK/freeboard-sk)
- [s63lib (C/C++ S-63 decryption)](https://github.com/pavelpasha/s63lib)
- [Esri nautical-chart-symbols](https://github.com/Esri/nautical-chart-symbols)
- [S-63 encryption explained](https://heathhenley.dev/posts/how-does-s63-enc-format-work/)
- [NOAA ENC downloads](https://charts.noaa.gov/ENCs/ENCs.shtml)
- [NOAA S-100 transition](https://marinenavigation.noaa.gov/s100.html)
- [NOAA S-57 to S-101 transition plan (PDF)](https://iho.int/uploads/user/Inter-Regional%20Coordination/WEND-WG/WENDWG14/WENDWG14_2024_05.1Ac_EN_NOAA%20US%20Transition%20Plan%20S-101%2021%20November%202023.pdf)
- [IHO S-52 Presentation Library](https://iho.int/uploads/user/pubs/standards/s-52/)
- [GDAL S-57 driver](https://gdal.org/drivers/vector/s57.html)
- [GDAL PMTiles driver](https://gdal.org/en/stable/drivers/vector/pmtiles.html)
- [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/)
- [Tippecanoe](https://github.com/felt/tippecanoe)
- [PMTiles](https://github.com/protomaps/PMTiles)
- [S-101 adoption: Brazil milestone](https://www.hydro-international.com/content/article/brazil-achieves-a-milestone-in-digital-nautical-cartography-with-the-production-of-its-first-s-101-enc)
- [GeoGarage S-101 overview](https://blog.geogarage.com/2025/02/s-101-next-generation-of-electronic.html)
