"""Database migration system."""

import os
import logging
from pathlib import Path
from typing import List, Dict, Any
from config_service.database.connection import db_manager

logger = logging.getLogger(__name__)


class MigrationManager:
    """Manages database schema migrations."""
    
    def __init__(self, migrations_dir: str = "migrations"):
        self.migrations_dir = Path(migrations_dir)
        self.migrations_table = "migrations"
    
    async def initialize_migrations_table(self):
        """Create the migrations tracking table if it doesn't exist."""
        create_table_sql = f"""
        CREATE TABLE IF NOT EXISTS {self.migrations_table} (
            id SERIAL PRIMARY KEY,
            filename VARCHAR(255) NOT NULL UNIQUE,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        
        try:
            await db_manager.execute_command(create_table_sql)
            logger.info("Migrations table initialized")
        except Exception as e:
            logger.error(f"Failed to initialize migrations table: {e}")
            raise
    
    async def get_applied_migrations(self) -> List[str]:
        """Get list of already applied migration filenames."""
        query = f"SELECT filename FROM {self.migrations_table} ORDER BY filename"
        
        try:
            results = await db_manager.execute_query(query)
            return [row['filename'] for row in results]
        except Exception as e:
            logger.error(f"Failed to get applied migrations: {e}")
            raise
    
    def get_migration_files(self) -> List[str]:
        """Get list of migration files from the migrations directory."""
        if not self.migrations_dir.exists():
            logger.warning(f"Migrations directory {self.migrations_dir} does not exist")
            return []
        
        migration_files = []
        for file_path in sorted(self.migrations_dir.glob("*.sql")):
            migration_files.append(file_path.name)
        
        return migration_files
    
    async def apply_migration(self, filename: str):
        """Apply a single migration file."""
        file_path = self.migrations_dir / filename
        
        if not file_path.exists():
            raise FileNotFoundError(f"Migration file {filename} not found")
        
        try:
            # Read and execute the migration SQL
            with open(file_path, 'r', encoding='utf-8') as f:
                migration_sql = f.read()
            
            # Execute the migration
            await db_manager.execute_command(migration_sql)
            
            # Record the migration as applied
            record_sql = f"INSERT INTO {self.migrations_table} (filename) VALUES (%s)"
            await db_manager.execute_command(record_sql, (filename,))
            
            logger.info(f"Applied migration: {filename}")
            
        except Exception as e:
            logger.error(f"Failed to apply migration {filename}: {e}")
            raise
    
    async def run_migrations(self):
        """Run all pending migrations."""
        try:
            # Initialize migrations table
            await self.initialize_migrations_table()
            
            # Get applied and available migrations
            applied_migrations = await self.get_applied_migrations()
            available_migrations = self.get_migration_files()
            
            # Find pending migrations
            pending_migrations = [
                filename for filename in available_migrations
                if filename not in applied_migrations
            ]
            
            if not pending_migrations:
                logger.info("No pending migrations")
                return
            
            # Apply pending migrations
            for filename in pending_migrations:
                await self.apply_migration(filename)
            
            logger.info(f"Applied {len(pending_migrations)} migrations")
            
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            raise


# Global migration manager instance
migration_manager = MigrationManager()


async def main():
    """Main function to run migrations from command line."""
    import asyncio
    
    # Initialize database manager
    db_manager.initialize()
    
    try:
        await migration_manager.run_migrations()
    finally:
        db_manager.close()


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())