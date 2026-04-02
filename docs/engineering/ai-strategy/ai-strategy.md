# Above Deck — AI Engineering Strategy

**Date:** 2026-03-31
**Status:** Draft v1
**Companion to:** above-deck-product-vision-v2.md, above-deck-technical-architecture.md, ai-agent-runtime spec
**License:** GPL — foundation-owned, community-driven

---

## 1. AI Vision

### The crew IS the product

Above Deck is not a sailing platform with AI bolted on. The five specialist AI agents — Navigator, Engineer, Radio Operator, Bosun, and Pilot — plus the Watchman orchestrator are the platform's identity. They are the reason a sailor chooses Above Deck over the fragmented landscape of mediocre apps.

Every feature in the platform is a tool that agents wield. The chartplotter exists so the Navigator can show you a route. The energy dashboard exists so the Engineer can explain your power budget. The almanac exists so the Pilot can tell you about the harbour you are approaching. The tools have visual UIs for direct interaction, but the agents are the connective tissue that makes the platform more than the sum of its parts.

### Core AI principles

**Features are tools, not destinations.** When a new feature is designed, the first question is "which agent uses this, and how?" Every data source, every calculation, every database query is exposed as a tool that agents can invoke. The visual UI and the agent interface are parallel paths to the same capability.

**The chat interface is as important as the visual UI.** A sailor at the helm in rough weather cannot navigate a complex UI. They can say "Navigator, what's my ETA?" or "Engineer, how long until my batteries are flat?" The chat interface is not a secondary access method — it is a primary surface.

**Agents collaborate like a real crew.** When a sailor asks "Can we leave tomorrow?", the Watchman routes the question to Navigator (weather window, tides), Engineer (fuel, battery state), and Pilot (port approach, customs). The agents consult each other — Navigator asks Engineer about fuel range to determine whether motoring through a calm patch is viable. This inter-agent collaboration happens transparently, with the user receiving a unified answer.

**Proactive, not just reactive.** Agents watch data streams continuously and warn before problems occur. The Engineer notices battery voltage has been declining for four hours and alerts you before you lose power. The Navigator sees a weather window closing and suggests departing earlier. The Bosun notices your water consumption rate means you have three days left. This is what a competent crew does — they do not wait to be asked.

**Contextually aware.** Every agent knows your boat — its make, model, equipment, systems, fuel capacity, battery bank size, solar panel output. They know your current position, your active route, your recent passages. They know the season, the region, the local regulations. This context makes every interaction relevant rather than generic.

---

## 2. Agent Architecture (Go)

### Why a custom agent framework

Above Deck builds its own agent framework in Go rather than using LangChain, CrewAI, AutoGen, the Claude Agent SDK, or any other off-the-shelf framework.

**Language alignment.** The entire backend is a single Go binary — protocol adapters, data model, monitoring service, sync engine, API server. Agent frameworks in the ecosystem are overwhelmingly Python or TypeScript. Introducing a Python runtime or Node.js dependency on a resource-constrained spoke (4-16GB RAM, 3-15W power budget) running on a boat contradicts the project's core technical decisions: single binary, no runtime dependencies, minimal operational overhead.

**Domain specificity.** General-purpose agent frameworks are designed for broad applicability. Above Deck's agents are narrow specialists in the marine domain, tightly coupled to a real-time data model with hierarchical paths like `electrical/batteries/house/voltage`. They subscribe to live instrument data streams, evaluate threshold-based alert rules, and operate in an environment where connectivity is intermittent and safety is paramount. No general framework models this well.

**Tight integration.** Agents are OS-level services, not application-layer features. They share memory space with the data model, monitoring service, and protocol adapters. An agent's data subscription fires a Go channel message when a value changes — no HTTP call, no serialisation overhead, no network hop. This matters when you are monitoring bilge pump activation frequency or anchor drag in real time.

**Simplicity.** The agent runtime is approximately 2,000-3,000 lines of Go. It manages six agents with defined lifecycles, routes messages, executes tools, and proxies LLM calls. Building this is simpler and more maintainable than adapting a framework designed for arbitrary multi-agent orchestration patterns the project does not need.

**Control over offline behaviour.** No existing framework handles the spoke's offline requirements: queue LLM calls for later, fall back to rule-based monitoring, optionally route to a local model via Ollama, and gracefully degrade per-feature. This is bespoke logic that must be deeply integrated with the connectivity-aware sync engine.

### Agent struct design

Each agent is a Go struct encapsulating identity, knowledge, capabilities, and runtime state:

```go
type Agent struct {
    ID                string
    Name              string           // "Navigator", "Engineer", etc.
    Role              string           // One-line role description
    SystemPrompt      string           // Personality, expertise, communication style
    BoatContext       string           // Injected from boat profile at startup
    DataSubscriptions []string         // Data model paths this agent monitors
    Tools             []ToolDefinition // Tools this agent can invoke
    RAGSources        []string         // Knowledge base collections this agent queries
    AlertRules        []string         // Rule IDs this agent owns/monitors
    State             AgentState       // running, stopped, error, starting
    Conversations     []Conversation   // Active conversation contexts
    MessageChan       chan Message      // Inbound message channel
    Health            HealthStatus
    Config            AgentConfig      // LLM model, temperature, notification level
}

type AgentConfig struct {
    LLMModel          string  // "claude-sonnet-4-20250514", "claude-haiku-4-20250414", etc.
    Temperature       float64 // Low for factual agents, slightly higher for Pilot/Bosun
    NotificationLevel string  // "silent", "critical", "normal", "verbose"
    MaxContextTokens  int     // Context window budget for this agent
}
```

**System prompt** defines the agent's identity, personality, expertise boundaries, safety posture, and data awareness. Stored as editable text files on the spoke's filesystem — users can customise agent behaviour. Boat context (make, model, equipment, systems) is injected from the boat profile at startup.

**Data subscriptions** connect agents to live instrument data via the internal pub/sub system. Subscriptions are evaluated on data change, not polling. Supports specific paths (`electrical/batteries/house/voltage`), wildcards (`propulsion/engines/*/coolantTemp`), and subtrees (`navigation/*`).

**Tool definitions** specify what the agent can invoke, with parameter schemas that map directly to Claude's `tool_use` format. Each tool has an execution handler, timeout, network requirement flag, and agent permission list.

**RAG sources** identify which knowledge base collections the agent queries — Navigator gets pilot books and weather patterns, Engineer gets manufacturer manuals and equipment specs.

**Alert rules** link the agent to the monitoring service's rule engine for proactive notifications.

### Agent lifecycle

