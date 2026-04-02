# Logbook — Feature Specification

**Feature:** 6.19 Logbook
**Tier:** 3 — Underway Experience
**Status:** Draft
**Date:** 2026-03-31

---

## 1. Overview

The logbook is a digital ship's log that replaces the traditional paper logbook with an instrument-connected, GPS-aware, legally admissible record of every passage. It auto-populates from the boat's instruments at configurable intervals while allowing manual entries for events, observations, and sail changes. Photos are pinned to route locations. Passage statistics are computed automatically. The complete record is exportable as a PDF and contributes to a cumulative sailing CV.

The logbook runs primarily on the spoke (on-board), where it has direct access to instrument data. Entries sync to the hub when connectivity is available. The hub serves as long-term storage and enables browser-based review, export, and CV generation.

---

## 2. User Stories

### Auto-logging
- As a skipper, I want the logbook to automatically record position, heading, speed, wind, depth, weather, and battery state at regular intervals so I have a complete passage record without manual effort.
- As a skipper, I want to configure the auto-log interval (e.g. every 15 minutes coastal, every hour offshore) so the log density matches the passage type.
- As a watch keeper, I want the system to automatically create a log entry at watch changeover so the handover is documented.

### Manual entries
- As a crew member, I want to add a manual log entry noting a sail change, reefing, or engine start/stop so significant events are recorded with context.
- As a skipper, I want to record crew observations (weather changes, wildlife sightings, equipment issues) as free-text notes attached to a position and timestamp.
- As a skipper, I want to mark the start and end of a passage so the system can compute passage-level statistics.

### Photos
- As a crew member, I want to attach photos to log entries so they are pinned to the route location with GPS coordinates and timestamp.
- As a skipper, I want to browse photos on the chart view, placed at the location where they were taken, so I can relive the passage visually.

### Export and legal
- As a skipper, I want to export a passage log as a PDF with charts, photos, and statistics so I have a permanent record for insurance, customs, or personal archives.
- As a yacht master, I want the log to meet legal admissibility standards so it can serve as evidence in maritime proceedings.

### Sailing CV
- As a sailor, I want a cumulative record of all my passages showing total miles, passages completed, roles held, and conditions experienced so I can present a sailing CV for charter companies, race committees, or training organisations.
- As a crew member, I want my participation in a passage to be recorded against my user profile so my miles accumulate across boats.

### Hub and spoke
- As a skipper, I want log entries created offline on the boat to sync to the hub automatically when internet is available so I never lose data.
- As a skipper, I want to review and annotate my logbook from a browser on the hub so I can complete notes and add context after a passage.

### AI integration
- As a skipper, I want the Watchman to automatically create log entries for significant events (anchor alarm, weather change, AIS close quarters, engine alarm) so nothing important is missed even if the crew forgets to log it.

---

## 3. Auto-Logging

### Configurable intervals

The auto-logger runs as a background service on the spoke. It captures a snapshot of all available instrument data at a configurable interval.

| Preset | Interval | Use case |
|--------|----------|----------|
| Harbour | Off | At anchor or in marina, no auto-logging |
| Coastal | 15 minutes | Day sailing, coastal passages |
| Offshore | 30 minutes | Open water passages |
| Ocean | 60 minutes | Long ocean crossings |
| Custom | User-defined | Any interval from 1 minute to 4 hours |

The interval can be changed mid-passage. The system also creates an auto-entry on specific triggers regardless of interval:

- Passage start and end
- Watch changeover
- Course change greater than 30 degrees (configurable threshold)
- Speed change greater than 2 knots sustained for 5 minutes
- Weather condition change (significant barometric pressure shift)
- Engine start/stop (if instrumented)
- Anchor deploy/retrieve (if instrumented)

### Data captured per auto-entry

Every auto-log entry records whatever data is available from the instrument bus. Missing fields are stored as null, not omitted.

