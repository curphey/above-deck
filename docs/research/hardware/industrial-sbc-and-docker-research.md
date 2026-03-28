# Industrial Single-Board Computers for the Above Deck Spoke

**Date:** 2026-03-27
**Status:** Research document
**Purpose:** Hardware selection guide for the on-boat spoke computer

The Above Deck spoke runs a single Docker container with a Go binary + embedded frontend + SQLite. This document evaluates hardware options for 24/7 unattended marine operation.

## Requirements

| Requirement | Target |
|---|---|
| Runtime | 24/7 unattended, months between maintenance |
| Temperature | Up to 50C ambient (engine rooms, tropical climates) |
| Power input | 12V DC boat battery (no inverter) |
| Power draw | Under 15W idle |
| Container runtime | Docker on Linux |
| Connectivity | USB (NMEA gateways), WiFi, Ethernet |
| Display | 1-2 HDMI outputs |
| Cooling | Fanless strongly preferred (salt air corrosion) |
| Vibration | Must survive offshore sailing |
| Software | Go binary + embedded web UI + SQLite in a single Docker container |

---

## 1. Industrial Raspberry Pi Options

### 1.1 Raspberry Pi 5 (Standard Board)

The Pi 5 is the current mainstream Raspberry Pi, widely available and well-supported.

| Spec | Value |
|---|---|
| CPU | Broadcom BCM2712, quad-core Arm Cortex-A76 @ 2.4 GHz |
| RAM | 2 GB, 4 GB, 8 GB, 16 GB LPDDR4X-4267 |
| Storage | microSD slot; M.2 HAT available for NVMe |
| Power (idle) | 2.6-2.7W |
| Power (load) | 6.8-7W typical; 12W+ peak with peripherals |
| Power (standby) | 1.3W (0.05W deep sleep) |
| Temp range | 0C to 50C (consumer spec, derated above 50C) |
| Display | 2x micro-HDMI (4Kp60) |
| USB | 2x USB 3.0, 2x USB 2.0 |
| Network | Gigabit Ethernet, WiFi 5 (ac), Bluetooth 5.0 |
| Power input | 5V/5A USB-C (27W PD) |
| 12V DC native | No -- requires DC-DC converter or Witty Pi HAT |
| Fanless | Yes, with passive cooling case |
| Price | $80 (8 GB), ~$110 (8 GB with RAM price increases in 2026) |

**Pros:** Massive ecosystem, cheapest option, excellent Docker/ARM64 support, huge community.
**Cons:** No native 12V input, consumer temperature range, microSD fragility, no built-in safe shutdown on power loss.

### 1.2 Raspberry Pi Compute Module 5 (CM5)

The CM5 puts Pi 5 silicon on a SODIMM-format module designed for industrial carrier boards.

| Spec | Value |
|---|---|
| CPU | Same BCM2712 quad-core A76 @ 2.4 GHz |
| RAM | 2 GB, 4 GB, 8 GB LPDDR4X (16 GB expected) |
| Storage | 16/32/64 GB MLC eMMC on-module; NVMe via carrier |
| Temp range | -20C to +85C (industrial grade) |
| Display | 2x HDMI 2.0 (4Kp60) via carrier |
| Network | Gigabit Ethernet via carrier; optional WiFi 5 + BT 5.0 |
| Price | $45 (2 GB, no eMMC, no WiFi) to $95 (8 GB, 64 GB eMMC, WiFi) |

**eMMC read speed:** 343 MB/s. Write: 106 MB/s. Far more reliable than SD cards for 24/7 operation.

**Key advantage over Pi 5:** The -20C to +85C operating range and on-board eMMC make this the right choice for marine use. The carrier board determines the final form factor, power input, and I/O.

### 1.3 CM5 Industrial Carrier Boards

#### HALPI2 (Hat Labs) -- Marine-Specific

The HALPI2 is purpose-built for boats. It is the single most relevant product for Above Deck.

| Spec | Value |
|---|---|
| Computer | Raspberry Pi CM5 (2-16 GB RAM) |
| Storage | eMMC (32/64 GB) or NVMe SSD (up to 1 TB) |
| Enclosure | IP65 die-cast aluminium, 200x130x60 mm |
| Power input | 10-32V DC (direct boat battery connection) |
| Power protection | Fuse + supercapacitor bank (30-60s safe shutdown) |
| Max current | 0.8A @ 12V = ~9.6W max |
| NMEA | NMEA 2000 (CAN bus) + NMEA 0183 (RS-485) native |
| Display | 2x HDMI |
| USB | 2x USB 3.0 (waterproof connectors) |
| Network | Gigabit Ethernet (RJ45) + WiFi/BT via external antenna |
| Mounting | Panel, bulkhead |
| Software | HaLOS (container-based Raspberry Pi OS), Signal K pre-installed |
| Price | EUR 250 (bare, no CM5) to EUR 594 (16 GB RAM, 1 TB SSD) |

**Verdict:** This is the gold standard for marine Pi computing. Built-in NMEA, waterproof connectors, supercapacitor UPS, wide voltage input. The Above Deck spoke Docker container could run directly on HaLOS alongside Signal K.

#### Waveshare IPCBOX-CM5

| Spec | Value |
|---|---|
| Computer | Raspberry Pi CM5 |
| Enclosure | Aluminium alloy, 136x92x39.5 mm, DIN-rail + VESA mount |
| Power input | 7-36V DC |
| Interfaces | RS485 (x2 or x4), RS232 (x2), CAN bus, DI/DO |
| Network | GbE + 2.5GbE dual Ethernet; M.2 B-Key for 4G/5G |
| Display | 1x HDMI (4K) |
| USB | Multiple USB 3.2 + USB 2.0 |
| Storage | microSD + M.2 NVMe |
| Price | ~$100 (carrier board only, no CM5) |

**Verdict:** Excellent value industrial carrier. Wide voltage input covers 12V boat power. DIN-rail mounting suits electrical panels. No NMEA-specific connectors but USB adapters work fine.

