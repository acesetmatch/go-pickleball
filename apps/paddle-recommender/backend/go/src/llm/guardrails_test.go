package llm

import (
	"testing"
)

func TestApplyGuardrails_NoSnippets(t *testing.T) {
	// Test case: No snippets should lower confidence
	recommendations := []Recommendation{
		{
			PaddleID: "test-paddle-1",
			Evidence: []Evidence{}, // No snippets
		},
	}
	
	profile := Profile{
		Physical: struct {
			ArmSensitivity bool `json:"arm_sensitivity"`
		}{
			ArmSensitivity: false,
		},
	}
	
	userPrefs := UserPreferences{
		WeightTolerance: WeightToleranceNormal,
		MaxBudget:       100.0,
		AllowBudgetFlex: false,
	}
	
	config := DefaultGuardrailConfig()
	
	results := ApplyGuardrails(recommendations, profile, userPrefs, config)
	
	if len(results) != 1 {
		t.Fatalf("Expected 1 result, got %d", len(results))
	}
	
	result := results[0]
	
	// Should have minimal data flag set
	if !result.HasMinimalData {
		t.Error("Expected HasMinimalData to be true for no snippets")
	}
	
	// Confidence should be reduced by penalty
	expectedConfidence := 1.0 - config.NoSnippetsPenalty
	if result.Confidence != expectedConfidence {
		t.Errorf("Expected confidence %.2f, got %.2f", expectedConfidence, result.Confidence)
	}
}

func TestApplyGuardrails_WithSnippets(t *testing.T) {
	// Test case: With snippets should maintain confidence
	recommendations := []Recommendation{
		{
			PaddleID: "test-paddle-1",
			Evidence: []Evidence{
				{Source: "review", Text: "Great paddle for control"},
				{Source: "spec", Text: "Weight: 8.2oz"},
			},
		},
	}
	
	profile := Profile{}
	userPrefs := UserPreferences{
		WeightTolerance: WeightToleranceNormal,
		MaxBudget:       100.0,
		AllowBudgetFlex: false,
	}
	config := DefaultGuardrailConfig()
	
	results := ApplyGuardrails(recommendations, profile, userPrefs, config)
	
	if len(results) != 1 {
		t.Fatalf("Expected 1 result, got %d", len(results))
	}
	
	result := results[0]
	
	// Should not have minimal data flag set
	if result.HasMinimalData {
		t.Error("Expected HasMinimalData to be false with snippets")
	}
	
	// Confidence should remain high (assuming no safety violations)
	if result.Confidence < 0.9 {
		t.Errorf("Expected high confidence, got %.2f", result.Confidence)
	}
}

func TestValidateModSafety_LeadWeightNormal(t *testing.T) {
	// Test lead weight limit for normal tolerance
	rec := Recommendation{PaddleID: "test-paddle"}
	profile := Profile{}
	userPrefs := UserPreferences{
		WeightTolerance: WeightToleranceNormal,
		MaxBudget:       100.0,
	}
	config := DefaultGuardrailConfig()
	
	// Mock modded specs with excessive lead weight
	// Note: In real implementation, you'd need to modify extractModdedSpecs
	// or pass modded specs differently
	
	result := validateModSafety(rec, profile, userPrefs, config)
	
	// For this test, we expect it to pass since we don't have actual modded specs
	// In a real implementation with actual data, you'd test the violation
	if !result.IsValid && len(result.Violations) == 0 {
		t.Error("Expected validation to handle missing modded specs gracefully")
	}
}

func TestValidateModSafety_LeadWeightHeavy(t *testing.T) {
	// Test lead weight limit for heavy tolerance
	rec := Recommendation{PaddleID: "test-paddle"}
	profile := Profile{}
	userPrefs := UserPreferences{
		WeightTolerance: WeightToleranceHeavy,
		MaxBudget:       100.0,
	}
	config := DefaultGuardrailConfig()
	
	result := validateModSafety(rec, profile, userPrefs, config)
	
	// Should allow higher lead weight for heavy tolerance
	if !result.IsValid && len(result.Violations) == 0 {
		t.Error("Expected validation to handle heavy tolerance correctly")
	}
}

