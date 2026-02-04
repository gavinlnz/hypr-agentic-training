# API Security Implementation

## Overview

The Config Service API has been comprehensively secured with multiple layers of protection including authentication, authorization, rate limiting, security headers, and input validation.

## Security Features Implemented

### 1. Authentication & Authorization

#### JWT Bearer Authentication
- **Implementation**: JWT tokens with configurable expiration (default: 1 hour)
- **Signing**: HMAC-SHA256 with configurable secret key
- **Validation**: Issuer, audience, lifetime, and signing key validation
- **Clock Skew**: Zero tolerance for token timing

#### Authorization Policies
- **Default Policy**: All endpoints require authentication by default
- **Role-Based Access**: Admin and User roles with specific permissions
- **Fallback Policy**: Unauthenticated requests are denied by default

```csharp
// Authorization configuration
builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
    
    options.AddPolicy("AdminOnly", policy =>
        policy.RequireRole("Admin"));
    
    options.AddPolicy("UserOrAdmin", policy =>
        policy.RequireRole("User", "Admin"));
});
```

### 2. Rate Limiting

#### Multi-Tier Rate Limiting
- **Global Limit**: 100 requests per minute per user/IP
- **Authentication Endpoints**: 10 requests per 5 minutes per IP (stricter)
- **API Endpoints**: 1000 requests per minute for authenticated users

#### Rate Limiting Policies
- **AuthPolicy**: Applied to OAuth and authentication endpoints
- **ApiPolicy**: Applied to all application and configuration endpoints
- **Partition Strategy**: By user identity or IP address

### 3. Security Headers

#### Comprehensive Security Headers
- **X-Content-Type-Options**: `nosniff` - Prevents MIME type sniffing
- **X-Frame-Options**: `DENY` - Prevents clickjacking attacks
- **X-XSS-Protection**: `1; mode=block` - Enables XSS filtering
- **Referrer-Policy**: `strict-origin-when-cross-origin` - Controls referrer information
- **Strict-Transport-Security**: HSTS for HTTPS connections (production only)
- **Content-Security-Policy**: Configurable CSP for additional protection

### 4. CORS Configuration

#### Environment-Specific CORS
- **Development**: Allows localhost origins (3000, 3001, 3002)
- **Production**: Configurable allowed origins from appsettings
- **Credentials**: Allowed for authenticated requests
- **Methods/Headers**: All methods and headers allowed

### 5. Input Validation & Security Middleware

#### Custom Security Middleware
- **Request Size Validation**: Maximum 50MB request size
- **Content Type Validation**: Only allows JSON and form data for POST/PUT/PATCH
- **Suspicious Pattern Detection**: Logs requests with potential attack patterns
- **Header Count Validation**: Warns on excessive headers (>50)

#### Attack Pattern Detection
Monitors and logs requests containing:
- Script injection patterns (`script`, `javascript:`, `vbscript:`)
- Path traversal attempts (`../`, `..\\`)
- System file access (`/etc/passwd`, `/proc/`)
- Command execution (`cmd.exe`, `powershell`)

### 6. Endpoint Security

#### Protected Endpoints
All API endpoints require authentication:

**Applications Controller** (`/api/v1/applications`)
- `GET /` - List applications
- `POST /` - Create application
- `GET /{id}` - Get application
- `PUT /{id}` - Update application
- `DELETE /{id}` - Delete application
- `DELETE /` - Bulk delete applications

**Configurations Controller** (`/api/v1/applications/{applicationId}/configurations`)
- `GET /` - List configurations
- `POST /` - Create configuration
- `GET /{configurationId}` - Get configuration
- `PUT /{configurationId}` - Update configuration
- `DELETE /{configurationId}` - Delete configuration
- `DELETE /` - Bulk delete configurations

**Auth Controller** (`/api/v1/auth`)
- `GET /me` - Get current user (authenticated)
- `POST /logout` - Logout (authenticated)
- `PUT /users/{userId}/role` - Update user role (Admin only)

#### Public Endpoints
Limited public endpoints for essential functionality:
- `GET /` - API information
- `GET /health` - Health check
- `GET /api/v1/auth/providers` - OAuth providers
- `GET /api/v1/auth/authorize/{provider}` - OAuth authorization URL
- `GET /api/v1/auth/callback` - OAuth callback
- `POST /api/v1/auth/callback` - OAuth callback (API)
- `POST /api/v1/auth/refresh` - Token refresh

### 7. Error Handling & Logging

