package handler

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/curphey/above-deck/api/internal/ais"
	"github.com/curphey/above-deck/api/internal/radio"
	"github.com/curphey/above-deck/api/internal/session"
	"github.com/curphey/above-deck/api/internal/ws"
)

// SessionHandler handles session creation and retrieval.
type SessionHandler struct {
	mgr       *session.Manager
	wsHub     *ws.Hub
	aisClient *ais.Client // may be nil when no AIS feed is configured
}

// NewSessionHandler returns a SessionHandler backed by the given manager.
// aisClient may be nil.
func NewSessionHandler(mgr *session.Manager, wsHub *ws.Hub, aisClient *ais.Client) *SessionHandler {
	return &SessionHandler{mgr: mgr, wsHub: wsHub, aisClient: aisClient}
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
		sess, _ = h.mgr.Get(sess.ID)
	}

	// Start vessel simulator for this session if region has agents.
	if h.wsHub != nil {
		region, ok := radio.GetRegion(req.Region)
		if ok && len(region.Agents) > 0 {
			vessels := make([]ws.VesselPos, 0, len(region.Agents))
			for _, a := range region.Agents {
				if a.AgentType == "vessel" {
					vessels = append(vessels, ws.VesselPos{
						Name:     a.Name,
						CallSign: a.CallSign,
						Lat:      a.Position.Lat,
						Lon:      a.Position.Lon,
						SOG:      3.0 + float64(len(a.Name)%5), // varied speeds
						COG:      (len(a.Name) * 47) % 360,     // varied headings
						Type:     a.AgentType,
					})
				}
			}
			weather := ws.WeatherData{
				WindSpeedKnots: 15,
				WindDirection:  220,
				SeaState:       "moderate",
				Visibility:     "good",
			}
			// Use first coastguard position as own vessel default position.
			ownLat, ownLon := 50.09, -5.04
			for _, a := range region.Agents {
				if a.AgentType == "coastguard" {
					ownLat = a.Position.Lat - 0.05
					ownLon = a.Position.Lon + 0.02
					break
				}
			}
			sim := ws.NewSimulator(h.wsHub, sess.ID, vessels, weather, ownLat, ownLon, h.aisClient)
			sim.Start()
			log.Printf("Started vessel simulator for session %s with %d vessels", sess.ID, len(vessels))
		}
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
