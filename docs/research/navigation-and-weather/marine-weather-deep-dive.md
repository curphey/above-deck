# Marine Weather Data Deep Dive

**Date:** 2026-03-24

Research for building marine weather features into a sailing navigation platform.

---

## 1. What Sailors Need from Weather Data

### Wind (Speed, Direction, Gusts)

Wind is the primary driver of sailing performance and safety. Sailors need:

- **Surface wind speed** (10m reference height) in knots, both sustained and gusts
- **Wind direction** (true, not magnetic) — determines sail trim, tacking angles, routing
- **Gust factor** — the ratio of peak gust to sustained wind; critical for reef decisions
- **Wind aloft** — wind at mast height differs from surface readings. Over open water, the wind gradient causes a 20-30% reduction of geostrophic wind at the surface. This means the top of a tall mast sees noticeably more wind than deck-level instruments. Wind shear (directional change with height) affects apparent wind angle, making one tack faster than the other
- **Trend** — is wind building, dying, or shifting? A veering wind (clockwise shift in Northern Hemisphere) typically indicates a passing front

**Resolution needed:** Hourly for coastal, 3-6 hourly for ocean passages. Spatial resolution of 0.25 degrees (28 km) is acceptable for open ocean; 3-5 km preferred for coastal.

### Waves (Height, Period, Direction, Swell vs Wind Waves)

Wave data is critical for both safety and comfort:

- **Significant wave height (Hs)** — the average of the highest third of waves
- **Wave period** — short period (< 8s) wind waves are steep and uncomfortable; long period (> 12s) swell is generally manageable
- **Wave direction** — waves on the beam cause rolling; following seas can cause broaching
- **Swell vs wind waves** — these are separate phenomena. A 2m swell with 12s period is fine; 2m wind waves at 5s period is miserable. Good APIs separate these (Open-Meteo provides primary, secondary, and tertiary swell separately)
- **Wave steepness** — derived from height/period, indicates breaking risk

### Visibility, Fog, Precipitation

- **Visibility distance** in nautical miles — below 1nm triggers restricted visibility rules under COLREGS
- **Fog probability** — radiation fog (overnight cooling) vs advection fog (warm air over cold water) have different patterns
- **Precipitation type and intensity** — heavy rain reduces visibility and radar effectiveness
- **Cloud cover** — affects solar charging (critical for off-grid boats) and star-sight navigation

### Barometric Pressure and Trends

The single most important weather instrument aboard:

- **Absolute pressure** in hPa/mb — context for synoptic situation
- **Pressure trend** — a fall of 3+ hPa in 3 hours is a storm warning sign
- **Pressure gradient** — tightly packed isobars = strong winds
- Sailors traditionally log pressure every 3 hours and watch for sudden drops. A drop of 1 hPa/hour is concerning; 2+ hPa/hour is emergency-level

### Sea Surface Temperature (SST)

- Affects fog formation (warm air over cold SST = advection fog)
- Gulf Stream / current boundaries create steep temperature gradients and confused seas
- Important for tropical cyclone development (> 26.5C threshold)
- Relevant for fishing and swimming comfort

### Lightning / Thunderstorm Risk

- **CAPE (Convective Available Potential Energy)** — values above 1000 J/kg indicate thunderstorm potential
- **Lifted Index** — negative values suggest instability
- Lightning at sea is especially dangerous — a boat is the tallest object
- Thunderstorms can produce 50+ knot microbursts with zero warning on instruments

### Tropical Storm / Cyclone Tracking

- 34-knot wind radius defines tropical storm force extent
- 5-day forecast cone with uncertainty
- Storm surge predictions for coastal areas
- Sailors need at least 3-5 days warning to reach a hurricane hole or shelter
- Season awareness: June-November (Atlantic), May-November (Eastern Pacific), year-round (Western Pacific)

### Forecast Horizon: Coastal vs Ocean

| Sailing context | Useful forecast range | Update frequency needed |
|---|---|---|
| Day sail (< 30nm) | 24-48 hours | Morning of departure |
| Coastal cruise (30-100nm) | 3-5 days | Daily |
| Offshore passage (100-500nm) | 5-7 days | Every 12 hours |
| Ocean crossing (500+ nm) | 7-16 days (with decreasing confidence) | Every 6-12 hours |
| Departure planning | 10-14 days (to pick weather window) | Daily until departure |

Beyond 7-8 days, forecasts are only useful for identifying general patterns (high pressure windows, frontal timing). For slow-moving sailboats doing 100-200 nm/day, climatological data becomes more useful than extended forecasts for mid-ocean decisions. Weather routing is most practical for fast boats covering 400+ nm/day.

---

## 2. Weather Forecast Models

### GFS (Global Forecast System) — NOAA

| Property | Detail |
|---|---|
| **Operator** | NOAA / NCEP (United States) |
| **Resolution** | 0.25 degrees (~28 km) globally |
| **Update frequency** | 4x daily (00, 06, 12, 18 UTC) |
| **Forecast horizon** | 384 hours (16 days) |
| **Output interval** | Hourly to 120h, then 3-hourly to 384h |
| **Data access** | Free, public domain (US government) |
| **Access methods** | NOMADS HTTPS, GRIB filter, OpenDAP, AWS Open Data |
| **Marine parameters** | Wind (10m), pressure, precipitation, temperature, humidity, cloud cover. Wave data via WaveWatch III (separate model) |

**Strengths:** Free, open, widely available, 4x daily updates, 16-day horizon. The most accessible global model for developers. Available on AWS as open data (0.25 and 0.5 degree resolution, trailing 30-day window).

**Weaknesses:** Lower resolution than ECMWF (28 km vs 14 km). Generally less accurate than ECMWF beyond day 3-5, particularly for European and tropical weather.

