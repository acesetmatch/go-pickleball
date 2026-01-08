<!-- @format -->

# Quick Start Guide - Paddle Recommendation Service

## 📋 Prerequisites

Before starting, ensure you have the following installed:

```bash
# Check Python version (need 3.10+)
python --version

# Check pip is installed
pip --version

# Check PostgreSQL is installed (or have connection details)
psql --version

# Check Redis is installed (or use Docker)
redis-cli --version

# Check Git is installed
git --version

# Optional: Check Docker is installed
docker --version
docker-compose --version
```

## 🚀 Complete Setup Process

### Step 1: Project Initialization

```bash
# Create project directory
mkdir paddle-recommendation-service
cd paddle-recommendation-service

# Initialize git repository
git init

# Create .gitignore
cat > .gitignore << 'EOF'
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual Environment
venv/
env/
ENV/

# IDE
.vscode/
.idea/
*.swp
*.swo
.DS_Store

# Environment
.env
.env.local
.env.*.local

# Database
*.db
*.sqlite3
chroma_db/

# Logs
logs/
*.log

# Testing
.coverage
htmlcov/
.pytest_cache/
.tox/

# Documentation
docs/_build/
site/

# Cache
.cache/
redis-data/

# Docker
docker/volumes/
EOF

# Create initial README
echo "# Paddle Recommendation Service" > README.md
```

### Step 2: Create Project Structure

```bash
# Create all directories at once
mkdir -p app/{models,recommendation,api/routes,data,cache,monitoring,utils}
mkdir -p tests/{unit,integration,performance}
mkdir -p scripts
mkdir -p docker
mkdir -p config
mkdir -p docs
mkdir -p migrations/versions
mkdir -p requirements

# Create __init__.py files for Python packages
touch app/__init__.py
touch app/models/__init__.py
touch app/recommendation/__init__.py
touch app/api/__init__.py
touch app/api/routes/__init__.py
touch app/data/__init__.py
touch app/cache/__init__.py
touch app/monitoring/__init__.py
touch app/utils/__init__.py
touch tests/__init__.py
touch tests/unit/__init__.py
touch tests/integration/__init__.py
touch tests/performance/__init__.py

# Create placeholder files
touch app/main.py
touch app/config.py
touch app/database.py
touch tests/conftest.py
touch docker/Dockerfile
touch docker/docker-compose.yml
touch Makefile
touch setup.py
touch pyproject.toml
```

### Step 3: Virtual Environment Setup

```bash
# Create virtual environment (choose one method)

# Method 1: Using venv (built-in)
python -m venv venv

# Method 2: Using virtualenv
pip install virtualenv
virtualenv venv

# Method 3: Using conda (if you have Anaconda)
conda create -n paddle-rec python=3.10
```

#### Activate Virtual Environment

```bash
# On Linux/Mac
source venv/bin/activate

# On Windows (Command Prompt)
venv\Scripts\activate.bat

# On Windows (PowerShell)
venv\Scripts\Activate.ps1

# On Windows (Git Bash)
source venv/Scripts/activate

# Using conda
conda activate paddle-rec

# Verify activation - should show (venv) in prompt
which python
# Should show: /path/to/your/project/venv/bin/python
```

### Step 4: Create Requirements Files

```bash
# Create base requirements
cat > requirements/base.txt << 'EOF'
# Core Framework
fastapi==0.109.0
uvicorn[standard]==0.25.0
pydantic==2.5.3
pydantic-settings==2.1.0

# Database
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
asyncpg==0.29.0

# Vector Store & ML
chromadb==0.4.22
sentence-transformers==2.2.2
numpy==1.24.3
pandas==2.1.4

# Caching
redis==5.0.1
hiredis==2.3.2

# Utilities
python-dotenv==1.0.0
python-multipart==0.0.6
tenacity==8.2.3
orjson==3.9.10
EOF

# Create dev requirements
cat > requirements/dev.txt << 'EOF'
-r base.txt

# Testing
pytest==7.4.3
pytest-asyncio==0.21.1
pytest-cov==4.1.0
pytest-mock==3.12.0
httpx==0.25.2

# Code Quality
black==23.12.1
flake8==7.0.0
mypy==1.8.0
isort==5.13.2
pre-commit==3.6.0

# Development Tools
ipython==8.19.0
rich==13.7.0
watchdog==3.0.0
EOF

# Create prod requirements
cat > requirements/prod.txt << 'EOF'
-r base.txt

# Production Server
gunicorn==21.2.0
prometheus-client==0.19.0
sentry-sdk[fastapi]==1.39.1
EOF

# Create main requirements file that points to dev (for development)
echo "-r requirements/dev.txt" > requirements.txt
```

