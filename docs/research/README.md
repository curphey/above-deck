# Research Index

Research organised by topic area. Each folder contains deep-dive documents supporting the [product vision](../above-deck-product-vision-v2.md) and [technical architecture](../above-deck-technical-architecture.md).

---

## `competitive/` — Market & Competitors

| Document | Summary |
|----------|---------|
| [competitive-landscape.md](competitive/competitive-landscape.md) | 25+ competitors, market gaps, positioning |
| [competitive-intelligence-update.md](competitive/competitive-intelligence-update.md) | YachtOS, circumnavigation tools, clearance, digital switching, regulations |
| [savvy-navvy-deep-dive.md](competitive/savvy-navvy-deep-dive.md) | Savvy Navvy analysis |
| [predictwind-orca-navily-opencpn-analysis.md](competitive/predictwind-orca-navily-opencpn-analysis.md) | PredictWind, Orca, Navily, OpenCPN |
| [keeano-deep-dive.md](competitive/keeano-deep-dive.md) | Keeano analysis |
| [d3kos-and-marine-os-deep-dive.md](competitive/d3kos-and-marine-os-deep-dive.md) | d3kOS, BBN OS, OpenPlotter |
| [apps-and-github-projects.md](competitive/apps-and-github-projects.md) | 25+ apps, 30+ GitHub projects |

## `hardware/` — Hardware, Gateways & Connectivity

| Document | Summary |
|----------|---------|
| [industrial-sbc-and-docker-research.md](hardware/industrial-sbc-and-docker-research.md) | **Spoke hardware**: Pi 5, CM5, HALPI2, N100, fitlet3, Docker, power management, 3 tiers |
| [sailor-hardware-landscape.md](hardware/sailor-hardware-landscape.md) | Hardware survey — gateways, sensors, instruments |
| [hardware-connectivity-technologies.md](hardware/hardware-connectivity-technologies.md) | Gateway-first architecture, USB/WiFi/Ethernet adapters |
| [can-bus-technology.md](hardware/can-bus-technology.md) | CAN bus, NMEA 2000 protocol, Go libraries |
| [marine-mfd-platforms-and-integrations.md](hardware/marine-mfd-platforms-and-integrations.md) | MFD vendor platforms, integration patterns |
| [mfd-platform-ecosystems.md](hardware/mfd-platform-ecosystems.md) | MFD ecosystem comparison |
| [raymarine-axiom2-deep-dive.md](hardware/raymarine-axiom2-deep-dive.md) | Axiom 2 UX patterns (our design reference) |
| [smart-home-and-pwa-integration.md](hardware/smart-home-and-pwa-integration.md) | Smart home, Matter/Thread, PWA patterns |
| [matter-protocol-iot-integration.md](hardware/matter-protocol-iot-integration.md) | Matter protocol for marine IoT |

## `data-and-apis/` — Data Sources & APIs

| Document | Summary |
|----------|---------|
| [data-source-matrix.md](data-and-apis/data-source-matrix.md) | **Master matrix**: 40+ sources, limits, auth, costs, licenses, access instructions |
| [data-source-licenses.md](data-and-apis/data-source-licenses.md) | Licensing analysis for all data sources |
| [marine-data-apis.md](data-and-apis/marine-data-apis.md) | 40+ free marine data endpoints |
| [solar-energy-research.md](data-and-apis/solar-energy-research.md) | PVGIS, NASA POWER, solar fundamentals |
| [vessel-registration-systems.md](data-and-apis/vessel-registration-systems.md) | MMSI, IMO, call signs, flag registries |

## `navigation-and-weather/` — Charts, Weather, Tides, Routing

| Document | Summary |
|----------|---------|
| [s57-enc-chart-rendering.md](navigation-and-weather/s57-enc-chart-rendering.md) | **S-57 → MapLibre pipeline**: GDAL, PMTiles, S-52 symbology |
| [mapping-and-chart-technology.md](navigation-and-weather/mapping-and-chart-technology.md) | Chart rendering, vector tiles, MapLibre |
| [marine-weather-deep-dive.md](navigation-and-weather/marine-weather-deep-dive.md) | Weather data sources, GRIB, forecast models |
| [weather-routing-radar-autopilot-deep-dive.md](navigation-and-weather/weather-routing-radar-autopilot-deep-dive.md) | **ECMWF open data, isochrone algorithm, radar, autopilot, AIS** |
| [fastseas-and-weather-routing-research.md](navigation-and-weather/fastseas-and-weather-routing-research.md) | FastSeas, weather routing algorithms |
| [tides-and-currents.md](navigation-and-weather/tides-and-currents.md) | Tidal prediction, NOAA CO-OPS, FES2022, harmonics |
| [passage-planning-workflows.md](navigation-and-weather/passage-planning-workflows.md) | APEM framework, planning patterns |

## `platform-and-architecture/` — Architecture, Deployment, Go Ecosystem

| Document | Summary |
|----------|---------|
| [infrastructure-gaps-research.md](platform-and-architecture/infrastructure-gaps-research.md) | **Sync, auth, cameras, licensing, Apple Sign In** |
| [deployment-architecture.md](platform-and-architecture/deployment-architecture.md) | Docker, hosting, CI/CD |
| [go-marine-ecosystem.md](platform-and-architecture/go-marine-ecosystem.md) | Go libraries for marine (NMEA, AIS, CAN, GRIB) |
| [pwa-and-mobile-capabilities.md](platform-and-architecture/pwa-and-mobile-capabilities.md) | PWA, offline, Capacitor |
| [carplay-marine-analogy.md](platform-and-architecture/carplay-marine-analogy.md) | Multi-surface architecture patterns |

## `ux-and-design/` — UI/UX Patterns

| Document | Summary |
|----------|---------|
| [visual-design-patterns.md](ux-and-design/visual-design-patterns.md) | Blueprint aesthetic, dark mode, CSS techniques |
| [chartplotter-ui-patterns.md](ux-and-design/chartplotter-ui-patterns.md) | Commercial MFD UX research |
| [community-platform-patterns.md](ux-and-design/community-platform-patterns.md) | Forum, auth, moderation patterns |

## `domain/` — Domain-Specific

| Document | Summary |
|----------|---------|
| [boat-systems-monitoring.md](domain/boat-systems-monitoring.md) | Victron, NMEA 2000, live sensor integration |

---

## Top-Level Documents

| Document | Summary |
|----------|---------|
| [SYNTHESIS.md](SYNTHESIS.md) | Cross-cutting synthesis of all research |
| [README.md](README.md) | This index |

---

## Research Gaps (remaining)

| Gap | Priority | Notes |
|-----|----------|-------|
| Port/marina information | Medium | Beyond POI pins — what sailors need at each port |
| Provisioning planning | Low | Food/water planning, shopping lists |
| Electrical load analysis | Medium | Full energy management beyond solar |
| Circumnavigation planning tools | Low | Validated as gap — no interactive tools exist |
| Cruising administration | Medium | Clearance, customs, insurance requirements DB |
