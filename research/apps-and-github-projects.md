# Sailing/Marine Apps & GitHub Projects Research

**Date:** 2026-03-08

---

## Part 1: Sailing & Marine Apps You May Have Missed

Apps you already know about (excluded from this list): Savvy Navvy, PredictWind, Orca, Navily, SeaPeople, SailTies, OpenCPN, FastSeas, Keeano, Ditch Navigation, NavShip, Windy.app, 45 Degrees Sailing, Navibotica, SailGrib, TZ iBoat, iSailor, SeaNav, Argo, Navionics.

### Navigation & Route Planning

| App | What It Does | Notes |
|-----|-------------|-------|
| **Wavve Boating** | Marine nav app customizing charts to vessel draft and current water levels. Route planning, community data. | US-focused. $11.99/mo or $69.99/yr. Since 2018. |
| **Aqua Map** | Budget-friendly nav with detailed bathymetric charts, fishing features, inland waterways. | One-time purchase model. Good Navionics alternative. |
| **iNavX** | Highly customizable chart plotter supporting multiple chart providers (NOAA, Navionics, C-MAP). | Favorite for serious sailors and offshore cruisers. |
| **SEAiq** | Professional-grade nav app, particularly strong for iOS. | Used by commercial and recreational sailors. |
| **B&G App** | Route planning with weather along route, autorouting, digital logbook, waypoint management. | Ties into B&G hardware ecosystem. |
| **Seapilot** | Nav with AIS tracking, cloud sync, polar diagrams, collaboration features. | Swedish company. Free polar file downloads. |
| **SailRouting.com** | Web-based weather routing tool for coastal cruisers. Uses Copernicus data. | Quick online routes, no app install needed. |
| **Sailors Planner** | Voyage planning with detailed float plans, crew management, responsibility assignment. | Web: sailorsplanner.com |
| **i-Boating** | Marine nav with nautical charts, GPS. SDK for web integration with Mapbox GL JS. | Interesting for their chart tile API. |
| **NaVisu** | Open-source 3D marine navigation software (Java). | Desktop, not mobile. Research-oriented. |

### Cruising & Destination Information

| App | What It Does | Notes |
|-----|-------------|-------|
| **Noforeignland** | Free crowd-sourced cruising community: anchorage/marina reviews, clearance info, dinghy docks, fuel, laundry. Built-in GPS boat tracker. | Free, no paywalls. Created by liveaboard cruisers. Very relevant competitor for itinerary/destination features. |
| **Noonsite** | Cruisers' planning tool: country formalities, port/marina info, cruiser reports. Recently upgraded platform. | The classic reference. More info-resource than app. |
| **Deckee** | Community-focused: local hazard reporting, trip tracking, safety alerts. | Australian origin, expanding globally. 1M+ users. |
| **MarineTraffic** | Live AIS vessel tracking, port arrivals/departures for 4,000+ ports. Augmented reality vessel ID. | More for vessel tracking than route planning. |
| **VesselFinder** | Free AIS vessel tracking with global receiver network. | Similar to MarineTraffic. |

### Weather & Forecasting

| App | What It Does | Notes |
|-----|-------------|-------|
| **SeaLegs AI** | AI-powered marine weather forecasting using LLMs. Trip planning, intelligent recommendations, real-time alerts. Also has a developer API. | **New entrant.** Very interesting for API integration. sealegs.ai |
| **XyGrib** (desktop) | GRIB file viewer for weather data visualization. Fork of zyGrib. | Open source. Desktop only. |

### Social & Crew

| App | What It Does | Notes |
|-----|-------------|-------|
| **SailLink** | Media-driven, community-first platform connecting boat owners with crew. Hand-verified listings. | sailink.org |
| **FindACrew** | Largest crew & boat matching network. 200+ countries. | findacrew.net |
| **CrewBay** | Cost-sharing trips, volunteer sailing opportunities. | crewbay.com |
| **Floatplan** | Free crew finding website with 8,000+ members. | noonsite.com/floatplan |

### Hardware-Integrated

