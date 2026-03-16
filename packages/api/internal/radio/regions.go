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
