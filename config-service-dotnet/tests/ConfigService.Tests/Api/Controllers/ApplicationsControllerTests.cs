using ConfigService.Api.Controllers;
using ConfigService.Core.Interfaces;
using ConfigService.Core.Models;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace ConfigService.Tests.Api.Controllers;

public class ApplicationsControllerTests
{
    private readonly Mock<IApplicationRepository> _mockRepository;
    private readonly Mock<ILogger<ApplicationsController>> _mockLogger;
    private readonly ApplicationsController _controller;

    public ApplicationsControllerTests()
    {
        _mockRepository = new Mock<IApplicationRepository>();
        _mockLogger = new Mock<ILogger<ApplicationsController>>();
        _controller = new ApplicationsController(_mockRepository.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task CreateApplication_WithValidData_ShouldReturnCreatedResult()
    {
        // Arrange
        var applicationData = new ApplicationCreate
        {
            Name = "Test Application",
            Comments = "Test comments"
        };

        var createdApplication = new Application
        {
            Id = "01ARZ3NDEKTSV4RRFFQ69G5FAV",
            Name = applicationData.Name,
            Comments = applicationData.Comments,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockRepository.Setup(r => r.CreateAsync(applicationData))
                      .ReturnsAsync(createdApplication);

        // Act
        var result = await _controller.CreateApplication(applicationData);

        // Assert
        result.Result.Should().BeOfType<CreatedAtActionResult>();
        var createdResult = result.Result as CreatedAtActionResult;
        createdResult!.Value.Should().BeEquivalentTo(createdApplication);
        createdResult.ActionName.Should().Be(nameof(ApplicationsController.GetApplication));
    }

    [Fact]
    public async Task CreateApplication_WithDuplicateName_ShouldReturnConflict()
    {
        // Arrange
        var applicationData = new ApplicationCreate { Name = "Duplicate Name" };
        
        _mockRepository.Setup(r => r.CreateAsync(applicationData))
                      .ThrowsAsync(new InvalidOperationException("Application with name 'Duplicate Name' already exists"));

        // Act
        var result = await _controller.CreateApplication(applicationData);

        // Assert
        result.Result.Should().BeOfType<ConflictObjectResult>();
    }

    [Fact]
    public async Task CreateApplication_WithUnexpectedError_ShouldReturnInternalServerError()
    {
        // Arrange
        var applicationData = new ApplicationCreate { Name = "Test App" };
        
        _mockRepository.Setup(r => r.CreateAsync(applicationData))
                      .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.CreateApplication(applicationData);

        // Assert
        result.Result.Should().BeOfType<ObjectResult>();
        var objectResult = result.Result as ObjectResult;
        objectResult!.StatusCode.Should().Be(500);
    }

    [Fact]
    public async Task GetApplication_WithValidId_ShouldReturnApplication()
    {
        // Arrange
        var applicationId = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
        var application = new ApplicationWithConfigs
        {
            Id = applicationId,
            Name = "Test Application",
            Comments = "Test comments",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            ConfigurationIds = new List<string>()
        };

        _mockRepository.Setup(r => r.GetByIdWithConfigsAsync(applicationId))
                      .ReturnsAsync(application);

        // Act
        var result = await _controller.GetApplication(applicationId);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult!.Value.Should().BeEquivalentTo(application);
    }

    [Fact]
    public async Task GetApplication_WithInvalidUlid_ShouldReturnBadRequest()
    {
        // Act
        var result = await _controller.GetApplication("invalid-ulid");

        // Assert
        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task GetApplication_WithNonExistentId_ShouldReturnNotFound()
    {
        // Arrange
        var applicationId = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
        
        _mockRepository.Setup(r => r.GetByIdWithConfigsAsync(applicationId))
                      .ReturnsAsync((ApplicationWithConfigs?)null);

        // Act
        var result = await _controller.GetApplication(applicationId);

        // Assert
        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task ListApplications_ShouldReturnAllApplications()
    {
        // Arrange
        var applications = new List<Application>
        {
            new() { Id = "01ARZ3NDEKTSV4RRFFQ69G5FAV", Name = "App 1", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new() { Id = "01BX5ZZKBKACTAV9WEVGEMMVRZ", Name = "App 2", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };

        _mockRepository.Setup(r => r.GetAllAsync())
                      .ReturnsAsync(applications);

        // Act
        var result = await _controller.ListApplications();

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult!.Value.Should().BeEquivalentTo(applications);
    }

    [Fact]
    public async Task UpdateApplication_WithValidData_ShouldReturnUpdatedApplication()
    {
        // Arrange
        var applicationId = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
        var updateData = new ApplicationUpdate
        {
            Name = "Updated Name",
            Comments = "Updated comments"
        };

        var updatedApplication = new Application
        {
            Id = applicationId,
            Name = updateData.Name,
            Comments = updateData.Comments,
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow
        };

        _mockRepository.Setup(r => r.UpdateAsync(applicationId, updateData))
                      .ReturnsAsync(updatedApplication);

        // Act
        var result = await _controller.UpdateApplication(applicationId, updateData);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult!.Value.Should().BeEquivalentTo(updatedApplication);
    }

    [Fact]
    public async Task UpdateApplication_WithInvalidUlid_ShouldReturnBadRequest()
    {
        // Arrange
        var updateData = new ApplicationUpdate { Name = "Updated Name" };

        // Act
        var result = await _controller.UpdateApplication("invalid-ulid", updateData);

        // Assert
        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task UpdateApplication_WithNonExistentId_ShouldReturnNotFound()
    {
        // Arrange
        var applicationId = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
        var updateData = new ApplicationUpdate { Name = "Updated Name" };

        _mockRepository.Setup(r => r.UpdateAsync(applicationId, updateData))
                      .ReturnsAsync((Application?)null);

        // Act
        var result = await _controller.UpdateApplication(applicationId, updateData);

        // Assert
        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task DeleteApplication_WithValidId_ShouldReturnNoContent()
    {
        // Arrange
        var applicationId = "01ARZ3NDEKTSV4RRFFQ69G5FAV";

        _mockRepository.Setup(r => r.DeleteAsync(applicationId))
                      .ReturnsAsync(true);

        // Act
        var result = await _controller.DeleteApplication(applicationId);

        // Assert
        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task DeleteApplication_WithInvalidUlid_ShouldReturnBadRequest()
    {
        // Act
        var result = await _controller.DeleteApplication("invalid-ulid");

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task DeleteApplication_WithNonExistentId_ShouldReturnNotFound()
    {
        // Arrange
        var applicationId = "01ARZ3NDEKTSV4RRFFQ69G5FAV";

        _mockRepository.Setup(r => r.DeleteAsync(applicationId))
                      .ReturnsAsync(false);

        // Act
        var result = await _controller.DeleteApplication(applicationId);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task DeleteApplications_WithValidIds_ShouldReturnNoContent()
    {
        // Arrange
        var request = new DeleteApplicationsRequest
        {
            Ids = new List<string> { "01ARZ3NDEKTSV4RRFFQ69G5FAV", "01BX5ZZKBKACTAV9WEVGEMMVRZ" }
        };

        _mockRepository.Setup(r => r.DeleteMultipleAsync(request.Ids))
                      .ReturnsAsync(2);

        // Act
        var result = await _controller.DeleteApplications(request);

        // Assert
        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task DeleteApplications_WithEmptyIds_ShouldReturnBadRequest()
    {
        // Arrange
        var request = new DeleteApplicationsRequest { Ids = new List<string>() };

        // Act
        var result = await _controller.DeleteApplications(request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task DeleteApplications_WithInvalidUlid_ShouldReturnBadRequest()
    {
        // Arrange
        var request = new DeleteApplicationsRequest
        {
            Ids = new List<string> { "01ARZ3NDEKTSV4RRFFQ69G5FAV", "invalid-ulid" }
        };

        // Act
        var result = await _controller.DeleteApplications(request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task DeleteApplications_WithNoApplicationsFound_ShouldReturnNotFound()
    {
        // Arrange
        var request = new DeleteApplicationsRequest
        {
            Ids = new List<string> { "01ARZ3NDEKTSV4RRFFQ69G5FAV" }
        };

        _mockRepository.Setup(r => r.DeleteMultipleAsync(request.Ids))
                      .ReturnsAsync(0);

        // Act
        var result = await _controller.DeleteApplications(request);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }
}