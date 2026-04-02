# Data Source Matrix

**Date:** 2026-03-27
**Status:** Living document -- update as APIs change

Every external data source the Above Deck platform will consume. Grouped by category. Each entry covers access, cost, licensing, coverage, caching strategy, and integration risk.

---

## MVP Data Stack (Zero Cost, Minimal Signup Friction)

The minimum set of sources needed for a working product with no spend and minimal signup barriers.

| Need | Source | Cost | Signup |
|------|--------|------|--------|
| Weather (wind, pressure, precip) | Open-Meteo Weather API | Free (non-commercial) | None -- no API key |
| Waves & marine weather | Open-Meteo Marine API | Free (non-commercial) | None -- no API key |
| Tides (US) | NOAA CO-OPS | Free | None -- no API key |
| Tides (global offline) | TICON-4 harmonics + Neaps | Free | None -- static download |
| Charts (US) | NOAA ENC (S-57) | Free | None -- public download |
| Chart overlay (global) | OpenSeaMap tiles | Free | None |
| Basemap tiles | OpenFreeMap or Protomaps PMTiles | Free | None -- no API key |
| AIS (cloud) | aisstream.io | Free (beta) | GitHub login -- instant |
| AIS (local) | AIS-catcher + RTL-SDR | Free (hardware ~$30) | None |
| POI / harbours / marinas | OpenStreetMap Overpass | Free | None |
| Ports | NGA World Port Index | Free | None -- CSV download |
| Anchorages | Global Fishing Watch | Free (non-commercial) | Registration -- instant |
| Solar irradiance | PVGIS (EU JRC) | Free | None |
| Solar irradiance (historical) | NASA POWER | Free | None -- no API key |
| Ocean currents | Open-Meteo Marine API | Free | None |
| Geocoding | Nominatim | Free | None |
| Protected areas | WDPA / Protected Planet | Free | Form submission -- instant |

**Total cost: $0. Total APIs requiring signup: 3 (aisstream.io, GFW, WDPA) -- all instant self-service.**

---

## 1. Weather

### Open-Meteo Weather API

| Field | Detail |
|-------|--------|
| **Source** | Open-Meteo Weather API |
| **What it provides** | Wind, pressure, temperature, precipitation, visibility, cloud cover, humidity, CAPE, dewpoint -- global forecasts from multiple NWP models |
| **API type** | REST (JSON) |
| **Auth required** | None for non-commercial; API key for commercial plans |
| **How to get access** | No signup needed for free tier. Commercial plans available at open-meteo.com/en/pricing -- self-service, instant. |
| **Rate limits** | 600/min, 5,000/hour, 10,000/day, 300,000/month (free tier) |
| **Cost** | Free (non-commercial); paid plans for commercial use (flat monthly, not per-call) |
| **License** | CC-BY-4.0 (data from open NWP models); API terms require attribution |
| **Coverage** | Global |
| **Update frequency** | Model-dependent: GFS 4x/day, ECMWF 4x/day, ICON 4-8x/day |
| **Offline strategy** | Cache JSON responses for 1-6 hours. Pre-fetch route corridor forecasts before departure. No bulk download option. |
| **Hub or Spoke or Both** | Both -- Hub proxies and caches; Spoke pre-fetches before departure |
| **Go library** | `net/http` (simple REST JSON) |
| **Risk** | Low. Well-established, open-source project. Non-commercial restriction means a commercial pivot would require paid plan or switching to direct GRIB. |

### Open-Meteo Marine API

| Field | Detail |
|-------|--------|
| **Source** | Open-Meteo Marine API |
| **What it provides** | Wave height/direction/period, swell (primary/secondary/tertiary), wind waves, ocean currents, SST, sea level height |
| **API type** | REST (JSON) |
| **Auth required** | None for non-commercial |
| **How to get access** | No signup needed. Same terms as Weather API above. |
| **Rate limits** | Same as Weather API: 600/min, 5,000/hr, 10,000/day |
| **Cost** | Free (non-commercial); paid for commercial |
| **License** | CC-BY-4.0 |
| **Coverage** | Global oceans |
| **Update frequency** | Model-dependent; ECMWF WAM 4x/day |
| **Offline strategy** | Same as Weather API. Cache responses, pre-fetch route corridors. |
| **Hub or Spoke or Both** | Both |
| **Go library** | `net/http` |
| **Risk** | Low. Coastal tidal sea level data explicitly warned as inaccurate -- do not use for harbour tides. |

### ECMWF Open Data (Direct GRIB)

| Field | Detail |
|-------|--------|
| **Source** | ECMWF Open Data |
| **What it provides** | IFS HRES and AIFS forecasts: wind, pressure, temperature, precipitation, waves, cloud cover, radiation -- highest-quality global NWP |
| **API type** | GRIB2 file download (HTTP, S3, Azure, GCP) |
| **Auth required** | ECMWF account required even for open data. Cloud mirrors (AWS S3 `s3://ecmwf-forecasts`) require no auth. |
| **How to get access** | Self-register at ecmwf.int. Account verification is instant for open data access. Cloud mirrors need no account. **Gotcha:** You must create an ECMWF account to use the portal; cloud mirrors are the frictionless path. |
| **Rate limits** | 500 simultaneous connections to portal; no limits on cloud mirrors |
| **Cost** | Free (no data cost, no delivery cost for open subset) |
| **License** | CC-BY-4.0 (since October 2025) |
| **Coverage** | Global, 0.25 deg (~25 km) open subset; 0.1 deg (~9 km) via dissemination agreement |
| **Update frequency** | 4x daily (00, 06, 12, 18 UTC); rolling ~2-3 day archive |
| **Offline strategy** | Download GRIB2 files for route corridor. Parse and cache server-side. Files can be stored indefinitely. Regional subsets are small (wind+pressure for 10x14 deg area ~345 KB). |
| **Hub or Spoke or Both** | Hub (download, parse, serve to clients); Spoke can cache parsed data |
| **Go library** | `nilsmagnus/grib` (pure Go GRIB2 parser, zero deps) |
| **Risk** | Low. CC-BY-4.0 is irrevocable. The free 9 km delayed data planned for 2026 would be a major upgrade. |

### GFS / NOAA NOMADS

| Field | Detail |
|-------|--------|
| **Source** | NOAA GFS (Global Forecast System) |
| **What it provides** | Wind, pressure, temperature, precipitation, humidity, cloud cover -- global atmospheric forecasts. Wave data via WaveWatch III (separate GRIB). |
| **API type** | GRIB2 download (HTTPS, GRIB filter, OpenDAP); also via AWS S3 |
| **Auth required** | None (US government public domain) |
| **How to get access** | No signup. Direct HTTP download from nomads.ncep.noaa.gov. Also on AWS Open Data (S3). GRIB filter lets you subset by area/variable to reduce download size. |
| **Rate limits** | No formal limit; heavy automated access may be throttled. Fair use. |
| **Cost** | Free |
| **License** | Public domain (US government, CC0-equivalent) |
| **Coverage** | Global, 0.25 deg (~28 km) |
| **Update frequency** | 4x daily (00, 06, 12, 18 UTC); hourly out to 120h, 3-hourly to 384h (16 days) |
| **Offline strategy** | Download and cache GRIB2 files. AWS has trailing 30-day window. Can store indefinitely. |
| **Hub or Spoke or Both** | Hub (GRIB processing); also available via Open-Meteo as proxy |
| **Go library** | `nilsmagnus/grib` |
| **Risk** | Very low. US government data, decades of operational history. Cannot disappear. |

