using ConfigService.Core.Interfaces;
using ConfigService.Infrastructure.Data;
using ConfigService.Infrastructure.Repositories;
using Microsoft.AspNetCore.Mvc;
using Serilog;
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
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
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
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
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

// Register dependencies
builder.Services.AddScoped<DatabaseContext>();
builder.Services.AddScoped<IApplicationRepository, ApplicationRepository>();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();

app.UseAuthorization();

// Add root endpoint
app.MapGet("/", () => new { message = "Config Service API", version = "1.0.0" });

// Add health check endpoint
app.MapGet("/health", () => new { status = "healthy" });

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