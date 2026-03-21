# CAN Bus Technology: From Automotive Origins to Marine, IoT, and Beyond

**Date:** 2026-03-20
**Status:** Research complete
**Related:** [Go Marine Ecosystem](./go-marine-ecosystem.md) | [Hardware Connectivity Technologies](./hardware-connectivity-technologies.md) | [Sailor Hardware Landscape](./sailor-hardware-landscape.md)

---

## Executive Summary

Controller Area Network (CAN bus) is the dominant embedded communications protocol across automotive, marine, industrial, agricultural, and aerospace domains. Originally developed by Bosch in 1983 for in-vehicle wiring reduction, CAN bus now connects billions of devices worldwide. For Above Deck, CAN bus is the foundational physical layer beneath NMEA 2000 — but mastering CAN bus opens doors far beyond marine. The same Go code that reads NMEA 2000 PGNs from a sailboat's instrument bus can read J1939 engine data, Victron battery telemetry, solar inverter status, and RV tank levels. A Go-native CAN bus library is infrastructure that makes Above Deck relevant to boats, campervans, off-grid cabins, and any 12V/24V system.

---

## 1. CAN Bus Fundamentals

### 1.1 History

| Year | Milestone |
|------|-----------|
| 1983 | Robert Bosch GmbH begins development. Engineers Siegfried Dais and Uwe Kiencke lead the project to address growing automotive wiring complexity |
| 1985 | Bosch files initial CAN patent |
| 1986 | CAN introduced at the SAE (Society of Automotive Engineers) congress in Detroit |
| 1987 | Intel (82526) and Philips (82C200) release the first CAN controller chips |
| 1991 | Mercedes-Benz W140 (S-Class) becomes the first production car with CAN bus |
| 1993 | CAN standardised as ISO 11898 |
| 2000 | NMEA 2000 standard published, bringing CAN bus to marine |
| 2003 | All vehicles sold in the US required to implement OBD-II over CAN (mandated by 2008) |
| 2012 | Bosch introduces CAN FD (Flexible Data-Rate) for higher bandwidth |
| 2015 | CAN FD standardised as ISO 11898-1:2015 |
| 2024 | CAN XL specification progressing — up to 2048-byte payloads at 20 Mbit/s |

### 1.2 Physical Layer

CAN bus uses a differential two-wire serial bus (CAN_H and CAN_L) in a **twisted pair** configuration. The bus operates in two states:

- **Dominant (logical 0):** CAN_H driven high (~3.5V), CAN_L driven low (~1.5V). Differential voltage ~2V.
- **Recessive (logical 1):** Both wires at ~2.5V. Differential voltage ~0V.

This dominant/recessive scheme is fundamental to CAN's arbitration mechanism — a dominant bit always overwrites a recessive bit on the bus.

**Termination:** The bus must be terminated at both physical ends with 120-ohm resistors between CAN_H and CAN_L. Without proper termination, signal reflections cause bit errors. A correctly terminated bus measures ~60 ohms between CAN_H and CAN_L (two 120-ohm resistors in parallel).

**Topology:** CAN uses a linear bus topology (backbone with drop cables). Star topologies are possible with specialised hubs but are not standard. Maximum bus length depends on bit rate — at 1 Mbit/s the bus is limited to ~25m; at 250 kbit/s (NMEA 2000 speed) it reaches ~250m.

### 1.3 Protocol Variants

| Specification | ID Bits | Max Data (bytes) | Max Bit Rate | Frame Overhead | Standard |
|---------------|---------|-------------------|--------------|----------------|----------|
| CAN 2.0A (Standard) | 11 | 8 | 1 Mbit/s | ~47 bits | ISO 11898-1 |
| CAN 2.0B (Extended) | 29 | 8 | 1 Mbit/s | ~67 bits | ISO 11898-1 |
| CAN FD | 11 or 29 | 64 | 8 Mbit/s (data phase) | Variable | ISO 11898-1:2015 |
| CAN XL | 11 or 29 | 2048 | 20 Mbit/s | Variable | In development |

**CAN 2.0A** uses an 11-bit identifier, allowing 2,048 unique message IDs. Sufficient for simple systems.

**CAN 2.0B** extends the identifier to 29 bits (18 additional bits), allowing over 500 million unique message IDs. NMEA 2000 and J1939 both use CAN 2.0B because they need the extended address space to encode priority, PGN, source address, and destination into the 29-bit ID.

**CAN FD** is backward-compatible at the arbitration level but switches to a higher bit rate during the data phase. The data payload jumps from 8 bytes to up to 64 bytes. This is particularly important for firmware-over-the-air updates and high-bandwidth sensor data. CAN FD nodes and classical CAN nodes cannot coexist on the same bus segment without a gateway.

### 1.4 How Arbitration Works

CAN uses **Carrier Sense Multiple Access with Collision Detection and Arbitration on Message Priority (CSMA/CD+AMP)**. It is non-destructive — no data is ever lost during arbitration.

1. Any node can begin transmitting when the bus is idle.
2. If two or more nodes start transmitting simultaneously, they perform bit-by-bit arbitration during the ID field.
3. Each transmitting node reads back the bus state after sending each bit. Because dominant (0) overwrites recessive (1), a node sending a recessive bit will read back a dominant bit if another node is sending dominant.
4. The node that detects a mismatch (sent recessive, read dominant) immediately stops transmitting and switches to listening mode.
5. The node with the **lowest numeric ID** wins arbitration because it has more dominant (0) bits in the high-order positions.
6. The winning node continues transmitting without interruption — zero bus time is wasted on collisions.

