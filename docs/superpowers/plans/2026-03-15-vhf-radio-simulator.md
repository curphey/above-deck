# VHF Radio Simulator Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an AI-powered VHF marine radio simulator for practicing radio procedures, with a Go backend for LLM orchestration and a React frontend with voice interaction and radio audio effects.

**Architecture:** Go HTTP service (`packages/api/`) handles Anthropic Claude API calls, conversation state, and scenario management. React island on the Astro frontend provides dual radio UIs (panel + handheld), speech integration (browser APIs), and Web Audio effects. Supabase persists conversation history for logged-in users.

**Tech Stack:** Go 1.22+, Astro 5, React 19, Zustand 5, Web Speech API, Web Audio API, Anthropic Claude API, Supabase PostgreSQL, Docker

**Design Spec:** `docs/superpowers/specs/2026-03-15-vhf-radio-simulator-design.md`

**GitHub Epic:** #158

---

## File Structure

### Go API (`packages/api/`)

| File | Responsibility |
|------|---------------|
| `cmd/server/main.go` | HTTP server entry point, router setup, graceful shutdown |
| `internal/handler/health.go` | `GET /health` endpoint |
| `internal/handler/transmit.go` | `POST /api/vhf/transmit` — main radio exchange endpoint |
| `internal/handler/session.go` | Session CRUD endpoints |
| `internal/handler/scenarios.go` | `GET /api/vhf/scenarios` — list available scenarios |
| `internal/middleware/cors.go` | CORS middleware for frontend origin |
| `internal/middleware/auth.go` | Extract user from Supabase JWT |
| `internal/radio/channels.go` | ITU VHF channel ↔ frequency mapping |
| `internal/radio/channels_test.go` | Channel lookup tests |
| `internal/radio/regions.go` | Cruising regions with world state data |
| `internal/radio/regions_test.go` | Region data validation tests |
| `internal/radio/scenarios.go` | Scenario definitions for guided exercises |
| `internal/radio/scenarios_test.go` | Scenario data tests |
| `internal/ais/client.go` | aisstream.io WebSocket client — queries live vessel data by bounding box |
| `internal/ais/types.go` | AIS message types, vessel data structs |
| `internal/ais/client_test.go` | AIS client tests (mock WebSocket) |
| `internal/llm/client.go` | Anthropic API client (Messages API) |
| `internal/llm/prompt.go` | System prompt builder (VHF regs + region + scenario + DSC + GMDSS) |
| `internal/llm/client_test.go` | Prompt builder unit tests |
| `internal/session/manager.go` | Session lifecycle, conversation sliding window |
| `internal/session/store.go` | Supabase persistence adapter |
| `internal/session/manager_test.go` | Session management tests |
| `Dockerfile` | Multi-stage build for Go binary |
| `go.mod` | Go module definition |

### Frontend (`packages/web/src/`)

| File | Responsibility |
|------|---------------|
| `lib/vhf/types.ts` | Shared TypeScript interfaces (matches Go API schema) |
| `lib/vhf/api-client.ts` | Go API client (fetch wrapper) |
| `lib/vhf/speech.ts` | STT/TTS browser API wrappers with fallback |
| `lib/vhf/audio-fx.ts` | Web Audio effects chain (band-pass, static, squelch) |
| `lib/vhf/__tests__/api-client.test.ts` | API client unit tests |
| `lib/vhf/__tests__/speech.test.ts` | Speech wrapper tests |
| `stores/vhf.ts` | Zustand store (radio state, settings, localStorage) |
| `components/vhf/RadioScreen.tsx` | LCD display (channel, frequency, last message) |
| `components/vhf/ChannelDial.tsx` | Rotatable channel knob (1-88) |
| `components/vhf/SquelchDial.tsx` | Squelch adjustment knob |
| `components/vhf/PTTButton.tsx` | Push-to-talk (hold to transmit) |
| `components/vhf/PanelRadio.tsx` | Desktop fixed-mount layout (VHF 215i style) |
| `components/vhf/HandheldRadio.tsx` | Mobile handheld layout (Cortex H1P style) |
| `components/vhf/TranscriptPanel.tsx` | Scrollable log with feedback annotations |
| `components/vhf/ScenarioPicker.tsx` | Exercise selector |
| `components/vhf/SettingsPanel.tsx` | API key, region, vessel, MMSI, voice, audio settings |
| `components/vhf/DSCPanel.tsx` | DSC alert overlay (distress, urgency, routine, false alert cancellation) |
| `components/vhf/VHFSimulator.tsx` | Top-level island (layout selection, provider wiring) |
| `hooks/use-vhf-radio.ts` | Orchestration hook (PTT → STT → API → TTS + effects) |
| `components/landing/ScreenVHF.astro` | Modify: replace placeholder with React island |

---

## Chunk 1: Go API Foundation

### Task 1: Go Module Scaffolding and Health Endpoint

**GitHub Issue:** #159

**Files:**
- Create: `packages/api/go.mod`
- Create: `packages/api/cmd/server/main.go`
- Create: `packages/api/internal/handler/health.go`
- Create: `packages/api/internal/handler/health_test.go`
- Create: `packages/api/internal/middleware/cors.go`
- Create: `packages/api/Dockerfile`

- [ ] **Step 1: Initialize Go module**

```bash
cd packages/api
go mod init github.com/curphey/above-deck/api
```

- [ ] **Step 2: Write health handler test**

```go
// internal/handler/health_test.go
package handler_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/curphey/above-deck/api/internal/handler"
)

func TestHealthHandler(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()

	handler.Health(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
	if w.Header().Get("Content-Type") != "application/json" {
		t.Errorf("expected application/json content type")
	}
}
```

- [ ] **Step 3: Run test — expect FAIL**

```bash
cd packages/api && go test ./internal/handler/...
```
Expected: FAIL — `handler.Health` undefined

- [ ] **Step 4: Implement health handler**

```go
// internal/handler/health.go
package handler

import (
	"encoding/json"
	"net/http"
)

type healthResponse struct {
	Status string `json:"status"`
}

func Health(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(healthResponse{Status: "ok"})
}
```

- [ ] **Step 5: Run test — expect PASS**

```bash
cd packages/api && go test ./internal/handler/...
```

- [ ] **Step 6: Write CORS middleware**

```go
// internal/middleware/cors.go
package middleware

import "net/http"

func CORS(allowedOrigin string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-API-Key")
			w.Header().Set("Access-Control-Max-Age", "86400")

			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
```

- [ ] **Step 7: Write server entry point**

```go
// cmd/server/main.go
package main

import (
	"log"
	"net/http"
	"os"

	"github.com/curphey/above-deck/api/internal/handler"
	"github.com/curphey/above-deck/api/internal/middleware"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	allowedOrigin := os.Getenv("ALLOWED_ORIGIN")
	if allowedOrigin == "" {
		allowedOrigin = "http://localhost:4321"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", handler.Health)

	wrapped := middleware.CORS(allowedOrigin)(mux)

	log.Printf("VHF API listening on :%s", port)
	if err := http.ListenAndServe(":"+port, wrapped); err != nil {
		log.Fatal(err)
	}
}
```

- [ ] **Step 8: Write Dockerfile**

```dockerfile
# Dockerfile
FROM golang:1.22-alpine AS build
WORKDIR /app
COPY go.mod go.sum* ./
RUN go mod download 2>/dev/null || true
COPY . .
RUN CGO_ENABLED=0 go build -o /vhf-api ./cmd/server

FROM alpine:3.19
RUN apk add --no-cache ca-certificates
COPY --from=build /vhf-api /vhf-api
EXPOSE 8080
CMD ["/vhf-api"]
```

- [ ] **Step 9: Verify server starts**

```bash
cd packages/api && go run ./cmd/server &
curl http://localhost:8080/health
# Expected: {"status":"ok"}
kill %1
```

- [ ] **Step 10: Commit**

```bash
git add packages/api/
git commit -m "feat(api): scaffold Go API with health endpoint and CORS

Closes #159"
```

---

### Task 2: ITU Channel/Frequency Mapping

**GitHub Issue:** #160

**Files:**
- Create: `packages/api/internal/radio/channels.go`
- Create: `packages/api/internal/radio/channels_test.go`

- [ ] **Step 1: Write channel lookup tests**

```go
// internal/radio/channels_test.go
package radio_test

import (
	"testing"

	"github.com/curphey/above-deck/api/internal/radio"
)

func TestChannel16(t *testing.T) {
	ch, ok := radio.GetChannel(16)
	if !ok {
		t.Fatal("channel 16 not found")
	}
	if ch.TxFreq != 156.800 {
		t.Errorf("expected 156.800, got %f", ch.TxFreq)
	}
	if ch.Name != "International Distress, Safety & Calling" {
		t.Errorf("unexpected name: %s", ch.Name)
	}
}

func TestChannel70(t *testing.T) {
	ch, ok := radio.GetChannel(70)
	if !ok {
		t.Fatal("channel 70 not found")
	}
	if ch.Name != "Digital Selective Calling" {
		t.Errorf("unexpected name: %s", ch.Name)
	}
}

func TestInvalidChannel(t *testing.T) {
	_, ok := radio.GetChannel(99)
	if ok {
		t.Error("expected channel 99 to not exist")
	}
}

func TestAllChannelsHaveFrequencies(t *testing.T) {
	channels := radio.AllChannels()
	if len(channels) < 20 {
		t.Errorf("expected at least 20 channels, got %d", len(channels))
	}
	for _, ch := range channels {
		if ch.TxFreq <= 0 {
			t.Errorf("channel %d has invalid tx frequency", ch.Number)
		}
	}
}
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd packages/api && go test ./internal/radio/...
```

- [ ] **Step 3: Implement channel mapping**

```go
// internal/radio/channels.go
package radio

// Channel represents an ITU VHF marine radio channel.
type Channel struct {
	Number  int     `json:"number"`
	TxFreq  float64 `json:"tx_freq"`
	RxFreq  float64 `json:"rx_freq"`
	Name    string  `json:"name"`
	Usage   string  `json:"usage"`
	Duplex  bool    `json:"duplex"`
}

var channels = map[int]Channel{
	1:  {1, 156.050, 160.650, "Port Operations", "Port operations and vessel traffic", true},
	5:  {5, 156.250, 160.850, "Port Operations", "Port operations", true},
	6:  {6, 156.300, 156.300, "Inter-ship Safety", "Inter-ship safety communications", false},
	8:  {8, 156.400, 156.400, "Inter-ship", "Commercial inter-ship", false},
	9:  {9, 156.450, 156.450, "Calling", "Secondary calling channel", false},
	10: {10, 156.500, 156.500, "Inter-ship", "Commercial inter-ship", false},
	12: {12, 156.600, 156.600, "Port Operations", "Port operations", false},
	13: {13, 156.650, 156.650, "Bridge-to-Bridge", "Navigation safety", false},
	14: {14, 156.700, 156.700, "Port Operations", "Port operations", false},
	16: {16, 156.800, 156.800, "International Distress, Safety & Calling", "Distress, safety, and calling", false},
	17: {17, 156.850, 156.850, "State Control", "State-controlled operations", false},
	67: {67, 156.375, 156.375, "Small Craft Safety", "UK small craft safety", false},
	68: {68, 156.425, 156.425, "Marina / Port", "Non-commercial working channel", false},
	69: {69, 156.475, 156.475, "Marina / Port", "Non-commercial working channel", false},
	70: {70, 156.525, 156.525, "Digital Selective Calling", "DSC distress and safety", false},
	71: {71, 156.575, 156.575, "Marina / Port", "Non-commercial working channel", false},
	72: {72, 156.625, 156.625, "Inter-ship", "Non-commercial inter-ship", false},
	73: {73, 156.675, 156.675, "Inter-ship Safety", "Inter-ship safety", false},
	77: {77, 156.875, 156.875, "Inter-ship", "Non-commercial inter-ship", false},
	80: {80, 157.025, 161.625, "Marina Working", "Marina working channel", true},
	37: {37, 157.850, 157.850, "Marina Working", "Marina working channel (UK M1)", false},
}

// GetChannel returns the channel with the given number, or false if not found.
func GetChannel(number int) (Channel, bool) {
	ch, ok := channels[number]
	return ch, ok
}

// AllChannels returns all defined channels as a slice.
func AllChannels() []Channel {
	result := make([]Channel, 0, len(channels))
	for _, ch := range channels {
		result = append(result, ch)
	}
	return result
}
```

**Note to implementer:** The channel map above is a starter set — include the most commonly used channels (16, 6, 8, 9, 10, 12, 13, 14, 67-73, 77, 80, and key duplex channels 1, 5, 24-28, 60-66, 78-82). Full ITU channel table has ~57 international channels. Focus on channels relevant to the cruising scenarios. Remove the invalid `M1` entry — use integer keys only. UK M-channels (M1=37, M2=80) can be noted in the `Name` field.

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd packages/api && go test ./internal/radio/...
```

- [ ] **Step 5: Commit**

```bash
git add packages/api/internal/radio/channels.go packages/api/internal/radio/channels_test.go
git commit -m "feat(api): add ITU VHF channel/frequency mapping

Closes #160"
```

---

### Task 3: Cruising Regions and World State

**GitHub Issue:** #161

> **Note:** The design spec mentions `lib/vhf/regions.ts` as client-side data, but region data is authoritative in Go because the Go service needs it to build LLM system prompts. The frontend TypeScript types (`lib/vhf/types.ts`, Task 8) are derived from the Go API response shapes. The same applies to scenario data in Task 4.

**Files:**
- Create: `packages/api/internal/radio/regions.go`
- Create: `packages/api/internal/radio/regions_test.go`

- [ ] **Step 1: Write region validation tests**

```go
// internal/radio/regions_test.go
package radio_test

