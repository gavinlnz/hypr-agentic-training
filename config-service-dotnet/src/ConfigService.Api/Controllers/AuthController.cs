using ConfigService.Core.Interfaces;
using ConfigService.Core.Models;
using ConfigService.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ConfigService.Api.Controllers;

/// <summary>
/// OAuth authentication controller
/// </summary>
[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IOAuthService _oauthService;
    private readonly ITokenService _tokenService;
    private readonly IUserService _userService;
    private readonly IAuditService _auditService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IOAuthService oauthService,
        ITokenService tokenService,
        IUserService userService,
        IAuditService auditService,
        ILogger<AuthController> logger)
    {
        _oauthService = oauthService;
        _tokenService = tokenService;
        _userService = userService;
        _auditService = auditService;
        _logger = logger;
    }

    /// <summary>
    /// Get available OAuth providers
    /// </summary>
    [HttpGet("providers")]
    [ProducesResponseType(typeof(List<OAuthProvider>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<OAuthProvider>>> GetProviders()
    {
        try
        {
            var providers = await _oauthService.GetProvidersAsync();
            return Ok(providers);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting OAuth providers");
            return StatusCode(500, new { message = "Failed to get OAuth providers" });
        }
    }

    /// <summary>
    /// Get OAuth authorization URL for a provider
    /// </summary>
    [HttpGet("authorize/{provider}")]
    [EnableRateLimiting("AuthPolicy")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult> GetAuthorizationUrl(
        [FromRoute] string provider,
        [FromQuery] string? returnUrl = null)
    {
        try
        {
            var authUrl = await _oauthService.GetAuthorizationUrlAsync(provider, returnUrl);
            
            if (string.IsNullOrEmpty(authUrl))
            {
                return NotFound(new { message = $"OAuth provider '{provider}' not found or not enabled" });
            }

            return Ok(new { authorizationUrl = authUrl });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting authorization URL for provider: {Provider}", provider);
            return StatusCode(500, new { message = "Failed to get authorization URL" });
        }
    }

    /// <summary>
    /// Handle OAuth callback from provider (GET request with query parameters)
    /// </summary>
    [HttpGet("callback")]
    [EnableRateLimiting("AuthPolicy")]
    [ProducesResponseType(StatusCodes.Status302Found)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> HandleOAuthCallback(
        [FromQuery] string? code,
        [FromQuery] string? state,
        [FromQuery] string? error,
        [FromQuery] string? provider)
    {
        try
        {
            if (!string.IsNullOrEmpty(error))
            {
                _logger.LogWarning("OAuth error received: {Error}", error);
                return Redirect($"http://localhost:3002/?error={Uri.EscapeDataString(error)}");
            }

            if (string.IsNullOrEmpty(code) || string.IsNullOrEmpty(provider))
            {
                return Redirect("http://localhost:3002/?error=missing_parameters");
            }

            // Handle the OAuth callback
            var request = new OAuthCallbackRequest
            {
                Provider = provider,
                Code = code,
                State = state
            };

            var result = await _oauthService.HandleCallbackAsync(request);
            
            if (result == null)
            {
                // Log failed OAuth attempt
                await _auditService.LogAsync(new AuditLog
                {
                    Id = UlidGenerator.NewUlid(),
                    Action = "OAUTH_LOGIN_FAILED",
                    Resource = "Auth",
                    IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    UserAgent = Request.Headers["User-Agent"],
                    Timestamp = DateTime.UtcNow,
                    StatusCode = 401,
                    Details = $"Failed OAuth login attempt for provider: {provider}"
                });

                return Redirect("http://localhost:3002/?error=authentication_failed");
            }

            // Log successful login
            await _auditService.LogAsync(new AuditLog
            {
                Id = UlidGenerator.NewUlid(),
                UserId = result.User.Id,
                Action = "OAUTH_LOGIN_SUCCESS",
                Resource = "Auth",
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                UserAgent = Request.Headers["User-Agent"],
                Timestamp = DateTime.UtcNow,
                StatusCode = 200,
                Details = $"Successful OAuth login via {provider}"
            });

            // Redirect to frontend with authentication data
            var redirectUrl = $"http://localhost:3002/auth/callback" +
                $"?token={Uri.EscapeDataString(result.Token)}" +
                $"&refresh_token={Uri.EscapeDataString(result.RefreshToken)}" +
                $"&expires_at={Uri.EscapeDataString(result.ExpiresAt.ToString("O"))}" +
                $"&user={Uri.EscapeDataString(System.Text.Json.JsonSerializer.Serialize(result.User))}";

            return Redirect(redirectUrl);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling OAuth callback");
            return Redirect("http://localhost:3002/?error=server_error");
        }
    }

    /// <summary>
    /// Handle OAuth callback and complete authentication (POST for API clients)
    /// </summary>
    [HttpPost("callback")]
    [EnableRateLimiting("AuthPolicy")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<LoginResponse>> HandleCallback([FromBody] OAuthCallbackRequest request)
    {
        try
        {
            var result = await _oauthService.HandleCallbackAsync(request);
            
            if (result == null)
            {
                // Log failed OAuth attempt
                await _auditService.LogAsync(new AuditLog
                {
                    Id = UlidGenerator.NewUlid(),
                    Action = "OAUTH_LOGIN_FAILED",
                    Resource = "Auth",
                    IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    UserAgent = Request.Headers["User-Agent"],
                    Timestamp = DateTime.UtcNow,
                    StatusCode = 401,
                    Details = $"Failed OAuth login attempt for provider: {request.Provider}"
                });

                return Unauthorized(new { message = "OAuth authentication failed" });
            }

            // Log successful login
            await _auditService.LogAsync(new AuditLog
            {
                Id = UlidGenerator.NewUlid(),
                UserId = result.User.Id,
                Action = "OAUTH_LOGIN_SUCCESS",
                Resource = "Auth",
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                UserAgent = Request.Headers["User-Agent"],
                Timestamp = DateTime.UtcNow,
                StatusCode = 200,
                Details = $"Successful OAuth login via {request.Provider}"
            });

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling OAuth callback for provider: {Provider}", request.Provider);
            return StatusCode(500, new { message = "An error occurred during OAuth authentication" });
        }
    }

    /// <summary>
    /// Refresh JWT token
    /// </summary>
    [HttpPost("refresh")]
    [EnableRateLimiting("AuthPolicy")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<LoginResponse>> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        try
        {
            var result = await _tokenService.RefreshTokenAsync(request.RefreshToken);
            
            if (result == null)
            {
                return Unauthorized(new { message = "Invalid refresh token" });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token refresh");
            return StatusCode(500, new { message = "An error occurred during token refresh" });
        }
    }

    /// <summary>
    /// Logout (invalidate tokens)
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest request)
    {
        try
        {
            var userId = User.FindFirst("sub")?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            // Revoke refresh token
            if (!string.IsNullOrEmpty(request.RefreshToken))
            {
                await _tokenService.RevokeRefreshTokenAsync(request.RefreshToken);
            }

            // Log logout
            await _auditService.LogAsync(new AuditLog
            {
                Id = UlidGenerator.NewUlid(),
                UserId = userId,
                Action = "LOGOUT",
                Resource = "Auth",
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                UserAgent = Request.Headers["User-Agent"],
                Timestamp = DateTime.UtcNow,
                StatusCode = 200,
                Details = "User logged out"
            });

            return Ok(new { message = "Logged out successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during logout");
            return StatusCode(500, new { message = "An error occurred during logout" });
        }
    }

    /// <summary>
    /// Get current user information
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserInfo), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<UserInfo>> GetCurrentUser()
    {
        try
        {
            var userId = User.FindFirst("sub")?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var user = await _userService.GetUserAsync(userId);
            if (user == null)
            {
                return Unauthorized();
            }

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current user");
            return StatusCode(500, new { message = "An error occurred getting user information" });
        }
    }

    /// <summary>
    /// Update user role (Admin only)
    /// </summary>
    [HttpPut("users/{userId}/role")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateUserRole(
        [FromRoute] string userId, 
        [FromBody] UpdateUserRoleRequest request)
    {
        try
        {
            var success = await _userService.UpdateUserRoleAsync(userId, request.Role);
            if (!success)
            {
                return NotFound(new { message = "User not found" });
            }

            // Log role change
            var adminUserId = User.FindFirst("sub")?.Value;
            await _auditService.LogAsync(new AuditLog
            {
                Id = UlidGenerator.NewUlid(),
                UserId = adminUserId,
                Action = "USER_ROLE_UPDATED",
                Resource = "Auth",
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                UserAgent = Request.Headers["User-Agent"],
                Timestamp = DateTime.UtcNow,
                StatusCode = 200,
                Details = $"Updated user {userId} role to {request.Role}"
            });

            return Ok(new { message = "User role updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user role");
            return StatusCode(500, new { message = "An error occurred updating user role" });
        }
    }
}

/// <summary>
/// Refresh token request model
/// </summary>
public class RefreshTokenRequest
{
    public string RefreshToken { get; set; } = string.Empty;
}

/// <summary>
/// Logout request model
/// </summary>
public class LogoutRequest
{
    public string? RefreshToken { get; set; }
}

/// <summary>
/// Update user role request model
/// </summary>
public class UpdateUserRoleRequest
{
    public string Role { get; set; } = string.Empty;
}