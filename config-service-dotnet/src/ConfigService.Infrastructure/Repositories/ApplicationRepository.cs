using ConfigService.Core.Interfaces;
using ConfigService.Core.Models;
using ConfigService.Core.Services;
using ConfigService.Infrastructure.Data;
using Microsoft.Extensions.Logging;
using System.Data;

namespace ConfigService.Infrastructure.Repositories;

/// <summary>
/// PostgreSQL implementation of the Application repository
/// </summary>
public class ApplicationRepository : IApplicationRepository
{
    private readonly DatabaseContext _context;
    private readonly ILogger<ApplicationRepository> _logger;

    public ApplicationRepository(DatabaseContext context, ILogger<ApplicationRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Application> CreateAsync(ApplicationCreate applicationData)
    {
        var id = UlidGenerator.NewUlid();
        var now = DateTime.UtcNow;

        _logger.LogInformation("Creating application: name='{Name}' comments='{Comments}'", 
            applicationData.Name, applicationData.Comments);
        _logger.LogInformation("Generated ULID: {Id}", id);
        _logger.LogInformation("Current time: {Time}", now);

        const string sql = @"
            INSERT INTO applications (id, name, comments, created_at, updated_at)
            VALUES (@Id, @Name, @Comments, @CreatedAt, @UpdatedAt)
            RETURNING id, name, comments, created_at, updated_at";

        var parameters = new
        {
            Id = id,
            Name = applicationData.Name,
            Comments = applicationData.Comments,
            CreatedAt = now,
            UpdatedAt = now
        };

        try
        {
            var result = await _context.QuerySingleOrDefaultAsync(sql, parameters, MapApplication);
            
            if (result == null)
            {
                throw new InvalidOperationException("Failed to create application - no result returned");
            }

            _logger.LogInformation("Application created successfully: {Application}", result);
            return result;
        }
        catch (Exception ex) when (ex.Message.Contains("unique constraint") || ex.Message.Contains("duplicate"))
        {
            _logger.LogError(ex, "Unique constraint violation creating application");
            throw new InvalidOperationException($"Application with name '{applicationData.Name}' already exists", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating application");
            throw;
        }
    }

    public async Task<Application?> GetByIdAsync(string id)
    {
        const string sql = "SELECT id, name, comments, created_at, updated_at FROM applications WHERE id = @Id";
        
        return await _context.QuerySingleOrDefaultAsync(sql, new { Id = id }, MapApplication);
    }

    public async Task<ApplicationWithConfigs?> GetByIdWithConfigsAsync(string id)
    {
        // For now, just return the application without configs since configurations table doesn't exist yet
        const string sql = "SELECT id, name, comments, created_at, updated_at FROM applications WHERE id = @Id";
        
        var application = await _context.QuerySingleOrDefaultAsync(sql, new { Id = id }, MapApplication);
        
        if (application == null)
        {
            return null;
        }

        return new ApplicationWithConfigs
        {
            Id = application.Id,
            Name = application.Name,
            Comments = application.Comments,
            CreatedAt = application.CreatedAt,
            UpdatedAt = application.UpdatedAt,
            ConfigurationIds = new List<string>() // Empty for now
        };
    }

    public async Task<List<Application>> GetAllAsync()
    {
        const string sql = "SELECT id, name, comments, created_at, updated_at FROM applications ORDER BY created_at DESC";
        
        return await _context.QueryAsync(sql, mapper: MapApplication);
    }

    public async Task<Application?> UpdateAsync(string id, ApplicationUpdate applicationData)
    {
        var now = DateTime.UtcNow;

        const string sql = @"
            UPDATE applications 
            SET name = @Name, comments = @Comments, updated_at = @UpdatedAt
            WHERE id = @Id
            RETURNING id, name, comments, created_at, updated_at";

        var parameters = new
        {
            Id = id,
            Name = applicationData.Name,
            Comments = applicationData.Comments,
            UpdatedAt = now
        };

        try
        {
            return await _context.QuerySingleOrDefaultAsync(sql, parameters, MapApplication);
        }
        catch (Exception ex) when (ex.Message.Contains("unique constraint") || ex.Message.Contains("duplicate"))
        {
            _logger.LogError(ex, "Unique constraint violation updating application");
            throw new InvalidOperationException($"Application with name '{applicationData.Name}' already exists", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating application {Id}", id);
            throw;
        }
    }

    public async Task<bool> DeleteAsync(string id)
    {
        const string sql = "DELETE FROM applications WHERE id = @Id";
        
        var rowsAffected = await _context.ExecuteAsync(sql, new { Id = id });
        return rowsAffected > 0;
    }

    public async Task<int> DeleteMultipleAsync(List<string> ids)
    {
        if (!ids.Any())
        {
            return 0;
        }

        // Use a simpler approach with string concatenation for the IN clause
        // This is safe because we validate ULID format before calling this method
        var quotedIds = ids.Select(id => $"'{id}'");
        var sql = $"DELETE FROM applications WHERE id IN ({string.Join(", ", quotedIds)})";
        
        var rowsAffected = await _context.ExecuteAsync(sql);
        _logger.LogInformation("Deleted {Count} applications", rowsAffected);
        
        return rowsAffected;
    }

    public async Task<bool> ExistsAsync(string id)
    {
        const string sql = "SELECT COUNT(1) FROM applications WHERE id = @Id";
        
        var count = await _context.ExecuteScalarAsync<long>(sql, new { Id = id });
        return count > 0;
    }

    public async Task<bool> ExistsByNameAsync(string name, string? excludeId = null)
    {
        var sql = "SELECT COUNT(1) FROM applications WHERE name = @Name";
        object parameters = new { Name = name };

        if (!string.IsNullOrEmpty(excludeId))
        {
            sql += " AND id != @ExcludeId";
            parameters = new { Name = name, ExcludeId = excludeId };
        }

        var count = await _context.ExecuteScalarAsync<long>(sql, parameters);
        return count > 0;
    }

    private static Application MapApplication(IDataReader reader)
    {
        return new Application
        {
            Id = reader["id"].ToString()!,
            Name = reader["name"].ToString()!,
            Comments = reader["comments"] == DBNull.Value ? null : reader["comments"].ToString(),
            CreatedAt = (DateTime)reader["created_at"],
            UpdatedAt = (DateTime)reader["updated_at"]
        };
    }
}