# Technical Implementation Details

## API Specification

**Base URL**: `/api/v1`

### Endpoints

#### Applications
*   `GET /applications`: List all applications.
*   `POST /applications`: Create a new application.
*   `GET /applications/{id}`: Get application details (including config IDs).
*   `PUT /applications/{id}`: Update application metadata.
*   **Controller**: [src/ConfigService.Api/Controllers/ApplicationsController.cs](file:///src/ConfigService.Api/Controllers/ApplicationsController.cs)

#### Authentication & Users
*   `GET /auth/providers`: List OAuth providers.
*   `GET /auth/authorize/{provider}`: Get OAuth login URL.
*   `POST /auth/callback`: Complete OAuth login.
*   `POST /auth/refresh`: Refresh JWT token.
*   `GET /auth/me`: Get current user info.
*   `PUT /auth/users/{userId}/role`: Update user role (Admin only).
*   **Controller**: [src/ConfigService.Api/Controllers/AuthController.cs](file:///src/ConfigService.Api/Controllers/AuthController.cs)

#### Configurations (Planned)
*   **Status**: Implementation planned in `ConfigurationsController`.
*   **Controller**: [src/ConfigService.Api/Controllers/ConfigurationsController.cs](file:///src/ConfigService.Api/Controllers/ConfigurationsController.cs)

## Database Schema

### Tables

*   `applications`:
    *   `id` (ULID, PK)
    *   `name` (VARCHAR, Unique)
    *   `comments` (TEXT)
    *   `created_at`, `updated_at` (TIMESTAMP)

*   `users` (Implied/Managed via Auth Service):
    *   See `IUserService` implementation for schema details.
    *   Likely stores: `id`, `email`, `role`, `provider`, `provider_id`.

### Migrations
Managed via SQL files in `config-service-dotnet/migrations` or code-based runners.

## Backend Implementation (.NET 10.0)

### Clean Architecture Layers
*   **API**: Controllers handle HTTP requests and mapping. Authentication via JWT Bearer tokens.
*   **Core**: Contains `IUserService`, `IApplicationRepository`, and Domain Models (`Application`, `Auth`).
*   **Infrastructure**: Implements repositories using **Dapper** for raw SQL queries.

### Data Access
*   **Pattern**: Repository Pattern using Dapper.
*   **Context**: `DatabaseContext` manages `NpgsqlConnection`.
*   **SQL**: Raw SQL queries stored in repository methods for explicit control.

## Frontend Implementation

### State Management
*   **Local State**: Components manage their own UI state.
*   **Global/Shared State**: Handled via `CustomEvent` dispatching/listening.
    *   Events: `auth:login-success`, `auth:logged-out`, `app-navigate`.
    *   See [src/main.ts](file:///ui/src/main.ts) for event listeners.

### API Integration
*   `ApiClient` ([ui/src/services/api-client.ts](file:///ui/src/services/api-client.ts)) wraps `fetch` calls.
*   `AuthService` handles token management and refresh loops.

## Testing Strategy

### Backend
*   **Framework**: `xUnit`
*   **Location**: `config-service-dotnet/tests/ConfigService.Tests`
*   **Command**: `dotnet test` (in `config-service-dotnet/`)

### Frontend
*   **Unit Tests**: `Vitest`
*   **E2E Tests**: `Playwright`
*   **Command**: `pnpm test` (in `ui/`)
