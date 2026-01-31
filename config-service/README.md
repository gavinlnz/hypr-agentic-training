# Config Service API

A REST API service for managing application configurations built with FastAPI and PostgreSQL.

## Features

- Application management (CRUD operations)
- Configuration management with JSONB storage
- Raw SQL with connection pooling (no ORM)
- ULID primary keys for distributed systems
- Database migrations
- Comprehensive testing

## Tech Stack

- Python 3.13.5
- FastAPI 0.116.1
- PostgreSQL v16
- psycopg2 2.9.10
- Pydantic 2.11.7

## Quick Start

1. **Setup environment:**
   ```bash
   make dev-setup
   # Edit .env with your database configuration (already configured for local development)
   ```

2. **Setup database:**
   ```bash
   # Create the database and user (run as PostgreSQL superuser)
   psql -U postgres -f setup-db.sql
   
   # Or manually create database:
   createdb -U postgres config_service
   psql -U postgres -c "CREATE USER devuser WITH PASSWORD '1aRm1cipPF77ZbI81MVqRWKn';"
   psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE config_service TO devuser;"
   ```

3. **Install dependencies:**
   ```bash
   make install
   ```

4. **Run migrations:**
   ```bash
   make migrate
   ```

5. **Start the service:**
   ```bash
   make run
   ```

6. **Run tests:**
   ```bash
   make test
   ```

## API Endpoints

All endpoints are prefixed with `/api/v1`:

### Applications
- `POST /applications` - Create application
- `PUT /applications/{id}` - Update application
- `GET /applications/{id}` - Get application (includes related config IDs)
- `GET /applications` - List all applications

### Configurations
- `POST /configurations` - Create configuration
- `PUT /configurations/{id}` - Update configuration
- `GET /configurations/{id}` - Get configuration

## Database Schema

### Applications Table
- `id` (ULID, Primary Key)
- `name` (String, Unique, Max 256 chars)
- `comments` (String, Max 1024 chars)

### Configurations Table
- `id` (ULID, Primary Key)
- `application_id` (ULID, Foreign Key)
- `name` (String, Max 256 chars, Unique per application)
- `comments` (String, Max 1024 chars)
- `config` (JSONB, Key-value pairs)

## Development

The project uses `uv` for dependency management. All commands should be run through `uv` as shown in the Makefile.

### Project Structure
```
src/config_service/
├── main.py              # FastAPI application
├── config.py            # Environment configuration
├── database/            # Database layer
├── models/              # Pydantic models
├── repositories/        # Data access layer
└── routers/             # API routes
```

### Testing
- Unit tests are co-located with source files using `_test.py` suffix
- Tests focus on 80% coverage of critical functionality
- Use `httpx` for API endpoint testing