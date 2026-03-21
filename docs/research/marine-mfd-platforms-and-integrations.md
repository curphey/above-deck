# Marine MFD Platforms and Integrations Research

**Date:** 2026-03-20
**Purpose:** Understand how the major marine electronics platforms handle third-party app integration, digital switching, and mobile companion apps — and identify patterns and gaps relevant to Above Deck.

---

## Table of Contents

1. [Garmin OneHelm and Ecosystem](#garmin-onehelm-and-ecosystem)
2. [Raymarine LightHouse and YachtSense](#raymarine-lighthouse-and-yachtsense)
3. [Navico (Simrad / B&G / Lowrance)](#navico-simrad--bg--lowrance)
4. [Furuno TZtouch](#furuno-tztouch)
5. [Digital Switching Landscape](#digital-switching-landscape)
6. [Mobile Companion Apps](#mobile-companion-apps)
7. [Cross-Platform Comparison](#cross-platform-comparison)
8. [Implications for Above Deck](#implications-for-above-deck)

---

## Garmin OneHelm and Ecosystem

### What It Is

OneHelm is Garmin's integrated helm solution that allows boaters to monitor and control third-party onboard systems from a single Garmin MFD. Launched in 2018, it has grown into the most extensive first-party integration platform in the marine electronics space.

### Architecture

- **HTML5 app model.** OneHelm uses a specialized web server running on the third-party device and a browser embedded in the Garmin MFD. The third-party manufacturer hosts an HTML5 interface that renders directly on the Garmin display.
- **Transparent to the user.** The boater sees what appears to be a native screen; they are unaware of the underlying web server/browser mechanism.
- **Low burden on partners.** Because it is HTML5, third-party manufacturers do not need to build native Garmin software. They build a web interface, Garmin's MFD renders it. Seakeeper, for example, built web server capability directly into their standard control head — no extra hardware module required.
- **Connection layer.** Third-party devices connect to the Garmin MFD via the Garmin Marine Network (Ethernet). Some devices (e.g., Lumishore's Lumi-Link module) use CAN bus internally and bridge to Ethernet for the MFD connection.

### Protocols

| Protocol | Usage |
|---|---|
| Garmin Marine Network (Ethernet) | Primary data path between OneHelm devices and MFD |
| NMEA 2000 (CAN bus) | Sensor data, some switching control, network backbone |
| HTML5 / HTTP | App rendering on the MFD screen |
| Proprietary PGNs | Some partners use proprietary NMEA 2000 parameter groups |

### Compatible MFDs

- GPSMAP 7x3 / 9x3 / 12x3 series
- GPSMAP 8400 / 8600 series
- GPSMAP 8700 Black Box

The HTML5 browser capability is the limiting factor — only higher-end MFDs have sufficient processing power.

### OneHelm Partner Brands

| Partner | Category |
|---|---|
| CZone (BEP Marine / Mastervolt) | Digital switching |
| EmpirBus | Digital switching |
| Böning Automation | Monitoring and control |
| OctoPlex (Carling Technologies) | AC/DC load control, digital switching |
| VeeConnect (Veethree Group) | Digital switching |
| Lumishore | Underwater LED lighting |
| Shadow-Caster | LED lighting (above/below water) |
| Ocean LED | Underwater lighting |
| Seakeeper | Gyroscopic stabilization |
| Smartgyro | Gyroscopic stabilization |
| Yacht Controller | Wireless yacht control |
| Schenker | Watermakers |
| Digital Yacht (NET Protect) | NMEA 2000 network cybersecurity monitoring |
| Fusion (Garmin-owned) | Marine audio/entertainment |
| JL Audio (Garmin-owned) | Marine audio/entertainment |

### Garmin Marine Apps (MFD-native)

Beyond OneHelm partner integrations, Garmin MFDs include built-in app-like features:

- **ActiveCaptain integration** — community data (marinas, hazards, anchorages) synced to chartplotter
- **Quickdraw Contours** — crowd-sourced HD bathymetry maps
- **Fusion/JL Audio control** — full audio system management from MFD
- **Weather/Radar overlays** — SiriusXM weather, GMR Fantom radar integration
- **Autopilot control** — Garmin Reactor autopilot integration
- **OnDeck system** — remote switch monitoring and control via ActiveCaptain app

### App Ecosystem: Closed

Garmin does **not** offer a public SDK or app store. All OneHelm integrations are partnership-based — a manufacturer must work directly with Garmin to become a OneHelm partner. There is no mechanism for independent developers to build or distribute apps for Garmin MFDs.

---

## Raymarine LightHouse and YachtSense

### Architecture

Raymarine takes a three-pronged approach to third-party integration:

1. **Native SDK integrations** — Tightest integration, most work for both parties. Raymarine developers build custom MFD screens for partner hardware.
2. **HTML5 integrations** — Similar to Garmin OneHelm. Third party hosts a web server, MFD renders the HTML5 interface. Grouped under "LightHouse Apps."
3. **Android APK apps** — Unique to Raymarine. Because Axiom MFDs run Android internally, third-party Android apps can be signed by Raymarine and installed directly on the display.

### LightHouse Apps

- Available on Axiom, Axiom Pro, Axiom XL, and Axiom 2 MFDs running LightHouse 3 or LightHouse 4.
- **Not** available on older eS/gS series displays even if upgraded to LH3.
- Apps must be digitally signed by Raymarine before they can be installed. APKs from Google Play or other sources will not work.
- Raymarine does not provide support for third-party apps — users are directed to the app developer.

### App Categories on Raymarine

| Category | Examples |
|---|---|
| Lighting | Lumishore, Ocean LED |
| Propulsion | Engine monitoring |
| Audio & Entertainment | Fusion, Netflix, Spotify (demonstrated but require Raymarine signing) |
| Stabilization | Seakeeper, Smartgyro |
| Weather | Weather routing services |
| Safety | AIS, MOB systems |
| Control | System automation |
| Digital Switching | CZone, EmpirBus, Böning |
| Renewable Energy | Solar/wind monitoring |
| Power | Battery management |
| Sonar | Forward-looking sonar |
| Mobile Apps | Raymarine App companion |
| AI Assistant | Hefring Marine IMAS (2026) — AI-powered digital assistant on LightHouse OS |

### YachtSense Ecosystem

Raymarine's YachtSense is a tiered vessel automation platform:

**Level 1 — Mobile Command:**
- Raymarine App connects to Axiom MFDs via WiFi
- View and control radar, sonar, chartplotter from phone/tablet
- Backup/restore waypoints, routes, tracks

**Level 2 — On/Off Boat Connectivity (YachtSense Link):**
- Marinized network router with 4G/LTE broadband and dual SIM
- Built-in GPS sensor
- Combines dockside WiFi, onboard WiFi, Raynet Ethernet, and 4G
- Remote NMEA 2000 device access
- Geofencing with alerts
- Requires Raymarine Premium subscription ($19.99/month, $200/year)

**Level 3 — Smart Home Automation (YachtSense Digital Control):**
- Full digital switching and control system
- Scalable with three redundancy levels
- Designed for OEM boat builders and professional installers
- Raymarine's own digital switching solution (competes with CZone/EmpirBus)

### Digital Switching Partners

| Partner | Notes |
|---|---|
| CZone | Full graphical control from LightHouse OS |
| EmpirBus (EmpirBus NXT) | Primary digital switching partner historically; elaborate MFD switching screens |
| Böning Automation | Monitoring and control |
| YachtSense (Raymarine) | Raymarine's own digital switching/control system |

### App Ecosystem: Semi-Open

Raymarine is the most open of the major platforms. Third parties can develop Android APK apps, but they must be approved and digitally signed by Raymarine. There is no public SDK or self-service developer portal — partners work directly with Raymarine. However, the Android foundation means the barrier to entry is lower than on fully proprietary platforms.

---

## Navico (Simrad / B&G / Lowrance)

### Architecture

Navico Group (now part of Brunswick) operates three marine electronics brands that share underlying platform technology:

- **Simrad** — sportfishing and powerboat focus
- **B&G** — sailing focus
- **Lowrance** — fishing focus

All three share the same core MFD operating system and integration architecture.

### Integration Approach

- **Naviop integration** — Navico acquired Naviop (Italian marine automation company), which supports 50+ communication protocols for engines, HVAC, generators, battery chargers, entertainment, and digital switching. Naviop acts as a middleware layer between diverse onboard systems and the MFD.
- **CZone integration** — CZone is owned by Mastervolt (part of the Navico/Brunswick family). Simrad pioneered CZone digital switching on an MFD in 2010.
- **OP Box** — Smart interface module connecting onboard systems to Simrad/B&G/Lowrance MFDs. Centralizes monitoring and control of lighting, climate, wipers, stereo, security, bilge pumps, generators.
- **GoFree WiFi** — Wireless module enabling tablet/smartphone viewing and control of MFD data, including ForwardScan sonar images.

### Protocols

| Protocol | Usage |
|---|---|
| NMEA 2000 | Primary network backbone |
| Ethernet | MFD networking, radar, sonar |
| WiFi (GoFree) | Mobile device connectivity |
| Naviop (50+ protocols) | Multi-protocol gateway/middleware |
| CAN bus | Digital switching backbone |

### Compatible MFDs

- Simrad NSS evo3, NSO evo3S
- B&G Zeus, Vulcan
- Lowrance HDS series
- Simrad GO series (limited integration)

### Digital Switching

CZone is the primary digital switching platform across all Navico brands. The relationship is essentially captive — CZone, Mastervolt, and Navico are all under Brunswick Corporation.

### Mobile Apps

- **Simrad Companion** — Trip planning, weather, waypoint management, chart viewing
- **B&G / Lowrance Link** — Wireless connection to MFD, waypoint backup/restore, settings management
- **GoFree Shop** — Navico's online marketplace for charts, software updates

### App Ecosystem: Closed

Navico does not offer a public app store or SDK for third-party MFD app development. Integration is partnership-based through Naviop middleware or direct engineering collaboration. The platform is essentially closed to independent developers.

---

## Furuno TZtouch

### Architecture

Furuno takes a more traditional approach. Their MFDs run a consistent proprietary OS across the range, with integration handled through standard protocols and select partnerships.

### Product Lines (2026)

| Model | Type | Price Range | Key Differentiator |
|---|---|---|---|
| TZtouch3 | Flagship MFD | $3,000-8,000+ | Full networking, all integrations |
| TZtouchE (new, 2026) | Mid-range MFD | $2,195-3,095 | All-touch, network-capable, CZone support |
| TZMap (new, 2026) | Entry MFD | $1,595-2,395 | Standalone, limited networking |

### Integration Approach

- **HTML5 apps** — Furuno adopted the HTML5 integration model (similar to Garmin/Raymarine). Stabilization products, Airmar Seeker, and Ocean LED lighting use HTML5 interfaces on Furuno MFDs.
- **NavNet Command Center Apps** — Furuno's branded name for partner integrations. Compatible with select apps on TZtouchE and TZtouch3.
- **Configuration-based updates** — New third-party apps can be added via configuration file from the service menu without requiring a firmware update. This is a notable architectural advantage.
- **iBoat app** — Furuno's companion mobile app for route/waypoint sharing and cloud data sync.

### Digital Switching

- CZone digital switching support added in TZtouch2 (software v4.01) and carried forward to TZtouchE and TZtouch3.
- No proprietary digital switching system — Furuno relies entirely on third-party CZone.

### Third-Party Partners

- Lumishore (lighting)
- Skymate (satellite communications)
- Maretron (vessel monitoring)
- Seakeeper (stabilization)
- CZone (digital switching)
- Ocean LED (lighting, HTML5)
- Airmar Seeker (weather station)

### Protocols

| Protocol | Usage |
|---|---|
| NMEA 2000 | Primary sensor/data network |
| Ethernet | MFD networking, radar |
| WiFi | Mobile app connectivity |
| HTML5 / HTTP | Third-party app rendering |

### App Ecosystem: Closed

No public SDK or app store. All integrations are partnership-based. However, the configuration-file approach to adding new partners is more flexible than firmware-dependent models.

---

## Digital Switching Landscape

### What Digital Switching Is

Digital switching replaces traditional circuit breaker panels and heavy wiring runs with networked modules distributed throughout the vessel. Instead of running individual wires from each switch to each load, a CAN bus network cable connects intelligent modules that switch power locally. Benefits include reduced weight, fewer wiring runs, programmable macros, remote monitoring, and load shedding.

### Protocol Foundation

All major digital switching systems use **NMEA 2000** (which is electrically compatible with CAN bus) as the network backbone. Data is organized into Parameter Group Numbers (PGNs). CZone uses both standard and proprietary PGNs for its switching operations.

**Technical specs:** NMEA 2000 runs at 250 kbit/s on a CAN bus physical layer, based on SAE J1939 with marine-specific message definitions (IEC 61162-3).

### Major Systems Comparison

| System | Owner | MFD Compatibility | Key Strength |
|---|---|---|---|
| **CZone** | Mastervolt / Brunswick | Garmin, Simrad, B&G, Lowrance, Raymarine, Furuno | Widest MFD compatibility; industry standard |
| **EmpirBus NXT** | EmpirBus (Trigentic AB, acquired by Garmin) | Raymarine (primary), Garmin | Deep Raymarine integration; elaborate graphical screens; web-based UI builder |
| **Naviop** | Navico / Brunswick | Simrad, B&G, Lowrance | 50+ protocol gateway; middleware approach |
| **OctoPlex** | Carling Technologies | Garmin (OneHelm) | AC/DC load control; redundant architecture |
| **VeeConnect** | Veethree Group | Garmin (OneHelm) | Digital switching focused |
| **Böning** | Böning Automation | Raymarine, Garmin | Monitoring and control; superyacht segment |
| **YachtSense** | Raymarine | Raymarine only | Raymarine's own end-to-end solution |

### EmpirBus Graphics Editor — Deep Dive

The EmpirBus Graphics Editor is a **web-based UI builder** (accessed at `graphics.empirbus.com`) that lets installers and boat builders design custom digital switching screens. These screens are deployed to the EmpirBus WDU (Web Display Unit), which serves them as HTML5 to any compatible device.

**Architecture:**
- Web-based editor → generates HTML5 graphics package → uploaded to WDU
- WDU is a web server that serves the custom UI to MFDs, tablets, or any HTML5 browser
- WDU connects to EmpirBus NXT DCM modules via NMEA 2000 CAN bus
- Each DCM provides 16 configurable bi-directional I/O channels (switching, dimming, sensing)

**Editor Capabilities:**
- Drag-and-drop canvas for placing interactive elements
- Supports PNG, JPG, SVG images (PNG preferred for transparency)
- **Widget types:** Pulse buttons, momentary switches, rotary switches, dimmer controls, signal value displays
- **Button states:** 7 states per button (Off, On, Pressed, Error 1, Error 2, Error 1&2, Service unavailable) — each with a custom image
- **Live data binding:** Widgets bind to NMEA 2000 PGNs for real-time display of battery status, tank levels, circuit state
- **Analog gauges:** Battery voltage, fluid levels, temperature — all from NMEA 2000 data
- Component reuse: save custom components to cloud storage, reuse across projects
- Keep Aspect Ratio option for consistent widget sizing

**Deployment:**
- Export graphics package as .zip
- Upload to WDU via WDU Supervisor (web interface) or Garmin Marine Network
- No firmware update needed — just upload new graphics package
- WDU serves the HTML5 interface to any connected display

**Vessel Modes:**
The system supports programmable modes (Dock Away, Under Way, Anchor Aboard, etc.) that automatically set lighting, pump, and power configurations. Complex logic programming supports toilet flushing sequences, wiper control with variable delays, pump timers, and thermostat functions.

**Above Deck Relevance:**

This is a compelling pattern for Above Deck's boat management platform. The key insight is that EmpirBus solved the "custom boat dashboard" problem with:
1. A web-based visual editor that non-developers can use
2. HTML5 output that runs on any screen
3. Live data binding to NMEA 2000

Above Deck could build a similar **dashboard builder** — a drag-and-drop tool where sailors design their own MFD screens, binding widgets to data from the Above Deck data model (which aggregates NMEA, Victron, Matter, and sensor data). The difference: Above Deck's builder would be open source, work with any data source (not just EmpirBus hardware), and produce screens that run on any browser — not locked to specific MFD hardware.

**References:**
- [EmpirBus Graphics Editor — Quickstart Guide](https://manuals.plus/m/b284e88d91c7a77f03e13de58bd572a6ed09f8482c2ae3b53570ddc3aa9d993b.pdf)
- [EmpirBus Graphical Tool User Manual](https://manualzilla.com/doc/6864850/empirbus-graphical-tool-user-manual)
- [EmpirBus Studio Demo](https://updates.empirbus.com/clickonce/EmpirBusStudio-Demo/)
- [Raymarine Forum: EmpirBus Custom Screens](https://forum.raymarine.com/showthread.php?tid=7323&pid=27359)

### CZone UI Integration

CZone takes a different approach — rather than a standalone UI builder, CZone integrates directly into each MFD manufacturer's interface:

- **Raymarine:** CZone control pages are designed using Raymarine's CZone graphics tool and render natively within LightHouse OS
- **Garmin:** Users can modify CZone pages on-screen, though underlying configuration remains at OEM level
- **Simrad/B&G/Lowrance:** CZone pages appear as native MFD screens

CZone uses Qt for its core rendering engine, achieving industrial-quality interfaces. The collaboration with each MFD brand means CZone pages look native on each platform — but this also means the UI must be designed separately for each MFD ecosystem.

**Key Difference from EmpirBus:** CZone's UI is per-platform (different for each MFD brand). EmpirBus's UI is HTML5 (runs on any browser). Above Deck aligns with the EmpirBus/HTML5 approach.

### Key Observations

- **CZone is the closest thing to a universal standard.** It works with every major MFD brand.
- **Vertical integration is the trend.** Brunswick owns both Navico (Simrad/B&G/Lowrance) and Mastervolt/CZone. Raymarine is building its own YachtSense system. Garmin acquired Fusion and JL Audio.
- **Reliability concerns exist.** Historical issues with digital switching include switches activating wrong loads and total system failures. Redundancy and fail-safe design are critical.
- **OEM vs. aftermarket split.** Most digital switching is installed by boat builders at the factory. Aftermarket retrofit is possible but complex.

---

## Mobile Companion Apps

### Comparison

| Feature | Garmin ActiveCaptain | Raymarine App | Simrad/B&G/Lowrance Link | Furuno iBoat |
|---|---|---|---|---|
| **Platform** | iOS, Android | iOS, Android | iOS, Android | iOS, Android |
| **WiFi MFD control** | Yes (Helm feature) | Yes (view/control radar, sonar, charts) | Yes (view/control) | Route/waypoint sharing |
| **Community/social** | 166,000+ POI reviews, photos, marina reviews | No | No | No |
| **Crowd-sourced charts** | Quickdraw Contours HD | No | No | No |
| **Remote monitoring** | Via OnDeck system | Via YachtSense Link (4G) | Limited | Cloud data sync |
| **Geofencing** | Via OnDeck | Yes ($19.99/month premium) | No | No |
| **Data backup/sync** | Waypoints, routes, settings auto-sync | Waypoints via app | Waypoints, routes, tracks, settings | Routes, waypoints |
| **Software updates** | OTA via app to chartplotter | Via app | Via app | Via app |
| **Switch control** | OnDeck switches from anywhere | YachtSense digital control | No remote switching | No |
| **Subscription** | Free (OnDeck hardware separate) | Free app; Premium $19.99/mo | Free | Free |

### Key Observations

- **Garmin ActiveCaptain is the clear leader** in mobile companion apps. The community features (166K+ reviews, Quickdraw crowd-sourced charts) create strong network effects and lock-in. No competitor has anything comparable.
- **Raymarine YachtSense Link** is the most ambitious remote monitoring play, offering true off-boat 4G connectivity — but at a recurring subscription cost.
- **Navico's mobile story is fragmented** across three brands with slightly different apps.
- **Furuno's mobile presence is minimal** — focused on basic data sync.

---

## Cross-Platform Comparison

### Architecture Summary

| Platform | App Model | OS Foundation | Third-Party Dev | App Distribution |
|---|---|---|---|---|
| **Garmin** | HTML5 (OneHelm) | Proprietary | Partnership only | Pre-installed by partner |
| **Raymarine** | HTML5 + Android APK + Native SDK | Android (LightHouse) | Partnership + APK signing | Raymarine website download |
| **Navico** | Naviop middleware + CZone | Proprietary | Partnership only | Pre-installed |
| **Furuno** | HTML5 + config-file updates | Proprietary | Partnership only | Service menu config file |

### Openness Ranking

1. **Raymarine** — Most open. Android APK support means any Android developer can build an app (though Raymarine must sign it). Three integration paths (SDK, HTML5, APK).
2. **Garmin** — Semi-open. HTML5 model is relatively easy for hardware partners. But no path for pure software apps.
3. **Furuno** — Semi-closed. HTML5 support and config-file updates add flexibility, but still partnership-only.
4. **Navico** — Most closed. Naviop middleware is powerful but entirely controlled by Navico/Brunswick.

### Protocol Support

| Protocol | Garmin | Raymarine | Navico | Furuno |
|---|---|---|---|---|
| NMEA 2000 | Yes | Yes | Yes | Yes |
| NMEA 0183 | Yes | Yes | Yes | Yes |
| Ethernet | Garmin Marine Network | Raynet | Navico Ethernet | Furuno Ethernet |
| WiFi | Yes (MFD + ActiveCaptain) | Yes (MFD + YachtSense) | Yes (GoFree) | Yes |
| 4G/LTE | No (via OnDeck) | YachtSense Link | No | No |
| HTML5 apps | OneHelm | LightHouse Apps | No | NavNet Command Center |
| Android APK | No | Yes | No | No |
| CAN bus | Via NMEA 2000 | Via NMEA 2000 | Via NMEA 2000 | Via NMEA 2000 |

---

## Implications for Above Deck

### Patterns to Adopt

1. **HTML5 is the universal integration layer.** Garmin, Raymarine, and Furuno all use HTML5 for third-party app rendering on MFDs. Above Deck's web-based tools (built with Astro/React) are already architecturally aligned with this pattern. A tool running in an MFD's embedded browser is the same architecture as a tool running in a tablet browser.

2. **NMEA 2000 is the non-negotiable backbone.** Every platform uses it. Above Deck's Go API server should speak NMEA 2000 (via SignalK or direct CAN bus) to be a credible part of the marine electronics ecosystem.

3. **Community data is a moat.** Garmin's ActiveCaptain community (166K+ reviews, crowd-sourced charts) is the strongest lock-in mechanism in the space. No competitor has replicated it. A community-driven knowledge base is strategically valuable.

4. **Digital switching is converging on CZone.** CZone works with every major MFD brand. If Above Deck ever interfaces with digital switching, CZone/NMEA 2000 compatibility is the priority.

5. **Mobile companion apps are expected.** Every platform has one. The MFD is the primary interface, but phone/tablet is the secondary interface for planning, monitoring, and remote access.

### Gaps to Fill

1. **No open platform exists.** Every MFD manufacturer controls their app ecosystem through partnerships or signing requirements. There is no "app store" where independent developers can freely publish marine tools. Above Deck's open-source, web-based approach could fill this gap — tools that run on any device with a browser, including MFDs with HTML5 support.

2. **No cross-platform tool ecosystem.** A Garmin OneHelm partner's app only works on Garmin MFDs. A Raymarine APK only works on Raymarine. Above Deck tools (VHF sim, solar planner, etc.) work on any browser — phone, tablet, MFD, regardless of manufacturer.

3. **Remote monitoring is expensive and proprietary.** Raymarine charges $200/year for YachtSense Premium. Garmin requires OnDeck hardware. An open-source monitoring solution using commodity hardware (Raspberry Pi + Go server + SignalK) could undercut these at a fraction of the cost.

4. **AI integration is nascent.** Hefring Marine's IMAS on Raymarine (2026) is the first AI assistant on an MFD. Above Deck's MCP (Model Context Protocol) approach for AI integration is ahead of the curve.

5. **Crowd-sourced data beyond Garmin is nonexistent.** Raymarine, Simrad, and Furuno have no community data layer. A platform-agnostic community knowledge base (equipment reviews, maintenance logs, cruising guides) is an open opportunity.

6. **Solar/energy management is underserved.** "Renewable Energy" is a category on Raymarine's app page, but actual solar planning and energy management tools are virtually absent from all platforms. This is a clear whitespace for Above Deck's solar planner.

### Strategic Positioning

Above Deck should position as **the platform-agnostic layer** that sits alongside (not against) the MFD manufacturers:

- Tools run in any browser, including MFD HTML5 browsers
- Go server speaks NMEA 2000 / SignalK for data integration
- Community knowledge base is not locked to any hardware brand
- Open source means boat builders and installers can customize freely
- No subscription fees for core functionality

The MFD manufacturers are building walled gardens. Above Deck can be the open commons.

---

## Sources

- [Panbo: Garmin OneHelm HTML5](https://panbo.com/garmin-onehelm-html5-1-lumishore-seakeeper-and-shadow-caster/)
- [Panbo: Digital Switching across platforms](https://panbo.com/digital-switching-raymarine-empirbus-simrad-naviops-offshore-octoplex-garmin-and-czone/)
- [Panbo: Furuno TZtouchE and TZMap 2026](https://panbo.com/dbmibs-2026-furuno-tztouche-and-tzmap-mfds/)
- [Panbo: Raymarine MFD apps three ways](https://panbo.com/raymarine-mfd-apps-three-ways-from-drone-control-to-sat-comms-to-video-streaming/)
- [Raymarine: LightHouse Apps](https://www.raymarine.com/en-us/our-products/digital-boating/lighthouse-apps)
- [Raymarine: Digital Switching Partners](https://www.raymarine.com/en-us/our-products/digital-boating/digital-switching-partners)
- [Raymarine: YachtSense Ecosystem](https://www.raymarine.com/en-us/our-products/digital-boating/yachtsense-ecosystem)
- [Raymarine: LightHouse third-party apps docs](https://docs.raymarine.com/81406/en-US/latest/LightHouseApps-62C7CC8F.html)
- [Garmin: OneHelm launch press release](https://www.businesswire.com/news/home/20180214005028/en/Garmin-launches-OneHelm)
- [Garmin: OneHelm partner expansion](https://www.businesswire.com/news/home/20191001005276/en/Garmin-adds-marine-companies-OneHelm-roster)
- [Garmin: ActiveCaptain Community blog](https://www.garmin.com/en-US/blog/marine/activecaptain-community-a-boaters-best-friends/)
- [CZone: Digital Marine Switches](https://czone.navico.com/marine/)
- [Navico: Marine Digital Systems](https://www.navico.com/marine/digital-systems)
- [Digital Yacht: OneHelm + NET Protect](https://digitalyacht.net/2025/11/13/digital-yacht-add-garmin-onehelm-connectivity-to-net-protect/)
- [Carling Technologies: OctoPlex + Garmin OneHelm](https://www.carlingtech.com/node/1225)
- [Smartgyro: Garmin OneHelm integration](https://blog.smartgyro.com/news/smartgyro-garmin-onehelm)
- [Hefring Marine IMAS on Raymarine](https://www.marinebusinessnews.com.au/2026/02/hefring-marines-imas-now-available-on-raymarines-lighthouse-os/)
- [Victron: Marine MFD integration by app](https://www.victronenergy.com/media/pg/Venus_GX/en/marine-mfd-integration-by-app.html)
- [NMEA 2000 Wikipedia](https://en.wikipedia.org/wiki/NMEA_2000)
- [Mastervolt: CZone FAQ](https://www.mastervolt.com/frequently-asked-questions-about-czone/)
