# Data Model — Feature Specification

**Date:** 2026-03-31
**Status:** Draft v1
**Layer:** OS Platform Service (Spoke)
**Dependencies:** Protocol Adapters, SQLite, WebSocket Server
**References:** [Technical Architecture](../../../above-deck-technical-architecture.md) sections 11-12, [Product Vision](../../../above-deck-product-vision-v2.md) section 7

---

## 1. Overview

The data model is the single source of truth for all boat data on the spoke. Every protocol adapter writes to it. Every app, AI agent, monitoring rule, and WebSocket client reads from it. No component talks to hardware directly — everything goes through the data model.

It is a hierarchical key-value store implemented as an in-memory Go data structure with SQLite persistence. Paths use forward-slash separators (`electrical/batteries/house/voltage`). Each path has a defined type, unit, valid range, and last-updated timestamp. Subscribers are notified on change via an in-process pub/sub mechanism.

Above Deck defines its own schema rather than adopting SignalK's. The reasons:

- **Optimised for our tools and AI agents** — path names and structure designed for our query patterns, not for interoperability with a Node.js ecosystem
- **Full control** — we can add paths, change types, and restructure without waiting for a standards body
- **Simpler types** — SignalK uses SI units exclusively (Kelvin, radians, m/s). Our data model stores values in the units sailors actually use (Celsius, degrees, knots) and provides conversion utilities where needed
- **Bidirectional SignalK mapping** — a mapping table translates between Above Deck paths and SignalK paths for compatibility (section 6)

---

## 2. Path Hierarchy

The complete path tree. Every leaf path stores a typed value. Branch paths are organisational — they are not directly addressable.

### navigation/

```
navigation/
  position/
    latitude                    float64     degrees (-90 to 90)
    longitude                   float64     degrees (-180 to 180)
    altitude                    float64     metres
    fix_type                    enum        none|2d|3d|dgps|rtk
    satellites                  int         count of satellites in use
    hdop                        float64     horizontal dilution of precision
  heading/
    magnetic                    float64     degrees (0-360)
    true                        float64     degrees (0-360)
    variation                   float64     degrees (-180 to 180)
    deviation                   float64     degrees (-180 to 180)
    source                      enum        compass|gps|calculated
  course/
    over_ground                 float64     degrees (0-360)
    waypoint_bearing            float64     degrees (0-360)
    cross_track_error           float64     metres
  speed/
    through_water               float64     knots (0-50)
    over_ground                 float64     knots (0-50)
    velocity_made_good          float64     knots (-50 to 50)
  depth/
    below_transducer            float64     metres (0-1000)
    below_keel                  float64     metres (0-1000)
    below_surface               float64     metres (0-1000)
    transducer_offset           float64     metres
  wind/
    apparent_angle              float64     degrees (-180 to 180)
    apparent_speed              float64     knots (0-200)
    true_angle                  float64     degrees (-180 to 180)
    true_speed                  float64     knots (0-200)
    direction_true              float64     degrees (0-360)
    direction_magnetic          float64     degrees (0-360)
  attitude/
    heel                        float64     degrees (-90 to 90, positive = starboard)
    trim                        float64     degrees (-90 to 90, positive = bow up)
    yaw                         float64     degrees (0-360)
    yaw_rate                    float64     degrees/second
  autopilot/
    state                       enum        standby|auto|track|wind
    mode                        enum        compass|wind|route|true_wind
    target_heading              float64     degrees (0-360)
    target_wind_angle           float64     degrees (-180 to 180)
    rudder_command              float64     degrees (-45 to 45)
    dead_zone                   float64     degrees (0-30)
    gain                        float64     dimensionless (0-10)
  log/
    trip                        float64     nautical miles
    total                       float64     nautical miles
```

### electrical/