### ECMWF (European Centre for Medium-Range Weather Forecasts)

| Property | Detail |
|---|---|
| **Operator** | ECMWF (intergovernmental, 35 member states) |
| **Resolution** | ~9 km (0.1 degrees) native; open data at 0.25 degrees |
| **Update frequency** | 4x daily (00, 06, 12, 18 UTC) |
| **Forecast horizon** | 240 hours (10 days) at high-res; 360 hours (15 days) extended |
| **Data access** | **Fully open as of October 2025** (CC-BY-4.0 license) |
| **Marine parameters** | Wind, pressure, waves (via ECMWF WAM), SST, currents |

**Strengths:** Widely considered the "gold standard" — consistently outperforms GFS in statistical verification, especially 3-10 days out. The ECMWF WAM (Wave Model) provides excellent swell and wind-wave separation. As of October 2025, ECMWF has made its entire Real-time Catalogue open to all at maximum resolution with no data cost.

**Weaknesses:** Historically expensive and restricted. Even with the 2025 open data policy, the full native resolution may have practical access limitations. Data retention is only ~2-3 days (most recent 12 forecast runs). Fewer daily updates compared to GFS historically, though now 4x daily.

**The 2025 open data change is significant.** Previously, ECMWF data cost hundreds of thousands per year and was used only by top racing teams and national weather services. Now it's CC-BY-4.0.

### NAM (North American Mesoscale) & HRRR (High Resolution Rapid Refresh)

| Property | NAM | HRRR |
|---|---|---|
| **Operator** | NOAA/NCEP | NOAA/NCEP |
| **Resolution** | 12 km (NAM); 3 km (NAM Nest) | 3 km |
| **Coverage** | North America | CONUS only |
| **Update frequency** | 4x daily | Hourly |
| **Forecast horizon** | 84 hours (3.5 days) | 18-48 hours |
| **Data access** | Free (NOMADS) | Free (NOMADS) |

**Marine relevance:** HRRR's 3 km resolution and hourly updates make it excellent for coastal sailing in US waters — it captures sea breeze effects, thunderstorm cells, and coastal convergence zones that global models miss. NAM provides the 3.5-day view for US coastal planning.

**Limitation:** US-only. No use for European, Caribbean, or Pacific sailing.

### ICON (Icosahedral Nonhydrostatic) — DWD

| Property | ICON-13 (Global) | ICON-EU (Europe) | ICON-D2 (Central Europe) |
|---|---|---|---|
| **Operator** | DWD (Germany) | DWD | DWD |
| **Resolution** | 13 km | 7 km | 2.2 km |
| **Update frequency** | 4x daily | 4x daily | 8x daily |
| **Forecast horizon** | 180h (00/12Z), 120h (06/18Z) | 120 hours | 48 hours |
| **Data access** | Free (DWD Open Data) | Free | Free |

**Marine relevance:** ICON-EU at 7 km resolution is excellent for Mediterranean, North Sea, Baltic, and English Channel sailing. ICON-D2 at 2.2 km is the highest-resolution operational model available for free in that region. DWD provides data openly and it is consumed by many third-party services including Open-Meteo.

**Strengths:** Higher resolution than GFS in Europe. ICON-EU is often considered more accurate than ECMWF for European short-range forecasts due to better resolution. Free and open data.

### WRF (Weather Research and Forecasting Model)

| Property | Detail |
|---|---|
| **Type** | Community mesoscale model (not an operational service) |
| **Operator** | NCAR / NOAA / USAF / universities |
| **Resolution** | User-configurable (typically 1-50 km) |
| **Community** | 30,000+ registered users in 150+ countries |
| **License** | Open source |

**Marine relevance:** WRF is not a data source you consume — it's a model you run yourself. Used by institutions like Rutgers RUCOOL for high-resolution coastal ocean-atmosphere coupled forecasts. Several commercial weather services (PredictWind's PWG and PWE models) run custom WRF configurations for their sailing forecasts.

**For our platform:** Not directly useful as a data source, but relevant to understand because PredictWind and other competitors run proprietary WRF configurations as a differentiator.

### Model Comparison Summary

| Model | Resolution | Coverage | Horizon | Free? | Best for |
|---|---|---|---|---|---|
| GFS | 28 km | Global | 16 days | Yes | Ocean passages, global coverage |
| ECMWF | 9-14 km | Global | 10-15 days | Yes (since Oct 2025) | Best accuracy 3-10 days out |
| NAM/HRRR | 3-12 km | North America | 18h-3.5d | Yes | US coastal day-of sailing |
| ICON | 2.2-13 km | Global/Europe | 2-7.5 days | Yes | European coastal sailing |
| WRF | 1-50 km | Custom | Custom | N/A (run yourself) | Custom high-res regional |

**Best for marine use:** ECMWF for accuracy, GFS for accessibility and longer range, ICON-EU for European coastal waters, HRRR for US coastal day-of decisions.

---

## 3. GRIB Files

### What is a GRIB File?

GRIB (GRIdded Binary, or General Regularly-distributed Information in Binary form) is a WMO (World Meteorological Organization) standard binary format for storing gridded meteorological data. It is the native output format of numerical weather prediction models.

**Key characteristics:**
- Highly compressed binary format — designed for low-bandwidth transfer
- Self-describing: contains metadata about grid, parameters, time, and projection
- Two versions: GRIB1 (older, simpler) and GRIB2 (current standard, more complex but more efficient)
- Each GRIB "message" contains one parameter at one time step at one level
- A GRIB file is typically a concatenation of many messages

