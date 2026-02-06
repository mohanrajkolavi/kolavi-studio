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
