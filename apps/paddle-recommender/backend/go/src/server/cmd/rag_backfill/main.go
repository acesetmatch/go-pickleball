package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"go-pickleball/src/config"
)

type EmbedRequest struct {
	Texts []string `json:"texts"`
}

type EmbedResponse struct {
	Vectors [][]float64 `json:"vectors"`
}

type Snippet struct {
	ID   string
	Text string
}

func main() {
	log.Println("Starting RAG backfill process...")

	// Load configuration
	cfg := config.Load()

	// Connect to database using pgxpool
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	log.Println("Database connection established")

	// Process snippets in batches
	totalProcessed := 0
	for {
		// Get batch of snippets without embeddings
		snippets, err := getSnippetsWithoutEmbeddings(ctx, pool, 512)
		if err != nil {
			log.Fatalf("Failed to get snippets: %v", err)
		}

		if len(snippets) == 0 {
			log.Println("No more snippets to process")
			break
		}

		log.Printf("Processing batch of %d snippets...", len(snippets))

		// Extract texts for embedding
		texts := make([]string, len(snippets))
		for i, snippet := range snippets {
			texts[i] = snippet.Text
		}

		// Get embeddings from Python service
		embeddings, err := getEmbeddings(cfg.EmbedURL, texts)
		if err != nil {
			log.Fatalf("Failed to get embeddings: %v", err)
		}

		// Update database with embeddings
		err = updateEmbeddings(ctx, pool, snippets, embeddings)
		if err != nil {
			log.Fatalf("Failed to update embeddings: %v", err)
		}

		totalProcessed += len(snippets)
		log.Printf("Updated %d snippets with embeddings (total: %d)", len(snippets), totalProcessed)

		// Small delay to be respectful to the embedding service
		time.Sleep(100 * time.Millisecond)
	}

	log.Printf("Backfill completed! Processed %d snippets total", totalProcessed)
}

func getSnippetsWithoutEmbeddings(ctx context.Context, pool *pgxpool.Pool, limit int) ([]Snippet, error) {
	query := `SELECT id, text FROM rag_snippets WHERE embedding IS NULL LIMIT $1`
	
	rows, err := pool.Query(ctx, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var snippets []Snippet
	for rows.Next() {
		var snippet Snippet
		err := rows.Scan(&snippet.ID, &snippet.Text)
		if err != nil {
			return nil, err
		}
		snippets = append(snippets, snippet)
	}

	return snippets, rows.Err()
}

func getEmbeddings(embedURL string, texts []string) ([][]float64, error) {
	reqBody := EmbedRequest{Texts: texts}
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

	return embedResp.Vectors, nil
}

func updateEmbeddings(ctx context.Context, pool *pgxpool.Pool, snippets []Snippet, embeddings [][]float64) error {
	if len(snippets) != len(embeddings) {
		return fmt.Errorf("mismatch between snippets (%d) and embeddings (%d)", len(snippets), len(embeddings))
	}

	// Use a transaction for batch updates
	tx, err := pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	for i, snippet := range snippets {
		// Convert embedding to pgvector format
		embeddingJSON, err := json.Marshal(embeddings[i])
		if err != nil {
			return err
		}

		query := `UPDATE rag_snippets SET embedding = $1::vector WHERE id = $2`
		_, err = tx.Exec(ctx, query, string(embeddingJSON), snippet.ID)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}
