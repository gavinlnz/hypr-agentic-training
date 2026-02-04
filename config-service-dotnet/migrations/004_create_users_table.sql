-- Create users table for OAuth authentication
CREATE TABLE users (
    id VARCHAR(26) PRIMARY KEY,
    email VARCHAR(256) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(512),
    role VARCHAR(50) NOT NULL DEFAULT 'User',
    provider VARCHAR(50) NOT NULL,
    provider_id VARCHAR(256) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(provider, provider_id)
);

-- Create index for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider ON users(provider, provider_id);
CREATE INDEX idx_users_role ON users(role);