package main

import (
	"context"
	"fmt"
	"os"

	"go-pickleball/src/llm"
	"go-pickleball/src/server/obs"
)

func main() {
	fmt.Println("🔍 Testing Telemetry System")
	fmt.Println("====================================================")
	
	// Create context with request ID (simulating middleware)
	ctx := context.Background()
	reqID := "test-req-abc123"
	
	// This simulates what the middleware does
	ctx = context.WithValue(ctx, &struct{ k string }{"req_id"}, reqID)
	
	fmt.Printf("📋 Request ID: %s\n", obs.GetRequestID(ctx))
	fmt.Println("\n📊 Watch for structured JSON logs below:")
	fmt.Println("--------------------------------------------------")
	
	// Test profile
	profile := llm.Profile{
		Setup: struct {
			PainPoints []string `json:"pain_points"`
		}{
			PainPoints: []string{"resets_short", "blocks_shallow"},
		},
		Style: struct {
			Styles []string `json:"styles"`
		}{
			Styles: []string{"hand_speed"},
		},
		Physical: struct {
			ArmSensitivity bool `json:"arm_sensitivity"`
		}{
			ArmSensitivity: true,
		},
	}
	
	// Test candidates
	candidates := []llm.Candidate{
		{
			PaddleID: "ENGAGE-PURSUIT-MX-6.0",
			ModdedSpecs: map[string]interface{}{
				"lead_weight": 3.0,
			},
		},
	}
	
	// This will generate telemetry spans
	response, err := llm.ExplainAndPlan(ctx, profile, candidates)
	
	fmt.Println("--------------------------------------------------")
	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		os.Exit(1)
	}
	
	fmt.Printf("✅ Success! Generated %d recommendations\n", len(response.Recommendations))
	fmt.Printf("📈 Check the JSON logs above - each shows:\n")
	fmt.Printf("   • request_id: %s\n", reqID)
	fmt.Printf("   • event: llm_start/end, ranker_start/end, sim_start/end, rag_start/end\n")
	fmt.Printf("   • duration_ms: timing for each span\n")
	fmt.Printf("   • component-specific fields (profile_hash, paddle_id, etc.)\n")
	
	fmt.Println("\n🎯 This demonstrates end-to-end telemetry tracing!")
}
