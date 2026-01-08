package llm

import (
	"fmt"
	"log"
)

// GuardrailConfig holds configuration for safety rules
type GuardrailConfig struct {
	MaxLeadWeight      float64 // Maximum lead weight in grams (default 8g)
	MaxBudgetIncrease  float64 // Maximum budget increase percentage (default 10%)
	MinConfidence      float64 // Minimum confidence threshold (default 0.3)
	NoSnippetsPenalty  float64 // Confidence penalty for no snippets (default 0.1)
}

// DefaultGuardrailConfig returns the default guardrail configuration
func DefaultGuardrailConfig() GuardrailConfig {
	return GuardrailConfig{
		MaxLeadWeight:     8.0,
		MaxBudgetIncrease: 0.10, // 10%
		MinConfidence:     0.3,
		NoSnippetsPenalty: 0.1,
	}
}

// ModSafetyResult represents the result of mod safety validation
type ModSafetyResult struct {
	IsValid      bool     `json:"is_valid"`
	Violations   []string `json:"violations"`
	Adjustments  []string `json:"adjustments"`
	NeedsReplan  bool     `json:"needs_replan"`
}

// RecommendationWithConfidence extends Recommendation with confidence scoring
type RecommendationWithConfidence struct {
	Recommendation
	Confidence         float64         `json:"confidence"`
	SafetyResult       ModSafetyResult `json:"safety_result"`
	HasMinimalData     bool            `json:"has_minimal_data"`
	SimulatorNumbers   SimulatorData   `json:"simulator_numbers,omitempty"`
}

// SimulatorData represents minimum required simulator data
type SimulatorData struct {
	SwingWeightDelta float64 `json:"swing_weight_delta"`
	BalanceDelta     float64 `json:"balance_delta"`
}

// WeightTolerance represents user's weight tolerance preference
type WeightTolerance string

const (
	WeightToleranceNormal WeightTolerance = "normal"
	WeightToleranceHeavy  WeightTolerance = "heavy"
)

// UserPreferences represents user preferences that affect guardrails
type UserPreferences struct {
	WeightTolerance WeightTolerance `json:"weight_tolerance"`
	MaxBudget       float64         `json:"max_budget"`
	AllowBudgetFlex bool            `json:"allow_budget_flex"`
}

// ApplyGuardrails applies safety rules and fallbacks to recommendations
func ApplyGuardrails(recommendations []Recommendation, profile Profile, userPrefs UserPreferences, config GuardrailConfig) []RecommendationWithConfidence {
	result := make([]RecommendationWithConfidence, 0, len(recommendations))
	
	for _, rec := range recommendations {
		recWithConf := RecommendationWithConfidence{
			Recommendation: rec,
			Confidence:     1.0, // Start with full confidence
		}
		
		// Check if we have minimal data (no snippets)
		if len(rec.Evidence) == 0 {
			recWithConf.HasMinimalData = true
			recWithConf.Confidence -= config.NoSnippetsPenalty
			log.Printf("No snippets found for paddle %s, reducing confidence by %.1f", rec.PaddleID, config.NoSnippetsPenalty)
			
			// For no-snippets case, we need at least simulator numbers
			simData, hasSimData := extractSimulatorData(rec)
			if hasSimData {
				recWithConf.SimulatorNumbers = simData
			} else {
				// If we don't even have simulator data, mark for re-planning
				recWithConf.SafetyResult.NeedsReplan = true
				recWithConf.SafetyResult.Violations = append(recWithConf.SafetyResult.Violations, 
					"Missing required simulator data (SW delta, balance delta)")
			}
		}
		
		// Apply mod safety validation
		safetyResult := validateModSafety(rec, profile, userPrefs, config)
		recWithConf.SafetyResult = safetyResult
		
		// Adjust confidence based on safety violations
		if !safetyResult.IsValid {
			confidencePenalty := float64(len(safetyResult.Violations)) * 0.05 // 5% per violation
			recWithConf.Confidence -= confidencePenalty
		}
		
		// Ensure minimum confidence threshold
		if recWithConf.Confidence < config.MinConfidence {
			recWithConf.SafetyResult.NeedsReplan = true
			recWithConf.SafetyResult.Violations = append(recWithConf.SafetyResult.Violations,
				fmt.Sprintf("Confidence %.2f below minimum threshold %.2f", recWithConf.Confidence, config.MinConfidence))
		}
		
		result = append(result, recWithConf)
	}
	
	return result
}