```
electrical/
  batteries/{id}/               — id: house, start, bow_thruster, etc.
    voltage                     float64     volts (0-60)
    current                     float64     amps (-500 to 500, positive = charging)
    state_of_charge             float64     percent (0-100)
    state_of_health             float64     percent (0-100)
    capacity_nominal            float64     amp-hours
    capacity_remaining          float64     amp-hours
    time_remaining              float64     minutes
    temperature                 float64     celsius (-40 to 80)
    cycles                      int         charge cycle count
    chemistry                   enum        lifepo4|agm|gel|flooded|lithium_ion
    charge_state                enum        bulk|absorption|float|equalize|idle|discharging
  solar/{id}/                   — id: port_arch, starboard_arch, bimini, etc.
    voltage                     float64     volts (0-200)
    current                     float64     amps (0-100)
    power                       float64     watts (0-5000)
    daily_yield                 float64     watt-hours
    total_yield                 float64     kilowatt-hours
    efficiency                  float64     percent (0-100)
    controller_mode             enum        off|bulk|absorption|float|equalize|fault
    controller_state            string      manufacturer-specific state description
  chargers/{id}/                — id: shore_1, dc_dc_1, etc.
    state                       enum        off|bulk|absorption|float|equalize|fault
    voltage                     float64     volts (0-60)
    current                     float64     amps (0-200)
    mode                        enum        auto|manual
    input_voltage               float64     volts (0-300)
    input_current               float64     amps (0-100)
  inverters/{id}/               — id: main, galley, etc.
    state                       enum        off|inverting|passthrough|fault
    dc_voltage                  float64     volts (0-60)
    dc_current                  float64     amps (0-500)
    ac_voltage                  float64     volts (0-300)
    ac_current                  float64     amps (0-100)
    ac_frequency                float64     hertz (0-70)
    load                        float64     watts (0-10000)
    load_percent                float64     percent (0-100)
    overload                    bool
    temperature                 float64     celsius (-40 to 100)
  alternators/{id}/             — id: port_engine, starboard_engine, etc.
    voltage                     float64     volts (0-60)
    current                     float64     amps (0-300)
    temperature                 float64     celsius (-40 to 150)
    field_drive                 float64     percent (0-100)
  shore/
    connected                   bool
    voltage                     float64     volts (0-300)
    current                     float64     amps (0-100)
    frequency                   float64     hertz (0-70)
    power                       float64     watts (0-50000)
    reverse_polarity            bool
  loads/{circuit_id}/           — id: fridge, watermaker, windlass, nav_lights, etc.
    state                       bool        on/off
    dimming                     float64     percent (0-100)
    current                     float64     amps (0-100)
    power                       float64     watts (0-10000)
    fault                       bool
    fault_type                  enum        none|overcurrent|short|open_circuit|ground_fault
    locked                      bool        circuit lockout
    type                        enum        lighting|pump|motor|heater|electronics|other
```

### propulsion/

```
propulsion/
  engines/{id}/                 — id: port, starboard, genset, etc.
    rpm                         float64     revolutions per minute (0-6000)
    oil_pressure                float64     kilopascals (0-800)
    coolant_temperature         float64     celsius (0-150)
    exhaust_temperature         float64     celsius (0-800)
    fuel_rate                   float64     litres per hour (0-100)
    fuel_pressure               float64     kilopascals (0-1000)
    hours                       float64     engine hours
    boost_pressure              float64     kilopascals (0-500)
    load_percent                float64     percent (0-100)
    status                      enum        stopped|running|pre_heat|fault
    alarms/
      oil_pressure_low          bool
      coolant_temperature_high  bool
      exhaust_temperature_high  bool
      low_fuel_pressure         bool
      check_engine              bool
      water_in_fuel             bool
  transmissions/{id}/
    gear                        enum        forward|neutral|reverse
    oil_pressure                float64     kilopascals (0-800)
    oil_temperature             float64     celsius (0-150)
  fuel/
    consumption_rate            float64     litres per hour (total across engines)
    total_consumed              float64     litres (trip total)
    range                       float64     nautical miles (estimated)
```

### tanks/

```
tanks/
  fuel/{id}/                    — id: port, starboard, day, etc.
    level                       float64     percent (0-100)
    capacity                    float64     litres
    remaining                   float64     litres (calculated)
    consumption_rate            float64     litres per hour
    type                        enum        diesel|petrol|lpg
  freshwater/{id}/
    level                       float64     percent (0-100)
    capacity                    float64     litres
    remaining                   float64     litres (calculated)
    consumption_rate            float64     litres per hour
  blackwater/{id}/
    level                       float64     percent (0-100)
    capacity                    float64     litres
  greywater/{id}/
    level                       float64     percent (0-100)
    capacity                    float64     litres
  lpg/{id}/
    level                       float64     percent (0-100)
    capacity                    float64     kilograms
```

