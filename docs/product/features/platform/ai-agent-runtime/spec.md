# AI Agent Runtime — Feature Specification

**Date:** 2026-03-31
**Status:** Draft
**Component:** OS Platform Service (Spoke primary, Hub secondary)
**Depends on:** Data Model, Monitoring & Alerts, Sync Engine, RAG Pipeline

---

## 1. Overview

The AI Agent Runtime hosts Above Deck's six specialist agents: five domain experts and the Watchman orchestrator. It manages their lifecycle, routes messages between users and agents, provides tool execution, feeds agents with live boat data and RAG context, and enables inter-agent collaboration.

The runtime is a custom agent framework built in Go. It is not a general-purpose agent framework — it is purpose-built for the marine domain, tightly integrated with the data model, monitoring service, and protocol adapters.

Agents are first-class platform services, not a feature bolted onto an app. They run continuously on the spoke, watching data streams, monitoring conditions, and proactively alerting. They are also available as conversational assistants through the chat interface and as visual dashboards within the MFD shell.

The runtime runs primarily on the spoke (on-boat), where it has direct access to live instrument data. LLM calls are proxied through the hub when connectivity is available. When offline, agents queue questions that require LLM reasoning and answer them when connectivity returns. Simple threshold-based monitoring and alerting continues to function without LLM access.

---

## 2. Agent Architecture

Each agent is a Go struct that encapsulates identity, knowledge, capabilities, and state.

```go
type Agent struct {
    ID              string
    Name            string           // "Navigator", "Engineer", etc.
    Role            string           // One-line role description
    SystemPrompt    string           // Personality, expertise, communication style
    DataSubscriptions []string       // Data model paths this agent monitors
    Tools           []ToolDefinition // Tools this agent can invoke
    RAGSources      []string         // Knowledge base collections this agent queries
    AlertRules      []string         // Rule IDs this agent owns/monitors
    State           AgentState       // running, stopped, error
    Conversations   []Conversation   // Active conversation contexts
    MessageChan     chan Message      // Inbound message channel
    Health          HealthStatus
}

type AgentState string
const (
    AgentRunning  AgentState = "running"
    AgentStopped  AgentState = "stopped"
    AgentError    AgentState = "error"
    AgentStarting AgentState = "starting"
)

type HealthStatus struct {
    State          AgentState
    LastHeartbeat  time.Time
    LastLLMCall    time.Time
    ErrorCount     int
    Uptime         time.Duration
    MessagesHandled int64
}
```

### 2.1 System Prompts

Each agent has a carefully crafted system prompt that defines:

- **Identity:** Name, role, and expertise area.
- **Personality:** Communication style and tone. Direct and knowledgeable, like a competent crew member. Not chatty, not robotic.
- **Context:** The boat they serve (make, model, equipment, systems). Injected from the boat profile at startup.
- **Boundaries:** What the agent does and does not do. What it escalates to other agents.
- **Data awareness:** What instrument data it has access to and what it means.
- **Safety:** Always err on the side of caution. Never downplay a safety concern. Always recommend professional inspection for anything structural or safety-critical.

System prompts are stored as text files in the spoke's configuration directory, allowing users to customise agent behaviour.

### 2.2 Data Subscriptions

Agents subscribe to data model paths and receive updates via the internal pub/sub system. Subscriptions are evaluated on data change (not polling). An agent can subscribe to:

- Specific paths: `electrical/batteries/house/voltage`
- Wildcard paths: `propulsion/engines/*/coolantTemp`
- Subtrees: `navigation/*`

Subscription updates are delivered to the agent's `MessageChan` as `DataUpdate` messages. The agent's monitoring logic evaluates these against its alert rules and decides whether to act.

---

## 3. The Six Agents

### 3.1 Watchman (Orchestrator)

The Watchman is not a domain specialist — it is the coordinator. It runs the 24-hour watch.

