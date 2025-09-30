.PHONY: migrate embed backfill rag help dev-setup clean

# RAG Stack Orchestration Makefile
# This Makefile coordinates the entire RAG pipeline across Go and Python services

# Load environment variables if .env exists
-include .env
export

help: ## Show this help message
	@echo "RAG Stack Commands:"
	@echo "=================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

migrate: ## Run Go database migrator
	@echo "Running database migrations..."
	cd backend/go && go run src/cmd/migrate/main.go

embed: ## Start Python embedding service on port 8008
	@echo "Starting Python embedding service..."
	cd backend/python/embed_service && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && python3 main.py

backfill: ## Run Go backfill process for existing paddle data
	@echo "Running backfill process..."
	cd backend/go && go run src/cmd/backfill/main.go

rag: ## Start RAG retrieval service
	@echo "Starting RAG retrieval service..."
	cd backend/go && go run src/cmd/rag/main.go

# Development helpers
dev-setup: ## Set up development environment
	@echo "Setting up development environment..."
	@if [ ! -f .env ]; then cp .env.example .env; echo "Created .env from .env.example"; fi
	@echo "Please edit .env with your actual database credentials"

clean: ## Clean up temporary files
	@echo "Cleaning up..."
	find . -name "*.pyc" -delete
	find . -name "__pycache__" -type d -exec rm -rf {} +