#### Security Event Logging
- **Failed Authentication**: OAuth failures, invalid tokens
- **Suspicious Requests**: Attack pattern detection
- **Rate Limit Violations**: Excessive request attempts
- **Authorization Failures**: Unauthorized access attempts

#### Error Response Security
- **No Information Disclosure**: Generic error messages in production
- **Consistent Format**: Standardized error response structure
- **Status Code Accuracy**: Proper HTTP status codes for security events

## Configuration

### Environment Variables
```bash
# JWT Configuration
JWT__KEY=your-secure-jwt-key-minimum-32-characters
JWT__ISSUER=ConfigService
JWT__AUDIENCE=ConfigService
JWT__EXPIRATIONMINUTES=60

# CORS Configuration (Production)
ALLOWEDORIGINS__0=https://your-domain.com
ALLOWEDORIGINS__1=https://admin.your-domain.com

# Security Settings
SECURITY__REQUIREHTTPS=true
SECURITY__ENABLESECURITYHEADERS=true
SECURITY__HSTSMAXAGE=31536000
```

### Production Security Configuration
```json
{
  "AllowedOrigins": [
    "https://your-production-domain.com",
    "https://admin.your-production-domain.com"
  ],
  "Security": {
    "RequireHttps": true,
    "EnableSecurityHeaders": true,
    "HstsMaxAge": 31536000,
    "ContentSecurityPolicy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
  },
  "RateLimiting": {
    "GlobalLimit": { "PermitLimit": 100, "WindowMinutes": 1 },
    "AuthLimit": { "PermitLimit": 10, "WindowMinutes": 5 },
    "ApiLimit": { "PermitLimit": 1000, "WindowMinutes": 1 }
  }
}
```

## Security Testing

### Test Coverage
- **Authentication Tests**: JWT validation, token expiration, invalid tokens
- **Authorization Tests**: Role-based access, unauthorized access attempts
- **Rate Limiting Tests**: Endpoint-specific limits, policy enforcement
- **Input Validation Tests**: Malicious input detection, size limits
- **Security Header Tests**: Proper header configuration

### Security Verification
```bash
# Run security-focused tests
dotnet test --filter Category=Security

# Check for vulnerabilities
dotnet list package --vulnerable

# Verify rate limiting
curl -H "Authorization: Bearer invalid" http://localhost:8000/api/v1/applications
```

## Deployment Security Checklist

### Pre-Deployment
- [ ] Update JWT secret key for production
- [ ] Configure production CORS origins
- [ ] Enable HTTPS enforcement
- [ ] Set up proper logging and monitoring
- [ ] Configure rate limiting for production load
- [ ] Review and test all security headers

### Production Environment
- [ ] Use HTTPS with valid SSL certificates
- [ ] Configure Web Application Firewall (WAF)
- [ ] Set up intrusion detection system
- [ ] Enable comprehensive logging
- [ ] Configure backup and disaster recovery
- [ ] Regular security updates and patches

### Monitoring & Alerting
- [ ] Monitor failed authentication attempts
- [ ] Alert on rate limit violations
- [ ] Track suspicious request patterns
- [ ] Monitor for security header bypass attempts
- [ ] Log and alert on authorization failures

## Security Maintenance

### Regular Tasks
1. **Update Dependencies**: Regular security updates for all packages
2. **Review Logs**: Monitor security events and suspicious activities
3. **Rotate Secrets**: Periodic JWT key rotation
4. **Security Audits**: Regular penetration testing and security reviews
5. **Rate Limit Tuning**: Adjust limits based on usage patterns

### Incident Response
1. **Detection**: Automated monitoring and alerting
2. **Analysis**: Log analysis and threat assessment
3. **Containment**: Rate limiting, IP blocking, service isolation
4. **Recovery**: Service restoration and security patching
5. **Lessons Learned**: Security improvement implementation

## Compliance & Standards

### Security Standards Compliance
- **OWASP Top 10**: Protection against common web vulnerabilities
- **JWT Best Practices**: Secure token handling and validation
- **HTTP Security Headers**: Comprehensive header implementation
- **Rate Limiting**: DoS and abuse prevention
- **Input Validation**: Injection attack prevention

### Data Protection
- **Authentication Data**: Secure OAuth token handling
- **User Information**: Minimal data collection and secure storage
- **Audit Logging**: Comprehensive security event tracking
- **Error Handling**: No sensitive information disclosure

This security implementation provides enterprise-grade protection for the Config Service API while maintaining usability and performance.