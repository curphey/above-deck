# Remote Monitoring — Feature Specification

**Feature:** 6.20 Remote Monitoring
**Tier:** 3 — Underway Experience
**Status:** Draft
**Date:** 2026-03-31

---

## 1. Overview

Remote monitoring lets an owner check on their boat from anywhere with an internet connection. The spoke (on-board computer) continuously records instrument data and pushes it to the hub via the sync engine. The hub serves that data to authenticated users through a mobile-optimised web dashboard.

This covers two distinct use cases:

1. **Boat left unattended** — the boat is on a mooring or in a marina. The owner wants to know it has not moved, the bilge is dry, the batteries are charged, and the temperature is normal. Alerts fire if something is wrong.
2. **Crew ashore, boat at anchor** — the boat is at anchor with systems running. Crew ashore want to check anchor position, battery state, and cabin temperature. They want an alert if the anchor drags.

The spoke must be powered and have internet connectivity (marina WiFi, 4G/5G router, or satellite) for remote monitoring to work. When connectivity drops, the spoke buffers data locally and uploads the backlog when reconnected.

---

## 2. User Stories

### Real-time monitoring
- As a boat owner, I want to see my boat's current position, battery state, bilge status, and cabin temperature from my phone so I can check on it while away.
- As a boat owner at anchor ashore, I want to see real-time instrument data (wind, depth, position) from my phone so I can assess conditions without going back to the boat.

### Historical trends
- As a boat owner, I want to see battery SOC over the last 7 days as a graph so I can see if the solar is keeping up with standby loads.
- As a boat owner, I want to see bilge pump activation history so I can spot a developing leak before it becomes serious.
- As a boat owner, I want to see temperature trends (cabin, engine room, fridge, freezer) so I can detect HVAC or refrigeration problems.

### Alerts
- As a boat owner, I want to receive a push notification if the bilge pump runs more than a configurable number of times per hour so I know about potential flooding.
- As a boat owner, I want an alert if battery SOC drops below a configurable threshold so I can arrange shore power or a visit.
- As a boat owner, I want an alert if cabin temperature goes outside a configurable range so I can detect HVAC failure or freezing conditions.
- As a boat owner, I want to configure which alerts go to which notification channels (push, email, SMS) so I can control urgency levels.

### Geofencing
- As a boat owner, I want an alert if my boat moves outside a defined geofence so I know if it has broken free of its mooring or been moved without authorisation.
- As a boat owner, I want to set up a geofence with a single tap (centred on current position, configurable radius) so setup is trivially easy.

### Access control
- As a boat owner, I want to grant read-only access to family members so they can check on the boat but not change settings.
- As a boat owner, I want to grant temporary access to a marine technician so they can see instrument data while diagnosing a problem remotely.
- As a boat owner, I want to revoke access at any time so I maintain control over who can see my boat's data.

### Offline
- As a boat owner, I want the spoke to buffer all data locally when it has no internet so nothing is lost during connectivity gaps.
- As a boat owner, I want to see when the spoke last synced so I know how current the data is.

---

## 3. Real-Time Data

### Data available remotely

All instrument data that the spoke captures is available remotely, subject to sync frequency and bandwidth. The dashboard organises data into logical groups:

| Group | Data points |
|-------|-------------|
| Position | Latitude, longitude, SOG, COG, GPS accuracy |
| Wind | True wind speed/direction, apparent wind speed/angle |
| Depth | Depth below transducer, depth below keel |
| Power | Battery SOC (%), voltage, solar input (W), load (W), shore power status, charger status |
| Tanks | Fuel level (%), water level (%), holding tank level (%) |
| Bilge | Pump status (on/off), pump run count, total run time |
| Temperature | Cabin, engine room, fridge, freezer, outside air, water |
| Engine | RPM, hours, coolant temp, oil pressure (if running) |
| Environment | Barometric pressure, humidity |
| Anchor | Anchor set position, current position, drag distance, swing radius |

### Data freshness

The dashboard always displays the timestamp of the most recent data update. Data freshness depends on connectivity:

| Connection type | Typical update frequency | Priority data latency |
|----------------|------------------------|-----------------------|
| Marina WiFi | Every 30 seconds | < 5 seconds for alerts |
| 4G/5G | Every 60 seconds | < 10 seconds for alerts |
| Satellite (Starlink) | Every 60 seconds | < 15 seconds for alerts |
| Satellite (Iridium) | Every 15-60 minutes | < 5 minutes for alerts |
| No connection | No updates | Buffered locally |