### ICON (DWD)

| Field | Detail |
|-------|--------|
| **Source** | DWD ICON (Icosahedral Nonhydrostatic) |
| **What it provides** | Wind, pressure, temperature, precipitation -- global (13 km), European (7 km), Central European (2.2 km) forecasts |
| **API type** | GRIB2 download (HTTPS directory listing); also via Open-Meteo |
| **Auth required** | None |
| **How to get access** | Direct download from opendata.dwd.de. No signup. |
| **Rate limits** | Fair use |
| **Cost** | Free |
| **License** | DWD Open Data (free for any use) |
| **Coverage** | ICON-13: Global; ICON-EU: Europe; ICON-D2: Central Europe |
| **Update frequency** | ICON-13/EU: 4x daily; ICON-D2: 8x daily |
| **Offline strategy** | Download and cache GRIB2 files. Best consumed via Open-Meteo for convenience. |
| **Hub or Spoke or Both** | Hub (via Open-Meteo or direct GRIB) |
| **Go library** | `nilsmagnus/grib` |
| **Risk** | Very low. German government data, reliable infrastructure. |

### NAM / HRRR (NOAA)

| Field | Detail |
|-------|--------|
| **Source** | NOAA NAM (North American Mesoscale) / HRRR (High Resolution Rapid Refresh) |
| **What it provides** | High-resolution (3-12 km) short-range forecasts for North America. HRRR: hourly updates, 3 km, 18-48h horizon. |
| **API type** | GRIB2 download (NOMADS); also via Open-Meteo |
| **Auth required** | None |
| **How to get access** | Direct download from nomads.ncep.noaa.gov. No signup. |
| **Rate limits** | Fair use |
| **Cost** | Free |
| **License** | Public domain (US government) |
| **Coverage** | NAM: North America; HRRR: CONUS only |
| **Update frequency** | NAM: 4x daily; HRRR: hourly |
| **Offline strategy** | Cache GRIB2 files. Best consumed via Open-Meteo. |
| **Hub or Spoke or Both** | Hub |
| **Go library** | `nilsmagnus/grib` |
| **Risk** | Very low. CONUS-only limitation. |

### Windy API

| Field | Detail |
|-------|--------|
| **Source** | Windy API |
| **What it provides** | Wind, waves, currents, pressure, temperature -- same data as Windy.com. Map Forecast (embeddable animated map) and Point Forecast (data). |
| **API type** | REST (JSON); embeddable iframe for map |
| **Auth required** | API key required |
| **How to get access** | Register at api.windy.com -- self-service. Free trial is for development only, not production. |
| **Rate limits** | Trial: limited. Paid: varies by plan. |
| **Cost** | Map Forecast: from $720/year. Point Forecast: from $720/year. Trial: free (dev only). |
| **License** | Proprietary |
| **Coverage** | Global |
| **Update frequency** | Model-dependent (ECMWF, GFS, ICON) |
| **Offline strategy** | No caching permitted under ToS. |
| **Hub or Spoke or Both** | Hub only (online) |
| **Go library** | `net/http` |
| **Risk** | High cost. ECMWF model excluded from Point Forecast due to licensing. Better to use Open-Meteo + own visualization. |

### Stormglass

| Field | Detail |
|-------|--------|
| **Source** | Stormglass |
| **What it provides** | Aggregated marine weather from ECMWF, NOAA, Met Office, DWD -- wind, waves, swell, currents, SST, visibility, tides |
| **API type** | REST (JSON) |
| **Auth required** | API key (free registration) |
| **How to get access** | Register at stormglass.io -- instant, self-service. |
| **Rate limits** | Free: 10 req/day. Paid: 500-25,000/day depending on plan. |
| **Cost** | Free: 10/day (non-commercial only). Paid: EUR 19-129/month. |
| **License** | Proprietary |
| **Coverage** | Global |
| **Update frequency** | Real-time (aggregates multiple models) |
| **Offline strategy** | Caching permitted. |
| **Hub or Spoke or Both** | Hub |
| **Go library** | `net/http` |
| **Risk** | Free tier unusable for production. Only useful as paid supplement for model comparison/validation. |

---

## 2. Tides

### NOAA CO-OPS

| Field | Detail |
|-------|--------|
| **Source** | NOAA CO-OPS (Center for Operational Oceanographic Products and Services) |
| **What it provides** | Tide predictions, observed water levels, current predictions, harmonic constituents, high/low water times -- US waters |
| **API type** | REST (JSON, XML, CSV) |
| **Auth required** | None. Provide `application=AboveDeck` parameter (requested, not enforced). |
| **How to get access** | No signup. Fully public. Just call the API. |
| **Rate limits** | Throttling applied; NOAA recommends sleep between calls. No published hard limit. ~3,000 tide stations, ~2,800 current stations. |
| **Cost** | Free |
| **License** | Public domain (US government, CC0-equivalent) |
| **Coverage** | US coastline, Great Lakes, US territories |
| **Update frequency** | Predictions: computed from harmonics (request any future date). Real-time observations: 6-minute intervals. |
| **Offline strategy** | Download harmonic constituents for all US stations and compute predictions client-side. This is the correct approach -- zero API dependency at runtime. Harmonics rarely change. |
| **Hub or Spoke or Both** | Both -- Spoke computes from bundled harmonics; Hub provides API proxy |
| **Go library** | `ryan-lang/tides` (MIT, Go harmonic prediction); `net/http` for API |
| **Risk** | Very low. Decades of operational history. Public domain. |

### TICON-4 (SHOM / GESLA)

| Field | Detail |
|-------|--------|
| **Source** | TICON-4 (Tidal Constants for Globally Distributed Coastal and Island Tide Gauges) |
| **What it provides** | Harmonic constituents (50 per station) for 4,383 global tide gauges |
| **API type** | Static data download (CSV/text files) |
| **Auth required** | None |
| **How to get access** | Free download from GESLA website. No signup, no approval. Direct link to data files. |
| **Rate limits** | N/A (static download) |
| **Cost** | Free |
| **License** | CC-BY-4.0 |
| **Coverage** | Global -- 4,383 stations across all continents |
| **Update frequency** | Periodic (based on GESLA-4 observational records); harmonics are long-term constants |
| **Offline strategy** | Bundle entire dataset into the Go server binary. ~4,400 stations of harmonic data is small. Compute all predictions locally. |
| **Hub or Spoke or Both** | Both -- bundled into Go server for local computation |
| **Go library** | `ryan-lang/tides` (for prediction engine); custom parser for TICON format |
| **Risk** | Very low. Static data, CC-BY-4.0 irrevocable. The harmonics don't change. |

### Neaps Tide Database

