-- Migration 008: Create login_rate_limit table
-- Fixes PostgresError when login-rate-limit.ts queries a non-existent table

CREATE TABLE IF NOT EXISTS login_rate_limit (
  ip_hash VARCHAR(64) PRIMARY KEY,
  attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ
);
