# Development Environment and Cross-Compilation Specification

**Date:** 2026-03-31
**Status:** Draft v1
**Audience:** All contributors (human and AI)

---

## 1. Developer Machine Setup

### macOS (Primary Development Platform)

macOS on Apple Silicon is the primary development environment. The spoke's production target is Linux ARM64 and AMD64, so all Go builds cross-compile for Linux.

**Prerequisites (via Homebrew):**

```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Core tools
brew install go             # Go 1.22+
brew install node@20        # Node.js 20 LTS (frontend development)
brew install pnpm           # pnpm 9+ (frontend package management)
brew install git            # Git 2.40+
brew install gh             # GitHub CLI
brew install jq             # JSON processing
brew install curl           # HTTP client (macOS ships an older version)

# Go development tools
go install github.com/air-verse/air@latest          # Hot reload for Go
go install github.com/go-delve/delve/cmd/dlv@latest # Debugger

# Container runtime (OrbStack recommended over Docker Desktop)
brew install orbstack       # Lightweight Docker runtime (~400MB idle vs Docker Desktop's ~2GB)

# Supabase CLI (hub development)
brew install supabase/tap/supabase

# Cross-compilation toolchain
brew install zig            # Used as C cross-compiler for CGO (SQLite, sqlite-vec, SpatiaLite)

# Optional but useful
brew install mosquitto       # MQTT broker + client tools (Victron simulation)
brew install socat           # Virtual serial ports (VE.Direct simulation)
brew install wscat           # WebSocket debugging (via npm: npm install -g wscat)
```

**Shell configuration (add to `~/.zshrc`):**

```bash
export GOPATH="$HOME/go"
export PATH="$GOPATH/bin:$PATH"
```

### Linux (Debian/Ubuntu)

Linux is the production target OS for all spoke hardware. Developers on Linux get native Docker performance and direct access to SocketCAN for NMEA 2000 development.

```bash
# Core tools
sudo apt update
sudo apt install -y golang-go nodejs npm git curl jq

# pnpm
corepack enable && corepack prepare pnpm@latest --activate

# Docker (native, no VM overhead)
sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER  # Log out and back in after this

# Supabase CLI
brew install supabase/tap/supabase  # Or: npx supabase

# Go development tools
go install github.com/air-verse/air@latest
go install github.com/go-delve/delve/cmd/dlv@latest

# Cross-compilation
sudo apt install -y zig

# CAN bus tools (NMEA 2000 development)
sudo apt install -y can-utils      # cansend, candump, cangen, canbusload
sudo apt install -y linux-modules-extra-$(uname -r)  # vcan kernel module

# Serial port tools (VE.Direct simulation)
sudo apt install -y socat

# MQTT tools (Victron simulation)
sudo apt install -y mosquitto mosquitto-clients
```

### IDE Recommendations

The project is editor-agnostic. Use whatever you prefer. Useful integrations:

- **Go extension** -- language server (`gopls`), debugging (`dlv`), test runner
- **ESLint integration** -- lint TypeScript/React on save
- **Prettier on save** -- auto-format frontend code
- **Docker extension** -- container management, log viewing
- **REST client** -- test API endpoints directly from the editor

No editor-specific configuration files are committed to the repository.

---

## 2. Local Development Stack

### Docker Compose Services

The full local development environment runs via Docker Compose. Each service can also run independently.

**`docker-compose.yml`:**

```yaml
services:
  spoke:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "8080:8080"    # REST API
      - "8081:8081"    # WebSocket
      - "2345:2345"    # Delve debugger
    volumes:
      - ./packages/api:/app
      - spoke-data:/data
    environment:
      - SPOKE_MODE=development
      - SQLITE_PATH=/data/spoke.db
      - LOG_LEVEL=debug
      - LOG_FORMAT=text
    env_file: .env
    depends_on:
      - simulator
    command: air  # Hot reload

  simulator:
    build:
      context: ./tools/simulator
      dockerfile: Dockerfile
    ports:
      - "10110:10110"  # NMEA 0183 TCP
      - "2000:2000"    # NMEA 2000 (simulated via TCP)
      - "1883:1883"    # MQTT (Victron simulation)
    volumes:
      - ./testdata:/testdata
    environment:
      - SCENARIO=at-anchor-poole-harbour
      - SPEED=realtime

  supabase:
    # Supabase local development (managed by supabase CLI)
    # Run separately: supabase start
    # Included here for reference only
    profiles: ["hub"]

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend.dev
    ports:
      - "4321:4321"   # Astro dev server (HMR)
    volumes:
      - ./packages/site/src:/app/packages/site/src
      - ./packages/tools/src:/app/packages/tools/src
      - ./packages/shared/src:/app/packages/shared/src
    environment:
      - PUBLIC_API_URL=http://localhost:8080
      - PUBLIC_WS_URL=ws://localhost:8081
    env_file: .env

volumes:
  spoke-data:
```