| Field | Detail |
|-------|--------|
| **Source** | Neaps tide-database (community project) |
| **What it provides** | Harmonic constituents for ~7,600 stations globally (3,400 NOAA + 4,200 TICON-4/GESLA-4) |
| **API type** | Static data (npm package, JSON files, SQLite) |
| **Auth required** | None |
| **How to get access** | GitHub: github.com/neaps/tide-database. npm: @neaps/tide-database. No signup. |
| **Rate limits** | N/A (static data) |
| **Cost** | Free |
| **License** | Code: MIT. Data: CC-BY-4.0. |
| **Coverage** | Global (~7,600 stations) |
| **Update frequency** | GitHub Action updates NOAA data monthly |
| **Offline strategy** | Bundle into application. Entire dataset is small enough to ship. |
| **Hub or Spoke or Both** | Both |
| **Go library** | Custom parser (JSON format); `ryan-lang/tides` for prediction |
| **Risk** | Low. Community-maintained; if abandoned, data is still valid (harmonics are stable). |

### FES2022 (AVISO / CNES)

| Field | Detail |
|-------|--------|
| **Source** | FES2022 (Finite Element Solution 2022) |
| **What it provides** | Global tidal atlas -- harmonic constituents on a 1/30 deg (~3.7 km) ocean grid. 34 constituents. Predictions at arbitrary ocean coordinates. |
| **API type** | NetCDF file download |
| **Auth required** | AVISO account required (registration at aviso.altimetry.fr) |
| **How to get access** | Self-registration at AVISO. Requires providing name, affiliation, and intended use. **Gotcha:** Commercial use requires a separate license agreement with CNES. Non-commercial/research use is free after registration. Approval is typically quick (hours to days). |
| **Rate limits** | N/A (file download) |
| **Cost** | Free for research/non-commercial. Commercial license required for commercial use (contact CNES). |
| **License** | Free for research; proprietary for commercial use |
| **Coverage** | Global ocean, 1/30 deg resolution |
| **Update frequency** | Periodic model releases (FES2014 -> FES2022). Harmonics are long-term constants. |
| **Offline strategy** | Download NetCDF grids (~2 GB). Parse and index for spatial queries. Compute predictions at any ocean coordinate. Excellent for offshore areas without tide gauges. |
| **Hub or Spoke or Both** | Hub (too large for Spoke; pre-compute and cache results) |
| **Go library** | `fhs/go-netcdf` or build NetCDF reader; prediction engine custom |
| **Risk** | Medium. Non-commercial restriction limits use if project monetizes. Less accurate near complex coastlines than station-based data. |

### UK Admiralty Tidal API (UKHO)

| Field | Detail |
|-------|--------|
| **Source** | ADMIRALTY (UK Hydrographic Office) |
| **What it provides** | Tide predictions (high/low) for UK and Ireland -- 607 stations |
| **API type** | REST (JSON) |
| **Auth required** | API key (Ocp-Apim-Subscription-Key header) via Azure API Management portal |
| **How to get access** | Register at admiraltyapi.portal.azure-api.net -- self-service, instant. **Gotcha:** Discovery (free) tier only covers ~40 ports with 7-day predictions. Foundation (GBP 144/year) covers all 607 stations. Premium (contact UKHO) adds tidal streams. |
| **Rate limits** | Discovery: 10,000 calls/month, 10 calls/sec. |
| **Cost** | Discovery: free. Foundation: GBP 144/year. Premium: contact sales. |
| **License** | Crown Copyright. **Caching explicitly prohibited** on Discovery tier. No redistribution. |
| **Coverage** | UK, Ireland, Isle of Man, Channel Islands |
| **Update frequency** | Real-time predictions |
| **Offline strategy** | **Cannot cache on free tier.** Foundation tier allows 24-hour caching only. Use TICON-4 harmonics for UK stations instead for offline. |
| **Hub or Spoke or Both** | Hub only (no caching for Spoke) |
| **Go library** | `net/http` |
| **Risk** | High. Restrictive licensing, no caching, expensive for full coverage. Use TICON-4 harmonics instead for offline UK tide predictions. |

### WorldTides

| Field | Detail |
|-------|--------|
| **Source** | WorldTides |
| **What it provides** | Global tide predictions (high/low, height curves) -- 8,000+ locations |
| **API type** | REST (JSON) |
| **Auth required** | API key (free registration, 100 credits) |
| **How to get access** | Register at worldtides.info -- instant, self-service. 100 free credits on signup (evaluation only). |
| **Rate limits** | Credit-based (1 credit = 7-day prediction for one location) |
| **Cost** | 100 free credits. Pre-paid from $9.99/20K credits. Monthly from $4.99/month. |
| **License** | Proprietary. **Caching predictions for multiple users explicitly prohibited.** |
| **Coverage** | Global (8,000+ stations) |
| **Update frequency** | On-demand predictions |
| **Offline strategy** | Station lists may be cached. Predictions cannot be cached for multiple users. Not suitable for platform use. |
| **Hub or Spoke or Both** | Hub only |
| **Go library** | `net/http` |
| **Risk** | High. No-caching restriction is hostile to a platform model. Costs scale with users. Use TICON-4/Neaps instead. |

### TideCheck

| Field | Detail |
|-------|--------|
| **Source** | TideCheck |
| **What it provides** | Global tide predictions, sunrise/sunset, moon phases -- 20,000+ stations using TICON-4 + FES2022 |
| **API type** | REST (JSON) |
| **Auth required** | API key (X-API-Key header) |
| **How to get access** | Register at tidecheck.com/developers -- instant, self-service. |
| **Rate limits** | Free: 50/day. Starter: 1,000/day. Pro: 10,000/day. Business: 50,000/day. |
| **Cost** | Free: 50/day. Paid: $9-79/month. |
| **License** | Proprietary API; underlying data from TICON-4 (CC-BY-4.0) and FES2022 |
| **Coverage** | Global (20,000+ stations) |
| **Update frequency** | On-demand predictions |
| **Offline strategy** | Caching permitted. But since it uses TICON-4/FES2022 data, better to compute locally from the same sources. |
| **Hub or Spoke or Both** | Hub |
| **Go library** | `net/http` |
| **Risk** | Medium. Useful convenience layer, but since we can access the same underlying data (TICON-4, FES2022) directly, the API is redundant. |

---

## 3. Charts

### NOAA ENC (S-57)

| Field | Detail |
|-------|--------|
| **Source** | NOAA Office of Coast Survey -- Electronic Navigational Charts |
| **What it provides** | Official US nautical charts in S-57 vector format -- depths, aids to navigation, hazards, coastline, restricted areas |
| **API type** | File download (S-57 .000 files); WMTS/WMS for raster tiles; MBTiles for offline |
| **Auth required** | None |
| **How to get access** | Download from charts.noaa.gov/ENCs/ENCs.shtml or nauticalcharts.noaa.gov. No signup. ENC Direct to GIS at encdirect.noaa.gov provides merged layers. |
| **Rate limits** | N/A (file download). WMTS/WMS: fair use. |
| **Cost** | Free |
| **License** | Public domain (US government). Cannot claim to be NOAA or present altered data as official. |
| **Coverage** | US waters (coastline, Great Lakes, territories, some Pacific islands) |
| **Update frequency** | Weekly chart updates |
| **Offline strategy** | Download entire US ENC dataset. Convert to PMTiles or render client-side from S-57. MBTiles available for offline chart display. |
| **Hub or Spoke or Both** | Both -- Spoke stores local ENC files; Hub serves tile rendering |
| **Go library** | Build S-57 parser or use GDAL via CGo; `net/http` for tile serving |
| **Risk** | Very low. US government, permanent free product. NOAA has committed to free ENC data indefinitely. |