The spoke adjusts its sync frequency based on detected connection type and available bandwidth.

---

## 4. Historical Trends

### Time-series graphs

The hub stores time-series instrument data uploaded from the spoke. Users can view historical trends for any data point over configurable time ranges.

| Graph | Default range | Resolution |
|-------|---------------|------------|
| Battery SOC | 7 days | 15-minute averages |
| Battery voltage | 7 days | 15-minute averages |
| Solar generation | 7 days | Hourly totals (Wh) |
| Load consumption | 7 days | Hourly totals (Wh) |
| Bilge pump activity | 30 days | Per-activation events |
| Cabin temperature | 7 days | 15-minute averages |
| Engine room temperature | 7 days | 15-minute averages |
| Fridge/freezer temperature | 7 days | 15-minute averages |
| Barometric pressure | 7 days | 15-minute averages |
| Wind speed | 48 hours | 5-minute averages |
| Depth | 48 hours | 5-minute averages |

Users can zoom and pan on all graphs. Data is stored on the hub using TimescaleDB (PostgreSQL extension) for efficient time-range queries and automatic data retention policies.

### Data retention

| Age | Resolution |
|-----|------------|
| 0-30 days | Full resolution (every sync point) |
| 30-365 days | 15-minute averages |
| 1-5 years | Hourly averages |
| > 5 years | Daily averages |

Downsampling runs as a scheduled job on the hub. Raw data is always preserved on the spoke (subject to local disk space) and in Litestream backups.

---

## 5. Alerts

### Alert configuration

Each alert rule specifies:

| Field | Description |
|-------|-------------|
| Data point | Which instrument value to monitor (e.g. `battery_soc`, `bilge_pump_count`) |
| Condition | Comparison operator: `<`, `>`, `=`, `!=`, `change_by` |
| Threshold | The value that triggers the alert |
| Duration | How long the condition must persist before alerting (debounce). Prevents spurious alerts from brief spikes. |
| Channels | Which notification channels to use: push, email, SMS |
| Cooldown | Minimum time between repeat alerts for the same condition |
| Enabled | On/off toggle |

### Default alert rules

The system ships with sensible defaults that the owner can customise or disable:

| Alert | Default threshold | Default channels |
|-------|-------------------|------------------|
| Geofence breach | 50m from set position | Push + SMS |
| Battery SOC low | < 30% | Push |
| Battery SOC critical | < 15% | Push + SMS |
| Bilge pump frequent | > 3 activations in 1 hour | Push |
| Bilge pump continuous | Running > 5 minutes continuously | Push + SMS |
| Cabin temperature high | > 40C | Push |
| Cabin temperature low | < 5C | Push |
| Shore power lost | Disconnected for > 10 minutes | Push |
| Anchor drag | Position > configured radius from anchor set point | Push + SMS |
| Engine room temperature | > 60C | Push + SMS |
| Fridge temperature | > 10C for > 30 minutes | Push |

### Alert evaluation

Alerts are evaluated in two places:

1. **Spoke** — the monitoring service evaluates alert rules locally against live instrument data. This catches issues immediately even if the hub is unreachable. Local alerts trigger the on-board alarm (audio/visual). If internet is available, the spoke pushes the alert to the hub for remote notification.

2. **Hub** — the hub evaluates geofence and data-freshness alerts (e.g. "spoke has not reported in X hours"). The hub handles push notification delivery, email, and SMS.

### Notification channels

| Channel | Technology | Latency |
|---------|-----------|---------|
| Push notification | Web Push API (service worker) | Seconds |
| Email | Transactional email service (e.g. Resend, Postmark) | Seconds to minutes |
| SMS | Twilio or similar | Seconds |
| On-board alarm | Local audio/visual via spoke | Immediate |

SMS is the fallback for critical alerts because it works when the owner's phone has no data connection.

---

## 6. Access Control

### Access roles