**Startup:** On spoke boot, the runtime loads agent configurations from disk, instantiates each agent with its system prompt and boat context, registers data subscriptions with the pub/sub system, starts health check goroutines, and sets state to `running`.

**Health checks:** Each agent emits a heartbeat every 30 seconds. The runtime monitors heartbeat recency, error count, message channel depth (backpressure detection), and LLM call success rate.

**Restart:** If an agent enters error state or becomes unresponsive, the runtime cancels its goroutine, creates a new instance with fresh state, and preserves conversation history (stored in SQLite, not in-memory). After three restart failures in ten minutes, the agent is placed in `stopped` state and an alert is raised.

**Shutdown:** On spoke shutdown, the runtime signals all agents to stop, allows in-flight LLM calls to complete or cancel (10-second timeout), persists conversation state to SQLite, unregisters data subscriptions, and exits goroutines cleanly.

### Message routing

All user messages flow through the Watchman:

```
User sends message via chat UI
        |
   WebSocket -> API server -> Runtime
        |
   Watchman receives message
        |
        +-- Watchman answers directly (simple status query, routing question)
        |
        +-- Watchman routes to specialist (domain-specific question)
        |   "What's the weather tomorrow?" -> Navigator
        |   "Why is my battery voltage dropping?" -> Engineer
        |   "What VHF channel for this port?" -> Radio Operator
        |
        +-- Watchman coordinates multi-agent response
            "Can we leave tomorrow?" -> Navigator + Engineer + Pilot
```

The Watchman uses a lightweight LLM classification call with a constrained output schema to decide routing. When offline, it falls back to keyword-based routing (weather/tide -> Navigator, battery/engine/fuel -> Engineer, VHF/AIS/radio -> Radio Operator, checklist/provision/anchor -> Bosun, port/customs/marina -> Pilot).

Users can also address agents directly: "Navigator, what's the best departure time?" bypasses the Watchman's routing step.

### Inter-agent communication

Agents consult each other through the runtime, not via direct calls:

```go
type InterAgentMessage struct {
    FromAgent    string
    ToAgent      string
    Query        string
    Context      map[string]interface{}
    ResponseChan chan InterAgentResponse
    Timeout      time.Duration
}
```

Example: Navigator needs fuel range for a passage plan. Navigator sends an inter-agent message to Engineer asking "What is the current fuel range at 6 knots?" Engineer calculates from tank levels, consumption rate, and speed. Navigator incorporates the answer. Inter-agent messages are not shown in user chat unless debug mode is enabled.

### Tool execution

Tools are executed within Claude's structured `tool_use` flow:

1. Agent receives user message.
2. Message, system prompt, conversation history, and available tools are sent to Claude API.
3. Claude responds with `tool_use` block(s) specifying tool name and parameters.
4. Runtime validates the call: authorised agent, valid parameters, within timeout.
5. Runtime executes the tool handler in a sandboxed context.
6. Tool result returned to Claude as `tool_result`.
7. Claude generates final response incorporating tool results.
8. Multiple tool calls per turn supported (parallel and sequential).

All tool invocations are logged to SQLite with agent ID, tool name, parameters, result, success/failure, duration, and timestamp. This audit trail is essential for debugging, cost tracking, and understanding agent behaviour.

### Conversation history management

Context windows are finite. The runtime manages conversation history to stay within token budgets:

- **Recent messages** are always included (last 10-20 messages depending on length).
- **Older messages** are summarised by a periodic background task — a Haiku call that compresses conversation history into a concise summary.
- **System prompt + boat context + RAG context** consume a fixed portion of the window.
- **Tool results** are truncated if they exceed a configurable size.
- Each agent's context budget is configurable via `AgentConfig.MaxContextTokens`.

Conversation state persists to SQLite between sessions. When a user returns after a gap, the agent has access to conversation history and summaries, maintaining continuity.

---

## 3. Online Mode (Hub-Proxied Claude API)

### Request flow

```
Spoke (boat)           Hub (cloud)           Claude API
     |                      |                      |
     |-- LLM request ------>|                      |
     |                      |-- validate auth ----->|
     |                      |-- rate limit check -->|
     |                      |-- forward request --->|
     |                      |                      |-- process
     |                      |<-- stream response ---|
     |<-- stream response --|                      |
     |                      |-- log usage --------->|
```

The spoke never calls the Claude API directly. All LLM requests are proxied through the hub. This is a deliberate architectural decision with several benefits.

### Why proxy through the hub

**API key management.** A single API key lives on the hub, not distributed to every spoke. No risk of key exposure on user hardware. Key rotation happens in one place.

**Rate limiting.** The hub enforces fair-use rate limits per user, per boat, and globally. This prevents any single user from consuming disproportionate API resources. Rate limiting is about fairness, not monetisation — the project is free and infrastructure costs are funded by donations.

**Cost control.** Centralised tracking of token usage across all spokes. The hub can implement cost-aware routing (downgrade from Sonnet to Haiku when daily budget is exceeded, for example). Usage analytics inform infrastructure funding needs.

**Caching.** Common queries can be cached at the hub level. If fifty boats ask about weather patterns in the Mediterranean in the same week, the hub can serve cached context rather than making fifty identical RAG+LLM calls.

**Model selection.** The hub can override or suggest model choices based on query complexity, current API load, or cost constraints — without updating spoke software.

**Graceful degradation.** When Claude API experiences an outage, the hub can serve cached responses, queue requests, or return a structured error that tells the spoke to fall back to local capabilities. The spoke does not need to implement Claude API error handling directly.

### Claude model selection

Different tasks require different models. The runtime selects models based on task complexity and cost:

| Model | Use Cases | Reasoning |
|-------|-----------|-----------|
| **Opus** | Complex passage planning across multiple days, weather routing with isochrone analysis, circumnavigation seasonal timing, multi-agent coordination for departure decisions, diagnostic reasoning for complex electrical faults | Strongest reasoning for multi-step problems requiring synthesis across large context. Used sparingly due to cost. |
| **Sonnet** | Most agent interactions — weather questions, equipment lookups, port information, maintenance scheduling, tidal calculations, RAG-augmented Q&A, navigation queries, energy calculations | Best balance of capability and cost. Default model for all agents. Handles tool_use well. |
| **Haiku** | Watchman routing classification, simple status queries ("what's my battery voltage?"), conversation history summarisation, keyword extraction for RAG queries, quick data lookups with minimal reasoning | Fast and cheap for simple tasks that do not require deep reasoning. Used for the Watchman's routing decision and background maintenance tasks. |

The model is configured per-agent with per-query override capability. The runtime can escalate from Haiku to Sonnet to Opus within a single conversation if the query demands it.

### Streaming responses

