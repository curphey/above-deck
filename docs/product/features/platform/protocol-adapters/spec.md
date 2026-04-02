# Protocol Adapters — Feature Specification

**Date:** 2026-03-31
**Status:** Draft v1
**Layer:** OS Platform Service (Spoke)
**Dependencies:** Data Model, SQLite
**References:** [Technical Architecture](../../../above-deck-technical-architecture.md) section 10, [Product Vision](../../../above-deck-product-vision-v2.md) sections 7-8, [Boat Systems Monitoring](../../../research/domain/boat-systems-monitoring.md), [CAN Bus Technology](../../../research/hardware/can-bus-technology.md)

---

## 1. Overview

Protocol adapters are the spoke's hardware abstraction layer. They sit between physical data sources (gateways, sensors, devices) and the unified data model. Every byte of boat data enters the system through a protocol adapter.

Apps never talk to hardware. AI agents never parse NMEA sentences. The data model never knows whether a voltage reading came from a Victron VE.Direct connection, an NMEA 2000 PGN, or a DIY ESP32 sensor. Protocol adapters handle all of that.

Design principles:

- **Gateway-first** — the spoke does not talk to CAN bus or serial ports directly (in most cases). Dedicated marine gateways (iKonvert, NavLink2, Cerbo GX) handle electrical complexity and expose clean TCP/UDP/serial streams. Adapters parse these streams.
- **Observe-only by default** — adapters read data. Write access (autopilot commands, digital switching) is an explicit opt-in per adapter, per device, requiring user confirmation.
- **Resilient** — adapters handle disconnection, reconnection, corrupt data, and protocol errors without crashing the process. A failed adapter does not affect other adapters.
- **Discoverable** — the system auto-discovers data sources on the local network and USB bus where possible. Manual configuration is always available as a fallback.

---

## 2. Adapter Interface

Every protocol adapter implements a common Go interface.

```go
// Adapter is the interface that all protocol adapters implement.
type Adapter interface {
    // Info returns metadata about this adapter.
    Info() AdapterInfo

    // Connect establishes the connection to the data source.
    // Called by the adapter manager during startup or when a new source is discovered.
    // Must be non-blocking — starts internal goroutines for reading.
    Connect(ctx context.Context, config AdapterConfig) error

    // Disconnect gracefully shuts down the adapter.
    // Stops internal goroutines, closes connections.
    Disconnect() error

    // HealthCheck returns the current health status of the adapter.
    HealthCheck() HealthStatus

    // SupportsWrite returns true if this adapter supports writing to the data source.
    SupportsWrite() bool

    // Write sends a command to the data source (if supported).
    // Returns error if writes are not supported or not enabled.
    Write(cmd WriteCommand) error
}

type AdapterInfo struct {
    ID          string      // Unique identifier: "nmea2000-ikonvert-usb0"
    Type        string      // Adapter type: "nmea0183", "nmea2000", "victron-vedirect", etc.
    Name        string      // Human-readable: "NMEA 2000 via iKonvert on /dev/ttyUSB0"
    Version     string      // Adapter code version
    Source      string      // Connection string: "tcp://192.168.1.100:10110", "/dev/ttyUSB0"
    Transport   string      // "tcp", "udp", "serial", "websocket", "mqtt"
    Writable    bool        // Whether writes are enabled (user opt-in)
}

type AdapterConfig struct {
    // Common fields
    Source      string            // Connection string
    Transport   string            // Transport type
    Options     map[string]string // Adapter-specific options

    // Instance mapping — maps protocol-specific device/instance IDs to data model IDs
    Instances   map[string]string // e.g., {"battery.0": "house", "battery.1": "start"}

    // Write control
    WriteEnabled bool
    WriteDevices []string         // Which specific devices/paths are write-enabled

    // Reconnection
    ReconnectInterval   time.Duration
    MaxReconnectBackoff time.Duration
}

type HealthStatus struct {
    State           AdapterState    // connected, connecting, disconnected, error
    LastDataAt      time.Time       // When was the last valid data received
    MessagesTotal   int64           // Total messages parsed since connect
    ErrorsTotal     int64           // Total parse/protocol errors since connect
    DroppedTotal    int64           // Messages dropped (malformed, unknown PGN, etc.)
    Uptime          time.Duration   // Time since last successful connect
    Error           string          // Current error message (if State == error)
    BytesReceived   int64           // Total bytes received
}

type AdapterState int
const (
    StateDisconnected AdapterState = iota
    StateConnecting
    StateConnected
    StateError
)

type WriteCommand struct {
    Path    string          // Data model path being targeted
    Value   interface{}     // Value to write
    Device  string          // Target device identifier
}
```

### Adapter Manager

The adapter manager is a service within the Go binary that:

1. Loads adapter configurations from `config/adapters.yaml`
2. Runs auto-discovery (section 4)
3. Instantiates and connects adapters
4. Monitors adapter health via periodic `HealthCheck()` calls
5. Triggers reconnection when an adapter enters `StateError` or `StateDisconnected`
6. Exposes adapter status via the API (for the admin UI)

```go
type AdapterManager interface {
    // Lifecycle
    StartAll(ctx context.Context) error
    StopAll() error

    // Individual adapter control
    Start(id string) error
    Stop(id string) error
    Restart(id string) error

    // Status
    List() []AdapterInfo
    Health(id string) HealthStatus
    HealthAll() map[string]HealthStatus

    // Discovery
    Discover() []DiscoveredSource

    // Configuration
    AddAdapter(config AdapterConfig) error
    RemoveAdapter(id string) error
    UpdateAdapter(id string, config AdapterConfig) error
}
```

---

## 3. Adapter Specifications

### 3.1 NMEA 0183

The legacy marine data protocol. Still widely used for GPS, AIS, autopilot, and as a bridged output from NMEA 2000 gateways.

**Transport options:**

| Transport | Source | Port | Notes |
|-----------|--------|------|-------|
| TCP client | WiFi gateways (WLN30, NavLink2 in 0183 mode) | 10110 (standard) | Persistent connection, reconnect on drop |
| UDP listener | Some gateways broadcast | 10110 | Stateless, listen for datagrams |
| Serial | USB-serial adapters, direct wired connections | /dev/ttyUSB*, /dev/ttyACM* | 4800 baud (standard), 38400 baud (high-speed AIS/GPS) |

**Sentence parsing:**

