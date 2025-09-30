package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"path/filepath"
	"sort"
	"strings"

	"go-pickleball/src/config"
	"database/sql"
	_ "github.com/lib/pq"
)

func main() {
	log.Println("Starting database migrations...")

	// Load configuration
	cfg := config.Load()

	// Connect to database
	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Test connection
	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	log.Println("Database connection established")

	// Create migrations table if it doesn't exist
	if err := createMigrationsTable(db); err != nil {
		log.Fatalf("Failed to create migrations table: %v", err)
	}

	// Get list of migration files
	migrationFiles, err := getMigrationFiles()
	if err != nil {
		log.Fatalf("Failed to get migration files: %v", err)
	}

	// Execute migrations
	for _, file := range migrationFiles {
		if err := executeMigration(db, file); err != nil {
			log.Fatalf("Failed to execute migration %s: %v", file, err)
		}
	}

	log.Println("All migrations completed successfully")
}

// createMigrationsTable creates a table to track executed migrations
func createMigrationsTable(db *sql.DB) error {
	query := `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version VARCHAR(255) PRIMARY KEY,
			executed_at TIMESTAMPTZ DEFAULT now()
		)
	`
	_, err := db.Exec(query)
	return err
}

// getMigrationFiles returns a sorted list of migration files
func getMigrationFiles() ([]string, error) {
	files, err := ioutil.ReadDir("../../migrations")
	if err != nil {
		return nil, fmt.Errorf("failed to read migrations directory: %w", err)
	}

	var migrationFiles []string
	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".sql") {
			migrationFiles = append(migrationFiles, file.Name())
		}
	}

	// Sort files to ensure they run in order
	sort.Strings(migrationFiles)
	return migrationFiles, nil
}

// executeMigration executes a single migration file if it hasn't been run
func executeMigration(db *sql.DB, filename string) error {
	// Check if migration has already been executed
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM schema_migrations WHERE version = $1", filename).Scan(&count)
	if err != nil {
		return fmt.Errorf("failed to check migration status: %w", err)
	}

	if count > 0 {
		log.Printf("Migration %s already executed, skipping", filename)
		return nil
	}

	// Read migration file
	content, err := ioutil.ReadFile(filepath.Join("../../migrations", filename))
	if err != nil {
		return fmt.Errorf("failed to read migration file: %w", err)
	}

	log.Printf("Executing migration: %s", filename)

	// Execute migration in a transaction
	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Execute the migration SQL
	_, err = tx.Exec(string(content))
	if err != nil {
		return fmt.Errorf("failed to execute migration SQL: %w", err)
	}

	// Record the migration as executed
	_, err = tx.Exec("INSERT INTO schema_migrations (version) VALUES ($1)", filename)
	if err != nil {
		return fmt.Errorf("failed to record migration: %w", err)
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit migration: %w", err)
	}

	log.Printf("Migration %s completed successfully", filename)
	return nil
}
