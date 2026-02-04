using ConfigService.Core.Interfaces;
using ConfigService.Core.Models;
using ConfigService.Core.Services;
using ConfigService.Infrastructure.Data;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace ConfigService.Infrastructure.Services;

public class AuditService : IAuditService
{
    private readonly DatabaseContext _context;
    private readonly ILogger<AuditService> _logger;

    public AuditService(DatabaseContext context, ILogger<AuditService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task LogAsync(AuditLog auditLog)
    {
        try
        {
            // Ensure we have an ID
            if (string.IsNullOrEmpty(auditLog.Id))
            {
                auditLog.Id = UlidGenerator.NewUlid();
            }

            // Ensure we have a timestamp
            if (auditLog.Timestamp == default)
            {
                auditLog.Timestamp = DateTime.UtcNow;
            }

            const string sql = @"
                INSERT INTO audit_logs (id, user_id, action, resource, ip_address, user_agent, timestamp, status_code, details)
                VALUES (@id, @userId, @action, @resource, @ipAddress, @userAgent, @timestamp, @statusCode, @details)";

            await using var connection = await _context.GetConnectionAsync();
            await using var command = new NpgsqlCommand(sql, connection);
            
            command.Parameters.AddWithValue("@id", auditLog.Id);
            command.Parameters.AddWithValue("@userId", (object?)auditLog.UserId ?? DBNull.Value);
            command.Parameters.AddWithValue("@action", auditLog.Action);
            command.Parameters.AddWithValue("@resource", auditLog.Resource);
            command.Parameters.AddWithValue("@ipAddress", (object?)auditLog.IpAddress ?? DBNull.Value);
            command.Parameters.AddWithValue("@userAgent", (object?)auditLog.UserAgent ?? DBNull.Value);
            command.Parameters.AddWithValue("@timestamp", auditLog.Timestamp);
            command.Parameters.AddWithValue("@statusCode", auditLog.StatusCode);
            command.Parameters.AddWithValue("@details", (object?)auditLog.Details ?? DBNull.Value);

            await command.ExecuteNonQueryAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to log audit event: {Action} for user: {UserId}", auditLog.Action, auditLog.UserId);
            // Don't throw - audit logging should not break the application
        }
    }

    public async Task<List<AuditLog>> GetUserAuditLogsAsync(string userId, int limit = 100)
    {
        const string sql = @"
            SELECT id, user_id, action, resource, ip_address, user_agent, timestamp, status_code, details
            FROM audit_logs 
            WHERE user_id = @userId 
            ORDER BY timestamp DESC 
            LIMIT @limit";

        await using var connection = await _context.GetConnectionAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        
        command.Parameters.AddWithValue("@userId", userId);
        command.Parameters.AddWithValue("@limit", limit);

        await using var reader = await command.ExecuteReaderAsync();
        
        var logs = new List<AuditLog>();
        while (await reader.ReadAsync())
        {
            logs.Add(new AuditLog
            {
                Id = reader.GetString(0),
                UserId = reader.IsDBNull(1) ? null : reader.GetString(1),
                Action = reader.GetString(2),
                Resource = reader.GetString(3),
                IpAddress = reader.IsDBNull(4) ? null : reader.GetString(4),
                UserAgent = reader.IsDBNull(5) ? null : reader.GetString(5),
                Timestamp = reader.GetDateTime(6),
                StatusCode = reader.GetInt32(7),
                Details = reader.IsDBNull(8) ? null : reader.GetString(8)
            });
        }

        return logs;
    }

    public async Task<List<AuditLog>> GetRecentSecurityEventsAsync(int limit = 100)
    {
        const string sql = @"
            SELECT id, user_id, action, resource, ip_address, user_agent, timestamp, status_code, details
            FROM audit_logs 
            WHERE action IN ('OAUTH_LOGIN_SUCCESS', 'OAUTH_LOGIN_FAILED', 'LOGOUT', 'TOKEN_REFRESH_FAILED', 'USER_ROLE_UPDATED')
            ORDER BY timestamp DESC 
            LIMIT @limit";

        await using var connection = await _context.GetConnectionAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        
        command.Parameters.AddWithValue("@limit", limit);

        await using var reader = await command.ExecuteReaderAsync();
        
        var logs = new List<AuditLog>();
        while (await reader.ReadAsync())
        {
            logs.Add(new AuditLog
            {
                Id = reader.GetString(0),
                UserId = reader.IsDBNull(1) ? null : reader.GetString(1),
                Action = reader.GetString(2),
                Resource = reader.GetString(3),
                IpAddress = reader.IsDBNull(4) ? null : reader.GetString(4),
                UserAgent = reader.IsDBNull(5) ? null : reader.GetString(5),
                Timestamp = reader.GetDateTime(6),
                StatusCode = reader.GetInt32(7),
                Details = reader.IsDBNull(8) ? null : reader.GetString(8)
            });
        }

        return logs;
    }
}