NMEA 0183 sentences are ASCII text lines starting with `$` or `!` and ending with `*XX` checksum.

```
$GPGGA,123456.00,4807.038,N,01131.000,E,1,08,0.9,545.4,M,47.0,M,,*47
$IIRMC,123456.00,A,4807.038,N,01131.000,E,5.2,045.0,230326,003.1,W*6A
$IIDBT,031.2,f,009.5,M,005.1,F*2D
$IIMWV,045.0,R,12.5,N,A*1B
!AIVDM,1,1,,B,177KQJ5000G?tO`K>RA1wUbN0TKH,0*5C
```

**Sentence types parsed:**

| Sentence | Data | Data Model Path |
|----------|------|----------------|
| GGA | Position, fix quality, satellites, HDOP | `navigation/position/*` |
| RMC | Position, speed, course, date/time | `navigation/position/*`, `navigation/speed/over_ground`, `navigation/course/over_ground` |
| GLL | Position | `navigation/position/*` |
| VTG | Course and speed over ground | `navigation/course/over_ground`, `navigation/speed/over_ground` |
| HDG | Heading, deviation, variation | `navigation/heading/*` |
| HDM/HDT | Magnetic/true heading | `navigation/heading/magnetic`, `navigation/heading/true` |
| DBT/DBS/DBK | Depth | `navigation/depth/*` |
| MWV | Wind angle and speed | `navigation/wind/*` |
| MWD | Wind direction and speed (true) | `navigation/wind/direction_true`, `navigation/wind/true_speed` |
| MTW | Water temperature | `environment/outside/sea_temperature` |
| MDA | Meteorological composite | `environment/outside/*` |
| VHW | Water speed and heading | `navigation/speed/through_water` |
| VLW | Distance log | `navigation/log/*` |
| RSA | Rudder angle | `steering/rudder/*/angle` |
| XTE | Cross-track error | `navigation/course/cross_track_error` |
| APB | Autopilot sentence B | `navigation/autopilot/*` |
| VDM/VDO | AIS messages | `ais/vessels/*` (via AIS decoder) |
| XDR | Transducer measurements (generic) | Various, depends on transducer type and instance |

**Checksum validation:** Every sentence must pass the XOR checksum. Sentences that fail are counted as errors and discarded.

**Talker IDs:** The two-letter talker ID (`GP`, `II`, `HE`, `AI`, etc.) is logged for diagnostics but does not affect parsing — a heading from `$HEHDT` is treated identically to one from `$IIHDT`.

**Write support:**

Autopilot commands via NMEA 0183:
- `$XXAPB` — autopilot sentence B (course to steer)
- Proprietary sentences for specific autopilot brands (Raymarine `$STALK`, B&G, etc.)

Write is disabled by default. When enabled, the adapter validates commands against the target device before transmitting.

### 3.2 NMEA 2000

The modern marine instrument network. CAN 2.0B at 250 kbit/s. The spoke reads NMEA 2000 data through USB or WiFi gateways — it does not connect to the CAN bus directly.

**Supported gateways:**

| Gateway | Transport | Protocol | Bidirectional | Price |
|---------|-----------|----------|---------------|-------|
| Digital Yacht iKonvert USB | USB serial (/dev/ttyUSB*) | iKonvert ASCII (proprietary framing around raw PGN data) | Yes | ~$190 |
| Digital Yacht NavLink2 | TCP (port 2000) | SeaSmart (NMEA 0183 encapsulated PGN data, `$PCDIN` sentences) | Yes (via TCP) | ~$240 |
| Yacht Devices YDWG-02 | TCP (port 1457) or UDP | YDWG raw CAN frame format | Read-only | ~$115 |
| Actisense NGT-1 | USB serial | Actisense EBL/BST binary protocol | Yes | ~$250 |
| Actisense W2K-1 | TCP/WiFi | Actisense binary protocol | Yes | ~$350 |

Each gateway has its own framing protocol around the underlying CAN data. The NMEA 2000 adapter auto-detects the gateway type based on the data format.

**CAN frame parsing:**

Regardless of gateway, the adapter must extract the 29-bit CAN extended identifier and 0-8 byte data field from each frame.

From the 29-bit identifier:
```
Bits 28-26: Priority (0-7)
Bits 25-8:  PGN (Parameter Group Number)
Bits 7-0:   Source Address (0-253)
```

The PGN determines what data is in the frame. The source address identifies which device sent it.

**PGN decoding:**

| PGN | Name | Fields | Data Model Mapping |
|-----|------|--------|--------------------|
| 127250 | Vessel Heading | heading (rad), deviation, variation, reference | `navigation/heading/*` |
| 128259 | Speed (Water Referenced) | speed through water, ground referenced | `navigation/speed/through_water` |
| 128267 | Water Depth | depth below transducer, offset, range | `navigation/depth/*` |
| 129025 | Position (Rapid Update) | latitude, longitude (1e-7 degree resolution) | `navigation/position/*` |
| 129026 | COG & SOG (Rapid Update) | COG, SOG, COG reference | `navigation/course/over_ground`, `navigation/speed/over_ground` |
| 130306 | Wind Data | wind speed, angle, reference (apparent/true/ground) | `navigation/wind/*` |
| 127488 | Engine Parameters (Rapid) | RPM, boost pressure, tilt/trim | `propulsion/engines/{id}/rpm` |
| 127489 | Engine Parameters (Dynamic) | oil pressure, coolant temp, exhaust temp, fuel rate, hours | `propulsion/engines/{id}/*` |
| 127493 | Transmission Parameters | gear, oil pressure, oil temp | `propulsion/transmissions/{id}/*` |
| 127505 | Fluid Level | type (fuel/water/waste/etc.), instance, level %, capacity | `tanks/{type}/{id}/level` |
| 127506 | DC Detailed Status | SID, instance, type, SOC, SOH, time remaining, ripple V | `electrical/batteries/{id}/*` |
| 127508 | Battery Status | instance, voltage, current, temperature | `electrical/batteries/{id}/*` |
| 127501 | Binary Switch Bank Status | bank instance, switch states (up to 28 switches) | `switching/circuits/{id}/state` |
| 127502 | Switch Bank Control | bank instance, switch commands | Write target for digital switching |
| 130312 | Temperature | SID, instance, source (sea/cabin/engine room/etc.), temperature | `environment/{location}/temperature` |
| 130316 | Extended Temperature | SID, instance, source, temperature, humidity | `environment/{location}/*` |
| 129038 | AIS Class A Position Report | MMSI, position, SOG, COG, heading, ROT, nav status | `ais/vessels/{mmsi}/*` |
| 129039 | AIS Class B Position Report | MMSI, position, SOG, COG, heading | `ais/vessels/{mmsi}/*` |
| 129794 | AIS Class A Static Data | MMSI, IMO, callsign, name, ship type, dimensions | `ais/vessels/{mmsi}/*` |
| 129809/129810 | AIS Class B Static Data | MMSI, name, callsign, ship type, dimensions | `ais/vessels/{mmsi}/*` |
| 60928 | ISO Address Claim | NAME field (64-bit unique device identifier) | `equipment/devices/{id}/nmea2000_name` |
| 126996 | Product Information | NMEA 2000 version, product code, model, software version, serial | `equipment/devices/{id}/*` |
| 59904 | ISO Request | Request a specific PGN from a device | Used during device enumeration |
| 126720 | Proprietary | Manufacturer-specific data (CZone, EmpirBus, etc.) | Decoded if known, otherwise logged |

**Field decoding:**

NMEA 2000 fields are packed into the 8-byte CAN payload as bit fields. The decoder must handle:

- Unsigned integers of varying bit widths (1 to 32 bits)
- Signed integers (two's complement)
- Fixed-point decimal values (integer value * resolution + offset)
- Lookup tables (enum values defined per PGN)
- Reserved fields and "data not available" sentinel values (all 1s for the field width)
- String fields (ASCII, padded)

Example — PGN 129025 (Position, Rapid Update):
```
Bytes 0-3: Latitude  (int32, resolution 1e-7 degrees, positive = N)
Bytes 4-7: Longitude (int32, resolution 1e-7 degrees, positive = E)
```

PGN definitions are loaded from a PGN database file (JSON or YAML), not hardcoded. This allows updates without code changes and supports community contributions of proprietary PGN definitions.

**Fast-packet reassembly:**

PGNs with payloads exceeding 8 bytes use the fast-packet protocol. The adapter maintains a reassembly buffer keyed by `(source_address, PGN)`:

1. First frame: extract sequence counter (bits 7-5 of byte 0), frame counter (bits 4-0, must be 0), total byte count (byte 1), and first 6 data bytes
2. Subsequent frames: same sequence counter, incrementing frame counter, 7 data bytes each
3. When all frames received (total bytes satisfied), decode the reassembled payload
4. Timeout incomplete packets after 750ms (PGN-dependent, but 750ms is conservative)
5. If a new sequence counter is seen before the previous packet is complete, discard the incomplete packet

Fast-packet PGNs include: AIS messages (129038-129810), Product Information (126996), Route/WP data (various), and many others.

**Instance mapping:**

NMEA 2000 uses numeric instance numbers to distinguish between multiple devices of the same type (battery bank 0 vs. battery bank 1, fuel tank 0 vs. fuel tank 1). The adapter applies the instance mapping from the configuration to translate these to meaningful data model IDs:

```
PGN 127508, instance 0 → electrical/batteries/house/voltage
PGN 127508, instance 1 → electrical/batteries/start/voltage
PGN 127505, fluid_type=fuel, instance 0 → tanks/fuel/port/level
PGN 127505, fluid_type=fuel, instance 1 → tanks/fuel/starboard/level
PGN 127505, fluid_type=water, instance 0 → tanks/freshwater/port/level
```

If an instance has no mapping configured, it falls back to the numeric ID (`electrical/batteries/0/voltage`).

**Write support:**

When write access is enabled, the adapter can send PGNs to the CAN bus via the gateway:

| PGN | Purpose | Use Case |
|-----|---------|----------|
| 127502 | Switch Bank Control | Digital switching (CZone, EmpirBus) — turn lights on/off, control pumps |
| 65361-65379 | Autopilot commands | Raymarine, B&G, Simrad autopilot control (proprietary PGNs) |
| 126208 | NMEA Command/Request | Request data, command group function |
| 59904 | ISO Request | Request specific PGN from a device |

Write commands are validated before transmission:
1. The target device must be on the write-enabled device list
2. The PGN must be in the allowed-write PGN list
3. The value must be within the field's valid range
4. A confirmation log entry is written for every write command

### 3.3 Victron VE.Direct

Point-to-point serial connection to individual Victron devices. Used when there is no Cerbo GX, or for direct access to devices not connected to a GX.

**Transport:** Serial, 19200 baud, 8N1.

**Physical connection:** VE.Direct-to-USB cable (Victron ASS030530010) or VE.Direct-to-USB interface (various).

**Protocol:** The VE.Direct text protocol is a continuous stream of key-value pairs, one per line, separated by tabs. A block starts with a line and ends with a `Checksum` line.

```
PID     0xA060
FW      161
SER#    HQ2132ABCDE
V       26410           ← Battery voltage in mV
I       -1200           ← Battery current in mA (negative = discharging)
VPV     42310           ← Panel voltage in mV
PPV     185             ← Panel power in W
CS      3               ← Charge state: 0=Off, 2=Fault, 3=Bulk, 4=Absorption, 5=Float
MPPT    2               ← Tracker state: 0=Off, 1=Voltage/current limited, 2=MPPT
ERR     0               ← Error code
LOAD    ON              ← Load output state
H19     12345           ← Yield total (0.01 kWh)
H20     234             ← Yield today (0.01 kWh)
H21     567             ← Maximum power today (W)
H22     230             ← Yield yesterday (0.01 kWh)
H23     540             ← Maximum power yesterday (W)
HSDS    42              ← Day sequence number
Checksum  [binary byte]
```

**Device detection by PID:**

| PID Range | Device Type | Data Model Prefix |
|-----------|-------------|-------------------|
| 0xA040-0xA06F | SmartSolar MPPT | `electrical/solar/{id}/` |
| 0xA381-0xA38F | SmartShunt / BMV | `electrical/batteries/{id}/` |
| 0xA201-0xA26F | Phoenix Inverter | `electrical/inverters/{id}/` |
| 0xA340-0xA35F | Blue Smart Charger | `electrical/chargers/{id}/` |
| 0xA290-0xA29F | Orion Smart DC-DC | `electrical/chargers/{id}/` |

**Field mapping (SmartSolar MPPT example):**

| VE.Direct Key | Data Model Path | Conversion |
|---------------|----------------|------------|
| `V` | `electrical/batteries/{id}/voltage` | mV to V (divide by 1000) |
| `I` | `electrical/batteries/{id}/current` | mA to A (divide by 1000) |
| `VPV` | `electrical/solar/{id}/voltage` | mV to V |
| `PPV` | `electrical/solar/{id}/power` | direct (watts) |
| `CS` | `electrical/solar/{id}/controller_mode` | numeric to enum |
| `H20` | `electrical/solar/{id}/daily_yield` | 0.01 kWh to Wh (multiply by 10) |
| `SOC` | `electrical/batteries/{id}/state_of_charge` | 0.1% to % (divide by 10) |
| `TTG` | `electrical/batteries/{id}/time_remaining` | minutes direct |
| `CE` | Consumed energy | mAh (informational) |
| `AR` | Alarm reason bitmap | Mapped to `notifications/alerts/` |

**Multiple devices:** Each VE.Direct port connects to one device. If the boat has three MPPT controllers and a SmartShunt, that requires four USB ports (or a Cerbo GX, which has 3-4 built-in VE.Direct ports). The adapter creates one instance per connected device, each with its own goroutine for serial reading.

**Write support:** VE.Direct supports limited write via HEX protocol commands (register reads/writes). This is used for configuration, not real-time control. The adapter does not expose write functionality — VE.Direct devices are read-only for monitoring purposes.

### 3.4 Victron MQTT

Reads data from a Victron Cerbo GX (Venus OS) via its built-in MQTT broker. This is the preferred Victron integration path when a Cerbo GX is installed.

**Transport:** MQTT over TCP, default port 1883 (no TLS on local network). The Cerbo GX runs a Mosquitto broker.

**Connection:**

1. Connect to the Cerbo's MQTT broker
2. Read the portal ID from `N/{portal_id}/system/0/Serial`
3. Send keepalive: publish empty message to `R/{portal_id}/keepalive` every 30 seconds (required, or the GX stops publishing)
4. Subscribe to `N/{portal_id}/#` for all data

**Topic structure:**

```
N/{portal_id}/battery/{instance}/Dc/0/Voltage          → battery voltage (V)
N/{portal_id}/battery/{instance}/Dc/0/Current           → battery current (A)
N/{portal_id}/battery/{instance}/Soc                     → state of charge (%)
N/{portal_id}/battery/{instance}/Dc/0/Temperature        → temperature (C)
N/{portal_id}/solarcharger/{instance}/Dc/0/Voltage      → PV voltage
N/{portal_id}/solarcharger/{instance}/Dc/0/Current      → PV current
N/{portal_id}/solarcharger/{instance}/Yield/Power        → PV power (W)
N/{portal_id}/solarcharger/{instance}/Yield/User         → daily yield (kWh)
N/{portal_id}/solarcharger/{instance}/State              → charge state
N/{portal_id}/vebus/{instance}/Ac/ActiveIn/L1/V          → AC input voltage
N/{portal_id}/vebus/{instance}/Ac/ActiveIn/L1/I          → AC input current
N/{portal_id}/vebus/{instance}/Ac/Out/L1/V               → AC output voltage
N/{portal_id}/vebus/{instance}/Ac/Out/L1/P               → AC output power
N/{portal_id}/vebus/{instance}/Dc/0/Voltage              → DC voltage
N/{portal_id}/vebus/{instance}/State                     → inverter/charger state
N/{portal_id}/system/0/Dc/Battery/Voltage                → system battery voltage
N/{portal_id}/system/0/Dc/Battery/Current                → system battery current
N/{portal_id}/system/0/Dc/Battery/Soc                    → system SOC
N/{portal_id}/tank/{instance}/Level                      → tank level (%)
N/{portal_id}/tank/{instance}/Capacity                   → tank capacity (m3)
N/{portal_id}/tank/{instance}/FluidType                  → 0=fuel, 1=water, 2=waste, etc.
N/{portal_id}/gps/0/Position/Latitude                    → GPS latitude
N/{portal_id}/gps/0/Position/Longitude                   → GPS longitude
```

**Value format:** Each MQTT message contains a JSON payload: `{"value": 26.41}`. Some values are numeric, some are strings, some are enums.

**Victron state enums:**

| State Code | Charger State | Inverter State |
|------------|---------------|----------------|
| 0 | Off | Off |
| 1 | Low power | Low power |
| 2 | Fault | Fault |
| 3 | Bulk | — |
| 4 | Absorption | — |
| 5 | Float | — |
| 9 | Inverting | Inverting |

**Write support:** Venus OS supports writes via MQTT by publishing to `W/{portal_id}/{path}` topics. This is not enabled in the adapter by default. Potential use cases include switching between inverter modes or adjusting charge parameters — these are advanced operations with safety implications.

### 3.5 AIS

AIS (Automatic Identification System) data arrives via NMEA 0183 sentences (`!AIVDM` and `!AIVDO`) or via NMEA 2000 PGNs (129038-129810). This adapter handles the NMEA 0183 path. NMEA 2000 AIS is handled by the NMEA 2000 adapter.

**Sources:**

| Source | Transport | Notes |
|--------|-----------|-------|
| VHF radio with AIS receiver | NMEA 0183 serial/TCP | Built into many modern VHFs |
| Dedicated AIS transponder | NMEA 0183 serial/TCP | Class A or Class B |
| AIS-catcher (RTL-SDR) | UDP (default port 10110) | Software AIS receiver using $30 SDR dongle |
| NavLink2 (bridged from N2K) | TCP | If AIS transponder is on the NMEA 2000 network |

**AIVDM sentence structure:**

```
!AIVDM,1,1,,B,177KQJ5000G?tO`K>RA1wUbN0TKH,0*5C
       │ │ │ │ └─ payload (6-bit ASCII armoured)
       │ │ │ └── channel (A or B)
       │ │ └── sequence number (for multi-sentence)
       │ └── sentence number
       └── total sentences in message
```

The payload is decoded from 6-bit ASCII armoured encoding into a binary bitstream, then parsed according to the AIS message type (first 6 bits of payload).

**AIS message types decoded:**

| Type | Name | Key Data | Update to |
|------|------|----------|-----------|
| 1, 2, 3 | Position Report (Class A) | MMSI, nav status, ROT, SOG, position, COG, heading | `ais/vessels/{mmsi}/*` |
| 5 | Static & Voyage (Class A) | MMSI, IMO, callsign, name, ship type, dimensions, draught, destination, ETA | `ais/vessels/{mmsi}/*` |
| 18 | Position Report (Class B) | MMSI, SOG, position, COG, heading | `ais/vessels/{mmsi}/*` |
| 19 | Extended Position (Class B) | MMSI, SOG, position, COG, heading, name, ship type, dimensions | `ais/vessels/{mmsi}/*` |
| 21 | Aid to Navigation | MMSI, name, type, position, dimensions | `ais/vessels/{mmsi}/*` |
| 24 | Class B Static Data (Part A/B) | MMSI, name, callsign, ship type, dimensions | `ais/vessels/{mmsi}/*` |

**Multi-sentence messages:** Types 5, 19, 24 can span multiple `!AIVDM` sentences. The adapter reassembles them using the sentence count, sequence number, and sentence number fields.

**CPA/TCPA calculation:** For each tracked vessel, the adapter calculates Closest Point of Approach (CPA) and Time to CPA (TCPA) relative to own vessel position and course. These are written to `ais/vessels/{mmsi}/cpa` and `ais/vessels/{mmsi}/tcpa`. Negative TCPA indicates vessels are diverging.

**Vessel expiry:** AIS targets that have not been updated within 30 minutes (configurable) are removed from the data model. This prevents stale targets from accumulating.

**Write support:** None. AIS is receive-only. Transmitting AIS data requires a certified transponder.

### 3.6 SignalK

Connects to an existing SignalK server and reads data into the Above Deck data model. This is how Above Deck coexists with boats that already have a SignalK installation (typically on a Raspberry Pi with iKommunicate or other gateways).

**Transport:** WebSocket client connecting to `ws://{host}:3000/signalk/v1/stream`.

**Connection sequence:**

1. HTTP GET to `http://{host}:3000/signalk` to retrieve server info and endpoint URLs
2. Open WebSocket to the stream endpoint
3. Send subscription message:
   ```json
   {
     "context": "vessels.self",
     "subscribe": [
       {"path": "*", "period": 1000}
     ]
   }
   ```
4. Receive delta messages and map to data model

**Delta message format:**

```json
{
  "context": "vessels.urn:mrn:imo:mmsi:123456789",
  "updates": [{
    "source": {"label": "NMEA2000-1", "type": "NMEA2000", "pgn": 127508, "src": "22"},
    "timestamp": "2026-03-31T10:30:00.000Z",
    "values": [
      {"path": "electrical.batteries.house.voltage", "value": 26.41},
      {"path": "electrical.batteries.house.current", "value": -12.5}
    ]
  }]
}
```

**Path mapping:** Uses the bidirectional SignalK mapping table defined in the data model spec (section 6). The adapter converts SignalK paths and SI units to Above Deck paths and display units.

**Write support:** SignalK supports PUT requests for writable paths:
```
PUT /signalk/v1/api/vessels/self/steering/autopilot/state
{"value": "auto"}
```

When write is enabled, the adapter sends PUT requests to the SignalK server, which in turn sends the appropriate NMEA 2000 PGN to the CAN bus via its gateway.

### 3.7 SDR (Software-Defined Radio)

Receives radio signals via an RTL-SDR USB dongle and external software decoders. The adapter does not talk to the SDR hardware directly — it reads the output of decoder software.

**Sources:**

| Decoder | Signal | Output | Transport | Data Model |
|---------|--------|--------|-----------|------------|
| AIS-catcher | AIS (162 MHz) | NMEA 0183 sentences | UDP (port 10110) | `ais/vessels/*` (via AIS decoder) |
| fldigi | Weather fax (HF) | Image files | Filesystem watch | Stored as files, surfaced in weather app |
| YanD / Frisnit | NAVTEX (518/490 kHz) | Text messages | UDP or file | `notifications/alerts/` for safety messages |

**AIS-catcher integration:**

AIS-catcher runs as a separate process (or container) and outputs decoded AIS data as NMEA 0183 sentences via UDP. The SDR adapter listens on the configured UDP port and feeds sentences to the AIS decoder (section 3.5). From the data model's perspective, SDR AIS and VHF AIS are identical — they produce the same data model paths.

**Configuration:**

```yaml
adapters:
  - type: sdr
    transport: udp
    source: "0.0.0.0:10110"
    options:
      decoder: ais-catcher
```

**Write support:** None. SDR is receive-only.

### 3.8 IP Camera

Integrates IP cameras for visual monitoring (engine room, cockpit, stern, mast).

**Protocols:**

| Protocol | Purpose | Notes |
|----------|---------|-------|
| RTSP | Live video stream | Standard for IP cameras. URL format: `rtsp://user:pass@host:554/stream1` |
| ONVIF | Discovery and control | Industry standard for IP camera management. Device info, stream URLs, PTZ control |
| HTTP snapshot | Still images | Periodic JPEG snapshots for bandwidth-constrained situations |

**Adapter behaviour:**

The camera adapter does not decode video frames. It:

1. Discovers cameras via ONVIF device discovery (WS-Discovery multicast)
2. Retrieves stream URLs via ONVIF media service
3. Validates RTSP connectivity (TCP handshake, DESCRIBE request)
4. Publishes camera metadata to the data model: `cameras/feeds/{id}/url`, `cameras/feeds/{id}/status`, etc.
5. Periodically checks camera health (RTSP OPTIONS request)
6. Optionally captures JPEG snapshots at configurable intervals for the admin UI thumbnail

The frontend connects to RTSP streams directly (via a browser-compatible transport like HLS or WebRTC, transcoded by a lightweight media proxy if needed).

**Write support:** PTZ (Pan-Tilt-Zoom) control via ONVIF is a future consideration. Not in initial scope.

### 3.9 BLE Sensors

Bluetooth Low Energy sensors (temperature, humidity, pressure, tank level) integrated via NMEA 2000 gateways, not via direct BLE.

**Integration path:**

```
BLE Sensors → NAVLink Blue (BLE→N2K gateway) → NMEA 2000 backbone → NavLink2/iKonvert → Spoke
```

or

```
Victron BLE devices → veLink (BLE→N2K gateway) → NMEA 2000 backbone → NavLink2/iKonvert → Spoke
```

In both cases, the BLE data appears as standard NMEA 2000 PGNs and is handled by the NMEA 2000 adapter. There is no separate BLE adapter — the gateways do the BLE-to-N2K translation.

**Supported gateway products:**

| Gateway | Bridges | PGNs Produced |
|---------|---------|---------------|
| Digital Yacht NAVLink Blue | Generic BLE sensors (temperature, humidity, tank, battery) | 130312, 130316, 127505, 127508 |
| Digital Yacht veLink | Victron SmartShunt, SmartSolar MPPT, Blue Smart chargers | 127508, 127506, plus Victron-specific |
| Mopeka Pro Check (via SensESP gateway) | Ultrasonic LPG/fuel tank sensors | Custom or 127505 |

**Future consideration:** Direct BLE scanning from the spoke (via the host system's Bluetooth radio) could eliminate the need for BLE-to-N2K gateways. This is deferred — gateway-based integration is simpler and more reliable.

### 3.10 MQTT (DIY)

Integrates custom sensors built with ESP32 or similar microcontrollers that publish data via MQTT.

**Transport:** MQTT over TCP. The spoke runs its own MQTT broker (embedded Mosquitto or Go-native MQTT broker) or connects to an external broker on the boat LAN.

**Topic convention:**

```
abovedeck/{location}/{sensor_type}/{instance}
```

Examples:
```
abovedeck/bilge/port/temperature         → {"value": 22.5, "unit": "celsius"}
abovedeck/bilge/port/water_detected      → {"value": true}
abovedeck/engine_room/temperature        → {"value": 45.2, "unit": "celsius"}
abovedeck/lazarette/humidity             → {"value": 78.0, "unit": "percent"}
abovedeck/custom/flow_meter/watermaker   → {"value": 42.0, "unit": "lph"}
```

**Message format:** JSON with `value` field required and optional `unit` and `timestamp` fields. If no timestamp is provided, the adapter uses the receive time.

**Topic-to-path mapping:** Users configure the mapping in `config/adapters.yaml`:

```yaml
adapters:
  - type: mqtt-diy
    transport: mqtt
    source: "tcp://localhost:1883"
    options:
      mappings:
        - topic: "abovedeck/bilge/port/temperature"
          path: "environment/inside/bilge_port/temperature"
          type: float64
        - topic: "abovedeck/bilge/port/water_detected"
          path: "notifications/alerts/bilge_port_water"
          type: bool
        - topic: "abovedeck/engine_room/temperature"
          path: "environment/inside/engine_room/temperature"
          type: float64
```

For paths not already in the built-in schema, the adapter auto-registers them with the data model (see data model spec, section 8).

**Write support:** Bidirectional. The adapter can publish to MQTT topics to control ESP32 relay outputs or other actuators. Write commands from the data model are translated to MQTT publish messages using a configured reverse-mapping.

---

## 4. Auto-Discovery

The spoke attempts to find data sources on the boat network automatically. Discovery results are presented to the user for confirmation — nothing is auto-connected without user approval (prevents accidental connections to neighbouring boats on marina WiFi).

### Discovery Methods

**mDNS / Bonjour:**

Scans for advertised services on the local network.

| Service Type | Device |
|-------------|--------|
| `_signalk-ws._tcp` | SignalK server (WebSocket) |
| `_signalk-http._tcp` | SignalK server (HTTP) |
| `_http._tcp` (filtered) | Web-based gateways, Cerbo GX |
| `_mqtt._tcp` | MQTT brokers (Victron Cerbo, DIY) |

**UDP broadcast scan:**

Listens for and sends UDP probes for common gateway protocols.

| Port | Protocol | Gateway |
|------|----------|---------|
| 10110 | NMEA 0183 | Standard NMEA 0183 TCP/UDP port |
| 2000 | SeaSmart | Digital Yacht NavLink2 |
| 1457 | YDWG | Yacht Devices YDWG-02 |
| 10110 | AIS NMEA | AIS-catcher, AIS receivers |

**USB device enumeration:**

Scans `/dev/ttyUSB*` and `/dev/ttyACM*` for connected serial devices.

| USB VID:PID | Device | Adapter Type |
|-------------|--------|-------------|
| 0403:6015 | Digital Yacht iKonvert | NMEA 2000 |
| 0403:6001 | FTDI serial (VE.Direct, Actisense) | Victron VE.Direct or NMEA 2000 |
| 1A86:7523 | CH340 serial (common USB-serial adapter) | Probe required |
| 0BDA:2838 | RTL-SDR | SDR |

For unidentified serial devices, the adapter manager sends probe bytes to detect the protocol (iKonvert responds to a specific initialisation sequence, VE.Direct devices send continuous text blocks at 19200 baud, etc.).

**NMEA 2000 device enumeration:**

When an NMEA 2000 gateway is connected, the adapter broadcasts:

1. **ISO Request (PGN 59904)** requesting **Address Claim (PGN 60928)** — every device on the bus must respond with its 64-bit ISO NAME, which encodes manufacturer code, device class, device function, and unique ID
2. **ISO Request (PGN 59904)** requesting **Product Information (PGN 126996)** — devices respond with NMEA 2000 certification level, product code, model ID, serial number, software version, and hardware version

This populates `equipment/devices/` in the data model and feeds the firmware tracker. The enumeration runs on first connection and periodically (hourly) to detect new devices added to the bus.

**ONVIF camera discovery:**

WS-Discovery multicast probe on port 3702. Cameras that support ONVIF respond with their service URLs.

### Discovery UI

The admin UI presents discovered sources as a list:

```
Discovered Data Sources
──────────────────────────────────────────────────────
[NMEA 2000]  iKonvert USB on /dev/ttyUSB0         [Connect]
[NMEA 2000]  NavLink2 at 192.168.1.100:2000       [Connect]
[Victron]    Cerbo GX MQTT at 192.168.1.50:1883   [Connect]
[SignalK]    SignalK server at 192.168.1.200:3000  [Connect]
[AIS]        AIS-catcher UDP on port 10110         [Connect]
[Camera]     Reolink RLC-510A at 192.168.1.150     [Connect]
[Camera]     Tapo C200 at 192.168.1.151            [Connect]
──────────────────────────────────────────────────────
```

The user selects which sources to connect. Instance mappings (battery 0 = "house", tank 0 = "port fuel") are configured after connection when the adapter reports what instances it has found.

---

## 5. Bidirectional Communication

Most adapters are read-only. The following adapters support writing to external devices:

| Adapter | Write Capability | Use Cases |
|---------|-----------------|-----------|
| NMEA 2000 | PGN transmission via gateway | Digital switching (CZone/EmpirBus), autopilot control |
| NMEA 0183 | Sentence transmission | Autopilot waypoint steering |
| SignalK | PUT requests to SignalK server | Any writable SignalK path |
| MQTT DIY | Publish to MQTT topics | ESP32 relay control, custom actuators |
| Victron MQTT | Publish to `W/` topics | Inverter mode switching (advanced) |

### Write Safety Model

All write operations follow a strict safety model:

1. **Disabled by default** — every adapter starts in read-only mode
2. **Per-device opt-in** — the user must explicitly enable write access for each specific device or circuit
3. **Allowed-PGN/path whitelist** — only specific PGNs or paths can be written. No wildcard write access
4. **Value validation** — every write command is validated against the path's type and range
5. **Audit logging** — every write command is logged with timestamp, source, target, and value
6. **Rate limiting** — write commands are rate-limited per device (e.g., no more than 10 switch commands per second)
7. **Emergency stop** — a master kill switch in the admin UI disables all write access instantly

### Autopilot Write Flow

```
User taps "Engage Autopilot" in MFD
    │
    ├── Frontend sends WebSocket command
    │
    ├── API validates user permission
    │
    ├── Data model receives write request to navigation/autopilot/state = "auto"
    │
    ├── Adapter manager routes to the NMEA 2000 adapter
    │
    ├── Adapter translates to appropriate PGN (manufacturer-specific)
    │   - Raymarine: PGN 65379 (proprietary)
    │   - B&G/Simrad: PGN 65361 (proprietary)
    │   - Generic: PGN 126208 (NMEA Command)
    │
    ├── PGN sent to gateway → CAN bus → autopilot
    │
    ├── Autopilot responds with status PGN
    │
    └── Adapter reads response, updates data model
```

### Digital Switching Write Flow

```
User taps "Anchor Light ON" in MFD
    │
    ├── Frontend sends WebSocket command
    │
    ├── API validates: is switching/circuits/anchor_light in write-enabled list?
    │
    ├── Data model receives write request to switching/circuits/anchor_light/state = true
    │
    ├── Adapter translates to PGN 127502 (Switch Bank Control)
    │   - Bank instance: mapped from circuit ID
    │   - Switch index: mapped from circuit ID
    │   - State: ON
    │
    ├── PGN sent to gateway → CAN bus → CZone/EmpirBus output module
    │
    ├── Output module switches the physical relay
    │
    ├── Output module broadcasts PGN 127501 (Switch Bank Status) confirming new state
    │
    └── Adapter reads confirmation, updates data model
```

---

## 6. Error Handling

### Reconnection Logic

When a connection drops, the adapter enters `StateDisconnected` and begins exponential backoff reconnection:

```
Attempt 1: wait 1 second
Attempt 2: wait 2 seconds
Attempt 3: wait 4 seconds
Attempt 4: wait 8 seconds
...
Maximum backoff: 60 seconds (configurable via MaxReconnectBackoff)
```

On successful reconnection:
1. Reset backoff to initial interval
2. Re-initialise protocol state (clear fast-packet reassembly buffers, re-subscribe to MQTT topics, etc.)
3. Log reconnection event
4. Adapter state returns to `StateConnected`

The adapter manager tracks disconnection frequency. If an adapter disconnects more than 10 times in 5 minutes, it is flagged for user attention in the admin UI.

### Data Quality Indicators

Each value written to the data model carries a quality indicator:

| Quality | Meaning | When Set |
|---------|---------|----------|
| `Good` | Normal operation, value within expected range | Default for all valid received values |
| `Stale` | No update received within expected interval | Set by data model's stale detector |
| `Suspect` | Value received but outside normal range or from a source with recent errors | Out-of-range but valid type, or adapter error rate > 5% |
| `Bad` | Source reported error, or value failed validation | Checksum failure, protocol error, type mismatch |

### Parse Error Handling

| Error Type | Handling |
|-----------|----------|
| Checksum failure (NMEA 0183) | Discard sentence, increment error counter |
| Malformed sentence | Discard, increment error counter, log first occurrence |
| Unknown PGN (NMEA 2000) | Log at debug level (many proprietary PGNs are unknown), do not count as error |
| Fast-packet reassembly timeout | Discard incomplete packet, increment dropped counter |
| VE.Direct block checksum failure | Discard entire block, increment error counter |
| MQTT disconnect | Reconnect with backoff |
| SignalK WebSocket close | Reconnect with backoff, re-subscribe |
| Value out of range | Accept value, mark quality as `Suspect` |
| Value type mismatch | Reject value, increment error counter |

### Adapter Health Dashboard

The admin UI displays:

- Adapter state (connected/disconnected/error)
- Time since last data received
- Total messages parsed
- Error rate (errors / total messages)
- Dropped message count
- Bytes received
- Uptime since last connection

---

## 7. Testing

### NMEA Simulator

For development and testing without a boat, the project includes an NMEA simulator that generates realistic data.

**Software simulators:**

| Simulator | Generates | Transport | Notes |
|-----------|-----------|-----------|-------|
| Built-in Go simulator | NMEA 0183 sentences | TCP server on configurable port | Generates position, heading, speed, wind, depth with configurable variation and patterns |
| Built-in Go simulator | NMEA 2000 PGNs | Simulated iKonvert output on virtual serial port | Generates engine, battery, tank, and navigation PGNs |
| Digital Yacht iKreate | NMEA 2000 PGNs | USB (acts as a real NMEA 2000 gateway) | Hardware simulator (~$240) — useful for gateway protocol testing |

**Built-in simulator capabilities:**

```go
type SimulatorConfig struct {
    // Navigation
    StartPosition   [2]float64  // [lat, lng]
    CourseTrue      float64     // degrees
    SpeedOverGround float64     // knots
    Depth           float64     // metres
    WindSpeed       float64     // knots apparent
    WindAngle       float64     // degrees apparent

    // Electrical
    BatteryVoltage  float64     // volts
    BatteryCurrent  float64     // amps
    SolarPower      float64     // watts
    ShoreConnected  bool

    // Propulsion
    EngineRPM       float64
    EngineCoolant   float64     // celsius

    // Tanks
    FuelLevel       float64     // percent
    WaterLevel      float64     // percent

    // Variation
    NoisePercent    float64     // random variation (0-100%)
    DriftEnabled    bool        // values drift over time (battery discharges, fuel decreases)
}
```

The simulator runs as a component within the Go binary (enabled by a flag or environment variable). It writes directly to the data model via the same `Set()` interface that real adapters use, or optionally exposes a TCP/serial server so it can be tested via the actual adapter pipeline.

### Recorded Data Replay

For integration testing against real-world data:

1. **Recording mode** — any adapter can be put into recording mode, which saves all raw incoming bytes to a timestamped file in `/data/recordings/`
2. **Replay mode** — recorded files can be replayed through the adapter at original speed, accelerated, or single-stepped
3. **Format** — each recording is a binary file with `[timestamp (int64 ns)] [length (uint32)] [data (bytes)]` per message

This allows developers to test against real NMEA 2000 data from a boat without being on the boat.

### Protocol Adapter Test Suite

Each adapter has unit tests that cover:

| Test Category | What's Tested |
|--------------|---------------|
| Sentence/frame parsing | Known-good and known-bad inputs, edge cases |
| Checksum validation | Valid and invalid checksums |
| PGN decoding | Every supported PGN with known test vectors |
| Fast-packet reassembly | Complete, incomplete, out-of-order, timeout |
| Instance mapping | Numeric instance to named ID translation |
| Unit conversion | VE.Direct mV-to-V, SignalK radians-to-degrees, etc. |
| Reconnection | Simulated disconnections and reconnection behaviour |
| AIS decoding | All supported message types with ITU test vectors |
| Data quality | Out-of-range values, stale detection |
| Write validation | Valid and invalid write commands, safety checks |

Test data files are stored in `packages/api/testdata/` organised by adapter type.

### Integration Test Environment

```
docker compose -f docker-compose.test.yml up
```

This starts:
- The Go binary with all adapters enabled
- A TCP server emitting NMEA 0183 sentences
- A virtual serial port emitting VE.Direct data
- An MQTT broker with simulated Victron topics
- A SignalK server with test data
- An AIS-catcher simulator emitting AIS sentences via UDP

Integration tests verify end-to-end data flow from simulated source through adapter to data model to WebSocket output.

---

## 8. Configuration

Adapters are configured via `/config/adapters.yaml`:

```yaml
adapters:
  # NMEA 2000 via iKonvert USB
  - type: nmea2000
    id: nmea2000-ikonvert
    transport: serial
    source: /dev/ttyUSB0
    options:
      gateway: ikonvert
      baud: 230400
    write_enabled: true
    write_devices:
      - czone-output-1       # CZone switching module
    instances:
      battery.0: house
      battery.1: start
      tank.fuel.0: port
      tank.fuel.1: starboard
      tank.water.0: port
      tank.water.1: starboard
      engine.0: port
      engine.1: starboard

  # NMEA 2000 via NavLink2 WiFi
  - type: nmea2000
    id: nmea2000-navlink2
    transport: tcp
    source: 192.168.1.100:2000
    options:
      gateway: seasmart

  # Victron via Cerbo GX MQTT
  - type: victron-mqtt
    id: victron-cerbo
    transport: mqtt
    source: tcp://192.168.1.50:1883
    instances:
      battery.0: house
      solarcharger.0: port_arch
      solarcharger.1: starboard_arch

  # VE.Direct to SmartShunt
  - type: victron-vedirect
    id: victron-smartshunt
    transport: serial
    source: /dev/ttyUSB1
    options:
      baud: 19200
    instances:
      device: house    # maps this VE.Direct device to the "house" battery

  # AIS from AIS-catcher SDR
  - type: ais
    id: ais-sdr
    transport: udp
    source: 0.0.0.0:10110

  # SignalK server
  - type: signalk
    id: signalk-local
    transport: websocket
    source: ws://192.168.1.200:3000/signalk/v1/stream

  # IP Camera
  - type: camera
    id: camera-engine-room
    transport: rtsp
    source: rtsp://admin:password@192.168.1.150:554/stream1
    options:
      name: Engine Room
      snapshot_interval: 30s

  # DIY MQTT sensors
  - type: mqtt-diy
    id: mqtt-bilge-sensors
    transport: mqtt
    source: tcp://localhost:1883
    options:
      mappings:
        - topic: sensors/bilge/port/temp
          path: environment/inside/bilge_port/temperature
          type: float64
        - topic: sensors/bilge/starboard/temp
          path: environment/inside/bilge_starboard/temperature
          type: float64
        - topic: sensors/engine_room/temp
          path: environment/inside/engine_room/temperature
          type: float64

# Auto-discovery settings
discovery:
  enabled: true
  interval: 5m          # re-scan every 5 minutes
  mdns: true
  udp_scan: true
  usb_scan: true
  onvif: true
  nmea2000_enum: true   # enumerate devices on N2K bus when connected

# Global reconnection settings
reconnection:
  initial_interval: 1s
  max_backoff: 60s
  max_retries: 0        # 0 = infinite
```

---

## 9. Adapter Lifecycle

```
┌──────────────────────────────────────────────────────────────────┐
│                    Adapter Manager Startup                        │
│                                                                  │
│  1. Load adapter configs from adapters.yaml                      │
│  2. Run auto-discovery                                           │
│  3. Present discovered sources to user (first run only)          │
│  4. Instantiate configured adapters                              │
│  5. Call Connect() on each adapter (concurrent)                  │
│  6. Start health check loop (every 10 seconds)                   │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                    Adapter Running                                │
│                                                                  │
│  ┌─────────────┐     ┌──────────────┐     ┌─────────────────┐   │
│  │   Gateway    │────►│   Adapter    │────►│   Data Model    │   │
│  │ (TCP/Serial) │     │  goroutine   │     │    Set()        │   │
│  └─────────────┘     │              │     └─────────────────┘   │
│                      │  Parse →     │                            │
│                      │  Validate →  │                            │
│                      │  Map →       │                            │
│                      │  Set()       │                            │
│                      └──────────────┘                            │
│                                                                  │
│  Health Check Loop:                                              │
│    - Check HealthCheck() on each adapter                         │
│    - If disconnected → trigger reconnect                         │
│    - If error rate high → log warning                            │
│    - Expose status via API                                       │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                    Adapter Shutdown                               │
│                                                                  │
│  1. Call Disconnect() on each adapter (concurrent)               │
│  2. Wait for all adapter goroutines to exit (with timeout)       │
│  3. Log final health status for each adapter                     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```
