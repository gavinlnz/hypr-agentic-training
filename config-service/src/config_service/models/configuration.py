"""Pydantic models for Configuration entity."""

from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from pydantic_extra_types.ulid import ULID


class ConfigurationBase(BaseModel):
    """Base configuration model with common fields."""
    application_id: ULID = Field(..., description="Application ID this configuration belongs to")
    name: str = Field(..., min_length=1, max_length=256, description="Configuration name")
    comments: Optional[str] = Field(None, max_length=1024, description="Configuration comments")
    config: Dict[str, Any] = Field(default_factory=dict, description="Configuration key-value pairs")


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
    
    id: ULID = Field(..., description="Configuration unique identifier")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")