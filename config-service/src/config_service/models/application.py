"""Pydantic models for Application entity."""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, field_validator
import re


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
    
    id: str = Field(..., description="Application unique identifier (ULID format)")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    @field_validator('id')
    @classmethod
    def validate_ulid(cls, v: str) -> str:
        """Validate that the ID is a valid ULID format."""
        if not re.match(r'^[0-9A-HJKMNP-TV-Z]{26}$', v):
            raise ValueError('Invalid ULID format')
        return v


class ApplicationWithConfigs(Application):
    """Application model including related configuration IDs."""
    configuration_ids: List[str] = Field(default_factory=list, description="Related configuration IDs (ULID format)")
    
    @field_validator('configuration_ids')
    @classmethod
    def validate_config_ulids(cls, v: List[str]) -> List[str]:
        """Validate that all configuration IDs are valid ULID format."""
        for ulid in v:
            if not re.match(r'^[0-9A-HJKMNP-TV-Z]{26}$', ulid):
                raise ValueError(f'Invalid ULID format: {ulid}')
        return v