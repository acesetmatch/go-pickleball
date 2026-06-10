import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any
import numpy as np
from app.config import settings as app_settings
from app.database import SourcePaddle, get_db
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)

class PaddleVectorStore:
    def __init__(self):
        # Initialize embedding model
        self.embedding_model = SentenceTransformer(app_settings.embedding_model)

        # Initialize ChromaDB with persistence
        self.chroma_client = chromadb.PersistentClient(
            path=app_settings.chroma_persist_directory,
            settings=Settings(anonymized_telemetry=False)
        )

        # Get or create collection
        try:
            self.collection = self.chroma_client.get_collection(
                name=app_settings.chroma_collection_name
            )
            logger.info(f"Loaded existing collection with {self.collection.count()} items")
        except:
            self.collection = self.chroma_client.create_collection(
                name=app_settings.chroma_collection_name,
                metadata={"hnsw:space": "cosine"}
            )
            logger.info("Created new collection")

    def create_paddle_document(self, paddle: SourcePaddle) -> str:
        """Create a searchable document from paddle specs"""
        doc_parts = [
            f"Paddle: {paddle.company} {paddle.paddle_name}",
            f"Price: ${paddle.price}" if paddle.price else "",
            f"Source: {paddle.source}",
            "",
            "Physical Specifications:",
            f"Weight: {paddle.weight} oz" if paddle.weight else "",
            f"Swing Weight: {paddle.swing_weight} ({paddle.swing_weight_percentile})" if paddle.swing_weight else "",
            f"Twist Weight: {paddle.twist_weight} ({paddle.twist_weight_percentile})" if paddle.twist_weight else "",
            f"Balance Point: {paddle.balance_point}" if paddle.balance_point else "",
            f"Core Thickness: {paddle.core_thickness} mm" if paddle.core_thickness else "",
            f"Shape: {paddle.shape}" if paddle.shape else "",
            f"Length: {paddle.length} inches" if paddle.length else "",
            f"Width: {paddle.width} inches" if paddle.width else "",
            f"Grip Length: {paddle.grip_length} inches" if paddle.grip_length else "",
            f"Grip Circumference: {paddle.grip_circumference} inches" if paddle.grip_circumference else "",
            "",
            "Materials:",
            f"Face Material: {paddle.face_material}" if paddle.face_material else "",
            f"Core Material: {paddle.core_material}" if paddle.core_material else "",
            f"Surface Texture: {paddle.surface_texture}" if paddle.surface_texture else "",
            f"Build Type: {paddle.build_type}" if paddle.build_type else "",
            "",
            "Performance Metrics:",
            f"Spin RPM: {paddle.spin_rpm} ({paddle.spin_percentile})" if paddle.spin_rpm else "",
            f"Serve Speed: {paddle.serve_speed} mph" if paddle.serve_speed else "",
            f"Punch Volley Speed: {paddle.punch_volley_speed} mph" if paddle.punch_volley_speed else "",
            f"Power: {paddle.power_rating} ({paddle.power_percentile})" if paddle.power_rating else "",
            f"Pop: {paddle.pop_percentile}" if paddle.pop_percentile else "",
            f"Spin: {paddle.spin_rating}" if paddle.spin_rating else "",
            "",
            "Ratings:",
            f"Control: {paddle.control_rating}/10" if paddle.control_rating else "",
            f"Feel: {paddle.feel_rating}/10" if paddle.feel_rating else "",
            f"Forgiveness: {paddle.forgiveness_rating}/10" if paddle.forgiveness_rating else "",
            f"Touch Shots: {paddle.touch_shots_rating}/10" if paddle.touch_shots_rating else "",
            f"Overall Rating: {paddle.paddle_rating}" if paddle.paddle_rating else "",
            "",
            f"Paddle Type: {paddle.paddle_type}" if paddle.paddle_type else "",
            f"Release Year: {paddle.release_year}" if paddle.release_year else "",
        ]

        # Filter out empty lines and join
        return "\n".join([line for line in doc_parts if line])

    def sync_paddles(self, db: Session, force: bool = False):
        """Sync paddles from database to vector store"""
        if not force and self.collection.count() > 0:
            logger.info("Vector store already populated, skipping sync")
            return

        # Clear existing data if forcing
        if force:
            self.collection.delete(where={})

        # Get all paddles with sufficient data
        paddles = db.query(SourcePaddle).filter(
            SourcePaddle.weight.isnot(None)
        ).all()

        if not paddles:
            logger.warning("No paddles found in database")
            return

        # Prepare documents and metadata
        documents = []
        metadatas = []
        ids = []

        for paddle in paddles:
            doc = self.create_paddle_document(paddle)
            documents.append(doc)

            # Create metadata
            metadata = {
                "paddle_id": paddle.id,
                "company": paddle.company or "",
                "paddle_name": paddle.paddle_name or "",
                "price": float(paddle.price) if paddle.price else 0,
                "swing_weight": paddle.swing_weight or 0,
                "twist_weight": paddle.twist_weight or 0,
                "weight": paddle.weight or 0,
                "spin_rpm": paddle.spin_rpm or 0,
                "control_rating": paddle.control_rating or 0,
                "source": paddle.source or ""
            }
            metadatas.append(metadata)
            ids.append(str(paddle.id))

        # Generate embeddings in batches
        batch_size = 32
        for i in range(0, len(documents), batch_size):
            batch_docs = documents[i:i+batch_size]
            batch_metas = metadatas[i:i+batch_size]
            batch_ids = ids[i:i+batch_size]

            # Generate embeddings
            embeddings = self.embedding_model.encode(batch_docs, show_progress_bar=False)

            # Add to collection
            self.collection.add(
                embeddings=embeddings.tolist(),
                documents=batch_docs,
                metadatas=batch_metas,
                ids=batch_ids
            )

            logger.info(f"Added batch {i//batch_size + 1}/{(len(documents)-1)//batch_size + 1}")

        logger.info(f"Synced {len(paddles)} paddles to vector store")

    def search_similar_paddles(self, query: str, n_results: int = 30) -> List[Dict[str, Any]]:
        """Search for similar paddles using semantic search"""
        # Generate query embedding
        query_embedding = self.embedding_model.encode([query])

        # Search
        results = self.collection.query(
            query_embeddings=query_embedding.tolist(),
            n_results=n_results
        )

        if results['metadatas'] and len(results['metadatas']) > 0:
            return results['metadatas'][0]

        return []