Agent responses are streamed to the user via WebSocket for a responsive chat experience. The hub streams Claude's response tokens directly to the spoke as they arrive, and the spoke forwards them to the frontend:

```json
{
  "type": "agent.stream",
  "agent": "navigator",
  "conversation_id": "conv-123",
  "content": "Based on the ",
  "done": false
}
```

Tool use is also streamed — the user sees when an agent is invoking a tool and can watch the result arrive before the agent continues its response.

### Token usage tracking

The hub logs every LLM call:

- User ID, boat ID, agent ID
- Model used
- Input tokens, output tokens
- Latency
- Cache hit (if applicable)
- No conversation content is stored on the hub — only metadata

This data informs:
- Per-user fair-use rate limiting
- Infrastructure cost forecasting
- Model selection optimisation (identify queries that use Sonnet but could use Haiku)
- Agent performance monitoring (which agents are called most, which tools are used most)

### Multi-turn conversation management

Each agent maintains independent conversation threads per user. The runtime manages:

- **Context assembly:** System prompt + boat context + RAG context + conversation history + available tools, packed within the model's context window.
- **History truncation:** When conversation history exceeds the context budget, older messages are replaced by their summary.
- **Cross-session continuity:** Conversations persist in SQLite. A user can pick up where they left off.
- **Parallel conversations:** A user can talk to Navigator and Engineer simultaneously — each agent has its own conversation thread and context.

### Handling Claude API outages

The hub implements a structured fallback when the Claude API is unreachable:

1. **Retry with backoff** — standard exponential backoff for transient failures.
2. **Cache hit** — if a similar query was recently answered, serve the cached response with a note that it may not reflect current conditions.
3. **Queue for later** — if the query is not time-sensitive, queue it and notify the user when the answer is ready.
4. **Degrade to local** — tell the spoke to use local capabilities (rule-based monitoring, cached RAG, local model if available).
5. **Structured error** — return a message the spoke can display: "I can't reach my reasoning service right now. Monitoring and alerts continue to work. I'll answer your question when connectivity is restored."

Agents never silently fail. The user always knows what is happening and what still works.

---

## 4. Offline Mode (No Connectivity)

### The critical engineering challenge

Boats lose internet regularly. Mid-ocean passages last days or weeks with no connectivity. Coastal cruisers lose signal in remote anchorages. Satellite connections are expensive and low-bandwidth. Marina WiFi is unreliable. The platform must be genuinely useful without any internet connection.

This is not an edge case — it is the primary operating environment for the spoke. The online mode is the enhancement, not the baseline.

### Strategy layers

Offline capability is implemented in five layers, from simplest to most complex:

#### Layer 1: Rule-based systems (no LLM required)

The monitoring service and alert engine are entirely rule-based. They evaluate threshold conditions against live instrument data using simple logic — no LLM, no network, no external dependency.

What works without any LLM:

- **All instrument monitoring** — battery voltage, engine temperature, oil pressure, tank levels, depth, wind speed, bilge pump activity
- **All alert evaluation** — threshold violations, rate-of-change detection, pattern matching
- **Anchor watch** — GPS position monitoring, swing radius calculation, drag detection
- **Instrument display** — all gauges, graphs, and dashboards showing live data
- **Data logging** — continuous recording of all instrument data to SQLite
- **AIS target tracking** — vessel positions, CPA/TCPA calculations

These are the safety-critical functions. They never depend on an LLM.

#### Layer 2: Cached responses

Common questions and their answers are pre-computed and stored in SQLite when connectivity is available:

- **Boat-specific data** — "What's my battery capacity?" "When is my engine service due?" "What equipment do I have?" All answered from the local database without LLM.
- **Pre-computed agent responses** — frequently asked questions with cached answers, tagged by region and topic. Refreshed during sync.
- **Template responses** — structured answers for status queries: "Battery voltage is {value}V, SOC is {soc}%, estimated time to {threshold}V is {hours} hours." No LLM reasoning needed — just data interpolation.

#### Layer 3: Local small model via Ollama

For basic conversational AI when offline, the spoke can run a quantized open-source model locally via Ollama:

- **Purpose:** Provide natural-language interaction for questions that need some reasoning but not Claude-level capability. Interpret instrument readings, explain what a threshold violation means, answer basic navigation questions.
- **Not a replacement for Claude.** The local model handles simple queries: "What does this Victron error code mean?" "Is 12.4V normal for my battery?" "What's the tide doing at this station?" It does not handle complex passage planning, multi-source weather analysis, or nuanced diagnostic reasoning.
- **Model selection by hardware:**

| Hardware | Model | RAM Required | Disk | Performance |
|----------|-------|-------------|------|-------------|
| Mac Mini M4 (16GB) | Llama 3 8B Q4_K_M | ~5GB | ~4.5GB | Comfortable. Room for embeddings model too. Fast inference on Apple Silicon. |
| Mac Mini M4 (16GB) | Mistral 7B Q4_K_M | ~5GB | ~4GB | Good alternative. Strong instruction following. |
| Intel N100 (16GB) | Llama 3 8B Q4_K_M | ~5GB | ~4.5GB | Feasible but slower inference. Leaves ~10GB for OS + spoke. |
| Intel N100 (8GB) | Phi-3 mini Q4_K_M | ~2.5GB | ~2GB | Only option on 8GB. Basic but functional. |
| HALPI2 (8GB) | Phi-3 mini Q4_K_M | ~2.5GB | ~2GB | Tight. May need to run embeddings-only, no chat model. |
| HALPI2 (4GB) | Embeddings only | ~500MB | ~300MB | nomic-embed-text for RAG queries. No chat model. |

- **Ollama management:** The spoke manages Ollama as a subprocess. Model downloads happen during sync when bandwidth is available. The runtime detects available hardware and selects the appropriate model automatically.

#### Layer 4: Local embeddings for RAG

Even without an LLM for reasoning, the spoke can perform RAG queries locally:

- **Ollama + nomic-embed-text** — a small embedding model (~300MB) that runs on all spoke hardware.
- **sqlite-vec** — vector search in the local SQLite database.
- **Flow:** User asks a question -> query is embedded locally -> vector search finds relevant chunks from synced RAG data -> chunks are returned as structured text.
- Without an LLM, the raw chunks are displayed as search results rather than synthesised into a natural-language answer. Still useful — "Here are the relevant sections from the pilot book about this harbour."
- With a local model (Layer 3), the chunks can be fed as context for a locally-generated answer.

#### Layer 5: Queue for later

Questions that genuinely require Claude-level reasoning are queued:

- The agent acknowledges: "I've noted your question about the optimal departure window for the Atlantic crossing. I'll work on this when connectivity is restored."
- Questions are stored in SQLite with timestamp, agent, and priority.
- When connectivity returns, queued questions are processed in priority order (safety-related first).
- The user is notified when answers are ready.

