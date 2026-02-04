#!/bin/bash

# Config Service Railway Deployment Script
# This script helps set up deployment to Railway

echo "🚀 Config Service Railway Deployment Setup"
echo "=========================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    echo "Please install Railway CLI first:"
    echo "npm install -g @railway/cli"
    echo "or visit: https://docs.railway.app/develop/cli"
    exit 1
fi

echo "✅ Railway CLI found"

# Login to Railway
echo "🔐 Logging into Railway..."
railway login

# Create new project
echo "📦 Creating new Railway project..."
railway init

# Add PostgreSQL service
echo "🗄️  Adding PostgreSQL database..."
railway add --service postgresql

# Deploy the API
echo "🚀 Deploying API service..."
railway up

echo "✅ Deployment initiated!"
echo ""
echo "Next steps:"
echo "1. Go to your Railway dashboard"
echo "2. Set up environment variables for your API service:"
echo "   - DATABASE_HOST (from PostgreSQL service)"
echo "   - DATABASE_PORT (from PostgreSQL service)"
echo "   - DATABASE_NAME (from PostgreSQL service)"
echo "   - DATABASE_USERNAME (from PostgreSQL service)"
echo "   - DATABASE_PASSWORD (from PostgreSQL service)"
echo "   - ASPNETCORE_ENVIRONMENT=Production"
echo ""
echo "3. Deploy your frontend separately or use a static hosting service"
echo "4. Update ui/.env.production with your API URL"
echo "5. Run database migrations on your production database"
echo ""
echo "🎉 Happy deploying!"