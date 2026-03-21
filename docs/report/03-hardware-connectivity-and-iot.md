# Part 3: Hardware, Connectivity, and IoT

**Above Deck Research Report — March 2026**

---

## 1. Executive Summary

The marine hardware landscape is a patchwork of decades-old serial protocols (NMEA 0183), modern CAN bus networks (NMEA 2000), proprietary vendor ecosystems, and an emerging open-source layer centred on SignalK and Raspberry Pi. Above Deck's opportunity sits at the intersection of all of these: a Go-based server running on a Raspberry Pi with direct NMEA access, consumer IoT sensors via the Matter protocol, long-range shore monitoring through LoRa/Meshtastic, and a PWA interface that renders on any browser — from a $400 iPad to a $4,000 Garmin MFD. The hardware problem is largely solved by the open-source community; what is missing is the software layer that unifies it all with modern UX, AI integration, and zero vendor lock-in.

---

## 2. Marine Protocol Landscape

### The Four Protocols Every Boat Speaks

Marine electronics communicate through a layered stack of protocols, each serving a different era and purpose. Understanding how they relate is essential to Above Deck's integration strategy.

**NMEA 0183** is the oldest and most ubiquitous. Introduced in 1983, it uses RS-422 serial at 4800 baud (or 38400 for high-speed AIS). It is point-to-point — one talker, one or more listeners per wire. Every GPS, VHF radio, AIS transponder, and depth sounder built in the last 40 years speaks NMEA 0183. It remains the only output on many instruments still in service. The majority of cruising boats have NMEA 0183 devices aboard, and any integration strategy must handle it.

**NMEA 2000** is the modern standard, adopted on all new marine equipment since roughly 2012. Built on CAN bus (SAE J1939, IEC 61162-3) at 250 kbit/s, it provides a true multi-device network — plug-and-play, self-addressing, with data organised into Parameter Group Numbers (PGNs). Wind, depth, speed, heading, GPS, engine data, and tank levels all travel on a single backbone cable with drop connections. NMEA 2000 is the non-negotiable backbone that every MFD manufacturer uses.

**SeaTalk** is Raymarine's legacy proprietary protocol, found on older Autohelm and early Raymarine equipment. SeaTalk NG (the current variant) is electrically compatible with NMEA 2000 and uses the same CAN bus — it is effectively NMEA 2000 with a different connector. Legacy SeaTalk (SeaTalk1) is a single-wire protocol that requires a dedicated bridge or gateway to reach modern systems. The MacArthur HAT for Raspberry Pi includes SeaTalk1 support specifically for this legacy base.

**SignalK** is the open-source bridge layer that normalises all of the above into a single JSON-based data model accessible over HTTP and WebSocket. It runs on a Raspberry Pi (or any Linux/Node.js host), ingests NMEA 0183, NMEA 2000, SeaTalk, Victron data, and dozens of other sources, and presents them through a unified REST/WebSocket API. Nearly every open-source marine project speaks SignalK — it is the lingua franca of the DIY marine community.

### Protocol Adoption on Real Boats

| Protocol | Status | Typical Boats |
|----------|--------|---------------|
| NMEA 0183 | Extremely common | Any boat with gear older than ~2010. Still the only output on many GPS units, VHF radios, and AIS units |
| NMEA 2000 | Standard on all new equipment | Boats built or refit since ~2012. CAN bus backbone, plug-and-play |
| Mixed 0183 + N2K | Most common real-world scenario | Majority of cruising boats. Requires gateway/bridge devices |
| SignalK | Growing among tech-savvy sailors | Bridges 0183, N2K, and WiFi. Raspberry Pi-based |
| SeaTalk (legacy) | Declining | Older Raymarine-only boats. SeaTalk NG is N2K compatible |
| OneNet (Ethernet) | Emerging, not yet widely deployed | NMEA's next-gen IP-based standard. Few products shipping |

The key insight: the majority of cruising boats have a mix of NMEA 0183 and NMEA 2000 devices. Above Deck's Go server must handle both protocols, either directly (via CAN bus and serial) or through SignalK as an intermediary.

### How the Protocols Relate

```
┌────────────────────────────────────────────────────────────────┐
│                    Above Deck Data Model                       │
│         (Unified JSON — navigation, electrical, environment)   │
└──────────┬──────────────┬──────────────┬──────────────┬───────┘
           │              │              │              │
    ┌──────┴──────┐ ┌─────┴─────┐ ┌─────┴─────┐ ┌─────┴─────┐
    │  SignalK    │ │  NMEA     │ │  Victron  │ │  Matter   │
    │  Adapter   │ │  Direct   │ │  Adapter  │ │Controller │
    └──────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
           │             │             │              │
    ┌──────┴──────┐ ┌────┴─────┐ ┌────┴─────┐ ┌─────┴─────┐
    │  NMEA 0183 │ │ NMEA 2000│ │ VE.Direct│ │  Thread   │
    │  NMEA 2000 │ │ (CAN bus)│ │ MQTT     │ │  WiFi     │
    │  SeaTalk   │ │          │ │ Modbus   │ │  Sensors  │
    │  + others  │ │          │ │          │ │           │
    └────────────┘ └──────────┘ └──────────┘ └───────────┘
```

---

## 3. Hardware Platform Options

### Raspberry Pi — The Reference Platform

The Raspberry Pi is the de facto standard for open-source marine computers. Above Deck's Go server runs on a Pi with direct NMEA 0183/2000 access via marine-specific HATs (Hardware Attached on Top), eliminating the need for middleware.

