# Marine Data APIs & Sources

**Date:** 2026-03-08

All sources evaluated for an open-source, free sailing route planner.

---

## Recommended Architecture

### Tier 1 - Core (all free)
| Need | Source | Cost |
|------|--------|------|
| Basemap | Mapbox GL JS (50k loads/mo) or MapLibre GL JS (unlimited) | Free |
| Seamark overlay | OpenSeaMap tiles | Free |
| Weather | Open-Meteo Marine API | Free (10k calls/day) |
| Tides | Neaps tide-database (offline harmonics, 7,600 stations) | Free |
| Harbours/Marinas | OpenStreetMap Overpass API | Free |
| Charts (US) | NOAA WMTS/WMS | Free |
| Protected areas | WDPA API | Free |
| Shipping lanes | GitHub dataset + OSM Overpass | Free |

### Tier 2 - Supplementary
| Need | Source | Cost |
|------|--------|------|
| Tides (US real-time) | NOAA CO-OPS API | Free |
| Tides (UK) | ADMIRALTY Discovery API | Free (10k req/mo) |
| AIS | AISStream.io WebSocket | Free |
| Piracy zones | Static GeoJSON from IMB data | Free |
| Orca zones | Static GeoJSON, community-updated | Free |
| Shark data | GSAF OpenDataSoft API | Free |
| Anchorage patterns | Global Fishing Watch API | Free |

### Tier 3 - Nice to have
| Need | Source | Cost |
|------|--------|------|
| Weather validation | Stormglass.io | Free (10 req/day) |
| Offline charts | NOAA ENC MBTiles download | Free |

---

## Detailed API Reference

### 1. Weather - Open-Meteo Marine API (PRIMARY)

**Endpoint:** `https://marine-api.open-meteo.com/v1/marine`
**Auth:** No API key required (non-commercial)
**Rate limits:** 600/min, 5,000/hour, 10,000/day, 300,000/month
**Forecast range:** Up to 16 days
**Resolution:** 5 km (Europe), 9 km (global ECMWF WAM), 25 km (multiple models)
**Format:** JSON

**Hourly variables:**
- `wave_height`, `wave_direction`, `wave_period`, `wave_peak_period`
- `wind_wave_height/direction/period/peak_period`
- `swell_wave_height/direction/period/peak_period`
- `secondary_swell_wave_*` and `tertiary_swell_wave_*`
- `ocean_current_velocity`, `ocean_current_direction`
- `sea_surface_temperature`
- `sea_level_height_msl`, `invert_barometer_height`

**Models:** MeteoFrance MFWAM, ECMWF WAM, GFS Wave, DWD EWAM/GWAM, ERA5-Ocean (historical back to 1940)

**Note:** Combine with regular weather API for wind, pressure, etc. at same coordinates.

### 2. Weather - Stormglass.io (SUPPLEMENTARY)

**Endpoint:** `https://api.stormglass.io/v2/weather/point`
**Auth:** API key required (free registration)
**Free tier:** 10 requests/day (severely limiting)
**Forecast range:** Up to 10 days
**Data:** Air temp, pressure, humidity, cloud cover, precipitation, visibility, wind, waves, swell, currents, tides, UV
**Sources:** Aggregates ECMWF, NOAA, Met Office, Met.no, DWD, FMI

### 3. Tides - NOAA CO-OPS (US Waters)

**Endpoint:** `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter`
**Auth:** No key (provide `application=AboveDeck`)
**Coverage:** US coastline, territories, Great Lakes
**Format:** JSON, XML, CSV
**Products:** `predictions`, `water_level`, `currents`, `currents_predictions`, `high_low`, temperatures, wind, pressure, visibility, salinity
**Intervals:** 1-min (4 days max), 6-min (1 month), hourly (1 year), high/low
**Metadata:** `https://api.tidesandcurrents.noaa.gov/mdapi/prod/`

**Example:**
```
https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=today&station=9414290&product=predictions&datum=MLLW&time_zone=gmt&units=metric&format=json&application=AboveDeck
```

### 4. Tides - ADMIRALTY UK Tidal API

**Portal:** `https://admiraltyapi.portal.azure-api.net`
**Free tier (Discovery):** 10,000 calls/month, 10 calls/sec
**Coverage:** UK, Ireland, Isle of Man, Channel Islands (607 stations)
**Free data:** Current + 6 days tidal events (high/low water times and heights)
**Restriction:** Discovery tier prohibits caching/storing (copyright)

### 5. Tides - Neaps Tide Database (CRITICAL - OFFLINE)

**Repository:** `https://github.com/neaps/tide-database`
**NPM:** `@neaps/tide-database`
**Stations:** ~7,600+ globally (3,400 NOAA + 4,200 TICON-4/GESLA-4)
**Format:** JSON with harmonic constituents
**License:** Code MIT, Data CC BY 4.0
**Updates:** GitHub Action monthly for NOAA data

Feed harmonic constants to a tide prediction library to calculate tides for any date/time locally. No API calls needed at runtime. Works offline. Also exports XTide/OpenCPN compatible TCD format.

