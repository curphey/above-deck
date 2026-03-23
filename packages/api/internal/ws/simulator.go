package ws

import (
	"encoding/json"
	"math"
	"time"

	"github.com/curphey/above-deck/api/internal/ais"
)

// VesselPos is a vessel position for the simulator.
type VesselPos struct {
	Name     string  `json:"name"`
	CallSign string  `json:"call_sign"`
	Lat      float64 `json:"lat"`
	Lon      float64 `json:"lon"`
	SOG      float64 `json:"sog"`
	COG      int     `json:"cog"`
	Type     string  `json:"type"`
}

// MoveVessel updates position based on SOG (knots) and COG (degrees) over dtSeconds.
func MoveVessel(v VesselPos, dtSeconds float64) VesselPos {
	nmTravelled := v.SOG * (dtSeconds / 3600.0)
	cogRad := float64(v.COG) * math.Pi / 180.0
	dLat := nmTravelled * math.Cos(cogRad) / 60.0
	dLon := nmTravelled * math.Sin(cogRad) / (60.0 * math.Cos(v.Lat*math.Pi/180.0))
	v.Lat += dLat
	v.Lon += dLon
	return v
}

// WorldUpdate is the JSON message sent via WebSocket.
type WorldUpdate struct {
	Type        string      `json:"type"`
	Vessels     []VesselPos `json:"vessels"`
	Weather     WeatherData `json:"weather"`
	OwnPosition OwnPos      `json:"ownPosition"`
	Timestamp   string      `json:"timestamp"`
}

// WeatherData holds environmental conditions for the simulator world.
type WeatherData struct {
	WindSpeedKnots float64 `json:"windSpeedKnots"`
	WindDirection  int     `json:"windDirection"`
	SeaState       string  `json:"seaState"`
	Visibility     string  `json:"visibility"`
}

// OwnPos represents the user's own vessel position.
type OwnPos struct {
	Lat float64 `json:"lat"`
	Lon float64 `json:"lon"`
	SOG float64 `json:"sog"`
	COG int     `json:"cog"`
}

// Simulator ticks the world and broadcasts updates.
type Simulator struct {
	hub       *Hub
	session   string
	vessels   []VesselPos
	weather   WeatherData
	ownPos    OwnPos
	interval  time.Duration
	stop      chan struct{}
	aisClient *ais.Client // nil when no real AIS feed is configured
}

// NewSimulator creates a Simulator that broadcasts world updates to the given hub session.
// aisClient may be nil if no real AIS feed is available.
func NewSimulator(hub *Hub, sessionID string, vessels []VesselPos, weather WeatherData, ownLat, ownLon float64, aisClient *ais.Client) *Simulator {
	return &Simulator{
		hub:       hub,
		session:   sessionID,
		vessels:   vessels,
		weather:   weather,
		ownPos:    OwnPos{Lat: ownLat, Lon: ownLon, SOG: 5.0, COG: 320},
		interval:  2 * time.Second,
		stop:      make(chan struct{}),
		aisClient: aisClient,
	}
}

// Start begins the simulation loop in a background goroutine.
func (s *Simulator) Start() {
	go func() {
		ticker := time.NewTicker(s.interval)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				s.tick()
			case <-s.stop:
				return
			}
		}
	}()
}

// Stop halts the simulation loop.
func (s *Simulator) Stop() { close(s.stop) }

func (s *Simulator) tick() {
	dt := s.interval.Seconds()
	for i := range s.vessels {
		s.vessels[i] = MoveVessel(s.vessels[i], dt)
	}

	// Merge real AIS vessels with simulated ones.
	allVessels := make([]VesselPos, len(s.vessels))
	copy(allVessels, s.vessels)

	if s.aisClient != nil {
		for _, v := range s.aisClient.GetVessels() {
			allVessels = append(allVessels, VesselPos{
				Name:     v.Name,
				CallSign: v.CallSign,
				Lat:      v.Latitude,
				Lon:      v.Longitude,
				SOG:      v.SOG,
				COG:      int(v.COG),
				Type:     ais.VesselTypeName(v.VesselType),
			})
		}
	}

	update := WorldUpdate{
		Type:        "world_update",
		Vessels:     allVessels,
		Weather:     s.weather,
		OwnPosition: s.ownPos,
		Timestamp:   time.Now().UTC().Format(time.RFC3339),
	}
	data, err := json.Marshal(update)
	if err != nil {
		return
	}
	s.hub.Broadcast(s.session, data)
}
