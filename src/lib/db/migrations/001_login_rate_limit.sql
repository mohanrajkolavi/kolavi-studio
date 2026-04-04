-- Migration: Create login_rate_limit table
-- Standalone migration for login rate limiting (3 failed attempts = permanent lockout).
-- Safe to re-run: uses IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS login_rate_limit (
  ip_hash VARCHAR(64) PRIMARY KEY,
  attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ
);
