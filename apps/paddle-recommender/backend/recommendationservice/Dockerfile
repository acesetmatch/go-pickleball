# Multi-stage build for smaller final image
FROM python:3.12-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    make \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements files
COPY requirements/ requirements/
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --user -r requirements/base.txt

# ==================================
# Final stage - runtime image
# ==================================
FROM python:3.12-slim

WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /root/.local /root/.local

# Make sure scripts in .local are usable
ENV PATH=/root/.local/bin:$PATH

# Copy application code
COPY app/ ./app/
COPY tests/ ./tests/

# Create directories for vector store and logs
RUN mkdir -p /app/chroma_db /app/logs && \
    chmod -R 755 /app

# Create non-root user for security (optional but recommended)
# Note: Commented out for now to avoid permission issues
# RUN useradd -m -u 1000 appuser && \
#     chown -R appuser:appuser /app /root/.local
# USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

# Expose port
EXPOSE 8000

# Default command - can be overridden in docker-compose
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