**Structure of a GRIB2 message:**
1. **Indicator Section** — "GRIB" marker and edition number
2. **Identification Section** — originating center, reference time
3. **Grid Definition Section** — projection, grid dimensions, lat/lon bounds
4. **Product Definition Section** — parameter (wind, pressure, etc.), level, forecast time
5. **Data Representation Section** — packing method
6. **Data Section** — the actual values (compressed)
7. **End Section** — "7777" marker

### Where to Get Free GRIB Data

| Source | URL | What you get | How |
|---|---|---|---|
| **NOAA NOMADS** | https://nomads.ncep.noaa.gov/ | GFS, NAM, HRRR, WW3, all NCEP models | HTTPS, GRIB filter (subset by area/variable), OpenDAP |
| **NOAA on AWS** | https://registry.opendata.aws/noaa-gfs-bdp-pds/ | GFS 0.25/0.5 degree | S3 bucket, trailing 30-day window |
| **Saildocs** | query@saildocs.com | GFS, ECMWF subsets | Email request — designed for satellite/SSB |
| **DWD Open Data** | https://opendata.dwd.de/ | ICON global, ICON-EU, ICON-D2 | HTTPS directory listing |
| **ECMWF Open Data** | https://data.ecmwf.int/ | IFS, AIFS, WAM | ECMWF API, CC-BY-4.0 |
| **Open-Meteo** | https://open-meteo.com/ | Pre-processed JSON from multiple models | REST API (not raw GRIB) |

**NOMADS GRIB Filter** is particularly useful — you can request a specific geographic area, specific variables (e.g., just wind U/V at 10m), and specific forecast hours, dramatically reducing download size.

**Saildocs** is the critical service for offshore sailors. Send an email to query@saildocs.com with a request like:
```
send gfs:40N,60N,140W,120W|2,2|24,48,72|WIND,PRESS
```
This returns a GRIB file as an email attachment — works over SSB radio (SailMail/Winlink), Iridium, satellite phone.

### GRIB Viewers

| Viewer | Platform | License | Notes |
|---|---|---|---|
| **XyGrib** | Windows, Mac, Linux | GPLv3 (open source) | Leading open-source GRIB viewer. Free downloads from NOAA. Excellent for pre-departure planning |
| **LuckGrib** | macOS, iOS | Commercial | Elegant, fast. Direct downloads from NOAA. Supports offline use. "Offshore Compact" format at 50% of GRIB size |
| **OpenCPN GRIB Plugin** | Windows, Mac, Linux | GPLv2+ | Overlays weather on navigation chart. Part of the OpenCPN ecosystem |
| **PredictWind Offshore** | iOS, Android, Desktop | Commercial | Proprietary format. 4 weather models. 6KB compact files for satellite download |
| **qtVlm** | Windows, Mac, Linux | Free | Virtual regatta + GRIB viewer + weather routing combined |
| **SailGrib** | Android | Commercial | Android-focused GRIB viewer with routing |

### How to Parse GRIB in JavaScript

| Library | NPM Package | Notes |
|---|---|---|
| **grib2-simple** | `grib2-simple` | Node.js, plain JS, handles DWD GRIB2 files. Minimal dependencies |
| **grib22json** | — | Browser-side GRIB2 decoder (client-side, reduces server complexity). Demo at https://bluenetcat.github.io/grib22json |
| **vgrib2** | `vgrib2` | TypeScript library for GRIB2 parsing |
| **gribjs** | — | Reads GRIB2 files, retrieves grid dimensions and parameters |
| **opengrib2** | — | Native JS utility for GRIB2, works in Node and browser |
| **weacast-grib2json** | `weacast-grib2json` | CLI tool wrapping Java THREDDS GRIB decoder, outputs JSON |

**Recommended approach:** For server-side processing, `grib2-simple` or `vgrib2` (TypeScript). For browser-side rendering, `grib22json`. For the Go API server, use a Go library (see below).

### How to Parse GRIB in Go

| Library | Repository | Notes |
|---|---|---|
| **nilsmagnus/grib** | https://github.com/nilsmagnus/grib | Most mature Go GRIB2 parser. Zero dependencies. Usable as both CLI and library |
| **amsokol/go-grib2** | https://github.com/amsokol/go-grib2 | Port of wgrib2 C code to Go. Thread-safe (unlike wgrib2) |
| **sdifrance/go-grib2** | https://github.com/sdifrance/go-grib2 | Fork of amsokol with ongoing maintenance |
| **csnight/storm-gfs-decoder** | https://github.com/csnight/storm-gfs-decoder | Go port of Java UCAR GRIB decoder, specifically for GFS data |

**Recommended:** `nilsmagnus/grib` — zero dependencies, pure Go, actively maintained, usable as library.

### File Sizes and Bandwidth Considerations

| Scenario | Approx size |
|---|---|
| 10-day wind+rain, 7x14 degrees, 0.25 degree grid | ~345 KB |
| Same area at 1-degree grid | ~43 KB |
| PredictWind Offshore Compact routing file | ~6 KB |
| LuckGrib Offshore Compact (50% of GRIB) | 50% of equivalent GRIB |
| Full GFS global 0.25 degree, single time step, all levels | ~300 MB |
| SailMail limit (HF radio) | 30 KB (10 KB for Pactor-2) |

**Key insight:** Grid spacing has the biggest effect on file size — a 1x1 degree file is 4x larger than a 2x2 degree file covering the same area. For offshore satellite use, request coarse grids (1-2 degree) with minimal parameters (wind + pressure only). For coastal use with internet, 0.25 degree is practical.

**Bandwidth hierarchy for offshore sailors:**
1. Starlink (where available) — full internet, download anything
2. Iridium GO / satellite phone — email-based GRIB (30-100 KB practical)
3. SSB radio + SailMail/Winlink — 30 KB max, very slow
4. Iridium SBD / inReach — 160 character text responses (FastSeas format)

---

## 4. Free Weather APIs for Marine Use

