package agent

import (
	"context"
	"encoding/json"

	"github.com/curphey/above-deck/api/internal/llm"
)

// LLMClient is the interface for sending messages to Claude.
type LLMClient interface {
	SendMessage(ctx context.Context, apiKey, systemPrompt string, messages []llm.Message) (*llm.VHFResponse, error)
}

// ToolAwareLLMClient extends LLMClient with tool_use support.
type ToolAwareLLMClient interface {
	LLMClient
	SendMessageWithTools(ctx context.Context, apiKey, systemPrompt string, messages []llm.Message, tools []llm.ToolDef, executor llm.ToolExecutor) (*llm.VHFResponse, error)
}

// ToolExecutorInterface abstracts the tool executor for dependency injection.
type ToolExecutorInterface interface {
	Run(name string, input json.RawMessage) (string, error)
	DefinitionsForLLM(names []string) []llm.ToolDef
}

// Dispatcher routes radio transmissions to the correct agent.
type Dispatcher struct {
	registry     *Registry
	resolver     *Resolver
	client       LLMClient
	toolExecutor ToolExecutorInterface
	worlds       map[string]*WorldState // keyed by session/region
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

// SetToolExecutor configures the tool executor for agents that have tools.
func (d *Dispatcher) SetToolExecutor(exec ToolExecutorInterface) {
	d.toolExecutor = exec
}

func (d *Dispatcher) Dispatch(ctx context.Context, apiKey, message, regionID, vesselName, vesselType string, scenario *ScenarioContext) (*llm.VHFResponse, error) {
	agent := d.resolver.Resolve(message)
	world := d.GetOrCreateWorld(regionID)
	world.AddRadioMessage(vesselName, message, 16, "tx")
	systemPrompt := BuildAgentSystemPrompt(agent, world, scenario, "", vesselName, vesselType)
	messages := d.buildMessages(world, vesselName)

	// If agent has tools and we have a tool-aware client + executor, use tool_use path
	if len(agent.Tools) > 0 && d.toolExecutor != nil {
		if toolClient, ok := d.client.(ToolAwareLLMClient); ok {
			toolDefs := d.toolExecutor.DefinitionsForLLM(agent.Tools)
			if len(toolDefs) > 0 {
				resp, err := toolClient.SendMessageWithTools(ctx, apiKey, systemPrompt, messages, toolDefs, d.toolExecutor.Run)
				if err != nil {
					return nil, err
				}
				world.AddRadioMessage(agent.Name, resp.Response.Message, resp.Response.Channel, "rx")
				return resp, nil
			}
		}
	}

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
