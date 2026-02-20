-- Database schema for Kolavi Studio dashboard
-- Run this in your Vercel Postgres database (via Vercel dashboard SQL editor or psql)

-- Leads table: stores contact form submissions
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  business_type VARCHAR(50),
  message TEXT NOT NULL,
  source VARCHAR(100) DEFAULT 'contact_form',
  status VARCHAR(50) DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- Content maintenance table: tracks blog post maintenance status
CREATE TABLE IF NOT EXISTS content_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_slug VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'unreviewed',
  note TEXT,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for content maintenance
CREATE INDEX IF NOT EXISTS idx_content_maintenance_slug ON content_maintenance(post_slug);
CREATE INDEX IF NOT EXISTS idx_content_maintenance_status ON content_maintenance(status);

-- Login rate limit: 3 failed attempts, permanent lockout until unlock code entered
CREATE TABLE IF NOT EXISTS login_rate_limit (
  ip_hash VARCHAR(64) PRIMARY KEY,
  attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ
);

-- Contact form rate limit: shared across serverless instances (e.g. 5 per minute per IP)
CREATE TABLE IF NOT EXISTS contact_rate_limit (
  ip_hash VARCHAR(64) PRIMARY KEY,
  request_count INT NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contact_rate_limit_reset_at ON contact_rate_limit(reset_at);

-- Check signup rate limit: prevent enumeration (e.g. 5 requests per minute per IP)
CREATE TABLE IF NOT EXISTS check_signup_rate_limit (
  ip_hash VARCHAR(64) PRIMARY KEY,
  request_count INT NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_check_signup_rate_limit_reset_at ON check_signup_rate_limit(reset_at);

-- Pipeline jobs: persist content-writer jobs so retries work across restarts and serverless instances
CREATE TABLE IF NOT EXISTS pipeline_jobs (
  id TEXT PRIMARY KEY,
  phase TEXT NOT NULL,
  input JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  error_message TEXT,
  pipeline_version TEXT NOT NULL,
  chunk_records JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_created_at ON pipeline_jobs(created_at DESC);

-- Blog generation history: last 10 generations for Recent page (Content Writer)
CREATE TABLE IF NOT EXISTS blog_generation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  focus_keyword TEXT,
  title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  outline JSONB NOT NULL DEFAULT '[]',
  content TEXT NOT NULL,
  suggested_slug TEXT,
  suggested_categories JSONB,
  suggested_tags JSONB,
  generation_time_ms INTEGER
);
CREATE INDEX IF NOT EXISTS idx_blog_generation_history_created_at ON blog_generation_history(created_at DESC);

-- Partner Program: Run src/lib/db/migrations/001_partner_program.sql to add:
-- partner_applications, partners, lead_revenue, partner_payouts, admin_action_logs,
-- partner_click_logs, and extend leads with partner_id, referral_code, paid_at, one_time_amount, recurring_amount

-- prompt_versions table removed (Opus Writer System deleted)