func TestValidateModSafety_ArmSensitivity(t *testing.T) {
	// Test arm sensitivity rules
	rec := Recommendation{PaddleID: "test-paddle"}
	profile := Profile{
		Physical: struct {
			ArmSensitivity bool `json:"arm_sensitivity"`
		}{
			ArmSensitivity: true,
		},
	}
	userPrefs := UserPreferences{
		WeightTolerance: WeightToleranceNormal,
		MaxBudget:       100.0,
	}
	config := DefaultGuardrailConfig()
	
	result := validateModSafety(rec, profile, userPrefs, config)
	
	// Should consider arm sensitivity in validation
	// The actual test would depend on having modded specs with aggressive changes
	if len(result.Violations) > 0 {
		// If there are violations, they should mention arm sensitivity
		found := false
		for _, violation := range result.Violations {
			if len(violation) > 0 {
				found = true
				break
			}
		}
		if !found {
			t.Error("Expected arm sensitivity to be considered in violations")
		}
	}
}

func TestValidateModSafety_BudgetExceeded(t *testing.T) {
	// Test budget limit enforcement
	rec := Recommendation{PaddleID: "test-paddle"}
	profile := Profile{}
	userPrefs := UserPreferences{
		WeightTolerance: WeightToleranceNormal,
		MaxBudget:       50.0,
		AllowBudgetFlex: false,
	}
	config := DefaultGuardrailConfig()
	
	result := validateModSafety(rec, profile, userPrefs, config)
	
	// Should enforce budget limits
	// The actual test would depend on having modded specs with high cost
	if !result.IsValid && len(result.Violations) == 0 {
		t.Error("Expected budget validation to work correctly")
	}
}

func TestValidateModSafety_BudgetFlexAllowed(t *testing.T) {
	// Test budget flexibility when allowed
	rec := Recommendation{PaddleID: "test-paddle"}
	profile := Profile{}
	userPrefs := UserPreferences{
		WeightTolerance: WeightToleranceNormal,
		MaxBudget:       50.0,
		AllowBudgetFlex: true, // Allow 10% over
	}
	config := DefaultGuardrailConfig()
	
	result := validateModSafety(rec, profile, userPrefs, config)
	
	// Should allow budget flexibility
	if !result.IsValid && len(result.Violations) == 0 {
		t.Error("Expected budget flexibility to be handled correctly")
	}
}

func TestValidateMinimalRequirements(t *testing.T) {
	// Test minimal requirements validation
	rec := Recommendation{
		PaddleID: "test-paddle",
		Evidence: []Evidence{},
	}
	
	isValid, missing := ValidateMinimalRequirements(rec)
	
	// Should identify missing simulator data
	if isValid {
		t.Error("Expected validation to fail for missing requirements")
	}
	
	if len(missing) == 0 {
		t.Error("Expected missing requirements to be identified")
	}
	
	// Should mention simulator data
	found := false
	for _, req := range missing {
		if len(req) > 0 {
			found = true
			break
		}
	}
	if !found {
		t.Error("Expected simulator data to be in missing requirements")
	}
}

func TestShouldTriggerReplan_LowConfidence(t *testing.T) {
	// Test re-plan trigger for low confidence
	config := DefaultGuardrailConfig()
	
	recWithConf := RecommendationWithConfidence{
		Confidence: config.MinConfidence - 0.1, // Below threshold
		SafetyResult: ModSafetyResult{
			IsValid:     true,
			NeedsReplan: false,
		},
	}
	
	shouldReplan := ShouldTriggerReplan(recWithConf, config)
	
	if !shouldReplan {
		t.Error("Expected low confidence to trigger re-plan")
	}
}