### Port Mapping

| Port | Service | Protocol | Purpose |
|------|---------|----------|---------|
| 4321 | frontend | HTTP | Astro dev server with HMR |
| 8080 | spoke | HTTP | REST API + embedded frontend (production mode) |
| 8081 | spoke | WebSocket | Real-time instrument data, agent chat, alerts |
| 2345 | spoke | TCP | Delve remote debugger |
| 10110 | simulator | TCP | NMEA 0183 sentences |
| 2000 | simulator | TCP | NMEA 2000 frames (simulated) |
| 1883 | simulator | TCP | MQTT broker (Victron simulation) |
| 54321 | supabase | HTTP | Supabase Studio (local) |
| 54322 | supabase | TCP | PostgreSQL (local) |

### Running Subsets of the Stack

```bash
# Full stack (all services)
docker compose up

# Spoke only (Go API + simulator, no frontend dev server)
docker compose up spoke simulator

# Frontend only (connects to running spoke or mocked API)
docker compose up frontend

# Spoke with hub services (includes local Supabase)
docker compose --profile hub up

# Just the simulator (for manual testing with curl/wscat)
docker compose up simulator
```

### Volume Mounts for Live Reload

- **Spoke (Go):** Source code mounted at `/app`. The `air` tool watches for `.go` file changes, recompiles, and restarts the binary. Typical reload time: 1-3 seconds.
- **Frontend (Astro/React):** Source directories mounted individually. Astro's HMR provides sub-second updates in the browser.
- **Spoke data:** Named volume `spoke-data` persists the SQLite database between container restarts. Delete with `docker compose down -v` to start fresh.

### Environment Variables

Copy the example file and fill in any values needed for your development:

```bash
cp .env.example .env
```

**`.env.example`** (committed to repo, no secret values):

```bash
# Spoke configuration
SPOKE_MODE=development          # development | production
SQLITE_PATH=/data/spoke.db     # SQLite database location
LOG_LEVEL=debug                 # debug | info | warn | error
LOG_FORMAT=text                 # text | json

# Hub connection (optional in development)
HUB_URL=                        # Leave empty for offline-only development
HUB_API_KEY=                    # API key for spoke-to-hub sync

# Supabase (hub development only)
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=              # From supabase start output
SUPABASE_SERVICE_KEY=           # From supabase start output

# AI agents (optional)
ANTHROPIC_API_KEY=              # Claude API key for agent development

# Frontend
PUBLIC_API_URL=http://localhost:8080
PUBLIC_WS_URL=ws://localhost:8081
```

---

## 3. NMEA Development Without a Boat

Most development happens at a desk, not on a boat. The simulator service and the tools described here generate realistic instrument data for all protocol adapters.

### Virtual CAN Bus (Linux Only)

Linux's SocketCAN subsystem provides a virtual CAN interface identical to real hardware. This is the closest simulation to a real NMEA 2000 network.

```bash
# Load the virtual CAN kernel module
sudo modprobe vcan

# Create a virtual CAN interface
sudo ip link add dev vcan0 type vcan
sudo ip link set up vcan0

# Send a CAN frame (NMEA 2000 PGN 127508 -- Battery Status)
# Format: <CAN ID>#<data bytes>
cansend vcan0 19F21400#01D007B81E040000

# Monitor all CAN traffic
candump vcan0

# Generate random CAN traffic for stress testing
cangen vcan0 -g 100 -I 1CF00400 -L 8

# Record CAN traffic to a log file (for test fixtures)
candump -L vcan0 > testdata/can-capture.log

# Replay a recorded capture at original timing
canplayer -I testdata/can-capture.log vcan0=vcan0
```

**Note:** macOS does not support SocketCAN. On macOS, the simulator provides NMEA 2000 data over TCP instead. Docker on macOS (via OrbStack) runs a Linux VM, so `vcan` is available inside containers but not on the host.

### NMEA 0183 Simulation

A TCP server that sends NMEA 0183 sentences at configurable intervals. Connects to the spoke's NMEA 0183 adapter on port 10110.

