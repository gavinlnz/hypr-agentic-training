using ConfigService.Api.Middleware;
using ConfigService.Core.Interfaces;
using ConfigService.Core.Models;
using ConfigService.Infrastructure.Data;
using ConfigService.Infrastructure.Repositories;
using ConfigService.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using System.Text;
using System.Text.Json;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.WriteIndented = false;
    })
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context.ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage);
            
            return new BadRequestObjectResult(new { message = string.Join("; ", errors) });
        };
    });

// Configure JSON serialization for minimal APIs
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.WriteIndented = false;
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add CORS with more restrictive settings for production
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            // Development: Allow localhost origins
            policy.WithOrigins("http://localhost:3000", "http://localhost:3001", "http://localhost:3002")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
        else
        {
            // Production: Configure specific origins
            var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
    });
});

// Add rate limiting
builder.Services.AddRateLimiter(options =>
{
    // Global rate limit
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.User.Identity?.Name ?? httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 100, // 100 requests per window
                Window = TimeSpan.FromMinutes(1) // 1 minute window
            }));

    // Authentication endpoints rate limit (more restrictive)
    options.AddPolicy("AuthPolicy", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 10, // 10 auth attempts per window
                Window = TimeSpan.FromMinutes(5) // 5 minute window
            }));

    // API endpoints rate limit (per user)
    options.AddPolicy("ApiPolicy", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.User.Identity?.Name ?? "anonymous",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 1000, // 1000 requests per window for authenticated users
                Window = TimeSpan.FromMinutes(1)
            }));
});

// Configure JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "ConfigService";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "ConfigService";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization(options =>
{
    // Default policy requires authentication
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
    
    // Admin policy for administrative operations
    options.AddPolicy("AdminOnly", policy =>
        policy.RequireRole("Admin"));
    
    // User policy for regular operations
    options.AddPolicy("UserOrAdmin", policy =>
        policy.RequireRole("User", "Admin"));
});

// Register dependencies
builder.Services.AddScoped<DatabaseContext>();
builder.Services.AddScoped<IApplicationRepository, ApplicationRepository>();
builder.Services.AddScoped<IConfigurationRepository, ConfigurationRepository>();

// Register OAuth services in dependency order
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddHttpClient<IOAuthService, OAuthService>();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Always enable Swagger in production for API documentation
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Config Service API v1");
    c.RoutePrefix = "swagger";
});

app.UseCors();

// Add custom security middleware
app.UseSecurityMiddleware();

// Add rate limiting
app.UseRateLimiter();

// Add authentication and authorization middleware
app.UseAuthentication();
app.UseAuthorization();

// Add root endpoint (public - API information)
app.MapGet("/", () => new { message = "Config Service API", version = "1.0.0" })
    .WithTags("Public")
    .WithSummary("Get API information")
    .WithOpenApi();

// Add health check endpoint (public - for load balancers and monitoring)
app.MapGet("/health", () => new { status = "healthy", timestamp = DateTime.UtcNow })
    .WithTags("Public")
    .WithSummary("Health check endpoint")
    .WithOpenApi();

// Add OAuth callback endpoint (for GitHub OAuth app compatibility)
app.MapGet("/auth/callback", async (
    string? code,
    string? state,
    string? error,
    string? provider,
    IOAuthService oauthService,
    ILogger<Program> logger) =>
{
    try
    {
        if (!string.IsNullOrEmpty(error))
        {
            logger.LogWarning("OAuth error: {Error}", error);
            return Results.Redirect("http://localhost:3001/?error=" + Uri.EscapeDataString(error));
        }

        if (string.IsNullOrEmpty(code) || string.IsNullOrEmpty(provider))
        {
            logger.LogWarning("Missing required OAuth parameters");
            return Results.Redirect("http://localhost:3001/?error=invalid_request");
        }

        // Handle the OAuth callback
        var request = new OAuthCallbackRequest
        {
            Provider = provider,
            Code = code,
            State = state
        };

        var result = await oauthService.HandleCallbackAsync(request);
        
        if (result == null)
        {
            logger.LogWarning("OAuth authentication failed for provider: {Provider}", provider);
            return Results.Redirect("http://localhost:3001/?error=authentication_failed");
        }

        // Redirect to frontend with authentication data
        var redirectUrl = $"http://localhost:3001/auth/callback" +
            $"?token={Uri.EscapeDataString(result.Token)}" +
            $"&refresh_token={Uri.EscapeDataString(result.RefreshToken)}" +
            $"&expires_at={Uri.EscapeDataString(result.ExpiresAt.ToString("O"))}" +
            $"&user={Uri.EscapeDataString(System.Text.Json.JsonSerializer.Serialize(result.User))}";

        return Results.Redirect(redirectUrl);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error handling OAuth callback");
        return Results.Redirect("http://localhost:3001/?error=server_error");
    }
});

app.MapControllers();

try
{
    Log.Information("Starting Config Service API");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

// Make Program class accessible for testing
public partial class Program { }