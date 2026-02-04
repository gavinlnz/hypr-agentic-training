using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Npgsql;
using System.Data;

namespace ConfigService.Infrastructure.Data;

/// <summary>
/// Database context for managing PostgreSQL connections
/// </summary>
public class DatabaseContext : IDisposable
{
    private readonly string _connectionString;
    private readonly ILogger<DatabaseContext> _logger;
    private NpgsqlConnection? _connection;

    public DatabaseContext(IConfiguration configuration, ILogger<DatabaseContext> logger)
    {
        _logger = logger;
        
        var host = configuration["Database:Host"] ?? "localhost";
        var port = configuration["Database:Port"] ?? "5432";
        var database = configuration["Database:Name"] ?? "config_service";
        var username = configuration["Database:Username"] ?? "devuser";
        var password = configuration["Database:Password"] ?? "1aRm1cipPF77ZbI81MVqRWKn";

        _connectionString = $"Host={host};Port={port};Database={database};Username={username};Password={password}";
    }

    /// <summary>
    /// Get a database connection
    /// </summary>
    public async Task<NpgsqlConnection> GetConnectionAsync()
    {
        if (_connection == null || _connection.State != ConnectionState.Open)
        {
            _connection?.Dispose();
            _connection = new NpgsqlConnection(_connectionString);
            await _connection.OpenAsync();
            _logger.LogDebug("Database connection opened");
        }

        return _connection;
    }

    /// <summary>
    /// Execute a query and return results
    /// </summary>
    public async Task<List<T>> QueryAsync<T>(string sql, object? parameters = null, Func<IDataReader, T>? mapper = null)
    {
        var connection = await GetConnectionAsync();
        using var command = connection.CreateCommand();
        command.CommandText = sql;

        if (parameters != null)
        {
            AddParameters(command, parameters);
        }

        var results = new List<T>();
        using var reader = await ((NpgsqlCommand)command).ExecuteReaderAsync();
        
        while (await reader.ReadAsync())
        {
            if (mapper != null)
            {
                results.Add(mapper(reader));
            }
        }

        return results;
    }

    /// <summary>
    /// Execute a query and return a single result
    /// </summary>
    public async Task<T?> QuerySingleOrDefaultAsync<T>(string sql, object? parameters = null, Func<IDataReader, T>? mapper = null)
    {
        var results = await QueryAsync(sql, parameters, mapper);
        return results.FirstOrDefault();
    }

    /// <summary>
    /// Execute a non-query command
    /// </summary>
    public async Task<int> ExecuteAsync(string sql, object? parameters = null)
    {
        var connection = await GetConnectionAsync();
        using var command = connection.CreateCommand();
        command.CommandText = sql;

        if (parameters != null)
        {
            AddParameters(command, parameters);
        }

        return await ((NpgsqlCommand)command).ExecuteNonQueryAsync();
    }

    /// <summary>
    /// Execute a scalar command
    /// </summary>
    public async Task<T?> ExecuteScalarAsync<T>(string sql, object? parameters = null)
    {
        var connection = await GetConnectionAsync();
        using var command = connection.CreateCommand();
        command.CommandText = sql;

        if (parameters != null)
        {
            AddParameters(command, parameters);
        }

        var result = await ((NpgsqlCommand)command).ExecuteScalarAsync();
        return result is T ? (T)result : default;
    }

    private static void AddParameters(IDbCommand command, object parameters)
    {
        var properties = parameters.GetType().GetProperties();
        foreach (var property in properties)
        {
            var parameter = command.CreateParameter();
            parameter.ParameterName = $"@{property.Name}";
            parameter.Value = property.GetValue(parameters) ?? DBNull.Value;
            command.Parameters.Add(parameter);
        }
    }

    public void Dispose()
    {
        _connection?.Dispose();
        _logger.LogDebug("Database connection disposed");
    }
}