### environment/

```
environment/
  inside/{zone}/                — zone: salon, port_cabin, starboard_cabin, galley, etc.
    temperature                 float64     celsius (-40 to 60)
    humidity                    float64     percent (0-100)
    pressure                    float64     hectopascals (800-1100)
    co_level                    float64     parts per million (0-1000)
    co2_level                   float64     parts per million (0-5000)
    lpg_detected                bool
  outside/
    temperature                 float64     celsius (-40 to 60)
    humidity                    float64     percent (0-100)
    pressure                    float64     hectopascals (800-1100)
    sea_temperature             float64     celsius (-5 to 40)
    illuminance                 float64     lux (0-150000)
    uv_index                    float64     index (0-15)
  refrigeration/{id}/           — id: fridge, freezer, bait_well, etc.
    temperature                 float64     celsius (-30 to 20)
    target_temperature          float64     celsius (-30 to 20)
    compressor_running          bool
    door_open                   bool
```

### steering/

```
steering/
  rudder/{id}/                  — id: port, starboard, bow_thruster, stern_thruster
    angle                       float64     degrees (-45 to 45, positive = starboard)
  autopilot/                    — linked to navigation/autopilot (same underlying data)
```

### hvac/

```
hvac/
  zones/{id}/                   — id: salon, port_cabin, starboard_cabin, etc.
    target_temperature          float64     celsius (10-35)
    actual_temperature          float64     celsius (-10 to 50)
    mode                        enum        off|cooling|heating|auto|fan_only|dehumidify
    fan_speed                   enum        off|low|medium|high|auto
    humidity                    float64     percent (0-100)
    running                     bool
```

### switching/

```
switching/
  circuits/{id}/                — id matches electrical/loads/{circuit_id}
    state                       bool        on/off
    current                     float64     amps (0-100)
    fault                       bool
    type                        enum        breaker|relay|solid_state|fuse
    locked                      bool
    source_bus                  string      which DC or AC bus feeds this circuit
  scenes/{id}/
    name                        string
    active                      bool
    circuits                    []string    list of circuit ids and their target states
```

### notifications/

```
notifications/
  alerts/{id}/
    type                        enum        warning|alarm|critical|info
    source_path                 string      data model path that triggered the alert
    message                     string      human-readable description
    value                       float64     the value that triggered the alert
    threshold                   float64     the threshold that was exceeded
    acknowledged                bool
    acknowledged_by             string      user id
    acknowledged_at             timestamp
    created_at                  timestamp
    escalated                   bool
    silenced                    bool
    silenced_until              timestamp
  history/                      — recent cleared alerts, persisted to SQLite
```

### ais/

```
ais/
  vessels/{mmsi}/
    mmsi                        int         9-digit MMSI
    name                        string      vessel name (up to 20 chars)
    callsign                    string      radio callsign
    imo                         int         IMO number (if available)
    ship_type                   int         AIS ship type code
    position/
      latitude                  float64     degrees
      longitude                 float64     degrees
    course_over_ground          float64     degrees (0-360)
    speed_over_ground           float64     knots (0-102.2)
    heading                     float64     degrees (0-360)
    rate_of_turn                float64     degrees per minute
    nav_status                  int         AIS navigational status code
    destination                 string      reported destination
    eta                         timestamp   estimated time of arrival
    dimensions/
      length                    float64     metres
      beam                      float64     metres
      draught                   float64     metres
    cpa                         float64     nautical miles (closest point of approach)
    tcpa                        float64     minutes (time to CPA, negative = diverging)
    last_update                 timestamp
```

### cameras/

```
cameras/
  feeds/{id}/                   — id: engine_room, cockpit, stern, mast, etc.
    name                        string
    url                         string      RTSP or HTTP stream URL
    status                      enum        online|offline|error
    resolution                  string      e.g. "1920x1080"
    fps                         float64     frames per second
    night_vision                bool
    motion_detected             bool
    last_frame                  timestamp
```

