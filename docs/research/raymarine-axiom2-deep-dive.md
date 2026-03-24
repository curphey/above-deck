# Raymarine Axiom 2 Pro S: Deep Dive for Software MFD Development

**Date:** 2026-03-24
**Purpose:** Comprehensive analysis of the Raymarine Axiom 2 Pro S MFD user interface and user experience to inform building an open-source software equivalent.

---

## Table of Contents

1. [Hardware Overview](#1-hardware-overview)
2. [Home Screen / App Grid](#2-home-screen--app-grid)
3. [Navigation / Chart View](#3-navigation--chart-view)
4. [Dashboard / Instruments](#4-dashboard--instruments)
5. [Weather Integration](#5-weather-integration)
6. [System Architecture (LightHouse 4)](#6-system-architecture-lighthouse-4)
7. [Sailing-Specific Features](#7-sailing-specific-features)
8. [UX Patterns Worth Copying](#8-ux-patterns-worth-copying)
9. [What Users Complain About](#9-what-users-complain-about)
10. [Competitor Comparison](#10-competitor-comparison)
11. [Implications for Our Software MFD](#11-implications-for-our-software-mfd)

---

## 1. Hardware Overview

### Display Specifications

| Model | Resolution | Brightness | Price (USD) |
|-------|-----------|------------|-------------|
| 9-inch | 1280 x 720 HD | 1200-1300 nits | $3,025 - $3,125 |
| 12-inch | 1280 x 800 WXGA | 1200-1300 nits | $4,180 - $4,280 |
| 16-inch | 1920 x 1080 FHD | 1200-1300 nits | $6,380 - $6,480 |

All displays use IPS panels with HydroTough nano-coating for water repellency and sunlight readability. IPx6/IPx7 waterproof rating. Operating temperature -25C to +55C.

### Processor and Storage

- **6-core processor** (upgraded from 4-core in Axiom Pro 1)
- **64GB solid-state drive**
- **Dual MicroSDXC slots** for chart cards and data expansion

### Physical Controls: HybridTouch

The Axiom 2 Pro S uses a "HybridTouch" control system combining touchscreen with physical keypads. The bottom four keypad buttons are **interchangeable** -- users can swap between:

1. **Autopilot keypad** -- dedicated autopilot controls
2. **Shortcut keypad** -- user-programmable soft keys

Buttons are sculpted for tactile identification without looking, critical for rough-sea operation. This hybrid approach acknowledges that touchscreens alone are unreliable in wet, bouncy conditions.

### Connectivity

| Port | Details |
|------|---------|
| RayNet (x2) | Ethernet for multi-display networking, radar, cameras |
| SeaTalkNG | NMEA 2000 backbone connection |
| Wi-Fi | Dual-band 2.4GHz + 5GHz 802.11 |
| Bluetooth | 4.0 |
| USB Micro B | Data transfer |
| HDMI Micro | External display output |
| BNC | Analog video input |
| RCA | Audio connectors |
| 25-pin | RealVision transducer connection |
| GPS/GNSS | Internal ceramic antenna, 28-satellite tracking, sub-5m accuracy with SBAS |

---

## 2. Home Screen / App Grid

### Layout and Structure

The LightHouse 4 home screen uses a **smartphone-inspired tiled interface**. Key elements:

- **Top-left corner:** Vessel GNSS position (lat/lon) -- tappable for fix accuracy and satellite settings
- **Status area:** Top bar with status icons (connectivity, GPS fix quality, time)
- **MOB button:** Prominently placed on the home screen (relocated in LH4 for safety)
- **App grid:** Tiled icons for all available apps/views
- **Custom wallpaper:** Users can set a personal photo as the home screen background, synced across networked displays

### App Tiles and Icon System

LightHouse 4.4 introduced **mode-based icons** (vs. classic icons), giving users two visual styles:

- **Classic Icons:** Simple, uniform icons per app type
- **Mode Icons:** Dynamic icons that reflect the app's current configuration. For example:
  - A chart app configured for Fish Mapping shows a distinct fishing icon
  - A chart in Navigation mode shows a navigation-specific icon
  - Fish finder icons display the current CHIRP frequency and zoom mode
  - Audio icons show the specific brand (Fusion, JL Audio, Rockford Fosgate, Wet Sounds)
  - Camera icons differentiate between engine room, port-side, stern views, etc.

This is a meaningful UX pattern -- the home screen becomes a **status dashboard** rather than just a launcher.

### Available Apps/Views

Core built-in apps:

| App | Function |
|-----|----------|
| Chart/Navigate | Primary navigation chart view |
| Fishfinder | Sonar display (CHIRP, DownVision, SideVision, RealVision 3D) |
| Radar | Radar overlay and standalone views |
| Dashboard | Instrument gauges and data pages |
| Video | Camera feeds (IP cameras, analog, FLIR thermal) |
| ClearCruise AR | Augmented reality with AIS/chart overlays on camera feed |
| Weather | SiriusXM weather and GRIB viewer |
| Audio | Marine audio system control |
| Anchor | Anchor watch with drag detection |

Third-party/downloadable apps (Android APKs signed by Raymarine):

| Category | Apps |
|----------|------|
| Entertainment | Netflix, Spotify, YouTube TV |
| Weather | Windy, PredictWind, Theyr (GRIB), Buoyweather |
| Navigation | NV Charts, PredictWind Offshore |
| Vessel Control | Seakeeper (stabilizers), Victron (energy), Lumishore (lights), Power-Pole (trolling/anchors), CMC Marine (fins), Humphree (trim) |
| Remote Access | AnyDesk |
| Monitoring | Hefring Marine (AI vessel intelligence), i@nchor (anchor winch) |

As of early 2026, approximately **39 apps and integrations** are available.

### Split Views

Split screen is a core feature allowing **two apps side by side**:

- Users can display full-screen or split-screen views of chart, radar, sonar, cameras, instruments, and third-party apps
- **Splitscreen ratio is adjustable** -- users can drag the divider to allocate more space to one side
- Common combinations:
  - Chart + Radar
  - Chart + Fishfinder
  - Chart + Dashboard
  - Chart + Camera/AR
  - Radar + Fishfinder
  - Any app + Sidebar data
- LightHouse 4 extended split-screen capability to third-party LightHouse Apps (not just core apps)

### App Page Customization

- Users can **create custom app pages** with specific app combinations
- **User profiles** allow different helm operators to have their own configurations
- Custom pages appear as tiles on the home screen grid
- **Dynamic dashboard tiles** can be placed on the home screen itself, showing real-time instrument/navigation data without opening the Dashboard app

### Pagination

The home screen supports multiple pages of app tiles. Users swipe between pages to access less-frequently-used apps.

---

## 3. Navigation / Chart View

### Chart Types Supported

| Chart Provider | Key Features |
|---------------|--------------|
| **LightHouse Charts** | Raymarine's own charts from official hydrographic sources. Four viewing modes (Day, Dusk, Night, Bright Sun). Adjustable symbol sizes. RealBathy user-generated bathymetry. Quarterly updates. No autorouting. |
| **Navionics** (now Garmin) | Navionics+ and Platinum+. Dock-to-dock autorouting. SonarChart Live crowd-sourced bathymetry. Satellite imagery overlay (Platinum). Daily updates. |
| **C-MAP** | X-Gen charts. Autorouting supported. Good coverage for European waters. |
| **CMOR** | Specialty fishing charts |
| **Strikelines** | Fishing-specific chart data |
| **Florida Marine Tracks** | South Florida specialty charts (via ISLA Mapping) |

### Chart View Features

**Data Overlay System** -- Three methods to display custom data on the chart:

1. **Sidebar:** Swipe from the right edge to reveal a data sidebar with configurable fields (speed, heading, depth, wind, etc.). Does not consume chart space when hidden.
2. **Floating Data Boxes:** Resizable, repositionable data overlays on the chart canvas. Can be deleted individually. Replace the old rigid "data bars."
3. **Dashboard Tiles:** Full instrument pages accessible from sidebar or split screen.

**Chart Layers and Controls:**
- Street layer and POI layer are independently toggleable (since LH 4.7)
- Satellite imagery overlay (with Navionics Platinum+)
- SiriusXM Fish Mapping overlay
- Fuel-range ring overlay on chart
- Distance to Go data point
- Enhanced base map with worldwide coastline, city names, ocean features (LH 4.9)
- Route/track colorization -- automatic daily color changes for visual clarity

**Context Menu (Long Press):**
- Long-press on chart shows a context menu with position data
- Menu is **draggable** -- moving your finger updates the displayed lat/lon and data in real-time (since LH 4.7)
- Options: Create waypoint, Navigate to, Autoroute to here, target info

### Route Planning UX

**Manual Route Creation:**
1. Long-press on chart to drop a waypoint
2. Add sequential waypoints to build a route
3. Waypoints can be dragged to adjust
4. "Add Another" button (LH 4.9) streamlines entering multiple waypoints back-to-back without reopening the dialog
5. Waypoint coordinate format selector -- supports DD.DDDDDD (Google Maps compatible), DMS, DDM, etc.

**Autorouting (Navionics/C-MAP only):**
- Long-press destination, select "Autoroute to here"
- Dock-to-dock autorouting calculates a safe path considering depth, obstructions, and vessel draft
- Requires current chart subscription (updated within the past year)
- LightHouse Charts do NOT support autorouting

**Route Monitoring:**
- Active route line with visual enhancements
- Distance to Go display
- Fuel range ring
- Opposite Tack COG for sailing

### AIS Target Display

- AIS targets displayed on chart with standard symbology (triangles with heading vectors)
- **CPA/TCPA calculations** -- closest point of approach and time to CPA
- **Dangerous target alarms** -- visual and audible alerts when targets enter guard zones
- **Safe zone ring** -- configurable distance/time-based zone around own vessel
- **MARPA integration** -- radar-acquired targets show same CPA/TCPA data
- AIS and MARPA share the same safe zone settings
- Own-vessel AIS data viewable (since LH 4.7)
- Target context menu shows lat/lon, course, speed, vessel name, MMSI
- AIS targets overlay on both chart and radar views
- **ClearCruise AR** overlays AIS target tags on live camera video with heading vectors

### Waypoint Management

- Create waypoints via long-press on chart, or by coordinate entry
- Multiple coordinate format support (LH 4.9)
- Waypoints stored locally on 64GB SSD
- Import/export via MicroSD card
- Waypoints visible across chart, radar, and fishfinder views
- "Goto" waypoint from fishfinder screen via long-press (LH 4.7)

---

## 4. Dashboard / Instruments

### Dashboard App Overview

The Dashboard app provides configurable data pages showing instrument data from the MFD's internal sensors and from devices connected via SeaTalkNG/NMEA 2000.

### Gauge Types

The dashboard supports multiple visualization styles:

| Type | Description |
|------|-------------|
| **Analog dial** | Traditional round gauge with needle (speed, wind angle, compass) |
| **Digital readout** | Numeric display with label and units |
| **Graphical/histogram** | Bar charts and trend displays |
| **Rolling road** | Navigation view showing course as a road ahead |
| **Autopilot status** | Dedicated autopilot data display (since LH 4.7) |

The Alpha Performance Display (separate hardware) extends this with more customizable digital, analog, and graphical displays.

### Data Items Available

All NMEA 2000 data is accessible, including:

- **Navigation:** SOG, COG, heading, bearing to waypoint, XTE, VMG, distance to go
- **Environment:** Depth, water temperature, air temperature, barometric pressure
- **Wind:** True wind speed/angle, apparent wind speed/angle, wind shift indicators
- **Engine:** RPM, fuel flow, fuel remaining, oil pressure, coolant temp, trim, hours
- **Tanks:** Fuel level, water level, holding tank level
- **Electrical:** Battery voltage, charge state (with Victron integration)
- **Sailing:** VMG to wind, polar speed %, tack/gybe angles, layline data
- **Autopilot:** Mode, heading, rudder angle, status

### Customizable Dashboard Pages

- Dashboard comes **pre-configured with default pages** for common use cases
- Users can **add, remove, and reorder pages**
- Each page can contain multiple data items in configurable layouts
- Dashboard can display in **fullscreen or half-screen portrait** modes
- Data damping controls (LH 4.6) smooth depth, speed, wind, and compass readings
- New sailing-specific dashboard pages with wind shift indicators, next-leg data, and polar performance

### Three-Tier Data Display Architecture

This is a key UX insight. Raymarine provides data at three levels:

1. **Home screen tiles** -- At-a-glance data without opening any app
2. **Sidebar + floating boxes** -- Quick data overlay on top of any active app
3. **Full Dashboard app** -- Dedicated instrument pages with full gauge layouts

This progressive disclosure pattern lets users choose their information density.

---

## 5. Weather Integration

### SiriusXM Weather (US/North America)

- Real-time weather data overlay on chart view
- Satellite weather radar imagery
- Wind, wave, sea surface temperature data
- Lightning strike locations
- **Known issue:** Weather overlay can obscure the navigation map underneath
- SiriusXM Fish Mapping data overlays on compatible charts (LightHouse, Navionics, C-MAP, CMOR, Strikelines)

### GRIB Viewer / Theyr Weather

- **Theyr Weather partnership** provides GRIB file viewing directly on the MFD
- Requires internet connection to download forecasts
- Available as a home screen app
- Global weather forecast coverage
- Subscription-based service

### Third-Party Weather Apps

- **Windy** -- Wind and weather visualization
- **PredictWind** -- Route-specific weather forecasting
- **Buoyweather** -- Marine-specific weather data

### Limitations

- No offline GRIB file import from USB/SD card (requires internet)
- SiriusXM is US-only, subscription-based
- Weather data is a read-only overlay -- does not integrate with routing algorithms
- No weather routing optimization (PredictWind app handles this separately)

---

## 6. System Architecture (LightHouse 4)

### Operating System

- **LightHouse 4** is based on **Android** (the Axiom's native OS since LightHouse 3)
- **LightHouse 2** (legacy devices) was Linux-based
- The Android foundation enables APK-based third-party app support
- LightHouse is a heavily customized Android shell -- users cannot access the Android launcher or install arbitrary APKs

### App Framework

**Built-in Apps:**
- Core navigation, sonar, radar, dashboard, video apps are native to LightHouse
- Developed by Raymarine, tightly integrated with hardware

**Third-Party Apps:**
- Android APK format
- **Must be digitally signed by Raymarine** -- apps from Google Play or other sources cannot be installed
- Distributed via Raymarine.com downloads, not an on-device app store
- Raymarine does not warrant or support third-party apps
- Installation via MicroSD card or Wi-Fi download

**Hardware Apps (Auto-Discovery):**
- When compatible hardware is detected on the network (e.g., Seakeeper gyro, Victron battery monitor), the corresponding app **automatically appears** in the Apps menu
- Zero configuration for the user

### Multi-Display Networking

**RayNet (Ethernet):**
- Two RayNet ports per Axiom 2 Pro S
- Ethernet backbone for connecting multiple Axiom displays
- RayNet switches available for larger networks
- Shared data: chart position, waypoints, routes, radar feed, camera feeds, sonar data
- System-wide wallpaper syncs across networked displays (LH 4.7)
- All networked MFDs display audible and visual alarm warnings simultaneously

**SeaTalkNG (NMEA 2000):**
- Raymarine's proprietary NMEA 2000 cabling system
- Carries GPS position, compass heading, depth, speed, wind, AIS targets, waypoint data, engine data, battery status
- Connects instruments, autopilots, wind sensors, depth transducers

**SeaTalkHS:**
- High-speed Ethernet variant for radar and sonar data

### Integration Capabilities

| System | Integration Method |
|--------|-------------------|
| Autopilot (Evolution) | SeaTalkNG -- full control from MFD, steer-to-polar mode for sailing |
| Radar (Quantum 2, Cyclone) | RayNet Ethernet -- radar overlay on chart, MARPA tracking |
| Sonar modules | 25-pin direct or RayNet |
| Cameras (CAM300, FLIR) | RayNet + AR200 sensor module for ClearCruise AR |
| AIS (AIS700) | SeaTalkNG -- Class B transceiver data |
| VHF (Ray73) | SeaTalkNG -- DSC distress relay, channel selection |
| Engines (Mercury, Yamaha) | NMEA 2000 via SmartCraft Connect or Command Link |
| Audio (Fusion, JL Audio) | RayNet or NMEA 2000 |
| Stabilizers (Seakeeper) | RayNet -- full gyro control from MFD |
| Energy (Victron) | LightHouse App -- battery/solar/inverter monitoring |
| Internet (YachtSense Link) | 4G router with dual carriers, Starlink support |

### Software Updates

- Free lifetime updates for all Axiom owners
- Distribution via Wi-Fi or MicroSD card
- Must update all networked displays to the same version
- Sequential update path required (cannot skip intermediate versions)
- Typical update cadence: 2-3 major releases per year

---

## 7. Sailing-Specific Features

The Axiom 2 Pro S has a strong sailing feature set, making it particularly relevant for our project.

### Polar Performance Data

- **500+ preloaded polar profiles** for racing and cruising sailboats
- Polars describe optimal speed at different true wind angles and speeds
- Used to calculate: optimal tack angles, VMG, time/distance to tack, polar speed percentage
- **Polar Manager:** Import and edit custom polars directly on the MFD
- Custom polars importable via CSV on MicroSD card
- Multiple polar tables supported (inshore, offshore, short-handed configurations)
- Data sources: boat manufacturers, class associations, rating certificates, owner calculations

### Dynamic Laylines

- Real-time laylines displayed on the chart based on polars or fixed angles
- Shows how far to sail on current tack before tacking to reach target waypoint
- Accounts for current wind speed and direction
- Layline data includes Beat Angle and Run Angle (since LH 4.7)

### Race Features

- **SmartStart starting line tool:** Shows line bias, time to burn, favored end
- **Adjustable race timer**
- **Race-specific dashboard pages**
- **Tactical VMG indicators:** Dial showing direction to steer for maximum VMG to windward

### Autopilot Sailing Modes (since LH 4.6)

- **Steer-to-Polar:** Autopilot steers to target wind angle from boat's polars for optimal VMG
- **Wind Vane Steering:** Apparent Wind Angle (AWA) and True Wind Angle (TWA) modes
- **Standard heading and navigation modes** remain available
- **Automatic speed calibration:** Patented technique to eliminate tack-to-tack, heel, and linearity errors from speed transducer

### Wind Data Enhancements

- Wind shift indicators with customizable visual bars and numerical displays
- Next Leg Target Wind Angle (TWA), Target Apparent Wind Angle, Target True Wind Angle
- Opposite Tack Course Over Ground (COG)
- Sail plan recommendations: real-time alerts for raising, reefing, or changing sails
- Data damping controls for wind smoothing

---

## 8. UX Patterns Worth Copying

### Touch Interaction Patterns

| Gesture | Action |
|---------|--------|
| **Tap** | Select item, activate button |
| **Long press** | Context menu on chart (create waypoint, navigate to, get info). Menu is draggable with live data updates. |
| **Pinch zoom** | Chart/radar zoom. Described as "iPad-level accuracy." |
| **Pan/drag** | Move chart view. "As fast as on a PC" -- no stutter. |
| **Swipe from right** | Reveal sidebar data panel |
| **Swipe left/right** | Navigate between home screen pages |

### Status Bar Design

The top status area contains:
- **GPS position** (top-left) -- tappable for satellite status and fix accuracy
- **Status icons:** GPS fix quality, Wi-Fi, Bluetooth, network connectivity
- **MOB button** -- prominently placed, accessible from home screen and all apps
- **Waypoint/MOB icon** at top of all app views

### Split View Compositor

- Two-panel split with adjustable divider ratio
- Any two core apps can share the screen
- LightHouse Apps (third-party) also support split view (since LH 4)
- Sidebar overlays on top of any app (does not consume a split panel)
- Each panel operates independently (own zoom level, own settings)

### Alarm System

| Alarm Type | Behavior |
|------------|----------|
| **Anchor drag** | Automatic detection based on swing circle calculation. Audible + visual. Fine-tunable depth, chain length, anchor position (LH 4.9). |
| **Shallow depth** | Configurable in 0.1m increments. |
| **CPA/TCPA** | Dangerous AIS/MARPA target approaching guard zone. |
| **MOB** | Audible alarm repeated every 30 seconds until cancelled. Marks GPS position. |
| **System alarms** | Propagate across ALL networked MFDs -- audible and visual. |

### Settings/Configuration UX

Settings are organized hierarchically:

- **Getting Started tab** -- Home screen preferences, language, units
- **Boat Details** -- Draft, beam, fuel tanks, battery banks
- **Per-app settings** -- Each app has its own Settings menu (Menu > Settings)
- **Network settings** -- NMEA 2000, SeaTalkNG, Wi-Fi, Bluetooth
- **GNSS settings** -- Enable/disable GPS, GLONASS, Galileo, Beidou constellations individually
- LH4 simplified nested menus to reduce depth and improve readability

### User Profiles

- Multiple user profiles per MFD
- Each profile stores personal preferences: chart zoom, data overlays, sidebar configuration, favorite app pages
- Different helm operators can switch profiles without reconfiguring

### ClearCruise Augmented Reality

A standout feature that layers digital information onto the physical world:

- Live camera video feed displayed on MFD
- AIS target tags overlaid on vessels visible in the camera view
- Chart objects (ATONs, navigation marks) shown as AR overlays
- Waypoints displayed as AR markers on the horizon
- Azimuth banner ring for bearing reference
- Requires AR200 sensor module (GPS, AHRS, video stabilization) + compatible camera
- Works with both optical (CAM300) and thermal (FLIR M-series) cameras

---

## 9. What Users Complain About

### Software Stability and Performance

- **Older Axiom models struggle with newer LightHouse versions.** LH4 is "too heavy for the computing power of the earliest Axiom models." A Raymarine service agent recommended staying one update behind to avoid bleeding-edge bugs.
- **Screen freezing when zooming in.** Users report the system "feeling short of memory" during heavy chart interaction.
- **Random reboots.** Reports of units not turning on, requiring power cable disconnect/reconnect.
- **Software described as "half baked"** by some early adopters, though this has improved significantly with LH4 updates.

### Update Process

- **All networked displays must be on the same version** -- partial updates break the network.
- **Cannot skip versions** -- must install intermediate updates sequentially.
- **SD card slot placement** -- rear-mounted slots require partial disassembly on some installations to access for updates.

### Touchscreen in Wet Conditions

- **Original Axiom (pre-Axiom 2) touchscreens become unusable when wet.** "When the screen gets wet, it becomes useless, which is a real problem in rough weather and unfamiliar waters."
- HydroTough coating on Axiom 2 addresses this, but the reputation lingers.

### Missing or Late Features

- **Autorouting only works with Navionics/C-MAP** -- not with LightHouse Charts.
- **Autopilot integration was missing at launch** and added later via software update.
- **Fusion audio support was missing at launch** and added later.
- **Engine data fields are hard-coded** -- trim tab display cannot be customized (still on wish list since 2020).
- **SonarChart Live was available in LH2 but missing in LH3** -- slow to return.
- **Waypoint visibility across fishfinder screens** was a long-requested feature.
- **SiriusXM weather overlay obscures the navigation map** -- layer ordering issue.
- **Slow GPS satellite acquisition** in enclosed spaces (pilot houses), though it eventually locks and maintains tracking.

### Support and Ecosystem

- Email support is helpful but slow.
- Third-party apps are not supported by Raymarine -- users are on their own.
- Chart subscription requirements for autorouting (must be updated within the past year) frustrate users.

### What Users Wish Existed

Based on forum analysis:

- **Screen sharing/recording** with scroll-back capability
- **Better offline weather** -- GRIB import from USB without internet
- **Faster update process** -- skip intermediate versions
- **More customizable engine data pages**
- **Better integration between weather data and route planning** (weather routing)
- **Multi-format chart overlay** -- ability to compare two chart sources simultaneously
- **Remote access from phone/tablet** -- view and control the MFD from a companion device (partially addressed by Raymarine app)

---

## 10. Competitor Comparison

### Garmin GPSMAP Series

| Aspect | Raymarine Axiom 2 | Garmin GPSMAP |
|--------|-------------------|---------------|
| **UI Learning Curve** | Moderate -- powerful but complex | Easier to learn, faster to operate |
| **Chart Rendering** | Good, improved in LH4 | Brighter, sharper, maps display better |
| **Chart Options** | Navionics, C-MAP, LightHouse Charts | BlueChart G3, LakeVu (limited to Garmin ecosystem) |
| **Sonar** | 600W, RealVision 3D | 1KW, more raw sonar power |
| **Radar** | Strong Quantum/Cyclone lineup | Good but Raymarine has edge |
| **Third-Party Apps** | Android APK model (signed by Raymarine) | OneHelm HTML5 model (web server on device) |
| **Sailing Features** | Excellent (polars, laylines, SmartStart) | Basic |
| **Price** | Comparable | Comparable |

**Key Garmin UX insight:** OneHelm uses an HTML5/web-server integration model where third-party devices host a web interface that renders on the Garmin MFD. This is architecturally closer to what a browser-based MFD could do.

### Simrad NSX (Navico)

| Aspect | Raymarine Axiom 2 | Simrad NSX |
|--------|-------------------|------------|
| **Display** | Standard aspect ratios | Ultrawide option (dual-screen effect in single display) |
| **Charts** | Multiple providers | C-MAP X-Gen (superior detail at all zoom levels) |
| **Radar** | Strong | Strong, especially for long-range navigation |
| **Sailing** | Best-in-class | B&G (sibling brand) is the actual sailing leader |

**Key Simrad insight:** The ultrawide display concept is interesting -- a single wide panel that replaces the need for split-screen compositing.

### B&G (Navico, sailing-focused)

B&G is the closest competitor for sailing-specific MFD features. Their Zeus/Vulcan line has:
- SailSteer wind display
- Laylines and racing features
- H5000 instrument system integration
- Stronger racing pedigree than Raymarine

---

## 11. Implications for Our Software MFD

### What We Can Replicate in a Browser/PWA

**Fully replicable:**

| Feature | Approach |
|---------|----------|
| Home screen app grid with live tiles | CSS Grid/Flexbox with React components. WebSocket-fed live data in tiles. |
| Split-screen compositor | CSS Grid with draggable divider. Each panel renders an independent React component. |
| Chart view with layers | MapLibre GL JS (already implemented in our chartplotter). Vector tiles, multiple layer toggles. |
| Dashboard/instruments | SVG/Canvas gauges. Analog dials, digital readouts, bar gauges. |
| Route planning | MapLibre draw tools. Draggable waypoints. Click-to-add workflow. |
| AIS target display | Already implemented via WebSocket. CPA/TCPA calculations in JavaScript. |
| Waypoint management | Local storage / IndexedDB. Import/export GPX/CSV. |
| Sidebar data overlay | Slide-out panel component. Configurable data fields. |
| Floating data boxes | Draggable, resizable React components overlaid on map. |
| User profiles | Zustand persisted store. Multiple profile support. |
| Alarm system | Web Notifications API + Audio API. Anchor drag, depth, CPA alerts. |
| Polar performance | CSV import, polar diagram rendering in SVG, VMG calculations. |
| Weather overlay | GRIB file parsing in JS (already libraries exist). Overlay on MapLibre. |
| Mode-based dynamic icons | React components that reflect current app state. |

**Partially replicable:**

| Feature | Limitation | Approach |
|---------|------------|----------|
| NMEA 2000 data | Requires SignalK server bridge | Our Go server translates NMEA 2000 to WebSocket JSON |
| Autopilot control | Requires hardware connection | SignalK PUT commands via our Go server |
| Anchor watch | Needs GPS -- browser Geolocation API is less precise | Use external GPS via SignalK for precision, browser GPS as fallback |
| Multi-display sync | No RayNet | WebSocket pub/sub via our server. Shared state. |

### What Requires Hardware We Cannot Emulate

| Feature | Why |
|---------|-----|
| Radar display | Requires radar scanner hardware (Quantum, Cyclone) |
| Sonar/fishfinder | Requires transducer and sounder module |
| FLIR thermal imaging | Requires FLIR camera hardware |
| ClearCruise AR | Requires AR200 sensor, camera, heading sensor |
| SiriusXM weather | Requires SiriusXM receiver hardware and subscription |
| HybridTouch physical buttons | Hardware-specific, though we could map keyboard shortcuts |

**However:** If the vessel has these devices, and they speak NMEA 2000/SignalK, our software MFD could potentially display the data. Radar and sonar raw data would require specific protocol support.

### What We Can Do BETTER Because We're Software

| Advantage | Details |
|-----------|---------|
| **AI-powered navigation** | LLM integration for route recommendations, weather analysis, passage planning assistance. Raymarine has zero AI capability. |
| **Cloud sync and backup** | Waypoints, routes, settings synced to cloud. Raymarine stores everything locally on the device with SD card backup. |
| **Cross-platform** | Same interface on MFD screen, laptop, tablet, phone. Raymarine is locked to their hardware. |
| **Social/community features** | Share routes, anchorages, local knowledge. Raymarine is single-vessel, isolated. |
| **Instant updates** | Web app updates instantly. Raymarine requires sequential SD card updates that can take 20+ minutes. |
| **No vendor lock-in** | Works with any chart source, any data source. Raymarine locks you into their ecosystem. |
| **Weather routing** | Integrate weather data directly into route optimization. Raymarine's weather is a read-only overlay with no routing intelligence. |
| **Open extensibility** | Anyone can build integrations. Raymarine requires their digital signature on every APK. |
| **Better text input** | Full keyboard for waypoint names, search, notes. MFD on-screen keyboards are painful. |
| **Multi-crew collaboration** | Multiple people on different devices viewing/editing the same passage plan simultaneously. |
| **Historical data and analytics** | Track and analyze sailing performance over time. Polar accuracy improvement. Passage logs. |
| **Free and open source** | Raymarine Axiom 2 Pro S costs $3,000-$6,500. Our software is free. |

### Form Factor Transition: MFD to Laptop to Phone

This is a critical advantage. Raymarine's UI is designed for one screen size class (9-16 inch landscape touch panel). Our software must handle:

| Form Factor | Considerations |
|-------------|---------------|
| **Helm display (10-16")** | Primary use case. Landscape orientation. Touch-optimized. Large tap targets. Blueprint dark theme for night use. Closest to Raymarine's actual UX. |
| **Laptop (13-15")** | Navigation desk use. Mouse + keyboard. Can show more data density. Route planning is easier here. |
| **Tablet (10-12")** | Cockpit use, handheld. Portrait or landscape. Similar to helm but needs to work in direct sunlight. |
| **Phone (6")** | Quick checks at anchor, away from boat. Simplified views -- position, anchor watch, weather, alarms only. Not for active navigation. |

**Key design decision:** Rather than responsive breakpoints that rearrange the same UI, we should think of these as **different modes** with different information hierarchies -- similar to how Raymarine's mode-based icons change the home screen based on context.

### Specific Design Patterns to Adopt

1. **Three-tier data architecture:** Home screen tiles (glanceable) > Sidebar/floating boxes (overlay) > Full dashboard (immersive). This progressive disclosure pattern is well-proven.

2. **Mode-based dynamic icons:** Our app tiles should reflect current state, not be static launchers.

3. **Draggable context menus:** Long-press on chart should show a context menu that updates as the finger moves -- elegant for exploring chart data.

4. **Sidebar swipe-reveal:** Right-edge swipe to show/hide data sidebar. Simple, space-efficient, discoverable.

5. **Adjustable split ratio:** Not just 50/50 split -- let users drag the divider.

6. **Alarm propagation:** All connected devices should show alarms simultaneously, with audible and visual cues.

7. **Profile-based personalization:** Different users, different configurations. Essential for crewed vessels.

8. **Anchor watch with tunable parameters:** Depth, chain length, position adjustment after anchoring.

### Patterns to Improve Upon

1. **Chart source flexibility:** Support OpenSeaMap, OpenCPN charts, S-57/S-63, and user-uploaded charts. Do not lock users into one chart provider.

2. **Offline-first architecture:** Raymarine requires internet for weather apps and GRIB data. Our PWA should cache everything aggressively and work fully offline.

3. **Update mechanism:** No sequential update path hell. Service worker updates are instant and automatic.

4. **Search everything:** Raymarine has no universal search. We should have a command palette (Cmd+K) for finding waypoints, places, settings, functions.

5. **Undo/redo for route editing:** Raymarine lacks this. Essential for complex passage planning.

6. **Collaborative passage planning:** Share a route link, let crew members view and comment. Impossible on Raymarine.

7. **Integration without gatekeeping:** SignalK is open protocol. No digital signing requirement for extensions.

---

## Sources

### Official Raymarine
- [Axiom 2 Pro S Product Page](https://www.raymarine.com/en-us/our-products/chartplotters/axiom/axiom-2-pro-s)
- [LightHouse OS Advanced Capabilities](https://www.raymarine.com/en-us/learning/online-guides/lighthouse-os-the-easy-operating-system-for-raymarine-axiom)
- [LightHouse 4.9 Release Notes](https://www.raymarine.com/en-us/learning/online-guides/lighthouse-4-9)
- [LightHouse 4.7 Release Notes](https://www.raymarine.com/en-us/learning/online-guides/lighthouse4-7)
- [LightHouse Apps Guide](https://www.raymarine.com/en-us/learning/online-guides/connecting-lighthouse-apps)
- [Apps and Integrations](https://www.raymarine.com/en-us/our-products/apps-integrations)
- [Sailing Features Guide](https://www.raymarine.com/en-us/learning/online-guides/lighthouse-for-sailing)
- [Polar Performance Data](https://www.raymarine.com/en-us/learning/online-guides/polar-performance-data)
- [Mode-Based Icons Guide](https://www.raymarine.com/en-us/learning/online-guides/creating-a-more-intuitive-homescreen-for-axiom-chartplotters)
- [LightHouse 4 Announcement](https://www.raymarine.com/en-us/about-raymarine/newsroom/raymarine-announces-lighthouse-4-for-boaters)
- [ClearCruise Augmented Reality](https://www.raymarine.com/en-us/our-products/marine-cameras/augmented-reality)
- [SeaTalkNG and NMEA 2000](https://www.raymarine.com/en-us/our-products/networking-and-accessories/seatalk-ng-and-nmea-2000)
- [Axiom LightHouse v3.12 Manual](https://s3.us-west-2.amazonaws.com/manuals.raymarine.com/Manuals/81370/en-US/html/index.html)
- [LightHouse Third-Party Apps Docs](https://docs.raymarine.com/81406/en-US/latest/LightHouseApps-62C7CC8F.html)
- [LightHouse Charts](https://www.raymarine.com/en-us/our-products/nautical-charts/lighthouse-charts)

### Reviews and Analysis
- [Panbo: Axiom Pro 2 First Look (MIBS 2023)](https://panbo.com/mibs-2023-raymarine-axiom-pro-2-axiom-xl-2-and-more/)
- [Panbo: LightHouse 4 Announcement](https://panbo.com/raymarine-announces-lighthouse-4-for-boaters/)
- [Panbo: ClearCruise AR on FLIR Thermal](https://panbo.com/flir-thermal-cameras-get-raymarine-clearcruise-augmented-reality/)
- [Panbo: LightHouse Sailing Features Review](https://panbo.com/raymarine-lighthouse-14-sailing-features-as-good-as-they-look/)
- [Seabits: Axiom and LightHouse 3 First Impressions](https://seabits.com/raymarine-axiom-lighthouse-3-first-impressions/)
- [MBY: Why LightHouse Charts is a Serious Alternative to Navionics](https://www.mby.com/gear/chartbusters-raymarine-lighthouse-charts-alternative-to-navionics-111410)
- [Veloce Sailing: New LightHouse for Sailors](https://velocesailing.se/2024/02/27/new-raymarine-lighthouse-released-for-sailors/)
- [BoatsGeek: Simrad vs Garmin vs Raymarine Comparison](https://boatsgeek.com/comparing-simrad-garmin-and-raymarine-navigation-systems/)

### User Forums
- [Cruisers Forum: Raymarine Axiom Series](https://www.cruisersforum.com/forums/f2/ray-marine-axiom-series-224452.html)
- [The Hull Truth: Axiom Software Updates and Issues](https://www.thehulltruth.com/marine-electronics-forum/1324725-raymarine-axiom-software-updates-other-issues.html)
- [YBW Forum: Axiom Running LightHouse 4](https://forums.ybw.com/threads/raymarine-axiom-running-lighthouse-4.624534/)
- [Raymarine Forum: Problems with Axiom 12](https://forum.raymarine.com/showthread.php?tid=3463)
- [BBCBoards: Axiom Software Wish List](https://www.bbcboards.net/printthread.php?t=827650&pp=40)
- [Sailboat Owners: Charts Comparison (LightHouse vs C-MAP vs Navionics)](https://forums.sailboatowners.com/threads/charts-lighthouse-vs-c-map-vs-navionics.179485/)
- [Trawler Forum: Should I Upgrade to LightHouse 4?](https://www.trawlerforum.com/threads/should-i-upgrade-raymarine-lighthouse-3-to-4.72321/)
