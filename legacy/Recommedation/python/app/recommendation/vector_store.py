"""ChromaDB vector store for paddle similarity search."""

import logging
from typing import List, Dict, Any, Optional, Tuple
import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions
import numpy as np

from app.config import settings
from app.recommendation.embeddings import get_embedding_generator

logger = logging.getLogger(__name__)


class PaddleVectorStore:
    """
    Vector store for paddle embeddings using ChromaDB.

    Features:
    - Persistent storage of paddle embeddings
    - Fast similarity search (cosine distance)
    - Metadata filtering
    - Batch operations
    """

    def __init__(
        self,
        collection_name: Optional[str] = None,
        persist_directory: Optional[str] = None,
    ) -> None:
        """
        Initialize vector store.

        Args:
            collection_name: ChromaDB collection name (default from settings)
            persist_directory: Directory for persistent storage (default from settings)
        """
        self.collection_name = collection_name or settings.chroma_collection_name
        self.persist_directory = persist_directory or settings.chroma_persist_dir
        self._client: Optional[chromadb.Client] = None
        self._collection: Optional[chromadb.Collection] = None

    @property
    def client(self) -> chromadb.Client:
        """
        Lazy load ChromaDB client.

        Returns:
            ChromaDB client instance
        """
        if self._client is None:
            logger.info(f"Initializing ChromaDB client at {self.persist_directory}")
            self._client = chromadb.Client(
                Settings(
                    persist_directory=self.persist_directory,
                    anonymized_telemetry=False,
                )
            )
            logger.info("ChromaDB client initialized")
        return self._client

    @property
    def collection(self) -> chromadb.Collection:
        """
        Get or create the paddle collection.

        Returns:
            ChromaDB collection
        """
        if self._collection is None:
            try:
                logger.info(f"Getting collection: {self.collection_name}")
                self._collection = self.client.get_collection(
                    name=self.collection_name
                )
                logger.info(f"Collection loaded: {self._collection.count()} items")
            except Exception:
                logger.info(f"Collection not found, creating: {self.collection_name}")
                self._collection = self.client.create_collection(
                    name=self.collection_name,
                    metadata={"description": "Paddle embeddings for similarity search"},
                )
                logger.info("Collection created")

        return self._collection

    def add_paddle(
        self,
        paddle_id: int,
        embedding: np.ndarray,
        metadata: Dict[str, Any],
    ) -> None:
        """
        Add a single paddle to the vector store.

        Args:
            paddle_id: Unique paddle ID
            embedding: Embedding vector
            metadata: Paddle metadata (brand, name, price, etc.)
        """
        # Convert numpy array to list for ChromaDB
        embedding_list = embedding.tolist() if isinstance(embedding, np.ndarray) else embedding

        # Ensure metadata values are JSON-serializable
        clean_metadata = self._clean_metadata(metadata)

        self.collection.add(
            ids=[str(paddle_id)],
            embeddings=[embedding_list],
            metadatas=[clean_metadata],
        )

    def add_paddles_batch(
        self,
        paddle_ids: List[int],
        embeddings: np.ndarray,
        metadatas: List[Dict[str, Any]],
    ) -> None:
        """
        Add multiple paddles in a batch operation.

        Args:
            paddle_ids: List of paddle IDs
            embeddings: Array of embeddings (num_paddles, embedding_dim)
            metadatas: List of metadata dictionaries
        """
        if len(paddle_ids) != len(embeddings) != len(metadatas):
            raise ValueError("paddle_ids, embeddings, and metadatas must have same length")

        if len(paddle_ids) == 0:
            logger.warning("Empty batch provided")
            return

        # Convert to appropriate formats
        ids = [str(pid) for pid in paddle_ids]
        embeddings_list = embeddings.tolist() if isinstance(embeddings, np.ndarray) else embeddings
        clean_metadatas = [self._clean_metadata(m) for m in metadatas]

        logger.info(f"Adding batch of {len(ids)} paddles to vector store")
        self.collection.add(
            ids=ids,
            embeddings=embeddings_list,
            metadatas=clean_metadatas,
        )
        logger.info(f"Batch added successfully. Total items: {self.collection.count()}")

    def search_similar(
        self,
        query_embedding: np.ndarray,
        n_results: int = 10,
        where: Optional[Dict[str, Any]] = None,
    ) -> Tuple[List[int], List[float], List[Dict[str, Any]]]:
        """
        Search for similar paddles using vector similarity.

        Args:
            query_embedding: Query embedding vector
            n_results: Number of results to return
            where: Metadata filters (e.g., {"brand": "Selkirk"})

        Returns:
            Tuple of (paddle_ids, distances, metadatas)
        """
        query_list = query_embedding.tolist() if isinstance(query_embedding, np.ndarray) else query_embedding

        results = self.collection.query(
            query_embeddings=[query_list],
            n_results=n_results,
            where=where,
        )

        # Extract results
        ids = [int(id_str) for id_str in results["ids"][0]]
        distances = results["distances"][0]
        metadatas = results["metadatas"][0]

        return ids, distances, metadatas

    def search_by_text(
        self,
        query_text: str,
        n_results: int = 10,
        where: Optional[Dict[str, Any]] = None,
    ) -> Tuple[List[int], List[float], List[Dict[str, Any]]]:
        """
        Search for similar paddles using a text query.

        Args:
            query_text: Text description to search for
            n_results: Number of results to return
            where: Metadata filters

        Returns:
            Tuple of (paddle_ids, distances, metadatas)
        """
        # Generate embedding for query text
        generator = get_embedding_generator()
        query_embedding = generator.generate_embedding(query_text)

        return self.search_similar(query_embedding, n_results, where)

    def get_paddle(self, paddle_id: int) -> Optional[Dict[str, Any]]:
        """
        Get a specific paddle by ID.

        Args:
            paddle_id: Paddle ID

        Returns:
            Paddle metadata or None if not found
        """
        try:
            result = self.collection.get(
                ids=[str(paddle_id)],
                include=["metadatas", "embeddings"],
            )
            if result["ids"]:
                return {
                    "id": int(result["ids"][0]),
                    "metadata": result["metadatas"][0],
                    "embedding": result["embeddings"][0] if result["embeddings"] else None,
                }
            return None
        except Exception as e:
            logger.error(f"Error getting paddle {paddle_id}: {e}")
            return None

    def delete_paddle(self, paddle_id: int) -> None:
        """
        Delete a paddle from the vector store.

        Args:
            paddle_id: Paddle ID to delete
        """
        self.collection.delete(ids=[str(paddle_id)])

    def clear_collection(self) -> None:
        """Delete all items from the collection."""
        logger.warning(f"Clearing all items from collection: {self.collection_name}")
        self.client.delete_collection(name=self.collection_name)
        self._collection = None  # Force recreation

    def get_count(self) -> int:
        """
        Get total number of paddles in the store.

        Returns:
            Number of paddles
        """
        return self.collection.count()

    def _clean_metadata(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Clean metadata to ensure ChromaDB compatibility.

        ChromaDB requires metadata values to be str, int, float, or bool.

        Args:
            metadata: Raw metadata dictionary

        Returns:
            Cleaned metadata dictionary
        """
        clean = {}
        for key, value in metadata.items():
            if value is None:
                continue
            elif isinstance(value, (str, int, float, bool)):
                clean[key] = value
            elif isinstance(value, list):
                # Convert list to comma-separated string
                clean[key] = ",".join(str(v) for v in value)
            else:
                # Convert other types to string
                clean[key] = str(value)
        return clean

    def update_paddle(
        self,
        paddle_id: int,
        embedding: Optional[np.ndarray] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """
        Update a paddle's embedding and/or metadata.

        Args:
            paddle_id: Paddle ID
            embedding: New embedding (optional)
            metadata: New metadata (optional)
        """
        update_data = {"ids": [str(paddle_id)]}

        if embedding is not None:
            update_data["embeddings"] = [embedding.tolist() if isinstance(embedding, np.ndarray) else embedding]

        if metadata is not None:
            update_data["metadatas"] = [self._clean_metadata(metadata)]

        self.collection.update(**update_data)

    def get_all_ids(self) -> List[int]:
        """
        Get all paddle IDs in the collection.

        Returns:
            List of paddle IDs
        """
        result = self.collection.get(include=[])
        return [int(id_str) for id_str in result["ids"]]


# Global vector store instance
_vector_store: Optional[PaddleVectorStore] = None


def get_vector_store() -> PaddleVectorStore:
    """
    Get or create the global vector store instance.

    Returns:
        PaddleVectorStore instance
    """
    global _vector_store
    if _vector_store is None:
        _vector_store = PaddleVectorStore()
    return _vector_store


def init_vector_store() -> PaddleVectorStore:
    """
    Initialize vector store (call during app startup).

    Returns:
        Initialized vector store
    """
    store = get_vector_store()
    logger.info(f"Vector store initialized with {store.get_count()} paddles")
    return store
