package radio_test

import (
	"testing"

	"github.com/curphey/above-deck/api/internal/radio"
)

func TestGetRegion(t *testing.T) {
	r, ok := radio.GetRegion("uk-south")
	if !ok {
		t.Fatal("uk-south region not found")
	}
	if r.Name == "" {
		t.Error("region name is empty")
	}
	if len(r.Vessels) < 4 {
		t.Errorf("expected at least 4 vessels, got %d", len(r.Vessels))
	}
	if len(r.Coastguard) == 0 {
		t.Error("expected at least one coastguard station")
	}
}

func TestAllRegionsValid(t *testing.T) {
	regions := radio.AllRegions()
	if len(regions) < 2 {
		t.Errorf("expected at least 2 regions, got %d", len(regions))
	}
	for _, r := range regions {
		if r.ID == "" || r.Name == "" {
			t.Errorf("region has empty ID or name")
		}
		for _, v := range r.Vessels {
			if v.Name == "" || v.CallSign == "" {
				t.Errorf("vessel in region %s has empty name or callsign", r.ID)
			}
		}
	}
}

func TestAllRegionsCount(t *testing.T) {
	regions := radio.AllRegions()
	if len(regions) != 6 {
		t.Errorf("expected 6 regions, got %d", len(regions))
	}
}

func TestGetRegionMedGreece(t *testing.T) {
	r, ok := radio.GetRegion("med-greece")
	if !ok {
		t.Fatal("med-greece not found")
	}
	if len(r.Coastguard) == 0 {
		t.Error("no coastguard stations")
	}
	if len(r.Vessels) < 5 {
		t.Errorf("expected at least 5 vessels, got %d", len(r.Vessels))
	}
	if len(r.Marinas) == 0 {
		t.Error("no marinas")
	}
}

func TestGetRegionSEAsia(t *testing.T) {
	r, ok := radio.GetRegion("se-asia")
	if !ok {
		t.Fatal("se-asia not found")
	}
	if len(r.Vessels) < 5 {
		t.Errorf("expected at least 5 vessels, got %d", len(r.Vessels))
	}
}

func TestGetRegionPacific(t *testing.T) {
	r, ok := radio.GetRegion("pacific")
	if !ok {
		t.Fatal("pacific not found")
	}
	if len(r.Vessels) < 5 {
		t.Errorf("expected at least 5 vessels, got %d", len(r.Vessels))
	}
}

func TestGetRegionAtlantic(t *testing.T) {
	r, ok := radio.GetRegion("atlantic")
	if !ok {
		t.Fatal("atlantic not found")
	}
	if len(r.Vessels) < 5 {
		t.Errorf("expected at least 5 vessels, got %d", len(r.Vessels))
	}
}
