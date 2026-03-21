# Smart Home Ecosystems & PWA Integration Research

**Date:** 2026-03-20
**Status:** Research complete
**Related:** [Matter Protocol & IoT Integration](./matter-protocol-iot-integration.md), [PWA & Mobile Capabilities](./pwa-and-mobile-capabilities.md), [d3kOS Deep Dive](./d3kos-and-marine-os-deep-dive.md)

---

## Executive Summary

Smart home ecosystems (Apple HomeKit, Google Home, Amazon Alexa, Samsung SmartThings, Home Assistant) provide the consumer interface that sailors already use at home. When docked, sailors want to check bilge status, cabin temperature, and battery levels from their phone's native smart home app — without opening Above Deck. The question is how a PWA-based marine platform can bridge to these ecosystems.

The short answer: PWAs cannot directly interact with smart home ecosystems. The browser sandbox prevents it entirely. The path forward is the Above Deck Go server acting as a Matter bridge — exposing boat systems as Matter devices that appear natively in HomeKit, Google Home, and Alexa simultaneously. One implementation, all ecosystems.

This document maps the landscape, explains the protocols, identifies what works and what does not from a PWA, and recommends a concrete architecture for Above Deck.

---

## Part 1: Smart Home Ecosystem Overview

### Apple HomeKit / Home App

**Architecture:** Local-first, privacy-centric. HomeKit uses the HomeKit Accessory Protocol (HAP) for direct device communication over the local network. No cloud dependency for basic control — Apple devices send commands directly to accessories via HAP. iCloud syncs configuration between user devices but does not act as a controlling hub.

**Protocols:**
- **HAP over IP** — HTTP/TCP on the local network, discovered via Bonjour (mDNS/DNS-SD). End-to-end encrypted with mutual authentication and perfect forward secrecy.
- **HAP over BLE** — Bluetooth Low Energy transport for battery-powered devices.
- **Matter** — Supported since iOS 16.1 (2022). Matter devices appear as native HomeKit accessories in the Home app.

**Hub requirement:** A HomePod, Apple TV, or iPad (as home hub) is required for remote access, automations, and Matter Thread border router functionality. Without a hub, control is local-only from devices on the same network.

**Data model:** Hierarchical — Accessories contain Services, Services contain Characteristics. A temperature sensor accessory exposes a Temperature Sensor service with a Current Temperature characteristic. Strictly typed, Apple-defined categories.

**Security:** Device pairing uses SRP (Secure Remote Password) protocol with an 8-digit setup code. Session keys use Curve25519, Ed25519, and ChaCha20-Poly1305. All communication is encrypted. No cloud keys — pairing material stays on the local network.

| Aspect | Detail |
|--------|--------|
| Protocol | HAP (proprietary), Matter (open) |
| Transport | IP (WiFi/Ethernet), BLE, Thread (via Matter) |
| Cloud dependency | None for local control; iCloud for sync |
| Hub | HomePod, Apple TV, or iPad |
| Matter support | Yes, since iOS 16.1 |
| Thread border router | HomePod Mini, HomePod 2nd gen, Apple TV 4K |
| Developer access | MFi programme (HAP), or Matter (open) |

### Google Home

**Architecture:** Historically cloud-first — device commands routed through Google's cloud even for local devices. This changed significantly with Matter and the Home APIs (2024-2026), which enable local control paths.

**Integration models:**
- **Cloud-to-cloud** — Traditional model. Device manufacturer runs a cloud service, Google Home connects to it. High latency, internet-dependent.
- **Local Home SDK** — JavaScript app runs on Google Nest hub, controls devices locally. Deprecated in favour of Matter.
- **Matter** — Native local control. Nearly every Google Nest speaker, hub, and WiFi system supports Matter devices for local connectivity. No cloud fulfillment app needed.
- **Home APIs** — New developer APIs (public beta, 2025-2026) providing unified access to 750M+ connected devices. Android SDK available; iOS SDK coming. Enables automation creation, device control, and structure management.

**Local control performance:** Home APIs with Matter achieve up to 3x faster device control compared to cloud-to-cloud, with low-latency local communication through Nest hubs.

| Aspect | Detail |
|--------|--------|
| Protocol | Cloud-to-cloud, Local Home SDK (deprecated), Matter |
| Transport | WiFi, Thread (via Nest hubs) |
| Cloud dependency | Required for cloud-to-cloud; optional with Matter |
| Hub | Nest speakers, Nest Hub, Nest WiFi |
| Matter support | Yes, native since 2022 |
| Thread border router | Nest Hub 2nd gen, Nest WiFi Pro |
| Developer access | Home APIs (Android/iOS SDK), Matter |

### Amazon Alexa

**Architecture:** Cloud-first for skills; local-first for Matter. Traditional Alexa smart home integration requires building an Alexa Smart Home Skill backed by an AWS Lambda function. Matter devices bypass this entirely — they connect directly to Alexa without a separate hub or skill.

**Integration models:**
- **Smart Home Skills** — Cloud-based. Device state changes go through AWS Lambda. Internet required.
- **Matter** — Direct local connection. Matter-compatible Echo devices support Matter 1.5 SDK, enabling control of Matter over WiFi and Thread devices.
- **Alexa Connect Kit (ACK)** — Amazon's SDK for device manufacturers. Now supports Matter with ESP32-C6. Includes Frustration Free Setup (automatic WiFi/Alexa pairing out of box).

