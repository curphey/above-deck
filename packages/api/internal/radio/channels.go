// Package radio provides ITU VHF Marine Radio channel/frequency mappings.
package radio

import "sort"

// Channel represents an ITU VHF marine radio channel with its associated
// frequencies and operational metadata.
type Channel struct {
	Number int
	TxFreq float64 // Ship transmit frequency (MHz)
	RxFreq float64 // Ship receive frequency (MHz); equals TxFreq for simplex
	Name   string
	Usage  string
	Duplex bool // true if ship Tx and Rx frequencies differ
}

// channelMap holds all defined ITU VHF marine channels keyed by channel number.
// Frequencies are per ITU Radio Regulations Appendix 18.
var channelMap = map[int]Channel{
	// Ch 1 — Port operations / ship movement (duplex)
	1: {Number: 1, TxFreq: 156.050, RxFreq: 160.650, Name: "Port Operations", Usage: "Port operations", Duplex: true},

	// Ch 5 — Port operations (duplex)
	5: {Number: 5, TxFreq: 156.250, RxFreq: 160.850, Name: "Port Operations", Usage: "Port operations", Duplex: true},

	// Ch 6 — Inter-ship safety
	6: {Number: 6, TxFreq: 156.300, RxFreq: 156.300, Name: "Inter-Ship Safety", Usage: "Inter-ship safety", Duplex: false},

	// Ch 8 — Commercial inter-ship (simplex)
	8: {Number: 8, TxFreq: 156.400, RxFreq: 156.400, Name: "Commercial Inter-Ship", Usage: "Commercial inter-ship", Duplex: false},

	// Ch 9 — Calling / secondary (simplex)
	9: {Number: 9, TxFreq: 156.450, RxFreq: 156.450, Name: "Boating Safety / Secondary Calling", Usage: "Secondary calling, recreational", Duplex: false},

	// Ch 10 — Commercial inter-ship (simplex)
	10: {Number: 10, TxFreq: 156.500, RxFreq: 156.500, Name: "Commercial Inter-Ship", Usage: "Commercial inter-ship", Duplex: false},

	// Ch 12 — Port operations (simplex)
	12: {Number: 12, TxFreq: 156.600, RxFreq: 156.600, Name: "Port Operations", Usage: "Port operations, vessel traffic services", Duplex: false},

	// Ch 13 — Bridge-to-bridge navigation safety (simplex, 1W)
	13: {Number: 13, TxFreq: 156.650, RxFreq: 156.650, Name: "Bridge-to-Bridge Navigation Safety", Usage: "Intership navigation safety, 1W", Duplex: false},

	// Ch 14 — Port operations (simplex)
	14: {Number: 14, TxFreq: 156.700, RxFreq: 156.700, Name: "Port Operations", Usage: "Port operations", Duplex: false},

	// Ch 16 — International distress, safety & calling (simplex)
	16: {Number: 16, TxFreq: 156.800, RxFreq: 156.800, Name: "International Distress, Safety & Calling", Usage: "Distress, safety and calling — monitored by all vessels", Duplex: false},

	// Ch 17 — State control (simplex)
	17: {Number: 17, TxFreq: 156.850, RxFreq: 156.850, Name: "State Control", Usage: "On-scene coordination, state control", Duplex: false},

	// Ch 24 — Public correspondence (duplex)
	24: {Number: 24, TxFreq: 157.200, RxFreq: 161.800, Name: "Public Correspondence", Usage: "Public correspondence (coast station)", Duplex: true},

	// Ch 25 — Public correspondence (duplex)
	25: {Number: 25, TxFreq: 157.250, RxFreq: 161.850, Name: "Public Correspondence", Usage: "Public correspondence (coast station)", Duplex: true},

	// Ch 26 — Public correspondence (duplex)
	26: {Number: 26, TxFreq: 157.300, RxFreq: 161.900, Name: "Public Correspondence", Usage: "Public correspondence (coast station)", Duplex: true},

	// Ch 27 — Public correspondence (duplex)
	27: {Number: 27, TxFreq: 157.350, RxFreq: 161.950, Name: "Public Correspondence", Usage: "Public correspondence (coast station)", Duplex: true},

	// Ch 28 — Public correspondence (duplex)
	28: {Number: 28, TxFreq: 157.400, RxFreq: 162.000, Name: "Public Correspondence", Usage: "Public correspondence (coast station)", Duplex: true},

	// Ch 37 — UK M1 marina channel (simplex)
	37: {Number: 37, TxFreq: 157.850, RxFreq: 157.850, Name: "Marina (UK M1)", Usage: "UK marina working channel (M1)", Duplex: false},

	// Ch 60 — Port operations / marina (duplex)
	60: {Number: 60, TxFreq: 156.025, RxFreq: 160.625, Name: "Port Operations", Usage: "Port operations, marina", Duplex: true},

	// Ch 61 — Port operations (duplex)
	61: {Number: 61, TxFreq: 156.075, RxFreq: 160.675, Name: "Port Operations", Usage: "Port operations", Duplex: true},

	// Ch 62 — Port operations (duplex)
	62: {Number: 62, TxFreq: 156.125, RxFreq: 160.725, Name: "Port Operations", Usage: "Port operations", Duplex: true},

	// Ch 63 — Port operations (duplex)
	63: {Number: 63, TxFreq: 156.175, RxFreq: 160.775, Name: "Port Operations", Usage: "Port operations", Duplex: true},

	// Ch 64 — Port operations (duplex)
	64: {Number: 64, TxFreq: 156.225, RxFreq: 160.825, Name: "Port Operations", Usage: "Port operations", Duplex: true},

	// Ch 65 — Port operations (duplex)
	65: {Number: 65, TxFreq: 156.275, RxFreq: 160.875, Name: "Port Operations", Usage: "Port operations", Duplex: true},

	// Ch 66 — Port operations (duplex)
	66: {Number: 66, TxFreq: 156.325, RxFreq: 160.925, Name: "Port Operations", Usage: "Port operations", Duplex: true},

	// Ch 67 — UK small craft safety (simplex)
	67: {Number: 67, TxFreq: 156.375, RxFreq: 156.375, Name: "Small Craft Safety (UK)", Usage: "UK HM Coastguard small craft safety", Duplex: false},

	// Ch 68 — Marina / port working (simplex)
	68: {Number: 68, TxFreq: 156.425, RxFreq: 156.425, Name: "Marina / Port Working", Usage: "Non-commercial port operations, marinas", Duplex: false},

	// Ch 69 — Marina / port working (simplex)
	69: {Number: 69, TxFreq: 156.475, RxFreq: 156.475, Name: "Marina / Port Working", Usage: "Non-commercial port operations", Duplex: false},

	// Ch 70 — Digital Selective Calling (simplex, data only)
	70: {Number: 70, TxFreq: 156.525, RxFreq: 156.525, Name: "Digital Selective Calling", Usage: "DSC distress alerting and calling — data only, no voice", Duplex: false},

	// Ch 71 — Marina / port working (simplex)
	71: {Number: 71, TxFreq: 156.575, RxFreq: 156.575, Name: "Marina / Port Working", Usage: "Non-commercial port operations", Duplex: false},

	// Ch 72 — Inter-ship (simplex)
	72: {Number: 72, TxFreq: 156.625, RxFreq: 156.625, Name: "Inter-Ship", Usage: "Non-commercial inter-ship", Duplex: false},

	// Ch 73 — Inter-ship (simplex)
	73: {Number: 73, TxFreq: 156.675, RxFreq: 156.675, Name: "Inter-Ship / Port Operations", Usage: "Inter-ship, port operations", Duplex: false},

	// Ch 77 — Inter-ship (simplex)
	77: {Number: 77, TxFreq: 156.875, RxFreq: 156.875, Name: "Inter-Ship", Usage: "Non-commercial inter-ship", Duplex: false},

	// Ch 78 — Marina working (duplex)
	78: {Number: 78, TxFreq: 156.925, RxFreq: 161.525, Name: "Marina Working", Usage: "Non-commercial, marina working", Duplex: true},

	// Ch 79 — Marina working (duplex)
	79: {Number: 79, TxFreq: 156.975, RxFreq: 161.575, Name: "Marina Working", Usage: "Non-commercial, marina working", Duplex: true},

	// Ch 80 — Marina working — UK primary marina channel (duplex)
	80: {Number: 80, TxFreq: 157.025, RxFreq: 161.625, Name: "Marina Working (UK Primary)", Usage: "UK primary marina working channel", Duplex: true},

	// Ch 81 — Marina working (duplex)
	81: {Number: 81, TxFreq: 157.075, RxFreq: 161.675, Name: "Marina Working", Usage: "Non-commercial, marina working", Duplex: true},

	// Ch 82 — Marina working (duplex)
	82: {Number: 82, TxFreq: 157.125, RxFreq: 161.725, Name: "Marina Working", Usage: "Non-commercial, marina working", Duplex: true},
}

// GetChannel returns the Channel for a given ITU channel number.
// The second return value is false if the channel is not defined.
func GetChannel(number int) (Channel, bool) {
	ch, ok := channelMap[number]
	return ch, ok
}

// AllChannels returns a slice of all defined channels, sorted by channel number.
func AllChannels() []Channel {
	channels := make([]Channel, 0, len(channelMap))
	for _, ch := range channelMap {
		channels = append(channels, ch)
	}
	sort.Slice(channels, func(i, j int) bool {
		return channels[i].Number < channels[j].Number
	})
	return channels
}
