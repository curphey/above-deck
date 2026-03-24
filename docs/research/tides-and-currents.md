# Tidal Data Research for Sailing Navigation Platform

**Date:** 2026-03-24
**Status:** Research complete

---

## Table of Contents

1. [What Sailors Need from Tidal Data](#1-what-sailors-need-from-tidal-data)
2. [Free Tidal Data APIs](#2-free-tidal-data-apis)
3. [Tidal Prediction Algorithms](#3-tidal-prediction-algorithms)
4. [Current and Stream Data Sources](#4-current-and-stream-data-sources)
5. [What Competitors Do with Tides](#5-what-competitors-do-with-tides)
6. [Implementation Recommendations](#6-implementation-recommendations)

---

## 1. What Sailors Need from Tidal Data

### 1.1 Tidal Heights (High/Low Water Times and Heights)

The most fundamental tidal data for any sailor. Required for:

- **Under-keel clearance**: Will there be enough water to enter a harbour, cross a bar, or anchor safely? A vessel drawing 1.8m needs to know if chart depth + tidal height exceeds that at the planned arrival time.
- **Bridge clearance**: Air draft calculations — will the mast clear a fixed bridge at the predicted tide height?
- **Drying heights**: Multihulls and bilge-keelers that can take the ground need to know when they'll be afloat and when they'll dry out.
- **Anchor scope**: The total depth (chart depth + tide) determines how much chain to lay out.

**Data needed**: Time and height of each high water (HW) and low water (LW), plus ideally a continuous curve (typically 10-minute or 30-minute intervals) showing the full tidal profile. Heights must reference a known datum (usually Chart Datum / Lowest Astronomical Tide).

### 1.2 Tidal Streams and Currents (Direction and Rate)

Horizontal water movement caused by the rise and fall of tides. Critical for:

- **Course to steer (CTS)**: The vector sum of boat speed through water + tidal stream = actual track over ground. Without accounting for stream, a vessel can be set miles off course.
- **Speed over ground (SOG)**: A 6-knot boat in a 2-knot foul tide makes only 4 knots over ground. With a fair tide, 8 knots. This dramatically affects passage timing.
- **Fuel planning**: For motor-sailors and motorboats, timing passages with favourable streams can halve fuel consumption.
- **Safety**: Wind-against-tide conditions create steep, breaking seas that can be dangerous — especially in narrow channels, over bars, and around headlands.

**Data needed**: Direction (set) in degrees true and rate (drift) in knots, at specific positions, for each hour of the tidal cycle. Ideally available as a spatial grid, not just at discrete station points.

### 1.3 Tidal Gates

A tidal gate is a location where the tidal stream is so strong that passage is only practical during a limited window. Examples:

- **Portland Bill** (UK): Streams exceed 7 knots at springs. Safe passage only within ~2 hours of slack water.
- **The Needles** (Solent, UK): Timing entry/exit to avoid overfalls.
- **Golden Gate** (San Francisco): Currents up to 6 knots through the strait.
- **Raz de Sein** (Brittany): Notorious tidal race requiring careful timing.

**What sailors need**: A tool that identifies tidal gates along a planned route and calculates departure time to arrive at each gate during the safe window. This is arguably the most valuable tidal feature a navigation platform can offer because:

1. Getting it wrong is dangerous (tide races, overfalls, wind-over-tide)
2. Getting it right saves hours of passage time
3. It requires integrating multiple data sources (stream rates at specific locations, vessel speed, route geometry)
4. Most existing tools force sailors to do this calculation manually

### 1.4 Spring/Neap Cycle Effects

The ~14.7-day spring-neap cycle has major practical effects:

| Factor | Spring Tides | Neap Tides |
|--------|-------------|------------|
| Tidal range | 30-40% greater than mean | 30-40% less than mean |
| Stream rates | 30-40% stronger | 30-40% weaker |
| HW height | Higher than average | Lower than average |
| LW height | Lower than average (less water) | Higher than average (more water) |
| Bar crossings | Deeper at HW, shallower at LW | Less extreme |
| Anchoring | Greater depth variation, more chain needed | More stable |
| Tidal gates | Windows narrower, streams more dangerous | Windows wider, more forgiving |

**Practical impact**: A shallow bar that's safely crossable 4 hours either side of HW on neaps might only be passable 2 hours either side on springs. Conversely, a harbour that dries at LW springs may have enough water at LW neaps.

### 1.5 Tidal Diamonds on Charts

Tidal diamonds are the traditional way stream data appears on admiralty charts:

- Marked as lettered diamond symbols (A, B, C, etc.) at specific positions on the chart
- Referenced to a table showing direction and rate for each hour relative to HW at a standard port
- Separate columns for spring and neap rates
- Rates must be interpolated for intermediate tidal conditions

**Digital equivalent needed**: Replace the manual lookup process with automatic interpolation. When a user taps a point on the chart, show the current stream direction and rate, interpolated for the actual tidal conditions (not just springs/neaps but the actual range on that day).

### 1.6 How Tides Affect Passage Planning Decisions

Tides influence virtually every coastal passage planning decision:

1. **Departure time**: Optimised to carry a fair tide for the maximum portion of the passage
2. **Route selection**: Inshore vs. offshore routes may differ based on stream patterns
3. **Port approach timing**: Ensuring adequate depth on arrival, especially for drying harbours
4. **Waypoint sequencing**: Routing through tidal gates at the right time
5. **Weather windows**: Avoiding wind-against-tide conditions that create dangerous seas
6. **Fuel calculations**: Fair tide = less fuel, foul tide = more fuel
7. **ETA accuracy**: Ignoring tidal streams can produce ETAs off by hours on a long coastal passage

---

## 2. Free Tidal Data APIs

### 2.1 NOAA CO-OPS (US Waters)

**URL**: https://api.tidesandcurrents.noaa.gov/api/prod/

**Coverage**: United States coastline, Great Lakes, US territories. ~3,000+ tide stations and ~2,800 current stations.

**Authentication**: None required (fully public API)

**Rate Limits**: Throttling applied; NOAA recommends implementing sleep statements between calls. No published hard limit.

**Data Format**: JSON, XML, CSV, KML, NetCDF, TXT

**Key Products**:
- `predictions` — Tidal height predictions (hi/lo or interval)
- `currents_predictions` — Current speed/direction predictions
- `water_level` — Observed water levels
- `high_low` — High/low water times and heights
- `hourly_height` — Hourly height predictions

**Data Length Limits**:
- 6-minute interval: 1 month per request
- Hourly: 1 year per request
- High/Low: 1 year per request

**Example Requests**:

```
# Tide predictions (high/low) for a month
GET https://api.tidesandcurrents.noaa.gov/api/prod/datagetter
  ?begin_date=20260401
  &end_date=20260430
  &station=9414290
  &product=predictions
  &datum=MLLW
  &interval=hilo
  &units=metric
  &time_zone=gmt
  &format=json
  &application=above_deck

# Current predictions (10-minute intervals)
GET https://api.tidesandcurrents.noaa.gov/api/prod/datagetter
  ?date=today
  &station=EPT0003
  &product=currents_predictions
  &interval=10
  &bin=14
  &units=metric
  &time_zone=gmt
  &format=json

# Harmonic constituents for a station
GET https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations/9414290/harcon.json
```

**Verdict**: Best free option for US waters. No auth, no cost, well-documented, reliable. The harmonic constituents endpoint is particularly valuable — you can download constituents for every US station and compute predictions client-side.

---

### 2.2 UK Admiralty / UKHO Tidal API

**URL**: https://admiraltyapi.portal.azure-api.net/

**Coverage**: UK and Ireland — 607+ tidal stations

**Tiers**:

| Tier | Cost | Coverage | Predictions |
|------|------|----------|-------------|
| Discovery (free) | £0 | ~40 UK ports | 7 days of high/low only |
| Foundation | £144/year | 607 stations | Current +13 days |
| Premium | Contact UKHO | 607+ stations | Current +1 year, includes streams |

**Authentication**: API key (Ocp-Apim-Subscription-Key header), obtained via Azure API Management portal

**Data Format**: JSON

**Rate Limits**: Discovery tier is heavily restricted. Foundation/Premium have higher limits.

**Limitations**: No harmonic constituent data exposed. Predictions only, not raw harmonics. No current/stream data on Discovery or Foundation tiers — Premium only. UK/Ireland coverage only.

**Verdict**: The free Discovery tier is too limited for production use (only ~40 ports, 7 days). Foundation at £144/year is reasonable for UK-focused apps. For global coverage, look elsewhere.

---

### 2.3 WorldTides

**URL**: https://www.worldtides.info/apidocs

**Coverage**: Global — 8,000+ locations worldwide using satellite telemetry, gauge data, and harmonic analysis.

**Authentication**: API key (passed as `key` query parameter)

**Pricing**:
- 100 free credits on registration
- Pre-paid: $9.99 for 20,000 credits up to $199 for 1,000,000 credits
- Monthly: $4.99/month (20,000 credits) up to $499/month (10,000,000 credits)
- 1 credit = 7-day high/low prediction for one location
- 1 additional credit = 7-day height data at 30-min intervals
- 1 additional credit = datum information

**Data Format**: JSON

**Key Endpoints**:
```
# Tide predictions by coordinates
GET https://www.worldtides.info/api/v3
  ?heights
  &extremes
  &lat=48.38
  &lon=-4.49
  &key=YOUR_KEY

# Station list near a location
GET https://www.worldtides.info/api/v3
  ?stations
  &lat=48.38
  &lon=-4.49
  &key=YOUR_KEY
```

**Licensing Restriction**: Caching predictions for multiple users is explicitly prohibited. Station lists may be cached.

**Verdict**: Good global coverage at low cost. The no-caching restriction is problematic for a platform with shared data. At roughly $0.50 per 10,000 credits, costs can scale quickly for a community platform. The 100 free credits are enough for evaluation only.

---

### 2.4 Stormglass

**URL**: https://stormglass.io / https://docs.stormglass.io

**Coverage**: Global — thousands of tide stations worldwide

**Authentication**: API key (Authorization header)

**Pricing**:

| Tier | Cost | Daily Requests |
|------|------|---------------|
| Free | €0 | 10 requests/day (non-commercial only) |
| Standard | €19/month | 500/day |
| Professional | €49/month | 5,000/day |
| Enterprise | €129/month | 25,000/day |

**Data Available**: Tide levels, high/low extremes, station metadata, distance to nearest station

**Data Format**: JSON

**Key Endpoints**:
```
# Tide extremes (high/low)
GET https://api.stormglass.io/v2/tide/extremes/point
  ?lat=58.7984
  &lng=17.8081
  &start=2026-03-24
  &end=2026-03-31
  Headers: Authorization: YOUR_API_KEY

# Sea level at a point
GET https://api.stormglass.io/v2/tide/sea-level/point
  ?lat=58.7984
  &lng=17.8081
  &start=2026-03-24
  &end=2026-03-25
  Headers: Authorization: YOUR_API_KEY
```

**Verdict**: The free tier (10 req/day, non-commercial) is only useful for prototyping. Commercial use requires paid plans. Good as a supplementary source but too expensive as a primary data provider for a community platform.

---

### 2.5 TideCheck

**URL**: https://tidecheck.com/developers

**Coverage**: Global — 20,000+ stations in 200+ countries

**Authentication**: API key (X-API-Key header)

**Pricing**:

| Tier | Cost | Daily Requests |
|------|------|---------------|
| Free | $0 | 50/day |
| Starter | $9/month | 1,000/day |
| Pro | $29/month | 10,000/day |
| Business | $79/month | 50,000/day |

**Data Available**: Tide predictions (high/low + minute-by-minute time series), sunrise/sunset, moon phases, spring/neap indicators, solunar ratings

**Datums Supported**: LAT, MLLW, MSL

**Data Sources**: NOAA CO-OPS (US), TICON-4 (international, CC-BY-4.0), FES2022

**Response Format**: JSON (ISO 8601 UTC timestamps), CORS-enabled

**Accuracy**: Within 3 minutes and 2cm vs. official NOAA data

**Performance**: Cloudflare Workers edge network, sub-50ms response times globally

**Verdict**: Strong contender for global coverage. The free tier (50 req/day) is enough for development. The $29/month Pro tier (10k/day) is affordable for production. Good accuracy, good datum support, modern API design. No current/stream data though — heights and extremes only.

---

### 2.6 FES2014/FES2022 (AVISO — Global Tidal Model)

**URL**: https://www.aviso.altimetry.fr/en/data/products/auxiliary-products/global-tide-fes.html

**What it is**: Not an API — it's a global tidal atlas providing harmonic constituent data (amplitudes and phases) on a global grid. This is raw harmonic data you compute predictions from.

**Coverage**: Global ocean, 0.0625° resolution (~7km)

**Constituents**: 34 tidal components including:
- Semidiurnal: M2, S2, N2, K2, 2N2, EPS2, L2, T2, La2, Mu2, Nu2, R2
- Diurnal: K1, O1, P1, Q1, S1, J1
- Non-linear: M3, M4, M6, M8, MKS2, MN4, MS4, N4, S4
- Long-period: MSf, Mf, Mm, MSqm, Mtm, Sa, Ssa

**Data Format**: NetCDF grids

**Access**: Free for research/non-commercial use. Requires registration at AVISO. Commercial use requires licence agreement with CNES.

**Software**:
- **PyFES** (Python): Official CNES library for computing predictions from FES data. GitHub: https://github.com/CNES/aviso-fes
- **pyTMD** (Python): Community library supporting FES2014/FES2022, GOT5.6, and other models. GitHub: https://github.com/pyTMD/pyTMD

**Verdict**: The gold standard for global tidal prediction if you want to compute locally. FES2022 is arguably the most accurate global tidal model available. However: (1) it's gridded ocean data — less accurate near complex coastlines than station-based data, (2) the data files are large (several GB), (3) licence restrictions for commercial use, (4) requires implementing the prediction algorithm yourself or using Python libraries. Best suited as a fallback for locations without nearby tide stations.

---

### 2.7 SHOM (French Hydrographic Office)

**URL**: https://services.data.shom.fr

**Coverage**: French coastline (mainland + overseas territories)

**Services**:
- **SUP Marée**: Tide prediction for harbours
- **SAPM**: Tide predictions for arbitrary points at sea
- **Tidal currents**: 2D current grids for Channel/Atlantic coasts, hourly by tidal coefficient

**Access**: Authenticated users with subscription keys. Some data (Maritime Altimetric References — RAM) available under open data licence.

**Data Format**: Various (XML, mesh formats for currents)

**Limitations**: French waters only. Subscription-based access for the useful prediction services.

**Verdict**: Relevant only if specifically serving French waters. The open data portion (RAM) provides reference levels but not predictions. The subscription services are well-regarded but limited in scope.

---

### 2.8 Open-Meteo Marine API

**URL**: https://open-meteo.com/en/docs/marine-weather-api

**Coverage**: Global ocean

**Tidal Data Available**:
- Sea level height including tides (above global MSL)
- Ocean current velocity and direction

**Resolution**: ~8km (0.08°), from MeteoFrance SMOC model

**Cost**: Free for non-commercial use, paid plans for commercial

**Critical Limitation**: The documentation explicitly warns: *"Accuracy at coastal areas is limited. This is not suitable for coastal navigation and does not replace your nautical almanac."* The 8km resolution cannot capture complex coastlines, harbour approaches, or narrow channels — precisely where sailors need accurate tidal data.

**Verdict**: Not suitable for tidal predictions in a sailing context. Useful for open-ocean sea level and current trends only. Do not use for harbour tide predictions or coastal navigation.

---

### 2.9 Other Sources

**Meteomatics** (https://www.meteomatics.com): Offers oceanic tides via API. Commercial product, no free tier for tides.

**Tidetech** (https://docs.tidetech.org): High-resolution tidal and ocean current data. Commercial, aimed at shipping industry. No free tier.

**RapidAPI Tides** (https://rapidapi.com): Various third-party tide APIs aggregated. Quality and reliability varies. Usually wrappers around other sources.

**TICON-4**: International tidal constituent database (CC-BY-4.0 licence). Used by TideCheck and others. Contains harmonic constituents for thousands of global stations. This is the most promising free data source for global harmonic data outside the US.

---

### API Comparison Summary

| API | Coverage | Free Tier | Currents? | Harmonics? | Best For |
|-----|----------|-----------|-----------|------------|----------|
| **NOAA CO-OPS** | US only | Unlimited | Yes | Yes | US waters, harmonic data |
| **UKHO** | UK/Ireland | 40 ports, 7 days | Premium only | No | UK-focused apps |
| **WorldTides** | Global (8k stations) | 100 credits total | No | No | Quick global lookups |
| **Stormglass** | Global | 10 req/day (non-commercial) | No | No | Prototyping |
| **TideCheck** | Global (20k stations) | 50 req/day | No | No | Global production use |
| **FES2022** | Global ocean grid | Research use free | Yes (grid) | Yes (raw) | Offline computation |
| **SHOM** | France | Limited open data | Yes (French coast) | No | French waters |
| **Open-Meteo** | Global ocean | Free (non-commercial) | Yes (8km) | No | Open ocean only |

---

## 3. Tidal Prediction Algorithms

### 3.1 Harmonic Analysis — How It Works

Tidal prediction is based on the principle that ocean tides are the sum of many periodic signals, each caused by a specific astronomical motion in the Earth-Moon-Sun system. This is called **harmonic analysis**.

**Core concept**: The tide at any location can be represented as:

```
h(t) = H₀ + Σ [fᵢ · Hᵢ · cos(aᵢ·t + (V₀ᵢ + uᵢ) - κᵢ)]
```

Where:
- `h(t)` = predicted water height at time t
- `H₀` = mean water level (above datum)
- `Hᵢ` = amplitude of constituent i (specific to the station)
- `aᵢ` = angular speed of constituent i (universal constant, degrees/hour)
- `κᵢ` = phase lag (epoch) of constituent i (specific to the station)
- `fᵢ` = nodal factor (slowly varying correction for the 18.6-year lunar node cycle)
- `V₀ᵢ` = equilibrium argument at the chosen time origin
- `uᵢ` = nodal correction to phase

**The process**:
1. Measure actual water levels at a station for at least 1 year (ideally 19 years for the full lunar nodal cycle)
2. Decompose the observed signal into constituent frequencies using least-squares fitting (analogous to Fourier transform)
3. Extract amplitude (H) and phase (κ) for each constituent — these are the **harmonic constants** specific to that station
4. For predictions, sum the constituents forward in time using the formula above

### 3.2 Key Harmonic Constituents

The 37 constituents used by NOAA, with the most important for practical tidal prediction:

#### Principal Constituents (largest amplitude, most important)

| Symbol | Name | Period (hours) | Speed (°/hr) | Description |
|--------|------|---------------|--------------|-------------|
| **M2** | Principal lunar semidiurnal | 12.4206 | 28.9841 | Largest constituent. Moon's gravitational pull. Two peaks per lunar day. |
| **S2** | Principal solar semidiurnal | 12.0000 | 30.0000 | Sun's gravitational pull. Two peaks per solar day. |
| **N2** | Larger lunar elliptic | 12.6583 | 28.4397 | Moon's elliptical orbit (perigee/apogee variation) |
| **K1** | Lunar-solar diurnal | 23.9345 | 15.0411 | Combined lunar-solar declination effect. One peak per day. |
| **O1** | Principal lunar diurnal | 25.8193 | 13.9430 | Moon's declination. One peak per day. |
| **K2** | Lunar-solar semidiurnal | 11.9672 | 30.0821 | Declination effects on semidiurnal tide |
| **P1** | Principal solar diurnal | 24.0659 | 14.9589 | Sun's declination effect |

#### Why M2 and S2 Create Springs and Neaps

M2 has a period of ~12.42 hours, S2 has exactly 12 hours. They beat against each other with a period of ~14.77 days:

- **Spring tides**: M2 and S2 in phase (new moon and full moon) → amplitudes add
- **Neap tides**: M2 and S2 out of phase (quarter moons) → amplitudes partially cancel

#### Long-Period Constituents

| Symbol | Period | Description |
|--------|--------|-------------|
| **Sa** | ~365.25 days | Annual solar variation (seasonal sea level) |
| **Ssa** | ~182.63 days | Semi-annual solar variation |
| **Mf** | ~13.66 days | Lunar fortnightly |
| **Mm** | ~27.55 days | Monthly lunar variation |

#### Shallow-Water / Non-Linear Constituents

| Symbol | Description |
|--------|-------------|
| **M4** | First overtide of M2 (interaction with seabed in shallow water) |
| **M6** | Second overtide of M2 |
| **MS4** | M2-S2 compound tide |
| **MN4** | M2-N2 compound tide |

These become significant in estuaries and shallow coastal areas where the tidal wave distorts as it interacts with the seabed.

### 3.3 Computing Tidal Height from Harmonic Data

**Step-by-step algorithm**:

1. **Obtain harmonic constants** for the station: list of (constituent_name, amplitude_H, phase_κ) tuples
2. **Look up constituent speeds** from the standard table (these are universal constants)
3. **Compute astronomical arguments** for the prediction time:
   - Calculate V₀ (equilibrium argument) from the astronomical position of Moon and Sun at the time origin
   - Calculate f (nodal factor) and u (nodal correction) for the prediction year — these account for the 18.6-year regression of the lunar nodes
4. **Sum all constituents**:
   ```
   height = mean_level
   for each constituent:
     angle = speed * hours_since_epoch + V0 + u - phase
     height += f * amplitude * cos(angle)
   ```
5. **Add datum offset** to convert from mean level to chart datum

**Practical notes**:
- f and u change slowly (yearly) so can be pre-computed for the year
- V₀ changes with the time origin — typically recalculated at the start of each prediction day
- The astronomical calculations (V₀, f, u) are the most complex part of the implementation
- With 37 constituents, predictions typically agree with observed tides to within ±10-15cm and ±10 minutes (excluding weather effects)

### 3.4 Computing Tidal Streams from Harmonic Data

Tidal streams use the same harmonic approach but predict two components:

- **East-West velocity** (u-component)
- **North-South velocity** (v-component)

Each component has its own set of harmonic constants (amplitude and phase) for each constituent. The prediction formula is the same — you just run it twice (once for u, once for v) and combine:

```
speed = sqrt(u² + v²)
direction = atan2(u, v)  // converted to compass bearing
```

NOAA provides harmonic constants for current stations in the same format as tide stations, but with velocity amplitudes instead of height amplitudes.

### 3.5 Open-Source Implementations

#### JavaScript/TypeScript

**Neaps (tide-predictor)**
- GitHub: https://github.com/neaps/tide-predictor
- TypeScript library with built-in database of 3,370+ NOAA stations
- Predictions for extremes (high/low), timelines, and point queries
- Accuracy: median 0.6-minute timing error, 5mm height error vs NOAA
- Companion database: https://github.com/neaps/tide-database
- MIT licence
- **Best option for a TypeScript/JavaScript project**

**XTide (via libtcd)**
- Original: https://flaterco.com/xtide/
- C-based, but the harmonic data format (.tcd) is well-documented
- Used by OpenCPN and many other marine applications
- Uses the same algorithm as NOAA's official predictions
- GPL licence
- The HARMONIC data files can be parsed by any language

#### Go

**ryan-lang/tides**
- GitHub: https://github.com/ryan-lang/tides
- Go library + CLI for harmonic tidal prediction
- Supports reference and subordinate stations
- Can download NOAA station data directly
- Accuracy: ±0.15m and ±10 minutes vs NOAA
- MIT licence
- v0.1.0 — not yet stable but functional
- **Best option for a Go backend**

#### Python

**pyTMD**
- GitHub: https://github.com/pyTMD/pyTMD
- Full-featured tidal prediction from global models (FES, GOT, etc.)
- Supports tidal heights and currents
- Can work with FES2022, GOT5.6, and other model data

**PyFES**
- GitHub: https://github.com/CNES/aviso-fes
- Official CNES library for FES2022
- Production-quality, well-maintained
- Predicts both heights and currents globally

**Pytides**
- GitHub: https://github.com/sam-cox/pytides
- Lightweight harmonic analysis and prediction
- Supports NOAA constituent set

### 3.6 Accuracy vs. Simplicity Trade-offs

| Approach | Constituents | Accuracy | Complexity | Use Case |
|----------|-------------|----------|------------|----------|
| 4 major (M2, S2, K1, O1) | 4 | ±30-50cm | Low | Rough estimates, educational |
| NOAA standard | 37 | ±10-15cm, ±10min | Medium | Production tidal predictions |
| FES2022 full set | 34 (gridded) | ±5-10cm (open ocean) | High | Global coverage, research |
| Station-based + shallow water | 37 + overtides | ±5-10cm (coastal) | Medium-High | Best coastal accuracy |

**Key trade-off**: More constituents improve accuracy in some locations but not all. The biggest accuracy gains come from:
1. Using station-specific constants (not interpolated grid data)
2. Including shallow-water overtides (M4, M6) for estuarine locations
3. Applying datum corrections properly
4. Accounting for meteorological effects (which harmonics alone cannot predict — wind, atmospheric pressure)

---

## 4. Current and Stream Data Sources

### 4.1 Tidal Streams vs. Ocean Currents — Key Distinction

| Property | Tidal Streams | Ocean Currents |
|----------|--------------|----------------|
| **Cause** | Gravitational forces (Moon/Sun) | Wind, temperature, salinity, Coriolis effect |
| **Predictability** | Highly predictable (harmonic analysis) | Difficult to predict; requires numerical models |
| **Variability** | Reverses direction every ~6 hours | Relatively constant direction (seasonal variation) |
| **Location** | Strongest near coasts, channels, headlands | Dominant in open ocean |
| **Magnitude** | 0-9+ knots in channels | Typically 0.5-2 knots (Gulf Stream up to 5 knots) |
| **Relevance to sailors** | Coastal and channel navigation | Offshore passages |

In UK terminology, "current" refers only to non-tidal flow; "tidal stream" is the tidal component. In US terminology, "tidal current" covers both.

### 4.2 NOAA Current Predictions

**API**: Same CO-OPS API as tides (see Section 2.1)

**Products**:
- `currents_predictions`: Speed and direction at configurable intervals
- `currents`: Observed current data from active stations

**Station types**:
- **Harmonic stations**: Full harmonic data available; predictions at any interval (6-min, 30-min, hourly)
- **Subordinate stations**: Derived from reference stations; only max flood/ebb and slack water times available

**Coverage**: US waters — approximately 2,800 current stations

**Example**:
```
GET https://api.tidesandcurrents.noaa.gov/api/prod/datagetter
  ?date=today
  &station=SFB1203_15
  &product=currents_predictions
  &interval=30
  &units=metric
  &time_zone=gmt
  &format=json
  &vel_type=speed_dir
```

### 4.3 OSCAR (Ocean Surface Current Analysis Real-time)

**URL**: https://podaac.jpl.nasa.gov/ (NASA PO.DAAC)

**What it is**: Global surface current database derived from satellite data (sea surface height, wind, SST).

**Coverage**: Global ocean, 0.25° × 0.25° grid (~28km)

**Temporal resolution**: Daily averages

**Latency**: Three quality levels:
- Near Real Time (NRT): ~2 days latency
- Interim: ~1 month latency
- Final: ~1 year latency

**Data format**: NetCDF4

**Access**: Free, requires NASA Earthdata Login

**Limitations**: Too coarse (28km) for coastal navigation. Represents top-30m average, not surface flow. Does not resolve tidal streams — this is for ocean-scale circulation only.

**Verdict**: Useful for offshore passage planning (e.g., optimising a transatlantic route to use/avoid the Gulf Stream). Not useful for coastal tidal stream predictions.

### 4.4 CMEMS / Copernicus Marine

**URL**: https://marine.copernicus.eu / https://data.marine.copernicus.eu

**What it is**: European Union's marine data service. Free and open access.

**Relevant products**:
- **Global ocean physics** (GLORYS): Reanalysis and forecast of ocean currents, temperature, salinity
- **Regional models**: Higher-resolution models for European seas (IBI for Iberian/Biscay/Ireland, NWS for NW European Shelf, Mediterranean)
- **Tidal data**: Some products include tidal components explicitly

**Resolution**: Global ~8km; regional models down to ~1km

**Access**: Free registration, data available via:
- Web portal (MyOcean Viewer)
- Python toolbox (`copernicusmarine` package)
- OPeNDAP / THREDDS

**Strengths**: High-resolution regional models for European waters are excellent for tidal stream predictions in areas like the English Channel, North Sea, and Mediterranean.

**Limitations**: Large data volumes (NetCDF), complex data access, not a simple REST API for point lookups.

**Verdict**: Best source for European tidal current data. The regional models (especially the NW Shelf model) provide tidal current predictions at resolutions useful for sailing. Requires server-side processing to extract and serve relevant data.

### 4.5 Tidal Atlas Digital Equivalents

Traditional paper tidal atlases (like the Admiralty Tidal Stream Atlases for UK waters) show current arrows for each hour of the tidal cycle on chartlet pages. Digital equivalents include:

- **PredictWind PredictCurrent**: 100m-400m resolution global tidal current model. Commercial, subscription required.
- **Savvy Navvy tidal streams overlay**: Tidal stream visualisation on the chart. Commercial subscription.
- **SHOM tidal current grids**: Digital mesh data for French Channel/Atlantic coasts. Subscription.
- **Aqua Map**: Animated tidal current arrows for US waters. In-app feature.

**Open alternatives**:
- CMEMS regional models (see 4.4) can be processed into tidal atlas-style hourly maps
- FES2022 provides tidal current harmonics on a global grid — can be used to compute current atlas pages
- NOAA current station data can be interpolated between stations for a basic coverage map

---

## 5. What Competitors Do with Tides

### 5.1 Savvy Navvy

**Tidal features**:
- Tidal streams overlay: Toggle-able visual layer showing current direction and strength on the chart
- Tidal height data at stations: Tap to see height curve for selected location
- Route calculation incorporates tidal effects on SOG
- Animated time slider to see how streams change hour by hour

**What they do well**: Seamless integration of tidal data into the routing algorithm. The route accounts for tidal effects on speed and recommends departure times.

**What users note**: Tidal gate awareness appears to be implicit (route calculation avoids unfavourable timing) rather than explicit (no dedicated "tidal gates" feature highlighted in documentation).

### 5.2 Navionics (Garmin)

**Tidal features**:
- Tidal height bars at stations on the chart
- Tidal current arrows at current stations
- Animated playback: scrub through time to see how currents and heights change
- Interrogate individual arrows/bars for details

**What they do well**: Visual presentation is intuitive — coloured arrows with strength indication, height bars that animate.

**What's missing**: Navionics does NOT use tidal data for route optimisation. Users can see tides and currents but the autorouting feature ignores them for timing purposes. There's no departure time optimisation based on tidal conditions. Users on forums have noted this as a significant limitation.

### 5.3 PredictWind (PredictCurrent)

**Tidal features**:
- PredictCurrent: Ultra-high-resolution (100m) tidal current maps
- Global coverage (90% of coastlines)
- Multiple resolution levels: 100m, 400m (within 90km of coast), 4km (to 600km offshore)
- 10-day animated forecasts
- Integration with weather routing — route calculations account for both ocean currents and tidal streams

**What they do well**: Highest-resolution tidal current data in the market. The 100m resolution captures complex near-shore flow patterns that coarser models miss. Weather routing integration means route planning considers currents automatically.

**Limitations**: Requires Standard or Professional subscription. Not available on free tier.

### 5.4 OpenCPN (Tidal Plugin)

**Tidal features**:
- Built-in tide/current predictions using XTide harmonic data
- HARMONIC data files with constituents for thousands of stations worldwide
- Tide height graphs at stations
- Current arrows on chart
- Additional plugins:
  - **oTCurrent**: Tidal current overlay using NOAA data
  - **otidalplan**: Route planning considering tidal streams
  - **UKTides**: UKHO API integration for UK tides
  - **frcurrents**: French tidal current data (SHOM)

**What they do well**: Open-source, extensible, uses the well-established XTide algorithm. Community-contributed plugins fill gaps.

**What's missing**: Fragmented experience — need multiple plugins for a complete picture. No integrated routing optimisation. Tidal stream data outside the US is sparse unless you install region-specific plugins. UI is functional but dated.

### 5.5 What Users Wish Was Better

From forum research (CruisersForums, YBW, SailboatOwners):

1. **Tidal stream accuracy**: Users report atlas predictions can be wildly off — e.g., atlas says 2.1 knots, reality is 5 knots. Tidal diamond rates are generally considered conservative.

2. **Integration with routing**: The number one frustration is that most apps show tidal data but don't USE it for route planning. Savvy Navvy and PredictWind are exceptions.

3. **Tidal gate identification**: No app explicitly identifies tidal gates along a route and calculates optimal departure times. Sailors still do this manually using pilot books and almanacs.

4. **Offline availability**: Users wish tidal apps would pre-cache several days of data when on WiFi, for use at sea without connectivity.

5. **Stream data gaps**: Getting tidal stream overlays working in OpenCPN is difficult. Many regions have height data but no stream data.

6. **Cross-platform issues**: Garmin/Navionics device limits (2 per login) and feature regressions frustrate users.

7. **Current + route interaction**: Users want to see "if I leave at 0600, here's my SOG including tidal effects at each waypoint" — a time-aware route velocity profile.

---

## 6. Implementation Recommendations

### 6.1 Minimum Viable Tidal Feature

**Phase 1 — Tidal Heights (lowest effort, highest immediate value)**:
1. Display high/low water times and heights at stations on the chartplotter
2. Show a tidal curve (height vs. time) when a station is tapped
3. Indicate current tide state (rising/falling, hours to next HW/LW)
4. Spring/neap indicator for the current date

**Phase 2 — Tidal Streams (medium effort, high value)**:
1. Animated tidal stream arrows on the chart (direction + strength)
2. Time slider to scrub through the tidal cycle
3. Colour-coded strength (e.g., green < 1kt, amber 1-3kt, red > 3kt)

**Phase 3 — Tidal Gate Intelligence (highest effort, differentiating value)**:
1. Identify tidal gates along a route (locations where stream exceeds vessel speed or a configurable threshold)
2. Calculate optimal departure time to transit gates safely
3. Show time-aware SOG profile for the passage
4. Warn about wind-against-tide conditions

### 6.2 Best Free API for Global Coverage

**Recommended approach: Hybrid**

| Use Case | Data Source | Why |
|----------|-----------|-----|
| US waters (heights) | NOAA CO-OPS | Free, unlimited, includes harmonics |
| US waters (currents) | NOAA CO-OPS | Free, includes current predictions |
| UK/Ireland (heights) | UKHO Foundation (£144/yr) or TideCheck | Good station density |
| Global heights | TideCheck ($29/month for 10k/day) | Best coverage/price ratio |
| Global fallback | FES2022 harmonics (computed server-side) | Fills gaps where no station exists |
| European currents | CMEMS regional models | Free, high resolution |
| Global ocean currents | OSCAR or CMEMS global | Free, for offshore routing |

**Single-source recommendation**: If choosing one API for global coverage, **TideCheck** offers the best balance of coverage (20k+ stations), price ($29/month), accuracy (uses NOAA + TICON-4 + FES2022), and developer experience (modern REST API, fast responses, CORS-enabled).

### 6.3 Client-Side Harmonics vs. API — Decision Matrix

| Factor | Client-Side Harmonics | API Calls |
|--------|----------------------|-----------|
| **Offline support** | Excellent — compute locally with no network | Requires caching or pre-fetching |
| **Latency** | Near-instant (<1ms) | 50ms-500ms per request |
| **Cost** | Free (one-time data download) | Per-request or monthly subscription |
| **Accuracy** | Same as source data (NOAA-equivalent) | Same as source data |
| **Coverage** | Limited to stations with available harmonics | Depends on API provider |
| **Maintenance** | Must update harmonic data periodically | API provider handles updates |
| **Bundle size** | ~2-5MB for full NOAA dataset | Zero client-side data |
| **Current/stream data** | Harder — need separate current harmonics | API may include both |

**Recommendation**: Use a **hybrid approach**:

1. **Download and bundle harmonic constituent data** for major ports and stations (NOAA US + TICON-4 international, via the Neaps tide-database). This enables offline tide height predictions — critical for sailors at sea without connectivity.

2. **Use a Go backend service** to compute predictions from harmonics server-side for broader coverage (using ryan-lang/tides or a custom implementation). This avoids shipping large harmonic datasets to the client.

3. **Fall back to TideCheck API** for stations where you don't have harmonic data, and for current/stream predictions.

4. **For tidal current overlays**, process CMEMS/FES2022 data server-side into pre-computed hourly tiles that can be served as vector tile overlays on MapLibre.

### 6.4 Visualising Tidal Data on a Chart

**Tidal Heights**:
- Station markers on the chart (small tide icon)
- Tap to expand: shows tidal curve with HW/LW marked, current time indicator, spring/neap annotation
- Height bar showing current level relative to chart datum (like Navionics)
- Colour coding: blue for normal, amber for heights approaching chart datum

**Tidal Streams/Currents**:
- **Animated arrows** at grid points or station locations
  - Arrow direction = stream set (direction water is flowing TOWARDS)
  - Arrow size/length = stream rate in knots
  - Colour = strength (green < 1kt, amber 1-3kt, red > 3kt)
- **Particle animation** (like Windy.com) for a more intuitive flow visualisation — requires WebGL
- **Time slider** at bottom of chart to scrub through the 12-hour tidal cycle
- Stream rate and direction displayed as text on hover/tap

**Tidal Gates on Route**:
- Highlighted waypoints where stream exceeds threshold
- Red/amber/green timeline showing gate windows along the route
- "Departure time optimiser" — drag a slider to see how changing departure affects gate arrivals

**Technical approach for MapLibre integration**:
- Tidal stream data as GeoJSON point features with direction/speed properties
- Render arrows using MapLibre symbol layers with `icon-rotate` bound to direction
- Animate by updating the GeoJSON source at the current time step
- For particle animation: use a custom WebGL layer (like mapbox-gl-wind or similar)
- Pre-compute hourly snapshots server-side, serve as vector tiles or GeoJSON endpoints

---

## Sources

### APIs and Data Services
- [NOAA CO-OPS Data Retrieval API](https://api.tidesandcurrents.noaa.gov/api/prod/)
- [NOAA CO-OPS Metadata API](https://api.tidesandcurrents.noaa.gov/mdapi/prod/)
- [NOAA Harmonic Constituents](https://tidesandcurrents.noaa.gov/about_harmonic_constituents.html)
- [NOAA API URL Builder](https://tidesandcurrents.noaa.gov/api-helper/url-generator.html)
- [UK Admiralty Tidal API](https://admiraltyapi.portal.azure-api.net/)
- [UKHO Tidal API Launch](https://www.admiralty.co.uk/news/all-news/new-tidal-api-platform-launched-with-expanded-coverage-for-british-and-irish-waters)
- [WorldTides API Docs](https://www.worldtides.info/apidocs)
- [WorldTides Developer/Pricing](https://www.worldtides.info/developer)
- [Stormglass Tide API](https://stormglass.io/global-tide-api/)
- [Stormglass Docs](https://docs.stormglass.io)
- [TideCheck Developers](https://tidecheck.com/developers)
- [Open-Meteo Marine API](https://open-meteo.com/en/docs/marine-weather-api)
- [SHOM Data Services](https://services.data.shom.fr/support/en/services/spm)
- [FES2022/AVISO](https://www.aviso.altimetry.fr/en/data/products/auxiliary-products/global-tide-fes.html)
- [OSCAR via PO.DAAC](https://podaac.jpl.nasa.gov/dataset/OSCAR_L4_OC_NRT_V2.0)
- [CMEMS Copernicus Marine](https://marine.copernicus.eu/access-data/)

### Open-Source Libraries
- [Neaps tide-predictor (TypeScript)](https://github.com/neaps/tide-predictor)
- [Neaps tide-database](https://github.com/neaps/tide-database)
- [ryan-lang/tides (Go)](https://github.com/ryan-lang/tides)
- [PyFES (Python, CNES)](https://github.com/CNES/aviso-fes)
- [pyTMD (Python)](https://github.com/pyTMD/pyTMD)
- [Pytides (Python)](https://github.com/sam-cox/pytides)
- [XTide](https://flaterco.com/xtide/)
- [OpenCPN Tides and Currents](https://opencpn.org/wiki/dokuwiki/doku.php?id=opencpn:manual_basic:set_options:charts:tides-currents)

### Competitors
- [Savvy Navvy Tides](https://www.savvy-navvy.com/user-guide/tides-2)
- [Navionics Weather & Tides](https://www.navionics.com/features/weather-tides)
- [PredictWind PredictCurrent](https://www.predictwind.com/predictcurrent)
- [PredictWind Tidal Currents FAQ](https://help.predictwind.com/en/articles/10848176-faq-tidal-currents)

### Sailing and Navigation References
- [Tidal Gates in Passage Planning](https://jollyparrot.co.uk/blog/why-is-tide-so-important-when-passage-planning)
- [Tidal Diamonds Explained (Wikipedia)](https://en.wikipedia.org/wiki/Tidal_diamond)
- [Spring vs Neap Tides Planning](https://marinerstudio.com/tides/spring-tides-vs-neap-tides-planning-around-the-cycle/)
- [Tidal Streams vs Ocean Currents (NOAA)](https://oceanservice.noaa.gov/facts/tidescurrents.html)
- [Harmonic Analysis of Tides (Stony Brook)](https://www.math.stonybrook.edu/~tony/tides/harmonic.html)
