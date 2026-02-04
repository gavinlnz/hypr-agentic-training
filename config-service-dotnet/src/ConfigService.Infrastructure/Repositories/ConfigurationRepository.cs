using ConfigService.Core.Interfaces;
using ConfigService.Core.Models;
using ConfigService.Core.Services;
using ConfigService.Infrastructure.Data;
using Npgsql;
using System.Data;
using System.Text.Json;

namespace ConfigService.Infrastructure.Repositories;

public class ConfigurationRepository : IConfigurationRepository
{
    private readonly DatabaseContext _context;

    public ConfigurationRepository(DatabaseContext context)
    {
        _context = context;
    }

    public async Task<ConfigurationItem> CreateAsync(ConfigurationCreate configurationData)
    {
        var configurationId = UlidGenerator.NewUlid();
        var now = DateTime.UtcNow;

        const string sql = @"
            INSERT INTO configurations (id, application_id, name, comments, config, created_at, updated_at)
            VALUES (@id, @applicationId, @name, @comments, @config::jsonb, @createdAt, @updatedAt)
            RETURNING id, application_id, name, comments, config, created_at, updated_at";

        var parameters = new
        {
            id = configurationId,
            applicationId = configurationData.ApplicationId,
            name = configurationData.Name,
            comments = configurationData.Comments,
            config = JsonSerializer.Serialize(configurationData.Config),
            createdAt = now,
            updatedAt = now
        };

        var results = await _context.QueryAsync<ConfigurationItem>(sql, parameters, MapConfiguration);
        return results.First();
    }

    public async Task<List<ConfigurationItem>> GetByApplicationIdAsync(string applicationId)
    {
        const string sql = @"
            SELECT id, application_id, name, comments, config, created_at, updated_at
            FROM configurations
            WHERE application_id = @applicationId
            ORDER BY name";

        return await _context.QueryAsync<ConfigurationItem>(sql, new { applicationId }, MapConfiguration);
    }

    public async Task<List<ConfigurationSummary>> GetSummariesByApplicationIdAsync(string applicationId)
    {
        const string sql = @"
            SELECT 
                id, 
                application_id, 
                name, 
                comments, 
                created_at, 
                updated_at,
                jsonb_object_keys(config) as config_keys
            FROM configurations
            WHERE application_id = @applicationId
            ORDER BY name";

        var results = await _context.QueryAsync<ConfigurationSummary>(sql, new { applicationId }, MapConfigurationSummary);
        return results;
    }

    public async Task<ConfigurationItem?> GetByIdAsync(string configurationId)
    {
        const string sql = @"
            SELECT id, application_id, name, comments, config, created_at, updated_at
            FROM configurations
            WHERE id = @configurationId";

        var results = await _context.QueryAsync<ConfigurationItem>(sql, new { configurationId }, MapConfiguration);
        return results.FirstOrDefault();
    }

    public async Task<ConfigurationItem?> GetByApplicationIdAndNameAsync(string applicationId, string name)
    {
        const string sql = @"
            SELECT id, application_id, name, comments, config, created_at, updated_at
            FROM configurations
            WHERE application_id = @applicationId AND name = @name";

        var results = await _context.QueryAsync<ConfigurationItem>(sql, new { applicationId, name }, MapConfiguration);
        return results.FirstOrDefault();
    }

    public async Task<ConfigurationItem?> UpdateAsync(string configurationId, ConfigurationUpdate configurationData)
    {
        var now = DateTime.UtcNow;

        const string sql = @"
            UPDATE configurations
            SET name = @name, comments = @comments, config = @config::jsonb, updated_at = @updatedAt
            WHERE id = @configurationId
            RETURNING id, application_id, name, comments, config, created_at, updated_at";

        var parameters = new
        {
            configurationId,
            name = configurationData.Name,
            comments = configurationData.Comments,
            config = JsonSerializer.Serialize(configurationData.Config),
            updatedAt = now
        };

        var results = await _context.QueryAsync<ConfigurationItem>(sql, parameters, MapConfiguration);
        return results.FirstOrDefault();
    }

