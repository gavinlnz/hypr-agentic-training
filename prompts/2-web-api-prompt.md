# Config Service Implementation Prompt

Please create a comprehensive implementation plan for a Config Service REST API based on the following detailed specifications. I need you to strictly adhere to ALL details provided and use the EXACT versions specified. Do not add any additional dependencies without my explicit approval.

**TECH STACK (use these EXACT versions):**
- Python 3.13.5
- FastAPI 0.116.1  
- Pydantic 2.11.7
- pytest 8.4.1
- httpx 0.28.1
- PostgreSQL v16
- psycopg2 2.9.10
- pydantic-settings >=2.0.0,<3.0.0
- python-ulid >=2.0.0,<3.0.0

**DATA MODELS:**
- Applications table: id (ULID primary key), name (unique string 256), comments (string 1024)
- Configurations table: id (ULID primary key), application_id (ULID foreign key), name (string 256, unique per application), comments (string 1024), config (JSONB dictionary)

**API ENDPOINTS (prefixed with /api/v1):**
- Applications: POST, PUT /{id}, GET /{id} (include related config IDs), GET (list all)
- Configurations: POST, PUT /{id}, GET /{id}

**CRITICAL REQUIREMENTS:**
- NO ORM - use raw SQL statements with psycopg2
- Use ThreadedConnectionPool + ThreadPoolExecutor + asynccontextmanager
- Use RealDictCursor as cursor_factory
- Use Pydantic ULID for primary keys
- Implement migration system with migrations table, migrations/ folder, migrations.py, and migrations_test.py
- ALL code files need unit tests with _test.py suffix in same folder (80% coverage focus)
- Use .env file with pydantic-settings for configuration
- Use uv (not pip) for dependency management
- Include Makefile with common targets using uv syntax (e.g., `uv run python -m pytest`)
- Follow latest Python 3 datetime documentation from https://docs.python.org/3/library/time.html

Please provide a detailed file/folder structure, architectural patterns, and implementation approach. Ask me for clarification if you need any additional information.