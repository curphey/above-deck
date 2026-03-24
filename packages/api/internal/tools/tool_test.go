package tools_test

import (
	"encoding/json"
	"testing"

	"github.com/curphey/above-deck/api/internal/tools"
)

func TestToolDefinition_JSONRoundtrip(t *testing.T) {
	def := tools.ToolDefinition{
		Name:        "test_tool",
		Description: "A test tool",
		InputSchema: map[string]any{
			"type": "object",
			"properties": map[string]any{
				"value": map[string]any{"type": "string"},
			},
		},
	}

	data, err := json.Marshal(def)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}

	var got tools.ToolDefinition
	if err := json.Unmarshal(data, &got); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	if got.Name != def.Name {
		t.Errorf("Name: got %q, want %q", got.Name, def.Name)
	}
	if got.Description != def.Description {
		t.Errorf("Description: got %q, want %q", got.Description, def.Description)
	}
}
