package ais

type Vessel struct {
	MMSI        int     `json:"mmsi"`
	Name        string  `json:"name"`
	CallSign    string  `json:"call_sign"`
	VesselType  int     `json:"vessel_type"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
	Destination string  `json:"destination"`
	TypeName    string  `json:"type_name"`
}

type BoundingBox struct {
	MinLat float64
	MaxLat float64
	MinLon float64
	MaxLon float64
}

var VesselTypeNames = map[int]string{
	30: "Fishing",
	36: "Sailing",
	37: "Pleasure craft",
	60: "Passenger",
	70: "Cargo",
	80: "Tanker",
}

func VesselTypeName(code int) string {
	if name, ok := VesselTypeNames[code]; ok {
		return name
	}
	return "Vessel"
}
