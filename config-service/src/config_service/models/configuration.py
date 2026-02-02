"""Pydantic models for Configuration entity."""

from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, field_validator
import re


class ConfigurationBase(BaseModel):
    """Base configuration model with common fields."""
    application_id: str = Field(..., description="Application ID this configuration belongs to (ULID format)")
    name: str = Field(..., min_length=1, max_length=256, description="Configuration name")
    comments: Optional[str] = Field(None, max_length=1024, description="Configuration comments")
    config: Dict[str, Any] = Field(default_factory=dict, description="Configuration key-value pairs")
    
    @field_validator('application_id')
    @classmethod
    def validate_application_id(cls, v: str) -> str:
        """Validate that the application_id is a valid ULID format."""
        if not re.match(r'^[0-9A-HJKMNP-TV-Z]{26}$', v):
            raise ValueError('Invalid ULID format for application_id')
        return v


class ConfigurationCreate(ConfigurationBase):
    """Model for creating a new configuration."""
    pass


class ConfigurationUpdate(BaseModel):
    """Model for updating an existing configuration."""
    name: Optional[str] = Field(None, min_length=1, max_length=256, description="Configuration name")
    comments: Optional[str] = Field(None, max_length=1024, description="Configuration comments")
    config: Optional[Dict[str, Any]] = Field(None, description="Configuration key-value pairs")


class Configuration(ConfigurationBase):
    """Complete configuration model with all fields."""
    model_config = ConfigDict(from_attributes=True)
    
    id: str = Field(..., description="Configuration unique identifier (ULID format)")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    @field_validator('id')
    @classmethod
    def validate_id(cls, v: str) -> str:
        """Validate that the ID is a valid ULID format."""
        if not re.match(r'^[0-9A-HJKMNP-TV-Z]{26}$', v):
            raise ValueError('Invalid ULID format for id')
        return v