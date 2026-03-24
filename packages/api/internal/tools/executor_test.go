package tools_test

import (
	"encoding/json"
	"errors"
	"strings"
	"testing"

	"github.com/curphey/above-deck/api/internal/tools"
)

// stubTool is a simple Tool implementation for executor tests.
type stubTool struct {
	name   string
	result string
	err    error
}

func (s *stubTool) Definition() tools.ToolDefinition {
	return tools.ToolDefinition{
		Name:        s.name,
		Description: "stub tool " + s.name,
		InputSchema: map[string]any{"type": "object"},
	}
}

func (s *stubTool) Execute(_ json.RawMessage) (string, error) {
	return s.result, s.err
}

func TestExecutor_RegisterAndRun(t *testing.T) {
	ex := tools.NewExecutor()
	ex.Register(&stubTool{name: "alpha", result: `{"ok":true}`})

	result, err := ex.Run("alpha", json.RawMessage(`{}`))
	if err != nil {
		t.Fatalf("Run returned error: %v", err)
	}
	if result != `{"ok":true}` {
		t.Errorf("Run result: got %q, want %q", result, `{"ok":true}`)
	}
}

func TestExecutor_Run_UnknownTool(t *testing.T) {
	ex := tools.NewExecutor()

	_, err := ex.Run("nonexistent", json.RawMessage(`{}`))
	if err == nil {
		t.Fatal("expected error for unknown tool, got nil")
	}
	if !strings.Contains(err.Error(), "nonexistent") {
		t.Errorf("error should mention tool name, got: %v", err)
	}
}

func TestExecutor_Run_ToolError(t *testing.T) {
	ex := tools.NewExecutor()
	wantErr := errors.New("tool failed")
	ex.Register(&stubTool{name: "broken", err: wantErr})

	_, err := ex.Run("broken", json.RawMessage(`{}`))
	if err == nil {
		t.Fatal("expected error from tool execution, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
}

func TestExecutor_Definitions(t *testing.T) {
	ex := tools.NewExecutor()
	ex.Register(&stubTool{name: "tool_a"})
	ex.Register(&stubTool{name: "tool_b"})
	ex.Register(&stubTool{name: "tool_c"})

	defs := ex.Definitions()
	if len(defs) != 3 {
		t.Errorf("Definitions: got %d, want 3", len(defs))
	}

	names := make(map[string]bool)
	for _, d := range defs {
		names[d.Name] = true
	}
	for _, want := range []string{"tool_a", "tool_b", "tool_c"} {
		if !names[want] {
			t.Errorf("Definitions missing %q", want)
		}
	}
}

func TestExecutor_DefinitionsFor(t *testing.T) {
	ex := tools.NewExecutor()
	ex.Register(&stubTool{name: "tool_a"})
	ex.Register(&stubTool{name: "tool_b"})
	ex.Register(&stubTool{name: "tool_c"})

	defs := ex.DefinitionsFor([]string{"tool_a", "tool_c"})
	if len(defs) != 2 {
		t.Errorf("DefinitionsFor: got %d, want 2", len(defs))
	}

	names := make(map[string]bool)
	for _, d := range defs {
		names[d.Name] = true
	}
	if !names["tool_a"] {
		t.Error("DefinitionsFor missing tool_a")
	}
	if !names["tool_c"] {
		t.Error("DefinitionsFor missing tool_c")
	}
	if names["tool_b"] {
		t.Error("DefinitionsFor should not include tool_b")
	}
}

func TestExecutor_DefinitionsFor_UnknownNames(t *testing.T) {
	ex := tools.NewExecutor()
	ex.Register(&stubTool{name: "tool_a"})

	// Requesting unknown names should return only the known ones
	defs := ex.DefinitionsFor([]string{"tool_a", "nonexistent"})
	if len(defs) != 1 {
		t.Errorf("DefinitionsFor with unknown name: got %d defs, want 1", len(defs))
	}
}

func TestExecutor_DefinitionsFor_EmptyNames(t *testing.T) {
	ex := tools.NewExecutor()
	ex.Register(&stubTool{name: "tool_a"})

	defs := ex.DefinitionsFor([]string{})
	if len(defs) != 0 {
		t.Errorf("DefinitionsFor empty names: got %d defs, want 0", len(defs))
	}
}

func TestExecutor_Register_Overwrite(t *testing.T) {
	ex := tools.NewExecutor()
	ex.Register(&stubTool{name: "dup", result: "first"})
	ex.Register(&stubTool{name: "dup", result: "second"})

	result, err := ex.Run("dup", json.RawMessage(`{}`))
	if err != nil {
		t.Fatalf("Run returned error: %v", err)
	}
	// Second registration should overwrite the first
	if result != "second" {
		t.Errorf("expected second registration to win, got %q", result)
	}
}

func TestExecutor_Definitions_Empty(t *testing.T) {
	ex := tools.NewExecutor()
	defs := ex.Definitions()
	if defs == nil {
		t.Error("Definitions on empty executor should return non-nil slice")
	}
	if len(defs) != 0 {
		t.Errorf("Definitions on empty executor: got %d, want 0", len(defs))
	}
}