### OpenSeaMap Tiles

| Field | Detail |
|-------|--------|
| **Source** | OpenSeaMap |
| **What it provides** | Seamark overlay tiles -- buoys, beacons, lights, depth soundings, harbours, anchorages, restricted areas |
| **API type** | Raster tile server (PNG); WMS |
| **Auth required** | None |
| **How to get access** | Tile URL: `https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png`. No signup. |
| **Rate limits** | Fair use |
| **Cost** | Free |
| **License** | Data: ODbL (OpenStreetMap). Tiles: CC-BY-SA 2.0. |
| **Coverage** | Global (community-contributed; coverage varies by region) |
| **Update frequency** | Continuous (community edits to OpenStreetMap) |
| **Offline strategy** | **Explicitly supports offline caching.** Download tiles for regions of interest. Designed for offline use on chart plotters and tablets. |
| **Hub or Spoke or Both** | Both -- cache tiles on Spoke for offline; Hub serves live |
| **Go library** | `net/http` for tile fetching |
| **Risk** | Low. ODbL share-alike requirement. Community project could slow, but data persists in OSM. |

### OpenFreeMap

| Field | Detail |
|-------|--------|
| **Source** | OpenFreeMap |
| **What it provides** | Free vector basemap tiles from OpenStreetMap -- streets, land use, water, buildings |
| **API type** | Vector tiles (MVT/PBF) served via HTTP |
| **Auth required** | None -- no API key, no registration, no cookies |
| **How to get access** | Use tile URLs directly. Styles: liberty, positron, bright. No signup whatsoever. |
| **Rate limits** | None stated. "No limits on map views or requests." |
| **Cost** | Free (donation-supported) |
| **License** | ODbL (OpenStreetMap data); BSD-3-Clause (software) |
| **Coverage** | Global |
| **Update frequency** | Regular OSM data updates |
| **Offline strategy** | Self-host via Btrfs/nginx. Or use Protomaps PMTiles for offline. |
| **Hub or Spoke or Both** | Both |
| **Go library** | N/A (served as tiles to MapLibre frontend) |
| **Risk** | Low. Donation-funded; if service stops, self-host the same data via Protomaps. |

### Protomaps / PMTiles

| Field | Detail |
|-------|--------|
| **Source** | Protomaps (PMTiles format) |
| **What it provides** | Single-file basemap tilesets from OpenStreetMap + Natural Earth. Self-hostable vector tiles with no tile server needed. |
| **API type** | PMTiles file (HTTP Range Requests -- works from any static file host or CDN) |
| **Auth required** | None |
| **How to get access** | Download planet.pmtiles (~120 GB) or regional extracts from protomaps.com. CLI tool for custom extracts. |
| **Rate limits** | N/A (self-hosted) |
| **Cost** | Free |
| **License** | BSD-3-Clause (software). ODbL (OpenStreetMap data, as Produced Works). |
| **Coverage** | Global |
| **Update frequency** | Regular builds from OSM data |
| **Offline strategy** | **This IS the offline strategy.** Download regional PMTiles file, serve from local storage via HTTP Range Requests. Perfect for Spoke deployment. |
| **Hub or Spoke or Both** | Both -- ideal for Spoke (fully offline) |
| **Go library** | `protomaps/go-pmtiles` |
| **Risk** | Very low. Self-hosted, open format, open data. No vendor dependency. |

### OpenStreetMap Raster Tiles

| Field | Detail |
|-------|--------|
| **Source** | OpenStreetMap tile servers |
| **What it provides** | Standard OSM raster basemap tiles |
| **API type** | Raster tiles (PNG) |
| **Auth required** | None. Must set valid User-Agent. |
| **How to get access** | `https://tile.openstreetmap.org/{z}/{x}/{y}.png`. Must comply with tile usage policy. |
| **Rate limits** | Strict fair-use policy. Max 2 connections. No heavy use. Bulk download prohibited. |
| **Cost** | Free |
| **License** | ODbL |
| **Coverage** | Global |
| **Update frequency** | Minutes (live OSM edits) |
| **Offline strategy** | Bulk download prohibited from OSM servers. Use Protomaps/PMTiles or self-hosted tile server instead. |
| **Hub or Spoke or Both** | Hub only (as fallback) |
| **Go library** | N/A |
| **Risk** | Medium. Strict usage policy; will be blocked if abused. Use OpenFreeMap or Protomaps instead. |

---

## 4. AIS (Automatic Identification System)

### aisstream.io

| Field | Detail |
|-------|--------|
| **Source** | aisstream.io |
| **What it provides** | Real-time global AIS vessel positions, voyage data, binary messages, SAR aircraft |
| **API type** | WebSocket (`wss://stream.aisstream.io/v0/stream`) |
| **Auth required** | API key (free, via GitHub OAuth login) |
| **How to get access** | Register at aisstream.io using GitHub login -- instant, self-service. API key provided immediately. |
| **Rate limits** | ~300 messages/sec if subscribed to entire world. Throttled at user level. |
| **Cost** | Free (beta) |
| **License** | Proprietary. Beta service -- **no SLA, no uptime guarantee.** |
| **Coverage** | Global terrestrial AIS network (gaps in remote ocean areas) |
| **Update frequency** | Real-time (seconds) |
| **Offline strategy** | Cache recent vessel positions in local database. AIS data is inherently ephemeral -- positions expire within minutes. Cache vessel identity (MMSI, name, callsign) longer. |
| **Hub or Spoke or Both** | Hub (cloud deployment) |
| **Go library** | Official Go example provided by aisstream. `gorilla/websocket` or `nhooyr/websocket`. |
| **Risk** | **High.** Beta service could add pricing, change terms, or shut down. Architecture must make AIS source pluggable. |

### AIS-catcher (Local SDR)

| Field | Detail |
|-------|--------|
| **Source** | AIS-catcher (open-source SDR receiver) |
| **What it provides** | Local AIS reception from vessels within radio range (~10-20 NM) via RTL-SDR dongle |
| **API type** | UDP/TCP NMEA sentences; HTTP API |
| **Auth required** | None (local hardware) |
| **How to get access** | Install AIS-catcher from github.com/jvde-github/AIS-catcher. Requires RTL-SDR dongle (~$30) or Airspy/HackRF. |
| **Rate limits** | N/A (local hardware) |
| **Cost** | Hardware only (~$30 for RTL-SDR dongle) |
| **License** | GPL-3.0 (software). Hardware is off-the-shelf. |
| **Coverage** | Local only -- radio line-of-sight, typically 10-20 NM |
| **Update frequency** | Real-time (seconds) |
| **Offline strategy** | **This IS the offline strategy for AIS.** No internet required. Runs on Raspberry Pi alongside the Go server. |
| **Hub or Spoke or Both** | Spoke only (on-boat hardware) |
| **Go library** | Build NMEA parser (simple text protocol); or use `adrianmo/go-nmea` |
| **Risk** | Very low. Open-source, local hardware, no cloud dependency. The correct architecture for offshore use. |

