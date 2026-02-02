"""Tests for Applications router delete endpoints."""

import json
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from config_service.main import app


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


def delete_with_json(client: TestClient, url: str, data: dict):
    """Helper function to make DELETE request with JSON body."""
    return client.request(
        "DELETE",
        url,
        json=data
    )


class TestDeleteApplication:
    """Tests for DELETE /applications/{app_id} endpoint."""

    @patch('config_service.routers.applications.application_repository')
    def test_delete_application_success(self, mock_repo, client):
        """Test successful application deletion."""
        # Mock repository to return True (application deleted)
        mock_repo.delete = AsyncMock(return_value=True)
        
        app_id = "01HKQJQJQJQJQJQJQJQJQJQJQJ"
        
        # Make DELETE request
        response = client.delete(f"/api/v1/applications/{app_id}")
        
        # Verify response
        assert response.status_code == 204
        assert response.content == b""
        
        # Verify repository was called
        mock_repo.delete.assert_called_once_with(app_id)

    @patch('config_service.routers.applications.application_repository')
    def test_delete_application_not_found(self, mock_repo, client):
        """Test deletion of non-existent application."""
        # Mock repository to return False (application not found)
        mock_repo.delete = AsyncMock(return_value=False)
        
        app_id = "01HKQJQJQJQJQJQJQJQJQJQJQJ"
        
        # Make DELETE request
        response = client.delete(f"/api/v1/applications/{app_id}")
        
        # Verify response
        assert response.status_code == 404
        assert response.json()["detail"] == "Application not found"
        
        # Verify repository was called
        mock_repo.delete.assert_called_once_with(app_id)

    def test_delete_application_invalid_ulid(self, client):
        """Test deletion with invalid ULID format."""
        invalid_id = "invalid-ulid"
        
        # Make DELETE request
        response = client.delete(f"/api/v1/applications/{invalid_id}")
        
        # Verify response
        assert response.status_code == 400
        assert response.json()["detail"] == "Invalid application ID format"

    @patch('config_service.routers.applications.application_repository')
    def test_delete_application_database_error(self, mock_repo, client):
        """Test deletion with database error."""
        # Mock repository to raise an exception
        mock_repo.delete = AsyncMock(side_effect=Exception("Database error"))
        
        app_id = "01HKQJQJQJQJQJQJQJQJQJQJQJ"
        
        # Make DELETE request
        response = client.delete(f"/api/v1/applications/{app_id}")
        
        # Verify response
        assert response.status_code == 500
        assert response.json()["detail"] == "Failed to delete application"


