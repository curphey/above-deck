package handler_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/curphey/above-deck/api/internal/handler"
	"github.com/curphey/above-deck/api/internal/llm"
	"github.com/curphey/above-deck/api/internal/session"
)

// mockLLMClient satisfies handler.LLMClient for testing.
type mockLLMClient struct {
	response *llm.VHFResponse
	err      error
}

func (m *mockLLMClient) SendMessage(_ context.Context, _, _ string, _ []llm.Message) (*llm.VHFResponse, error) {
	return m.response, m.err
}

// --- TransmitHandler tests ---

func TestTransmitHandler_NoAPIKey(t *testing.T) {
	mgr := session.NewManager()
	client := &mockLLMClient{}
	h := handler.NewTransmitHandler(mgr, client, nil)

	body := `{"message":"hello","session_id":"any"}`
	req := httptest.NewRequest(http.MethodPost, "/api/vhf/transmit", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	// No X-API-Key header
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", w.Code)
	}
}

func TestTransmitHandler_NoSession(t *testing.T) {
	mgr := session.NewManager()
	client := &mockLLMClient{}
	h := handler.NewTransmitHandler(mgr, client, nil)

	body := `{"message":"hello","session_id":"nonexistent"}`
	req := httptest.NewRequest(http.MethodPost, "/api/vhf/transmit", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", "test-key")
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", w.Code)
	}
}

func TestTransmitHandler_Success(t *testing.T) {
	mgr := session.NewManager()
	sess := mgr.Create("uk-south", "Artemis", "sailing")

	mockResp := &llm.VHFResponse{}
	mockResp.Response.Station = "Falmouth Coastguard"
	mockResp.Response.Message = "Loud and clear, over."
	mockResp.Response.Channel = 16
	mockResp.Feedback.Correct = []string{"Good call format"}
	mockResp.Feedback.Errors = []string{}
	mockResp.Feedback.ProtocolNote = "Acknowledge with OUT"

	client := &mockLLMClient{response: mockResp}
	h := handler.NewTransmitHandler(mgr, client, nil)

	body, _ := json.Marshal(map[string]string{
		"message":    "Falmouth Coastguard, radio check, over.",
		"session_id": sess.ID,
	})
	req := httptest.NewRequest(http.MethodPost, "/api/vhf/transmit", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", "test-key")
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}

	var got llm.VHFResponse
	if err := json.NewDecoder(w.Body).Decode(&got); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if got.Response.Station != "Falmouth Coastguard" {
		t.Errorf("unexpected station: %s", got.Response.Station)
	}
}

// --- SessionHandler tests ---

func TestSessionHandler_Create(t *testing.T) {
	mgr := session.NewManager()
	h := handler.NewSessionHandler(mgr, nil, nil)

	body := `{"region":"uk-south","vessel_name":"Artemis","vessel_type":"sailing"}`
	req := httptest.NewRequest(http.MethodPost, "/api/vhf/sessions", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	h.Create(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("expected 201, got %d", w.Code)
	}

	var got session.Session
	if err := json.NewDecoder(w.Body).Decode(&got); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if got.ID == "" {
		t.Error("expected non-empty session ID")
	}
	if got.Region != "uk-south" {
		t.Errorf("unexpected region: %s", got.Region)
	}
}

// --- Scenarios handler tests ---

func TestScenariosHandler(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/vhf/scenarios", nil)
	w := httptest.NewRecorder()

	handler.Scenarios(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}

	var scenarios []map[string]interface{}
	if err := json.NewDecoder(w.Body).Decode(&scenarios); err != nil {
		t.Fatalf("failed to decode scenarios: %v", err)
	}
	if len(scenarios) < 10 {
		t.Errorf("expected >= 10 scenarios, got %d", len(scenarios))
	}
}