**Device support:** Lighting, smart plugs, sensors, door locks, thermostats, fans, air purifiers, air quality sensors, smoke/CO alarms, dishwashers, robotic vacuums, and more via Matter.

| Aspect | Detail |
|--------|--------|
| Protocol | Alexa Smart Home Skill API, Matter |
| Transport | WiFi, Thread (via Echo devices) |
| Cloud dependency | Required for skills; optional with Matter |
| Hub | Echo speakers/displays with Matter support |
| Matter support | Yes, Matter 1.5 SDK |
| Thread border router | Echo 4th gen, Echo Show, newer Echo devices |
| Developer access | Alexa Skills Kit, ACK SDK for Matter |

### Samsung SmartThings

**Architecture:** Hub-based with aggressive Matter adoption. SmartThings was the first platform to support Matter 1.5 (including cameras). Samsung's "Hub Everywhere" strategy embeds SmartThings hubs into TVs, refrigerators, and other Samsung appliances — over 200 device models.

**Hub options:**
- SmartThings Station Pro — Thread Border Router, Zigbee 3.0, WiFi 6E, Bluetooth 5.3, Matter controller
- SmartThings Hub v3 / Aeotec Smart Home Hub
- Samsung TVs and appliances with integrated hubs

**Protocols:** Zigbee, Z-Wave, Matter, Thread, WiFi, BLE. The broadest protocol support of any consumer platform.

| Aspect | Detail |
|--------|--------|
| Protocol | Zigbee, Z-Wave, Matter, WiFi, BLE |
| Matter support | Yes, first platform with Matter 1.5 |
| Thread border router | SmartThings Station Pro, integrated hubs |
| Developer access | SmartThings API, Matter |

### Home Assistant

**Architecture:** Open source, local-first, massive integration library. Runs on any hardware (Raspberry Pi, NUC, VM, Docker). Over 2,700 integrations covering nearly every smart home protocol and device.

**Smart home bridging:**
- **HomeKit Bridge integration** — Exposes Home Assistant entities to Apple HomeKit. Non-HomeKit devices become controllable via Apple Home and Siri.
- **Google Assistant integration** — Exposes entities to Google Home via cloud relay (Nabu Casa) or manual setup.
- **Alexa Smart Home Skill** — Exposes entities to Alexa via cloud relay.
- **Matter controller** — Home Assistant acts as a Matter controller, commissioning and controlling Matter devices.
- **Matter bridge** — Via Matterbridge add-on or Home Assistant Matter Hub, exposes HA entities as Matter devices to any Matter controller (HomeKit, Google Home, Alexa).

**MQTT:** Native MQTT integration. This is the primary bridge protocol for DIY and marine systems. SignalK-to-MQTT bridges already exist and are used by the BBN OS community.

**Marine relevance:** Home Assistant is already used by liveaboards and technically-inclined sailors to monitor boat systems. BBN OS (Bareboat Necessities) integrates SignalK with Home Assistant via MQTT, proving the marine-to-smart-home bridge pattern works.

| Aspect | Detail |
|--------|--------|
| Architecture | Open source, local-first |
| Protocols | 2,700+ integrations (MQTT, Zigbee, Z-Wave, BLE, Matter, etc.) |
| Matter support | Controller + bridge (via add-ons) |
| HomeKit bridge | Yes, native integration |
| Google/Alexa bridge | Yes, via Nabu Casa or manual |
| Marine integration | SignalK via MQTT (proven by BBN OS) |

---

## Part 2: HomeKit Deep Dive

### HomeKit Accessory Protocol (HAP)

HAP is Apple's proprietary protocol for smart home device communication. It defines how devices are discovered, paired, and controlled.

**Discovery:** Accessories advertise via Bonjour (mDNS/DNS-SD) on the local network. The Home app discovers them automatically when on the same WiFi network.

**Pairing:** Uses SRP (Secure Remote Password) with the 8-digit setup code printed on the device or shown on-screen. After initial pairing, long-term keys (Ed25519) are exchanged. Subsequent sessions use these keys — no cloud involved.

**Communication:** HTTP over TCP, encrypted with ChaCha20-Poly1305 per session. Every request/response is authenticated and encrypted. Sessions have perfect forward secrecy.

**Data model:**
```
Accessory (e.g., "Cabin Temperature Sensor")
  └── Service (e.g., Temperature Sensor)
        ├── Characteristic: Current Temperature (read)
        ├── Characteristic: Name (read)
        └── Characteristic: Status Active (read)
  └── Service (e.g., Accessory Information)
        ├── Characteristic: Manufacturer
        ├── Characteristic: Model
        ├── Characteristic: Serial Number
        └── Characteristic: Firmware Revision
```

### HomeKit over IP vs HomeKit over BLE

| Aspect | HAP over IP | HAP over BLE |
|--------|------------|--------------|
| Transport | WiFi/Ethernet (TCP) | Bluetooth Low Energy |
| Range | Network-wide | ~10m |
| Power | Requires mains/USB power (typically) | Battery-friendly |
| Latency | Low (~50-200ms) | Higher (~200-500ms) |
| Throughput | High | Low |
| Use case | Lights, plugs, cameras, bridges | Door sensors, motion sensors, buttons |
| Boat relevance | Primary — devices on boat WiFi | Secondary — battery sensors in bilge/lazarette |

### HomeKit Bridges

A HomeKit bridge is a special accessory type that exposes multiple non-HomeKit devices to the Home app as if they were native HomeKit accessories. The bridge handles protocol translation.

