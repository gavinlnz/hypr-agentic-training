using ConfigService.Core.Models;

namespace ConfigService.Core.Interfaces;

/// <summary>
/// Repository interface for configuration operations
/// </summary>
public interface IConfigurationRepository
{
    /// <summary>
    /// Create a new configuration
    /// </summary>
    Task<ConfigurationItem> CreateAsync(ConfigurationCreate configurationData);

    /// <summary>
    /// Get all configurations for an application
    /// </summary>
    Task<List<ConfigurationItem>> GetByApplicationIdAsync(string applicationId);

    /// <summary>
    /// Get all configuration summaries for an application (without full config data)
    /// </summary>
    Task<List<ConfigurationSummary>> GetSummariesByApplicationIdAsync(string applicationId);

    /// <summary>
    /// Get a specific configuration by ID
    /// </summary>
    Task<ConfigurationItem?> GetByIdAsync(string configurationId);

    /// <summary>
    /// Get a specific configuration by application ID and name
    /// </summary>
    Task<ConfigurationItem?> GetByApplicationIdAndNameAsync(string applicationId, string name);

    /// <summary>
    /// Update an existing configuration
    /// </summary>
    Task<ConfigurationItem?> UpdateAsync(string configurationId, ConfigurationUpdate configurationData);

    /// <summary>
    /// Delete a configuration by ID
    /// </summary>
    Task<bool> DeleteAsync(string configurationId);

    /// <summary>
    /// Delete multiple configurations by IDs
    /// </summary>
    Task<int> DeleteMultipleAsync(List<string> configurationIds);

    /// <summary>
    /// Delete all configurations for an application
    /// </summary>
    Task<int> DeleteByApplicationIdAsync(string applicationId);

    /// <summary>
    /// Check if a configuration exists by ID
    /// </summary>
    Task<bool> ExistsAsync(string configurationId);

    /// <summary>
    /// Check if a configuration name exists for an application
    /// </summary>
    Task<bool> ExistsByApplicationIdAndNameAsync(string applicationId, string name);

    /// <summary>
    /// Search configurations by name pattern within an application
    /// </summary>
    Task<List<ConfigurationItem>> SearchByNameAsync(string applicationId, string namePattern);

    /// <summary>
    /// Get configuration count for an application
    /// </summary>
    Task<int> GetCountByApplicationIdAsync(string applicationId);
}