# Monitoring & Alerts — Feature Specification

**Date:** 2026-03-31
**Status:** Draft
**Component:** OS Platform Service (Spoke)
**Depends on:** Data Model, Protocol Adapters, Sync Engine

---

## 1. Overview

The Monitoring & Alerts service is a continuous, always-on process that watches the unified data model for conditions that require attention. It evaluates configurable rules against live instrument data streams and triggers multi-channel alerts when thresholds are breached.

This is a spoke-only service. The boat monitors itself 24/7, whether the crew is awake or not, whether the boat has internet or not. When connectivity is available, alert state is forwarded to the hub for remote notification (push, SMS, email) and emergency contact escalation.

The service runs as a goroutine within the Go binary. It subscribes to data model change events via the internal pub/sub system and evaluates rules on every relevant data change. It does not poll.

---

## 2. Rule System

### 2.1 Rule Types

**Threshold rules** — a single data model path compared against a static or configured value.

```
IF electrical/batteries/house/voltage < 12.0 THEN alert
IF navigation/depth/belowKeel < 2.0 THEN alert
IF propulsion/engines/port/coolantTemp > 95.0 THEN alert
```

**Rate-of-change rules** — a data model path evaluated for frequency or rate over a sliding time window.

```
IF COUNT(electrical/switching/circuits/bilgePump/stateChanges) > 3 IN 60min THEN alert
IF DELTA(tanks/fuel/port/level) > 10% IN 30min THEN alert
IF DELTA(navigation/position/lat) > 0.001 IN 5min WHEN anchor_watch=active THEN alert
```

**Compound rules** — boolean combinations of threshold and rate-of-change conditions. These detect correlated failures that individually might not warrant alarm but together indicate a serious problem.

```
IF electrical/switching/circuits/bilgePump/cycles > 3/hr
   AND electrical/batteries/house/voltage < 12.2
THEN alert(severity=critical, message="Bilge activity with dropping battery — possible hull breach or pump failure")

IF propulsion/engines/port/oilPressure < 20
   AND propulsion/engines/port/rpm > 1000
THEN alert(severity=critical, message="Low oil pressure under load")

IF navigation/depth/belowKeel < 3.0
   AND navigation/speed/overGround > 4.0
THEN alert(severity=warning, message="Shallow water at speed")
```

**Absence rules** — alert when an expected data source stops updating within an expected interval.

```
IF NO UPDATE ON navigation/position/* FOR 120s THEN alert(severity=warning, message="GPS signal lost")
IF NO UPDATE ON electrical/batteries/house/voltage FOR 60s THEN alert(severity=warning, message="Battery monitor offline")
```

### 2.2 Rule Structure

Each rule is a Go struct persisted to SQLite:

```go
type Rule struct {
    ID          string        // UUID
    Name        string        // Human-readable name
    Category    string        // "built-in" | "custom" | "agent"
    Enabled     bool
    Conditions  []Condition   // One or more conditions (AND logic by default)
    Logic       string        // "AND" | "OR" — how conditions combine
    Severity    string        // "info" | "warning" | "critical" | "emergency"
    Cooldown    time.Duration // Minimum time between re-triggers
    Message     string        // Alert message template (supports {{path}} interpolation)
    Channels    []string      // Override default channels for this severity
    CreatedAt   time.Time
    UpdatedAt   time.Time
}

type Condition struct {
    Path      string  // Data model path
    Operator  string  // "<" | ">" | "==" | "!=" | "absent" | "rate" | "count"
    Value     float64 // Threshold value
    Window    time.Duration // For rate/count/absent: evaluation window
    Unit      string  // Display unit for the value
}
```

### 2.3 Rule Evaluation

- Rules subscribe to the data model paths referenced in their conditions.
- When any subscribed path changes, the rule's conditions are re-evaluated.
- Rate-of-change and count conditions maintain a circular buffer of recent values per path, sized to the evaluation window.
- Compound rules only trigger when all (AND) or any (OR) conditions are simultaneously true.
- A cooldown period prevents repeated firing of the same rule. The rule will not re-trigger until the cooldown has elapsed after the previous alert was resolved or the cooldown expired.

---

## 3. Built-in Rules

The spoke ships with a default alarm set. These are created on first boot and can be adjusted but not deleted. Users can disable any built-in rule.

