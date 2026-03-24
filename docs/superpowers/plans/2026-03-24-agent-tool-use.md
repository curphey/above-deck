# Agent Tool Use Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give VHF radio agents the ability to call real APIs (weather, AIS, time) during conversations using Claude's native tool_use feature.

**Architecture:** Extend the LLM client to support Claude tool definitions and handle the tool_use loop (send tools → detect tool_use stop reason → execute tool → send result back → repeat until text response). Each tool is a Go struct implementing a `Tool` interface. The dispatcher selects which tools to pass based on `RadioAgent.Tools[]`. Tool execution happens server-side — the frontend sees no change.

**Tech Stack:** Go 1.22, Claude Messages API with tool_use, Open-Meteo marine API (free, no key), cached AIS data from aisstream.io

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `internal/tools/tool.go` | Tool interface + registry |
| Create | `internal/tools/weather.go` | Open-Meteo marine API client |
| Create | `internal/tools/weather_test.go` | Weather tool tests |
| Create | `internal/tools/ais.go` | AIS target lookup from cached data |
| Create | `internal/tools/ais_test.go` | AIS tool tests |
| Create | `internal/tools/time.go` | UTC time tool |
| Create | `internal/tools/time_test.go` | Time tool tests |
| Create | `internal/tools/executor.go` | Executes tool calls by name, returns results |
| Create | `internal/tools/executor_test.go` | Executor dispatch tests |
| Modify | `internal/llm/client.go` | Add tool_use types, SendMessageWithTools method |
| Create | `internal/llm/tools_test.go` | Tests for tool_use loop |
| Modify | `internal/agent/dispatcher.go` | Pass tools to LLM based on agent.Tools[] |
| Modify | `internal/agent/dispatcher_test.go` | Test tool-use dispatch path |
| Modify | `internal/handler/transmit.go` | Wire AIS client + tool executor into dispatcher |
| Modify | `cmd/server/main.go` | Pass AIS client to transmit handler |

---

### Task 1: Tool Interface and Registry

**Files:**
- Create: `internal/tools/tool.go`
- Create: `internal/tools/time.go`
- Create: `internal/tools/time_test.go`

- [ ] **Step 1: Write the failing test for TimeTool**

```go
// internal/tools/time_test.go
package tools_test

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/curphey/above-deck/api/internal/tools"
)

func TestTimeTool_Definition(t *testing.T) {
	tool := tools.NewTimeTool()
	def := tool.Definition()
	if def.Name != "get_time" {
		t.Errorf("expected name get_time, got %s", def.Name)
	}
}

func TestTimeTool_Execute(t *testing.T) {
	tool := tools.NewTimeTool()
	result, err := tool.Execute(json.RawMessage(`{}`))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// Result should contain a valid UTC time string
	var data struct {
		UTC string `json:"utc"`
	}
	if err := json.Unmarshal([]byte(result), &data); err != nil {
		t.Fatalf("invalid JSON result: %v", err)
	}
	if _, err := time.Parse("2006-01-02T15:04:05Z", data.UTC); err != nil {
		t.Errorf("invalid time format: %s", data.UTC)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/api && go test ./internal/tools/ -v -run TestTime`
Expected: FAIL — package does not exist

- [ ] **Step 3: Implement Tool interface and TimeTool**

```go
// internal/tools/tool.go
package tools

import "encoding/json"

// ToolDefinition matches Claude's tool_use JSON schema format.
type ToolDefinition struct {
	Name        string         `json:"name"`
	Description string         `json:"description"`
	InputSchema map[string]any `json:"input_schema"`
}

// Tool is implemented by each agent tool.
type Tool interface {
	Definition() ToolDefinition
	Execute(input json.RawMessage) (string, error)
}
```

```go
// internal/tools/time.go
package tools

import (
	"encoding/json"
	"fmt"
	"time"
)

type TimeTool struct{}

func NewTimeTool() *TimeTool { return &TimeTool{} }

func (t *TimeTool) Definition() ToolDefinition {
	return ToolDefinition{
		Name:        "get_time",
		Description: "Returns the current UTC date and time. Use when you need to know the current time for radio logs, ETAs, or scheduling.",
		InputSchema: map[string]any{
			"type":       "object",
			"properties": map[string]any{},
		},
	}
}

func (t *TimeTool) Execute(_ json.RawMessage) (string, error) {
	now := time.Now().UTC()
	return fmt.Sprintf(`{"utc":"%s","readable":"%s"}`,
		now.Format("2006-01-02T15:04:05Z"),
		now.Format("15:04 UTC, Mon 02 Jan 2006"),
	), nil
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/api && go test ./internal/tools/ -v -run TestTime`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/api/internal/tools/
git commit -m "feat(api): add tool interface and get_time tool for agent tool_use (#209)"
```

---

### Task 2: Weather Tool (Open-Meteo Marine API)

**Files:**
- Create: `internal/tools/weather.go`
- Create: `internal/tools/weather_test.go`

- [ ] **Step 1: Write failing tests for WeatherTool**

```go
// internal/tools/weather_test.go
package tools_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/curphey/above-deck/api/internal/tools"
)

func TestWeatherTool_Definition(t *testing.T) {
	tool := tools.NewWeatherTool("")
	def := tool.Definition()
	if def.Name != "get_weather" {
		t.Errorf("expected name get_weather, got %s", def.Name)
	}
	props := def.InputSchema["properties"].(map[string]any)
	if _, ok := props["latitude"]; !ok {
		t.Error("expected latitude in properties")
	}
	if _, ok := props["longitude"]; !ok {
		t.Error("expected longitude in properties")
	}
}

