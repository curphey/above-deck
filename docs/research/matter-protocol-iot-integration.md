# Matter Protocol & IoT Integration Research

**Date:** 2026-03-20
**Status:** Research complete, pending design phase

---

## Executive Summary

Matter is an open-source, IP-based IoT interoperability standard backed by Apple, Google, and Amazon. It covers the "smart home" layer of boat systems — lighting, climate, environmental sensors, energy management, security — that marine protocols (NMEA 0183/2000) don't reach. For Above Deck, Matter represents an opportunity to replace the planned "MQTT + ESP32 DIY sensors" approach with standardised, off-the-shelf hardware while simultaneously enabling sailors to access boat systems from consumer smart home apps (HomeKit, Google Home) when docked.

A pure Go Matter controller implementation is feasible, aligns with project principles (no Node, single binary, own the protocol), and would fit cleanly into the existing adapter architecture alongside NMEA, Victron, and MQTT adapters.

---

## What Matter Is

Matter is an application-layer protocol running over IPv6. Devices communicate locally on the network — no cloud required. It uses two transport layers:

- **WiFi/Ethernet** — for powered devices (plugs, controllers, cameras)
- **Thread** — a low-power 802.15.4 mesh network for battery-operated sensors. Thread is self-healing mesh, so sensors spread around the vessel relay for each other

Every Matter device exposes "clusters" — standardised interfaces. A temperature sensor exposes a Temperature Measurement cluster. A smart plug exposes On/Off + Electrical Measurement clusters. A controller reads these clusters the same way regardless of manufacturer. No custom firmware, no proprietary apps.

### Specification Scope

The Matter specification comprises four documents:

| Document | Coverage |
|----------|----------|
| Core Specification | Protocol layers, security, commissioning, interaction model |
| Application Cluster Specification | Data models for each cluster type |
| Device Library Specification | Device type definitions and required clusters |
| Namespace Specification | Common data formats (introduced in v1.2) |

### Version History (Relevant Features)

| Version | Date | Relevant Additions |
|---------|------|-------------------|
| 1.0 | Oct 2022 | Lighting, plugs, switches, sensors (motion, door, temperature), thermostats |
| 1.2 | Oct 2023 | Air quality sensors (CO2, VOC, CO), smoke/CO alarms |
| 1.3 | May 2024 | Water and energy management devices |
| 1.4 | Nov 2024 | **Solar panels, batteries**, home routers, water heaters, heat pumps |
| 1.5 | Nov 2025 | **Cameras**, soil moisture sensors, **Device Energy Management cluster**, advanced power metering |

As of March 2026, there are 750+ Matter-certified products on the market.

---

## What Matter Enables on a Boat

### Replace DIY MQTT Sensors with Off-the-Shelf Hardware

The Above Deck vision currently specifies "MQTT sensors (ESP32/DIY)" for temperature, bilge, and tanks. With Matter, sailors could use consumer hardware:

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

**The win:** Sailors walk into any electronics store, buy a Matter sensor, and it works with Above Deck. No flashing ESP32 firmware, no configuring MQTT topics, no custom protocol bridges.

### Energy Management (Matter 1.4/1.5)

Matter 1.5's Device Energy Management cluster is directly relevant to the solar planner and energy tools:

- **Solar panels** — standardised device type with generation data
- **Batteries** — state of charge, voltage, current as standardised clusters
- **Smart energy scheduling** — devices participate in energy coordination ("only run the watermaker when solar surplus exceeds 200W")
- **Power metering** — smart plugs report actual consumption per circuit

The energy planner currently uses manual equipment entry. With Matter, it could pull live data from Matter-compatible devices — real consumption, real generation, actual battery state.

### Above Deck as a Matter Controller

The Go server acts as a Matter controller (like Home Assistant does):

- **Single pane of glass** — all Matter devices appear in the MFD interface alongside NMEA instruments. Cabin temp next to sea temp. Solar production next to battery voltage.
- **Automation rules** — "if battery drops below 40%, turn off non-essential lighting" or "if bilge contact sensor triggers, send notification and log event"
- **AI integration** — the MCP server queries Matter devices the same way it queries NMEA data. "Is any hatch left open?" "What's the engine room temperature trend?"

### Ecosystem Interoperability (When Docked)

If Above Deck exposes boat systems as Matter devices (bridge mode):

- **HomeKit/Google Home access** — check bilge status, cabin temperature, or security from the phone's native smart home app — without the Above Deck app open
- **Marina integration** — future possibility where marinas expose shore power or services as Matter devices
- **Boat-as-smart-home** — liveaboards get their boat working like a smart home with zero vendor lock-in

---

## SignalK Overlap Analysis

### Protocol Comparison