**How it works:** The bridge announces itself as a single HAP accessory with the "bridge" category. It presents child accessories (up to 150) that appear individually in the Home app. The Home app pairs with the bridge once; all child accessories are accessible through that pairing.

**Key implementations:**

| Bridge | Technology | What It Exposes |
|--------|-----------|----------------|
| Homebridge | Node.js (HAP-NodeJS) | 2,000+ plugins — any non-HomeKit device |
| Home Assistant HomeKit Bridge | Python | Any Home Assistant entity |
| Philips Hue Bridge | Firmware | Hue/Zigbee lights as HomeKit accessories |
| Aqara Hub | Firmware | Zigbee sensors as HomeKit accessories |
| IKEA Dirigera | Firmware | IKEA smart home as HomeKit accessories |

### HomeKit + Matter

Since iOS 16.1, Matter devices appear as native accessories in the Home app. From the user's perspective, there is no difference between a HAP device and a Matter device — both show up in the Home app with full control, automations, and Siri support.

**Implication for Above Deck:** If the Go server exposes boat systems as Matter devices, they will appear in HomeKit without implementing HAP at all. Matter is the recommended path — it gets HomeKit support for free alongside Google Home and Alexa.

### Can a Web App / PWA Interact with HomeKit?

**No.** There is no web API, REST endpoint, or browser mechanism to interact with HomeKit. The HAP protocol is not accessible from a browser or PWA. HomeKit is strictly a native Apple framework (available in Swift/Objective-C via the HomeKit framework on iOS/macOS/tvOS/watchOS).

A PWA cannot:
- Discover HomeKit accessories
- Pair with HomeKit accessories
- Read device state from HomeKit
- Send commands to HomeKit devices
- Create HomeKit automations

The only way a web-based application can influence HomeKit is indirectly — by controlling a server that acts as a HomeKit bridge.

### HAP-NodeJS and Homebridge

**HAP-NodeJS** is the open-source Node.js implementation of the HomeKit Accessory Protocol. It implements the full HAP stack — mDNS advertisement, SRP pairing, encrypted sessions, accessory/service/characteristic model. Any Node.js process using HAP-NodeJS can appear as a HomeKit accessory in the Home app.

**Homebridge** is built on HAP-NodeJS. It runs as a Node.js server on the local network and acts as a bridge, exposing non-HomeKit devices to the Home app through a plugin system. Over 2,000 community plugins exist.

**Relevance to Above Deck:** Homebridge proves the bridge pattern works. A server on the boat network can make any data source appear in HomeKit. However, Homebridge is Node.js — which conflicts with Above Deck's Go-only backend principle.

### HAP in Go — brutella/hap

