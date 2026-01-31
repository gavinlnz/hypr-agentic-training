"""Tests for database migration system."""

import pytest
from unittest.mock import Mock, patch, mock_open
from pathlib import Path
from config_service.database.migrations import MigrationManager


@pytest.fixture
def migration_manager():
    """Create a MigrationManager instance for testing."""
    return MigrationManager("test_migrations")


@pytest.mark.asyncio
async def test_initialize_migrations_table(migration_manager):
    """Test migrations table initialization."""
    with patch('config_service.database.migrations.db_manager') as mock_db:
        mock_db.execute_command.return_value = None
        
        await migration_manager.initialize_migrations_table()
        
        mock_db.execute_command.assert_called_once()
        call_args = mock_db.execute_command.call_args[0]
        assert "CREATE TABLE IF NOT EXISTS migrations" in call_args[0]


@pytest.mark.asyncio
async def test_get_applied_migrations(migration_manager):
    """Test getting applied migrations."""
    with patch('config_service.database.migrations.db_manager') as mock_db:
        mock_db.execute_query.return_value = [
            {'filename': '001_create_table.sql'},
            {'filename': '002_add_column.sql'}
        ]
        
        result = await migration_manager.get_applied_migrations()
        
        assert result == ['001_create_table.sql', '002_add_column.sql']
        mock_db.execute_query.assert_called_once()


def test_get_migration_files_directory_exists(migration_manager):
    """Test getting migration files when directory exists."""
    with patch.object(Path, 'exists', return_value=True), \
         patch.object(Path, 'glob') as mock_glob:
        
        mock_files = [
            Mock(name='001_create_table.sql'),
            Mock(name='002_add_column.sql')
        ]
        mock_glob.return_value = mock_files
        
        result = migration_manager.get_migration_files()
        
        assert result == ['001_create_table.sql', '002_add_column.sql']


def test_get_migration_files_directory_not_exists(migration_manager):
    """Test getting migration files when directory doesn't exist."""
    with patch.object(Path, 'exists', return_value=False):
        result = migration_manager.get_migration_files()
        assert result == []


@pytest.mark.asyncio
async def test_apply_migration_success(migration_manager):
    """Test successful migration application."""
    migration_sql = "CREATE TABLE test (id SERIAL PRIMARY KEY);"
    
    with patch('builtins.open', mock_open(read_data=migration_sql)), \
         patch.object(Path, 'exists', return_value=True), \
         patch('config_service.database.migrations.db_manager') as mock_db:
        
        mock_db.execute_command.return_value = None
        
        await migration_manager.apply_migration('001_test.sql')
        
        # Should execute migration SQL and record it
        assert mock_db.execute_command.call_count == 2
        
        # First call should be the migration SQL
        first_call = mock_db.execute_command.call_args_list[0]
        assert first_call[0][0] == migration_sql
        
        # Second call should record the migration
        second_call = mock_db.execute_command.call_args_list[1]
        assert "INSERT INTO migrations" in second_call[0][0]
        assert second_call[0][1] == ('001_test.sql',)


@pytest.mark.asyncio
async def test_apply_migration_file_not_found(migration_manager):
    """Test migration application when file doesn't exist."""
    with patch.object(Path, 'exists', return_value=False):
        with pytest.raises(FileNotFoundError):
            await migration_manager.apply_migration('nonexistent.sql')


@pytest.mark.asyncio
async def test_run_migrations_no_pending(migration_manager):
    """Test running migrations when none are pending."""
    with patch.object(migration_manager, 'initialize_migrations_table') as mock_init, \
         patch.object(migration_manager, 'get_applied_migrations', return_value=['001_test.sql']), \
         patch.object(migration_manager, 'get_migration_files', return_value=['001_test.sql']):
        
        await migration_manager.run_migrations()
        
        mock_init.assert_called_once()


@pytest.mark.asyncio
async def test_run_migrations_with_pending(migration_manager):
    """Test running migrations with pending migrations."""
    with patch.object(migration_manager, 'initialize_migrations_table') as mock_init, \
         patch.object(migration_manager, 'get_applied_migrations', return_value=['001_test.sql']), \
         patch.object(migration_manager, 'get_migration_files', return_value=['001_test.sql', '002_new.sql']), \
         patch.object(migration_manager, 'apply_migration') as mock_apply:
        
        await migration_manager.run_migrations()
        
        mock_init.assert_called_once()
        mock_apply.assert_called_once_with('002_new.sql')