### Open-Meteo Marine API (RECOMMENDED)

| Property | Detail |
|---|---|
| **URL** | https://marine-api.open-meteo.com/v1/marine |
| **Auth** | No API key required (non-commercial) |
| **Rate limits** | 600/min, 5,000/hour, 10,000/day, 300,000/month |
| **Forecast range** | 7-16 days (model dependent) |
| **Resolution** | 5 km (Europe), 9 km (ECMWF WAM global), 25 km (multiple models) |
| **Format** | JSON |
| **Coverage** | Global oceans |
| **Commercial use** | Requires paid plan |

**Marine-specific parameters (hourly):**
- `wave_height`, `wave_direction`, `wave_period`, `wave_peak_period`
- `wind_wave_height`, `wind_wave_direction`, `wind_wave_period`, `wind_wave_peak_period`
- `swell_wave_height`, `swell_wave_direction`, `swell_wave_period`, `swell_wave_peak_period`
- Secondary and tertiary swell (same parameters)
- `ocean_current_velocity`, `ocean_current_direction`
- `sea_surface_temperature`
- `sea_level_height_msl` (tide-related, 8 km resolution — use with caution for complex coastlines)

**Models available:** MeteoFrance MFWAM, ECMWF WAM, GFS Wave (WaveWatch III), DWD EWAM/GWAM, ERA5-Ocean (historical back to 1940).

**Important:** The marine API only provides wave/ocean data. Combine with the regular weather API (`https://api.open-meteo.com/v1/forecast`) at the same coordinates for wind, pressure, precipitation, visibility, cloud cover, etc.

**Verdict:** Best free option for marine weather. Excellent parameter coverage, good rate limits, no API key needed for non-commercial use. The swell/wind-wave separation is critical for sailors and most APIs don't provide this.

### NOAA GFS Direct Access

| Property | Detail |
|---|---|
| **URL** | https://nomads.ncep.noaa.gov/ (GRIB) or via Open-Meteo GFS API |
| **Auth** | None (public domain) |
| **Rate limits** | No formal API rate limit, but heavy automated access may be throttled |
| **Forecast range** | 16 days |
| **Resolution** | 0.25 degrees (~28 km) |
| **Format** | GRIB2 (raw) or JSON via Open-Meteo proxy |
| **Coverage** | Global |
| **Cost** | Free (US government public domain) |

**Marine parameters:** Wind 10m (U/V components), pressure, precipitation, temperature, humidity, cloud cover. Wave data via WaveWatch III (separate GRIB files).

**Access methods:**
1. **NOMADS GRIB filter** — subset by area and variable, download via HTTPS
2. **AWS Open Data** — S3 bucket with GFS at 0.25/0.5 degree
3. **Open-Meteo GFS API** — https://open-meteo.com/en/docs/gfs-api (processed JSON, easiest to use)
4. **READY Web API** — https://apps.arl.noaa.gov/ready2 (250 calls/day, requires registration)

**Verdict:** Best raw data source — free, comprehensive, public domain. But raw GRIB requires server-side processing. Use Open-Meteo as a convenient proxy for most use cases.

### Stormglass

| Property | Detail |
|---|---|
| **URL** | https://api.stormglass.io/v2/ |
| **Auth** | API key required (free registration) |
| **Free tier** | 10 requests/day (non-commercial only) |
| **Paid tiers** | From $19/month (1,000 req/day) to enterprise |
| **Forecast range** | 10 days |
| **Resolution** | Aggregates multiple models |
| **Format** | JSON |
| **Coverage** | Global |

**Marine parameters:** Wind speed/direction/gust, wave height/direction/period, swell height/direction/period, water temperature, air temperature, cloud cover, precipitation, visibility, currents, tides.

**Unique feature:** Aggregates data from multiple sources (ECMWF, NOAA, Met Office, DWD, FMI) transparently — you can see each provider's value individually or use their AI-selected "best" value. Now includes NOAA AIGFS and ECMWF AIFS (AI-based forecasting models).

**Verdict:** Excellent marine data quality, but 10 requests/day free tier is useless for a real application. Only viable with a paid plan.

### OpenWeatherMap

| Property | Detail |
|---|---|
| **URL** | https://api.openweathermap.org/ |
| **Auth** | API key required |
| **Free tier** | 60 calls/minute, 1,000,000 calls/month (One Call 3.0: 1,000 calls/day free) |
| **Forecast range** | 5 days (free), 16 days (paid) |
| **Format** | JSON |
| **Coverage** | Global (land-focused) |

**Marine-specific features:** Minimal. No dedicated marine API. No wave data. No swell separation. No ocean currents. Wind and pressure data works over ocean coordinates, but this is a terrestrial weather API that happens to have global coverage.

**Verdict:** Not suitable for marine use. Lacks wave, swell, current, and SST data.

### Visual Crossing

| Property | Detail |
|---|---|
| **URL** | https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/ |
| **Auth** | API key required |
| **Free tier** | 1,000 records/day (commercial use allowed) |
| **Forecast range** | 15 days |
| **Format** | JSON, CSV |
| **Coverage** | Global |

**Marine parameters:** Wave heights, wave direction, swell heights, swell periods for ocean locations. Also includes wind, pressure, visibility, cloud cover.

**Verdict:** Decent free tier with commercial use allowed. Has some marine parameters. A reasonable backup or supplement, but not as comprehensive as Open-Meteo's marine API for wave data.

### Windy API

| Property | Detail |
|---|---|
| **URL** | https://api.windy.com/ |
| **Auth** | API key required |
| **Free tier** | Map Forecast API is embeddable (limited features). Point Forecast API requires paid subscription |
| **Paid plan** | $720/year (up to 5,000 unique visitors/day) |
| **Models** | ECMWF, GFS, ICON, NAM, and 40+ layers |
| **Format** | JSON |

