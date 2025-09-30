package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config holds all configuration for the application
type Config struct {
	DatabaseURL string
	EmbedURL    string
	Port        string
}

// Load loads configuration from environment variables and .env file
func Load() *Config {
	// Load .env file if it exists (look in project root)
	if err := godotenv.Load("../../.env"); err != nil {
		log.Printf("Warning: Could not load .env file: %v", err)
	}

	return &Config{
		DatabaseURL: getEnv("DATABASE_URL", "postgres://app:app@localhost:5432/paddles?sslmode=disable"),
		EmbedURL:    getEnv("EMBED_URL", "http://localhost:8008/embed"),
		Port:        getEnv("PORT", "8080"),
	}
}

// getEnv gets an environment variable with a fallback default
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
