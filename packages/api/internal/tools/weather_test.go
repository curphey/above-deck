package tools_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/curphey/above-deck/api/internal/tools"
)

// mockOpenMeteoResponse is a minimal Open-Meteo marine API response.
const mockOpenMeteoResponse = `{
  "latitude": 51.5,
  "longitude": -0.1,
  "current_units": {
    "wind_speed_10m": "kn",
    "wind_direction_10m": "°",
    "wind_gusts_10m": "kn"
  },
  "current": {
    "wind_speed_10m": 12.5,
    "wind_direction_10m": 225,
    "wind_gusts_10m": 18.0
  },
  "hourly_units": {
    "wave_height": "m",
    "visibility": "m"
  },
  "hourly": {
    "time": ["2026-03-24T00:00", "2026-03-24T01:00"],
    "wave_height": [1.2, 1.3],
    "visibility": [10000, 9500]
  }
}`

func TestWeatherTool_Definition(t *testing.T) {
	tool := tools.NewWeatherTool("")
	def := tool.Definition()

	if def.Name != "get_weather" {
		t.Errorf("Name: got %q, want %q", def.Name, "get_weather")
	}
	if def.Description == "" {
		t.Error("Description must not be empty")
	}

	// Validate input schema has required latitude and longitude
	schema := def.InputSchema
	if schema == nil {
		t.Fatal("InputSchema must not be nil")
	}
	props, ok := schema["properties"].(map[string]any)
	if !ok {
		t.Fatal("InputSchema must have properties")
	}
	if _, ok := props["latitude"]; !ok {
		t.Error("InputSchema properties must include 'latitude'")
	}
	if _, ok := props["longitude"]; !ok {
		t.Error("InputSchema properties must include 'longitude'")
	}

	required, ok := schema["required"].([]string)
	if !ok {
		t.Fatal("InputSchema must have required array as []string")
	}
	hasLat, hasLon := false, false
	for _, r := range required {
		if r == "latitude" {
			hasLat = true
		}
		if r == "longitude" {
			hasLon = true
		}
	}
	if !hasLat {
		t.Error("latitude must be in required")
	}
	if !hasLon {
		t.Error("longitude must be in required")
	}
}

func TestWeatherTool_Execute_Success(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verify the request path and query parameters
		if !strings.HasPrefix(r.URL.Path, "/v1/marine") {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		q := r.URL.Query()
		if q.Get("latitude") == "" {
			t.Error("missing latitude query param")
		}
		if q.Get("longitude") == "" {
			t.Error("missing longitude query param")
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(mockOpenMeteoResponse))
	}))
	defer srv.Close()

	tool := tools.NewWeatherTool(srv.URL)

	input := json.RawMessage(`{"latitude": 51.5, "longitude": -0.1}`)
	result, err := tool.Execute(input)
	if err != nil {
		t.Fatalf("Execute returned error: %v", err)
	}
	if result == "" {
		t.Fatal("Execute returned empty result")
	}

	var payload map[string]any
	if err := json.Unmarshal([]byte(result), &payload); err != nil {
		t.Fatalf("result is not valid JSON: %v\nresult: %s", err, result)
	}

	fields := []string{"wind_speed_knots", "wind_direction", "wind_gusts_knots", "wave_height_m", "visibility_m", "location"}
	for _, f := range fields {
		if _, ok := payload[f]; !ok {
			t.Errorf("result missing field %q", f)
		}
	}

	if v, ok := payload["wind_speed_knots"].(float64); !ok || v != 12.5 {
		t.Errorf("wind_speed_knots: got %v, want 12.5", payload["wind_speed_knots"])
	}
}

func TestWeatherTool_Execute_GulfOfGuinea(t *testing.T) {
	// lat=0, lon=0 is valid (Gulf of Guinea) — must not be rejected
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(mockOpenMeteoResponse))
	}))
	defer srv.Close()

	tool := tools.NewWeatherTool(srv.URL)
	input := json.RawMessage(`{"latitude": 0, "longitude": 0}`)
	_, err := tool.Execute(input)
	if err != nil {
		t.Errorf("0,0 coordinates should be valid, got error: %v", err)
	}
}

func TestWeatherTool_Execute_MissingCoords(t *testing.T) {
	tool := tools.NewWeatherTool("http://localhost:1") // unreachable, should fail before HTTP

	tests := []struct {
		name  string
		input string
	}{
		{"empty object", `{}`},
		{"missing longitude", `{"latitude": 51.5}`},
		{"missing latitude", `{"longitude": -0.1}`},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			_, err := tool.Execute(json.RawMessage(tc.input))
			if err == nil {
				t.Error("expected error for missing coordinates, got nil")
			}
		})
	}
}

func TestWeatherTool_Execute_HTTPError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "internal server error", http.StatusInternalServerError)
	}))
	defer srv.Close()

	tool := tools.NewWeatherTool(srv.URL)
	input := json.RawMessage(`{"latitude": 51.5, "longitude": -0.1}`)
	_, err := tool.Execute(input)
	if err == nil {
		t.Error("expected error for HTTP 500, got nil")
	}
}

func TestWeatherTool_DefaultBaseURL(t *testing.T) {
	// Empty string should default to the real Open-Meteo URL (just check no panic)
	tool := tools.NewWeatherTool("")
	def := tool.Definition()
	if def.Name != "get_weather" {
		t.Error("tool name should still be get_weather with default base URL")
	}
}