**Role:** Route user messages to the right specialist. Monitor all data streams for anomalies. Triage alerts. Coordinate multi-agent tasks. Be the default agent when the user does not address a specific specialist.

**Data access:** All data model paths (read-only overview). Does not deep-dive into any domain — delegates to specialists.

**Tools:** `route_to_agent`, `get_agent_status`, `get_active_alerts`, `get_boat_summary`.

**RAG sources:** General cruising knowledge, platform help documentation.

**Behaviour:**
- Receives all user messages first. Decides whether to answer directly or route to a specialist.
- Monitors active alerts and escalates if needed.
- Coordinates when a question spans multiple domains (e.g., "Can we leave tomorrow?" requires Navigator for weather/tides, Engineer for fuel/battery state, Pilot for port info).
- Provides a daily summary if requested: weather, systems status, upcoming maintenance, alerts.
- Not a user-facing chat agent in the traditional sense — users can talk to it, but its primary function is orchestration.

### 3.2 Navigator

**Role:** Route planning, weather analysis, tidal gates, departure timing, chart information, circumnavigation planning.

**Data access:** `navigation/*`, `ais/*`, `environment/outside/*`.

**Tools:** `weather_forecast`, `tide_prediction`, `chart_lookup`, `route_calculate`, `ais_query`, `sunrise_sunset`, `great_circle_distance`, `waypoint_lookup`.

**RAG sources:** Cruising almanac, pilot books, cruising season data, weather pattern guides, passage reports.

**Alert rules:** AIS CPA warnings, weather threshold alerts, shallow depth alerts (in context of route).

**Behaviour:**
- Answers questions about weather windows, tidal gates, passage timing.
- Evaluates routes against weather, tides, and boat capabilities.
- Monitors AIS targets and warns about close-quarters situations.
- Proactively suggests departure times based on tidal gates and weather.
- Collaborates with Engineer (fuel range, battery endurance) and Pilot (port approach, local hazards).

### 3.3 Engineer

**Role:** Boat systems, power management, engine monitoring, maintenance scheduling, fault diagnosis, energy planning.

**Data access:** `electrical/*`, `propulsion/*`, `tanks/*`, `environment/inside/*`, `switching/*`.

**Tools:** `equipment_lookup`, `maintenance_schedule`, `power_calculation`, `fuel_consumption`, `service_history`, `firmware_check`.

**RAG sources:** Manufacturer manuals, equipment specifications, maintenance guides, electrical theory, engine troubleshooting.

**Alert rules:** Battery voltage, engine temperature, oil pressure, fuel level, circuit faults, bilge pump activity, tank levels, shore power.

**Behaviour:**
- Monitors all electrical, propulsion, and tank systems continuously.
- Diagnoses faults based on instrument readings and equipment knowledge.
- Tracks maintenance schedules and warns when service is due.
- Calculates power budgets (solar input vs consumption, time to empty battery bank).
- Answers questions about equipment specifications, wiring, and system design.
- Can create custom monitoring rules based on the boat's specific equipment.

### 3.4 Radio Operator

**Role:** VHF procedures, DSC, AIS interpretation, vessel identification, maritime communications protocols.

**Data access:** `ais/*`, `navigation/position/*`.

**Tools:** `ais_query`, `mmsi_lookup`, `vhf_channel_guide`, `dsc_procedure`.

**RAG sources:** VHF procedure guides, ITU regulations, GMDSS procedures, port VHF channels, reporting procedures.

**Alert rules:** AIS target CPA (collaborates with Navigator).

**Behaviour:**
- Identifies AIS targets (vessel name, type, destination, CPA/TCPA).
- Advises on correct VHF procedures for any situation.
- Guides DSC calling procedures.
- Already built as the VHF simulator — the Radio Operator is the sim's instructor persona elevated to a full agent with live AIS data.
- Proactively identifies interesting AIS targets (e.g., "That's the container ship MSC Fantasia, 400m LOA, CPA 1.2nm in 15 minutes").

### 3.5 Bosun

