# Plugin Architecture — Feature Specification

**Date:** 2026-03-31
**Status:** Draft
**Section:** 6.28
**Companion to:** above-deck-product-vision-v2.md, above-deck-technical-architecture.md

---

## 1. Overview

The plugin architecture is the extensibility system for the Above Deck platform. It allows third-party developers to add new MFD screens, hardware protocol adapters, data model extensions, and AI capabilities — without modifying the core platform.

Plugins run on the spoke (on-boat). The hub hosts a plugin registry for discovery and distribution, but all execution happens locally on the boat's hardware. This follows the same principle as the rest of the platform: the boat is sovereign, the hub is a service.

### Design Principles

- **Plugins extend, they don't replace.** Core platform services (data model, monitoring, alerts, sync) are not pluggable — they are stable foundations that plugins build on.
- **Safety first.** Plugins cannot write to the NMEA 2000 bus, control the autopilot, or modify digital switching unless explicitly granted permission by the boat owner. The default is observe-only, matching the core platform's "do no harm" principle.
- **No runtime dependencies.** Plugins are compiled artifacts (Go shared libraries or WASM modules), not interpreted scripts requiring a runtime. This aligns with the single-binary, no-Node.js philosophy.
- **Open distribution.** Plugins are distributed via Git repositories. No app store, no approval process, no gatekeeping. The registry indexes public repositories — it does not host or control them.

---

## 2. Plugin Types

### 2.1 Screen Plugins

Add new applications to the MFD shell.

**What they provide:**
- A React component that renders inside the MFD shell's content area
- An icon and label for the MFD app switcher
- Optional data subscriptions (which data model paths the screen needs)
- Optional AI agent integration (screen can surface agent insights)

**What they receive:**
- Access to the data model via a read-only client SDK
- Access to the MFD shell's layout system (panels, split views, overlays)
- Access to the shared theme (@above-deck/shared/theme)
- WebSocket connection for real-time data updates

**Constraints:**
- Screens render inside an iframe or sandboxed React boundary within the MFD shell
- No direct DOM access outside their container
- No access to other screens' state
- No access to raw protocol data (only the processed data model)
- Must declare required data paths in the manifest — the shell only subscribes to what the plugin needs

**Examples:**
- Fishing log with species database and GPS marking
- Anchor alarm with custom geofence shapes
- Regatta race timer and start line calculator
- Maintenance calendar with service interval tracking
- Crew watch schedule manager

### 2.2 Adapter Plugins

Add support for new hardware protocols or data sources.

**What they provide:**
- A Go module implementing the adapter interface (Connect, Parse, Map, Emit, HealthCheck)
- Protocol-specific connection logic (TCP, UDP, serial, BLE, MQTT, HTTP)
- Mapping rules from protocol-specific messages to Above Deck data model paths

**What they receive:**
- Access to the data model for writing parsed values
- Access to the adapter lifecycle (start, stop, reconnect)
- Access to the auto-discovery system (register discovery probes)
- Access to the health check system (report connection status)

**Constraints:**
- Must implement the standard adapter interface — no custom entry points
- Write access is limited to declared data model paths (manifest)
- Cannot modify data written by other adapters
- Must handle reconnection and error recovery gracefully
- Must declare resource requirements (expected message rate, memory)

**Examples:**
- Fusion stereo control via Ethernet
- Starlink dish status via local API
- custom ESP32 sensor networks via MQTT
- Furuno radar via Ethernet
- Iridium GO satellite modem status

### 2.3 Data Model Plugins

Extend the unified data model with new paths and types.

**What they provide:**
- New data model path definitions (path, type, unit, description)
- Optional aggregation rules (min, max, average over time)
- Optional threshold definitions (for the monitoring service)
- Optional SignalK path mappings (for compatibility)

**What they receive:**
- Registration in the data model — new paths are treated identically to core paths
- Time-series storage for new paths
- Monitoring service integration (thresholds trigger alerts)
- WebSocket subscriptions work for new paths
- MCP server exposes new paths to external AI systems

**Constraints:**
- New paths must live under a plugin namespace: `plugins/{plugin_id}/...`
- Cannot override or shadow core data model paths
- Must define types explicitly — no untyped data
- Path definitions are immutable once published (versioned schema)

