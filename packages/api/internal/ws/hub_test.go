package ws

import "testing"

func TestHubRegisterAndBroadcast(t *testing.T) {
	hub := NewHub()
	go hub.Run()

	ch := make(chan []byte, 1)
	client := &Client{SessionID: "test-session", Send: ch}
	hub.Register <- client
	hub.Broadcast("test-session", []byte(`{"type":"test"}`))

	msg := <-ch
	if string(msg) != `{"type":"test"}` {
		t.Errorf("expected test message, got %s", string(msg))
	}
	hub.Unregister <- client
}

func TestHubBroadcastToCorrectSession(t *testing.T) {
	hub := NewHub()
	go hub.Run()

	ch1 := make(chan []byte, 1)
	ch2 := make(chan []byte, 1)
	c1 := &Client{SessionID: "session-1", Send: ch1}
	c2 := &Client{SessionID: "session-2", Send: ch2}
	hub.Register <- c1
	hub.Register <- c2

	hub.Broadcast("session-1", []byte(`{"type":"for-1"}`))

	msg := <-ch1
	if string(msg) != `{"type":"for-1"}` {
		t.Error("session-1 should receive")
	}

	select {
	case <-ch2:
		t.Error("session-2 should NOT receive")
	default:
	}
}
