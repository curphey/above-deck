# Deep Dive: PredictWind, Orca, Navily, OpenCPN

**Date:** 2026-03-08

---

## 1. PredictWind

### Overview
Industry-leading weather routing platform for offshore sailors. Founded in New Zealand, used by professional and amateur ocean racers worldwide.

### Pricing
| Tier | Annual | Key Features |
|------|--------|-------------|
| Free | $0 | 11 forecast models, daily briefing, basic AIS |
| Basic | $29/yr | Lightning, 1km wind, rain radar, alerts |
| Standard | $249/yr | Weather routing, departure planning, tidal currents, satellite AIS |
| Professional | $499/yr | Ocean currents in routing, AI Polars, wave partition data, 3D hull modeling |

Plus DataHub hardware ($349-$699) for NMEA bridge, GPS, and satellite connectivity.

### Weather Routing - How It Works
- Set start/end points, boat parameters (dimensions, polars, hull shape for Pro)
- Cloud-based computation across up to 6 weather models simultaneously
- Models: ECMWF, AIFS, UKMO, GFS, ICON + proprietary PWAi, PWG, PWE
- PWAi blends ECMWF, AIFS, Fengwu, and GraphCast into one optimized forecast
- Departure Planning compares day 1-4 windows
- Professional tier adds 5D AI polars (wind, wave height, swell periods, size, boat speed)
- ECMWF Ensemble for long-range up to 28 days

### Offshore/Bluewater Features
- Offshore App works via Iridium GO!, GO exec, or Starlink
- Compressed GRIB file downloads over low-bandwidth connections
- GMDSS text alerts converted to visual warnings via AI
- Orca (whale) attack incident warnings on routing maps
- Over-the-Horizon satellite AIS (100+ nm)
- GPS tracking shareable with family
- DataHub routes traffic through least-cost satellite network automatically

### Chartplotter Integration
- **Raymarine**: PredictWind installs natively on Axiom MFDs via LightHouse 3/4
- **Garmin**: DataHub connects via NMEA 2000
- **B&G**: Legacy integration, known bugs, unmaintained
- **General**: DataHub streams NMEA 2000/0183 to any compatible device

### What Users Love
- Departure Planning removes guesswork from passage timing
- Comparing 6 weather models builds confidence
- GPS tracking overlay on weather maps
- CAPE index for thunderstorm prediction
- Accurate routing - real conditions match predictions

### What Users Hate
- Steep learning curve for advanced features
- Two separate apps (PredictWind + Offshore) cause confusion
- Cannot pause subscriptions seasonally
- Expensive for coastal/weekend sailors
- B&G integration is buggy and unmaintained

### Unique Differentiators
- Only private company generating 1km resolution forecasts (CSIRO CCAM technology)
- AI Polars that learn from how you actually sail your specific boat
- GMDSS AI scrapes all global text forecasts and renders visually
- DataHub ecosystem combining GPS, WiFi, NMEA, satellite, AIS, autopilot in one device

---

## 2. Orca

### Overview
Modern chartplotter replacement that runs on phone, tablet, laptop, Apple Watch, and dedicated marine display. Based in Hamburg, Germany. Rapidly growing with a hardware + software business model.

### Pricing
| Tier | Annual | Key Features |
|------|--------|-------------|
| Free | EUR 0 | Full navigation, GPS, instruments, radar, autopilot, engine routing, 1yr logbook |
| Plus | EUR 49/yr | Offline charts, satellite hybrid, sail routing |
| Smart Nav | EUR 149/yr | Auto-rerouting, AIS with vessel images, collision avoidance, 5yr logbook |

Hardware: Core (EUR ~499), Display 2 (EUR ~899), both include 1yr Smart Navigation.

### Weather Routing
- Calculates thousands of potential routes using wind forecasts + boat polars
- Sources: National weather services (NOAA, Met Office, Meteo France, DWD, etc.)
- Does NOT use ECMWF or proprietary AI models (unlike PredictWind)
- Hour-by-hour graph and map sync together
- Toggle Summary/Wave/Tide views along timeline

### Unique: Automatic Rerouting
- Continuously monitors weather changes and route deviations
- Recalculates when tacks happen earlier than planned or wind shifts
- Factors in "cost of setting and lowering sails" to avoid repetitive switching
- **No other primary nav system does this natively**

### Route Planning UX
1. Tap destination on chart (or search)
2. Auto-generates route considering depth, obstacles, vessel dimensions
3. Route threads through narrow passages even when sailing upwind
4. Press Weather button for hour-by-hour forecast along route
5. Accept or modify waypoints
6. Start navigation - auto rerouting kicks in

### Chartplotter Integration
- NMEA 2000 plug-and-play via Orca Core
- Works with Garmin, Raymarine (via adapter), B&G/Simrad
- Autopilot control including via Apple Watch
- Radar integration (Raymarine supported, B&G Halo has display issues)

