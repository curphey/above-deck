package handler

import (
	"encoding/json"
	"net/http"

	"github.com/curphey/above-deck/api/internal/session"
)

// SessionHandler handles session creation and retrieval.
type SessionHandler struct {
	mgr *session.Manager
}

// NewSessionHandler returns a SessionHandler backed by the given manager.
func NewSessionHandler(mgr *session.Manager) *SessionHandler {
	return &SessionHandler{mgr: mgr}
}

type createSessionRequest struct {
	Region     string `json:"region"`
	VesselName string `json:"vessel_name"`
	VesselType string `json:"vessel_type"`
	ScenarioID string `json:"scenario_id"`
}

// Create handles POST /api/vhf/sessions.
func (h *SessionHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req createSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid JSON body", http.StatusBadRequest)
		return
	}

	sess := h.mgr.Create(req.Region, req.VesselName, req.VesselType)

	if req.ScenarioID != "" {
		h.mgr.SetScenario(sess.ID, req.ScenarioID)
		// Re-fetch to include the updated ScenarioID in the response.
		sess, _ = h.mgr.Get(sess.ID)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(sess)
}

// Get handles GET /api/vhf/sessions/{id}.
func (h *SessionHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	sess, ok := h.mgr.Get(id)
	if !ok {
		http.Error(w, "session not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sess)
}
