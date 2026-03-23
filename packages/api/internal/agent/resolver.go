package agent

import "strings"

// priorityPhrases are messages that should always route to the default
// coastguard agent regardless of any callsign mentioned.
var priorityPhrases = []string{
	"mayday",
	"pan pan",
	"securite",
	"sécurité",
	"all stations",
}

// Resolver identifies which RadioAgent is the target of a radio message.
type Resolver struct {
	registry *Registry
}

// NewResolver creates a Resolver backed by the given Registry.
func NewResolver(registry *Registry) *Resolver {
	return &Resolver{registry: registry}
}

// Resolve determines which agent the message is addressed to.
//
// Strategy:
//  1. If the message contains a priority phrase (MAYDAY, PAN PAN, ALL
//     STATIONS, SECURITÉ) return the default coastguard agent immediately.
//  2. Attempt an exact callsign match against each registered agent using
//     text extracted before "THIS IS" (the addressed party).
//  3. Attempt a fuzzy name match on the same pre-"THIS IS" text.
//  4. Fall back to the default coastguard agent.
func (r *Resolver) Resolve(message string) RadioAgent {
	upper := strings.ToUpper(message)

	// 1. Priority phrases → default coastguard.
	for _, phrase := range priorityPhrases {
		if strings.Contains(upper, strings.ToUpper(phrase)) {
			return r.registry.DefaultAgent()
		}
	}

	// Extract the addressee portion: everything before "THIS IS".
	addresseePart := upper
	if idx := strings.Index(upper, "THIS IS"); idx != -1 {
		addresseePart = upper[:idx]
	}

	// Strip common punctuation so "SOLENT COASTGUARD," matches "SOLENT COASTGUARD".
	addresseePart = strings.NewReplacer(",", " ", ".", " ").Replace(addresseePart)

	// 2. Exact callsign match within addressee portion.
	for _, a := range r.registry.All() {
		cs := strings.ToUpper(a.CallSign)
		if strings.Contains(addresseePart, cs) {
			return a
		}
	}

	// 3. Fuzzy name match within addressee portion.
	for _, a := range r.registry.All() {
		name := strings.ToUpper(a.Name)
		if strings.Contains(addresseePart, name) {
			return a
		}
		// Also try individual significant words from the name (≥4 chars).
		for _, word := range strings.Fields(name) {
			if len(word) >= 4 && strings.Contains(addresseePart, word) {
				return a
			}
		}
	}

	// 4. Default coastguard.
	return r.registry.DefaultAgent()
}
