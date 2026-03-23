package ws

import "sync"

type Client struct {
	SessionID string
	Send      chan []byte
}

type Hub struct {
	clients    map[*Client]bool
	Register   chan *Client
	Unregister chan *Client
	mu         sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
		case client := <-h.Unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.Send)
			}
			h.mu.Unlock()
		}
	}
}

func (h *Hub) Broadcast(sessionID string, message []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for client := range h.clients {
		if client.SessionID == sessionID {
			select {
			case client.Send <- message:
			default:
			}
		}
	}
}
