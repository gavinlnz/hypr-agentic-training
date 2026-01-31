# Config Service Project

A complete configuration management system with a REST API backend and modern web admin interface.

## Project Structure

```
├── config-service/     # FastAPI backend service
├── ui/                 # Web Components admin interface  
├── prompts/            # AI-assisted development prompts
├── JOURNAL.md          # Development process documentation
└── setup-dev.sh       # Development environment setup script
```

## Features

### Config Service API
- **FastAPI** REST API with automatic OpenAPI documentation
- **PostgreSQL** database with raw SQL (no ORM)
- **ULID** primary keys for distributed systems
- **Database migrations** with SQL files
- **Comprehensive testing** with pytest
- **Type safety** with Pydantic models

### Admin UI
- **Zero external frameworks** - pure Web Components + TypeScript
- **Responsive design** with mobile-first approach
- **Accessibility** WCAG 2.1 AA compliant
- **Modern tooling** with Vite, ESLint, Prettier
- **Testing** with Vitest (unit) and Playwright (E2E)

## Quick Start

### Prerequisites
- Python 3.13+
- Node.js 18+
- PostgreSQL 16+
- uv (Python package manager)
- pnpm (recommended) or npm

### Automated Setup

```bash
# Run the setup script
./setup-dev.sh
```

### Manual Setup

1. **Database Setup:**
   ```bash
   # Create database and user (as PostgreSQL superuser)
   psql -U postgres -f config-service/setup-db.sql
   ```

2. **Config Service:**
   ```bash
   cd config-service
   make install      # Install dependencies
   make migrate      # Run database migrations
   make run          # Start API server
   ```

3. **Admin UI:**
   ```bash
   cd ui
   pnpm install      # Install dependencies
   pnpm dev          # Start development server
   ```

## Development

### API Service (Port 8000)
```bash
cd config-service
make run              # Start development server
make test             # Run tests
make migrate          # Run database migrations
```

### Admin UI (Port 3000)
```bash
cd ui
pnpm dev              # Start development server
pnpm test             # Run unit tests
pnpm test:e2e         # Run E2E tests
pnpm build            # Build for production
```

## API Endpoints

All endpoints are prefixed with `/api/v1`:

### Applications
- `GET /applications` - List all applications
- `POST /applications` - Create new application
- `GET /applications/{id}` - Get application with config IDs
- `PUT /applications/{id}` - Update application

### Configurations (Planned)
- `GET /configurations/{id}` - Get configuration
- `POST /configurations` - Create configuration
- `PUT /configurations/{id}` - Update configuration

## Database Schema

### Applications
- `id` (ULID, Primary Key)
- `name` (String, Unique, Max 256 chars)
- `comments` (String, Max 1024 chars)
- `created_at`, `updated_at` (Timestamps)

### Configurations
- `id` (ULID, Primary Key)
- `application_id` (ULID, Foreign Key)
- `name` (String, Max 256 chars, Unique per application)
- `comments` (String, Max 1024 chars)
- `config` (JSONB, Key-value pairs)
- `created_at`, `updated_at` (Timestamps)

## Technology Stack

### Backend
- **Python 3.13** with **FastAPI 0.116.1**
- **PostgreSQL 16** with **psycopg2 2.9.10**
- **Pydantic 2.11.7** for validation
- **pytest 8.4.1** for testing
- **uv** for dependency management

### Frontend
- **TypeScript 5.3** with **Web Components**
- **Vite 5.0** for development and build
- **Vitest 1.0** for unit testing
- **Playwright 1.40** for E2E testing
- **pnpm** for dependency management

## Development Process

This project was built using AI-assisted specification-driven development:

1. **Requirements** → Detailed specifications
2. **Prompts** → AI-generated implementation plans  
3. **Implementation** → Code generation and refinement
4. **Testing** → Comprehensive test coverage

See `JOURNAL.md` for the complete development process documentation.

## URLs

- **API Server**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Admin UI**: http://localhost:3000

## License

MIT