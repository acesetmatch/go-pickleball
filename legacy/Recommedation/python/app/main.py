"""FastAPI application entry point."""

from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """
    Async context manager for application lifespan events.

    This handles startup and shutdown tasks like:
    - Database connections
    - Vector store initialization
    - Cache connections
    """
    # Startup
    print(f"🚀 Starting {settings.app_name} v{settings.app_version}")
    print(f"📍 Environment: {settings.environment}")
    print(f"🔧 Debug Mode: {settings.debug}")

    # TODO: Initialize database connection pool
    # TODO: Initialize ChromaDB connection
    # TODO: Initialize Redis connection
    # TODO: Load ML models

    yield

    # Shutdown
    print("👋 Shutting down application...")
    # TODO: Close database connections
    # TODO: Close vector store connections
    # TODO: Close cache connections


# Create FastAPI application
app = FastAPI(
    title=settings.api_title,
    description=settings.api_description,
    version=settings.app_version,
    debug=settings.debug,
    docs_url=f"{settings.api_prefix}/docs",
    redoc_url=f"{settings.api_prefix}/redoc",
    openapi_url=f"{settings.api_prefix}/openapi.json",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Root endpoint
@app.get("/")
async def root() -> JSONResponse:
    """Root endpoint with basic info."""
    return JSONResponse(
        content={
            "name": settings.app_name,
            "version": settings.app_version,
            "status": "running",
            "environment": settings.environment,
            "docs": f"{settings.api_prefix}/docs",
        }
    )


# Health check endpoint
@app.get(f"{settings.api_prefix}/health")
async def health_check() -> JSONResponse:
    """Health check endpoint."""
    return JSONResponse(
        content={
            "status": "healthy",
            "version": settings.app_version,
            "environment": settings.environment,
        }
    )


# Readiness check endpoint
@app.get(f"{settings.api_prefix}/ready")
async def readiness_check() -> JSONResponse:
    """Readiness check endpoint for k8s."""
    # TODO: Check database connection
    # TODO: Check vector store connection
    # TODO: Check cache connection

    return JSONResponse(
        content={
            "status": "ready",
            "checks": {
                "database": "not_implemented",
                "vector_store": "not_implemented",
                "cache": "not_implemented",
            }
        }
    )


# Metrics endpoint (placeholder)
@app.get(f"{settings.api_prefix}/metrics")
async def metrics() -> JSONResponse:
    """Prometheus metrics endpoint placeholder."""
    # TODO: Implement Prometheus metrics
    return JSONResponse(
        content={
            "message": "Metrics endpoint - to be implemented",
        }
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
    )
