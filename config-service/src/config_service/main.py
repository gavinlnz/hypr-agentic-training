"""Main FastAPI application."""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config_service.config import settings
from config_service.database.connection import db_manager
from config_service.routers import applications

# Configure logging
logging.basicConfig(level=getattr(logging, settings.log_level.upper()))
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("Starting Config Service API")
    db_manager.initialize()
    
    yield
    
    # Shutdown
    logger.info("Shutting down Config Service API")
    db_manager.close()


# Create FastAPI application
app = FastAPI(
    title="Config Service API",
    description="A REST API service for managing application configurations",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # UI dev server ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with /api/v1 prefix
app.include_router(applications.router, prefix="/api/v1", tags=["applications"])
# TODO: Add configurations router when implemented
# app.include_router(configurations.router, prefix="/api/v1", tags=["configurations"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Config Service API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )