"""API routes for Application management."""

from typing import List
from fastapi import APIRouter, HTTPException, status
from pydantic_extra_types.ulid import ULID
from config_service.models.application import (
    Application, ApplicationCreate, ApplicationUpdate, ApplicationWithConfigs
)
from config_service.repositories.application_repository import application_repository

router = APIRouter()


@router.post("/applications", response_model=Application, status_code=status.HTTP_201_CREATED)
async def create_application(application_data: ApplicationCreate):
    """Create a new application."""
    try:
        return await application_repository.create(application_data)
    except RuntimeError as e:
        if "unique constraint" in str(e).lower() or "duplicate" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Application with name '{application_data.name}' already exists"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create application"
        )


@router.get("/applications/{app_id}", response_model=ApplicationWithConfigs)
async def get_application(app_id: str):
    """Get application by ID including related configuration IDs."""
    try:
        ulid_id = ULID.from_str(app_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid application ID format"
        )
    
    try:
        application = await application_repository.get_by_id_with_configs(ulid_id)
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
    try:
        ulid_id = ULID.from_str(app_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid application ID format"
        )
    
    try:
        application = await application_repository.update(ulid_id, application_data)
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