This means **lower ID = higher priority**. In NMEA 2000, critical navigation data (e.g., rudder position, rate of turn) is assigned low PGN numbers so it wins arbitration over less time-sensitive data (e.g., environmental temperature).

### 1.5 Frame Types

| Frame Type | Purpose |
|------------|---------|
| **Data Frame** | Carries 0-8 bytes of data (0-64 in CAN FD) |
| **Remote Frame** | Requests data from another node (rarely used in practice) |
| **Error Frame** | Signals a detected error; forces bus-wide retransmission |
| **Overload Frame** | Requests a delay between frames (rarely used) |

A standard CAN data frame structure:

```
SOF | Arbitration Field (ID + RTR) | Control | Data (0-8 bytes) | CRC | ACK | EOF
 1       12 or 32 bits               6 bits    0-64 bits          16    2     7
```

### 1.6 Error Handling

CAN has five error detection mechanisms built into the protocol:

1. **Bit monitoring** — transmitter reads back each bit
2. **Bit stuffing** — after 5 consecutive identical bits, a stuff bit of opposite polarity is inserted
3. **CRC check** — 15-bit CRC on every frame
4. **Frame check** — fixed-form bits verified
5. **ACK check** — at least one receiver must acknowledge

Nodes track error counters. A node that accumulates too many errors transitions from Error Active to Error Passive to Bus Off, effectively disconnecting itself — a faulty node cannot permanently disrupt the bus.

---

## 2. Who Uses CAN Bus

### 2.1 Automotive

CAN bus was born in cars, and cars remain the largest market. A modern vehicle typically has **3-5 separate CAN buses**:

| Bus | Typical Speed | Connects |
|-----|---------------|----------|
| Powertrain CAN | 500 kbit/s | Engine ECU, transmission, ABS, traction control |
| Body CAN | 125-250 kbit/s | Lighting, windows, locks, mirrors, climate |
| Infotainment CAN | 500 kbit/s | Head unit, speakers, Bluetooth module, cameras |
| ADAS CAN | 500 kbit/s - 2 Mbit/s (CAN FD) | Radar, lidar, parking sensors, lane-keep assist |
| Diagnostic CAN | 500 kbit/s | OBD-II port (legally required in US since 2008, EU since 2001) |

**OBD-II** (On-Board Diagnostics II) is the standardised diagnostic interface that mechanics and DIY enthusiasts use to read fault codes. It runs on CAN bus (ISO 15765-4) and is accessible via the 16-pin OBD-II connector under the dashboard. Affordable OBD-II Bluetooth adapters (ELM327-based, ~$15-30) allow any smartphone to read engine data.

**Scale:** Over 1 billion CAN-enabled nodes are produced annually for automotive alone.

### 2.2 Marine

Marine is the domain most relevant to Above Deck. CAN bus appears in three primary roles on boats:

**NMEA 2000 (Instrument Bus):** The standard marine instrument network. Carries navigation data (GPS, depth, wind, heading, AIS), environmental data (temperature, humidity, barometric pressure), and system data (battery voltage, tank levels). Runs at 250 kbit/s on CAN 2.0B. Uses proprietary DeviceNet Micro-C connectors.

**SAE J1939 (Engine Bus):** Marine diesel engines (Cummins, Caterpillar, Volvo Penta, Yanmar) use J1939 — the same protocol used in trucks and heavy equipment. J1939 runs on CAN 2.0B at 250 kbit/s and defines PGNs for RPM, oil pressure, coolant temperature, fuel rate, exhaust temperature, and more. Maretron's J2K100 gateway bridges J1939 engine data to NMEA 2000.

**Digital Switching (CZone, Empirbus):** CAN-based systems that replace traditional circuit breaker panels with programmable digital switches. CZone (by Mastervolt/BEP) uses CAN bus to control lighting, pumps, windlasses, and other loads. Each output module sits near the loads it controls, reducing wiring runs. Configuration is done via a PC tool or MFD integration.

**Victron Energy (VE.Can):** Victron uses CAN bus for communication between its energy products — inverters, solar charge controllers, battery monitors, and BMS. VE.Can is physically CAN bus and can be bridged to NMEA 2000 for display on chart plotters. The Cerbo GX acts as a central hub, aggregating data from VE.Can, VE.Direct (serial), and VE.Bus devices.

**Typical catamaran CAN bus layout:**

```
Engine Bus (J1939)          Instrument Bus (NMEA 2000)          Switching Bus (CZone)
├── Port engine             ├── Chartplotter                    ├── Lighting zones
├── Stbd engine             ├── GPS                             ├── Pump controls
├── Genset                  ├── Depth transducer                ├── Windlass
└── J2K100 gateway ───────► ├── Wind instrument                 ├── Anchor light
                            ├── AIS transponder                 └── Horn relay
                            ├── Autopilot
Energy Bus (VE.Can)         ├── Heading sensor
├── Victron inverter        └── CZone bridge ◄──────────────────┘
├── MPPT solar chargers
├── Battery monitor
├── BMS
└── Cerbo GX ──────────────►
```

A well-equipped bluewater catamaran may have **3-4 physically separate CAN buses** bridged through gateways.

### 2.3 Industrial (CANopen / DeviceNet)

