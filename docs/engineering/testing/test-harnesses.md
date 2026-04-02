# Protocol Test Harness Specification

**Date:** 2026-03-31
**Status:** Draft v1
**Parent:** [Testing Specification](./testing.md)
**References:** [Protocol Adapters Spec](../../features/platform/protocol-adapters/spec.md), [Technical Architecture](../../above-deck-technical-architecture.md)

---

## 1. Overview

Protocol test harnesses are first-class infrastructure, not afterthoughts bolted onto unit tests. Every protocol adapter (CAN/NMEA 2000, NMEA 0183, Victron, AIS) has a corresponding test harness that provides three capabilities:

1. **Generate** — construct valid protocol data from structured inputs. Build CAN frames from PGN definitions, NMEA 0183 sentences from field values, VE.Direct blocks from device state, AIS messages from vessel parameters.

2. **Replay** — play back recorded real-world data at real-time speed, accelerated, or as fast as possible. Test against actual data captured from production boats.

3. **Verify** — confirm that adapters decode data correctly, handle errors gracefully, and never crash on malformed input. Every adapter must survive the fuzzer.

Harnesses are Go packages. They are used in three contexts:

- **Unit tests** — imported directly into `_test.go` files alongside adapter code
- **Integration tests** — run as standalone processes feeding data into the spoke binary over TCP/serial/MQTT
- **CI pipeline** — Docker Compose orchestrates spoke + simulators + message brokers

All test harness code is open source, MIT-licensed, and ships in the main repository.

### Design Principles

- Harnesses implement the same transport layer as real hardware. An NMEA 0183 test server listens on TCP port 10110 just like a NavLink2. A VE.Direct simulator writes to a virtual serial port. The adapter under test does not know it is talking to a simulator.
- Every generated message is protocol-correct by default. The fuzzer is a separate layer that intentionally breaks things.
- Harnesses are deterministic when given a seed. Same seed, same sequence of messages, same timestamps (relative).
- No external dependencies beyond the Go standard library, `golang.org/x/sys` (for Linux socket control), and `socat` (for virtual serial ports).

---

## 2. CAN / NMEA 2000 Harness

### 2.1 CAN Frame Generator

A Go library that constructs valid CAN 2.0B extended frames from high-level inputs.

```go
package can

// Frame represents a CAN 2.0B extended frame.
type Frame struct {
    ID   uint32 // 29-bit extended identifier
    Data []byte // 0-8 bytes
    DLC  uint8  // Data length code
}

// EncodeID builds the 29-bit CAN ID from NMEA 2000 fields.
func EncodeID(priority uint8, pgn uint32, source uint8) uint32

// DecodeID extracts priority, PGN, and source from a 29-bit CAN ID.
func DecodeID(id uint32) (priority uint8, pgn uint32, source uint8)

// Builder constructs CAN frames for specific PGNs.
type Builder struct {
    pgnDB *PGNDatabase
}

// BuildFrame creates a single CAN frame from PGN number and field values.
// Returns error if the PGN is unknown or field values are out of range.
func (b *Builder) BuildFrame(pgn uint32, source uint8, fields map[string]interface{}) (Frame, error)

// BuildFastPacket creates a sequence of CAN frames for multi-frame PGNs.
// Handles sequence counter, frame numbering, and payload splitting.
func (b *Builder) BuildFastPacket(pgn uint32, source uint8, fields map[string]interface{}) ([]Frame, error)
```

**ID encoding** follows the NMEA 2000 specification:

```
Bits 28-26: Priority (3 bits, 0-7, lower = higher priority)
Bits 25-17: PGN high byte and PDU Format
Bits 16-8:  PDU Specific (destination for PDU1, group extension for PDU2)
Bits 7-0:   Source Address
```

PDU1 PGNs (PDU Format < 240) are destination-addressed. PDU2 PGNs (PDU Format >= 240) are broadcast. The builder handles this distinction automatically.

**Field packing** mirrors real NMEA 2000 encoding:

- Unsigned integers packed at arbitrary bit widths (1-32 bits)
- Signed integers in two's complement
- Fixed-point decimals: `raw_value = (physical_value - offset) / resolution`
- "Data not available" sentinel values (all 1s for the field width)
- Lookup/enum fields validated against the PGN database

Example usage:

```go
builder := can.NewBuilder(pgndatabase.Load())

// Single-frame PGN: Battery Status
frame, err := builder.BuildFrame(127508, 42, map[string]interface{}{
    "instance":    0,
    "voltage":     12.85,
    "current":     -3.2,
    "temperature": 293.15, // Kelvin
})
// frame.ID = 0x09F21429 (priority 2, PGN 127508, source 42)
// frame.Data = [0x00, 0xA2, 0x32, 0xC0, 0xFE, 0xD8, 0x4C, 0xFF]

// Multi-frame PGN: Product Information
frames, err := builder.BuildFastPacket(126996, 42, map[string]interface{}{
    "nmea2000_version": 2100,
    "product_code":     1234,
    "model_id":         "Above Deck Spoke",
    "software_version": "1.0.0",
    "model_version":    "1.0",
    "serial_code":      "AD-001",
})
// Returns 20+ frames with correct sequence counters and frame numbering
```

### 2.2 Virtual CAN Bus

**Linux (primary target):** Uses the kernel's `vcan` module to create virtual CAN interfaces. This is the real SocketCAN stack — the same API used by production CAN adapters.

```bash
# Setup script (requires root, run once per boot)
sudo modprobe vcan
sudo ip link add dev vcan0 type vcan
sudo ip link set up vcan0

# Verify
ip link show vcan0
# vcan0: <NOARP,UP,LOWER_UP> mtu 72 qdisc noqueue state UNKNOWN
```

Go code writes frames to `vcan0` via SocketCAN:

```go
package vcan

import (
    "golang.org/x/sys/unix"
)

// Bus represents a virtual CAN bus.
type Bus struct {
    fd   int
    name string
}

// Open opens a SocketCAN connection to a vcan interface.
func Open(ifname string) (*Bus, error)

// Send writes a CAN frame to the virtual bus.
func (b *Bus) Send(frame can.Frame) error

// Receive reads the next CAN frame from the virtual bus.
func (b *Bus) Receive() (can.Frame, error)

// Close shuts down the connection.
func (b *Bus) Close() error
```

**macOS fallback (development):** macOS has no kernel CAN support. The harness provides a TCP socket transport that emulates a CAN bus. Frames are length-prefixed binary on a TCP connection, matching the iKonvert and NavLink2 gateway formats.

```go
package vcan

// TCPBus emulates a CAN bus over TCP for macOS development.
// Listens on a TCP port. Multiple clients can connect.
// Frames from any client are broadcast to all other clients.
type TCPBus struct {
    listener net.Listener
    clients  []*net.Conn
}

// ListenTCP starts a TCP-based virtual CAN bus.
// The adapter connects to this as if it were an iKonvert or NavLink2.
func ListenTCP(addr string, format GatewayFormat) (*TCPBus, error)

type GatewayFormat int
const (
    FormatIKonvert  GatewayFormat = iota // iKonvert ASCII framing
    FormatSeaSmart                        // $PCDIN sentence wrapping
    FormatYDWG                            // YDWG raw format
    FormatActisense                       // Actisense EBL binary
)
```

### 2.3 PGN Injection CLI

Command-line tool for injecting specific PGN data into a running system. Useful for manual testing, demos, and reproducing bugs.

```
abovedeck-inject — Inject NMEA 2000 PGNs into the virtual CAN bus

Usage:
  abovedeck-inject --pgn <PGN> [field flags] [options]

Options:
  --pgn         PGN number (decimal)
  --source      Source address (default: 42)
  --priority    Priority 0-7 (default: 2)
  --target      Target: "vcan0", "tcp://localhost:2000", or gateway format
  --format      Gateway format: ikonvert, seasmart, ydwg, actisense (default: ikonvert)
  --repeat      Repeat interval in ms (0 = once)
  --count       Number of repetitions (0 = infinite until Ctrl+C)

Field flags are PGN-specific. Run with --pgn and --help to see available fields.

Examples:

  # Inject battery status once
  abovedeck-inject --pgn 127508 --instance 0 --voltage 12.85 --current -3.2

  # Simulate GPS position updating at 10 Hz
  abovedeck-inject --pgn 129025 --lat 48.1173 --lon -1.1833 --repeat 100

  # Inject wind data every second via NavLink2 format
  abovedeck-inject --pgn 130306 --speed 12.5 --angle 45.0 --reference apparent \
    --target tcp://localhost:2000 --format seasmart --repeat 1000

  # Simulate engine running at 2400 RPM
  abovedeck-inject --pgn 127488 --instance 0 --rpm 2400 --repeat 500

  # Inject fluid level for starboard fuel tank
  abovedeck-inject --pgn 127505 --type fuel --instance 1 --level 62.5 --capacity 200
```

