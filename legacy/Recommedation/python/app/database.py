"""Database connection and session management."""

import logging
from typing import Generator, Optional, List
from contextlib import contextmanager

from sqlalchemy import create_engine, event, pool, exc
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.engine import Engine
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)

from app.config import settings
from app.models.paddle import Base

logger = logging.getLogger(__name__)


class DatabaseManager:
    """
    Manages database connections with connection pooling and retry logic.

    Features:
    - Connection pooling (20-100 connections)
    - Exponential backoff retry logic
    - Read replica support (load balancing for read operations)
    - Health checks
    """

    def __init__(self) -> None:
        """Initialize database manager."""
        self.primary_engine: Optional[Engine] = None
        self.read_engines: List[Engine] = []
        self.SessionLocal: Optional[sessionmaker] = None
        self._current_read_index = 0

    def init_db(self) -> None:
        """Initialize database connections."""
        logger.info("Initializing database connections...")

        # Create primary engine (for writes and reads)
        self.primary_engine = self._create_engine(
            settings.database_url,
            pool_size=settings.database_pool_size,
            max_overflow=settings.database_max_overflow,
        )

        # Create read replica engines if configured
        for i, replica_url in enumerate([settings.read_replica_1, settings.read_replica_2], 1):
            if replica_url:
                logger.info(f"Configuring read replica {i}...")
                engine = self._create_engine(
                    replica_url,
                    pool_size=settings.database_pool_size // 2,  # Smaller pool for replicas
                    max_overflow=settings.database_max_overflow // 2,
                )
                self.read_engines.append(engine)

        # Create session factory
        self.SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self.primary_engine,
        )

        logger.info(f"Database initialized: primary + {len(self.read_engines)} read replicas")

    def _create_engine(
        self,
        url: str,
        pool_size: int,
        max_overflow: int,
    ) -> Engine:
        """
        Create a SQLAlchemy engine with optimized settings.

        Args:
            url: Database URL
            pool_size: Connection pool size
            max_overflow: Maximum overflow connections

        Returns:
            Configured engine
        """
        engine = create_engine(
            url,
            poolclass=pool.QueuePool,
            pool_size=pool_size,
            max_overflow=max_overflow,
            pool_timeout=settings.database_pool_timeout,
            pool_pre_ping=True,  # Verify connections before using
            echo=settings.database_echo,
            connect_args={
                "connect_timeout": settings.database_query_timeout,
            },
        )

        # Add event listeners
        @event.listens_for(engine, "connect")
        def receive_connect(dbapi_conn, connection_record):
            """Handle new database connections."""
            logger.debug("New database connection established")

        @event.listens_for(engine, "checkout")
        def receive_checkout(dbapi_conn, connection_record, connection_proxy):
            """Handle connection checkout from pool."""
            logger.debug("Connection checked out from pool")

        return engine

    def get_read_engine(self) -> Engine:
        """
        Get a read replica engine using round-robin selection.

        Falls back to primary engine if no replicas configured.

        Returns:
            Engine for read operations
        """
        if not self.read_engines:
            return self.primary_engine

        # Round-robin selection
        engine = self.read_engines[self._current_read_index]
        self._current_read_index = (self._current_read_index + 1) % len(self.read_engines)
        return engine

    @retry(
        retry=retry_if_exception_type((exc.OperationalError, exc.DisconnectionError)),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
    )
    def get_db(self) -> Generator[Session, None, None]:
        """
        Get a database session with automatic retry on connection errors.

        Yields:
            Database session

        Raises:
            Exception: If database connection fails after retries
        """
        if not self.SessionLocal:
            raise RuntimeError("Database not initialized. Call init_db() first.")

        db = self.SessionLocal()
        try:
            yield db
        finally:
            db.close()

    @contextmanager
    def get_read_session(self) -> Generator[Session, None, None]:
        """
        Get a read-only session preferring read replicas.

        Yields:
            Read-only database session
        """
        engine = self.get_read_engine()
        SessionMaker = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        session = SessionMaker()
        try:
            yield session
        finally:
            session.close()

    @retry(
        retry=retry_if_exception_type((exc.OperationalError, exc.DisconnectionError)),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
    )
    def health_check(self) -> bool:
        """
        Check database connection health.

        Returns:
            True if database is healthy, False otherwise
        """
        try:
            with self.get_db() as db:
                db.execute("SELECT 1")
            return True
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False

    def create_tables(self) -> None:
        """Create all database tables."""
        if not self.primary_engine:
            raise RuntimeError("Database not initialized")

        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=self.primary_engine)
        logger.info("Database tables created successfully")

    def drop_tables(self) -> None:
        """Drop all database tables (use with caution!)."""
        if not self.primary_engine:
            raise RuntimeError("Database not initialized")

        logger.warning("Dropping all database tables...")
        Base.metadata.drop_all(bind=self.primary_engine)
        logger.info("Database tables dropped")

    def close(self) -> None:
        """Close all database connections."""
        logger.info("Closing database connections...")

        if self.primary_engine:
            self.primary_engine.dispose()

        for engine in self.read_engines:
            engine.dispose()

        logger.info("Database connections closed")


# Global database manager instance
db_manager = DatabaseManager()


# Dependency for FastAPI endpoints
def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency for getting a database session.

    Yields:
        Database session
    """
    yield from db_manager.get_db()


# Utility functions
def init_database() -> None:
    """Initialize database connection (call during app startup)."""
    db_manager.init_db()


def close_database() -> None:
    """Close database connections (call during app shutdown)."""
    db_manager.close()


def create_tables() -> None:
    """Create all database tables."""
    db_manager.create_tables()


def check_db_health() -> bool:
    """
    Check database health.

    Returns:
        True if database is healthy
    """
    return db_manager.health_check()
