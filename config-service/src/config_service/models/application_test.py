"""Tests for Application Pydantic models."""

import pytest
from datetime import datetime
from pydantic import ValidationError
from ulid import ULID as ULIDGenerator
from config_service.models.application import (
    ApplicationBase, ApplicationCreate, ApplicationUpdate, 
    Application, ApplicationWithConfigs
)


def test_application_base_valid():
    """Test ApplicationBase with valid data."""
    app = ApplicationBase(name="test-app", comments="Test application")
    assert app.name == "test-app"
    assert app.comments == "Test application"


def test_application_base_name_validation():
    """Test ApplicationBase name validation."""
    # Test minimum length
    with pytest.raises(ValidationError):
        ApplicationBase(name="")
    
    # Test maximum length
    long_name = "a" * 257
    with pytest.raises(ValidationError):
        ApplicationBase(name=long_name)


def test_application_base_comments_validation():
    """Test ApplicationBase comments validation."""
    # Valid comments
    app = ApplicationBase(name="test", comments="Valid comment")
    assert app.comments == "Valid comment"
    
    # Comments too long
    long_comments = "a" * 1025
    with pytest.raises(ValidationError):
        ApplicationBase(name="test", comments=long_comments)
    
    # Optional comments
    app = ApplicationBase(name="test")
    assert app.comments is None


def test_application_create():
    """Test ApplicationCreate model."""
    app_create = ApplicationCreate(name="new-app", comments="New application")
    assert app_create.name == "new-app"
    assert app_create.comments == "New application"


def test_application_update():
    """Test ApplicationUpdate model."""
    app_update = ApplicationUpdate(name="updated-app", comments="Updated")
    assert app_update.name == "updated-app"
    assert app_update.comments == "Updated"


def test_application_complete():
    """Test complete Application model."""
    ulid_str = str(ULIDGenerator())
    now = datetime.now()
    
    app = Application(
        id=ulid_str,
        name="complete-app",
        comments="Complete application",
        created_at=now,
        updated_at=now
    )
    
    assert app.id == ulid_str
    assert app.name == "complete-app"
    assert app.comments == "Complete application"
    assert app.created_at == now
    assert app.updated_at == now


def test_application_with_configs():
    """Test ApplicationWithConfigs model."""
    ulid_str = str(ULIDGenerator())
    config_ulid1 = str(ULIDGenerator())
    config_ulid2 = str(ULIDGenerator())
    now = datetime.now()
    
    app = ApplicationWithConfigs(
        id=ulid_str,
        name="app-with-configs",
        comments="App with configurations",
        created_at=now,
        updated_at=now,
        configuration_ids=[config_ulid1, config_ulid2]
    )
    
    assert app.id == ulid_str
    assert app.name == "app-with-configs"
    assert len(app.configuration_ids) == 2
    assert config_ulid1 in app.configuration_ids
    assert config_ulid2 in app.configuration_ids


def test_application_with_configs_empty_list():
    """Test ApplicationWithConfigs with empty configuration list."""
    ulid_str = str(ULIDGenerator())
    now = datetime.now()
    
    app = ApplicationWithConfigs(
        id=ulid_str,
        name="app-no-configs",
        comments="App without configurations",
        created_at=now,
        updated_at=now
    )
    
    assert app.configuration_ids == []


def test_application_json_serialization():
    """Test Application model JSON serialization."""
    ulid_str = str(ULIDGenerator())
    now = datetime.now()
    
    app = Application(
        id=ulid_str,
        name="json-app",
        comments="JSON test",
        created_at=now,
        updated_at=now
    )
    
    json_data = app.model_dump()
    assert json_data["id"] == ulid_str
    assert json_data["name"] == "json-app"
    assert json_data["comments"] == "JSON test"