#### Kontron AL Pi-Tron CM5

| Spec | Value |
|---|---|
| Computer | Raspberry Pi CM5 |
| Enclosure | Stainless steel, DIN rail mount, 111x25x76 mm |
| Power input | 24V DC +/-20% (19.2-28.8V) |
| Temp range | 0C to +55C |
| Interfaces | RS232, RS485, CAN 2.0B/FD, 4x 24V DIO |
| Network | 1x GbE + 1x 100 Mbit Ethernet |
| Display | 1x HDMI 2.0 (4Kp60) |
| USB | 2x USB 2.0, 1x USB OTG |
| Storage | microSD + eMMC (16/32/64 GB) |
| FRAM | Integrated for data integrity on power loss |
| Price | Contact Kontron (expect EUR 300-500 range for industrial) |

**Caution:** 24V nominal input is too high for direct 12V boat battery connection. Would require a 12V-to-24V boost converter, adding complexity and a failure point. The 55C upper temp limit is also tight for engine rooms.

#### Seeed Studio reTerminal DM

| Spec | Value |
|---|---|
| Computer | Raspberry Pi CM4 (not CM5 -- no CM5 version yet) |
| Display | Built-in 10.1" IPS touchscreen, 1280x800, 400 nit, IP65 front |
| Enclosure | Die-cast aluminium, 259x191x42 mm, 1.8 kg |
| Power input | Not confirmed for 12V direct |
| Interfaces | CAN bus, RS485, RS232, Gigabit Ethernet |
| Vibration | IEC 60068-2-64 (5 Grms, 5-500 Hz) |
| Shock | IEC 60068-2-27 (50G peak, 11ms) |
| Mounting | Panel, VESA, DIN-rail |
| Price | ~$300-450 (with CM4) |

**Verdict:** Interesting as an all-in-one with integrated display, but still CM4-based (slower, hotter). Wait for CM5 version. The IP65 front panel and vibration/shock ratings are excellent for marine use.

### 1.4 Power Management HATs

#### UUGear Witty Pi 4

| Spec | Value |
|---|---|
| Function | RTC + power management + safe shutdown |
| Input voltage | 6-30V DC (covers 12V boat power directly) |
| RTC accuracy | +/-2 ppm (factory calibrated, temp compensated) |
| Temperature sensor | 0.125C resolution |
| Safe shutdown | e-Latching power switch, software-controlled graceful shutdown |
| Scheduling | Programmable on/off schedules (wake at sunrise, sleep at midnight) |
| Compatibility | All Pi models with 40-pin GPIO (Pi 4, Pi 5) |
| Price | ~$25-35 |

**Verdict:** Essential add-on for a standard Pi 5 build. The 6-30V input eliminates the need for a separate DC-DC converter. Combined with a passive cooling case, this turns a Pi 5 into a viable marine computer for ~$150 total.

#### PiJuice HAT

| Spec | Value |
|---|---|
| Function | UPS with Li-Ion battery |
| Battery | 1,820 mAh Li-Ion (4-6 hr autonomy) |
| Input voltage | 4.2-10V (too narrow for 12V boat direct) |
| Output | 5V @ 2.5A |
| Compatibility | Pi 3, Pi 4, Pi Zero (Pi 5 compatibility unconfirmed) |
| Status | Retired from SparkFun catalog |

**Verdict:** Not recommended. Limited input voltage range, retired product, uncertain Pi 5 support.

#### Juice4halt (Supercapacitor UPS)

| Spec | Value |
|---|---|
| Function | Supercapacitor-based UPS for safe shutdown |
| Hold-up time | ~60 seconds after power loss |
| Mechanism | Monitors input voltage via GPIO, triggers shutdown script |

**Verdict:** Good alternative to battery-based UPS. Supercapacitors have essentially unlimited charge cycles and work across temperature extremes. The HALPI2 uses this approach internally.

### 1.5 Industrial Pi Enclosures

| Product | Type | Fanless | Material | Mounting | Price |
|---|---|---|---|---|---|
| Geekworm P573 | Passive armor case | Yes | Aluminium | Desktop/VESA | ~$20-30 |
| Geekworm P409 | DIN rail case | Yes | ABS | DIN rail | ~$15-25 |
| KKSB Pi 5 Case | Heatsink case | Yes | Aluminium | Desktop | ~$25-35 |
| Waveshare Metal Case | Industrial case | Yes | Metal | DIN rail + wall | ~$20-30 |

For a standard Pi 5 build, the Geekworm P573 aluminium armour case provides full passive cooling adequate for the Pi 5 up to ~50C ambient.

---

## 2. Intel N100 / x86 Mini PCs

### 2.1 Why Consider x86?

The Intel N100 (Alder Lake-N, 4-core, 3.4 GHz turbo, 6W TDP) offers 1.5-2x the performance of a Pi 5 at comparable power consumption. Key advantages:

- Native x86/amd64 Docker images (wider compatibility, no ARM cross-compile issues)
- Intel Quick Sync for hardware video encoding
- DDR4/DDR5 support with higher memory bandwidth
- NVMe storage standard (no SD card reliability concerns)
- Mature UEFI boot with better recovery options

### 2.2 Product Comparison

#### MeLE Quieter4C

| Spec | Value |
|---|---|
| CPU | Intel N100, 4-core @ 3.4 GHz turbo |
| RAM | 8/16/32 GB LPDDR4x or LPDDR5 |
| Storage | 128-512 GB eMMC/SSD; M.2 NVMe slot (up to 6 TB) |
| Power (idle) | ~6W |
| Power (load) | ~15-18W |
| TDP | 6W |
| Display | 2x HDMI + USB-C (triple 4K) |
| Network | WiFi 5, Gigabit Ethernet, BT 5.1 |
| USB | 2x USB 3.2, 1x USB 2.0, 1x USB-C |
| Power input | 12V/2A DC barrel jack (native 12V!) |
| Fanless | Yes, completely passive |
| Dimensions | Ultra-thin, VESA mountable |
| Price | $140 (8 GB/128 GB, no OS) to ~$250 (32 GB/512 GB) |

