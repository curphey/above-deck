# VHF Multi-Agent Radio Architecture

## Goal

Replace the single LLM call (one Claude instance playing all radio characters) with an agent-per-character model. Each coastguard station, vessel, and marina is an independent Claude agent with its own personality, knowledge base, and tools. This makes radio conversations dramatically more realistic — a coastguard agent with local pilot book knowledge gives authentic responses about specific hazards, tidal gates, and anchorages.

## Architecture Overview

```
User speaks → STT → Go Backend → Agent Dispatcher
                                      ↓
                              Route to correct agent
                                      ↓
                        Build agent context:
                        - System prompt (personality)
                        - Knowledge docs (pilot books, COLREGS)
                        - Tools (weather, tides, AIS)
                        - Shared world state
                        - Channel radio history
                                      ↓
                        Claude Messages API (tool_use)
                                      ↓
                        Response → TTS → User hears reply
```

## Components

### 1. RadioAgent Definition

Replace current `Vessel` and `CoastguardStation` structs with a unified `RadioAgent`:

```go
type RadioAgent struct {
    ID            string            `json:"id"`
    Name          string            `json:"name"`
    CallSign      string            `json:"call_sign"`
    AgentType     string            `json:"agent_type"` // coastguard, vessel, marina, port-control
    Nationality   string            `json:"nationality"`
    Position      Position          `json:"position"`
    SystemPrompt  string            `json:"system_prompt"`  // personality, experience, situation
    KnowledgeDocs []string          `json:"knowledge_docs"` // paths relative to knowledge/
    Tools         []string          `json:"tools"`          // tool IDs this agent can use
    VesselSpec    *VesselSpec       `json:"vessel_spec,omitempty"`
    Metadata      map[string]string `json:"metadata,omitempty"`
}

type Position struct {
    Lat float64 `json:"lat"`
    Lon float64 `json:"lon"`
}

type VesselSpec struct {
    Type     string `json:"type"`     // sailing, motor, catamaran, fishing, cargo
    Length   string `json:"length"`   // e.g. "12m"
    Flag     string `json:"flag"`
    MMSI     string `json:"mmsi"`
    Draft    string `json:"draft,omitempty"`
    Rig      string `json:"rig,omitempty"`    // e.g. "sloop", "ketch"
    Engine   string `json:"engine,omitempty"` // e.g. "Yanmar 3YM30"
}
```

### 2. Agent Dispatcher

The dispatcher is the core routing layer in the Go backend.

**Flow:**
1. User transmits a message with a session ID
2. Dispatcher receives the message
3. A lightweight Claude call (or regex/heuristic) identifies who is being called from the message text (e.g., "Solent Coastguard" → agent ID `solent-cg`)
4. Dispatcher looks up the `RadioAgent` from the region's agent registry
5. Builds the full agent context (see below)
6. Calls Claude Messages API with the agent's persona
7. Returns the structured JSON response

