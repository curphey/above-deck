package radio

// Vessel represents a vessel that may be encountered in a cruising region.
type Vessel struct {
	Name        string `json:"name"`
	CallSign    string `json:"call_sign"`
	Type        string `json:"type"`
	Nationality string `json:"nationality"`
	Personality string `json:"personality"`
}

// CoastguardStation represents a coastguard station with its working channel and coverage area.
type CoastguardStation struct {
	Name     string `json:"name"`
	CallSign string `json:"call_sign"`
	Channel  int    `json:"channel"`
	Coverage string `json:"coverage"`
}

// Marina represents a marina with its VHF working channel.
type Marina struct {
	Name    string `json:"name"`
	Channel int    `json:"channel"`
}

// Region represents a cruising region with its associated vessels, coastguard stations, and marinas.
type Region struct {
	ID           string              `json:"id"`
	Name         string              `json:"name"`
	Description  string              `json:"description"`
	Coastguard   []CoastguardStation `json:"coastguard"`
	Vessels      []Vessel            `json:"vessels"`
	Marinas      []Marina            `json:"marinas"`
	LocalFlavour string              `json:"local_flavour"`
}

var regions = []Region{
	{
		ID:          "uk-south",
		Name:        "UK South Coast",
		Description: "Falmouth to Solent — classic English Channel cruising ground with tidal gates, shipping lanes, and variable conditions.",
		Coastguard: []CoastguardStation{
			{
				Name:     "Falmouth Coastguard",
				CallSign: "FALMOUTH COASTGUARD",
				Channel:  16,
				Coverage: "Land's End to Teignmouth",
			},
			{
				Name:     "Solent Coastguard",
				CallSign: "SOLENT COASTGUARD",
				Channel:  16,
				Coverage: "Teignmouth to Beachy Head",
			},
		},
		Vessels: []Vessel{
			{
				Name:        "Doris May",
				CallSign:    "MDMX9",
				Type:        "sailing",
				Nationality: "British",
				Personality: "Retired couple on a Hallberg-Rassy, methodical, always check in with the coastguard, offer helpful local knowledge.",
			},
			{
				Name:        "Blue Horizon",
				CallSign:    "FZBH4",
				Type:        "motor",
				Nationality: "French",
				Personality: "French family cruiser, polite but prefers French, will switch to English if needed, planning to cross to Cherbourg.",
			},
			{
				Name:        "Saoirse",
				CallSign:    "EISX7",
				Type:        "sailing",
				Nationality: "Irish",
				Personality: "Solo circumnavigator on a Shannon 28, laconic and experienced, only calls when genuinely needed.",
			},
			{
				Name:        "Windchaser",
				CallSign:    "MWCV3",
				Type:        "catamaran",
				Nationality: "British",
				Personality: "Live-aboard family with two kids, enthusiastic on the radio, prone to chatting, sailing from Cowes to Falmouth.",
			},
			{
				Name:        "Nordic Spirit",
				CallSign:    "LANS2",
				Type:        "motor sailer",
				Nationality: "Norwegian",
				Personality: "Scandinavian delivery crew, professional and precise, following standard maritime protocol to the letter.",
			},
		},
		Marinas: []Marina{
			{Name: "Falmouth Harbour", Channel: 80},
			{Name: "Plymouth Yacht Haven", Channel: 80},
			{Name: "Dartmouth", Channel: 80},
			{Name: "Lymington", Channel: 80},
			{Name: "Cowes", Channel: 69},
		},
		LocalFlavour: "Channel shipping lanes require constant radar watch. Tidal gates at Portland Bill and the Needles are critical. Weather can change rapidly — the BBC Shipping Forecast and Ch67 Navtex are essential planning tools.",
	},
	{
		ID:          "caribbean",
		Name:        "Caribbean — BVI, Grenadines, Antigua",
		Description: "Trade wind sailing through the eastern Caribbean — island hopping, customs formalities, and the famous cruiser nets.",
		Coastguard: []CoastguardStation{
			{
				Name:     "VISAR",
				CallSign: "VISAR",
				Channel:  16,
				Coverage: "British Virgin Islands",
			},
			{
				Name:     "Antigua Coast Guard",
				CallSign: "ANTIGUA COASTGUARD",
				Channel:  16,
				Coverage: "Antigua and Barbuda",
			},
		},
		Vessels: []Vessel{
			{
				Name:        "Island Time",
				CallSign:    "WDX847",
				Type:        "catamaran",
				Nationality: "American",
				Personality: "Laid-back American couple on a Leopard 45, always on the cruiser net, happy to share anchorage recommendations.",
			},
			{
				Name:        "Sunsail 4204",
				CallSign:    "VGSS42",
				Type:        "charter catamaran",
				Nationality: "mixed",
				Personality: "Charter boat with a mixed nationality group, inexperienced skipper, prone to asking basic questions on Ch16.",
			},
			{
				Name:        "Rhum Runner",
				CallSign:    "FZRR6",
				Type:        "motor",
				Nationality: "French",
				Personality: "French delivery skipper moving a Beneteau motor yacht from Martinique to Antigua, businesslike and efficient.",
			},
			{
				Name:        "Trade Wind",
				CallSign:    "VECK3",
				Type:        "sailing",
				Nationality: "Canadian",
				Personality: "Retired Canadian teacher doing a Caribbean circuit, knowledgeable about local customs procedures and happy to advise.",
			},
			{
				Name:        "Sea Biscuit",
				CallSign:    "MSBQ1",
				Type:        "catamaran",
				Nationality: "British",
				Personality: "Young British couple on a passage from the Canaries, still finding their feet in Caribbean protocols.",
			},
		},
		Marinas: []Marina{
			{Name: "Nanny Cay Marina", Channel: 16},
			{Name: "Village Cay Marina", Channel: 16},
			{Name: "Jolly Harbour", Channel: 68},
			{Name: "Port Louis Marina", Channel: 14},
		},
		LocalFlavour: "Check-in with customs and immigration is mandatory at each island. Cruiser nets (e.g., BVI Net on Ch77 at 0715) are the local information exchange. Trade winds blow NE at 15–25 knots — plan passages for morning departures before the sea breeze builds.",
	},
	{
		ID:          "med-greece",
		Name:        "Mediterranean — Greek Islands",
		Description: "Saronic Gulf and Cyclades — island hopping through ancient waters with Meltemi winds and busy shipping lanes.",
		Coastguard: []CoastguardStation{
			{
				Name:     "Olympia Radio",
				CallSign: "OLYMPIA RADIO",
				Channel:  16,
				Coverage: "all Greek waters",
			},
			{
				Name:     "Piraeus JRCC",
				CallSign: "PIRAEUS JRCC",
				Channel:  16,
				Coverage: "Saronic Gulf and Aegean",
			},
		},
		Vessels: []Vessel{
			{
				Name:        "Aegean Dream",
				CallSign:    "SVAD9",
				Type:        "charter catamaran",
				Nationality: "mixed",
				Personality: "Week-long charter group from several nationalities, enthusiastic but inexperienced — the skipper is competent but the crew keep interrupting on the radio.",
			},
			{
				Name:        "Kyria Maria",
				CallSign:    "SVKM3",
				Type:        "fishing",
				Nationality: "Greek",
				Personality: "Local caique fisherman, speaks Greek first and switches to minimal English only if pressed, deeply knowledgeable about local anchorages and weather.",
			},
			{
				Name:        "Bosphorus Star",
				CallSign:    "TCBS7",
				Type:        "motor sailer",
				Nationality: "Turkish",
				Personality: "Turkish gulet with professional crew running charter routes between Greek and Turkish waters, calm and methodical on the radio.",
			},
			{
				Name:        "Bella Napoli",
				CallSign:    "IBNX4",
				Type:        "motor",
				Nationality: "Italian",
				Personality: "Gregarious Italian family on a large motor yacht, loud and friendly, occasionally switches to Italian mid-transmission, always willing to share a recommendation.",
			},
			{
				Name:        "Meridian",
				CallSign:    "MMRD2",
				Type:        "sailing",
				Nationality: "British",
				Personality: "Experienced British couple on a long cruise, heading east toward Turkey, precise and proper on the radio, quietly amused by Mediterranean VHF habits.",
			},
		},
		Marinas: []Marina{
			{Name: "Kalamaki Marina", Channel: 12},
			{Name: "Poros Town Quay", Channel: 12},
			{Name: "Hydra Port", Channel: 12},
			{Name: "Aegina Marina", Channel: 12},
			{Name: "Gouvia Marina Corfu", Channel: 69},
		},
		LocalFlavour: "Meltemi winds blow NE force 5–7 in July and August — plan passages for early mornings before they build. AIS is mandatory in shipping lanes. Greek port police check-in required on arrival to each new port. VHF culture is more relaxed than northern Europe. Olympia Radio broadcasts weather on Ch16 at scheduled times.",
	},
	{
		ID:          "se-asia",
		Name:        "Southeast Asia — Thailand & Malaysia",
		Description: "Tropical cruising through the Andaman Sea and Strait of Malacca — monsoon sailing, piracy awareness zones, and stunning island anchorages.",
		Coastguard: []CoastguardStation{
			{
				Name:     "MRCC Phuket",
				CallSign: "THAI MARITIME",
				Channel:  16,
				Coverage: "Andaman Sea and west Thailand",
			},
			{
				Name:     "Malaysian MRCC",
				CallSign: "MRCC PUTRAJAYA",
				Channel:  16,
				Coverage: "Strait of Malacca and Langkawi",
			},
		},
		Vessels: []Vessel{
			{
				Name:        "Nong Khai",
				CallSign:    "HSNN5",
				Type:        "motor",
				Nationality: "Thai",
				Personality: "Longtail boat operator running tourist transfers, very limited English, communicates mostly in brief single-word acknowledgements, expert knowledge of local waters.",
			},
			{
				Name:        "Southern Cross",
				CallSign:    "VKSC8",
				Type:        "catamaran",
				Nationality: "Australian",
				Personality: "Australian cruising couple heading to Langkawi for the season, relaxed and helpful, good knowledge of check-in procedures at both Thai and Malaysian ports.",
			},
			{
				Name:        "Pacifique",
				CallSign:    "FZPQ6",
				Type:        "catamaran",
				Nationality: "French",
				Personality: "French catamaran on a rally circuit, organised and social, part of a rally fleet so frequently passing information to other participants.",
			},
			{
				Name:        "Ocean Diver",
				CallSign:    "9MOD3",
				Type:        "motor",
				Nationality: "Malaysian",
				Personality: "Commercial dive boat operator running liveaboard trips, professional and efficient on the radio, excellent English, follows COLREGS precisely.",
			},
			{
				Name:        "Yang Hai",
				CallSign:    "BSYH2",
				Type:        "cargo",
				Nationality: "Chinese",
				Personality: "Small coastal cargo vessel following a fixed schedule through the Strait of Malacca, adheres strictly to COLREGS, minimal radio communication beyond required calls.",
			},
		},
		Marinas: []Marina{
			{Name: "Ao Po Grand Marina", Channel: 69},
			{Name: "Royal Langkawi Yacht Club", Channel: 69},
			{Name: "Yacht Haven Marina Phuket", Channel: 73},
			{Name: "Rebak Marina", Channel: 16},
		},
		LocalFlavour: "Piracy awareness is essential in the Strait of Malacca — register with ReCAAP and maintain a radio watch. NE monsoon runs November to March, SW monsoon May to September. Customs check-in required at every country border crossing. Coastguard English can be limited in Thai waters. Ch16 is monitored but response times can be slow outside major ports.",
	},
	{
		ID:          "pacific",
		Name:        "Pacific — Fiji & Tonga",
		Description: "Blue water passage-making and island cruising in the South Pacific — remote anchorages, cyclone awareness, and traditional Polynesian hospitality.",
		Coastguard: []CoastguardStation{
			{
				Name:     "MRCC Suva",
				CallSign: "FIJI NAVY",
				Channel:  16,
				Coverage: "Fiji waters",
			},
			{
				Name:     "Tonga Maritime",
				CallSign: "NUKU'ALOFA RADIO",
				Channel:  16,
				Coverage: "Tonga waters",
			},
		},
		Vessels: []Vessel{
			{
				Name:        "Tasman Spirit",
				CallSign:    "ZLTX4",
				Type:        "sailing",
				Nationality: "New Zealand",
				Personality: "Experienced Kiwi couple heading home after years of Pacific cruising, calm and pragmatic, a reliable source of ground truth about passages and anchorages.",
			},
			{
				Name:        "Pacific Dreamer",
				CallSign:    "WPD93",
				Type:        "sailing",
				Nationality: "American",
				Personality: "American rally boat on the Pacific Puddle Jump, first major offshore passage — enthusiastic, organised, and very active on the SSB morning net.",
			},
			{
				Name:        "Liberté",
				CallSign:    "FZLB7",
				Type:        "sailing",
				Nationality: "French",
				Personality: "Solo French circumnavigator on a third lap of the Pacific, quietly confident, precise communications, tends to understate any difficulties.",
			},
			{
				Name:        "Lomaiviti Queen",
				CallSign:    "3DFQ1",
				Type:        "fishing",
				Nationality: "Fijian",
				Personality: "Local Fijian fishing vessel, friendly and helpful in person but minimal VHF protocol — calls are brief and sometimes unclear.",
			},
			{
				Name:        "Adi Savusavu",
				CallSign:    "3DAS5",
				Type:        "cargo",
				Nationality: "Fijian",
				Personality: "Inter-island supply ship on a fixed schedule connecting remote communities, professional crew, prioritises schedule and will not deviate — gives clear position reports.",
			},
		},
		Marinas: []Marina{
			{Name: "Vuda Point Marina", Channel: 16},
			{Name: "Musket Cove Marina", Channel: 68},
			{Name: "Port Denarau Marina", Channel: 16},
			{Name: "Neiafu (Tonga)", Channel: 16},
		},
		LocalFlavour: "Sevusevu protocol — present kava to village chief on arrival to any village anchorage, this is not optional. Cyclone season runs November to April — know your hurricane hole. SAR coverage is limited; self-reliance is critical. HF radio nets remain the primary communication tool (Pacific Seafarers Net). Check in with Fiji Navy on arrival. Carry paper charts — electronic coverage is patchy.",
	},
	{
		ID:          "atlantic",
		Name:        "Atlantic — Canaries & Cape Verde",
		Description: "Atlantic crossing preparation and the ARC rally route — from the Canary Islands via Cape Verde to the Caribbean, trade wind sailing at its finest.",
		Coastguard: []CoastguardStation{
			{
				Name:     "Las Palmas MRCC",
				CallSign: "LAS PALMAS RADIO",
				Channel:  16,
				Coverage: "Canary Islands",
			},
			{
				Name:     "Cape Verde Coast Guard",
				CallSign: "CAPE VERDE RADIO",
				Channel:  16,
				Coverage: "Cape Verde waters",
			},
		},
		Vessels: []Vessel{
			{
				Name:        "Double Act",
				CallSign:    "MDAX6",
				Type:        "catamaran",
				Nationality: "British",
				Personality: "ARC rally couple on their first Atlantic crossing, excited and slightly anxious, very thorough on safety checks and very active on the rally SSB net.",
			},
			{
				Name:        "Vent Debout",
				CallSign:    "FZVD5",
				Type:        "sailing",
				Nationality: "French",
				Personality: "Veteran French solo sailor on his seventh Atlantic crossing, economical with words, uses correct procedure every time, occasionally impatient with inexperienced callers.",
			},
			{
				Name:        "Sturmvogel",
				CallSign:    "DGSV3",
				Type:        "catamaran",
				Nationality: "German",
				Personality: "German bluewater catamaran, methodical and well-prepared, SSB equipped with full weather routing setup, gives detailed position reports at scheduled times.",
			},
			{
				Name:        "Hesperus",
				CallSign:    "MHSX8",
				Type:        "sailing",
				Nationality: "British",
				Personality: "British cruising couple on their first offshore passage, nervous but competent, rely heavily on the rally fleet for reassurance and advice.",
			},
			{
				Name:        "Fast Track",
				CallSign:    "VEFT2",
				Type:        "sailing",
				Nationality: "Canadian",
				Personality: "Professional delivery crew on a tight schedule, efficient and correct on the radio, no small talk — purely functional communications.",
			},
		},
		Marinas: []Marina{
			{Name: "Las Palmas Marina", Channel: 9},
			{Name: "Marina Rubicon Lanzarote", Channel: 9},
			{Name: "Mindelo Marina Cape Verde", Channel: 16},
			{Name: "Santa Cruz de Tenerife", Channel: 9},
			{Name: "Porto Santo Madeira", Channel: 16},
		},
		LocalFlavour: "ARC rally runs a daily SSB net — all participants should monitor. Weather routing is critical; the position of the ITCZ determines whether to go via Cape Verde or direct. Portuguese and Spanish VHF conventions apply in the eastern Atlantic. Trade winds blow NE at 15–25 knots in the belt. Watch schedule discipline is essential on passage. EPIRB registration is mandatory before departure.",
	},
}

// GetRegion returns a Region by its ID. The second return value is false if the region is not found.
func GetRegion(id string) (Region, bool) {
	for _, r := range regions {
		if r.ID == id {
			return r, true
		}
	}
	return Region{}, false
}

// AllRegions returns all available cruising regions.
func AllRegions() []Region {
	return regions
}