| Domain | NMEA 0183/2000 | SignalK | Matter | Above Deck Plan |
|--------|---------------|---------|--------|----------------|
| Navigation (GPS, heading, depth) | Yes | Yes | No | NMEA direct |
| Wind/weather instruments | Yes | Yes | No | NMEA direct |
| Engine/propulsion | Yes | Yes | No | NMEA direct |
| Tanks (fuel, water) | Yes | Yes | No | NMEA direct |
| Steering/autopilot | Yes | Yes | No | NMEA direct |
| **Electrical (batteries, solar)** | Partial (N2K) | Yes | **Yes (v1.4+)** | Victron + Matter |
| **Lighting** | No | Yes (CZone) | **Yes** | Matter |
| **Climate/HVAC** | No | Limited | **Yes** | Matter |
| **Environmental sensors** | No | Yes | **Yes** | Matter |
| **Pumps/relays** | Partial | Yes (CZone) | **Yes** | Matter |
| **Security (motion, cameras)** | No | No | **Yes (v1.5)** | Matter |
| Sails/rigging | No | Yes | No | Future |
| AIS | Yes | Yes | No | NMEA/AIS direct |

### SignalK Data Model

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

### Key Distinction

SignalK is a **marine data model + server** (Node.js). It defines the schema and provides the runtime. Above Deck owns its own data model and Go server — SignalK is an optional compatibility adapter.

Matter is a **device interoperability protocol**. It defines how devices communicate, not a vessel data model. Above Deck maps Matter device data into its own data model, just as it maps NMEA sentences.

**They don't compete.** NMEA owns navigation/propulsion. Matter owns the smart-home layer. The overlap in electrical/environmental is where Above Deck can draw from both — NMEA/Victron for marine instruments, Matter for consumer sensors and lighting.

---

## Victron Energy + Matter

### Current State

**Victron does not support Matter.** There is no announcement or community discussion suggesting it's planned. Victron's integration ecosystem:

| Protocol | Transport | Usage |
|----------|-----------|-------|
| VE.Direct | Serial 19200 baud | Direct device connection |
| MQTT | TCP via Cerbo GX / Venus OS | Primary integration path |
| Modbus TCP | TCP 502 | Industrial integration |
| BLE | Bluetooth | VictronConnect app |
| NMEA 2000 | CAN bus | Marine instruments |

### Bridge Opportunity

Above Deck's Go server already reads Victron via MQTT/VE.Direct/Modbus (as planned). It could expose Victron data as Matter devices:

- Battery state of charge → Matter Battery cluster
- Solar production → Matter Solar device type
- Inverter state → Matter On/Off + Electrical Measurement

This means sailors could monitor Victron systems from Apple Home/Google Home while docked — something nobody else offers. Above Deck becomes the missing bridge between marine electrical systems and the consumer IoT world.

---

## Thread Mesh on a Boat

Thread uses IEEE 802.15.4 at 2.4 GHz in a self-healing mesh topology.

### Feasibility by Hull Material

| Factor | Impact | Notes |
|--------|--------|-------|
| **Fibreglass hull** | Good | Low attenuation, signal passes through well — ideal for catamarans and most cruising boats |
| **Aluminium/steel hull** | Challenging | Signal blocked by metal compartments. Sensors need mesh routing through hatches/openings |
| **Mesh self-healing** | Very positive | Powered Thread devices (lights, plugs) act as routers, relaying for battery sensors |
| **Range** | ~10-15m indoor | Sufficient for most boats. A 50ft cat might need 3-4 mesh nodes |
| **Power** | Excellent | Thread end devices sleep aggressively. Temp sensor on coin cell lasts 1-2 years |

### Thread Border Router

Required to bridge the Thread mesh to the boat's WiFi network. Options:

- **ESP32-C6 or ESP32-H2** — Espressif provides a Thread Border Router SDK. Small, cheap (~$5), could be built into Above Deck's hardware or run standalone
- **Integrated into Go server hardware** — if Above Deck runs on a Raspberry Pi or similar with a Thread radio (USB dongle or HAT)

Thread is well-suited to boats — the mesh topology handles compartmentalised layouts (hulls, cabins, lazarette, engine room) better than WiFi, and the low power budget is perfect for battery-operated marine sensors.

---

## Go Implementation Strategy

### Approach: Pure Go, Test Against connectedhomeip

The existing Go Matter library `gomat` (github.com/tom-code/gomat) demonstrates feasibility:

- **Pure Go** — no C/C++ dependencies, no CGo
- 135 commits by a single developer achieved: commissioning, PASE, CASE, certificates, discovery, read/subscribe
- Tested on real hardware (Yeelight Cube) and `connectedhomeip` virtual devices
- Dependencies: only Go stdlib + standard crypto

`connectedhomeip` (github.com/project-chip/connectedhomeip) is the official C++ Matter reference implementation. It is NOT a dependency — it provides **virtual test devices** that you commission and read from to validate your controller.

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

