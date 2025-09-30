package llm

import (
    "bytes"
    "context"
    "crypto/sha1"
    "encoding/hex"
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "strings"

    "go-pickleball/src/server/obs"
)

// Profile represents a user's profile for paddle recommendations
type Profile struct {
    Setup struct {
        PainPoints []string `json:"pain_points"`
    } `json:"setup"`
    Style struct {
        Styles []string `json:"styles"`
    } `json:"style"`
    Physical struct {
        ArmSensitivity bool `json:"arm_sensitivity"`
    } `json:"physical"`
}

// Candidate represents a paddle candidate with modified specs
type Candidate struct {
    PaddleID    string                 `json:"paddle_id"`
    ModdedSpecs map[string]interface{} `json:"modded_specs"`
}

// Evidence represents a piece of evidence supporting a recommendation
type Evidence struct {
    Source string `json:"source"`
    Text   string `json:"text"`
}

// Recommendation represents a paddle recommendation with evidence
type Recommendation struct {
    PaddleID string     `json:"paddle_id"`
    Evidence []Evidence `json:"evidence"`
    // Add other fields as needed for the recommendation
}

// ExplainAndPlanRequest represents the request to explain and plan
type ExplainAndPlanRequest struct {
    Profile    Profile     `json:"profile"`
    Candidates []Candidate `json:"candidates"`
}

// ExplainAndPlanResponse represents the response from explain and plan
type ExplainAndPlanResponse struct {
    Recommendations []Recommendation `json:"recommendations"`
}

// RAGRetrieveRequest represents a request to the RAG retrieve endpoint
type RAGRetrieveRequest struct {
    PaddleID string `json:"paddle_id"`
    Query    string `json:"query"`
    K        int    `json:"k"`
}

// RAGRetrieveResponse represents the response from RAG retrieve
type RAGRetrieveResponse struct {
    Snippets []Evidence `json:"snippets"`
}

// hashString returns a hex sha1 of s
func hashString(s string) string {
    h := sha1.Sum([]byte(s))
    return hex.EncodeToString(h[:])
}

// hashStrings hashes concatenated strings with separator
func hashStrings(parts []string) string {
    h := sha1.New()
    for i, p := range parts {
        if i > 0 {
            _, _ = h.Write([]byte("|"))
        }
        _, _ = h.Write([]byte(p))
    }
    return hex.EncodeToString(h.Sum(nil))
}

// buildQuery builds a search query from user profile information
func buildQuery(pains []string, styles []string, armSensitive bool) string {
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

// has checks if a slice contains a specific string
func has(ss []string, k string) bool {
    for _, s := range ss {
        if s == k {
            return true
        }
    }
    return false
}

// ExplainAndPlan orchestrates the explanation and planning process
func ExplainAndPlan(ctx context.Context, profile Profile, candidates []Candidate) (*ExplainAndPlanResponse, error) {
    recommendations := make([]Recommendation, 0, len(candidates))
    
    // overall llm span
    llmEnd := obs.NewSpan(ctx, "llm", map[string]any{
        "component": "orchestrator",
    })
    defer llmEnd(map[string]any{
        "tokens_in":  0,
        "tokens_out": 0,
        "tool_calls": []string{"rag"},
    })

    // Build query from profile
    q := buildQuery(profile.Setup.PainPoints, profile.Style.Styles, profile.Physical.ArmSensitivity)
    
    // ranker span (placeholder)
    profHash := hashStrings(append(append(profile.Setup.PainPoints, profile.Style.Styles...), fmt.Sprintf("%v", profile.Physical.ArmSensitivity)))
    rankEnd := obs.NewSpan(ctx, "ranker", map[string]any{
        "profile_hash": profHash,
        "k":            3,
    })
    rankEnd(nil)

    for _, candidate := range candidates {
        // Simulator span for paddle modifications
        simEnd := obs.NewSpan(ctx, "sim", map[string]any{
            "paddle_id": candidate.PaddleID,
        })
        
        // Mock simulator calculations (placeholder)
        newSW := 215.0 + 5.0  // new swing weight
        newBalance := 7.2 + 0.3  // new balance point
        
        simEnd(map[string]any{
            "plan_grams": "2g head, 1g handle",
            "new_sw": newSW,
            "new_balance": newBalance,
        })

        // For each candidate, retrieve relevant snippets
        snippets, err := retrieveSnippets(ctx, candidate.PaddleID, q, 3)
        if err != nil {
            log.Printf("Error retrieving snippets for paddle %s: %v", candidate.PaddleID, err)
            // Continue with empty snippets rather than failing completely
            snippets = []Evidence{}
        }
		
		recommendation := Recommendation{
			PaddleID: candidate.PaddleID,
			Evidence: snippets,
		}
		recommendations = append(recommendations, recommendation)
    }
	
    return &ExplainAndPlanResponse{
		Recommendations: recommendations,
	}, nil
}

// retrieveSnippets calls the RAG retrieve endpoint to get relevant snippets
func retrieveSnippets(ctx context.Context, paddleID, query string, k int) ([]Evidence, error) {
    // Create the request payload
    reqPayload := RAGRetrieveRequest{
        PaddleID: paddleID,
        Query:    query,
        K:        k,
    }

    // Marshal to JSON
    jsonData, err := json.Marshal(reqPayload)
    if err != nil {
        return nil, fmt.Errorf("error marshaling request: %v", err)
    }

    // Make POST request to retriever endpoint with context
    req, err := http.NewRequestWithContext(ctx, http.MethodPost, "http://localhost:8080/rag/retrieve", bytes.NewBuffer(jsonData))
    if err != nil {
        return nil, fmt.Errorf("error creating request: %v", err)
    }
    req.Header.Set("Content-Type", "application/json")
    obs.InjectRequestID(ctx, req)

    // span from llm perspective about rag
    ragEnd := obs.NewSpan(ctx, "rag", map[string]any{
        "paddle_id":   paddleID,
        "query_hash":  hashString(query),
        "k":           k,
        "data_source": "db",
    })

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        ragEnd(map[string]any{"error": err.Error()})
        return nil, fmt.Errorf("error calling retriever: %v", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        ragEnd(map[string]any{"status": resp.StatusCode})
        return nil, fmt.Errorf("retriever returned status %d", resp.StatusCode)
    }

    // Parse response
    var retrieveResp RAGRetrieveResponse
    if err := json.NewDecoder(resp.Body).Decode(&retrieveResp); err != nil {
        ragEnd(map[string]any{"error": err.Error()})
        return nil, fmt.Errorf("error decoding response: %v", err)
    }
    ragEnd(map[string]any{
        "returned_snippets": len(retrieveResp.Snippets),
        "rag_snippets_used": len(retrieveResp.Snippets) > 0,
    })

    return retrieveResp.Snippets, nil
}

// ExplainAndPlanHandler handles HTTP requests for the explain and plan endpoint
func ExplainAndPlanHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    // Parse request body
    var req ExplainAndPlanRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
        return
    }

    // Process the request
    response, err := ExplainAndPlan(r.Context(), req.Profile, req.Candidates)
    if err != nil {
        log.Printf("Error in ExplainAndPlan: %v", err)
        http.Error(w, "Internal server error", http.StatusInternalServerError)
        return
    }

    // Set response headers
    w.Header().Set("Content-Type", "application/json")

    // Return response
    if err := json.NewEncoder(w).Encode(response); err != nil {
        log.Printf("Error encoding response: %v", err)
        http.Error(w, "Error encoding response", http.StatusInternalServerError)
        return
    }
}
