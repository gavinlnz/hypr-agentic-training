using ConfigService.Core.Interfaces;
using ConfigService.Core.Models;
using ConfigService.Core.Services;
using ConfigService.Infrastructure.Data;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace ConfigService.Infrastructure.Services;

public class UserService : IUserService
{
    private readonly DatabaseContext _context;
    private readonly ILogger<UserService> _logger;

    public UserService(DatabaseContext context, ILogger<UserService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<UserInfo?> GetUserAsync(string userId)
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

    public async Task<UserInfo?> GetUserByProviderAsync(string provider, string providerId)
    {
        const string sql = @"
            SELECT id, email, name, avatar_url, role, provider, provider_id, 
                   created_at, last_login_at, is_active
            FROM users 
            WHERE provider = @provider AND provider_id = @providerId AND is_active = true";

        await using var connection = await _context.GetConnectionAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("@provider", provider);
        command.Parameters.AddWithValue("@providerId", providerId);

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

    public async Task<UserInfo> CreateUserAsync(string provider, ExternalUserProfile profile)
    {
        var userId = UlidGenerator.NewUlid();
        var now = DateTime.UtcNow;
        
        // First user becomes admin, others are regular users
        var role = await IsFirstUserAsync() ? "Admin" : "User";

        const string sql = @"
            INSERT INTO users (id, email, name, avatar_url, role, provider, provider_id, created_at, updated_at)
            VALUES (@id, @email, @name, @avatarUrl, @role, @provider, @providerId, @createdAt, @updatedAt)
            RETURNING id, email, name, avatar_url, role, provider, provider_id, created_at, last_login_at";

        await using var connection = await _context.GetConnectionAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        
        command.Parameters.AddWithValue("@id", userId);
        command.Parameters.AddWithValue("@email", profile.Email);
        command.Parameters.AddWithValue("@name", profile.Name);
        command.Parameters.AddWithValue("@avatarUrl", (object?)profile.AvatarUrl ?? DBNull.Value);
        command.Parameters.AddWithValue("@role", role);
        command.Parameters.AddWithValue("@provider", provider);
        command.Parameters.AddWithValue("@providerId", profile.ProviderId);
        command.Parameters.AddWithValue("@createdAt", now);
        command.Parameters.AddWithValue("@updatedAt", now);

        await using var reader = await command.ExecuteReaderAsync();
        await reader.ReadAsync();

        var user = new UserInfo
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

        _logger.LogInformation("Created new user: {UserId} ({Email}) with role: {Role}", userId, profile.Email, role);
        return user;
    }

    public async Task<UserInfo?> UpdateUserAsync(string userId, ExternalUserProfile profile)
    {
        const string sql = @"
            UPDATE users 
            SET name = @name, avatar_url = @avatarUrl, updated_at = @updatedAt
            WHERE id = @userId AND is_active = true
            RETURNING id, email, name, avatar_url, role, provider, provider_id, created_at, last_login_at";

        await using var connection = await _context.GetConnectionAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        
        command.Parameters.AddWithValue("@userId", userId);
        command.Parameters.AddWithValue("@name", profile.Name);
        command.Parameters.AddWithValue("@avatarUrl", (object?)profile.AvatarUrl ?? DBNull.Value);
        command.Parameters.AddWithValue("@updatedAt", DateTime.UtcNow);

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

    public async Task UpdateLastLoginAsync(string userId)
    {
        const string sql = @"
            UPDATE users 
            SET last_login_at = @lastLoginAt 
            WHERE id = @userId";

        await using var connection = await _context.GetConnectionAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        
        command.Parameters.AddWithValue("@userId", userId);
        command.Parameters.AddWithValue("@lastLoginAt", DateTime.UtcNow);

        await command.ExecuteNonQueryAsync();
    }

    public async Task<bool> HasRoleAsync(string userId, string role)
    {
        const string sql = @"
            SELECT role 
            FROM users 
            WHERE id = @userId AND is_active = true";

        await using var connection = await _context.GetConnectionAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("@userId", userId);

        var userRole = await command.ExecuteScalarAsync() as string;
        return string.Equals(userRole, role, StringComparison.OrdinalIgnoreCase);
    }

    public async Task<bool> UpdateUserRoleAsync(string userId, string role)
    {
        const string sql = @"
            UPDATE users 
            SET role = @role, updated_at = @updatedAt 
            WHERE id = @userId AND is_active = true";

        await using var connection = await _context.GetConnectionAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        
        command.Parameters.AddWithValue("@userId", userId);
        command.Parameters.AddWithValue("@role", role);
        command.Parameters.AddWithValue("@updatedAt", DateTime.UtcNow);

        var rowsAffected = await command.ExecuteNonQueryAsync();
        
        if (rowsAffected > 0)
        {
            _logger.LogInformation("Updated user {UserId} role to {Role}", userId, role);
        }
        
        return rowsAffected > 0;
    }

    private async Task<bool> IsFirstUserAsync()
    {
        const string sql = "SELECT COUNT(*) FROM users WHERE is_active = true";

        await using var connection = await _context.GetConnectionAsync();
        await using var command = new NpgsqlCommand(sql, connection);

        var count = (long)(await command.ExecuteScalarAsync() ?? 0L);
        return count == 0;
    }
}