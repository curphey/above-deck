# Research Index

Organized by product domain. Each category needs: data sources, algorithms, competitor analysis, user complaints, and feature design implications.

**Product vision:** A platform that helps you manage your boat, plan your trips, and act as your personal assistant for boat life — the Chief Crew.

**Four pillars:**
1. **Boat Management** — systems, maintenance, inventory, monitoring
2. **Trips & Planning** — routes, weather, tides, provisioning, ports
3. **Communication** — VHF, DSC, AIS, crew coordination
4. **Utilities** — solar, electrical, water, fuel

---

## 1. Boat Management

| Topic | Research | Status | Gaps |
|-------|----------|--------|------|
| Hardware/sensors | [sailor-hardware-landscape.md](sailor-hardware-landscape.md) | Done | Need: specific sensor recommendations, cost analysis |
| CAN bus / NMEA 2000 | [can-bus-technology.md](can-bus-technology.md) | Done | Need: integration patterns, SignalK bridge |
| IoT / smart systems | [smart-home-and-pwa-integration.md](smart-home-and-pwa-integration.md), [matter-protocol-iot-integration.md](matter-protocol-iot-integration.md) | Done | Need: marine-specific IoT use cases |
| Connectivity | [hardware-connectivity-technologies.md](hardware-connectivity-technologies.md) | Done | Need: offshore connectivity options (Starlink, Iridium) |
| Marine OS / MFD | [d3kos-and-marine-os-deep-dive.md](d3kos-and-marine-os-deep-dive.md), [marine-mfd-platforms-and-integrations.md](marine-mfd-platforms-and-integrations.md) | Done | — |
| Maintenance tracking | — | **NOT STARTED** | Scheduling, parts inventory, service logs, alerts |
| Systems monitoring | — | **NOT STARTED** | Battery, bilge, temperature, anchor watch |

## 2. Trips & Planning

| Topic | Research | Status | Gaps |
|-------|----------|--------|------|
| Weather routing | [fastseas-and-weather-routing-research.md](fastseas-and-weather-routing-research.md) | Done | Need: GRIB data sources, routing algorithms, polar diagrams |
| Chart / mapping | [mapping-and-chart-technology.md](mapping-and-chart-technology.md), [chartplotter-ui-patterns.md](chartplotter-ui-patterns.md) | Done | Need: S-57/S-63 chart data, ENC licensing |
| Marine data APIs | [marine-data-apis.md](marine-data-apis.md), [data-source-licenses.md](data-source-licenses.md) | Done | Need: tidal API comparison, current data |
| Competitor analysis | [competitive-landscape.md](competitive-landscape.md), [savvy-navvy-deep-dive.md](savvy-navvy-deep-dive.md), [keeano-deep-dive.md](keeano-deep-dive.md), [predictwind-orca-navily-opencpn-analysis.md](predictwind-orca-navily-opencpn-analysis.md) | Done | Need: Navionics, iSailor, TZ iBoat analysis |
| Passage planning | — | **NOT STARTED** | Waypoint management, ETA, fuel calc, crew watches |
| Tides & currents | — | **NOT STARTED** | Free tide APIs, tidal atlas data, current algorithms |
| Provisioning | — | **NOT STARTED** | Food/water planning, shopping lists, duration-based calc |
| Port information | — | **NOT STARTED** | Customs/immigration, fueling, laundry, wifi, costs |

## 3. Communication

| Topic | Research | Status | Gaps |
|-------|----------|--------|------|
| VHF / DSC / GMDSS | Built (VHF sim) | Done | Need: DSC integration research, MMSI databases |
| AIS | Built (aisstream.io) | Done | Need: Class B transponder data, collision avoidance |
| Crew coordination | — | **NOT STARTED** | Watch schedules, task lists, crew profiles |
| Emergency procedures | — | **NOT STARTED** | MOB protocols, EPIRB, SART, distress procedures |

## 4. Utilities

| Topic | Research | Status | Gaps |
|-------|----------|--------|------|
| Solar energy | [solar-energy-research.md](solar-energy-research.md) | Done | Built (solar planner) |
| Electrical systems | — | **NOT STARTED** | Load calculations, alternator, shore power, inverter sizing |
| Water systems | — | **NOT STARTED** | Watermaker, tank monitoring, consumption tracking |
| Fuel management | — | **NOT STARTED** | Range calc, consumption curves, fuel stops |

## 5. Platform / Technical

| Topic | Research | Status | Gaps |
|-------|----------|--------|------|
| PWA / mobile | [pwa-and-mobile-capabilities.md](pwa-and-mobile-capabilities.md) | Done | Need: offline-first architecture design |
| Deployment | [deployment-architecture.md](deployment-architecture.md) | Done | — |
| Go ecosystem | [go-marine-ecosystem.md](go-marine-ecosystem.md) | Done | — |
| Community | [community-platform-patterns.md](community-platform-patterns.md) | Done | — |
| Design patterns | [visual-design-patterns.md](visual-design-patterns.md) | Done | — |
| Apps / OSS | [apps-and-github-projects.md](apps-and-github-projects.md) | Done | — |

---

## Priority Research Gaps

These are the areas where we have no research yet but need it to build coherent features:

1. **Tides & currents** — critical for any serious passage planning
2. **Passage planning workflows** — what does a real passage plan look like?
3. **Maintenance tracking** — every boat owner needs this, no good open-source solution
4. **Port/marina information** — beyond POI pins, what do sailors actually need to know?
5. **Weather data deep-dive** — GRIB files, forecast models, what PredictWind does
6. **Electrical load analysis** — extends the solar planner to full energy management
7. **Offline-first architecture** — boats are offline most of the time

## Research Process

For each gap:
1. What data exists? (APIs, datasets, open data)
2. What algorithms are used? (routing, prediction, optimization)
3. What do competitors do? (strengths, weaknesses, user complaints)
4. What do sailors actually want? (forums, reviews, pain points)
5. Feature implications → design doc → implementation plan
