using ConfigService.Core.Interfaces;
using ConfigService.Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ConfigService.Api.Controllers;

/// <summary>
/// Configuration management controller
/// </summary>
[ApiController]
[Route("api/v1/applications/{applicationId}/[controller]")]
[Produces("application/json")]
[EnableRateLimiting("ApiPolicy")]
[Authorize] // Require authentication for all configuration operations
public class ConfigurationsController : ControllerBase
{
    private readonly IConfigurationRepository _configurationRepository;
    private readonly IApplicationRepository _applicationRepository;
    private readonly ILogger<ConfigurationsController> _logger;

    public ConfigurationsController(
        IConfigurationRepository configurationRepository,
        IApplicationRepository applicationRepository,
        ILogger<ConfigurationsController> logger)
    {
        _configurationRepository = configurationRepository;
        _applicationRepository = applicationRepository;
        _logger = logger;
    }

    /// <summary>
    /// Get all configurations for an application
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<ConfigurationItem>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<List<ConfigurationItem>>> GetConfigurations(
        [FromRoute] string applicationId,
        [FromQuery] bool summary = false,
        [FromQuery] string? search = null)
    {
        try
        {
            // Validate application ID format
            if (!Application.IsValidUlid(applicationId))
            {
                return BadRequest(new { message = "Invalid application ID format" });
            }

            // Check if application exists
            var applicationExists = await _applicationRepository.ExistsAsync(applicationId);
            if (!applicationExists)
            {
                return NotFound(new { message = "Application not found" });
            }

            if (!string.IsNullOrEmpty(search))
            {
                var searchResults = await _configurationRepository.SearchByNameAsync(applicationId, search);
                return Ok(searchResults);
            }

            if (summary)
            {
                var summaries = await _configurationRepository.GetSummariesByApplicationIdAsync(applicationId);
                return Ok(summaries);
            }

            var configurations = await _configurationRepository.GetByApplicationIdAsync(applicationId);
            return Ok(configurations);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting configurations for application: {ApplicationId}", applicationId);
            return StatusCode(500, new { message = "An error occurred while retrieving configurations" });
        }
    }

