"""Application configuration management using Pydantic Settings."""

from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = Field(default="paddle-recommendation-service", description="Application name")
    app_version: str = Field(default="1.0.0", description="Application version")
    environment: str = Field(default="development", description="Environment (development, staging, production)")
    debug: bool = Field(default=True, description="Debug mode")
    log_level: str = Field(default="INFO", description="Logging level")

    # API Configuration
    api_host: str = Field(default="0.0.0.0", description="API host")
    api_port: int = Field(default=8000, description="API port")
    api_prefix: str = Field(default="/api/v1", description="API URL prefix")
    api_title: str = Field(default="Paddle Recommendation API", description="API title")
    api_description: str = Field(
        default="AI-powered pickleball paddle recommendations",
        description="API description"
    )
    cors_origins: List[str] = Field(
        default=["http://localhost:3000"],
        description="CORS allowed origins"
    )

    # Database
    database_url: str = Field(
        default="postgresql://user:password@localhost:5432/paddle_db",
        description="PostgreSQL connection URL"
    )
    database_pool_size: int = Field(default=20, description="Database connection pool size")
    database_max_overflow: int = Field(default=40, description="Maximum connection overflow")
    database_pool_timeout: int = Field(default=30, description="Connection pool timeout (seconds)")
    database_echo: bool = Field(default=False, description="Echo SQL statements")

    # Read Replicas (optional)
    read_replica_1: Optional[str] = Field(default=None, description="Read replica 1 URL")
    read_replica_2: Optional[str] = Field(default=None, description="Read replica 2 URL")

    # Vector Store (ChromaDB)
    chroma_persist_dir: str = Field(default="./chroma_db", description="ChromaDB persistence directory")
    chroma_collection_name: str = Field(default="paddle_specs_v2", description="ChromaDB collection name")
    chroma_host: str = Field(default="localhost", description="ChromaDB server host")
    chroma_port: int = Field(default=8001, description="ChromaDB server port")

    # Embedding Model
    embedding_model: str = Field(
        default="sentence-transformers/all-MiniLM-L6-v2",
        description="Sentence transformer model"
    )
    embedding_dimension: int = Field(default=384, description="Embedding dimension")
    embedding_batch_size: int = Field(default=32, description="Batch size for embedding generation")
    use_gpu: bool = Field(default=False, description="Use GPU for embeddings")

    # Redis Cache
    redis_url: str = Field(default="redis://localhost:6379/0", description="Redis connection URL")
    redis_password: Optional[str] = Field(default=None, description="Redis password")
    redis_ssl: bool = Field(default=False, description="Use SSL for Redis")
    cache_ttl_seconds: int = Field(default=3600, description="Cache TTL in seconds")
    cache_key_prefix: str = Field(default="paddle_rec:", description="Cache key prefix")

    # Authentication
    jwt_secret_key: str = Field(
        default="your-secret-key-change-this",
        description="JWT secret key"
    )
    jwt_algorithm: str = Field(default="HS256", description="JWT algorithm")
    jwt_expiration_minutes: int = Field(default=60, description="JWT expiration time (minutes)")

    # API Keys
    api_key: Optional[str] = Field(default=None, description="API key for authentication")
    internal_api_key: Optional[str] = Field(default=None, description="Internal service API key")

    # Optional LLM Configuration
    use_llm: bool = Field(default=False, description="Enable LLM features")
    llm_provider: str = Field(default="ollama", description="LLM provider (ollama, openai, anthropic)")
    ollama_base_url: str = Field(default="http://localhost:11434", description="Ollama base URL")
    ollama_model: str = Field(default="llama2", description="Ollama model name")
    openai_api_key: Optional[str] = Field(default=None, description="OpenAI API key")
    anthropic_api_key: Optional[str] = Field(default=None, description="Anthropic API key")

    # Rate Limiting
    rate_limit_enabled: bool = Field(default=True, description="Enable rate limiting")
    rate_limit_requests: int = Field(default=100, description="Max requests per period")
    rate_limit_period: int = Field(default=60, description="Rate limit period (seconds)")

    # Monitoring
    prometheus_enabled: bool = Field(default=True, description="Enable Prometheus metrics")
    prometheus_port: int = Field(default=9090, description="Prometheus metrics port")
    sentry_dsn: Optional[str] = Field(default=None, description="Sentry DSN")
    sentry_environment: str = Field(default="development", description="Sentry environment")
    sentry_traces_sample_rate: float = Field(
        default=0.1,
        description="Sentry traces sample rate"
    )

    # Data Sync
    sync_on_startup: bool = Field(default=True, description="Sync data on startup")
    sync_interval_minutes: int = Field(default=60, description="Data sync interval (minutes)")
    sync_batch_size: int = Field(default=100, description="Sync batch size")

    # Performance
    max_workers: int = Field(default=4, description="Maximum worker threads")
    request_timeout: int = Field(default=30, description="Request timeout (seconds)")
    vector_search_timeout: int = Field(default=5, description="Vector search timeout (seconds)")
    database_query_timeout: int = Field(default=10, description="Database query timeout (seconds)")

    # Feature Flags
    enable_caching: bool = Field(default=True, description="Enable caching")
    enable_alternatives: bool = Field(default=False, description="Enable alternative recommendations")
    enable_feedback: bool = Field(default=True, description="Enable feedback collection")
    enable_a_b_testing: bool = Field(default=False, description="Enable A/B testing")

    # External Services
    paddle_data_api: Optional[str] = Field(
        default=None,
        description="External paddle data API URL"
    )
    webhook_url: Optional[str] = Field(default=None, description="Webhook URL for events")

    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.environment.lower() == "development"

    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment.lower() == "production"

    @property
    def cors_origins_list(self) -> List[str]:
        """Get CORS origins as a list."""
        if isinstance(self.cors_origins, str):
            # Parse string representation of list if needed
            import json
            try:
                return json.loads(self.cors_origins)
            except (json.JSONDecodeError, TypeError):
                return [self.cors_origins]
        return self.cors_origins


# Global settings instance
settings = Settings()