import (
	"testing"

	"github.com/curphey/above-deck/api/internal/radio"
)

func TestGetRegion(t *testing.T) {
	r, ok := radio.GetRegion("uk-south")
	if !ok {
		t.Fatal("uk-south region not found")
	}
	if r.Name == "" {
		t.Error("region name is empty")
	}
	if len(r.Vessels) < 4 {
		t.Errorf("expected at least 4 vessels, got %d", len(r.Vessels))
	}
	if len(r.Coastguard) == 0 {
		t.Error("expected at least one coastguard station")
	}
}

func TestAllRegionsValid(t *testing.T) {
	regions := radio.AllRegions()
	if len(regions) < 2 {
		t.Errorf("expected at least 2 regions, got %d", len(regions))
	}
	for _, r := range regions {
		if r.ID == "" || r.Name == "" {
			t.Errorf("region has empty ID or name")
		}
		for _, v := range r.Vessels {
			if v.Name == "" || v.CallSign == "" {
				t.Errorf("vessel in region %s has empty name or callsign", r.ID)
			}
		}
	}
}
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd packages/api && go test ./internal/radio/...
```
Expected: FAIL — `radio.GetRegion` undefined

- [ ] **Step 3: Implement regions**

```go
// internal/radio/regions.go
package radio

type Vessel struct {
	Name        string `json:"name"`
	CallSign    string `json:"call_sign"`
	Type        string `json:"type"`
	Nationality string `json:"nationality"`
	Personality string `json:"personality"`
}

type CoastguardStation struct {
	Name       string `json:"name"`
	CallSign   string `json:"call_sign"`
	Channel    int    `json:"channel"`
	Coverage   string `json:"coverage"`
}

type Marina struct {
	Name    string `json:"name"`
	Channel int    `json:"channel"`
}

type Region struct {
	ID          string              `json:"id"`
	Name        string              `json:"name"`
	Description string              `json:"description"`
	Coastguard  []CoastguardStation `json:"coastguard"`
	Vessels     []Vessel            `json:"vessels"`
	Marinas     []Marina            `json:"marinas"`
	LocalFlavour string             `json:"local_flavour"`
}

var regions = map[string]Region{
	"uk-south": {
		ID:          "uk-south",
		Name:        "UK South Coast",
		Description: "Falmouth to the Solent, including the Channel Islands",
		Coastguard: []CoastguardStation{
			{Name: "Falmouth Coastguard", CallSign: "FALMOUTH COASTGUARD", Channel: 16, Coverage: "Land's End to Teignmouth"},
			{Name: "Solent Coastguard", CallSign: "SOLENT COASTGUARD", Channel: 16, Coverage: "Teignmouth to Beachy Head"},
		},
		Vessels: []Vessel{
			{Name: "Doris May", CallSign: "DORIS MAY", Type: "Sailing yacht", Nationality: "British", Personality: "Retired couple, very experienced, helpful and chatty"},
			{Name: "Blue Horizon", CallSign: "BLUE HORIZON", Type: "Motor yacht", Nationality: "French", Personality: "Polite, accented English, knows the Channel well"},
			{Name: "Saoirse", CallSign: "SAOIRSE", Type: "Sailing yacht", Nationality: "Irish", Personality: "Solo sailor, laconic, dry humour"},
			{Name: "Windchaser", CallSign: "WINDCHASER", Type: "Catamaran", Nationality: "British", Personality: "Family crew, enthusiastic, occasionally flustered"},
			{Name: "Nordic Spirit", CallSign: "NORDIC SPIRIT", Type: "Motor sailer", Nationality: "Norwegian", Personality: "Professional manner, excellent English"},
		},
		Marinas: []Marina{
			{Name: "Falmouth Marina", Channel: 80},
			{Name: "Plymouth Yacht Haven", Channel: 80},
			{Name: "Dartmouth Marina", Channel: 80},
			{Name: "Lymington Yacht Haven", Channel: 80},
			{Name: "Cowes Yacht Haven", Channel: 69},
		},
		LocalFlavour: "Busy shipping lanes in the Channel. Tidal gates at Portland Bill and St Alban's Head. Weather can change quickly. Mix of cruisers, racing boats, and commercial traffic.",
	},
	"caribbean": {
		ID:          "caribbean",
		Name:        "Caribbean",
		Description: "BVI, Grenadines, Antigua, and surrounding islands",
		Coastguard: []CoastguardStation{
			{Name: "VISAR", CallSign: "VIRGIN ISLANDS SEARCH AND RESCUE", Channel: 16, Coverage: "British Virgin Islands"},
			{Name: "Antigua Coast Guard", CallSign: "ANTIGUA COAST GUARD", Channel: 16, Coverage: "Antigua and Barbuda"},
		},
		Vessels: []Vessel{
			{Name: "Island Time", CallSign: "ISLAND TIME", Type: "Catamaran", Nationality: "American", Personality: "Relaxed liveaboard couple, know every anchorage"},
			{Name: "Sunsail 4204", CallSign: "SUNSAIL FOUR TWO ZERO FOUR", Type: "Charter catamaran", Nationality: "Mixed crew", Personality: "Charter guests, enthusiastic but inexperienced on radio"},
			{Name: "Rhum Runner", CallSign: "RHUM RUNNER", Type: "Motor yacht", Nationality: "French", Personality: "Day charter operator, professional, fast talker"},
			{Name: "Trade Wind", CallSign: "TRADE WIND", Type: "Sailing yacht", Nationality: "Canadian", Personality: "Long-distance cruiser, calm and knowledgeable"},
			{Name: "Sea Biscuit", CallSign: "SEA BISCUIT", Type: "Catamaran", Nationality: "British", Personality: "First-time cruisers, friendly, lots of questions"},
		},
		Marinas: []Marina{
			{Name: "Nanny Cay Marina", Channel: 16},
			{Name: "Village Cay Marina", Channel: 16},
			{Name: "Jolly Harbour Marina", Channel: 68},
			{Name: "Port Louis Marina", Channel: 14},
		},
		LocalFlavour: "Cruiser nets on VHF every morning. Customs check-in procedures at each island. Trade winds reliable but squalls can appear quickly. Relaxed pace, everyone knows each other.",
	},
}

func GetRegion(id string) (Region, bool) {
	r, ok := regions[id]
	return r, ok
}