### Offline capability matrix

| Capability | Offline? | Method |
|------------|----------|--------|
| Instrument monitoring and display | Yes | Direct data model read |
| All alerts and alarms | Yes | Rule-based evaluation |
| Anchor watch | Yes | GPS + rule-based |
| AIS target tracking and CPA | Yes | Local calculation |
| Chart display and navigation | Yes | Cached chart tiles |
| Tide predictions (cached stations) | Yes | Harmonic prediction (local) |
| Equipment specs and service history | Yes | Local database |
| Status queries ("what's my battery?") | Yes | Template response |
| RAG search (pilot books, almanac) | Yes | Local embeddings + sqlite-vec |
| Basic chat (with local model) | Yes | Ollama + small model |
| Simple diagnostics | Yes | Local model + RAG |
| Complex passage planning | No | Requires Claude API |
| Weather routing (multi-model analysis) | No | Requires weather API + Claude |
| Multi-agent coordination | No | Requires Claude for reasoning |
| Full diagnostic reasoning | No | Requires Claude |
| Community data queries (live) | No | Requires hub |
| Firmware update checks | No | Requires hub |

### Connectivity detection and adaptation

The spoke continuously monitors its connectivity state:

- **Fully online** — hub reachable, Claude API responsive. Full agent capability.
- **Degraded** — hub reachable but slow (satellite). Prioritise essential queries, use Haiku over Sonnet, minimise token usage.
- **Hub-only** — hub reachable but Claude API down. Cached responses, queued reasoning.
- **Fully offline** — no internet. Local model, cached responses, rule-based monitoring, queue for later.

The transition between states is automatic and transparent to the user. Agents announce capability changes: "I'm running on local reasoning now — I can help with basic questions but complex planning will wait until we're back online."

---

## 5. RAG Pipeline

### What gets embedded and indexed

The RAG database is the agents' long-term memory — curated, structured knowledge that makes them domain experts rather than generic chatbots.

**Cruising almanac:**
- Harbour and anchorage descriptions (approach, hazards, facilities, reviews)
- Marina listings with facilities, contacts, pricing
- Points of interest — fuel docks, chandleries, boatyards, provisioning
- Passage notes between common waypoints
- Community-contributed updates and corrections

**Pilot books and cruising guides:**
- Regional sailing directions (approach procedures, hazards, weather patterns)
- Passage planning guidance by region and season
- Port entry procedures and requirements

**Manufacturer documentation:**
- Equipment manuals for gear installed on this specific boat
- Victron product manuals, error codes, troubleshooting guides
- Engine service manuals and specifications
- Instrument installation and operation guides

**Regulations:**
- COLREGs (International Regulations for Preventing Collisions at Sea)
- Country-specific entry requirements (customs, immigration, health)
- Marine park rules and anchoring restrictions by region
- Flag state requirements
- Insurance requirements by jurisdiction
- ITU Radio Regulations for VHF, DSC, GMDSS

**Weather and oceanography:**
- Weather patterns by region and season
- Trade wind and monsoon routing data
- Cyclone seasons and historical tracks
- Ocean current data
- Cruising season windows by region

**Community knowledge:**
- Forum posts, guides, how-tos (with permission, attributed)
- Cruiser-reported conditions and experiences
- Equipment reviews and comparisons
- Passage reports

**Boat-specific (per spoke):**
- Owner's manual for this boat make/model
- Service records and maintenance history
- Equipment specifications and installation notes
- Custom wiring diagrams and system documentation

### Embedding models

| Location | Model | Source | Notes |
|----------|-------|--------|-------|
| Hub | text-embedding-3-small | OpenAI API | High quality, low cost. Canonical embeddings for the full RAG database. |
| Spoke | nomic-embed-text | Ollama (local) | Runs on all spoke hardware. Used for local embedding generation when synced data needs re-embedding or for embedding user queries offline. |

Both models produce vectors that are stored in their respective vector databases. The hub generates embeddings for all canonical content. The spoke generates embeddings locally only for user queries (to search against synced hub embeddings) and for any locally-created content.

Embedding model alignment: hub and spoke use different models, so the spoke stores both the hub-generated embeddings (for synced content) and can generate local embeddings for queries. Cross-model similarity is imperfect but functional for retrieval. A more robust approach is for the hub to also provide pre-computed query embeddings for common question patterns.

### Vector storage

| Location | Database | Notes |
|----------|----------|-------|
| Hub | pgvector (PostgreSQL extension) | Full RAG database. Millions of chunks across all content types. |
| Spoke | sqlite-vec (SQLite extension) | Regional subset. Tens of thousands of chunks. Embedded in the Go binary, no external dependency. |

### Chunking strategy

- **Semantic chunking:** Documents are split at natural boundaries — headings, sections, paragraph breaks. Not naive character-count splitting.
- **Chunk size:** 500-1000 tokens per chunk. Large enough for semantic coherence, small enough for precise retrieval.
- **Overlap:** 50-100 token overlap between adjacent chunks to preserve context at boundaries.
- **Structure preservation:** Tables, lists, and structured data are kept intact within chunks where possible.
- **Hierarchical context:** Each chunk retains its parent section heading and document title as metadata, so retrieved chunks carry structural context.

### Chunk metadata

Every chunk carries metadata for filtering, attribution, and freshness:

```json
{
  "source": "reeds-almanac-2026",
  "source_type": "pilot_book",
  "section": "Western Mediterranean > Balearics > Palma de Mallorca",
  "region": ["mediterranean", "balearics", "mallorca"],
  "topic": ["harbour", "approach", "facilities"],
  "date_published": "2026-01-15",
  "date_indexed": "2026-02-01",
  "last_verified": "2025-11-20",
  "confidence": "high",
  "language": "en",
  "chunk_index": 3,
  "total_chunks": 7
}
```

### Hub-to-spoke RAG sync

The hub maintains the canonical, complete RAG database. Each spoke syncs a relevant subset for offline use:

- **Regional selection:** The spoke configures geographic regions of interest (e.g., "Mediterranean", "Caribbean", "Atlantic crossing routes"). Only chunks tagged with those regions are synced.
- **Topic selection:** All agents' RAG sources are synced by default. Users can exclude topics to save disk space.
- **Delta sync:** On each sync, the spoke requests chunks added, modified, or deleted since its last sync timestamp. Not full database dumps.
- **Typical spoke RAG database size:** 50MB-500MB depending on regions and topic breadth.
- **Sync priority:** Safety-related content (COLREGs, regulations) syncs first. Community content syncs last.
- **Freshness tracking:** Each chunk has a `last_verified` date. Agents can indicate confidence level when using older content: "This information is from 2024 and may have changed."

