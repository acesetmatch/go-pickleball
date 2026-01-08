#!/usr/bin/env python3
"""
Initialize the vector store with paddle embeddings.

Usage:
    python scripts/init_vector_store.py [options]

Options:
    --rebuild       Rebuild from scratch (deletes existing data)
    --limit N       Only process N paddles (for testing)
    --batch-size N  Batch size (default: 100)
    --no-progress   Disable progress bar
"""

import argparse
import logging
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import settings
from app.database import init_database, close_database
from app.data.ingestion import ingest_all_paddles, rebuild_vector_store
from app.recommendation.vector_store import get_vector_store

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def main() -> int:
    """Main function."""
    parser = argparse.ArgumentParser(
        description="Initialize paddle vector store with embeddings"
    )
    parser.add_argument(
        "--rebuild",
        action="store_true",
        help="Rebuild vector store from scratch (deletes existing data)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit number of paddles to process (for testing)",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=100,
        help="Batch size for processing (default: 100)",
    )
    parser.add_argument(
        "--no-progress",
        action="store_true",
        help="Disable progress bar",
    )

    args = parser.parse_args()

    logger.info("=" * 80)
    logger.info("PADDLE VECTOR STORE INITIALIZATION")
    logger.info("=" * 80)
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"ChromaDB directory: {settings.chroma_persist_dir}")
    logger.info(f"Collection name: {settings.chroma_collection_name}")
    logger.info(f"Embedding model: {settings.embedding_model}")
    logger.info(f"Embedding dimension: {settings.embedding_dimension}")

    try:
        # Initialize database connection
        logger.info("\n1. Initializing database connection...")
        init_database()

        # Check current vector store status
        logger.info("\n2. Checking vector store status...")
        vector_store = get_vector_store()
        current_count = vector_store.get_count()
        logger.info(f"Current paddles in vector store: {current_count}")

        if args.rebuild:
            if current_count > 0:
                logger.warning(
                    f"\n⚠️  WARNING: Rebuild will delete {current_count} existing embeddings!"
                )
                response = input("Are you sure you want to continue? (yes/no): ")
                if response.lower() != "yes":
                    logger.info("Rebuild cancelled")
                    return 0

            logger.info("\n3. Rebuilding vector store...")
            count = rebuild_vector_store(
                batch_size=args.batch_size,
                show_progress=not args.no_progress,
            )

        else:
            logger.info("\n3. Ingesting paddles...")
            count = ingest_all_paddles(
                batch_size=args.batch_size,
                limit=args.limit,
                show_progress=not args.no_progress,
            )

        # Final status
        logger.info("\n" + "=" * 80)
        logger.info("SUMMARY")
        logger.info("=" * 80)
        logger.info(f"Paddles processed: {count}")
        logger.info(f"Total paddles in vector store: {vector_store.get_count()}")
        logger.info(f"Embedding dimension: {settings.embedding_dimension}")
        logger.info("\n✓ Vector store initialization complete!")

        return 0

    except KeyboardInterrupt:
        logger.warning("\n\nInterrupted by user")
        return 1

    except Exception as e:
        logger.error(f"\n\n✗ Error during initialization: {e}", exc_info=True)
        return 1

    finally:
        # Cleanup
        logger.info("\n4. Closing connections...")
        close_database()
        logger.info("Done!")


if __name__ == "__main__":
    sys.exit(main())
