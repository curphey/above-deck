package main

import (
	"log"
	"net/http"
	"os"

	"github.com/curphey/above-deck/api/internal/ais"
	"github.com/curphey/above-deck/api/internal/handler"
	"github.com/curphey/above-deck/api/internal/llm"
	"github.com/curphey/above-deck/api/internal/middleware"
	"github.com/curphey/above-deck/api/internal/session"
	"github.com/curphey/above-deck/api/internal/ws"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	allowedOrigin := os.Getenv("ALLOWED_ORIGIN")
	if allowedOrigin == "" {
		allowedOrigin = "http://localhost:4321"
	}

	// Set up AIS real-time feed if an API key is provided.
	aisKey := os.Getenv("AISSTREAM_API_KEY")
	aisClient := ais.NewClient(aisKey)
	if aisKey != "" {
		go func() {
			// Global bounding box — all vessels worldwide.
			if err := aisClient.Start([2][2]float64{{-90, -180}, {90, 180}}); err != nil {
				log.Printf("[AIS] Start error: %v", err)
			}
		}()
	}

	sessionMgr := session.NewManager()
	llmClient := llm.NewClient("")

	wsHub := ws.NewHub()
	go wsHub.Run()

	sessionHandler := handler.NewSessionHandler(sessionMgr, wsHub, aisClient)
	transmitHandler := handler.NewTransmitHandler(sessionMgr, llmClient, wsHub)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", handler.Health)
	mux.HandleFunc("POST /api/vhf/sessions", sessionHandler.Create)
	mux.HandleFunc("GET /api/vhf/sessions/{id}", sessionHandler.Get)
	mux.Handle("POST /api/vhf/transmit", transmitHandler)
	mux.HandleFunc("GET /api/vhf/scenarios", handler.Scenarios)
	mux.HandleFunc("GET /api/vhf/regions", handler.Regions)
	mux.HandleFunc("GET /api/vhf/sessions/{id}/ws", ws.HandleWebSocket(wsHub))

	wrapped := middleware.CORS(allowedOrigin)(mux)

	log.Printf("VHF API listening on :%s", port)
	if err := http.ListenAndServe(":"+port, wrapped); err != nil {
		log.Fatal(err)
	}
}
