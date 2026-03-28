# Boat Systems Monitoring: Live Digital Monitoring of Physical Boat Systems

**Date:** 2026-03-24
**Status:** Research complete
**Related:** [Hardware & Connectivity Technologies](./hardware-connectivity-technologies.md), [Marine MFD Platforms](./marine-mfd-platforms-and-integrations.md), [Sailor Hardware Landscape](./sailor-hardware-landscape.md), [Smart Home & PWA Integration](./smart-home-and-pwa-integration.md)

---

## Executive Summary

This document covers the landscape of real-time digital monitoring and control of physical boat systems: power (batteries, solar, alternator, inverter, shore power), engines, fluid tanks, bilge, climate, lighting, and drive systems. It maps the data flow from physical sensors through marine data buses (NMEA 2000, Victron protocols) to software interfaces (SignalK, Victron VRM, commercial MFDs), and identifies the software opportunity for an open-source, cross-platform boat management dashboard.

The key insight: a progressive integration strategy is viable. Start with Victron VRM cloud API (no onboard hardware needed beyond existing Victron gear), add SignalK over local WiFi for onboard real-time data, and later support direct NMEA 2000 and BLE sensors. The Raymarine Axiom boat management screen (with its HOME, POWER, FLUIDS, LIGHTS, DRIVE, CLIMATE, SECURITY, BILGES categories) represents the target UX — but open source, cross-platform, and accessible from any browser.

---

## 1. What Systems Sailors Monitor

### 1.1 Power Systems

The most actively monitored system on any cruising boat. Sailors living off-grid need constant awareness of energy balance.

| Parameter | Why It Matters | Typical Range |
|-----------|---------------|---------------|
| Battery bank SOC (%) | Primary energy gauge — how much is left | 20-100% (never drain below 20% for lead-acid, 10% for LiFePO4) |
| Battery voltage (V) | Rough health indicator, critical for low-voltage alarms | 12.0-14.4V (12V system), 24.0-28.8V (24V) |
| Battery current (A) | Net flow: positive = charging, negative = discharging | -200A to +200A typical |
| Battery temperature (C) | Safety — lithium cells must not charge below 0C | 5-45C safe range |
| Solar input (W) | Real-time PV generation | 0-1500W typical cruising cat |
| Solar yield (kWh/day) | Daily harvest — key planning metric | 2-8 kWh typical |
| Alternator output (A) | Engine-driven charging contribution | 40-200A depending on alternator |
| Shore power status | Connected/disconnected, voltage, frequency | 110V/60Hz or 230V/50Hz |
| Inverter load (W) | AC consumption from battery | 0-3000W typical |
| Charger status | Bulk/Absorption/Float/Equalize stage | State enum |
| AC loads by circuit | Individual circuit consumption (fridge, watermaker, etc.) | 0-500W per circuit |

### 1.2 Engine Systems

Critical for passage safety. Engine failure offshore is a serious emergency.

| Parameter | NMEA 2000 PGN | Typical Range |
|-----------|---------------|---------------|
| RPM | 127488 (rapid update, 10Hz) | 600-3500 RPM |
| Oil pressure (kPa) | 127489 | 200-500 kPa normal |
| Coolant temperature (C) | 127489 | 70-95C normal, alarm >100C |
| Exhaust temperature (C) | 127489 | 200-500C typical diesel |
| Fuel consumption (L/hr) | 127489 | 2-20 L/hr depending on engine |
| Engine hours | 127489 | Running total |
| Transmission gear | 127493 | Forward/Neutral/Reverse |
| Transmission oil pressure | 127493 | Per manufacturer spec |
| Trim tab position | 127493 | Percentage |
| Alternator voltage | 127489 | 13.8-14.4V charging |

Engine data comes from the engine ECU via NMEA 2000 (modern engines) or requires an engine gateway device (older engines). Yacht Devices engine gateways (YDEG-04) bridge Volvo Penta, Mercury SmartCraft, MAN, and J1939 engine protocols to NMEA 2000.

### 1.3 Fluid Tanks

| Tank Type | NMEA 2000 PGN | What's Monitored |
|-----------|---------------|------------------|
| Fresh water | 127505 (Fluid Level) | Level (%), capacity (L), remaining volume |
| Fuel (diesel) | 127505 | Level (%), fuel remaining, consumption rate |
| Black water (sewage) | 127505 | Level (%) — alert when near full |
| Grey water | 127505 | Level (%) — auto-pump threshold |
| Watermaker output | Custom / flow sensor | L/hr production rate, total produced |

PGN 127505 carries fluid instance number, fluid type enum (fuel=0, water=1, greyWater=2, liveWell=3, oil=4, blackWater=5), level as percentage (0-100%), and tank capacity in litres. Most boats have 2-6 tanks of various types.

### 1.4 Bilge Systems

Bilge monitoring is a safety-critical system. Undetected water ingress can sink a boat.

| Parameter | How Measured | Alarm Threshold |
|-----------|-------------|-----------------|
| Bilge pump cycles | Float switch counter on NMEA 2000 digital input | >3 cycles/hr = investigate |
| Water detection | Capacitive or float sensor | Any detection = alert |
| High-water alarm | Secondary float switch mounted higher | Immediate alarm |
| Pump run time | Current clamp or relay monitoring | Continuous run >60s = alert |

Most cruising boats have 2-4 bilge compartments (forward, main, engine room, lazarettes). Monitoring pump activation frequency is the primary indicator — a pump cycling more than usual means water is entering somewhere.

### 1.5 Climate and Environment

| Parameter | Sensor Type | Typical Use |
|-----------|------------|-------------|
| Cabin temperature | BLE or NMEA 2000 temp sensor | Comfort, pet safety when crew is ashore |
| Cabin humidity | BLE sensor | Mould prevention (critical in tropics) |
| Refrigerator temperature | BLE or wired sensor | Food safety alarm (<0C or >5C) |
| Freezer temperature | BLE or wired sensor | Alert if >-15C |
| Engine room temperature | Wired sensor or BLE | Overheating / fire detection |
| Outside temperature | Masthead or cockpit sensor | Weather awareness |
| Barometric pressure | Built-in to many displays, BLE sensors | Weather forecasting |

### 1.6 Lighting and Digital Switching

| System | Control Type | Status Monitoring |
|--------|-------------|-------------------|
| Navigation lights (port/red, starboard/green, stern/white, masthead/white) | On/off, required by COLREGS | Bulb failure detection |
| Anchor light | On/off | Auto-on at sunset (common automation) |
| Interior zones (salon, cabins, galley, heads) | On/off, dimming | Current draw per circuit |
| Cockpit/deck lighting | On/off, dimming | Courtesy lights, spreader lights |
| Underwater lights | On/off, colour, intensity | Integration with MFD |

Digital switching systems (CZone, EmpirBus, YachtSense) replace traditional mechanical switches with NMEA 2000-controlled solid-state modules, enabling MFD and app control of every circuit.

### 1.7 Drive and Steering

| Parameter | Source | Purpose |
|-----------|--------|---------|
| Autopilot status | NMEA 2000 | Active/standby, mode (compass, wind, track) |
| Rudder angle | Rudder feedback sensor | Position confirmation, centering |
| Trim tab position | Tab actuator feedback | Hull attitude optimisation |
| Thruster status | NMEA 2000 digital switching | Bow/stern thruster active |

---

## 2. How Data Gets From Sensors to Software

### 2.1 The Marine Data Bus: NMEA 2000

NMEA 2000 is the standard marine data network, based on CAN bus technology (SAE J1939). It uses a single backbone cable with drop cables to each device, running at 250 kbps.