```bash
# The simulator service sends 0183 sentences on port 10110
# Connect manually to verify:
nc localhost 10110

# Example output:
# $GPGGA,123519,5040.6892,N,00155.3456,W,1,08,0.9,10.4,M,47.0,M,,*47
# $GPRMC,123519,A,5040.6892,N,00155.3456,W,5.2,054.7,310326,,,A*6B
# $SDDBT,15.3,f,4.7,M,2.5,F*2A
# $WIMWV,045.0,R,12.6,N,A*28
```

**Sentence types generated:**

| Sentence | Data | Update Rate |
|----------|------|-------------|
| GGA | GPS fix (lat, lng, altitude, satellite count) | 1 Hz |
| RMC | Position, course, speed over ground | 1 Hz |
| DBT | Depth below transducer | 1 Hz |
| MWV | Wind speed and angle (apparent) | 1 Hz |
| MTW | Sea water temperature | 0.2 Hz |
| VHW | Speed through water, heading | 1 Hz |
| HDG | Magnetic heading, deviation, variation | 1 Hz |
| XDR | Transducer measurements (barometric pressure, air temp, humidity) | 0.2 Hz |

### Victron VE.Direct Simulation

Victron solar charge controllers and battery monitors communicate over a serial protocol called VE.Direct (19200 baud, text-based). Use `socat` to create a virtual serial port pair.

```bash
# Create a virtual serial port pair
socat -d -d pty,raw,echo=0,link=/tmp/vedirect-master pty,raw,echo=0,link=/tmp/vedirect-slave &

# The simulator writes to /tmp/vedirect-master
# The spoke's VE.Direct adapter reads from /tmp/vedirect-slave

# Example VE.Direct text protocol output (SmartSolar MPPT):
# PID     0xA060
# FW      163
# SER#    HQ2145ABCDE
# V       13280       (battery voltage in mV)
# I       850         (charging current in mA)
# VPV     38400       (panel voltage in mV)
# PPV     32          (panel power in W)
# CS      3           (charge state: bulk)
# MPPT    2           (tracker state: active)
# ERR     0           (no error)
# H19     12345       (yield total, 0.01 kWh)
# H20     185         (yield today, 0.01 kWh)
# H21     45          (max power today, W)
# H22     210         (yield yesterday, 0.01 kWh)
# H23     52          (max power yesterday, W)
# HSDS    42          (day sequence number)
# Checksum <byte>
```

### Victron MQTT Simulation (Cerbo GX)

Victron's Cerbo GX publishes all system data over MQTT. Simulate this with a local Mosquitto broker.

```bash
# Start local MQTT broker
mosquitto -p 1883 &

# Publish simulated Victron data (matches Cerbo GX topic structure)
# Battery monitor
mosquitto_pub -t "N/c0619ab12345/battery/256/Voltage" -m '{"value": 13.28}'
mosquitto_pub -t "N/c0619ab12345/battery/256/Current" -m '{"value": 8.5}'
mosquitto_pub -t "N/c0619ab12345/battery/256/Soc" -m '{"value": 85.0}'

# Solar charger
mosquitto_pub -t "N/c0619ab12345/solarcharger/278/Yield/Power" -m '{"value": 320}'
mosquitto_pub -t "N/c0619ab12345/solarcharger/278/Pv/V" -m '{"value": 38.4}'

# System overview
mosquitto_pub -t "N/c0619ab12345/system/0/Dc/Battery/Voltage" -m '{"value": 13.28}'
mosquitto_pub -t "N/c0619ab12345/system/0/Dc/Battery/Current" -m '{"value": -2.5}'
mosquitto_pub -t "N/c0619ab12345/system/0/Dc/Battery/Soc" -m '{"value": 85.0}'

# Subscribe to all topics (for debugging)
mosquitto_sub -t 'N/#' -v
```

### AIS Simulation

AIS messages are delivered as NMEA 0183 sentences (prefixed `!AIVDM`). Simulate nearby vessels via UDP or TCP.

```bash
# Send AIS position reports via UDP (port 10111)
# Type 1: Position report from vessel MMSI 211234567
echo '!AIVDM,1,1,,A,13u@Dt002s000000000000000000,0*50' | nc -u localhost 10111

# The simulator generates a realistic AIS picture with:
# - Anchored vessels nearby (stationary, swinging on anchor)
# - Vessels transiting through the area (various courses and speeds)
# - A fishing vessel making slow circles
# - A large commercial vessel at distance with CPA/TCPA data
```