**Verdict:** Best budget x86 option. Native 12V input means direct boat battery connection with just a fuse. Fanless. Runs Docker on any Linux distro out of the box.

#### Beelink Mini S12 Pro

| Spec | Value |
|---|---|
| CPU | Intel N100, 4-core @ 3.4 GHz turbo |
| RAM | 16 GB DDR4 |
| Storage | 500 GB SATA3 SSD (upgradeable to 4 TB) |
| Power (idle) | 6-8W |
| Power (load) | 22-23W peak |
| Display | 2x HDMI (4K) |
| Network | WiFi 6, Gigabit Ethernet, BT 5.2 |
| USB | Multiple USB 3.0 + USB 2.0 |
| Power input | 12V DC barrel jack |
| Fanless | No -- has a small fan |
| Price | ~$200 (16 GB/500 GB) |

**Verdict:** Good specs for the price but has a fan. The fan will corrode in salt air within 1-2 years. Not recommended for marine use unless the fan is replaced with passive cooling.

#### GMKtec NucBox G3

| Spec | Value |
|---|---|
| CPU | Intel N100, 4-core @ 3.4 GHz turbo |
| RAM | 12 GB LPDDR5-4800 |
| Storage | 256 GB NVMe |
| Power (idle) | ~6W |
| Power (load) | ~18W |
| Display | 2x HDMI + USB-C |
| Network | WiFi 6, Gigabit Ethernet, BT 5.2 |
| Power input | 12V DC |
| Fanless | No (active cooling) |
| Price | ~$160 |

**Verdict:** Similar concerns as Beelink -- fan is a liability at sea.

#### Intel N200 / N305 Options

| Processor | Cores | Turbo | TDP | RAM | Typical Price |
|---|---|---|---|---|---|
| N100 | 4C/4T | 3.4 GHz | 6W | DDR4/DDR5 | $140-200 |
| N200 | 4C/4T | 3.7 GHz | 6W | DDR4/DDR5 | $180-250 |
| N305 | 8C/8T | 3.8 GHz | 15W | DDR5 | $280-400 |

The N200 is a modest step up from N100 (slightly higher turbo). The N305 doubles the core count but also doubles the TDP -- it runs hotter and draws more power, pushing against the 15W idle target.

For the Above Deck spoke (single Go binary + SQLite), the N100 is more than sufficient. The extra cores of the N305 would only matter for multi-service deployments.

### 2.3 Industrial-Grade x86 Options

#### CompuLab fitlet3

| Spec | Value |
|---|---|
| CPU | Intel Atom x6211E (2C, 6W) / Celeron J6412 (4C, 10W) / Atom x6425E (4C, 12W) |
| RAM | Up to 32 GB DDR4-3200 |
| Storage | Triple M.2 slots (NVMe + SATA + WiFi) |
| Power input | 7-42V DC (perfect for 12V boats) |
| Temp range | -40C to +85C |
| Dimensions | 132.8 x 100 x 34.8 mm, 420g |
| Fanless | Yes, rigid aluminium housing |
| Network | Up to 4x Gigabit Ethernet, optional WiFi 6E + BT 5.2 |
| Display | 2x 4K video outputs |
| Warranty | 5-year unconditional; 15-year availability guarantee |
| Price | $260 (2C/4 GB/no storage) to $876 (4C/32 GB/1 TB NVMe) |

**Verdict:** The gold standard for industrial x86. The -40C to +85C range and 7-42V input are perfect for marine. The 15-year availability guarantee means replacement units will be obtainable for the life of the boat. The older Atom/Celeron CPUs are slower than N100 but the industrial hardening is exceptional.

#### Protectli Vault

| Spec | Value |
|---|---|
| CPU | Various Intel Celeron/Pentium/i5/i7 options |
| RAM | Up to 64 GB DDR4 |
| Storage | M.2 SSD + mSATA |
| Power input | 12V DC |
| Fanless | Yes, full aluminium heatsink enclosure |
| Network | 2-6 Gigabit Ethernet ports |
| Designed for | Firewall/router appliances |
| Price | $200-600 depending on model |

**Verdict:** Overkill networking (4-6 Ethernet ports) but proven 24/7 reliability. The VP2410 with Celeron J4125 is a reasonable option at ~$250. Primary downside: designed for networking, not general computing -- limited display outputs on some models.

#### OnLogic Fanless PCs

| Spec | Value |
|---|---|
| Temp range | -40C to +70C |
| Models | CL260 (Intel N150/N250), Helix 522, ML series |
| Fanless | Yes |
| Designed for | Edge AI, industrial automation, IoT |
| Price | $400-1200+ (contact for quote) |

**Verdict:** Premium industrial quality but expensive. The CL260 with Intel N150/N250 is the most relevant model for the spoke. Best for professional installations where cost is secondary to reliability.

---

## 2.5 Apple Mac Mini M4 (2024)

> **Updated 2026-03-28:** Mac Mini M4 promoted to first-class deployment option after detailed research.

The M4 Mac Mini is a viable and proven marine deployment option, despite not being a traditional embedded/industrial computer.

**Specs:**
- CPU: Apple M4 (10-core CPU, 10-core GPU)
- RAM: 16GB unified memory
- Storage: 256GB SSD (base)
- Power: 4-6W idle, 10-15W light load, 65W max (real-world, not spec)
- Ports: 2x USB-A, 3x Thunderbolt 4 (USB-C), 1x HDMI, 1x Gigabit Ethernet, WiFi 6
- Price: $599

**Fan:** The M4 Mac Mini has a single fan but it is **effectively silent under spoke workloads** (Go binary + SQLite + web server). Users consistently report the device is "completely silent" during normal use. The fan only activates under sustained heavy load (video encoding, compiling).

