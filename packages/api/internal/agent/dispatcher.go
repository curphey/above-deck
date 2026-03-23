package agent

import (
	"context"

	"github.com/curphey/above-deck/api/internal/llm"
)

// LLMClient is the interface for sending messages to Claude.
type LLMClient interface {
	SendMessage(ctx context.Context, apiKey, systemPrompt string, messages []llm.Message) (*llm.VHFResponse, error)
}

// Dispatcher routes radio transmissions to the correct agent.
type Dispatcher struct {
	registry *Registry
	resolver *Resolver
	client   LLMClient
	worlds   map[string]*WorldState // keyed by session/region
}

func NewDispatcher(agents []RadioAgent, client LLMClient) *Dispatcher {
	reg := NewRegistry(agents)
	return &Dispatcher{
		registry: reg,
		resolver: NewResolver(reg),
		client:   client,
		worlds:   make(map[string]*WorldState),
	}
}

func (d *Dispatcher) Dispatch(ctx context.Context, apiKey, message, regionID, vesselName, vesselType string, scenario *ScenarioContext) (*llm.VHFResponse, error) {
	agent := d.resolver.Resolve(message)
	world := d.GetOrCreateWorld(regionID)
	world.AddRadioMessage(vesselName, message, 16, "tx")
	systemPrompt := BuildAgentSystemPrompt(agent, world, scenario, "", vesselName, vesselType)
	messages := d.buildMessages(world, vesselName)
	resp, err := d.client.SendMessage(ctx, apiKey, systemPrompt, messages)
	if err != nil {
		return nil, err
	}
	world.AddRadioMessage(agent.Name, resp.Response.Message, resp.Response.Channel, "rx")
	return resp, nil
}

func (d *Dispatcher) GetOrCreateWorld(regionID string) *WorldState {
	if w, ok := d.worlds[regionID]; ok {
		return w
	}
	w := NewWorldState(regionID, regionID)
	d.worlds[regionID] = w
	return w
}

func (d *Dispatcher) buildMessages(world *WorldState, userName string) []llm.Message {
	messages := make([]llm.Message, 0, len(world.RadioHistory))
	for _, rm := range world.RadioHistory {
		role := "assistant"
		if rm.Station == userName {
			role = "user"
		}
		messages = append(messages, llm.Message{Role: role, Content: rm.Message})
	}
	return messages
}
