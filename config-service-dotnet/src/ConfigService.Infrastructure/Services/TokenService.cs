using ConfigService.Core.Interfaces;
using ConfigService.Core.Models;
using ConfigService.Core.Services;
using ConfigService.Infrastructure.Data;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ConfigService.Infrastructure.Services;

public class TokenService : ITokenService
{
    private readonly DatabaseContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<TokenService> _logger;
    private readonly JwtSecurityTokenHandler _tokenHandler;
    private readonly SymmetricSecurityKey _signingKey;
    private readonly string _issuer;
    private readonly string _audience;

    public TokenService(
        DatabaseContext context,
        IConfiguration configuration,
        ILogger<TokenService> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
        _tokenHandler = new JwtSecurityTokenHandler();

        // Get JWT configuration
        var jwtKey = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured");
        _signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        _issuer = _configuration["Jwt:Issuer"] ?? "ConfigService";
        _audience = _configuration["Jwt:Audience"] ?? "ConfigService";
    }

    public string GenerateAccessToken(UserInfo user)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(JwtRegisteredClaimNames.Name, user.Name),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64),
            new(ClaimTypes.Role, user.Role),
            new("provider", user.Provider),
            new("provider_id", user.ProviderId)
        };

        if (!string.IsNullOrEmpty(user.AvatarUrl))
        {
            claims.Add(new Claim("avatar_url", user.AvatarUrl));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(1), // 1 hour expiry
            Issuer = _issuer,
            Audience = _audience,
            SigningCredentials = new SigningCredentials(_signingKey, SecurityAlgorithms.HmacSha256Signature)
        };

        var token = _tokenHandler.CreateToken(tokenDescriptor);
        return _tokenHandler.WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        return UlidGenerator.NewUlid();
    }

    public async Task<UserInfo?> ValidateTokenAsync(string token)
    {
        try
        {
            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = _issuer,
                ValidAudience = _audience,
                IssuerSigningKey = _signingKey,
                ClockSkew = TimeSpan.Zero
            };

            var principal = _tokenHandler.ValidateToken(token, tokenValidationParameters, out var validatedToken);
            
            if (validatedToken is not JwtSecurityToken jwtToken ||
                !jwtToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                return null;
            }

            var userId = principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return null;
            }

            // Get user directly from database to avoid circular dependency
            return await GetUserFromDatabaseAsync(userId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Token validation failed");
            return null;
        }
    }

    public async Task<LoginResponse?> RefreshTokenAsync(string refreshToken)
    {
        try
        {
            // Find and validate refresh token
            const string sql = @"
                SELECT user_id, expires_at, is_revoked
                FROM refresh_tokens 
                WHERE token_hash = @tokenHash AND expires_at > @now AND is_revoked = false";

            await using var connection = await _context.GetConnectionAsync();
            await using var command = new NpgsqlCommand(sql, connection);
            
            var tokenHash = BCrypt.Net.BCrypt.HashPassword(refreshToken);
            command.Parameters.AddWithValue("@tokenHash", tokenHash);
            command.Parameters.AddWithValue("@now", DateTime.UtcNow);

            await using var reader = await command.ExecuteReaderAsync();
            
            if (!await reader.ReadAsync())
            {
                return null;
            }

            var userId = reader.GetString(0);
            var expiresAt = reader.GetDateTime(1);
            var isRevoked = reader.GetBoolean(2);

            if (isRevoked || expiresAt <= DateTime.UtcNow)
            {
                return null;
            }

            // Get user information
            var user = await GetUserFromDatabaseAsync(userId);
            if (user == null)
            {
                return null;
            }

            // Generate new tokens
            var newAccessToken = GenerateAccessToken(user);
            var newRefreshToken = GenerateRefreshToken();

            // Revoke old refresh token and store new one
            await RevokeRefreshTokenAsync(refreshToken);
            await StoreRefreshTokenAsync(userId, newRefreshToken);

            return new LoginResponse
            {
                Token = newAccessToken,
                RefreshToken = newRefreshToken,
                ExpiresAt = DateTime.UtcNow.AddHours(1),
                User = user
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing token");
            return null;
        }
    }

    public async Task<bool> RevokeRefreshTokenAsync(string refreshToken)
    {
        try
        {
            const string sql = @"
                UPDATE refresh_tokens 
                SET is_revoked = true 
                WHERE token_hash = @tokenHash";

            await using var connection = await _context.GetConnectionAsync();
            await using var command = new NpgsqlCommand(sql, connection);
            
            var tokenHash = BCrypt.Net.BCrypt.HashPassword(refreshToken);
            command.Parameters.AddWithValue("@tokenHash", tokenHash);

            var rowsAffected = await command.ExecuteNonQueryAsync();
            return rowsAffected > 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error revoking refresh token");
            return false;
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

    private async Task<UserInfo?> GetUserFromDatabaseAsync(string userId)
    {
        const string sql = @"
            SELECT id, email, name, avatar_url, role, provider, provider_id, 
                   created_at, last_login_at, is_active
            FROM users 
            WHERE id = @userId AND is_active = true";

        await using var connection = await _context.GetConnectionAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("@userId", userId);

        await using var reader = await command.ExecuteReaderAsync();
        
        if (!await reader.ReadAsync())
        {
            return null;
        }

        return new UserInfo
        {
            Id = reader.GetString(0),
            Email = reader.GetString(1),
            Name = reader.GetString(2),
            AvatarUrl = reader.IsDBNull(3) ? null : reader.GetString(3),
            Role = reader.GetString(4),
            Provider = reader.GetString(5),
            ProviderId = reader.GetString(6),
            CreatedAt = reader.GetDateTime(7),
            LastLoginAt = reader.IsDBNull(8) ? DateTime.MinValue : reader.GetDateTime(8)
        };
    }
}