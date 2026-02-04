using ConfigService.Core.Models;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Testcontainers.PostgreSql;
using Xunit;

namespace ConfigService.Tests.Integration;

public class ApplicationsIntegrationTests : IClassFixture<WebApplicationFactory<Program>>, IAsyncLifetime
{
    private readonly WebApplicationFactory<Program> _factory;
    private HttpClient _client;
    private readonly PostgreSqlContainer _postgres;
    private readonly JsonSerializerOptions _jsonOptions;

    public ApplicationsIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _postgres = new PostgreSqlBuilder("postgres:15.1")
            .WithDatabase("config_service_integration_test")
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
            builder.UseSetting("Database:Name", "config_service_integration_test");
            builder.UseSetting("Database:Username", "testuser");
            builder.UseSetting("Database:Password", "testpass");
        });

        _client = configuredFactory.CreateClient();

        // Configure JSON options for the test client
        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        };

        // Create the applications table
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
    public async Task GetRoot_ShouldReturnApiInfo()
    {
        // Act
        var response = await _client.GetAsync("/");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Config Service API");
        content.Should().Contain("1.0.0");
    }

    [Fact]
    public async Task GetHealth_ShouldReturnHealthy()
    {
        // Act
        var response = await _client.GetAsync("/health");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("healthy");
    }

    [Fact]
    public async Task CreateApplication_ShouldCreateAndReturnApplication()
    {
        // Arrange
        var applicationData = new ApplicationCreate
        {
            Name = "Integration Test App",
            Comments = "Created via integration test"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/applications", applicationData);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        
        var createdApp = await ReadJsonAsync<Application>(response.Content);
        createdApp.Should().NotBeNull();
        createdApp!.Name.Should().Be(applicationData.Name);
        createdApp.Comments.Should().Be(applicationData.Comments);
        createdApp.Id.Should().NotBeNullOrEmpty();
        Application.IsValidUlid(createdApp.Id).Should().BeTrue();
    }

    [Fact]
    public async Task CreateApplication_WithDuplicateName_ShouldReturnConflict()
    {
        // Arrange
        var applicationData = new ApplicationCreate { Name = "Duplicate Integration Test" };
        
        // Create first application
        await _client.PostAsJsonAsync("/api/v1/applications", applicationData);

        // Act - Try to create duplicate
        var response = await _client.PostAsJsonAsync("/api/v1/applications", applicationData);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task GetApplication_WithValidId_ShouldReturnApplication()
    {
        // Arrange
        var applicationData = new ApplicationCreate { Name = "Get Test App" };
        var createResponse = await _client.PostAsJsonAsync("/api/v1/applications", applicationData);
        var createdApp = await createResponse.Content.ReadFromJsonAsync<Application>();

        // Act
        var response = await _client.GetAsync($"/api/v1/applications/{createdApp!.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var retrievedApp = await response.Content.ReadFromJsonAsync<ApplicationWithConfigs>();
        retrievedApp.Should().NotBeNull();
        retrievedApp!.Id.Should().Be(createdApp.Id);
        retrievedApp.Name.Should().Be(createdApp.Name);
        retrievedApp.ConfigurationIds.Should().BeEmpty();
    }

    [Fact]
    public async Task GetApplication_WithInvalidId_ShouldReturnBadRequest()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/applications/invalid-ulid");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetApplication_WithNonExistentId_ShouldReturnNotFound()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/applications/01ARZ3NDEKTSV4RRFFQ69G5FAV");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task ListApplications_ShouldReturnAllApplications()
    {
        // Arrange
        var app1Data = new ApplicationCreate { Name = "List Test App 1" };
        var app2Data = new ApplicationCreate { Name = "List Test App 2" };
        
        var createResponse1 = await _client.PostAsJsonAsync("/api/v1/applications", app1Data);
        var createResponse2 = await _client.PostAsJsonAsync("/api/v1/applications", app2Data);
        
        var createdApp1 = await createResponse1.Content.ReadFromJsonAsync<Application>();
        var createdApp2 = await createResponse2.Content.ReadFromJsonAsync<Application>();

        // Act
        var response = await _client.GetAsync("/api/v1/applications");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var applications = await response.Content.ReadFromJsonAsync<List<Application>>();
        applications.Should().NotBeNull();
        applications!.Should().Contain(a => a.Id == createdApp1!.Id);
        applications.Should().Contain(a => a.Id == createdApp2!.Id);
    }

    [Fact]
    public async Task UpdateApplication_WithValidData_ShouldUpdateApplication()
    {
        // Arrange
        var applicationData = new ApplicationCreate { Name = "Update Test App" };
        var createResponse = await _client.PostAsJsonAsync("/api/v1/applications", applicationData);
        var createdApp = await ReadJsonAsync<Application>(createResponse.Content);

        var updateData = new ApplicationUpdate
        {
            Name = "Updated Test App",
            Comments = "Updated via integration test"
        };

        // Act
        var response = await _client.PutAsJsonAsync($"/api/v1/applications/{createdApp!.Id}", updateData);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var updatedApp = await ReadJsonAsync<Application>(response.Content);
        updatedApp.Should().NotBeNull();
        updatedApp!.Id.Should().Be(createdApp.Id);
        updatedApp.Name.Should().Be(updateData.Name);
        updatedApp.Comments.Should().Be(updateData.Comments);
        updatedApp.UpdatedAt.Should().BeAfter(createdApp.UpdatedAt);
    }

    [Fact]
    public async Task DeleteApplication_WithValidId_ShouldDeleteApplication()
    {
        // Arrange
        var applicationData = new ApplicationCreate { Name = "Delete Test App" };
        var createResponse = await _client.PostAsJsonAsync("/api/v1/applications", applicationData);
        var createdApp = await createResponse.Content.ReadFromJsonAsync<Application>();

        // Act
        var response = await _client.DeleteAsync($"/api/v1/applications/{createdApp!.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        
        // Verify deletion
        var getResponse = await _client.GetAsync($"/api/v1/applications/{createdApp.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteApplications_WithValidIds_ShouldDeleteMultipleApplications()
    {
        // Arrange
        var app1Data = new ApplicationCreate { Name = "Bulk Delete App 1" };
        var app2Data = new ApplicationCreate { Name = "Bulk Delete App 2" };
        
        var createResponse1 = await _client.PostAsJsonAsync("/api/v1/applications", app1Data);
        var createResponse2 = await _client.PostAsJsonAsync("/api/v1/applications", app2Data);
        
        var createdApp1 = await createResponse1.Content.ReadFromJsonAsync<Application>();
        var createdApp2 = await createResponse2.Content.ReadFromJsonAsync<Application>();

        var deleteRequest = new { ids = new[] { createdApp1!.Id, createdApp2!.Id } };

        // Act
        var response = await _client.SendAsync(new HttpRequestMessage(HttpMethod.Delete, "/api/v1/applications")
        {
            Content = JsonContent.Create(deleteRequest)
        });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        
        // Verify deletions
        var getResponse1 = await _client.GetAsync($"/api/v1/applications/{createdApp1.Id}");
        var getResponse2 = await _client.GetAsync($"/api/v1/applications/{createdApp2.Id}");
        
        getResponse1.StatusCode.Should().Be(HttpStatusCode.NotFound);
        getResponse2.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task FullWorkflow_CreateUpdateDeleteApplication_ShouldWorkCorrectly()
    {
        // Create
        var createData = new ApplicationCreate
        {
            Name = "Workflow Test App",
            Comments = "Initial comments"
        };
        
        var createResponse = await _client.PostAsJsonAsync("/api/v1/applications", createData);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        
        var createdApp = await createResponse.Content.ReadFromJsonAsync<Application>();
        createdApp.Should().NotBeNull();

        // Read
        var getResponse = await _client.GetAsync($"/api/v1/applications/{createdApp!.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // Update
        var updateData = new ApplicationUpdate
        {
            Name = "Updated Workflow App",
            Comments = "Updated comments"
        };
        
        var updateResponse = await _client.PutAsJsonAsync($"/api/v1/applications/{createdApp.Id}", updateData);
        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // Delete
        var deleteResponse = await _client.DeleteAsync($"/api/v1/applications/{createdApp.Id}");
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Verify deletion
        var finalGetResponse = await _client.GetAsync($"/api/v1/applications/{createdApp.Id}");
        finalGetResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}