**Marine features:** Wind, waves, currents, pressure, temperature, cloud cover — same data as the Windy.com website. Map Forecast API embeds the Windy animated map (wind, rain, clouds, temperature, pressure, currents, waves layers).

**Verdict:** The Map Forecast embed is interesting for visualization but is a black-box iframe. Point Forecast API is $720/year minimum. Better to use Open-Meteo for data and build our own visualization.

### Comparison: Best Free Marine API

| Criterion | Open-Meteo | NOAA GFS | Stormglass | Visual Crossing | Windy |
|---|---|---|---|---|---|
| Wave data | Excellent (3 swell components) | Yes (WW3 separate) | Excellent | Basic | Good |
| Wind | Via weather API | Yes | Yes | Yes | Yes |
| Currents | Yes | Via OSCAR | Yes | No | Yes |
| SST | Yes | Yes | Yes | No | Yes |
| Rate limit (free) | 10,000/day | Unlimited (GRIB) | 10/day | 1,000 records/day | N/A (paid) |
| Ease of use | Excellent (REST JSON) | Hard (GRIB parsing) | Excellent | Good | Good |
| Commercial use (free) | No | Yes (public domain) | No | Yes | No |
| **Recommendation** | **PRIMARY** | **Backup / raw data** | Paid only | Supplement | Too expensive |

**Winner: Open-Meteo** for the marine API (wave/ocean) combined with Open-Meteo weather API (wind/pressure/visibility) at the same coordinates. For commercial use, NOAA GFS direct access (public domain) with server-side GRIB processing.

---

## 5. What Competitors Do

### PredictWind

**Key features:**
- **Departure planning** — compares 4 departure dates across 4 weather models, showing wind/wave/current conditions for each. Performs "16 billion calculations" in the cloud. Calculates hull-specific roll, vertical acceleration, and slamming incidence
- **Weather routing** — isochrone-based optimal route calculation. Comfort mode (user-defined max wind/wave limits) vs speed mode (wave polars adjust boat speed by wave height/angle)
- **4 proprietary models** — PWG and PWE (custom WRF configurations), plus GFS and ECMWF. Having their own models is a key differentiator
- **Offshore app** — downloads compact weather files (6 KB) for satellite/low-bandwidth use
- **Email responder** — works with Iridium, satellite phones, SSB radio

**Pricing:** Free basic; Professional $249/year; Offshore $349/year.

**What sailors like:** Model comparison (seeing 4 models side-by-side builds confidence), departure planning is killer feature, offshore compact files.

**What sailors complain about:** Complex UI, subscription pricing feels expensive, routing sometimes suggests unrealistic routes near coast.

### Windy.com

**Key features:**
- **Beautiful animated visualization** — the gold standard for weather map UX. Wind particles, color-coded layers, smooth time animation
- **Model comparison** — ECMWF, GFS, ICON, NAM side-by-side at any point
- **40+ layers** — wind, waves, swell, currents, pressure, CAPE, precipitation, visibility, temperature
- **Point forecast** — detailed forecast for any clicked location
- **Isobars, fronts, wind barbs** — recently added for sailors
- **Free with ads** — premium removes ads

**What sailors like:** It's free. Visualization is intuitive. Model comparison at a glance. CAPE layer for thunderstorm assessment. Isobar display.

**What sailors complain about:** "It's a data tool, not a decision tool" — shows everything but tells you nothing about what it means for your specific trip. No routing. No departure planning. No boat-specific advice.

### Savvy Navvy

**Key features:**
- **Weather overlay on chart** — wind and weather displayed directly on the navigation chart
- **Smart routing** — auto-routing that considers weather, tides, and navigation hazards
- **Visual forecast** — wind strength/direction, clouds, rain, sun, storms with temperature
- **"Google Maps for boats"** — emphasis on simplicity and ease of use

**What sailors like:** All-in-one navigation + weather. Simple to use. Good for coastal cruising.

**What sailors complain about:**
- GPS tracking unreliable despite permissions enabled
- Tidal current modeling is crude — "thinks the tide is the same whatever the depth"
- Requires cell service — "you can end up on the rocks real quick if not paying attention" (offline support issues)
- Weather data feels superficial compared to PredictWind or Windy
- UK/Europe-centric

### Passage Weather (passageweather.com)

**Key features:**
- Free 7-day wind, wave, and weather forecast maps
- Uses ECMWF (0.25 degree) for global wind/pressure, NAM (12 km) for North American wind, EC-WAM for global waves
- Pre-rendered forecast charts at 3-hour intervals
- Wind barbs overlaid on maps
- Separate charts for pressure, waves, visibility, precipitation, SST

**What sailors like:** Free, reliable, no account needed, easy to read. Has been a go-to for passage planning for years. Shows professional-grade synoptic charts.

**What sailors complain about:** Static images (no interactive zoom/pan). Outdated website design. No point forecasts. No routing. No mobile app.

### What's Missing Across All Competitors

1. **No free, integrated weather routing** — PredictWind charges $249-349/year. OpenCPN has it but is desktop-only with a steep learning curve
2. **Poor wave comfort prediction** — most tools show wave height but don't translate this into comfort/safety for a specific vessel
3. **No open-source marine weather visualization** — Windy's rendering is proprietary. No one has built an open-source equivalent on MapLibre
4. **Model comparison is hard** — only PredictWind and Windy offer side-by-side comparison, and PredictWind charges for it
5. **Departure planning is PredictWind-only** — this killer feature has no free/open alternative
6. **GRIB handling is painful** — downloading, viewing, and interpreting GRIB files requires specialized software and knowledge
7. **Lightning/thunderstorm risk is underserved** — most tools show CAPE as a layer but don't provide risk assessment
8. **No progressive disclosure** — tools are either too simple (Savvy Navvy) or too complex (PredictWind). Nothing adapts to user skill level

