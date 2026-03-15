package llm

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const defaultBaseURL = "https://api.anthropic.com"

type Client struct {
	baseURL    string
	httpClient *http.Client
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type VHFResponse struct {
	Response struct {
		Station string `json:"station"`
		Message string `json:"message"`
		Channel int    `json:"channel"`
	} `json:"response"`
	Feedback struct {
		Correct      []string `json:"correct"`
		Errors       []string `json:"errors"`
		ProtocolNote string   `json:"protocol_note"`
	} `json:"feedback"`
	Scenario *struct {
		State        string `json:"state"`
		NextExpected string `json:"next_expected"`
		Complete     bool   `json:"complete"`
		Score        *int   `json:"score"`
	} `json:"scenario,omitempty"`
}

func NewClient(baseURL string) *Client {
	if baseURL == "" {
		baseURL = defaultBaseURL
	}
	return &Client{
		baseURL:    baseURL,
		httpClient: &http.Client{Timeout: 60 * time.Second},
	}
}

type apiRequest struct {
	Model     string    `json:"model"`
	MaxTokens int       `json:"max_tokens"`
	System    string    `json:"system"`
	Messages  []Message `json:"messages"`
}

type apiResponse struct {
	Content []struct {
		Type string `json:"type"`
		Text string `json:"text"`
	} `json:"content"`
}

func (c *Client) SendMessage(ctx context.Context, apiKey, systemPrompt string, messages []Message) (*VHFResponse, error) {
	if apiKey == "" {
		return nil, errors.New("API key is required")
	}

	reqBody := apiRequest{
		Model:     "claude-sonnet-4-20250514",
		MaxTokens: 1024,
		System:    systemPrompt,
		Messages:  messages,
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/v1/messages", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("send request: %w", err)
	}
	defer resp.Body.Close()

	const maxResponseBytes = 1 << 20 // 1 MiB
	respBody, err := io.ReadAll(io.LimitReader(resp.Body, maxResponseBytes))
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		errSnippet := string(respBody)
		if len(errSnippet) > 512 {
			errSnippet = errSnippet[:512] + "...[truncated]"
		}
		return nil, fmt.Errorf("API error (status %d): %s", resp.StatusCode, errSnippet)
	}

	var apiResp apiResponse
	if err := json.Unmarshal(respBody, &apiResp); err != nil {
		return nil, fmt.Errorf("unmarshal API response: %w", err)
	}

	if len(apiResp.Content) == 0 {
		return nil, errors.New("empty response from API")
	}

	text := strings.TrimSpace(apiResp.Content[0].Text)
	text = strings.TrimPrefix(text, "```json")
	text = strings.TrimPrefix(text, "```")
	text = strings.TrimSuffix(text, "```")
	text = strings.TrimSpace(text)

	var vhfResp VHFResponse
	if err := json.Unmarshal([]byte(text), &vhfResp); err != nil {
		return nil, fmt.Errorf("unmarshal VHF response: %w", err)
	}

	return &vhfResp, nil
}
