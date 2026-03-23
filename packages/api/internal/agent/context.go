package agent

import (
	"fmt"
	"strings"
)

type ScenarioContext struct {
	Name         string
	Briefing     string
	Instructions string
	Completion   string
}

// BuildAgentSystemPrompt assembles the full system prompt for an agent call.
// knowledgeContent is pre-loaded knowledge docs as a string (empty if none).
func BuildAgentSystemPrompt(agent RadioAgent, world *WorldState, scenario *ScenarioContext, knowledgeContent, userVessel, userVesselType string) string {
	var sb strings.Builder

	// 1. Agent identity
	sb.WriteString(fmt.Sprintf("You are %s (callsign: %s). You are a %s.\n\n", agent.Name, agent.CallSign, agent.AgentType))
	sb.WriteString(fmt.Sprintf("## Your Character\n\n%s\n\n", agent.SystemPrompt))

	// 2. Vessel spec
	if agent.VesselSpec != nil {
		sb.WriteString("## Your Vessel\n\n")
		sb.WriteString(fmt.Sprintf("Type: %s, Length: %s, Flag: %s, MMSI: %s\n", agent.VesselSpec.Type, agent.VesselSpec.Length, agent.VesselSpec.Flag, agent.VesselSpec.MMSI))
		if agent.VesselSpec.Rig != "" {
			sb.WriteString(fmt.Sprintf("Rig: %s\n", agent.VesselSpec.Rig))
		}
		if agent.VesselSpec.Engine != "" {
			sb.WriteString(fmt.Sprintf("Engine: %s\n", agent.VesselSpec.Engine))
		}
		sb.WriteString("\n")
	}

	// 3. VHF procedures
	sb.WriteString("## VHF Radio Procedures\n\nFollow ITU Radio Regulations and GMDSS procedures. Use correct prowords (OVER, OUT, ROGER, etc). Use phonetic alphabet for spelling. Channel 16 is distress/safety/calling. Distress priority: MAYDAY > PAN PAN > SECURITÉ > routine.\n\n")

	// 4. Knowledge docs
	if knowledgeContent != "" {
		sb.WriteString("## Reference Material\n\n")
		sb.WriteString(knowledgeContent)
		sb.WriteString("\n\n")
	}

	// 5. World state
	if world != nil {
		sb.WriteString(fmt.Sprintf("## Current Situation\n\nRegion: %s\nTime: %s\n", world.RegionName, world.CurrentTime))
		sb.WriteString(fmt.Sprintf("Weather: Wind %g knots from %d°, sea state %s, visibility %s\n", world.Weather.WindSpeedKnots, world.Weather.WindDirection, world.Weather.SeaState, world.Weather.Visibility))
		if world.Weather.Forecast != "" {
			sb.WriteString(fmt.Sprintf("Forecast: %s\n", world.Weather.Forecast))
		}
		sb.WriteString("\n")
	}

	// 6. User's vessel
	sb.WriteString(fmt.Sprintf("## The Vessel Calling You\n\nName: %s\nType: %s\n\n", userVessel, userVesselType))

	// 7. Scenario
	if scenario != nil {
		sb.WriteString(fmt.Sprintf("## Active Scenario: %s\n\n", scenario.Name))
		sb.WriteString(fmt.Sprintf("Briefing: %s\n\n", scenario.Briefing))
		sb.WriteString(fmt.Sprintf("Instructions: %s\n\n", scenario.Instructions))
		if scenario.Completion != "" {
			sb.WriteString(fmt.Sprintf("Completion criteria: %s\n\n", scenario.Completion))
		}
	}

	// 8. Response format
	sb.WriteString("## Response Format\n\nAlways respond with valid JSON only — no markdown fences, no explanation, just the JSON object:\n")
	sb.WriteString(`{"response":{"station":"your callsign","message":"your radio dialogue","channel":16},"feedback":{"correct":["things user did right"],"errors":["protocol mistakes"],"protocol_note":"what should happen next"},"scenario":{"state":"current step","next_expected":"what user should do","complete":false,"score":null}}`)
	sb.WriteString("\n")

	return sb.String()
}