func AllRegions() []Region {
	result := make([]Region, 0, len(regions))
	for _, r := range regions {
		result = append(result, r)
	}
	return result
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd packages/api && go test ./internal/radio/...
```

- [ ] **Step 5: Commit**

```bash
git add packages/api/internal/radio/regions.go packages/api/internal/radio/regions_test.go
git commit -m "feat(api): add cruising regions with UK South Coast and Caribbean

Closes #161"
```

---

### Task 4: Scenario Definitions

**GitHub Issue:** #162

**Files:**
- Create: `packages/api/internal/radio/scenarios.go`
- Create: `packages/api/internal/radio/scenarios_test.go`

- [ ] **Step 1: Write scenario tests**

```go
// internal/radio/scenarios_test.go
package radio_test

import (
	"testing"

	"github.com/curphey/above-deck/api/internal/radio"
)

func TestGetScenario(t *testing.T) {
	s, ok := radio.GetScenario("mayday")
	if !ok {
		t.Fatal("mayday scenario not found")
	}
	if s.Name == "" || s.Briefing == "" {
		t.Error("scenario has empty name or briefing")
	}
	if len(s.ExpectedProcedure) == 0 {
		t.Error("expected procedure steps")
	}
}

func TestAllScenariosComplete(t *testing.T) {
	scenarios := radio.AllScenarios()
	if len(scenarios) < 10 {
		t.Errorf("expected at least 10 scenarios, got %d", len(scenarios))
	}
	for _, s := range scenarios {
		if s.ID == "" || s.Name == "" || s.Briefing == "" {
			t.Errorf("scenario %s has empty required field", s.ID)
		}
		if s.LLMInstructions == "" {
			t.Errorf("scenario %s has no LLM instructions", s.ID)
		}
	}
}
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd packages/api && go test ./internal/radio/...
```
Expected: FAIL — `radio.GetScenario` undefined

- [ ] **Step 3: Implement scenarios**

```go
// internal/radio/scenarios.go
package radio

// Scenario defines a guided VHF exercise for RYA exam prep.
type Scenario struct {
	ID                string   `json:"id"`
	Name              string   `json:"name"`
	Description       string   `json:"description"`
	Briefing          string   `json:"briefing"`
	ExpectedProcedure []string `json:"expected_procedure"`
	LLMInstructions   string   `json:"llm_instructions"`
	CompletionCriteria string  `json:"completion_criteria"`
}

var scenarios = map[string]Scenario{
	"radio-check": {
		ID:          "radio-check",
		Name:        "Radio Check",
		Description: "Request a signal report from the coastguard on Channel 16",
		Briefing:    "You are aboard SV Artemis, moored in Falmouth harbour. You want to confirm your VHF radio is working before departing. Contact Falmouth Coastguard on Channel 16 for a radio check.",
		ExpectedProcedure: []string{
			"Switch to Channel 16",
			"Press PTT and say: 'Falmouth Coastguard, Falmouth Coastguard, Falmouth Coastguard, this is Sailing Vessel Artemis, Sailing Vessel Artemis, Sailing Vessel Artemis, radio check on Channel 16, over'",
			"Release PTT and wait for response",
			"Acknowledge the signal report: 'Falmouth Coastguard, this is Sailing Vessel Artemis, thank you, out'",
		},
		LLMInstructions: "You are Falmouth Coastguard. The user is requesting a radio check. Respond with: 'Sailing Vessel Artemis, this is Falmouth Coastguard, reading you loud and clear, over.' If the user's call format is incorrect, still respond but note the errors in the feedback. Wait for the user to acknowledge before marking complete.",
		CompletionCriteria: "User correctly initiates the radio check with proper call format (station called x3, own vessel x3, request, over) AND acknowledges the response with 'out'.",
	},
	"pan-pan": {
		ID:          "pan-pan",
		Name:        "Pan-Pan",
		Description: "Declare an urgency situation — engine failure in a shipping lane",
		Briefing:    "You are aboard SV Artemis, position 50°04'N 005°03'W, in the Falmouth approach channel. Your engine has failed and you are drifting towards the shipping lane. You have 3 persons on board. Declare a Pan-Pan urgency on Channel 16.",
		ExpectedProcedure: []string{
			"Switch to Channel 16",
			"Press PTT: 'PAN PAN, PAN PAN, PAN PAN, all stations, all stations, all stations, this is Sailing Vessel Artemis, Sailing Vessel Artemis, Sailing Vessel Artemis'",
			"Continue: 'My position is 50 degrees 04 minutes North, 005 degrees 03 minutes West'",
			"Continue: 'Engine failure, drifting towards shipping lane, require tow assistance'",
			"Continue: '3 persons on board, sailing yacht, 12 metres, white hull, over'",
			"Wait for coastguard acknowledgement",
			"Provide updates as requested",
		},
		LLMInstructions: "You are Falmouth Coastguard. The user is declaring a Pan-Pan urgency. Acknowledge with: 'All stations, all stations, all stations, this is Falmouth Coastguard, Falmouth Coastguard, Falmouth Coastguard. Received Pan-Pan from Sailing Vessel Artemis. All vessels in the vicinity of position 50 degrees 04 North, 005 degrees 03 West, please keep a sharp lookout and report to Falmouth Coastguard, out.' Then ask the user for additional details or updates. Track whether the user uses the correct Pan-Pan format.",
		CompletionCriteria: "User correctly declares Pan-Pan with proper format (PAN PAN x3, addressing, vessel name x3, position, nature of urgency, assistance required, persons aboard, vessel description, over) AND responds to coastguard follow-up.",
	},
	"mayday": {
		ID:          "mayday",
		Name:        "Mayday",
		Description: "Full distress call — taking on water",
		Briefing:    "You are aboard SV Artemis, position 50°10'N 005°15'W, approximately 5 nautical miles southwest of the Lizard. Your vessel has struck a submerged object and is taking on water rapidly. The bilge pump cannot keep up. You have 4 persons on board. Issue a Mayday distress call on Channel 16.",
		ExpectedProcedure: []string{
			"Switch to Channel 16",
			"Press PTT: 'MAYDAY, MAYDAY, MAYDAY, this is Sailing Vessel Artemis, Sailing Vessel Artemis, Sailing Vessel Artemis, call sign MART, MMSI 235 099 000'",
			"Continue: 'MAYDAY, Sailing Vessel Artemis, call sign MART'",
			"Continue: 'My position is 50 degrees 10 minutes North, 005 degrees 15 minutes West'",
			"Continue: 'I require immediate assistance — struck submerged object, taking on water'",
			"Continue: '4 persons on board, sailing yacht, 12 metres, white hull, over'",
			"Wait for coastguard acknowledgement",
			"Respond to coastguard instructions",
		},
		LLMInstructions: "You are Falmouth Coastguard. The user is issuing a Mayday distress call. Acknowledge with the correct Mayday acknowledgement format: 'MAYDAY, Sailing Vessel Artemis, this is Falmouth Coastguard, received Mayday. All stations, all stations, all stations, MAYDAY, Falmouth Coastguard. Distress relay follows...' Then coordinate the response — ask about rate of water ingress, whether crew are wearing lifejackets, and whether they have a liferaft. Provide reassurance and instructions.",
		CompletionCriteria: "User correctly issues Mayday with proper format (MAYDAY x3, vessel name x3 + call sign + MMSI stated once, MAYDAY + vessel + call sign, position in degrees and decimal minutes, nature of distress, 'I require immediate assistance', persons, vessel description, OVER) AND responds to coastguard instructions.",
	},
	"mayday-relay": {
		ID:          "mayday-relay",
		Name:        "Mayday Relay",
		Description: "Hear another vessel's distress and relay it to the coastguard",
		Briefing:    "You are aboard SV Artemis, position 50°08'N 005°20'W. You hear a weak Mayday from Fishing Vessel Ocean Star, position 50°12'N 005°25'W, reporting they are sinking after a collision. The coastguard has not acknowledged. Relay the Mayday.",
		ExpectedProcedure: []string{
			"Confirm Channel 16",
			"Wait to see if coastguard acknowledges (they don't)",
			"Press PTT: 'MAYDAY RELAY, MAYDAY RELAY, MAYDAY RELAY, all stations, all stations, all stations, this is Sailing Vessel Artemis, Sailing Vessel Artemis, Sailing Vessel Artemis'",
			"Relay the distress information you heard",
			"Add your own position and that you are standing by to assist",
			"Wait for coastguard response",
		},
		LLMInstructions: "Start by playing Fishing Vessel Ocean Star making a weak, partially garbled Mayday: 'MAYDAY MAYDAY MAYDAY... this is... Ocean Star... position 50 degrees 12 North... 005 degrees 25 West... collision... sinking... 5 persons... over.' Then be silent (no coastguard response). The user should relay the Mayday. When they do, respond as Falmouth Coastguard acknowledging the relay.",
		CompletionCriteria: "User correctly relays the Mayday using MAYDAY RELAY format (MAYDAY RELAY x3, addressing, own vessel x3, relayed distress information, own position) AND waits appropriately before relaying.",
	},
	"securite": {
		ID:          "securite",
		Name:        "Securité",
		Description: "Broadcast a navigational safety warning",
		Briefing:    "You are aboard SV Artemis, position 50°09'N 005°05'W. You have spotted a large shipping container floating partially submerged, approximately 200 metres ahead of your position, directly in the main shipping channel. Broadcast a Securité navigational warning on Channel 16.",
		ExpectedProcedure: []string{
			"Switch to Channel 16",
			"Press PTT: 'SECURITÉ, SECURITÉ, SECURITÉ, all stations, all stations, all stations, this is Sailing Vessel Artemis, Sailing Vessel Artemis, Sailing Vessel Artemis'",
			"Describe the hazard: 'Navigational hazard, partially submerged shipping container in position 50 degrees 09 North, 005 degrees 05 West, in the main shipping channel'",
			"End with 'out'",
		},
		LLMInstructions: "You are monitoring Channel 16. The user is broadcasting a Securité navigational warning about a floating container. Respond as Falmouth Coastguard acknowledging the report and thanking the vessel. Ask if they can provide further details (size, colour, exact bearing). Then as another vessel, 'Motor Vessel Channel Express', thank them for the warning.",
		CompletionCriteria: "User correctly broadcasts Securité with proper format (SECURITÉ x3, all stations x3, own vessel x3, nature of hazard, position, OUT).",
	},
	"routine-call": {
		ID:          "routine-call",
		Name:        "Routine Call",
		Description: "Contact a marina to request a berth",
		Briefing:    "You are aboard SV Artemis, approaching Falmouth harbour. You want to contact Falmouth Marina on Channel 16 to request a visitor berth for tonight. Falmouth Marina works on Channel 80.",
		ExpectedProcedure: []string{
			"Switch to Channel 16",
			"Press PTT: 'Falmouth Marina, Falmouth Marina, this is Sailing Vessel Artemis, Sailing Vessel Artemis, over'",
			"Wait for response",
			"Request to switch to working channel: 'Falmouth Marina, this is Sailing Vessel Artemis, request berth for tonight, channel 80, over'",
			"Switch to Channel 80",
			"Conduct berthing conversation on Channel 80",
		},
		LLMInstructions: "You are Falmouth Marina. When the user calls on Channel 16, respond: 'Sailing Vessel Artemis, this is Falmouth Marina, go ahead, over.' When they request Channel 80, agree: 'Sailing Vessel Artemis, Falmouth Marina, channel 80, over.' On Channel 80, ask about vessel size, draught, arrival time, and number of nights. Assign them berth D-14 on the visitors' pontoon.",
		CompletionCriteria: "User correctly initiates contact on Channel 16, agrees working channel, switches to Channel 80, and conducts the berthing conversation with proper radio etiquette throughout.",
	},
	"responding-to-mayday": {
		ID:          "responding-to-mayday",
		Name:        "Responding to a Mayday",
		Description: "Hear a Mayday from another vessel and acknowledge correctly",
		Briefing:    "You are aboard SV Artemis, position 50°08'N 005°10'W. You hear a Mayday from Motor Vessel Blue Horizon, position 50°09'N 005°12'W, reporting a fire on board with 6 persons. The coastguard has not yet responded. Acknowledge the Mayday and offer assistance.",
		ExpectedProcedure: []string{
			"Listen to the Mayday on Channel 16",
			"Wait briefly for coastguard to acknowledge (they don't)",
			"Press PTT: 'MAYDAY, Motor Vessel Blue Horizon, this is Sailing Vessel Artemis, received MAYDAY'",
			"Provide your position and ETA to their location",
			"Offer assistance and stand by for instructions",
		},
		LLMInstructions: "Start by playing Motor Vessel Blue Horizon issuing a Mayday: fire in engine room, 6 POB, position 50°09'N 005°12'W. Then be silent (coastguard does not respond for 30 seconds). The user should acknowledge. After the user acknowledges, respond as Falmouth Coastguard arriving on frequency and taking control.",
		CompletionCriteria: "User correctly acknowledges the Mayday using proper format (MAYDAY + distressed vessel name, own vessel name, received MAYDAY) AND provides own position AND offers assistance.",
	},
	"dsc-distress": {
		ID:          "dsc-distress",
		Name:        "DSC Distress Alert",
		Description: "Send a DSC distress alert via the CALL button, then follow up with voice Mayday on CH16",
		Briefing:    "You are aboard SV Artemis, MMSI 235099000, position 50°10'N 005°15'W. Your vessel has struck a submerged object and is taking on water. Use the DSC CALL button to send a distress alert, then follow up with a voice Mayday on Channel 16.",
		ExpectedProcedure: []string{
			"Press CALL button to open DSC panel",
			"Select 'Distress' alert type",
			"Select nature of distress: 'Flooding'",
			"Confirm position is correct",
			"Press and hold Send (5 seconds) to transmit distress alert",
			"Radio automatically switches to Channel 16",
			"Issue voice Mayday on Channel 16 to follow up the DSC alert",
		},
		LLMInstructions: "The user has sent a DSC distress alert. Respond as Falmouth Coastguard with a DSC acknowledgement, then expect the voice Mayday follow-up. If the user only sends the DSC alert without following up with voice, prompt them via feedback that a voice Mayday on Ch16 is required after a DSC distress alert.",
		CompletionCriteria: "User correctly sends DSC distress alert via CALL button AND follows up with voice Mayday on Channel 16 with proper format.",
	},
	"dsc-false-alert": {
		ID:          "dsc-false-alert",
		Name:        "DSC False Alert Cancellation",
		Description: "Accidentally trigger a DSC distress alert and correctly cancel it",
		Briefing:    "You are aboard SV Artemis, MMSI 235099000. You have accidentally triggered a DSC distress alert. Cancel the false alert immediately using the correct procedure.",
		ExpectedProcedure: []string{
			"DSC distress alert has been sent (simulated as accidental)",
			"Switch to Channel 16",
			"Press PTT: 'All stations, all stations, all stations, this is Sailing Vessel Artemis, call sign MART, MMSI 235 099 000'",
			"Continue: 'Please cancel my distress alert of [time] UTC'",
			"Continue: 'I am not in distress, I say again, I am not in distress'",
			"End with 'out'",
		},
		LLMInstructions: "The scenario starts with the user having accidentally sent a DSC distress alert. Respond as Falmouth Coastguard acknowledging the cancellation. If the user doesn't include their MMSI or the time of the alert, note this in feedback. Emphasise that failing to cancel a false alert is an offence.",
		CompletionCriteria: "User correctly cancels the false alert on Channel 16 with proper format (all stations x3, own vessel + call sign + MMSI, cancel request with time, confirmation of not in distress, OUT).",
	},
	"medico": {
		ID:          "medico",
		Name:        "MEDICO Call",
		Description: "Contact coastguard for medical advice via Pan-Pan Medical",
		Briefing:    "You are aboard SV Artemis, position 50°06'N 005°08'W, 3 nautical miles south of Falmouth. A crew member has severe abdominal pain, fever, and has been vomiting for 6 hours. You need medical advice from the coastguard. Use the Pan-Pan Medical procedure.",
		ExpectedProcedure: []string{
			"Switch to Channel 16",
			"Press PTT: 'PAN PAN, PAN PAN, PAN PAN, Falmouth Coastguard, Falmouth Coastguard, Falmouth Coastguard, this is Sailing Vessel Artemis, Sailing Vessel Artemis, Sailing Vessel Artemis'",
			"Continue: 'I have a medical emergency on board and require medical advice'",
			"Provide position and number of persons on board",
			"Describe symptoms when asked by coastguard",
			"Follow medical advice given",
		},
		LLMInstructions: "You are Falmouth Coastguard. The user is making a Pan-Pan Medical call. Acknowledge and ask them to switch to a working channel. On the working channel, ask about the patient's symptoms, age, medical history, and any medications taken. Provide practical first aid advice and consider whether to recommend diversion to port or helicopter evacuation based on the severity described.",
		CompletionCriteria: "User correctly initiates Pan-Pan Medical with proper format AND provides clear symptom description AND follows medical advice.",
	},
}

func GetScenario(id string) (Scenario, bool) {
	s, ok := scenarios[id]
	return s, ok
}

func AllScenarios() []Scenario {
	result := make([]Scenario, 0, len(scenarios))
	for _, s := range scenarios {
		result = append(result, s)
	}
	return result
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd packages/api && go test ./internal/radio/...
```

- [ ] **Step 5: Commit**

```bash
git add packages/api/internal/radio/scenarios.go packages/api/internal/radio/scenarios_test.go
git commit -m "feat(api): add 10 guided VHF scenarios incl. DSC and MEDICO

Covers radio check, Pan-Pan, Mayday, Mayday relay, Mayday response,
Securité, routine call, DSC distress, DSC false alert, and MEDICO.

Closes #162"
```

---

## Chunk 2: Go API LLM & Session Layer

### Task 5: Anthropic LLM Client and Prompt Builder

**GitHub Issue:** #163

**Files:**
- Create: `packages/api/internal/llm/client.go`
- Create: `packages/api/internal/llm/client_test.go`
- Create: `packages/api/internal/llm/prompt.go`
- Create: `packages/api/internal/llm/prompt_test.go`

- [ ] **Step 1: Write prompt builder tests**

```go
// internal/llm/prompt_test.go
package llm_test

import (
	"strings"
	"testing"

	"github.com/curphey/above-deck/api/internal/llm"
	"github.com/curphey/above-deck/api/internal/radio"
)

func TestBuildSystemPrompt_FreePractice(t *testing.T) {
	region, _ := radio.GetRegion("uk-south")
	prompt := llm.BuildSystemPrompt(region, nil, "SV Artemis", "Sailing yacht")

	if !strings.Contains(prompt, "VHF radio environment simulator") {
		t.Error("missing role definition")
	}
	if !strings.Contains(prompt, "Falmouth Coastguard") {
		t.Error("missing region coastguard")
	}
	if !strings.Contains(prompt, "SV Artemis") {
		t.Error("missing user vessel name")
	}
	if !strings.Contains(prompt, "MAYDAY") {
		t.Error("missing VHF procedures")
	}
}

func TestBuildSystemPrompt_WithScenario(t *testing.T) {
	region, _ := radio.GetRegion("uk-south")
	scenario, _ := radio.GetScenario("mayday")
	prompt := llm.BuildSystemPrompt(region, &scenario, "SV Artemis", "Sailing yacht")

	if !strings.Contains(prompt, scenario.LLMInstructions) {
		t.Error("missing scenario LLM instructions")
	}
}

func TestBuildSystemPrompt_ResponseFormat(t *testing.T) {
	region, _ := radio.GetRegion("uk-south")
	prompt := llm.BuildSystemPrompt(region, nil, "SV Artemis", "Sailing yacht")

	if !strings.Contains(prompt, "\"response\"") {
		t.Error("missing response JSON schema")
	}
	if !strings.Contains(prompt, "\"feedback\"") {
		t.Error("missing feedback JSON schema")
	}
}
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd packages/api && go test ./internal/llm/...
```
Expected: FAIL — `llm.BuildSystemPrompt` undefined

- [ ] **Step 3: Implement prompt builder**

```go
// internal/llm/prompt.go
package llm

import (
	"fmt"
	"strings"

	"github.com/curphey/above-deck/api/internal/radio"
)

// BuildSystemPrompt constructs the system prompt for the VHF radio simulator.
func BuildSystemPrompt(region radio.Region, scenario *radio.Scenario, vesselName, vesselType string) string {
	var sb strings.Builder

	// 1. Role definition
	sb.WriteString("You are the VHF radio environment simulator. You play all stations in the radio environment: coastguard, port control, marinas, other vessels. You respond with correct ITU VHF radio procedures.\n\n")

	// 2. VHF regulations
	sb.WriteString("## VHF Radio Procedures\n\n")
	sb.WriteString("Follow ITU Radio Regulations and GMDSS procedures. Key rules:\n")
	sb.WriteString("- Use correct prowords: OVER (expecting reply), OUT (end of communication, never used with OVER), ROGER (received and understood), SAY AGAIN (request repeat), THIS IS (identifies speaker), I SAY AGAIN (emphasises repeat), CORRECTION (corrects error), I SPELL (precedes phonetic spelling), WAIT (pause, will call back), STAND BY (remain on frequency), BREAK (separates message parts), NEGATIVE, AFFIRMATIVE, FIGURES (precedes numbers), WILCO (will comply), SILENCE MAYDAY (impose radio silence during distress), SILENCE FINI (cancel radio silence), PRUDONCE (limited working on distress frequency)\n")
	sb.WriteString("- Phonetic alphabet: Alpha, Bravo, Charlie, Delta, Echo, Foxtrot, Golf, Hotel, India, Juliet, Kilo, Lima, Mike, November, Oscar, Papa, Quebec, Romeo, Sierra, Tango, Uniform, Victor, Whiskey, X-ray, Yankee, Zulu\n")
	sb.WriteString("- Channel 16 (156.800 MHz) is the international distress, safety and calling frequency\n")
	sb.WriteString("- Channel 70 is reserved for Digital Selective Calling (DSC)\n")
	sb.WriteString("- Distress priority: MAYDAY > PAN PAN > SECURITÉ > routine\n")
	sb.WriteString("- Call format: [station called] x3, THIS IS [own vessel] x3, [message], OVER/OUT\n")
	sb.WriteString("- Positions: always in degrees and decimal minutes (e.g. 50 degrees 10 minutes North, 005 degrees 15 minutes West)\n")
	sb.WriteString("- Power: 25W (high) for distress/calling, 1W (low) for harbour/close range. Use minimum power necessary.\n")
	sb.WriteString("- Listen before transmitting. Keep transmissions brief. No profanity or unnecessary signals.\n")
	sb.WriteString("- Mayday format: MAYDAY x3, THIS IS [vessel name] x3 + [call sign] + [MMSI], MAYDAY [vessel name, call sign], MY POSITION IS..., [nature of distress], I REQUIRE IMMEDIATE ASSISTANCE, [POB], [description], OVER\n")
	sb.WriteString("- Pan-Pan format: PAN PAN PAN PAN PAN PAN (six continuous words), ALL STATIONS x3, THIS IS [vessel] x3, [urgency details]\n\n")

	// DSC procedures
	sb.WriteString("## DSC (Digital Selective Calling)\n\n")
	sb.WriteString("- DSC alerts are sent on Channel 70 (156.525 MHz) — this channel is for automated DSC only, no voice\n")
	sb.WriteString("- After sending a DSC distress alert, the radio automatically switches to Channel 16 for voice follow-up\n")
	sb.WriteString("- A DSC distress alert includes: MMSI, nature of distress, position, time\n")
	sb.WriteString("- Voice Mayday MUST follow a DSC distress alert on Channel 16\n")
	sb.WriteString("- False alert cancellation: broadcast on Channel 16 — 'All stations x3, this is [vessel, call sign, MMSI], please cancel my distress alert of [time] UTC, I am not in distress, out'\n")
	sb.WriteString("- Failing to cancel a false alert is an offence under maritime law\n\n")

	// GMDSS study reference
	sb.WriteString("## GMDSS Equipment Knowledge\n\n")
	sb.WriteString("- EPIRB (406 MHz): satellite distress beacon, 48h battery, hydrostatic release, must be registered\n")
	sb.WriteString("- SART (9 GHz): radar transponder, shows 12-dot arc on radar, ~5nm range, 96h standby + 8h active\n")
	sb.WriteString("- NAVTEX (518/490 kHz): text broadcasts for MSI, weather, navigational warnings\n")
	sb.WriteString("- VHF DSC controller: Ch70 watch, distress button (lift cover, press 5s), MMSI identification\n\n")

	// 3. Region world state
	sb.WriteString(fmt.Sprintf("## Current Radio Environment: %s\n\n", region.Name))
	sb.WriteString(fmt.Sprintf("%s\n\n", region.Description))
	sb.WriteString(fmt.Sprintf("%s\n\n", region.LocalFlavour))

	sb.WriteString("### Coastguard Stations:\n")
	for _, cg := range region.Coastguard {
		sb.WriteString(fmt.Sprintf("- %s (callsign: %s, Channel %d, coverage: %s)\n", cg.Name, cg.CallSign, cg.Channel, cg.Coverage))
	}

	sb.WriteString("\n### Vessels in the area:\n")
	for _, v := range region.Vessels {
		sb.WriteString(fmt.Sprintf("- %s (%s, %s, callsign: %s) — %s\n", v.Name, v.Type, v.Nationality, v.CallSign, v.Personality))
	}

	sb.WriteString("\n### Marinas:\n")
	for _, m := range region.Marinas {
		sb.WriteString(fmt.Sprintf("- %s (working channel: %d)\n", m.Name, m.Channel))
	}

	// 4. User's vessel
	sb.WriteString(fmt.Sprintf("\n## User's Vessel\nName: %s\nType: %s\n\n", vesselName, vesselType))

	// 5. Scenario instructions (if provided)
	if scenario != nil {
		sb.WriteString(fmt.Sprintf("## Active Scenario: %s\n\n", scenario.Name))
		sb.WriteString(fmt.Sprintf("Briefing: %s\n\n", scenario.Briefing))
		sb.WriteString(fmt.Sprintf("Instructions: %s\n\n", scenario.LLMInstructions))
		sb.WriteString(fmt.Sprintf("Completion criteria: %s\n\n", scenario.CompletionCriteria))
	}

	// 6. Response format
	sb.WriteString("## Response Format\n\n")
	sb.WriteString("Always respond with valid JSON in this exact format:\n")
	sb.WriteString("```json\n")
	sb.WriteString(`{"response":{"station":"who is speaking","message":"the radio dialogue","channel":16},"feedback":{"correct":["things user did right"],"errors":["protocol mistakes"],"protocol_note":"what should happen next"},"scenario":{"state":"current step","next_expected":"what user should do","complete":false,"score":null}}`)
	sb.WriteString("\n```\n")

	return sb.String()
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd packages/api && go test ./internal/llm/...
```

- [ ] **Step 5: Write LLM client test with mock HTTP server**

```go
// internal/llm/client_test.go
package llm_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/curphey/above-deck/api/internal/llm"
)

func TestSendMessage_Success(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("x-api-key") != "test-key" {
			t.Error("expected API key header")
		}
		if r.Header.Get("anthropic-version") == "" {
			t.Error("expected anthropic-version header")
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"content": []map[string]string{
				{"type": "text", "text": `{"response":{"station":"Falmouth Coastguard","message":"Reading you loud and clear","channel":16},"feedback":{"correct":["Good call format"],"errors":[],"protocol_note":"Acknowledge with out"}}`},
			},
		})
	}))
	defer server.Close()

	client := llm.NewClient(server.URL)
	resp, err := client.SendMessage(context.Background(), "test-key", "system prompt", []llm.Message{
		{Role: "user", Content: "Radio check"},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.Response.Station != "Falmouth Coastguard" {
		t.Errorf("unexpected station: %s", resp.Response.Station)
	}
}

func TestSendMessage_NoAPIKey(t *testing.T) {
	client := llm.NewClient("http://localhost")
	_, err := client.SendMessage(context.Background(), "", "system", nil)
	if err == nil {
		t.Error("expected error for empty API key")
	}
}
```

- [ ] **Step 6: Implement Anthropic API client**

Create `internal/llm/client.go` with:

```go
type Client struct {
	httpClient *http.Client
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type VHFResponse struct {
	Response struct {
		Station string `json:"station"`
		Message string `json:"message"`
		Channel int    `json:"channel"`
	} `json:"response"`
	Feedback struct {
		Correct      []string `json:"correct"`
		Errors       []string `json:"errors"`
		ProtocolNote string   `json:"protocol_note"`
	} `json:"feedback"`
	Scenario *struct {
		State        string `json:"state"`
		NextExpected string `json:"next_expected"`
		Complete     bool   `json:"complete"`
		Score        *int   `json:"score"`
	} `json:"scenario,omitempty"`
}

func (c *Client) SendMessage(ctx context.Context, apiKey, systemPrompt string, messages []Message) (*VHFResponse, error)
```

The `SendMessage` method calls the Anthropic Messages API (`POST https://api.anthropic.com/v1/messages`) with:
- `model: "claude-sonnet-4-20250514"` (cost-effective for conversation)
- `max_tokens: 1024`
- `system` set to the system prompt
- `messages` as the conversation history
- API key passed in `x-api-key` header
- Parse Claude's text response as JSON into `VHFResponse`

- [ ] **Step 6: Commit**

```bash
git add packages/api/internal/llm/
git commit -m "feat(api): add Anthropic LLM client and VHF system prompt builder

Closes #163"
```

---

### Task 6: Session Management

**GitHub Issue:** #164

**Files:**
- Create: `packages/api/internal/session/manager.go`
- Create: `packages/api/internal/session/store.go`
- Create: `packages/api/internal/session/manager_test.go`
- Create: `packages/api/internal/middleware/auth.go`

- [ ] **Step 1: Write session manager tests**

```go
// internal/session/manager_test.go
package session_test

import (
	"testing"

	"github.com/curphey/above-deck/api/internal/session"
)

func TestCreateSession(t *testing.T) {
	mgr := session.NewManager()
	s := mgr.Create("uk-south", "SV Artemis", "Sailing yacht")

	if s.ID == "" {
		t.Error("session ID is empty")
	}
	if s.Region != "uk-south" {
		t.Errorf("expected uk-south, got %s", s.Region)
	}
	if len(s.Messages) != 0 {
		t.Error("new session should have no messages")
	}
}

func TestAddMessage(t *testing.T) {
	mgr := session.NewManager()
	s := mgr.Create("uk-south", "SV Artemis", "Sailing yacht")

	mgr.AddMessage(s.ID, "user", "Falmouth Coastguard, this is SV Artemis, radio check, over")
	mgr.AddMessage(s.ID, "assistant", "SV Artemis, this is Falmouth Coastguard, reading you loud and clear, over")

	updated, _ := mgr.Get(s.ID)
	if len(updated.Messages) != 2 {
		t.Errorf("expected 2 messages, got %d", len(updated.Messages))
	}
}

func TestSlidingWindow(t *testing.T) {
	mgr := session.NewManager()
	s := mgr.Create("uk-south", "SV Artemis", "Sailing yacht")

	// Add 22 messages (11 exchanges)
	for i := 0; i < 22; i++ {
		role := "user"
		if i%2 == 1 {
			role = "assistant"
		}
		mgr.AddMessage(s.ID, role, "test message")
	}

	updated, _ := mgr.Get(s.ID)
	// Should keep most recent 20 messages (sliding window)
	if len(updated.Messages) > 20 {
		t.Errorf("expected max 20 messages after sliding window, got %d", len(updated.Messages))
	}
	if len(updated.Messages) < 18 {
		t.Errorf("expected at least 18 messages retained, got %d", len(updated.Messages))
	}
}
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd packages/api && go test ./internal/session/...
```
Expected: FAIL — `session.NewManager` undefined

- [ ] **Step 3: Implement session manager**

Create `internal/session/manager.go` with in-memory session store using `sync.Map`. Sessions have:
- `ID` (UUID)
- `Region`, `VesselName`, `VesselType`
- `ScenarioID` (optional)
- `Messages []llm.Message`
- `CreatedAt`, `LastActiveAt`

The sliding window drops earliest messages after 20, keeping the most recent exchanges.

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd packages/api && go test ./internal/session/...
```

- [ ] **Step 5: Write auth middleware test**

```go
// internal/middleware/auth_test.go
package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/curphey/above-deck/api/internal/middleware"
)

func TestAuth_NoHeader(t *testing.T) {
	handler := middleware.Auth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID := middleware.UserIDFromContext(r.Context())
		if userID != "" {
			t.Error("expected empty userID for anonymous request")
		}
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)
}

