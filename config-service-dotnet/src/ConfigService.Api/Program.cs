using ConfigService.Core.Interfaces;
using ConfigService.Core.Models;
using ConfigService.Infrastructure.Data;
using ConfigService.Infrastructure.Repositories;
using ConfigService.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using System.Text;
using System.Text.Json;

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

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()  // Allow all origins for testing
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
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

builder.Services.AddAuthorization();

// Register dependencies
builder.Services.AddScoped<DatabaseContext>();
builder.Services.AddScoped<IApplicationRepository, ApplicationRepository>();

// Register OAuth services in dependency order
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddHttpClient<IOAuthService, OAuthService>();
builder.Services.AddScoped<IOAuthService, OAuthService>();

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

// Add authentication and authorization middleware
app.UseAuthentication();
app.UseAuthorization();

// Add root endpoint
app.MapGet("/", () => new { message = "Config Service API", version = "1.0.0" });

// Add health check endpoint
app.MapGet("/health", () => new { status = "healthy" });

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