**Role:** Provisioning, checklists, watch schedules, anchor watch, inventory management, crew welfare.

**Data access:** `navigation/position/*`, `environment/*`, `tanks/freshwater/*`.

**Tools:** `checklist_lookup`, `inventory_query`, `watch_schedule`, `anchor_watch_status`, `provision_calculator`.

**RAG sources:** Provisioning guides, passage checklists, safety equipment requirements, watch schedule best practices.

**Alert rules:** Anchor drag, water tank levels.

**Behaviour:**
- Manages anchor watch (works with the dedicated anchor watch app, providing AI interpretation of drift patterns).
- Generates and tracks passage preparation checklists.
- Tracks provisions and water consumption, estimates remaining days.
- Manages watch schedules for crew.
- Monitors weather inside the boat (temperature, humidity) for crew comfort.

### 3.6 Pilot

**Role:** Local knowledge, port information, customs procedures, marina recommendations, approach notes, cruising regulations.

**Data access:** `navigation/position/*`, `ais/*`.

**Tools:** `poi_lookup`, `port_info`, `customs_requirements`, `marina_search`, `anchorage_search`, `regulation_lookup`, `insurance_requirements`.

**RAG sources:** Cruising almanac, pilot books, port guides, customs/immigration databases, cruising forums and community reviews, insurance guides.

**Alert rules:** None typically — Pilot is advisory, not monitoring.

**Behaviour:**
- Provides local knowledge for the current position or destination.
- Advises on customs and immigration procedures for each country.
- Recommends marinas, anchorages, and facilities based on the boat's needs.
- Warns about local regulations (anchoring restrictions, marine park rules, equipment requirements).
- Shares community reviews and recent reports from other sailors.
- Knows approach procedures and hazards for ports and anchorages.

---

## 4. Agent Lifecycle

The runtime manages agents through a defined lifecycle.

### 4.1 Startup

On spoke boot:
1. Runtime initialises, loads agent configurations from disk.
2. Each agent is instantiated with its system prompt, tools, and subscriptions.
3. Boat profile is injected into each agent's system prompt context.
4. Data subscriptions are registered with the data model pub/sub.
5. Agent state set to `running`.
6. Health check goroutine started for each agent.

### 4.2 Health Checks

Each agent emits a heartbeat every 30 seconds. The runtime monitors:

- Heartbeat recency (stale = possible hang).
- Error count (too many errors = restart).
- Message channel depth (backpressure = agent is overwhelmed or stuck).
- LLM call success rate (connectivity issues vs agent bugs).

### 4.3 Restart

If an agent enters an error state or becomes unresponsive:

1. Runtime logs the failure with context.
2. Agent goroutine is cancelled.
3. New agent instance is created with fresh state.
4. Conversation history is preserved (stored in SQLite, not in-memory).
5. Agent is restarted.
6. After 3 restart failures in 10 minutes, the agent is placed in `stopped` state and an alert is raised.

### 4.4 Shutdown

On spoke shutdown:
1. Runtime signals all agents to stop.
2. Agents complete in-flight LLM calls or cancel them (configurable timeout: 10s).
3. Conversation state is persisted to SQLite.
4. Data subscriptions are unregistered.
5. Agent goroutines exit cleanly.

---

## 5. Message Routing

### 5.1 User to Agent

```
User sends message via chat UI
        │
        ▼
   WebSocket → API server → Runtime
        │
        ▼
   Watchman receives message
        │
        ├── Watchman can answer directly (simple question, status query)
        │
        ├── Watchman routes to specialist (domain-specific question)
        │   └── "What's the weather tomorrow?" → Navigator
        │   └── "Why is my battery voltage dropping?" → Engineer
        │   └── "What VHF channel for this port?" → Radio Operator
        │
        └── Watchman coordinates multi-agent response
            └── "Can we leave tomorrow?" → Navigator + Engineer + Pilot
```

### 5.2 Routing Decision

