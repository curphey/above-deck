package handler

import (
	"encoding/json"
	"net/http"

	"github.com/curphey/above-deck/api/internal/radio"
)

// Regions handles GET /api/vhf/regions and returns a lightweight list of all regions.
func Regions(w http.ResponseWriter, r *http.Request) {
	type regionSummary struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	}
	regions := radio.AllRegions()
	summaries := make([]regionSummary, len(regions))
	for i, reg := range regions {
		summaries[i] = regionSummary{ID: reg.ID, Name: reg.Name}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(summaries)
}
