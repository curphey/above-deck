# Sync Engine — Feature Specification

**Date:** 2026-03-31
**Status:** Draft
**Component:** OS Platform Service (Hub + Spoke)
**Depends on:** Data Model

---

## 1. Overview

The Sync Engine is the service responsible for keeping data consistent between the hub (cloud) and spokes (on-boat instances). It is designed for the reality of maritime connectivity: long periods offline, intermittent satellite links, bursts of bandwidth at marinas, and system clocks that drift or reset.

Core principles:

- **Offline-first** — the spoke operates fully without internet. Sync is opportunistic, never required.
- **Eventual consistency** — hub and spoke will converge to the same state, given connectivity.
- **Canonical ownership** — every piece of data has exactly one authoritative source. Conflicts are resolved by ownership rules, not ad hoc.
- **Bandwidth-aware** — the engine adapts its behaviour to the available connection type.
- **Resilient** — survives power loss, interrupted connections, clock drift, and partial transfers.

The sync engine runs as a service within the Go binary on both hub and spoke. The spoke side initiates all sync sessions — the hub never pushes unsolicited data to a spoke.

---

## 2. Canonical Ownership

Every data type has a defined canonical owner. This eliminates the majority of conflict scenarios.

### 2.1 Spoke-Canonical (Boat is Source of Truth)

The boat knows its own state better than anyone. These data types originate on the spoke and are pushed to the hub.

| Data | Rationale |
|------|-----------|
| Instrument data (time-series) | Directly from hardware sensors |
| Logbook entries | Created on board |
| Track data (GPS traces) | Recorded from live position |
| Position reports | Current location |
| Equipment state changes | Physical equipment is on the boat |
| Alert history | Alerts evaluated on the spoke |
| Maintenance logs | Work performed on the boat |

### 2.2 Hub-Canonical (Cloud is Source of Truth)

Community and reference data is curated and distributed from the hub.

| Data | Rationale |
|------|-----------|
| Cruising almanac | Community-curated, moderated |
| RAG databases | Centrally built and distributed |
| Weather forecasts | Aggregated from external APIs |
| Tide predictions | From authoritative sources |
| Chart updates | Centrally processed |
| Firmware version database | Hub scrapes manufacturer sites |
| Community POIs/reviews | Moderated community content |
| User profile (identity) | Auth managed by hub |
| Moderation decisions | Hub authority |

### 2.3 Bidirectional (Both Sides Write)

Some data types are legitimately edited on both hub and spoke. These require conflict resolution.

| Data | Scenario |
|------|----------|
| Routes | Created on boat or planned at home on laptop |
| Equipment registry | Added on boat, edited on hub |
| Boat profile | Updated from either side |
| Saved settings/preferences | Changed on boat or via web |
| Waypoints/collections | Curated from either side |

---

## 3. Sync Directions

### 3.1 Hub to Spoke

Downloaded when the spoke connects and periodically while connected.

| Data | Trigger | Priority |
|------|---------|----------|
| Weather forecasts | On connect, then every 6h | High |
| Tide predictions | On connect for current region | High |
| Almanac updates | On connect, delta only | Medium |
| RAG database (regional subset) | On connect, delta only | Low (large) |
| Chart updates | User-initiated or on connect | Low (large) |
| Firmware version DB | On connect, delta only | Low |
| Route library (shared routes) | On connect, delta only | Medium |
| User profile changes | On connect | Medium |
| Notifications/messages | On connect, then real-time | High |

### 3.2 Spoke to Hub

Uploaded from the offline queue when connectivity is available.

| Data | Trigger | Priority |
|------|---------|----------|
| Emergency alerts | Immediate (highest priority) | Critical |
| Active alert state | Immediate | Critical |
| Position reports | Periodic (configurable: 1min–1hr) | High |
| Logbook entries | Queued, drained on connect | Medium |
| Track data | Queued, drained on connect | Medium |
| Community contributions | Queued, drained on connect | Low |
| Instrument history (opt-in) | Queued, bulk upload | Low |
| Equipment changes | Queued, drained on connect | Medium |
| Maintenance logs | Queued, drained on connect | Medium |

