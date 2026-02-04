-- Create configurations table
CREATE TABLE IF NOT EXISTS configurations (
    id VARCHAR(26) PRIMARY KEY,  -- ULID format
    application_id VARCHAR(26) NOT NULL,
    name VARCHAR(256) NOT NULL,
    comments VARCHAR(1024),
    config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    CONSTRAINT fk_configurations_application 
        FOREIGN KEY (application_id) 
        REFERENCES applications(id) 
        ON DELETE CASCADE,
    
    -- Unique constraint: name must be unique per application
    CONSTRAINT uq_configurations_app_name 
        UNIQUE (application_id, name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_configurations_application_id ON configurations(application_id);
CREATE INDEX IF NOT EXISTS idx_configurations_name ON configurations(name);
CREATE INDEX IF NOT EXISTS idx_configurations_config ON configurations USING GIN(config);