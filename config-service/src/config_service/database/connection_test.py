"""Tests for database connection management."""

import pytest
from unittest.mock import Mock, patch, MagicMock
from config_service.database.connection import DatabaseManager


@pytest.fixture
def db_manager():
    """Create a DatabaseManager instance for testing."""
    return DatabaseManager()


def test_database_manager_initialization(db_manager):
    """Test DatabaseManager initialization."""
    with patch('psycopg2.pool.ThreadedConnectionPool') as mock_pool, \
         patch('concurrent.futures.ThreadPoolExecutor') as mock_executor:
        
        mock_pool_instance = Mock()
        mock_pool.return_value = mock_pool_instance
        mock_executor_instance = Mock()
        mock_executor.return_value = mock_executor_instance
        
        db_manager.initialize()
        
        assert db_manager._pool == mock_pool_instance
        assert db_manager._executor == mock_executor_instance
        mock_pool.assert_called_once()
        mock_executor.assert_called_once()


def test_database_manager_close(db_manager):
    """Test DatabaseManager cleanup."""
    mock_pool = Mock()
    mock_executor = Mock()
    db_manager._pool = mock_pool
    db_manager._executor = mock_executor
    
    db_manager.close()
    
    mock_pool.closeall.assert_called_once()
    mock_executor.shutdown.assert_called_once_with(wait=True)


@pytest.mark.asyncio
async def test_get_connection_success(db_manager):
    """Test successful connection retrieval."""
    mock_pool = Mock()
    mock_connection = Mock()
    mock_pool.getconn.return_value = mock_connection
    db_manager._pool = mock_pool
    
    async with db_manager.get_connection() as conn:
        assert conn == mock_connection
    
    mock_pool.getconn.assert_called_once()
    mock_pool.putconn.assert_called_once_with(mock_connection)


@pytest.mark.asyncio
async def test_get_connection_error_handling(db_manager):
    """Test connection error handling with rollback."""
    mock_pool = Mock()
    mock_connection = Mock()
    mock_pool.getconn.return_value = mock_connection
    db_manager._pool = mock_pool
    
    with pytest.raises(ValueError):
        async with db_manager.get_connection() as conn:
            raise ValueError("Test error")
    
    mock_connection.rollback.assert_called_once()
    mock_pool.putconn.assert_called_once_with(mock_connection)


@pytest.mark.asyncio
async def test_execute_query(db_manager):
    """Test query execution."""
    mock_connection = Mock()
    mock_cursor = Mock()
    mock_cursor.fetchall.return_value = [{'id': '123', 'name': 'test'}]
    mock_connection.cursor.return_value.__enter__.return_value = mock_cursor
    
    with patch.object(db_manager, 'get_connection') as mock_get_conn:
        mock_get_conn.return_value.__aenter__.return_value = mock_connection
        mock_get_conn.return_value.__aexit__.return_value = None
        
        result = await db_manager.execute_query("SELECT * FROM test", ('param',))
        
        assert result == [{'id': '123', 'name': 'test'}]
        mock_cursor.execute.assert_called_once_with("SELECT * FROM test", ('param',))
        mock_cursor.fetchall.assert_called_once()


@pytest.mark.asyncio
async def test_execute_command(db_manager):
    """Test command execution."""
    mock_connection = Mock()
    mock_cursor = Mock()
    mock_cursor.rowcount = 1
    mock_connection.cursor.return_value.__enter__.return_value = mock_cursor
    
    with patch.object(db_manager, 'get_connection') as mock_get_conn:
        mock_get_conn.return_value.__aenter__.return_value = mock_connection
        mock_get_conn.return_value.__aexit__.return_value = None
        
        result = await db_manager.execute_command("INSERT INTO test VALUES (%s)", ('value',))
        
        assert result == 1
        mock_cursor.execute.assert_called_once_with("INSERT INTO test VALUES (%s)", ('value',))
        mock_connection.commit.assert_called_once()