### Step 5: Install Dependencies

```bash
# Upgrade pip first
pip install --upgrade pip

# Install development dependencies
pip install -r requirements/dev.txt

# If you get errors, try installing separately:
pip install fastapi uvicorn[standard]
pip install sqlalchemy psycopg2-binary
pip install chromadb
pip install sentence-transformers
pip install redis
pip install pytest pytest-asyncio

# Verify key packages installed
pip list | grep -E "fastapi|uvicorn|sqlalchemy|chromadb|redis"
```

### Step 6: Environment Configuration

```bash
# Create environment template
cat > .env.example << 'EOF'
# Application
APP_NAME=paddle-recommendation-service
APP_VERSION=1.0.0
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO

# API
API_HOST=0.0.0.0
API_PORT=8000
API_PREFIX=/api/v1

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/paddle_db
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=40

# Vector Store
CHROMA_PERSIST_DIR=./chroma_db
CHROMA_COLLECTION_NAME=paddle_specs

# Redis
REDIS_URL=redis://localhost:6379/0

# Security
JWT_SECRET_KEY=change-this-secret-key-in-production
API_KEY=development-api-key

# Feature Flags
ENABLE_CACHING=true
SYNC_ON_STARTUP=false
EOF

# Copy to actual .env file
cp .env.example .env

# Edit .env with your actual database credentials
echo "Now edit .env file with your actual database credentials"
```

### Step 7: Database Setup

```bash
# Option A: Using existing PostgreSQL
# Edit .env with your connection string:
# DATABASE_URL=postgresql://user:password@localhost:5432/your_db

# Option B: Using Docker for PostgreSQL
docker run --name paddle-postgres \
  -e POSTGRES_USER=paddle \
  -e POSTGRES_PASSWORD=paddle \
  -e POSTGRES_DB=paddle_db \
  -p 5432:5432 \
  -d postgres:15-alpine

# Option C: Using Docker Compose (create docker-compose.yml first)
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: paddle
      POSTGRES_PASSWORD: paddle
      POSTGRES_DB: paddle_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
EOF

docker-compose up -d
```

### Step 8: Create Basic FastAPI App

```bash
# Create a minimal FastAPI app to test setup
cat > app/main.py << 'EOF'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Paddle Recommendation API",
    description="AI-powered paddle recommendations",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Paddle Recommendation Service", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
EOF
```

### Step 9: Run Development Server

```bash
# Method 1: Using uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Method 2: Using Python
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Method 3: Running the script directly
python app/main.py

# Test the server is running
curl http://localhost:8000
# Should return: {"message":"Paddle Recommendation Service","status":"running"}

# Check health endpoint
curl http://localhost:8000/health
# Should return: {"status":"healthy"}

# Open in browser
# Navigate to: http://localhost:8000
# API docs at: http://localhost:8000/docs
```

### Step 10: Create Makefile for Common Commands