### GPS Position Simulation

The simulator generates GPS fixes (GGA and RMC sentences) with configurable position, allowing development of chartplotter and passage planning features without leaving the office.

**Configurable parameters:**
- Base position (lat/lng)
- Course and speed over ground
- Satellite count and HDOP (fix quality)
- Position drift (simulates anchor watch scenarios)
- Route following (simulates a passage with waypoints)

### Pre-Built Scenarios

The simulator ships with scenario files in `testdata/scenarios/`. Each scenario configures all data sources for a realistic situation:

| Scenario | Position | Instruments | Use Case |
|----------|----------|-------------|----------|
| `at-anchor-poole-harbour` | 50.6782 N, 1.9262 W | Calm conditions, GPS drift, 10+ AIS targets, solar charging, anchor alarm testing | Anchor watch, AIS display, energy monitoring |
| `passage-across-solent` | Route: Poole to Yarmouth | Wind 15-20 kt, tide effects, depth changes, heading changes, AIS traffic | Passage planning, instrument display, tidal calculations |
| `offshore-bay-of-biscay` | 46.5 N, 5.0 W | Wind 25-30 kt, swell 3-4m, limited AIS, GPS only (no depth), low solar | Offshore conditions, reduced data sources, night mode testing |
| `marina-berth` | 50.7115 N, 1.9787 W | Shore power connected, no wind data, WiFi available, Victron on float | Shore power, maintenance mode, firmware updates |
| `med-crossing` | Route: Gibraltar to Balearics | Light wind, high solar, lots of AIS traffic, warm temperatures | Long passage, energy surplus scenarios |

Run a scenario:

```bash
# Start the simulator with a specific scenario
docker compose up -d simulator
docker compose exec simulator scenario --load at-anchor-poole-harbour

# Or set via environment variable in docker-compose.yml
SCENARIO=passage-across-solent docker compose up simulator
```

---

## 4. Cross-Compilation

The spoke binary must run on both ARM64 (Mac Mini M4, HALPI2, Pi 5) and AMD64 (Intel N100). Go cross-compiles cleanly for pure Go code, but the spoke's SQLite dependencies require CGO, which complicates cross-compilation.

### Pure Go Cross-Compilation

For any Go code without CGO dependencies:

```bash
# Build for Linux ARM64 (Mac Mini M4 running OrbStack, HALPI2, Pi 5)
GOOS=linux GOARCH=arm64 go build -o spoke-linux-arm64 ./cmd/spoke

# Build for Linux AMD64 (Intel N100)
GOOS=linux GOARCH=amd64 go build -o spoke-linux-amd64 ./cmd/spoke

# Build for macOS ARM64 (development on Apple Silicon)
GOOS=darwin GOARCH=arm64 go build -o spoke-darwin-arm64 ./cmd/spoke
```

### The CGO Challenge

The spoke uses three C libraries via CGO:

| Library | Go Binding | Purpose | CGO Required |
|---------|-----------|---------|--------------|
| SQLite | `github.com/mattn/go-sqlite3` | Relational data, time-series, migrations | Yes |
| sqlite-vec | `github.com/AmazonNow/sqlite-vec-go` (or equivalent) | Vector search for local RAG | Yes |
| SpatiaLite | Loaded as SQLite extension | Geospatial queries on spoke | Yes |

Cross-compiling CGO requires a C cross-compiler targeting the destination platform. A macOS developer building for Linux ARM64 needs an `aarch64-linux-gnu` C toolchain.

### Solution 1: Zig as Cross-Compiler (Recommended for Local Builds)

Zig includes a C/C++ compiler that can target any platform without installing separate toolchains. This is the simplest approach for local development.

```bash
# Install zig
brew install zig           # macOS
sudo apt install zig       # Linux

# Cross-compile for Linux ARM64 from macOS
CGO_ENABLED=1 \
CC="zig cc -target aarch64-linux-gnu" \
CXX="zig c++ -target aarch64-linux-gnu" \
GOOS=linux GOARCH=arm64 \
go build -o spoke-linux-arm64 ./cmd/spoke

# Cross-compile for Linux AMD64 from macOS
CGO_ENABLED=1 \
CC="zig cc -target x86_64-linux-gnu" \
CXX="zig c++ -target x86_64-linux-gnu" \
GOOS=linux GOARCH=amd64 \
go build -o spoke-linux-amd64 ./cmd/spoke
```

