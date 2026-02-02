"""Tests for database connection management."""

import pytest
from unittest.mock import Mock, patch
from config_service.database.connection import DatabaseManager


@pytest.fixture
def db_manager():
    """Create a DatabaseManager instance for testing."""
    return DatabaseManager()


def test_database_manager_initialization(db_manager):
    """Test DatabaseManager initialization."""
    with patch('psycopg2.pool.ThreadedConnectionPool') as mock_pool:
        
        mock_pool_instance = Mock()
        mock_pool.return_value = mock_pool_instance
        
        db_manager.initialize()
        
        assert db_manager._pool == mock_pool_instance
        # Check that executor was created (it's a real ThreadPoolExecutor)
        assert db_manager._executor is not None
        mock_pool.assert_called_once()


def test_database_manager_close(db_manager):
    """Test DatabaseManager cleanup."""
    mock_pool = Mock()
    mock_executor = Mock()
    db_manager._pool = mock_pool
    db_manager._executor = mock_executor
    
    db_manager.close()
    
    mock_pool.closeall.assert_called_once()
    mock_executor.shutdown.assert_called_once_with(wait=True)


async def test_get_connection_not_initialized(db_manager):
    """Test that get_connection raises error when not initialized."""
    with pytest.raises(RuntimeError, match="Database pool not initialized"):
        async with db_manager.get_connection():
            pass


async def test_execute_query_not_initialized(db_manager):
    """Test that execute_query raises error when not initialized."""
    with pytest.raises(RuntimeError, match="Database pool not initialized"):
        await db_manager.execute_query("SELECT 1")


async def test_execute_command_not_initialized(db_manager):
    """Test that execute_command raises error when not initialized."""
    with pytest.raises(RuntimeError, match="Database pool not initialized"):
        await db_manager.execute_command("INSERT INTO test VALUES (%s)", ('value',))


async def test_execute_returning_query_not_initialized(db_manager):
    """Test that execute_returning_query raises error when not initialized."""
    with pytest.raises(RuntimeError, match="Database pool not initialized"):
        await db_manager.execute_returning_query("INSERT INTO test VALUES (%s) RETURNING id", ('value',))