```bash
cat > Makefile << 'EOF'
.PHONY: help install dev test clean docker-up docker-down

help:
	@echo "Available commands:"
	@echo "  make install     Install all dependencies"
	@echo "  make dev         Run development server"
	@echo "  make test        Run tests"
	@echo "  make clean       Clean temporary files"
	@echo "  make docker-up   Start Docker services"
	@echo "  make docker-down Stop Docker services"
	@echo "  make format      Format code with black"
	@echo "  make lint        Run linting"

install:
	pip install --upgrade pip
	pip install -r requirements/dev.txt

dev:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

test:
	pytest tests/ -v

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache .coverage htmlcov

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

format:
	black app/ tests/
	isort app/ tests/

lint:
	flake8 app/ tests/
	mypy app/
EOF

# Now you can use:
make install  # Install dependencies
make dev      # Run development server
make test     # Run tests
make clean    # Clean up files
```

## 🔧 Troubleshooting Common Issues

### Virtual Environment Issues

```bash
# If 'venv' command not found
python -m pip install --user virtualenv

# If permission denied on Mac/Linux
chmod +x venv/bin/activate

# If scripts disabled on Windows PowerShell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Dependency Installation Issues

```bash
# If ChromaDB fails to install
pip install --upgrade pip setuptools wheel
pip install chromadb --no-cache-dir

# If psycopg2 fails on Mac
brew install postgresql
pip install psycopg2-binary

# If psycopg2 fails on Ubuntu/Debian
sudo apt-get install libpq-dev python3-dev
pip install psycopg2-binary

# If sentence-transformers fails
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install sentence-transformers
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
python -c "
import psycopg2
conn = psycopg2.connect('postgresql://user:password@localhost:5432/paddle_db')
print('Connected successfully!')
conn.close()
"

# Test Redis connection
python -c "
import redis
r = redis.Redis(host='localhost', port=6379, db=0)
r.ping()
print('Redis connected successfully!')
"
```

### Port Already in Use

```bash
# Find what's using port 8000
lsof -i :8000  # Mac/Linux
netstat -ano | findstr :8000  # Windows

# Kill the process
kill -9 <PID>  # Mac/Linux
taskkill /F /PID <PID>  # Windows

# Or run on different port
uvicorn app.main:app --reload --port 8001
```

## ✅ Verification Steps

After setup, verify everything works:

```bash
# 1. Check Python environment
python --version
# Should show: Python 3.10.x or higher

# 2. Check key packages installed
pip list | grep -E "fastapi|uvicorn|sqlalchemy"

# 3. Test server starts
make dev
# Should see: Uvicorn running on http://0.0.0.0:8000

# 4. Test API endpoint
curl http://localhost:8000/health
# Should return: {"status":"healthy"}

# 5. Check API documentation
# Open browser: http://localhost:8000/docs
# Should see: Swagger UI documentation

# 6. Test database connection (create test script)
cat > test_connection.py << 'EOF'
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        result = conn.execute("SELECT 1")
        print("✅ Database connection successful!")
except Exception as e:
    print(f"❌ Database connection failed: {e}")
EOF

python test_connection.py
```

## 📝 Next Steps

Once everything is verified:

1. **Continue with Phase 1** in `IMPLEMENTATION_TASKS.md`
2. **Implement `app/config.py`** for configuration management
3. **Set up database models** in `app/models/`
4. **Create the vector store** initialization
5. **Build the recommendation engine**

## 🆘 Getting Help

If you encounter issues:

1. Check the error message carefully
2. Look for the issue in the Troubleshooting section above
3. Check if all prerequisites are installed
4. Ensure virtual environment is activated
5. Verify all environment variables are set in `.env`
6. Try installing dependencies one by one
7. Check Docker containers are running (if using Docker)

## 📚 Useful Commands Reference

```bash
# Virtual environment
source venv/bin/activate         # Activate (Mac/Linux)
deactivate                        # Deactivate

# Development
make dev                          # Run server
make test                         # Run tests
make format                       # Format code
make lint                         # Check code quality

# Docker
docker-compose up -d              # Start services
docker-compose down               # Stop services
docker-compose logs -f            # View logs
docker-compose ps                 # Check status

# Database
docker exec -it paddle-postgres psql -U paddle paddle_db  # Connect to PostgreSQL

# Redis
docker exec -it paddle-redis redis-cli  # Connect to Redis
```

---

_Save this file as `QUICK_START.md` in your project root for reference_
