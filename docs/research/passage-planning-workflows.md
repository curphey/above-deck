# Passage Planning: Comprehensive Research

**Date:** 2026-03-24
**Purpose:** Research for building a digital passage planning tool

---

## Table of Contents

1. [What Is a Passage Plan?](#1-what-is-a-passage-plan)
2. [Data a Passage Plan Needs](#2-data-a-passage-plan-needs)
3. [Free Data Sources Available](#3-free-data-sources-available)
4. [What Competitors Do](#4-what-competitors-do)
5. [Algorithms](#5-algorithms)
6. [The Ideal Digital Passage Plan](#6-the-ideal-digital-passage-plan)

---

## 1. What Is a Passage Plan?

### 1.1 The Formal RYA/MCA Process: APEM

Passage planning is a legal requirement under SOLAS Chapter V, Regulation 34, which mandates that every vessel must have a voyage plan before proceeding to sea. The RYA (Royal Yachting Association) and MCA (Maritime and Coastguard Agency) teach the four-stage framework known as **APEM**:

#### Appraise

Gather all relevant information before departure:

- **Charts and publications:** Collect up-to-date charts (paper or electronic), pilot books, almanacs, and local Notices to Mariners
- **Weather:** Obtain forecasts covering the full passage duration plus contingency time
- **Tides:** Determine tidal heights at departure, arrival, and any constrained points; compute tidal stream rates and directions for each leg
- **Hazards:** Identify rocks, shoals, traffic separation schemes, firing ranges, wind farms, restricted areas, and any seasonal hazards (fishing nets, lobster pots)
- **Regulations:** Check local traffic rules, VTS reporting requirements, port entry signals, and customs/immigration requirements
- **Vessel capability:** Assess crew experience, boat condition, fuel state, and equipment readiness

#### Plan

Design the passage in detail:

- **Route selection:** Plot a safe track on the chart with waypoints that maintain clearance from all hazards. Never place waypoints directly on navigation marks
- **Tidal computation:** Calculate set and drift for each leg. Identify tidal gates (points where timing is critical). Determine the optimum departure time
- **Course to steer (CTS):** Apply tidal vectors and leeway to derive the compass course for each leg
- **Distance and timing:** Calculate leg distances, estimated speeds, and cumulative ETAs
- **Contingency planning:** Identify bolt holes (ports of refuge), abort points, and weather thresholds that would trigger a plan change
- **Crew briefing notes:** Prepare watch schedules, key waypoint alerts, and emergency procedures

#### Execute

Put the plan into action:

- **Pre-departure checks:** Engine, safety equipment, navigation lights, communications
- **Departure fix:** Confirm position before leaving harbour
- **Crew briefing:** Share the plan, assign roles, discuss contingencies
- **Navigation:** Follow the planned track, adjusting CTS as tidal streams change

#### Monitor

Continuously verify the plan during the passage:

- **Position fixing:** Regular fixes using GPS, visual bearings, radar, or depth soundings
- **Cross-track error:** Monitor deviation from planned track
- **Weather monitoring:** Compare actual conditions to forecast. Update plan if deteriorating
- **ETA checks:** Compare actual progress against planned timing
- **Tidal gate verification:** Confirm timing at critical tidal windows
- **Decision points:** At each abort point, consciously decide whether to continue or divert

### 1.2 What Recreational Sailors Actually Do

The gap between textbook and practice is significant. In reality:

**The weekend coastal sailor:**
- Checks the weather forecast on their phone the night before and morning of
- Glances at the tide times for departure and arrival
- Plots a route on a chart plotter app (Navionics, Savvy Navvy)
- Maybe checks the tidal stream atlas for one or two critical points
- Departs and navigates by GPS, adjusting on the fly
- The "plan" lives entirely in their head or as a route on an app

**The experienced coastal cruiser:**
- Checks multiple weather sources 2-3 days ahead
- Works out tidal gates and optimum departure time
- Plots a route on the plotter with waypoints around known hazards
- Has a mental list of bolt holes along the route
- Keeps a basic log
- Monitors weather and adjusts plans flexibly

**The offshore/ocean cruiser:**
- Downloads GRIB files 3-5 days ahead, comparing multiple models
- Runs weather routing software (PredictWind, Expedition)
- Plans for self-sufficiency: fuel, water, food, spares
- Files a float plan with someone ashore
- Monitors weather via SSB/satellite, updating routing daily
- The plan evolves continuously during the passage

**Common shortcuts and gaps:**
- Few recreational sailors write a formal passage plan document
- Tidal stream computation is often skipped or approximated
- Contingency planning is informal at best
- Cross-track monitoring is left to the GPS alarm
- Weather monitoring during the passage is often passive
- Spring/neap interpolation is rarely calculated precisely

### 1.3 Coastal vs. Ocean Passage Planning

| Aspect | Coastal | Ocean |
|--------|---------|-------|
| **Duration** | Hours to 1-2 days | Days to weeks |
| **Navigation** | Pilotage, visual bearings, GPS | DR, GPS, celestial (backup) |
| **Weather models** | High-resolution mesoscale (1-2 day validity) | Global models (GFS, ECMWF; 7-16 day forecasts) |
| **Tides** | Critical: tidal gates, height constraints, stream computation for CTS | Less critical: ocean currents matter more (Gulf Stream, trade wind belts) |
| **Charts** | Detailed harbour and coastal charts at 1:25,000 - 1:75,000 | Ocean charts at 1:3,500,000+, plus approach charts for arrival |
| **Hazards** | Rocks, shoals, traffic, fishing gear, narrow channels | Weather systems, fatigue, equipment failure, shipping lanes |
| **Communications** | VHF, mobile phone | SSB radio, satellite (Iridium, Starlink), GRIB via email |
| **Contingency** | Bolt holes every few hours of sailing | Limited options; may need to heave-to or run off |
| **Routing** | Rhumb line, tidal vectors, pilotage | Great circle (or composite), weather routing |
| **Fuel planning** | Top up at marinas along the route | Must carry full fuel load; range under power is critical |
| **Crew management** | Usually back to port same day | Watch systems, fatigue management, provisioning |

---

## 2. Data a Passage Plan Needs

### 2.1 Weather

#### Data Types

| Data Type | Description | Use |
|-----------|-------------|-----|
| **Wind** | Speed, direction, gusts at surface level (10m) | Sail selection, routing, safety decisions |
| **Waves** | Significant wave height, period, direction (wind waves + swell) | Comfort, safety, routing |
| **Pressure** | Sea-level pressure, tendency | Frontal systems, storm prediction |
| **Visibility** | Fog, mist, rain | Pilotage safety, radar requirement |
| **Precipitation** | Rain, snow, thunderstorms | Crew comfort, lightning risk |
| **Temperature** | Air and sea surface | Fog prediction (when SST < dew point), crew comfort |
| **Cloud cover** | Total cloud, ceiling height | Celestial navigation, solar panel output |

#### Forecast Formats

**GRIB files (GRIdded Binary):**
- The standard format for gridded weather data
- Compact binary format designed for efficient storage and transmission
- Contains forecast data on a regular lat/lon grid at discrete time steps
- Downloaded via internet, email (Saildocs), or satellite
- Viewed in dedicated software (LuckGrib, XyGrib, OpenCPN GRIB plugin, PredictWind Offshore)
- Typically 50KB-5MB per download depending on area, resolution, and parameters

**Text forecasts:**
- Inshore waters forecasts (Met Office, NOAA marine forecasts)
- Shipping/sea area forecasts (BBC Radio 4 Shipping Forecast, NOAA offshore)
- Plain language with Beaufort scale winds, visibility, weather
- Good for synopsis and general picture, lack spatial precision
- Available via VHF (Coastguard), Navtex, SSB (HF), internet

**Synoptic charts:**
- Surface pressure analysis and prognosis charts
- Show fronts, pressure systems, isobars
- Essential for understanding the "big picture" that models may miss
- Available from national met services, fax (radiofax/weatherfax), internet

#### Forecast Horizons

| Model | Resolution | Forecast Length | Update Frequency | Access |
|-------|-----------|-----------------|-------------------|--------|
| **GFS** (NOAA) | 0.25 deg (~28km) | 16 days | 4x daily (00/06/12/18Z) | Free |
| **ECMWF (HRES)** | 0.1 deg (~9km) | 10 days | 2x daily (00/12Z) | Commercial (limited free via Open-Meteo) |
| **ICON** (DWD) | 0.125 deg (~13km) | 7.5 days | 4x daily | Free |
| **Arpege** (MeteoFrance) | 0.1 deg (Europe) | 4 days | 4x daily | Free |
| **NAM** (NOAA) | 3km (CONUS) | 60 hours | 4x daily | Free |
| **HRRR** (NOAA) | 3km (CONUS) | 48 hours | Hourly | Free |
| **WW3** (NOAA) | 0.5 deg (global) | 7 days | 4x daily | Free (now integrated in GFS) |

**Practical guidance for sailors:**
- 0-48 hours: High confidence; use high-resolution models
- 2-5 days: Moderate confidence; compare GFS and ECMWF for consensus
- 5-10 days: Low confidence; useful for departure window selection only
- 10+ days: Pattern guidance only; not suitable for operational decisions

### 2.2 Tides

#### Tidal Heights

- **Predicted heights:** Based on harmonic analysis of astronomical forcing. Published in tide tables (paper or digital) for standard and secondary ports
- **Chart datum:** The reference level from which depths on charts are measured. Usually Lowest Astronomical Tide (LAT) in most countries. All tidal heights are given above chart datum
- **Height of tide:** The actual water level above chart datum at any given time. Computed from harmonic constituents or interpolated from published predictions
- **Clearance under keel:** Charted depth + height of tide - vessel draft = clearance. Critical for shallow water pilotage

#### Tidal Streams and Currents

- **Tidal streams:** Horizontal water movement caused by tides. Direction (set) and speed (drift/rate) vary with time, location, and spring/neap cycle
- **Tidal diamonds:** Chart symbols referencing tables that give stream direction and rate for each hour relative to HW at a reference port, for spring and neap conditions
- **Tidal stream atlases:** Chartlets showing stream arrows for each hour of the tidal cycle. Available from national hydrographic offices
- **Current computation for CTS:** The vector triangle: ground track = water track + tidal stream. Essential for accurate navigation in tidal waters

#### Tidal Gates

A tidal gate is a location where passage timing is constrained by tidal conditions:

- **Depth-limited gates:** Harbour bars, shallow channels that require sufficient rise of tide
- **Stream-limited gates:** Headlands, straits, races where adverse streams make progress impossible or dangerous (Portland Bill, Alderney Race, The Needles)
- **Wind-over-tide:** Locations where wind opposing a strong tidal stream creates dangerous steep seas
- **Classic examples:** Portland Bill (7kt streams), Alderney Race (10kt+), Pentland Firth (12kt+), The Swinge, St Alban's Race, Raz de Sein

#### Spring/Neap Cycle

- **Spring tides:** Occur near full and new moon. Largest tidal range, strongest streams. Approx. every 14 days
- **Neap tides:** Occur at first and third quarter moon. Smallest range, weakest streams
- **Tidal coefficient:** A ratio (typically 0.5 for neaps to 1.0 for springs) used to interpolate between spring and neap stream rates
- **Planning impact:** Spring tides create more challenging tidal gates but also more water over shallow bars. Neaps are gentler but may not provide enough depth in constrained areas

### 2.3 Charts

#### Paper vs. Electronic

| Aspect | Paper Charts | Electronic Charts |
|--------|-------------|-------------------|
| **Updates** | Manual corrections from Notices to Mariners | Automatic updates (with subscription) |
| **Situation awareness** | Good overview at fixed scale | Zoomable, but can lose context at wrong scale |
| **Plotting** | Pencil, plotter, dividers | GPS overlay, automatic DR |
| **Weight/storage** | Bulky, expensive for full coverage | Tablet or plotter |
| **Failure mode** | Always works | Battery/device dependent |
| **Legal status** | Universally accepted | Accepted on ECDIS (SOLAS); recreational use is unregulated |

#### Electronic Chart Formats

**S-57 (IHO Transfer Standard):**
- The current international standard for vector Electronic Navigational Charts (ENCs)
- Object-oriented data model: each feature (buoy, depth area, light) is a database object with attributes
- Supports queries (click on a feature for details), alarms (shallow water, crossing safety contour), and selective display
- Published by national hydrographic offices
- Being superseded by S-101 (under the S-100 framework) from 2026, with full transition expected by ~2035

**S-63 (IHO Data Protection Scheme):**
- Encryption and digital signing layer for S-57 data
- Prevents piracy and ensures data authenticity
- Required for commercial ECDIS; most hydrographic offices distribute encrypted ENCs

**S-100 / S-101 (Next Generation):**
- S-100 is the new universal hydrographic data model (replacing S-57's data model)
- S-101 is the new ENC product specification under S-100
- Additional S-100 products: S-102 (bathymetric surface), S-104 (water level), S-111 (surface currents), S-412 (weather overlay)
- Legal for ECDIS use from January 1, 2026; mandatory for new installations from January 1, 2029
- Type-approved S-100 ECDIS estimated commercially available in 2028
- Dual-fuel period: S-57 and S-101 will coexist for approximately a decade

**Raster Charts (RNC/BSB):**
- Digital scans of paper charts with georeferencing
- What you see is exactly the paper chart
- Cannot be queried or dynamically scaled
- NOAA distributes BSB format raster charts free for US waters
- Being phased out by some hydrographic offices (NOAA discontinued new raster chart production)

### 2.4 Waypoints and Routes

#### How Sailors Define Routes

A route is an ordered sequence of waypoints connected by legs. In practice:

- **Harbour waypoints:** Set outside the harbour entrance, clear of traffic, at a safe depth
- **Hazard avoidance:** Waypoints placed to route around headlands, rocks, shoals, TSS boundaries
- **Tidal gate waypoints:** Marks at critical tidal points to check timing
- **Approach waypoints:** Set on the approach to destination, clear of dangers, visible on radar
- **Never on marks:** Waypoints should never be placed directly on navigation buoys or marks (collision risk with other vessels doing the same)
- **Offset from dangers:** Minimum clearance depends on conditions, typically 0.5-2nm from charted dangers

#### Great Circle vs. Rhumb Line

| Aspect | Great Circle | Rhumb Line |
|--------|-------------|------------|
| **Definition** | Shortest distance on the surface of a sphere | Constant compass bearing (straight line on Mercator) |
| **Course** | Continuously changing heading | Constant heading |
| **Distance** | Shortest | Slightly longer (significant on long passages) |
| **When to use** | Ocean passages > 600nm, especially at higher latitudes | Coastal passages, short distances, E-W near equator |
| **In practice** | Approximated by a series of rhumb line legs between intermediate waypoints | Plotted directly on Mercator charts |
| **Savings example** | New York to Southampton: GC = 3,147nm vs RL = 3,177nm (30nm saving) | |

Most chart plotters compute great circle routes automatically and display them as a series of short rhumb line segments.

### 2.5 Port Information

A passage plan needs the following for departure and arrival ports, plus any ports of refuge:

- **Approach:** Bearing and distance from seaward waypoint, leading lines/lights, channel depths, traffic patterns
- **Hazards:** Rocks, shoals, wrecks, cables, shallow bars, restricted areas on the approach
- **Tidal constraints:** Harbour bar depths, lock times, bridge opening times, minimum depths alongside
- **Facilities:** Fuel, water, electricity, showers, chandlery, repairs, provisioning
- **Customs/immigration:** Port of entry status, check-in procedures (CIQ: Customs, Immigration, Quarantine), required documents
- **Costs:** Marina berthing rates, harbour dues, canal/lock fees, customs/cruising permits
- **Communications:** VHF working channel, port control frequency, marina booking
- **Anchoring:** Holding, depth, shelter from different wind directions, restrictions

Key sources: pilot books (Imray, Reeds, NP series), Noonsite (for international clearance), ActiveCaptain/Navily (community reviews), harbour authority websites.

### 2.6 Fuel and Range

#### Under Power

- **Consumption rate:** Expressed in litres/hour (or GPH) at various RPM settings. Varies by engine, prop, loading, sea state
- **Hull speed:** For displacement boats, theoretical maximum is ~1.34 x sqrt(LWL in feet) knots
- **Sweet spot:** Most fuel-efficient speed is typically 60-70% of hull speed, at low RPM
- **Range calculation:** (Usable fuel in litres / consumption rate in L/hr) x speed in knots = range in nautical miles
- **Safety margin:** Plan to arrive with 20-30% fuel remaining. Never plan to use last 10% (dirty fuel, blocked filters)
- **Sea state penalty:** Add 10-30% to consumption for head seas and wind

#### Under Sail

- **No fuel consumed** (obviously), but:
- **Speed prediction:** Based on polar diagrams (see Algorithms section)
- **VMG calculation:** Actual progress toward destination accounting for tacking/gybing
- **Motor-sailing:** Common in light airs. Reduced engine load + sail assistance extends range significantly
- **Motorsailing consumption:** Typically 50-70% of motoring consumption

#### Planning Considerations

- Fuel availability at destination
- Emergency reserves for unexpected weather or diversions
- Generator fuel consumption for electrical systems
- Fuel quality in remote locations (filtering, water contamination)

---

## 3. Free Data Sources Available

### 3.1 Tidal Data APIs

#### NOAA CO-OPS (USA)

- **URL:** https://tidesandcurrents.noaa.gov/
- **API:** REST API returning JSON, XML, CSV
- **Coverage:** ~3,000 stations across US coasts, Great Lakes, Pacific islands
- **Data:** Predictions (6-min, hourly), observations, harmonic constituents (37 components), datums, currents
- **Cost:** Completely free, no API key required
- **Limits:** No published rate limits for reasonable use
- **Harmonic constituents available:** Yes, can download raw constituents to compute predictions locally
- **Documentation:** https://api.tidesandcurrents.noaa.gov/api/prod/

#### UK Admiralty Tidal API

- **URL:** https://admiralty.co.uk/access-data/apis
- **Coverage:** British Isles and Ireland (~600 stations)
- **Free tier:** EasyTide web interface (current day + 6 days). API: 10 requests/second, 10,000 requests/month free
- **Paid tier:** Foundation (13 days predictions) at GBP 144/year; Premium for commercial use
- **Data:** Tidal height events (HW/LW), height predictions, tidal stream data
- **Format:** JSON via REST API

#### FES2014 Global Ocean Tide Atlas

- **URL:** https://www.aviso.altimetry.fr/en/data/products/auxiliary-products/global-tide-fes.html
- **Coverage:** Global ocean, 1/16 degree grid (~7km)
- **Data:** 34 tidal constituents for elevation and currents
- **Cost:** Free for all purposes (scientific and commercial)
- **Format:** NetCDF files with harmonic constituents
- **Python library:** PyFES (https://github.com/CNES/aviso-fes) for computing predictions from constituents
- **Strength:** Can compute tides anywhere in the ocean, not just at gauge stations
- **Limitation:** Less accurate near coastlines and in estuaries than local gauge-based predictions

#### WorldTides API

- **URL:** https://www.worldtides.info/
- **Coverage:** 8,000+ locations worldwide
- **Cost:** 100 free credits on signup; 10,000 credits for $10 thereafter
- **Data:** High/low predictions, height curves, datums, extremes
- **Format:** JSON via REST API

#### Stormglass Tide API

- **URL:** https://stormglass.io/global-tide-api/
- **Coverage:** Global (thousands of stations)
- **Free tier:** 10 requests/day
- **Data:** Tide heights, high/low events, sea level data
- **Format:** JSON via REST API

#### SHOM (France)

- **URL:** https://data.shom.fr/
- **Coverage:** French coasts, DOM-TOM territories
- **Data:** Tidal predictions, harmonic constituents, tidal atlases
- **Cost:** Some data free via open data portal; premium data requires license

### 3.2 Weather APIs for Marine Use

#### Open-Meteo Marine API

- **URL:** https://open-meteo.com/en/docs/marine-weather-api
- **Cost:** Free for non-commercial use, no API key
- **Data:** Wave height/direction/period (wind waves, swell 1, swell 2), ocean currents
- **Models:** Copernicus Marine (MeteoFrance), ERA5, local European models
- **Resolution:** 5km European model, global model elsewhere
- **Forecast length:** 7 days (European), blends to global after 3 days
- **Also available:** GFS, ECMWF, ICON atmospheric data via separate endpoints

#### Open-Meteo Weather API (GFS/ECMWF/ICON)

- **URL:** https://open-meteo.com/en/docs
- **Cost:** Free for non-commercial use
- **Models:** GFS (0.25 deg), ECMWF (0.4 deg from open data), ICON (0.125 deg), HRRR (3km)
- **Parameters:** Wind (10m, gusts), pressure, precipitation, cloud cover, visibility, temperature
- **Forecast length:** Up to 16 days (GFS), 10 days (ECMWF)
- **Format:** JSON, CSV

#### NOAA GFS Direct Access

- **URL:** https://nomads.ncep.noaa.gov/ (GRIB files)
- **Also on AWS:** https://registry.opendata.aws/noaa-gfs-bdp-pds/
- **Cost:** Completely free
- **Format:** GRIB2 files
- **Resolution:** 0.25 degree global, updated 4x daily
- **Parameters:** Full atmospheric model output including marine parameters
- **Note:** As of GFS v16, WaveWatch III ocean data is integrated directly

#### Stormglass Weather API

- **URL:** https://stormglass.io/
- **Free tier:** 10 requests/day
- **Data:** Wind, waves, swell, currents, temperature, visibility, pressure
- **Sources:** Multiple models aggregated with AI selection
- **Format:** JSON via REST API

### 3.3 GRIB File Sources and Viewers

#### Sources

| Source | Models | Access Method | Cost |
|--------|--------|--------------|------|
| **Saildocs** | GFS, ICON, Arpege, WW3 | Email request/response | Free |
| **NOAA NOMADS** | GFS, NAM, HRRR, WW3 | HTTP/FTP download | Free |
| **DWD Open Data** | ICON | HTTP download | Free |
| **MeteoFrance** | Arpege | HTTP download | Free |
| **OpenGribs** | Multiple | Aggregator/info site | Free |
| **PredictWind** | GFS, ECMWF, PWG, PWE | App/web download | Subscription |
| **LuckGrib** | GFS, ECMWF, ICON, others | macOS/iOS app | $19.99 app + optional sub |

#### Viewers

| Software | Platform | Cost | Notes |
|----------|----------|------|-------|
| **XyGrib** | Win/Mac/Linux | Free (open source) | Successor to ZyGrib |
| **OpenCPN GRIB Plugin** | Win/Mac/Linux | Free (open source) | Integrated with chart plotter |
| **LuckGrib** | macOS/iOS | $19.99 | Excellent UI, direct ECMWF access |
| **PredictWind Offshore** | iOS/Android/Win/Mac | Subscription | Weather routing integrated |
| **Expedition** | Windows | $599+ | Professional racing/routing |
| **qtVlm** | Win/Mac/Linux | Free | Open source routing + GRIB |

### 3.4 Current and Stream Data

- **NOAA CO-OPS Currents:** Tidal current predictions at US stations (same API as tidal heights)
- **OSCAR (Ocean Surface Current Analysis):** Satellite-derived near-surface ocean currents, global, ~1/3 degree, 5-day averages. Free from NASA/JPL
- **Copernicus Marine Service (CMEMS):** Global ocean currents (GLORYS reanalysis, forecasts). Free registration required. High quality, ~1/12 degree
- **FES2014:** Tidal currents globally from harmonic constituents (see above)
- **S-111 (future):** IHO standard for surface current data product under S-100 framework

### 3.5 Chart Data

#### Free Chart Sources

| Source | Coverage | Format | Notes |
|--------|----------|--------|-------|
| **NOAA ENCs** | US waters | S-57 | Free download; also available as NOAA Custom Charts (PDF/raster) |
| **OpenSeaMap** | Global (community) | KAP raster, S-57-schema vector | OpenStreetMap-based; quality varies by region |
| **OpenCPN Chart Downloader** | Multiple sources | Various | Built-in plugin aggregates NOAA, OpenSeaMap, and others |
| **Brazilian Navy (DHN)** | Brazil | S-57 | Free download |
| **BSH (Germany)** | German waters | S-57 | Free download |

#### Commercial Chart Data

| Provider | Coverage | Format | Approx. Cost |
|----------|----------|--------|------|
| **C-MAP** | Global | Proprietary vector | $50-200/region/year |
| **Navionics** | Global | Proprietary vector | $15-25/year (app subscription) |
| **Admiralty (UKHO)** | Global | S-63 encrypted S-57 | Via distributors (AVCS) |
| **Primar** | Global (aggregator) | S-63 | Via distributors |

#### Chart Datum

All charted depths are referenced to chart datum, which varies by country:
- **LAT (Lowest Astronomical Tide):** Used by most countries (IHO standard). Conservative: depths are rarely less than charted
- **MLLW (Mean Lower Low Water):** Used by US (NOAA). Slightly less conservative than LAT
- **MSL (Mean Sea Level):** Used for some inland waters
- Tidal height predictions are given above chart datum, so: **actual water depth = charted depth + tidal height**

---

## 4. What Competitors Do

### 4.1 Savvy Navvy

**Business model:** Subscription app (iOS/Android/web). 14-day free trial, then ~$70/year.

**Core features:**
- **Auto-routing ("Savvy Routing"):** Computes an automatic course-to-steer accounting for tides, weather, and chart data. Factors in departure time, boat specs, wind, and sea state
- **Weather overlay:** Wind speed/direction, swell, visibility, rain. Scroll through days to see changing conditions
- **Tidal information:** Tidal graph for highs/lows, tidal stream overlay showing strength and direction. 8,000+ tidal stations globally
- **Departure scheduler:** Suggests optimal departure time considering weather, tides, and daylight
- **AIS overlay:** Real-time AIS data showing nearby vessels
- **Charts:** Global coverage (C-MAP based)

**User complaints (from YBW Forum, Cruisers Forum, App Store reviews):**
- GPS tracking shows straight lines with inaccurate data on some devices
- Tidal information reported inaccurate on UK East Coast
- Cannot plot courses over 40nm without manually inserting waypoints
- Routing does not account for tidal height when considering depth (dangerous for shallow areas like Thames Estuary)
- Depth readings not easily accessible at arbitrary chart locations
- Android version significantly worse than iOS (fails to boot on some tablets)
- High price relative to perceived value vs Navionics
- Limited coverage outside well-charted areas

### 4.2 PredictWind

**Business model:** Subscription (web/app). Free limited access, paid plans from $13/month.

**Core features:**
- **Weather routing:** Isochrone-based optimal route computation using boat polars. Runs 16 billion calculations in the cloud
- **Departure planning:** Compares 4 departure dates showing average/max/min wind, waves, currents for each. Time steps as fine as 1 hour for coastal or 1 day for offshore
- **Proprietary weather models:** PWG (PredictWind Global) and PWE (PredictWind European) alongside GFS and ECMWF
- **Offshore app:** Dedicated app for use at sea with GRIB downloading via satellite
- **3D hydrodynamic modelling:** Calculates roll, vertical acceleration, and slamming incidence for your specific hull shape
- **Wave polar:** Separate polar for wave performance, not just wind
- **Ocean currents:** Multiple current model selection

**Strengths:** Best-in-class offshore weather routing. Trusted by professional sailors and rally organizers. Excellent departure planning for choosing weather windows.

**Weaknesses:** Complex interface, steep learning curve. Primarily weather-focused, not a full passage planning tool. Chart integration is secondary. Expensive for full features.

### 4.3 Navionics (now Garmin)

**Business model:** App subscription ($15-25/year) or built into Garmin hardware.

**Core features:**
- **Charts:** Global vector charts with excellent detail, especially bathymetry
- **SonarChart:** Community-contributed depth data creating high-resolution bathymetric contours. 234,000+ chart updates per year
- **ActiveCaptain community:** User reviews of marinas, anchorages, hazards, local knowledge
- **Dock-to-dock routing:** Auto-route computation (was first to market with this)
- **Chart plotting:** Standard waypoint/route creation, GPS tracking
- **Offline charts:** Download regions for offline use

**Strengths:** Largest chart coverage and community data. Excellent bathymetry. Affordable. Simple to use. Deep integration with Garmin hardware ecosystem.

**Weaknesses:** No weather routing. No tidal stream computation for CTS. Auto-routing is basic (doesn't factor weather or tidal streams for optimal timing). Chart display can have "fake accuracy" from interpolated SonarChart data. Now owned by Garmin, raising concerns about lock-in.

### 4.4 OpenCPN

**Business model:** Free, open source (GPL). Community-developed.

**Core features:**
- **Chart display:** S-57 vector ENCs, BSB raster charts, CM93, and more
- **GPS/AIS integration:** NMEA input for real-time position and AIS targets
- **Waypoint/route management:** Full route planning with waypoints
- **Plugin ecosystem:** 30+ plugins including:
  - GRIB plugin (weather overlay and download)
  - Weather Routing plugin (isochrone-based routing with polars)
  - Radar overlay
  - Celestial navigation
  - Dashboard (instrument display)
  - Chart downloader (NOAA, OpenSeaMap)
  - Tidal/current data display

**Strengths:** Free and open source. Runs on Raspberry Pi (ideal for boats). Massive plugin ecosystem. Supports all major chart formats. Active community. Can be extended for any purpose.

**Weaknesses:** Dated UI (looks like 2005). Steep learning curve. Plugin quality varies. No mobile app (desktop only). Weather routing plugin is functional but not as polished as PredictWind. No cloud sync.

### 4.5 Orca

**Business model:** Subscription app/hardware. App is free with basic features, full nav subscription required.

**Core features:**
- **Modern UI:** Clean, well-designed interface
- **Smart routing:** Auto-routing that adjusts for wind direction during sailing (unique capability)
- **Real-time adjustment:** Route automatically adapts to conditions encountered while sailing
- **Vector charts:** Advanced vector cartography using bathymetric data, satellite data, official charts, and community input
- **Social features:** Community-contributed data, shared routes
- **Hardware option:** Dedicated Orca display unit for permanent installation

**Strengths:** Best-looking modern UI. Unique real-time route adaptation during sailing. Hardware option for permanent installation. Growing fast.

**Weaknesses:** Newer product, less chart coverage than Navionics. Charts less detailed in anchorages. Smaller community. Routing can be unreliable outside well-tested regions. Higher cost with hardware.

### 4.6 Other Notable Tools

- **Expedition:** Professional racing navigation. $599+. Gold standard for weather routing, polars, and tactical sailing. Windows only.
- **qtVlm:** Free, open source weather routing and GRIB viewer. Good routing engine, basic UI.
- **Ditch Navigation:** Uses historic AIS data and AI to suggest routes based on what other boats actually sailed.
- **Aqua Map:** Clean chart plotter with 10-step passage planning methodology built in.
- **Seapilot:** Swedish chart plotter with good polar integration and Nordic chart coverage.

### 4.7 What Users Complain About (Forum/Reddit/YouTube Themes)

**Recurring complaints across all tools:**

1. **No single tool does everything.** Users typically run 2-3 apps: one for charts, one for weather, one for tides. Nobody has nailed the integrated experience
2. **Routing through dangerous areas.** Auto-routing that looks sophisticated but lacks seamanship (routes through shallows, near lee shores, or into wind-over-tide conditions)
3. **Tidal stream integration is poor.** Most tools show tidal data but don't properly integrate it into CTS computation or route optimization
4. **Offshore vs coastal is either/or.** PredictWind excels offshore but is overkill for a weekend coastal sail. Navionics is great for coastal but useless for offshore routing
5. **Price fragmentation.** Charts from one provider, weather from another, tides from another. Costs add up quickly
6. **Loss of seamanship skills.** Over-reliance on auto-routing without understanding why the route is what it is
7. **Android is second-class.** Most marine apps are iOS-first, with Android versions lagging in quality
8. **No passage plan document.** None of these tools produce a formal passage plan that an examiner, harbour master, or insurance company would accept
9. **Poor contingency planning.** No tool suggests bolt holes or identifies abort points along a route
10. **Crew management absent.** No integration of watch schedules, crew experience, fatigue management

---

## 5. Algorithms

### 5.1 Weather Routing: The Isochrone Method

The isochrone method, invented in 1957 by R.W. James, is the foundational algorithm for sailing weather routing.

#### How It Works

1. **Start from departure point.** For each time step (typically 1-6 hours):
2. **Fan out:** From the current position(s), compute the boat speed in every possible heading direction (using the polar diagram and the forecast wind at that location and time)
3. **Advance:** Move each heading by (boat speed x time step) to get a set of candidate positions
4. **Form the isochrone:** Connect all the farthest-reached positions. This contour represents the maximum distance reachable in equal time
5. **Prune:** Remove positions that are behind the isochrone (dominated solutions), inside land, or in excluded zones
6. **Iterate:** From the new isochrone, repeat steps 2-5 for the next time step with updated weather forecasts
7. **Terminate:** When an isochrone reaches or crosses the destination, trace back to find the optimal route

#### Key Enhancements

- **Land/hazard avoidance:** Coastline and shallow water polygons clip isochrones
- **Current integration:** Add tidal stream/ocean current vectors to boat speed vectors
- **Wave penalty:** Reduce boat speed based on wave height/direction using wave polars
- **Sail change costs:** Add time penalties for tacking, gybing, reefing, and sail changes
- **Comfort constraints:** Limit maximum heel angle, apparent wind speed, or wave height
- **Multi-objective:** Optimize for time, comfort, or safety (or weighted combination)

#### Complexity

For a 7-day passage with 3-hour time steps (56 steps), 72 heading directions, the algorithm evaluates ~4,000 candidates per step, ~224,000 total. With weather grid interpolation and land checking, this is computationally light by modern standards.

### 5.2 Dynamic Programming Approach

An alternative to the isochrone method:

1. **Discretize the sailing space** into a grid of nodes (lat/lon cells)
2. **Define stages** as time steps along the passage
3. **For each node at each stage**, compute the optimal path from the previous stage using Bellman's principle: the optimal path to node (i, t) is the minimum cost path through any reachable node at time (t-1), plus the cost of the transition
4. **Cost function:** Time, fuel, comfort penalty, or weighted combination
5. **Backtrack:** From the destination, trace the optimal decisions back to departure

**Advantages over isochrone:** Easier to add constraints, guaranteed global optimum on the discretized grid. **Disadvantages:** Computational cost scales with grid size; may miss the true optimum if grid is too coarse.

### 5.3 Tidal Stream Computation from Harmonic Constituents

#### The Harmonic Method

Tidal prediction uses the principle of harmonic superposition: the tide at any location is the sum of sinusoidal components, each driven by a specific astronomical frequency.

**The prediction equation:**

```
h(t) = Z0 + SUM[i=1..N]( fi * Hi * cos(Vi(t) + ui - Gi) )
```

Where:
- `h(t)` = predicted tidal height at time t
- `Z0` = mean water level above chart datum
- `N` = number of constituents (typically 37 for standard predictions)
- `Hi` = amplitude of constituent i (from harmonic analysis of observations)
- `Gi` = phase lag (Greenwich epoch) of constituent i
- `Vi(t)` = astronomical argument of constituent i at time t (computed from orbital mechanics)
- `fi` = nodal amplitude factor (18.6-year lunar nodal cycle correction)
- `ui` = nodal phase correction

#### Major Constituents

| Symbol | Name | Period (hours) | Description |
|--------|------|--------|-------------|
| **M2** | Principal lunar semidiurnal | 12.42 | Dominant constituent in most locations |
| **S2** | Principal solar semidiurnal | 12.00 | Combined with M2 creates spring/neap cycle |
| **N2** | Larger lunar elliptic | 12.66 | Lunar distance variation |
| **K1** | Lunar-solar diurnal | 23.93 | Diurnal inequality |
| **O1** | Principal lunar diurnal | 25.82 | Major diurnal constituent |
| **P1** | Principal solar diurnal | 24.07 | Solar diurnal |
| **K2** | Lunisolar semidiurnal | 11.97 | Modulates spring/neap range |
| **M4** | First overtide of M2 | 6.21 | Shallow water distortion |

#### For Tidal Streams/Currents

The same harmonic method applies, but with separate amplitude and phase for east (u) and north (v) components:

```
u(t) = SUM( fi * Ui * cos(Vi(t) + ui - gui) )
v(t) = SUM( fi * Vi * cos(Vi(t) + ui - gvi) )
```

Stream speed = sqrt(u^2 + v^2), direction = atan2(u, v)

#### Spring/Neap Interpolation

For tidal diamonds/atlas data that gives only spring and neap rates:

```
rate = neap_rate + (spring_rate - neap_rate) * tidal_factor
```

Where `tidal_factor` = (today's range - neap range) / (spring range - neap range), clamped to [0, 1].

### 5.4 Polar Diagram-Based Performance Prediction

#### What a Polar Contains

A polar diagram maps: **(True Wind Angle, True Wind Speed) -> Boat Speed**

Represented as a lookup table, typically:
- TWA: 0 to 180 degrees in 5-degree steps (37 values)
- TWS: 4 to 40 knots in 2-4 knot steps (10-15 columns)
- Value: predicted boat speed in knots

#### Velocity Prediction Program (VPP)

Full VPPs solve the force balance equations:
- Aerodynamic driving force (sails) = hydrodynamic resistance (hull) at equilibrium
- Input: hull shape, sail plan, displacement, wind conditions
- Output: boat speed, heel angle, leeway for each TWA/TWS combination
- Simplified versions use empirical models (Delft Systematic Yacht Hull Series)

#### Key Derived Values

- **VMG (Velocity Made Good):** Component of boat speed toward the wind (upwind) or away from it (downwind). VMG = boat_speed * cos(TWA). Optimal VMG angles are the most efficient tacking/gybing angles
- **VMC (Velocity Made good on Course):** Component toward the actual destination bearing. VMC = boat_speed * cos(course_angle - destination_bearing). Used by weather routing to evaluate heading options
- **Polar percentage:** Actual speed / predicted speed x 100. Indicates how well the boat is performing against its theoretical potential

#### Using Polars in Routing

The weather routing algorithm uses polars to convert (wind speed, wind direction relative to desired heading) into achievable boat speed for each candidate heading at each time step. This is the core input to the isochrone method.

### 5.5 Collision Avoidance: CPA/TCPA from AIS

#### Core Calculations

Given own vessel position/course/speed and target vessel position/course/speed (from AIS):

**Relative motion method:**
```
relative_speed_x = target_SOG * sin(target_COG) - own_SOG * sin(own_COG)
relative_speed_y = target_SOG * cos(target_COG) - own_SOG * cos(own_COG)
relative_pos_x = target_lon - own_lon  (in appropriate distance units)
relative_pos_y = target_lat - own_lat

TCPA = -(relative_pos_x * relative_speed_x + relative_pos_y * relative_speed_y) /
        (relative_speed_x^2 + relative_speed_y^2)

DCPA = sqrt((relative_pos_x + relative_speed_x * TCPA)^2 +
            (relative_pos_y + relative_speed_y * TCPA)^2)
```

- **TCPA < 0:** Vessels are diverging (past CPA)
- **TCPA > 0:** Vessels are converging
- **DCPA < threshold:** Potential collision risk (typically < 0.5nm for small vessels, < 1-2nm in open water)

#### Enhancements

- **Rate of turn (ROT):** AIS provides ROT data, which can improve CPA prediction for manoeuvring vessels
- **Change of speed (COS):** Incorporating acceleration/deceleration data
- **Ship domain:** The required minimum safe distance, which varies by vessel type, size, sea area, and traffic density
- **COLREGs integration:** Determining if a vessel is crossing, overtaking, or head-on, and which vessel is the give-way vessel

### 5.6 Great Circle and Rhumb Line Calculations

#### Haversine Formula (Great Circle Distance)

```
a = sin^2(dlat/2) + cos(lat1) * cos(lat2) * sin^2(dlon/2)
c = 2 * atan2(sqrt(a), sqrt(1-a))
distance = R * c
```

Where R = 3,440.065 nautical miles (Earth's mean radius)

#### Initial Great Circle Bearing

```
bearing = atan2(sin(dlon) * cos(lat2),
                cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(dlon))
```

#### Intermediate Great Circle Waypoints

To generate waypoints along a great circle at fraction f (0 to 1):

```
a = sin((1-f) * d) / sin(d)
b = sin(f * d) / sin(d)
x = a * cos(lat1) * cos(lon1) + b * cos(lat2) * cos(lon2)
y = a * cos(lat1) * sin(lon1) + b * cos(lat2) * sin(lon2)
z = a * sin(lat1) + b * sin(lat2)
lat = atan2(z, sqrt(x^2 + y^2))
lon = atan2(y, x)
```

#### Rhumb Line Distance and Bearing

```
dphi = lat2 - lat1
dlambda = lon2 - lon1
dpsi = ln(tan(pi/4 + lat2/2) / tan(pi/4 + lat1/2))  // Mercator projection stretch
q = dphi / dpsi  (or cos(lat1) if dpsi is small)
bearing = atan2(dlambda, dpsi)
distance = sqrt(dphi^2 + q^2 * dlambda^2) * R
```

---

## 6. The Ideal Digital Passage Plan

### 6.1 What Would a Modern, AI-Assisted Passage Plan Look Like?

The ideal tool would be an **intelligent co-skipper** that combines data integration, seamanship knowledge, and adaptive planning.

#### Before Departure: The Planning Phase

**Natural language input:** "I want to sail from Hamble to Cherbourg this Friday, arriving before dark. We're a crew of two, moderately experienced, sailing a Hallberg-Rassy 40."

The system would then:

1. **Appraise automatically:**
   - Pull weather forecasts from multiple models (GFS, ECMWF, ICON), highlight discrepancies
   - Compute tidal heights at departure/arrival, identify tidal gates en route (The Needles, Alderney Race)
   - Check Notices to Mariners for the route area
   - Flag shipping lanes, TSS crossings, wind farm areas
   - Assess daylight hours and moon phase

2. **Generate a plan with reasoning:**
   - Recommend a departure time with clear explanation: "Depart Hamble at 0630 UTC to catch the last of the east-going stream through the Solent, arrive at The Needles at slack water (HW Portsmouth -1), and reach the Alderney Race during the southeast-going stream"
   - Show alternative departure times ranked by safety, speed, and comfort
   - Plot the route on the chart with annotated waypoints
   - Calculate CTS for each leg with tidal vectors shown graphically
   - Identify bolt holes: Yarmouth, Poole, St Peter Port, Braye Harbour
   - Define abort criteria: "If wind exceeds F6 south of The Needles, divert to Poole"

3. **Produce a passage plan document:**
   - Formal document that satisfies RYA examiner, insurance, or harbour master requirements
   - Waypoint list with lat/lon, bearing, distance, CTS, ETA for each leg
   - Tidal gate timing table
   - Weather summary with source attribution
   - Crew brief notes
   - Emergency contacts, VHF channels, coastguard frequencies
   - Exportable as PDF, shareable via link

#### During the Passage: The Execution Phase

4. **Live monitoring with proactive alerts:**
   - "Wind has backed 20 degrees from forecast. Your CTS for the next leg should be adjusted to 185M."
   - "You are 15 minutes behind schedule for the Alderney Race tidal gate. Consider increasing speed to 6.5 knots to arrive during favourable stream."
   - "Updated ECMWF forecast shows F7 arriving 4 hours earlier than predicted. Recommend diverting to St Peter Port."
   - AIS integration with CPA/TCPA warnings
   - Automatic comparison of actual vs. planned progress

5. **Adaptive re-routing:**
   - If conditions change, the system re-runs routing with updated weather and presents options
   - Shows the trade-offs clearly: "Continue to Cherbourg: arrive 2200, F5-6 on the nose. Divert to St Peter Port: arrive 1800, F4 beam reach."

#### After the Passage: The Learning Phase

6. **Post-passage analysis:**
   - Compare actual track to planned route
   - Compare actual weather to forecast
   - Record fuel consumption, average speeds, sail configurations
   - Build boat-specific polars from actual performance data
   - Feed learnings back into future predictions

### 6.2 How Would It Differ from Existing Tools?

| Capability | Current Tools | Ideal Tool |
|-----------|--------------|------------|
| **Data integration** | Manual: check 3-4 apps separately | Unified: weather, tides, charts, AIS in one view |
| **Tidal computation** | Shown as overlay, not integrated into routing | Tidal vectors computed per-leg and integrated into CTS |
| **Departure timing** | PredictWind does this well, others don't | Front-and-centre feature for every passage |
| **Tidal gates** | User must identify and manage manually | Automatically identified and schedule-constrained |
| **Routing intelligence** | Pure optimization (fastest/shortest) | Seamanship-aware: avoids lee shores, wind-over-tide, considers crew fatigue |
| **Contingency planning** | Absent | Bolt holes, abort points, decision triggers built into plan |
| **Plan document** | None produce one | Generates a proper passage plan document |
| **Crew management** | Absent | Watch schedules, experience levels, fatigue tracking |
| **Learning** | Static polars, no adaptation | Builds boat-specific performance model over time |
| **Explainability** | "Here's the route" | "Here's why this is the route" with reasoning for every decision |
| **Offline capability** | Varies, often poor | Full offline passage execution with pre-downloaded data |

### 6.3 Minimum Viable Passage Planning Feature

The smallest useful increment that delivers real value:

#### MVP Scope: "Smart Departure Timing"

**The problem it solves:** The most common and consequential passage planning decision is *when to leave*. Most recreational sailors get this wrong or leave it to guesswork.

**Core features:**

1. **Route input:** Define departure and destination (click on chart or search). System computes a basic route avoiding land and marked hazards
2. **Departure time optimizer:** For the next 3-5 days, compute and rank departure times considering:
   - Tidal streams at critical points along the route (fetch from NOAA CO-OPS, Admiralty API, or FES2014)
   - Wind forecast along the route (GFS via Open-Meteo)
   - Wave height forecast (WW3 via Open-Meteo Marine)
   - Daylight hours at arrival
3. **Visual timeline:** A clear visualization showing, for each candidate departure time:
   - Tidal stream direction/strength at key points
   - Wind speed/direction along the route
   - Estimated passage time
   - Arrival time (daylight/dark indicator)
   - Overall "suitability score" combining safety, speed, and comfort
4. **Simple passage summary:** Generate a one-page summary with waypoints, ETAs, weather synopsis, and key tidal gates

**Data sources (all free):**
- Charts: OpenSeaMap + NOAA ENCs
- Weather: Open-Meteo (GFS + Marine)
- Tides: NOAA CO-OPS (US) / Admiralty free tier (UK) / FES2014 (global)
- Currents: FES2014 tidal currents + OSCAR ocean currents

**What it is NOT (in MVP):**
- Not a full weather routing engine (no polars, no isochrone optimization)
- Not a live navigation tool (plan-only, not execution)
- Not a chart plotter replacement
- Not an offshore passage tool (coastal focus)

**Why this is the right MVP:**
- Solves the #1 decision recreational sailors face
- Uses freely available data
- Relatively simple computation (no need for full VPP or isochrone routing)
- Clear, measurable value: "Leave at 0700, not 0900, and save 2 hours with a fair tide"
- Natural expansion path to full passage planning

---

## Sources

### Passage Planning Process
- [First Class Sailing - Passage Planning and APEM](https://www.firstclasssailing.com/blog/passage-planning-and-apem/)
- [Sailing Course Online - Passage Planning: The 4 Stages Explained](https://www.sailingcourseonline.co.uk/blog/what-is-passage-planning/)
- [RYA - Passage Planning](https://www.rya.org.uk/water-safety/passage-planning-and-navigation/passage-planning/)
- [Cruising World - Planning an Offshore Passage](https://www.cruisingworld.com/how-to/planning-an-offshore-passage/)
- [MBY - How to plan a safe passage at sea](https://www.mby.com/specials/how-to-plan-a-safe-passage-at-sea-an-expert-guide-135382)
- [Aqua Map - 10-Step Methodology for Passage Planning](https://www.aquamap.app/blog/6-sailing-and-boating/228-10-step-methodology-for-effective-passage-planning)
- [Nautical Know How - Digital Passage Plans for Inspection](https://nauticalknowhow.mysailingcourse.com/digital-passage-plans-for-inspection-what-an-rya-instructor-likes-to-see/)

### Weather and GRIB
- [PassageWeather - Marine Weather Forecasts](https://www.passageweather.com/)
- [OpenGribs - GRIB Sources](https://opengribs.org/en/gribs)
- [LuckGrib - ECMWF Public](https://luckgrib.com/models/ecmwf_public/)
- [Open-Meteo - Marine Weather API](https://open-meteo.com/en/docs/marine-weather-api)
- [NOAA - GFS on AWS](https://registry.opendata.aws/noaa-gfs-bdp-pds/)
- [Stormglass - Marine Weather](https://stormglass.io/marine-weather/)
- [Expedition Marine - Weather](https://www.expeditionmarine.com/weather.html)

### Tides
- [NOAA CO-OPS API](https://api.tidesandcurrents.noaa.gov/api/prod/)
- [NOAA - About Harmonic Constituents](https://tidesandcurrents.noaa.gov/about_harmonic_constituents.html)
- [ADMIRALTY - Tidal Data APIs](https://www.admiralty.co.uk/access-data/apis)
- [ADMIRALTY - EasyTide](https://www.admiralty.co.uk/access-data/tidal-data/easy-tide)
- [FES2014 Global Ocean Tide Atlas](https://os.copernicus.org/articles/17/615/2021/)
- [CNES/aviso-fes (PyFES) on GitHub](https://github.com/CNES/aviso-fes)
- [WorldTides API](https://www.worldtides.info/developer)
- [Stormglass - Global Tide API](https://stormglass.io/global-tide-api/)
- [UKHO - Tidal Harmonic Analysis and Prediction](https://www.gov.uk/algorithmic-transparency-records/ukho-tidal-harmonic-analysis-and-prediction)

### Charts
- [OpenSeaMap](https://map.openseamap.org/)
- [NOAA Custom Chart](https://nauticalcharts.noaa.gov/updates/noaa-custom-chart-version-2-0-now-available-to-the-public/)
- [ADMIRALTY - S-100 Timelines](https://www.admiralty.co.uk/news/s-100-timelines-explained)
- [ADMIRALTY - S-57 to S-101 Transition](https://www.admiralty.co.uk/news/s-57-s-101-explaining-iho-standards-ecdis)
- [OpenCPN - Chart Sources](https://mail.opencpn.org/wiki/dokuwiki/doku.php?id=opencpn:manual_advanced:charts:sources)

### Competitors
- [Savvy Navvy](https://www.savvy-navvy.com/)
- [PredictWind - Weather Routing](https://www.predictwind.com/features/weather-routing)
- [PredictWind - Departure Planning](https://www.predictwind.com/features/departure-planning)
- [OpenCPN Official Site](https://opencpn.org/)
- [Orca - Polar Performance](https://getorca.com/blog/custom_polar_diagrams/)
- [Morgan's Cloud - Orca Navigation Review](https://www.morganscloud.com/2025/12/28/orca-navigation-system-review-part-4-orca-app/)
- [YBW Forum - Savvy Navvy on Android](https://forums.ybw.com/threads/savvy-navvy-on-android-waste-of-money-imho.598702/)
- [Cruisers Forum - Best Apps for Navigation](https://www.cruisersforum.com/forums/f121/best-apps-for-navigation-252544.html)
- [Cruisers Forum - Savvy Navvy](https://www.cruisersforum.com/forums/f121/savvy-navvy-243527.html)

### Algorithms
- [ScienceDirect - Modeling and Optimization Algorithms in Ship Weather Routing](https://www.sciencedirect.com/science/article/pii/S2405535216300043)
- [ScienceDirect - State-of-the-art optimization algorithms in weather routing](https://www.sciencedirect.com/science/article/pii/S0029801825009114)
- [Chalmers Research - Weather Routing Thesis](https://research.chalmers.se/publication/503070/file/503070_Fulltext.pdf)
- [Digital Yacht - CPA and TCPA Alarms Explained](https://digitalyacht.net/2014/04/03/cpa-and-tcpa-alarms-explained/)
- [Cambridge Core - CPA Calculation Method based on AIS](https://www.cambridge.org/core/journals/journal-of-navigation/article/abs/cpa-calculation-method-based-on-ais-position-prediction/45AADA1A32D33870ED30602E269FAD41)
- [NauticEd - How do Polar Plots Work](https://sailing-blog.nauticed.org/how-do-polar-plots-work-on-a-sailboat/)
- [David Burch Navigation Blog - VMC and Polar Diagrams](http://davidburchnavigation.blogspot.com/2022/02/VMC.html)
- [Kavas - Great Circle vs Rhumb Line](https://www.kavas.com/blog/great-circle-and-rhumbline.html)

### AI and Future of Passage Planning
- [ACM - Route Optimization for Sailing Vessels using AI](https://dl.acm.org/doi/fullHtml/10.1145/3581792.3581803)
- [Cruisers Forum - AI Passage Planning and AI Logs](https://www.cruisersforum.com/forums/f121/ai-passage-planning-and-ai-logs-292723.html)
- [Yachting World - How AI is used in racing yachts to weather routing](https://www.yachtingworld.com/yachts-and-gear/forget-chatgpt-heres-how-ai-is-used-in-everything-from-racing-yachts-to-weather-routing-160528)
- [Yachting Monthly - Can you use AI to make a passage plan?](https://www.yachtingmonthly.com/cruising-life/can-you-use-ai-to-make-a-decent-passage-plan-at-sea-would-you-lu-heikell-101283)
- [Ditch Navigation - Passage Planning](https://ditchnavigation.com/blog/passage-planning)

### Port and Cruising Information
- [Noonsite - Cruising Planning Tool](https://www.noonsite.com/)
- [Navily - Cruising Guide](https://www.navily.com/)
- [MarineTraffic - Port Data](https://www.marinetraffic.com/en/data/?asset_type=ports)
