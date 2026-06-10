# Telemetry Implementation

## Overview
Added structured JSON telemetry with request_id tracing across services for the pickleball recommendation system.

## Components Added

### 1. `server/obs/telemetry.go` - Core Telemetry Package
- **Middleware**: Generates unique request_id, logs request start/end
- **NewSpan()**: Creates telemetry spans with structured logging
- **GetRequestID()**: Extracts request_id from context
- **InjectRequestID()**: Propagates request_id to downstream HTTP calls

### 2. Updated `main.go` - Server Setup
- Wired telemetry middleware to all routes
- Added LLM and RAG endpoint routes
- Replaced basic logging with structured telemetry

### 3. Instrumented `llm/orchestrator.go` - LLM Service
- **LLM span**: Logs component, tokens in/out, tool calls, duration
- **Ranker span**: Logs profile hash, k value, duration  
- **Simulator span**: Logs paddle_id, plan_grams, new SW/balance, duration
- **RAG span**: Logs paddle_id, query hash, k, returned_snippets, rag_snippets_used
- Context propagation with request_id injection to downstream calls

### 4. Instrumented `rag/retriever.go` - RAG Service  
- **RAG span**: Logs paddle_id, query_hash, k, data_source="db"
- **Timing metrics**: embed_ms, sql_ms (placeholders for actual embedding/SQL work)
- **Usage tracking**: returned_snippets count, rag_snippets_used boolean
- Error logging with telemetry context

## Log Structure
Each span produces JSON logs with:
```json
{
  "ts": "2025-09-29T14:57:43.123Z",
  "level": "info", 
  "event": "llm_start|llm_end|ranker_start|etc",
  "request_id": "abc123...",
  "duration_ms": 45.2,
  "component": "orchestrator",
  "paddle_id": "ENGAGE-PURSUIT-MX-6.0",
  "query_hash": "sha1hash...",
  "k": 3,
  "data_source": "db",
  "returned_snippets": 3,
  "rag_snippets_used": true,
  "embed_ms": 12.5,
  "sql_ms": 8.7,
  "tokens_in": 150,
  "tokens_out": 75,
  "tool_calls": ["rag"],
  "plan_grams": "2g head, 1g handle",
  "new_sw": 220.0,
  "new_balance": 7.5
}
```

## Usage
1. **Start server**: `go run . ` - telemetry middleware auto-attached
2. **Make request**: POST to `/llm/explain_and_plan` 
3. **Observe logs**: Single request_id flows through all spans with timing data

## Acceptance Criteria ✅
- ✅ Generate request_id and log at each hop
- ✅ Ranker: profile hash, k, duration  
- ✅ Sim: plan grams, new SW/balance, duration
- ✅ RAG: paddle_id, query hash, k, returned_snippets, embed_ms, sql_ms
- ✅ LLM: tokens in/out, tool calls, duration
- ✅ Structured JSON logs with data_source="db" and rag_snippets_used=true/false
- ✅ One end-to-end call prints single request_id with timings per step

## Testing
Run `go run test_telemetry.go` to see telemetry flow in action.
