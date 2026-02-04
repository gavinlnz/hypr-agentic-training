using ConfigService.Core.Interfaces;
using ConfigService.Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.ComponentModel.DataAnnotations;

namespace ConfigService.Api.Controllers;

/// <summary>
/// API controller for Application management
/// </summary>
[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
[EnableRateLimiting("ApiPolicy")]
[Authorize] // Require authentication for all application operations
public class ApplicationsController : ControllerBase
{
    private readonly IApplicationRepository _repository;
    private readonly ILogger<ApplicationsController> _logger;

    public ApplicationsController(IApplicationRepository repository, ILogger<ApplicationsController> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    /// <summary>
    /// Create a new application
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(Application), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<Application>> CreateApplication([FromBody] ApplicationCreate applicationData)
    {
        try
        {
            _logger.LogInformation("Creating application: {ApplicationData}", applicationData);
            var result = await _repository.CreateAsync(applicationData);
            _logger.LogInformation("Application created successfully: {Result}", result);
            return CreatedAtAction(nameof(GetApplication), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("already exists"))
        {
            _logger.LogError(ex, "Conflict creating application");
            return Conflict(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error creating application");
            return StatusCode(500, new { message = "Failed to create application" });
        }
    }

    /// <summary>
    /// Get application by ID including related configuration IDs
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApplicationWithConfigs), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ApplicationWithConfigs>> GetApplication([FromRoute] string id)
    {
        if (!Application.IsValidUlid(id))
        {
            return BadRequest(new { message = "Invalid application ID format" });
        }

        try
        {
            var application = await _repository.GetByIdWithConfigsAsync(id);
            if (application == null)
            {
                return NotFound(new { message = "Application not found" });
            }
            return Ok(application);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting application {Id}", id);
            return StatusCode(500, new { message = "Failed to get application" });
        }
    }

    /// <summary>
    /// Get all applications
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<Application>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<List<Application>>> ListApplications()
    {
        try
        {
            var applications = await _repository.GetAllAsync();
            return Ok(applications);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing applications");
            return StatusCode(500, new { message = "Failed to list applications" });
        }
    }

    /// <summary>
    /// Update an existing application
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(Application), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<Application>> UpdateApplication([FromRoute] string id, [FromBody] ApplicationUpdate applicationData)
    {
        if (!Application.IsValidUlid(id))
        {
            return BadRequest(new { message = "Invalid application ID format" });
        }

        try
        {
            var application = await _repository.UpdateAsync(id, applicationData);
            if (application == null)
            {
                return NotFound(new { message = "Application not found" });
            }
            return Ok(application);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("already exists"))
        {
            _logger.LogError(ex, "Conflict updating application");
            return Conflict(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating application {Id}", id);
            return StatusCode(500, new { message = "Failed to update application" });
        }
    }

    /// <summary>
    /// Delete an application by ID
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DeleteApplication([FromRoute] string id)
    {
        if (!Application.IsValidUlid(id))
        {
            return BadRequest(new { message = "Invalid application ID format" });
        }

        try
        {
            var deleted = await _repository.DeleteAsync(id);
            if (!deleted)
            {
                return NotFound(new { message = "Application not found" });
            }
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting application {Id}", id);
            return StatusCode(500, new { message = "Failed to delete application" });
        }
    }

    /// <summary>
    /// Delete multiple applications by IDs
    /// </summary>
    [HttpDelete]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DeleteApplications([FromBody] DeleteApplicationsRequest request)
    {
        if (request.Ids == null || !request.Ids.Any())
        {
            return BadRequest(new { message = "No application IDs provided" });
        }

        // Validate all ULIDs
        foreach (var appId in request.Ids)
        {
            if (!Application.IsValidUlid(appId))
            {
                return BadRequest(new { message = $"Invalid application ID format: {appId}" });
            }
        }

        try
        {
            var deletedCount = await _repository.DeleteMultipleAsync(request.Ids);
            if (deletedCount == 0)
            {
                return NotFound(new { message = "No applications found to delete" });
            }
            _logger.LogInformation("Deleted {Count} applications", deletedCount);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting applications {Ids}", request.Ids);
            return StatusCode(500, new { message = "Failed to delete applications" });
        }
    }
}

/// <summary>
/// Request model for deleting multiple applications
/// </summary>
public class DeleteApplicationsRequest
{
    [Required]
    public List<string> Ids { get; set; } = new();
}