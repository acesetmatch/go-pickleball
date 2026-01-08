from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    database_url: str

    # ChromaDB
    chroma_persist_directory: str = "./chroma_db"
    chroma_collection_name: str = "paddle_specs"

    # Embedding Model
    embedding_model: str = "all-MiniLM-L6-v2"

    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: list = ["http://localhost:3000"]

    # Optional LLM
    openai_api_key: Optional[str] = None
    use_ollama: bool = True
    ollama_model: str = "llama2"

    # Caching
    redis_url: Optional[str] = None
    cache_ttl: int = 3600  # 1 hour

    class Config:
        env_file = ".env"

settings = Settings()
