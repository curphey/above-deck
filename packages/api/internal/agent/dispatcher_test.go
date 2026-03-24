package agent

import (
	"context"
	"encoding/json"
	"strings"
	"testing"

	"github.com/curphey/above-deck/api/internal/llm"
)

type mockLLM struct {
	lastSystemPrompt string
	lastMessages     []llm.Message
}

func (m *mockLLM) SendMessage(ctx context.Context, apiKey, systemPrompt string, messages []llm.Message) (*llm.VHFResponse, error) {
	m.lastSystemPrompt = systemPrompt
	m.lastMessages = messages
	return &llm.VHFResponse{
		Response: struct {
			Station string `json:"station"`
			Message string `json:"message"`
			Channel int    `json:"channel"`
		}{Station: "TEST STATION", Message: "test response", Channel: 16},
	}, nil
}

// mockToolLLM satisfies ToolAwareLLMClient for testing the tool_use dispatch path.
type mockToolLLM struct {
	mockLLM
	toolMethodCalled bool
	lastToolDefs     []llm.ToolDef
}

func (m *mockToolLLM) SendMessageWithTools(_ context.Context, _, _ string, _ []llm.Message, tools []llm.ToolDef, _ llm.ToolExecutor) (*llm.VHFResponse, error) {
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

// mockToolExecutor satisfies ToolExecutorInterface for testing.
type mockToolExecutor struct{}

func (m *mockToolExecutor) Run(_ string, _ json.RawMessage) (string, error) {
	return `{}`, nil
}

func (m *mockToolExecutor) DefinitionsForLLM(names []string) []llm.ToolDef {
	defs := make([]llm.ToolDef, len(names))
	for i, n := range names {
		defs[i] = llm.ToolDef{Name: n, Description: "mock"}
	}
	return defs
}

func TestDispatcherRoutesToCorrectAgent(t *testing.T) {
	agents := []RadioAgent{
		{ID: "solent-cg", Name: "Solent Coastguard", CallSign: "SOLENT COASTGUARD", AgentType: "coastguard", SystemPrompt: "You are Solent Coastguard."},
		{ID: "doris-may", Name: "Doris May", CallSign: "MDMX9", AgentType: "vessel", SystemPrompt: "You are Jim on Doris May."},
	}
	mock := &mockLLM{}
	d := NewDispatcher(agents, mock)

	_, err := d.Dispatch(context.Background(), "test-key", "Solent Coastguard this is Artemis over", "uk-south", "SV Artemis", "sailing-yacht", nil)
	if err != nil {
		t.Fatal(err)
	}

	if !strings.Contains(mock.lastSystemPrompt, "Solent Coastguard") {
		t.Error("expected Solent Coastguard in system prompt")
	}
}

func TestDispatcherRoutesToVessel(t *testing.T) {
	agents := []RadioAgent{
		{ID: "solent-cg", Name: "Solent Coastguard", CallSign: "SOLENT COASTGUARD", AgentType: "coastguard", SystemPrompt: "Coastguard."},
		{ID: "doris-may", Name: "Doris May", CallSign: "MDMX9", AgentType: "vessel", SystemPrompt: "You are Jim on Doris May."},
	}
	mock := &mockLLM{}
	d := NewDispatcher(agents, mock)

	_, err := d.Dispatch(context.Background(), "test-key", "Doris May, Doris May, this is Artemis", "uk-south", "SV Artemis", "sailing-yacht", nil)
	if err != nil {
		t.Fatal(err)
	}

	if !strings.Contains(mock.lastSystemPrompt, "Jim on Doris May") {
		t.Error("expected Doris May personality")
	}
}

func TestDispatcherDefaultsToCoastguard(t *testing.T) {
	agents := []RadioAgent{
		{ID: "solent-cg", Name: "Solent Coastguard", CallSign: "SOLENT COASTGUARD", AgentType: "coastguard", SystemPrompt: "Coastguard."},
	}
	mock := &mockLLM{}
	d := NewDispatcher(agents, mock)

	_, err := d.Dispatch(context.Background(), "test-key", "hello anyone there", "uk-south", "SV Artemis", "sailing-yacht", nil)
	if err != nil {
		t.Fatal(err)
	}

	if !strings.Contains(mock.lastSystemPrompt, "Solent Coastguard") {
		t.Error("expected coastguard default")
	}
}

func TestDispatcherWithTools_UsesToolAwarePath(t *testing.T) {
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

func TestDispatcherWithTools_FallsBackWithoutExecutor(t *testing.T) {
	agents := []RadioAgent{
		{
			ID: "solent-cg", Name: "Solent Coastguard", CallSign: "SOLENT COASTGUARD",
			AgentType: "coastguard", SystemPrompt: "Coastguard.",
			Tools: []string{"get_weather"},
		},
	}
	mock := &mockToolLLM{}
	d := NewDispatcher(agents, mock)
	// No SetToolExecutor call — should fall back to SendMessage

	_, err := d.Dispatch(context.Background(), "test-key", "hello", "uk-south", "SV Artemis", "sailing-yacht", nil)
	if err != nil {
		t.Fatal(err)
	}

	if mock.toolMethodCalled {
		t.Error("expected fallback to SendMessage when no tool executor set")
	}
}