| Product | Price | Features | Notes |
|---------|-------|----------|-------|
| **PICAN-M HAT** | ~$99 | NMEA 0183 (RS-422) + NMEA 2000 (CAN bus via MCP2515) + Qwiic I2C + 3A PSU from 12V | The standard. Powers Pi directly from boat 12V |
| **MacArthur HAT** (OpenMarine) | ~$80 | NMEA 0183 + NMEA 2000 + SeaTalk1 + SignalK | Multi-protocol. Sold by Wegmatt |
| **HALPI2** | ~$300+ | Raspberry Pi CM5 in waterproof aluminium enclosure. HDMI, NMEA 2000, NMEA 0183, Ethernet, 2x USB 3.0, external WiFi/BT antenna | Ruggedised, production-ready. Reviewed by Hackaday (Sept 2025) |

The Pi provides WiFi for the local network, USB for Victron VE.Direct connections, and GPIO/I2C for additional sensors. With a PICAN-M HAT, SocketCAN (the Linux kernel CAN interface) gives direct NMEA 2000 access — no middleware needed.

**Recommended reference hardware:** Raspberry Pi 5 + PICAN-M HAT in a waterproof enclosure. The HALPI2 is the premium turnkey option.

### ESP32 — The Swiss Army Knife

ESP32 boards serve as the bridge between marine protocols and WiFi/IP networks. At $5-15 per board, with built-in CAN bus (for NMEA 2000), WiFi, BLE, and Thread (ESP32-C6/H2), they fill multiple roles in the architecture.

| Project | What It Does | Notes |
|---------|-------------|-------|
| **esp32-nmea2000** (wellenvogel) | NMEA 2000 to WiFi gateway. Reads CAN bus, serves NMEA 0183 over TCP | Active, well-documented. Runs on M5 Atom CAN (~$15) |
| **NMEA2000WifiGateway** (AK-Homberger) | NMEA 2000 WiFi gateway with voltage/temp alarms | Popular reference implementation |
| **SensESP** (HatLabs) | ESP32 sensor framework for SignalK. Turns any sensor into a SignalK data source over WiFi | Very active. Supports temp, pressure, flow, tank level sensors |
| **Smart2000 ESP** | Wireless NMEA 2000 bridge — keeps CAN bus physically separate from the Pi | Solves the wiring problem on larger boats |

The ESP32 serves Above Deck in four capacities:

1. **NMEA 2000 WiFi gateway** — sits on the CAN bus, streams data to the Go server over WiFi. No need for the Pi to be physically near the instruments.
2. **DIY sensor nodes** — temperature, tank level, bilge float. Currently planned via MQTT; could migrate to Matter (ESP32-C6 supports Thread/Matter).
3. **Thread border router** — ESP32-C6/H2 bridges the Thread mesh to WiFi for Matter sensors.
4. **Wireless NMEA bridge** — for boats where running a cable from instruments to the Pi is impractical.

The ESP32-C6 is particularly significant: it does WiFi, BLE, Thread, and Matter all in one chip (~$5). A single ESP32-C6 on the boat could serve as both NMEA WiFi gateway (with CAN transceiver) and Thread border router.

### Industrial PCs and Ruggedised Options

For production deployments beyond the Pi, the ecosystem includes:

- **HALPI2** — CM5-based ruggedised Pi in waterproof aluminium. HDMI out, all marine connectors, external antenna. The turnkey option.
- **Industrial SBCs** — Boards like the Advantech UNO series or Axiomtek embedded PCs run Linux with CAN bus support. Overkill for most boats, relevant for commercial/charter deployments.
- **NUC-class PCs** — Intel NUC or similar small-form-factor PCs. More processing power than a Pi, but no marine HATs available — would need USB-CAN adapters.

For Above Deck's target audience (cruising sailors doing DIY integration), the Raspberry Pi remains the clear recommendation. The software is the same regardless of hardware — Docker containers run identically on a Pi, a NUC, or a cloud server.

---

## 4. Matter Protocol and IoT

### What Matter Is

Matter is an open-source, IP-based IoT interoperability standard backed by Apple, Google, and Amazon. It covers the "smart home" layer of boat systems — lighting, climate, environmental sensors, energy management, security — that marine protocols (NMEA 0183/2000) do not reach.

Devices communicate locally over IPv6, with no cloud required. Two transport layers are supported:

- **WiFi/Ethernet** — for powered devices (plugs, controllers, cameras)
- **Thread** — a low-power 802.15.4 mesh network for battery-operated sensors. Thread is self-healing, so sensors spread around the vessel relay for each other

Every Matter device exposes standardised "clusters" — a temperature sensor exposes a Temperature Measurement cluster, a smart plug exposes On/Off + Electrical Measurement. A controller reads these clusters identically regardless of manufacturer.

As of March 2026, there are 750+ Matter-certified products on the market.

### Version History (Marine-Relevant Features)

| Version | Date | Relevant Additions |
|---------|------|-------------------|
| 1.0 | Oct 2022 | Lighting, plugs, switches, sensors (motion, door, temperature), thermostats |
| 1.2 | Oct 2023 | Air quality sensors (CO2, VOC, CO), smoke/CO alarms |
| 1.3 | May 2024 | Water and energy management devices |
| 1.4 | Nov 2024 | **Solar panels, batteries**, home routers, water heaters |
| 1.5 | Nov 2025 | **Cameras**, soil moisture sensors, **Device Energy Management cluster**, advanced power metering |

### What Matter Enables on a Boat

The Above Deck vision originally specified "MQTT + ESP32 DIY sensors" for temperature, bilge, and tanks. Matter replaces that with standardised, off-the-shelf hardware:

| Boat Need | Matter Device Type | Notes |
|-----------|-------------------|-------|
| Cabin/engine room temperature | Temperature Sensor | Off-the-shelf, ~$15-25 |
| Humidity (mould prevention) | Humidity Sensor | Eve Room, Aqara, etc. |
| Hatch open/closed | Contact Sensor | Standard door/window sensors |
| Bilge high-water alarm | Contact Sensor | Wet = closed trigger |
| Cabin/courtesy lighting | Dimmable Light / Smart Plug | Massive device selection |
| Navigation light switching | On/Off Relay | Matter smart switches |
| Fridge/freezer monitoring | Temperature Sensor | Placed inside fridge |
| LPG/gas detection | Air Quality Sensor (v1.2+) | CO/gas detectors |
| Motion detection (security at dock) | Occupancy Sensor | Standard motion sensors |
| Solar production | Solar device type (v1.4+) | Emerging support |
| Battery state | Battery device type (v1.4+) | Emerging support |
| Power consumption per circuit | Electrical Measurement cluster | Smart plugs with power metering |

The win: sailors walk into any electronics store, buy a Matter sensor, and it works with Above Deck. No flashing ESP32 firmware, no configuring MQTT topics, no custom protocol bridges.

### Go Implementation Strategy

A pure Go Matter controller is feasible and aligns with project principles (no Node.js, single binary, own the protocol). The existing `gomat` library (github.com/tom-code/gomat) demonstrates feasibility — pure Go, no C/C++ dependencies, 135 commits achieving commissioning, PASE, CASE, certificates, discovery, and read/subscribe.

```
┌──────────────────────────────┐     ┌────────────────────────────────┐
│  Above Deck Go Matter        │     │  connectedhomeip virtual       │
│  Controller (pure Go)        │────▶│  devices (test targets only)   │
│                              │     │                                │
│  Compiles into single binary │     │  e.g. chip-lighting-app        │
│  No C/C++ deps               │     │       chip-all-clusters-app    │
└──────────────────────────────┘     └────────────────────────────────┘
        ▲                                        │
        │          Matter protocol (IP)          │
        └────────────────────────────────────────┘
```

**Protocol layers required:**

| Layer | What It Does | Complexity | Go Feasibility |
|-------|-------------|------------|----------------|
| mDNS/DNS-SD discovery | Find Matter devices on the network | Low | Excellent libraries (`hashicorp/mdns`, `grandcat/zeroconf`) |
| SPAKE2+ (PASE) | Password-based session establishment | Medium | ~500 lines. Standard crypto |
| SIGMA (CASE) | Certificate-based operational sessions | Medium-High | Go `crypto` stdlib handles all primitives |
| TLV encoding | Matter's binary wire format | Low | ~300 lines |
| Message framing | Packet structure, AES-128-CCM encryption | Medium | Go `crypto/cipher` |
| Interaction Model | Read/Write/Subscribe/Invoke commands | Medium | Core controller logic |
| Certificate management | NOC, RCAC, fabric identity | Medium | Go `crypto/x509` handles natively |
| Cluster definitions | Data models per device type | Low (but wide) | Code-gen from spec |

A minimal Matter controller (discover, commission, read, subscribe, command) is approximately 3,000-5,000 lines of Go. What can be skipped initially: Thread radio stack (the ESP32 border router handles it), BLE transport, and full cluster coverage (start with 5-6 boat-relevant clusters).

### Thread Mesh on a Boat

Thread uses IEEE 802.15.4 at 2.4 GHz in a self-healing mesh topology. It is well-suited to boats:

| Factor | Impact | Notes |
|--------|--------|-------|
| **Fibreglass hull** | Good | Low attenuation — ideal for catamarans and most cruising boats |
| **Aluminium/steel hull** | Challenging | Signal blocked by metal compartments. Needs mesh routing through hatches |
| **Mesh self-healing** | Very positive | Powered Thread devices (lights, plugs) act as routers, relaying for battery sensors |
| **Range** | ~10-15m indoor | Sufficient for most boats. A 50ft cat might need 3-4 mesh nodes |
| **Power** | Excellent | Thread end devices sleep aggressively. Temp sensor on coin cell lasts 1-2 years |

A Thread Border Router is required to bridge the Thread mesh to the boat's WiFi network. The ESP32-C6 or ESP32-H2 can serve this role (~$5), either standalone or built into Above Deck's recommended hardware.

---

## 5. SignalK

### What It Is

SignalK is an open-source marine data exchange standard that provides a unified JSON-based data model for vessel information, served over HTTP and WebSocket. It runs as a Node.js server (typically on a Raspberry Pi), ingesting data from NMEA 0183, NMEA 2000, SeaTalk, Victron, and dozens of other sources.

### Data Model

SignalK defines 12 top-level vessel domains:

1. **navigation** — position, heading, speed, course, depth, wind, GNSS, anchor
2. **electrical** — batteries, inverters, chargers, alternators, solar, AC buses
3. **environment** — outside/inside temp, humidity, water temp, depth, wind, current, tide
4. **propulsion** — engines, transmissions, fuel, temperature, oil
5. **tanks** — freshwater, wastewater, fuel, LPG, ballast, baitwell
6. **steering** — rudder angle, autopilot state/mode/target
7. **communication** — radio, telephone, email
8. **design** — displacement, draft, beam, air height, rigging type
9. **sails** — inventory, area (total/active)
10. **sensors** — generic sensor state and data
11. **performance** — VMG, polar speed, tack angle
12. **notifications** — alarms, alerts, thresholds

All values use SI units. The schema is JSON-based with predictable paths (e.g., `vessels.self.navigation.position`, `vessels.self.electrical.batteries.house`).

### Overlap with Above Deck

| Domain | NMEA 0183/2000 | SignalK | Matter | Above Deck Plan |
|--------|---------------|---------|--------|----------------|
| Navigation (GPS, heading, depth) | Yes | Yes | No | NMEA direct |
| Wind/weather instruments | Yes | Yes | No | NMEA direct |
| Engine/propulsion | Yes | Yes | No | NMEA direct |
| Tanks (fuel, water) | Yes | Yes | No | NMEA direct |
| **Electrical (batteries, solar)** | Partial (N2K) | Yes | **Yes (v1.4+)** | Victron + Matter |
| **Lighting** | No | Yes (CZone) | **Yes** | Matter |
| **Climate/HVAC** | No | Limited | **Yes** | Matter |
| **Environmental sensors** | No | Yes | **Yes** | Matter |
| **Security (motion, cameras)** | No | No | **Yes (v1.5)** | Matter |

The key distinction: SignalK is a marine data model + server (Node.js). It defines the schema and provides the runtime. Above Deck owns its own data model and Go server — SignalK is an optional compatibility adapter. Matter is a device interoperability protocol — it defines how devices communicate, not a vessel data model. They do not compete. NMEA owns navigation/propulsion. Matter owns the smart-home layer. The overlap in electrical/environmental is where Above Deck draws from both.

### Adapter Strategy

Above Deck relates to SignalK in two ways:

1. **Inbound adapter** — consume SignalK's REST/WebSocket API as a data source. For sailors who already have a SignalK server, Above Deck reads from it rather than duplicating protocol parsing.
2. **Outbound compatibility** — expose Above Deck's data model in SignalK-compatible format so that existing SignalK clients and plugins can consume it.

SignalK is the natural integration hub for the existing open-source marine ecosystem. The `signalk-meshtastic` plugin, SensESP sensor framework, pypilot autopilot, and OpenPlotter distribution all speak SignalK. Above Deck's SignalK adapter is not optional — it is how you interoperate with this ecosystem.

---

## 6. MFD Platform Integrations

### The Walled Garden Problem

Every major MFD manufacturer controls their app ecosystem through partnerships or signing requirements. There is no "app store" where independent developers can freely publish marine tools. Above Deck's open-source, web-based approach fills this gap.

### Platform Architecture Comparison

| Platform | App Model | OS Foundation | Third-Party Dev | App Distribution |
|---|---|---|---|---|
| **Garmin** | HTML5 (OneHelm) | Proprietary | Partnership only | Pre-installed by partner |
| **Raymarine** | HTML5 + Android APK + Native SDK | Android (LightHouse) | Partnership + APK signing | Raymarine website download |
| **Navico** | Naviop middleware + CZone | Proprietary | Partnership only | Pre-installed |
| **Furuno** | HTML5 + config-file updates | Proprietary | Partnership only | Service menu config file |

### Garmin OneHelm

OneHelm is Garmin's integrated helm solution, launched in 2018. It uses a specialised web server running on the third-party device and a browser embedded in the Garmin MFD. The third-party manufacturer hosts an HTML5 interface that renders directly on the Garmin display. This is transparent to the user — they see what appears to be a native screen.

OneHelm partners include CZone, EmpirBus, Seakeeper, Lumishore, OctoPlex, and 10+ other brands. Connection is via Garmin Marine Network (Ethernet). Garmin does not offer a public SDK or app store — all integrations are partnership-based.

### Raymarine LightHouse

Raymarine is the most open platform, offering three integration paths:

1. **Native SDK integrations** — tightest integration, most development work
2. **HTML5 integrations** — similar to OneHelm, third party hosts a web server
3. **Android APK apps** — unique to Raymarine. Because Axiom MFDs run Android internally, third-party Android apps can be signed by Raymarine and installed directly

Raymarine's YachtSense ecosystem adds remote monitoring via 4G (YachtSense Link, $19.99/month) and digital switching (YachtSense Digital Control). Notably, Hefring Marine's IMAS (2026) is the first AI assistant on an MFD — running on LightHouse OS.

### Navico (Simrad / B&G / Lowrance)

Three brands sharing a core platform, with Naviop middleware handling 50+ communication protocols. CZone is the primary digital switching platform — captive within the Brunswick corporate family (Brunswick owns both Navico and Mastervolt/CZone). The platform is the most closed to independent developers.

### Furuno

Traditional approach with select HTML5 partnerships. Notable architectural advantage: new third-party apps can be added via configuration file from the service menu without requiring a firmware update.

### The Pattern That Matters

HTML5 is the universal integration layer. Garmin, Raymarine, and Furuno all use it for third-party app rendering. Above Deck's web-based tools (Astro/React) are already architecturally aligned — a tool running in an MFD's embedded browser is the same architecture as a tool running in a tablet browser.

### Digital Switching — CZone and EmpirBus