| Role | Permissions | Use case |
|------|-------------|----------|
| Owner | Full access. Configure alerts, grant/revoke access, view all data, modify settings. | Boat owner |
| Crew | View all data. Receive alerts. Cannot modify alert rules or grant access. | Active crew members |
| Technician | View all data. Time-limited access (auto-expires). Cannot modify settings. | Marine engineer diagnosing remotely |
| Family | View position and key status (battery, bilge, temperature). No instrument detail. Cannot modify anything. | Partner, parents checking the boat is safe |

### Access grants

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| boat_id | UUID | FK to boat |
| granted_by | UUID | FK to user (owner) |
| granted_to | UUID | FK to user (or null for invite link) |
| invite_email | TEXT | Email for pending invites (null after accepted) |
| role | TEXT | `owner`, `crew`, `technician`, `family` |
| expires_at | TIMESTAMP | Auto-expiry (null for permanent access) |
| status | TEXT | `pending`, `active`, `revoked`, `expired` |
| created_at | TIMESTAMP | When access was granted |
| revoked_at | TIMESTAMP | When access was revoked (null if active) |

### Granting access

1. Owner enters the invitee's email and selects a role.
2. System sends an email invitation with a one-time link.
3. Invitee signs in (Google OAuth) and gains access.
4. For technician access, the owner sets an expiry (e.g. 48 hours, 7 days).
5. Owner can revoke any grant at any time from the access management screen.

Access grants are managed on the hub. The spoke does not need to know about remote access grants — it pushes data to the hub, and the hub enforces access control when serving data to authenticated users.

---

## 7. Geofencing

### How it works

1. Owner taps "Set Geofence" on the dashboard. The current GPS position becomes the centre point.
2. Owner sets a radius (default 50m, configurable from 20m to 500m).
3. The spoke evaluates the boat's position against the geofence on every GPS fix.
4. If the position exceeds the radius for more than 60 seconds (debounce to prevent GPS jitter from triggering false alarms), an alert fires.
5. The alert includes: current position, distance from centre, bearing from centre, and a map link.

### Geofence vs Anchor Watch

Geofencing and anchor watch serve different purposes:

| Aspect | Geofence (Remote Monitoring) | Anchor Watch (6.16) |
|--------|------------------------------|---------------------|
| Purpose | Alert owner that unattended boat has moved | Alert crew that anchor is dragging |
| User location | Owner is away from the boat | Crew is on board (or nearby) |
| Notification | Push/SMS to owner's phone | On-board alarm + push |
| Radius | Larger (50-500m, accounts for GPS drift on mooring) | Smaller (computed from depth + scope) |
| Intelligence | Simple position check | Depth, wind, current, drag vector analysis |

Both can be active simultaneously. They are independent systems that happen to use GPS position.

### Data model

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| boat_id | UUID | FK to boat |
| centre_lat | REAL | Centre latitude |
| centre_lng | REAL | Centre longitude |
| radius_m | REAL | Radius in metres |
| active | BOOLEAN | Whether geofence is currently active |
| created_by | UUID | FK to user |
| created_at | TIMESTAMP | When set |
| deactivated_at | TIMESTAMP | When deactivated (null if active) |

---

## 8. Data Model

### Notification preferences

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to user |
| boat_id | UUID | FK to boat |
| alert_type | TEXT | Alert type identifier (e.g. `battery_low`, `geofence`, `bilge_frequent`) |
| channel_push | BOOLEAN | Send push notification |
| channel_email | BOOLEAN | Send email |
| channel_sms | BOOLEAN | Send SMS |
| enabled | BOOLEAN | Whether this alert is active for this user |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

### Alert rules

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| boat_id | UUID | FK to boat |
| name | TEXT | Human-readable name |
| data_point | TEXT | Instrument data path (e.g. `power.battery.soc`) |
| condition | TEXT | `lt`, `gt`, `eq`, `neq`, `change_by` |
| threshold | REAL | Threshold value |
| duration_seconds | INTEGER | Debounce duration |
| cooldown_seconds | INTEGER | Minimum time between repeat alerts |
| channels | TEXT | JSON array of channels: `["push", "email", "sms"]` |
| enabled | BOOLEAN | On/off toggle |
| is_default | BOOLEAN | Whether this is a system-provided default rule |
| created_by | UUID | FK to user |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |
| sync_version | INTEGER | For sync |