### equipment/

```
equipment/
  devices/{id}/                 — id: derived from manufacturer + model + serial
    manufacturer                string
    model                       string
    serial_number               string
    nmea2000_address            int         CAN bus source address (0-253)
    nmea2000_name               int64       ISO Name (PGN 60928)
    install_date                timestamp
    category                    enum        navigation|electrical|propulsion|safety|communication|other
    firmware/
      current_version           string
      latest_version            string      populated by firmware tracker (hub)
      update_available          bool
      changelog_url             string
      last_checked              timestamp
```

---

## 3. Type System

Every leaf path in the data model has a defined type and metadata.

### Value Types

| Type | Go Type | Description |
|------|---------|-------------|
| `float64` | `float64` | Numeric values with decimal precision |
| `int` | `int64` | Whole number values |
| `string` | `string` | Text values |
| `bool` | `bool` | True/false |
| `enum` | `string` | Constrained string from a defined set of valid values |
| `timestamp` | `time.Time` | UTC timestamp |
| `[]string` | `[]string` | List of strings (e.g., scene circuit lists) |

### Path Metadata

Every registered path carries immutable metadata defined at registration time:

```go
type PathMeta struct {
    Path        string      // Full dot-separated path
    Type        ValueType   // float64, int, string, bool, enum, timestamp
    Unit        string      // Display unit: "volts", "celsius", "knots", "degrees", etc.
    Min         *float64    // Minimum valid value (nil if unbounded)
    Max         *float64    // Maximum valid value (nil if unbounded)
    EnumValues  []string    // Valid values for enum type
    Description string      // Human-readable description
    Source      string      // Which adapter or plugin registered this path
    Writable    bool        // Whether external writes are permitted (e.g., autopilot commands)
}
```

### Value Wrapper

Every stored value is wrapped with metadata:

```go
type Value struct {
    Raw       interface{}   // The typed value
    Timestamp time.Time     // When this value was last updated (UTC)
    Source    string        // Which adapter produced this value
    Quality  DataQuality   // good, stale, suspect, bad
}

type DataQuality int
const (
    QualityGood    DataQuality = iota  // Normal operation
    QualityStale                        // No update received within expected interval
    QualitySuspect                      // Value received but outside normal range
    QualityBad                          // Source reported error or value failed validation
)
```

### Validation

On every write:

1. Path must be registered (unknown paths are rejected unless from a plugin that registered them)
2. Type must match the path's registered type
3. For `float64` and `int`, value must be within `[Min, Max]` if bounds are defined. Out-of-range values are accepted but marked `QualitySuspect`
4. For `enum`, value must be in `EnumValues`. Invalid enum values are rejected
5. Timestamp must not be in the future by more than 5 seconds (clock skew tolerance)

---

## 4. Observability

The data model provides in-process pub/sub for change notification. This is how apps, AI agents, the monitoring service, and the WebSocket server receive updates without polling.

### Subscription Model

```go
type Subscription struct {
    Pattern   string            // Glob pattern: "electrical/batteries/*/voltage"
    Callback  func(path string, value Value)
    MinPeriod time.Duration     // Throttle: at most one callback per MinPeriod per path
    ID        string            // Unique subscription ID for unsubscribe
}
```

Subscribers register a glob pattern and a callback. When any matching path is updated, the callback fires. Patterns support:

- `*` — matches a single path segment (`electrical/batteries/*/voltage` matches `electrical/batteries/house/voltage`)
- `**` — matches zero or more path segments (`electrical/**` matches everything under `electrical/`)
- Exact paths — `navigation/position/latitude` matches only that path

### Delivery Guarantees

- **At-most-once** — if a subscriber's callback is slow, updates may be coalesced (the subscriber gets the latest value, not every intermediate value)
- **Non-blocking writes** — `Set()` never blocks on subscriber callbacks. Callbacks are dispatched asynchronously via a channel per subscriber
- **Subscriber backpressure** — each subscriber has a bounded channel (default 256). If the channel is full, the oldest undelivered update is dropped and a counter incremented. The subscriber can check its drop count
- **Ordering** — within a single path, updates are delivered in order. Across different paths, no ordering guarantee

