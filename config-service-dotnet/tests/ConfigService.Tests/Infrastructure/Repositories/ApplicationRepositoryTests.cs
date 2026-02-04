using ConfigService.Core.Models;
using ConfigService.Infrastructure.Data;
using ConfigService.Infrastructure.Repositories;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Testcontainers.PostgreSql;
using Xunit;

namespace ConfigService.Tests.Infrastructure.Repositories;

public class ApplicationRepositoryTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder("postgres:15.1")
        .WithDatabase("config_service_test")
        .WithUsername("testuser")
        .WithPassword("testpass")
        .Build();

    private DatabaseContext _context = null!;
    private ApplicationRepository _repository = null!;

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

        // Create the applications table
        await _context.ExecuteAsync(@"
            CREATE TABLE applications (
                id VARCHAR(26) PRIMARY KEY,
                name VARCHAR(256) NOT NULL UNIQUE,
                comments VARCHAR(1024),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX idx_applications_name ON applications(name);
        ");

        var repositoryLogger = Mock.Of<ILogger<ApplicationRepository>>();
        _repository = new ApplicationRepository(_context, repositoryLogger);
    }

    public async Task DisposeAsync()
    {
        _context?.Dispose();
        await _postgres.DisposeAsync();
    }

    [Fact]
    public async Task CreateAsync_ShouldCreateApplication()
    {
        // Arrange
        var applicationData = new ApplicationCreate
        {
            Name = "Test Application",
            Comments = "Test comments"
        };

        // Act
        var result = await _repository.CreateAsync(applicationData);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be(applicationData.Name);
        result.Comments.Should().Be(applicationData.Comments);
        result.Id.Should().NotBeNullOrEmpty();
        result.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        result.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        Application.IsValidUlid(result.Id).Should().BeTrue();
    }

    [Fact]
    public async Task CreateAsync_WithDuplicateName_ShouldThrowException()
    {
        // Arrange
        var applicationData = new ApplicationCreate
        {
            Name = "Duplicate Name",
            Comments = "First application"
        };

        await _repository.CreateAsync(applicationData);

        var duplicateData = new ApplicationCreate
        {
            Name = "Duplicate Name",
            Comments = "Second application"
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _repository.CreateAsync(duplicateData));
        
        exception.Message.Should().Contain("already exists");
    }

    [Fact]
    public async Task GetByIdAsync_WithValidId_ShouldReturnApplication()
    {
        // Arrange
        var applicationData = new ApplicationCreate
        {
            Name = "Test Application",
            Comments = "Test comments"
        };
        var created = await _repository.CreateAsync(applicationData);

        // Act
        var result = await _repository.GetByIdAsync(created.Id);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(created.Id);
        result.Name.Should().Be(created.Name);
        result.Comments.Should().Be(created.Comments);
    }

    [Fact]
    public async Task GetByIdAsync_WithInvalidId_ShouldReturnNull()
    {
        // Act
        var result = await _repository.GetByIdAsync("01ARZ3NDEKTSV4RRFFQ69G5FAV");

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetByIdWithConfigsAsync_ShouldReturnApplicationWithConfigs()
    {
        // Arrange
        var applicationData = new ApplicationCreate
        {
            Name = "Test Application",
            Comments = "Test comments"
        };
        var created = await _repository.CreateAsync(applicationData);

        // Act
        var result = await _repository.GetByIdWithConfigsAsync(created.Id);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(created.Id);
        result.Name.Should().Be(created.Name);
        result.Comments.Should().Be(created.Comments);
        result.ConfigurationIds.Should().BeEmpty(); // No configurations yet
    }

    [Fact]
    public async Task GetAllAsync_ShouldReturnAllApplications()
    {
        // Arrange
        var app1 = await _repository.CreateAsync(new ApplicationCreate { Name = "App 1" });
        var app2 = await _repository.CreateAsync(new ApplicationCreate { Name = "App 2" });

        // Act
        var result = await _repository.GetAllAsync();

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(a => a.Id == app1.Id);
        result.Should().Contain(a => a.Id == app2.Id);
    }

    [Fact]
    public async Task UpdateAsync_WithValidData_ShouldUpdateApplication()
    {
        // Arrange
        var created = await _repository.CreateAsync(new ApplicationCreate { Name = "Original Name" });
        var updateData = new ApplicationUpdate
        {
            Name = "Updated Name",
            Comments = "Updated comments"
        };

        // Act
        var result = await _repository.UpdateAsync(created.Id, updateData);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(created.Id);
        result.Name.Should().Be(updateData.Name);
        result.Comments.Should().Be(updateData.Comments);
        result.UpdatedAt.Should().BeAfter(created.UpdatedAt);
    }

    [Fact]
    public async Task UpdateAsync_WithInvalidId_ShouldReturnNull()
    {
        // Arrange
        var updateData = new ApplicationUpdate { Name = "Updated Name" };

        // Act
        var result = await _repository.UpdateAsync("01ARZ3NDEKTSV4RRFFQ69G5FAV", updateData);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task UpdateAsync_WithDuplicateName_ShouldThrowException()
    {
        // Arrange
        await _repository.CreateAsync(new ApplicationCreate { Name = "Existing Name" });
        var created = await _repository.CreateAsync(new ApplicationCreate { Name = "Original Name" });
        
        var updateData = new ApplicationUpdate { Name = "Existing Name" };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _repository.UpdateAsync(created.Id, updateData));
        
        exception.Message.Should().Contain("already exists");
    }

    [Fact]
    public async Task DeleteAsync_WithValidId_ShouldDeleteApplication()
    {
        // Arrange
        var created = await _repository.CreateAsync(new ApplicationCreate { Name = "To Delete" });

        // Act
        var result = await _repository.DeleteAsync(created.Id);

        // Assert
        result.Should().BeTrue();
        
        var deleted = await _repository.GetByIdAsync(created.Id);
        deleted.Should().BeNull();
    }

    [Fact]
    public async Task DeleteAsync_WithInvalidId_ShouldReturnFalse()
    {
        // Act
        var result = await _repository.DeleteAsync("01ARZ3NDEKTSV4RRFFQ69G5FAV");

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task DeleteMultipleAsync_WithValidIds_ShouldDeleteApplications()
    {
        // Arrange
        var app1 = await _repository.CreateAsync(new ApplicationCreate { Name = "App 1" });
        var app2 = await _repository.CreateAsync(new ApplicationCreate { Name = "App 2" });
        var app3 = await _repository.CreateAsync(new ApplicationCreate { Name = "App 3" });

        var idsToDelete = new List<string> { app1.Id, app2.Id };

        // Act
        var result = await _repository.DeleteMultipleAsync(idsToDelete);

        // Assert
        result.Should().Be(2);
        
        var remaining = await _repository.GetAllAsync();
        remaining.Should().HaveCount(1);
        remaining[0].Id.Should().Be(app3.Id);
    }

    [Fact]
    public async Task DeleteMultipleAsync_WithEmptyList_ShouldReturnZero()
    {
        // Act
        var result = await _repository.DeleteMultipleAsync(new List<string>());

        // Assert
        result.Should().Be(0);
    }

    [Fact]
    public async Task ExistsAsync_WithValidId_ShouldReturnTrue()
    {
        // Arrange
        var created = await _repository.CreateAsync(new ApplicationCreate { Name = "Test App" });

        // Act
        var result = await _repository.ExistsAsync(created.Id);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task ExistsAsync_WithInvalidId_ShouldReturnFalse()
    {
        // Act
        var result = await _repository.ExistsAsync("01ARZ3NDEKTSV4RRFFQ69G5FAV");

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task ExistsByNameAsync_WithExistingName_ShouldReturnTrue()
    {
        // Arrange
        await _repository.CreateAsync(new ApplicationCreate { Name = "Existing App" });

        // Act
        var result = await _repository.ExistsByNameAsync("Existing App");

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task ExistsByNameAsync_WithNonExistingName_ShouldReturnFalse()
    {
        // Act
        var result = await _repository.ExistsByNameAsync("Non-existing App");

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task ExistsByNameAsync_WithExcludeId_ShouldExcludeSpecifiedId()
    {
        // Arrange
        var created = await _repository.CreateAsync(new ApplicationCreate { Name = "Test App" });

        // Act
        var result = await _repository.ExistsByNameAsync("Test App", created.Id);

        // Assert
        result.Should().BeFalse();
    }
}