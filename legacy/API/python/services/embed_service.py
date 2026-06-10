#!/usr/bin/env python3
"""
Lightweight Python embedding service for the RAG stack.
Provides text embedding generation using sentence-transformers.
"""

import os
import logging
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
from sentence_transformers import SentenceTransformer
import numpy as np
from dotenv import load_dotenv

# Load environment variables
load_dotenv("../../../.env")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Paddle Embedding Service", version="1.0.0")

# Global model instance
model = None

class EmbedRequest(BaseModel):
    texts: List[str]
    
class EmbedResponse(BaseModel):
    embeddings: List[List[float]]
    dimensions: int

@app.on_event("startup")
async def startup_event():
    """Initialize the embedding model on startup."""
    global model
    logger.info("Loading sentence transformer model...")
    # Using a lightweight, fast model suitable for semantic search
    model = SentenceTransformer('all-MiniLM-L6-v2')
    logger.info("Model loaded successfully")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "model_loaded": model is not None}

@app.post("/embed", response_model=EmbedResponse)
async def generate_embeddings(request: EmbedRequest):
    """Generate embeddings for the provided texts."""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    if not request.texts:
        raise HTTPException(status_code=400, detail="No texts provided")
    
    try:
        # Generate embeddings
        embeddings = model.encode(request.texts, convert_to_tensor=False)
        
        # Convert to list of lists for JSON serialization
        embeddings_list = embeddings.tolist()
        
        return EmbedResponse(
            embeddings=embeddings_list,
            dimensions=len(embeddings_list[0]) if embeddings_list else 0
        )
    
    except Exception as e:
        logger.error(f"Error generating embeddings: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating embeddings: {str(e)}")

@app.get("/model-info")
async def model_info():
    """Get information about the loaded model."""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    return {
        "model_name": "all-MiniLM-L6-v2",
        "max_seq_length": model.max_seq_length,
        "embedding_dimension": model.get_sentence_embedding_dimension()
    }

if __name__ == "__main__":
    port = int(os.getenv("EMBED_PORT", "8008"))
    host = os.getenv("EMBED_HOST", "0.0.0.0")
    
    logger.info(f"Starting embedding service on {host}:{port}")
    uvicorn.run(app, host=host, port=port)