### Subscriber Lifecycle

```go
// Subscribe to battery voltages, throttled to 1 update per second
subID := model.Subscribe("electrical/batteries/*/voltage", func(path string, v Value) {
    // Handle update
}, WithMinPeriod(time.Second))

// Later
model.Unsubscribe(subID)
```

### Internal Subscribers

| Subscriber | Pattern | Purpose |
|-----------|---------|---------|
| Monitoring service | `**` (all paths) | Evaluates threshold rules, triggers alerts |
| WebSocket server | Per-client subscription | Pushes real-time data to frontend |
| AI agent runtime | Per-agent data subscriptions | Agents subscribe to paths relevant to their role |
| Persistence layer | `**` (all paths, throttled) | Writes current state to SQLite |
| SignalK outbound | `**` (all paths) | Translates and exposes as SignalK delta messages |
| MCP server | On-demand | Responds to external AI queries |

---

## 5. Persistence

### Current State (SQLite)

The complete current state of the data model is persisted to SQLite so that it survives process restarts. On startup, the data model is hydrated from SQLite before protocol adapters connect.

**Table: `data_model_state`**

```sql
CREATE TABLE data_model_state (
    path        TEXT PRIMARY KEY,
    value       BLOB,           -- JSON-encoded typed value
    type        TEXT NOT NULL,   -- float64, int, string, bool, enum, timestamp
    timestamp   TEXT NOT NULL,   -- ISO 8601 UTC
    source      TEXT NOT NULL,   -- adapter that produced the value
    quality     INTEGER NOT NULL DEFAULT 0
);
```

Persistence is throttled — a background goroutine flushes dirty paths to SQLite at most once per second. Individual high-frequency paths (e.g., engine RPM at 10 Hz) are written at most once per 5 seconds to current state. The in-memory value is always authoritative.

### Time-Series (SQLite)

For historical trends, graphs, and AI analysis. Configurable per path — not every path needs history.

**Table: `data_model_history`**

```sql
CREATE TABLE data_model_history (
    path        TEXT NOT NULL,
    value       REAL,           -- numeric values only (float64/int)
    timestamp   TEXT NOT NULL,
    quality     INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (path, timestamp)
) WITHOUT ROWID;

CREATE INDEX idx_history_path_time ON data_model_history(path, timestamp DESC);
```

**Recording configuration:**

```go
type HistoryConfig struct {
    Path        string          // Exact path or glob pattern
    Interval    time.Duration   // Record at most every N duration
    Retention   time.Duration   // Delete records older than this
    Aggregation string          // For downsampling: "avg", "min", "max", "last"
}
```

Default recording intervals:

| Category | Default Interval | Default Retention |
|----------|-----------------|-------------------|
| `electrical/batteries/*/voltage` | 10 seconds | 90 days |
| `electrical/batteries/*/state_of_charge` | 1 minute | 1 year |
| `electrical/solar/*/power` | 10 seconds | 90 days |
| `electrical/solar/*/daily_yield` | 1 hour | 5 years |
| `navigation/position/*` | 5 seconds when underway | 1 year |
| `propulsion/engines/*/rpm` | 10 seconds when running | 90 days |
| `propulsion/engines/*/coolant_temperature` | 30 seconds | 90 days |
| `tanks/*/level` | 5 minutes | 1 year |
| `environment/inside/*/temperature` | 5 minutes | 90 days |
| `environment/outside/pressure` | 10 minutes | 1 year |

Users can override these defaults via configuration.

**Downsampling:**

A background job runs daily:
- Records older than 7 days are downsampled to 1-minute resolution (average)
- Records older than 30 days are downsampled to 5-minute resolution
- Records older than 90 days are downsampled to 1-hour resolution
- Records older than retention period are deleted

This keeps the SQLite database bounded. A typical cruising boat with full instrumentation generates approximately 50-100 MB of time-series data per year after downsampling.

---

## 6. SignalK Mapping

Bidirectional mapping between Above Deck paths and SignalK paths. This enables:

- **Inbound:** The SignalK protocol adapter reads from a SignalK server and writes to Above Deck data model paths
- **Outbound:** The SignalK outbound service exposes Above Deck data as SignalK-compatible delta messages

