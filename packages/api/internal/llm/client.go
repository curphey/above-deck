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

const (
	defaultBaseURL    = "https://api.anthropic.com"
	maxToolIterations = 5
)

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

// ToolDef is a Claude tool definition sent in the API request.
type ToolDef struct {
	Name        string         `json:"name"`
	Description string         `json:"description"`
	InputSchema map[string]any `json:"input_schema"`
}

// ToolExecutor is a function that executes a tool by name and returns the result string.
type ToolExecutor func(name string, input json.RawMessage) (string, error)

// contentBlock represents a single content block in a Claude API response.
type contentBlock struct {
	Type  string          `json:"type"`
	Text  string          `json:"text,omitempty"`
	ID    string          `json:"id,omitempty"`
	Name  string          `json:"name,omitempty"`
	Input json.RawMessage `json:"input,omitempty"`
}

// toolUseRequest extends the base request with tools support.
type toolUseRequest struct {
	Model     string    `json:"model"`
	MaxTokens int       `json:"max_tokens"`
	System    string    `json:"system"`
	Messages  []any     `json:"messages"`
	Tools     []ToolDef `json:"tools,omitempty"`
}

// toolUseResponse is the full Claude API response with stop_reason.
type toolUseResponse struct {
	Content    []contentBlock `json:"content"`
	StopReason string         `json:"stop_reason"`
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

// SendMessageWithTools sends a message to Claude with tool definitions and
// handles the tool_use loop: calling the executor for each tool_use block and
// feeding results back until Claude produces a final text response or the
// maximum iteration count is reached.
func (c *Client) SendMessageWithTools(ctx context.Context, apiKey, systemPrompt string, messages []Message, tools []ToolDef, executor ToolExecutor) (*VHFResponse, error) {
	if apiKey == "" {
		return nil, errors.New("API key is required")
	}

	// Seed the mutable message list as []any so we can append heterogeneous
	// assistant/user messages that contain []contentBlock slices.
	msgs := make([]any, len(messages))
	for i, m := range messages {
		msgs[i] = m
	}

	for range maxToolIterations {
		reqBody := toolUseRequest{
			Model:     "claude-sonnet-4-20250514",
			MaxTokens: 1024,
			System:    systemPrompt,
			Messages:  msgs,
			Tools:     tools,
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

		const maxResponseBytes = 1 << 20 // 1 MiB
		respBody, err := io.ReadAll(io.LimitReader(resp.Body, maxResponseBytes))
		resp.Body.Close()
		if err != nil {
			return nil, fmt.Errorf("read response: %w", err)
		}

		if resp.StatusCode != http.StatusOK {
			snippet := string(respBody)
			if len(snippet) > 512 {
				snippet = snippet[:512] + "...[truncated]"
			}
			return nil, fmt.Errorf("API error (status %d): %s", resp.StatusCode, snippet)
		}

		var apiResp toolUseResponse
		if err := json.Unmarshal(respBody, &apiResp); err != nil {
			return nil, fmt.Errorf("unmarshal API response: %w", err)
		}

		if apiResp.StopReason != "tool_use" {
			return c.extractVHFResponse(apiResp.Content)
		}

		// Append the assistant turn with its raw content blocks.
		msgs = append(msgs, map[string]any{
			"role":    "assistant",
			"content": apiResp.Content,
		})

		// Build tool results for every tool_use block.
		var toolResults []map[string]any
		for _, block := range apiResp.Content {
			if block.Type != "tool_use" {
				continue
			}
			result, execErr := executor(block.Name, block.Input)
			if execErr != nil {
				errJSON, _ := json.Marshal(map[string]string{"error": execErr.Error()})
				result = string(errJSON)
			}
			toolResults = append(toolResults, map[string]any{
				"type":        "tool_result",
				"tool_use_id": block.ID,
				"content":     result,
			})
		}

		msgs = append(msgs, map[string]any{
			"role":    "user",
			"content": toolResults,
		})
	}

	return nil, errors.New("tool_use loop exceeded maximum iterations")
}

// extractVHFResponse finds the first text content block, strips optional
// markdown fences, and parses the result as a VHFResponse.
func (c *Client) extractVHFResponse(content []contentBlock) (*VHFResponse, error) {
	for _, block := range content {
		if block.Type != "text" {
			continue
		}
		text := strings.TrimSpace(block.Text)
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
	return nil, errors.New("no text content block found in response")
}
