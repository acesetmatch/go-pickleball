# Paddle Recommendation Service

AI-powered pickleball paddle recommendations using vector similarity search and multi-factor scoring algorithms.

## 🚀 Quick Start

```bash
# 1. Create virtual environment
python3 -m venv venv

# 2. Activate virtual environment
source venv/bin/activate  # Linux/Mac
# OR
venv\Scripts\activate  # Windows

# 3. Install dependencies
pip install -r requirements/dev.txt

# 4. Set up environment
cp config/.env.example .env
# Edit .env with your database credentials

# 5. Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 6. Run tests
pytest tests/ -v
```

## 📁 Project Structure

```
recommendationservice/
├── app/                      # Main application code
│   ├── api/                  # API routes and middleware
│   ├── cache/                # Caching layer (Redis)
│   ├── data/                 # Data ingestion and sync
│   ├── models/               # Pydantic models and SQLAlchemy
│   ├── monitoring/           # Metrics and logging
│   ├── recommendation/       # Core recommendation engine
│   ├── utils/                # Utilities and helpers
│   ├── config.py             # Configuration management
│   └── main.py               # FastAPI app entry point
├── tests/                    # Test suite
├── scripts/                  # Utility scripts
├── config/                   # Configuration files
├── requirements/             # Python dependencies
└── docker/                   # Docker configuration
```

## 🏗️ Architecture

### Core Components

1. **API Layer** - FastAPI with auto-generated OpenAPI docs
2. **Recommendation Engine** - Vector search + multi-factor scoring
3. **Vector Store** - ChromaDB with Sentence-BERT embeddings
4. **Caching** - Redis for performance optimization
5. **Database** - PostgreSQL with read replicas
6. **Monitoring** - Prometheus metrics + structured logging

### Tech Stack

- **Framework**: FastAPI, Uvicorn
- **ML/AI**: Sentence-Transformers, ChromaDB, PyTorch
- **Database**: PostgreSQL, SQLAlchemy, Alembic
- **Cache**: Redis
- **Testing**: Pytest
- **Code Quality**: Black, isort, mypy, flake8

## 🔧 Development

### Available Commands

```bash
make help          # Show all available commands
make install       # Install dependencies
make dev           # Run development server
make test          # Run all tests with coverage
make test-unit     # Run unit tests only
make format        # Format code with black and isort
make lint          # Run linters
make clean         # Clean temporary files
```

### Running the Server

```bash
# Using make
make dev

# Using uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Using Python
python3 -m app.main
```

### API Documentation

Once the server is running, visit:

- **Interactive API Docs**: http://localhost:8000/api/v1/docs
- **ReDoc**: http://localhost:8000/api/v1/redoc
- **OpenAPI JSON**: http://localhost:8000/api/v1/openapi.json

### Endpoints

#### Health & Status

- `GET /` - Root endpoint with basic info
- `GET /api/v1/health` - Health check
- `GET /api/v1/ready` - Readiness check (K8s)
- `GET /api/v1/metrics` - Prometheus metrics

#### Recommendations (Coming in Phase 4)

- `POST /api/v1/recommendations/enhanced` - Get paddle recommendations
- `POST /api/v1/recommendations/validate` - Validate user preferences
- `GET /api/v1/recommendations/skill-specs/{level}` - Get skill specifications

#### Paddles (Coming in Phase 5)

- `GET /api/v1/paddles/search` - Search paddles
- `GET /api/v1/paddles/{id}` - Get paddle details
- `POST /api/v1/paddles/compare` - Compare paddles

## 🧪 Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_basic.py -v

# Run with output
pytest -v -s
```

## 📊 Implementation Progress

### ✅ Phase 1: Foundation Setup (COMPLETED)

- [x] Project structure created
- [x] Requirements files configured
- [x] Virtual environment set up
- [x] Configuration management with Pydantic
- [x] Basic FastAPI application
- [x] Health check endpoints
- [x] Basic tests (89% coverage)

### 🚧 Next Steps

- **Phase 2**: Core Models & Database (3-4 hours)
  - SQLAlchemy models for paddles and preferences
  - Database connection setup
  - Enums and validation

- **Phase 3**: Vector Store & Embeddings (4-5 hours)
  - ChromaDB integration
  - Sentence-BERT setup
  - Data ingestion pipeline

- **Phase 4**: Recommendation Engine (6-8 hours)
  - Multi-factor scoring algorithm
  - Vector similarity search
  - Progressive filter relaxation

## 🐳 Docker (Production Ready)

### Quick Start with Docker

```bash
# Production mode - start all services
docker-compose up -d

# Development mode - with hot reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

### Services Included

| Service | URL | Description |
|---------|-----|-------------|
| API | http://localhost:8000 | FastAPI application |
| API Docs | http://localhost:8000/api/v1/docs | Interactive API documentation |
| PostgreSQL | localhost:5432 | Database (user: paddle_user, pass: paddle_pass) |
| Redis | localhost:6379 | Cache layer |
| pgAdmin | http://localhost:5050 | Database admin (dev mode only) |
| Redis Commander | http://localhost:8081 | Redis admin (dev mode only) |

### Common Docker Commands

```bash
# Build images
docker-compose build

# Run tests in container
docker-compose exec api pytest

# Access database
docker-compose exec postgres psql -U paddle_user -d paddle_db

# View running containers
docker-compose ps

# Clean up everything (⚠️ deletes data)
docker-compose down -v

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up
```

### Environment Configuration

Copy the Docker environment template:
```bash
cp .env.docker .env
```

The docker-compose.yml uses sensible defaults for all services.

## 📝 Configuration

Edit `.env` file to configure the application:

```bash
# Application
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/paddle_db

# Vector Store
CHROMA_PERSIST_DIR=./chroma_db

# Redis Cache
REDIS_URL=redis://localhost:6379/0
```

## 🔒 Security

- JWT authentication (configured, not yet implemented)
- API key support for service-to-service calls
- Rate limiting (configured, not yet implemented)
- CORS configured

## 📈 Performance Targets

- Response Time: <500ms (p95)
- Throughput: 1000 req/s
- Cache Hit Rate: >80%
- Vector Search: <100ms
- Uptime SLA: 99.9%

## 📚 Documentation

- [Architecture](./ARCHITECTURE.md) - Detailed architecture documentation
- [Implementation Tasks](./IMPLEMENTATION_TASKS.md) - Task breakdown and progress
- [Quick Start](./QUICK_START.md) - Quick start guide

## 🤝 Contributing

1. Follow code style (black, isort)
2. Write tests for new features
3. Update documentation
4. Run linters before committing

## 📄 License

MIT

---

**Current Status**: Phase 1 Complete ✅
**Next**: Phase 2 - Core Models & Database
**Last Updated**: October 2025