### Mapping Table

The mapping handles path translation, unit conversion, and value transformation.

```go
type SignalKMapping struct {
    AboveDeckPath string
    SignalKPath   string
    UnitConvert   func(interface{}) interface{}  // nil if no conversion needed
    Reverse       func(interface{}) interface{}  // SignalK → Above Deck conversion
}
```

### Core Mappings

| Above Deck Path | SignalK Path | Unit Conversion |
|-----------------|-------------|-----------------|
| `navigation/position/latitude` | `navigation.position.latitude` | none (both degrees) |
| `navigation/position/longitude` | `navigation.position.longitude` | none |
| `navigation/heading/magnetic` | `navigation.headingMagnetic` | degrees to radians |
| `navigation/heading/true` | `navigation.headingTrue` | degrees to radians |
| `navigation/course/over_ground` | `navigation.courseOverGroundTrue` | degrees to radians |
| `navigation/speed/through_water` | `navigation.speedThroughWater` | knots to m/s |
| `navigation/speed/over_ground` | `navigation.speedOverGround` | knots to m/s |
| `navigation/depth/below_transducer` | `environment.depth.belowTransducer` | none (both metres) |
| `navigation/depth/below_keel` | `environment.depth.belowKeel` | none |
| `navigation/wind/apparent_angle` | `environment.wind.angleApparent` | degrees to radians |
| `navigation/wind/apparent_speed` | `environment.wind.speedApparent` | knots to m/s |
| `navigation/wind/true_speed` | `environment.wind.speedTrue` | knots to m/s |
| `navigation/autopilot/state` | `steering.autopilot.state` | enum mapping |
| `electrical/batteries/{id}/voltage` | `electrical.batteries.{id}.voltage` | none (both volts) |
| `electrical/batteries/{id}/current` | `electrical.batteries.{id}.current` | none (both amps) |
| `electrical/batteries/{id}/temperature` | `electrical.batteries.{id}.temperature` | celsius to kelvin |
| `electrical/batteries/{id}/state_of_charge` | `electrical.batteries.{id}.capacity.stateOfCharge` | percent (0-100) to ratio (0-1) |
| `electrical/solar/{id}/power` | `electrical.solar.{id}.panelPower` | none (both watts) |
| `propulsion/engines/{id}/rpm` | `propulsion.{id}.revolutions` | RPM to Hz (divide by 60) |
| `propulsion/engines/{id}/oil_pressure` | `propulsion.{id}.oilPressure` | kPa to Pa |
| `propulsion/engines/{id}/coolant_temperature` | `propulsion.{id}.temperature` | celsius to kelvin |
| `propulsion/engines/{id}/fuel_rate` | `propulsion.{id}.fuel.rate` | L/hr to m3/s |
| `propulsion/engines/{id}/hours` | `propulsion.{id}.runTime` | hours to seconds |
| `tanks/fuel/{id}/level` | `tanks.fuel.{id}.currentLevel` | percent (0-100) to ratio (0-1) |
| `tanks/freshwater/{id}/level` | `tanks.freshWater.{id}.currentLevel` | percent (0-100) to ratio (0-1) |
| `tanks/blackwater/{id}/level` | `tanks.blackWater.{id}.currentLevel` | percent (0-100) to ratio (0-1) |
| `environment/inside/{zone}/temperature` | `environment.inside.temperature` | celsius to kelvin |
| `environment/outside/temperature` | `environment.outside.temperature` | celsius to kelvin |
| `environment/outside/pressure` | `environment.outside.pressure` | hPa to Pa |
| `steering/rudder/{id}/angle` | `steering.rudderAngle` | degrees to radians |
| `ais/vessels/{mmsi}/*` | SignalK AIS vessel context | composite mapping |

### Unmapped Paths

Paths that exist in Above Deck but have no SignalK equivalent (e.g., `cameras/feeds/*/url`, `equipment/devices/*/firmware/update_available`) are not exposed via SignalK. Paths in SignalK that have no Above Deck equivalent are ignored by the inbound adapter unless a plugin registers a mapping.

---

## 7. Go Implementation

### Core Interface