    /// <summary>
    /// Get a specific configuration by ID
    /// </summary>
    [HttpGet("{configurationId}")]
    [ProducesResponseType(typeof(ConfigurationItem), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<ConfigurationItem>> GetConfiguration(
        [FromRoute] string applicationId,
        [FromRoute] string configurationId)
    {
        try
        {
            // Validate IDs format
            if (!Application.IsValidUlid(applicationId))
            {
                return BadRequest(new { message = "Invalid application ID format" });
            }

            if (!ConfigurationItem.IsValidUlid(configurationId))
            {
                return BadRequest(new { message = "Invalid configuration ID format" });
            }

            var configuration = await _configurationRepository.GetByIdAsync(configurationId);
            if (configuration == null)
            {
                return NotFound(new { message = "Configuration not found" });
            }

            // Verify configuration belongs to the specified application
            if (configuration.ApplicationId != applicationId)
            {
                return NotFound(new { message = "Configuration not found in the specified application" });
            }

            return Ok(configuration);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting configuration: {ConfigurationId}", configurationId);
            return StatusCode(500, new { message = "An error occurred while retrieving the configuration" });
        }
    }

    /// <summary>
    /// Create a new configuration
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ConfigurationItem), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<ConfigurationItem>> CreateConfiguration(
        [FromRoute] string applicationId,
        [FromBody] ConfigurationCreate configurationData)
    {
        try
        {
            // Validate application ID format
            if (!Application.IsValidUlid(applicationId))
            {
                return BadRequest(new { message = "Invalid application ID format" });
            }

            // Set the application ID from the route (override any value in the body)
            configurationData.ApplicationId = applicationId;

            // Manually validate the model since we're setting ApplicationId after binding
            if (string.IsNullOrWhiteSpace(configurationData.Name))
            {
                return BadRequest(new { message = "The Name field is required." });
            }

            if (configurationData.Name.Length > 256)
            {
                return BadRequest(new { message = "The Name field must be 256 characters or less." });
            }

            // Check if application exists
            var applicationExists = await _applicationRepository.ExistsAsync(applicationId);
            if (!applicationExists)
            {
                return NotFound(new { message = "Application not found" });
            }

            // Check if configuration name already exists for this application
            var nameExists = await _configurationRepository.ExistsByApplicationIdAndNameAsync(
                applicationId, configurationData.Name);
            if (nameExists)
            {
                return Conflict(new { message = $"Configuration with name '{configurationData.Name}' already exists in this application" });
            }

            var configuration = await _configurationRepository.CreateAsync(configurationData);
            return CreatedAtAction(
                nameof(GetConfiguration),
                new { applicationId, configurationId = configuration.Id },
                configuration);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating configuration for application: {ApplicationId}", applicationId);
            return StatusCode(500, new { message = "An error occurred while creating the configuration" });
        }
    }

    /// <summary>
    /// Update an existing configuration
    /// </summary>
    [HttpPut("{configurationId}")]
    [ProducesResponseType(typeof(ConfigurationItem), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<ConfigurationItem>> UpdateConfiguration(
        [FromRoute] string applicationId,
        [FromRoute] string configurationId,
        [FromBody] ConfigurationUpdate configurationData)
    {
        try
        {
            // Validate IDs format
            if (!Application.IsValidUlid(applicationId))
            {
                return BadRequest(new { message = "Invalid application ID format" });
            }

            if (!ConfigurationItem.IsValidUlid(configurationId))
            {
                return BadRequest(new { message = "Invalid configuration ID format" });
            }

            // Check if configuration exists and belongs to the application
            var existingConfiguration = await _configurationRepository.GetByIdAsync(configurationId);
            if (existingConfiguration == null || existingConfiguration.ApplicationId != applicationId)
            {
                return NotFound(new { message = "Configuration not found" });
            }

            // Check if new name conflicts with existing configuration (if name is being changed)
            if (existingConfiguration.Name != configurationData.Name)
            {
                var nameExists = await _configurationRepository.ExistsByApplicationIdAndNameAsync(
                    applicationId, configurationData.Name);
                if (nameExists)
                {
                    return Conflict(new { message = $"Configuration with name '{configurationData.Name}' already exists in this application" });
                }
            }

            var updatedConfiguration = await _configurationRepository.UpdateAsync(configurationId, configurationData);
            if (updatedConfiguration == null)
            {
                return NotFound(new { message = "Configuration not found" });
            }

            return Ok(updatedConfiguration);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating configuration: {ConfigurationId}", configurationId);
            return StatusCode(500, new { message = "An error occurred while updating the configuration" });
        }
    }

    /// <summary>
    /// Delete a configuration
    /// </summary>
    [HttpDelete("{configurationId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> DeleteConfiguration(
        [FromRoute] string applicationId,
        [FromRoute] string configurationId)
    {
        try
        {
            // Validate IDs format
            if (!Application.IsValidUlid(applicationId))
            {
                return BadRequest(new { message = "Invalid application ID format" });
            }

            if (!ConfigurationItem.IsValidUlid(configurationId))
            {
                return BadRequest(new { message = "Invalid configuration ID format" });
            }

            // Check if configuration exists and belongs to the application
            var existingConfiguration = await _configurationRepository.GetByIdAsync(configurationId);
            if (existingConfiguration == null || existingConfiguration.ApplicationId != applicationId)
            {
                return NotFound(new { message = "Configuration not found" });
            }

            var deleted = await _configurationRepository.DeleteAsync(configurationId);
            if (!deleted)
            {
                return NotFound(new { message = "Configuration not found" });
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting configuration: {ConfigurationId}", configurationId);
            return StatusCode(500, new { message = "An error occurred while deleting the configuration" });
        }
    }

    /// <summary>
    /// Delete multiple configurations
    /// </summary>
    [HttpDelete]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> DeleteConfigurations(
        [FromRoute] string applicationId,
        [FromBody] Dictionary<string, object> requestBody)
    {
        try
        {
            // Validate application ID format
            if (!Application.IsValidUlid(applicationId))
            {
                return BadRequest(new { message = "Invalid application ID format" });
            }

            // Extract configuration IDs from request body
            if (!requestBody.TryGetValue("ids", out var idsObj) || idsObj is not System.Text.Json.JsonElement idsElement)
            {
                return BadRequest(new { message = "Missing 'ids' field in request body" });
            }

            List<string> configurationIds;
            try
            {
                configurationIds = idsElement.EnumerateArray()
                    .Select(id => id.GetString())
                    .Where(id => !string.IsNullOrEmpty(id))
                    .Cast<string>()
                    .ToList();
            }
            catch
            {
                return BadRequest(new { message = "Invalid 'ids' format. Expected array of strings." });
            }

            if (!configurationIds.Any())
            {
                return BadRequest(new { message = "No configuration IDs provided" });
            }

            // Validate all configuration IDs belong to the specified application
            foreach (var configId in configurationIds)
            {
                if (!ConfigurationItem.IsValidUlid(configId))
                {
                    return BadRequest(new { message = $"Invalid configuration ID format: {configId}" });
                }

                var config = await _configurationRepository.GetByIdAsync(configId);
                if (config == null || config.ApplicationId != applicationId)
                {
                    return NotFound(new { message = $"Configuration {configId} not found in the specified application" });
                }
            }

            var deletedCount = await _configurationRepository.DeleteMultipleAsync(configurationIds);
            return Ok(new { deleted_count = deletedCount });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting multiple configurations for application: {ApplicationId}", applicationId);
            return StatusCode(500, new { message = "An error occurred while deleting configurations" });
        }
    }
}