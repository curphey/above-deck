package ais

import (
	"context"
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const aisStreamURL = "wss://stream.aisstream.io/v0/stream"

// Client connects to aisstream.io and maintains a live map of vessel positions.
type Client struct {
	APIKey  string
	vessels map[int]*Vessel // MMSI → vessel, protected by mu
	mu      sync.RWMutex
	conn    *websocket.Conn
	stop    chan struct{}
}

func NewClient(apiKey string) *Client {
	return &Client{
		APIKey:  apiKey,
		vessels: make(map[int]*Vessel),
		stop:    make(chan struct{}),
	}
}

// subscribeMsg is the subscription message sent to aisstream.io after connecting.
type subscribeMsg struct {
	APIKey             string         `json:"APIKey"`
	BoundingBoxes      [][][2]float64 `json:"BoundingBoxes"`
	FilterMessageTypes []string       `json:"FilterMessageTypes"`
}

// aisMessage is the incoming message format from aisstream.io.
type aisMessage struct {
	MessageType string `json:"MessageType"`
	MetaData    struct {
		MMSI      int     `json:"MMSI"`
		ShipName  string  `json:"ShipName"`
		Latitude  float64 `json:"latitude"`
		Longitude float64 `json:"longitude"`
	} `json:"MetaData"`
	Message struct {
		PositionReport struct {
			Sog                float64 `json:"Sog"`
			Cog                float64 `json:"Cog"`
			TrueHeading        int     `json:"TrueHeading"`
			NavigationalStatus int     `json:"NavigationalStatus"`
		} `json:"PositionReport"`
	} `json:"Message"`
}

// Start connects to aisstream.io and begins receiving vessel data in the background.
// bbox is [minLat, minLon], [maxLat, maxLon] — use [[-90,-180],[90,180]] for global.
func (c *Client) Start(bbox [2][2]float64) error {
	if c.APIKey == "" {
		log.Println("[AIS] No API key — skipping real AIS data")
		return nil
	}

	conn, _, err := websocket.DefaultDialer.Dial(aisStreamURL, nil)
	if err != nil {
		return err
	}
	c.conn = conn

	sub := subscribeMsg{
		APIKey: c.APIKey,
		BoundingBoxes: [][][2]float64{{
			{bbox[0][0], bbox[0][1]},
			{bbox[1][0], bbox[1][1]},
		}},
		FilterMessageTypes: []string{"PositionReport"},
	}
	if err := conn.WriteJSON(sub); err != nil {
		conn.Close()
		return err
	}

	log.Printf("[AIS] Connected to aisstream.io, bbox: %v", bbox)

	go c.readLoop()
	return nil
}

func (c *Client) readLoop() {
	defer c.conn.Close()
	for {
		select {
		case <-c.stop:
			return
		default:
		}

		_, message, err := c.conn.ReadMessage()
		if err != nil {
			log.Printf("[AIS] Read error: %v", err)
			time.Sleep(5 * time.Second)
			return
		}

		var msg aisMessage
		if err := json.Unmarshal(message, &msg); err != nil {
			continue
		}

		if msg.MessageType != "PositionReport" {
			continue
		}

		c.mu.Lock()
		c.vessels[msg.MetaData.MMSI] = &Vessel{
			MMSI:       msg.MetaData.MMSI,
			Name:       msg.MetaData.ShipName,
			Latitude:   msg.MetaData.Latitude,
			Longitude:  msg.MetaData.Longitude,
			SOG:        msg.Message.PositionReport.Sog,
			COG:        msg.Message.PositionReport.Cog,
			VesselType: 0,
			TypeName:   "Vessel",
		}
		// Cap map at 500 vessels to avoid unbounded growth.
		if len(c.vessels) > 500 {
			for k := range c.vessels {
				delete(c.vessels, k)
				break
			}
		}
		c.mu.Unlock()
	}
}

// GetVessels returns a snapshot of all currently known vessels.
func (c *Client) GetVessels() []Vessel {
	c.mu.RLock()
	defer c.mu.RUnlock()
	result := make([]Vessel, 0, len(c.vessels))
	for _, v := range c.vessels {
		result = append(result, *v)
	}
	return result
}

// Stop shuts down the AIS client and closes the WebSocket connection.
func (c *Client) Stop() {
	close(c.stop)
	if c.conn != nil {
		c.conn.Close()
	}
}

// FetchVessels is retained for compatibility with existing tests.
// Real-time data is available via Start/GetVessels.
func (c *Client) FetchVessels(_ context.Context, _ BoundingBox, _ int) ([]Vessel, error) {
	vessels := c.GetVessels()
	if vessels == nil {
		return []Vessel{}, nil
	}
	return vessels, nil
}
