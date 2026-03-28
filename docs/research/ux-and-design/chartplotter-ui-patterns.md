# Chartplotter User Interface Patterns Research

Research conducted 2026-03-23. Analysis of open source, commercial, and web-based chartplotter interfaces covering UI patterns, standards, pain points, and design opportunities.

---

## 1. OpenCPN (Open Source Chartplotter)

### Architecture
- Cross-platform (Windows, macOS, Linux, Android) built with C++ and wxWidgets
- Plugin ecosystem for extensibility (weather routing, instrument dashboards, etc.)
- Supports S-57 vector ENCs and BSB raster charts
- Full NMEA 0183/2000 integration, AIS decoding, autopilot waypoint navigation

### UI Layout
- **Dual Canvas Layout**: Supports two simultaneous chart views. Active panel indicated by a thin blue bar at top. First click on inactive canvas switches focus; subsequent clicks pan.
- **Toolbar Hamburger**: Left-side hamburger menu containing navigation tasks and operational controls.
- **Canvas Hamburger**: Per-canvas chart display controls (orientation, chart type, overlays).
- **Menu Bar**: Quick-access settings across the top.
- **Status Bar**: Navigation data — position, course, speed.
- **Chart Bar**: Summary of currently displayed charts with metadata.
- **Chart Quilting**: Automatic seamless blending of adjacent charts.
- **Right-click Context Menus**: Primary interaction pattern for chart-based actions (long-press on touch).

### Chart Orientation
Supports North-up, Head-up, and Course-up modes with a visible GPS/orientation indicator on canvas.

### AIS Display
- Vessel icons with heading vectors
- Color-coded threat assessment (configurable CPA/TCPA thresholds)
- Click-to-interrogate any target for full vessel details
- Filtering and alarm configuration

### Instrument Data
Dashboard plugin provides dockable instrument panels (horizontal across top, vertical on right side). Configurable gauges for SOG, COG, depth, wind, etc.

### Known UI Problems
- **Inconsistent design**: Dialogs lack uniform layout, spacing, and visual language
- **Poor discoverability**: Features are hard to find without reading documentation
- **High DPI scaling**: Lines, dialogs, and spacing don't adapt to modern high-res screens; route lines require manual weight adjustment
- **Dated aesthetic**: wxWidgets framework produces platform-native but visually dated chrome
- **Slow startup**: Notably slower than commercial alternatives
- **No professional design oversight**: Team acknowledged lack of design expertise; adopted GNOME HIG as aspirational guideline

### Strengths
- Free and open source
- Massive plugin ecosystem (weather routing, polar charts, instrument dashboards)
- Full NMEA integration — best-in-class for connecting to boat electronics
- Extremely configurable for power users
- Active development community

---

## 2. Commercial Chartplotters — Common UI Patterns

### Major Players Analyzed
- **Garmin GPSMAP** (8600/9x3 series) — Garmin Marine OS
- **Raymarine Axiom** (Axiom+, Axiom 2 Pro) — LightHouse 4
- **Simrad NSX** — Neon OS (new from-scratch OS)
- **Furuno NavNet** (TZtouch2, TZtouchXL) — TimeZero
- **B&G Zeus** (Zeus S, Zeus 2) — NavicoOS / Neon

### Chart/Map View

**Orientation Modes** (universal across all):
- **North-Up**: Chart fixed with true north at top. Vessel icon rotates. Default for most systems. Best for route planning and correlating with paper charts.
- **Head-Up**: Chart rotates so vessel heading always points up. 10-degree deadband to prevent yaw-induced jitter. Best for piloting in confined waters. Text/labels rotate and become harder to read.
- **Course-Up**: Chart stabilized with intended course at top. Resets when new course set. Compromise between north-up and head-up.

**Common chart features**: Pinch-to-zoom, pan by drag, auto-follow (re-centers on vessel), look-ahead mode (vessel positioned in lower third for more forward visibility).

### AIS Target Display

Universal conventions across commercial systems:
- **Default icon**: Blue/green wedge or triangle pointing in heading direction
- **Danger target**: Icon turns RED with audible alarm. Raymarine v15+ adds hatched red "predicted danger zones" showing collision corridors
- **Vessel vectors**: COG/SOG vector lines showing predicted future position. Configurable vector length (6 min, 30 min, etc.)
- **Click/tap to interrogate**: Shows vessel name, MMSI, position, dimensions, COG, SOG, CPA, TCPA
- **Vessel type differentiation**: Modern systems (Raymarine v15+) use distinct icons for sailing vessels, power vessels, fast ferries, commercial ships, SAR helicopters, and AtoNs (Aids to Navigation shown as diamond-with-X)
- **Filtering**: Configurable CPA/TCPA danger thresholds (e.g., CPA < 3048m AND TCPA < 5 min = dangerous). Option to hide distant/stationary targets to reduce clutter.