### Query pipeline

When an agent needs RAG context:

1. **Query formulation** — the agent (via Claude or local model) formulates a search query from the user's question and conversation context.
2. **Embedding** — the query is embedded using the same model as the stored chunks (nomic-embed-text on spoke, text-embedding-3-small on hub).
3. **Vector search** — nearest-neighbour search in the agent's configured RAG source collections. Top-k results (default k=5, configurable per agent).
4. **Metadata filtering** — results can be filtered by region, topic, freshness, or confidence before ranking.
5. **Reranking** — (optional, online only) results reranked by a cross-encoder or LLM-based reranking step for higher relevance.
6. **Context assembly** — retrieved chunks are assembled into a context block with source attribution, injected into the LLM call.
7. **Citation** — agent responses include source attribution: "According to the Reeds Western Mediterranean Almanac (2026)..."

---

## 6. Tool System

### Tools are the interface between agents and the platform

Every capability the platform offers — from checking battery voltage to calculating a great circle route — is exposed as a tool that agents can invoke via Claude's structured `tool_use` protocol. Tools are the mechanism by which agents act, not just talk.

### Tool categories

**Navigation:**
| Tool | Description | Requires Network |
|------|-------------|------------------|
| `weather_forecast` | Get weather forecast for location and time range | Yes |
| `tide_prediction` | Get tide predictions for a station | Yes (cached locally) |
| `chart_lookup` | Query chart data for position or area | No (local charts) |
| `route_calculate` | Calculate route between waypoints (distance, bearing, ETA) | No |
| `ais_query` | Query current AIS targets by MMSI, name, area, CPA | No (live data) |
| `sunrise_sunset` | Calculate sun/moon rise/set for position and date | No |
| `great_circle_distance` | Calculate distance between two positions | No |
| `waypoint_lookup` | Look up saved waypoints by name or proximity | No |

**Electrical and propulsion:**
| Tool | Description | Requires Network |
|------|-------------|------------------|
| `equipment_lookup` | Query equipment registry (specs, manuals, install date) | No |
| `maintenance_schedule` | Query/update maintenance schedule | No |
| `power_calculation` | Calculate power budget (generation vs consumption) | No |
| `fuel_consumption` | Estimate fuel consumption at given speed and conditions | No |
| `service_history` | Query service/maintenance history for equipment | No |
| `firmware_check` | Check for firmware updates for installed equipment | Yes |

**Reference and community:**
| Tool | Description | Requires Network |
|------|-------------|------------------|
| `poi_lookup` | Search points of interest by location and type | No (synced) |
| `port_info` | Get port information (facilities, approach, contacts) | No (synced) |
| `customs_requirements` | Get customs/immigration requirements for a country | No (synced) |
| `marina_search` | Search marinas by location, facilities, price | No (synced) |
| `anchorage_search` | Search anchorages with reviews and conditions | No (synced) |
| `regulation_lookup` | Look up maritime regulations for an area | No (synced) |
| `mmsi_lookup` | Look up vessel details by MMSI number | Yes (cached) |

**Platform:**
| Tool | Description | Requires Network |
|------|-------------|------------------|
| `checklist_lookup` | Get/create checklists (departure, arrival, passage) | No |
| `inventory_query` | Query provisions/spares inventory | No |
| `anchor_watch_status` | Get anchor watch state (drift, radius, alerts) | No |
| `vhf_channel_guide` | Get VHF channel assignments for a region/port | No (synced) |
| `get_active_alerts` | List currently active alerts | No |
| `get_boat_summary` | Get summary of all boat systems state | No |

**External:**
| Tool | Description | Requires Network |
|------|-------------|------------------|
| `weather_api` | Raw weather API query (Open-Meteo, ECMWF) | Yes |
| `ais_stream` | Query AIS stream service for distant vessel data | Yes |
| `vrm_data` | Query Victron VRM for remote boat monitoring | Yes |

### Tool definition format

Tools are defined as Go structs that map directly to Claude's `tool_use` JSON schema:

```go
type ToolDefinition struct {
    Name        string                 // Unique tool name
    Description string                 // What the tool does (included in LLM context)
    Parameters  map[string]ToolParam   // Input parameters
    Returns     string                 // Description of return value
    Handler     ToolHandler            // Go function that executes the tool
    Agents      []string               // Which agents can use this ("*" = all)
    Category    string                 // "navigation", "electrical", "reference", etc.
    RequiresNet bool                   // Whether the tool needs internet
    Timeout     time.Duration          // Maximum execution time
}
```

### Tool permissions

Each agent has access only to the tools relevant to its domain:

| Agent | Tool Categories | Cannot Access |
|-------|----------------|---------------|
| Navigator | Navigation, weather, reference | Electrical controls, switching |
| Engineer | Electrical, propulsion, equipment | Route modification, navigation controls |
| Radio Operator | AIS, reference (VHF/DSC) | Electrical, navigation, equipment |
| Bosun | Platform (checklists, inventory, anchor), reference | Electrical, navigation |
| Pilot | Reference (POI, ports, customs, regulations) | Electrical, navigation controls |
| Watchman | Platform (alerts, boat summary, agent status) | Domain-specific tools |

Tool permissions are enforced at the runtime level — even if an agent's LLM output requests an unauthorised tool, the runtime rejects the call and returns an error to the LLM.

### Tool execution: sandboxed and audited

- **Sandboxed:** Tool handlers run with constrained permissions. Read-only tools cannot write. Write-capable tools (e.g., updating a maintenance record) require explicit capability flags.
- **Timeout:** Each tool has a maximum execution time. If exceeded, the call is cancelled and the LLM receives a timeout error.
- **Audited:** Every tool invocation is logged to SQLite — agent, tool, parameters, result, success/failure, duration, timestamp.
- **Idempotent where possible:** Tools that modify state are designed to be safely retried.

### Custom tools via plugin system

Third-party developers can register new tools through the plugin architecture:

- Define tool schema (name, description, parameters, return type)
- Implement handler function
- Specify which agents can use the tool
- Register with the tool registry at startup

### MCP server: tools for external AI

The MCP (Model Context Protocol) server exposes the internal tool registry to external AI systems. Any MCP-compatible client (Claude Desktop, other AI tools) can invoke the same tools that internal agents use, with the same permissions and auditing. See section 11 for detail.

---

## 7. Training Our Own Model — Opportunities

### Why consider fine-tuning

Claude (and other large models) are general-purpose. They know about sailing at a surface level, but they lack the precise domain knowledge that makes the difference between a helpful answer and a dangerous one. A fine-tuned model for the marine domain could:

- Apply COLREGs correctly in complex vessel encounter scenarios
- Interpret marine weather data (GRIB files, synoptic charts) with specialist precision
- Perform navigation calculations (tidal heights, CTS computation, weather routing) accurately
- Know VHF radio procedures to ITU standard, not just approximately
- Diagnose equipment faults from Victron error codes, NMEA 2000 PGN errors, and engine alarm patterns

### Fine-tuning domains

**COLREGs (collision regulations):**
- Rule application in complex vessel encounter scenarios
- Right-of-way decisions with multiple vessels
- Restricted visibility procedures
- Traffic separation scheme navigation
- Narrow channel and fairway rules

**Marine weather interpretation:**
- GRIB data parsing and human-readable forecast generation
- Synoptic chart analysis
- Marine-specific terminology (sea state, swell period, fetch)
- Weather window identification from forecast data
- Tropical cyclone track interpretation

**Navigation calculations:**
- Tidal height computation from harmonic constituents
- Course-to-steer calculation accounting for set and drift
- Weather routing with isochrone method
- Great circle vs rhumb line distance and bearing
- Fuel and water consumption planning

**VHF radio procedures:**
- ITU-standard procedure formats (Mayday, Pan-Pan, Securite)
- DSC calling procedures
- Phonetic alphabet usage
- Port and harbour communication protocols
- GMDSS area awareness

**Equipment troubleshooting:**
- Victron error codes and fault diagnosis
- Engine diagnostic reasoning from sensor data patterns
- NMEA 2000 network fault isolation
- Electrical system troubleshooting (voltage drop, ground faults, charging problems)

### Data sources for fine-tuning

| Source | License / Access | Content |
|--------|-----------------|---------|
| IMO COLREGS full text | Public domain (international convention) | Complete collision regulation text |
| NOAA publications | Public domain (US government) | Nautical almanac, tide tables, coast pilot, chart catalogs |
| ITU Radio Regulations | Public (with some access restrictions) | VHF procedures, GMDSS, DSC protocols |
| OpenCPN documentation | GPL | Navigation software guides, chart handling |
| Community forum Q&A | Permission required (Cruisers Forum, etc.) | Real-world sailing questions and expert answers |
| RYA/ASA training materials | License required | Navigation theory, seamanship, radio operation |
| Admiralty Sailing Directions | Crown Copyright (check licensing) | Worldwide passage and port information |
| Above Deck KB articles | CC-BY-SA-4.0 | Guides, specs, how-tos, references, manuals, tutorials |
| Victron documentation | Publicly available | Product manuals, error codes, system design guides |
| ECMWF documentation | Public | Weather model interpretation guides |

### Evaluation datasets

To measure whether fine-tuning (or improved prompting/RAG) actually improves agent quality, build marine-specific evaluation sets:

**COLREGs scenarios:** 200+ vessel encounter situations with correct right-of-way decisions. Include edge cases (multiple vessels, restricted visibility, TSS crossings). Score: correct/incorrect rule application.

**Weather interpretation:** 100+ GRIB data samples paired with expected human-readable forecasts. Score: accuracy of interpretation, appropriate level of concern, correct terminology.

**Navigation problems:** 100+ calculation problems — tidal gate timing, CTS with current, passage distance/ETA, fuel planning. Score: numerical accuracy, correct method.

**VHF procedure correctness:** 50+ radio communication scenarios — Mayday format, Pan-Pan format, Securite broadcasts, routine port calls. Score: procedure correctness, phonetic alphabet usage, required information inclusion.

**Equipment diagnosis:** 100+ fault scenarios — Victron error code interpretation, engine sensor pattern analysis, electrical system troubleshooting. Score: correct diagnosis, appropriate safety warnings, correct remedial steps.

These eval sets are valuable regardless of whether we fine-tune — they also measure prompt engineering and RAG quality improvements.

### Model hosting

**Online (hub):**
- Fine-tuned model hosted on the hub for online agent use
- Could be a Claude fine-tune (when Anthropic offers this for external customers) or an open-source base model (Llama, Mistral) fine-tuned on marine data
- Served via the same hub proxy that currently routes to Claude API
- Agents could use the fine-tuned model for domain-specific queries and Claude for general reasoning

**Offline (spoke):**
- Quantized version (GGUF format) deployed to spoke via Ollama
- A marine-domain-tuned 7-8B model running locally would be significantly more useful than a generic model of the same size
- Downloads during sync when bandwidth allows
- Falls back to generic local model if fine-tuned version is unavailable

### Continuous improvement

**Collect training signal (opt-in, anonymised):**
- Track where agents fail — incorrect information, unhelpful responses, hallucination
- Track where users correct agents or ask follow-up questions indicating confusion
- Track tool use patterns — which tools are called, which combinations succeed
- All collection is opt-in with clear disclosure. No conversation content leaves the spoke without explicit user consent.

**Feedback loop:**
- Community-reported corrections (e.g., "the COLREGs answer here was wrong") feed back into evaluation datasets
- Aggregated failure patterns inform RAG improvements (add missing content) or prompt tuning (improve instructions)
- A/B testing of prompt versions — measure which system prompts produce better eval scores
- Periodic re-evaluation against the eval datasets to track improvement over time

**Open-source contribution:**
- The marine eval datasets themselves are valuable community resources — publish them under GPL
- Fine-tuning datasets (where licensing allows) are published for the community
- Other marine AI projects can benefit from and contribute to these resources

---

## 8. Data Flywheel

### The platform generates data that makes the AI smarter

Every interaction with the platform, every passage sailed, every night at anchor generates data that improves the agents for all users. This is not surveillance — it is a community knowledge commons, and every piece of data collection is opt-in.

**Sailing tracks (opt-in):**
- Aggregated track data reveals popular routes, common stopping points, and actual (not theoretical) passage times
- Navigator uses this to suggest routes that real sailors actually take, with realistic ETAs
- "Most boats sailing from Gibraltar to the Canaries stop at Lanzarote, not Gran Canaria"

**Anchor watch sessions (opt-in):**
- Aggregated anchor watch data reveals holding quality at specific anchorages across different conditions
- "This anchorage holds well in sand with NW winds under 20kt, but dragging is common in SE winds over 15kt"
- GPS drift patterns indicate holding characteristics that community reviews alone cannot capture

**Energy usage patterns (opt-in):**
- Aggregated energy data from boats with similar setups improves the Engineer's consumption predictions
- "Boats with your solar setup typically generate 2.8kWh/day in the Mediterranean in July, not the theoretical 4.1kWh"
- Real-world data is more valuable than manufacturer specifications

**Equipment service records (opt-in):**
- Aggregated maintenance data reveals real-world failure patterns and service intervals
- "Volvo D2-40 engines typically need impeller replacement at 800 hours, not the manufacturer's 1000-hour recommendation"
- Predictive maintenance: "Based on other boats with your setup, your house battery bank is approaching the cycle count where capacity drops significantly"

**Community POI reviews:**
- Every harbour review, anchorage rating, and marina report improves the Pilot's recommendations
- Temporal relevance: "Three sailors reported this marina's fuel dock is closed for repairs as of February 2026"
- Crowdsourced pricing: "Average marina cost in the Balearics is EUR 45/night for a 42ft boat"

**Weather vs actuals (opt-in):**
- Comparing forecast weather to conditions actually experienced (from on-board instruments) improves the Navigator's forecast interpretation
- "GFS tends to overestimate wind speed by 5kt in this region" is learnable from aggregated data
- Forecast calibration by region and season

### Privacy principles

- **Opt-in only.** Every data type listed above requires explicit user consent. No default sharing.
- **Anonymised.** Individual boat identity is stripped before aggregation. No tracking of specific boats' movements.
- **Aggregated.** Raw individual data is never exposed. Only statistical aggregates inform agent improvements.
- **Transparent.** Users can see exactly what data they share and revoke consent at any time.
- **Community-owned.** Aggregated data belongs to the community (GPL), not to any company or individual.
- **No commercial use.** This data is never sold, licensed, or shared with third parties.

### Flywheel effect

More boats using the platform -> more aggregated data -> smarter agents -> more useful platform -> more boats. This is the virtuous cycle that makes an open-source community platform competitive with commercial alternatives that have funding but not community data.

---

## 9. Agent Personality and UX

### Each agent has a distinct identity

The agents are not generic chatbots with different system prompts — they are distinct characters with expertise, communication style, and perspective. This is not anthropomorphism for its own sake. Distinct personalities make it immediately clear which agent is speaking and what kind of answer to expect.

**Navigator:**
- Precise, methodical, thinks in waypoints and weather windows
- Communicates in structured formats — tables of waypoints, weather timelines, tidal predictions
- Always includes uncertainty: "Wind is forecast 15-20kt, but GFS has been overestimating for this region"
- Thinks ahead: "If you depart at 0600, you'll have a fair tide through the strait"
- References pilot books and passage reports when relevant

**Engineer:**
- Practical, diagnostic, thinks in systems and thresholds
- Leads with the numbers: "House bank is at 12.4V / 62% SOC. At current draw (8A), you have approximately 6 hours to 50%"
- Explains the why: "Your solar yield is 30% below expected because panels need cleaning"
- Always suggests the conservative action: "Consider starting the engine for a charge cycle"
- References equipment manuals and service records

**Radio Operator:**
- Procedural, by-the-book, knows ITU regulations precisely
- Communicates in the structured format of radio procedures
- Corrects procedure errors without being pedantic
- Knows every VHF channel for every port
- Can identify AIS targets and provide vessel information conversationally
- Already established as the VHF simulator instructor persona — this agent is the sim's instructor elevated to a full agent with live AIS data

**Bosun:**
- Organised, checklist-oriented, thinks about crew welfare and readiness
- Tracks consumables: "Water consumption over the last 3 days: 45L/day. At this rate, your 400L tank will last 6 more days"
- Manages checklists: generates departure/arrival/passage checklists, tracks completion
- Monitors anchor watch and interprets drift patterns
- Thinks about the crew: watch schedules, rest, provisioning

**Pilot:**
- Local knowledge expert, conversational, thinks about approaches and harbours
- The most conversational agent — speaks like an experienced sailor who has been here before
- Provides practical information: "The fuel dock is at the north end of the harbour, open 0800-1800. They take cards but the card machine is unreliable — bring cash"
- Warns about local quirks: "The harbour master's office closes for lunch 1300-1500. Get there before 1300 or you'll wait"
- Shares community knowledge and recent reports from other sailors

**Watchman:**
- Terse, alert-focused, routes to specialists, does not engage in extended chat
- "Battery voltage low. Routing to Engineer." — not "I've noticed that your battery voltage seems to be dropping, which could be caused by..."
- Provides daily summaries if requested: weather, systems status, upcoming maintenance, active alerts
- The background coordinator — users rarely interact with the Watchman directly unless asking for a boat-wide status overview

### Personality is in the system prompt, not the model

All personality and communication style is defined in system prompts — text files that can be edited by the user. No model fine-tuning is needed for personality. This means:

- Users can customise agent communication style (more formal, less formal, different language)
- Personality can evolve over time without retraining
- Different languages can be supported by translating system prompts
- The same model (Claude Sonnet) powers all agents — the prompts create the differentiation

### Chat UI design

Each agent has a visual identity in the chat interface:

- **Icon:** Distinct Tabler icon per agent (compass for Navigator, wrench for Engineer, radio for Radio Operator, anchor for Bosun, map-pin for Pilot, eye for Watchman)
- **Colour accent:** Each agent has a subtle colour accent from the platform palette for message bubbles and UI elements
- **Agent indicator:** Every message clearly shows which agent is speaking
- **Tool use transparency:** When an agent invokes a tool, the user sees it: "Checking weather forecast for 36.7N, 4.4W..." — building trust through transparency
- **Multi-agent responses:** When the Watchman coordinates multiple agents, their responses are clearly attributed

### Addressing agents

Users can interact with agents in three ways:

1. **Via Watchman (default):** Send a message and the Watchman routes it to the right specialist. Most natural for new users.
2. **Direct address:** "Navigator, when's the next weather window?" — skips routing.
3. **Agent-specific chat tabs:** Switch to a specific agent's chat tab for an extended domain-specific conversation.

---

## 10. Cost and Sustainability

### The economics of API-powered AI

Claude API calls cost money. The project is free and open source — there are no paid tiers, no premium features, no subscriptions. Infrastructure costs, including API costs, are funded by community donations. This section describes the engineering strategies to keep those costs sustainable.

### Cost management strategies

**Model tiering:**
- Haiku for routing decisions, classification, and simple lookups (~10x cheaper than Sonnet)
- Sonnet for most agent interactions (the default)
- Opus for complex multi-step reasoning (used sparingly, only when query complexity warrants it)
- Estimated split: 40% Haiku, 50% Sonnet, 10% Opus by call volume

**Response caching:**
- Identical or near-identical queries return cached responses
- Cache keyed on: query embedding similarity, agent, region, time window
- Time-sensitive content (weather, tides) cached with short TTL
- Reference content (regulations, equipment specs) cached with long TTL
- Cache hit rates of 20-30% are realistic for a community with shared interests

