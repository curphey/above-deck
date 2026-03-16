package handler

import (
	"encoding/json"
	"net/http"

	"github.com/curphey/above-deck/api/internal/radio"
)

// Scenarios handles GET /api/vhf/scenarios and returns all available scenarios as JSON.
func Scenarios(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(radio.AllScenarios())
}
