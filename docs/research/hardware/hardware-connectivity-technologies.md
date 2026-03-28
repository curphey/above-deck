# Hardware & Connectivity Technologies for Above Deck

**Date:** 2026-03-20
**Status:** Research complete
**Related:** [Matter Protocol Research](./matter-protocol-iot-integration.md)

---

## Executive Summary

Beyond Matter/Thread (covered in separate research doc), several technologies are relevant to Above Deck's hardware connectivity story. This document covers: Raspberry Pi marine hardware, ESP32 gateways, LoRa/Meshtastic for long-range communication, Web APIs for browser-direct hardware access, the existing open-source marine ecosystem, and iPad/tablet deployment as MFD displays.

---

## 1. Raspberry Pi as the Platform Hardware

### Why It Matters

Above Deck's Docker deployment needs to run on something. The Raspberry Pi is the de facto standard for open-source marine computers, with a mature ecosystem of marine-specific HATs.

### Key Hardware

| Product | Price | Features | Notes |
|---------|-------|----------|-------|
| **PICAN-M HAT** | ~$99 | NMEA 0183 (RS-422) + NMEA 2000 (CAN bus via MCP2515) + Qwiic I2C + 3A PSU from 12V | The standard. Powers Pi directly from boat 12V |
| **MacArthur HAT** (OpenMarine) | ~$80 | NMEA 0183 + NMEA 2000 + SeaTalk1 + SignalK | Multi-protocol. Sold by Wegmatt |
| **HALPI2** | ~$300+ | Raspberry Pi CM5 in waterproof aluminium enclosure. HDMI, NMEA 2000, NMEA 0183, Ethernet, 2x USB 3.0, external WiFi/BT antenna | Ruggedised, production-ready. Reviewed by Hackaday (Sept 2025) |

### Above Deck Fit

The Go server runs on a Raspberry Pi with a PICAN-M or MacArthur HAT. This gives direct NMEA 0183/2000 access via SocketCAN (Linux kernel CAN interface) — no middleware needed. The Pi also provides WiFi for the local network, USB for Victron VE.Direct, and GPIO/I2C for additional sensors.

**Recommended reference hardware:** Raspberry Pi 5 + PICAN-M HAT in a waterproof enclosure. The HALPI2 is the premium option for those who want turnkey.

### References

- [PICAN-M HAT — Copperhill Tech](https://copperhilltech.com/pican-m-nmea-0183-nmea-2000-hat-for-raspberry-pi/)
- [MacArthur HAT — Wegmatt](https://shop.wegmatt.com/products/openmarine-macarthur-hat)
- [HALPI2 Ruggedised Pi — Hackaday](https://hackaday.com/2025/09/20/a-ruggedized-raspberry-pi-for-sailors/)
- [NMEA 2000 Powered Raspberry Pi — Seabits](https://seabits.com/nmea-2000-powered-raspberry-pi/)

---

## 2. ESP32 as NMEA Gateway & Sensor Platform

### Why It Matters

ESP32 boards are the bridge between marine protocols and WiFi/IP networks. They're cheap (~$5-15), have built-in CAN bus (for NMEA 2000), WiFi, BLE, and now Thread (ESP32-C6/H2).

### Key Projects

| Project | What It Does | Notes |
|---------|-------------|-------|
| **esp32-nmea2000** (wellenvogel) | NMEA 2000 ↔ WiFi gateway. Reads CAN bus, serves NMEA 0183 over TCP | Active, well-documented. Runs on M5 Atom CAN (~$15) |
| **NMEA2000WifiGateway** (AK-Homberger) | NMEA 2000 WiFi gateway with voltage/temp alarms | Popular reference implementation |
| **SensESP** (HatLabs) | ESP32 sensor framework for SignalK. Turns any sensor into a SignalK data source over WiFi | Very active. Supports temp, pressure, flow, tank level sensors |
| **Smart2000 ESP** | Wireless NMEA 2000 bridge — keeps CAN bus physically separate from the Pi | Solves the wiring problem on larger boats |
| **ESP32 Networked Boat** | ESP32-S3 gateway + sensor nodes for wireless NMEA 0183 distribution | Multi-node architecture |

### Above Deck Fit

ESP32 boards serve multiple roles:

1. **NMEA 2000 WiFi gateway** — sits on the CAN bus, streams data to the Go server over WiFi. No need for the Pi to be physically near the instruments
2. **DIY sensor nodes** — temperature, tank level, bilge float. Currently planned via MQTT; could migrate to Matter (ESP32-C6 supports Thread/Matter)
3. **Thread border router** — ESP32-C6/H2 bridges the Thread mesh to WiFi for Matter sensors
4. **Wireless NMEA bridge** — for boats where running a cable from instruments to the Pi is impractical

**Key insight:** The ESP32-C6 is the Swiss Army knife here — it does WiFi, BLE, Thread, and Matter all in one chip (~$5). A single ESP32-C6 on the boat could serve as both NMEA WiFi gateway (with CAN transceiver) and Thread border router.

### References

- [ESP32 NMEA 2000 Gateway — open-boat-projects](https://open-boat-projects.org/en/nmea2000-and-esp32/)
- [esp32-nmea2000 — GitHub](https://github.com/wellenvogel/esp32-nmea2000)
- [NMEA2000WifiGateway — GitHub](https://github.com/AK-Homberger/NMEA2000WifiGateway-with-ESP32)
- [ESP32 CAN Bus Board — Copperhill](https://copperhilltech.com/blog/unlock-the-future-of-marine-apps-with-the-esp32s3-can-bus-board-with-nmea-2000-connector/)

---

## 3. LoRa / Meshtastic — Long-Range Off-Grid Communication

### Why It Matters

This is the technology that lets you monitor your boat from shore — anchor alarm, bilge alert, temperature — without cellular or WiFi, at ranges of 1-8+ km.

### How It Works

Meshtastic is an open-source mesh network built on LoRa (Long Range) radio. Devices form a self-healing mesh where messages hop between nodes. No infrastructure required — no cell towers, no internet, no subscriptions.

### Marine Use Cases

| Use Case | How It Works | Range |
|----------|-------------|-------|
| **Anchor drag alarm** | Boat node transmits GPS position. Shore node alerts if position drifts beyond threshold | 1-8+ km |
| **Bilge alarm** | SignalK alert transmitted to crew Meshtastic devices. Devices vibrate on alert | 1-8+ km |
| **MOB beacon** | Crew SenseCAP devices detected. Alert if signal lost | Line of sight |
| **Boat-to-boat messaging** | Text messages between vessels in an anchorage | 1-8+ km, further with mesh |
| **Shore monitoring** | Wind speed, temperature, battery voltage, position history from shore | 1-8+ km |
| **Marina mesh** | Multiple boats create a mesh network across an anchorage or marina | Extends range via hopping |

### Hardware

- **Boat node:** Heltec V3.2 (~$20-30), powered from 12V, connected to the boat's WiFi
- **Crew node:** SenseCAP T1000-e (~$40), waterproof, GPS-enabled, wearable
- **Solar buoy nodes:** DIY solar-powered Meshtastic relays for permanent anchorage coverage

### SignalK Integration (Existing)

The `signalk-meshtastic` plugin already exists:
- Transmits vessel telemetry (position, wind, temp, battery) over Meshtastic
- Sends SignalK alerts (bilge, anchor drag, MOB) to crew devices
- Position history shows anchor swing pattern
- Supports TCP and Serial connections to Meshtastic hardware

### Above Deck Fit

**This is a strong candidate for a protocol adapter.** The Go server could integrate with Meshtastic via:
- Serial connection to a Meshtastic device on the boat
- The Meshtastic HTTP/BLE API
- A dedicated Go Meshtastic library (the protocol is well-documented)

Key scenarios:
1. **Anchor watch alerts to shore** — crew at a restaurant gets anchor drag alert on their phone/watch
2. **Boat monitoring from shore** — check battery, bilge, cabin temp without going back to the boat
3. **Fleet communication** — cruising rally boats share positions and messages without cellular
4. **Emergency backup** — when all other communication fails, LoRa still works

**This fills a gap that Matter/Thread/WiFi cannot** — they're all short range (10-50m). LoRa reaches kilometres. For a sailor at anchor who goes ashore, LoRa is the technology that keeps them connected to the boat.

### References

- [SignalK + Meshtastic Integration](https://signalk.org/2025/signalk-meshtastic/)
- [signalk-meshtastic Plugin — GitHub](https://github.com/meri-imperiumi/signalk-meshtastic)
- [Off-Grid Boat Communications — NoForeignLand](https://blog.noforeignland.com/off-grid-boat-communications-with-meshtastic/)
- [LoRa for Sailboat Communication — Medium](https://mulitfariousguy.medium.com/beyond-the-grid-lora-for-sailboat-communication-6544db8e18b4)
- [LoRa Boat Monitor — open-boat-projects](https://open-boat-projects.org/en/lora-bootsmonitor/)

---

## 4. Web APIs — Browser-Direct Hardware Access

### Why It Matters

Above Deck's tools run as a PWA in the browser. Modern browser APIs can talk directly to hardware — potentially eliminating the need for the Go server in simple setups.

### Available APIs

| API | What It Does | Browser Support | Marine Use |
|-----|-------------|-----------------|------------|
| **Web Serial** | Read/write serial ports directly from JavaScript | Chrome, Edge (not Firefox/Safari) | NMEA 0183 via USB-serial adapter |
| **Web Bluetooth** | Connect to BLE GATT devices from the browser | Chrome, Edge (partial Safari) | Victron BLE, Ruuvi sensors, BLE wind instruments |
| **Web USB** | Direct USB device access | Chrome, Edge (not Firefox/Safari) | USB instruments, CAN adapters |

### Web Serial + NMEA 0183

This is the most immediately useful. A sailor with:
- A phone/tablet running the Above Deck PWA
- A USB OTG cable
- A USB-to-RS422 adapter (~$15)

...could read NMEA 0183 data directly in the browser. No server needed. The PWA parses NMEA sentences in JavaScript and displays instrument data.

```
┌──────────────┐    USB OTG    ┌──────────────┐    RS-422    ┌──────────────┐
│  iPad/Phone  │──────────────▶│  USB-RS422   │────────────▶│ NMEA 0183    │
│  PWA Browser │◀──────────────│  Adapter     │◀────────────│ Instruments  │
│  Web Serial  │               │  (~$15)      │             │              │
└──────────────┘               └──────────────┘             └──────────────┘
```

### Web Bluetooth + Victron BLE

Victron's SmartSolar, SmartShunt, etc. broadcast data over BLE. Web Bluetooth could read this directly in the browser — battery state, solar production, charge state — without a server.

### Limitations

- **No Firefox or Safari support** for Web Serial/USB — this means no iOS Safari. iPads would need to use a Chromium-based browser
- **No CAN bus** (NMEA 2000) via web APIs — CAN requires kernel-level SocketCAN, needs the Go server
- **Permission model** — user must grant access each time (good for security, annoying for always-on marine use)
- **No background processing** — browser must be in foreground to maintain connection

### Above Deck Fit

Web APIs are a **progressive enhancement**, not a replacement for the Go server:

- **Standalone mode:** Sailor with a phone and a USB adapter gets basic NMEA 0183 instruments. No Pi, no server, no Docker. This is the "tools work alone" principle at its most extreme
- **Enhanced mode:** Go server handles NMEA 2000, Victron, Matter, Meshtastic, persistent logging, AI. The PWA gets data from the server instead
- **Hybrid:** Web Bluetooth reads nearby Victron devices directly. The server handles everything else

This dramatically lowers the barrier to entry. A sailor can try Above Deck with zero hardware investment — just open the PWA and plug in a USB cable.

### References

- [Web Serial API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API)
- [Web Serial Guide — Chrome Developers](https://developer.chrome.com/docs/capabilities/serial)
- [NMEA 0183 JavaScript Parser](https://github.com/101100/nmea-simple)
- [PWA Serial Port Capabilities](https://progressier.com/pwa-capabilities/serial-port-desktop)

---

## 5. Existing Open-Source Marine Ecosystem

### Key Projects to Be Aware Of

| Project | What It Is | Tech Stack | Relevance |
|---------|-----------|-----------|-----------|
| **OpenPlotter** | Full marine OS for Raspberry Pi. Chartplotter, dashboards, instruments | Linux + SignalK + OpenCPN + Node.js | The incumbent. What Above Deck aims to surpass in UX/architecture |
| **Bareboat Necessities (BBN) OS** | Alternative marine OS. Integrates SignalK, PyPilot, OpenCPN | Linux + SignalK + Python | More DIY-focused, active community |
| **OpenCPN** | Desktop chartplotter | C++ / wxWidgets | The standard open-source chartplotter. Desktop-era UX |
| **PyPilot** | Open-source autopilot | Python + Arduino | Impressive project — actual autopilot from a Pi |
| **SensESP** | ESP32 sensor framework for SignalK | C++ (Arduino) | Turns any sensor into a marine data source |
| **open-boat-projects.org** | German community hub for open marine projects | Various | Active community, good hardware guides |
| **KBox** | NMEA 2000/0183 gateway + WiFi + sensors in one device | ESP32 | Integrated hardware solution |

### Lessons from the Ecosystem

1. **SignalK is the lingua franca** — nearly every open-source marine project speaks SignalK. Above Deck's SignalK adapter isn't optional — it's how you interoperate with the existing ecosystem
2. **Node.js fatigue is real** — SignalK server, OpenPlotter plugins, Meshtastic integration — all Node.js. There's a real appetite for something that isn't Node-based
3. **UX is the gap** — the open-source marine tools work but look like 2005. OpenCPN uses wxWidgets. SignalK dashboards are functional but not beautiful. This is Above Deck's primary differentiator
4. **Hardware is solved** — you don't need to build hardware. PICAN-M, ESP32 gateways, Meshtastic devices — the ecosystem has this covered. Focus on software
5. **Community is small but passionate** — open-boat-projects.org, SignalK GitHub, cruiser forums. These people will find Above Deck

### References

- [OpenPlotter](https://copperhilltech.com/blog/turn-your-raspberry-pi-into-a-smart-marine-hub-with-openplotter-and-signal-k-fd742f/)
- [Bareboat Necessities OS](https://bareboat-necessities.github.io/my-bareboat/)
- [BBN OS GitHub](https://github.com/bareboat-necessities/lysmarine_gen)
- [open-boat-projects.org](https://open-boat-projects.org/en/)
- [SensESP — HatLabs](https://signalk.org/SensESP/)

---

## 6. iPad/Tablet as MFD Display

### Why It Matters

Above Deck already renders inside an MFD device frame. The natural deployment is an iPad or Android tablet mounted at the helm or nav station, running the PWA.

### Deployment Model

```
┌─────────────────────────────────────────────┐
│              Boat Network (WiFi)            │
│                                             │
│  ┌──────────┐    ┌──────────┐   ┌────────┐ │
│  │ Helm iPad│    │ Nav iPad │   │ Phone  │ │
│  │ (PWA)    │    │ (PWA)    │   │ (PWA)  │ │
│  └────┬─────┘    └────┬─────┘   └───┬────┘ │
│       │               │             │       │
│       └───────────┬───┘─────────────┘       │
│                   │                         │
│          ┌────────┴─────────┐               │
│          │ Raspberry Pi     │               │
│          │ + PICAN-M HAT    │               │
│          │ Go Server        │               │
│          │ (Docker)         │               │
│          └──────────────────┘               │
│                   │                         │
│          ┌────────┴─────────┐               │
│          │ NMEA 2000 Bus    │               │
│          │ Victron Cerbo    │               │
│          │ Matter Sensors   │               │
│          │ Meshtastic Node  │               │
│          └──────────────────┘               │
└─────────────────────────────────────────────┘
```

### iPad Considerations

- **PWA on Safari:** Full-screen, home screen installable. No App Store needed
- **iPadOS 16+ Stage Manager:** Multiple Above Deck windows side by side on external display
- **USB-C:** iPad Pro/Air can drive an external monitor via USB-C. Run the PWA on a mounted waterproof display while the iPad stays protected
- **Offline:** Service worker caches the PWA. Works without internet. Only needs the local boat WiFi to reach the Pi
- **Multi-display:** Different iPads can show different MFD screens — chartplotter at helm, instruments at nav station, energy dashboard in the salon

### Waterproof Mounting

Sailors already mount iPads in waterproof cases at the helm. Products like the Scanstrut ROKK series, Ram Mounts, and Lifeproof cases are established solutions. No need to reinvent this.

### Android Tablets

Cheaper alternative. Chromium-based browsers support Web Serial and Web Bluetooth — potentially more hardware access than Safari. Samsung Galaxy Tab Active series is ruggedised and waterproof.

---

## 7. Starlink — The Connectivity Game Changer

### Why It Matters

Starlink Maritime delivers 100-200 Mbps at 25-40ms latency anywhere at sea. This transforms what's possible for "connected" boat features.

### Above Deck Opportunities

| Feature | Without Starlink | With Starlink |
|---------|-----------------|---------------|
| Weather data | Cached/downloaded in port | Real-time GRIB, satellite imagery |
| Chart updates | Downloaded in port | Streaming vector tiles |
| Community data | Synced when connected | Real-time anchorage reviews, hazard reports |
| AI queries | Local model or cached | Full cloud AI reasoning |
| Remote monitoring | LoRa/Meshtastic only | Full web access to boat dashboard |
| Software updates | Manual in port | Automatic OTA |

### Integration Approach

Above Deck doesn't need to "integrate with Starlink" — it just needs to handle the transition between offline and online gracefully. The interesting Starlink-specific integration would be:

- **Bandwidth-aware sync:** When Starlink is connected, sync community data, download chart updates, upload logs. When it drops, seamlessly go offline
- **Starlink status in the data model:** Signal strength, uptime, data usage — useful for passage planning ("will I have Starlink coverage on this route?")
- **Gen3 gRPC API:** Starlink's developer API exposes dish telemetry, latency, and obstruction data. Could be a protocol adapter

### References

- [Starlink Maritime](https://starlink.com/maritime)
- [Starlink for Boats Guide](https://www.earthsims.com/starlink/starlink-for-boats/)
- [Starlink Developer API 2026](https://www.abhs.in/blog/starlink-for-developers-latency-api-use-cases-2026)

---

## 8. ZigBoat — Existing Marine IoT Product

Worth noting: **Glomex ZigBoat** is an existing commercial product that uses Zigbee sensors for boat monitoring (bilge, temperature, battery, door/hatch). It's wireless, cloudless, and purpose-built for marine use. This validates the market for IoT sensors on boats — and shows what Above Deck could do better with Matter (open standard, not proprietary Zigbee network).

### Reference

- [ZigBoat — Glomex](https://www.zigboat.com/)

---

## Technology Priority Matrix

Based on Above Deck's build order (Learning Tools → Sailing Tools → Platform) and the "tools work alone, together is better" principle:

| Technology | Priority | When | Why |
|-----------|----------|------|-----|
| **iPad PWA deployment** | Now | Already possible | Tools already render in MFD frame. Just needs PWA optimisation |
| **Web Serial (NMEA 0183)** | High | With chartplotter | Zero-install instrument data. Massive "try it" factor |
| **Web Bluetooth (Victron)** | High | With energy tools | Read solar/battery directly in browser. Enhances existing solar planner |
| **Raspberry Pi + PICAN-M** | High | With platform layer | The recommended deployment hardware |
| **ESP32 NMEA gateway** | High | With platform layer | Wireless NMEA bridge. Proven, cheap, well-documented |
| **Matter/Thread** | Medium | With boat management | Consumer sensors for cabin/bilge/lighting. See separate research doc |
| **Meshtastic/LoRa** | Medium | With anchor watch | Anchor alarm from shore. Killer feature for cruisers |
| **Starlink integration** | Low | With passage planner | Bandwidth-aware sync. Starlink status adapter |
| **ESP32-C6 Thread BR** | Low | After Matter controller | Thread border router for Matter sensor mesh |

---

## Open Questions

1. **Reference hardware bundle** — should Above Deck recommend a specific hardware kit (Pi 5 + PICAN-M + ESP32-C6 + Meshtastic node)?
2. **Web Serial on iOS** — Safari doesn't support Web Serial. Is this a dealbreaker for the "iPad at helm" use case, or does the Go server make it irrelevant?
3. **Meshtastic Go library** — does a Go implementation exist, or would this also need to be built?
4. **ESP32 firmware** — should Above Deck ship custom ESP32 firmware for its sensor nodes, or rely on existing projects (SensESP, Meshtastic)?
5. **Starlink API access** — is the gRPC API publicly documented and available?