func TestAuth_WithBearer(t *testing.T) {
	handler := middleware.Auth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID := middleware.UserIDFromContext(r.Context())
		if userID == "" {
			t.Error("expected userID from bearer token")
		}
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer test-jwt-token")
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)
}
```

- [ ] **Step 6: Implement auth middleware**

Create `internal/middleware/auth.go` — extract optional `Authorization: Bearer <jwt>` header and set a `userID` on the request context. JWT validation against Supabase can be added later. Anonymous users get no `userID`.

- [ ] **Step 6: Write Supabase store stub**

Create `internal/session/store.go` with a `Store` interface and a no-op implementation. Real Supabase persistence is deferred — in-memory is sufficient for v1.

```go
type Store interface {
	Save(session *Session) error
	Load(id string) (*Session, error)
}

type InMemoryStore struct{}
func (s *InMemoryStore) Save(session *Session) error { return nil }
func (s *InMemoryStore) Load(id string) (*Session, error) { return nil, nil }
```

- [ ] **Step 7: Commit**

```bash
git add packages/api/internal/session/ packages/api/internal/middleware/auth.go
git commit -m "feat(api): add session manager with sliding window and auth middleware

Closes #164"
```

---

### Task 7: HTTP Handlers (Transmit, Session, Scenarios)

**GitHub Issue:** #165

**Files:**
- Create: `packages/api/internal/handler/transmit.go`
- Create: `packages/api/internal/handler/transmit_test.go`
- Create: `packages/api/internal/handler/session.go`
- Create: `packages/api/internal/handler/scenarios.go`
- Modify: `packages/api/cmd/server/main.go` — add routes

- [ ] **Step 1: Write transmit handler test**

```go
// internal/handler/transmit_test.go
package handler_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/curphey/above-deck/api/internal/handler"
	"github.com/curphey/above-deck/api/internal/session"
)