The Watchman uses a lightweight classification step to route messages. This is an LLM call with a constrained output schema:

```go
type RoutingDecision struct {
    TargetAgent string   // "navigator", "engineer", "radio", "bosun", "pilot", "watchman"
    Confidence  float64  // 0.0 - 1.0
    MultiAgent  bool     // Requires input from multiple agents
    Agents      []string // If multi-agent, which agents
    Reasoning   string   // Brief explanation (for debugging/logging)
}
```

If connectivity is unavailable for the routing LLM call, the Watchman falls back to keyword-based routing (e.g., "weather", "tide" -> Navigator; "battery", "engine", "fuel" -> Engineer).

### 5.3 Inter-Agent Communication

Agents can consult each other. This is mediated by the runtime, not direct agent-to-agent calls.

```go
type InterAgentMessage struct {
    FromAgent   string
    ToAgent     string
    Query       string
    Context     map[string]interface{} // Relevant data for the receiving agent
    ResponseChan chan InterAgentResponse
    Timeout     time.Duration
}
```

Example flow:
1. Navigator needs to know fuel range for a passage plan.
2. Navigator sends an inter-agent message to Engineer: "What is the current fuel range at 6 knots?"
3. Runtime delivers the message to Engineer's channel.
4. Engineer calculates based on tank levels, consumption rate, and speed.
5. Engineer responds with the answer.
6. Navigator incorporates the answer into its passage plan response.

Inter-agent messages are not shown in the user's chat unless the user has enabled verbose/debug mode.

### 5.4 Response Delivery

Agent responses are streamed to the user via WebSocket:

```json
{
  "type": "agent.message",
  "agent": "navigator",
  "content": "Based on the current weather...",
  "streaming": true,
  "conversation_id": "conv-123",
  "tools_used": ["weather_forecast", "tide_prediction"],
  "metadata": {
    "llm_model": "claude-sonnet-4-20250514",
    "tokens_used": 1247,
    "latency_ms": 2340
  }
}
```

---

## 6. Tool Registry

Agents invoke tools to access data and perform actions. Tools are registered centrally and available to agents based on their configuration.

### 6.1 Tool Definition

```go
type ToolDefinition struct {
    Name        string                 // Unique tool name
    Description string                 // What the tool does (included in LLM context)
    Parameters  map[string]ToolParam   // Input parameters
    Returns     string                 // Description of return value
    Handler     ToolHandler            // Go function that executes the tool
    Agents      []string               // Which agents can use this tool ("*" = all)
    Category    string                 // "navigation", "weather", "electrical", "reference", etc.
    RequiresNet bool                   // Whether the tool needs internet
    Timeout     time.Duration          // Maximum execution time
}

type ToolParam struct {
    Type        string // "string", "number", "boolean", "object", "array"
    Description string
    Required    bool
    Enum        []string // Allowed values, if constrained
}

type ToolHandler func(ctx context.Context, params map[string]interface{}) (interface{}, error)
```

### 6.2 Built-in Tools

**Navigation & Weather:**
| Tool | Description | Network |
|------|-------------|---------|
| `weather_forecast` | Get weather forecast for location and time range | Yes |
| `tide_prediction` | Get tide predictions for a station | Yes (cached locally) |
| `chart_lookup` | Query chart data for a position or area | No (local charts) |
| `route_calculate` | Calculate route between waypoints (distance, bearing, ETA) | No |
| `ais_query` | Query current AIS targets (by MMSI, name, area, CPA) | No (live data) |
| `sunrise_sunset` | Calculate sun/moon rise/set for position and date | No |
| `great_circle_distance` | Calculate distance between two positions | No |
| `waypoint_lookup` | Look up saved waypoints by name or proximity | No |

