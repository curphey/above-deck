package tools_test

import (
	"encoding/json"
	"math"
	"testing"

	"github.com/curphey/above-deck/api/internal/ais"
	"github.com/curphey/above-deck/api/internal/tools"
)

// mockAISProvider implements tools.AISProvider for testing.
type mockAISProvider struct {
	vessels []ais.Vessel
}

func (m *mockAISProvider) GetVessels() []ais.Vessel {
	return m.vessels
}

func TestAISTool_Definition(t *testing.T) {
	provider := &mockAISProvider{}
	tool := tools.NewAISTool(provider)
	def := tool.Definition()

	if def.Name != "get_ais_targets" {
		t.Errorf("Name: got %q, want %q", def.Name, "get_ais_targets")
	}
	if def.Description == "" {
		t.Error("Description must not be empty")
	}

	props, ok := def.InputSchema["properties"].(map[string]any)
	if !ok {
		t.Fatal("InputSchema must have properties")
	}
	for _, field := range []string{"latitude", "longitude"} {
		if _, ok := props[field]; !ok {
			t.Errorf("InputSchema properties must include %q", field)
		}
	}
}

func TestAISTool_Execute_NearbyVessels(t *testing.T) {
	provider := &mockAISProvider{
		vessels: []ais.Vessel{
			{MMSI: 111111111, Name: "CLOSE SHIP", VesselType: 36, Latitude: 51.5, Longitude: -0.1, SOG: 5.0, COG: 90.0},
			{MMSI: 222222222, Name: "FAR SHIP", VesselType: 70, Latitude: 60.0, Longitude: 10.0, SOG: 10.0, COG: 180.0},
		},
	}
	tool := tools.NewAISTool(provider)

	// Query near the close ship, with a 25nm radius
	input := json.RawMessage(`{"latitude": 51.5, "longitude": -0.1, "radius_nm": 25}`)
	result, err := tool.Execute(input)
	if err != nil {
		t.Fatalf("Execute returned error: %v", err)
	}

	var vessels []map[string]any
	if err := json.Unmarshal([]byte(result), &vessels); err != nil {
		t.Fatalf("result is not valid JSON array: %v\nresult: %s", err, result)
	}

	if len(vessels) != 1 {
		t.Errorf("expected 1 nearby vessel, got %d", len(vessels))
	}
	if len(vessels) > 0 {
		if vessels[0]["name"] != "CLOSE SHIP" {
			t.Errorf("expected CLOSE SHIP, got %v", vessels[0]["name"])
		}
		// distance_nm for same coordinates should be 0
		dist, ok := vessels[0]["distance_nm"].(float64)
		if !ok {
			t.Errorf("distance_nm missing or not a number: %v", vessels[0]["distance_nm"])
		} else if dist != 0.0 {
			t.Errorf("distance_nm for same location: got %f, want 0", dist)
		}

		// Verify required fields
		for _, field := range []string{"name", "mmsi", "type", "latitude", "longitude", "sog_knots", "cog_degrees", "distance_nm"} {
			if _, ok := vessels[0][field]; !ok {
				t.Errorf("result missing field %q", field)
			}
		}
	}
}

func TestAISTool_Execute_DefaultRadius(t *testing.T) {
	// Ship at ~15nm away — should be included with default 20nm radius
	// ~15nm at 51.5N: 1 degree lat ≈ 60nm, so 0.25 degree ≈ 15nm
	provider := &mockAISProvider{
		vessels: []ais.Vessel{
			{MMSI: 333333333, Name: "WITHIN DEFAULT", Latitude: 51.75, Longitude: -0.1, SOG: 0, COG: 0},
			{MMSI: 444444444, Name: "OUTSIDE DEFAULT", Latitude: 55.0, Longitude: -0.1, SOG: 0, COG: 0},
		},
	}
	tool := tools.NewAISTool(provider)

	// No radius_nm in input — should default to 20
	input := json.RawMessage(`{"latitude": 51.5, "longitude": -0.1}`)
	result, err := tool.Execute(input)
	if err != nil {
		t.Fatalf("Execute returned error: %v", err)
	}

	var vessels []map[string]any
	if err := json.Unmarshal([]byte(result), &vessels); err != nil {
		t.Fatalf("result is not valid JSON array: %v\nresult: %s", err, result)
	}

	if len(vessels) != 1 {
		t.Errorf("expected 1 vessel within default 20nm radius, got %d", len(vessels))
	}
	if len(vessels) > 0 && vessels[0]["name"] != "WITHIN DEFAULT" {
		t.Errorf("expected WITHIN DEFAULT, got %v", vessels[0]["name"])
	}
}