**SpatiaLite note:** SpatiaLite has additional C library dependencies (GEOS, PROJ, libxml2). These must be available as static libraries for the target platform. For complex C dependencies, Docker buildx (Solution 2) is more reliable.

### Solution 2: Docker buildx (Recommended for CI and Release Builds)

Docker buildx with multi-platform support handles cross-compilation inside the build container, avoiding host toolchain complexity entirely.

```bash
# Create a buildx builder with multi-platform support
docker buildx create --name multiarch --use

# Build for both platforms
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag abovedeck/spoke:latest \
  --push \
  .
```

Under the hood, buildx uses either QEMU user-mode emulation or remote native builders. QEMU is slower (5-10x) but requires no additional infrastructure. For CI, a native ARM64 builder (GitHub Actions `runs-on: ubuntu-24.04-arm`) eliminates the QEMU overhead.

### Solution 3: xx Helper for Dockerfiles

The `xx` project (from the Docker team) provides helper scripts for multi-platform Docker builds. It simplifies CGO cross-compilation inside Dockerfiles.

```dockerfile
# syntax=docker/dockerfile:1
FROM --platform=$BUILDPLATFORM golang:1.22-bookworm AS builder
ARG TARGETPLATFORM
ARG BUILDPLATFORM

# Install xx for cross-compilation
COPY --from=tonistiigi/xx:latest /xx /usr/bin/

# Install C cross-compiler for the target platform
RUN xx-apt install -y gcc libc6-dev libsqlite3-dev libspatialite-dev

# Build with CGO targeting the correct platform
RUN xx-go build -o /spoke ./cmd/spoke
```

### Testing Cross-Compiled Binaries

```bash
# Option 1: QEMU user-mode emulation (test ARM64 binary on AMD64 host or vice versa)
sudo apt install -y qemu-user-static
qemu-aarch64-static ./spoke-linux-arm64 --version

# Option 2: Docker with platform flag (runs via QEMU transparently)
docker run --platform linux/arm64 --rm -v $(pwd):/app alpine /app/spoke-linux-arm64 --version

# Option 3: Actual hardware (the definitive test)
scp spoke-linux-arm64 pi@halpi2.local:/tmp/
ssh pi@halpi2.local /tmp/spoke-linux-arm64 --version
```

---

## 5. Docker Build for Spoke

### Multi-Stage Dockerfile

```dockerfile
# syntax=docker/dockerfile:1

# ============================================================
# Stage 1: Build the Go binary with CGO (SQLite, sqlite-vec, SpatiaLite)
# ============================================================
FROM --platform=$BUILDPLATFORM golang:1.22-bookworm AS builder

ARG TARGETPLATFORM
ARG BUILDPLATFORM
ARG VERSION=dev

# Install xx for cross-compilation helpers
COPY --from=tonistiigi/xx:latest /xx /usr/bin/

# Install C cross-compiler and SQLite/SpatiaLite dev libraries for target
RUN xx-apt install -y \
    gcc \
    libc6-dev \
    libsqlite3-dev \
    libspatialite-dev

WORKDIR /build

# Cache Go module downloads
COPY go.mod go.sum ./
RUN go mod download

# Copy source
COPY . .

# Build the binary
RUN CGO_ENABLED=1 \
    xx-go build \
    -ldflags="-s -w -X main.version=${VERSION}" \
    -o /spoke \
    ./cmd/spoke

# Verify the binary is for the correct platform
RUN xx-verify /spoke

# ============================================================
# Stage 2: Production image (minimal)
# ============================================================
FROM debian:bookworm-slim AS production

# Install runtime dependencies only (no dev headers)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsqlite3-0 \
    libspatialite7 \
    ca-certificates \
    tini \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd --create-home --shell /bin/false spoke

# Copy the binary from builder
COPY --from=builder /spoke /usr/local/bin/spoke

# Create data directory
RUN mkdir -p /data && chown spoke:spoke /data

USER spoke
WORKDIR /data

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["/usr/local/bin/spoke", "healthcheck"]

# Expose ports
EXPOSE 8080 8081

# Use tini as init process for proper signal handling
ENTRYPOINT ["tini", "--"]

# Graceful shutdown: spoke binary handles SIGTERM
CMD ["/usr/local/bin/spoke", "serve"]
```

### Build Commands