**Electrical & Propulsion:**
| Tool | Description | Network |
|------|-------------|---------|
| `equipment_lookup` | Query equipment registry (specs, manuals, install date) | No |
| `maintenance_schedule` | Query/update maintenance schedule | No |
| `power_calculation` | Calculate power budget (generation vs consumption) | No |
| `fuel_consumption` | Estimate fuel consumption at given speed and conditions | No |
| `service_history` | Query service/maintenance history for equipment | No |
| `firmware_check` | Check for firmware updates for installed equipment | Yes |

**Reference & Community:**
| Tool | Description | Network |
|------|-------------|---------|
| `poi_lookup` | Search points of interest by location and type | No (synced) |
| `port_info` | Get port information (facilities, approach, contacts) | No (synced) |
| `customs_requirements` | Get customs/immigration requirements for a country | No (synced) |
| `marina_search` | Search marinas by location, facilities, price | No (synced) |
| `anchorage_search` | Search anchorages with reviews and conditions | No (synced) |
| `regulation_lookup` | Look up maritime regulations for an area | No (synced) |
| `mmsi_lookup` | Look up vessel details by MMSI number | Yes (cached) |

**Platform:**
| Tool | Description | Network |
|------|-------------|---------|
| `checklist_lookup` | Get/create checklists (departure, arrival, passage) | No |
| `inventory_query` | Query provisions/spares inventory | No |
| `anchor_watch_status` | Get anchor watch state (drift, radius, alerts) | No |
| `vhf_channel_guide` | Get VHF channel assignments for a region/port | No (synced) |
| `get_active_alerts` | List currently active alerts | No |
| `get_boat_summary` | Get a summary of all boat systems state | No |

### 6.3 Tool Execution

Tools are executed within the Claude API's structured `tool_use` flow:

1. Agent receives a user message.
2. The message, system prompt, conversation history, and available tools are sent to Claude.
3. Claude responds with a `tool_use` block specifying which tool to call and with what parameters.
4. The runtime validates the tool call (authorised agent, valid parameters, within timeout).
5. The runtime executes the tool handler.
6. The tool result is sent back to Claude as a `tool_result`.
7. Claude generates a final response incorporating the tool result.
8. Multiple tool calls per turn are supported (parallel and sequential).

### 6.4 Tool Auditing

All tool invocations are logged:

```sql
CREATE TABLE tool_invocations (
    id          TEXT PRIMARY KEY,
    agent_id    TEXT NOT NULL,
    tool_name   TEXT NOT NULL,
    parameters  TEXT NOT NULL,      -- JSON
    result      TEXT,               -- JSON (truncated if large)
    success     INTEGER NOT NULL,
    error       TEXT,
    duration_ms INTEGER NOT NULL,
    created_at  TEXT NOT NULL
);
```

---

## 7. RAG Pipeline

The RAG (Retrieval-Augmented Generation) pipeline provides agents with relevant knowledge from curated databases.

### 7.1 Ingestion

Documents are processed through:

1. **Chunking** — documents are split into semantically coherent chunks (500-1000 tokens). Headings, sections, and paragraph boundaries are respected.
2. **Embedding** — each chunk is embedded using a text embedding model.
   - Hub: API-based embedding model (e.g., Voyage, OpenAI, or Claude embeddings).
   - Spoke: Ollama + nomic-embed-text for local embedding generation.
3. **Storage** — embeddings stored in pgvector (hub) or sqlite-vec (spoke).
4. **Metadata** — each chunk retains source document, section, page, tags, and last-updated timestamp.

### 7.2 Sources by Agent

| Agent | RAG Sources |
|-------|-------------|
| Watchman | General cruising knowledge, platform documentation |
| Navigator | Pilot books, cruising seasons, weather patterns, passage reports, cruising almanac |
| Engineer | Manufacturer manuals, equipment specs, maintenance guides, electrical theory, engine troubleshooting |
| Radio Operator | VHF procedure guides, ITU regulations, GMDSS procedures, port VHF directories |
| Bosun | Provisioning guides, safety checklists, watch schedule guides, passage preparation |
| Pilot | Cruising almanac, port guides, customs databases, community reviews, insurance guides, regulations |

### 7.3 Query Pipeline

