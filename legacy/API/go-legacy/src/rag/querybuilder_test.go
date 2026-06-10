package rag

import (
	"strings"
	"testing"
)

func TestBuildQuery(t *testing.T) {
	tests := []struct {
		name         string
		pains        []string
		styles       []string
		armSensitive bool
		expected     []string // Expected terms that should be present
	}{
		{
			name:         "resets and blocks pain",
			pains:        []string{"resets_short", "blocks_shallow"},
			styles:       []string{},
			armSensitive: false,
			expected:     []string{"resets control touch depth", "blocks stability sweet spot forgiveness"},
		},
		{
			name:         "popups and low spin pain",
			pains:        []string{"popups", "low_spin"},
			styles:       []string{},
			armSensitive: false,
			expected:     []string{"launch angle dwell time tame pop-ups", "spin rpm grip texture bite"},
		},
		{
			name:         "hand speed style",
			pains:        []string{},
			styles:       []string{"hand_speed"},
			armSensitive: false,
			expected:     []string{"quick hands light swing low inertia"},
		},
		{
			name:         "arm sensitive player",
			pains:        []string{},
			styles:       []string{},
			armSensitive: true,
			expected:     []string{"vibration comfort lower swingweight balance handle mass"},
		},
		{
			name:         "combination: resets + hand speed + arm sensitive",
			pains:        []string{"resets_short"},
			styles:       []string{"hand_speed"},
			armSensitive: true,
			expected:     []string{"resets control touch depth", "quick hands light swing low inertia", "vibration comfort lower swingweight balance handle mass"},
		},
		{
			name:         "empty inputs",
			pains:        []string{},
			styles:       []string{},
			armSensitive: false,
			expected:     []string{},
		},
		{
			name:         "unknown pain points",
			pains:        []string{"unknown_pain"},
			styles:       []string{"unknown_style"},
			armSensitive: false,
			expected:     []string{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := BuildQuery(tt.pains, tt.styles, tt.armSensitive)

			// Check if all expected terms are present
			for _, expectedTerm := range tt.expected {
				if !strings.Contains(result, expectedTerm) {
					t.Errorf("Expected term '%s' not found in result: '%s'", expectedTerm, result)
				}
			}

			// For empty expected, result should be empty
			if len(tt.expected) == 0 && result != "" {
				t.Errorf("Expected empty result, got: '%s'", result)
			}

			// Verify no unexpected extra content for known cases
			if len(tt.expected) > 0 {
				expectedJoined := strings.Join(tt.expected, " ")
				if result != expectedJoined {
					t.Errorf("Expected: '%s', got: '%s'", expectedJoined, result)
				}
			}
		})
	}
}

func TestHasFunction(t *testing.T) {
	tests := []struct {
		name     string
		slice    []string
		key      string
		expected bool
	}{
		{
			name:     "key exists",
			slice:    []string{"resets_short", "blocks_shallow"},
			key:      "resets_short",
			expected: true,
		},
		{
			name:     "key does not exist",
			slice:    []string{"resets_short", "blocks_shallow"},
			key:      "popups",
			expected: false,
		},
		{
			name:     "empty slice",
			slice:    []string{},
			key:      "resets_short",
			expected: false,
		},
		{
			name:     "empty key",
			slice:    []string{"resets_short"},
			key:      "",
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := has(tt.slice, tt.key)
			if result != tt.expected {
				t.Errorf("Expected %v, got %v", tt.expected, result)
			}
		})
	}
}
