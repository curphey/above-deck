package tools_test

import (
	"encoding/json"
	"strings"
	"testing"
	"time"

	"github.com/curphey/above-deck/api/internal/tools"
)

func TestTimeTool_Definition(t *testing.T) {
	tool := tools.NewTimeTool()
	def := tool.Definition()

	if def.Name != "get_time" {
		t.Errorf("Name: got %q, want %q", def.Name, "get_time")
	}
	if def.Description == "" {
		t.Error("Description must not be empty")
	}
	if def.InputSchema == nil {
		t.Error("InputSchema must not be nil")
	}
}

func TestTimeTool_Execute(t *testing.T) {
	tool := tools.NewTimeTool()

	before := time.Now().UTC()
	result, err := tool.Execute(json.RawMessage(`{}`))
	after := time.Now().UTC()

	if err != nil {
		t.Fatalf("Execute returned error: %v", err)
	}
	if result == "" {
		t.Fatal("Execute returned empty result")
	}

	var payload map[string]string
	if err := json.Unmarshal([]byte(result), &payload); err != nil {
		t.Fatalf("result is not valid JSON: %v\nresult: %s", err, result)
	}

	utcStr, ok := payload["utc"]
	if !ok {
		t.Fatal("result missing 'utc' field")
	}

	parsed, err := time.Parse(time.RFC3339, utcStr)
	if err != nil {
		t.Fatalf("utc field %q is not RFC3339: %v", utcStr, err)
	}

	if parsed.Before(before.Add(-time.Second)) || parsed.After(after.Add(time.Second)) {
		t.Errorf("utc time %v is not within test window [%v, %v]", parsed, before, after)
	}

	readable, ok := payload["readable"]
	if !ok {
		t.Fatal("result missing 'readable' field")
	}
	if !strings.Contains(readable, "UTC") {
		t.Errorf("readable field %q should contain 'UTC'", readable)
	}
}

func TestTimeTool_Execute_NilInput(t *testing.T) {
	tool := tools.NewTimeTool()
	// nil input should still work — time tool needs no input
	result, err := tool.Execute(nil)
	if err != nil {
		t.Fatalf("Execute with nil input returned error: %v", err)
	}
	if result == "" {
		t.Fatal("Execute returned empty result")
	}
}