```go
// DataModel is the central data store for all boat data.
type DataModel interface {
    // Read operations
    Get(path string) (Value, error)
    GetAll(pattern string) map[string]Value     // Glob pattern
    GetMeta(path string) (PathMeta, error)
    ListPaths(prefix string) []string

    // Write operations
    Set(path string, raw interface{}, source string) error
    SetBatch(updates []PathUpdate, source string) error

    // Schema operations
    RegisterPath(meta PathMeta) error
    RegisterPaths(metas []PathMeta) error
    IsRegistered(path string) bool

    // Pub/sub
    Subscribe(pattern string, cb func(string, Value), opts ...SubscribeOption) string
    Unsubscribe(id string)

    // History
    GetHistory(path string, from, to time.Time, resolution time.Duration) []HistoryPoint
    ConfigureHistory(config HistoryConfig) error

    // Persistence
    Snapshot() error                // Force immediate write of all dirty paths
    Restore() error                // Load state from SQLite on startup

    // SignalK
    ToSignalK(path string) (string, interface{}, error)
    FromSignalK(skPath string, skValue interface{}) (string, interface{}, error)
}

type PathUpdate struct {
    Path  string
    Value interface{}
}
```

### Thread Safety

The data model is accessed concurrently by:
- Multiple protocol adapter goroutines (writing)
- WebSocket server goroutines (reading, per client)
- Monitoring service goroutine (reading)
- AI agent goroutines (reading)
- HTTP API handlers (reading)
- Persistence goroutine (reading)
- SignalK outbound goroutine (reading)

**Implementation approach: sharded `sync.RWMutex`**

The path namespace is sharded by top-level segment (`navigation`, `electrical`, `propulsion`, etc.). Each shard has its own `sync.RWMutex`. This allows concurrent reads and writes to different subsystems. Writes within the same shard are serialised. Reads within the same shard can proceed concurrently.

```go
type dataModelImpl struct {
    shards map[string]*shard  // key: top-level path segment
}

type shard struct {
    mu     sync.RWMutex
    values map[string]Value       // path → current value
    meta   map[string]PathMeta    // path → metadata
}
```

For `GetAll()` across shards, each shard is read-locked independently. There is no global lock. This means a cross-shard query may see a slightly inconsistent snapshot (e.g., navigation data from time T and electrical data from time T+50ms). This is acceptable for a boat data model — no cross-shard transaction semantics are needed.

For `SetBatch()`, updates are grouped by shard and applied per-shard with a single write lock acquisition per shard.

### Performance Targets

| Operation | Target |
|-----------|--------|
| `Get(path)` | < 100 ns |
| `Set(path, value)` | < 1 us (excluding subscriber notification) |
| `SetBatch(100 updates)` | < 50 us |
| `GetAll("electrical/batteries/*")` | < 10 us |
| Subscriber notification latency | < 1 ms from Set() to callback invocation |
| Memory footprint (10,000 paths) | < 50 MB |

### Startup Sequence

1. Register all built-in paths (the path tree defined in section 2)
2. Load plugin-registered paths from SQLite metadata table
3. Restore current state from `data_model_state` table
4. Mark all restored values as `QualityStale` (they may be outdated)
5. Start persistence goroutine
6. Start history recording goroutine
7. Start stale-data detector goroutine
8. Signal readiness — protocol adapters can now begin writing

### Stale Data Detection

A background goroutine periodically checks all paths. If a path has not been updated within a configurable interval (default: 2x the expected update rate), the value's quality is changed to `QualityStale`. This is how the frontend knows to grey out a gauge or show a "no data" indicator.

Expected update intervals are derived from the protocol:
- Navigation data: 1-10 seconds
- Engine data: 1-5 seconds
- Battery data: 5-30 seconds
- Tank data: 30-60 seconds
- Environmental data: 60-300 seconds
- Equipment metadata: never stale (static until changed)

---

## 8. Extension Points

Plugins and adapter plugins can extend the data model with new paths.

### Registering New Paths

A plugin calls `RegisterPath()` or `RegisterPaths()` during its initialisation phase, before it starts producing data. Registration is idempotent — registering an already-registered path with the same metadata is a no-op. Registering with different metadata is an error (first registration wins).