func TestAISTool_Execute_Cap20Vessels(t *testing.T) {
	vessels := make([]ais.Vessel, 30)
	for i := range vessels {
		vessels[i] = ais.Vessel{
			MMSI:     100000000 + i,
			Name:     "SHIP",
			Latitude: 51.5,
			Longitude: -0.1,
		}
	}
	provider := &mockAISProvider{vessels: vessels}
	tool := tools.NewAISTool(provider)

	input := json.RawMessage(`{"latitude": 51.5, "longitude": -0.1, "radius_nm": 100}`)
	result, err := tool.Execute(input)
	if err != nil {
		t.Fatalf("Execute returned error: %v", err)
	}

	var got []map[string]any
	if err := json.Unmarshal([]byte(result), &got); err != nil {
		t.Fatalf("result is not valid JSON array: %v", err)
	}

	if len(got) > 20 {
		t.Errorf("expected at most 20 vessels, got %d", len(got))
	}
}

func TestAISTool_Execute_SortedByDistance(t *testing.T) {
	provider := &mockAISProvider{
		vessels: []ais.Vessel{
			{MMSI: 111, Name: "MEDIUM", Latitude: 51.6, Longitude: -0.1},  // ~6nm
			{MMSI: 222, Name: "NEAR", Latitude: 51.51, Longitude: -0.1},   // ~0.6nm
			{MMSI: 333, Name: "FAR", Latitude: 51.7, Longitude: -0.1},     // ~12nm
		},
	}
	tool := tools.NewAISTool(provider)

	input := json.RawMessage(`{"latitude": 51.5, "longitude": -0.1, "radius_nm": 50}`)
	result, err := tool.Execute(input)
	if err != nil {
		t.Fatalf("Execute returned error: %v", err)
	}

	var got []map[string]any
	if err := json.Unmarshal([]byte(result), &got); err != nil {
		t.Fatalf("result is not valid JSON array: %v", err)
	}

	if len(got) != 3 {
		t.Fatalf("expected 3 vessels, got %d", len(got))
	}

	names := make([]string, len(got))
	for i, v := range got {
		names[i] = v["name"].(string)
	}
	expected := []string{"NEAR", "MEDIUM", "FAR"}
	for i, want := range expected {
		if names[i] != want {
			t.Errorf("vessel[%d]: got %q, want %q (order: %v)", i, names[i], want, names)
		}
	}
}

func TestAISTool_Execute_EmptyProvider(t *testing.T) {
	provider := &mockAISProvider{vessels: []ais.Vessel{}}
	tool := tools.NewAISTool(provider)

	input := json.RawMessage(`{"latitude": 51.5, "longitude": -0.1}`)
	result, err := tool.Execute(input)
	if err != nil {
		t.Fatalf("Execute returned error: %v", err)
	}

	// Should return empty JSON array, not null or error
	if result != "[]" {
		t.Errorf("expected empty array [], got %q", result)
	}
}

func TestDistanceNM(t *testing.T) {
	tests := []struct {
		name     string
		lat1     float64
		lon1     float64
		lat2     float64
		lon2     float64
		wantApprox float64
		tolerance  float64
	}{
		{
			name:       "same point",
			lat1: 51.5, lon1: -0.1, lat2: 51.5, lon2: -0.1,
			wantApprox: 0.0, tolerance: 0.01,
		},
		{
			name:       "one degree north at equator (~60nm)",
			lat1: 0, lon1: 0, lat2: 1, lon2: 0,
			wantApprox: 60.0, tolerance: 1.0,
		},
		{
			name:       "known distance: London to Paris ~183nm",
			lat1: 51.5074, lon1: -0.1278,
			lat2: 48.8566, lon2: 2.3522,
			wantApprox: 183.0, tolerance: 5.0,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := tools.DistanceNM(tc.lat1, tc.lon1, tc.lat2, tc.lon2)
			if math.Abs(got-tc.wantApprox) > tc.tolerance {
				t.Errorf("DistanceNM(%f,%f,%f,%f) = %f, want ~%f (±%f)",
					tc.lat1, tc.lon1, tc.lat2, tc.lon2, got, tc.wantApprox, tc.tolerance)
			}
		})
	}
}
