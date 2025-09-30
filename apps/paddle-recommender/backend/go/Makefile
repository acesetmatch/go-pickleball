# Go Pickleball Backend - Development Commands

.PHONY: help dev dev-full stop clean test migrate build logs

# Default target
help:
	@echo "🏓 Go Pickleball Backend - Available Commands:"
	@echo ""
	@echo "  make dev       - Start backend with database (quick start)"
	@echo "  make dev-full  - Start full stack (backend + database + services)"
	@echo "  make stop      - Stop all services"
	@echo "  make clean     - Stop and remove all containers/volumes"
	@echo "  make test      - Run tests locally"
	@echo "  make migrate   - Run database migrations"
	@echo "  make build     - Build the Go application"
	@echo "  make logs      - View backend logs"
	@echo ""
	@echo "🔧 Environment:"
	@echo "  DATABASE_URL: ${DATABASE_URL}"
	@echo "  EMBED_URL:    ${EMBED_URL}"

# Quick development - just backend + database
dev:
	@echo "🚀 Starting backend with database..."
	docker-compose up -d postgres
	@echo "⏳ Waiting for database..."
	@sleep 5
	@echo "🔄 Running migrations..."
	@cd src && go run server/db/migrate.go
	@echo "✅ Starting Go backend..."
	@cd src && go run .

# Full development stack
dev-full:
	@echo "🚀 Starting full development stack..."
	docker-compose up -d
	@echo "⏳ Waiting for services..."
	@sleep 10
	@echo "🔄 Running migrations..."
	@cd src && go run server/db/migrate.go
	@echo "✅ All services started!"
	@echo "📊 View logs: make logs"

# Stop all services
stop:
	@echo "🛑 Stopping all services..."
	docker-compose down

# Clean everything
clean:
	@echo "🧹 Cleaning up containers and volumes..."
	docker-compose down -v --remove-orphans
	docker system prune -f

# Run tests
test:
	@echo "🧪 Running local tests..."
	@./test-ci-local.sh

# Run migrations only
migrate:
	@echo "🔄 Running database migrations..."
	@cd src && go run server/db/migrate.go

# Build application
build:
	@echo "🔨 Building Go application..."
	@cd src && go build -o ../bin/pickleball-server .
	@echo "✅ Built: bin/pickleball-server"

# View logs
logs:
	@echo "📊 Viewing backend logs (Ctrl+C to exit)..."
	docker-compose logs -f api

# Development with hot reload (requires air)
dev-hot:
	@echo "🔥 Starting with hot reload..."
	@if ! command -v air > /dev/null; then \
		echo "Installing air for hot reload..."; \
		go install github.com/cosmtrek/air@latest; \
	fi
	docker-compose up -d postgres
	@sleep 5
	@cd src && go run server/db/migrate.go
	@cd src && air

# Database shell
db-shell:
	@echo "🗄️  Opening database shell..."
	docker-compose exec postgres psql -U postgres -d pickleball_db

# Reset database
db-reset:
	@echo "🔄 Resetting database..."
	docker-compose down postgres
	docker volume rm go_postgres_data || true
	docker-compose up -d postgres
	@sleep 5
	@cd src && go run server/db/migrate.go
	@echo "✅ Database reset complete"
