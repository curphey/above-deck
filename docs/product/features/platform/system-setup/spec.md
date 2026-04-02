# System Setup & Configuration

**Feature:** 6.29 — System Setup & Configuration
**Status:** Draft v1
**Date:** 2026-03-31
**Depends on:** MFD Shell (6.26), Protocol Adapters, Data Model, Boat Management (6.11)
**Related research:** [First-Run Setup Experiences](../../../research/ux-and-design/first-run-setup-experiences.md)

---

## 1. Overview

This feature covers the complete OS-level user experience for the spoke: first-run setup wizard, the Settings app, and all system configuration. It is the bridge between "plug in hardware" and "working boat computer."

The design philosophy is Apple-like: the system does the work, not the user. Networks are discovered, not typed. Devices are detected, not configured. Defaults are sensible, not empty. The user makes a few high-level choices and everything else derives from them.

### Design Principles

1. **Boot to value, not to configuration.** Setup ends at the MFD home screen with live data flowing. Under 2 minutes for a new setup.
2. **The system detects, the user confirms.** Auto-discover NMEA 2000 devices, Victron equipment, AIS identity, GPS position, WiFi networks. Present "here's your boat" — user confirms or adjusts.
3. **One question per screen.** Each setup screen asks for one decision. Smooth transitions between screens. Progress feels fast.
4. **Smart defaults cascade.** Country selection infers timezone, units, date format, language. GPS position infers local tide stations, chart region, sunrise/sunset times.
5. **Phone companion available.** QR code on the device screen lets users complete setup on their phone's browser — useful when the display is at the helm and it's raining.
6. **Account required, value immediate.** Hub account (Google OAuth) is mandatory during setup — enables sync, remote monitoring, AI agents from minute one. But the spoke works offline if internet drops after setup.
7. **Restore is a first-class path.** Hardware dies, swap to a new device, restore from backup. Prominent on the first screen. Target: 30 seconds to a working system from backup.

---

## 2. User Stories

### First-Run Setup
- **SU-01:** As a new user, I power on my spoke hardware for the first time and see a setup wizard that guides me from zero to a working boat computer in under 2 minutes.
- **SU-02:** As a user setting up at the helm, I scan a QR code on the device's screen and complete the setup on my phone below deck where it's dry.
- **SU-03:** As a user whose previous hardware failed, I select "Restore from Backup" and have my full configuration, equipment registry, settings, and layouts restored in 30 seconds.
- **SU-04:** As a user with an existing hub account, I sign in with Google and my boat profile, equipment, and preferences sync down automatically.

### System Settings
- **SU-10:** As a user at a new marina, I open Settings → Network and join the marina WiFi in two taps.
- **SU-11:** As a user who just installed a new NMEA 2000 device, I open Settings → Gateways & Devices and tap "Scan Again" to detect it.
- **SU-12:** As a user preparing for night watch, I open Settings → Display and set night mode to "Auto" so it switches based on sunset.
- **SU-13:** As a user running low on disk, I open Settings → Storage and see exactly what's using space, with one-tap cleanup for chart cache and old logs.
- **SU-14:** As a user who wants to check for software updates, I open Settings → Updates and see my current version, available updates, and release notes.
- **SU-15:** As a user troubleshooting a gateway issue, I open Settings → Diagnostics and see connection logs, run a network test, and export a diagnostic report.
- **SU-16:** As a user who added a new Victron device, I go to Settings → Gateways & Devices and see it auto-detected from the Cerbo GX MQTT feed.
- **SU-17:** As a user who wants to add a gateway that wasn't auto-detected, I tap "Add Gateway Manually" and enter its IP address and port.
- **SU-18:** As a non-technical partner, I can check battery status and tank levels without understanding any of the settings. The Settings app is separate from the boat data — I never accidentally change something.

---

## 3. First-Run Setup Wizard

### Physical Context

The user has:
1. Mounted spoke hardware (Mac Mini M4, Intel N100, or HALPI2) in the nav station
2. Connected it to a display via HDMI
3. Connected a USB NMEA 2000 gateway (iKonvert) and/or WiFi gateway (NavLink2)
4. Connected Ethernet or has WiFi available
5. Powered on the device

Docker starts automatically. The browser opens to `localhost:3000`. The setup wizard appears full-screen.

### Screen Sequence

#### Screen 1: Welcome

