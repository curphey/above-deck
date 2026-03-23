package agent

import "strings"

// Registry holds a collection of RadioAgents and provides lookup methods.
type Registry struct {
	agents []RadioAgent
}

// NewRegistry creates a new Registry from the provided slice of agents.
func NewRegistry(agents []RadioAgent) *Registry {
	return &Registry{agents: agents}
}

// FindByCallSign performs a case-insensitive exact match on CallSign.
func (r *Registry) FindByCallSign(callSign string) (RadioAgent, bool) {
	needle := strings.ToUpper(callSign)
	for _, a := range r.agents {
		if strings.ToUpper(a.CallSign) == needle {
			return a, true
		}
	}
	return RadioAgent{}, false
}

// FindByNameFuzzy returns the first agent whose Name or CallSign contains
// the query string (case-insensitive).
func (r *Registry) FindByNameFuzzy(query string) (RadioAgent, bool) {
	needle := strings.ToLower(query)
	for _, a := range r.agents {
		if strings.Contains(strings.ToLower(a.Name), needle) ||
			strings.Contains(strings.ToLower(a.CallSign), needle) {
			return a, true
		}
	}
	return RadioAgent{}, false
}

// DefaultAgent returns the first coastguard agent, or the first agent if none
// with type "coastguard" exists. Panics if the registry is empty.
func (r *Registry) DefaultAgent() RadioAgent {
	for _, a := range r.agents {
		if a.AgentType == "coastguard" {
			return a
		}
	}
	return r.agents[0]
}

// All returns every agent in the registry.
func (r *Registry) All() []RadioAgent {
	return r.agents
}