CAN bus is pervasive in factory automation, with two dominant higher-layer protocols:

**CANopen** (CiA 301): The European standard for industrial CAN. Used in ~90% of industrial CAN applications involving motion control. Defines device profiles for motors, I/O modules, encoders, and PLCs. Common in robotics, CNC machines, and medical equipment.

**DeviceNet**: The American counterpart, developed by Allen-Bradley (Rockwell Automation). Widely used in automotive manufacturing plants, semiconductor fabs, and chemical processing. DeviceNet runs at 125, 250, or 500 kbit/s.

### 2.4 Agricultural (ISOBUS)

**ISOBUS (ISO 11783)** standardises CAN bus communication between tractors and implements (seeders, sprayers, harvesters). A farmer can connect any ISOBUS-compatible implement to any ISOBUS-compatible tractor and have full control and monitoring from the cab display.

ISOBUS is built on J1939 and adds:
- Virtual terminal (universal display protocol)
- Task controller (prescription maps for variable-rate application)
- Auxiliary control (joysticks, buttons)
- File server (data logging)

Major manufacturers: John Deere, CLAAS, CNH Industrial, AGCO. ISOBUS is to agriculture what NMEA 2000 is to marine.

### 2.5 Aerospace (ARINC 825)

**ARINC 825** adapts CAN bus for airborne use. Developed by an AEEC working group including Airbus, Boeing, GE Aerospace, and Rockwell Collins, it adds higher-layer functions for aviation-specific requirements:

- Logical Communication Channels (LCC) for structured data exchange
- One-to-many (OTM) and peer-to-peer (PTP) communication modes
- Enhanced fault tolerance for extreme temperatures, vibration, and EMI
- Ultra-precise synchronisation for flight-critical systems

Applications include flight-state sensors, engine control systems (fuel pumps, actuators), navigation systems, and in-flight data acquisition. ARINC 825 coexists with ARINC 429 (the legacy unidirectional avionics bus) on modern aircraft.

### 2.6 Medical Equipment

CAN bus (primarily via CANopen) is the fieldbus of choice for major medical OEMs including GE Healthcare, Philips Medical, and Siemens Healthineers. Applications include:

- Operating room equipment (lights, tables, cameras)
- Imaging systems (CT scanners, X-ray, ultrasound)
- Patient monitoring networks
- Laboratory automation (sample handlers, analysers)

The medical market values CAN's deterministic timing, fault tolerance, and proven reliability from decades of automotive deployment.

### 2.7 EV, Solar, and Battery Management

CAN bus is the dominant communication interface for Battery Management Systems (BMS):

- **EV battery packs:** Cell voltage, temperature, state-of-charge, and state-of-health data flow over CAN from the BMS to the vehicle controller. Tesla, BMW, Nissan, and virtually every EV manufacturer uses CAN for BMS communication.
- **Solar inverters:** Hybrid inverters from Victron, SMA, Fronius, and GoodWe use CAN bus to communicate with lithium battery BMS systems. The BMS sends charge/discharge voltage and current limits; the inverter adjusts accordingly.
- **EV chargers:** CAN bus (via the Combined Charging System / CCS standard) handles communication between the vehicle and DC fast charger during charging sessions.
- **DIY battery builds:** LiFePO4 battery packs from EVE, CATL, and others expose CAN bus interfaces. Solar monitoring tools like SolarAssistant can read BMS data over CAN.

### 2.8 RV and Campervan

RV and campervan electrical systems are architecturally similar to marine systems — 12V DC power, lithium batteries, solar charging, and a need for monitoring. CAN bus appears in:

- **Victron VE.Can** for energy system monitoring (identical to marine installations)
- **Chassis CAN** for reading vehicle engine data (speed, RPM, fuel level) via the OBD-II port
- **CZone/Mastervolt** for digital switching (shared with marine product lines)
- **Custom automation** using ESP32 or Raspberry Pi to read/write CAN frames for lighting, tanks, heating, and ventilation

The overlap between marine and RV is substantial. Above Deck's CAN bus infrastructure is directly applicable to van life and off-grid builds.

---

## 3. CAN Bus Higher-Layer Protocol Comparison

All of these protocols share CAN bus as their physical/data-link layer but define different application-layer semantics:

| Protocol | Base | Speed | ID Format | Max Data | Domain | Standard |
|----------|------|-------|-----------|----------|--------|----------|
| NMEA 2000 | CAN 2.0B | 250 kbit/s | 29-bit (PGN-encoded) | 8 bytes (fast-packet to 223) | Marine | IEC 61162-3 |
| SAE J1939 | CAN 2.0B | 250 kbit/s | 29-bit (PGN-encoded) | 8 bytes (transport to 1785) | Trucks, engines, marine engines | SAE J1939 |
| CANopen | CAN 2.0A/B | Up to 1 Mbit/s | 11-bit (COB-ID) | 8 bytes | Industrial automation | CiA 301 |
| DeviceNet | CAN 2.0A | 125/250/500 kbit/s | 11-bit | 8 bytes | Factory automation | IEC 62026-3 |
| ISOBUS | CAN 2.0B (J1939) | 250 kbit/s | 29-bit (PGN-encoded) | 8 bytes (transport to 1785) | Agriculture | ISO 11783 |
| ARINC 825 | CAN 2.0B | Up to 1 Mbit/s | 29-bit | 8 bytes | Aerospace | ARINC 825 |
| OBD-II (ISO 15765) | CAN 2.0A/B | 250/500 kbit/s | 11 or 29-bit | 8 bytes | Automotive diagnostics | ISO 15765-4 |

