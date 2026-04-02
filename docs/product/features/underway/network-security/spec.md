# Feature Spec: Network Security (6.18)

**Date:** 2026-03-31
**Status:** Draft v1
**Feature ID:** 6.18
**Category:** Underway — Safety & Security
**Depends on:** Protocol Adapters, Equipment Registry, Firmware Tracking, Data Model, MFD Shell

---

## 1. Overview

Modern boats are networked systems. A 45-foot bluewater catamaran may have 20-40 devices across 3-4 CAN buses (NMEA 2000, J1939 engine, Victron VE.Can, CZone digital switching), multiple WiFi networks, Bluetooth sensors, and IoT devices with web management interfaces. None of these systems were designed with security in mind. NMEA 2000 has no authentication, no encryption, and no access control. WiFi gateways ship with default passwords. Victron devices expose unauthenticated management interfaces. Bluetooth sensors broadcast in discoverable mode.

This is a real attack surface. GPS spoofing is documented in academic research and has been demonstrated against commercial shipping. AIS spoofing is trivial. CAN bus injection requires only a cheap USB adapter and physical access to a T-connector. A compromised gateway could inject false depth readings, manipulate heading data sent to an autopilot, or silently alter position reports.

**Network Security is "Nessus for boats"** — a one-tap security audit of the entire boat network, plus continuous monitoring for anomalies. It is both an on-demand scanner (run before departure, after a marina stay, or when something feels wrong) and an always-on watchdog that learns your boat's normal patterns and alerts on deviations.

This feature exists because the founder of this project founded OWASP.org. Security is a first-class concern, not an afterthought. No other marine software platform offers anything remotely like this. Above Deck treats the boat's network with the same rigour that Nessus, Qualys, or OpenVAS bring to enterprise IT networks — adapted for the unique protocols and constraints of marine systems.

---

## 2. User Stories

### Boat Owner

- As a boat owner, I want to run a one-tap security audit so that I know if my boat's network has vulnerabilities before I leave the marina.
- As a boat owner, I want a simple red/amber/green report card so that I can understand my boat's security posture without needing technical expertise.
- As a boat owner, I want plain-language recommendations so that I know exactly what to do to fix each finding.
- As a boat owner, I want a PDF security report so that I can share it with my insurance company, surveyor, or boat manager.
- As a boat owner, I want to be alerted if a new device appears on my NMEA 2000 bus so that I know if someone has connected something I did not authorise.
- As a boat owner, I want GPS spoofing detection so that I can trust my position data when navigating.

### Technical User

- As a technically skilled owner, I want to see every device on every bus with full identification details so that I can verify my network inventory.
- As a technically skilled owner, I want to see raw PGN traffic patterns so that I can diagnose unusual behaviour.
- As a technically skilled owner, I want to see a visual network topology map so that I understand how all my devices interconnect.
- As a technically skilled owner, I want audit logs with full forensic detail so that I can investigate incidents after the fact.

### Crew

- As a crew member, I want to see the current security status at a glance (MFD status bar indicator) so that I know if there are outstanding security alerts without navigating to a separate screen.

### Passage Planning

- As a skipper planning a passage, I want to include a network security check in my pre-departure checklist so that I do not leave with known vulnerabilities.

---

## 3. Security Scanner (On-Demand Audit)

The security scanner runs on user initiation. It performs a comprehensive audit across all reachable network layers and produces a structured report. A full scan should complete in under 60 seconds for a typical boat network.

### 3.1 WiFi Security

| Check | What It Does | Severity |
|-------|-------------|----------|
| Open networks | Detect WiFi networks with no encryption within range | Red |
| Weak encryption | Flag WEP or WPA (not WPA2/WPA3) networks that the boat is connected to | Red |
| WPS enabled | Detect WPS on the boat's own access point (vulnerable to brute force) | Amber |
| Default SSIDs | Flag factory-default SSIDs on boat networks (indicates unconfigured equipment) | Amber |
| Weak passwords | Check known-connected networks against common/default password lists | Red |
| Rogue access points | Detect APs with the same SSID as the boat's network but different BSSID (evil twin) | Red |
| Client isolation | Check if the boat AP isolates client devices from each other | Amber |
| Hidden networks | Inventory hidden SSIDs visible in the RF environment | Info |

**Implementation:** Uses the spoke's WiFi interface in monitor mode (where hardware supports it) or standard scan APIs. On macOS (Mac Mini spoke), uses CoreWLAN framework. On Linux (N100/HALPI2), uses `iw` / `wpa_supplicant` scan results.

### 3.2 NMEA 2000 Audit