### 3.3 Bidirectional

Synced in both directions with conflict resolution.

| Data | Conflict Strategy |
|------|-------------------|
| Routes | Last-write-wins (HLC timestamp) |
| Equipment registry | Merge (additive fields), last-write-wins (scalar fields) |
| Boat profile | Last-write-wins per field |
| Settings/preferences | Last-write-wins per key |
| Waypoints/collections | Merge (additive), last-write-wins (edits) |

---

## 4. Offline Queue

When the spoke has no internet, all outbound changes are queued locally in SQLite.

### 4.1 Queue Table

```sql
CREATE TABLE sync_queue (
    id          TEXT PRIMARY KEY,       -- UUID
    entity_type TEXT NOT NULL,          -- 'logbook_entry', 'track_point', 'alert', 'position', etc.
    entity_id   TEXT NOT NULL,          -- ID of the entity being synced
    operation   TEXT NOT NULL,          -- 'create', 'update', 'delete'
    payload     TEXT NOT NULL,          -- JSON: the full entity or delta
    priority    INTEGER NOT NULL,       -- 0=critical, 1=high, 2=medium, 3=low
    hlc         TEXT NOT NULL,          -- Hybrid logical clock timestamp
    created_at  TEXT NOT NULL,          -- ISO 8601 wall-clock (for human reference)
    attempts    INTEGER DEFAULT 0,      -- Retry count
    last_error  TEXT,                   -- Last sync error message
    status      TEXT DEFAULT 'pending'  -- 'pending', 'in_flight', 'failed', 'done'
);

CREATE INDEX idx_sync_queue_priority ON sync_queue(priority, created_at);
CREATE INDEX idx_sync_queue_status ON sync_queue(status);
```

### 4.2 Queue Behaviour

- Changes are appended to the queue as they occur, regardless of connectivity state.
- On reconnect, the queue drains in priority order (critical first), then by HLC timestamp within each priority.
- Each item is sent to the hub. The hub acknowledges receipt. On acknowledgement, the item is marked `done` and eventually purged.
- If an item fails to sync, it is retried with exponential backoff (max 5 attempts). After 5 failures, it is marked `failed` and flagged for manual review.
- The queue survives power loss (SQLite WAL mode, fsync on commit).
- Queue size is bounded. If the queue exceeds a configured limit (default 10,000 items), lowest-priority items are dropped with a warning logged.

### 4.3 Deduplication

Multiple updates to the same entity while offline are coalesced. Only the latest state is synced, not every intermediate change. The queue maintains a unique constraint on `(entity_type, entity_id)` for pending items — a new update replaces the previous pending entry for the same entity. Exceptions: logbook entries, track points, and alert events are append-only and never coalesced.

---

## 5. Conflict Resolution

### 5.1 Strategies

**Last-write-wins (LWW):** The change with the later HLC timestamp wins. Used for simple scalar fields where the most recent edit is almost certainly correct (boat name, user preferences, route waypoints).

**Merge:** Both sides' changes are kept. Used for additive collections where both sides can contribute independently (logbook entries from different crew members, track points, community reviews). No conflict is possible because additions do not contradict each other.

**Hub-wins:** The hub's version always takes precedence. Used for community-curated data where the hub is the authority (almanac entries, moderation decisions, firmware version database).

**Spoke-wins:** The spoke's version always takes precedence. Used for data the boat directly observes (instrument readings, alert state, equipment status as sensed by connected hardware).

**Manual flag:** When no automatic strategy produces a safe result, the conflict is flagged for manual resolution. The user sees both versions and chooses. This should be rare — the canonical ownership model prevents most conflicts.

### 5.2 Field-Level Resolution

For bidirectional entities (routes, boat profile, equipment registry), conflict resolution operates at the field level, not the entity level. If the hub updated the boat's registration number while the spoke updated the draft measurement, both changes are kept — there is no conflict. A conflict only exists when both sides changed the same field.

