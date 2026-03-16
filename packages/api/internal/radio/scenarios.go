package radio

type Scenario struct {
	ID                 string   `json:"id"`
	Name               string   `json:"name"`
	Description        string   `json:"description"`
	Briefing           string   `json:"briefing"`
	ExpectedProcedure  []string `json:"expected_procedure"`
	LLMInstructions    string   `json:"llm_instructions"`
	CompletionCriteria string   `json:"completion_criteria"`
}

var scenarios = map[string]Scenario{
	"radio-check": {
		ID: "radio-check", Name: "Radio Check",
		Description: "Request a signal report from the coastguard on Channel 16",
		Briefing: "You are aboard SV Artemis, moored in Falmouth harbour. You want to confirm your VHF radio is working before departing. Contact Falmouth Coastguard on Channel 16 for a radio check.",
		ExpectedProcedure: []string{"Switch to Channel 16", "Press PTT and say: 'Falmouth Coastguard, Falmouth Coastguard, Falmouth Coastguard, this is Sailing Vessel Artemis, Sailing Vessel Artemis, Sailing Vessel Artemis, radio check on Channel 16, over'", "Release PTT and wait for response", "Acknowledge the signal report: 'Falmouth Coastguard, this is Sailing Vessel Artemis, thank you, out'"},
		LLMInstructions: "You are Falmouth Coastguard. The user is requesting a radio check. Respond with: 'Sailing Vessel Artemis, this is Falmouth Coastguard, reading you loud and clear, over.' If the user's call format is incorrect, still respond but note the errors in the feedback. Wait for the user to acknowledge before marking complete.",
		CompletionCriteria: "User correctly initiates the radio check with proper call format (station called x3, own vessel x3, request, over) AND acknowledges the response with 'out'.",
	},
	"pan-pan": {
		ID: "pan-pan", Name: "Pan-Pan",
		Description: "Declare an urgency situation — engine failure in a shipping lane",
		Briefing: "You are aboard SV Artemis, position 50°04'N 005°03'W, in the Falmouth approach channel. Your engine has failed and you are drifting towards the shipping lane. You have 3 persons on board. Declare a Pan-Pan urgency on Channel 16.",
		ExpectedProcedure: []string{"Switch to Channel 16", "Press PTT: 'PAN PAN, PAN PAN, PAN PAN, all stations, all stations, all stations, this is Sailing Vessel Artemis, Sailing Vessel Artemis, Sailing Vessel Artemis'", "Continue: 'My position is 50 degrees 04 minutes North, 005 degrees 03 minutes West'", "Continue: 'Engine failure, drifting towards shipping lane, require tow assistance'", "Continue: '3 persons on board, sailing yacht, 12 metres, white hull, over'", "Wait for coastguard acknowledgement", "Provide updates as requested"},
		LLMInstructions: "You are Falmouth Coastguard. The user is declaring a Pan-Pan urgency. Acknowledge with correct format. Then ask the user for additional details or updates.",
		CompletionCriteria: "User correctly declares Pan-Pan with proper format (PAN PAN x3, addressing, vessel name x3, position, nature of urgency, assistance required, persons aboard, vessel description, over) AND responds to coastguard follow-up.",
	},
	"mayday": {
		ID: "mayday", Name: "Mayday",
		Description: "Full distress call — taking on water",
		Briefing: "You are aboard SV Artemis, position 50°10'N 005°15'W, approximately 5 nautical miles southwest of the Lizard. Your vessel has struck a submerged object and is taking on water rapidly. The bilge pump cannot keep up. You have 4 persons on board. Issue a Mayday distress call on Channel 16.",
		ExpectedProcedure: []string{"Switch to Channel 16", "Press PTT: 'MAYDAY, MAYDAY, MAYDAY, this is Sailing Vessel Artemis, Sailing Vessel Artemis, Sailing Vessel Artemis, call sign MART, MMSI 235 099 000'", "Continue: 'MAYDAY, Sailing Vessel Artemis, call sign MART'", "Continue: 'My position is 50 degrees 10 minutes North, 005 degrees 15 minutes West'", "Continue: 'I require immediate assistance — struck submerged object, taking on water'", "Continue: '4 persons on board, sailing yacht, 12 metres, white hull, over'", "Wait for coastguard acknowledgement", "Respond to coastguard instructions"},
		LLMInstructions: "You are Falmouth Coastguard. The user is issuing a Mayday distress call. Acknowledge with the correct format. Coordinate the response — ask about rate of water ingress, whether crew are wearing lifejackets, and whether they have a liferaft.",
		CompletionCriteria: "User correctly issues Mayday with proper format (MAYDAY x3, vessel name x3 + call sign + MMSI stated once, MAYDAY + vessel + call sign, position, nature of distress, 'I require immediate assistance', persons, vessel description, OVER) AND responds to coastguard instructions.",
	},
	"mayday-relay": {
		ID: "mayday-relay", Name: "Mayday Relay",
		Description: "Hear another vessel's distress and relay it to the coastguard",
		Briefing: "You are aboard SV Artemis, position 50°08'N 005°20'W. You hear a weak Mayday from Fishing Vessel Ocean Star, position 50°12'N 005°25'W, reporting they are sinking after a collision. The coastguard has not acknowledged. Relay the Mayday.",
		ExpectedProcedure: []string{"Confirm Channel 16", "Wait to see if coastguard acknowledges (they don't)", "Press PTT: 'MAYDAY RELAY, MAYDAY RELAY, MAYDAY RELAY, all stations, all stations, all stations, this is Sailing Vessel Artemis, Sailing Vessel Artemis, Sailing Vessel Artemis'", "Relay the distress information you heard", "Add your own position and that you are standing by to assist", "Wait for coastguard response"},
		LLMInstructions: "Start by playing Fishing Vessel Ocean Star making a weak, partially garbled Mayday. Then be silent (no coastguard response). The user should relay the Mayday. When they do, respond as Falmouth Coastguard acknowledging the relay.",
		CompletionCriteria: "User correctly relays the Mayday using MAYDAY RELAY format (MAYDAY RELAY x3, addressing, own vessel x3, relayed distress information, own position) AND waits appropriately before relaying.",
	},
	"responding-to-mayday": {
		ID: "responding-to-mayday", Name: "Responding to a Mayday",
		Description: "Hear a Mayday from another vessel and acknowledge correctly",
		Briefing: "You are aboard SV Artemis, position 50°08'N 005°10'W. You hear a Mayday from Motor Vessel Blue Horizon, position 50°09'N 005°12'W, reporting a fire on board with 6 persons. The coastguard has not yet responded. Acknowledge the Mayday and offer assistance.",
		ExpectedProcedure: []string{"Listen to the Mayday on Channel 16", "Wait briefly for coastguard to acknowledge (they don't)", "Press PTT: 'MAYDAY, Motor Vessel Blue Horizon, this is Sailing Vessel Artemis, received MAYDAY'", "Provide your position and ETA to their location", "Offer assistance and stand by for instructions"},
		LLMInstructions: "Start by playing Motor Vessel Blue Horizon issuing a Mayday: fire in engine room, 6 POB. Then be silent. The user should acknowledge. After the user acknowledges, respond as Falmouth Coastguard arriving on frequency and taking control.",
		CompletionCriteria: "User correctly acknowledges the Mayday using proper format (MAYDAY + distressed vessel name, own vessel name, received MAYDAY) AND provides own position AND offers assistance.",
	},
	"securite": {
		ID: "securite", Name: "Securité",
		Description: "Broadcast a navigational safety warning",
		Briefing: "You are aboard SV Artemis, position 50°09'N 005°05'W. You have spotted a large shipping container floating partially submerged, approximately 200 metres ahead of your position, directly in the main shipping channel. Broadcast a Securité navigational warning on Channel 16.",
		ExpectedProcedure: []string{"Switch to Channel 16", "Press PTT: 'SECURITÉ, SECURITÉ, SECURITÉ, all stations, all stations, all stations, this is Sailing Vessel Artemis, Sailing Vessel Artemis, Sailing Vessel Artemis'", "Describe the hazard with position", "End with 'out'"},
		LLMInstructions: "Respond as Falmouth Coastguard acknowledging the report. Then as another vessel, thank them for the warning.",
		CompletionCriteria: "User correctly broadcasts Securité with proper format (SECURITÉ x3, all stations x3, own vessel x3, nature of hazard, position, OUT).",
	},
	"routine-call": {
		ID: "routine-call", Name: "Routine Call",
		Description: "Contact a marina to request a berth",
		Briefing: "You are aboard SV Artemis, approaching Falmouth harbour. You want to contact Falmouth Marina on Channel 16 to request a visitor berth for tonight. Falmouth Marina works on Channel 80.",
		ExpectedProcedure: []string{"Switch to Channel 16", "Press PTT: 'Falmouth Marina, Falmouth Marina, this is Sailing Vessel Artemis, Sailing Vessel Artemis, over'", "Wait for response", "Request to switch to working channel", "Switch to Channel 80", "Conduct berthing conversation on Channel 80"},
		LLMInstructions: "You are Falmouth Marina. Respond on Ch16, agree to Ch80. On Ch80 ask about vessel size, draught, arrival time, and number of nights. Assign berth D-14.",
		CompletionCriteria: "User correctly initiates contact on Channel 16, agrees working channel, switches to Channel 80, and conducts the berthing conversation with proper radio etiquette throughout.",
	},
	"dsc-distress": {
		ID: "dsc-distress", Name: "DSC Distress Alert",
		Description: "Send a DSC distress alert via the CALL button, then follow up with voice Mayday on CH16",
		Briefing: "You are aboard SV Artemis, MMSI 235099000, position 50°10'N 005°15'W. Your vessel has struck a submerged object and is taking on water. Use the DSC CALL button to send a distress alert, then follow up with a voice Mayday on Channel 16.",
		ExpectedProcedure: []string{"Press CALL button to open DSC panel", "Select 'Distress' alert type", "Select nature of distress: 'Flooding'", "Confirm position is correct", "Press and hold Send (5 seconds) to transmit distress alert", "Radio automatically switches to Channel 16", "Issue voice Mayday on Channel 16 to follow up the DSC alert"},
		LLMInstructions: "The user has sent a DSC distress alert. Respond as Falmouth Coastguard with a DSC acknowledgement, then expect the voice Mayday follow-up.",
		CompletionCriteria: "User correctly sends DSC distress alert via CALL button AND follows up with voice Mayday on Channel 16 with proper format.",
	},
	"dsc-false-alert": {
		ID: "dsc-false-alert", Name: "DSC False Alert Cancellation",
		Description: "Accidentally trigger a DSC distress alert and correctly cancel it",
		Briefing: "You are aboard SV Artemis, MMSI 235099000. You have accidentally triggered a DSC distress alert. Cancel the false alert immediately using the correct procedure.",
		ExpectedProcedure: []string{"DSC distress alert has been sent (simulated as accidental)", "Switch to Channel 16", "Press PTT: 'All stations, all stations, all stations, this is Sailing Vessel Artemis, call sign MART, MMSI 235 099 000'", "Continue: 'Please cancel my distress alert of [time] UTC'", "Continue: 'I am not in distress, I say again, I am not in distress'", "End with 'out'"},
		LLMInstructions: "The scenario starts with the user having accidentally sent a DSC distress alert. Respond as Falmouth Coastguard acknowledging the cancellation. If the user doesn't include their MMSI or the time of the alert, note this in feedback.",
		CompletionCriteria: "User correctly cancels the false alert on Channel 16 with proper format (all stations x3, own vessel + call sign + MMSI, cancel request with time, confirmation of not in distress, OUT).",
	},
	"medico": {
		ID: "medico", Name: "MEDICO Call",
		Description: "Contact coastguard for medical advice via Pan-Pan Medical",
		Briefing: "You are aboard SV Artemis, position 50°06'N 005°08'W, 3 nautical miles south of Falmouth. A crew member has severe abdominal pain, fever, and has been vomiting for 6 hours. You need medical advice from the coastguard. Use the Pan-Pan Medical procedure.",
		ExpectedProcedure: []string{"Switch to Channel 16", "Press PTT: 'PAN PAN, PAN PAN, PAN PAN, Falmouth Coastguard, Falmouth Coastguard, Falmouth Coastguard, this is Sailing Vessel Artemis, Sailing Vessel Artemis, Sailing Vessel Artemis'", "Continue: 'I have a medical emergency on board and require medical advice'", "Provide position and number of persons on board", "Describe symptoms when asked by coastguard", "Follow medical advice given"},
		LLMInstructions: "You are Falmouth Coastguard. The user is making a Pan-Pan Medical call. Acknowledge and ask them to switch to a working channel. Ask about symptoms, age, medical history, and medications.",
		CompletionCriteria: "User correctly initiates Pan-Pan Medical with proper format AND provides clear symptom description AND follows medical advice.",
	},
}

func GetScenario(id string) (Scenario, bool) {
	s, ok := scenarios[id]
	return s, ok
}

func AllScenarios() []Scenario {
	result := make([]Scenario, 0, len(scenarios))
	for _, s := range scenarios {
		result = append(result, s)
	}
	return result
}
