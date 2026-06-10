package rag

import "strings"

func BuildQuery(pains []string, styles []string, armSensitive bool) string {
	terms := []string{}
	if has(pains, "resets_short") {
		terms = append(terms, "resets control touch depth")
	}
	if has(pains, "blocks_shallow") {
		terms = append(terms, "blocks stability sweet spot forgiveness")
	}
	if has(pains, "popups") {
		terms = append(terms, "launch angle dwell time tame pop-ups")
	}
	if has(pains, "low_spin") {
		terms = append(terms, "spin rpm grip texture bite")
	}
	if has(styles, "hand_speed") {
		terms = append(terms, "quick hands light swing low inertia")
	}
	if armSensitive {
		terms = append(terms, "vibration comfort lower swingweight balance handle mass")
	}
	return strings.Join(terms, " ")
}

func has(ss []string, k string) bool {
	for _, s := range ss {
		if s == k {
			return true
		}
	}
	return false
}