The key insight: **CAN bus is a shared physical layer**. Code that can read and write raw CAN frames can interact with any of these protocols given the right application-layer decoder.

---

## 4. NMEA 2000 on CAN Bus (Marine Deep Dive)

### 4.1 Protocol Architecture

NMEA 2000 is built on top of SAE J1939, which is itself built on CAN 2.0B:

```
┌─────────────────────────────────┐
│  NMEA 2000 Application Layer    │  PGN definitions for marine data
├─────────────────────────────────┤
│  SAE J1939 Transport/Network    │  Multi-packet transport, address claiming
├─────────────────────────────────┤
│  CAN 2.0B Data Link Layer       │  29-bit IDs, 8-byte frames, arbitration
├─────────────────────────────────┤
│  CAN Physical Layer             │  Twisted pair, 250 kbit/s, DeviceNet connectors
└─────────────────────────────────┘
```

### 4.2 The 29-Bit Identifier Structure

NMEA 2000 encodes metadata into the CAN extended identifier:

```
Bits 28-26: Priority (0-7, lower = higher priority)
Bits 25-8:  PGN (Parameter Group Number) — identifies the message type
Bits 7-0:   Source Address (0-253, unique per device on the bus)
```

The PGN itself contains:
- **Reserved bit** (1 bit)
- **Data Page** (1 bit)
- **PDU Format** (8 bits) — determines if the message is broadcast or addressed
- **PDU Specific** (8 bits) — destination address (if addressed) or group extension (if broadcast)

### 4.3 Key PGNs

| PGN | Name | Update Rate | Data |
|-----|------|-------------|------|
| 127250 | Vessel Heading | 100ms | Heading, deviation, variation, reference |
| 128259 | Speed (Water) | 1s | Speed through water, ground referenced |
| 128267 | Water Depth | 1s | Depth below transducer, offset |
| 129025 | Position (Rapid) | 100ms | Latitude, longitude |
| 129026 | COG & SOG (Rapid) | 250ms | Course over ground, speed over ground |
| 130306 | Wind Data | 100ms | Wind speed, angle, reference (apparent/true) |
| 127488 | Engine Parameters (Rapid) | 100ms | RPM, boost pressure, tilt |
| 127489 | Engine Parameters (Dynamic) | 500ms | Oil pressure, temperature, fuel rate |
| 127508 | Battery Status | 1s | Voltage, current, temperature, SoC |
| 130312 | Temperature | 2s | Various temperature types and values |
| 127505 | Fluid Level | 2.5s | Tank type, level, capacity |
| 129038 | AIS Class A Position | Variable | MMSI, position, COG, SOG, heading |

NMEA 2000 defines over 200 standard PGNs. Manufacturers can also register proprietary PGNs for device-specific data.

### 4.4 Fast-Packet Protocol

Standard CAN frames carry only 8 bytes. Many NMEA 2000 messages exceed this limit (e.g., AIS data, product information, route waypoints). The **Fast-Packet** protocol splits large messages across multiple CAN frames:

- First frame: sequence counter (3 bits) + frame counter (5 bits) + total byte count + first 6 data bytes
- Subsequent frames: sequence counter + frame counter + 7 data bytes
- Maximum payload: 223 bytes across up to 32 frames

### 4.5 Marine CAN Bus Products

| Manufacturer | Product | Function | Approx. Price |
|-------------|---------|----------|---------------|
| Maretron | USB100 | NMEA 2000 to USB gateway | $300 |
| Maretron | J2K100 | J1939 engine to NMEA 2000 gateway | $500 |
| Actisense | NGT-1 | NMEA 2000 to USB/serial gateway | $250 |
| Actisense | W2K-1 | NMEA 2000 to WiFi gateway | $350 |
| Actisense | NGW-1 | NMEA 0183 to NMEA 2000 converter | $200 |
| CZone | COI | CZone Output Interface (6-channel digital switch) | $400 |
| CZone | MOI | CZone Meter Output Interface | $500 |
| Victron | Cerbo GX | Central monitoring hub with VE.Can | $350 |
| Victron | VE.Can to NMEA 2000 cable | Protocol bridge cable | $25 |
| Yacht Devices | YDNU-02 | NMEA 2000 to USB gateway | $110 |
| Digital Yacht | NavLink2 | NMEA 2000 to WiFi/USB gateway | $200 |

---

## 5. CAN Bus Hardware for Makers and DIY

### 5.1 CAN Controllers and Transceivers

A CAN interface requires two components:

1. **CAN Controller** — handles the protocol (framing, arbitration, error detection, bit timing). Either a standalone chip (MCP2515) or built into the microcontroller (ESP32, STM32).
2. **CAN Transceiver** — converts the controller's logic-level TX/RX signals to/from the differential CAN_H/CAN_L bus signals. Always needed as a separate chip.