| Check | What It Does | Severity |
|-------|-------------|----------|
| Device enumeration | Send ISO Request (PGN 59904) for Address Claim (PGN 60928) and Product Information (PGN 126996) from all devices on the bus | Info |
| Unknown devices | Cross-reference enumerated devices against NMEA certified product database and user's equipment registry — flag any device not in either | Amber |
| Manufacturer verification | Validate manufacturer codes in PGN 60928 against NMEA's registered manufacturer list | Amber |
| Duplicate source addresses | Detect two devices claiming the same source address (address conflict) | Red |
| Uncertified devices | Flag devices that respond to enumeration but lack valid NMEA 2000 certification fields in PGN 126996 | Amber |
| Firmware versions | Compare running firmware (from PGN 126996 software version string) against known-latest versions from firmware tracking database | Amber |
| Unresponsive devices | Devices in the equipment registry that do not respond to ISO Request — may indicate failure, disconnection, or configuration error | Amber |
| Proprietary PGN usage | Log any proprietary (manufacturer-specific) PGNs observed during the scan window | Info |

**Implementation:** Requires a bidirectional NMEA 2000 gateway (Actisense iKonvert, Yacht Devices YDNU-02, or direct CAN bus via SocketCAN). The scanner sends ISO Request PGN 59904 as a global request (destination 255) and collects responses over a 5-second window. Each responding device provides its 64-bit ISO NAME (PGN 60928) and Product Information (PGN 126996, fast-packet up to 134 bytes).

The 64-bit ISO NAME encodes:
- Manufacturer Code (11 bits) — registered with NMEA
- Device Instance (8 bits)
- Device Function (8 bits)
- Device Class (7 bits)
- System Instance (4 bits)
- Industry Group (3 bits) — 4 = Marine
- Arbitrary Address Capable (1 bit)

### 3.3 CAN Bus Access

| Check | What It Does | Severity |
|-------|-------------|----------|
| Unprotected entry points | Enumerate all CAN bus gateways (USB, WiFi, Ethernet) and check for authentication | Red |
| Gateway default credentials | Test known default username/password combinations for gateway management interfaces (NavLink2, iKonvert, YDWG-02) | Red |
| Exposed TCP/UDP ports | Scan gateway IP addresses for open ports beyond the expected data port | Amber |
| Physical access indicators | Report the number of T-connectors and backbone entry points discovered via device enumeration (more entry points = more risk) | Info |
| Write access audit | Identify which gateways allow write access to the CAN bus (bidirectional) vs read-only | Info |

### 3.4 Victron / IoT Devices

| Check | What It Does | Severity |
|-------|-------------|----------|
| Default passwords | Test Victron Cerbo GX, GX Touch, and Venus OS web interfaces for default credentials (no password by default) | Red |
| Exposed management interfaces | Scan for HTTP/HTTPS management interfaces on the local network (Cerbo GX, router admin, camera config) | Amber |
| Unencrypted protocols | Flag devices communicating over unencrypted MQTT (port 1883) vs encrypted MQTTS (port 8883) | Amber |
| MODBUS TCP exposure | Detect devices with MODBUS TCP enabled (Victron supports this — unauthenticated read/write by default) | Red |
| VRM remote access | Check if Victron Remote Management is enabled with appropriate access controls | Amber |
| SSH/Telnet exposure | Detect devices with SSH or Telnet services running | Amber |

### 3.5 Bluetooth

| Check | What It Does | Severity |
|-------|-------------|----------|
| Discoverable devices | Enumerate all Bluetooth (Classic and BLE) devices in range | Info |
| Unsecured pairing | Flag devices in pairing mode or with no PIN/passkey requirement | Amber |
| Unknown BLE devices | Cross-reference BLE devices against the equipment registry — flag unknowns | Amber |
| Legacy Bluetooth | Flag devices using Bluetooth 2.0/2.1 (weaker security than BLE 4.2+) | Amber |

### 3.6 Report Card

The scan produces a structured report with an overall grade and per-category grades.

**Grading:**

| Grade | Criteria |
|-------|----------|
| Green | No red or amber findings |
| Amber | No red findings, one or more amber findings |
| Red | One or more red findings |

**Report structure:**

```
Overall Grade: AMBER

WiFi Security:           GREEN  (3 checks passed, 0 findings)
NMEA 2000 Network:       AMBER  (1 unknown device detected)
CAN Bus Access:          RED    (NavLink2 gateway using default password)
IoT / Management:        RED    (Cerbo GX has no password set)
Bluetooth:               GREEN  (2 known devices, 0 unknowns)

Findings (ordered by severity):

[RED] NavLink2 WiFi gateway has default admin password
  → Change the admin password in the NavLink2 web interface at 10.10.10.1
  → Reference: Digital Yacht NavLink2 Quick Start Guide, page 12

[RED] Victron Cerbo GX web interface has no password
  → Set a password: Settings → General → Set Root Password
  → Reference: Victron documentation, "Venus OS Access"

[AMBER] Unknown NMEA 2000 device on address 23
  → Manufacturer code 419, device class 25, function 130
  → If this is a known device, add it to your equipment registry
  → If not, investigate — someone may have connected an unauthorised device

Generated: 2026-03-31 14:32 UTC
Boat: SV Example, MMSI 235012345
Scan duration: 34 seconds
```

