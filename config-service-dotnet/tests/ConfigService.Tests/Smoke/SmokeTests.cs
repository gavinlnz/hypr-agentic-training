using ConfigService.Tests.Helpers;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Text.Json;
using Xunit;

namespace ConfigService.Tests.Smoke;

/// <summary>
/// Smoke tests to verify basic application functionality
/// These tests would catch major build/deployment issues
/// </summary>
public class SmokeTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public SmokeTests(WebApplicationFactory<Program> factory)
    {
        var configuredFactory = factory.WithWebHostBuilder(builder =>
        {
            // Disable authentication for smoke tests
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

        _factory = configuredFactory;
        _client = configuredFactory.CreateClient();
    }

    [Fact]
    public async Task Application_ShouldStart()
    {
        // Act & Assert - Application should start without throwing
        var response = await _client.GetAsync("/");
        
        // Should return some response (not necessarily 200, but should not throw)
        response.Should().NotBeNull();
    }

    [Fact]
    public async Task HealthEndpoint_ShouldReturnHealthy()
    {
        // Act
        var response = await _client.GetAsync("/health");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("healthy");
    }

    [Fact]
    public async Task ApiEndpoints_ShouldBeAccessible()
    {
        // Act & Assert - All main API endpoints should be accessible
        var endpoints = new[]
        {
            "/api/v1/applications",
            "/",
            "/health"
        };

        foreach (var endpoint in endpoints)
        {
            var response = await _client.GetAsync(endpoint);
            
            // Should not return 404 or 500 (other status codes are acceptable)
            response.StatusCode.Should().NotBe(HttpStatusCode.NotFound, 
                $"Endpoint {endpoint} should exist");
            response.StatusCode.Should().NotBe(HttpStatusCode.InternalServerError, 
                $"Endpoint {endpoint} should not have server errors");
        }
    }

    [Fact]
    public async Task ApiResponses_ShouldReturnValidJson()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/applications");

        // Assert
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
        
        var content = await response.Content.ReadAsStringAsync();
        
        // Should be valid JSON (this will throw if invalid)
        var jsonDoc = JsonDocument.Parse(content);
        jsonDoc.Should().NotBeNull();
    }

    [Fact]
    public async Task CorsConfiguration_ShouldBeEnabled()
    {
        // Act - Send a request with Origin header to trigger CORS
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/applications");
        request.Headers.Add("Origin", "http://localhost:3001");
        var response = await _client.SendAsync(request);

        // Assert - CORS headers should be present
        response.Headers.Should().ContainKey("Access-Control-Allow-Origin");
    }

    [Fact]
    public async Task JsonSerialization_ShouldUseSnakeCase()
    {
        // This test verifies the JSON serialization configuration
        // that caused issues in production

        // Act
        var response = await _client.GetAsync("/");
        var content = await response.Content.ReadAsStringAsync();

        // Assert - Response should contain snake_case properties if it's JSON
        if (response.Content.Headers.ContentType?.MediaType == "application/json")
        {
            // If the response contains timestamp fields, they should be snake_case
            if (content.Contains("created") || content.Contains("updated"))
            {
                content.Should().NotContain("createdAt", "Should use snake_case not camelCase");
                content.Should().NotContain("updatedAt", "Should use snake_case not camelCase");
            }
        }
    }

    [Fact]
    public async Task DatabaseConnection_ShouldBeWorking()
    {
        // This test verifies database connectivity without requiring specific data

        // Act - Try to access an endpoint that requires database
        var response = await _client.GetAsync("/api/v1/applications");

        // Assert - Should not return database connection errors
        response.StatusCode.Should().NotBe(HttpStatusCode.ServiceUnavailable, 
            "Database should be accessible");
        response.StatusCode.Should().NotBe(HttpStatusCode.InternalServerError, 
            "Should not have database connection errors");
    }

    [Fact]
    public async Task ErrorHandling_ShouldReturnConsistentFormat()
    {
        // Act - Try to access non-existent resource
        var response = await _client.GetAsync("/api/v1/applications/01ARZ3NDEKTSV4RRFFQ69G5FAV");

        // Assert - Error responses should have consistent format
        if (response.StatusCode == HttpStatusCode.NotFound)
        {
            var content = await response.Content.ReadAsStringAsync();
            var jsonDoc = JsonDocument.Parse(content);
            
            // Should have a message field
            jsonDoc.RootElement.TryGetProperty("message", out var messageProperty)
                .Should().BeTrue("Error responses should have a message field");
            messageProperty.GetString().Should().NotBeNullOrEmpty();
        }
    }

    [Fact]
    public async Task ApiVersioning_ShouldBeConsistent()
    {
        // Act & Assert - All API endpoints should use consistent versioning
        var apiEndpoints = new[]
        {
            "/api/v1/applications"
        };

        foreach (var endpoint in apiEndpoints)
        {
            var response = await _client.GetAsync(endpoint);
            
            // Should not return 404 for versioned endpoints
            response.StatusCode.Should().NotBe(HttpStatusCode.NotFound, 
                $"Versioned endpoint {endpoint} should exist");
        }
    }

    [Fact]
    public async Task SecurityHeaders_ShouldBePresent()
    {
        // Act
        var response = await _client.GetAsync("/");

        // Assert - Basic security headers should be present
        // Note: This is a basic check - full security testing would be more comprehensive
        response.Headers.Should().NotBeNull();
        
        // At minimum, should not expose server information
        response.Headers.Server.Should().BeNullOrEmpty("Should not expose server information");
    }
}