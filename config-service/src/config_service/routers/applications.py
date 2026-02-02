"""API routes for Application management."""

import logging
from typing import List
from fastapi import APIRouter, HTTPException, status
from config_service.models.application import (
    Application, ApplicationCreate, ApplicationUpdate, ApplicationWithConfigs
)
from config_service.repositories.application_repository import application_repository
import re

logger = logging.getLogger(__name__)
router = APIRouter()


def validate_ulid(ulid_str: str) -> bool:
    """Validate ULID format."""
    return bool(re.match(r'^[0-9A-HJKMNP-TV-Z]{26}$', ulid_str))


@router.post("/applications", response_model=Application, status_code=status.HTTP_201_CREATED)
async def create_application(application_data: ApplicationCreate):
    """Create a new application."""
    try:
        logger.info(f"Creating application: {application_data}")
        result = await application_repository.create(application_data)
        logger.info(f"Application created successfully: {result}")
        return result
    except RuntimeError as e:
        logger.error(f"RuntimeError creating application: {e}")
        if "unique constraint" in str(e).lower() or "duplicate" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Application with name '{application_data.name}' already exists"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create application"
        )
    except Exception as e:
        logger.error(f"Unexpected error creating application: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create application"
        )


@router.get("/applications/{app_id}", response_model=ApplicationWithConfigs)
async def get_application(app_id: str):
    """Get application by ID including related configuration IDs."""
    if not validate_ulid(app_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid application ID format"
        )
    
    try:
        application = await application_repository.get_by_id_with_configs(app_id)
        if not application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )
        return application
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get application"
        )


@router.get("/applications", response_model=List[Application])
async def list_applications():
    """Get all applications."""
    try:
        return await application_repository.get_all()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list applications"
        )


@router.put("/applications/{app_id}", response_model=Application)
async def update_application(app_id: str, application_data: ApplicationUpdate):
    """Update an existing application."""
    if not validate_ulid(app_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid application ID format"
        )
    
    try:
        application = await application_repository.update(app_id, application_data)
        if not application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )
        return application
    except HTTPException:
        raise
    except RuntimeError as e:
        if "unique constraint" in str(e).lower() or "duplicate" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Application with name '{application_data.name}' already exists"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update application"
        )

@router.delete("/applications/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(app_id: str):
    """Delete an application by ID."""
    if not validate_ulid(app_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid application ID format"
        )
    
    try:
        deleted = await application_repository.delete(app_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting application {app_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete application"
        )


@router.delete("/applications", status_code=status.HTTP_204_NO_CONTENT)
async def delete_applications(request_body: dict):
    """Delete multiple applications by IDs."""
    app_ids = request_body.get('ids', [])
    
    if not app_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No application IDs provided"
        )
    
    # Validate all ULIDs
    for app_id in app_ids:
        if not validate_ulid(app_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid application ID format: {app_id}"
            )
    
    try:
        deleted_count = await application_repository.delete_multiple(app_ids)
        if deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No applications found to delete"
            )
        logger.info(f"Deleted {deleted_count} applications")
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting applications {app_ids}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete applications"
        )