| App | What It Does | Notes |
|-----|-------------|-------|
| **TimeZero (TZ Navigator)** | Professional marine nav software with radar, AIS, chart syncing. Syncs with TZ iBoat and Furuno hardware. | Premium desktop software. |
| **Raymarine** | MFD ecosystem with companion app. | Hardware-dependent. |

### Key Takeaways on New/Missed Apps

1. **Noforeignland** is the most relevant miss -- it's a direct competitor for the cruising itinerary/destination discovery space, and it's free/community-driven.
2. **SeaLegs AI** is the most interesting new entrant -- AI-powered marine weather with a developer API.
3. **Wavve Boating** and **Aqua Map** are significant players in the nav space that were not on your list.
4. **SailRouting.com** offers quick web-based weather routing without app install.
5. **Deckee** has reached 1M+ users with community-driven hazard/safety data.

---

## Part 2: GitHub Open Source Projects

### Tier 1: Major Projects (100+ stars, actively maintained)

#### OpenCPN/OpenCPN
- **URL:** https://github.com/OpenCPN/OpenCPN
- **Stars:** 1,356
- **Language:** C
- **License:** GPL-2.0
- **Last Updated:** 2026-03-05
- **Description:** The definitive open-source chart plotter. Supports GPS, BSB raster charts, S57 vector ENC charts, AIS decoding, waypoint/autopilot navigation. Huge plugin ecosystem.
- **Relevance:** The gold standard for open-source marine nav. Their weather routing plugin implements isochrone algorithms. Plugin architecture is worth studying.

#### cambecc/earth
- **URL:** https://github.com/cambecc/earth
- **Stars:** 6,512
- **Language:** JavaScript
- **License:** MIT
- **Last Updated:** 2026-03-05
- **Description:** Beautiful visualization of global weather conditions using GRIB data rendered on a globe with WebGL. The inspiration behind many weather visualization projects.
- **Relevance:** Directly relevant for weather overlay on sailing routes. The rendering approach (wind particle animation) is industry-standard now.

#### gpxstudio/gpx.studio
- **URL:** https://github.com/gpxstudio/gpx.studio
- **Stars:** 920
- **Language:** MDX (SvelteKit)
- **License:** MIT
- **Last Updated:** 2026-03-08
- **Description:** Full-featured online GPX file editor. Create, view, edit GPX files with route planning on interactive maps.
- **Relevance:** Excellent reference for building a web-based route editor. Good UX patterns for route manipulation on maps.

#### sakitam-fdd/wind-layer
- **URL:** https://github.com/sakitam-fdd/wind-layer
- **Stars:** 686
- **Language:** TypeScript
- **License:** Custom
- **Last Updated:** 2026-03-02
- **Description:** Wind visualization layer for OpenLayers, Leaflet, Mapbox GL, and MapLibre GL. Creates windy.com-style animated wind particle overlays.
- **Relevance:** **Highly relevant.** Drop-in wind visualization for MapLibre/Mapbox. Could be used directly for weather overlays on your sailing route planner.

#### onaci/leaflet-velocity
- **URL:** https://github.com/onaci/leaflet-velocity
- **Stars:** 660
- **Language:** JavaScript
- **License:** Custom
- **Last Updated:** 2026-03-03
- **Description:** Visualize velocity data (wind, ocean currents) on a Leaflet map layer. Animated particle flow visualization.
- **Relevance:** If using Leaflet instead of MapLibre, this is the go-to for wind/current visualization on charts.

#### cambecc/grib2json
- **URL:** https://github.com/cambecc/grib2json
- **Stars:** 385
- **Language:** Java
- **License:** MIT
- **Last Updated:** 2026-02-15
- **Description:** Converts GRIB2 weather files to JSON format for use in web applications.
- **Relevance:** Essential utility for any weather routing feature. Converts GFS/ECMWF data to web-consumable JSON.

#### SignalK/signalk-server
- **URL:** https://github.com/SignalK/signalk-server
- **Stars:** 381
- **Language:** TypeScript
- **License:** Apache-2.0
- **Last Updated:** 2026-03-08
- **Description:** Central server for boat data. Connects all onboard devices over NMEA, WiFi, and other marine protocols. JSON-based marine data exchange format.
- **Relevance:** The open standard for marine data. If your app ever connects to boat instruments, Signal K is the protocol. Also recently launched an MCP server for AI integration.

