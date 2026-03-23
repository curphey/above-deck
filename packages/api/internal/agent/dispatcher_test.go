package agent

import (
	"context"
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