| Category | Fields |
|----------|--------|
| Position | Latitude, longitude, GPS accuracy (HDOP) |
| Motion | SOG, COG, STW, heading (magnetic and true), heel angle, pitch |
| Wind | True wind speed, true wind direction, apparent wind speed, apparent wind angle |
| Depth | Depth below transducer, depth below keel (if offset configured) |
| Weather | Barometric pressure, air temperature, water temperature, humidity |
| Power | Battery SOC (%), battery voltage, solar input (W), load (W), shore power status |
| Engine | RPM, hours, coolant temperature, oil pressure, fuel flow (if instrumented) |
| Tanks | Fuel level (%), water level (%), holding tank level (%) |
| Navigation | Distance to waypoint, ETA, XTE, active route name |

---

## 4. Manual Entries

Manual entries are created by crew through the logbook UI. They supplement auto-entries with human context.

### Entry types

| Type | Icon | Description |
|------|------|-------------|
| Sail change | Sail icon | Reef, unreef, sail up, sail down, sail type |
| Engine | Engine icon | Start, stop, reason |
| Weather | Cloud icon | Observed conditions, visibility, sea state (Beaufort/Douglas) |
| Navigation | Compass icon | Course change, waypoint reached, landfall, pilot boarding |
| Safety | Alert icon | MOB drill, safety briefing, equipment check, near miss |
| Watch | Clock icon | Watch start, watch end, crew on watch |
| Maintenance | Wrench icon | Repair, adjustment, equipment failure |
| Observation | Eye icon | Free-text note, wildlife, other vessels, anything noteworthy |

Each manual entry automatically captures the current instrument snapshot (same fields as auto-entries) alongside the crew's text, so every manual entry also has full instrument context.

### Entry metadata

- Timestamp (UTC and local)
- Position (auto-captured from GPS)
- Author (crew member who created the entry)
- Entry type (from list above)
- Free-text notes
- Attached photos (zero or more)
- Tags (user-defined, searchable)

---

## 5. Photos

Photos are first-class logbook objects. They are always associated with a position and timestamp.

### Capture and storage

- Photos can be taken directly from the logbook UI (camera API on mobile devices) or uploaded from gallery.
- Each photo stores: image file, GPS latitude/longitude, timestamp, caption (optional), author.
- Photos are stored on the spoke filesystem initially, then synced to hub object storage (Supabase Storage).
- Thumbnails are generated on the spoke for display in timeline and map views.
- Photos sync at low priority (after log entries and position data) to conserve bandwidth on satellite connections.

### Display

- Timeline view: photos appear inline with log entries at their chronological position.
- Map view: photos appear as markers on the chart at the location where they were taken. Tapping a marker shows the photo with caption and metadata.
- Gallery view: all photos for a passage displayed in a grid, filterable by date, author, or tag.

---

## 6. Passage Statistics

Statistics are computed automatically from auto-log entries for each passage. A passage is defined by explicit start and end markers set by the skipper.

### Core statistics

| Statistic | Calculation |
|-----------|-------------|
| Total distance | Sum of great-circle distances between consecutive position fixes (nm) |
| Elapsed time | Passage start to passage end |
| Time underway | Elapsed time minus time at anchor or moored (detected via speed threshold) |
| Average SOG | Mean speed over ground for all fixes where SOG > 0.5 kn |
| Max SOG | Highest recorded SOG |
| Average STW | Mean speed through water (if available) |
| Sailing ratio | Percentage of time underway without engine running (requires engine instrumentation or manual engine log entries) |
| VMG to destination | Velocity made good toward the final waypoint |
| Distance to rhumb line | How far the actual track deviated from the direct route |

### Passage composition

The track is segmented by passage type based on proximity to land, depth, and speed:

| Segment type | Detection criteria |
|-------------|-------------------|
| Open water | > 12nm from nearest land, depth > 50m |
| Coastal | 1-12nm from land |
| Channel / strait | Narrow waterway, constrained lateral movement |
| Harbour approach | < 1nm from port, speed < 5 kn, course changes frequent |
| At anchor | Speed < 0.3 kn for > 10 minutes, position variance < 50m |

Each segment records: type, start/end time, distance, average speed.

### Wind and weather summary