### 2.4 NMEA 2000 Device Simulator

A full NMEA 2000 device that participates in network management. Unlike the simple injection CLI, the device simulator responds to protocol-level requests and broadcasts data at correct rates.

```go
package nmea2000sim

// Device simulates a complete NMEA 2000 device on the network.
type Device struct {
    SourceAddress  uint8
    ProductInfo    ProductInfo    // PGN 126996
    AddressClaim   AddressClaim   // PGN 60928
    DataPGNs       []DataPGNConfig
}

type ProductInfo struct {
    NMEA2000Version uint16
    ProductCode     uint16
    ModelID         string // max 32 chars
    SoftwareVersion string // max 32 chars
    ModelVersion    string // max 32 chars
    SerialCode      string // max 32 chars
    CertLevel       uint8
    LoadEquivalency uint8
}

type AddressClaim struct {
    UniqueNumber     uint32 // 21 bits
    ManufacturerCode uint16 // 11 bits
    DeviceInstance   uint8
    DeviceFunction   uint8
    DeviceClass      uint8
    SystemInstance    uint8
    IndustryGroup    uint8  // 4 = Marine
}

type DataPGNConfig struct {
    PGN      uint32
    Interval time.Duration // Broadcast interval
    Fields   func() map[string]interface{} // Called each interval to get current values
}
```

**Network management behaviour:**

1. On startup, broadcasts PGN 60928 (ISO Address Claim) with the device's NAME
2. Responds to PGN 59904 (ISO Request) with the requested PGN if supported
3. Responds to ISO Request for PGN 126996 with Product Information
4. Responds to ISO Request for PGN 60928 with Address Claim
5. Handles address conflicts per the ISO 11783-5 address claim procedure

**Pre-built device profiles:**

```go
// NewBatteryMonitor creates a simulated battery monitor (SmartShunt-like).
// Broadcasts PGN 127508 (Battery Status) every 1.5s and
// PGN 127506 (DC Detailed Status) every 1.5s.
func NewBatteryMonitor(source uint8, opts BatteryMonitorOpts) *Device

// NewGPS creates a simulated GPS receiver.
// Broadcasts PGN 129025 (Position Rapid) at 10 Hz and
// PGN 129026 (COG/SOG Rapid) at 10 Hz.
func NewGPS(source uint8, opts GPSOpts) *Device

// NewWindSensor creates a simulated wind instrument.
// Broadcasts PGN 130306 (Wind Data) every 100ms.
func NewWindSensor(source uint8, opts WindOpts) *Device

// NewDepthSounder creates a simulated depth sounder.
// Broadcasts PGN 128267 (Water Depth) every 1s.
func NewDepthSounder(source uint8, opts DepthOpts) *Device

// NewEngine creates a simulated engine gateway.
// Broadcasts PGN 127488 (Engine Rapid) every 100ms and
// PGN 127489 (Engine Dynamic) every 500ms.
func NewEngine(source uint8, opts EngineOpts) *Device

// NewFluidLevel creates a simulated tank sender.
// Broadcasts PGN 127505 (Fluid Level) every 2.5s.
func NewFluidLevel(source uint8, opts FluidOpts) *Device

// NewSwitchBank creates a simulated digital switching bank (CZone-like).
// Broadcasts PGN 127501 (Binary Switch Bank Status) every 1s.
// Responds to PGN 127502 (Switch Bank Control) write commands.
func NewSwitchBank(source uint8, opts SwitchBankOpts) *Device

// NewAISReceiver creates a simulated AIS receiver that forwards
// AIS messages as NMEA 2000 PGNs (129038, 129039, 129794, etc.)
func NewAISReceiver(source uint8, opts AISReceiverOpts) *Device
```

**Value variation:** Device simulators produce realistic data, not flatlines. Each simulated value has configurable drift, noise, and occasional spikes:

```go
type ValueModel struct {
    Base      float64       // Baseline value
    Drift     float64       // Maximum drift from base per hour
    Noise     float64       // Random noise amplitude (gaussian)
    SpikeProb float64       // Probability of a spike per reading (0-1)
    SpikeMag  float64       // Spike magnitude as multiple of noise
    Min       float64       // Clamp minimum
    Max       float64       // Clamp maximum
}

// BatteryMonitorOpts example:
type BatteryMonitorOpts struct {
    Instance  uint8
    Voltage   ValueModel // e.g., Base: 12.8, Noise: 0.05, Min: 10.0, Max: 14.8
    Current   ValueModel // e.g., Base: -5.0, Noise: 0.5
    Temp      ValueModel // e.g., Base: 293.15, Noise: 0.5
    SOC       ValueModel // e.g., Base: 85.0, Drift: -2.0 (draining)
}
```

---

## 3. NMEA 0183 Harness

### 3.1 Sentence Generator

Constructs valid NMEA 0183 sentences from field values. Handles all formatting, field ordering, and checksum calculation.

```go
package nmea0183gen

// Sentence is a fully formed NMEA 0183 sentence including $ prefix and *XX checksum.
type Sentence string

// Checksum computes the XOR checksum for a sentence body (between $ and *).
func Checksum(body string) byte

// GGA builds a GPS fix quality sentence.
func GGA(opts GGAOpts) Sentence
type GGAOpts struct {
    Time       time.Time
    Lat, Lon   float64
    FixQuality int    // 0=invalid, 1=GPS, 2=DGPS, 4=RTK, 5=Float RTK
    Satellites int
    HDOP       float64
    Altitude   float64 // meters
    GeoidSep   float64 // meters
    TalkerID   string  // default "GP"
}
// Output: $GPGGA,123456.00,4807.0380,N,01131.0000,E,1,08,0.90,545.4,M,47.0,M,,*47

// RMC builds a recommended minimum navigation sentence.
func RMC(opts RMCOpts) Sentence
type RMCOpts struct {
    Time       time.Time
    Status     byte    // 'A' = active, 'V' = void
    Lat, Lon   float64
    SOG        float64 // knots
    COG        float64 // degrees true
    Date       time.Time
    MagVar     float64 // degrees, positive = E
    TalkerID   string
}

// HDT builds a true heading sentence.
func HDT(heading float64, talkerID string) Sentence
// Output: $IIHDT,045.2,T*1B

// DBT builds a depth below transducer sentence.
func DBT(depthMetres float64, talkerID string) Sentence
// Output: $IIDBT,031.2,f,009.5,M,005.1,F*2D

// MWV builds a wind speed and angle sentence.
func MWV(opts MWVOpts) Sentence
type MWVOpts struct {
    Angle     float64 // degrees
    Reference byte    // 'R' = relative/apparent, 'T' = true
    Speed     float64
    Units     byte    // 'N' = knots, 'M' = m/s, 'K' = km/h
    Status    byte    // 'A' = valid
    TalkerID  string
}
// Output: $IIMWV,045.0,R,12.5,N,A*1B

// VTG builds a course over ground and ground speed sentence.
func VTG(opts VTGOpts) Sentence
type VTGOpts struct {
    COGTrue     float64
    COGMagnetic float64
    SOGKnots    float64
    SOGKmh      float64
    TalkerID    string
}

// XTE builds a cross-track error sentence.
func XTE(opts XTEOpts) Sentence
type XTEOpts struct {
    Status     byte    // 'A' = valid
    CycleWarn  byte    // 'A' = valid
    XTError    float64 // nautical miles
    Direction  byte    // 'L' = left, 'R' = right
    TalkerID   string
}

// MTW builds a water temperature sentence.
func MTW(tempCelsius float64, talkerID string) Sentence

// VHW builds a water speed and heading sentence.
func VHW(opts VHWOpts) Sentence

// RSA builds a rudder sensor angle sentence.
func RSA(starboard, port float64, talkerID string) Sentence
```

### 3.2 TCP/UDP Server

Simulates a WiFi NMEA gateway (NavLink2, WLN30) serving sentences over TCP or UDP.