// validateModSafety validates modification safety rules
func validateModSafety(rec Recommendation, profile Profile, userPrefs UserPreferences, config GuardrailConfig) ModSafetyResult {
	result := ModSafetyResult{
		IsValid:     true,
		Violations:  []string{},
		Adjustments: []string{},
		NeedsReplan: false,
	}
	
	// Extract modded specs if available (assuming they're in the recommendation somehow)
	// This would need to be adapted based on your actual data structure
	moddedSpecs := extractModdedSpecs(rec)
	
	// Rule 1: Total lead weight ≤ 8g unless weight_tolerance='heavy'
	if leadWeight, hasLead := moddedSpecs["lead_weight"]; hasLead {
		maxLead := config.MaxLeadWeight
		if userPrefs.WeightTolerance == WeightToleranceHeavy {
			maxLead = 12.0 // Allow up to 12g for heavy tolerance
		}
		
		if leadWeightFloat, ok := leadWeight.(float64); ok && leadWeightFloat > maxLead {
			result.IsValid = false
			result.Violations = append(result.Violations, 
				fmt.Sprintf("Lead weight %.1fg exceeds maximum %.1fg for %s tolerance", 
					leadWeightFloat, maxLead, userPrefs.WeightTolerance))
			
			// Suggest adjustment
			result.Adjustments = append(result.Adjustments,
				fmt.Sprintf("Reduce lead weight to %.1fg", maxLead))
		}
	}
	
	// Rule 2: Budget ≤ max+10% unless explicitly allowed
	if cost, hasCost := moddedSpecs["modification_cost"]; hasCost {
		if costFloat, ok := cost.(float64); ok {
			maxAllowed := userPrefs.MaxBudget
			if userPrefs.AllowBudgetFlex {
				maxAllowed *= (1.0 + config.MaxBudgetIncrease)
			}
			
			if costFloat > maxAllowed {
				result.IsValid = false
				result.Violations = append(result.Violations,
					fmt.Sprintf("Modification cost $%.2f exceeds maximum $%.2f", costFloat, maxAllowed))
				
				result.Adjustments = append(result.Adjustments,
					fmt.Sprintf("Reduce modification cost to $%.2f", maxAllowed))
			}
		}
	}
	
	// Rule 3: Arm sensitivity rule on balance/SW changes
	if profile.Physical.ArmSensitivity {
		if swDelta, hasSW := moddedSpecs["swing_weight_delta"]; hasSW {
			if swFloat, ok := swDelta.(float64); ok && swFloat > 10.0 {
				result.IsValid = false
				result.Violations = append(result.Violations,
					"Swing weight change too aggressive for arm-sensitive user")
				
				result.Adjustments = append(result.Adjustments,
					"Limit swing weight delta to ≤10 points for arm sensitivity")
			}
		}
		
		if balDelta, hasBal := moddedSpecs["balance_delta"]; hasBal {
			if balFloat, ok := balDelta.(float64); ok && balFloat > 0.5 {
				result.IsValid = false
				result.Violations = append(result.Violations,
					"Balance point change too aggressive for arm-sensitive user")
				
				result.Adjustments = append(result.Adjustments,
					"Limit balance delta to ≤0.5 inches for arm sensitivity")
			}
		}
	}
	
	// If there are violations, mark for re-planning
	if len(result.Violations) > 0 {
		result.NeedsReplan = true
	}
	
	return result
}

// extractSimulatorData extracts simulator data from recommendation
func extractSimulatorData(rec Recommendation) (SimulatorData, bool) {
	// This would need to be implemented based on your actual data structure
	// For now, return empty data
	// In a real implementation, you'd parse the recommendation or evidence
	// to extract SW delta and balance delta
	
	// Placeholder implementation - you'd need to adapt this
	for _, evidence := range rec.Evidence {
		// Parse evidence text for simulator numbers
		// This is a simplified example
		if evidence.Source == "simulator" {
			// Parse simulator data from evidence text
			// Return actual data when found
		}
	}
	
	return SimulatorData{}, false
}

// extractModdedSpecs extracts modification specifications from recommendation
func extractModdedSpecs(rec Recommendation) map[string]interface{} {
	// This would need to be implemented based on your actual data structure
	// For now, return empty map
	// In a real implementation, you'd extract modded specs from the recommendation
	
	moddedSpecs := make(map[string]interface{})
	
	// Placeholder implementation - you'd need to adapt this based on your data structure
	// This might come from the Candidate's ModdedSpecs or be parsed from Evidence
	
	return moddedSpecs
}

// ValidateMinimalRequirements checks if we have minimum data for explanation
func ValidateMinimalRequirements(rec Recommendation) (bool, []string) {
	missing := []string{}
	
	// Check for simulator numbers
	if _, hasSimData := extractSimulatorData(rec); !hasSimData {
		missing = append(missing, "simulator data (SW delta, balance delta)")
	}
	
	// Could add other minimal requirements here
	
	return len(missing) == 0, missing
}

// ShouldTriggerReplan determines if a recommendation should trigger re-planning
func ShouldTriggerReplan(recWithConf RecommendationWithConfidence, config GuardrailConfig) bool {
	// Explicit replan flag
	if recWithConf.SafetyResult.NeedsReplan {
		return true
	}
	
	// Low confidence threshold
	if recWithConf.Confidence < config.MinConfidence {
		return true
	}
	
	// Multiple safety violations
	if len(recWithConf.SafetyResult.Violations) >= 3 {
		return true
	}
	
	return false
}