- Predominant wind direction and average speed
- Maximum wind speed recorded
- Beaufort force distribution (percentage of time at each force level)
- Sea state summary (if manually logged or available from instruments)

### Power summary

- Battery SOC at departure and arrival
- Total solar generation (kWh)
- Total consumption (kWh)
- Shore power connected time
- Engine charging time

---

## 7. Legal-Grade Format

Maritime law recognises ship's logs as evidence in admiralty courts, insurance claims, and incident investigations. A digital log must meet the same evidentiary standards as a paper log.

### Requirements for legal admissibility

| Requirement | Implementation |
|-------------|---------------|
| Contemporaneous | Entries timestamped at time of creation, not backdated. Auto-entries prove real-time recording. |
| Unaltered | Entries are append-only. Edits create a new amendment entry referencing the original; the original is never modified or deleted. Amendments record who made the change and when. |
| Continuous | Auto-logging at regular intervals demonstrates continuous record-keeping. Gaps in the log (e.g. system power loss) are explicitly recorded with reason when the system resumes. |
| Attributable | Every entry records the author (authenticated user). Watch changeovers are logged. |
| Complete | All available instrument data is captured, not just what the crew chose to record. |
| Verifiable | Each entry includes a SHA-256 hash of its contents. Entries are hash-chained (each entry includes the hash of the previous entry) creating a tamper-evident sequence. |
| Exportable | The complete log can be exported as a self-contained PDF with embedded metadata, or as structured data (JSON/CSV) for forensic analysis. |
| Backed up | Entries sync to hub. Litestream provides continuous SQLite replication to S3-compatible storage. Local USB backup option. |

### Amendments

Entries cannot be edited or deleted. If an entry contains an error, the crew creates an amendment entry that:

- References the original entry by ID
- States the correction
- Records who made the amendment and when
- The original entry is displayed with a visual indicator that an amendment exists

This mirrors the maritime convention of striking through (but not obscuring) incorrect entries in a paper log.

---

## 8. Export

### PDF export

A passage can be exported as a PDF document containing:

1. **Cover page** — boat name, passage name, departure/arrival ports, dates, skipper, crew list
2. **Summary statistics** — distance, time, speeds, sailing ratio, composition breakdown
3. **Chart** — the passage track plotted on a chart with key waypoints and photo locations marked
4. **Chronological log** — all entries (auto and manual) in time order with instrument data, notes, and inline photos
5. **Weather summary** — wind rose, barometric pressure graph, temperature graph
6. **Power summary** — battery SOC graph, solar generation, consumption
7. **Crew hours** — watch schedule, hours on watch per crew member
8. **Photo gallery** — all photos with captions, timestamps, and positions
9. **Appendix** — raw data tables (if requested), amendment history

PDF generation runs on the spoke (offline capable) or on the hub.

### Data export

- JSON — complete structured data for all entries, machine-readable
- CSV — tabular format for spreadsheet analysis
- GPX — track data for import into other navigation software

---

## 9. Sailing CV

The sailing CV is a cumulative record across all passages, all boats, and all roles. It lives on the hub, aggregated from logbook data synced from spokes.

### CV data

| Field | Source |
|-------|--------|
| Total nautical miles | Sum of all passage distances |
| Total time at sea | Sum of all passage elapsed times |
| Night hours | Hours underway between sunset and sunrise (computed from position and date) |
| Passages completed | Count with departure/arrival ports |
| Longest passage | Distance and duration |
| Furthest from land | Maximum offshore distance recorded |
| Maximum wind experienced | Highest true wind speed recorded |
| Roles held | Skipper, watch leader, crew, navigator, engineer (set per passage) |
| Boats sailed | List of boats with type, length, rig |
| Regions sailed | Derived from passage tracks (e.g. English Channel, Bay of Biscay, Atlantic crossing) |
| Qualifications | Manually added certifications (RYA Day Skipper, Yachtmaster, etc.) |

### Verification

- Miles are computed from GPS track data, not self-reported.
- Passages are corroborated by other crew members who were on the same boat (their logbook data matches).
- The hash chain provides tamper evidence.
- A "verified" badge indicates GPS-tracked miles vs manually entered historical miles.

