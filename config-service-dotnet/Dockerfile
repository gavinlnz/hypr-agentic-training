# Use the official .NET 10 runtime as base image
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080

# Use the SDK image to build the application
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project files
COPY ["src/ConfigService.Api/ConfigService.Api.csproj", "src/ConfigService.Api/"]
COPY ["src/ConfigService.Core/ConfigService.Core.csproj", "src/ConfigService.Core/"]
COPY ["src/ConfigService.Infrastructure/ConfigService.Infrastructure.csproj", "src/ConfigService.Infrastructure/"]

# Restore dependencies
RUN dotnet restore "src/ConfigService.Api/ConfigService.Api.csproj"

# Copy all source code
COPY . .

# Build the application
WORKDIR "/src/src/ConfigService.Api"
RUN dotnet build "ConfigService.Api.csproj" -c Release -o /app/build

# Publish the application
FROM build AS publish
RUN dotnet publish "ConfigService.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final stage - runtime image
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Create a non-root user
RUN adduser --disabled-password --gecos '' appuser && chown -R appuser /app
USER appuser

ENTRYPOINT ["dotnet", "ConfigService.Api.dll"]