#### bareboat-necessities/lysmarine_gen (BBN OS)
- **URL:** https://github.com/bareboat-necessities/lysmarine_gen
- **Stars:** 310
- **Language:** Shell
- **License:** None specified
- **Last Updated:** 2026-03-02
- **Description:** Free boat computer OS integrating SignalK, PyPilot, OpenCPN, Freeboard-SK, and more into a unified cockpit system on Raspberry Pi.
- **Relevance:** Shows how to integrate multiple marine open-source tools. Good reference for what the open-source marine ecosystem looks like assembled together.

#### pypilot/pypilot
- **URL:** https://github.com/pypilot/pypilot
- **Stars:** 266
- **Language:** Python
- **License:** None specified
- **Last Updated:** 2026-03-04
- **Description:** Free autopilot for sailboats supporting Signal K integration.
- **Relevance:** Less directly relevant to route planning UI, but shows the Signal K ecosystem depth.

#### M0r13n/pyais
- **URL:** https://github.com/M0r13n/pyais
- **Stars:** 245
- **Language:** Python
- **License:** MIT
- **Last Updated:** 2026-03-08
- **Description:** AIS message decoding and encoding in Python (AIVDM/AIVDO).
- **Relevance:** If you need to decode AIS data for vessel tracking features.

#### danwild/wind-js-leaflet
- **URL:** https://github.com/danwild/wind-js-leaflet
- **Stars:** 232
- **Language:** JavaScript
- **License:** Custom
- **Last Updated:** 2026-01-15
- **Description:** Leaflet plugin for wind direction, velocity, and temperature visualization overlays.
- **Relevance:** Alternative to wind-layer for Leaflet-based implementations.

#### bareboat-necessities/my-bareboat
- **URL:** https://github.com/bareboat-necessities/my-bareboat
- **Stars:** 226
- **Language:** C
- **License:** Apache-2.0
- **Last Updated:** 2026-02-16
- **Description:** Open-source hardware and software solutions for sailing and sailboats. Includes UART control, AIS wireless daemon, AIS decoder, extensible sensor daemon.
- **Relevance:** Hardware-focused but good reference for marine data integration patterns.

#### SignalK/SensESP
- **URL:** https://github.com/SignalK/SensESP
- **Stars:** 188
- **Language:** C++
- **License:** Apache-2.0
- **Last Updated:** 2026-03-05
- **Description:** Universal Signal K sensor framework for ESP32. Build custom marine sensors that feed data to Signal K.
- **Relevance:** IoT/hardware layer. Less relevant to web app but shows ecosystem.

#### sam-cox/pytides
- **URL:** https://github.com/sam-cox/pytides
- **Stars:** 176
- **Language:** Python
- **License:** MIT
- **Last Updated:** 2026-02-15
- **Description:** Tide prediction and analysis using harmonic constituents.
- **Relevance:** Reference implementation for tide prediction algorithms. Could inform a JS/TS port.

#### danwild/wind-js-server
- **URL:** https://github.com/danwild/wind-js-server
- **Stars:** 160
- **Language:** JavaScript
- **License:** Custom
- **Last Updated:** 2025-12-07
- **Description:** Service to expose GRIB2 wind forecast data as JSON. Companion to wind-js-leaflet.
- **Relevance:** Backend component for serving wind data to a web map. Could be adapted for your weather routing needs.

#### opengribs/XyGrib
- **URL:** https://github.com/opengribs/XyGrib
- **Stars:** 132
- **Language:** C++
- **License:** GPL-3.0
- **Last Updated:** 2026-02-16
- **Description:** GRIB file viewer and weather visualization desktop app. Successor to zyGrib.
- **Relevance:** Reference for weather data visualization approaches, GRIB parsing.

#### mxtommy/Kip
- **URL:** https://github.com/mxtommy/Kip
- **Stars:** 118
- **Language:** TypeScript
- **License:** MIT
- **Last Updated:** 2026-03-08
- **Description:** Signal K instrument package -- web-based dashboard for displaying boat data (speed, wind, depth, etc.).
- **Relevance:** Good reference for marine instrument UI design in TypeScript/Angular.