Digital switching replaces traditional circuit breaker panels with networked modules distributed throughout the vessel. All major systems use NMEA 2000 (CAN bus) as the network backbone.

| System | Owner | MFD Compatibility | Key Strength |
|---|---|---|---|
| **CZone** | Mastervolt / Brunswick | Garmin, Simrad, B&G, Lowrance, Raymarine, Furuno | Widest MFD compatibility; industry standard |
| **EmpirBus NXT** | EmpirBus (acquired by Garmin) | Raymarine (primary), Garmin | Deep Raymarine integration; web-based UI builder |
| **Naviop** | Navico / Brunswick | Simrad, B&G, Lowrance | 50+ protocol gateway; middleware approach |
| **OctoPlex** | Carling Technologies | Garmin (OneHelm) | AC/DC load control; redundant architecture |
| **YachtSense** | Raymarine | Raymarine only | Raymarine's own end-to-end solution |

CZone is the closest thing to a universal standard — it works with every major MFD brand. If Above Deck ever interfaces with digital switching, CZone/NMEA 2000 compatibility is the priority.

---

## 7. EmpirBus UI Builder — The Pattern for Custom Marine Dashboards

### How It Works

The EmpirBus Graphics Editor (`graphics.empirbus.com`) is a web-based UI builder that lets installers and boat builders design custom digital switching screens. These screens deploy to the EmpirBus WDU (Web Display Unit), which serves them as HTML5 to any compatible device.

**Architecture:**
- Web-based editor generates an HTML5 graphics package
- Package is uploaded to the WDU (a web server appliance)
- WDU serves the custom UI to MFDs, tablets, or any HTML5 browser
- WDU connects to EmpirBus NXT DCM modules via NMEA 2000 CAN bus
- Each DCM provides 16 configurable bi-directional I/O channels

**Editor capabilities:**
- Drag-and-drop canvas for placing interactive elements
- Supports PNG, JPG, SVG images
- Widget types: pulse buttons, momentary switches, rotary switches, dimmer controls, signal value displays
- 7 button states each (Off, On, Pressed, Error 1, Error 2, Error 1&2, Service unavailable) with custom images
- Live data binding to NMEA 2000 PGNs for real-time battery status, tank levels, circuit state
- Analog gauges: battery voltage, fluid levels, temperature
- Component reuse via cloud storage

**Vessel modes:** programmable configurations (Dock Away, Under Way, Anchor Aboard, etc.) that automatically set lighting, pump, and power states. Supports complex logic — toilet flushing sequences, wiper control with variable delays, pump timers, thermostat functions.

### The Above Deck Opportunity

EmpirBus solved the "custom boat dashboard" problem with three elements:

1. A web-based visual editor that non-developers can use
2. HTML5 output that runs on any screen
3. Live data binding to NMEA 2000

Above Deck could build a similar dashboard builder — a drag-and-drop tool where sailors design their own MFD screens, binding widgets to data from the Above Deck data model (which aggregates NMEA, Victron, Matter, and sensor data). The differences:

- **Open source** — not locked to EmpirBus hardware
- **Any data source** — NMEA, Victron, Matter, Meshtastic, not just EmpirBus DCMs
- **Any display** — runs on any browser, not just MFDs with HTML5 support
- **Community-shared** — sailors share dashboard layouts with each other

The key distinction from CZone: CZone's UI is per-platform (different for each MFD brand, rendered with Qt). EmpirBus's UI is HTML5 (runs on any browser). Above Deck aligns with the EmpirBus/HTML5 approach.

---

## 8. LoRa / Meshtastic — Long-Range Communication

### The Problem It Solves

Matter, Thread, and WiFi are all short-range technologies (10-50m). For a sailor at anchor who goes ashore to a restaurant, none of them reach. LoRa (Long Range) radio reaches 1-8+ kilometres — it is the technology that keeps you connected to your boat from shore without cellular or WiFi.

### How It Works

Meshtastic is an open-source mesh network built on LoRa radio. Devices form a self-healing mesh where messages hop between nodes. No infrastructure required — no cell towers, no internet, no subscriptions.

### Marine Use Cases

| Use Case | How It Works | Range |
|----------|-------------|-------|
| **Anchor drag alarm** | Boat node transmits GPS position. Shore node alerts if position drifts beyond threshold | 1-8+ km |
| **Bilge alarm** | SignalK alert transmitted to crew Meshtastic devices | 1-8+ km |
| **MOB beacon** | Crew wearable devices detected. Alert if signal lost | Line of sight |
| **Boat-to-boat messaging** | Text messages between vessels in an anchorage | 1-8+ km, further with mesh |
| **Shore monitoring** | Wind speed, temperature, battery voltage, position history from shore | 1-8+ km |
| **Marina mesh** | Multiple boats create a mesh network across an anchorage or marina | Extends range via hopping |

### Hardware

- **Boat node:** Heltec V3.2 (~$20-30), powered from 12V, connected to the boat's WiFi
- **Crew node:** SenseCAP T1000-e (~$40), waterproof, GPS-enabled, wearable
- **Solar buoy nodes:** DIY solar-powered Meshtastic relays for permanent anchorage coverage

### Existing Integration

The `signalk-meshtastic` plugin already exists, transmitting vessel telemetry (position, wind, temp, battery) over Meshtastic, sending SignalK alerts (bilge, anchor drag, MOB) to crew devices, and showing position history for anchor swing pattern analysis.

### Above Deck Fit

