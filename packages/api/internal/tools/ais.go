package tools

import (
	"encoding/json"
	"fmt"
	"math"
	"sort"

	"github.com/curphey/above-deck/api/internal/ais"
)

const (
	defaultRadiusNM = 20.0
	maxVesselResults = 20
	earthRadiusNM   = 3440.065 // nautical miles
)

// AISProvider is the interface that wraps the GetVessels method.
// The ais.Client satisfies this interface, as do mock implementations in tests.
type AISProvider interface {
	GetVessels() []ais.Vessel
}

// AISTool fetches nearby vessel data from a cached AIS provider.
type AISTool struct {
	provider AISProvider
}

// NewAISTool creates an AISTool backed by the given AISProvider.
func NewAISTool(provider AISProvider) *AISTool {
	return &AISTool{provider: provider}
}

// Definition returns the tool schema for get_nearby_vessels.
func (a *AISTool) Definition() ToolDefinition {
	return ToolDefinition{
		Name:        "get_ais_targets",
		Description: "Returns AIS vessel traffic near a given position. Results are sorted by distance and capped at 20 vessels.",
		InputSchema: map[string]any{
			"type": "object",
			"properties": map[string]any{
				"latitude": map[string]any{
					"type":        "number",
					"description": "Center latitude in decimal degrees.",
				},
				"longitude": map[string]any{
					"type":        "number",
					"description": "Center longitude in decimal degrees.",
				},
				"radius_nm": map[string]any{
					"type":        "number",
					"description": "Search radius in nautical miles. Defaults to 20.",
				},
			},
			"required": []string{"latitude", "longitude"},
		},
	}
}

type aisInput struct {
	Latitude  *float64 `json:"latitude"`
	Longitude *float64 `json:"longitude"`
	RadiusNM  *float64 `json:"radius_nm"`
}

type vesselResult struct {
	Name       string  `json:"name"`
	MMSI       int     `json:"mmsi"`
	Type       string  `json:"type"`
	Latitude   float64 `json:"latitude"`
	Longitude  float64 `json:"longitude"`
	SOGKnots   float64 `json:"sog_knots"`
	COGDegrees float64 `json:"cog_degrees"`
	DistanceNM float64 `json:"distance_nm"`
}

type vesselWithDist struct {
	vessel ais.Vessel
	dist   float64
}

// Execute finds all vessels within radius_nm of the given position,
// sorted by distance, capped at 20 results.
func (a *AISTool) Execute(input json.RawMessage) (string, error) {
	var inp aisInput
	if err := json.Unmarshal(input, &inp); err != nil {
		return "", fmt.Errorf("invalid input: %w", err)
	}

	if inp.Latitude == nil {
		return "", fmt.Errorf("latitude is required")
	}
	if inp.Longitude == nil {
		return "", fmt.Errorf("longitude is required")
	}

	lat := *inp.Latitude
	lon := *inp.Longitude
	radius := defaultRadiusNM
	if inp.RadiusNM != nil {
		radius = *inp.RadiusNM
	}

	all := a.provider.GetVessels()

	var nearby []vesselWithDist
	for _, v := range all {
		d := DistanceNM(lat, lon, v.Latitude, v.Longitude)
		if d <= radius {
			nearby = append(nearby, vesselWithDist{vessel: v, dist: d})
		}
	}

	sort.Slice(nearby, func(i, j int) bool {
		return nearby[i].dist < nearby[j].dist
	})

	if len(nearby) > maxVesselResults {
		nearby = nearby[:maxVesselResults]
	}

	results := make([]vesselResult, 0, len(nearby))
	for _, vd := range nearby {
		v := vd.vessel
		results = append(results, vesselResult{
			Name:       v.Name,
			MMSI:       v.MMSI,
			Type:       ais.VesselTypeName(v.VesselType),
			Latitude:   v.Latitude,
			Longitude:  v.Longitude,
			SOGKnots:   v.SOG,
			COGDegrees: v.COG,
			DistanceNM: math.Round(vd.dist*10) / 10,
		})
	}

	// Encode as empty array rather than null when there are no results.
	if results == nil {
		results = []vesselResult{}
	}

	data, err := json.Marshal(results)
	if err != nil {
		return "", fmt.Errorf("marshal results: %w", err)
	}
	return string(data), nil
}

// DistanceNM computes the great-circle distance in nautical miles between two
// WGS-84 coordinates using the Haversine formula.
// Exported for use in tests and benchmarks.
func DistanceNM(lat1, lon1, lat2, lon2 float64) float64 {
	dLat := toRad(lat2 - lat1)
	dLon := toRad(lon2 - lon1)
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(toRad(lat1))*math.Cos(toRad(lat2))*
			math.Sin(dLon/2)*math.Sin(dLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return earthRadiusNM * c
}

func toRad(deg float64) float64 {
	return deg * math.Pi / 180
}
