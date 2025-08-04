<!-- @format -->

# Go Backend Docker Setup

This directory contains the Docker configuration for the Go backend API.

## 🐳 Quick Start

### Option 1: Using Docker Compose (Recommended)

```bash
# Build and run both API and database
docker-compose up --build

# Run in background
docker-compose up -d --build

# Stop services
docker-compose down
```

### Option 2: Manual Docker Build

```bash
# Build the image
docker build -t pickleball-api .

# Run with database connection
docker run -p 8080:8080 \
  -e DB_HOST=your-db-host \
  -e DB_PORT=5432 \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres \
  -e DB_NAME=pickleball_db \
  pickleball-api
```

## 🔧 Environment Variables

| Variable      | Default         | Description       |
| ------------- | --------------- | ----------------- |
| `DB_HOST`     | `localhost`     | PostgreSQL host   |
| `DB_PORT`     | `5432`          | PostgreSQL port   |
| `DB_USER`     | `postgres`      | Database username |
| `DB_PASSWORD` | `postgres`      | Database password |
| `DB_NAME`     | `pickleball_db` | Database name     |

## 🚀 API Endpoints

- `GET /test` - Health check
- `GET /api/paddles` - Get all paddles
- `GET /api/paddles/{id}` - Get specific paddle
- `POST /api/paddles` - Upload paddle data

## 📊 Database

The application uses PostgreSQL and will automatically:

- Create tables if they don't exist
- Handle database migrations
- Manage connections

## 🔍 Troubleshooting

### Check container logs:

```bash
docker-compose logs api
docker-compose logs postgres
```

### Access database directly:

```bash
docker exec -it pickleball-postgres psql -U postgres -d pickleball_db
```

### Rebuild after code changes:

```bash
docker-compose up --build --force-recreate
```
