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
	bbox    [2][2]float64
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
// Automatically reconnects on disconnection.
func (c *Client) Start(bbox [2][2]float64) error {
	if c.APIKey == "" {
		log.Println("[AIS] No API key — skipping real AIS data")
		return nil
	}

	c.bbox = bbox
	go c.connectLoop()
	return nil
}

func (c *Client) connect() error {
	dialer := websocket.Dialer{
		HandshakeTimeout: 10 * time.Second,
	}
	conn, _, err := dialer.Dial(aisStreamURL, nil)
	if err != nil {
		return err
	}
	c.conn = conn

	// Set read deadline and pong handler to detect dead connections
	conn.SetReadDeadline(time.Now().Add(90 * time.Second))
	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(90 * time.Second))
		return nil
	})

	sub := subscribeMsg{
		APIKey: c.APIKey,
		BoundingBoxes: [][][2]float64{{
			{c.bbox[0][0], c.bbox[0][1]},
			{c.bbox[1][0], c.bbox[1][1]},
		}},
		FilterMessageTypes: []string{"PositionReport"},
	}
	if err := conn.WriteJSON(sub); err != nil {
		conn.Close()
		return err
	}

	log.Printf("[AIS] Connected to aisstream.io (%d vessels cached)", len(c.vessels))

	// Start ping ticker
	go c.pingLoop(conn)

	return nil
}

func (c *Client) pingLoop(conn *websocket.Conn) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ticker.C:
			if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		case <-c.stop:
			return
		}
	}
}

func (c *Client) connectLoop() {
	for {
		select {
		case <-c.stop:
			return
		default:
		}

		if err := c.connect(); err != nil {
			log.Printf("[AIS] Connect error: %v — retrying in 10s", err)
			time.Sleep(10 * time.Second)
			continue
		}

		c.readLoop()

		// readLoop exited — connection dropped
		log.Printf("[AIS] Disconnected — reconnecting in 5s (%d vessels cached)", len(c.vessels))
		time.Sleep(5 * time.Second)
	}
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
			return // will reconnect via connectLoop
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
		if len(c.vessels) > 2000 {
			// Evict oldest entries to cap memory
			count := 0
			for k := range c.vessels {
				delete(c.vessels, k)
				count++
				if count >= 500 {
					break
				}
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
