"""Repository for Application entity data access."""

import json
from typing import List, Optional
from datetime import datetime
from ulid import ULID as ULIDGenerator
from config_service.database.connection import db_manager
from config_service.models.application import Application, ApplicationCreate, ApplicationUpdate, ApplicationWithConfigs


class ApplicationRepository:
    """Repository for Application entity operations using raw SQL."""
    
    async def create(self, application_data: ApplicationCreate) -> Application:
        """Create a new application."""
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            app_id = str(ULIDGenerator())  # Convert to string immediately
            logger.info(f"Generated ULID: {app_id}")
            
            now = datetime.now()
            logger.info(f"Current time: {now}")
            
            query = """
            INSERT INTO applications (id, name, comments, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, name, comments, created_at, updated_at
            """
            
            params = (app_id, application_data.name, application_data.comments, now, now)
            logger.info(f"Query params: {params}")
            
            # Use execute_returning_query for INSERT with RETURNING
            results = await db_manager.execute_returning_query(query, params)
            logger.info(f"Query results: {results}")
            
            if not results:
                raise RuntimeError("Failed to create application")
            
            row = results[0]
            logger.info(f"Row data: {row}")
            
            app = Application(
                id=row['id'],
                name=row['name'],
                comments=row['comments'],
                created_at=row['created_at'],
                updated_at=row['updated_at']
            )
            logger.info(f"Created Application object: {app}")
            return app
            
        except Exception as e:
            logger.error(f"Error in create method: {e}", exc_info=True)
            raise RuntimeError(f"Failed to create application: {e}")
    
    async def get_by_id(self, app_id: str) -> Optional[Application]:
        """Get application by ID."""
        query = """
        SELECT id, name, comments, created_at, updated_at
        FROM applications
        WHERE id = %s
        """
        
        try:
            results = await db_manager.execute_query(query, (app_id,))
            if not results:
                return None
            
            row = results[0]
            return Application(
                id=row['id'],
                name=row['name'],
                comments=row['comments'],
                created_at=row['created_at'],
                updated_at=row['updated_at']
            )
        except Exception as e:
            raise RuntimeError(f"Failed to get application: {e}")
    
    async def get_by_id_with_configs(self, app_id: str) -> Optional[ApplicationWithConfigs]:
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
            results = await db_manager.execute_query(query, (app_id,))
            if not results:
                return None
            
            row = results[0]
            config_ids = []
            if row['configuration_ids'] and row['configuration_ids'] != [None]:
                config_ids = [cid for cid in row['configuration_ids']]
            
            return ApplicationWithConfigs(
                id=row['id'],
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
                    id=row['id'],
                    name=row['name'],
                    comments=row['comments'],
                    created_at=row['created_at'],
                    updated_at=row['updated_at']
                )
                for row in results
            ]
        except Exception as e:
            raise RuntimeError(f"Failed to get applications: {e}")
    
    async def update(self, app_id: str, application_data: ApplicationUpdate) -> Optional[Application]:
        """Update an existing application."""
        now = datetime.now()
        
        query = """
        UPDATE applications
        SET name = %s, comments = %s, updated_at = %s
        WHERE id = %s
        RETURNING id, name, comments, created_at, updated_at
        """
        
        params = (application_data.name, application_data.comments, now, app_id)
        
        try:
            results = await db_manager.execute_returning_query(query, params)
            if not results:
                return None
            
            row = results[0]
            return Application(
                id=row['id'],
                name=row['name'],
                comments=row['comments'],
                created_at=row['created_at'],
                updated_at=row['updated_at']
            )
        except Exception as e:
            raise RuntimeError(f"Failed to update application: {e}")
    
    async def delete(self, app_id: str) -> bool:
        """Delete an application."""
        query = "DELETE FROM applications WHERE id = %s"
        
        try:
            affected_rows = await db_manager.execute_command(query, (app_id,))
            return affected_rows > 0
        except Exception as e:
            raise RuntimeError(f"Failed to delete application: {e}")
    
    async def delete_multiple(self, app_ids: List[str]) -> int:
        """Delete multiple applications by IDs."""
        if not app_ids:
            return 0
        
        # Create placeholders for the IN clause
        placeholders = ','.join(['%s'] * len(app_ids))
        query = f"DELETE FROM applications WHERE id IN ({placeholders})"
        
        try:
            affected_rows = await db_manager.execute_command(query, tuple(app_ids))
            return affected_rows
        except Exception as e:
            raise RuntimeError(f"Failed to delete applications: {e}")


# Global repository instance
application_repository = ApplicationRepository()