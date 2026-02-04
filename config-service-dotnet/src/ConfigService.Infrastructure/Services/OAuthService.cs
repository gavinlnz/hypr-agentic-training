using ConfigService.Core.Configuration;
using ConfigService.Core.Interfaces;
using ConfigService.Core.Models;
using ConfigService.Core.Services;
using ConfigService.Infrastructure.Data;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Npgsql;
using System.Text;
using System.Text.Json;

namespace ConfigService.Infrastructure.Services;

public class OAuthService : IOAuthService
{
    private readonly DatabaseContext _context;
    private readonly ITokenService _tokenService;
    private readonly IUserService _userService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<OAuthService> _logger;
    private readonly HttpClient _httpClient;
    private readonly OAuthConfig _oauthConfig;

    public OAuthService(
        DatabaseContext context,
        ITokenService tokenService,
        IUserService userService,
        IConfiguration configuration,
        ILogger<OAuthService> logger,
        HttpClient httpClient)
    {
        _context = context;
        _tokenService = tokenService;
        _userService = userService;
        _configuration = configuration;
        _logger = logger;
        _httpClient = httpClient;
        
        _oauthConfig = new OAuthConfig();
        configuration.GetSection(OAuthConfig.SectionName).Bind(_oauthConfig);
        
        _logger.LogDebug("OAuth config loaded: CallbackBaseUrl={CallbackBaseUrl}, Providers={ProviderCount}", 
            _oauthConfig.CallbackBaseUrl, _oauthConfig.Providers.Count);
        
        // Always merge with default providers to get full configuration
        MergeWithDefaultProviders();
    }

    public async Task<List<OAuthProvider>> GetProvidersAsync()
    {
        var providers = new List<OAuthProvider>();

        _logger.LogDebug("Getting OAuth providers, config has {ProviderCount} providers", _oauthConfig.Providers.Count);

        foreach (var (name, config) in _oauthConfig.Providers)
        {
            _logger.LogDebug("Processing provider {Name}: Enabled={Enabled}, ClientId={HasClientId}", 
                name, config.IsEnabled, !string.IsNullOrEmpty(config.ClientId));
                
            if (config.IsEnabled && !string.IsNullOrEmpty(config.ClientId))
            {
                // Get default provider config for display values
                var defaultProvider = OAuthProviders.GetAll().GetValueOrDefault(name);
                
                providers.Add(new OAuthProvider
                {
                    Name = name,
                    DisplayName = defaultProvider?.DisplayName ?? name,
                    AuthorizeUrl = defaultProvider?.AuthorizeUrl ?? "",
                    IconUrl = defaultProvider?.IconUrl ?? "",
                    IsEnabled = config.IsEnabled
                });
            }
        }

        _logger.LogDebug("Returning {ProviderCount} enabled providers", providers.Count);
        return providers;
    }

    public async Task<string> GetAuthorizationUrlAsync(string provider, string? returnUrl = null)
    {
        if (!_oauthConfig.Providers.TryGetValue(provider, out var config))
        {
            throw new ArgumentException($"OAuth provider '{provider}' not found");
        }

        if (!config.IsEnabled)
        {
            throw new ArgumentException($"OAuth provider '{provider}' is not enabled");
        }

        // Generate and store OAuth state for CSRF protection
        var state = await CreateOAuthStateAsync(provider, returnUrl);

        // Build authorization URL
        var callbackUrl = $"{_oauthConfig.CallbackBaseUrl}/auth/callback?provider={Uri.EscapeDataString(provider)}";
        var scopes = string.Join(" ", config.Scopes);

        var authUrl = new StringBuilder(config.AuthorizeUrl);
        authUrl.Append($"?client_id={Uri.EscapeDataString(config.ClientId)}");
        authUrl.Append($"&redirect_uri={Uri.EscapeDataString(callbackUrl)}");
        authUrl.Append($"&scope={Uri.EscapeDataString(scopes)}");
        authUrl.Append($"&state={Uri.EscapeDataString(state)}");
        authUrl.Append("&response_type=code");

        // Add additional parameters for specific providers
        foreach (var (key, value) in config.AdditionalParameters)
        {
            authUrl.Append($"&{Uri.EscapeDataString(key)}={Uri.EscapeDataString(value)}");
        }

        return authUrl.ToString();
    }

