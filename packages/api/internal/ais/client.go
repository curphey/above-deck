package ais

import "context"

const aisStreamURL = "wss://stream.aisstream.io/v0/stream"

type Client struct {
	APIKey string
}

func NewClient(apiKey string) *Client {
	return &Client{APIKey: apiKey}
}

// FetchVessels queries aisstream.io for vessels within the bounding box.
// Currently a stub — real WebSocket connection will be added when API key is configured.
func (c *Client) FetchVessels(ctx context.Context, bbox BoundingBox, maxCount int) ([]Vessel, error) {
	// TODO: implement WebSocket connection to aisstream.io
	return []Vessel{}, nil
}
