package ws

import (
	"math"
	"testing"
)

func TestMoveVesselEast(t *testing.T) {
	v := VesselPos{Name: "Test", Lat: 50.0, Lon: -5.0, SOG: 5.0, COG: 90}
	updated := MoveVessel(v, 2.0)

	if updated.Lon <= v.Lon {
		t.Error("moving east, longitude should increase")
	}
	if math.Abs(updated.Lat-v.Lat) > 0.0001 {
		t.Error("latitude should barely change moving due east")
	}
}

func TestMoveVesselNorth(t *testing.T) {
	v := VesselPos{Name: "Test", Lat: 50.0, Lon: -5.0, SOG: 6.0, COG: 0}
	updated := MoveVessel(v, 60.0)

	if updated.Lat <= v.Lat {
		t.Error("moving north, latitude should increase")
	}
}

func TestMoveVesselStationary(t *testing.T) {
	v := VesselPos{Name: "Test", Lat: 50.0, Lon: -5.0, SOG: 0, COG: 90}
	updated := MoveVessel(v, 10.0)

	if updated.Lat != v.Lat || updated.Lon != v.Lon {
		t.Error("stationary vessel should not move")
	}
}
