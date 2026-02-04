-- Create OAuth states table for CSRF protection
CREATE TABLE oauth_states (
    id VARCHAR(26) PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    return_url VARCHAR(512),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

-- Create index for faster lookups
CREATE INDEX idx_oauth_states_expires_at ON oauth_states(expires_at);