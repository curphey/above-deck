package llm_test

import (
	"strings"
	"testing"

	"github.com/curphey/above-deck/api/internal/radio"
)

func TestBuildSystemPrompt_FreePractice(t *testing.T) {
	region, ok := radio.GetRegion("uk-south")
	if !ok {
		t.Fatal("test fixture 'uk-south' region not found")
	}
	prompt := radio.BuildSystemPrompt(region, nil, "SV Artemis", "Sailing yacht")

	if !strings.Contains(prompt, "VHF radio environment simulator") {
		t.Error("missing role definition")
	}
	if !strings.Contains(prompt, "Falmouth Coastguard") {
		t.Error("missing region coastguard")
	}
	if !strings.Contains(prompt, "SV Artemis") {
		t.Error("missing user vessel name")
	}
	if !strings.Contains(prompt, "MAYDAY") {
		t.Error("missing VHF procedures")
	}
}

func TestBuildSystemPrompt_WithScenario(t *testing.T) {
	region, ok := radio.GetRegion("uk-south")
	if !ok {
		t.Fatal("test fixture 'uk-south' region not found")
	}
	scenario, ok := radio.GetScenario("mayday")
	if !ok {
		t.Fatal("test fixture 'mayday' scenario not found")
	}
	prompt := radio.BuildSystemPrompt(region, &scenario, "SV Artemis", "Sailing yacht")

	if !strings.Contains(prompt, scenario.LLMInstructions) {
		t.Error("missing scenario LLM instructions")
	}
}

func TestBuildSystemPrompt_ResponseFormat(t *testing.T) {
	region, ok := radio.GetRegion("uk-south")
	if !ok {
		t.Fatal("test fixture 'uk-south' region not found")
	}
	prompt := radio.BuildSystemPrompt(region, nil, "SV Artemis", "Sailing yacht")

	if !strings.Contains(prompt, "\"response\"") {
		t.Error("missing response JSON schema")
	}
	if !strings.Contains(prompt, "\"feedback\"") {
		t.Error("missing feedback JSON schema")
	}
}
