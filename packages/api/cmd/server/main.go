package main

import (
	"log"
	"net/http"
	"os"

	"github.com/curphey/above-deck/api/internal/handler"
	"github.com/curphey/above-deck/api/internal/middleware"
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

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", handler.Health)

	wrapped := middleware.CORS(allowedOrigin)(mux)

	log.Printf("VHF API listening on :%s", port)
	if err := http.ListenAndServe(":"+port, wrapped); err != nil {
		log.Fatal(err)
	}
}