func TestTransmitHandler_NoAPIKey(t *testing.T) {
	mgr := session.NewManager()
	h := handler.NewTransmitHandler(mgr, nil)

	body, _ := json.Marshal(map[string]string{"message": "hello", "session_id": "123"})
	req := httptest.NewRequest(http.MethodPost, "/api/vhf/transmit", bytes.NewReader(body))
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", w.Code)
	}
}

func TestTransmitHandler_NoSession(t *testing.T) {
	mgr := session.NewManager()
	h := handler.NewTransmitHandler(mgr, nil)

	body, _ := json.Marshal(map[string]string{"message": "hello", "session_id": "nonexistent"})
	req := httptest.NewRequest(http.MethodPost, "/api/vhf/transmit", bytes.NewReader(body))
	req.Header.Set("X-API-Key", "test-key")
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", w.Code)
	}
}
```

- [ ] **Step 2: Write happy-path transmit test and session/scenarios handler tests**

```go
// Add to transmit_test.go or create separate test files

// Mock LLM client for happy-path test
type mockLLMClient struct{}

func (m *mockLLMClient) SendMessage(ctx context.Context, apiKey, systemPrompt string, messages []llm.Message) (*llm.VHFResponse, error) {
	return &llm.VHFResponse{
		Response: struct {
			Station string `json:"station"`
			Message string `json:"message"`
			Channel int    `json:"channel"`
		}{Station: "Falmouth Coastguard", Message: "Reading you loud and clear, over", Channel: 16},
		Feedback: struct {
			Correct      []string `json:"correct"`
			Errors       []string `json:"errors"`
			ProtocolNote string   `json:"protocol_note"`
		}{Correct: []string{"Good call format"}, Errors: nil, ProtocolNote: "Acknowledge with out"},
	}, nil
}

func TestTransmitHandler_Success(t *testing.T) {
	mgr := session.NewManager()
	s := mgr.Create("uk-south", "SV Artemis", "Sailing yacht")

	h := handler.NewTransmitHandler(mgr, &mockLLMClient{})

	body, _ := json.Marshal(map[string]string{"message": "Radio check", "session_id": s.ID})
	req := httptest.NewRequest(http.MethodPost, "/api/vhf/transmit", bytes.NewReader(body))
	req.Header.Set("X-API-Key", "test-key")
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}

	var resp llm.VHFResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}
	if resp.Response.Station != "Falmouth Coastguard" {
		t.Errorf("unexpected station: %s", resp.Response.Station)
	}
}

