#!/bin/bash

# Development setup script for Config Service
set -e

echo "🚀 Setting up Config Service development environment..."

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo "❌ PostgreSQL is not running on localhost:5432"
    echo "Please start PostgreSQL and try again"
    exit 1
fi

echo "✅ PostgreSQL is running"

# Setup config service
echo "📦 Setting up Config Service..."
cd config-service

# Install dependencies
echo "Installing Python dependencies..."
uv sync

# Check if database exists
if psql -U devuser -h localhost -d config_service -c '\q' 2>/dev/null; then
    echo "✅ Database config_service already exists"
else
    echo "🔧 Creating database..."
    # Try to create database as devuser first
    if ! createdb -U devuser -h localhost config_service 2>/dev/null; then
        echo "⚠️  Could not create database as devuser"
        echo "Please run the following as PostgreSQL superuser:"
        echo "  psql -U postgres -f setup-db.sql"
        echo "Or manually:"
        echo "  createdb -U postgres config_service"
        echo "  psql -U postgres -c \"GRANT ALL PRIVILEGES ON DATABASE config_service TO devuser;\""
        exit 1
    fi
    echo "✅ Database created"
fi

# Run migrations
echo "🔄 Running database migrations..."
uv run python -m src.config_service.database.migrations

echo "✅ Config Service setup complete!"

# Setup UI
cd ../ui
echo "📦 Setting up Admin UI..."

# Check if pnpm is available, fallback to npm
if command -v pnpm >/dev/null 2>&1; then
    echo "Installing UI dependencies with pnpm..."
    pnpm install
else
    echo "Installing UI dependencies with npm..."
    npm install
fi

echo "✅ Admin UI setup complete!"

cd ..

echo ""
echo "🎉 Development environment ready!"
echo ""
echo "To start the services:"
echo "  Config Service API: cd config-service && make run"
echo "  Admin UI:           cd ui && pnpm dev (or npm run dev)"
echo ""
echo "URLs:"
echo "  API:     http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo "  Admin UI: http://localhost:3000"