### 3.7 PDF Report

The scan report is exportable as a PDF with:
- Boat identification (name, MMSI, hull ID)
- Date and time of scan
- Overall grade and per-category grades
- Complete findings with recommendations
- Device inventory table (all discovered devices with identification)
- Network topology diagram (simplified)
- Scan methodology summary (which checks were performed)
- Above Deck version and scanner version

The PDF is generated on the spoke — no internet required.

---

## 4. Continuous Monitoring (Always-On)

When enabled, the monitoring service runs as a background process within the Go binary, passively observing all data flowing through the protocol adapters. It does not inject any traffic — it is purely observational unless an on-demand scan is triggered.

### 4.1 NMEA 2000 Device Fingerprinting

Every NMEA 2000 device has a unique 64-bit ISO NAME (PGN 60928). The monitoring service:

1. **Records the initial device inventory** after the first enumeration (or on user confirmation of a clean baseline).
2. **Watches for Address Claim messages** (PGN 60928) on every received frame — these are broadcast whenever a device powers up or reclaims an address.
3. **Alerts on new devices** — any Address Claim from a NAME not in the known inventory triggers an immediate alert.
4. **Alerts on device disappearance** — if a previously-known device stops transmitting for a configurable period (default: 5 minutes for critical navigation devices, 30 minutes for environmental sensors), an alert is raised.
5. **Tracks address changes** — if a known device changes its source address (due to an address conflict), the event is logged.

### 4.2 Deep Packet Inspection

The monitoring service inspects every PGN flowing through the protocol adapters:

| Check | What It Looks For |
|-------|-------------------|
| Out-of-range values | Values outside the valid range defined in the PGN specification (e.g., depth of -5 metres, heading of 400 degrees) |
| Impossible rate of change | Values changing faster than physically possible (e.g., position jumping 10 nautical miles in 1 second, heading changing 180 degrees instantaneously) |
| Source address mismatch | A PGN type originating from a source address not typically associated with that device class (e.g., depth data from a device that claimed to be a wind sensor) |
| Unexpected PGN types | PGN types never seen before on the bus (may indicate a new device or injected traffic) |
| Malformed frames | CAN frames that do not decode to valid NMEA 2000 messages |
| Frequency anomalies | A PGN transmitting at a significantly different rate than its specification or historical baseline |

### 4.3 Baseline Learning

On initial setup (or user-initiated baseline reset), the monitoring service enters a **learning period** (configurable, default 24 hours of active use). During this period it records:

- **Device inventory** — which devices are present, their ISO NAMEs, source addresses
- **PGN catalogue** — which PGN types appear on the bus, from which source addresses
- **Transmission rates** — the typical interval between successive transmissions of each PGN type from each source
- **Value ranges** — the observed min/max/mean/stddev for each numeric field in each PGN type
- **Traffic volume** — frames per second, bytes per second, utilisation percentage

After the learning period, the baseline is stored in SQLite and used for anomaly scoring. The user can review and approve the baseline, or extend the learning period.

### 4.4 Anomaly Scoring

Each observed event is scored against the baseline:

| Score | Meaning | Action |
|-------|---------|--------|
| 0-20 | Normal | Logged, no alert |
| 21-50 | Unusual | Logged, visible in security feed |
| 51-80 | Suspicious | Alert raised (configurable severity) |
| 81-100 | Critical | Immediate alert, prominent UI notification |

Scoring factors:
- **Deviation magnitude** — how far the observation is from the baseline
- **Device trust level** — known/verified devices get lower scores for the same deviation
- **Context** — some anomalies are expected in certain conditions (e.g., rapid heading changes during tacking)
- **Correlation** — multiple simultaneous anomalies across different PGNs increase the score (coordinated attack indicator)

### 4.5 CAN Bus Replay Detection

CAN bus replay attacks involve recording legitimate traffic and retransmitting it later. Detection mechanisms:

| Method | How It Works |
|--------|-------------|
| Sequence analysis | Many PGNs contain sequence counters or timestamps. Out-of-sequence values indicate replayed traffic. |
| Timing analysis | Legitimate devices transmit at precise intervals determined by their internal clocks. Replayed traffic has different timing characteristics (jitter patterns, inter-frame gaps). |
| Value consistency | Replayed traffic contains internally consistent old data that conflicts with current conditions (e.g., replayed GPS position from 2 hours ago while other sensors show the boat has moved). |
| Duplicate detection | Identical frames from the same source address appearing more frequently than the device's known transmission rate. |

### 4.6 GPS Spoofing Detection

GPS spoofing is the most documented attack against marine systems. Detection cross-references position from multiple independent sources:

| Source | Cross-Reference |
|--------|----------------|
| Primary GPS (NMEA 2000) | Compared against all other sources |
| Secondary GPS (if installed) | Independent receiver on a different antenna |
| AIS-derived position | Own vessel position from AIS transponder's internal GPS |
| Dead reckoning | Calculated from heading + speed through water + time since last known-good position |
| Celestial (future) | Sun/star position vs claimed position/time (research — not MVP) |
| Depth correlation | Claimed position should match charted depth at that location |
| Cellular / WiFi geolocation | When available, approximate position from cell towers or known WiFi networks |

**Alert criteria:**
- Position discrepancy > 0.1 nm between any two independent sources triggers an amber alert.
- Position discrepancy > 0.5 nm triggers a red alert.
- Position suddenly jumps (> 1 nm in < 10 seconds) without corresponding speed triggers an immediate red alert.
- Thresholds are configurable.

### 4.7 Network Topology Mapping

The monitoring service builds and maintains a live map of all devices and their interconnections:

- **Nodes** — every device discovered via NMEA 2000 enumeration, WiFi scan, Bluetooth scan, and manual entry
- **Edges** — connections between devices (which bus, which gateway, which protocol)
- **Metadata** — manufacturer, model, firmware version, last seen, trust level, anomaly score
- **Change tracking** — topology changes are logged with timestamps (device added, removed, moved to different bus)

The topology is stored in the data model and rendered as an interactive graph in the UI.

### 4.8 Firmware Version Tracking

Network Security integrates with the Firmware Tracking feature (separate spec):

- Scanner reads firmware versions from PGN 126996 during enumeration
- Compares against the firmware version database (synced from hub)
- Outdated firmware is flagged as an amber finding in the scan report
- Firmware with known security vulnerabilities (if catalogued in the database) is flagged as red

### 4.9 Audit Logging

All security-relevant events are logged to a dedicated audit log in SQLite:

| Field | Description |
|-------|-------------|
| `timestamp` | UTC timestamp (nanosecond precision) |
| `event_type` | Enum: `scan_started`, `scan_completed`, `device_discovered`, `device_new`, `device_disappeared`, `anomaly_detected`, `alert_raised`, `alert_acknowledged`, `baseline_updated`, `topology_changed` |
| `severity` | Enum: `info`, `amber`, `red` |
| `source` | Which subsystem generated the event (wifi_scanner, nmea2000_monitor, bluetooth_scanner, etc.) |
| `device_id` | Reference to device in equipment registry (nullable) |
| `details` | JSON blob with event-specific data |
| `anomaly_score` | Numeric score 0-100 (nullable, only for anomaly events) |

Audit logs are retained locally on the spoke. Retention policy is configurable (default: 90 days, with automatic pruning of info-level events after 30 days). Red and amber events are never auto-pruned.

Audit log summaries sync to the hub when connected (event counts, grade history, device inventory changes — not raw logs, to conserve bandwidth).

---

## 5. Data Model

### 5.1 Device Inventory

Stored in SQLite on the spoke. Syncs to hub.

```
security/
  devices/
    {device_id}/
      name                    — user-assigned name (e.g., "Helm Chartplotter")
      manufacturer_code       — NMEA manufacturer code (11-bit, from PGN 60928)
      manufacturer_name       — resolved name (e.g., "Raymarine")
      device_class            — NMEA device class code
      device_function         — NMEA device function code
      iso_name                — full 64-bit ISO NAME (hex string)
      source_address          — current NMEA 2000 source address
      product_code            — from PGN 126996
      model_id                — from PGN 126996 (string, e.g., "Axiom2 Pro 16")
      software_version        — from PGN 126996
      model_version           — from PGN 126996
      serial_number           — from PGN 126996
      certification_level     — from PGN 126996
      bus                     — which bus (nmea2000, j1939, vecan, czone, wifi, bluetooth)
      transport               — how the spoke communicates with it (usb, tcp, udp, ble)
      gateway                 — which gateway this device is reached through
      trust_level             — enum: verified, known, unknown, suspicious
      first_seen              — timestamp
      last_seen               — timestamp
      in_equipment_registry   — boolean (linked to boat management equipment record)
      anomaly_score           — current rolling anomaly score (0-100)
```

### 5.2 Scan Results

```
security/
  scans/
    {scan_id}/
      started_at              — timestamp
      completed_at            — timestamp
      duration_seconds        — integer
      overall_grade           — enum: green, amber, red
      wifi_grade              — enum: green, amber, red
      nmea2000_grade          — enum: green, amber, red
      can_access_grade        — enum: green, amber, red
      iot_grade               — enum: green, amber, red
      bluetooth_grade         — enum: green, amber, red
      findings_count_red      — integer
      findings_count_amber    — integer
      findings_count_info     — integer
      findings/
        {finding_id}/
          category            — enum: wifi, nmea2000, can_access, iot, bluetooth
          severity            — enum: red, amber, info
          title               — short description
          detail              — full description
          recommendation      — plain-language fix instruction
          reference           — link or document reference
          device_id           — nullable reference to device
          resolved            — boolean (user can mark as resolved)
          resolved_at         — timestamp
```