    public async Task<LoginResponse?> HandleCallbackAsync(OAuthCallbackRequest request)
    {
        try
        {
            // Validate OAuth state
            if (!string.IsNullOrEmpty(request.State))
            {
                var isValidState = await ValidateOAuthStateAsync(request.State, request.Provider);
                if (!isValidState)
                {
                    _logger.LogWarning("Invalid OAuth state for provider: {Provider}", request.Provider);
                    return null;
                }
            }

            // Exchange authorization code for access token
            var accessToken = await ExchangeCodeForTokenAsync(request.Provider, request.Code);
            if (string.IsNullOrEmpty(accessToken))
            {
                _logger.LogWarning("Failed to exchange code for token for provider: {Provider}", request.Provider);
                return null;
            }

            // Get user profile from OAuth provider
            var profile = await GetUserProfileAsync(request.Provider, accessToken);
            if (profile == null)
            {
                _logger.LogWarning("Failed to get user profile for provider: {Provider}", request.Provider);
                return null;
            }

            // Create or update user
            var user = await CreateOrUpdateUserAsync(request.Provider, profile);

            // Generate JWT tokens
            var token = _tokenService.GenerateAccessToken(user);
            var refreshToken = _tokenService.GenerateRefreshToken();

            // Store refresh token
            await StoreRefreshTokenAsync(user.Id, refreshToken);

            // Update last login time
            await _userService.UpdateLastLoginAsync(user.Id);

            return new LoginResponse
            {
                Token = token,
                RefreshToken = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddHours(1), // 1 hour expiry
                User = user
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling OAuth callback for provider: {Provider}", request.Provider);
            return null;
        }
    }

    public async Task<ExternalUserProfile?> GetUserProfileAsync(string provider, string accessToken)
    {
        if (!_oauthConfig.Providers.TryGetValue(provider, out var config))
        {
            throw new ArgumentException($"OAuth provider '{provider}' not found");
        }

        if (string.IsNullOrEmpty(config.UserInfoUrl))
        {
            throw new ArgumentException($"OAuth provider '{provider}' does not support user info endpoint");
        }

        try
        {
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {accessToken}");
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "ConfigService/1.0");

            var response = await _httpClient.GetAsync(config.UserInfoUrl);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to get user profile from {Provider}: {StatusCode}", provider, response.StatusCode);
                return null;
            }

            var json = await response.Content.ReadAsStringAsync();
            var userData = JsonSerializer.Deserialize<JsonElement>(json);

            return provider.ToLower() switch
            {
                "github" => ParseGitHubProfile(userData),
                "google" => ParseGoogleProfile(userData),
                "microsoft" => ParseMicrosoftProfile(userData),
                "twitter" => ParseTwitterProfile(userData),
                "facebook" => ParseFacebookProfile(userData),
                _ => throw new ArgumentException($"Unsupported OAuth provider: {provider}")
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user profile from {Provider}", provider);
            return null;
        }
    }

    public async Task<UserInfo> CreateOrUpdateUserAsync(string provider, ExternalUserProfile profile)
    {
        return await _userService.GetUserByProviderAsync(provider, profile.ProviderId) 
            ?? await _userService.CreateUserAsync(provider, profile);
    }

    private async Task<string> CreateOAuthStateAsync(string provider, string? returnUrl)
    {
        var stateId = UlidGenerator.NewUlid();
        var expiresAt = DateTime.UtcNow.AddMinutes(_oauthConfig.StateExpirationMinutes);

        const string sql = @"
            INSERT INTO oauth_states (id, provider, return_url, expires_at)
            VALUES (@id, @provider, @returnUrl, @expiresAt)";

        await using var connection = await _context.GetConnectionAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        
        command.Parameters.AddWithValue("@id", stateId);
        command.Parameters.AddWithValue("@provider", provider);
        command.Parameters.AddWithValue("@returnUrl", (object?)returnUrl ?? DBNull.Value);
        command.Parameters.AddWithValue("@expiresAt", expiresAt);

        await command.ExecuteNonQueryAsync();
        return stateId;
    }

