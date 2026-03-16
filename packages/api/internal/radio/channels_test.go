package radio_test

import (
	"testing"
	"github.com/curphey/above-deck/api/internal/radio"
)

func TestChannel16(t *testing.T) {
	ch, ok := radio.GetChannel(16)
	if !ok {
		t.Fatal("channel 16 not found")
	}
	if ch.TxFreq != 156.800 {
		t.Errorf("expected 156.800, got %f", ch.TxFreq)
	}
	if ch.Name != "International Distress, Safety & Calling" {
		t.Errorf("unexpected name: %s", ch.Name)
	}
}

func TestChannel70(t *testing.T) {
	ch, ok := radio.GetChannel(70)
	if !ok {
		t.Fatal("channel 70 not found")
	}
	if ch.Name != "Digital Selective Calling" {
		t.Errorf("unexpected name: %s", ch.Name)
	}
}

func TestInvalidChannel(t *testing.T) {
	_, ok := radio.GetChannel(99)
	if ok {
		t.Error("expected channel 99 to not exist")
	}
}

func TestAllChannelsHaveFrequencies(t *testing.T) {
	channels := radio.AllChannels()
	if len(channels) < 20 {
		t.Errorf("expected at least 20 channels, got %d", len(channels))
	}
	for _, ch := range channels {
		if ch.TxFreq <= 0 {
			t.Errorf("channel %d has invalid tx frequency", ch.Number)
		}
	}
}
