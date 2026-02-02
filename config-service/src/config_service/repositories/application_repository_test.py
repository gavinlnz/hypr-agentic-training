"""Tests for ApplicationRepository delete functionality."""

import pytest
from unittest.mock import AsyncMock, MagicMock
from config_service.repositories.application_repository import ApplicationRepository


@pytest.fixture
def mock_db_manager():
    """Mock database manager."""
    return MagicMock()


@pytest.fixture
def repository():
    """Create repository instance."""
    return ApplicationRepository()


@pytest.mark.asyncio
async def test_delete_success(repository, mock_db_manager, monkeypatch):
    """Test successful application deletion."""
    # Mock the db_manager
    monkeypatch.setattr('config_service.repositories.application_repository.db_manager', mock_db_manager)
    
    # Mock execute_command to return 1 (one row affected)
    mock_db_manager.execute_command = AsyncMock(return_value=1)
    
    app_id = "01HKQJQJQJQJQJQJQJQJQJQJQJ"
    
    # Call delete method
    result = await repository.delete(app_id)
    
    # Verify result
    assert result is True
    
    # Verify database call
    mock_db_manager.execute_command.assert_called_once_with(
        "DELETE FROM applications WHERE id = %s",
        (app_id,)
    )


@pytest.mark.asyncio
async def test_delete_not_found(repository, mock_db_manager, monkeypatch):
    """Test deletion when application doesn't exist."""
    # Mock the db_manager
    monkeypatch.setattr('config_service.repositories.application_repository.db_manager', mock_db_manager)
    
    # Mock execute_command to return 0 (no rows affected)
    mock_db_manager.execute_command = AsyncMock(return_value=0)
    
    app_id = "01HKQJQJQJQJQJQJQJQJQJQJQJ"
    
    # Call delete method
    result = await repository.delete(app_id)
    
    # Verify result
    assert result is False
    
    # Verify database call
    mock_db_manager.execute_command.assert_called_once_with(
        "DELETE FROM applications WHERE id = %s",
        (app_id,)
    )


@pytest.mark.asyncio
async def test_delete_database_error(repository, mock_db_manager, monkeypatch):
    """Test deletion with database error."""
    # Mock the db_manager
    monkeypatch.setattr('config_service.repositories.application_repository.db_manager', mock_db_manager)
    
    # Mock execute_command to raise an exception
    mock_db_manager.execute_command = AsyncMock(side_effect=Exception("Database error"))
    
    app_id = "01HKQJQJQJQJQJQJQJQJQJQJQJ"
    
    # Call delete method and expect RuntimeError
    with pytest.raises(RuntimeError, match="Failed to delete application"):
        await repository.delete(app_id)


@pytest.mark.asyncio
async def test_delete_multiple_success(repository, mock_db_manager, monkeypatch):
    """Test successful multiple application deletion."""
    # Mock the db_manager
    monkeypatch.setattr('config_service.repositories.application_repository.db_manager', mock_db_manager)
    
    # Mock execute_command to return 3 (three rows affected)
    mock_db_manager.execute_command = AsyncMock(return_value=3)
    
    app_ids = [
        "01HKQJQJQJQJQJQJQJQJQJQJQ1",
        "01HKQJQJQJQJQJQJQJQJQJQJQ2",
        "01HKQJQJQJQJQJQJQJQJQJQJQ3"
    ]
    
    # Call delete_multiple method
    result = await repository.delete_multiple(app_ids)
    
    # Verify result
    assert result == 3
    
    # Verify database call
    expected_query = "DELETE FROM applications WHERE id IN (%s,%s,%s)"
    mock_db_manager.execute_command.assert_called_once_with(
        expected_query,
        tuple(app_ids)
    )


@pytest.mark.asyncio
async def test_delete_multiple_empty_list(repository, mock_db_manager, monkeypatch):
    """Test multiple deletion with empty list."""
    # Mock the db_manager
    monkeypatch.setattr('config_service.repositories.application_repository.db_manager', mock_db_manager)
    
    # Call delete_multiple method with empty list
    result = await repository.delete_multiple([])
    
    # Verify result
    assert result == 0
    
    # Verify no database call was made
    mock_db_manager.execute_command.assert_not_called()


@pytest.mark.asyncio
async def test_delete_multiple_partial_success(repository, mock_db_manager, monkeypatch):
    """Test multiple deletion where only some applications exist."""
    # Mock the db_manager
    monkeypatch.setattr('config_service.repositories.application_repository.db_manager', mock_db_manager)
    
    # Mock execute_command to return 2 (only two rows affected out of three requested)
    mock_db_manager.execute_command = AsyncMock(return_value=2)
    
    app_ids = [
        "01HKQJQJQJQJQJQJQJQJQJQJQ1",  # exists
        "01HKQJQJQJQJQJQJQJQJQJQJQ2",  # exists
        "01HKQJQJQJQJQJQJQJQJQJQJQ3"   # doesn't exist
    ]
    
    # Call delete_multiple method
    result = await repository.delete_multiple(app_ids)
    
    # Verify result
    assert result == 2
    
    # Verify database call
    expected_query = "DELETE FROM applications WHERE id IN (%s,%s,%s)"
    mock_db_manager.execute_command.assert_called_once_with(
        expected_query,
        tuple(app_ids)
    )


@pytest.mark.asyncio
async def test_delete_multiple_database_error(repository, mock_db_manager, monkeypatch):
    """Test multiple deletion with database error."""
    # Mock the db_manager
    monkeypatch.setattr('config_service.repositories.application_repository.db_manager', mock_db_manager)
    
    # Mock execute_command to raise an exception
    mock_db_manager.execute_command = AsyncMock(side_effect=Exception("Database error"))
    
    app_ids = ["01HKQJQJQJQJQJQJQJQJQJQJQ1", "01HKQJQJQJQJQJQJQJQJQJQJQ2"]
    
    # Call delete_multiple method and expect RuntimeError
    with pytest.raises(RuntimeError, match="Failed to delete applications"):
        await repository.delete_multiple(app_ids)


@pytest.mark.asyncio
async def test_delete_multiple_single_id(repository, mock_db_manager, monkeypatch):
    """Test multiple deletion with single ID."""
    # Mock the db_manager
    monkeypatch.setattr('config_service.repositories.application_repository.db_manager', mock_db_manager)
    
    # Mock execute_command to return 1 (one row affected)
    mock_db_manager.execute_command = AsyncMock(return_value=1)
    
    app_ids = ["01HKQJQJQJQJQJQJQJQJQJQJQ1"]
    
    # Call delete_multiple method
    result = await repository.delete_multiple(app_ids)
    
    # Verify result
    assert result == 1
    
    # Verify database call
    expected_query = "DELETE FROM applications WHERE id IN (%s)"
    mock_db_manager.execute_command.assert_called_once_with(
        expected_query,
        tuple(app_ids)
    )