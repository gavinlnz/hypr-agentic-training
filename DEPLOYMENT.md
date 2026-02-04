# Config Service Deployment Guide

This guide covers deploying the Config Service (both .NET API and Web UI) to various cloud platforms.

## Architecture Overview

- **Backend**: .NET Core 10 API with PostgreSQL database
- **Frontend**: Static Web UI (HTML/CSS/JS with Web Components)
- **Database**: PostgreSQL

## Recommended Deployment Options

### 🚀 Option 1: Railway (Recommended - Easiest)

Railway provides the simplest deployment experience with built-in PostgreSQL and automatic deployments.

#### Prerequisites
- GitHub repository (already set up)
- Railway account (free tier available)

#### Steps:

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy Database**
   - Create new project
   - Add PostgreSQL service
   - Note the connection details

3. **Deploy API**
   - Connect your GitHub repository
   - Railway will auto-detect the Dockerfile
   - Set environment variables:
     ```
     DATABASE_HOST=<from Railway PostgreSQL>
     DATABASE_PORT=<from Railway PostgreSQL>
     DATABASE_NAME=<from Railway PostgreSQL>
     DATABASE_USERNAME=<from Railway PostgreSQL>
     DATABASE_PASSWORD=<from Railway PostgreSQL>
     ASPNETCORE_ENVIRONMENT=Production
     ```

4. **Deploy Frontend**
   - Create separate service for UI
   - Set build command: `cd ui && npm install && npm run build`
   - Set start command: Static site serving from `ui/dist`
   - Update `ui/.env.production` with your API URL

#### Estimated Cost: 
- Free tier: $0/month (with limits)
- Paid: ~$5-20/month depending on usage

---

### 🔷 Option 2: Azure (Best for .NET)

Microsoft Azure provides excellent .NET support and integration.

#### Services Needed:
- **Azure App Service** (for .NET API)
- **Azure Database for PostgreSQL**
- **Azure Static Web Apps** (for frontend)

#### Steps:

1. **Create Azure Resources**
   ```bash
   # Install Azure CLI
   az login
   
   # Create resource group
   az group create --name config-service-rg --location eastus
   
   # Create PostgreSQL database
   az postgres flexible-server create \
     --resource-group config-service-rg \
     --name config-service-db \
     --admin-user configadmin \
     --admin-password <secure-password> \
     --sku-name Standard_B1ms
   
   # Create App Service
   az appservice plan create \
     --resource-group config-service-rg \
     --name config-service-plan \
     --sku B1 \
     --is-linux
   
   az webapp create \
     --resource-group config-service-rg \
     --plan config-service-plan \
     --name config-service-api \
     --runtime "DOTNETCORE:10.0"
   ```

2. **Deploy API**
   ```bash
   # From config-service-dotnet directory
   dotnet publish -c Release -o ./publish
   
   # Deploy to Azure
   az webapp deployment source config-zip \
     --resource-group config-service-rg \
     --name config-service-api \
     --src ./publish.zip
   ```

3. **Deploy Frontend**
   ```bash
   # Create Static Web App
   az staticwebapp create \
     --resource-group config-service-rg \
     --name config-service-ui \
     --source https://github.com/yourusername/your-repo \
     --branch main \
     --app-location "ui" \
     --output-location "dist"
   ```

#### Estimated Cost: ~$50-100/month

---

### 🟢 Option 3: Render

Simple alternative with good free tier.

#### Steps:

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Connect GitHub

2. **Deploy Database**
   - Create PostgreSQL service
   - Note connection details

3. **Deploy API**
   - Create Web Service
   - Connect repository
   - Set build command: `cd config-service-dotnet && dotnet publish -c Release -o out`
   - Set start command: `cd config-service-dotnet/out && dotnet ConfigService.Api.dll`
   - Add environment variables

4. **Deploy Frontend**
   - Create Static Site
   - Set build command: `cd ui && npm install && npm run build`
   - Set publish directory: `ui/dist`

#### Estimated Cost: 
- Free tier: $0/month (with limitations)
- Paid: ~$7-25/month

---

### ⚡ Option 4: AWS (Most Scalable)

For enterprise-grade deployment with maximum scalability.

#### Services Needed:
- **ECS Fargate** or **Elastic Beanstalk** (for .NET API)
- **RDS PostgreSQL** (for database)
- **S3 + CloudFront** (for frontend)

#### Estimated Cost: ~$30-100/month

---

## Pre-Deployment Checklist

### ✅ Backend (.NET API)
- [x] Dockerfile created
- [x] Production configuration added
- [x] Environment variable support
- [x] Health check endpoint (`/health`)
- [x] Swagger documentation enabled
- [x] CORS configured for production
- [x] Logging configured

### ✅ Frontend (Web UI)
- [x] Environment variable support added
- [x] Production build configuration
- [x] API URL configuration

### ✅ Database
- [ ] Run database migrations on production database
- [ ] Set up database connection string
- [ ] Configure database security (firewall rules)

## Database Migration

After deploying, you'll need to run the database migrations:

```sql
-- Connect to your production PostgreSQL database and run:

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
    id VARCHAR(26) PRIMARY KEY,
    name VARCHAR(256) NOT NULL UNIQUE,
    comments VARCHAR(1024),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_applications_name ON applications(name);
```

## Security Considerations

1. **Environment Variables**: Never commit secrets to Git
2. **CORS**: Update CORS policy for production domains
3. **HTTPS**: Ensure all traffic uses HTTPS
4. **Database**: Use strong passwords and restrict access
5. **API Keys**: If adding authentication, use secure key management

## Monitoring & Maintenance

1. **Health Checks**: Monitor `/health` endpoint
2. **Logs**: Set up log aggregation
3. **Backups**: Configure database backups
4. **Updates**: Plan for dependency updates

## Next Steps

1. Choose your preferred deployment platform
2. Set up accounts and billing
3. Deploy database first
4. Deploy API with environment variables
5. Deploy frontend with correct API URL
6. Run database migrations
7. Test the deployed application
8. Set up monitoring and backups

## Support

For deployment issues:
- Check application logs
- Verify environment variables
- Test database connectivity
- Confirm CORS settings
- Validate API endpoints with Swagger UI