### Tier 2: Niche but Relevant (10-100 stars)

#### jieter/orc-data
- **URL:** https://github.com/jieter/orc-data
- **Stars:** 96
- **Language:** Svelte
- **License:** MIT
- **Last Updated:** 2026-03-02
- **Description:** Display/visualize freely available ORC certificate sailboat data including VPP (Velocity Prediction Programme) data.
- **Relevance:** **Highly relevant.** Boat performance/polar data in a web format. Svelte-based. Could source boat polars from here.

#### OpenSeaMap/online_chart
- **URL:** https://github.com/OpenSeaMap/online_chart
- **Stars:** 77
- **Language:** PHP
- **License:** None specified
- **Last Updated:** 2026-02-15
- **Description:** OpenSeaMap fullscreen browser-based nautical chart.
- **Relevance:** Reference for OpenSeaMap tile integration. The tile URL `https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png` can overlay on any map.

#### grib-rs (noritada/grib-rs)
- **URL:** https://github.com/noritada/grib-rs
- **Stars:** 77
- **Language:** Rust
- **License:** Apache-2.0
- **Last Updated:** 2026-03-07
- **Description:** GRIB format parser for Rust. Could compile to WASM for browser use.
- **Relevance:** If you need client-side GRIB parsing, a Rust->WASM approach is viable.

#### dakk/gweatherrouting
- **URL:** https://github.com/dakk/gweatherrouting
- **Stars:** 73
- **Language:** Python
- **License:** GPL-3.0
- **Last Updated:** 2026-02-22
- **Description:** Open-source sailing routing and navigation software. Multi-point weather routing, polar database, GRIB support, GPX import/export, NMEA support.
- **Relevance:** **Highly relevant.** The routing algorithms (isochrone method) in libweatherrouting could be studied and potentially ported to JS/TS.

#### mpiannucci/gribberish
- **URL:** https://github.com/mpiannucci/gribberish
- **Stars:** 64
- **Language:** Rust
- **License:** MIT
- **Last Updated:** 2026-03-06
- **Description:** Read GRIB files with Rust.
- **Relevance:** Another Rust GRIB parser, potential WASM candidate.

#### SignalK/freeboard-sk
- **URL:** https://github.com/SignalK/freeboard-sk
- **Stars:** 54
- **Language:** TypeScript
- **License:** Apache-2.0
- **Last Updated:** 2026-02-28
- **Description:** OpenLayers-based chart plotter for Signal K. Routes, waypoints, notes, charts, weather layers, instrument overlays. S57 ENC support.
- **Relevance:** **Highly relevant.** Full web-based chart plotter in TypeScript/Angular. Good reference for route/waypoint management UI on web maps.

#### Leaflet.windbarb
- **URL:** https://github.com/spatialsparks/Leaflet.windbarb
- **Stars:** 52
- **Language:** JavaScript
- **License:** BSD-2-Clause
- **Last Updated:** 2025-12-24
- **Description:** Leaflet plugin to create wind arrows with direction and velocity (wind barbs).
- **Relevance:** Useful for displaying wind data as traditional barbs on a chart.

#### xbgmsharp/postgsail
- **URL:** https://github.com/xbgmsharp/postgsail
- **Stars:** 42
- **Language:** PLpgSQL
- **License:** Apache-2.0
- **Last Updated:** 2026-03-01
- **Description:** Automatically logs sailing trips, capturing moorages, dockings, and anchorages using PostGIS. No manual start/stop needed.
- **Relevance:** **Highly relevant.** Backend architecture for automatic trip logging with PostGIS spatial queries. Shows how to model sailing trips, moorages, anchorages in a database.

#### dakk/libweatherrouting
- **URL:** https://github.com/dakk/libweatherrouting
- **Stars:** 37
- **Language:** Python
- **License:** GPL-3.0
- **Last Updated:** 2026-03-08
- **Description:** Pure Python weather routing library for sailing. Implements isochrone routing algorithm.
- **Relevance:** **Highly relevant.** Core routing algorithm that could be studied and ported to TypeScript.

