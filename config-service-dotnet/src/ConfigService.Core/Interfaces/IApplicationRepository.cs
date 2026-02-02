using ConfigService.Core.Models;

namespace ConfigService.Core.Interfaces;

/// <summary>
/// Repository interface for Application entity operations
/// </summary>
public interface IApplicationRepository
{
    /// <summary>
    /// Create a new application
    /// </summary>
    Task<Application> CreateAsync(ApplicationCreate applicationData);

    /// <summary>
    /// Get application by ID
    /// </summary>
    Task<Application?> GetByIdAsync(string id);

    /// <summary>
    /// Get application by ID including related configuration IDs
    /// </summary>
    Task<ApplicationWithConfigs?> GetByIdWithConfigsAsync(string id);

    /// <summary>
    /// Get all applications
    /// </summary>
    Task<List<Application>> GetAllAsync();

    /// <summary>
    /// Update an existing application
    /// </summary>
    Task<Application?> UpdateAsync(string id, ApplicationUpdate applicationData);

    /// <summary>
    /// Delete an application by ID
    /// </summary>
    Task<bool> DeleteAsync(string id);

    /// <summary>
    /// Delete multiple applications by IDs
    /// </summary>
    Task<int> DeleteMultipleAsync(List<string> ids);

    /// <summary>
    /// Check if an application exists by ID
    /// </summary>
    Task<bool> ExistsAsync(string id);

    /// <summary>
    /// Check if an application with the given name exists (excluding the given ID)
    /// </summary>
    Task<bool> ExistsByNameAsync(string name, string? excludeId = null);
}