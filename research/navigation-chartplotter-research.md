# Navigation & Chartplotter Research

**Date:** March 2026
**Purpose:** Comprehensive landscape survey of marine navigation tools, chart data, mapping technology, and strategic opportunities for an open-source chartplotter feature.

---

## Table of Contents

1. [Commercial Navigation Tools](#1-commercial-navigation-tools)
2. [Open Source Navigation Tools](#2-open-source-navigation-tools)
3. [Chart Data Sources](#3-chart-data-sources-freeopen)
4. [Mapping Technology](#4-mapping-technology)
5. [Passage Planning — Latest Methods](#5-passage-planning--latest-methods)
6. [Community / Waze-like Features](#6-community--waze-like-features)
7. [AI Opportunities](#7-ai-opportunities)
8. [Environmental Data Sources](#8-environmental-data-sources)
9. [Other Useful Tools & Integrations](#9-other-useful-tools--integrations)
10. [Strategic Recommendations](#10-strategic-recommendations)

---

## 1. Commercial Navigation Tools

### Savvy Navvy — "Google Maps for Boats"

**What it does well:**
- Clean, intuitive interface — strips away chart clutter that intimidates non-sailors
- Smart route planning that factors in weather, tides, depth, and vessel draft
- Departure scheduler that considers weather windows, tides, and daylight
- AIS integration showing nearby vessels
- Good marketing and brand positioning — they've nailed the "make it simple" message

**What it does badly:**
- **Android is a mess.** Forum complaints about crashes, failed offline chart downloads (dies between 40-80%), and GPS tracking that shows straight lines instead of actual position
- Basic subscription locks out tides and currents — absurd for a sailing navigation app
- Route accuracy criticised by experienced sailors, particularly for tidal waters (UK East Coast specifically called out)
- Users can't trial the app without providing credit card details first
- Expensive for what you get: basic ~$99/yr, Elite ~$189/yr
- Bridge information is limited with no zoom detail

**Tech stack:** React/Preact frontend, Node.js + Python backend, AWS Lambda serverless, DynamoDB, Mapbox for mapping, Redux state management, Flutter for mobile, Cypress for e2e testing. Heavy AWS infrastructure (CloudFront, S3, EC2, Route 53, Cognito).

**Community size:** Large user base (millions of downloads claimed), but thin on the ground in sailing forums. Power users tend to prefer more capable tools.

**Key takeaway:** Savvy Navvy proved there's a massive market for "navigation made simple." But their execution has significant gaps, especially on Android and for serious passage planning. The "Google Maps for boats" positioning works for casual boaters but serious sailors find it lacking.

---

### Navionics (Garmin)

**What it does well:**
- Industry-leading bathymetry data — the best depth contours in the business
- Massive community database (ActiveCaptain integration) with marina reviews, POIs
- Works seamlessly with Garmin chartplotters (obvious advantage)
- Good offline chart capability
- Established trust — the name everyone knows

**What it does badly:**
- **Price gouging since Garmin acquisition.** Went from $24.99/yr to $49.99/yr — 100% increase in one year. Users are furious.
- Forcing account creation for existing subscribers who bought under the old model
- Removed the popular Sonar view (detailed blue bottom view), replaced with less useful relief shading
- Reports of paid downloaded maps being turned off without warning — genuinely dangerous
- No automatic draft-aware depth display — you have to manually assess safety
- UI feels dated compared to newer competitors

**Pricing:** ~$49.99/yr (up from $24.99 pre-Garmin acquisition)

**Key takeaway:** Navionics has the best underlying chart data and the largest user base, but Garmin is actively alienating their community with price hikes and anti-user decisions. This is creating an opening for competitors. The data lock-in is their real moat.

---

### PredictWind

**What it does well:**
- **Best weather routing in the market.** Period. Favoured by offshore sailors and racers
- Four weather models for comparison — sailors can cross-reference forecasts
- High-resolution forecasts up to 14 days
- Departure Planner is genuinely excellent for choosing weather windows
- Recently added AI-driven forecast models (Dec 2025)
- Professional-grade tool that serious sailors trust

**What it does badly:**
- Not a full chartplotter — it's weather routing with basic chart overlay
- Expensive for the useful tiers: Standard $249/yr (adds weather routing), Professional $499/yr
- Learning curve is steep for casual users
- App stability issues reported in app store reviews
- Basic tier ($29/yr) is fairly useless without routing

**Pricing:** Free / $29/yr (basic) / $249/yr (standard with routing) / $499/yr (professional)

**Key takeaway:** PredictWind owns the weather routing space. Any chartplotter that wants to compete on passage planning needs to either integrate with PredictWind or build something comparable. Their AI weather models are a genuine differentiator.

---

### Orca (formerly B&G)

**What it does well:**
- **Modern, beautiful UI** — the best-looking chartplotter on the market
- Excellent NMEA 2000 integration with autopilots from B&G, Simrad, Raymarine, Garmin
- Combines chart data with wind and current forecasts for detailed passage plans
- Accounts for draught, air draught, and sailing performance on different points of sail
- Night light display is superb for night navigation
- Whole-world charts in one subscription
- First year free

**What it does badly:**
- Radar integration (B&G Halo 20+) is problematic — distorted or missing in certain modes
- Autorouting with tidal gates not reliable — users must manually verify
- Relatively new entrant — still building trust
- Hardware dependency (Orca Display 2) locks you into their ecosystem

**Pricing:** ~£99/yr (~$125/yr) after first free year

**Key takeaway:** Orca is the most forward-thinking commercial offering. Their UI/UX sets the standard. Worth studying closely for design inspiration. But their hardware tie-in and early-stage reliability issues are weaknesses.

---

### FastSeas

**What it does well:**
- **Essentially free** — runs on donations (~$1/month suggested)
- Clean, focused passage planning tool
- Uses NOAA GFS data for 16-day routing
- Works with satellite communicators (Iridium GO!, Garmin inReach, Zoleo) — huge for offshore
- Email-based routing for bandwidth-constrained situations
- Simple, elegant interface that shows exactly what sailors need

**What it does badly:**
- Limited to weather routing — not a full chartplotter
- GFS-only (no ECMWF or other models)
- No offline mode
- Solo developer project — sustainability risk
- No AIS, no community features

**Pricing:** Free / donations

**Key takeaway:** FastSeas proves that weather routing doesn't need to be expensive or complex. The satellite communicator integration is genuinely innovative and solves a real offshore problem. A model to learn from.

---

### iSailor (Wartsila)

**What it does well:**
- Very clean, professional chart presentation — developed by Transas (professional maritime)
- High-quality vector charts based on official hydrographic data
- Augmented Navigation feature (2025) overlays data on camera view
- Pay-per-chart model can be cheaper than subscriptions if you sail one area
- Good waypoint monitoring with bearing, distance, XTD, time-to-go, ETA
- Export/import via GPX, KML, KMZ

**What it does badly:**
- **Death by a thousand in-app purchases.** Weather, tides, sailing guides, NMEA integration — all extra
- Total cost quickly exceeds subscription alternatives if you want full features
- iOS-focused — limited Android experience
- Professional maritime heritage means UI can feel overly technical

**Pricing:** Free download, charts from ~$4-$19 per pack, features extra

**Key takeaway:** Great chart quality (professional heritage) but the nickel-and-dime pricing model frustrates users. The Augmented Navigation feature is interesting and worth watching.

---

### TimeZero

**What it does well:**
- Powerful PC-based navigation platform — the "Photoshop of chartplotters"
- TZ Maps format integrates raster, vector, satellite, and bathymetry
- Weather routing module with boat polars
- ActiveCaptain POI integration
- AIS included by default
- Professional version used by commercial vessels

**What it does badly:**
- **Expensive.** Professional version ~$3,000. Even the mobile app is $20/yr
- PC-only for full features (TZ iBoat is the mobile app but limited)
- Steep learning curve
- Heavy software — needs a capable machine
- Desktop-era UX

**Pricing:** TZ iBoat ~$20/yr, TZ Navigator ~$500-800, TZ Professional ~$3,000

**Key takeaway:** TimeZero is the power user's tool. Interesting for the TZ Maps approach that blends multiple data sources. But it's firmly in the "expensive professional tool" category.

---

### SEAiq

**What it does well:**
- **The only app that lets you load your own charts** in S-57, S-63, BSB, KAP formats
- Auto-downloads NOAA charts for free
- One-third of professional pilots worldwide use SEAiq Pilot
- Lower battery consumption than competitors
- Easy NMEA/WiFi gateway integration
- Proper night colour modes

**What it does badly:**
- UI is functional but dated — built for professionals, not consumer-friendly
- Feature unlocking via in-app purchases after 7-day trial
- Limited community/social features
- Small development team

**Pricing:** SEAiq USA $9.99, SEAiq Open $19.99, SEAiq Pilot $249.99

**Key takeaway:** SEAiq's ability to load arbitrary chart formats is unique and valuable. The professional pilot usage proves its reliability. Worth studying for chart rendering approach. The low price point for a capable tool is notable.

---

### Summary Table — Commercial Tools

| Tool | Best For | Price/yr | Chart Quality | Weather Routing | UI/UX | Offline |
|------|----------|----------|--------------|----------------|-------|---------|
| Savvy Navvy | Casual boaters | $99-189 | Good | Basic | Great | Partial |
| Navionics | Fishing/depth | $50 | Excellent | No | Dated | Yes |
| PredictWind | Offshore routing | $29-499 | Basic | Excellent | OK | Partial |
| Orca | Modern sailing | ~$125 | Good | Good | Best | Yes |
| FastSeas | Budget routing | Free | N/A | Good | Clean | No |
| iSailor | Chart accuracy | Varies | Excellent | No | Clean | Yes |
| TimeZero | Power users | $20-3000 | Excellent | Good | Complex | Yes |
| SEAiq | Professionals | $10-250 | BYO | No | Functional | Yes |

---

## 2. Open Source Navigation Tools

### OpenCPN — The Main Open Source Chartplotter

**GitHub:** https://github.com/OpenCPN/OpenCPN
**Stars:** 1,360 | **Forks:** 581 | **Open Issues:** 302 | **Contributors:** 30 (top)
**Language:** C/C++ with wxWidgets | **License:** GPL
**Last commit:** Active (commits within last 48 hours as of March 2026)

**What it does well:**
- Full-featured chartplotter that thousands of sailors actually use as their primary navigation tool
- Supports BSB raster and S-57 vector ENC display
- AIS decoding built in
- Waypoint autopilot navigation
- 45+ plugins including weather routing, dashboard, radar, etc.
- Cross-platform: Windows, macOS, Linux, Android
- OpenGL acceleration for responsive chart rendering
- Active development since 2009 — proven longevity

**What it does badly:**
- **Monolithic architecture is the critical weakness.** A GitHub issue (#2354) explicitly calls this out — NMEA multiplexing, chart canvas, control interface, chart downloading, plugin updates, and udev rules are all one process. This makes it very difficult to build a modern touch-friendly cockpit interface.
- wxWidgets UI looks and feels like a 2005 desktop application
- Touch interface is poor — designed for mouse/keyboard
- No web version — desktop only
- Plugin quality varies wildly — some are excellent, some abandoned
- Documentation is scattered across wikis, manuals, and forum posts
- Steep learning curve for new users
- Build system is complex

**Architecture assessment:**
OpenCPN's C++ / wxWidgets choice was smart in 2009 for performance and portability. But it's now a liability for modern development. The monolithic design means you can't easily:
- Run the chart renderer in a browser
- Separate data processing from UI
- Build mobile-first interfaces
- Contribute without understanding the entire codebase

**Plugin ecosystem worth noting:**
- **Weather Routing Plugin** — implements isochrone method with GRIB data and boat polars. Uses Grib Plugin and Climatology Plugin. Genuinely useful.
- **Dashboard Plugin** — instrument displays
- **Radar Plugin** — various radar integrations
- **Satellite Plugin** — weather satellite imagery

**What we can learn:**
- The weather routing plugin's isochrone implementation is well-tested and could inform our approach
- Chart rendering of S-57 data — the parsing and display logic is valuable reference code
- Plugin architecture patterns (what works, what doesn't)
- Don't build a monolith

**What we should NOT do:**
- Don't port OpenCPN code directly — the C++ / wxWidgets paradigm is wrong for a web app
- Don't try to replicate everything — focus on what the web can do better

---

### OpenPlotter — Raspberry Pi Marine Platform

**GitHub:** https://github.com/openplotter
**Website:** https://openmarine.net/openplotter

**What it does:**
OpenPlotter is a complete Linux distribution for Raspberry Pi that turns a cheap SBC into a full marine electronics hub. It's not a chartplotter per se — it's the platform that runs OpenCPN and Signal K together.

**Key capabilities:**
- Runs OpenCPN as the chartplotter
- Signal K server for data integration
- NMEA 0183 and NMEA 2000 protocol support
- Seatalk 1 legacy support
- Node-RED automation (e.g., low battery alerts, relay triggers)
- Sensor integration (temperature, barometric, GPS)
- WiFi access point for instrument data to tablets/phones
- Autopilot control

**What it does well:**
- Genuinely useful for DIY sailors — replaces thousands of dollars of marine electronics with a ~$75 Raspberry Pi setup
- Community-driven with active forums and plugins
- Modular architecture — add what you need
- Node-RED integration is clever — visual automation for non-programmers

**What it does badly:**
- Raspberry Pi hardware limitations (screen quality, waterproofing, reliability)
- Setup is technically demanding
- Depends on OpenCPN for charting (inherits its UI limitations)
- Documentation can be patchy

**Key takeaway:** OpenPlotter proves that there's a significant DIY sailing community willing to build their own systems. The Signal K integration model is the right approach — decouple data from display. A web-based chartplotter that speaks Signal K would immediately tap into this community.

---

### Signal K — The Open Marine Data Standard

**GitHub:** https://github.com/SignalK/signalk-server
**Stars:** 381 | **Forks:** 187 | **Open Issues:** 281 | **Contributors:** 30 (top)
**Language:** TypeScript/Node.js | **License:** Apache 2.0

**This is arguably the most important project in the open marine technology space.**

**What it is:**
Signal K is a JSON-based data format and server for marine use. It's the "lingua franca" that connects NMEA 0183, NMEA 2000, Seatalk, and other proprietary marine protocols into a single, web-friendly data model.

**Architecture:**
- Node.js full-stack server
- Multiplexes data from NMEA 0183, NMEA 2000, and other protocols
- Provides REST API and WebSocket streams
- JSON data model — every piece of boat data has a standardised path (e.g., `environment.wind.speedApparent`)
- Plugin system for extending functionality
- Web-based admin interface
- HTTPS/WSS for secure connections

**2025/2026 developments:**
- **MCP Server integration** — Signal K now has an AI-powered data access layer via MCP (Model Context Protocol). This enables natural language queries against boat data ("What's the battery voltage?") and automatic switching between real-time and historical data sources.
- Growing plugin ecosystem

**Why this matters for us:**
Signal K is the bridge between physical boat instruments and web applications. If we build a chartplotter that speaks Signal K, we immediately get:
- Real-time instrument data (speed, heading, wind, depth, battery, temperature)
- Integration with thousands of existing OpenPlotter installations
- A standardised data model we don't have to invent
- WebSocket streams for live data display

**What we should do:**
- Build Signal K integration from day one
- Use Signal K's data model as our internal data schema where applicable
- Consider contributing plugins back to the Signal K ecosystem

---

### Other Open Source Marine Tools

**AvNav** (https://open-boat-projects.org/en/avnav/)
- NMEA multiplexer and WiFi gateway
- Web-based chart plotter accessible via browser on any device
- Android app available
- Less polished than OpenCPN but web-native approach is interesting

**FreeBoard**
- Web-based marine instrument display
- Provides gauges and instruments via browser over WiFi
- Open source, but appears less actively maintained

**CANBoat** (https://github.com/canboat/canboat)
- NMEA 2000 PGN decoder — essential tooling for understanding N2K data
- Can read and write N2K messages
- Not an end-user tool but critical infrastructure for anyone working with NMEA 2000

**open-boat-projects.org**
- German-led hub aggregating open source marine projects
- Worth monitoring for new tools and hardware projects

---

## 3. Chart Data Sources (Free/Open)

### OpenSeaMap

**Website:** https://map.openseamap.org/
**License:** Open Database License (ODbL) via OpenStreetMap

**What it provides:**
- Worldwide nautical overlay on OpenStreetMap base maps
- Port and marina information (5,000+ ports, 600+ detailed marinas)
- Community-contributed depth data via crowdsourced sounder measurements
- Buoys, lights, and navigation marks
- Downloadable for offline use on chartplotters, tablets, phones

**Quality assessment:**
- Coverage is uneven — excellent in European waters, patchy elsewhere
- Depth data is crowdsourced and not survey-grade — useful for planning but not safe for primary navigation
- Navigation marks can be outdated
- No official hydrographic authority backing

**Useful for us:** Yes — as a supplementary data layer and for planning context. Not suitable as a primary chart source for navigation safety.

---

### NOAA ENC Charts (US Waters)

**Website:** https://charts.noaa.gov/ENCs/ENCs.shtml
**Format:** S-57 (IHO standard)
**License:** Free, no restrictions (US government data)

**What it provides:**
- Complete electronic navigational charts for US coastal and Great Lakes waters
- Official, survey-grade data updated regularly
- Available as individual downloads or by region
- Web Map Tile Service (WMTS) available for web integration
- Esri REST service for display

**Quality assessment:**
- **The gold standard for US waters.** Official, accurate, regularly updated
- S-57 format is well-documented but requires parsing
- Free — no licensing restrictions whatsoever
- An ENC Charts MCP Server exists (community project) that parses S-57 and provides API access

**Useful for us:** Absolutely essential for US coverage. The WMTS service is particularly interesting for web-based display without S-57 parsing overhead.

---

### UKHO / Admiralty Charts

**Website:** https://www.admiralty.co.uk/
**License:** Restricted (mostly commercial), some open data

**What's free:**
- Marine datasets under Open Government Licence (quarterly): bathymetry, wrecks, obstructions, routeing, maritime limits, offshore infrastructure
- S-100 trial datasets for development and testing
- Data Exploration Licence for sample data evaluation
- Some planning software allows free ENC use

**What's NOT free:**
- Full AVCS (Admiralty Vector Chart Service) ENCs — commercial licence required
- Detailed chart data for navigation — this is UKHO's revenue source

**Key insight:** UKHO has the best chart data outside the US, but it's commercially licensed. For UK/European waters, you'll need to either licence UKHO data or find alternatives. Some countries (Brazil, New Zealand, Argentina, Peru) have made their hydrographic data freely available.

---

### S-57 / S-63 / S-100 Format Landscape

**Current state (March 2026):**
- **S-57:** The current standard for ENC exchange. Well-established, widely supported, but showing its age
- **S-63:** Data protection (encryption) layer for ENCs. Required for official chart services
- **S-100:** The next generation standard. IHO Member States adopted first operational S-100 specs in January 2025
- **Transition timeline:** New ECDIS installations from January 2026 can conform to S-100. Full implementation target: 2029. Dual-mode (S-57 + S-100) required during transition.

**What this means for us:**
- Build S-57 support now (it's what's available)
- Plan for S-100 compatibility — it will become the standard
- S-63 encrypted charts are a headache — require licensing relationships with hydrographic offices
- Focus on free S-57 data (NOAA) first, add commercial chart support later

---

### Other Free Chart Data

| Source | Coverage | Format | Quality | Notes |
|--------|----------|--------|---------|-------|
| NOAA ENCs | US waters | S-57 | Official | Best free source |
| OpenSeaMap | Worldwide | OSM/tiles | Crowdsourced | Planning only |
| Brazilian Navy | Brazil | S-57 | Official | Free download |
| LINZ (NZ) | New Zealand | S-57 | Official | Free download |
| Argentina SHN | Argentina | S-57 | Official | Free download |
| Peru DHN | Peru | S-57 | Official | Free download |
| GEBCO | Global bathymetry | NetCDF/GeoTIFF | Survey-grade | Deep water only |

---

## 4. Mapping Technology

### MapLibre GL JS

**Website:** https://maplibre.org/
**GitHub:** https://github.com/maplibre/maplibre-gl-js
**License:** BSD-3-Clause

**Capabilities for marine use:**
- WebGL-accelerated vector tile rendering — smooth, performant map display
- Custom layer support — essential for overlaying nautical data
- Style specification allows complete visual customisation
- Offline tile support via service workers / caching
- Touch-friendly with pinch-zoom, rotation, bearing
- Active open source project (fork of Mapbox GL JS v1, now fully independent)
- No API key required, no usage-based pricing
- Plugin ecosystem for basemap switching, opacity controls, etc.

**Marine-specific considerations:**
- No built-in nautical chart support — you need to bring your own tile sources
- Custom layers can render S-57 features (buoys, depths, channels) as vector data
- Raster tile overlay works for existing chart tile services
- WebGL rendering is excellent for the kind of data-dense display charts require

**How to overlay marine charts on MapLibre:**

1. **Raster tile overlay:** Use NOAA's Chart Display Service (WMTS) as a raster tile source. Straightforward but limited customisation.

2. **Vector tiles from S-57:** Convert S-57 data to vector tiles using tools like:
   - **s57tiler** (https://github.com/manimaul/s57tiler) — converts S-57 to GeoJSON, then to MVT/MBTiles via tippecanoe
   - **BAUV-Maps** (https://github.com/kaaninan/BAUV-Maps) — S-57 compatible map server for web viewers
   - **VectorCharts** (https://vectorcharts.com/) — commercial service providing nautical chart vector tiles compatible with MapLibre/Mapbox

3. **Commercial tile services:**
   - **MarineCharts.io** — pre-built nautical vector tiles with MapLibre/Mapbox/OpenLayers/Leaflet compatibility. US coverage currently, expanding.
   - **VectorCharts** — "Add Nautical Charts to Your Web App" — built specifically for this use case

4. **Hybrid approach:** MapLibre base map + OpenSeaMap overlay + NOAA raster tiles for US waters + custom vector layers for navigation features

### Vector Tiles vs Raster Tiles

**Vector tiles (recommended for new builds):**
- Infinitely zoomable without pixelation
- Styleable — dark mode, custom colours, detail levels
- Smaller file sizes, better offline storage
- Interactive — click features for data
- Can be generated from S-57 data
- More complex to set up

**Raster tiles:**
- Simple to implement — just image URLs
- NOAA provides these as a free WMTS service
- Fixed style — can't change colours or detail levels
- Larger file sizes
- Not interactive
- What most existing tools use

**Recommendation:** Start with NOAA raster tiles for quick US chart display, then build a vector tile pipeline from S-57 data for the long-term architecture. Use MapLibre GL JS as the rendering engine — it's the right tool for this job.

---

## 5. Passage Planning — Latest Methods

### Weather Routing Algorithms

**The Isochrone Method (standard approach):**
- Invented in 1957, still the foundation of all weather routing
- An isochrone is a line connecting all points reachable in equal sailing time
- Process: from departure, calculate positions reachable in N hours across all headings → connect them as an isochrone → extend from each point on the isochrone → repeat until destination is reached → trace back the optimal path
- The OpenCPN Weather Routing Plugin implements this using GRIB data + boat polar diagrams
- Modern refinements include 3D modified isochrones (3DMI) that handle both east- and west-bound routes with floating grid systems

**Multi-Objective Optimisation (advanced):**
- Beyond just "fastest route" — optimises for multiple goals simultaneously
- Comfort (minimise beam seas), safety (avoid high wind/wave areas), fuel efficiency
- More computationally expensive but more useful for cruising sailors who don't want to be bashed to windward for 4 hours to save 30 minutes

**What modern tools do vs traditional methods:**
- Traditional: plot waypoints, check weather forecast separately, estimate speed from experience
- Modern: automated isochrone routing with GRIB weather data, polar diagrams, current overlays, tidal gates, danger areas
- Best tools (PredictWind, Orca): re-route dynamically as forecasts update, account for vessel performance on different points of sail

### Weather Data Sources

| Source | Resolution | Range | Cost | Notes |
|--------|-----------|-------|------|-------|
| NOAA GFS | 0.25° | 16 days | Free | The baseline model everyone uses |
| ECMWF IFS | 0.1° | 15 days | Free (limited) | Generally considered more accurate than GFS |
| DWD ICON | 0.125° | 7 days | Free | Good for European waters |
| OpenSkiron/OpenWRF | High-res regional | 3-7 days | Free | Great for Mediterranean sailing |
| Saildocs | Various | Various | Free (email) | Designed for satellite email retrieval |
| OpenGribs | 9 atmos + 3 wave | Various | Free | Aggregator — choose from multiple models |

**GRIB access tools:**
- **ecmwf-opendata** Python package — direct download of ECMWF open data
- **GribStream** — API access to NOAA, ECMWF, and AI weather models
- **LuckGrib** — sailing-focused GRIB viewer (commercial but free GRIB download)
- **Expedition** — GRIB display and download is free within the app

### Tidal Data Sources

| Source | Coverage | API | Cost | Notes |
|--------|----------|-----|------|-------|
| NOAA Tides & Currents | US waters | REST (JSON, CSV, XML) | Free | Gold standard for US |
| TideCheck | 6,400+ stations worldwide | Web | Free | Uses NOAA, TICON-4, FES2022 |
| WorldTides API | Global | REST | Freemium | Good global coverage |
| Stormglass | Global | REST | Free tier (10 req/day) | All marine params included |
| neaps/tide-database | Various | GitHub | Free | Public harmonic constituents database |
| UKHO | UK/global | Commercial | Paid | Official but expensive |

**Tidal harmonic analysis:** The TASK software suite (National Oceanography Centre) provides harmonic analysis, tidal prediction, and formatted tide tables. Harmonic constituents from various sources can be used with standard calculators to produce astronomical tide predictions — this is a well-solved mathematical problem.

### Ocean Current Data

| Source | Type | Resolution | Latency | Cost |
|--------|------|-----------|---------|------|
| OSCAR (NASA) | Satellite-derived surface currents | 0.25° | 2 days | Free |
| HYCOM | Model-based 3D currents | ~0.08° | Near real-time | Free |
| Copernicus CMEMS | Global ocean | Various | Near real-time | Free |
| NOAA RTOFS | Regional forecast | 0.08° | Daily | Free |

**Key note on OSCAR:** Provides 24-hour average currents, not forecasts. When bandwidth-constrained offshore, OSCAR is efficient because it's compact data. For routing, model-based forecasts (HYCOM, RTOFS) are more useful as they predict future conditions.

### What Makes a Great Passage Planner

1. **Weather routing with boat polars** — route based on YOUR boat's performance, not generic estimates
2. **Tidal gate awareness** — knowing when you can/can't get through tidal passages
3. **Departure planning** — "when should I leave?" is often more important than "what route?"
4. **Multi-model weather comparison** — never trust a single forecast model
5. **Comfort criteria** — not just fastest route, but comfortable route (wave angle, height limits)
6. **Dynamic re-routing** — update route as forecasts change
7. **Offline capability** — weather routing needs to work without internet
8. **Satellite integration** — ability to get routing via Iridium/inReach (FastSeas does this brilliantly)

---

## 6. Community / Waze-like Features

### ActiveCaptain — What Works and What Doesn't

**What it was:** Originally an independent crowdsourced database of marina reviews, anchorage info, hazard reports, fuel prices, and POIs. Over 166,000 independent reviews. Photos. Community-edited wiki-style port guides. Open and accessible.

**What it became:** Garmin acquired it, renamed it "ActiveCaptain Community" (ACC), completely rebuilt it. The transition was rocky — users struggled with the new system, data migration had issues, and the community feels Garmin is extracting value rather than adding it.

**Direct quote from forums:** "ActiveCaptain USED TO BE great. ActiveCaptain USED TO BE open source. Now it's Garmin's play-thing / cash cow. And it's crap."

**Lessons:**
- The community data had massive value — Garmin bought it for a reason
- Corporate acquisition of community data breeds resentment
- Review moderation is essential but heavy-handed removal destroys trust
- The data needs to stay open, or the community will eventually fork/leave

### Waze-Like Models in Marine

**Wavve Boating** — the closest to "Waze for boats":
- Users contribute tracks/trips that others can browse and follow
- Strava-like model for sharing proven routes
- Community-reported hazards, POIs, conditions
- 2,000+ nautical charts across North America
- Draft-aware trip sharing — "trips taken by vessels with similar draft"

**KnowWake:**
- Real-time community data across North America, Canada, Caribbean, Australia, NZ
- User-generated hazards, POIs, marine life sightings
- 350+ inland waterways covered
- Named "Best Boating App" by Discover Boating

### What Community Data Could Sailors Contribute

**High value, low effort:**
- Anchorage reviews with holding quality, swell exposure, facilities
- Marina reviews with pricing, quality, accessibility
- Real-time conditions reports (wind, sea state, visibility)
- Hazard reports (floating debris, uncharted rocks, silted channels)
- Fuel prices and availability

**Medium value, medium effort:**
- Depth soundings (crowdsourced bathymetry — OpenSeaMap already does this)
- Track sharing (actual routes sailed with conditions)
- Photos of approaches, anchorages, marinas

**High value, high effort (but powerful):**
- Passage reports with detailed weather, conditions, what worked
- Equipment reviews in context (which anchor held in what bottom)
- Local knowledge databases (where to clear customs, where to get gas bottles filled, which anchorages are rolly in which wind)

**The real opportunity:** ActiveCaptain was community data locked into a commercial platform. An open-source alternative where the data belongs to the community and is freely accessible would have massive pull — IF the data quality is maintained.

---

## 7. AI Opportunities

### What's Real vs Hype

**Genuinely useful (build these):**

1. **Natural language queries against boat data** — Signal K's MCP Server already demonstrates this. "What's the battery voltage?" or "Show me the charging pattern over the last week." Low-hanging fruit with the Signal K integration.

2. **Smart anchorage recommendations** — "Find me a sheltered anchorage near here in tonight's forecast wind direction, with good holding, under 5m depth, with shore access." This combines chart data, weather forecasts, community reviews, and spatial queries. Not trivial but very achievable with existing data.

3. **Weather forecast interpretation** — "Should I leave today or wait?" Translate GRIB data into plain-language advice considering the sailor's route, boat, and comfort preferences. PredictWind's AI models are doing early versions of this.

4. **Route optimisation beyond isochrones** — Current isochrone methods optimise for one variable (time). AI can optimise multi-objective: time, comfort, safety, fuel, equipment stress. This is a genuine improvement.

5. **Anomaly detection on boat systems** — "Your battery discharge pattern this week is unusual — check alternator." Using Signal K data streams to spot issues before they become problems.

**Probably useful (watch and assess):**

6. **Small Language Models on edge devices** — A 2025 study explored running SLMs on battery-powered devices with limited/no connectivity. For offshore use, having AI assistance that doesn't require internet is compelling. But the models are still early.

7. **Automated passage report generation** — After a passage, generate a report from logged data: route taken, weather encountered, average speed, fuel consumed, notable events.

**Mostly hype (don't build yet):**

8. **Fully autonomous sailing** — Samsung Heavy Industries did a 10,000km trans-Pacific demo with AI navigation, but that's commercial shipping with purpose-built hardware. Recreational sailing autonomy is much further out.

9. **AI replacing human judgement in navigation** — The sea is too variable and the consequences of error too high. AI should advise, never decide.

---

## 8. Environmental Data Sources

### Sea Surface Temperature (SST)

| Source | Resolution | Update Frequency | Access | Notes |
|--------|-----------|-----------------|--------|-------|
| NOAA OISST v2.1 | 0.25° | Daily | Free API | Blended satellite/ship/buoy |
| NOAA GPB | 0.05° (~5km) | Daily | Free | Geo-Polar Blended analysis |
| Copernicus OSTIA | 0.05° | Daily | Free API + Python toolbox | Gap-free global coverage |
| NASA Earthdata | Various | Various | Free | Multiple products |

**Useful for:** Swimming/diving conditions, fishing (fish follow temperature gradients), comfort planning, engine cooling water temps.

### Water Quality

**UK:**
- Environment Agency Bathing Water Quality API (https://environment.data.gov.uk/bwq/)
- Open Government Licence — fully free
- Coastal and inland bathing water monitoring, May-September
- SPARQL queries, JSON/CSV via linked data API
- Covers designated bathing waters in England

**Europe:**
- EEA Waterbase — European bathing water quality database
- Copernicus Marine Service water quality products
- Annual European bathing water quality reports (2023 latest)

### Harmful Algal Blooms

| Source | Coverage | Access | Notes |
|--------|----------|--------|-------|
| NOAA HABSOS | US coastal | Free API | Real-time HAB tracking |
| NOAA NCCOS Bloom Monitoring | US | Free | Near real-time satellite products |
| FHAB API | San Francisco Bay area | Free API | Screening-level analysis |
| Copernicus Sentinel-3 OLCI | Global | Free | Satellite chlorophyll data from 2016+ |

### Marine Wildlife

| Source | Coverage | API | Notes |
|--------|----------|-----|-------|
| OBIS-SEAMAP (Duke) | Global | Yes | Megavertebrate sighting database |
| Whale Hotline API (Whale Museum) | Pacific NW | REST API | Orca, whale, dolphin sightings |
| Pacific Whale Foundation Tracker | Pacific | App/web | Citizen science sightings |
| NARWC Sightings Database | North Atlantic | Query | Right whale sightings |
| DFO Canada | Atlantic Canada | Database | Maritimes region whale sightings |

### Wave and Buoy Data

**NDBC (National Data Buoy Center):**
- https://www.ndbc.noaa.gov/
- Real-time and historical data from marine monitoring stations worldwide
- Wave height, period, direction, spectral data
- Ocean currents (ADCP measurements)
- Water temperature, salinity
- Wind speed/direction, air temperature, pressure
- Free access via HTTP, multiple Python libraries (ndbc-api, NDBC package, MHKiT)
- Data available for last 45 days in real-time, historical archives going back decades

### Tide Gauge Data

- NOAA Tides & Currents — real-time water level data from tide gauges
- PSMSL (Permanent Service for Mean Sea Level) — global sea level data
- IOC Sea Level Station Monitoring — global tide gauge network

---

## 9. Other Useful Tools & Integrations

### Marine Protocols

**NMEA 0183:**
- Serial protocol, ASCII text, simple to parse
- Still widely used on older equipment
- Human-readable sentences (e.g., $GPGGA for GPS position)
- WiFi bridges available to convert to TCP/UDP streams

**NMEA 2000:**
- CAN bus-based, binary protocol
- Modern standard for marine electronics
- More complex but faster and more capable than 0183
- Requires gateways (like Yacht Devices, Actisense) to convert to IP
- **CANBoat** (https://github.com/canboat/canboat) — essential open source PGN decoder

**Signal K:**
- JSON over WebSockets — the web-native protocol
- Bridges NMEA 0183, NMEA 2000, Seatalk into a unified data model
- The right protocol for a web-based chartplotter

**ESP32 WiFi Gateways:**
- ESP32 microcontrollers can bridge NMEA 2000 to WiFi (NMEA 0183 over TCP)
- Timo Lappalainen's NMEA2000 library for ESP32 is the reference implementation
- Cost: ~$5-10 for hardware — dramatically cheaper than commercial gateways

### AIS Integration

| Source | Type | Cost | Notes |
|--------|------|------|-------|
| aisstream.io | Real-time WebSocket | Free | Global AIS streaming |
| AISHub | Community sharing | Free (share data) | JSON/XML/CSV API |
| MarineTraffic API | Commercial | Paid | Most comprehensive |
| OpenAIS | Open source tools | Free | Data processing toolkit |
| AISViz | Research tools | Free | Extraction, processing, visualisation |

### Weather Services

| Service | Marine Data | Free Tier | API Quality | Notes |
|---------|-----------|-----------|-------------|-------|
| Open-Meteo | Wave, wind, SST | Unlimited (non-commercial) | Excellent | No API key needed, CORS enabled |
| Stormglass | Full marine suite | 10 req/day | Good | All params in all plans |
| OpenWeatherMap | Basic marine | 1,000 calls/day | Good | Widely used, well documented |
| Windy API | Wind, waves | Map widget free | Good | Best visualisation |
| WeatherAPI.com | Marine weather | 1M calls/month | Good | Generous free tier |

**Recommendation:** Open-Meteo is the clear winner for our use case — free, no API key, CORS-enabled, good marine data. Stormglass as a secondary source for additional parameters.

### Useful Free APIs Summary

| API | What It Provides | Why We'd Use It |
|-----|-------------------|-----------------|
| NOAA ENCs (WMTS) | Official US chart tiles | Primary US chart display |
| NOAA Tides & Currents | Tidal predictions + currents | Passage planning |
| Open-Meteo Marine | Wave/wind forecasts | Weather overlay |
| NDBC | Buoy observations | Real-time conditions |
| OSCAR (NASA) | Ocean surface currents | Routing calculations |
| Signal K | Boat instrument data | Live instrument display |
| aisstream.io | AIS vessel positions | Traffic awareness |
| Environment Agency BWQ | Bathing water quality | Environmental overlay |
| OpenSeaMap tiles | Nautical overlay | Supplementary chart data |
| Copernicus CMEMS | SST, currents, water quality | Environmental overlays |

---

## 10. Strategic Recommendations

### The Biggest Gaps in the Market

1. **No good open-source web-based chartplotter exists.** OpenCPN is desktop C++. AvNav is web-accessible but basic. Nothing has the UI quality of Orca with the openness of OpenCPN.

2. **ActiveCaptain-style community data is locked in Garmin's ecosystem.** The community is unhappy. An open alternative with community-owned data would have immediate appeal.

3. **Weather routing is either expensive (PredictWind $249/yr) or basic (FastSeas/GFS only).** A free, multi-model weather routing tool with a decent UI would be genuinely disruptive.

4. **No tool does the full loop well:** chart display + passage planning + weather routing + community data + instrument integration. Users currently need 3-4 apps.

5. **AI-assisted navigation is mostly vapourware.** The tools that claim AI features are doing basic automation, not genuine intelligence. There's room to do this properly.

### What Should We Focus On First?

**Phase 1: Foundation (Months 1-3)**
- MapLibre GL JS chart renderer with NOAA raster tile overlay (US waters immediately usable)
- Basic route planning (waypoints, distance, bearing calculations)
- Signal K integration for live instrument data display
- Dark mode, blueprint aesthetic — differentiate visually from day one
- PWA with offline tile caching

**Phase 2: Smart Planning (Months 4-6)**
- Weather overlay from Open-Meteo marine API
- Tidal data integration (NOAA Tides & Currents API)
- Basic weather routing using isochrone method with GFS GRIB data
- AIS overlay via aisstream.io
- Departure planning tool

**Phase 3: Community & Intelligence (Months 7-12)**
- Community data layer: anchorage reviews, hazard reports, conditions
- Open data model — community owns their data, exportable, API-accessible
- Multi-model weather routing (add ECMWF, ICON)
- AI-assisted anchorage finder and passage planning advisor
- Environmental overlays (SST, water quality, wildlife)
- S-57 vector tile pipeline for better chart rendering

**Phase 4: Ecosystem (Year 2+)**
- Additional chart sources (international waters)
- Boat polar management and performance tracking
- Track sharing / passage reporting
- Full offline weather routing
- Mobile apps (or excellent PWA)
- Hardware integrations (ESP32 gateways, Raspberry Pi)

### What Existing Tools/Data Can We Leverage vs Build

**Leverage (don't reinvent):**
- MapLibre GL JS — chart rendering engine
- Signal K — boat data protocol and server
- NOAA chart data + tile services — US chart coverage
- Open-Meteo / Stormglass — weather data
- NOAA Tides & Currents — tidal predictions
- OpenSeaMap — supplementary chart data
- aisstream.io — AIS data
- GRIB parsing libraries — weather data processing

**Build (our differentiators):**
- The web-based chart UI itself (MapLibre + custom layers)
- Community data platform with open data model
- Weather routing engine (isochrone method, web-native)
- AI-assisted planning features
- Signal K instrument dashboard
- Passage planning UX

### What Would Make Sailors Switch?

Based on forum analysis and user complaints across tools:

1. **"It just works" on both iOS and Android** — Savvy Navvy's Android problems and Navionics' forced migrations have burned users
2. **Free or very cheap** — price increases are the #1 complaint across all paid tools
3. **Tides and currents included at every tier** — Savvy Navvy locking these behind premium is widely criticised
4. **Community data that stays open** — ActiveCaptain's Garmin acquisition left a bad taste
5. **Offline capability** — non-negotiable for sailors
6. **Beautiful, modern UI** — Orca has shown this matters. OpenCPN's wxWidgets look drives away newcomers
7. **Signal K integration** — the DIY sailing community is significant and underserved by commercial tools
8. **Honest, no-dark-patterns approach** — sailors are a sceptical, technically literate audience who despise being manipulated

### Critical Watch Items

- **S-100 transition (2025-2029):** Build S-57 now but architect for S-100 compatibility
- **PredictWind's AI weather models:** If they work well, they'll set a new baseline for weather routing
- **Signal K MCP Server:** The AI + boat data integration could be transformative
- **VectorCharts / MarineCharts.io:** If a good open-source nautical vector tile pipeline emerges, it changes the chart display game entirely
- **Orca's hardware play:** If they succeed with Orca Display 2, the integrated hardware + software model could lock in users

### Final Assessment

The marine navigation software market is ripe for disruption. Commercial tools are expensive, increasingly locked down, and frustrating users with aggressive monetisation. Open-source alternatives exist but are trapped in 2005-era desktop paradigms.

A web-native, open-source chartplotter with modern UI, community-owned data, and Signal K integration could genuinely carve out a significant position — especially if it's free for core features and builds trust through transparency and community governance.

The technical building blocks are all available: MapLibre for rendering, NOAA for chart data, Open-Meteo for weather, Signal K for instrument data, and well-understood algorithms for routing. The missing piece is execution — bringing it all together with the kind of design quality and user experience that Orca has shown is possible, but with the openness that the sailing community craves.

This is not a small project. But the pieces fit together, the community need is real, and the timing is right.

---

## Sources

### Commercial Tools
- [Savvy Navvy](https://www.savvy-navvy.com/)
- [Navionics / Garmin Boating](https://www.navionics.com/)
- [PredictWind](https://www.predictwind.com/)
- [Orca](https://getorca.com/)
- [FastSeas](https://fastseas.com/)
- [iSailor](https://apps.apple.com/us/app/w%C3%A4rtsil%C3%A4-isailor/id398456162)
- [TimeZero](https://mytimezero.com/)
- [SEAiq](https://seaiq.com/)
- [Orca Review Series — Morgan's Cloud](https://www.morganscloud.com/2025/12/28/orca-navigation-system-review-part-4-orca-app/)
- [PredictWind AI Features — Cruising Compass](https://www.bwsailing.com/cc/2025/12/predict-wind-adds-ai-to-forecast-and-routing-software/)
- [Savvy Navvy Tech Stack — StackShare](https://stackshare.io/savvy-navvy/savvy-navvy)

### Open Source Projects
- [OpenCPN GitHub](https://github.com/OpenCPN/OpenCPN)
- [OpenCPN Monolith Issue #2354](https://github.com/OpenCPN/OpenCPN/issues/2354)
- [Signal K Server GitHub](https://github.com/SignalK/signalk-server)
- [Signal K MCP Server Announcement](https://signalk.org/2025/introducing-signalk-mcp-server-ai-powered-marine-data-access/)
- [OpenPlotter](https://openmarine.net/openplotter)
- [CANBoat](https://github.com/canboat/canboat)
- [AvNav](https://open-boat-projects.org/en/avnav/)
- [OpenCPN Weather Routing Plugin](https://github.com/seandepagnier/weather_routing_pi)
- [open-boat-projects.org](https://open-boat-projects.org/en/)

### Chart Data
- [NOAA ENCs](https://charts.noaa.gov/ENCs/ENCs.shtml)
- [OpenSeaMap](https://map.openseamap.org/)
- [UKHO / Admiralty](https://www.admiralty.co.uk/)
- [IHO Standards](https://iho.int/en/standards-and-specifications)
- [s57tiler](https://github.com/manimaul/s57tiler)
- [MarineCharts.io](https://marinecharts.io/)
- [VectorCharts](https://vectorcharts.com/)

### Mapping Technology
- [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/)
- [MapLibre GitHub](https://github.com/maplibre/maplibre-gl-js)
- [BAUV-Maps — S-57 Web Viewer](https://github.com/kaaninan/BAUV-Maps)
- [nautograf — S-57 Tile Viewer](https://github.com/hornang/nautograf)

### Weather & Environmental Data
- [Open-Meteo Marine API](https://open-meteo.com/en/docs/marine-weather-api)
- [Stormglass API](https://stormglass.io/)
- [NOAA Tides & Currents](https://tidesandcurrents.noaa.gov/web_services_info.html)
- [NDBC](https://www.ndbc.noaa.gov/)
- [OSCAR Ocean Currents (NASA)](https://podaac.jpl.nasa.gov/dataset/OSCAR_L4_OC_INTERIM_V2.0)
- [Copernicus Marine Service](https://data.marine.copernicus.eu/)
- [ECMWF Open Data](https://github.com/ecmwf/ecmwf-opendata)
- [OpenGribs](https://opengribs.org/en/gribs)
- [OpenSkiron](https://openskiron.org/en/openwrf)
- [WorldTides API](https://www.worldtides.info/apidocs)
- [UK Bathing Water Quality API](https://environment.data.gov.uk/bwq/)
- [NOAA HABSOS](https://habsos.noaa.gov/)
- [NOAA SST](https://www.climate.gov/maps-data/data-snapshots/data-source/sst-sea-surface-temperature)

### AIS & Vessel Tracking
- [aisstream.io](https://aisstream.io/)
- [AISHub](https://www.aishub.net/)
- [AISViz](https://github.com/AISViz)
- [OpenAIS](https://open-ais.org/)

### Marine Wildlife & Environment
- [OBIS-SEAMAP](https://seamap.env.duke.edu/)
- [Whale Hotline API](http://hotline.whalemuseum.org/api)
- [neaps/tide-database](https://github.com/neaps/tide-database)
- [ndbc-api Python Package](https://github.com/CDJellen/ndbc-api)

### Community & Reviews
- [ActiveCaptain Community](https://activecaptain.garmin.com/)
- [Panbo — ActiveCaptain Review](https://panbo.com/garmins-new-activecaptain-community-site-whats-good-and-whats-not/)
- [Wavve Boating](https://www.wavveboating.com/)
- [KnowWake](https://www.knowwake.com/)
- [Savvy Navvy YBW Forum Complaints](https://forums.ybw.com/threads/savvy-navvy-on-android-waste-of-money-imho.598702/)
- [Navionics Price Complaints — Sailboat Owners Forums](https://forums.sailboatowners.com/threads/navionics-price-increasing.1249938013/)

### Research & Technical Papers
- [AI-Based Autonomous Sailboat Navigation Review (2025)](https://onlinelibrary.wiley.com/doi/full/10.1002/rob.70004)
- [Isochrone Method Research — Taylor & Francis](https://www.tandfonline.com/doi/full/10.1080/17445302.2024.2329011)
- [Ship Weather Routing Optimisation — ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0029801825009114)
- [Small Language Models for Maritime — MDPI](https://www.mdpi.com/1424-8220/26/5/1590)