### 5.3 Baselines

```
security/
  baselines/
    {baseline_id}/
      created_at              — timestamp
      learning_duration       — duration
      approved                — boolean
      approved_at             — timestamp
      device_count            — integer
      pgn_catalogue/
        {pgn_number}/
          source_addresses    — list of addresses that transmit this PGN
          mean_interval_ms    — average time between transmissions
          stddev_interval_ms  — standard deviation of interval
          fields/
            {field_name}/
              min             — observed minimum
              max             — observed maximum
              mean            — observed mean
              stddev          — observed standard deviation
      traffic_stats/
          frames_per_second   — average
          bytes_per_second    — average
          bus_utilisation     — percentage
```

### 5.4 Anomaly Events

```
security/
  anomalies/
    {anomaly_id}/
      timestamp               — UTC
      anomaly_type            — enum: new_device, device_disappeared, value_out_of_range,
                                      impossible_rate_of_change, source_mismatch,
                                      unexpected_pgn, frequency_anomaly, replay_detected,
                                      gps_spoofing, rogue_ap, topology_change
      score                   — 0-100
      device_id               — nullable
      pgn                     — nullable (for PGN-related anomalies)
      details                 — JSON blob
      acknowledged            — boolean
      acknowledged_by         — user ID (nullable)
      acknowledged_at         — timestamp (nullable)
```

### 5.5 SQLite Tables

```sql
CREATE TABLE security_devices (
    id              TEXT PRIMARY KEY,
    boat_id         TEXT NOT NULL,
    name            TEXT,
    manufacturer_code INTEGER,
    manufacturer_name TEXT,
    device_class    INTEGER,
    device_function INTEGER,
    iso_name        TEXT,
    source_address  INTEGER,
    product_code    INTEGER,
    model_id        TEXT,
    software_version TEXT,
    model_version   TEXT,
    serial_number   TEXT,
    certification_level INTEGER,
    bus             TEXT NOT NULL,
    transport       TEXT,
    gateway_id      TEXT,
    trust_level     TEXT NOT NULL DEFAULT 'unknown',
    first_seen      TEXT NOT NULL,
    last_seen       TEXT NOT NULL,
    in_equipment_registry INTEGER NOT NULL DEFAULT 0,
    anomaly_score   REAL NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE security_scans (
    id              TEXT PRIMARY KEY,
    boat_id         TEXT NOT NULL,
    started_at      TEXT NOT NULL,
    completed_at    TEXT,
    duration_seconds INTEGER,
    overall_grade   TEXT,
    wifi_grade      TEXT,
    nmea2000_grade  TEXT,
    can_access_grade TEXT,
    iot_grade       TEXT,
    bluetooth_grade TEXT,
    findings_red    INTEGER NOT NULL DEFAULT 0,
    findings_amber  INTEGER NOT NULL DEFAULT 0,
    findings_info   INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE security_findings (
    id              TEXT PRIMARY KEY,
    scan_id         TEXT NOT NULL REFERENCES security_scans(id),
    category        TEXT NOT NULL,
    severity        TEXT NOT NULL,
    title           TEXT NOT NULL,
    detail          TEXT NOT NULL,
    recommendation  TEXT NOT NULL,
    reference       TEXT,
    device_id       TEXT REFERENCES security_devices(id),
    resolved        INTEGER NOT NULL DEFAULT 0,
    resolved_at     TEXT,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE security_baselines (
    id              TEXT PRIMARY KEY,
    boat_id         TEXT NOT NULL,
    created_at      TEXT NOT NULL,
    learning_duration_seconds INTEGER NOT NULL,
    approved        INTEGER NOT NULL DEFAULT 0,
    approved_at     TEXT,
    device_count    INTEGER NOT NULL,
    pgn_catalogue   TEXT NOT NULL,  -- JSON
    traffic_stats   TEXT NOT NULL,  -- JSON
    is_active       INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE security_anomalies (
    id              TEXT PRIMARY KEY,
    boat_id         TEXT NOT NULL,
    timestamp       TEXT NOT NULL,
    anomaly_type    TEXT NOT NULL,
    score           REAL NOT NULL,
    device_id       TEXT REFERENCES security_devices(id),
    pgn             INTEGER,
    details         TEXT NOT NULL,  -- JSON
    acknowledged    INTEGER NOT NULL DEFAULT 0,
    acknowledged_by TEXT,
    acknowledged_at TEXT,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE security_audit_log (
    id              TEXT PRIMARY KEY,
    boat_id         TEXT NOT NULL,
    timestamp       TEXT NOT NULL,
    event_type      TEXT NOT NULL,
    severity        TEXT NOT NULL,
    source          TEXT NOT NULL,
    device_id       TEXT,
    details         TEXT NOT NULL,  -- JSON
    anomaly_score   REAL,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Indexes
CREATE INDEX idx_security_devices_boat ON security_devices(boat_id);
CREATE INDEX idx_security_devices_bus ON security_devices(bus);
CREATE INDEX idx_security_scans_boat ON security_scans(boat_id);
CREATE INDEX idx_security_findings_scan ON security_findings(scan_id);
CREATE INDEX idx_security_findings_severity ON security_findings(severity);
CREATE INDEX idx_security_anomalies_boat_time ON security_anomalies(boat_id, timestamp);
CREATE INDEX idx_security_anomalies_type ON security_anomalies(anomaly_type);
CREATE INDEX idx_security_anomalies_score ON security_anomalies(score);
CREATE INDEX idx_security_audit_log_boat_time ON security_audit_log(boat_id, timestamp);
CREATE INDEX idx_security_audit_log_type ON security_audit_log(event_type);
```

