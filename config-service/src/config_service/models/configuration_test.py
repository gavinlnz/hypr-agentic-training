"""Tests for Configuration Pydantic models."""

import pytest
from datetime import datetime
from pydantic import ValidationError
from ulid import ULID as ULIDGenerator
from config_service.models.configuration import (
    ConfigurationBase, ConfigurationCreate, ConfigurationUpdate, Configuration
)


def test_configuration_base_valid():
    """Test ConfigurationBase with valid data."""
    app_id = str(ULIDGenerator())
    config = ConfigurationBase(
        application_id=app_id,
        name="test-config",
        comments="Test configuration",
        config={"key1": "value1", "key2": 42}
    )
    
    assert config.application_id == app_id
    assert config.name == "test-config"
    assert config.comments == "Test configuration"
    assert config.config == {"key1": "value1", "key2": 42}


def test_configuration_base_name_validation():
    """Test ConfigurationBase name validation."""
    app_id = str(ULIDGenerator())
    
    # Test minimum length
    with pytest.raises(ValidationError):
        ConfigurationBase(application_id=app_id, name="")
    
    # Test maximum length
    long_name = "a" * 257
    with pytest.raises(ValidationError):
        ConfigurationBase(application_id=app_id, name=long_name)


def test_configuration_base_comments_validation():
    """Test ConfigurationBase comments validation."""
    app_id = str(ULIDGenerator())
    
    # Valid comments
    config = ConfigurationBase(application_id=app_id, name="test", comments="Valid comment")
    assert config.comments == "Valid comment"
    
    # Comments too long
    long_comments = "a" * 1025
    with pytest.raises(ValidationError):
        ConfigurationBase(application_id=app_id, name="test", comments=long_comments)
    
    # Optional comments
    config = ConfigurationBase(application_id=app_id, name="test")
    assert config.comments is None


def test_configuration_base_config_default():
    """Test ConfigurationBase config field defaults to empty dict."""
    app_id = str(ULIDGenerator())
    config = ConfigurationBase(application_id=app_id, name="test")
    assert config.config == {}


def test_configuration_base_config_types():
    """Test ConfigurationBase config field accepts various types."""
    app_id = str(ULIDGenerator())
    
    # Test various data types in config
    config_data = {
        "string_key": "string_value",
        "int_key": 42,
        "float_key": 3.14,
        "bool_key": True,
        "list_key": [1, 2, 3],
        "dict_key": {"nested": "value"}
    }
    
    config = ConfigurationBase(
        application_id=app_id,
        name="test",
        config=config_data
    )
    
    assert config.config == config_data


def test_configuration_create():
    """Test ConfigurationCreate model."""
    app_id = str(ULIDGenerator())
    config_create = ConfigurationCreate(
        application_id=app_id,
        name="new-config",
        comments="New configuration",
        config={"env": "development"}
    )
    
    assert config_create.application_id == app_id
    assert config_create.name == "new-config"
    assert config_create.comments == "New configuration"
    assert config_create.config == {"env": "development"}


def test_configuration_update():
    """Test ConfigurationUpdate model."""
    config_update = ConfigurationUpdate(
        name="updated-config",
        comments="Updated configuration",
        config={"env": "production"}
    )
    
    assert config_update.name == "updated-config"
    assert config_update.comments == "Updated configuration"
    assert config_update.config == {"env": "production"}


def test_configuration_update_partial():
    """Test ConfigurationUpdate with partial data."""
    # Only name
    config_update = ConfigurationUpdate(name="partial-update")
    assert config_update.name == "partial-update"
    assert config_update.comments is None
    assert config_update.config is None
    
    # Only config
    config_update = ConfigurationUpdate(config={"key": "value"})
    assert config_update.name is None
    assert config_update.comments is None
    assert config_update.config == {"key": "value"}


def test_configuration_complete():
    """Test complete Configuration model."""
    app_id = str(ULIDGenerator())
    config_id = str(ULIDGenerator())
    now = datetime.now()
    
    config = Configuration(
        id=config_id,
        application_id=app_id,
        name="complete-config",
        comments="Complete configuration",
        config={"database_url": "postgresql://localhost/test"},
        created_at=now,
        updated_at=now
    )
    
    assert config.id == config_id
    assert config.application_id == app_id
    assert config.name == "complete-config"
    assert config.comments == "Complete configuration"
    assert config.config == {"database_url": "postgresql://localhost/test"}
    assert config.created_at == now
    assert config.updated_at == now


def test_configuration_json_serialization():
    """Test Configuration model JSON serialization."""
    app_id = str(ULIDGenerator())
    config_id = str(ULIDGenerator())
    now = datetime.now()
    
    config = Configuration(
        id=config_id,
        application_id=app_id,
        name="json-config",
        comments="JSON test",
        config={"key": "value"},
        created_at=now,
        updated_at=now
    )
    
    json_data = config.model_dump()
    assert json_data["id"] == config_id
    assert json_data["application_id"] == app_id
    assert json_data["name"] == "json-config"
    assert json_data["comments"] == "JSON test"
    assert json_data["config"] == {"key": "value"}