---

## 6. Weather Routing Algorithms

### The Isochrone Method (Detailed Explanation)

The isochrone method is the dominant algorithm for sailing weather routing, first proposed in the 1950s and formalized by Hagiwara (1989). "Isochrone" means "constant time" — each line represents all positions reachable in a fixed time interval.

**Step-by-step algorithm:**

1. **Start:** From departure point at time T₀, create a "fleet" of virtual boats
2. **Fan out:** Each virtual boat is assigned a heading at regular angular intervals (e.g., every 5 degrees, giving 72 boats spanning 360 degrees)
3. **Look up wind:** For each boat's position and heading, query the weather model to get True Wind Speed (TWS) and True Wind Angle (TWA)
4. **Look up boat speed:** Given TWA and TWS, look up the boat's speed from the polar diagram. The polar diagram is a table/function mapping (TWA, TWS) -> boat speed in knots
5. **Calculate position:** For each boat, compute new position after time step dt (typically 1-6 hours): new_pos = old_pos + (boat_speed + current_vector) * dt along the heading
6. **Draw isochrone:** Connect all reachable positions at time T₀ + dt. This curve is the first isochrone — everywhere you could be after one time step
7. **Prune:** Remove positions that are behind the isochrone (suboptimal) or on land. Apply "wake limiting" — typically a 35-degree cone filter to prevent exponential growth of evaluation points
8. **Recurse:** From each point on the isochrone, repeat steps 2-7. Each new isochrone radiates from the previous one
9. **Arrival:** Continue until an isochrone reaches (or passes) the destination
10. **Backtrack:** Follow the optimal path backward through the isochrone tree from destination to start. This is the fastest route

**Key parameters:**
- **Time step (dt):** Smaller = more accurate but slower. 1 hour for coastal, 6 hours for open ocean
- **Angular resolution:** Smaller = more headings explored. Typically 5-10 degrees
- **Spread angle:** How wide to fan out. 140-160 degrees either side of rhumb line
- **Max diverted course:** Prevents routes that go absurdly far off course

### How Polar Diagrams Feed Into Routing

A polar diagram (or polar table) is a lookup that maps:
```
(True Wind Angle, True Wind Speed) -> Boat Speed (knots)
```

Typical format (CSV):
```
TWA\TWS  6    8    10   12   14   16   20
52       4.5  5.5  6.2  6.5  6.8  6.9  7.0
60       5.0  6.0  6.8  7.1  7.3  7.4  7.5
75       5.3  6.3  7.2  7.6  7.8  7.9  8.0
90       5.1  6.1  7.0  7.5  7.8  8.0  8.2
110      4.8  5.9  6.9  7.5  7.9  8.2  8.6
120      4.5  5.6  6.7  7.3  7.8  8.1  8.5
135      3.9  5.0  6.2  6.9  7.5  7.9  8.3
150      3.3  4.3  5.5  6.3  7.0  7.5  8.0
```

Values between grid points are interpolated (bilinear or bicubic). The polar also defines optimal VMG (Velocity Made Good) angles for upwind and downwind — the angles that maximize progress toward a destination.

**Sources of polar data:**
- **ORC data** (MIT license) — https://github.com/jieter/orc-data — 2019-2025 certificate data in JSON
- **SeaPilot polar database** — downloadable .pol files for many boat types
- **hrosailing** (Apache 2.0) — Python library for creating/processing polar diagrams
- **User-generated** — record actual boat performance via GPS and build empirical polars

### Wind Gradient Effects

Weather models output wind at 10m reference height. Sail rigs extend 15-25m (monohulls) or 20-30m (large yachts). The wind gradient over water follows a logarithmic profile:

```
V(z) = V_ref * ln(z/z₀) / ln(z_ref/z₀)
```

Where z₀ (surface roughness) is ~0.0002m over open ocean. This means wind at 20m height is roughly 5-10% stronger than at 10m. Additionally, wind direction veers (rotates clockwise in Northern Hemisphere) with height — typically 10-15 degrees between surface and mast top.

**Routing impact:** Advanced routing accounts for this by:
- Adjusting polar performance for actual wind at the sail plan's center of effort
- Recognizing that one tack may be faster than the other due to directional shear

### Wave-Adjusted Routing (Comfort vs Speed)

Waves degrade sailing performance beyond what wind polars predict:

- **Head seas** slow the boat by 10-30% depending on wave height/period
- **Beam seas** cause rolling that degrades crew performance and risks gear damage
- **Following seas** can cause broaching in breaking conditions
- **Short, steep waves** (low period) are worse than long-period swell of the same height

**Wave polar approach (PredictWind):** Create a wave degradation table that adjusts boat speed as a percentage based on wave height and relative wave angle:

```
Wave Height  Head    Beam    Quarter  Following
1m           -5%     -3%     -2%      -1%
2m           -15%    -8%     -5%      -3%
3m           -30%    -15%    -10%     -8%
```

**Comfort routing:** User sets maximum acceptable conditions:
- Max wind speed (e.g., 25 knots)
- Max wave height (e.g., 2.5m)
- Max wave period minimum (e.g., reject < 6s waves)
- Penalize or exclude beam seas

The router avoids areas exceeding these thresholds, even if the route is longer.

### Open-Source Weather Routing Implementations