---

## 6. UI/UX

All security UI renders inside the MFD shell. Dark mode is the default. The blueprint aesthetic applies — fine lines, precise spacing, Tabler icons, the accent colour palette on deep navy backgrounds.

### 6.1 Security Dashboard (MFD App)

The security app appears in the MFD app grid with a shield icon. The icon badge shows the current overall grade colour (green/amber/red).

**Dashboard layout (single-pane view):**

```
┌─────────────────────────────────────────────────────────────────┐
│  NETWORK SECURITY                              Grade: ● GREEN  │
├───────────┬───────────┬───────────┬───────────┬─────────────────┤
│  WiFi     │  NMEA2000 │  CAN Bus  │  IoT      │  Bluetooth      │
│  ● GREEN  │  ● GREEN  │  ● AMBER  │  ● GREEN  │  ● GREEN        │
├───────────┴───────────┴───────────┴───────────┴─────────────────┤
│                                                                 │
│  [  Run Security Scan  ]                    Last scan: 2h ago   │
│                                                                 │
├─────────────────────────────────┬───────────────────────────────┤
│  Active Alerts (2)              │  Device Inventory             │
│                                 │                               │
│  ▲ Unknown device on addr 23    │  ┌─ NMEA 2000 (14 devices)   │
│    Detected 12 min ago          │  │  ├─ Raymarine Axiom2       │
│                                 │  │  ├─ B&G Zeus3              │
│  ▲ NavLink2 default password    │  │  ├─ Airmar DST810          │
│    From scan 2h ago             │  │  └─ ...                    │
│                                 │  ├─ WiFi (3 devices)          │
│                                 │  ├─ Bluetooth (2 devices)     │
│                                 │  └─ IoT (4 devices)           │
├─────────────────────────────────┴───────────────────────────────┤
│  Monitoring: ● Active    Baseline: Approved (72h learning)      │
│  Anomaly rate: 0.3/hr    Audit log: 1,247 events (30 days)      │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Network Topology Visualisation

An interactive graph rendered with a force-directed layout:

- **Nodes** — circles representing each device, coloured by trust level (green = verified, blue = known, amber = unknown, red = suspicious)
- **Edges** — lines representing bus connections, styled by bus type (solid = NMEA 2000, dashed = WiFi, dotted = Bluetooth)
- **Gateway nodes** — larger circles representing gateways that bridge between buses
- **Spoke node** — central node representing the Above Deck spoke
- **Hover** — shows device details (manufacturer, model, firmware, last seen, anomaly score)
- **Click** — opens device detail panel
- **Layout** — devices grouped by bus, with buses arranged around the central spoke node

### 6.3 Alert Feed

A chronological feed of security events, filterable by:
- Severity (red, amber, info)
- Category (wifi, nmea2000, can_access, iot, bluetooth, anomaly)
- Time range
- Acknowledged / unacknowledged

Each alert shows:
- Severity indicator (coloured dot)
- Title
- Timestamp (relative and absolute)
- Device reference (if applicable)
- Anomaly score (if applicable)
- Acknowledge button
- Detail expansion

### 6.4 Scan Report View

After a scan completes, the report view shows:
- Overall grade (large, prominent)
- Per-category grade cards
- Findings list grouped by severity (red first)
- Each finding expandable to show detail, recommendation, and reference
- "Export PDF" button
- "Compare to previous scan" toggle (shows delta — new findings, resolved findings)

### 6.5 MFD Status Bar Integration

The persistent MFD status bar includes a small shield icon that:
- Shows green/amber/red based on the current security state
- Pulses when a new security alert is raised
- Tapping opens the security dashboard

---

## 7. API Endpoints

All endpoints require authentication. Spoke-only endpoints are marked.

### 7.1 Scanner

```
POST   /api/v1/security/scans                    Start a new scan (spoke only)
GET    /api/v1/security/scans                     List scan history
GET    /api/v1/security/scans/:id                 Get scan result with findings
GET    /api/v1/security/scans/:id/report.pdf      Download PDF report (spoke only)
GET    /api/v1/security/scans/latest               Get most recent scan result
```

### 7.2 Devices

```
GET    /api/v1/security/devices                   List all discovered devices
GET    /api/v1/security/devices/:id               Get device detail
PATCH  /api/v1/security/devices/:id               Update device (name, trust_level)
POST   /api/v1/security/devices/:id/verify        Mark device as verified
DELETE /api/v1/security/devices/:id               Remove device from inventory
```

### 7.3 Monitoring

```
GET    /api/v1/security/monitoring/status          Get monitoring status (spoke only)
POST   /api/v1/security/monitoring/start           Start monitoring (spoke only)
POST   /api/v1/security/monitoring/stop            Stop monitoring (spoke only)
GET    /api/v1/security/baselines                  List baselines
GET    /api/v1/security/baselines/active           Get active baseline
POST   /api/v1/security/baselines                  Start new baseline learning (spoke only)
POST   /api/v1/security/baselines/:id/approve      Approve a baseline
```

### 7.4 Anomalies and Alerts

```
GET    /api/v1/security/anomalies                  List anomalies (filterable)
GET    /api/v1/security/anomalies/:id              Get anomaly detail
POST   /api/v1/security/anomalies/:id/acknowledge  Acknowledge an anomaly
GET    /api/v1/security/alerts                     List active alerts
```

### 7.5 Audit Log

```
GET    /api/v1/security/audit-log                  Query audit log (filterable)
GET    /api/v1/security/audit-log/stats            Aggregate stats (events by type, severity over time)
```

### 7.6 Topology

```
GET    /api/v1/security/topology                   Get current network topology graph (nodes + edges)
```

### 7.7 WebSocket

```
WS     /api/v1/security/ws                         Real-time security events stream (spoke only)
```

Events pushed via WebSocket:
- `device.new` — new device discovered
- `device.disappeared` — known device not responding
- `anomaly.detected` — anomaly scored above threshold
- `scan.started` — scan initiated
- `scan.completed` — scan finished with results summary
- `alert.raised` — new alert
- `monitoring.status` — monitoring state change

---

## 8. Hub vs Spoke

### Spoke (On-Boat)

All scanning and monitoring runs exclusively on the spoke. This is a hard requirement — the scanner needs direct access to the boat's CAN bus, WiFi, and Bluetooth interfaces.

| Capability | Runs On | Why |
|------------|---------|-----|
| WiFi scanning | Spoke | Requires the spoke's WiFi radio |
| NMEA 2000 enumeration | Spoke | Requires bidirectional gateway or direct CAN bus |
| CAN bus access audit | Spoke | Requires local network access to gateways |
| IoT device scanning | Spoke | Requires local network access |
| Bluetooth scanning | Spoke | Requires the spoke's Bluetooth radio |
| Continuous monitoring | Spoke | Real-time stream processing on protocol adapter data |
| Baseline learning | Spoke | Requires continuous local observation |
| Anomaly detection | Spoke | Requires real-time comparison against local baseline |
| PDF generation | Spoke | Must work offline |
| Audit logging | Spoke | All events logged locally |

### Hub (Cloud)

The hub does not perform any scanning or monitoring. It receives synced data and provides value-added services:

| Capability | Runs On | Why |
|------------|---------|-----|
| Scan report history | Hub | Synced from spoke, viewable from browser |
| Device inventory (read-only) | Hub | Synced from spoke, viewable remotely |
| Grade history / trends | Hub | Track security posture over time |
| NMEA certified product database | Hub | Maintained centrally, synced to spokes |
| Firmware version database | Hub | Crawled by hub, synced to spokes |
| Cross-fleet analytics (future) | Hub | Anonymised, opt-in aggregate data |

### Sync Behaviour

| Data | Direction | Frequency | Notes |
|------|-----------|-----------|-------|
| Scan results (summary) | Spoke to Hub | On connect | Grades, finding counts, timestamps |
| Scan findings | Spoke to Hub | On connect | Full finding details |
| Device inventory | Spoke to Hub | On connect | All device records |
| Anomaly summaries | Spoke to Hub | On connect | Counts by type and severity, not raw events |
| NMEA product database | Hub to Spoke | Periodic | Used for unknown device identification |
| Firmware version database | Hub to Spoke | Periodic | Used for firmware audit checks |
| Audit log | Spoke only | Never synced | Raw logs stay on the boat (privacy, bandwidth) |

---

## 9. Dependencies

### Internal Dependencies

| Dependency | What This Feature Needs |
|------------|------------------------|
| **Protocol Adapters** | Access to raw NMEA 2000 frames (via iKonvert/NavLink2/SocketCAN adapter). Ability to send ISO Request PGN 59904 (requires bidirectional gateway). Access to parsed PGN data stream for monitoring. |
| **Equipment Registry** | Cross-reference discovered NMEA 2000 devices against user's registered equipment. Link security device records to equipment records. |
| **Firmware Tracking** | Firmware version database for comparing discovered versions against known-latest. Known vulnerability data (if catalogued). |
| **Data Model** | Security data paths under `security/` namespace. Device records, scan results, baselines, anomalies. |
| **MFD Shell** | Render security dashboard, topology view, and alert feed as an MFD app. Status bar integration for security grade indicator. |
| **Alert Engine** | Route security alerts through the platform's alert system (push notifications, on-screen alerts, escalation). |
| **Monitoring Service** | Integration with the platform's monitoring service for threshold-based alerting rules. |

### External Dependencies

| Dependency | What It Provides | Notes |
|------------|-----------------|-------|
| **NMEA Manufacturer Database** | Registered manufacturer codes (11-bit) mapped to company names | Public data from NMEA, maintained in hub database |
| **NMEA Certified Product Database** | List of NMEA 2000 certified products with product codes | Requires periodic scraping or manual maintenance |
| **WiFi scanning capability** | OS-level WiFi scan APIs | CoreWLAN (macOS), iw/wpa_supplicant (Linux) |
| **Bluetooth scanning capability** | OS-level BLE scan APIs | CoreBluetooth (macOS), BlueZ (Linux) |
| **PDF generation library** | Generate scan report PDFs on the spoke | Go library (e.g., `go-pdf`, `gofpdf`, or similar) |

### Hardware Requirements

The security scanner has varying capability depending on the spoke hardware and connected gateways:

| Hardware | WiFi Scan | BLE Scan | NMEA 2000 Enum | CAN Bus Direct |
|----------|-----------|----------|----------------|----------------|
| Mac Mini M4 | Full (CoreWLAN) | Full (CoreBluetooth) | Via gateway | No (no SocketCAN) |
| Intel N100 (Linux) | Full (iw) | Full (BlueZ) | Via gateway or SocketCAN | Yes (with USB-CAN adapter) |
| HALPI2 (Linux + CAN HAT) | Full (iw) | Full (BlueZ) | Via built-in CAN or gateway | Yes (built-in) |

**Minimum requirement:** A bidirectional NMEA 2000 gateway (iKonvert, YDNU-02) for NMEA 2000 scanning. Without a gateway, the NMEA 2000 scanner module is disabled and the scan report notes the gap.

---

## 10. Implementation Notes

### Phased Delivery

**Phase 1 — Scanner MVP:**
- NMEA 2000 device enumeration via PGN 59904/60928/126996
- Device inventory with trust levels
- Unknown device detection
- Basic scan report (on-screen, no PDF yet)
- Security dashboard in MFD

**Phase 2 — WiFi and IoT Scanning:**
- WiFi network scanning and security checks
- Gateway default credential checks
- Victron/IoT management interface discovery
- PDF report generation
- Report card grading

**Phase 3 — Continuous Monitoring:**
- Baseline learning
- Anomaly scoring
- Device fingerprinting and appearance/disappearance alerts
- Deep packet inspection
- Audit logging

**Phase 4 — Advanced Detection:**
- CAN bus replay detection
- GPS spoofing detection
- Network topology visualisation
- Bluetooth scanning
- Hub sync of security data

### Security of the Scanner Itself

The scanner must not introduce vulnerabilities:

- Default credential checks use only known-default passwords — never brute force
- WiFi scanning is passive (listen mode) — never attempts to connect to or deauth networks
- NMEA 2000 enumeration uses only ISO-standard request PGNs — never sends proprietary or unexpected commands
- All scan results are stored locally and encrypted at rest (SQLite via SQLCipher)
- The scanner never transmits boat network details to the hub without explicit user consent
- No data leaves the spoke unless the user has enabled hub sync for security data

### Performance Constraints

- On-demand scan: < 60 seconds for a typical boat network
- Continuous monitoring CPU: < 5% of a single core on N100/Mac Mini M4
- Memory: < 50MB for monitoring service (baseline + active state)
- Audit log disk: < 100MB per year at typical boat traffic levels
- Monitoring must never interfere with protocol adapter throughput — security processing runs in a separate goroutine pool

---

## 11. Open Questions

- **NMEA 2000 certification:** Does sending ISO Request PGN 59904 require Above Deck to be a certified NMEA 2000 device, or is this acceptable when done through a gateway that handles address claiming?
- **WiFi monitor mode:** Not all WiFi chipsets support monitor mode. Should the scanner fall back to passive scan-only mode, and how does this affect rogue AP detection?
- **Anomaly scoring tuning:** Initial scoring weights will need calibration against real-world boat data. How do we collect feedback from early users without compromising their privacy?
- **CAN bus write protection:** Should the spoke offer an option to act as a CAN bus firewall (filtering/blocking suspicious frames)? This conflicts with the "do no harm" / observe-only principle but could be valuable as an opt-in safety feature.
- **Integration with the Engineer AI agent:** Should the Engineer agent have access to security scan results and anomaly data for natural-language security queries ("Engineer, is my network secure?", "What was that alert about?")?
