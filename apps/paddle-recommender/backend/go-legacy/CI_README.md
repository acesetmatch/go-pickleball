# CI/CD Pipeline

## Overview
Comprehensive CI pipeline that ensures code quality and prevents regressions across the pickleball recommendation system.

## Pipeline Steps

### ✅ **Core Tests (Always Run)**
1. **Database Setup**: Spins up PostgreSQL with pgvector extension
2. **Migrations**: Runs `go run server/db/migrate.go` to set up schema
3. **Unit Tests**: 
   - Query builder tests (`./rag -run TestQueryBuilder`)
   - Guardrails tests (`./llm -run TestGuardrails`) 
   - Simulator math tests (when available)
4. **Telemetry**: Tests structured logging and request tracing
5. **Build**: Ensures application compiles successfully

### 🔄 **Conditional RAG Tests (Only if EMBED_URL set)**
6. **Embed Service**: Starts Python embedding service
7. **RAG Backfill**: Runs `go run server/cmd/rag_backfill/main.go`
8. **RAG Integration**: Tests `/rag/retrieve` endpoint with real paddle data
9. **Validation**: Asserts ≥1 snippet returned for known paddle

## Local Testing

### **Quick Test (No Database)**
```bash
cd backend/go
./test-ci-local.sh
```

### **Full Test (With Database & RAG)**
```bash
# Start PostgreSQL locally
docker run -d --name postgres-test -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=pickleball_test \
  postgres:15-alpine

# Set environment variables
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/pickleball_test?sslmode=disable"
export EMBED_URL="http://localhost:8000/embed"  # If you have embed service

# Run full CI test
./test-ci-local.sh
```

## GitHub Actions

The pipeline runs automatically on:
- **Push** to `main` or `develop` branches
- **Pull requests** to `main` or `develop` branches

### **Secrets Configuration**
- `EMBED_URL`: Optional. If not set, RAG tests are gracefully skipped

### **Services**
- **PostgreSQL 15**: Automatically provisioned with health checks
- **pgvector**: Installed for vector similarity search

## Test Structure

```
src/
├── rag/
│   ├── querybuilder_test.go     # Query builder unit tests
│   └── integration_test.go      # RAG endpoint integration test
├── llm/
│   └── guardrails_test.go       # Guardrails unit tests  
├── server/
│   ├── db/migrate.go           # Database migration runner
│   └── cmd/rag_backfill/main.go # RAG embedding backfill
└── telemetry_test/main.go      # Telemetry system test
```

## Success Criteria

### ✅ **CI Green Locally**
- All unit tests pass
- Telemetry system works
- Application builds successfully
- Database migrations run cleanly

### ✅ **Graceful Skipping**
- RAG tests skip when EMBED_URL not configured
- No failures due to missing optional services
- Clear logging about what's being skipped

## Monitoring

The pipeline provides detailed output:
- **Step-by-step progress** with clear status indicators
- **Test results** with pass/fail status
- **Skip reasons** when optional tests are bypassed
- **Summary report** at the end

## Extending Tests

To add new tests:
1. **Unit tests**: Add `*_test.go` files in appropriate packages
2. **Integration tests**: Add to existing integration test files
3. **CI script**: Update `test-ci-local.sh` and `.github/workflows/ci.yml`

The pipeline is designed to be **fast**, **reliable**, and **informative** while preventing regressions across the entire system.
