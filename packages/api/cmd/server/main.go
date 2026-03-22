package main

import (
	"log"
	"net/http"
	"os"

	"github.com/curphey/above-deck/api/internal/handler"
	"github.com/curphey/above-deck/api/internal/llm"
	"github.com/curphey/above-deck/api/internal/middleware"
	"github.com/curphey/above-deck/api/internal/session"
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

	sessionMgr := session.NewManager()
	llmClient := llm.NewClient("")
	sessionHandler := handler.NewSessionHandler(sessionMgr)
	transmitHandler := handler.NewTransmitHandler(sessionMgr, llmClient)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", handler.Health)
	mux.HandleFunc("POST /api/vhf/sessions", sessionHandler.Create)
	mux.HandleFunc("GET /api/vhf/sessions/{id}", sessionHandler.Get)
	mux.Handle("POST /api/vhf/transmit", transmitHandler)
	mux.HandleFunc("GET /api/vhf/scenarios", handler.Scenarios)
	mux.HandleFunc("GET /api/vhf/regions", handler.Regions)

	wrapped := middleware.CORS(allowedOrigin)(mux)

	log.Printf("VHF API listening on :%s", port)
	if err := http.ListenAndServe(":"+port, wrapped); err != nil {
		log.Fatal(err)
	}
}
