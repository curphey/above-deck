package agent

import "testing"

func TestRegistryFindByCallSign(t *testing.T) {
	agents := []RadioAgent{
		{ID: "solent-cg", Name: "Solent Coastguard", CallSign: "SOLENT COASTGUARD", AgentType: "coastguard"},
		{ID: "doris-may", Name: "Doris May", CallSign: "MDMX9", AgentType: "vessel"},
	}
	reg := NewRegistry(agents)
	agent, ok := reg.FindByCallSign("SOLENT COASTGUARD")
	if !ok {
		t.Fatal("expected to find agent")
	}
	if agent.ID != "solent-cg" {
		t.Errorf("expected solent-cg, got %s", agent.ID)
	}
}

func TestRegistryFindByCallSignCaseInsensitive(t *testing.T) {
	reg := NewRegistry([]RadioAgent{{ID: "solent-cg", CallSign: "SOLENT COASTGUARD", AgentType: "coastguard"}})
	_, ok := reg.FindByCallSign("solent coastguard")
	if !ok {
		t.Fatal("expected case-insensitive match")
	}
}

func TestRegistryFindByNameFuzzy(t *testing.T) {
	agents := []RadioAgent{
		{ID: "solent-cg", Name: "Solent Coastguard", CallSign: "SOLENT COASTGUARD", AgentType: "coastguard"},
		{ID: "doris-may", Name: "Doris May", CallSign: "MDMX9", AgentType: "vessel"},
	}
	reg := NewRegistry(agents)
	agent, ok := reg.FindByNameFuzzy("coastguard")
	if !ok {
		t.Fatal("expected match")
	}
	if agent.ID != "solent-cg" {
		t.Errorf("expected solent-cg, got %s", agent.ID)
	}
}

func TestRegistryDefaultAgent(t *testing.T) {
	agents := []RadioAgent{
		{ID: "doris-may", Name: "Doris May", AgentType: "vessel"},
		{ID: "solent-cg", Name: "Solent Coastguard", AgentType: "coastguard"},
	}
	reg := NewRegistry(agents)
	agent := reg.DefaultAgent()
	if agent.AgentType != "coastguard" {
		t.Errorf("expected coastguard default, got %s", agent.AgentType)
	}
}

func TestRegistryFindByNameFuzzyNoMatch(t *testing.T) {
	reg := NewRegistry([]RadioAgent{{ID: "solent-cg", Name: "Solent Coastguard", AgentType: "coastguard"}})
	_, ok := reg.FindByNameFuzzy("nonexistent")
	if ok {
		t.Fatal("expected no match")
	}
}
