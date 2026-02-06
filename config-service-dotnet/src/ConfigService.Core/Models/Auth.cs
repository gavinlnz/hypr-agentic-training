using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ConfigService.Core.Models;

/// <summary>
/// OAuth provider information
/// </summary>
public class OAuthProvider
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
    
    [JsonPropertyName("displayName")]
    public string DisplayName { get; set; } = string.Empty;
    
    [JsonPropertyName("authorizeUrl")]
    public string AuthorizeUrl { get; set; } = string.Empty;
    
    [JsonPropertyName("iconUrl")]
    public string IconUrl { get; set; } = string.Empty;
    
    [JsonPropertyName("isEnabled")]
    public bool IsEnabled { get; set; } = true;
}

/// <summary>
/// Authorization URL response
/// </summary>
public class AuthorizationUrlResponse
{
    [JsonPropertyName("authorizationUrl")]
    public string AuthorizationUrl { get; set; } = string.Empty;
}

/// <summary>
/// OAuth callback request
/// </summary>
public class OAuthCallbackRequest
{
    [Required]
    public string Provider { get; set; } = string.Empty;
    
    [Required]
    public string Code { get; set; } = string.Empty;
    
    public string? State { get; set; }
}

/// <summary>
/// Login response model
/// </summary>
public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public UserInfo User { get; set; } = new();
}

/// <summary>
/// User information model
/// </summary>
public class UserInfo
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public string ProviderId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime LastLoginAt { get; set; }
}

/// <summary>
/// External user profile from OAuth provider
/// </summary>
public class ExternalUserProfile
{
    public string ProviderId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? Username { get; set; }
    public Dictionary<string, object> AdditionalClaims { get; set; } = new();
}

/// <summary>
/// OAuth state for CSRF protection
/// </summary>
public class OAuthState
{
    public string Id { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public string? ReturnUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
}

/// <summary>
/// Audit log model for security tracking
/// </summary>
public class AuditLog
{
    public string Id { get; set; } = string.Empty;
    public string? UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Resource { get; set; } = string.Empty;
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTime Timestamp { get; set; }
    public int StatusCode { get; set; }
    public string? Details { get; set; }
}