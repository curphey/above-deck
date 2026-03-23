package agent

type RadioAgent struct {
	ID            string            `json:"id"`
	Name          string            `json:"name"`
	CallSign      string            `json:"call_sign"`
	AgentType     string            `json:"agent_type"` // coastguard, vessel, marina, port-control
	Nationality   string            `json:"nationality,omitempty"`
	Position      Position          `json:"position"`
	SystemPrompt  string            `json:"system_prompt"`
	KnowledgeDocs []string          `json:"knowledge_docs"`
	Tools         []string          `json:"tools"`
	VesselSpec    *VesselSpec       `json:"vessel_spec,omitempty"`
	Metadata      map[string]string `json:"metadata,omitempty"`
}

type Position struct {
	Lat float64 `json:"lat"`
	Lon float64 `json:"lon"`
}

type VesselSpec struct {
	Type   string `json:"type"`
	Length string `json:"length"`
	Flag   string `json:"flag"`
	MMSI   string `json:"mmsi"`
	Draft  string `json:"draft,omitempty"`
	Rig    string `json:"rig,omitempty"`
	Engine string `json:"engine,omitempty"`
}

type WorldState struct {
	RegionID     string           `json:"region_id"`
	RegionName   string           `json:"region_name"`
	CurrentTime  string           `json:"current_time"`
	Weather      WeatherState     `json:"weather"`
	Vessels      []VesselPosition `json:"vessels"`
	RadioHistory []RadioMessage   `json:"radio_history"`
}

type WeatherState struct {
	WindSpeedKnots float64 `json:"wind_speed_knots"`
	WindDirection  int     `json:"wind_direction"`
	SeaState       string  `json:"sea_state"`
	Visibility     string  `json:"visibility"`
	Forecast       string  `json:"forecast"`
}

type VesselPosition struct {
	Name     string  `json:"name"`
	CallSign string  `json:"call_sign"`
	Lat      float64 `json:"lat"`
	Lon      float64 `json:"lon"`
	SOG      float64 `json:"sog"`
	COG      int     `json:"cog"`
}

type RadioMessage struct {
	Station   string `json:"station"`
	Message   string `json:"message"`
	Channel   int    `json:"channel"`
	Direction string `json:"direction"`
}