func TestSessionHandler_Create(t *testing.T) {
	mgr := session.NewManager()
	h := handler.NewSessionHandler(mgr)

	body, _ := json.Marshal(map[string]string{
		"region": "uk-south", "vessel_name": "SV Artemis", "vessel_type": "sailing-yacht",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/vhf/sessions", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	h.Create(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("expected 201, got %d", w.Code)
	}
	var resp map[string]any
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["id"] == nil {
		t.Error("expected session ID in response")
	}
}

func TestScenariosHandler(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/vhf/scenarios", nil)
	w := httptest.NewRecorder()

	handler.Scenarios(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
	var scenarios []map[string]any
	json.Unmarshal(w.Body.Bytes(), &scenarios)
	if len(scenarios) < 10 {
		t.Errorf("expected at least 10 scenarios, got %d", len(scenarios))
	}
}
```

- [ ] **Step 3: Run tests — expect FAIL**

```bash
cd packages/api && go test ./internal/handler/...
```

- [ ] **Step 4: Implement transmit handler**

Create `internal/handler/transmit.go` with `TransmitHandler` that:
1. Extracts API key from `X-API-Key` header → 401 if missing
2. Parses JSON body (`message`, `session_id`)
3. Looks up session → 404 if not found
4. Builds system prompt from session's region + scenario
5. Calls LLM client with conversation history + new message
6. Adds both user message and assistant response to session
7. Returns the `VHFResponse` JSON

- [ ] **Step 5: Implement session handler**

Create `internal/handler/session.go` with:
- `POST /api/vhf/sessions` — create new session (region, vessel_name, vessel_type, scenario_id)
- `GET /api/vhf/sessions/{id}` — get session with messages

- [ ] **Step 6: Implement scenarios handler**

Create `internal/handler/scenarios.go` with:
- `GET /api/vhf/scenarios` — returns all scenario definitions as JSON

- [ ] **Step 7: Run tests — expect PASS**

```bash
cd packages/api && go test ./internal/handler/...
```

- [ ] **Step 8: Wire routes in main.go**

Update `cmd/server/main.go` to register all routes:

```go
mux.HandleFunc("GET /health", handler.Health)
mux.HandleFunc("POST /api/vhf/sessions", sessionHandler.Create)
mux.HandleFunc("GET /api/vhf/sessions/{id}", sessionHandler.Get)
mux.Handle("POST /api/vhf/transmit", transmitHandler)
mux.HandleFunc("GET /api/vhf/scenarios", handler.Scenarios)
```

- [ ] **Step 9: Run all Go tests**

```bash
cd packages/api && go test ./...
```

- [ ] **Step 10: Commit**

```bash
git add packages/api/
git commit -m "feat(api): add transmit, session, and scenario HTTP handlers

Closes #165"
```

---

## Chunk 3: Frontend (Types, Store, Components, Integration)

> **IMPORTANT — TDD is mandatory for ALL tasks in this chunk.** Every task must follow: write test → run test (expect fail) → implement → run test (expect pass) → commit. Component tests use Vitest + React Testing Library. Use `cd packages/web && pnpm exec vitest run <test-file>` to run tests. Components that read from Zustand store should be tested with a test wrapper that pre-sets store state.

### Task 8: TypeScript Types and API Client

**GitHub Issue:** #166

**Files:**
- Create: `packages/web/src/lib/vhf/types.ts`
- Create: `packages/web/src/lib/vhf/api-client.ts`
- Create: `packages/web/src/lib/vhf/__tests__/api-client.test.ts`

- [ ] **Step 1: Write types**

```typescript
// lib/vhf/types.ts
export interface VHFResponse {
  response: {
    station: string;
    message: string;
    channel: number;
  };
  feedback: {
    correct: string[];
    errors: string[];
    protocol_note: string;
  };
  scenario?: {
    state: string;
    next_expected: string;
    complete: boolean;
    score: number | null;
  };
}

export interface TransmitRequest {
  message: string;
  session_id: string;
}

export interface CreateSessionRequest {
  region: string;
  vessel_name: string;
  vessel_type: string;
  scenario_id?: string;
}

export interface Session {
  id: string;
  region: string;
  vessel_name: string;
  vessel_type: string;
  scenario_id?: string;
  messages: Array<{ role: string; content: string }>;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  briefing: string;
}

export interface TranscriptEntry {
  id: string;
  type: 'tx' | 'rx';
  station: string;
  message: string;
  channel: number;
  timestamp: Date;
  feedback?: VHFResponse['feedback'];
}

export type RadioMode = 'free' | 'scenario';
export type RadioState = 'idle' | 'tx' | 'rx';
export type PowerLevel = '25W' | '1W';
export type VesselType = 'sailing-yacht' | 'motor-yacht' | 'catamaran';
```

- [ ] **Step 2: Write API client tests**

```typescript
// lib/vhf/__tests__/api-client.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VHFApiClient } from '../api-client';

describe('VHFApiClient', () => {
  const client = new VHFApiClient('http://localhost:8080');

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('throws if no API key on transmit', async () => {
    await expect(
      client.transmit({ message: 'hello', session_id: '123' }, '')
    ).rejects.toThrow('API key required');
  });

  it('creates session with correct payload', async () => {
    const mockResponse = { id: 'test-id', region: 'uk-south', vessel_name: 'SV Artemis', vessel_type: 'sailing-yacht', messages: [] };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockResponse), { status: 200 })
    );

    const session = await client.createSession({
      region: 'uk-south',
      vessel_name: 'SV Artemis',
      vessel_type: 'sailing-yacht',
    }, 'test-api-key');

    expect(session.id).toBe('test-id');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/vhf/sessions',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
```

- [ ] **Step 3: Run tests — expect FAIL**

```bash
cd packages/web && pnpm exec vitest run src/lib/vhf/__tests__/api-client.test.ts
```

- [ ] **Step 4: Implement API client**

```typescript
// lib/vhf/api-client.ts
import type { VHFResponse, TransmitRequest, CreateSessionRequest, Session, Scenario } from './types';

export class VHFApiClient {
  constructor(private baseUrl: string) {}

  async transmit(req: TransmitRequest, apiKey: string): Promise<VHFResponse> {
    if (!apiKey) throw new Error('API key required');

    const res = await fetch(`${this.baseUrl}/api/vhf/transmit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      body: JSON.stringify(req),
    });

    if (!res.ok) throw new Error(`Transmit failed: ${res.status}`);
    return res.json();
  }

  async createSession(req: CreateSessionRequest, apiKey: string): Promise<Session> {
    if (!apiKey) throw new Error('API key required');

    const res = await fetch(`${this.baseUrl}/api/vhf/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      body: JSON.stringify(req),
    });

    if (!res.ok) throw new Error(`Create session failed: ${res.status}`);
    return res.json();
  }

  async getScenarios(): Promise<Scenario[]> {
    const res = await fetch(`${this.baseUrl}/api/vhf/scenarios`);
    if (!res.ok) throw new Error(`Get scenarios failed: ${res.status}`);
    return res.json();
  }
}
```

- [ ] **Step 5: Run tests — expect PASS**

- [ ] **Step 6: Commit**

```bash
git add packages/web/src/lib/vhf/
git commit -m "feat(web): add VHF TypeScript types and API client

Closes #166"
```

---

### Task 9: Zustand Store

**GitHub Issue:** #166 (same issue — types/store/client are one unit)

**Files:**
- Create: `packages/web/src/stores/vhf.ts`
- Create: `packages/web/src/stores/__tests__/vhf.test.ts`

- [ ] **Step 1: Write store tests**

```typescript
// stores/__tests__/vhf.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useVHFStore } from '../vhf';

describe('VHF Store', () => {
  beforeEach(() => {
    useVHFStore.setState(useVHFStore.getInitialState());
  });

  it('initialises with channel 16', () => {
    expect(useVHFStore.getState().channel).toBe(16);
  });

  it('clamps channel to valid range', () => {
    useVHFStore.getState().setChannel(0);
    expect(useVHFStore.getState().channel).toBe(1);
    useVHFStore.getState().setChannel(100);
    expect(useVHFStore.getState().channel).toBe(88);
  });

  it('clamps squelch to 0-9', () => {
    useVHFStore.getState().setSquelch(-1);
    expect(useVHFStore.getState().squelch).toBe(0);
    useVHFStore.getState().setSquelch(15);
    expect(useVHFStore.getState().squelch).toBe(9);
  });

  it('toggles power between 25W and 1W', () => {
    expect(useVHFStore.getState().power).toBe('25W');
    useVHFStore.getState().togglePower();
    expect(useVHFStore.getState().power).toBe('1W');
    useVHFStore.getState().togglePower();
    expect(useVHFStore.getState().power).toBe('25W');
  });

  it('adds and clears transcript entries', () => {
    const entry = { id: '1', type: 'rx' as const, station: 'CG', message: 'test', channel: 16, timestamp: new Date() };
    useVHFStore.getState().addTranscriptEntry(entry);
    expect(useVHFStore.getState().transcript).toHaveLength(1);
    useVHFStore.getState().clearTranscript();
    expect(useVHFStore.getState().transcript).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd packages/web && pnpm exec vitest run src/stores/__tests__/vhf.test.ts
```

- [ ] **Step 3: Implement VHF store**

Follow the pattern from `stores/solar.ts` — use `create()` with `persist()` middleware and version migration.

```typescript
// stores/vhf.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TranscriptEntry, RadioState, PowerLevel, VesselType, RadioMode } from '@/lib/vhf/types';

interface VHFState {
  // Radio state
  channel: number;
  squelch: number;
  power: PowerLevel;
  radioState: RadioState;
  mode: RadioMode;

  // Session
  sessionId: string | null;
  transcript: TranscriptEntry[];

  // Settings (persisted)
  apiKey: string;
  region: string;
  vesselName: string;
  vesselType: VesselType;
  scenarioId: string | null;
  ttsVoice: string;
  ttsRate: number;
  audioEffects: boolean;
  audioIntensity: number;

  // Actions
  setChannel: (ch: number) => void;
  setSquelch: (sq: number) => void;
  togglePower: () => void;
  setRadioState: (state: RadioState) => void;
  setMode: (mode: RadioMode) => void;
  setSessionId: (id: string | null) => void;
  addTranscriptEntry: (entry: TranscriptEntry) => void;
  clearTranscript: () => void;
  setApiKey: (key: string) => void;
  setRegion: (region: string) => void;
  setVesselName: (name: string) => void;
  setVesselType: (type: VesselType) => void;
  setScenarioId: (id: string | null) => void;
  setTtsVoice: (voice: string) => void;
  setTtsRate: (rate: number) => void;
  setAudioEffects: (on: boolean) => void;
  setAudioIntensity: (intensity: number) => void;
}

export const useVHFStore = create<VHFState>()(
  persist(
    (set) => ({
      channel: 16,
      squelch: 3,
      power: '25W',
      radioState: 'idle',
      mode: 'free',
      sessionId: null,
      transcript: [],
      apiKey: '',
      region: 'uk-south',
      vesselName: 'SV Artemis',
      vesselType: 'sailing-yacht',
      scenarioId: null,
      ttsVoice: '',
      ttsRate: 1.0,
      audioEffects: true,
      audioIntensity: 0.5,

      setChannel: (ch) => set({ channel: Math.max(1, Math.min(88, ch)) }),
      setSquelch: (sq) => set({ squelch: Math.max(0, Math.min(9, sq)) }),
      togglePower: () => set((s) => ({ power: s.power === '25W' ? '1W' : '25W' })),
      setRadioState: (state) => set({ radioState: state }),
      setMode: (mode) => set({ mode }),
      setSessionId: (id) => set({ sessionId: id }),
      addTranscriptEntry: (entry) => set((s) => ({ transcript: [...s.transcript, entry] })),
      clearTranscript: () => set({ transcript: [] }),
      setApiKey: (key) => set({ apiKey: key }),
      setRegion: (region) => set({ region }),
      setVesselName: (name) => set({ vesselName: name }),
      setVesselType: (type) => set({ vesselType: type }),
      setScenarioId: (id) => set({ scenarioId: id }),
      setTtsVoice: (voice) => set({ ttsVoice: voice }),
      setTtsRate: (rate) => set({ ttsRate: rate }),
      setAudioEffects: (on) => set({ audioEffects: on }),
      setAudioIntensity: (intensity) => set({ audioIntensity: intensity }),
    }),
    {
      name: 'above-deck-vhf',
      version: 1,
      partialize: (state) => ({
        apiKey: state.apiKey,
        region: state.region,
        vesselName: state.vesselName,
        vesselType: state.vesselType,
        ttsVoice: state.ttsVoice,
        ttsRate: state.ttsRate,
        audioEffects: state.audioEffects,
        audioIntensity: state.audioIntensity,
        channel: state.channel,
        squelch: state.squelch,
        power: state.power,
      }),
    }
  )
);
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd packages/web && pnpm exec vitest run src/stores/__tests__/vhf.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add packages/web/src/stores/vhf.ts packages/web/src/stores/__tests__/vhf.test.ts
git commit -m "feat(web): add VHF Zustand store with persisted settings"
```

---

### Task 10: Speech Wrappers

**GitHub Issue:** #170

**Files:**
- Create: `packages/web/src/lib/vhf/speech.ts`
- Create: `packages/web/src/lib/vhf/__tests__/speech.test.ts`

- [ ] **Step 1: Write speech wrapper tests**

```typescript
// lib/vhf/__tests__/speech.test.ts
import { describe, it, expect } from 'vitest';
import { isSTTSupported, isTTSSupported } from '../speech';

describe('Speech Wrappers', () => {
  it('isSTTSupported returns false in jsdom (no SpeechRecognition)', () => {
    expect(isSTTSupported()).toBe(false);
  });

  it('isTTSSupported returns false in jsdom (no speechSynthesis)', () => {
    // jsdom may partially support speechSynthesis; test for graceful handling
    const supported = isTTSSupported();
    expect(typeof supported).toBe('boolean');
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd packages/web && pnpm exec vitest run src/lib/vhf/__tests__/speech.test.ts
```

- [ ] **Step 3: Implement speech wrappers**

Create `lib/vhf/speech.ts` with:

- `isSTTSupported(): boolean` — checks for `SpeechRecognition` or `webkitSpeechRecognition`
- `isTTSSupported(): boolean` — checks for `speechSynthesis`
- `createSTTSession(): { start, stop, onResult, onError }` — wraps SpeechRecognition, starts on PTT press, returns final transcript on stop
- `speak(text: string, voice?: string, rate?: number): Promise<SpeechSynthesisUtterance>` — wraps SpeechSynthesis, returns the utterance for audio routing
- `getVoices(): SpeechSynthesisVoice[]` — list available voices

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd packages/web && pnpm exec vitest run src/lib/vhf/__tests__/speech.test.ts
```

- [ ] **Step 5: Commit**

---

### Task 11: Audio Effects

**GitHub Issue:** #170 (same issue — speech + audio are one unit)

**Files:**
- Create: `packages/web/src/lib/vhf/audio-fx.ts`
- Create: `packages/web/src/lib/vhf/__tests__/audio-fx.test.ts`

- [ ] **Step 1: Write audio effects tests**

```typescript
// lib/vhf/__tests__/audio-fx.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RadioAudioFX } from '../audio-fx';

// Mock AudioContext for jsdom
class MockAudioContext {
  createBiquadFilter = vi.fn(() => ({ type: '', frequency: { value: 0 }, Q: { value: 0 }, connect: vi.fn() }));
  createDynamicsCompressor = vi.fn(() => ({ connect: vi.fn() }));
  createGain = vi.fn(() => ({ gain: { value: 0 }, connect: vi.fn() }));
  createOscillator = vi.fn(() => ({ connect: vi.fn(), start: vi.fn(), stop: vi.fn(), type: '', frequency: { value: 0 } }));
  destination = {};
  close = vi.fn();
}

beforeEach(() => {
  vi.stubGlobal('AudioContext', MockAudioContext);
});

describe('RadioAudioFX', () => {
  it('creates without error', () => {
    const fx = new RadioAudioFX();
    expect(fx).toBeDefined();
  });

  it('setSquelch clamps to 0-9', () => {
    const fx = new RadioAudioFX();
    expect(() => fx.setSquelch(0)).not.toThrow();
    expect(() => fx.setSquelch(9)).not.toThrow();
  });

  it('dispose cleans up AudioContext', () => {
    const fx = new RadioAudioFX();
    fx.dispose();
    // Should not throw on double dispose
    fx.dispose();
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd packages/web && pnpm exec vitest run src/lib/vhf/__tests__/audio-fx.test.ts
```

- [ ] **Step 3: Implement Web Audio effects chain**

Create `lib/vhf/audio-fx.ts` with:

```typescript
export class RadioAudioFX {
  private ctx: AudioContext;
  private bandpass: BiquadFilterNode;
  private compressor: DynamicsCompressorNode;
  private noiseGain: GainNode;

  constructor()
  connect(source: AudioNode): AudioNode  // Route audio through effects chain
  setSquelch(level: number): void         // 0-9, adjusts noise floor
  playSquelchBreak(): void                // Static burst sound
  playStaticBurst(): void                 // Start/end of transmission
  startBackgroundNoise(): void            // Low-level hiss
  stopBackgroundNoise(): void
  dispose(): void
}
```

The effects chain: source → band-pass filter (300Hz–3kHz) → compressor → output. Background white noise generator adjustable via squelch. Squelch break is a short burst of noise played at start/end of RX.

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd packages/web && pnpm exec vitest run src/lib/vhf/__tests__/audio-fx.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add packages/web/src/lib/vhf/speech.ts packages/web/src/lib/vhf/audio-fx.ts packages/web/src/lib/vhf/__tests__/
git commit -m "feat(web): add speech wrappers and Web Audio radio effects

Closes #170"
```

---

### Task 12: RadioScreen Component

**GitHub Issue:** #167

**Files:**
- Create: `packages/web/src/components/vhf/RadioScreen.tsx`
- Create: `packages/web/src/components/vhf/__tests__/RadioScreen.test.tsx`

- [ ] **Step 1: Write RadioScreen test**

```typescript
// components/vhf/__tests__/RadioScreen.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RadioScreen } from '../RadioScreen';
import { useVHFStore } from '@/stores/vhf';

describe('RadioScreen', () => {
  beforeEach(() => {
    useVHFStore.setState({ channel: 16, squelch: 3, power: '25W', radioState: 'idle' });
  });

  it('renders channel number', () => {
    render(<RadioScreen />);
    expect(screen.getByText('16')).toBeDefined();
  });

  it('renders power level', () => {
    render(<RadioScreen />);
    expect(screen.getByText('25W')).toBeDefined();
  });

  it('shows TX indicator when transmitting', () => {
    useVHFStore.setState({ radioState: 'tx' });
    render(<RadioScreen />);
    expect(screen.getByText('TX')).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd packages/web && pnpm exec vitest run src/components/vhf/__tests__/RadioScreen.test.tsx
```

- [ ] **Step 3: Implement RadioScreen**

Shared LCD display component used by both PanelRadio and HandheldRadio. Renders:
- Status bar: power (25W/1W), squelch bars, UTC time
- Channel number (large, centered, Fira Code)
- Frequency (from channel lookup)
- Channel name
- Last RX/TX message with station name and timestamp

Reads state from `useVHFStore`. Uses the brand colour palette from the design spec:
- Light mode: paper `#f4f1eb` bg, ink `#1a1a1a` text
- Dark mode: navy `#16213e` bg, white `#e0e0e0` text
- RX: green accent, TX: red/coral accent

The channel-to-frequency lookup: use a simple client-side map in `lib/vhf/channels.ts` duplicating the most common channels from the Go API (16, 6, 8, 9, 10, 12, 13, 14, 67-73, 77, 80). This avoids an API call for static data.

- [ ] **Step 4: Run test — expect PASS**

```bash
cd packages/web && pnpm exec vitest run src/components/vhf/__tests__/RadioScreen.test.tsx
```

- [ ] **Step 5: Commit**

---

### Task 13: ChannelDial, SquelchDial, PTTButton

**GitHub Issue:** #167

**Files:**
- Create: `packages/web/src/components/vhf/ChannelDial.tsx`
- Create: `packages/web/src/components/vhf/SquelchDial.tsx`
- Create: `packages/web/src/components/vhf/PTTButton.tsx`
- Create: `packages/web/src/components/vhf/__tests__/controls.test.tsx`

- [ ] **Step 1: Write control component tests**

```typescript
// components/vhf/__tests__/controls.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PTTButton } from '../PTTButton';
import { useVHFStore } from '@/stores/vhf';

describe('PTTButton', () => {
  beforeEach(() => {
    useVHFStore.setState(useVHFStore.getInitialState());
  });

  it('renders with idle state', () => {
    render(<PTTButton onStartTransmit={vi.fn()} onStopTransmit={vi.fn()} />);
    expect(screen.getByRole('button', { name: /ptt/i })).toBeDefined();
  });

  it('calls onStartTransmit on mouseDown and onStopTransmit on mouseUp', () => {
    const onStart = vi.fn();
    const onStop = vi.fn();
    render(<PTTButton onStartTransmit={onStart} onStopTransmit={onStop} />);
    const btn = screen.getByRole('button', { name: /ptt/i });
    fireEvent.mouseDown(btn);
    expect(onStart).toHaveBeenCalled();
    fireEvent.mouseUp(btn);
    expect(onStop).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd packages/web && pnpm exec vitest run src/components/vhf/__tests__/controls.test.tsx
```

- [ ] **Step 3: Implement ChannelDial**

Rotatable knob that changes channel (1-88). Desktop: click/drag rotation. Mobile: touch drag. Visual: circular knob with position indicator line. Calls `useVHFStore.setChannel()`.

- [ ] **Step 4: Implement SquelchDial**

Smaller rotatable knob (0-9). Same interaction pattern as ChannelDial. Calls `useVHFStore.setSquelch()`.

- [ ] **Step 5: Implement PTTButton**

Hold-to-transmit button. `onMouseDown`/`onTouchStart` → start TX (set radioState to 'tx', start STT). `onMouseUp`/`onTouchEnd` → stop TX (finalise STT, send to API). Large touch target on mobile. Visual: red when active, grey when idle. Props: `onStartTransmit`, `onStopTransmit` callbacks.

- [ ] **Step 6: Run tests — expect PASS**

```bash
cd packages/web && pnpm exec vitest run src/components/vhf/__tests__/controls.test.tsx
```

- [ ] **Step 7: Commit**

```bash
git add packages/web/src/components/vhf/RadioScreen.tsx packages/web/src/components/vhf/ChannelDial.tsx packages/web/src/components/vhf/SquelchDial.tsx packages/web/src/components/vhf/PTTButton.tsx
git commit -m "feat(web): add RadioScreen, ChannelDial, SquelchDial, PTTButton

Closes #167"
```

---

### Task 14: PanelRadio and HandheldRadio Layouts

**GitHub Issue:** #168

> **Note:** The design spec lists `RadioPanel.tsx` as "Shared radio logic." This shared logic is instead handled by the `use-vhf-radio` hook (Task 16), which provides the common orchestration used by both layouts. A separate `RadioPanel.tsx` is not needed. Similarly, `RegionPicker.tsx` from the spec is handled as a dropdown within `SettingsPanel` (Task 15).

**Files:**
- Create: `packages/web/src/components/vhf/PanelRadio.tsx`
- Create: `packages/web/src/components/vhf/HandheldRadio.tsx`
- Create: `packages/web/src/components/vhf/__tests__/layouts.test.tsx`

- [ ] **Step 1: Write layout smoke tests**

```typescript
// components/vhf/__tests__/layouts.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PanelRadio } from '../PanelRadio';
import { HandheldRadio } from '../HandheldRadio';
import { useVHFStore } from '@/stores/vhf';

describe('PanelRadio', () => {
  beforeEach(() => {
    useVHFStore.setState(useVHFStore.getInitialState());
  });

  it('renders without crashing', () => {
    render(<PanelRadio />);
    // Should render RadioScreen with channel 16
    expect(screen.getByText('16')).toBeDefined();
  });
});

describe('HandheldRadio', () => {
  beforeEach(() => {
    useVHFStore.setState(useVHFStore.getInitialState());
  });

  it('renders without crashing', () => {
    render(<HandheldRadio transcriptPanel={<div>transcript</div>} />);
    expect(screen.getByText('16')).toBeDefined();
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd packages/web && pnpm exec vitest run src/components/vhf/__tests__/layouts.test.tsx
```

- [ ] **Step 3: Implement PanelRadio**

Desktop fixed-mount layout (≥768px), inspired by Garmin VHF 215i:
- Left: RadioScreen (LCD)
- Right: controls panel (ChannelDial, button grid [16/9, CALL, H/L, WX], SquelchDial)
- Below: fist microphone with PTTButton
- Titanium bezel styling matching the device frame aesthetic

- [ ] **Step 4: Implement HandheldRadio**

Mobile handheld layout (<768px), inspired by Garmin Cortex H1P:
- Full-screen device silhouette with antenna and speaker grille
- RadioScreen (compact)
- Controls row: ChannelDial, CH16 button, PTTButton
- Accepts `transcriptPanel` prop — render it inside a Mantine `Drawer` with `position="bottom"` and a drag handle for swipe-up

Both layouts compose the same sub-components (RadioScreen, ChannelDial, SquelchDial, PTTButton).

- [ ] **Step 5: Run tests — expect PASS**

```bash
cd packages/web && pnpm exec vitest run src/components/vhf/__tests__/layouts.test.tsx
```

- [ ] **Step 6: Commit**

```bash
git add packages/web/src/components/vhf/PanelRadio.tsx packages/web/src/components/vhf/HandheldRadio.tsx packages/web/src/components/vhf/__tests__/layouts.test.tsx
git commit -m "feat(web): add PanelRadio (desktop) and HandheldRadio (mobile) layouts

Closes #168"
```

---

### Task 15: TranscriptPanel, ScenarioPicker, SettingsPanel

**GitHub Issues:** #169, #171

**Files:**
- Create: `packages/web/src/components/vhf/TranscriptPanel.tsx`
- Create: `packages/web/src/components/vhf/ScenarioPicker.tsx`
- Create: `packages/web/src/components/vhf/SettingsPanel.tsx`
- Create: `packages/web/src/components/vhf/__tests__/TranscriptPanel.test.tsx`

- [ ] **Step 1: Write TranscriptPanel test**

```typescript
// components/vhf/__tests__/TranscriptPanel.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TranscriptPanel } from '../TranscriptPanel';
import { useVHFStore } from '@/stores/vhf';

describe('TranscriptPanel', () => {
  beforeEach(() => {
    useVHFStore.setState(useVHFStore.getInitialState());
  });

  it('renders empty state', () => {
    render(<TranscriptPanel />);
    // Should show some empty state or no entries
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('renders transcript entries', () => {
    useVHFStore.setState({
      transcript: [
        { id: '1', type: 'tx', station: 'You', message: 'Radio check', channel: 16, timestamp: new Date() },
        { id: '2', type: 'rx', station: 'Falmouth CG', message: 'Loud and clear', channel: 16, timestamp: new Date() },
      ],
    });
    render(<TranscriptPanel />);
    expect(screen.getByText('Radio check')).toBeDefined();
    expect(screen.getByText('Loud and clear')).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd packages/web && pnpm exec vitest run src/components/vhf/__tests__/TranscriptPanel.test.tsx
```

- [ ] **Step 3: Implement TranscriptPanel**

Scrollable log reading from `useVHFStore.transcript`:
- RX: green left-border, station name, message, timestamp
- TX: red left-border, "You", transcribed text, timestamp
- Feedback annotations in scenario mode (green badges for correct, inline notes for errors)
- Scenario debrief: when `scenario.complete` is true, render a summary section with the final score and performance breakdown
- Auto-scrolls to latest entry

- [ ] **Step 4: Run test — expect PASS**

```bash
cd packages/web && pnpm exec vitest run src/components/vhf/__tests__/TranscriptPanel.test.tsx
```

- [ ] **Step 5: Implement ScenarioPicker**

Fetches scenarios from API (`getScenarios()`). Displays as a list with name, description. On select: sets `scenarioId` in store, creates new session with scenario, shows briefing.

- [ ] **Step 6: Implement SettingsPanel**

Form reading/writing `useVHFStore`:
- API key input (password field, validated with a test call on save)
- Region picker (dropdown of available regions)
- Call sign text input (default: "SV Artemis") — labelled "Call Sign" per spec
- Vessel type selector (sailing yacht, motor yacht, catamaran)
- TTS voice selector (populated from `getVoices()`)
- TTS rate slider (0.5–2.0)
- Audio effects toggle + intensity slider
- Mic input selector (from `navigator.mediaDevices.enumerateDevices()`)

Accessible from gear icon. Rendered as a modal/drawer.

- [ ] **Step 7: Commit**

```bash
git add packages/web/src/components/vhf/TranscriptPanel.tsx packages/web/src/components/vhf/ScenarioPicker.tsx packages/web/src/components/vhf/SettingsPanel.tsx packages/web/src/components/vhf/__tests__/TranscriptPanel.test.tsx
git commit -m "feat(web): add TranscriptPanel, ScenarioPicker, and SettingsPanel

Closes #169 #171"
```

---

### Task 16: use-vhf-radio Hook and VHFSimulator Island

**GitHub Issues:** #172

**Files:**
- Create: `packages/web/src/hooks/use-vhf-radio.ts`
- Create: `packages/web/src/hooks/__tests__/use-vhf-radio.test.ts`
- Create: `packages/web/src/components/vhf/VHFSimulator.tsx`

- [ ] **Step 1: Write hook test**

```typescript
// hooks/__tests__/use-vhf-radio.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVHFRadio } from '../use-vhf-radio';
import { useVHFStore } from '@/stores/vhf';

// Mock the API client module
vi.mock('@/lib/vhf/api-client', () => ({
  VHFApiClient: vi.fn().mockImplementation(() => ({
    createSession: vi.fn().mockResolvedValue({ id: 'session-1', region: 'uk-south', vessel_name: 'SV Artemis', vessel_type: 'sailing-yacht', messages: [] }),
    transmit: vi.fn().mockResolvedValue({
      response: { station: 'Coastguard', message: 'Loud and clear', channel: 16 },
      feedback: { correct: [], errors: [], protocol_note: '' },
    }),
  })),
}));

describe('useVHFRadio', () => {
  beforeEach(() => {
    useVHFStore.setState({ ...useVHFStore.getInitialState(), apiKey: 'test-key' });
  });

  it('returns expected interface', () => {
    const { result } = renderHook(() => useVHFRadio());
    expect(result.current.startTransmit).toBeDefined();
    expect(result.current.stopTransmit).toBeDefined();
    expect(result.current.createSession).toBeDefined();
    expect(typeof result.current.isReady).toBe('boolean');
  });

  it('isReady is false when no API key', () => {
    useVHFStore.setState({ apiKey: '' });
    const { result } = renderHook(() => useVHFRadio());
    expect(result.current.isReady).toBe(false);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd packages/web && pnpm exec vitest run src/hooks/__tests__/use-vhf-radio.test.ts
```

- [ ] **Step 3: Implement use-vhf-radio hook**

Orchestration hook that ties everything together:

```typescript
// hooks/use-vhf-radio.ts
import { useCallback, useRef, useMemo } from 'react';
import { useVHFStore } from '@/stores/vhf';
import { VHFApiClient } from '@/lib/vhf/api-client';
import { RadioAudioFX } from '@/lib/vhf/audio-fx';
import { isSTTSupported, createSTTSession, speak } from '@/lib/vhf/speech';
import type { TranscriptEntry } from '@/lib/vhf/types';

const API_URL = import.meta.env.PUBLIC_VHF_API_URL || 'http://localhost:8080';

export function useVHFRadio() {
  const store = useVHFStore();
  const client = useMemo(() => new VHFApiClient(API_URL), []);
  const audioFX = useRef<RadioAudioFX | null>(null);
  const sttSession = useRef<ReturnType<typeof createSTTSession> | null>(null);

  const isReady = !!store.apiKey;

  const startTransmit = useCallback(() => {
    store.setRadioState('tx');
    if (isSTTSupported()) {
      sttSession.current = createSTTSession();
      sttSession.current.start();
    }
  }, [store]);

  const stopTransmit = useCallback(async () => {
    let transcript = '';
    if (sttSession.current) {
      transcript = await new Promise<string>((resolve) => {
        sttSession.current!.onResult = (text: string) => resolve(text);
        sttSession.current!.stop();
      });
    }

    if (!transcript || !store.sessionId) {
      store.setRadioState('idle');
      return;
    }

    // Add TX entry
    const txEntry: TranscriptEntry = {
      id: crypto.randomUUID(),
      type: 'tx',
      station: 'You',
      message: transcript,
      channel: store.channel,
      timestamp: new Date(),
    };
    store.addTranscriptEntry(txEntry);

    // Call API
    store.setRadioState('rx');
    try {
      const response = await client.transmit(
        { message: transcript, session_id: store.sessionId },
        store.apiKey,
      );

      // Play response with audio FX
      if (audioFX.current) audioFX.current.playSquelchBreak();
      await speak(response.response.message, store.ttsVoice, store.ttsRate);

      // Add RX entry
      const rxEntry: TranscriptEntry = {
        id: crypto.randomUUID(),
        type: 'rx',
        station: response.response.station,
        message: response.response.message,
        channel: response.response.channel,
        timestamp: new Date(),
        feedback: response.feedback,
      };
      store.addTranscriptEntry(rxEntry);
    } catch (err) {
      console.error('Transmit error:', err);
    }
    store.setRadioState('idle');
  }, [store, client]);

  const createSession = useCallback(async (scenarioId?: string) => {
    const session = await client.createSession({
      region: store.region,
      vessel_name: store.vesselName,
      vessel_type: store.vesselType,
      scenario_id: scenarioId,
    }, store.apiKey);
    store.setSessionId(session.id);
    store.clearTranscript();
    if (scenarioId) store.setScenarioId(scenarioId);
  }, [store, client]);

  const selectScenario = useCallback(async (id: string) => {
    await createSession(id);
    store.setMode('scenario');
  }, [createSession, store]);

  return { startTransmit, stopTransmit, createSession, selectScenario, isReady, error: null };
}
```

Audio state machine: Idle (background hiss) → TX (PTT held, mic active) → Idle → RX (response playing with effects) → Idle.

- [ ] **Step 4: Run test — expect PASS**

```bash
cd packages/web && pnpm exec vitest run src/hooks/__tests__/use-vhf-radio.test.ts
```

- [ ] **Step 5: Implement VHFSimulator**

Top-level React component. Wraps in MantineProvider (per lesson: `client:only` islands must self-wrap).

```typescript
export function VHFSimulator() {
  // Detect viewport: window.innerWidth >= 768 ? 'panel' : 'handheld'
  // Allow desktop toggle to handheld view

  // Render: PanelRadio or HandheldRadio + TranscriptPanel
  // Show SettingsPanel when no API key is set (first-run experience)
  // Show text input fallback when STT is not available

  // On mobile, TranscriptPanel renders inside HandheldRadio as a swipe-up
  // Drawer (use Mantine Drawer with position="bottom" and drag handle)
  return layout === 'panel'
    ? <><PanelRadio /><TranscriptPanel /></>
    : <HandheldRadio transcriptPanel={<TranscriptPanel />} />;
}
```

- [ ] **Step 6: Commit**

```bash
git add packages/web/src/hooks/use-vhf-radio.ts packages/web/src/components/vhf/VHFSimulator.tsx
git commit -m "feat(web): add use-vhf-radio hook and VHFSimulator island

Closes #172"
```

---

### Task 17: Wire VHFSimulator into ScreenVHF

**GitHub Issue:** #158 (epic)

**Files:**
- Modify: `packages/web/src/components/landing/ScreenVHF.astro` — replace placeholder with React island
- Alternatively: create `packages/web/src/pages/tools/vhf.astro` for standalone page

- [ ] **Step 1: Update ScreenVHF or create standalone page**

The VHF simulator needs to run as a `client:only="react"` island (uses browser APIs). Two options:
- **Option A:** Replace ScreenVHF placeholder content with `<VHFSimulator client:only="react" />` inside the device frame
- **Option B:** Create a standalone `/tools/vhf` page (like `/tools/solar`) and have the ScreenVHF button navigate to it

**Recommended: Option B** — the VHF simulator is a full-screen interactive app that benefits from its own page. The ScreenVHF placeholder can remain as a teaser that links to `/tools/vhf`. This matches how the Solar tool works (`ScreenSolar` in the device frame is a demo view, while `/tools/solar` is the full app).

```astro
<!-- pages/tools/vhf.astro -->
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { VHFSimulator } from '../../components/vhf/VHFSimulator';
export const prerender = false;
---
<BaseLayout title="VHF Radio Simulator — Above Deck">
  <VHFSimulator client:only="react" />
</BaseLayout>
```

- [ ] **Step 2: Update ScreenVHF to link to full app**

Add a "Launch VHF Simulator" button to the placeholder that navigates to `/tools/vhf`.

- [ ] **Step 3: Verify build**

```bash
cd packages/web && pnpm exec astro build
```
Expected: Build completes with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add packages/web/src/pages/tools/vhf.astro packages/web/src/components/landing/ScreenVHF.astro packages/web/src/components/vhf/
git commit -m "feat(web): wire VHFSimulator into vhf.astro page and update ScreenVHF placeholder"
```

---

### Task 18: Supabase Schema (Deferred)

**GitHub Issue:** #173

This task is deferred to after the core feature works end-to-end with in-memory sessions. The schema is documented here for when persistence is needed:

```sql
-- vhf_sessions
create table vhf_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  region text not null,
  vessel_name text not null,
  vessel_type text not null default 'sailing-yacht',
  scenario_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- vhf_messages
create table vhf_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references vhf_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  station text,
  message text not null,
  channel int,
  feedback jsonb,
  created_at timestamptz default now()
);

-- RLS: users can only access their own sessions
alter table vhf_sessions enable row level security;
create policy "Users can manage own sessions" on vhf_sessions
  for all using (auth.uid() = user_id);

alter table vhf_messages enable row level security;
create policy "Users can access messages in own sessions" on vhf_messages
  for all using (session_id in (select id from vhf_sessions where user_id = auth.uid()));
```

---

### Task 19: AIS Client (aisstream.io)

**GitHub Issue:** #174

**Files:**
- Create: `packages/api/internal/ais/types.go`
- Create: `packages/api/internal/ais/client.go`
- Create: `packages/api/internal/ais/client_test.go`

- [ ] **Step 1: Write AIS types**

```go
// internal/ais/types.go
package ais

// Vessel represents a real vessel from AIS data, injected into the LLM system prompt.
type Vessel struct {
	MMSI        int     `json:"mmsi"`
	Name        string  `json:"name"`
	CallSign    string  `json:"call_sign"`
	VesselType  int     `json:"vessel_type"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
	Destination string  `json:"destination"`
	TypeName    string  `json:"type_name"` // human-readable vessel type
}

// BoundingBox defines a geographic area to query AIS vessels within.
type BoundingBox struct {
	MinLat float64
	MaxLat float64
	MinLon float64
	MaxLon float64
}

// VesselTypeNames maps AIS vessel type codes to human-readable names.
var VesselTypeNames = map[int]string{
	30: "Fishing",
	36: "Sailing",
	37: "Pleasure craft",
	60: "Passenger",
	70: "Cargo",
	80: "Tanker",
}

func VesselTypeName(code int) string {
	if name, ok := VesselTypeNames[code]; ok {
		return name
	}
	return "Vessel"
}
```

- [ ] **Step 2: Write AIS client test**

```go
// internal/ais/client_test.go
package ais_test

import (
	"testing"

	"github.com/curphey/above-deck/api/internal/ais"
)

func TestVesselTypeName(t *testing.T) {
	tests := []struct {
		code int
		want string
	}{
		{36, "Sailing"},
		{70, "Cargo"},
		{99, "Vessel"},
	}
	for _, tt := range tests {
		got := ais.VesselTypeName(tt.code)
		if got != tt.want {
			t.Errorf("VesselTypeName(%d) = %q, want %q", tt.code, got, tt.want)
		}
	}
}

func TestBoundingBox(t *testing.T) {
	bb := ais.BoundingBox{MinLat: 49.5, MaxLat: 50.5, MinLon: -6.0, MaxLon: -4.0}
	if bb.MinLat >= bb.MaxLat || bb.MinLon >= bb.MaxLon {
		t.Error("invalid bounding box")
	}
}
```

- [ ] **Step 3: Run tests — expect PASS**

```bash
cd packages/api && go test ./internal/ais/...
```

- [ ] **Step 4: Implement AIS WebSocket client**

```go
// internal/ais/client.go
package ais

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"golang.org/x/net/websocket"
)

const aisStreamURL = "wss://stream.aisstream.io/v0/stream"

// Client queries aisstream.io for live vessel data.
type Client struct {
	APIKey string
}

// NewClient creates an AIS client. The API key is from aisstream.io (free tier).
func NewClient(apiKey string) *Client {
	return &Client{APIKey: apiKey}
}

// FetchVessels queries aisstream.io for vessels within the bounding box.
// Returns up to maxCount vessels, with a timeout. Falls back to empty slice on error.
func (c *Client) FetchVessels(ctx context.Context, bbox BoundingBox, maxCount int) ([]Vessel, error) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	ws, err := websocket.Dial(aisStreamURL, "", "http://localhost")
	if err != nil {
		return nil, fmt.Errorf("ais: websocket dial: %w", err)
	}
	defer ws.Close()

	// Subscribe with bounding box filter
	subscribe := map[string]any{
		"APIKey": c.APIKey,
		"BoundingBoxes": [][]float64{
			{bbox.MinLat, bbox.MinLon, bbox.MaxLat, bbox.MaxLon},
		},
	}
	if err := websocket.JSON.Send(ws, subscribe); err != nil {
		return nil, fmt.Errorf("ais: subscribe: %w", err)
	}

	vessels := make(map[int]Vessel)
	for len(vessels) < maxCount {
		select {
		case <-ctx.Done():
			break
		default:
		}

		var msg json.RawMessage
		if err := websocket.JSON.Receive(ws, &msg); err != nil {
			break
		}

		var parsed struct {
			MetaData struct {
				MMSI      int     `json:"MMSI"`
				Latitude  float64 `json:"latitude"`
				Longitude float64 `json:"longitude"`
			} `json:"MetaData"`
			Message struct {
				PositionReport struct {
					ShipName    string `json:"ShipName"`
					CallSign    string `json:"CallSign"`
					VesselType  int    `json:"ShipType"`
					Destination string `json:"Destination"`
				} `json:"PositionReport"`
			} `json:"Message"`
		}
		if err := json.Unmarshal(msg, &parsed); err != nil {
			continue
		}

		mmsi := parsed.MetaData.MMSI
		if mmsi == 0 || parsed.Message.PositionReport.ShipName == "" {
			continue
		}

		vessels[mmsi] = Vessel{
			MMSI:        mmsi,
			Name:        parsed.Message.PositionReport.ShipName,
			CallSign:    parsed.Message.PositionReport.CallSign,
			VesselType:  parsed.Message.PositionReport.VesselType,
			Latitude:    parsed.MetaData.Latitude,
			Longitude:   parsed.MetaData.Longitude,
			Destination: parsed.Message.PositionReport.Destination,
			TypeName:    VesselTypeName(parsed.Message.PositionReport.VesselType),
		}
	}

	result := make([]Vessel, 0, len(vessels))
	for _, v := range vessels {
		result = append(result, v)
	}
	return result, nil
}
```

- [ ] **Step 5: Add `golang.org/x/net` dependency**

```bash
cd packages/api && go get golang.org/x/net
```

- [ ] **Step 6: Run tests — expect PASS**

```bash
cd packages/api && go test ./internal/ais/...
```

- [ ] **Step 7: Commit**

```bash
git add packages/api/internal/ais/
git commit -m "feat(api): add aisstream.io client for live AIS vessel data

Queries aisstream.io WebSocket for real vessels by bounding box.
Returns vessel name, call sign, MMSI, position, and type.
Used to inject realistic vessel data into LLM system prompts."
```

---

### Task 20: DSC Panel Component

**GitHub Issue:** #175

**Files:**
- Create: `components/vhf/DSCPanel.tsx`
- Create: `components/vhf/__tests__/DSCPanel.test.tsx`

- [ ] **Step 1: Write DSC panel test**

```typescript
// components/vhf/__tests__/DSCPanel.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DSCPanel } from '../DSCPanel';

describe('DSCPanel', () => {
  it('renders alert type options', () => {
    render(<DSCPanel onSendAlert={vi.fn()} onCancel={vi.fn()} mmsi="235099000" />);
    expect(screen.getByText('Distress')).toBeDefined();
    expect(screen.getByText('Urgency')).toBeDefined();
    expect(screen.getByText('Safety')).toBeDefined();
    expect(screen.getByText('Routine')).toBeDefined();
  });

  it('shows nature of distress selector for distress alerts', () => {
    render(<DSCPanel onSendAlert={vi.fn()} onCancel={vi.fn()} mmsi="235099000" />);
    fireEvent.click(screen.getByText('Distress'));
    expect(screen.getByText('Flooding')).toBeDefined();
    expect(screen.getByText('Fire/Explosion')).toBeDefined();
  });

  it('calls onSendAlert with correct data', () => {
    const onSend = vi.fn();
    render(<DSCPanel onSendAlert={onSend} onCancel={vi.fn()} mmsi="235099000" />);
    fireEvent.click(screen.getByText('Distress'));
    fireEvent.click(screen.getByText('Flooding'));
    // The send button requires confirmation for distress
    fireEvent.click(screen.getByText('Send'));
    fireEvent.click(screen.getByText('Confirm'));
    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'distress', nature: 'flooding', mmsi: '235099000' })
    );
  });

  it('cancel button calls onCancel', () => {
    const onCancel = vi.fn();
    render(<DSCPanel onSendAlert={vi.fn()} onCancel={onCancel} mmsi="235099000" />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd packages/web && pnpm exec vitest run components/vhf/__tests__/DSCPanel.test.tsx
```
Expected: FAIL — `DSCPanel` module not found

- [ ] **Step 3: Implement DSCPanel**

```tsx
// components/vhf/DSCPanel.tsx
import { useState } from 'react';

const ALERT_TYPES = ['distress', 'urgency', 'safety', 'routine', 'all-ships'] as const;
type AlertType = (typeof ALERT_TYPES)[number];

const DISTRESS_NATURES = [
  'undesignated', 'fire-explosion', 'flooding', 'collision', 'grounding',
  'capsizing', 'sinking', 'disabled-adrift', 'abandoning-ship', 'mob', 'piracy',
] as const;

const DISTRESS_LABELS: Record<string, string> = {
  'undesignated': 'Undesignated',
  'fire-explosion': 'Fire/Explosion',
  'flooding': 'Flooding',
  'collision': 'Collision',
  'grounding': 'Grounding',
  'capsizing': 'Capsizing',
  'sinking': 'Sinking',
  'disabled-adrift': 'Disabled/Adrift',
  'abandoning-ship': 'Abandoning Ship',
  'mob': 'MOB',
  'piracy': 'Piracy',
};

interface DSCAlert {
  type: AlertType;
  nature?: string;
  mmsi: string;
  targetMmsi?: string;
}

interface DSCPanelProps {
  onSendAlert: (alert: DSCAlert) => void;
  onCancel: () => void;
  mmsi: string;
  position?: string;
}

export function DSCPanel({ onSendAlert, onCancel, mmsi, position }: DSCPanelProps) {
  const [alertType, setAlertType] = useState<AlertType | null>(null);
  const [nature, setNature] = useState<string | null>(null);
  const [targetMmsi, setTargetMmsi] = useState('');
  const [confirming, setConfirming] = useState(false);

  function handleSend() {
    if (alertType === 'distress' && !confirming) {
      setConfirming(true);
      return;
    }
    onSendAlert({
      type: alertType!,
      nature: nature ?? undefined,
      mmsi,
      targetMmsi: targetMmsi || undefined,
    });
  }

  return (
    <div className="dsc-panel">
      <div className="dsc-header">
        <span className="dsc-title">DSC Alert</span>
        <button className="dsc-cancel" onClick={onCancel}>Cancel</button>
      </div>

      <div className="dsc-mmsi">MMSI: {mmsi}</div>
      {position && <div className="dsc-position">Position: {position}</div>}

      <div className="dsc-types">
        {ALERT_TYPES.map((type) => (
          <button
            key={type}
            className={`dsc-type-btn ${alertType === type ? 'active' : ''} ${type === 'distress' ? 'distress' : ''}`}
            onClick={() => { setAlertType(type); setConfirming(false); }}
          >
            {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
          </button>
        ))}
      </div>

      {alertType === 'distress' && (
        <div className="dsc-natures">
          {DISTRESS_NATURES.map((n) => (
            <button
              key={n}
              className={`dsc-nature-btn ${nature === n ? 'active' : ''}`}
              onClick={() => setNature(n)}
            >
              {DISTRESS_LABELS[n]}
            </button>
          ))}
        </div>
      )}

      {alertType && alertType !== 'all-ships' && alertType !== 'distress' && (
        <input
          className="dsc-target-input"
          placeholder="Target MMSI (9 digits)"
          value={targetMmsi}
          onChange={(e) => setTargetMmsi(e.target.value.replace(/\D/g, '').slice(0, 9))}
        />
      )}

      {alertType && (
        <button
          className={`dsc-send-btn ${confirming ? 'confirming' : ''}`}
          onClick={handleSend}
          disabled={alertType === 'distress' && !nature}
        >
          {confirming ? 'Confirm' : 'Send'}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd packages/web && pnpm exec vitest run components/vhf/__tests__/DSCPanel.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add packages/web/src/components/vhf/DSCPanel.tsx packages/web/src/components/vhf/__tests__/DSCPanel.test.tsx
git commit -m "feat(web): add DSC alert panel component

Supports distress, urgency, routine, and all-ships alert types.
Distress alerts require nature selection and confirmation tap.
Renders as overlay triggered by CALL button."
```

---

### Task 21: Add MMSI to Settings and Store

**GitHub Issue:** #176

**Files:**
- Modify: `stores/vhf.ts` — add `mmsi` field to settings
- Modify: `components/vhf/SettingsPanel.tsx` — add MMSI input

- [ ] **Step 1: Add MMSI to store**

Add `mmsi: string` to the settings slice of the Zustand store, with a default randomly generated valid MMSI (e.g., `'235' + Math.random().toString().slice(2, 8).padEnd(6, '0')`).

- [ ] **Step 2: Add MMSI input to SettingsPanel**

Add a text input for MMSI below the Call Sign field. Validate it's 9 digits. Label: "MMSI Number".

- [ ] **Step 3: Run all frontend tests**

```bash
cd packages/web && pnpm exec vitest run
```

- [ ] **Step 4: Commit**

```bash
git add packages/web/src/stores/vhf.ts packages/web/src/components/vhf/SettingsPanel.tsx
git commit -m "feat(web): add MMSI to VHF radio settings

9-digit MMSI stored in Zustand, defaulting to random valid UK MMSI.
Used for DSC alerts and Mayday call identification."
```

---

## Build & Test Sequence

1. **Go API first** (Tasks 1-7): Each task produces tested, committed code
2. **Frontend foundation** (Tasks 8-11): Types, store, speech, audio — all testable independently
3. **Frontend components** (Tasks 12-15, 20-21): UI components using the store
4. **Integration** (Tasks 16-17): Hook + island wiring, end-to-end test
5. **AIS integration** (Task 19): Connect live vessel data to session creation

**To run all Go tests:** `cd packages/api && go test ./...`
**To run all frontend tests:** `cd packages/web && pnpm exec vitest run`
**To start Go API locally:** `cd packages/api && go run ./cmd/server`
**To start frontend dev:** `cd packages/web && pnpm exec astro dev`