A pure Go implementation of HAP exists: **[brutella/hap](https://github.com/brutella/hap)** (Apache 2.0 license). It provides:

- Full HAP over IP implementation
- mDNS/DNS-SD service advertisement
- SRP pairing and encrypted sessions
- All HomeKit services and characteristics
- Bridge accessory support

This means Above Deck's Go server could directly expose boat systems to HomeKit via HAP — no Node.js, no Homebridge. However, this only covers Apple HomeKit. Matter is the better investment because it covers all ecosystems with one implementation.

| Approach | Language | Covers HomeKit | Covers Google Home | Covers Alexa | Effort |
|----------|---------|:-:|:-:|:-:|--------|
| brutella/hap | Go | Yes | No | No | Medium |
| Matter bridge | Go | Yes (via Matter) | Yes | Yes | Medium-High |
| Homebridge plugin | Node.js | Yes | No | No | Low |
| Home Assistant bridge | Python | Yes (via HA) | Yes (via HA) | Yes (via HA) | Low (but adds dependency) |

---

## Part 3: Matter as the Universal Bridge

### One Implementation, All Ecosystems

Matter's defining feature for Above Deck is multi-admin. A single Matter device (or bridge) can be commissioned to up to five controllers simultaneously. This means:

```
Above Deck Go Server
  └── Matter Bridge
        ├── Commissioned to: Apple Home (via HomePod)
        ├── Commissioned to: Google Home (via Nest Hub)
        ├── Commissioned to: Amazon Alexa (via Echo)
        ├── Commissioned to: Home Assistant
        └── Commissioned to: SmartThings
```

All five controllers see the same boat devices. One implementation in Go, five ecosystems served.

### Multi-Admin: How It Works

1. Above Deck's Go server starts a Matter bridge on the local network
2. First controller (e.g., Apple Home) commissions the bridge using the QR code / setup code
3. From the first controller's app, the user shares the bridge to additional controllers
4. Each subsequent controller gets a temporary setup code — no re-scanning needed
5. All controllers can read state and send commands independently
6. The Matter standard guarantees at least five concurrent fabric memberships

### What Above Deck Could Expose as Matter Devices

| Boat System | Matter Device Type | Matter Cluster | Data Source |
|-------------|-------------------|----------------|-------------|
| Cabin temperature | Temperature Sensor | Temperature Measurement | Matter sensor / NMEA |
| Engine room temperature | Temperature Sensor | Temperature Measurement | Matter sensor |
| Cabin humidity | Humidity Sensor | Relative Humidity | Matter sensor |
| Bilge water alarm | Contact Sensor | Boolean State | Contact sensor in bilge |
| Battery state of charge | Power Source | Power Source (battery) | Victron via MQTT/VE.Direct |
| Solar production | Solar Panel (v1.4+) | Electrical Energy Measurement | Victron via MQTT |
| Shore power status | Smart Plug | On/Off + Electrical Measurement | Victron / sensor |
| Cabin lighting | Dimmable Light | On/Off + Level Control | Matter smart switches |
| Navigation lights | On/Off Switch | On/Off | Relay / Matter switch |
| Anchor light | On/Off Switch | On/Off | Relay / Matter switch |
| Fridge/freezer temperature | Temperature Sensor | Temperature Measurement | Matter sensor in fridge |
| LPG gas detection | Air Quality Sensor | CO Concentration (v1.2+) | Matter gas detector |
| Motion (dock security) | Occupancy Sensor | Occupancy Sensing | Matter motion sensor |

### The Bridge Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Smart Home Ecosystems                      │
│                                                              │
│  ┌─────────┐  ┌─────────────┐  ┌───────┐  ┌──────────────┐ │
│  │ HomeKit │  │ Google Home  │  │ Alexa │  │ SmartThings  │ │
│  │(HomePod)│  │ (Nest Hub)   │  │(Echo) │  │   (Hub)      │ │
│  └────┬────┘  └──────┬──────┘  └───┬───┘  └──────┬───────┘ │
│       │              │             │              │          │
│       └──────────────┴─────┬───────┴──────────────┘          │
│                            │                                 │
│                     Matter Protocol                          │
│                      (local WiFi)                            │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────┐
│              Above Deck Go Server                            │
│                            │                                 │
│  ┌─────────────────────────┴───────────────────────────────┐ │
│  │              Matter Bridge Module                        │ │
│  │  Exposes boat data as Matter device clusters             │ │
│  └─────────────────────────┬───────────────────────────────┘ │
│                            │                                 │
│  ┌─────────────────────────┴───────────────────────────────┐ │
│  │           Unified Above Deck Data Model                  │ │
│  └──┬──────────┬──────────┬──────────┬─────────────────────┘ │
│     │          │          │          │                        │
│  ┌──┴───┐  ┌──┴────┐  ┌──┴───┐  ┌──┴──────────┐            │
│  │ NMEA │  │Victron│  │ MQTT │  │ Matter       │            │
│  │0183/ │  │VE.Dir │  │Sensor│  │ Controller   │            │
│  │ 2000 │  │/Modbus│  │ s    │  │ (inbound)    │            │
│  └──┬───┘  └──┬────┘  └──┬───┘  └──┬──────────┘            │
│     │         │          │         │                         │
└─────┼─────────┼──────────┼─────────┼─────────────────────────┘
      │         │          │         │
  [NMEA bus] [Victron]  [ESP32]  [Thread mesh]
  GPS, wind   Cerbo GX   DIY     Off-the-shelf
  depth, AIS  solar,bat  sensors  Matter sensors

┌──────────────────────────────────────────────────────────────┐
│                    PWA (browser)                              │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │           WebSocket connection to Go Server             │  │
│  │  (reads same data, sends commands, full MFD interface)  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**Two directions of Matter:**
1. **Inbound (Controller)** — Above Deck discovers and reads off-the-shelf Matter sensors (temperature, contact, humidity). Data flows into the unified model alongside NMEA and Victron.
2. **Outbound (Bridge)** — Above Deck exposes NMEA/Victron/sensor data as Matter devices. HomeKit, Google Home, and Alexa can read boat status and control boat systems.

---

## Part 4: PWA Limitations with Smart Home

### What a PWA Cannot Do

| Capability | PWA Support | Why |
|-----------|:-:|---------|
| Discover HomeKit accessories | No | HAP is a native Apple framework, not a web API |
| Control HomeKit devices | No | No browser access to HomeKit |
| Discover Google Home devices | No | Google Home APIs are native Android/iOS SDKs |
| Control Alexa devices | No | Alexa APIs are cloud-based with OAuth, not browser-accessible |
| Discover Matter devices on local network | No | Matter commissioning requires mDNS, PASE crypto, certificate management |
| Commission Matter devices | No | Requires native platform APIs (Thread, BLE for commissioning) |
| Access Siri or Google Assistant | No | Voice assistants are native-only |
| Run smart home automations | No | Automation engines run on hubs, not in browsers |

### Why the Browser Sandbox Prevents Integration

1. **No raw network access** — HAP and Matter use mDNS discovery and custom TCP connections. Browsers cannot perform mDNS queries or open arbitrary TCP sockets.
2. **No BLE commissioning** — Matter device commissioning often uses BLE. iOS Safari does not support Web Bluetooth at all. Chrome supports Web Bluetooth but not the specific GATT profiles needed for Matter.
3. **No cryptographic pairing** — HAP's SRP pairing and Matter's SPAKE2+ (PASE) require protocol-level crypto exchanges that browsers cannot participate in.
4. **No persistent background process** — Smart home bridges must run continuously to respond to ecosystem queries. Service Workers cannot maintain persistent TCP connections or run indefinitely.
5. **No platform API access** — HomeKit (iOS), Google Home SDK (Android), and Alexa SDK are native-only frameworks.

### Workarounds That Do Work

#### 1. Above Deck Server as Matter Bridge (Primary Strategy)

```
PWA ←→ WebSocket ←→ Above Deck Go Server ←→ Matter Bridge ←→ HomeKit/Google/Alexa
```

The PWA controls boat systems through the Go server over WebSocket. The Go server independently runs a Matter bridge that exposes the same data to smart home ecosystems. The PWA does not need to interact with smart home protocols — the server handles both interfaces.

**Advantages:**
- PWA stays thin — no native dependencies
- Works on all browsers and platforms
- Matter bridge runs 24/7 on the server regardless of whether the PWA is open
- One codebase, two access paths (PWA + smart home apps)

#### 2. Native App Wrapper via Capacitor (Secondary Strategy)

A Capacitor wrapper around the PWA could access native HomeKit APIs on iOS:

- **HomeKit framework** — Full accessory discovery, control, and automation via Swift
- **Siri Shortcuts** — Register custom voice commands ("Hey Siri, check the bilge")
- **Background processing** — Maintain connections without browser limitations
- **Push notifications** — Reliable alerts for boat alarms

However, this requires building and maintaining a custom Capacitor plugin that wraps Apple's HomeKit framework. It also only covers Apple — not Google Home or Alexa. This is a lower priority than the Matter bridge approach.

#### 3. Google Home REST API (Cloud-Based)

Google provides a HomeGraph REST API for cloud-to-cloud integrations. A web app could theoretically call this API with proper OAuth authentication. However, this requires:
- Registering as a Google Smart Home Action
- Cloud infrastructure for the fulfillment endpoint
- Internet connectivity (useless offshore)
- Complex OAuth flow

Not recommended for Above Deck. Matter local control is superior.

#### 4. Home Assistant as Middleware

If a sailor already runs Home Assistant, the Above Deck Go server can push data to HA via MQTT. Home Assistant then bridges to HomeKit/Google/Alexa through its existing integrations. This is a zero-cost integration for Above Deck — just publish MQTT topics in the right format.

---

## Part 5: What CAN Work from a PWA

Despite the smart home limitations, PWAs retain useful capabilities for the Above Deck use case.

### Web Bluetooth (Limited)

| Platform | Support | Limitations |
|----------|---------|-------------|
| Chrome (Android) | Yes | Cannot scan for all devices; user must select from picker |
| Chrome (Desktop) | Yes | Same picker limitation |
| Safari (iOS/iPadOS) | No | Not supported at all |
| Firefox | No | Not supported |

**Use case:** On Android, the PWA could directly read BLE sensors (Victron, temperature) without the Go server. Not viable on iOS — the primary tablet platform.

### WebSocket to Local Server

The primary data path. Works on all platforms, all browsers.

```
PWA ←→ WebSocket ←→ Go Server (local network)
```

- Real-time instrument data (NMEA, Victron, Matter sensors)
- Command relay (turn on lights, acknowledge alarms)
- Full bidirectional communication
- Works offline (local network, no internet needed)

### Push Notifications

| Platform | Support | Requirement |
|----------|---------|-------------|
| Chrome (Android) | Yes | Service Worker + VAPID keys |
| Safari (iOS 16.4+) | Yes | PWA must be installed (added to home screen) |
| Chrome (Desktop) | Yes | Service Worker |

**Use case:** Alert when boat alarm triggers (bilge pump, anchor drag, battery low). The Go server sends a push notification via web push protocol. Works even when the PWA is not actively open (on Android; limited on iOS).

### Service Worker Background Processing

Limited but useful:

- **Cache management** — Pre-cache chart tiles, weather data
- **Push event handling** — Receive and display alarm notifications
- **Background Sync (Android only)** — Queue commands while offline, send when reconnected

Cannot maintain persistent WebSocket connections or run Matter protocol in the background.

---

## Part 6: Homebridge / HAP-NodeJS Pattern Analysis

### How Homebridge Works

```
┌─────────────────────────────────────────────────────┐
│                 Apple Home App                        │
│           (discovers via mDNS/Bonjour)               │
└───────────────────────┬─────────────────────────────┘
                        │ HAP (encrypted HTTP/TCP)
┌───────────────────────┴─────────────────────────────┐
│              Homebridge (Node.js server)              │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │          HAP-NodeJS Core Library                │  │
│  │  - mDNS/DNS-SD advertisement                   │  │
│  │  - SRP pairing                                 │  │
│  │  - Encrypted session management                │  │
│  │  - Accessory/Service/Characteristic model      │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐              │
│  │Plugin A │  │Plugin B │  │Plugin C │  ...          │
│  │(Ring)   │  │(Nest)   │  │(MQTT)   │              │
│  └────┬────┘  └────┬────┘  └────┬────┘              │
│       │            │            │                    │
└───────┼────────────┼────────────┼────────────────────┘
        │            │            │
    [Ring API]   [Nest API]   [MQTT broker]
```

1. Homebridge starts and loads plugins
2. Each plugin registers accessories with services and characteristics
3. HAP-NodeJS advertises the bridge on the local network via mDNS
4. User pairs with the bridge in the Home app using the setup code
5. Home app discovers all child accessories through the bridge
6. When the user reads state or sends commands, HAP-NodeJS routes to the appropriate plugin
7. Plugins translate between HomeKit and the actual device API

### Could Above Deck's Go Server Replace Homebridge?

Yes, using **brutella/hap** (Go HAP implementation):

```go
// Conceptual: exposing cabin temperature to HomeKit
bridge := accessory.NewBridge(accessory.Info{Name: "Above Deck"})

cabinTemp := accessory.NewTemperatureSensor(accessory.Info{
    Name: "Cabin Temperature",
})
cabinTemp.TempSensor.CurrentTemperature.SetValue(22.5)

server, _ := hap.NewServer(hap.NewFsStore("./db"), bridge.A, cabinTemp.A)
server.ListenAndServe(ctx)
```

This would make cabin temperature appear in Apple Home. But it only covers HomeKit — not Google Home or Alexa. The same effort invested in a Matter bridge covers all three.

### Recommendation: Matter Over HAP

| Factor | HAP (brutella/hap) | Matter |
|--------|-------------------|--------|
| Ecosystem coverage | Apple HomeKit only | HomeKit + Google Home + Alexa + SmartThings + HA |
| Go library maturity | Mature (brutella/hap) | Early (gomat, custom implementation) |
| Implementation effort | Lower | Higher |
| Standards body | Apple proprietary (MFi for commercial) | Open standard (CSA) |
| Future-proofing | Apple may deprecate HAP in favour of Matter | Industry standard, growing |
| Commercial licensing | MFi required for commercial HAP devices | No licensing required |

**Verdict:** Matter is the right investment. HAP via brutella/hap is a viable fallback if Matter implementation takes too long, but it should not be the primary strategy.

---

## Part 7: Home Assistant Integration

### Home Assistant as an Alternative Hub

Many sailors already run Home Assistant (often on the same Raspberry Pi as SignalK). For these users, Above Deck should integrate with HA rather than replace it.

### Integration Architecture: MQTT Bridge

```
Above Deck Go Server
    │
    ├── MQTT publish: above-deck/cabin/temperature → 22.5
    ├── MQTT publish: above-deck/bilge/aft/status → "dry"
    ├── MQTT publish: above-deck/battery/house/soc → 78
    ├── MQTT publish: above-deck/solar/production → 450
    │
    └── MQTT subscribe: above-deck/lighting/cabin/set → on/off
                         above-deck/lighting/nav/set → on/off

Home Assistant
    │
    ├── MQTT integration (auto-discovers Above Deck topics)
    ├── Exposes to HomeKit (via HomeKit Bridge integration)
    ├── Exposes to Google Home (via Nabu Casa / manual)
    ├── Exposes to Alexa (via Nabu Casa / manual)
    └── Exposes as Matter devices (via Matterbridge add-on)
```

**MQTT auto-discovery:** Home Assistant supports MQTT auto-discovery. If Above Deck publishes device configuration in the correct format on `homeassistant/sensor/...` topics, HA will automatically create entities for all boat systems — zero manual configuration for the sailor.

### BBN OS Precedent

BBN OS (Bareboat Necessities) already bridges SignalK to Home Assistant via MQTT:

1. SignalK reads NMEA 0183/2000 data from the boat network
2. signalk-mqtt-bridge plugin publishes SignalK paths as MQTT topics
3. Mosquitto MQTT broker runs locally
4. Home Assistant subscribes to MQTT topics
5. Home Assistant exposes boat data to HomeKit/Google/Alexa

This proves the pattern works. Above Deck improves on it by:
- Publishing MQTT directly from the Go server (no SignalK dependency)
- Using MQTT auto-discovery format (zero config in HA)
- Exposing a richer data set (Matter sensors + NMEA + Victron in one stream)

### Matterbridge

**Matterbridge** is a Node.js-based Matter bridge plugin manager. It can expose Home Assistant entities, Zigbee2MQTT devices, Shelly devices, and more as Matter accessories. Runs on devices with as little as 512MB RAM.

If Above Deck publishes via MQTT, Matterbridge can pick up those topics and expose them as Matter devices — without Above Deck implementing Matter itself. This is a lower-effort alternative:

```
Above Deck Go Server → MQTT → Matterbridge → Matter → HomeKit/Google/Alexa
```

The downside: adds a Node.js dependency (Matterbridge). The upside: works today, proven, and buys time to build the native Go Matter bridge.

---

## Part 8: Voice Control Opportunities

### Voice Assistants via Smart Home Ecosystems

If Above Deck exposes boat systems as Matter devices, voice control comes for free:

| Voice Assistant | Trigger | Example | Requires |
|----------------|---------|---------|----------|
| Siri | "Hey Siri, ..." | "Hey Siri, what's the cabin temperature?" | HomePod or iPhone on boat WiFi |
| Google Assistant | "Hey Google, ..." | "Hey Google, turn off the cabin lights" | Nest speaker/hub on boat WiFi |
| Alexa | "Alexa, ..." | "Alexa, what's the battery level?" | Echo device on boat WiFi |

**Requirements:** A smart home hub device on the boat's local network, and internet connectivity for cloud-based voice processing (Siri, Google, Alexa all require internet for speech recognition).

### Offline Voice: The d3kOS Approach

d3kOS implements a fully offline voice pipeline:

```
Microphone (16kHz)
    → PocketSphinx (wake word "Helm") — <500ms
    → Vosk (speech-to-text) — <1s
    → Phi-2 via llama.cpp (AI reasoning) — <1s
    → Piper (text-to-speech) — <500ms
    → Speaker output
```

**Total latency:** ~2-3 seconds from wake word to spoken response. All processing on a Raspberry Pi 4, no internet required.

### Which Approach is Better for Boats?

| Factor | Cloud Voice (Siri/Google/Alexa) | Offline Voice (Vosk/Piper) |
|--------|:-------------------------------:|:--------------------------:|
| Internet required | Yes | No |
| Works offshore | No | Yes |
| Works at dock (with WiFi) | Yes | Yes |
| Setup complexity | Low (consumer hardware) | High (Raspberry Pi + configuration) |
| Voice recognition quality | Excellent | Good (improving, language-dependent) |
| Ecosystem integration | Native (controls all smart home) | Custom (Above Deck commands only) |
| Hardware cost | $50-150 (smart speaker) | $10-30 (USB microphone + speaker) |
| Maintenance | Zero (cloud-managed) | Self-managed (model updates) |
| Privacy | Voice sent to cloud | Fully local |

**Recommendation for Above Deck:**

- **Priority 1 (docked):** Matter bridge enables Siri/Google/Alexa voice for free. Most sailors have a smart speaker. Zero development effort for voice — it comes with the smart home integration.
- **Priority 2 (offshore):** Investigate offline voice as a future feature. The d3kOS pattern (Vosk + Piper) is proven on Pi hardware. This would be a Go service wrapping Vosk's C library or using its gRPC/WebSocket API.
- **Do not build both simultaneously.** Matter bridge first. Offline voice is a separate, later project.

---

## Part 9: Recommendations for Above Deck

### Priority 1: Matter Bridge in Go Server

**What:** The Go server exposes boat systems (NMEA, Victron, Matter sensors) as a Matter bridge device on the local network.

**Why:** One implementation gives access to HomeKit, Google Home, Alexa, SmartThings, and Home Assistant simultaneously. Multi-admin means a single bridge can be paired with all ecosystems at once.

**Implementation path:**
1. Use `gomat` (github.com/tom-code/gomat) as reference for Matter protocol in Go
2. Implement bridge device type with relevant clusters (Temperature, Humidity, Contact Sensor, On/Off, Power Source, Electrical Measurement)
3. Test against `connectedhomeip` virtual devices in CI
4. Commission to Apple Home, Google Home, and Alexa for end-to-end validation

**Estimated scope:** 3,000-5,000 lines of Go (see [Matter Protocol research](./matter-protocol-iot-integration.md) for detailed breakdown).

### Priority 2: MQTT for Home Assistant Integration

**What:** Publish boat data as MQTT topics with Home Assistant auto-discovery format.

**Why:** Cheap, proven, works today. Many sailors already run Home Assistant. MQTT auto-discovery means zero configuration in HA. Through HA's existing bridges, boat data reaches HomeKit/Google/Alexa even before the native Matter bridge is built.

**Implementation effort:** Low. Add MQTT publish to existing adapters. Format messages per HA MQTT discovery spec.

**Timeline advantage:** Can ship immediately while Matter bridge is in development. Sailors with Home Assistant get smart home integration from day one.

### Priority 3: HAP via brutella/hap (Fallback)

**What:** If Matter implementation timeline is too long, use brutella/hap to expose boat systems directly to HomeKit.

**Why:** Mature Go library, well-documented, Apache 2.0 license. Gets HomeKit working quickly.

**Limitation:** Only covers Apple HomeKit. Would need separate integrations for Google Home and Alexa.

**When to trigger:** If Matter bridge is more than 6 months away from shipping and users are requesting HomeKit integration.

### PWA Strategy: Unchanged

The PWA remains the primary user interface. Smart home integration happens entirely through the Go server. The PWA does not need to interact with HomeKit, Google Home, or Alexa — it connects to the same Go server that the Matter bridge connects to.

```
User at the helm:     PWA → WebSocket → Go Server → Instruments
User on the couch:    Apple Home → Matter → Go Server → Instruments
User asks Siri:       Siri → HomeKit → Matter → Go Server → Instruments
User abroad:          Apple Home (remote) → iCloud → HomePod → Matter → Go Server
```

All paths lead to the same Go server and the same data model. The PWA and smart home ecosystems are parallel access methods, not competing approaches.

### Implementation Roadmap

| Phase | Deliverable | Effort | Prerequisite |
|-------|------------|--------|-------------|
| 1 | MQTT publish with HA auto-discovery | 1-2 weeks | MQTT adapter in Go server |
| 2 | Matter controller (inbound — read sensors) | 4-6 weeks | Go Matter protocol implementation |
| 3 | Matter bridge (outbound — expose to ecosystems) | 4-6 weeks | Phase 2 controller working |
| 4 | Multi-admin commissioning (all ecosystems) | 2-3 weeks | Phase 3 bridge working |
| 5 | HAP fallback via brutella/hap (if needed) | 2-3 weeks | Only if Phase 3 is delayed |
| 6 | Offline voice (Vosk + Piper) | 6-8 weeks | Independent of other phases |

### Summary Decision Matrix

| Integration | Covers | Effort | Internet | Recommendation |
|-------------|--------|--------|----------|---------------|
| Matter bridge (Go) | HomeKit + Google + Alexa + SmartThings + HA | High | No (local) | Primary strategy |
| MQTT → Home Assistant | HomeKit + Google + Alexa (via HA bridges) | Low | No (local) | Ship first, bridge to Matter |
| HAP via brutella/hap | HomeKit only | Medium | No (local) | Fallback if Matter is delayed |
| Google Home REST API | Google Home only | Medium | Yes (cloud) | Not recommended |
| Alexa Smart Home Skill | Alexa only | Medium | Yes (cloud) | Not recommended |
| Capacitor + HomeKit | HomeKit only (iOS native) | High | No | Not recommended (native lock-in) |
| Matterbridge (Node.js) | All via Matter | Low | No (local) | Alternative if avoiding Go Matter |

---

## Sources

### Apple HomeKit / HAP
- [HomeKit Communication Security — Apple Support](https://support.apple.com/guide/security/communication-security-sec3a881ccb1/web)
- [Complete HomeKit Guide — LinkdHome](https://linkdhome.com/articles/complete-homekit-guide)
- [brutella/hap — Go HAP Implementation](https://github.com/brutella/hap)
- [HAP-NodeJS — Homebridge Wiki](https://github.com/homebridge/HAP-NodeJS/wiki/HomeKit-Terminology)
- [HAP-NodeJS GitHub](https://github.com/homebridge/HAP-NodeJS)
- [Homebridge — Add Any Device to HomeKit](https://www.addtohomekit.com/blog/homebridge/)
- [HomeKit API — Apple Developer](https://developer.apple.com/documentation/homekit)

### Google Home
- [Google Home APIs — Developer Documentation](https://developers.home.google.com/apis)
- [Build the Future of Home with Google Home APIs — Google Blog](https://developers.googleblog.com/en/build-the-future-of-home-with-google-home-apis/)
- [Home APIs: Enabling All Developers — Google Blog](https://developers.googleblog.com/en/home-apis-enabling-all-developers-to-build-for-the-home/)
- [Matter on Google Home — Developer Documentation](https://developers.home.google.com/matter)
- [HomeGraph REST API — Google](https://developers.home.google.com/reference/home-graph/rest)
- [Google Home 2026 Setup Guide — OnOff.gr](https://www.onoff.gr/blog/en/smart-home/google-home-2026-complete-setup-guide/)

### Amazon Alexa
- [Connect Your Device to Alexa with Matter — Alexa Developer](https://developer.amazon.com/en-US/docs/alexa/smarthome/matter-support.html)
- [Build Matter with Alexa — Amazon Developer](https://developer.amazon.com/en-US/alexa/matter)
- [Alexa Smart Home Development Options](https://developer.amazon.com/en-US/docs/alexa/smarthome/development-options.html)
- [Amazon Enhanced Device Development with ESP32-C6](https://developer.amazon.com/en-US/blogs/alexa/device-makers/2026/03/enhanced-device-development-capabilities)

### Samsung SmartThings
- [SmartThings x Matter Integration — SmartThings Support](https://support.smartthings.com/hc/en-us/articles/11219700390804-SmartThings-x-Matter-Integration)
- [Connect Matter Devices with SmartThings](https://partners.smartthings.com/matter)
- [SmartThings First to Support Matter 1.5 — matter-smarthome.de](https://matter-smarthome.de/en/products/smartthings-is-the-first-platform-to-support-matter-1-5/)

### Home Assistant
- [Home Assistant Matter Integration](https://www.home-assistant.io/integrations/matter/)
- [Home Assistant HomeKit Bridge Integration](https://www.home-assistant.io/integrations/homekit/)
- [Home Assistant Alexa Smart Home](https://www.home-assistant.io/integrations/alexa.smart_home/)
- [Expose HA Devices via Matter Hub — SmartHomeScene](https://smarthomescene.com/guides/exposing-home-assistant-entities-as-matter-devices/)
- [Home Assistant Matter Hub — GitHub](https://github.com/t0bst4r/home-assistant-matter-hub)

### Matter Protocol
- [Matter Multi-Admin — CSA-IOT](https://csa-iot.org/newsroom/matter-multi-admin/)
- [Matter Multi-Admin Guide — Matter Alpha](https://www.matteralpha.com/how-to/matter-multi-admin-share-devices-across-ecosystems)
- [Multi-Admin Sharing — Silicon Labs](https://docs.silabs.com/matter/latest/matter-ecosystems/multicontroller-ecosystem)
- [What is a Matter Controller — matter-smarthome.de](https://matter-smarthome.de/en/know-how/what-is-a-matter-controller/)

### Matterbridge
- [Matterbridge — Matter Plugin Manager](https://matterbridge.io/)
- [Matterbridge GitHub](https://github.com/Luligu/matterbridge)
- [4 Reasons Matterbridge is the Best HA Add-on — XDA](https://www.xda-developers.com/matterbridge-best-home-assistant-add-on/)

### Marine / BBN OS
- [BBN Marine OS — Bareboat Necessities](https://bareboat-necessities.wixsite.com/my-bareboat)
- [Bridging SignalK and Home Assistant via MQTT — HA Community](https://community.home-assistant.io/t/bridging-signalk-server-nmea-and-home-assistant-using-signalk-mqtt-bridge-and-mosquitto-mqtt/642640)
- [NMEA 0183 to Home Assistant — Smart Boat Innovations](https://smartboatinnovations.com/nmea-0183-home-assistant-wifi-signal-k-serial/)
- [d3kOS GitHub](https://github.com/SkipperDon/d3kOS)

### PWA Limitations
- [PWA iOS Limitations and Safari Support 2026 — MagicBell](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [PWAs on iOS 2025 — Medium](https://ravi6997.medium.com/pwas-on-ios-in-2025-why-your-web-app-might-beat-native-0b1c35acf845)
- [Web Bluetooth Browser Support — BeaconZone](https://www.beaconzone.co.uk/blog/browser-support-for-web-bluetooth/)
- [Capacitor Documentation](https://capacitorjs.com/docs/ios)

### Voice / Offline
- [Vosk Offline Speech Recognition API](https://alphacephei.com/vosk/)
- [Piper TTS Offline on Raspberry Pi — rmauro.dev](https://rmauro.dev/how-to-run-piper-tts-on-your-raspberry-pi-offline-voice-zero-internet-needed/)
- [Faster Local Voice AI — GitHub](https://github.com/m15-ai/Faster-Local-Voice-AI)
