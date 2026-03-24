package tools

import (
	"encoding/json"
	"fmt"
)

// Executor dispatches tool_use calls by name to registered Tool implementations.
type Executor struct {
	tools map[string]Tool
}

// NewExecutor creates an Executor with no registered tools.
func NewExecutor() *Executor {
	return &Executor{
		tools: make(map[string]Tool),
	}
}

// Register adds a tool to the executor, keyed by its definition name.
// Registering a tool with a duplicate name overwrites the previous registration.
func (e *Executor) Register(t Tool) {
	e.tools[t.Definition().Name] = t
}

// Run executes the named tool with the given JSON-encoded input.
// Returns an error if the tool name is not registered.
func (e *Executor) Run(name string, input json.RawMessage) (string, error) {
	t, ok := e.tools[name]
	if !ok {
		return "", fmt.Errorf("unknown tool: %q", name)
	}
	return t.Execute(input)
}

// Definitions returns the ToolDefinition for every registered tool.
// The order of results is not guaranteed.
func (e *Executor) Definitions() []ToolDefinition {
	defs := make([]ToolDefinition, 0, len(e.tools))
	for _, t := range e.tools {
		defs = append(defs, t.Definition())
	}
	return defs
}

// DefinitionsFor returns ToolDefinitions for the named tools that are registered.
// Names that are not registered are silently skipped.
func (e *Executor) DefinitionsFor(names []string) []ToolDefinition {
	defs := make([]ToolDefinition, 0, len(names))
	for _, name := range names {
		if t, ok := e.tools[name]; ok {
			defs = append(defs, t.Definition())
		}
	}
	return defs
}