**12V DC power:** Not native. Commercial 12V DC conversion available via [Mikegyver](https://mikegyver.com/products/upgrade-service-12v-apple-mac-mini-m1-m2-m4-in-your-car-rv-boat) (~$150-300). Alternative: small marine inverter ($50-150) with ~10-15% efficiency loss. Real boats have been running Mac Minis on 12V since the Intel era — this is proven.

**Docker on macOS:** Docker Desktop runs containers in a Linux VM. Use **OrbStack** instead — 400MB idle RAM (vs Docker Desktop's 2GB), 2-10x faster file I/O, drop-in Docker CLI compatible. Free for personal use, $8/month commercial.

**Headless operation:** Works but requires disabling sleep mode (macOS sleep has documented issues on M4 in headless mode). Run with display off, `caffeinate` or energy saver settings to prevent sleep. Power difference between sleep (3W) and display-off awake (4-6W) is negligible.

**Temperature:** Operating range 10-35°C ambient. Not suitable for hot engine rooms in tropical climates. Mount in a ventilated cabin space.

**Marine track record:** Mac Minis have been used on cruising sailboats since the Intel era. Documented installations on Cruisers Forum, MacSailing.net, and sailing blogs. The M4 generation offers significantly better power efficiency than older models.

**Strengths vs alternatives:**
- Lowest idle power of any option (4-6W vs N100's 6-12W)
- Superior build quality (aluminium unibody)
- macOS ecosystem (native app support alongside Docker)
- Excellent connectivity (USB-A + Ethernet + WiFi + Thunderbolt)
- Familiar to many sailors (Mac users over-represented in sailing community)

**Weaknesses:**
- $599 base price (vs $140-250 for N100, $250 for HALPI2)
- Requires 12V conversion service or inverter
- Docker runs in VM (OrbStack mitigates, but not native Linux containers)
- 35°C max ambient (marginal in tropics)
- No native NMEA ports (unlike HALPI2)

**Verdict:** First-class spoke hardware option. Best power efficiency, proven on boats, excellent build quality. Higher cost and Docker VM overhead are the trade-offs. Ideal for sailors who already own or prefer Mac hardware.

---

## 3. Docker on Linux for Marine/Embedded

### 3.1 Linux Distribution Comparison

| Distro | Base | Image Size | Docker Support | ARM64 | x86 | Best For |
|---|---|---|---|---|---|---|
| Raspberry Pi OS (Lite) | Debian 12 | ~400 MB | Native apt install | Yes | No | Pi 5 / CM5 |
| DietPi | Debian 12 | ~200 MB | One-click install | Yes | Yes | Easiest setup |
| Armbian | Debian/Ubuntu | ~300 MB | Native apt install | Yes | No | ARM SBCs |
| Alpine Linux | musl libc | <200 MB | Native | Yes | Yes | Minimal footprint |
| Ubuntu Server 24.04 | Ubuntu | ~1.2 GB | Native | Yes | Yes | Widest compatibility |
| Debian 12 Minimal | Debian | ~500 MB | Native | Yes | Yes | Stability |
| HaLOS (Hat Labs) | Debian | Custom | Container-native | Yes | No | HALPI2 specifically |

**Recommendation for Pi/CM5:** Raspberry Pi OS Lite or DietPi. Both are Debian-based with excellent Docker support. DietPi adds a nice optimization layer and one-click Docker install.

**Recommendation for x86 (N100):** Debian 12 Minimal or Ubuntu Server 24.04 LTS. Both have 5+ years of security updates. Ubuntu has slightly better Docker documentation; Debian is lighter.

**Not recommended:** Alpine Linux. While tiny, its musl libc can cause subtle compatibility issues with some Go binaries compiled against glibc. Since the spoke runs a Go binary in Docker, the Docker image itself can use Alpine (as the base image), but the host OS should use glibc-based Debian/Ubuntu for Docker daemon reliability.

### 3.2 Docker vs Podman for the Spoke

| Factor | Docker | Podman |
|---|---|---|
| Architecture | Central daemon (dockerd) | Daemonless |
| RAM overhead | ~77 MB per instance (daemon) | No idle daemon |
| Startup time | ~151 ms | Comparable |
| Rootless mode | Supported but less mature | Native, default |
| Compose support | Docker Compose native | podman-compose (compatible) |
| 24/7 reliability | Daemon is single point of failure | No single daemon |
| systemd integration | Requires separate unit file | Native systemd generation |
| Community/docs | Larger ecosystem | Growing but smaller |
| ARM64 support | Excellent | Excellent |
| Auto-restart | `--restart=always` via daemon | systemd unit files |

**Recommendation: Docker.** For the Above Deck spoke running a single container:

1. Docker's ecosystem is larger -- more troubleshooting resources for sailors who aren't Linux experts.
2. The single-point-of-failure concern is mitigated by systemd watchdog on the Docker daemon.
3. `docker compose` is the standard deployment format.
4. Podman's daemonless architecture is a bigger advantage for multi-container, multi-user servers -- not relevant here.

Configure Docker with:
```
# /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "live-restore": true
}
```

The `live-restore` option keeps containers running during Docker daemon restarts/upgrades.

### 3.3 Container Auto-Update Strategies

| Strategy | How | Pros | Cons |
|---|---|---|---|
| Watchtower | Sidecar container polls registry | Simple, automatic | Project archived (Dec 2025), not for production |
| systemd timer + script | Cron-like `docker pull && restart` | Full control, no extra deps | Must write the script |
| Docker Compose pull | `docker compose pull && up -d` | Simple, declarative | Manual or needs wrapper |
| Go binary self-update | Spoke checks for updates, restarts | Integrated with Above Deck | More code to maintain |

**Recommendation: systemd timer with a simple update script.** Watchtower was archived in December 2025. A 10-line bash script run by a systemd timer is more reliable and transparent:

```bash
#!/bin/bash
# /usr/local/bin/above-deck-update.sh
docker compose -f /opt/above-deck/docker-compose.yml pull
docker compose -f /opt/above-deck/docker-compose.yml up -d --remove-orphans
docker image prune -f
```

```ini
# /etc/systemd/system/above-deck-update.timer
[Unit]
Description=Above Deck spoke update check

[Timer]
OnCalendar=*-*-* 03:00:00
RandomizedDelaySec=3600
Persistent=true

[Install]
WantedBy=timers.target
```

This checks for updates daily at 3 AM (+/- 1 hour jitter) when the boat is likely idle.

### 3.4 Read-Only Root Filesystem

For SD card longevity (Pi builds) and crash resilience (all builds):

**How it works:** The root filesystem is mounted read-only. An overlay filesystem (tmpfs in RAM) captures all writes. On reboot, the overlay is discarded and the system returns to a known-good state.

**Implementation on Raspberry Pi OS:**
```bash
sudo raspi-config  # Performance Options > Overlay File System > Enable
```

**Data persistence pattern:**
- `/` -- read-only (OS, Docker images)
- `/var/lib/docker` -- separate partition on NVMe/eMMC (read-write)
- `/opt/above-deck/data` -- bind-mounted volume for SQLite DB (read-write, on NVMe/eMMC)
- `/tmp`, `/var/log` -- tmpfs in RAM

**Benefits:**
- SD card/eMMC writes reduced by 95%+
- Survives abrupt power loss without corruption
- System always boots to known-good state
- Docker data and SQLite on a separate reliable partition

### 3.5 Storage Reliability

| Medium | Write Endurance | Reliability | Speed | Cost | Recommended |
|---|---|---|---|---|---|
| Consumer microSD | 500-3,000 P/E cycles (TLC) | Low -- fails within 1-2 years at 24/7 | 90-170 MB/s read | $10-30 | No (for OS+data) |
| Industrial microSD | 3,000-30,000 P/E cycles | Medium | 90-170 MB/s read | $30-80 | Acceptable (OS only, read-only root) |
| eMMC (on CM5) | 3,000-10,000 P/E cycles (MLC) | High -- soldered, vibration-proof | 343 MB/s read | Included in CM5 | Yes |
| NVMe SSD | 200-600 TBW | Very high | 700+ MB/s read | $30-80 | Yes (best option) |
| USB SSD | 200-600 TBW | High (connector can vibrate loose) | 400+ MB/s read | $40-80 | Acceptable (secure the cable) |

**Recommendation:** CM5 with eMMC for the OS (read-only root) + NVMe SSD for Docker data and SQLite database. This eliminates the SD card failure mode entirely.

For x86 N100 builds, the internal NVMe handles everything.

### 3.6 Automatic Recovery Stack

Layer the following for maximum resilience:

```
Layer 1: Docker restart policy
  --restart=unless-stopped

Layer 2: systemd service for Docker Compose
  Restart=always
  WatchdogSec=60

Layer 3: systemd hardware watchdog
  RuntimeWatchdogSec=30  (in /etc/systemd/system.conf)

Layer 4: Hardware watchdog timer (BCM2712 on Pi, Intel TCO on x86)
  Auto-resets if kernel hangs

Layer 5: Witty Pi / power management
  Scheduled hard power cycle (weekly) as last resort
```

If the Go binary crashes, Docker restarts it (Layer 1). If Docker hangs, systemd restarts it (Layer 2). If systemd hangs, the hardware watchdog reboots the system (Layers 3-4). If the kernel panics repeatedly, the Witty Pi can hard power-cycle on a schedule (Layer 5).

### 3.7 Log Rotation and Disk Management

```json
// Docker daemon.json (shown above)
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

Additionally:
- SQLite WAL mode with periodic `PRAGMA wal_checkpoint(TRUNCATE)`
- systemd journal limited: `SystemMaxUse=100M` in `/etc/systemd/journald.conf`
- Weekly `docker system prune` via systemd timer
- Monitor disk usage and alert via the spoke's own health endpoint

---

## 4. Power Management

### 4.1 12V DC Power Solutions

#### For Raspberry Pi 5 (needs 5V/5A)

| Solution | Input Range | Output | Safe Shutdown | Price |
|---|---|---|---|---|
| UUGear Witty Pi 4 | 6-30V DC | 5V to Pi GPIO | Yes (GPIO trigger) | ~$30 |
| Juice4halt | 12V DC | 5V via supercap | Yes (60s hold-up) | ~$40 |
| PlusRoc 12V-to-5V USB-C | 12-24V DC | 5V/3A USB-C | No | ~$12 |
| Generic buck converter (5A) | 7-36V DC | 5V/5A | No | ~$8-15 |

**Recommendation:** Witty Pi 4 for budget builds (acts as DC-DC converter + RTC + safe shutdown + scheduling in one HAT). For HALPI2, it is built-in.

#### For N100 Mini PCs (need 12V DC)

Most N100 fanless mini PCs accept 12V DC natively via barrel jack. The boat battery connects directly through:
1. An inline fuse (3A for 12V/36W max)
2. A marine-grade DC-DC converter (12V in, 12V regulated out) to filter voltage spikes

Recommended: Victron Orion-Tr 12/12-9 isolated DC-DC converter (~$50). Provides galvanic isolation and filters the noisy boat electrical environment. Over-engineered but bombproof.

### 4.2 Safe Shutdown on Power Loss

| Approach | Hold-up Time | Cycle Life | Temp Range | Marine Suitability |
|---|---|---|---|---|
| Supercapacitor bank | 30-60s | 500,000+ cycles | -40 to +65C | Excellent |
| Li-Ion UPS (PiJuice) | 4-6 hours | 500-1000 cycles | 0 to 45C | Poor (heat, fire risk) |
| Li-Po battery | 1-4 hours | 300-500 cycles | 0 to 45C | Poor |

**Recommendation:** Supercapacitors. They survive temperature extremes, have essentially unlimited charge cycles, and provide enough hold-up time (30-60s) for a clean `shutdown -h now`. The HALPI2 includes this. For DIY builds, the Juice4halt or a custom supercap circuit works.

Li-Ion/Li-Po batteries on boats are a fire risk in hot engine rooms and degrade rapidly above 40C.

### 4.3 Power Consumption Summary

| Configuration | Idle (no display) | Idle (1x HDMI) | Load | Peak |
|---|---|---|---|---|
| Pi 5 8GB + case | 2.7W | 3.5W | 7W | 12W |
| CM5 + HALPI2 | ~3W | ~4W | ~8W | ~10W |
| N100 MeLE Quieter4C | 6W | 8W | 15W | 22W |
| N100 Beelink S12 Pro | 6-8W | 9-11W | 18W | 23W |
| fitlet3 (Celeron J6412) | ~5W | ~7W | ~12W | ~15W |

All options comfortably fit within the 15W idle budget. The Pi/CM5 options draw roughly half the power of x86, which matters on battery-only (anchor, no solar/engine charging).

---

## 5. Recommended Configurations

### Tier 1: Budget (~$150-250)

**"Try Above Deck on a Pi"**

| Component | Product | Price |
|---|---|---|
| Computer | Raspberry Pi 5 8GB | $110 |
| Power/RTC | UUGear Witty Pi 4 | $30 |
| Case | Geekworm P573 aluminium passive | $25 |
| Storage | Samsung EVO Plus 64 GB microSD | $12 |
| USB NVMe (data) | WD SN580 256 GB + USB enclosure | $35 |
| | **Total** | **~$212** |

**Power:** ~3W idle, ~8W load. Powered from 12V boat battery via Witty Pi (6-30V input).

**Pros:**
- Cheapest way to get started
- Huge community, tons of guides
- Witty Pi provides safe shutdown + RTC + scheduling
- Passive aluminium case handles 50C ambient

**Cons:**
- microSD card is the weak link (mitigate with read-only root + NVMe for data)
- Consumer temperature spec (0-50C) -- no margin for engine room mounting
- No built-in NMEA -- need USB adapter
- Multiple components to assemble and wire

**Installation notes:**
1. Flash Raspberry Pi OS Lite (64-bit) to microSD
2. Install Docker via `curl -fsSL https://get.docker.com | sh`
3. Connect Witty Pi 4 HAT, wire 12V boat power to screw terminals
4. Enable read-only root via `raspi-config`
5. Mount USB NVMe for Docker data and SQLite
6. Deploy Above Deck container via `docker compose up -d`
7. Connect NMEA gateway via USB or WiFi

### Tier 2: Recommended (~$350-550)

**"The right answer for most sailors"**

| Component | Product | Price |
|---|---|---|
| Computer | HALPI2 (8 GB CM5, 512 GB SSD) | EUR 448 (~$480) |
| | **Total** | **~$480** |

Or the budget-friendly CM5 alternative:

| Component | Product | Price |
|---|---|---|
| Carrier board | Waveshare IPCBOX-CM5 | $100 |
| Compute module | CM5 8 GB, 32 GB eMMC, WiFi | $75 |
| NVMe SSD | 256 GB NVMe 2280 | $30 |
| DC-DC converter | Victron Orion-Tr 12/12-9 | $50 |
| | **Total** | **~$255** |

**HALPI2 option:**

**Power:** ~3-4W idle, ~8W load. 10-32V input with built-in supercap UPS.

**Pros:**
- Purpose-built for boats -- nothing else to buy or assemble
- IP65 waterproof enclosure
- Built-in NMEA 2000 + NMEA 0183
- Supercapacitor safe shutdown included
- eMMC or NVMe storage (no SD card)
- HaLOS is container-native -- designed for exactly this use case
- -20C to +85C CM5 temperature range

**Cons:**
- Higher price for the all-in-one
- Smaller community than generic Pi
- EU-based company (shipping to US/AUS may take time)

**Waveshare IPCBOX-CM5 option:**

**Pros:**
- Half the price of HALPI2
- Industrial aluminium enclosure
- 7-36V DC input
- DIN rail mounting
- CM5's -20C to +85C range and eMMC reliability

**Cons:**
- No NMEA connectors (use USB adapters)
- No built-in safe shutdown (add external supercap or accept the risk)
- Requires a DC-DC converter for clean 12V

**Installation notes (both):**
1. Flash Raspberry Pi OS Lite or DietPi to eMMC/NVMe
2. Install Docker
3. Configure read-only root with NVMe data partition
4. Connect 12V boat power (HALPI2: direct; IPCBOX: via DC-DC converter)
5. Deploy Above Deck container
6. Connect NMEA via built-in ports (HALPI2) or USB (IPCBOX)

### Tier 3: Professional (~$500-1000)

**"No-compromise industrial marine computer"**

**Option A: Industrial ARM (HALPI2 maxed out)**

| Component | Product | Price |
|---|---|---|
| Computer | HALPI2 (16 GB CM5, 1 TB SSD) | EUR 594 (~$640) |
| | **Total** | **~$640** |

**Option B: Industrial x86**

| Component | Product | Price |
|---|---|---|
| Computer | CompuLab fitlet3 (Celeron J6412, 16 GB, 256 GB NVMe) | ~$450 |
| DC-DC converter | Victron Orion-Tr 12/12-9 | $50 |
| NMEA interface | Yacht Devices YDWG-02 WiFi gateway | $250 |
| | **Total** | **~$750** |

**Option C: OnLogic industrial**

| Component | Product | Price |
|---|---|---|
| Computer | OnLogic CL260 (Intel N150, 16 GB, 256 GB) | ~$600+ |
| DC-DC converter | Victron Orion-Tr 12/12-9 | $50 |
| NMEA interface | USB NMEA adapter | $100 |
| | **Total** | **~$750+** |

**Power:** fitlet3 ~5-7W idle; HALPI2 ~3-4W idle.

**Pros (fitlet3 / OnLogic):**
- -40C to +85C operating range (fitlet3) / -40C to +70C (OnLogic)
- 7-42V DC input (fitlet3) -- handles 12V/24V boats and voltage sags
- 5-year warranty, 15-year availability (fitlet3)
- x86 Docker ecosystem -- widest image compatibility
- NVMe standard, no SD card
- Fanless aluminium construction

**Cons:**
- Higher power consumption than ARM
- No built-in NMEA -- need separate gateway
- Higher cost
- Heavier, larger form factor

---

## 6. Hardware Comparison Matrix

| Feature | Pi 5 8GB | CM5 8GB + HALPI2 | CM5 + IPCBOX | N100 (MeLE) | fitlet3 (J6412) |
|---|---|---|---|---|---|
| **CPU** | BCM2712 A76 4C @ 2.4 GHz | BCM2712 A76 4C @ 2.4 GHz | BCM2712 A76 4C @ 2.4 GHz | Alder Lake-N 4C @ 3.4 GHz | Elkhart Lake 4C @ 2.0 GHz |
| **Architecture** | ARM64 | ARM64 | ARM64 | x86_64 | x86_64 |
| **RAM** | 8 GB LPDDR4X | 8 GB LPDDR4X | 8 GB LPDDR4X | 8-32 GB LPDDR4x/5 | Up to 32 GB DDR4 |
| **Storage** | microSD + USB/NVMe HAT | eMMC + NVMe SSD | eMMC + NVMe | eMMC + NVMe | Triple M.2 (NVMe+SATA+WiFi) |
| **Power (idle)** | 2.7W | ~3W | ~3W | 6W | ~5W |
| **Power (load)** | 7W | ~8W | ~8W | 15-18W | ~12W |
| **Temp range** | 0 to 50C | -20 to 85C | -20 to 85C (CM5) | 0 to 40C (consumer) | -40 to 85C |
| **12V DC input** | No (needs HAT/converter) | Yes (10-32V) | Yes (7-36V) | Yes (12V barrel) | Yes (7-42V) |
| **Fanless** | Yes (with case) | Yes (IP65 enclosure) | Yes (aluminium) | Yes | Yes |
| **Display** | 2x micro-HDMI | 2x HDMI | 1x HDMI | 2x HDMI + USB-C | 2x 4K outputs |
| **USB** | 2x USB 3.0, 2x USB 2.0 | 2x USB 3.0 (waterproof) | Multiple USB 3.2/2.0 | 2x USB 3.2, 1x USB 2.0, 1x USB-C | Multiple USB 3.0/2.0 |
| **Ethernet** | 1x GbE | 1x GbE | 1x GbE + 1x 2.5GbE | 1x GbE | Up to 4x GbE |
| **WiFi** | WiFi 5 + BT 5.0 | WiFi 5 + BT 5.0 | WiFi 5 + BT 5.0 | WiFi 5 + BT 5.1 | Optional WiFi 6E + BT 5.2 |
| **NMEA native** | No | Yes (N2K + 0183) | No (has RS485/CAN) | No | No |
| **Safe shutdown** | No (add Witty Pi) | Yes (supercap built-in) | No | No | No |
| **Docker support** | Excellent (ARM64) | Excellent (ARM64) | Excellent (ARM64) | Excellent (x86) | Excellent (x86) |
| **IP rating** | None (depends on case) | IP65 | DIN-rail enclosure | None | None (sealed aluminium) |
| **Price (complete)** | ~$212 (with Witty Pi + case) | ~$480 | ~$255 | ~$200 | ~$450 |
| **Form factor** | 85x56 mm (credit card) | 200x130x60 mm | 136x92x40 mm | Ultra-thin, VESA | 133x100x35 mm |
| **Warranty** | 1 year | TBD | 1 year | 1 year | 5 years |
| **Availability** | 10+ years | New product | New product | 2-3 years typical | 15-year guarantee |

### Verdicts

| Option | Verdict |
|---|---|
| **Pi 5 8GB** | Best for experimenting and budget builds. Needs accessories to be marine-viable. SD card is the Achilles' heel. |
| **CM5 + HALPI2** | **Best overall for marine use.** Purpose-built, IP65, NMEA native, supercap UPS. Higher price justified by zero integration work. |
| **CM5 + IPCBOX** | Best value for a "proper" marine build. Industrial carrier at half the HALPI2 price, but no NMEA or safe shutdown. |
| **N100 (MeLE)** | Best x86 option. Native 12V, fanless, good Docker support. Wider image compatibility than ARM. Consumer-grade though. |
| **fitlet3** | Best industrial x86. Extreme temp range, wide voltage input, 15-year availability. Older CPU but bombproof hardware. |

---

## 7. Final Recommendation

For the Above Deck spoke, the recommended path depends on the sailor's priorities:

**If you want it to just work:** HALPI2 with CM5 8 GB and 512 GB SSD (~$480). Connect 12V power and HDMI, deploy the Docker container, done. The marine-specific design eliminates dozens of integration decisions.

**If you want the best value:** Waveshare IPCBOX-CM5 with CM5 8 GB/32 GB eMMC (~$255). Add a DC-DC converter and USB NMEA adapter. More DIY but half the price.

**If you want x86 compatibility:** MeLE Quieter4C N100 with 16 GB RAM (~$200). Native 12V, fanless, excellent Docker ecosystem. Add a fuse and NMEA USB adapter.

**If you want industrial no-compromise:** CompuLab fitlet3 (~$450). -40C to +85C, 7-42V input, 5-year warranty, 15-year availability. The boat hardware that outlasts the boat.

---

## Sources

- [Raspberry Pi 5 Product Page](https://www.raspberrypi.com/products/raspberry-pi-5/)
- [Raspberry Pi 5 Review - Tom's Hardware](https://www.tomshardware.com/reviews/raspberry-pi-5)
- [Raspberry Pi 5 Power Consumption - Pi Dramble](https://www.pidramble.com/wiki/benchmarks/power-consumption)
- [Pi 5 Power - CNX Software Review](https://www.cnx-software.com/2023/11/05/raspberry-pi-5-review-raspberry-pi-os-bookworm-benchmarks-power-consumption/)
- [Compute Module 5 Product Page](https://www.raspberrypi.com/products/compute-module-5/)
- [CM5 Review - Tom's Hardware](https://www.tomshardware.com/raspberry-pi/raspberry-pi-compute-module-5-review)
- [CM5 Datasheet](https://datasheets.raspberrypi.com/cm5/cm5-datasheet.pdf)
- [HALPI2 - Hat Labs](https://shop.hatlabs.fi/products/halpi2-computer)
- [HALPI2 User Guide](https://docs.hatlabs.fi/halpi2/)
- [HALPI2 Hackaday Article](https://hackaday.com/2025/09/20/a-ruggedized-raspberry-pi-for-sailors/)
- [HaLOS - Container-Based Pi OS](https://hatlabs.fi/posts/2025-10-27-halos/)
- [Waveshare IPCBOX-CM5](https://www.waveshare.com/ipcbox-cm5-a.htm)
- [Waveshare CM5 Industrial - CNX Software](https://www.cnx-software.com/2026/03/05/raspberry-pi-cm5-industrial-computer-features-rs485-rs232-can-bus-dio-interfaces-dual-ethernet-optional-4g-5g-cellular-module/)
- [Kontron AL Pi-Tron CM5](https://www.kontron.com/en/products/al-pi-tron-cm5/p188553)
- [Kontron BL Pi-Tron CM5](https://www.kontron-electronics.com/company/news/kontron-introduces-the-new-pi-tron-cm5-based-on-the-compute-module-5-from-raspberry-pi-ltd/)
- [Seeed Studio reTerminal DM](https://www.seeedstudio.com/reTerminal-DM-With-Camera-p-5648.html)
- [UUGear Witty Pi 4](https://www.uugear.com/product/witty-pi-4/)
- [Witty Pi 4 User Manual](https://www.uugear.com/doc/WittyPi4_UserManual.pdf)
- [Geekworm P573 Pi 5 Case](https://geekworm.com/products/p573)
- [MeLE Quieter4C](https://store.mele.cn/products/mele-quieter-4c-n100-3-4ghz-fanless-mini-computer-lpddr4x-win11-hdmi-4k-wi-fi-5-bt-5-1-usb-3-2-2-usb-2-0-1-type-c-1)
- [MeLE Quieter4C No OS - CNX Software](https://www.cnx-software.com/2025/06/11/mele-quieter4c-fanless-mini-pc-without-os/)
- [Beelink Mini S12 Pro](https://www.bee-link.com/products/beelink-mini-s12-pro-n100)
- [Beelink S12 Pro Review - NotebookCheck](https://www.notebookcheck.net/Intel-N100-performance-debut-Beelink-Mini-S12-Pro-mini-PC-review.758950.0.html)
- [GMKtec NucBox G3](https://www.gmktec.com/products/nucbox-g3-most-cost-effective-mini-pc-with-intel-n100-processor)
- [CompuLab fitlet3](https://fit-iot.com/web/products/fitlet3/)
- [fitlet3 - CNX Software](https://www.cnx-software.com/2022/02/09/fitlet3-compact-fanless-elkhart-lake-mini-pc-for-iot-and-industrial-applications/)
- [Protectli Vault VP2410](https://protectli.com/product/vp2410/)
- [OnLogic Fanless PCs](https://www.onlogic.com/store/computers/industrial/fanless/)
- [Intel N100 vs Pi 5 - Jeff Geerling](https://www.jeffgeerling.com/blog/2025/intel-n100-better-value-raspberry-pi/)
- [Pi 5 vs N100 - CNX Software](https://www.cnx-software.com/2024/04/29/raspberry-pi-5-intel-n100-mini-pc-comparison-features-benchmarks-price/)
- [N100 Power Consumption Guide](https://bishalkshah.com.np/blog/low-power-homelab-n100-mini-pc)
- [Docker vs Podman 2025 - sanj.dev](https://sanj.dev/post/container-runtime-showdown-2025)
- [Docker vs Podman - Linux Journal](https://www.linuxjournal.com/content/containers-2025-docker-vs-podman-modern-developers)
- [Lightweight Linux Distros for SBCs](https://linuxboards.com/top-5-lightweight-linux-distros-for-your-single-board-computer/)
- [DietPi](https://distrowatch.com/dietpi)
- [Read-Only Root on Pi - Chris Dzombak](https://www.dzombak.com/blog/2024/03/running-a-raspberry-pi-with-a-read-only-root-filesystem/)
- [SD Card vs eMMC Reliability](https://www.robustel.store/blogs/industrial-iot-blog/the-sd-card-vs-emmc-debate-a-reliability-guide-for-edge-products)
- [eMMC Lifecycle - Kingston](https://www.kingston.com/en/blog/embedded-and-industrial/emmc-lifecycle)
- [Watchtower (archived)](https://github.com/containrrr/watchtower)
- [Systemd Watchdog - Embedded Linux](https://cornersoftsolutions.com/leveraging-systemd-for-hardware-watchdog-control-in-embedded-linux/)
- [Supercapacitor UPS for Pi - Dr. Scott Baker](https://www.smbaker.com/supercapacitor-uninterruptable-power-supply-ups-for-raspberry-pi)
- [Juice4halt Supercapacitor UPS](https://juice4halt.com/)
- [NMEA 2000 Powered Pi - Seabits](https://seabits.com/nmea-2000-powered-raspberry-pi/)
- [CWWK N305/N100 Fanless PCs](https://cwwk.net/products/12th-gen-intel-firewall-mini-pc-alder-lake-i3-n305-8-core-n200-n100-fanless-soft-router-proxmox-ddr5-4800mhz-4xi226-v-2-5g)
- [Pi 5 RAM Price Increase](https://www.notebookcheck.net/Raspberry-Pi-5-now-costs-up-to-205-due-to-RAM-crisis.1218213.0.html)
