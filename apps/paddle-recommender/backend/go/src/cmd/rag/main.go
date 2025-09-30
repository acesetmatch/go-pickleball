package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"go-pickleball/src/config"
)

type RetrieveRequest struct {
	PaddleID string `json:"paddle_id" binding:"required"`
	Query    string `json:"query" binding:"required"`
	K        int    `json:"k"`
}

type RetrieveResponse struct {
	Snippets []Snippet `json:"snippets"`
}

type Snippet struct {
	Source string `json:"source"`
	Kind   string `json:"kind"`
	Text   string `json:"text"`
}

type EmbedRequest struct {
	Texts []string `json:"texts"`
}

type EmbedResponse struct {
	Vectors [][]float64 `json:"vectors"`
}

var pool *pgxpool.Pool
var embedURL string

func main() {
	log.Println("Starting RAG retrieval service...")

	// Load configuration
	cfg := config.Load()
	embedURL = cfg.EmbedURL

	// Connect to database using pgxpool
	ctx := context.Background()
	var err error
	pool, err = pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	log.Println("Database connection established")

	// Set up Gin router
	r := gin.Default()

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// RAG retrieve endpoint
	r.POST("/rag/retrieve", handleRetrieve)

	// Start server
	port := "8080"
	log.Printf("RAG retrieval service starting on port %s", port)
	log.Fatal(r.Run(":" + port))
}

func handleRetrieve(c *gin.Context) {
	var req RetrieveRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate and set defaults for k
	if req.K <= 0 {
		req.K = 3 // default
	}
	if req.K > 5 {
		req.K = 5 // cap at 5
	}

	// Get embedding for the query
	queryVector, err := getQueryEmbedding(req.Query)
	if err != nil {
		log.Printf("Failed to get query embedding: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process query"})
		return
	}

	// Perform semantic search
	snippets, err := searchSimilarSnippets(c.Request.Context(), req.PaddleID, queryVector, req.K)
	if err != nil {
		log.Printf("Failed to search snippets: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search snippets"})
		return
	}

	// Return results
	response := RetrieveResponse{
		Snippets: snippets,
	}
	c.JSON(http.StatusOK, response)
}

func getQueryEmbedding(query string) ([]float64, error) {
	reqBody := EmbedRequest{Texts: []string{query}}
	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	resp, err := http.Post(embedURL, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("embedding service returned status %d", resp.StatusCode)
	}

	var embedResp EmbedResponse
	err = json.NewDecoder(resp.Body).Decode(&embedResp)
	if err != nil {
		return nil, err
	}

	if len(embedResp.Vectors) == 0 {
		return nil, fmt.Errorf("no embedding returned")
	}

	return embedResp.Vectors[0], nil
}

func searchSimilarSnippets(ctx context.Context, paddleID string, queryVector []float64, k int) ([]Snippet, error) {
	// Convert embedding to JSON string for pgvector
	embeddingJSON, err := json.Marshal(queryVector)
	if err != nil {
		return nil, err
	}

	query := `
		WITH cand AS (
			SELECT source, kind, text, embedding
			FROM rag_snippets
			WHERE paddle_id = $1 AND embedding IS NOT NULL
		)
		SELECT source, kind, text
		FROM cand
		ORDER BY embedding <-> $2::vector
		LIMIT $3`

	rows, err := pool.Query(ctx, query, paddleID, string(embeddingJSON), k)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var snippets []Snippet
	for rows.Next() {
		var snippet Snippet
		err := rows.Scan(&snippet.Source, &snippet.Kind, &snippet.Text)
		if err != nil {
			return nil, err
		}
		snippets = append(snippets, snippet)
	}

	return snippets, rows.Err()
}