```go
type ConflictResolution struct {
    EntityType string
    Strategy   map[string]string // field name → strategy ("lww", "merge", "hub_wins", "spoke_wins", "manual")
    Default    string            // fallback strategy for unlisted fields
}
```

### 5.3 Conflict Log

All conflict resolutions are logged for auditability:

```sql
CREATE TABLE sync_conflicts (
    id          TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id   TEXT NOT NULL,
    field       TEXT NOT NULL,
    hub_value   TEXT,
    spoke_value TEXT,
    hub_hlc     TEXT NOT NULL,
    spoke_hlc   TEXT NOT NULL,
    resolution  TEXT NOT NULL,  -- 'lww_hub', 'lww_spoke', 'merge', 'hub_wins', 'spoke_wins', 'manual_hub', 'manual_spoke'
    resolved_at TEXT NOT NULL,
    resolved_by TEXT             -- 'auto' or user ID
);
```

---

## 6. Hybrid Logical Clocks

### 6.1 The Problem with Wall Clocks on Boats

Wall-clock timestamps are unreliable on boats:

- System clocks drift without NTP (no internet for weeks at a time).
- GPS time may not be available if the GPS receiver is powered down or shielded.
- Boats cross time zones, sometimes multiple per day.
- System clock may reset to epoch after power loss if no RTC battery.
- Two devices on the same boat may have different clock offsets.
- An edit made on the hub (home laptop, good NTP) and an edit made on the spoke (offshore, drifted clock) cannot be ordered by wall clock alone.

### 6.2 Hybrid Logical Clock (HLC) Design

An HLC combines the best of physical time and logical ordering. Each node (hub or spoke) maintains an HLC state:

```go
type HLC struct {
    WallTime  int64  // Physical time in milliseconds (best available)
    Counter   uint32 // Logical counter, incremented when wall time has not advanced
    NodeID    string // Unique node identifier (hub ID or spoke/boat ID)
}
```

**On local event (data change):**
1. Read current wall clock `now`.
2. Set `WallTime = max(hlc.WallTime, now)`.
3. If `WallTime` did not advance (same millisecond), increment `Counter`.
4. Otherwise, reset `Counter = 0`.

**On receiving a remote event (sync message):**
1. Read current wall clock `now`.
2. Set `WallTime = max(hlc.WallTime, remote.WallTime, now)`.
3. If all three are equal, `Counter = max(hlc.Counter, remote.Counter) + 1`.
4. If `WallTime` advanced, reset `Counter = 0`.

**Comparison:** HLCs are compared as `(WallTime, Counter, NodeID)` — a total order.

### 6.3 Clock Discipline

- The spoke attempts to set its system clock from GPS time (PGN 126992 — System Time) when available.
- When connected to the internet, NTP is used.
- The HLC tolerates clock skew — events are still causally ordered even if clocks disagree by hours.
- Gross clock errors (e.g., clock reset to 1970) are detected and logged. The HLC's `WallTime` never goes backwards — it uses `max()` to prevent regression.

---

## 7. Bandwidth Awareness

### 7.1 Connection Types

The spoke detects or is configured with its current connection type:

| Connection | Typical Bandwidth | Latency | Cost | Auto-Detected |
|------------|-------------------|---------|------|---------------|
| Marina WiFi | 1-50 Mbps | Low | Free | Yes (gateway probe) |
| 4G/5G cellular | 5-100 Mbps | Low-Medium | Metered | Yes (interface type) |
| Starlink | 50-200 Mbps | Medium | Flat rate | Yes (latency signature) |
| Iridium GO! | 2.4 kbps | High | Per-minute | Manual config |
| Iridium Certus | 22-352 kbps | Medium | Per-MB | Manual config |
| Fleet One | 100 kbps | Medium | Per-MB | Manual config |

### 7.2 Sync Profiles

Each connection type maps to a sync profile that controls what data is synced and how.

**Unlimited (Marina WiFi, Starlink):**
- Full sync: all queued items, all priorities.
- Download RAG updates, chart updates, firmware DB.
- Upload instrument history (if opted in).
- Background sync of large datasets.

**Metered (4G/5G):**
- Sync critical and high priority items.
- Download weather and tide updates.
- Skip large downloads (RAG, charts) unless user-initiated.
- Compress all payloads.

**Satellite (Iridium, Fleet One):**
- Sync critical items only: emergency alerts, position reports.
- Minimal payload size — stripped to essential fields.
- No downloads except weather text forecasts.
- User can manually trigger additional sync items.

**Offline:**
- Queue everything locally. Drain when connectivity returns.

### 7.3 Priority Queue with Bandwidth Budget

The sync engine maintains a bandwidth budget per session:

```go
type SyncSession struct {
    ConnectionType  string
    BandwidthBudget int64  // bytes, 0 = unlimited
    BytesSent       int64
    BytesReceived   int64
    StartedAt       time.Time
    Items           []SyncQueueItem  // ordered by priority, then HLC
}
```

Items are sent in priority order. If the bandwidth budget is exhausted, remaining items stay queued. The budget resets on the next sync session.

---

## 8. Delta Sync

### 8.1 Change Tracking

The sync engine never sends full database dumps. Only changed records are transmitted.

**Per-entity versioning:** Each syncable entity has an `hlc` column. The sync session tracks the last-synced HLC per entity type per direction. On sync, only entities with an HLC greater than the last-synced value are included.

```sql
CREATE TABLE sync_state (
    entity_type TEXT NOT NULL,
    direction   TEXT NOT NULL,       -- 'hub_to_spoke', 'spoke_to_hub'
    last_hlc    TEXT NOT NULL,       -- Last successfully synced HLC
    last_sync   TEXT NOT NULL,       -- ISO 8601 wall-clock of last sync
    PRIMARY KEY (entity_type, direction)
);
```

### 8.2 Field-Level Deltas

For updates to existing entities, only changed fields are transmitted:

```json
{
  "entity_type": "boat_profile",
  "entity_id": "boat-123",
  "operation": "update",
  "hlc": "1711900800000-0-spoke-abc",
  "delta": {
    "draft": 1.8,
    "updated_at": "2026-03-31T12:00:00Z"
  }
}
```

### 8.3 Compression

All sync payloads are gzip compressed. Typical compression ratios for JSON instrument data: 5:1 to 10:1. For satellite connections, further optimization: field names shortened, numeric precision reduced, timestamps delta-encoded.

### 8.4 Batching

Multiple queue items are batched into a single HTTP request to reduce round trips. Batch size adapts to connection type: large batches on WiFi, single items on satellite.

---

## 9. Litestream — Disaster Recovery

### 9.1 Purpose

Litestream continuously replicates the spoke's SQLite database to S3-compatible object storage. This is independent of the hub sync mechanism — it is a disaster recovery layer.

If the spoke hardware fails (disk failure, fire, sinking), the entire database can be restored from the Litestream replica. This includes all local data that may not yet have synced to the hub.

### 9.2 Configuration

```yaml
litestream:
  enabled: true
  replicas:
    - type: s3
      bucket: abovedeck-spoke-backups
      path: ${BOAT_ID}/
      endpoint: https://s3.amazonaws.com  # or any S3-compatible (R2, Backblaze B2)
      retention: 720h                      # 30 days of WAL segments
      sync-interval: 10s                   # Continuous replication
    - type: file
      path: /mnt/usb-backup/litestream/    # Local USB drive as secondary backup
      retention: 168h                       # 7 days
```

### 9.3 Bandwidth Considerations

Litestream replicates WAL (write-ahead log) segments, not full database copies. Initial replication sends the full snapshot; subsequent replications send only new WAL frames (typically kilobytes per sync).

Litestream replication is paused on satellite connections and resumed on WiFi/cellular. Local USB replication runs regardless of internet connectivity.