| Project | Language | License | Algorithm | Recommended? |
|---|---|---|---|---|
| **peterm790/weather_routing** | Python | **MIT** | Isochrone + wake-limiting pruning | Yes — clean, permissive license |
| **libweatherrouting** | Python | GPL-3.0 | LinearBestIsoRouter | Study only (GPL) |
| **GWeatherRouting** | Python/Gtk4 | GPL-3.0 | Uses libweatherrouting | Study only (GPL) |
| **OpenCPN weather_routing_pi** | C++ | GPL-3.0 | Classical isochrone | Study only (GPL) |
| **Bitsailor** | Common Lisp/JS | GPL-3.0 | Isochrone + position filtering | Study only (GPL) |
| **VISIR-2** | Python | Published in GMD journal | Isochrone + currents + waves | Reference (peer-reviewed) |
| **SuperSailor** | — | — | A* pathfinding | Alternative approach |

**Recommended for our use:** peterm790/weather_routing (MIT) as the algorithmic foundation. It uses isochrone with wake-limiting pruning, consumes GFS U/V wind components, uses GEBCO for land/sea masking, and has clean Python that can be studied and ported to Go.

---

## 7. Implementation Recommendations

### MVP: Minimum Useful Weather Feature

The minimum weather feature that provides real value to sailors:

**Phase 1: Weather overlay on chartplotter**
1. Wind speed/direction displayed at the current map view (color-coded arrows or barbs)
2. Time slider to scrub through forecast (3-hourly steps, 5-7 days ahead)
3. Point forecast — tap any location to see wind, waves, pressure, temperature, visibility for the next 5-7 days
4. Basic wave height overlay (color-coded raster)

This alone beats Savvy Navvy's weather display and matches Passage Weather's functionality, but interactive and on our chart.

**Phase 2: Weather comparison**
5. Toggle between GFS and ECMWF models for the same area
6. Pressure trend display (barograph-style) for anchored positions

**Phase 3: Departure planning (lite)**
7. For a given route, show wind/wave conditions at each waypoint over the next 7 days for different departure times
8. Simple color-coded matrix: green (go), yellow (caution), red (no-go) based on user-defined thresholds

**Phase 4: Weather routing**
9. Isochrone-based optimal route given boat polars and weather forecast
10. Comfort vs speed routing toggle

### Best Free API for Global Marine Weather

**Primary: Open-Meteo (Marine API + Weather API)**
- Two API calls per location: marine endpoint for waves/currents/SST, weather endpoint for wind/pressure/visibility
- No API key needed for non-commercial use
- 10,000 requests/day is sufficient for a community platform with modest usage
- Excellent swell/wind-wave separation

**Supplementary: NOAA GFS on AWS (for server-side processing)**
- Public domain, no restrictions
- Process GRIB files in the Go API server using `nilsmagnus/grib`
- Cache and serve as JSON to the frontend
- Needed for commercial use without Open-Meteo paid plan

**For ECMWF data:** Use Open-Meteo's ECMWF endpoint, which proxies the newly-open ECMWF data in a developer-friendly JSON format.

### Client-Side GRIB Rendering vs Pre-Rendered Tiles

| Approach | Pros | Cons |
|---|---|---|
| **Client-side GRIB** | Real-time interpolation, zoom to any level, always fresh | Large downloads (MB), CPU-intensive parsing, complex implementation |
| **Pre-rendered raster tiles** | Fast display, standard tile workflow, cacheable at CDN | Requires tile generation pipeline, fixed zoom levels, storage costs |
| **Server-processed JSON + client WebGL** | Small payloads, flexible rendering, works with MapLibre custom layers | Requires server infrastructure, custom rendering code |

**Recommended approach: Server-processed JSON + client WebGL rendering**

1. Go API server fetches GRIB data from NOAA (scheduled, every 6 hours)
2. Server parses GRIB using `nilsmagnus/grib`, extracts wind U/V components, pressure, wave height for the relevant area
3. Server outputs JSON grid data (or PNG-encoded data textures where each pixel encodes U/V values)
4. Frontend loads data textures into MapLibre custom WebGL layer
5. Wind particles rendered using GPU shaders (following the mapbox/webgl-wind approach)
6. Wave height rendered as color-coded raster overlay

For the MVP, skip GRIB processing entirely and use Open-Meteo API calls from the client. Server-side GRIB processing is a Phase 2 optimization.

### How to Overlay Weather on a MapLibre Chart

**Approach 1: Wind particles (like Windy.com)**

