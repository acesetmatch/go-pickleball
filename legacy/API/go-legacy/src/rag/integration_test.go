package rag

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"testing"
	"time"
)

// TestRAGRetrieveIntegration tests the RAG retrieve endpoint with a real request
func TestRAGRetrieveIntegration(t *testing.T) {
	// Skip if EMBED_URL not set
	embedURL := os.Getenv("EMBED_URL")
	if embedURL == "" {
		t.Skip("EMBED_URL not set, skipping RAG integration test")
	}

	// Wait for services to be ready
	time.Sleep(2 * time.Second)

	// Test request payload
	testReq := RetrieveRequest{
		PaddleID: "ENGAGE-PURSUIT-MX-6.0",
		Query:    "control touch depth resets",
		K:        3,
	}

	// Marshal request
	jsonData, err := json.Marshal(testReq)
	if err != nil {
		t.Fatalf("Failed to marshal test request: %v", err)
	}

	// Make request to RAG endpoint
	resp, err := http.Post("http://localhost:8080/rag/retrieve", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		t.Fatalf("Failed to make RAG request: %v", err)
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("Expected status 200, got %d", resp.StatusCode)
	}

	// Parse response
	var retrieveResp RetrieveResponse
	if err := json.NewDecoder(resp.Body).Decode(&retrieveResp); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	// Assert we got at least 1 snippet
	if len(retrieveResp.Snippets) < 1 {
		t.Fatalf("Expected at least 1 snippet, got %d", len(retrieveResp.Snippets))
	}

	// Validate snippet structure
	snippet := retrieveResp.Snippets[0]
	if snippet.Source == "" {
		t.Error("Expected snippet to have non-empty source")
	}
	if snippet.Text == "" {
		t.Error("Expected snippet to have non-empty text")
	}

	fmt.Printf("✅ RAG integration test passed! Retrieved %d snippets for paddle %s\n", 
		len(retrieveResp.Snippets), testReq.PaddleID)
}