```go
package nmea0183sim

// Server serves NMEA 0183 sentences over TCP and/or UDP.
type Server struct {
    tcpAddr string
    udpAddr string
}

// Config defines the simulated data sources and their update rates.
type Config struct {
    // Position/Navigation
    GPS       *GPSConfig       // GGA + RMC at configurable rate (default: 1 Hz)
    Heading   *HeadingConfig   // HDT/HDG at configurable rate (default: 10 Hz)
    Depth     *DepthConfig     // DBT at configurable rate (default: 1 Hz)
    Speed     *SpeedConfig     // VHW at configurable rate (default: 1 Hz)

    // Wind
    Wind      *WindConfig      // MWV at configurable rate (default: 1 Hz)

    // Autopilot
    XTE       *XTEConfig       // XTE at configurable rate (default: 1 Hz)

    // AIS (encapsulated as !AIVDM sentences)
    AIS       *AISConfig       // AIS targets, update rate varies by class
}

type GPSConfig struct {
    Lat, Lon    float64
    SOG, COG    float64
    FixQuality  int
    Satellites  int
    Rate        time.Duration
    Track       []Waypoint // If set, GPS follows this track
}

// ListenAndServe starts serving NMEA sentences.
// TCP: persistent connections on port 10110 (standard).
// UDP: broadcasts on port 10110.
func (s *Server) ListenAndServe(ctx context.Context, cfg Config) error
```

**Track following:** When a `Track` is provided, the GPS simulator interpolates position along the defined waypoints at the configured speed. This produces realistic position, COG, and SOG values that change over time.

```go
type Waypoint struct {
    Lat, Lon float64
    Name     string  // optional
}

// Example: simulate sailing from Saint-Malo to Jersey
track := []Waypoint{
    {Lat: 48.6493, Lon: -2.0076, Name: "Saint-Malo"},
    {Lat: 48.7500, Lon: -2.1500, Name: "Cap Frehel approach"},
    {Lat: 49.1800, Lon: -2.1100, Name: "Jersey north"},
    {Lat: 49.1870, Lon: -2.1040, Name: "St Helier"},
}
```

---

## 4. Victron Harness

### 4.1 VE.Direct Simulator

Simulates a Victron device connected via VE.Direct serial protocol over a virtual serial port.

**Virtual serial port setup** using `socat`:

```bash
# Create a virtual serial port pair
# /tmp/vedirect0 = simulator writes here
# /tmp/vedirect1 = adapter reads from here
socat -d -d pty,raw,echo=0,link=/tmp/vedirect0 pty,raw,echo=0,link=/tmp/vedirect1 &

# The adapter connects to /tmp/vedirect1 at 19200 baud
```

```go
package victronsim

// VEDirectDevice simulates a Victron device sending text protocol data.
type VEDirectDevice struct {
    port       string // e.g., "/tmp/vedirect0"
    deviceType DeviceType
    interval   time.Duration // block transmission interval (default: 1s)
}

type DeviceType int
const (
    DeviceMPPT     DeviceType = iota // SmartSolar MPPT charge controller
    DeviceBMV                         // BMV/SmartShunt battery monitor
    DeviceInverter                    // Phoenix inverter
    DeviceCharger                     // Blue Smart IP charger
)
```

**MPPT fields** (complete VE.Direct text protocol):

```go
type MPPTState struct {
    PID   string  // Product ID: "0xA060" (SmartSolar 100/20)
    FW    string  // Firmware version: "161"
    SER   string  // Serial number
    V     int     // Battery voltage in mV
    I     int     // Battery current in mA
    VPV   int     // Panel voltage in mV
    PPV   int     // Panel power in W
    CS    int     // Charge state: 0=Off, 2=Fault, 3=Bulk, 4=Absorption, 5=Float
    MPPT  int     // Tracker state: 0=Off, 1=Voltage/current limited, 2=MPPT active
    ERR   int     // Error code: 0=No error
    LOAD  string  // Load output state: ON/OFF
    IL    int     // Load current in mA
    H19   int     // Yield total (0.01 kWh)
    H20   int     // Yield today (0.01 kWh)
    H21   int     // Maximum power today in W
    H22   int     // Yield yesterday (0.01 kWh)
    H23   int     // Maximum power yesterday in W
    HSDS  int     // Day sequence number
}
```

**BMV/SmartShunt fields:**

```go
type BMVState struct {
    PID   string  // Product ID: "0xA389" (SmartShunt 500A)
    V     int     // Battery voltage in mV
    I     int     // Current in mA (negative = discharging)
    P     int     // Instantaneous power in W
    CE    int     // Consumed energy in mAh
    SOC   int     // State of charge in 0.1%
    TTG   int     // Time to go in minutes (-1 = infinite)
    Alarm string  // OFF or ON
    AR    int     // Alarm reason
    H1    int     // Deepest discharge in mAh
    H2    int     // Last discharge in mAh
    H3    int     // Average discharge in mAh
    H4    int     // Number of charge cycles
    H5    int     // Number of full discharges
    H6    int     // Cumulative Ah drawn
    H7    int     // Minimum battery voltage in mV
    H8    int     // Maximum battery voltage in mV
    H9    int     // Seconds since last full charge
    H10   int     // Number of automatic synchronisations
    H11   int     // Number of low voltage alarms
    H12   int     // Number of high voltage alarms
    H17   int     // Discharged energy in 0.01 kWh
    H18   int     // Charged energy in 0.01 kWh
}
```

**Block transmission and checksum:**

VE.Direct text blocks are transmitted as tab-separated key-value pairs, one per line, terminated by a `Checksum` line. The checksum is computed so that the sum of all bytes in the block (including the checksum byte) modulo 256 equals zero.

```go
// FormatBlock formats a VE.Direct text block with correct checksum.
func FormatBlock(fields []KV) []byte

type KV struct {
    Key   string
    Value string
}

// Example output (tabs shown as \t):
// PID\t0xA060\r\n
// FW\t161\r\n
// V\t26410\r\n
// I\t-1200\r\n
// VPV\t42310\r\n
// PPV\t185\r\n
// CS\t3\r\n
// MPPT\t2\r\n
// ERR\t0\r\n
// Checksum\t<byte>\r\n
```

**Solar cycle simulation:**

The MPPT simulator can model a realistic solar day:

```go
type SolarDayProfile struct {
    Sunrise    time.Duration // offset from midnight, e.g., 6h30m
    Sunset     time.Duration // e.g., 20h30m
    PeakPower  int           // peak panel power in W
    CloudCover float64       // 0.0 = clear, 1.0 = overcast
    PanelWp    int           // panel nameplate watts
}

// Run starts the simulator with a solar day profile.
// Panel voltage and current follow a bell curve with cloud noise.
func (d *VEDirectDevice) RunSolarDay(ctx context.Context, profile SolarDayProfile) error
```

### 4.2 MQTT Simulator (Cerbo GX)

Simulates a Victron Cerbo GX publishing system data over MQTT, matching the `dbus-mqtt` topic structure.

```go
package victronsim

// CerboSimulator publishes Victron data on MQTT topics
// matching the real Cerbo GX dbus-mqtt bridge.
type CerboSimulator struct {
    broker   string // MQTT broker address, e.g., "localhost:1883"
    portalID string // e.g., "d41d8cd98f00b204"
}

// Topic structure matches real Cerbo GX:
//   N/<portalID>/system/0/Ac/ConsumptionOnInput/L1/Power
//   N/<portalID>/battery/512/Soc
//   N/<portalID>/solarcharger/258/Yield/Power
//   N/<portalID>/vebus/276/Ac/Out/L1/V
//   N/<portalID>/tank/0/Level
//   N/<portalID>/temperature/24/Temperature

type CerboConfig struct {
    PortalID      string
    Batteries     []CerboBattery
    SolarChargers []CerboSolarCharger
    Inverters     []CerboInverter
    Tanks         []CerboTank
    Temperature   []CerboTemperature
    System        CerboSystem
}

type CerboBattery struct {
    Instance int
    Voltage  ValueModel
    Current  ValueModel
    SOC      ValueModel
    Power    ValueModel
    Temp     ValueModel
}

type CerboSolarCharger struct {
    Instance  int
    PVPower   ValueModel
    PVVoltage ValueModel
    Yield     ValueModel // kWh today
    State     int        // charge state
}

type CerboSystem struct {
    ACInputPower  ValueModel
    ACOutputPower ValueModel
    ACInputType   int // 0=not available, 1=grid, 2=genset, 3=shore
    DCPower       ValueModel
}
```

**MQTT message format:** Each topic publishes a JSON payload matching the Victron format:

```json
{"value": 12.85}
```

The simulator publishes updates at realistic rates: battery data every 1-3 seconds, solar every 1 second, system overview every 5 seconds.

**Keepalive and registration:** The simulator implements the Cerbo GX MQTT keepalive protocol. It publishes a keepalive message every 30 seconds and responds to `R/` (read) requests by publishing the current value on the corresponding `N/` topic.

