-- Create applications table
CREATE TABLE applications (
    id VARCHAR(26) PRIMARY KEY,  -- ULID format
    name VARCHAR(256) NOT NULL UNIQUE,
    comments VARCHAR(1024),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on name for faster lookups
CREATE INDEX idx_applications_name ON applications(name);