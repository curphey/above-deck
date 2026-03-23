# VHF Multi-Agent Phase 1: Agent Model + Dispatcher

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single LLM call with an agent-per-character dispatcher — each radio character is an independent Claude agent with its own system prompt, knowledge context, and tool access.

**Architecture:** A `RadioAgent` struct defines each character (coastguard, vessel, marina). When the user transmits, a dispatcher identifies who's being called (callsign matching), builds that agent's context (personality + knowledge + world state), and calls Claude with that agent's persona. The frontend is unchanged — same JSON response format.

**Tech Stack:** Go (backend), Claude Messages API with tool_use

**Design Spec:** `docs/superpowers/specs/2026-03-23-vhf-multi-agent-design.md`

---

## File Structure

### New Files
- `packages/api/internal/agent/types.go` — RadioAgent, Position, VesselSpec, WorldState structs
- `packages/api/internal/agent/registry.go` — Agent lookup by callsign/name, fuzzy matching
- `packages/api/internal/agent/registry_test.go` — Registry tests
- `packages/api/internal/agent/dispatcher.go` — Routes transmissions to correct agent, builds context
- `packages/api/internal/agent/dispatcher_test.go` — Dispatcher tests
- `packages/api/internal/agent/context.go` — Assembles system prompt + knowledge + world state for an agent
- `packages/api/internal/agent/context_test.go` — Context assembly tests
- `packages/api/internal/agent/world.go` — WorldState management per session
- `packages/api/internal/agent/resolver.go` — Identifies who's being called from message text
- `packages/api/internal/agent/resolver_test.go` — Resolver tests
- `packages/api/knowledge/procedures/colregs-quick-ref.md` — COLREGS reference
- `packages/api/knowledge/procedures/sar-coordination.md` — SAR procedures
- `packages/api/knowledge/regions/uk-south/pilot-notes.md` — UK South pilot notes

### Modified Files
- `packages/api/internal/radio/regions.go` — Add `Agents []RadioAgent` field to Region, populate for uk-south as proof of concept
- `packages/api/internal/handler/transmit.go` — Wire dispatcher instead of direct LLM call
- `packages/api/cmd/server/main.go` — Initialize agent registry + dispatcher

### Unchanged
- `packages/api/internal/llm/client.go` — Still used by dispatcher for Claude API calls
- Frontend code — No changes, same JSON response format

---

## Task 1: Define Agent Types

**Files:**
- Create: `packages/api/internal/agent/types.go`

- [ ] **Step 1: Create the agent package with type definitions**

```go
package agent

// RadioAgent represents a character in the VHF radio environment.
type RadioAgent struct {
	ID            string            `json:"id"`
	Name          string            `json:"name"`
	CallSign      string            `json:"call_sign"`
	AgentType     string            `json:"agent_type"` // coastguard, vessel, marina, port-control
	Nationality   string            `json:"nationality,omitempty"`
	Position      Position          `json:"position"`
	SystemPrompt  string            `json:"system_prompt"`
	KnowledgeDocs []string          `json:"knowledge_docs"`
	Tools         []string          `json:"tools"`
	VesselSpec    *VesselSpec       `json:"vessel_spec,omitempty"`
	Metadata      map[string]string `json:"metadata,omitempty"`
}

// Position represents a geographic coordinate.
type Position struct {
	Lat float64 `json:"lat"`
	Lon float64 `json:"lon"`
}

// VesselSpec describes a vessel's physical characteristics.
type VesselSpec struct {
	Type   string `json:"type"`
	Length string `json:"length"`
	Flag   string `json:"flag"`
	MMSI   string `json:"mmsi"`
	Draft  string `json:"draft,omitempty"`
	Rig    string `json:"rig,omitempty"`
	Engine string `json:"engine,omitempty"`
}

// WorldState is the shared state all agents in a session can see.
type WorldState struct {
	RegionID     string           `json:"region_id"`
	RegionName   string           `json:"region_name"`
	CurrentTime  string           `json:"current_time"`
	Weather      WeatherState     `json:"weather"`
	Vessels      []VesselPosition `json:"vessels"`
	RadioHistory []RadioMessage   `json:"radio_history"`
}

// WeatherState describes current conditions.
type WeatherState struct {
	WindSpeedKnots float64 `json:"wind_speed_knots"`
	WindDirection  int     `json:"wind_direction"`
	SeaState       string  `json:"sea_state"`
	Visibility     string  `json:"visibility"`
	Forecast       string  `json:"forecast"`
}

// VesselPosition is a vessel's current location in the world.
type VesselPosition struct {
	Name     string  `json:"name"`
	CallSign string  `json:"call_sign"`
	Lat      float64 `json:"lat"`
	Lon      float64 `json:"lon"`
	SOG      float64 `json:"sog"`
	COG      int     `json:"cog"`
}

// RadioMessage is a single transmission on the channel.
type RadioMessage struct {
	Station   string `json:"station"`
	Message   string `json:"message"`
	Channel   int    `json:"channel"`
	Direction string `json:"direction"` // tx or rx
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd packages/api && go build ./internal/agent/`

