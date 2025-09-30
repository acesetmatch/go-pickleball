package rag

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
	"crypto/sha1"
	"encoding/hex"

	"go-pickleball/src/server/obs"
)

// Evidence represents a piece of evidence from retrieval
type Evidence struct {
	Source string `json:"source"`
	Text   string `json:"text"`
}

// hashString returns a hex sha1 of s
func hashString(s string) string {
    h := sha1.Sum([]byte(s))
    return hex.EncodeToString(h[:])
}

// RetrieveRequest represents a request to retrieve relevant snippets
type RetrieveRequest struct {
	PaddleID string `json:"paddle_id"`
	Query    string `json:"query"`
	K        int    `json:"k"`
}

// RetrieveResponse represents the response from retrieve
type RetrieveResponse struct {
	Snippets []Evidence `json:"snippets"`
}

// RetrieveHandler handles HTTP requests for the RAG retrieve endpoint
func RetrieveHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	// Parse request body
	var req RetrieveRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}
	
	// Validate request
	if req.PaddleID == "" {
		http.Error(w, "paddle_id is required", http.StatusBadRequest)
		return
	}
	if req.Query == "" {
		http.Error(w, "query is required", http.StatusBadRequest)
		return
	}
	if req.K <= 0 {
		req.K = 3 // Default to 3 if not specified or invalid
	}
	
	// RAG span with timings
	ragEnd := obs.NewSpan(r.Context(), "rag", map[string]any{
		"paddle_id":   req.PaddleID,
		"query_hash":  hashString(req.Query),
		"k":           req.K,
		"data_source": "db",
	})

	// measure embed time (placeholder)
	startEmbed := time.Now()
	// ... embed work would go here ...
	embedMs := float64(time.Since(startEmbed)) / float64(time.Millisecond)

	// Retrieve snippets and measure sql time
	startSQL := time.Now()
	snippets, err := retrieveSnippets(req.PaddleID, req.Query, req.K)
	sqlMs := float64(time.Since(startSQL)) / float64(time.Millisecond)
	if err != nil {
		log.Printf("Error retrieving snippets: %v", err)
		ragEnd(map[string]any{"error": err.Error(), "embed_ms": embedMs, "sql_ms": sqlMs})
		http.Error(w, "Error retrieving snippets", http.StatusInternalServerError)
		return
	}
	
	// Create response
	response := RetrieveResponse{
		Snippets: snippets,
	}
	
	// Set response headers
	w.Header().Set("Content-Type", "application/json")
	
	// Return response
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error encoding response: %v", err)
		ragEnd(map[string]any{"error": err.Error(), "embed_ms": embedMs, "sql_ms": sqlMs})
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
		return
	}

	// finish span
	ragEnd(map[string]any{
		"returned_snippets": len(snippets),
		"rag_snippets_used": len(snippets) > 0,
		"embed_ms":          embedMs,
		"sql_ms":            sqlMs,
	})
}

// retrieveSnippets performs the actual snippet retrieval
// This is a placeholder implementation - you'll need to replace this with your actual retrieval logic
func retrieveSnippets(paddleID, query string, k int) ([]Evidence, error) {
	// TODO: Implement actual retrieval logic
	// This could involve:
	// 1. Querying a vector database with the query
	// 2. Filtering results by paddle_id
	// 3. Returning the top k most relevant snippets
	
	// For now, return mock data to demonstrate the structure
	mockSnippets := []Evidence{
		{
			Source: fmt.Sprintf("paddle_review_%s_1", paddleID),
			Text:   fmt.Sprintf("This paddle shows excellent %s characteristics based on our testing.", query),
		},
		{
			Source: fmt.Sprintf("paddle_specs_%s", paddleID),
			Text:   fmt.Sprintf("Technical specifications indicate optimal performance for %s requirements.", query),
		},
		{
			Source: fmt.Sprintf("user_feedback_%s_3", paddleID),
			Text:   fmt.Sprintf("Users consistently report improved %s when using this paddle.", query),
		},
	}
	
	// Return up to k snippets
	if len(mockSnippets) > k {
		return mockSnippets[:k], nil
	}
	
	return mockSnippets, nil
}