| Rule | Path(s) | Default Threshold | Severity | Cooldown |
|------|---------|-------------------|----------|----------|
| Low battery (house) | `electrical/batteries/house/voltage` | < 12.0V | critical | 5min |
| Low battery (warning) | `electrical/batteries/house/voltage` | < 12.4V | warning | 15min |
| Low battery (start) | `electrical/batteries/start/voltage` | < 12.2V | critical | 5min |
| Shallow depth | `navigation/depth/belowKeel` | < user-configured minimum (default 2.0m) | critical | 30s |
| High engine temp | `propulsion/engines/*/coolantTemp` | > 95C | critical | 1min |
| Low oil pressure | `propulsion/engines/*/oilPressure` | < 15 PSI (under load) | critical | 1min |
| High exhaust temp | `propulsion/engines/*/exhaustTemp` | > 70C wet, > 400C dry | critical | 1min |
| Bilge pump activity | `electrical/switching/circuits/bilgePump` | > 3 activations in 60min | warning | 30min |
| Bilge pump + low battery | Compound: bilge + house voltage | > 3/hr AND < 12.2V | critical | 15min |
| Anchor drag | `navigation/position/*` | Position drift > configured radius when anchor watch active | critical | 30s |
| CO detection | `environment/inside/*/co` | > 0 ppm (any reading) | emergency | 0s |
| Smoke detection | `environment/inside/*/smoke` | Any detection | emergency | 0s |
| Circuit fault | `electrical/switching/circuits/*/fault` | Any fault flag | warning | 5min |
| GPS lost | `navigation/position/*` | No update for 120s | warning | 5min |
| AIS target CPA | `ais/vessels/*/cpa` | < user-configured minimum (default 0.5nm) | warning | 2min |
| High wind | `navigation/wind/true/speed` | > user-configured (default 30kt) | warning | 15min |
| Tank low (water) | `tanks/freshwater/*/level` | < 15% | info | 60min |
| Tank high (holding) | `tanks/blackwater/*/level` | > 85% | info | 60min |
| Shore power lost | `electrical/shore/connected` | false (when previously true) | warning | 5min |

All thresholds are per-boat configurable. Wildcard paths (`*`) expand to all instances (e.g., all engines, all tanks).

---

## 4. Custom Rules

Users create custom rules through a UI or via the API. Custom rules support all rule types: threshold, rate-of-change, compound, and absence.

### 4.1 User-Defined Thresholds

Any data model path can be monitored with a custom threshold. The UI presents:

1. Browse/search the data model tree to select a path
2. Choose operator and threshold value
3. Set severity level
4. Optionally add additional conditions (compound rule)
5. Set cooldown period
6. Choose notification channels (or use severity defaults)
7. Write a custom alert message

### 4.2 Agent-Created Rules

AI agents can create monitoring rules programmatically. For example, the Engineer agent might create a rule based on the boat's specific equipment characteristics or after diagnosing a problem. Agent-created rules are tagged with `category: "agent"` and the creating agent's ID.

### 4.3 Rule Validation

- Path must exist in the data model schema (or be a valid wildcard pattern)
- Operator must be valid for the path's data type
- Value must be within a sane range for the data type
- Cooldown must be >= 0
- Compound rules limited to 10 conditions (prevent performance issues)

---

## 5. Alert Engine

When a rule triggers, the alert engine creates an alert and delivers it through configured channels.

### 5.1 Channel Configuration

Each severity level maps to a default set of channels. Users can override per-rule or globally.

| Severity | Default Channels |
|----------|-----------------|
| info | Visual (status bar indicator) |
| warning | Visual (status bar + popup), Audible (single tone) |
| critical | Visual (persistent popup), Audible (repeated alarm), Push notification |
| emergency | All channels: Visual, Audible, Push, SMS, Email, Emergency contacts |

### 5.2 Channel Implementations

**Visual — MFD status bar:** A persistent alert indicator in the MFD status bar. Colour-coded by severity. Tapping shows alert detail. Active alerts are always visible regardless of which app is in the foreground.

**Visual — MFD popup:** A modal overlay on the MFD display. Shows alert message, current value, threshold, and acknowledge/silence buttons. Critical and emergency popups require explicit acknowledgement before they dismiss.

**Audible:** The spoke triggers an audible alarm via the system audio output. Different tones for different severities. Emergency uses a continuous alarm. The user can silence the audible alarm without acknowledging the underlying alert.

**Push notification:** Sent via the hub when the spoke has connectivity. Uses web push (service worker) to the user's registered devices. Works on phone, tablet, or laptop with the PWA installed.

**SMS:** Sent via the hub's SMS gateway when the spoke has connectivity. Configured phone numbers. Used for critical and emergency alerts, or when push delivery fails.

**Email:** Sent via the hub when the spoke has connectivity. Configured email addresses.

**Emergency contacts:** A configured list of people (partner, marina, coast guard contact) who receive alerts when the severity is emergency or when escalation reaches this level. Each contact has a name, phone, email, and the alert types they should receive.

### 5.3 Connectivity-Dependent Delivery

