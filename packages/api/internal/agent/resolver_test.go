package agent

import "testing"

func TestResolveCallTarget(t *testing.T) {
	agents := []RadioAgent{
		{ID: "solent-cg", Name: "Solent Coastguard", CallSign: "SOLENT COASTGUARD", AgentType: "coastguard"},
		{ID: "doris-may", Name: "Doris May", CallSign: "MDMX9", AgentType: "vessel"},
		{ID: "falmouth-cg", Name: "Falmouth Coastguard", CallSign: "FALMOUTH COASTGUARD", AgentType: "coastguard"},
	}
	reg := NewRegistry(agents)
	resolver := NewResolver(reg)

	tests := []struct {
		message  string
		expected string
	}{
		{"Solent Coastguard, Solent Coastguard, this is Artemis", "solent-cg"},
		{"SOLENT COASTGUARD this is sailing vessel Artemis over", "solent-cg"},
		{"Doris May, Doris May, this is Artemis, over", "doris-may"},
		{"Falmouth Coastguard this is Artemis requesting radio check", "falmouth-cg"},
		{"All stations, all stations, this is Artemis", "solent-cg"},
		{"Mayday mayday mayday this is Artemis", "solent-cg"},
		{"Hello can anyone hear me", "solent-cg"},
	}

	for _, tt := range tests {
		t.Run(tt.message, func(t *testing.T) {
			agent := resolver.Resolve(tt.message)
			if agent.ID != tt.expected {
				t.Errorf("message %q: expected %s, got %s", tt.message, tt.expected, agent.ID)
			}
		})
	}
}