- Full-screen deep navy background (#1a1a2e)
- Above Deck mark/logo centered
- Subtle animation: instrument data lines drawing themselves like a blueprint coming to life (2-3 seconds, non-blocking)
- QR code bottom-right: "Scan to set up from your phone"
- Two buttons:
  - **"Get Started"** (primary)
  - **"Restore from Backup"** (secondary, text link)
- If "Restore from Backup": prompt for USB drive or hub account to restore from. On restore, skip to Screen 7.

#### Screen 2: Language & Region

- Single screen, two selections
- Language picker: grid of flags + language names (English, French, Spanish, German, Italian, Portuguese, Dutch, Swedish, Norwegian, Greek, Turkish, Japanese)
- Country picker: dropdown, pre-selected from browser locale if available
- **Cascading defaults from country:** timezone, date format (DD/MM vs MM/DD), time format (24h vs 12h), units (nautical miles/knots is always default for navigation, but metric vs imperial for temperature, wind speed display)
- Single button: "Continue"

#### Screen 3: Sign In

- "Sign in to connect your boat"
- Google OAuth button — large, centered, one tap
- Brief benefits below: "Sync your data across devices. Monitor your boat remotely. AI crew that knows your systems."
- On successful auth: check if user has existing boat profile on hub
  - If yes: "Welcome back. We found your boat profile for *SV Artemis*." Pre-populate everything for Screen 5.
  - If no: proceed to Screen 4

#### Screen 4: Discovering Your Boat

- Full-screen animated discovery visualization
- Blueprint-style radar sweep emanating from center
- Real-time status lines appearing as each system is probed:

```
Scanning NMEA 2000 bus...        ✓ Found 14 devices
Checking Victron devices...       ✓ Cerbo GX + 4 devices  
Reading AIS transponder...        ✓ MMSI 235012345 — SV Artemis
Detecting GPS position...         ✓ 50.7128°N, 1.3243°W
Scanning WiFi networks...         ✓ 6 networks available
Checking display...               ✓ 1920×1080 @ 60Hz
```

- Each line animates in as detection completes
- Total time: 15-30 seconds
- If no NMEA 2000 gateway detected: "No instrument gateway found. You can add one later in Settings." (doesn't block setup)
- If no AIS: skip MMSI auto-detection, ask manually in Screen 5

#### Screen 5: Your Boat

- "Here's your boat" (if auto-detected) or "Tell us about your boat" (if manual)
- Boat identity card with pre-populated fields (from AIS MMSI lookup, existing hub profile, or boat model template):

| Field | Source | Editable |
|-------|--------|----------|
| Boat name | AIS / hub profile | Yes |
| MMSI | AIS transponder | Yes |
| Boat type | Hull: monohull/catamaran/trimaran. Use: sail/motor/motorsailer | Yes |
| Model | Dropdown with search (e.g., "Lagoon 42") — triggers template pre-fill | Yes |
| LOA (m) | Model template / hub profile | Yes |
| Beam (m) | Model template / hub profile | Yes |
| Draft (m) | Model template / hub profile | Yes |
| Mast height (m) | Model template / hub profile | Yes — sail only |
| Flag state | Country from Screen 2 | Yes |

- If boat model selected from template: displacement, tank capacities, engine details auto-fill from community-maintained templates
- "These details help your instruments work better — draft sets shallow water alarms, mast height calculates bridge clearance."
- Single button: "Continue"

#### Screen 6: Your Equipment

- "Here's what we found on your boat"
- Equipment list grouped by system category, each item showing:
  - Icon (Tabler icon per category)
  - Manufacturer + Model (from PGN 126996 product info string, or Victron PID lookup)
  - Firmware version
  - Green checkmark = auto-detected
- Categories shown: Navigation, Power, Propulsion, Sensors, Communications, Safety

```
NAVIGATION
  ✓ Garmin GPSMAP 1243xsv          v32.10
  ✓ Raymarine EV-200 Autopilot     v2.1.0

POWER  
  ✓ Victron MultiPlus 3000/12      v502
  ✓ Victron SmartSolar MPPT 150/35 v1.65
  ✓ Victron SmartSolar MPPT 150/35 v1.65
  ✓ Victron SmartShunt 500A        v4.12
  ✓ Victron Cerbo GX               v3.20

SENSORS
  ✓ B&G Triton2 (Wind)             v3.2.1
  ✓ Airmar DST810 (Depth/Speed)    v1.08
```

- "Add Device" button at the bottom of each section → opens manufacturer/model picker
- Unrecognized NMEA 2000 devices shown with manufacturer code + product code: "Unknown device (Mfr: 137, Product: 4251)" with an "Identify" button
- Single button: "Confirm Equipment"

#### Screen 7: Connect to Internet

- WiFi network list (auto-detected, sorted by signal strength)
- Signal strength bars per network
- Lock icon for secured networks
- Tap network → password field appears inline
- Ethernet status shown if cable detected: "Ethernet connected — 192.168.1.105"
- If already connected (Ethernet or from phone companion): show "Connected to *marina-wifi*" with checkmark
- "Skip — your boat works offline" text link
- On connect: hub sync begins in background (boat profile, equipment registry, firmware database, chart catalog)

#### Screen 8: Ready

- "Your boat is ready"
- Summary card:
  - Boat: SV Artemis (Lagoon 42)
  - Devices: 14 connected
  - Internet: Connected via marina-wifi
  - Hub: Synced
- Single button: "Go to Home Screen"
- Smooth transition: the summary card shrinks and morphs into the MFD status bar as the home screen app grid fades in beneath it
- Live data is already flowing — gauges show real values, chart shows GPS position

### Setup Timing Targets

| Path | Target |
|------|--------|
| New setup (full wizard) | < 2 minutes |
| Existing hub account (profile syncs down) | < 90 seconds |
| Restore from backup | < 30 seconds |
| Phone companion (via QR) | Same as above, on phone browser |

### Phone Companion Flow

When the user scans the QR code on Screen 1:
1. Phone browser opens `http://<spoke-ip>:3000/setup`
2. Same wizard screens render responsively on the phone
3. All inputs sync to the spoke in real-time via WebSocket
4. The device display shows a "Setting up from your phone..." status with live progress
5. On completion, the device display transitions to the MFD home screen

---

## 4. Settings App

### Architecture

The Settings app is a single MFD app registered in the app grid with a gear icon. It opens to a two-panel layout:
- **Left panel:** navigation sidebar with section icons and labels
- **Right panel:** content area for the selected section

On small displays (< 900px), the sidebar collapses to a list view and sections open full-screen with a back button.

### Sections

#### 4.1 Network

| Setting | Type | Details |
|---------|------|---------|
| WiFi | Network list | Saved networks (reorder priority, forget), available networks (join), signal strength, security type |
| WiFi password | Text input | Per-network, shown/hidden toggle |
| Ethernet | Status display | Connected/disconnected, IP address, speed, DHCP/static toggle |
| Static IP config | Form | IP, subnet, gateway, DNS (only if static selected) |
| Cellular | Status display | If USB modem detected: carrier, signal, data usage this period |
| Internet status | Status display | Connected/offline, latency to hub, last successful sync |
| Connection priority | Drag list | Order of preference: Ethernet → WiFi → Cellular. Auto-failover. |
| Boat network map | Visualization | Topology view: spoke ↔ gateways ↔ devices. Tap any node for details. |

**WiFi join flow:**
1. Tap network name from list
2. Password field appears inline (no modal, no separate screen)
3. "Join" button
4. Spinner → "Connected" with checkmark
5. Network moves to "Saved Networks" section

#### 4.2 Gateways & Devices

| Setting | Type | Details |
|---------|------|---------|
| Detected gateways | Card list | Per gateway: name, type (USB/WiFi/Ethernet), connection status, protocol, IP:port or USB path, last data received timestamp |
| NMEA 2000 devices | Table | Per device: manufacturer, model, firmware version, NMEA address, device class, last seen. From PGN 60928 + 126996. |
| Victron devices | Table | Per device: type (MPPT/inverter/shunt/BMS), serial, firmware, connection (VE.Direct/MQTT/VE.Can) |
| Other devices | Table | SignalK servers, IP cameras, BLE sensors, SDR dongles, ESP32 nodes |
| Scan Again | Button | Re-runs full auto-discovery across all protocols |
| Add Gateway Manually | Form | Protocol dropdown (NMEA 2000 TCP, NMEA 0183 TCP/UDP, SignalK WebSocket, Victron MQTT, RTSP Camera), IP address, port. "Test Connection" button. |
| Connection test | Per-gateway button | Tests connectivity, reports latency, shows sample data received |
| Gateway health | Per-gateway | Uptime, reconnection count, data rate, error rate |

**Device detail view (tap any device):**
- Full device info from PGN 126996 (model ID, software version, serial, certification level)
- Firmware status (current vs latest known, link to manufacturer download)
- Data paths this device provides (e.g., "navigation/depth/belowTransducer", "navigation/wind/apparent")
- Live data preview from this device
- Link to equipment registry entry

#### 4.3 Display

| Setting | Type | Details |
|---------|------|---------|
| Night mode | Selector | Auto (GPS sunrise/sunset) / Manual on / Manual off / Schedule |
| Night mode schedule | Time range | If schedule selected: on time, off time |
| Night mode intensity | Slider | Red brightness level (for tuning to ambient conditions) |
| Dusk mode | Toggle | Enable intermediate dusk palette (between day and night) |
| Display sleep | Selector | Never / 5 min / 10 min / 30 min / 1 hour |
| Wake on alarm | Toggle | Wake display on any active alarm (default: on) |
| Orientation | Selector | Auto / Landscape / Portrait |
| UI scale | Slider | 80% – 150% (for different display sizes and viewing distances) |
| Status bar position | Selector | Top / Bottom |

#### 4.4 Account & Sync

| Setting | Type | Details |
|---------|------|---------|
| Signed-in user | Display | Name, email, avatar. "Sign Out" button. |
| Hub connection | Status | Connected / offline, hub URL, latency |
| Last sync | Timestamp | Per direction: last hub→spoke, last spoke→hub |
| Sync now | Button | Trigger immediate sync |
| Sync over cellular | Toggle | Allow sync when on metered connection (default: off) |
| Position sharing | Selector | Off / Friends only / Public |
| Instrument data upload | Toggle | Upload historical instrument data to hub (default: off) |
| VRM account | Link/unlink | "Link Victron VRM Account" — OAuth flow for auto firmware detection + cloud energy data |
| Backup | Section | Last backup time. "Back Up Now" button. Backup destination: hub cloud (automatic) + USB drive (manual). |
| Restore | Button | Restore from hub backup or USB drive |

#### 4.5 Equipment

| Setting | Type | Details |
|---------|------|---------|
| Equipment registry | Link | Opens the full Boat Management equipment registry (6.11) |
| Quick add device | Button | Shortcut to add a device (manufacturer → model picker) |
| Firmware status | Summary | "3 devices have firmware updates available" with link to firmware tracking |

This section is intentionally lightweight — a shortcut to Boat Management, not a duplication.

#### 4.6 Storage

| Setting | Type | Details |
|---------|------|---------|
| Disk usage | Bar chart | Breakdown: Charts (X GB), Logs (X GB), Database (X GB), GRIB files (X MB), Photos (X MB), System (X GB), Free (X GB) |
| Chart cache | Section | Downloaded regions listed with size. "Delete" per region. "Clear All Charts" with confirmation. |
| Chart download | Section | Region picker map for downloading chart tiles for offline use |
| Log retention | Selector | 7 days / 30 days / 90 days / 1 year / Forever |
| GRIB retention | Selector | 3 days / 7 days / 14 days |
| Photo sync | Status | Photos pending upload to hub: X items, X MB |
| Database | Status | Size, integrity check result, last vacuum |
| Clean up | Button | "Free up space" — removes expired GRIB files, rotates logs, vacuums database. Shows space recovered. |
| Storage alert | Threshold | Alert when free space drops below X GB (default: 1 GB) |

#### 4.7 Alerts & Notifications

| Setting | Type | Details |
|---------|------|---------|
| Default alert rules | Toggle list | All built-in alert rules with on/off toggle and threshold adjustment |
| Notification channels | Section | Push notifications (test button), email (address, test), SMS (phone number, test) |
| Emergency contacts | Contact list | Name, phone, email, relationship. Add/edit/remove. |
| Alert sound | Selector | Sound picker for on-device alarm. Volume control. |
| Do not disturb | Schedule | Time range when non-critical alerts are suppressed |
| Critical override | Toggle | Critical alerts (MOB, fire, CO, bilge high-water) always sound regardless of DND (default: on, not toggleable — always on for safety) |

#### 4.8 Updates

| Setting | Type | Details |
|---------|------|---------|
| Current version | Display | Version number, build date, release channel |
| Release notes | Expandable | What's new in current version |
| Check for updates | Button + status | "Checking..." → "Up to date" or "Update available: v2.4.0" |
| Available update | Card | Version, release notes, size, "Update Now" button |
| Update safety | Guard | Cannot update while underway (GPS speed > 0.5 kn). Cannot update below 50% battery SOC. Shows why if blocked. |
| Auto-check | Toggle | Check for updates daily (default: on). Never auto-install. |
| Update history | List | Previous versions installed, dates, rollback available for last 2 versions |
| Rollback | Button | "Roll back to v2.3.1" with confirmation. Restores previous Docker image. |
| Release channel | Selector | Stable (default) / Beta. Beta gets early access to new features. |

#### 4.9 Diagnostics

| Setting | Type | Details |
|---------|------|---------|
| System info | Display | Hardware: model, CPU, RAM, disk. Software: OS, Docker, Go version, Above Deck version |
| Resource usage | Live gauges | CPU %, RAM usage, disk I/O, temperature (if available) |
| Gateway logs | Log viewer | Filterable by gateway, severity. Last 1000 lines. Auto-scroll. |
| NMEA 2000 traffic | Live view | PGN stream with decode — shows raw PGN number, source, decoded summary. Filter by PGN or source. |
| Network test | Tools | Ping hub (latency), DNS lookup, speed test, gateway connectivity check |
| Restart spoke | Button | "Restart" with confirmation. Restarts the Docker container. |
| Shutdown | Button | "Shut Down" with confirmation. Stops the container. Requires physical power cycle to restart. |
| Factory reset | Button | "Reset to Factory Defaults" — deep in diagnostics, requires typing "RESET" to confirm. Clears all local data. Backup prompt shown first. |
| Export report | Button | Generates a diagnostic ZIP: system info, gateway logs, recent errors, configuration (sanitized — no passwords/tokens). For sharing with community support. |

#### 4.10 Calibration

| Setting | Type | Details |
|---------|------|---------|
| Compass offset | Number input | Magnetic deviation correction (degrees). Auto-calculated from GPS COG vs heading if enough data. |
| Depth transducer offset | Number input | Distance from transducer to waterline (negative) or keel (positive). Sets "below keel" vs "below surface" reference. |
| Speed calibration | Number input | Speed through water correction factor (%). Calibrate against GPS SOG in calm conditions. |
| Wind angle offset | Number input | Masthead unit alignment correction (degrees). |
| Tank calibration | Per-tank | Sender type (resistive/capacitive/ultrasonic), empty/full resistance values, linearization curve |
| Auto-calibrate | Toggle | Where possible, system learns calibration offsets over time from GPS cross-reference (speed, heading) |

#### 4.11 About

| Setting | Type | Details |
|---------|------|---------|
| Version | Display | Above Deck version, build hash, build date |
| Hardware | Display | Device model, serial (if available), MAC address |
| Project | Links | GitHub repo, community forum, documentation |
| Open source | Link | License (GPL), open source dependency list with licenses |
| Device ID | Display | Unique spoke identifier (for support, sync pairing) |

---

## 5. Data Model

### Setup State

```
system/
  setup/
    completed           — bool, false until wizard finishes
    completed_at        — timestamp
    setup_method        — enum: device_screen, phone_companion, restore
    restore_source      — enum: hub_backup, usb_backup, none
  
  identity/
    device_id           — UUID, generated on first boot
    hardware_model      — string (detected: "Mac Mini M4", "MeLE Quieter4C", "HALPI2")
    hardware_serial     — string (if available)
    spoke_version       — string (semver)
    spoke_build         — string (git hash)
    docker_image        — string (image tag)
```

### Settings (persisted to SQLite)

```sql
CREATE TABLE settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,          -- JSON-encoded value
  type        TEXT NOT NULL,          -- string, number, boolean, json
  category    TEXT NOT NULL,          -- network, display, sync, alerts, storage, calibration
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_settings_category ON settings(category);
```

### Backup Manifest

```sql
CREATE TABLE backups (
  id            TEXT PRIMARY KEY,     -- UUID
  created_at    TIMESTAMP NOT NULL,
  destination   TEXT NOT NULL,        -- hub, usb
  size_bytes    INTEGER NOT NULL,
  version       TEXT NOT NULL,        -- spoke version at backup time
  manifest      TEXT NOT NULL,        -- JSON: what's included (settings, equipment, layouts, routes, logs)
  status        TEXT NOT NULL         -- completed, failed, in_progress
);
```

### What Gets Backed Up

| Data | Included | Notes |
|------|----------|-------|
| Settings (all) | Yes | Full settings table |
| Boat profile | Yes | Via hub sync |
| Equipment registry | Yes | Via hub sync |
| MFD layouts | Yes | App grid arrangement, split views, gauge layouts |
| Alert rules (custom) | Yes | User-defined thresholds |
| Calibration offsets | Yes | Compass, depth, speed, wind |
| Saved networks (SSIDs) | Yes | Not passwords (security) |
| Gateway configurations | Yes | Manual gateway entries |
| Routes and waypoints | Yes | Via hub sync |
| Logbook entries | Yes | Via hub sync |
| Chart cache | No | Re-downloaded from hub |
| Time-series instrument data | No | Too large; hub has historical copy |
| GRIB files | No | Ephemeral weather data |

---

## 6. Auto-Discovery Engine

### Discovery Sequence (Screen 4)

The discovery engine runs all probes concurrently with a 30-second total timeout:

```
┌─────────────────────────────────────────────┐
│              Discovery Engine               │
│                                             │
│  ┌──────────────┐  ┌──────────────────────┐ │
│  │ USB Enumerate│  │ Network Scan         │ │
│  │ - iKonvert   │  │ - mDNS (SignalK)     │ │
│  │ - VE.Direct  │  │ - UDP broadcast      │ │
│  │ - SDR dongle │  │   (NavLink2, YDWG)   │ │
│  │ - USB serial │  │ - TCP scan (Cerbo    │ │
│  └──────┬───────┘  │   MQTT 1883)         │ │
│         │          │ - ONVIF (cameras)     │ │
│         │          │ - WiFi SSID scan      │ │
│         │          └──────────┬────────────┘ │
│         │                    │               │
│         └────────┬───────────┘               │
│                  ▼                           │
│  ┌──────────────────────────────────────┐    │
│  │ Protocol-Specific Discovery          │    │
│  │ - NMEA 2000: ISO Request PGN 59904  │    │
│  │   → PGN 60928 (Address Claim)       │    │
│  │   → PGN 126996 (Product Info)       │    │
│  │ - Victron: PID lookup table         │    │
│  │ - AIS: own vessel MMSI extraction   │    │
│  │ - GPS: position from first fix      │    │
│  └──────────────────┬───────────────────┘    │
│                     ▼                        │
│  ┌──────────────────────────────────────┐    │
│  │ Results Assembly                     │    │
│  │ - Deduplicate (same device on N2K   │    │
│  │   and Victron = one entry)          │    │
│  │ - Match to equipment templates      │    │
│  │ - Lookup MMSI → vessel name         │    │
│  │ - Infer timezone from GPS           │    │
│  └──────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### Deduplication

A Victron SmartSolar MPPT might appear on both NMEA 2000 (via veLink gateway) and Victron MQTT (via Cerbo GX). The discovery engine deduplicates by:
1. Manufacturer code match (Victron = 358 in NMEA 2000)
2. Serial number match (if available from both sources)
3. Device type + instance number correlation

### Manual Device Addition

When a device isn't auto-detected (e.g., a standalone NMEA 0183 instrument, an older device without PGN 126996 support):

1. Tap "Add Device" under the relevant system category
2. Select manufacturer from searchable dropdown
3. Select model from filtered list (or "Other / Custom")
4. If template exists: specs auto-fill (type, protocols, typical data paths)
5. If custom: enter name, optionally select data paths it provides
6. Device appears in equipment registry

---

## 7. Phone Companion

### Architecture

The phone companion is not a native app — it's the same React frontend served at `http://<spoke-ip>:3000/setup`, accessed via QR code.

### QR Code Content

The QR code encodes: `http://<spoke-ip>:3000/setup?token=<one-time-token>`

- The spoke's IP is determined from its network interface
- The one-time token is generated on boot, valid for 30 minutes, single-use
- Token prevents unauthorized setup if someone else scans the QR code

### Real-Time Sync

- Phone and device screen share state via WebSocket
- Phone inputs immediately reflect on the device display
- Device display shows "Setting up from another device..." with a live progress indicator showing which screen the phone is on
- Either screen can take over at any time — if the user puts down their phone and taps the device screen, control transfers seamlessly

### Responsive Layout

The setup wizard is fully responsive:
- Device screen (1080p+): centered card layout, 600px max-width content
- Phone (375-428px): full-width, larger touch targets, single-column
- Same React components, same flow, different breakpoints

---

## 8. Progressive Disclosure (Post-Setup)

After the setup wizard completes, configuration opportunities surface contextually rather than requiring the user to explore Settings:

| Trigger | Suggestion | Where it appears |
|---------|-----------|------------------|
| GPS shows stationary for 30 min | "Set up anchor watch?" | Status bar notification |
| Depth data starts flowing | "Your draft is 1.8m. Set shallow water alarm at 2.5m?" | Instrument dashboard prompt |
| New WiFi network detected | "Join *marina-guest*?" | Status bar notification |
| Firmware update available | "2 devices have firmware updates" | Settings badge + status bar icon |
| Second device connects to spoke | "Add crew member?" | Status bar notification |
| First time opening Energy app | "Link your Victron VRM account for cloud data?" | Energy app prompt |
| Sunset approaches | "Enable night mode?" (if still on manual) | Status bar notification |

These are dismissible, non-blocking, and each appears at most once. They teach the system's capabilities through real moments, not a tutorial.

---

## 9. API Endpoints

### Setup

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/setup/status` | Setup state (completed, current screen, method) |
| POST | `/api/v1/setup/companion-token` | Generate QR code token for phone companion |
| POST | `/api/v1/setup/auth` | Handle Google OAuth callback during setup |
| POST | `/api/v1/setup/boat` | Save boat profile from setup wizard |
| POST | `/api/v1/setup/equipment/confirm` | Confirm discovered equipment list |
| POST | `/api/v1/setup/complete` | Mark setup as complete, transition to home screen |
| WebSocket | `/ws/setup` | Real-time sync between device screen and phone companion |

### Discovery

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/discovery/scan` | Trigger full auto-discovery |
| GET | `/api/v1/discovery/results` | Get latest discovery results |
| GET | `/api/v1/discovery/nmea2000/devices` | List all NMEA 2000 devices (PGN 60928 + 126996) |
| GET | `/api/v1/discovery/victron/devices` | List all Victron devices |
| GET | `/api/v1/discovery/gateways` | List detected gateways |

### Settings

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/settings` | All settings |
| GET | `/api/v1/settings/:category` | Settings by category |
| GET | `/api/v1/settings/:category/:key` | Single setting |
| PUT | `/api/v1/settings/:category/:key` | Update a setting |
| POST | `/api/v1/settings/reset/:category` | Reset category to defaults |

### Network

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/network/wifi/scan` | Scan for WiFi networks |
| POST | `/api/v1/network/wifi/join` | Join a WiFi network (SSID + password) |
| DELETE | `/api/v1/network/wifi/:ssid` | Forget a saved network |
| GET | `/api/v1/network/status` | Current connectivity (WiFi, Ethernet, cellular, internet) |
| POST | `/api/v1/network/test` | Run connectivity test (ping hub, DNS, speed) |

### System

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/system/info` | Hardware, software, resource usage |
| GET | `/api/v1/system/storage` | Disk usage breakdown |
| POST | `/api/v1/system/storage/cleanup` | Run cleanup (logs, GRIB, vacuum) |
| GET | `/api/v1/system/updates/check` | Check for available updates |
| POST | `/api/v1/system/updates/install` | Install available update (with safety guards) |
| POST | `/api/v1/system/updates/rollback` | Roll back to previous version |
| POST | `/api/v1/system/restart` | Restart spoke |
| POST | `/api/v1/system/shutdown` | Shutdown spoke |
| POST | `/api/v1/system/factory-reset` | Factory reset (requires confirmation token) |
| POST | `/api/v1/system/backup` | Create backup (hub or USB) |
| POST | `/api/v1/system/restore` | Restore from backup |
| GET | `/api/v1/system/diagnostics/export` | Export diagnostic report ZIP |
| GET | `/api/v1/system/diagnostics/logs` | Gateway and system logs (paginated, filterable) |

### Calibration

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/calibration` | All calibration offsets |
| PUT | `/api/v1/calibration/:sensor` | Update calibration offset |
| POST | `/api/v1/calibration/:sensor/auto` | Trigger auto-calibration routine |

---

## 10. Hub vs Spoke

| Concern | Spoke | Hub |
|---------|-------|-----|
| Setup wizard | Runs locally, works without internet | Provides OAuth, syncs existing boat profile down |
| Settings storage | SQLite, canonical for device config | Stores backup copy of settings |
| Network management | Direct OS-level WiFi/Ethernet control | Not involved |
| Gateway management | Direct USB/TCP/UDP connection management | Not involved |
| Discovery | Runs all probes locally | Not involved |
| Updates | Pulls Docker image from registry | Hosts update metadata, release notes |
| Backup | Creates local backup, uploads to hub | Stores backups, serves restore |
| Diagnostics | All local (logs, traffic, health) | Receives diagnostic reports if shared |
| Calibration | Applied locally to data model | Synced as part of settings backup |

---

## 11. OS-Level Requirements

### WiFi Management

The Go binary needs to control the host OS WiFi stack. Implementation depends on hardware:

| Hardware | WiFi Control | Method |
|----------|-------------|--------|
| Mac Mini M4 | macOS networksetup / CoreWLAN | Shell commands via Docker host access, or companion macOS agent |
| Intel N100 | NetworkManager (Linux) | D-Bus API from Go via `godbus` |
| HALPI2 | NetworkManager (Linux) | D-Bus API from Go via `godbus` |

**Docker consideration:** The spoke container needs `--network=host` to access WiFi management. On macOS (OrbStack), WiFi control may require a lightweight host-side agent since Docker runs in a Linux VM.

### Display Management

- Brightness control: via DDC/CI over HDMI (Linux `ddcutil`), or display-specific APIs
- Display sleep: DPMS via X11/Wayland (Linux) or `caffeinate` (macOS)
- Orientation: `xrandr` (Linux) or display preferences API (macOS)

### USB Device Access

- Docker needs `--device` flags or `--privileged` for USB serial access (iKonvert, VE.Direct, SDR)
- USB hotplug events: `udev` rules (Linux) or `IOKit` (macOS)
- Device enumeration: Go `gousb` or `/sys/bus/usb/devices` (Linux)

---

## 12. Security

### Setup Security

- Setup wizard only appears when `system/setup/completed` is false
- After completion, `/setup` URL returns 404
- Phone companion token is one-time-use, expires after 30 minutes
- Google OAuth uses PKCE flow (no client secret exposed)
- All setup communication is on local network only (no internet required for setup itself, only for OAuth)

### Settings Security

- Settings API requires authentication (JWT from spoke-local auth or hub OAuth)
- Factory reset requires typing "RESET" (prevents accidental invocation)
- Shutdown/restart require confirmation dialog
- WiFi passwords stored encrypted in SQLite (AES-256-GCM, key derived from device ID)
- Diagnostic export sanitizes sensitive data (no tokens, passwords, or API keys)

---

## 13. Dependencies

| Dependency | Required for | Hard/Soft |
|------------|-------------|-----------|
| MFD Shell (6.26) | Settings app renders inside the shell | Hard |
| Protocol Adapters | Discovery engine uses all adapters for scanning | Hard |
| Data Model | Settings stored as data model paths + SQLite | Hard |
| Boat Management (6.11) | Equipment registry is populated during setup | Hard |
| Sync Engine | Hub backup/restore, profile sync | Hard |
| Alert Engine | Alerts & Notifications settings | Soft |
| Firmware Tracking (6.11b) | Firmware status shown in Gateways & Devices | Soft |
| Network Security (6.18) | Network diagnostics overlap | Soft |

---

## 14. Open Questions

1. **macOS WiFi control from Docker** — the Docker container runs in a Linux VM on macOS (OrbStack). WiFi management requires either a host-side agent or container breakout. Needs prototyping.
2. **Display brightness on Mac Mini** — DDC/CI may not work over HDMI on all monitors. Fall back to "not available" gracefully.
3. **Bluetooth management** — needed for BLE device pairing. What level of Bluetooth control does the spoke need? Just scanning (for security audit) or active pairing?
4. **Multi-display setup** — when the user has two displays (helm + nav station), how does the setup wizard handle this? Show on primary, let user configure the second display in Settings?
5. **Printer support** — is printing needed? If so, CUPS in the container? Or export-to-PDF and print from a phone/laptop? PDF seems more appropriate for a boat.
6. **Audio output** — for alarms. HDMI audio? USB speaker? Bluetooth speaker? Need to decide the audio path.
7. **Locale and i18n** — which languages at launch? English first, but the architecture should support i18n from day one.
8. **Timezone from GPS** — auto-update timezone as the boat moves across zones? Or fixed from initial setup? Boats cross timezones regularly — auto is probably right.