### 9.4 Restore Procedure

```bash
# Restore spoke database from S3
litestream restore -o /data/abovedeck.db s3://abovedeck-spoke-backups/${BOAT_ID}/

# Start spoke with restored database
docker run -v /data:/data abovedeck/spoke
```

---

## 10. Data Model

### 10.1 Sync State

```sql
CREATE TABLE sync_state (
    entity_type TEXT NOT NULL,
    direction   TEXT NOT NULL,       -- 'hub_to_spoke', 'spoke_to_hub'
    last_hlc    TEXT NOT NULL,       -- HLC of last successfully synced entity
    last_sync   TEXT NOT NULL,       -- ISO 8601 timestamp
    items_synced INTEGER DEFAULT 0,  -- Running count
    PRIMARY KEY (entity_type, direction)
);
```

### 10.2 Sync Queue

(Defined in section 4.1 above.)

### 10.3 HLC State

```sql
CREATE TABLE hlc_state (
    node_id     TEXT PRIMARY KEY,    -- This node's unique ID
    wall_time   INTEGER NOT NULL,    -- Current HLC wall time (ms)
    counter     INTEGER NOT NULL,    -- Current HLC counter
    updated_at  TEXT NOT NULL
);
```

### 10.4 Conflict Log

(Defined in section 5.3 above.)

### 10.5 Connection Log

```sql
CREATE TABLE sync_connections (
    id              TEXT PRIMARY KEY,
    connection_type TEXT NOT NULL,    -- 'wifi', '4g', 'starlink', 'iridium', 'manual'
    started_at      TEXT NOT NULL,
    ended_at        TEXT,
    bytes_sent      INTEGER DEFAULT 0,
    bytes_received  INTEGER DEFAULT 0,
    items_sent      INTEGER DEFAULT 0,
    items_received  INTEGER DEFAULT 0,
    errors          INTEGER DEFAULT 0,
    status          TEXT NOT NULL     -- 'active', 'completed', 'failed', 'interrupted'
);
```

---

## 11. Sync Protocol

### 11.1 Session Handshake

When the spoke connects to the hub, the sync session begins with a handshake:

```
Spoke → Hub:  SYNC_INIT {
                spoke_id, boat_id,
                hlc_state,
                sync_state (last HLC per entity type per direction),
                connection_type,
                queue_depth
              }

Hub → Spoke:  SYNC_ACK {
                hub_hlc_state,
                hub_sync_state,
                available_updates (entity types with changes since spoke's last HLC),
                sync_profile (based on connection type)
              }
```

### 11.2 Bidirectional Exchange

After handshake, both sides exchange deltas:

1. **Spoke sends** queued items in priority order (critical first).
2. **Hub acknowledges** each batch. Spoke marks items as `done`.
3. **Hub sends** updates the spoke needs (based on spoke's last-synced HLC per entity type).
4. **Spoke acknowledges** each batch. Hub updates its record of spoke state.

### 11.3 Transport

- HTTPS for all sync communication.
- Request signing (HMAC) to prevent replay attacks.
- Sync payloads are gzip compressed.
- Long-running sync sessions use chunked transfer encoding.
- Connection interruption is handled gracefully — partial batches are retried from the last acknowledged item.

---

## 12. API Endpoints

```
POST   /api/v1/sync/init           — initiate sync session (spoke → hub)
POST   /api/v1/sync/push           — push queued items (spoke → hub)
GET    /api/v1/sync/pull            — pull updates (hub → spoke)
POST   /api/v1/sync/ack            — acknowledge received items
GET    /api/v1/sync/status          — current sync state
GET    /api/v1/sync/conflicts       — list unresolved conflicts
POST   /api/v1/sync/conflicts/:id   — resolve a conflict manually
GET    /api/v1/sync/history         — sync session history
```

### Hub-Side Internal

```
GET    /internal/sync/spoke/:id/state  — spoke's sync state (admin)
GET    /internal/sync/stats            — aggregate sync statistics
```
