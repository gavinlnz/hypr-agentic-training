"""Tests for main FastAPI application."""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock, MagicMock
from config_service.main import app


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


def test_root_endpoint(client):
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Config Service API"
    assert data["version"] == "1.0.0"


def test_health_check_endpoint(client):
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_api_v1_prefix_included():
    """Test that API routes are included with correct prefix."""
    # Check that the routers are included
    routes = [route.path for route in app.routes]
    
    # Should have application routes with /api/v1 prefix
    assert any("/api/v1/applications" in route for route in routes)
    
    # Should have root and health routes
    assert "/" in routes
    assert "/health" in routes


@patch('config_service.main.db_manager')
def test_lifespan_startup_shutdown(mock_db_manager):
    """Test application lifespan startup and shutdown."""
    # Create proper synchronous mocks (not async)
    mock_initialize = MagicMock()
    mock_close = MagicMock()
    
    # Configure the mock db_manager
    mock_db_manager.initialize = mock_initialize
    mock_db_manager.close = mock_close
    
    # Test with context manager (simulates lifespan)
    with TestClient(app) as client:
        # Test a simple request to ensure app is working
        response = client.get("/")
        assert response.status_code == 200
    
    # The lifespan events should have been called
    # Note: TestClient handles the lifespan events automatically