When an agent needs knowledge:

1. **Query formulation** — the agent (via Claude) formulates a search query based on the user's question and conversation context.
2. **Embedding** — the query is embedded using the same model as ingestion.
3. **Vector search** — nearest-neighbour search in the agent's configured RAG sources. Top-k results (default k=5, configurable per agent).
4. **Reranking** — (optional) results reranked by relevance using a cross-encoder or LLM-based reranking.
5. **Context assembly** — retrieved chunks are assembled into a context block, with source attribution.
6. **Injection** — the context block is injected into the LLM call as part of the system message or a dedicated context section.

### 7.4 Hub-to-Spoke RAG Sync

The hub maintains the canonical, full RAG database. The spoke stores a regional/topical subset for offline use.

- On sync, the spoke requests RAG updates for its configured regions and topics.
- The hub sends delta updates (new/changed/deleted chunks since last sync).
- Regional selection: the spoke can configure geographic regions of interest (e.g., "Mediterranean", "Caribbean"). Only chunks tagged with those regions are synced.
- Topic selection: all agents' RAG sources are synced by default. Users can exclude topics to save disk space.
- Typical spoke RAG database: 50MB-500MB depending on regions and topics selected.

---

## 8. LLM Integration

### 8.1 Claude API

All agent reasoning uses the Claude API via Anthropic's HTTP API:

- Model: configurable per agent (default: Claude Sonnet for most agents, Claude Haiku for routing decisions).
- Structured `tool_use` for all agent actions.
- Streaming responses for real-time chat experience.
- System prompts include boat context, data subscriptions state, and RAG context.
- Conversation history managed per-agent per-user (stored in SQLite).

### 8.2 Request Construction

```go
type LLMRequest struct {
    Model       string
    System      string           // Agent system prompt + boat context + RAG context
    Messages    []Message        // Conversation history
    Tools       []ToolDefinition // Agent's available tools
    MaxTokens   int
    Stream      bool
    Temperature float64          // Low for factual agents, slightly higher for Pilot/Bosun
}
```

### 8.3 Hub-Proxied LLM Calls

The spoke does not call the Claude API directly. All LLM requests are proxied through the hub:

1. Spoke sends LLM request to hub via HTTPS.
2. Hub validates the request (auth, rate limiting).
3. Hub forwards to Claude API.
4. Hub streams the response back to the spoke.
5. Hub logs usage for analytics (no content stored).

This centralises API key management and allows the hub to handle billing, rate limiting, and model selection.

### 8.4 Offline Behaviour

When the spoke has no internet:

- Agents continue monitoring data streams and evaluating alert rules (no LLM required for threshold-based monitoring).
- User chat messages are queued. The agent responds with: "I've noted your question. I'll answer when connectivity is restored."
- Queued questions are answered in order when connectivity returns.
- Simple, pre-computed responses can be served offline (e.g., "Current battery voltage is 12.8V" does not need an LLM).
- Future: local LLM (Ollama + small model) for basic conversational responses when offline. Not in scope for initial release.

---

## 9. Proactive Monitoring

Agents are not just reactive (answering questions) — they proactively watch data streams and alert without being asked.

### 9.1 Agent-Driven Alerts

Each agent can create monitoring rules through the Monitoring & Alerts service. These are tagged with `category: "agent"` and the agent's ID.

Examples:
- **Engineer** creates a rule: "Battery voltage has been below 12.6V for 4 hours with no solar charging — cloud cover may be affecting solar output."
- **Navigator** creates a rule: "Wind is forecast to exceed 25kt at the current anchorage in 6 hours."
- **Bosun** creates a rule: "Water consumption rate suggests you have 3 days of freshwater remaining."

### 9.2 Proactive Notifications

Beyond alerts, agents can send proactive notifications through the chat:

- **Navigator:** "Weather window opening tomorrow 0600-1800 for the crossing to [destination]. Winds SW 10-15kt, seas 0.5-1m."
- **Engineer:** "House battery bank will reach 50% SOC in approximately 2 hours at current consumption rate. Consider starting the engine or reducing loads."
- **Pilot:** "You are approaching [port]. Here's what you need to know about the approach..."
- **Bosun:** "It's been 30 days since the last engine oil check on your maintenance schedule."

### 9.3 Proactive vs Intrusive

Proactive notifications are governed by:
- **User preferences:** Users can configure notification verbosity per agent (silent, critical-only, normal, verbose).
- **Do-not-disturb:** Quiet hours where only critical/emergency notifications are delivered.
- **Cooldown:** Same notification is not repeated within a configurable window.
- **Relevance:** Agents only notify about conditions that are actionable or time-sensitive.

---

## 10. Hub vs Spoke

### 10.1 Spoke (On-Boat) — Primary Runtime

The spoke is where agents live. This is by design: agents need direct access to live instrument data, and they need to function offline.

**Runs on spoke:**
- All six agents (Watchman + five specialists)
- Data subscriptions (live instrument feeds)
- Tool execution (most tools work locally)
- RAG query pipeline (sqlite-vec for local vector search)
- Conversation history storage
- Proactive monitoring goroutines
- Alert rule evaluation (via Monitoring & Alerts service)

### 10.2 Hub (Cloud) — Support Services

The hub provides services that the spoke cannot run locally.

**Runs on hub:**
- LLM API proxy (Claude API calls)
- RAG database maintenance (canonical embedding storage, updates)
- RAG sync endpoint (spoke pulls regional subsets)
- Agent analytics (usage, performance, error rates — no conversation content)
- Weather/tide data proxy (tools that need external APIs)
- Firmware version checking

### 10.3 Hub-Only Agent Access

When a user accesses Above Deck via the web (no spoke), agents are available with reduced capability:

- No live instrument data (agents work from last-synced boat profile and equipment registry).
- All tools that do not require live data work normally (weather, tides, charts, POI lookup, RAG queries).
- Conversation history is stored on the hub.
- Useful for planning (passage planning from home, researching a destination, checking customs requirements).

---

## 11. MCP Server

The Model Context Protocol (MCP) server exposes the Above Deck data model to external AI systems.

### 11.1 Purpose

Any MCP-compatible AI client (Claude Desktop, Cursor, custom tools) can connect to the Above Deck MCP server and access boat data, agent state, and platform services.

### 11.2 Exposed Resources

**Instrument Data (read-only):**
- `navigation/position`, `navigation/speed`, `navigation/heading`, `navigation/depth`
- `navigation/wind/apparent`, `navigation/wind/true`
- `electrical/batteries/*`, `electrical/solar/*`
- `propulsion/engines/*`
- `tanks/*`
- `environment/*`

**Boat Configuration (read-only):**
- Boat profile (make, model, dimensions, displacement)
- Equipment registry (installed equipment, specs, firmware versions)
- System configuration

**Routes & Passages (read-only):**
- Active route, waypoints
- Passage plan (if active)
- Track history

**Almanac & POI (read-only):**
- Nearby POIs, marinas, anchorages
- Port information
- Local regulations

**Agent State (read-only):**
- Active agents and their status
- Active alerts
- Recent agent interactions (summaries, not full conversations)

**Tools (callable):**
- Weather forecast
- Tide predictions
- AIS query
- Chart lookup
- Equipment lookup
- POI search

### 11.3 MCP Server Implementation

```go
type MCPServer struct {
    DataModel   *DataModel
    ToolRegistry *ToolRegistry
    AgentRuntime *AgentRuntime
    Auth        *AuthMiddleware  // API key or JWT required
}
```

The MCP server runs on both spoke and hub:
- **Spoke MCP:** Full access to live instrument data, all tools. Accessible on the boat's local network.
- **Hub MCP:** Access to last-synced boat data, reference tools, and RAG. Accessible from anywhere with auth.

### 11.4 Security

