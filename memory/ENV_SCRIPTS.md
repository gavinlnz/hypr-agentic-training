# Environment and Scripts

## Environments
This project defines two primary environments:

### Local Development
The local environment consists of a PostgreSQL database, a .NET-based API service (`config-service-dotnet`), and a node-based Admin interface (`ui`).
- **Dependencies**: `dotnet` SDK, `npm` or `pnpm` (Node), `psql`/`createdb` (PostgreSQL).
- **Required Environment Variables** (usually placed in `config-service-dotnet/appsettings.Development.json` or `.env` equivalent):
  - `ConnectionStrings:DefaultConnection`: Connection string for PostgreSQL (e.g. `Host=localhost;Database=config_service;Username=devuser;Password=password`).
  - `ASPNETCORE_ENVIRONMENT`: Usually `Development`.
  - `ASPNETCORE_URLS`: Bind address (e.g., `http://localhost:8000`).

### Production (Railway)
The production environment is hosted on Railway using the provided `railway.json` configuration.
- **Scripts**: Controlled via `.github/workflows` or the `deploy-railway.sh` script.

---

## Developer Scripts & Commands

| Command/Script | Location | Description | When to Use |
| :--- | :--- | :--- | :--- |
| `./setup-dev.sh` | Root | Bootstraps the entire development environment (DB, API, UI). | Run first time after cloning or when wiping the environment. |
| `./deploy-railway.sh` | Root | Shell script to deploy the application to Railway. | Run when manuall deploying to the railway environment. |
| `make build` | `config-service-dotnet/` | Builds the .NET solution. | Run after pulling changes or before testing. |
| `make test` | `config-service-dotnet/` | Runs the .NET `dotnet test` suite. | Run before committing API code to ensure tests pass. |
| `make run` | `config-service-dotnet/` | Runs the `dotnet run` development server. | Run during active API development. |
| `make restore` | `config-service-dotnet/` | Restores NuGet packages. | Run when package references change. |
| `npm run dev` / `pnpm dev` | `ui/` | Starts the Vite dev server for the Admin UI on port 3000. | Run during active UI development. |

## Execution Guidelines
- **Always adhere to the approved scripts** above for standard development tasks. These scripts encapsulate the correct flags and dependency managers (`dotnet`, `pnpm`/`npm`).
- **Going off-script**: It is appropriate to run ad-hoc commands (e.g., `grep`, `ls`, file system manipulations) during exploratory debugging or when specifically requested by the developer. However, any persistent changes to environment setup or build processes MUST be codified into the standard scripts (e.g., `Makefile` or `setup-dev.sh`) rather than run ad-hoc.
