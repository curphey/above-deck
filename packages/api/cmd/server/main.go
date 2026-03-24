package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/curphey/above-deck/api/internal/ais"
	"github.com/curphey/above-deck/api/internal/handler"
	"github.com/curphey/above-deck/api/internal/llm"
	"github.com/curphey/above-deck/api/internal/middleware"
	"github.com/curphey/above-deck/api/internal/session"
	"github.com/curphey/above-deck/api/internal/tools"
	"github.com/curphey/above-deck/api/internal/ws"
)

// Config holds all server configuration, loaded from environment variables.
type Config struct {
	Port           string
	AllowedOrigin  string
	AISStreamKey   string
	AnthropicKey   string
	LogLevel       string
}

func loadConfig() Config {
	return Config{
		Port:          envOr("PORT", "8080"),
		AllowedOrigin: envOr("ALLOWED_ORIGIN", "http://localhost:4321"),
		AISStreamKey:  os.Getenv("AISSTREAM_API_KEY"),
		AnthropicKey:  os.Getenv("ANTHROPIC"),
		LogLevel:      envOr("LOG_LEVEL", "info"),
	}
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func main() {
	cfg := loadConfig()

	// Structured JSON logging
	var logLevel slog.Level
	switch cfg.LogLevel {
	case "debug":
		logLevel = slog.LevelDebug
	case "warn":
		logLevel = slog.LevelWarn
	case "error":
		logLevel = slog.LevelError
	default:
		logLevel = slog.LevelInfo
	}
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: logLevel}))
	slog.SetDefault(logger)

	// AIS real-time feed
	aisClient := ais.NewClient(cfg.AISStreamKey)
	if cfg.AISStreamKey != "" {
		go func() {
			if err := aisClient.Start([2][2]float64{{-90, -180}, {90, 180}}); err != nil {
				slog.Error("AIS start failed", "error", err)
			}
		}()
	}

	// Core services
	sessionMgr := session.NewManager()
	llmClient := llm.NewClient("")

	toolExec := tools.NewExecutor()
	toolExec.Register(tools.NewTimeTool())
	toolExec.Register(tools.NewWeatherTool(""))
	toolExec.Register(tools.NewAISTool(aisClient))

	wsHub := ws.NewHub()
	go wsHub.Run()

	// Handlers
	sessionHandler := handler.NewSessionHandler(sessionMgr, wsHub, aisClient)
	transmitHandler := handler.NewTransmitHandler(sessionMgr, llmClient, wsHub, toolExec)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", handler.Health)
	mux.HandleFunc("GET /api/v1/health", handler.Health)
	mux.HandleFunc("POST /api/vhf/sessions", sessionHandler.Create)
	mux.HandleFunc("GET /api/vhf/sessions/{id}", sessionHandler.Get)
	mux.Handle("POST /api/vhf/transmit", transmitHandler)
	mux.HandleFunc("GET /api/vhf/scenarios", handler.Scenarios)
	mux.HandleFunc("GET /api/vhf/regions", handler.Regions)
	mux.HandleFunc("GET /api/vhf/sessions/{id}/ws", ws.HandleWebSocket(wsHub))

	wrapped := middleware.CORS(cfg.AllowedOrigin)(mux)

	// Server with timeouts
	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           wrapped,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      60 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	// Graceful shutdown
	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGTERM)

	go func() {
		slog.Info("server starting", "port", cfg.Port, "origin", cfg.AllowedOrigin)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	<-done
	slog.Info("shutting down gracefully")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Stop subsystems
	aisClient.Stop()
	wsHub.Stop()

	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("shutdown error", "error", err)
	}

	slog.Info("server stopped")
}