    public async Task<bool> DeleteAsync(string configurationId)
    {
        const string sql = "DELETE FROM configurations WHERE id = @configurationId";
        var rowsAffected = await _context.ExecuteAsync(sql, new { configurationId });
        return rowsAffected > 0;
    }

    public async Task<int> DeleteMultipleAsync(List<string> configurationIds)
    {
        if (!configurationIds.Any()) return 0;

        // Validate all IDs are ULIDs
        foreach (var id in configurationIds)
        {
            if (!ConfigurationItem.IsValidUlid(id))
            {
                throw new ArgumentException($"Invalid ULID format: {id}");
            }
        }

        var quotedIds = configurationIds.Select(id => $"'{id}'");
        var sql = $"DELETE FROM configurations WHERE id IN ({string.Join(", ", quotedIds)})";
        
        return await _context.ExecuteAsync(sql);
    }

    public async Task<int> DeleteByApplicationIdAsync(string applicationId)
    {
        const string sql = "DELETE FROM configurations WHERE application_id = @applicationId";
        return await _context.ExecuteAsync(sql, new { applicationId });
    }

    public async Task<bool> ExistsAsync(string configurationId)
    {
        const string sql = "SELECT COUNT(1) FROM configurations WHERE id = @configurationId";
        var count = await _context.ExecuteScalarAsync<long>(sql, new { configurationId });
        return count > 0;
    }

    public async Task<bool> ExistsByApplicationIdAndNameAsync(string applicationId, string name)
    {
        const string sql = "SELECT COUNT(1) FROM configurations WHERE application_id = @applicationId AND name = @name";
        var count = await _context.ExecuteScalarAsync<long>(sql, new { applicationId, name });
        return count > 0;
    }

    public async Task<List<ConfigurationItem>> SearchByNameAsync(string applicationId, string namePattern)
    {
        const string sql = @"
            SELECT id, application_id, name, comments, config, created_at, updated_at
            FROM configurations
            WHERE application_id = @applicationId AND name ILIKE @namePattern
            ORDER BY name";

        var parameters = new { applicationId, namePattern = $"%{namePattern}%" };
        return await _context.QueryAsync<ConfigurationItem>(sql, parameters, MapConfiguration);
    }

    public async Task<int> GetCountByApplicationIdAsync(string applicationId)
    {
        const string sql = "SELECT COUNT(*) FROM configurations WHERE application_id = @applicationId";
        var count = await _context.ExecuteScalarAsync<long>(sql, new { applicationId });
        return (int)count;
    }

    private static ConfigurationItem MapConfiguration(IDataReader reader)
    {
        var configJson = reader["config"].ToString()!;
        var config = JsonSerializer.Deserialize<JsonElement>(configJson);

        return new ConfigurationItem
        {
            Id = reader["id"].ToString()!,
            ApplicationId = reader["application_id"].ToString()!,
            Name = reader["name"].ToString()!,
            Comments = reader["comments"] == DBNull.Value ? null : reader["comments"].ToString(),
            Config = config,
            CreatedAt = Convert.ToDateTime(reader["created_at"]),
            UpdatedAt = Convert.ToDateTime(reader["updated_at"])
        };
    }

    private static ConfigurationSummary MapConfigurationSummary(IDataReader reader)
    {
        // For summary, we'll count the keys in the config JSON
        var configJson = reader["config"].ToString()!;
        var config = JsonSerializer.Deserialize<JsonElement>(configJson);
        var keyCount = config.ValueKind == JsonValueKind.Object ? config.EnumerateObject().Count() : 0;

        return new ConfigurationSummary
        {
            Id = reader["id"].ToString()!,
            ApplicationId = reader["application_id"].ToString()!,
            Name = reader["name"].ToString()!,
            Comments = reader["comments"] == DBNull.Value ? null : reader["comments"].ToString(),
            CreatedAt = Convert.ToDateTime(reader["created_at"]),
            UpdatedAt = Convert.ToDateTime(reader["updated_at"]),
            ConfigKeyCount = keyCount
        };
    }
}