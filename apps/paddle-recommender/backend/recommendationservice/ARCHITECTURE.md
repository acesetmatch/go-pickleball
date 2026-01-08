<!-- @format -->

# Paddle Recommendation Engine - Complete Specification

## Project Overview

An enhanced Python-based microservice that provides AI-powered pickleball paddle recommendations using vector similarity search, multi-factor scoring algorithms, and comprehensive user preference analysis.

## Complete Project Structure

```
paddle-recommendation-service/
├── app/
│   ├── __init__.py
│   ├── main.py                        # FastAPI application entry point
│   ├── config.py                      # Configuration management
│   ├── database.py                    # Database connection & models
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── preferences.py            # Enhanced user preference models
│   │   ├── paddle.py                 # Paddle data models
│   │   ├── recommendations.py        # Recommendation response models
│   │   └── enums.py                  # Shared enums (SkillLevel, PlayStyle, etc.)
│   │
│   ├── recommendation/
│   │   ├── __init__.py
│   │   ├── enhanced_engine.py        # Main recommendation engine
│   │   ├── enhanced_scoring.py       # Enhanced scoring algorithms
│   │   ├── vector_store.py           # ChromaDB vector operations
│   │   ├── embeddings.py             # Embedding generation
│   │   ├── filters.py                # Filtering logic
│   │   └── utils.py                  # Helper functions
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── recommendations.py    # Recommendation endpoints
│   │   │   ├── paddles.py           # Paddle search/info endpoints
│   │   │   ├── validation.py        # Preference validation endpoints
│   │   │   └── health.py            # Health check endpoints
│   │   ├── middleware.py            # Custom middleware (auth, logging, etc.)
│   │   └── dependencies.py          # FastAPI dependencies
│   │
│   ├── data/
│   │   ├── __init__.py
│   │   ├── ingestion.py             # Data loading from PostgreSQL
│   │   ├── sync.py                  # Database sync operations
│   │   ├── validation.py            # Data quality checks
│   │   └── transformers.py          # Data transformation utilities
│   │
│   ├── cache/
│   │   ├── __init__.py
│   │   ├── redis_client.py          # Redis connection management
│   │   ├── cache_keys.py            # Cache key generation
│   │   └── cache_manager.py         # Cache operations
│   │
│   ├── monitoring/
│   │   ├── __init__.py
│   │   ├── metrics.py               # Prometheus metrics
│   │   ├── logging.py               # Structured logging setup
│   │   └── tracing.py               # Distributed tracing (optional)
│   │
│   └── utils/
│       ├── __init__.py
│       ├── exceptions.py            # Custom exceptions
│       ├── validators.py            # Input validators
│       └── constants.py             # Application constants
│
├── scripts/
│   ├── init_vector_store.py         # Initialize ChromaDB
│   ├── sync_paddle_data.py          # Sync paddle data
│   ├── generate_embeddings.py       # Batch embedding generation
│   ├── validate_data.py             # Data quality checks
│   └── benchmark.py                 # Performance benchmarking
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py                  # Pytest fixtures
│   ├── unit/
│   │   ├── test_scoring.py
│   │   ├── test_filters.py
│   │   ├── test_vector_store.py
│   │   └── test_models.py
│   ├── integration/
│   │   ├── test_engine.py
│   │   ├── test_api.py
│   │   └── test_data_sync.py
│   └── performance/
│       ├── test_load.py
│       └── test_benchmarks.py
│
├── migrations/
│   └── versions/
│       └── 001_add_recommendation_tracking.sql
│
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── docker-compose.override.yml
│
├── config/
│   ├── .env.example
│   ├── .env.development
│   ├── .env.staging
│   └── .env.production
│
├── docs/
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── ARCHITECTURE.md
│   └── TROUBLESHOOTING.md
│
├── requirements/
│   ├── base.txt                     # Core dependencies
│   ├── dev.txt                      # Development dependencies
│   └── prod.txt                     # Production dependencies
│
├── requirements.txt                  # Points to requirements/prod.txt
├── setup.py                          # Package setup
├── pyproject.toml                    # Python project configuration
├── .gitignore
├── .dockerignore
├── README.md
├── Makefile                          # Common commands
└── LICENSE
```

## Requirements Files

### Base Requirements (`requirements/base.txt`)

```txt
# Core Framework
fastapi==0.109.0
uvicorn[standard]==0.25.0
pydantic==2.5.3
pydantic-settings==2.1.0

# Database
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
asyncpg==0.29.0
alembic==1.13.1

# Vector Store & ML
chromadb==0.4.22
sentence-transformers==2.2.2
langchain==0.1.0
langchain-community==0.0.10
numpy==1.24.3
pandas==2.1.4
scikit-learn==1.3.2

# Embedding Models
torch==2.1.2  # CPU version, for GPU use torch==2.1.2+cu118
transformers==4.36.2

# Caching
redis==5.0.1
hiredis==2.3.2

# HTTP & Async
httpx==0.25.2
aiofiles==23.2.1
asyncio==3.4.3

# Monitoring & Logging
prometheus-client==0.19.0
structlog==24.1.0
python-json-logger==2.0.7
sentry-sdk[fastapi]==1.39.1

# Utilities
python-dotenv==1.0.0
python-multipart==0.0.6
email-validator==2.1.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
tenacity==8.2.3
tqdm==4.66.1

# Data Processing
orjson==3.9.10  # Fast JSON
python-dateutil==2.8.2
pytz==2023.3

# Optional LLM Support
openai==1.6.1  # If using OpenAI
# ollama==0.1.7  # If using local Ollama
# anthropic==0.8.1  # If using Claude
```

### Development Requirements (`requirements/dev.txt`)

```txt
-r base.txt

# Testing
pytest==7.4.3
pytest-asyncio==0.21.1
pytest-cov==4.1.0
pytest-mock==3.12.0
pytest-timeout==2.2.0
pytest-xdist==3.5.0
httpx-mock==0.4.0
factory-boy==3.3.0
faker==21.0.0

# Code Quality
black==23.12.1
flake8==7.0.0
flake8-docstrings==1.7.0
mypy==1.8.0
pylint==3.0.3
isort==5.13.2
pre-commit==3.6.0

# Development Tools
ipython==8.19.0
ipdb==0.13.13
rich==13.7.0  # Better console output
watchdog==3.0.0  # File watching

# Documentation
mkdocs==1.5.3
mkdocs-material==9.5.3
mkdocstrings[python]==0.24.0

# Performance Testing
locust==2.20.0
memory-profiler==0.61.0
py-spy==0.3.14

# Database Tools
pgcli==4.0.1
sqlalchemy-utils==0.41.1
```

### Production Requirements (`requirements/prod.txt`)

```txt
-r base.txt

# Production Server
gunicorn==21.2.0
gevent==23.9.1

# Monitoring
datadog==0.47.0  # If using Datadog
newrelic==9.5.0  # If using New Relic

# Security
cryptography==41.0.7
pydantic[email]==2.5.3
```

## Configuration Files

### Environment Configuration (`.env.example`)

```bash
# Application
APP_NAME=paddle-recommendation-service
APP_VERSION=1.0.0
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_PREFIX=/api/v1
API_TITLE="Paddle Recommendation API"
API_DESCRIPTION="AI-powered pickleball paddle recommendations"
CORS_ORIGINS=["http://localhost:3000","https://yourapp.com"]

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/paddle_db
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=40
DATABASE_POOL_TIMEOUT=30
DATABASE_ECHO=false

# Read Replicas (optional)
READ_REPLICA_1=postgresql://user:password@replica1:5432/paddle_db
READ_REPLICA_2=postgresql://user:password@replica2:5432/paddle_db

# Vector Store (ChromaDB)
CHROMA_PERSIST_DIR=./chroma_db
CHROMA_COLLECTION_NAME=paddle_specs_v2
CHROMA_HOST=localhost  # If using ChromaDB server
CHROMA_PORT=8001

# Embedding Model
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
EMBEDDING_DIMENSION=384
EMBEDDING_BATCH_SIZE=32
USE_GPU=false

# Redis Cache
REDIS_URL=redis://localhost:6379/0
REDIS_PASSWORD=
REDIS_SSL=false
CACHE_TTL_SECONDS=3600
CACHE_KEY_PREFIX=paddle_rec:

# Authentication
JWT_SECRET_KEY=your-secret-key-change-this
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=60

# API Keys (for service-to-service)
API_KEY=your-api-key
INTERNAL_API_KEY=internal-service-key

# Optional LLM Configuration
USE_LLM=false
LLM_PROVIDER=ollama  # ollama, openai, anthropic
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_PERIOD=60

# Monitoring
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090
SENTRY_DSN=
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=0.1

# Data Sync
SYNC_ON_STARTUP=true
SYNC_INTERVAL_MINUTES=60
SYNC_BATCH_SIZE=100

# Performance
MAX_WORKERS=4
REQUEST_TIMEOUT=30
VECTOR_SEARCH_TIMEOUT=5
DATABASE_QUERY_TIMEOUT=10

# Feature Flags
ENABLE_CACHING=true
ENABLE_ALTERNATIVES=false
ENABLE_FEEDBACK=true
ENABLE_A_B_TESTING=false

# External Services
PADDLE_DATA_API=https://api.paddledata.com
WEBHOOK_URL=https://yourapp.com/webhooks/recommendations
```

### Docker Configuration (`docker/docker-compose.yml`)

```yaml
version: '3.8'

services:
  api:
    build:
      context: ..
      dockerfile: docker/Dockerfile
    container_name: paddle-rec-api
    ports:
      - '8000:8000'
      - '9090:9090' # Prometheus metrics
    environment:
      - ENVIRONMENT=development
      - DATABASE_URL=postgresql://paddle:paddle@postgres:5432/paddle_db
      - REDIS_URL=redis://redis:6379/0
      - CHROMA_PERSIST_DIR=/app/chroma_db
    volumes:
      - ../app:/app/app
      - chroma_data:/app/chroma_db
      - ./logs:/app/logs
    depends_on:
      - postgres
      - redis
      - chroma
    networks:
      - paddle-network
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    container_name: paddle-postgres
    environment:
      - POSTGRES_USER=paddle
      - POSTGRES_PASSWORD=paddle
      - POSTGRES_DB=paddle_db
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ../migrations:/docker-entrypoint-initdb.d
    networks:
      - paddle-network

  redis:
    image: redis:7-alpine
    container_name: paddle-redis
    command: redis-server --appendonly yes
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    networks:
      - paddle-network

  chroma:
    image: chromadb/chroma:latest
    container_name: paddle-chroma
    ports:
      - '8001:8000'
    volumes:
      - chroma_server_data:/chroma/chroma
    environment:
      - IS_PERSISTENT=TRUE
    networks:
      - paddle-network

volumes:
  postgres_data:
  redis_data:
  chroma_data:
  chroma_server_data:

networks:
  paddle-network:
    driver: bridge
```

### Dockerfile (`docker/Dockerfile`)

```dockerfile
# Multi-stage build for smaller final image
FROM python:3.10-slim as builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements/prod.txt .
RUN pip install --user --no-cache-dir -r prod.txt

# Final stage
FROM python:3.10-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 appuser && \
    mkdir -p /app/logs /app/chroma_db && \
    chown -R appuser:appuser /app

# Copy Python packages from builder
COPY --from=builder /root/.local /home/appuser/.local

# Set working directory
WORKDIR /app

# Copy application code
COPY --chown=appuser:appuser . .

# Switch to non-root user
USER appuser

# Add Python packages to PATH
ENV PATH=/home/appuser/.local/bin:$PATH

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Expose ports
EXPOSE 8000 9090

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### Makefile

```makefile
.PHONY: help install dev test clean docker-up docker-down migrate

help:
	@echo "Available commands:"
	@echo "  install    Install dependencies"
	@echo "  dev        Run development server"
	@echo "  test       Run tests"
	@echo "  clean      Clean up temporary files"
	@echo "  docker-up  Start Docker containers"
	@echo "  docker-down Stop Docker containers"
	@echo "  migrate    Run database migrations"

install:
	pip install -r requirements/dev.txt
	pre-commit install

dev:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

test:
	pytest tests/ -v --cov=app --cov-report=html

test-unit:
	pytest tests/unit/ -v

test-integration:
	pytest tests/integration/ -v

clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache
	rm -rf htmlcov
	rm -rf .coverage

docker-up:
	docker-compose -f docker/docker-compose.yml up -d

docker-down:
	docker-compose -f docker/docker-compose.yml down

docker-logs:
	docker-compose -f docker/docker-compose.yml logs -f

migrate:
	alembic upgrade head

format:
	black app/ tests/
	isort app/ tests/

lint:
	flake8 app/ tests/
	mypy app/

sync-data:
	python scripts/sync_paddle_data.py

init-vectors:
	python scripts/init_vector_store.py

benchmark:
	python scripts/benchmark.py
```

## Key Architecture Components

### System Architecture Layers

1. **Client Layer** - Web app, mobile apps, admin portal
2. **API Gateway Layer** - Load balancing, rate limiting, authentication
3. **API Layer** - RESTful endpoints for recommendations, paddles, analytics
4. **Service Layer** - Core business logic (scoring engine, vector search, filtering)
5. **Data Layer** - PostgreSQL, read replicas, ChromaDB, Redis
6. **Infrastructure Layer** - Monitoring, logging, ML models, message queues

### Performance Targets

- Response Time: <500ms (p95)
- Throughput: 1000 req/s
- Cache Hit Rate: >80%
- Vector Search: <100ms
- Accuracy Score: >90%
- Uptime SLA: 99.9%

### Scaling Strategy

- Start: 2 API instances, 1 DB, 1 Redis
- 6 months: 10 API instances, DB cluster, Redis cluster
- 12 months: 50 API instances, sharded DB, distributed cache

### Key Technical Decisions

- **Microservice Architecture** - Each service has single responsibility
- **Read/Write Separation** - Primary for writes, replicas for reads
- **Multi-tier Caching** - Application, Redis, and CDN layers
- **Async Processing** - Background jobs for heavy operations
- **Horizontal Scaling** - All services designed to scale out
- **Vector Embeddings** - 384-dimensional using Sentence-BERT
- **Progressive Filter Relaxation** - Ensures results even with strict criteria
