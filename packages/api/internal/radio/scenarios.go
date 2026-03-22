package radio

type Scenario struct {
	ID                 string            `json:"id"`
	Name               string            `json:"name"`
	Description        string            `json:"description"`
	Briefing           string            `json:"briefing"`
	ExpectedProcedure  []string          `json:"expected_procedure"`
	LLMInstructions    string            `json:"llm_instructions"`
	CompletionCriteria string            `json:"completion_criteria"`
	RegionHints        map[string]string `json:"region_hints,omitempty"`
}

var scenarios = map[string]Scenario{
	"radio-check": {
		ID: "radio-check", Name: "Radio Check",
		Description: "Request a signal report from the coastguard on Channel 16",
		Briefing:    "You are aboard SV Artemis, moored in Falmouth harbour. You want to confirm your VHF radio is working before departing. Contact Falmouth Coastguard on Channel 16 for a radio check.",
		RegionHints: map[string]string{
			"caribbean":  "You are aboard SV Artemis, moored at Nanny Cay Marina, Tortola, BVI. You want to confirm your VHF radio is working before departing to St. Martin. Contact VISAR (Virgin Islands Search and Rescue) on Channel 16 for a radio check.",
			"med-greece": "You are aboard SV Artemis, moored in Kalamaki Marina, Athens. You want to confirm your VHF radio is working before departing into the Saronic Gulf. Contact Olympia Radio on Channel 16 for a radio check.",
			"se-asia":    "You are aboard SV Artemis, anchored in Chalong Bay, Phuket. You want to confirm your VHF radio is working before departing south towards Langkawi. Contact MRCC Phuket on Channel 16 for a radio check.",
			"pacific":    "You are aboard SV Artemis, moored at Vuda Point Marina, Fiji. You want to confirm your VHF radio is working before departing for the Yasawa Islands. Contact Fiji Maritime Rescue Coordination Centre on Channel 16 for a radio check.",
			"atlantic":   "You are aboard SV Artemis, moored in Las Palmas Marina, Gran Canaria. You want to confirm your VHF radio is working before departing on the ARC rally crossing. Contact Las Palmas Radio on Channel 16 for a radio check.",
		},
		ExpectedProcedure: []string{"Switch to Channel 16", "Press PTT and say: 'Falmouth Coastguard, Falmouth Coastguard, Falmouth Coastguard, this is Sailing Vessel Artemis, Sailing Vessel Artemis, Sailing Vessel Artemis, radio check on Channel 16, over'", "Release PTT and wait for response", "Acknowledge the signal report: 'Falmouth Coastguard, this is Sailing Vessel Artemis, thank you, out'"},
		LLMInstructions:   "You are Falmouth Coastguard. The user is requesting a radio check. Respond with: 'Sailing Vessel Artemis, this is Falmouth Coastguard, reading you loud and clear, over.' If the user's call format is incorrect, still respond but note the errors in the feedback. Wait for the user to acknowledge before marking complete.",
		CompletionCriteria: "User correctly initiates the radio check with proper call format (station called x3, own vessel x3, request, over) AND acknowledges the response with 'out'.",
	},
	"pan-pan": {
		ID: "pan-pan", Name: "Pan-Pan",
		Description: "Declare an urgency situation — engine failure in a shipping lane",
		Briefing:    "You are aboard SV Artemis, position 50°04'N 005°03'W, in the Falmouth approach channel. Your engine has failed and you are drifting towards the shipping lane. You have 3 persons on board. Declare a Pan-Pan urgency on Channel 16.",
		RegionHints: map[string]string{
			"caribbean":  "You are aboard SV Artemis, position 18°24'N 064°36'W, northwest of Tortola near the Blond Rock reef. Your engine has failed and you are drifting toward the reef in a 20-knot easterly trade wind. You have 3 persons on board. Declare a Pan-Pan urgency on Channel 16.",
			"med-greece": "You are aboard SV Artemis, position 37°32'N 023°18'E, in the Saronic Gulf between Aegina and the main shipping lane to Piraeus. Your engine has failed and you are drifting across the lane in light conditions with a 2-knot northerly current. You have 3 persons on board. Declare a Pan-Pan urgency on Channel 16.",
			"se-asia":    "You are aboard SV Artemis, position 07°44'N 098°22'E, in Phang Nga Bay off the southwest coast of Phuket. Your engine has failed and you are drifting toward a shallow reef in the pre-monsoon swell. You have 3 persons on board. Declare a Pan-Pan urgency on Channel 16.",
			"pacific":    "You are aboard SV Artemis, position 17°42'S 177°05'E, off the southern coast of Viti Levu, Fiji, near the Beqa Lagoon reef pass. Your engine has failed and you are drifting toward the barrier reef in a 15-knot southeast trade wind. You have 3 persons on board. Declare a Pan-Pan urgency on Channel 16.",
			"atlantic":   "You are aboard SV Artemis, position 27°58'N 015°22'W, off the southeast coast of Gran Canaria in the shipping separation scheme. Your engine has failed and you are drifting across the inbound lane in 25-knot NE trade winds. You have 3 persons on board. Declare a Pan-Pan urgency on Channel 16.",
		},
		ExpectedProcedure:  []string{"Switch to Channel 16", "Press PTT: 'PAN PAN, PAN PAN, PAN PAN, all stations, all stations, all stations, this is Sailing Vessel Artemis, Sailing Vessel Artemis, Sailing Vessel Artemis'", "Continue: 'My position is 50 degrees 04 minutes North, 005 degrees 03 minutes West'", "Continue: 'Engine failure, drifting towards shipping lane, require tow assistance'", "Continue: '3 persons on board, sailing yacht, 12 metres, white hull, over'", "Wait for coastguard acknowledgement", "Provide updates as requested"},
		LLMInstructions:    "You are Falmouth Coastguard. The user is declaring a Pan-Pan urgency. Acknowledge with correct format. Then ask the user for additional details or updates.",
		CompletionCriteria: "User correctly declares Pan-Pan with proper format (PAN PAN x3, addressing, vessel name x3, position, nature of urgency, assistance required, persons aboard, vessel description, over) AND responds to coastguard follow-up.",
	},
	"mayday": {
		ID: "mayday", Name: "Mayday",
		Description: "Full distress call — taking on water",
		Briefing:    "You are aboard SV Artemis, position 50°10'N 005°15'W, approximately 5 nautical miles southwest of the Lizard. Your vessel has struck a submerged object and is taking on water rapidly. The bilge pump cannot keep up. You have 4 persons on board. Issue a Mayday distress call on Channel 16.",
		RegionHints: map[string]string{
			"caribbean":  "You are aboard SV Artemis, position 18°18'N 064°52'W, approximately 4 nautical miles south of Virgin Gorda. Your vessel has struck a coral head while navigating The Sound and is taking on water rapidly. The bilge pump cannot keep up. You have 4 persons on board. Issue a Mayday distress call on Channel 16.",
			"med-greece": "You are aboard SV Artemis, position 37°15'N 025°10'E, approximately 5 nautical miles northeast of Paros in the Aegean Sea. Your vessel struck a submerged shipping container in the ferry lane and is taking on water rapidly. The bilge pump cannot keep up. You have 4 persons on board. Issue a Mayday distress call on Channel 16.",
			"se-asia":    "You are aboard SV Artemis, position 07°28'N 098°18'E, approximately 6 nautical miles southwest of Ko Racha Yai, Thailand. Your vessel has struck an unlit FAD (fish aggregating device) at night and is taking on water rapidly. The bilge pump cannot keep up. You have 4 persons on board. Issue a Mayday distress call on Channel 16.",
			"pacific":    "You are aboard SV Artemis, position 17°55'S 177°22'E, approximately 3 nautical miles west of the Kandavu Passage, Fiji. Your vessel has struck a partially submerged log in the current-swept passage and is taking on water rapidly. The bilge pump cannot keep up. You have 4 persons on board. Issue a Mayday distress call on Channel 16.",
			"atlantic":   "You are aboard SV Artemis, position 28°10'N 015°45'W, approximately 7 nautical miles west of Gran Canaria in the Canary Islands. Your vessel has struck a shipping container in the busy ARC rally approach lane and is taking on water rapidly. The bilge pump cannot keep up. You have 4 persons on board. Issue a Mayday distress call on Channel 16.",
		},
		ExpectedProcedure:  []string{"Switch to Channel 16", "Press PTT: 'MAYDAY, MAYDAY, MAYDAY, this is Sailing Vessel Artemis, Sailing Vessel Artemis, Sailing Vessel Artemis, call sign MART, MMSI 235 099 000'", "Continue: 'MAYDAY, Sailing Vessel Artemis, call sign MART'", "Continue: 'My position is 50 degrees 10 minutes North, 005 degrees 15 minutes West'", "Continue: 'I require immediate assistance — struck submerged object, taking on water'", "Continue: '4 persons on board, sailing yacht, 12 metres, white hull, over'", "Wait for coastguard acknowledgement", "Respond to coastguard instructions"},
		LLMInstructions:    "You are Falmouth Coastguard. The user is issuing a Mayday distress call. Acknowledge with the correct format. Coordinate the response — ask about rate of water ingress, whether crew are wearing lifejackets, and whether they have a liferaft.",
		CompletionCriteria: "User correctly issues Mayday with proper format (MAYDAY x3, vessel name x3 + call sign + MMSI stated once, MAYDAY + vessel + call sign, position, nature of distress, 'I require immediate assistance', persons, vessel description, OVER) AND responds to coastguard instructions.",
	},
	"mayday-relay": {
		ID: "mayday-relay", Name: "Mayday Relay",
		Description: "Hear another vessel's distress and relay it to the coastguard",
		Briefing:    "You are aboard SV Artemis, position 50°08'N 005°20'W. You hear a weak Mayday from Fishing Vessel Ocean Star, position 50°12'N 005°25'W, reporting they are sinking after a collision. The coastguard has not acknowledged. Relay the Mayday.",
		RegionHints: map[string]string{
			"caribbean":  "You are aboard SV Artemis, position 17°58'N 062°50'W, northwest of St. Kitts. You hear a weak Mayday from Motor Vessel Island Trader, position 18°05'N 062°58'W near Statia, reporting they are sinking after a collision with an unlit vessel in the inter-island ferry lane. VISAR has not acknowledged. Relay the Mayday.",
			"med-greece": "You are aboard SV Artemis, position 36°28'N 022°05'E, in the Kalamata Bay area of the Peloponnese. You hear a weak Mayday from Fishing Vessel Poseidon, position 36°22'N 022°02'W, reporting they are sinking after striking rocks off Cape Tainaron in a Meltemi squall. Olympia Radio has not acknowledged. Relay the Mayday.",
			"se-asia":    "You are aboard SV Artemis, position 05°42'N 100°22'E, in the Strait of Malacca off Penang. You hear a weak Mayday from Motor Vessel Halong Spirit, position 05°38'N 100°18'E, reporting they are sinking after a collision with a cargo vessel in the separation scheme. MRCC Malaysia has not acknowledged. Relay the Mayday.",
			"pacific":    "You are aboard SV Artemis, position 18°08'S 178°32'E, south of Suva in the Beqa Channel, Fiji. You hear a weak Mayday from Inter-Island Ferry Adi Cakobau, position 18°15'S 178°28'E, reporting they are sinking after striking a reef in deteriorating visibility. Fiji MRCC has not acknowledged. Relay the Mayday.",
			"atlantic":   "You are aboard SV Artemis, position 28°05'N 014°45'W, northeast of Lanzarote. You hear a weak Mayday from Fishing Vessel Santa Lucia, position 28°12'N 014°52'W, reporting they are sinking after a collision with a cargo vessel near the shipping lane. Las Palmas Radio has not acknowledged. Relay the Mayday.",
		},
		ExpectedProcedure:  []string{"Confirm Channel 16", "Wait to see if coastguard acknowledges (they don't)", "Press PTT: 'MAYDAY RELAY, MAYDAY RELAY, MAYDAY RELAY, all stations, all stations, all stations, this is Sailing Vessel Artemis, Sailing Vessel Artemis, Sailing Vessel Artemis'", "Relay the distress information you heard", "Add your own position and that you are standing by to assist", "Wait for coastguard response"},
		LLMInstructions:    "Start by playing Fishing Vessel Ocean Star making a weak, partially garbled Mayday. Then be silent (no coastguard response). The user should relay the Mayday. When they do, respond as Falmouth Coastguard acknowledging the relay.",
		CompletionCriteria: "User correctly relays the Mayday using MAYDAY RELAY format (MAYDAY RELAY x3, addressing, own vessel x3, relayed distress information, own position) AND waits appropriately before relaying.",
	},
	"responding-to-mayday": {
		ID: "responding-to-mayday", Name: "Responding to a Mayday",
		Description: "Hear a Mayday from another vessel and acknowledge correctly",
		Briefing:    "You are aboard SV Artemis, position 50°08'N 005°10'W. You hear a Mayday from Motor Vessel Blue Horizon, position 50°09'N 005°12'W, reporting a fire on board with 6 persons. The coastguard has not yet responded. Acknowledge the Mayday and offer assistance.",
		RegionHints: map[string]string{
			"caribbean":  "You are aboard SV Artemis, position 13°10'N 061°12'W, south of Bequia, St. Vincent and the Grenadines. You hear a Mayday from Charter Yacht Sundancer, position 13°08'N 061°15'W near Admiralty Bay, reporting an engine fire with 8 persons on board. The coastguard has not yet responded. Acknowledge the Mayday and offer assistance.",
			"med-greece": "You are aboard SV Artemis, position 37°42'N 026°52'E, in the strait between Samos and Turkey. You hear a Mayday from Gulet Aegean Dream, position 37°44'N 026°55'E, reporting an engine room fire with 10 persons on board near Pythagorion harbour. The coastguard has not yet responded. Acknowledge the Mayday and offer assistance.",
			"se-asia":    "You are aboard SV Artemis, position 01°22'N 104°02'E, in the Singapore Strait east of Raffles Lighthouse. You hear a Mayday from Motor Sailer Sea Gypsy, position 01°20'N 104°05'E, reporting an engine room fire with 5 persons on board. MRCC Singapore has not yet responded. Acknowledge the Mayday and offer assistance.",
			"pacific":    "You are aboard SV Artemis, position 21°08'S 175°12'W, in the Ha'apai Group, Tonga. You hear a Mayday from Sailing Vessel Horizon, position 21°12'S 175°08'W near Lifuka Island, reporting a fire below decks with 4 persons on board. Tonga Maritime has not yet responded. Acknowledge the Mayday and offer assistance.",
			"atlantic":   "You are aboard SV Artemis, position 27°45'N 017°55'W, west of El Hierro in the Canary Islands. You hear a Mayday from Motor Yacht Sirocco, position 27°48'N 018°00'W, reporting an engine room fire with 6 persons on board in 30-knot trade winds. Las Palmas Radio has not yet responded. Acknowledge the Mayday and offer assistance.",
		},
		ExpectedProcedure:  []string{"Listen to the Mayday on Channel 16", "Wait briefly for coastguard to acknowledge (they don't)", "Press PTT: 'MAYDAY, Motor Vessel Blue Horizon, this is Sailing Vessel Artemis, received MAYDAY'", "Provide your position and ETA to their location", "Offer assistance and stand by for instructions"},
		LLMInstructions:    "Start by playing Motor Vessel Blue Horizon issuing a Mayday: fire in engine room, 6 POB. Then be silent. The user should acknowledge. After the user acknowledges, respond as Falmouth Coastguard arriving on frequency and taking control.",
		CompletionCriteria: "User correctly acknowledges the Mayday using proper format (MAYDAY + distressed vessel name, own vessel name, received MAYDAY) AND provides own position AND offers assistance.",
	},
	"securite": {
		ID: "securite", Name: "Securité",
		Description: "Broadcast a navigational safety warning",
		Briefing:    "You are aboard SV Artemis, position 50°09'N 005°05'W. You have spotted a large shipping container floating partially submerged, approximately 200 metres ahead of your position, directly in the main shipping channel. Broadcast a Securité navigational warning on Channel 16.",
		RegionHints: map[string]string{
			"caribbean":  "You are aboard SV Artemis, position 15°18'N 061°22'W, in the channel between Dominica and Guadeloupe. You have spotted a large tree trunk floating submerged in the main ferry channel following heavy rain upriver — a serious hazard in this busy inter-island route. Broadcast a Securité navigational warning on Channel 16.",
			"med-greece": "You are aboard SV Artemis, position 36°52'N 027°55'E, in the Dodecanesse south of Rhodes. You have spotted a partially submerged shipping container, likely dropped by a cargo vessel, in the approach lane to Rhodes harbour. Broadcast a Securité navigational warning on Channel 16.",
			"se-asia":    "You are aboard SV Artemis, position 04°02'N 098°38'E, in the Strait of Malacca off the northern Sumatra coast. You have spotted an unlighted drifting vessel approximately 50 metres long in the main traffic lane, creating a serious hazard to vessels transiting at night. Broadcast a Securité navigational warning on Channel 16.",
			"pacific":    "You are aboard SV Artemis, position 18°08'S 178°28'E, entering the main pass into Suva Harbour, Fiji. You have spotted a large container washed from shore in the recent cyclone, floating semi-submerged directly in the buoyed fairway. Broadcast a Securité navigational warning on Channel 16.",
			"atlantic":   "You are aboard SV Artemis, position 28°08'N 015°28'W, approaching the separation scheme south of Gran Canaria. You have spotted a large trawling net buoy adrift from its marker with trailing netting visible beneath the surface, directly in the path of vessels in the traffic lane. Broadcast a Securité navigational warning on Channel 16.",
		},
		ExpectedProcedure:  []string{"Switch to Channel 16", "Press PTT: 'SECURITÉ, SECURITÉ, SECURITÉ, all stations, all stations, all stations, this is Sailing Vessel Artemis, Sailing Vessel Artemis, Sailing Vessel Artemis'", "Describe the hazard with position", "End with 'out'"},
		LLMInstructions:    "Respond as Falmouth Coastguard acknowledging the report. Then as another vessel, thank them for the warning.",
		CompletionCriteria: "User correctly broadcasts Securité with proper format (SECURITÉ x3, all stations x3, own vessel x3, nature of hazard, position, OUT).",
	},
	"routine-call": {
		ID: "routine-call", Name: "Routine Call",
		Description: "Contact a marina to request a berth",
		Briefing:    "You are aboard SV Artemis, approaching Falmouth harbour. You want to contact Falmouth Marina on Channel 16 to request a visitor berth for tonight. Falmouth Marina works on Channel 80.",
		RegionHints: map[string]string{
			"caribbean":  "You are aboard SV Artemis, approaching Road Town, Tortola, BVI. You want to contact Village Cay Marina on Channel 16 to request a visitor berth for tonight. Village Cay Marina works on Channel 16 and will direct you to their working channel.",
			"med-greece": "You are aboard SV Artemis, approaching Zea Marina in Piraeus. You want to contact the marina on Channel 12 (the local port authority works Channel 12) to request a visitor berth alongside for the night. Zea Marina works on Channel 12.",
			"se-asia":    "You are aboard SV Artemis, approaching Royal Langkawi Yacht Club, Malaysia. You want to contact the marina on Channel 16 to request a visitor berth for tonight. The yacht club works on Channel 71.",
			"pacific":    "You are aboard SV Artemis, approaching Port Denarau Marina, Nadi, Fiji. You want to contact the marina on Channel 16 to request a visitor berth for tonight. Port Denarau works on Channel 16 and will direct you to a working channel.",
			"atlantic":   "You are aboard SV Artemis, approaching Marina Rubicón, Lanzarote. You want to contact the marina on Channel 09 to request a visitor berth for the night ahead of your Atlantic crossing. Marina Rubicón works on Channel 09.",
		},
		ExpectedProcedure:  []string{"Switch to Channel 16", "Press PTT: 'Falmouth Marina, Falmouth Marina, this is Sailing Vessel Artemis, Sailing Vessel Artemis, over'", "Wait for response", "Request to switch to working channel", "Switch to Channel 80", "Conduct berthing conversation on Channel 80"},
		LLMInstructions:    "You are Falmouth Marina. Respond on Ch16, agree to Ch80. On Ch80 ask about vessel size, draught, arrival time, and number of nights. Assign berth D-14.",
		CompletionCriteria: "User correctly initiates contact on Channel 16, agrees working channel, switches to Channel 80, and conducts the berthing conversation with proper radio etiquette throughout.",
	},
	"dsc-distress": {
		ID: "dsc-distress", Name: "DSC Distress Alert",
		Description: "Send a DSC distress alert via the CALL button, then follow up with voice Mayday on CH16",
		Briefing:    "You are aboard SV Artemis, MMSI 235099000, position 50°10'N 005°15'W. Your vessel has struck a submerged object and is taking on water. Use the DSC CALL button to send a distress alert, then follow up with a voice Mayday on Channel 16.",
		RegionHints: map[string]string{
			"caribbean":  "You are aboard SV Artemis, MMSI 235099000, position 18°22'N 064°40'W, northeast of Peter Island, BVI. Your vessel has struck coral in the night and is taking on water. Use the DSC CALL button to send a distress alert, then follow up with a voice Mayday on Channel 16.",
			"med-greece": "You are aboard SV Artemis, MMSI 235099000, position 37°20'N 023°40'E, in the Myrtoan Sea south of Cape Sounion. Your vessel has struck a submerged wreck in 15 metres and is taking on water rapidly. Use the DSC CALL button to send a distress alert, then follow up with a voice Mayday on Channel 16.",
			"se-asia":    "You are aboard SV Artemis, MMSI 235099000, position 07°52'N 098°14'E, in the Andaman Sea west of Ko Yao Noi, Thailand. Your vessel has struck an uncharted pinnacle while navigating by GPS in poor visibility and is taking on water. Use the DSC CALL button to send a distress alert, then follow up with a voice Mayday on Channel 16.",
			"pacific":    "You are aboard SV Artemis, MMSI 235099000, position 17°38'S 177°18'E, in the Bligh Water northeast of Viti Levu, Fiji. Your vessel has struck a semi-submerged container in 2-metre swells and is taking on water. Use the DSC CALL button to send a distress alert, then follow up with a voice Mayday on Channel 16.",
			"atlantic":   "You are aboard SV Artemis, MMSI 235099000, position 27°52'N 015°30'W, in the approach to Gran Canaria. Your vessel has struck a large deadhead log in the dark and is taking on water. Use the DSC CALL button to send a distress alert, then follow up with a voice Mayday on Channel 16.",
		},
		ExpectedProcedure:  []string{"Press CALL button to open DSC panel", "Select 'Distress' alert type", "Select nature of distress: 'Flooding'", "Confirm position is correct", "Press and hold Send (5 seconds) to transmit distress alert", "Radio automatically switches to Channel 16", "Issue voice Mayday on Channel 16 to follow up the DSC alert"},
		LLMInstructions:    "The user has sent a DSC distress alert. Respond as Falmouth Coastguard with a DSC acknowledgement, then expect the voice Mayday follow-up.",
		CompletionCriteria: "User correctly sends DSC distress alert via CALL button AND follows up with voice Mayday on Channel 16 with proper format.",
	},
	"dsc-false-alert": {
		ID: "dsc-false-alert", Name: "DSC False Alert Cancellation",
		Description: "Accidentally trigger a DSC distress alert and correctly cancel it",
		Briefing:    "You are aboard SV Artemis, MMSI 235099000. You have accidentally triggered a DSC distress alert. Cancel the false alert immediately using the correct procedure.",
		RegionHints: map[string]string{
			"caribbean":  "You are aboard SV Artemis, MMSI 235099000, moored at Simpson Bay Marina, Sint Maarten. While installing a new chartplotter, you have accidentally triggered a DSC distress alert. Cancel the false alert immediately using the correct procedure — VISAR will be monitoring.",
			"med-greece": "You are aboard SV Artemis, MMSI 235099000, anchored off Spetses, Saronic Gulf. While cleaning the nav station, you have accidentally triggered a DSC distress alert. Cancel the false alert immediately using the correct procedure — Olympia Radio will be monitoring.",
			"se-asia":    "You are aboard SV Artemis, MMSI 235099000, berthed at Rebak Marina, Langkawi. While servicing the VHF radio, you have accidentally triggered a DSC distress alert. Cancel the false alert immediately using the correct procedure — MRCC Malaysia will be monitoring.",
			"pacific":    "You are aboard SV Artemis, MMSI 235099000, at anchor in Savusavu Bay, Fiji. While demonstrating the radio to a new crew member, you have accidentally triggered a DSC distress alert. Cancel the false alert immediately using the correct procedure — Fiji MRCC will be monitoring.",
			"atlantic":   "You are aboard SV Artemis, MMSI 235099000, moored in Puerto Calero, Lanzarote. While updating the DSC MMSI on a new VHF radio, you have accidentally triggered a distress alert. Cancel the false alert immediately using the correct procedure — Las Palmas Radio will be monitoring.",
		},
		ExpectedProcedure:  []string{"DSC distress alert has been sent (simulated as accidental)", "Switch to Channel 16", "Press PTT: 'All stations, all stations, all stations, this is Sailing Vessel Artemis, call sign MART, MMSI 235 099 000'", "Continue: 'Please cancel my distress alert of [time] UTC'", "Continue: 'I am not in distress, I say again, I am not in distress'", "End with 'out'"},
		LLMInstructions:    "The scenario starts with the user having accidentally sent a DSC distress alert. Respond as Falmouth Coastguard acknowledging the cancellation. If the user doesn't include their MMSI or the time of the alert, note this in feedback.",
		CompletionCriteria: "User correctly cancels the false alert on Channel 16 with proper format (all stations x3, own vessel + call sign + MMSI, cancel request with time, confirmation of not in distress, OUT).",
	},
	"medico": {
		ID: "medico", Name: "MEDICO Call",
		Description: "Contact coastguard for medical advice via Pan-Pan Medical",
		Briefing:    "You are aboard SV Artemis, position 50°06'N 005°08'W, 3 nautical miles south of Falmouth. A crew member has severe abdominal pain, fever, and has been vomiting for 6 hours. You need medical advice from the coastguard. Use the Pan-Pan Medical procedure.",
		RegionHints: map[string]string{
			"caribbean":  "You are aboard SV Artemis, position 15°58'N 061°45'W, 8 nautical miles west of Guadeloupe. A crew member has developed severe abdominal pain, high fever, and has been vomiting for 6 hours — possible appendicitis. You need medical advice. Contact CROSS Antilles-Guyane via the Pan-Pan Medical procedure on Channel 16.",
			"med-greece": "You are aboard SV Artemis, position 36°42'N 028°12'E, 12 nautical miles southeast of Rhodes in the Aegean. A crew member has developed chest pain and shortness of breath. You need urgent medical advice. Contact Olympia Radio on Channel 16 for a Pan-Pan Medical call — they will connect you to shore-based medical staff.",
			"se-asia":    "You are aboard SV Artemis, position 08°05'N 098°52'E, 15 nautical miles northwest of Ko Samui in the Gulf of Thailand. A crew member has been stung by what appears to be a box jellyfish — serious symptoms including paralysis of one arm and difficulty breathing. You need urgent medical advice. Contact MRCC Thailand on Channel 16 for a Pan-Pan Medical call.",
			"pacific":    "You are aboard SV Artemis, position 18°52'S 178°35'E, 20 nautical miles southeast of Suva, Fiji, in open ocean. A crew member has severe decompression sickness following a scuba dive, with joint pain, dizziness, and skin mottling. You need urgent medical advice and possible evacuation. Contact Fiji MRCC on Channel 16 for a Pan-Pan Medical call.",
			"atlantic":   "You are aboard SV Artemis, position 29°18'N 017°42'W, 40 nautical miles north of La Palma, Canary Islands. A crew member has severe allergic reaction to a bee sting, with facial swelling, difficulty breathing, and no epinephrine on board. You need urgent medical advice. Contact Las Palmas Radio on Channel 16 for a Pan-Pan Medical call.",
		},
		ExpectedProcedure:  []string{"Switch to Channel 16", "Press PTT: 'PAN PAN, PAN PAN, PAN PAN, Falmouth Coastguard, Falmouth Coastguard, Falmouth Coastguard, this is Sailing Vessel Artemis, Sailing Vessel Artemis, Sailing Vessel Artemis'", "Continue: 'I have a medical emergency on board and require medical advice'", "Provide position and number of persons on board", "Describe symptoms when asked by coastguard", "Follow medical advice given"},
		LLMInstructions:    "You are Falmouth Coastguard. The user is making a Pan-Pan Medical call. Acknowledge and ask them to switch to a working channel. Ask about symptoms, age, medical history, and medications.",
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