### Weather Overlays

- GRIB data displayed as color-filled contours, wind barbs, or directional arrows overlaid on chart
- **Wind barbs**: Standard meteorological notation — shaft indicates direction (from), half-barb = 5kt, full barb = 10kt, pennant = 50kt
- **Current arrows**: Direction and magnitude shown as colored vectors
- Pressure isobars, wave height contours, precipitation areas
- Typically requires subscription data service or manual GRIB file loading
- PredictWind DataHub integration available on some systems for direct MFD delivery

### Instrument Data Display

- **Data boxes/overlays**: Configurable data fields overlaid on chart edges showing SOG, COG, depth, wind angle/speed, water temp
- **Instrument pages**: Dedicated full-screen instrument views with circular gauges (analog style), digital readouts, or graph strips
- **Customizable dashboards**: Drag-and-drop gauge/number placement (Simrad NSX, Garmin GPSMAP)
- **Sailing-specific**: True/apparent wind displays, VMG, layline overlays (B&G speciality)
- **Data sources**: All via NMEA 2000 network — wind sensor, speed/depth transducer, GPS, compass, engine data, tank levels

### Split Screen Modes

- **Side-by-side split**: Chart + Radar, Chart + Sounder, Chart + Instruments. Minimum 12" recommended for usable splits.
- **Radar overlay**: Radar returns rendered directly on chart (all major brands support this)
- **Triple/quad split**: Larger displays (12"+) support 3-4 panel layouts
- **Quick toggle**: One-touch swap between split and full-screen for any panel
- **Activity/app bar** (Simrad NSX): Always-visible sidebar for instant app switching without returning to home — smartphone-like pattern

### Brand-Specific UI Notes

**Garmin GPSMAP**: Widely praised as the most intuitive. Touchscreen-focused. Bright, responsive displays. Clean layout. Weakness: touchscreen-only can be problematic in wet/rough conditions. Excellent sunlight visibility with anti-glare.

**Raymarine LightHouse 4**: "HybridTouch" — touchscreen + physical buttons for wet conditions. 25% brighter displays than predecessors. Quad-core processor for responsiveness. Contextual menus. Mature ecosystem.

**Simrad NSX (Neon OS)**: Built from scratch — no legacy code. Activities bar for app pinning/switching. Contextual sidebars that slide in from edges. Drag-and-drop screen customization. "Visually pleasing" and "quite polished" per Panbo review. Ultrawide display option gives dual-screen feel in single unit.

**Furuno NavNet TZtouch**: Multi-touch gestures (pinch, swipe, tap). Menus slide from screen edges. Supports driving multiple monitors via HDMI with flexible aspect ratio combos. Professional/commercial focus. Robust but complex.

**B&G Zeus**: Sailing-focused features (laylines, sailing dashboard, race start timer). Zeus S (newer) widely criticized: crashes, slow, poor reliability. Many users reverting to Zeus 2. Waypoints sent over NMEA 2000 sometimes fail to appear. Navico/Neon OS transition has been rocky.

---

## 3. Web-Based Chart Applications

### Navionics Web App (now Garmin)
- **Status**: Chart viewer stripped down significantly in 2024. Route planning removed from web version — now only in mobile app under subscription.
- **Previous strengths**: Clean web-based route planning, SonarChart crowd-sourced bathymetry, easy sharing.
- **Current**: Read-only chart viewer. Routes stored in account accessible via Boating app only.

### OpenSeaMap
- Open source nautical chart overlay on OpenStreetMap
- No proprietary data — crowd-sourced navigation marks, harbors, anchorages
- No depth contours (major limitation)
- Satellite overlay available
- Simple, clean web interface
- Useful for route creation with GPX export to other apps/plotters
- Completely free, worldwide coverage

### SailGrib WR
- Weather routing application with chart display (primarily mobile, not browser)
- Integrates Navionics/SHOM/UKHO charts via in-app purchase
- Specialized for passage planning with GRIB weather integration
- Polar-based routing optimization

### Savvy Navvy
- "Google Maps for boats" positioning — intentionally simplified
- **Clutter-free design**: Deliberately hides information other apps show, prioritizing safety-critical data
- Auto-routing that considers tides, weather, vessel draft
- Multiple chart views: 2D, 3D, Mapbox nautical, satellite, night mode
- GPX export to hardware chartplotters
- Criticism: Some find charts too sparse/simplified for serious navigation
- Strength: Lowest learning curve of any navigation app

### Orca
- **Best-in-class UI**: "By far number one when it comes to UI" — modern, clean, fast
- Built from scratch with no legacy constraints by marine electronics veterans
- Core concept: combine chartplotter performance with mobile app fluidity
- **Orca Core 2** hardware bridges boat NMEA network to app
- **Orca Display 2** is a purpose-built marine tablet (GBP 899)
- Integrated weather forecasts with real-time alerts
- Auto-routing with vessel polars for sailing optimization
- Very fast startup and smooth scrolling
- Weaknesses: Missing tidal stream data (critical for UK waters), occasional auto-routing quirks, requires subscription for advanced features

---

## 4. UX Pain Points — What Sailors Complain About

### Universal Frustrations

1. **Complexity and discoverability**: Features buried in deep menu hierarchies. Users report needing to "pour through the owner's manual" for non-Garmin brands. No progressive disclosure — everything dumped at same level.

2. **Wet/rough conditions**: Pure touchscreens become unusable with spray or gloves. Hybrid touch+button (Raymarine, Simrad) preferred at sea. This is THE fundamental input problem of marine UX.

3. **Vendor lock-in**: Charts tied to specific ecosystems. Switching brands means re-buying all chart data. No interoperability between Garmin/Navionics, C-MAP (Raymarine/B&G/Simrad), and Furuno chart formats.

4. **Reliability over features**: Sailors consistently prioritize "it works every time" over feature richness. B&G Zeus S backlash is primarily about crashes and slowness, not missing features.

5. **Information overload vs. information starvation**: Default views either show too much (cluttered chart with every symbol) or too little (stripped-back mode missing critical data). Very few systems handle progressive disclosure well.

6. **Night mode failures**: Many systems' night modes are still too bright, with UI chrome (toolbars, menus) emitting disproportionate light that ruins night vision. S-52 specifies max 1.3 cd/m2 for night area colors — most consumer chartplotters don't meet this.

7. **Slow startup and laggy interaction**: OpenCPN notably slow to start. B&G Zeus S slow in operation. Sailors expect instant-on like dedicated instruments.

8. **High DPI and modern display support**: OpenCPN's wxWidgets framework struggles with high-DPI screens. Some commercial systems also have scaling issues on newer display panels.

9. **Poor data integration**: Waypoints/routes don't always transfer between networked devices. NMEA 2000 data display sometimes silently fails (B&G Zeus S).

10. **Chart currency**: Keeping charts up to date is expensive, confusing, and often requires manual intervention via SD cards or WiFi connections.

### Sailing-Specific Complaints

- Layline calculation accuracy varies wildly between systems
- True wind computation dependent on calibrated boat speed sensor (garbage-in-garbage-out)
- Tidal stream data missing or poorly integrated in many apps (Orca, Navionics)
- Race-specific features (start line, current leg optimization) only available on B&G, limiting choices for racers

---

## 5. Standards and Regulations

### IHO S-52 — Chart Content and Display

The primary standard governing how electronic nautical charts are rendered:

- **Scope**: Specifies symbology, colors, line styles, and display rules for ECDIS (Electronic Chart Display and Information System)
- **Presentation Library**: Contains symbol library, color tables, line styles, fill patterns, and look-up tables that translate chart objects into visual symbology
- **Color Tables**: Five mandatory palettes — Bright Day, White-Back Day, Black-Back Day, Dusk, and Night. Each palette is a complete re-mapping of all chart colors for different ambient light conditions.
- **Night palette**: Maximum area color luminance of 1.3 cd/m2 — areas rendered as shades of dark grey. Designed to preserve night vision.
- **Day palette**: Maximum luminance 80 cd/m2 for bright sunlight readability.
- **Display requirements**: Minimum 270mm x 270mm screen, 864+ lines resolution, 64 colors minimum.
- **Depth representation**: Blue for areas inside safety contour. Four-shade depth system with configurable shallow/safety/deep contour values.

### IHO S-57 — ENC Data Format

- Transfer standard for digital hydrographic data between national hydrographic offices
- Defines the object catalog (features, attributes, relationships) that make up an ENC
- Being superseded by **S-101** (new data model with richer feature types and improved maintenance)

### IHO S-101 — Next Generation ENC

- Successor to S-57 with more flexible data model
- Paired with **S-100** framework for universal hydrographic data
- Enables richer data types including high-density bathymetry, surface currents, ice coverage
- New portrayal standard (**S-52 successor**) under development

### IMO Performance Standards

- Mandatory ECDIS carriage for SOLAS vessels (commercial shipping)
- Specifies functional requirements: chart display, route planning, route monitoring, alarm handling
- Consumer/recreational chartplotters are NOT required to meet IMO ECDIS standards but many borrow conventions from S-52 symbology

### NMEA Standards

- **NMEA 0183**: Serial protocol for instrument data (legacy but universal)
- **NMEA 2000**: CAN-bus network protocol for modern marine electronics. Standard for connecting GPS, wind, depth, AIS, engine, autopilot.
- **NMEA OneNet**: Emerging Ethernet/IP-based protocol for high-bandwidth data (radar, cameras, high-res charts)

---

## 6. Summary: Conventions, What Works, What's Broken, Opportunities

### Established Conventions (Do Not Deviate)

| Convention | Why It's Standard |
|---|---|
| North-up / Head-up / Course-up orientation modes | Deeply ingrained in maritime training. Regulatory requirement for ECDIS. |
| AIS: blue/green = safe, red = danger, click to interrogate | Universal across all systems. Deviating would endanger safety. |
| COG/SOG vectors on AIS targets | Critical for collision avoidance assessment |
| Wind barbs (meteorological standard) | International standard; all mariners trained on these |
| Chart symbology per S-52/INT1 | Safety-critical consistency. Buoys, lights, hazards must look the same everywhere. |
| Depth in chart datum units (meters or fathoms) | Local convention varies but format is standardized |
| Right-click / long-press for context menus on chart | Universal interaction pattern in all chartplotters |

### What Works Well

1. **Garmin's interface simplicity**: Proves that marine electronics CAN be intuitive. Low learning curve without sacrificing functionality.
2. **Simrad NSX's activities bar**: Smartphone-like app switching is a genuine UX advancement over home-screen-centric navigation.
3. **Orca's modern architecture**: Proves a from-scratch approach with no legacy produces dramatically better UX. Fast, clean, responsive.
4. **Savvy Navvy's progressive disclosure**: Hiding non-essential chart detail by default improves safety by reducing cognitive load.
5. **Raymarine's HybridTouch**: Physical buttons alongside touchscreen solves the wet-hands problem elegantly.
6. **S-52 night color tables**: Well-researched color science for preserving night vision. The 5-palette approach (bright day, white-back day, black-back day, dusk, night) is thorough.
7. **Radar overlay on chart**: Fusing radar returns with chart data in a single view is universally valued.
8. **Configurable data boxes**: Small overlaid data fields on chart edges (SOG, COG, depth) — non-intrusive but always available.

### What's Broken

1. **Menu-driven feature discovery**: Most systems bury critical functions 3-4 levels deep. No spatial memory aids.
2. **Night modes on consumer devices**: UI chrome (toolbars, status bars, notification popups) breaks night vision even when chart area is correct.
3. **No meaningful progressive disclosure**: Charts are either fully detailed or over-simplified. No intelligent zoom-level-dependent information density.
4. **Touch input in marine environment**: Wet screens, gloves, motion — touchscreens alone are insufficient.
5. **Cross-platform data portability**: Routes, waypoints, and tracks locked in vendor ecosystems. GPX export is the lowest-common-denominator escape valve.
6. **Weather integration is bolted on**: GRIB files feel like a separate system overlaid on charts rather than an integrated part of the navigation experience.
7. **AIS clutter in busy waterways**: Harbors and shipping lanes can show hundreds of targets with no intelligent filtering or prioritization.
8. **OpenCPN's visual polish**: Functional but looks dated. wxWidgets framework constrains modern UI patterns. No design system.

### Design Opportunities

1. **Intelligent information density**: Adapt chart detail, AIS targets, and instrument data to zoom level, speed, and context (anchored vs. underway vs. approaching harbor). This is the single biggest UX gap.

2. **True dark-first design**: Build for the cockpit at 0200, not the showroom floor. S-52's night palette research is the gold standard — apply it to ALL UI chrome, not just the chart area.

3. **Keyboard/gamepad/rotary input alongside touch**: Hardware input is essential at sea. Design for multiple input modalities from the start.

4. **Contextual sidebars over modal dialogs**: Simrad NSX's approach — slide-in panels that don't obscure the chart — is better than popup windows.

5. **Activity-based navigation**: Group features by what the sailor is DOING (passage planning, piloting, anchoring, racing) rather than by system function (charts, radar, instruments).

6. **Unified weather-routing-chart experience**: Weather should not be a layer toggle — it should influence routing suggestions, departure timing, and risk assessment in a single coherent view.

7. **AIS threat prioritization**: Instead of showing all targets equally, rank by CPA/TCPA and visually emphasize only the 2-3 vessels that actually matter. Use progressive disclosure for the rest.

8. **Web-native architecture**: Orca and Savvy Navvy prove that web/hybrid apps can deliver good chart performance. A web-first approach enables phone, tablet, and dedicated display from one codebase.

9. **Open data and interoperability**: S-57/S-101 ENCs, OpenSeaMap, crowd-sourced data. Avoid proprietary chart lock-in. SignalK for open instrument data.

10. **Blueprint/technical drawing aesthetic**: Marine instruments have historically used a clean, technical visual language (think radar screens, depth sounders). A draughtsman-like UI with precise lines, monospace data, and minimal decoration aligns naturally with both maritime tradition and modern UI minimalism.

---

## Sources

- [OpenCPN GitHub](https://github.com/OpenCPN/OpenCPN)
- [OpenCPN UI Design Discussion](https://github.com/OpenCPN/OpenCPN/discussions/4323)
- [OpenCPN UI Manual](https://mail.opencpn.org/wiki/dokuwiki/doku.php?id=opencpn:manual_basic:ui_user_interface)
- [Raymarine AIS Guide](https://www.raymarine.com/en-us/learning/online-guides/automatic-identification-system)
- [Simrad NSX Review — Panbo](https://panbo.com/simrad-nsx-testing-starts-with-simrads-new-chartplotter-and-operating-system/)
- [Simrad NSX Product Page](https://www.simrad-yachting.com/nsx/)
- [Orca Navigation](https://getorca.com/)
- [Navionics vs OpenCPN vs Orca — The Low Cost Sailor](https://www.thelowcostsailor.com/en/navionics-vs-opencpn-vs-orca-which-is-the-best-chartplotter-app-for-your-boat/)
- [Garmin GPSMAP vs Raymarine AXIOM — ReviewMarine](https://reviewmarine.com/garmin-gpsmap-vs-raymarine-axiom/)
- [Comparing Simrad, Garmin, Raymarine — BoatsGeek](https://boatsgeek.com/comparing-simrad-garmin-and-raymarine-navigation-systems/)
- [Chartplotter Comparison — Practical Boat Owner](https://www.pbo.co.uk/gear/the-garmin-chartplotter-7-other-options-97141)
- [IHO S-52 Specification](https://iho.int/uploads/user/pubs/standards/s-52/S-52%20Edition%206.1.1%20-%20June%202015.pdf)
- [S-57 to S-101 Explained — ADMIRALTY](https://www.admiralty.co.uk/news/s-57-s-101-explaining-iho-standards-ecdis)
- [ECDIS Color Calibration — Hatteland](https://www.hattelandtechnology.com/blog/what-is-color-calibration-for-ecdis)
- [B&G AIS Tips](https://www.bandg.com/blog/ais-tips-and-tricks/)
- [Chart Orientation — Practical Sailor](https://www.practical-sailor.com/sails-rigging-deckgear/ps-advisor-north-up-versus-heading-up-navigation)
- [North-up vs Course-up — Sailing Anarchy](https://forums.sailinganarchy.com/threads/north-up-or-course-up-which-is-better.212895/)
- [Savvy Navvy Review — Practical Sailor](https://www.practical-sailor.com/marine-electronics/navigation-app-review-savvy-navvy/)
- [OpenSeaMap](https://map.openseamap.org/)
- [Sailing Anarchy Chartplotter Discussion](https://forums.sailinganarchy.com/threads/chartplotter-options.245930/)
- [Sailboat Owners Forums — Chartplotter Choice](https://forums.sailboatowners.com/threads/chart-plotter-choice-overwhelm.1249935783/)
- [Future of Chartplotters — Yachting World](https://www.yachtingworld.com/yachts-and-gear/the-future-of-chartplotters-144957)
- [Marine Chartplotter Market Report 2026](https://www.globenewswire.com/news-release/2026/01/21/3222670/28124/en/Marine-Chartplotter-Research-Report-2026-1-Bn-Market-Opportunities-Trends-Competitive-Landscape-Strategies-and-Forecasts-2020-2025-2025-2030F-2035F.html)
