using ConfigService.Core.Models;

namespace ConfigService.Core.Interfaces;

/// <summary>
/// OAuth authentication service interface
/// </summary>
public interface IOAuthService
{
    /// <summary>
    /// Get available OAuth providers
    /// </summary>
    Task<List<OAuthProvider>> GetProvidersAsync();

    /// <summary>
    /// Generate OAuth authorization URL
    /// </summary>
    Task<string> GetAuthorizationUrlAsync(string provider, string? returnUrl = null);

    /// <summary>
    /// Handle OAuth callback and authenticate user
    /// </summary>
    Task<LoginResponse?> HandleCallbackAsync(OAuthCallbackRequest request);

    /// <summary>
    /// Get user profile from OAuth provider
    /// </summary>
    Task<ExternalUserProfile?> GetUserProfileAsync(string provider, string accessToken);

    /// <summary>
    /// Create or update user from external profile
    /// </summary>
    Task<UserInfo> CreateOrUpdateUserAsync(string provider, ExternalUserProfile profile);
}

/// <summary>
/// JWT token service interface
/// </summary>
public interface ITokenService
{
    /// <summary>
    /// Generate JWT token for user
    /// </summary>
    string GenerateAccessToken(UserInfo user);

    /// <summary>
    /// Generate refresh token
    /// </summary>
    string GenerateRefreshToken();

    /// <summary>
    /// Validate JWT token and return user info
    /// </summary>
    Task<UserInfo?> ValidateTokenAsync(string token);

    /// <summary>
    /// Refresh JWT token
    /// </summary>
    Task<LoginResponse?> RefreshTokenAsync(string refreshToken);

    /// <summary>
    /// Revoke refresh token
    /// </summary>
    Task<bool> RevokeRefreshTokenAsync(string refreshToken);
}

/// <summary>
/// User management service interface
/// </summary>
public interface IUserService
{
    /// <summary>
    /// Get user information by ID
    /// </summary>
    Task<UserInfo?> GetUserAsync(string userId);

    /// <summary>
    /// Get user by provider and provider ID
    /// </summary>
    Task<UserInfo?> GetUserByProviderAsync(string provider, string providerId);

    /// <summary>
    /// Create new user from external profile
    /// </summary>
    Task<UserInfo> CreateUserAsync(string provider, ExternalUserProfile profile);

    /// <summary>
    /// Update user information
    /// </summary>
    Task<UserInfo?> UpdateUserAsync(string userId, ExternalUserProfile profile);

    /// <summary>
    /// Update user's last login time
    /// </summary>
    Task UpdateLastLoginAsync(string userId);

    /// <summary>
    /// Check if user has specific role
    /// </summary>
    Task<bool> HasRoleAsync(string userId, string role);

    /// <summary>
    /// Update user role (Admin only)
    /// </summary>
    Task<bool> UpdateUserRoleAsync(string userId, string role);
}

/// <summary>
/// Audit logging service interface
/// </summary>
public interface IAuditService
{
    /// <summary>
    /// Log security-related events
    /// </summary>
    Task LogAsync(AuditLog auditLog);

    /// <summary>
    /// Get audit logs for a user
    /// </summary>
    Task<List<AuditLog>> GetUserAuditLogsAsync(string userId, int limit = 100);

    /// <summary>
    /// Get recent security events
    /// </summary>
    Task<List<AuditLog>> GetRecentSecurityEventsAsync(int limit = 100);
}