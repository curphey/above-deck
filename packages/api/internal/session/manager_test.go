package session_test

import (
	"testing"

	"github.com/curphey/above-deck/api/internal/session"
)

func TestCreateSession(t *testing.T) {
	mgr := session.NewManager()
	s := mgr.Create("uk-south", "SV Artemis", "Sailing yacht")

	if s.ID == "" {
		t.Error("session ID is empty")
	}
	if s.Region != "uk-south" {
		t.Errorf("expected uk-south, got %s", s.Region)
	}
	if len(s.Messages) != 0 {
		t.Error("new session should have no messages")
	}
}

func TestAddMessage(t *testing.T) {
	mgr := session.NewManager()
	s := mgr.Create("uk-south", "SV Artemis", "Sailing yacht")

	mgr.AddMessage(s.ID, "user", "Falmouth Coastguard, this is SV Artemis, radio check, over")
	mgr.AddMessage(s.ID, "assistant", "SV Artemis, this is Falmouth Coastguard, reading you loud and clear, over")

	updated, _ := mgr.Get(s.ID)
	if len(updated.Messages) != 2 {
		t.Errorf("expected 2 messages, got %d", len(updated.Messages))
	}
}

func TestSlidingWindow(t *testing.T) {
	mgr := session.NewManager()
	s := mgr.Create("uk-south", "SV Artemis", "Sailing yacht")

	for i := 0; i < 22; i++ {
		role := "user"
		if i%2 == 1 {
			role = "assistant"
		}
		mgr.AddMessage(s.ID, role, "test message")
	}

	updated, _ := mgr.Get(s.ID)
	if len(updated.Messages) > 20 {
		t.Errorf("expected max 20 messages after sliding window, got %d", len(updated.Messages))
	}
	if len(updated.Messages) < 18 {
		t.Errorf("expected at least 18 messages retained, got %d", len(updated.Messages))
	}
}

func TestSetScenario(t *testing.T) {
	mgr := session.NewManager()
	s := mgr.Create("uk-south", "SV Artemis", "Sailing yacht")

	ok := mgr.SetScenario(s.ID, "mayday")
	if !ok {
		t.Error("expected SetScenario to succeed")
	}

	updated, _ := mgr.Get(s.ID)
	if updated.ScenarioID != "mayday" {
		t.Errorf("expected mayday, got %s", updated.ScenarioID)
	}
}

func TestGetNonexistent(t *testing.T) {
	mgr := session.NewManager()
	_, ok := mgr.Get("nonexistent")
	if ok {
		t.Error("expected false for nonexistent session")
	}
}
