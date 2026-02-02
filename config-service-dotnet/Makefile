# Config Service .NET Makefile

.PHONY: help build test run clean restore format lint

# Default target
help:
	@echo "Available targets:"
	@echo "  build    - Build the solution"
	@echo "  test     - Run all tests"
	@echo "  run      - Run the API in development mode"
	@echo "  clean    - Clean build artifacts"
	@echo "  restore  - Restore NuGet packages"
	@echo "  format   - Format code"
	@echo "  lint     - Run code analysis"

# Build the solution
build:
	dotnet build

# Run all tests
test:
	dotnet test --logger "console;verbosity=detailed"

# Run tests with coverage
test-coverage:
	dotnet test --collect:"XPlat Code Coverage" --results-directory ./TestResults

# Run the API
run:
	cd src/ConfigService.Api && dotnet run

# Run in production mode
run-prod:
	cd src/ConfigService.Api && dotnet run --configuration Release

# Clean build artifacts
clean:
	dotnet clean
	rm -rf **/bin **/obj TestResults

# Restore NuGet packages
restore:
	dotnet restore

# Format code
format:
	dotnet format

# Run code analysis
lint:
	dotnet format --verify-no-changes --verbosity diagnostic

# Watch and run tests
test-watch:
	dotnet watch test

# Watch and run API
run-watch:
	cd src/ConfigService.Api && dotnet watch run

# Create migration (placeholder for future use)
migrate:
	@echo "Database migrations not implemented yet"
	@echo "Use the existing PostgreSQL schema from the Python version"

# Setup development environment
setup:
	@echo "Setting up .NET development environment..."
	dotnet restore
	dotnet build
	@echo "Setup complete! Run 'make run' to start the API"

# Run integration tests only
test-integration:
	dotnet test --filter "Category=Integration"

# Run unit tests only  
test-unit:
	dotnet test --filter "Category!=Integration"

# Package for deployment
package:
	cd src/ConfigService.Api && dotnet publish -c Release -o ../../publish

# Docker build (future enhancement)
docker-build:
	@echo "Docker support not implemented yet"

# Check for security vulnerabilities
security-check:
	dotnet list package --vulnerable --include-transitive