### 4.3 VRM API Mock

An HTTP server that mimics the Victron VRM (Venus Remote Monitoring) API v2 endpoints.

```go
package vrmmock

// Server serves mock VRM API responses.
type Server struct {
    httpServer *http.Server
}

// NewServer creates a VRM API mock on the given address.
func NewServer(addr string) *Server

// Endpoints implemented:
//
// POST /v2/auth/login
//   Request: {"username": "...", "password": "..."}
//   Response: {"token": "mock-jwt-token", "idUser": 12345}
//
// GET /v2/users/:userId/installations
//   Response: list of installations with portal IDs
//
// GET /v2/installations/:installationId/stats
//   Query params: start, end, type (solar, consumption, battery_state, etc.)
//   Response: time-series data matching VRM format
//
// GET /v2/installations/:installationId/diagnostics
//   Response: current system state
//
// GET /v2/installations/:installationId/data-download
//   Response: CSV download of historical data
//
// GET /v2/installations/:installationId/widgets/Graph
//   Response: chart data for the VRM dashboard
```

**Data generation:** The mock server generates realistic historical data using the same `ValueModel` system. A solar installation with 400Wp panels produces plausible daily curves with seasonal variation.

```go
cfg := vrmmock.Config{
    Installations: []vrmmock.Installation{
        {
            ID:       123456,
            Name:     "SV Test Vessel",
            PortalID: "d41d8cd98f00b204",
            PVPower:  400,     // Wp
            BatteryAh: 400,    // Ah at 12V
            Location: vrmmock.Location{Lat: 48.117, Lon: -1.183},
        },
    },
    HistoryDays: 30, // Generate 30 days of history
}
```

---

## 5. AIS Harness

### 5.1 AIS Message Generator

Constructs valid AIS messages with correct 6-bit encoding, bit stuffing, and multi-sentence fragmentation.

```go
package aisgen

// AIS message types
type MessageType int
const (
    ClassAPosition    MessageType = 1  // Also 2, 3 — same format
    ClassAStatic      MessageType = 5  // Static and voyage data
    ClassBPosition    MessageType = 18 // Standard Class B CS
    ClassBExtPosition MessageType = 19 // Extended Class B CS
    ClassBStatic      MessageType = 24 // Part A (name) and Part B (callsign, dimensions)
)

// ClassAPositionReport generates a type 1/2/3 AIS message.
func ClassAPositionReport(opts ClassAPositionOpts) []string // Returns !AIVDM sentences

type ClassAPositionOpts struct {
    MMSI       uint32
    NavStatus  uint8   // 0=underway engine, 1=at anchor, 3=restricted manoeuvrability, 5=moored, 8=sailing
    ROT        float64 // rate of turn, degrees/min (positive = turning right)
    SOG        float64 // speed over ground, knots (0-102.2)
    Accuracy   bool    // position accuracy (true = DGPS quality)
    Lon        float64 // degrees, positive = E
    Lat        float64 // degrees, positive = N
    COG        float64 // course over ground, degrees (0-359.9)
    Heading    uint16  // true heading, degrees (0-359, 511 = not available)
    Timestamp  uint8   // UTC second (0-59, 60=not available)
    Manoeuvre  uint8   // 0=not available, 1=not engaged, 2=engaged
    RAIM       bool    // RAIM flag
    RadioStatus uint32 // ITDMA/SOTDMA communication state
}

// ClassAStaticData generates a type 5 AIS message (multi-sentence).
func ClassAStaticData(opts ClassAStaticOpts) []string

type ClassAStaticOpts struct {
    MMSI         uint32
    AISVersion   uint8
    IMO          uint32
    Callsign     string // max 7 chars
    Name         string // max 20 chars
    ShipType     uint8  // 0-99, see ITU-R M.1371
    DimBow       uint16 // meters
    DimStern     uint16
    DimPort      uint8
    DimStarboard uint8
    EPFDType     uint8  // type of positioning device
    ETA          time.Time
    Draught      float64 // meters (0.1m resolution)
    Destination  string  // max 20 chars
}

// ClassBPosition generates a type 18 AIS message.
func ClassBPosition(opts ClassBPositionOpts) []string

type ClassBPositionOpts struct {
    MMSI    uint32
    SOG     float64
    Accuracy bool
    Lon     float64
    Lat     float64
    COG     float64
    Heading uint16
}

// ClassBExtendedPosition generates a type 19 AIS message.
func ClassBExtendedPosition(opts ClassBExtPositionOpts) []string

// ClassBStaticData generates type 24 AIS messages (Part A and Part B).
func ClassBStaticData(opts ClassBStaticOpts) []string
```

**6-bit encoding:** AIS messages use a custom 6-bit ASCII armor over the binary payload. The generator handles:

- 6-bit field packing for integers, booleans, and strings
- AIS 6-bit character encoding (different from standard ASCII)
- Bit-level payload construction
- NMEA 0183 sentence wrapping with correct fragment counts and sequential message IDs
- Checksum calculation

```go
// encode6bit converts a byte slice of 6-bit-packed data to AIS ASCII armor.
func encode6bit(data []byte, bitCount int) string

// Example: Type 1 message for MMSI 211234567 at position 51.9N, 4.5E
sentences := ClassAPositionReport(ClassAPositionOpts{
    MMSI:      211234567,
    NavStatus: 0,
    SOG:       8.5,
    Lon:       4.5,
    Lat:       51.9,
    COG:       135.0,
    Heading:   130,
})
// Returns: ["!AIVDM,1,1,,B,13mBaJ0P00PG`O<K7eH80?v40<0e,0*4E"]
```

### 5.2 Scenario Generator

Creates fleets of AIS vessels with defined tracks for testing CPA (Closest Point of Approach) calculations, collision avoidance, and AIS display.

```go
package aisgen

// Fleet defines a group of AIS vessels for scenario testing.
type Fleet struct {
    Vessels []VesselTrack
}

// VesselTrack defines a single vessel's identity and movement.
type VesselTrack struct {
    // Identity
    MMSI      uint32
    Name      string
    Callsign  string
    ShipType  uint8   // Cargo, tanker, sailing, fishing, etc.
    Class     byte    // 'A' or 'B'
    Length    float64  // meters

    // Track
    Waypoints []TrackPoint
    Behaviour TrackBehaviour
}

type TrackPoint struct {
    Lat, Lon float64
    Time     time.Duration // Offset from scenario start
}

type TrackBehaviour int
const (
    BehaviourLinear      TrackBehaviour = iota // Straight-line interpolation between waypoints
    BehaviourGreatCircle                        // Great-circle route between waypoints
    BehaviourLoiter                             // Circle around a point (anchored/moored)
    BehaviourDrift                              // Stationary with random drift
)

// AISUpdateRate determines how often each vessel transmits.
// Class A underway: every 2-10s depending on SOG and ROT
// Class A at anchor: every 3 minutes
// Class B underway: every 30s (SOG > 2 kn) or every 3 minutes (SOG < 2 kn)
// Static data: every 6 minutes
func AISUpdateRate(class byte, navStatus uint8, sog float64) time.Duration
```

**Pre-built vessel profiles:**

```go
// CommonVessels provides realistic vessel definitions.
var CommonVessels = struct {
    CargoShip      func(mmsi uint32) VesselTrack // 200m, Class A, type 70
    Tanker         func(mmsi uint32) VesselTrack // 300m, Class A, type 80
    SailingYacht   func(mmsi uint32) VesselTrack // 12m, Class B, type 36
    MotorYacht     func(mmsi uint32) VesselTrack // 18m, Class B, type 37
    FishingVessel  func(mmsi uint32) VesselTrack // 25m, Class A, type 30
    Tug            func(mmsi uint32) VesselTrack // 30m, Class A, type 52
    PassengerFerry func(mmsi uint32) VesselTrack // 80m, Class A, type 60
    Pilot          func(mmsi uint32) VesselTrack // 15m, Class A, type 50
}{}
```

**CPA scenario builder:**

```go
// CPAScenario builds a fleet where specific vessel pairs have defined CPA events.
type CPAScenario struct {
    OwnShip     TrackPoint    // Own vessel position
    OwnCOG      float64       // Own vessel course
    OwnSOG      float64       // Own vessel speed
    Encounters  []CPAEncounter
}

type CPAEncounter struct {
    Vessel   VesselTrack
    CPA      float64       // Closest point of approach in nautical miles
    TCPA     time.Duration // Time to CPA from scenario start
    Bearing  float64       // Initial bearing from own ship
    Crossing bool          // True = crossing situation, false = overtaking/head-on
}

// Build generates the full fleet with calculated tracks to achieve the defined CPA events.
func (s *CPAScenario) Build() Fleet
```

---

## 6. Recorded Data Replay

### 6.1 Binary Capture Format

All captured protocol data is stored in a unified binary format, regardless of source protocol.

```
File header (16 bytes):
  Bytes 0-3:   Magic number: 0x41444350 ("ADCP" — Above Deck Capture Protocol)
  Bytes 4-5:   Format version (uint16, big-endian, currently 1)
  Bytes 6-7:   Reserved (0x0000)
  Bytes 8-15:  Start timestamp (int64, nanoseconds since Unix epoch, big-endian)

Frame record (variable length):
  Bytes 0-7:   Timestamp offset from file start (int64, nanoseconds, big-endian)
  Bytes 8-9:   Frame length (uint16, big-endian, max 65535)
  Byte  10:    Protocol identifier:
                 0x01 = CAN 2.0B frame (raw)
                 0x02 = NMEA 0183 sentence (ASCII, no CR/LF)
                 0x03 = VE.Direct text block
                 0x04 = MQTT message (topic + payload)
                 0x05 = AIS (decoded from NMEA 0183, stored as binary)
                 0x06 = Actisense binary
                 0x07 = iKonvert ASCII
                 0x08 = SeaSmart
  Byte  11:    Source tag length (uint8)
  Bytes 12-N:  Source tag (UTF-8 string, e.g., "nmea2000-ikonvert-usb0")
  Bytes N+1-:  Frame data (length specified in bytes 8-9)

File footer (optional):
  Bytes 0-3:   Magic number: 0x41444346 ("ADCF" — footer)
  Bytes 4-11:  Total frame count (int64, big-endian)
  Bytes 12-19: End timestamp (int64, nanoseconds since Unix epoch, big-endian)
  Bytes 20-23: CRC32 of all frame data
```

File extension: `.adcap`

### 6.2 Replay Engine

```go
package replay

// Engine replays captured data at configurable speed.
type Engine struct {
    file     *os.File
    outputs  map[byte]Output // Protocol ID → output destination
}

type Speed int
const (
    SpeedRealtime    Speed = iota // 1x — preserves original timing
    SpeedAccelerated              // Nx — configurable multiplier
    SpeedFastForward              // No delays — as fast as possible
)

// Output defines where replayed data is sent.
type Output interface {
    Send(protocol byte, sourceTag string, data []byte) error
}

// TCPOutput sends data to a TCP connection (NMEA 0183, iKonvert, SeaSmart).
type TCPOutput struct { conn net.Conn }

// SerialOutput sends data to a serial port (VE.Direct).
type SerialOutput struct { port serial.Port }

// MQTTOutput publishes to an MQTT broker (Victron Cerbo).
type MQTTOutput struct { client mqtt.Client }

// VCANOutput sends CAN frames to a vcan interface (Linux).
type VCANOutput struct { bus *vcan.Bus }

// Config for replay engine.
type Config struct {
    Speed       Speed
    Multiplier  float64       // Used when Speed == SpeedAccelerated (e.g., 10.0 = 10x)
    StartOffset time.Duration // Skip to this point in the capture
    EndOffset   time.Duration // Stop at this point (0 = play to end)
    Loop        bool          // Loop back to start when reaching end
    Outputs     map[byte]Output
}

// Play starts replay. Blocks until complete or context cancelled.
func (e *Engine) Play(ctx context.Context, cfg Config) error

// Stats returns replay progress.
func (e *Engine) Stats() ReplayStats

type ReplayStats struct {
    FramesPlayed   int64
    FramesTotal    int64
    ElapsedReal    time.Duration
    ElapsedCapture time.Duration
    BytesSent      int64
    ErrorCount     int64
}
```

### 6.3 Capture Tool CLI

Records live protocol data from multiple sources simultaneously into the binary capture format.

```
abovedeck-capture — Record protocol data from multiple sources

Usage:
  abovedeck-capture --output <file.adcap> [sources...]

Source flags:
  --tcp <addr>:<port>        TCP source (NMEA 0183, iKonvert, SeaSmart)
    --tcp-tag <name>         Source tag for this TCP source
    --tcp-proto <type>       Protocol: nmea0183, ikonvert, seasmart (default: auto-detect)

  --serial <device>          Serial source (VE.Direct, Actisense)
    --serial-tag <name>      Source tag
    --serial-baud <rate>     Baud rate (default: auto-detect: 4800/19200/38400)
    --serial-proto <type>    Protocol: vedirect, actisense, nmea0183

  --mqtt <broker>            MQTT source (Victron Cerbo GX)
    --mqtt-tag <name>        Source tag
    --mqtt-topic <pattern>   Topic filter (default: "N/#")

  --udp <addr>:<port>        UDP source (NMEA 0183 broadcast)
    --udp-tag <name>         Source tag

  --vcan <interface>         Virtual CAN source (Linux only)
    --vcan-tag <name>        Source tag

Options:
  --output, -o      Output file path (required)
  --duration        Maximum recording duration (default: unlimited)
  --max-size        Maximum file size in MB (default: unlimited)
  --compress        Compress frames with zstd (default: false)

Examples:
  # Record from NavLink2 and Cerbo GX simultaneously
  abovedeck-capture -o passage.adcap \
    --tcp 192.168.1.100:10110 --tcp-tag "navlink2" --tcp-proto nmea0183 \
    --mqtt 192.168.1.200:1883 --mqtt-tag "cerbo-gx"

  # Record from iKonvert USB and VE.Direct
  abovedeck-capture -o at-anchor.adcap \
    --serial /dev/ttyUSB0 --serial-tag "ikonvert" --serial-proto ikonvert \
    --serial /dev/ttyUSB1 --serial-tag "mppt" --serial-proto vedirect \
    --serial /dev/ttyUSB2 --serial-tag "smartshunt" --serial-proto vedirect

  # Record for 1 hour, max 500MB
  abovedeck-capture -o short-test.adcap \
    --tcp 192.168.1.100:10110 --tcp-tag "navlink2" \
    --duration 1h --max-size 500
```

### 6.4 Replay CLI

```
abovedeck-replay — Replay captured protocol data

Usage:
  abovedeck-replay <file.adcap> [options]

Options:
  --speed          Playback speed: realtime, fast, or a multiplier like "10x" (default: realtime)
  --start          Start offset into the capture (e.g., "1h30m", "0", "+50%")
  --end            End offset (e.g., "2h", "-10m")
  --loop           Loop playback continuously
  --list-sources   List source tags in the capture file and exit
  --filter-source  Only replay frames from this source tag
  --filter-proto   Only replay this protocol type

  # Output routing (at least one required)
  --tcp <addr>     Send TCP data to this address
  --serial <dev>   Send serial data to this device
  --mqtt <broker>  Publish MQTT data to this broker
  --vcan <iface>   Send CAN frames to this vcan interface

Examples:
  # Replay at real-time speed to the spoke's expected ports
  abovedeck-replay passage.adcap \
    --tcp localhost:10110 \
    --mqtt localhost:1883

  # Replay at 10x speed, skip first hour
  abovedeck-replay passage.adcap --speed 10x --start 1h \
    --tcp localhost:10110

  # List what's in a capture file
  abovedeck-replay passage.adcap --list-sources
  # Output:
  #   navlink2    nmea0183   42,831 frames   3h12m
  #   cerbo-gx    mqtt       18,442 frames   3h12m
```

### 6.5 Anonymisation

Captured data from real boats may contain identifying information. The anonymiser processes `.adcap` files to strip or replace sensitive data.

```go
package replay

// Anonymise processes a capture file, replacing sensitive data.
type Anonymiser struct {
    MMSIMap     map[uint32]uint32 // Original MMSI → replacement
    NameMap     map[string]string // Vessel name → replacement
    GPSOffset   GPSOffset         // Offset all GPS positions
    StripMMSI   bool              // Replace all MMSIs with random values
    StripNames  bool              // Replace vessel names with generic names
}

type GPSOffset struct {
    LatOffset float64 // Degrees to add to all latitudes
    LonOffset float64 // Degrees to add to all longitudes
}

// Process reads an input capture file and writes an anonymised copy.
func (a *Anonymiser) Process(input, output string) error
```

Anonymisation touches:

- **NMEA 0183:** GPS sentences (GGA, RMC, GLL) — offset lat/lon
- **AIS:** MMSI, vessel name, callsign, IMO number, destination
- **NMEA 2000:** PGN 129025 (position) — offset lat/lon, PGN 126996 (product info) — strip serial numbers
- **Victron:** VE.Direct SER# field, VRM portal IDs

CLI:

```
abovedeck-anonymise <input.adcap> <output.adcap> [options]

Options:
  --gps-offset-lat <degrees>    Offset latitude (default: random -1.0 to 1.0)
  --gps-offset-lon <degrees>    Offset longitude (default: random -1.0 to 1.0)
  --strip-mmsi                  Replace all MMSIs with random values (default: true)
  --strip-names                 Replace vessel names (default: true)
  --strip-serials               Replace device serial numbers (default: true)
```

---

## 7. Protocol Fuzzer

### 7.1 Design

The fuzzer generates malformed protocol data to verify that adapters handle errors gracefully. The fundamental rule: **adapters must never crash.** Malformed data must be logged, counted, and skipped. The adapter continues processing subsequent frames.

The fuzzer uses Go's built-in `testing.F` fuzzing framework (Go 1.18+), which provides corpus management, coverage-guided mutation, and crash detection out of the box.

### 7.2 Fuzz Targets

Each adapter has fuzz targets for its parse/decode functions:

```go
// CAN / NMEA 2000
func FuzzCANFrameParse(f *testing.F) {
    // Seed corpus: valid CAN frames from testdata
    seeds := loadBinarySeeds("testdata/ikonvert-frames.bin")
    for _, s := range seeds {
        f.Add(s)
    }

    f.Fuzz(func(t *testing.T, data []byte) {
        decoder := NewDecoder(DefaultPGNDatabase())
        // Must not panic
        frame, _, err := ParseCANFrame(data)
        if err != nil {
            return // Parse error is fine
        }
        // Decode must not panic even with a structurally valid but semantically wrong frame
        _, _ = decoder.Decode(frame)
    })
}

func FuzzFastPacketReassembly(f *testing.F) {
    f.Add(loadFixture("testdata/fast-packet-126996-product-info.bin"))
    f.Fuzz(func(t *testing.T, data []byte) {
        reassembler := NewFastPacketReassembler(750 * time.Millisecond)
        // Feed arbitrary chunks as if they were sequential CAN frames
        for i := 0; i < len(data) && i+13 <= len(data); i += 13 {
            frame, _, err := ParseCANFrame(data[i : i+13])
            if err != nil {
                continue
            }
            _, _ = reassembler.AddFrame(frame)
        }
    })
}

// NMEA 0183
func FuzzNMEA0183Parse(f *testing.F) {
    f.Add([]byte("$GPGGA,123456.00,4807.038,N,01131.000,E,1,08,0.9,545.4,M,47.0,M,,*47"))
    f.Add([]byte("$IIRMC,123456.00,A,4807.038,N,01131.000,E,5.2,045.0,230326,003.1,W*6A"))
    f.Add([]byte("!AIVDM,1,1,,B,177KQJ5000G?tO`K>RA1wUbN0TKH,0*5C"))

    f.Fuzz(func(t *testing.T, data []byte) {
        parser := NewNMEA0183Parser()
        _, _ = parser.Parse(string(data))
    })
}

// Victron VE.Direct
func FuzzVEDirectParse(f *testing.F) {
    f.Add(loadFixture("testdata/smartsolar-mppt.txt"))
    f.Add(loadFixture("testdata/smartshunt.txt"))

    f.Fuzz(func(t *testing.T, data []byte) {
        parser := NewVEDirectParser()
        _ = parser.ParseAll(data)
    })
}

// AIS
func FuzzAISDecode(f *testing.F) {
    f.Add([]byte("!AIVDM,1,1,,B,177KQJ5000G?tO`K>RA1wUbN0TKH,0*5C"))

    f.Fuzz(func(t *testing.T, data []byte) {
        decoder := NewAISDecoder()
        _, _ = decoder.Decode(string(data))
    })
}
```

### 7.3 Specific Malformation Categories

Beyond coverage-guided fuzzing, the harness includes deterministic malformation generators for targeted testing:

```go
package fuzzer

// Malformations returns a set of deliberately broken protocol data
// for each protocol type.

// CAN malformations
func CANMalformations() []MalformedFrame {
    return []MalformedFrame{
        {Name: "empty frame", Data: []byte{}},
        {Name: "single byte", Data: []byte{0xFF}},
        {Name: "truncated at DLC", Data: []byte{0x09, 0xF2, 0x14, 0x29, 0x08}},
        {Name: "DLC exceeds 8", Data: []byte{0x09, 0xF2, 0x14, 0x29, 0xFF, 0x00}},
        {Name: "DLC zero with data", Data: []byte{0x09, 0xF2, 0x14, 0x29, 0x00, 0x01, 0x02}},
        {Name: "data shorter than DLC", Data: []byte{0x09, 0xF2, 0x14, 0x29, 0x08, 0x01}},
        {Name: "invalid PGN bits", Data: randomFrameWithPGN(0x1FFFF)}, // PGN > max
        {Name: "max values all fields", Data: bytes.Repeat([]byte{0xFF}, 13)},
        {Name: "all zeros", Data: make([]byte, 13)},
    }
}

// NMEA 0183 malformations
func NMEA0183Malformations() []string {
    return []string{
        "",                                    // empty
        "$",                                   // just dollar sign
        "$*FF",                                // no body
        "$GPGGA*FF",                           // wrong checksum
        "$GPGGA,,,,,,,,,,,,,,*00",             // all empty fields
        "$GPGGA" + strings.Repeat(",x", 500),  // extremely long sentence
        "$GPGGA,999999.99,9999.999,X,99999.999,X,9,99,99.9,99999.9,M,99999.9,M,,*00", // out-of-range values
        "no dollar sign at all",               // not a sentence
        "$GP\x00GGA,data*00",                  // null byte in sentence
        strings.Repeat("$GPGGA,a", 10000),     // buffer overflow attempt
    }
}

// VE.Direct malformations
func VEDirectMalformations() [][]byte {
    return [][]byte{
        []byte(""),                                      // empty
        []byte("Checksum\t\x00"),                        // just checksum
        []byte("V\t\r\n"),                               // key with no value
        []byte("V\t" + strings.Repeat("9", 10000)),      // huge value
        []byte("V\t-99999999999999"),                    // extreme negative
        []byte(strings.Repeat("KEY\tVAL\r\n", 10000)),  // huge block
        []byte("Checksum\tFF\r\nChecksum\tFF\r\n"),      // double checksum
    }
}
```

### 7.4 Adapter Contract

Every adapter implementation must pass the fuzzer contract test:

```go
// TestAdapterFuzzerContract runs all malformation categories against an adapter.
// The adapter must:
// 1. Not panic on any input
// 2. Not hang (timeout after 100ms per frame)
// 3. Return an error for malformed data
// 4. Continue processing after encountering malformed data
// 5. Increment its ErrorsTotal counter for each malformed frame
func TestAdapterFuzzerContract(t *testing.T, adapter Adapter, malformations [][]byte)
```

---

## 8. Pre-Built Scenarios

Scenarios are complete, multi-protocol data sets that simulate realistic sailing situations. Each scenario defines all protocol sources, timing, and expected data model state at key points.

```go
package scenarios

// Scenario defines a complete test scenario.
type Scenario struct {
    Name        string
    Description string
    Duration    time.Duration
    Sources     []ScenarioSource
    Checkpoints []Checkpoint // Expected state at specific times
}

type ScenarioSource struct {
    Protocol  byte   // Protocol identifier (same as capture format)
    Tag       string // Source tag
    Generator func(ctx context.Context, t time.Duration) []byte // Generate data for time t
}

// Checkpoint defines expected data model state at a point in time.
type Checkpoint struct {
    AtTime time.Duration
    Expect map[string]interface{} // Data model path → expected value (with tolerance)
}
```

### 8.1 At Anchor (8 hours)

Simulates a boat at anchor overnight. Tests steady-state monitoring, anchor watch, and battery drain during periods of no solar input.

**Protocol sources:**
- NMEA 2000: GPS (position with ~5m wander), depth (tidal variation), wind (variable), battery (slow discharge), anchor light switch
- NMEA 0183: AIS (nearby anchored vessels, occasional passing traffic)
- Victron VE.Direct: MPPT (zero output at night, ramp up at dawn), SmartShunt (slow discharge curve)
- Victron MQTT: system overview matching VE.Direct data

**Key checkpoints:**
- T+0h: Battery SOC 95%, solar 0W, 3 AIS targets within 500m
- T+4h: Battery SOC 88%, position within 30m of initial (anchor circle)
- T+6h: Solar ramp begins, MPPT enters Bulk
- T+8h: Battery SOC 91% (recovering), solar 180W

### 8.2 Coastal Passage (6 hours)

Simulates a day sail along a coastline. Tests position tracking, navigation instruments, engine monitoring, and AIS traffic.

**Protocol sources:**
- NMEA 2000: GPS (following a defined track), heading, depth (varying seabed), wind, speed through water, engine (first 30 min motoring, then sailing), fuel level (slow decrease during motoring)
- NMEA 0183: AIS (busy coastal traffic — ferries, cargo, fishing, leisure)
- Victron: Solar (full day curve), battery (discharge during motoring, charge during sailing)

**Key checkpoints:**
- T+0h: Engine on, RPM 2400, SOG 6.5 kn motoring
- T+30m: Engine off, sails up, SOG 5.2 kn
- T+3h: CPA event — cargo ship at 0.3nm
- T+6h: Arrival, engine on for harbour approach

### 8.3 Offshore Passage (48 hours)

Extended passage with watch changes, weather variation, and equipment endurance testing. The primary purpose is to test the system's stability over extended periods — memory leaks, timer drift, database growth.

**Protocol sources:** All sources active for 48 hours with realistic variation. Weather deteriorates at T+18h (wind 25-35 kn, sea state increases), calms at T+30h.

**Key checkpoints:** Every 4 hours — validates no data loss, no memory growth, no timer drift.

### 8.4 Engine Alarm (5 minutes)

Tests alarm/alert propagation. Engine oil pressure drops, coolant temperature rises, adapter generates the correct alert sequence.

**Protocol sources:**
- NMEA 2000: PGN 127489 — oil pressure drops from 4.0 bar to 0.5 bar over 60 seconds, coolant temp rises from 85C to 105C

**Key checkpoints:**
- T+30s: Oil pressure below threshold, alert raised
- T+45s: Coolant temp above threshold, second alert raised
- T+60s: Both alarms active simultaneously

### 8.5 Anchor Drag (10 minutes)

Tests anchor watch functionality. GPS position drifts outside the anchor circle.

**Protocol sources:**
- NMEA 2000: GPS position gradually moves — first within circle (5m wander), then drifts 50m downwind over 3 minutes
- Wind: steady 20 kn from the north

**Key checkpoints:**
- T+5m: Position exits anchor circle (30m radius)
- T+6m: Anchor drag alert raised
- T+8m: Position 80m from anchor point

### 8.6 Power Failure (5 minutes)

Simulates loss of the main battery bank. Victron data goes to zero, NMEA 2000 devices drop offline (no more CAN frames from battery-powered instruments). Tests graceful degradation.

**Protocol sources:**
- Victron: Battery voltage drops from 12.5V to 10.5V over 30 seconds, then VE.Direct stream stops
- NMEA 2000: Instruments stop broadcasting (GPS, wind, depth go silent), only instruments on a separate battery bank remain
- NMEA 0183: AIS receiver (independent power) continues

**Key checkpoints:**
- T+30s: Low voltage alert
- T+45s: VE.Direct adapter enters StateError (no data)
- T+1m: NMEA 2000 adapter reports lost devices
- T+2m: System running on degraded data (AIS only)

### 8.7 Multi-Vessel CPA (15 minutes)

Stress test for AIS processing. Multiple simultaneous CPA events from different directions.

**Protocol sources:**
- AIS: 30 vessels — 5 on collision course (CPA < 0.5nm), 10 passing safely (CPA 1-3nm), 15 distant
- Own ship: steady course and speed

**Key checkpoints:**
- T+3m: First CPA alert (container ship, CPA 0.2nm, TCPA 5m)
- T+5m: Three simultaneous CPA warnings
- T+10m: All close encounters resolved, alerts clear
- T+15m: All 30 vessels tracked without frame drops

---

## 9. CI Integration

### 9.1 Docker Compose

The CI environment runs the spoke binary alongside protocol simulators in Docker containers.

```yaml
# docker-compose.test.yml
version: "3.8"

services:
  spoke:
    build:
      context: .
      dockerfile: Dockerfile.spoke
    depends_on:
      - mosquitto
      - nmea-sim
      - victron-sim
    environment:
      - SPOKE_CONFIG=/etc/spoke/test-config.yaml
    networks:
      - testnet

  nmea-sim:
    build:
      context: .
      dockerfile: Dockerfile.simulator
    command: >
      simulator
        --nmea0183-tcp :10110
        --nmea2000-tcp :2000 --nmea2000-format ikonvert
        --ais-vessels 10
        --scenario coastal-passage
    ports:
      - "10110:10110"
      - "2000:2000"
    networks:
      - testnet

  victron-sim:
    build:
      context: .
      dockerfile: Dockerfile.simulator
    command: >
      simulator
        --victron-mqtt mosquitto:1883 --victron-portal-id test0001
        --victron-mppt --victron-bmv
        --scenario coastal-passage
    depends_on:
      - mosquitto
    networks:
      - testnet

  mosquitto:
    image: eclipse-mosquitto:2
    ports:
      - "1883:1883"
    volumes:
      - ./testdata/mosquitto.conf:/mosquitto/config/mosquitto.conf
    networks:
      - testnet

  # Linux-only: vcan for raw CAN frame testing
  vcan-setup:
    image: alpine:3.19
    privileged: true
    command: >
      sh -c "
        modprobe vcan &&
        ip link add dev vcan0 type vcan &&
        ip link set up vcan0 &&
        echo 'vcan0 ready' &&
        sleep infinity
      "
    network_mode: host
    profiles:
      - linux  # Only runs on Linux CI runners

networks:
  testnet:
    driver: bridge
```

### 9.2 CI Pipeline

```yaml
# .github/workflows/protocol-tests.yml (conceptual — actual syntax depends on CI system)

protocol-conformance:
  # Runs on every push and PR
  steps:
    - name: Start test infrastructure
      run: docker compose -f docker-compose.test.yml up -d

    - name: Wait for services
      run: |
        # Wait for NMEA simulator to be ready
        timeout 30 bash -c 'until nc -z localhost 10110; do sleep 1; done'
        # Wait for MQTT broker
        timeout 30 bash -c 'until nc -z localhost 1883; do sleep 1; done'

    - name: Run protocol adapter tests
      run: go test ./adapters/... -v -race -timeout 5m

    - name: Run integration tests
      run: go test ./integration/... -v -race -timeout 10m -tags=integration

    - name: PGN decode benchmark
      run: |
        go test ./adapters/nmea2000/... -bench=BenchmarkDecodePGN -benchtime=5s | tee bench.txt
        # Parse benchmark results and fail if below threshold
        go run ./cmd/checkbench --min-ops 10000 --input bench.txt

    - name: Tear down
      run: docker compose -f docker-compose.test.yml down -v
      if: always()

protocol-fuzzing:
  # Runs nightly
  schedule: "0 2 * * *"
  steps:
    - name: Fuzz CAN frame parser
      run: go test ./adapters/nmea2000/ -fuzz=FuzzCANFrameParse -fuzztime=10m

    - name: Fuzz NMEA 0183 parser
      run: go test ./adapters/nmea0183/ -fuzz=FuzzNMEA0183Parse -fuzztime=10m

    - name: Fuzz VE.Direct parser
      run: go test ./adapters/victron/ -fuzz=FuzzVEDirectParse -fuzztime=10m

    - name: Fuzz AIS decoder
      run: go test ./adapters/ais/ -fuzz=FuzzAISDecode -fuzztime=10m

    - name: Fuzz fast-packet reassembly
      run: go test ./adapters/nmea2000/ -fuzz=FuzzFastPacketReassembly -fuzztime=10m
```

### 9.3 Performance Benchmarks

```go
func BenchmarkDecodePGN(b *testing.B) {
    decoder := NewDecoder(DefaultPGNDatabase())

    // Pre-build a set of valid frames covering all supported PGNs
    frames := buildBenchmarkFrames()

    b.ResetTimer()
    b.ReportAllocs()

    for i := 0; i < b.N; i++ {
        frame := frames[i%len(frames)]
        _, err := decoder.Decode(frame)
        if err != nil {
            b.Fatal(err)
        }
    }
}

// Target: >10,000 PGN decodes per second on CI hardware.
// This is conservative — a Raspberry Pi 4 should manage 50,000+/s.
// A Mac Mini M4 should exceed 500,000/s.
// The benchmark ensures we never regress below the minimum.

func BenchmarkNMEA0183Parse(b *testing.B) {
    parser := NewNMEA0183Parser()
    sentences := loadBenchmarkSentences()

    b.ResetTimer()
    b.ReportAllocs()

    for i := 0; i < b.N; i++ {
        _, _ = parser.Parse(sentences[i%len(sentences)])
    }
}

