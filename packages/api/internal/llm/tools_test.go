package llm_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"

	"github.com/curphey/above-deck/api/internal/llm"
)

// validVHFJSON is a minimal valid VHFResponse JSON.
const validVHFJSON = `{"response":{"station":"Falmouth Coastguard","message":"Go ahead","channel":16},"feedback":{"correct":["Good format"],"errors":[],"protocol_note":""}}`

func textOnlyResponse() map[string]any {
	return map[string]any{
		"stop_reason": "end_turn",
		"content": []map[string]any{
			{"type": "text", "text": validVHFJSON},
		},
	}
}

func toolUseResponse(toolID, toolName string, toolInput map[string]any) map[string]any {
	inputBytes, _ := json.Marshal(toolInput)
	return map[string]any{
		"stop_reason": "tool_use",
		"content": []map[string]any{
			{
				"type":  "tool_use",
				"id":    toolID,
				"name":  toolName,
				"input": json.RawMessage(inputBytes),
			},
		},
	}
}

// TestSendMessageWithTools_NoToolUse verifies that when Claude responds with
// stop_reason "end_turn" and text content, the VHFResponse is returned and
// the executor is never called.
func TestSendMessageWithTools_NoToolUse(t *testing.T) {
	executorCalled := false

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(textOnlyResponse())
	}))
	defer server.Close()

	client := llm.NewClient(server.URL)
	tools := []llm.ToolDef{
		{
			Name:        "get_weather",
			Description: "Get weather for a location",
			InputSchema: map[string]any{"type": "object"},
		},
	}
	executor := func(name string, input json.RawMessage) (string, error) {
		executorCalled = true
		return "", nil
	}

	resp, err := client.SendMessageWithTools(
		context.Background(),
		"test-key",
		"system prompt",
		[]llm.Message{{Role: "user", Content: "What is the weather?"}},
		tools,
		executor,
	)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.Response.Station != "Falmouth Coastguard" {
		t.Errorf("unexpected station: %s", resp.Response.Station)
	}
	if executorCalled {
		t.Error("executor should not have been called")
	}
}

// TestSendMessageWithTools_SingleToolCall verifies that when the first API
// call returns stop_reason "tool_use", the executor is called, and a second
// API call returns the final text response.
func TestSendMessageWithTools_SingleToolCall(t *testing.T) {
	var callCount atomic.Int32
	var capturedToolName string

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		n := callCount.Add(1)
		w.Header().Set("Content-Type", "application/json")
		if n == 1 {
			json.NewEncoder(w).Encode(toolUseResponse("tool-id-1", "lookup_vessel", map[string]any{"mmsi": "123456789"}))
		} else {
			json.NewEncoder(w).Encode(textOnlyResponse())
		}
	}))
	defer server.Close()

	client := llm.NewClient(server.URL)
	tools := []llm.ToolDef{
		{
			Name:        "lookup_vessel",
			Description: "Look up vessel by MMSI",
			InputSchema: map[string]any{"type": "object"},
		},
	}
	executor := func(name string, input json.RawMessage) (string, error) {
		capturedToolName = name
		return `{"vessel":"MV Example","flag":"GBR"}`, nil
	}

	resp, err := client.SendMessageWithTools(
		context.Background(),
		"test-key",
		"system prompt",
		[]llm.Message{{Role: "user", Content: "Who is MMSI 123456789?"}},
		tools,
		executor,
	)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.Response.Station != "Falmouth Coastguard" {
		t.Errorf("unexpected station: %s", resp.Response.Station)
	}
	if callCount.Load() != 2 {
		t.Errorf("expected 2 API calls, got %d", callCount.Load())
	}
	if capturedToolName != "lookup_vessel" {
		t.Errorf("expected executor called with 'lookup_vessel', got %q", capturedToolName)
	}
}

// TestSendMessageWithTools_MaxIterations verifies that when Claude keeps
// returning stop_reason "tool_use", the loop terminates with an error after
// the maximum number of iterations.
func TestSendMessageWithTools_MaxIterations(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(toolUseResponse("tool-id-x", "infinite_tool", map[string]any{}))
	}))
	defer server.Close()

	client := llm.NewClient(server.URL)
	tools := []llm.ToolDef{
		{Name: "infinite_tool", Description: "Never ends", InputSchema: map[string]any{"type": "object"}},
	}
	executor := func(name string, input json.RawMessage) (string, error) {
		return "result", nil
	}

	_, err := client.SendMessageWithTools(
		context.Background(),
		"test-key",
		"system prompt",
		[]llm.Message{{Role: "user", Content: "Go"}},
		tools,
		executor,
	)
	if err == nil {
		t.Fatal("expected error for max iterations, got nil")
	}
	if !strings.Contains(err.Error(), "maximum iterations") {
		t.Errorf("expected 'maximum iterations' in error, got: %v", err)
	}
}

// TestSendMessageWithTools_ExecutorError verifies that when the executor
// returns an error, the error is wrapped as {"error":"..."} and sent back
// to Claude as a tool_result — the loop continues rather than aborting.
func TestSendMessageWithTools_ExecutorError(t *testing.T) {
	var callCount atomic.Int32

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		n := callCount.Add(1)
		w.Header().Set("Content-Type", "application/json")
		if n == 1 {
			json.NewEncoder(w).Encode(toolUseResponse("tool-err-1", "failing_tool", map[string]any{}))
			return
		}
		// On second call verify the tool_result contains an error payload,
		// then return a final text response.
		var reqBody struct {
			Messages []struct {
				Role    string            `json:"role"`
				Content []map[string]any  `json:"content"`
			} `json:"messages"`
		}
		if err := json.NewDecoder(r.Body).Decode(&reqBody); err == nil {
			// Find the last user message with tool results.
			for _, msg := range reqBody.Messages {
				if msg.Role == "user" {
					for _, block := range msg.Content {
						if block["type"] == "tool_result" {
							content, _ := block["content"].(string)
							if !strings.Contains(content, "error") {
								// The error JSON should contain "error" key.
								// We record the failure but let the test continue.
								callCount.Add(100) // sentinel: mark unexpected content
							}
						}
					}
				}
			}
		}
		json.NewEncoder(w).Encode(textOnlyResponse())
	}))
	defer server.Close()

	client := llm.NewClient(server.URL)
	tools := []llm.ToolDef{
		{Name: "failing_tool", Description: "Always fails", InputSchema: map[string]any{"type": "object"}},
	}
	executor := func(name string, input json.RawMessage) (string, error) {
		return "", &testToolError{msg: "database unavailable"}
	}

	resp, err := client.SendMessageWithTools(
		context.Background(),
		"test-key",
		"system prompt",
		[]llm.Message{{Role: "user", Content: "Do the thing"}},
		tools,
		executor,
	)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp == nil {
		t.Fatal("expected non-nil response")
	}
	// Verify no sentinel was set (content check passed).
	if callCount.Load() >= 100 {
		t.Error("tool_result did not contain 'error' in content when executor failed")
	}
	if callCount.Load() != 2 {
		t.Errorf("expected exactly 2 API calls, got %d", callCount.Load())
	}
}

type testToolError struct{ msg string }

func (e *testToolError) Error() string { return e.msg }