class TestDeleteApplications:
    """Tests for DELETE /applications endpoint (bulk delete)."""

    @patch('config_service.routers.applications.application_repository')
    def test_delete_applications_success(self, mock_repo, client):
        """Test successful bulk application deletion."""
        # Mock repository to return 3 (three applications deleted)
        mock_repo.delete_multiple = AsyncMock(return_value=3)
        
        app_ids = [
            "01HKQJQJQJQJQJQJQJQJQJQJQ1",
            "01HKQJQJQJQJQJQJQJQJQJQJQ2",
            "01HKQJQJQJQJQJQJQJQJQJQJQ3"
        ]
        
        # Make DELETE request with JSON body
        response = delete_with_json(client, "/api/v1/applications", {"ids": app_ids})
        
        # Verify response
        assert response.status_code == 204
        assert response.content == b""
        
        # Verify repository was called
        mock_repo.delete_multiple.assert_called_once_with(app_ids)

    @patch('config_service.routers.applications.application_repository')
    def test_delete_applications_partial_success(self, mock_repo, client):
        """Test bulk deletion where only some applications exist."""
        # Mock repository to return 2 (only two applications deleted)
        mock_repo.delete_multiple = AsyncMock(return_value=2)
        
        app_ids = [
            "01HKQJQJQJQJQJQJQJQJQJQJQ1",
            "01HKQJQJQJQJQJQJQJQJQJQJQ2",
            "01HKQJQJQJQJQJQJQJQJQJQJQ3"  # This one doesn't exist
        ]
        
        # Make DELETE request with JSON body
        response = delete_with_json(client, "/api/v1/applications", {"ids": app_ids})
        
        # Verify response (should still be successful)
        assert response.status_code == 204
        assert response.content == b""
        
        # Verify repository was called
        mock_repo.delete_multiple.assert_called_once_with(app_ids)

    @patch('config_service.routers.applications.application_repository')
    def test_delete_applications_none_found(self, mock_repo, client):
        """Test bulk deletion when no applications exist."""
        # Mock repository to return 0 (no applications deleted)
        mock_repo.delete_multiple = AsyncMock(return_value=0)
        
        app_ids = [
            "01HKQJQJQJQJQJQJQJQJQJQJQ1",
            "01HKQJQJQJQJQJQJQJQJQJQJQ2"
        ]
        
        # Make DELETE request with JSON body
        response = delete_with_json(client, "/api/v1/applications", {"ids": app_ids})
        
        # Verify response
        assert response.status_code == 404
        assert response.json()["detail"] == "No applications found to delete"
        
        # Verify repository was called
        mock_repo.delete_multiple.assert_called_once_with(app_ids)

    def test_delete_applications_empty_ids(self, client):
        """Test bulk deletion with empty IDs list."""
        # Make DELETE request with empty IDs
        response = delete_with_json(client, "/api/v1/applications", {"ids": []})
        
        # Verify response
        assert response.status_code == 400
        assert response.json()["detail"] == "No application IDs provided"

    def test_delete_applications_no_ids_key(self, client):
        """Test bulk deletion without 'ids' key in JSON."""
        # Make DELETE request without 'ids' key
        response = delete_with_json(client, "/api/v1/applications", {})
        
        # Verify response
        assert response.status_code == 400
        assert response.json()["detail"] == "No application IDs provided"

    def test_delete_applications_invalid_ulid(self, client):
        """Test bulk deletion with invalid ULID format."""
        app_ids = [
            "01HKQJQJQJQJQJQJQJQJQJQJQ1",  # Valid
            "invalid-ulid",                 # Invalid
            "01HKQJQJQJQJQJQJQJQJQJQJQ3"   # Valid
        ]
        
        # Make DELETE request with invalid ULID
        response = delete_with_json(client, "/api/v1/applications", {"ids": app_ids})
        
        # Verify response
        assert response.status_code == 400
        assert "Invalid application ID format: invalid-ulid" in response.json()["detail"]

    @patch('config_service.routers.applications.application_repository')
    def test_delete_applications_database_error(self, mock_repo, client):
        """Test bulk deletion with database error."""
        # Mock repository to raise an exception
        mock_repo.delete_multiple = AsyncMock(side_effect=Exception("Database error"))
        
        app_ids = [
            "01HKQJQJQJQJQJQJQJQJQJQJQ1",
            "01HKQJQJQJQJQJQJQJQJQJQJQ2"
        ]
        
        # Make DELETE request
        response = delete_with_json(client, "/api/v1/applications", {"ids": app_ids})
        
        # Verify response
        assert response.status_code == 500
        assert response.json()["detail"] == "Failed to delete applications"

    @patch('config_service.routers.applications.application_repository')
    def test_delete_applications_single_id(self, mock_repo, client):
        """Test bulk deletion with single ID."""
        # Mock repository to return 1 (one application deleted)
        mock_repo.delete_multiple = AsyncMock(return_value=1)
        
        app_ids = ["01HKQJQJQJQJQJQJQJQJQJQJQ1"]
        
        # Make DELETE request with single ID
        response = delete_with_json(client, "/api/v1/applications", {"ids": app_ids})
        
        # Verify response
        assert response.status_code == 204
        assert response.content == b""
        
        # Verify repository was called
        mock_repo.delete_multiple.assert_called_once_with(app_ids)