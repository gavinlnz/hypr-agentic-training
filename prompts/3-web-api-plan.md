# Config Service Implementation Plan

## Project Structure

```
config-service/
├── .env.example
├── .env
├── .gitignore
├── Makefile
├── pyproject.toml
├── README.md
├── src/
│   └── config_service/
│       ├── __init__.py
│       ├── main.py
│       ├── main_test.py
│       ├── config.py
│       ├── config_test.py
│       ├── database/
│       │   ├── __init__.py
│       │   ├── connection.py
│       │   ├── connection_test.py
│       │   ├── migrations.py
│       │   └── migrations_test.py
│       ├── models/
│       │   ├── __init__.py
│       │   ├── application.py
│       │   ├── application_test.py
│       │   ├── configuration.py
│       │   └── configuration_test.py
│       ├── repositories/
│       │   ├── __init__.py
│       │   ├── application_repository.py
│       │   ├── application_repository_test.py
│       │   ├── configuration_repository.py
│       │   └── configuration_repository_test.py
│       └── routers/
│           ├── __init__.py
│           ├── applications.py
│           ├── applications_test.py
│           ├── configurations.py
│           └── configurations_test.py
└── migrations/
    ├── 001_create_migrations_table.sql
    ├── 002_create_applications_table.sql
    └── 003_create_configurations_table.sql
```

## Architecture Overview

**Layered Architecture:**
1. **API Layer** (`routers/`) - FastAPI route handlers with /api/v1 prefix
2. **Repository Layer** (`repositories/`) - Data access with raw SQL
3. **Model Layer** (`models/`) - Pydantic models for validation
4. **Database Layer** (`database/`) - Connection management and migrations

**Key Patterns:**
- Repository pattern for data access abstraction
- Dependency injection for database connections
- Async context managers for connection pooling
- Raw SQL with parameterized queries (no ORM)
- ULID for distributed-friendly primary keys

## Implementation Phases

### Phase 1: Project Foundation
1. **pyproject.toml** - Configure uv with exact dependency versions
2. **.env/.env.example** - Environment configuration templates
3. **Makefile** - Common tasks using uv syntax
4. **.gitignore** - Exclude .env, __pycache__, etc.

### Phase 2: Database Infrastructure
1. **connection.py** - ThreadedConnectionPool + ThreadPoolExecutor + asynccontextmanager
2. **migrations.py** - Migration system with migrations table tracking
3. **SQL migration files** - Create tables with proper constraints
4. **Unit tests** - Test connection pooling and migration system

### Phase 3: Data Models
1. **application.py** - Pydantic model with ULID, name validation
2. **configuration.py** - Pydantic model with ULID, JSONB config field
3. **Unit tests** - Validate model constraints and serialization

### Phase 4: Repository Layer
1. **application_repository.py** - Raw SQL CRUD operations
2. **configuration_repository.py** - Raw SQL CRUD with foreign key handling
3. **Unit tests** - Test SQL operations and constraint handling

### Phase 5: API Layer
1. **applications.py** - FastAPI routes with /api/v1 prefix
2. **configurations.py** - FastAPI routes with proper error handling
3. **main.py** - FastAPI app setup with dependency injection
4. **Unit tests** - Test endpoints using httpx

### Phase 6: Configuration & DevEx
1. **config.py** - pydantic-settings for environment variables
2. **README.md** - Setup and usage instructions
3. **Integration testing** - End-to-end API tests

## Key Technical Decisions

**Database Connection Strategy:**
- Use psycopg2.pool.ThreadedConnectionPool for connection management
- concurrent.futures.ThreadPoolExecutor for async database operations
- contextlib.asynccontextmanager for proper resource cleanup
- psycopg2.extras.RealDictCursor for dictionary-like row access

**ULID Implementation:**
- Use pydantic_extra_types.ulid.ULID for type validation
- Generate ULIDs in application code, not database
- Ensure proper JSON serialization for API responses

**Raw SQL Strategy:**
- All database operations use parameterized SQL queries
- No ORM dependencies (SQLAlchemy, etc.)
- Explicit transaction management for data consistency
- Proper error handling for constraint violations

**Testing Strategy:**
- Unit tests co-located with source files (_test.py suffix)
- Focus on 80% coverage of critical functionality
- Use httpx for API endpoint testing
- Test database operations with real connections

**Environment Configuration:**
- .env file for local development settings
- pydantic-settings for validation and type conversion
- Separate configuration for database, logging, etc.

## Dependencies (Exact Versions)

```toml
[project]
dependencies = [
    "fastapi==0.116.1",
    "pydantic==2.11.7",
    "pydantic-settings>=2.0.0,<3.0.0",
    "pydantic-extra-types>=2.0.0,<3.0.0",
    "python-ulid>=2.0.0,<3.0.0",
    "psycopg2==2.9.10",
    "uvicorn>=0.30.0,<1.0.0",
]

[project.optional-dependencies]
test = [
    "pytest==8.4.1",
    "httpx==0.28.1",
]
```

## Implementation Notes

1. **Migration System**: Track applied migrations in database table, run SQL files in order
2. **Connection Pooling**: Use ThreadedConnectionPool with proper min/max connections
3. **Error Handling**: Return appropriate HTTP status codes for constraint violations
4. **JSONB Handling**: Properly serialize/deserialize config dictionaries
5. **Foreign Keys**: Ensure configuration.application_id references valid applications
6. **Unique Constraints**: Enforce unique application names and config names per application

This plan provides a solid foundation for a production-ready Config Service API following all specified requirements.