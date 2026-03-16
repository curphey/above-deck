package radio_test

import (
	"testing"

	"github.com/curphey/above-deck/api/internal/radio"
)

func TestGetScenario(t *testing.T) {
	s, ok := radio.GetScenario("mayday")
	if !ok {
		t.Fatal("mayday scenario not found")
	}
	if s.Name == "" || s.Briefing == "" {
		t.Error("scenario has empty name or briefing")
	}
	if len(s.ExpectedProcedure) == 0 {
		t.Error("expected procedure steps")
	}
}

func TestAllScenariosComplete(t *testing.T) {
	scenarios := radio.AllScenarios()
	if len(scenarios) < 10 {
		t.Errorf("expected at least 10 scenarios, got %d", len(scenarios))
	}
	for _, s := range scenarios {
		if s.ID == "" || s.Name == "" || s.Briefing == "" {
			t.Errorf("scenario %s has empty required field", s.ID)
		}
		if s.LLMInstructions == "" {
			t.Errorf("scenario %s has no LLM instructions", s.ID)
		}
	}
}
