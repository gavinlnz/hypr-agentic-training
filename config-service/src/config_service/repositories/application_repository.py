"""Repository for Application entity data access."""

import json
from typing import List, Optional
from datetime import datetime
from pydantic_extra_types.ulid import ULID
from config_service.database.connection import db_manager
from config_service.models.application import Application, ApplicationCreate, ApplicationUpdate, ApplicationWithConfigs


class ApplicationRepository:
    """Repository for Application entity operations using raw SQL."""
    
    async def create(self, application_data: ApplicationCreate) -> Application:
        """Create a new application."""
        app_id = ULID()
        now = datetime.now()
        
        query = """
        INSERT INTO applications (id, name, comments, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id, name, comments, created_at, updated_at
        """
        
        params = (str(app_id), application_data.name, application_data.comments, now, now)
        
        try:
            results = await db_manager.execute_query(query, params)
            if not results:
                raise RuntimeError("Failed to create application")
            
            row = results[0]
            return Application(
                id=ULID.from_str(row['id']),
                name=row['name'],
                comments=row['comments'],
                created_at=row['created_at'],
                updated_at=row['updated_at']
            )
        except Exception as e:
            raise RuntimeError(f"Failed to create application: {e}")
    
    async def get_by_id(self, app_id: ULID) -> Optional[Application]:
        """Get application by ID."""
        query = """
        SELECT id, name, comments, created_at, updated_at
        FROM applications
        WHERE id = %s
        """
        
        try:
            results = await db_manager.execute_query(query, (str(app_id),))
            if not results:
                return None
            
            row = results[0]
            return Application(
                id=ULID.from_str(row['id']),
                name=row['name'],
                comments=row['comments'],
                created_at=row['created_at'],
                updated_at=row['updated_at']
            )
        except Exception as e:
            raise RuntimeError(f"Failed to get application: {e}")
    
    async def get_by_id_with_configs(self, app_id: ULID) -> Optional[ApplicationWithConfigs]:
        """Get application by ID including related configuration IDs."""
        query = """
        SELECT 
            a.id, a.name, a.comments, a.created_at, a.updated_at,
            COALESCE(
                json_agg(c.id) FILTER (WHERE c.id IS NOT NULL), 
                '[]'::json
            ) as configuration_ids
        FROM applications a
        LEFT JOIN configurations c ON a.id = c.application_id
        WHERE a.id = %s
        GROUP BY a.id, a.name, a.comments, a.created_at, a.updated_at
        """
        
        try:
            results = await db_manager.execute_query(query, (str(app_id),))
            if not results:
                return None
            
            row = results[0]
            config_ids = []
            if row['configuration_ids'] and row['configuration_ids'] != [None]:
                config_ids = [ULID.from_str(cid) for cid in row['configuration_ids']]
            
            return ApplicationWithConfigs(
                id=ULID.from_str(row['id']),
                name=row['name'],
                comments=row['comments'],
                created_at=row['created_at'],
                updated_at=row['updated_at'],
                configuration_ids=config_ids
            )
        except Exception as e:
            raise RuntimeError(f"Failed to get application with configs: {e}")
    
    async def get_all(self) -> List[Application]:
        """Get all applications."""
        query = """
        SELECT id, name, comments, created_at, updated_at
        FROM applications
        ORDER BY name
        """
        
        try:
            results = await db_manager.execute_query(query)
            return [
                Application(
                    id=ULID.from_str(row['id']),
                    name=row['name'],
                    comments=row['comments'],
                    created_at=row['created_at'],
                    updated_at=row['updated_at']
                )
                for row in results
            ]
        except Exception as e:
            raise RuntimeError(f"Failed to get applications: {e}")
    
    async def update(self, app_id: ULID, application_data: ApplicationUpdate) -> Optional[Application]:
        """Update an existing application."""
        now = datetime.now()
        
        query = """
        UPDATE applications
        SET name = %s, comments = %s, updated_at = %s
        WHERE id = %s
        RETURNING id, name, comments, created_at, updated_at
        """
        
        params = (application_data.name, application_data.comments, now, str(app_id))
        
        try:
            results = await db_manager.execute_query(query, params)
            if not results:
                return None
            
            row = results[0]
            return Application(
                id=ULID.from_str(row['id']),
                name=row['name'],
                comments=row['comments'],
                created_at=row['created_at'],
                updated_at=row['updated_at']
            )
        except Exception as e:
            raise RuntimeError(f"Failed to update application: {e}")
    
    async def delete(self, app_id: ULID) -> bool:
        """Delete an application."""
        query = "DELETE FROM applications WHERE id = %s"
        
        try:
            affected_rows = await db_manager.execute_command(query, (str(app_id),))
            return affected_rows > 0
        except Exception as e:
            raise RuntimeError(f"Failed to delete application: {e}")


# Global repository instance
application_repository = ApplicationRepository()