# Go (Golang) Ecosystem for Marine/Boat Applications

**Date:** 2026-03-20
**Status:** Research complete
**Related:** [Matter Protocol Research](./matter-protocol-iot-integration.md) | [Hardware Connectivity](./hardware-connectivity-technologies.md)

---

## Executive Summary

Go is well-positioned as the backend language for a marine data platform. The ecosystem covers every protocol layer Above Deck needs: NMEA 0183/2000 parsing, CAN bus access, Victron integration (serial, MQTT, Modbus, BLE), Bluetooth Low Energy, Matter/IoT, mDNS discovery, WebSocket streaming, and serial port communication. Most libraries are pure Go with zero CGo dependencies, enabling single-binary cross-compilation to ARM64 (Raspberry Pi) — the target deployment hardware.

No Go-based SignalK server exists beyond a dormant proof-of-concept (Argo, last updated 2021). This is the gap Above Deck fills: a Go-native marine data server that speaks every protocol without Node.js.

---

## 1. Go NMEA 0183 Libraries

### Library Comparison

| Library | Stars | Last Active | License | Key Strength |
|---------|-------|-------------|---------|--------------|
| [adrianmo/go-nmea](https://github.com/adrianmo/go-nmea) | 258 | Aug 2024 | MIT | De facto standard. 100+ sentence types. Custom parser registration |
| [martinmarsh/nmea0183](https://pkg.go.dev/github.com/martinmarsh/nmea0183) | ~10 | 2023 | MIT | Battle-tested on real marine hardware (OpenCPN, Actisense, Raymarine) |
| [pilebones/go-nmea](https://github.com/pilebones/go-nmea) | ~30 | 2022 | MIT | Standard + proprietary sentence decode/serialize |
| [BertoldVdb/go-ais](https://github.com/BertoldVdb/go-ais) | 68 | Jul 2021 | MIT | Full AIS encode/decode (ITU-R M.1371-5). Separate from NMEA layer |

### adrianmo/go-nmea — Deep Dive

The dominant Go NMEA library. Packaged in Ubuntu/Debian (`golang-github-adrianmo-go-nmea-dev`).

**Supported sentences (100+):** RMC, GGA, GLL, GSA, GSV, VTG, HDG, HDT, HDM, MWV, MWD, VBW, DBS, DBT, DPT, MTW, MDA, VHW, BWC, RTE, WPL, APB, BOD, XTE, RMB, AAM, GNS, THS, VDM, VDO, and many more including proprietary (PASHR, PGRME, PGRMT, PMTK, PCDIN).

**Key features:**
- NMEA 4.10 TAG Block support (timestamped, source-tagged sentences)
- Custom parser registration for proprietary sentences
- Pure Go, zero dependencies
- Coordinate formatting (GPS decimal degrees, DMS)

**Autopilot sentence support:** APB (Autopilot Sentence B), XTE (Cross-Track Error), RMB (Recommended Minimum Navigation), BWC (Bearing & Distance to Waypoint) — the sentences needed to drive an autopilot.

### NMEA 0183 Sentence Generation

adrianmo/go-nmea is primarily a parser. For sentence generation (writing NMEA commands to autopilots, AIS transponders, etc.), the library's struct types can be serialised manually:

1. Populate the sentence struct (e.g., `APB{}`)
2. Format fields per NMEA spec
3. Calculate and append the checksum (`*XX`)
4. Write to serial port

This is straightforward to implement — NMEA 0183 is a simple ASCII protocol. A sentence generator wrapper (~200-300 lines) on top of go-nmea structs would cover autopilot command generation.

### AIS Decoding

[BertoldVdb/go-ais](https://github.com/BertoldVdb/go-ais) is the standout library:

- Full ITU-R M.1371-5 compliance (all AIS message types, not just a subset)
- **Bidirectional:** both decode and encode AIS packets
- Separates NMEA decoding from AIS decoding — works with raw RF data or NMEA VDM/VDO sentences
- Convenience `aisnmea` package combines NMEA + AIS in one step
- 68 stars, MIT licensed

**Above Deck fit:** Use adrianmo/go-nmea for NMEA 0183 parsing, BertoldVdb/go-ais for AIS decode/encode. Both are pure Go, composable.

---

## 2. Go CAN Bus / NMEA 2000

### CAN Bus Library Comparison

| Library | Stars | Last Active | License | Key Strength |
|---------|-------|-------------|---------|--------------|
| [einride/can-go](https://github.com/einride/can-go) | 229 | Feb 2026 | MIT | Production-grade CAN SDK. SocketCAN + DBC code-gen |
| [brutella/can](https://github.com/brutella/can) | ~80 | 2023 | MIT | Simple SocketCAN interface. Read/write CAN frames |
| [go-daq/canbus](https://pkg.go.dev/github.com/go-daq/canbus) | ~30 | 2022 | BSD | Part of go-daq scientific data tools |
| [notnil/canbus](https://pkg.go.dev/github.com/notnil/canbus) | ~15 | Sep 2025 | MIT | Idiomatic, dependency-free. Includes CANopen subpackage |
| [angelodlfrtr/go-can](https://github.com/angelodlfrtr/go-can) | ~20 | 2022 | MIT | Multi-transport (serial adapter, socketcan) |

### NMEA 2000 Specific Libraries

| Library | Stars | Last Active | Key Strength |
|---------|-------|-------------|--------------|
| [boatkit-io/n2k](https://github.com/boatkit-io/n2k) | 8 | 2024 | Code-gen from canboat.json. Strongly typed Go structs per PGN |
| [aldas/go-nmea-client](https://github.com/aldas/go-nmea-client) | 16 | 2024 | Reads N2K from SocketCAN, Actisense NGT1/W2K-1. Fast-packet assembly |
| [timmathews/argo](https://github.com/timmathews/argo) | 12 | Jun 2021 | Signal K-compliant Go server with N2K support (dormant) |

### einride/can-go — Deep Dive

The most actively maintained and feature-rich CAN library in Go:

- **SocketCAN integration:** Uses Linux kernel SocketCAN abstraction directly. No userspace CAN drivers needed
- **DBC code generation:** `cantool` generates Go code from `.dbc` database files — auto-creates message marshal/unmarshal methods
- **Frame management:** Receiver/transmitter patterns for CAN frame I/O
- **UDP multicast:** Alternative transport for testing/simulation
- **31 releases**, actively maintained (v0.17.0, Feb 2026)
- Pure Go (99.4% Go)

### boatkit-io/n2k — Deep Dive

Purpose-built for NMEA 2000 marine data:

- **Code generation from canboat.json:** The `pgngen` command reads the canboat PGN database and generates `pgninfo_generated.go` with constants, types, and decoders for every known PGN
- **Strongly typed:** Each PGN becomes a Go struct — no manual byte manipulation
- **Transport abstraction:** Endpoint interface allows plugging in different gateways (Actisense, SocketCAN, file replay)
- **Tooling:** `convertdumps` translates between .ydr, .raw, .CAN, .n2k file formats; `replay` renders recorded data as Go structs

### CANboat Integration

[CANboat](https://github.com/canboat/canboat) is the authoritative open-source NMEA 2000 PGN database, reverse-engineered from network observation and public sources. It provides:

- `canboat.json` / `canboat.xml` — complete PGN definitions (field names, types, units, ranges)
- C-based analyzer and writer tools
- Used by both `boatkit-io/n2k` and `aldas/go-nmea-client`

**Above Deck strategy:** Use einride/can-go for low-level SocketCAN access on Linux (Raspberry Pi + PICAN-M HAT), with boatkit-io/n2k's code-gen approach to produce typed Go structs from canboat PGN definitions. This gives type-safe NMEA 2000 parsing without C dependencies.

### SocketCAN on Linux (Raspberry Pi)

The Linux kernel provides SocketCAN — a socket-based CAN bus interface. On a Raspberry Pi with a PICAN-M HAT (MCP2515 CAN controller):

```
# Enable CAN interface
ip link set can0 type can bitrate 250000
ip link set up can0
```

Go accesses this through standard socket syscalls. einride/can-go wraps this cleanly:

```go
conn, _ := socketcan.DialContext(ctx, "can", "can0")
recv := socketcan.NewReceiver(conn)
for recv.Receive() {
    frame := recv.Frame()
    // Parse PGN from CAN frame...
}
```

NMEA 2000 runs at 250 kbps on CAN bus. The Go runtime on a Raspberry Pi 5 handles this throughput trivially.

---

## 3. Go Victron Integration

Victron Energy devices expose data through multiple protocols. All are accessible from Go.

### Protocol Matrix

| Protocol | Transport | Go Library | Maturity | Use Case |
|----------|-----------|-----------|----------|----------|
| VE.Direct | Serial (19200 baud) | [rosenstand/go-vedirect](https://github.com/rosenstand/go-vedirect) | Low (proof-of-concept) | Direct connection to MPPT, BMV, inverters |
| MQTT | TCP | [eclipse-paho/paho.mqtt.golang](https://github.com/eclipse-paho/paho.mqtt.golang) | Excellent (3.1k stars) | Read from Cerbo GX / Venus OS |
| Modbus TCP | TCP port 502 | [goburrow/modbus](https://github.com/goburrow/modbus) | Excellent (1k stars) | Industrial integration with GX devices |
| BLE | Bluetooth | tinygo-org/bluetooth + custom parser | Medium | Passive read via BLE advertising |
| NMEA 2000 | CAN bus | einride/can-go + n2k | Good | When Victron is on the N2K bus |

### VE.Direct Protocol in Go

**Protocol overview:** 19200 baud, 8N1 serial. Two modes:
1. **Text mode** — device broadcasts key/value pairs every second (read-only monitoring)
2. **HEX mode** — bidirectional commands for configuration and real-time data

**Existing Go libraries:**

| Library | Stars | Status | Notes |
|---------|-------|--------|-------|
| [rosenstand/go-vedirect](https://github.com/rosenstand/go-vedirect) | 5 | Proof-of-concept | Text mode only. Tested on SmartSolar MPPT 75/15. Uses tarm/serial. Author's first Go program |
| [bencevans/ve.direct](https://github.com/bencevans/ve.direct) | ~10 | Basic | Text mode with checksum validation |

**Assessment:** Neither library is production-ready. Above Deck should implement its own VE.Direct adapter:
- Text mode parsing is trivial (~100 lines) — ASCII key=value with checksum
- HEX mode for commands adds ~300-500 lines
- Use go.bug.st/serial (modern, maintained) instead of tarm/serial
- Reference the [official VE.Direct protocol spec (PDF)](https://www.victronenergy.com/upload/documents/VE.Direct-Protocol-3.34.pdf)

### MQTT Client (for Victron Cerbo GX / Venus OS)

The primary integration path for Victron systems with a Cerbo GX or Venus OS device.

| Library | Stars | Last Active | MQTT Version | Notes |
|---------|-------|-------------|-------------|-------|
| [eclipse-paho/paho.mqtt.golang](https://github.com/eclipse-paho/paho.mqtt.golang) | 3,100 | Sep 2025 | 3.1/3.1.1 | De facto standard. Imported by 5,004 projects |
| [eclipse-paho/paho.golang](https://github.com/eclipse-paho/paho.golang) | ~200 | 2025 | 5.0 | MQTT v5 with autopaho wrapper for auto-reconnect |

**paho.mqtt.golang features:**
- Fully asynchronous operation
- WebSocket transport (ws://, wss://)
- QoS 0, 1, 2 support
- Persistent message store (file or memory)
- Auto-reconnection
- Proxy support (HTTP_PROXY, HTTPS_PROXY)

**Victron MQTT topics** follow the pattern `N/<portal_id>/<service>/<instance>/<path>`. For example:
- `N/<id>/battery/0/Soc` — battery state of charge
- `N/<id>/solarcharger/0/Yield/Power` — solar power output
- `N/<id>/system/0/Dc/Battery/Voltage` — system battery voltage

### Modbus TCP Client

For direct register access to Victron GX devices (port 502).

| Library | Stars | Last Active | Features |
|---------|-------|-------------|----------|
| [goburrow/modbus](https://github.com/goburrow/modbus) | 1,000 | 2024 | TCP + RTU. Bit/register access. Production-proven |
| [aldas/go-modbus-client](https://github.com/aldas/go-modbus-client) | ~50 | 2025 | TCP/RTU/UDP. Endianness handling. Batch field builders |
| [simonvetter/modbus](https://github.com/simonvetter/modbus) | ~100 | 2024 | Client + server. High-level API with native Go types |
| [grid-x/modbus](https://pkg.go.dev/github.com/grid-x/modbus) | ~50 | Nov 2025 | Fault-tolerant, fail-fast. Fork of goburrow |

**goburrow/modbus** is the safe choice — 1,000 stars, widely used, supports both TCP and RTU. Victron publishes a [Modbus register map](https://github.com/victronenergy/dbus_modbustcp/blob/master/CCGX-Modbus-TCP-register-list.xlsx) for all GX devices.

### Victron BLE Protocol

Victron devices broadcast data via BLE advertising packets — no connection required, just passive scanning.

**Protocol details:**
- Uses BLE manufacturer data in advertising packets
- Manufacturer ID prefix `e12110` identifies Victron devices
- Data is AES-encrypted; the encryption key is extracted from VictronConnect app
- Broadcasts battery voltage, current, SoC, solar yield, device state

**Go implementation path:**
1. Use `tinygo-org/bluetooth` for BLE scanning
2. Parse manufacturer data from advertising packets
3. Decrypt with AES key (obtained from VictronConnect)
4. Map to Above Deck data model

**Reference implementations:** [victron-ble (Python)](https://github.com/keshavdv/victron-ble), [esphome-victron_ble (ESPHome/C++)](https://github.com/Fabian-Schmidt/esphome-victron_ble). No Go implementation exists — Above Deck would be the first.

---

## 4. Go BLE (Bluetooth Low Energy)

### Library Comparison

| Library | Stars | Last Active | Platforms | GATT Client | GATT Server | CGo Required |
|---------|-------|-------------|-----------|-------------|-------------|-------------|
| [tinygo-org/bluetooth](https://github.com/tinygo-org/bluetooth) | 953 | 2025 | Linux, macOS, Windows, bare metal (Nordic, ESP32) | Yes (all platforms) | Yes (Linux, Windows, Nordic, ESP32 — not macOS) | Yes (BlueZ/CoreBluetooth) |
| [go-ble/ble](https://github.com/go-ble/ble) | 327 | 2022 | Linux, macOS (macOS unmaintained) | Yes | Yes | Yes |

### tinygo-org/bluetooth — Deep Dive

The primary Go BLE library. Cross-platform with desktop and microcontroller support.

**Platform backends:**
- **Linux:** BlueZ (D-Bus API)
- **macOS:** CoreBluetooth (via CGo/Objective-C)
- **Windows:** WinRT
- **Bare metal:** Nordic SoftDevice, ESP32 (NINA-FW), CYW43439 (RP2040-W)

**Capabilities:**

| Feature | Linux | macOS | Windows | Bare Metal |
|---------|-------|-------|---------|------------|
| Scan/discover | Yes | Yes | Yes | Yes |
| Connect (Central) | Yes | Yes | Yes | Yes |
| Read/write characteristics | Yes | Yes | Yes | Yes |
| Notifications | Yes | Yes | Yes | Yes |
| Advertise (Peripheral) | Yes | No | Yes | Yes |
| Local GATT server | Yes | No | Yes | Yes |

**Limitations:**
- API is not yet stable (pre-1.0)
- No bonding/pairing support
- No scan UUID filtering
- macOS cannot act as a peripheral

**Above Deck use cases:**
1. **Victron BLE** — scan for manufacturer advertising data (Central/scan only)
2. **Sensor reading** — connect to BLE GATT sensors (temperature, humidity, tank levels)
3. **Future:** expose Above Deck as a BLE peripheral for mobile app communication

**CGo note:** tinygo-org/bluetooth requires CGo on all desktop platforms (BlueZ on Linux, CoreBluetooth on macOS). This complicates cross-compilation — you need the target platform's C libraries. On the Raspberry Pi deployment target (Linux ARM64), this is straightforward since you build on the target or use a cross-compilation Docker container with ARM64 BlueZ headers.

---

## 5. Go Matter Protocol

Covered in depth in [matter-protocol-iot-integration.md](./matter-protocol-iot-integration.md). Summary:

| Library | Stars | Status | Notes |
|---------|-------|--------|-------|
| [tom-code/gomat](https://github.com/tom-code/gomat) | 52 | Most complete | Commissioning, PASE, CASE, discovery, subscriptions. Pure Go |
| [cybergarage/go-matter](https://github.com/cybergarage/go-matter) | 33 | Early stage | mDNS discovery implemented. Self-described hobby project |

**Feasibility:** A minimal Matter controller (discover, commission, read, subscribe, command) is ~3,000-5,000 lines of pure Go using stdlib crypto and an mDNS library. gomat proves the approach works on real hardware.

**Above Deck plan:** Build a clean Matter controller as a Go package, tested against connectedhomeip virtual devices. Start with temperature, humidity, contact sensor, on/off, and electrical measurement clusters.

---

## 6. Go mDNS / Service Discovery

### Library Comparison

| Library | Stars | Last Active | Features | Notes |
|---------|-------|-------------|----------|-------|
| [hashicorp/mdns](https://github.com/hashicorp/mdns) | ~1,200 | Jan 2025 | Client/server mDNS. Simple API | Imported by 242 projects. Lightweight |
| [grandcat/zeroconf](https://github.com/grandcat/zeroconf) | ~800 | 2023 | Full DNS-SD (RFC 6762/6763). Browse + register | Avahi-compatible. Multiple active forks |
| [libp2p/zeroconf](https://github.com/libp2p/zeroconf) | ~50 | 2024 | Fork of grandcat with fixes | Used by libp2p/IPFS ecosystem |
| [enbility/zeroconf/v2](https://pkg.go.dev/github.com/enbility/zeroconf/v2) | ~20 | 2024 | Updated fork with v2 module | Active maintenance |

### Recommendation

**hashicorp/mdns** for simple service advertisement/discovery. **grandcat/zeroconf** (or enbility fork) when full DNS-SD browsing is needed (e.g., Matter device discovery).

**Above Deck use cases:**
1. **Service advertisement** — Above Deck server advertises itself on the local network (`_above-deck._tcp.local`)
2. **Matter discovery** — find Matter devices via mDNS/DNS-SD
3. **SignalK compatibility** — advertise as a SignalK data source for other marine software

---

## 7. Go Web Server / API

### Standard Library

Go's `net/http` is production-grade out of the box. No framework needed for a REST API.

**Key capabilities:**
- HTTP/1.1 and HTTP/2 (native)
- TLS (built-in)
- Mux routing (Go 1.22+ enhanced pattern matching)
- Middleware composition
- Graceful shutdown

### WebSocket Libraries

| Library | Stars | Last Active | Key Feature | Notes |
|---------|-------|-------------|-------------|-------|
| [coder/websocket](https://github.com/coder/websocket) | 5,000 | Sep 2025 | context.Context native. Concurrent-write safe | Formerly nhooyr/websocket. Zero dependencies. **Recommended for new projects** |
| [gorilla/websocket](https://github.com/gorilla/websocket) | ~22,000 | Archived 2022 | Battle-tested. Massive ecosystem | Archived — no security patches. Use coder/websocket instead |

**coder/websocket advantages over gorilla:**
- Concurrent writes are safe (gorilla panics without external sync)
- First-class context.Context (cancellation, timeouts)
- Zero dependencies, zero-allocation reads/writes
- 1.75x faster WebSocket masking (pure Go)
- Fully passes autobahn-testsuite
- net.Conn wrapper for protocol upgrades
- RFC 7692 permessage-deflate compression

### Real-Time Data Streaming Pattern

For marine instrument data (GPS updates at 10Hz, wind at 2Hz, depth at 1Hz):

```
Client (MFD browser) ←── WebSocket ──→ Go Server
                                           │
                    ┌──────────────────────┤
                    ▼                      ▼
              NMEA adapter          Victron adapter
              (serial/CAN)          (MQTT/serial)
```

Use Go channels internally to fan-out data from protocol adapters to WebSocket connections. coder/websocket's concurrent-write safety means no mutex needed per connection.

### gRPC

| Component | Notes |
|-----------|-------|
| [grpc/grpc-go](https://github.com/grpc/grpc-go) | Official Go gRPC. HTTP/2 multiplexing. Protobuf serialisation |
| buf.build | Modern protobuf tooling (linting, breaking change detection) |

**Above Deck use case:** gRPC is overkill for a single-binary server. Use it only if the architecture splits into separate services (e.g., Matter controller as a separate process). For internal communication within the monolithic Go server, use Go channels and interfaces.

### Embedded Static File Serving

Go 1.16+ `embed` package bundles the Astro-built frontend into the Go binary:

```go
//go:embed dist/*
var staticFiles embed.FS

func main() {
    sub, _ := fs.Sub(staticFiles, "dist")
    http.Handle("/", http.FileServer(http.FS(sub)))
}
```

**Result:** A single binary that serves both the API and the frontend. Copy one file to the Raspberry Pi and it runs. No Node.js, no npm, no file paths to configure.

---

## 8. Go Serial Port

### Library Comparison

| Library | Last Active | CGo | Port Enumeration | Platforms | Notes |
|---------|-------------|-----|-------------------|-----------|-------|
| [go.bug.st/serial](https://github.com/bugst/go-serial) | Mar 2025 | macOS only (IOKit) | Yes (companion `enumerator` package) | Linux, macOS, Windows | **Recommended.** Modern go.mod. Used by Arduino CLI |
| [tarm/serial](https://github.com/tarm/serial) | 2020 | No | No | Linux, macOS, Windows | Minimal API. Read/Write/Close only. Legacy |

### Recommendation

**go.bug.st/serial** is the clear choice:
- Actively maintained (2025)
- USB port enumeration (find which `/dev/ttyUSB*` is the Victron, which is the GPS)
- No CGo on Linux (only macOS for IOKit)
- Used by Arduino's official CLI tooling
- Configurable: baud rate, parity, stop bits, flow control

**Above Deck use cases:**
- VE.Direct serial connection (19200 baud)
- NMEA 0183 serial connection (4800 or 38400 baud for AIS)
- Actisense NGT-1 USB (NMEA 2000 gateway)

---

## 9. Existing Go Marine Projects

### Project Survey

| Project | Stars | Last Active | What It Does | Status |
|---------|-------|-------------|--------------|--------|
| [timmathews/argo](https://github.com/timmathews/argo) | 12 | Jun 2021 | Signal K server in Go. NMEA 2000 via Actisense. WebSocket/MQTT/ZeroMQ transport | **Dormant.** Closest thing to a Go SignalK server. 166 commits |
| [boatkit-io/n2k](https://github.com/boatkit-io/n2k) | 8 | 2024 | NMEA 2000 parsing library. Code-gen from canboat | Active. Library only (no server) |
| [aldas/go-nmea-client](https://github.com/aldas/go-nmea-client) | 16 | 2024 | N2K reader: SocketCAN, Actisense, canboat formats | Active. Includes n2k-reader CLI tool |
| [BertoldVdb/go-ais](https://github.com/BertoldVdb/go-ais) | 68 | Jul 2021 | Full AIS encoder/decoder (ITU-R M.1371-5) | Stable. Complete implementation |
| [adrianmo/go-nmea](https://github.com/adrianmo/go-nmea) | 258 | Aug 2024 | NMEA 0183 parser. 100+ sentence types | Stable. Community standard |
| [hybridgroup/gopherboat](https://github.com/hybridgroup/gopherboat) | ~5 | 2023 | TinyGo robotic boat (demo/educational) | Novelty project |

### Key Finding: No Go SignalK Server

The SignalK reference server is Node.js. The Java implementation exists but is secondary. **Argo** was the only attempt at a Go SignalK server and is abandoned (2021).

This means Above Deck's Go server would be the first actively maintained Go-native marine data server. It does not need to implement the full SignalK spec — it can expose a SignalK-compatible REST/WebSocket API for interoperability while using its own internal data model.

### Go AIS Ecosystem

[go-ais](https://github.com/BertoldVdb/go-ais) stands out:
- Encodes AND decodes (most libraries only decode)
- Covers all message types per ITU-R M.1371-5
- Separates NMEA transport from AIS payload — works with raw bitstreams or NMEA sentences
- MIT licensed, stable codebase

A second AIS library exists at [nilsmagnus/go-ais](https://pkg.go.dev/github.com/nilsmagnus/go-ais) but is less feature-complete.

---

## 10. Go for Embedded / IoT

### Raspberry Pi Deployment

**Cross-compilation** is trivial for pure Go:

```bash
GOOS=linux GOARCH=arm64 go build -o above-deck-server ./cmd/server
```

Result: a single static binary. Copy to the Pi, run it. No runtime dependencies.

**CGo complication:** Libraries requiring CGo (tinygo-org/bluetooth, macOS serial enumeration) need ARM64 cross-compilation toolchains. Options:
1. Build on the Pi directly (slow but simple)
2. Docker cross-compilation container with ARM64 headers
3. GitHub Actions with ARM64 runner

**Performance on Raspberry Pi 5:**
- 4-core ARM Cortex-A76 @ 2.4 GHz, 8 GB RAM
- Go runtime starts in <100ms
- NMEA parsing: thousands of sentences/second (CPU is not the bottleneck)
- CAN bus at 250 kbps: trivial for any modern ARM processor
- WebSocket serving 10+ simultaneous MFD clients: well within capacity
- Typical memory footprint for a Go server: 20-50 MB

### TinyGo for Microcontrollers

| Feature | Status (2026) |
|---------|---------------|
| ESP32 support | GPIO, PWM, I2C, SPI, UART. WiFi/BLE experimental |
| ESP32-C6 (Thread) | Board support exists. Thread stack not in TinyGo |
| RP2040 (Pico) | Full support including multicore (TinyGo 0.34+) |
| Nordic nRF52840 | Full support with BLE via SoftDevice |
| Garbage collector | 10% faster in latest release |
| Performance vs C | Close to C/C++ in benchmarks (FFT, CRC, SHA on ESP32) |

**Above Deck relevance:** TinyGo is relevant for custom sensor firmware (e.g., tank level sensor on an ESP32 that speaks BLE or MQTT). It is NOT the right choice for the main server — use standard Go for that.

### Memory Footprint Comparison

| Runtime | Typical Server Memory | Binary Size |
|---------|----------------------|-------------|
| Go (standard) | 20-50 MB | 10-30 MB |
| Node.js (SignalK) | 100-300 MB | N/A (runtime + node_modules) |
| TinyGo (microcontroller) | 10-100 KB | 50-500 KB |

Go's memory footprint is 3-10x smaller than Node.js for equivalent marine server workloads, which matters on a Raspberry Pi running alongside other services.

### ARM64 Cross-Compilation Matrix

| Target | GOOS | GOARCH | GOARM | CGo Needed | Notes |
|--------|------|--------|-------|------------|-------|
| Raspberry Pi 5 (64-bit) | linux | arm64 | — | Only for BLE | Primary target |
| Raspberry Pi 4 (64-bit) | linux | arm64 | — | Only for BLE | Same binary as Pi 5 |
| Raspberry Pi Zero 2 W | linux | arm64 | — | Only for BLE | Works but slower |
| Raspberry Pi 3/Zero (32-bit) | linux | arm | 6 or 7 | Only for BLE | Legacy support if needed |

---

## 11. Recommended Library Stack for Above Deck

### Core Dependencies

| Layer | Library | Why |
|-------|---------|-----|
| **NMEA 0183 parsing** | adrianmo/go-nmea | 258 stars, 100+ sentences, community standard |
| **AIS decode/encode** | BertoldVdb/go-ais | Full ITU-R M.1371-5, bidirectional |
| **CAN bus (SocketCAN)** | einride/can-go | 229 stars, actively maintained, DBC code-gen |
| **NMEA 2000 PGNs** | boatkit-io/n2k (code-gen approach) | Typed Go structs from canboat database |
| **Serial ports** | go.bug.st/serial | Modern, maintained, USB enumeration |
| **MQTT client** | eclipse-paho/paho.mqtt.golang | 3.1k stars, de facto standard |
| **Modbus TCP** | goburrow/modbus | 1k stars, production-proven |
| **WebSocket** | coder/websocket | 5k stars, context-native, concurrent-safe |
| **mDNS/DNS-SD** | grandcat/zeroconf (enbility fork) | Full DNS-SD for Matter + service advertisement |
| **BLE** | tinygo-org/bluetooth | 953 stars, cross-platform, GATT client |
| **HTTP server** | net/http (stdlib) | No framework needed |
| **Static files** | embed (stdlib) | Single binary with frontend |

### Build-vs-Buy Decisions

| Component | Decision | Rationale |
|-----------|----------|-----------|
| VE.Direct parser | **Build** | Existing Go libs are proof-of-concept. Protocol is simple (ASCII key=value) |
| Victron BLE parser | **Build** | No Go implementation exists. Reference Python/C++ implementations available |
| NMEA sentence generator | **Build** | ~200-300 lines on top of go-nmea structs |
| Matter controller | **Build** | gomat as reference. Pure Go, ~3-5k lines |
| NMEA 0183 parser | **Use** adrianmo/go-nmea | Mature, comprehensive, widely used |
| AIS codec | **Use** BertoldVdb/go-ais | Complete implementation, MIT licensed |
| CAN bus access | **Use** einride/can-go | Production-grade, actively maintained |
| MQTT client | **Use** paho.mqtt.golang | De facto standard, 5k+ importers |

---

## 12. Architecture: Single Binary Marine Server

```
┌─────────────────────────────────────────────────────────┐
│                    Single Go Binary                      │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Embedded Astro Frontend               │   │
│  │           (embed.FS → net/http.FileServer)        │   │
│  └──────────────────────┬───────────────────────────┘   │
│                          │                               │
│  ┌──────────────────────┴───────────────────────────┐   │
│  │          REST API + WebSocket Server               │   │
│  │     (net/http + coder/websocket)                   │   │
│  └──────────────────────┬───────────────────────────┘   │
│                          │                               │
│  ┌──────────────────────┴───────────────────────────┐   │
│  │            Unified Data Model + Channels           │   │
│  └───┬──────┬──────┬──────┬──────┬──────┬───────────┘   │
│      │      │      │      │      │      │                │
│  ┌───┴──┐┌──┴──┐┌──┴──┐┌──┴──┐┌──┴──┐┌──┴──────┐      │
│  │NMEA  ││NMEA ││Victr││MQTT ││BLE  ││ Matter  │      │
│  │0183  ││2000 ││on   ││     ││     ││ Ctrl    │      │
│  │      ││     ││VE.D ││     ││     ││         │      │
│  └───┬──┘└──┬──┘└──┬──┘└──┬──┘└──┬──┘└──┬──────┘      │
│      │      │      │      │      │      │                │
│  go.bug  einride  go.bug  paho  tinygo  gomat-          │
│  serial  can-go   serial  mqtt  blue-   style           │
│                                  tooth                   │
└──────────────────────────────────────────────────────────┘
         │         │         │                │
    ┌────┴───┐ ┌───┴────┐ ┌──┴───┐     ┌─────┴─────┐
    │GPS,AIS │ │PICAN-M │ │Victron│     │Thread mesh│
    │RS-422  │ │CAN bus │ │MPPT   │     │sensors    │
    └────────┘ └────────┘ └──────┘     └───────────┘
```

**Deployment:** `scp above-deck-server pi@boat:~/` then `./above-deck-server`. One binary, all protocols, embedded frontend. No Node.js, no Docker required (though Docker is optional for updates).

---

## References

### NMEA 0183
- [adrianmo/go-nmea — GitHub](https://github.com/adrianmo/go-nmea)
- [adrianmo/go-nmea — Go Packages](https://pkg.go.dev/github.com/adrianmo/go-nmea)
- [martinmarsh/nmea0183 — Go Packages](https://pkg.go.dev/github.com/martinmarsh/nmea0183)
- [pilebones/go-nmea — GitHub](https://github.com/pilebones/go-nmea)

### AIS
- [BertoldVdb/go-ais — GitHub](https://github.com/BertoldVdb/go-ais)
- [nilsmagnus/go-ais — Go Packages](https://pkg.go.dev/github.com/nilsmagnus/go-ais)

### CAN Bus / NMEA 2000
- [einride/can-go — GitHub](https://github.com/einride/can-go)
- [boatkit-io/n2k — GitHub](https://github.com/boatkit-io/n2k)
- [aldas/go-nmea-client — GitHub](https://github.com/aldas/go-nmea-client)
- [brutella/can — GitHub](https://github.com/brutella/can)
- [canboat/canboat — GitHub](https://github.com/canboat/canboat)
- [CANboat documentation](https://canboat.github.io/canboat/canboat.html)

### Victron
- [VE.Direct Protocol Spec (PDF)](https://www.victronenergy.com/upload/documents/VE.Direct-Protocol-3.34.pdf)
- [rosenstand/go-vedirect — GitHub](https://github.com/rosenstand/go-vedirect)
- [bencevans/ve.direct — GitHub](https://github.com/bencevans/ve.direct)
- [keshavdv/victron-ble (Python reference) — GitHub](https://github.com/keshavdv/victron-ble)
- [esphome-victron_ble — GitHub](https://github.com/Fabian-Schmidt/esphome-victron_ble)
- [Victron BLE Protocol Discussion](https://community.victronenergy.com/questions/187303/victron-bluetooth-advertising-protocol.html)

### MQTT
- [eclipse-paho/paho.mqtt.golang — GitHub](https://github.com/eclipse-paho/paho.mqtt.golang)
- [eclipse-paho/paho.golang (MQTT v5) — GitHub](https://github.com/eclipse-paho/paho.golang)
- [EMQX — How to Use MQTT in Golang](https://www.emqx.com/en/blog/how-to-use-mqtt-in-golang)

### Modbus
- [goburrow/modbus — GitHub](https://github.com/goburrow/modbus)
- [aldas/go-modbus-client — GitHub](https://github.com/aldas/go-modbus-client)
- [simonvetter/modbus — GitHub](https://github.com/simonvetter/modbus)

### BLE
- [tinygo-org/bluetooth — GitHub](https://github.com/tinygo-org/bluetooth)
- [go-ble/ble — GitHub](https://github.com/go-ble/ble)
- [Ecostack — BLE with Golang](https://ecostack.dev/posts/go-bluetooth-low-energy/)

### Matter
- [tom-code/gomat — GitHub](https://github.com/tom-code/gomat)
- [cybergarage/go-matter — GitHub](https://github.com/cybergarage/go-matter)
- See [matter-protocol-iot-integration.md](./matter-protocol-iot-integration.md) for full analysis

### mDNS / Service Discovery
- [hashicorp/mdns — GitHub](https://github.com/hashicorp/mdns)
- [grandcat/zeroconf — GitHub](https://github.com/grandcat/zeroconf)
- [enbility/zeroconf/v2 — Go Packages](https://pkg.go.dev/github.com/enbility/zeroconf/v2)

### WebSocket
- [coder/websocket — GitHub](https://github.com/coder/websocket)
- [WebSocket.org — Go Guide](https://websocket.org/guides/languages/go/)
- [Go Forum — WebSocket in 2025](https://forum.golangbridge.org/t/websocket-in-2025/38671)

### Serial Port
- [go.bug.st/serial — Go Packages](https://pkg.go.dev/go.bug.st/serial)
- [bugst/go-serial — GitHub](https://github.com/bugst/go-serial)
- [tarm/serial — GitHub](https://github.com/tarm/serial)

### Marine Projects
- [timmathews/argo (Go SignalK server) — GitHub](https://github.com/timmathews/argo)
- [SignalK/signalk-server (Node.js) — GitHub](https://github.com/SignalK/signalk-server)
- [Signal K Specification](https://signalk.org/specification/1.7.0/doc/)
- [open-boat-projects.org](https://open-boat-projects.org/en/)

### Go Embedded / IoT
- [TinyGo Releases — GitHub](https://github.com/tinygo-org/tinygo/releases)
- [TinyGo Microcontroller Reference](https://tinygo.org/docs/reference/microcontrollers/)
- [TinyGo ESP32 Performance Study (MDPI)](https://www.mdpi.com/2079-9292/12/1/143)
- [Go on ARM Wiki](https://go.dev/wiki/GoArm)
- [Go embed Package](https://pkg.go.dev/embed)

### gRPC
- [grpc/grpc-go — GitHub](https://github.com/grpc/grpc-go)
- [gRPC Go Basics Tutorial](https://grpc.io/docs/languages/go/basics/)
