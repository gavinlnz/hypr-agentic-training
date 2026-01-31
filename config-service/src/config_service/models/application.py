"""Pydantic models for Application entity."""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from pydantic_extra_types.ulid import ULID


class ApplicationBase(BaseModel):
    """Base application model with common fields."""
    name: str = Field(..., min_length=1, max_length=256, description="Application name")
    comments: Optional[str] = Field(None, max_length=1024, description="Application comments")


class ApplicationCreate(ApplicationBase):
    """Model for creating a new application."""
    pass


class ApplicationUpdate(ApplicationBase):
    """Model for updating an existing application."""
    pass


class Application(ApplicationBase):
    """Complete application model with all fields."""
    model_config = ConfigDict(from_attributes=True)
    
    id: ULID = Field(..., description="Application unique identifier")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")


class ApplicationWithConfigs(Application):
    """Application model including related configuration IDs."""
    configuration_ids: List[ULID] = Field(default_factory=list, description="Related configuration IDs")