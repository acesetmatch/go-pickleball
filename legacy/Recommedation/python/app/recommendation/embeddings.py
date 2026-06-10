"""Embedding generation using Sentence-BERT."""

import logging
from typing import List, Optional
import numpy as np
from sentence_transformers import SentenceTransformer

from app.config import settings

logger = logging.getLogger(__name__)


class EmbeddingGenerator:
    """
    Generates embeddings for paddle descriptions using Sentence-BERT.

    Features:
    - Lazy model loading (only when needed)
    - Batch processing for efficiency
    - GPU support (if available)
    - Caching of loaded model
    """

    def __init__(
        self,
        model_name: Optional[str] = None,
        use_gpu: Optional[bool] = None,
        batch_size: Optional[int] = None,
    ) -> None:
        """
        Initialize embedding generator.

        Args:
            model_name: Sentence transformer model name (default from settings)
            use_gpu: Whether to use GPU (default from settings)
            batch_size: Batch size for processing (default from settings)
        """
        self.model_name = model_name or settings.embedding_model
        self.use_gpu = use_gpu if use_gpu is not None else settings.use_gpu
        self.batch_size = batch_size or settings.embedding_batch_size
        self._model: Optional[SentenceTransformer] = None

    @property
    def model(self) -> SentenceTransformer:
        """
        Lazy load the sentence transformer model.

        Returns:
            Loaded SentenceTransformer model
        """
        if self._model is None:
            logger.info(f"Loading embedding model: {self.model_name}")
            device = "cuda" if self.use_gpu else "cpu"

            try:
                self._model = SentenceTransformer(
                    self.model_name,
                    device=device,
                )
                logger.info(f"Model loaded successfully on {device}")
                logger.info(f"Embedding dimension: {self._model.get_sentence_embedding_dimension()}")
            except Exception as e:
                logger.error(f"Failed to load model {self.model_name}: {e}")
                raise

        return self._model

    def generate_embedding(self, text: str) -> np.ndarray:
        """
        Generate embedding for a single text.

        Args:
            text: Input text to embed

        Returns:
            Embedding vector as numpy array
        """
        if not text or not text.strip():
            logger.warning("Empty text provided, returning zero vector")
            return np.zeros(settings.embedding_dimension, dtype=np.float32)

        try:
            embedding = self.model.encode(
                text,
                convert_to_numpy=True,
                show_progress_bar=False,
            )
            return embedding.astype(np.float32)
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            raise

    def generate_embeddings(
        self,
        texts: List[str],
        show_progress: bool = False,
    ) -> np.ndarray:
        """
        Generate embeddings for multiple texts in batches.

        Args:
            texts: List of texts to embed
            show_progress: Whether to show progress bar

        Returns:
            Array of embeddings (num_texts, embedding_dim)
        """
        if not texts:
            logger.warning("Empty text list provided")
            return np.array([], dtype=np.float32).reshape(0, settings.embedding_dimension)

        # Filter out empty texts
        valid_texts = [text if text and text.strip() else "" for text in texts]

        try:
            logger.info(f"Generating embeddings for {len(valid_texts)} texts...")
            embeddings = self.model.encode(
                valid_texts,
                batch_size=self.batch_size,
                convert_to_numpy=True,
                show_progress_bar=show_progress,
            )
            logger.info(f"Generated {len(embeddings)} embeddings")
            return embeddings.astype(np.float32)
        except Exception as e:
            logger.error(f"Error generating batch embeddings: {e}")
            raise

    def create_paddle_document(
        self,
        name: str,
        brand: str,
        description: Optional[str] = None,
        core_material: Optional[str] = None,
        face_material: Optional[str] = None,
        skill_level_target: Optional[str] = None,
        features: Optional[List[str]] = None,
        **kwargs,
    ) -> str:
        """
        Create a rich text document from paddle attributes for embedding.

        This combines multiple paddle attributes into a coherent text that
        captures the paddle's characteristics for semantic search.

        Args:
            name: Paddle name
            brand: Brand name
            description: Paddle description
            core_material: Core material type
            face_material: Face material type
            skill_level_target: Target skill level
            features: List of key features
            **kwargs: Additional paddle attributes

        Returns:
            Formatted text document
        """
        parts = []

        # Brand and name
        parts.append(f"{brand} {name}")

        # Description
        if description:
            parts.append(description)

        # Materials
        materials = []
        if core_material:
            materials.append(f"{core_material} core")
        if face_material:
            materials.append(f"{face_material} face")
        if materials:
            parts.append(f"Construction: {', '.join(materials)}")

        # Target audience
        if skill_level_target:
            parts.append(f"Designed for {skill_level_target} players")

        # Features
        if features and isinstance(features, list):
            feature_text = ", ".join(features[:5])  # Limit to top 5 features
            parts.append(f"Features: {feature_text}")

        # Additional specs (weight, shape, etc.)
        specs = []
        if "weight_oz" in kwargs and kwargs["weight_oz"]:
            specs.append(f"{kwargs['weight_oz']} oz")
        if "shape" in kwargs and kwargs["shape"]:
            specs.append(f"{kwargs['shape']} shape")

        if specs:
            parts.append(f"Specifications: {', '.join(specs)}")

        # Ratings (for semantic understanding of performance)
        ratings = []
        if "power_rating" in kwargs and kwargs["power_rating"]:
            power = kwargs["power_rating"]
            if power >= 8:
                ratings.append("high power")
            elif power >= 5:
                ratings.append("moderate power")
            else:
                ratings.append("low power")

        if "control_rating" in kwargs and kwargs["control_rating"]:
            control = kwargs["control_rating"]
            if control >= 8:
                ratings.append("excellent control")
            elif control >= 5:
                ratings.append("good control")

        if "spin_rating" in kwargs and kwargs["spin_rating"]:
            spin = kwargs["spin_rating"]
            if spin >= 8:
                ratings.append("high spin")
            elif spin >= 5:
                ratings.append("moderate spin")

        if ratings:
            parts.append(f"Performance: {', '.join(ratings)}")

        # Join all parts
        document = ". ".join(parts)
        return document

    def get_embedding_dimension(self) -> int:
        """
        Get the dimension of embeddings produced by this model.

        Returns:
            Embedding dimension
        """
        return self.model.get_sentence_embedding_dimension()

    def unload_model(self) -> None:
        """Unload the model from memory."""
        if self._model is not None:
            logger.info("Unloading embedding model")
            self._model = None


# Global embedding generator instance
_embedding_generator: Optional[EmbeddingGenerator] = None


def get_embedding_generator() -> EmbeddingGenerator:
    """
    Get or create the global embedding generator instance.

    Returns:
        EmbeddingGenerator instance
    """
    global _embedding_generator
    if _embedding_generator is None:
        _embedding_generator = EmbeddingGenerator()
    return _embedding_generator


def generate_paddle_embedding(paddle_data: dict) -> np.ndarray:
    """
    Convenience function to generate embedding for a paddle.

    Args:
        paddle_data: Dictionary containing paddle attributes

    Returns:
        Embedding vector
    """
    generator = get_embedding_generator()
    document = generator.create_paddle_document(**paddle_data)
    return generator.generate_embedding(document)