- [ ] **Step 3: Commit**

```bash
git add packages/api/internal/agent/types.go
git commit -m "feat(agent): define RadioAgent, WorldState, and related types"
```

---

## Task 2: Build Agent Registry

**Files:**
- Create: `packages/api/internal/agent/registry.go`
- Create: `packages/api/internal/agent/registry_test.go`

- [ ] **Step 1: Write failing tests**

```go
package agent

import "testing"

func TestRegistryFindByCallSign(t *testing.T) {
	agents := []RadioAgent{
		{ID: "solent-cg", Name: "Solent Coastguard", CallSign: "SOLENT COASTGUARD", AgentType: "coastguard"},
		{ID: "doris-may", Name: "Doris May", CallSign: "MDMX9", AgentType: "vessel"},
	}
	reg := NewRegistry(agents)

	agent, ok := reg.FindByCallSign("SOLENT COASTGUARD")
	if !ok { t.Fatal("expected to find agent") }
	if agent.ID != "solent-cg" { t.Errorf("expected solent-cg, got %s", agent.ID) }
}

func TestRegistryFindByCallSignCaseInsensitive(t *testing.T) {
	agents := []RadioAgent{
		{ID: "solent-cg", Name: "Solent Coastguard", CallSign: "SOLENT COASTGUARD", AgentType: "coastguard"},
	}
	reg := NewRegistry(agents)

	_, ok := reg.FindByCallSign("solent coastguard")
	if !ok { t.Fatal("expected case-insensitive match") }
}

func TestRegistryFindByNameFuzzy(t *testing.T) {
	agents := []RadioAgent{
		{ID: "solent-cg", Name: "Solent Coastguard", CallSign: "SOLENT COASTGUARD", AgentType: "coastguard"},
		{ID: "doris-may", Name: "Doris May", CallSign: "MDMX9", AgentType: "vessel"},
	}
	reg := NewRegistry(agents)

	agent, ok := reg.FindByNameFuzzy("coastguard")
	if !ok { t.Fatal("expected to find agent") }
	if agent.ID != "solent-cg" { t.Errorf("expected solent-cg, got %s", agent.ID) }

	agent, ok = reg.FindByNameFuzzy("doris")
	if !ok { t.Fatal("expected to find agent") }
	if agent.ID != "doris-may" { t.Errorf("expected doris-may, got %s", agent.ID) }
}

func TestRegistryDefaultAgent(t *testing.T) {
	agents := []RadioAgent{
		{ID: "solent-cg", Name: "Solent Coastguard", CallSign: "SOLENT COASTGUARD", AgentType: "coastguard"},
		{ID: "doris-may", Name: "Doris May", CallSign: "MDMX9", AgentType: "vessel"},
	}
	reg := NewRegistry(agents)

	agent := reg.DefaultAgent()
	if agent.AgentType != "coastguard" { t.Errorf("expected coastguard as default, got %s", agent.AgentType) }
}

func TestRegistryFindByNameFuzzyNoMatch(t *testing.T) {
	agents := []RadioAgent{
		{ID: "solent-cg", Name: "Solent Coastguard", CallSign: "SOLENT COASTGUARD", AgentType: "coastguard"},
	}
	reg := NewRegistry(agents)

	_, ok := reg.FindByNameFuzzy("nonexistent vessel")
	if ok { t.Fatal("expected no match") }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/api && go test ./internal/agent/ -v`

- [ ] **Step 3: Implement Registry**

```go
package agent

import "strings"

// Registry holds the agents for a region and provides lookup methods.
type Registry struct {
	agents []RadioAgent
}

// NewRegistry creates a Registry from a slice of agents.
func NewRegistry(agents []RadioAgent) *Registry {
	return &Registry{agents: agents}
}

// FindByCallSign returns an agent matching the callsign (case-insensitive exact match).
func (r *Registry) FindByCallSign(callSign string) (RadioAgent, bool) {
	upper := strings.ToUpper(callSign)
	for _, a := range r.agents {
		if strings.ToUpper(a.CallSign) == upper {
			return a, true
		}
	}
	return RadioAgent{}, false
}

// FindByNameFuzzy returns the first agent whose name contains the query (case-insensitive).
func (r *Registry) FindByNameFuzzy(query string) (RadioAgent, bool) {
	lower := strings.ToLower(query)
	for _, a := range r.agents {
		if strings.Contains(strings.ToLower(a.Name), lower) {
			return a, true
		}
		if strings.Contains(strings.ToLower(a.CallSign), lower) {
			return a, true
		}
	}
	return RadioAgent{}, false
}

// DefaultAgent returns the first coastguard agent, or the first agent if no coastguard exists.
func (r *Registry) DefaultAgent() RadioAgent {
	for _, a := range r.agents {
		if a.AgentType == "coastguard" {
			return a
		}
	}
	if len(r.agents) > 0 {
		return r.agents[0]
	}
	return RadioAgent{ID: "unknown", Name: "Unknown Station", CallSign: "UNKNOWN", AgentType: "coastguard"}
}

// All returns all agents in the registry.
func (r *Registry) All() []RadioAgent {
	return r.agents
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/api && go test ./internal/agent/ -v`

- [ ] **Step 5: Commit**

```bash
git add packages/api/internal/agent/
git commit -m "feat(agent): add agent registry with callsign and fuzzy name lookup"
```

---

## Task 3: Build Call Resolver

**Files:**
- Create: `packages/api/internal/agent/resolver.go`
- Create: `packages/api/internal/agent/resolver_test.go`

- [ ] **Step 1: Write failing tests**

```go
package agent

import "testing"

func TestResolveCallTarget(t *testing.T) {
	agents := []RadioAgent{
		{ID: "solent-cg", Name: "Solent Coastguard", CallSign: "SOLENT COASTGUARD", AgentType: "coastguard"},
		{ID: "doris-may", Name: "Doris May", CallSign: "MDMX9", AgentType: "vessel"},
		{ID: "falmouth-cg", Name: "Falmouth Coastguard", CallSign: "FALMOUTH COASTGUARD", AgentType: "coastguard"},
	}
	reg := NewRegistry(agents)
	resolver := NewResolver(reg)

	tests := []struct {
		message  string
		expected string
	}{
		{"Solent Coastguard, Solent Coastguard, this is Artemis", "solent-cg"},
		{"SOLENT COASTGUARD this is sailing vessel Artemis over", "solent-cg"},
		{"Doris May, Doris May, this is Artemis, over", "doris-may"},
		{"Falmouth Coastguard this is Artemis requesting radio check", "falmouth-cg"},
		{"All stations, all stations, this is Artemis", "solent-cg"},   // defaults to first coastguard
		{"Mayday mayday mayday this is Artemis", "solent-cg"},          // distress goes to coastguard
		{"Hello can anyone hear me", "solent-cg"},                       // no match → default
	}

	for _, tt := range tests {
		t.Run(tt.message, func(t *testing.T) {
			agent := resolver.Resolve(tt.message)
			if agent.ID != tt.expected {
				t.Errorf("message %q: expected %s, got %s", tt.message, tt.expected, agent.ID)
			}
		})
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Implement Resolver**

```go
package agent

import "strings"

// Resolver identifies which agent is being called in a radio message.
type Resolver struct {
	registry *Registry
}

// NewResolver creates a Resolver backed by the given registry.
func NewResolver(registry *Registry) *Resolver {
	return &Resolver{registry: registry}
}

// Resolve identifies the target agent from a radio message.
// Strategy: try callsign match first, then fuzzy name match, then default to coastguard.
func (r *Resolver) Resolve(message string) RadioAgent {
	upper := strings.ToUpper(message)

	// Distress calls and "all stations" go to coastguard
	if strings.Contains(upper, "MAYDAY") || strings.Contains(upper, "PAN PAN") ||
		strings.Contains(upper, "ALL STATIONS") || strings.Contains(upper, "SECURITÉ") ||
		strings.Contains(upper, "SECURITE") {
		return r.registry.DefaultAgent()
	}

	// Try exact callsign match against all agents
	for _, a := range r.registry.All() {
		if a.CallSign != "" && strings.Contains(upper, strings.ToUpper(a.CallSign)) {
			return a
		}
	}

	// Try fuzzy name match — extract station name from "X, X, this is Y" pattern
	// The called station is typically the first words before "this is"
	parts := strings.SplitN(upper, "THIS IS", 2)
	if len(parts) == 2 {
		calledStation := strings.TrimSpace(parts[0])
		// Remove repeated names (e.g., "SOLENT COASTGUARD, SOLENT COASTGUARD,")
		calledStation = strings.ReplaceAll(calledStation, ",", " ")
		calledStation = strings.TrimSpace(calledStation)
		if agent, ok := r.registry.FindByNameFuzzy(calledStation); ok {
			return agent
		}
	}

	// No match — default to coastguard
	return r.registry.DefaultAgent()
}
```

- [ ] **Step 4: Run tests to verify they pass**

- [ ] **Step 5: Commit**

```bash
git add packages/api/internal/agent/resolver.go packages/api/internal/agent/resolver_test.go
git commit -m "feat(agent): add call resolver — identifies target agent from message text"
```

---

## Task 4: Build Agent Context Assembler

**Files:**
- Create: `packages/api/internal/agent/context.go`
- Create: `packages/api/internal/agent/context_test.go`

- [ ] **Step 1: Write failing tests**

```go
package agent