| Component | Type | Interface | Voltage | Price | Notes |
|-----------|------|-----------|---------|-------|-------|
| MCP2515 | Standalone CAN controller | SPI | 5V (needs level shifter for 3.3V MCUs) | $1-2 | Most common DIY CAN controller. 1 Mbit/s max |
| MCP2551 | CAN transceiver | - | 5V | $1 | Classic high-speed transceiver. 1 Mbit/s |
| MCP2562 | CAN transceiver | - | 3.3V/5V | $1-2 | 3.3V logic compatible. Recommended for RPi/ESP32 |
| SN65HVD230 | CAN transceiver | - | 3.3V | $1 | Popular with ESP32 TWAI. 1 Mbit/s |
| TJA1050 | CAN transceiver | - | 5V | $0.50 | Common on cheap MCP2515 modules |
| TJA1051 | CAN transceiver (FD) | - | 3.3V/5V | $1-2 | CAN FD capable. 5 Mbit/s |

### 5.2 Microcontroller Platforms

| Platform | Built-in CAN | Additional Hardware | Software | Approx. Cost | Best For |
|----------|-------------|---------------------|----------|-------------|----------|
| **ESP32** (original/S3) | Yes (TWAI controller) | SN65HVD230 transceiver (~$1) | ESP-IDF TWAI driver, Arduino CAN library | $5-10 | Compact, wireless, low-power nodes |
| **Raspberry Pi 4/5** | No | CAN HAT (MCP2515-based) | SocketCAN (kernel driver) | $50-80 + $15-30 HAT | Full Linux, Go server, heavy processing |
| **Raspberry Pi Pico** | No | MCP2515 via SPI | MicroPython/C SDK | $4 + $5 module | Ultra-low-cost CAN node |
| **Arduino Uno/Mega** | No | MCP2515 CAN shield | arduino-CAN library | $10-25 + $5-15 shield | Prototyping, education |
| **STM32 (F4/H7)** | Yes (bxCAN/FDCAN) | CAN transceiver only | STM32 HAL, CAN FD support | $10-20 + $1 transceiver | Production embedded, CAN FD |
| **Teensy 4.x** | Yes (3x CAN, 1x CAN FD) | CAN transceiver only | FlexCAN_T4 library | $25-30 + $1 transceiver | Multi-bus monitoring, high performance |

### 5.3 Raspberry Pi CAN HATs

| HAT | Controller | Transceiver | CAN FD | Isolated | Channels | Price |
|-----|-----------|-------------|--------|----------|----------|-------|
| PiCAN-M (Copperhill) | MCP2515 | MCP2551 | No | No | 1 | $40-50 |
| PiCAN3 (SK Pang) | MCP2515 | MCP2551 | No | No | 1 | $35-45 |
| Waveshare 2-CH CAN HAT | 2x MCP2515 | 2x SN65HVD230 | No | Yes | 2 | $20-25 |
| Waveshare 2-CH CAN FD HAT | 2x MCP2518FD | 2x SN65HVD230 | Yes | Yes | 2 | $30-35 |
| Seeed Studio 2-CH CAN | MCP2515 | MCP2551 | No | No | 2 | $25 |
| InnoMaker USB-CAN Module | GS_USB firmware | SN65HVD230 | No | Optional | 1-2 | $20-40 |

For Above Deck's Raspberry Pi deployment target, the **Waveshare 2-CH CAN FD HAT** is the best option — two isolated channels (one for NMEA 2000, one for engine/Victron bus), CAN FD ready, SocketCAN compatible, under $35.

### 5.4 USB-CAN Adapters

| Adapter | Firmware/Protocol | CAN FD | OS Support | Open Source | Price |
|---------|-------------------|--------|------------|-------------|-------|
| **CANable 2.0** | candleLight (gs_usb) or slcan | Yes | Linux (SocketCAN), Mac, Win | Yes (hardware + firmware) | $35-40 |
| **PEAK PCAN-USB** | PEAK proprietary | No | Linux, Mac, Win | No | $250-300 |
| **PEAK PCAN-USB FD** | PEAK proprietary | Yes | Linux, Mac, Win | No | $400-500 |
| **USBtin** | slcan | No | Linux, Mac, Win | Yes | $30-40 |
| **Kvaser Leaf Light v2** | Kvaser proprietary | No | Linux, Win | No | $200 |
| **InnoMaker USB2CAN** | gs_usb | No | Linux (SocketCAN) | No | $20-30 |

For DIY/maker use, the **CANable 2.0** is the clear winner: open-source hardware and firmware, CAN FD support, native SocketCAN via candleLight firmware, USB-C, onboard termination, ~$35.

For professional marine work, the **Actisense NGT-1** or **Yacht Devices YDNU-02** are preferred because they handle NMEA 2000 protocol specifics (address claiming, fast-packet reassembly) in firmware.

---

## 6. Linux SocketCAN

### 6.1 Architecture

SocketCAN is the official Linux kernel subsystem for CAN bus. It treats CAN interfaces as network devices (like `eth0` or `wlan0`), making CAN frames accessible through the standard Berkeley socket API. This is a fundamentally different approach from Windows/Mac, where CAN adapters expose proprietary character device or USB APIs.

```
┌──────────────────────────────────────────┐
│  User Space (candump, cansend, Go app)   │
├──────────────────────────────────────────┤
│  Socket API (AF_CAN, SOCK_RAW)           │
├──────────────────────────────────────────┤
│  SocketCAN Core (can.ko, can-raw.ko)     │
├──────────────────────────────────────────┤
│  CAN Network Driver (mcp251x, gs_usb)   │
├──────────────────────────────────────────┤
│  Hardware (SPI, USB, built-in peripheral)│
└──────────────────────────────────────────┘
```