    private async Task<bool> ValidateOAuthStateAsync(string stateId, string provider)
    {
        const string sql = @"
            DELETE FROM oauth_states 
            WHERE id = @id AND provider = @provider AND expires_at > @now
            RETURNING id";

        await using var connection = await _context.GetConnectionAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        
        command.Parameters.AddWithValue("@id", stateId);
        command.Parameters.AddWithValue("@provider", provider);
        command.Parameters.AddWithValue("@now", DateTime.UtcNow);

        var result = await command.ExecuteScalarAsync();
        return result != null;
    }

    private async Task<string?> ExchangeCodeForTokenAsync(string provider, string code)
    {
        if (!_oauthConfig.Providers.TryGetValue(provider, out var config))
        {
            return null;
        }

        try
        {
            var callbackUrl = $"{_oauthConfig.CallbackBaseUrl}/auth/callback";
            
            var parameters = new Dictionary<string, string>
            {
                { "client_id", config.ClientId },
                { "client_secret", config.ClientSecret },
                { "code", code },
                { "redirect_uri", callbackUrl },
                { "grant_type", "authorization_code" }
            };

            var content = new FormUrlEncodedContent(parameters);
            
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "ConfigService/1.0");

            var response = await _httpClient.PostAsync(config.TokenUrl, content);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to exchange code for token from {Provider}: {StatusCode}", provider, response.StatusCode);
                return null;
            }

            var json = await response.Content.ReadAsStringAsync();
            var tokenData = JsonSerializer.Deserialize<JsonElement>(json);

