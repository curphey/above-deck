package handler

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/curphey/above-deck/api/internal/llm"
	"github.com/curphey/above-deck/api/internal/radio"
	"github.com/curphey/above-deck/api/internal/session"
)

// LLMClient is the interface TransmitHandler depends on, allowing mock injection in tests.
type LLMClient interface {
	SendMessage(ctx context.Context, apiKey, systemPrompt string, messages []llm.Message) (*llm.VHFResponse, error)
}

// TransmitHandler handles POST /api/vhf/transmit.
type TransmitHandler struct {
	mgr    *session.Manager
	client LLMClient
}

// NewTransmitHandler returns a TransmitHandler wired with the given session manager and LLM client.
func NewTransmitHandler(mgr *session.Manager, client LLMClient) *TransmitHandler {
	return &TransmitHandler{mgr: mgr, client: client}
}

type transmitRequest struct {
	Message   string `json:"message"`
	SessionID string `json:"session_id"`
}

func (h *TransmitHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	apiKey := r.Header.Get("X-API-Key")
	if apiKey == "" {
		http.Error(w, "missing X-API-Key header", http.StatusUnauthorized)
		return
	}

	var req transmitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid JSON body", http.StatusBadRequest)
		return
	}

	sess, ok := h.mgr.Get(req.SessionID)
	if !ok {
		http.Error(w, "session not found", http.StatusNotFound)
		return
	}

	region, _ := radio.GetRegion(sess.Region)

	var scenarioPtr *radio.Scenario
	if sess.ScenarioID != "" {
		sc, found := radio.GetScenario(sess.ScenarioID)
		if found {
			scenarioPtr = &sc
		}
	}

	systemPrompt := llm.BuildSystemPrompt(region, scenarioPtr, sess.VesselName, sess.VesselType)

	messages := append(sess.Messages, llm.Message{Role: "user", Content: req.Message})

	resp, err := h.client.SendMessage(r.Context(), apiKey, systemPrompt, messages)
	if err != nil {
		http.Error(w, "LLM error: "+err.Error(), http.StatusBadGateway)
		return
	}

	h.mgr.AddMessage(req.SessionID, "user", req.Message)
	h.mgr.AddMessage(req.SessionID, "assistant", resp.Response.Message)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