func TestWeatherTool_Execute(t *testing.T) {
	// Mock Open-Meteo server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"current": map[string]any{
				"wind_speed_10m":    15.5,
				"wind_direction_10m": 220.0,
				"wind_gusts_10m":    22.0,
			},
			"current_units": map[string]any{
				"wind_speed_10m": "kn",
			},
			"hourly": map[string]any{
				"wave_height":    []float64{1.2, 1.5, 1.8},
				"visibility":     []float64{24140.0, 24140.0, 20000.0},
				"time":           []string{"2026-03-24T00:00", "2026-03-24T01:00", "2026-03-24T02:00"},
			},
		})
	}))
	defer server.Close()

	tool := tools.NewWeatherTool(server.URL)
	input := `{"latitude": 50.15, "longitude": -5.07}`
	result, err := tool.Execute(json.RawMessage(input))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	var data map[string]any
	if err := json.Unmarshal([]byte(result), &data); err != nil {
		t.Fatalf("invalid JSON result: %v", err)
	}
	if _, ok := data["wind_speed_knots"]; !ok {
		t.Error("expected wind_speed_knots in result")
	}
	if _, ok := data["wind_direction"]; !ok {
		t.Error("expected wind_direction in result")
	}
}

func TestWeatherTool_MissingCoords(t *testing.T) {
	tool := tools.NewWeatherTool("")
	_, err := tool.Execute(json.RawMessage(`{}`))
	if err == nil {
		t.Error("expected error for missing coordinates")
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/api && go test ./internal/tools/ -v -run TestWeather`
Expected: FAIL — WeatherTool not defined

- [ ] **Step 3: Implement WeatherTool**

```go
// internal/tools/weather.go
package tools

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"
)

const defaultMeteoURL = "https://api.open-meteo.com"

type WeatherTool struct {
	baseURL    string
	httpClient *http.Client
}

func NewWeatherTool(baseURL string) *WeatherTool {
	if baseURL == "" {
		baseURL = defaultMeteoURL
	}
	return &WeatherTool{
		baseURL:    baseURL,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

func (w *WeatherTool) Definition() ToolDefinition {
	return ToolDefinition{
		Name:        "get_weather",
		Description: "Fetches current marine weather conditions for a given latitude/longitude. Returns wind speed (knots), direction, gusts, wave height, and visibility. Use when a vessel asks about weather conditions or you need to provide a weather forecast.",
		InputSchema: map[string]any{
			"type": "object",
			"properties": map[string]any{
				"latitude":  map[string]any{"type": "number", "description": "Latitude in decimal degrees"},
				"longitude": map[string]any{"type": "number", "description": "Longitude in decimal degrees"},
			},
			"required": []string{"latitude", "longitude"},
		},
	}
}

type weatherInput struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

func (w *WeatherTool) Execute(input json.RawMessage) (string, error) {
	var params weatherInput
	if err := json.Unmarshal(input, &params); err != nil {
		return "", fmt.Errorf("invalid input: %w", err)
	}
	if params.Latitude == 0 && params.Longitude == 0 {
		return "", errors.New("latitude and longitude are required")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	url := fmt.Sprintf("%s/v1/marine?latitude=%.4f&longitude=%.4f&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=wave_height,visibility&wind_speed_unit=kn&timezone=UTC&forecast_hours=6",
		w.baseURL, params.Latitude, params.Longitude)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return "", err
	}

	resp, err := w.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("weather API error: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return "", err
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("weather API returned %d", resp.StatusCode)
	}

	// Parse Open-Meteo response and extract key fields
	var raw map[string]any
	if err := json.Unmarshal(body, &raw); err != nil {
		return "", err
	}

	result := map[string]any{}

	if current, ok := raw["current"].(map[string]any); ok {
		if v, ok := current["wind_speed_10m"]; ok {
			result["wind_speed_knots"] = v
		}
		if v, ok := current["wind_direction_10m"]; ok {
			result["wind_direction"] = v
		}
		if v, ok := current["wind_gusts_10m"]; ok {
			result["wind_gusts_knots"] = v
		}
	}

	if hourly, ok := raw["hourly"].(map[string]any); ok {
		if waves, ok := hourly["wave_height"].([]any); ok && len(waves) > 0 {
			result["wave_height_m"] = waves[0]
		}
		if vis, ok := hourly["visibility"].([]any); ok && len(vis) > 0 {
			result["visibility_m"] = vis[0]
		}
	}

	result["location"] = map[string]any{
		"latitude":  params.Latitude,
		"longitude": params.Longitude,
	}

	out, _ := json.Marshal(result)
	return string(out), nil
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/api && go test ./internal/tools/ -v -run TestWeather`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/api/internal/tools/weather.go packages/api/internal/tools/weather_test.go
git commit -m "feat(api): add get_weather tool using Open-Meteo marine API (#209)"
```

---

### Task 3: AIS Targets Tool

**Files:**
- Create: `internal/tools/ais.go`
- Create: `internal/tools/ais_test.go`

- [ ] **Step 1: Write failing tests for AISTool**

```go
// internal/tools/ais_test.go
package tools_test

import (
	"encoding/json"
	"math"
	"testing"

	"github.com/curphey/above-deck/api/internal/ais"
	"github.com/curphey/above-deck/api/internal/tools"
)

type mockAISProvider struct {
	vessels []ais.Vessel
}

func (m *mockAISProvider) GetVessels() []ais.Vessel { return m.vessels }

func TestAISTool_Definition(t *testing.T) {
	tool := tools.NewAISTool(&mockAISProvider{})
	def := tool.Definition()
	if def.Name != "get_ais_targets" {
		t.Errorf("expected name get_ais_targets, got %s", def.Name)
	}
}

func TestAISTool_ReturnsNearbyVessels(t *testing.T) {
	provider := &mockAISProvider{
		vessels: []ais.Vessel{
			{MMSI: 123, Name: "NEARBY SHIP", Latitude: 50.16, Longitude: -5.08, SOG: 8, COG: 90},
			{MMSI: 456, Name: "FAR AWAY SHIP", Latitude: 55.0, Longitude: 10.0, SOG: 12, COG: 180},
		},
	}
	tool := tools.NewAISTool(provider)
	input := `{"latitude": 50.15, "longitude": -5.07, "radius_nm": 10}`
	result, err := tool.Execute(json.RawMessage(input))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	var data struct {
		Count   int              `json:"count"`
		Vessels []map[string]any `json:"vessels"`
	}
	if err := json.Unmarshal([]byte(result), &data); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}
	if data.Count != 1 {
		t.Errorf("expected 1 nearby vessel, got %d", data.Count)
	}
}

func TestAISTool_DefaultRadius(t *testing.T) {
	tool := tools.NewAISTool(&mockAISProvider{vessels: []ais.Vessel{}})
	input := `{"latitude": 50.0, "longitude": -5.0}`
	_, err := tool.Execute(json.RawMessage(input))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestDistanceNM(t *testing.T) {
	// Falmouth to Lizard Point ≈ 10nm
	d := tools.DistanceNM(50.15, -5.07, 49.96, -5.20)
	if math.Abs(d-12.5) > 2 {
		t.Errorf("expected ~12.5nm, got %.1f", d)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/api && go test ./internal/tools/ -v -run TestAIS`
Expected: FAIL — AISTool not defined

- [ ] **Step 3: Implement AISTool**

```go
// internal/tools/ais.go
package tools

import (
	"encoding/json"
	"fmt"
	"math"
	"sort"

	"github.com/curphey/above-deck/api/internal/ais"
)

// AISProvider is the interface for getting cached AIS vessel data.
type AISProvider interface {
	GetVessels() []ais.Vessel
}

type AISTool struct {
	provider AISProvider
}

func NewAISTool(provider AISProvider) *AISTool {
	return &AISTool{provider: provider}
}

func (a *AISTool) Definition() ToolDefinition {
	return ToolDefinition{
		Name:        "get_ais_targets",
		Description: "Returns AIS vessel targets near a given position. Shows vessel name, type, position, speed, and course. Use when asked about nearby traffic, vessel identification, or collision risk assessment.",
		InputSchema: map[string]any{
			"type": "object",
			"properties": map[string]any{
				"latitude":  map[string]any{"type": "number", "description": "Center latitude in decimal degrees"},
				"longitude": map[string]any{"type": "number", "description": "Center longitude in decimal degrees"},
				"radius_nm": map[string]any{"type": "number", "description": "Search radius in nautical miles (default 20)"},
			},
			"required": []string{"latitude", "longitude"},
		},
	}
}

type aisInput struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	RadiusNM  float64 `json:"radius_nm"`
}

func (a *AISTool) Execute(input json.RawMessage) (string, error) {
	var params aisInput
	if err := json.Unmarshal(input, &params); err != nil {
		return "", fmt.Errorf("invalid input: %w", err)
	}
	if params.RadiusNM <= 0 {
		params.RadiusNM = 20
	}

	allVessels := a.provider.GetVessels()

	type vesselWithDist struct {
		Vessel   ais.Vessel
		Distance float64
	}

	var nearby []vesselWithDist
	for _, v := range allVessels {
		d := DistanceNM(params.Latitude, params.Longitude, v.Latitude, v.Longitude)
		if d <= params.RadiusNM {
			nearby = append(nearby, vesselWithDist{Vessel: v, Distance: d})
		}
	}

	sort.Slice(nearby, func(i, j int) bool {
		return nearby[i].Distance < nearby[j].Distance
	})

	// Cap at 20 results
	if len(nearby) > 20 {
		nearby = nearby[:20]
	}

	type vesselResult struct {
		Name       string  `json:"name"`
		MMSI       int     `json:"mmsi"`
		Type       string  `json:"type"`
		Lat        float64 `json:"latitude"`
		Lon        float64 `json:"longitude"`
		SOG        float64 `json:"sog_knots"`
		COG        float64 `json:"cog_degrees"`
		DistanceNM float64 `json:"distance_nm"`
	}

	vessels := make([]vesselResult, len(nearby))
	for i, n := range nearby {
		vessels[i] = vesselResult{
			Name:       n.Vessel.Name,
			MMSI:       n.Vessel.MMSI,
			Type:       ais.VesselTypeName(n.Vessel.VesselType),
			Lat:        n.Vessel.Latitude,
			Lon:        n.Vessel.Longitude,
			SOG:        n.Vessel.SOG,
			COG:        n.Vessel.COG,
			DistanceNM: math.Round(n.Distance*10) / 10,
		}
	}

	out, _ := json.Marshal(map[string]any{
		"count":   len(vessels),
		"vessels": vessels,
	})
	return string(out), nil
}

// DistanceNM calculates the great-circle distance in nautical miles using the Haversine formula.
func DistanceNM(lat1, lon1, lat2, lon2 float64) float64 {
	const earthRadiusNM = 3440.065
	dLat := (lat2 - lat1) * math.Pi / 180
	dLon := (lon2 - lon1) * math.Pi / 180
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180)*math.Cos(lat2*math.Pi/180)*
			math.Sin(dLon/2)*math.Sin(dLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return earthRadiusNM * c
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/api && go test ./internal/tools/ -v -run "TestAIS|TestDistance"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/api/internal/tools/ais.go packages/api/internal/tools/ais_test.go
git commit -m "feat(api): add get_ais_targets tool with Haversine distance (#209)"
```

---

### Task 4: Tool Executor

**Files:**
- Create: `internal/tools/executor.go`
- Create: `internal/tools/executor_test.go`

- [ ] **Step 1: Write failing tests for Executor**

```go
// internal/tools/executor_test.go
package tools_test

import (
	"encoding/json"
	"testing"

	"github.com/curphey/above-deck/api/internal/tools"
)

func TestExecutor_RegisterAndRun(t *testing.T) {
	exec := tools.NewExecutor()
	exec.Register(tools.NewTimeTool())

	result, err := exec.Run("get_time", json.RawMessage(`{}`))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result == "" {
		t.Error("expected non-empty result")
	}
}

func TestExecutor_UnknownTool(t *testing.T) {
	exec := tools.NewExecutor()
	_, err := exec.Run("nonexistent", json.RawMessage(`{}`))
	if err == nil {
		t.Error("expected error for unknown tool")
	}
}

func TestExecutor_Definitions(t *testing.T) {
	exec := tools.NewExecutor()
	exec.Register(tools.NewTimeTool())

	defs := exec.Definitions()
	if len(defs) != 1 {
		t.Fatalf("expected 1 definition, got %d", len(defs))
	}
	if defs[0].Name != "get_time" {
		t.Errorf("expected get_time, got %s", defs[0].Name)
	}
}

func TestExecutor_FilterByNames(t *testing.T) {
	exec := tools.NewExecutor()
	exec.Register(tools.NewTimeTool())
	exec.Register(tools.NewWeatherTool(""))

	filtered := exec.DefinitionsFor([]string{"get_time"})
	if len(filtered) != 1 {
		t.Fatalf("expected 1 filtered definition, got %d", len(filtered))
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/api && go test ./internal/tools/ -v -run TestExecutor`
Expected: FAIL — Executor not defined

- [ ] **Step 3: Implement Executor**

```go
// internal/tools/executor.go
package tools

import (
	"encoding/json"
	"fmt"
)

// Executor holds registered tools and dispatches calls by name.
type Executor struct {
	tools map[string]Tool
}

func NewExecutor() *Executor {
	return &Executor{tools: make(map[string]Tool)}
}

func (e *Executor) Register(t Tool) {
	e.tools[t.Definition().Name] = t
}

func (e *Executor) Run(name string, input json.RawMessage) (string, error) {
	t, ok := e.tools[name]
	if !ok {
		return "", fmt.Errorf("unknown tool: %s", name)
	}
	return t.Execute(input)
}

// Definitions returns all registered tool definitions.
func (e *Executor) Definitions() []ToolDefinition {
	defs := make([]ToolDefinition, 0, len(e.tools))
	for _, t := range e.tools {
		defs = append(defs, t.Definition())
	}
	return defs
}

// DefinitionsFor returns tool definitions filtered by the given tool names.
func (e *Executor) DefinitionsFor(names []string) []ToolDefinition {
	defs := make([]ToolDefinition, 0, len(names))
	for _, name := range names {
		if t, ok := e.tools[name]; ok {
			defs = append(defs, t.Definition())
		}
	}
	return defs
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/api && go test ./internal/tools/ -v -run TestExecutor`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/api/internal/tools/executor.go packages/api/internal/tools/executor_test.go
git commit -m "feat(api): add tool executor for dispatching tool calls by name (#209)"
```

---

### Task 5: LLM Client Tool Use Support

**Files:**
- Modify: `internal/llm/client.go`
- Create: `internal/llm/tools_test.go`

This is the core change — extending the LLM client to handle Claude's tool_use content blocks and loop until a final text response.

- [ ] **Step 1: Write failing tests for tool_use loop**

```go
// internal/llm/tools_test.go
package llm_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"

	"github.com/curphey/above-deck/api/internal/llm"
)

func TestSendMessageWithTools_NoToolUse(t *testing.T) {
	// Claude responds with text only — no tool calls
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"content": []map[string]any{
				{"type": "text", "text": `{"response":{"station":"CG","message":"No weather needed","channel":16},"feedback":{"correct":[],"errors":[],"protocol_note":""}}`},
			},
			"stop_reason": "end_turn",
		})
	}))
	defer server.Close()

	client := llm.NewClient(server.URL)
	toolDefs := []llm.ToolDef{{Name: "get_time", Description: "Get time", InputSchema: map[string]any{"type": "object", "properties": map[string]any{}}}}

	executor := func(name string, input json.RawMessage) (string, error) {
		return `{"utc":"2026-03-24T00:00:00Z"}`, nil
	}

	resp, err := client.SendMessageWithTools(context.Background(), "test-key", "system", []llm.Message{{Role: "user", Content: "hello"}}, toolDefs, executor)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.Response.Station != "CG" {
		t.Errorf("unexpected station: %s", resp.Response.Station)
	}
}