```go
// Example: a DIY temperature sensor plugin
err := model.RegisterPaths([]PathMeta{
    {
        Path:        "environment/inside/bilge_port/temperature",
        Type:        TypeFloat64,
        Unit:        "celsius",
        Min:         ptr(-10.0),
        Max:         ptr(60.0),
        Description: "Port hull bilge temperature",
        Source:      "plugin:bilge-temp-monitor",
        Writable:    false,
    },
    {
        Path:        "environment/inside/bilge_starboard/temperature",
        Type:        TypeFloat64,
        Unit:        "celsius",
        Min:         ptr(-10.0),
        Max:         ptr(60.0),
        Description: "Starboard hull bilge temperature",
        Source:      "plugin:bilge-temp-monitor",
        Writable:    false,
    },
})
```

### Rules for Plugin Paths

1. Plugins must use existing top-level segments (`navigation/`, `electrical/`, `environment/`, etc.) or register new top-level segments with a `plugin_` prefix (e.g., `plugin_watermaker/`)
2. Plugins must not re-register built-in paths
3. Plugin-registered paths are persisted to a `data_model_paths` SQLite table so they survive restarts
4. A plugin's paths are unregistered if the plugin is uninstalled

### SignalK Mapping for Plugin Paths

Plugins can optionally register SignalK mappings for their custom paths:

```go
model.RegisterSignalKMapping(SignalKMapping{
    AboveDeckPath: "plugin_watermaker/output/flow_rate",
    SignalKPath:   "watermaker.production.flowRate",
    UnitConvert:   nil,  // same units
    Reverse:       nil,
})
```

If no mapping is registered, the path is not exposed via SignalK.

---

## 9. Configuration

Users configure the data model via a YAML file (`/config/data-model.yaml` inside the Docker container, or `~/.abovedeck/data-model.yaml` for development).

```yaml
# Override instance IDs for physical devices
instances:
  batteries:
    - id: house
      name: "House Bank"
      nmea2000_instance: 0
    - id: start
      name: "Start Battery"
      nmea2000_instance: 1
  tanks:
    fuel:
      - id: port
        name: "Port Fuel Tank"
        capacity: 300  # litres
        nmea2000_instance: 0
      - id: starboard
        name: "Starboard Fuel Tank"
        capacity: 300
        nmea2000_instance: 1
    freshwater:
      - id: port
        name: "Port Water Tank"
        capacity: 250
        nmea2000_instance: 0

# Override history recording
history:
  - path: "electrical/batteries/house/voltage"
    interval: 5s
    retention: 180d
  - path: "navigation/position/*"
    interval: 1s  # higher resolution for track recording
    retention: 365d

# Override stale thresholds
stale_thresholds:
  "navigation/*": 10s
  "electrical/batteries/*": 60s
  "tanks/*": 120s
```

The instance mapping is critical. NMEA 2000 devices identify tank and battery instances by numeric index (0, 1, 2...). The configuration maps these to human-readable IDs used in paths (`house`, `start`, `port`, `starboard`). Without this mapping, paths would be `electrical/batteries/0/voltage` instead of `electrical/batteries/house/voltage`.

---

## 10. Data Model Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Startup                                    │
│                                                                     │
│  1. Register built-in paths                                         │
│  2. Load plugin paths from SQLite                                   │
│  3. Load configuration (instance mappings, history overrides)       │
│  4. Restore current state from SQLite                               │
│  5. Mark all values QualityStale                                    │
│  6. Start background goroutines (persistence, history, stale check) │
│  7. Signal readiness                                                │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                          Running                                    │
│                                                                     │
│  Protocol Adapters ──Set()──► Data Model ──notify──► Subscribers   │
│                               │                                     │
│                               ├──► Persistence goroutine ──► SQLite │
│                               ├──► History goroutine ──► SQLite     │
│                               └──► Stale detector ──► QualityStale  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                          Shutdown                                   │
│                                                                     │
│  1. Stop accepting writes                                           │
│  2. Flush all dirty paths to SQLite (Snapshot)                      │
│  3. Close all subscriber channels                                   │
│  4. Close SQLite connection                                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```