The spoke delivers visual and audible alerts immediately (no internet required). For push, SMS, and email, the spoke queues the alert for delivery via the hub. When connectivity is available, the queue drains. This uses the sync engine's offline queue.

If the spoke has direct 4G/cellular access (e.g., via an attached modem with SMS capability), SMS can be sent directly from the spoke without hub involvement.

---

## 6. Escalation

Escalation ensures that alerts are not silently ignored. If an alert is not acknowledged within a configured time window, it escalates to the next channel tier.

### 6.1 Escalation Chain

Default escalation (configurable per rule or globally):

```
T+0:    Visual + Audible (on boat)
T+5min: Push notification to owner's devices
T+15min: SMS to owner
T+30min: Email to owner + push to crew members
T+60min: SMS/Email to emergency contacts
```

Each step adds channels — it does not replace previous ones. The on-boat alarm continues until acknowledged.

### 6.2 Escalation Rules

- Escalation only applies to `warning`, `critical`, and `emergency` severity.
- `info` alerts do not escalate.
- `emergency` alerts skip directly to all channels (no escalation delay).
- Acknowledging an alert at any stage stops further escalation.
- Resolving the underlying condition (value returns to safe range) resolves the alert and stops escalation.
- Escalation timers are configurable per severity level.

---

## 7. Alert Lifecycle

Every alert follows a defined state machine:

```
          rule triggers
               │
               ▼
         ┌──────────┐
         │ TRIGGERED │ ── immediate: create alert, start delivery
         └────┬─────┘
              │
              ▼
         ┌──────────┐
         │  ACTIVE   │ ── channels delivering, escalation timer running
         └────┬─────┘
              │
         ┌────┴────┐
         │         │
         ▼         ▼
  ┌──────────┐  ┌──────────┐
  │   ACK    │  │ RESOLVED │ ── condition cleared (value back in range)
  │          │  │          │
  └────┬─────┘  └──────────┘
       │
       ▼
  ┌──────────┐
  │ RESOLVED │ ── condition cleared after acknowledgement
  └──────────┘
```

**TRIGGERED:** The moment a rule's conditions evaluate to true. The alert record is created. Channel delivery begins immediately.

**ACTIVE:** The alert is live. Channels are delivering notifications. Escalation timers are running. The underlying condition is still true.

**ACKNOWLEDGED:** A user (or agent) has acknowledged the alert. Escalation stops. Audible alarm can be silenced. The alert remains visible until resolved. Records who acknowledged and when.

**RESOLVED:** The underlying condition is no longer true (e.g., voltage rose above threshold). The alert is closed. Moved to history. If the condition was never acknowledged but self-resolved, the alert moves directly from ACTIVE to RESOLVED.

### 7.1 Auto-Resolution

Threshold and absence rules auto-resolve when the monitored value returns to a safe state. Rate-of-change rules auto-resolve when the rate drops below the threshold for a full window duration. Auto-resolution is logged and visible in alert history.

### 7.2 Manual Resolution

Some alerts may require manual resolution (e.g., a circuit fault that was physically repaired). The user marks these as resolved with an optional note.

---

## 8. Data Model

### 8.1 Rules Table

```sql
CREATE TABLE alert_rules (
    id          TEXT PRIMARY KEY,  -- UUID
    name        TEXT NOT NULL,
    category    TEXT NOT NULL DEFAULT 'custom',  -- 'built-in', 'custom', 'agent'
    enabled     INTEGER NOT NULL DEFAULT 1,
    conditions  TEXT NOT NULL,     -- JSON array of conditions
    logic       TEXT NOT NULL DEFAULT 'AND',  -- 'AND' | 'OR'
    severity    TEXT NOT NULL,     -- 'info', 'warning', 'critical', 'emergency'
    cooldown_s  INTEGER NOT NULL DEFAULT 300,
    message     TEXT NOT NULL,
    channels    TEXT,              -- JSON array, NULL = use severity defaults
    created_by  TEXT,              -- 'system', user ID, or agent ID
    created_at  TEXT NOT NULL,     -- ISO 8601
    updated_at  TEXT NOT NULL
);
```

### 8.2 Active Alerts Table

```sql
CREATE TABLE active_alerts (
    id              TEXT PRIMARY KEY,  -- UUID
    rule_id         TEXT NOT NULL REFERENCES alert_rules(id),
    state           TEXT NOT NULL,     -- 'triggered', 'active', 'acknowledged'
    severity        TEXT NOT NULL,
    message         TEXT NOT NULL,     -- Rendered message with interpolated values
    trigger_value   REAL,             -- The value that triggered the alert
    threshold_value REAL,             -- The threshold that was breached
    data_path       TEXT NOT NULL,     -- Primary data model path
    triggered_at    TEXT NOT NULL,
    acknowledged_at TEXT,
    acknowledged_by TEXT,              -- User ID or agent ID
    escalation_level INTEGER NOT NULL DEFAULT 0,
    next_escalation TEXT,             -- ISO 8601 timestamp of next escalation
    metadata        TEXT              -- JSON: additional context, related paths
);
```