import "testing"

func TestBuildAgentSystemPrompt(t *testing.T) {
	agent := RadioAgent{
		ID: "solent-cg", Name: "Solent Coastguard", CallSign: "SOLENT COASTGUARD",
		AgentType: "coastguard",
		SystemPrompt: "You are a duty watchkeeper at Solent Coastguard.",
		KnowledgeDocs: []string{},
		Tools: []string{"get_weather", "get_time"},
	}
	world := &WorldState{
		RegionName: "UK South Coast",
		CurrentTime: "12:00 UTC",
		Weather: WeatherState{WindSpeedKnots: 15, WindDirection: 220, SeaState: "moderate", Visibility: "good"},
	}

	prompt := BuildAgentSystemPrompt(agent, world, nil, "SV Artemis", "sailing-yacht")

	if !contains(prompt, "Solent Coastguard") { t.Error("expected agent name in prompt") }
	if !contains(prompt, "duty watchkeeper") { t.Error("expected personality in prompt") }
	if !contains(prompt, "UK South Coast") { t.Error("expected region in prompt") }
	if !contains(prompt, "15") { t.Error("expected wind speed in prompt") }
	if !contains(prompt, "SV Artemis") { t.Error("expected user vessel in prompt") }
}

func TestBuildAgentSystemPromptWithScenario(t *testing.T) {
	agent := RadioAgent{
		ID: "solent-cg", Name: "Solent Coastguard", AgentType: "coastguard",
		SystemPrompt: "Coastguard agent.",
	}
	world := &WorldState{RegionName: "UK South Coast", CurrentTime: "12:00 UTC"}
	scenario := &ScenarioContext{Name: "Radio Check", Briefing: "User requests radio check", Instructions: "Respond with signal report"}

	prompt := BuildAgentSystemPrompt(agent, world, scenario, "SV Artemis", "sailing-yacht")

	if !contains(prompt, "Radio Check") { t.Error("expected scenario name in prompt") }
	if !contains(prompt, "signal report") { t.Error("expected scenario instructions in prompt") }
}

func contains(s, substr string) bool {
	return len(s) > 0 && len(substr) > 0 && strings.Contains(s, substr)
}
```

Note: add `import "strings"` to the test file.

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Implement context assembler**

```go
package agent

import (
	"fmt"
	"strings"
)

// ScenarioContext holds scenario information for the agent prompt.
type ScenarioContext struct {
	Name         string
	Briefing     string
	Instructions string
	Completion   string
}

