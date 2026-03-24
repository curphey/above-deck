package tools

import (
	"encoding/json"
	"time"
)

// TimeTool returns the current UTC time.
type TimeTool struct{}

// NewTimeTool creates a new TimeTool.
func NewTimeTool() *TimeTool {
	return &TimeTool{}
}

// Definition returns the tool schema for get_current_time.
func (t *TimeTool) Definition() ToolDefinition {
	return ToolDefinition{
		Name:        "get_time",
		Description: "Returns the current UTC time. Useful when the agent needs to know the current date or time for radio communications, weather queries, or log entries.",
		InputSchema: map[string]any{
			"type":       "object",
			"properties": map[string]any{},
		},
	}
}

type timeResult struct {
	UTC      string `json:"utc"`
	Readable string `json:"readable"`
}

// Execute returns the current UTC time as JSON.
// Input is ignored — no parameters are required.
func (t *TimeTool) Execute(_ json.RawMessage) (string, error) {
	now := time.Now().UTC()
	result := timeResult{
		UTC:      now.Format(time.RFC3339),
		Readable: now.Format("15:04 UTC, Mon 02 Jan 2006"),
	}
	data, err := json.Marshal(result)
	if err != nil {
		return "", err
	}
	return string(data), nil
}