### Alert history

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| boat_id | UUID | FK to boat |
| alert_rule_id | UUID | FK to alert rule |
| triggered_at | TIMESTAMP | When the alert condition was met |
| resolved_at | TIMESTAMP | When the condition cleared (null if unresolved) |
| value | REAL | The instrument value that triggered the alert |
| threshold | REAL | The threshold at time of trigger |
| channels_sent | TEXT | JSON array of channels actually notified |
| acknowledged_by | UUID | FK to user who acknowledged (null if unacknowledged) |
| acknowledged_at | TIMESTAMP | When acknowledged |
| notes | TEXT | User notes on the alert |

### Spoke sync status

| Column | Type | Description |
|--------|------|-------------|
| boat_id | UUID | FK to boat |
| last_sync_at | TIMESTAMP | Last successful sync to hub |
| last_position_at | TIMESTAMP | Last position report received |
| last_instruments_at | TIMESTAMP | Last instrument data received |
| connection_type | TEXT | `wifi`, `4g`, `satellite`, `unknown` |
| sync_queue_depth | INTEGER | Number of items pending sync |
| online | BOOLEAN | Whether the spoke is currently connected |

---

## 9. UI/UX

### Mobile-optimised dashboard

Remote monitoring is primarily used on mobile phones. The dashboard is designed for small screens and one-handed operation.

#### Status overview (landing screen)

A single-screen summary showing:

- **Boat name and position** — mini-map showing boat location, last updated timestamp
- **Status indicator** — green (all normal), amber (advisory), red (alert active)
- **Key metrics cards** — battery SOC, bilge status, cabin temperature, wind speed. Each card shows current value, trend arrow (up/down/stable), and mini sparkline of last 24 hours.
- **Active alerts** — if any alerts are firing, they appear at the top with dismiss/acknowledge buttons
- **Last sync** — how long ago the spoke last reported, with connection type indicator

Tap any metric card to expand to the full historical graph.

#### Position view

- Full-screen map showing boat position
- Geofence circle (if active) with boat marker
- Track history (last 24 hours) showing any movement
- Tap to set/modify geofence

#### Instrument detail

- Dedicated screens for each data group (power, tanks, temperature, wind, engine)
- Current values with historical graph below
- Configurable time range (1 hour, 6 hours, 24 hours, 7 days, 30 days)
- Pinch to zoom on graphs

#### Alert management

- List of all alert rules with on/off toggles
- Tap to edit thresholds, channels, cooldown
- Alert history with timestamps and outcomes
- Test button to verify notification delivery

#### Access management (owner only)

- List of users with access, their roles, and status
- Invite new user (email + role + optional expiry)
- Revoke access (tap, confirm)

### Desktop view

The same dashboard is accessible from a desktop browser with a wider layout:

- Side panel navigation (position, power, tanks, temperature, alerts, access)
- Larger graphs with more data points visible
- Multi-metric views (e.g. battery SOC and solar generation on the same graph)

---

## 10. Architecture

### Data flow

```
Instruments ──► Spoke (Go binary)
                  │
                  ├── Monitoring service evaluates alert rules locally
                  │     └── Local alarm if triggered
                  │
                  ├── Data stored in SQLite (time-series)
                  │
                  └── Sync engine pushes to hub
                        │
                        ├── Alerts first (< 5 seconds if online)
                        ├── Position/status second
                        └── Bulk instrument data third
                              │
                              ▼
                        Hub (Go binary + PostgreSQL)
                              │
                              ├── Stores in TimescaleDB
                              ├── Evaluates hub-side alert rules (geofence, freshness)
                              ├── Sends notifications (push, email, SMS)
                              │
                              └── Serves dashboard to authenticated users
                                    │
                                    ├── REST API for current status + historical data
                                    └── WebSocket for real-time updates when spoke is online
```

### Hub-side services

The hub provides the following for remote monitoring:

| Service | Responsibility |
|---------|---------------|
| Sync endpoint | Receives data from spoke, stores in TimescaleDB |
| Alert evaluator | Geofence, data freshness, hub-side rules |
| Notification service | Push, email, SMS delivery |
| Dashboard API | REST endpoints for current status, historical data, alert management |
| WebSocket relay | Real-time updates when spoke is actively connected |
| Access control | Enforces role-based permissions on all API calls |

### Spoke-side services

