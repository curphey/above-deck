package llm_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/curphey/above-deck/api/internal/llm"
)

func TestSendMessage_Success(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("x-api-key") != "test-key" {
			t.Error("expected API key header")
		}
		if r.Header.Get("anthropic-version") == "" {
			t.Error("expected anthropic-version header")
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"content": []map[string]string{
				{"type": "text", "text": `{"response":{"station":"Falmouth Coastguard","message":"Reading you loud and clear","channel":16},"feedback":{"correct":["Good call format"],"errors":[],"protocol_note":"Acknowledge with out"}}`},
			},
		})
	}))
	defer server.Close()

	client := llm.NewClient(server.URL)
	resp, err := client.SendMessage(context.Background(), "test-key", "system prompt", []llm.Message{
		{Role: "user", Content: "Radio check"},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.Response.Station != "Falmouth Coastguard" {
		t.Errorf("unexpected station: %s", resp.Response.Station)
	}
}

func TestSendMessage_NoAPIKey(t *testing.T) {
	client := llm.NewClient("http://localhost")
	_, err := client.SendMessage(context.Background(), "", "system", nil)
	if err == nil {
		t.Error("expected error for empty API key")
	}
}