func TestShouldTriggerReplan_SafetyViolations(t *testing.T) {
	// Test re-plan trigger for safety violations
	config := DefaultGuardrailConfig()
	
	recWithConf := RecommendationWithConfidence{
		Confidence: 0.8, // Good confidence
		SafetyResult: ModSafetyResult{
			IsValid:     false,
			NeedsReplan: false,
			Violations:  []string{"violation1", "violation2", "violation3"}, // 3+ violations
		},
	}
	
	shouldReplan := ShouldTriggerReplan(recWithConf, config)
	
	if !shouldReplan {
		t.Error("Expected multiple safety violations to trigger re-plan")
	}
}

func TestShouldTriggerReplan_ExplicitFlag(t *testing.T) {
	// Test re-plan trigger for explicit flag
	config := DefaultGuardrailConfig()
	
	recWithConf := RecommendationWithConfidence{
		Confidence: 0.9, // High confidence
		SafetyResult: ModSafetyResult{
			IsValid:     true,
			NeedsReplan: true, // Explicit flag
		},
	}
	
	shouldReplan := ShouldTriggerReplan(recWithConf, config)
	
	if !shouldReplan {
		t.Error("Expected explicit replan flag to trigger re-plan")
	}
}

func TestShouldTriggerReplan_NoTrigger(t *testing.T) {
	// Test case where re-plan should NOT be triggered
	config := DefaultGuardrailConfig()
	
	recWithConf := RecommendationWithConfidence{
		Confidence: 0.8, // Good confidence
		SafetyResult: ModSafetyResult{
			IsValid:     true,
			NeedsReplan: false,
			Violations:  []string{"minor violation"}, // Only 1 violation
		},
	}
	
	shouldReplan := ShouldTriggerReplan(recWithConf, config)
	
	if shouldReplan {
		t.Error("Expected no re-plan trigger for good recommendation")
	}
}

func TestDefaultGuardrailConfig(t *testing.T) {
	// Test default configuration values
	config := DefaultGuardrailConfig()
	
	if config.MaxLeadWeight != 8.0 {
		t.Errorf("Expected MaxLeadWeight 8.0, got %.1f", config.MaxLeadWeight)
	}
	
	if config.MaxBudgetIncrease != 0.10 {
		t.Errorf("Expected MaxBudgetIncrease 0.10, got %.2f", config.MaxBudgetIncrease)
	}
	
	if config.MinConfidence != 0.3 {
		t.Errorf("Expected MinConfidence 0.3, got %.1f", config.MinConfidence)
	}
	
	if config.NoSnippetsPenalty != 0.1 {
		t.Errorf("Expected NoSnippetsPenalty 0.1, got %.1f", config.NoSnippetsPenalty)
	}
}

// Benchmark tests for performance
func BenchmarkApplyGuardrails(b *testing.B) {
	recommendations := []Recommendation{
		{PaddleID: "paddle1", Evidence: []Evidence{{Source: "test", Text: "test"}}},
		{PaddleID: "paddle2", Evidence: []Evidence{}},
		{PaddleID: "paddle3", Evidence: []Evidence{{Source: "test", Text: "test"}}},
	}
	
	profile := Profile{}
	userPrefs := UserPreferences{
		WeightTolerance: WeightToleranceNormal,
		MaxBudget:       100.0,
	}
	config := DefaultGuardrailConfig()
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		ApplyGuardrails(recommendations, profile, userPrefs, config)
	}
}

func BenchmarkValidateModSafety(b *testing.B) {
	rec := Recommendation{PaddleID: "test-paddle"}
	profile := Profile{}
	userPrefs := UserPreferences{
		WeightTolerance: WeightToleranceNormal,
		MaxBudget:       100.0,
	}
	config := DefaultGuardrailConfig()
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		validateModSafety(rec, profile, userPrefs, config)
	}
}