func TestSendMessageWithTools_SingleToolCall(t *testing.T) {
	var callCount atomic.Int32

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		n := callCount.Add(1)
		w.Header().Set("Content-Type", "application/json")

		if n == 1 {
			// First call: Claude requests a tool
			json.NewEncoder(w).Encode(map[string]any{
				"content": []map[string]any{
					{"type": "tool_use", "id": "toolu_01", "name": "get_time", "input": map[string]any{}},
				},
				"stop_reason": "tool_use",
			})
		} else {
			// Second call: Claude responds with text after tool result
			json.NewEncoder(w).Encode(map[string]any{
				"content": []map[string]any{
					{"type": "text", "text": `{"response":{"station":"CG","message":"Time is 00:00 UTC","channel":16},"feedback":{"correct":[],"errors":[],"protocol_note":""}}`},
				},
				"stop_reason": "end_turn",
			})
		}
	}))
	defer server.Close()

	client := llm.NewClient(server.URL)
	toolDefs := []llm.ToolDef{{Name: "get_time", Description: "Get time", InputSchema: map[string]any{"type": "object", "properties": map[string]any{}}}}

	executorCalled := false
	executor := func(name string, input json.RawMessage) (string, error) {
		executorCalled = true
		if name != "get_time" {
			t.Errorf("unexpected tool name: %s", name)
		}
		return `{"utc":"2026-03-24T00:00:00Z"}`, nil
	}

	resp, err := client.SendMessageWithTools(context.Background(), "test-key", "system", []llm.Message{{Role: "user", Content: "what time is it"}}, toolDefs, executor)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !executorCalled {
		t.Error("expected executor to be called")
	}
	if resp.Response.Message != "Time is 00:00 UTC" {
		t.Errorf("unexpected message: %s", resp.Response.Message)
	}
	if callCount.Load() != 2 {
		t.Errorf("expected 2 API calls, got %d", callCount.Load())
	}
}

