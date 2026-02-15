-- Partner Program Migrations (run in Supabase SQL Editor)
-- Run this entire script after the leads table exists.

-- 001: Partner applications & partners tables
CREATE TABLE IF NOT EXISTS partner_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  audience VARCHAR(100) NOT NULL,
  promotion_method VARCHAR(100) NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_partner_applications_email ON partner_applications(email);
CREATE INDEX IF NOT EXISTS idx_partner_applications_created ON partner_applications(created_at DESC);

CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_user_id UUID UNIQUE,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  commission_one_time_pct DECIMAL(5,2) DEFAULT 15.00,
  commission_recurring_pct DECIMAL(5,2) DEFAULT 10.00,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_partners_code ON partners(code);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);

CREATE TABLE IF NOT EXISTS lead_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id),
  revenue_type VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lead_revenue_lead ON lead_revenue(lead_id);

CREATE TABLE IF NOT EXISTS partner_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id),
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  lead_ids UUID[],
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_partner_payouts_partner ON partner_payouts(partner_id);

CREATE TABLE IF NOT EXISTS admin_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255),
  performed_by VARCHAR(255),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_action_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_entity ON admin_action_logs(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS partner_click_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id),
  referral_code VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_partner_clicks_partner ON partner_click_logs(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_clicks_created ON partner_click_logs(created_at DESC);

ALTER TABLE leads ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES partners(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS one_time_amount DECIMAL(10,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS recurring_amount DECIMAL(10,2);
CREATE INDEX IF NOT EXISTS idx_leads_partner_id ON leads(partner_id);
CREATE INDEX IF NOT EXISTS idx_leads_referral_code ON leads(referral_code);

-- 002: Application status
ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
UPDATE partner_applications pa SET status = 'approved'
WHERE status = 'pending' AND EXISTS (SELECT 1 FROM partners p WHERE p.email = pa.email);
CREATE INDEX IF NOT EXISTS idx_partner_applications_status ON partner_applications(status);

-- 003: Soft delete for partners
ALTER TABLE partners ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_partners_deleted_at ON partners(deleted_at);

-- 005: Check signup rate limit
CREATE TABLE IF NOT EXISTS check_signup_rate_limit (
  ip_hash VARCHAR(64) PRIMARY KEY,
  request_count INT NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_check_signup_rate_limit_reset_at ON check_signup_rate_limit(reset_at);

-- 006: Phone column (required by apply form)
ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
