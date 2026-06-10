# Python Paddle Recommendation Engine

AI-powered pickleball paddle recommendation system using RAG (Retrieval-Augmented Generation) with ChromaDB vector store and semantic search.

## Features

- **Semantic Search**: Uses sentence-transformers to create embeddings of paddle specifications
- **Vector Store**: ChromaDB for efficient similarity search
- **Intelligent Scoring**: Multi-factor scoring algorithm considering:
  - Play style preferences
  - Physical attributes (swing weight, twist weight)
  - Skill level and game format
  - Pain points and performance goals
  - Budget and brand preferences
- **FastAPI Backend**: RESTful API with automatic documentation

## Project Structure

```
python/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application
│   ├── config.py               # Configuration
│   ├── models.py               # Pydantic models
│   ├── database.py             # Database connection
│   ├── recommendation/
│   │   ├── __init__.py
│   │   ├── engine.py           # Main recommendation engine
│   │   ├── vector_store.py     # ChromaDB vector store
│   │   └── scoring.py          # Paddle scoring logic
│   └── data/
│       └── __init__.py
├── requirements.txt
├── .env
├── Dockerfile
└── docker-compose.yml
```

## Installation

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Update `.env` with your database URL:

```bash
DATABASE_URL=postgresql://user:password@localhost/your_database
CHROMA_PERSIST_DIRECTORY=./chroma_db
CHROMA_COLLECTION_NAME=paddle_specs
API_HOST=0.0.0.0
API_PORT=8000
```

### 3. Run the Server

```bash
# Development mode with auto-reload
python -m app.main

# Or using uvicorn directly
uvicorn app.main:app --reload
```

The API will be available at:
- API: `http://localhost:8000`
- Interactive Docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Run in detached mode
docker-compose up -d

# Stop services
docker-compose down
```

## API Endpoints

### POST `/api/recommendations`

Get paddle recommendations based on user preferences.

**Request Body:**
```json
{
  "skill_level": "intermediate",
  "game_format": "doubles",
  "competitive_level": "league",
  "playing_styles": ["soft_game", "reset_first"],
  "game_focus": "control",
  "arm_sensitivity": false,
  "weight_tolerance": "medium",
  "paddle_feel": "more_control",
  "customization_preference": false,
  "pain_points": ["pop_ups", "blocks_too_shallow"],
  "playing_environment": 80,
  "common_opponents": ["bangers", "mixed"],
  "budget_min": 100,
  "budget_max": 200,
  "primary_goal": "consistency",
  "target_rating": 4.5
}
```

**Response:**
```json
[
  {
    "id": 123,
    "company": "JOOLA",
    "paddle_name": "Ben Johns Hyperion CFS 16",
    "price": 189.99,
    "match_score": 87.5,
    "match_reasons": [
      "Superior control (9/10) and feel (8/10) for precise soft game placement",
      "High twist weight (7.2) provides stability for consistent resets",
      "Weight (8.1 oz) matches your medium preference"
    ],
    "specs": {
      "weight": 8.1,
      "swing_weight": 111,
      "twist_weight": 7.2,
      "core_thickness": 16,
      "spin_rpm": 1850,
      "control_rating": 9,
      "feel_rating": 8,
      "forgiveness_rating": 7
    },
    "purchase_link": "https://...",
    "paddle_image": "https://...",
    "source": "mattspickleball"
  }
]
```

### GET `/api/health`

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "paddle-recommendation"
}
```

### POST `/api/sync-paddles`

Manually sync paddles from database to vector store.

**Query Parameters:**
- `force` (bool, optional): Force re-sync even if data exists

**Response:**
```json
{
  "status": "success",
  "message": "Paddles synced to vector store"
}
```

## Frontend Integration

Add this to your `.env.local` in the Next.js frontend:

```bash
NEXT_PUBLIC_PYTHON_API_BASE_URL=http://localhost:8000
```

Use the service function:

```typescript
import { getPaddleRecommendations, UserPreferences } from '@/services/fetch';

const preferences: UserPreferences = {
  skill_level: 'intermediate',
  game_format: 'doubles',
  // ... other preferences
};

const recommendations = await getPaddleRecommendations(preferences);
```

## How It Works

### 1. Vector Store Initialization

On startup, the system:
1. Connects to PostgreSQL database
2. Loads paddle data from `source_paddles` table
3. Generates semantic embeddings using sentence-transformers
4. Stores embeddings in ChromaDB vector store

### 2. Semantic Search

When a user submits preferences:
1. System builds a search query from user preferences
2. Generates embedding for the search query
3. Performs cosine similarity search in ChromaDB
4. Returns top 30 most similar paddles

### 3. Scoring & Ranking

For each candidate paddle:
1. Calculates match score based on:
   - Primary goal alignment (25%)
   - Play style match (20%)
   - Weight preferences (10%)
   - Swing weight (10%)
   - Twist weight (10%)
   - Budget fit (10%)
   - Spin requirements (10%)
   - Build quality (5%)
2. Applies hard filters (budget, brands)
3. Sorts by score and returns top 5

### 4. Match Reasoning

The system generates human-readable reasons for each recommendation:
- Goal-specific strengths
- Play style alignments
- Physical spec matches
- Pain point solutions

## Configuration

### Embedding Model

Default: `all-MiniLM-L6-v2` (fast, lightweight)

For better quality, consider:
- `all-mpnet-base-v2` (higher quality, slower)
- `all-MiniLM-L12-v2` (balanced)

Update in `.env`:
```bash
EMBEDDING_MODEL=all-mpnet-base-v2
```

### Vector Store

ChromaDB persists data to disk in `./chroma_db/` by default. To change:

```bash
CHROMA_PERSIST_DIRECTORY=/path/to/chroma_db
CHROMA_COLLECTION_NAME=my_paddle_collection
```

## Development

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
```

### Debugging

Enable debug logging:

```python
# app/main.py
logging.basicConfig(level=logging.DEBUG)
```

### Re-syncing Vector Store

If paddle data changes in the database:

```bash
curl -X POST http://localhost:8000/api/sync-paddles?force=true
```

## Production Considerations

1. **Database Connection Pooling**: Configure SQLAlchemy pool settings
2. **Caching**: Use Redis for frequently requested recommendations
3. **Rate Limiting**: Add rate limiting middleware
4. **Monitoring**: Add logging and metrics (e.g., Prometheus)
5. **CORS**: Update `CORS_ORIGINS` in `.env` for production domains

## Troubleshooting

### ChromaDB Issues

If you get ChromaDB errors, delete and re-create:
```bash
rm -rf ./chroma_db
curl -X POST http://localhost:8000/api/sync-paddles?force=true
```

### Memory Issues

For large datasets, adjust batch size in `vector_store.py`:
```python
batch_size = 16  # Reduce from 32
```

### Slow First Request

First request downloads the embedding model (~80MB). Subsequent requests are fast.

## License

MIT