#### chartcatalogs/catalogs
- **URL:** https://github.com/chartcatalogs/catalogs
- **Stars:** 29
- **Language:** None (XML data)
- **License:** CC0-1.0
- **Last Updated:** 2026-03-08
- **Description:** Catalogs of freely available electronic nautical navigation charts in XML format.
- **Relevance:** Useful data source for finding free chart data worldwide.

#### openwatersio/neaps
- **URL:** https://github.com/openwatersio/neaps
- **Stars:** 25
- **Language:** TypeScript
- **License:** MIT
- **Last Updated:** 2026-03-08
- **Description:** Tide prediction engine in TypeScript using harmonic constituents. Calculate high/low tides and water levels.
- **Relevance:** **Highly relevant.** TypeScript tide prediction library. Could integrate directly into your stack. MIT licensed.

#### OpenSeaMap/vectortiles-generator
- **URL:** https://github.com/OpenSeaMap/vectortiles-generator
- **Stars:** 22
- **Language:** JavaScript
- **License:** None specified
- **Last Updated:** 2026-03-05
- **Description:** Infrastructure to generate vector tiles for OpenSeaMap.
- **Relevance:** If you want to self-host OpenSeaMap vector tiles instead of raster overlays.

#### vokkim/finnish-nautical-chart-vectors
- **URL:** https://github.com/vokkim/finnish-nautical-chart-vectors
- **Stars:** 19
- **Language:** JavaScript
- **License:** None specified
- **Last Updated:** 2026-02-23
- **Description:** Generate Finnish nautical charts in Mapbox vector tile format.
- **Relevance:** Good reference for converting national chart data to Mapbox vector tiles. Approach could be replicated for other countries.

#### vokkim/noaa-nautical-charts
- **URL:** https://github.com/vokkim/noaa-nautical-charts
- **Stars:** 15
- **Language:** None (data)
- **License:** None specified
- **Last Updated:** 2026-02-02
- **Description:** NOAA nautical chart data in MBTiles format.
- **Relevance:** Pre-packaged NOAA chart tiles ready for use in a web map.

#### hrosailing/hrosailing
- **URL:** https://github.com/hrosailing/hrosailing
- **Stars:** 13
- **Language:** Python
- **License:** Apache-2.0
- **Last Updated:** 2026-01-15
- **Description:** Python package for creating and working with polar performance diagrams. Tools for visualization, creation, and processing.
- **Relevance:** Reference for polar diagram data processing algorithms.

#### BAUV-Maps
- **URL:** https://github.com/kaaninan/BAUV-Maps
- **Stars:** 13
- **Language:** JavaScript
- **License:** None specified
- **Last Updated:** 2026-01-13
- **Description:** S-57 and BSB compatible map server for web map viewers. Serves nautical chart data to web apps.
- **Relevance:** Web-based S-57 chart serving -- could be useful for self-hosted chart infrastructure.

#### RCgmbh/PiLot
- **URL:** https://github.com/RCgmbh/PiLot
- **Stars:** 10
- **Language:** JavaScript
- **License:** GPL-3.0
- **Last Updated:** 2026-02-17
- **Description:** Raspberry Pi-based boating system with offline maps, navigation, logbook, and more.
- **Relevance:** Full boat computer in JavaScript. Good reference for offline-first marine app architecture.

### Tier 3: Utility Libraries

