package session

import (
	"crypto/rand"
	"encoding/hex"
	"sync"
	"time"

	"github.com/curphey/above-deck/api/internal/llm"
)

const maxMessages = 20

type Session struct {
	ID           string        `json:"id"`
	Region       string        `json:"region"`
	VesselName   string        `json:"vessel_name"`
	VesselType   string        `json:"vessel_type"`
	ScenarioID   string        `json:"scenario_id,omitempty"`
	Messages     []llm.Message `json:"messages"`
	CreatedAt    time.Time     `json:"created_at"`
	LastActiveAt time.Time     `json:"last_active_at"`
}

type Manager struct {
	mu       sync.RWMutex
	sessions map[string]*Session
}

func NewManager() *Manager {
	return &Manager{sessions: make(map[string]*Session)}
}

func (m *Manager) Create(region, vesselName, vesselType string) *Session {
	id := generateID()
	now := time.Now()
	s := &Session{
		ID:           id,
		Region:       region,
		VesselName:   vesselName,
		VesselType:   vesselType,
		Messages:     []llm.Message{},
		CreatedAt:    now,
		LastActiveAt: now,
	}
	m.mu.Lock()
	m.sessions[id] = s
	m.mu.Unlock()
	return s
}

func (m *Manager) Get(id string) (*Session, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	s, ok := m.sessions[id]
	return s, ok
}

func (m *Manager) AddMessage(sessionID, role, content string) bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	s, ok := m.sessions[sessionID]
	if !ok {
		return false
	}
	s.Messages = append(s.Messages, llm.Message{Role: role, Content: content})
	if len(s.Messages) > maxMessages {
		s.Messages = s.Messages[len(s.Messages)-maxMessages:]
	}
	s.LastActiveAt = time.Now()
	return true
}

func (m *Manager) SetScenario(sessionID, scenarioID string) bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	s, ok := m.sessions[sessionID]
	if !ok {
		return false
	}
	s.ScenarioID = scenarioID
	return true
}

func generateID() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b)
}
