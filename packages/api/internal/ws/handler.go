package ws

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func HandleWebSocket(hub *Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sessionID := r.PathValue("id")
		if sessionID == "" {
			http.Error(w, "missing session ID", http.StatusBadRequest)
			return
		}
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("WebSocket upgrade error: %v", err)
			return
		}
		client := &Client{SessionID: sessionID, Send: make(chan []byte, 256)}
		hub.Register <- client

		go func() {
			defer func() { hub.Unregister <- client; conn.Close() }()
			for msg := range client.Send {
				if err := conn.WriteMessage(websocket.TextMessage, msg); err != nil {
					return
				}
			}
		}()

		for {
			_, _, err := conn.ReadMessage()
			if err != nil {
				break
			}
		}
	}
}