**Key PGNs for Boat Systems Monitoring:**

| PGN | Name | Data | Update Rate |
|-----|------|------|-------------|
| 127488 | Engine Parameters, Rapid Update | RPM, tilt/trim, boost pressure | 10 Hz |
| 127489 | Engine Parameters, Dynamic | Oil pressure, coolant temp, fuel rate, hours, exhaust temp | 1 Hz |
| 127493 | Transmission Parameters | Gear, oil pressure, oil temperature | 1 Hz |
| 127505 | Fluid Level | Tank type, instance, level %, capacity | 2.5 Hz |
| 127506 | DC Detailed Status | SOC, SOH, time remaining, ripple voltage | 1 Hz |
| 127508 | Battery Status | Voltage, current, temperature, instance | 1 Hz |
| 127751 | DC Current/Voltage | Bus voltage, current | 1 Hz |
| 130312 | Temperature | Source type (sea, cabin, engine room, etc.), temperature | 1 Hz |
| 130316 | Extended Temperature | High-resolution temperature, humidity | 1 Hz |
| 127501 | Binary Switch Status | Switch bank status, on/off per channel | On change |
| 127502 | Switch Control | Command a switch bank channel | On command |
| 126720 | Proprietary | Manufacturer-specific (CZone, EmpirBus control) | Varies |

**NMEA 2000 to software path:**
1. Sensors and devices transmit PGNs on the CAN bus backbone
2. A gateway device (Actisense NGT-1, Yacht Devices YDWG-02, or Raspberry Pi with PICAN-M HAT) reads the CAN bus
3. Gateway converts PGNs to either NMEA 0183 sentences or SignalK JSON
4. Software (chartplotter, SignalK server, or custom app) consumes the data

### 2.2 Victron Energy Protocols

Victron is the dominant power systems brand on cruising boats. Their products use three proprietary communication protocols:

**VE.Direct** — Point-to-point serial connection (TTL UART, 19200 baud). Used by MPPT solar charge controllers, BMV battery monitors, SmartShunt, Phoenix inverters. Simple text protocol with key-value pairs. Limited to ~10m cable length. Each device needs its own VE.Direct port or VE.Direct-to-USB adapter. The Cerbo GX has 3-4 VE.Direct ports built in.

**VE.Bus** — Proprietary multi-device bus over RJ45 CAT5/6 cable. Used by MultiPlus and Quattro inverter/chargers. Supports daisy-chaining multiple units for parallel or three-phase configurations. Higher bandwidth than VE.Direct. The Cerbo GX connects to VE.Bus via a dedicated port.

**VE.Can** — CAN bus protocol (J1939-based, like NMEA 2000). Used by larger MPPT controllers (SmartSolar 150/xx and above), Lynx Smart BMS, Lynx Shunt, and third-party compatible batteries. Daisy-chain topology with RJ45 connectors. Can coexist on the same physical bus as NMEA 2000 in some configurations, though Victron recommends separate networks.

**Data aggregation: the Cerbo GX (Venus OS)**

The Cerbo GX is Victron's central monitoring hub. It runs Venus OS (Linux-based) and aggregates data from all connected Victron devices:

```
[MPPT Solar] --VE.Direct--> [Cerbo GX] --WiFi/LAN--> [VRM Cloud]
[BMV/SmartShunt] --VE.Direct-->    |                        |
[MultiPlus] --VE.Bus-->            |                   [VRM Portal]
[Lynx BMS] --VE.Can-->            |                   [VRM API]
[Third-party BMS] --VE.Can-->     |
                                   +--MQTT--> [Local apps]
                                   +--Modbus TCP--> [PLCs, automation]
                                   +--NMEA 2000--> [Chartplotter]
```

### 2.3 BLE Sensors

Bluetooth Low Energy sensors provide an inexpensive, wireless path for environmental monitoring without NMEA 2000 wiring.

**Marine-specific BLE systems:**
- **ME SENSE (Weatherdock)** — Dedicated marine BLE sensor system. Temperature, humidity, pressure, bilge, battery voltage, shore power, GPS sensors. Data sent to ME SENSE RELAY hub, then to smartphone app. Button battery powered (~12 month life).
- **ZigBoat (Glomex)** — 100% wireless remote monitoring via BLE sensors + cellular gateway. Battery voltage, bilge, intrusion, temperature. No subscription fees. 3-5 year sensor battery life.
- **Siren Marine Siren 3 Pro** — Proprietary SirenWave wireless protocol (not standard BLE). Battery, high-water, temperature sensors. Cellular cloud connectivity. Up to 6 wireless sensors. Built-in NMEA 2000 gateway.
- **Victron Smart sensors** — Temperature sensors, SmartShunt, MPPT controllers all broadcast via BLE, readable by VictronConnect app and Cerbo GX.

**Generic BLE approach:**
Any standard BLE temperature/humidity beacon (Xiaomi Mijia, RuuviTag, SwitchBot, etc.) can be integrated via a gateway (Raspberry Pi, ESP32) running software that bridges BLE advertisements to MQTT or SignalK.

### 2.4 WiFi / IP Cameras

Engine room cameras and cockpit cameras are increasingly common for visual monitoring. Typically inexpensive WiFi cameras (Wyze, Tapo, Reolink) connected to the onboard network. Accessible via RTSP streams from any web interface. The Maretron N2KView system supports embedding camera feeds alongside instrument data.

### 2.5 GPIO / ESP32 DIY Sensors

The ESP32 microcontroller is the Swiss Army knife of DIY marine sensing:

- **SensESP** — The primary framework. ESP32 sensor toolkit built on Arduino/PlatformIO that publishes directly to SignalK over WiFi. Supports temperature (1-Wire DS18B20), tank level (resistive, capacitive, ultrasonic), bilge float switch, RPM (inductive pickup), pressure, current (CT clamp), and analog voltage. Well-documented, active community, newbie-friendly.
- **NMEA2000WifiGateway** — ESP32 with CAN transceiver reads NMEA 2000 backbone and serves data over WiFi as NMEA 0183 TCP. Eliminates the need for wired gateways.
- **esp32-nmea2000 (wellenvogel)** — Full NMEA 2000 gateway on an M5 Atom CAN ($15). Bidirectional.
- **Custom sensor nodes** — ESP32 + ADS1115 ADC reads multiple 4-20mA analog inputs from existing boat sensors (tank senders, pressure transducers, temperature probes). One notable project (caballero03/SignalK-SensESP-Boat-Systems-Monitor) reads 8 analog inputs plus bilge pump activity on a single SH-ESP32 board.

---

## 3. Existing Boat Monitoring Platforms

### 3.1 Victron VRM Portal

The most widely used boat monitoring platform, included free with every Victron GX device.

**What it shows:**
- Battery SOC, voltage, current, power, temperature
- Solar yield (daily, monthly, lifetime), PV voltage, PV power per MPPT tracker
- Inverter/charger state (bulk, absorption, float, inverting), AC input/output power
- AC loads, DC loads breakdown
- Generator runtime and fuel consumption
- Tank levels (when connected via NMEA 2000 or analog inputs)
- GPS position, geofencing
- Historical data with configurable time ranges (hourly, daily, monthly)
- Remote console (full Venus OS interface over the web)

**UX observations:**
- Dashboard is functional but dated. Widget-based layout. No drag-and-drop customisation.
- Excellent historical charts — good for trend analysis (e.g., "is my solar output declining?")
- Mobile app (VictronConnect) is separate from VRM Portal and focuses on device configuration rather than monitoring
- No lighting, climate, or digital switching integration — purely power-focused
- Alert system exists but is basic (email notifications for configurable thresholds)

