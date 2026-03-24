// Package tools provides agent tools for Claude's tool_use API.
// Each tool implements the Tool interface and can be registered with an Executor.
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
	// Definition returns the schema and metadata for this tool.
	Definition() ToolDefinition
	// Execute runs the tool with the given JSON-encoded input and returns
	// a JSON-encoded result string or an error.
	Execute(input json.RawMessage) (string, error)
}