Use `maplibre-gl-particle` (https://github.com/Oseenix/maplibre-gl-particle) or port `mapbox/webgl-wind` (https://github.com/mapbox/webgl-wind):

1. Encode wind U/V components as RGB values in a texture (PNG image where R = U, G = V)
2. Load texture into WebGL as a MapLibre custom layer
3. Simulate particles: each particle moves according to the wind vector at its position
4. Render particle trails with fade-out for direction indication
5. Color particles by wind speed

**Approach 2: Color-coded raster overlay**

1. Query Open-Meteo for a grid of wave heights (or wind speeds)
2. Create a canvas element, paint each grid cell with a color from a color ramp
3. Add as a MapLibre raster source using `map.addSource('weather', { type: 'canvas', ... })`
4. Apply opacity and blending

**Approach 3: Wind barbs (traditional)**

1. Query wind data for a grid of points visible in the current map view
2. For each point, render a wind barb symbol (GeoJSON point with custom icon)
3. Wind barbs encode speed (knots) using standard feather notation
4. Update on map pan/zoom

**Approach 4: WeatherLayers GL**

The commercial library WeatherLayers GL (https://weatherlayers.com/) supports MapLibre directly with particle, raster, contour, and barb layers. Dual-licensed MPL-2.0 or commercial. Worth evaluating if building from scratch proves too time-consuming.

**Recommended for MVP:** Start with wind barbs (Approach 3) — simplest to implement, most familiar to sailors, works with standard GeoJSON/MapLibre features. Add color-coded wave height raster (Approach 2) next. Wind particles (Approach 1) are visually impressive but complex — defer to Phase 2.

**Data flow for MVP:**
```
User pans map → Frontend calculates visible bounds
  → Fetch from Open-Meteo: marine API (waves) + weather API (wind, pressure)
  → Parse JSON response
  → Render wind barbs as GeoJSON symbol layer
  → Render wave height as color-coded grid overlay
  → Time slider updates forecast hour, re-renders
```

---

## Sources

### Weather Data & Forecasting
- [NOAA Marine Navigation Observations](https://marinenavigation.noaa.gov/observations.html)
- [PassageWeather](https://www.passageweather.com/)
- [Sailogy Marine Weather Forecasting Guide](https://www.sailogy.com/en/blog/understanding-marine-weather-patterns-and-forecasting-a-deeper-dive-for-sailors/)
- [Franks-Weather: Using Marine Weather Forecasts](https://weather.mailasail.com/Franks-Weather/How-To-Use-Marine-Weather-Forecasts)

### Forecast Models
- [Windy.app: ECMWF vs GFS](https://windy.app/blog/ecmwf-vs-gfs-differences-accuracy.html)
- [PredictWind: Model Definitions](https://help.predictwind.com/en/articles/2884560-what-do-pwg-pwe-gfs-ecmwf-ukmo-hrrr-nam-arome-aifs-icon-pw-ai-stand-for)
- [Rain Viewer: Forecast Models](https://www.rainviewer.com/blog/forecast-models-around-the-world.html)
- [Windy.app: NAM vs HRRR](https://windy.app/blog/nam-vs-hrrr-weather-models.html)
- [HRRR at LuckGrib](https://luckgrib.com/models/hrrr/)
- [DWD ICON Model Description](https://www.dwd.de/EN/research/weatherforecasting/num_modelling/01_num_weather_prediction_modells/icon_description.html)
- [WRF Model (NCAR)](https://www.mmm.ucar.edu/models/wrf)
- [ECMWF Open Data Announcement 2025](https://www.ecmwf.int/en/about/media-centre/news/2025/ecmwf-achieve-fully-open-data-status-2025)

### GRIB Files
- [GRIB - Wikipedia](https://en.wikipedia.org/wiki/GRIB)
- [NOAA NOMADS](https://nomads.ncep.noaa.gov/)
- [NOMADS GRIB Filter](https://nomads.ncep.noaa.gov/gribfilter.php?ds=gfs_0p25)
- [Saildocs](https://saildocs.com/)
- [Saildocs GRIB Info](https://saildocs.com/gribinfo)
- [NOAA GFS on AWS](https://registry.opendata.aws/noaa-gfs-bdp-pds/)
- [OpenGribs XyGrib](https://opengribs.org/en/xygrib)
- [LuckGrib](https://luckgrib.com/)
- [LuckGrib Offshore Compact](https://offshore.luckgrib.com/benefits.html)
- [Cruising World: How to Read GRIB Files](https://www.cruisingworld.com/story/how-to/how-to-read-interpret-grib-weather-files/)

### GRIB Parsing Libraries
- [nilsmagnus/grib (Go)](https://github.com/nilsmagnus/grib)
- [amsokol/go-grib2 (Go)](https://github.com/amsokol/go-grib2)
- [grib2-simple (Node.js)](https://github.com/UdSAES/grib2-simple)
- [grib22json (Browser JS)](https://github.com/BlueNetCat/grib22json)
- [vgrib2 (TypeScript)](https://github.com/veech/vgrib2)

### Weather APIs
- [Open-Meteo Marine API](https://open-meteo.com/en/docs/marine-weather-api)
- [Stormglass Marine Weather](https://stormglass.io/marine-weather/)
- [Stormglass API Comparison 2025](https://stormglass.io/best-weather-api-2025/)
- [Visual Crossing Weather API](https://www.visualcrossing.com/weather-api/)
- [Windy API](https://api.windy.com/)
- [NOAA Weather API](https://www.weather.gov/documentation/services-web-api)

### Competitors
- [PredictWind Departure Planning](https://www.predictwind.com/features/departure-planning)
- [PredictWind Weather Routing](https://www.predictwind.com/features/weather-routing)
- [Savvy Navvy Marine Forecasts](https://www.savvy-navvy.com/marine-weather-forecasts)
- [Windy.com](https://www.windy.com)
- [PassageWeather](https://www.passageweather.com/)

### Weather Routing
- [LuckGrib: Isochrone Introduction](https://routing.luckgrib.com/intro/isochrones/index.html)
- [OpenCPN Weather Routing Plugin](https://opencpn-manuals.github.io/main/weather_routing/index.html)
- [VISIR-2: Ship Weather Routing in Python](https://gmd.copernicus.org/articles/17/4355/2024/)
- [GWeatherRouting](https://gweatherrouting.org/)
- [peterm790/weather_routing (MIT)](https://github.com/peterm790/weather_routing)
- [Sail Magazine: Weather Routing 101](https://sailmagazine.com/cruising/weather-routing-101-part-2/)

### Weather Visualization
- [Mapbox WebGL Wind](https://github.com/mapbox/webgl-wind)
- [maplibre-gl-particle](https://github.com/Oseenix/maplibre-gl-particle)
- [WeatherLayers GL](https://weatherlayers.com/)
- [fbrosda/weather-maps (MapLibre)](https://github.com/fbrosda/weather-maps)
- [MapTiler Weather Visualization](https://www.maptiler.com/news/2021/05/visualize-weather-forecast-with-webgl/)
- [Wind Gradient (Wikipedia)](https://en.wikipedia.org/wiki/Wind_gradient)
- [Wind Shear and Sailing (SailZing)](https://sailzing.com/wind-shear-and-gradient/)