- MCP access requires authentication (API key or JWT).
- All data exposed via MCP is read-only by default.
- Tool invocations are rate-limited and audited.
- No write access to boat systems via MCP (prevent external AI from controlling autopilot, switching, etc.).
- Users can disable MCP entirely or restrict which resources are exposed.

---

## 12. Data Model

### 12.1 Agent Configuration

```sql
CREATE TABLE agent_config (
    id              TEXT PRIMARY KEY,     -- 'watchman', 'navigator', etc.
    name            TEXT NOT NULL,
    role            TEXT NOT NULL,
    system_prompt   TEXT NOT NULL,
    enabled         INTEGER NOT NULL DEFAULT 1,
    data_subscriptions TEXT NOT NULL,     -- JSON array of paths
    tools           TEXT NOT NULL,        -- JSON array of tool names
    rag_sources     TEXT NOT NULL,        -- JSON array of collection names
    alert_rules     TEXT,                 -- JSON array of rule IDs
    notification_level TEXT DEFAULT 'normal', -- 'silent', 'critical', 'normal', 'verbose'
    llm_model       TEXT DEFAULT 'claude-sonnet-4-20250514',
    temperature     REAL DEFAULT 0.3,
    updated_at      TEXT NOT NULL
);
```

### 12.2 Conversations

```sql
CREATE TABLE conversations (
    id          TEXT PRIMARY KEY,
    user_id     TEXT,                -- NULL for proactive agent messages
    agent_id    TEXT NOT NULL,
    started_at  TEXT NOT NULL,
    last_message_at TEXT NOT NULL,
    message_count INTEGER DEFAULT 0,
    metadata    TEXT                  -- JSON: summary, tags
);

CREATE TABLE messages (
    id              TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id),
    role            TEXT NOT NULL,    -- 'user', 'assistant', 'system', 'tool_use', 'tool_result'
    agent_id        TEXT,             -- Which agent sent/received this
    content         TEXT NOT NULL,
    tool_calls      TEXT,             -- JSON: tool invocations in this message
    tokens_used     INTEGER,
    created_at      TEXT NOT NULL
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
```

### 12.3 Tool Invocations

(Defined in section 6.4 above.)

### 12.4 Agent Health Log

```sql
CREATE TABLE agent_health_log (
    id          TEXT PRIMARY KEY,
    agent_id    TEXT NOT NULL,
    event       TEXT NOT NULL,       -- 'started', 'stopped', 'error', 'restarted', 'health_check'
    details     TEXT,                -- JSON: error message, restart reason, etc.
    created_at  TEXT NOT NULL
);
```

---

## 13. API Endpoints

```
GET    /api/v1/agents              — list all agents and their status
GET    /api/v1/agents/:id          — get agent detail and health
POST   /api/v1/agents/:id/restart  — restart an agent
PUT    /api/v1/agents/:id/config   — update agent configuration

POST   /api/v1/chat                — send a message (routed via Watchman)
POST   /api/v1/chat/:agent         — send a message directly to a specific agent
GET    /api/v1/conversations       — list conversations
GET    /api/v1/conversations/:id   — get conversation with messages

GET    /api/v1/tools               — list available tools
GET    /api/v1/tools/:name         — get tool detail
GET    /api/v1/tools/invocations   — query tool invocation log
```

### WebSocket

Agent messages are streamed to the frontend via WebSocket:

```json
{
  "type": "agent.stream",
  "agent": "navigator",
  "conversation_id": "conv-123",
  "content": "Based on the ",
  "done": false
}

{
  "type": "agent.tool_use",
  "agent": "navigator",
  "tool": "weather_forecast",
  "parameters": {"lat": 36.7, "lng": -4.4, "hours": 48},
  "status": "executing"
}

{
  "type": "agent.proactive",
  "agent": "engineer",
  "severity": "info",
  "content": "House battery bank at 65% SOC. At current consumption, you have approximately 8 hours until 20% SOC."
}
```
