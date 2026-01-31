"""Application configuration using pydantic-settings."""

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database configuration
    database_url: str = Field(..., description="PostgreSQL connection URL")
    database_min_connections: int = Field(1, description="Minimum database connections")
    database_max_connections: int = Field(10, description="Maximum database connections")
    
    # Application configuration
    log_level: str = Field("INFO", description="Logging level")
    host: str = Field("0.0.0.0", description="Host to bind to")
    port: int = Field(8000, description="Port to bind to")
    debug: bool = Field(False, description="Enable debug mode")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Global settings instance
settings = Settings()