// BuildAgentSystemPrompt assembles the full system prompt for an agent call.
func BuildAgentSystemPrompt(agent RadioAgent, world *WorldState, scenario *ScenarioContext, userVessel, userVesselType string) string {
	var sb strings.Builder

	// 1. Agent identity
	sb.WriteString(fmt.Sprintf("You are %s (callsign: %s). You are a %s.\n\n", agent.Name, agent.CallSign, agent.AgentType))
	sb.WriteString(fmt.Sprintf("## Your Character\n\n%s\n\n", agent.SystemPrompt))

	// 2. Vessel spec (if applicable)
	if agent.VesselSpec != nil {
		sb.WriteString("## Your Vessel\n\n")
		sb.WriteString(fmt.Sprintf("Type: %s, Length: %s, Flag: %s, MMSI: %s\n", agent.VesselSpec.Type, agent.VesselSpec.Length, agent.VesselSpec.Flag, agent.VesselSpec.MMSI))
		if agent.VesselSpec.Rig != "" { sb.WriteString(fmt.Sprintf("Rig: %s\n", agent.VesselSpec.Rig)) }
		if agent.VesselSpec.Engine != "" { sb.WriteString(fmt.Sprintf("Engine: %s\n", agent.VesselSpec.Engine)) }
		sb.WriteString("\n")
	}

	// 3. VHF procedures (shared)
	sb.WriteString("## VHF Radio Procedures\n\n")
	sb.WriteString("Follow ITU Radio Regulations and GMDSS procedures. Use correct prowords (OVER, OUT, ROGER, etc). Use phonetic alphabet for spelling. Channel 16 is distress/safety/calling. Distress priority: MAYDAY > PAN PAN > SECURITÉ > routine.\n\n")

	// 4. World state
	if world != nil {
		sb.WriteString(fmt.Sprintf("## Current Situation\n\nRegion: %s\nTime: %s\n", world.RegionName, world.CurrentTime))
		sb.WriteString(fmt.Sprintf("Weather: Wind %g knots from %d°, sea state %s, visibility %s\n", world.Weather.WindSpeedKnots, world.Weather.WindDirection, world.Weather.SeaState, world.Weather.Visibility))
		if world.Weather.Forecast != "" {
			sb.WriteString(fmt.Sprintf("Forecast: %s\n", world.Weather.Forecast))
		}
		sb.WriteString("\n")
	}

	// 5. User's vessel
	sb.WriteString(fmt.Sprintf("## The Vessel Calling You\n\nName: %s\nType: %s\n\n", userVessel, userVesselType))

	// 6. Scenario (if active)
	if scenario != nil {
		sb.WriteString(fmt.Sprintf("## Active Scenario: %s\n\n", scenario.Name))
		sb.WriteString(fmt.Sprintf("Briefing: %s\n\n", scenario.Briefing))
		sb.WriteString(fmt.Sprintf("Instructions: %s\n\n", scenario.Instructions))
		if scenario.Completion != "" {
			sb.WriteString(fmt.Sprintf("Completion criteria: %s\n\n", scenario.Completion))
		}
	}

	// 7. Response format
	sb.WriteString("## Response Format\n\n")
	sb.WriteString("Always respond with valid JSON only — no markdown fences, no explanation, just the JSON object:\n")
	sb.WriteString(`{"response":{"station":"your callsign","message":"your radio dialogue","channel":16},"feedback":{"correct":["things user did right"],"errors":["protocol mistakes"],"protocol_note":"what should happen next"},"scenario":{"state":"current step","next_expected":"what user should do","complete":false,"score":null}}`)
	sb.WriteString("\n")

	return sb.String()
}
```

- [ ] **Step 4: Run tests to verify they pass**

- [ ] **Step 5: Commit**

```bash
git add packages/api/internal/agent/context.go packages/api/internal/agent/context_test.go
git commit -m "feat(agent): add context assembler — builds agent system prompt with world state"
```

---

## Task 5: Build World State Manager

**Files:**
- Create: `packages/api/internal/agent/world.go`

- [ ] **Step 1: Implement WorldState manager**

```go
package agent

import "time"

// NewWorldState creates a default WorldState for a region.
func NewWorldState(regionID, regionName string) *WorldState {
	return &WorldState{
		RegionID:     regionID,
		RegionName:   regionName,
		CurrentTime:  time.Now().UTC().Format("15:04 UTC"),
		Weather:      DefaultWeather(regionID),
		Vessels:      []VesselPosition{},
		RadioHistory: []RadioMessage{},
	}
}

// AddRadioMessage appends a transmission to the radio history.
func (w *WorldState) AddRadioMessage(station, message string, channel int, direction string) {
	w.RadioHistory = append(w.RadioHistory, RadioMessage{
		Station: station, Message: message, Channel: channel, Direction: direction,
	})
}