```bash
# Development build (current platform only, fast)
docker build -t abovedeck/spoke:dev .

# Multi-platform release build
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --tag ghcr.io/above-deck/spoke:latest \
    --tag ghcr.io/above-deck/spoke:v1.0.0 \
    --build-arg VERSION=v1.0.0 \
    --push \
    .

# Local multi-platform build (load into local Docker, one platform at a time)
docker buildx build \
    --platform linux/arm64 \
    --tag abovedeck/spoke:dev-arm64 \
    --load \
    .
```

### Image Size Target

Target: **under 100 MB** compressed.

| Component | Approximate Size |
|-----------|-----------------|
| Debian slim base | ~30 MB |
| SQLite + SpatiaLite runtime libs | ~15 MB |
| Go binary (stripped, `-ldflags="-s -w"`) | ~30-50 MB |
| ca-certificates + tini | ~2 MB |
| **Total** | **~77-97 MB** |

If the image exceeds 100 MB, consider Alpine as the base image (saves ~20 MB) but test thoroughly for glibc/musl compatibility with the C libraries.

### Health Check

The spoke exposes `GET /healthz` on port 8080:

```json
{
  "status": "ok",
  "version": "v1.0.0",
  "uptime": "3d 14h 22m",
  "database": "ok",
  "adapters": {
    "nmea0183": "connected",
    "victron_mqtt": "connected",
    "ais": "connected"
  }
}
```

Returns HTTP 200 when healthy, HTTP 503 when degraded. Docker uses this for restart decisions.

### Persistent Data

```bash
# Run with a named volume for persistent data
docker run -d \
    --name spoke \
    --restart unless-stopped \
    -p 8080:8080 \
    -p 8081:8081 \
    -v spoke-data:/data \
    ghcr.io/above-deck/spoke:latest
```

The `/data` volume contains:
- `spoke.db` -- SQLite database (relational, vector, time-series)
- `cache/charts/` -- cached chart tiles
- `cache/grib/` -- cached weather GRIB files
- `cache/rag/` -- local RAG embeddings
- `logs/` -- application logs (rotated, bounded)

### Signal Handling and Graceful Shutdown

The Go binary handles OS signals for clean shutdown:

- **SIGTERM** -- graceful shutdown. Stops accepting new connections, drains active requests, flushes SQLite WAL, closes adapter connections. Timeout: 30 seconds.
- **SIGINT** -- same as SIGTERM (for interactive use).
- **SIGHUP** -- reload configuration without restart.

`tini` as PID 1 ensures signals are forwarded correctly to the Go process and zombie processes are reaped.

---

## 6. Hardware-Specific Considerations

### Platform Comparison

| Hardware | OS | Arch | Docker Runtime | CAN Bus | WiFi Control | Display | 12V DC |
|----------|-----|------|---------------|---------|--------------|---------|--------|
| Mac Mini M4 | macOS 15+ | ARM64 | OrbStack (Linux VM) | USB gateway only (no native CAN) | `networksetup` (host agent) | HDMI direct | Mikegyver conversion or inverter |
| Intel N100 | Debian/Ubuntu | AMD64 | Native Docker | SocketCAN (via USB adapter) or USB gateway | NetworkManager D-Bus | HDMI direct | Native 12V barrel jack |
| HALPI2 (CM5) | HaLOS / Debian | ARM64 | Native Docker | Built-in CAN interface (NMEA 2000 native) | NetworkManager D-Bus | HDMI direct | Native 10-32V DC |

### Mac Mini M4 Specifics

Docker on macOS runs inside a lightweight Linux VM managed by OrbStack. This has implications:

**Performance:**
- OrbStack idle overhead: ~400 MB RAM (vs Docker Desktop's ~2 GB)
- File I/O between host and container is 2-10x faster with OrbStack than Docker Desktop, but still slower than native Linux
- Network: containers access the host network via VM bridge. Localhost port mapping works transparently.

**USB passthrough:**
- OrbStack supports USB device passthrough to Linux containers
- NMEA gateways (iKonvert, VE.Direct) connected via USB-A are accessible inside containers
- RTL-SDR dongles for AIS reception work via USB passthrough

**No native CAN bus:**
- macOS has no SocketCAN subsystem. No `vcan0` on the host.
- Inside the OrbStack Linux VM, `vcan` is available for simulation
- Real NMEA 2000 data arrives via WiFi gateways (NavLink2) or USB gateways (iKonvert), both TCP/serial -- no CAN needed

**Display control:**
- macOS does not expose display brightness/power via D-Bus
- A host-side agent (native macOS process) handles display dimming, night mode, sleep prevention
- The agent communicates with the spoke container via a local socket

**Headless operation:**
- Disable sleep: System Settings or `sudo pmset -a sleep 0 disksleep 0`
- Prevent display sleep: `caffeinate -d` or energy saver settings
- Auto-login: System Settings, Users & Groups, Login Options

### Intel N100 Specifics

Native Linux provides the best development and production experience:

- **Docker:** Runs natively, no VM overhead. Best performance for the spoke container.
- **CAN bus:** If using a USB CAN adapter (like the Waveshare USB-CAN-A), SocketCAN provides direct `can0` interface. Otherwise, USB gateways (iKonvert) or WiFi gateways work the same as macOS.
- **WiFi AP control:** NetworkManager on Linux can create WiFi access points and manage client connections via D-Bus. The spoke can configure the boat's local WiFi network.
- **Power:** MeLE Quieter4C and similar N100 mini PCs accept 12V DC natively. Direct battery connection with a fuse -- no conversion needed.
- **systemd:** The spoke Docker container runs as a systemd service for auto-start on boot and restart on failure.
- **udev rules:** USB device hotplug (NMEA gateways, SDR dongles) handled via udev rules that trigger container device mapping.

### HALPI2 Specifics

The HALPI2 is purpose-built for marine computing:

- **Docker:** Runs on HaLOS (container-based Raspberry Pi OS). Docker is the native application model.
- **CAN bus:** Built-in NMEA 2000 interface appears as a SocketCAN device (`can0`). The spoke's NMEA 2000 adapter connects directly -- no external gateway needed.
- **NMEA 0183:** Built-in RS-485 port. Connect directly to NMEA 0183 instruments or multiplexers.
- **Power:** 10-32V DC input with supercapacitor bank for safe shutdown on power loss. The spoke binary receives a shutdown signal and has 30-60 seconds to flush data.
- **Signal K coexistence:** HaLOS runs Signal K by default. The Above Deck spoke container runs alongside it. Both can read from the same NMEA interfaces (the spoke as a Signal K client, or directly).

---

## 7. Debugging

### Go Backend Debugging

**Local debugging with Delve:**

```bash
# Start spoke with Delve debugger
dlv debug ./cmd/spoke -- serve

# Common Delve commands
(dlv) break main.main       # Set breakpoint
(dlv) break adapter.go:42   # Break at line
(dlv) continue              # Run to next breakpoint
(dlv) next                  # Step over
(dlv) step                  # Step into
(dlv) print myVar           # Inspect variable
(dlv) goroutines            # List goroutines
```

**Remote debugging (spoke running on hardware):**

```bash
# On the spoke hardware (inside Docker container or directly)
dlv exec ./spoke --headless --listen=:2345 --api-version=2 -- serve

# Connect from your development machine (VS Code, GoLand, or CLI)
dlv connect halpi2.local:2345
```

The `docker-compose.yml` exposes port 2345 for Delve. In development mode, the spoke binary is built without optimisations (`-gcflags='all=-N -l'`) for accurate debugging.

### Frontend Debugging

- **Browser DevTools:** Inspect element, console, network tab. Astro generates source maps in development.
- **React DevTools:** Browser extension for inspecting React component tree, props, state, and Zustand stores.
- **Network tab:** Monitor WebSocket messages (instrument updates, agent chat) and REST API calls.

### NMEA 2000 / CAN Bus Debugging

```bash
# Linux: monitor all CAN traffic with decoded output
candump vcan0

# Filter by PGN (e.g., PGN 127508 = Battery Status)
candump vcan0,19F21400:1FFFFFFF

# Show timestamps and frame statistics
candump -t d -c vcan0

# CAN bus load measurement
canbusload vcan0

# From macOS: use Actisense NMEA Reader (Windows/Mac GUI) with an iKonvert USB gateway
```

### Victron Debugging

- **VictronConnect app:** Connects via Bluetooth to Victron devices. Shows real-time data and historical logs. Available on iOS, Android, macOS, Windows.
- **`dbus-spy`:** On a Cerbo GX, inspect all D-Bus values (the underlying data bus Victron uses internally).
- **MQTT debugging:** `mosquitto_sub -h <cerbo-ip> -t 'N/#' -v` shows all published values.

### WebSocket Debugging

```bash
# Connect to the spoke's WebSocket and watch real-time data
wscat -c ws://localhost:8081/ws/instruments

# Or use the browser DevTools Network tab, filter by "WS", click the connection to see frames

# Send a subscription message
wscat -c ws://localhost:8081/ws/instruments -x '{"subscribe": ["navigation/position", "electrical/batteries/house"]}'
```

---

## 8. Data Capture from Real Boats

Recorded data from real boats is essential for testing. These captures become test fixtures in `testdata/` and feed the simulator's replay mode.

### Recording NMEA 2000 (CAN Bus)

```bash
# On a Linux spoke with CAN interface (HALPI2 or USB adapter)
# Record all CAN frames with timestamps
candump -L can0 > capture-2026-03-31.can

# Record for a specific duration (e.g., 1 hour)
timeout 3600 candump -L can0 > passage-poole-to-yarmouth.can

# With an Actisense NGT-1 gateway: use Actisense NMEA Reader to save .ebl files
# .ebl files can be converted to text format for processing
```

### Recording NMEA 0183

```bash
# Connect to a WiFi gateway (e.g., NavLink2, WLN30) and record all sentences
nc <gateway-ip> 10110 > capture-0183.nmea

# Or from a serial port
cat /dev/ttyUSB0 > capture-0183.nmea

# Record with timestamps (add a timestamp to each line)
nc <gateway-ip> 10110 | while IFS= read -r line; do echo "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ) $line"; done > capture-0183-timestamped.nmea
```

### Recording Victron VE.Direct

```bash
# Connect to the VE.Direct serial port and record all text blocks
cat /dev/ttyUSB0 > capture-vedirect.txt

# Or with timestamps
cat /dev/ttyUSB0 | while IFS= read -r line; do echo "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ) $line"; done > capture-vedirect-timestamped.txt
```

### Recording Victron MQTT

```bash
# Subscribe to all Victron topics on the Cerbo GX and record
mosquitto_sub -h <cerbo-ip> -t 'N/#' -v > capture-mqtt.txt

# With timestamps
mosquitto_sub -h <cerbo-ip> -t 'N/#' -v | while IFS= read -r line; do echo "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ) $line"; done > capture-mqtt-timestamped.txt
```

### Anonymisation

Captured data from real boats contains identifying information. Before committing to the repository or sharing, anonymise it:

**Fields to scrub:**
- MMSI numbers (AIS) -- replace with fictional MMSI in the 200000000-299999999 range
- Vessel names (AIS) -- replace with generic names ("VESSEL_A", "VESSEL_B")
- Call signs (AIS) -- replace with fictional call signs
- GPS coordinates -- offset by a random but consistent delta (preserves relative positions, distances, and courses but shifts the absolute location)
- Serial numbers (Victron, NMEA device info) -- replace with placeholder values

**What to preserve:**
- Relative positions between own vessel and AIS targets (CPA/TCPA testing)
- Heading, speed, wind angle, depth changes (pattern integrity)
- Timing between messages (replay fidelity)
- Data values within realistic ranges

```bash
# Run the anonymisation script
go run ./tools/anonymise \
    --input capture-poole-harbour.can \
    --output testdata/captures/anchor-watch-anonymised.can \
    --gps-offset-lat 0.5 \
    --gps-offset-lng -0.3 \
    --mmsi-map "235012345:200000001,235067890:200000002"
```

### Test Fixture Organisation

```
testdata/
  captures/
    anchor-watch-poole.can          # CAN bus recording, anonymised
    passage-solent-crossing.can     # CAN bus recording, anonymised
    victron-sunny-day.vedirect      # VE.Direct text recording
    victron-cerbo-full.mqtt         # Cerbo GX MQTT recording
    ais-busy-anchorage.nmea         # AIS sentences from a crowded anchorage
    coastal-passage.nmea            # NMEA 0183 full instrument set
  scenarios/
    at-anchor-poole-harbour.yaml    # Simulator scenario configuration
    passage-across-solent.yaml
    offshore-bay-of-biscay.yaml
    marina-berth.yaml
    med-crossing.yaml
  protocols/
    pgn-127508-battery-status.can   # Individual PGN test vectors
    pgn-129029-gnss-position.can
    ais-type1-position-report.nmea  # Individual sentence test vectors
    ais-type5-static-data.nmea
    vedirect-smartsolar.txt         # Single device text block
    vedirect-bmv712.txt
```

Captures are committed to the repository and used by both Go integration tests and the simulator's replay mode. Keep individual captures under 10 MB. For longer recordings, trim to representative segments.