### 6.2 Setup

```bash
# Load kernel modules (usually automatic)
sudo modprobe can
sudo modprobe can-raw
sudo modprobe mcp251x   # For MCP2515-based HATs

# Configure the CAN interface
sudo ip link set can0 type can bitrate 250000   # 250 kbit/s for NMEA 2000
sudo ip link set can0 up

# Verify
ip -details link show can0

# For CAN FD:
sudo ip link set can0 type can bitrate 500000 dbitrate 2000000 fd on
```

### 6.3 can-utils Command-Line Tools

Install with `sudo apt-get install can-utils`. The essential tools:

| Tool | Purpose | Example |
|------|---------|---------|
| `candump` | Display received CAN frames | `candump can0` |
| `cansend` | Send a single CAN frame | `cansend can0 123#DEADBEEF` |
| `cangen` | Generate random CAN traffic | `cangen can0 -g 10 -I 42A -L 8` |
| `canplayer` | Replay logged CAN traffic | `canplayer -I logfile.log` |
| `cansniffer` | Show changing CAN data (delta view) | `cansniffer can0` |
| `candump -l` | Log CAN traffic to file | `candump -l can0` |
| `isotpsend` | Send ISO-TP (multi-frame) messages | `isotpsend -s 7E0 -d 7E8 can0` |
| `isotprecv` | Receive ISO-TP messages | `isotprecv -s 7E8 -d 7E0 can0` |

**Filtering:** candump supports hardware-level filters to reduce CPU load:

```bash
# Only show frames with ID 0x1F801 (NMEA 2000 PGN 127489 engine params from source 1)
candump can0,1F80100:1FFFF00

# Filter format: can_id:can_mask
# The mask specifies which bits of the ID must match
```

### 6.4 Virtual CAN for Development

SocketCAN supports virtual CAN interfaces for development without hardware:

```bash
sudo modprobe vcan
sudo ip link add dev vcan0 type vcan
sudo ip link set vcan0 up

# In terminal 1: listen
candump vcan0

# In terminal 2: send test frames
cansend vcan0 123#DEADBEEF
cangen vcan0 -g 100 -I 42A -L 8 -D r
```

This is invaluable for developing and testing CAN bus code without physical hardware.

---

## 7. CAN Bus + Go

### 7.1 Library Landscape