// DefaultWeather returns typical weather for a region.
func DefaultWeather(regionID string) WeatherState {
	switch regionID {
	case "uk-south":
		return WeatherState{WindSpeedKnots: 15, WindDirection: 220, SeaState: "moderate", Visibility: "good", Forecast: "SW 15-20kn, moderate sea, good visibility, rain later"}
	case "caribbean":
		return WeatherState{WindSpeedKnots: 18, WindDirection: 60, SeaState: "slight to moderate", Visibility: "excellent", Forecast: "NE trades 15-20kn, fair weather, isolated showers"}
	case "med-greece":
		return WeatherState{WindSpeedKnots: 20, WindDirection: 30, SeaState: "moderate to rough", Visibility: "excellent", Forecast: "Meltemi NE 20-25kn, clear skies, rough in open channels"}
	case "se-asia":
		return WeatherState{WindSpeedKnots: 10, WindDirection: 270, SeaState: "slight", Visibility: "moderate", Forecast: "SW monsoon light, hazy, afternoon thunderstorms possible"}
	case "pacific":
		return WeatherState{WindSpeedKnots: 12, WindDirection: 120, SeaState: "slight", Visibility: "good", Forecast: "SE trades 10-15kn, partly cloudy, no tropical systems"}
	case "atlantic":
		return WeatherState{WindSpeedKnots: 22, WindDirection: 40, SeaState: "moderate", Visibility: "good", Forecast: "NE trades 20-25kn, building seas, fair weather"}
	default:
		return WeatherState{WindSpeedKnots: 12, WindDirection: 180, SeaState: "slight", Visibility: "good", Forecast: "Moderate conditions"}
	}
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd packages/api && go build ./internal/agent/`

- [ ] **Step 3: Commit**

```bash
git add packages/api/internal/agent/world.go
git commit -m "feat(agent): add world state manager with default weather per region"
```

---

## Task 6: Build Agent Dispatcher

**Files:**
- Create: `packages/api/internal/agent/dispatcher.go`
- Create: `packages/api/internal/agent/dispatcher_test.go`

- [ ] **Step 1: Write failing tests**

```go
package agent

import (
	"context"
	"testing"

	"github.com/curphey/above-deck/api/internal/llm"
)

// mockLLM implements the LLM interface for testing.
type mockLLM struct {
	lastSystemPrompt string
	lastMessages     []llm.Message
}

func (m *mockLLM) SendMessage(ctx context.Context, apiKey, systemPrompt string, messages []llm.Message) (*llm.VHFResponse, error) {
	m.lastSystemPrompt = systemPrompt
	m.lastMessages = messages
	return &llm.VHFResponse{
		Response: struct {
			Station string `json:"station"`
			Message string `json:"message"`
			Channel int    `json:"channel"`
		}{Station: "TEST STATION", Message: "test response", Channel: 16},
	}, nil
}

func TestDispatcherRoutesToCorrectAgent(t *testing.T) {
	agents := []RadioAgent{
		{ID: "solent-cg", Name: "Solent Coastguard", CallSign: "SOLENT COASTGUARD", AgentType: "coastguard", SystemPrompt: "You are Solent Coastguard."},
		{ID: "doris-may", Name: "Doris May", CallSign: "MDMX9", AgentType: "vessel", SystemPrompt: "You are Jim on Doris May."},
	}
	mock := &mockLLM{}
	d := NewDispatcher(agents, mock)

	_, err := d.Dispatch(context.Background(), "test-key", "Solent Coastguard this is Artemis over", "uk-south", "SV Artemis", "sailing-yacht", nil)
	if err != nil { t.Fatal(err) }

	if !contains(mock.lastSystemPrompt, "Solent Coastguard") {
		t.Error("expected Solent Coastguard in system prompt")
	}
	if contains(mock.lastSystemPrompt, "Jim on Doris May") {
		t.Error("should NOT contain Doris May personality")
	}
}

func TestDispatcherRoutesToVessel(t *testing.T) {
	agents := []RadioAgent{
		{ID: "solent-cg", Name: "Solent Coastguard", CallSign: "SOLENT COASTGUARD", AgentType: "coastguard", SystemPrompt: "Coastguard."},
		{ID: "doris-may", Name: "Doris May", CallSign: "MDMX9", AgentType: "vessel", SystemPrompt: "You are Jim on Doris May."},
	}
	mock := &mockLLM{}
	d := NewDispatcher(agents, mock)

	_, err := d.Dispatch(context.Background(), "test-key", "Doris May, Doris May, this is Artemis", "uk-south", "SV Artemis", "sailing-yacht", nil)
	if err != nil { t.Fatal(err) }

	if !contains(mock.lastSystemPrompt, "Jim on Doris May") {
		t.Error("expected Doris May personality in system prompt")
	}
}

func TestDispatcherDefaultsToCoastguard(t *testing.T) {
	agents := []RadioAgent{
		{ID: "solent-cg", Name: "Solent Coastguard", CallSign: "SOLENT COASTGUARD", AgentType: "coastguard", SystemPrompt: "Coastguard."},
	}
	mock := &mockLLM{}
	d := NewDispatcher(agents, mock)

	_, err := d.Dispatch(context.Background(), "test-key", "hello anyone there", "uk-south", "SV Artemis", "sailing-yacht", nil)
	if err != nil { t.Fatal(err) }

	if !contains(mock.lastSystemPrompt, "Solent Coastguard") {
		t.Error("expected coastguard as default")
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Implement Dispatcher**

```go
package agent

import (
	"context"

	"github.com/curphey/above-deck/api/internal/llm"
)

// LLMClient is the interface for sending messages to Claude.
type LLMClient interface {
	SendMessage(ctx context.Context, apiKey, systemPrompt string, messages []llm.Message) (*llm.VHFResponse, error)
}

// Dispatcher routes radio transmissions to the correct agent.
type Dispatcher struct {
	registry *Registry
	resolver *Resolver
	client   LLMClient
	worlds   map[string]*WorldState // sessionID → world state
}

// NewDispatcher creates a Dispatcher for the given agents.
func NewDispatcher(agents []RadioAgent, client LLMClient) *Dispatcher {
	reg := NewRegistry(agents)
	return &Dispatcher{
		registry: reg,
		resolver: NewResolver(reg),
		client:   client,
		worlds:   make(map[string]*WorldState),
	}
}

// Dispatch handles a user transmission: resolves the target agent, builds context, calls Claude.
func (d *Dispatcher) Dispatch(ctx context.Context, apiKey, message, regionID, vesselName, vesselType string, scenario *ScenarioContext) (*llm.VHFResponse, error) {
	// Resolve who's being called
	agent := d.resolver.Resolve(message)

	// Get or create world state
	world := d.GetOrCreateWorld(regionID)

	// Record the user's transmission
	world.AddRadioMessage(vesselName, message, 16, "tx")

	// Build the agent's system prompt
	systemPrompt := BuildAgentSystemPrompt(agent, world, scenario, vesselName, vesselType)

	// Build message history from radio history
	messages := d.buildMessages(world, vesselName)

	// Call Claude as this agent
	resp, err := d.client.SendMessage(ctx, apiKey, systemPrompt, messages)
	if err != nil {
		return nil, err
	}

	// Record the agent's response
	world.AddRadioMessage(agent.Name, resp.Response.Message, resp.Response.Channel, "rx")

	return resp, nil
}

// GetOrCreateWorld returns the world state for a session, creating if needed.
func (d *Dispatcher) GetOrCreateWorld(regionID string) *WorldState {
	if w, ok := d.worlds[regionID]; ok {
		return w
	}
	w := NewWorldState(regionID, regionID)
	d.worlds[regionID] = w
	return w
}

// buildMessages converts radio history to LLM messages.
func (d *Dispatcher) buildMessages(world *WorldState, userName string) []llm.Message {
	messages := make([]llm.Message, 0, len(world.RadioHistory))
	for _, rm := range world.RadioHistory {
		role := "assistant"
		if rm.Station == userName {
			role = "user"
		}
		messages = append(messages, llm.Message{Role: role, Content: rm.Message})
	}
	return messages
}
```

- [ ] **Step 4: Run tests to verify they pass**

- [ ] **Step 5: Commit**

```bash
git add packages/api/internal/agent/dispatcher.go packages/api/internal/agent/dispatcher_test.go
git commit -m "feat(agent): add dispatcher — routes transmissions to correct agent via Claude"
```

---

## Task 7: Add UK South Agents to Region

**Files:**
- Modify: `packages/api/internal/radio/regions.go`

- [ ] **Step 1: Add Agents field to Region struct**

Add `Agents []agent.RadioAgent` field to the `Region` struct. Import the agent package.

Note: to avoid circular imports, the `RadioAgent` type definitions may need to live in `radio` package instead of `agent`, or the agents can be defined as raw data in `regions.go` and converted. Choose the simplest approach — if circular import is an issue, move the `RadioAgent` struct to a shared `types` package or keep agent definitions in the `agent` package loaded from the `radio` data.

The simplest approach: define agents inline in `regions.go` using the `agent.RadioAgent` type. Import `"github.com/curphey/above-deck/api/internal/agent"`.

- [ ] **Step 2: Populate UK South agents**

Add agents for the uk-south region (proof of concept — other regions in a later task):

- `solent-cg`: Solent Coastguard — professional watchkeeper, 15 years experience, knows every sandbank
- `falmouth-cg`: Falmouth Coastguard — experienced, covers Land's End to Teignmouth
- `doris-may`: Retired couple on HR40, methodical, local knowledge
- `blue-horizon`: French family cruiser, polite, planning Cherbourg crossing
- `saoirse`: Solo Irish circumnavigator, laconic, experienced
- `windchaser`: Live-aboard family with kids, enthusiastic, chatty
- `nordic-spirit`: Norwegian delivery crew, professional and precise

Each with appropriate SystemPrompt, KnowledgeDocs, Tools, Position, and VesselSpec.

- [ ] **Step 3: Run tests**

Run: `cd packages/api && go test ./internal/radio/ -v`

- [ ] **Step 4: Commit**

```bash
git add packages/api/internal/radio/regions.go
git commit -m "feat(agent): add RadioAgent definitions for UK South region"
```

---

## Task 8: Wire Dispatcher into Transmit Handler

**Files:**
- Modify: `packages/api/internal/handler/transmit.go`
- Modify: `packages/api/cmd/server/main.go`

- [ ] **Step 1: Update TransmitHandler to use dispatcher**

The current transmit handler calls `h.client.SendMessage()` directly with a system prompt built by `llm.BuildSystemPrompt()`. Replace this with the agent dispatcher.

In `transmit.go`:
- Add a `dispatcher *agent.Dispatcher` field to `TransmitHandler`
- In `ServeHTTP`, call `h.dispatcher.Dispatch()` instead of building the prompt and calling the LLM directly
- Map the scenario from the session to a `*agent.ScenarioContext`
- The dispatcher handles agent resolution, context building, and LLM calling

Keep the existing handler as a fallback: if the session's region has no agents defined, fall back to the old `llm.BuildSystemPrompt` path. This ensures regions without agent definitions still work.

- [ ] **Step 2: Update main.go**

Initialize the dispatcher with the agents from the session's region. Since agents vary by region, the dispatcher may need to be created per-session or accept agents dynamically.

Simplest approach: pass the LLM client to the transmit handler, and have the handler create a dispatcher on-the-fly for each request using the session's region agents.

- [ ] **Step 3: Test manually**

Restart the Go server, create a session with `uk-south`, transmit "Solent Coastguard this is Artemis over", verify the response comes from the Solent Coastguard agent (not a generic response).

- [ ] **Step 4: Run Go tests**

Run: `cd packages/api && go test ./... -v`

- [ ] **Step 5: Commit**

```bash
git add packages/api/internal/handler/transmit.go packages/api/cmd/server/main.go
git commit -m "feat(agent): wire dispatcher into transmit handler — agents now respond to calls"
```

---

## Task 9: Add Initial Knowledge Docs

**Files:**
- Create: `packages/api/knowledge/procedures/colregs-quick-ref.md`
- Create: `packages/api/knowledge/procedures/sar-coordination.md`
- Create: `packages/api/knowledge/regions/uk-south/pilot-notes.md`

- [ ] **Step 1: Create COLREGS quick reference**

Concise markdown covering key rules: rule 5 (lookout), rule 7 (risk of collision), rule 8 (action to avoid collision), rules 12-18 (sailing/power/restricted), rule 19 (restricted visibility). 200-300 words max — this is injected as context, not a textbook.

- [ ] **Step 2: Create SAR coordination reference**

Key SAR procedures for coastguard agents: initial response to distress, requesting position/POB/vessel description, coordinating with RNLI/helicopters, establishing radio silence, Mayday relay procedures. 200-300 words.

- [ ] **Step 3: Create UK South pilot notes**

Key navigational information: Solent tidal gates (Hurst Narrows, the Needles), Portland Bill race, shipping lanes, firing ranges, popular anchorages, approaches to key ports. 300-400 words.

- [ ] **Step 4: Wire knowledge loading into context assembler**

In `context.go`, add a function to load knowledge docs from disk:

```go
// LoadKnowledgeDocs reads markdown files from the knowledge directory.
func LoadKnowledgeDocs(basePath string, docs []string) string {
	var sb strings.Builder
	for _, doc := range docs {
		path := filepath.Join(basePath, doc)
		data, err := os.ReadFile(path)
		if err != nil {
			continue // skip missing docs
		}
		sb.WriteString(fmt.Sprintf("\n## Reference: %s\n\n", doc))
		sb.WriteString(string(data))
		sb.WriteString("\n")
	}
	return sb.String()
}
```

Update `BuildAgentSystemPrompt` to accept and include loaded knowledge docs.

- [ ] **Step 5: Commit**

```bash
git add packages/api/knowledge/ packages/api/internal/agent/context.go
git commit -m "feat(agent): add initial knowledge docs and wire into context assembler"
```

---

## Task 10: Integration Test

- [ ] **Step 1: Run full Go test suite**

Run: `cd packages/api && go test ./... -v`

- [ ] **Step 2: Run full frontend test suite**

Run: `cd packages/tools && pnpm test -- --run`

- [ ] **Step 3: Manual integration test**

1. Start Go server with .env
2. Create session with uk-south region
3. Call Solent Coastguard — verify agent personality in response
4. Call Doris May — verify different personality
5. Send Mayday — verify coastguard responds (not vessel)
6. Call unknown station — verify coastguard defaults
7. Check feedback still works in FeedbackPanel

- [ ] **Step 4: Commit any fixes**

```bash
git commit -am "fix(agent): integration fixes"
```