### 8.3 Alert History Table

```sql
CREATE TABLE alert_history (
    id              TEXT PRIMARY KEY,
    rule_id         TEXT NOT NULL,
    rule_name       TEXT NOT NULL,     -- Denormalised for history readability
    severity        TEXT NOT NULL,
    message         TEXT NOT NULL,
    trigger_value   REAL,
    threshold_value REAL,
    data_path       TEXT NOT NULL,
    triggered_at    TEXT NOT NULL,
    acknowledged_at TEXT,
    acknowledged_by TEXT,
    resolved_at     TEXT NOT NULL,
    resolved_by     TEXT,              -- 'auto', user ID, or agent ID
    resolution_note TEXT,
    escalation_level INTEGER NOT NULL DEFAULT 0,
    duration_s      INTEGER NOT NULL,  -- Time from triggered to resolved
    metadata        TEXT
);
```

### 8.4 Escalation Configuration

```sql
CREATE TABLE escalation_config (
    severity    TEXT PRIMARY KEY,
    steps       TEXT NOT NULL  -- JSON array of {delay_s, channels[]}
);
```

### 8.5 Emergency Contacts

```sql
CREATE TABLE emergency_contacts (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    phone       TEXT,
    email       TEXT,
    alert_types TEXT NOT NULL,  -- JSON array of severity levels
    enabled     INTEGER NOT NULL DEFAULT 1,
    sort_order  INTEGER NOT NULL DEFAULT 0
);
```

---

## 9. Hub vs Spoke

### Spoke (On-Boat)

- The monitoring service runs exclusively on the spoke.
- All rule evaluation happens locally against live data — no internet dependency.
- Visual and audible alerts are delivered immediately on the boat.
- Alerts requiring remote delivery (push, SMS, email) are queued in the sync engine's offline queue.
- Alert state (active alerts, history) is synced to the hub when connected.
- The spoke is authoritative for alert state — if the spoke says the alert is active, it is active.

### Hub (Cloud)

- The hub does not evaluate rules or monitor data streams.
- The hub receives alert state from spokes and delivers remote notifications (push, SMS, email).
- The hub provides remote alert visibility — the owner can check their boat's alert status from anywhere via the web UI.
- Emergency contact delivery is handled by the hub (it has the SMS/email infrastructure).
- The hub stores alert history for long-term access and cross-device visibility.

### Offline Behaviour

When the spoke has no internet:

- All monitoring and alerting continues normally on the boat.
- Remote notifications are queued and delivered when connectivity returns.
- If the alert is resolved before connectivity returns, the hub receives both the alert and its resolution — it can decide whether to still notify (e.g., skip push for an alert that was active for 30 seconds, still log to history).
- Emergency alerts are prioritised in the sync queue — they drain first when connectivity is restored.

---

## 10. API Endpoints

```
GET    /api/v1/alerts              — list active alerts
GET    /api/v1/alerts/:id          — get alert detail
POST   /api/v1/alerts/:id/ack      — acknowledge an alert
POST   /api/v1/alerts/:id/resolve  — manually resolve an alert
GET    /api/v1/alerts/history      — query alert history (paginated, filterable)

GET    /api/v1/rules               — list all rules
GET    /api/v1/rules/:id           — get rule detail
POST   /api/v1/rules               — create custom rule
PUT    /api/v1/rules/:id           — update rule
DELETE /api/v1/rules/:id           — delete custom rule (built-in rules cannot be deleted)
PUT    /api/v1/rules/:id/enable    — enable/disable a rule
GET    /api/v1/rules/validate      — validate a rule definition without saving

GET    /api/v1/escalation          — get escalation configuration
PUT    /api/v1/escalation          — update escalation configuration

GET    /api/v1/emergency-contacts  — list emergency contacts
POST   /api/v1/emergency-contacts  — add emergency contact
PUT    /api/v1/emergency-contacts/:id — update emergency contact
DELETE /api/v1/emergency-contacts/:id — delete emergency contact
```

### WebSocket

Active alerts and state changes are pushed to connected frontends via WebSocket:

```json
{
  "type": "alert.triggered",
  "alert": { "id": "...", "severity": "critical", "message": "...", ... }
}

{
  "type": "alert.escalated",
  "alert": { "id": "...", "escalation_level": 2, ... }
}

{
  "type": "alert.resolved",
  "alert": { "id": "...", "resolved_by": "auto", ... }
}
```