**Strengths:** Free, reliable, excellent Victron device coverage, historical data, remote console.
**Weaknesses:** Power-only (no engines, tanks, climate, lighting), no customisation, no third-party integrations, dated UI.

### 3.2 Maretron N2KView

The professional-grade NMEA 2000 vessel monitoring software.

**What it shows:**
- Everything on the NMEA 2000 network: engines, tanks, batteries, navigation, weather, rudder, trim
- Fully user-configurable screens with drag-and-drop gauge placement
- Analog gauges, digital displays, graphic indicators, bar graphs, warning lights
- IP camera integration — engine room, cockpit, security
- Alert system with configurable warnings and alarms for any NMEA 2000 parameter
- Fuel management: distance/time to empty, fuel rate, economy
- Digital switching: control lights, pumps, other circuits on/off from N2KView

**Architecture:**
- Windows PC software (not web-based)
- Requires Maretron USB100 ($300) or IPG100 ($700) gateway to connect PC to NMEA 2000
- Software license: ~$695
- Also available as iOS/Android mobile app

**Strengths:** Comprehensive NMEA 2000 coverage, highly customisable, professional quality.
**Weaknesses:** Windows-only desktop app, expensive hardware + software, closed ecosystem, not accessible remotely without additional setup, no cloud component.

### 3.3 Simarine PICO

The most beautiful dedicated battery/tank monitor on the market.

**What it shows:**
- Battery SOC, voltage, current, power, temperature (up to 6 banks)
- Tank levels (up to 14 tanks) — fuel, water, waste
- Individual appliance consumption (fridge, lights, watermaker) via SCQ modules
- Solar and generator input power
- Inclinometer (pitch and roll)
- Built-in barograph with pressure trend history

**Hardware:**
- 3.5" IPS display, optically bonded, Gorilla Glass, IP67 aluminium case
- Modular system: PICO display + shunts (SC303/SC503) + tank modules (ST107) + load monitors (SCQ25/SCQ50)
- Up to 20 modules per system
- WiFi connectivity — free Simarine Mobile App for remote monitoring
- Can connect to internet via marina/camp WiFi router for remote access

**Strengths:** Beautiful hardware display, accurate shunt-based monitoring, modular, WiFi app.
**Weaknesses:** Completely standalone — no NMEA 2000 integration, no API for third-party access, no engine data, no digital switching. A beautiful island with no bridges.

### 3.4 CZone Digital Switching (Mastervolt / BEP / Navico)

The most widely installed digital switching system, especially in the US market.

**Architecture:**
- NMEA 2000-certified modules connected to the CAN bus backbone
- Digital output modules control circuits (lights, pumps, windlass, etc.)
- Digital input modules read switch panels, float switches, sensors
- Signal Interface modules read tank levels, temperature, pressure from analog sensors
- Control available from: MFD (Raymarine, Garmin, Simrad, B&G, Furuno), iPad app, CZone keyfob, dedicated CZone touchscreen

**Capabilities:**
- On/off control with dimming (including halogen)
- Built-in timers, voltage reducers, load shedding
- Automated responses: e.g., bilge pump activates on float switch, lights dim at anchor
- Tank level, battery voltage, temperature monitoring via analog inputs
- ABYC-compliant fusing with mechanical bypass for redundancy
- 9-32V system compatibility

**Integration:**
- CZone configuration files can be imported into Raymarine Axiom LightHouse OS
- Graphical control pages designed in Raymarine's CZone graphics tool
- Also integrates with Garmin OneHelm, Simrad, B&G, Furuno
- No open API — tightly coupled to MFD ecosystems

### 3.5 EmpirBus NXT Digital Switching

Originally a Swedish company, now part of Garmin. The primary digital switching system for Raymarine.

**Architecture:** Distributed NMEA 2000 modules similar to CZone. Individual IPX6 waterproof modules for different system types (lighting, pumps, windlass, climate, generators). Controlled via Raymarine Axiom MFD, smartphones, tablets, or programmable switch panels.

**Key difference from CZone:** EmpirBus was Raymarine-first (now Garmin-owned), while CZone is brand-agnostic. In practice, boats tend to have one or the other based on their MFD brand and marine electrician's preference.

### 3.6 Raymarine Axiom Boat Management Screen

The gold standard for integrated boat management UX. The Axiom running LightHouse OS with CZone or EmpirBus digital switching presents boat systems as categorised screens:

**Screen categories:**
- **HOME** — System overview dashboard
- **POWER** — Battery banks, shore power, solar, generator, charger status
- **FLUIDS** — Fresh water, fuel, black water, grey water tank levels
- **LIGHTS** — Navigation lights, interior zones, cockpit, underwater lights with dimming
- **DRIVE** — Autopilot, rudder, trim tabs, thruster
- **CLIMATE** — HVAC zones, refrigeration, freezer temperatures
- **SECURITY** — Door/hatch sensors, cameras, geofence
- **BILGES** — Pump status, water level per compartment

Each category shows a graphical representation of the boat with colour-coded status indicators. Tap-to-control for switching. This is a boat-shaped home automation interface.