func TestSendMessageWithTools_MaxIterations(t *testing.T) {
	// Claude keeps requesting tools forever — should stop after max iterations
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"content": []map[string]any{
				{"type": "tool_use", "id": "toolu_99", "name": "get_time", "input": map[string]any{}},
			},
			"stop_reason": "tool_use",
		})
	}))
	defer server.Close()

	client := llm.NewClient(server.URL)
	toolDefs := []llm.ToolDef{{Name: "get_time", Description: "Get time", InputSchema: map[string]any{"type": "object", "properties": map[string]any{}}}}
	executor := func(name string, input json.RawMessage) (string, error) {
		return `{"utc":"now"}`, nil
	}

	_, err := client.SendMessageWithTools(context.Background(), "test-key", "system", []llm.Message{{Role: "user", Content: "loop"}}, toolDefs, executor)
	if err == nil {
		t.Error("expected error for max iterations exceeded")
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/api && go test ./internal/llm/ -v -run TestSendMessageWithTools`
Expected: FAIL — SendMessageWithTools not defined

- [ ] **Step 3: Implement SendMessageWithTools in client.go**

Add these types and the new method to `internal/llm/client.go`:

```go
// Add to client.go — new types for tool_use support

// ToolDef is a Claude tool definition sent in the API request.
type ToolDef struct {
	Name        string         `json:"name"`
	Description string         `json:"description"`
	InputSchema map[string]any `json:"input_schema"`
}

// ToolExecutor is a function that executes a tool by name and returns the result string.
type ToolExecutor func(name string, input json.RawMessage) (string, error)

// contentBlock represents a single content block in a Claude API response.
type contentBlock struct {
	Type  string          `json:"type"`
	Text  string          `json:"text,omitempty"`
	ID    string          `json:"id,omitempty"`
	Name  string          `json:"name,omitempty"`
	Input json.RawMessage `json:"input,omitempty"`
}

// toolUseRequest extends apiRequest with tools.
type toolUseRequest struct {
	Model     string    `json:"model"`
	MaxTokens int       `json:"max_tokens"`
	System    string    `json:"system"`
	Messages  []any     `json:"messages"`
	Tools     []ToolDef `json:"tools,omitempty"`
}

// toolUseResponse is the full Claude API response with stop_reason.
type toolUseResponse struct {
	Content    []contentBlock `json:"content"`
	StopReason string         `json:"stop_reason"`
}

const maxToolIterations = 5

// SendMessageWithTools sends a message with tool definitions and handles the tool_use loop.
// It loops: if Claude responds with tool_use, it executes the tool and sends the result back.
// Stops when Claude responds with text (end_turn) or after maxToolIterations.
func (c *Client) SendMessageWithTools(ctx context.Context, apiKey, systemPrompt string, messages []Message, tools []ToolDef, executor ToolExecutor) (*VHFResponse, error) {
	if apiKey == "" {
		return nil, errors.New("API key is required")
	}

	// Build the initial messages as []any to support mixed content blocks
	apiMessages := make([]any, len(messages))
	for i, m := range messages {
		apiMessages[i] = m
	}

	for i := 0; i < maxToolIterations; i++ {
		reqBody := toolUseRequest{
			Model:     "claude-sonnet-4-20250514",
			MaxTokens: 1024,
			System:    systemPrompt,
			Messages:  apiMessages,
			Tools:     tools,
		}

		body, err := json.Marshal(reqBody)
		if err != nil {
			return nil, fmt.Errorf("marshal request: %w", err)
		}

		req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/v1/messages", bytes.NewReader(body))
		if err != nil {
			return nil, fmt.Errorf("create request: %w", err)
		}
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("x-api-key", apiKey)
		req.Header.Set("anthropic-version", "2023-06-01")

		resp, err := c.httpClient.Do(req)
		if err != nil {
			return nil, fmt.Errorf("send request: %w", err)
		}

		const maxResponseBytes = 1 << 20
		respBody, err := io.ReadAll(io.LimitReader(resp.Body, maxResponseBytes))
		resp.Body.Close()
		if err != nil {
			return nil, fmt.Errorf("read response: %w", err)
		}

		if resp.StatusCode != http.StatusOK {
			errSnippet := string(respBody)
			if len(errSnippet) > 512 {
				errSnippet = errSnippet[:512] + "...[truncated]"
			}
			return nil, fmt.Errorf("API error (status %d): %s", resp.StatusCode, errSnippet)
		}

		var apiResp toolUseResponse
		if err := json.Unmarshal(respBody, &apiResp); err != nil {
			return nil, fmt.Errorf("unmarshal response: %w", err)
		}

		// If stop_reason is not tool_use, extract text and return
		if apiResp.StopReason != "tool_use" {
			return c.extractVHFResponse(apiResp.Content)
		}

		// Handle tool_use: execute each tool call and build tool_result messages
		// Append assistant message with the tool_use content blocks
		apiMessages = append(apiMessages, map[string]any{
			"role":    "assistant",
			"content": apiResp.Content,
		})

		// Build tool results
		var toolResults []map[string]any
		for _, block := range apiResp.Content {
			if block.Type != "tool_use" {
				continue
			}
			result, execErr := executor(block.Name, block.Input)
			if execErr != nil {
				result = fmt.Sprintf(`{"error":"%s"}`, execErr.Error())
			}
			toolResults = append(toolResults, map[string]any{
				"type":        "tool_result",
				"tool_use_id": block.ID,
				"content":     result,
			})
		}

		apiMessages = append(apiMessages, map[string]any{
			"role":    "user",
			"content": toolResults,
		})
	}

	return nil, errors.New("tool_use loop exceeded maximum iterations")
}

// extractVHFResponse finds the first text block and parses it as VHFResponse.
func (c *Client) extractVHFResponse(content []contentBlock) (*VHFResponse, error) {
	for _, block := range content {
		if block.Type == "text" {
			text := strings.TrimSpace(block.Text)
			text = strings.TrimPrefix(text, "```json")
			text = strings.TrimPrefix(text, "```")
			text = strings.TrimSuffix(text, "```")
			text = strings.TrimSpace(text)

			var vhfResp VHFResponse
			if err := json.Unmarshal([]byte(text), &vhfResp); err != nil {
				return nil, fmt.Errorf("unmarshal VHF response: %w", err)
			}
			return &vhfResp, nil
		}
	}
	return nil, errors.New("no text content in response")
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/api && go test ./internal/llm/ -v -run TestSendMessageWithTools`
Expected: PASS

- [ ] **Step 5: Run all existing LLM tests to check for regressions**

Run: `cd packages/api && go test ./internal/llm/ -v`
Expected: All PASS (existing SendMessage tests unaffected)

- [ ] **Step 6: Commit**

```bash
git add packages/api/internal/llm/client.go packages/api/internal/llm/tools_test.go
git commit -m "feat(api): add SendMessageWithTools with tool_use loop support (#209)"
```

---

### Task 6: Wire Tools Into Dispatcher

**Files:**
- Modify: `internal/agent/dispatcher.go`
- Modify: `internal/agent/dispatcher_test.go`

- [ ] **Step 1: Write failing test for tool-aware dispatch**

Add to `internal/agent/dispatcher_test.go`:

```go
func TestDispatcherWithTools_CallsToolAwareMethod(t *testing.T) {
	agents := []RadioAgent{
		{
			ID: "solent-cg", Name: "Solent Coastguard", CallSign: "SOLENT COASTGUARD",
			AgentType: "coastguard", SystemPrompt: "Coastguard.",
			Tools: []string{"get_weather", "get_time"},
		},
	}

	mock := &mockToolLLM{}
	exec := &mockToolExecutor{}
	d := NewDispatcher(agents, mock)
	d.SetToolExecutor(exec)

	_, err := d.Dispatch(context.Background(), "test-key", "Solent Coastguard weather report please", "uk-south", "SV Artemis", "sailing-yacht", nil)
	if err != nil {
		t.Fatal(err)
	}

	if !mock.toolMethodCalled {
		t.Error("expected SendMessageWithTools to be called for agent with tools")
	}
	if len(mock.lastToolDefs) != 2 {
		t.Errorf("expected 2 tool defs, got %d", len(mock.lastToolDefs))
	}
}

// mockToolLLM records whether the tool_use path was taken.
type mockToolLLM struct {
	toolMethodCalled bool
	lastToolDefs     []llm.ToolDef
}

func (m *mockToolLLM) SendMessage(ctx context.Context, apiKey, systemPrompt string, messages []llm.Message) (*llm.VHFResponse, error) {
	return &llm.VHFResponse{
		Response: struct {
			Station string `json:"station"`
			Message string `json:"message"`
			Channel int    `json:"channel"`
		}{Station: "CG", Message: "ok", Channel: 16},
	}, nil
}

func (m *mockToolLLM) SendMessageWithTools(ctx context.Context, apiKey, systemPrompt string, messages []llm.Message, tools []llm.ToolDef, executor llm.ToolExecutor) (*llm.VHFResponse, error) {
	m.toolMethodCalled = true
	m.lastToolDefs = tools
	return &llm.VHFResponse{
		Response: struct {
			Station string `json:"station"`
			Message string `json:"message"`
			Channel int    `json:"channel"`
		}{Station: "CG", Message: "weather is fine", Channel: 16},
	}, nil
}

// mockToolExecutor satisfies the tools.Executor interface for testing.
type mockToolExecutor struct{}

func (m *mockToolExecutor) Run(name string, input json.RawMessage) (string, error) {
	return `{}`, nil
}

func (m *mockToolExecutor) DefinitionsFor(names []string) []llm.ToolDef {
	defs := make([]llm.ToolDef, len(names))
	for i, n := range names {
		defs[i] = llm.ToolDef{Name: n, Description: "mock"}
	}
	return defs
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/api && go test ./internal/agent/ -v -run TestDispatcherWithTools`
Expected: FAIL — SetToolExecutor and ToolAwareLLMClient not defined

- [ ] **Step 3: Update dispatcher.go**

Update `LLMClient` interface and add `ToolAwareLLMClient`:

```go
// Updated dispatcher.go

// ToolAwareLLMClient extends LLMClient with tool_use support.
type ToolAwareLLMClient interface {
	LLMClient
	SendMessageWithTools(ctx context.Context, apiKey, systemPrompt string, messages []llm.Message, tools []llm.ToolDef, executor llm.ToolExecutor) (*llm.VHFResponse, error)
}

// ToolExecutorInterface abstracts the tool executor for dependency injection.
type ToolExecutorInterface interface {
	Run(name string, input json.RawMessage) (string, error)
	DefinitionsFor(names []string) []llm.ToolDef
}

type Dispatcher struct {
	registry     *Registry
	resolver     *Resolver
	client       LLMClient
	toolExecutor ToolExecutorInterface
	worlds       map[string]*WorldState
}

func (d *Dispatcher) SetToolExecutor(exec ToolExecutorInterface) {
	d.toolExecutor = exec
}
```

Update the `Dispatch` method to check if agent has tools and client supports them:

```go
func (d *Dispatcher) Dispatch(ctx context.Context, apiKey, message, regionID, vesselName, vesselType string, scenario *ScenarioContext) (*llm.VHFResponse, error) {
	agent := d.resolver.Resolve(message)
	world := d.GetOrCreateWorld(regionID)
	world.AddRadioMessage(vesselName, message, 16, "tx")
	systemPrompt := BuildAgentSystemPrompt(agent, world, scenario, "", vesselName, vesselType)
	messages := d.buildMessages(world, vesselName)

	// If agent has tools and we have a tool-aware client + executor, use tool_use path
	if len(agent.Tools) > 0 && d.toolExecutor != nil {
		if toolClient, ok := d.client.(ToolAwareLLMClient); ok {
			toolDefs := d.toolExecutor.DefinitionsFor(agent.Tools)
			if len(toolDefs) > 0 {
				executor := d.toolExecutor.Run
				resp, err := toolClient.SendMessageWithTools(ctx, apiKey, systemPrompt, messages, toolDefs, executor)
				if err != nil {
					return nil, err
				}
				world.AddRadioMessage(agent.Name, resp.Response.Message, resp.Response.Channel, "rx")
				return resp, nil
			}
		}
	}

	// Fallback: no tools
	resp, err := d.client.SendMessage(ctx, apiKey, systemPrompt, messages)
	if err != nil {
		return nil, err
	}
	world.AddRadioMessage(agent.Name, resp.Response.Message, resp.Response.Channel, "rx")
	return resp, nil
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/api && go test ./internal/agent/ -v`
Expected: All PASS (new and existing tests)

- [ ] **Step 5: Commit**

```bash
git add packages/api/internal/agent/dispatcher.go packages/api/internal/agent/dispatcher_test.go
git commit -m "feat(api): wire tool executor into agent dispatcher (#209)"
```

---

### Task 7: Wire Everything in main.go and TransmitHandler

**Files:**
- Modify: `internal/handler/transmit.go`
- Modify: `cmd/server/main.go`

- [ ] **Step 1: Update TransmitHandler to accept a tool executor**

Modify `internal/handler/transmit.go`:

```go
// Update the LLMClient interface in handler to include tool-aware method
type LLMClient interface {
	SendMessage(ctx context.Context, apiKey, systemPrompt string, messages []llm.Message) (*llm.VHFResponse, error)
	SendMessageWithTools(ctx context.Context, apiKey, systemPrompt string, messages []llm.Message, tools []llm.ToolDef, executor llm.ToolExecutor) (*llm.VHFResponse, error)
}

type TransmitHandler struct {
	mgr          *session.Manager
	client       LLMClient
	wsHub        *ws.Hub
	toolExecutor agent.ToolExecutorInterface
}

func NewTransmitHandler(mgr *session.Manager, client LLMClient, wsHub *ws.Hub, toolExec agent.ToolExecutorInterface) *TransmitHandler {
	return &TransmitHandler{mgr: mgr, client: client, wsHub: wsHub, toolExecutor: toolExec}
}
```

In the `ServeHTTP` method, pass the tool executor to the dispatcher:

```go
dispatcher := agent.NewDispatcher(region.Agents, h.client)
if h.toolExecutor != nil {
	dispatcher.SetToolExecutor(h.toolExecutor)
}
```

- [ ] **Step 2: Update main.go to create the tool executor and pass it through**

```go
// In main.go, after creating aisClient and llmClient:

import "github.com/curphey/above-deck/api/internal/tools"

// Build tool executor with all available tools
toolExec := tools.NewExecutor()
toolExec.Register(tools.NewTimeTool())
toolExec.Register(tools.NewWeatherTool(""))
toolExec.Register(tools.NewAISTool(aisClient))

// Pass to transmit handler
transmitHandler := handler.NewTransmitHandler(sessionMgr, llmClient, wsHub, toolExec)
```

- [ ] **Step 3: Fix transmit_test.go to match new NewTransmitHandler signature**

Update `handler.NewTransmitHandler` calls in test to include nil for toolExecutor:

```go
h := handler.NewTransmitHandler(mgr, mockClient, wsHub, nil)
```

- [ ] **Step 4: Run all Go tests**

Run: `cd packages/api && go test ./... -v`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add packages/api/internal/handler/transmit.go packages/api/cmd/server/main.go packages/api/internal/handler/transmit_test.go
git commit -m "feat(api): wire tool executor into transmit handler and server startup (#209)"
```

---

### Task 8: Add Tools to Region Agent Definitions

**Files:**
- Modify: `internal/radio/regions.go`

- [ ] **Step 1: Add `Tools` field to coastguard and vessel agents**

In `internal/radio/regions.go`, update agent definitions for each region. Coastguard agents get all tools; vessel agents get `get_weather` and `get_time` only:

```go
// Example for uk-south coastguard agent:
Tools: []string{"get_weather", "get_ais_targets", "get_time"},

// Example for uk-south vessel agent:
Tools: []string{"get_weather", "get_time"},
```

Apply this pattern to all 6 regions.

- [ ] **Step 2: Run regions test**

Run: `cd packages/api && go test ./internal/radio/ -v`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/api/internal/radio/regions.go
git commit -m "feat(api): assign tools to region agents — coastguard gets all, vessels get weather+time (#209)"
```

---

### Task 9: Make Executor Satisfy ToolExecutorInterface

**Files:**
- Modify: `internal/tools/executor.go`

The `Executor` needs a `DefinitionsFor` method that returns `[]llm.ToolDef` (not `[]ToolDefinition`). We need to make sure the types align with what the dispatcher expects.

- [ ] **Step 1: Add adapter method or ensure type compatibility**

Either make `ToolDefinition` == `llm.ToolDef` (they have the same shape), or add a conversion method. The cleanest approach: have `tools.Executor` return `[]llm.ToolDef` directly from `DefinitionsFor`.

```go
// In executor.go, add import for llm package and adapter:
func (e *Executor) DefinitionsFor(names []string) []llm.ToolDef {
	defs := make([]llm.ToolDef, 0, len(names))
	for _, name := range names {
		if t, ok := e.tools[name]; ok {
			d := t.Definition()
			defs = append(defs, llm.ToolDef{
				Name:        d.Name,
				Description: d.Description,
				InputSchema: d.InputSchema,
			})
		}
	}
	return defs
}
```

- [ ] **Step 2: Run all tests**

Run: `cd packages/api && go test ./... -v`
Expected: All PASS

- [ ] **Step 3: Commit**

```bash
git add packages/api/internal/tools/executor.go
git commit -m "feat(api): executor returns llm.ToolDef for dispatcher compatibility (#209)"
```

---

### Task 10: Integration Smoke Test

**Files:**
- Create: `internal/tools/integration_test.go`

- [ ] **Step 1: Write an integration test that exercises the full flow**

```go
// internal/tools/integration_test.go
package tools_test

import (
	"encoding/json"
	"testing"

	"github.com/curphey/above-deck/api/internal/ais"
	"github.com/curphey/above-deck/api/internal/tools"
)

func TestFullExecutorFlow(t *testing.T) {
	exec := tools.NewExecutor()
	exec.Register(tools.NewTimeTool())
	exec.Register(tools.NewWeatherTool("")) // will fail on real HTTP but tests execute path
	exec.Register(tools.NewAISTool(&mockAISProvider{
		vessels: []ais.Vessel{
			{MMSI: 123, Name: "TEST VESSEL", Latitude: 50.15, Longitude: -5.07, SOG: 5},
		},
	}))

	// Time tool works without network
	result, err := exec.Run("get_time", json.RawMessage(`{}`))
	if err != nil {
		t.Fatalf("get_time error: %v", err)
	}
	if result == "" {
		t.Error("expected non-empty time result")
	}

	// AIS tool works with mock data
	result, err = exec.Run("get_ais_targets", json.RawMessage(`{"latitude":50.15,"longitude":-5.07,"radius_nm":10}`))
	if err != nil {
		t.Fatalf("get_ais_targets error: %v", err)
	}
	var aisResult struct {
		Count int `json:"count"`
	}
	json.Unmarshal([]byte(result), &aisResult)
	if aisResult.Count != 1 {
		t.Errorf("expected 1 vessel, got %d", aisResult.Count)
	}

	// DefinitionsFor filters correctly
	defs := exec.DefinitionsFor([]string{"get_time", "get_weather"})
	if len(defs) != 2 {
		t.Errorf("expected 2 defs, got %d", len(defs))
	}

	// Unknown tool returns error
	_, err = exec.Run("nonexistent", json.RawMessage(`{}`))
	if err == nil {
		t.Error("expected error for unknown tool")
	}
}
```

- [ ] **Step 2: Run the integration test**

Run: `cd packages/api && go test ./internal/tools/ -v -run TestFullExecutorFlow`
Expected: PASS

- [ ] **Step 3: Run ALL tests one final time**

Run: `cd packages/api && go test ./... -count=1`
Expected: All packages PASS

- [ ] **Step 4: Commit**

```bash
git add packages/api/internal/tools/integration_test.go
git commit -m "test(api): add integration smoke test for tool executor flow (#209)"
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Tool interface + TimeTool | `tools/tool.go`, `tools/time.go` |
| 2 | WeatherTool (Open-Meteo) | `tools/weather.go` |
| 3 | AISTool (cached AIS data) | `tools/ais.go` |
| 4 | Executor (dispatch by name) | `tools/executor.go` |
| 5 | LLM client tool_use loop | `llm/client.go` |
| 6 | Dispatcher tool wiring | `agent/dispatcher.go` |
| 7 | Handler + main.go wiring | `handler/transmit.go`, `cmd/server/main.go` |
| 8 | Agent tool assignments | `radio/regions.go` |
| 9 | Type compatibility layer | `tools/executor.go` |
| 10 | Integration smoke test | `tools/integration_test.go` |