### Protocol Layers Required

| Layer | What It Does | Complexity | Go Feasibility |
|-------|-------------|------------|----------------|
| mDNS/DNS-SD discovery | Find Matter devices on the network | Low | Excellent libraries (`hashicorp/mdns`, `grandcat/zeroconf`) |
| SPAKE2+ (PASE) | Password-based session establishment using setup code | Medium | `gomat` implements this. ~500 lines. Standard crypto |
| SIGMA (CASE) | Certificate-based operational session establishment | Medium-High | ECDSA, HKDF, AES-CCM — Go's `crypto` stdlib handles all of it |
| TLV encoding | Matter's binary wire format (Type-Length-Value) | Low | Simple encoder/decoder. ~300 lines |
| Message framing | Packet structure, counters, AES-128-CCM encryption | Medium | Go `crypto/cipher` |
| Interaction Model | Read/Write/Subscribe/Invoke commands | Medium | The core controller logic. Protocol-level request/response |
| Certificate management | NOC, RCAC, fabric identity | Medium | Go `crypto/x509` handles natively |
| Cluster definitions | Data models for each device type | Low (but wide) | Code-gen from spec. Struct definitions + attribute IDs |

### What You Can Skip

- **Thread radio stack** — the ESP32 border router handles this. Go server talks to Thread devices over IP
- **Device implementation** — Above Deck is a controller, not a device (initially — bridge mode comes later)
- **BLE transport** (initially) — commission over WiFi/IP. Add BLE commissioning later
- **Full cluster coverage** — start with 5-6 clusters relevant to boats, add more incrementally

### Estimated Scope

A minimal Matter controller (discover, commission, read, subscribe, command) is approximately **3,000-5,000 lines of Go**, leveraging:

- Go stdlib `crypto` (ECDSA, AES-CCM, HKDF, x509)
- An existing mDNS library
- `gomat` as reference material (study the approach, write clean implementation)
- The Matter specification for protocol details

### Development and Testing Approach

1. **Study `gomat` and `matter.js`** for protocol understanding and edge cases
2. **Write clean implementation** as a Go package within the Above Deck codebase
3. **Test against `connectedhomeip` virtual devices** in Docker — they provide images for various device types
4. **Start with discovery + PASE + read** — enough to find a temperature sensor and read its value
5. **Add CASE, subscribe, commands** incrementally
6. **Code-gen cluster definitions** from the Matter spec for the device types that matter (pun intended)
7. **CI integration** — spin up virtual Matter devices in CI for automated protocol tests

### Other Go Libraries (Reference)

| Library | Stars | Status | Notes |
|---------|-------|--------|-------|
| `tom-code/gomat` | 52 | Most complete. Commissioning, CASE, PASE, discovery, subscriptions. Tested on real hardware | Best reference for Above Deck implementation |
| `cybergarage/go-matter` | 33 | mDNS discovery implemented, PASE in progress. Self-described "hobby project" | Too early to be useful as reference |

---

## Architecture Integration

### Adapter Pattern

Matter slots into the existing protocol adapter architecture:

```
┌─────────────────────────────────────────────────────┐
│                   MFD Interface                      │
│  (Chartplotter, Solar, VHF, Instruments, Boat Mgmt) │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────┐
│              Above Deck Go Server                    │
│                                                      │
│  ┌─────────┐ ┌────────┐ ┌──────┐ ┌───────────────┐ │
│  │  NMEA   │ │Victron │ │ MQTT │ │    Matter      │ │
│  │ Adapter │ │Adapter │ │Adapt.│ │  Controller    │ │
│  └────┬────┘ └───┬────┘ └──┬───┘ └───────┬───────┘ │
│       │          │         │              │          │
│  ┌────┴──────────┴─────────┴──────────────┴───────┐ │
│  │         Unified Above Deck Data Model          │ │
│  └────────────────────┬───────────────────────────┘ │
│                       │                              │
│  ┌────────────────────┴───────────────────────────┐ │
│  │              MCP Server (AI)                   │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │     Matter Bridge (expose boat → Matter)       │ │
│  └────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
         │              │              │
    ┌────┴────┐   ┌─────┴─────┐  ┌────┴──────────┐
    │NMEA bus │   │ Victron   │  │ Thread Mesh   │
    │GPS,wind │   │ Cerbo GX  │  │  (sensors,    │
    │depth    │   │ solar,bat │  │   lighting,   │
    └─────────┘   └───────────┘  │   relays)     │
                                 └──────────────┘
```

### Two Directions

1. **Inbound (Controller)** — discover and read Matter sensors → unified data model → MFD display + AI queries
2. **Outbound (Bridge)** — expose NMEA/Victron/Above Deck data as Matter devices → HomeKit/Google Home access when docked

### Data Model Mapping Examples