| Library | Focus | SocketCAN | CAN FD | DBC Code-Gen | Stars | Maintained |
|---------|-------|-----------|--------|---------------|-------|------------|
| [einride/can-go](https://github.com/einride/can-go) | Full CAN SDK | Yes | Yes | Yes | 229 | Active (Feb 2026) |
| [brutella/can](https://github.com/brutella/can) | Simple SocketCAN | Yes | No | No | ~80 | 2023 |
| [linklayer/go-socketcan](https://github.com/linklayer/go-socketcan) | SocketCAN bindings | Yes | No | No | ~30 | 2022 |
| [go-daq/canbus](https://github.com/go-daq/canbus) | Scientific CAN | Yes | No | No | ~30 | 2022 |
| [notnil/canbus](https://github.com/notnil/canbus) | Idiomatic CAN | Yes | No | No (CANopen sub-pkg) | ~15 | Sep 2025 |
| [angelodlfrtr/go-can](https://github.com/angelodlfrtr/go-can) | Multi-transport | Yes + serial | No | No | ~20 | 2022 |

### 7.2 einride/can-go Deep Dive

The clear choice for Above Deck. Production-grade, actively maintained, pure Go (99.4%).

**Reading CAN frames via SocketCAN:**

```go
package main

import (
    "fmt"
    "net"
    "go.einride.tech/can/pkg/socketcan"
)

func main() {
    conn, _ := socketcan.DialContext(context.Background(), "can", "can0")
    defer conn.Close()

    recv := socketcan.NewReceiver(conn)
    for recv.Receive() {
        frame := recv.Frame()
        fmt.Printf("ID: 0x%X Data: %X\n", frame.ID, frame.Data[:frame.Length])
    }
}
```

**DBC code generation:** The `cantool` CLI generates Go structs and marshal/unmarshal methods from `.dbc` files (the industry-standard CAN database format). This means you define your message layout once in a DBC file and get type-safe Go code:

```bash
go run go.einride.tech/can/cmd/cantool generate go mydb.dbc ./gen/
```

**Key capabilities:**
- SocketCAN and UDP multicast transports
- CAN FD support
- CAN frame receiver/transmitter patterns
- Signal-level encoding/decoding from DBC definitions
- 31 releases, v0.17.0 as of Feb 2026

### 7.3 NMEA 2000 from Go

Two approaches for reading NMEA 2000 data in Go:

**Approach 1: Raw CAN frames + CANboat PGN database**
1. Open a SocketCAN connection with einride/can-go
2. Read raw CAN frames (29-bit extended IDs)
3. Extract priority, PGN, source address from the 29-bit ID
4. Look up the PGN in the CANboat database (JSON format: `canboat.json`)
5. Decode the data bytes according to field definitions (bit offsets, scaling factors, units)

**Approach 2: Use a dedicated NMEA 2000 Go library**

| Library | Approach | PGN Coverage |
|---------|----------|-------------|
| [boatkit-io/n2k](https://github.com/boatkit-io/n2k) | Code-generated from canboat.json. Strongly typed Go structs per PGN | Broad (all canboat PGNs) |
| [aldas/go-nmea-client](https://github.com/aldas/go-nmea-client) | Reads from SocketCAN or Actisense USB adapters. Fast-packet assembly built in | Common navigation + engine PGNs |

**Recommended stack for Above Deck:**

```
einride/can-go          → SocketCAN frame I/O + CAN FD support
boatkit-io/n2k          → NMEA 2000 PGN encoding/decoding (code-gen from canboat)
canboat/canboat (JSON)  → PGN database for custom/proprietary PGN lookup
```

### 7.4 CANboat Integration

[CANboat](https://github.com/canboat/canboat) is the open-source Rosetta Stone for NMEA 2000. It provides:

- **canboat.json / canboat.xml**: Machine-readable PGN definitions including field names, bit offsets, resolution, units, and enumeration values. Covers 200+ standard PGNs plus proprietary PGNs from Navico, Garmin, Raymarine, Airmar, and Furuno.
- **analyzer**: C program that decodes raw NMEA 2000 frames to human-readable output
- **actisense-serial**: Reader for Actisense NGT-1 gateway serial protocol
- **canboatjs**: TypeScript/Node.js library (used by SignalK)

For a Go server, the JSON database is the critical asset. It can be embedded at compile time and used for runtime PGN lookup and decoding, eliminating any dependency on the C analyzer or Node.js.

---

## 8. Why CAN Bus Matters for Above Deck

### 8.1 Beyond Marine

CAN bus mastery positions Above Deck for expansion beyond boats:

| Domain | CAN Protocol | Shared Infrastructure |
|--------|-------------|----------------------|
| Marine instruments | NMEA 2000 | CAN frame I/O, PGN decoding, SocketCAN |
| Marine engines | J1939 | Same PGN structure as NMEA 2000 (shared heritage) |
| Victron energy | VE.Can | Same CAN physical layer, Victron-specific PGNs |
| RV/Campervan | VE.Can + OBD-II + CZone | Identical to marine energy + automotive diagnostics |
| Off-grid solar | CAN BMS | BMS PGNs for battery state, inverter control |
| Van life | All of the above | 12V/24V systems are architecturally identical to boats |

A Go CAN bus library that handles raw frame I/O, protocol decoding, and SocketCAN integration is foundational infrastructure. The application-layer decoders (NMEA 2000, J1939, Victron, BMS) are thin layers on top.

### 8.2 Bypassing Node.js

The dominant open-source marine data server today is SignalK, which is built on Node.js and uses canboatjs for NMEA 2000 parsing. Above Deck's Go backend can access CAN bus directly via SocketCAN — no Node.js runtime, no canboatjs, no intermediary processes.

**SignalK path (current open-source standard):**
```
CAN HAT → SocketCAN → actisense-serial (C) → canboatjs (Node.js) → SignalK (Node.js) → WebSocket → UI
```

**Above Deck path (Go-native):**
```
CAN HAT → SocketCAN → einride/can-go (Go) → PGN decoder (Go) → WebSocket → UI
```

Fewer moving parts, single binary deployment, lower memory footprint on Raspberry Pi, and no Node.js dependency.

### 8.3 CAN FD: Future-Proofing

NMEA 2000 currently runs at 250 kbit/s with 8-byte frames. As marine electronics evolve (high-resolution radar data, camera feeds, detailed BMS telemetry), the 250 kbit/s limit will become a bottleneck. CAN FD (up to 8 Mbit/s, 64-byte frames) is the likely upgrade path.

By building on einride/can-go (which supports CAN FD) and choosing CAN FD-capable hardware (Waveshare CAN FD HAT, CANable 2.0), Above Deck is ready for next-generation marine buses without architectural changes.

### 8.4 Hardware Recommendation for Development

**Minimum viable CAN bus development kit for Above Deck:**

| Item | Purpose | Price |
|------|---------|-------|
| Raspberry Pi 4/5 | Go server runtime | $50-80 |
| Waveshare 2-CH CAN FD HAT | Dual CAN bus interface (NMEA 2000 + engine/Victron) | $30-35 |
| CANable 2.0 | USB-CAN for laptop development and debugging | $35-40 |
| 120-ohm resistors (x4) | Bus termination | $1 |
| Micro-C NMEA 2000 cable + T-connector | Connect to boat's instrument bus | $30-50 |
| **Total** | | **~$150-200** |

For software development without hardware, SocketCAN's `vcan` virtual interface allows full end-to-end testing with simulated CAN traffic.

---

## 9. Glossary

| Term | Definition |
|------|-----------|
| **Arbitration** | The process by which CAN nodes compete for bus access without collisions |
| **BMS** | Battery Management System — monitors cell voltages, temperatures, and balances cells |
| **CAN FD** | CAN with Flexible Data-Rate — 64-byte payloads at up to 8 Mbit/s |
| **CAN_H / CAN_L** | The two differential signal wires of a CAN bus |
| **COB-ID** | Communication Object Identifier — CANopen term for CAN frame ID |
| **DBC** | Database CAN — industry-standard file format for describing CAN message layouts |
| **Dominant** | Logical 0 on CAN bus; overwrites recessive during arbitration |
| **Drop cable** | Short cable connecting a device to the CAN backbone |
| **ECU** | Electronic Control Unit — a CAN-connected computer module |
| **Fast-Packet** | NMEA 2000 protocol for sending messages larger than 8 bytes across multiple frames |
| **Gateway** | Device that bridges between two CAN buses or between CAN and another protocol |
| **J1939** | SAE standard for CAN bus in heavy vehicles and marine engines |
| **PGN** | Parameter Group Number — identifies the type of message in NMEA 2000 / J1939 |
| **Recessive** | Logical 1 on CAN bus; can be overwritten by dominant |
| **SocketCAN** | Linux kernel subsystem that exposes CAN interfaces as network devices |
| **Transceiver** | Chip that converts logic-level signals to/from differential CAN bus signals |
| **TWAI** | Two-Wire Automotive Interface — ESP32's name for its built-in CAN controller |
| **vcan** | Virtual CAN interface in Linux for testing without hardware |

---

## Sources

- [CAN bus - Wikipedia](https://en.wikipedia.org/wiki/CAN_bus)
- [The Controller Area Network CAN — Bosch](https://www.bosch.com/stories/the-controller-area-network/)
- [CAN Bus Unplugged: Origins, Growth, and Future — Copperhill Technologies](https://copperhilltech.com/blog/can-bus-unplugged-a-deep-dive-into-its-origins-growth-and-future/)
- [History of CAN Technology — CAN in Automation (CiA)](https://www.can-cia.org/can-knowledge/history-of-can-technology)
- [CAN FD vs CAN 2.0 — Grid Connect](https://www.gridconnect.com/blogs/news/can-fd-the-next-big-fast-thing)
- [Understanding CAN FD vs CAN — NI](https://www.ni.com/en/shop/seamlessly-connect-to-third-party-devices-and-supervisory-system/understanding-can-with-flexible-data-rate--can-fd-.html)
- [CAN FD - Wikipedia](https://en.wikipedia.org/wiki/CAN_FD)
- [NMEA 2000 - Wikipedia](https://en.wikipedia.org/wiki/NMEA_2000)
- [Exploring the NMEA 2000 Protocol — Embien](https://www.embien.com/automotive-insights/exploring-the-nmea-2000-protocol)
- [NMEA 2000 and CAN Bus — CANboat DeepWiki](https://deepwiki.com/canboat/canboat/3.1-nmea-2000-and-can-bus)
- [Understanding PGNs: NMEA 2000 and J1939 — Actisense](https://actisense.com/news/understanding-pgns-nmea-2000-and-j1939/)
- [NMEA 2000 PGNs Deciphered — Endige Boating](https://endige.com/2050/nmea-2000-pgns-deciphered/)
- [CAN Bus Arbitration — Copperhill Technologies](https://copperhilltech.com/blog/controller-area-network-can-bus-bus-arbitration/)
- [Controller Area Network Overview — NI](https://www.ni.com/en/shop/seamlessly-connect-to-third-party-devices-and-supervisory-system/controller-area-network--can--overview.html)
- [CAN Bus Applications — Copperhill Technologies](https://copperhilltech.com/blog/can-bus-tutorial-typical-can-bus-applications/)
- [CANopen Explained — CSS Electronics](https://www.csselectronics.com/pages/canopen-tutorial-simple-intro)
- [ISO 11783 (ISOBUS) - Wikipedia](https://en.wikipedia.org/wiki/ISO_11783)
- [ARINC 825 Standard Explained — Sital Technology](https://sitaltech.com/arinc-825-standard-explained-breaking-down-the-basics/)
- [ARINC 825 — arinc-825.com](https://www.arinc-825.com/)
- [einride/can-go — GitHub](https://github.com/einride/can-go)
- [aldas/go-nmea-client — GitHub](https://github.com/aldas/go-nmea-client)
- [boatkit-io/n2k — Go Packages](https://pkg.go.dev/github.com/boatkit-io/n2k)
- [canboat/canboat — GitHub](https://github.com/canboat/canboat)
- [linux-can/can-utils — GitHub](https://github.com/linux-can/can-utils)
- [CANable — Open-Source USB to CAN Adapter](https://canable.io/)
- [candleLight Firmware — GitHub](https://github.com/candle-usb/candleLight_fw)
- [Raspberry Pi CAN Bus: SocketCAN Setup — AutoPi](https://www.autopi.io/blog/raspberry-pi-can-bus-explained/)
- [Adding CAN to the Raspberry Pi — Beyond Logic](https://www.beyondlogic.org/adding-can-controller-area-network-to-the-raspberry-pi/)
- [How to Use SocketCAN in Linux — mbedded.ninja](https://blog.mbedded.ninja/programming/operating-systems/linux/how-to-use-socketcan-with-the-command-line-in-linux/)
- [CAN Bus BMS Communication Specification — EVWest](https://www.evwest.com/support/CAN%20Bus%20Communication%20Spec.pdf)
- [CAN Bus Setup with SolarAssistant](https://solar-assistant.io/help/battery/canbus)
- [Victron VE.Can to CAN-bus BMS Cables](https://www.victronenergy.com/live/battery_compatibility:can-bus_bms-cable)
- [Digital Switching: Controlling Your Yacht — Yachting Monthly](https://www.yachtingmonthly.com/gear/digital-switching-controlling-your-yacht-from-your-phone-90929)
- [NMEA 2000 DBC File — CSS Electronics](https://www.csselectronics.com/products/nmea-2000-dbc-file-pgn-database)
- [CAN Bus Explained (2025) — AutoPi](https://www.autopi.io/blog/can-bus-explained/)
