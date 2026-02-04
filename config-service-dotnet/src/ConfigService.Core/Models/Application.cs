using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace ConfigService.Core.Models;

/// <summary>
/// Base application model with common fields
/// </summary>
public abstract class ApplicationBase
{
    [Required]
    [StringLength(256, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [StringLength(1024)]
    public string? Comments { get; set; }
}

/// <summary>
/// Model for creating a new application
/// </summary>
public class ApplicationCreate : ApplicationBase
{
}

/// <summary>
/// Model for updating an existing application
/// </summary>
public class ApplicationUpdate : ApplicationBase
{
}

/// <summary>
/// Complete application model with all fields
/// </summary>
public class Application : ApplicationBase
{
    private static readonly Regex UlidRegex = new(@"^[0-9A-HJKMNP-TV-Z]{26}$", RegexOptions.Compiled);

    [Required]
    public string Id { get; set; } = string.Empty;

    [Required]
    public DateTime CreatedAt { get; set; }

    [Required]
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Validates that the ID is a valid ULID format
    /// </summary>
    public bool IsValidUlid() => UlidRegex.IsMatch(Id);

    /// <summary>
    /// Validates a ULID string format
    /// </summary>
    public static bool IsValidUlid(string ulid) => !string.IsNullOrEmpty(ulid) && UlidRegex.IsMatch(ulid);
}

/// <summary>
/// Application model including related configuration IDs
/// </summary>
public class ApplicationWithConfigs : Application
{
    public List<string> ConfigurationIds { get; set; } = new();

    /// <summary>
    /// Validates that all configuration IDs are valid ULID format
    /// </summary>
    public bool AreConfigurationIdsValid() => ConfigurationIds.All(IsValidUlid);
}