### 6. Harbours & POIs - OpenStreetMap Overpass API

**Endpoint:** `https://overpass-api.de/api/interpreter`
**Auth:** None
**Rate limits:** Fair-use (max 2 concurrent queries)

**Key marine tags:**
- `seamark:type=harbour` - ports and harbours
- `seamark:type=anchorage` - designated anchorages
- `seamark:type=marina` - marinas
- `seamark:type=mooring` - moorings
- `leisure=marina` - marina areas
- `seamark:type=small_craft_facility` - marine facilities
- `seamark:type=fuel_station` - fuel
- `seamark:type=harbour_master` - harbour offices

**Example query for marinas in a bounding box:**
```
[out:json];
(
  node["seamark:type"="harbour"](36.0,-10.0,44.0,5.0);
  node["seamark:type"="anchorage"](36.0,-10.0,44.0,5.0);
  node["leisure"="marina"](36.0,-10.0,44.0,5.0);
);
out body;
```

### 7. Charts - OpenSeaMap Tiles

**Seamark tiles:** `https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png`
**Format:** Transparent PNG raster (overlay on any basemap)
**Zoom levels:** 7-17
**Content:** Buoys, beacons, lights, depth soundings, harbours, anchorages, restricted areas
**License:** ODbL
**WMS:** `https://geoserver.openseamap.org/geoserver/wms`

### 8. Charts - NOAA (US Waters)

**WMTS:** `https://gis.charttools.noaa.gov/arcgis/rest/services/MarineChart_Services/NOAACharts/MapServer/WMTS`
**WMS:** `https://gis.charttools.noaa.gov/arcgis/rest/services/MCS/NOAAChartDisplay/MapServer/exts/MaritimeChartService/WMSServer`
**MBTiles offline:** `https://distribution.charts.noaa.gov/ncds/index.html`
**ENC Direct to GIS:** `https://encdirect.noaa.gov/`
**Updates:** Weekly

### 9. AIS - AISStream.io

**WebSocket:** `wss://stream.aisstream.io/v0/stream`
**Auth:** API key (free registration)
**Coverage:** Global (terrestrial receivers)
**Format:** JSON over WebSocket
**Data:** Real-time positions, voyage data, port calls, accident/danger reports
**Client libraries:** Go, Python, JS, Java, TypeScript

### 10. Hazard Data

**Marine Protected Areas:**
- WDPA API: `https://api.protectedplanet.net` (free, key required)
- 260,000+ protected areas, 245 countries, updated monthly

**Shipping Lanes:**
- GitHub: `https://github.com/newzealandpaul/Shipping-Lanes` (GeoJSON/Shapefile)
- OSM: `seamark:type=separation_zone`, `seamark:type=separation_line`

**Orca Interaction Zones:**
- No formal API. Best data: Orca Iberica (`orcaiberica.org`), Orcinus App, Noonsite
- Maintain static GeoJSON, update from community reports
- Known zones: Strait of Gibraltar, Portuguese coast, Galician Rias. Season May-August.

**Shark Incidents:**
- GSAF API: `https://public.opendatasoft.com/explore/dataset/global-shark-attack` (free, JSON)

**Piracy:**
- No free API. ICC-IMB has visual map only.
- Maintain static GeoJSON of high-risk areas (Gulf of Guinea, Malacca, Gulf of Aden, Red Sea)

### 11. Mapbox for Marine Use

**No built-in nautical chart style.** But provides:
- New bathymetry tileset and style (ocean depth contours)
- Custom tilesets via MTS (process NOAA bathymetry or other sources)

**Overlay strategy:**
1. OpenSeaMap seamark tiles as raster source
2. NOAA chart tiles as raster source (US waters)
3. Custom GeoJSON for harbours, anchorages, hazard zones
4. Weather data as custom layers from Open-Meteo

**Free tier:** 50,000 web map loads/month, 25,000 mobile MAU. Very generous for open source.

**Alternative:** MapLibre GL JS (fully open source fork of Mapbox GL JS, no limits, no API key)

---

## Other National Hydrographic Offices with Free Data

- **LINZ (New Zealand):** `data.linz.govt.nz` - NZ, Antarctica, SW Pacific
- **SHOM (France):** `data.shom.fr` - some free data
- **Finnish HO:** Open data, someone has converted to Mapbox vector tiles (`github.com/vokkim/finnish-nautical-chart-vectors`)

---

## Key Insight: MapLibre vs Mapbox Decision

Mapbox GL JS v2+ requires an API key and has usage limits. MapLibre GL JS is the community fork (MIT license) with identical API, no key required, no usage limits. For an open-source project:

- **Use MapLibre GL JS** as the map renderer (free, no limits)
- **Use Mapbox tiles** via API key for the basemap (50k loads/month free)
- **OR use OpenStreetMap/OpenFreeMap tiles** for truly zero-cost operation
- Marine data overlaid from free sources regardless of basemap choice
