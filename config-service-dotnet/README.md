# Config Service API (.NET Core)

A .NET Core implementation of the Config Service API for managing application configurations.

## Features

- **RESTful API** with full CRUD operations for applications
- **PostgreSQL database** with raw SQL queries (no ORM)
- **ULID primary keys** for distributed-friendly identifiers
- **Comprehensive testing** with unit, integration, and repository tests
- **Docker support** with PostgreSQL test containers
- **Swagger/OpenAPI documentation**
- **Structured logging** with Serilog
- **CORS support** for frontend integration

## Architecture

The solution follows Clean Architecture principles:

- **ConfigService.Api** - Web API layer with controllers and configuration
- **ConfigService.Core** - Domain models, interfaces, and business logic
- **ConfigService.Infrastructure** - Data access and external dependencies
- **ConfigService.Tests** - Comprehensive test suite

## Prerequisites

- .NET 8.0 SDK
- PostgreSQL 14+ (or Docker for running PostgreSQL)
- Visual Studio 2022 or VS Code

## Database Setup

The API uses the same PostgreSQL database as the Python version:

```sql
-- Database: config_service
-- User: devuser
-- Password: 1aRm1cipPF77ZbI81MVqRWKn

CREATE TABLE applications (
    id VARCHAR(26) PRIMARY KEY,  -- ULID format
    name VARCHAR(256) NOT NULL UNIQUE,
    comments VARCHAR(1024),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_applications_name ON applications(name);
```

## Running the Application

### Development

```bash
cd config-service-dotnet/src/ConfigService.Api
dotnet run
```

The API will be available at:
- HTTP: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/swagger`

### Production

```bash
cd config-service-dotnet/src/ConfigService.Api
dotnet run --configuration Release
```

## API Endpoints

All endpoints are prefixed with `/api/v1`:

- `GET /` - API information
- `GET /health` - Health check
- `GET /applications` - List all applications
- `POST /applications` - Create new application
- `GET /applications/{id}` - Get application by ID (with config IDs)
- `PUT /applications/{id}` - Update application
- `DELETE /applications/{id}` - Delete application
- `DELETE /applications` - Delete multiple applications (bulk)

## Configuration

Configuration is handled through `appsettings.json`:

```json
{
  "Database": {
    "Host": "localhost",
    "Port": "5432",
    "Name": "config_service",
    "Username": "devuser",
    "Password": "1aRm1cipPF77ZbI81MVqRWKn"
  }
}
```

## Testing

The project includes comprehensive tests:

### Unit Tests
- Model validation tests
- ULID generation tests
- Controller logic tests with mocking

### Integration Tests
- Full HTTP API testing
- Database integration with test containers
- End-to-end workflow testing

### Repository Tests
- Database operations testing
- PostgreSQL test container integration
- Data persistence verification

### Running Tests

```bash
# Run all tests
cd config-service-dotnet
dotnet test

# Run with coverage
dotnet test --collect:"XPlat Code Coverage"

# Run specific test project
cd tests/ConfigService.Tests
dotnet test
```

## Key Features

### ULID Generation
Custom ULID implementation for distributed-friendly primary keys:
- Lexicographically sortable
- 26-character Base32 encoded
- Timestamp + randomness for uniqueness

### Database Access
- Raw SQL queries for performance and control
- PostgreSQL-specific optimizations
- Connection pooling and proper disposal
- Parameterized queries for security

### Error Handling
- Comprehensive exception handling
- Proper HTTP status codes
- Structured error responses
- Detailed logging

### Validation
- Model validation with data annotations
- ULID format validation
- Business rule enforcement
- Input sanitization

## Compatibility

This .NET implementation is fully compatible with the existing Python FastAPI version:

- **Same database schema** - Uses identical PostgreSQL tables
- **Same API contract** - Identical endpoints and response formats
- **Same port (8000)** - Can be used as drop-in replacement
- **Same CORS settings** - Works with existing frontend
- **Same ULID format** - Compatible identifiers

## Development Notes

### Switching Between Implementations

You can run either the Python or .NET version on port 8000:

1. **Stop the Python version**: Stop the FastAPI server
2. **Start the .NET version**: `dotnet run` in the API project
3. **Frontend compatibility**: The UI will work with either backend

### Database Migrations

The .NET version uses the same database schema as Python version. No migrations needed when switching between implementations.

### Logging

Structured logging with Serilog provides:
- Console output for development
- Structured JSON for production
- Request/response logging
- Error tracking with context

## Performance

The .NET implementation offers:
- **Fast startup time** with minimal dependencies
- **High throughput** with async/await patterns
- **Low memory usage** with efficient data structures
- **Connection pooling** for database efficiency

## Future Enhancements

- Configuration entity implementation
- Authentication and authorization
- Rate limiting and throttling
- Caching layer (Redis)
- Health checks with database connectivity
- Metrics and monitoring integration