### Export

- PDF formatted as a traditional sailing CV / logbook summary
- Shareable link (public or authenticated) for charter companies, race committees, or training organisations

---

## 10. Data Model

### Tables (SQLite on spoke, PostgreSQL on hub)

#### `passages`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| boat_id | UUID | FK to boat |
| name | TEXT | Passage name (e.g. "Falmouth to Brest") |
| departure_port | TEXT | Departure port name |
| departure_lat | REAL | Departure latitude |
| departure_lng | REAL | Departure longitude |
| arrival_port | TEXT | Arrival port name (null if in progress) |
| arrival_lat | REAL | Arrival latitude |
| arrival_lng | REAL | Arrival longitude |
| started_at | TIMESTAMP | Passage start time (UTC) |
| ended_at | TIMESTAMP | Passage end time (UTC), null if in progress |
| status | TEXT | `planned`, `active`, `completed`, `abandoned` |
| notes | TEXT | Passage-level notes |
| created_by | UUID | FK to user (skipper) |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |
| sync_version | INTEGER | Incremented on each change for sync |

#### `passage_crew`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| passage_id | UUID | FK to passage |
| user_id | UUID | FK to user |
| role | TEXT | `skipper`, `watch_leader`, `crew`, `navigator`, `engineer` |
| joined_at | TIMESTAMP | When crew joined (may differ from passage start) |
| left_at | TIMESTAMP | When crew left (may differ from passage end) |

#### `log_entries`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| passage_id | UUID | FK to passage |
| entry_type | TEXT | `auto`, `sail_change`, `engine`, `weather`, `navigation`, `safety`, `watch`, `maintenance`, `observation`, `system` |
| source | TEXT | `instrument` (auto), `crew` (manual), `watchman` (AI) |
| author_id | UUID | FK to user (null for auto/system entries) |
| timestamp | TIMESTAMP | Entry time (UTC) |
| timestamp_local | TIMESTAMP | Entry time in local timezone |
| timezone | TEXT | IANA timezone at time of entry |
| latitude | REAL | Position at time of entry |
| longitude | REAL | Position at time of entry |
| gps_accuracy | REAL | HDOP value |
| sog | REAL | Speed over ground (knots) |
| cog | REAL | Course over ground (degrees true) |
| stw | REAL | Speed through water (knots) |
| heading_mag | REAL | Magnetic heading |
| heading_true | REAL | True heading |
| heel | REAL | Heel angle (degrees) |
| pitch | REAL | Pitch angle (degrees) |
| tws | REAL | True wind speed (knots) |
| twd | REAL | True wind direction (degrees true) |
| aws | REAL | Apparent wind speed (knots) |
| awa | REAL | Apparent wind angle (degrees) |
| depth | REAL | Depth below transducer (metres) |
| baro_pressure | REAL | Barometric pressure (hPa) |
| air_temp | REAL | Air temperature (Celsius) |
| water_temp | REAL | Water temperature (Celsius) |
| humidity | REAL | Relative humidity (%) |
| battery_soc | REAL | Battery state of charge (%) |
| battery_voltage | REAL | Battery voltage (V) |
| solar_watts | REAL | Solar input (W) |
| load_watts | REAL | Total load (W) |
| shore_power | BOOLEAN | Shore power connected |
| engine_rpm | REAL | Engine RPM |
| engine_hours | REAL | Engine hours total |
| engine_coolant_temp | REAL | Coolant temperature (Celsius) |
| fuel_level | REAL | Fuel tank level (%) |
| water_level | REAL | Water tank level (%) |
| notes | TEXT | Free-text notes |
| tags | TEXT | Comma-separated tags |
| content_hash | TEXT | SHA-256 hash of entry contents |
| prev_hash | TEXT | SHA-256 hash of previous entry (hash chain) |
| amended_by | UUID | FK to log_entry that amends this one (null if not amended) |
| amends_entry_id | UUID | FK to original log_entry this amends (null if original) |
| created_at | TIMESTAMP | Record creation time |
| sync_version | INTEGER | Incremented on each change for sync |

