using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace ConfigService.Core.Models;

/// <summary>
/// Base configuration model with common fields
/// </summary>
public abstract class ConfigurationBase
{
    [Required]
    [StringLength(256, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [StringLength(1024)]
    public string? Comments { get; set; }

    [Required]
    public JsonElement Config { get; set; } = JsonSerializer.SerializeToElement(new { });
}

/// <summary>
/// Model for creating a new configuration
/// </summary>
public class ConfigurationCreate : ConfigurationBase
{
    public string ApplicationId { get; set; } = string.Empty;
}

/// <summary>
/// Model for updating an existing configuration
/// </summary>
public class ConfigurationUpdate : ConfigurationBase
{
}

/// <summary>
/// Complete configuration model with all fields
/// </summary>
public class ConfigurationItem : ConfigurationBase
{
    private static readonly Regex UlidRegex = new(@"^[0-9A-HJKMNP-TV-Z]{26}$", RegexOptions.Compiled);

    [Required]
    public string Id { get; set; } = string.Empty;

    [Required]
    public string ApplicationId { get; set; } = string.Empty;

    [Required]
    public DateTime CreatedAt { get; set; }

    [Required]
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Validates that the ID is a valid ULID format
    /// </summary>
    public bool IsValidUlid() => UlidRegex.IsMatch(Id);

    /// <summary>
    /// Validates that the ApplicationId is a valid ULID format
    /// </summary>
    public bool IsValidApplicationId() => UlidRegex.IsMatch(ApplicationId);

    /// <summary>
    /// Validates a ULID string format
    /// </summary>
    public static bool IsValidUlid(string ulid) => !string.IsNullOrEmpty(ulid) && UlidRegex.IsMatch(ulid);

    /// <summary>
    /// Gets the configuration as a formatted JSON string
    /// </summary>
    public string GetFormattedConfig()
    {
        return JsonSerializer.Serialize(Config, new JsonSerializerOptions 
        { 
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        });
    }

    /// <summary>
    /// Sets the configuration from a JSON string
    /// </summary>
    public void SetConfigFromJson(string json)
    {
        try
        {
            Config = JsonSerializer.Deserialize<JsonElement>(json);
        }
        catch (JsonException)
        {
            throw new ArgumentException("Invalid JSON format for configuration");
        }
    }
}

/// <summary>
/// Configuration summary model for listing configurations
/// </summary>
public class ConfigurationSummary
{
    [Required]
    public string Id { get; set; } = string.Empty;

    [Required]
    public string ApplicationId { get; set; } = string.Empty;

    [Required]
    public string Name { get; set; } = string.Empty;

    public string? Comments { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; }

    [Required]
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Number of configuration keys/properties
    /// </summary>
    public int ConfigKeyCount { get; set; }
}