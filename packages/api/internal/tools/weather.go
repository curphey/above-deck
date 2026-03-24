package tools

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"time"
)

const (
	defaultOpenMeteoBaseURL = "https://api.open-meteo.com"
	weatherHTTPTimeout      = 10 * time.Second
	maxResponseBytes        = 1 << 20 // 1 MiB
)

// WeatherTool fetches current marine weather from the Open-Meteo API.
type WeatherTool struct {
	baseURL    string
	httpClient *http.Client
}

// NewWeatherTool creates a WeatherTool. An empty baseURL defaults to the
// production Open-Meteo API endpoint.
func NewWeatherTool(baseURL string) *WeatherTool {
	if baseURL == "" {
		baseURL = defaultOpenMeteoBaseURL
	}
	return &WeatherTool{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: weatherHTTPTimeout,
		},
	}
}

// Definition returns the tool schema for get_weather.
func (w *WeatherTool) Definition() ToolDefinition {
	return ToolDefinition{
		Name:        "get_weather",
		Description: "Fetches current marine weather conditions at a given location using the Open-Meteo marine API. Returns wind speed, wind direction, gusts, wave height, and visibility.",
		InputSchema: map[string]any{
			"type": "object",
			"properties": map[string]any{
				"latitude": map[string]any{
					"type":        "number",
					"description": "Latitude in decimal degrees (-90 to 90).",
				},
				"longitude": map[string]any{
					"type":        "number",
					"description": "Longitude in decimal degrees (-180 to 180).",
				},
			},
			"required": []string{"latitude", "longitude"},
		},
	}
}

type weatherInput struct {
	Latitude  *float64 `json:"latitude"`
	Longitude *float64 `json:"longitude"`
}

// openMeteoResponse is the subset of the Open-Meteo marine API response we use.
type openMeteoResponse struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Current   struct {
		WindSpeed10m      float64 `json:"wind_speed_10m"`
		WindDirection10m  float64 `json:"wind_direction_10m"`
		WindGusts10m      float64 `json:"wind_gusts_10m"`
	} `json:"current"`
	Hourly struct {
		WaveHeight []float64 `json:"wave_height"`
		Visibility []float64 `json:"visibility"`
	} `json:"hourly"`
}

type weatherResult struct {
	WindSpeedKnots  float64 `json:"wind_speed_knots"`
	WindDirection   float64 `json:"wind_direction"`
	WindGustsKnots  float64 `json:"wind_gusts_knots"`
	WaveHeightM     float64 `json:"wave_height_m"`
	VisibilityM     float64 `json:"visibility_m"`
	Location        string  `json:"location"`
}

// Execute fetches marine weather for the given latitude/longitude.
// Returns an error if coordinates are missing or the API request fails.
func (w *WeatherTool) Execute(input json.RawMessage) (string, error) {
	var inp weatherInput
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

	apiURL := w.buildURL(lat, lon)

	ctx, cancel := context.WithTimeout(context.Background(), weatherHTTPTimeout)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return "", fmt.Errorf("build request: %w", err)
	}

	resp, err := w.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("fetch weather: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, maxResponseBytes))
	if err != nil {
		return "", fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		snippet := string(body)
		if len(snippet) > 256 {
			snippet = snippet[:256] + "...[truncated]"
		}
		return "", fmt.Errorf("weather API error (status %d): %s", resp.StatusCode, snippet)
	}

	var meteo openMeteoResponse
	if err := json.Unmarshal(body, &meteo); err != nil {
		return "", fmt.Errorf("parse weather response: %w", err)
	}

	result := weatherResult{
		WindSpeedKnots: meteo.Current.WindSpeed10m,
		WindDirection:  meteo.Current.WindDirection10m,
		WindGustsKnots: meteo.Current.WindGusts10m,
		Location:       fmt.Sprintf("%.4f, %.4f", meteo.Latitude, meteo.Longitude),
	}

	if len(meteo.Hourly.WaveHeight) > 0 {
		result.WaveHeightM = meteo.Hourly.WaveHeight[0]
	}
	if len(meteo.Hourly.Visibility) > 0 {
		result.VisibilityM = meteo.Hourly.Visibility[0]
	}

	data, err := json.Marshal(result)
	if err != nil {
		return "", fmt.Errorf("marshal result: %w", err)
	}
	return string(data), nil
}

func (w *WeatherTool) buildURL(lat, lon float64) string {
	params := url.Values{}
	params.Set("latitude", strconv.FormatFloat(lat, 'f', -1, 64))
	params.Set("longitude", strconv.FormatFloat(lon, 'f', -1, 64))
	params.Set("current", "wind_speed_10m,wind_direction_10m,wind_gusts_10m")
	params.Set("hourly", "wave_height,visibility")
	params.Set("wind_speed_unit", "kn")
	params.Set("timezone", "UTC")
	params.Set("forecast_hours", "6")
	return w.baseURL + "/v1/marine?" + params.Encode()
}
