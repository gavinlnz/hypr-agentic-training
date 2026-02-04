using ConfigService.Core.Models;
using ConfigService.Tests.Helpers;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Testcontainers.PostgreSql;
using Xunit;

namespace ConfigService.Tests.Integration;

/// <summary>
/// Tests to ensure API contract compatibility with frontend expectations
/// These tests would have caught the snake_case vs camelCase serialization issue
/// </summary>
public class ApiContractTests : IClassFixture<WebApplicationFactory<Program>>, IAsyncLifetime
{
    private readonly WebApplicationFactory<Program> _factory;
    private HttpClient _client;
    private readonly PostgreSqlContainer _postgres;
    private readonly JsonSerializerOptions _jsonOptions;

    public ApiContractTests(WebApplicationFactory<Program> factory)
    {
        _postgres = new PostgreSqlBuilder("postgres:15.1")
            .WithDatabase("config_service_contract_test")
            .WithUsername("testuser")
            .WithPassword("testpass")
            .Build();

        _factory = factory;
        _client = null!; // Will be initialized in InitializeAsync
        
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        };
    }

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();

        var configuredFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.UseSetting("Database:Host", _postgres.Hostname);
            builder.UseSetting("Database:Port", _postgres.GetMappedPublicPort(5432).ToString());
            builder.UseSetting("Database:Name", "config_service_contract_test");
            builder.UseSetting("Database:Username", "testuser");
            builder.UseSetting("Database:Password", "testpass");
            
            // Disable authentication for tests
            builder.UseSetting("Jwt:Key", "test-key-that-is-at-least-32-characters-long-for-testing");
            builder.UseSetting("Jwt:Issuer", "ConfigServiceTest");
            builder.UseSetting("Jwt:Audience", "ConfigServiceTest");
            
            builder.ConfigureServices(services =>
            {
                // Remove authentication and authorization for tests
                services.AddAuthentication("Test")
                    .AddScheme<Microsoft.AspNetCore.Authentication.AuthenticationSchemeOptions, TestAuthenticationHandler>(
                        "Test", options => { });
                services.AddAuthorization(options =>
                {
                    options.DefaultPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder("Test")
                        .RequireAssertion(_ => true) // Always allow
                        .Build();
                });
            });
        });

        _client = configuredFactory.CreateClient();

        using var scope = configuredFactory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ConfigService.Infrastructure.Data.DatabaseContext>();
        
        await context.ExecuteAsync(@"
            CREATE TABLE IF NOT EXISTS applications (
                id VARCHAR(26) PRIMARY KEY,
                name VARCHAR(256) NOT NULL UNIQUE,
                comments VARCHAR(1024),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_applications_name ON applications(name);
            
            CREATE TABLE IF NOT EXISTS configurations (
                id VARCHAR(26) PRIMARY KEY,
                application_id VARCHAR(26) NOT NULL,
                name VARCHAR(256) NOT NULL,
                comments VARCHAR(1024),
                config JSONB NOT NULL DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                CONSTRAINT fk_configurations_application 
                    FOREIGN KEY (application_id) 
                    REFERENCES applications(id) 
                    ON DELETE CASCADE,
                
                CONSTRAINT uq_configurations_app_name 
                    UNIQUE (application_id, name)
            );
            CREATE INDEX IF NOT EXISTS idx_configurations_application_id ON configurations(application_id);
            CREATE INDEX IF NOT EXISTS idx_configurations_name ON configurations(name);
        ");
    }

    public async Task DisposeAsync()
    {
        _client.Dispose();
        await _postgres.DisposeAsync();
    }

    private async Task<T?> ReadJsonAsync<T>(HttpContent content)
    {
        var json = await content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<T>(json, _jsonOptions);
    }

    [Fact]
    public async Task GetApplications_ShouldReturnSnakeCasePropertyNames()
    {
        // Arrange - Create a test application
        var applicationData = new ApplicationCreate
        {
            Name = "Contract Test App",
            Comments = "Testing JSON property naming"
        };
        await _client.PostAsJsonAsync("/api/v1/applications", applicationData);

        // Act - Get applications as raw JSON string
        var response = await _client.GetAsync("/api/v1/applications");
        var jsonString = await response.Content.ReadAsStringAsync();

        // Assert - Verify snake_case property names (frontend expectation)
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        jsonString.Should().Contain("created_at", "Frontend expects snake_case property names");
        jsonString.Should().Contain("updated_at", "Frontend expects snake_case property names");
        jsonString.Should().NotContain("createdAt", "Should not use camelCase property names");
        jsonString.Should().NotContain("updatedAt", "Should not use camelCase property names");
    }

    [Fact]
    public async Task CreateApplication_ShouldReturnSnakeCasePropertyNames()
    {
        // Arrange
        var applicationData = new ApplicationCreate
        {
            Name = "Contract Create Test",
            Comments = "Testing create response format"
        };

        // Act - Create application and get raw JSON response
        var response = await _client.PostAsJsonAsync("/api/v1/applications", applicationData);
        var jsonString = await response.Content.ReadAsStringAsync();

        // Assert - Verify response format matches frontend expectations
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        jsonString.Should().Contain("created_at");
        jsonString.Should().Contain("updated_at");
        jsonString.Should().NotContain("createdAt");
        jsonString.Should().NotContain("updatedAt");
    }

    [Fact]
    public async Task GetApplication_ShouldReturnSnakeCasePropertyNames()
    {
        // Arrange - Create a test application
        var applicationData = new ApplicationCreate { Name = "Contract Get Test" };
        var createResponse = await _client.PostAsJsonAsync("/api/v1/applications", applicationData);
        var createdApp = await createResponse.Content.ReadFromJsonAsync<Application>();

        // Act - Get single application as raw JSON
        var response = await _client.GetAsync($"/api/v1/applications/{createdApp!.Id}");
        var jsonString = await response.Content.ReadAsStringAsync();

        // Assert - Verify single application response format
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        jsonString.Should().Contain("created_at");
        jsonString.Should().Contain("updated_at");
        jsonString.Should().Contain("configuration_ids", "Should include configuration_ids for ApplicationWithConfigs");
        jsonString.Should().NotContain("createdAt");
        jsonString.Should().NotContain("updatedAt");
        jsonString.Should().NotContain("configurationIds");
    }

    [Fact]
    public async Task UpdateApplication_ShouldReturnSnakeCasePropertyNames()
    {
        // Arrange - Create and then update an application
        var createData = new ApplicationCreate { Name = "Contract Update Test" };
        var createResponse = await _client.PostAsJsonAsync("/api/v1/applications", createData);
        var createdApp = await createResponse.Content.ReadFromJsonAsync<Application>();

        var updateData = new ApplicationUpdate 
        { 
            Name = "Updated Contract Test",
            Comments = "Updated for contract testing"
        };

        // Act - Update application and get raw JSON response
        var response = await _client.PutAsJsonAsync($"/api/v1/applications/{createdApp!.Id}", updateData);
        var jsonString = await response.Content.ReadAsStringAsync();

        // Assert - Verify update response format
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        jsonString.Should().Contain("created_at");
        jsonString.Should().Contain("updated_at");
        jsonString.Should().NotContain("createdAt");
        jsonString.Should().NotContain("updatedAt");
    }

    [Fact]
    public async Task ApiResponses_ShouldHaveValidDateFormats()
    {
        // Arrange - Create a test application
        var applicationData = new ApplicationCreate { Name = "Date Format Test" };
        var createResponse = await _client.PostAsJsonAsync("/api/v1/applications", applicationData);
        var jsonString = await createResponse.Content.ReadAsStringAsync();

        // Act - Parse the JSON to verify date format
        var jsonDoc = JsonDocument.Parse(jsonString);
        var createdAtValue = jsonDoc.RootElement.GetProperty("created_at").GetString();
        var updatedAtValue = jsonDoc.RootElement.GetProperty("updated_at").GetString();

        // Assert - Verify dates are in ISO 8601 format that frontend can parse
        createdAtValue.Should().NotBeNullOrEmpty();
        updatedAtValue.Should().NotBeNullOrEmpty();
        
        // Verify dates can be parsed by JavaScript Date constructor format
        DateTime.TryParse(createdAtValue, out var createdAt).Should().BeTrue("created_at should be parseable as DateTime");
        DateTime.TryParse(updatedAtValue, out var updatedAt).Should().BeTrue("updated_at should be parseable as DateTime");
        
        createdAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(1));
        updatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(1));
    }

    [Fact]
    public async Task ErrorResponses_ShouldHaveConsistentFormat()
    {
        // Act - Try to get non-existent application
        var response = await _client.GetAsync("/api/v1/applications/01ARZ3NDEKTSV4RRFFQ69G5FAV");
        var jsonString = await response.Content.ReadAsStringAsync();

        // Assert - Verify error response format
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        jsonString.Should().Contain("message", "Error responses should have a message field");
        
        // Verify it's valid JSON
        var jsonDoc = JsonDocument.Parse(jsonString);
        jsonDoc.RootElement.TryGetProperty("message", out var messageProperty).Should().BeTrue();
        messageProperty.GetString().Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task BulkDeleteRequest_ShouldAcceptCorrectFormat()
    {
        // Arrange - Create test applications
        var app1Data = new ApplicationCreate { Name = "Bulk Contract Test 1" };
        var app2Data = new ApplicationCreate { Name = "Bulk Contract Test 2" };
        
        var createResponse1 = await _client.PostAsJsonAsync("/api/v1/applications", app1Data);
        var createResponse2 = await _client.PostAsJsonAsync("/api/v1/applications", app2Data);
        
        var createdApp1 = await createResponse1.Content.ReadFromJsonAsync<Application>();
        var createdApp2 = await createResponse2.Content.ReadFromJsonAsync<Application>();

        // Act - Test the exact format that frontend sends
        var deleteRequest = new { ids = new[] { createdApp1!.Id, createdApp2!.Id } };
        var response = await _client.SendAsync(new HttpRequestMessage(HttpMethod.Delete, "/api/v1/applications")
        {
            Content = JsonContent.Create(deleteRequest)
        });

        // Assert - This test would have caught the Dictionary<string, object> parameter issue
        response.StatusCode.Should().Be(HttpStatusCode.NoContent, 
            "Bulk delete should work with the exact JSON format sent by frontend");
    }

    [Fact]
    public async Task BulkDeleteRequest_WithInvalidFormat_ShouldReturnBadRequest()
    {
        // Act - Test with wrong property name (should be "ids" not "applicationIds")
        var deleteRequest = new { applicationIds = new[] { "01ARZ3NDEKTSV4RRFFQ69G5FAV" } };
        var response = await _client.SendAsync(new HttpRequestMessage(HttpMethod.Delete, "/api/v1/applications")
        {
            Content = JsonContent.Create(deleteRequest)
        });

        // Assert - Should reject incorrect format
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest, 
            "Should reject requests with incorrect property names");
    }

    [Fact]
    public async Task AllEndpoints_ShouldReturnConsistentContentType()
    {
        // Arrange - Create a test application
        var applicationData = new ApplicationCreate { Name = "Content Type Test" };
        var createResponse = await _client.PostAsJsonAsync("/api/v1/applications", applicationData);
        var createdApp = await createResponse.Content.ReadFromJsonAsync<Application>();

        // Act & Assert - Test all endpoints return application/json
        var endpoints = new[]
        {
            ("/api/v1/applications", HttpMethod.Get),
            ($"/api/v1/applications/{createdApp!.Id}", HttpMethod.Get),
            ("/api/v1/applications", HttpMethod.Post),
            ($"/api/v1/applications/{createdApp.Id}", HttpMethod.Put),
        };

        foreach (var (url, method) in endpoints)
        {
            HttpResponseMessage response;
            if (method == HttpMethod.Post)
            {
                response = await _client.PostAsJsonAsync(url, new ApplicationCreate { Name = "Test" });
            }
            else if (method == HttpMethod.Put)
            {
                response = await _client.PutAsJsonAsync(url, new ApplicationUpdate { Name = "Updated" });
            }
            else
            {
                response = await _client.SendAsync(new HttpRequestMessage(method, url));
            }

            response.Content.Headers.ContentType?.MediaType.Should().Be("application/json",
                $"Endpoint {method} {url} should return JSON content type");
        }
    }

    [Fact]
    public async Task ValidationErrors_ShouldReturnConsistentErrorFormat()
    {
        // Act - Try to create application with empty name
        var invalidData = new ApplicationCreate { Name = "" };
        var response = await _client.PostAsJsonAsync("/api/v1/applications", invalidData);

        // Assert - Should return validation error in consistent format
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var jsonString = await response.Content.ReadAsStringAsync();
        
        // Verify error response structure
        var jsonDoc = JsonDocument.Parse(jsonString);
        jsonDoc.RootElement.TryGetProperty("message", out var messageProperty).Should().BeTrue();
        messageProperty.GetString().Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task CorsHeaders_ShouldBePresent()
    {
        // Act - Send a request with Origin header to trigger CORS
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/applications");
        request.Headers.Add("Origin", "http://localhost:3001");
        var response = await _client.SendAsync(request);

        // Assert - CORS headers should be present for frontend compatibility
        response.Headers.Should().ContainKey("Access-Control-Allow-Origin");
    }
}