| Project | Stars | Language | License | Description | Relevance |
|---------|-------|----------|---------|-------------|-----------|
| [blaylockbk/Herbie](https://github.com/blaylockbk/Herbie) | 710 | Python | MIT | Download NWP datasets (HRRR, GFS, IFS, etc.) from NOMADS, AWS, Google, Microsoft. | Backend weather data acquisition. |
| [NOAA-EMC/wgrib2](https://github.com/NOAA-EMC/wgrib2) | 109 | C | None | Official NOAA GRIB2 reading/writing tool. | Reference tool for GRIB processing. |
| [jamesp/node-nmea](https://github.com/jamesp/node-nmea) | 51 | JavaScript | MIT | Node.js NMEA GPS protocol parser. | If handling NMEA data in your backend. |
| [101100/nmea-simple](https://github.com/101100/nmea-simple) | 31 | TypeScript | MIT | TypeScript NMEA 0183 sentence parser. | TypeScript-native NMEA parsing. |
| [ryan-lang/tides](https://github.com/ryan-lang/tides) | 4 | Go | MIT | Tide prediction using harmonic constituents in Go. | Go alternative for tide prediction. |
| [bdougherty/tide-predictions](https://github.com/bdougherty/tide-predictions) | ~5 | JavaScript | MIT | Microservice for nearest NOAA tide station predictions. | Simple NOAA tide API wrapper. |

### External APIs & Services Worth Noting

- **AISStream** (aisstream.io) -- Free websocket API for global AIS data streaming. [GitHub](https://github.com/aisstream/aisstream)
- **SeaLegs AI API** -- Developer API for AI-powered marine weather forecasts. sealegs.ai
- **OpenSeaMap tiles** -- Free seamark overlay: `https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png`
- **i-Boating SDK** -- Commercial nautical chart tiles compatible with Mapbox GL JS.

---

## Summary: Most Relevant Projects for Building a Sailing Route Planner

### Must-Study Projects
1. **wind-layer** (686 stars) -- Drop-in wind visualization for MapLibre. You will almost certainly use this.
2. **openwatersio/neaps** (25 stars) -- TypeScript tide prediction. MIT. Directly integrable.
3. **dakk/libweatherrouting** (37 stars) -- Weather routing algorithm reference. Study for isochrone implementation.
4. **jieter/orc-data** (96 stars) -- Boat polar/performance data in Svelte. Data source for boat polars.
5. **SignalK/freeboard-sk** (54 stars) -- Full web chart plotter in TypeScript. UI patterns reference.
6. **cambecc/grib2json** (385 stars) -- GRIB to JSON conversion for weather data pipeline.
7. **gpxstudio/gpx.studio** (920 stars) -- Route editor UX reference. MIT licensed SvelteKit.
8. **xbgmsharp/postgsail** (42 stars) -- PostGIS sailing trip data model. Database schema reference.

### Must-Know Apps
1. **Noforeignland** -- Direct competitor for cruising destination/community features. Free.
2. **SeaLegs AI** -- New AI weather forecasting with developer API.
3. **Wavve Boating** -- Growing nav app with community features.
4. **Deckee** -- 1M+ users with community hazard data.
5. **SailRouting.com** -- Quick web-based weather routing (uses Copernicus data).

Sources:
- [Two Get Lost - 19 Best Apps For Sailing 2025](https://twogetlost.com/best-apps-for-sailing)
- [Wavve Boating - Best Marine Navigation Apps](https://www.wavveboating.com/blog/best-marine-navigation-app/)
- [Yachting World - Best Navigation Apps Tested](https://www.yachtingworld.com/yachts-and-gear/best-navigation-apps-5-top-options-tested-134929)
- [SeaLegs AI](https://www.sealegs.ai/)
- [Deckee](https://deckee.com/)
- [Noforeignland](https://www.noforeignland.com/)
- [Noonsite](https://www.noonsite.com/)
- [SailRouting.com](https://www.sailrouting.com/en)
- [Discover Boating - Marine Navigation Apps](https://www.discoverboating.com/resources/marine-navigation-apps)
- [Signal K](https://signalk.org)
- [GitHub Topics: Sailing](https://github.com/topics/sailing?o=desc&s=stars)
- [Catamaran Show - Essential Sailing Apps](https://www.catamaranshow.com/post/essential-sailing-apps)
- [Sailing Blog NauticEd - Top Apps](https://sailing-blog.nauticed.org/top-apps-for-sailing-and-yacht-charter-planning/)
- [Cruising World - Navigation Apps](https://www.cruisingworld.com/gear/navigation-apps-for-sailboats/)
- [Wavve Boating - Navionics Alternatives](https://www.wavveboating.com/blog/navionics-alternatives/)
- [Boataround - 9 Best Apps for Sailors 2025](https://www.boataround.com/us/blog/9-best-apps-for-sailors-in-2025)
