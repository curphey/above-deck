package agent

import "time"

func NewWorldState(regionID, regionName string) *WorldState {
	return &WorldState{
		RegionID:     regionID,
		RegionName:   regionName,
		CurrentTime:  time.Now().UTC().Format("15:04 UTC"),
		Weather:      DefaultWeather(regionID),
		Vessels:      []VesselPosition{},
		RadioHistory: []RadioMessage{},
	}
}

func (w *WorldState) AddRadioMessage(station, message string, channel int, direction string) {
	w.RadioHistory = append(w.RadioHistory, RadioMessage{
		Station: station, Message: message, Channel: channel, Direction: direction,
	})
}

func DefaultWeather(regionID string) WeatherState {
	switch regionID {
	case "uk-south":
		return WeatherState{WindSpeedKnots: 15, WindDirection: 220, SeaState: "moderate", Visibility: "good", Forecast: "SW 15-20kn, moderate sea, good visibility, rain later"}
	case "caribbean":
		return WeatherState{WindSpeedKnots: 18, WindDirection: 60, SeaState: "slight to moderate", Visibility: "excellent", Forecast: "NE trades 15-20kn, fair weather, isolated showers"}
	case "med-greece":
		return WeatherState{WindSpeedKnots: 20, WindDirection: 30, SeaState: "moderate to rough", Visibility: "excellent", Forecast: "Meltemi NE 20-25kn, clear skies, rough in open channels"}
	case "se-asia":
		return WeatherState{WindSpeedKnots: 10, WindDirection: 270, SeaState: "slight", Visibility: "moderate", Forecast: "SW monsoon light, hazy, afternoon thunderstorms possible"}
	case "pacific":
		return WeatherState{WindSpeedKnots: 12, WindDirection: 120, SeaState: "slight", Visibility: "good", Forecast: "SE trades 10-15kn, partly cloudy, no tropical systems"}
	case "atlantic":
		return WeatherState{WindSpeedKnots: 22, WindDirection: 40, SeaState: "moderate", Visibility: "good", Forecast: "NE trades 20-25kn, building seas, fair weather"}
	default:
		return WeatherState{WindSpeedKnots: 12, WindDirection: 180, SeaState: "slight", Visibility: "good", Forecast: "Moderate conditions"}
	}
}