**Examples:**
- Watermaker metrics (flow rate, salinity, membrane pressure, runtime hours)
- Dive compressor monitoring (tank pressure, fill count, motor temperature)
- Aquaculture sensors (water quality, dissolved oxygen, pH)
- Custom tank configurations (non-standard tank shapes, calibration curves)

### 2.4 AI Plugins

Add new capabilities to the AI agent runtime.

**What they provide:**
- **Agent tools** — new functions that agents can invoke (e.g., query a marina booking API, look up a spare parts catalogue)
- **RAG sources** — new knowledge bases for agent context (e.g., a manufacturer's service manual, a regional cruising guide)
- **Agent skills** — higher-level capabilities composed of multiple tools (e.g., "plan a Mediterranean passage" combining weather, tides, ports, and regulations)

**What they receive:**
- Registration in the agent tool registry — agents can discover and invoke plugin tools
- Registration in the RAG pipeline — plugin knowledge bases are searchable by agents
- Access to the data model (read-only) for context
- Access to the agent communication bus (receive queries, return responses)

**Constraints:**
- Tools must be stateless — they receive input, return output, no side effects on the data model
- RAG sources must provide embeddings in the platform's embedding format
- Tools must declare their input/output schema (JSON Schema)
- Tools cannot invoke other tools directly — only agents compose tools
- RAG sources must declare their domain (navigation, engineering, regulations, etc.) for routing
- No direct LLM access — tools provide data, agents handle LLM interaction

**Examples:**
- Marina availability checker (queries marina booking APIs)
- Spare parts lookup (searches manufacturer parts catalogues)
- Local regulations database (fishing limits, anchoring restrictions by jurisdiction)
- Race handicap calculator (PHRF, IRC rating tools)

---

## 3. Plugin Manifest

Every plugin ships a `plugin.yaml` manifest at its repository root.

```yaml
# Required metadata
id: "com.example.watermaker-monitor"      # Reverse-domain unique identifier
name: "Watermaker Monitor"
version: "1.2.0"                          # Semver
description: "Monitor and manage watermaker systems"
author: "Jane Sailor"
license: "GPL-3.0"                        # Must be GPL-compatible
repository: "https://github.com/janesailor/ad-watermaker"
min_platform_version: "1.0.0"             # Minimum Above Deck version

# Plugin type (exactly one)
type: "screen"                            # screen | adapter | data_model | ai

# Type-specific configuration
screen:
  entry: "dist/index.js"                  # Bundled React component
  icon: "droplet"                         # Tabler icon name
  label: "Watermaker"
  category: "boat-management"             # For MFD app organiser
  data_subscriptions:                     # Data model paths this screen reads
    - "plugins/com.example.watermaker-monitor/*"
    - "electrical/batteries/house/voltage"
    - "tanks/freshwater/*"

# Permissions (explicit opt-in)
permissions:
  data_read:                              # Data model paths the plugin can read
    - "electrical/*"
    - "tanks/*"
  data_write:                             # Data model paths the plugin can write (adapter/data_model only)
    - "plugins/com.example.watermaker-monitor/*"
  network:                                # External network access
    - "none"                              # none | local | internet
  hardware:                               # Hardware bus access
    - "none"                              # none | nmea2k_read | nmea2k_write | serial | usb

# Dependencies
dependencies:
  plugins: []                             # Other plugins this depends on (by ID)
  platform_services:                      # Platform services used
    - "data_model"
    - "monitoring"
    - "websocket"

# Resource hints
resources:
  memory_mb: 64                           # Expected memory usage
  cpu_intensive: false                    # Whether plugin does heavy computation
```

### Manifest Validation

The plugin host validates the manifest on install:

- All required fields present
- ID is unique (not already installed)
- Version is valid semver
- License is GPL-compatible (GPL-3.0, MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, MPL-2.0)
- Platform version requirement is met
- Declared permissions are valid paths
- No permission escalation (plugin cannot request `nmea2k_write` without `hardware: nmea2k_write`)
- Dependencies are available (other plugins installed, platform services exist)

---

## 4. Plugin Lifecycle

### 4.1 States

```
[not installed] → install → [installed/disabled]
                                ↓ enable
                           [enabled/running]
                                ↓ disable
                           [installed/disabled]
                                ↓ uninstall
                           [not installed]

[enabled/running] → update → [enabled/running] (new version)
```

### 4.2 Install

1. User provides a Git repository URL (or selects from registry)
2. Plugin host clones the repository (shallow clone, specific tag)
3. Manifest is validated
4. Permission summary displayed to user for review
5. User confirms installation and approves permissions
6. Plugin artifacts copied to local plugin directory
7. Plugin registered in spoke database (state: disabled)
8. For data_model plugins: new paths registered in the data model
9. For adapter plugins: adapter registered but not started
10. For screen plugins: screen registered in MFD app list (greyed out until enabled)
11. For AI plugins: tools/RAG sources registered but not active

### 4.3 Enable

1. User enables the plugin in MFD settings
2. Plugin host loads the plugin
3. For adapters: connection established to data source
4. For screens: React component loaded into MFD shell
5. For data_model: paths activated in data model
6. For AI: tools registered in agent tool registry, RAG sources indexed
7. Health check runs — if failed, plugin disabled with error message

### 4.4 Disable

1. User disables the plugin (or plugin fails health check)
2. For adapters: connection closed, data model paths retain last values (marked stale)
3. For screens: component unloaded from MFD shell
4. For data_model: paths remain in data model but are marked inactive
5. For AI: tools deregistered, RAG sources excluded from queries
6. Plugin state set to disabled — no resources consumed

### 4.5 Update

1. Plugin host checks Git repository for new tags
2. If newer version available, user is notified
3. User reviews changelog and initiates update
4. Plugin disabled temporarily
5. New version downloaded and validated
6. If manifest changes permissions, user must re-approve
7. Plugin re-enabled with new version
8. If update fails, previous version restored

### 4.6 Uninstall

1. User initiates uninstall
2. Plugin disabled (if running)
3. For data_model: paths removed from data model, historical data retained (orphaned but queryable)
4. Plugin artifacts deleted from disk
5. Plugin removed from database
6. For AI: RAG embeddings cleaned up

---

## 5. Sandboxing

### 5.1 Security Boundaries

Plugins operate within strict boundaries enforced by the plugin host:

| Boundary | Mechanism |
|----------|-----------|
| Data model access | Plugins can only read/write paths declared in their manifest. The data model enforces this at the path level. |
| Network access | Plugins declare `none`, `local`, or `internet`. Enforced by the plugin host — plugins do not make network calls directly; they request data through the host. |
| Filesystem access | Plugins can only read/write within their own plugin directory (`/plugins/{plugin_id}/`). No access to system files, other plugins, or the core database. |
| Hardware access | Bus write access requires explicit permission. Default is observe-only. Even with `nmea2k_read`, plugins receive data through the adapter layer, not raw bus access. |
| CPU / Memory | Resource limits enforced per plugin. Plugins exceeding declared resource hints are throttled or disabled. |
| Inter-plugin | Plugins cannot call each other directly. They communicate through the data model (one writes, another reads). |

### 5.2 Screen Plugin Sandboxing

Screen plugins have additional constraints because they run in the browser:

- Rendered inside a sandboxed iframe with `allow-scripts` only (no `allow-same-origin`, no `allow-popups`)
- Communication with the MFD shell via `postMessage` API only
- No access to cookies, localStorage, or sessionStorage of the parent frame
- CSP headers restrict external resource loading to declared domains
- Maximum bundle size enforced (declared in manifest, default 5MB)

### 5.3 What Plugins Cannot Do

- Access the core SQLite database directly
- Modify core platform configuration
- Intercept or modify data from other adapters
- Send data to the hub (only the core sync engine communicates with the hub)
- Access other users' data (plugins run on single-tenant spoke)
- Bypass the data model to read raw protocol streams
- Install other plugins
- Modify the MFD shell's navigation or chrome
- Access the AI agents' conversation history or memory

### 5.4 Permission Escalation

Some operations require explicit user confirmation beyond the initial install:

| Permission | Requires |
|-----------|----------|
| `nmea2k_write` | Per-device approval by boat owner, with safety warning |
| `network: internet` | Disclosure of which domains and why |
| `hardware: serial` | Device path approval |
| `data_write` to non-plugin paths | Not allowed — plugins write to `plugins/{id}/*` only |

---

## 6. MCP Server

### 6.1 Overview

The MCP (Model Context Protocol) server exposes the Above Deck data model to external AI systems. It runs on both hub and spoke, serving different data:

- **Spoke MCP** — live instrument data, boat configuration, local state
- **Hub MCP** — community data, almanac, weather, user's boats (across all spokes)

MCP allows tools like Claude Desktop, ChatGPT, or custom AI applications to query Above Deck data without building custom integrations.

### 6.2 Exposed Resources

The MCP server exposes the data model as MCP resources:

```
# Spoke MCP resources
abovedeck://navigation/position          — current GPS position
abovedeck://navigation/speed             — SOG, STW
abovedeck://electrical/batteries/*       — all battery banks
abovedeck://electrical/solar/*           — solar array data
abovedeck://tanks/*                      — all tank levels
abovedeck://environment/*                — temperature, humidity, pressure
abovedeck://propulsion/engines/*         — engine data
abovedeck://ais/vessels/*                — nearby AIS targets
abovedeck://notifications/alerts/*       — active alerts
abovedeck://equipment/devices/*          — installed equipment
abovedeck://plugins/*/                   — plugin-defined data (all plugins)

# Hub MCP resources
abovedeck://boats/{boat_id}/profile      — boat specifications
abovedeck://boats/{boat_id}/equipment    — equipment registry
abovedeck://almanac/pois/*               — points of interest
abovedeck://almanac/anchorages/*         — anchorage information
abovedeck://weather/forecast/*           — weather data
abovedeck://tides/*                      — tide predictions
abovedeck://routes/*                     — user's saved routes
```

### 6.3 MCP Tools

The MCP server also exposes tools that external AI systems can invoke:

```
# Query tools (read-only)
get_boat_status          — summary of all systems (batteries, tanks, engines, position)
get_weather_forecast     — weather for a location and time range
get_tide_prediction      — tide data for a station and date
get_nearby_vessels       — AIS targets within a radius
get_route_details        — passage plan with waypoints, distances, ETAs
get_equipment_list       — all installed equipment with firmware status
get_anchorage_info       — community reviews and details for an anchorage
get_alerts               — active alerts and recent history

# Plugin-provided tools are also exposed via MCP
# (registered by AI plugins, see section 2.4)
```

### 6.4 Authentication

- **Spoke MCP** — local network only, no authentication required (same as spoke API — single-tenant, trusted LAN)
- **Hub MCP** — requires API key tied to a user account. Rate limited. Subject to the same RLS policies as the REST API — a user can only access their own data.

### 6.5 Plugin Integration

Plugins that define AI tools (section 2.4) are automatically exposed via the MCP server. When an AI plugin registers a tool, the MCP server adds it to its tool list. External AI systems can discover and invoke plugin-provided tools the same way they invoke core tools.

Data model plugins (section 2.3) are similarly exposed — new data paths defined by plugins appear as MCP resources under `abovedeck://plugins/{plugin_id}/...`.

---

## 7. SDK

### 7.1 What the SDK Provides

The plugin SDK is a set of Go packages and TypeScript libraries that plugin developers use:

**Go packages (for adapter and data_model plugins):**

```go
// Plugin interface — all plugins implement this
type Plugin interface {
    ID() string
    Version() string
    Init(ctx PluginContext) error
    Start() error
    Stop() error
    HealthCheck() HealthStatus
}

// PluginContext — provided by the plugin host
type PluginContext interface {
    // Data model access (scoped to declared permissions)
    DataModel() DataModelClient
    // Logger (plugin-scoped, feeds into spoke logging)
    Logger() Logger
    // Plugin-local storage (filesystem within plugin directory)
    Storage() StorageClient
    // Configuration (user-set values for this plugin)
    Config() ConfigClient
}

// DataModelClient — read/write within declared permissions
type DataModelClient interface {
    Get(path string) (Value, error)
    Set(path string, value interface{}) error
    Subscribe(path string, handler func(Value)) (Subscription, error)
    RegisterPath(def PathDefinition) error    // data_model plugins only
}

// AdapterPlugin — extended interface for adapter plugins
type AdapterPlugin interface {
    Plugin
    Connect() error
    Disconnect() error
    Reconnect() error
    // Parse is called by the plugin host when data arrives
    // from the configured transport
    Parse(data []byte) ([]DataPoint, error)
}
```

**TypeScript packages (for screen plugins):**

```typescript
// @above-deck/plugin-sdk — available to screen plugins

// Data model client (read-only, scoped to declared subscriptions)
interface DataModelClient {
  get(path: string): Promise<Value>;
  subscribe(path: string, callback: (value: Value) => void): Unsubscribe;
}

// MFD shell integration
interface ShellClient {
  // Request layout changes
  requestPanel(position: 'left' | 'right' | 'bottom'): Promise<PanelHandle>;
  // Show notifications in the MFD status bar
  notify(message: string, level: 'info' | 'warning' | 'error'): void;
  // Access shared theme tokens
  theme: ThemeTokens;
}

// Plugin entry point
interface ScreenPlugin {
  id: string;
  version: string;
  init(context: { data: DataModelClient; shell: ShellClient }): void;
  render(): React.ReactNode;
  cleanup(): void;
}
```

**AI plugin SDK (Go):**

```go
// AIToolPlugin — interface for AI tool plugins
type AIToolPlugin interface {
    Plugin
    // Tools returns the list of tools this plugin provides
    Tools() []ToolDefinition
    // Invoke is called when an agent invokes a tool
    Invoke(toolName string, input json.RawMessage) (json.RawMessage, error)
}

// ToolDefinition — describes a tool for the agent registry
type ToolDefinition struct {
    Name        string          `json:"name"`
    Description string          `json:"description"`
    InputSchema json.RawMessage `json:"input_schema"`   // JSON Schema
    OutputSchema json.RawMessage `json:"output_schema"`  // JSON Schema
    Domain      string          `json:"domain"`          // navigation, engineering, regulations, etc.
}

// RAGSourcePlugin — interface for RAG source plugins
type RAGSourcePlugin interface {
    Plugin
    // Sources returns the knowledge bases this plugin provides
    Sources() []RAGSource
    // Query returns relevant chunks for a query
    Query(source string, query string, limit int) ([]RAGChunk, error)
}
```

### 7.2 Development Workflow

1. **Scaffold** — `abovedeck plugin init --type screen|adapter|data_model|ai` generates a project with manifest, boilerplate, and build configuration
2. **Develop** — build and test locally using the plugin SDK's mock data model and simulated MFD shell
3. **Test** — `abovedeck plugin test` runs the plugin in a sandboxed environment with synthetic data
4. **Package** — `abovedeck plugin build` produces the distributable artifact (compiled Go module or bundled JS)
5. **Publish** — push to a Git repository, optionally submit to the plugin registry

### 7.3 CLI Tool

The `abovedeck` CLI includes plugin development commands:

```bash
abovedeck plugin init --type adapter --id "com.myname.starlink"
abovedeck plugin dev                  # Hot-reload development server
abovedeck plugin test                 # Run in sandbox with mock data
abovedeck plugin build                # Produce distributable artifact
abovedeck plugin validate             # Check manifest and permissions
abovedeck plugin install <path|url>   # Install locally for testing
```

---

## 8. Distribution

### 8.1 Plugin Registry (Hub)

The hub hosts a plugin registry — a searchable index of available plugins. The registry does not host plugin code; it indexes Git repositories.

**Registry entry:**
- Plugin metadata (from manifest: id, name, description, author, version, type, license)
- Repository URL
- Install count
- Community rating (optional — simple thumbs up/down, not stars)
- Compatibility status (tested with which platform versions)
- Last updated date

**How plugins get listed:**
1. Developer pushes plugin to a public Git repository
2. Developer submits the repository URL to the registry (self-service, no approval process)
3. Registry clones the repository, validates the manifest, indexes the metadata
4. Plugin appears in the registry within minutes
5. Registry periodically re-checks repositories for new versions

### 8.2 Direct Installation

Plugins can be installed directly from any Git URL without going through the registry. The registry is a convenience, not a gate:

```bash
# From registry (by plugin ID)
abovedeck plugin install com.example.watermaker-monitor

# From any Git URL
abovedeck plugin install https://github.com/janesailor/ad-watermaker.git

# From local path (development)
abovedeck plugin install /path/to/my-plugin
```

### 8.3 Security Considerations

- All plugins must be GPL-compatible (enforced at manifest validation)
- The registry does not perform security audits — users install at their own risk
- Plugin permissions are clearly displayed before installation
- Community ratings and install counts provide social signals
- The spoke's sandboxing (section 5) limits what a malicious plugin can do
- Users can inspect plugin source code (all plugins are open source by license requirement)
- Plugin updates require explicit user action (no auto-update)

---

## 9. Data Model

### 9.1 Spoke Tables (SQLite)

```sql
-- Plugin registry (installed plugins)
CREATE TABLE plugins (
  id              TEXT PRIMARY KEY,       -- reverse-domain ID from manifest
  name            TEXT NOT NULL,
  version         TEXT NOT NULL,
  type            TEXT NOT NULL,          -- 'screen', 'adapter', 'data_model', 'ai'
  description     TEXT,
  author          TEXT,
  license         TEXT NOT NULL,
  repository      TEXT NOT NULL,
  min_platform_version TEXT,
  state           TEXT DEFAULT 'disabled', -- 'disabled', 'enabled', 'error'
  error_message   TEXT,                   -- populated when state = 'error'
  permissions     TEXT NOT NULL,          -- JSON (manifest permissions block)
  installed_at    TEXT NOT NULL,          -- ISO 8601
  updated_at      TEXT NOT NULL,
  enabled_at      TEXT                    -- NULL if never enabled
);

-- Plugin configuration (user-set values)
CREATE TABLE plugin_config (
  plugin_id       TEXT NOT NULL REFERENCES plugins(id),
  key             TEXT NOT NULL,
  value           TEXT NOT NULL,          -- JSON-encoded value
  PRIMARY KEY (plugin_id, key)
);

-- Plugin data model extensions (for data_model plugins)
CREATE TABLE plugin_data_paths (
  plugin_id       TEXT NOT NULL REFERENCES plugins(id),
  path            TEXT NOT NULL,          -- e.g., 'plugins/com.example.watermaker/flow_rate'
  data_type       TEXT NOT NULL,          -- 'float64', 'string', 'bool', 'enum', 'timestamp'
  unit            TEXT,                   -- e.g., 'litres_per_hour', 'bar', 'celsius'
  description     TEXT,
  signalk_path    TEXT,                   -- optional SignalK mapping
  PRIMARY KEY (plugin_id, path)
);

-- Plugin update history
CREATE TABLE plugin_updates (
  id              INTEGER PRIMARY KEY,
  plugin_id       TEXT NOT NULL REFERENCES plugins(id),
  from_version    TEXT NOT NULL,
  to_version      TEXT NOT NULL,
  status          TEXT NOT NULL,          -- 'success', 'failed', 'rolled_back'
  updated_at      TEXT NOT NULL
);
```

### 9.2 Hub Tables (PostgreSQL — Plugin Registry)

```sql
-- Plugin registry index
CREATE TABLE plugin_registry (
  id              TEXT PRIMARY KEY,       -- reverse-domain ID
  name            TEXT NOT NULL,
  description     TEXT,
  author          TEXT NOT NULL,
  license         TEXT NOT NULL,
  repository      TEXT NOT NULL,
  type            TEXT NOT NULL,
  latest_version  TEXT NOT NULL,
  min_platform_version TEXT,
  install_count   INTEGER DEFAULT 0,
  upvotes         INTEGER DEFAULT 0,
  downvotes       INTEGER DEFAULT 0,
  submitted_by    UUID REFERENCES auth.users(id),
  last_checked_at TIMESTAMPTZ,           -- last time registry re-validated the repo
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Plugin version history (from Git tags)
CREATE TABLE plugin_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id       TEXT NOT NULL REFERENCES plugin_registry(id),
  version         TEXT NOT NULL,
  git_tag         TEXT NOT NULL,
  manifest_snapshot JSONB NOT NULL,       -- full manifest at this version
  platform_compat TEXT[],                 -- tested platform versions
  published_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (plugin_id, version)
);

-- Plugin ratings
CREATE TABLE plugin_ratings (
  plugin_id       TEXT NOT NULL REFERENCES plugin_registry(id),
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  vote            SMALLINT NOT NULL CHECK (vote IN (-1, 1)),  -- thumbs down / thumbs up
  created_at      TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (plugin_id, user_id)
);
```

---

## 10. Hub vs Spoke

| Capability | Hub | Spoke |
|-----------|-----|-------|
| Plugin registry (discovery, search, ratings) | Yes | No |
| Plugin installation | No | Yes |
| Plugin execution | No | Yes |
| Plugin configuration | No | Yes |
| Manifest validation | Yes (registry) | Yes (install) |
| Screen plugin rendering | No | Yes (MFD shell) |
| Adapter plugin operation | No | Yes (hardware access) |
| Data model extension | No | Yes (local data model) |
| AI tool registration | No | Yes (agent runtime) |
| RAG source indexing | No | Yes (local RAG pipeline) |
| MCP exposure of plugin data | No | Yes (spoke MCP) |
| Plugin update checks | Yes (checks Git repos) | Yes (queries registry or repo) |
| Plugin SDK / CLI | N/A (developer tool) | N/A (developer tool) |

### Hub-Only Concerns

- Indexing public Git repositories for the registry
- Serving registry search API to spokes and browsers
- Tracking install counts and community ratings
- Validating manifests for registry listing (does not block direct install)

### Spoke-Only Concerns

- Loading and executing plugin code
- Enforcing sandboxing and permission boundaries
- Managing plugin lifecycle (enable, disable, health checks)
- Providing the plugin SDK runtime (data model client, storage, config)
- Exposing plugin data paths via MCP and WebSocket

### Cross-Cutting

- Plugin manifests are the contract between hub (registry) and spoke (runtime)
- The spoke queries the hub registry for available updates but can also check Git repos directly
- Plugin data is not synced to the hub — it stays on the spoke. If a plugin wants hub sync, it writes to standard data model paths that the sync engine handles.

---

## 11. API Endpoints

### 11.1 Hub Registry API (Go)

Public endpoints (no auth required for read). Prefixed with `/api/v1/plugins/`.

```
# Registry (public read)
GET    /plugins/registry                — search/list plugins (paginated, filterable by type)
GET    /plugins/registry/:id            — plugin detail with version history
GET    /plugins/registry/:id/versions   — all versions for a plugin

# Registry (authenticated)
POST   /plugins/registry                — submit a new plugin (repo URL)
DELETE /plugins/registry/:id            — remove own plugin from registry
POST   /plugins/registry/:id/vote       — upvote or downvote

# Admin (admin only)
DELETE /admin/plugins/registry/:id      — remove any plugin (spam, malicious)
```

### 11.2 Spoke Plugin API (Go)

Local-only endpoints. Prefixed with `/api/v1/plugins/`.

```
# Plugin management
GET    /plugins                         — list installed plugins
GET    /plugins/:id                     — plugin detail and status
POST   /plugins/install                 — install from URL or registry ID
POST   /plugins/:id/enable              — enable plugin
POST   /plugins/:id/disable             — disable plugin
POST   /plugins/:id/update              — update to latest version
DELETE /plugins/:id                     — uninstall plugin
GET    /plugins/:id/config              — get plugin configuration
PUT    /plugins/:id/config              — set plugin configuration
GET    /plugins/:id/health              — plugin health check
GET    /plugins/updates                 — check all plugins for available updates
```

---

## 12. Implementation Notes

- Adapter plugins are compiled Go shared libraries (`.so` / `.dylib`) loaded via `plugin.Open()`. This limits adapter plugins to the same Go version and OS/arch as the spoke binary. For broader compatibility, a future WASM-based adapter runtime is a possibility but not in scope for v1.
- Screen plugins are standard React bundles loaded into the MFD shell via dynamic import within a sandboxed iframe. They communicate with the shell through a `postMessage`-based protocol defined in the SDK.
- Data model plugins are declarative — they define paths in the manifest, and the plugin host registers them. No executable code required for pure data model extensions.
- AI plugins are Go shared libraries (same constraints as adapters). The tool interface is designed to be simple enough that most tools are a single function.
- The plugin directory on the spoke is `/opt/abovedeck/plugins/{plugin_id}/`. Each plugin gets its own directory for artifacts, configuration, and local data.
- The `abovedeck` CLI tool is distributed as a standalone Go binary, separate from the spoke. It is a developer tool, not a runtime dependency.
- Plugin hot-reload during development is supported for screen plugins (via the dev server) but not for compiled Go plugins (requires rebuild and restart).
