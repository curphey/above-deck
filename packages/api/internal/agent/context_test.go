package agent

import (
	"strings"
	"testing"
)

func TestBuildAgentSystemPrompt(t *testing.T) {
	ag := RadioAgent{
		ID: "solent-cg", Name: "Solent Coastguard", CallSign: "SOLENT COASTGUARD",
		AgentType: "coastguard",
		SystemPrompt: "You are a duty watchkeeper at Solent Coastguard.",
		Tools: []string{"get_weather", "get_time"},
	}
	world := &WorldState{
		RegionName: "UK South Coast", CurrentTime: "12:00 UTC",
		Weather: WeatherState{WindSpeedKnots: 15, WindDirection: 220, SeaState: "moderate", Visibility: "good"},
	}
	prompt := BuildAgentSystemPrompt(ag, world, nil, "", "SV Artemis", "sailing-yacht")

	if !strings.Contains(prompt, "Solent Coastguard") { t.Error("expected agent name") }
	if !strings.Contains(prompt, "duty watchkeeper") { t.Error("expected personality") }
	if !strings.Contains(prompt, "UK South Coast") { t.Error("expected region") }
	if !strings.Contains(prompt, "15") { t.Error("expected wind speed") }
	if !strings.Contains(prompt, "SV Artemis") { t.Error("expected user vessel") }
}

func TestBuildAgentSystemPromptWithScenario(t *testing.T) {
	ag := RadioAgent{ID: "solent-cg", Name: "Solent Coastguard", AgentType: "coastguard", SystemPrompt: "Coastguard."}
	world := &WorldState{RegionName: "UK South Coast", CurrentTime: "12:00 UTC"}
	scenario := &ScenarioContext{Name: "Radio Check", Briefing: "User requests radio check", Instructions: "Respond with signal report"}
	prompt := BuildAgentSystemPrompt(ag, world, scenario, "", "SV Artemis", "sailing-yacht")

	if !strings.Contains(prompt, "Radio Check") { t.Error("expected scenario name") }
	if !strings.Contains(prompt, "signal report") { t.Error("expected instructions") }
}

func TestBuildAgentSystemPromptWithVesselSpec(t *testing.T) {
	ag := RadioAgent{
		ID: "doris", Name: "Doris May", AgentType: "vessel", SystemPrompt: "Retired couple.",
		VesselSpec: &VesselSpec{Type: "sailing", Length: "12m", Flag: "UK", MMSI: "235001234", Rig: "sloop"},
	}
	world := &WorldState{RegionName: "UK South Coast", CurrentTime: "12:00 UTC"}
	prompt := BuildAgentSystemPrompt(ag, world, nil, "", "SV Artemis", "sailing-yacht")

	if !strings.Contains(prompt, "12m") { t.Error("expected vessel length") }
	if !strings.Contains(prompt, "sloop") { t.Error("expected rig type") }
}

func TestBuildAgentSystemPromptWithKnowledge(t *testing.T) {
	ag := RadioAgent{ID: "solent-cg", Name: "Solent CG", AgentType: "coastguard", SystemPrompt: "CG."}
	world := &WorldState{RegionName: "UK South Coast", CurrentTime: "12:00 UTC"}
	knowledge := "## COLREGS\nRule 5: Every vessel shall maintain a proper lookout."
	prompt := BuildAgentSystemPrompt(ag, world, nil, knowledge, "SV Artemis", "sailing-yacht")

	if !strings.Contains(prompt, "COLREGS") { t.Error("expected knowledge docs") }
	if !strings.Contains(prompt, "Rule 5") { t.Error("expected rule content") }
}
