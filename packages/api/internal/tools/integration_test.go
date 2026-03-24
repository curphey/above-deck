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
	exec.Register(tools.NewWeatherTool("")) // uses default URL — won't be called
	exec.Register(tools.NewAISTool(&mockAISProvider{
		vessels: []ais.Vessel{
			{MMSI: 123, Name: "TEST VESSEL", Latitude: 50.15, Longitude: -5.07, SOG: 5, COG: 180},
			{MMSI: 456, Name: "FAR VESSEL", Latitude: 55.0, Longitude: 10.0, SOG: 12, COG: 90},
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

	// AIS tool filters by distance — returns a JSON array of vessel objects
	result, err = exec.Run("get_ais_targets", json.RawMessage(`{"latitude":50.15,"longitude":-5.07,"radius_nm":10}`))
	if err != nil {
		t.Fatalf("get_ais_targets error: %v", err)
	}
	var aisResult []struct {
		Name string `json:"name"`
	}
	if err := json.Unmarshal([]byte(result), &aisResult); err != nil {
		t.Fatalf("invalid AIS JSON: %v\nraw: %s", err, result)
	}
	if len(aisResult) != 1 {
		t.Errorf("expected 1 nearby vessel, got %d", len(aisResult))
	}
	if len(aisResult) > 0 && aisResult[0].Name != "TEST VESSEL" {
		t.Errorf("expected TEST VESSEL, got %s", aisResult[0].Name)
	}

	// DefinitionsFor filters correctly
	defs := exec.DefinitionsFor([]string{"get_time", "get_weather"})
	if len(defs) != 2 {
		t.Errorf("expected 2 defs, got %d", len(defs))
	}

	// DefinitionsForLLM converts to llm.ToolDef
	llmDefs := exec.DefinitionsForLLM([]string{"get_time", "get_ais_targets"})
	if len(llmDefs) != 2 {
		t.Errorf("expected 2 LLM defs, got %d", len(llmDefs))
	}
	for _, d := range llmDefs {
		if d.Name == "" {
			t.Error("expected non-empty tool name in LLM def")
		}
	}

	// Unknown tool returns error
	_, err = exec.Run("nonexistent", json.RawMessage(`{}`))
	if err == nil {
		t.Error("expected error for unknown tool")
	}

	// DefinitionsForLLM skips unknown names
	partial := exec.DefinitionsForLLM([]string{"get_time", "get_tides"})
	if len(partial) != 1 {
		t.Errorf("expected 1 def (get_tides not registered), got %d", len(partial))
	}
}
