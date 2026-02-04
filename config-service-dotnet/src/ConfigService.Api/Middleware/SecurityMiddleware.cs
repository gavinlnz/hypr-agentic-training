using System.Net;

namespace ConfigService.Api.Middleware;

/// <summary>
/// Security middleware for additional protection
/// </summary>
public class SecurityMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<SecurityMiddleware> _logger;
    private readonly IConfiguration _configuration;

    public SecurityMiddleware(RequestDelegate next, ILogger<SecurityMiddleware> logger, IConfiguration configuration)
    {
        _next = next;
        _logger = logger;
        _configuration = configuration;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Add security headers
        AddSecurityHeaders(context);

        // Log suspicious requests
        await LogSuspiciousActivity(context);

        // Validate request size
        if (!ValidateRequestSize(context))
        {
            context.Response.StatusCode = (int)HttpStatusCode.RequestEntityTooLarge;
            await context.Response.WriteAsync("Request too large");
            return;
        }

        // Validate content type for POST/PUT requests
        if (!ValidateContentType(context))
        {
            context.Response.StatusCode = (int)HttpStatusCode.UnsupportedMediaType;
            await context.Response.WriteAsync("Unsupported media type");
            return;
        }

        await _next(context);
    }

    private void AddSecurityHeaders(HttpContext context)
    {
        var response = context.Response;
        
        // Prevent MIME type sniffing
        response.Headers.Add("X-Content-Type-Options", "nosniff");
        
        // Prevent clickjacking
        response.Headers.Add("X-Frame-Options", "DENY");
        
        // XSS protection
        response.Headers.Add("X-XSS-Protection", "1; mode=block");
        
        // Referrer policy
        response.Headers.Add("Referrer-Policy", "strict-origin-when-cross-origin");
        
        // Content Security Policy
        var csp = _configuration["Security:ContentSecurityPolicy"];
        if (!string.IsNullOrEmpty(csp))
        {
            response.Headers.Add("Content-Security-Policy", csp);
        }
        
        // HSTS for HTTPS
        if (context.Request.IsHttps)
        {
            var hstsMaxAge = _configuration.GetValue<int>("Security:HstsMaxAge", 31536000);
            response.Headers.Add("Strict-Transport-Security", $"max-age={hstsMaxAge}; includeSubDomains");
        }
        
        // Remove server header
        response.Headers.Remove("Server");
    }

    private async Task LogSuspiciousActivity(HttpContext context)
    {
        var request = context.Request;
        
        // Log requests with suspicious patterns
        var suspiciousPatterns = new[]
        {
            "script", "javascript:", "vbscript:", "onload=", "onerror=",
            "../", "..\\", "/etc/passwd", "/proc/", "cmd.exe", "powershell"
        };

        var requestPath = request.Path.Value?.ToLowerInvariant() ?? "";
        var queryString = request.QueryString.Value?.ToLowerInvariant() ?? "";
        var userAgent = request.Headers["User-Agent"].ToString().ToLowerInvariant();

        foreach (var pattern in suspiciousPatterns)
        {
            if (requestPath.Contains(pattern) || queryString.Contains(pattern) || userAgent.Contains(pattern))
            {
                _logger.LogWarning("Suspicious request detected: {Method} {Path} from {IP} - Pattern: {Pattern}",
                    request.Method, request.Path, context.Connection.RemoteIpAddress, pattern);
                break;
            }
        }

        // Log requests with unusual characteristics
        if (request.Headers.Count > 50)
        {
            _logger.LogWarning("Request with excessive headers: {Count} headers from {IP}",
                request.Headers.Count, context.Connection.RemoteIpAddress);
        }

        if (request.ContentLength > 10 * 1024 * 1024) // 10MB
        {
            _logger.LogWarning("Large request detected: {Size} bytes from {IP}",
                request.ContentLength, context.Connection.RemoteIpAddress);
        }
    }

    private bool ValidateRequestSize(HttpContext context)
    {
        // Limit request size to 50MB
        const long maxRequestSize = 50 * 1024 * 1024;
        
        if (context.Request.ContentLength.HasValue && context.Request.ContentLength.Value > maxRequestSize)
        {
            _logger.LogWarning("Request size limit exceeded: {Size} bytes from {IP}",
                context.Request.ContentLength.Value, context.Connection.RemoteIpAddress);
            return false;
        }

        return true;
    }

    private bool ValidateContentType(HttpContext context)
    {
        var request = context.Request;
        
        // Only validate POST, PUT, PATCH requests
        if (!HttpMethods.IsPost(request.Method) && 
            !HttpMethods.IsPut(request.Method) && 
            !HttpMethods.IsPatch(request.Method))
        {
            return true;
        }

        var contentType = request.ContentType?.ToLowerInvariant();
        
        // Allow JSON and form data
        var allowedContentTypes = new[]
        {
            "application/json",
            "application/x-www-form-urlencoded",
            "multipart/form-data"
        };

        if (string.IsNullOrEmpty(contentType))
        {
            return false;
        }

        return allowedContentTypes.Any(allowed => contentType.StartsWith(allowed));
    }
}

/// <summary>
/// Extension method to register security middleware
/// </summary>
public static class SecurityMiddlewareExtensions
{
    public static IApplicationBuilder UseSecurityMiddleware(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<SecurityMiddleware>();
    }
}