#### `log_photos`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| log_entry_id | UUID | FK to log_entry |
| passage_id | UUID | FK to passage (denormalised for queries) |
| file_path | TEXT | Local file path (spoke) |
| remote_url | TEXT | Hub storage URL (populated after sync) |
| thumbnail_path | TEXT | Local thumbnail path |
| latitude | REAL | Photo GPS latitude |
| longitude | REAL | Photo GPS longitude |
| taken_at | TIMESTAMP | Photo timestamp |
| caption | TEXT | Photo caption |
| author_id | UUID | FK to user |
| file_size | INTEGER | File size in bytes |
| mime_type | TEXT | Image MIME type |
| sync_status | TEXT | `pending`, `syncing`, `synced`, `failed` |
| created_at | TIMESTAMP | Record creation time |

#### `passage_statistics`

Computed and cached. Recalculated when new entries are added.

| Column | Type | Description |
|--------|------|-------------|
| passage_id | UUID | PK, FK to passage |
| total_distance_nm | REAL | Total distance sailed |
| elapsed_seconds | INTEGER | Total elapsed time |
| underway_seconds | INTEGER | Time underway (excluding anchored/moored) |
| avg_sog | REAL | Average SOG |
| max_sog | REAL | Maximum SOG |
| avg_stw | REAL | Average STW |
| sailing_ratio | REAL | Percentage of time under sail |
| max_tws | REAL | Maximum true wind speed |
| avg_tws | REAL | Average true wind speed |
| predominant_twd | REAL | Most common wind direction |
| departure_soc | REAL | Battery SOC at departure |
| arrival_soc | REAL | Battery SOC at arrival |
| open_water_nm | REAL | Distance in open water |
| coastal_nm | REAL | Distance in coastal waters |
| channel_nm | REAL | Distance in channels/straits |
| harbour_nm | REAL | Distance in harbour approaches |
| computed_at | TIMESTAMP | When statistics were last computed |

#### `sailing_cv`

Aggregated on the hub from all synced passage data for a user.

| Column | Type | Description |
|--------|------|-------------|
| user_id | UUID | PK, FK to user |
| total_nm | REAL | Cumulative nautical miles |
| total_hours | REAL | Cumulative hours at sea |
| night_hours | REAL | Cumulative hours underway at night |
| passage_count | INTEGER | Total passages completed |
| longest_passage_nm | REAL | Longest passage by distance |
| longest_passage_hours | REAL | Longest passage by duration |
| max_offshore_nm | REAL | Furthest recorded distance from land |
| max_wind_kn | REAL | Highest true wind speed experienced |
| boats_sailed | INTEGER | Count of distinct boats |
| computed_at | TIMESTAMP | When CV was last recomputed |

---

## 11. UI/UX

### Views

#### Timeline view (default)

A vertical chronological feed of all log entries for the active or selected passage. Each entry shows:

- Timestamp (local time, with UTC on hover)
- Entry type icon and label
- Position (lat/lng, or place name if near a known port/anchorage)
- Key instrument readings (SOG, wind, depth — configurable)
- Notes (if manual entry)
- Photo thumbnails (if attached)
- Author name (for manual entries)
- Amendment indicator (if amended)

Auto-entries are visually subdued (smaller, lighter text). Manual entries and system events are visually prominent. Entries from the Watchman AI are marked with a distinct indicator.

Filters: by entry type, by author, by date range, by tag.

#### Map view

The passage track displayed on the chart with:

- Log entry markers along the track (colour-coded by type)
- Photo markers (camera icon, tap to view)
- Hover/tap on any marker to see the full entry
- Passage segments colour-coded by type (open water, coastal, channel, harbour)
- Wind barbs at auto-entry positions (optional overlay)

#### Entry form

Quick-entry interface optimised for use underway (gloves, wet hands, moving boat):

- Large touch targets
- Entry type selector (icon grid, one tap)
- Notes field (free text, large font)
- Photo capture button (launches camera)
- Tags (quick-add from recent tags, or type new)
- Submit button (prominent, bottom of screen)

