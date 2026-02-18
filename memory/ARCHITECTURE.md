# Project Architecture

## Core Principles
- **Native First**: Minimize external dependencies to reduce "framework rot."
- **Explicit over Implicit**: Use raw SQL and native Web Components instead of heavy abstractions.

## Implementation Details

### Backend (.NET 10.0)
- **Clean Architecture**: 
  - **API** (`ConfigService.Api`): Controllers (`AuthController`, `ApplicationsController`) and Middleware.
  - **Core** (`ConfigService.Core`): Domain Models, Interfaces (`IUserService`, `IApplicationRepository`), and Business Logic.
  - **Infrastructure** (`ConfigService.Infrastructure`): Data access implementation (`Repositories`), External Services (`UserService`), and Database Context.
- **Data Access**: Raw SQL via Dapper and `Npgsql` for maximum performance and explicit query control.
- **Authentication**: JWT-based OAuth flow with local user persistence.
- **ULID IDs**: Universally Unique Lexicographically Sortable Identifiers for primary keys.

### Frontend (TypeScript/Web Components)
- **Component-Based**: Native Web Components extending `BaseComponent` (`ui/src/components/base/base-component.ts`).
- **State via Events**: Custom events for cross-component communication.
- **Services**: Centralized logic in `ui/src/services` to keep components thin.
- **Vite Build**: Modern ESM-based development experience.

### Infrastructure
- **PostgreSQL**: Robust, relational storage with JSONB support (`config` column).
- **SQL Migrations**: Version-controlled SQL files managed via DbUp or custom runners.