**Limitations:**
- Only works on Raymarine Axiom hardware (minimum ~$1,500 for 9" display)
- Requires CZone or EmpirBus hardware ($2,000-$10,000+ depending on installation)
- Closed ecosystem — no third-party app development
- No remote access without YachtSense Link ($700+ cellular router)
- No historical data or trend analysis

### 3.7 Raymarine YachtSense Link

Raymarine's cloud connectivity solution.

**What it does:**
- Multi-purpose marine mobile router (WiFi + 4G cellular + Raynet Ethernet)
- 4 low-voltage digital switching/monitoring channels (control pumps, lights)
- GeoFence vessel monitoring (alerts if boat moves outside safety zone)
- Remote access to Axiom MFD network via Raymarine mobile app
- Dual SIM, automatic switching between marina WiFi and cellular
- Built-in GPS

**Limitations:** Only 4 monitoring channels (vs. full CZone systems with dozens), requires cellular subscription, limited to Raymarine ecosystem.

### 3.8 Siren Marine Siren 3 Pro

Purpose-built remote monitoring system for when the boat is unattended.

**Architecture:**
- Central cellular gateway with built-in GPS and NMEA 2000
- Up to 6 wireless sensors via proprietary SirenWave protocol
- Sensors: battery voltage, high-water/bilge, temperature, door/hatch
- Global 4G/5G LTE-M connectivity
- Free app (Siren Connected Boat) for monitoring and alerts
- Yamaha Command Link integration for engine data

**Use case:** Security and unattended monitoring, not real-time sailing instrumentation. Competes with Siren Marine are Glomex ZigBoat, Weatherdock ME SENSE, and Digital Yacht NjordLINK+.

### 3.9 Yacht Devices Products

Boutique NMEA 2000 hardware manufacturer from Ukraine. Notable products:

- **Text Display (YDTD-20)** — Small NMEA 2000 display that shows position, wind, depth, engine RPM, battery voltage, tank levels. With alternate firmware: monitors 4 engines, 4 batteries, 8 tanks.
- **Battery Monitor (YDBM-01)** — Shunt-based battery monitor that reports to NMEA 2000 (SOC, voltage, current, health). Can auto-start generator on low battery.
- **Tank Fluid Level Adapter (YDTA-04)** — Connects up to 4 existing resistive/voltage tank sensors to NMEA 2000.
- **Engine Gateway (YDEG-04)** — Bridges Volvo Penta, Mercury SmartCraft, MAN, J1939 engines to NMEA 2000.
- **Circuit Control / Switch Control** — NMEA 2000 digital switching modules.

**Relevance:** Yacht Devices products fill the gap between legacy equipment and modern NMEA 2000 networks. They enable monitoring of older engines and existing tank sensors on any NMEA 2000-equipped boat, which then becomes accessible via SignalK.

### 3.10 B&G / Navico Monitoring

B&G (sailing brand) and Simrad (power brand), both Navico/Brunswick, use the same underlying OS for their MFDs (Zeus, Vulcan, NSX, NSO). NMEA 2000 integration provides standard instrument data. CZone digital switching integrates for boat systems control. The approach is less unified than Raymarine's — no single "boat management screen" equivalent, but the same capabilities are available through CZone integration pages on the MFD.

---

## 4. SignalK Deep-Dive

### 4.1 What is SignalK?

SignalK is the open-source marine data standard and server that normalises all boat data into a single JSON-based format accessible over WiFi. It is the critical bridge between proprietary marine protocols and modern web applications.

**Core components:**
1. **Data specification** — A JSON schema defining standardised paths for all marine data (position, wind, depth, batteries, tanks, engines, etc.)
2. **SignalK Server** — A Node.js application that runs on a Raspberry Pi (or any Linux system), connects to NMEA 0183, NMEA 2000, and other data sources, and exposes everything via REST API and WebSocket
3. **Plugin ecosystem** — Hundreds of community plugins for data processing, alerting, dashboarding, and integration with external systems
4. **Web app framework** — Server hosts web applications that access boat data in the browser

### 4.2 SignalK Data Model — Key Paths for Boat Systems Monitoring

All paths are under `/vessels/self/` (or `/vessels/{mmsi|uuid}/`):

**Electrical System:**
```
electrical.batteries.{id}.voltage                    # Volts
electrical.batteries.{id}.current                    # Amps (+ve = charging for batteries)
electrical.batteries.{id}.temperature                # Kelvin
electrical.batteries.{id}.capacity.stateOfCharge     # Ratio (0-1)
electrical.batteries.{id}.capacity.stateOfHealth      # Ratio (0-1)
electrical.batteries.{id}.capacity.nominal            # Coulombs (Ah * 3600)
electrical.batteries.{id}.capacity.remaining           # Coulombs
electrical.batteries.{id}.capacity.timeRemaining       # Seconds
electrical.batteries.{id}.lifetimeDischarge            # Coulombs
electrical.batteries.{id}.lifetimeRecharge             # Coulombs

electrical.solar.{id}.voltage                        # PV array voltage
electrical.solar.{id}.current                        # PV array current
electrical.solar.{id}.panelPower                     # Watts
electrical.solar.{id}.controllerMode                 # Enum: charging, float, etc.
electrical.solar.{id}.chargingAlgorithm              # MPPT, PWM, etc.

electrical.alternators.{id}.voltage                  # Output voltage
electrical.alternators.{id}.current                  # Output current
electrical.alternators.{id}.temperature              # Alternator temp
electrical.alternators.{id}.fieldDrive               # Field drive percentage

electrical.chargers.{id}.voltage                     # Output voltage
electrical.chargers.{id}.current                     # Output current
electrical.chargers.{id}.mode                        # Bulk, absorption, float

electrical.inverters.{id}.dc.voltage                 # DC input voltage
electrical.inverters.{id}.dc.current                 # DC input current
electrical.inverters.{id}.ac.lineNeutralVoltage       # AC output voltage
electrical.inverters.{id}.ac.current                 # AC output current
electrical.inverters.{id}.ac.frequency               # AC frequency
electrical.inverters.{id}.ac.reactivePower           # VAR
electrical.inverters.{id}.ac.realPower               # Watts

electrical.ac.{id}.phase.{phase}.lineNeutralVoltage  # Shore/generator AC
electrical.ac.{id}.phase.{phase}.current             # Per-phase current
electrical.ac.{id}.phase.{phase}.frequency           # Hz
electrical.ac.{id}.phase.{phase}.realPower           # Watts
```

**Propulsion (Engines):**
```
propulsion.{id}.revolutions                          # Hz (RPM / 60)
propulsion.{id}.temperature                          # Coolant temp (Kelvin)
propulsion.{id}.oilPressure                          # Pascals
propulsion.{id}.oilTemperature                       # Kelvin
propulsion.{id}.exhaustTemperature                   # Kelvin
propulsion.{id}.fuel.rate                            # m3/s
propulsion.{id}.fuel.used                            # m3 (cumulative)
propulsion.{id}.runTime                              # Seconds (total hours)
propulsion.{id}.coolantPressure                      # Pascals
propulsion.{id}.transmission.gear                    # Forward, Neutral, Reverse
propulsion.{id}.transmission.oilPressure             # Pascals
propulsion.{id}.transmission.oilTemperature          # Kelvin
propulsion.{id}.drive.type                           # Saildrive, shaft, outboard, jet
propulsion.{id}.drive.trimState                      # Ratio (0-1)
```

**Tanks:**
```
tanks.freshWater.{id}.currentLevel                   # Ratio (0-1)
tanks.freshWater.{id}.capacity                       # m3
tanks.freshWater.{id}.currentVolume                  # m3
tanks.fuel.{id}.currentLevel                         # Ratio (0-1)
tanks.fuel.{id}.capacity                             # m3
tanks.wasteWater.{id}.currentLevel                   # Ratio (0-1)
tanks.blackWater.{id}.currentLevel                   # Ratio (0-1)
tanks.lubrication.{id}.currentLevel                  # Ratio (0-1)
tanks.liveWell.{id}.currentLevel                     # Ratio (0-1)
tanks.gas.{id}.currentLevel                          # Ratio (0-1)
tanks.ballast.{id}.currentLevel                      # Ratio (0-1)
```

**Environment:**
```
environment.inside.temperature                       # Cabin temp (Kelvin)
environment.inside.humidity                          # Ratio (0-1)
environment.inside.refrigerator.temperature          # Kelvin
environment.inside.freezer.temperature               # Kelvin
environment.inside.engineRoom.temperature            # Kelvin
environment.outside.temperature                      # Kelvin
environment.outside.humidity                         # Ratio (0-1)
environment.outside.pressure                         # Pascals
environment.water.temperature                        # Sea water temp
environment.depth.belowKeel                          # Metres
environment.depth.belowTransducer                    # Metres
environment.wind.angleApparent                       # Radians
environment.wind.speedApparent                       # m/s
```

**Steering:**
```
steering.rudderAngle                                 # Radians
steering.autopilot.state                             # auto, standby, route, wind
steering.autopilot.mode                              # compass, wind, route, true wind
steering.autopilot.target.headingMagnetic            # Radians
steering.autopilot.target.windAngleApparent          # Radians
```

**Notifications (Alarms):**
```
notifications.bilge.{zone}                           # Bilge alarm per zone
notifications.electrical.batteries.{id}              # Battery alarms
notifications.propulsion.{id}                        # Engine alarms
notifications.navigation.anchor                      # Anchor watch alarm
notifications.mob                                    # Man overboard
```

**Note on units:** SignalK uses SI units exclusively. Temperatures in Kelvin, speeds in m/s, angles in radians, volumes in m3. Conversion to display units (Fahrenheit, knots, degrees, litres/gallons) happens in the UI layer.

### 4.3 Connecting to SignalK from a Web App

**REST API:**
```
GET http://{host}:3000/signalk/v1/api/vessels/self
GET http://{host}:3000/signalk/v1/api/vessels/self/electrical/batteries/house
GET http://{host}:3000/signalk/v1/api/vessels/self/propulsion/port/revolutions
```

Returns current value with metadata:
```json
{
  "value": 0.85,
  "timestamp": "2026-03-24T10:30:00Z",
  "$source": "victron.batteries.house"
}
```

**WebSocket Streaming (real-time):**
```javascript
const ws = new WebSocket('ws://{host}:3000/signalk/v1/stream?subscribe=none');

ws.onopen = () => {
  // Subscribe to specific paths
  ws.send(JSON.stringify({
    context: 'vessels.self',
    subscribe: [
      { path: 'electrical.batteries.*', period: 1000 },
      { path: 'propulsion.*.revolutions', period: 500 },
      { path: 'tanks.*', period: 5000 },
      { path: 'environment.inside.*', period: 10000 }
    ]
  }));
};

ws.onmessage = (event) => {
  const delta = JSON.parse(event.data);
  // delta.updates[].values[].path + value
};
```

Subscribe options:
- `subscribe=self` — stream all data for own vessel (default)
- `subscribe=all` — stream everything (including AIS targets)
- `subscribe=none` — only heartbeat, until client subscribes to specific paths
- `period` — update rate in milliseconds
- `minPeriod` — minimum update rate

**JavaScript Client Library:** `@signalk/client` (npm) provides auto-discovery, WebSocket management, and typed API access.

### 4.4 SignalK Plugin Ecosystem — Monitoring-Relevant Plugins

| Plugin | Purpose |
|--------|---------|
| **signalk-to-influxdb2** | Stores all data in InfluxDB for historical analysis |
| **signalk-simple-notifications** | Configurable alarms for any data path (bilge, voltage, temp) |
| **signalk-renotifier** | Executes scripts on alarm (send Telegram, email, push notification) |
| **signalk-pushover-notification** | Push alerts to phone via Pushover service |
| **signalk-victron-venus** | Reads data from Victron Venus OS D-Bus |
| **InstrumentPanel** | Configurable web dashboard with gauges, dials, bar graphs |
| **Freeboard-SK** | Full chart plotter with instrument overlays |
| **KIP (Kip Instrument Package)** | Angular-based instrument dashboard with digital switching (Boolean Control Panel for lights, pumps, solenoids) |
| **WilhelmSK** | iOS app for instruments, alarms, AIS, charts |
| **signalk-anchor-alarm** | Anchor watch with configurable radius |
| **signalk-node-red** | Node-RED integration for custom automation |
| **signalk-mqtt-gw** | MQTT gateway for bridging to Home Assistant, custom apps |
| **signalk-zigbee-sensors** | Zigbee sensor integration (temperature, humidity, door) |
| **signalk-meshtastic** | Long-range alerts via Meshtastic LoRa mesh |

### 4.5 Building a Web UI on SignalK

SignalK server supports two types of web apps:

1. **Standalone WebApps** — Full-page applications hosted by the server. When launched, the SignalK admin UI disappears and the webapp controls the entire browser window. Built with any web framework (React, Vue, Svelte, etc.).

2. **Embedded WebApps** — Applications embedded within the SignalK admin UI, leaving the toolbar and menu visible.

Both types are distributed as npm packages that the server auto-discovers and serves. A webapp can use the REST API and WebSocket directly from the browser — no CORS issues since it's served from the same origin.

**Key implication for Above Deck:** A web app (PWA) running on a phone/tablet on the boat's WiFi network can connect directly to the SignalK server's WebSocket and receive real-time data from every sensor on the boat. No cloud required, no cellular needed, sub-second latency.

---

## 5. Victron Integration

### 5.1 Victron VRM API (Cloud)

The VRM API v2 provides cloud-based access to all data from Victron installations worldwide. This is the lowest-friction integration path — if a boat has a Cerbo GX with internet connectivity, their data is already in VRM.

**Authentication:**
```
POST https://vrmapi.victronenergy.com/v2/auth/login
Body: { "username": "...", "password": "..." }
Response: { "token": "...", "idUser": 12345 }
```
Or use personal access tokens (recommended for third-party apps) — generated at the VRM Portal settings page. Token is passed as `X-Authorization: Token {token}` header.

**Key Endpoints:**

| Endpoint | Method | Returns |
|----------|--------|---------|
| `/v2/users/{idUser}/installations` | GET | List of installations (boats) with idSite, name, location |
| `/v2/installations/{idSite}/widgets/BatterySummary` | GET | Latest battery SOC, voltage, current, power, state |
| `/v2/installations/{idSite}/widgets/SolarChargerSummary` | GET | Solar PV power, yield, MPPT state per charger |
| `/v2/installations/{idSite}/widgets/VeBusStatus` | GET | Inverter/charger state, AC in/out, mode |
| `/v2/installations/{idSite}/widgets/TankSummary` | GET | Tank levels (when available) |
| `/v2/installations/{idSite}/diagnostics` | GET | All diagnostic values: SOC, voltage, power, etc. with codes |
| `/v2/installations/{idSite}/stats` | GET | Historical statistics (hourly, daily, monthly aggregates) |
| `/v2/installations/{idSite}/gps-download` | GET | GPS track data |

**Data format example (diagnostics):**
```json
{
  "code": "SOC",
  "description": "State of Charge",
  "rawValue": 85.2,
  "formattedValue": "85.2%",
  "timestamp": 1711267800
}
```

**Limitations:**
- Cloud-only — requires internet on the boat
- Polling-based (no WebSocket/streaming) — suitable for 30s-5min refresh, not real-time
- Rate limits apply (not publicly documented, community reports ~100 req/15min)
- Only Victron equipment data — no NMEA 2000 engine/tank/nav data
- Battery, solar, inverter data is excellent; tank data requires NMEA 2000 or analog sensors connected to Cerbo

### 5.2 Venus OS MQTT (Local, Real-Time)

The Cerbo GX runs an MQTT broker that publishes all Victron data on the local network. This is the real-time path for onboard apps.

**Enabling:** Settings > Services > MQTT > Enable. For browser WebSocket access, also enable the WebSocket listener on port 9001.

**Topic structure:**
```
N/{portalId}/{serviceType}/{deviceInstance}/{dbusPath}
```

**Key topics:**

| Topic | Description |
|-------|-------------|
| `N/{id}/system/0/Dc/Battery/Voltage` | System battery voltage |
| `N/{id}/system/0/Dc/Battery/Current` | System battery current |
| `N/{id}/system/0/Dc/Battery/Power` | System battery power |
| `N/{id}/system/0/Dc/Battery/Soc` | System battery SOC (0-100) |
| `N/{id}/system/0/Dc/Pv/Power` | Total solar PV power |
| `N/{id}/system/0/Dc/Pv/Current` | Total solar current |
| `N/{id}/system/0/Dc/Vebus/Current` | Inverter/charger DC current |
| `N/{id}/system/0/Dc/Vebus/Power` | Inverter/charger DC power |
| `N/{id}/system/0/Ac/ActiveIn/Source` | Active AC input (grid/generator/shore) |
| `N/{id}/system/0/Ac/Consumption/L1/Power` | AC consumption phase 1 |
| `N/{id}/system/0/SystemState/State` | System state (off/charging/inverting) |
| `N/{id}/solarcharger/{n}/Pv/V` | Per-MPPT PV voltage |
| `N/{id}/solarcharger/{n}/Yield/Power` | Per-MPPT power |
| `N/{id}/solarcharger/{n}/Yield/User` | Per-MPPT daily yield (kWh) |
| `N/{id}/battery/{n}/Dc/0/Voltage` | Per-battery voltage |
| `N/{id}/battery/{n}/Soc` | Per-battery SOC |
| `N/{id}/battery/{n}/Dc/0/Temperature` | Per-battery temperature |
| `N/{id}/vebus/{n}/Ac/ActiveIn/L1/V` | AC input voltage |
| `N/{id}/vebus/{n}/Ac/Out/L1/P` | AC output power |
| `N/{id}/tank/{n}/Level` | Tank level (0-100%) |
| `N/{id}/tank/{n}/Capacity` | Tank capacity (m3) |
| `N/{id}/tank/{n}/FluidType` | Tank type (fuel/water/waste) |
| `N/{id}/temperature/{n}/Temperature` | Temperature sensor reading |

**Writing values:** Use `W/{portalId}/{service}/{instance}/{path}` topics to write. Example: `W/{id}/vebus/276/Mode` with payload `{"value": 3}` to set inverter mode.

**Browser connection:** A web app can connect directly to the Cerbo GX MQTT broker via WebSocket on port 9001 using a JavaScript MQTT client (e.g., mqtt.js, MQTT.js in browser mode). Victron's own venus-html5-app demonstrates this pattern.

### 5.3 Victron Modbus TCP

Industrial integration protocol for PLCs and automation systems.

**How it works:**
- Cerbo GX exposes a Modbus TCP server on port 502
- Registers organised by device class: VE.Bus inverters (regs 3-60), solar chargers (regs 771-790), batteries, etc.
- Unit-ID addresses specific devices
- Register list available as downloadable Excel spreadsheet from Victron

**Relevance:** Less useful for web apps (would require a server-side proxy), but important for integration with industrial automation, SignalK (via signalk-modbus plugin), or the Above Deck Go server.

### 5.4 Typical Victron Stack on a Cruising Boat

A well-equipped 40-50ft cruising catamaran typically has:

| Device | Model | Connection to Cerbo | Data Provided |
|--------|-------|---------------------|---------------|
| Battery Monitor | SmartShunt 500A | VE.Direct | SOC, voltage, current, temp, time remaining |
| Solar Controller x2 | SmartSolar MPPT 150/35 | VE.Direct | PV voltage/current/power, daily yield, charging state |
| Inverter/Charger | MultiPlus 12/3000/120 | VE.Bus | AC in/out voltage/current/power, mode, state |
| Monitoring Hub | Cerbo GX + GX Touch 50 | Central hub | Aggregates all data, runs Venus OS |
| Battery | LiFePO4 (Victron, BattleBorn, or DIY) | VE.Can (if Victron) or via SmartShunt | Cell voltages, BMS data |
| DC-DC Charger | Orion Smart 12/12-30 | VE.Direct | Alternator charging data |

**Total data path:** All Victron device data flows through the Cerbo GX, which publishes via MQTT locally and syncs to VRM cloud. A web app can access this data either locally (MQTT WebSocket on port 9001) or remotely (VRM API).

---

## 6. DIY and Open-Source Monitoring

### 6.1 SignalK + InfluxDB + Grafana

The most common DIY monitoring stack among tech-savvy sailors:

1. **SignalK Server** on Raspberry Pi — collects data from NMEA 2000 (via PICAN-M HAT) and Victron (via signalk-victron-venus plugin)
2. **signalk-to-influxdb2 plugin** — streams all SignalK data to InfluxDB time-series database
3. **Grafana** — creates beautiful dashboards from InfluxDB data, accessible from any browser on the boat network

**What sailors build with this stack:**
- Power balance dashboards (solar input vs. consumption, SOC over time)
- Engine monitoring panels (RPM, coolant temp, oil pressure with historical trends)
- Passage analysis (wind, speed, heading, heel angle over a voyage)
- Anchor watch with position history
- Long-term trend analysis ("is my solar output declining month-over-month?")

**Limitations:**
- Requires Linux/command-line comfort to set up and maintain
- Grafana dashboards are powerful but not boat-specific (generic data viz tool)
- No real-time alerting without additional configuration
- Not mobile-friendly by default (Grafana is desktop-oriented)
- No digital switching or control — read-only monitoring

SeaBits (seabits.com) by Steve Mitchell is the definitive reference for this setup, with detailed tutorials and dashboard templates.

### 6.2 SensESP — ESP32 Sensors for SignalK

SensESP is the bridge between physical sensors and SignalK, running on $5-15 ESP32 boards.

**Supported sensor types:**
- Temperature (1-Wire DS18B20, NTC thermistors, BME280)
- Tank level (resistive senders, capacitive, ultrasonic)
- Bilge float switch (digital input)
- Engine RPM (inductive pickup on alternator)
- Current (ACS712 hall effect, CT clamp)
- Voltage (resistive divider, INA219)
- Pressure (BMP280, industrial 4-20mA)
- Flow rate (pulse-type flow sensors)
- GPS (NEO-6M and similar modules)

**Getting started:** PlatformIO project, configure sensor type and SignalK path, flash to ESP32, it auto-discovers the SignalK server on the network. No soldering required for basic setups using development boards with screw terminals.

**Hardware recommendations:** Hat Labs SH-ESP32 (~$45) or HALMET board — purpose-built for marine use with proper power regulation, CAN bus interface, and optocoupled inputs. Generic ESP32 DevKit boards work but need a separate 12V-to-3.3V regulator.

### 6.3 BBN OS (Bareboat Necessities)

A complete open-source marine operating system based on Raspberry Pi that bundles:
- SignalK server
- OpenCPN chartplotter
- PyPilot (open-source autopilot)
- Grafana dashboards
- Node-RED automation
- KDE Plasma desktop for touchscreen

**Relevance:** BBN OS is the most complete open-source attempt at a unified boat computer. However, it's a traditional Linux desktop approach — not a modern web/PWA architecture, not cloud-connected, and requires significant technical skill to customise.

### 6.4 Boatface

An open-source instrument panel specifically for e-ink displays, reading NMEA and SignalK telemetry data. Interesting for ultra-low-power always-on displays (e-ink uses zero power to maintain an image).

### 6.5 What DIY Sailors Wish Existed

Based on forum analysis (Sailing Anarchy, Cruisers Forum, Trawler Forum, Victron Community):

1. **A single dashboard for everything** — Victron for power, NMEA for engines/tanks, BLE for climate, cameras for visual — all in one place. Nobody wants 4 different apps.
2. **Mobile-first remote monitoring** — Check boat status from shore without VPN or port-forwarding. Victron VRM handles power, but nothing handles the rest.
3. **Smart alerting** — "Bilge pump ran 3 times in the last hour" not just "bilge pump is on." Trend-based alerts, not just threshold alerts.
4. **Historical trends** — "How much solar did I generate this month vs. last month?" without setting up InfluxDB + Grafana.
5. **Easy setup** — The Grafana/InfluxDB/SignalK stack works but requires Linux sysadmin skills. Most sailors cannot maintain it.
6. **Cross-platform** — Works on iPad, Android tablet, phone, laptop. Not locked to one MFD brand.
7. **Offline-capable** — Must work without internet (at sea, remote anchorages).

---

## 7. The Software Opportunity

### 7.1 What a Web/PWA App Can Do WITHOUT Hardware

| Capability | How | Data Source |
|------------|-----|-------------|
| Full Victron power monitoring | VRM API v2 (cloud) | Battery SOC/voltage/current, solar yield, inverter state |
| Historical power analysis | VRM API stats endpoint | Daily/monthly energy trends |
| Remote alerts | VRM API polling + push notifications | Low battery, high consumption, charger fault |
| GPS tracking | VRM API GPS endpoint | Boat position, geofencing |
| Manual entry | User input | Tank levels, engine hours, maintenance logs |
| Community data | Shared user data | Solar yield by location, typical consumption profiles |

**No hardware needed beyond existing Victron Cerbo GX with internet.**

### 7.2 What Requires Onboard Connection (SignalK over WiFi)

| Capability | How | Data Source |
|------------|-----|-------------|
| Real-time engine data | SignalK WebSocket | RPM, oil pressure, coolant temp, exhaust temp |
| Real-time tank levels | SignalK WebSocket | Fuel, water, waste levels |
| Real-time power (sub-second) | SignalK WebSocket or Victron MQTT WS | All Victron data at 1Hz+ |
| Bilge monitoring | SignalK WebSocket | Pump cycles, water detection |
| Climate data | SignalK WebSocket | Cabin temp/humidity, fridge/freezer |
| Navigation data | SignalK WebSocket | Position, heading, speed, wind, depth |
| Digital switching | SignalK PUT API | Light control, pump control (requires CZone/EmpirBus) |
| Autopilot status | SignalK WebSocket | Mode, target, rudder angle |

**Requires:** Raspberry Pi (or equivalent) running SignalK server, connected to NMEA 2000 backbone and/or Victron system.

### 7.3 What Requires Additional Sensors

| Capability | Hardware Needed | Estimated Cost |
|------------|----------------|----------------|
| BLE temperature sensors | Xiaomi/RuuviTag + BLE gateway | $10-30 per sensor |
| DIY tank level sensing | SensESP + ESP32 + resistive sender | $30-50 per tank |
| Engine monitoring (pre-NMEA 2000 engine) | Yacht Devices YDEG-04 engine gateway | $200-400 |
| Bilge pump monitoring | SensESP + ESP32 + float switch | $20-40 per zone |
| Camera feeds | WiFi IP camera + RTSP | $30-100 per camera |
| Remote monitoring (no WiFi/cellular on boat) | Meshtastic LoRa nodes | $30-60 per node |

### 7.4 Progressive Integration Strategy

**Phase 1: Cloud-Only (Victron VRM)**
- Connect to user's existing Victron VRM account via API
- Show battery SOC, solar yield, inverter state, historical trends
- Push notifications for alerts
- GPS tracking and geofencing
- No new hardware needed
- Target: any sailor with a Victron Cerbo GX and internet

**Phase 2: Onboard Real-Time (SignalK)**
- Detect and connect to boat's SignalK server over local WiFi
- Real-time engine, tank, and navigation data
- Sub-second power data updates
- Bilge and climate monitoring
- Works offline (no internet required)
- Target: sailors with a Raspberry Pi running SignalK (growing community)

**Phase 3: Direct Victron (MQTT WebSocket)**
- Connect directly to Cerbo GX MQTT broker over WebSocket (port 9001)
- Eliminates SignalK as intermediary for Victron data
- Real-time power data with lowest possible latency
- Write capability (change inverter mode, set charge limits)
- Target: Victron-only boats without SignalK

**Phase 4: Sensor Expansion**
- BLE sensor integration (via Above Deck Go server as gateway)
- SensESP sensor discovery and data ingestion
- Camera feed embedding
- Digital switching integration (CZone/EmpirBus via SignalK or NMEA 2000)
- Target: advanced users building comprehensive monitoring

### 7.5 The Target UX: Open-Source Raymarine Boat Management

The Raymarine Axiom boat management screen with CZone integration is the UX benchmark:

| Raymarine Category | Our Implementation |
|--------------------|--------------------|
| HOME | System overview — SOC gauge, solar, tank levels, engine status, alerts |
| POWER | Battery banks, solar panels, inverter, charger, shore power — all Victron data |
| FLUIDS | Tank levels — fuel, water, waste — via SignalK or manual entry |
| LIGHTS | Digital switching status — via SignalK/CZone. Fallback: manual toggle tracking |
| DRIVE | Autopilot, rudder, trim — via SignalK NMEA 2000 data |
| CLIMATE | Cabin temp, humidity, fridge, freezer — via BLE sensors or SignalK |
| SECURITY | Geofencing (VRM GPS), anchor alarm, camera feeds |
| BILGES | Pump cycle tracking, water detection alerts — via SignalK |

**What makes ours different:**
1. **Cross-platform** — runs on any device with a browser, not locked to one MFD brand
2. **Progressive** — works with just Victron cloud data, improves with each integration layer
3. **Historical** — built-in time-series storage and trend analysis (what Raymarine lacks)
4. **Remote** — accessible from anywhere (cloud tier), not just at the helm
5. **Open** — open-source, extensible, community-driven
6. **Offline-capable** — PWA with local data caching works without internet
7. **Modern UI** — blueprint aesthetic, responsive, dark-mode default (sailors plan at night)

### 7.6 Technical Architecture Sketch

```
Browser (PWA)
  |
  |-- WebSocket --> SignalK Server (boat WiFi)
  |                   |-- NMEA 2000 (engine, tanks, nav, switching)
  |                   |-- Victron Venus plugin (batteries, solar, inverter)
  |                   |-- SensESP WiFi (DIY sensors)
  |                   |-- BLE gateway (temperature, humidity)
  |
  |-- WebSocket --> Victron MQTT (boat WiFi, port 9001)
  |                   |-- Direct Victron data (battery, solar, inverter)
  |
  |-- HTTPS --> VRM API (cloud, cellular/WiFi)
  |                   |-- Victron data (polling, 30s+ refresh)
  |
  |-- HTTPS --> Above Deck API (cloud)
                      |-- User settings, alert rules, historical data sync
                      |-- Community data (anonymised solar yield, consumption patterns)
```

The PWA detects which data sources are available and uses the best path: local WebSocket when on the boat, VRM API when remote. Data flows into the same UI regardless of source.

---

## Sources

### SignalK
- [SignalK — The Open Marine Data Platform](https://signalk.org)
- [SignalK Specification v1.7.0 — Vessel Keys Reference](https://signalk.org/specification/1.7.0/doc/vesselsBranch.html)
- [SignalK REST API](https://signalk.org/specification/1.7.0/doc/rest_api.html)
- [SignalK Streaming API](https://signalk.org/specification/1.7.0/doc/streaming_api.html)
- [SignalK Subscription Protocol](https://signalk.org/specification/1.7.0/doc/subscription_protocol.html)
- [SignalK Server — GitHub](https://github.com/SignalK/signalk-server)
- [SignalK JavaScript Client — GitHub](https://github.com/SignalK/signalk-js-client)
- [SignalK WebApps Documentation](https://demo.signalk.org/documentation/Developing/Plugins/WebApps.html)
- [SignalK MCP Server (2025)](https://signalk.org/2025/introducing-signalk-mcp-server-ai-powered-marine-data-access/)
- [SignalK Notification/Alarm Handling](https://signalk.org/specification/1.7.0/doc/notifications.html)
- [SignalK Remote Alerting with Pushover (2025)](https://signalk.org/2025/signalk-local-remote-alerts/)
- [SignalK Zigbee Sensors (2025)](https://signalk.org/2025/signalk-zigbee-sensors/)
- [SignalK Meshtastic Integration (2025)](https://signalk.org/2025/signalk-meshtastic/)
- [Electrical Schema — GitHub](https://github.com/SignalK/specification/blob/master/schemas/groups/electrical.json)
- [KIP Instrument Package — GitHub](https://github.com/mxtommy/Kip)

### Victron Energy
- [VRM API Documentation](https://vrm-api-docs.victronenergy.com/)
- [VRM API v2 Documentation](https://docs.victronenergy.com/vrmapi/overview.html)
- [VRM API Python Client — GitHub](https://github.com/victronenergy/vrm-api-python-client)
- [Venus OS dbus-mqtt — GitHub](https://github.com/victronenergy/dbus-mqtt)
- [Venus HTML5 App MQTT Topics — GitHub](https://github.com/victronenergy/venus-html5-app/blob/master/TOPICS.md)
- [Venus HTML5 App — GitHub](https://github.com/victronenergy/venus-html5-app)
- [GX Modbus-TCP Manual](https://www.victronenergy.com/live/ccgx:modbustcp_faq)
- [Modbus TCP Register List (Excel)](https://www.victronenergy.com/upload/documents/CCGX-Modbus-TCP-register-list-3.70.xlsx)
- [Cerbo GX Product Page](https://www.victronenergy.com/communication-centres/cerbo-gx)
- [Victron Marine Integration Guide — NMEA 2000](https://www.victronenergy.com/live/ve.can:nmea-2000:start)
- [Venus OS 3.60 Release Notes](https://www.victronenergy.com/blog/2025/06/10/introducing-venus-os-3-60/)
- [Victron MQTT Open Source Specification](https://tomer-w.github.io/victron_mqtt/)
- [Cerbo GX Functions — Explorist.life](https://explorist.life/understanding-the-victron-cerbo-gx-functions/)
- [Victron LiFePO4 System — SeaBits](https://seabits.com/installing-and-using-a-victron-lifepo4-energy-system/)
- [Boat Energy Management with Victron + Home Assistant — BoatHackers](https://boathackers.com/boat-energy-management-using-victron-and-home-assistant/)

### NMEA 2000
- [Maretron PGN Knowledge Base](https://www.maretron.com/support/knowledgebase/phpkbv7/article.php?id=557)
- [NMEA 2000 PGN Reference — continuousWave](https://continuouswave.com/whaler/reference/PGN.html)
- [NMEA 2000 Fluid Level Monitoring — continuousWave](https://continuouswave.com/whaler/reference/fluidTankLevelNMEA2000.html)
- [NMEA 2000 Explained — Vanemar](https://vanemar.com/blogs/vanemar-boaters-blog/nmea-2000-explained-the-boaters-guide-to-smarter-marine-networking)
- [Xantrex NMEA 2000 PGN List](https://xantrex.com/library/inverter-chargers/freedom-xc-pro-marine-inverter-charger/nmea-2000-pgn-list/)
- [ESP32 NMEA 2000 Data Sender — GitHub](https://github.com/AK-Homberger/NMEA2000-Data-Sender)

### Commercial Platforms
- [Raymarine YachtSense Ecosystem](https://www.raymarine.com/en-us/our-products/digital-boating/yachtsense-ecosystem)
- [Raymarine YachtSense Link](https://www.raymarine.com/en-us/our-products/digital-boating/yachtsense-digital-control-systems/yachtsense-modules/yachtsense-link)
- [Raymarine YachtSense Digital Switching](https://www.raymarine.com/en-us/our-products/digital-boating/yachtsense-digital-control-systems)
- [CZone Digital Switching — Raymarine](https://www.raymarine.com/en-us/our-products/digital-boating/digital-switching-partners/czone)
- [CZone — Mastervolt](https://www.mastervolt.com/products/czone/)
- [CZone Official Site](https://czone.navico.com/marine/)
- [Maretron N2KView](https://www.maretron.com/products/n2kview-vessel-monitoring-and-control-software/)
- [Simarine PICO](https://simarine.net/pico-battery-monitor/)
- [Simarine PICO Blue Set](https://simarine.net/pico-blue-set/)
- [Yacht Devices Products](https://www.yachtd.com/products/)
- [Yacht Devices Battery Monitor](https://www.yachtd.com/news/battery_monitor.html)
- [Yacht Devices Text Display](https://www.yachtd.com/products/display.html)
- [Siren Marine Siren 3 Pro](https://sirenmarine.com/products/siren-3-pro)
- [Digital Switching Comparison — Panbo](https://panbo.com/digital-switching-raymarine-empirbus-simrad-naviops-offshore-octoplex-garmin-and-czone/)
- [EmpirBus NXT — Panbo](https://panbo.com/empirebus-nxt-distributed-power-gone-nmea-2000-beyond/)
- [Digital Switching is the New Norm — YachtWorld](https://www.yachtworld.com/research/digital-switching-on-boats-is-the-new-norm/)

### DIY and Open Source
- [SensESP Documentation](https://signalk.org/SensESP/)
- [SensESP — GitHub](https://github.com/SignalK/SensESP)
- [SensESP Boat Systems Monitor — GitHub](https://github.com/caballero03/SignalK-SensESP-Boat-Systems-Monitor)
- [BBN OS (Bareboat Necessities) — GitHub](https://github.com/bareboat-necessities/lysmarine_gen)
- [Bareboat Necessities Documentation](https://bareboat-necessities.github.io/my-bareboat/bareboat-os.html)
- [Boatface — GitHub](https://github.com/maritime-labs/boatface)
- [SeaBits: SignalK + Grafana Setup](https://seabits.com/set-up-signal-k-and-grafana-on-raspberry-pi-with-pican-m-nmea-2000-board/)
- [SeaBits: Engine and Power Dashboards](https://seabits.com/engine-and-power-dashboards/)
- [SeaBits: Real-Time Weather Dashboard](https://seabits.com/real-time-weather-from-the-boat/)
- [InfluxDB + SignalK for Boating Safety — InfluxData](https://www.influxdata.com/resources/how-an-open-marine-standard-influxdb-and-grafana-are-used-to-improve-boating-safety/)
- [Signal K and the Sailboat — Practical Sailor](https://www.practical-sailor.com/marine-electronics/signal-k-and-the-sailboat/)
- [OpenPlotter and Signal K Guide — Copperhill](https://copperhilltech.com/blog/comprehensive-guide-to-openplotter-and-signal-k/)
- [Signal K Data Overload — Panbo](https://panbo.com/data-overload-with-signal-k-server-a-raspberry-pi-and-a-whole-lot-of-tools/)

### Remote Monitoring
- [Glomex ZigBoat](https://www.zigboat.com/)
- [Weatherdock ME SENSE](https://www.easyais.com/en/me-sense/)
- [Sensar Marine](https://sensarmarine.com)
- [Digital Yacht NjordLINK+](https://digitalyachtamerica.com/product/njordlink/)
- [Roam Devices](https://roamdevices.com/)
- [Top App-Based Boat Monitoring Systems — Saltwater Sportsman](https://www.saltwatersportsman.com/boats/top-app-based-boat-monitoring-and-security-systems/)
- [Remote Boat Monitoring Systems — Boating Mag](https://boatingmag.com/gear/remote-boat-monitoring-and-control-systems/)
- [Smart Boat IoT — Yachting World](https://www.yachtingworld.com/features/monitoring-apps-internet-of-things-smart-boat-125303)

### Victron Community MQTT References
- [Home Assistant Victron MQTT Integration](https://community.home-assistant.io/t/victron-venus-os-with-mqtt-sensors-switches-and-numbers/527931)
- [WebVB Studio — Victron MQTT Dashboard Builder](https://www.webvbstudio.com/victron/)
- [Victron energy2mqtt](https://www.energy2mqtt.org/protocols/victron/index.html)