func BenchmarkVEDirectBlock(b *testing.B) {
    parser := NewVEDirectParser()
    blocks := loadBenchmarkBlocks()

    b.ResetTimer()
    b.ReportAllocs()

    for i := 0; i < b.N; i++ {
        _ = parser.ParseBlock(blocks[i%len(blocks)])
    }
}

func BenchmarkAISDecode(b *testing.B) {
    decoder := NewAISDecoder()
    messages := loadBenchmarkAISMessages()

    b.ResetTimer()
    b.ReportAllocs()

    for i := 0; i < b.N; i++ {
        _, _ = decoder.Decode(messages[i%len(messages)])
    }
}
```

---

## 10. Go Package Structure

```
packages/api/
├── cmd/
│   ├── simulator/          # Combined protocol simulator binary
│   │   └── main.go         # CLI: --nmea0183-tcp, --nmea2000-tcp, --victron-mqtt, etc.
│   ├── inject/             # PGN injection CLI
│   │   └── main.go         # CLI: --pgn 127508 --voltage 12.85
│   ├── capture/            # Protocol capture tool
│   │   └── main.go         # CLI: --tcp, --serial, --mqtt → .adcap file
│   └── replay/             # Capture replay tool
│       └── main.go         # CLI: file.adcap → TCP/serial/MQTT/vcan
│
├── internal/
│   └── testharness/
│       ├── can/            # CAN frame construction and virtual bus
│       │   ├── frame.go        # Frame type, EncodeID, DecodeID
│       │   ├── builder.go      # PGN-aware frame builder
│       │   ├── builder_test.go
│       │   ├── vcan_linux.go   # SocketCAN vcan implementation (build tag: linux)
│       │   ├── vcan_tcp.go     # TCP fallback for macOS
│       │   └── vcan_test.go
│       │
│       ├── nmea2000/       # NMEA 2000 device simulator
│       │   ├── device.go       # Device type, network management
│       │   ├── profiles.go     # Pre-built device profiles (battery, GPS, wind, etc.)
│       │   ├── values.go       # ValueModel — realistic value variation
│       │   └── device_test.go
│       │
│       ├── nmea0183/       # NMEA 0183 sentence generation and server
│       │   ├── sentences.go    # GGA, RMC, HDT, DBT, MWV, VTG, XTE generators
│       │   ├── checksum.go     # XOR checksum calculation
│       │   ├── server.go       # TCP/UDP server
│       │   ├── track.go        # Track-following GPS simulation
│       │   └── sentences_test.go
│       │
│       ├── victron/        # Victron protocol simulators
│       │   ├── vedirect.go     # VE.Direct text protocol simulator
│       │   ├── vedirect_test.go
│       │   ├── cerbo.go        # Cerbo GX MQTT simulator
│       │   ├── cerbo_test.go
│       │   ├── vrm.go          # VRM API mock HTTP server
│       │   ├── vrm_test.go
│       │   └── solar.go        # Solar day cycle model
│       │
│       ├── ais/            # AIS message generation
│       │   ├── encode.go       # 6-bit encoding, message construction
│       │   ├── messages.go     # Type 1/2/3/5/18/19/24 generators
│       │   ├── fleet.go        # Fleet and scenario builder
│       │   ├── cpa.go          # CPA scenario calculator
│       │   └── encode_test.go
│       │
│       ├── replay/         # Capture and replay engine
│       │   ├── format.go       # Binary capture format read/write
│       │   ├── engine.go       # Replay engine with speed control
│       │   ├── capture.go      # Multi-source capture
│       │   ├── anonymise.go    # Data anonymisation
│       │   └── format_test.go
│       │
│       ├── fuzzer/         # Protocol fuzzing
│       │   ├── malformations.go    # Deterministic malformation generators
│       │   ├── contract.go         # Adapter fuzzer contract test
│       │   └── fuzz_targets.go     # testing.F fuzz targets (run from adapter test files)
│       │
│       └── scenarios/      # Pre-built test scenarios
│           ├── scenario.go         # Scenario type and checkpoint validation
│           ├── at_anchor.go        # 8-hour at anchor
│           ├── coastal_passage.go  # 6-hour coastal passage
│           ├── offshore.go         # 48-hour offshore
│           ├── engine_alarm.go     # 5-minute engine alarm
│           ├── anchor_drag.go      # 10-minute anchor drag
│           ├── power_failure.go    # 5-minute power failure
│           └── multi_vessel_cpa.go # 15-minute multi-vessel CPA
│
├── testdata/
│   ├── captures/           # Recorded .adcap files (real or generated)
│   │   ├── at-anchor-8hr.adcap
│   │   ├── coastal-passage-6hr.adcap
│   │   └── README           # Provenance notes for each capture
│   │
│   ├── scenarios/          # Scenario definition files (YAML)
│   │   ├── at-anchor.yaml
│   │   ├── coastal-passage.yaml
│   │   ├── offshore.yaml
│   │   ├── engine-alarm.yaml
│   │   ├── anchor-drag.yaml
│   │   ├── power-failure.yaml
│   │   └── multi-vessel-cpa.yaml
│   │
│   └── protocol/           # Raw protocol test fixtures
│       ├── nmea2000/
│       │   ├── ikonvert-frames.bin
│       │   ├── seasmart-sentences.nmea
│       │   ├── pgn-127508-battery.bin
│       │   ├── pgn-129025-position.bin
│       │   ├── fast-packet-126996-product-info.bin
│       │   └── fast-packet-interleaved.bin
│       │
│       ├── nmea0183/
│       │   ├── recorded-sentences.nmea
│       │   ├── checksum-failures.nmea
│       │   └── high-rate-gps.nmea
│       │
│       ├── victron/
│       │   ├── smartsolar-mppt.txt
│       │   ├── smartshunt.txt
│       │   ├── phoenix-inverter.txt
│       │   └── cerbo-mqtt-dump.json
│       │
│       └── ais/
│           ├── class-a-position.nmea
│           ├── class-b-position.nmea
│           ├── multi-sentence-type5.nmea
│           ├── type-24-partab.nmea
│           └── busy-harbour.nmea
│
└── docker-compose.test.yml
```

### Build Tags

```go
//go:build linux
// +build linux

// vcan_linux.go — SocketCAN implementation, only compiles on Linux
```

```go
//go:build !linux
// +build !linux

// vcan_tcp.go — TCP fallback, compiles on macOS and Windows
```

### CLI Binaries

All four CLI tools (`simulator`, `inject`, `capture`, `replay`) are built from `cmd/` and installed with:

```bash
go install ./cmd/simulator
go install ./cmd/inject
go install ./cmd/capture
go install ./cmd/replay
```

Binary names follow the project convention:

| Binary | Installed as | Purpose |
|--------|-------------|---------|
| `cmd/simulator` | `abovedeck-simulator` | Multi-protocol device simulator |
| `cmd/inject` | `abovedeck-inject` | Single PGN injection tool |
| `cmd/capture` | `abovedeck-capture` | Multi-source protocol recorder |
| `cmd/replay` | `abovedeck-replay` | Capture file playback |

---

## 11. Appendix: PGN Quick Reference

Commonly used PGNs and their test harness field names for the `--pgn` injection CLI:

| PGN | Name | Fields |
|-----|------|--------|
| 127250 | Vessel Heading | `--heading`, `--deviation`, `--variation`, `--reference` |
| 127488 | Engine Rapid | `--instance`, `--rpm`, `--boost-pressure`, `--tilt-trim` |
| 127489 | Engine Dynamic | `--instance`, `--oil-pressure`, `--coolant-temp`, `--exhaust-temp`, `--fuel-rate`, `--hours` |
| 127505 | Fluid Level | `--type`, `--instance`, `--level`, `--capacity` |
| 127508 | Battery Status | `--instance`, `--voltage`, `--current`, `--temperature` |
| 128259 | Speed | `--stw` (speed through water) |
| 128267 | Water Depth | `--depth`, `--offset` |
| 129025 | Position Rapid | `--lat`, `--lon` |
| 129026 | COG/SOG Rapid | `--cog`, `--sog`, `--reference` |
| 130306 | Wind Data | `--speed`, `--angle`, `--reference` |
| 130312 | Temperature | `--instance`, `--source`, `--temperature` |
| 60928 | Address Claim | `--unique-number`, `--manufacturer`, `--device-function`, `--device-class` |
| 126996 | Product Info | `--model-id`, `--software-version`, `--serial` |
