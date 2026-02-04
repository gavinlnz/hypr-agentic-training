namespace ConfigService.Core.Configuration;

/// <summary>
/// OAuth provider configuration
/// </summary>
public class OAuthProviderConfig
{
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string AuthorizeUrl { get; set; } = string.Empty;
    public string TokenUrl { get; set; } = string.Empty;
    public string UserInfoUrl { get; set; } = string.Empty;
    public string IconUrl { get; set; } = string.Empty;
    public List<string> Scopes { get; set; } = new();
    public bool IsEnabled { get; set; } = true;
    public Dictionary<string, string> AdditionalParameters { get; set; } = new();
}

/// <summary>
/// OAuth configuration section
/// </summary>
public class OAuthConfig
{
    public const string SectionName = "OAuth";
    
    public string CallbackBaseUrl { get; set; } = string.Empty;
    public int StateExpirationMinutes { get; set; } = 10;
    public Dictionary<string, OAuthProviderConfig> Providers { get; set; } = new();
}

/// <summary>
/// Predefined OAuth provider configurations
/// </summary>
public static class OAuthProviders
{
    public static readonly OAuthProviderConfig GitHub = new()
    {
        Name = "github",
        DisplayName = "GitHub",
        AuthorizeUrl = "https://github.com/login/oauth/authorize",
        TokenUrl = "https://github.com/login/oauth/access_token",
        UserInfoUrl = "https://api.github.com/user",
        IconUrl = "https://github.com/favicon.ico",
        Scopes = new List<string> { "user:email", "read:user" },
        IsEnabled = true
    };

    public static readonly OAuthProviderConfig Google = new()
    {
        Name = "google",
        DisplayName = "Google",
        AuthorizeUrl = "https://accounts.google.com/o/oauth2/v2/auth",
        TokenUrl = "https://oauth2.googleapis.com/token",
        UserInfoUrl = "https://www.googleapis.com/oauth2/v2/userinfo",
        IconUrl = "https://www.google.com/favicon.ico",
        Scopes = new List<string> { "openid", "email", "profile" },
        IsEnabled = false
    };

    public static readonly OAuthProviderConfig Microsoft = new()
    {
        Name = "microsoft",
        DisplayName = "Microsoft",
        AuthorizeUrl = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
        TokenUrl = "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        UserInfoUrl = "https://graph.microsoft.com/v1.0/me",
        IconUrl = "https://www.microsoft.com/favicon.ico",
        Scopes = new List<string> { "openid", "email", "profile" },
        IsEnabled = false
    };

    public static readonly OAuthProviderConfig Apple = new()
    {
        Name = "apple",
        DisplayName = "Apple",
        AuthorizeUrl = "https://appleid.apple.com/auth/authorize",
        TokenUrl = "https://appleid.apple.com/auth/token",
        UserInfoUrl = "", // Apple doesn't provide a user info endpoint
        IconUrl = "https://www.apple.com/favicon.ico",
        Scopes = new List<string> { "name", "email" },
        IsEnabled = false,
        AdditionalParameters = new Dictionary<string, string>
        {
            { "response_mode", "form_post" }
        }
    };

    public static readonly OAuthProviderConfig Twitter = new()
    {
        Name = "twitter",
        DisplayName = "X (Twitter)",
        AuthorizeUrl = "https://twitter.com/i/oauth2/authorize",
        TokenUrl = "https://api.twitter.com/2/oauth2/token",
        UserInfoUrl = "https://api.twitter.com/2/users/me",
        IconUrl = "https://abs.twimg.com/favicons/twitter.3.ico",
        Scopes = new List<string> { "tweet.read", "users.read" },
        IsEnabled = false,
        AdditionalParameters = new Dictionary<string, string>
        {
            { "code_challenge_method", "S256" }
        }
    };

    public static readonly OAuthProviderConfig Facebook = new()
    {
        Name = "facebook",
        DisplayName = "Facebook",
        AuthorizeUrl = "https://www.facebook.com/v18.0/dialog/oauth",
        TokenUrl = "https://graph.facebook.com/v18.0/oauth/access_token",
        UserInfoUrl = "https://graph.facebook.com/me",
        IconUrl = "https://www.facebook.com/favicon.ico",
        Scopes = new List<string> { "email", "public_profile" },
        IsEnabled = false,
        AdditionalParameters = new Dictionary<string, string>
        {
            { "fields", "id,name,email,picture" }
        }
    };

    /// <summary>
    /// Get all predefined provider configurations
    /// </summary>
    public static Dictionary<string, OAuthProviderConfig> GetAll()
    {
        return new Dictionary<string, OAuthProviderConfig>
        {
            { GitHub.Name, GitHub },
            { Google.Name, Google },
            { Microsoft.Name, Microsoft },
            { Apple.Name, Apple },
            { Twitter.Name, Twitter },
            { Facebook.Name, Facebook }
        };
    }
}