### MarineTraffic

| Field | Detail |
|-------|--------|
| **Source** | MarineTraffic (now Kpler) |
| **What it provides** | Global AIS data (terrestrial + satellite), vessel details, port calls, voyage data |
| **API type** | REST (JSON/XML) |
| **Auth required** | API key (enterprise signup) |
| **How to get access** | **No self-service.** Must contact sales. Removed credit-based system in January 2025. Enterprise-only. Acquired by Kpler. |
| **Rate limits** | Plan-dependent |
| **Cost** | Enterprise pricing (from GBP 10/month basic tracking to GBP 100+/month with satellite). API is significantly more. |
| **License** | Proprietary |
| **Coverage** | Global (terrestrial + satellite) |
| **Update frequency** | Real-time |
| **Offline strategy** | Varies by plan |
| **Hub or Spoke or Both** | Hub |
| **Go library** | `net/http` |
| **Risk** | High. Expensive, enterprise-only, vendor lock-in. Not suitable for open-source project. |

### VesselFinder

| Field | Detail |
|-------|--------|
| **Source** | VesselFinder |
| **What it provides** | AIS vessel positions, port calls, vessel particulars, route planning |
| **API type** | REST (JSON) |
| **Auth required** | API key (credit-based system) |
| **How to get access** | Register at api.vesselfinder.com -- self-service. Purchase credits. |
| **Rate limits** | Credit-based (1 credit/terrestrial position, 10 credits/satellite position). Credits expire after 12 months. |
| **Cost** | Credit-based, from EUR 330/10K credits. No free tier. |
| **License** | Proprietary |
| **Coverage** | Global (terrestrial + satellite) |
| **Update frequency** | Real-time |
| **Offline strategy** | Caching permitted within credit terms |
| **Hub or Spoke or Both** | Hub |
| **Go library** | `net/http` |
| **Risk** | Medium. Transparent pricing but not free. Credit expiry is a gotcha. |

---

## 5. Satellite Imagery

### Mapbox Satellite

| Field | Detail |
|-------|--------|
| **Source** | Mapbox Satellite |
| **What it provides** | High-resolution satellite imagery basemap tiles for anchorage assessment, reef identification, approach visualization |
| **API type** | Raster tile API |
| **Auth required** | Mapbox API key (access token) |
| **How to get access** | Register at mapbox.com -- instant, self-service, free account. |
| **Rate limits** | 100,000 requests/minute |
| **Cost** | Free: 750,000 raster tile requests/month. Paid beyond that. |
| **License** | Proprietary. **Cannot pre-download or bundle tiles.** Offline only via Mapbox SDKs (per-user, on-demand). Max 750 tile packs per user. |
| **Coverage** | Global |
| **Update frequency** | Varies by region (imagery age ranges from months to years) |
| **Offline strategy** | Offline only through official Mapbox SDKs. Cannot pre-load tiles server-side. Each user downloads their own offline regions on-demand. |
| **Hub or Spoke or Both** | Hub (online tile serving); Spoke via SDK offline download |
| **Go library** | N/A (frontend tile consumption) |
| **Risk** | Medium. Proprietary, usage limits, no bulk offline. But generous free tier. Best satellite imagery quality available for free. |

### ESRI World Imagery

| Field | Detail |
|-------|--------|
| **Source** | ESRI / ArcGIS World Imagery |
| **What it provides** | High-resolution satellite and aerial imagery basemap |
| **API type** | Raster tiles, vector tiles |
| **Auth required** | ArcGIS Developer account (free) |
| **How to get access** | Register at developers.arcgis.com -- instant, self-service, free. |
| **Rate limits** | 2,000,000 basemap tiles/month free |
| **Cost** | Free: 2M tiles/month (non-commercial with attribution). Paid beyond that. |
| **License** | Proprietary. Non-commercial use free with attribution. Must credit Esri and data providers. |
| **Coverage** | Global |
| **Update frequency** | Varies by region |
| **Offline strategy** | Export limited to 100,000 tiles. Not designed for bulk offline. |
| **Hub or Spoke or Both** | Hub |
| **Go library** | N/A (frontend tile consumption) |
| **Risk** | Medium. Generous free tier but proprietary. Non-commercial restriction. |

### Bing Maps Aerial

| Field | Detail |
|-------|--------|
| **Source** | Microsoft Bing Maps |
| **What it provides** | Aerial/satellite imagery tiles |
| **API type** | Raster tiles |
| **Auth required** | Bing Maps API key |
| **How to get access** | Register at bingmapsportal.com -- self-service, free for limited use. |
| **Rate limits** | Free: limited. Enterprise plans available. |
| **Cost** | Free tier for low-volume. Enterprise for production. |
| **License** | Proprietary |
| **Coverage** | Global |
| **Update frequency** | Varies |
| **Offline strategy** | No bulk download. Online only. |
| **Hub or Spoke or Both** | Hub |
| **Go library** | N/A |
| **Risk** | Medium. Bing Maps may be deprioritized by Microsoft. Use Mapbox or ESRI instead. |

---

## 6. POI / Ports

### OpenStreetMap Overpass API

| Field | Detail |
|-------|--------|
| **Source** | OpenStreetMap Overpass API |
| **What it provides** | Marinas, harbours, anchorages, fuel stations, seamark features, marine facilities -- queried from the full OSM database |
| **API type** | REST (JSON/XML) with Overpass QL query language |
| **Auth required** | None |
| **How to get access** | Public endpoint: overpass-api.de/api/interpreter. No signup. |
| **Rate limits** | Max 2 concurrent queries. Fair use. Heavy users should run own Overpass instance. |
| **Cost** | Free |
| **License** | ODbL (share-alike) |
| **Coverage** | Global (quality varies by region; excellent in Europe, good in US, patchy in developing nations) |
| **Update frequency** | Minutes (live OSM edits) |
| **Offline strategy** | Query and cache results. Build a local POI database from Overpass queries, updated periodically. Can also process raw OSM PBF extracts for full offline capability. |
| **Hub or Spoke or Both** | Both -- Hub builds/caches POI database; Spoke carries regional extract |
| **Go library** | `net/http` with Overpass QL; or `paulmach/osm` for PBF parsing |
| **Risk** | Low. Core OSM infrastructure. If public endpoint is overloaded, self-host Overpass. |

### NGA World Port Index

| Field | Detail |
|-------|--------|
| **Source** | NGA (National Geospatial-Intelligence Agency) World Port Index |
| **What it provides** | 3,818 world ports with 106 data fields each -- coordinates, entrance requirements, facilities, services, minimum draft |
| **API type** | CSV download; web search interface |
| **Auth required** | None |
| **How to get access** | Download UpdatedPub150.csv from msi.nga.mil/Publications/WPI. No signup. |
| **Rate limits** | N/A (file download) |
| **Cost** | Free |
| **License** | US government public domain |
| **Coverage** | Global (3,818 ports) |
| **Update frequency** | Monthly updates |
| **Offline strategy** | Download and bundle entire CSV. Small file (~2 MB). Parse and index at build time. |
| **Hub or Spoke or Both** | Both -- bundled into application |
| **Go library** | `encoding/csv` (stdlib) |
| **Risk** | Very low. US government data, stable format, decades of history. |

