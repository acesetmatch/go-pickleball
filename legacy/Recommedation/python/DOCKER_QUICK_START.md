# Docker Quick Start Guide

## 🎉 Your Docker setup is ready!

All services have been successfully Dockerized and tested.

## ✅ What's Running

```bash
docker-compose ps
```

| Service | Status | URL/Port |
|---------|--------|----------|
| **API** | ✅ Healthy | http://localhost:8000 |
| **PostgreSQL** | ✅ Healthy | localhost:5433 |
| **Redis** | ✅ Healthy | localhost:6379 |

## 🚀 Quick Commands

### Start Everything
```bash
# Production mode
docker-compose up -d

# Development mode (with hot reload)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Stop Everything
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Just the API
docker-compose logs -f api

# Last 50 lines
docker-compose logs --tail=50 api
```

### Restart a Service
```bash
docker-compose restart api
```

### Rebuild After Code Changes
```bash
docker-compose up -d --build
```

## 🌐 Access Your Services

### API Documentation
- **Swagger UI**: http://localhost:8000/api/v1/docs
- **ReDoc**: http://localhost:8000/api/v1/redoc
- **Health Check**: http://localhost:8000/api/v1/health

### Database Access
```bash
# Via command line
docker-compose exec postgres psql -U paddle_user -d paddle_db

# Connection string for external tools (DBeaver, pgAdmin, etc.)
postgresql://paddle_user:paddle_pass@localhost:5433/paddle_db
```

### Redis Access
```bash
# Via command line
docker-compose exec redis redis-cli

# Connection string
redis://localhost:6379/0
```

## 🧪 Running Tests

```bash
# Run all tests
docker-compose exec api pytest

# Run with coverage
docker-compose exec api pytest --cov=app --cov-report=html

# Run specific test
docker-compose exec api pytest tests/test_basic.py -v
```

## 🛠️ Development Tools

### Start with Management UIs
```bash
# Start with pgAdmin and Redis Commander
docker-compose --profile tools up -d

# Then access:
# - pgAdmin: http://localhost:5050 (admin@paddle.com / admin)
# - Redis Commander: http://localhost:8081
```

### Shell Access
```bash
# Python shell
docker-compose exec api python

# Container bash shell
docker-compose exec api bash

# Database shell
docker-compose exec postgres psql -U paddle_user -d paddle_db
```

### Install New Dependencies
```bash
# Add to requirements/base.txt, then:
docker-compose build api
docker-compose up -d api
```

## 🐛 Troubleshooting

### API won't start
```bash
# Check logs
docker-compose logs api

# Restart
docker-compose restart api

# Rebuild from scratch
docker-compose build --no-cache api
docker-compose up -d
```

### Port already in use
```bash
# Check what's using the port
lsof -i :8000

# Edit docker-compose.yml to use different port:
ports:
  - "8001:8000"  # Changed from 8000:8000
```

### Database connection errors
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Restart
docker-compose restart postgres
```

### Clean slate (⚠️ Deletes all data)
```bash
# Stop and remove everything including volumes
docker-compose down -v

# Start fresh
docker-compose up -d
```

## 📊 Image Sizes

```bash
docker images | grep recommendationservice
# recommendationservice-api: ~1.6GB
```

To reduce size further, consider:
- Removing unused dependencies from requirements/base.txt
- Using python:3.12-slim instead of full Python image ✅ (already done)
- Multi-stage build ✅ (already done)

## 🔄 Next Steps

1. **Implement Database Models** - Add SQLAlchemy models in `app/models/`
2. **Set up Database Migrations** - Use Alembic for schema management
3. **Implement Recommendation Logic** - Add business logic in `app/recommendation/`
4. **Add Authentication** - Implement JWT or API key auth
5. **Set up CI/CD** - Add GitHub Actions for automated builds

## 📚 File Structure

```
recommendationservice/
├── Dockerfile              # Multi-stage production build
├── docker-compose.yml      # Production orchestration
├── docker-compose.dev.yml  # Development overrides
├── .dockerignore          # Files to exclude from image
├── .env.docker            # Docker environment template
├── requirements/
│   └── base.txt           # Python dependencies
└── app/                   # Application code
```

## 💡 Pro Tips

1. **Use development mode during coding**:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
   ```
   Changes to `app/` will auto-reload!

2. **Keep data between rebuilds**: Volumes persist even when you `docker-compose down`

3. **Check resource usage**:
   ```bash
   docker stats
   ```

4. **Clean up disk space periodically**:
   ```bash
   docker system prune -a
   ```

## ✨ Summary

You now have:
- ✅ Multi-stage optimized Dockerfile
- ✅ PostgreSQL database (port 5433)
- ✅ Redis cache
- ✅ FastAPI application with hot reload
- ✅ Health checks configured
- ✅ Development and production modes
- ✅ All services networked together

**Your recommendation service is ready for development!** 🚀
