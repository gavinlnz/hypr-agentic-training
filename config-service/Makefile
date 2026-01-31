.PHONY: install test run clean lint format migrate

# Install dependencies
install:
	uv sync

# Run tests
test:
	uv run python -m pytest

# Run the service
run:
	uv run python -m uvicorn src.config_service.main:app --reload --host 0.0.0.0 --port 8000

# Clean build artifacts
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +

# Run migrations
migrate:
	uv run python -m src.config_service.database.migrations

# Development setup
dev-setup: install
	cp .env.example .env
	@echo "Please edit .env with your database configuration"

# Help
help:
	@echo "Available targets:"
	@echo "  install    - Install dependencies with uv"
	@echo "  test       - Run tests with pytest"
	@echo "  run        - Run the service with uvicorn"
	@echo "  clean      - Clean build artifacts"
	@echo "  migrate    - Run database migrations"
	@echo "  dev-setup  - Set up development environment"