### Global Fishing Watch Anchorages

| Field | Detail |
|-------|--------|
| **Source** | Global Fishing Watch |
| **What it provides** | ~160,000 anchorage locations associated with ~32,000 ports, derived from vessel behavior patterns |
| **API type** | REST (JSON); dataset download |
| **Auth required** | API token (free registration) |
| **How to get access** | Register at globalfishingwatch.org -- self-service, instant. Free for non-commercial use. Commercial use requires contacting GFW. |
| **Rate limits** | Not published; fair use |
| **Cost** | Free (non-commercial) |
| **License** | CC-BY-SA 4.0. APIs are "only available for non-commercial purposes." |
| **Coverage** | Global (160K anchorages) |
| **Update frequency** | Periodic dataset releases |
| **Offline strategy** | Download dataset and bundle. CC-BY-SA allows redistribution under same license. |
| **Hub or Spoke or Both** | Both -- bundle dataset |
| **Go library** | `net/http` for API; `encoding/json` for dataset |
| **Risk** | Low. CC-BY-SA is irrevocable. Non-commercial API restriction needs confirmation for free open-source use. Contact GFW to clarify. |

---

## 7. Almanac / Cruising

### Noonsite

| Field | Detail |
|-------|--------|
| **Source** | Noonsite.com (World Cruising Club Limited) |
| **What it provides** | Country entry/exit procedures, port information, cruising formalities, regulations |
| **API type** | None (website only) |
| **Auth required** | N/A |
| **How to get access** | **Cannot use.** Fully proprietary, all rights reserved. No public API. Scraping explicitly prohibited. Would need formal licensing agreement with World Cruising Club Ltd. |
| **Rate limits** | N/A |
| **Cost** | Requires licensing agreement |
| **License** | Proprietary copyright (World Cruising Club Limited) |
| **Coverage** | Global cruising destinations |
| **Update frequency** | Ongoing editorial updates |
| **Offline strategy** | N/A |
| **Hub or Spoke or Both** | N/A |
| **Go library** | N/A |
| **Risk** | **Cannot use without licensing deal.** Factual information (visa requirements, etc.) is not copyrightable, but their specific compilation and expression is. Build our own community-sourced equivalent. |

### Navily

| Field | Detail |
|-------|--------|
| **Source** | Navily |
| **What it provides** | Marina and anchorage reviews, ratings, photos |
| **API type** | None (proprietary app) |
| **Auth required** | N/A |
| **How to get access** | **Cannot use.** All content protected by intellectual property rights. Scraping, reproducing, distributing without express written consent is prohibited. |
| **Rate limits** | N/A |
| **Cost** | N/A |
| **License** | Proprietary, all rights reserved |
| **Coverage** | Mediterranean, Europe, some Caribbean |
| **Update frequency** | Continuous (user-generated) |
| **Offline strategy** | N/A |
| **Hub or Spoke or Both** | N/A |
| **Go library** | N/A |
| **Risk** | **Cannot use.** Build our own community review system instead. |

---

## 8. Solar / Energy

### PVGIS (EU JRC)

| Field | Detail |
|-------|--------|
| **Source** | PVGIS (Photovoltaic Geographical Information System) -- European Commission Joint Research Centre |
| **What it provides** | Solar irradiance (GHI, DNI, DHI), PV energy output estimates, optimal tilt angles, monthly/hourly data, TMY (Typical Meteorological Year) |
| **API type** | REST (JSON, CSV, EPW) |
| **Auth required** | None |
| **How to get access** | No signup. Public API at re.jrc.ec.europa.eu/api/. Documentation at joint-research-centre.ec.europa.eu. **Gotcha:** CORS is blocked -- cannot call directly from browser. Must proxy via backend. |
| **Rate limits** | Overloaded requests get 529 status with 150-200ms retry delay, capped at 4-5 seconds. No published per-day limit. |
| **Cost** | Free |
| **License** | European Commission open data (free for any use) |
| **Coverage** | Europe, Africa, Asia, parts of Americas (60N to 60S roughly). Limited polar/high-latitude coverage. |
| **Update frequency** | Data covers 2005-2020 typical years. Model updates with new PVGIS versions. |
| **Offline strategy** | Cache responses aggressively -- solar irradiance at a location changes only with season, not day-to-day. One API call per location gives 12 months of data. Pre-compute and bundle for common cruising grounds. |
| **Hub or Spoke or Both** | Hub (proxy for browser); Spoke carries cached data |
| **Go library** | `net/http` |
| **Risk** | Low. EU government service, stable for 15+ years. CORS limitation requires server-side proxy. |

### NASA POWER

| Field | Detail |
|-------|--------|
| **Source** | NASA POWER (Prediction of Worldwide Energy Resources) |
| **What it provides** | Solar irradiance (GHI, DNI, DHI), temperature, wind speed, humidity, precipitation -- satellite-derived, daily/monthly/climatology |
| **API type** | REST (JSON, CSV, NetCDF) |
| **Auth required** | None |
| **How to get access** | No signup. Public API at power.larc.nasa.gov/api/. Max 20 parameters per request. |
| **Rate limits** | Throttling for repeated same-location requests. No published hard limit. Do not request at higher than native resolution (0.5 deg). |
| **Cost** | Free |
| **License** | NASA open data (free for any use) |
| **Coverage** | Global (satellite-derived, 0.5 deg resolution ~50 km) |
| **Update frequency** | Daily data available with ~1-week lag. Climatology data is long-term averages. |
| **Offline strategy** | Cache climatology data per location. One request gives decades of monthly averages. Pre-compute solar yield estimates for cruising regions. |
| **Hub or Spoke or Both** | Hub (API proxy and cache); Spoke carries cached climatology |
| **Go library** | `net/http` |
| **Risk** | Very low. NASA, decades of operational history, public domain. |

### SolarAnywhere

| Field | Detail |
|-------|--------|
| **Source** | SolarAnywhere (Clean Power Research) |
| **What it provides** | High-resolution (1 km) solar irradiance data, PV energy modeling, real-time monitoring, forecasts |
| **API type** | REST (JSON) |
| **Auth required** | License key (paid plans only) |
| **How to get access** | **No free tier.** Purchase a Sites license or Typical Year Unlimited license. Contact sales at solaranywhere.com. Free trial available for evaluation. |
| **Rate limits** | Unlimited API calls within license scope |
| **Cost** | Paid (per-site annual licenses; volume discounts at 10+ or 50+ sites) |
| **License** | Proprietary commercial |
| **Coverage** | Global (1 km resolution) |
| **Update frequency** | Real-time monitoring; historical back to 1998 |
| **Offline strategy** | Within license terms |
| **Hub or Spoke or Both** | Hub |
| **Go library** | `net/http` |
| **Risk** | High cost, not suitable for free open-source project. Use PVGIS + NASA POWER instead. |

---

## 9. Vessel Identity

### ITU MARS (Ship Station Database)

| Field | Detail |
|-------|--------|
| **Source** | ITU Maritime Mobile Access and Retrieval System (MARS) |
| **What it provides** | MMSI-to-vessel identity mapping, callsigns, flag states, ship station licenses -- 900,000+ vessels |
| **API type** | Web search interface; List V (annual publication) |
| **Auth required** | Web search is public. Bulk data access may require ITU subscription. |
| **How to get access** | Search at itu.int/online/mms/mars/ship_search.sh. **No bulk API.** List V is a paid ITU publication. Individual lookups are free via web. |
| **Rate limits** | Web interface only; no API rate limits documented |
| **Cost** | Web search: free. List V bulk data: paid (ITU publication). |
| **License** | ITU data; redistribution restrictions apply to List V |
| **Coverage** | Global (all registered maritime mobile stations) |
| **Update frequency** | Continuous (as administrations report) |
| **Offline strategy** | Cannot bulk download. Cache individual lookups. Build local MMSI database from AIS data received (vessels self-report identity in AIS messages). |
| **Hub or Spoke or Both** | Hub (cache lookups); Spoke builds from received AIS |
| **Go library** | `net/http` (scrape search) or build from AIS data |
| **Risk** | Medium. No proper API. Build vessel identity database from AIS message types 5 and 24 (static data reports) instead. |

### FCC ULS (US Vessels)

| Field | Detail |
|-------|--------|
| **Source** | FCC Universal Licensing System |
| **What it provides** | US ship station licenses, MMSI assignments, vessel details for US-flagged vessels |
| **API type** | Bulk download (weekly); web search |
| **Auth required** | None |
| **How to get access** | Bulk download from wireless2.fcc.gov. Web search at fcc.gov. No signup. |
| **Rate limits** | N/A (bulk download) |
| **Cost** | Free |
| **License** | US government public domain |
| **Coverage** | US-flagged vessels only |
| **Update frequency** | Weekly bulk updates |
| **Offline strategy** | Download and index the full database. Small enough to bundle. |
| **Hub or Spoke or Both** | Hub |
| **Go library** | `encoding/csv` |
| **Risk** | Very low. US government data. |

---

## 10. Ocean Currents

### OSCAR (NASA/PO.DAAC)

| Field | Detail |
|-------|--------|
| **Source** | OSCAR (Ocean Surface Current Analyses Real-time) -- NASA JPL/PO.DAAC |
| **What it provides** | Global ocean surface currents (speed and direction) -- 0.25 deg grid, daily averaged, top 30m of ocean |
| **API type** | NetCDF download via PO.DAAC; OGC API Coverages via Harmony; S3 access |
| **Auth required** | NASA Earthdata account required |
| **How to get access** | Register at urs.earthdata.nasa.gov -- self-service, instant. Use `podaac-data-subscriber` Python tool for bulk download. **Gotcha:** S3 access requires Earthdata login token. |
| **Rate limits** | Fair use for downloads |
| **Cost** | Free |
| **License** | NASA open data (free for any use) |
| **Coverage** | Global ocean, 0.25 deg, from 1993 to present |
| **Update frequency** | NRT: ~2-day latency. Interim: ~1-month latency. Final: ~1-year latency. |
| **Offline strategy** | Download NetCDF files for regions of interest. Pre-compute current vectors for route corridors. Files are moderate size. |
| **Hub or Spoke or Both** | Hub (download and process); serve processed data to clients |
| **Go library** | `fhs/go-netcdf` or build NetCDF reader; `net/http` for API |
| **Risk** | Low. NASA data, long operational history. Requires Earthdata account but signup is instant and free. |

### Copernicus CMEMS

| Field | Detail |
|-------|--------|
| **Source** | Copernicus Marine Environment Monitoring Service (CMEMS) |
| **What it provides** | Ocean currents, temperature, salinity, sea level, biogeochemistry -- high-resolution global ocean models |
| **API type** | OPeNDAP, ERDDAP, Copernicus Marine Toolbox (Python CLI); NetCDF download |
| **Auth required** | Copernicus Marine account required |
| **How to get access** | Register at marine.copernicus.eu -- self-service, free. Requires name and affiliation. Approval is instant. |
| **Rate limits** | Fair use for downloads |
| **Cost** | Free |
| **License** | Copernicus data policy (free and open for any use, including commercial) |
| **Coverage** | Global ocean (multiple products at various resolutions from 1/12 deg to 1/4 deg) |
| **Update frequency** | Daily to weekly depending on product |
| **Offline strategy** | Download NetCDF for regions of interest. CMEMS Toolbox allows subsetting by area/time/depth. Cache processed current data. |
| **Hub or Spoke or Both** | Hub (download and process) |
| **Go library** | `fhs/go-netcdf`; build custom downloader |
| **Risk** | Low. EU Copernicus programme, long-term funded. Free and open data policy. More comprehensive than OSCAR but harder to integrate. |

### Open-Meteo Marine (Ocean Currents)

| Field | Detail |
|-------|--------|
| **Source** | Open-Meteo Marine API (ocean current layer) |
| **What it provides** | Ocean current velocity and direction from MeteoFrance SMOC model |
| **API type** | REST (JSON) |
| **Auth required** | None |
| **How to get access** | Same as Open-Meteo Marine API above. No signup. |
| **Rate limits** | Same as Open-Meteo (10,000/day free) |
| **Cost** | Free (non-commercial) |
| **License** | CC-BY-4.0 |
| **Coverage** | Global ocean, ~8 km resolution |
| **Update frequency** | Model-dependent |
| **Offline strategy** | Cache responses for route corridors |
| **Hub or Spoke or Both** | Both |
| **Go library** | `net/http` |
| **Risk** | Low. Simplest integration path for MVP. For higher accuracy, supplement with OSCAR or CMEMS. Coastal accuracy limited. |

---

## 11. Hazards

### NGA NAVAREA Warnings

| Field | Detail |
|-------|--------|
| **Source** | NGA Maritime Safety Information |
| **What it provides** | NAVAREA IV, XII broadcast warnings -- hazards to navigation, distress, military exercises, environmental events |
| **API type** | Web interface at msi.nga.mil; no official public REST API |
| **Auth required** | None for web access |
| **How to get access** | Browse at msi.nga.mil/NavWarnings. Scrape or use third-party API (SeaLagom offers paid API with 100 free requests). |
| **Rate limits** | N/A (web scraping); SeaLagom: 100 free, then paid |
| **Cost** | Free (web); SeaLagom API: freemium |
| **License** | US government public domain (the warning data itself) |
| **Coverage** | Global (NAVAREA system covers all ocean areas) |
| **Update frequency** | Real-time (as warnings are issued) |
| **Offline strategy** | Cache active warnings. Download daily. Warnings have defined validity periods. |
| **Hub or Spoke or Both** | Hub (scrape/fetch and distribute) |
| **Go library** | `net/http` + HTML parser (`goquery`) for scraping; or SeaLagom API |
| **Risk** | Medium. No official API means scraping is fragile. NGA could change page structure. SeaLagom is a small third-party service. |

### NOAA Weather Alerts (Marine)

