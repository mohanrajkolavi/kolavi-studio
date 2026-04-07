-- Rate limit tables for partner login and application endpoints
-- Run: psql $DATABASE_URL < src/lib/db/migrations/010_partner_rate_limits.sql

CREATE TABLE IF NOT EXISTS partner_login_rate_limit (
  ip_hash VARCHAR(64) PRIMARY KEY,
  request_count INT NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_partner_login_rate_limit_reset_at ON partner_login_rate_limit(reset_at);

CREATE TABLE IF NOT EXISTS partner_apply_rate_limit (
  ip_hash VARCHAR(64) PRIMARY KEY,
  request_count INT NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_partner_apply_rate_limit_reset_at ON partner_apply_rate_limit(reset_at);
