#!/bin/bash

# Local Development Script for Go Pickleball Backend
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏓 Starting Go Pickleball Backend Locally${NC}"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "go.mod" ]; then
    echo -e "${RED}❌ Please run this script from the backend/go directory${NC}"
    exit 1
fi

# Function to check if a service is running
check_service() {
    local service_name=$1
    local port=$2
    if nc -z localhost $port 2>/dev/null; then
        echo -e "${GREEN}✅ $service_name is running on port $port${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  $service_name is not running on port $port${NC}"
        return 1
    fi
}

# Function to wait for service
wait_for_service() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}⏳ Waiting for $service_name to be ready...${NC}"
    while [ $attempt -le $max_attempts ]; do
        if nc -z localhost $port 2>/dev/null; then
            echo -e "${GREEN}✅ $service_name is ready!${NC}"
            return 0
        fi
        echo -n "."
        sleep 1
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ $service_name failed to start after $max_attempts seconds${NC}"
    return 1
}

# Check for required tools
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"
if ! command -v go &> /dev/null; then
    echo -e "${RED}❌ Go is not installed${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites found${NC}"

# Load environment variables
echo -e "${YELLOW}📋 Setting up environment...${NC}"
if [ -f "../../.env" ]; then
    echo -e "${GREEN}📄 Loading .env file${NC}"
    export $(grep -v '^#' ../../.env | xargs)
else
    echo -e "${YELLOW}⚠️  No .env file found, using defaults${NC}"
fi

# Set default environment variables
export DATABASE_URL=${DATABASE_URL:-"postgres://postgres:postgres@localhost:5432/pickleball_db?sslmode=disable"}
export PORT=${PORT:-"8080"}

echo -e "${BLUE}🔧 Configuration:${NC}"
echo -e "  Database: ${DATABASE_URL}"
echo -e "  Port: ${PORT}"
if [ -n "$EMBED_URL" ]; then
    echo -e "  Embed Service: ${EMBED_URL}"
else
    echo -e "  Embed Service: ${YELLOW}Not configured${NC}"
fi

# Start database if not running
echo -e "${YELLOW}📋 Step 1: Starting PostgreSQL...${NC}"
if ! check_service "PostgreSQL" 5432; then
    echo -e "${YELLOW}🚀 Starting PostgreSQL with Docker Compose...${NC}"
    docker-compose up -d postgres
    wait_for_service "PostgreSQL" 5432
else
    echo -e "${GREEN}✅ PostgreSQL already running${NC}"
fi

# Run migrations
echo -e "${YELLOW}📋 Step 2: Running database migrations...${NC}"
cd src
go run server/db/migrate.go
echo -e "${GREEN}✅ Migrations completed${NC}"

# Download dependencies
echo -e "${YELLOW}📋 Step 3: Installing Go dependencies...${NC}"
go mod download
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Optional: Start embed service if configured
if [ -n "$EMBED_URL" ]; then
    echo -e "${YELLOW}📋 Step 4: Checking embed service...${NC}"
    if ! check_service "Embed Service" 8000; then
        echo -e "${YELLOW}⚠️  Embed service not running. Start it manually if needed.${NC}"
        echo -e "${YELLOW}   Example: cd ../python && python -m embed_service.main${NC}"
    fi
fi

# Start the Go backend
echo -e "${YELLOW}📋 Step 5: Starting Go backend server...${NC}"
echo -e "${GREEN}🚀 Starting server on port ${PORT}...${NC}"
echo -e "${BLUE}📊 Telemetry enabled - you'll see structured JSON logs${NC}"
echo -e "${BLUE}🔗 API will be available at: http://localhost:${PORT}${NC}"
echo ""
echo -e "${YELLOW}💡 Available endpoints:${NC}"
echo -e "  GET  /health                    - Health check"
echo -e "  POST /llm/explain_and_plan     - LLM recommendations"
echo -e "  POST /rag/retrieve             - RAG snippet retrieval"
echo ""
echo -e "${YELLOW}📝 Example request:${NC}"
echo -e "  curl -X POST http://localhost:${PORT}/llm/explain_and_plan \\"
echo -e "    -H 'Content-Type: application/json' \\"
echo -e "    -d @src/test_request.json"
echo ""
echo -e "${RED}Press Ctrl+C to stop the server${NC}"
echo "=========================================="

# Run the server
go run .
