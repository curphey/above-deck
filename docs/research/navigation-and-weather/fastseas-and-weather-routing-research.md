# FastSeas & Weather Routing Research

**Date:** 2026-03-08

---

## 1. FastSeas Overview

FastSeas (fastseas.com) is a **proprietary, closed-source** web-based sailing passage planning tool created by **Jeremy Waters**. It calculates optimal sailing routes using NOAA GFS weather forecasts, ocean currents, vessel performance (polars), and comfort criteria.

### Is FastSeas Open Source?

**No.** FastSeas is a closed-source commercial SaaS product. There is:
- No public GitHub repository
- No mention of open-source licensing on the website
- No published source code or SDK
- No public API documentation

### License

FastSeas uses a **proprietary commercial license** with a freemium pricing model:
- **Free tier**: 5 routing + 5 departure planning requests/month
- **Premium**: $5/month (annual at $60/yr), $10/month (monthly), $7.50/month (6-month)
- Premium unlocks unlimited requests and email responder access

---

## 2. FastSeas Tech Stack

Based on interviews and observable details:

| Component | Technology |
|-----------|-----------|
| **Frontend** | Web application (responsive, works as mobile bookmark), integrated with **Windy.com** for weather visualization |
| **Backend** | Hosted on **AWS** (migrated from free hosting after growth) |
| **Payment** | Stripe.com integration |
| **Weather Data** | NOAA GFS (0.25 degree resolution, updated 4x daily, 16-day forecasts) |
| **Ocean Currents** | NOAA OSCAR (5-day averaged satellite observations) |
| **Map/Viz** | Windy API (FastSeas was the first app integrated with Windyty) |
| **Export** | GPX, KMZ, CSV |
| **Polar Import** | Compatible with qtVlm, OpenCPN, iPolar formats |

Jeremy Waters described the initial prototype as ~100 hours of work, with hundreds more hours of refinement. He is an IT professional / mechanical engineer (UVA BS Mechanical Engineering 1987-1991) with extensive full-stack development experience.

---

## 3. FastSeas Routing Algorithm

FastSeas does **not** publicly document its algorithm. What we know:

- **"Analyzes typically millions of options"** to find optimal routes (from interview)
- Uses GFS wind forecasts (16-day) + OSCAR ocean current data
- Factors in: boat polar performance, comfort criteria (max wind beating/reaching/running), gust limits, performance adjustment (50-150%)
- Supports departure planning across multiple date intervals
- Likely uses an **isochrone-based method** (the standard approach for this problem), though this is not confirmed

### What We Cannot Determine
- Whether it uses classical isochrone, A*, dynamic programming, or a hybrid
- Specific time step resolution
- How it handles land avoidance
- Internal data structures or optimization techniques

---

## 4. FastSeas API

**There is no public API.** FastSeas offers:

- **Web interface** - the primary interaction method
- **Email responder** - structured email commands for routing requests (the closest thing to an API)
  - Supports Iridium GO!, SailMail, Winlink, and satellite communicators
  - Responses limited to 160 characters for satellite devices
  - Default response: next 4 positions along optimum route at 6-hour intervals

There is no REST API, no webhooks, no SDK, and no documented programmatic access.

---

## 5. Satellite Communication (Garmin inReach Integration)

FastSeas supports multiple satellite communicators through its **email responder service**:

### Supported Devices
- Garmin inReach
- Zoleo
- Spot
- Bivy Stick

