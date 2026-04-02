# Marine Electronics Firmware Update Tracking: Feasibility Study

**Date:** 2026-03-31
**Status:** Research complete
**Related:** [Sailor Hardware Landscape](./sailor-hardware-landscape.md), [Boat Systems Monitoring](../domain/boat-systems-monitoring.md)

---

## Executive Summary

No service exists that tracks firmware updates across marine electronics manufacturers. Every boat owner with mixed-brand electronics (nearly all of them) must manually check 3-10 different manufacturer websites, apps, and portals to discover if updates are available. Victron Energy has explicitly stated that proactive firmware alerts are "not planned." This is a clear gap that aligns with Above Deck's boat management vision.

The marine industry mirrors where home automation was circa 2015 — walled gardens, no cross-vendor standards, and users left to manually manage updates across a growing fleet of smart devices. Home Assistant solved this for smart homes. Nobody has done it for boats.

**Recommendation:** Build firmware tracking as a feature within the boat management tool, not as a standalone service. The device inventory that powers firmware tracking also feeds energy planning, maintenance scheduling, and passage planning.

---

## 1. The Scale of the Problem

### Devices Per Boat

A well-equipped cruising catamaran may have **15-30 firmware-updateable devices**:

| Category | Typical Count | Example Brands |
|----------|--------------|----------------|
| MFDs (chartplotters) | 1-2 | Garmin, Raymarine, Simrad, B&G |
| Radar | 1 | Garmin, Raymarine, Simrad |
| Autopilot (computer + head) | 1-2 | B&G, Raymarine, Garmin |
| Instrument displays | 2-4 | B&G Triton, Raymarine i70 |
| AIS transponder | 1 | em-trak, Vesper, Digital Yacht |
| VHF radio | 1 | Standard Horizon, ICOM |
| Victron power devices | 3-5 | MPPT, MultiPlus, SmartShunt, Cerbo GX, Lynx BMS |
| Digital switching modules | 2-8 | CZone, EmpirBus |
| Marine stereo + remote | 1-2 | Fusion (Garmin) |
| Router | 1 | Peplink, Starlink |
| NMEA 2000 gateways/sensors | 2-4 | Yacht Devices, Maretron, Actisense |

Each brand requires its own app, software, or hardware tool to check and apply updates.

### Update Mechanisms by Brand

| Brand | Update Method | Notification | API Available? |
|-------|--------------|--------------|----------------|
| **Victron** | BLE (VictronConnect), VRM remote push, USB | VictronConnect shows icon when connected | Yes — VRM API v2 |
| **Garmin** | Wi-Fi (ActiveCaptain), Garmin Express, microSD | ActiveCaptain app | No (monthly PDF bulletins) |
| **Raymarine** | Wi-Fi from MFD, microSD, RayNet | None proactive | No (scrapeable pages) |
| **Simrad/B&G/Lowrance** | Wi-Fi, companion app, SD card | Companion app | No (403 bot protection) |
| **Furuno** | USB flash drive only (inserted while OFF) | None | No |
| **Maretron** | Over NMEA 2000 bus (proprietary gateway required) | None | No |
| **Mastervolt** | USB + MasterAdjust (Windows only) | None | No |
| **CZone** | Network config tool | None | No |
| **Fusion** | BLE (Fusion Audio app), USB, via Garmin MFD | Fusion Audio app | No |
| **Peplink** | Web admin, InControl 2 cloud | InControl 2 | Yes (InControl API) |
| **Starlink** | Automatic OTA (no user control) | None needed | No |

Key observation: **firmware propagation is strictly within-brand**. A Garmin MFD can update Garmin radar but not Raymarine instruments. No cross-vendor update mechanism exists.

---

## 2. Victron Deep Dive

Victron is the most viable first target due to their unusually open ecosystem.

### Data Sources

| Source | Type | Reliability | What It Provides |
|--------|------|-------------|------------------|
| GitHub (`victronenergy/venus`) | Git tags | High | Venus OS version numbers, release dates |
| VRM API v2 | REST API | High | Per-installation device firmware versions |
| Blog RSS feed | RSS 2.0 | Medium | Major release announcements |
| Professional portal | HTML page | Medium | Firmware files + changelogs (.docx) |
| Updates server | HTTP directory | High | Venus OS `.swu` files per device type |

### VRM API Details

- **Base URL:** `https://vrmapi.victronenergy.com/v2/`
- **Auth:** `POST /v2/auth/login` or personal access tokens via `X-Authorization` header
- **Demo account:** `GET /v2/auth/loginAsDemo` (user ID 22)
- **Key endpoints:** `/installations/{id}/diagnostics` returns firmware versions for all connected devices
- **41 documented endpoints** — third-party MCP server at `github.com/gimi-q/victron-vrm-mcp` documents all of them
- **Official clients:** Python (`victronenergy/vrm-api-python-client`), Node-RED module

