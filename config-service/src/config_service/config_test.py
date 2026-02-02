"""Tests for application configuration."""

import os
from unittest.mock import patch
import pytest
from pydantic import ValidationError
from config_service.config import Settings


def test_settings_default_values():
    """Test that settings have appropriate default values."""
    # Create settings without .env file
    env_vars = {"DATABASE_URL": "postgresql://test:test@localhost/test"}
    with patch.dict(os.environ, env_vars, clear=True):
        # Create a settings instance that doesn't read from .env
        settings = Settings(_env_file=None)
        
        assert settings.database_url == "postgresql://test:test@localhost/test"
        assert settings.database_min_connections == 1
        assert settings.database_max_connections == 10
        assert settings.log_level == "INFO"
        assert settings.host == "0.0.0.0"
        assert settings.port == 8000
        assert settings.debug is False  # Default should be False when not set


def test_settings_from_environment():
    """Test that settings can be loaded from environment variables."""
    env_vars = {
        "DATABASE_URL": "postgresql://user:pass@db:5432/config_db",
        "DATABASE_MIN_CONNECTIONS": "2",
        "DATABASE_MAX_CONNECTIONS": "20",
        "LOG_LEVEL": "DEBUG",
        "HOST": "127.0.0.1",
        "PORT": "9000",
        "DEBUG": "true"
    }
    
    with patch.dict(os.environ, env_vars, clear=True):
        settings = Settings(_env_file=None)
        
        assert settings.database_url == "postgresql://user:pass@db:5432/config_db"
        assert settings.database_min_connections == 2
        assert settings.database_max_connections == 20
        assert settings.log_level == "DEBUG"
        assert settings.host == "127.0.0.1"
        assert settings.port == 9000
        assert settings.debug is True


def test_settings_validation_error():
    """Test that missing required settings raise validation error."""
    with patch.dict(os.environ, {}, clear=True):
        with pytest.raises(ValidationError):  # pydantic validation error
            Settings(_env_file=None)