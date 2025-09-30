# Go Pickleball RAG Stack

A RAG (Retrieval-Augmented Generation) system for pickleball paddle data using Go, PostgreSQL with pgvector, and Python embedding service.

## Architecture

- **Go Backend**: Main API server with PostgreSQL integration
- **PostgreSQL + pgvector**: Vector database for embeddings storage
- **Python Embed Service**: Lightweight embedding generation service
- **Frontend**: Next.js application

## Quick Start

### Prerequisites

- Go 1.21+
- Python 3.9+
- PostgreSQL 15+ with pgvector extension
- Node.js 18+ (for frontend)

### Setup

1. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your actual database credentials
   ```

2. **Database Setup**
   ```bash
   # Create PostgreSQL database with pgvector extension
   createdb paddles
   psql paddles -c "CREATE EXTENSION vector;"
   ```

3. **Run Database Migrations**
   ```bash
   make migrate
   ```

4. **Start Python Embedding Service**
   ```bash
   make embed
   ```

5. **Backfill Existing Data**
   ```bash
   make backfill
   ```

6. **Start RAG Retriever Service**
   ```bash
   make rag
   ```

## Make Commands

- `make migrate` - Run Go database migrator
- `make embed` - Start Python embedding service on port 8008
- `make backfill` - Backfill existing paddle data with embeddings
- `make rag` - Start RAG retrieval service

## Development

The system loads environment variables from `.env` file. Make sure to configure:

- `DATABASE_URL`: PostgreSQL connection string
- `EMBED_URL`: Python embedding service endpoint

## Data Flow

1. Paddle data is scraped and stored in PostgreSQL
2. Python service generates embeddings for paddle descriptions
3. Embeddings are stored in pgvector-enabled tables
4. RAG system retrieves relevant paddles based on semantic similarity