### GitHub Presence

- **100+ repositories** at `github.com/victronenergy`
- Venus OS tags: v3.33 through v3.72 (clear semver pattern)
- Key repos: `venus`, `gui-v2`, `dbus-flashmq` (MQTT bridge), `dynamic-ess`
- Tags queryable via GitHub API with zero authentication

### Firmware Update Mechanisms

| Device Type | Protocol | Update Tool | Risk Level |
|-------------|----------|-------------|------------|
| GX devices (Cerbo, Venus) | OTA via internet or USB/SD | VRM Portal or manual flash | Low (rollback supported) |
| MPPT controllers | VE.Direct, BLE | VictronConnect or VRM remote | Low |
| Battery monitors | VE.Direct, BLE | VictronConnect or VRM remote | Low |
| Inverter/chargers (VE.Bus) | VE.Bus via MK3-USB | VictronConnect or VEFlash | **High** — settings reset to factory defaults |
| Lynx Smart BMS | VE.Can, BLE | VictronConnect or VRM remote | Medium |

### Pain Points (Victron-Specific)

1. **No centralized firmware dashboard** — must check each device individually
2. **VE.Bus updates reset all settings** — bricked inverters reported on forums
3. **Remote update limitations** — BMVs on CAN bus cannot be remotely updated
4. **Contradictory guidance** — Victron says both "update your devices" and "don't update a stable system"
5. **Fleet managers have no batch update capability** in VRM
6. **MK3-USB + VEFlash + Victron Professional account** required for VE.Bus recovery — unrealistic for average boat owners

---

## 3. Data Acquisition Strategy

### Ranked by Reliability

| Method | Manufacturers | Legal Risk | Effort | Fragility |
|--------|--------------|------------|--------|-----------|
| GitHub API (tags/releases) | Victron (Venus OS) | None | Low | Very low |
| Official REST APIs | Victron (VRM) | None | Low | Low |
| RSS feed polling | Victron blog | None | Low | Low |
| Predictable URL polling | Garmin (monthly PDFs) | None | Low | Low |
| HTML scraping (public pages) | Raymarine, Victron Pro | Low | Medium | Medium |
| App store monitoring | VictronConnect, ActiveCaptain | Low | Medium | Medium |
| HTML scraping (behind auth) | Victron Professional | Medium | Medium | Medium |
| Email newsletter parsing | Various | Low | High | High |

### Legal Position

- **hiQ v. LinkedIn (9th Circuit, 2022):** Scraping publicly available data does not violate CFAA. "Gates-up-or-down" test — if publicly accessible without login, no legal barrier.
- **Version metadata is factual data** — not copyrightable under US law.
- **Critical rule:** NEVER host or redistribute firmware binaries. Only link to official download pages. Track metadata (version numbers, dates, changelog summaries) only.
- **Behind-auth scraping** is legally riskier — stick to public pages and official APIs.

---

## 4. Proposed Architecture

### Data Flow

```
Scrapers/Monitors (Go workers, cron-scheduled)
  ├── GitHub tag watcher (Victron Venus OS)
  ├── RSS feed poller (Victron blog)
  ├── URL prober (Garmin monthly PDFs)
  ├── HTML scrapers (Raymarine, Victron Professional)
  └── VRM API poller (latest known versions)
  │
  ▼
Firmware Version Database (Supabase/Postgres)
  - manufacturer, product, version, release_date, 
    changelog_url, changelog_summary, source_url
  │
  ▼
Matching Engine
  - User device inventory → relevant updates
  │
  ▼
Notification System
  - In-app feed (primary)
  - Email digest (weekly)
  - Push notifications (critical/security updates)
```

### Integration with Boat Profile

The device inventory is the linchpin — it serves multiple tools:

| Tool | Uses Device Inventory For |
|------|--------------------------|
| **Firmware tracker** | Match devices → available updates |
| **Energy planner** | Know solar panel count, battery capacity, inverter size |
| **Maintenance scheduler** | Service intervals per device, warranty tracking |
| **Passage planner** | Know what nav equipment is available |
| **Boat profile** | Complete equipment manifest |

### Phase 1: MVP (Victron + Garmin + Raymarine)

1. **Device registry** — user registers equipment via manufacturer/model dropdowns
2. **Firmware feed** — aggregated timeline of releases across tracked manufacturers
3. **Personalized matching** — highlight updates relevant to user's registered devices
4. **Changelog aggregation** — link to changelogs, summarize key changes
5. **Email digest** — weekly notification of relevant updates

### Phase 2: Deep Integration