| Matter Cluster | Above Deck Data Path | Source |
|---------------|---------------------|--------|
| Temperature Measurement | `environment.cabin.temperature` | Matter sensor |
| Temperature Measurement | `environment.engineRoom.temperature` | Matter sensor |
| Relative Humidity | `environment.cabin.humidity` | Matter sensor |
| On/Off (contact sensor) | `environment.bilge.aft.flood` | Matter contact sensor |
| On/Off (light) | `loads.lighting.cabin` | Matter smart switch |
| Electrical Measurement | `electrical.solar.production` | Matter solar device / Victron bridge |
| Power Source (battery) | `electrical.batteries.house.stateOfCharge` | Matter battery / Victron bridge |

---

## Strategic Value

| Project Principle | How Matter Aligns |
|-------------------|-------------------|
| No Node on backend | Pure Go implementation, single binary |
| Own the data model | Matter devices map to Above Deck schema, not SignalK |
| Plugin to us | Matter adapter is a plugin, not a dependency. Others extend us |
| Single binary deployment | Matter controller compiles into the Go binary |
| Offline first | Matter is local-only by design — no cloud required |
| Open source (GPL) | Could become the Go Matter controller library for marine/IoT |
| AI from day one | MCP server queries Matter devices alongside NMEA instruments |

### Competitive Advantage

No existing marine platform bridges Matter and NMEA. Above Deck would be the first to:

- Let sailors use consumer IoT sensors on their boats with a marine-grade interface
- Bridge Victron/NMEA data to HomeKit/Google Home
- Provide AI reasoning across both marine instruments and IoT sensors
- Offer a pure Go Matter controller as open-source infrastructure

---

## Open Questions for Design Phase

1. **Build sequencing** — when does Matter support get built relative to the chartplotter, passage planner, and boat management platform?
2. **Thread border router hardware** — ship an ESP32-C6 as part of the recommended hardware, or support bring-your-own?
3. **Bridge mode priority** — is inbound (reading sensors) or outbound (exposing to HomeKit) more valuable first?
4. **MQTT coexistence** — keep MQTT adapter for non-Matter ESP32 sensors, or encourage migration to Matter?
5. **Cluster priority** — which device types to implement first? Recommendation: Temperature, Humidity, Contact Sensor, On/Off, Electrical Measurement

---

## References

- [Matter Protocol — CSA-IOT](https://csa-iot.org/all-solutions/matter/)
- [Matter 2026 Status Review](https://matter-smarthome.de/en/development/the-matter-standard-in-2026-a-status-review/)
- [Matter Device Types — Google](https://developers.home.google.com/matter/supported-devices)
- [Matter Specification Documents](https://handbook.buildwithmatter.com/specification/)
- [Matter Core Specification 1.0 (PDF)](https://csa-iot.org/wp-content/uploads/2022/11/22-27349-001_Matter-1.0-Core-Specification.pdf)
- [Matter Security Model — Espressif](https://developer.espressif.com/blog/matter-security-model/)
- [Matter Commissioning Flow — eInfochips](https://www.einfochips.com/blog/building-a-smarter-home-an-in-depth-look-at-matter-commissioning/)
- [Matter Clusters, Attributes, Commands — Espressif](https://developer.espressif.com/blog/matter-clusters-attributes-commands/)
- [Signal K Overview](https://signalk.org/overview/)
- [Signal K Specification — Vessel Keys](https://signalk.org/specification/1.5.0/doc/vesselsBranch.html)
- [Signal K Data Model](https://signalk.org/specification/1.7.0/doc/data_model.html)
- [SignalK MCP Server](https://signalk.org/2025/introducing-signalk-mcp-server-ai-powered-marine-data-access/)
- [gomat — Go Matter Library](https://github.com/tom-code/gomat)
- [go-matter — CyberGarage](https://github.com/cybergarage/go-matter)
- [connectedhomeip — Official Matter SDK](https://github.com/project-chip/connectedhomeip)
- [matter.js — TypeScript Matter Implementation](https://github.com/matter-js/matter.js)
- [ESP Thread Border Router](https://openthread.io/guides/border-router/espressif-esp32)
- [Thread Protocol — Wikipedia](https://en.wikipedia.org/wiki/Thread_(network_protocol))
- [Victron Data Communication (PDF)](https://www.victronenergy.com/upload/documents/Technical-Information-Data-communication-with-Victron-Energy-products_EN.pdf)
- [Victron BLE — Home Assistant](https://www.home-assistant.io/integrations/victron_ble/)
- [MatterBridge for Home Assistant](https://thissmart.house/2025/11/26/matterbridge-for-home-assistant-expose-any-device-to-matter-controllers/)
- [Arduino Matter Discovery Bundle](https://blog.arduino.cc/2026/02/25/the-new-arduino-matter-discovery-bundle-is-everything-you-need-to-learn-experiment-and-build-with-matter/)