The form auto-populates the current instrument snapshot. The crew only needs to select the type and add notes.

#### Passage summary

Dashboard showing computed statistics for a completed passage:

- Key numbers (distance, time, speeds, sailing ratio) in large format
- Passage composition bar (horizontal stacked bar showing segment types)
- Track on chart (mini-map)
- Wind rose
- SOG over time graph
- Battery SOC over time graph
- Crew hours breakdown
- Photo grid

#### Sailing CV view

Hub-only view showing cumulative statistics:

- Total miles, hours, passages (headline numbers)
- Miles by year (bar chart)
- Roles held (pie/donut chart)
- Boats sailed (list with type and miles)
- Regions sailed (map with track density)
- Qualifications (manually added)
- Export and share buttons

### Night mode

All logbook views support the global night mode (red-on-black) for use during night watches. The entry form is particularly important to optimise for night use — no bright elements that destroy night vision.

---

## 12. Hub vs Spoke

| Concern | Spoke (on-boat) | Hub (cloud) |
|---------|-----------------|-------------|
| Auto-logging | Runs here. Direct instrument access. | Does not auto-log. |
| Manual entries | Created here. Full offline support. | Can create entries for annotation/amendment after the fact. |
| Photos | Captured and stored here initially. | Receives photos via sync. Serves to browser users. |
| Statistics | Computed locally after each new entry. | Recomputed from synced data. |
| Hash chain | Maintained locally. Verified on hub after sync. | Stores and can verify the chain. |
| Export | PDF generation works offline. | PDF generation from hub data. |
| Sailing CV | Not computed on spoke. | Aggregated from all synced passages across all boats. |
| Storage | SQLite + local filesystem. | PostgreSQL + Supabase Storage. |

### Sync behaviour

- Log entries sync spoke-to-hub as part of the standard sync queue.
- Entries are additive (merge strategy) — both sides keep all entries, no conflict.
- Photos sync at low priority after all text entries.
- The hash chain is verified on the hub after sync to confirm integrity.
- If the spoke has been offline for an extended period, the full backlog syncs on reconnect.
- Amendments created on the hub (e.g. correcting a port name from a browser) sync back to the spoke.

---

## 13. AI Integration

### Watchman auto-logging

The Watchman orchestrator monitors all data streams and creates log entries of type `system` with source `watchman` when it detects significant events:

| Event | Trigger | Log entry content |
|-------|---------|-------------------|
| Anchor alarm | Anchor watch detects drag | "Anchor drag detected. Position shifted Xm from set point." |
| Weather change | Barometric pressure drop > 5 hPa in 3 hours | "Rapid pressure drop detected. Current: X hPa, 3hr change: -Y hPa." |
| Close quarters | AIS target CPA < configurable threshold | "Close quarters situation. Vessel [name/MMSI] CPA X nm in Y minutes." |
| Engine alarm | Engine parameter outside normal range | "Engine alarm: [parameter] at [value], threshold [limit]." |
| Bilge pump | Bilge pump activation (frequency or duration anomaly) | "Bilge pump activated. Run time: X seconds. [Nth activation in Y hours.]" |
| Battery critical | SOC below threshold | "Battery SOC critical: X%. Estimated time to cutoff: Y hours." |
| Speed anomaly | Significant speed change without sail/engine change | "Speed dropped from X to Y kn without logged sail or engine change." |
| Course deviation | Significant deviation from planned route | "Off course. XTE: Y nm from planned route." |
| Watch overdue | No watch changeover entry for > configured watch length | "Watch changeover overdue. Current watch started X hours ago." |

Watchman entries are visually distinct in the timeline (marked as AI-generated) and do not break the crew-authored hash chain. They are inserted into the entry sequence with their own hashes but flagged so legal review can distinguish human from automated entries.

### Agent queries

Any AI agent can query the logbook:

- Navigator: "What was our average SOG for the last 4 hours?"
- Engineer: "When was the engine last run and for how long?"
- Bosun: "Who is currently on watch and when does the watch end?"

The logbook exposes a query interface via the MCP server, making it accessible to external AI systems as well.
