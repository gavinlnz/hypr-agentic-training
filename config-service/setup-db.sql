-- Database setup script for Config Service
-- Run this as a PostgreSQL superuser to create the database and user

-- Create database
CREATE DATABASE config_service;

-- Create user (if not exists)
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'devuser') THEN

      CREATE ROLE devuser LOGIN PASSWORD '1aRm1cipPF77ZbI81MVqRWKn';
   END IF;
END
$do$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE config_service TO devuser;

-- Connect to the database and grant schema privileges
\c config_service;
GRANT ALL ON SCHEMA public TO devuser;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO devuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO devuser;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO devuser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO devuser;