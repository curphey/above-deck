package handler

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/curphey/above-deck/api/internal/agent"
	"github.com/curphey/above-deck/api/internal/llm"
	"github.com/curphey/above-deck/api/internal/radio"
	"github.com/curphey/above-deck/api/internal/session"
	"github.com/curphey/above-deck/api/internal/ws"
)

// LLMClient is the interface TransmitHandler depends on, allowing mock injection in tests.
type LLMClient interface {
	SendMessage(ctx context.Context, apiKey, systemPrompt string, messages []llm.Message) (*llm.VHFResponse, error)
	SendMessageWithTools(ctx context.Context, apiKey, systemPrompt string, messages []llm.Message, tools []llm.ToolDef, executor llm.ToolExecutor) (*llm.VHFResponse, error)
}

// TransmitHandler handles POST /api/vhf/transmit.
type TransmitHandler struct {
	mgr          *session.Manager
	client       LLMClient
	wsHub        *ws.Hub
	toolExecutor agent.ToolExecutorInterface
}

// NewTransmitHandler returns a TransmitHandler wired with the given session manager, LLM client, WebSocket hub, and optional tool executor.
func NewTransmitHandler(mgr *session.Manager, client LLMClient, wsHub *ws.Hub, toolExec agent.ToolExecutorInterface) *TransmitHandler {
	return &TransmitHandler{mgr: mgr, client: client, wsHub: wsHub, toolExecutor: toolExec}
}

type transmitRequest struct {
	Message   string `json:"message"`
	SessionID string `json:"session_id"`
}

func (h *TransmitHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	apiKey := r.Header.Get("X-API-Key")
	if apiKey == "" {
		apiKey = os.Getenv("ANTHROPIC")
	}
	if apiKey == "" {
		http.Error(w, "missing X-API-Key header or ANTHROPIC env var", http.StatusUnauthorized)
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

	// If region has agents, use the agent dispatcher
	if len(region.Agents) > 0 {
		dispatcher := agent.NewDispatcher(region.Agents, h.client)
		if h.toolExecutor != nil {
			dispatcher.SetToolExecutor(h.toolExecutor)
		}

		// Convert scenario to agent.ScenarioContext if present
		var scenarioCtx *agent.ScenarioContext
		if scenarioPtr != nil {
			briefing := scenarioPtr.Briefing
			if hint, ok := scenarioPtr.RegionHints[region.ID]; ok {
				briefing = hint
			}
			scenarioCtx = &agent.ScenarioContext{
				Name:         scenarioPtr.Name,
				Briefing:     briefing,
				Instructions: scenarioPtr.LLMInstructions,
				Completion:   scenarioPtr.CompletionCriteria,
			}
		}

		// TODO: wire knowledge loading in a future task
		_ = "knowledge" // knowledgePath placeholder

		resp, err := dispatcher.Dispatch(r.Context(), apiKey, req.Message, sess.Region, sess.VesselName, sess.VesselType, scenarioCtx)
		if err != nil {
			log.Printf("Agent dispatch error for session %s: %v", req.SessionID, err)
			http.Error(w, "LLM error: "+err.Error(), http.StatusBadGateway)
			return
		}

		h.mgr.AddMessage(req.SessionID, "user", req.Message)
		h.mgr.AddMessage(req.SessionID, "assistant", resp.Response.Message)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)

		if h.wsHub != nil {
			radioEvent, _ := json.Marshal(map[string]interface{}{
				"type":    "radio_event",
				"agentId": resp.Response.Station,
				"station": resp.Response.Station,
				"message": resp.Response.Message,
				"channel": resp.Response.Channel,
			})
			h.wsHub.Broadcast(req.SessionID, radioEvent)
		}
		return
	}

	// Fallback: old single-prompt path for regions without agents
	systemPrompt := radio.BuildSystemPrompt(region, scenarioPtr, sess.VesselName, sess.VesselType)

	messages := append(sess.Messages, llm.Message{Role: "user", Content: req.Message})

	resp, err := h.client.SendMessage(r.Context(), apiKey, systemPrompt, messages)
	if err != nil {
		log.Printf("LLM error for session %s: %v", req.SessionID, err)
		http.Error(w, "LLM error: "+err.Error(), http.StatusBadGateway)
		return
	}

	h.mgr.AddMessage(req.SessionID, "user", req.Message)
	h.mgr.AddMessage(req.SessionID, "assistant", resp.Response.Message)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)

	if h.wsHub != nil {
		radioEvent, _ := json.Marshal(map[string]interface{}{
			"type":    "radio_event",
			"agentId": resp.Response.Station,
			"station": resp.Response.Station,
			"message": resp.Response.Message,
			"channel": resp.Response.Channel,
		})
		h.wsHub.Broadcast(req.SessionID, radioEvent)
	}
}