| Field | Detail |
|-------|--------|
| **Source** | NOAA National Weather Service -- Marine Alerts |
| **What it provides** | Gale warnings, storm warnings, hurricane warnings, special marine warnings, coastal flood advisories |
| **API type** | REST (JSON); CAP (Common Alerting Protocol) XML; GeoJSON |
| **Auth required** | None |
| **How to get access** | API at api.weather.gov/alerts. No signup. Set User-Agent header. |
| **Rate limits** | Fair use. No published limit. |
| **Cost** | Free |
| **License** | Public domain (US government) |
| **Coverage** | US coastal and offshore waters |
| **Update frequency** | Real-time (as warnings are issued) |
| **Offline strategy** | Cache active alerts. Poll every 5-15 minutes. Alerts have defined expiry times. |
| **Hub or Spoke or Both** | Both -- Hub polls and caches; Spoke receives via sync |
| **Go library** | `net/http` |
| **Risk** | Very low. NOAA, decades of operational history. |

### WDPA / Protected Planet (Marine Protected Areas)

| Field | Detail |
|-------|--------|
| **Source** | WDPA (World Database on Protected Areas) via Protected Planet API |
| **What it provides** | 260,000+ protected areas across 245 countries -- boundaries, management categories, designation types |
| **API type** | REST (JSON); bulk download (Shapefile, GeoJSON) |
| **Auth required** | API token (free, via form submission) |
| **How to get access** | Submit form at api.protectedplanet.net/request. Instant approval. **Note:** API v3 being retired May 2026 -- migrate to v4. |
| **Rate limits** | Not published; fair use |
| **Cost** | Free |
| **License** | WDPA Terms of Use (free for non-commercial; commercial requires permission from UNEP-WCMC) |
| **Coverage** | Global |
| **Update frequency** | Monthly |
| **Offline strategy** | Download bulk Shapefile and bundle. Convert to GeoJSON for overlay. Update monthly. |
| **Hub or Spoke or Both** | Both -- bundle simplified marine protected area boundaries |
| **Go library** | `net/http` for API; Shapefile parser for bulk data |
| **Risk** | Low. UN-backed database. API versioning changes (v3->v4 transition). Non-commercial restriction for detailed use. |

### Static Hazard Datasets

| Field | Detail |
|-------|--------|
| **Source** | Various -- community-maintained GeoJSON |
| **What it provides** | Piracy zones (Gulf of Guinea, Malacca, Gulf of Aden, Red Sea), orca interaction zones (Iberian coast), shipping lane overlays |
| **API type** | Static GeoJSON files |
| **Auth required** | None |
| **How to get access** | Shipping lanes: github.com/newzealandpaul/Shipping-Lanes. Orca zones: compiled from Orca Iberica reports. Piracy: compiled from ICC-IMB visual data. |
| **Rate limits** | N/A |
| **Cost** | Free |
| **License** | Varies (shipping lanes: public GitHub; orca/piracy: community compilation) |
| **Coverage** | Regional (specific hazard areas) |
| **Update frequency** | Manual (community-updated as situations change) |
| **Offline strategy** | Bundle GeoJSON files into application. Tiny file sizes. |
| **Hub or Spoke or Both** | Both |
| **Go library** | `encoding/json`; GeoJSON parsing |
| **Risk** | Low. Static data, minimal dependency. Requires manual curation to stay current. |

---

## 12. Geocoding

### Nominatim (OpenStreetMap)

| Field | Detail |
|-------|--------|
| **Source** | Nominatim (OpenStreetMap geocoder) |
| **What it provides** | Forward and reverse geocoding from OpenStreetMap data -- place names to coordinates and back |
| **API type** | REST (JSON, XML) |
| **Auth required** | None. Must provide valid User-Agent or HTTP Referer. |
| **How to get access** | Public endpoint: nominatim.openstreetmap.org. No signup. |
| **Rate limits** | **Strict: 1 request per second.** No bulk geocoding. Auto-complete searches banned (will result in block). Must cache results. |
| **Cost** | Free |
| **License** | ODbL (data); results must be attributed and shared alike |
| **Coverage** | Global |
| **Update frequency** | Near real-time (OSM edits) |
| **Offline strategy** | Cache all results. For heavy use, self-host Nominatim (requires ~100 GB disk for planet import). |
| **Hub or Spoke or Both** | Hub (with aggressive caching); or self-host |
| **Go library** | `net/http` |
| **Risk** | Medium. Strict rate limits; will be blocked if policy violated. Self-hosting is the safe path for production. |

### Photon (Komoot)

| Field | Detail |
|-------|--------|
| **Source** | Photon (open-source geocoder by Komoot) |
| **What it provides** | Forward geocoding with typo tolerance, built on OpenStreetMap + Elasticsearch |
| **API type** | REST (JSON) |
| **Auth required** | None (public instance); none (self-hosted) |
| **How to get access** | Public instance: photon.komoot.io. Self-host from github.com/komoot/photon. No signup for either. |
| **Rate limits** | Public: 1 req/sec default, heavy use throttled/banned. Self-hosted: **no limits.** |
| **Cost** | Free |
| **License** | Apache-2.0 (software); ODbL (data) |
| **Coverage** | Global (OpenStreetMap data) |
| **Update frequency** | Public instance: regular updates. Self-hosted: on your update schedule. |
| **Offline strategy** | **Self-host for unlimited offline geocoding.** Download pre-built index (~40 GB for planet). |
| **Hub or Spoke or Both** | Hub (self-hosted instance) |
| **Go library** | `net/http` |
| **Risk** | Very low when self-hosted. Public instance has same risks as Nominatim. Self-hosting eliminates all rate limit concerns. |

---

## Summary: Risk Assessment

### Lowest Risk (Government/Open Data -- Cannot Disappear)

- NOAA CO-OPS, NOAA ENC, NOAA Weather Alerts, GFS/NAM/HRRR
- ECMWF Open Data (CC-BY-4.0 irrevocable)
- NGA World Port Index
- NASA POWER, OSCAR
- DWD ICON
- TICON-4 (CC-BY-4.0, static harmonics)
- OpenStreetMap / OpenSeaMap (ODbL, community-governed)
- Protomaps / PMTiles (self-hosted, open format)
- PVGIS (EU JRC)

### Medium Risk (Free Tiers Could Change)

- Open-Meteo (well-established but non-commercial restriction)
- aisstream.io (beta, no SLA -- **architect for pluggability**)
- Global Fishing Watch (non-commercial API restriction)
- Mapbox Satellite (proprietary, generous free tier)
- ESRI World Imagery (proprietary, generous free tier)
- Nominatim (strict rate limits -- self-host for safety)
- WDPA (API version transitions)
- Copernicus CMEMS (EU-funded, stable but complex access)

### High Risk (Expensive, Proprietary, or Restrictive)

- MarineTraffic (enterprise-only, expensive, acquired by Kpler)
- VesselFinder (credit-based, no free tier)
- Windy API ($720/year minimum)
- Stormglass (10/day free, useless for production)
- WorldTides (no caching permitted, credit costs scale)
- UK Admiralty (no caching on free tier, Crown Copyright)
- SolarAnywhere (no free tier, paid per-site)
- Noonsite (cannot use -- proprietary)
- Navily (cannot use -- proprietary)

### Architecture Principle

Every data source should be behind an interface in the Go server. If aisstream.io disappears tomorrow, swap in another `AISProvider`. If Open-Meteo adds pricing, switch to direct GRIB download from NOAA/ECMWF. The MVP stack above uses zero paid services and requires only three instant self-service signups.
