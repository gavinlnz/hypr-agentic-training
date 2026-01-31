"""Database connection management with connection pooling."""

import logging
from contextlib import asynccontextmanager
from concurrent.futures import ThreadPoolExecutor
from typing import AsyncGenerator, Dict, Any, Optional
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from config_service.config import settings

logger = logging.getLogger(__name__)


class DatabaseManager:
    """Manages database connections using ThreadedConnectionPool."""
    
    def __init__(self):
        self._pool: Optional[pool.ThreadedConnectionPool] = None
        self._executor: Optional[ThreadPoolExecutor] = None
    
    def initialize(self):
        """Initialize the connection pool and thread executor."""
        try:
            self._pool = psycopg2.pool.ThreadedConnectionPool(
                minconn=settings.database_min_connections,
                maxconn=settings.database_max_connections,
                dsn=settings.database_url,
                cursor_factory=RealDictCursor
            )
            self._executor = ThreadPoolExecutor(max_workers=settings.database_max_connections)
            logger.info("Database connection pool initialized")
        except Exception as e:
            logger.error(f"Failed to initialize database pool: {e}")
            raise
    
    def close(self):
        """Close the connection pool and thread executor."""
        if self._pool:
            self._pool.closeall()
            logger.info("Database connection pool closed")
        
        if self._executor:
            self._executor.shutdown(wait=True)
            logger.info("Thread executor shutdown")
    
    @asynccontextmanager
    async def get_connection(self) -> AsyncGenerator[psycopg2.extensions.connection, None]:
        """Get a database connection from the pool."""
        if not self._pool:
            raise RuntimeError("Database pool not initialized")
        
        connection = None
        try:
            connection = self._pool.getconn()
            yield connection
        except Exception as e:
            if connection:
                connection.rollback()
            logger.error(f"Database connection error: {e}")
            raise
        finally:
            if connection:
                self._pool.putconn(connection)
    
    async def execute_query(self, query: str, params: tuple = None) -> list[Dict[str, Any]]:
        """Execute a SELECT query and return results."""
        async with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, params)
                return cursor.fetchall()
    
    async def execute_command(self, command: str, params: tuple = None) -> int:
        """Execute an INSERT/UPDATE/DELETE command and return affected rows."""
        async with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(command, params)
                conn.commit()
                return cursor.rowcount


# Global database manager instance
db_manager = DatabaseManager()