### How It Works
1. User sends an email from their satellite communicator to FastSeas
2. InReach devices automatically include GPS coordinates (no need to specify start position)
3. Must include EMAIL parameter (inReach messages don't provide reply email)
4. FastSeas processes the routing request and responds via email
5. Response is compact (160 char limit) with next 4 waypoints at 6-hour intervals

### Configurable Parameters (via email)
- Wind thresholds (beating/reaching/gust limits)
- Departure delay scheduling
- Performance adjustments (50-150%)
- Current effects toggle
- Output format specification

---

## 6. Jeremy Waters - Background

- **Education**: BS Mechanical Engineering, University of Virginia (1987-1991)
- **Career**: IT professional with extensive experience in identity/access management, project management, full-stack development
- **LinkedIn**: "Retired Technologist - Now Full Time Sailor"
- **Sailing Background**: Started sailing Optimists at age 6-7 in France. Lived/sailed in Algeria, Mediterranean, US, and BVI. In his 20s, quit jobs and sailed the Caribbean for 3 years with his wife.
- **FastSeas Motivation**: Combines his passions for weather, sailing, and coding

### Key Interviews
- Sailing Virgins interview (philosophy-focused, limited technical details)
- Fit2Sail interview (more technical, mentions "millions of options" analysis)
- The Boat Galley podcast interview
- Panbo feature article
- Cruising World "App of the Month"

---

## 7. Open-Source Weather Routing Implementations

### A. OpenCPN Weather Routing Plugin

| Property | Detail |
|----------|--------|
| **Repo** | https://github.com/seandepagnier/weather_routing_pi |
| **Fork** | https://github.com/rgleason/weather_routing_pi |
| **License** | **GPL v3+** |
| **Language** | C++ (72%), C (14.6%), CMake (6.7%) |
| **Algorithm** | Classical isochrone method |

**How it works:**
- Calculates boat position at configurable time intervals (1hr, 4hr, 6hr, 12hr)
- Draws isochrone contour lines showing reachable distance per time step
- Smaller time steps give more accurate routes (can navigate narrow channels)
- Supports both GRIB predictive data and 30-year NOAA climatology averages
- Land detection via GSHHS high-resolution data
- Multiple polar files per boat for full wind-speed coverage
- Key parameters: time interval, degree steps (1-5 degrees), max diverted course (100-160 degrees), wind strength adjustment (50-150%)

### B. libweatherrouting (Python)

| Property | Detail |
|----------|--------|
| **Repo** | https://github.com/dakk/libweatherrouting |
| **License** | **GPL-3.0** |
| **Language** | Python (98.8%) |
| **Algorithm** | LinearBestIsoRouter (isochrone method) |

- Standalone library (no UI dependency)
- `.step()` method advances calculation (default 1-hour, configurable to 0.25hr)
- Accepts SeaPilot `.pol` polar files
- Users must implement custom `get_wind_at()` function for weather data
- Exports routes as GeoJSON
- **Good candidate for study** - clean Python, focused library

### C. GWeatherRouting (Python + Gtk4)

| Property | Detail |
|----------|--------|
| **Repo** | https://github.com/dakk/gweatherrouting |
| **License** | GPL-3.0 |
| **Language** | Python with Gtk4 UI |
| **Features** | Multi-point routing, polar database, GRIB1/2 support, GPX import/export |

- Built on top of libweatherrouting
- Full desktop application with chart rendering
- Integrated boat/polar database

### D. peterm790/weather_routing (Python) -- RECOMMENDED FOR STUDY

| Property | Detail |
|----------|--------|
| **Repo** | https://github.com/peterm790/weather_routing |
| **License** | **MIT License** |
| **Language** | Pure Python (xarray, numpy) |
| **Algorithm** | Isochrone with wake-limiting pruning |

**How it works:**
1. Computes reachable waypoints from start within fixed time intervals
2. Evaluates each point using polar diagram lookup (TWA + TWS -> boat speed)
3. Prunes suboptimal paths via "wake limiting" (35-degree cone filter)
4. `spread` parameter controls heading exploration (e.g., 140 degrees either side)
5. Weather data from GFS via `data.dynamical.org` (U/V wind components at 10m)
6. Land/sea masking via GEBCO dataset
7. Local zarr caching for performance

**Why recommended**: MIT license allows maximum flexibility. Clean Python. Well-documented algorithm.

### E. Bitsailor (Common Lisp + JavaScript)

| Property | Detail |
|----------|--------|
| **Repo** | https://github.com/mak08/Bitsailor |
| **License** | **GPL-3.0** |
| **Language** | Common Lisp (43%), JavaScript (43%) |
| **Algorithm** | Isochrone with position filtering |

- Uses OpenStreetMap geodata for land avoidance
- Polar interpolation to 0.1 degrees and 0.1 m/s resolution
- DWD (German Weather Service) data sources

### F. VISIR-2 (Python)

| Property | Detail |
|----------|--------|
| **Repo** | https://zenodo.org/records/10960842 |
| **License** | Published in Geoscientific Model Development journal |
| **Language** | Python |
| **Features** | Considers currents, waves, and wind for route optimization |

- Peer-reviewed scientific implementation
- Published 2024 in GMD journal

---

## 8. Boat Polar Data Resources

### ORC Data (MIT License)

| Property | Detail |
|----------|--------|
| **Repo** | https://github.com/jieter/orc-data |
| **License** | **MIT** |
| **Data** | ORC certificate data 2019-2025 (JSON files) |
| **Format** | TWS: [6,8,10,12,14,16,20] knots, TWA: [52,60,75,90,110,120,135,150] degrees |
| **Includes** | Optimal angles, VMG, time allowances |
| **Web viewer** | https://jieter.github.io/orc-data/site/ |

### hrosailing (Apache 2.0)

| Property | Detail |
|----------|--------|
| **Repo** | https://github.com/hrosailing/hrosailing |
| **License** | **Apache 2.0** |
| **Language** | Python |
| **Features** | Create, visualize, process polar diagrams; multiple format support (ORC, OpenCPN CSV, NumPy); isochrone computation; optimal steering suggestions |
| **Academic paper** | Published in Applied Sciences journal (MDPI) |

### Polar File Format Standard

Polar files are CSV text files where:
- Rows represent True Wind Angles (TWA)
- Columns represent True Wind Speeds (TWS)
- Values are boat speed in knots
- Separators: comma, tab, or semicolon
- Extensions: `.csv`, `.txt`, `.pol`
- Compatible formats: qtVlm, OpenCPN, iPolar, SeaPilot

### Seapilot Polar Database
- https://www.seapilot.com/features/download-polar-files/
- Large collection of downloadable polar files for many boat types

---

## 9. The Isochrone Method - Technical Summary

The isochrone method is the dominant algorithm for sailing weather routing:

### Classical Algorithm (Hagiwara, 1989)
1. From departure point at time T0, project boat positions along 2m+1 headings
2. For each heading, calculate boat speed from polar diagram given local wind (TWS, TWA)
3. Add ocean current vector to boat velocity
4. Mark all reachable positions at T0 + dt as an "isochrone" contour
5. For next time step, repeat from each point on the isochrone
6. Continue until an isochrone reaches the destination
7. Backtrack through isochrones to find optimal route

### Key Improvements Over Classical Method
- **Wake limiting / pruning**: Filter suboptimal positions using angular cones (prevents exponential growth)
- **Three-dimensional modified isochrone (3DMI)**: Floating grid system for ship tracks
- **Land avoidance**: GSHHS coastline data or OpenStreetMap polygons
- **Variable time steps**: Smaller steps near coast/obstacles, larger in open ocean
- **Multi-objective optimization**: Balance speed vs. comfort vs. safety

### Alternative Approaches
- **A* pathfinding**: Used by SuperSailor (https://github.com/erikson1970/SuperSailor)
- **Dynamic programming**: Grid-based approach
- **Calculus of variations**: Continuous optimization
- **Machine learning**: Emerging research area

### Key Academic Papers
- Hagiwara (1989) - Original isochrone method
- "Strategies to improve the isochrone algorithm for ship voyage optimisation" (Taylor & Francis, 2024)
- "The Ship-Routing Optimization Based on the Three-Dimensional Modified Isochrone Method" (ResearchGate)
- "Modeling and Optimization Algorithms in Ship Weather Routing" (ScienceDirect)
- "A Protocol for Comparing Sailboat Routing Algorithms" (SNAME, 2025)
- "A Data Processing Framework for Polar Performance Diagrams" (MDPI Applied Sciences)

---

## 10. Legal Analysis: Can We Build Our Own?

### What We CAN Do
1. **Study the isochrone algorithm** - It's a well-published mathematical method dating to 1989, described in numerous academic papers. Not patentable.
2. **Use GPL-licensed code for reference** - We can study OpenCPN's weather_routing_pi and libweatherrouting to understand implementation approaches. If we use GPL code, our derivative work must also be GPL.
3. **Use MIT-licensed code freely** - peterm790/weather_routing (MIT) and orc-data (MIT) can be incorporated into any project including proprietary ones.
4. **Use Apache 2.0 code** - hrosailing (Apache 2.0) can be used with attribution and patent grant.
5. **Access NOAA data freely** - GFS weather data and OSCAR ocean current data are US government public domain data.
6. **Use ORC polar data** - The orc-data repository (MIT license) provides boat performance data.

### What We CANNOT Do
1. **Copy FastSeas code** - It's proprietary closed-source software
2. **Reverse engineer FastSeas** - Likely prohibited by their terms of service
3. **Use FastSeas output programmatically** - No public API; scraping would violate ToS
4. **Mix GPL code into a non-GPL project** - GPL-3.0 (libweatherrouting, OpenCPN plugin, Bitsailor) requires derivative works to also be GPL

### Recommended Approach
1. **Start from MIT-licensed peterm790/weather_routing** as the algorithmic foundation
2. **Use hrosailing (Apache 2.0)** for polar diagram processing
3. **Use orc-data (MIT)** for boat polar database
4. **Consume NOAA GFS/OSCAR data directly** (public domain)
5. **Study academic papers** for algorithm improvements
6. **Build a clean-room implementation** - no FastSeas code, no GPL code in the core routing engine if we want license flexibility
