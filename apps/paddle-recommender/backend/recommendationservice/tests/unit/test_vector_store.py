"""Unit tests for vector store and embeddings."""

import pytest
import numpy as np
import tempfile
import shutil
from pathlib import Path

from app.recommendation.embeddings import EmbeddingGenerator
from app.recommendation.vector_store import PaddleVectorStore


@pytest.fixture
def temp_chroma_dir():
    """Create a temporary directory for ChromaDB."""
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    shutil.rmtree(temp_dir)


@pytest.fixture
def embedding_generator():
    """Create an embedding generator instance."""
    return EmbeddingGenerator()


@pytest.fixture
def vector_store(temp_chroma_dir):
    """Create a vector store with temporary storage."""
    return PaddleVectorStore(
        collection_name="test_paddles",
        persist_directory=temp_chroma_dir,
    )


class TestEmbeddingGenerator:
    """Test embedding generation."""

    def test_create_paddle_document(self, embedding_generator):
        """Test paddle document creation."""
        doc = embedding_generator.create_paddle_document(
            name="Pro Series Control",
            brand="Selkirk",
            description="Premium control paddle",
            core_material="polymer",
            face_material="carbon_fiber",
            skill_level_target="advanced",
            features=["Large sweet spot", "Low vibration"],
            weight_oz=8.0,
            shape="standard",
            power_rating=7,
            control_rating=9,
            spin_rating=8,
        )

        assert "Selkirk Pro Series Control" in doc
        assert "Premium control paddle" in doc
        assert "polymer core" in doc
        assert "carbon_fiber face" in doc
        assert "advanced players" in doc
        assert "Large sweet spot" in doc

    def test_generate_embedding_single(self, embedding_generator):
        """Test single embedding generation."""
        text = "Control paddle for advanced players"
        embedding = embedding_generator.generate_embedding(text)

        assert isinstance(embedding, np.ndarray)
        assert embedding.shape == (384,)  # Default dimension
        assert embedding.dtype == np.float32

    def test_generate_embedding_empty_text(self, embedding_generator):
        """Test embedding generation with empty text."""
        embedding = embedding_generator.generate_embedding("")

        assert isinstance(embedding, np.ndarray)
        assert embedding.shape == (384,)
        assert np.all(embedding == 0)  # Should return zero vector

    def test_generate_embeddings_batch(self, embedding_generator):
        """Test batch embedding generation."""
        texts = [
            "Control paddle for beginners",
            "Power paddle for advanced players",
            "Balanced paddle for intermediates",
        ]

        embeddings = embedding_generator.generate_embeddings(texts, show_progress=False)

        assert isinstance(embeddings, np.ndarray)
        assert embeddings.shape == (3, 384)
        assert embeddings.dtype == np.float32

    def test_generate_embeddings_empty_list(self, embedding_generator):
        """Test batch generation with empty list."""
        embeddings = embedding_generator.generate_embeddings([], show_progress=False)

        assert isinstance(embeddings, np.ndarray)
        assert embeddings.shape == (0, 384)

    def test_embedding_similarity(self, embedding_generator):
        """Test that similar texts have similar embeddings."""
        text1 = "Control paddle for finesse players"
        text2 = "Precision paddle for control-focused players"
        text3 = "Heavy power paddle for aggressive play"

        emb1 = embedding_generator.generate_embedding(text1)
        emb2 = embedding_generator.generate_embedding(text2)
        emb3 = embedding_generator.generate_embedding(text3)

        # Compute cosine similarity
        sim_1_2 = np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))
        sim_1_3 = np.dot(emb1, emb3) / (np.linalg.norm(emb1) * np.linalg.norm(emb3))

        # Similar texts should be more similar
        assert sim_1_2 > sim_1_3


