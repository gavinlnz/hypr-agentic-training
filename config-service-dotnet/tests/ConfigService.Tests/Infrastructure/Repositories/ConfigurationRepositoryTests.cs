using ConfigService.Core.Models;
using ConfigService.Infrastructure.Data;
using ConfigService.Infrastructure.Repositories;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using System.Text.Json;
using Testcontainers.PostgreSql;
using Xunit;

namespace ConfigService.Tests.Infrastructure.Repositories;

public class ConfigurationRepositoryTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder("postgres:15.1")
        .WithDatabase("config_service_test")
        .WithUsername("testuser")
        .WithPassword("testpass")
        .Build();

    private DatabaseContext _context = null!;
    private ConfigurationRepository _repository = null!;
    private ApplicationRepository _applicationRepository = null!;

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Database:Host"] = _postgres.Hostname,
                ["Database:Port"] = _postgres.GetMappedPublicPort(5432).ToString(),
                ["Database:Name"] = "config_service_test",
                ["Database:Username"] = "testuser",
                ["Database:Password"] = "testpass"
            })
            .Build();

        var logger = Mock.Of<ILogger<DatabaseContext>>();
        _context = new DatabaseContext(configuration, logger);

        // Create tables
        await CreateTablesAsync();

        var appLogger = Mock.Of<ILogger<ApplicationRepository>>();
        _applicationRepository = new ApplicationRepository(_context, appLogger);
        _repository = new ConfigurationRepository(_context);
    }

    public async Task DisposeAsync()
    {
        _context?.Dispose();
        await _postgres.DisposeAsync();
    }

    private async Task CreateTablesAsync()
    {
        // Create applications table
        await _context.ExecuteAsync(@"
            CREATE TABLE applications (
                id VARCHAR(26) PRIMARY KEY,
                name VARCHAR(256) NOT NULL UNIQUE,
                comments VARCHAR(1024),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )");

        // Create configurations table
        await _context.ExecuteAsync(@"
            CREATE TABLE configurations (
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
            )");

        // Create indexes
        await _context.ExecuteAsync("CREATE INDEX idx_configurations_application_id ON configurations(application_id)");
        await _context.ExecuteAsync("CREATE INDEX idx_configurations_name ON configurations(name)");
    }

    [Fact]
    public async Task CreateAsync_ShouldCreateConfiguration()
    {
        // Arrange
        var application = await CreateTestApplicationAsync();
        var configData = new ConfigurationCreate
        {
            ApplicationId = application.Id,
            Name = "test-config",
            Comments = "Test configuration",
            Config = JsonSerializer.SerializeToElement(new { host = "localhost", port = 5432 })
        };

        // Act
        var result = await _repository.CreateAsync(configData);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().NotBeNullOrEmpty();
        result.ApplicationId.Should().Be(application.Id);
        result.Name.Should().Be("test-config");
        result.Comments.Should().Be("Test configuration");
        result.Config.GetProperty("host").GetString().Should().Be("localhost");
        result.Config.GetProperty("port").GetInt32().Should().Be(5432);
        result.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        result.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task GetByApplicationIdAsync_ShouldReturnConfigurations()
    {
        // Arrange
        var application = await CreateTestApplicationAsync();
        var config1 = await CreateTestConfigurationAsync(application.Id, "config-1");
        var config2 = await CreateTestConfigurationAsync(application.Id, "config-2");

        // Act
        var result = await _repository.GetByApplicationIdAsync(application.Id);

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(c => c.Id == config1.Id);
        result.Should().Contain(c => c.Id == config2.Id);
        result.Should().BeInAscendingOrder(c => c.Name);
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnConfiguration()
    {
        // Arrange
        var application = await CreateTestApplicationAsync();
        var config = await CreateTestConfigurationAsync(application.Id, "test-config");

        // Act
        var result = await _repository.GetByIdAsync(config.Id);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(config.Id);
        result.ApplicationId.Should().Be(application.Id);
        result.Name.Should().Be("test-config");
    }

    [Fact]
    public async Task GetByIdAsync_WithNonExistentId_ShouldReturnNull()
    {
        // Act
        var result = await _repository.GetByIdAsync("01NONEXISTENT123456789012");

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task UpdateAsync_ShouldUpdateConfiguration()
    {
        // Arrange
        var application = await CreateTestApplicationAsync();
        var config = await CreateTestConfigurationAsync(application.Id, "test-config");
        var updateData = new ConfigurationUpdate
        {
            Name = "updated-config",
            Comments = "Updated configuration",
            Config = JsonSerializer.SerializeToElement(new { host = "updated-host", port = 3306 })
        };

        // Act
        var result = await _repository.UpdateAsync(config.Id, updateData);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(config.Id);
        result.Name.Should().Be("updated-config");
        result.Comments.Should().Be("Updated configuration");
        result.Config.GetProperty("host").GetString().Should().Be("updated-host");
        result.Config.GetProperty("port").GetInt32().Should().Be(3306);
        result.UpdatedAt.Should().BeAfter(result.CreatedAt);
    }

    [Fact]
    public async Task DeleteAsync_ShouldDeleteConfiguration()
    {
        // Arrange
        var application = await CreateTestApplicationAsync();
        var config = await CreateTestConfigurationAsync(application.Id, "test-config");

        // Act
        var result = await _repository.DeleteAsync(config.Id);

        // Assert
        result.Should().BeTrue();

        var deletedConfig = await _repository.GetByIdAsync(config.Id);
        deletedConfig.Should().BeNull();
    }

    [Fact]
    public async Task DeleteMultipleAsync_ShouldDeleteMultipleConfigurations()
    {
        // Arrange
        var application = await CreateTestApplicationAsync();
        var config1 = await CreateTestConfigurationAsync(application.Id, "config-1");
        var config2 = await CreateTestConfigurationAsync(application.Id, "config-2");
        var config3 = await CreateTestConfigurationAsync(application.Id, "config-3");

        var idsToDelete = new List<string> { config1.Id, config2.Id };

        // Act
        var result = await _repository.DeleteMultipleAsync(idsToDelete);

        // Assert
        result.Should().Be(2);

        var remainingConfigs = await _repository.GetByApplicationIdAsync(application.Id);
        remainingConfigs.Should().HaveCount(1);
        remainingConfigs.Should().Contain(c => c.Id == config3.Id);
    }

    [Fact]
    public async Task ExistsByApplicationIdAndNameAsync_ShouldReturnTrue_WhenExists()
    {
        // Arrange
        var application = await CreateTestApplicationAsync();
        await CreateTestConfigurationAsync(application.Id, "test-config");

        // Act
        var result = await _repository.ExistsByApplicationIdAndNameAsync(application.Id, "test-config");

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task ExistsByApplicationIdAndNameAsync_ShouldReturnFalse_WhenNotExists()
    {
        // Arrange
        var application = await CreateTestApplicationAsync();

        // Act
        var result = await _repository.ExistsByApplicationIdAndNameAsync(application.Id, "non-existent");

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task SearchByNameAsync_ShouldReturnMatchingConfigurations()
    {
        // Arrange
        var application = await CreateTestApplicationAsync();
        await CreateTestConfigurationAsync(application.Id, "database-config");
        await CreateTestConfigurationAsync(application.Id, "api-config");
        await CreateTestConfigurationAsync(application.Id, "cache-settings");

        // Act
        var result = await _repository.SearchByNameAsync(application.Id, "config");

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(c => c.Name == "database-config");
        result.Should().Contain(c => c.Name == "api-config");
        result.Should().NotContain(c => c.Name == "cache-settings");
    }

    [Fact]
    public async Task GetCountByApplicationIdAsync_ShouldReturnCorrectCount()
    {
        // Arrange
        var application = await CreateTestApplicationAsync();
        await CreateTestConfigurationAsync(application.Id, "config-1");
        await CreateTestConfigurationAsync(application.Id, "config-2");
        await CreateTestConfigurationAsync(application.Id, "config-3");

        // Act
        var result = await _repository.GetCountByApplicationIdAsync(application.Id);

        // Assert
        result.Should().Be(3);
    }

    private async Task<Application> CreateTestApplicationAsync()
    {
        var appData = new ApplicationCreate
        {
            Name = $"Test App {Guid.NewGuid()}",
            Comments = "Test application"
        };
        return await _applicationRepository.CreateAsync(appData);
    }

    private async Task<ConfigurationItem> CreateTestConfigurationAsync(string applicationId, string name)
    {
        var configData = new ConfigurationCreate
        {
            ApplicationId = applicationId,
            Name = name,
            Comments = "Test configuration",
            Config = JsonSerializer.SerializeToElement(new { host = "localhost", port = 5432 })
        };
        return await _repository.CreateAsync(configData);
    }
}