| Service | Responsibility |
|---------|---------------|
| Monitoring service | Evaluates alert rules against live instrument data |
| Local alert engine | Triggers on-board alarm (audio/visual) |
| Data logger | Writes instrument data to SQLite at configured intervals |
| Sync engine | Pushes data to hub with priority ordering |
| Bandwidth detector | Identifies connection type, adjusts sync frequency |

---

## 11. Bandwidth and Sync Priority

### Priority levels

The sync engine uses a priority queue. When bandwidth is limited, higher-priority data is sent first.

| Priority | Data type | Typical size | Frequency |
|----------|----------|-------------|-----------|
| P0 — Critical | Active alerts, geofence breach | < 1 KB | Immediately on trigger |
| P1 — Status | Position, battery SOC, bilge status | < 2 KB | Every 30-60 seconds |
| P2 — Instruments | Full instrument snapshot | < 5 KB | Every 1-5 minutes |
| P3 — History | Backlog of instrument data | Variable | When bandwidth allows |
| P4 — Media | Photos, camera snapshots | 100 KB - 5 MB | When on WiFi |

### Bandwidth detection

The spoke estimates available bandwidth by monitoring sync round-trip times and throughput:

| Detected connection | Behaviour |
|--------------------|-----------|
| WiFi (> 1 Mbps) | Full sync. All priorities. Real-time WebSocket. |
| 4G/5G (> 500 Kbps) | Full sync. All priorities. Real-time WebSocket. |
| Satellite — broadband (Starlink, 100+ Kbps) | P0-P2 at full rate. P3-P4 throttled. |
| Satellite — narrowband (Iridium, < 10 Kbps) | P0-P1 only. P2 at reduced frequency (every 15 min). P3-P4 queued for better connection. |
| Metered / roaming | User-configurable. Default: P0-P1 only. |

### Compression

All sync payloads are gzip-compressed. Typical compression ratios for instrument data (repetitive numerical values) are 5:1 to 10:1.

### Delta sync

Only changed values are transmitted. If battery SOC has not changed since the last sync, it is not re-sent. The hub interpolates between known data points for graph rendering.

---

## 12. Offline Handling

### When the spoke loses internet

| Behaviour | Detail |
|-----------|--------|
| Local operation continues | All spoke services (monitoring, alerts, data logging) continue normally. The boat is fully functional without internet. |
| Data buffered locally | Instrument data continues to be written to SQLite. The sync queue grows. |
| Local alerts still fire | On-board alarms work without internet. The monitoring service does not depend on the hub. |
| Remote alerts do not fire | Push/email/SMS notifications cannot be sent without internet. |
| Hub shows stale data | The dashboard displays the last known data with a timestamp. A "Last updated X ago" indicator warns the user. |
| Hub freshness alert | If the spoke has not reported for a configurable period (default: 1 hour on WiFi, 4 hours on satellite), the hub fires a "spoke offline" alert to the owner. |

### When the spoke reconnects

| Step | Detail |
|------|--------|
| 1. Authenticate | Spoke re-establishes connection with hub, validates JWT. |
| 2. Drain alert queue | Any alerts that fired while offline are sent immediately (P0). |
| 3. Send current status | Current position and instrument snapshot (P1). |
| 4. Drain sync backlog | Queued instrument data sent in chronological order (P2-P3). |
| 5. Resume real-time | WebSocket connection established for live updates. |

The backlog drain is bandwidth-aware. On a slow satellite connection after a week offline, it may take hours to upload all buffered data. The system prioritises current data over historical backlog — the owner sees current status immediately, then historical data fills in gradually.

### Data loss scenarios

| Scenario | Mitigation |
|----------|------------|
| Spoke loses power | Data up to last write is preserved in SQLite (WAL mode, fsync). On restart, sync resumes. |
| Spoke disk failure | Litestream continuously replicates SQLite to S3/USB. Recovery from backup. |
| Hub unreachable for extended period | Spoke buffers indefinitely (subject to disk space). Oldest P4 data (media) may be pruned if disk is full. |
| Both spoke and hub lose data | Litestream backup is the disaster recovery layer. |

### Spoke offline indicator

The hub dashboard shows a clear visual indicator when the spoke is offline:

- Green dot: spoke is online and syncing in real-time
- Amber dot: spoke last reported 10-60 minutes ago
- Red dot: spoke has not reported for > 1 hour
- Grey dot: spoke has never connected (new setup)

The timestamp of the last received data is always visible.