**Agent resolution strategy:**
- First try exact callsign match against the message
- Then fuzzy name match (e.g., "Coastguard" matches the region's primary coastguard)
- If no match, route to a "channel monitor" agent that responds as whichever station would realistically answer
- If calling "all stations", route to the coastguard agent (they'd respond first)

**Future (V2):** The dispatcher can run multiple agents in parallel goroutines — called agent responds, but other agents "hear" the transmission and may interject if realistic (e.g., nearby vessel offering assistance during a Pan-Pan).

### 3. Shared World State

Per-session state accessible to all agents:

```go
type WorldState struct {
    SessionID     string
    Region        Region
    CurrentTime   time.Time
    Weather       WeatherState
    Vessels       []VesselPosition  // all known vessel positions
    ActiveIncident *Incident        // if scenario has created one
    RadioHistory  []RadioMessage    // full channel transcript
}

type WeatherState struct {
    WindSpeed     float64 // knots
    WindDirection int     // degrees
    SeaState      string  // e.g. "moderate", "rough"
    Visibility    string  // e.g. "good", "moderate", "poor"
    Forecast      string  // summary
}
```

On session creation, world state initializes from:
- Region defaults (typical conditions)
- Live weather API if available (Open-Meteo)
- AIS data for vessel positions if available (aisstream.io)

All agents see the same world state, ensuring consistency.

### 4. Knowledge Store

Curated markdown files in the repo:

```
packages/api/knowledge/
  procedures/
    colregs-quick-ref.md       # COLREGS rules of the road
    gmdss-procedures.md        # GMDSS, DSC, EPIRB, SART
    sar-coordination.md        # SAR procedures for coastguard agents
    vhf-procedures.md          # ITU VHF radio procedures (already in prompt)
    medical-at-sea.md          # MEDICO procedures
  regions/
    uk-south/
      pilot-notes.md           # Solent, Portland, Needles, tidal gates
      hazards.md               # shipping lanes, firing ranges, race areas
      anchorages.md            # popular anchorages with approach notes
    med-greece/
      pilot-notes.md           # Saronic Gulf, Cyclades, Meltemi patterns
      hazards.md               # ferry routes, military zones
      anchorages.md
    se-asia/
      pilot-notes.md           # Andaman Sea, Strait of Malacca
      hazards.md               # piracy zones, TSS
      anchorages.md
    pacific/
      pilot-notes.md           # Fiji approaches, reef passes
      hazards.md               # cyclone zones, remote areas
      anchorages.md
    atlantic/
      pilot-notes.md           # Canaries, Cape Verde, trade wind belt
      hazards.md               # ITCZ, shipping lanes
      anchorages.md
    caribbean/
      pilot-notes.md           # BVI, Grenadines, customs procedures
      hazards.md               # reef approaches, hurricane season
      anchorages.md
  vessel-types/
    sailing-yacht.md           # handling characteristics, common systems
    catamaran.md               # twin-hull specifics
    motor-yacht.md
    fishing-vessel.md          # gear, trawling patterns
```

Knowledge docs are loaded from disk and injected into the agent's system message. Each agent's `KnowledgeDocs` list specifies which files are relevant:
- Coastguard: `procedures/sar-coordination.md`, `procedures/gmdss-procedures.md`, `regions/{region}/pilot-notes.md`, `regions/{region}/hazards.md`
- Sailing vessel: `procedures/colregs-quick-ref.md`, `vessel-types/sailing-yacht.md`, `regions/{region}/anchorages.md`
- Marina: `regions/{region}/pilot-notes.md` (approach info)

### 5. Agent Tools

Tools are Go functions registered with the Claude Messages API via `tool_use`. Each agent type gets a subset.

**Available tools:**

| Tool | Description | Agent Types |
|------|-------------|-------------|
| `get_weather` | Current conditions + forecast for lat/lon | all |
| `get_tides` | Tidal predictions for nearest station | coastguard, marina |
| `get_ais_targets` | Vessels within radius of position | coastguard |
| `get_time` | Current UTC time | all |
| `get_vessel_info` | Look up a vessel from world state | coastguard |
| `get_navigational_warnings` | Active NAVAREA warnings | coastguard |

**Tool implementations:**

- `get_weather`: Open-Meteo API (free, no key required) — `https://api.open-meteo.com/v1/marine?latitude={lat}&longitude={lon}&hourly=wave_height,wind_speed_10m,wind_direction_10m`
- `get_tides`: Admiralty Tidal API or WorldTides API (free tier available)
- `get_ais_targets`: aisstream.io WebSocket (already stubbed in `packages/api/internal/ais/`)
- `get_time`, `get_vessel_info`: Read from WorldState (no external call)
- `get_navigational_warnings`: Could use NAVAREA broadcast data or simulate from world state

### 6. Agent Context Assembly

When dispatching to an agent, the Go backend assembles:

```
System message:
  1. Agent identity (name, callsign, role)
  2. Agent personality (from SystemPrompt field)
  3. VHF procedures reference (shared across all agents)
  4. Knowledge docs (loaded from files, concatenated)
  5. World state summary (weather, positions, time)
  6. Scenario instructions (if active)
  7. Response format (JSON structure)

Tool definitions:
  - Only the tools listed in agent.Tools

Messages:
  - Radio history for this channel (filtered to what this agent would hear)
  - User's current transmission
```

### 7. Region Agent Registry

Each region defines its agents. This replaces the current separate `Coastguard`, `Vessels`, and `Marinas` fields:

```go
type Region struct {
    ID           string       `json:"id"`
    Name         string       `json:"name"`
    Description  string       `json:"description"`
    Agents       []RadioAgent `json:"agents"`
    LocalFlavour string       `json:"local_flavour"`
}
```

Example for UK South:
```go
Agents: []RadioAgent{
    {
        ID: "solent-cg", Name: "Solent Coastguard", CallSign: "SOLENT COASTGUARD",
        AgentType: "coastguard", Position: Position{50.8, -1.3},
        SystemPrompt: "You are a duty watchkeeper at Solent Coastguard MRCC. Professional, calm under pressure, 15 years experience. You coordinate SAR operations for the area from Teignmouth to Beachy Head. You know the Solent intimately — every sandbank, tidal gate, and shipping lane.",
        KnowledgeDocs: []string{"procedures/sar-coordination.md", "procedures/gmdss-procedures.md", "regions/uk-south/pilot-notes.md", "regions/uk-south/hazards.md"},
        Tools: []string{"get_weather", "get_tides", "get_ais_targets", "get_time", "get_vessel_info", "get_navigational_warnings"},
    },
    {
        ID: "doris-may", Name: "Doris May", CallSign: "MDMX9",
        AgentType: "vessel", Nationality: "British", Position: Position{50.15, -5.07},
        SystemPrompt: "You are Jim, 68, retired engineer sailing a Hallberg-Rassy 40 called Doris May with your wife Margaret. You've been cruising the south coast for 12 years. Methodical, always check in with the coastguard, offer helpful local knowledge. Currently heading from Falmouth to Plymouth.",
        KnowledgeDocs: []string{"procedures/colregs-quick-ref.md", "vessel-types/sailing-yacht.md", "regions/uk-south/anchorages.md"},
        Tools: []string{"get_weather", "get_time"},
        VesselSpec: &VesselSpec{Type: "sailing", Length: "12m", Flag: "UK", MMSI: "235001234", Rig: "sloop"},
    },
    // ... more agents
}
```

## Migration Path

### Phase 1 (V1): On-demand agents
- Implement RadioAgent struct and agent registry
- Build dispatcher with callsign matching
- Create knowledge store with initial docs
- Implement weather tool (Open-Meteo)
- Each call activates one agent at a time
- Frontend unchanged — same JSON response format
- Existing scenarios continue to work (scenario instructions injected into agent context)

### Phase 2 (V2): Multi-agent channel
- Agents "listen" to all channel traffic
- Dispatcher can trigger background agent responses
- A vessel might call coastguard while user is on frequency
- Coastguard might relay information to multiple vessels
- Channel becomes a living, breathing radio environment

## API Changes

The `/api/vhf/transmit` endpoint response format stays identical:

```json
{
  "response": { "station": "SOLENT COASTGUARD", "message": "...", "channel": 16 },
  "feedback": { "correct": [...], "errors": [...], "protocol_note": "..." },
  "scenario": { "state": "...", "next_expected": "...", "complete": false }
}
```

The frontend is unaware of the multi-agent architecture — it just sends a message and gets a response. All the agent orchestration happens server-side.

## Cost Considerations

- Each agent call is a Claude API call with potentially larger context (knowledge docs + world state)
- Knowledge docs should be concise — summaries not full pilot books
- Weather API (Open-Meteo) is free
- AIS (aisstream.io) has a free tier
- V1 cost per exchange: ~$0.02-0.05 (larger context than current $0.01-0.03)
- V2 cost: multiplied by number of active agents per turn
