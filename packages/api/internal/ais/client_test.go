package ais_test

import (
	"context"
	"testing"

	"github.com/curphey/above-deck/api/internal/ais"
)

func TestVesselTypeName(t *testing.T) {
	tests := []struct {
		code int
		want string
	}{
		{36, "Sailing"},
		{70, "Cargo"},
		{99, "Vessel"},
	}
	for _, tt := range tests {
		got := ais.VesselTypeName(tt.code)
		if got != tt.want {
			t.Errorf("VesselTypeName(%d) = %q, want %q", tt.code, got, tt.want)
		}
	}
}

func TestBoundingBox(t *testing.T) {
	bb := ais.BoundingBox{MinLat: 49.5, MaxLat: 50.5, MinLon: -6.0, MaxLon: -4.0}
	if bb.MinLat >= bb.MaxLat || bb.MinLon >= bb.MaxLon {
		t.Error("invalid bounding box")
	}
}

func TestNewClient(t *testing.T) {
	c := ais.NewClient("test-key")
	if c.APIKey != "test-key" {
		t.Error("expected API key to be set")
	}
}

func TestFetchVessels_Stub(t *testing.T) {
	c := ais.NewClient("test-key")
	vessels, err := c.FetchVessels(context.Background(), ais.BoundingBox{}, 10)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if vessels == nil {
		t.Error("expected non-nil slice")
	}
}