**Local model for offline (zero API cost):**
- Ollama running on the spoke handles queries without any API cost
- As local models improve, more queries can be handled locally
- Current estimate: 40-60% of spoke queries could be handled locally with an 8B model

**Context window efficiency:**
- Conversation history summarisation reduces input tokens
- Tool results are truncated to relevant fields
- RAG context is limited to top-k most relevant chunks
- System prompts are concise — every token earns its place

**Fair-use rate limiting:**
- Per-user daily limits on LLM calls (generous for normal use, prevents runaway cost)
- Per-user monthly limits as a safety net
- Rate limits are about fairness, not monetisation — every user gets the same generous allocation
- Heavy users (e.g., testing, development) are supported by the community ethos, not blocked

### Cost projection

Based on typical sailing usage patterns (2-3 agent interactions per day for active cruisers, concentrated around departure planning and evening checks):

- **Per-user daily cost:** approximately $0.02-0.05 at current Claude API pricing
- **Per-user monthly cost:** approximately $0.60-1.50
- **1,000 active users:** approximately $600-1,500/month in API costs
- **10,000 active users:** approximately $6,000-15,000/month

These costs are manageable through community donations for a popular open-source project. For reference, Home Assistant (a comparable open-source project with similar community dynamics) sustains significant infrastructure costs through its community.

### Long-term cost reduction

- As open-source models improve, more queries shift to local models (zero API cost)
- Response caching improves with more users (higher cache hit rate)
- Fine-tuned smaller models could replace Sonnet for domain-specific queries
- Anthropic API pricing has trended downward over time
- Community donations scale with community size

### Infrastructure cost transparency

All infrastructure costs (API, hosting, database, CDN) are published openly. The community can see exactly what the platform costs to run and how donations are used. This is a non-negotiable principle — an open-source project funded by donations must be transparent about its finances.

---

## 11. MCP (Model Context Protocol)

### Above Deck as an MCP server

The platform exposes its entire data model, tool registry, and agent state via MCP. Any MCP-compatible AI client can connect to Above Deck and interact with boat data as if it were a native integration.

### Use cases

**Claude Desktop / other AI assistants:**
- "What's my boat's battery level right now?" — MCP tool queries live instrument data from the spoke
- "What are the tides at Plymouth tomorrow?" — MCP tool invokes the tide prediction service
- "Show me AIS targets within 5nm" — MCP tool queries the AIS target list
- "When is my engine service due?" — MCP tool queries the maintenance schedule

**Developer tools:**
- Third-party app developers can build sailing apps that query Above Deck data via MCP
- Data analysis tools can pull instrument history for offline analysis
- Automation tools can trigger actions based on boat state

**AI-to-AI integration:**
- External AI systems can augment their sailing knowledge with live boat data
- A general-purpose AI assistant becomes boat-aware by connecting to the Above Deck MCP server

### MCP server architecture

```go
type MCPServer struct {
    DataModel    *DataModel
    ToolRegistry *ToolRegistry
    AgentRuntime *AgentRuntime
    Auth         *AuthMiddleware
}
```

The MCP server runs on both spoke and hub:

- **Spoke MCP:** Full access to live instrument data, all tools. Accessible on the boat's local network. Real-time data.
- **Hub MCP:** Access to last-synced boat data, reference tools, RAG queries. Accessible from anywhere with authentication.

### MCP tools mirror internal tools

The MCP tool registry exposes the same tools that internal agents use. The schemas are identical — a tool invocation via MCP follows the same validation, execution, and auditing path as an internal agent tool call.

### Security

- **Authentication required:** API key or JWT for all MCP access.
- **Read-only by default:** MCP cannot write to boat systems. No external AI can control autopilot, switching, or any actuator.
- **Rate limited:** MCP calls are rate-limited per API key to prevent abuse.
- **Audited:** All MCP tool invocations are logged with the same audit trail as internal tool calls.
- **User-configurable:** Users can disable MCP entirely, or restrict which resources are exposed (e.g., share instrument data but not position).

---

## 12. Open Questions

These are unresolved engineering and policy questions that require further research, experimentation, or community input.

### Technical

**Fine-tuning vs RAG vs prompting for domain knowledge:**
When is each approach the right choice? Current thinking: RAG for factual reference data (port information, regulations, equipment specs), prompting for personality and communication style, fine-tuning for procedural knowledge that requires precise application (COLREGs, navigation calculations, VHF procedures). This needs empirical testing with the eval datasets.

**Hallucination in safety-critical contexts:**
How do we handle the risk of agents providing incorrect information in safety-critical situations? Current mitigations: RAG grounding (always cite sources), confidence indicators, explicit uncertainty language in system prompts, rule-based systems for monitoring (no LLM in the safety loop). But what about a Navigator that confidently gives wrong COLREG advice? The eval datasets will help measure this risk, but the policy question remains.

**Agent control of physical systems:**
Should agents ever control physical systems — autopilot, digital switching, engine start — or should they only advise? Current position: agents advise, humans act. But the platform architecture supports write access to NMEA 2000 and digital switching as an explicit opt-in. If agents can say "I recommend turning off the watermaker to save power", should they also be able to do it with user confirmation? What confirmation UX prevents accidental commands?

**Local model quality threshold:**
At what capability level does a local model become good enough for specific agent tasks? An 8B model that gives wrong COLREGs advice is worse than no model. Need to define minimum accuracy thresholds per domain using the eval datasets, and only enable local model for domains where it meets the threshold.

### Policy

**Training data licensing:**
Pilot books, cruising guides, and manufacturer manuals are copyrighted. What can legally be used for RAG (retrieval is generally considered fair use)? What about fine-tuning (more legally ambiguous)? Need legal review, especially for UK/EU copyright law around AI training. Public domain sources (NOAA, IMO conventions, ITU regulations) are safe. Community contributions under GPL are safe. Everything else needs review.

**Multi-language support:**
System prompts can be translated to support agents in the user's language. But RAG content is primarily English. How do we handle non-English queries against English RAG sources? Machine translation of chunks? Multilingual embedding models? This affects a large portion of the sailing community (French, German, Spanish, Italian sailors are well-represented).

**Community data governance:**
Who owns aggregated community data? How are decisions made about what data is collected, how it is used, and who can access it? The GPL license covers source code, but data governance needs its own framework. A community data charter may be needed.

**Ethical use of AI in safety contexts:**
If an agent gives incorrect safety advice and a sailor follows it, what are the liability implications for an open-source project? How explicit do safety disclaimers need to be? Should certain types of advice (COLREGs, medical, structural) always include a "consult a professional" caveat? How do we balance being useful with being responsible?