1. **VRM account linking** — auto-detect Victron devices and current firmware versions
2. **Community annotations** — users report issues with specific firmware versions
3. **Compatibility warnings** — flag known cross-device compatibility issues
4. **Update sequencing guidance** — recommend order for multi-device updates

### Phase 3: On-Boat Auto-Discovery via NMEA 2000

Every NMEA 2000 certified device must respond to two standard PGNs that expose device identity and firmware version:

| PGN | Name | Data Fields |
|-----|------|-------------|
| **60928** | ISO Address Claim | Unique NAME (64-bit): manufacturer code, device class, device function, device instance, system instance, industry group |
| **126996** | Product Information | NMEA 2000 database version, product code, model ID string, software version string, model version string, model serial code, certification level, load equivalency |

**PGN 126996 is the key** — the `software version string` field contains the device's current firmware version. By requesting this PGN from all devices on the bus (via an ISO Request, PGN 59904), the spoke can automatically enumerate every NMEA 2000 device and its firmware version without manual user input.

**Implementation path:**
1. Spoke sends ISO Request (PGN 59904) for PGN 126996 on the NMEA 2000 bus
2. All devices respond with their Product Information (fast-packet, up to 134 bytes)
3. Parse manufacturer code (from PGN 60928) + product code + software version string
4. Match against firmware version database (synced from hub)
5. Display update availability in boat management UI

This enables **zero-configuration firmware awareness** — plug in a gateway, and the system automatically knows every device on the bus, its manufacturer, model, and firmware version.

### Phase 3b: Expansion

- Simrad / B&G / Lowrance (Navico)
- Mercury Marine, Furuno, Maretron, Actisense

---

## 5. Competitive Landscape

### Direct Competitors

**None.** No service aggregates firmware updates across marine electronics manufacturers.

### Adjacent Services

| Service | What It Does | Gap |
|---------|-------------|-----|
| Victron VRM Portal | Shows device firmware in diagnostics | Victron-only, no proactive alerts |
| Garmin ActiveCaptain | Pushes updates to Garmin devices | Garmin-only |
| Panbo.com | Editorially covers major releases | Journalism, not a tracking service |
| Marine electronics installers | Manually track firmware for clients | Paid service contracts, not scalable |

### Analogous Services in Other Industries

| Service | Industry | Relevance |
|---------|----------|-----------|
| **Home Assistant ZHA** | Smart home | Tracks firmware across Zigbee manufacturers, pushes OTA updates — closest model |
| **Azure Device Update for IoT** | Enterprise IoT | Central firmware management for heterogeneous device fleets |
| **Mender.io** | IoT | Open-source OTA update platform |
| **Tesla FOTA** | Automotive | Single gateway orchestrates updates across 30+ ECUs — analogous to boat |

---

## 6. Key URLs and Resources

### Victron Energy
- [VRM API Docs](https://vrm-api-docs.victronenergy.com/)
- [GitHub Organization](https://github.com/victronenergy) (100+ repos)
- [Venus OS repo](https://github.com/victronenergy/venus) (release tags)
- [Professional Portal Firmware Downloads](https://professional.victronenergy.com/downloads/firmware/)
- [Blog RSS Feed](https://www.victronenergy.com/blog/feed/)
- [Open Source Page](https://www.victronenergy.com/live/open_source:start)
- [VRM MCP Server (3rd party)](https://github.com/gimi-q/victron-vrm-mcp)
- [Product ID Mapping](https://gist.github.com/seidler2547/52f3e91cbcbf2fa257ae79371bb78588)

### Garmin Marine
- [Marine Software Updates](https://www.garmin.com/en-US/support/software/marine/)
- Monthly PDF pattern: `https://www8.garmin.com/marine/PDF/MarineSoftwareUpdate/[YEAR]/[Month][Year].pdf`

### Raymarine
- [Software Updates](https://www.raymarine.com/en-us/support/software-updates-and-documents)

### Navico (Simrad/B&G/Lowrance)
- [Simrad Downloads](https://downloads.simrad-yachting.com/software/index.html)
- [B&G Downloads](https://downloads.bandg.com/software/index.html)

### Legal
- [hiQ v. LinkedIn (Wikipedia)](https://en.wikipedia.org/wiki/HiQ_Labs_v._LinkedIn)
- [EFF on hiQ v. LinkedIn](https://www.eff.org/deeplinks/2019/09/victory-ruling-hiq-v-linkedin-protects-scraping-public-data)

### Industry Analogues
- [Home Assistant ZHA](https://www.home-assistant.io/integrations/zha/)
- [Azure Device Update for IoT](https://learn.microsoft.com/en-us/azure/iot-hub-device-update/)
- [Mender.io](https://mender.io/)
