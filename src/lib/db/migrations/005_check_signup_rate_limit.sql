-- Check signup rate limit: prevent enumeration (e.g. 5 requests per minute per IP)
-- Run: psql $DATABASE_URL < src/lib/db/migrations/005_check_signup_rate_limit.sql

CREATE TABLE IF NOT EXISTS check_signup_rate_limit (
  ip_hash VARCHAR(64) PRIMARY KEY,
  request_count INT NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_check_signup_rate_limit_reset_at ON check_signup_rate_limit(reset_at);