### What Users Love
- Beautiful modern UI with crisp charts
- 3D chart view is best-in-class
- Auto-routing handles 96% of all saved routes
- Light characteristics shown on charts without clicking
- Cross-platform flexibility
- Rapid development pace
- Apple Watch autopilot for singlehanding
- Charts follow proper paper-chart symbology

### What Users Hate
- **Tidal stream ignorance**: Unaware of major tidal gates (Dorus Mor, Cuan Sound). "Frankly makes it unsafe" in tidal waters
- Auto-routing bugs (incorrect start points, "too long" errors)
- Sail routing needs internet (no offline weather-aware routing)
- Chart coverage gaps in some harbor areas
- No GRIB file support
- No satellite communication integration (no Iridium/Starlink)

---

## 3. Navily

### Overview
Community-driven cruising guide with 1M+ users, 35,000+ marinas/anchorages, and 350,000+ reviews/photos. European focus with marina booking capability.

### POI Data Per Location
**Anchorages:** Depth, seabed type, wind protection score, photos, reviews, GPS coordinates
**Marinas:** Price list, hours, events, tourist attractions, services, facilities, phone, real-time availability (partner marinas)
**Weather:** Wind/swell forecasts in 3-hour increments, temperature
**Protection score:** Visual rating of how sheltered each anchorage is

### Community Contributions
- Users submit photos, reviews, depth info, seabed conditions, wind protection ratings
- Traffic light system for anchorage quality
- All content auto-translated for international community
- In-app chat with users and marinas
- Real-time warnings from other users
- Emergency SOS broadcast to nearby community

### Pricing
- **Free**: All POIs, reviews, photos, 12-hour weather, ads
- **Premium (EUR 19.99/yr)**: 72-hour weather, offline mode, distance calc, auto itineraries, no ads

### What Users Hate
- Marina booking prices have significant markup vs direct contact
- No-refund cancellation policy even for weather/mechanical emergencies
- Coverage patchy outside Mediterranean/Northern Europe
- Requires internet for most features

---

## 4. OpenCPN

### Overview
Fully open-source (GPLv2) marine chartplotter. Runs on Windows, Linux, Mac, Android, Raspberry Pi. Beloved by technical cruisers. Active community on CruisersForum.

### Plugin Ecosystem (40+ plugins)

**Navigation:** Celestial Navigation, Route Great Circle, Dead Reckoning, Tidal Currents
**Weather:** Weather Routing (isochrone-based), WeatherFax (HF reception), Climatology (historical)
**Charts:** S63, O-charts, PhotoLayer, satellite overlays
**AIS/Radar:** AIS Display, Radar, RTL-SDR AIS (software-defined radio)
**Performance:** Tactics, Dashboard Tactics, Polar diagrams, Windvane, Plots
**Safety:** OcpnDraw (annotations), Watchdog (alarms), SAR (search & rescue)
**Logging:** Logbook, Voyage Data Recorder
**Integration:** SignalK, NMEA 2000 (TwoCan), Pypilot autopilot, Shipdriver
**Custom:** JavaScript plugin for scripting/automation

### Weather Routing Plugin (Detail)
- Isochrone method with GRIB data or averaged climate data
- 700 sample boat polars included
- Can combine GRIB and Climatology data (extend routing beyond GRIB timeframe)
- Configurable: min/max TWA, tack/jibe penalties, minimum speed before motoring, night sailing efficiency reduction
- GRIB data reliable for 3-4 days; longest available is 16 days

### Extensibility Architecture
- Plugins are dynamically loaded shared libraries
- Cross-platform compilation
- Plugin Manager for install/update/removal
- Developer manual with API docs
- Active development community

### What Users Love
- Completely free and open source
- Runs on minimal hardware (Raspberry Pi)
- Reads multiple chart formats, quilts seamlessly
- Excellent AIS handling with high target volumes
- Weather routing plugin is genuinely capable
- Massive plugin ecosystem
- No subscription ever required for core navigation

### What Users Hate
- Mobile app is a clunky port of desktop
- UI is dated and not intuitive
- Android chart management requires root access
- Crashes on some tablets
- Free charts adequate for planning but lack Navionics detail
- Steep learning curve, especially for plugins

### Pricing
- **Free** (GPLv2)
- Charts: Free government charts (NOAA) or paid O-charts/S63 (~EUR 15-50/region)

### Key Lesson for Above Deck
OpenCPN proves that an open-source sailing tool can build a devoted community. Its weakness (dated UX, desktop-first, hard to configure) is exactly our opportunity. Its plugin architecture is worth studying for extensibility patterns.

---

## Sources
See individual research agents for full source lists.