            if (tokenData.TryGetProperty("access_token", out var accessTokenElement))
            {
                return accessTokenElement.GetString();
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exchanging code for token from {Provider}", provider);
            return null;
        }
    }

    private async Task StoreRefreshTokenAsync(string userId, string refreshToken)
    {
        var tokenId = UlidGenerator.NewUlid();
        var tokenHash = BCrypt.Net.BCrypt.HashPassword(refreshToken);
        var expiresAt = DateTime.UtcNow.AddDays(30); // 30 days

        const string sql = @"
            INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
            VALUES (@id, @userId, @tokenHash, @expiresAt)";

        await using var connection = await _context.GetConnectionAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        
        command.Parameters.AddWithValue("@id", tokenId);
        command.Parameters.AddWithValue("@userId", userId);
        command.Parameters.AddWithValue("@tokenHash", tokenHash);
        command.Parameters.AddWithValue("@expiresAt", expiresAt);

        await command.ExecuteNonQueryAsync();
    }

    private void MergeWithDefaultProviders()
    {
        var defaultProviders = OAuthProviders.GetAll();
        var userProviders = _oauthConfig.Providers.ToDictionary(kvp => kvp.Key, kvp => kvp.Value);
        
        // Start with default providers and merge user configuration
        _oauthConfig.Providers = new Dictionary<string, OAuthProviderConfig>();
        
        foreach (var (name, defaultProvider) in defaultProviders)
        {
            // Clone the default provider
            var mergedProvider = new OAuthProviderConfig
            {
                Name = defaultProvider.Name,
                DisplayName = defaultProvider.DisplayName,
                AuthorizeUrl = defaultProvider.AuthorizeUrl,
                TokenUrl = defaultProvider.TokenUrl,
                UserInfoUrl = defaultProvider.UserInfoUrl,
                IconUrl = defaultProvider.IconUrl,
                Scopes = new List<string>(defaultProvider.Scopes),
                AdditionalParameters = new Dictionary<string, string>(defaultProvider.AdditionalParameters),
                IsEnabled = defaultProvider.IsEnabled
            };
            
            // Override with user configuration if present
            if (userProviders.TryGetValue(name, out var userProvider))
            {
                if (!string.IsNullOrEmpty(userProvider.ClientId))
                    mergedProvider.ClientId = userProvider.ClientId;
                if (!string.IsNullOrEmpty(userProvider.ClientSecret))
                    mergedProvider.ClientSecret = userProvider.ClientSecret;
                
                // Enable if user provided credentials
                if (!string.IsNullOrEmpty(mergedProvider.ClientId) && !string.IsNullOrEmpty(mergedProvider.ClientSecret))
                {
                    mergedProvider.IsEnabled = true;
                }
                else
                {
                    mergedProvider.IsEnabled = false;
                }
            }
            else
            {
                // No user config, disable by default
                mergedProvider.IsEnabled = false;
            }
            
            _oauthConfig.Providers[name] = mergedProvider;
        }

        // Set callback base URL if not already set
        if (string.IsNullOrEmpty(_oauthConfig.CallbackBaseUrl))
        {
            _oauthConfig.CallbackBaseUrl = "http://localhost:8000";
        }
        
        _logger.LogDebug("Merged OAuth providers: {EnabledCount} enabled out of {TotalCount}", 
            _oauthConfig.Providers.Count(p => p.Value.IsEnabled), _oauthConfig.Providers.Count);
    }

    private static ExternalUserProfile ParseGitHubProfile(JsonElement userData)
    {
        return new ExternalUserProfile
        {
            ProviderId = userData.GetProperty("id").GetInt32().ToString(),
            Email = userData.TryGetProperty("email", out var email) ? email.GetString() ?? "" : "",
            Name = userData.TryGetProperty("name", out var name) ? name.GetString() ?? "" : "",
            Username = userData.TryGetProperty("login", out var login) ? login.GetString() : null,
            AvatarUrl = userData.TryGetProperty("avatar_url", out var avatar) ? avatar.GetString() : null
        };
    }

    private static ExternalUserProfile ParseGoogleProfile(JsonElement userData)
    {
        return new ExternalUserProfile
        {
            ProviderId = userData.GetProperty("id").GetString() ?? "",
            Email = userData.TryGetProperty("email", out var email) ? email.GetString() ?? "" : "",
            Name = userData.TryGetProperty("name", out var name) ? name.GetString() ?? "" : "",
            AvatarUrl = userData.TryGetProperty("picture", out var picture) ? picture.GetString() : null
        };
    }

    private static ExternalUserProfile ParseMicrosoftProfile(JsonElement userData)
    {
        return new ExternalUserProfile
        {
            ProviderId = userData.GetProperty("id").GetString() ?? "",
            Email = userData.TryGetProperty("mail", out var mail) ? mail.GetString() ?? "" : 
                   userData.TryGetProperty("userPrincipalName", out var upn) ? upn.GetString() ?? "" : "",
            Name = userData.TryGetProperty("displayName", out var displayName) ? displayName.GetString() ?? "" : ""
        };
    }

    private static ExternalUserProfile ParseTwitterProfile(JsonElement userData)
    {
        return new ExternalUserProfile
        {
            ProviderId = userData.GetProperty("id").GetString() ?? "",
            Email = userData.TryGetProperty("email", out var email) ? email.GetString() ?? "" : "",
            Name = userData.TryGetProperty("name", out var name) ? name.GetString() ?? "" : "",
            Username = userData.TryGetProperty("username", out var username) ? username.GetString() : null,
            AvatarUrl = userData.TryGetProperty("profile_image_url", out var avatar) ? avatar.GetString() : null
        };
    }

    private static ExternalUserProfile ParseFacebookProfile(JsonElement userData)
    {
        return new ExternalUserProfile
        {
            ProviderId = userData.GetProperty("id").GetString() ?? "",
            Email = userData.TryGetProperty("email", out var email) ? email.GetString() ?? "" : "",
            Name = userData.TryGetProperty("name", out var name) ? name.GetString() ?? "" : "",
            AvatarUrl = userData.TryGetProperty("picture", out var picture) && 
                       picture.TryGetProperty("data", out var data) && 
                       data.TryGetProperty("url", out var url) ? url.GetString() : null
        };
    }
}