This is a strong candidate for a Go protocol adapter. Integration paths:
- Serial connection to a Meshtastic device on the boat
- The Meshtastic HTTP/BLE API
- A dedicated Go Meshtastic library (the protocol is well-documented)

Key scenarios: anchor watch alerts to crew ashore, boat monitoring (battery, bilge, cabin temp) without returning to the boat, fleet communication during cruising rallies, and emergency backup when all other communication fails.

---

## 9. Victron Integration

### The De Facto Standard

Victron Energy has achieved a dominant position among cruising sailors for power management. Their combination of product quality, open data protocols, and active community makes them the closest thing to a standard in marine electrical systems.

**Typical Victron setup on a cruising sailboat:**

| Component | Product | Approx. Cost | Function |
|-----------|---------|-------------|----------|
| Solar charge controller | SmartSolar MPPT 100/30 or 150/35 | $150-300 | Manages solar panel charging |
| Battery monitor | SmartShunt 500A | $100-150 | Tracks state of charge, current, voltage |
| Inverter/charger | MultiPlus 12/3000/120 | $1,200-2,000 | AC power from batteries, shore power charging |
| System hub | Cerbo GX | $350-450 | Central monitoring, VRM cloud, MQTT, SignalK |
| Display (optional) | GX Touch 50 or 70 | $250-400 | Touchscreen for Cerbo GX |
| DC-DC charger | Orion-Tr Smart 12/12-30 | $150-200 | Alternator-to-battery charging |

### Victron Protocols

| Protocol | Transport | Usage |
|----------|-----------|-------|
| VE.Direct | Serial 19200 baud | Direct device connection (charge controllers, shunts) |
| MQTT | TCP via Cerbo GX / Venus OS | Primary integration path |
| Modbus TCP | TCP 502 | Industrial integration |
| BLE | Bluetooth | VictronConnect app, SmartSolar/SmartShunt direct |
| NMEA 2000 | CAN bus | Marine instruments |

### No Matter Support — The Bridge Opportunity

Victron does not support Matter. There is no announcement or community discussion suggesting it is planned. This creates a bridge opportunity for Above Deck.

The Go server already reads Victron via MQTT/VE.Direct/Modbus (as planned). It could expose Victron data as Matter devices:

- Battery state of charge → Matter Battery cluster
- Solar production → Matter Solar device type
- Inverter state → Matter On/Off + Electrical Measurement

This means sailors could monitor Victron systems from Apple Home or Google Home while docked — something nobody else offers. Above Deck becomes the missing bridge between marine electrical systems and the consumer IoT world.

### Data Model Mapping

| Matter Cluster | Above Deck Data Path | Source |
|---------------|---------------------|--------|
| Temperature Measurement | `environment.cabin.temperature` | Matter sensor |
| Relative Humidity | `environment.cabin.humidity` | Matter sensor |
| On/Off (contact sensor) | `environment.bilge.aft.flood` | Matter contact sensor |
| Electrical Measurement | `electrical.solar.production` | Matter solar device / Victron bridge |
| Power Source (battery) | `electrical.batteries.house.stateOfCharge` | Matter battery / Victron bridge |

---

## 10. Web Browser Hardware APIs

### The Zero-Install Path

Modern browser APIs can talk directly to hardware — potentially eliminating the need for the Go server in simple setups. This is Above Deck's most extreme expression of "tools work alone."

### Available APIs

| API | What It Does | Browser Support | Marine Use |
|-----|-------------|-----------------|------------|
| **Web Serial** | Read/write serial ports from JavaScript | Chrome, Edge (not Firefox/Safari) | NMEA 0183 via USB-serial adapter |
| **Web Bluetooth** | Connect to BLE GATT devices from the browser | Chrome, Edge (partial Safari) | Victron BLE, Ruuvi sensors, BLE wind instruments |
| **Web USB** | Direct USB device access | Chrome, Edge (not Firefox/Safari) | USB instruments, CAN adapters |

### Web Serial + NMEA 0183

A sailor with a phone or tablet running the Above Deck PWA, a USB OTG cable, and a USB-to-RS422 adapter (~$15) could read NMEA 0183 data directly in the browser. No server needed. The PWA parses NMEA sentences in JavaScript and displays instrument data.

```
┌──────────────┐    USB OTG    ┌──────────────┐    RS-422    ┌──────────────┐
│  iPad/Phone  │──────────────▶│  USB-RS422   │────────────▶│ NMEA 0183    │
│  PWA Browser │◀──────────────│  Adapter     │◀────────────│ Instruments  │
│  Web Serial  │               │  (~$15)      │             │              │
└──────────────┘               └──────────────┘             └──────────────┘
```

### Web Bluetooth + Victron BLE

Victron's SmartSolar, SmartShunt, and similar devices broadcast data over BLE. Web Bluetooth could read battery state, solar production, and charge state directly in the browser — without a server.

### Limitations

- **No Firefox or Safari support** for Web Serial/USB — no iOS Safari. iPads need a Chromium-based browser
- **No CAN bus** (NMEA 2000) via web APIs — CAN requires kernel-level SocketCAN, needs the Go server
- **Permission model** — user must grant access each time
- **No background processing** — browser must be in foreground to maintain connection

### Progressive Enhancement Strategy

Web APIs are an enhancement, not a replacement for the Go server:

- **Standalone mode:** Sailor with a phone and a USB adapter gets basic NMEA 0183 instruments. No Pi, no server, no Docker. Zero hardware investment beyond a $15 adapter.
- **Enhanced mode:** Go server handles NMEA 2000, Victron, Matter, Meshtastic, persistent logging, AI. The PWA gets data from the server instead.
- **Hybrid:** Web Bluetooth reads nearby Victron devices directly. The server handles everything else.

This dramatically lowers the barrier to entry. A sailor can try Above Deck with zero infrastructure — just open the PWA and plug in a USB cable.

---

## 11. Recommended Hardware Architecture

### The Full Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    Display Layer                             │
│                                                             │
│  ┌──────────┐    ┌──────────┐   ┌────────┐  ┌───────────┐ │
│  │ Helm iPad│    │ Nav iPad │   │ Phone  │  │ MFD HTML5 │ │
│  │ (PWA)    │    │ (PWA)    │   │ (PWA)  │  │ (Browser) │ │
│  └────┬─────┘    └────┬─────┘   └───┬────┘  └─────┬─────┘ │
│       │               │             │              │        │
│       └───────────┬───┘─────────────┘──────────────┘        │
│                   │  WiFi                                   │
│          ┌────────┴──────────────┐                          │
│          │ Raspberry Pi 5        │                          │
│          │ + PICAN-M HAT         │                          │
│          │ Above Deck Go Server  │                          │
│          │ (Docker)              │                          │
│          │                       │                          │
│          │ Adapters:             │                          │
│          │  - NMEA 0183/2000     │                          │
│          │  - Victron            │                          │
│          │  - Matter Controller  │                          │
│          │  - Meshtastic         │                          │
│          │  - SignalK            │                          │
│          │                       │                          │
│          │ Services:             │                          │
│          │  - MCP Server (AI)    │                          │
│          │  - Matter Bridge      │                          │
│          │  - Data logging       │                          │
│          └──────┬───┬───┬───┬───┘                          │
│                 │   │   │   │                               │
│    ┌────────────┘   │   │   └────────────┐                 │
│    │                │   │                │                  │
│    ▼                ▼   ▼                ▼                  │
│ ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌───────────────┐ │
│ │NMEA 2000 │ │ Victron  │ │ Thread    │ │ Meshtastic    │ │
│ │Bus       │ │ Cerbo GX │ │ Mesh      │ │ Node          │ │
│ │(CAN bus) │ │ (MQTT)   │ │ (Matter   │ │ (LoRa)        │ │
│ │          │ │          │ │  sensors) │ │               │ │
│ │GPS, wind,│ │Solar,    │ │Temp,      │ │Anchor alarm,  │ │
│ │depth,    │ │battery,  │ │humidity,  │ │shore monitor, │ │
│ │heading,  │ │inverter  │ │contact,   │ │boat-to-boat   │ │
│ │AIS       │ │          │ │lighting   │ │               │ │
│ └──────────┘ └──────────┘ └───────────┘ └───────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Optional: ESP32-C6 NMEA WiFi Gateway                  │ │
│  │ (For boats where Pi can't be near instruments)         │ │
│  │ Doubles as Thread Border Router                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Optional: Starlink / Cellular                          │ │
│  │ (Bandwidth-aware sync, remote access, weather data)    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Recommended Reference Hardware Kit

| Component | Product | Approx. Cost | Role |
|-----------|---------|-------------|------|
| Server | Raspberry Pi 5 (4GB) | $60 | Runs Above Deck Go server in Docker |
| Marine HAT | PICAN-M | $99 | NMEA 0183 + NMEA 2000 + 12V power |
| Enclosure | Waterproof ABS project box | $20-30 | Protection |
| NMEA WiFi bridge (optional) | ESP32-C6 + CAN transceiver | $15 | Wireless NMEA for remote instruments |
| Thread border router (optional) | ESP32-C6 | $5 | Matter sensor mesh |
| Shore monitor (optional) | Heltec V3.2 Meshtastic | $25 | Anchor alarm, boat monitoring from shore |
| Crew wearable (optional) | SenseCAP T1000-e | $40 | MOB, personal alerts |
| **Core total** | | **~$180-190** | |
| **Full kit total** | | **~$265** | |

### Deployment Tiers

**Tier 0 — Zero Install:**
Phone/tablet + Above Deck PWA + USB OTG cable + RS422 adapter ($15). Web Serial reads NMEA 0183 directly. No server, no Pi, no Docker.

**Tier 1 — Standalone Server:**
Raspberry Pi 5 + PICAN-M HAT (~$160). Direct NMEA 0183/2000 access. WiFi serves the PWA to all tablets on the boat. Victron integration via USB (VE.Direct) or WiFi (Cerbo MQTT).

**Tier 2 — Full Platform:**
Tier 1 + Matter sensors (off-the-shelf) + Meshtastic shore monitoring + ESP32 wireless bridges. Multiple iPads showing different MFD screens at helm, nav station, and salon.

**Tier 3 — Premium Turnkey:**
HALPI2 ruggedised unit (~$300+) replaces the Pi + HAT + enclosure. Everything else the same.

### Technology Priority Matrix

| Technology | Priority | When | Why |
|-----------|----------|------|-----|
| **iPad PWA deployment** | Now | Already possible | Tools already render in MFD frame |
| **Web Serial (NMEA 0183)** | High | With chartplotter | Zero-install instrument data |
| **Web Bluetooth (Victron)** | High | With energy tools | Read solar/battery directly in browser |
| **Raspberry Pi + PICAN-M** | High | With platform layer | The recommended deployment hardware |
| **ESP32 NMEA gateway** | High | With platform layer | Wireless NMEA bridge. Proven, cheap |
| **Matter/Thread** | Medium | With boat management | Consumer sensors for cabin/bilge/lighting |
| **Meshtastic/LoRa** | Medium | With anchor watch | Anchor alarm from shore. Killer feature for cruisers |
| **Starlink integration** | Low | With passage planner | Bandwidth-aware sync, Starlink status adapter |
| **ESP32-C6 Thread BR** | Low | After Matter controller | Thread border router for Matter sensor mesh |

---

## Sources

### Marine Protocols and Hardware
- [PICAN-M HAT — Copperhill Tech](https://copperhilltech.com/pican-m-nmea-0183-nmea-2000-hat-for-raspberry-pi/)
- [MacArthur HAT — Wegmatt](https://shop.wegmatt.com/products/openmarine-macarthur-hat)
- [HALPI2 Ruggedised Pi — Hackaday](https://hackaday.com/2025/09/20/a-ruggedized-raspberry-pi-for-sailors/)
- [NMEA 2000 Powered Raspberry Pi — Seabits](https://seabits.com/nmea-2000-powered-raspberry-pi/)
- [ESP32 NMEA 2000 Gateway — open-boat-projects](https://open-boat-projects.org/en/nmea2000-and-esp32/)
- [esp32-nmea2000 — GitHub](https://github.com/wellenvogel/esp32-nmea2000)
- [SensESP — HatLabs](https://signalk.org/SensESP/)
- [NMEA 2000 Explained — CSS Electronics](https://www.csselectronics.com/pages/nmea-2000-n2k-intro-tutorial)

### Matter and IoT
- [Matter Protocol — CSA-IOT](https://csa-iot.org/all-solutions/matter/)
- [Matter 2026 Status Review](https://matter-smarthome.de/en/development/the-matter-standard-in-2026-a-status-review/)
- [Matter Specification Documents](https://handbook.buildwithmatter.com/specification/)
- [gomat — Go Matter Library](https://github.com/tom-code/gomat)
- [connectedhomeip — Official Matter SDK](https://github.com/project-chip/connectedhomeip)
- [ESP Thread Border Router](https://openthread.io/guides/border-router/espressif-esp32)
- [Arduino Matter Discovery Bundle](https://blog.arduino.cc/2026/02/25/the-new-arduino-matter-discovery-bundle-is-everything-you-need-to-learn-experiment-and-build-with-matter/)

### MFD Platforms
- [Panbo: Garmin OneHelm HTML5](https://panbo.com/garmin-onehelm-html5-1-lumishore-seakeeper-and-shadow-caster/)
- [Panbo: Digital Switching across platforms](https://panbo.com/digital-switching-raymarine-empirbus-simrad-naviops-offshore-octoplex-garmin-and-czone/)
- [Raymarine: LightHouse Apps](https://www.raymarine.com/en-us/our-products/digital-boating/lighthouse-apps)
- [Raymarine: YachtSense Ecosystem](https://www.raymarine.com/en-us/our-products/digital-boating/yachtsense-ecosystem)
- [EmpirBus Graphics Editor — Quickstart Guide](https://manuals.plus/m/b284e88d91c7a77f03e13de58bd572a6ed09f8482c2ae3b53570ddc3aa9d993b.pdf)

### LoRa and Meshtastic
- [SignalK + Meshtastic Integration](https://signalk.org/2025/signalk-meshtastic/)
- [signalk-meshtastic Plugin — GitHub](https://github.com/meri-imperiumi/signalk-meshtastic)
- [Off-Grid Boat Communications — NoForeignLand](https://blog.noforeignland.com/off-grid-boat-communications-with-meshtastic/)
- [LoRa Boat Monitor — open-boat-projects](https://open-boat-projects.org/en/lora-bootsmonitor/)

### Victron
- [Victron Data Communication (PDF)](https://www.victronenergy.com/upload/documents/Technical-Information-Data-communication-with-Victron-Energy-products_EN.pdf)
- [Victron BLE — Home Assistant](https://www.home-assistant.io/integrations/victron_ble/)
- [Victron Energy — Sailing Yacht Solutions](https://www.victronenergy.com/markets/marine/sailing-yacht)

### SignalK and Open Source Marine
- [Signal K Overview](https://signalk.org/overview/)
- [Signal K Data Model](https://signalk.org/specification/1.7.0/doc/data_model.html)
- [OpenPlotter — OpenMarine](https://openmarine.net/openplotter)
- [Bareboat Necessities OS](https://bareboat-necessities.github.io/my-bareboat/)
- [open-boat-projects.org](https://open-boat-projects.org/en/)

### Web APIs
- [Web Serial API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API)
- [Web Serial Guide — Chrome Developers](https://developer.chrome.com/docs/capabilities/serial)
- [NMEA 0183 JavaScript Parser](https://github.com/101100/nmea-simple)

### Sailor Hardware Landscape
- [Cruising Sailboat Electronics Setup with Signal K — Henri Bergius](https://bergie.iki.fi/blog/signalk-boat-iot/)
- [Budgeting for Electronics — Cruising World](https://www.cruisingworld.com/budgeting-for-electronics/)
- [Chartplotter vs iPad — Improve Sailing](https://improvesailing.com/navigation/chartplotter/tablet)
- [Autopilot Buyer's Guide — Attainable Adventure Cruising](https://www.morganscloud.com/2023/03/26/autopilot-buyers-guide/)