class TestPaddleVectorStore:
    """Test vector store operations."""

    def test_add_single_paddle(self, vector_store, embedding_generator):
        """Test adding a single paddle."""
        embedding = embedding_generator.generate_embedding("Test paddle")
        metadata = {
            "paddle_id": 1,
            "name": "Test Paddle",
            "brand": "Test Brand",
            "price_usd": 100.0,
        }

        vector_store.add_paddle(
            paddle_id=1,
            embedding=embedding,
            metadata=metadata,
        )

        assert vector_store.get_count() == 1

    def test_add_batch_paddles(self, vector_store, embedding_generator):
        """Test adding paddles in batch."""
        texts = [
            "Control paddle",
            "Power paddle",
            "Balanced paddle",
        ]
        embeddings = embedding_generator.generate_embeddings(texts, show_progress=False)

        metadatas = [
            {"paddle_id": i, "name": f"Paddle {i}", "brand": "Test"}
            for i in range(1, 4)
        ]

        vector_store.add_paddles_batch(
            paddle_ids=[1, 2, 3],
            embeddings=embeddings,
            metadatas=metadatas,
        )

        assert vector_store.get_count() == 3

    def test_search_similar(self, vector_store, embedding_generator):
        """Test similarity search."""
        # Add some paddles
        texts = [
            "Control paddle for finesse players",
            "Power paddle for aggressive players",
            "Balanced all-court paddle",
        ]
        embeddings = embedding_generator.generate_embeddings(texts, show_progress=False)

        metadatas = [
            {"paddle_id": i, "name": f"Paddle {i}", "brand": "Test"}
            for i in range(1, 4)
        ]

        vector_store.add_paddles_batch(
            paddle_ids=[1, 2, 3],
            embeddings=embeddings,
            metadatas=metadatas,
        )

        # Search for control paddle
        query_embedding = embedding_generator.generate_embedding(
            "Looking for a control-focused paddle"
        )
        ids, distances, metadatas = vector_store.search_similar(
            query_embedding,
            n_results=2,
        )

        assert len(ids) == 2
        assert len(distances) == 2
        assert len(metadatas) == 2
        assert ids[0] == 1  # Should match control paddle first

    def test_search_by_text(self, vector_store, embedding_generator):
        """Test text-based search."""
        # Add paddles
        texts = [
            "Lightweight control paddle",
            "Heavy power paddle",
        ]
        embeddings = embedding_generator.generate_embeddings(texts, show_progress=False)

        metadatas = [
            {"paddle_id": 1, "name": "Control", "brand": "Test"},
            {"paddle_id": 2, "name": "Power", "brand": "Test"},
        ]

        vector_store.add_paddles_batch(
            paddle_ids=[1, 2],
            embeddings=embeddings,
            metadatas=metadatas,
        )

        # Search using text
        ids, distances, metadatas = vector_store.search_by_text(
            "I want a control paddle",
            n_results=1,
        )

        assert len(ids) == 1
        assert ids[0] == 1  # Should match control paddle

    def test_get_paddle(self, vector_store, embedding_generator):
        """Test retrieving a specific paddle."""
        embedding = embedding_generator.generate_embedding("Test paddle")
        metadata = {
            "paddle_id": 42,
            "name": "Test Paddle",
            "brand": "Test Brand",
        }

        vector_store.add_paddle(
            paddle_id=42,
            embedding=embedding,
            metadata=metadata,
        )

        result = vector_store.get_paddle(42)
        assert result is not None
        assert result["id"] == 42
        assert result["metadata"]["name"] == "Test Paddle"

    def test_get_nonexistent_paddle(self, vector_store):
        """Test getting a paddle that doesn't exist."""
        result = vector_store.get_paddle(999)
        assert result is None

    def test_delete_paddle(self, vector_store, embedding_generator):
        """Test deleting a paddle."""
        embedding = embedding_generator.generate_embedding("Test paddle")
        metadata = {"paddle_id": 1, "name": "Test"}

        vector_store.add_paddle(
            paddle_id=1,
            embedding=embedding,
            metadata=metadata,
        )

        assert vector_store.get_count() == 1

        vector_store.delete_paddle(1)
        assert vector_store.get_count() == 0

    def test_metadata_filtering(self, vector_store, embedding_generator):
        """Test searching with metadata filters."""
        texts = ["Paddle 1", "Paddle 2", "Paddle 3"]
        embeddings = embedding_generator.generate_embeddings(texts, show_progress=False)

        metadatas = [
            {"paddle_id": 1, "brand": "Selkirk", "price_usd": 100},
            {"paddle_id": 2, "brand": "Selkirk", "price_usd": 200},
            {"paddle_id": 3, "brand": "Paddletek", "price_usd": 150},
        ]

        vector_store.add_paddles_batch(
            paddle_ids=[1, 2, 3],
            embeddings=embeddings,
            metadatas=metadatas,
        )

        # Search with brand filter
        query_embedding = embedding_generator.generate_embedding("paddle")
        ids, distances, metadatas = vector_store.search_similar(
            query_embedding,
            n_results=10,
            where={"brand": "Selkirk"},
        )

        assert len(ids) == 2
        assert all(m["brand"] == "Selkirk" for m in metadatas)

    def test_clean_metadata(self, vector_store):
        """Test metadata cleaning."""
        metadata = {
            "string": "test",
            "int": 42,
            "float": 3.14,
            "bool": True,
            "none": None,
            "list": ["a", "b", "c"],
            "dict": {"key": "value"},
        }

        cleaned = vector_store._clean_metadata(metadata)

        assert cleaned["string"] == "test"
        assert cleaned["int"] == 42
        assert cleaned["float"] == 3.14
        assert cleaned["bool"] is True
        assert "none" not in cleaned
        assert cleaned["list"] == "a,b,c"
        assert isinstance(cleaned["dict"], str)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
