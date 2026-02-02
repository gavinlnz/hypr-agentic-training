#!/bin/bash

# Config Service .NET API Startup Script

echo "Starting Config Service API (.NET Core)"
echo "========================================"

# Check if .NET is installed
if ! command -v dotnet &> /dev/null; then
    echo "Error: .NET SDK is not installed"
    echo "Please install .NET 8.0 SDK from https://dotnet.microsoft.com/download"
    exit 1
fi

# Check if PostgreSQL is running
if ! nc -z localhost 5432; then
    echo "Warning: PostgreSQL is not running on localhost:5432"
    echo "Please ensure PostgreSQL is running with the config_service database"
fi

# Build the project
echo "Building the project..."
dotnet build src/ConfigService.Api

if [ $? -ne 0 ]; then
    echo "Build failed. Please check the errors above."
    exit 1
fi

echo ""
echo "Starting the API server..."
echo "API will be available at: http://localhost:8000"
echo "Swagger UI will be available at: http://localhost:8000/swagger"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Run the API
cd src/ConfigService.Api
dotnet run --urls="http://localhost:8000"